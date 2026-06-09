import { defineStore } from 'pinia'

export interface Workspace {
  id: string
  name: string
  type: 'all' | 'personal' | 'professional' | 'custom'
  color: string
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6']

export const useWorkspaceStore = defineStore('workspace', {
  state: () => ({
    workspaces: [
      { id: 'all', name: 'All Workspaces', type: 'all', color: '#6b7280' },
      { id: 'personal', name: 'Personal', type: 'personal', color: '#3b82f6' },
      { id: 'professional', name: 'Professional', type: 'professional', color: '#f59e0b' }
    ] as Workspace[],
    activeWorkspaceId: 'all'
  }),
  getters: {
    activeWorkspace: (state) => state.workspaces.find(w => w.id === state.activeWorkspaceId) || state.workspaces[0]
  },
  actions: {
    setActiveWorkspace(id: string) {
      this.activeWorkspaceId = id
    },
    addWorkspace(name: string) {
      const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
      const color = COLORS[Math.floor(Math.random() * COLORS.length)]
      this.workspaces.push({ id, name, type: 'custom', color })
      this.activeWorkspaceId = id
    }
  }
})
