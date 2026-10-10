import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dayParams, DRAIN_LEVEL, THEMES, makeDrinkState, stepDrink} from '../site/js/core.js';
import {ROUND_STAGES, roundParams, roundRate, normalizeRoundRecord, reserveRound,
  completeRound, recoverInterruptedRound, summarizeRounds} from '../site/js/rounds.js';
import {stageCadence} from '../site/js/sip-cadence.js';

const P = dayParams(1);
const sip = (score, f = .1, extra = {}) => ({score, f, L:P.markY + f * P.markH,
  mode:'hold', label:'Split', tone:'good', drained:false, ...extra});
const blank = () => normalizeRoundRecord(null, P);
function completed(scores){
  let record = blank();
  for (const [index, score] of scores.entries()){
    const token = 'sip-' + index;
    const reserved = reserveRound(record, P, token);
    assert.equal(reserved.accepted, true);
    const finished = completeRound(reserved.record, P, token, sip(score));
    assert.equal(finished.accepted, true);
    record = finished.record;
  }
  return record;
}

test('three stage profiles preserve each released glass, target and base rate', () => {
  assert.deepEqual(ROUND_STAGES.map(stage => stage.label), ['Sober','Tipsy','Drunk']);
  assert.deepEqual(ROUND_STAGES.map(stage => stage.blur), [0,.345,1.2075]);
  assert.deepEqual(ROUND_STAGES.map(stage => stage.sway), [0,.69,1.6675]);
  assert.deepEqual(ROUND_STAGES.map(stage => stage.cadenceAmplitude), [0,.1495,.345]);
  assert.deepEqual(ROUND_STAGES.map(stage => stage.cadencePeriod), [1,.92,.68]);
  assert.ok(Object.isFrozen(ROUND_STAGES));
  const glassFields = ['num','key','theme','markY','markH','K','wobble','choppy'];
  for (let num = 1; num <= THEMES.length; num++){
    const base = dayParams(num), copy = structuredClone(base);
    for (let index = 0; index < ROUND_STAGES.length; index++){
      const staged = roundParams(base, index);
      for (const key of glassFields) assert.equal(staged[key], base[key], num + ':' + key);
      assert.equal(staged.sipStage, index);
      assert.deepEqual(staged, roundParams(base, index), 'stage parameters repeat for everyone');
      assert.equal(staged.sipBlur, ROUND_STAGES[index].blur);
      assert.equal(staged.sipSway, ROUND_STAGES[index].sway);
    }
    assert.deepEqual(base, copy, 'staging never mutates the released challenge');
  }
  assert.equal(roundParams(P, -1).sipStage, 0);
  assert.equal(roundParams(P, 3).sipStage, 0);
  assert.equal(roundParams(P, '2').sipStage, 0);
});

test('sober cadence is unchanged and later cadence is deterministic, bounded and independent of motion preference', () => {
  for (let stage = 0; stage < 3; stage++){
    const params = roundParams(P, stage), amplitude = ROUND_STAGES[stage].cadenceAmplitude;
    const rates = [];
    for (let index = 0; index <= 1000; index++){
      const elapsed = index / 100, rate = roundRate(params, elapsed);
      assert.ok(rate >= P.K * (1 - amplitude) - 1e-12);
      assert.ok(rate <= P.K * (1 + amplitude) + 1e-12);
      assert.equal(rate, roundRate(roundParams(P, stage), elapsed));
      assert.equal(rate, roundRate({...params, reducedMotion:true}, elapsed));
      if (!stage) assert.equal(rate, P.K);
      rates.push(rate);
    }
    if (stage) assert.ok(Math.max(...rates) - Math.min(...rates) > P.K * amplitude,
      'later sips visibly vary without random or unbounded flow');
    assert.equal(roundRate(params, NaN), roundRate(params, 0));
    assert.equal(roundRate(params, -4), roundRate(params, 0));
  }
  assert.equal(roundRate(P, 3), P.K, 'unstaged existing previews keep their base pour');
});

