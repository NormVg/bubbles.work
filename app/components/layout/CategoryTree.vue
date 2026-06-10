<template>
  <div class="category-tree">
    <div class="tree-header">
      <span class="header-label">Categories</span>
      <button class="header-action" @click="addRootCategory" aria-label="Add Category">
        <Plus :size="14" :stroke-width="1.5" />
      </button>
    </div>

    <div class="tree-list">
      <CategoryNode 
        v-for="category in visibleCategories" 
        :key="category.id" 
        :category="category" 
        :depth="0" 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Plus } from '@lucide/vue'
import { useCategoryStore } from '~/stores/category.store'
import { useWorkspaceStore } from '~/stores/workspace.store'
import { useUIStore } from '~/stores/ui.store'
import CategoryNode from './CategoryNode.vue'

const categoryStore = useCategoryStore()
const workspaceStore = useWorkspaceStore()
const uiStore = useUIStore()

const visibleCategories = computed(() => {
  if (workspaceStore.activeWorkspaceId === 'all') {
    return categoryStore.categories
  }
  return categoryStore.categories.filter(c => 
    !c.workspaceId || c.workspaceId === workspaceStore.activeWorkspaceId
  )
})

async function addRootCategory() {
  const name = await uiStore.promptUser('Category Name')
  if (name) {
    categoryStore.addCategory(null, name, workspaceStore.activeWorkspaceId === 'all' ? undefined : workspaceStore.activeWorkspaceId)
  }
}
</script>

<style scoped>
.category-tree {
  display: flex;
  flex-direction: column;
}

.tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
}

.header-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.header-action {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-micro);
  transition: all 120ms ease;
}

.header-action:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.tree-list {
  display: flex;
  flex-direction: column;
}
</style>
