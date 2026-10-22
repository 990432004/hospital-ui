// The host owns selection; an embedded scene receives only the shared identifiers.
export function buildSceneContext({date,view,time,surgery,dark=false}){
 const spatial=surgery?.locations?{projectId:surgery.locations.operatingRoom.projectId,sceneId:surgery.locations.operatingRoom.sceneId,locations:surgery.locations,transfers:(surgery.transfers||[]).map(({patientId,...t})=>t)}:{}
 return {...spatial,date,view,time,surgeryId:surgery?.id||null,patientId:surgery?.patientId||null,operatingRoomId:surgery?.operatingRoomId||null,operatingRoomNo:surgery?.operatingRoomNo||null,theme:dark?'dark':'light'}
}
export function resolveSceneUrl(value,base){
 if(!value)return null
 const url=new URL(value,base)
 if(!['http:','https:'].includes(url.protocol))throw Error('3D 场景地址仅支持 HTTP(S)')
 return {url:url.href,origin:url.origin}
}
export function acceptSceneMessage(event,origin,source,allowedIds){
 if(!source||event.source!==source||event.origin!==origin||!event.data||typeof event.data!=='object')return null
 if(event.data.type==='hospital:scene-state'&&Number.isFinite(event.data.timeMs))return {type:event.data.type,surgeryId:event.data.surgeryId,timeMs:event.data.timeMs}
 if(event.data.type==='hospital:scene-ready')return {type:event.data.type}
 if(event.data.type==='hospital:scene-select'&&typeof event.data.surgeryId==='string'&&allowedIds.includes(event.data.surgeryId))return {type:event.data.type,surgeryId:event.data.surgeryId}
 return null
}

export function buildGanttControl(context,scope){
 const time=String(context.time||'00:00:00');
 return {projectId:scope.projectId,sceneId:scope.sceneId,surgeryId:context.surgeryId||null,date:context.date,timeMs:Date.parse(`${context.date}T${time.length===5?time+':00':time}+08:00`),play:false,sceneOnly:true};
}
