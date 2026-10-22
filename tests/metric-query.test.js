import test from 'node:test'
import assert from 'node:assert/strict'
import {createMetricQuery,trendDates} from '../src/services/metric-query.js'
test('drill downs intersect parent filters and never turn empty groups into zero',()=>{
 const d={departments:{A:['a'],B:['b']},surgeryTypes:{C:['c'],D:['d']},buildIndicators:(dept,groups,time,surgery,levels)=>[{id:'x',value:groups.length+1,groups,surgery,levels}],dateRange:()=>({end:'2026-10-20'}),scenario:{meta:{date:'2026-10-21'}}}
 const base={dept:'all',groups:['a'],time:'today',surgery:{category:'C',subTypes:['c']},levels:{levels:['level1']}}
 const q=createMetricQuery(d,base)
 assert.equal(q('x','selection',{dept:'B'}).value,null)
 assert.equal(q('x','selection',{category:'D'}).value,null)
 assert.equal(q('x','selection',{type:'d'}).value,null)
 assert.equal(q('x','selection',{level:'level2'}).value,null)
 assert.equal(q('x','selection',{group:'b'}).value,null)
 assert.equal(q('x','selection',{dept:'A'}).value,2)
 assert.equal(createMetricQuery(d,{...base,groups:['unknown']})('x','selection',{}).value,null)
 assert.deepEqual([trendDates(d,base)[0],trendDates(d,base).at(-1)],['2026-09-21','2026-10-20'])
})
test('refresh schedule initializes every metric and consumes all due timers once',async()=>{
 const {collectDueMetrics}=await import('../src/services/metric-query.js')
 const metrics=Array.from({length:22},(_,i)=>({id:String(i)})),last=new Map(),frequency=()=>60
 assert.deepEqual(collectDueMetrics(metrics,frequency,last,1000),[])
 assert.deepEqual(collectDueMetrics(metrics,frequency,last,16000),[])
 assert.equal(collectDueMetrics(metrics,frequency,last,3601000).length,22)
 assert.deepEqual(collectDueMetrics(metrics,frequency,last,3616000),[])
})
