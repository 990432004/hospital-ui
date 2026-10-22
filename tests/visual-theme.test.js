import {test} from 'node:test'
import assert from 'node:assert/strict'
import {primaryPalette} from '../src/services/primary-palette.js'
import {themes} from '../src/plugins/theme.js'
const luminance=hex=>{const c=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722}
test('主题色按钮和选中导航始终白字，浅色背景保持足够对比',()=>{for(const color of ['#7367F0','#0D9394','#FFAB1D','#EB3D63','#2092EC','#ffffff','#000000']){const palette=primaryPalette(color);assert.equal(palette['on-primary'],'#ffffff');assert.equal(palette.primary,color);assert.ok(1.05/(luminance(palette['primary-solid'])+.05)>=4.5)}})
test('深色背景、卡片、边框与文字均为中性灰黑',()=>{for(const key of ['background','surface','on-background','on-surface','surface-variant','on-surface-variant','skin-bordered-background','skin-bordered-surface','grey-100','grey-300','grey-500']){const hex=themes.dark.colors[key];assert.match(hex,/^#[0-9a-f]{6}$/i,key);assert.equal(hex.slice(1,3),hex.slice(3,5),key);assert.equal(hex.slice(3,5),hex.slice(5,7),key)}})
