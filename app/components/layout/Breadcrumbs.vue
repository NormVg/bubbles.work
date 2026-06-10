<template>
  <nav class="breadcrumbs" aria-label="Breadcrumb">
    <ol class="breadcrumb-list">
      <li v-for="(crumb, index) in items" :key="crumb.to" class="breadcrumb-item">
        <NuxtLink 
          :to="crumb.to" 
          class="breadcrumb-link"
          :class="{ 'is-active': index === items.length - 1 }"
        >
          {{ crumb.label }}
        </NuxtLink>
        <span v-if="index < items.length - 1" class="breadcrumb-separator">
          <ChevronRight :size="14" :stroke-width="1.5" />
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import type { Breadcrumb } from '~/composables/useNavigation'

defineProps<{
  items: Breadcrumb[]
}>()
</script>

<style scoped>
.breadcrumbs {
  margin-bottom: var(--space-4);
}

.breadcrumb-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.breadcrumb-item {
  display: flex;
  align-items: center;
}

.breadcrumb-link {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  padding: 2px 6px;
  border-radius: var(--radius-small);
  transition: all 150ms ease;
}

.breadcrumb-link:hover {
  color: var(--text-primary);
  background-color: var(--bg-hover);
}

.breadcrumb-link.is-active {
  color: var(--text-primary);
  pointer-events: none; /* Usually current page isn't clickable */
}

.breadcrumb-separator {
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 2px;
  opacity: 0.5;
}
</style>
