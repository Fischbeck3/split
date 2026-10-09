import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dayParams} from '../site/js/core.js';
import {drawMark, drawTarget} from '../site/js/draw.js';
import {targetGeometry} from '../site/js/target.js';

function recordingContext(){
  const calls = [], values = {};
  const c = new Proxy(values, {
    get(target, key){
      if (key in target) return target[key];
      if (key === 'measureText') return () => ({width:70, actualBoundingBoxAscent:70, actualBoundingBoxDescent:0});
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
  const fill = calls.slice(fillStart), bar = fill.findIndex(call => call[0] === 'lineTo' && call[1] === 127 && call[2] === 200);
  assert.ok(bar >= 0); assert.deepEqual(fill[bar + 1], ['lineTo', 100.6, 200]);
  const edge = outline.findIndex(call => call[0] === 'lineTo' && call[1] === 127 && call[2] === 200);
  assert.deepEqual(outline[edge + 1], ['moveTo', 100.6, 200], 'no centered outline may rise above the filled crossbar');
  assert.ok(outline.some(call => call[0] === 'set' && call[1] === 'lineCap' && call[2] === 'butt'));
  assert.ok(!calls.some(call => call[0] === 'fillText' || call[0] === 'strokeText'));
});

test('the shared target renderer paints contrasting inward sights at the exact daily aim', () => {
  for (const num of [1,2,3,4,5,6]){
    const P = dayParams(num), G = {cx:187.5,top:170,bot:417,halfW:65,glass:P.theme.vessel};
    const aim = targetGeometry(G,P,P.theme), {c,calls} = recordingContext();
    drawTarget(c,G,P,P.theme);
    for (const side of [-1,1]){
      assert.ok(calls.some(call => call[0] === 'moveTo' && call[1] === G.cx + side * aim.notchInner && call[2] === aim.y));
      assert.ok(calls.some(call => call[0] === 'moveTo' && call[1] === G.cx + side * aim.notchOuter && call[2] === aim.y));
    }
    assert.ok(calls.some(call => call[0] === 'set' && call[1] === 'strokeStyle' && call[2] === '#17221b'));
    assert.ok(calls.some(call => call[0] === 'set' && call[1] === 'strokeStyle' && call[2] === '#fffaf0'));
  }
});
