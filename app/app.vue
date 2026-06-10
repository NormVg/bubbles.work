<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useTaskStore } from '~/stores/task.store'

onMounted(() => {
  const taskStore = useTaskStore()
  // Migration: Ensure default properties exist if lost due to local storage persistence
  if (!taskStore.propertiesSchema.find(p => p.id === 'prop-date')) {
    taskStore.propertiesSchema.push({
      id: 'prop-date',
      name: 'On Date',
      type: 'date',
      color: '#3b82f6'
    })
  }
})
</script>
