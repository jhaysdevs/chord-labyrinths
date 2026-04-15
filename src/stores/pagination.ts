import { defineStore } from 'pinia';

const PAGE_SIZE = 16;

export const usePaginationStore = defineStore('pagination', {
  state: () => ({ visibleCount: PAGE_SIZE }),
  actions: {
    reset() {
      this.visibleCount = PAGE_SIZE;
    },
    loadMore() {
      this.visibleCount += PAGE_SIZE;
    },
  },
});
