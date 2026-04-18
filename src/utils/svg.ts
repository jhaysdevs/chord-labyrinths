import type { ChordLabyrinth } from '../types/chords';

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function chordFontSize(chord: string, size: number): number {
  return chord.length > 3
    ? size * 0.042
    : chord.length > 2
      ? size * 0.048
      : size * 0.054;
}

/** Approximate string width for Georgia at `fontSize` (static SVG). */
function estimateChordLabelWidth(text: string, fontSize: number): number {
  let w = 0;
  for (const ch of text) {
    if ('♭♯°'.includes(ch)) w += fontSize * 0.42;
    else if (ch >= '0' && ch <= '9') w += fontSize * 0.48;
    else if (ch === ' ') w += fontSize * 0.22;
    else w += fontSize * 0.52;
  }
  return w;
}

/** Minimum circle radius so the label (centered) fits inside with padding (more for long names). */
function minRadiusForChord(chord: string, size: number): number {
  const fs = chordFontSize(chord, size);
  const tw = estimateChordLabelWidth(chord, fs);
  const halfW = tw / 2;
  const halfH = fs * 0.58;
  // Base padding + extra as labels get longer (emulates horizontal padding around text).
  const pad = fs * (0.52 + Math.min(chord.length, 16) * 0.034);
  return Math.hypot(halfW, halfH) + pad;
}

