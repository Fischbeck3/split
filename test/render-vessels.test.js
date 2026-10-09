import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PROFILES, THEMES, themeById, widthAt, makeDrinkState, stepDrink} from '../site/js/core.js';
import {CONCEPT_CHAPTERS} from '../site/js/concepts.js';
import {RENDER_PROFILES, renderVessel, renderWidthAt} from '../site/js/render-vessels.js';

test('only Corona receives a new display outline; other drinks retain their physical outline', () => {
  const before = structuredClone(PROFILES), corona = themeById('beach');
  assert.equal(corona.vessel, 'bottle');
  assert.equal(renderVessel(corona), 'corona');
  const greenBottle = CONCEPT_CHAPTERS.flatMap(chapter => chapter.options).find(option => option.theme.vessel === 'bottle');
  assert.equal(greenBottle.theme.name, 'Peroni');
  assert.equal(renderVessel(greenBottle.theme), 'bottle');
  assert.equal(renderVessel({...corona, id:'another-bottle'}), 'bottle');
  assert.equal(renderVessel({...corona, vessel:'tall'}), 'tall');
  for (const theme of THEMES.filter(theme => theme.id !== corona.id)) assert.equal(renderVessel(theme), theme.vessel);
  for (const vessel of Object.keys(PROFILES)){
    for (let i = 0; i <= 1000; i++) assert.equal(renderWidthAt(vessel, i / 1000), widthAt(vessel, i / 1000));
  }
  assert.ok(renderWidthAt('corona', 0.6) < widthAt('bottle', 0.6) * 0.8, 'Corona should have a slimmer body');
  assert.deepEqual(PROFILES, before, 'display lookups must not mutate drinking profiles');
});

test('Corona has a continuous rounded shoulder, slender neck, and straight body', () => {
  for (let i = 0; i <= 10000; i++){
    const width = renderWidthAt('corona', i / 10000);
    assert.ok(Number.isFinite(width) && width > 0 && width <= 1, 'invalid width at depth ' + i / 10000);
  }
  assert.ok(renderWidthAt('corona', 0.15) < renderWidthAt('corona', 0.6) * 0.5, 'neck should be substantially narrower than the body');
  let previous = renderWidthAt('corona', 0.24);
  for (let i = 2401; i <= 6000; i++){
    const width = renderWidthAt('corona', i / 10000);
    assert.ok(width >= previous - 1e-12, 'shoulder turned inward at depth ' + i / 10000);
    previous = width;
  }
  assert.ok(Math.abs(renderWidthAt('corona', 0.6) - renderWidthAt('corona', 0.85)) < 0.005, 'body should read as straight glass');
  const epsilon = 1e-6;
  for (const [depth] of RENDER_PROFILES.corona.slice(1, -1)){
    const left = renderWidthAt('corona', depth - epsilon), at = renderWidthAt('corona', depth), right = renderWidthAt('corona', depth + epsilon);
    assert.ok(Math.abs(right - left) < 0.00002, 'outline jumped at depth ' + depth);
    assert.ok(Math.abs((at - left) / epsilon - (right - at) / epsilon) < 0.005, 'outline has a visible corner at depth ' + depth);
  }
  for (const depth of [-1, NaN, Infinity, -Infinity]) assert.equal(renderWidthAt('corona', depth), renderWidthAt('corona', 0));
  assert.equal(renderWidthAt('corona', 2), renderWidthAt('corona', 1));
});

test('Corona display lookups preserve the calibrated bottle momentum pour', () => {
  // Keep this physical calibration independent of the authored day schedule.
  const P = {num:2, key:'2026-10-10', theme:themeById('beach'),
    markY:0.5912583994492888, markH:0.07670936007518321, K:0.1561537075182423, wobble:0, choppy:false};
  const before = structuredClone(P), profilesBefore = structuredClone(PROFILES);
  // Calibrated levels for the authorized round-section momentum model at
  // constant K and 120 Hz: neck, shoulder, and two regular body glugs.
  const checkpoints = new Map([[12, 0.14722400527028784], [30, 0.32449484007936713],
    [120, 0.462580604363762], [240, 0.6178894004419483]]);
  let drink = makeDrinkState(P), withoutRendering = makeDrinkState(P);
  for (let tick = 1; tick <= 240; tick++){
    renderWidthAt(renderVessel(P.theme), drink.level);
    drink = stepDrink(P, drink, P.K, 1 / 120);
    withoutRendering = stepDrink(P, withoutRendering, P.K, 1 / 120);
    assert.deepEqual(drink, withoutRendering, 'display lookup changed the pour at tick ' + tick);
    if (checkpoints.has(tick)) assert.ok(Math.abs(drink.level - checkpoints.get(tick)) < 1e-12, 'calibrated timing changed at tick ' + tick);
  }
  const moving = stepDrink(P, drink, 0, 1 / 120);
  assert.ok(moving.level > drink.level && moving.velocity > 0, 'bottle momentum must carry briefly after release');
  const released = stepDrink(P, drink, 0, 0.21);
  assert.ok(Math.abs(released.level - 0.632749298625497) < 1e-12, 'calibrated afterflow changed');
  assert.ok(released.level - drink.level > 0.01 && released.level - drink.level < 0.02, 'bottle afterflow must stay brief and learnable');
  assert.equal(released.velocity, 0, 'bottle must settle within its 0.21-second release window');
  assert.equal(stepDrink(P, released, 0, 0.25).level, released.level, 'bottle moved after settling');
  assert.deepEqual(P, before, 'rendering changed the seeded pour or target');
  assert.deepEqual(PROFILES, profilesBefore, 'rendering changed the physical drinking profiles');
});
