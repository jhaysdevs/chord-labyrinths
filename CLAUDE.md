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
│   ├── ChordPills.vue         # Sequential chord toggles with audio playback
│   └── Modal.vue              # Expanded view (Escape/backdrop to close)
├── composables/
│   ├── useFilteredChords.ts   # Derived filtered+sorted list
│   ├── usePaginatedChords.ts  # Slices filtered list by visibleCount
│   ├── useScrollToTop.ts
│   ├── useScrollReveal.ts     # GSAP-based scroll-in animation (opacity + y only)
│   └── useMediaQuery.ts       # Reactive wrapper around window.matchMedia
├── stores/
│   ├── chords.ts              # Raw dataset from chords.json; exposes `categories` getter
│   ├── filters.ts             # searchQuery, selectedCategories, sortOption
│   └── pagination.ts          # visibleCount, PAGE_SIZE = 16
├── utils/
│   ├── filtering.ts
│   ├── scrolling.ts
│   ├── svg.ts                 # SVG chord diagram builder + highlightSVGNode
│   ├── tones.ts               # Tone.js Roman numeral parser + playChord / stopAll
│   ├── cardRegistry.ts        # Modal → card sync bridge (CardApi)
│   └── modalRegistry.ts       # Card → modal sync bridge (ModalApi)
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
- **Tone.js** — Web Audio chord playback (`src/utils/tones.ts`)
- **isotope-layout** — grid layout (imported but verify actual usage)

### 4. SVG Chord Diagrams

`src/utils/svg.ts` exports `buildSVG(labyrinth, size, visualSize?)` which returns an SVG string rendered via `v-html` in `ChordCard` and `Modal`. The optional `visualSize` parameter decouples the canvas layout size from the visual scale of nodes and text — useful for tablet breakpoints where the canvas grows but node/font sizes stay proportional.

Interactive nodes have class `.node-g` and `data-node` / `data-id` attributes. The shared `highlightSVGNode(labId, nodeIdx, on, container)` helper applies fill, stroke, and arc highlight to a node — always pass an explicit container (`cardRef.value` or `document.getElementById('lab-modal')`) to avoid cross-card DOM collisions.

### 5. Shared Interaction State — Modal ↔ Card

**Design intent:** the modal is an *expanded view* of the card, not an independent context. Toggling a `.chord-pill` button or clicking an SVG node in either the modal or the card must produce identical visual state in both — the same pill is active, the same SVG node is highlighted, in both places simultaneously.

**What "shared state" covers:**

- `.chord-pill` button active state (filled/colored vs. outline) — `ChordPills.activeChords`
- SVG node fill, stroke, and arc highlight — driven by `highlightSVGNode` in `src/utils/svg.ts`

**How it is implemented:**

| Piece | File | Role |
|---|---|---|
| `highlightSVGNode(labId, nodeIdx, on, container)` | `src/utils/svg.ts` | Shared helper — pass the card root or `#lab-modal` as `container`. Call once per container that needs updating. |
| `cardRegistry` | `src/utils/cardRegistry.ts` | Module-level `Map<labyrinthId, CardApi>`. Cards register on mount, deregister on unmount. Modal uses it to sync card pill/SVG state. |
| `modalRegistry` | `src/utils/modalRegistry.ts` | Inverse of `cardRegistry` — `Map<labyrinthId, ModalApi>`. Modal registers on open (watch), deregisters on close. Card uses it to sync modal pill button state. |
| `ChordPills.setActive(i, active)` | `ChordPills.vue` | Silent state setter — updates `activeChords` without emitting `toggle`. Used for cross-context sync to avoid feedback loops and audio side-effects. |
| `ChordCard.syncChord(idx, active)` | `ChordCard.vue` | Calls `setActive` on the card's `ChordPills` + `highlightSVGNode` on the card container. Registered in `cardRegistry` on mount. |

**Data flow:**

- **Modal pill/node toggled →** `Modal.onPillToggle` calls `highlightSVGNode` on `#lab-modal`, then calls `cardRegistry.get(id)?.syncChord` — updating the card's pill buttons and SVG silently.
- **Card pill/node toggled →** `ChordCard.onPillToggle` calls `highlightSVGNode` on the card container, `highlightSVGNode` on `#lab-modal`, and `modalRegistry.get(id)?.setActive` — updating the modal's pill buttons silently. This covers the auto-reset case as well as individual pill changes.

**Modal open behaviour:** `onModalAfterEnter` mirrors whatever pills the card already has active via `setActive` + `highlightSVGNode`. If no pills are active on the card (the default initial state), the modal opens with all pills inactive. There is no fallback auto-activation.

**Rules for future changes:**

- Never add a second `ChordPills` instance per labyrinth with its own isolated state. Pill state must always flow through `syncChord` / `setActive` when crossing the card↔modal boundary.
- Always call `highlightSVGNode` with an explicit container — never use an unscoped `document.querySelector` for SVG node selection, as both card and modal share the same `data-id` tokens and DOM order is not guaranteed.
- `setActive` intentionally does not emit and does not trigger audio. Do not change it to emit — that would create a sync loop (modal → card → modal → …).

