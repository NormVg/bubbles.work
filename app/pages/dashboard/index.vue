<template>
  <div class="dashboard-page">
    <h1 class="page-title">Dashboard</h1>
    <p class="page-description">Overview of your workspace activity and performance.</p>
    
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">Total Messages</span>
        <span class="stat-value">1,284</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Open Threads</span>
        <span class="stat-value">23</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Response Rate</span>
        <span class="stat-value">98.2%</span>
      </div>
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-6);
  border-radius: var(--radius-large);
  border: 1px solid var(--border-default);
  background-color: var(--bg-surface-1);
  transition: border-color 120ms ease;
}

.stat-card:hover {
  border-color: var(--border-hover);
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}
</style>
