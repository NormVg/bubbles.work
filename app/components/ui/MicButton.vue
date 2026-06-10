<template>
  <div class="mic-wrapper">
    <button 
      class="mic-btn" 
      :class="{ 'is-recording': isRecording, 'has-error': !!error }"
      @click="toggleRecording"
      :title="error || 'Click to dictate'"
    >
      <transition name="icon-swap" mode="out-in">
        <Mic v-if="!isRecording" :size="16" :stroke-width="2" />
        <Square v-else :size="14" :stroke-width="3" class="stop-icon" />
      </transition>
    </button>
    
    <!-- Reactive Recording Waves beside the button -->
    <div class="reactive-waves" :class="{ 'is-active': isRecording }">
      <span class="wave" :style="{ height: Math.max(4, (volume / 255) * 16) + 'px' }"></span>
      <span class="wave" :style="{ height: Math.max(4, (volume / 255) * 24) + 'px' }"></span>
      <span class="wave" :style="{ height: Math.max(4, (volume / 255) * 16) + 'px' }"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Mic, Square } from '@lucide/vue'
import { useSpeechToText } from '~/composables/useSpeechToText'
import { watch } from 'vue'

const emit = defineEmits<{
  (e: 'update:text', text: string): void
  (e: 'stop'): void
  (e: 'error', message: string): void
}>()

const { isRecording, transcript, error, volume, startRecording, stopRecording } = useSpeechToText()

function toggleRecording() {
  if (isRecording.value) {
    stopRecording()
  } else {
    startRecording()
  }
}

watch(isRecording, (recording) => {
  if (!recording) emit('stop')
})

watch(transcript, (newText) => {
  if (newText) {
    emit('update:text', newText)
  }
})

watch(error, (errStr) => {
  if (errStr) {
    emit('error', errStr)
  }
})
</script>

<style scoped>
.mic-wrapper {
  display: flex;
  align-items: center;
}

.mic-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: var(--radius-full);
  transition: all 180ms cubic-bezier(0.2, 0, 0, 1); /* easing-natural-decay */
  position: relative;
  transform-origin: center;
  will-change: transform, background-color, color;
}

.mic-btn:hover {
  background-color: var(--bg-surface-2);
  color: var(--text-primary);
  transform: scale(1.02);
}

.mic-btn:active {
  transform: scale(0.92); /* physics-active-state */
}

.mic-btn.is-recording {
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
}

.mic-btn.has-error {
  color: #ef4444;
  animation: shake 400ms ease;
}

.stop-icon {
  fill: currentColor;
}

/* ── Icon Transitions ── */
.icon-swap-enter-active,
.icon-swap-leave-active {
  transition: all 150ms cubic-bezier(0.2, 0, 0, 1);
}

.icon-swap-enter-from {
  opacity: 0;
  transform: scale(0.5) rotate(-45deg);
}

.icon-swap-leave-to {
  opacity: 0;
  transform: scale(0.5) rotate(45deg);
}

/* ── Reactive Waves Animation ── */
.reactive-waves {
  display: flex;
  gap: 3px;
  align-items: center;
  height: 24px;
  overflow: hidden;
  transition: all 250ms cubic-bezier(0.2, 0, 0, 1); /* userinterface-wiki: easing-entrance-ease-out */
  max-width: 0;
  opacity: 0;
  margin-left: 0;
  padding-right: 0;
}

.reactive-waves.is-active {
  max-width: 32px;
  opacity: 1;
  margin-left: 8px;
  padding-right: 8px;
}

.reactive-waves .wave {
  width: 4px;
  background-color: #ef4444;
  border-radius: 2px;
  transition: height 50ms ease-out; /* Fast transition for audio reactivity */
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
</style>
