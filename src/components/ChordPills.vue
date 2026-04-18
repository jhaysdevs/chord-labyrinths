<template>
  <div class="chord-pills">
    <button
      v-for="(chord, i) in chords"
      :key="i"
      class="chord-pill"
      :class="{ active: activeChords.has(i), locked: isLocked(i) }"
      :style="pillStyle(i)"
      :aria-pressed="activeChords.has(i)"
      :aria-disabled="isLocked(i)"
      :title="isLocked(i) ? 'Play previous chords first' : chord"
      @click="toggle(i)"
    >
      {{ chord }}
    </button>
    <span class="loop-icon" :style="{ color: accent }">↺</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { playChord, stopAll } from '../utils/tones';

const props = defineProps<{
  chords: string[];
  color: string;
  accent: string;
}>();

const emit = defineEmits<{
  (e: 'toggle', index: number, active: boolean): void;
}>();

const activeChords = ref(new Set<number>());
let resetTimer: ReturnType<typeof setTimeout> | undefined;

onUnmounted(() => clearTimeout(resetTimer));

/** True when pill i cannot yet be activated (a prior pill is still inactive). */
function isLocked(i: number): boolean {
  if (activeChords.value.has(i)) return false;
  for (let j = 0; j < i; j++) {
    if (!activeChords.value.has(j)) return true;
  }
  return false;
}

function toggle(i: number) {
  if (activeChords.value.has(i)) {
    // Already active — replay the chord without changing state.
    stopAll();
    playChord(props.chords[i]);
    return;
  }

  // Gate: all prior pills must be active before this one can activate.
  if (isLocked(i)) return;

  activeChords.value = new Set([...activeChords.value, i]);
  emit('toggle', i, true);
  stopAll();
  playChord(props.chords[i]);

  // After the last pill is activated, reset everything after a brief pause.
  if (i === props.chords.length - 1) {
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      const indices = [...activeChords.value];
      activeChords.value = new Set();
      indices.forEach(idx => emit('toggle', idx, false));
    }, 800);
  }
}

function pillStyle(i: number) {
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
    background: props.color + '16',
    border: `1px solid ${props.color}44`,
    color: props.color,
  };
}

/** Silently sync pill state from an external source without re-emitting. */
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

  &.locked {
    opacity: 0.35;
    cursor: not-allowed;

    &:hover {
      transform: none;
      filter: none;
    }
  }
}

.loop-icon {
  font-size: 14px;
  opacity: 0.6;
  margin-left: 2px;
}
</style>
