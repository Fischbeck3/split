// Display outlines are separate from the frozen daily drinking profiles.
import {PROFILES, widthAt} from './core.js';

// Half-width and tangent at each depth: a rolled lip, gently tapered long
// neck, rounded shoulders, straight body and a small heel. Hermite tangents
// keep the shoulder smooth instead of stopping at each control point.
const CORONA = [
  [0, .31, 0], [.025, .31, 0], [.048, .27, .15],
  [.20, .365, .1], [.38, .39, .35], [.45, .59, 2.25],
  [.53, .69, 0], [.94, .69, 0], [1, .67, 0]
];

export const RENDER_PROFILES = Object.freeze({...PROFILES, corona: CORONA});

/** G.glass identifies the displayed outline; theme.vessel still owns timing. */
export const renderVessel = theme => theme.id === 'beach' && theme.vessel === 'bottle' ? 'corona' : theme.vessel;

export function renderWidthAt(vessel, depth){
  if (vessel !== 'corona') return widthAt(vessel, depth);
  const t = Math.max(0, Math.min(1, Number.isFinite(depth) ? depth : 0));
  for (let i = 1; i < CORONA.length; i++){
    const [t1, w1, m1] = CORONA[i];
    if (t > t1) continue;
    const [t0, w0, m0] = CORONA[i - 1], span = t1 - t0, u = (t - t0) / span;
    const u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * w0 + (u3 - 2 * u2 + u) * span * m0
      + (-2 * u3 + 3 * u2) * w1 + (u3 - u2) * span * m1;
  }
  return CORONA.at(-1)[1];
}
