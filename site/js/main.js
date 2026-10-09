// The app: input, the tilt sensor, the drink, results, sharing and the record.
import {dayNumber, dayParams, startLevel, flowFactor, tiltRate, TILT_START, TILT_STOP, DRAIN_LEVEL,
  scoreFromOffset, bandEmoji, detailText, widthAt, pad, PERFECT, dayKey} from './core.js';
import {drawScene, makeBackdrop} from './draw.js';

const $ = id => document.getElementById(id);
const STORE = 'split.v1';
const SITE_URL = location.origin + location.pathname;

const S = {num: 0, key: '', P: null, theme: null, mode: 'hold', state: 'intro', L: 0, L0: 0, practice: false, preview: false,
  result: null, holding: false, holdStart: 0, lockAt: 0, last: 0, drained: false, rollDraw: 0, card: null};
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
  const b = theme.box, top = h * b.top, bot = h * b.bot;
  return {cx: w / 2, top, bot, halfW: Math.min(w * b.w, (bot - top) * b.h), glass: theme.vessel};
}
function currentBackdrop(G){
  const key = S.theme.id + ':' + W + 'x' + H + ':' + DPR;
  if (key !== backdropKey){ backdrop = makeBackdrop(W, H, G, S.theme, DPR); backdropKey = key; }
  return backdrop;
}
function draw(now){
  const G = glassBox(W, H, S.theme), live = S.state === 'ready' || S.state === 'drinking';
  const wob = S.state === 'drinking' && S.P.wobble ? S.P.wobble * Math.sin(now / 140) : 0;
  const roll = S.mode === 'tilt' && live ? Math.max(-12, Math.min(12, sensor.roll - sensor.rollBase)) : 0;
  S.rollDraw += (roll + wob - S.rollDraw) * 0.25;
  drawScene(ctx, {G, w: W, h: H, L: S.L, theme: S.theme, P: S.P, rollDeg: S.rollDraw, now, guides: live || S.state === 'locked', backdrop: currentBackdrop(G)});
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
    btn.disabled = false; btn.textContent = 'Start · tilt to drink';
    const why = err && err.message;
    if (why === 'flat'){ toast('Hold the phone upright, then try again'); return; }
    toast(why === 'denied' ? 'Tilt was not allowed. Using hold to drink.' : 'No tilt sensor here. Using hold to drink.');
    S.mode = 'hold'; begin();
  }
}

// ---------- the drink ----------
function begin(){
  S.state = 'ready'; S.L = S.L0; S.drained = false; S.holding = false; S.holdStart = 0;
  $('intro').hidden = true; $('result').hidden = true;
  $('hudMode').hidden = false; $('hudMode').textContent = S.mode === 'tilt' ? '🤳 Tilt' : '👆 Hold';
  $('footPill').hidden = false;
  $('footPill').textContent = S.mode === 'tilt' ? 'Tilt back to drink. Come upright to stop.' : 'Press and hold to drink. Let go to stop.';
}
const wantsDrink = () => S.mode === 'tilt' ? tiltAngle() > TILT_START : S.holding;
const wantsStop = () => S.mode === 'tilt' ? tiltAngle() < TILT_STOP : !S.holding;
function rate(now){
  const base = S.mode === 'tilt' ? tiltRate(S.P.K, tiltAngle()) : S.P.K * Math.min(1, (now - S.holdStart) / 600);
  return base * flowFactor(S.theme, S.P.markY, S.L);
}
function frame(now){
  const dt = Math.min(0.05, (now - (S.last || now)) / 1000); S.last = now;
  if (S.state === 'ready' && wantsDrink()){
    S.state = 'drinking'; if (S.mode === 'hold' && !S.holdStart) S.holdStart = now;
    $('footPill').textContent = 'Drinking…';
  }
  if (S.state === 'drinking'){
    S.L = Math.min(DRAIN_LEVEL, S.L + rate(now) * dt);
    if (S.L >= DRAIN_LEVEL){ S.drained = true; lock(now); } else if (wantsStop()) lock(now);
  }
  if (S.state === 'locked' && now - S.lockAt > 450) finish();
  if (S.mode === 'tilt' && (S.state === 'ready' || S.state === 'drinking') && sensor.available) $('hudMode').textContent = '🤳 ' + Math.round(tiltAngle()) + '°';
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
    st.days[S.key] = {num: S.num, theme: S.theme.id, score: r.score, f: +f.toFixed(4), L: +S.L.toFixed(4), mode: S.mode, label: r.label, tone: r.tone, drained: S.drained, done: true};
    save(st);
  }
  S.state = 'result'; $('footPill').hidden = true; $('hudMode').hidden = true;
  renderResult(); renderStats();
}

