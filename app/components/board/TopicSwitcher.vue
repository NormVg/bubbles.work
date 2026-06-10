<template>
  <div v-if="topics.length > 0" class="topic-switcher">
    <div class="topic-list">
      <NuxtLink
        v-for="topic in topics"
        :key="topic.id"
        :to="`/dashboard/topic/${topic.id}`"
        class="topic-tab"
        :class="{ 'is-active': topic.isActive }"
      >
        <span 
          v-if="topic.color" 
          class="topic-dot" 
          :style="{ backgroundColor: topic.color }"
        />
        <span class="topic-label">{{ topic.name }}</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SiblingTopic } from '~/composables/useTopicSwitcher'

defineProps<{
  topics: SiblingTopic[]
}>()
</script>

<style scoped>
.topic-switcher {
  margin-bottom: var(--space-6);
  border-bottom: 1px solid var(--border-default);
  overflow-x: auto;
  scrollbar-width: none;
}

.topic-switcher::-webkit-scrollbar {
  display: none;
}

.topic-list {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  padding: 0 var(--space-2);
}

.topic-tab {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 12px 0;
  text-decoration: none;
  color: var(--text-muted);
  transition: all 150ms ease;
  white-space: nowrap;
  font-size: 14px;
  position: relative;
}

.topic-tab:hover {
  color: var(--text-primary);
}

.topic-tab.is-active {
  color: var(--text-primary);
  font-weight: 500;
}

.topic-tab.is-active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--text-primary);
  border-radius: 2px 2px 0 0;
}

.topic-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  opacity: 0.7;
  transition: opacity 150ms ease;
}

.topic-tab.is-active .topic-dot {
  opacity: 1;
}
</style>
