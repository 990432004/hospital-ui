import {test} from 'node:test'
import assert from 'node:assert/strict'
import {selectionMatchesSearch} from '../src/services/surgery-selection.js'
test('选手术后无匹配搜索必须清除旧关联，匹配保留且trim',()=>{const item={value:'s1',title:'模拟患者 · SS001 · 普外科 · 手术'};assert.equal(selectionMatchesSearch(item,'不存在'),false);assert.equal(selectionMatchesSearch(item,' ss001 '),true);assert.equal(selectionMatchesSearch(item,''),true);assert.equal(selectionMatchesSearch(null,'SS001'),false)})
