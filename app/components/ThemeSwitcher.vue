<template>
  <button 
    class="theme-toggle" 
    @click="toggleTheme" 
    aria-label="Toggle Theme"
  >
    <Transition name="icon-morph" mode="out-in">
      <Sun v-if="colorMode.value === 'dark'" key="sun" :size="14" :stroke-width="1.5" />
      <Moon v-else key="moon" :size="14" :stroke-width="1.5" />
    </Transition>
  </button>
</template>

<script setup lang="ts">
import { Sun, Moon } from '@lucide/vue'

const colorMode = useColorMode()

function toggleTheme(event: MouseEvent) {
  const newTheme = colorMode.value === 'dark' ? 'light' : 'dark'

  // Fallback for browsers without View Transition API
  if (!document.startViewTransition) {
    colorMode.preference = newTheme
    return
  }

  const x = event.clientX
  const y = event.clientY

  const maxRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  )

  const transition = document.startViewTransition(() => {
    colorMode.preference = newTheme
  })

  transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`
        ]
      },
      {
        duration: 500,
        easing: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
        pseudoElement: '::view-transition-new(root)'
      }
    )
  })
}
</script>

<style scoped>
.theme-toggle {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-medium);
  transition: color 120ms ease, background-color 120ms ease;
  margin-left: auto;
  flex-shrink: 0;
}

.theme-toggle:hover {
  color: var(--text-primary);
  background-color: var(--bg-hover);
}

.theme-toggle:active {
  transform: scale(0.92);
}

/* Icon Morph */
.icon-morph-enter-active {
  transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 300ms ease;
}
.icon-morph-leave-active {
  transition: transform 120ms ease-in, opacity 120ms ease-in;
}
.icon-morph-enter-from {
  transform: scale(0.6) rotate(-90deg);
  opacity: 0;
}
.icon-morph-leave-to {
  transform: scale(0.6) rotate(90deg);
  opacity: 0;
}
</style>
