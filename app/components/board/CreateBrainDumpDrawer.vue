<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="uiStore.isCreateDrawerOpen" class="drawer-overlay" @click.self="close">
        <div class="drawer-content">
          <!-- Header -->
          <div class="drawer-header">
            <div class="header-left">
              <span class="drawer-title">AI Task Assistant</span>
            </div>
            <div class="header-actions">
              <button class="icon-btn" @click="close" aria-label="Close" title="Close">
                <X :size="16" :stroke-width="2" />
              </button>
            </div>
          </div>
          
          <div class="drawer-body">
            <!-- INPUT STAGE -->
            <template v-if="viewState === 'input' || viewState === 'drafting'">
              <p class="description">
                Jot down your thoughts, paste a conversation, or dictate via mic. AI will draft structured tasks for you to review.
              </p>

              <div class="editor-container" :class="{ 'is-drafting': viewState === 'drafting' }">
                <textarea 
                  v-model="dumpText"
                  class="editor-textarea"
                  placeholder="Type or click the mic to speak..."
                  ref="textareaRef"
                  :disabled="viewState === 'drafting'"
                ></textarea>
                
                <div class="editor-toolbar">
                  <div class="toolbar-left">
                    <UiMicButton 
                      @update:text="handleDictation" 
                      @stop="handleMicStop" 
                    />
                  </div>
                  <div class="toolbar-right">
                    <button 
                      class="btn-generate" 
                      @click="extractTasks" 
                      :disabled="viewState === 'drafting' || !dumpText.trim()"
                    >
                      <Loader2 v-if="viewState === 'drafting'" class="spinner" :size="16" />
                      <Sparkles v-else :size="16" />
                      <span>{{ viewState === 'drafting' ? 'Drafting...' : 'Draft Tasks' }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </template>

            <!-- REVIEW STAGE -->
            <template v-else-if="viewState === 'review'">
              <div class="review-header">
                <h3>Drafted Tasks</h3>
                <p>Review the tasks below. You can ask the AI to revise them or confirm to add them to your board.</p>
              </div>

              <div class="draft-list">
                <div v-for="(task, index) in draftTasks" :key="index" class="draft-card">
                  <div class="draft-card-header">
                    <span class="draft-title">{{ task.title }}</span>
                    <span class="draft-priority" :class="'prio-' + task.priority">{{ formatPriority(task.priority) }}</span>
                  </div>
                  <p v-if="task.description" class="draft-desc">{{ task.description }}</p>
                  <div class="draft-footer">
                    <span class="draft-context">Context: {{ task.context }}</span>
                  </div>
                </div>
              </div>

              <div class="revision-box">
                <input 
                  v-model="revisionText"
                  type="text"
                  placeholder="E.g., Make all tasks high priority..."
                  class="revision-input"
                  @keyup.enter="reviseDraft"
                  :disabled="isRevising"
                />
                <button class="icon-btn btn-revise" @click="reviseDraft" :disabled="isRevising || !revisionText.trim()">
                  <Loader2 v-if="isRevising" class="spinner" :size="14" />
                  <ArrowUp v-else :size="16" />
                </button>
              </div>

              <div class="review-actions">
                <button class="btn btn-secondary" @click="viewState = 'input'">Back to Input</button>
                <button class="btn btn-primary" @click="confirmAndAdd">
                  <Check :size="16" />
                  <span>Confirm & Add to Board</span>
                </button>
              </div>
            </template>

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
import { X, Sparkles, Loader2, AlertCircle, ArrowUp, Check } from '@lucide/vue'
import { useUIStore } from '~/stores/ui.store'
import { useSettingsStore } from '~/stores/settings.store'
import { useTaskStore } from '~/stores/task.store'
import UiMicButton from '~/components/ui/MicButton.vue'

const uiStore = useUIStore()
const settingsStore = useSettingsStore()
const taskStore = useTaskStore()

type ViewState = 'input' | 'drafting' | 'review'
const viewState = ref<ViewState>('input')

const dumpText = ref('')
const draftTasks = ref<any[]>([])
const revisionText = ref('')
const isRevising = ref(false)
const error = ref('')

const textareaRef = ref<HTMLTextAreaElement | null>(null)
let lastTranscript = ''

function handleDictation(text: string) {
  if (!lastTranscript) {
    if (dumpText.value && !dumpText.value.endsWith(' ') && !dumpText.value.endsWith('\n')) {
      dumpText.value += ' '
    }
    dumpText.value += text
  } else {
    const prefix = dumpText.value.slice(0, dumpText.value.length - lastTranscript.length)
    dumpText.value = prefix + text
  }
  lastTranscript = text
  
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
  viewState.value = 'input'
  dumpText.value = ''
  draftTasks.value = []
  revisionText.value = ''
  error.value = ''
}

function formatPriority(p: string) {
  if (p === 'opt-h') return 'High'
  if (p === 'opt-m') return 'Medium'
  if (p === 'opt-l') return 'Low'
  return p
}

async function runExtraction(payload: any) {
  if (!settingsStore.ollamaApiKey) {
    error.value = 'Please configure your Ollama API Key in Settings.'
    return null
  }
  error.value = ''
  
  try {
    const res = await fetch('/api/extract-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
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
      return data.tasks
    } else {
      throw new Error('Invalid response format from AI')
    }
  } catch (err: any) {
    console.error('[ExtractTasks]', err)
    error.value = err.message || 'An error occurred during extraction.'
    return null
  }
}

async function extractTasks() {
  if (!dumpText.value.trim()) return
  viewState.value = 'drafting'
  
  const tasks = await runExtraction({ prompt: dumpText.value })
  if (tasks) {
    draftTasks.value = tasks
    viewState.value = 'review'
  } else {
    viewState.value = 'input'
  }
}

async function reviseDraft() {
  if (!revisionText.value.trim() || isRevising.value) return
  isRevising.value = true
  
  const tasks = await runExtraction({
    previousDraft: draftTasks.value,
    revisionPrompt: revisionText.value
  })
  
  if (tasks) {
    draftTasks.value = tasks
    revisionText.value = ''
  }
  isRevising.value = false
}

function confirmAndAdd() {
  if (!draftTasks.value.length) return
  
  draftTasks.value.forEach(t => {
    taskStore.addTask(t.title, t.context || 'today')
    const lastTask = taskStore.tasks[taskStore.tasks.length - 1]
    if (t.priority) taskStore.updateCustomProperty(lastTask.id, 'prop-priority', t.priority)
    if (t.description) taskStore.updateTaskField(lastTask.id, 'description', `<p>${t.description}</p>`)
  })
  
  close()
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
  padding: var(--space-4) var(--space-6);
  min-height: 56px;
  background-color: transparent;
}

.drawer-title {
  font-weight: 600;
  font-size: 16px;
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

/* ── Editor UI (Markdown Style) ── */
.description {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: var(--space-6);
  line-height: 1.5;
}

.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.editor-textarea {
  flex: 1;
  width: 100%;
  resize: none;
  border: none;
  background: transparent;
  padding: 0;
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-primary);
  outline: none;
  min-height: 300px;
}

.editor-textarea::placeholder {
  color: var(--text-muted);
  opacity: 0.6;
  font-weight: 400;
  font-size: 18px;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) 0;
  margin-top: auto;
}

