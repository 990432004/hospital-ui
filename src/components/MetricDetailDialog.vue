<script setup>
import {ref,computed,watch} from 'vue'
import {createMetricQuery,trendDates} from '../services/metric-query'
import MetricTrend from './MetricTrend.vue'
const props=defineProps({modelValue:Boolean,definition:Object,domain:Object,base:Object})
const emit=defineEmits(['update:modelValue','configure'])
const dimension=ref('dept'),filter=ref({}),label=ref('当前筛选范围'),page=ref(1)
let query
watch(()=>props.modelValue,opened=>{if(opened){dimension.value='dept';reset();query=createMetricQuery(props.domain,props.base)}})
function reset(){filter.value={};label.value='当前筛选范围';page.value=1}
watch(dimension,reset)
const dates=computed(()=>props.domain?trendDates(props.domain,props.base):[])
const values=computed(()=>dates.value.map(d=>query?.(props.definition.id,d,filter.value).value??null))
const rows=computed(()=>{if(!props.domain||!query)return [];const d=props.domain,f=filter.value;let rows
 if(dimension.value==='dept')rows=f.dept?d.departments[f.dept].map(group=>({label:group,filter:{dept:f.dept,group}})):Object.keys(d.departments).map(dept=>({label:dept,filter:{dept}}))
 else if(dimension.value==='type')rows=f.category?d.surgeryTypes[f.category].map(type=>({label:type,filter:{category:f.category,type}})):Object.keys(d.surgeryTypes).map(category=>({label:category,filter:{category}}))
 else rows=['level1','level2','level3','level4'].map((level,i)=>({label:['一级','二级','三级','四级'][i]+'手术',filter:{level}}))
 return rows.map(row=>({...row,value:query(props.definition.id,'selection',row.filter).value})).filter(row=>row.value!==null)
})
const pages=computed(()=>Math.max(1,Math.ceil(rows.value.length/8)))
function drill(row){filter.value=row.filter;label.value=row.label;page.value=1}
</script>
<template><VDialog :model-value="modelValue" @update:model-value="emit('update:modelValue',$event)" max-width="1050" scrollable><VCard v-if="definition" class="domain-dialog"><div class="dialog-heading"><div><span class="eyebrow">指标趋势详情 · 演示数据</span><h2>{{definition.name}}</h2></div><VBtn icon="tabler-x" color="secondary" variant="text" aria-label="关闭趋势详情" @click="emit('update:modelValue',false)"/></div><VDivider/><VCardText><div class="inline-actions"><h3 class="subheading">{{label}} · 历史变化趋势</h3><VSpacer/><VBtn variant="text" size="small" @click="reset">返回筛选范围</VBtn></div><p class="caption muted mt-2">截止所选日期近30日 · 分类数据继承主页面筛选条件 · 日趋势为确定性模拟值</p><MetricTrend :dates="dates" :values="values" :unit="definition.unit" :title="label"/><VTabs v-model="dimension" color="primary"><VTab value="dept">按科室</VTab><VTab value="type">按术种</VTab><VTab value="level">按手术等级</VTab></VTabs><VTable><thead><tr><th>分类（{{label}}）</th><th>所选时间范围数据</th><th>操作</th></tr></thead><tbody><tr v-for="row in rows.slice((page-1)*8,page*8)" :key="row.label"><td>{{row.label}}</td><td>{{row.value}} {{definition.unit}}</td><td><VBtn variant="text" size="small" @click="drill(row)">查看趋势 / 下钻</VBtn></td></tr><tr v-if="!rows.length"><td colspan="3" class="text-center">当前范围没有匹配数据</td></tr></tbody></VTable><div class="pagination-row"><span>共 {{rows.length}} 项 · {{page}} / {{pages}} 页</span><div><VBtn variant="text" size="small" :disabled="page===1" @click="page--">上一页</VBtn><VBtn variant="text" size="small" :disabled="page>=pages" @click="page++">下一页</VBtn></div></div></VCardText><VDivider/><VCardActions><VSpacer/><VBtn variant="text" color="secondary" @click="emit('update:modelValue',false)">关闭</VBtn><VBtn variant="flat" @click="emit('configure',definition.id)">指标计算规则 ↗</VBtn></VCardActions></VCard></VDialog></template>
