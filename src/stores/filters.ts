import { defineStore } from 'pinia';
import type { SortOption } from '../types/chords';

export const useFiltersStore = defineStore('filters', {
  state: () => ({
    searchQuery: '',
    selectedCategories: [] as string[],
    sortOption: 'default' as SortOption,
  }),
  actions: {
    setSearch(q: string) {
      this.searchQuery = q;
    },
    toggleCategory(cat: string) {
      const idx = this.selectedCategories.indexOf(cat);
      if (idx === -1) {
        this.selectedCategories = [...this.selectedCategories, cat];
      } else {
        this.selectedCategories = this.selectedCategories.filter((c) => c !== cat);
      }
    },
    setSort(opt: SortOption) {
      this.sortOption = opt;
    },
    reset() {
      this.searchQuery = '';
      this.selectedCategories = [];
      this.sortOption = 'default';
    },
  },
});
