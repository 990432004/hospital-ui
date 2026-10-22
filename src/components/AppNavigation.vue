<script setup>
import {ref,computed,watch} from 'vue'
import {useRoute} from 'vue-router'
import {navigationModules,navigationContext} from '../services/navigation'
defineProps({horizontal:Boolean})
const route=useRoute(),opened=ref([])
const current=computed(()=>navigationContext(route.path))
watch(()=>route.path,()=>{opened.value=current.value?.module.children?[current.value.module.id]:[]},{immediate:true})
const pageActive=page=>current.value?.page?.to===page.to
const moduleActive=module=>current.value?.module.id===module.id
</script>
<template>
<nav v-if="horizontal" class="horizontal-nav" aria-label="一级模块导航"><template v-for="module in navigationModules" :key="module.id"><VMenu v-if="module.children"><template #activator="{props}"><VBtn v-bind="props" variant="text" :color="moduleActive(module)?'primary':'secondary'" :prepend-icon="module.icon" append-icon="tabler-chevron-down" :aria-label="module.title">{{module.title}}</VBtn></template><VList :aria-label="module.title+'二级导航'"><VListItem v-for="page in module.children" :key="page.to" :title="page.title" :to="page.to" :active="pageActive(page)" :aria-current="pageActive(page)?'page':undefined" prepend-icon="tabler-circle"/></VList></VMenu><VBtn v-else variant="text" :to="module.to" :prepend-icon="module.icon" :color="moduleActive(module)?'primary':'secondary'" :active="moduleActive(module)" :aria-current="moduleActive(module)?'page':undefined">{{module.title}}</VBtn></template></nav>
<VList v-else v-model:opened="opened" nav open-strategy="single" class="module-navigation px-3" aria-label="模块与页面导航"><template v-for="module in navigationModules" :key="module.id"><VListGroup v-if="module.children" :value="module.id"><template #activator="{props}"><VListItem v-bind="props" :title="module.title" :aria-label="module.title" :prepend-icon="module.icon" :active="false" role="button" :aria-expanded="opened.includes(module.id)" class="nav-module" :class="{'is-current':moduleActive(module)}"/></template><VListItem v-for="page in module.children" :key="page.to" :title="page.title" :aria-label="page.title" :to="page.to" :active="pageActive(page)" :aria-current="pageActive(page)?'page':undefined" prepend-icon="tabler-circle" class="nav-child"/></VListGroup><VListItem v-else :title="module.title" :aria-label="module.title" :to="module.to" :active="moduleActive(module)" :aria-current="moduleActive(module)?'page':undefined" :prepend-icon="module.icon" class="nav-module"/></template></VList>
</template>
