import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {filterGanttSurgeries,createGanttData} from '../src/services/gantt-model.js'
import {buildSceneContext} from '../src/services/gantt-scene.js'
const scenario=JSON.parse(readFileSync(new URL('../public/data/scenario.json',import.meta.url)))
const seed=JSON.parse(readFileSync(new URL('../src/data/seed.json',import.meta.url)))
test('every clinical endpoint resolves to the E3 room and its exact scene/building/floor ancestry',()=>{
 assert.ok(scenario.spatialCatalog,'missing E3 spatial catalog')
 const rooms=new Map(scenario.spatialCatalog.rooms.map(r=>[r.roomCode,r]))
 assert.equal(new Set(rooms.keys()).size,scenario.spatialCatalog.rooms.length)
 for(const s of scenario.surgeries){
  for(const role of ['ward','operatingRoom','pacu']){
   const p=s.locations[role],room=rooms.get(p.roomCode)
   assert.ok(room,`${s.id}: missing ${role}`)
   for(const k of ['projectId','sceneId','buildingId','floorId','roomId'])assert.equal(p[k],room[k])
  }
  assert.equal(s.operatingRoomNo,s.locations.operatingRoom.roomCode)
  assert.equal(s.pacuRoomNo,s.locations.pacu.roomCode)
  assert.equal(s.locations.operatingRoom.floorId,s.locations.pacu.floorId)
  assert.equal(s.wardRoomCode,scenario.patients.find(p=>p.id===s.patientId).wardRoomCode)
  assert.equal(seed.surgeries.find(p=>p.id===s.id).operatingRoomNo,s.operatingRoomNo)
 }
 for(const e of scenario.timelineEvents)assert.ok(rooms.has(e.location.roomCode),e.id)
 for(const e of scenario.equipmentSchedules)assert.equal(e.operatingRoomNo,scenario.surgeries.find(s=>s.id===e.surgeryId).operatingRoomNo)
})
test('transfer endpoints, chronology and actual node completion agree with the snapshot',()=>{
 assert.ok(scenario.transfers?.length,'missing transfer records')
 const asOf=Date.parse(scenario.meta.asOf)
 for(const s of scenario.surgeries){
  const nodes=new Map(scenario.timelineEvents.filter(e=>e.surgeryId===s.id).map(e=>[e.nodeCode,e]))
  for(const field of ['plannedTime','actualTime']){
   const values=['P1','P7','T16','T1','T2','T3','T6','T7','T8','T17','T18'].map(c=>nodes.get(c)[field]).filter(Boolean)
   assert.deepEqual(values,[...values].sort(),`${s.id}: ${field} chronology`)
  }
  assert.equal(nodes.get('T17').actualTime,s.recoveryStartTime)
  assert.equal(nodes.get('T18').actualTime,s.recoveryEndTime)
  for(const node of nodes.values())if(node.actualTime)assert.ok(Date.parse(node.actualTime.replace(' ','T')+'+08:00')<=asOf)
  for(const t of scenario.transfers.filter(t=>t.surgeryId===s.id)){
   assert.ok(Date.parse(t.plannedEndTime)>Date.parse(t.plannedStartTime))
   assert.equal(t.ward,t.from.roomCode);assert.equal(t.operatingRoom,t.to.roomCode)
   if(t.actualEndTime)assert.ok(t.actualStartTime&&Date.parse(t.actualEndTime)>Date.parse(t.actualStartTime))
  }
 }
})
test('floor filter understands E3 room codes and explicit floor metadata',()=>{
 const rows=[{id:'a',operatingRoomNo:'B2-2F-R16',operatingFloor:'2'},{id:'b',operatingRoomNo:'B2-3F-R16',operatingFloor:'3'}]
 assert.deepEqual(filterGanttSurgeries(rows,{floors:['2']}).map(s=>s.id),['a'])
})
test('scene context carries room identities and replay-shifted transfer endpoints',()=>{
 const s=scenario.surgeries[0]
 assert.ok(s.locations,'missing surgery locations')
 const row=createGanttData(scenario,[s],'patient','2026-10-23').rows[0]._raw
 const ctx=buildSceneContext({date:'2026-10-23',view:'patient',time:'08:00',surgery:row})
 assert.equal(ctx.locations.operatingRoom.roomCode,s.operatingRoomNo)
 assert.equal(ctx.sceneId,20260722000111)
 assert.ok(ctx.transfers[0].plannedStartTime.startsWith('2026-10-23'))
 assert.equal(ctx.transfers[0].from.roomCode,s.wardRoomCode)
})

test('cleaner repairs the original contradictory journey and is repeat-safe',async()=>{
 const {alignScenario}=await import('../scripts/align-e3-scenario.cjs')
 const original=JSON.parse(readFileSync(new URL('./fixtures/e3-source-surgeries.json',import.meta.url)))
 const aligned=alignScenario(original),s=aligned.surgeries[0]
 assert.equal(s.operatingRoomNo,'B2-2F-R16')
 assert.equal(s.locations.operatingRoom.roomId,20260724003782)
 assert.equal(s.plannedStartTime,'07:30')
 assert.equal(s.actualEndTime,'08:15')
 assert.equal(s.transferOutTime,'2026-10-21 08:30:00')
 assert.equal(s.recoveryStartTime,'2026-10-21 08:35:00')
 assert.equal(aligned.timelineEvents.find(e=>e.surgeryId===s.id&&e.nodeCode==='T17').actualTime,s.recoveryStartTime)
 const before=JSON.stringify(aligned)
 assert.equal(JSON.stringify(alignScenario(aligned)),before)
})
test('no PACU bed is reserved by overlapping surgery intervals',()=>{
 for(const bed of scenario.pacuBeds){
  const rows=scenario.surgeries.filter(s=>s.recoveryBedNo===bed.fullName)
  for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
   for(const [start,end] of [['plannedRecoveryStartTime','plannedRecoveryEndTime'],['recoveryStartTime','recoveryEndTime']]){
    const a=rows[i],b=rows[j];if(!a[start]||!b[start])continue
    const aEnd=a[end]||scenario.meta.asOf.replace('T',' ').slice(0,19),bEnd=b[end]||scenario.meta.asOf.replace('T',' ').slice(0,19)
    assert.ok(aEnd<=b[start]||bEnd<=a[start],`${bed.fullName}: ${a.id}/${b.id}`)
   }
  }
 }
})
test('outgoing handover occurs at operating-room exit, before recovery arrival',()=>{
 const s=scenario.surgeries[0],handover=scenario.handovers.find(h=>h.surgeryId===s.id&&h.handoverType==='出室交接')
 assert.equal(handover.handoverTime,s.transferOutTime)
 assert.ok(handover.handoverTime<s.recoveryStartTime)
})
test('active transfer replay starts at actual departure and labels arrival as estimated',()=>{
 const active=scenario.transfers.filter(t=>t.status==='in-progress')
 assert.ok(active.length)
 for(const t of active){
  assert.equal(t.startTime,t.actualStartTime)
  assert.equal(t.actualEndTime,null)
  assert.equal(t.timeBasis,'actual-start-estimated-end')
  assert.equal(t.endTime,t.estimatedEndTime)
  assert.ok(Date.parse(t.endTime)>Date.parse(scenario.meta.asOf))
 }
 const s=scenario.surgeries.find(s=>s.transfers.some(t=>t.status==='in-progress'))
 const shifted=createGanttData(scenario,[s],'patient','2026-10-23').rows[0]._raw.transfers.find(t=>t.status==='in-progress')
 assert.ok(shifted.estimatedEndTime.startsWith('2026-10-23'))
})
