import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/services/repository.js'
const seed=JSON.parse(fs.readFileSync(new URL('../src/data/seed.json',import.meta.url)))
const scenario=JSON.parse(fs.readFileSync(new URL('../public/data/scenario.json',import.meta.url)))
const setup=()=>{const memory=new Map();return {memory,repo:createRepository({storage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},seed,scenarioLoader:async()=>structuredClone(scenario)})}}
test('complete domain uses isolated storage and risk changes regenerate alerts across reload/reset',async()=>{
 const {repo,memory}=setup(),domain=await repo.getDomain()
 assert.equal(domain.rules.length,74);assert.ok(domain.sources.catalog().some(t=>t.id==='spatialCatalog'));assert.ok(domain.sources.catalog().some(t=>t.id==='transfers'))
 const before=await repo.listAlerts();assert.equal(before.length,36)
 await repo.saveConfig('risk','INTRA-17',{...domain.config.get('risk','INTRA-17'),enabled:false})
 assert.ok((await repo.listAlerts()).length<before.length);assert.equal((await repo.listAlerts()).filter(e=>e.ruleId==='INTRA-17').length,0)
 assert.deepEqual([...memory.keys()],['hospital-ui:demo:v1'])
 const reloaded=createRepository({storage:{getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)},seed,scenarioLoader:async()=>structuredClone(scenario)})
 assert.equal((await reloaded.getDomain()).config.get('risk','INTRA-17').enabled,false)
 await reloaded.reset();assert.equal((await reloaded.listAlerts()).length,36)
 const resetDomain=await reloaded.getDomain();await reloaded.saveConfig('risk','INTRA-17',{...resetDomain.config.get('risk','INTRA-17'),threshold:200});assert.equal((await reloaded.listAlerts({ruleId:'INTRA-17'})).length,0)
 await assert.rejects(()=>repo.saveConfig('risk','PRE-02',{enabled:true,recipients:['主刀医师']}),/不支持/)
})
test('metrics preserve thresholds, groups and deterministic values',async()=>{
 const {repo}=setup(),d=await repo.getDomain(),metric=d.metrics[0],c=d.config.get('metric',metric.id)
 assert.equal(d.buildIndicators('all',[],'today').length,d.metrics.length)
 await repo.saveConfig('metric',metric.id,{...c,frequency:5,category:'安全'})
 assert.equal(d.metrics[0].category,'安全')
 await assert.rejects(()=>repo.saveConfig('metric',metric.id,{...c,frequency:0}),/频次/)
})
test('bindings preview validates paths and does not change records; save failure stays atomic',async()=>{
 const {repo,memory}=setup(),d=await repo.getDomain()
 const binding={name:'接口样例',kind:'api',scope:'internal',target:'surgeries',enabled:false,connection:{url:'https://example.test/records',method:'GET',responsePath:'data.records'},mappings:[{external:'caseId',internal:'id',transform:'string',required:true}]}
 assert.deepEqual(d.sources.preview(binding,{data:{records:[{caseId:25}]}}),{records:[{id:'25'}],errors:[]})
 assert.equal(memory.size,0)
 const result=await repo.saveBinding(binding);assert.ok(result.id)
 assert.equal(d.sources.rows('surgeries').length,154)
 assert.throws(()=>d.sources.preview({...binding,mappings:[{...binding.mappings[0],external:'__proto__.x'}]},{}),/外部字段/)
 const bad=createRepository({storage:{getItem:()=>null,setItem:()=>{throw Error('disk')}},seed,scenarioLoader:async()=>structuredClone(scenario)}),b=await bad.getDomain()
 await assert.rejects(()=>bad.saveConfig('risk','INTRA-17',{...b.config.get('risk','INTRA-17'),enabled:false}),/保存失败/)
 assert.equal(b.config.get('risk','INTRA-17').enabled,true)
})
test('failed scenario load can retry and corrupt persisted clinical config is never silently replaced',async()=>{
 let attempts=0;const memory=new Map(),storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)}
 const repo=createRepository({seed,storage,scenarioLoader:async()=>{if(!attempts++)throw Error('offline');return structuredClone(scenario)}})
 await assert.rejects(()=>repo.getDomain(),/offline/)
 assert.equal((await repo.getDomain()).rules.length,74)
 for(const damaged of ['{','[]','{"risk:INTRA-17":{"enabled":true,"recipients":[],"threshold":20}}']){
  const record={version:1,templates:[],reports:[],messages:{},clinical:{'perioperative-config-v1':damaged}}
  memory.set('hospital-ui:demo:v1',JSON.stringify(record))
  const next=createRepository({seed,storage,scenarioLoader:async()=>structuredClone(scenario)})
  await assert.rejects(()=>next.getDomain(),/配置|参数/)
  assert.equal(memory.get('hospital-ui:demo:v1'),JSON.stringify(record))
 }
})
test('manual source collections always read current repository records',async()=>{
 const {repo}=setup(),domain=await repo.getDomain()
 assert.equal(domain.sources.rows('manualTemplates').length,0)
 await repo.saveTemplate({name:'测试模板',phase:'intraop',level:'yellow',recipients:[seed.roles[0]],description:'',enabled:true})
 assert.equal(domain.sources.catalog().find(t=>t.id==='manualTemplates').count,1)
 assert.equal(domain.sources.rows('manualTemplates')[0].name,'测试模板')
 await repo.reset();assert.equal((await repo.getDomain()).sources.rows('manualTemplates').length,0)
})
