<script setup>
import {ref,onMounted,onUnmounted} from 'vue'
const url=import.meta.env.VITE_COMMAND_IFRAME_URL||'http://172.16.98.87:8080/#/preview/hhWDzzBxVjumK1xBRWtyTl4vjPgjAfT45i3os-309hc?space=20260722000111',state=ref(url?'loading':'empty'),reload=ref(0)
let timer
function start(){state.value='loading';clearTimeout(timer);timer=setTimeout(()=>state.value='timeout',15000)}
function loaded(){clearTimeout(timer);state.value='loaded'}
function retry(){reload.value++;start()}
onMounted(()=>{if(url)start()});onUnmounted(()=>clearTimeout(timer))
</script>
<template><section class="command-scene"><div class="page-heading"><div><h1>实时指挥调度</h1><p>医院 3D 场景与实时指挥调度。</p></div><VBtn variant="tonal" prepend-icon="tabler-refresh" @click="retry">重新加载场景</VBtn></div><VCard><div v-if="!url" class="empty" style="padding:110px 24px"><VAvatar color="primary" variant="tonal" rounded size="72"><VIcon icon="tabler-building-hospital" size="38"/></VAvatar><h3 class="mt-6">3D 指挥场景待接入</h3><p>接入后将在此展示实时指挥调度场景。</p><VBtn to="/alerts" variant="tonal">返回告警中心</VBtn></div><template v-else><VProgressLinear v-if="state==='loading'" indeterminate/><VAlert v-if="state==='timeout'||state==='error'" type="warning" variant="tonal">场景暂未完成加载，请检查服务或稍后重试。<VBtn variant="text" @click="retry">重新加载</VBtn></VAlert><iframe :key="reload" :src="url" title="E3 场景预览" allowfullscreen style="width:100%;height:calc(100vh - 250px);min-height:600px;border:0" @load="loaded" @error="state='error'"/></template></VCard></section></template>
