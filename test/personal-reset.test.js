import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {LAUNCH, LAUNCH_READY, RECORD_RUN} from '../site/js/config.js';
import {dayKey, dayNumber, dayParams} from '../site/js/core.js';
import {recordStorageKey, inspectDaily, resetDaily, restoreDaily} from '../site/js/personal-reset.js';

const launchDate = new Date(LAUNCH + 'T12:00:00');
const today = LAUNCH, tomorrow = dayKey(new Date(launchDate.getFullYear(), launchDate.getMonth(), launchDate.getDate() + 1, 12));
const record = {num:1, theme:'pub', done:true, score:88, f:.15, L:.6, mode:'hold'};
const backupKey = key => recordStorageKey + ':reset:' + key;

function browserStorage(store = {days:{[today]:record, [tomorrow]:{...record, num:2, theme:'peroni'}}}){
  const entries = new Map([
    [recordStorageKey, JSON.stringify(store)],
    ['split.v1:' + LAUNCH, JSON.stringify({days:{[today]:{...record, score:4}}})],
    ['split.motion.v1', 'false'],
    ['split.sound.v1', 'true'],
    ['ph_split.analytics_posthog', '{"distinct_id":"existing-browser"}']
  ]);
  const values = new Map(entries), writes = [];
  const storage = {
    getItem:key => values.get(key) ?? null,
    setItem(key, value){ writes.push(key); values.set(key, value); }
  };
  return {entries, values, writes, storage};
}
function unrelatedUntouched(browser){
  for (const [key, value] of browser.entries){
    if (key !== recordStorageKey) assert.equal(browser.values.get(key), value, key + ' remains untouched');
  }
}

test('personal reset uses the actual app record run and inspecting is read-only', () => {
  const main = readFileSync(new URL('../site/js/main.js', import.meta.url), 'utf8');
  const context = vm.createContext({LAUNCH, RECORD_RUN});
  vm.runInContext(main.match(/^const STORE = .+;$/m)[0], context);
  assert.equal(recordStorageKey, vm.runInContext('STORE', context));
  const browser = browserStorage();
  assert.deepEqual(inspectDaily(browser.storage, today), {record, backup:null});
  assert.deepEqual(browser.writes, []);
});

test('reset backs up only the requested sip and preserves other days, fields, and preferences', () => {
  const nextRecord = {...record, num:2, theme:'peroni'};
  const browser = browserStorage({days:{[today]:record, [tomorrow]:nextRecord}, version:3, custom:{kept:true}});
  assert.deepEqual(resetDaily(browser.storage, today), {changed:true, record});
  assert.deepEqual(browser.writes, [backupKey(today), recordStorageKey]);
  assert.deepEqual(JSON.parse(browser.values.get(recordStorageKey)), {days:{[tomorrow]:nextRecord}, version:3, custom:{kept:true}});
  assert.deepEqual(JSON.parse(browser.values.get(backupKey(today))), {key:today, record});
  assert.deepEqual(inspectDaily(browser.storage, today), {record:null, backup:record});
  unrelatedUntouched(browser);
});

test('no saved sip and repeated reset make no writes or overwrite the recovery copy', () => {
  const absent = browserStorage({days:{}});
  assert.deepEqual(resetDaily(absent.storage, today), {changed:false, record:null});
  assert.deepEqual(absent.writes, []);
  const browser = browserStorage();
  resetDaily(browser.storage, today);
  const originalBackup = browser.values.get(backupKey(today)), writeCount = browser.writes.length;
  assert.deepEqual(resetDaily(browser.storage, today), {changed:false, record:null});
  assert.equal(browser.writes.length, writeCount);
  assert.equal(browser.values.get(backupKey(today)), originalBackup);
});

test('undo restores only the cleared date, retains backup, and never overwrites a new sip', () => {
  const browser = browserStorage();
  resetDaily(browser.storage, today);
  const backup = browser.values.get(backupKey(today));
  assert.deepEqual(restoreDaily(browser.storage, today), {restored:true, record});
  assert.deepEqual(JSON.parse(browser.values.get(recordStorageKey)), JSON.parse(browser.entries.get(recordStorageKey)));
  assert.equal(browser.values.get(backupKey(today)), backup);
  const newer = {...record, score:100}, store = JSON.parse(browser.values.get(recordStorageKey));
  store.days[today] = newer; browser.values.set(recordStorageKey, JSON.stringify(store));
  const before = browser.values.get(recordStorageKey), count = browser.writes.length;
  assert.deepEqual(restoreDaily(browser.storage, today), {restored:false, record:newer});
  assert.equal(browser.values.get(recordStorageKey), before);
  assert.equal(browser.writes.length, count);
  unrelatedUntouched(browser);
});

