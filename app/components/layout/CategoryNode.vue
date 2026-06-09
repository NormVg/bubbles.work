<template>
  <div class="node">
    <!-- Category Row -->
    <div 
      class="row" 
      :style="{ paddingLeft: `${12 + depth * 16}px` }"
      @click="categoryStore.toggleCategory(category.id)"
    >
      <div class="expand-icon" :class="{ 'is-expanded': category.isExpanded }">
        <ChevronRight :size="12" :stroke-width="1.5" />
      </div>
      <span class="row-label">{{ category.name }}</span>
      <div class="row-actions" @click.stop>
        <button class="action-btn" @click="addSubCategory" aria-label="Add Sub-category" title="Add sub-category">
          <FolderPlus :size="12" :stroke-width="1.5" />
        </button>
        <button class="action-btn" @click="addTask" aria-label="Add Task" title="Add task">
          <Plus :size="12" :stroke-width="1.5" />
        </button>
        <button class="action-btn danger" @click="remove" aria-label="Remove" title="Remove">
          <Trash2 :size="12" :stroke-width="1.5" />
        </button>
      </div>
    </div>

    <!-- Children (animated) -->
    <div class="children-container" :class="{ 'is-expanded': category.isExpanded }">
      <div class="children-inner">
        <!-- Sub-categories (recursive) -->
        <CategoryNode 
          v-for="child in category.children" 
          :key="child.id" 
          :category="child" 
          :depth="depth + 1" 
        />

        <!-- Tasks -->
        <div 
          v-for="task in category.tasks" 
          :key="task.id" 
          class="row task-row"
          :style="{ paddingLeft: `${28 + depth * 16}px` }"
        >
          <Circle :size="12" :stroke-width="1.5" class="task-icon" />
          <span class="row-label">{{ task.name }}</span>
          <div class="row-actions" @click.stop>
            <button class="action-btn danger" @click="removeTask(task.id)" aria-label="Remove Task">
              <Trash2 :size="12" :stroke-width="1.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronRight, Plus, FolderPlus, Trash2, Circle } from '@lucide/vue'
import { useCategoryStore, type Category } from '~/stores/category.store'

const props = defineProps<{
  category: Category
  depth: number
}>()

const categoryStore = useCategoryStore()

function addSubCategory() {
  const name = prompt('Sub-category name:')
  if (name) {
    categoryStore.addCategory(props.category.id, name)
  }
}

function addTask() {
  const name = prompt('Task name:')
  if (name) {
    categoryStore.addTask(props.category.id, name)
  }
}

function remove() {
  categoryStore.removeCategory(props.category.id)
}

function removeTask(taskId: string) {
  categoryStore.removeTask(props.category.id, taskId)
}
</script>

<style scoped>
.row {
  display: flex;
  align-items: center;
  height: 30px;
  padding-right: var(--space-3);
  border-radius: var(--radius-medium);
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 13px;
  transition: background-color 100ms ease;
  margin: 0 var(--space-2);
}

.row:hover {
  background-color: var(--bg-hover);
}

.expand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-right: 4px;
  color: var(--text-muted);
  transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
  flex-shrink: 0;
}

.expand-icon.is-expanded {
  transform: rotate(90deg);
}

.row-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  font-weight: 500;
  color: var(--text-primary);
}

.task-row .row-label {
  font-weight: 400;
  color: var(--text-secondary);
}

.task-icon {
  margin-right: var(--space-2);
  color: var(--text-muted);
  flex-shrink: 0;
}

.row-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
  opacity: 0;
  transition: opacity 120ms ease;
}

.row:hover .row-actions {
  opacity: 1;
}

.action-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: var(--radius-micro);
  transition: all 100ms ease;
}

.action-btn:hover {
  background-color: var(--bg-active);
  color: var(--text-primary);
}

.action-btn.danger:hover {
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.08);
}

/* Animated expand/collapse */
.children-container {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 200ms cubic-bezier(0.25, 1, 0.5, 1);
}

.children-container.is-expanded {
  grid-template-rows: 1fr;
}

.children-inner {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
