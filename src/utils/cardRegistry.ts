/**
 * Module-level map from labyrinth id → card API.
 * Lets Modal drive card state without prop-drilling or a new store.
 * Entries are added on ChordCard mount and removed on unmount.
 */
export interface CardApi {
  syncChord: (idx: number, active: boolean) => void;
  getActiveChords: () => Set<number>;
}

export const cardRegistry = new Map<number, CardApi>();
