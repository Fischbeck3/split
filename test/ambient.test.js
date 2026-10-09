import {test} from 'node:test';
import assert from 'node:assert/strict';
import {memoryScenePlacement, memoryMotion, MEMORY_DETAILS} from '../site/js/ambient.js';
import {drawScene, loadSceneAssets} from '../site/js/draw.js';
import {dayParams, startLevel} from '../site/js/core.js';

function recordingContext(canvas = {}){
  const calls = [], values = {canvas, globalAlpha: 1};
  const context = new Proxy(values, {
    get(target, key){
      if (key in target) return target[key];
      if (key === 'createLinearGradient' || key === 'createRadialGradient') return (...args) => {
        calls.push([key, ...args]);
        return {addColorStop: (...stops) => calls.push(['colorStop', ...stops])};
      };
      return (...args) => calls.push([key, ...args]);
    },
    set(target, key, value){ target[key] = value; return true; }
  });
  return {context, calls};
}

test('all three static postcard scenes ignore the decorative wall clock', () => {
  for (const day of [1, 2, 3]){
    const P = dayParams(day), theme = P.theme, G = {cx: 200, top: 170, bot: 460, halfW: 78, glass: theme.vessel};
    const options = {G, w: 400, h: 700, L: startLevel(theme), theme, P, bubbles: false, titleWash: false};
    const still = recordingContext(), later = recordingContext();
    drawScene(still.context, {...options, now: 0});
    drawScene(later.context, {...options, now: 49127});
    assert.deepEqual(later.calls, still.calls, theme.id + ': export changed with time');
  }
});

test('scene framing covers portrait and wide canvases without moving the tabletop anchor', () => {
  for (const table of [.606, .627, .636]){
    for (const [w, h, bot] of [[375, 667, 417], [500, 876, 582], [1200, 630, 530]]){
      const art = {width: 1024, height: 1536, table}, placement = memoryScenePlacement(w, h, {bot}, art);
      assert.ok(placement.x <= .00001 && placement.x + 1024 * placement.scale >= w - .00001);
      assert.ok(placement.y <= .00001 && placement.y + 1536 * placement.scale >= h - .00001);
      assert.ok(Math.abs(placement.y + 1536 * table * placement.scale - Math.max(h * .4, bot - h * .08)) < .00001);
    }
  }
});

test('atmosphere remains bounded across a long session and ignores invalid clocks', () => {
  for (let now = 0; now < 1000 * 60 * 60 * 24; now += 7919){
    const state = memoryMotion(now);
    assert.ok(state.firelight >= .1 && state.firelight <= .9);
    for (const key of ['flame', 'surf', 'breeze']) assert.ok(Math.abs(state[key]) <= 1);
  }
  for (const now of [NaN, Infinity, -100]) assert.deepEqual(memoryMotion(now), memoryMotion(0));
});

test('moving image details reuse their patches and preserve the input drink and vessel', async () => {
  const oldImage = globalThis.Image, oldDocument = globalThis.document;
  let patchBuilds = 0;
  globalThis.Image = class {
    naturalWidth = 1024; naturalHeight = 1536;
    decode(){ return Promise.resolve(); }
    set src(value){ queueMicrotask(() => this.onload()); }
  };
  globalThis.document = {createElement(){
    patchBuilds++;
    const canvas = {};
    canvas.getContext = () => recordingContext(canvas).context;
    return canvas;
  }};
  try {
    await loadSceneAssets();
    for (const day of [1, 2, 3]){
      const P = dayParams(day), theme = P.theme, G = {cx: 200, top: 170, bot: 460, halfW: 78, glass: theme.vessel};
      const options = {G, w: 400, h: 700, L: startLevel(theme), theme, P, bubbles: false, ambient: true, backdrop: {width: 800, height: 1400}};
      const original = structuredClone({G, P, L: options.L});
      const a = recordingContext(), b = recordingContext();
      const before = patchBuilds;
      drawScene(a.context, {...options, now: 0});
      const after = patchBuilds;
      assert.equal(after - before, MEMORY_DETAILS[theme.scene].length);
      drawScene(b.context, {...options, now: 2400});
      assert.equal(patchBuilds, after, 'a frame rebuilt the backdrop patches');
      assert.notDeepEqual(a.calls, b.calls, theme.id + ': opted-in scene has no motion');
      assert.deepEqual({G, P, L: options.L}, original, 'decoration mutated a gameplay input');
    }
  } finally {
    globalThis.Image = oldImage;
    globalThis.document = oldDocument;
  }
});
