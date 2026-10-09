import {CONCEPT_CHAPTERS, MORE_PLACES, conceptParams} from './concepts.js';
import {makeDrinkState, stepDrink, isDrinkSettled, DRAIN_LEVEL, scoreFromOffset, bandEmoji} from './core.js';
import {makeMotionState, stepMotion, isMotionSettled} from './motion.js';
import {drawScene} from './draw.js';
import {memoryScenePlacement} from './ambient.js';

const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion = reducedQuery.matches, frameId = 0;
const controllers = [], assetLoads = new Map(), shortlist = new Map();
const DISPLAY = 'Fraunces, Georgia, serif', BODY = 'Karla, sans-serif';

function element(tag, className, text){
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function checkIcon(){
  const wrapper = element('span','option-check'); wrapper.setAttribute('aria-hidden','true');
  wrapper.innerHTML = '<svg viewBox="0 0 16 16" fill="none"><path d="m3 8 3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  return wrapper;
}
function loadAsset(path, retry = false){
  if (retry) assetLoads.delete(path);
  if (!assetLoads.has(path)) assetLoads.set(path, new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = async () => {
      try {
        if (image.decode) await image.decode();
        if (image.naturalWidth < 12 || image.naturalHeight < 100) throw new Error('Scene image is incomplete.');
        resolve(image);
      } catch (error){ reject(error); }
    };
    image.onerror = () => reject(new Error('Scene image could not load.'));
    image.src = path;
  }));
  return assetLoads.get(path);
}

function glassBox(w, h, theme, photo = false){
  const bottle = theme.vessel === 'bottle', handled = theme.vessel === 'mug' || theme.vessel === 'stein';
  const top = h * (photo ? .16 : bottle ? .285 : .335), bot = h * (photo ? .89 : .805);
  const halfW = Math.min(w * .29, (bot - top) * (bottle ? .19 : handled ? .32 : .28));
  return {cx:w / 2 - (handled ? halfW * .22 : 0), top, bot, halfW, glass:theme.vessel};
}
function optionBackdrop(image, panel, w, h, G, theme, table, dpr = 1, wash = true){
  const canvas = document.createElement('canvas'); canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  const c = canvas.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0);
  const panelWidth = image.naturalWidth / 3, sourceWidth = panelWidth - 4;
  const placement = memoryScenePlacement(w,h,G,{width:sourceWidth,height:image.naturalHeight,table});
  c.drawImage(image,panel * panelWidth + 2,0,sourceWidth,image.naturalHeight,
    placement.x,placement.y,sourceWidth * placement.scale,image.naturalHeight * placement.scale);
  if (wash){
    const light = theme.palette.bg === '#efe8d9', gradient = c.createLinearGradient(0,0,0,h * .42);
    gradient.addColorStop(0,light ? 'rgba(239,232,217,.94)' : 'rgba(20,28,23,.82)');
    gradient.addColorStop(.75,light ? 'rgba(239,232,217,.84)' : 'rgba(20,28,23,.5)');
    gradient.addColorStop(1,light ? 'rgba(239,232,217,0)' : 'rgba(20,28,23,0)');
    c.fillStyle = gradient; c.fillRect(0,0,w,h * .42);
  }
  return canvas;
}
function thumbnail(canvas, image, panel){
  const width = 270, height = 360, panelWidth = image.naturalWidth / 3, sourceWidth = panelWidth - 4;
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext('2d'), scale = Math.max(width / sourceWidth,height / image.naturalHeight);
  c.drawImage(image,panel * panelWidth + 2,0,sourceWidth,image.naturalHeight,
    (width - sourceWidth * scale) / 2,(height - image.naturalHeight * scale) / 2,sourceWidth * scale,image.naturalHeight * scale);
}
function fit(c, value, x, y, maxWidth, size, family = DISPLAY, weight = 700){
  let fontSize = size;
  c.font = `${weight} ${fontSize}px ${family}`;
  while (c.measureText(value).width > maxWidth && fontSize > 12){ fontSize--; c.font = `${weight} ${fontSize}px ${family}`; }
  c.fillText(value,x,y);
}
function postcard(canvas, controller){
  const {option, image, P, result, chapter} = controller, theme = option.theme;
  const w = 700, h = 875, ink = '#203d2d', paper = '#f7efdc', c = canvas.getContext('2d');
  canvas.width = w; canvas.height = h;
  c.fillStyle = paper; c.fillRect(0,0,w,h);
  c.textBaseline = 'alphabetic'; c.textAlign = 'left'; c.fillStyle = ink;
  c.font = '900 58px ' + DISPLAY; c.fillText('Split.',35,72);
  c.textAlign = 'right'; c.font = '700 15px ' + BODY; c.fillText('CONCEPT · NOT SAVED',665,59);
  c.textAlign = 'left'; fit(c,theme.name + ' · ' + option.name,35,131,630,34);
  fit(c,option.memory,35,167,630,19,BODY,400);
  const photoW = 630, photoH = 455, G = glassBox(photoW,photoH,theme,true);
  const backdrop = optionBackdrop(image,option.panel,photoW,photoH,G,theme,chapter.table,1,false);
  c.save(); c.translate(35,195);
  drawScene(c,{G,w:photoW,h:photoH,L:result.L,theme,P,bubbles:false,ambient:false,titleWash:false,backdrop});
  c.restore();
  c.fillStyle = ink; c.font = '900 54px ' + DISPLAY; c.fillText(result.score + '/100',35,727);
  c.textAlign = 'right'; fit(c,result.label,665,723,385,31);
  c.textAlign = 'left'; c.font = '400 19px ' + BODY; c.fillText('One sip. Your turn.',35,773);
  c.font = '600 15px ' + BODY; c.fillText('Proposed souvenir glass · ' + theme.vessel,35,832);
  c.textAlign = 'right'; c.fillText('Split concept studio',665,832); c.textAlign = 'left';
}

