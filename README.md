# Chord Labyrinth Explorer

An interactive chord progression explorer, evolving from a static HTML prototype into a **Vue 3** app (Composition API + TypeScript) built with **Vite**. The focus is on **discovery**: search and filter progressions, explore chord pills, paginate smoothly, and open rich modal views—so the UI feels musical and tactile, not like a flat reference table.

---

## Requirements

- **Node.js** 18+ (20 LTS recommended)
- **[pnpm](https://pnpm.io/)** — this repo uses a `pnpm-lock.yaml`; use pnpm for installs and scripts so the lockfile stays authoritative.

If you do not have pnpm yet:

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

(Alternatively: `npm install -g pnpm`.)

---

## Getting started

From the repository root:

| Command        | Description                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------- |
| `pnpm i`       | Install dependencies                                                                         |
| `pnpm dev`     | Start Vite dev server (see [vite.config.ts](vite.config.ts): `127.0.0.1:5173`, `strictPort`) |
| `pnpm build`   | Type-check with `vue-tsc`, then production build to `dist/`                                  |
| `pnpm preview` | Serve the production build locally (`127.0.0.1:4173` by default)                             |

**Suggestions**

- Prefer `pnpm add <pkg>` / `pnpm add -D <pkg>` over editing `package.json` by hand so the lockfile updates consistently.
- After cloning, run `pnpm i` before any script; do not commit `node_modules/` (see `.gitignore`).

---

## Data

- **Current**: `src/data/chords.json` is bundled with the app.
- **Future**: The same model can be loaded from an API as the project scales.
- **Behavior**: Filterable and sortable; **pagination** is client-side by default (server-side pagination if the dataset or traffic grows).

---

## Data model

Each progression (“chord labyrinth”) follows this shape:

```ts
type ChordLabyrinth = {
  id: number
  title: string
  subtitle: string
  category: string
  description: string
  chords: string[]
  example: string
  color: string
  accent: string
}
```

---

## Project structure

```text
.
├── index.html              # Vite entry HTML
├── vite.config.ts
├── package.json
├── pnpm-lock.yaml
├── src/
│   ├── main.ts             # App bootstrap
│   ├── App.vue             # Root layout (header, search, grid, pagination, modal)
│   ├── components/         # Vue SFCs (Header, SearchControls, ChordGrid, …)
│   ├── composables/        # useFilteredChords, usePaginatedChords, useScrollToTop, useScrollReveal, …
│   ├── stores/             # Pinia: chords, filters, pagination
│   ├── utils/              # filtering, scrolling, svg helpers
│   ├── types/              # chord / labyrinth TypeScript types
│   └── data/
│       └── chords.json     # Bundled progression data
└── dist/                   # Production build output (gitignored)
```

State is managed with **Pinia**. Derived lists (filtered / paginated) live in composables and/or store getters.

| Store                  | Responsibility                              |
| ---------------------- | ------------------------------------------- |
| `stores/chords.ts`     | Raw dataset (loaded from JSON / future API) |
| `stores/filters.ts`    | Search, category, sort                      |
| `stores/pagination.ts` | Current page and page size                  |

---

## Core features

### Search and filtering

- **Text search** across title, chord symbols, and examples.
- **Category filtering** via a pill-based UI.
- **Sorting**:
  - Default (source order or project-defined)
  - A–Z (by title)
  - Fewest chords
  - Most chords

### Chord cards

Each progression is a **card** with:

- Title and subtitle
- Description
- Optional SVG chord diagram (can ship after basics)
- **Chord pills** (interactive; see below)
- Example references

**Interaction**

- Hover: subtle elevation and clear visual feedback
- **Expand**: opens a modal with more detail
- Chord pills: toggle highlight state (per card)

### Chord pills (key interaction)

Pills are the primary way to “play” with a progression on the card.

- **Click** toggles active state for that chord on **that card** (local state).
- **Multiple** chords can be active at once.
- Active pills: stronger emphasis (glow, brightness, or slight scale)—keep contrast accessible.

**Implementation sketch**

- Prefer **local component state** (`ref(new Set<string>())`) or a **keyed** structure scoped to the card (e.g. `activeChords: Set<string>`).
- Avoid global state unless you later add cross-card sync intentionally.

**Optional later**

- Highlight matching nodes in SVG diagrams
- Hover on SVG highlights matching pills
- Tooltips on diagram nodes

### Pagination

- Show a limited number of cards per page (e.g. 12–24).
- Surface **current page**, **total pages**, and **result counts**.
- Changing page updates the visible slice and **scrolls smoothly** to the top of the list area or page.

Example:

```js
window.scrollTo({ top: 0, behavior: 'smooth' })
```

(Easing-based scroll is an option for extra polish.)

### Modal (expanded view)

Opening a card shows a **large** view with:

- Larger chord diagram (when present)
- Full description
- Larger chord pills (still interactive)
- Example references and category label

**Behavior**

- **Escape** closes the modal
- **Backdrop click** closes the modal
- **Focus trap** inside the dialog for accessibility (`role="dialog"`, labelled)

### Motion and transitions

Use Vue transitions for:

- Card enter/leave (fade, fly, or custom)
- Pagination changes
- Modal open/close
- Chord pill activation feedback

Aim to avoid jarring layout jumps and unnecessary full-tree reflows.

---

## Performance

- Debounce search input.
- Use **keyed** lists where it reduces churn.
- Keep heavy work in **derived stores**, not ad hoc in every component.
- If the dataset grows large, consider list virtualization.

---

## Accessibility

- Keyboard support for all interactive controls.
- `aria-pressed` (or equivalent) for chord pill toggle state.
- Modal: `role="dialog"`, focus trap, return focus on close.
- Sufficient **color contrast** for default and highlighted chords.
- Visible **focus** styles.

---

## Visual direction

Preserve the spirit of the original:

- Dark, ambient base
- Gold / warm accent highlights
- Serif + monospace pairing
- Soft glow on emphasis

Modernize with:

- **CSS variables** for theme tokens
- **Component-scoped** styles
- Optional utility layer (e.g. Tailwind) if the team prefers it

---

## Future enhancements

- Audio playback per progression
- MIDI / Web Audio integration
- Saved favorites
- **URL state** for shareable links
- Animated transitions between chords
- Circle-of-fifths (or similar) visualization mode

---

## Development philosophy

- Prioritize **interaction** over static display.
- Keep components **small and composable**.
- Prefer **reactive data flow** over imperative DOM work.
- Design for **extensibility** (audio, visualization, API swap).

---

## MVP checklist

- [ ] Render cards from the dataset
- [ ] Search and category filter working
- [ ] Sort options working
- [ ] Pagination with smooth scroll-to-top
- [ ] Chord pills clickable with persistent per-card highlight
- [ ] Modal with expanded content and keyboard/backdrop close
- [ ] Smooth transitions for main state changes

---

## Guiding principle

This is not only a chord lookup tool—it should feel like **exploring a musical system**. Clicks, hovers, and transitions should reinforce a sense of discovery, not just deliver facts.
