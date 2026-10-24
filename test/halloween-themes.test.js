import {test} from 'node:test';
import assert from 'node:assert/strict';
import {HALLOWEEN_THEME_IDS, PREVIEW_THEME_IDS} from '../site/js/themes.js';
import {HALLOWEEN_GUINNESS_IDS} from '../site/js/halloween-themes.js';
import {CALENDAR} from '../site/js/calendar-data.js';
import {THEMES,REVIEW_THEMES,themeById,themeForDay,makeDrinkState,stepDrink} from '../site/js/core.js';
import {SCENES,MARKS,SCENE_ART,drawScene,drawMark,drawBackdrop,loadSceneAssets} from '../site/js/draw.js';
import {renderVessel} from '../site/js/render-vessels.js';
import {targetGeometry} from '../site/js/target.js';
import {readThemeReview,reviewHash} from '../site/js/theme-review.js';
import {isGuinnessTheme} from '../site/js/brand-assets.js';
import {physicalGlassParams} from './fixtures/physical-glasses.js';

function canvas(){
  const calls=[],state={globalAlpha:1};
  const c=new Proxy(state,{
    get(target,key){
      if (key in target) return target[key];
      if (key==='createLinearGradient'||key==='createRadialGradient') return (...args)=>{
        calls.push([key,...args]);return {addColorStop(...stops){calls.push(['colorStop',...stops]);}};
      };
      return (...args)=>{
        for (const arg of args) if (typeof arg==='number') assert.ok(Number.isFinite(arg),key+': nonfinite canvas geometry');
        calls.push([key,...args]);
      };
    },
    set(target,key,value){target[key]=value;calls.push(['set',key,typeof value?.addColorStop==='function'?'gradient':value]);return true;}
  });
  return {c,calls};
}

test('the eight Halloween themes retain their review week and preserve the automatic six and travel fifteen',()=>{
  const nonAutumn=REVIEW_THEMES.filter(t=>!['autumn','winter','thanksgiving','hanukkah','christmas','nfl'].includes(t.seasonal));
  assert.equal(HALLOWEEN_THEME_IDS.length,8);assert.equal(PREVIEW_THEME_IDS.length,15);assert.equal(nonAutumn.length,29);
  assert.equal(new Set(nonAutumn.map(t=>t.id)).size,29);
  assert.deepEqual(THEMES.map(t=>t.id),['pub','beach','munich','sapporo','butterbeer','peroni']);
  for (let day=1;day<=730;day++){
    assert.ok(THEMES.some(t=>t.id===themeForDay(day,{...CALENDAR,days:{}}).id),'a Halloween scene reached an automatic day '+day);
  }
  for (const id of HALLOWEEN_THEME_IDS){
    const theme=themeById(id),review=readThemeReview(reviewHash(id));
    assert.equal(theme.seasonal,'halloween');assert.equal(theme.preview,true);
    assert.equal(review.theme.id,id);assert.equal(review.P.theme.id,id);assert.equal(review.kind,'preview');
    assert.ok(SCENES.includes(theme.scene));assert.ok(MARKS.includes(theme.mark));
    assert.ok(SCENE_ART[theme.scene].url.endsWith('/scenes/'+id+'.webp'));
    assert.equal(SCENE_ART[theme.scene].framing,'table');
  }
  const beers=HALLOWEEN_THEME_IDS.filter(id=>!HALLOWEEN_GUINNESS_IDS.includes(id)).map(themeById);
  assert.equal(new Set(beers.map(t=>t.body.join(':'))).size,5,'colored beers need five distinct pours');
  assert.equal(new Set(beers.map(renderVessel)).size,5,'colored beers need five distinct displayed vessels');
  assert.equal(new Set(beers.map(t=>t.mark)).size,5,'colored beers need five different Halloween targets');
});

test('all three Halloween Guinness settings preserve every original Guinness foreground and physics feature',()=>{
  assert.equal(HALLOWEEN_GUINNESS_IDS.length,3);
  const original=physicalGlassParams('pub'),G={cx:187.5,top:170,bot:417,halfW:65,glass:'tulip'},backdrop={};
  const reference=canvas();drawScene(reference.c,{G,w:375,h:667,L:.63,theme:original.theme,P:original,backdrop,bubbles:false});
  const fields=['vessel','box','body','head','headT','mark','letter','markFill','markStroke','target','markRange','markHRange','speed','choppy'];
  for (const id of HALLOWEEN_GUINNESS_IDS){
    const theme=themeById(id),P={...original,theme},recorded=canvas();
    assert.equal(isGuinnessTheme({id}),true);
    for (const field of fields) assert.deepEqual(theme[field],original.theme[field],id+': changed '+field);
    assert.deepEqual(targetGeometry(G,P,theme),targetGeometry(G,original,original.theme));
    drawScene(recorded.c,{G,w:375,h:667,L:.63,theme,P,backdrop,bubbles:false});
    assert.deepEqual(recorded.calls,reference.calls,id+': changed the original glass print or material');
    let a=makeDrinkState(original),b=makeDrinkState(P);
    for (let tick=0;tick<420;tick++){
      const rate=tick<300?original.K:0;a=stepDrink(original,a,rate,1/120);b=stepDrink(P,b,rate,1/120);
      assert.deepEqual(b,a,id+': changed flow at tick '+tick);
    }
  }
});

