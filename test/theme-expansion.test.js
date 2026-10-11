import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PREVIEW_THEME_IDS} from '../site/js/themes.js';
import {THEMES, REVIEW_THEMES, themeById, themeForDay, makeDrinkState, stepDrink, PROFILES} from '../site/js/core.js';
import {renderVessel, renderWidthAt, CHALICE_BOWL_DEPTH} from '../site/js/render-vessels.js';
import {SCENE_ART, drawScene, drawBackdrop, loadSceneAssets} from '../site/js/draw.js';
import {drawBrandMark} from '../site/js/brand-marks.js';
import {isGuinnessTheme, loadBrandAssets} from '../site/js/brand-assets.js';
import {targetGeometry} from '../site/js/target.js';
import {getLiquidSurface} from '../site/js/liquid.js';
import {physicalGlassParams} from './fixtures/physical-glasses.js';
import {roomScenePlacement} from '../site/js/ambient.js';

function recordingCanvas(){
  const calls=[], state={globalAlpha:1};
  const c=new Proxy(state,{
    get(target,key){
      if (key in target) return target[key];
      if (key==='createLinearGradient' || key==='createRadialGradient') return (...args) => {
        calls.push([key,...args]); return {addColorStop(...stops){ calls.push(['colorStop',...stops]); }};
      };
      return (...args) => {
        for (const arg of args) if (typeof arg==='number') assert.ok(Number.isFinite(arg),key+': nonfinite geometry');
        calls.push([key,...args]);
      };
    },
    set(target,key,value){target[key]=value; calls.push(['set',key,typeof value?.addColorStop==='function'?'gradient':value]); return true;}
  });
  return {c,calls};
}

test('the fifteen travel previews stay out of released dates and automatic rotation', () => {
  assert.equal(PREVIEW_THEME_IDS.length,15);
  assert.equal(REVIEW_THEMES.filter(t=>!t.seasonal).length,21);
  assert.equal(new Set(REVIEW_THEMES.map(t=>t.id)).size,REVIEW_THEMES.length);
  assert.deepEqual(THEMES.map(t=>t.id),['pub','beach','munich','sapporo','butterbeer','peroni']);
  for (let day=1; day<=730; day++) assert.ok(!PREVIEW_THEME_IDS.includes(themeForDay(day).id),'a preview reached public day '+day);
  for (const id of PREVIEW_THEME_IDS){
    const theme=themeById(id);
    assert.ok(theme && theme.preview,id+': not a review preview');
    assert.ok(PROFILES[theme.vessel],id+': physical vessel unavailable');
    assert.ok(theme.palette && theme.location && theme.memory,id+': missing destination');
    assert.equal(SCENE_ART[theme.scene].panel,undefined,id+': cropped a concept sheet');
    assert.ok(SCENE_ART[theme.scene].url.endsWith('/scenes/'+id+'.webp'));
  }
  assert.match(themeById('guinness-chicago').label,/St. Patrick/);
  assert.match(themeById('guinness-chicago').memory,/Green river/);
  assert.deepEqual(PREVIEW_THEME_IDS.slice(-2),['coors-apres-ski','sierra-high-sierras']);
  for (const retired of ['tiger-singapore','vb-melbourne']){
    assert.equal(themeById(retired),undefined,retired+': retired preview remained selectable');
    assert.ok(!SCENE_ART[retired],retired+': retired preview stayed in the decoded scene catalog');
  }
});

test('every Guinness view preserves the original glass, scoring geometry, nitro material and pour', () => {
  const original=physicalGlassParams('pub'), G={cx:187.5,top:170,bot:417,halfW:65,glass:'tulip'};
  const before=structuredClone(original), back={};
  const fields=['vessel','box','body','head','headT','mark','letter','markFill','markStroke','target','markRange','markHRange','speed','choppy'];
  const reference=recordingCanvas();
  drawScene(reference.c,{G,w:375,h:667,L:.63,theme:original.theme,P:original,backdrop:back,bubbles:false});
  for (const id of PREVIEW_THEME_IDS.filter(id=>id.startsWith('guinness-'))){
    const theme=themeById(id), P={...original,theme}, recorded=recordingCanvas();
    assert.ok(isGuinnessTheme({id}));
    for (const field of fields) assert.deepEqual(theme[field],original.theme[field],id+': changed '+field);
    assert.deepEqual(targetGeometry(G,P,theme),targetGeometry(G,original,original.theme),id+': changed target artwork');
    drawScene(recorded.c,{G,w:375,h:667,L:.63,theme,P,backdrop:back,bubbles:false});
    assert.deepEqual(recorded.calls,reference.calls,id+': Guinness foreground paint changed');
    let a=makeDrinkState(original),b=makeDrinkState(P);
    for (let tick=0; tick<420; tick++){
      const rate=tick<300?original.K:0;
      a=stepDrink(original,a,rate,1/120); b=stepDrink(P,b,rate,1/120);
      assert.deepEqual(b,a,id+': changed flow at tick '+tick);
    }
  }
  assert.deepEqual(original,before,'rendering or preview flow changed the original');
});

