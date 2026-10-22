// The host owns selection; an embedded scene receives only the shared identifiers.
export function buildSceneContext({date,view,time,surgery,dark=false}){
 return {date,view,time,surgeryId:surgery?.id||null,patientId:surgery?.patientId||null,operatingRoomId:surgery?.operatingRoomId||null,operatingRoomNo:surgery?.operatingRoomNo||null,theme:dark?'dark':'light'}
}
export function resolveSceneUrl(value,base){
 if(!value)return null
 const url=new URL(value,base)
 if(!['http:','https:'].includes(url.protocol))throw Error('3D 场景地址仅支持 HTTP(S)')
 return {url:url.href,origin:url.origin}
}
export function acceptSceneMessage(event,origin,source,allowedIds){
 if(!source||event.source!==source||event.origin!==origin||!event.data||typeof event.data!=='object')return null
 if(event.data.type==='hospital:scene-ready')return {type:event.data.type}
 if(event.data.type==='hospital:scene-select'&&typeof event.data.surgeryId==='string'&&allowedIds.includes(event.data.surgeryId))return {type:event.data.type,surgeryId:event.data.surgeryId}
 return null
}
