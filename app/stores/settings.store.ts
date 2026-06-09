import { defineStore } from 'pinia'

export interface SettingsState {
  compactMode: boolean
  notificationsEnabled: boolean
  defaultWorkspaceId: string | null
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    compactMode: false,
    notificationsEnabled: true,
    defaultWorkspaceId: null
  }),
  actions: {
    toggleCompactMode() {
      this.compactMode = !this.compactMode
    },
    toggleNotifications() {
      this.notificationsEnabled = !this.notificationsEnabled
    },
    setDefaultWorkspace(id: string) {
      this.defaultWorkspaceId = id
    }
  },
  persist: true
})
