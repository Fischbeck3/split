// Pure game logic: the calendar, seeded randomness, vessel shapes, the daily glass and scoring.
// Nothing here touches the page, so the tests can import it in Node.
import {LAUNCH, SCHEDULE, THEMES as RAW_THEMES} from './themes.js';

export const pad = n => String(n).padStart(2, '0');

const DAY_MS = 86400000;
const [LY, LM, LD] = LAUNCH.split('-').map(Number);
export const EPOCH_UTC = Date.UTC(LY, LM - 1, LD);

/** A local date as YYYY-MM-DD. */
export const dayKey = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
/** The day No. of a local date. LAUNCH is No. 1. */
export const dayNumber = d => Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - EPOCH_UTC) / DAY_MS) + 1;
/** The YYYY-MM-DD date of a day No. */
export function keyForDay(n){
  const d = new Date(EPOCH_UTC + (n - 1) * DAY_MS);
  return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
}

export function hashStr(s){
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++){ h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}
export function mulberry32(a){
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Vessel outlines: half-width at depth t, from the rim (0) to the base (1), relative to the widest point.
export const PROFILES = {
  tulip: [[0, 0.96], [0.18, 1.0], [0.4, 0.95], [0.65, 0.82], [0.85, 0.74], [1, 0.72]],
  nonic: [[0, 0.9], [0.16, 0.9], [0.23, 1.0], [0.3, 0.94], [0.6, 0.84], [1, 0.74]],
  tumbler: [[0, 1.0], [1, 0.8]],
  cup: [[0, 1.0], [1, 0.74]],
  mug: [[0, 0.9], [1, 0.9]],
  tall: [[0, 0.9], [0.5, 0.86], [1, 0.78]],
  bottle: [[0, 0.36], [0.035, 0.36], [0.045, 0.3], [0.26, 0.3], [0.4, 1.0], [1, 0.97]],
  stein: [[0, 0.95], [0.85, 0.93], [1, 0.9]]
};
export function widthAt(vessel, t){
  const p = PROFILES[vessel];
  for (let i = 1; i < p.length; i++){
    if (t <= p[i][0]){
      const [t0, w0] = p[i - 1], [t1, w1] = p[i];
      const u = (t - t0) / (t1 - t0), s = u * u * (3 - 2 * u);
      return w0 + (w1 - w0) * s;
    }
  }
  return p[p.length - 1][1];
}

const DEFAULTS = {scene: 'bar', box: {top: 0.13, bot: 0.84, w: 0.34, h: 0.3}, markRange: [0.46, 0.66], markHRange: [0.10, 0.14], speed: 1};
export const THEMES = RAW_THEMES.map(t => Object.freeze(Object.assign({label: t.name + ' day'}, DEFAULTS, t)));
export const themeById = id => THEMES.find(t => t.id === id);

const pickIndex = key => Math.floor(mulberry32(hashStr('split-theme:' + key))() * THEMES.length);
const scheduledIndex = n => THEMES.findIndex(t => t.id === SCHEDULE[n - 1]);

/** The glass a day No. serves. */
export function themeForDay(num){
  if (num >= 1 && num <= SCHEDULE.length) return THEMES[scheduledIndex(num)];
  if (num < 1) return THEMES[pickIndex(keyForDay(num))];
  let prev = SCHEDULE.length ? scheduledIndex(SCHEDULE.length) : -1;
  for (let n = SCHEDULE.length + 1; n <= num; n++){
    let i = pickIndex(keyForDay(n));
    if (i === prev) i = (i + 1) % THEMES.length;
    prev = i;
  }
  return THEMES[prev];
}

/** Everything that makes one day's glass: the theme, where the mark sits, how fast it drinks, the wobble. */
export function dayParams(num){
  const theme = themeForDay(num), key = keyForDay(num);
  const rnd = mulberry32(hashStr('split:' + key)), r = (a, b) => a + rnd() * (b - a);
  const choppy = typeof theme.choppy === 'boolean' ? theme.choppy : rnd() < 0.4;
  const markY = r(theme.markRange[0], theme.markRange[1]);
  const markH = r(theme.markHRange[0], theme.markHRange[1]);
  const K = r(0.11, 0.17);
  const wobble = choppy ? r(0.6, 1.3) : 0;
  return {num, key, theme, markY, markH, K, wobble, choppy};
}

// ---------- the drink ----------
export const DRAIN_LEVEL = 0.97;
export const TILT_START = 25, TILT_STOP = 15;
/** Where the line starts: just under the rim, below the foam. */
export const startLevel = theme => 0.04 + theme.headT;
/** How fast the line falls at a level, relative to the base rate. Narrow parts drop faster:
 *  a bottle's neck empties quickly and its body slowly. */
export function flowFactor(theme, markY, level){
  const here = widthAt(theme.vessel, Math.max(0, Math.min(1, level)));
  return (widthAt(theme.vessel, markY) / here) * theme.speed;
}
/** Base drink rate from tilt in degrees past upright: nothing under 15, full at 40, up to 1.6 times beyond. */
export function tiltRate(K, deg){
  const u = Math.max(0, Math.min(1.6, (deg - 15) / 25));
  return K * Math.pow(u, 1.3);
}
/** Seconds of steady drinking from the start line down to the mark. */
export function secondsToMark(P, dt = 1 / 120){
  let L = startLevel(P.theme), t = 0;
  while (L < P.markY && t < 60){ L += P.K * flowFactor(P.theme, P.markY, L) * dt; t += dt; }
  return t;
}

// ---------- scoring ----------
export const PERFECT = 0.06, SPLIT = 0.16;
/** Score an offset f: how far the line sits from the center of the mark, in mark heights. Negative is high. */
export function scoreFromOffset(f, target){
  const a = Math.abs(f), score = Math.round(100 * Math.exp(-(f / 0.3) * (f / 0.3)));
  let label, tone;
  if (a <= PERFECT){ label = 'Perfect split'; tone = 'good'; }
  else if (a <= SPLIT){ label = 'Split'; tone = 'good'; }
  else if (a <= 0.5){ label = (f < 0 ? 'High in ' : 'Low in ') + target; tone = 'warn'; }
  else { label = (f < 0 ? 'Above ' : 'Below ') + target; tone = 'miss'; }
  return {score, label, tone};
}
export function bandEmoji(f){
  const cells = ['⬜', '⬜', '⬜', '⬜', '⬜'];
  if (f < -0.5) return '⬆️' + cells.join('');
  if (f > 0.5) return cells.join('') + '⬇️';
  const idx = f < -0.3 ? 0 : f < -0.1 ? 1 : f <= 0.1 ? 2 : f <= 0.3 ? 3 : 4;
  cells[idx] = idx === 2 ? '🟩' : (idx === 1 || idx === 3) ? '🟨' : '🟧';
  return cells.join('');
}
export function detailText(f, drained){
  if (drained) return 'You drank the lot.';
  const pct = Math.round(Math.abs(f) * 100);
  return pct === 0 ? 'Dead center.' : pct + '% ' + (f < 0 ? 'high' : 'low') + '.';
}
