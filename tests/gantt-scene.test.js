import test from 'node:test'
import assert from 'node:assert/strict'
import {buildSceneContext,resolveSceneUrl,acceptSceneMessage} from '../src/services/gantt-scene.js'
test('all three panels share stable surgery identity, date and cursor time, including equipment rows',()=>{
 const context=buildSceneContext({date:'2026-10-21',view:'equipment',time:'10:32',surgery:{id:'OPR1',patientId:'PAT1',operatingRoomId:'OR1',operatingRoomNo:'3F-01'},dark:true})
 assert.deepEqual(context,{date:'2026-10-21',view:'equipment',time:'10:32',surgeryId:'OPR1',patientId:'PAT1',operatingRoomId:'OR1',operatingRoomNo:'3F-01',theme:'dark'})
 assert.equal(buildSceneContext({date:'2026-10-20',view:'patient',time:'14:00'}).surgeryId,null)
 const endpoint=resolveSceneUrl('/scene','http://127.0.0.1:5174/gantt');assert.equal(endpoint.origin,'http://127.0.0.1:5174')
 assert.throws(()=>resolveSceneUrl('javascript:alert(1)','http://localhost'),/HTTP/)
 const source={},good={origin:endpoint.origin,source,data:{type:'hospital:scene-select',surgeryId:'OPR1'}}
 assert.equal(acceptSceneMessage(good,endpoint.origin,source,['OPR1']).surgeryId,'OPR1')
 for(const bad of [{...good,origin:'https://other.test'},{...good,source:{}},{...good,data:{type:'hospital:scene-select',surgeryId:'unknown'}}])assert.equal(acceptSceneMessage(bad,endpoint.origin,source,['OPR1']),null)
})
