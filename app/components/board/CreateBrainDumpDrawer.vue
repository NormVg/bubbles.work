<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="uiStore.isCreateDrawerOpen" class="drawer-overlay" @click.self="close">
        <div class="drawer-content">
          <!-- Header -->
          <div class="drawer-header">
            <div class="header-left">
              <span class="drawer-title">Brain Dump</span>
            </div>
            <div class="header-actions">
              <button class="icon-btn" @click="close" aria-label="Close" title="Close">
                <X :size="16" :stroke-width="2" />
              </button>
            </div>
          </div>
          
          <div class="drawer-body">
            <p class="description">
              Dump your mind here. Speak, type, or paste content. Our AI will extract structured tasks automatically.
            </p>

            <div class="dump-container">
              <textarea 
                v-model="dumpText"
                class="dump-textarea"
                placeholder="Start typing or click the mic to speak..."
                ref="textareaRef"
              ></textarea>
              
              <div class="dump-toolbar">
                <div class="toolbar-left">
                  <UiMicButton 
                    @update:text="handleDictation" 
                    @stop="handleMicStop" 
                  />
                  <!-- File upload placeholder (for future PDF/Image support) -->
                  <button class="icon-btn" title="Attach file" disabled style="opacity: 0.5;">
                    <Paperclip :size="16" />
                  </button>
                </div>
                <div class="toolbar-right">
                  <button 
                    class="extract-btn" 
                    @click="extractTasks" 
                    :disabled="isExtracting || !dumpText.trim()"
                  >
                    <Loader2 v-if="isExtracting" class="spinner" :size="14" />
                    <Sparkles v-else :size="14" />
                    <span>{{ isExtracting ? 'Extracting...' : 'Extract Tasks' }}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Error State -->
            <div v-if="error" class="error-banner">
              <AlertCircle :size="14" />
              <span>{{ error }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { X, Sparkles, Paperclip, Loader2, AlertCircle } from '@lucide/vue'
import { useUIStore } from '~/stores/ui.store'
import { useSettingsStore } from '~/stores/settings.store'
import { useTaskStore } from '~/stores/task.store'
import UiMicButton from '~/components/ui/MicButton.vue'

const uiStore = useUIStore()
const settingsStore = useSettingsStore()
const taskStore = useTaskStore()

const dumpText = ref('')
const isExtracting = ref(false)
const error = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

let lastTranscript = ''

function handleDictation(text: string) {
  if (!lastTranscript) {
    // New recording session, add space if needed
    if (dumpText.value && !dumpText.value.endsWith(' ') && !dumpText.value.endsWith('\n')) {
      dumpText.value += ' '
    }
    dumpText.value += text
  } else {
    // Replace the part from this session
    const prefix = dumpText.value.slice(0, dumpText.value.length - lastTranscript.length)
    dumpText.value = prefix + text
  }
  lastTranscript = text
  
  // Auto-scroll to bottom
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.scrollTop = textareaRef.value.scrollHeight
    }
  })
}

function handleMicStop() {
  lastTranscript = ''
}

function close() {
  uiStore.closeCreateDrawer()
  dumpText.value = ''
  error.value = ''
}

async function extractTasks() {
  if (!dumpText.value.trim()) return
  if (!settingsStore.ollamaApiKey) {
    error.value = 'Please configure your Ollama API Key in Settings.'
    return
  }

  isExtracting.value = true
  error.value = ''

  try {
    const res = await fetch('/api/extract-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: dumpText.value,
        ollamaApiKey: settingsStore.ollamaApiKey,
        aiModel: settingsStore.aiModel
      })
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || 'Extraction failed')
    }

    const data = await res.json()
    if (data.tasks && Array.isArray(data.tasks)) {
      data.tasks.forEach((t: any) => {
        taskStore.addTask(t.title, t.context || 'today')
        // We'll also try to apply priority and description
        const lastTask = taskStore.tasks[taskStore.tasks.length - 1]
        if (t.priority) taskStore.updateCustomProperty(lastTask.id, 'prop-priority', t.priority)
        if (t.description) taskStore.updateTaskField(lastTask.id, 'description', `<p>${t.description}</p>`)
      })
      close()
    } else {
      throw new Error('Invalid response format from AI')
    }
  } catch (err: any) {
    console.error('[ExtractTasks]', err)
    error.value = err.message || 'An error occurred during extraction.'
  } finally {
    isExtracting.value = false
  }
}
</script>

<style scoped>
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(2px);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.drawer-content {
  width: 600px;
  max-width: 100vw;
  height: 100vh;
  background-color: var(--bg-root);
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
}

html.dark .drawer-content {
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.5);
  border-left: 1px solid var(--border-default);
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-6);
  min-height: 48px;
  background-color: transparent;
}

.drawer-title {
  font-weight: 600;
  font-size: 15px;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  align-items: center;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 6px;
  border-radius: var(--radius-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms ease;
}

.icon-btn:hover {
  background-color: var(--bg-surface-2);
  color: var(--text-primary);
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2) var(--space-6) var(--space-16) var(--space-6);
  display: flex;
  flex-direction: column;
}

.description {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: var(--space-6);
  line-height: 1.5;
}

.dump-container {
  display: flex;
  flex-direction: column;
  background-color: var(--bg-surface-1);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-large);
  overflow: hidden;
  transition: border-color 200ms ease;
  min-height: 300px;
}

.dump-container:focus-within {
  border-color: var(--border-strong);
  box-shadow: 0 0 0 2px var(--bg-surface-2);
}

.dump-textarea {
  flex: 1;
  width: 100%;
  resize: none;
  border: none;
  background: transparent;
  padding: var(--space-4);
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-primary);
  outline: none;
  min-height: 240px;
}

.dump-textarea::placeholder {
  color: var(--text-muted);
  opacity: 0.6;
}

.dump-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  background-color: var(--bg-surface-2);
  border-top: 1px solid var(--border-default);
}

.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.extract-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--text-primary);
  color: var(--bg-root);
  border: none;
  border-radius: var(--radius-medium);
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms ease;
}

.extract-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: scale(0.98);
}

.extract-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  animation: spin 1s linear infinite;
}

.error-banner {
  margin-top: var(--space-4);
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: var(--space-3);
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-radius: var(--radius-medium);
  font-size: 13px;
  line-height: 1.4;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ── Transitions ── */
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 300ms ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-active .drawer-content,
.drawer-leave-active .drawer-content {
  transition: transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.drawer-enter-from .drawer-content,
.drawer-leave-to .drawer-content {
  transform: translateX(100%);
}
</style>
