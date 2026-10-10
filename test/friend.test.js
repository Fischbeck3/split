import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dayParams, keyForDay, scoreFromOffset, startLevel, DRAIN_LEVEL} from '../site/js/core.js';
import {readFriendChallenge, comparisonCopy} from '../site/js/friend.js';

function challenge(num = 1, f = 0.15, options = {}){
  const P = dayParams(num), score = scoreFromOffset(f, P.theme.target).score;
  const p = new URLSearchParams({day:P.key, vs:String(score), f:String(f), glass:P.theme.id, sip:'daily', empty:'0'});
  return {search:'?' + p, hash:'', key:P.key, num, theme:P.theme, ...options};
}
function changed(input, changes){
  const p = new URLSearchParams(input.search);
  for (const [field, value] of Object.entries(changes)) value === null ? p.delete(field) : p.set(field, value);
  return {...input, search:'?' + p};
}

test('a shared sip resolves to the same seeded glass and physical stopping line', () => {
  for (const num of [1, 2, 3, 4, 5, 6, 12]){
    const P = dayParams(num), input = challenge(num);
    const before = dayParams(num);
    assert.deepEqual(readFriendChallenge(input), {score:78, f:0.15, L:P.markY + 0.15 * P.markH, drained:false, kind:'daily'});
    assert.deepEqual(dayParams(num), before, 'reading a benchmark cannot reroll a glass');
  }
});

test('old shared links and partial benchmarks remain ordinary challenge links', () => {
  const input = challenge();
  assert.equal(readFriendChallenge({...input, search:'?day=' + input.key}), null);
  assert.equal(readFriendChallenge({...input, search:''}), null);
  for (const field of ['vs', 'f', 'glass', 'sip', 'empty']) assert.equal(readFriendChallenge(changed(input, {[field]:null})), null, field);
});

test('old unsaved preview benchmarks cannot attach a different glass to the updated opening lineup', () => {
  assert.equal(readFriendChallenge(changed(challenge(2), {glass:'beach'})), null);
  assert.equal(readFriendChallenge(changed(challenge(3), {glass:'munich'})), null);
});

test('the benchmark needs an explicit matching date and cannot contaminate a fallback date', () => {
  const input = challenge();
  for (const day of [null, 'bad', '2026-02-30', keyForDay(2), keyForDay(0), keyForDay(99)]){
    assert.equal(readFriendChallenge(changed(input, {day})), null, String(day));
  }
  assert.equal(readFriendChallenge({...input, key:keyForDay(2)}), null);
  assert.equal(readFriendChallenge({...input, num:2, key:keyForDay(2), theme:dayParams(2).theme}), null);
});

test('hash previews accept their own explicit glass without becoming an official sip', () => {
  const input = changed(challenge(3), {day:null, sip:'preview'});
  const accepted = readFriendChallenge({...input, hash:'#day3'});
  assert.equal(accepted.kind, 'preview');
  assert.deepEqual(readFriendChallenge({...input, hash:'#day0003'}), accepted);
  for (const hash of ['', '#day2', '#day0', '#day10000', '#day-3', '#day3x', '#day3#day2', '#DAY3']){
    assert.equal(readFriendChallenge({...input, hash}), null, hash);
  }
  assert.equal(readFriendChallenge({...changed(input, {day:input.key}), hash:'#day3'}), null, 'ambiguous mixed date/hash is rejected');
  assert.equal(readFriendChallenge({...challenge(3), hash:'#day3'}), null, 'hash cannot relabel an official benchmark');
});

test('invalid preview hashes cannot carry scores into a recovered daily glass', () => {
  for (const hash of ['#day0', '#day-1', '#day2x', '#dayInfinity', '#day10000']){
    assert.equal(readFriendChallenge({...challenge(), hash}), null, hash);
  }
  assert.ok(readFriendChallenge({...challenge(), hash:'#result'}), 'unrelated anchor leaves an explicit date intact');
});

test('duplicate challenge or benchmark fields are rejected even when the values agree', () => {
  const input = challenge(), p = new URLSearchParams(input.search);
  for (const field of ['day', 'vs', 'f', 'glass', 'sip', 'empty']){
    const duplicate = new URLSearchParams(p); duplicate.append(field, p.get(field));
    assert.equal(readFriendChallenge({...input, search:'?' + duplicate}), null, field);
  }
});

