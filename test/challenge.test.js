import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {LAUNCH} from '../site/js/config.js';
import {dayKey, dayParams, keyForDay} from '../site/js/core.js';
import {resolveChallenge, canRecordChallenge, isCalendarDateKey} from '../site/js/challenge.js';

const asLocal = (key, hour = 12, minute = 0, second = 0) => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, hour, minute, second);
};
const today = keyForDay(30), now = asLocal(today);
const moduleUrl = new URL('../site/js/challenge.js', import.meta.url).href;
const coreUrl = new URL('../site/js/core.js', import.meta.url).href;

test('today is official with or without an exact-date link', () => {
  const expected = {num: 30, key: today, kind: 'today', notice: ''};
  assert.deepEqual(resolveChallenge({now}), expected);
  assert.deepEqual(resolveChallenge({now, search: '?day=' + today}), expected);
  assert.equal(dayParams(expected.num).key, expected.key);
  assert.ok(canRecordChallenge({...expected, now}));
});

test('an older shared date keeps its exact pour and cannot record a daily score', () => {
  const key = keyForDay(2), challenge = resolveChallenge({now, search: '?day=' + key});
  assert.deepEqual(challenge, {num: 2, key, kind: 'archive', notice: ''});
  assert.equal(dayParams(challenge.num).theme.id, 'beach');
  assert.equal(canRecordChallenge({...challenge, now}), false);
});

test('date validation rejects normalized overflow, malformed values and duplicate dates', () => {
  for (const key of ['2026-02-30', '2027-02-29', '2026-13-01', '2026-00-09', '2026-10-00', '26-10-09', '2026-1-09', '2026-10-9', '2026-10-09T00:00:00Z', 'NaN', '']){
    assert.equal(isCalendarDateKey(key), false, key);
    const result = resolveChallenge({now, search: '?day=' + encodeURIComponent(key)});
    assert.equal(result.key, today, key);
    assert.equal(result.kind, 'today', key);
    assert.match(result.notice, /invalid date/, key);
  }
  assert.equal(isCalendarDateKey('2028-02-29'), true);
  const duplicate = resolveChallenge({now, search: '?day=' + today + '&day=' + today});
  assert.match(duplicate.notice, /invalid date/);
});

test('a real leap-day challenge resolves to that date instead of March 1', () => {
  let year = Number(LAUNCH.slice(0, 4)) + 1;
  while (year % 4 || (!(year % 100) && year % 400)) year++;
  const key = year + '-02-29';
  const challenge = resolveChallenge({now: asLocal(year + '-03-01'), search: '?day=' + key});
  assert.equal(challenge.key, key);
  assert.equal(challenge.kind, 'archive');
  assert.equal(dayParams(challenge.num).key, key);
});

test('future and prelaunch requests recover to today with an explanation', () => {
  const future = resolveChallenge({now, search: '?day=' + keyForDay(32)});
  assert.equal(future.key, today);
  assert.equal(future.kind, 'today');
  assert.match(future.notice, /hasn’t arrived/);
  const before = resolveChallenge({now, search: '?day=' + keyForDay(0)});
  assert.equal(before.key, today);
  assert.match(before.notice, /before our first sip/);
});

test('design previews take priority and stay separate from official challenge links', () => {
  for (const [hash, num] of [['#day1', 1], ['#day0002', 2], ['#day9999', 9999]]){
    const challenge = resolveChallenge({now, search: '?day=' + today, hash});
    assert.deepEqual(challenge, {num, key: keyForDay(num), kind: 'preview', notice: ''});
    assert.equal(canRecordChallenge({...challenge, now}), false);
  }
  for (const hash of ['#day0', '#day10000', '#day-1', '#dayInfinity', '#day2x']){
    const challenge = resolveChallenge({now, hash});
    assert.equal(challenge.kind, 'today', hash);
    assert.equal(challenge.key, today, hash);
    assert.match(challenge.notice, /preview is unavailable/);
  }
});

test('before launch, visitors can only play clearly labeled previews', () => {
  const before = asLocal(keyForDay(0));
  const challenge = resolveChallenge({now: before, search: '?day=' + LAUNCH});
  assert.equal(challenge.num, 1);
  assert.equal(challenge.key, LAUNCH);
  assert.equal(challenge.kind, 'preview');
  assert.match(challenge.notice, /The daily run starts/);
  assert.equal(canRecordChallenge({...challenge, now: before}), false);
  const selectedPreview = resolveChallenge({now: before, hash: '#day3'});
  assert.equal(selectedPreview.num, 3);
  assert.equal(selectedPreview.kind, 'preview');
  assert.match(selectedPreview.notice, /The daily run starts/);
});

