import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {LAUNCH, RECORD_RUN} from '../site/js/config.js';
import {dayParams, scoreFromOffset, PERFECT} from '../site/js/core.js';
import {canRecordChallenge} from '../site/js/challenge.js';
import {gameProperties} from '../site/js/analytics.js';

// Run the actual app storage functions and completion path against shared
// browser storage, without constructing the canvas or wiring input controls.
const main = readFileSync(new URL('../site/js/main.js', import.meta.url), 'utf8');
const storeSource = main.match(/^const STORE = .+;$/m)[0];
const storageSource = main.slice(main.indexOf('function load(){'), main.indexOf('// ---------- layout and drawing ----------'));
const finishSource = main.slice(main.indexOf('function finish(now){'), main.indexOf('// ---------- results and sharing ----------'));
const P = dayParams(1), legacyKey = 'split.v1:' + LAUNCH;
const playDate = new Date(LAUNCH + 'T12:00:00');
class PlayDate extends Date {
  constructor(...args){ super(...(args.length ? args : [playDate.getTime()])); }
}

function browserStorage(){
  const existing = new Map([
    [legacyKey, JSON.stringify({days:{[P.key]:{num:1, theme:P.theme.id, done:true, score:7, f:.93, L:P.markY, mode:'hold'}}})],
    ['split.motion.v1', 'reduced'],
    ['ph_split.analytics_posthog', JSON.stringify({distinct_id:'existing-browser'})]
  ]);
  const values = new Map(existing), writes = [];
  const localStorage = {
    getItem:key => values.get(key) ?? null,
    setItem(key, value){ writes.push(key); values.set(key, value); }
  };
  return {existing, values, writes, localStorage};
}

function storageContext(localStorage, extra = {}){
  const context = vm.createContext({LAUNCH, RECORD_RUN, localStorage, ...extra});
  vm.runInContext(storeSource + '\n' + storageSource, context);
  return context;
}

function unchangedEntries(storage){
  for (const [key, value] of storage.existing){
    assert.equal(storage.values.get(key), value, key + ' is retained unchanged');
  }
}

test('the friends run starts fresh and persists on reload without removing earlier records or preferences', () => {
  const storage = browserStorage(), tab = storageContext(storage.localStorage);
  const currentKey = vm.runInContext('STORE', tab);
  assert.notEqual(currentKey, legacyKey);
  assert.deepEqual(structuredClone(tab.load()), {days:{}});
  assert.equal(storage.writes.length, 0, 'opening the fresh run does not rewrite old browser data');

  const record = {days:{[P.key]:{num:1, theme:P.theme.id, done:true, score:100, f:0, L:P.markY, mode:'hold'}}};
  tab.save(record);
  assert.deepEqual(storage.writes, [currentKey]);
  const reloaded = storageContext(storage.localStorage);
  assert.deepEqual(structuredClone(reloaded.load()), record);
  unchangedEntries(storage);
});

function sipTab(localStorage, {offset = 0, mode = 'hold'} = {}){
  const S = {num:1, key:P.key, theme:P.theme, P, kind:'today', preview:false, practice:false,
    friend:null, mode, L:P.markY + offset * P.markH, drained:false, state:'locked'};
  const events = [], element = {hidden:false, classList:{add(){}}};
  const context = storageContext(localStorage, {S, Date:PlayDate, gameProperties, canRecordChallenge,
    scoreFromOffset, PERFECT, analytics:{capture:(event, properties) => events.push({event, properties})},
    refreshDayStatus(){}, toast(){}, draw(){}, setPhase:phase => { S.state = phase; },
    $:() => element, renderResult(){}, renderStats(){}});
  vm.runInContext(finishSource, context);
  return {S, events, context, finish:() => vm.runInContext('finish(1000);', context)};
}

test('a fresh daily sip saves once and a second open tab restores that result instead of replacing it', () => {
  const storage = browserStorage();
  const first = sipTab(storage.localStorage), second = sipTab(storage.localStorage, {offset:.7, mode:'tilt'});
  assert.deepEqual(structuredClone(first.context.load()), {days:{}});
  assert.deepEqual(structuredClone(second.context.load()), {days:{}}, 'both tabs opened before either completion');

  first.finish();
  assert.equal(first.S.result.score, 100, 'the earlier test score does not block the new official sip');
  assert.equal(first.events[0].event, 'sip_completed');
  assert.equal(first.events[0].properties.counts, true);
  assert.equal(first.events[0].properties.new_record, true);
  const saved = storage.values.get(vm.runInContext('STORE', first.context));

  second.finish();
  assert.equal(second.S.result.score, 100);
  assert.equal(second.S.mode, 'hold', 'the first sip remains the recorded result');
  assert.equal(second.S.result.counts, true, 'the reused result is still the official sip');
  assert.equal(second.events[0].properties.input_mode, 'tilt', 'telemetry describes the later attempt');
  assert.equal(second.events[0].properties.counts, false);
  assert.equal(second.events[0].properties.new_record, false);
  assert.equal(storage.writes.length, 1);
  assert.equal(storage.values.get(vm.runInContext('STORE', second.context)), saved);
  unchangedEntries(storage);
});
