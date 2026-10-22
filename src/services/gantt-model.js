// Adapts the original deterministic scenario without mutating its shared records.
export const GANTT_VIEWS=[{value:'patient',title:'患者'},{value:'room',title:'手术间'},{value:'doctor',title:'医生'},{value:'nurse',title:'护士'},{value:'equipment',title:'设备'},{value:'pacu',title:'复苏室'}]
export const LEVEL_COLORS={I:'#2e7d32',II:'#1976d2',III:'#b26a00',IV:'#d32f2f'}
const dateFields=['admissionTime','transferInTime','transferOutTime','plannedRecoveryStartTime','plannedRecoveryEndTime','recoveryStartTime','recoveryEndTime','recoveryProgressEndTime']
const pad=n=>String(n).padStart(2,'0')
export function shiftScenarioTime(value,sourceDate,targetDate){
 if(!value||!/^\d{4}-\d{2}-\d{2}[ T]/.test(value)||!sourceDate||!targetDate||sourceDate===targetDate)return value
 const date=new Date(value.replace(' ','T')),delta=new Date(targetDate+'T12:00:00')-new Date(sourceDate+'T12:00:00')
 if(!Number.isFinite(date.getTime())||!Number.isFinite(delta))return value
 date.setTime(date.getTime()+delta)
 return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}${/:\d\d:\d\d$/.test(value)?':'+pad(date.getSeconds()):''}`
}
export function filterGanttSurgeries(surgeries,filters={}){
 const fields={departments:'department',levels:'surgeryLevel',statuses:'status',priorities:'priority',anesthesiaTypes:'anesthesiaType'}
 return surgeries.filter(s=>Object.entries(fields).every(([key,field])=>!filters[key]?.length||filters[key].includes(s[field]))&&(!filters.floors?.length||filters.floors.includes(String(s.operatingRoomNo||'').match(/^(\d+)F/i)?.[1])))
}
export function createGanttData(scenario,surgeries,view,date){
 const shift=value=>shiftScenarioTime(value,scenario.meta?.date,date),visible=new Set(surgeries.map(s=>s.id)),byId=new Map(surgeries.map(s=>[s.id,s]))
 const equipment=view==='equipment',pacu=view==='pacu'
 const source=equipment?(scenario.equipmentSchedules||[]).filter(s=>visible.has(s.surgeryId)).map(schedule=>({s:byId.get(schedule.surgeryId),schedule})):surgeries.map(s=>({s}))
 const rows=source.map(({s,schedule})=>{
  const raw={...s};for(const field of dateFields)raw[field]=shift(s[field]);if(Array.isArray(s.vitalSigns))raw.vitalSigns=s.vitalSigns.map(v=>({...v,time:shift(v.time)}))
  let status=s.status==='已完成'?'completed':s.status==='进行中'?'in-progress':s.status==='取消'?'cancelled':'planned'
  if(pacu)status=s.recoveryEndTime?'completed':s.recoveryStartTime?'in-progress':'planned'
  const snapshot=scenario.meta?.asOf?shift(scenario.meta.asOf):null
  const actualStart=pacu?raw.recoveryStartTime||null:shift(schedule?schedule.actualStartTime||null:s.actualStartTime||null)
  const actualEnd=pacu?raw.recoveryEndTime||null:shift(schedule?schedule.actualEndTime||null:s.actualEndTime||null)
  return {id:schedule?.id||s.id,sourceSurgeryId:s.id,name:pacu?`${s.patientName} · ${s.surgeryName}`:s.surgeryName,patient:s.patientName,doctor:s.surgeonName,nurse:s.circulatingNurseName,room:pacu?s.pacuRoomNo||'PACU-未分配':s.operatingRoomNo,equipment:schedule?`${schedule.equipmentType} · ${schedule.assetNo}`:(s.equipmentNames||[]).join('、')||'常规设备',planStart:pacu?raw.plannedRecoveryStartTime||null:shift(schedule?.plannedStartTime||s.plannedStartTime),planEnd:pacu?raw.plannedRecoveryEndTime||null:shift(schedule?.plannedEndTime||s.plannedEndTime),actualStart,actualEnd,actualProgressEnd:actualStart&&!actualEnd?(pacu?raw.recoveryProgressEndTime||snapshot:snapshot):null,status,color:LEVEL_COLORS[s.surgeryLevel]||'#1976d2',_raw:raw,events:[],admissionTime:raw.admissionTime,transferInTime:raw.transferInTime,transferOutTime:raw.transferOutTime,recoveryStartTime:raw.recoveryStartTime,recoveryEndTime:raw.recoveryEndTime,pacuRoomNo:s.pacuRoomNo,pacuBedNo:s.recoveryBedNo}
 })
 const groupCatalog=equipment?(scenario.equipment||[]).filter(e=>e.isCritical).map(e=>`${e.type} · ${e.assetNo}`):pacu?(scenario.pacuBeds||[]).map(b=>b.fullName):[]
 const markers=[...(scenario.safetyChecks||[]).filter(c=>visible.has(c.surgeryId)&&c.result!=='通过').map(c=>({id:c.id,time:shift(c.checkTime),type:'safety-check-fail',surgeryId:c.surgeryId,description:c.checkName})),...(scenario.adverseEvents||[]).filter(e=>visible.has(e.surgeryId)).map(e=>({id:e.id,time:shift(e.occurrenceTime),type:'adverse-event',surgeryId:e.surgeryId,description:e.eventType}))]
 const timelineEvents=(scenario.timelineEvents||[]).filter(e=>visible.has(e.surgeryId)&&e.actualTime).map(e=>({...e,plannedTime:shift(e.plannedTime),actualTime:shift(e.actualTime)}))
 return {rows,groupCatalog,markers,timelineEvents}
}
export function groupJourneyEvents(events,surgeryId,sourceDate,targetDate){
 const order=['术前','入室','麻醉','手术','清点','核查','标本','交接','出室','转运','复苏'],nodeOrder=code=>code?.startsWith('P')?Number(code.slice(1)):7+Number(code?.slice(1))
 const groups=new Map();for(const event of events.filter(e=>e.surgeryId===surgeryId)){const rows=groups.get(event.category)||[];rows.push({...event,plannedTime:shiftScenarioTime(event.plannedTime,sourceDate,targetDate),actualTime:shiftScenarioTime(event.actualTime,sourceDate,targetDate)});groups.set(event.category,rows)}
 return [...groups].sort((a,b)=>order.indexOf(a[0])-order.indexOf(b[0])).map(([category,events])=>({category,events:events.sort((a,b)=>nodeOrder(a.nodeCode)-nodeOrder(b.nodeCode))}))
}
export function ganttSummary(surgeries,roomCount=40){
 const delays=surgeries.map(s=>s.startDeviation).filter(Number.isFinite)
 return {total:surgeries.length,completed:surgeries.filter(s=>s.status==='已完成').length,inProgress:surgeries.filter(s=>s.status==='进行中').length,pending:surgeries.filter(s=>s.status==='待开始').length,emergency:surgeries.filter(s=>s.isEmergency).length,avgDelay:delays.length?Math.round(delays.reduce((a,b)=>a+b,0)/delays.length):null,utilization:roomCount?Math.round(surgeries.reduce((sum,s)=>sum+(s.plannedDuration||0),0)/(roomCount*14.5*60)*100):null}
}
// A resource row may not exist for a valid surgery. Never retain another row's highlight.
export function selectGanttSurgery(engine,{scenario,surgeries,date},id,scroll=false){
 engine.deselect()
 if(!id||!surgeries.some(s=>s.id===id))return null
 const row=engine.data.find(row=>row.sourceSurgeryId===id)
 if(row){engine.selectSurgery(row.id);if(scroll)engine.scrollToSurgery(row.id)}
 return (row||createGanttData(scenario,surgeries.filter(s=>s.id===id),'patient',date).rows[0])._raw
}
