import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {dayParams} from '../site/js/core.js';
import {renderVessel, renderWidthAt} from '../site/js/render-vessels.js';
import {getLiquidSurface} from '../site/js/liquid.js';
import {drawMark, drawTarget, drawTargetLine, drawScene} from '../site/js/draw.js';
import {targetGeometry} from '../site/js/target.js';
import {physicalGlassParams} from './fixtures/physical-glasses.js';
import {GUINNESS_PRINT} from '../site/js/brand-marks.js';
import {loadBrandAssets, guinnessPrintImage} from '../site/js/brand-assets.js';

function recordingContext(){
  const calls = [], values = {};
  const c = new Proxy(values, {
    get(target, key){
      if (key in target) return target[key];
      if (key === 'measureText') return () => ({width:70, actualBoundingBoxAscent:70, actualBoundingBoxDescent:0});
      if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => ({addColorStop(){}});
      return (...args) => calls.push([key, ...args]);
    },
    set(target, key, value){ target[key] = value; calls.push(['set', key, value]); return true; }
  });
  return {c, calls};
}

test('the fallback Guinness G crossbar starts at the scored line without relying on font metrics', () => {
  const {c, calls} = recordingContext(), theme = dayParams(1).theme;
  c.measureText = () => { throw new Error('The G must not depend on font metrics'); };
  drawMark(c, theme, 100, 200, 60);
  const stroke = calls.findIndex(call => call[0] === 'stroke'), outline = calls.slice(0,stroke);
  const fillStart = calls.findIndex((call,index) => index > stroke && call[0] === 'beginPath');
  assert.ok(calls.some(call => call[0] === 'translate' && call[1] === 100 && call[2] === 200));
  assert.ok(calls.some(call => call[0] === 'scale' && call[1] === 60 && call[2] === 60));
  const fill = calls.slice(fillStart), bar = fill.findIndex(call => call[0] === 'lineTo' && call[1] === .46 && call[2] === 0);
  assert.ok(bar >= 0); assert.deepEqual(fill[bar + 1], ['lineTo', .005, 0]);
  const edge = outline.findIndex(call => call[0] === 'lineTo' && call[1] === .46 && call[2] === 0);
  assert.deepEqual(outline[edge + 1], ['moveTo', .005, 0], 'no centered outline may rise above the filled crossbar');
  assert.ok(outline.some(call => call[0] === 'set' && call[1] === 'lineCap' && call[2] === 'butt'));
  assert.ok(!calls.some(call => call[0] === 'fillText' || call[0] === 'strokeText'));
});

// Follow the source wordmark's path to its unique horizontal G crossbar.
// Arc flags are single digits, even when the source omits separating spaces.
function sourceCrossbarY(path){
  const arity = {m:2,l:2,h:1,v:1,c:6,s:4,q:4,t:2,a:7};
  let index = 0, command, x = 0, y = 0, startX = 0, startY = 0;
  const skip = () => { while (/[\s,]/.test(path[index] || 'x')) index++; };
  const number = flag => {
    skip();
    const token = flag ? /^[01]/.exec(path.slice(index))
      : /^[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/.exec(path.slice(index));
    assert.ok(token,'invalid source wordmark coordinate');
    index += token[0].length; return Number(token[0]);
  };
  while (index < path.length){
    skip(); if (index >= path.length) break;
    if (/[a-z]/i.test(path[index])) command = path[index++];
    const lower = command.toLowerCase(), relative = lower === command;
    if (lower === 'z'){ x = startX; y = startY; command = null; continue; }
    assert.ok(arity[lower],'unsupported source wordmark path command');
    const args = Array.from({length:arity[lower]}, (_, i) => number(lower === 'a' && (i === 3 || i === 4)));
    if (lower === 'h' && relative && args[0] === 5.143) return y;
    if (lower === 'h') x = relative ? x + args[0] : args[0];
    else if (lower === 'v') y = relative ? y + args[0] : args[0];
    else {
      x = relative ? x + args.at(-2) : args.at(-2);
      y = relative ? y + args.at(-1) : args.at(-1);
      if (lower === 'm'){ startX = x; startY = y; command = relative ? 'l' : 'L'; }
    }
  }
  assert.fail('source wordmark has no identifiable G crossbar');
}

test('the decoded complete Guinness print aligns its real source G crossbar in game and postcard renders', async () => {
  const source = await readFile(new URL('../site/assets/brands/guinness-glass-print.svg',import.meta.url),'utf8');
  const viewBox = /viewBox="([^"]+)"/.exec(source)[1].split(/\s+/).map(Number);
  const wordmark = /<path\s+fill="#[^"]+"\s+d="([^"]+)"/.exec(source)[1];
  const actualBarY = sourceCrossbarY(wordmark), {width,height,top,barY} = GUINNESS_PRINT;
  assert.deepEqual(viewBox,[0,top,width,height]);
  assert.ok(Math.abs(actualBarY - barY) < 1e-9,'render metric no longer matches the painted source crossbar');
  const previousImage = globalThis.Image;
  globalThis.Image = class {
    decode(){ return Promise.resolve(); }
    set src(value){ this.url = value; queueMicrotask(() => this.onload()); }
  };
  try {
    const image = await loadBrandAssets({id:'pub'});
    assert.ok(image); assert.equal(guinnessPrintImage(),image);
    const P = dayParams(1), {c,calls} = recordingContext();
    c.measureText = () => { throw new Error('The glass print must not depend on font metrics'); };
    drawMark(c,P.theme,100,200,60);
    const prints = calls.filter(call => call[0] === 'drawImage' && call[1] === image);
    assert.equal(prints.length,1,'a duplicate Guinness print was painted');
    const [, ,dx,dy,dw,dh] = prints[0];
    assert.equal(dx,-dw / 2); assert.equal(dw / dh,width / height,'the print aspect was distorted');
    assert.ok(Math.abs(200 + 60 * (dy + (actualBarY - top) / height * dh) - 200) < 1e-9,
      'the actual source G crossbar missed the scored height');
    assert.ok(!calls.some(call => call[0] === 'fillText' || call[0] === 'strokeText'));
    for (const G of [
      {cx:187.5,top:170,bot:417,halfW:65,glass:renderVessel(P.theme)},
      {cx:500,top:48,bot:690,halfW:190,glass:renderVessel(P.theme)}
    ]){
      const before = structuredClone({P,G}), recorded = recordingContext(), aim = targetGeometry(G,P,P.theme);
      drawScene(recorded.c,{G,w:G.cx * 2,h:G.bot + 80,L:P.markY,theme:P.theme,P,bubbles:false,titleWash:false,backdrop:{}});
      const printIndex = recorded.calls.findIndex(call => call[0] === 'drawImage' && call[1] === image);
      assert.ok(printIndex >= 0,'scene omitted the decoded glass print');
      assert.equal(recorded.calls.filter(call => call[0] === 'drawImage' && call[1] === image).length,1);
      const preceding = recorded.calls.slice(0,printIndex);
      assert.deepEqual(preceding.findLast(call => call[0] === 'translate'),['translate',G.cx,aim.y]);
      assert.deepEqual(preceding.findLast(call => call[0] === 'scale'),['scale',aim.markHeight,aim.markHeight]);
      assert.ok(!recorded.calls.some(call => call[0] === 'fillText' && call[1] === 'GUINNESS'),
        'old lower wordmark remained beside the complete print');
      assert.deepEqual({P,G},before,'brand rendering changed the frozen pour or vessel');
    }
  } finally { globalThis.Image = previousImage; }
});

