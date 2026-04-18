/**
 * tones.ts
 *
 * Roman numeral chord symbol → Tone.js note strings, relative to C major.
 *
 * Reference key: C major (C = 0). Uppercase numerals = major context,
 * lowercase = minor context. All 149 chord symbols found in chords.json
 * are covered; exotic/microtonal ones (e.g. I↑¼) fall back gracefully to
 * the nearest diatonic triad.
 *
 * Public API:
 *   chordToNotes(symbol)       → string[]  (Tone.js note names)
 *   playChord(symbol, dur?)    → Promise<void>
 *   stopAll()                  → void
 *   disposeSynth()             → void
 */

import { PolySynth, Synth, start as toneStart } from 'tone';

// ── Note utilities ─────────────────────────────────────────────────────────

const CHROMATIC = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
] as const;

/**
 * Map a semitone offset (can be >11 or negative) + base octave to a
 * Tone.js note string.  Offsets beyond 12 automatically wrap into the
 * next octave, which is the correct behaviour for chord extensions
 * (e.g. the 13th lives an octave above the 6th).
 */
function semitoneToNote(semitone: number, baseOctave: number): string {
  const norm = ((semitone % 12) + 12) % 12;
  const octave = baseOctave + Math.floor(semitone / 12);
  return `${CHROMATIC[norm]}${octave}`;
}

function uniq(arr: number[]): number[] {
  return [...new Set(arr)].sort((a, b) => a - b);
}

// ── Roman numeral → semitone map (C major reference) ──────────────────────

/**
 * Scale-degree semitone offsets from C.
 * IX (9th) and XI (11th) are enharmonic with II and IV within one octave;
 * they are normalised here so voicing stays in a consistent range.
 */
const DEGREE: Record<string, number> = {
  I: 0, II: 2, III: 4, IV: 5, V: 7, VI: 9, VII: 11,
  IX: 2,  // enharmonic with II
  XI: 5,  // enharmonic with IV
};

// Longest matches first so 'VII' is tested before 'VI' and 'VI' before 'I'.
const NUMERAL_ORDER = ['VII', 'VI', 'IV', 'III', 'XI', 'IX', 'II', 'I', 'V'] as const;

// ── Core parser ────────────────────────────────────────────────────────────