test('first sip reproduces the original fluid simulation and staged pours remain playable', () => {
  for (let num = 1; num <= THEMES.length; num++){
    const base = dayParams(num), sober = roundParams(base, 0);
    let original = makeDrinkState(base), first = makeDrinkState(sober);
    for (let tick = 0; tick < 240; tick++){
      original = stepDrink(base, original, base.K, 1 / 120);
      first = stepDrink(sober, first, roundRate(sober, first.elapsed), 1 / 120);
    }
    assert.deepEqual(first, original);
    for (const index of [1,2]){
      const params = roundParams(base, index);
      let state = makeDrinkState(params), seconds = 0;
      while (state.level < params.markY && seconds < 20){
        state = stepDrink(params, state, params.K, 1 / 120);
        seconds += 1 / 120;
      }
      assert.ok(seconds > .5 && seconds < 20, 'the original label stays reachable');
    }
  }
});

test('later sips integrate the same cadence and stopping line at 30, 60 and 120 fps for all six glasses', () => {
  const simulate = (params, fps, holdSeconds) => {
    let state = makeDrinkState(params);
    for (let frame = 0; frame < holdSeconds * fps; frame++) state = stepDrink(params, state, params.K, 1 / fps);
    for (let frame = 0; frame < fps; frame++) state = stepDrink(params, state, 0, 1 / fps);
    return state;
  };
  for (let num = 1; num <= THEMES.length; num++){
    const base = dayParams(num);
    for (const stage of [1,2]){
      const params = roundParams(base, stage);
      for (const seconds of [1,2,3]){
        const reference = simulate(params, 120, seconds);
        for (const fps of [30,60]){
          const current = simulate(params, fps, seconds);
          assert.ok(Math.abs(current.level - reference.level) < 1e-8,
            num + ': stage ' + stage + ', ' + fps + 'fps, ' + seconds + 's');
          assert.equal(current.velocity, reference.velocity, 'release settles fully at every frame rate');
        }
        const still = simulate({...params, reducedMotion:true}, 120, seconds);
        assert.deepEqual(still, reference, 'accessibility preference never alters cadence physics');
      }
    }
  }
});

test('malformed cadence knobs and negative rates cannot reverse or poison the sip', () => {
  assert.equal(stageCadence(undefined, 1), 1);
  assert.equal(stageCadence(P, 1), 1);
  assert.equal(stageCadence({sipCadenceAmplitude:-1}, 1), 1);
  assert.equal(stageCadence({sipCadenceAmplitude:Infinity}, 1), 1);
  for (const period of [-1, 0, NaN, Infinity, 'fast']){
    for (const elapsed of [-1, NaN, Infinity]){
      const multiplier = stageCadence({sipCadenceAmplitude:999, sipCadencePeriod:period, sipCadencePhase:NaN}, elapsed);
      assert.ok(Number.isFinite(multiplier) && multiplier >= .655 && multiplier <= 1.345);
    }
  }
  assert.equal(roundRate({...roundParams(P, 2), K:-.1}, 1), 0);
  assert.equal(roundRate({...roundParams(P, 2), K:NaN}, 1), 0);
  assert.equal(roundRate(undefined, 1), 0);
  const staged = roundParams(P, 2), state = makeDrinkState(staged);
  for (const input of [-1, NaN, Infinity]){
    const stepped = stepDrink(staged, state, input, 1 / 30);
    assert.equal(stepped.level, state.level);
    assert.equal(stepped.velocity, 0);
  }
});

test('the daily round becomes done only on sip three and averages scores while keeping the earliest best sip', () => {
  const initial = blank();
  assert.deepEqual(initial, {version:2, scoring:'average', rounds:[], bestIndex:null, bestScore:null, done:false,
    num:P.num, theme:P.theme.id, pending:null});
  const first = completed([82]);
  assert.equal(first.done, false);
  assert.equal(first.bestIndex, 0);
  assert.equal(first.score, 82);
  const second = completed([82,91]);
  assert.equal(second.done, false);
  assert.equal(second.score, 87);
  assert.equal(second.averageScore, 87);
  assert.equal(second.bestScore, 91);
  const full = completed([82,91,91]);
  assert.equal(full.done, true);
  assert.equal(full.bestIndex, 1);
  assert.equal(full.score, 88);
  assert.equal(full.averageScore, 88);
  assert.equal(full.bestScore, 91);
  assert.equal(full.scoring, 'average');
  assert.equal(full.label, 'Three-sip average');
  assert.equal(full.tone, 'good');
  assert.deepEqual(full.rounds.map(round => round.score), [82,91,91]);
  assert.equal(reserveRound(full, P, 'fourth').accepted, false);
  assert.deepEqual(normalizeRoundRecord(full, P), full);
  assert.equal(summarizeRounds([sip(88),sip(88),sip(1)]).bestIndex, 0);
});