test('all Guinness seats share one decoded print and unrelated beer brands do not request it', async () => {
  const previous=globalThis.Image,requests=[]; let completeDecode;
  globalThis.Image=class {
    decode(){ return new Promise(resolve=>{completeDecode=resolve;}); }
    set src(value){requests.push(value); this.onload();}
  };
  try {
    const assets=await import('../site/js/brand-assets.js?travel-shared-print');
    const ids=PREVIEW_THEME_IDS.filter(id=>id.startsWith('guinness-'));
    const loading=ids.map(id=>assets.loadBrandAssets({id}));
    let ready=false; loading[0].then(()=>{ready=true;}); await Promise.resolve();
    assert.equal(ready,false); assert.equal(assets.guinnessPrintImage(),null); assert.equal(requests.length,1);
    assert.ok(requests[0].endsWith('/brands/guinness-glass-print.svg'));
    for (const id of PREVIEW_THEME_IDS.slice(5)) assert.equal(await assets.loadBrandAssets(themeById(id)),null);
    completeDecode(); const images=await Promise.all(loading);
    for (const image of images) assert.equal(image,images[0]);
    assert.equal(assets.guinnessPrintImage(),images[0]); assert.equal(requests.length,1);
  } finally {globalThis.Image=previous;}
});

test('new branded prints use their recognizable names alongside the scored feature', () => {
  const names={'heineken-amsterdam':'Heineken','pilsner-prague':'Pilsner','stella-brussels':'STELLA','carlsberg-copenhagen':'Carlsberg',
    'estrella-barcelona':'Estrella','modelo-mexico-city':'Modelo','sam-adams-boston':'SAMUEL','high-life-milwaukee':'Miller',
    'coors-apres-ski':'Coors','sierra-high-sierras':'SIERRA'};
  for (const [id,name] of Object.entries(names)){
    const {c,calls}=recordingCanvas();
    assert.equal(drawBrandMark(c,themeById(id),100,200,50),true,id+': generic mark fallback');
    assert.ok(calls.some(call=>call[0]==='fillText' && call[1]===name),id+': missing recognizable print');
    assert.equal(calls.filter(call=>call[0]==='save').length,calls.filter(call=>call[0]==='restore').length,id+': leaked canvas state');
  }
});

test('the Stella chalice bowl holds the drink while its clear stem and foot sit on the table', () => {
  const theme=themeById('stella-brussels'), vessel=renderVessel(theme), G={cx:187.5,top:150,bot:430,halfW:60,glass:vessel};
  assert.equal(theme.vessel,'tulip','display chalice must not create a new physics profile');
  assert.equal(vessel,'chalice');
  assert.ok(renderWidthAt(vessel,.13)>.95); assert.ok(renderWidthAt(vessel,.9)<.06);
  const P={markY:.43,markH:.135,K:.14,theme}, {c,calls}=recordingCanvas();
  const surface=getLiquidSurface({vessel,level:.43,aspect:60/280,vesselAngle:24,liquidAngle:0});
  assert.ok(Number.isFinite(surface.centerLevel) && Number.isFinite(surface.slope));
  drawScene(c,{G,w:375,h:667,L:.43,theme,P,backdrop:{},bubbles:false});
  assert.ok(calls.some(call=>call[0]==='moveTo' && call[1]===G.cx && call[2]===G.top+280*CHALICE_BOWL_DEPTH),'the chalice stem is absent');
  assert.ok(calls.some(call=>call[0]==='ellipse' && call[1]===G.cx && call[2]===G.bot-280*.016 && call[3]===60*.60),'the chalice foot is absent');
  assert.equal(themeById('sam-adams-boston').vessel,'cup');
  assert.equal(themeById('sam-adams-boston').material,'plastic');
  for (const id of ['modelo-mexico-city','high-life-milwaukee']){
    const bottle=themeById(id), outline=renderVessel(bottle);
    assert.equal(bottle.vessel,'bottle'); assert.equal(bottle.garnish,'none');
    assert.ok(renderWidthAt(outline,.18)<renderWidthAt(outline,.65)*.6,id+': bottle lost its narrow neck');
  }
});

