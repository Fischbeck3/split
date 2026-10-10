import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LAUNCH} from '../site/js/config.js';
import {dayParams} from '../site/js/core.js';
import {controllerApp, browserStorage, storageKey} from './helpers/controller-app.js';

const P = dayParams(1), legacyKey = 'split.v1:' + LAUNCH;
function storageWithHistory(){
  const retained = new Map([
    [legacyKey, JSON.stringify({days:{[P.key]:{num:1, theme:P.theme.id, done:true, score:7, f:.93, L:P.markY, mode:'hold'}}})],
    ['split.motion.v1', 'reduced'],
    ['split.sound.v1', 'on'],
    ['ph_split.analytics_posthog', JSON.stringify({distinct_id:'existing-browser'})]
  ]);
  return {retained, storage:browserStorage(retained)};
}
function unchangedEntries(storage, retained){
  for (const [key, value] of retained) assert.equal(storage.values.get(key), value, key + ' stays unchanged');
}

test('the friends run records one best-of-three day without removing earlier records or preferences', () => {
  const {storage, retained} = storageWithHistory(), app = controllerApp({storage});
  assert.notEqual(storageKey, legacyKey);
  assert.deepEqual(app.read(), {days:{}});
  assert.equal(storage.writes.length, 0);
  app.sip(240);
  assert.equal(app.S.state, 'between');
  assert.equal(app.S.progress.done, false);
  assert.equal(app.stats().stDays, 0, 'the first sip is saved progress, not a completed day');
  app.sip(200);
  assert.equal(app.S.progress.done, false);
  assert.equal(app.stats().stDays, 0, 'two sips still do not advance the record');
  app.sip(220);
  assert.equal(app.S.state, 'result');
  assert.equal(app.S.result.counts, true);
  assert.equal(app.S.result.score, Math.max(...app.S.result.rounds.map(round => round.score)));
  assert.equal(app.stats().stDays, 1);
  assert.equal(app.stats().stStreak, 1);
  assert.equal(app.stats().stBest, app.S.result.score);
  assert.equal(storage.writes.length, 6, 'each held sip reserves once and completes once');
  const reload = controllerApp({storage}); reload.restore();
  assert.equal(reload.S.state, 'result');
  assert.deepEqual(structuredClone(reload.S.result.rounds), structuredClone(app.S.result.rounds));
  assert.equal(storage.writes.length, 6, 'restoring a finished round cannot rewrite it');
  unchangedEntries(storage, retained);
});

test('a reload resumes at the next graduated sip and preserves the first result exactly', () => {
  const storage = browserStorage(), first = controllerApp({storage});
  first.sip(240);
  const recorded = structuredClone(first.S.progress.rounds[0]);
  assert.ok(recorded.score > 0, 'the saved first sip provides a real best-score candidate');
  const reload = controllerApp({storage}); reload.restore();
  assert.equal(reload.S.state, 'intro');
  assert.equal(reload.S.progress.rounds.length, 1);
  assert.equal(reload.element('startLabel').textContent, 'Continue · Tipsy');
  assert.equal(reload.stats().stDays, 0);
  reload.sip(200);
  assert.equal(reload.S.round, 1);
  assert.equal(reload.S.P.sipStage, 1);
  reload.sip(220);
  assert.equal(reload.S.round, 2);
  assert.equal(reload.S.P.sipStage, 2);
  assert.deepEqual(structuredClone(reload.S.result.rounds[0]), recorded);
  assert.equal(reload.S.result.score, Math.max(...reload.S.result.rounds.map(round => round.score)));
  const best = reload.S.result.rounds[reload.S.result.bestIndex];
  assert.equal(reload.S.result.L, best.L, 'the best score and shared stopping line come from the same sip');
  assert.equal(reload.S.result.f, best.f);
});

