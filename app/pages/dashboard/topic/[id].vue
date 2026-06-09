<template>
  <div class="page">
    <header class="page-header">
      <h1 class="page-title">{{ topicName }}</h1>
      <p class="page-description">Board for {{ topicName }}</p>
    </header>
    <div class="board-area">
      <BoardKanbanBoard :context="`topic-${route.params.id}`" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCategoryStore } from '~/stores/category.store'

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const categoryStore = useCategoryStore()

const topicName = computed(() => {
  const id = route.params.id as string
  
  // Recursively find the topic (task) name from the category store
  let name = 'Topic Board'
  const searchCategories = (categories: any[]) => {
    for (const cat of categories) {
      const task = cat.tasks.find((t: any) => t.id === id)
      if (task) {
        name = task.name
        return true
      }
      if (cat.children?.length > 0) {
        if (searchCategories(cat.children)) return true
      }
    }
    return false
  }
  
  searchCategories(categoryStore.categories)
  return name
})
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.page-header {
  flex-shrink: 0;
  margin-bottom: var(--space-6);
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.04em;
  margin-bottom: var(--space-1);
}

.page-description {
  color: var(--text-secondary);
  font-size: 14px;
}

.board-area {
  flex: 1;
  min-height: 0;
}
</style>
