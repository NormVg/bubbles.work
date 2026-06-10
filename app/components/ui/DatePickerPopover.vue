<template>
  <div class="dp-popover-wrapper" @click.stop>
    <button class="dp-trigger" @click="toggle" :class="{ 'is-empty': !modelValue }">
      <CalendarIcon :size="14" class="icon" />
      <span>{{ displayValue }}</span>
    </button>

    <Transition name="dropdown">
      <div v-if="isOpen" class="dp-dropdown">
        <UiDateTimePicker 
          :model-value="modelValue"
          :include-time="includeTime"
          :block-past="blockPast"
          @update:model-value="onUpdate"
        />
      </div>
    </Transition>

    <div v-if="isOpen" class="backdrop" @click="close" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Calendar as CalendarIcon } from '@lucide/vue'

const props = withDefaults(defineProps<{
  modelValue?: string | Date | null
  includeTime?: boolean
  blockPast?: boolean
  placeholder?: string
}>(), {
  modelValue: null,
  includeTime: false,
  blockPast: true,
  placeholder: 'Empty'
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
}>()

const isOpen = ref(false)

const displayValue = computed(() => {
  if (!props.modelValue) return props.placeholder
  const d = new Date(props.modelValue)
  if (isNaN(d.getTime())) return props.placeholder
  
  const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  if (props.includeTime) {
    const timeStr = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    return `${dateStr} ${timeStr}`
  }
  return dateStr
})

function toggle() {
  isOpen.value = !isOpen.value
}

function close() {
  isOpen.value = false
}

function onUpdate(val: string) {
  emit('update:modelValue', val)
  // If we're picking time, don't auto-close so they can change hours/minutes.
  if (!props.includeTime) {
    close()
  }
}
</script>

<style scoped>
.dp-popover-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
}

.dp-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  background: transparent;
  border: 1px dashed transparent;
  padding: 4px 6px;
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 150ms ease;
  text-align: left;
}

.dp-trigger:hover {
  background-color: var(--bg-surface-2);
}

.dp-trigger.is-empty {
  color: var(--text-muted);
}

.dp-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 100;
  background: var(--bg-surface-2);
  border-radius: var(--radius-large);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99;
}

.icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

/* Transitions */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 150ms cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: top left;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-4px);
}
</style>
