// Reset one browser's daily sip without changing the public run or other records.
import {LAUNCH, RECORD_RUN} from './config.js';
import {isCalendarDateKey} from './challenge.js';

export const recordStorageKey = 'split.v1:' + LAUNCH + ':' + RECORD_RUN;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

function checkKey(key){
  if (!isCalendarDateKey(key)) throw new Error('That daily date is invalid. Refresh this page and try again.');
}
function backupKey(key){ return recordStorageKey + ':reset:' + key; }
function read(storage, key, label){
  let raw;
  try { raw = storage.getItem(key); }
  catch { throw new Error('This browser cannot read saved sips. Check its storage settings and try again.'); }
  if (raw === null) return null;
  try {
    const value = JSON.parse(raw);
    if (value === null) throw new Error('Invalid saved value.');
    return value;
  }
  catch { throw new Error(label + ' could not be read. It has been left untouched.'); }
}
function readStore(storage){
  const value = read(storage, recordStorageKey, 'Your saved sip data');
  if (value === null) return {days:{}};
  if (!object(value) || !object(value.days) || Object.values(value.days).some(record => !object(record))){
    throw new Error('Your saved sip data is invalid. It has been left untouched.');
  }
  return value;
}
function readBackup(storage, key){
  const value = read(storage, backupKey(key), 'Your recovery copy');
  if (value === null) return null;
  if (!object(value) || value.key !== key || !object(value.record)){
    throw new Error('Your recovery copy is invalid. It has been left untouched.');
  }
  return value.record;
}
function recordFor(store, key){ return own(store.days, key) ? store.days[key] : null; }
function writeVerified(storage, key, value, message){
  const raw = JSON.stringify(value);
  try {
    storage.setItem(key, raw);
    if (storage.getItem(key) !== raw) throw new Error('The write was not saved.');
  } catch { throw new Error(message); }
}

/** Inspect without writing or changing an existing attempt. */
export function inspectDaily(storage, key){
  checkKey(key);
  return {record:recordFor(readStore(storage), key), backup:readBackup(storage, key)};
}

/** The caller must invoke this from an explicit reset action. */
export function resetDaily(storage, key){
  const {record} = inspectDaily(storage, key);
  if (record === null) return {changed:false, record:null};
  writeVerified(storage, backupKey(key), {key, record},
    'A recovery copy could not be saved. Your daily sip has not been cleared.');

  // Re-read after the backup so other dates changed by another tab stay intact.
  const store = readStore(storage), current = recordFor(store, key);
  if (current === null) return {changed:false, record:null};
  if (JSON.stringify(current) !== JSON.stringify(record)){
    throw new Error('Your saved sip changed while resetting. Refresh this page and try again.');
  }
  delete store.days[key];
  writeVerified(storage, recordStorageKey, store,
    'The reset could not be confirmed. Your recovery copy is kept; refresh this page before trying again.');
  return {changed:true, record};
}

/** Undo only while that date has no saved sip; never replace a new attempt. */
export function restoreDaily(storage, key){
  const {record, backup} = inspectDaily(storage, key);
  if (record !== null || backup === null) return {restored:false, record};
  const store = readStore(storage), current = recordFor(store, key);
  if (current !== null) return {restored:false, record:current};
  store.days[key] = backup;
  writeVerified(storage, recordStorageKey, store,
    'Your sip could not be restored. The recovery copy is kept; refresh this page and try again.');
  return {restored:true, record:backup};
}
