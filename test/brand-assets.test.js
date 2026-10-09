import {test} from 'node:test';
import assert from 'node:assert/strict';

let moduleNumber = 0;
async function freshAssets(){ return import('../site/js/brand-assets.js?test=' + ++moduleNumber); }

test('the same local Guinness print decodes once before becoming available to game or export', async () => {
  const previousImage = globalThis.Image, requested = [];
  let finishDecode, decodeCount = 0;
  globalThis.Image = class {
    decode(){ decodeCount++; return new Promise(resolve => { finishDecode = resolve; }); }
    set src(value){ requested.push(value); this.onload(); }
  };
  try {
    const {loadBrandAssets, guinnessPrintImage} = await freshAssets();
    const loading = loadBrandAssets({id:'pub'}), parallel = loadBrandAssets();
    let ready = false; loading.then(() => { ready = true; });
    await Promise.resolve();
    assert.equal(ready,false,'the scene was declared ready before print decoding finished');
    assert.equal(guinnessPrintImage(),null,'undecoded print reached canvas drawing');
    assert.equal(requested.length,1); assert.equal(decodeCount,1);
    const expected = new URL('../site/assets/brands/guinness-glass-print.svg',import.meta.url).href;
    assert.equal(requested[0],expected,'brand print must stay on the same local asset origin');
    finishDecode();
    const [image, same] = await Promise.all([loading,parallel]);
    assert.ok(image); assert.equal(same,image); assert.equal(guinnessPrintImage(),image);
    assert.equal(await loadBrandAssets({id:'pub'}),image);
    assert.equal(requested.length,1); assert.equal(decodeCount,1);
  } finally { globalThis.Image = previousImage; }
});

test('other drinks leave the Guinness print unrequested', async () => {
  const previousImage = globalThis.Image;
  globalThis.Image = class { constructor(){ throw new Error('An unrelated drink requested brand art'); } };
  try {
    const {loadBrandAssets, guinnessPrintImage} = await freshAssets();
    for (const id of ['beach','munich','peroni','sapporo','butterbeer','concept-peroni']){
      assert.equal(await loadBrandAssets({id}),null);
    }
    assert.equal(guinnessPrintImage(),null);
  } finally { globalThis.Image = previousImage; }
});

test('a failed print request resolves safely and is not retried during the session', async () => {
  const previousImage = globalThis.Image;
  let requested = 0;
  globalThis.Image = class { set src(value){ requested++; this.onerror(); } };
  try {
    const {loadBrandAssets, guinnessPrintImage} = await freshAssets();
    assert.equal(await loadBrandAssets({id:'pub'}),null);
    assert.equal(await loadBrandAssets({id:'pub'}),null);
    assert.equal(guinnessPrintImage(),null); assert.equal(requested,1);
  } finally { globalThis.Image = previousImage; }
});

test('a failed decode leaves the vector fallback available', async () => {
  const previousImage = globalThis.Image;
  globalThis.Image = class {
    decode(){ return Promise.reject(new Error('Invalid print')); }
    set src(value){ this.onload(); }
  };
  try {
    const {loadBrandAssets, guinnessPrintImage} = await freshAssets();
    assert.equal(await loadBrandAssets({id:'pub'}),null);
    assert.equal(guinnessPrintImage(),null);
  } finally { globalThis.Image = previousImage; }
});

test('scene readiness waits for the glass print as well as its backdrop', async () => {
  const previousImage = globalThis.Image, requested = [];
  let finishPrint;
  globalThis.Image = class {
    decode(){
      return this.url.endsWith('/brands/guinness-glass-print.svg')
        ? new Promise(resolve => { finishPrint = resolve; }) : Promise.resolve();
    }
    set src(value){ this.url = value; requested.push(value); this.onload(); }
  };
  try {
    const {loadSceneAssets} = await import('../site/js/draw.js?brand-readiness');
    const loading = loadSceneAssets({id:'pub',scene:'pub'});
    let ready = false; loading.then(() => { ready = true; });
    await Promise.resolve();
    assert.equal(ready,false,'backdrop readiness skipped the pending glass print');
    assert.equal(requested.length,2);
    assert.ok(requested.some(url => url.endsWith('/scenes/irish-pub.webp')));
    assert.ok(requested.some(url => url.endsWith('/brands/guinness-glass-print.svg')));
    finishPrint(); await loading;
    assert.equal(ready,true);
  } finally { globalThis.Image = previousImage; }
});
