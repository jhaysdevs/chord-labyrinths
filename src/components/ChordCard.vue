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
import { computed, ref } from 'vue';
import type { ChordLabyrinth } from '../types/chords';
import ChordPills from './ChordPills.vue';
import { buildSVG } from '../utils/svg';
import { useScrollReveal } from '../composables/useScrollReveal';

const props = defineProps<{
  labyrinth: ChordLabyrinth;
  displayIndex: number;
}>();

defineEmits<{
  (e: 'expand', lab: ChordLabyrinth): void;
}>();

const cardRef = ref<HTMLElement | null>(null);
const chordPillsRef = ref<{ toggle: (i: number) => void } | null>(null);
useScrollReveal(cardRef, (props.displayIndex % 16) * 0.03);

const svgMarkup = computed(() => buildSVG(props.labyrinth, 154));

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
  highlightSVGNode(props.labyrinth.id, nodeIdx, active);
}

function highlightSVGNode(labId: number, nodeIdx: number, on: boolean) {
  const uid = `u${labId}`;
  const g = document.querySelector<SVGGElement>(
    `.node-g[data-id="${uid}"][data-node="${nodeIdx}"]`,
  );
  if (!g) return;
  const arc = document.querySelector<SVGPathElement>(
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
