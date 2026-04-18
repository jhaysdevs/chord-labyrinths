<template>
  <div ref="cardRef" class="card" :style="{ '--card-color': labyrinth.color, '--card-accent': labyrinth.accent }"
    :data-card="labyrinth.id">
    <div class="card-corner" :style="{
      background: `radial-gradient(circle at top right, ${labyrinth.color}18, transparent 70%)`,
    }"></div>
    <div class="card-num" :style="{ color: labyrinth.color }">
      {{ String(displayIndex).padStart(3, '0') }}
    </div>
    <div class="card-cat" :style="{ color: labyrinth.color }">
      {{ labyrinth.category }}
    </div>
    <button class="card-expand-btn" title="Expand to fullscreen" @click="$emit('expand', labyrinth)">
      ⛶ expand
    </button>

    <div class="card-svg" v-html="svgMarkup" @click="onSvgChordInteract" @keydown="onSvgChordInteract"></div>

    <div class="card-body">
      <div class="card-title">{{ labyrinth.title }}</div>
      <div class="card-subtitle" :style="{ color: labyrinth.color }">
        {{ labyrinth.subtitle }}
      </div>
      <div class="card-desc">{{ labyrinth.description }}</div>
      <ChordPills ref="chordPillsRef" :chords="labyrinth.chords" :color="labyrinth.color" :accent="labyrinth.accent"
        @toggle="onPillToggle" />
      <div class="card-rule" :style="{
        background: `linear-gradient(90deg, transparent, ${labyrinth.color}33, transparent)`,
      }"></div>
      <div class="card-example">{{ labyrinth.example }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import type { ChordLabyrinth } from '../types/chords';
import ChordPills from './ChordPills.vue';
import { buildSVG, highlightSVGNode } from '../utils/svg';
import { useScrollReveal } from '../composables/useScrollReveal';
import { useMediaQuery } from '../composables/useMediaQuery';
import { cardRegistry } from '../utils/cardRegistry';

const props = defineProps<{
  labyrinth: ChordLabyrinth;
  displayIndex: number;
}>();

defineEmits<{
  (e: 'expand', lab: ChordLabyrinth): void;
}>();

const cardRef = ref<HTMLElement | null>(null);
const chordPillsRef = ref<{
  toggle: (i: number) => void;
  setActive: (i: number, active: boolean) => void;
  getActive: () => Set<number>;
} | null>(null);
useScrollReveal(cardRef, (props.displayIndex % 16) * 0.03);

const isTablet = useMediaQuery('(max-width: 868px)');
const svgMarkup = computed(() =>
  isTablet.value
    ? buildSVG(props.labyrinth, 300, 180)
    : buildSVG(props.labyrinth, 154),
);

/**
 * Called by Modal to silently mirror its selection onto this card
 * (pill state + SVG highlight) without triggering a re-broadcast back.
 */
function syncChord(idx: number, active: boolean) {
  chordPillsRef.value?.setActive(idx, active);
  highlightSVGNode(props.labyrinth.id, idx, active, cardRef.value);
}

function getActiveChords(): Set<number> {
  return chordPillsRef.value?.getActive() ?? new Set();
}

onMounted(() => { cardRegistry.set(props.labyrinth.id, { syncChord, getActiveChords }); });
onUnmounted(() => { cardRegistry.delete(props.labyrinth.id); });

function onSvgChordInteract(e: MouseEvent | KeyboardEvent) {
  if ('key' in e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
  }
  const g = (e.target as Element | null)?.closest?.('.node-g');
  if (!g || !cardRef.value?.contains(g)) return;
  const idx = Number(g.getAttribute('data-node'));
  if (Number.isNaN(idx)) return;
  chordPillsRef.value?.toggle(idx);
}

function onPillToggle(nodeIdx: number, active: boolean) {
  highlightSVGNode(props.labyrinth.id, nodeIdx, active, cardRef.value);
  // Also sync the modal SVG if this card's modal is currently open
  highlightSVGNode(props.labyrinth.id, nodeIdx, active, document.getElementById('lab-modal'));
}
</script>

<style lang="scss" scoped>
.card {
  position: relative;
  background: var(--bg2);
  border: 1px solid color-mix(in srgb, var(--card-accent) 35%, transparent);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: default;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
  contain: layout;

  &:hover {
    border-color: color-mix(in srgb, var(--card-accent) 70%, transparent);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }
}

.card-corner {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: 16px;
}

.card-num {
  position: absolute;
  top: 16px;
  left: 20px;
  @include mono(10px, 0.12em);
  opacity: 0.5;
}

.card-cat {
  position: absolute;
  top: 16px;
  right: 16px;
  @include label(9px, 0.14em);
  opacity: 0.7;
}

.card-expand-btn {
  width: calc(100% + 16px);
  margin-top: -8px;
  margin-left: -8px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.25);
  @include mono(9px, 0.1em);
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
  transition: color 0.2s, background 0.2s;

  &:hover {
    color: var(--gold);
    background: rgba(232, 197, 71, 0.08);
  }

  @include focus-gold;
}

.card-svg {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 20px;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-title {
  @include display-font(17px);
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
}

.card-subtitle {
  @include label(10px, 0.1em);
  opacity: 0.8;
}

.card-desc {
  @include serif(14px);
  color: var(--text-muted);
  line-height: 1.5;
}

.card-rule {
  height: 1px;
  border: none;
}

.card-example {
  @include mono(9px, 0.04em);
  color: var(--card-accent);
  line-height: 1.6;
}
</style>
