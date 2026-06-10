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
            <div v-show="viewState === 'input' || viewState === 'drafting'" class="input-stage">
              <h1 class="hero-title">New Draft</h1>
              <p class="description">
                Jot down your thoughts, paste a conversation, or dictate via mic. AI will structure and categorize tasks for you.
              </p>

              <div class="editor-container" :class="{ 'is-drafting': viewState === 'drafting' }">
                <editor-content :editor="editor" class="tiptap-editor" />
                
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
                      :disabled="viewState === 'drafting' || isEditorEmpty"
                    >
                      <Loader2 v-if="viewState === 'drafting'" class="spinner" :size="16" />
                      <Sparkles v-else :size="16" />
                      <span>{{ viewState === 'drafting' ? 'Drafting...' : 'Draft Tasks' }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- REVIEW STAGE -->
            <div v-if="viewState === 'review'" class="review-stage">
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
                  <div class="draft-meta">
                    <div class="meta-pill"><FolderTree :size="12" /><span>{{ task.categoryName || 'Inbox' }}</span></div>
                    <div class="meta-pill"><Columns :size="12" /><span>{{ task.topicName || 'To Do' }}</span></div>
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
import { ref, watch, nextTick, onBeforeUnmount, computed } from 'vue'
import { X, Sparkles, Loader2, AlertCircle, ArrowUp, Check, FolderTree, Columns, Heading1, Heading2, Heading3, List as ListIcon, Code, Quote, Minus, Image as ImageIcon, Link as LinkIcon } from '@lucide/vue'
import { useUIStore } from '~/stores/ui.store'
import { useSettingsStore } from '~/stores/settings.store'
import { useTaskStore } from '~/stores/task.store'
import { useCategoryStore } from '~/stores/category.store'
import UiMicButton from '~/components/ui/MicButton.vue'
import { Editor, EditorContent, VueRenderer } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import tippy from 'tippy.js'
import SlashMenuList from './SlashMenuList.vue'
import { SlashCommandsExtension } from '~/utils/SlashCommands'

const uiStore = useUIStore()
const settingsStore = useSettingsStore()
const taskStore = useTaskStore()
const categoryStore = useCategoryStore()

type ViewState = 'input' | 'drafting' | 'review'
const viewState = ref<ViewState>('input')

const dumpText = ref('')
const draftTasks = ref<any[]>([])
const revisionText = ref('')
const isRevising = ref(false)
const error = ref('')

let lastTranscript = ''
let editor: Editor | null = null

const isEditorEmpty = computed(() => {
  if (!editor) return true
  // Check if editor only contains an empty paragraph or nothing
  return editor.isEmpty
})

watch(() => uiStore.isCreateDrawerOpen, (isOpen) => {
  if (isOpen) {
    if (!editor) {
      editor = new Editor({
        extensions: [
          StarterKit,
          Image.configure({ inline: true }),
          Link.configure({ openOnClick: false }),
          Placeholder.configure({
            placeholder: 'Type or click the mic to speak...',
          }),
          SlashCommandsExtension.configure({
            suggestion: {
              items: ({ query }: { query: string }) => {
                return [
                  { title: 'Heading 1', icon: Heading1, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run() },
                  { title: 'Heading 2', icon: Heading2, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run() },
                  { title: 'Heading 3', icon: Heading3, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run() },
                  { title: 'Bullet List', icon: ListIcon, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).toggleBulletList().run() },
                  { title: 'Code Block', icon: Code, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run() },
                  { title: 'Blockquote', icon: Quote, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).toggleBlockquote().run() },
                  { title: 'Divider', icon: Minus, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).setHorizontalRule().run() },
                  { title: 'Image', icon: ImageIcon, command: async ({ editor, range }: any) => {
                    const url = await uiStore.promptUser('Image URL', 'https://...')
                    if (url) editor.chain().focus().deleteRange(range).setImage({ src: url }).run()
                  } },
                  { title: 'Link', icon: LinkIcon, command: async ({ editor, range }: any) => {
                    const url = await uiStore.promptUser('Link URL', 'https://...')
                    if (url) editor.chain().focus().deleteRange(range).setLink({ href: url }).run()
                  } }
                ].filter(item => item.title.toLowerCase().includes(query.toLowerCase()))
              },
              render: () => {
                let component: any
                let popup: any
                return {
                  onStart: (props: any) => {
                    component = new VueRenderer(SlashMenuList, { props, editor: props.editor })
                    if (!props.clientRect) return
                    popup = tippy('body', {
                      getReferenceClientRect: props.clientRect,
                      appendTo: () => document.body,
                      content: component.element,
                      showOnCreate: true,
                      interactive: true,
                      trigger: 'manual',
                      placement: 'bottom-start',
                    })
                  },
                  onUpdate(props: any) {
                    component.updateProps(props)
                    if (!props.clientRect) return
                    popup[0].setProps({ getReferenceClientRect: props.clientRect })
                  },
                  onKeyDown(props: any) {
                    if (props.event.key === 'Escape') {
                      popup[0].hide()
                      return true
                    }
                    return component.ref?.onKeyDown(props)
                  },
                  onExit() {
                    popup?.[0]?.destroy()
                    component?.destroy()
                  },
                }
              }
            }
          })
        ],
        content: dumpText.value,
        onUpdate: () => {
          if (editor) {
            dumpText.value = editor.getText()
          }
        },
        editorProps: {
          attributes: {
            class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none max-w-none tiptap-inner',
          },
          handlePaste: (view, event, slice) => {
            const items = event.clipboardData?.items
            if (!items) return false
            let handled = false
            for (const item of items) {
              if (item.type.indexOf('image') === 0) {
                event.preventDefault()
                const file = item.getAsFile()
                if (file) {
                  const reader = new FileReader()
                  reader.onload = (e) => {
                    const result = e.target?.result
                    if (typeof result === 'string') {
                      editor?.commands.setImage({ src: result })
                    }
                  }
                  reader.readAsDataURL(file)
                  handled = true
                }
              }
            }
            return handled
          }
        }
      })
    }
  } else {
    if (editor) {
      editor.destroy()
      editor = null
    }
  }
})

