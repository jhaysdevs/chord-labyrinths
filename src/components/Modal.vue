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
import { buildSVG } from '../utils/svg';

const props = defineProps<{
  labyrinth: ChordLabyrinth | null;
}>();

defineEmits<{
  (e: 'close'): void;
}>();

const modalInnerRef = ref<HTMLElement | null>(null);
const chordPillsRef = ref<{ toggle: (i: number) => void } | null>(null);

const svgMarkup = computed(() =>
  props.labyrinth ? buildSVG(props.labyrinth, 260) : '',
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
  const first = modalInnerRef.value?.querySelector<HTMLButtonElement>('button.chord-pill');
  first?.click();
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
  highlightSVGNode(props.labyrinth.id, nodeIdx, active);
}

function highlightSVGNode(labId: number, nodeIdx: number, on: boolean) {
  const uid = `u${labId}`;
  const modal = document.getElementById('lab-modal');
  if (!modal) return;
  const g = modal.querySelector<SVGGElement>(
    `.node-g[data-id="${uid}"][data-node="${nodeIdx}"]`,
  );
  if (!g) return;
  const arc = modal.querySelector<SVGPathElement>(
    `.arc[data-id="${uid}"][data-arc="${nodeIdx}"]`,
  );
  const circle = g.querySelector<SVGCircleElement>('.node-bg');
  const txt = g.querySelector<SVGTextElement>('text');
  if (!circle) return;
  const acc = circle.dataset.acc ?? '';
  const isRoot = circle.dataset.root === 'true';

  const cardColor = circle.dataset.stroke ?? acc;
  if (on) {
    if (arc) {
      arc.setAttribute('stroke-opacity', '1');
      arc.setAttribute('stroke-width', '2.4');
      arc.setAttribute('filter', `url(#glow${uid})`);
    }
    circle.setAttribute('stroke', cardColor);
    circle.setAttribute('stroke-width', '2.5');
    circle.setAttribute('fill', cardColor);
    if (txt) txt.setAttribute('fill', '#0f0f14');
  } else {
    if (arc) {
      arc.setAttribute('stroke-opacity', '0.65');
      arc.setAttribute('stroke-width', '1.3');
      arc.removeAttribute('filter');
    }
    circle.setAttribute('stroke', circle.dataset.stroke ?? '');
    circle.setAttribute('stroke-width', isRoot ? '2.5' : '1.2');
    circle.setAttribute('fill', circle.dataset.defaultFill ?? '');
    if (txt) txt.setAttribute('fill', txt.dataset.defaultFill ?? '');
  }
  g.setAttribute('aria-pressed', String(on));
}
</script>

<style scoped>
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
}

.modal-close:hover {
  background: rgba(232, 197, 71, 0.12);
  border-color: var(--gold);
  color: var(--gold);
}

.modal-close:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
}

.modal-esc {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.14em;
  color: var(--text-dim);
  text-transform: uppercase;
}

.modal-svg-wrap {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}

.modal-title {
  font-family: 'Playfair Display', serif;
  font-size: 26px;
  font-weight: 900;
  color: var(--text);
  line-height: 1.1;
}

.modal-subtitle {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.modal-desc {
  font-family: 'Crimson Pro', serif;
  font-size: 16px;
  color: var(--text-muted);
  line-height: 1.6;
}

.modal-rule {
  height: 1px;
  border: none;
}

.modal-example {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  color: var(--card-accent);
  letter-spacing: 0.04em;
  line-height: 1.7;
}

.modal-cat {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.6;
}

/* Transitions */
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
}

.modal-enter-from #modal-inner {
  transform: scale(0.94) translateY(16px);
  opacity: 0;
}

.modal-leave-to {
  opacity: 0;
}

.modal-leave-to #modal-inner {
  transform: scale(0.94) translateY(16px);
  opacity: 0;
}

@media (max-width: 600px) {
  #modal-inner {
    padding: 28px 20px 24px;
  }
}
</style>
