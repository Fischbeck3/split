import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHearthMotion, updateHearthMotion} from '../site/js/hearth.js';

function paintedHearth(){
  const width = 84, height = 94, data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++){
    const i = (y * width + x) * 4;
    const flame = y > 25 + Math.sin(x * .2) * 11 && y < 81 && Math.abs(x - 46) < 8 + y * .16;
    data.set(flame ? [255, 140 + y, 50 + x, 255] : [65 + x % 7, 32 + y % 5, 15, 255], i);
  }
  return {width, height, data};
}

test('flame texture changes shape while the hearth edges, grate and alpha stay fixed', () => {
  const frame = paintedHearth(), original = new Uint8ClampedArray(frame.data), state = createHearthMotion(frame, 85);
  updateHearthMotion(state, 0);
  const first = new Uint8ClampedArray(frame.data);
  updateHearthMotion(state, 470);
  assert.notDeepEqual(frame.data, first, 'fire is static');
  assert.deepEqual(frame.data.slice(85 * frame.width * 4), original.slice(85 * frame.width * 4), 'grate moved');
  for (let y = 0; y < frame.height; y++){
    for (const x of [0, frame.width - 1]){
      const i = (y * frame.width + x) * 4;
      assert.deepEqual(frame.data.slice(i, i + 4), original.slice(i, i + 4), 'crop edge moved');
    }
  }
  for (let i = 3; i < frame.data.length; i += 4) assert.equal(frame.data[i], original[i], 'fire opacity pulses');
});

test('hearth frames are capped at 30 fps and always sample the original paint', () => {
  const frame = paintedHearth(), state = createHearthMotion(frame, 85);
  assert.equal(updateHearthMotion(state, NaN), true);
  const first = new Uint8ClampedArray(frame.data);
  for (const time of [Infinity, -100, 8, 32]) assert.equal(updateHearthMotion(state, time), false);
  updateHearthMotion(state, 6000);
  updateHearthMotion(state, 0);
  assert.deepEqual(frame.data, first, 'distortion accumulated over previous frames');
});
