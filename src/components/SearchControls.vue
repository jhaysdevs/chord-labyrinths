<template>
  <div id="controls">
    <div class="controls-inner">
      <div class="search-controls">
        <input v-model="debouncedQuery" type="text" class="search-input" placeholder="Search chords, styles, artists…"
          autocomplete="off" aria-label="Search chord progressions" />
        <div class="multiselect-wrap">
          <Multiselect v-model="selectedCategories" mode="multiple" :options="categoryOptions" :searchable="true"
            :close-on-select="false" value-prop="value" label="label"
            :placeholder="`Filter from ${categoryOptions.length} categories…`" @change="onCategoriesChange">
            <template #multiplelabel="{ values }">
              <span class="ms-multiple-label">
                <span class="ms-count">{{ (values as unknown[]).length }}</span>
                <span class="ms-of"> of </span>
                <span class="ms-count">{{ categoryOptions.length }}</span>
                <span class="ms-of"> categories</span>
              </span>
            </template>
            <template #option="{ option }">
              <span class="ms-option-label">{{ option.label }}</span>
              <span class="ms-option-count">{{ option.count }}</span>
            </template>
            <template #tag="{ option, handleTagRemove }">
              <span class="ms-tag">
                {{ option.label }}
                <button class="ms-tag-remove" @mousedown.prevent="handleTagRemove(option, $event)">✕</button>
              </span>
            </template>
            <template #noresults>
              <span class="ms-no-result">No categories match</span>
            </template>
            <template #nooptions>
              <span class="ms-no-result">No categories available</span>
            </template>
          </Multiselect>
        </div>
        <div class="sort-wrap">
          <Multiselect v-model="selectedSort" :options="sortOptions" :searchable="false" :can-clear="false"
            :can-deselect="false" value-prop="value" label="label" aria-label="Sort order" @change="onSort" />
        </div>
      </div>

    </div>
    <div class="stats-bar">
      <p class="stat">
        Showing <strong>{{ visibleChords.length }}</strong> of
        <strong>{{ filteredChords.length }}</strong> labyrinths
        <template v-if="filteredChords.length !== totalCount">
          — <strong>{{ totalCount }}</strong> total
        </template>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useChordsStore } from '../stores/chords';
import { useFiltersStore } from '../stores/filters';
import type { SortOption } from '../types/chords';
import { scrollToTop } from '../utils/scrolling';
import Multiselect from '@vueform/multiselect';
import { usePaginatedChords } from '../composables/usePaginatedChords';

const chordsStore = useChordsStore();
const filtersStore = useFiltersStore();
const { filteredChords, visibleChords } = usePaginatedChords();
const totalCount = computed(() => chordsStore.data.length);

// Options: array of { value, label, count } — value-prop="value" tells
// multiselect to use .value as the stored key, so v-model holds string[].
const categoryOptions = chordsStore.categories.map((cat) => ({
  value: cat,
  label: cat,
  count: chordsStore.data.filter((d) => d.category === cat).length,
}));

// Local ref holds string[] — multiselect stores values (not full objects)
// because value-prop="value" is set.
const selectedCategories = ref<string[]>([...filtersStore.selectedCategories]);

function onCategoriesChange(vals: string[]) {
  filtersStore.selectedCategories = vals ?? [];
  scrollToTop();
}

// Keep local ref in sync if store resets from elsewhere (e.g. search clear)
watch(
  () => filtersStore.selectedCategories,
  (vals) => {
    selectedCategories.value = [...vals];
  },
);

const sortOptions = [
  { value: 'default', label: 'Sort: Default' },
  { value: 'az', label: 'Sort: A–Z' },
  { value: 'chords-asc', label: 'Sort: Fewest Chords' },
  { value: 'chords-desc', label: 'Sort: Most Chords' },
  { value: 'complex', label: 'Sort: Complex Chords' },
];

const selectedSort = ref<SortOption>(filtersStore.sortOption);

function onSort(val: SortOption) {
  filtersStore.setSort(val);
}

const debouncedQuery = ref(filtersStore.searchQuery);
let debounceTimer: ReturnType<typeof setTimeout>;
watch(debouncedQuery, (val) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    filtersStore.setSearch(val);
  }, 300);
});
</script>

<style src="@vueform/multiselect/themes/default.css"></style>

<style lang="scss" scoped>
#controls {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(8, 8, 14, 0.92);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid var(--border);
  padding: 14px 24px;
}

.controls-inner {
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;

  @include mobile {
    flex-direction: column;
    align-items: stretch;
  }
}

.search-controls {
  width: 100%;
  display: flex;
  gap: 12px;

  @include tablet {
    flex-direction: column;
    align-items: stretch;
  }
}

