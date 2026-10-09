import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LAUNCH, SCHEDULE} from '../site/js/themes.js';
import {THEMES, PROFILES, themeById, themeForDay, dayParams, dayNumber, keyForDay, startLevel, flowFactor, tiltRate,
  makeDrinkState, stepDrink, isDrinkSettled, STEIN_SETTLE_SECONDS, secondsToMark,
  scoreFromOffset, bandEmoji, detailText, DRAIN_LEVEL, PERFECT, SPLIT} from '../site/js/core.js';
import {SCENES, MARKS} from '../site/js/draw.js';
import {physicalGlassParams} from './fixtures/physical-glasses.js';

const DAYS = Array.from({length: 400}, (_, i) => i + 1);

test('the first days follow the chosen plan: pub, Rome, Tokyo', () => {
  assert.deepEqual(SCHEDULE.slice(0, 3).map((_, i) => themeForDay(i + 1).id), ['pub', 'peroni', 'sapporo']);
});

test('the selected destinations occupy their pinned dates without moving the launch', () => {
  assert.deepEqual(SCHEDULE, ['pub', 'peroni', 'sapporo', 'munich', 'butterbeer', 'beach']);
  assert.equal(LAUNCH, '2026-10-09');
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(n => [keyForDay(n), themeForDay(n).id]), [
    ['2026-10-09', 'pub'], ['2026-10-10', 'peroni'], ['2026-10-11', 'sapporo'],
    ['2026-10-12', 'munich'], ['2026-10-13', 'butterbeer'], ['2026-10-14', 'beach']
  ]);
});

test('the chosen lineup preserves the released Day 1 glass parameters', () => {
  const {theme, ...params} = dayParams(1);
  assert.deepEqual({...params, themeId:theme.id},
    {num:1, key:'2026-10-09', markY:0.6336473895981908, markH:0.10183376568136737, K:0.16028254496864974, wobble:0, choppy:false, themeId:'pub'});
});

test('the selected glasses carry the chosen place, vessel and mark', () => {
  assert.deepEqual([3, 5, 2].map(n => {
    const t = themeForDay(n);
    return [t.id, t.label, t.scene, t.vessel, t.mark, t.letter || null, t.markFrame || null, t.speed, t.headT];
  }), [
    ['sapporo', 'Tokyo izakaya', 'tokyo', 'tall', 'star', null, null, 1, 0.09],
    ['butterbeer', 'Snowy Hogsmeade', 'hogsmeade', 'tulip', 'letter', 'H', 'shield', 0.8, 0.17],
    ['peroni', 'Trastevere sunset', 'rome', 'tall', 'letter', 'P', null, 1, 0.065]
  ]);
  for (const n of [3, 5, 2]){
    const P = dayParams(n), top = P.markY - P.markH / 2;
    assert.ok(top > startLevel(P.theme) + 0.05, P.theme.id + ': the mark must start below the foam');
    assert.ok(secondsToMark(P) > 1.2 && secondsToMark(P) < 8, P.theme.id + ': the selected mark must be reachable in one real sip');
    assert.ok(P.theme.memory && P.theme.brandText && P.theme.brandSubline, P.theme.id + ': missing selected identity');
  }
});

test('day No. 1 is the launch date', () => {
  const [y, m, d] = LAUNCH.split('-').map(Number);
  assert.equal(keyForDay(1), LAUNCH);
  assert.equal(dayNumber(new Date(y, m - 1, d, 0, 1)), 1);
  assert.equal(dayNumber(new Date(y, m - 1, d, 23, 59)), 1);
  assert.equal(dayNumber(new Date(y, m - 1, d + 1, 0, 1)), 2);
});

