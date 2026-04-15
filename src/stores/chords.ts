import { defineStore } from 'pinia';
import type { ChordLabyrinth } from '../types/chords';
import rawData from '../data/chords.json';

export const useChordsStore = defineStore('chords', {
  state: () => ({
    data: rawData as ChordLabyrinth[],
  }),
  getters: {
    categories: (state): string[] =>
      [...new Set(state.data.map((d) => d.category))].sort(),
  },
});
