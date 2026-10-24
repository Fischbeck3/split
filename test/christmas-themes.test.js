import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {CHRISTMAS_THEME_IDS,PREVIEW_THEME_IDS,HALLOWEEN_THEME_IDS} from '../site/js/themes.js';
import {CHRISTMAS_BASE_IDS,CHRISTMAS_GUINNESS_IDS} from '../site/js/christmas-themes.js';
import {CALENDAR} from '../site/js/calendar-data.js';
import {THEMES,CALENDAR_THEMES,REVIEW_THEMES,themeById,themeForDay,makeDrinkState,stepDrink} from '../site/js/core.js';
import {SCENE_ART,SCENES,drawScene,drawBackdrop,loadSceneAssets} from '../site/js/draw.js';
import {renderVessel} from '../site/js/render-vessels.js';
import {targetGeometry} from '../site/js/target.js';
import {roomScenePlacement} from '../site/js/ambient.js';
import {readThemeReview,reviewHash} from '../site/js/theme-review.js';
import {isGuinnessTheme} from '../site/js/brand-assets.js';

function canvas(){
  const calls=[],state={globalAlpha:1};
  const c=new Proxy(state,{
    get(target,key){
      if (key in target) return target[key];
      if (key==='createLinearGradient'||key==='createRadialGradient') return (...args)=>{
        calls.push([key,...args]);return {addColorStop(...stops){calls.push(['colorStop',...stops]);}};
      };
      return (...args)=>{
        for (const arg of args) if (typeof arg==='number') assert.ok(Number.isFinite(arg),key+': nonfinite geometry');
        calls.push([key,...args]);
      };
    },
    set(target,key,value){target[key]=value;calls.push(['set',key,typeof value?.addColorStop==='function'?'gradient':value]);return true;}
  });
  return {c,calls};
}

test('fourteen new Christmas seats retain the review order and leave automatic fallbacks unchanged',()=>{
  assert.equal(CHRISTMAS_THEME_IDS.length,14);assert.equal(PREVIEW_THEME_IDS.length,15);assert.equal(HALLOWEEN_THEME_IDS.length,8);
  const originalCatalog=REVIEW_THEMES.filter(t=>t.seasonal!=='nfl' && t.id!=='halloween-lantern-maze');
  assert.equal(originalCatalog.length,82);assert.equal(new Set(originalCatalog.map(t=>t.id)).size,82);
  assert.deepEqual(originalCatalog.slice(-14).map(t=>t.id),CHRISTMAS_THEME_IDS);
  assert.deepEqual(THEMES.map(t=>t.id),['pub','beach','munich','sapporo','butterbeer','peroni']);
  assert.equal(CALENDAR_THEMES.length,56);assert.ok(CALENDAR_THEMES.every(t=>!CHRISTMAS_THEME_IDS.includes(t.id)));
  assert.equal(CHRISTMAS_GUINNESS_IDS.length,4);assert.equal(CHRISTMAS_BASE_IDS.includes('guinness-chicago'),false);
  for (let day=1;day<=730;day++){
    assert.ok(THEMES.includes(themeForDay(day,{...CALENDAR,days:{}})),'seasonal artwork reached an automatic day '+day);
    assert.ok(!CHRISTMAS_THEME_IDS.includes(themeForDay(day).id),'Christmas artwork acquired a published date '+day);
  }
  for (const id of CHRISTMAS_THEME_IDS){
    const theme=themeById(id),review=readThemeReview(reviewHash(id));
    assert.equal(theme.seasonal,'christmas');assert.equal(theme.preview,true);
    assert.ok(theme.memory && theme.line.includes(theme.target));
    assert.equal(review.kind,'preview');assert.equal(review.theme.id,id);assert.equal(review.P.theme.id,id);
    assert.ok(SCENES.includes(id));assert.equal(SCENE_ART[id].framing,'table');
    assert.equal(SCENE_ART[id].fallback,theme.baseThemeId);
    assert.ok(SCENE_ART[id].url.endsWith('/scenes/'+id+'.webp'));
  }
});

