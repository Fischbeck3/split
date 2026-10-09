// Target artwork and split guides share one vessel-local coordinate system.
// The painted mark can grow without changing the seeded scoring tolerance.
import {widthAt} from './core.js';

/** Artwork, rail endpoints and rail stroke width in the same coordinates as G. */
export function targetGeometry(G, P, theme){
  const gh = Math.max(0, G.bot - G.top);
  const y = G.top + P.markY * gh;
  const vesselHalfWidth = Math.max(0, widthAt(G.glass, P.markY) * G.halfW);
  const enlargement = theme.mark === 'crest' ? 1.35 : 1.65;
  const widthLimit = theme.markFrame === 'shield' ? 1.05 : 1.25;
  const markHeight = Math.max(0, Math.min(P.markH * gh * enlargement, vesselHalfWidth * widthLimit));
  const railWidth = Math.min(Math.max(4, markHeight * .1), vesselHalfWidth * .15);
  // Round rail caps extend half a stroke past their endpoint. Keep that paint
  // and a half-pixel safety margin inside the actual vessel wall.
  const notchOuter = Math.max(0, Math.min(vesselHalfWidth * .96, vesselHalfWidth - railWidth / 2 - .5));
  // Three canvas pixels on a full-size glass, shrinking with very small vessels.
  const clearance = Math.min(3, gh * .012, vesselHalfWidth * .05);
  const notchInner = Math.min(notchOuter, markHeight * .66 + clearance);
  const notchSize = Math.min(6, Math.max(3, gh * .012), (notchOuter - notchInner) / 2);
  return {y, markHeight, vesselHalfWidth, notchInner, notchOuter, notchSize, railWidth};
}
