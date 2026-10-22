<script setup>
import { ref, provide, onMounted, onUnmounted, computed, watch, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from 'vuetify'
import { primaryPalette } from './services/primary-palette'
import ThemeCustomizer from './components/ThemeCustomizer.vue'
import AppNavigation from './components/AppNavigation.vue'
import { readAppearance,saveAppearance,defaultAppearance } from './services/appearance'
const route=useRoute(),theme=useTheme()
const CommandScene = defineAsyncComponent(() => import('./pages/Command.vue'))
const commandVisible = computed(() => route.path === '/command')
const GanttScene = defineAsyncComponent(() => import('./pages/Gantt.vue'))
const ganttVisible = computed(() => route.path === '/gantt')
const ganttVisited = ref(false)
watch(ganttVisible, visible => { if (visible) ganttVisited.value = true }, { immediate:true })
const commandVisited = ref(false)
watch(commandVisible, visible => { if (visible) commandVisited.value = true }, { immediate:true })
const drawer=ref(true),toast=ref(''),showToast=ref(false)
const appearance=ref(readAppearance({getItem:key=>localStorage.getItem(key)}))
const primaryRgb=computed(()=>{const color=theme.global.current.value.colors.primary;return [1,3,5].map(i=>parseInt(color.slice(i,i+2),16)).join(',')})
const primarySolidRgb=computed(()=>{const color=theme.global.current.value.colors['primary-solid'];return [1,3,5].map(i=>parseInt(color.slice(i,i+2),16)).join(',')})
const mode=computed(()=>appearance.value.theme)
const system=matchMedia('(prefers-color-scheme: dark)')
function applyAppearance(){
  theme.global.name.value=appearance.value.theme==='system'?(system.matches?'dark':'light'):appearance.value.theme
  for(const name of ['light','dark']){
    Object.assign(theme.themes.value[name].colors,primaryPalette(appearance.value[name+'Primary']))
  }
}
function systemChanged(){if(mode.value==='system')applyAppearance()}
function updateAppearance(value){appearance.value=value}
function resetAppearance(){appearance.value={...defaultAppearance};drawer.value=true;notify('已恢复默认外观')}
watch(appearance,()=>{applyAppearance();try{saveAppearance(localStorage,appearance.value)}catch{notify('外观已更新，但浏览器无法保存设置')}},{deep:true,immediate:true})
onMounted(()=>system.addEventListener('change',systemChanged));onUnmounted(()=>system.removeEventListener('change',systemChanged))
function notify(text){toast.value=text;showToast.value=true}
provide('notify',notify)
</script>
<template>
<VLocaleProvider :rtl="appearance.direction==='rtl'"><VApp :class="['skin-'+appearance.skin,'layout-'+appearance.layout,'content-'+appearance.content]">
<VNavigationDrawer v-if="appearance.layout!=='horizontal'" v-model="drawer" width="252" :rail="appearance.layout==='collapsed'" expand-on-hover :rail-width="76" :theme="appearance.semiDark?'dark':undefined" :style="{'--v-theme-primary':primaryRgb,'--v-theme-primary-solid':primarySolidRgb,'--v-theme-on-primary':'255,255,255'}" class="side-nav" :permanent="true">
  <RouterLink class="brand" to="/alerts"><span class="brand-mark"><VIcon icon="tabler-heart-rate-monitor" size="30"/></span><span class="brand-copy">浙江省肿瘤医院<small>围手术期管理平台</small></span></RouterLink>
  <AppNavigation/>
  <template #append><div class="nav-bottom"><VChip color="primary" variant="tonal" label>全量演示</VChip><p>质量安全 · 运营协同</p><span>模拟数据 / 本机演示</span></div></template>
</VNavigationDrawer>
<VMain><div class="workspace">
<AppNavigation v-if="appearance.layout==='horizontal'" horizontal/><div class="page-content"><CommandScene v-if="commandVisited" v-show="commandVisible"/>
<div v-if="ganttVisited" v-show="ganttVisible"><GanttScene/></div>
<RouterView v-if="!commandVisible && !ganttVisible"/></div>
<footer class="page-footer"><span>浙江省肿瘤医院 · 围手术期管理</span><span>模拟数据，不代表实际临床运行状态</span></footer>
</div></VMain>
<ThemeCustomizer :settings="appearance" :dark="theme.global.current.value.dark" @update="updateAppearance" @reset="resetAppearance"/>
<VSnackbar v-model="showToast" :timeout="3500" location="bottom right">{{toast}}<template #actions><VBtn variant="text" @click="showToast=false">关闭</VBtn></template></VSnackbar>
</VApp></VLocaleProvider>
</template>
