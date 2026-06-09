<template>
  <div class="dashboard-layout">
    <LayoutSidebar />
    <main class="main-content">
      <div class="content-container">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
.dashboard-layout {
  display: flex;
  height: 100vh;
  background-color: var(--bg-surface-1);
  overflow: hidden;
}

.main-content {
  flex: 1;
  margin: var(--space-2);
  margin-left: 0;
  background-color: var(--bg-root);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-default);
  overflow-y: auto;
}

.content-container {
  padding: var(--space-8);
  max-width: 1000px;
}
</style>
