// The staged flow lives below both the round model and the fluid integrator.
// Sample at integration time, rather than animation-frame boundaries, so every
// device gets the same tipsy/drunk pour. Existing unstaged glasses return 1.
const MAX_AMPLITUDE = .24;

export function stageCadence(P, elapsed = 0){
  const amplitude = Number.isFinite(P?.sipCadenceAmplitude)
    ? Math.max(0, Math.min(MAX_AMPLITUDE, P.sipCadenceAmplitude)) : 0;
  if (!amplitude) return 1;
  const period = Number.isFinite(P.sipCadencePeriod) && P.sipCadencePeriod > 0
    ? Math.max(.1, Math.min(10, P.sipCadencePeriod)) : 1;
  const seconds = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
  const phase = Number.isFinite(P.sipCadencePhase) ? P.sipCadencePhase : 0;
  const wave = .7 * Math.sin(seconds * Math.PI * 2 / period + phase)
    + .3 * Math.sin(seconds * Math.PI * 2 / (period * 1.73) + phase * .61);
  return 1 + amplitude * wave;
}
