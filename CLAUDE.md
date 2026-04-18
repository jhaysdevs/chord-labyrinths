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
├── App.vue                    # Root layout: Header, SearchControls, ChordGrid, Modal
├── components/
│   ├── Header.vue
│   ├── SearchControls.vue     # Search input, category pills, sort controls
│   ├── ChordGrid.vue          # Renders paginated cards; owns infinite-scroll sentinel
│   ├── ChordCard.vue          # Individual card with SVG diagram + chord pills
│   ├── ChordPills.vue         # Interactive chord toggles (local per-card state)
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

### 5. Shared Interaction State — Modal ↔ Card

**Design intent:** the modal is an *expanded view* of the card, not an independent context. Toggling a `.chord-pill` button or clicking an SVG node in either the modal or the card must produce identical visual state in both — the same pill is active, the same SVG node is highlighted, in both places simultaneously.

**What "shared state" covers:**

- `.chord-pill` button active state (filled/colored vs. outline) — `ChordPills.activeChords`
- SVG node fill, stroke, and arc highlight — driven by `highlightSVGNode` in `src/utils/svg.ts`

**How it is implemented:**

| Piece | File | Role |
|---|---|---|
| `highlightSVGNode(labId, nodeIdx, on, container)` | `src/utils/svg.ts` | Shared helper — pass the card root or `#lab-modal` as `container`. Call once per container that needs updating. |
| `cardRegistry` | `src/utils/cardRegistry.ts` | Module-level `Map<labyrinthId, syncChord>`. Cards register on mount, deregister on unmount. Modal looks up the live card by id. |
| `ChordPills.setActive(i, active)` | `ChordPills.vue` | Silent state setter — updates `activeChords` without emitting `toggle`. Used for cross-context sync to avoid feedback loops. |
| `ChordCard.syncChord(idx, active)` | `ChordCard.vue` | Calls `setActive` on the card's `ChordPills` + `highlightSVGNode` on the card container. Registered in `cardRegistry` on mount. |

**Data flow:**

- **Modal pill/node toggled →** `Modal.onPillToggle` calls `highlightSVGNode` on `#lab-modal`, then calls `cardRegistry.get(id)` to invoke `ChordCard.syncChord` — updating the card's pill buttons and SVG silently.
- **Card pill/node toggled →** `ChordCard.onPillToggle` calls `highlightSVGNode` on the card container and also on `#lab-modal` (a no-op when the modal is closed, since `null` is handled gracefully).

**Rules for future changes:**

- Never add a second `ChordPills` instance per labyrinth with its own isolated state. Pill state must always flow through `syncChord` / `setActive` when crossing the card↔modal boundary.
- Always call `highlightSVGNode` with an explicit container — never use an unscoped `document.querySelector` for SVG node selection, as both card and modal share the same `data-id` tokens and DOM order is not guaranteed.
- `setActive` intentionally does not emit. Do not change it to emit — that would create a sync loop (modal → card → modal → …).

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

## Performance

### Resize jank with a full grid

Two rules to keep when touching `ChordCard` or `useScrollReveal`:

1. **No `filter: blur()` in GSAP scroll reveal.** Pre-revealed cards (still at `opacity: 0`) that carry a CSS blur force the browser to composite each one in a separate off-screen pass. With a full page of cards this makes every resize frame expensive. The reveal animation uses `opacity` + `y` only — the effect is equivalent and the cost is near-zero.

2. **`contain: layout` on `.card`.** CSS containment tells the browser that a card's internal layout changes don't affect siblings or the grid, and vice versa. Without it, the SVG content inside each card participates in the global reflow cascade whenever the grid recalculates column widths on resize. Don't remove this property, and don't add `contain: paint` — it would clip the SVGs which use `overflow: visible`.

---

## Guiding Principle

This is not only a chord lookup tool — it should feel like **exploring a musical system**. Clicks, hovers, and transitions should reinforce a sense of discovery, not just deliver facts. Prioritize interaction over static display; keep components small and composable.
