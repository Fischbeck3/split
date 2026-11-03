import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dayParams, makeDrinkState, stepDrink, THEMES} from '../site/js/core.js';
import {ROUND_STAGES, roundParams, normalizeRoundRecord} from '../site/js/rounds.js';
import {EXPERIMENT_STAGES, experimentParams, stepExperimentDrink, blackoutFlow, blackoutExposure, blackoutView, experimentAverage} from '../site/js/blackout-model.js';

test('Blackout extends only the practice lineup and preserves the daily schema', () => {
  assert.deepEqual(EXPERIMENT_STAGES.map(stage => stage.label), ['Sober','Tipsy','Drunk','Blackout']);
  assert.deepEqual(ROUND_STAGES.map(stage => stage.label), ['Sober','Tipsy','Drunk','Blackout']);
  const P = dayParams(1), record = normalizeRoundRecord(null, P);
  experimentParams(P, 3);
  assert.deepEqual(normalizeRoundRecord(null, P), record);
  assert.equal(roundParams(P, 3).sipStage, 0);
});

test('double vision and defocus precede slow irregular glimpses separated by total darkness', () => {
  const ready = blackoutView({phase:'ready', idleTime:1});
  assert.equal(ready.exposure, 1);
  assert.ok(ready.blur > 0 && ready.echoes >= 2 && ready.spread > 0);
  const glimpse = blackoutView({phase:'drinking', elapsed:2.1});
  assert.ok(glimpse.echoes > ready.echoes && glimpse.exposure > .5 && glimpse.exposure < .8);
  assert.equal(blackoutView({phase:'drinking', elapsed:1.5}).exposure, 0);
  assert.equal(blackoutView({phase:'locked', elapsed:1.5}).exposure, 0);
  for (const phase of ['result','loading']){
    assert.deepEqual(blackoutView({phase}), {exposure:1, blur:0, echoes:0, spread:0, driftX:0, driftY:0, roll:0});
  }
});

test('glimpses are separated by sustained darkness and have eased, bounded exposure', () => {
  let last = 1, lastRise = -10, darkStart = null, darkIntervals = 0;
  for (let i = 0; i < 6000; i++){
    const t = i / 100, light = blackoutExposure(t);
    assert.ok(light >= 0 && light <= 1);
    if (t > 1.15) assert.ok(light <= .78 + 1e-12);
    assert.ok(Math.abs(light - last) < .05, 'brightness changes are eased across frames');
    if (light > .01 && last <= .01){
      assert.ok(t - lastRise > 1.25, 'separate glimpses never form a rapid strobe');
      lastRise = t;
      if (darkStart !== null){ assert.ok(t - darkStart >= .65); darkIntervals++; }
      darkStart = null;
    }
    if (light <= .01 && last > .01) darkStart = t;
    last = light;
  }
  assert.ok(darkIntervals > 10);
});

test('reduced motion has no blur, ghost movement or pulsing during the sip', () => {
  for (const phase of ['ready','drinking','locked','result']) for (const elapsed of [0,.5,1.5,2.1,4.2,9]){
    const view = blackoutView({phase, elapsed, idleTime:elapsed, reducedMotion:true});
    assert.deepEqual(view, {exposure:['drinking','locked'].includes(phase) ? 0 : 1,
      blur:0, echoes:0, spread:0, driftX:0, driftY:0, roll:0});
  }
});

test('the more erratic Blackout pour is bounded, repeatable and independent of screen frame rate', () => {
  const simulate = (P, fps) => {
    let state = makeDrinkState(P);
    for (let i = 0; i < 2 * fps; i++) state = stepExperimentDrink(P, state, P.K, 1 / fps);
    for (let i = 0; i < fps; i++) state = stepExperimentDrink(P, state, 0, 1 / fps);
    return state;
  };
  for (let day = 1; day <= THEMES.length; day++){
    const base = dayParams(day), original = structuredClone(base);
    const drunk = roundParams(base, 2), blackout = experimentParams(base, 3);
    const expected = simulate(blackout, 120);
    assert.notEqual(expected.level, simulate(drunk, 120).level);
    const flow = Array.from({length:1000}, (_, i) => blackoutFlow(blackout, i / 100));
    assert.ok(Math.min(...flow) >= .30 - 1e-12 && Math.max(...flow) <= 1.70 + 1e-12);
    assert.ok(Math.min(...flow) < .4 && Math.max(...flow) > 1.6);
    for (const fps of [30,60,90,120,144]){
      assert.deepEqual(simulate({...blackout, reducedMotion:true}, fps), simulate(blackout, fps));
      assert.ok(Math.abs(simulate(blackout, fps).level - expected.level) < 2e-6, day + ': ' + fps + 'fps');
      assert.equal(simulate(blackout, fps).velocity, 0);
    }
    assert.deepEqual(base, original);
  }
});

test('the other three experiment stages still use their exact released simulation', () => {
  for (const stage of [0,1,2]){
    const P = experimentParams(dayParams(1), stage), state = makeDrinkState(P);
    assert.deepEqual(stepExperimentDrink(P, state, P.K, .25), stepDrink(P, state, P.K, .25));
  }
  const P = experimentParams(dayParams(1), 3), state = makeDrinkState(P);
  for (const dt of [-1,NaN,Infinity]) assert.deepEqual(stepExperimentDrink(P, state, P.K, dt), state);
  assert.deepEqual(stepExperimentDrink(P, state, P.K, 100), stepExperimentDrink(P, state, P.K, .25));
});

test('four-sip practice averages require four actual scores, including misses', () => {
  assert.equal(experimentAverage([]), null);
  assert.equal(experimentAverage([90,80,70]), null);
  assert.equal(experimentAverage([100,100,100,0]), 75);
  assert.equal(experimentAverage([0,0,0,0]), 0);
  assert.equal(experimentAverage([1,1,0,0]), 1);
  assert.equal(experimentAverage([100,100,100,NaN]), null);
  assert.equal(experimentAverage([100,100,100,101]), null);
});
