<template>
  <div class="kanban-column" :class="isStandardStatus ? 'column-' + status : 'column-dynamic'" :style="dynamicColumnStyle">
    <!-- Column Header -->
    <div class="column-header">
      <div class="header-left">
        <div class="status-badge" :class="isStandardStatus ? `badge-${status}` : 'badge-dynamic'" :style="dynamicBadgeStyle">
          <span class="status-dot" :class="isStandardStatus ? `dot-${status}` : 'dot-dynamic'" :style="dynamicDotStyle" />
          <h3 v-if="!isEditing" class="column-title" :class="{ 'is-editable': !isStandardStatus }" @click="startEditing">{{ title }}</h3>
          <input 
            v-else 
            ref="titleInputRef" 
            v-model="editTitle" 
            class="column-title-input" 
            @blur="saveTitle" 
            @keyup.enter="saveTitle" 
          />
          <span class="task-count">{{ tasks.length }}</span>
        </div>
      </div>
      <div class="header-actions">
        <button class="icon-btn" @click="$emit('add', status)" aria-label="Add task">
          <Plus :size="14" :stroke-width="1.5" />
        </button>
      </div>
    </div>

    <!-- Task List -->
    <div class="column-body">
      <VueDraggable
        v-model="localTasks"
        group="kanban-tasks"
        item-key="id"
        class="task-list"
        ghost-class="ghost-card"
        drag-class="drag-card"
        animation="200"
        handle=".drag-handle"
      >
        <template #item="{ element }">
          <BoardKanbanCard
            :task="element"
            @remove="$emit('remove', element.id)"
          />
        </template>
        
        <template #footer>
          <!-- Invisible drop zone to allow dropping at the end of empty columns easily -->
          <div v-if="tasks.length === 0" class="empty-state">
            <p class="empty-text">Drop tasks here</p>
          </div>
        </template>
      </VueDraggable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { Plus } from '@lucide/vue'
import VueDraggable from 'vuedraggable'
import type { BoardTask, TaskStatus } from '~/stores/task.store'

const props = defineProps<{
  title: string
  status: TaskStatus | string
  tasks: BoardTask[]
  context: string
  color?: string
}>()

const emit = defineEmits<{
  update: [orderedTasks: BoardTask[]]
  add: [status: TaskStatus | string]
  remove: [taskId: string]
  rename: [newName: string]
}>()

const isStandardStatus = computed(() => ['open', 'live', 'done'].includes(props.status))

const dynamicColumnStyle = computed(() => {
  if (isStandardStatus.value || !props.color) return {}
  return {
    backgroundColor: `${props.color}0A`, // 0A = approx 4% opacity
    borderColor: `${props.color}99`, // 99 = approx 60% opacity
  }
})

const dynamicBadgeStyle = computed(() => {
  if (isStandardStatus.value || !props.color) return {}
  return {
    backgroundColor: `${props.color}1A`, // 1A = approx 10% opacity
  }
})

const dynamicDotStyle = computed(() => {
  if (isStandardStatus.value || !props.color) return {}
  return {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(props.color)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Ccircle cx='12' cy='12' r='4' fill='${encodeURIComponent(props.color)}'/%3E%3C/svg%3E")`,
    backgroundSize: 'cover'
  }
})

const localTasks = computed({
  get: () => props.tasks,
  set: (val) => {
    emit('update', val)
  }
})

const isEditing = ref(false)
const editTitle = ref(props.title)
const titleInputRef = ref<HTMLInputElement | null>(null)

async function startEditing() {
  if (isStandardStatus.value) return
  isEditing.value = true
  editTitle.value = props.title
  await nextTick()
  if (titleInputRef.value) {
    titleInputRef.value.focus()
    titleInputRef.value.select()
  }
}

function saveTitle() {
  if (!isEditing.value) return
  isEditing.value = false
  if (editTitle.value.trim() && editTitle.value !== props.title) {
    emit('rename', editTitle.value.trim())
  }
}
</script>