test('the shared average uses the best real sip for its line, mode and attribution', () => {
  const early = sip(12, -.4, {mode:'tilt', attribution:{campaign_id:'opening'}, t:'2026-10-09T10:00:00.000Z'});
  const best = sip(97, .04, {label:'Perfect split', tone:'good', attribution:{campaign_id:'opening', campaign_day:1}, custom:{note:'second'}});
  const summary = summarizeRounds([early,best,sip(38,.3)]);
  for (const [key, value] of Object.entries(best)){
    if (!['score','label','tone'].includes(key)) assert.deepEqual(summary[key], value, key);
  }
  assert.equal(summary.score, 49);
  assert.equal(summary.averageScore, 49);
  assert.equal(summary.bestScore, 97);
  assert.equal(summary.label, 'Three-sip average');
  assert.equal(summary.tone, 'warn');
  assert.equal(summary.bestIndex, 1);
  best.attribution.campaign_id = 'changed';
  assert.equal(summary.attribution.campaign_id, 'opening', 'winner metadata is copied rather than shared');
  assert.equal(summary.rounds[1].attribution.campaign_id, 'opening');
});

test('a valid same-glass legacy result becomes the first sober sip without consuming its two remaining sips', () => {
  const legacy = {num:P.num, theme:P.theme.id, done:true, ...sip(87)};
  const original = structuredClone(legacy), migrated = normalizeRoundRecord(legacy, P);
  assert.equal(migrated.version, 2);
  assert.equal(migrated.done, false);
  assert.equal(migrated.score, 87, 'do not recompute a released saved score from offset');
  assert.equal(migrated.averageScore, 87);
  assert.equal(migrated.bestScore, 87);
  assert.equal(migrated.scoring, 'average');
  assert.equal(migrated.rounds.length, 1);
  assert.equal(migrated.bestIndex, 0);
  assert.equal(migrated.rounds[0].done, undefined);
  assert.deepEqual(legacy, original, 'caller can keep archived legacy entries untouched');
  assert.equal(reserveRound(legacy, P, 'tipsy').record.pending.index, 1);
});

test('reservations reject a second tab and completion requires the current token', () => {
  const original = blank(), reserved = reserveRound(original, P, 'first');
  assert.equal(reserved.accepted, true);
  assert.deepEqual(reserved.record.pending, {token:'first', index:0});
  assert.equal(original.pending, null, 'reserving does not mutate caller data');
  assert.equal(reserveRound(reserved.record, P, 'second').accepted, false);
  const stale = completeRound(reserved.record, P, 'second', sip(100));
  assert.equal(stale.accepted, false);
  assert.deepEqual(stale.record, reserved.record);
  const accepted = completeRound(reserved.record, P, 'first', sip(76));
  assert.equal(accepted.accepted, true);
  assert.equal(accepted.record.rounds.length, 1);
  assert.equal(accepted.record.pending, null);
  assert.equal(completeRound(accepted.record, P, 'first', sip(100)).accepted, false,
    'double finish cannot replace or append another recorded sip');
  assert.equal(completeRound(null, P, 'first', sip(100)).accepted, false,
    'a result cannot be submitted without a reservation');
});

