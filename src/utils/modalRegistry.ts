export interface ModalApi {
  setActive: (i: number, active: boolean) => void;
}

/** Inverse of cardRegistry — lets ChordCard update modal pill button state. */
export const modalRegistry = new Map<number, ModalApi>();
