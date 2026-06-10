<template>
  <div class="kanban-board">
    <BoardKanbanColumn
      v-for="column in columns"
      :key="column.status"
      :title="column.title"
      :status="column.status"
      :tasks="orderedTasks(column.status)"
      :context="context"
      @update="val => onColumnUpdate(column.status, val)"
      @add="onAdd"
      @remove="onRemove"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import confetti from 'canvas-confetti'
import { useTaskStore, type TaskStatus, type BoardTask } from '~/stores/task.store'
import { useUIStore } from '~/stores/ui.store'

const props = defineProps<{
  context: string
}>()

const taskStore = useTaskStore()
const uiStore = useUIStore()

const columns = [
  { title: 'Open', status: 'open' as TaskStatus },
  { title: 'Live', status: 'live' as TaskStatus },
  { title: 'Done', status: 'done' as TaskStatus }
]

function orderedTasks(status: TaskStatus) {
  const tasks = taskStore.getTasksByStatus(props.context, status)
  return [...tasks].sort((a, b) => a.order - b.order)
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

function onColumnUpdate(status: TaskStatus, tasks: BoardTask[]) {
  // Check if a task just moved into 'done' by comparing lengths
  const previousDoneCount = taskStore.getTasksByStatus(props.context, 'done').length
  
  taskStore.updateTaskOrders(props.context, status, tasks)
  
  if (status === 'done' && tasks.length > previousDoneCount) {
    fireConfetti()
  }
}

async function onAdd(status: TaskStatus) {
  const title = await uiStore.promptUser('Task Name')
  if (title) {
    taskStore.addTask(title, props.context, status)
  }
}

function onRemove(taskId: string) {
  taskStore.removeTask(taskId)
}
</script>

<style scoped>
.kanban-board {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 340px));
  justify-content: start;
  gap: var(--space-4);
  height: 100%;
  min-height: 0;
  padding-bottom: var(--space-4);
}

@media (max-width: 768px) {
  .kanban-board {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }
}
</style>
