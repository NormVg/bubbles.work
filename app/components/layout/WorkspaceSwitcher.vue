<template>
  <div class="workspace-switcher">
    <button class="switcher-trigger" @click="isOpen = !isOpen">
      <div class="trigger-left">
        <div class="ws-icon" :style="{ backgroundColor: activeWorkspace?.color + '20', color: activeWorkspace?.color }">
          <Briefcase v-if="activeWorkspace?.type === 'professional'" :size="13" :stroke-width="1.5" />
          <User v-else-if="activeWorkspace?.type === 'personal'" :size="13" :stroke-width="1.5" />
          <Globe v-else :size="13" :stroke-width="1.5" />
        </div>
        <span class="ws-name">{{ activeWorkspace?.name }}</span>
      </div>
      <ChevronDown class="chevron" :class="{ 'is-open': isOpen }" :size="12" :stroke-width="1.5" />
    </button>

    <Transition name="dropdown">
      <div v-if="isOpen" class="dropdown">
        <span class="dropdown-label">Workspaces</span>
        <button 
          v-for="ws in workspaceStore.workspaces" 
          :key="ws.id"
          class="dropdown-item"
          :class="{ 'is-active': ws.id === activeWorkspace?.id }"
          @click="selectWorkspace(ws.id)"
        >
          <div class="ws-color-dot" :style="{ backgroundColor: ws.color }" />
          {{ ws.name }}
        </button>
        
        <div class="dropdown-divider" />
        
        <button class="dropdown-item" @click="addWorkspace">
          <Plus :size="13" :stroke-width="1.5" class="item-icon" />
          Add Workspace
        </button>
      </div>
    </Transition>

    <div v-if="isOpen" class="backdrop" @click="isOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Briefcase, User, Globe, ChevronDown, Check, Plus } from '@lucide/vue'
import { useWorkspaceStore } from '~/stores/workspace.store'
import { useUIStore } from '~/stores/ui.store'

defineProps<{
  isCollapsed: boolean
}>()

const workspaceStore = useWorkspaceStore()
const uiStore = useUIStore()
const isOpen = ref(false)

const activeWorkspace = computed(() => workspaceStore.activeWorkspace)

function selectWorkspace(id: string) {
  workspaceStore.setActiveWorkspace(id)
  isOpen.value = false
}

async function addWorkspace() {
  const name = await uiStore.promptUser('Workspace Name')
  if (name) {
    workspaceStore.addWorkspace(name)
    isOpen.value = false
  }
}
</script>

<style scoped>
.workspace-switcher {
  position: relative;
  width: 100%;
}

.switcher-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-surface-1);
  border: 1px dashed var(--border-default);
  padding: 6px var(--space-3) 6px 6px;
  border-radius: var(--radius-medium);
  cursor: pointer;
  transition: all 150ms ease;
  color: var(--text-primary);
}

.switcher-trigger:hover {
  border-style: solid;
  border-color: var(--border-strong);
  background-color: var(--bg-root);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.switcher-trigger:active {
  transform: scale(0.99);
}

.trigger-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  overflow: hidden;
}

.ws-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: var(--radius-medium);
  flex-shrink: 0;
  transition: background-color 150ms ease, color 150ms ease;
}

.ws-name {
  font-weight: 500;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chevron {
  color: var(--text-muted);
  transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
  flex-shrink: 0;
}

.chevron.is-open {
  transform: rotate(180deg);
}

/* ── Dropdown ── */
.dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background-color: var(--bg-surface-1);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-large);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02);
  padding: var(--space-1);
  z-index: 100;
}

html.dark .dropdown {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
}

.dropdown-label {
  display: block;
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-muted);
  font-weight: 600;
  padding: var(--space-2) var(--space-2);
  letter-spacing: 0.05em;
}

.dropdown-item {
  display: flex;
  align-items: center;
  width: 100%;
  background: none;
  border: none;
  padding: 8px var(--space-3);
  border-radius: var(--radius-medium);
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  transition: background-color 100ms ease, color 100ms ease;
  text-align: left;
}

.dropdown-item:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.dropdown-item.is-active {
  background-color: var(--bg-active);
  color: var(--text-primary);
  font-weight: 500;
}

.item-icon {
  margin-right: var(--space-2);
  color: var(--text-muted);
  flex-shrink: 0;
}

.ws-color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: var(--space-2);
  flex-shrink: 0;
}

.dropdown-divider {
  height: 1px;
  background-color: var(--border-default);
  margin: var(--space-1) var(--space-1);
}

/* ── Backdrop ── */
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 99;
}

/* ── Animations ── */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 120ms ease, transform 120ms cubic-bezier(0.19, 1, 0.22, 1);
  transform-origin: top center;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.97) translateY(-4px);
}
</style>