class ConceptGlass {
  constructor(chapter){
    this.chapter = chapter; this.option = chapter.options[0]; this.P = conceptParams(this.option);
    this.drink = makeDrinkState(this.P); this.motion = makeMotionState(); this.phase = 'ready';
    this.last = 0; this.lastPaint = 0; this.visible = false; this.image = null; this.result = null; this.backdrop = null;
    this.pointer = null; this.keyHeld = false;
    this.build(); this.applyOption();
  }
  build(){
    this.section = element('section','chapter'); this.section.id = this.chapter.id;
    this.section.setAttribute('aria-labelledby',this.chapter.id + 'Title');
    const header = element('div','chapter-header'), heading = element('h2','',this.chapter.title);
    heading.id = this.chapter.id + 'Title'; header.append(heading,element('p','',this.chapter.brief));
    const grid = element('div','chapter-grid'); this.game = element('div','game-preview');
    this.stage = element('div','game-stage'); this.canvas = element('canvas','game-canvas');
    this.canvas.setAttribute('role','img'); this.canvas.setAttribute('aria-label',this.chapter.drink + ' concept glass. Hold the button to lower the drink to its mark.');
    const hud = element('div','preview-hud'); hud.append(element('span','preview-wordmark','Split.'),element('span','concept-label','Concept · not saved'));
    const place = element('div','preview-place'); this.placeName = element('h3'); this.placeLine = element('p'); place.append(this.placeName,this.placeLine);
    this.stage.append(this.canvas,hud,place);
    const controls = element('div','game-controls'), instruction = element('div','game-instruction');
    this.goal = element('strong'); instruction.append(this.goal,element('span','','Release to settle.'));
    this.hold = element('button','hold-button','Loading the scene…'); this.hold.type = 'button'; this.hold.disabled = true;
    this.hold.setAttribute('aria-pressed','false');
    this.status = element('p','game-status','Scene loading.'); this.status.setAttribute('role','status'); this.status.setAttribute('aria-live','polite');
    this.reset = element('button','reset-button','Reset this sip'); this.reset.type = 'button';
    controls.append(instruction,this.hold,this.status,this.reset); this.game.append(this.stage,controls);
    const choices = element('div','scene-choices'); choices.append(element('h3','','Choose the place and the glass.'));
    this.optionButtons = [];
    const options = element('div','options'); options.setAttribute('role','group'); options.setAttribute('aria-label',this.chapter.drink + ' scene options');
    for (const [index, option] of this.chapter.options.entries()){
      const button = element('button','option'); button.type = 'button'; button.dataset.option = option.id;
      button.setAttribute('aria-pressed',index === 0 ? 'true' : 'false'); button.setAttribute('aria-label',String.fromCharCode(65 + index) + ': ' + option.name + '. ' + option.glass + '.');
      const art = element('div','option-art'), image = element('canvas'); image.setAttribute('aria-hidden','true');
      art.append(image,element('span','option-letter',String.fromCharCode(65 + index)),checkIcon());
      button.append(art,element('span','option-name',option.name));
      button.addEventListener('click',() => this.choose(index)); options.append(button); this.optionButtons.push({button,canvas:image});
    }
    const story = element('div','selected-story'); this.memory = element('p','selected-memory');
    this.glass = element('p','selected-glass'); this.feel = element('p','selected-feel');
    this.keep = element('button','keep-button','Keep this option'); this.keep.type = 'button'; this.keep.setAttribute('aria-pressed','false');
    this.keepNote = element('p','keep-note'); this.keepNote.setAttribute('aria-live','polite');
    story.append(this.memory,this.glass,this.feel,this.keep,this.keepNote);
    this.empty = element('p','preview-empty'); const lead = element('strong','','Take a sip to see its postcard.');
    this.empty.append(lead,document.createTextNode(' The stopping line and text example will use this exact scene and glass.'));
    this.resultBlock = element('div','result-preview'); this.resultBlock.hidden = true;
    const resultHeading = element('div','result-heading'); resultHeading.append(element('h3','','The postcard.'),element('span','','Your actual concept sip'));
    const pair = element('div','result-pair'); this.card = element('canvas','postcard'); this.card.setAttribute('role','img');
    this.card.setAttribute('aria-label','Concept postcard with this scene and your actual sip result.');
    this.text = element('pre','text-example'); pair.append(this.card,this.text);
    this.resultBlock.append(resultHeading,pair,element('p','draft-note','Your result card preview. These concepts are not scheduled yet.'));
    choices.append(options,story,this.empty,this.resultBlock); grid.append(this.game,choices); this.section.append(header,grid);
    document.getElementById('chapters').append(this.section);
    this.hold.addEventListener('pointerdown',event => {
      if (event.button !== 0 || this.phase !== 'ready' || document.hidden || !this.image) return;
      event.preventDefault(); this.pointer = event.pointerId; this.hold.setPointerCapture(event.pointerId); this.begin();
    });
    this.hold.addEventListener('pointerup',event => { if (event.pointerId === this.pointer){ this.pointer = null; this.release(); } });
    this.hold.addEventListener('pointercancel',() => this.interrupt('Sip reset. Hold to try again.'));
    this.hold.addEventListener('lostpointercapture',() => { if (this.pointer !== null){ this.pointer = null; this.release(); } });
    this.hold.addEventListener('keydown',event => {
      if (![' ','Enter'].includes(event.key)) return;
      event.preventDefault(); if (event.repeat || this.keyHeld) return;
      if (this.phase === 'ready' && this.image && !document.hidden){ this.keyHeld = true; this.begin(); }
    });
    this.hold.addEventListener('keyup',event => {
      if (![' ','Enter'].includes(event.key)) return;
      event.preventDefault(); if (this.keyHeld){ this.keyHeld = false; this.release(); }
    });
    this.hold.addEventListener('blur',() => { if (this.keyHeld) this.interrupt('Sip reset. Hold to try again.'); });
    this.hold.addEventListener('contextmenu',event => event.preventDefault());
    this.reset.addEventListener('click',() => this.resetSip());
    this.keep.addEventListener('click',() => {
      if (shortlist.get(this.chapter.id)?.id === this.option.id) shortlist.delete(this.chapter.id);
      else shortlist.set(this.chapter.id,this.option);
      renderShortlist();
    });
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(this.stage);
  }
  applyOption(){
    const {option} = this;
    for (const [key,value] of Object.entries(option.theme.palette)){
      const name = {bg:'bg',fg:'fg',muted:'muted',sheet:'sheet',line:'line',accent:'accent',accentFg:'accent-fg'}[key];
      if (name) this.game.style.setProperty('--scene-' + name,value);
    }
    this.placeName.textContent = option.name; this.placeLine.textContent = this.chapter.drink + ' · ' + (this.chapter.id === 'japan' ? 'Japan' : this.chapter.id === 'rome' ? 'Rome' : 'Hogsmeade');
    this.memory.textContent = option.memory; this.glass.textContent = option.glass; this.feel.textContent = option.feel;
    this.goal.textContent = 'Split ' + option.theme.target + '.';
    for (const [index,{button}] of this.optionButtons.entries()) button.setAttribute('aria-pressed',this.chapter.options[index].id === option.id ? 'true' : 'false');
    this.updateKeep(); this.backdrop = null; this.resize();
  }
  updateKeep(){
    const selected = shortlist.get(this.chapter.id), kept = selected?.id === this.option.id;
    this.keep.setAttribute('aria-pressed',kept ? 'true' : 'false'); this.keep.textContent = kept ? 'Kept in your shortlist' : 'Keep this option';
    this.keepNote.textContent = kept ? 'This scene and souvenir glass are on your shortlist.' : selected ? 'Your shortlist currently keeps ' + selected.name + '.' : 'Keep one pairing for this drink. Change it any time.';
  }
  choose(index){
    this.pointer = null; this.keyHeld = false; this.option = this.chapter.options[index]; this.P = conceptParams(this.option);
    this.resetSip(); this.applyOption();
  }
  async load(retry = false){
    this.hold.disabled = true; this.hold.textContent = 'Loading the scene…'; this.status.textContent = 'Scene loading.';
    if (this.error) this.error.remove(); this.error = null;
    try {
      this.image = await loadAsset(this.chapter.asset,retry);
      for (const [index,{canvas}] of this.optionButtons.entries()) thumbnail(canvas,this.image,this.chapter.options[index].panel);
      this.backdrop = null; this.resize(); this.resetSip(); startLoop();
    } catch {
      this.image = null; this.status.textContent = 'Scene unavailable.'; this.hold.textContent = 'Scene unavailable';
      this.error = element('div','asset-error'); this.error.setAttribute('role','alert');
      this.error.append(element('p','','This scene image could not load. Check your connection and try again.'));
      const retryButton = element('button','','Try loading the scene again'); retryButton.type = 'button'; retryButton.addEventListener('click',() => this.load(true));
      this.error.append(retryButton); this.stage.append(this.error);
    }
  }
  resize(){
    const bounds = this.stage.getBoundingClientRect(); if (!bounds.width || !bounds.height) return;
    this.w = bounds.width; this.h = bounds.height; this.dpr = Math.min(2,window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.w * this.dpr); this.canvas.height = Math.round(this.h * this.dpr);
    this.ctx = this.canvas.getContext('2d'); this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
    this.G = glassBox(this.w,this.h,this.option.theme); this.backdrop = null; this.paint(performance.now());
  }
  paint(now){
    if (!this.image || !this.ctx || !this.G) return;
    if (!this.backdrop) this.backdrop = optionBackdrop(this.image,this.option.panel,this.w,this.h,this.G,this.option.theme,this.chapter.table,this.dpr);
    drawScene(this.ctx,{G:this.G,w:this.w,h:this.h,L:this.drink.level,theme:this.option.theme,P:this.P,
      motion:this.motion,drinking:this.phase === 'drinking',drinkElapsed:this.drink.elapsed,now,
      bubbles:!reducedMotion && this.phase !== 'result',ambient:false,guides:true,backdrop:this.backdrop});
    this.lastPaint = now;
  }
  begin(){
    if (!this.image || document.hidden || this.phase !== 'ready') return;
    this.phase = 'drinking'; this.last = performance.now();
    this.hold.setAttribute('aria-pressed','true'); this.hold.textContent = 'Release to stop'; this.status.textContent = 'Find the center of ' + this.option.theme.target + '.'; startLoop();
  }
  release(){
    if (this.phase !== 'drinking') return;
    this.advance(performance.now()); this.phase = 'settling'; this.last = performance.now();
    this.hold.setAttribute('aria-pressed','false'); this.hold.disabled = true; this.hold.textContent = 'Settling…';
    this.status.textContent = this.option.theme.vessel === 'stein' ? 'A little follow-through. Then your line.' : 'Putting the glass down.'; startLoop();
  }
  advance(now){
    const dt = this.last ? Math.max(0,Math.min(.05,(now - this.last) / 1000)) : 0; this.last = now;
    if (this.phase !== 'drinking' && this.phase !== 'settling') return;
    const drinking = this.phase === 'drinking', elapsed = this.drink.elapsed;
    this.drink = stepDrink(this.P,this.drink,drinking ? this.P.K : 0,dt);
    this.motion = stepMotion(this.P,this.motion,{drinking,input:drinking ? 1 : 0,elapsed,dt,reducedMotion});
    if (drinking && this.drink.level >= DRAIN_LEVEL){
      this.pointer = null; this.keyHeld = false; this.phase = 'settling'; this.hold.setAttribute('aria-pressed','false');
      this.hold.disabled = true; this.hold.textContent = 'Settling…'; this.status.textContent = 'The glass is empty.';
    }
    if (this.phase === 'settling' && isDrinkSettled(this.drink) && isMotionSettled(this.motion)) this.finish();
  }
  finish(){
    const drained = this.drink.level >= DRAIN_LEVEL, f = drained ? 2 : (this.drink.level - this.P.markY) / this.P.markH;
    const verdict = scoreFromOffset(f,this.option.theme.target);
    if (drained){ verdict.score = 0; verdict.label = 'Drank the lot'; verdict.tone = 'miss'; }
    this.result = {...verdict,f,L:this.drink.level,drained}; this.phase = 'result';
    this.hold.disabled = true; this.hold.textContent = this.result.score + '/100 · ' + this.result.label;
    this.status.textContent = 'Concept sip complete. Nothing saved.';
    this.empty.hidden = true; this.resultBlock.hidden = false; postcard(this.card,this);
    this.text.textContent = ['Split · ' + this.chapter.drink + ' · ' + this.option.name + ' · Concept',
      this.result.score + '/100 · ' + this.result.label,bandEmoji(f),'One sip. Your turn.','Concept preview · not scheduled'].join('\n');
    this.paint(performance.now());
  }
  resetSip(message = 'Hold the button, or hold Space or Enter, then release.'){
    this.pointer = null; this.keyHeld = false; this.phase = 'ready'; this.drink = makeDrinkState(this.P); this.motion = makeMotionState();
    this.result = null; this.last = 0; this.hold.setAttribute('aria-pressed','false'); this.hold.disabled = !this.image;
    this.hold.textContent = this.image ? 'Hold to sip' : 'Loading the scene…'; this.status.textContent = this.image ? message : 'Scene loading.';
    this.empty.hidden = false; this.resultBlock.hidden = true; this.paint(performance.now()); startLoop();
  }
  interrupt(message){ if (this.phase === 'drinking' || this.phase === 'settling') this.resetSip(message); }
}

