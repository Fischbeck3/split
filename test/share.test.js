import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dayParams, keyForDay, scoreFromOffset, widthAt, DRAIN_LEVEL} from '../site/js/core.js';
import {SITE_URL} from '../site/js/config.js';
import {buildShareText, drawShareCard} from '../site/js/share.js';
import {readFriendChallenge} from '../site/js/friend.js';

const benchmarkLink = (base, {num, score = 100, f = 0, kind = 'daily', preview = false, drained = false}) => {
  const link = new URL(base);
  if (!preview) link.searchParams.set('day', keyForDay(num));
  link.searchParams.set('vs', String(score)); link.searchParams.set('f', String(f));
  link.searchParams.set('glass', dayParams(num).theme.id); link.searchParams.set('sip', kind);
  link.searchParams.set('empty', drained ? '1' : '0');
  if (preview) link.hash = 'day' + num;
  return link.href;
};

test('an official sip shares a /100 score, one truthful strip, and the exact challenge link', () => {
  const P = dayParams(1);
  const text = buildShareText({num: 1, theme: P.theme,
    result: {score: 98, label: 'Perfect split', f: 0.04, counts: true},
    url: 'https://split.example/play/?day=1#result'});
  assert.equal(text, 'Split #001 · 🍺 Guinness · Old Irish pub\n98/100 · Perfect split\n⬜⬜🟩⬜⬜\nBeat my sip. One sip. Your turn.\n' + benchmarkLink('https://split.example/play/', {num:1, score:98, f:0.04}));
  assert.doesNotMatch(text, /98%|Preview|Practice/);
});

test('a day preview is explicitly identified without adding fake attempts', () => {
  const P = dayParams(2);
  const text = buildShareText({num: 2, theme: P.theme,
    result: {score: 42, label: 'High in the crown', f: -0.28, counts: false},
    url: 'https://split.example/?day=2', preview: true});
  assert.equal(text, 'Split #002 · 🍾 Corona · Cabo beach · Preview\n42/100 · High in the crown\n⬜🟨⬜⬜⬜\nBeat my sip. One sip. Your turn.\n' + benchmarkLink('https://split.example/', {num:2, score:42, f:-0.28, kind:'preview', preview:true}));
  assert.equal(text.split('\n').filter(line => line.includes('⬜')).length, 1);
});

test('a practice sip is labeled and an overshoot keeps the outside-band arrow', () => {
  const P = dayParams(3);
  const text = buildShareText({num: 3, theme: P.theme,
    result: {score: 0, label: 'Below the crest', f: 0.8, counts: false},
    url: 'https://split.example/'});
  assert.equal(text, 'Split #003 · 🍻 Festbier · Oktoberfest · Practice\n0/100 · Below the crest\n⬜⬜⬜⬜⬜⬇️\nBeat my sip. One sip. Your turn.\n' + benchmarkLink('https://split.example/', {num:3, score:0, f:0.8, kind:'practice'}));
});

const result = {score: 100, label: 'Perfect split', f: 0, counts: true};
const options = {num: 2, theme: dayParams(2).theme, result};
const lastLine = text => text.split('\n').at(-1);

test('an explicit challenge key wins over the day-number fallback and unrelated URL data', () => {
  assert.equal(lastLine(buildShareText({...options, key: '2028-02-29', url: 'https://split.example/play/?campaign=friend&day=wrong#day42'})),
    'https://split.example/play/?day=2028-02-29');
  assert.equal(lastLine(buildShareText({...options, url: 'https://split.example/play/?campaign=friend#result'})),
    benchmarkLink('https://split.example/play/', {num:2}));
});

test('archives are labeled truthfully, including previously saved official results', () => {
  for (const counts of [true, false]){
    const text = buildShareText({...options, result: {...result, counts}, archive: true, key: keyForDay(2)});
    assert.match(text, / · Archive\n/);
    assert.doesNotMatch(text, /Practice|Preview|not saved/);
    assert.equal(lastLine(text), benchmarkLink(SITE_URL, {num:2, kind:counts ? 'archive-saved' : 'archive'}));
  }
});

test('preview status has priority and its link always opens the same unsaved preview', () => {
  const text = buildShareText({...options, preview: true, archive: true, result: {...result, counts: false}, key: keyForDay(99), url: 'https://split.example/?day=wrong#result'});
  assert.match(text, / · Preview\n/);
  assert.doesNotMatch(text, /Archive|Practice/);
  assert.equal(lastLine(text), benchmarkLink('https://split.example/', {num:2, kind:'preview', preview:true}));
});

test('invalid calendar keys fall back safely without becoming URL parameters', () => {
  for (const key of ['2026-02-30', '2027-02-29', '2026-10-09&redirect=evil', '2026-10-09\nhttps://evil.example', '', null]){
    const link = lastLine(buildShareText({...options, key, url: 'https://split.example/'}));
    assert.equal(link, benchmarkLink('https://split.example/', {num:2}));
  }
});

