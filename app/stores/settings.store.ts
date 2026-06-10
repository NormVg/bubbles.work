import { defineStore } from 'pinia'

export interface SettingsState {
  compactMode: boolean
  notificationsEnabled: boolean
  defaultWorkspaceId: string | null
  sarvamApiKey: string | null
  sttEngine: 'sarvam' | 'native'
  ollamaApiKey: string | null
  aiModel: string
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    compactMode: false,
    notificationsEnabled: true,
    defaultWorkspaceId: null,
    sarvamApiKey: null,
    sttEngine: 'native',
    ollamaApiKey: null,
    aiModel: 'llama3'
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
    },
    setSarvamApiKey(key: string | null) {
      this.sarvamApiKey = key
    },
    setSttEngine(engine: 'sarvam' | 'native') {
      this.sttEngine = engine
    },
    setOllamaApiKey(key: string | null) {
      this.ollamaApiKey = key
    },
    setAiModel(model: string) {
      this.aiModel = model
    }
  },
  persist: true
})
