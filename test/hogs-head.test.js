import {test} from 'node:test';
import assert from 'node:assert/strict';
import {roomScenePlacement} from '../site/js/ambient.js';
import {drawBackdrop, loadSceneAssets, SCENE_ART} from '../site/js/draw.js';
import {themeById} from '../site/js/core.js';

test('Hog’s Head keeps its boar visible above the foreground on phones and postcards', () => {
  const art = {width: 1619 / 3 - 4, height: 971, table: .664};
  // Traced from the selected artwork: boar face on the right wall.
  const face = {x: 404, y: 210};
  for (const [w, h, bot] of [[320,568,252], [375,750,375], [560,800,446], [1000,750,690]]){
    const G = Object.freeze({bot});
    const placement = roomScenePlacement(w, h, G, art);
    const x = placement.x + face.x * placement.scale, y = placement.y + face.y * placement.scale;
    assert.ok(x > w * .6 && x < w, 'the boar was cropped out of the right wall');
    assert.ok(y > h * .14 && y < placement.tableY - 24, 'the foreground or title hid the boar');
    assert.ok(placement.x <= 0 && placement.x + art.width * placement.scale >= w);
    assert.ok(placement.y + art.height * art.table * placement.scale >= placement.tableY);
    assert.equal(placement.tableY, Math.max(h * .4, bot - h * .08));
  }
});

test('Hog’s Head backdrop uses only its selected panel and fills the foreground to the bottom', async () => {
  const originalImage = globalThis.Image;
  globalThis.Image = class {
    naturalWidth = 1619; naturalHeight = 971;
    decode(){ return Promise.resolve(); }
    set src(value){ queueMicrotask(() => this.onload()); }
  };
  try {
    const theme = themeById('butterbeer');
    await loadSceneAssets(theme);
    const calls = [], context = {drawImage: (...args) => calls.push(args), fillRect(){}, save(){}, restore(){}};
    const G = Object.freeze({bot:375});
    drawBackdrop(context, 375, 750, G, theme, false);
    assert.equal(SCENE_ART.hogsmeade.panel, 0);
    assert.equal(calls[0][6], 0, 'the unshaded postcard has an empty strip above the room');
    for (const [,sx,,sw] of calls){
      assert.equal(sx, 2);
      assert.ok(sx + sw < 1619 / 3, 'neighboring scene pixels leaked into the backdrop');
    }
    const last = calls.at(-1);
    assert.equal(last[5], 0);
    assert.equal(last[7], 375);
    assert.equal(last[6] + last[8], 750, 'the foreground leaves blank canvas');
    assert.equal(G.bot, 375);
  } finally { globalThis.Image = originalImage; }
});
