// The app: input, the tilt sensor, the drink, results, sharing and the record.
import {dayNumber, dayParams, startLevel, makeDrinkState, stepDrink, isDrinkSettled, tiltRate, TILT_START, TILT_STOP, DRAIN_LEVEL,
  scoreFromOffset, bandEmoji, detailText, pad, PERFECT, dayKey} from './core.js';
import {drawScene, makeBackdrop} from './draw.js';
import {buildShareText, drawShareCard} from './share.js';

const $ = id => document.getElementById(id);
const STORE = 'split.v1';
const SITE_URL = 'https://fischbeck3.github.io/split/';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const S = {num: 0, key: '', P: null, theme: null, mode: 'hold', state: 'intro', L: 0, L0: 0, practice: false, preview: false,
  result: null, holding: false, holdStart: 0, lockAt: 0, last: 0, drained: false, rollDraw: 0, card: null, drink: null};
const sensor = {available: false, theta: 0, roll: 0, sign: 1, base: 0, rollBase: 0, raw: null};
const scene = $('scene'), ctx = scene.getContext('2d');
let W = 400, H = 700, DPR = 1, backdrop = null, backdropKey = '';

// ---------- storage ----------
function load(){ try { const v = JSON.parse(localStorage.getItem(STORE)); return v && v.days ? v : {days: {}}; } catch { return {days: {}}; } }
function save(st){ try { localStorage.setItem(STORE, JSON.stringify(st)); } catch { /* private mode: play on without a record */ } }

// ---------- layout and drawing ----------
function layout(){
  const app = $('app'); W = Math.max(280, app.clientWidth); H = Math.max(400, app.clientHeight);
  DPR = Math.min(2.5, window.devicePixelRatio || 1);
  scene.width = Math.round(W * DPR); scene.height = Math.round(H * DPR); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
function glassBox(w, h, theme){
  const b = theme.box, short = h < 740, top = h * (theme.vessel === 'bottle' ? .235 : theme.vessel === 'stein' ? .29 : .26), bot = h * (short ? .625 : .665);
  return {cx: w / 2, top, bot, halfW: Math.min(w * b.w, (bot - top) * b.h), glass: theme.vessel};
}
function currentBackdrop(G){
  const key = S.theme.id + ':' + W + 'x' + H + ':' + DPR;
  if (key !== backdropKey){ backdrop = makeBackdrop(W, H, G, S.theme, DPR); backdropKey = key; }
  return backdrop;
}
function draw(now){
  const G = glassBox(W, H, S.theme), live = S.state === 'ready' || S.state === 'drinking';
  const wob = !reducedMotion && S.state === 'drinking' && S.P.wobble ? S.P.wobble * Math.sin(now / 140) : 0;
  const roll = S.mode === 'tilt' && live ? Math.max(-12, Math.min(12, sensor.roll - sensor.rollBase)) : 0;
  S.rollDraw += (roll + wob - S.rollDraw) * 0.25;
  drawScene(ctx, {G, w: W, h: H, L: S.L, theme: S.theme, P: S.P, rollDeg: S.rollDraw, now, guides: true, bubbles: !reducedMotion, backdrop: currentBackdrop(G)});
}

// ---------- the tilt sensor ----------
function onMotion(e){
  const g = e.accelerationIncludingGravity; if (!g || g.y == null) return;
  sensor.raw = {x: g.x, y: g.y, z: g.z};
  if (sensor.sign === 0) return;
  // iOS and Android report gravity with opposite signs; sign is set so upright reads as positive y.
  const X = g.x * sensor.sign, Y = g.y * sensor.sign, Z = g.z * sensor.sign;
  sensor.theta = Math.atan2(Z, Y) * 180 / Math.PI; sensor.roll = Math.atan2(-X, Y) * 180 / Math.PI; sensor.available = true;
}
// Tipping either way counts, so it works with the screen toward you or away from you.
const tiltAngle = () => Math.abs(sensor.theta - sensor.base);
function calibrate(){ sensor.base = sensor.theta; sensor.rollBase = sensor.roll; }
async function enableTilt(){
  const btn = $('startTilt'); btn.disabled = true; btn.textContent = 'Checking the tilt sensor…';
  try {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function'){
      let p = 'unknown'; try { p = await DeviceMotionEvent.requestPermission(); } catch { p = 'unknown'; }
      if (p === 'denied') throw new Error('denied');
    }
    sensor.sign = 0; sensor.raw = null; window.addEventListener('devicemotion', onMotion);
    const ok = await new Promise(res => {
      const t0 = performance.now();
      const iv = setInterval(() => {
        if (sensor.raw && Math.abs(sensor.raw.y) > 3){ clearInterval(iv); res(true); }
        else if (performance.now() - t0 > 1800){ clearInterval(iv); res(false); }
      }, 50);
    });
    if (!ok) throw new Error(sensor.raw ? 'flat' : 'none');
    sensor.sign = sensor.raw.y > 0 ? 1 : -1; onMotion({accelerationIncludingGravity: sensor.raw});
    await new Promise(r => setTimeout(r, 350));
    calibrate(); S.mode = 'tilt'; begin();
  } catch (err){
    window.removeEventListener('devicemotion', onMotion);
    btn.disabled = false; btn.textContent = 'Try tilt again';
    const why = err && err.message;
    if (why === 'flat'){ toast('Hold the phone upright, then try again'); return; }
    toast(why === 'denied' ? 'Tilt was not allowed. Using hold to drink.' : 'No tilt sensor here. Using hold to drink.');
    S.mode = 'hold'; begin();
  }
}

