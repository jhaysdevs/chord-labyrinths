import { computed } from 'vue';
import { useFilteredChords } from './useFilteredChords';
import { usePaginationStore } from '../stores/pagination';

export function usePaginatedChords() {
  const { filteredChords } = useFilteredChords();
  const paginationStore = usePaginationStore();

  const visibleChords = computed(() =>
    filteredChords.value.slice(0, paginationStore.visibleCount),
  );

  const hasMore = computed(
    () => visibleChords.value.length < filteredChords.value.length,
  );

  return { filteredChords, visibleChords, hasMore };
}
