import test from 'node:test'
import assert from 'node:assert/strict'
import {navigationModules,navigationContext} from '../src/services/navigation.js'
test('five modules own all page-level navigation consistently',()=>{
 assert.equal(navigationModules.length,5)
 assert.deepEqual(navigationModules.map(m=>m.children?.map(c=>c.to)||[]),[['/alerts','/reporting','/rules'],['/metrics','/metrics/config'],['/data','/data/bindings'],[],[]])
 for(const [path,moduleId,page] of [['/alerts','alerts','告警中心'],['/alerts/SR-1','alerts','告警中心'],['/reporting','alerts','事件填报'],['/rules','alerts','规则配置'],['/metrics/config','metrics','指标配置'],['/data/bindings','data','数据源绑定'],['/gantt','gantt',null],['/command','command',null]]){
  const result=navigationContext(path);assert.equal(result.module.id,moduleId);assert.equal(result.page?.title||null,page)
 }
 assert.equal(navigationContext('/data/').page.title,'数据管理')
 assert.equal(navigationContext('/database'),null)
})