// ---------- the drink ----------
function begin(){
  S.state = 'ready'; S.L = S.L0; S.drained = false; S.holding = false; S.holdStart = 0;
  S.drink = makeDrinkState(S.P);
  $('intro').hidden = true; $('result').hidden = true;
  $('dayHeading').hidden = false; $('liveControls').hidden = false;
  $('hudMode').hidden = false; $('hudMode').textContent = (S.practice ? 'Practice · ' : S.preview ? 'Preview · ' : 'Today’s sip · ') + S.theme.feel;
  $('drinkControl').hidden = S.mode === 'tilt';
  $('recalibrateBtn').hidden = S.mode !== 'tilt';
  $('recalibrateBtn').disabled = false;
  $('footPill').textContent = S.mode === 'tilt' ? 'Tilt to sip. Upright to stop.' : 'Hold to sip. Release to stop.';
  if (S.mode === 'hold') $('drinkControl').focus({preventScroll: true});
}
const wantsDrink = () => S.mode === 'tilt' ? tiltAngle() > TILT_START : S.holding;
const wantsStop = () => S.mode === 'tilt' ? tiltAngle() < TILT_STOP : !S.holding;
function rate(now){
  const base = S.mode === 'tilt' ? tiltRate(S.P.K, tiltAngle()) : S.P.K * Math.min(1, (now - S.holdStart) / 600);
  return base;
}
function frame(now){
  const dt = Math.min(0.05, (now - (S.last || now)) / 1000); S.last = now;
  if (S.state === 'ready' && wantsDrink()){
    S.state = 'drinking'; if (S.mode === 'hold' && !S.holdStart) S.holdStart = now;
    $('recalibrateBtn').disabled = true;
    $('footPill').textContent = 'Drinking…';
  }
  if (S.state === 'drinking'){
    if (wantsStop()) lock(now);
    else { S.drink = stepDrink(S.P, S.drink, rate(now), dt); S.L = S.drink.level; }
    if (S.L >= DRAIN_LEVEL){ S.drained = true; lock(now); }
  }
  if (S.state === 'locked'){
    S.drink = stepDrink(S.P, S.drink, 0, dt); S.L = S.drink.level;
    if (S.L >= DRAIN_LEVEL) S.drained = true;
    if (isDrinkSettled(S.drink) && now - S.lockAt > 350) finish();
  }
  if (S.mode === 'tilt' && (S.state === 'ready' || S.state === 'drinking') && sensor.available) $('hudMode').textContent = Math.round(tiltAngle()) + '° · ' + S.theme.feel;
  draw(now); requestAnimationFrame(frame);
}
function lock(now){ S.state = 'locked'; S.lockAt = now; $('footPill').textContent = 'Settling…'; }
function finish(){
  const f = S.drained ? 2 : (S.L - S.P.markY) / S.P.markH, r = scoreFromOffset(f, S.theme.target);
  if (S.drained){ r.label = 'Drank the lot'; r.tone = 'miss'; r.score = 0; }
  const counts = !S.practice && !S.preview;
  S.result = {f, score: r.score, label: r.label, tone: r.tone, drained: S.drained, L: S.L, mode: S.mode, counts, t: new Date().toISOString()};
  if (counts){
    const st = load();
    const recorded = st.days[S.key];
    if (recorded && recorded.done && recorded.theme === S.theme.id){
      S.L = recorded.L; S.mode = recorded.mode; S.result = {...recorded, counts:true};
      toast('Your first sip is already saved.');
    } else {
      st.days[S.key] = {num: S.num, theme: S.theme.id, score: r.score, f: +f.toFixed(4), L: +S.L.toFixed(4), mode: S.mode, label: r.label, tone: r.tone, drained: S.drained, done: true};
      save(st);
    }
  }
  S.state = 'result'; $('liveControls').hidden = true; $('hudMode').hidden = true;
  renderResult(); renderStats();
}