test('today’s old single-sip completion becomes the first sober sip with two left; history is preserved', () => {
  const old = {num:P.num, theme:P.theme.id, done:true, score:92, f:.1,
    L:P.markY + P.markH * .1, label:'Split', tone:'good', mode:'tilt', attribution:{campaign_id:'opening-2026'}};
  const historicalKey = '2026-10-08', historical = {...old, num:0, theme:'beach'};
  const storage = browserStorage([[storageKey, JSON.stringify({days:{[P.key]:old, [historicalKey]:historical}})]]);
  const app = controllerApp({storage}); app.restore();
  assert.equal(app.S.progress.version, 2);
  assert.equal(app.S.progress.done, false);
  assert.equal(app.S.progress.rounds.length, 1);
  assert.equal(app.S.progress.rounds[0].score, old.score);
  assert.equal(app.S.progress.rounds[0].mode, 'tilt');
  assert.deepEqual(structuredClone(app.S.progress.rounds[0].attribution), old.attribution);
  assert.equal(app.element('startLabel').textContent, 'Continue · Tipsy');
  app.sip(200); app.sip(220);
  assert.equal(app.S.result.rounds.length, 3);
  assert.equal(app.S.result.rounds[0].L, old.L);
  assert.deepEqual(app.read().days[historicalKey], historical, 'a past day is never migrated or rewritten');
});

test('reloading a held sip consumes one miss and prevents its stale token from finishing later', () => {
  const storage = browserStorage(), abandoned = controllerApp({storage});
  abandoned.begin(); abandoned.ready(); abandoned.press(); abandoned.advance(30);
  const pending = abandoned.read().days[P.key].pending;
  assert.equal(pending.index, 0);
  const resumed = controllerApp({storage}); resumed.restore();
  assert.equal(resumed.S.progress.rounds.length, 1);
  assert.equal(resumed.S.progress.rounds[0].abandoned, true);
  assert.equal(resumed.S.progress.rounds[0].score, 0);
  assert.equal(resumed.S.progress.pending, null);
  const writesBeforeStale = storage.writes.length;
  abandoned.release(); abandoned.settle();
  assert.equal(abandoned.S.state, 'blocked');
  assert.equal(storage.writes.length, writesBeforeStale, 'a consumed token cannot save a replacement');
  assert.equal(abandoned.events.filter(event => event.event === 'sip_completed').length, 0);
  resumed.sip(240); resumed.sip(220);
  assert.equal(resumed.S.result.rounds.length, 3);
  assert.equal(resumed.S.result.rounds[0].abandoned, true);
  assert.equal(resumed.S.result.counts, true);
});

test('two fresh tabs cannot reserve or replace the same next sip', () => {
  const storage = browserStorage(), first = controllerApp({storage}), stale = controllerApp({storage});
  first.begin(); first.ready(); stale.begin(); stale.ready();
  first.press();
  const reservation = storage.values.get(storageKey), writes = storage.writes.length;
  stale.press();
  assert.equal(stale.S.state, 'blocked');
  assert.equal(stale.S.holding, false);
  assert.equal(storage.writes.length, writes);
  assert.equal(storage.values.get(storageKey), reservation);
  first.advance(240); first.release(); first.settle();
  first.sip(200); first.sip(220);
  const completed = storage.values.get(storageKey), completedWrites = storage.writes.length;
  stale.begin(); stale.ready(); stale.press();
  assert.equal(stale.S.state, 'blocked');
  assert.equal(storage.values.get(storageKey), completed);
  assert.equal(storage.writes.length, completedWrites);
  assert.equal(first.stats().stDays, 1);
});

test('a very short tap before the next animation frame still consumes exactly one real sip', () => {
  const app = controllerApp();
  app.begin(); app.ready(); app.press(); app.release();
  assert.equal(app.S.state, 'locked');
  app.settle();
  assert.equal(app.S.state, 'between');
  assert.equal(app.S.progress.rounds.length, 1);
  assert.equal(app.S.progress.pending, null);
  assert.equal(app.events.filter(event => event.event === 'sip_started').length, 1);
  assert.equal(app.events.filter(event => event.event === 'sip_completed').length, 1);
});

