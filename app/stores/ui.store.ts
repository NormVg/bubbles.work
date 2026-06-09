import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui', {
  state: () => ({
    isSidebarCollapsed: false,
    activeTaskId: null as string | null
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
    }
  },
  persist: true
})
