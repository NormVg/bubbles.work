<template>
  <div class="node">
    <!-- Category Row -->
    <div 
      class="row" 
      :style="{ paddingLeft: `${12 + depth * 16}px` }"
    >
      <div class="expand-icon" :class="{ 'is-expanded': category.isExpanded }" @click="categoryStore.toggleCategory(category.id)">
        <ChevronRight :size="12" :stroke-width="1.5" />
      </div>
      <NuxtLink :to="`/dashboard/category/${category.id}`" class="row-label category-link" :class="{ 'is-active-link': $route.path === `/dashboard/category/${category.id}` }">
        {{ category.name }}
      </NuxtLink>
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

        <!-- Topics -->
        <NuxtLink 
          v-for="task in category.tasks" 
          :key="task.id" 
          :to="`/dashboard/topic/${task.id}`"
          class="row task-row"
          :class="{ 'is-active': $route.path === `/dashboard/topic/${task.id}` }"
          :style="{ paddingLeft: `${28 + depth * 16}px` }"
        >
          <Circle :size="12" :stroke-width="1.5" class="task-icon" />
          <span class="row-label">{{ task.name }}</span>
          <div class="row-actions" @click.prevent>
            <button class="action-btn danger" @click.prevent="removeTask(task.id)" aria-label="Remove Topic">
              <Trash2 :size="12" :stroke-width="1.5" />
            </button>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronRight, Plus, FolderPlus, Trash2, Circle } from '@lucide/vue'
import { useCategoryStore, type Category } from '~/stores/category.store'
import { useUIStore } from '~/stores/ui.store'

const props = defineProps<{
  category: Category
  depth: number
}>()

const categoryStore = useCategoryStore()
const uiStore = useUIStore()

async function addSubCategory() {
  const name = await uiStore.promptUser('Sub-Category Name', 'Name')
  if (name) {
    categoryStore.addCategory(props.category.id, name)
  }
}

async function addTask() {
  const name = await uiStore.promptUser('Task Name', 'Name')
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
  margin: 4px var(--space-2);
  text-decoration: none;
}

.row:hover, .row.is-active {
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

.category-link {
  text-decoration: none;
}

.category-link:hover, .is-active-link {
  color: var(--text-primary);
  text-decoration: underline;
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
