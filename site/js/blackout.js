import {THEMES, makeDrinkState, isDrinkSettled, DRAIN_LEVEL, scoreFromOffset} from './core.js';
import {drawScene, makeBackdrop, loadSceneAssets} from './draw.js';
import {makeMotionState, stepMotion, isMotionSettled} from './motion.js';
import {renderVessel} from './render-vessels.js';
import {targetHintOpacity} from './target.js';
import {readThemeReview} from './theme-review.js';
import {EXPERIMENT_STAGES, experimentParams, experimentAverage, stepExperimentDrink, blackoutView} from './blackout-model.js';
import {makeBlackoutRenderer} from './blackout-view.js';

const $ = id => document.getElementById(id);
const app = $('app'), scene = $('scene'), ctx = scene.getContext('2d');
const blackoutRenderer = makeBlackoutRenderer();
const stageButtons = [...document.querySelectorAll('[data-stage]')];
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
const query = new URLSearchParams(location.search);
const requestedStage = EXPERIMENT_STAGES.findIndex(stage => stage.id === query.get('stage'));
const S = {stage:requestedStage < 0 ? 3 : requestedStage, phase:'loading', base:null, P:null,
  drink:null, motion:makeMotionState(), sway:0, last:0, drawnAt:0, readyAt:0, lockAt:0,
  held:false, input:null, pointer:null, sequence:false, scores:[], reduced:motionQuery.matches,
  w:400, h:800, dpr:1, G:null, backdrop:null, loadId:0};

