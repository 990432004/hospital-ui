<script setup>
import { computed,ref,watch,nextTick,onMounted,onUnmounted } from 'vue'
import { defaultAppearance } from '../services/appearance'
const props=defineProps({settings:Object,dark:Boolean})
const emit=defineEmits(['update','reset'])
const open=ref(false),closeButton=ref(null),scrollContainer=ref(null)
let previousFocus
const changed=computed(()=>JSON.stringify(props.settings)!==JSON.stringify(defaultAppearance))
const colors=['#7367F0','#0D9394','#FFAB1D','#EB3D63','#2092EC']
const primary=computed(()=>props.settings[props.dark?'darkPrimary':'lightPrimary'])
const assets=import.meta.glob('../assets/customizer/*.svg',{eager:true,import:'default'})
const image=name=>assets[`../assets/customizer/${name}-${props.dark?'dark':'light'}.svg`]
const sections=[
 {key:'theme',title:'主题',items:[{value:'light',label:'亮色',image:'light-theme'},{value:'dark',label:'暗色',image:'dark-theme'},{value:'system',label:'跟随系统',image:'system-theme'}]},
 {key:'skin',title:'外观',items:[{value:'default',label:'默认',image:'default'},{value:'bordered',label:'边框',image:'border'}]},
 {key:'layout',title:'导航布局',items:[{value:'vertical',label:'垂直',image:'default'},{value:'collapsed',label:'折叠',image:'collapsed'},{value:'horizontal',label:'水平',image:'compact'}]},
 {key:'content',title:'内容宽度',items:[{value:'compact',label:'紧凑',image:'compact'},{value:'wide',label:'宽屏',image:'wide'}]},
 {key:'direction',title:'页面方向',items:[{value:'ltr',label:'从左到右',image:'ltr'},{value:'rtl',label:'从右到左',image:'rtl'}]},
]
function update(key,value){emit('update',{...props.settings,[key]:value})}
function setColor(value){update(props.dark?'darkPrimary':'lightPrimary',value)}
watch(open,async value=>{if(value){previousFocus=document.activeElement;await nextTick();if(scrollContainer.value)scrollContainer.value.scrollTop=0;closeButton.value?.$el.focus()}else previousFocus?.focus()})
function escape(event){if(event.key==='Escape'&&open.value)open.value=false}
onMounted(()=>document.addEventListener('keydown',escape));onUnmounted(()=>document.removeEventListener('keydown',escape))
</script>
<template>
<VBtn class="customizer-toggle" icon="tabler-settings" aria-label="打开主题定制" :aria-expanded="open" aria-controls="theme-customizer" @click="open=true"/>
<VNavigationDrawer id="theme-customizer" v-model="open" temporary touchless location="end" :width="400" :scrim="false" class="theme-customizer" role="dialog" aria-label="主题定制" :aria-hidden="!open" :inert="!open">
 <header class="customizer-header"><div><h2>Theme Customizer</h2><p>实时定制与预览</p></div><div class="action-row" style="gap:0"><VBtn icon="tabler-refresh" variant="text" color="secondary" size="small" aria-label="恢复默认外观" @click="emit('reset')"><VBadge v-if="changed" dot color="error" floating/><VIcon icon="tabler-refresh"/></VBtn><VBtn ref="closeButton" icon="tabler-x" variant="text" color="secondary" size="small" aria-label="关闭主题定制" @click="open=false"/></div></header>
 <div ref="scrollContainer" class="customizer-scroll">
 <section class="customizer-section"><VChip color="primary" variant="tonal" size="x-small" label class="mb-5">主题设置</VChip><h3>主色</h3><div class="color-options"><button v-for="color in colors" :key="color" :aria-label="'主色 '+color" :aria-pressed="primary.toUpperCase()===color.toUpperCase()" :class="{selected:primary.toUpperCase()===color.toUpperCase()}" class="color-option" @click="setColor(color)"><span :style="{backgroundColor:color}"/></button><label class="color-option custom-color" :class="{selected:!colors.some(c=>c.toUpperCase()===primary.toUpperCase())}" title="自定义主色"><VIcon icon="tabler-color-picker" size="24"/><input type="color" :value="primary" aria-label="自定义主色" @input="setColor($event.target.value)"></label></div><p class="customizer-hint">当前{{dark?'暗色':'亮色'}}主色 {{primary}}</p>
 <template v-for="section in sections.slice(0,2)" :key="section.key"><h3>{{section.title}}</h3><div class="preview-options" :class="{'two-options':section.items.length===2}"><button v-for="item in section.items" :key="item.value" :aria-label="section.title+'：'+item.label" :aria-pressed="settings[section.key]===item.value" class="preview-option" @click="update(section.key,item.value)"><span class="preview-frame" :class="{selected:settings[section.key]===item.value}"><img :src="image(item.image)" alt=""/></span><span>{{item.label}}</span></button></div></template>
 <div v-if="!dark&&settings.layout!=='horizontal'" class="semi-dark-option"><label for="semi-dark">深色侧边菜单</label><VSwitch id="semi-dark" :model-value="settings.semiDark" aria-label="深色侧边菜单" @update:model-value="update('semiDark',$event)" hide-details density="compact"/></div></section>
 <section class="customizer-section"><VChip color="primary" variant="tonal" size="x-small" label class="mb-5">布局设置</VChip><template v-for="section in sections.slice(2)" :key="section.key"><h3>{{section.title}}</h3><div class="preview-options" :class="{'two-options':section.items.length===2}"><button v-for="item in section.items" :key="item.value" :aria-label="section.title+'：'+item.label" :aria-pressed="settings[section.key]===item.value" class="preview-option" @click="update(section.key,item.value)"><span class="preview-frame" :class="{selected:settings[section.key]===item.value}"><img :src="image(item.image)" alt=""/></span><span>{{item.label}}</span></button></div></template></section>
 </div>
</VNavigationDrawer>
</template>
