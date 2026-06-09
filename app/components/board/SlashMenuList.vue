<template>
  <div class="slash-menu" v-show="items.length > 0">
    <button
      class="slash-menu-item"
      :class="{ 'is-selected': index === selectedIndex }"
      v-for="(item, index) in items"
      :key="index"
      @click="selectItem(index)"
    >
      <div class="item-icon">
        <component :is="item.icon" :size="14" />
      </div>
      <span>{{ item.title }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps({
  items: {
    type: Array as () => any[],
    required: true,
  },
  command: {
    type: Function,
    required: true,
  },
})

const selectedIndex = ref(0)

watch(() => props.items, () => {
  selectedIndex.value = 0
})

function onKeyDown({ event }: { event: KeyboardEvent }) {
  if (event.key === 'ArrowUp') {
    selectedIndex.value = ((selectedIndex.value + props.items.length) - 1) % props.items.length
    return true
  }

  if (event.key === 'ArrowDown') {
    selectedIndex.value = (selectedIndex.value + 1) % props.items.length
    return true
  }

  if (event.key === 'Enter') {
    selectItem(selectedIndex.value)
    return true
  }

  return false
}

function selectItem(index: number) {
  const item = props.items[index]
  if (item) {
    props.command(item)
  }
}

defineExpose({
  onKeyDown
})
</script>

<style scoped>
.slash-menu {
  background-color: var(--bg-surface-1);
  border-radius: var(--radius-medium);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-default);
  padding: 4px;
  display: flex;
  flex-direction: column;
  min-width: 200px;
  overflow: hidden;
}

html.dark .slash-menu {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.slash-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: transparent;
  border: none;
  border-radius: var(--radius-small);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: background-color 100ms ease;
}

.slash-menu-item.is-selected,
.slash-menu-item:hover {
  background-color: var(--bg-surface-2);
}

.item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background-color: var(--bg-root);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-micro);
  color: var(--text-secondary);
}
</style>