test('recording checks the local date again when a sip crosses midnight', () => {
  const challenge = resolveChallenge({now: asLocal(today, 23, 59, 59)});
  assert.ok(canRecordChallenge({...challenge, now: asLocal(today, 23, 59, 59)}));
  assert.equal(canRecordChallenge({...challenge, now: asLocal(keyForDay(31), 0)}), false);
  assert.equal(canRecordChallenge({key: today, kind: 'archive', now}), false);
  assert.equal(canRecordChallenge({key: today, kind: 'preview', now}), false);
  assert.equal(canRecordChallenge({key: keyForDay(0), kind: 'today', now: asLocal(keyForDay(0))}), false);
  assert.equal(canRecordChallenge({key: '2026-02-30', kind: 'today', now}), false);
});

test('the daily clock is local while the same shared challenge survives different timezones', () => {
  const instant = today + 'T01:00:00Z', sharedKey = keyForDay(2);
  for (const [tz, expectedToday] of [['America/Los_Angeles', keyForDay(29)], ['America/New_York', keyForDay(29)], ['Pacific/Auckland', today], ['Asia/Kathmandu', today]]){
    const script = `import {resolveChallenge} from ${JSON.stringify(moduleUrl)};
      const now = new Date(${JSON.stringify(instant)});
      console.log(JSON.stringify({today:resolveChallenge({now}),shared:resolveChallenge({now,search:${JSON.stringify('?day=' + sharedKey)}})}));`;
    const result = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', script], {encoding: 'utf8', env: {...process.env, TZ: tz}}));
    assert.equal(result.today.key, expectedToday, tz);
    assert.equal(result.shared.key, sharedKey, tz);
    assert.equal(result.shared.num, 2, tz);
    assert.equal(result.shared.kind, 'archive', tz);
  }
});

test('a friend one timezone-day ahead shares the same pour as an unsaved preview', () => {
  const instant = today + 'T01:00:00Z';
  const run = (tz, search = '') => {
    const script = `import {resolveChallenge,canRecordChallenge} from ${JSON.stringify(moduleUrl)};
      import {dayParams} from ${JSON.stringify(coreUrl)};
      const now = new Date(${JSON.stringify(instant)});
      const challenge = resolveChallenge({now,search:${JSON.stringify(search)}});
      console.log(JSON.stringify({challenge,params:dayParams(challenge.num),counts:canRecordChallenge({...challenge,now})}));`;
    return JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', script], {encoding: 'utf8', env: {...process.env, TZ: tz}}));
  };
  const sender = run('Pacific/Auckland');
  const recipient = run('America/Los_Angeles', '?day=' + sender.challenge.key);
  assert.equal(sender.challenge.kind, 'today');
  assert.equal(sender.counts, true);
  assert.equal(recipient.challenge.kind, 'preview');
  assert.equal(recipient.counts, false);
  assert.match(recipient.challenge.notice, /friend’s glass arrives here tomorrow/);
  assert.deepEqual(recipient.params, sender.params);
  assert.equal(resolveChallenge({now:asLocal(sender.challenge.key), search:'?day=' + sender.challenge.key}).kind, 'today');
});

test('spring and autumn DST rollovers advance one calendar challenge at local midnight', () => {
  const year = Number(LAUNCH.slice(0, 4)) + 1;
  const springDay = 8 + (7 - new Date(Date.UTC(year, 2, 1)).getUTCDay()) % 7;
  const autumnDay = 1 + (7 - new Date(Date.UTC(year, 10, 1)).getUTCDay()) % 7;
  const script = `import {resolveChallenge,canRecordChallenge} from ${JSON.stringify(moduleUrl)};
    import {dayKey} from ${JSON.stringify(coreUrl)};
    const output = [[2,${springDay}],[10,${autumnDay}]].map(([month,date])=>{
      const start = new Date(${year},month,date,0);
      const before = new Date(${year},month,date,23,59,59);
      const after = new Date(${year},month,date+1,0);
      const challenge = resolveChallenge({now:before});
      return {hours:(after-start)/3600000,key:challenge.key,expected:dayKey(before),
        increment:resolveChallenge({now:after}).num-challenge.num,
        before:canRecordChallenge({...challenge,now:before}),after:canRecordChallenge({...challenge,now:after})};
    });console.log(JSON.stringify(output));`;
  const results = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', script], {encoding: 'utf8', env: {...process.env, TZ: 'America/New_York'}}));
  assert.deepEqual(results.map(r => r.hours), [23, 25]);
  for (const result of results){
    assert.equal(result.key, result.expected);
    assert.equal(result.increment, 1);
    assert.equal(result.before, true);
    assert.equal(result.after, false);
  }
});