test('Corona clipping, lip and tilted beer surface use the same display outline', () => {
  const P = physicalGlassParams('beach'), G = {cx:187.5,top:170,bot:417,halfW:65,glass:renderVessel(P.theme)};
  const before = structuredClone({P,G}), motion = {angle:24,liquidAngle:0,lift:.025,activity:0};
  const L = .36, gh = G.bot - G.top;
  const surface = getLiquidSurface({vessel:G.glass,level:L,aspect:G.halfW / gh,vesselAngle:motion.angle,liquidAngle:motion.liquidAngle});
  const {c,calls} = recordingContext();
  drawScene(c,{G,w:375,h:667,L,theme:P.theme,P,motion,bubbles:false,ambient:false,backdrop:{},titleWash:false});
  assert.ok(calls.some(call => call[0] === 'translate' && call[1] === G.cx && call[2] === G.top + surface.centerLevel * gh), 'beer used a different shape from the bottle clip');
  assert.ok(calls.some(call => call[0] === 'moveTo' && call[1] === G.cx - renderWidthAt(G.glass,0) * G.halfW && call[2] === G.top), 'bottle clipping did not use its display mouth');
  for (const depth of [.015,.038]){
    assert.ok(calls.some(call => call[0] === 'ellipse' && call[1] === G.cx && call[2] === G.top + gh * depth && call[3] === renderWidthAt(G.glass,depth) * G.halfW * .93), 'lip was sized against the old bottle');
  }
  assert.deepEqual({P,G},before,'rendering changed the frozen pour or supplied geometry');
});

test('a target line is absent by default, including static postcard renders', () => {
  for (const num of [1,2]){
    const P = dayParams(num), G = {cx:187.5,top:170,bot:417,halfW:65,glass:renderVessel(P.theme)};
    const {c,calls} = recordingContext();
    drawTarget(c,G,P,P.theme);
    assert.ok(!calls.some(call => call[0] === 'setLineDash'));
    for (const opacity of [0,-1,NaN,Infinity]){
      const recorded = recordingContext(); drawTargetLine(recorded.c,G,P,P.theme,opacity);
      assert.equal(recorded.calls.length,0);
    }
  }
});

test('the brief dashed cue crosses the exact score line and restores drawing state', () => {
  for (const num of [1,2,3,4,5,6]){
    const P = dayParams(num), G = {cx:187.5,top:170,bot:417,halfW:65,glass:renderVessel(P.theme)};
    const aim = targetGeometry(G,P,P.theme), {c,calls} = recordingContext();
    drawTargetLine(c,G,P,P.theme,.5);
    assert.deepEqual(calls[0],['save']);
    assert.deepEqual(calls.at(-1),['restore']);
    assert.ok(calls.some(call => call[0] === 'moveTo' && call[1] === G.cx - aim.lineHalfWidth && call[2] === aim.y));
    assert.ok(calls.some(call => call[0] === 'lineTo' && call[1] === G.cx + aim.lineHalfWidth && call[2] === aim.y));
    assert.ok(calls.some(call => call[0] === 'setLineDash' && call[1][0] > 0 && call[1][1] > 0));
    assert.ok(calls.some(call => call[0] === 'set' && call[1] === 'globalAlpha' && call[2] === .5));
    assert.ok(!calls.some(call => call[0] === 'fill'),'no permanent aiming arrow should remain');
  }
});
