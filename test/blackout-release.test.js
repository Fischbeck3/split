import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dayParams, scoreFromOffset} from '../site/js/core.js';
import {ROUND_STAGES, roundCount, roundParams, normalizeRoundRecord, reserveRound, completeRound, recoverInterruptedRound} from '../site/js/rounds.js';
import {RECORD_STORE, LEGACY_RECORD_STORE} from '../site/js/config.js';
import {loadRecords} from '../site/js/record-store.js';
import {buildShareText} from '../site/js/share.js';
import {readFriendChallenge, comparisonCopy} from '../site/js/friend.js';
import {controllerApp, browserStorage} from './helpers/controller-app.js';

const P = dayParams(25);
const sip = f => ({...scoreFromOffset(f,P.theme.target), f, L:P.markY + f * P.markH, mode:'hold', drained:false});
function finish(record, index, result = sip(.1)){
  const reservation = reserveRound(record, P, 'token-' + index);
  assert.equal(reservation.accepted, true);
  const complete = completeRound(reservation.record, P, 'token-' + index, result);
  assert.equal(complete.accepted, true);
  return complete.record;
}

test('launch-day rounds require Blackout; released archives still have three stages', () => {
  assert.equal(P.key, '2026-11-02');
  assert.equal(roundCount(P),4);
  assert.equal(roundCount(dayParams(24)),3);
  assert.equal(roundParams(P,3).blackout,true);
  assert.equal(roundParams(dayParams(24),3).sipStage,0);
  assert.equal(ROUND_STAGES[3].label,'Blackout');
  let record = normalizeRoundRecord(null,P);
  for (let i=0;i<3;i++){ record=finish(record,i); assert.equal(record.done,false); }
  record=finish(record,3,sip(0));
  assert.equal(record.version,3);
  assert.equal(record.done,true);
  assert.equal(record.label,'Four-sip average');
  assert.equal(record.score,Math.round(record.rounds.reduce((sum,r)=>sum+r.score,0)/4));
  assert.equal(reserveRound(record,P,'fifth').accepted,false);
  assert.deepEqual(normalizeRoundRecord(JSON.parse(JSON.stringify(record)),P),record);
});

test('an interrupted fourth sip counts once, while old three-sip records remain recoverable', () => {
  let record=normalizeRoundRecord(null,P);
  for(let i=0;i<3;i++) record=finish(record,i,sip(0));
  record=recoverInterruptedRound(reserveRound(record,P,'blackout').record,P);
  assert.equal(record.rounds.length,4);
  assert.equal(record.done,true);
  assert.equal(record.score,75);
  assert.equal(record.rounds[3].abandoned,true);
  assert.equal(completeRound(record,P,'blackout',sip(0)).accepted,false);
  const old={...record,version:2,rounds:record.rounds.slice(0,3)};
  assert.equal(normalizeRoundRecord(old,P).done,false);
  const archive=dayParams(24);
  assert.equal(normalizeRoundRecord({...old,num:archive.num,theme:archive.theme.id},archive).done,true);
});

test('first visit backs up and resets only local today; migration is idempotent and old tabs are isolated', () => {
  const oldToday={done:true,score:90}, history={done:true,score:80};
  const original={days:{'2026-11-01':history,'2026-11-02':oldToday},custom:'keep'};
  const values=new Map([[LEGACY_RECORD_STORE,JSON.stringify(original)],['motion','unchanged']]);
  const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
  const migrated=loadRecords(storage,'2026-11-02');
  assert.deepEqual(migrated.days,{'2026-11-01':history});
  assert.deepEqual(migrated.blackoutRelease,{date:'2026-11-02',previous:oldToday});
  assert.equal(migrated.custom,'keep');
  assert.equal(values.get(LEGACY_RECORD_STORE),JSON.stringify(original));
  assert.equal(values.get('motion'),'unchanged');
  const fresh={...migrated,days:{...migrated.days,'2026-11-02':{version:3,rounds:[sip(0)]}}};
  storage.setItem(RECORD_STORE,JSON.stringify(fresh));
  storage.setItem(LEGACY_RECORD_STORE,JSON.stringify({days:{'2026-11-02':{score:1}}}));
  assert.deepEqual(loadRecords(storage,'2026-11-02'),fresh);
  assert.deepEqual(loadRecords(storage,'2026-11-03'),fresh,'another day must not reset again');
});

test('four-sip shares round-trip all scores and label comparisons against older three-sip shares', () => {
  let record=normalizeRoundRecord(null,P);
  for(const [i,f] of [0,.1,.2,-.1].entries()) record=finish(record,i,sip(f));
  const text=buildShareText({num:P.num,key:P.key,theme:P.theme,result:{...record,counts:true}});
  assert.match(text,/Average of 4/);
  assert.match(text,/Blackout \d+\/100/);
  const link=new URL(text.split('\n').at(-1));
  const friend=readFriendChallenge({search:link.search,key:P.key,num:P.num,theme:P.theme});
  assert.equal(friend.score,record.score);
  assert.deepEqual(friend.rounds,record.rounds.map(r=>r.score));
  assert.equal(comparisonCopy(friend,record).status,'tie');
  assert.equal(comparisonCopy({...friend,rounds:friend.rounds.slice(0,3)},record).status,'comparison');
  assert.equal(readFriendChallenge({search:link.search.replace(/rounds=[^&]+/,'rounds=100%2C100%2C100%2C100%2C100'),key:P.key,num:P.num,theme:P.theme}),null);
});

test('the daily controller resets legacy usage once, resumes progress and saves all four sips', () => {
  const storage=browserStorage([[LEGACY_RECORD_STORE,JSON.stringify({days:{[P.key]:{done:true,score:90}}})]]);
  let app=controllerApp({P,storage});
  app.restore();
  assert.equal(app.S.state,'intro');
  app.sip(30);
  assert.equal(app.S.progress.rounds.length,1);
  app=controllerApp({P,storage});
  app.restore();
  assert.equal(app.S.progress.rounds.length,1);
  app.sip(30); app.sip(30);
  assert.equal(app.S.state,'between');
  app.begin(); app.ready();
  assert.equal(app.S.P.blackout,true);
  app.press(); app.advance(120); app.release(); app.settle();
  assert.equal(app.S.state,'result');
  assert.equal(app.S.result.counts,true);
  assert.equal(app.S.result.rounds.length,4);
  const saved=JSON.parse(storage.values.get(RECORD_STORE));
  assert.equal(saved.days[P.key].done,true);
  assert.equal(saved.blackoutRelease.previous.score,90);
  const reopened=controllerApp({P,storage}); reopened.restore();
  assert.equal(reopened.S.state,'result');
  assert.equal(reopened.S.result.score,app.S.result.score);
});