test('interrupted reservations count as misses and invalidate a live older tab', () => {
  let record = completed([64]);
  record = reserveRound(record, P, 'unfinished').record;
  const before = structuredClone(record), recovered = recoverInterruptedRound(record, P);
  assert.deepEqual(record, before);
  assert.equal(recovered.rounds.length, 2);
  assert.equal(recovered.done, false);
  assert.equal(recovered.pending, null);
  assert.equal(recovered.score, 32);
  assert.equal(recovered.averageScore, 32);
  assert.equal(recovered.bestScore, 64);
  assert.deepEqual(recovered.rounds[1], {score:0, f:2, L:DRAIN_LEVEL, drained:true,
    label:'Interrupted sip', tone:'miss', mode:'hold', abandoned:true});
  assert.equal(completeRound(recovered, P, 'unfinished', sip(100)).accepted, false);
  assert.deepEqual(recoverInterruptedRound(recovered, P), recovered, 'reload recovery is idempotent');
  const third = recoverInterruptedRound(reserveRound(recovered, P, 'unfinished-third').record, P);
  assert.equal(third.done, true);
  assert.equal(third.rounds.length, 3);
  assert.equal(third.score, 21);
  assert.equal(third.averageScore, 21);
  assert.equal(third.bestScore, 64);
  assert.equal(third.label, 'Three-sip average');
  assert.equal(third.tone, 'miss');
});

test('stored attempts reject other glasses, dates, future schemas and malformed round data', () => {
  const first = completed([87]);
  const invalid = [[], 'bad', 1,
    {...first, theme:'beach'}, {...first, num:P.num + 1}, {...first, version:3},
    {...first, rounds:null}, {...first, rounds:[...first.rounds, null]},
    {...first, rounds:Array.from({length:4}, () => sip(87))},
    {...first, pending:{token:'a', index:0}},
    {...first, pending:{token:' ', index:1}},
    {...first, pending:{token:'a', index:2}},
    {...first, rounds:[sip(NaN)]}, {...first, rounds:[sip(101)]},
    {...first, rounds:[sip(90,Infinity)]}, {...first, rounds:[sip(90,.1,{L:-.1})]},
    {...first, rounds:[sip(90,.1,{L:DRAIN_LEVEL + .01})]},
    {...first, rounds:[sip(90,.1,{mode:'sensor'})]},
    {...first, rounds:[sip(90,.1,{tone:'anything'})]},
    {...first, rounds:[sip(90,.1,{drained:'true'})]},
    {...first, rounds:[sip(90,.1,{label:{text:'Split'}})]},
    {theme:P.theme.id, done:false, ...sip(87)}
  ];
  for (const value of invalid){
    assert.equal(normalizeRoundRecord(value, P), null);
    assert.equal(reserveRound(value, P, 'retry').accepted, false);
    assert.equal(completeRound(value, P, 'retry', sip(100)).accepted, false);
  }
  for (const token of ['', ' spaced ', null, 1, 'a'.repeat(257)]){
    assert.equal(reserveRound(null, P, token).accepted, false);
  }
  const reserved = reserveRound(null, P, 'reserved').record;
  assert.equal(completeRound(reserved, P, 'reserved', sip(-1)).accepted, false);
  assert.deepEqual(completeRound(reserved, P, 'reserved', sip(-1)).record, reserved);
});

test('normalization derives completion, average and representative sip from preserved rounds rather than stale fields', () => {
  const first = completed([73]);
  const stale = {...first, done:true, bestIndex:2, score:100, L:0, f:0};
  const repaired = normalizeRoundRecord(stale, P);
  assert.equal(repaired.done, false);
  assert.equal(repaired.bestIndex, 0);
  assert.equal(repaired.score, 73);
  assert.equal(repaired.L, first.rounds[0].L);
  const bestScoredV2 = {...completed([30,90,60]), score:90, label:'Split', tone:'good',
    averageScore:99, bestScore:100, scoring:'best'};
  const recomputed = normalizeRoundRecord(bestScoredV2, P);
  assert.equal(recomputed.version, 2, 'existing saved schema is retained');
  assert.equal(recomputed.done, true);
  assert.equal(recomputed.score, 60);
  assert.equal(recomputed.averageScore, 60);
  assert.equal(recomputed.bestScore, 90);
  assert.equal(recomputed.bestIndex, 1);
  assert.equal(recomputed.label, 'Three-sip average');
  assert.equal(recomputed.tone, 'warn');
  assert.equal(recomputed.scoring, 'average');
  assert.deepEqual(recomputed.rounds, bestScoredV2.rounds, 'all individual attempts stay intact');
  assert.deepEqual(normalizeRoundRecord({...completed([1,2,3]), pending:{token:'fourth',index:3}}, P), null);
});

