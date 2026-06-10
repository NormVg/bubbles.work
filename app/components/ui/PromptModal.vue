<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="uiStore.promptConfig" class="modal-overlay" @mousedown.self="cancel">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ uiStore.promptConfig.title }}</h3>
            <button class="icon-btn" @click="cancel" aria-label="Close">
              <X :size="16" :stroke-width="2" />
            </button>
          </div>
          
          <div class="modal-body">
            <div class="input-wrapper">
              <input 
                ref="inputRef"
                v-model="inputValue"
                type="text"
                :placeholder="uiStore.promptConfig.placeholder || 'Type here...'"
                class="prompt-input"
                @keyup.enter="submit"
                @keyup.esc="cancel"
              />
              <div class="mic-container">
                <UiMicButton @update:text="handleDictation" @stop="preDictationValue = ''" />
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="cancel">Cancel</button>
            <button class="btn btn-primary" @click="submit" :disabled="!inputValue.trim()">Confirm</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { X } from '@lucide/vue'
import { useUIStore } from '~/stores/ui.store'

const uiStore = useUIStore()

const inputValue = ref('')
const preDictationValue = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

watch(() => uiStore.promptConfig, (newConfig) => {
  if (newConfig) {
    inputValue.value = newConfig.defaultValue || ''
    nextTick(() => {
      if (inputRef.value) {
        inputRef.value.focus()
      }
    })
  } else {
    inputValue.value = ''
  }
})

function submit() {
  if (!inputValue.value.trim()) return
  uiStore.resolvePrompt(inputValue.value.trim())
}

function cancel() {
  uiStore.resolvePrompt(null)
}

function handleDictation(text: string) {
  if (!preDictationValue.value && !text) {
    preDictationValue.value = inputValue.value
  }
  
  if (preDictationValue.value) {
    inputValue.value = preDictationValue.value + (preDictationValue.value.endsWith(' ') ? '' : ' ') + text
  } else {
    inputValue.value = text
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background-color: var(--bg-root);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  width: 440px;
  max-width: 90vw;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: scale(1);
}

html.dark .modal-content {
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
  background-color: var(--bg-surface-1);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-6) var(--space-6) var(--space-2) var(--space-6);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 50%;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: -4px;
  margin-right: -4px;
}

.icon-btn:hover {
  background-color: var(--bg-surface-2);
  color: var(--text-primary);
}

.modal-body {
  padding: 0 var(--space-6) var(--space-2) var(--space-6);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.prompt-input {
  width: 100%;
  padding: 12px 48px 12px 16px; /* extra padding for mic button */
  border: 1px solid var(--border-default);
  border-radius: var(--radius-large);
  background-color: var(--bg-surface-2);
  color: var(--text-primary);
  font-size: 15px;
  outline: none;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.02);
}

.mic-container {
  position: absolute;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.prompt-input:focus {
  background-color: var(--bg-root);
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.02);
}

.prompt-input::placeholder {
  color: var(--text-muted);
  opacity: 0.7;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-6) var(--space-6) var(--space-6);
  background-color: transparent;
}

.btn {
  padding: 10px 24px;
  border-radius: var(--radius-large);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: transparent;
  color: var(--text-secondary);
  border-color: transparent;
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--bg-surface-2);
  color: var(--text-primary);
}

.btn-primary {
  background-color: #171717;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

html.dark .btn-primary {
  background-color: #ffffff;
  color: #171717;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

/* Transitions */
.modal-enter-active {
  transition: all 260ms cubic-bezier(0.0, 0.0, 0.2, 1); /* ease-out for entrance */
}
.modal-leave-active {
  transition: all 200ms cubic-bezier(0.4, 0.0, 1, 1); /* ease-in for exit */
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content {
  transform: scale(0.95) translateY(15px);
}
.modal-leave-to .modal-content {
  transform: scale(0.95) translateY(10px);
}
</style>
