export type ChordLabyrinth = {
  id: number;
  title: string;
  subtitle: string;
  category: string;
  description: string;
  chords: string[];
  example: string;
  color: string;
  accent: string;
};

export type SortOption = 'default' | 'az' | 'chords-asc' | 'chords-desc';
