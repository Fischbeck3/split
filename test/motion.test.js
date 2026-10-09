import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dayParams, makeDrinkState, stepDrink} from '../site/js/core.js';
import {makeMotionState, stepMotion, isMotionSettled} from '../site/js/motion.js';

function moveFor(P, state, seconds, {drinking = true, input = 1, elapsed = 0, frames = [1 / 60], reducedMotion = false} = {}){
  let done = 0, frame = 0;
  while (seconds - done > 1e-10){
    const dt = Math.min(seconds - done, frames[frame++ % frames.length]);
    state = stepMotion(P, state, {drinking, input, elapsed: elapsed + done, dt, reducedMotion});
    done += dt;
  }
  return state;
}

test('vessel motion is pure, deterministic, and consistent across frame rates', () => {
  for (const day of [1, 2, 3]){
    const P = dayParams(day), initial = makeMotionState(), copy = {...initial};
    const reference = moveFor(P, initial, 0.73, {frames: [1 / 120]});
    assert.deepEqual(moveFor(P, initial, 0.73, {frames: [1 / 120]}), reference);
    for (const frames of [[1 / 24], [1 / 30], [1 / 60], [0.011, 0.022, 0.033]]){
      const result = moveFor(P, initial, 0.73, {frames});
      for (const key of Object.keys(reference)){
        assert.ok(Math.abs(result[key] - reference[key]) < 0.0001, P.theme.id + ': FPS changed ' + key);
      }
    }
    assert.deepEqual(initial, copy, 'caller state was mutated');
  }
});

test('the glass tips visibly, the bottle kicks, and the stein lifts more slowly', () => {
  const pub = dayParams(1), bottle = dayParams(2), stein = dayParams(3);
  const pubEarly = moveFor(pub, makeMotionState(), 0.15);
  const steinEarly = moveFor(stein, makeMotionState(), 0.15);
  assert.ok(pubEarly.angle > steinEarly.angle + 3, 'heavy stein should react more slowly');
  for (const P of [pub, bottle, stein]){
    const state = moveFor(P, makeMotionState(), 1.5);
    assert.ok(state.angle > 17 && state.angle < 26, P.theme.id + ': visible, bounded tilt');
    assert.ok(state.lift > 0.015 && state.lift < 0.04, P.theme.id + ': modest lift');
    assert.ok(Math.abs(state.liquidAngle) < 3, 'liquid should stay close to world-horizontal');
  }
  const a = moveFor(bottle, makeMotionState(), 1.5);
  const b = moveFor(bottle, a, 0.145, {elapsed: 1.5});
  assert.ok(Math.abs(a.angle - b.angle) > 0.25, 'bottle should visibly follow its glug cadence');
  const half = moveFor(pub, makeMotionState(), 1, {input: 0.5});
  assert.ok(Math.abs(half.angle - 10) < 0.01, 'tilt should follow sip strength');
});

test('releasing puts every vessel down within a second and snaps it to rest', () => {
  for (const day of [1, 2, 3]){
    const P = dayParams(day);
    for (const sipSeconds of [0.1, 0.3, 1.5]){
      const held = moveFor(P, makeMotionState(), sipSeconds);
      const shortlyAfter = moveFor(P, held, 0.08, {drinking: false, elapsed: sipSeconds});
      assert.ok(!isMotionSettled(shortlyAfter), 'return should preserve visible continuity');
      const rested = moveFor(P, held, 0.95, {drinking: false, elapsed: sipSeconds});
      assert.ok(isMotionSettled(rested), P.theme.id + ': return took over a second');
      assert.deepEqual(rested, makeMotionState(), 'rest should be exact, not an endless asymptote');
    }
  }
});

test('reduced motion keeps input feedback but cannot affect the scored drink amount', () => {
  const P = dayParams(3), initial = makeDrinkState(P);
  let fullDrink = initial, reducedDrink = initial, full = makeMotionState(), reduced = makeMotionState();
  for (let i = 0; i < 150; i++){
    const drinking = i < 120, dt = 1 / 60, elapsed = i * dt;
    full = stepMotion(P, full, {drinking, input: 1, elapsed, dt});
    reduced = stepMotion(P, reduced, {drinking, input: 1, elapsed, dt, reducedMotion: true});
    fullDrink = stepDrink(P, fullDrink, drinking ? P.K : 0, dt);
    reducedDrink = stepDrink(P, reducedDrink, drinking ? P.K : 0, dt);
    for (const key of ['angle', 'angularVelocity', 'liquidAngle', 'liquidVelocity', 'lift']) assert.equal(reduced[key], 0);
    if (drinking) assert.equal(reduced.activity, 1, 'keep meaningful press feedback');
  }
  assert.deepEqual(fullDrink, reducedDrink);
  assert.ok(fullDrink.level > initial.level, 'test should include a real sip');
  assert.ok(isMotionSettled(reduced));
});

test('invalid motion inputs remain finite and long background gaps are bounded', () => {
  const P = dayParams(1), initial = makeMotionState();
  assert.deepEqual(stepMotion(P, initial, {drinking: true, input: 1, dt: 100}),
    stepMotion(P, initial, {drinking: true, input: 1, dt: 0.25}));
  const safe = stepMotion(null, {angle: Infinity, lift: NaN}, {input: Infinity, elapsed: NaN, dt: NaN});
  assert.ok(Object.values(safe).every(Number.isFinite));
  assert.ok(isMotionSettled(safe));
  assert.ok(!isMotionSettled({angle: NaN}));
});
