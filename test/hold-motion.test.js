import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../site/js/core.js';
import {readThemeReview, reviewHash} from '../site/js/theme-review.js';
import {controllerApp} from './helpers/controller-app.js';

// These tests run the real hold controller through approach, reservation,
// drinking, settling and all three rounds. No sensor or audio path is supplied.
test('Start pulls the glass closer before allowing a hold or consuming a sip', () => {
  const app = controllerApp();
  app.begin();
  assert.equal(app.S.state, 'approaching');
  assert.equal(app.element('drinkControl').disabled, true);
  app.press(); app.advance(15);
  assert.equal(app.S.state, 'approaching');
  assert.equal(app.S.holding, false);
  assert.equal(app.S.L, app.initial.level);
  assert.equal(app.S.roundToken, null);
  assert.equal(app.storage.writes.length, 0, 'an early press cannot reserve an attempt');
  assert.ok(app.S.focus > 0 && app.S.focus < 1, 'the real frame loop advances the approach');
  app.ready();
  assert.equal(app.S.focus, 1);
  assert.equal(app.element('drinkControl').disabled, false);
  assert.equal(app.element('drinkControl').focused, true);
  app.press(); app.advance(30);
  assert.equal(app.S.state, 'drinking');
  assert.ok(app.S.L > app.initial.level);
  assert.ok(app.S.motion.angle > 10, 'holding visibly tips the glass in frame');
  assert.equal(app.element('drinkControl').attributes['aria-pressed'], 'true');
  app.release();
  assert.equal(app.S.state, 'locked', 'release immediately starts settling');
  assert.equal(app.element('drinkControl').attributes['aria-pressed'], 'false');
  app.settle();
  assert.equal(app.S.state, 'between');
  assert.equal(app.S.motion.angle, 0);
  assert.equal(app.S.progress.rounds.length, 1);
  assert.match(app.element('footPill').textContent, /Average so far: \d+\/100\./);
  assert.doesNotMatch(app.element('footPill').textContent, /Best so far/);
});

test('device reduced motion keeps a still glass but identical drinking physics in every stage', () => {
  const full = controllerApp({practice:true}), reduced = controllerApp({practice:true, deviceReduced:true});
  for (let round = 0; round < 3; round++){
    for (const app of [full, reduced]){
      app.begin(); app.ready(); app.press(); app.advance(30);
    }
    assert.equal(full.S.round, round);
    assert.equal(reduced.S.round, round);
    assert.ok(full.S.motion.angle > 10);
    assert.equal(reduced.S.motion.angle, 0);
    assert.equal(reduced.S.motion.lift, 0);
    for (const app of [full, reduced]){ app.release(); app.settle(); }
    assert.ok(Math.abs(reduced.S.drink.level - full.S.drink.level) < 1e-8, 'stage ' + round + ': presentation cannot change the settled drink');
    assert.equal(reduced.S.progress.rounds[round].score, full.S.progress.rounds[round].score);
    assert.equal(reduced.S.drink.velocity, 0);
    assert.equal(full.S.drink.velocity, 0);
    assert.equal(reduced.S.state, round === 2 ? 'result' : 'between');
  }
  assert.equal(full.storage.writes.length, 0);
  assert.equal(reduced.storage.writes.length, 0);
  const average = rounds => Math.round(rounds.reduce((sum, round) => sum + round.score, 0) / rounds.length);
  assert.equal(full.S.result.score, average(full.S.result.rounds));
  assert.equal(reduced.S.result.score, average(reduced.S.result.rounds));
});

test('another round after a legacy tilt result uses the hold control and focus pause', () => {
  const app = controllerApp({previousMode:'tilt'});
  app.begin();
  assert.equal(app.S.mode, 'hold');
  assert.equal(app.S.state, 'approaching');
  assert.equal(app.element('drinkControl').hidden, false);
  app.ready(); app.press(); app.advance(30);
  assert.equal(app.S.state, 'drinking');
  assert.ok(app.S.motion.angle > 10);
});

test('all six official and review glasses complete three quiet sips despite legacy sound and motion preferences', () => {
  const challenges = [
    ...Array.from({length:6}, (_, index) => ({P:core.dayParams(index + 1), review:false})),
    ...core.THEMES.map(theme => ({P:readThemeReview(reviewHash(theme.id)).P, review:true, kind:'preview'}))
  ];
  for (const challenge of challenges){
    const app = controllerApp(challenge), label = app.S.theme.id + (challenge.review ? ' review' : ' official');
    app.storage.values.set('split.sound.v1', 'on');
    app.storage.values.set('split.motion.v1', 'reduced');
    for (let round = 0; round < 3; round++){
      app.sip(15);
      assert.equal(app.S.round, round, label);
      assert.equal(app.S.motion.angle, 0, label + ': each sip settles upright');
      assert.ok(app.S.progress.rounds[round].L > app.initial.level, label + ': held input consumes the drink');
    }
    assert.equal(app.S.state, 'result', label);
    assert.equal(app.S.result.rounds.length, 3, label);
    assert.equal(app.S.result.score, Math.round(app.S.result.rounds.reduce((sum, round) => sum + round.score, 0) / 3), label);
    assert.equal(app.S.result.bestScore, Math.max(...app.S.result.rounds.map(round => round.score)), label);
    assert.equal(app.S.result.counts, !challenge.review, label);
    assert.equal(app.audio.constructed, 0, label + ': old sound preference cannot construct audio');
    assert.equal(app.storage.values.get('split.sound.v1'), 'on');
    assert.equal(app.storage.values.get('split.motion.v1'), 'reduced');
  }
});