test('undo without a recovery copy is read-only', () => {
  const browser = browserStorage({days:{}});
  assert.deepEqual(restoreDaily(browser.storage, today), {restored:false, record:null});
  assert.deepEqual(browser.writes, []);
});

test('a partial record can be explicitly reset and restored without losing its fields', () => {
  const partial = {done:true, theme:'pub', custom:'kept'}, browser = browserStorage({days:{[today]:partial}});
  assert.deepEqual(resetDaily(browser.storage, today), {changed:true, record:partial});
  assert.deepEqual(restoreDaily(browser.storage, today), {restored:true, record:partial});
  assert.deepEqual(JSON.parse(browser.values.get(recordStorageKey)), {days:{[today]:partial}});
});

test('malformed store or backup and invalid dates are never erased or rewritten', () => {
  for (const raw of ['{', 'null', '[]', '{}', '{"days":[]}', '{"days":{"2026-10-09":null}}']){
    const browser = browserStorage(); browser.values.set(recordStorageKey, raw);
    for (const action of [inspectDaily, resetDaily, restoreDaily]) assert.throws(() => action(browser.storage, today), /invalid|could not be read/);
    assert.equal(browser.values.get(recordStorageKey), raw); assert.deepEqual(browser.writes, []);
  }
  for (const raw of ['{', 'null', '[]', '{}', JSON.stringify({key:tomorrow, record}), JSON.stringify({key:today, record:null})]){
    const browser = browserStorage(); browser.values.set(backupKey(today), raw);
    for (const action of [inspectDaily, resetDaily, restoreDaily]) assert.throws(() => action(browser.storage, today), /invalid|could not be read/);
    assert.equal(browser.values.get(backupKey(today)), raw); assert.deepEqual(browser.writes, []);
    assert.equal(browser.values.get(recordStorageKey), browser.entries.get(recordStorageKey));
  }
  const browser = browserStorage();
  for (const key of ['2026-02-30', '__proto__', null, '2026-10-09:reset']){
    for (const action of [inspectDaily, resetDaily, restoreDaily]) assert.throws(() => action(browser.storage, key), /daily date is invalid/);
  }
  assert.deepEqual(browser.writes, []);
});

test('unavailable storage and failed or silently blocked backups leave the daily sip intact', () => {
  assert.throws(() => inspectDaily({getItem(){ throw new Error('blocked'); }}, today), /cannot read saved sips/);
  for (const silently of [false, true]){
    const browser = browserStorage();
    browser.storage.setItem = () => { if (!silently) throw new Error('quota'); };
    assert.throws(() => resetDaily(browser.storage, today), /recovery copy could not be saved/);
    assert.equal(browser.values.get(recordStorageKey), browser.entries.get(recordStorageKey));
  }
});

test('failed or silently blocked reset writes retain the verified recovery copy', () => {
  for (const silently of [false, true]){
    const browser = browserStorage(), setItem = browser.storage.setItem;
    browser.storage.setItem = (key, value) => {
      if (key !== recordStorageKey) return setItem(key, value);
      if (!silently) throw new Error('quota');
    };
    assert.throws(() => resetDaily(browser.storage, today), /reset could not be confirmed/);
    assert.equal(browser.values.get(recordStorageKey), browser.entries.get(recordStorageKey));
    assert.deepEqual(JSON.parse(browser.values.get(backupKey(today))), {key:today, record});
  }
});

test('failed or silently blocked restore keeps the recovery copy available', () => {
  for (const silently of [false, true]){
    const browser = browserStorage(); resetDaily(browser.storage, today);
    const before = browser.values.get(recordStorageKey), backup = browser.values.get(backupKey(today));
    browser.storage.setItem = () => { if (!silently) throw new Error('quota'); };
    assert.throws(() => restoreDaily(browser.storage, today), /could not be restored/);
    assert.equal(browser.values.get(recordStorageKey), before);
    assert.equal(browser.values.get(backupKey(today)), backup);
  }
});

test('reset re-reads storage after backup, preserves other-tab records, and protects a changed sip', () => {
  const browser = browserStorage(), setItem = browser.storage.setItem;
  browser.storage.setItem = (key, value) => {
    setItem(key, value);
    if (key === backupKey(today)){
      const store = JSON.parse(browser.values.get(recordStorageKey)); store.other = 'another tab';
      browser.values.set(recordStorageKey, JSON.stringify(store));
    }
  };
  resetDaily(browser.storage, today);
  assert.equal(JSON.parse(browser.values.get(recordStorageKey)).other, 'another tab');
  const changed = browserStorage(), originalWrite = changed.storage.setItem;
  changed.storage.setItem = (key, value) => {
    originalWrite(key, value);
    if (key === backupKey(today)){
      const store = JSON.parse(changed.values.get(recordStorageKey)); store.days[today].score = 100;
      changed.values.set(recordStorageKey, JSON.stringify(store));
    }
  };
  assert.throws(() => resetDaily(changed.storage, today), /sip changed while resetting/);
  assert.equal(JSON.parse(changed.values.get(recordStorageKey)).days[today].score, 100);
  assert.deepEqual(changed.writes, [backupKey(today)]);
});

