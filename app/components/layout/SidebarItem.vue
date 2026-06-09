<template>
  <NuxtLink
    :to="to"
    class="sidebar-item"
    :class="{ 'is-collapsed': isCollapsed }"
  >
    <div class="icon-wrapper">
      <component :is="icon" :size="16" :stroke-width="1.5" />
    </div>
    <Transition name="fade">
      <span v-if="!isCollapsed" class="label">{{ label }}</span>
    </Transition>
    <div v-if="!isCollapsed" class="action-wrapper" @click.prevent>
      <slot name="action" />
    </div>
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
  height: 32px;
  border-radius: var(--radius-medium);
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 13px;
  transition: color 100ms ease, background-color 100ms ease;
  margin-bottom: 1px;
}

.sidebar-item:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.sidebar-item:active {
  transform: scale(0.99);
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
  width: 16px;
  flex-shrink: 0;
}

.label {
  white-space: nowrap;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-wrapper {
  display: flex;
  align-items: center;
  margin-left: auto;
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
