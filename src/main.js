import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { zhHans } from 'vuetify/locale'
import 'vuetify/styles'
import './styles/icons.css'
import './styles/app.css'
import { themes } from './plugins/theme'
import defaults from './plugins/defaults'
import { icons } from './plugins/icons'
import seed from './data/seed.json'
import { createRepository } from './services/repository'
import App from './App.vue'
import { primaryPalette } from './services/primary-palette'
import { readAppearance } from './services/appearance'
const routes=[{path:'/',redirect:'/alerts'},{path:'/alerts',component:()=>import('./pages/Alerts.vue'),meta:{title:'告警中心'}},{path:'/alerts/:id',component:()=>import('./pages/AlertDetail.vue'),meta:{title:'告警详情'}},{path:'/reporting',component:()=>import('./pages/Reporting.vue'),meta:{title:'事件填报'}},{path:'/rules',component:()=>import('./pages/Rules.vue'),meta:{title:'规则配置'}},{path:'/metrics',component:()=>import('./pages/Metrics.vue'),meta:{title:'指标监控'}},{path:'/metrics/config',component:()=>import('./pages/Metrics.vue'),meta:{title:'指标配置'}},{path:'/data',component:()=>import('./pages/DataSources.vue'),meta:{title:'数据管理'}},{path:'/data/bindings',component:()=>import('./pages/DataSources.vue'),meta:{title:'数据源绑定'}},{path:'/gantt',component:()=>import('./pages/Gantt.vue'),meta:{title:'甘特图时序复盘'}},{path:'/command',component:{render:()=>null},meta:{title:'实时指挥调度'}},{path:'/:pathMatch(.*)*',redirect:'/alerts'}]
const appearance=readAppearance({getItem:key=>localStorage.getItem(key)})
const dark=appearance.theme==='dark'||(appearance.theme==='system'&&matchMedia('(prefers-color-scheme: dark)').matches)
for(const name of ['light','dark'])Object.assign(themes[name].colors,primaryPalette(appearance[name+'Primary']))
const app=createApp(App)
app.provide('repository',createRepository({storage:{getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v)},seed,scenarioLoader:async()=>{const r=await fetch('/data/scenario.json');if(!r.ok)throw Error('完整场景加载失败，请重试');return r.json()}}))
app.use(createRouter({history:createWebHistory(),routes,scrollBehavior:()=>({top:0})}))
app.use(createVuetify({components,directives,defaults:{...defaults,VCard:{elevation:0},VBtn:{...defaults.VBtn,style:'text-transform:none;letter-spacing:0'}},icons,theme:{defaultTheme:dark?'dark':'light',themes},locale:{locale:'zhHans',messages:{zhHans}}}))
app.mount('#app')
