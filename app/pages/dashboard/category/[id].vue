<template>
  <div class="page-container">
    <header class="page-header">
      <div class="header-left">
        <LayoutBreadcrumbs :items="breadcrumbs" />
        <h1 class="page-title">{{ categoryName }}</h1>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="handleAddSubCategory">
          <Plus :size="16" />
          <span>Add Sub-category</span>
        </button>
        <button class="btn btn-primary" @click="handleAddTopic">
          <Plus :size="16" />
          <span>Add Topic</span>
        </button>
      </div>
    </header>

    <!-- Sub-categories pills -->
    <div v-if="subCategories.length > 0" class="sub-categories-list">
      <NuxtLink
        v-for="subCat in subCategories"
        :key="subCat.id"
        :to="`/dashboard/category/${subCat.id}`"
        class="sub-category-pill"
      >
        <FolderTree :size="14" class="icon" />
        {{ subCat.name }}
      </NuxtLink>
    </div>

    <div class="board-area">
      <BoardKanbanBoard 
        :context="categoryId"
        :is-category-board="true"
        :columns="topicColumns"
        @rename-column="handleRenameTopic"
        @add-column="handleAddTopic"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Plus, FolderTree } from '@lucide/vue'
import { useCategoryStore } from '~/stores/category.store'
import { useNavigation } from '~/composables/useNavigation'
import { useTopicSwitcher } from '~/composables/useTopicSwitcher'

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const categoryId = computed(() => route.params.id as string)

const categoryStore = useCategoryStore()
const navigation = useNavigation()
const topicSwitcher = useTopicSwitcher()

const categoryName = computed(() => {
  const breadcrumbs = navigation.getBreadcrumbs(categoryId.value, 'category')
  return breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : 'Category'
})

const breadcrumbs = computed(() => {
  return navigation.getBreadcrumbs(categoryId.value, 'category')
})

const subCategories = computed(() => {
  const search = (categories: any[]): any[] => {
    for (const cat of categories) {
      if (cat.id === categoryId.value) return cat.children || []
      if (cat.children && cat.children.length > 0) {
        const found = search(cat.children)
        if (found.length) return found
      }
    }
    return []
  }
  return search(categoryStore.categories)
})

const topicColumns = computed(() => {
  const topics = topicSwitcher.getTopicsByCategory(categoryId.value)
  return topics.map(t => ({
    id: t.id,
    title: t.name,
    color: t.color
  }))
})

function handleRenameTopic(topicId: string, newName: string) {
  categoryStore.renameTask(categoryId.value, topicId, newName)
}

function handleAddTopic() {
  const name = window.prompt('Enter new topic name:')
  if (name && name.trim()) {
    categoryStore.addTask(categoryId.value, name.trim())
  }
}

function handleAddSubCategory() {
  const name = window.prompt('Enter sub-category name:')
  if (name && name.trim()) {
    categoryStore.addCategory(categoryId.value, name.trim())
  }
}
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.page-header {
  margin-bottom: var(--space-4);
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.header-left {
  display: flex;
  flex-direction: column;
}

.header-actions {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-1);
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-top: var(--space-2);
}

.sub-categories-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border-default);
}

.sub-category-pill {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px 12px;
  background-color: var(--bg-surface-2);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-large);
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  transition: all 150ms ease;
}

.sub-category-pill:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
  border-color: var(--text-muted);
}

.sub-category-pill .icon {
  color: var(--text-muted);
}

.board-area {
  flex: 1;
  display: flex;
  min-height: 0;
}
</style>
