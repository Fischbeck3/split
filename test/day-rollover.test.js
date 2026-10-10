import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dayParams} from '../site/js/core.js';
import {resolveChallenge} from '../site/js/challenge.js';
import {controllerApp, browserStorage} from './helpers/controller-app.js';

// The reported failure happened at local midnight in Phoenix. Fix the test
// worker's date context rather than depending on the execution host's timezone.
process.env.TZ = 'America/Phoenix';
const before = new Date('2026-10-09T23:59:59-07:00');
const after = new Date('2026-10-10T00:00:01-07:00');

test('an idle daily root tab requests today once at local midnight without writing a record', () => {
  const app = controllerApp({P:dayParams(1), calendarDate:before});
  app.clock();
  assert.equal(app.reloads.length, 0);
  app.setCalendar(after); app.clock(); app.clock();
  assert.equal(app.reloads.length, 1, 'an overnight Day 1 root must reload into the current Day 2');
  assert.equal(app.S.switchingDay, true);
  assert.equal(app.storage.writes.length, 0, 'automatic date changes never reserve or complete a sip');
});

test('a hidden daily tab defers switching until its genuine visibility-return handler runs', () => {
  const storage = browserStorage([['split.motion.v1','reduced'],['split.sound.v1','on']]);
  const app = controllerApp({P:dayParams(1), calendarDate:before, storage});
  app.visibility(true); app.setCalendar(after); app.clock(); app.pageshow();
  assert.equal(app.reloads.length, 0, 'a hidden document cannot interrupt another visible task');
  assert.equal(app.S.followToday, true, 'deferral preserves automatic follow on the return');
  app.visibility(false); app.clock();
  assert.equal(app.reloads.length, 1);
  assert.equal(storage.writes.length, 0);
  assert.equal(storage.values.get('split.motion.v1'), 'reduced');
  assert.equal(storage.values.get('split.sound.v1'), 'on');
});

test('a browser-restored daily root detects its new date through pageshow even without a timer tick', () => {
  const app = controllerApp({P:dayParams(1), calendarDate:before});
  app.setCalendar(after); app.pageshow({persisted:true}); app.pageshow({persisted:true});
  assert.equal(app.reloads.length, 1, 'the bfcache lifecycle handler is wired to the real daily clock');
  assert.equal(app.S.switchingDay, true);
  assert.equal(app.storage.writes.length, 0);
});

test('a stale Start click initiates the daily switch and aborts preparation before consuming a sip', () => {
  const app = controllerApp({P:dayParams(1), calendarDate:before});
  app.setCalendar(after); app.begin(); app.begin();
  assert.equal(app.reloads.length, 1);
  assert.equal(app.S.state, 'intro', 'the old Guinness glass never enters preparation');
  assert.equal(app.S.progress, null);
  assert.equal(app.S.roundToken, null);
  assert.equal(app.S.holding, false);
  assert.equal(app.storage.writes.length, 0);
  assert.equal(app.events.filter(event => event.event === 'sip_started').length, 0);
});

test('a completed daily result advances overnight without changing its saved score or adding an event', () => {
  const app = controllerApp({P:dayParams(1), calendarDate:before});
  app.sip(30); app.sip(30); app.sip(30);
  assert.equal(app.S.state, 'result');
  const saved = structuredClone(app.read()), writes = app.storage.writes.length;
  const completions = app.events.filter(event => event.event === 'sip_completed').length;
  app.setCalendar(after); app.clock(); app.pageshow();
  assert.equal(app.reloads.length, 1);
  assert.deepEqual(app.read(), saved);
  assert.equal(app.storage.writes.length, writes);
  assert.equal(app.events.filter(event => event.event === 'sip_completed').length, completions);
});

test('an in-flight share or postcard save defers the idle switch and permits it when the action finishes', () => {
  for (const action of ['shareBtn','saveCardBtn']){
    const app = controllerApp({P:dayParams(1), calendarDate:before});
    app.S.state = 'result'; app.element(action).disabled = true;
    app.setCalendar(after); app.clock(); app.pageshow();
    assert.equal(app.reloads.length, 0, action + ': automatic navigation must leave the current operation intact');
    assert.equal(app.S.followToday, true, action + ': busy deferral retains daily following');
    app.element(action).disabled = false; app.clock(); app.clock();
    assert.equal(app.reloads.length, 1, action + ': the next idle clock tick advances the glass once');
    assert.equal(app.storage.writes.length, 0);
  }
});

