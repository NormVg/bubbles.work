<template>
  <div class="page">
    <header class="page-header">
      <LayoutBreadcrumbs :items="breadcrumbs" />
      <h1 class="page-title">{{ categoryName }}</h1>
      <p class="page-description">Overview for category {{ categoryName }}</p>
    </header>
    <div class="board-area">
      <BoardKanbanBoard 
        isCategoryBoard 
        :columns="topicColumns" 
        :context="route.params.id as string" 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useNavigation } from '~/composables/useNavigation'
import { useTopicSwitcher } from '~/composables/useTopicSwitcher'

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const navigation = useNavigation()
const topicSwitcher = useTopicSwitcher()

const categoryId = computed(() => route.params.id as string)

const breadcrumbs = computed(() => {
  return navigation.getBreadcrumbs(categoryId.value, 'category')
})

const categoryName = computed(() => {
  const crumbs = breadcrumbs.value
  return crumbs.length > 0 ? crumbs[crumbs.length - 1].label : 'Category'
})

const topicColumns = computed(() => {
  const topics = topicSwitcher.getTopicsByCategory(categoryId.value)
  return topics.map(t => ({
    id: t.id,
    title: t.name,
    color: t.color
  }))
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
