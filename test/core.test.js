import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LAUNCH, SCHEDULE} from '../site/js/themes.js';
import {THEMES, PROFILES, themeById, themeForDay, dayParams, dayNumber, keyForDay, startLevel, flowFactor, tiltRate,
  secondsToMark, scoreFromOffset, bandEmoji, detailText, DRAIN_LEVEL, PERFECT, SPLIT} from '../site/js/core.js';
import {SCENES, MARKS} from '../site/js/draw.js';

const DAYS = Array.from({length: 400}, (_, i) => i + 1);

test('the first days follow the plan: pub, beach, Munich', () => {
  assert.deepEqual(SCHEDULE.map((_, i) => themeForDay(i + 1).id), ['pub', 'beach', 'munich']);
});

test('day No. 1 is the launch date', () => {
  const [y, m, d] = LAUNCH.split('-').map(Number);
  assert.equal(keyForDay(1), LAUNCH);
  assert.equal(dayNumber(new Date(y, m - 1, d, 0, 1)), 1);
  assert.equal(dayNumber(new Date(y, m - 1, d, 23, 59)), 1);
  assert.equal(dayNumber(new Date(y, m - 1, d + 1, 0, 1)), 2);
});

test('every theme is complete and uses a vessel, place and mark the game can draw', () => {
  const ids = new Set();
  for (const t of THEMES){
    assert.ok(!ids.has(t.id), 'duplicate id ' + t.id); ids.add(t.id);
    assert.ok(PROFILES[t.vessel], t.id + ': unknown vessel ' + t.vessel);
    assert.ok(SCENES.includes(t.scene), t.id + ': unknown scene ' + t.scene);
    assert.ok(MARKS.includes(t.mark), t.id + ': unknown mark ' + t.mark);
    if (t.mark === 'letter') assert.equal(typeof t.letter, 'string', t.id + ': letter mark needs a letter');
    for (const c of [...t.body, t.head, t.markFill, t.markStroke]) assert.match(c, /^#[0-9a-f]{6}$/i, t.id + ': color ' + c);
    assert.ok(t.label && t.line && t.target && t.name, t.id + ': missing text');
    assert.ok(t.headT > 0 && t.headT < 0.3, t.id + ': head thickness');
    assert.ok(t.speed > 0, t.id + ': speed');
  }
  for (const id of SCHEDULE) assert.ok(themeById(id), 'SCHEDULE names a missing theme: ' + id);
});

test('the same day always pours the same glass', () => {
  for (const n of [1, 2, 3, 4, 50, 365]) assert.deepEqual(dayParams(n), dayParams(n));
});

test('no glass two days running, and every glass turns up', () => {
  const seen = new Set();
  for (const n of DAYS){
    seen.add(themeForDay(n).id);
    assert.notEqual(themeForDay(n).id, themeForDay(n + 1).id, 'day ' + n + ' and ' + (n + 1));
  }
  assert.equal(seen.size, THEMES.length);
});

test('every mark sits below the start line and above the bottom', () => {
  for (const n of [-3, 0, ...DAYS]){
    const P = dayParams(n), top = P.markY - P.markH / 2, bottom = P.markY + P.markH / 2;
    assert.ok(top > startLevel(P.theme) + 0.05, 'day ' + n + ' (' + P.theme.id + '): mark starts too high');
    assert.ok(bottom < DRAIN_LEVEL - 0.05, 'day ' + n + ' (' + P.theme.id + '): mark sits too low');
  }
});

test('reaching the mark takes a real sip, not a flick and not a chore', () => {
  for (const n of DAYS){
    const P = dayParams(n), s = secondsToMark(P);
    assert.ok(s > 1.2 && s < 8, 'day ' + n + ' (' + P.theme.id + '): ' + s.toFixed(2) + ' s');
  }
});

test('a bottle neck drains fast and a stein drinks slow', () => {
  const beach = themeById('beach'), pub = themeById('pub'), munich = themeById('munich');
  assert.ok(flowFactor(beach, 0.57, 0.1) > 2.5 * flowFactor(beach, 0.57, 0.57));
  assert.ok(flowFactor(munich, 0.56, 0.56) < flowFactor(pub, 0.56, 0.56));
});

test('tilt: nothing until 15 degrees, full rate at 40, capped beyond', () => {
  assert.equal(tiltRate(0.15, 10), 0);
  assert.equal(tiltRate(0.15, 15), 0);
  assert.ok(Math.abs(tiltRate(0.15, 40) - 0.15) < 1e-9);
  assert.equal(tiltRate(0.15, 90), tiltRate(0.15, 55));
});

test('scoring bands', () => {
  assert.deepEqual(scoreFromOffset(0, 'the G'), {score: 100, label: 'Perfect split', tone: 'good'});
  assert.equal(scoreFromOffset(PERFECT, 'the G').label, 'Perfect split');
  assert.equal(scoreFromOffset(PERFECT + 0.001, 'the G').label, 'Split');
  assert.equal(scoreFromOffset(SPLIT, 'the G').label, 'Split');
  assert.equal(scoreFromOffset(0.3, 'the G').label, 'Low in the G');
  assert.equal(scoreFromOffset(-0.3, 'the G').label, 'High in the G');
  assert.equal(scoreFromOffset(0.6, 'the crest').label, 'Below the crest');
  assert.equal(scoreFromOffset(-0.6, 'the crown').tone, 'miss');
  let last = 101;
  for (let a = 0; a <= 1; a += 0.02){ const s = scoreFromOffset(a, 'x').score; assert.ok(s <= last); last = s; }
});

test('the emoji strip shows where the line landed', () => {
  assert.equal(bandEmoji(0), '⬜⬜🟩⬜⬜');
  assert.equal(bandEmoji(0.2), '⬜⬜⬜🟨⬜');
  assert.equal(bandEmoji(-0.4), '🟧⬜⬜⬜⬜');
  assert.ok(bandEmoji(-0.7).startsWith('⬆️'));
  assert.ok(bandEmoji(0.7).endsWith('⬇️'));
  assert.equal(detailText(0.123, false), '12% low.');
  assert.equal(detailText(0, true), 'You drank the lot.');
});
