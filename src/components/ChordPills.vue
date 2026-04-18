<template>
  <div class="chord-pills">
    <button v-for="(chord, i) in chords" :key="i" class="chord-pill"
      :class="{ root: i === 0, active: activeChords.has(i) }" :style="pillStyle(i)" :aria-pressed="activeChords.has(i)"
      :title="`Toggle highlight: ${chord}`" @click="toggle(i)">
      {{ chord }}
    </button>
    <span class="loop-icon" :style="{ color: accent }">↺</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  chords: string[];
  color: string;
  accent: string;
}>();

const emit = defineEmits<{
  (e: 'toggle', index: number, active: boolean): void;
}>();

const activeChords = ref(new Set<number>());

function toggle(i: number) {
  if (activeChords.value.has(i)) {
    activeChords.value.delete(i);
    emit('toggle', i, false);
  } else {
    activeChords.value.add(i);
    emit('toggle', i, true);
  }
  activeChords.value = new Set(activeChords.value);
}

function pillStyle(i: number) {
  const isRoot = i === 0;
  const isActive = activeChords.value.has(i);
  if (isActive) {
    return {
      background: props.color,
      borderColor: props.color,
      color: '#0f0f14',
      boxShadow: `0 0 10px ${props.color}88`,
    };
  }
  return {
    background: isRoot ? props.color : props.color + '16',
    border: `1px solid ${props.color}44`,
    color: isRoot ? '#0f0f14' : props.color,
  };
}

/** Silently sync pill state from an external source (e.g. modal → card) without re-emitting. */
function setActive(i: number, active: boolean) {
  if (active === activeChords.value.has(i)) return;
  if (active) activeChords.value.add(i);
  else activeChords.value.delete(i);
  activeChords.value = new Set(activeChords.value);
}

function getActive(): Set<number> {
  return new Set(activeChords.value);
}

defineExpose({ toggle, setActive, getActive });
</script>

<style lang="scss" scoped>
.chord-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.chord-pill {
  border-radius: 20px;
  padding: 3px 10px;
  @include mono(11px, 0.04em);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
  outline: none;

  @include focus-gold;

  &:hover {
    transform: scale(1.02);
    filter: brightness(1.2);
  }

  &.active {
    transform: scale(1.02);
  }
}

.loop-icon {
  font-size: 14px;
  opacity: 0.6;
  margin-left: 2px;
}
</style>
