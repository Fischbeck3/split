import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dayParams, makeDrinkState, stepDrink} from '../site/js/core.js';
import {roundParams} from '../site/js/rounds.js';
import {stageCadence} from '../site/js/sip-cadence.js';
import {controllerApp, browserStorage} from './helpers/controller-app.js';

// Exercise main.js from Begin through actual draw(), stopping only at the
// canvas pixel boundary. This checks effects delivered to each displayed
// vessel, instead of merely checking that the round model contains knobs.
test('every glass delivers sober, tipsy and drunk presentation and flow through the real controller', () => {
  for (let day = 1; day <= 6; day++){
    const base = dayParams(day), frozen = structuredClone(base);
    const app = controllerApp({P:base, controllerDrawing:true});
    const levels = [];
    for (let stage = 0; stage < 3; stage++){
      app.begin(); app.ready(); app.advance(60);
      const ready = app.draws.at(-1), P = app.S.P, label = base.theme.id + ': sip ' + (stage + 1);
      assert.equal(P.sipStage, stage, label);
      assert.match(app.element('hudMode').textContent, new RegExp(['Sober','Tipsy','Drunk'][stage]), label);
      assert.equal(ready.G.glass, base.theme.id === 'beach' ? 'corona' : base.theme.vessel, label);
      assert.equal(ready.P.sipStage, stage, label);
      assert.equal(ready.filter, stage ? 'blur(' + P.sipBlur + 'px)' : '', label);
      if (!stage) assert.equal(ready.motion.angle, 0, label + ': first sip waits upright');
      else assert.ok(Math.abs(ready.motion.angle) > 1, label + ': sway reaches the displayed vessel');
      app.press(); app.advance(60);
      const held = app.draws.at(-1);
      assert.equal(held.state, 'drinking', label);
      assert.equal(held.drinking, true, label);
      assert.equal(held.P.sipStage, stage, label);
      assert.equal(held.motion.angle, app.S.motion.angle + app.S.visualSway, label + ': rendered angle includes staged sway');
      assert.equal(held.filter, ready.filter, label + ': blur remains active while holding');
      assert.equal(held.L, app.S.drink.level, label + ': displayed beer follows the staged integrator');
      levels.push(held.L);
      // The controller must feed the base rate: core.js applies cadence once.
      // Recreate one second of held input from the real hold loop.
      let expected = makeDrinkState(P);
      for (let tick = 0; tick < 60; tick++) expected = stepDrink(P, expected, P.K, 1 / 60);
      assert.ok(Math.abs(expected.level - held.L) < 1e-6, label + ': staged flow is applied exactly once');
      app.release(); app.settle();
      assert.equal(app.scene.style.filter, '', label + ': finished feedback is sharp');
    }
    assert.ok(Math.abs(levels[1] - levels[0]) > 1e-5, base.theme.id + ': tipsy flow differs from sober');
    assert.ok(Math.abs(levels[2] - levels[0]) > 1e-5, base.theme.id + ': drunk flow differs from sober');
    assert.equal(app.S.state, 'result');
    assert.equal(app.S.result.rounds.length, 3);
    assert.deepEqual(base, frozen, 'stage effects cannot alter the released daily glass');
  }
});

test('the two later sips receive the requested fifteen percent intensity increase while sober stays unchanged', () => {
  const base = dayParams(1), before = [
    {blur:0, sway:0, amplitude:0, period:1},
    {blur:.3, sway:.6, amplitude:.13, period:.92},
    {blur:1.05, sway:1.45, amplitude:.30, period:.68}
  ];
  for (let stage = 0; stage < 3; stage++){
    const actual = roundParams(base, stage), factor = stage ? 1.15 : 1;
    for (const [field, previous] of [
      ['sipBlur',before[stage].blur], ['sipSway',before[stage].sway], ['sipCadenceAmplitude',before[stage].amplitude]
    ]) assert.ok(Math.abs(actual[field] - previous * factor) < 1e-12, stage + ': ' + field + ' increases by fifteen percent');
    assert.equal(actual.sipCadencePeriod, before[stage].period, 'the authored rhythm does not speed up');
  }
  const sober = roundParams(base, 0);
  let original = makeDrinkState(base), firstSip = makeDrinkState(sober);
  for (let tick = 0; tick < 240; tick++){
    original = stepDrink(base, original, base.K, 1 / 120);
    firstSip = stepDrink(sober, firstSip, sober.K, 1 / 120);
  }
  assert.deepEqual(firstSip, original, 'sober reproduces the original pour exactly');
});