function phase(value){ S.phase = value; app.dataset.phase = value; }
function busy(){ return ['loading','drinking','locked'].includes(S.phase); }
function refreshSipInstruction(){
  if (S.phase === 'ready'){
    $('status').textContent = S.stage === 3
      ? S.reduced ? 'Sudden surges. The view goes dark while you sip.' : 'Double vision. Sudden surges. Catch the mark between blackouts.'
      : S.stage === 0 ? 'A steady pour. Hold to sip, then release before the mark.'
      : S.stage === 1 ? 'A little sway. Watch the line, then release.'
      : 'Less steady now. Find the mark and trust your timing.';
  } else if (S.phase === 'drinking'){
    $('status').textContent = S.P.blackout
      ? S.reduced ? 'Go by feel. Release to stop.' : 'Catch a glimpse. Release by feel.'
      : 'Release early. Let the sip settle.';
  }
}
function updateControls(){
  const active = busy();
  for (const [index, button] of stageButtons.entries()){
    button.disabled = active;
    button.setAttribute('aria-pressed', String(index === S.stage));
  }
  $('glass').disabled = active;
  $('allStages').disabled = active;
  $('allStages').hidden = S.sequence;
  const outcome = S.phase === 'result';
  $('drinkControl').hidden = outcome;
  $('drinkControl').disabled = S.phase !== 'ready' && S.phase !== 'drinking';
  $('drinkControl').setAttribute('aria-pressed', String(S.held));
  $('drinkControl').textContent = S.phase === 'drinking' ? 'Release to stop' : S.phase === 'locked' ? 'Settling…' : S.phase === 'loading' ? 'Loading…' : 'Hold to drink';
  $('nextStage').hidden = !outcome || !S.sequence || S.stage === 3;
  if (!$('nextStage').hidden) $('nextStage').textContent = 'Next sip · ' + EXPERIMENT_STAGES[S.stage + 1].label;
  $('retry').hidden = !outcome || (S.sequence && S.stage < 3);
  $('retry').textContent = S.sequence ? 'Restart all four' : 'Try ' + EXPERIMENT_STAGES[S.stage].label + ' again';
  $('scores').hidden = !S.sequence;
  $('scores').replaceChildren(...EXPERIMENT_STAGES.map((stage, index) => {
    const li = document.createElement('li');
    li.textContent = S.scores[index] === undefined ? '—' : S.scores[index] + '/100';
    li.setAttribute('aria-label', stage.label + ': ' + (S.scores[index] === undefined ? 'not played' : S.scores[index] + ' out of 100'));
    return li;
  }));
  $('motionNote').hidden = !S.reduced;
}
function layout(){
  S.w = app.clientWidth; S.h = app.clientHeight; S.dpr = Math.min(2.5, devicePixelRatio || 1);
  scene.width = Math.round(S.w * S.dpr); scene.height = Math.round(S.h * S.dpr);
  ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  blackoutRenderer.resize(S.w, S.h, S.dpr);
  if (!S.P) return;
  const bounds = app.getBoundingClientRect();
  const topLimit = $('heading').getBoundingClientRect().bottom - bounds.top + 24;
  const bottom = $('controls').getBoundingClientRect().top - bounds.top - 20;
  const theme = S.P.theme, stein = theme.vessel === 'stein';
  const height = Math.max(60, Math.min(bottom - topLimit, S.h * .38));
  const halfW = Math.min(S.w * (stein ? .27 : theme.box.w), height * theme.box.h);
  S.G = {cx:S.w / 2 - (stein ? halfW * .24 : 0), top:bottom - height, bot:bottom, halfW, glass:renderVessel(theme)};
  S.backdrop = makeBackdrop(S.w, S.h, S.G, theme, S.dpr);
}
function draw(now){
  if (!S.G || !S.drink) return;
  const view = S.P.blackout ? blackoutView({phase:S.phase, elapsed:S.drink.elapsed,
    idleTime:(now - S.readyAt) / 1000, reducedMotion:S.reduced}) : null;
  const hidden = view?.exposure === 0;
  scene.setAttribute('aria-label', hidden ? 'View blacked out. Release by feel.' : S.P.theme.name + '. Split ' + S.P.theme.target + '.');
  const blur = view ? view.blur * Math.min(1, (S.G.bot - S.G.top) / 250)
    : !S.reduced && ['ready','drinking'].includes(S.phase) ? S.P.sipBlur : 0;
  scene.style.filter = blur ? 'blur(' + blur + 'px)' : '';
  const paintScene = target => drawScene(target, {G:S.G, w:S.w, h:S.h, L:S.drink.level, theme:S.P.theme, P:S.P,
    motion:{...S.motion, angle:S.motion.angle + S.sway}, drinking:S.phase === 'drinking',
    drinkElapsed:S.drink.elapsed, now, backdrop:S.backdrop, bubbles:!S.reduced, ambient:!S.reduced,
    targetHint:S.phase === 'ready' ? targetHintOpacity(now - S.readyAt, S.reduced) : 0});
  if (view && S.phase !== 'result') blackoutRenderer.paint(ctx, {w:S.w, h:S.h, view, draw:paintScene});
  else paintScene(ctx);
}
function ready(index = S.stage){
  S.stage = index; S.P = experimentParams(S.base, index);
  S.drink = makeDrinkState(S.P); S.motion = makeMotionState(); S.sway = 0;
  S.held = false; S.input = null; S.pointer = null; S.last = 0; S.readyAt = performance.now();
  phase('ready');
  $('goal').textContent = 'Split ' + S.P.theme.target + '.';
  $('goal').className = 'live-goal';
  refreshSipInstruction();
  const url = new URL(location.href);
  url.searchParams.set('glass', S.P.theme.id); url.searchParams.set('stage', EXPERIMENT_STAGES[index].id);
  history.replaceState(null, '', url);
  updateControls(); layout(); draw(S.readyAt);
}
async function chooseGlass(id){
  const loadId = ++S.loadId;
  phase('loading'); updateControls();
  $('status').textContent = 'Loading your glass…';
  const theme = THEMES.find(theme => theme.id === id) || THEMES[0];
  const review = readThemeReview('#admin/' + theme.id);
  try {
    await Promise.all([loadSceneAssets(theme), document.fonts.ready]);
    if (loadId !== S.loadId) return;
    S.base = review.P; S.sequence = false; S.scores = [];
    $('glass').value = theme.id;
    for (const [key, value] of Object.entries(theme.palette)) document.documentElement.style.setProperty('--' + (key === 'accentFg' ? 'accent-fg' : key), value);
    const light = theme.colorScheme === 'light' || ['beach','munich'].includes(theme.scene);
    document.documentElement.style.colorScheme = light ? 'light' : 'dark';
    for (const [key, value] of Object.entries(light ? {good:'#267347', warn:'#936210', miss:'#b64037'} : {good:'#91dda8', warn:'#d9b874', miss:'#ffaaa0'})) document.documentElement.style.setProperty('--' + key, value);
    document.querySelector('meta[name="theme-color"]').content = theme.palette.bg;
    $('place').textContent = theme.name + ' · ' + theme.label;
    ready();
  } catch {
    phase('error');
    $('status').textContent = 'This glass could not load. Choose another glass or reload to try again.';
    updateControls();
  }
}
function advance(now){
  const dt = Math.max(0, Math.min(.25, (now - (S.last || now)) / 1000));
  S.last = now;
  if (S.phase === 'drinking' || S.phase === 'locked'){
    S.drink = stepExperimentDrink(S.P, S.drink, S.phase === 'drinking' ? S.P.K : 0, dt);
  }
  return dt;
}
function lock(now){
  if (S.phase !== 'drinking') return;
  phase('locked'); S.lockAt = now; S.held = false; S.input = null; S.pointer = null;
  $('status').textContent = S.P.blackout ? 'Let it settle. Your view is coming back.' : 'Returning upright. Let the sip settle…';
  updateControls(); draw(now);
}
function down(event){
  if (S.phase !== 'ready') return;
  if (event.pointerId !== undefined && (event.button !== 0 || event.isPrimary === false)) return;
  if (event.cancelable) event.preventDefault();
  if (event.pointerId !== undefined){
    S.input = 'pointer'; S.pointer = event.pointerId;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  } else S.input = event.code;
  S.held = true; S.last = performance.now(); phase('drinking');
  $('rules').open = false;
  refreshSipInstruction();
  updateControls(); draw(S.last);
}
function release(event){
  if (event?.pointerId !== undefined && (S.input !== 'pointer' || S.pointer !== event.pointerId)) return;
  if (event?.type === 'keyup' && S.input !== event.code) return;
  if (!S.held || S.phase !== 'drinking') return;
  const now = performance.now(); advance(now); lock(now);
}
function finish(now){
  const drained = S.drink.level >= DRAIN_LEVEL;
  const offset = drained ? 2 : (S.drink.level - S.P.markY) / S.P.markH;
  const result = scoreFromOffset(offset, S.P.theme.target);
  if (drained) Object.assign(result, {score:0, label:'Drank the lot', tone:'miss'});
  if (S.sequence) S.scores[S.stage] = result.score;
  phase('result'); S.motion = makeMotionState(); S.sway = 0;
  const average = experimentAverage(S.scores);
  $('goal').textContent = average === null ? result.score + '/100' : average + '/100 · Four-sip average';
  $('goal').className = 'live-goal tone-' + (average === null ? result.tone : average >= 75 ? 'good' : average >= 25 ? 'warn' : 'miss');
  $('status').textContent = average === null ? EXPERIMENT_STAGES[S.stage].label + ' · ' + result.label + '. Practice only.'
    : 'Blackout: ' + result.score + '/100. All four count. Practice only.';
  updateControls(); layout(); draw(now);
  ($('nextStage').hidden ? $('retry') : $('nextStage')).focus({preventScroll:true});
}
function frame(now){
  if (!document.hidden && S.P && S.phase !== 'loading' && S.phase !== 'error'){
    const dt = advance(now), drinking = S.phase === 'drinking';
    if (drinking && S.drink.level >= DRAIN_LEVEL) lock(now);
    S.motion = stepMotion(S.P, S.motion, {drinking:S.phase === 'drinking', input:S.phase === 'drinking' ? 1 : 0,
      level:S.drink.level, elapsed:S.drink.elapsed, dt, reducedMotion:S.reduced});
    const time = (now - S.readyAt) / 1000;
    const sway = !S.reduced && ['ready','drinking'].includes(S.phase)
      ? S.P.sipSway * (3.6 * Math.sin(time * 1.65) + 1.1 * Math.sin(time * 2.9)) : 0;
    S.sway += (sway - S.sway) * (1 - Math.exp(-dt * 12));
    if (S.phase === 'locked' && isDrinkSettled(S.drink) && isMotionSettled(S.motion)
      && Math.abs(S.sway) < .025 && now - S.lockAt > 350) finish(now);
    const live = ['drinking','locked'].includes(S.phase);
    if ((live && !S.P.blackout) || now - S.drawnAt >= 1000 / 30){ draw(now); S.drawnAt = now; }
  } else S.last = 0;
  requestAnimationFrame(frame);
}
for (const target of [scene, $('drinkControl')]){
  target.addEventListener('pointerdown', down);
  for (const type of ['pointerup','pointercancel','lostpointercapture']) target.addEventListener(type, release);
  target.addEventListener('contextmenu', event => event.preventDefault());
}
window.addEventListener('pointerup', release);
window.addEventListener('blur', () => release());
document.addEventListener('visibilitychange', () => { if (document.hidden) release(); S.last = 0; });
document.addEventListener('keydown', event => {
  const secondary = event.target.closest('button,a,summary,select,input,textarea') && event.target !== $('drinkControl');
  if (!event.repeat && !secondary && (event.code === 'Space' || (event.code === 'Enter' && event.target === $('drinkControl')))) down(event);
});
document.addEventListener('keyup', release);
for (const [index, button] of stageButtons.entries()) button.addEventListener('click', () => {
  if (busy()) return;
  S.sequence = false; S.scores = []; ready(index);
});
function startSequence(){ S.sequence = true; S.scores = []; ready(0); $('drinkControl').focus({preventScroll:true}); }
$('allStages').addEventListener('click', startSequence);
$('retry').addEventListener('click', () => { if (S.sequence) startSequence(); else { ready(); $('drinkControl').focus({preventScroll:true}); } });
$('nextStage').addEventListener('click', () => { if (S.phase === 'result' && S.stage < 3){ ready(S.stage + 1); $('drinkControl').focus({preventScroll:true}); } });
$('glass').addEventListener('change', event => chooseGlass(event.target.value));
$('rules').addEventListener('toggle', () => { if ($('rules').open && S.phase === 'ready') S.readyAt = performance.now(); });
window.addEventListener('resize', () => { layout(); draw(performance.now()); });
motionQuery.addEventListener('change', event => {
  S.reduced = event.matches; if (S.reduced) S.sway = 0;
  refreshSipInstruction();
  updateControls(); layout(); draw(performance.now());
});
for (const theme of THEMES){ const option = document.createElement('option'); option.value = theme.id; option.textContent = theme.name; $('glass').append(option); }
chooseGlass(query.get('glass'));
requestAnimationFrame(frame);
