import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dayParams} from '../site/js/core.js';
import {renderVessel, renderWidthAt} from '../site/js/render-vessels.js';
import {getLiquidSurface} from '../site/js/liquid.js';
import {drawMark, drawTarget, drawTargetLine, drawScene} from '../site/js/draw.js';
import {targetGeometry} from '../site/js/target.js';

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

test('the Guinness G crossbar starts at the scored line without relying on font metrics', () => {
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

test('Corona clipping, lip and tilted beer surface use the same display outline', () => {
  const P = dayParams(2), G = {cx:187.5,top:170,bot:417,halfW:65,glass:renderVessel(P.theme)};
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