test('all active sip phases preserve the current glass and progress as an unsaved archive across midnight', () => {
  const prepare = {
    approaching:app => app.begin(),
    ready:app => { app.begin(); app.ready(); },
    drinking:app => { app.begin(); app.ready(); app.press(); app.advance(10); },
    locked:app => { app.begin(); app.ready(); app.press(); app.advance(10); app.release(); },
    between:app => app.sip(30),
    blocked:app => { app.S.state = 'blocked'; }
  };
  for (const [phase, start] of Object.entries(prepare)){
    const app = controllerApp({P:dayParams(1), calendarDate:before});
    start(app); assert.equal(app.S.state, phase);
    const progress = structuredClone(app.S.progress), token = app.S.roundToken, writes = app.storage.writes.length;
    app.setCalendar(after); app.clock(); app.pageshow(); app.visibility(false);
    assert.equal(app.reloads.length, 0, phase + ': an active round cannot be replaced');
    assert.equal(app.S.state, phase);
    assert.equal(app.S.kind, 'archive');
    assert.equal(app.S.followToday, false);
    assert.equal(app.S.theme.id, 'pub');
    assert.equal(app.S.P.theme.id, 'pub');
    assert.equal(app.S.roundToken, token);
    assert.deepEqual(structuredClone(app.S.progress), progress);
    assert.equal(app.storage.writes.length, writes);
  }
});

test('an explicitly dated Day 1 share remains Guinness archive while offering today’s glass', () => {
  for (const search of ['?day=2026-10-09','?day=2026-10-09&vs=90&glass=pub']){
    const app = controllerApp({P:dayParams(1), calendarDate:before, search});
    assert.equal(app.S.followToday, false);
    app.setCalendar(after); app.clock(); app.pageshow(); app.visibility(false);
    assert.equal(app.reloads.length, 0);
    assert.equal(app.S.theme.id, 'pub');
    assert.equal(app.S.kind, 'archive');
    assert.equal(app.element('introTodayBtn').hidden, false);
    assert.equal(app.storage.writes.length, 0);
  }
});

test('invalid, duplicate and recovered date links continue following the real daily root', () => {
  for (const search of ['?day=broken','?day=2026-10-09&day=2026-10-09','?day=2026-10-08','?day=2026-10-20']){
    const challenge = resolveChallenge({now:before, search});
    assert.equal(challenge.key, '2026-10-09', search);
    const app = controllerApp({P:dayParams(challenge.num), calendarDate:before, search});
    assert.equal(app.S.followToday, true, search + ': a fallback link is not a pinned archive');
    app.setCalendar(after); app.clock();
    assert.equal(app.reloads.length, 1, search);
    assert.equal(app.storage.writes.length, 0);
  }
});

test('admin review and explicit hash previews, including leading zeros, keep their chosen glass across midnight', () => {
  for (const options of [{review:true, kind:'preview', hash:'#admin/pub'},
    {kind:'preview', hash:'#day1'}, {kind:'preview', hash:'#day0002', P:dayParams(2)}]){
    const app = controllerApp({P:dayParams(1), calendarDate:before, ...options});
    assert.equal(app.S.followToday, false);
    app.setCalendar(after); app.clock(); app.pageshow(); app.visibility(false);
    assert.equal(app.reloads.length, 0);
    assert.equal(app.S.kind, 'preview');
    assert.equal(app.S.theme.id, options.P?.theme.id || 'pub');
    assert.equal(app.storage.writes.length, 0);
  }
});

test('unavailable hash previews recover to the daily glass and keep following the date', () => {
  for (const hash of ['#day0','#day10000','#dayinvalid']){
    const challenge = resolveChallenge({now:before, hash});
    assert.equal(challenge.kind, 'today');
    const app = controllerApp({P:dayParams(challenge.num), kind:challenge.kind, calendarDate:before, hash});
    assert.equal(app.S.designPreview, false, hash + ': unavailable previews cannot pin the fallback glass');
    assert.equal(app.S.followToday, true);
    app.setCalendar(after); app.clock();
    assert.equal(app.reloads.length, 1, hash);
    assert.equal(app.storage.writes.length, 0);
  }
});

test('an undated opening preview switches into today even when its initial day key already matches', () => {
  const app = controllerApp({P:dayParams(1), kind:'preview', hash:'', calendarDate:new Date('2026-10-08T23:59:59-07:00')});
  app.clock(); assert.equal(app.reloads.length, 0);
  app.setCalendar(new Date('2026-10-09T00:00:01-07:00')); app.clock();
  assert.equal(app.S.key, '2026-10-09');
  assert.equal(app.reloads.length, 1, 'the preview/today status change requires fresh official initialization');
  assert.equal(app.storage.writes.length, 0);
});

test('fresh initialization after a rollover preserves the fixed Guinness, Peroni and Sapporo dates and pours', () => {
  for (const [date, num, id] of [['2026-10-09',1,'pub'],['2026-10-10',2,'peroni'],['2026-10-11',3,'sapporo']]){
    const now = new Date(date + 'T00:00:01-07:00'), challenge = resolveChallenge({now});
    const original = dayParams(num), app = controllerApp({P:dayParams(challenge.num), calendarDate:now});
    assert.equal(challenge.num, num);
    assert.equal(challenge.key, date);
    assert.equal(challenge.kind, 'today');
    assert.equal(app.S.theme.id, id);
    assert.deepEqual(app.S.baseP, original, 'rollover never rerolls the released target or fluid parameters');
    app.clock(); app.pageshow();
    assert.equal(app.reloads.length, 0, 'a fresh current-day page cannot reload in a loop');
    assert.equal(app.storage.writes.length, 0);
  }
});
