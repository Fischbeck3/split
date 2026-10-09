import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as core from '../site/js/core.js';
import * as motion from '../site/js/motion.js';

const main = readFileSync(new URL('../site/js/main.js', import.meta.url), 'utf8');
const motionSetup = main.slice(main.indexOf('const motionQuery = '), main.indexOf('const S = '));
const sipStart = main.slice(main.indexOf('function begin(){'), main.indexOf('const wantsDrink = '));
const sipFrames = main.slice(main.indexOf('const wantsDrink = '), main.indexOf('function finish(now){'));
const holdInput = main.slice(main.indexOf('const down = '), main.indexOf('for (const target of '));

// Run the real hold controls, start path, and frame loop without a canvas or
// phone sensors. This browser still has the removed glass button's setting.
function holdApp({deviceReduced = false, previousMode = 'hold'} = {}){
  const P = core.dayParams(1), initial = core.makeDrinkState(P);
  const S = {P, theme:P.theme, mode:previousMode, state:'result', L:initial.level,
    L0:initial.level, drink:initial, motion:motion.makeMotionState(), last:1000,
    drawnAt:0, holding:false, holdStart:0, lockAt:0, practice:true,
    key:P.key, kind:'today', drained:false};
  let now = 1000;
  const elements = new Map();
  const localStorage = {
    getItem:key => key === 'split.motion.v1' ? 'reduced' : null,
    setItem(){ throw new Error('A held sip must not rewrite motion preferences.'); }
  };
  const $ = id => {
    if (!elements.has(id)) elements.set(id, {hidden:true, disabled:true, textContent:'',
      title:'', attributes:{}, setAttribute(name, value){ this.attributes[name] = value; },
      focus(){ this.focused = true; }, classList:{add(){}, remove(){}}});
    return elements.get(id);
  };
  const context = vm.createContext({...core, ...motion, S, $, Math,
    window:{localStorage, matchMedia:() => ({matches:deviceReduced, addEventListener(){}})},
    document:{hidden:false}, performance:{now:() => now}, requestAnimationFrame(){},
    refreshDayStatus(){}, canRecordChallenge:() => true, gameProperties:() => ({}),
    analytics:{capture(){}}, sound:{start(){}, stop(){}, update(){}}, draw(){},
    finish:() => { S.state = 'result'; },
    setPhase:phase => { S.state = phase; }, sipKind:() => 'Practice'});
  vm.runInContext(motionSetup + '\n' + sipStart + '\n' + sipFrames + '\n' + holdInput, context);
  const begin = () => vm.runInContext('begin();', context);
  const press = () => vm.runInContext('down({cancelable:true,preventDefault(){}});', context);
  const release = () => vm.runInContext('up();', context);
  const advance = frames => {
    for (let i = 0; i < frames; i++){
      now += 1000 / 60;
      context.frameTime = now;
      vm.runInContext('frame(frameTime);', context);
    }
  };
  return {S, initial, begin, press, release, advance, element:$};
}

test('holding the button tips the glass in frame despite its removed motion preference', () => {
  const app = holdApp();
  app.begin(); app.press(); app.advance(30);
  assert.equal(app.S.state, 'drinking');
  assert.ok(app.S.L > app.initial.level, 'holding consumes the real drink');
  assert.ok(app.S.motion.angle > 10, 'the rendered glass visibly tips');
  assert.equal(app.element('drinkControl').attributes['aria-pressed'], 'true');

  app.release();
  assert.equal(app.S.state, 'locked', 'release immediately starts settling');
  assert.equal(app.element('drinkControl').attributes['aria-pressed'], 'false');
  app.advance(60);
  assert.equal(app.S.state, 'result');
  assert.equal(app.S.motion.angle, 0, 'the glass returns upright before its result');
});

test('device reduced motion keeps a still glass and the same settled held sip', () => {
  const full = holdApp(), reduced = holdApp({deviceReduced:true});
  for (const app of [full, reduced]){
    app.begin(); app.press(); app.advance(30);
  }
  assert.ok(full.S.motion.angle > 10);
  assert.equal(reduced.S.motion.angle, 0);
  assert.equal(reduced.S.motion.lift, 0);
  for (const app of [full, reduced]){ app.release(); app.advance(60); }
  assert.equal(reduced.S.state, 'result');
  assert.equal(full.S.state, 'result');
  assert.equal(reduced.S.drink.level, full.S.drink.level, 'presentation cannot change the final drink amount');
  assert.equal(reduced.S.drink.velocity, 0);
  assert.equal(full.S.drink.velocity, 0);
});

test('another sip after a legacy tilt result starts with the visible hold control', () => {
  const app = holdApp({previousMode:'tilt'});
  app.begin();
  assert.equal(app.S.mode, 'hold');
  assert.equal(app.S.state, 'ready');
  assert.equal(app.element('drinkControl').hidden, false);
  assert.equal(app.element('drinkControl').disabled, false);
  assert.equal(app.element('drinkControl').focused, true);
  app.press(); app.advance(30);
  assert.equal(app.S.state, 'drinking');
  assert.ok(app.S.motion.angle > 10);
});
