import { watch } from 'vue'
import { type PiniaPluginContext } from 'pinia'

export default defineNuxtPlugin((nuxtApp) => {
  // @ts-ignore - pinia is attached to nuxtApp
  nuxtApp.$pinia?.use(({ store, options }: PiniaPluginContext) => {
    if (options.persist) {
      const storageKey = `bubbles-store-${store.$id}`
      
      // Load initial state
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        try {
          store.$patch(JSON.parse(stored))
        } catch (e) {
          console.error(`Failed to restore ${store.$id} state`, e)
        }
      }
      
      // Watch for changes and save
      watch(
        () => store.$state,
        (state) => {
          localStorage.setItem(storageKey, JSON.stringify(state))
        },
        { deep: true }
      )
    }
  })
})
