<script setup>
defineProps({modelValue:Boolean,title:String,value:null})
const emit=defineEmits(['update:modelValue'])
</script>
<template><VDialog :model-value="modelValue" @update:model-value="emit('update:modelValue',$event)" max-width="1000" scrollable><VCard class="domain-dialog"><div class="dialog-heading"><h2>{{title}}</h2><VBtn icon="tabler-x" color="secondary" variant="text" aria-label="关闭完整值" @click="emit('update:modelValue',false)"/></div><VDivider/><VCardText><pre class="json-view">{{JSON.stringify(value,null,2)}}</pre></VCardText><VCardActions><VSpacer/><VBtn variant="text" @click="emit('update:modelValue',false)">关闭</VBtn></VCardActions></VCard></VDialog></template>