test('passing the next local day leaves the earlier daily alone', () => {
  const browser = browserStorage();
  const localMidnight = new Date(launchDate.getFullYear(), launchDate.getMonth(), launchDate.getDate() + 1);
  assert.equal(dayKey(localMidnight), tomorrow);
  assert.equal(resetDaily(browser.storage, dayKey(localMidnight)).changed, true);
  assert.deepEqual(JSON.parse(browser.values.get(recordStorageKey)).days[today], record);
  assert.equal(browser.values.has(backupKey(today)), false);
});

test('the reset controller loads read-only and requires another explicit click after midnight for reset and undo', () => {
  const source = readFileSync(new URL('../site/js/reset-daily.js', import.meta.url), 'utf8')
    .replace(/^import .*;\r?\n/gm, '');
  const nextRecord = {...record, num:2, theme:'peroni'};
  for (const action of ['reset', 'undo']){
    const browser = action === 'reset' ? browserStorage() : browserStorage({days:{}});
    if (action === 'undo'){
      browser.values.set(backupKey(today), JSON.stringify({key:today, record}));
      browser.values.set(backupKey(tomorrow), JSON.stringify({key:tomorrow, record:nextRecord}));
    }
    let clock = new Date(launchDate.getFullYear(), launchDate.getMonth(), launchDate.getDate(), 23, 59, 59).getTime();
    class BrowserDate extends Date {
      constructor(...args){ super(...(args.length ? args : [clock])); }
      static now(){ return clock; }
    }
    const elements = new Map();
    function element(id){
      if (!elements.has(id)){
        const listeners = new Map(), classes = new Set();
        elements.set(id, {
          textContent:'', hidden:id === 'undoReset' || id === 'resetStatus', disabled:id === 'resetDaily', dataset:{},
          classList:{toggle(name, enabled){ if (enabled) classes.add(name); else classes.delete(name); }},
          addEventListener(type, listener){ listeners.set(type, listener); },
          click(){ listeners.get('click')(); }
        });
      }
      return elements.get(id);
    }
    const calls = {reset:[], undo:[]}, windowEvents = new Map();
    const context = vm.createContext({Date:BrowserDate, Intl, dayKey, dayNumber, dayParams, LAUNCH, LAUNCH_READY,
      document:{getElementById:element}, window:{localStorage:browser.storage, addEventListener:(type, listener) => windowEvents.set(type, listener)},
      inspectDaily,
      resetDaily(storage, key){ calls.reset.push(key); return resetDaily(storage, key); },
      restoreDaily(storage, key){ calls.undo.push(key); return restoreDaily(storage, key); }
    });
    vm.runInContext(source, context);
    assert.match(element('resetDay').textContent, /^No\. 001 · /);
    assert.deepEqual(browser.writes, [], action + ': loading does not change storage');
    assert.deepEqual(calls, {reset:[], undo:[]});

    // The page stays open and receives no focus/pageshow event at midnight.
    clock = new Date(launchDate.getFullYear(), launchDate.getMonth(), launchDate.getDate() + 1, 0, 0, 1).getTime();
    const button = element(action === 'reset' ? 'resetDaily' : 'undoReset');
    button.click();
    assert.deepEqual(calls, {reset:[], undo:[]}, action + ': the stale button cannot mutate a different day');
    assert.deepEqual(browser.writes, []);
    assert.match(element('resetDay').textContent, /^No\. 002 · /);
    assert.match(element('resetStatus').textContent, /A new day has started\. Check today’s sip before/);
    assert.equal(element('resetStatus').hidden, false);

    button.click();
    assert.deepEqual(calls[action], [tomorrow], action + ': the second click explicitly acts on the displayed current day');
    assert.deepEqual(calls[action === 'reset' ? 'undo' : 'reset'], []);
    const days = JSON.parse(browser.values.get(recordStorageKey)).days;
    if (action === 'reset'){
      assert.deepEqual(days[today], record);
      assert.equal(Object.hasOwn(days, tomorrow), false);
      assert.deepEqual(JSON.parse(browser.values.get(backupKey(tomorrow))), {key:tomorrow, record:nextRecord});
    } else {
      assert.equal(Object.hasOwn(days, today), false);
      assert.deepEqual(days[tomorrow], nextRecord);
      assert.deepEqual(JSON.parse(browser.values.get(backupKey(today))), {key:today, record});
    }
    unrelatedUntouched(browser);
  }
});