.search-input {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 32px;
  padding: 5px 20px;
  @include mono(11px, 0.04em);
  color: var(--text-muted);
  width: 400px;
  max-width: 100%;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: var(--gold-active);
  }

  &::placeholder {
    color: var(--text-dim);
  }

  @include tablet {
    width: 100%;
    height: 30.5px;
  }
}

.stats-bar {
  max-width: 1400px;
  margin: 0 auto;
  padding: 8px 0 0;
}

.stat {
  @include mono(10px, 0.1em);
  color: var(--text-muted);

  strong {
    color: var(--gold);
  }
}

.sort-wrap {
  min-width: 200px;
}

// ── Multiselect container ──────────────────────────────────────────
.multiselect-wrap {
  flex: 1;
  min-width: 270px;
  max-width: 100%;

  @include mobile {
    max-width: 100%;
  }
}

:deep(.multiselect) {
  --ms-font-size: 11px;
  --ms-line-height: 1.5;
  --ms-bg: rgba(255, 255, 255, 0.04);
  --ms-bg-disabled: transparent;
  --ms-border-color: rgba(255, 255, 255, 0.1);
  --ms-border-width: 1px;
  --ms-border-color-active: rgba(232, 197, 71, 0.55);
  --ms-radius: 20px;
  --ms-py: 6px;
  --ms-px: 14px;
  --ms-ring-width: 0px;
  --ms-ring-color: transparent;
  --ms-placeholder-color: rgba(200, 200, 220, 0.3);
  --ms-max-height: 320px;

  --ms-dropdown-bg: #0e0e1a;
  --ms-dropdown-border-color: rgba(255, 255, 255, 0.1);
  --ms-dropdown-border-width: 1px;
  --ms-dropdown-radius: 12px;

  --ms-option-font-size: 11px;
  --ms-option-bg-pointed: rgba(232, 197, 71, 0.08);
  --ms-option-color-pointed: #e8e8f0;
  --ms-option-bg-selected: rgba(232, 197, 71, 0.14);
  --ms-option-color-selected: var(--gold);
  --ms-option-bg-selected-pointed: rgba(232, 197, 71, 0.2);
  --ms-option-color-selected-pointed: var(--gold);
  --ms-option-py: 8px;
  --ms-option-px: 14px;

  --ms-tag-bg: rgba(232, 197, 71, 0.14);
  --ms-tag-color: var(--gold);
  --ms-tag-radius: 20px;
  --ms-tag-font-size: 10px;
  --ms-tag-font-weight: 700;
  --ms-tag-py: 2px;
  --ms-tag-px: 8px;
  --ms-tag-my: 2px;
  --ms-tag-mx: 2px;

  color: rgba(200, 200, 220, 0.7);
  font-family: 'Space Mono', monospace;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

:deep(.multiselect.is-active) {
  box-shadow: none;
}

:deep(.multiselect-search) {
  background: transparent;
  color: #e8e8f0;
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  // iOS Safari zooms in on focus when font-size < 16px — override for mobile.
  @include mobile {
    font-size: 16px;
  }
}

:deep(.multiselect-placeholder) {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

:deep(.multiselect-single-label) {
  width: 100%;
  padding-right: 2rem;
}

:deep(.multiselect-dropdown) {
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
  border-left: 1px solid var(--ms-border-color-active);
  border-right: 1px solid var(--ms-border-color-active);
  border-bottom: 1px solid var(--ms-border-color-active);
}

:deep(.multiselect-option) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: 'Space Mono', monospace;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

:deep(.multiselect-tag) {
  border: 1px solid rgba(232, 197, 71, 0.35);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

:deep(.multiselect-tag-remove) {
  opacity: 0.6;
  transition: opacity 0.15s;

  &:hover {
    opacity: 1;
  }
}

:deep(.ms-multiple-label) {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  display: flex;
  align-items: center;
  padding-left: 14px;
  pointer-events: none;
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(200, 200, 220, 0.5);
}

:deep(.ms-count) {
  color: var(--gold);

  &:first-of-type {
    margin-right: 4px;
  }

  &:not(:first-of-type) {
    margin-left: 4px;
    margin-right: 4px;
  }
}

:deep(.multiselect-clear) {
  &:hover .multiselect-clear-icon {
    background: var(--gold);
  }
}

:deep(.multiselect-caret) {
  cursor: pointer;
}

:deep(.ms-option-count) {
  font-size: 9px;
  color: var(--gold);
  margin-left: 8px;
  letter-spacing: 0.04em;
}

:deep(.ms-no-result) {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  color: rgba(200, 200, 220, 0.35);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 10px 14px;
  display: block;
}
</style>
