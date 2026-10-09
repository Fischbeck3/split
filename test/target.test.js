import {test} from 'node:test';
import assert from 'node:assert/strict';
import {THEMES, dayParams, scoreFromOffset, widthAt} from '../site/js/core.js';
import {CONCEPT_CHAPTERS, conceptParams} from '../site/js/concepts.js';
import {targetGeometry} from '../site/js/target.js';

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

test('the larger painted mark and guides meet the exact scoring zero', () => {
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

test('all catalog and concept marks leave readable, bounded painted guides at small-phone, phone, desktop and postcard sizes', () => {
  assert.equal(conceptOptions.length, 9);
  for (const P of parameters){
    for (const G of boxes(P)){
      const target = targetGeometry(G, P, P.theme), label = P.theme.id + ' at ' + Math.round(G.bot - G.top) + 'px';
      for (const value of Object.values(target)) assert.ok(Number.isFinite(value), label + ': non-finite geometry');
      const artworkHalfWidth = target.markHeight * .65;
      assert.ok(target.markHeight >= P.markH * (G.bot - G.top), label + ': mark failed to grow');
      assert.ok(artworkHalfWidth < target.notchInner, label + ': guide touches the mark artwork');
      assert.ok(target.notchInner < target.notchOuter, label + ': reversed or missing guide rail');
      assert.ok(target.notchOuter < target.vesselHalfWidth, label + ': guide reaches the outer glass edge');
      assert.ok(target.railWidth > 0 && target.railWidth <= target.vesselHalfWidth * .15, label + ': rail stroke exceeds the glass');
      assert.ok(target.notchSize > 0 && target.notchSize <= (target.notchOuter - target.notchInner) / 2, label + ': notch exceeds its rail');
      // Conservative bounds cover the crown, shield and the widest letter M.
      for (const t of [P.markY - target.markHeight * .75 / (G.bot - G.top), P.markY + target.markHeight * .75 / (G.bot - G.top)]){
        assert.ok(t > 0 && t < 1, label + ': mark escapes above the rim or below the base');
        assert.ok(artworkHalfWidth < widthAt(G.glass, t) * G.halfW, label + ': mark crosses the tapered glass wall');
      }
      const strokeRadius = target.railWidth / 2;
      assert.ok(target.notchOuter + strokeRadius + .5 <= target.vesselHalfWidth + 1e-10, label + ': the rounded rail cap paints outside the glass');
      for (const fraction of [-1, -.75, -.5, -.25, 0, .25, .5, .75, 1]){
        const dy = fraction * strokeRadius, t = (target.y + dy - G.top) / (G.bot - G.top);
        const capEdge = target.notchOuter + Math.sqrt(Math.max(0, strokeRadius * strokeRadius - dy * dy));
        assert.ok(capEdge < widthAt(G.glass, t) * G.halfW, label + ': round rail cap crosses the tapered glass wall');
      }
      // The notch outline is at most half the rail width. Include its rounded
      // top/bottom caps against the taper, not just its path center.
      const notchStrokeRadius = target.railWidth / 4;
      for (const y of [target.y - target.notchSize - notchStrokeRadius, target.y + target.notchSize + notchStrokeRadius]){
        const t = (y - G.top) / (G.bot - G.top);
        assert.ok(target.notchOuter + notchStrokeRadius < widthAt(G.glass, t) * G.halfW, label + ': notch stroke crosses the glass wall');
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

test('translated vessel coordinates translate target and guides together', () => {
  const P = dayParams(5), G = boxes(P)[0], original = targetGeometry(G, P, P.theme);
  const shifted = targetGeometry({...G, top:G.top + 72, bot:G.bot + 72, cx:G.cx + 45}, P, P.theme);
  assert.equal(shifted.y, original.y + 72);
  for (const field of ['markHeight', 'vesselHalfWidth', 'notchInner', 'notchOuter', 'notchSize', 'railWidth']) assert.equal(shifted[field], original[field]);
});

test('tiny and empty vessels never produce reversed rails or negative notch sizes', () => {
  const P = dayParams(5);
  for (const size of [0, .01, .5, 1, 2, 8]){
    const G = {cx:0, top:7, bot:7 + size, halfW:size / 4, glass:P.theme.vessel};
    const target = targetGeometry(G, P, P.theme);
    assert.ok(target.markHeight >= 0);
    assert.ok(target.notchInner >= 0 && target.notchInner <= target.notchOuter);
    assert.ok(target.notchSize >= 0 && target.notchSize <= (target.notchOuter - target.notchInner) / 2);
    assert.ok(target.notchOuter <= target.vesselHalfWidth);
    assert.ok(target.railWidth >= 0 && target.railWidth <= target.vesselHalfWidth * .15);
    assert.equal(target.y, G.top + P.markY * (G.bot - G.top));
  }
});
