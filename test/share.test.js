import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dayParams, keyForDay, scoreFromOffset, DRAIN_LEVEL} from '../site/js/core.js';
import {renderVessel, renderWidthAt} from '../site/js/render-vessels.js';
import {SITE_URL} from '../site/js/config.js';
import {buildShareText, drawShareCard} from '../site/js/share.js';
import {readFriendChallenge} from '../site/js/friend.js';
import {shareResultText} from '../site/js/share-actions.js';

const benchmarkLink = (base, {num, score = 100, f = 0, kind = 'daily', preview = false, drained = false, rounds = null}) => {
  const link = new URL(base);
  if (!preview) link.searchParams.set('day', keyForDay(num));
  link.searchParams.set('vs', String(score)); link.searchParams.set('f', String(f));
  link.searchParams.set('glass', dayParams(num).theme.id); link.searchParams.set('sip', kind);
  link.searchParams.set('empty', drained ? '1' : '0');
  if (rounds) link.searchParams.set('rounds', rounds.join(','));
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
    result: {score: 42, label: 'High in the P', f: -0.28, counts: false},
    url: 'https://split.example/?day=2', preview: true});
  assert.equal(text, 'Split #002 · 🍺 Peroni · Trastevere sunset · Preview\n42/100 · High in the P\n⬜🟨⬜⬜⬜\nBeat my sip. One sip. Your turn.\n' + benchmarkLink('https://split.example/', {num:2, score:42, f:-0.28, kind:'preview', preview:true}));
  assert.equal(text.split('\n').filter(line => line.includes('⬜')).length, 1);
});

test('a practice sip is labeled and an overshoot keeps the outside-band arrow', () => {
  const P = dayParams(3);
  const text = buildShareText({num: 3, theme: P.theme,
    result: {score: 0, label: 'Below the star', f: 0.8, counts: false},
    url: 'https://split.example/'});
  assert.equal(text, 'Split #003 · 🍺 Sapporo · Tokyo izakaya · Practice\n0/100 · Below the star\n⬜⬜⬜⬜⬜⬇️\nBeat my sip. One sip. Your turn.\n' + benchmarkLink('https://split.example/', {num:3, score:0, f:0.8, kind:'practice'}));
});

const result = {score: 100, label: 'Perfect split', f: 0, counts: true};
const options = {num: 2, theme: dayParams(2).theme, result};
const lastLine = text => text.split('\n').at(-1);

function completedThree(P, {offsets = [-0.28, 0.04, 0.8], counts = true} = {}){
  const rounds = offsets.map(f => ({...scoreFromOffset(f, P.theme.target), f, L:P.markY + f * P.markH, counts}));
  const bestIndex = rounds.reduce((best, sip, index) => sip.score > rounds[best].score ? index : best, 0);
  const averageScore = Math.round(rounds.reduce((sum, sip) => sum + sip.score, 0) / 3);
  return {...rounds[bestIndex], version:2, rounds, bestIndex, done:true, scoring:'average', score:averageScore,
    averageScore, bestScore:rounds[bestIndex].score, label:'Three-sip average'};
}

test('a completed round shares its rounded average, three truthful strips and best actual line', () => {
  const P = dayParams(1), result = completedThree(P);
  const text = buildShareText({num:1, key:P.key, theme:P.theme, result});
  assert.equal(text, 'Split #001 · 🍺 Guinness · Old Irish pub\n' +
    'Average of 3 · 47/100\n' +
    '⬜🟨⬜⬜⬜  Sober 42/100\n' +
    '⬜⬜🟩⬜⬜  Tipsy 98/100 · Best\n' +
    '⬜⬜⬜⬜⬜⬇️  Drunk 0/100\n' +
    'Beat my average. Your turn.\n' + benchmarkLink(SITE_URL, {num:1, score:47, f:0.04, rounds:[42, 98, 0]}));
  const link = new URL(lastLine(text));
  const friend = readFriendChallenge({search:link.search, hash:link.hash, key:P.key, num:1, theme:P.theme});
  assert.equal(friend.score, result.score); assert.equal(friend.f, result.f); assert.equal(friend.L, result.L);
  assert.equal(friend.scoring, 'average'); assert.equal(friend.bestScore, 98); assert.deepEqual(friend.rounds, [42, 98, 0]);
  assert.equal(text.match(/ · Best/g).length, 1);
});

