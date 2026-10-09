import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dayParams, keyForDay} from '../site/js/core.js';
import {SITE_URL} from '../site/js/config.js';
import {buildShareText} from '../site/js/share.js';

test('an official sip shares a /100 score, one truthful strip, and the exact challenge link', () => {
  const P = dayParams(1);
  const text = buildShareText({num: 1, theme: P.theme,
    result: {score: 98, label: 'Perfect split', f: 0.04, counts: true},
    url: 'https://split.example/play/?day=1#result'});
  assert.equal(text, 'Split #001 · 🍺 Guinness · Old Irish pub\n98/100 · Perfect split\n⬜⬜🟩⬜⬜\nOne sip. Your turn.\nhttps://split.example/play/?day=' + keyForDay(1));
  assert.doesNotMatch(text, /98%|Preview|Practice/);
});

test('a day preview is explicitly identified without adding fake attempts', () => {
  const P = dayParams(2);
  const text = buildShareText({num: 2, theme: P.theme,
    result: {score: 41, label: 'High in the crown', f: -0.28, counts: false},
    url: 'https://split.example/?day=2', preview: true});
  assert.equal(text, 'Split #002 · 🍾 Corona · Cabo beach · Preview\n41/100 · High in the crown\n⬜🟨⬜⬜⬜\nOne sip. Your turn.\nhttps://split.example/#day2');
  assert.equal(text.split('\n').filter(line => line.includes('⬜')).length, 1);
});

test('a practice sip is labeled and an overshoot keeps the outside-band arrow', () => {
  const P = dayParams(3);
  const text = buildShareText({num: 3, theme: P.theme,
    result: {score: 0, label: 'Below the crest', f: 0.8, counts: false},
    url: 'https://split.example/'});
  assert.equal(text, 'Split #003 · 🍻 Festbier · Oktoberfest · Practice\n0/100 · Below the crest\n⬜⬜⬜⬜⬜⬇️\nOne sip. Your turn.\nhttps://split.example/?day=' + keyForDay(3));
});

const result = {score: 100, label: 'Perfect split', f: 0, counts: true};
const options = {num: 2, theme: dayParams(2).theme, result};
const lastLine = text => text.split('\n').at(-1);

test('an explicit challenge key wins over the day-number fallback and unrelated URL data', () => {
  assert.equal(lastLine(buildShareText({...options, key: '2028-02-29', url: 'https://split.example/play/?campaign=friend&day=wrong#day42'})),
    'https://split.example/play/?day=2028-02-29');
  assert.equal(lastLine(buildShareText({...options, url: 'https://split.example/play/?campaign=friend#result'})),
    'https://split.example/play/?day=' + keyForDay(2));
});

test('archives are labeled truthfully, including previously saved official results', () => {
  for (const counts of [true, false]){
    const text = buildShareText({...options, result: {...result, counts}, archive: true, key: keyForDay(2)});
    assert.match(text, / · Archive\n/);
    assert.doesNotMatch(text, /Practice|Preview|not saved/);
    assert.equal(lastLine(text), SITE_URL + '?day=' + keyForDay(2));
  }
});

test('preview status has priority and its link always opens the same unsaved preview', () => {
  const text = buildShareText({...options, preview: true, archive: true, result: {...result, counts: false}, key: keyForDay(99), url: 'https://split.example/?day=wrong#result'});
  assert.match(text, / · Preview\n/);
  assert.doesNotMatch(text, /Archive|Practice/);
  assert.equal(lastLine(text), 'https://split.example/#day2');
});

test('invalid calendar keys fall back safely without becoming URL parameters', () => {
  for (const key of ['2026-02-30', '2027-02-29', '2026-10-09&redirect=evil', '2026-10-09\nhttps://evil.example', '', null]){
    const link = lastLine(buildShareText({...options, key, url: 'https://split.example/'}));
    assert.equal(link, 'https://split.example/?day=' + keyForDay(2));
  }
});

test('malformed or non-web base URLs use the configured address and do not propagate', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,evil', 'file:///tmp/evil', 'https://', 'not a url\nhttps://evil.example', '', null]){
    const text = buildShareText({...options, url});
    assert.equal(lastLine(text), SITE_URL + '?day=' + keyForDay(2));
    assert.equal(text.split('\n').length, 5);
  }
  assert.equal(lastLine(buildShareText({...options, url: 'https://name:password@split.example/play/?tracking=1#result'})),
    'https://split.example/play/?day=' + keyForDay(2));
});
