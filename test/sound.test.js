import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSipSound} from '../site/js/sound.js';

function fakeAudio({resumeError, resumeDeferred, nodeError} = {}){
  const instances = [];
  class Param {
    value = 0;
    setValueAtTime(){}
    linearRampToValueAtTime(){}
    exponentialRampToValueAtTime(){}
  }
  class Node {
    constructor(kind, context){ this.kind = kind; this.context = context; this.gain = new Param(); this.frequency = new Param(); this.Q = new Param(); }
    connect(){}
    disconnect(){ this.disconnected = true; }
    start(at){ this.at = at; this.context.started.push(this); }
    stop(){ this.stopped = true; }
  }
  class Context {
    constructor(options){ this.options = options; this.state = 'suspended'; this.sampleRate = 24000; this.currentTime = 3; this.started = []; this.resumeCalls = 0; this.suspendCalls = 0; this.resumeDeferred = resumeDeferred; instances.push(this); }
    createGain(){ return new Node('gain', this); }
    createBiquadFilter(){ return new Node('filter', this); }
    createBuffer(channels, size){ return {getChannelData:() => new Float32Array(size)}; }
    createBufferSource(){ if (nodeError) throw new Error('Device removed'); return new Node('noise', this); }
    createOscillator(){ return new Node('body', this); }
    resume(){
      this.resumeCalls++;
      if (resumeError) return Promise.reject(resumeError);
      if (this.resumeDeferred) return this.resumeDeferred.then(() => { this.state = 'running'; });
      this.state = 'running'; return Promise.resolve();
    }
    suspend(){ this.suspendCalls++; this.state = 'suspended'; return Promise.resolve(); }
  }
  return {Context, instances};
}
const bottle = {vessel:'bottle'}, pint = {vessel:'tulip'}, stein = {vessel:'stein'};

test('sound is opt-in and silent play never constructs an audio context', () => {
  const {Context, instances} = fakeAudio(), sound = createSipSound({AudioContextClass:Context});
  sound.start(pint); sound.update(bottle, {drinking:true, elapsed:1}); sound.land(pint, {perfect:true}); sound.stop(); sound.suspend();
  assert.equal(sound.enabled, false);
  assert.equal(sound.supported, true);
  assert.equal(instances.length, 0);
});

test('explicit enabling starts browser resume in the gesture and reports success after readiness', async () => {
  let resolve;
  const deferred = new Promise(yes => { resolve = yes; });
  const {Context, instances} = fakeAudio({resumeDeferred:deferred}), changes = [];
  const sound = createSipSound({AudioContextClass:Context, onChange:value => changes.push(value)});
  const enabling = sound.setEnabled(true);
  assert.equal(instances.length, 1);
  assert.equal(instances[0].resumeCalls, 1, 'resume begins without awaiting another task');
  assert.equal(sound.enabled, false);
  resolve();
  assert.equal(await enabling, true);
  assert.deepEqual(changes, [true]);
  assert.equal(await sound.setEnabled(true), true);
  assert.equal(instances.length, 1, 'the same audio context is reused');
});

test('unsupported, throwing and rejected audio contexts fail without breaking play', async () => {
  const denied = fakeAudio({resumeError:new Error('Gesture denied')});
  for (const AudioContextClass of [null, class { constructor(){ throw new Error('Unavailable'); } }, denied.Context]){
    const sound = createSipSound({AudioContextClass});
    assert.equal(await sound.setEnabled(true), false);
    assert.equal(sound.enabled, false);
    sound.start(bottle);
    assert.equal(sound.update(bottle, {drinking:true, elapsed:0.2}), false);
    assert.equal(sound.land(pint), false);
  }
});

test('turning sound off wins over an in-flight activation and stops all voices', async () => {
  let resolve;
  const deferred = new Promise(yes => { resolve = yes; });
  const {Context, instances} = fakeAudio({resumeDeferred:deferred}), sound = createSipSound({AudioContextClass:Context});
  const enabling = sound.setEnabled(true);
  assert.equal(await sound.setEnabled(false), false);
  resolve(); assert.equal(await enabling, false);
  assert.equal(sound.enabled, false);
  assert.equal(instances[0].state, 'suspended');

  assert.equal(await sound.setEnabled(true), true);
  sound.start(bottle); sound.update(bottle, {drinking:true, elapsed:0.2});
  const sources = instances[0].started;
  assert.ok(sources.length > 0);
  await sound.setEnabled(false);
  assert.ok(sources.every(source => source.stopped && source.disconnected));
  assert.equal(sound.update(bottle, {drinking:true, elapsed:0.8}), false);
});

test('repeated enable requests share one pending resume without suspending the latest request', async () => {
  let resolve;
  const deferred = new Promise(yes => { resolve = yes; });
  const {Context, instances} = fakeAudio({resumeDeferred:deferred}), sound = createSipSound({AudioContextClass:Context});
  const first = sound.setEnabled(true), latest = sound.setEnabled(true);
  assert.equal(instances[0].resumeCalls, 1);
  resolve();
  assert.equal(await first, false);
  assert.equal(await latest, true);
  assert.equal(sound.enabled, true);
  assert.equal(instances[0].state, 'running');
});

