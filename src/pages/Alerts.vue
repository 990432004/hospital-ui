<script setup>
import { inject, ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { phases, levels, responses, messages, choices } from '../services/repository'
import StatusChip from '../components/StatusChip.vue'
const repo=inject('repository'),notify=inject('notify'),router=useRouter()
const rows=ref([]),catalog=ref(null),loading=ref(true),error=ref(''),page=ref(1),pageSize=ref(20),caseOpen=ref(false),caseSelected=ref(null)
const fresh=()=>({search:'',level:'all',phase:'all',decisionGoal:'all',responseStatus:'all',messageStatus:'all',dept:'all',time:'all',startDate:'',endDate:''})
const filters=ref({...fresh(),time:'today'})
const allOptions=(obj,label)=>[{value:'all',title:label},...choices(obj)]
const deptOptions=computed(()=>[{value:'all',title:'全部科室'},...[...new Set(catalog.value?.surgeries.map(s=>s.department)||[])].map(d=>({value:d,title:d}))])
const goalOptions=computed(()=>[{value:'all',title:'全部决策目标'},...[...new Set(catalog.value?.rules.map(r=>r.goal)||[])].map(d=>({value:d,title:d}))])
const timeOptions=[{value:'all',title:'全部时间'},{value:'today',title:'当日（场景日）'},{value:'this-week',title:'本周（场景周）'},{value:'this-month',title:'本月（场景月）'},{value:'custom',title:'自定义日期'}]
const filtered=computed(()=>rows.value.filter(e=>{
 const f=filters.value,anchor=catalog.value?.meta.date||'',day=e.triggerTime.slice(0,10)
 if(f.time==='today'&&day!==anchor)return false
 if(f.time==='this-month'&&(day.slice(0,7)!==anchor.slice(0,7)||day>anchor))return false
 if(f.time==='this-week'){const date=new Date(anchor+'T12:00:00+08:00');date.setUTCDate(date.getUTCDate()-((date.getUTCDay()||7)-1));if(day<date.toISOString().slice(0,10)||day>anchor)return false}
 if(f.time==='custom'&&((f.startDate&&day<f.startDate)||(f.endDate&&day>f.endDate)))return false
 return ['level','phase','decisionGoal','responseStatus','messageStatus','dept'].every(k=>f[k]==='all'||e[k]===f[k])&&[e.patientName,e.surgeryNo,e.surgeryName,e.dept,e.group,e.indicator,e.triggerEvidence,e.desc,e.decisionGoal,e.phaseLabel,e.roomName].join(' ').toLowerCase().includes(String(f.search||'').trim().toLowerCase())
}))
const pages=computed(()=>Math.max(1,Math.ceil(filtered.value.length/pageSize.value))),visible=computed(()=>filtered.value.slice((page.value-1)*pageSize.value,page.value*pageSize.value))
watch(filters,()=>page.value=1,{deep:true});watch(pageSize,()=>page.value=1);watch(pages,n=>page.value=Math.min(page.value,n))
const summary=computed(()=>[{label:'待处置告警',value:filtered.value.filter(e=>e.responseStatus!=='resolved').length,caption:'当前筛选范围',icon:'tabler-bell-ringing',color:'primary'},{label:'红色严重告警',value:filtered.value.filter(e=>e.level==='red'&&e.responseStatus!=='resolved').length,caption:'需优先关注',icon:'tabler-shield-exclamation',color:'error'},{label:'未读消息',value:filtered.value.filter(e=>e.messageStatus==='unread').length,caption:'消息状态独立管理',icon:'tabler-mail',color:'warning'},{label:'涉及手术',value:new Set(filtered.value.map(e=>e.surgeryId)).size,caption:'按手术聚合去重',icon:'tabler-heartbeat',color:'info'}])
const cases=computed(()=>{const map=new Map();for(const e of filtered.value){if(e.responseStatus==='resolved')continue;const key=e.triggerTime.slice(0,10)+'|'+e.surgeryId;const c=map.get(key)||{...e,events:[],points:0,explicit:0};c.events.push(e);c.points+=Number(e.riskContribution)||({red:4,orange:2,yellow:1}[e.level]);c.explicit=Math.max(c.explicit,Number(e.riskScore)||0);map.set(key,c)}return [...map.values()].map(c=>({...c,score:Math.max(c.points,c.explicit)})).filter(c=>c.score>=6).sort((a,b)=>b.score-a.score)})
async function load(){loading.value=true;error.value='';try{[rows.value,catalog.value]=await Promise.all([repo.listAlerts(),repo.getCatalog()])}catch(e){error.value=e.message}finally{loading.value=false}}
async function status(id,value){try{await repo.setMessageStatus(id,value);rows.value=await repo.listAlerts();notify('消息状态已更新')}catch(e){error.value=e.message}}
function openCase(c){caseSelected.value=c;caseOpen.value=true}
onMounted(load)
</script>
<template>
<div class="page-heading"><div><h1>围手术期告警中心</h1><p>按患者与手术阶段聚合风险，统一跟踪告警消息与临床处置。</p></div><VBtn to="/reporting" prepend-icon="tabler-plus">事件填报</VBtn></div>
<VAlert v-if="error" type="error" variant="tonal" class="error-block">{{error}}<VBtn variant="text" @click="load">重试</VBtn></VAlert>
<VProgressLinear v-if="loading" indeterminate class="mb-6"/>
<div class="stats-grid"><VCard v-for="s in summary" :key="s.label"><div class="stat-body"><div><div class="stat-label">{{s.label}}</div><div class="stat-number">{{s.value}}</div><div class="stat-caption">{{s.caption}}</div></div><VAvatar :color="s.color" variant="tonal" rounded size="46"><VIcon :icon="s.icon" size="25"/></VAvatar></div></VCard></div>
<div class="stack">
<VCard><div class="section-head"><div><h2>手术风险概览</h2><p>场景日期 {{catalog?.meta.date || '—'}} · 阶段计数为全场景未解除告警</p></div><VChip color="error" variant="tonal" label>{{cases.length}} 位高危患者</VChip></div><VCardText><div class="stage-strip"><button v-for="(label,key) in phases" :key="key" class="stage-button" :class="{active:filters.phase===key}" @click="filters.phase=filters.phase===key?'all':key"><span>{{label}}</span><strong>{{rows.filter(e=>e.phase===key&&e.responseStatus!=='resolved').length}} <small class="muted" style="font-size:var(--font-size-sm);font-weight:400">条未解除</small></strong></button></div><div class="risk-cases" v-if="cases.length"><button v-for="c in cases" :key="c.id" class="case-button" @click="openCase(c)"><span class="score">{{c.score}} 分</span><strong>{{c.patientName}}</strong><small>{{c.surgeryName}}</small><small>{{c.dept}} · {{c.events.length}} 项风险 <VIcon icon="tabler-arrow-up-right" size="14"/></small></button></div><p v-else class="caption muted mt-4">当前筛选范围暂无风险分数达到 6 分的患者。</p></VCardText></VCard>
<VCard>
<div class="section-head"><div><h2>告警记录</h2><p>搜索患者、手术或触发证据，查看完整告警详情。</p></div><VBtn variant="text" color="secondary" prepend-icon="tabler-refresh" @click="filters=fresh()">重置筛选</VBtn></div>
<div class="filters">
<div class="filter-field"><label>时间范围</label><VSelect aria-label="时间范围" v-model="filters.time" :items="timeOptions"/></div>
<div class="filter-field"><label>告警等级</label><VSelect aria-label="告警等级" v-model="filters.level" :items="allOptions(levels,'全部等级')"/></div>
<div class="filter-field"><label>监管阶段</label><VSelect aria-label="监管阶段" v-model="filters.phase" :items="allOptions(phases,'全部阶段')"/></div>
<div class="filter-field"><label>所属科室</label><VSelect aria-label="所属科室" v-model="filters.dept" :items="deptOptions"/></div>
<div class="filter-field"><label>决策目标</label><VSelect aria-label="决策目标" v-model="filters.decisionGoal" :items="goalOptions"/></div>
<div class="filter-field"><label>处置状态</label><VSelect aria-label="处置状态" v-model="filters.responseStatus" :items="allOptions(responses,'全部处置状态')"/></div>
<div class="filter-field"><label>消息状态</label><VSelect aria-label="消息状态" v-model="filters.messageStatus" :items="allOptions(messages,'全部消息状态')"/></div>
<div class="filter-field"><label>每页显示</label><VSelect aria-label="每页显示" v-model="pageSize" :items="[10,20,50]"/></div>
<template v-if="filters.time==='custom'"><div class="filter-field"><label for="start">开始日期</label><VTextField id="start" type="date" v-model="filters.startDate" :max="filters.endDate||undefined"/></div><div class="filter-field"><label for="end">结束日期</label><VTextField id="end" type="date" v-model="filters.endDate" :min="filters.startDate||undefined"/></div></template>
</div><VDivider/>
<div class="toolbar"><VTextField class="toolbar-search" aria-label="搜索告警" v-model="filters.search" placeholder="搜索患者、手术编号或触发证据" prepend-inner-icon="tabler-search" clearable @click:clear="filters.search=''"/><span class="caption muted">共 {{filtered.length}} 条记录</span></div>
<VTable class="table-wrap"><thead><tr><th>患者 / 手术</th><th>告警与触发证据</th><th>等级 / 阶段</th><th>科室 / 医疗组</th><th>处置 / 消息</th><th>触发时间</th><th>操作</th></tr></thead><tbody><tr v-for="e in visible" :key="e.id" :class="{'unread-row':e.messageStatus==='unread'}"><td><RouterLink :to="'/alerts/'+e.id" class="patient-title">{{e.patientName}}</RouterLink><span class="subline">{{e.surgeryName}}</span><span class="subline">{{e.surgeryNo}}</span></td><td class="evidence-text"><strong>{{e.indicator}}</strong><span class="subline">{{e.triggerEvidence || '暂无数值证据'}}</span><span class="subline">{{e.sourceLabel}} · {{e.decisionGoal}}<span v-if="e.desc" class="subline">{{e.desc}}</span></span></td><td class="cell-nowrap"><StatusChip :value="e.level"/><span class="subline">{{e.phaseLabel}}</span></td><td class="cell-nowrap">{{e.dept}}<span class="subline">{{e.roomName}} · {{e.group}}</span></td><td class="cell-nowrap"><StatusChip :value="e.responseStatus" kind="response"/><VMenu><template #activator="{props}"><VBtn v-bind="props" size="small" variant="text" :color="e.messageStatus==='starred'?'warning':'secondary'" append-icon="tabler-chevron-down" :aria-label="'修改消息状态 '+e.patientName" class="d-flex mt-1">{{messages[e.messageStatus]}}</VBtn></template><VList><VListItem v-for="(label,key) in messages" :key="key" :title="label" @click="status(e.id,key)"/></VList></VMenu></td><td class="date-cell">{{e.triggerTime.slice(0,10)}}<span class="subline">{{e.triggerTime.slice(11)}}</span></td><td><VBtn variant="text" size="small" :to="'/alerts/'+e.id" :aria-label="'查看 '+e.patientName+' 告警详情'">详情</VBtn></td></tr></tbody></VTable>
<div v-if="!visible.length&&!loading" class="empty"><VIcon icon="tabler-search" size="36" color="secondary"/><h3>暂无符合条件的告警</h3><p>尝试调整关键词或筛选条件。</p><VBtn variant="tonal" @click="filters=fresh()">清除筛选</VBtn></div>
<div class="pagination-row"><span>显示 {{filtered.length?((page-1)*pageSize+1):0}}–{{Math.min(page*pageSize,filtered.length)}} 条，共 {{filtered.length}} 条</span><VPagination v-model="page" :length="pages" :total-visible="5" rounded="sm" size="small"/></div>
</VCard></div>
<VDialog v-model="caseOpen" max-width="720"><VCard v-if="caseSelected"><div class="section-head"><h2>{{caseSelected.patientName}} · 手术风险</h2><VBtn icon="tabler-x" variant="text" aria-label="关闭患者风险" @click="caseOpen=false"/></div><VCardText><p class="mb-2">{{caseSelected.surgeryName}} · {{caseSelected.dept}} · {{caseSelected.score}} 分</p><p class="caption muted mb-4">{{caseSelected.surgeryNo}} · {{caseSelected.roomName}} · 主刀：{{caseSelected.surgeon}} · {{caseSelected.events.length}} 项关联风险</p><VList><VListItem v-for="e in caseSelected.events" :key="e.id" :title="e.indicator" :subtitle="e.triggerEvidence" :to="'/alerts/'+e.id" @click="caseOpen=false"><template #append><div class="action-row"><StatusChip :value="e.level"/><StatusChip :value="e.responseStatus" kind="response"/></div></template></VListItem></VList></VCardText></VCard></VDialog>
</template>
