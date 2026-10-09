// One authored interaction: lifting a drink, tipping it, then putting it down.
// Motion explains the vessel's weight. It never changes the drink amount or score.

const KEYS = ['angle', 'angularVelocity', 'liquidAngle', 'liquidVelocity', 'lift', 'activity'];
const LIMITS = [60, 720, 8, 360, 0.075, 1];
const PROFILES = {
  pint: {angle: 20, extraTip: 28, lift: 0.025, rise: 18, fall: 24, liquid: 21, coupling: 0.015},
  bottle: {angle: 24, extraTip: 24, lift: 0.035, rise: 22, fall: 26, liquid: 23, coupling: 0.015},
  stein: {angle: 18, extraTip: 26, lift: 0.018, rise: 12, fall: 22, liquid: 18, coupling: 0.013}
};
const MAX_STEP = 0.25, SUBSTEP = 1 / 240;
const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

/** Angles are degrees; lift is a fraction of glass height; activity is 0..1. */
export function makeMotionState(){
  return {angle: 0, angularVelocity: 0, liquidAngle: 0, liquidVelocity: 0, lift: 0, activity: 0};
}

/** The whole vessel and its world-horizontal surface have stopped moving. */
export function isMotionSettled(state){
  return !!state && Math.abs(finite(state.angle, Infinity)) < 0.025
    && Math.abs(finite(state.angularVelocity, Infinity)) < 0.12
    && Math.abs(finite(state.liquidAngle, Infinity)) < 0.025
    && Math.abs(finite(state.liquidVelocity, Infinity)) < 0.12
    && Math.abs(finite(state.lift, Infinity)) < 0.0003
    && Math.abs(finite(state.activity, Infinity)) < 0.0006;
}

/** Advance vessel motion without mutating state or touching drink/scoring state.
 * input is 0..1. level is the upright beer line; the glass tips farther as it empties.
 * elapsed is the drink's time at the START of this step, in seconds;
 * the bottle kick shares the exact .58s cadence used by core.js.
 * liquidAngle is a WORLD angle: zero means the liquid surface is horizontal.
 * Continuous spring equations plus small RK4 steps avoid per-frame easing drift. */
export function stepMotion(P, state = makeMotionState(), {
  drinking = false, input = 0, level, elapsed = 0, dt = 0, reducedMotion = false
} = {}){
  const strength = drinking ? clamp(finite(input), 0, 1) : 0;
  if (reducedMotion) return {...makeMotionState(), activity: strength};

  const source = state || makeMotionState();
  let values = KEYS.map((key, i) => clamp(finite(source[key]), i >= 4 ? 0 : -LIMITS[i], LIMITS[i]));
  const seconds = clamp(finite(dt), 0, MAX_STEP);
  const time = Math.max(0, finite(elapsed));
  const vessel = P?.theme?.vessel;
  const profile = PROFILES[vessel] || PROFILES.pint;
  const start = 0.04 + finite(P?.theme?.headT, 0.1);
  const depletion = clamp((finite(level, start) - start) / Math.max(0.01, 0.97 - start), 0, 1);
  const omega = drinking ? profile.rise : profile.fall;
  const liftTau = drinking ? 0.12 : 0.065, activityTau = drinking ? 0.08 : 0.065;

  const derivative = (v, t) => {
    const [angle, angularVelocity, liquidAngle, liquidVelocity, lift, activity] = v;
    const kick = drinking && vessel === 'bottle' ? 1.8 * Math.sin(t * Math.PI * 2 / 0.58) : 0;
    const target = strength * (profile.angle + profile.extraTip * depletion + kick);
    const acceleration = omega * omega * (target - angle) - 2 * omega * angularVelocity;
    // The surface stays near gravity-horizontal; acceleration produces a small,
    // damped inertial response rather than rotating the drink with the glass.
    const liquidTarget = clamp(-profile.coupling * angularVelocity, -4, 4);
    const liquidAcceleration = profile.liquid * profile.liquid * (liquidTarget - liquidAngle)
      - 2 * 0.68 * profile.liquid * liquidVelocity;
    return [angularVelocity, acceleration, liquidVelocity, liquidAcceleration,
      (profile.lift * strength - lift) / liftTau, (strength - activity) / activityTau];
  };

  const steps = Math.ceil(seconds / SUBSTEP), h = steps ? seconds / steps : 0;
  for (let i = 0; i < steps; i++){
    const t = time + i * h;
    const a = derivative(values, t);
    const b = derivative(values.map((v, j) => v + a[j] * h / 2), t + h / 2);
    const c = derivative(values.map((v, j) => v + b[j] * h / 2), t + h / 2);
    const d = derivative(values.map((v, j) => v + c[j] * h), t + h);
    values = values.map((v, j) => v + h * (a[j] + 2 * b[j] + 2 * c[j] + d[j]) / 6);
  }
  const next = Object.fromEntries(KEYS.map((key, i) => [key,
    clamp(finite(values[i]), i >= 4 ? 0 : -LIMITS[i], LIMITS[i])
  ]));
  return !drinking && isMotionSettled(next) ? makeMotionState() : next;
}