function renderShortlist(){
  document.getElementById('shortlistCount').textContent = String(shortlist.size);
  document.getElementById('clearShortlist').hidden = !shortlist.size;
  const items = document.getElementById('shortlistItems'); items.replaceChildren();
  if (!shortlist.size) items.append(element('p','empty-list','No choices yet. Try a glass, then keep the scene that feels right.'));
  for (const chapter of CONCEPT_CHAPTERS){
    const option = shortlist.get(chapter.id); if (!option) continue;
    const row = element('div','shortlist-entry'); row.append(element('strong','',chapter.drink + ' · ' + option.name),element('span','',option.glass.replace('Proposed souvenir glass · ','')));
    items.append(row);
  }
  for (const controller of controllers) controller.updateKeep();
}
function frame(now){
  frameId = 0; if (document.hidden) return;
  let needsFrame = false;
  for (const controller of controllers){
    if (!controller.visible || !controller.image) continue;
    const moving = controller.phase === 'drinking' || controller.phase === 'settling';
    if (moving) controller.advance(now);
    if (moving || (controller.phase === 'ready' && !reducedMotion && now - controller.lastPaint >= 33)) controller.paint(now);
    if (controller.phase === 'drinking' || controller.phase === 'settling' || (controller.phase === 'ready' && !reducedMotion)) needsFrame = true;
  }
  if (needsFrame) frameId = requestAnimationFrame(frame);
}
function startLoop(){ if (!document.hidden && !frameId) frameId = requestAnimationFrame(frame); }

