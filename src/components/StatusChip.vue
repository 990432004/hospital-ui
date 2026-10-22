<script setup>
import { levels, responses, messages } from '../services/repository'
defineProps({value:String,kind:{type:String,default:'level'}})
const colors={red:'error',orange:'warning',yellow:'amber-darken-2',pending:'warning',processing:'primary',escalated:'error',resolved:'success',unread:'primary',read:'secondary',starred:'warning'}
const labels={level:levels,response:responses,message:messages}
</script>
<template><VChip :color="colors[value]" variant="tonal" label size="small">{{ labels[kind]?.[value] || value || '—' }}</VChip></template>
