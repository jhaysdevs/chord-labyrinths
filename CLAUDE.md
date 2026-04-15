# CLAUDE.md

## Project Overview

This project is a fully interactive chord progression explorer inspired by the original `chord-labyrinth.html` static implementation.

The goal is to evolve the concept into a bleeding-edge **Vue 3** application (Composition API + TypeScript) built with **Vite** that allows users to:

- Search chord progressions (by name, chords, genre, etc.)
- Interact with chord charts visually
- Highlight chords dynamically via UI interaction
- Navigate paginated datasets with smooth scrolling/animation
- Expand chord cards into detailed modal views

The experience should feel fluid, musical, and tactile — not just informational.

---

## Toolchain & Dev Environment

- **Node.js** 18+ required (20 LTS recommended)
- **pnpm** is the authoritative package manager — use `pnpm add` / `pnpm add -D`, not npm/yarn. `pnpm-lock.yaml` must stay in sync.
- Dev server runs at `127.0.0.1:5173` (strictPort — will error if port is taken)
- Preview server runs at `127.0.0.1:4173`

| Command        | Description                                         |
| -------------- | --------------------------------------------------- |
| `pnpm i`       | Install dependencies                                |
| `pnpm dev`     | Start Vite dev server                               |
| `pnpm build`   | Type-check with `vue-tsc`, then build to `dist/`    |
| `pnpm preview` | Serve production build locally                      |

---

## Project Structure

```text
src/
├── main.ts                    # App bootstrap (Pinia + Vue mount)
├── App.vue                    # Root layout: Header, SearchControls, ChordGrid, Pagination, Modal
├── components/
│   ├── Header.vue
│   ├── SearchControls.vue     # Search input, category pills, sort controls
│   ├── ChordGrid.vue          # Renders paginated chord cards
│   ├── ChordCard.vue          # Individual card with SVG diagram + chord pills
│   ├── ChordPills.vue         # Interactive chord toggles (local per-card state)
│   ├── Pagination.vue         # "Load more" pagination control
│   └── Modal.vue              # Expanded view (Escape/backdrop to close)
├── composables/
│   ├── useFilteredChords.ts   # Derived filtered+sorted list
│   ├── usePaginatedChords.ts  # Slices filtered list by visibleCount
│   ├── useScrollToTop.ts
│   └── useScrollReveal.ts     # GSAP-based scroll-in animation
├── stores/
│   ├── chords.ts              # Raw dataset from chords.json; exposes `categories` getter
│   ├── filters.ts             # searchQuery, selectedCategories, sortOption
│   └── pagination.ts          # visibleCount, PAGE_SIZE = 16
├── utils/
│   ├── filtering.ts
│   ├── scrolling.ts
│   └── svg.ts                 # SVG chord diagram builder (buildSVG)
├── types/
│   └── chords.ts              # ChordLabyrinth type, SortOption type
└── data/
    └── chords.json            # Bundled progression dataset
```

---

## Core Concepts

### 1. Chord Labyrinths (Data Model)

Defined in `src/types/chords.ts`:

```ts
type ChordLabyrinth = {
  id: number;
  title: string;
  subtitle: string;
  category: string;
  description: string;
  chords: string[];
  example: string;
  color: string;    // per-card primary color (hex)
  accent: string;   // per-card accent color (hex)
};

type SortOption = 'default' | 'az' | 'chords-asc' | 'chords-desc';
```

### 2. State Management (Pinia)

| Store                  | Responsibility                                            |
| ---------------------- | --------------------------------------------------------- |
| `stores/chords.ts`     | Raw dataset loaded from JSON; `categories` getter         |
| `stores/filters.ts`    | `searchQuery`, `selectedCategories`, `sortOption`; reset action |
| `stores/pagination.ts` | `visibleCount` (load-more pattern, PAGE_SIZE = 16)        |

Derived lists (filtered, paginated) live in composables (`useFilteredChords`, `usePaginatedChords`), not directly in stores.

### 3. Key Dependencies

- **Pinia** — state management
- **GSAP** — scroll reveal animations (`useScrollReveal`)
- **@vueform/multiselect** — multiselect UI in SearchControls
- **isotope-layout** — grid layout (imported but verify actual usage)

### 4. SVG Chord Diagrams

`src/utils/svg.ts` exports `buildSVG(labyrinth, size)` which returns an SVG string rendered via `v-html` in `ChordCard`. Interactive nodes have class `.node-g` and `data-node` / `data-id` attributes. Chord pill toggles and SVG node highlights are kept in sync via `highlightSVGNode` in `ChordCard.vue`.

---

## Styling

Components use **plain CSS** in `<style scoped>` blocks (not SCSS). Global theme tokens are CSS variables declared on `:root` in `App.vue`:

```css
--bg, --bg2, --bg3          /* dark backgrounds */
--text, --text-muted, --text-dim
--border, --border-hover
--gold, --gold-dim           /* primary accent */
```

Per-card dynamic colors use `--card-color` and `--card-accent` CSS variables set via `:style` bindings.

Typography: `'Crimson Pro'` (serif body), `'Playfair Display'` (card titles), `'Space Mono'` (monospace labels/metadata).

---

## Pagination Pattern

Pagination is **load-more** (not page-based): `visibleCount` grows by 16 on each "load more" click. Filtering/sorting resets `visibleCount` back to `PAGE_SIZE`.

---

## Guiding Principle

This is not only a chord lookup tool — it should feel like **exploring a musical system**. Clicks, hovers, and transitions should reinforce a sense of discovery, not just deliver facts. Prioritize interaction over static display; keep components small and composable.