onBeforeUnmount(() => {
  if (editor) {
    editor.destroy()
  }
})

function handleDictation(text: string) {
  if (!editor) return
  
  if (!lastTranscript) {
    const currentText = editor.getText()
    if (currentText && !currentText.endsWith(' ') && !currentText.endsWith('\n')) {
      editor.commands.insertContent(' ')
    }
    editor.commands.insertContent(text)
  } else {
    editor.commands.insertContent(' ' + text)
  }
  lastTranscript = text
}

function handleMicStop() {
  lastTranscript = ''
}

function close() {
  uiStore.closeCreateDrawer()
  viewState.value = 'input'
  dumpText.value = ''
  if (editor) editor.commands.setContent('')
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

function getCategoryContext() {
  return categoryStore.categories.map(c => ({
    categoryName: c.name,
    topics: c.tasks.map(t => t.name)
  }))
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
        categoryContext: getCategoryContext(),
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
  if (isEditorEmpty.value) return
  viewState.value = 'drafting'
  
  // Use text for extraction, not raw HTML
  const tasks = await runExtraction({ prompt: editor?.getText() || dumpText.value })
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
    let catId = null
    let topicId = null
    
    // 1. Find or create category
    if (t.categoryName) {
      const existingCat = categoryStore.categories.find(c => c.name.toLowerCase() === t.categoryName.toLowerCase())
      if (existingCat) {
        catId = existingCat.id
      } else {
        categoryStore.addCategory(null, t.categoryName)
        catId = categoryStore.categories[categoryStore.categories.length - 1].id
      }
    }
    
    // 2. Find or create topic inside category
    if (catId && t.topicName) {
      const cat = categoryStore.categories.find(c => c.id === catId)
      if (cat) {
        const existingTopic = cat.tasks.find(tk => tk.name.toLowerCase() === t.topicName.toLowerCase())
        if (existingTopic) {
          topicId = existingTopic.id
        } else {
          categoryStore.addTask(cat.id, t.topicName)
          topicId = cat.tasks[cat.tasks.length - 1].id
        }
      }
    }
    
    let taskContext = 'today' // fallback
    if (topicId) {
      taskContext = topicId
    }

    taskStore.addTask(t.title, taskContext)
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
  width: 720px;
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
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  background-color: var(--bg-surface-2);
  padding: 2px 8px;
  border-radius: var(--radius-small);
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
  padding: var(--space-2) var(--space-12) var(--space-16) var(--space-12);
  display: flex;
  flex-direction: column;
}

/* ── Editor UI (Markdown Style) ── */
.input-stage, .review-stage {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.hero-title {
  font-size: 38px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin-bottom: var(--space-2);
}

.description {
  color: var(--text-muted);
  font-size: 15px;
  margin-bottom: var(--space-8);
  line-height: 1.5;
}

.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 0;
}

.tiptap-editor {
  flex: 1;
  width: 100%;
  cursor: text;
}

:deep(.tiptap-inner) {
  min-height: 300px;
  color: var(--text-primary);
  line-height: 1.6;
  outline: none;
  font-size: 15px;
}

:deep(.tiptap-inner p.is-editor-empty:first-child::before) {
  color: var(--text-muted);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
  opacity: 0.5;
}

:deep(.tiptap-inner p) { margin-bottom: 0.75em; }
:deep(.tiptap-inner h1) { font-size: 2em; font-weight: 700; margin-top: 1.2em; margin-bottom: 0.5em; letter-spacing: -0.02em; }
:deep(.tiptap-inner h2) { font-size: 1.5em; font-weight: 600; margin-top: 1.2em; margin-bottom: 0.5em; letter-spacing: -0.01em; }
:deep(.tiptap-inner h3) { font-size: 1.17em; font-weight: 600; margin-top: 1.2em; margin-bottom: 0.5em; }
:deep(.tiptap-inner ul) { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; }
:deep(.tiptap-inner ol) { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 1em; }
:deep(.tiptap-inner blockquote) { border-left: 3px solid var(--border-strong); padding-left: 1em; margin-left: 0; color: var(--text-secondary); font-style: italic; }
:deep(.tiptap-inner pre) { background: var(--bg-surface-2); padding: 1em; border-radius: var(--radius-medium); overflow-x: auto; font-family: monospace; font-size: 13px; }
:deep(.tiptap-inner img) { max-width: 100%; height: auto; display: block; border-radius: var(--radius-medium); border: 1px solid var(--border-default); margin: 1em 0; box-sizing: border-box; }
:deep(.tiptap-inner code) { background: var(--bg-surface-2); padding: 0.2em 0.4em; border-radius: var(--radius-micro); font-family: monospace; font-size: 0.9em; color: #E24B4A; }
html.dark :deep(.tiptap-inner code) { color: #fca5a5; }

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-12);
  margin: 0 -48px -64px -48px;
  background-color: var(--bg-root);
  border-top: 1px solid var(--border-default);
  z-index: 10;
  position: sticky;
  bottom: -64px; /* Pull it down into the padding area */
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
  letter-spacing: -0.01em;
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
  gap: var(--space-3);
  transition: all 200ms ease;
}

.draft-card:hover {
  border-color: var(--border-strong);
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
}

.draft-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
}

.draft-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
  letter-spacing: -0.01em;
}

.draft-priority {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: var(--radius-small);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.prio-opt-h { background-color: rgba(239, 68, 68, 0.1); color: #ef4444; }
.prio-opt-m { background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.prio-opt-l { background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; }

.draft-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  background-color: var(--bg-surface-2);
  padding: 4px 8px;
  border-radius: var(--radius-medium);
}

.draft-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.draft-footer {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: auto;
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
  transition: all 200ms ease;
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
  padding: 4px 0;
}

.revision-input::placeholder {
  color: var(--text-muted);
  font-weight: 400;
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
