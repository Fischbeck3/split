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

const MODELO = [[0,.30,0],[.025,.30,0],[.05,.27,0],[.23,.34,.28],[.32,.48,2],[.42,.80,0],[.94,.80,0],[1,.77,0]];
const HIGH_LIFE = [[0,.29,0],[.025,.29,0],[.05,.25,.18],[.29,.33,.18],[.38,.37,.45],[.47,.68,1.5],[.55,.73,0],[.94,.73,0],[1,.70,0]];
const SIERRA = [[0,.33,0],[.025,.33,0],[.05,.28,.12],[.13,.32,.2],[.20,.48,2.6],[.30,.84,0],[.94,.84,0],[1,.80,0]];
// A bowl, narrow stem, and separate foot. Only the bowl receives liquid paint.
const CHALICE = [[0,.92,0],[.13,1,0],[.31,.99,-.14],[.48,.83,-1.1],[.64,.48,-2],[.77,.11,0],[.80,.035,0],[1,.035,0]];
export const CHALICE_BOWL_DEPTH = .77;
const DISPLAY_PROFILES = {corona:CORONA,'modelo-bottle':MODELO,'high-life-bottle':HIGH_LIFE,'sierra-bottle':SIERRA,chalice:CHALICE};
export const RENDER_PROFILES = Object.freeze({...PROFILES, ...DISPLAY_PROFILES});

/** G.glass identifies the displayed outline; theme.vessel still owns timing. */
export const renderVessel = theme => theme.renderVessel || (theme.id === 'beach' && theme.vessel === 'bottle' ? 'corona'
  : theme.id === 'modelo-mexico-city' ? 'modelo-bottle'
    : theme.id === 'high-life-milwaukee' ? 'high-life-bottle'
      : theme.id === 'sierra-high-sierras' ? 'sierra-bottle' : theme.vessel);

export function renderWidthAt(vessel, depth){
  const profile = DISPLAY_PROFILES[vessel];
  if (!profile) return widthAt(vessel, depth);
  const t = Math.max(0, Math.min(1, Number.isFinite(depth) ? depth : 0));
  for (let i = 1; i < profile.length; i++){
    const [t1, w1, m1] = profile[i];
    if (t > t1) continue;
    const [t0, w0, m0] = profile[i - 1], span = t1 - t0, u = (t - t0) / span;
    const u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * w0 + (u3 - 2 * u2 + u) * span * m0
      + (-2 * u3 + 3 * u2) * w1 + (u3 - u2) * span * m1;
  }
  return profile.at(-1)[1];
}
