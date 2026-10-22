<script setup>
import { ref, provide, inject, onMounted, onUnmounted, computed, watch, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from 'vuetify'
import { primaryPalette } from './services/primary-palette'
import ThemeCustomizer from './components/ThemeCustomizer.vue'
import AppNavigation from './components/AppNavigation.vue'
import {navigationContext} from './services/navigation'
import { readAppearance,saveAppearance,defaultAppearance } from './services/appearance'
const route=useRoute(),theme=useTheme(),repo=inject('repository')
const CommandScene = defineAsyncComponent(() => import('./pages/Command.vue'))
const commandVisible = computed(() => route.path === '/command')
const commandVisited = ref(false)
watch(commandVisible, visible => { if (visible) commandVisited.value = true }, { immediate:true })
const drawer=ref(true),resetOpen=ref(false),error=ref(''),resetting=ref(false),revision=ref(0),toast=ref(''),showToast=ref(false)
const appearance=ref(readAppearance({getItem:key=>localStorage.getItem(key)}))
const primaryRgb=computed(()=>{const color=theme.global.current.value.colors.primary;return [1,3,5].map(i=>parseInt(color.slice(i,i+2),16)).join(',')})
const primarySolidRgb=computed(()=>{const color=theme.global.current.value.colors['primary-solid'];return [1,3,5].map(i=>parseInt(color.slice(i,i+2),16)).join(',')})
const navigation=computed(()=>navigationContext(route.path))
const mode=computed(()=>appearance.value.theme)
const system=matchMedia('(prefers-color-scheme: dark)')
function applyTheme(value){appearance.value={...appearance.value,theme:value}}
function applyAppearance(){
  theme.global.name.value=appearance.value.theme==='system'?(system.matches?'dark':'light'):appearance.value.theme
  for(const name of ['light','dark']){
    Object.assign(theme.themes.value[name].colors,primaryPalette(appearance.value[name+'Primary']))
  }
}
function systemChanged(){if(mode.value==='system')applyAppearance()}
function updateAppearance(value){appearance.value=value}
function resetAppearance(){appearance.value={...defaultAppearance};drawer.value=true;notify('已恢复默认外观')}
function toggleNavigation(){appearance.value={...appearance.value,layout:appearance.value.layout==='collapsed'?'vertical':'collapsed'};drawer.value=true}
watch(appearance,()=>{applyAppearance();try{saveAppearance(localStorage,appearance.value)}catch{notify('外观已更新，但浏览器无法保存设置')}},{deep:true,immediate:true})
onMounted(()=>system.addEventListener('change',systemChanged));onUnmounted(()=>system.removeEventListener('change',systemChanged))
function notify(text){toast.value=text;showToast.value=true}
provide('notify',notify);provide('revision',revision)
async function reset(){resetting.value=true;try{await repo.reset();revision.value++;resetOpen.value=false;error.value='';notify('演示数据已重置')}catch(e){error.value=e.message}finally{resetting.value=false}}
</script>
<template>
<VLocaleProvider :rtl="appearance.direction==='rtl'"><VApp :class="['skin-'+appearance.skin,'layout-'+appearance.layout,'content-'+appearance.content]">
<VNavigationDrawer v-if="appearance.layout!=='horizontal'" v-model="drawer" width="252" :rail="appearance.layout==='collapsed'" expand-on-hover :rail-width="76" :theme="appearance.semiDark?'dark':undefined" :style="{'--v-theme-primary':primaryRgb,'--v-theme-primary-solid':primarySolidRgb,'--v-theme-on-primary':'255,255,255'}" class="side-nav" :permanent="true">
  <RouterLink class="brand" to="/alerts"><span class="brand-mark"><VIcon icon="tabler-heart-rate-monitor" size="30"/></span><span class="brand-copy">浙江省肿瘤医院<small>围手术期管理平台</small></span></RouterLink>
  <AppNavigation/>
  <template #append><div class="nav-bottom"><VChip color="primary" variant="tonal" label>全量演示</VChip><p>质量安全 · 运营协同</p><span>模拟数据 / 本机演示</span></div></template>
</VNavigationDrawer>
<VMain><div class="workspace">
<header class="topbar"><div class="topbar-left"><RouterLink v-if="appearance.layout==='horizontal'" class="horizontal-brand" to="/alerts"><VIcon icon="tabler-heart-rate-monitor"/>浙江省肿瘤医院</RouterLink><VBtn variant="text" color="secondary" icon="tabler-menu-2" aria-label="切换侧栏" @click="toggleNavigation"/><nav class="breadcrumb" aria-label="当前位置"><template v-if="navigation?.module.children"><RouterLink :to="navigation.module.to">{{navigation.module.title}}</RouterLink><VIcon icon="tabler-chevron-right" size="15"/><template v-if="navigation.page?.title!==route.meta.title"><RouterLink :to="navigation.page.to">{{navigation.page.title}}</RouterLink><VIcon icon="tabler-chevron-right" size="15"/></template></template><strong>{{navigation?.module.children?route.meta.title:(navigation?.module.title||route.meta.title)}}</strong></nav></div><div class="topbar-actions"><VChip variant="tonal" color="primary" label>演示环境</VChip><VMenu><template #activator="{props}"><VBtn v-bind="props" variant="text" color="secondary" :icon="theme.global.current.value.dark?'tabler-moon':'tabler-sun'" aria-label="切换主题"/></template><VList aria-label="主题选择"><VListItem v-for="item in [{value:'light',title:'亮色主题'},{value:'dark',title:'暗色主题'},{value:'system',title:'跟随系统'}]" :key="item.value" :title="item.title" :active="mode===item.value" @click="applyTheme(item.value)"/></VList></VMenu><VBtn variant="text" color="secondary" icon="tabler-restore" aria-label="重置演示数据" @click="resetOpen=true"/><VAvatar color="primary" variant="tonal" size="36"><VIcon icon="tabler-user"/></VAvatar></div></header>
<AppNavigation v-if="appearance.layout==='horizontal'" horizontal/><div class="page-content"><CommandScene v-if="commandVisited" v-show="commandVisible"/>
<RouterView v-if="!commandVisible" :key="revision"/></div>
<footer class="page-footer"><span>浙江省肿瘤医院 · 围手术期管理</span><span>模拟数据，不代表实际临床运行状态</span></footer>
</div></VMain>
<VDialog v-model="resetOpen" max-width="460"><VCard title="重置演示数据"><VCardText>将清除本工程的事件模板、填报记录、消息标记、规则及指标运行参数和数据源绑定，并恢复初始模拟数据。原型、组件库和主题选择不受影响。<VAlert v-if="error" type="error" class="mt-4">{{error}}</VAlert></VCardText><VCardActions><VSpacer/><VBtn variant="text" @click="resetOpen=false">取消</VBtn><VBtn color="error" variant="flat" :loading="resetting" @click="reset">确认重置</VBtn></VCardActions></VCard></VDialog>
<ThemeCustomizer :settings="appearance" :dark="theme.global.current.value.dark" @update="updateAppearance" @reset="resetAppearance"/>
<VSnackbar v-model="showToast" :timeout="3500" location="bottom right">{{toast}}<template #actions><VBtn variant="text" @click="showToast=false">关闭</VBtn></template></VSnackbar>
</VApp></VLocaleProvider>
</template>
