import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CALENDAR, CALENDAR_THEME_IDS, ROTATION_IDS} from '../site/js/calendar-data.js';
import {SEASONAL_CALENDAR_DAYS, SEASONAL_CAMPAIGNS, NEW_SEASONAL_THEME_IDS} from '../site/js/seasonal-calendar.js';
import {dayParams, themeById, secondsToMark, DRAIN_LEVEL, REVIEW_THEMES} from '../site/js/core.js';
import {addDateDays, createCalendarFeed, getCalendarAttribution, getCampaignForDate, getPublishedEntry, keyToDayNumber, latestLiveDate, normalizeCalendarPlan, validateCalendarPlan} from '../site/js/content-calendar.js';
import {contentReadiness} from '../site/js/content-readiness.js';
import {prepareCalendarChange} from '../scripts/content-calendar.js';
import {checkCalendarContent} from '../scripts/check-calendar-content.js';
import {resolveChallenge, canRecordChallenge} from '../site/js/challenge.js';

const before = JSON.parse(await readFile(new URL('./fixtures/calendar-before-seasonal-fill.json',import.meta.url),'utf8'));
const NOW = '2026-11-06T21:05:35.000Z';
const dates = Object.keys(SEASONAL_CALENDAR_DAYS);

test('all 26 editable gaps are promoted through the same future-only publishing rules',()=>{
  assert.equal(latestLiveDate(NOW),before.immutableThrough);
  const input=structuredClone(before.calendar);
  input.drafts=structuredClone(SEASONAL_CALENDAR_DAYS);
  for(const [id,run] of Object.entries(SEASONAL_CAMPAIGNS)) input.campaigns[id]={...run,status:'draft'};
  const review=prepareCalendarChange(input,{baseline:before.calendar,now:NOW,publish:true});
  assert.equal(review.promotedDates.length,26);
  assert.equal(review.nextVersion,7);
  assert.deepEqual(review.plan,normalizeCalendarPlan(CALENDAR));
  assert.deepEqual(CALENDAR.drafts,{});
  assert.deepEqual(validateCalendarPlan(CALENDAR,{baseline:before.calendar,now:NOW}),review.plan);
  assert.ok(dates.every(date=>date>before.immutableThrough));
  for(let date='2026-11-08';date<='2026-12-31';date=addDateDays(date,1)){
    assert.ok(getPublishedEntry(date),date+': missing reviewed assignment');
    assert.equal(contentReadiness(getPublishedEntry(date)).ready,true,date);
  }
  for(const date of ['2026-11-03','2026-11-04','2026-11-06','2026-11-07','2027-01-01']) assert.equal(getPublishedEntry(date),null);
  input.drafts['2026-11-07']={themeId:'pub',campaignId:'none'};
  assert.throws(()=>prepareCalendarChange(input,{baseline:before.calendar,now:NOW,publish:true}),/served or globally live/);
});

test('every old pin, campaign, catalog position and served pour remains unchanged',()=>{
  for(const [date,entry] of Object.entries(before.calendar.days)) assert.deepEqual(CALENDAR.days[date],entry,date);
  for(const [date,entry] of Object.entries(before.calendar.days)) if(entry.campaignId==='none') assert.equal(getCampaignForDate(date),null,date+': standalone NFL date inherited a seasonal run');
  for(const [id,run] of Object.entries(before.calendar.campaigns)) assert.deepEqual(CALENDAR.campaigns[id],run,id);
  for(const [date,expected] of Object.entries(before.snapshots)){
    const P=dayParams(keyToDayNumber(date));
    assert.deepEqual({num:P.num,key:P.key,theme:P.theme.id,markY:P.markY,markH:P.markH,K:P.K,wobble:P.wobble,choppy:P.choppy},expected,date);
  }
  assert.equal(REVIEW_THEMES.length,115);
  assert.deepEqual(ROTATION_IDS,['pub','beach','munich','sapporo','butterbeer','peroni']);
  assert.equal(CALENDAR_THEME_IDS.length,75);
  assert.equal(NEW_SEASONAL_THEME_IDS.length,19);
  assert.equal(contentReadiness({themeId:'hanukkah-dreidel-night',campaignId:'none'}).ready,false);
  assert.equal(contentReadiness({themeId:'christmas-coors-sleigh-lodge',campaignId:'none'}).ready,false);
});

