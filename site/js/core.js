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
/** Line speed for a fixed volume flow. A round vessel's section is proportional to
 * radius squared: d(level)/dt = Q / A(level). Normalize at the mark to keep each
 * day's base rate, while a tapered pint accelerates and a bottle slows at its shoulder. */
export function flowFactor(theme, markY, level){
  const here = widthAt(theme.vessel, Math.max(0, Math.min(1, level)));
  const ratio = widthAt(theme.vessel, Math.max(0, Math.min(1, markY))) / here;
  return ratio * ratio * theme.speed;
}
/** Base drink rate from tilt in degrees past upright: nothing under 15, full at 40, up to 1.6 times beyond. */
export function tiltRate(K, deg){
  const u = Math.max(0, Math.min(1.6, (deg - 15) / 25));
  return K * Math.pow(u, 1.3);
}

/** The state of one sip. Rates and velocity are in vessel-heights per second. */
export function makeDrinkState(P){
  return {level: startLevel(P.theme), velocity: 0, elapsed: 0, releaseElapsed: 0};
}

export const STEIN_SETTLE_SECONDS = 0.24;
// These response times are a playable approximation of starting and arresting a
// sip, not a viscosity solver. Open pints carry a short moving stream after release;
// a neck restricts the bottle's response, while the stein takes longer to get going.
const DRINK_RESPONSE = {
  tulip: {rise: 0.16, fall: 0.14, settle: 0.42},
  nonic: {rise: 0.15, fall: 0.13, settle: 0.39},
  tumbler: {rise: 0.12, fall: 0.11, settle: 0.33},
  cup: {rise: 0.12, fall: 0.11, settle: 0.33},
  mug: {rise: 0.10, fall: 0.09, settle: 0.27},
  tall: {rise: 0.12, fall: 0.10, settle: 0.30},
  bottle: {rise: 0.055, fall: 0.07, settle: 0.21},
  stein: {rise: 0.18, fall: 0.09, settle: STEIN_SETTLE_SECONDS}
};
const MAX_DRINK_STEP = 0.25, INTEGRATION_STEP = 1 / 120;

function volumeRate(P, level, elapsed, inputRate){
  let cadence = 1;
  if (P.theme.vessel === 'bottle'){
    // Air enters freely through the empty neck, then arrives in regular glugs in the body.
    // The same elapsed time gives everyone the same pulse, independent of animation FPS.
    const body = Math.max(0, Math.min(1, (level - 0.32) / 0.12));
    cadence += body * 0.65 * Math.sin(elapsed * Math.PI * 2 / 0.58);
  }
  return inputRate * cadence;
}

/** Advance one sip without mutating its state.
 * inputRate is the BASE rate (K for a held sip, or tiltRate(K, angle)); 0 releases it.
 * Momentum is integrated as volume flow, so taper changes line speed without
 * inventing or losing liquid. Every vessel ramps up and has bounded follow-through;
 * the bottle pulses below its shoulder. dt is capped to ignore background gaps.
 * RK4 substeps keep variable frame rates comparable even in the narrow neck. */
export function stepDrink(P, state, inputRate, dt){
  const next = {
    level: Math.max(0, Math.min(DRAIN_LEVEL, Number.isFinite(state.level) ? state.level : startLevel(P.theme))),
    velocity: Math.max(0, Number.isFinite(state.velocity) ? state.velocity : 0),
    elapsed: Math.max(0, Number.isFinite(state.elapsed) ? state.elapsed : 0),
    releaseElapsed: Math.max(0, Number.isFinite(state.releaseElapsed) ? state.releaseElapsed : 0)
  };
  const seconds = Number.isFinite(dt) ? Math.max(0, Math.min(MAX_DRINK_STEP, dt)) : 0;
  const maxRate = P.K * Math.pow(1.6, 1.3);
  const rate = Number.isFinite(inputRate) ? Math.max(0, Math.min(maxRate, inputRate)) : 0;
  const response = DRINK_RESPONSE[P.theme.vessel];
  // Public velocity stays in vessel-heights/second. Internally, throughput is
  // normalized to the mark's section; its inertia is independent of local width.
  let throughput = Math.min(maxRate * 1.65, next.velocity / flowFactor(P.theme, P.markY, next.level));
  next.velocity = throughput * flowFactor(P.theme, P.markY, next.level);
  if (!seconds) return next;
  if (next.level >= DRAIN_LEVEL){ next.velocity = 0; next.elapsed += seconds; return next; }

  const released = rate === 0;
  const activeSeconds = released ? Math.max(0, Math.min(seconds, response.settle - next.releaseElapsed)) : seconds;
  const steps = Math.ceil(activeSeconds / INTEGRATION_STEP), h = steps ? activeSeconds / steps : 0;
  const derivative = (level, flow, elapsed) => {
    const desired = released ? 0 : volumeRate(P, level, elapsed, rate);
    return [flow * flowFactor(P.theme, P.markY, level), (desired - flow) / (released ? response.fall : response.rise)];
  };
  for (let i = 0; i < steps && next.level < DRAIN_LEVEL; i++){
    const l = next.level, q = throughput, t = next.elapsed + i * h;
    const a = derivative(l, q, t);
    const b = derivative(l + a[0] * h / 2, q + a[1] * h / 2, t + h / 2);
    const c = derivative(l + b[0] * h / 2, q + b[1] * h / 2, t + h / 2);
    const d = derivative(l + c[0] * h, q + c[1] * h, t + h);
    next.level += h * (a[0] + 2 * b[0] + 2 * c[0] + d[0]) / 6;
    throughput = Math.max(0, q + h * (a[1] + 2 * b[1] + 2 * c[1] + d[1]) / 6);
  }
  next.releaseElapsed = released ? next.releaseElapsed + seconds : 0;
  next.elapsed += seconds;
  next.velocity = released && next.releaseElapsed >= response.settle - 1e-9 ? 0 : throughput * flowFactor(P.theme, P.markY, next.level);
  if (next.level >= DRAIN_LEVEL){ next.level = DRAIN_LEVEL; next.velocity = 0; }
  return next;
}

/** A released sip can be scored when this is true. */
export const isDrinkSettled = state => state.velocity === 0;

/** Seconds of steady drinking from the start line down to the mark. */
export function secondsToMark(P, dt = 1 / 120){
  let state = makeDrinkState(P), t = 0;
  const step = Math.max(1 / 1000, Math.min(MAX_DRINK_STEP, Number.isFinite(dt) ? dt : 1 / 120));
  while (state.level < P.markY && t < 60){ state = stepDrink(P, state, P.K, step); t += step; }
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