test('safe result extras survive JSON while cycles, non-finite values and prototype keys cannot corrupt the record', () => {
  const extra = {attribution:{campaign_id:'opening', undefined:undefined, infinity:Infinity},
    custom:{nested:[1, 'two', null]}, callback:() => {}, invalid:Infinity,
    done:true, bestIndex:2, bestScore:100, averageScore:100, scoring:'best',
    rounds:['injected'], pending:{token:'injected'}, version:99};
  extra.cycle = extra;
  const result = JSON.parse('{"score":80,"f":0.1,"L":0.6,"__proto__":{"polluted":true}}');
  Object.assign(result, extra);
  const record = completeRound(reserveRound(null, P, 'safe').record, P, 'safe', result).record;
  const copy = JSON.parse(JSON.stringify(record));
  assert.equal(copy.version, 2);
  assert.equal(copy.done, false);
  assert.equal(copy.pending, null);
  assert.equal(copy.rounds.length, 1);
  assert.equal(copy.score, 80);
  assert.equal(copy.averageScore, 80);
  assert.equal(copy.bestScore, 80);
  assert.equal(copy.scoring, 'average');
  assert.deepEqual(copy.attribution, {campaign_id:'opening'});
  assert.deepEqual(copy.custom, {nested:[1,'two',null]});
  assert.equal(copy.callback, undefined);
  assert.equal(copy.invalid, undefined);
  assert.equal({}.polluted, undefined);
  assert.equal(Object.hasOwn(copy.rounds[0], '__proto__'), false);
  assert.equal(Object.hasOwn(copy.rounds[0], 'version'), false);
  assert.equal(Object.hasOwn(copy.rounds[0], 'scoring'), false);
  assert.equal(Object.hasOwn(copy.rounds[0], 'averageScore'), false);
  assert.equal(Object.hasOwn(copy.rounds[0], 'bestScore'), false);
});

test('average rounding, zero sips and verdict thresholds use all completed attempts', () => {
  const empty = summarizeRounds([]);
  assert.equal(Object.hasOwn(empty, 'score'), false);
  assert.equal(Object.hasOwn(empty, 'averageScore'), false);
  assert.equal(empty.bestIndex, null);
  assert.equal(empty.bestScore, null);
  assert.equal(empty.scoring, 'average');
  const half = summarizeRounds([sip(0), sip(1)]);
  assert.equal(half.score, 1, 'Math.round rounds a half upward');
  assert.equal(half.bestScore, 1);
  assert.equal(half.done, false);
  const zero = completed([0,0,0]);
  assert.equal(zero.score, 0);
  assert.equal(zero.averageScore, 0);
  assert.equal(zero.bestScore, 0);
  assert.equal(zero.bestIndex, 0);
  assert.equal(zero.done, true);
  assert.equal(zero.tone, 'miss');
  for (const [scores, average, tone] of [
    [[100,100,24],75,'good'], [[100,100,22],74,'warn'],
    [[75,0,0],25,'warn'], [[72,0,0],24,'miss'], [[100,0,0],33,'warn']
  ]){
    const record = completed(scores);
    assert.equal(record.score, average);
    assert.equal(record.averageScore, average);
    assert.equal(record.tone, tone);
  }
});

test('a migrated legacy first sip and later completed sips contribute equally to the average', () => {
  const legacy = {num:P.num, theme:P.theme.id, done:true, ...sip(87)};
  const original = structuredClone(legacy);
  let record = normalizeRoundRecord(legacy, P);
  for (const [token, score] of [['tipsy',0], ['drunk',100]]){
    record = completeRound(reserveRound(record, P, token).record, P, token, sip(score)).record;
  }
  assert.equal(record.score, 62);
  assert.equal(record.averageScore, 62);
  assert.equal(record.bestScore, 100);
  assert.equal(record.bestIndex, 2);
  assert.equal(record.done, true);
  assert.deepEqual(record.rounds.map(round => round.score), [87,0,100]);
  assert.deepEqual(legacy, original, 'legacy source is never reset or overwritten by the model');
});
