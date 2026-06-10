<template>
  <div class="kanban-card group" @click="uiStore.openTaskDrawer(task.id)">
    <!-- Top Row -->
    <div class="card-header">
      <span class="card-id">{{ task.identifier || `#${task.id.split('-')[1] || task.id}` }}</span>
      
      <div class="header-right">
        <div class="card-tags">
          <span v-for="tag in task.tags || []" :key="tag.label" class="tag" :class="`tag-${tag.intent}`">
            {{ tag.label }}
          </span>
        </div>
        <button class="delete-btn" @click.stop="taskStore.removeTask(task.id)" title="Delete Task">
          <Trash2 :size="14" :stroke-width="1.5" />
        </button>
        <div class="drag-handle">
          <GripVertical :size="14" :stroke-width="1.5" />
        </div>
      </div>
    </div>
    
    <!-- Title -->
    <div class="card-body">
      <h4 class="card-title">{{ task.title }}</h4>
    </div>
    
    <!-- Bottom Row (Dynamic Properties) -->
    <div class="card-footer" v-if="visibleProps.length > 0 || task.categoryLabel">
      <div class="footer-props-list">
        <div v-if="task.categoryLabel" class="category-label">
          <Database :size="12" :stroke-width="1.5" />
          <span>{{ task.categoryLabel }}</span>
        </div>
        
        <div 
          v-for="prop in visibleProps" 
          :key="prop.id" 
          class="custom-prop-badge"
          :style="{
            backgroundColor: prop.color ? `${prop.color}15` : '',
            color: prop.color || ''
          }"
        >
          <span>{{ prop.displayValue }}</span>
        </div>

        <div v-if="hiddenPropsCount > 0" class="custom-prop-badge hidden-count">
          +{{ hiddenPropsCount }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { GripVertical, User, Database, Signal, Trash2 } from '@lucide/vue'
import type { BoardTask } from '~/stores/task.store'
import { useTaskStore } from '~/stores/task.store'
import { useUIStore } from '~/stores/ui.store'

const uiStore = useUIStore()
const taskStore = useTaskStore()

const props = defineProps<{
  task: BoardTask
}>()

const activeProps = computed(() => {
  if (!props.task.customProperties) return []
  return taskStore.propertiesSchema.map(schemaProp => {
    const rawVal = props.task.customProperties[schemaProp.id]
    if (rawVal === undefined || rawVal === null || rawVal === '') return null
    
    // For select types, resolve the option label (legacy support)
    if (schemaProp.type === 'select') {
      const option = schemaProp.options?.find(o => o.id === rawVal)
      if (option) return { ...schemaProp, displayValue: option.label, color: option.color || schemaProp.color }
      return null
    }

    if (schemaProp.type === 'date') {
      const date = new Date(rawVal)
      const displayValue = isNaN(date.getTime()) 
        ? String(rawVal) 
        : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
      return { ...schemaProp, displayValue, color: schemaProp.color }
    }
    
    return { ...schemaProp, displayValue: String(rawVal), color: schemaProp.color }
  }).filter(Boolean) as any[]
})

const MAX_PROPS_TO_SHOW = 3
const visibleProps = computed(() => activeProps.value.slice(0, MAX_PROPS_TO_SHOW))
const hiddenPropsCount = computed(() => Math.max(0, activeProps.value.length - MAX_PROPS_TO_SHOW))
</script>

<style scoped>
.kanban-card {
  display: flex;
  flex-direction: column;
  padding: var(--space-4);
  background-color: var(--bg-root);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-large);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
  cursor: pointer;
  transition: box-shadow 200ms ease, border-color 200ms ease, transform 100ms ease;
  user-select: none;
  gap: var(--space-3);
}

html.dark .kanban-card {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1);
}

.kanban-card:hover {
  border-color: var(--border-strong);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
}

html.dark .kanban-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.2);
}

.kanban-card:active {
  transform: scale(0.98);
}

/* ── Header ── */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-id {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.card-tags {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tag {
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.01em;
}

/* Maya Semantic Intents */
.tag-danger { background-color: rgba(226, 75, 74, 0.1); color: #E24B4A; }
.tag-info { background-color: rgba(45, 128, 217, 0.1); color: #2D80D9; }
.tag-primary { background-color: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
.tag-warning { background-color: rgba(239, 159, 39, 0.1); color: #EF9F27; }
.tag-secondary { background-color: var(--bg-surface-2); color: var(--text-secondary); }

html.dark .tag-danger { background-color: rgba(226, 75, 74, 0.14); color: #fca5a5; }
html.dark .tag-info { background-color: rgba(45, 128, 217, 0.14); color: #93c5fd; }
html.dark .tag-primary { background-color: rgba(139, 92, 246, 0.14); color: #c4b5fd; }
html.dark .tag-warning { background-color: rgba(239, 159, 39, 0.14); color: #fcd34d; }

.drag-handle, .delete-btn {
  color: var(--text-muted);
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 150ms ease, color 150ms ease, background-color 150ms ease;
  padding: 4px;
  border-radius: var(--radius-micro);
  background: transparent;
  border: none;
}

.delete-btn {
  cursor: pointer;
}

.kanban-card:hover .drag-handle,
.kanban-card:hover .delete-btn {
  opacity: 1;
}

.drag-handle:hover {
  background-color: var(--bg-surface-2);
  color: var(--text-primary);
}

.delete-btn:hover {
  background-color: rgba(226, 75, 74, 0.1);
  color: #E24B4A;
}

.drag-handle:active {
  cursor: grabbing;
}

/* ── Body ── */
.card-body {
  padding-right: var(--space-4);
}

.card-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.4;
  margin: 0;
}

/* ── Footer ── */
.card-footer {
  margin-top: var(--space-2);
}

.footer-props-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.category-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  background-color: var(--bg-surface-2);
  padding: 2px 6px;
  border-radius: var(--radius-micro);
}

.custom-prop-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: var(--bg-surface-2);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
  border: 1px solid transparent;
  transition: border-color 150ms ease;
}

.custom-prop-badge:hover {
  border-color: var(--border-default);
}

.hidden-count {
  padding: 2px 6px;
  background-color: var(--bg-surface-1);
  border: 1px solid var(--border-default);
  color: var(--text-muted);
}


</style>
