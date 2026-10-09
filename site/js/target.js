// Target artwork and the brief line hint share vessel-local coordinates.
// The painted mark can grow without changing the seeded scoring tolerance.
import {renderWidthAt as widthAt} from './render-vessels.js';

export const TARGET_HINT_MS = 1900;

/** One quiet reveal, never a repeating blink. Reduced motion has a static cue. */
export function targetHintOpacity(elapsed, reducedMotion = false){
  if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed >= TARGET_HINT_MS) return 0;
  return reducedMotion || elapsed <= 1600 ? .82 : .82 * (TARGET_HINT_MS - elapsed) / 300;
}

/** Artwork and hint endpoints in the same coordinates as G. */
export function targetGeometry(G, P, theme){
  const gh = Math.max(0, G.bot - G.top);
  const y = G.top + P.markY * gh;
  const vesselHalfWidth = Math.max(0, widthAt(G.glass, P.markY) * G.halfW);
  const enlargement = theme.name === 'Butterbeer' ? 1.7 : 1.5;
  const widthLimit = 1.15;
  const markHeight = Math.max(0, Math.min(P.markH * gh * enlargement, vesselHalfWidth * widthLimit));
  const lineWidth = Math.min(3.5, Math.max(1.5, gh * .009), vesselHalfWidth * .12);
  const lineHalfWidth = Math.max(0, vesselHalfWidth - lineWidth / 2 - 1);
  return {y, markHeight, vesselHalfWidth, lineHalfWidth, lineWidth};
}
