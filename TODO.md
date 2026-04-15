## Structure

- src/components/Header.vue — Title, subtitle, decorative rule
  - src/components/SearchControls.vue — Search input, category pills, sort
    select
  - src/components/ChordGrid.vue — Responsive card grid with transitions
  - src/components/ChordCard.vue — Card with SVG diagram, pills, expand button
  - src/components/ChordPills.vue — Togglable chord pills (local state)
  - src/components/Pagination.vue — Page buttons with ellipsis, prev/next
  - src/components/Modal.vue — Fullscreen expanded view, focus trap,
    Escape/backdrop close

## App Entry

- src/App.vue — Root layout, ambient background, component wiring
- src/main.ts — Vue + Pinia bootstrap