test('three-sip shares preserve truthful preview, practice, archive and review status', () => {
  const P = dayParams(2);
  for (const [flags, counts, status, kind] of [
    [{}, true, '', 'daily'], [{}, false, 'Practice', 'practice'],
    [{preview:true}, false, 'Preview', 'preview'],
    [{archive:true}, true, 'Archive', 'archive-saved'], [{archive:true}, false, 'Archive', 'archive'],
    [{review:true}, false, 'Review', null]
  ]){
    const result = completedThree(P, {counts});
    const text = buildShareText({num:2, key:P.key, theme:P.theme, result, ...flags});
    assert.ok(text.split('\n')[0].endsWith(status ? ' · ' + status : P.theme.label));
    assert.match(text, /\nAverage of 3 · 47\/100/);
    assert.equal(text.split('\n').filter(line => /Sober|Tipsy|Drunk/.test(line)).length, 3);
    assert.equal(lastLine(text), flags.review ? SITE_URL + '#admin/' + P.theme.id :
      benchmarkLink(SITE_URL, {num:2, score:47, f:0.04, rounds:[42, 98, 0], kind, preview:!!flags.preview}));
  }
});

test('older complete v2 best-only records derive the same truthful three-sip average', () => {
  const P = dayParams(1), current = completedThree(P);
  const {scoring, averageScore, bestScore, ...old} = current;
  old.score = current.bestScore; old.label = current.rounds[current.bestIndex].label;
  assert.equal(buildShareText({num:1, key:P.key, theme:P.theme, result:old}),
    buildShareText({num:1, key:P.key, theme:P.theme, result:current}));
  const recording = recordingCanvas();
  drawShareCard(recording.canvas, {num:1, key:P.key, theme:P.theme, P, result:old});
  assert.ok(recording.calls.some(call => call[0] === 'fillText' && call[1] === '47' && call[2] === 64));
});

test('partial or inconsistent stored rounds never advertise three finished attempts', () => {
  const P = dayParams(1), finished = completedThree(P);
  for (const result of [
    {...finished, done:false}, {...finished, rounds:finished.rounds.slice(0, 1)},
    {...finished, rounds:finished.rounds.slice(0, 2)}, {...finished, rounds:[...finished.rounds, finished.rounds[0]]},
    {...finished, bestIndex:-1}, {...finished, bestIndex:3},
    {...finished, bestIndex:0}, {...finished, drained:true},
    {...finished, score:98}, {...finished, averageScore:48}, {...finished, bestScore:97},
    {...finished, rounds:[finished.rounds[0], null, finished.rounds[2]]},
    {...finished, rounds:[finished.rounds[0], {...finished.rounds[1], L:NaN}, finished.rounds[2]]}
  ]){
    const text = buildShareText({num:1, key:P.key, theme:P.theme, result});
    assert.doesNotMatch(text, /Average of 3|Sober|Tipsy|Drunk/);
    assert.equal(text.split('\n').length, 5);
  }
});

test('native sharing sends the three-sip body and its exact-day best benchmark as separate fields', async () => {
  const P = dayParams(3), result = completedThree(P), text = buildShareText({num:3, key:P.key, theme:P.theme, result});
  const calls = [];
  await shareResultText(text, {share:async payload => calls.push(payload), get canShare(){throw new Error('Do not inspect image sharing');}});
  assert.deepEqual(calls, [{text:text.split('\n').slice(0, -1).join('\n'), url:lastLine(text)}]);
  const copies = [];
  await shareResultText(text, {clipboard:{writeText:async value => copies.push(value)}});
  assert.deepEqual(copies, [text]);
});

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
  const calls = [], photoCalls = [], textStyles = [];
  const context = (log, textStyleLog = []) => new Proxy({}, {
    get(target, method){
      if (method in target) return target[method];
      if (method === 'measureText') return value => ({width:String(value).length * 12});
      if (method === 'createLinearGradient' || method === 'createRadialGradient') return () => ({addColorStop(){}});
      return (...args) => {
        if (method === 'fillText') textStyleLog.push({text:args[0], fillStyle:target.fillStyle});
        log.push([method, ...args]);
      };
    },
    set(target, property, value){target[property] = value; return true;}
  });
  const cardContext = context(calls, textStyles), photoContext = context(photoCalls);
  return {calls, photoCalls, textStyles, canvas:{getContext:() => cardContext,
    ownerDocument:{createElement:() => ({getContext:() => photoContext})}}};
}