.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.btn-generate {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--text-primary);
  color: var(--bg-root);
  border: none;
  border-radius: 9999px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.btn-generate:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.15);
}

.btn-generate:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.is-drafting {
  opacity: 0.5;
  pointer-events: none;
}

/* ── Review UI ── */
.review-header {
  margin-bottom: var(--space-6);
}

.review-header h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 var(--space-1) 0;
  color: var(--text-primary);
}

.review-header p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.draft-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.draft-card {
  background-color: var(--bg-surface-1);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-large);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.draft-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
}

.draft-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.4;
}

.draft-priority {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-small);
  text-transform: uppercase;
}
.prio-opt-h { background-color: rgba(239, 68, 68, 0.1); color: #ef4444; }
.prio-opt-m { background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.prio-opt-l { background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; }

.draft-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.draft-footer {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: var(--space-2);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* ── Revision Box ── */
.revision-box {
  display: flex;
  align-items: center;
  background-color: var(--bg-surface-1);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-large);
  padding: 8px 12px;
  margin-bottom: var(--space-8);
  transition: border-color 200ms ease;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);
}

.revision-box:focus-within {
  border-color: var(--border-strong);
  box-shadow: 0 0 0 2px var(--bg-surface-2);
}

.revision-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: var(--text-primary);
}

.revision-input::placeholder {
  color: var(--text-muted);
}

.btn-revise {
  color: var(--text-primary);
  background-color: var(--bg-surface-2);
  padding: 8px;
  border-radius: var(--radius-medium);
}

.btn-revise:hover:not(:disabled) {
  background-color: var(--border-default);
}

.btn-revise:disabled {
  opacity: 0.5;
}

/* ── Review Actions ── */
.review-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: auto;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: var(--radius-medium);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
  border: 1px solid transparent;
}

.btn-secondary {
  background-color: var(--bg-surface-2);
  color: var(--text-secondary);
  border-color: var(--border-default);
}

.btn-secondary:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.btn-primary {
  background-color: var(--text-primary);
  color: var(--bg-root);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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

.spinner {
  animation: spin 1s linear infinite;
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