test('every new Christmas drink inherits its complete base foreground, materials, scoring target and sip behavior',()=>{
  const fields=['name','feel','emoji','vessel','box','body','head','headT','mark','letter',
    'markFill','markStroke','target','markRange','markHRange','speed','choppy','bubbles','garnish','palette',
    'material','bottleTint','renderVessel','brandPrint','brandText','brandSubline','markFrame'];
  for (let index=0;index<CHRISTMAS_THEME_IDS.length;index++){
    const base=themeById(CHRISTMAS_BASE_IDS[index]),theme=themeById(CHRISTMAS_THEME_IDS[index]);
    assert.equal(theme.baseThemeId,base.id);assert.equal(theme.brand,base.id==='pub'?'guinness':base.brand);
    assert.equal(theme.colorScheme,base.id==='pub'?'dark':base.colorScheme);
    for (const field of fields) assert.deepEqual(theme[field],base[field],theme.id+': changed '+field);
    assert.equal(renderVessel(theme),renderVessel(base),theme.id+': lost the display outline');
    const P=readThemeReview(reviewHash(base.id)).P,seasonal={...P,theme};
    const G={cx:187.5,top:160,bot:450,halfW:62,glass:renderVessel(base)};
    assert.deepEqual(targetGeometry(G,seasonal,theme),targetGeometry(G,P,base),theme.id+': moved the scored print');
    const original=canvas(),christmas=canvas();
    drawScene(original.c,{G,w:375,h:667,L:P.markY,theme:base,P,backdrop:{},bubbles:false});
    drawScene(christmas.c,{G,w:375,h:667,L:P.markY,theme,P:seasonal,backdrop:{},bubbles:false});
    assert.deepEqual(christmas.calls,original.calls,theme.id+': foreground paint changed');
    let a=makeDrinkState(P),b=makeDrinkState(seasonal);
    for (let tick=0;tick<420;tick++){
      const rate=tick<300?P.K:0;
      a=stepDrink(P,a,rate,1/120);b=stepDrink(seasonal,b,rate,1/120);
      assert.deepEqual(b,a,theme.id+': changed flow at tick '+tick);
    }
  }
  assert.equal(renderVessel(themeById('christmas-modelo-posada')),'modelo-bottle');
  assert.equal(renderVessel(themeById('christmas-high-life-record-night')),'high-life-bottle');
  assert.equal(renderVessel(themeById('christmas-sierra-high-sierras-cabin')),'sierra-bottle');
  assert.equal(renderVessel(themeById('christmas-stella-paris-cafe')),'chalice');
  assert.equal(themeById('christmas-sam-adams-boston-rooftop').material,'plastic');
  assert.equal(themeById('christmas-coors-sleigh-lodge').material,'frosted');
});

test('the four new Christmas Guinness scenes share the original decoded print and await its pixels',async()=>{
  const previous=globalThis.Image,requests=[];let finishDecode;
  globalThis.Image=class {decode(){return new Promise(resolve=>{finishDecode=resolve;});}set src(url){requests.push(url);this.onload();}};
  try {
    const assets=await import('../site/js/brand-assets.js?christmas-shared-print');
    for (const id of CHRISTMAS_GUINNESS_IDS) assert.ok(isGuinnessTheme({id}));
    const loading=['pub',...CHRISTMAS_GUINNESS_IDS].map(id=>assets.loadBrandAssets({id}));
    let ready=false;loading[0].then(()=>{ready=true;});await Promise.resolve();
    assert.equal(ready,false);assert.equal(assets.guinnessPrintImage(),null);assert.equal(requests.length,1);
    assert.ok(requests[0].endsWith('/brands/guinness-glass-print.svg'));
    for (const id of CHRISTMAS_THEME_IDS.filter(id=>!CHRISTMAS_GUINNESS_IDS.includes(id))) assert.equal(await assets.loadBrandAssets(themeById(id)),null);
    finishDecode();const images=await Promise.all(loading);
    assert.ok(images.every(image=>image===images[0]));assert.equal(assets.guinnessPrintImage(),images[0]);assert.equal(requests.length,1);
  } finally {globalThis.Image=previous;}
});

