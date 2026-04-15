import type { ChordLabyrinth, SortOption } from '../types/chords';

export function filterChords(
  data: ChordLabyrinth[],
  query: string,
  categories: string[],
  sort: SortOption,
): ChordLabyrinth[] {
  let result = data;

  if (categories.length > 0) {
    result = result.filter((d) => categories.includes(d.category));
  }

  if (query.trim()) {
    const q = query.toLowerCase();
    result = result.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.subtitle.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.chords.some((c) => c.toLowerCase().includes(q)) ||
        d.example.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q),
    );
  }

  switch (sort) {
    case 'az':
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'chords-asc':
      result = [...result].sort((a, b) => a.chords.length - b.chords.length);
      break;
    case 'chords-desc':
      result = [...result].sort((a, b) => b.chords.length - a.chords.length);
      break;
  }

  return result;
}
