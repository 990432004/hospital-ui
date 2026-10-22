// Module and page navigation share one hierarchy in every layout.
export const navigationModules=[
 {id:'alerts',title:'围手术期告警中心',icon:'tabler-shield-check',to:'/alerts',children:[{title:'告警中心',to:'/alerts'},{title:'事件填报',to:'/reporting'},{title:'规则配置',to:'/rules'}]},
 {id:'metrics',title:'国考管理指标监控',icon:'tabler-chart-bar',to:'/metrics',children:[{title:'指标监控',to:'/metrics'},{title:'指标配置',to:'/metrics/config'}]},
 {id:'data',title:'数据源管理',icon:'tabler-database',to:'/data',children:[{title:'数据管理',to:'/data'},{title:'数据源绑定',to:'/data/bindings'}]},
 {id:'gantt',title:'甘特图时序复盘系统',icon:'tabler-timeline',to:'/gantt'},
 {id:'command',title:'实时指挥调度系统',icon:'tabler-building-hospital',to:'/command'},
]
export function navigationContext(path){
 const clean=path.split(/[?#]/)[0].replace(/\/$/,'')||'/'
 for(const module of navigationModules){
  const page=module.children?.filter(p=>clean===p.to||(p.to==='/alerts'&&clean.startsWith('/alerts/'))).sort((a,b)=>b.to.length-a.to.length)[0]
  if(page||(!module.children&&clean===module.to))return {module,page}
 }
 return null
}