<style scoped>
.column-dynamic {
  background-color: var(--bg-surface-2);
  border: 1px dashed var(--border-default);
}
.dot-dynamic {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3C/svg%3E");
  background-size: cover;
}

.kanban-column {
  display: flex;
  flex-direction: column;
  min-height: 500px;
  width: 100%;
  border-radius: var(--radius-large);
  padding: 0 var(--space-2) var(--space-3);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.02);
  transition: all 300ms cubic-bezier(0.25, 1, 0.5, 1);
  background-image: repeating-linear-gradient(
    -45deg,
    rgba(0, 0, 0, 0.05),
    rgba(0, 0, 0, 0.05) 1px,
    transparent 1px,
    transparent 12px
  );
}

html.dark .kanban-column {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
  background-image: repeating-linear-gradient(
    -45deg,
    rgba(255, 255, 255, 0.06),
    rgba(255, 255, 255, 0.06) 1px,
    transparent 1px,
    transparent 12px
  );
}

.column-open {
  background-color: var(--bg-root);
  border: 1px dashed rgba(0, 0, 0, 0.25);
}

.column-live {
  background-color: rgba(59, 130, 246, 0.03);
  border: 1px dashed rgba(59, 130, 246, 0.6);
}

.column-done {
  background-color: rgba(16, 185, 129, 0.03);
  border: 1px dashed rgba(16, 185, 129, 0.6);
}

html.dark .column-open {
  border: 1px dashed rgba(255, 255, 255, 0.25);
}

html.dark .column-live {
  background-color: rgba(59, 130, 246, 0.06);
  border: 1px dashed rgba(59, 130, 246, 0.7);
}

html.dark .column-done {
  background-color: rgba(16, 185, 129, 0.06);
  border: 1px dashed rgba(16, 185, 129, 0.7);
}

/* ── Header ── */
.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-2);
  margin-bottom: var(--space-2);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 4px 8px;
  border-radius: var(--radius-medium);
  transition: background-color 200ms ease;
}

.status-badge:hover {
  background-color: var(--bg-hover);
}

.status-dot {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.dot-open {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3C/svg%3E");
  background-size: cover;
}

.dot-live {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Ccircle cx='12' cy='12' r='3' fill='%233b82f6'/%3E%3C/svg%3E");
  background-size: cover;
}

.dot-done {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M22 11.08V12a10 10 0 1 1-5.93-9.14'/%3E%3Cpolyline points='22 4 12 14.01 9 11.01'/%3E%3C/svg%3E");
  background-size: cover;
}

.column-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  transition: color 150ms ease;
  border-radius: 4px;
  padding: 2px 4px;
  margin-left: -4px;
}

.column-title.is-editable {
  cursor: pointer;
}

.column-title.is-editable:hover {
  background-color: var(--bg-hover);
}

.column-title-input {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  background-color: var(--bg-surface-1);
  border: 1px solid var(--border-default);
  border-radius: 4px;
  padding: 1px 3px;
  margin-left: -4px;
  outline: none;
  width: 120px;
}

.column-title-input:focus {
  border-color: var(--text-primary);
}

.task-count {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  background-color: var(--bg-surface-2);
  padding: 0 6px;
  height: 20px;
  display: flex;
  align-items: center;
  border-radius: var(--radius-medium);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-medium);
  transition: color 120ms ease, background-color 120ms ease;
}

.icon-btn:hover {
  color: var(--text-primary);
  background-color: var(--bg-hover);
}

.icon-btn:active {
  transform: scale(0.96);
}

/* ── Body ── */
.column-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-height: 100px;
  flex: 1;
}

/* ── Empty State ── */
.empty-state {
  height: 60px;
  border: 1px dashed var(--border-default);
  border-radius: var(--radius-large);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
}

.empty-text {
  font-size: 13px;
  color: var(--text-muted);
}

/* ── Draggable Styles ── */
.ghost-card {
  opacity: 0.5;
  background-color: var(--bg-surface-2);
}

.drag-card {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  transform: rotate(2deg);
}

html.dark .drag-card {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
}
</style>
