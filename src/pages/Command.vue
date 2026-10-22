<script setup>
import {ref,inject,onMounted,onUnmounted} from 'vue'
import {E3_SCENE_URL} from '../services/e3-scene-url'
const sceneFrame=ref(null)
const notify=inject('notify',()=>{})
async function showFullscreen(){
  try {
    if(!sceneFrame.value?.requestFullscreen) throw new Error('unsupported')
    await sceneFrame.value.requestFullscreen()
  } catch {
    notify('无法进入全屏，请检查浏览器全屏权限或使用 Chrome 浏览器。')
  }
}
const url=E3_SCENE_URL,state=ref(url?'loading':'empty'),reload=ref(0)
let timer
function start(){state.value='loading';clearTimeout(timer);timer=setTimeout(()=>state.value='timeout',15000)}
function loaded(){clearTimeout(timer);state.value='loaded'}
function retry(){reload.value++;start()}
onMounted(()=>{if(url)start()});onUnmounted(()=>clearTimeout(timer))
</script>
<template><section class="command-scene"><div class="page-heading"><div><h1>实时指挥调度</h1><p>医院 3D 场景与实时指挥调度。</p></div><div class="scene-actions"><VBtn variant="tonal" :disabled="!url" title="全屏展示场景，按 Esc 退出" @click="showFullscreen"><template #prepend><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5"/></svg></template>全屏展示</VBtn><VBtn variant="tonal" prepend-icon="tabler-refresh" @click="retry">重新加载场景</VBtn></div></div><VCard><div v-if="!url" class="empty" style="padding:110px 24px"><VAvatar color="primary" variant="tonal" rounded size="72"><VIcon icon="tabler-building-hospital" size="38"/></VAvatar><h3 class="mt-6">3D 指挥场景待接入</h3><p>接入后将在此展示实时指挥调度场景。</p><VBtn to="/alerts" variant="tonal">返回告警中心</VBtn></div><template v-else><VProgressLinear v-if="state==='loading'" indeterminate/><VAlert v-if="state==='timeout'||state==='error'" type="warning" variant="tonal">场景暂未完成加载，请检查服务或稍后重试。<VBtn variant="text" @click="retry">重新加载</VBtn></VAlert><iframe ref="sceneFrame" class="scene-frame" :key="reload" :src="url" title="E3 场景预览" allowfullscreen @load="loaded" @error="state='error'"/></template></VCard></section></template>

<style scoped>
.scene-actions { display: flex; flex-wrap: wrap; gap: 12px; }
.scene-frame { display: block; width: 100%; height: auto; aspect-ratio: 1920 / 1080; border: 0; }
.scene-frame:fullscreen { width: 100%; height: 100%; aspect-ratio: auto; background: #111; }
</style>
