import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PROFILES, widthAt} from '../site/js/core.js';
import {getLiquidSurface} from '../site/js/liquid.js';

// Independent fine 3D integration against the actual outline: every depth
// contributes a submerged circular segment, rather than a silhouette span.
function volume(vessel, aspect, center, slope){
  const rows = 24000, incline = Math.abs(slope);
  let sum = 0;
  for (let i = 0; i < rows; i++){
    const y = (i + 0.5) / rows, radius = widthAt(vessel, y) * aspect;
    const crossing = incline === 0 ? (y >= center ? radius : -radius) : (y - center) / incline;
    let segment = 0;
    if (crossing >= radius) segment = Math.PI * radius * radius;
    else if (crossing > -radius){
      segment = radius * radius * Math.acos(-crossing / radius) + crossing * Math.sqrt(radius * radius - crossing * crossing);
    }
    sum += segment / rows;
  }
  return sum;
}

test('an upright surface has the exact input level in every vessel', () => {
  for (const vessel of Object.keys(PROFILES)){
    for (const level of [0, 0.08, 0.27, 0.4, 0.58, 0.97, 1]){
      assert.deepEqual(getLiquidSurface({vessel, level, aspect: 0.31}), {centerLevel: level, slope: 0});
      assert.deepEqual(getLiquidSurface({vessel, level, aspect: 0.31, vesselAngle: 37, liquidAngle: 37}), {centerLevel: level, slope: 0});
    }
  }
});

test('tilt and slosh conserve true liquid volume in every round vessel', () => {
  for (const vessel of Object.keys(PROFILES)){
    for (const aspect of [0.2, 0.36]){
      for (const level of [0.09, 0.29, 0.4, 0.59, 0.93]){
        const expected = volume(vessel, aspect, level, 0);
        for (const [vesselAngle, liquidAngle] of [[18, 0], [-42, 0], [55, 4], [35, -6]]){
          const surface = getLiquidSurface({vessel, level, aspect, vesselAngle, liquidAngle});
          const actual = volume(vessel, aspect, surface.centerLevel, surface.slope);
          assert.ok(Math.abs(actual - expected) < aspect * aspect * 0.00022,
            `${vessel}, level ${level}, angles ${vesselAngle}/${liquidAngle}: volume changed by ${actual - expected}`);
          assert.ok(Math.abs(surface.slope - Math.tan((liquidAngle - vesselAngle) * Math.PI / 180)) < 1e-12);
        }
      }
    }
  }
});

test('the bottle intercept adjusts as liquid crosses its shoulder', () => {
  const level = 0.32, aspect = 0.24;
  const positive = getLiquidSurface({vessel: 'bottle', level, aspect, liquidAngle: 44});
  const negative = getLiquidSurface({vessel: 'bottle', level, aspect, liquidAngle: -44});
  assert.ok(Math.abs(positive.centerLevel - level) > 0.01, 'a slanted bottle surface needs a changed intercept');
  assert.equal(positive.centerLevel, negative.centerLevel, 'mirror inclinations preserve the same amount');
  assert.equal(positive.slope, -negative.slope);
  const expected = volume('bottle', aspect, level, 0);
  assert.ok(Math.abs(volume('bottle', aspect, positive.centerLevel, positive.slope) - expected) < aspect * aspect * 0.00022);
});

test('a tapered pint moves its intercept down while a widening shoulder moves it up', () => {
  const pint = getLiquidSurface({vessel: 'tulip', level: 0.59, aspect: 0.3, vesselAngle: 44});
  const shoulder = getLiquidSurface({vessel: 'bottle', level: 0.32, aspect: 0.3, vesselAngle: 44});
  assert.ok(pint.centerLevel > 0.59 + 0.005, 'the wider upper pint needs a lower intercept to retain its volume');
  assert.ok(shoulder.centerLevel < 0.32 - 0.005, 'the bottle shoulder widens below the line');

  const straight = getLiquidSurface({vessel: 'mug', level: 0.5, aspect: 0.3, vesselAngle: 44});
  assert.ok(Math.abs(straight.centerLevel - 0.5) < 1e-6, 'a symmetric cylinder retains its middle intercept');
});

test('tiny inclination remains continuous with the upright level', () => {
  for (const vessel of Object.keys(PROFILES)){
    for (const level of [0.2, 0.32, 0.6, 31 / 96]){
      for (const vesselAngle of [0.000001, 0.0001, 0.001]){
        const surface = getLiquidSurface({vessel, level, aspect: 0.3, vesselAngle});
        assert.ok(Math.abs(surface.centerLevel - level) < 0.00001);
      }
    }
  }
});

test('full and empty amounts remain full and empty at an inclination', () => {
  for (const vessel of Object.keys(PROFILES)){
    const aspect = 0.3;
    for (const level of [0, 1]){
      const surface = getLiquidSurface({vessel, level, aspect, vesselAngle: 48});
      assert.ok(Math.abs(volume(vessel, aspect, surface.centerLevel, surface.slope) - volume(vessel, aspect, level, 0)) < 0.000005);
    }
  }
});

test('near-sideways surfaces preserve volume without cancellation', () => {
  for (const vessel of ['tulip', 'bottle', 'mug']){
    for (const level of [0.09, 0.4, 0.93]){
      const expected = volume(vessel, 0.3, level, 0);
      for (const vesselAngle of [89.9999, 90]){
        const surface = getLiquidSurface({vessel, level, aspect: 0.3, vesselAngle});
        assert.ok(Math.abs(volume(vessel, 0.3, surface.centerLevel, surface.slope) - expected) < 0.3 * 0.3 * 0.00022);
      }
    }
  }
});

test('invalid values, unknown vessels and extreme angles produce finite surfaces', () => {
  for (const input of [undefined, null, false, {},
    {vessel: '__proto__', level: NaN, aspect: Infinity, vesselAngle: Infinity, liquidAngle: NaN},
    {vessel: 'missing', level: -4, aspect: -1},
    {vessel: 'bottle', level: 4, aspect: 0},
    {vessel: 'stein', level: 0.5, aspect: Number.MAX_VALUE, vesselAngle: -Number.MAX_VALUE, liquidAngle: Number.MAX_VALUE},
    {vessel: 'tulip', level: 0.5, aspect: 0.3, vesselAngle: 90}]){
    const surface = getLiquidSurface(input);
    assert.ok(Number.isFinite(surface.centerLevel));
    assert.ok(Number.isFinite(surface.slope));
  }
});