test('every theme is complete and uses a vessel, place and mark the game can draw', () => {
  const ids = new Set();
  for (const t of THEMES){
    assert.ok(!ids.has(t.id), 'duplicate id ' + t.id); ids.add(t.id);
    assert.ok(PROFILES[t.vessel], t.id + ': unknown vessel ' + t.vessel);
    assert.ok(SCENES.includes(t.scene), t.id + ': unknown scene ' + t.scene);
    assert.ok(MARKS.includes(t.mark), t.id + ': unknown mark ' + t.mark);
    if (t.mark === 'letter') assert.equal(typeof t.letter, 'string', t.id + ': letter mark needs a letter');
    for (const c of [...t.body, t.head, t.markFill, t.markStroke]) assert.match(c, /^#[0-9a-f]{6}$/i, t.id + ': color ' + c);
    assert.ok(t.label && t.line && t.target && t.name, t.id + ': missing text');
    assert.ok(t.headT > 0 && t.headT < 0.3, t.id + ': head thickness');
    assert.ok(t.speed > 0, t.id + ': speed');
  }
  for (const id of SCHEDULE) assert.ok(themeById(id), 'SCHEDULE names a missing theme: ' + id);
});

test('the same day always pours the same glass', () => {
  for (const n of [1, 2, 3, 4, 50, 365]) assert.deepEqual(dayParams(n), dayParams(n));
});

test('no glass two days running, and every glass turns up', () => {
  const seen = new Set();
  for (const n of DAYS){
    seen.add(themeForDay(n).id);
    assert.notEqual(themeForDay(n).id, themeForDay(n + 1).id, 'day ' + n + ' and ' + (n + 1));
  }
  assert.equal(seen.size, THEMES.length);
});

test('every mark sits below the start line and above the bottom', () => {
  for (const n of [-3, 0, ...DAYS]){
    const P = dayParams(n), top = P.markY - P.markH / 2, bottom = P.markY + P.markH / 2;
    assert.ok(top > startLevel(P.theme) + 0.05, 'day ' + n + ' (' + P.theme.id + '): mark starts too high');
    assert.ok(bottom < DRAIN_LEVEL - 0.05, 'day ' + n + ' (' + P.theme.id + '): mark sits too low');
  }
});

test('reaching the mark takes a real sip, not a flick and not a chore', () => {
  for (const n of DAYS){
    const P = dayParams(n), s = secondsToMark(P);
    assert.ok(s > 1.2 && s < 8, 'day ' + n + ' (' + P.theme.id + '): ' + s.toFixed(2) + ' s');
  }
});

test('a bottle neck drains fast and a stein drinks slow', () => {
  const beach = themeById('beach'), pub = themeById('pub'), munich = themeById('munich');
  assert.ok(flowFactor(beach, 0.57, 0.1) > 2.5 * flowFactor(beach, 0.57, 0.57));
  assert.ok(flowFactor(munich, 0.56, 0.56) < flowFactor(pub, 0.56, 0.56));
});

function drinkFor(P, state, rate, seconds, frameSteps = [1 / 60]){
  let left = seconds, frame = 0;
  while (left > 1e-10){
    const dt = Math.min(left, frameSteps[frame++ % frameSteps.length]);
    state = stepDrink(P, state, rate, dt); left -= dt;
  }
  return state;
}

test('a sip is deterministic, pure, and comparable at different frame rates', () => {
  for (const id of ['pub', 'beach', 'munich']){
    const P = physicalGlassParams(id), initial = makeDrinkState(P), before = {...initial};
    const simulate = steps => {
      const held = drinkFor(P, initial, P.K, 2.2, steps);
      return drinkFor(P, held, 0, 0.4, steps);
    };
    const reference = simulate([1 / 120]);
    assert.deepEqual(simulate([1 / 120]), reference, P.theme.id + ': deterministic');
    for (const steps of [[1 / 24], [1 / 30], [1 / 60], [0.011, 0.022, 0.033]]){
      const actual = simulate(steps);
      assert.ok(Math.abs(actual.level - reference.level) < 0.00001, P.theme.id + ': frame rate changed the landing');
      assert.equal(actual.velocity, 0, P.theme.id + ': released sip did not settle');
    }
    assert.deepEqual(initial, before, P.theme.id + ': input state was mutated');
  }
});

test('the bottle has a free-running neck and a strong, regular glug in its body', () => {
  const P = physicalGlassParams('beach'), rate = P.K;
  const at = (level, elapsed) => stepDrink(P, {level, elapsed, velocity: 0}, rate, 1 / 120);
  const neckFast = at(0.12, 0.145), neckSlow = at(0.12, 0.435);
  assert.ok(Math.abs(neckFast.velocity - neckSlow.velocity) < 1e-9, 'neck should not pulse');
  const bodyFast = at(0.6, 0.145), bodySlow = at(0.6, 0.435);
  assert.ok(bodyFast.velocity > bodySlow.velocity * 3, 'body should visibly pulse');
  assert.ok(neckFast.velocity > bodyFast.velocity, 'neck still drains faster than the strongest body glug');
  assert.ok(bodySlow.velocity > 0, 'a glug should not reverse the line');
});

test('the pub stops on release while the stein has a small, bounded follow-through', () => {
  const pub = physicalGlassParams('pub'), stein = physicalGlassParams('munich');
  const pubHeld = drinkFor(pub, makeDrinkState(pub), pub.K, 1);
  const pubReleased = stepDrink(pub, pubHeld, 0, 1 / 60);
  assert.equal(pubReleased.level, pubHeld.level);
  assert.ok(isDrinkSettled(pubReleased));
  const steinHeld = drinkFor(stein, makeDrinkState(stein), stein.K, 1);
  assert.ok(steinHeld.level - startLevel(stein.theme) < pubHeld.level - startLevel(pub.theme), 'stein should drink more slowly');
  const steinReleased = stepDrink(stein, steinHeld, 0, 1 / 60);
  assert.ok(steinReleased.level > steinHeld.level);
  assert.ok(!isDrinkSettled(steinReleased));
  const settled = drinkFor(stein, steinHeld, 0, STEIN_SETTLE_SECONDS);
  assert.ok(isDrinkSettled(settled));
  assert.ok(settled.level - steinHeld.level > 0.002 && settled.level - steinHeld.level < 0.02, 'tail should be learnable and brief');
  assert.equal(drinkFor(stein, settled, 0, 1).level, settled.level, 'line moved after settling');
});

test('a paused tab cannot skip a whole drink and the level never passes the drain', () => {
  const P = dayParams(1), initial = makeDrinkState(P);
  assert.deepEqual(stepDrink(P, initial, P.K, 100), stepDrink(P, initial, P.K, 0.25));
  const drained = stepDrink(P, {...initial, level: DRAIN_LEVEL - 0.001}, P.K * 100, 0.25);
  assert.equal(drained.level, DRAIN_LEVEL);
  assert.ok(isDrinkSettled(drained));
  assert.equal(stepDrink(P, initial, -P.K, 0.1).level, initial.level);
  assert.deepEqual(stepDrink(P, initial, P.K, NaN), initial);
});

test('the scheduled days carry their identity into text shares and cards', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(n => themeForDay(n).name), ['Guinness', 'Peroni', 'Sapporo', 'Festbier', 'Butterbeer', 'Corona']);
  for (const n of [1, 2, 3, 4, 5, 6]){
    const t = themeForDay(n);
    assert.ok(t.location && t.feel && t.emoji, t.id + ': missing share identity');
    assert.deepEqual(Object.keys(t.palette), ['bg', 'fg', 'muted', 'sheet', 'line', 'accent', 'accentFg']);
    for (const color of Object.values(t.palette)) assert.match(color, /^#[0-9a-f]{6}$/i);
  }
});

