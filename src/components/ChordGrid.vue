<template>
  <main>
    <TransitionGroup
      v-if="visibleChords.length"
      name="cards"
      tag="div"
      class="grid"
    >
      <ChordCard
        v-for="(lab, i) in visibleChords"
        :key="lab.id"
        :labyrinth="lab"
        :display-index="i + 1"
        @expand="$emit('expand', $event)"
      />
    </TransitionGroup>

    <div v-else class="empty">No labyrinths found. Try a different search.</div>

    <!-- Sentinel: triggers loadMore when scrolled into view -->
    <div v-if="hasMore" ref="sentinel" class="sentinel" aria-hidden="true" />
  </main>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { usePaginatedChords } from '../composables/usePaginatedChords';
import { usePaginationStore } from '../stores/pagination';
import type { ChordLabyrinth } from '../types/chords';
import ChordCard from './ChordCard.vue';

defineEmits<{
  (e: 'expand', lab: ChordLabyrinth): void;
}>();

const paginationStore = usePaginationStore();
const { filteredChords, visibleChords, hasMore } = usePaginatedChords();

// Reset visible count whenever the filtered set changes (search/sort/category)
watch(filteredChords, () => {
  paginationStore.reset();
});

// Infinite scroll sentinel
const sentinel = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        paginationStore.loadMore();
      }
    },
    { rootMargin: '200px' },
  );
});

// Re-observe whenever the sentinel mounts/unmounts (hasMore toggles)
watch(sentinel, (el) => {
  observer?.disconnect();
  if (el) observer?.observe(el);
});

onUnmounted(() => {
  observer?.disconnect();
});
</script>

<style lang="scss" scoped>
main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 24px 48px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;

  @include tablet {
    grid-template-columns: 1fr;
  }
}

.empty {
  text-align: center;
  padding: 80px 24px;
  @include serif(18px);
  color: var(--text-muted);
  font-style: italic;
}

.sentinel {
  height: 1px;
  margin-top: 40px;
}

.cards-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.cards-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
