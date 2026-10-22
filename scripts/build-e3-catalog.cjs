// Convert read-only E3 space/list-all and plane-sheets/list-all exports into a portable catalog.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function buildCatalog(spaces,areas){
 const byId=new Map(spaces.map(s=>[s.id,s])),rooms=[];
 const floors=spaces.filter(s=>s.spaceClass==='floor').map(f=>{
  const building=byId.get(f.parentId),scene=byId.get(building?.parentId);
  if(!building||!scene)throw Error('Incomplete E3 ancestry: '+f.id);
  const doors=JSON.parse(f.roamingConfigJson||'{}').doors||[];
  for(const a of areas[f.id]||[]){
   const kind=/手术室 OR-/.test(a.name)?'operating':/复苏\/术前/.test(a.name)?'pacu':/病房/.test(a.name)?'ward':/洁净物品间|库房/.test(a.name)?'storage':null;
   if(!kind)continue;
   const door=doors.find(d=>d.areaCode===a.code);let point=null;
   if(door?.edge){const {a:p,b:q}=door.edge,dx=q[0]-p[0],dz=q[1]-p[1],length=Math.hypot(dx,dz);if(length)point=[p[0]+dx*door.offset/length,0,p[1]+dz*door.offset/length].map(n=>Math.round(n*1e4)/1e4)}
   rooms.push({projectId:f.projectId,sceneId:scene.id,sceneName:scene.spaceName,buildingId:building.id,buildingName:building.spaceName,floorId:f.id,floorName:f.spaceName,floorKey:a.layer,roomId:a.id,roomCode:a.code,roomName:a.name,kind,doorId:door?.id||null,doorPoint:point,coordinateSystem:'floor-plan-metres-XZ-before-exploded-transform',path:[scene.spaceName,building.spaceName,f.spaceName,a.name].join(' / ')});
  }
  return {id:f.id,buildingId:building.id,sceneId:scene.id,name:f.spaceName};
 });
 if(!rooms.length||new Set(rooms.map(r=>r.roomCode)).size!==rooms.length)throw Error('Empty or duplicate E3 room codes');
 return {version:1,projectId:10,projectName:'浙江省肿瘤医院',source:'E3 live read-only API',capturedAt:new Date().toISOString(),sourceSha256:crypto.createHash('sha256').update(JSON.stringify({spaces,areas})).digest('hex'),evidence:'E3 reference-inference scene; not surveyed hospital plans',scenes:spaces.filter(s=>s.spaceClass==='scene').map(s=>({id:s.id,name:s.spaceName})),buildings:spaces.filter(s=>s.spaceClass==='building').map(s=>({id:s.id,sceneId:s.parentId,name:s.spaceName})),floors,rooms:rooms.sort((a,b)=>a.roomCode.localeCompare(b.roomCode,'en',{numeric:true}))};
}
module.exports={buildCatalog};
if(require.main===module){
 const [spacesFile,areasFile]=process.argv.slice(2);if(!spacesFile||!areasFile)throw Error('Usage: node scripts/build-e3-catalog.cjs spaces.json areas-by-floor-id.json');
 const catalog=buildCatalog(JSON.parse(fs.readFileSync(spacesFile)),JSON.parse(fs.readFileSync(areasFile)));
 fs.writeFileSync(path.join(__dirname,'../src/data/e3-spaces.json'),JSON.stringify(catalog,null,2)+'\n');
 console.log('E3 catalog:',catalog.floors.length,'floors,',catalog.rooms.length,'clinical rooms');
}
