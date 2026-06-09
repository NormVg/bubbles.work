<template>
  <div class="page">
    <header class="page-header">
      <h1 class="page-title">Settings</h1>
      <p class="page-description">Manage your application preferences and workspace settings.</p>
    </header>

    <div class="settings-content">
      
      <!-- General Settings -->
      <section class="settings-section">
        <h2 class="section-title">General</h2>
        
        <div class="setting-item">
          <div class="setting-info">
            <h3 class="setting-name">Compact Mode</h3>
            <p class="setting-desc">Reduce padding and margin across the application to fit more content on screen.</p>
          </div>
          <button 
            class="toggle-btn" 
            :class="{ 'is-active': settingsStore.compactMode }"
            @click="settingsStore.toggleCompactMode()"
            :aria-pressed="settingsStore.compactMode"
          >
            <div class="toggle-thumb" />
          </button>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <h3 class="setting-name">Notifications</h3>
            <p class="setting-desc">Enable push notifications for important workspace updates.</p>
          </div>
          <button 
            class="toggle-btn" 
            :class="{ 'is-active': settingsStore.notificationsEnabled }"
            @click="settingsStore.toggleNotifications()"
            :aria-pressed="settingsStore.notificationsEnabled"
          >
            <div class="toggle-thumb" />
          </button>
        </div>
      </section>

      <!-- Appearance -->
      <section class="settings-section">
        <h2 class="section-title">Appearance</h2>
        
        <div class="setting-item">
          <div class="setting-info">
            <h3 class="setting-name">Theme</h3>
            <p class="setting-desc">Select your preferred color theme.</p>
          </div>
          <div class="theme-options">
            <button class="theme-btn" :class="{ 'is-active': colorMode.preference === 'system' }" @click="colorMode.preference = 'system'">System</button>
            <button class="theme-btn" :class="{ 'is-active': colorMode.preference === 'light' }" @click="colorMode.preference = 'light'">Light</button>
            <button class="theme-btn" :class="{ 'is-active': colorMode.preference === 'dark' }" @click="colorMode.preference = 'dark'">Dark</button>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings.store'

definePageMeta({
  layout: 'dashboard'
})

const settingsStore = useSettingsStore()
const colorMode = useColorMode()
</script>

<style scoped>
.page {
  max-width: 800px;
  width: 100%;
}

.page-header {
  margin-bottom: var(--space-8);
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.04em;
  margin-bottom: var(--space-1);
}

.page-description {
  color: var(--text-secondary);
  font-size: 14px;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.settings-section {
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--border-default);
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) 0;
}

.setting-item + .setting-item {
  border-top: 1px solid var(--border-default);
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 500px;
}

.setting-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.setting-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* ── Custom Toggle Switch ── */
.toggle-btn {
  width: 40px;
  height: 24px;
  border-radius: var(--radius-full);
  background-color: var(--bg-surface-3);
  border: 1px solid var(--border-strong);
  position: relative;
  cursor: pointer;
  transition: background-color 200ms ease, border-color 200ms ease;
  flex-shrink: 0;
}

.toggle-btn.is-active {
  background-color: var(--text-primary);
  border-color: var(--text-primary);
}

.toggle-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: var(--bg-root);
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 200ms cubic-bezier(0.25, 1, 0.5, 1);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.toggle-btn.is-active .toggle-thumb {
  transform: translateX(16px);
}

/* ── Theme Buttons ── */
.theme-options {
  display: flex;
  background-color: var(--bg-surface-2);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-medium);
  padding: 2px;
}

.theme-btn {
  background: transparent;
  border: none;
  padding: 6px var(--space-4);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  border-radius: var(--radius-micro);
  cursor: pointer;
  transition: all 150ms ease;
}

.theme-btn:hover {
  color: var(--text-primary);
}

.theme-btn.is-active {
  background-color: var(--bg-root);
  color: var(--text-primary);
  box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px var(--border-default);
}
</style>
