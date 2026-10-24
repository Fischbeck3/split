import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CALENDAR} from '../site/js/calendar-data.js';
import {NFL_TEAMS} from '../site/js/nfl-themes.js';
import {NFL_CALENDAR_DAYS} from '../site/js/nfl-calendar.js';
import {dayParams,themeById} from '../site/js/core.js';
import {contentReadiness} from '../site/js/content-readiness.js';
import {addDateDays,createCalendarFeed,getCalendarAttribution,getPublishedEntry,keyToDayNumber,normalizeCalendarPlan,validateCalendarPlan} from '../site/js/content-calendar.js';
import {prepareCalendarChange,serializeCalendarPlan} from '../scripts/content-calendar.js';

const verified = JSON.parse(await readFile(new URL('../docs/content/nfl-calendar-2026.json',import.meta.url),'utf8'));
const phoenixDate = instant => new Intl.DateTimeFormat('en-CA',{timeZone:'America/Phoenix',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(instant));
const normalized = () => normalizeCalendarPlan(CALENDAR);

test('every published NFL cup belongs to its verified game, on the Phoenix game date',()=>{
  assert.equal(verified.games.length,31);
  assert.equal(verified.timezone,'America/Phoenix');
  assert.deepEqual(Object.keys(NFL_CALENDAR_DAYS),verified.games.map(game=>game.date));
  for(const game of verified.games){
    const entry=getPublishedEntry(game.date),team=NFL_TEAMS.find(team=>team.id===entry.themeId);
    assert.equal(phoenixDate(game.kickoffUtc),game.date,game.eventId);
    assert.ok([game.away,game.home].includes(team.team),game.date+' features a team that is not playing');
    assert.equal(entry.themeId,game.themeId);
    assert.equal(entry.occasion.sourceUrl,game.officialSource);
    assert.equal(entry.occasion.checkedAt,verified.checkedAt);
    assert.equal(contentReadiness(entry).ready,true);
    assert.equal(dayParams(keyToDayNumber(game.date)).theme.id,entry.themeId);
    assert.equal(entry.campaignId,'none');
    assert.equal(getCalendarAttribution(game.date,themeById(entry.themeId)).campaign_id,'none');
  }
  assert.deepEqual(validateCalendarPlan(CALENDAR,{now:'2026-10-24T17:00:00Z'}),normalized());
});

test('holiday and rivalry anchors use actual fixtures while remaining dates stay unplanned',()=>{
  for(const [date,id,title] of [
    ['2026-11-15','nfl-bengals','Steelers at Bengals'],
    ['2026-11-26','nfl-cowboys','Eagles at Cowboys'],
    ['2026-11-29','nfl-49ers','Seahawks at 49ers'],
    ['2026-11-30','nfl-panthers','Panthers at Buccaneers'],
    ['2026-12-06','nfl-browns','Bengals at Browns'],
    ['2026-12-25','nfl-bears','Packers at Bears'],
    ['2026-12-31','nfl-bengals','Ravens at Bengals']
  ]){
    assert.equal(CALENDAR.days[date].themeId,id);
    assert.ok(CALENDAR.days[date].occasion.title.startsWith(title));
  }
  let unplanned=0;
  for(let date='2026-11-01';date<='2026-12-31';date=addDateDays(date,1)){
    if(!Object.hasOwn(NFL_CALENDAR_DAYS,date)){
      assert.equal(getPublishedEntry(date),null);
      unplanned++;
    }
  }
  assert.equal(unplanned,30);
  assert.equal(getPublishedEntry('2027-01-01'),null);
});

test('occasion provenance survives export, promotion and all-day subscription feeds',()=>{
  const baseline=normalized();delete baseline.days['2026-11-29'];
  const input=structuredClone(baseline);
  input.drafts['2026-11-29']={...structuredClone(CALENDAR.days['2026-11-29']),notes:'Reviewed game date.'};
  const promoted=prepareCalendarChange(input,{baseline,publish:true,date:'2026-11-29',now:'2026-10-24T17:00:00Z'}).plan;
  assert.deepEqual(promoted.days['2026-11-29'],CALENDAR.days['2026-11-29']);
  assert.ok(serializeCalendarPlan(promoted).includes('Seahawks at 49ers'));
  const feed=createCalendarFeed({startDate:'2026-11-29',endDate:'2026-12-01',plan:promoted,now:'2026-10-24T17:00:00Z',resolveTheme:(date,id)=>id?themeById(id):dayParams(keyToDayNumber(date)).theme});
  const events=feed.replace(/\r\n[ \t]/g,'').split('BEGIN:VEVENT\r\n').slice(1);
  assert.match(events[0],/SUMMARY:.*Seahawks at 49ers/);
  assert.match(events[0],/STATUS:CONFIRMED/);
  assert.match(events[0],/Matchup checked 2026-10-24/);
  assert.match(events[0],/Source: https/);
  assert.match(events[1],/DTSTART;VALUE=DATE:20261130\r\nDTEND;VALUE=DATE:20261201/);
  assert.match(events[2],/Unplanned fallback/);
  assert.match(events[2],/STATUS:TENTATIVE/);
  assert.ok(!events[2].includes('Matchup checked'));
  const entry=getPublishedEntry('2026-11-29');entry.occasion.title='Changed';
  assert.ok(CALENDAR.days['2026-11-29'].occasion.title.startsWith('Seahawks'));
});

test('imports reject malformed occasion metadata instead of dropping it or accepting unsafe source URLs',()=>{
  for(const mutate of [
    e=>e.occasion.title='',e=>e.occasion.title='Two\nlines',e=>e.occasion.title=['Coerced'],
    e=>e.occasion.detail='x'.repeat(1001),e=>e.occasion.sourceUrl='javascript:alert(1)',
    e=>e.occasion.sourceUrl='https://name:secret@example.com',e=>e.occasion.checkedAt='2026-02-30',
    e=>e.occasion.checkedAt='2027-01-01',e=>e.occasion.unrecognized=true
  ]){
    const plan=normalized();mutate(plan.days['2026-11-29']);
    assert.throws(()=>normalizeCalendarPlan(plan));
  }
  const plan=normalized();plan.days['2026-11-29'].occasion.detail='Changed historical context';
  assert.throws(()=>validateCalendarPlan(plan,{baseline:CALENDAR,now:'2026-11-29T17:00:00Z'}),/served or globally live/);
});
