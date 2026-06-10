<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="isOpen" class="drawer-overlay" @click.self="close">
        <div class="drawer-content">
          <!-- Header -->
          <div class="drawer-header">
            <div class="header-left">
              <span class="task-id">{{ task?.identifier || `#${task?.id.split('-')[1] || ''}` }}</span>
            </div>
            <div class="header-actions">
              <button class="icon-btn danger-hover" @click="deleteTask" aria-label="Delete task" title="Delete task">
                <Trash2 :size="16" :stroke-width="2" />
              </button>
              <button class="icon-btn" @click="close" aria-label="Close" title="Close">
                <X :size="16" :stroke-width="2" />
              </button>
            </div>
          </div>
          
          <div class="drawer-body" v-if="task">
            <!-- Title -->
            <div class="title-container">
              <input 
                v-model="title" 
                class="task-title-input" 
                placeholder="Untitled"
                @blur="updateField('title', title)"
              />
            </div>

            <!-- Structured Props (Notion Style) -->
            <div class="props-section">
              <!-- Hardcoded Status (Core Logic) -->
              <div class="prop-row">
                <div class="prop-label">
                  <CheckCircle :size="14" class="prop-icon" />
                  <span>Status</span>
                </div>
                <div class="prop-value">
                  <select v-model="status" @change="updateField('status', status)" class="prop-select">
                    <option value="open">Open</option>
                    <option value="live">Live</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>

              <!-- Dynamic Properties -->
              <div class="prop-row group" v-for="prop in taskStore.propertiesSchema" :key="prop.id">
                <div class="prop-label">
                  <ListIcon v-if="prop.type === 'select'" :size="14" class="prop-icon" />
                  <AlignLeft v-else :size="14" class="prop-icon" />
                  <span>{{ prop.name }}</span>
                </div>
                <div class="prop-value">
                  <!-- Select Input -->
                  <select 
                    v-if="prop.type === 'select'"
                    :value="task.customProperties?.[prop.id] || ''"
                    @change="(e) => updateCustomProp(prop.id, (e.target as HTMLSelectElement).value)"
                    class="prop-select"
                  >
                    <option value="">Empty</option>
                    <option v-for="opt in prop.options" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
                  </select>
                  
                  <!-- Text Input -->
                  <input 
                    v-else
                    type="text"
                    :value="task.customProperties?.[prop.id] || ''"
                    @input="(e) => updateCustomProp(prop.id, (e.target as HTMLInputElement).value)"
                    class="prop-input"
                    placeholder="Empty"
                  />

                  <button 
                    v-if="prop.id !== 'prop-priority'" 
                    class="icon-btn remove-prop-btn" 
                    @click="taskStore.removePropertySchema(prop.id)"
                    aria-label="Remove property"
                    title="Remove property"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
              </div>

              <!-- Add Property Inline Form -->
              <div v-if="isAddingProp" class="prop-row new-prop-row">
                <div class="prop-label">
                  <AlignLeft :size="14" class="prop-icon" />
                  <span style="font-size: 13px; color: var(--text-muted); opacity: 0.5;">New prop</span>
                </div>
                <div class="prop-value inline-prop-form">
                  <input 
                    v-model="newPropName" 
                    type="text" 
                    placeholder="Property name..." 
                    class="prop-input" 
                    autofocus 
                    @keyup.enter="saveNewProperty" 
                    @keyup.esc="cancelNewProperty" 
                  />
                  <div class="inline-actions">
                    <button class="inline-icon-btn save-btn" @click="saveNewProperty"><Check :size="14" /></button>
                    <button class="inline-icon-btn cancel-btn" @click="cancelNewProperty"><X :size="14" /></button>
                  </div>
                </div>
              </div>

              <!-- Add Property Button -->
              <div v-if="!isAddingProp" class="prop-row">
                <div class="prop-label"></div>
                <div class="prop-value">
                  <button class="add-prop-btn" @click="isAddingProp = true">
                    <Plus :size="14" />
                    <span>Add a property</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="divider"></div>

            <!-- Tiptap Editor for Description -->
            <div class="description-section">
              <editor-content :editor="editor" class="tiptap-editor" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { X, Check, CheckCircle, AlignLeft, List as ListIcon, Hash, Calendar, CheckSquare, Plus, Heading1, Heading2, Heading3, Code, Quote, Minus, Image as ImageIcon, Link as LinkIcon, Trash2 } from '@lucide/vue'