test('bottle sounds cross the liquid pulse once and drop missed cycles rather than bursting', async () => {
  const {Context, instances} = fakeAudio(), sound = createSipSound({AudioContextClass:Context});
  await sound.setEnabled(true); sound.start(bottle);
  for (const elapsed of [0, 0.05, 0.14]) assert.equal(sound.update(bottle, {drinking:true, elapsed}), false);
  assert.equal(sound.update(bottle, {drinking:true, elapsed:0.15}), true);
  const oneGlug = instances[0].started.length;
  for (const elapsed of [0.15, 0.3, 0.7, 0.1]) assert.equal(sound.update(bottle, {drinking:true, elapsed}), false);
  assert.equal(instances[0].started.length, oneGlug);
  assert.equal(sound.update(bottle, {drinking:false, elapsed:0.8}), false);
  assert.equal(sound.update(pint, {drinking:true, elapsed:0.8}), false);
  assert.equal(sound.update(bottle, {drinking:true, elapsed:8}), true);
  assert.equal(instances[0].started.length, oneGlug * 2, 'one late frame plays only one cue');
});

test('upright landing plays once per sip and each vessel has a distinct physical cue', async () => {
  const {Context, instances} = fakeAudio(), sound = createSipSound({AudioContextClass:Context});
  await sound.setEnabled(true);
  assert.equal(sound.land(pint), false, 'a saved result must not play a landing on load');
  const counts = [];
  for (const theme of [pint, bottle, stein]){
    sound.start(theme);
    const before = instances[0].started.length;
    assert.equal(sound.land(theme), true);
    assert.equal(sound.land(theme), false);
    assert.equal(sound.update(bottle, {drinking:true, elapsed:2}), false);
    counts.push(instances[0].started.length - before);
  }
  assert.deepEqual(counts, [2, 2, 3]);
  sound.start(pint);
  assert.equal(sound.land(pint, {perfect:true}), true);
  assert.equal(instances[0].started.at(-1).at, instances[0].currentTime + 0.10, 'a perfect split adds one quiet second rim click');
});

test('hiding the app stops tails and suspends audio, while a new input can resume the opted-in context', async () => {
  const {Context, instances} = fakeAudio(), changes = [], sound = createSipSound({AudioContextClass:Context, onChange:value => changes.push(value)});
  await sound.setEnabled(true); sound.start(stein); sound.land(stein);
  sound.suspend();
  assert.equal(sound.enabled, true, 'visibility does not silently change the sound preference');
  assert.equal(instances[0].state, 'suspended');
  assert.ok(instances[0].started.every(source => source.stopped && source.disconnected));
  sound.start(bottle);
  await Promise.resolve(); await Promise.resolve();
  assert.equal(instances[0].state, 'running');
  assert.equal(instances[0].resumeCalls, 2);
  assert.deepEqual(changes, [true]);
});

test('hiding during deferred activation keeps the sound preference but re-suspends when resume completes', async () => {
  let resolve;
  const deferred = new Promise(yes => { resolve = yes; });
  const {Context, instances} = fakeAudio({resumeDeferred:deferred}), changes = [];
  const sound = createSipSound({AudioContextClass:Context, onChange:value => changes.push(value)});
  const enabling = sound.setEnabled(true);
  sound.suspend(); resolve();
  assert.equal(await enabling, true);
  assert.equal(sound.enabled, true);
  assert.equal(instances[0].state, 'suspended', 'a late successful resume cannot leave a hidden page running');
  assert.deepEqual(changes, [true]);
  assert.equal(sound.update(bottle, {drinking:true, elapsed:0.2}), false);
  assert.equal(sound.land(pint), false);
  assert.equal(instances[0].started.length, 0);

  sound.start(bottle);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(instances[0].state, 'running', 'the next visible sip can resume the retained preference');
  assert.equal(sound.update(bottle, {drinking:true, elapsed:0.2}), true);
});

test('hiding during a deferred sip resume stops the sip and re-suspends its late completion', async () => {
  const {Context, instances} = fakeAudio(), changes = [];
  const sound = createSipSound({AudioContextClass:Context, onChange:value => changes.push(value)});
  await sound.setEnabled(true); sound.suspend();
  let resolve;
  instances[0].resumeDeferred = new Promise(yes => { resolve = yes; });
  sound.start(bottle);
  assert.equal(instances[0].resumeCalls, 2);
  sound.suspend(); resolve();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(instances[0].state, 'suspended');
  assert.equal(sound.enabled, true);
  assert.deepEqual(changes, [true], 'a visibility race must not flip the user’s preference');
  assert.equal(sound.update(bottle, {drinking:true, elapsed:0.2}), false);
  assert.equal(sound.land(bottle), false);
  assert.equal(instances[0].started.length, 0);

  sound.start(bottle);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(instances[0].state, 'running');
  assert.equal(sound.update(bottle, {drinking:true, elapsed:0.2}), true);
});

test('stop ends the sip so later animation frames cannot make more cues until new input', async () => {
  const {Context, instances} = fakeAudio(), sound = createSipSound({AudioContextClass:Context});
  await sound.setEnabled(true); sound.start(bottle);
  sound.update(bottle, {drinking:true, elapsed:0.2}); sound.stop();
  const count = instances[0].started.length;
  assert.equal(sound.update(bottle, {drinking:true, elapsed:0.8}), false);
  assert.equal(sound.land(bottle), false);
  assert.equal(instances[0].started.length, count);
  sound.start(bottle);
  assert.equal(sound.update(bottle, {drinking:true, elapsed:0.2}), true);
});

test('a removed output disables sound and notifies the toggle without throwing into the game loop', async () => {
  const {Context} = fakeAudio({nodeError:true}), changes = [], sound = createSipSound({AudioContextClass:Context, onChange:value => changes.push(value)});
  await sound.setEnabled(true); sound.start(bottle);
  assert.equal(sound.update(bottle, {drinking:true, elapsed:0.2}), false);
  assert.equal(sound.enabled, false);
  assert.deepEqual(changes, [true, false]);
});
