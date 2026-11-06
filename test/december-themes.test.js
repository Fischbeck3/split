import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CALENDAR} from '../site/js/calendar-data.js';
import {DECEMBER_FEATURE_IDS,DECEMBER_LINEUP,DECEMBER_THEME_IDS} from '../site/js/december-themes.js';
import {REVIEW_THEMES,THEMES,dayParams,themeById,startLevel,makeDrinkState,stepDrink} from '../site/js/core.js';
import {keyToDayNumber,createCalendarFeed,validateCalendarPlan} from '../site/js/content-calendar.js';
import {SCENE_ART} from '../site/js/draw.js';
import {contentReadiness} from '../site/js/content-readiness.js';
import {checkCalendarContent} from '../scripts/check-calendar-content.js';
import {readThemeReview} from '../site/js/theme-review.js';
import {renderVessel,CHALICE_BOWL_DEPTH} from '../site/js/render-vessels.js';

const before=JSON.parse(readFileSync(new URL('./fixtures/pre-december.json',import.meta.url)));

test('every December date serves a distinct festive holiday gathering, including Christmas and New Year’s Eve',async()=>{
  assert.equal(DECEMBER_LINEUP.length,31);
  assert.equal(new Set(DECEMBER_THEME_IDS).size,31);
  assert.equal(new Set(DECEMBER_THEME_IDS.map(id=>themeById(id).scene)).size,31);
  for(let day=1;day<=31;day++){
    const date='2026-12-'+String(day).padStart(2,'0'),entry=CALENDAR.days[date],P=dayParams(keyToDayNumber(date));
    assert.ok(entry,date+' is unplanned');
    assert.equal(entry.campaignId,'december-2026');
    assert.equal(entry.occasion,undefined,'superseded NFL metadata leaked into the holiday date');
    assert.equal(P.theme.id,entry.themeId);assert.equal(P.theme.seasonal,'december');
    assert.ok(P.theme.festivePrint);assert.equal(P.theme.collectionDate,date);
    assert.equal(contentReadiness(entry).ready,true,date+' is not ready');
  }
  assert.equal(CALENDAR.days['2026-12-24'].themeId,'december-home-tree');
  assert.equal(CALENDAR.days['2026-12-25'].themeId,'december-christmas-lodge');
  assert.equal(CALENDAR.days['2026-12-31'].themeId,'december-midnight');
  validateCalendarPlan(CALENDAR,{now:'2026-11-06T19:00:00Z'});
  await checkCalendarContent(CALENDAR);
});

test('December leaves all earlier pins, seeded pours, review positions, and fallback choices intact',()=>{
  assert.deepEqual(Object.fromEntries(Object.entries(CALENDAR.days).filter(([date])=>date<'2026-12-01')),before.days);
  assert.deepEqual(REVIEW_THEMES.slice(0,115).map(theme=>theme.id),before.reviewIds);
  assert.deepEqual(THEMES.map(theme=>theme.id),['pub','beach','munich','sapporo','butterbeer','peroni']);
  for(const[date,expected]of Object.entries(before.daily)){
    const P=dayParams(keyToDayNumber(date));
    assert.deepEqual({theme:P.theme.id,markY:P.markY,markH:P.markH,K:P.K},expected,date+' changed');
  }
});

test('six festive cup designs remain playable, with their marks inside the liquid-bearing body',()=>{
  assert.equal(DECEMBER_FEATURE_IDS.length,6);
  assert.equal(new Set(DECEMBER_FEATURE_IDS.map(id=>themeById(id).festivePrint)).size,6);
  for(const id of DECEMBER_THEME_IDS){
    const theme=themeById(id),review=readThemeReview('#admin/'+id),P=dayParams(keyToDayNumber(theme.collectionDate));
    assert.equal(review.theme.id,id);assert.equal(review.kind,'preview');
    const bodyBottom=renderVessel(theme)==='chalice'?CHALICE_BOWL_DEPTH:1;
    assert.ok(P.markY>startLevel(theme));assert.ok(P.markY+P.markH<bodyBottom);
    let state=makeDrinkState(P),reached=false;
    for(let tick=0;tick<2400;tick++){
      state=stepDrink(P,state,P.K,1/120);
      assert.ok(Number.isFinite(state.level));
      if(state.level>=P.markY){reached=true;break;}
    }
    assert.ok(reached,id+' target cannot be reached');
    const plain={...P,theme:{...theme,festivePrint:undefined}};
    let a=makeDrinkState(P),b=makeDrinkState(plain);
    for(let tick=0;tick<240;tick++){
      const rate=tick<180?P.K:0;
      a=stepDrink(P,a,rate,1/120);b=stepDrink(plain,b,rate,1/120);
      assert.deepEqual(a,b,id+' decoration changed the pour');
    }
    assert.ok(SCENE_ART[theme.scene],id+' has no registered painting');
  }
});

test('December subscription contains 31 confirmed holiday days and no superseded matchup claims',()=>{
  const feed=createCalendarFeed({startDate:'2026-12-01',endDate:'2026-12-31',plan:CALENDAR,now:'2026-11-06T19:00:00Z',
    resolveTheme:(date,id)=>id?themeById(id):dayParams(keyToDayNumber(date)).theme}).replace(/\r\n[ \t]/g,'');
  assert.equal((feed.match(/BEGIN:VEVENT/g)||[]).length,31);
  assert.equal((feed.match(/STATUS:CONFIRMED/g)||[]).length,31);
  assert.ok(!/Unplanned fallback|Matchup checked|STATUS:TENTATIVE/.test(feed));
  assert.match(feed,/One last holiday toast/);
});
