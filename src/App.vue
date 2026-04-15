<template>
  <div id="app-root">
    <div id="ambient"></div>
    <span id="top"></span>

    <Header />
    <SearchControls />
    <ChordGrid @expand="openModal" />

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