test('High Life and Sierra use translucent brown glass with distinct long and short necks', () => {
  const highLife=themeById('high-life-milwaukee'),sierra=themeById('sierra-high-sierras');
  assert.equal(renderVessel(highLife),'high-life-bottle'); assert.equal(renderVessel(sierra),'sierra-bottle');
  assert.ok(renderWidthAt(renderVessel(highLife),.30)<.4,'High Life must retain its long neck');
  assert.ok(renderWidthAt(renderVessel(sierra),.30)>.8,'Sierra must already reach its broad body below the short neck');
  for (const theme of [highLife,sierra]){
    const channels=/rgba\((\d+),(\d+),(\d+),([\d.]+)\)/.exec(theme.bottleTint).slice(1).map(Number);
    const [red,green,blue,alpha]=channels;
    assert.ok(red>green*1.8 && green>blue*2,'bottle tint must be brown/amber, not green glass');
    assert.ok(alpha>.3 && alpha<.6,'glass must remain translucent at the beer line');
    const P={theme,markY:.55,markH:.13,K:.14},G={cx:187.5,top:150,bot:430,halfW:60,glass:renderVessel(theme)};
    const before=structuredClone({P,G}),{c,calls}=recordingCanvas();
    drawScene(c,{G,w:375,h:667,L:P.markY,theme,P,backdrop:{},bubbles:false});
    const tint=calls.findIndex(call=>call[0]==='set' && call[1]==='fillStyle' && call[2]===theme.bottleTint);
    const print=calls.findIndex(call=>call[0]==='fillText' && call[1]===(theme===highLife?'Miller':'SIERRA'));
    assert.ok(tint>=0 && tint<print,'label must remain on top of the brown material');
    assert.ok(calls.some(call=>call[0]==='colorStop' && call[2]==='rgba(62,24,7,.86)'),'brown side walls are missing');
    assert.deepEqual(targetGeometry(G,P,theme),targetGeometry(G,P,{...theme,bottleTint:undefined}),'tint changed the scoring geometry');
    assert.deepEqual({P,G},before,'brown material changed the supplied drink or vessel');
  }
  for (const id of ['pub','beach','modelo-mexico-city']) assert.equal(themeById(id).bottleTint,undefined,id+': unrelated glass was recolored');
  const coors=themeById('coors-apres-ski');
  assert.equal(coors.vessel,'nonic'); assert.equal(coors.material,'frosted');
});

test('the travel scene assets load individually and cover phone and postcard frames at their table anchors', async () => {
  const previous=globalThis.Image,requests=[];
  globalThis.Image=class {
    naturalWidth=1024; naturalHeight=1536;
    decode(){return Promise.resolve();}
    set src(value){this.url=value; requests.push(value); queueMicrotask(()=>this.onload());}
  };
  try {
    for (const id of PREVIEW_THEME_IDS){
      const theme=themeById(id); await loadSceneAssets(theme);
      const sceneRequests=requests.filter(url=>url.includes('/scenes/'));
      assert.equal(sceneRequests.length,PREVIEW_THEME_IDS.indexOf(id)+1,'loading one travel scene requested unrelated background art');
      await loadSceneAssets(theme);
      assert.equal(requests.filter(url=>url.includes('/scenes/')).length,sceneRequests.length);
      for (const [w,h,bot] of [[375,667,500],[500,876,690],[630,455,405]]){
        const {c,calls}=recordingCanvas(); drawBackdrop(c,w,h,{bot},theme,false);
        const imageCall=calls.find(call=>call[0]==='drawImage'),art=SCENE_ART[theme.scene];
        if (art.framing==='table'){
          const [,image,sx,sy,sw,sh,x,y,dw,dh]=imageCall;
          const placement=roomScenePlacement(w,h,{bot},{width:1024,height:1536,table:art.table,topInset:0});
          assert.ok(image.url.endsWith('/scenes/'+id+'.webp'));
          assert.equal(sx,0,'full scenic art must not use a concept-panel source offset');
          assert.equal(sy,0); assert.equal(sw,1024); assert.equal(sh,1536);
          assert.equal(x,placement.x); assert.equal(y,0,'the mountain scene must start at the top of the frame');
          assert.equal(dw,1024*placement.scale); assert.equal(dh,1536*placement.scale);
          const foreground=calls.filter(call=>call[0]==='drawImage').at(-1);
          assert.equal(foreground[2],0); assert.ok(foreground[3]>=1536*art.table,'extension must use the actual wood below its table edge');
          assert.equal(foreground[6],0); assert.equal(foreground[8],w);
          assert.equal(foreground[7],placement.tableY+12,'foreground lost its vessel table anchor');
          assert.equal(foreground[7]+foreground[9],h,'foreground extension left uncovered canvas');
          const shaded=recordingCanvas(); drawBackdrop(shaded.c,w,h,{bot},theme,true);
          assert.equal(shaded.calls.find(call=>call[0]==='drawImage')[7],0,'title wash must not add the room inset to scenic art');
          continue;
        }
        const [,image,x,y,dw,dh]=imageCall;
        assert.ok(image.url.endsWith('/scenes/'+id+'.webp')); assert.ok(x<=0 && x+dw>=w);
        assert.ok(y<=1e-8 && y+dh>=h-1e-8,id+': uncovered frame');
        assert.ok(Math.abs(y+dh*art.table-Math.max(h*.4,bot-h*.08))<1e-8,id+': table lost its vessel anchor');
      }
    }
  } finally {globalThis.Image=previous;}
});
