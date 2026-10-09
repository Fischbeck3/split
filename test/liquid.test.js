import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderWidthAt as widthAt} from '../site/js/render-vessels.js';
import {getLiquidSurface} from '../site/js/liquid.js';

const VESSELS = ['tulip', 'bottle', 'corona', 'stein'];

// Independent fine integration against the actual outline rather than the
// solver's cached rectangular rows.
function area(vessel, aspect, center, slope){
  const rows = 24000, incline = Math.abs(slope);
  let sum = 0;
  for (let i = 0; i < rows; i++){
    const y = (i + 0.5) / rows, halfWidth = widthAt(vessel, y) * aspect;
    const span = incline === 0 ? (y >= center ? 2 * halfWidth : 0) : Math.max(0, Math.min(2 * halfWidth, halfWidth + (y - center) / incline));
    sum += span / rows;
  }
  return sum;
}

test('an upright surface has the exact input level in every vessel', () => {
  for (const vessel of VESSELS){
    for (const level of [0, 0.08, 0.27, 0.4, 0.58, 0.97, 1]){
      assert.deepEqual(getLiquidSurface({vessel, level, aspect: 0.31}), {centerLevel: level, slope: 0});
      assert.deepEqual(getLiquidSurface({vessel, level, aspect: 0.31, vesselAngle: 37, liquidAngle: 37}), {centerLevel: level, slope: 0});
    }
  }
});

test('tilt and slosh conserve liquid in the physical and Corona display outlines', () => {
  for (const vessel of VESSELS){
    for (const aspect of [0.2, 0.36]){
      for (const level of [0.09, 0.26, 0.31, 0.38, 0.4, 0.45, 0.47, 0.53, 0.59, 0.93]){
        const expected = area(vessel, aspect, level, 0);
        for (const [vesselAngle, liquidAngle] of [[18, 0], [-42, 0], [55, 4], [35, -6]]){
          const surface = getLiquidSurface({vessel, level, aspect, vesselAngle, liquidAngle});
          const actual = area(vessel, aspect, surface.centerLevel, surface.slope);
          assert.ok(Math.abs(actual - expected) < aspect * 0.00022,
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
  const expected = area('bottle', aspect, level, 0);
  assert.ok(Math.abs(area('bottle', aspect, positive.centerLevel, positive.slope) - expected) < 0.00005);
});

test('tiny inclination remains continuous with the upright level', () => {
  for (const vessel of VESSELS){
    for (const level of [0.2, 0.32, 0.6]){
      const surface = getLiquidSurface({vessel, level, aspect: 0.3, vesselAngle: 0.0001});
      assert.ok(Math.abs(surface.centerLevel - level) < 0.00001);
    }
  }
});

test('full and empty amounts remain full and empty at an inclination', () => {
  for (const vessel of VESSELS){
    const aspect = 0.3;
    for (const level of [0, 1]){
      const surface = getLiquidSurface({vessel, level, aspect, vesselAngle: 48});
      assert.ok(Math.abs(area(vessel, aspect, surface.centerLevel, surface.slope) - area(vessel, aspect, level, 0)) < 0.000005);
    }
  }
});

test('Corona and the green bottle retain separate cached liquid outlines', () => {
  const options = {level: 0.36, aspect: 0.24, vesselAngle: 48};
  const original = getLiquidSurface({...options, vessel: 'bottle'});
  const corona = getLiquidSurface({...options, vessel: 'corona'});
  assert.ok(Math.abs(corona.centerLevel - original.centerLevel) > 0.01, 'different shoulders must produce different slosh intercepts');
  for (let i = 0; i < 3; i++){
    assert.deepEqual(getLiquidSurface({...options, vessel: 'bottle'}), original);
    assert.deepEqual(getLiquidSurface({...options, vessel: 'corona'}), corona);
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
