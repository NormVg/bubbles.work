// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@nuxtjs/color-mode', '@formkit/auto-animate/nuxt'],
  css: ['~/assets/css/main.css'],
  colorMode: {
    classSuffix: ''
  },
  nitro: {
    experimental: {
      websocket: true
    }
  }
})