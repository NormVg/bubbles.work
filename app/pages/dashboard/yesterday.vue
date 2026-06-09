<template>
  <div class="page">
    <h1 class="page-title">Yesterday</h1>
    <p class="page-description">Review what happened yesterday.</p>
    <div class="placeholder-card">
      <p class="placeholder-text">Content coming soon</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard'
})
</script>

<style scoped>
.page-title {
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.04em;
  margin-bottom: var(--space-1);
}
.page-description {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: var(--space-8);
}
.placeholder-card {
  border: 1px dashed var(--border-default);
  border-radius: var(--radius-large);
  padding: var(--space-12);
  display: flex;
  align-items: center;
  justify-content: center;
}
.placeholder-text {
  color: var(--text-muted);
  font-size: 14px;
}
</style>