### 6. Audio Playback — `src/utils/tones.ts`

Tone.js provides Web Audio synthesis. `tones.ts` is imported by `ChordPills.vue`, which triggers playback on every chord pill click.

**Public API:**

| Export | Signature | Purpose |
|---|---|---|
| `chordToNotes` | `(symbol: string) → string[]` | Parse a Roman numeral chord symbol into Tone.js note strings |
| `playChord` | `async (symbol, duration?) → void` | Start AudioContext + play the chord (must be called from a user gesture) |
| `stopAll` | `() → void` | Immediately silence all sounding notes |
| `disposeSynth` | `() → void` | Tear down the PolySynth — call on app unmount |

**Playback trigger rule:** `playChord` is called **only from direct user interaction**. Silent state operations — `setActive`, `syncChord`, and `onModalAfterEnter` — never call `playChord`. `useScrollReveal` does not trigger any pill interaction. Audio is always the result of an intentional user gesture.

**Pill clicks:** `ChordPills.toggle` calls `stopAll()` then `playChord` on every click. If the pill is already active, the chord replays without changing state. If the pill is inactive and passes the sequential gate, it activates and plays.

**SVG circle clicks:** `onSvgChordInteract` in `ChordCard` and `Modal` always calls `stopAll()` + `playChord(chords[idx])` unconditionally before calling `toggle`. This means clicking any SVG node plays its chord regardless of whether the sequential gate has been reached — audio is never blocked by the pill lock state. The `toggle` call that follows still applies the gate for visual state changes.

**Sequential pill gate (`ChordPills`):**
- All pills start inactive. No pill is auto-activated on card load or modal open.
- Pill `i` can only be activated once all pills `0..i-1` are already active. Pills that cannot yet be activated are shown at 35% opacity with `cursor: not-allowed` — including at initial load, so only the first pill appears clickable by default.
- Clicking an already-active pill replays its chord without changing state.
- When the last pill is activated, all pills auto-reset to inactive after 800 ms — `toggle false` is emitted for each formerly active index so both card and modal SVGs and pill buttons clear in sync.

**Reference key:** C major. Uppercase Roman numerals = major context; lowercase = minor context. All 149 chord symbols found in `chords.json` are covered.

**Parser rules (in order):**
1. Leading accidental: `♭` / `♯` before the numeral flattens/sharpens the root.
2. Roman numeral: longest match first (`VII` before `VI`, `IV` before `I`, etc.), case-insensitive to handle mixed-case data.
3. Trailing root accidental: `♯` / `♭` immediately after the numeral (e.g. `XI♯`) that isn't an extension alteration (`♯9`, `♯11`, etc.).
4. Base quality: `5` = power chord · `m7♭5` = half-diminished · `°7`/`dim7` = diminished 7th · `°` = diminished triad · `+` (not followed by digit/numeral/accidental) = augmented · `m` (not `maj`) = explicit minor.
5. Extensions: `maj7`, `maj9`, bare `7`/`9`/`11`/`13` (all imply a dominant 7th), `add9`, `sus2`, `sus4`, `to13`.
6. Alterations: `♭9`, `♯9`, `♭5`, `♯11`, `♭13`, `+6`, bare `6`.
7. Compound/polychord symbols (`I+IV`, `♭VI+II`) and microtonal modifiers (`↑¼`) are gracefully ignored — the base chord is returned.

**Voicing:** bass note in octave 2, chord tones starting in octave 3. Extensions beyond an octave (9th = 14 semitones, 13th = 21 semitones) automatically land in octave 4 via the semitone arithmetic — no manual octave juggling needed.

**Synth:** lazy singleton `PolySynth(Synth)` with a triangle oscillator and piano-like envelope (fast attack, 0.4 s decay, long 3 s release). `playChord` calls `Tone.start()` internally, so the only requirement from the caller is that it runs inside a user-gesture handler.

---

## Styling

Components use **SCSS** in `<style lang="scss" scoped>` blocks. Global mixins and variables live in `src/styles/` and are auto-imported via Vite. Global theme tokens are CSS variables declared on `:root` in `App.vue`:

```css
--bg, --bg2, --bg3          /* dark backgrounds */
--text, --text-muted, --text-dim
--border, --border-hover
--gold, --gold-dim           /* primary accent */
```

Per-card dynamic colors use `--card-color` and `--card-accent` CSS variables set via `:style` bindings.

Typography: `'Crimson Pro'` (serif body), `'Playfair Display'` (card titles), `'Space Mono'` (monospace labels/metadata).

Breakpoints: `$bp-tablet: 868px` (`@mixin tablet`), `$bp-mobile` (`@mixin mobile`). At the tablet breakpoint, grid cards go full-width and SVG canvas grows to 300px with 180px visual size.

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
