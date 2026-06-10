import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui', {
  state: () => ({
    isSidebarCollapsed: false,
    activeTaskId: null as string | null,
    promptConfig: null as { title: string; defaultValue?: string; placeholder?: string } | null,
    promptResolve: null as ((value: string | null) => void) | null,
  }),
  actions: {
    toggleSidebar() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed
    },
    setSidebarCollapsed(value: boolean) {
      this.isSidebarCollapsed = value
    },
    openTaskDrawer(taskId: string) {
      this.activeTaskId = taskId
    },
    closeTaskDrawer() {
      this.activeTaskId = null
    },
    promptUser(title: string, placeholder?: string, defaultValue?: string): Promise<string | null> {
      return new Promise((resolve) => {
        this.promptConfig = { title, placeholder, defaultValue }
        this.promptResolve = resolve
      })
    },
    resolvePrompt(value: string | null) {
      if (this.promptResolve) {
        this.promptResolve(value)
      }
      this.promptConfig = null
      this.promptResolve = null
    }
  },
  persist: {
    pick: ['isSidebarCollapsed', 'activeTaskId']
  }
})