test('the stronger drunk amplitude reaches cadence and fluid physics instead of being swallowed by a safety cap', () => {
  const base = dayParams(1), P = roundParams(base, 2);
  let peak = {multiplier:1, at:0};
  for (let tick = 0; tick < 2400; tick++){
    const at = tick / 120, multiplier = stageCadence(P, at);
    if (multiplier > peak.multiplier) peak = {multiplier, at};
  }
  assert.ok(peak.multiplier > 1.30, 'Drunk must exceed the old thirty percent envelope after its fifteen percent boost');
  const wave = .7 * Math.sin(peak.at * Math.PI * 2 / P.sipCadencePeriod + P.sipCadencePhase)
    + .3 * Math.sin(peak.at * Math.PI * 2 / (P.sipCadencePeriod * 1.73) + P.sipCadencePhase * .61);
  assert.ok(Math.abs(peak.multiplier - (1 + P.sipCadenceAmplitude * wave)) < 1e-12, 'the configured amplitude is applied without truncation');
  // A controlled velocity state samples the real core integrator at this peak.
  const state = {...makeDrinkState(P), elapsed:peak.at, velocity:0};
  const stronger = stepDrink(P, state, P.K, 1 / 120);
  const previous = stepDrink({...P,sipCadenceAmplitude:.30}, state, P.K, 1 / 120);
  assert.ok(stronger.level > previous.level, 'the additional intensity reaches actual drink amount');
});

test('device reduced motion removes visual stage effects in all six glasses while keeping identical sip difficulty and scores', () => {
  for (let day = 1; day <= 6; day++){
    const P = dayParams(day);
    const full = controllerApp({P, practice:true, controllerDrawing:true});
    const still = controllerApp({P, practice:true, deviceReduced:true, controllerDrawing:true});
    for (let stage = 0; stage < 3; stage++){
      for (const app of [full, still]){ app.begin(); app.ready(); app.advance(60); app.press(); app.advance(60); }
      const drawing = still.draws.at(-1), label = P.theme.id + ': sip ' + (stage + 1);
      assert.equal(drawing.filter, '', label + ': blur honors the device preference');
      assert.equal(drawing.motion.angle, 0, label + ': glass stays upright');
      assert.equal(drawing.motion.lift, 0, label + ': no visual lift');
      assert.equal(drawing.ambient, false, label);
      assert.equal(drawing.bubbles, false, label);
      assert.equal(still.S.visualSway, 0, label);
      assert.equal(still.S.P.sipCadenceAmplitude, full.S.P.sipCadenceAmplitude, label + ': preference does not reduce difficulty');
      assert.ok(Math.abs(drawing.L - full.draws.at(-1).L) < 1e-6, label + ': identical held amount within subpixel integration tolerance');
      for (const app of [full, still]){ app.release(); app.settle(); }
      assert.ok(Math.abs(still.S.progress.rounds[stage].L - full.S.progress.rounds[stage].L) < 1e-6, label + ': identical settled amount within subpixel integration tolerance');
      assert.equal(still.S.progress.rounds[stage].score, full.S.progress.rounds[stage].score, label + ': identical score');
    }
    assert.equal(still.S.result.score, full.S.result.score);
  }
});

test('restoring a saved sober sip starts Tipsy with real blur and sway rather than replaying the sober stage', () => {
  const storage = browserStorage(), first = controllerApp({storage, controllerDrawing:true});
  first.sip(60);
  const reload = controllerApp({storage, controllerDrawing:true}); reload.restore();
  assert.equal(reload.element('startLabel').textContent, 'Continue · Tipsy');
  reload.begin(); reload.ready(); reload.advance(60);
  assert.equal(reload.S.P.sipStage, 1);
  assert.equal(reload.draws.at(-1).filter, 'blur(' + reload.S.P.sipBlur + 'px)');
  assert.ok(Math.abs(reload.draws.at(-1).motion.angle) > .1);
  assert.equal(reload.S.progress.rounds.length, 1, 'restoration does not consume another sip');
});