test('the shared vessel must match both the current theme and that day’s seed', () => {
  const input = challenge(1);
  for (const glass of ['beach', 'Pub', '', 'pub<script>', 'pub pub']) assert.equal(readFriendChallenge(changed(input, {glass})), null, glass);
  assert.equal(readFriendChallenge({...input, theme:dayParams(2).theme}), null);
  assert.equal(readFriendChallenge({...input, theme:{id:'beach', target:'the crown'}}), null);
});

test('scores and offsets reject malformed, nonfinite and unbounded values', () => {
  const input = challenge();
  for (const vs of ['-1', '101', '1.5', '078', ' 78', '+78', 'NaN', 'Infinity', '', '0x4e']){
    assert.equal(readFriendChallenge(changed(input, {vs})), null, vs);
  }
  for (const f of ['NaN', 'Infinity', '-Infinity', '', ' 0.15', '+0.15', '0x10', '.15', '00.15', '0.15junk', '1e999', '21', '-21', '0.' + '1'.repeat(40)]){
    assert.equal(readFriendChallenge(changed(input, {f})), null, f);
  }
  assert.equal(readFriendChallenge({...input, search:'?' + 'x'.repeat(2049)}), null);
  assert.equal(readFriendChallenge({...input, hash:'#' + 'x'.repeat(33)}), null);
});

test('scores must agree with their offset, allowing only one legacy rounding point', () => {
  const input = challenge();
  assert.equal(readFriendChallenge(changed(input, {vs:'78'})).score, 78);
  assert.equal(readFriendChallenge(changed(input, {vs:'77'})).score, 77);
  assert.equal(readFriendChallenge(changed(input, {vs:'79'})).score, 79);
  for (const vs of ['76', '80', '100', '0']) assert.equal(readFriendChallenge(changed(input, {vs})), null, vs);
});

test('a valid number still cannot put the stopping line above the pour or beyond an empty glass', () => {
  const P = dayParams(2), input = challenge(2);
  const high = (startLevel(P.theme) - 0.01 - P.markY) / P.markH;
  const low = (DRAIN_LEVEL + 0.01 - P.markY) / P.markH;
  for (const f of [high, low]) assert.equal(readFriendChallenge(changed(input, {f:String(f), vs:String(scoreFromOffset(f, P.theme.target).score)})), null);
});

test('a drained sip has exactly the empty level, zero score and the game’s drain offset', () => {
  const input = changed(challenge(3), {vs:'0', f:'2', empty:'1'});
  assert.deepEqual(readFriendChallenge(input), {score:0, f:2, L:DRAIN_LEVEL, drained:true, kind:'daily'});
  for (const values of [{vs:'1'}, {f:'1.999'}, {empty:'true'}, {empty:'2'}]){
    assert.equal(readFriendChallenge(changed(input, values)), null);
  }
});

test('practice and archived sips remain labeled rather than gaining official status', () => {
  const input = challenge();
  for (const kind of ['practice', 'archive', 'archive-saved']) assert.equal(readFriendChallenge(changed(input, {sip:kind})).kind, kind);
  for (const kind of ['', 'official', 'verified', 'preview', 'global']) assert.equal(readFriendChallenge(changed(input, {sip:kind})), null, kind);
});

test('comparisons report supplied score differences truthfully without claiming verification', () => {
  assert.deepEqual(comparisonCopy({score:84}, {score:92}), {text:'You beat the shared sip by 8 points.', status:'win', label:'Beat shared sip', delta:8});
  assert.deepEqual(comparisonCopy({score:84}, {score:83}), {text:'The shared sip finished 1 point ahead.', status:'lose', label:'Shared sip wins', delta:-1});
  assert.deepEqual(comparisonCopy({score:84}, {score:84}), {text:'Same score. You matched the shared sip.', status:'tie', label:'Matched shared sip', delta:0});
  assert.equal(comparisonCopy(null, {score:84}), null);
  assert.equal(comparisonCopy({score:101}, {score:84}), null);
  assert.equal(comparisonCopy({score:84}, {score:NaN}), null);
});

