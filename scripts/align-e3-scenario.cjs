const catalog=require('../src/data/e3-spaces.json');
const MINUTE=60000;
const stamp=value=>Date.parse(value.replace(' ','T')+( /(?:Z|[+-]\d\d:\d\d)$/.test(value)?'':'+08:00'));
const format=ms=>new Date(ms+8*3600000).toISOString().slice(0,19).replace('T',' ');
const iso=value=>value?value.replace(' ','T')+'+08:00':null;
const floorNumber=r=>r.floorKey.match(/-(\d+)F$/)?.[1]||'';
function alignScenario(scenario,spatialCatalog=catalog){
 if(scenario.meta.spatialAlignment?.version===1&&scenario.meta.spatialAlignment.sourceSha256===spatialCatalog.sourceSha256)return scenario;
 const rooms=spatialCatalog.rooms,wards=rooms.filter(r=>r.kind==='ward'),ors=rooms.filter(r=>r.kind==='operating'),pacus=rooms.filter(r=>r.kind==='pacu');
 if(!wards.length||!ors.length||!pacus.length)throw Error('E3 lacks clinical endpoints');
 const oldRooms=scenario.operatingRooms,oldByNo=new Map(),oldById=new Map();
 if(oldRooms.length>ors.length)throw Error('E3 operating room capacity is smaller than source; refusing to merge schedules');
 // Interleave floors so existing schedules retain one-to-one room assignments.
 const ordered=[...ors].sort((a,b)=>Number(a.roomCode.match(/R(\d+)$/)[1])-Number(b.roomCode.match(/R(\d+)$/)[1])||a.floorId-b.floorId);
 oldRooms.forEach((old,i)=>{oldByNo.set(old.roomNo,ordered[i]);oldById.set(old.id,ordered[i])});
 const eventsBySurgery=new Map();for(const e of scenario.timelineEvents){const list=eventsBySurgery.get(e.surgeryId)||[];list.push(e);eventsBySurgery.set(e.surgeryId,list)}
 const patientWard=new Map(scenario.patients.map((p,i)=>[p.id,wards[i%wards.length]]));
 const snapshot=stamp(scenario.meta.asOf),day=scenario.meta.date;
 const absolute=t=>stamp(/^\d\d:/.test(t)?`${day} ${t.length===5?t+':00':t}`:t);
 scenario.spatialCatalog=spatialCatalog;
 scenario.operatingRooms=ordered.map((r,i)=>({...oldRooms[i%oldRooms.length],id:r.roomCode,roomNo:r.roomCode,name:r.roomName,floor:Number(floorNumber(r)),location:r,legacyOperatingRoomId:oldRooms[i]?.id||null,status:'空闲',isEmergency:oldRooms[i]?.isEmergency||false}));
 // Beds are simulated resources within actual E3 PACU rooms, never invented scene areas.
 scenario.pacuBeds=pacus.flatMap(r=>Array.from({length:4},(_,i)=>({id:`${r.roomCode}-B${i+1}`,pacuRoomNo:r.roomCode,roomName:r.roomName,bedNo:`B${i+1}`,fullName:`${r.roomCode}-B${i+1}`,location:r,simulation:true,status:'空闲',scheduleIds:[]})));
 const bedIntervals=new Map();scenario.transfers=[];
 for(const [index,s] of scenario.surgeries.entries()){
  const room=oldById.get(s.operatingRoomId)||oldByNo.get(s.operatingRoomNo);if(!room)throw Error('Unmapped operating room: '+s.id);
  const ward=patientWard.get(s.patientId);if(!ward)throw Error('Unmapped patient: '+s.id);
  const candidates=pacus.filter(p=>p.floorId===room.floorId);if(!candidates.length)throw Error('No PACU on operating floor '+room.floorKey);
  let pacu=candidates[index%candidates.length];const nodes=eventsBySurgery.get(s.id),byCode=new Map(nodes.map(n=>[n.nodeCode,n]));
  const ps=absolute(s.plannedStartTime),pe=absolute(s.plannedEndTime),as=s.actualStartTime?absolute(s.actualStartTime):null,ae=s.actualEndTime?absolute(s.actualEndTime):null;
  const duration=Math.max(30,Math.round((absolute(s.plannedRecoveryEndTime)-absolute(s.plannedRecoveryStartTime))/MINUTE)||60)*MINUTE;
  function times(start,end){return {P7:start-50*MINUTE,T16:start-50*MINUTE,T1:start-20*MINUTE,T2:start-15*MINUTE,T3:start,T4:start+(end-start)*.25,T5:start+(end-start)*.7,T6:end,T7:end+5*MINUTE,T8:end+15*MINUTE,T9:start+(end-start)*.7,T10:end,T11:start-20*MINUTE,T12:start,T13:end,T14:end,T15:end+15*MINUTE,T17:end+20*MINUTE,T18:end+20*MINUTE+duration}}
  const plan=times(ps,pe),actual=times(as??ps,ae??(as??ps)+(pe-ps));
  const actualRecovery=ae&&actual.T17<=snapshot;
  const interval=[Math.min(plan.T17,actualRecovery?actual.T17:Infinity),Math.max(plan.T18,actualRecovery?Math.min(actual.T18,snapshot):0)];
  const available=scenario.pacuBeds.filter(b=>b.location.floorId===room.floorId).sort((a,b)=>a.scheduleIds.length-b.scheduleIds.length).find(b=>(bedIntervals.get(b.id)||[]).every(([a,z])=>interval[0]>=z||interval[1]<=a));
  if(!available)throw Error('Simulated PACU beds overbooked: '+s.id);
  pacu=available.location;
  for(const e of nodes){
   const n=Number(e.nodeCode.slice(1)),preop=e.nodeCode.startsWith('P');
   let planned=plan[e.nodeCode],actualTime=actual[e.nodeCode];
   if(preop&&n<7){planned=Math.min(absolute(e.plannedTime),plan.P7-(7-n)*MINUTE);actualTime=e.actualTime?Math.min(absolute(e.actualTime),actual.P7-(7-n)*MINUTE):null}
   // No actual intraoperative end milestones before surgery has ended.
   const requiresEnd=['T5','T6','T7','T8','T9','T10','T13','T14','T15','T17','T18'].includes(e.nodeCode);
   if((requiresEnd&&!ae)||(!preop&&!['T16','T1','T2','T11'].includes(e.nodeCode)&&!as)||actualTime>snapshot)actualTime=null;
   e.plannedTime=format(planned);e.actualTime=actualTime==null?null:format(actualTime);
   e.deviation=e.actualTime?Math.round((actualTime-planned)/MINUTE):null;e.deviationText=e.deviation==null?'未发生':e.deviation===0?'准时':e.deviation>0?`延误 ${e.deviation} 分钟`:`提前 ${-e.deviation} 分钟`;e.status=e.actualTime?(e.deviation>15?'延误':'正常'):'待发生';
   e.location=preop||e.nodeCode==='T16'?ward:['T17','T18'].includes(e.nodeCode)?pacu:room;
  }
  s.legacyOperatingRoomId=s.operatingRoomId;s.legacyOperatingRoomNo=s.operatingRoomNo;
  Object.assign(s,{operatingRoomId:room.roomCode,operatingRoomNo:room.roomCode,operatingRoomName:room.roomName,operatingFloor:floorNumber(room),wardRoomCode:ward.roomCode,wardName:ward.path,pacuRoomNo:pacu.roomCode,pacuRoomName:pacu.roomName,locations:{ward,operatingRoom:room,pacu},admissionTime:byCode.get('P1').actualTime||byCode.get('P1').plannedTime,transferInTime:byCode.get('T16').actualTime,transferOutTime:byCode.get('T8').actualTime,plannedRecoveryStartTime:byCode.get('T17').plannedTime,plannedRecoveryEndTime:byCode.get('T18').plannedTime,recoveryStartTime:byCode.get('T17').actualTime,recoveryEndTime:byCode.get('T18').actualTime});
  s.recoveryProgressEndTime=s.recoveryStartTime?(s.recoveryEndTime||format(snapshot)):null;
  s.recoveryBedNo=available.fullName;available.scheduleIds.push(s.id);bedIntervals.set(available.id,[...(bedIntervals.get(available.id)||[]),interval]);if(s.recoveryStartTime&&!s.recoveryEndTime)available.status='占用';
  s.transfers=[['inbound',ward,room,'T16','T1'],['recovery',room,pacu,'T8','T17']].map(([phase,from,to,startCode,endCode])=>{
   const start=byCode.get(startCode),end=byCode.get(endCode),completed=!!(start.actualTime&&end.actualTime);
   const estimatedEndTime=start.actualTime&&!completed?iso(format(Math.max(stamp(start.actualTime)+stamp(end.plannedTime)-stamp(start.plannedTime),snapshot+MINUTE))):null;
   return {id:`${s.id}-${phase}`,surgeryId:s.id,patientId:s.patientId,phase,from,to,ward:from.roomCode,operatingRoom:to.roomCode,plannedStartTime:iso(start.plannedTime),plannedEndTime:iso(end.plannedTime),actualStartTime:iso(start.actualTime),actualEndTime:iso(end.actualTime),estimatedEndTime,startTime:iso(start.actualTime||start.plannedTime),endTime:completed?iso(end.actualTime):estimatedEndTime||iso(end.plannedTime),timeBasis:completed?'actual':start.actualTime?'actual-start-estimated-end':'planned',status:completed?'completed':start.actualTime?'in-progress':'planned',routeStatus:from.buildingId===to.buildingId?'not-computed':'requires-cross-building-route'};
  });scenario.transfers.push(...s.transfers);
 }
 const surgeryById=new Map(scenario.surgeries.map(s=>[s.id,s]));
 for(const p of scenario.patients){
  const ward=patientWard.get(p.id),s=scenario.surgeries.find(s=>s.patientId===p.id);
  Object.assign(p,{ward:ward.path,wardRoomCode:ward.roomCode,bedNo:`${ward.roomCode}-B1`,location:ward});
  if(s)for(const k of ['admissionTime','transferInTime','transferOutTime','recoveryStartTime','recoveryEndTime','pacuRoomNo'])p[k]=s[k];
 }
 for(const e of scenario.equipmentSchedules){const s=surgeryById.get(e.surgeryId);if(!s)throw Error('Orphan equipment schedule '+e.id);e.operatingRoomNo=s.operatingRoomNo;e.operatingRoomId=s.operatingRoomId;e.location=s.locations.operatingRoom}
 for(const e of scenario.equipment){const room=oldByNo.get(e.location)||scenario.surgeries.find(s=>s.equipmentIds.includes(e.id))?.locations.operatingRoom||rooms.find(r=>r.kind==='storage'&&r.buildingId===ors[0].buildingId);if(!room)throw Error('Unmapped equipment '+e.id);e.location=room.roomCode;e.spatialLocation=room}
 for(const collection of ['safetyChecks','adverseEvents','handovers'])for(const e of scenario[collection]||[]){const s=surgeryById.get(e.surgeryId);if(!s)continue;e.location=s.locations.operatingRoom;if('operatingRoomNo'in e)e.operatingRoomNo=s.operatingRoomNo;if('roomNo'in e)e.roomNo=s.operatingRoomNo;
  if(collection==='handovers'){const out=/出室|复苏/.test(e.handoverType),t=s.transfers[out?1:0];e.fromLocation=t.from;e.toLocation=t.to;const time=out?t.actualStartTime:t.actualEndTime;e.handoverTime=time?time.slice(0,19).replace('T',' '):null}
 }
 for(const room of scenario.operatingRooms){const surgeries=scenario.surgeries.filter(s=>s.operatingRoomId===room.id);room.status=surgeries.some(s=>s.status==='进行中')?'使用中':surgeries.some(s=>s.status==='待开始')?'准备中':'空闲'}
 if(scenario.statistics){scenario.statistics.roomUtilization=(scenario.statistics.roomUtilization||[]).map(r=>({...r,roomNo:oldByNo.get(r.roomNo)?.roomCode||r.roomNo}));scenario.statistics.activeOperatingRooms=new Set(scenario.surgeries.map(s=>s.operatingRoomId)).size}
 Object.assign(scenario.meta.scale,{operatingRooms:ors.length,pacuRooms:pacus.length,pacuBeds:scenario.pacuBeds.length});
 scenario.meta.hospital='浙江省肿瘤医院';scenario.meta.spatialAlignment={version:1,sourceSha256:spatialCatalog.sourceSha256,capturedAt:spatialCatalog.capturedAt,projectId:10,sceneId:rooms[0].sceneId,simulation:true,bedCapacity:'4 simulated beds per E3 recovery room',crossBuildingRouting:'endpoints only; route not computed'};
 return scenario;
}
function syncSeed(seed,scenario){
 seed.meta={...seed.meta,...scenario.meta,simulation:true};seed.surgeries=scenario.surgeries.map(({vitalSigns,...s})=>({...s,vitalSignsCount:vitalSigns?.length||0}));
 for(const e of seed.events||[]){const s=scenario.surgeries.find(s=>s.id===e.surgeryId);if(s){e.roomName=s.operatingRoomNo;if('operatingRoomNo'in e)e.operatingRoomNo=s.operatingRoomNo}}
 return seed;
}
module.exports={alignScenario,syncSeed};
if(require.main===module){const fs=require('node:fs'),path=require('node:path');const file=path.join(__dirname,'../public/data/scenario.json'),seedFile=path.join(__dirname,'../src/data/seed.json');const scenario=alignScenario(JSON.parse(fs.readFileSync(file)));fs.writeFileSync(file,JSON.stringify(scenario));fs.writeFileSync(seedFile,JSON.stringify(syncSeed(JSON.parse(fs.readFileSync(seedFile)),scenario),null,2)+'\n');console.log('Aligned',scenario.surgeries.length,'surgeries,',scenario.transfers.length,'transfers to E3');}
