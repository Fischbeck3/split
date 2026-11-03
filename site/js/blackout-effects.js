// Shared Blackout physics and view timing; daily records remain in rounds.js.
import {stepDrink} from './core.js';

export const BLACKOUT_STAGE = Object.freeze({label:'Blackout', blur:2.8, sway:2.3, cadenceAmplitude:0, cadencePeriod:.83});

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const seconds = value => Number.isFinite(value) ? Math.max(0, value) : 0;
const smooth = value => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };

// A repeatable mixture of surges and hesitations, bounded to .30–1.70 times K.
// This never changes the released daily integrator or its three stage profiles.
export function blackoutFlow(params, elapsed){
  const t = seconds(elapsed), phase = Number.isFinite(params.sipCadencePhase) ? params.sipCadencePhase : 0;
  const wave = .68 * Math.sin(t * Math.PI * 2 / .83 + phase)
    + .32 * Math.sin(t * Math.PI * 2 / 1.91 + phase * .61);
  return 1 + .70 * Math.tanh(2.4 * wave) / Math.tanh(2.4);
}
export function stepStagedDrink(params, state, rate, dt){
  if (!params.blackout || !(rate > 0) || !Number.isFinite(rate)) return stepDrink(params, state, rate, dt);
  const duration = clamp(seconds(dt), 0, .25);
  let next = stepDrink(params, state, 0, 0);
  const end = next.elapsed + duration, step = 1 / 240;
  // Anchor substeps to sip time, so screen refresh rates don't choose the surges.
  while (end - next.elapsed > 1e-10){
    const boundary = (Math.floor((next.elapsed + 1e-10) / step) + 1) * step;
    const h = Math.min(end - next.elapsed, boundary - next.elapsed);
    next = stepDrink(params, next, rate * blackoutFlow(params, next.elapsed + h / 2), h);
  }
  return next;
}

// Unequal, softly gated glimpses. Darkness lasts at least .65s between them.
// No white flashes: the renderer only exposes the existing scene, below full brightness.
const GLIMPSES = [[1.85,2.75,.72], [3.50,4.48,.62], [5.20,6.35,.78]];
export function blackoutExposure(elapsed){
  const t = seconds(elapsed);
  if (t < 1.15) return 1 - smooth((t - .48) / .67);
  const cycle = 5.25, local = 1.85 + ((t - 1.85) % cycle + cycle) % cycle;
  for (const [start, end, peak] of GLIMPSES){
    if (local >= start && local <= end){
      const span = end - start, u = (local - start) / span;
      return peak * smooth(u / .28) * (1 - smooth((u - .28) / .72));
    }
  }
  return 0;
}

export function blackoutView({phase, elapsed = 0, idleTime = 0, reducedMotion = false}){
  const active = phase === 'drinking' || phase === 'locked', ready = phase === 'ready';
  if (!active && !ready) return {exposure:1, blur:0, echoes:0, spread:0, driftX:0, driftY:0, roll:0};
  if (reducedMotion) return {exposure:active ? 0 : 1, blur:0, echoes:0, spread:0, driftX:0, driftY:0, roll:0};
  const t = active ? seconds(elapsed) : seconds(idleTime), intensity = active ? 1 : .55;
  return {exposure:active ? blackoutExposure(t) : 1,
    blur:(2.3 + 1.7 * (.5 + .5 * Math.sin(t * 2.1))) * intensity,
    echoes:active ? 4 : 3,
    spread:(.09 + .03 * Math.sin(t * 1.7) + .015 * Math.sin(t * 3.1)) * intensity,
    driftX:Math.sin(t * 1.37) * .018 * intensity,
    driftY:Math.sin(t * 1.91 + .8) * .009 * intensity,
    roll:Math.sin(t * 1.13) * 1.8 * intensity};
}
