<template>
  <aside 
    class="sidebar"
    :class="{ 'is-collapsed': uiStore.isSidebarCollapsed }"
  >
    <!-- Branding + Toggle -->
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
            :size="16" 
            :stroke-width="1.5" 
          />
          <PanelLeftOpen 
            v-else 
            key="open" 
            :size="16" 
            :stroke-width="1.5" 
          />
        </Transition>
      </button>
    </div>

    <!-- Workspace Switcher -->
    <div v-if="!uiStore.isSidebarCollapsed" class="workspace-area">
      <LayoutWorkspaceSwitcher :isCollapsed="uiStore.isSidebarCollapsed" />
    </div>

    <!-- Scrollable Nav -->
    <div class="sidebar-scroll">
      
      <!-- Date Navigation -->
      <nav class="nav-section">
        <LayoutSidebarItem 
          to="/dashboard/today"
          :icon="Sun"
          label="Today"
          :isCollapsed="uiStore.isSidebarCollapsed"
        >
          <template #action>
            <button class="inline-action" aria-label="Add today" @click.prevent="addAction('today')">
              <Plus :size="14" :stroke-width="1.5" />
            </button>
          </template>
        </LayoutSidebarItem>
        
        <LayoutSidebarItem 
          to="/dashboard/tomorrow"
          :icon="Sunrise"
          label="Tomorrow"
          :isCollapsed="uiStore.isSidebarCollapsed"
        />

        <LayoutSidebarItem 
          v-for="date in dynamicDates"
          :key="date.id"
          :to="`/dashboard/date/${date.id}`"
          :icon="CalendarIcon"
          :label="date.label"
          :isCollapsed="uiStore.isSidebarCollapsed"
        />

        <LayoutSidebarItem 
          to="/dashboard/yesterday"
          :icon="History"
          label="Yesterday"
          :isCollapsed="uiStore.isSidebarCollapsed"
        />
        
        <LayoutSidebarItem 
          to="/dashboard/calendar"
          :icon="CalendarDays"
          label="Calendar"
          :isCollapsed="uiStore.isSidebarCollapsed"
        />
      </nav>

      <hr v-if="!uiStore.isSidebarCollapsed" class="nav-divider" />

      <!-- Tools -->
      <nav class="nav-section">
        <LayoutSidebarItem 
          to="/dashboard/create"
          :icon="PenLine"
          label="Create"
          :isCollapsed="uiStore.isSidebarCollapsed"
        />
        <LayoutSidebarItem 
          to="/dashboard/bubbles-ai"
          :icon="Sparkles"
          label="Bubbles.ai"
          :isCollapsed="uiStore.isSidebarCollapsed"
        />
        <LayoutSidebarItem 
          to="/dashboard/settings"
          :icon="Settings"
          label="Settings"
          :isCollapsed="uiStore.isSidebarCollapsed"
        />
      </nav>

      <hr v-if="!uiStore.isSidebarCollapsed" class="nav-divider" />

      <!-- Categories -->
      <div v-if="!uiStore.isSidebarCollapsed" class="nav-section categories-section">
        <LayoutCategoryTree />
      </div>

    </div>

    <!-- Footer -->
    <div class="sidebar-footer">
      <div class="user-row" :class="{ 'is-collapsed': uiStore.isSidebarCollapsed }">
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
import { ref } from 'vue'
import { useUIStore } from '~/stores/ui.store'
import { getSidebarDates } from '~/utils/date.utils'
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  User, 
  Sun,
  Sunrise,
  History,
  Calendar as CalendarIcon,
  CalendarDays,
  PenLine,
  Sparkles,
  Plus,
  Settings
} from '@lucide/vue'

const uiStore = useUIStore()
const dynamicDates = ref(getSidebarDates())

function toggle() {
  uiStore.toggleSidebar()
}

function addAction(context: string) {
  alert(`Add action triggered for: ${context}`)
}
</script>

<style scoped>
.sidebar {
  width: 250px;
  height: 100vh;
  background-color: var(--bg-surface-1);
  display: flex;
  flex-direction: column;
  transition: width 200ms cubic-bezier(0.25, 1, 0.5, 1);
  overflow: hidden;
  flex-shrink: 0;
}

.sidebar.is-collapsed {
  width: 60px;
}

/* ── Header ── */
.sidebar-header {
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 var(--space-4);
  flex-shrink: 0;
}

.app-title {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.03em;
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

/* ── Workspace ── */
.workspace-area {
  padding: 0 var(--space-3) var(--space-3);
  flex-shrink: 0;
}

/* ── Scrollable ── */
.sidebar-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

.nav-section {
  padding: var(--space-1) var(--space-2);
  display: flex;
  flex-direction: column;
}

.nav-divider {
  border: none;
  border-top: 1px solid var(--border-default);
  margin: 0 var(--space-4);
  height: 1px;
}

.categories-section {
  padding: 0;
}

.inline-action {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-micro);
  transition: all 120ms ease;
  opacity: 0;
}

:deep(.sidebar-item:hover) .inline-action {
  opacity: 1;
}

.inline-action:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

/* ── Footer ── */
.sidebar-footer {
  padding: var(--space-3);
  flex-shrink: 0;
}

.user-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-1);
  height: 32px;
}

.user-row.is-collapsed {
  justify-content: center;
  padding: 0;
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
  flex: 1;
}

/* ── Transitions ── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 120ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

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
