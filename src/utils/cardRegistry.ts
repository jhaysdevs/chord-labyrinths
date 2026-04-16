/**
 * Module-level map from labyrinth id → the card's syncChord function.
 * Lets Modal drive card state without prop-drilling or a new store.
 * Entries are added on ChordCard mount and removed on unmount.
 */
export const cardRegistry = new Map<number, (idx: number, active: boolean) => void>();
