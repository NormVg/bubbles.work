<template>
  <div class="dashboard-layout">
    <ClientOnly>
      <LayoutSidebar />
    </ClientOnly>
    <main class="main-content">
      <div class="content-container">
        <ClientOnly>
          <slot />
        </ClientOnly>
      </div>
    </main>
    <ClientOnly>
      <BoardTaskDrawer />
    </ClientOnly>
  </div>
</template>

<style scoped>
.dashboard-layout {
  display: flex;
  height: 100vh;
  background-color: var(--bg-surface-1);
  background-image: repeating-linear-gradient(
    -45deg,
    var(--border-default),
    var(--border-default) 1px,
    transparent 1px,
    transparent 8px
  );
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
  display: flex;
  flex-direction: column;
}

.content-container {
  padding: var(--space-8);
  flex: 1;
  min-height: 0;
}
</style>
