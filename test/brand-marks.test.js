import {test} from 'node:test';
import assert from 'node:assert/strict';
import {drawBrandMark} from '../site/js/brand-marks.js';
import {themeById} from '../site/js/core.js';
import {CONCEPT_CHAPTERS} from '../site/js/concepts.js';

function recordingCanvas(){
  const calls = [], stack = [];
  const initial = {fillStyle:'original-fill', strokeStyle:'original-stroke', lineWidth:3, lineCap:'butt', lineJoin:'miter', font:'16px serif', textAlign:'start', textBaseline:'alphabetic'};
  const state = {...initial};
  const c = new Proxy(state, {
    get(target,key){
      if (Object.hasOwn(target,key)) return target[key];
      if (key === 'save') return () => stack.push({...state});
      if (key === 'restore') return () => {
        assert.ok(stack.length, 'restored a canvas state that was never saved');
        Object.assign(state,stack.pop());
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
