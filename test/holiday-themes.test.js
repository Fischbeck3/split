import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {THANKSGIVING_THEME_IDS,HANUKKAH_THEME_IDS,HOLIDAY_THEME_IDS,HOLIDAY_GUINNESS_IDS,CHRISTMAS_REVIEW_IDS} from '../site/js/holiday-themes.js';
import {WINTER_THEME_IDS} from '../site/js/themes.js';
import {CALENDAR} from '../site/js/calendar-data.js';
import {THEMES,CALENDAR_THEMES,REVIEW_THEMES,themeById,themeForDay,makeDrinkState,stepDrink,secondsToMark,scoreFromOffset} from '../site/js/core.js';
import {SCENE_ART,SCENES,MARKS,drawScene,drawMark,drawBackdrop,loadSceneAssets} from '../site/js/draw.js';
import {renderVessel} from '../site/js/render-vessels.js';
import {targetGeometry} from '../site/js/target.js';
import {roomScenePlacement} from '../site/js/ambient.js';
import {readThemeReview,reviewHash} from '../site/js/theme-review.js';
import {isGuinnessTheme} from '../site/js/brand-assets.js';

function canvas(){
  const calls=[],state={globalAlpha:1};
  const c=new Proxy(state,{
    get(target,key){
      if(key in target)return target[key];
      if(key==='createLinearGradient'||key==='createRadialGradient')return (...args)=>{
        calls.push([key,...args]);return {addColorStop(...stops){calls.push(['colorStop',...stops]);}};
      };
      return (...args)=>{for(const arg of args)if(typeof arg==='number')assert.ok(Number.isFinite(arg),key+': nonfinite geometry');calls.push([key,...args]);};
    },
    set(target,key,value){target[key]=value;calls.push(['set',key,typeof value?.addColorStop==='function'?'gradient':value]);return true;}
  });
  return {c,calls};
}

test('seven Thanksgiving and three Hanukkah additions stay in unsaved review without acquiring dates',()=>{
  assert.equal(THANKSGIVING_THEME_IDS.length,7);assert.equal(HANUKKAH_THEME_IDS.length,3);
  assert.equal(REVIEW_THEMES.length,68);assert.equal(new Set(REVIEW_THEMES.map(t=>t.id)).size,68);
  assert.deepEqual(REVIEW_THEMES.slice(-10).map(t=>t.id),HOLIDAY_THEME_IDS);
  assert.equal(REVIEW_THEMES.filter(t=>!HOLIDAY_THEME_IDS.includes(t.id)).length,58);
  assert.deepEqual(THEMES.map(t=>t.id),['pub','beach','munich','sapporo','butterbeer','peroni']);
  assert.equal(CALENDAR_THEMES.length,23);
  assert.ok(Object.values(CALENDAR.days).every(id=>!HOLIDAY_THEME_IDS.includes(id) && !WINTER_THEME_IDS.includes(id)));
  for(let day=1;day<=730;day++){
    assert.ok(!HOLIDAY_THEME_IDS.includes(themeForDay(day).id));
    assert.ok(THEMES.includes(themeForDay(day,{...CALENDAR,days:{}})));
  }
  for(const id of HOLIDAY_THEME_IDS){
    const theme=themeById(id),route=readThemeReview(reviewHash(id));
    assert.equal(route.kind,'preview');assert.equal(route.theme.id,id);assert.equal(route.P.theme.id,id);
    assert.deepEqual(readThemeReview(reviewHash(id)).P,route.P,'review seed was not stable');
    assert.equal(theme.preview,true);assert.ok(theme.line.includes(theme.target));
    assert.ok(SCENES.includes(id) && MARKS.includes(theme.mark));
  }
});

test('the Christmas fortnight reuses fourteen saved winter glasses and leaves the original fifteen intact',()=>{
  assert.equal(CHRISTMAS_REVIEW_IDS.length,14);assert.equal(new Set(CHRISTMAS_REVIEW_IDS).size,14);
  assert.equal(WINTER_THEME_IDS.length,15);
  assert.ok(CHRISTMAS_REVIEW_IDS.every(id=>WINTER_THEME_IDS.includes(id)));
  assert.ok(!CHRISTMAS_REVIEW_IDS.includes('winter-sierra-high-sierras'));
  for(const id of CHRISTMAS_REVIEW_IDS)assert.equal(readThemeReview('#admin/'+id).theme,themeById(id));
  const gallery=readFileSync(new URL('../site/js/christmas-gallery.js',import.meta.url),'utf8');
  assert.ok(gallery.includes("places.slice(0,7)") && gallery.includes('places.slice(7)'));
  assert.ok(gallery.includes('HANUKKAH_THEME_IDS.map'));
});