// ---------- results and sharing ----------
function shareText(){
  return buildShareText({num:S.num, theme:S.theme, result:S.result, url:SITE_URL, preview:S.preview});
}
function renderResult(){
  const r = S.result;
  $('resScore').textContent = r.score; $('resScore').className = 'tone-' + r.tone;
  $('resLabel').textContent = r.label; $('resLabel').className = 'tone-' + r.tone;
  $('resDetail').textContent = r.drained ? 'You drank the lot.' : Math.round(Math.abs(r.f) * 100) === 0 ? 'Dead center. A lovely sip.' : Math.round(Math.abs(r.f) * 100) + '% of the mark’s height ' + (r.f < 0 ? 'high.' : 'low.');
  $('resKind').textContent = r.counts ? 'Today’s sip' : S.preview ? 'Preview · not saved' : 'Practice · not saved';
  $('officialBtn').hidden = r.counts || S.preview || !load().days[S.key]?.done;
  $('resStrip').textContent = bandEmoji(r.f);
  $('shareText').textContent = shareText(); $('copyBtn').textContent = 'Copy text';
  $('dayHeading').hidden = true;
  $('result').hidden = false;
  // Build the card now, so the share sheet opens straight from the tap.
  const c = drawCard(); $('cardImg').src = c.toDataURL('image/png'); $('cardImg').hidden = false;
  $('cardImg').alt = S.theme.label + ': ' + r.score + ' out of 100. ' + r.label + '. ' + $('resDetail').textContent + ' ' + $('resKind').textContent;
  S.card = new Promise(res => c.toBlob(blob => res({canvas: c, blob}), 'image/png'));
  $('result').scrollTop = 0;
}
function drawCard(){
  return drawShareCard($('card'), {num:S.num, theme:S.theme, P:S.P, result:S.result, url:SITE_URL, preview:S.preview});
}
async function share(){
  const btn = $('shareBtn'); btn.disabled = true;
  try {
    const {canvas, blob} = await S.card, name = 'split-no-' + S.num + '.png', text = shareText();
    let file = null; try { file = new File([blob], name, {type: 'image/png'}); } catch { file = null; }
    if (file && navigator.canShare && navigator.canShare({files: [file]})){
      try { await navigator.share({files: [file], text}); return; } catch (e){ if (e && e.name === 'AbortError') return; }
    }
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
    $('cardImg').src = canvas.toDataURL('image/png');
    toast('Card saved. Copy the text to go with it.');
  } catch { toast('Could not build the card'); }
  finally { btn.disabled = false; }
}
function copyText(){
  const text = shareText(), btn = $('copyBtn');
  const fallback = () => { const range = document.createRange(); range.selectNodeContents($('shareText')); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); btn.textContent = 'Select and copy'; };
  if (navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(() => { btn.textContent = 'Copied'; setTimeout(() => { btn.textContent = 'Copy text'; }, 1800); }).catch(fallback);
  } else fallback();
}