test('a third sip that settles after midnight remains unsaved archive feedback', () => {
  const storage = browserStorage(), app = controllerApp({storage});
  app.sip(240); app.sip(200);
  app.begin(); app.ready(); app.press(); app.advance(220);
  const beforeMidnight = storage.values.get(storageKey), writes = storage.writes.length;
  const tomorrow = new Date(P.key + 'T23:59:59'); tomorrow.setDate(tomorrow.getDate() + 1);
  app.setCalendar(tomorrow); app.release(); app.settle();
  assert.equal(app.S.kind, 'archive');
  assert.equal(app.S.state, 'result');
  assert.equal(app.S.result.rounds.length, 3);
  assert.equal(app.S.result.counts, false);
  assert.equal(storage.values.get(storageKey), beforeMidnight);
  assert.equal(storage.writes.length, writes, 'midnight cannot complete yesterday’s daily record');
  assert.equal(app.read().days[P.key].rounds.length, 2);
  assert.equal(app.read().days[P.key].done, false);
  assert.equal(app.stats().stDays, 0);
  const completion = app.events.filter(event => event.event === 'sip_completed').at(-1);
  assert.equal(completion.properties.counts, false);
  assert.equal(completion.properties.new_record, false);
});

test('a fresh practice round keeps the completed official round and statistics unchanged', () => {
  const storage = browserStorage(), app = controllerApp({storage});
  app.sip(240); app.sip(200); app.sip(220);
  const official = storage.values.get(storageKey), writes = storage.writes.length;
  const stats = app.stats();
  app.practice(); app.ready(); app.press(); app.advance(30); app.release(); app.settle();
  app.sip(30); app.sip(30);
  assert.equal(app.S.state, 'result');
  assert.equal(app.S.result.rounds.length, 3);
  assert.equal(app.S.result.counts, false);
  assert.equal(storage.values.get(storageKey), official);
  assert.equal(storage.writes.length, writes);
  assert.deepEqual(app.stats(), stats);
  for (const kind of ['archive', 'preview']){
    const unsaved = controllerApp({storage, kind}); unsaved.restore();
    assert.equal(unsaved.S.progress, null, kind + ': old official result does not hydrate into unsaved play');
    unsaved.sip(30); unsaved.sip(30); unsaved.sip(30);
    assert.equal(unsaved.S.result.counts, false);
    assert.equal(storage.values.get(storageKey), official);
    assert.equal(storage.writes.length, writes);
  }
});

test('malformed unfinished storage recovers today only and leaves historical records intact', () => {
  const historicalKey = '2026-10-08', historical = {theme:'beach', num:0, done:true, score:91, f:.1, L:.6, mode:'hold'};
  const malformed = {version:2, num:P.num, theme:P.theme.id, rounds:[{score:'invalid', f:0, L:P.markY}], done:false, pending:null};
  const storage = browserStorage([[storageKey, JSON.stringify({days:{[P.key]:malformed, [historicalKey]:historical}})], ['split.sound.v1', 'on']]);
  const app = controllerApp({storage});
  assert.doesNotThrow(() => app.restore());
  assert.equal(app.S.progress.rounds.length, 0);
  assert.equal(app.S.progress.done, false);
  assert.equal(app.element('startLabel').textContent, 'Start today’s glass');
  assert.match(app.messages.at(-1), /could not be read/);
  assert.deepEqual(app.read().days[historicalKey], historical);
  assert.equal(storage.values.get('split.sound.v1'), 'on');
  app.sip(240); app.sip(200); app.sip(220);
  assert.equal(app.S.result.counts, true);
  assert.deepEqual(app.read().days[historicalKey], historical);
});

test('an earlier same-day glass cannot block the currently released glass’s three sips', () => {
  const earlier = {num:P.num, theme:'beach', done:true, score:91, f:.1, L:.6, mode:'hold'};
  const historicalKey = '2026-10-08', historical = {...earlier, num:0};
  const storage = browserStorage([[storageKey, JSON.stringify({days:{[P.key]:earlier, [historicalKey]:historical}})]]);
  const app = controllerApp({storage}); app.restore();
  assert.equal(app.S.progress, null, 'the old glass cannot hydrate into the current glass');
  app.sip(240);
  assert.equal(app.S.state, 'between', 'the old theme does not reject a new hold reservation');
  assert.equal(app.S.progress.theme, P.theme.id);
  assert.equal(app.S.progress.rounds.length, 1);
  app.sip(200); app.sip(220);
  assert.equal(app.S.state, 'result');
  assert.equal(app.S.result.counts, true);
  assert.equal(app.S.result.theme, P.theme.id);
  assert.equal(app.read().days[P.key].theme, P.theme.id);
  assert.equal(app.read().days[P.key].rounds.length, 3);
  assert.deepEqual(app.read().days[historicalKey], historical);
});