test('every selected glass has approved artwork, a reachable official pour, and campaign attribution',async()=>{
  await checkCalendarContent(CALENDAR);
  for(const date of dates){
    const entry=CALENDAR.days[date],P=dayParams(keyToDayNumber(date));
    assert.equal(P.theme.id,entry.themeId,date);
    assert.ok(CALENDAR_THEME_IDS.includes(entry.themeId));
    assert.ok(P.markY+P.markH/2<DRAIN_LEVEL,date);
    assert.ok(secondsToMark(P)<15,date);
    assert.equal(contentReadiness(entry).ready,true);
    assert.equal(contentReadiness({...entry,campaignId:'halloween-2026'}).ready,false);
    const [year,month,day]=date.split('-').map(Number),now=new Date(year,month-1,day,12);
    const challenge=resolveChallenge({now,search:'?day='+date,launchReady:true});
    assert.equal(challenge.kind,'today');
    assert.equal(canRecordChallenge({...challenge,now,launchReady:true}),true);
    assert.equal(getCalendarAttribution(date,P.theme).campaign_id,entry.campaignId);
    assert.ok(!/chicago|halloween/.test(entry.themeId));
  }
});

test('Guinness returns every three or four days and holiday paintings match the intended dates',()=>{
  const pints=[];
  for(let date='2026-11-07';date<='2026-12-31';date=addDateDays(date,1)){
    if(dayParams(keyToDayNumber(date)).theme.name==='Guinness')pints.push(keyToDayNumber(date));
  }
  for(let i=1;i<pints.length;i++)assert.ok([3,4].includes(pints[i]-pints[i-1]));
  for(const [date,id] of [
    ['2026-11-21','thanksgiving-friendsgiving'],['2026-11-24','thanksgiving-homecoming'],['2026-11-28','thanksgiving-fireside'],
    ['2026-12-04','hanukkah-window-lights'],['2026-12-11','hanukkah-bakery'],['2026-12-16','christmas-modelo-posada'],
    ['2026-12-26','christmas-guinness-edinburgh-train']
  ])assert.equal(CALENDAR.days[date].themeId,id);
  assert.match(CALENDAR.days['2026-12-04'].occasion.title,/first candle/);
  assert.match(CALENDAR.days['2026-12-11'].occasion.title,/eighth candle/);
  assert.match(CALENDAR.days['2026-12-16'].occasion.sourceUrl,/cultura.gob.mx/);
});

test('both subscriptions confirm every new date with its correct theme, run and stable event ID',()=>{
  for(const includeDrafts of [false,true]){
    const feed=createCalendarFeed({plan:CALENDAR,startDate:'2026-11-06',endDate:'2027-01-01',includeDrafts,now:NOW,
      resolveTheme:(date,id)=>id?themeById(id):dayParams(keyToDayNumber(date)).theme}).replace(/\r\n[ \t]/g,'');
    const events=feed.split('BEGIN:VEVENT\r\n').slice(1);
    for(const date of dates){
      const event=events.find(event=>event.includes('DTSTART;VALUE=DATE:'+date.replaceAll('-','')));
      assert.match(event,/STATUS:CONFIRMED/);
      assert.match(event,/SEQUENCE:7/);
      assert.ok(event.includes(themeById(CALENDAR.days[date].themeId).label),date);
      assert.ok(!event.includes('Unplanned fallback'),date);
      if(CALENDAR.days[date].occasion){
        assert.match(event,/Occasion checked 2026-11-06/);
        assert.ok(!event.includes('NFL flex scheduling'));
      }
    }
    for(const date of ['2026-11-06','2026-11-07','2027-01-01']){
      const event=events.find(event=>event.includes('DTSTART;VALUE=DATE:'+date.replaceAll('-','')));
      assert.match(event,/STATUS:TENTATIVE/);
      assert.match(event,/Unplanned fallback/);
    }
  }
});
