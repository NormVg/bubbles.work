<template>
  <NuxtLink
    :to="to"
    class="sidebar-item"
    :class="{ 'is-collapsed': isCollapsed }"
  >
    <div class="icon-wrapper">
      <component :is="icon" :size="18" :stroke-width="1.5" />
    </div>
    <Transition name="fade">
      <span v-if="!isCollapsed" class="label">{{ label }}</span>
    </Transition>
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps<{
  to: string;
  icon: any;
  label: string;
  isCollapsed?: boolean;
}>();
</script>

<style scoped>
.sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 0 var(--space-3);
  height: 34px;
  border-radius: var(--radius-medium);
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 13px;
  transition: color 120ms ease, background-color 120ms ease;
  margin-bottom: 2px;
}

.sidebar-item:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.sidebar-item:active {
  transform: scale(0.98);
}

.router-link-active {
  background-color: var(--bg-active);
  color: var(--text-primary);
  font-weight: 500;
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  flex-shrink: 0;
}

.label {
  white-space: nowrap;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 120ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