// ---------- the record and the clock ----------
function renderStats(){
  const st = load(), keys = Object.keys(st.days).filter(k => st.days[k].done);
  let best = null, perfect = 0;
  for (const k of keys){ const d = st.days[k]; if (best === null || d.score > best) best = d.score; if (Math.abs(d.f) <= PERFECT && !d.drained) perfect++; }
  let streak = 0; const cur = new Date(); cur.setHours(0, 0, 0, 0);
  if (!(st.days[dayKey(cur)] && st.days[dayKey(cur)].done)) cur.setDate(cur.getDate() - 1);
  while (st.days[dayKey(cur)] && st.days[dayKey(cur)].done){ streak++; cur.setDate(cur.getDate() - 1); }
  $('stDays').textContent = keys.length; $('stStreak').textContent = streak; $('stBest').textContent = best === null ? '—' : best; $('stPerfect').textContent = perfect;
}
function msToMidnight(){ const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1) - n; }
function tickClock(){
  const s = Math.max(0, Math.floor(msToMidnight() / 1000));
  $('countdown').textContent = pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s % 3600 / 60)) + ':' + pad(s % 60);
  if (!S.preview && dayKey(new Date()) !== S.key) $('newDayBtn').hidden = false;
}
let toastTimer = 0;
function toast(msg){
  let t = document.querySelector('.toast');
  if (!t){ t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); $('app').appendChild(t); }
  t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2400);
}

// ---------- input ----------
const down = e => {
  if (S.state !== 'ready' && S.state !== 'drinking') return;
  if (e.cancelable) e.preventDefault();
  if (e.pointerId != null && e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
  $('drinkControl').setAttribute('aria-pressed', 'true');
  if (S.mode === 'hold'){ S.holding = true; if (S.state === 'ready') S.holdStart = performance.now(); }
};
const up = () => { S.holding = false; $('drinkControl').setAttribute('aria-pressed', 'false'); };
for (const target of [scene, $('drinkControl')]){
  target.addEventListener('pointerdown', down); target.addEventListener('pointerup', up); target.addEventListener('pointercancel', up);
  target.addEventListener('contextmenu', e => e.preventDefault());
}
window.addEventListener('pointerup', up);
window.addEventListener('blur', up);
document.addEventListener('visibilitychange', () => { if (document.hidden) up(); });
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && !e.repeat && (S.state === 'ready' || S.state === 'drinking')){ e.preventDefault(); down(e); }
});
document.addEventListener('keyup', e => { if (e.code === 'Space') up(); });
$('drinkControl').addEventListener('keydown', e => { if (e.code === 'Enter' && !e.repeat){ e.preventDefault(); down(e); } });
$('drinkControl').addEventListener('keyup', e => { if (e.code === 'Enter') up(); });
$('recalibrateBtn').addEventListener('click', () => { if (S.state === 'ready'){ calibrate(); toast('Upright position reset. Ready to sip.'); } });
$('startTilt').addEventListener('click', enableTilt);
$('startHold').addEventListener('click', () => { S.mode = 'hold'; begin(); });
$('shareBtn').addEventListener('click', share);
$('copyBtn').addEventListener('click', copyText);
$('practiceBtn').addEventListener('click', () => {
  S.practice = true;
  if (S.mode !== 'tilt') begin();
  else if (sensor.available){ calibrate(); begin(); }
  else enableTilt();
});
$('newDayBtn').addEventListener('click', () => location.reload());
$('officialBtn').addEventListener('click', () => {
  const rec = load().days[S.key]; if (!rec || !rec.done) return;
  S.practice = false; S.mode = rec.mode; S.L = rec.L;
  S.result = {...rec, counts:true}; S.state = 'result'; renderResult();
});
window.addEventListener('hashchange', () => location.reload());
window.addEventListener('resize', layout);