export function buildSVG(lab: ChordLabyrinth, size: number, visualSize = size): string {
  const cx = size / 2;
  const cy = size / 2;
  const n = lab.chords.length;
  const outerR = size * 0.4;
  const innerR = size * 0.2;
  const fallbackNodeR = Math.max(visualSize * 0.062, 9);
  const nodeR = Math.max(
    fallbackNodeR,
    ...lab.chords.map((c) => minRadiusForChord(c, visualSize)),
  );
  const uid = `u${lab.id}`;

  function polar(angle: number, r: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  const nodes = lab.chords.map((chord, i) => {
    const angle = (360 / n) * i;
    const r = n <= 4 ? outerR : i % 2 === 0 ? outerR : innerR;
    return { chord, i, ...polar(angle, r) };
  });

  const arcs = nodes.map((node, i) => {
    const next = nodes[(i + 1) % n];
    const mx = (node.x + next.x) / 2 + (next.y - node.y) * 0.2;
    const my = (node.y + next.y) / 2 - (next.x - node.x) * 0.2;
    return `M ${node.x.toFixed(1)} ${node.y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
  });

  const defs = `<defs>
    <radialGradient id="bg${uid}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${lab.color}" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="${lab.color}" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow${uid}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="2.5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <marker id="arr${uid}" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
      <polygon points="0 0, 6 3, 0 6" fill="${lab.accent}" opacity="0.85"/>
    </marker>
  </defs>`;

  const bgCircle = `<circle cx="${cx}" cy="${cy}" r="${outerR + 14}" fill="url(#bg${uid})"/>`;
  const ring1 = `<circle cx="${cx}" cy="${cy}" r="${outerR + 10}" fill="none" stroke="${lab.color}" stroke-width="1.2" stroke-opacity="0.25"/>`;
  const ring2 = `<circle cx="${cx}" cy="${cy}" r="${outerR + 17}" fill="none" stroke="${lab.color}" stroke-width="0.4" stroke-opacity="0.1" stroke-dasharray="2 5"/>`;
  const innerRingR = Math.max(0.5, innerR - nodeR - 3);
  const innerRing = `<circle cx="${cx}" cy="${cy}" r="${innerRingR.toFixed(1)}" fill="none" stroke="${lab.color}" stroke-width="0.4" stroke-opacity="0.15"/>`;

  const spokes = nodes
    .map(
      (node) =>
        `<line x1="${cx}" y1="${cy}" x2="${node.x.toFixed(1)}" y2="${node.y.toFixed(1)}" stroke="${lab.color}" stroke-width="0.4" stroke-opacity="0.1"/>`,
    )
    .join('');

  const arcPaths = arcs
    .map(
      (d, i) =>
        `<path class="arc" data-id="${uid}" data-arc="${i}" d="${d}" fill="none" stroke="${lab.accent}" stroke-width="1.3" stroke-opacity="0.65" marker-end="url(#arr${uid})"/>`,
    )
    .join('');

  const nodeElems = nodes
    .map((node, i) => {
      const isRoot = i === 0;
      const fsize = chordFontSize(node.chord, visualSize);
      // All nodes start inactive: dark fill, white text.
      // The root node (i === 0) is distinguished only by a thicker stroke.
      const nodeFill = '#0f0f14';
      const textFill = '#ffffff';
      return `<g class="node-g" data-id="${uid}" data-node="${i}" role="button" tabindex="0"
        aria-pressed="false"
        aria-label="Toggle highlight: ${escapeAttr(node.chord)}"
        style="cursor:pointer">
      <circle class="node-bg" cx="${node.x.toFixed(1)}" cy="${node.y.toFixed(1)}" r="${nodeR}"
        fill="${nodeFill}"
        stroke="${lab.color}"
        stroke-width="1.2"
        data-fill="${nodeFill}"
        data-default-fill="${nodeFill}"
        data-stroke="${lab.color}"
        data-acc="${lab.accent}"
        data-root="${isRoot}"/>
      <text x="${node.x.toFixed(1)}" y="${(node.y + 0.5).toFixed(1)}"
        text-anchor="middle" dominant-baseline="middle"
        font-size="${fsize.toFixed(1)}" font-family="Georgia,serif"
        font-weight="${isRoot ? 700 : 600}"
        fill="${textFill}"
        data-root="${isRoot}"
        data-default-fill="${textFill}"
        data-acc="${lab.accent}"
        style="user-select:none;pointer-events:none">${node.chord}</text>
    </g>`;
    })
    .join('');

  const centerDot = `<circle cx="${cx}" cy="${cy}" r="2.5" fill="${lab.color}" opacity="0.4"/>`;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="overflow:visible" data-svgid="${uid}">
    ${defs}${bgCircle}${ring1}${ring2}${innerRing}${spokes}${arcPaths}${nodeElems}${centerDot}
  </svg>`;
}

/**
 * Apply or remove the highlight state for a single chord node within a given
 * DOM container (a card root or #lab-modal). Call once per container that
 * needs updating so both card and modal SVGs stay in sync.
 */
export function highlightSVGNode(
  labId: number,
  nodeIdx: number,
  on: boolean,
  container: Element | null,
): void {
  if (!container) return;
  const uid = `u${labId}`;
  const g = container.querySelector<SVGGElement>(
    `.node-g[data-id="${uid}"][data-node="${nodeIdx}"]`,
  );
  if (!g) return;
  const arc = container.querySelector<SVGPathElement>(
    `.arc[data-id="${uid}"][data-arc="${nodeIdx}"]`,
  );
  const circle = g.querySelector<SVGCircleElement>('.node-bg');
  const txt = g.querySelector<SVGTextElement>('text');
  if (!circle) return;
  const cardColor = circle.dataset.stroke ?? circle.dataset.acc ?? '';
  if (on) {
    if (arc) {
      arc.setAttribute('stroke-opacity', '1');
      arc.setAttribute('stroke-width', '2.4');
      arc.setAttribute('filter', `url(#glow${uid})`);
    }
    circle.setAttribute('stroke', cardColor);
    circle.setAttribute('stroke-width', '2.5');
    circle.setAttribute('fill', cardColor);
    if (txt) txt.setAttribute('fill', '#0f0f14');
  } else {
    if (arc) {
      arc.setAttribute('stroke-opacity', '0.65');
      arc.setAttribute('stroke-width', '1.3');
      arc.removeAttribute('filter');
    }
    circle.setAttribute('stroke', circle.dataset.stroke ?? '');
    circle.setAttribute('stroke-width', '1.2');
    circle.setAttribute('fill', circle.dataset.defaultFill ?? '');
    if (txt) txt.setAttribute('fill', txt.dataset.defaultFill ?? '');
  }
  g.setAttribute('aria-pressed', String(on));
}
