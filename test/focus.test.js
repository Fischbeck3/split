import test from 'node:test';
import assert from 'node:assert/strict';
import {focusedGlassBox, interpolateGlassBox} from '../site/js/focus.js';

test('foreground focus enlarges the same vessel within the readable play area', () => {
  for (const {w,h,top,bot,floor} of [
    {w:375,h:750,top:195,bot:468,floor:510},
    {w:320,h:568,top:136,bot:330,floor:346},
    {w:560,h:800,top:208,bot:510,floor:578}
  ]){
    for (const vessel of ['tulip','bottle','stein']){
      const G = {cx:w/2,top,bot,halfW:(bot-top)*.26,glass:vessel}, original = {...G};
      const focus = focusedGlassBox(G,{w,h,floor,vessel});
      assert.ok(focus.halfW > G.halfW, `${w} ${vessel}: focus should be closer`);
      assert.ok(focus.top >= (h<650?132:164)-1e-9);
      assert.ok(focus.bot <= floor);
      assert.equal(focus.glass,G.glass);
      assert.equal(focus.cx,G.cx);
      assert.deepEqual(G,original,'focus cannot alter the base geometry');
      assert.deepEqual(interpolateGlassBox(G,focus,0),G);
      assert.deepEqual(interpolateGlassBox(G,focus,1),focus);
      const mid=interpolateGlassBox(G,focus,.5);
      assert.ok(mid.halfW > G.halfW && mid.halfW < focus.halfW);
    }
  }
});
