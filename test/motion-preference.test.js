import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MOTION_PREFERENCE_KEY, readPreference, loadPreference, savePreference} from '../site/js/motion-preference.js';

function store(value = null){
  const entries = new Map(value === null ? [] : [[MOTION_PREFERENCE_KEY, value]]);
  return {getItem:key => entries.get(key) ?? null, setItem:(key, next) => entries.set(key, next)};
}

test('a first visit follows the device preference as it changes', () => {
  const storage = store();
  assert.equal(readPreference(storage), null);
  assert.equal(loadPreference(storage, true), true);
  assert.equal(loadPreference(storage, false), false);
  assert.equal(readPreference(storage), null, 'following the device must not become an explicit override');
});

test('an intentional full or still vessel persists and wins over later device changes', () => {
  const storage = store();
  for (const reduced of [false, true]){
    assert.equal(savePreference(storage, reduced), true);
    assert.equal(readPreference(storage), reduced);
    assert.equal(loadPreference(storage, false), reduced);
    assert.equal(loadPreference(storage, true), reduced);
  }
});

test('corrupt or older values fall back to the device without enabling motion', () => {
  for (const value of ['', 'true', 'false', '0', '1', 'null', '{}', 'Full', ' reduced ']){
    const storage = store(value);
    assert.equal(readPreference(storage), null, value);
    assert.equal(loadPreference(storage, true), true, value);
    assert.equal(loadPreference(storage, false), false, value);
  }
});

test('private or denied storage keeps the device default and cannot break a local toggle', () => {
  const denied = {
    getItem(){ throw new Error('denied'); },
    setItem(){ throw new Error('quota'); }
  };
  const deniedGetter = Object.defineProperty({}, 'getItem', {get(){ throw new Error('denied'); }});
  for (const storage of [null, undefined, {}, denied, deniedGetter]){
    assert.equal(readPreference(storage), null);
    assert.equal(loadPreference(storage, true), true);
    assert.equal(loadPreference(storage, false), false);
    assert.equal(savePreference(storage, false), false);
  }
});

test('invalid writes cannot silently turn an explicit still vessel into full motion', () => {
  const storage = store('reduced');
  for (const reduced of [null, undefined, 0, 1, '', 'false', {}]){
    assert.equal(savePreference(storage, reduced), false);
    assert.equal(loadPreference(storage, false), true);
  }
});