for (const chapter of CONCEPT_CHAPTERS) controllers.push(new ConceptGlass(chapter));
const visibility = new IntersectionObserver(entries => {
  for (const entry of entries){
    const controller = controllers.find(item => item.game === entry.target); if (!controller) continue;
    controller.visible = entry.isIntersecting; controller.last = 0;
    if (!controller.visible) controller.interrupt('Sip reset while the glass was offscreen. Try again.');
    else controller.paint(performance.now());
  }
  startLoop();
},{rootMargin:'30px',threshold:0});
for (const controller of controllers){ visibility.observe(controller.game); controller.load(); }
document.addEventListener('visibilitychange',() => {
  if (document.hidden){
    if (frameId) cancelAnimationFrame(frameId); frameId = 0;
    for (const controller of controllers){ controller.interrupt('Sip reset while the page was away. Try again.'); controller.last = 0; }
  } else { for (const controller of controllers) controller.last = 0; startLoop(); }
});
window.addEventListener('blur',() => { for (const controller of controllers) controller.interrupt('Sip reset. Hold to try again.'); });
reducedQuery.addEventListener('change',event => {
  reducedMotion = event.matches;
  for (const controller of controllers){ if (reducedMotion) controller.motion = makeMotionState(); controller.paint(performance.now()); }
  startLoop();
});
document.fonts.ready.then(() => { for (const controller of controllers){ controller.paint(performance.now()); if (controller.result) postcard(controller.card,controller); } });
document.getElementById('clearShortlist').addEventListener('click',() => { shortlist.clear(); renderShortlist(); });
const more = document.getElementById('moreList');
for (const idea of MORE_PLACES){
  const row = element('li'), place = element('span','more-place',idea.place), drink = element('span','more-drink',idea.drink);
  drink.append(element('span','more-glass',idea.glass)); row.append(place,drink,element('span','more-memory',idea.memory)); more.append(row);
}
