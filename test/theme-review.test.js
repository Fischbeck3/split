import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {THEMES, dayParams, keyForDay, startLevel, secondsToMark, scoreFromOffset, PERFECT, DRAIN_LEVEL} from '../site/js/core.js';
import {LAUNCH, RECORD_RUN} from '../site/js/config.js';
import {canRecordChallenge} from '../site/js/challenge.js';
import {buildShareText} from '../site/js/share.js';
import {gameProperties} from '../site/js/analytics.js';
import {readThemeReview, reviewHash, adjacentReviewTheme} from '../site/js/theme-review.js';

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

test('the actual completion controller preserves existing daily storage through repeated review sips', () => {
  const main = readFileSync(new URL('../site/js/main.js', import.meta.url), 'utf8');
  const storeSource = main.match(/^const STORE = .+;$/m)[0];
  const storageSource = main.slice(main.indexOf('function load(){'), main.indexOf('// ---------- layout and drawing ----------'));
  const finishSource = main.slice(main.indexOf('function finish(now){'), main.indexOf('// ---------- results and sharing ----------'));
  const today = keyForDay(1), now = atNoon(today);
  class ReviewDate extends Date {
    constructor(...args){ super(...(args.length ? args : [now.getTime()])); }
  }
  assert.equal(canRecordChallenge({key:today, kind:'today', now, launchReady:true}), true, 'a normal sip can record on this date');
  const storageKey = 'split.v1:' + LAUNCH + ':' + RECORD_RUN;
  const saved = JSON.stringify({days:{[today]:{num:1, theme:'pub', done:true, score:93, f:.08, L:.64, mode:'hold'}}});
  const values = new Map([[storageKey, saved], ['split.sound.v1', 'on'], ['split.content-calendar.v1', '{"keep":"drafts"}']]);
  const before = new Map(values), writes = [];
  const localStorage = {
    getItem:key => values.get(key) ?? null,
    setItem(key, value){ writes.push({key, value}); throw new Error('Review must not attempt a daily write.'); }
  };

  for (const theme of THEMES){
    const review = readThemeReview(reviewHash(theme.id)), P = review.P;
    // Even if the reviewed glass has today's key, review cannot replace a daily record.
    const S = {num:review.num, key:today, P, theme:review.theme, kind:review.kind,
      review:true, preview:true, practice:false, mode:'hold', friend:null,
      state:'locked', drained:false, L:P.markY, attribution:{}};
    const element = {hidden:false, classList:{add(){}}};
    const context = vm.createContext({LAUNCH, RECORD_RUN, localStorage, S, Date:ReviewDate,
      canRecordChallenge, scoreFromOffset, PERFECT, gameProperties,
      refreshDayStatus(){}, analytics:{capture(){}}, toast(){}, draw(){},
      setPhase:phase => { S.state = phase; }, $:() => element,
      renderResult(){}, renderStats(){}, sound:{land(){}}});
    vm.runInContext(storeSource + '\n' + storageSource + '\n' + finishSource, context);
    for (const offset of [0, .3, -.2]){
      S.state = 'locked'; S.L = P.markY + offset * P.markH;
      vm.runInContext('finish(1000);', context);
      assert.equal(S.state, 'result', theme.id);
      assert.equal(S.result.counts, false, theme.id + ': review result must remain unsaved');
      assert.equal(S.result.score, scoreFromOffset(offset, theme.target).score, theme.id + ': official result must not replace review feedback');
      S.practice = true;
    }
  }
  assert.deepEqual(writes, [], 'the actual finish/save path never attempts a write');
  assert.deepEqual(values, before, 'official scores, sound choice, and calendar drafts are preserved');
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
