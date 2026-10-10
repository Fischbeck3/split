import {test} from 'node:test';
import assert from 'node:assert/strict';
import {THEMES, dayParams, keyForDay, startLevel, secondsToMark, DRAIN_LEVEL} from '../site/js/core.js';
import {canRecordChallenge} from '../site/js/challenge.js';
import {buildShareText} from '../site/js/share.js';
import {readThemeReview, reviewHash, adjacentReviewTheme} from '../site/js/theme-review.js';
import {controllerApp, browserStorage, storageKey} from './helpers/controller-app.js';

const atNoon = key => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
};

test('every catalog glass has a deterministic review with its own mark and drinking dynamics', () => {
  const released = [1, 2, 3, 4, 5, 6, 30].map(dayParams);
  for (const theme of THEMES){
    const hash = reviewHash(theme.id), review = readThemeReview(hash);
    assert.equal(hash, '#admin/' + theme.id);
    assert.equal(review.kind, 'preview', theme.id);
    assert.equal(review.theme.id, theme.id);
    assert.equal(review.P.theme.id, theme.id);
    assert.equal(review.key, keyForDay(review.num));
    assert.deepEqual(readThemeReview(hash), review, theme.id + ': review changes on reopening');

    const pinned = dayParams(review.num, {days:{[review.key]:{themeId:theme.id}}});
    assert.deepEqual(review.P, pinned, theme.id + ': review must use the selected glass’s real physics');
    assert.ok(review.P.markY - review.P.markH / 2 > startLevel(theme), theme.id + ': target above starting liquid');
    assert.ok(review.P.markY + review.P.markH / 2 < DRAIN_LEVEL, theme.id + ': target below drinking range');
    assert.ok(secondsToMark(review.P) > 0 && secondsToMark(review.P) < 60, theme.id + ': unreachable target');
  }
  assert.deepEqual([1, 2, 3, 4, 5, 6, 30].map(dayParams), released, 'reviewing the catalog cannot change released daily pours');
});

test('review controls cycle forward and backward through the whole catalog', () => {
  for (let index = 0; index < THEMES.length; index++){
    const id = THEMES[index].id;
    assert.equal(adjacentReviewTheme(id, 1), THEMES[(index + 1) % THEMES.length].id);
    assert.equal(adjacentReviewTheme(id, -1), THEMES[(index + THEMES.length - 1) % THEMES.length].id);
  }
  const first = THEMES[0].id;
  let selected = first;
  const visited = new Set();
  do {
    visited.add(selected);
    selected = adjacentReviewTheme(selected, 1);
  } while (selected !== first && visited.size <= THEMES.length);
  assert.equal(selected, first);
  assert.deepEqual(visited, new Set(THEMES.map(theme => theme.id)));
});

test('malformed review routes stay in unsaved review instead of falling into daily scoring', () => {
  for (const hash of ['#admin', '#admin/', '#admin/unknown-theme', '#admin/pub/extra', '#admin/<script>', '#admin/pub?day=2026-10-09']){
    const review = readThemeReview(hash);
    assert.ok(review, hash);
    assert.equal(review.kind, 'preview', hash);
    assert.equal(review.theme.id, 'pub', hash);
    assert.equal(canRecordChallenge({...review, now:atNoon(review.key), launchReady:true}), false, hash);
  }
  for (const hash of ['', '#day1', '#day9999', '#other']) assert.equal(readThemeReview(hash), null, hash);
  assert.throws(() => reviewHash('not-a-glass'));
});

test('a review cannot record on its date, after midnight, or before a launch', () => {
  for (const theme of THEMES){
    const review = readThemeReview(reviewHash(theme.id));
    const onDate = atNoon(review.key), afterMidnight = new Date(onDate.getFullYear(), onDate.getMonth(), onDate.getDate() + 1);
    for (const now of [onDate, afterMidnight]){
      for (const launchReady of [true, false]){
        assert.equal(canRecordChallenge({...review, now, launchReady}), false, theme.id);
      }
    }
  }
});

test('repeated review rounds preserve daily storage, preferences and calendar drafts on all six glasses', () => {
  const today = keyForDay(1), saved = JSON.stringify({days:{[today]:{num:1, theme:'pub', done:true, score:93, f:.08, L:.64, mode:'hold'}}});
  const storage = browserStorage([[storageKey, saved], ['split.sound.v1', 'on'], ['split.content-calendar.v1', '{"keep":"drafts"}']]);
  const before = new Map(storage.values);
  for (const theme of THEMES){
    const review = readThemeReview(reviewHash(theme.id));
    const app = controllerApp({P:review.P, storage, kind:review.kind, review:true, calendarDate:atNoon(today)});
    // Even a review using today's date cannot replace its official glass.
    app.S.key = today;
    app.restore();
    assert.equal(app.S.progress, null, theme.id + ': review must not hydrate an official record');
    for (let round = 0; round < 3; round++) app.sip(30);
    assert.equal(app.S.state, 'result', theme.id);
    assert.equal(app.S.result.rounds.length, 3, theme.id);
    assert.equal(app.S.result.counts, false, theme.id);
    const firstReview = structuredClone(app.S.result.rounds);
    app.reviewRefill(); app.ready(); app.press(); app.advance(45); app.release(); app.settle();
    app.sip(45); app.sip(45);
    assert.equal(app.S.state, 'result', theme.id + ': refill gives a full new review round');
    assert.equal(app.S.result.rounds.length, 3);
    assert.notDeepEqual(structuredClone(app.S.result.rounds), firstReview, 'review feedback reflects the actual new pours');
    assert.equal(app.S.result.counts, false);
  }
  assert.deepEqual(storage.writes, [], 'no review or refill attempts a daily write');
  assert.deepEqual(storage.values, before);
});

test('review result links reopen the exact catalog glass and pour without a daily or friend benchmark', () => {
  for (const theme of THEMES){
    const review = readThemeReview(reviewHash(theme.id));
    const result = {score:100, f:0, L:review.P.markY, label:'Perfect split', tone:'good', counts:false, drained:false};
    const text = buildShareText({num:review.num, key:review.key, theme:review.theme, result, preview:true, review:true});
    const link = new URL(text.split('\n').at(-1));
    assert.ok(text.includes(theme.name), theme.id + ': missing glass name');
    assert.match(text.split('\n')[0], / · Review$/, theme.id + ': review result needs an explicit label');
    assert.equal(link.hash, reviewHash(theme.id));
    for (const field of ['day', 'vs', 'f', 'glass', 'sip', 'empty']){
      assert.equal(link.searchParams.has(field), false, theme.id + ': review must not look like an official/friend score');
    }
    const reopened = readThemeReview(link.hash);
    assert.equal(reopened.theme.id, theme.id);
    assert.deepEqual(reopened.P, review.P, theme.id + ': review share changes the pour');
    assert.equal(canRecordChallenge({...reopened, now:atNoon(reopened.key), launchReady:true}), false);
  }
});

test('retired prototypes are absent from review choices and direct review routes', () => {
  const built = ['pub', 'beach', 'munich', 'sapporo', 'butterbeer', 'peroni'];
  assert.deepEqual(THEMES.map(theme => theme.id), built);
  for (const id of ['lager', 'pale', 'cider', 'red', 'coffee', 'choc', 'matcha', 'cola']) {
    assert.throws(() => reviewHash(id), /Unknown review theme/);
    const review = readThemeReview('#admin/' + id);
    assert.equal(review.theme.id, 'pub');
    assert.equal(review.kind, 'preview');
    assert.match(review.notice, /unavailable/);
  }
});