test('tilt: nothing until 15 degrees, full rate at 40, capped beyond', () => {
  assert.equal(tiltRate(0.15, 10), 0);
  assert.equal(tiltRate(0.15, 15), 0);
  assert.ok(Math.abs(tiltRate(0.15, 40) - 0.15) < 1e-9);
  assert.equal(tiltRate(0.15, 90), tiltRate(0.15, 55));
});

test('scoring bands', () => {
  assert.deepEqual(scoreFromOffset(0, 'the G'), {score: 100, label: 'Perfect split', tone: 'good'});
  assert.equal(scoreFromOffset(PERFECT, 'the G').label, 'Perfect split');
  assert.equal(scoreFromOffset(PERFECT + 0.001, 'the G').label, 'Split');
  assert.equal(scoreFromOffset(SPLIT, 'the G').label, 'Split');
  assert.equal(scoreFromOffset(0.3, 'the G').label, 'Low in the G');
  assert.equal(scoreFromOffset(-0.3, 'the G').label, 'High in the G');
  assert.equal(scoreFromOffset(0.6, 'the crest').label, 'Below the crest');
  assert.equal(scoreFromOffset(-0.6, 'the crown').tone, 'miss');
  let last = 101;
  for (let a = 0; a <= 1; a += 0.02){ const s = scoreFromOffset(a, 'x').score; assert.ok(s <= last); last = s; }
});

test('the emoji strip shows where the line landed', () => {
  assert.equal(bandEmoji(0), '⬜⬜🟩⬜⬜');
  assert.equal(bandEmoji(0.2), '⬜⬜⬜🟨⬜');
  assert.equal(bandEmoji(-0.4), '🟧⬜⬜⬜⬜');
  assert.ok(bandEmoji(-0.7).startsWith('⬆️'));
  assert.ok(bandEmoji(0.7).endsWith('⬇️'));
  assert.equal(detailText(0.123, false), '12% low.');
  assert.equal(detailText(0, true), 'You drank the lot.');
});