import { useUIStore } from '~/stores/ui.store'
import { useTaskStore, type BoardTask, type PropertyType } from '~/stores/task.store'
import { Editor, EditorContent, VueRenderer } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import tippy from 'tippy.js'
import SlashMenuList from './SlashMenuList.vue'
import { SlashCommandsExtension } from '~/utils/SlashCommands'

const uiStore = useUIStore()
const taskStore = useTaskStore()

const isOpen = computed(() => uiStore.activeTaskId !== null)
const task = computed(() => taskStore.tasks.find(t => t.id === uiStore.activeTaskId))

const title = ref('')
const status = ref('open')

// New property state
const isAddingProp = ref(false)
const newPropName = ref('')
const newPropType = ref<PropertyType>('text')

let editor: Editor | null = null

watch(task, (newTask) => {
  if (newTask) {
    title.value = newTask.title
    status.value = newTask.status
    
    // Ensure task has customProperties object
    if (!newTask.customProperties) {
      taskStore.updateTaskField(newTask.id, 'customProperties', {})
    }
    
    if (!editor) {
      editor = new Editor({
        extensions: [
          StarterKit,
          Image.configure({ inline: true }),
          Link.configure({ openOnClick: false }),
          Placeholder.configure({
            placeholder: 'Press "/" for commands, or start typing...',
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
        content: newTask.description || '',
        onUpdate: () => {
          if (editor) {
            updateField('description', editor.getHTML())
          }
        },
        editorProps: {
          attributes: {
            class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none max-w-none',
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
        },
      })
    } else {
      if (editor.getHTML() !== newTask.description) {
         editor.commands.setContent(newTask.description || '')
      }
    }
  } else if (editor) {
    editor.destroy()
    editor = null
  }
}, { immediate: true })

onBeforeUnmount(() => {
  if (editor) {
    editor.destroy()
  }
})

function close() {
  uiStore.closeTaskDrawer()
  isAddingProp.value = false
}

function deleteTask() {
  if (task.value) {
    const id = task.value.id
    close()
    taskStore.removeTask(id)
  }
}

function updateField(field: keyof BoardTask, value: any) {
  if (task.value) {
    taskStore.updateTaskField(task.value.id, field, value)
  }
}

function updateCustomProp(propId: string, value: any) {
  if (task.value) {
    taskStore.updateCustomProperty(task.value.id, propId, value)
  }
}

function saveNewProperty() {
  if (!newPropName.value.trim()) return
  taskStore.addPropertySchema(newPropName.value.trim(), 'text')
  cancelNewProperty()
}

function cancelNewProperty() {
  isAddingProp.value = false
  newPropName.value = ''
  newPropType.value = 'text'
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

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2) var(--space-12) var(--space-16) var(--space-12);
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

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.task-id {
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  background-color: var(--bg-surface-2);
  padding: 2px 8px;
  border-radius: var(--radius-small);
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

.icon-btn.danger-hover:hover {
  background-color: rgba(226, 75, 74, 0.1);
  color: #E24B4A;
}

.title-container {
  margin-bottom: var(--space-8);
}

.task-title-input {
  width: 100%;
  font-size: 38px;
  font-weight: 700;
  border: 1px solid transparent;
  border-radius: var(--radius-medium);
  background: transparent;
  color: var(--text-primary);
  outline: none;
  padding: 4px 8px;
  margin-left: -8px;
  line-height: 1.1;
  letter-spacing: -0.02em;
  transition: all 150ms ease;
}

.task-title-input:hover {
  background-color: var(--bg-surface-2);
}

.task-title-input:focus {
  background-color: var(--bg-root);
  border-color: var(--border-strong);
  box-shadow: 0 0 0 2px var(--bg-surface-2);
}

.task-title-input::placeholder {
  color: var(--text-muted);
  opacity: 0.5;
}

.props-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: var(--space-10);
}

.prop-row {
  display: grid;
  grid-template-columns: 140px 1fr;
  align-items: center;
  min-height: 34px;
  border-radius: var(--radius-medium);
  padding: 4px 0;
}

.prop-row:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

html.dark .prop-row:hover {
  background-color: rgba(255, 255, 255, 0.02);
}

.prop-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 400;
  padding-left: 8px;
}

.prop-icon {
  opacity: 0.7;
}

.prop-value {
  display: flex;
  align-items: center;
  position: relative;
}

.remove-prop-btn {
  position: absolute;
  right: -28px;
  width: 24px;
  height: 24px;
  padding: 4px;
  opacity: 0;
  color: var(--text-muted);
  transition: all 150ms ease;
}

.prop-row:hover .remove-prop-btn {
  opacity: 1;
}

.remove-prop-btn:hover {
  color: #E24B4A;
  background-color: rgba(226, 75, 74, 0.1);
}

.prop-input,
.prop-select {
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  padding: 4px 8px;
  border-radius: var(--radius-medium);
  outline: none;
  transition: all 150ms ease;
  font-weight: 400;
  width: 100%;
  max-width: 300px;
}

.prop-select {
  width: auto;
  cursor: pointer;
}

.prop-input::placeholder {
  color: var(--text-muted);
  opacity: 0.5;
}

.prop-input:hover,
.prop-select:hover {
  background-color: var(--bg-surface-2);
}

.prop-input:focus,
.prop-select:focus {
  border-color: var(--border-strong);
  background-color: var(--bg-root);
}

.type-select {
  padding-left: 0;
  margin-left: 0;
}

.inline-prop-form {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.inline-actions {
  display: flex;
  gap: 4px;
}

.inline-icon-btn {
  background: transparent;
  border: none;
  border-radius: var(--radius-small);
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms ease;
}

.save-btn {
  color: var(--text-primary);
  background-color: var(--bg-surface-2);
}

.save-btn:hover {
  background-color: var(--border-strong);
}

.cancel-btn {
  color: var(--text-muted);
}

.cancel-btn:hover {
  background-color: var(--bg-surface-2);
  color: var(--text-primary);
}

.add-prop-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 14px;
  padding: 4px 8px;
  border-radius: var(--radius-small);
  cursor: pointer;
  transition: all 150ms ease;
  margin-left: 0;
}

.add-prop-btn:hover {
  background-color: var(--bg-surface-2);
  color: var(--text-primary);
}

.divider {
  height: 1px;
  background-color: var(--border-default);
  margin-top: var(--space-4);
  margin-bottom: var(--space-12);
  opacity: 0.6;
}

.description-section {
  flex: 1;
  padding: 0 8px;
}

/* Tiptap Editor Styles */
:deep(.tiptap) {
  min-height: 300px;
  color: var(--text-primary);
  line-height: 1.6;
  outline: none;
  font-size: 15px;
}

:deep(.tiptap p.is-editor-empty:first-child::before) {
  color: var(--text-muted);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
  opacity: 0.6;
}

:deep(.tiptap p) { margin-bottom: 0.75em; }
:deep(.tiptap h1) { font-size: 2em; font-weight: 700; margin-top: 1.2em; margin-bottom: 0.5em; letter-spacing: -0.02em; }
:deep(.tiptap h2) { font-size: 1.5em; font-weight: 600; margin-top: 1.2em; margin-bottom: 0.5em; letter-spacing: -0.01em; }
:deep(.tiptap h3) { font-size: 1.17em; font-weight: 600; margin-top: 1.2em; margin-bottom: 0.5em; }
:deep(.tiptap ul) { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; }
:deep(.tiptap ol) { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 1em; }
:deep(.tiptap li p) { margin-bottom: 0.25em; }
:deep(.tiptap blockquote) { border-left: 3px solid var(--border-strong); padding-left: 1em; margin-left: 0; color: var(--text-secondary); font-style: italic; }
:deep(.tiptap pre) { background: var(--bg-surface-2); padding: 1em; border-radius: var(--radius-medium); overflow-x: auto; font-family: monospace; font-size: 13px; }
:deep(.tiptap code) { background: var(--bg-surface-2); padding: 0.2em 0.4em; border-radius: var(--radius-micro); font-family: monospace; font-size: 0.9em; color: #E24B4A; }
html.dark :deep(.tiptap code) { color: #fca5a5; }
:deep(.tiptap img) { max-width: 100%; height: auto; border-radius: var(--radius-medium); border: 1px solid var(--border-default); margin: 1em 0; }
:deep(.tiptap a) { color: #3b82f6; text-decoration: underline; cursor: pointer; }

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
