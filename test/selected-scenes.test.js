import {test} from 'node:test';
import assert from 'node:assert/strict';
import {drawBackdrop, loadSceneAssets, SCENES} from '../site/js/draw.js';
import {memoryScenePlacement, roomScenePlacement} from '../site/js/ambient.js';

function recordingContext(){
  const calls = [], values = {};
  const context = new Proxy(values, {
    get(target, key){
      if (key in target) return target[key];
      if (key === 'createLinearGradient' || key === 'createRadialGradient') return (...args) => {
        calls.push([key, ...args]);
        return {addColorStop: (...stops) => calls.push(['colorStop', ...stops])};
      };
      return (...args) => calls.push([key, ...args]);
    },
    set(target, key, value){ target[key] = value; calls.push(['set', key, value]); return true; }
  });
  return {context, calls};
}

test('the Rome asset fallback stays light enough for the scene’s dark text', () => {
  const {context, calls} = recordingContext();
  drawBackdrop(context, 375, 667, {bot: 530}, {scene: 'rome', colorScheme: 'light'});
  assert.ok(calls.some(call => call[0] === 'colorStop' && call[2] === '#efe8d9'));
  assert.ok(calls.some(call => call[0] === 'colorStop' && call[2] === 'rgba(246,240,227,.96)'));
  assert.ok(!calls.some(call => call[0] === 'colorStop' && call[2] === '#120d0a'));
});

test('selected places decode lazily, crop the chosen panel, and anchor every game and postcard size', async () => {
  const previousImage = globalThis.Image, requested = [];
  globalThis.Image = class {
    naturalWidth = 1619; naturalHeight = 971;
    decode(){ return Promise.resolve(); }
    set src(value){ this.url = value; requested.push(value); queueMicrotask(() => this.onload()); }
  };
  try {
    const selected = [
      {scene: 'tokyo', file: 'japan-options.jpg', panel: 0, table: .57, colorScheme: 'dark'},
      {scene: 'hogsmeade', file: 'hogsmeade-options.jpg', panel: 0, table: .664, colorScheme: 'dark'},
      {scene: 'rome', file: 'rome-options.jpg', panel: 0, table: .66, colorScheme: 'light'}
    ];
    for (const [index, place] of selected.entries()){
      assert.ok(SCENES.includes(place.scene));
      await loadSceneAssets(place);
      assert.equal(requested.length, index + 1, 'loading one scene decoded unrelated art');
      assert.ok(requested[index].endsWith('/assets/concepts/' + place.file));
      await loadSceneAssets(place);
      assert.equal(requested.length, index + 1, 'the same scene decoded again');
      for (const [w, h, bot] of [[375, 667, 530], [500, 876, 690], [630, 455, 405]]){
        const G = {bot}, {context, calls} = recordingContext();
        drawBackdrop(context, w, h, G, place, false);
        const imageCall = calls.find(call => call[0] === 'drawImage');
        assert.ok(imageCall, place.scene + ': selected art was not used');
        const [, image, sx, sy, sw, sh, dx, dy, dw, dh] = imageCall;
        assert.ok(image.url.endsWith('/assets/concepts/' + place.file));
        assert.equal(sx, place.panel * 1619 / 3 + 2);
        assert.equal(sy, 0); assert.equal(sw, 1619 / 3 - 4); assert.equal(sh, 971);
        const room = place.scene === 'hogsmeade';
        const expected = (room ? roomScenePlacement : memoryScenePlacement)(w, h, G, {width: sw, height: sh, table: place.table, topInset:0});
        assert.equal(dx, expected.x); assert.equal(dy, expected.y);
        assert.equal(dw, sw * expected.scale); assert.equal(dh, sh * expected.scale);
        assert.ok(dx <= 0 && dx + dw >= w, 'the scene left a horizontal seam');
        if (room){
          const foreground = calls.filter(call => call[0] === 'drawImage').at(-1);
          assert.equal(foreground[7] + foreground[9], h, 'the foreground left a vertical seam');
        } else {
          assert.ok(dy <= .00001 && dy + dh >= h - .00001, 'the scene left a vertical seam');
          assert.ok(Math.abs(dy + dh * place.table - Math.max(h * .4, bot - h * .08)) < .00001);
        }
        assert.ok(!calls.some(call => call[0] === 'colorStop'), 'an unshaded postcard gained a title wash');
      }
      const {context, calls} = recordingContext();
      drawBackdrop(context, 375, 667, {bot: 530}, place);
      const topWash = calls.find(call => call[0] === 'colorStop' && call[1] === 0);
      assert.equal(topWash[2], place.colorScheme === 'dark' ? 'rgba(16,27,23,.94)' : 'rgba(246,240,227,.96)');
    }
  } finally { globalThis.Image = previousImage; }
});
