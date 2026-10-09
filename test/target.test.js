import {test} from 'node:test';
import assert from 'node:assert/strict';
import {THEMES, dayParams, scoreFromOffset, widthAt} from '../site/js/core.js';
import {CONCEPT_CHAPTERS, conceptParams} from '../site/js/concepts.js';
import {TARGET_HINT_MS, targetGeometry, targetHintOpacity} from '../site/js/target.js';

const conceptOptions = CONCEPT_CHAPTERS.flatMap(chapter => chapter.options);
// Include each catalog theme's extreme seeded mark positions and heights, the
// six pinned glasses, and every studio option rather than just one lucky seed.
const parameters = [
  ...THEMES.flatMap(theme => theme.markRange.flatMap(markY => theme.markHRange.map(markH => ({theme, markY, markH})))),
  ...[1, 2, 3, 4, 5, 6].map(dayParams),
  ...conceptOptions.map(conceptParams)
];

function liveBox(w, h, theme, concept = false){
  const bottle = theme.vessel === 'bottle', stein = theme.vessel === 'stein';
  const handled = stein || theme.vessel === 'mug';
  const top = h * (concept ? bottle ? .285 : .335 : bottle ? .235 : stein ? .29 : .26);
  const bot = h * (concept ? .805 : h < 740 ? .625 : .665);
  const halfW = concept ? Math.min(w * .29, (bot - top) * (bottle ? .19 : handled ? .32 : .28))
    : Math.min(w * (stein ? .27 : theme.box.w), (bot - top) * theme.box.h);
  return {cx:w / 2 - (handled ? halfW * .24 : 0), top, bot, halfW, glass:theme.vessel};
}

function boxes(P){
  const concept = P.theme.id.startsWith('concept-');
  return [
    liveBox(280, 400, P.theme, concept),
    liveBox(375, 667, P.theme, concept),
    liveBox(560, 900, P.theme, concept),
    {cx:500, top:48, bot:690, halfW:P.theme.vessel === 'bottle' ? 128 : P.theme.vessel === 'stein' ? 200 : 190, glass:P.theme.vessel}
  ];
}

test('the brand artwork and brief target line meet the exact scoring zero', () => {
  for (const P of parameters){
    for (const G of boxes(P)){
      const before = structuredClone(P), target = targetGeometry(G, P, P.theme);
      const scoreZeroY = G.top + P.markY * (G.bot - G.top);
      assert.equal(target.y, scoreZeroY, P.theme.id + ': target moved away from the scoring center');
      const levelAtTarget = (target.y - G.top) / (G.bot - G.top);
      assert.equal(scoreFromOffset((levelAtTarget - P.markY) / P.markH, P.theme.target).score, 100);
      assert.deepEqual(P, before, P.theme.id + ': seeded scoring parameters changed');
      assert.equal(targetGeometry(G, P, P.theme).y, target.y, P.theme.id + ': geometry is not deterministic');
    }
  }
});

test('all catalog and concept artwork and dashed hints fit small-phone, phone, desktop and postcard glasses', () => {
  assert.equal(conceptOptions.length, 9);
  for (const P of parameters){
    for (const G of boxes(P)){
      const target = targetGeometry(G, P, P.theme), label = P.theme.id + ' at ' + Math.round(G.bot - G.top) + 'px';
      for (const value of Object.values(target)) assert.ok(Number.isFinite(value), label + ': non-finite geometry');
      assert.ok(target.markHeight >= P.markH * (G.bot - G.top), label + ': logo became too small');
      // Conservative bounds include each brand badge and its outline/ribbon.
      for (const t of [P.markY - target.markHeight * .75 / (G.bot - G.top), P.markY + target.markHeight * .75 / (G.bot - G.top)]){
        assert.ok(t > 0 && t < 1, label + ': artwork escapes above the rim or below the base');
        assert.ok(target.markHeight * .65 < widthAt(G.glass, t) * G.halfW, label + ': artwork crosses the tapered wall');
      }
      assert.ok(target.lineWidth > 0 && target.lineWidth <= target.vesselHalfWidth * .12);
      assert.ok(target.lineHalfWidth > 0 && target.lineHalfWidth < target.vesselHalfWidth);
      for (const dy of [-target.lineWidth / 2, 0, target.lineWidth / 2]){
        const t = (target.y + dy - G.top) / (G.bot - G.top);
        assert.ok(target.lineHalfWidth < widthAt(G.glass,t) * G.halfW, label + ': dashed hint crosses the wall');
      }
    }
  }
});

test('mark enlargement remains visual and never broadens the perfect-split scoring band', () => {
  const P = dayParams(1), G = boxes(P)[0], before = structuredClone(P);
  const justOutsidePerfect = 0.061;
  const resultBefore = scoreFromOffset(justOutsidePerfect, P.theme.target);
  const target = targetGeometry(G, P, P.theme);
  assert.ok(target.markHeight > P.markH * (G.bot - G.top));
  assert.equal(resultBefore.label, 'Split');
  assert.deepEqual(scoreFromOffset(justOutsidePerfect, P.theme.target), resultBefore);
  assert.deepEqual(P, before);
});

test('translated vessel coordinates translate logo and hint together', () => {
  const P = dayParams(5), G = boxes(P)[0], original = targetGeometry(G, P, P.theme);
  const shifted = targetGeometry({...G, top:G.top + 72, bot:G.bot + 72, cx:G.cx + 45}, P, P.theme);
  assert.equal(shifted.y, original.y + 72);
  for (const field of ['markHeight', 'vesselHalfWidth', 'lineHalfWidth', 'lineWidth']) assert.equal(shifted[field], original[field]);
});

test('tiny and empty vessels never produce negative artwork or hint geometry', () => {
  const P = dayParams(5);
  for (const size of [0, .01, .5, 1, 2, 8]){
    const G = {cx:0, top:7, bot:7 + size, halfW:size / 4, glass:P.theme.vessel};
    const target = targetGeometry(G, P, P.theme);
    assert.ok(target.markHeight >= 0);
    assert.ok(target.lineHalfWidth >= 0 && target.lineHalfWidth <= target.vesselHalfWidth);
    assert.ok(target.lineWidth >= 0 && target.lineWidth <= target.vesselHalfWidth * .12);
    assert.equal(target.y, G.top + P.markY * (G.bot - G.top));
  }
});

test('the target hint reveals once, fades gently and expires under both motion preferences', () => {
  for (const reduced of [false,true]){
    assert.equal(targetHintOpacity(-1,reduced),0);
    assert.equal(targetHintOpacity(NaN,reduced),0);
    assert.equal(targetHintOpacity(Infinity,reduced),0);
    assert.equal(targetHintOpacity(0,reduced),.82);
    assert.equal(targetHintOpacity(1600,reduced),.82);
    assert.equal(targetHintOpacity(TARGET_HINT_MS,reduced),0);
    assert.equal(targetHintOpacity(TARGET_HINT_MS * 10,reduced),0,'the cue must never restart itself');
  }
  assert.equal(targetHintOpacity(1750),.41);
  assert.equal(targetHintOpacity(1899,true),.82,'reduced motion stays static until it clears');
});