test('comparison postcards keep both true stopping lines and distinct readable labels on the displayed vessel', () => {
  for (const num of [1, 2, 3, 4, 5, 6]){
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
      const vessel = renderVessel(P.theme);
      const sharedW = renderWidthAt(vessel, friend.L) * halfW, sharedY = 48 + friend.L * (690 - 48);
      assert.ok(recording.photoCalls.some(call => call[0] === 'moveTo' && call[1] === 500 - sharedW && call[2] === sharedY));
      assert.ok(recording.photoCalls.some(call => call[0] === 'lineTo' && call[1] === 500 + sharedW && call[2] === sharedY));
      const markW = renderWidthAt(vessel, P.markY) * halfW, markY = 48 + P.markY * (690 - 48);
      const stopW = renderWidthAt(vessel, result.L) * halfW;
      assert.ok(recording.photoCalls.some(call => call[0] === 'lineTo' && call[1] === 500 - markW - 22 && call[2] === markY), 'mark guide meets the displayed wall');
      assert.ok(recording.photoCalls.some(call => call[0] === 'moveTo' && call[1] === 500 + stopW + 22 && call[2] === stopLabel[3]), 'stop guide meets the displayed wall');
      assert.ok(recording.calls.some(call => call[0] === 'fillText' && call[1] === 'You ' + result.score + ' · Shared sip ' + friend.score));
    }
  }
});

test('three-sip postcards show the average while clearly identifying the best photographed sip', () => {
  for (const num of [1, 2, 3, 4, 5, 6]){
    const P = dayParams(num), result = completedThree(P), recording = recordingCanvas();
    drawShareCard(recording.canvas, {num, key:P.key, theme:P.theme, P, result});
    assert.equal(recording.canvas.width, 1080); assert.equal(recording.canvas.height, 1350);
    assert.ok(recording.calls.some(call => call[0] === 'drawImage' && call[2] === 40 && call[3] === 246));
    const stop = recording.photoCalls.find(call => call[0] === 'fillText' && call[1] === 'STOP');
    assert.equal(stop[3], 48 + result.L * (690 - 48));
    assert.ok(recording.calls.some(call => call[0] === 'fillText' && call[1] === 'Average of 3'));
    assert.ok(recording.calls.some(call => call[0] === 'fillText' && call[1] === 'Best sip: Tipsy 98/100'));
    assert.ok(recording.calls.some(call => call[0] === 'fillText' && call[1] === String(result.score) && call[2] === 64));
    const stages = ['Sober 42', 'Tipsy 98 · Best', 'Drunk 0'].map(value => recording.calls.find(call => call[0] === 'fillText' && call[1] === value));
    assert.deepEqual(stages.map(call => call.slice(2)), [[770, 1080], [770, 1138], [770, 1196]]);
    const ink = recording.textStyles.find(style => style.text === 'Average of 3').fillStyle;
    for (const stage of stages) assert.equal(recording.textStyles.find(style => style.text === stage[1]).fillStyle, ink,
      'every stage caption uses the card ink, even after a colored score band');
    assert.ok(stages.every(call => call[3] > 996 && call[3] < 1230), 'all scores fit between the image and footer');
    assert.equal(recording.calls.filter(call => call[0] === 'strokeRect').length, 15, 'five physical bands for each of three sips');
    assert.ok(recording.calls.some(call => call[0] === 'fillText' && call[1] === '4% of mark low'));
    assert.ok(recording.calls.some(call => call[0] === 'fillText' && call[1] === 'Beat my average. Your turn.'));
  }
});

test('a partial round keeps the original single-sip postcard and no stage summary', () => {
  const P = dayParams(1), result = {...completedThree(P), done:false}, recording = recordingCanvas();
  drawShareCard(recording.canvas, {num:1, key:P.key, theme:P.theme, P, result});
  assert.ok(recording.calls.some(call => call[0] === 'fillText' && call[1] === 'One stopping point'));
  assert.ok(recording.calls.some(call => call[0] === 'fillText' && call[1] === String(result.score) && call[3] === 1189));
  assert.equal(recording.calls.filter(call => call[0] === 'strokeRect').length, 5);
  assert.ok(recording.calls.some(call => call[0] === 'fillText' && call[1] === 'Beat my sip. Your turn.'));
  assert.ok(!recording.calls.some(call => call[0] === 'fillText' && /Average of 3|Sober|Tipsy|Drunk/.test(call[1])));
});

test('average comparison postcards label the shared best line separately from the shared average', () => {
  const P = dayParams(1), result = completedThree(P), recording = recordingCanvas();
  const friend = {score:93, f:0.052, L:P.markY + 0.052 * P.markH, drained:false, kind:'daily', scoring:'average', rounds:[96, 86, 97], bestScore:97};
  drawShareCard(recording.canvas, {num:1, key:P.key, theme:P.theme, P, result, friend});
  const sharedLabel = recording.photoCalls.find(call => call[0] === 'fillText' && call[1] === 'SHARED BEST 97');
  assert.ok(sharedLabel);
  assert.ok(recording.calls.some(call => call[0] === 'fillText' && call[1] === 'You 47 · Shared average 93'));
  assert.ok(!recording.photoCalls.some(call => call[0] === 'fillText' && call[1] === 'SHARED 93'));
});
