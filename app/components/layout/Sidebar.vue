<template>
  <aside 
    class="sidebar"
    :class="{ 'is-collapsed': uiStore.isSidebarCollapsed }"
  >
    <div class="sidebar-header">
      <Transition name="fade">
        <span v-if="!uiStore.isSidebarCollapsed" class="app-title">Bubbles.work</span>
      </Transition>
      <button 
        class="collapse-toggle" 
        @click="toggle" 
        aria-label="Toggle Sidebar"
      >
        <Transition name="icon-morph" mode="out-in">
          <PanelLeftClose 
            v-if="!uiStore.isSidebarCollapsed" 
            key="close" 
            :size="18" 
            :stroke-width="1.5" 
          />
          <PanelLeftOpen 
            v-else 
            key="open" 
            :size="18" 
            :stroke-width="1.5" 
          />
        </Transition>
      </button>
    </div>

    <nav class="sidebar-nav">
      <LayoutSidebarItem 
        to="/dashboard"
        :icon="LayoutDashboard"
        label="Dashboard"
        :isCollapsed="uiStore.isSidebarCollapsed"
      />
      <LayoutSidebarItem 
        to="/dashboard/messages"
        :icon="Mail"
        label="Messages"
        :isCollapsed="uiStore.isSidebarCollapsed"
      />
      <LayoutSidebarItem 
        to="/dashboard/settings"
        :icon="Settings"
        label="Settings"
        :isCollapsed="uiStore.isSidebarCollapsed"
      />
    </nav>

    <div class="sidebar-footer">
      <div class="user-row">
        <div class="avatar">
          <User :size="14" :stroke-width="1.5" />
        </div>
        <Transition name="fade">
          <span v-if="!uiStore.isSidebarCollapsed" class="user-email">thenormvg@gmail.com</span>
        </Transition>
        <Transition name="fade">
          <ThemeSwitcher v-if="!uiStore.isSidebarCollapsed" />
        </Transition>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useUIStore } from '~/stores/ui.store'
import { PanelLeftClose, PanelLeftOpen, LayoutDashboard, Mail, Settings, User } from '@lucide/vue'

const uiStore = useUIStore()

function toggle() {
  uiStore.toggleSidebar()
}
</script>

<style scoped>
.sidebar {
  width: 220px;
  height: 100vh;
  background-color: var(--bg-surface-1);
  display: flex;
  flex-direction: column;
  transition: width 200ms cubic-bezier(0.25, 1, 0.5, 1);
  overflow: hidden;
  flex-shrink: 0;
}

.sidebar.is-collapsed {
  width: 56px;
}

.sidebar-header {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-3);
  flex-shrink: 0;
}

.app-title {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.02em;
  white-space: nowrap;
  color: var(--text-primary);
}

.collapse-toggle {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-medium);
  transition: color 120ms ease, background-color 120ms ease;
  margin-left: auto;
  flex-shrink: 0;
}

.collapse-toggle:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.collapse-toggle:active {
  transform: scale(0.92);
}

.sidebar-nav {
  flex: 1;
  padding: var(--space-2) var(--space-2);
  overflow-y: auto;
}

.sidebar-footer {
  padding: var(--space-3) var(--space-2);
  flex-shrink: 0;
}

.user-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-1);
  height: 32px;
}

.avatar {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-full);
  background-color: var(--bg-surface-3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--text-secondary);
}

.user-email {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Fade for text ── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 120ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ── Icon Morph (Maya icon swap) ── */
.icon-morph-enter-active {
  transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 300ms ease;
}
.icon-morph-leave-active {
  transition: transform 120ms ease-in, opacity 120ms ease-in;
}
.icon-morph-enter-from {
  transform: scale(0.6) rotate(-90deg);
  opacity: 0;
}
.icon-morph-leave-to {
  transform: scale(0.6) rotate(90deg);
  opacity: 0;
}
</style>
