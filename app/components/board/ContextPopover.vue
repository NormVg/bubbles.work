<template>
  <div class="context-popover-wrapper" @click.stop>
    <button class="trigger-btn" @click="toggle" aria-label="Schedule Task" title="Schedule Task">
      <CalendarIcon :size="14" :stroke-width="1.5" />
    </button>

    <Transition name="dropdown">
      <div v-if="isOpen" class="dropdown-menu" :class="{ 'is-calendar': showCalendar }">
        <template v-if="!showCalendar">
          <span class="dropdown-label">Schedule</span>
          
          <button class="dropdown-item" @click="selectContext('today')">
            <Sun :size="13" class="item-icon" /> Today
          </button>
          <button class="dropdown-item" @click="selectContext('tomorrow')">
            <Sunrise :size="13" class="item-icon" /> Tomorrow
          </button>
          <button class="dropdown-item" @click="selectContext('someday')">
            <Inbox :size="13" class="item-icon" /> Someday
          </button>
          
          <div class="dropdown-divider" />
          
          <button class="dropdown-item" @click="showCalendar = true">
            <CalendarDays :size="13" class="item-icon" /> Pick Date...
          </button>
        </template>
        
        <template v-else>
          <div class="calendar-header">
            <button class="back-btn" @click="showCalendar = false">
              <ChevronLeft :size="14" />
            </button>
            <span class="calendar-title">Select Date</span>
          </div>
          <UiDateTimePicker 
            :include-time="false" 
            :block-past="true"
            @update:model-value="onCustomDate"
          />
        </template>
      </div>
    </Transition>

    <div v-if="isOpen" class="backdrop" @click="close" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Calendar as CalendarIcon, Sun, Sunrise, Inbox, CalendarDays, ChevronLeft } from '@lucide/vue'

const props = defineProps<{
  currentContext: string
}>()

const emit = defineEmits<{
  (e: 'update:context', context: string): void
}>()

const isOpen = ref(false)
const showCalendar = ref(false)

function toggle() {
  isOpen.value = !isOpen.value
  if (!isOpen.value) {
    showCalendar.value = false
  }
}

function close() {
  isOpen.value = false
  setTimeout(() => showCalendar.value = false, 200)
}

function selectContext(ctx: string) {
  emit('update:context', ctx)
  close()
}

function onCustomDate(dateStr: string) {
  selectContext(`date-${dateStr}`)
}
</script>

<style scoped>
.context-popover-wrapper {
  position: relative;
  display: inline-flex;
}

.trigger-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: transparent;
  color: var(--text-muted);
  transition: all 150ms ease;
  cursor: pointer;
  border: none;
}

.trigger-btn:hover {
  background-color: var(--bg-surface-2);
  color: var(--text-primary);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  width: 160px;
  background: var(--bg-root);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-medium);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 4px;
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.dropdown-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  padding: 6px 8px 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.dropdown-item {
  display: flex;
  align-items: center;
  width: 100%;
  text-align: left;
  padding: 6px 8px;
  background: transparent;
  border: none;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  border-radius: 4px;
  cursor: pointer;
  transition: all 150ms ease;
}

.dropdown-item:hover {
  background-color: var(--bg-surface-2);
  color: var(--text-primary);
}

.item-icon {
  margin-right: 8px;
  opacity: 0.7;
}

.dropdown-divider {
  height: 1px;
  background-color: var(--border-default);
  margin: 4px 0;
}

.dropdown-menu.is-calendar {
  width: auto;
  padding: 0;
  overflow: hidden;
}

.calendar-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-default);
  background: var(--bg-surface-1);
}

.back-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  margin-left: -4px;
  margin-right: 8px;
  border-radius: 4px;
  transition: all 150ms ease;
}

.back-btn:hover {
  background: var(--bg-surface-2);
  color: var(--text-primary);
}

.calendar-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

/* We override the inner picker styles to blend well */
:deep(.datetime-picker) {
  border: none;
  box-shadow: none;
  border-radius: 0 0 var(--radius-medium) var(--radius-medium);
}

.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99;
}

/* Transitions */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 150ms cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: top right;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-4px);
}
</style>