function parseChord(symbol: string): { root: number; intervals: number[] } {
  let s = symbol.trim();

  // ── 1. Leading accidental (♭ / ♯ before the numeral) ──────────────────
  let rootMod = 0;
  if (s[0] === '♭') { rootMod = -1; s = s.slice(1); }
  else if (s[0] === '♯') { rootMod = 1; s = s.slice(1); }

  // ── 2. Roman numeral (longest match, case-insensitive) ────────────────
  let rootSemi = 0;
  let isMinor = false;
  let rest = s;

  for (const num of NUMERAL_ORDER) {
    const lo = num.toLowerCase();
    if (s.startsWith(num)) {
      // Exact uppercase match → major context
      rootSemi = DEGREE[num];
      rest = s.slice(num.length);
      break;
    }
    if (s.slice(0, num.length).toLowerCase() === lo) {
      // Case-insensitive match — minor when not all-uppercase (handles
      // lowercase like 'ii' and mixed-case typos like 'Iv')
      isMinor = s.slice(0, num.length) !== num;
      rootSemi = DEGREE[num];
      rest = s.slice(num.length);
      break;
    }
  }

  // ── 3. Trailing root accidental (e.g. 'XI♯') ──────────────────────────
  // A ♯ or ♭ directly after the numeral that isn't part of an extension
  // alteration (♯9, ♯11, ♭5, etc.) sharpens/flattens the root.
  if (/^♯(?![579]|1[13])/.test(rest)) { rootMod += 1; rest = rest.slice(1); }
  else if (/^♭(?![579]|1[13])/.test(rest)) { rootMod -= 1; rest = rest.slice(1); }

  const root = ((rootSemi + rootMod) % 12 + 12) % 12;

  // ── 4. Base triad quality ─────────────────────────────────────────────
  let ivs: number[] = isMinor ? [0, 3, 7] : [0, 4, 7];

  if (/^5(?!us)/.test(rest)) {
    // Power chord (root + fifth, no third)
    ivs = [0, 7];
    rest = rest.slice(1);
  } else if (/^m7♭5/.test(rest)) {
    // Half-diminished / ø7
    ivs = [0, 3, 6, 10];
    rest = rest.slice(4);
  } else if (/^°7|^dim7/.test(rest)) {
    // Diminished seventh
    ivs = [0, 3, 6, 9];
    rest = rest.replace(/^°7|^dim7/, '');
  } else if (/^°/.test(rest)) {
    // Diminished triad
    ivs = [0, 3, 6];
    rest = rest.slice(1);
  } else if (/^\+(?![0-9IVXivx♭♯])/.test(rest)) {
    // Augmented triad — '+' not followed by a digit, Roman numeral, or
    // accidental (prevents misreading compound symbols like '+IV', '+6').
    ivs = [0, 4, 8];
    rest = rest.slice(1);
  } else if (/^m(?!aj)/.test(rest)) {
    // Explicit minor suffix ('m' not part of 'maj').
    // Consume only 'm'; any trailing '7', '9', etc. are handled below.
    isMinor = true;
    ivs = [0, 3, 7];
    rest = rest.slice(1);
  }

  // ── 5. Detect extension flags ─────────────────────────────────────────

  const hasMaj9 = /maj9/.test(rest);
  const hasMaj7 = !hasMaj9 && /maj7/.test(rest);

  // Strip multi-char tokens that would produce false positives when scanning
  // for bare interval numbers (e.g. 'maj9' contains '9', 'sus4' contains '4').
  const stripped = rest
    .replace(/maj7|maj9|add9|sus[24]|to13|dim7/g, '')
    .replace(/[♭♯]\d+/g, ''); // remove altered extensions: ♭9, ♯11, etc.

  const has13 = /13/.test(stripped);
  const has11 = !has13 && /11/.test(stripped);
  const has9  = !has13 && !has11 && /9/.test(stripped);
  const has7  = /7/.test(stripped) && !hasMaj7 && !hasMaj9;

  const hasAdd9    = /add9/.test(rest);
  const hasSus4    = /sus4/.test(rest);
  const hasSus2    = /sus2/.test(rest);
  const hasTo13    = /to13/.test(rest);
  const hasFlat9   = /♭9/.test(rest);
  const hasSharp9  = /♯9/.test(rest);
  const hasFlat5   = /♭5/.test(rest);
  const hasSharp11 = /♯11/.test(rest);
  const hasFlat13  = /♭13/.test(rest);
  const hasPlus6   = /\+6/.test(rest);
  // Added 6th: bare '6' not immediately preceded by a letter, '+', '°', or
  // '♭'/'♯' (those are handled as altered extensions by the patterns above).
  const hasAdded6  = !hasPlus6 && /(?<![a-zA-Z+°♭♯])6(?![♭♯])/.test(rest);

  // ── 6. Apply extensions ───────────────────────────────────────────────

  if (hasMaj9)      ivs = uniq([...ivs, 11, 14]);
  else if (hasMaj7) ivs = uniq([...ivs, 11]);

  // Any bare dominant extension implies a minor 7th (unless already maj)
  if ((has7 || has9 || has11 || has13 || hasTo13) && !hasMaj7 && !hasMaj9) {
    ivs = uniq([...ivs, 10]);
  }
  if (has9 || hasAdd9) ivs = uniq([...ivs, 14]);
  if (has11)  ivs = uniq([...ivs, 17]);
  if (has13)  ivs = uniq([...ivs, 21]);
  // "to13" jazz notation: dominant 7th heading to the 13th
  if (hasTo13) ivs = uniq([...ivs, 21]);

  // ── 7. Suspended (replaces the third) ─────────────────────────────────
  if (hasSus4) {
    ivs = ivs.filter(i => i !== 3 && i !== 4);
    ivs = uniq([...ivs, 5]);
  } else if (hasSus2) {
    ivs = ivs.filter(i => i !== 3 && i !== 4);
    ivs = uniq([...ivs, 2]);
  }

  // ── 8. Alterations ────────────────────────────────────────────────────
  if (hasFlat9)   { ivs = ivs.filter(i => i !== 14); ivs = uniq([...ivs, 13]); }
  if (hasSharp9)  ivs = uniq([...ivs, 15]);
  if (hasFlat5)   ivs = ivs.map(i => (i === 7 ? 6 : i));
  if (hasSharp11) { ivs = ivs.filter(i => i !== 17); ivs = uniq([...ivs, 18]); }
  if (hasFlat13)  ivs = uniq([...ivs, 20]);
  // +6 and bare 6 both add the major 6th interval (9 semitones)
  if (hasPlus6 || hasAdded6) ivs = uniq([...ivs, 9]);

  return { root, intervals: ivs };
}

// ── Public: symbol → note strings ─────────────────────────────────────────

/**
 * Convert a Roman numeral chord symbol (relative to C) into an array of
 * Tone.js note strings.
 *
 * Voicing:  bass note in octave 2, chord tones starting in octave 3.
 * Extensions that span more than an octave (9th, 11th, 13th, altered
 * tones) are placed naturally in octave 4 by the semitone arithmetic.
 *
 * Exotic/microtonal modifiers (↑¼, etc.) are silently ignored and the
 * nearest standard chord is returned instead.
 */
export function chordToNotes(symbol: string): string[] {
  const { root, intervals } = parseChord(symbol);
  const bass  = semitoneToNote(root, 2);
  const upper = intervals.map(iv => semitoneToNote(root + iv, 3));
  return [bass, ...upper];
}

// ── Synth singleton ────────────────────────────────────────────────────────

let _synth: PolySynth | null = null;

function getSynth(): PolySynth {
  if (!_synth) {
    _synth = new PolySynth(Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.4, sustain: 0.25, release: 3 },
      volume: -10,
    }).toDestination();
  }
  return _synth;
}

/**
 * Start the Web Audio context (required by browsers — must be called from
 * within a user-gesture handler such as a click or keydown) then play all
 * notes of the chord simultaneously.
 *
 * @param symbol  Roman numeral chord symbol, e.g. 'V7♭9♯11'
 * @param duration Tone.js duration string, default '2n' (half note)
 */
export async function playChord(symbol: string, duration = '2n'): Promise<void> {
  await toneStart();
  getSynth().triggerAttackRelease(chordToNotes(symbol), duration);
}

/** Immediately silence all currently sounding notes. */
export function stopAll(): void {
  _synth?.releaseAll();
}

/** Dispose the synth and free AudioContext resources. Call on app teardown. */
export function disposeSynth(): void {
  _synth?.dispose();
  _synth = null;
}
