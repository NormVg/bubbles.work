<template>
  <div class="page">
    <header class="page-header">
      <h1 class="page-title">Yesterday</h1>
      <p class="page-description">Review what happened yesterday.</p>
    </header>
    <div class="board-area">
      <BoardKanbanBoard context="yesterday" />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard'
})
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.page-header {
  flex-shrink: 0;
  margin-bottom: var(--space-6);
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.04em;
  margin-bottom: var(--space-1);
}

.page-description {
  color: var(--text-secondary);
  font-size: 14px;
}

.board-area {
  flex: 1;
  min-height: 0;
}
</style>
