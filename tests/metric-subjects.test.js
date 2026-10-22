import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createDomain} from '../src/domain/prototype-engine.js'
import {createMetricSubjects} from '../src/services/metric-subjects.js'
const scenario=JSON.parse(fs.readFileSync(new URL('../public/data/scenario.json',import.meta.url)))
const domain=createDomain({scenario,storage:{getItem:()=>null,setItem(){}},manual:{templates:()=>[],reports:()=>[]}})
const subjects=createMetricSubjects(domain)
const f={start:scenario.meta.date,end:scenario.meta.date,category:'all',entity:'all',unit:'all',shift:'all'}
test('all 34 metrics belong to exactly one of seven subjects',()=>{
 const lists=Object.keys(subjects.subjects).map(k=>subjects.definitions(k))
 assert.deepEqual(lists.map(l=>l.length),[3,15,7,3,2,3,1])
 assert.equal(new Set(lists.flat().map(d=>d.id)).size,34)
 for(const key of Object.keys(subjects.subjects).filter(k=>k!=='team'))for(const d of subjects.definitions(key))assert.ok(Number.isFinite(subjects.value(d.id,f).value),d.id)
})
test('nursing roles exclude inapplicable metrics and entity selection intersects category',()=>{
 assert.equal(subjects.value('nursing-pacu',{...f,category:'巡回护士'}).value,null)
 assert.ok(subjects.value('nursing-pacu',{...f,category:'复苏护士'}).value>0)
 const nurse=subjects.entities('nursing').find(n=>n.category==='巡回护士')
 assert.equal(subjects.selection('nursing',{...f,entity:nurse.id,category:'复苏护士'}).length,0)
 assert.equal(subjects.value('nursing-cases',{...f,start:'2027-01-01',end:'2027-01-01'}).value,null)
})
test('device values use selected instances and dates reproducibly',()=>{
 const entity=subjects.entities('equipment')[0].id
 const a=subjects.value('equipment-use',{...f,entity})
 assert.deepEqual(subjects.value('equipment-use',{...f,entity}),a)
 assert.ok(a.value>=0&&a.value<=100)
 assert.equal(subjects.value('equipment-use',{...f,entity:'missing'}).value,null)
})
