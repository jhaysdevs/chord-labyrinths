<template>
  <div id="app-root">
    <div id="ambient"></div>
    <span id="top"></span>

    <Header />
    <SearchControls />
    <ChordGrid @expand="openModal" />
    <Pagination />

    <footer>
      Hover chord nodes to trace voice paths · Click chord pills to highlight nodes · Click ⛶ to expand ·
      <span>{{ totalCount }}</span> circular progressions
    </footer>

    <Modal :labyrinth="activeLabyrinth" @close="closeModal" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useChordsStore } from './stores/chords';
import type { ChordLabyrinth } from './types/chords';
import Header from './components/Header.vue';
import SearchControls from './components/SearchControls.vue';
import ChordGrid from './components/ChordGrid.vue';
import Pagination from './components/Pagination.vue';
import Modal from './components/Modal.vue';

const chordsStore = useChordsStore();
const totalCount = chordsStore.data.length;

const activeLabyrinth = ref<ChordLabyrinth | null>(null);

function openModal(lab: ChordLabyrinth) {
  activeLabyrinth.value = lab;
}

function closeModal() {
  activeLabyrinth.value = null;
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeModal();
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>

<style>
:root {
  --bg: #08080e;
  --bg2: #0e0e1a;
  --bg3: #13131f;
  --text: #e8e8f0;
  --text-muted: rgba(200, 200, 220, 0.45);
  --text-dim: rgba(200, 200, 220, 0.22);
  --border: rgba(255, 255, 255, 0.06);
  --border-hover: rgba(255, 255, 255, 0.15);
  --gold: #e8c547;
  --gold-dim: rgba(232, 197, 71, 0.12);
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Crimson Pro', Georgia, serif;
  min-height: 100vh;
  overflow-x: hidden;
}

#ambient {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(ellipse at 10% 5%, rgba(232, 197, 71, 0.03) 0%, transparent 40%),
    radial-gradient(ellipse at 90% 85%, rgba(41, 128, 185, 0.03) 0%, transparent 40%),
    radial-gradient(ellipse at 55% 50%, rgba(192, 57, 43, 0.02) 0%, transparent 35%);
}

#app-root {
  position: relative;
  z-index: 1;
}

footer {
  text-align: center;
  padding: 24px;
  border-top: 1px solid var(--border);
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.14em;
  color: var(--text-dim);
  text-transform: uppercase;
}

footer span {
  color: var(--gold);
}

/* SVG node hover effects */
.node-g:hover .node-bg {
  filter: brightness(1.3);
}

/* v-html chart nodes: no browser focus/active ring on <g tabindex="0"> */
.node-g:focus,
.node-g:focus-visible,
.node-g:active {
  outline: none;
}

.node-g .node-bg:focus,
.node-g .node-bg:focus-visible {
  outline: none;
}
</style>
