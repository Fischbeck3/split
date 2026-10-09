import {test} from 'node:test';
import assert from 'node:assert/strict';
import {drawBrandMark} from '../site/js/brand-marks.js';
import {themeById} from '../site/js/core.js';
import {CONCEPT_CHAPTERS} from '../site/js/concepts.js';

function recordingCanvas(captionMetrics = {width:69.5, actualBoundingBoxLeft:38, actualBoundingBoxRight:31.5, actualBoundingBoxAscent:8.2, actualBoundingBoxDescent:1.4}){
  const calls = [], stack = [];
  const initial = {fillStyle:'original-fill', strokeStyle:'original-stroke', lineWidth:3, lineCap:'butt', lineJoin:'miter', font:'16px serif', textAlign:'start', textBaseline:'alphabetic'};
  const state = {...initial};
  const c = new Proxy(state, {
    get(target,key){
      if (Object.hasOwn(target,key)) return target[key];
      if (key === 'save') return () => { calls.push(['save']); stack.push({...state}); };
      if (key === 'restore') return () => {
        assert.ok(stack.length, 'restored a canvas state that was never saved');
        calls.push(['restore']);
        Object.assign(state,stack.pop());
      };
      if (key === 'measureText') return text => {
        calls.push(['measureText',text]);
        const size = Number(state.font.match(/([\d.]+)px/)[1]);
        return Object.fromEntries(Object.entries(captionMetrics).map(([metric,value]) => [metric,value * size / 11.2]));
      };
      return (...args) => {
        for (const arg of args) if (typeof arg === 'number') assert.ok(Number.isFinite(arg), key + ': nonfinite canvas argument');
        calls.push([key,...args]);
      };
    },
    set(target,key,value){ target[key] = value; return true; }
  });
  return {c,calls,state,initial,stack};
}

test('every released and studio drink carries its brand while leaving the surrounding canvas intact', () => {
  const released = ['pub','beach','munich','sapporo','butterbeer','peroni'].map(themeById);
  const concepts = CONCEPT_CHAPTERS.flatMap(chapter => chapter.options.map(option => option.theme));
  assert.equal(concepts.length,9);
  for (const theme of [...released,...concepts]){
    const {c,calls,state,initial,stack} = recordingCanvas();
    assert.equal(drawBrandMark(c,theme,187.5,360,55),true,theme.id);
    assert.ok(calls.some(call => call[0] === 'fill'),theme.id + ': missing brand paint');
    assert.equal(stack.length,0,theme.id + ': leaked canvas state');
    assert.deepEqual(state,initial,theme.id + ': changed the following vessel paint');
  }
});

test('Hogwarts caption sits on the parchment and its H crossbar stays at the scored origin', () => {
  // Real fonts can have unequal left/right ink and unequal ascent/descent.
  // Text advance centering is not sufficient to align this small printed label.
  const metrics = {width:69.5, actualBoundingBoxLeft:38, actualBoundingBoxRight:31.5, actualBoundingBoxAscent:8.2, actualBoundingBoxDescent:1.4};
  for (const [cx,cy,h] of [[187.5,360,55],[160,245,26],[490,330,123]]){
    const {c,calls} = recordingCanvas(metrics);
    drawBrandMark(c,themeById('butterbeer'),cx,cy,h);
    const caption = calls.find(call => call[0] === 'fillText' && call[1] === 'HOGWARTS');
    assert.ok(caption,'the school name is missing');
    const bannerStart = calls.findIndex(call => call[0] === 'moveTo' && call[1] === -.62 && call[2] === -.60);
    assert.ok(bannerStart >= 0,'the caption parchment is missing');
    const bannerEnd = calls.findIndex((call,index) => index > bannerStart && call[0] === 'closePath');
    const centerEdges = calls.slice(bannerStart,bannerEnd).filter(call => call[0] === 'lineTo' && call[1] === 0).map(call => call[2]);
    assert.equal(centerEdges.length,2,'the banner must have a top and bottom at the caption center');
    const bannerTop = Math.min(...centerEdges), bannerBottom = Math.max(...centerEdges);
    const transforms = [], state = {sx:1,sy:1,x:0,y:0};
    let captionInk, crossbar;
    for (const call of calls){
      const [kind,...args] = call;
      if (kind === 'save') transforms.push({...state});
      else if (kind === 'restore') Object.assign(state,transforms.pop());
      else if (kind === 'translate'){ state.x += args[0] * state.sx; state.y += args[1] * state.sy; }
      else if (kind === 'scale'){ state.sx *= args[0]; state.sy *= args[1]; }
      else if (kind === 'fillText' && args[0] === 'HOGWARTS'){
        const x = state.x + args[1] * state.sx, y = state.y + args[2] * state.sy;
        captionInk = {left:x - metrics.actualBoundingBoxLeft * state.sx,right:x + metrics.actualBoundingBoxRight * state.sx,
          top:y - metrics.actualBoundingBoxAscent * state.sy,bottom:y + metrics.actualBoundingBoxDescent * state.sy};
      } else if (kind === 'fillRect' && args[0] === -.075 && args[1] === -.024 && args[2] === .15 && args[3] === .048){
        crossbar = {x:state.x + (args[0] + args[2] / 2) * state.sx,y:state.y + (args[1] + args[3] / 2) * state.sy};
      }
    }
    assert.ok(captionInk && crossbar);
    const epsilon = 1e-9;
    assert.ok(Math.abs((captionInk.left + captionInk.right) / 2 - cx) < epsilon,'school name ink is horizontally off center');
    assert.ok(Math.abs((captionInk.top + captionInk.bottom) / 2 - (cy - .575 * h)) < epsilon,'school name ink is vertically off center');
    assert.ok(captionInk.top >= cy + bannerTop * h - epsilon,'school name ink extends above its parchment');
    assert.ok(captionInk.bottom <= cy + bannerBottom * h + epsilon,'school name ink extends below its parchment');
    assert.ok(Math.abs(crossbar.x - cx) < epsilon && Math.abs(crossbar.y - cy) < epsilon,'the H crossbar moved away from the scored line');
  }
});

test('generic glasses and invalid geometry fall through without painting or changing the canvas', () => {
  const {c,calls,state,initial,stack} = recordingCanvas();
  for (const theme of [{id:'lager',name:'Lager'},{id:'constructor'},{id:'toString'},null]){
    assert.equal(drawBrandMark(c,theme,0,0,55),false);
  }
  for (const geometry of [[0,0,0],[0,0,-10],[0,0,NaN],[Infinity,0,55],[0,NaN,55]]){
    assert.equal(drawBrandMark(c,{id:'pub'},...geometry),false);
  }
  assert.equal(calls.length,0); assert.equal(stack.length,0); assert.deepEqual(state,initial);
});
