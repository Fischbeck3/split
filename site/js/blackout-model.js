// Isolated practice profiles. Released daily rounds and saved records stay in rounds.js.
import {ROUND_STAGES, roundParams} from './rounds.js';
export {stepStagedDrink as stepExperimentDrink, blackoutFlow, blackoutExposure, blackoutView} from './blackout-effects.js';

export const EXPERIMENT_STAGES = Object.freeze([
  ...ROUND_STAGES.slice(0, 3).map(stage => Object.freeze({...stage, id:stage.label.toLowerCase()})),
  Object.freeze({...ROUND_STAGES[2], id:'blackout', label:'Blackout', blur:2.8, sway:2.3, cadenceAmplitude:.70, cadencePeriod:.83})
]);

export function experimentParams(base, index = 3){
  const stage = Number.isInteger(index) && index >= 0 && index < EXPERIMENT_STAGES.length ? index : 3;
  const params = {...roundParams(base, Math.min(stage, 2)), experimentStage:stage, blackout:stage === 3};
  // Blackout's cadence is sampled by the isolated experiment integrator below.
  if (params.blackout) Object.assign(params, {sipBlur:2.8, sipSway:2.3, sipCadenceAmplitude:0});
  return params;
}

export function experimentAverage(scores){
  return scores.length === 4 && scores.every(score => Number.isFinite(score) && score >= 0 && score <= 100)
    ? Math.round(scores.reduce((total, score) => total + score, 0) / 4) : null;
}