// ---------- start ----------
function init(){
  const now = new Date(), m = /^#day(\d{1,4})$/.exec(location.hash || '');
  S.num = dayNumber(now);
  if (m){ S.num = parseInt(m[1], 10); S.preview = true; }
  S.P = dayParams(S.num); S.theme = S.P.theme; S.key = S.P.key;
  S.L0 = startLevel(S.theme); S.L = S.L0;
  const palette = S.theme.palette || {bg:'#17110d', fg:'#f5ecdc', muted:'#b3a48e', sheet:'#221a14', line:'#3a2d23', accent:'#e9b949', accentFg:'#17110d'};
  for (const [name, value] of Object.entries(palette)) document.documentElement.style.setProperty('--' + (name === 'accentFg' ? 'accent-fg' : name), value);
  const light = S.theme.scene === 'beach' || S.theme.scene === 'munich';
  document.documentElement.style.colorScheme = light ? 'light' : 'dark';
  for (const [name,value] of Object.entries(light ? {good:'#267347',warn:'#936210',miss:'#b64037'} : {good:'#91dda8',warn:'#d9b874',miss:'#ffaaa0'})) document.documentElement.style.setProperty('--'+name,value);
  document.querySelector('meta[name="theme-color"]').content = palette.bg;
  $('hudSub').textContent = S.theme.name + (S.theme.id === 'pub' ? ' at the pub' : S.theme.id === 'beach' ? ' on white sand' : S.theme.id === 'munich' ? ' in a liter stein' : ' · ' + S.theme.label);
  $('introNo').textContent = 'No. ' + String(S.num).padStart(3, '0');
  $('introName').textContent = S.theme.label;
  $('introGoal').textContent = $('liveGoal').textContent = 'Split ' + S.theme.target + '.';
  $('introFeel').textContent = S.theme.feel || (S.P.choppy ? 'Wobbly pour' : 'Smooth pour');
  $('vesselHint').textContent = S.theme.line;
  document.title = 'Split No. ' + S.num + ' · ' + S.theme.label;
  scene.setAttribute('aria-label', S.theme.name + '. Stop the beer line through ' + S.theme.target + '.');
  if (S.preview){
    $('introNote').textContent = 'Design preview. Your score will not be saved.';
    document.body.classList.add('preview'); $('previewNav').hidden = false;
    const active = $('previewNav').querySelector('a[href="#day' + S.num + '"]');
    if (active) active.setAttribute('aria-current', 'page');
  }

  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  if (typeof DeviceMotionEvent === 'undefined' || !coarse){
    $('startHold').className = 'big'; $('startHold').textContent = 'Take ' + (S.preview ? 'a preview' : 'today’s') + ' sip';
    $('startTilt').hidden = true;
    $('introLine').textContent = 'Hold to sip. Release to stop.';
  }

  layout(); renderStats(); tickClock(); setInterval(tickClock, 1000);
  const rec = S.preview ? null : load().days[S.key];
  if (rec && rec.done && rec.theme === S.theme.id){
    S.L = rec.L; S.state = 'result'; S.mode = rec.mode || 'hold';
    S.result = {f: rec.f, score: rec.score, label: rec.label, tone: rec.tone, drained: !!rec.drained, L: rec.L, mode: S.mode, counts: true, t: now.toISOString()};
    $('intro').hidden = true; renderResult();
  }
  requestAnimationFrame(frame);
}
const fontsReady = document.fonts && document.fonts.load
  ? Promise.all([document.fonts.load('900 40px Fraunces'), document.fonts.load('700 16px Karla')]).catch(() => {})
  : Promise.resolve();
Promise.race([fontsReady, new Promise(r => setTimeout(r, 2500))]).then(init);