// ---------- results and sharing ----------
function shareText(){
  const r = S.result, tag = r.counts ? '' : S.preview ? ' (preview)' : ' (practice)';
  return 'Split No. ' + S.num + ' · ' + S.theme.label + ' · ' + r.score + (r.mode === 'tilt' ? ' 🤳' : '') + tag + '\n' + bandEmoji(r.f) + ' ' + r.label + '\n' + SITE_URL;
}
function renderResult(){
  const r = S.result;
  $('resScore').textContent = r.score; $('resScore').className = 'n tone-' + r.tone;
  $('resLabel').textContent = r.label; $('resLabel').className = 'tone-' + r.tone;
  $('resDetail').textContent = detailText(r.f, r.drained) + (r.counts ? ' Today’s sip is in the book.' : S.preview ? ' Preview of a planned day, not saved.' : ' Practice sip, not saved.');
  $('resStrip').textContent = bandEmoji(r.f);
  $('shareText').textContent = shareText(); $('copyBtn').textContent = 'Copy text';
  $('cardImg').classList.remove('show');
  $('result').hidden = false;
  // Build the card now, so the share sheet opens straight from the tap.
  const c = drawCard(); S.card = new Promise(res => c.toBlob(blob => res({canvas: c, blob}), 'image/png'));
}
function drawCard(){
  const c = $('card'), g = c.getContext('2d'), CW = 1080, CH = 1350, PH = 980, r = S.result, theme = S.theme;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH);
  const G = glassBox(CW, PH, theme);
  drawScene(g, {G, w: CW, h: PH, L: r.L, theme, P: S.P, bubbles: false});
  g.fillStyle = '#17110d'; g.fillRect(0, PH, CW, CH - PH);
  const col = r.tone === 'good' ? '#5ec97e' : r.tone === 'warn' ? '#e8b64c' : '#e4594f';
  const my = G.top + S.P.markY * (G.bot - G.top), ww = widthAt(G.glass, S.P.markY) * G.halfW;
  g.setLineDash([16, 14]); g.strokeStyle = 'rgba(245,236,220,0.95)'; g.lineWidth = 4;
  g.beginPath(); g.moveTo(G.cx - ww - 120, my); g.lineTo(G.cx + ww + 120, my); g.stroke(); g.setLineDash([]);
  g.textBaseline = 'alphabetic'; g.textAlign = 'left'; g.fillStyle = col; g.font = '900 230px Fraunces, "Playfair Display", Georgia, serif'; g.fillText(String(r.score), 60, 1190);
  g.textAlign = 'right'; g.fillStyle = '#f5ecdc'; g.font = '900 72px Fraunces, "Playfair Display", Georgia, serif'; g.fillText(r.label, CW - 60, 1110);
  g.fillStyle = '#b3a48e'; g.font = '600 40px Karla, "Helvetica Neue", Arial, sans-serif'; g.fillText(detailText(r.f, r.drained), CW - 60, 1165);
  g.font = '56px Karla, "Helvetica Neue", Arial, sans-serif'; g.fillText(bandEmoji(r.f), CW - 60, 1240);
  g.textAlign = 'left'; g.fillStyle = '#e9b949'; g.font = '700 36px Karla, "Helvetica Neue", Arial, sans-serif';
  const when = new Date(r.t).toLocaleDateString(undefined, {day: 'numeric', month: 'short'}).toUpperCase();
  g.fillText('SPLIT  ·  NO. ' + S.num + '  ·  ' + theme.label.toUpperCase() + '  ·  ' + when + (r.mode === 'tilt' ? '  ·  TILT' : '  ·  HOLD') + (r.counts ? '' : S.preview ? '  ·  PREVIEW' : '  ·  PRACTICE'), 60, 1290);
  return c;
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
    $('cardImg').src = canvas.toDataURL('image/png'); $('cardImg').classList.add('show');
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
  if (S.mode === 'hold'){ S.holding = true; if (S.state === 'ready') S.holdStart = performance.now(); }
};
const up = () => { S.holding = false; };
scene.addEventListener('pointerdown', down); scene.addEventListener('pointerup', up); scene.addEventListener('pointercancel', up); scene.addEventListener('pointerleave', up);
scene.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => { if (e.code === 'Space' && !e.repeat){ e.preventDefault(); down(e); } });
document.addEventListener('keyup', e => { if (e.code === 'Space') up(); });
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
window.addEventListener('hashchange', () => location.reload());
window.addEventListener('resize', layout);

// ---------- start ----------
function init(){
  const now = new Date(), m = /^#day(\d{1,4})$/.exec(location.hash || '');
  S.num = dayNumber(now);
  if (m){ S.num = parseInt(m[1], 10); S.preview = true; }
  S.P = dayParams(S.num); S.theme = S.P.theme; S.key = S.P.key;
  S.L0 = startLevel(S.theme); S.L = S.L0;
  $('hudSub').textContent = 'No. ' + S.num + ' · ' + S.theme.label + (S.P.choppy ? ' · choppy' : '') + (S.preview ? ' · preview' : '');
  $('introNo').textContent = 'No. ' + S.num + ' · ' + (S.preview ? 'preview of a planned day' : now.toLocaleDateString(undefined, {weekday: 'short', day: 'numeric', month: 'short'}));
  $('introName').textContent = S.theme.label;
  $('introLine').textContent = S.theme.line + (S.P.choppy ? ' Choppy today: the line wobbles.' : '');
  if (S.preview) $('introNote').textContent = 'Preview of a planned day. Scores here are not saved.';

  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  if (typeof DeviceMotionEvent === 'undefined'){
    $('startTilt').hidden = true; $('startHold').className = 'big'; $('startHold').textContent = 'Start · hold to drink';
  } else if (!coarse){
    // A computer has no tilt, so hold leads and tilt follows.
    $('startHold').className = 'big'; $('startHold').textContent = 'Start · hold to drink';
    $('startTilt').className = 'ghost'; $('startHold').after($('startTilt'));
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
