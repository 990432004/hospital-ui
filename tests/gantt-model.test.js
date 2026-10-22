import {test} from 'node:test'
import assert from 'node:assert/strict'
import {filterGanttSurgeries,createGanttData,shiftScenarioTime,groupJourneyEvents,ganttSummary} from '../src/services/gantt-model.js'
const surgeries=[{id:'OP1',patientName:'张三',department:'胸外科',surgeryLevel:'IV',status:'进行中',priority:'急诊',isEmergency:true,anesthesiaType:'全身麻醉',operatingRoomNo:'3F-01',surgeonName:'陈医生',circulatingNurseName:'李护士',plannedStartTime:'09:00',plannedEndTime:'11:00',actualStartTime:'09:20',plannedDuration:120,startDeviation:20,recoveryBedNo:'PACU-01-01',pacuRoomNo:'PACU-01',plannedRecoveryStartTime:'2026-10-21 11:10',plannedRecoveryEndTime:'2026-10-21 12:10',recoveryStartTime:'2026-10-21 11:30',recoveryProgressEndTime:'2026-10-21 12:00',admissionTime:'2026-10-20 09:00',vitalSigns:[{time:'2026-10-21 09:30:00',spo2:98}]}, {id:'OP2',patientName:'李四',department:'骨科',surgeryLevel:'II',status:'已完成',priority:'普通',anesthesiaType:'神经阻滞',operatingRoomNo:'4F-01',plannedStartTime:'08:00',plannedEndTime:'09:00',plannedDuration:60,startDeviation:0}]
const scenario={meta:{date:'2026-10-21'},surgeries,equipment:[{isCritical:true,type:'腹腔镜',assetNo:'A01'}],equipmentSchedules:[{id:'EQ1',surgeryId:'OP1',equipmentType:'腹腔镜',assetNo:'A01',plannedStartTime:'08:30',plannedEndTime:'11:30',actualStartTime:'08:45'}],pacuBeds:[{fullName:'PACU-01-01'}],timelineEvents:[{id:'T2',surgeryId:'OP1',nodeCode:'T2',category:'麻醉',actualTime:'2026-10-21 09:20',plannedTime:'2026-10-21 09:00'},{id:'P1',surgeryId:'OP1',nodeCode:'P1',category:'术前',actualTime:'2026-10-20 09:00'}],safetyChecks:[{id:'C1',surgeryId:'OP1',result:'未通过',checkTime:'2026-10-21 09:00',checkName:'安全核查'}],adverseEvents:[{id:'A1',surgeryId:'OP2',occurrenceTime:'2026-10-21 08:50',eventType:'异常'}]}
test('六组筛选按组内OR、组间AND组合且楼层不受房间编号后缀影响',()=>{assert.deepEqual(filterGanttSurgeries(surgeries,{departments:['胸外科'],levels:['II','IV'],statuses:['进行中'],priorities:['急诊'],anesthesiaTypes:['全身麻醉'],floors:['3']}).map(s=>s.id),['OP1']);assert.equal(filterGanttSurgeries(surgeries,{floors:['5']}).length,0);assert.equal(filterGanttSurgeries(surgeries,{}).length,2)})
test('日期复盘平移全程日期并保留跨日间隔，不修改原始场景',()=>{assert.equal(shiftScenarioTime('2026-10-20 09:00','2026-10-21','2026-10-23'),'2026-10-22 09:00');assert.equal(shiftScenarioTime('09:00','2026-10-21','2026-10-23'),'09:00');const {rows,timelineEvents,markers}=createGanttData(scenario,[surgeries[0]],'patient','2026-10-23');assert.equal(rows[0].admissionTime,'2026-10-22 09:00');assert.equal(rows[0]._raw.admissionTime,'2026-10-22 09:00');assert.equal(rows[0]._raw.vitalSigns[0].time,'2026-10-23 09:30:00');assert.equal(timelineEvents[0].actualTime,'2026-10-23 09:20');assert.equal(markers.length,1);assert.equal(surgeries[0].admissionTime,'2026-10-20 09:00')})
test('设备视图使用单台设备排程而非手术时段，并关联原手术详情和时序节点',()=>{const data=createGanttData(scenario,[surgeries[0]],'equipment','2026-10-21');assert.equal(data.rows[0].id,'EQ1');assert.equal(data.rows[0].sourceSurgeryId,'OP1');assert.equal(data.rows[0].planStart,'08:30');assert.equal(data.rows[0].equipment,'腹腔镜 · A01');assert.equal(data.rows[0]._raw.id,'OP1');assert.deepEqual(data.groupCatalog,['腹腔镜 · A01'])})
test('PACU视图展示完整床位目录与复苏时段，过滤后空床不消失',()=>{const data=createGanttData(scenario,[surgeries[0]],'pacu','2026-10-21');assert.deepEqual(data.groupCatalog,['PACU-01-01']);assert.equal(data.rows[0].planStart,'2026-10-21 11:10');assert.equal(data.rows[0].actualEnd,null);assert.equal(data.rows[0].actualProgressEnd,'2026-10-21 12:00');assert.equal(data.rows[0].status,'in-progress');assert.equal(createGanttData(scenario,[],'pacu','2026-10-21').groupCatalog.length,1)})
test('详情按节点流程排序且保留尚未发生节点',()=>{const events=groupJourneyEvents([...scenario.timelineEvents,{surgeryId:'OP1',nodeCode:'T1',category:'入室',actualTime:null}], 'OP1');assert.deepEqual(events.map(g=>g.category),['术前','入室','麻醉']);assert.equal(events[1].events[0].actualTime,null)})
test('统计保持筛选口径并使用实际手术间目录作容量分母',()=>{const stats=ganttSummary(surgeries,2);assert.equal(stats.total,2);assert.equal(stats.emergency,1);assert.equal(stats.avgDelay,10);assert.equal(stats.utilization,10)})
test('定位无设备排程手术时清除旧高亮，仍返回同ID详情并平移日期',async()=>{
 const {selectGanttSurgery}=await import('../src/services/gantt-model.js')
 const data=createGanttData(scenario,surgeries,'equipment','2026-10-20'),engine={data:data.rows,selected:null,deselect(){this.selected=null},selectSurgery(id){this.selected=this.data.find(r=>r.id===id)},scrollToSurgery(){}}
 const context={scenario,surgeries,date:'2026-10-20'}
 assert.equal(selectGanttSurgery(engine,context,'OP1').id,'OP1');assert.equal(engine.selected.id,'EQ1')
 assert.equal(selectGanttSurgery(engine,context,'OP2').id,'OP2');assert.equal(engine.selected,null)
 assert.equal(selectGanttSurgery(engine,{...context,surgeries:[surgeries[0]]},'OP2'),null)
})

test('进行中实际条使用场景快照而非伪造结束时间；PACU保留完整日期',()=>{
 const source={...scenario,meta:{date:'2026-10-21',asOf:'2026-10-21 14:00:00'}};
 for(const view of ['room','doctor','nurse','equipment']){
  const row=createGanttData(source,[surgeries[0]],view,'2026-10-23').rows[0];
  assert.equal(row.actualEnd,null);assert.equal(row.actualProgressEnd,'2026-10-23 14:00:00');
 }
 const surgery={...surgeries[0],plannedRecoveryStartTime:'2026-10-21 23:30',plannedRecoveryEndTime:'2026-10-22 01:00',recoveryStartTime:'2026-10-21 23:45',recoveryEndTime:'2026-10-22 00:40'};
 const row=createGanttData(source,[surgery],'pacu','2026-10-23').rows[0];
 assert.equal(row.planStart,'2026-10-23 23:30');assert.equal(row.planEnd,'2026-10-24 01:00');assert.equal(row.actualEnd,'2026-10-24 00:40');assert.equal(row.actualProgressEnd,null);
})