test('the Halloween icon features meet the scored origin and retain dark/light keylines through full or empty glass',()=>{
  const features={
    pumpkin:call=>call[0]==='moveTo'&&call[1]===-.29&&call[2]===0,
    ghost:call=>call[0]==='arc'&&call[1]===-.12&&call[2]===0,
    cauldron:call=>call[0]==='ellipse'&&call[1]===0&&call[2]===0&&call[3]===.45,
    bat:call=>call[0]==='moveTo'&&Math.abs(call[1])===.13&&call[2]===0,
    skull:call=>call[0]==='ellipse'&&call[1]===-.16&&call[2]===0
  };
  for (const id of HALLOWEEN_THEME_IDS.filter(id=>!HALLOWEEN_GUINNESS_IDS.includes(id))){
    const review=readThemeReview('#admin/'+id),theme=review.theme,P=review.P;
    for (const G of [{cx:160,top:135,bot:350,halfW:48,glass:renderVessel(theme)},{cx:490,top:80,bot:680,halfW:140,glass:renderVessel(theme)}]){
      const aim=targetGeometry(G,P,theme),{c,calls}=canvas();drawMark(c,theme,G.cx,aim.y,aim.markHeight);
      assert.deepEqual(calls.find(call=>call[0]==='translate'),['translate',G.cx,aim.y]);
      assert.deepEqual(calls.find(call=>call[0]==='scale'),['scale',aim.markHeight,aim.markHeight]);
      assert.ok(calls.some(features[theme.mark]),id+': intended feature missed y=0');
      assert.ok(calls.some(call=>call[0]==='set'&&call[1]==='strokeStyle'&&call[2]==='#182220'),'missing dark keyline');
      assert.ok(calls.some(call=>call[0]==='set'&&call[1]==='strokeStyle'&&call[2]==='#fff3d8'),'missing light keyline');
      assert.equal(calls.filter(call=>call[0]==='save').length,calls.filter(call=>call[0]==='restore').length,'icon leaked drawing state');
      assert.equal(aim.y,G.top+P.markY*(G.bot-G.top));
    }
  }
});

test('the seasonal Guinness print decodes once alongside the original and waits before rendering',async()=>{
  const previous=globalThis.Image,requests=[];let decode;
  globalThis.Image=class{decode(){return new Promise(resolve=>{decode=resolve;});}set src(value){requests.push(value);this.onload();}};
  try{
    const assets=await import('../site/js/brand-assets.js?seasonal-guinness');
    const loading=['pub',...HALLOWEEN_GUINNESS_IDS].map(id=>assets.loadBrandAssets({id}));
    let ready=false;loading[0].then(()=>{ready=true;});await Promise.resolve();
    assert.equal(ready,false);assert.equal(assets.guinnessPrintImage(),null);assert.equal(requests.length,1);
    assert.ok(requests[0].endsWith('/brands/guinness-glass-print.svg'));
    for(const id of HALLOWEEN_THEME_IDS.filter(id=>!HALLOWEEN_GUINNESS_IDS.includes(id)))assert.equal(await assets.loadBrandAssets(themeById(id)),null);
    decode();const prints=await Promise.all(loading);for(const print of prints)assert.equal(print,prints[0]);
  }finally{globalThis.Image=previous;}
});

test('Halloween backdrops preserve their whole upper scene and extend the real table in game and postcard sizes',async()=>{
  const previous=globalThis.Image,requests=[];
  globalThis.Image=class{naturalWidth=1024;naturalHeight=1536;decode(){return Promise.resolve();}set src(value){this.url=value;requests.push(value);queueMicrotask(()=>this.onload());}};
  try{
    for(const id of HALLOWEEN_THEME_IDS){
      const theme=themeById(id),art=SCENE_ART[theme.scene];await loadSceneAssets(theme);await loadSceneAssets(theme);
      assert.equal(requests.filter(url=>url.endsWith('/scenes/'+id+'.webp')).length,1,'same scene decoded twice');
      for(const[w,h,bot]of[[320,568,300],[375,667,500],[560,876,690],[630,455,405]]){
        for(const titleWash of[false,true]){
          const{c,calls}=canvas();drawBackdrop(c,w,h,{bot},theme,titleWash);
          const images=calls.filter(call=>call[0]==='drawImage'),first=images[0],last=images.at(-1);
          assert.equal(first[2],0);assert.equal(first[3],0);assert.equal(first[4],1024);assert.equal(first[5],1536);
          assert.equal(first[7],0,'seasonal scene gained a title inset');
          assert.ok(first[6]<=0&&first[6]+first[8]>=w,'upper scene left a horizontal gap');
          assert.ok(last[3]>=1536*art.table,'foreground used scenery pixels instead of real wood');
          assert.equal(last[6],0);assert.equal(last[8],w);assert.equal(last[7]+last[9],h,'table extension left a bottom gap');
          assert.equal(last[7],Math.max(h*.4,bot-h*.08)+12,'foreground moved away from the vessel anchor');
        }
      }
    }
  }finally{globalThis.Image=previous;}
});
