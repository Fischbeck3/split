import {RECORD_STORE, LEGACY_RECORD_STORE, BLACKOUT_START} from './config.js';

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function parse(raw){
  if (raw === null) return null;
  const value = JSON.parse(raw);
  if (!object(value) || !object(value.days)) throw new Error('Saved rounds could not be read.');
  return value;
}

/** Import once into an isolated release store. Old tabs continue to write their
 * old key; they cannot overwrite four-sip progress. Keep today's old round as a
 * recovery copy, plus the entire original store, while preserving all history. */
export function loadRecords(storage, today){
  const existing = parse(storage.getItem(RECORD_STORE));
  if (existing) return existing;
  const legacy = parse(storage.getItem(LEGACY_RECORD_STORE));
  if (!legacy) return {days:{}};
  const days = {...legacy.days};
  const reset = typeof today === 'string' && today >= BLACKOUT_START;
  const previous = reset ? days[today] ?? null : null;
  if (reset) delete days[today];
  const migrated = {...legacy, days, blackoutRelease:{date:today, previous}};
  storage.setItem(RECORD_STORE, JSON.stringify(migrated));
  return migrated;
}
