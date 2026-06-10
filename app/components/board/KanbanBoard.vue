<template>
  <div class="kanban-board" :class="{ 'is-category-board': isCategoryBoard }">
    <BoardKanbanColumn
      v-for="column in activeColumns"
      :key="column.id"
      :title="column.title"
      :status="column.id"
      :color="column.color"
      :tasks="orderedTasks(column.id)"
      :context="context || 'today'"
      @update="val => onColumnUpdate(column.id, val)"
      @add="onAdd"
      @remove="onRemove"
      @rename="newName => $emit('renameColumn', column.id, newName)"
    />

    <!-- Ghost Column for adding new topics -->
    <button v-if="isCategoryBoard" class="ghost-column" @click="$emit('addColumn')" aria-label="Add new topic">
      <div class="ghost-content">
        <Plus :size="20" class="ghost-icon" />
        <span>Add topic</span>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import confetti from 'canvas-confetti'
import { useTaskStore, type TaskStatus, type BoardTask } from '~/stores/task.store'
import { useUIStore } from '~/stores/ui.store'

const emit = defineEmits<{
  add: [status: string]
  remove: [taskId: string]
  renameColumn: [columnId: string, newName: string]
  addColumn: []
}>()

const props = defineProps<{
  context?: string
  isCategoryBoard?: boolean
  columns?: { id: string, title: string, color?: string }[]
}>()

const taskStore = useTaskStore()
const uiStore = useUIStore()

const defaultColumns = [
  { title: 'Open', id: 'open' },
  { title: 'Live', id: 'live' },
  { title: 'Done', id: 'done' }
]

const activeColumns = computed(() => {
  return props.columns || defaultColumns
})

function orderedTasks(columnId: string) {
  if (props.isCategoryBoard) {
    const tasks = taskStore.getTasksByContext(columnId)
    return [...tasks].sort((a, b) => a.order - b.order)
  } else {
    const tasks = taskStore.getTasksByStatus(props.context || 'today', columnId as TaskStatus)
    return [...tasks].sort((a, b) => a.order - b.order)
  }
}

function fireConfetti() {
  const duration = 2000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());
}

function onColumnUpdate(columnId: string, tasks: BoardTask[]) {
  if (props.isCategoryBoard) {
    taskStore.updateTaskContextOrders(columnId, tasks)
  } else {
    const previousDoneCount = taskStore.getTasksByStatus(props.context || 'today', 'done').length
    taskStore.updateTaskOrders(props.context || 'today', columnId as TaskStatus, tasks)
    
    if (columnId === 'done' && tasks.length > previousDoneCount) {
      fireConfetti()
    }
  }
}

async function onAdd(columnId: string) {
  const title = await uiStore.promptUser('Task Name')
  if (title) {
    if (props.isCategoryBoard) {
      taskStore.addTask(title, columnId, 'open')
    } else {
      taskStore.addTask(title, props.context || 'today', columnId as TaskStatus)
    }
  }
}

function onRemove(taskId: string) {
  taskStore.removeTask(taskId)
}
</script>

<style scoped>
.kanban-board {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: flex-start;
  gap: var(--space-4);
  flex: 1;
  min-height: 0;
  padding-bottom: var(--space-4);
}

.kanban-board.is-category-board {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: thin;
}

.kanban-board.is-category-board > * {
  width: 340px;
  flex-shrink: 0;
}

.ghost-column {
  width: 340px;
  flex-shrink: 0;
  min-height: 500px;
  border-radius: var(--radius-large);
  border: 2px dashed var(--border-default);
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 200ms ease;
  color: var(--text-muted);
}

.ghost-column:hover {
  background-color: var(--bg-surface-2);
  border-color: var(--text-muted);
  color: var(--text-primary);
}

.ghost-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  font-weight: 500;
  font-size: 14px;
}

@media (max-width: 768px) {
  .kanban-board {
    grid-template-columns: 1fr;
  }
  .kanban-board.is-category-board {
    flex-direction: column;
    overflow-x: visible;
  }
  .kanban-board.is-category-board > * {
    width: 100%;
  }
}
</style>
