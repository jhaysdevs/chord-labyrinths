import { computed } from 'vue';
import { useChordsStore } from '../stores/chords';
import { useFiltersStore } from '../stores/filters';
import { filterChords } from '../utils/filtering';

export function useFilteredChords() {
  const chordsStore = useChordsStore();
  const filtersStore = useFiltersStore();

  const filteredChords = computed(() =>
    filterChords(
      chordsStore.data,
      filtersStore.searchQuery,
      filtersStore.selectedCategories,
      filtersStore.sortOption,
    ),
  );

  return { filteredChords };
}