test('all seven new seasonal prints have a visible feature at the scored origin and contrasting keylines',()=>{
  const features={
    leaf:call=>call[0]==='lineTo' && call[1]===0 && call[2]===0,
    turkey:call=>call[0]==='ellipse' && call[1]===0 && call[2]===0 && call[3]===.23,
    football:call=>call[0]==='moveTo' && call[1]===-.23 && call[2]===0,
    wishbone:call=>call[0]==='bezierCurveTo' && call[5]===0 && call[6]===0,
    pie:call=>call[0]==='lineTo' && call[1]===.48 && call[2]===0,
    dreidel:call=>call[0]==='lineTo' && call[1]===0 && call[2]===0,
    jam:call=>call[0]==='arc' && call[1]===0 && call[2]===0 && call[3]===.13
  };
  for(const id of HOLIDAY_THEME_IDS.filter(id=>!HOLIDAY_GUINNESS_IDS.includes(id))){
    const {theme,P}=readThemeReview('#admin/'+id);
    for(const G of [{cx:160,top:135,bot:350,halfW:48,glass:renderVessel(theme)},{cx:490,top:80,bot:680,halfW:140,glass:renderVessel(theme)}]){
      const aim=targetGeometry(G,P,theme),{c,calls}=canvas();drawMark(c,theme,G.cx,aim.y,aim.markHeight);
      assert.deepEqual(calls.find(call=>call[0]==='translate'),['translate',G.cx,aim.y]);
      assert.deepEqual(calls.find(call=>call[0]==='scale'),['scale',aim.markHeight,aim.markHeight]);
      assert.ok(calls.some(features[theme.mark]),id+': feature missed score origin');
      assert.ok(calls.some(call=>call[0]==='set' && call[1]==='strokeStyle' && call[2]==='#192321'));
      assert.ok(calls.some(call=>call[0]==='set' && call[1]==='strokeStyle' && call[2]==='#fff2db'));
      assert.equal(calls.filter(call=>call[0]==='save').length,calls.filter(call=>call[0]==='restore').length);
      assert.equal(aim.y,G.top+P.markY*(G.bot-G.top));
    }
    assert.ok(secondsToMark(P)>0 && secondsToMark(P)<60,'target is unreachable');
    assert.equal(scoreFromOffset(0,theme.target).score,100);
    let sip=makeDrinkState(P),last=sip.level;
    for(let tick=0;tick<7200 && sip.level<P.markY;tick++){
      sip=stepDrink(P,sip,P.K,1/120);assert.ok(sip.level>=last && Number.isFinite(sip.level));last=sip.level;
    }
    assert.ok(sip.level>=P.markY,'continuous sip cannot reach the target');
  }
  assert.equal(themeById('thanksgiving-football').material,'plastic');
  assert.equal(renderVessel(themeById('thanksgiving-wishbone')),'chalice');
  assert.equal(renderVessel(themeById('thanksgiving-pie-kitchen')),'mug');
});

test('the three new Guinness settings preserve the original scored foreground and pour',()=>{
  const base=themeById('pub'),P=readThemeReview('#admin/pub').P;
  const G={cx:187.5,top:160,bot:450,halfW:62,glass:renderVessel(base)},original=canvas();
  drawScene(original.c,{G,w:375,h:667,L:P.markY,theme:base,P,backdrop:{},bubbles:false});
  for(const id of HOLIDAY_GUINNESS_IDS){
    const theme=themeById(id),holiday={...P,theme};assert.ok(isGuinnessTheme({id}));
    for(const field of ['name','vessel','box','body','head','headT','mark','letter','markFill','markStroke','target','markRange','markHRange','speed','choppy'])assert.deepEqual(theme[field],base[field]);
    assert.deepEqual(targetGeometry(G,holiday,theme),targetGeometry(G,P,base));
    const painted=canvas();drawScene(painted.c,{G,w:375,h:667,L:P.markY,theme,P:holiday,backdrop:{},bubbles:false});
    assert.deepEqual(painted.calls,original.calls);
    let a=makeDrinkState(P),b=makeDrinkState(holiday);
    for(let tick=0;tick<420;tick++){
      const rate=tick<300?P.K:0;a=stepDrink(P,a,rate,1/120);b=stepDrink(holiday,b,rate,1/120);assert.deepEqual(b,a);
    }
  }
});

