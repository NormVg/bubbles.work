<template>
  <div class="page">
    <header class="page-header">
      <LayoutBreadcrumbs :items="breadcrumbs" />
      <h1 class="page-title">{{ topicName }}</h1>
    </header>
    
    <BoardTopicSwitcher v-if="siblingTopics" :topics="siblingTopics" />
    
    <div class="board-area">
      <BoardKanbanBoard :context="route.params.id as string" />
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

const topicId = computed(() => route.params.id as string)

const breadcrumbs = computed(() => {
  return navigation.getBreadcrumbs(topicId.value, 'topic')
})

const topicName = computed(() => {
  const crumbs = breadcrumbs.value
  return crumbs.length > 0 ? crumbs[crumbs.length - 1].label : 'Topic Board'
})

const siblingTopics = computed(() => {
  const result = topicSwitcher.getSiblingTopics(topicId.value)
  return result ? result.topics : []
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
