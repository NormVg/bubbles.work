<template>
  <div class="page">
    <header class="page-header">
      <h1 class="page-title">Settings</h1>
      <p class="page-description">Manage your application preferences and workspace settings.</p>
    </header>

    <div class="settings-content">
      


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

      <!-- Voice & AI -->
      <section class="settings-section">
        <h2 class="section-title">Voice & AI</h2>
        
        <div class="setting-item">
          <div class="setting-info">
            <h3 class="setting-name">Speech-to-Text Engine</h3>
            <p class="setting-desc">Choose which engine handles your voice dictation.</p>
          </div>
          <div class="theme-options">
            <button class="theme-btn" :class="{ 'is-active': settingsStore.sttEngine === 'native' }" @click="settingsStore.setSttEngine('native')">Native</button>
            <button class="theme-btn" :class="{ 'is-active': settingsStore.sttEngine === 'sarvam' }" @click="settingsStore.setSttEngine('sarvam')">Sarvam AI</button>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <h3 class="setting-name">Sarvam API Key</h3>
            <p class="setting-desc">Enter your Sarvam AI key to enable premium streaming speech-to-text. Required when using Sarvam Engine.</p>
          </div>
          <div class="setting-action">
            <input 
              v-model="sarvamKeyInput"
              type="password"
              placeholder="sk_..."
              class="text-input"
              @blur="saveSarvamKey"
            />
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <h3 class="setting-name">Ollama API Key</h3>
            <p class="setting-desc">Enter your Ollama API key for the Brain Dump AI. Required for task extraction.</p>
          </div>
          <div class="setting-action">
            <input 
              v-model="ollamaKeyInput"
              type="password"
              placeholder="sk_..."
              class="text-input"
              @blur="saveOllamaKey"
            />
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <h3 class="setting-name">AI Model</h3>
            <p class="setting-desc">Enter the Ollama model to use for task extraction (e.g. llama3.1, deepseek-r1:7b, etc).</p>
          </div>
          <div class="setting-action">
            <input 
              v-model="aiModelInput"
              type="text"
              placeholder="e.g. llama3.1"
              class="text-input"
              @blur="saveAiModel"
            />
          </div>
        </div>

        <div class="setting-item test-area">
          <div class="setting-info">
            <h3 class="setting-name">Test Microphone</h3>
            <p class="setting-desc">Click the microphone to test the currently selected STT engine in real-time.</p>
          </div>
          <div class="test-controls">
            <UiMicButton @update:text="handleDictation" @error="handleError" @stop="clearError" />
          </div>
        </div>
        <div class="test-transcript" :class="{ 'has-error-text': testError }">
          <span v-if="testError">{{ testError }}</span>
          <span v-else-if="testTranscript">{{ testTranscript }}</span>
          <span v-else class="placeholder-text">Transcribed text will appear here...</span>
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

const sarvamKeyInput = ref(settingsStore.sarvamApiKey || '')
const ollamaKeyInput = ref(settingsStore.ollamaApiKey || '')
const aiModelInput = ref(settingsStore.aiModel || 'llama3.1')
const testTranscript = ref('')
const testError = ref('')

function saveSarvamKey() {
  settingsStore.setSarvamApiKey(sarvamKeyInput.value.trim() || null)
}

function saveOllamaKey() {
  settingsStore.setOllamaApiKey(ollamaKeyInput.value.trim() || null)
}

function saveAiModel() {
  settingsStore.setAiModel(aiModelInput.value.trim() || 'llama3.1')
}

function handleDictation(text: string) {
  testTranscript.value = text
  testError.value = ''
}

function handleError(err: string) {
  testError.value = err
}

function clearError() {
  // Option to clear error on stop, or keep it visible
}
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

/* ── Inputs ── */
.text-input {
  width: 320px; /* Made slightly wider */
  padding: 10px 14px; /* Better padding */
  border: 1px solid var(--border-default);
  border-radius: var(--radius-medium);
  background-color: var(--bg-surface-2);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.text-input:focus {
  background-color: var(--bg-root);
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

/* ── Test Area ── */
.test-area {
  border-bottom: none !important;
  padding-bottom: var(--space-2) !important;
  margin-top: var(--space-4); /* Add some space above test area */
}

.test-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-surface-2);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-full);
  padding: 4px; /* Give it some padding so it looks like a proper button background */
}

.test-transcript {
  min-height: 80px;
  background-color: var(--bg-root);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-medium);
  padding: var(--space-3) var(--space-4); /* Better padding */
  font-size: 14px;
  color: var(--text-primary);
  margin-bottom: var(--space-4);
  line-height: 1.5;
  white-space: pre-wrap;
  display: flex;
  align-items: flex-start;
}

.test-transcript.has-error-text {
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);
  background-color: rgba(239, 68, 68, 0.05);
}

.placeholder-text {
  color: var(--text-muted);
  opacity: 0.7;
  font-style: italic;
}
</style>