test('read-only browser storage keeps a legacy first sip and finishes two more in memory as unsaved play', () => {
  const firstSip = {num:P.num, theme:P.theme.id, done:true, score:92, f:.1,
    L:P.markY + P.markH * .1, label:'Split', tone:'good', mode:'hold'};
  const historicalKey = '2026-10-08', historical = {...firstSip, num:0, theme:'beach'};
  const original = JSON.stringify({days:{[P.key]:firstSip, [historicalKey]:historical}});
  const storage = browserStorage([[storageKey, original], ['split.sound.v1', 'on']], {failWrites:true});
  const app = controllerApp({storage});
  assert.doesNotThrow(() => app.restore());
  assert.equal(app.S.storageFailed, true);
  assert.equal(app.S.progress.rounds.length, 1);
  assert.equal(app.S.progress.rounds[0].score, firstSip.score);
  const attemptedWrites = storage.writes.length;
  assert.ok(attemptedWrites > 0, 'migration attempted a real browser write');
  app.sip(200); app.sip(220);
  assert.equal(app.S.state, 'result', 'failed persistence cannot leave an in-memory token stalled');
  assert.equal(app.S.result.rounds.length, 3);
  assert.equal(app.S.result.counts, false);
  assert.equal(app.S.result.pending, null);
  assert.doesNotMatch(app.element('introNote').textContent, /\d of 3 saved/, 'memory-only progress must not be described as saved');
  assert.equal(app.S.result.rounds[0].L, firstSip.L);
  assert.equal(storage.writes.length, attemptedWrites, 'later sips do not keep trying unavailable storage');
  assert.equal(storage.values.get(storageKey), original);
  assert.equal(storage.values.get('split.sound.v1'), 'on');
  assert.deepEqual(app.read().days[historicalKey], historical);
  assert.ok(app.messages.some(message => /not sav|cannot sav|can.t sav|could not sav|unsaved/i.test(message)), 'the player is told that this round cannot be saved');
  const completions = app.events.filter(event => event.event === 'sip_completed');
  assert.equal(completions.length, 2);
  assert.ok(completions.every(event => !event.properties.counts && !event.properties.new_record));
});

test('failure on the final save leaves a playable best result without falsely recording a completed day', () => {
  const storage = browserStorage([], {failOnWrite:6}), app = controllerApp({storage});
  app.sip(240); app.sip(200);
  const firstTwo = app.read().days[P.key].rounds;
  assert.equal(storage.writes.length, 4, 'the first two reservations and completions were persisted');
  app.sip(220);
  assert.equal(storage.writes.length, 6, 'only the third completion write fails');
  assert.equal(app.S.storageFailed, true);
  assert.equal(app.S.state, 'result');
  assert.equal(app.S.result.done, true, 'the completed best-of-three result remains available in this tab');
  assert.equal(app.S.result.rounds.length, 3);
  assert.equal(app.S.result.score, Math.max(...app.S.result.rounds.map(round => round.score)));
  assert.equal(app.S.result.counts, false);
  const persisted = app.read().days[P.key];
  assert.deepEqual(persisted.rounds, firstTwo);
  assert.equal(persisted.done, false);
  assert.equal(persisted.pending.index, 2, 'storage retains its successful third reservation instead of a false completion');
  assert.equal(app.stats().stDays, 0);
  const completion = app.events.filter(event => event.event === 'sip_completed').at(-1).properties;
  assert.equal(completion.round_complete, true, 'the player finished locally');
  assert.equal(completion.counts, false, 'daily completion telemetry must reflect the failed save');
  assert.equal(completion.new_record, false);
  assert.equal(completion.score, app.S.result.score);
});
