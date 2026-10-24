import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {NFL_TEAMS,NFL_THEME_IDS,NFL_DIVISIONS} from '../site/js/nfl-themes.js';
import {CALENDAR,ROTATION_IDS} from '../site/js/calendar-data.js';
import {REVIEW_THEMES,CALENDAR_THEMES,themeById,startLevel,DRAIN_LEVEL,secondsToMark} from '../site/js/core.js';
import {readThemeReview} from '../site/js/theme-review.js';
import {targetGeometry} from '../site/js/target.js';
import {SCENE_ART,drawMark} from '../site/js/draw.js';
import {loadBrandAssets,nflPrintImage,nflPrintURL} from '../site/js/brand-assets.js';
import {checkCalendarContent} from '../scripts/check-calendar-content.js';
import {addDateDays} from '../site/js/content-calendar.js';

test('all 32 distinct NFL teams retain built review cups and the fixed fallback six',async()=>{
  assert.equal(NFL_THEME_IDS.length,32);assert.equal(new Set(NFL_TEAMS.map(t=>t.team)).size,32);
  assert.equal(NFL_DIVISIONS.length,8);
  for(const division of NFL_DIVISIONS) assert.equal(NFL_TEAMS.filter(team=>team.division===division).length,4);
  assert.equal(NFL_TEAMS.find(team=>team.id==='nfl-49ers').label,'Candlestick Park');
  assert.deepEqual(ROTATION_IDS,['pub','beach','munich','sapporo','butterbeer','peroni']);
  assert.equal(REVIEW_THEMES.length,115);
  assert.equal(REVIEW_THEMES[81].id,'christmas-sierra-high-sierras-cabin');
  assert.equal(REVIEW_THEMES[82].id,'halloween-lantern-maze');
  for(const id of NFL_THEME_IDS){
    const theme=themeById(id),review=readThemeReview('#admin/'+id),art=SCENE_ART[id];
    assert.equal(theme.vessel,'cup');assert.equal(theme.material,'plastic');assert.equal(theme.mark,'team');
    assert.equal(review.kind,'preview');assert.ok(CALENDAR_THEMES.includes(theme));
    assert.ok(art.table>.4&&art.table<.65);assert.equal(art.framing,'table');
    const scene=await readFile(new URL(art.url)),print=await readFile(new URL(nflPrintURL(theme)));
    assert.equal(scene.toString('ascii',0,4),'RIFF');assert.equal(print.toString('ascii',1,4),'PNG');
    assert.ok(review.P.markY-review.P.markH/2>startLevel(theme));
    assert.ok(review.P.markY+review.P.markH/2<DRAIN_LEVEL);
    assert.ok(secondsToMark(review.P)>0&&secondsToMark(review.P)<15);
  }
});

test('scheduling verifies both the scene and exact team print, and rejects a changed logo',async()=>{
  const plan={campaigns:{},days:Object.fromEntries(NFL_THEME_IDS.map((themeId,index)=>[addDateDays('2026-11-01',index),{themeId,campaignId:'none'}]))};
  await checkCalendarContent(plan);
  await assert.rejects(()=>checkCalendarContent(plan,{read:async url=>url.pathname.includes('/brands/nfl/')?Buffer.from('changed logo'):readFile(url)}),/team print changed since approval/);
  await assert.rejects(()=>checkCalendarContent(plan,{read:async url=>{if(url.pathname.includes('/brands/nfl/'))throw new Error('missing');return readFile(url);}}),/missing team print/);
});

test('the self-hosted team print decodes once and its visible center stays on the scoring origin',async()=>{
  const previous=globalThis.Image,requests=[];
  globalThis.Image=class{naturalWidth=200;naturalHeight=100;decode(){return Promise.resolve();}set src(url){requests.push(url);queueMicrotask(()=>this.onload());}};
  try{
    for(const id of NFL_THEME_IDS){
      const theme=themeById(id);await Promise.all([loadBrandAssets(theme),loadBrandAssets(theme)]);
      assert.ok(nflPrintImage(theme));assert.equal(requests.filter(url=>url===nflPrintURL(theme)).length,1);
      const calls=[];const c=new Proxy({}, {get:(_,name)=>(...args)=>calls.push([name,...args]),set:()=>true});
      drawMark(c,theme,200,300,40);
      assert.deepEqual(calls.find(call=>call[0]==='translate'),['translate',200,300]);
      assert.deepEqual(calls.find(call=>call[0]==='scale'),['scale',40,40]);
      const P=readThemeReview('#admin/'+id).P;
      const geometry=targetGeometry({top:120,bot:430,halfW:87,glass:'cup'},P,theme);
      assert.ok(geometry.markHeight*2.15<=geometry.vesselHalfWidth*1.8,'team mark spills outside the cup');
      const image=calls.find(call=>call[0]==='drawImage');
      assert.equal(image[2]+image[4]/2,0);assert.equal(image[3]+image[5]/2,0);
      assert.ok(image[4]<=2.15&&image[5]<=1.2);
    }
  }finally{globalThis.Image=previous;}
});

test('a failed team logo resolves without blocking the game and retains a safe initials fallback',async()=>{
  const previous=globalThis.Image;
  globalThis.Image=class{set src(url){queueMicrotask(()=>this.onerror());}};
  try{
    const assets=await import('../site/js/brand-assets.js?nfl-failed-load');
    const theme=themeById('nfl-49ers');assert.equal(await assets.loadBrandAssets(theme),null);
    assert.equal(assets.nflPrintImage(theme),null);
    assert.equal(assets.nflPrintURL({...theme,brand:'nfl-../../outside'}),null);
  }finally{globalThis.Image=previous;}
});
