<template>
  <div class="datetime-picker" @click.stop>
    <!-- Header -->
    <div class="dp-header">
      <button class="nav-btn" @click.prevent="prevMonth" aria-label="Previous Month">
        <ChevronLeft :size="16" />
      </button>
      <span class="current-month">{{ currentMonthName }} {{ currentYear }}</span>
      <button class="nav-btn" @click.prevent="nextMonth" aria-label="Next Month">
        <ChevronRight :size="16" />
      </button>
    </div>

    <!-- Calendar Grid -->
    <div class="dp-grid">
      <!-- Day Headers -->
      <div class="day-header" v-for="day in weekDays" :key="day">{{ day }}</div>
      
      <!-- Blank spaces for first day offset -->
      <div class="day-cell blank" v-for="blank in blanks" :key="`blank-${blank}`"></div>
      
      <!-- Days -->
      <button 
        class="day-cell" 
        v-for="date in daysInMonth" 
        :key="date.day"
        :class="{ 
          'is-today': date.isToday, 
          'is-selected': isSelectedDate(date.day),
          'is-disabled': date.isDisabled 
        }"
        :disabled="date.isDisabled"
        @click.prevent="selectDate(date.day)"
      >
        {{ date.day }}
      </button>
    </div>

    <!-- Time Selector -->
    <div class="dp-time" v-if="includeTime">
      <div class="time-label">
        <Clock :size="14" />
        <span>Time</span>
      </div>
      <div class="time-inputs">
        <select v-model="selectedHour" class="time-select" @change="updateTime">
          <option v-for="h in 24" :key="h" :value="h - 1">{{ (h - 1).toString().padStart(2, '0') }}</option>
        </select>
        <span class="time-colon">:</span>
        <select v-model="selectedMinute" class="time-select" @change="updateTime">
          <option v-for="m in 60" :key="m" :value="m - 1">{{ (m - 1).toString().padStart(2, '0') }}</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ChevronLeft, ChevronRight, Clock } from '@lucide/vue'

const props = withDefaults(defineProps<{
  modelValue?: string | Date | null
  includeTime?: boolean
  blockPast?: boolean
}>(), {
  modelValue: null,
  includeTime: false,
  blockPast: true
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
}>()

const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())

const selectedDate = ref<Date | null>(null)
const selectedHour = ref(0)
const selectedMinute = ref(0)

// Initialize from props
onMounted(() => {
  if (props.modelValue) {
    const d = new Date(props.modelValue)
    if (!isNaN(d.getTime())) {
      selectedDate.value = d
      currentMonth.value = d.getMonth()
      currentYear.value = d.getFullYear()
      selectedHour.value = d.getHours()
      selectedMinute.value = d.getMinutes()
    }
  }
})

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    const d = new Date(newVal)
    if (!isNaN(d.getTime())) {
      selectedDate.value = d
      selectedHour.value = d.getHours()
      selectedMinute.value = d.getMinutes()
    }
  }
})

const currentMonthName = computed(() => {
  const d = new Date(currentYear.value, currentMonth.value, 1)
  return d.toLocaleString('default', { month: 'long' })
})

const blanks = computed(() => {
  const d = new Date(currentYear.value, currentMonth.value, 1)
  return d.getDay()
})

const daysInMonth = computed(() => {
  const daysInMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days = []
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(currentYear.value, currentMonth.value, i)
    d.setHours(0, 0, 0, 0)
    
    let isDisabled = false
    if (props.blockPast && d.getTime() < today.getTime()) {
      isDisabled = true
    }

    days.push({
      day: i,
      dateObj: d,
      isToday: d.getTime() === today.getTime(),
      isDisabled
    })
  }
  return days
})

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

function isSelectedDate(day: number) {
  if (!selectedDate.value) return false
  return selectedDate.value.getDate() === day &&
         selectedDate.value.getMonth() === currentMonth.value &&
         selectedDate.value.getFullYear() === currentYear.value
}

function selectDate(day: number) {
  const newDate = new Date(currentYear.value, currentMonth.value, day)
  newDate.setHours(selectedHour.value, selectedMinute.value, 0, 0)
  selectedDate.value = newDate
  emitDate()
}

function updateTime() {
  if (selectedDate.value) {
    selectedDate.value.setHours(selectedHour.value, selectedMinute.value, 0, 0)
    emitDate()
  }
}

function emitDate() {
  if (!selectedDate.value) return
  // If time is not included, we can just emit a YYYY-MM-DD string
  if (!props.includeTime) {
    const yy = selectedDate.value.getFullYear()
    const mm = (selectedDate.value.getMonth() + 1).toString().padStart(2, '0')
    const dd = selectedDate.value.getDate().toString().padStart(2, '0')
    emit('update:modelValue', `${yy}-${mm}-${dd}`)
  } else {
    emit('update:modelValue', selectedDate.value.toISOString())
  }
}
</script>

<style scoped>
.datetime-picker {
  background: var(--bg-surface-2);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-large);
  padding: 12px;
  width: 250px;
  font-family: inherit;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  color: var(--text-primary);
}

.dp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.current-month {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.nav-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  width: 24px;
  height: 24px;
  transition: all 150ms ease;
}

.nav-btn:hover {
  background: var(--bg-surface-3);
  color: var(--text-primary);
}

.dp-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.day-header {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  text-align: center;
  padding-bottom: 4px;
}

.day-cell {
  background: transparent;
  border: none;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  transition: all 150ms ease;
}

.day-cell:not(.blank):not(.is-disabled):hover {
  background: var(--bg-surface-3);
}

.day-cell.is-today {
  color: var(--color-primary);
  font-weight: 700;
}

.day-cell.is-selected {
  background: var(--color-primary);
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(139, 92, 246, 0.4);
}

.day-cell.is-disabled {
  color: var(--text-muted);
  opacity: 0.5;
  cursor: not-allowed;
}

.dp-time {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-default);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.time-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.time-inputs {
  display: flex;
  align-items: center;
  background: var(--bg-root);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  padding: 2px 6px;
}

.time-select {
  appearance: none;
  background: transparent;
  border: none;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  padding: 2px;
  outline: none;
  cursor: pointer;
}

.time-colon {
  font-weight: 600;
  color: var(--text-muted);
  margin: 0 2px;
}
</style>
