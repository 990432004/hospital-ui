const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),s=JSON.parse(fs.readFileSync(path.join(root,'public/data/scenario.json')));
const data={version:1,simulation:true,projectId:s.meta.spatialAlignment.projectId,sceneId:s.meta.spatialAlignment.sceneId,date:s.meta.date,asOf:s.meta.asOf,records:s.transfers.map(t=>({id:t.id,surgeryId:t.surgeryId,phase:t.phase,ward:t.ward,operatingRoom:t.operatingRoom,startTime:t.startTime,endTime:t.endTime,timeBasis:t.timeBasis,routeStatus:t.routeStatus,fromBuildingId:t.from.buildingId,toBuildingId:t.to.buildingId}))};
const output=path.join(root,'public/data/e3-transfers.json');fs.writeFileSync(output,JSON.stringify(data,null,2)+'\n');console.log(`Exported ${data.records.length} transfers: ${output}`);
