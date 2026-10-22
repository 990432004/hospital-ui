import { test } from 'node:test'
import assert from 'node:assert/strict'
import { defaultAppearance, readAppearance, saveAppearance } from '../src/services/appearance.js'
test('外观配置恢复、校验、重置默认与存储隔离',()=>{
 const data=new Map([['hospital-ui:theme','dark'],['hospital-ui:demo:v1','keep']]);const storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)}
 assert.equal(readAppearance(storage).theme,'dark')
 const value={...defaultAppearance,theme:'light',lightPrimary:'#0D9394',layout:'horizontal',skin:'bordered',content:'wide',direction:'rtl',semiDark:true}
 saveAppearance(storage,value);assert.deepEqual(readAppearance(storage),value)
 saveAppearance(storage,defaultAppearance);assert.deepEqual(readAppearance(storage),defaultAppearance);assert.equal(data.get('hospital-ui:demo:v1'),'keep')
 data.set('hospital-ui:appearance:v1',JSON.stringify({theme:'invalid',lightPrimary:'javascript:x',layout:'x'}));assert.deepEqual(readAppearance(storage),defaultAppearance)
})
test('存储不可用时明确抛错，损坏外观可回退默认',()=>{assert.throws(()=>saveAppearance({setItem(){throw Error('quota')}},defaultAppearance));assert.deepEqual(readAppearance({getItem(){throw Error('denied')}}),defaultAppearance)})
