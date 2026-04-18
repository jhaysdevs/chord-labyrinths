<template>
  <Teleport to="body">
    <Transition name="modal" @after-enter="onModalAfterEnter">
      <div v-if="labyrinth" id="lab-modal" role="dialog" aria-modal="true"
        :aria-labelledby="`modal-title-${labyrinth.id}`" @click.self="$emit('close')" @keydown.esc="$emit('close')">
        <div
          id="modal-inner"
          ref="modalInnerRef"
          :style="{
            '--card-color': labyrinth.color,
            '--card-accent': labyrinth.accent,
          }"
        >
          <button class="modal-close" aria-label="Close (Escape)" @click="$emit('close')">
            ✕
          </button>
          <span class="modal-esc">ESC to close</span>

          <div class="modal-svg-wrap" v-html="svgMarkup" @click="onSvgChordInteract" @keydown="onSvgChordInteract">
          </div>

          <div :id="`modal-title-${labyrinth.id}`" class="modal-title">
            {{ labyrinth.title }}
          </div>
          <div class="modal-subtitle" :style="{ color: labyrinth.color }">
            {{ labyrinth.subtitle }}
          </div>
          <div class="modal-desc">{{ labyrinth.description }}</div>

          <ChordPills ref="chordPillsRef" :chords="labyrinth.chords" :color="labyrinth.color" :accent="labyrinth.accent"
            @toggle="onPillToggle" />

          <div class="modal-rule" :style="{
            background: `linear-gradient(90deg, transparent, ${labyrinth.color}44, transparent)`,
          }"></div>

          <div class="modal-example">{{ labyrinth.example }}</div>
          <div class="modal-cat" :style="{ color: labyrinth.color }">
            {{ labyrinth.category }}
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, nextTick, ref } from 'vue';
import type { ChordLabyrinth } from '../types/chords';
import ChordPills from './ChordPills.vue';
import { buildSVG, highlightSVGNode } from '../utils/svg';
import { cardRegistry } from '../utils/cardRegistry';

const props = defineProps<{
  labyrinth: ChordLabyrinth | null;
}>();

defineEmits<{
  (e: 'close'): void;
}>();

const modalInnerRef = ref<HTMLElement | null>(null);
const chordPillsRef = ref<{
  toggle: (i: number) => void;
  setActive: (i: number, active: boolean) => void;
} | null>(null);

const svgMarkup = computed(() =>
  props.labyrinth ? buildSVG(props.labyrinth, 260, 180) : '',
);

watch(
  () => props.labyrinth,
  async (lab) => {
    if (lab) {
      document.body.style.overflow = 'hidden';
      await nextTick();
      modalInnerRef.value?.focus();
    } else {
      document.body.style.overflow = '';
    }
  },
);

function onModalAfterEnter() {
  if (!props.labyrinth) return;
  // Seed modal pills from the card's current active state so both contexts
  // start in sync. Fall back to activating the first chord if the card has
  // nothing active yet (e.g. scroll-reveal hasn't fired).
  const card = cardRegistry.get(props.labyrinth.id);
  const active = card?.getActiveChords() ?? new Set<number>();
  const indices = active.size > 0 ? [...active] : [0];
  indices.forEach((idx) => chordPillsRef.value?.toggle(idx));
}

function onSvgChordInteract(e: MouseEvent | KeyboardEvent) {
  if ('key' in e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
  }
  const g = (e.target as Element | null)?.closest?.('.node-g');
  if (!g || !modalInnerRef.value?.contains(g)) return;
  const idx = Number(g.getAttribute('data-node'));
  if (Number.isNaN(idx)) return;
  chordPillsRef.value?.toggle(idx);
}

function onPillToggle(nodeIdx: number, active: boolean) {
  if (!props.labyrinth) return;
  // Update modal SVG
  highlightSVGNode(props.labyrinth.id, nodeIdx, active, document.getElementById('lab-modal'));
  // Mirror selection onto the card (pill state + SVG) via the registry
  cardRegistry.get(props.labyrinth.id)?.syncChord(nodeIdx, active);
}
</script>

<style lang="scss" scoped>
#lab-modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(4, 4, 10, 0.88);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

#modal-inner {
  position: relative;
  background: var(--bg2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 40px 40px 32px;
  max-width: 560px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  outline: none;

  @include mobile {
    padding: 28px 20px 24px;
  }
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(232, 197, 71, 0.12);
    border-color: var(--gold);
    color: var(--gold);
  }

  @include focus-gold;
}

.modal-esc {
  @include label(9px, 0.14em);
  color: var(--text-dim);
}

.modal-svg-wrap {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}

.modal-title {
  @include display-font(26px);
  font-weight: 900;
  color: var(--text);
  line-height: 1.1;
}

.modal-subtitle {
  @include label(10px, 0.14em);
}

.modal-desc {
  @include serif(16px);
  color: var(--text-muted);
  line-height: 1.6;
}

.modal-rule {
  height: 1px;
  border: none;
}

.modal-example {
  @include mono(10px, 0.04em);
  color: var(--card-accent);
  line-height: 1.7;
}

.modal-cat {
  @include label(9px, 0.18em);
  opacity: 0.6;
}

// Vue transition classes
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-active #modal-inner,
.modal-leave-active #modal-inner {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.modal-enter-from {
  opacity: 0;

  #modal-inner {
    transform: scale(0.94) translateY(16px);
    opacity: 0;
  }
}

.modal-leave-to {
  opacity: 0;

  #modal-inner {
    transform: scale(0.94) translateY(16px);
    opacity: 0;
  }
}
</style>