test('new Christmas painting provenance and prompt sidecars match the registered measured tables',()=>{
  const records=['a','b','c'].flatMap(group=>JSON.parse(readFileSync(new URL('../site/assets/scenes/christmas-generation-'+group+'.json',import.meta.url))));
  assert.equal(records.length,14);assert.equal(new Set(records.map(row=>row.id)).size,14);
  for (const id of CHRISTMAS_THEME_IDS){
    const record=records.find(row=>row.id===id);
    assert.ok(record,id+': missing generation provenance');
    assert.equal(record.tool,'built-in image_gen');
    assert.equal(record.mode,'generate');
    assert.equal(record.outputPath,'site/assets/scenes/'+id+'.webp');
    assert.equal(record.tabletop,SCENE_ART[id].table,id+': source table measurement differs');
    assert.equal(record.framing,'table');assert.deepEqual(record.dimensions,[1024,1536]);
    assert.deepEqual(record.export,{format:'webp',quality:88,method:6});
    assert.ok(record.tabletop>.4 && record.tabletop<.75,'implausible table anchor');
    assert.ok(record.prompt && record.referencedImagePaths.length && record.generatedPath,id+': incomplete generation sources');
    const asset=new URL('../site/assets/scenes/'+id+'.webp',import.meta.url);
    assert.ok(existsSync(asset));
    const sidecarPath=new URL(asset.href+'.json');
    if (existsSync(sidecarPath)){
      const sidecar=JSON.parse(readFileSync(sidecarPath));
      assert.equal(sidecar.prompt,record.prompt,id+': shipping raster has a different exact prompt');
      assert.equal(sidecar.tool,record.tool);assert.equal(sidecar.mode,record.mode);
    } else {
      // WebP supports native EXIF; the prompt's bytes live in ImageDescription.
      const bytes=readFileSync(asset);
      assert.ok(bytes.includes(Buffer.from('EXIF')) && bytes.includes(Buffer.from(record.prompt)),id+': exact prompt is absent from native raster metadata');
    }
  }
});

test('new Christmas scenic art anchors all phone and postcard tables while preserving the whole upper scene',async()=>{
  const previous=globalThis.Image,requests=[];
  globalThis.Image=class {
    naturalWidth=1024;naturalHeight=1536;decode(){return Promise.resolve();}
    set src(url){this.url=url;requests.push(url);queueMicrotask(()=>this.onload());}
  };
  try {
    for (const id of CHRISTMAS_THEME_IDS){
      const theme=themeById(id),art=SCENE_ART[id];await loadSceneAssets(theme);await loadSceneAssets(theme);
      assert.equal(requests.filter(url=>url.includes('/scenes/')).length,CHRISTMAS_THEME_IDS.indexOf(id)+1,'unrelated artwork was fetched');
      for (const [w,h,bot] of [[375,667,500],[500,876,690],[630,455,405]]){
        const {c,calls}=canvas();drawBackdrop(c,w,h,{bot},theme,false);
        const painted=calls.filter(call=>call[0]==='drawImage'),first=painted[0],last=painted.at(-1);
        const placement=roomScenePlacement(w,h,{bot},{width:1024,height:1536,table:art.table,topInset:0});
        assert.ok(first[1].url.endsWith('/scenes/'+id+'.webp'));
        assert.deepEqual(first.slice(2,6),[0,0,1024,1536],'seasonal scene was cropped at the source');
        assert.equal(first[6],placement.x);assert.equal(first[7],0);
        assert.equal(first[8],1024*placement.scale);assert.equal(first[9],1536*placement.scale);
        assert.equal(last[2],0);assert.ok(last[3]>=1536*art.table,'foreground extension did not use the original wood');
        assert.equal(last[6],0);assert.equal(last[8],w);assert.equal(last[7],placement.tableY+12);assert.equal(last[7]+last[9],h);
        const washed=canvas();drawBackdrop(washed.c,w,h,{bot},theme,true);
        assert.equal(washed.calls.find(call=>call[0]==='drawImage')[7],0,'title wash moved the scenic framing');
      }
    }
  } finally {globalThis.Image=previous;}
});

test('a missing new Christmas painting recovers the original scene with its original framing and cached pixels',async()=>{
  const previous=globalThis.Image,requests=[];
  globalThis.Image=class {
    naturalWidth=1024;naturalHeight=1536;decode(){return Promise.resolve();}
    set src(url){this.url=url;requests.push(url);queueMicrotask(()=>url.includes('/scenes/christmas-')?this.onerror():this.onload());}
  };
  try {
    const drawing=await import('../site/js/draw.js?christmas-original-recovery');
    for (const id of CHRISTMAS_THEME_IDS){
      const theme=themeById(id),base=themeById(theme.baseThemeId);
      await drawing.loadSceneAssets(theme);const count=requests.length;await drawing.loadSceneAssets(theme);
      assert.equal(requests.length,count,'recovery refetched cached art');
      assert.ok(requests.includes(drawing.SCENE_ART[base.scene].url),id+': original painting was never requested');
      const original=canvas(),recovered=canvas();
      drawing.drawBackdrop(original.c,375,667,{bot:500},base,false);
      drawing.drawBackdrop(recovered.c,375,667,{bot:500},theme,false);
      assert.ok(recovered.calls.some(call=>call[0]==='drawImage'),'recovery used a generic empty background');
      assert.deepEqual(recovered.calls,original.calls,id+': fallback changed the original composition');
    }
  } finally {globalThis.Image=previous;}
});