function averageChallenge(num = 1){
  const f = .3 * Math.sqrt(-Math.log(97 / 100));
  return changed(challenge(num, f), {vs:'93', rounds:'96,86,97'});
}

test('a three-sip benchmark compares the rounded average and retains the true best stopping line', () => {
  for (const num of [1, 2, 3, 4, 5, 6]){
    const P = dayParams(num), input = averageChallenge(num), f = Number(new URLSearchParams(input.search).get('f'));
    assert.deepEqual(readFriendChallenge(input), {score:93, f, L:P.markY + f * P.markH, drained:false, kind:'daily',
      scoring:'average', rounds:[96, 86, 97], bestScore:97});
    for (const kind of ['practice', 'archive', 'archive-saved']) assert.equal(readFriendChallenge(changed(input, {sip:kind})).kind, kind);
    const preview = {...changed(input, {day:null, sip:'preview'}), hash:'#day' + num};
    assert.equal(readFriendChallenge(preview).scoring, 'average');
  }
});

test('three-score benchmarks reject malformed, duplicated and contradictory averages', () => {
  const input = averageChallenge();
  for (const rounds of ['', '96,86', '96,86,97,98', '096,86,97', '96, 86,97', '96,86.0,97',
    '96,+86,97', '96,-1,97', '101,86,97', 'NaN,86,97', '96;86;97', '96,86,97\n']){
    assert.equal(readFriendChallenge(changed(input, {rounds})), null, rounds);
  }
  assert.equal(readFriendChallenge(changed(input, {vs:'97'})), null, 'best score cannot masquerade as the average');
  assert.equal(readFriendChallenge(changed(input, {vs:'92'})), null, 'rounding is fixed, not a tolerance');
  assert.equal(readFriendChallenge(changed(input, {f:'0.3'})), null, 'the pictured line must correspond to the best sip');
  const p = new URLSearchParams(input.search); p.append('rounds', p.get('rounds'));
  assert.equal(readFriendChallenge({...input, search:'?' + p}), null);
});

test('best stopping lines retain only the existing one-point legacy rounding tolerance', () => {
  const input = averageChallenge();
  assert.equal(readFriendChallenge(changed(input, {rounds:'96,86,96', vs:'93'})).bestScore, 96);
  assert.equal(readFriendChallenge(changed(input, {rounds:'95,86,95', vs:'92'})), null);
});

test('an empty best glass is valid only when all three scores are zero and the drain offset is exact', () => {
  const input = changed(averageChallenge(3), {rounds:'0,0,0', vs:'0', f:'2', empty:'1'});
  assert.deepEqual(readFriendChallenge(input), {score:0, f:2, L:DRAIN_LEVEL, drained:true, kind:'daily',
    scoring:'average', rounds:[0, 0, 0], bestScore:0});
  assert.equal(readFriendChallenge(changed(input, {rounds:'0,0,1'})), null, 'rounded zero does not mean every sip was zero');
  assert.equal(readFriendChallenge(changed(input, {f:'1.999'})), null);
});

test('average comparisons use all three scores even for an older best-only v2 result', () => {
  const friend = {score:93, scoring:'average', rounds:[96, 86, 97], bestScore:97};
  const result = {version:2, done:true, score:100, rounds:[{score:100}, {score:86}, {score:96}]};
  assert.deepEqual(comparisonCopy(friend, result), {text:'You beat the shared average by 1 point.', status:'win', label:'Beat shared average', delta:1});
  assert.deepEqual(comparisonCopy(friend, {...result, rounds:[{score:90}, {score:90}, {score:90}]}),
    {text:'The shared average finished 3 points ahead.', status:'lose', label:'Shared average wins', delta:-3});
  assert.deepEqual(comparisonCopy(friend, {...result, rounds:[{score:96}, {score:86}, {score:97}]}),
    {text:'Same average. You matched the shared average.', status:'tie', label:'Matched shared average', delta:0});
  assert.deepEqual(comparisonCopy({score:93}, result),
    {text:'You beat the shared sip by 1 point.', status:'win', label:'Beat shared sip', delta:1});
});
