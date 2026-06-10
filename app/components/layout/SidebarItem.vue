<template>
  <NuxtLink
    :to="to"
    class="sidebar-item"
    :class="{ 'is-collapsed': isCollapsed }"
  >
    <div class="icon-wrapper">
      <component v-if="icon" :is="icon" :size="16" :stroke-width="1.5" />
      <span v-else-if="textIcon" class="text-icon">{{ textIcon }}</span>
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
  icon?: any;
  textIcon?: string;
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
  transition: all 150ms ease;
  margin-bottom: 4px;
}

.sidebar-item.is-collapsed {
  justify-content: center;
  padding: 0;
  width: 32px;
  margin-left: auto;
  margin-right: auto;
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

.text-icon {
  font-size: 12px;
  font-weight: 600;
  color: currentColor;
  text-align: center;
  line-height: 1;
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