test('malformed or non-web base URLs use the configured address and do not propagate', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,evil', 'file:///tmp/evil', 'https://', 'not a url\nhttps://evil.example', '', null]){
    const text = buildShareText({...options, url});
    assert.equal(lastLine(text), benchmarkLink(SITE_URL, {num:2}));
    assert.equal(text.split('\n').length, 5);
  }
  assert.equal(lastLine(buildShareText({...options, url: 'https://name:password@split.example/play/?tracking=1#result'})),
    benchmarkLink('https://split.example/play/', {num:2}));
});

test('the outbound benchmark is always this result, never an inherited friend or URL score', () => {
  const P = dayParams(1), f = -0.18, scored = scoreFromOffset(f, P.theme.target);
  const text = buildShareText({num:1, key:P.key, theme:P.theme, result:{...scored, f, counts:true},
    friend:{score:100, f:0}, url:benchmarkLink(SITE_URL, {num:1})});
  const link = new URL(lastLine(text));
  const friend = readFriendChallenge({search:link.search, hash:link.hash, key:P.key, num:1, theme:P.theme});
  assert.equal(friend.score, scored.score); assert.equal(friend.f, f);
  assert.equal(link.searchParams.getAll('vs').length, 1);
});

test('new full-precision offsets survive a share round trip without changing the stopping line', () => {
  const P = dayParams(2), f = 0.1234567890123456, scored = scoreFromOffset(f, P.theme.target);
  const text = buildShareText({num:2, key:P.key, theme:P.theme, result:{...scored, f, counts:true}});
  const link = new URL(lastLine(text));
  const friend = readFriendChallenge({search:link.search, hash:link.hash, key:P.key, num:2, theme:P.theme});
  assert.equal(friend.f, f); assert.equal(friend.L, P.markY + f * P.markH);
});

test('drained shares keep their zero score, empty line and practice status', () => {
  const P = dayParams(3);
  const text = buildShareText({num:3, key:P.key, theme:P.theme,
    result:{score:0, label:'Drank the lot', f:2, L:DRAIN_LEVEL, drained:true, counts:false}});
  assert.match(text, / · Practice\n0\/100 · Drank the lot/);
  const link = new URL(lastLine(text));
  assert.deepEqual(readFriendChallenge({search:link.search, hash:link.hash, key:P.key, num:3, theme:P.theme}),
    {score:0, f:2, L:DRAIN_LEVEL, drained:true, kind:'practice'});
});

test('inconsistent synthetic or damaged scores do not create a contradictory shared benchmark', () => {
  const text = buildShareText({...options, result:{...result, score:18, f:0}});
  assert.equal(lastLine(text), SITE_URL + '?day=' + keyForDay(2));
});

function recordingCanvas(){
  const calls = [], photoCalls = [];
  const context = log => new Proxy({}, {
    get(target, method){
      if (method in target) return target[method];
      if (method === 'measureText') return value => ({width:String(value).length * 12});
      if (method === 'createLinearGradient' || method === 'createRadialGradient') return () => ({addColorStop(){}});
      return (...args) => log.push([method, ...args]);
    },
    set(target, property, value){target[property] = value; return true;}
  });
  const cardContext = context(calls), photoContext = context(photoCalls);
  return {calls, photoCalls, canvas:{getContext:() => cardContext,
    ownerDocument:{createElement:() => ({getContext:() => photoContext})}}};
}

test('comparison postcards keep both true stopping lines and distinct readable labels on the original vessel', () => {
  for (const num of [1, 2, 3]){
    const P = dayParams(num), f = 0.08, result = {...scoreFromOffset(f, P.theme.target), f, L:P.markY + f * P.markH, counts:true};
    for (const sharedOffset of [0, 2]){
      const friend = sharedOffset === 2 ? {score:0, f:2, L:DRAIN_LEVEL, drained:true, kind:'daily'} : {score:100, f:0, L:P.markY, drained:false, kind:'daily'};
      const recording = recordingCanvas();
      drawShareCard(recording.canvas, {num, key:P.key, theme:P.theme, P, result, friend});
      assert.equal(recording.canvas.width, 1080); assert.equal(recording.canvas.height, 1350);
      const text = label => recording.photoCalls.find(call => call[0] === 'fillText' && call[1] === label);
      const sharedLabel = text('SHARED ' + friend.score), markLabel = text('MARK'), stopLabel = text('STOP');
      assert.ok(sharedLabel); assert.ok(markLabel); assert.ok(stopLabel);
      assert.ok(Math.abs(sharedLabel[3] - markLabel[3]) >= 55, 'shared and mark labels do not overlap');
      assert.equal(stopLabel[3], 48 + result.L * (690 - 48), 'your stop guide keeps your actual beer level');
      const halfW = P.theme.vessel === 'bottle' ? 128 : P.theme.vessel === 'stein' ? 200 : 190;
      const sharedW = widthAt(P.theme.vessel, friend.L) * halfW, sharedY = 48 + friend.L * (690 - 48);
      assert.ok(recording.photoCalls.some(call => call[0] === 'moveTo' && call[1] === 500 - sharedW && call[2] === sharedY));
      assert.ok(recording.photoCalls.some(call => call[0] === 'lineTo' && call[1] === 500 + sharedW && call[2] === sharedY));
      assert.ok(recording.calls.some(call => call[0] === 'fillText' && call[1] === 'You ' + result.score + ' · Shared sip ' + friend.score));
    }
  }
});