test('all ten new paintings carry exact generation provenance and measured table anchors',()=>{
  const records=['thanksgiving-generation-a.json','thanksgiving-generation-b.json','hanukkah-generation.json']
    .flatMap(file=>JSON.parse(readFileSync(new URL('../site/assets/scenes/'+file,import.meta.url))));
  assert.equal(records.length,10);assert.equal(new Set(records.map(r=>r.id)).size,10);
  for(const id of HOLIDAY_THEME_IDS){
    const record=records.find(row=>row.id===id),art=SCENE_ART[id];assert.ok(record);
    assert.equal(record.tool,'built-in image_gen');assert.equal(record.mode,'generate');
    assert.equal(record.outputPath,'site/assets/scenes/'+id+'.webp');assert.equal(record.tabletop,art.table);
    assert.equal(record.framing,'table');assert.equal(art.framing,'table');assert.equal(art.fallback,'pub');
    assert.deepEqual(record.dimensions,[1024,1536]);assert.deepEqual(record.export,{format:'webp',quality:88,method:6});
    assert.ok(record.tabletop>.4 && record.tabletop<.75);
    assert.ok(record.prompt && record.generatedPath && record.inspection && record.referencedImagePaths.length);
    const asset=new URL('../site/assets/scenes/'+id+'.webp',import.meta.url);assert.ok(existsSync(asset));
    const sidecar=JSON.parse(readFileSync(new URL(asset.href+'.json')));
    assert.equal(sidecar.prompt,record.prompt);assert.equal(sidecar.mode,record.mode);assert.equal(sidecar.tool,record.tool);
    assert.equal(readFileSync(asset).subarray(8,12).toString(),'WEBP');
  }
});

test('holiday scenery caches selected art and anchors the real table across phone and postcard sizes',async()=>{
  const previous=globalThis.Image,requests=[];
  globalThis.Image=class{naturalWidth=1024;naturalHeight=1536;decode(){return Promise.resolve();}set src(url){this.url=url;requests.push(url);queueMicrotask(()=>this.onload());}};
  try{
    for(const id of HOLIDAY_THEME_IDS){
      const theme=themeById(id),art=SCENE_ART[id];await loadSceneAssets(theme);await loadSceneAssets(theme);
      assert.equal(requests.filter(url=>url.endsWith('/scenes/'+id+'.webp')).length,1);
      for(const[w,h,bot]of[[320,568,430],[390,844,600],[630,455,405]]){
        const {c,calls}=canvas();drawBackdrop(c,w,h,{bot},theme,false);
        const images=calls.filter(call=>call[0]==='drawImage'),first=images[0],last=images.at(-1);
        const placement=roomScenePlacement(w,h,{bot},{width:1024,height:1536,table:art.table,topInset:0});
        assert.ok(first[1].url.endsWith('/scenes/'+id+'.webp'));
        assert.deepEqual(first.slice(2,6),[0,0,1024,1536]);assert.equal(first[6],placement.x);assert.equal(first[7],0);
        assert.ok(last[3]>=1536*art.table);assert.equal(last[6],0);assert.equal(last[8],w);
        assert.equal(last[7],placement.tableY+12);assert.equal(last[7]+last[9],h);
      }
    }
  }finally{globalThis.Image=previous;}
});

test('a failed holiday painting recovers the established pub scene once without losing framing',async()=>{
  const previous=globalThis.Image,requests=[];
  globalThis.Image=class{naturalWidth=1024;naturalHeight=1536;decode(){return Promise.resolve();}set src(url){this.url=url;requests.push(url);queueMicrotask(()=>url.includes('/scenes/thanksgiving-')||url.includes('/scenes/hanukkah-')?this.onerror():this.onload());}};
  try{
    const drawing=await import('../site/js/draw.js?holiday-recovery');
    const original=canvas();await drawing.loadSceneAssets(themeById('pub'));drawing.drawBackdrop(original.c,390,844,{bot:600},themeById('pub'),false);
    for(const id of HOLIDAY_THEME_IDS){
      const theme=themeById(id);await drawing.loadSceneAssets(theme);const count=requests.length;await drawing.loadSceneAssets(theme);
      assert.equal(requests.length,count);const recovered=canvas();drawing.drawBackdrop(recovered.c,390,844,{bot:600},theme,false);
      assert.deepEqual(recovered.calls,original.calls);
    }
    assert.equal(requests.filter(url=>url===drawing.SCENE_ART.pub.url).length,1);
  }finally{globalThis.Image=previous;}
});
