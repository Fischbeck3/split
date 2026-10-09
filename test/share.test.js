import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dayParams} from '../site/js/core.js';
import {buildShareText} from '../site/js/share.js';

test('an official sip shares a /100 score, one truthful strip, and a canonical link', () => {
  const P = dayParams(1);
  const text = buildShareText({num: 1, theme: P.theme,
    result: {score: 98, label: 'Perfect split', f: 0.04, counts: true},
    url: 'https://split.example/play/?day=1#result'});
  assert.equal(text, 'Split #001 · 🍺 Guinness · Pub night\n98/100 · Perfect split\n⬜⬜🟩⬜⬜\nOne sip. Your turn.\nhttps://split.example/play/');
  assert.doesNotMatch(text, /98%|Preview|Practice/);
});

test('a day preview is explicitly identified without adding fake attempts', () => {
  const P = dayParams(2);
  const text = buildShareText({num: 2, theme: P.theme,
    result: {score: 41, label: 'High in the crown', f: -0.28, counts: false},
    url: 'https://split.example/?day=2', preview: true});
  assert.equal(text, 'Split #002 · 🍾 Corona · Beach day · Preview\n41/100 · High in the crown\n⬜🟨⬜⬜⬜\nOne sip. Your turn.\nhttps://split.example/');
  assert.equal(text.split('\n').filter(line => line.includes('⬜')).length, 1);
});

test('a practice sip is labeled and an overshoot keeps the outside-band arrow', () => {
  const P = dayParams(3);
  const text = buildShareText({num: 3, theme: P.theme,
    result: {score: 0, label: 'Below the crest', f: 0.8, counts: false},
    url: 'https://split.example/'});
  assert.equal(text, 'Split #003 · 🍻 Festbier · Oktoberfest · Practice\n0/100 · Below the crest\n⬜⬜⬜⬜⬜⬇️\nOne sip. Your turn.\nhttps://split.example/');
});
