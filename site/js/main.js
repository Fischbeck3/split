// The app: hold input, the drink, results, sharing and the record.
import {dayParams, startLevel, makeDrinkState, stepDrink, isDrinkSettled, DRAIN_LEVEL,
  scoreFromOffset, bandEmoji, detailText, pad, PERFECT, dayKey, THEMES} from './core.js';
import {drawScene, makeBackdrop, loadSceneAssets} from './draw.js';
import {buildShareText, drawShareCard} from './share.js';
import {createAnalytics, gameProperties, resultProperties as analyticsResultProperties, trackedResultAction} from './analytics.js';
import {getCalendarAttribution} from './content-calendar.js';
import {makeMotionState, stepMotion, isMotionSettled} from './motion.js';
import {resolveChallenge, canRecordChallenge} from './challenge.js';
import {SITE_URL, LAUNCH, LAUNCH_READY, RECORD_RUN} from './config.js';
import {readFriendChallenge, comparisonCopy} from './friend.js';
import {targetHintOpacity} from './target.js';
import {renderVessel} from './render-vessels.js';
import {readThemeReview, reviewHash, adjacentReviewTheme} from './theme-review.js';
import {ROUND_STAGES, roundParams, normalizeRoundRecord, reserveRound, completeRound, recoverInterruptedRound, summarizeRounds} from './rounds.js';
import {focusedGlassBox, interpolateGlassBox} from './focus.js';

const $ = id => document.getElementById(id);
// Separate the friends run from earlier test attempts without moving the calendar.
const STORE = 'split.v1:' + LAUNCH + ':' + RECORD_RUN;
const themeReview = readThemeReview(location.hash);
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion = motionQuery.matches;
// The removed glass button's saved choice must not silently disable tipping.
// Keep the device accessibility preference as the single motion setting.
const stillGlass = () => reducedMotion;
function renderMotionPreference(){
  $('motionNote').hidden = !stillGlass();
  $('motionNote').textContent = 'Reduced motion is on in your device settings. The glass stays upright; the sip works the same.';
}
const onMotionPreferenceChange = event => {
  reducedMotion = event.matches;
  renderMotionPreference();
  if (S.P && S.state !== 'drinking' && S.state !== 'locked') draw(performance.now());
};
if (motionQuery.addEventListener) motionQuery.addEventListener('change', onMotionPreferenceChange);
else if (motionQuery.addListener) motionQuery.addListener(onMotionPreferenceChange);
renderMotionPreference();

const S = {num: 0, key: '', kind: 'today', notice: '', designPreview: false, review:!!themeReview, followToday:false, switchingDay:false, P: null, theme: null, mode: 'hold', state: 'intro', L: 0, L0: 0, practice: false, preview: false,
  result: null, friend: null, holding: false, holdStart: 0, lockAt: 0, last: 0, drawnAt: 0, targetAt: null, drained: false, card: null, drink: null, motion: makeMotionState(),
  baseP:null, progress:null, round:0, roundToken:null, focus:0, focusFrom:0, focusAt:0, focusDuration:620, liveFloor:Infinity, visualSway:0, storageFailed:false};
const analytics = createAnalytics(themeReview ? {projectKey:''} : {});
function resultProperties(){
  return analyticsResultProperties(S);
}
const scene = $('scene'), ctx = scene.getContext('2d');
$('startHold').disabled = true;
let W = 400, H = 700, DPR = 1, backdrop = null, backdropKey = '';
function setPhase(phase){ S.state = phase; $('app').dataset.phase = phase; }

function sipKind(){ return S.review ? 'Review · not saved' : S.preview ? 'Preview' : S.kind === 'archive' ? 'Archive' : S.practice ? 'Practice' : 'Today’s sip'; }
function pourFeel(){ return S.theme.feel || (S.P.choppy ? 'Wobbly pour' : 'Smooth pour'); }
function roundStatus(){ return ROUND_STAGES[S.round].label + ' · Sip ' + (S.round + 1) + ' of 3'; }
function renderRounds(id, rounds = [], current = -1, bestIndex = -1){
  const list = $(id); list.replaceChildren();
  list.dataset.fresh = String(!rounds.length);
  ROUND_STAGES.forEach((stage, index) => {
    const item = document.createElement('li'), name = document.createElement('span'), score = document.createElement('strong');
    name.textContent = stage.label;
    score.textContent = rounds[index] ? rounds[index].score + '/100' : index === current ? 'Your turn' : '—';
    item.append(name, score);
    if (index === current) item.setAttribute('aria-current', 'step');
    if (index === bestIndex){ item.className = 'best-round'; const badge = document.createElement('small'); badge.textContent = 'Best'; item.append(badge); }
    list.append(item);
  });
}
function followsToday(challenge){
  const dates = new URLSearchParams(location.search).getAll('day');
  // A valid shared date stays pinned; rejected links follow their daily fallback.
  return !S.review && !S.designPreview && !(dates.length === 1 && dates[0] === challenge.key);
}
function challengeDate(){
  const [year, month, date] = S.key.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, {month:'short', day:'numeric', year:'numeric'}).format(new Date(year, month - 1, date, 12));
}
function renderChallengeStatus(now = new Date()){
  const todayAvailable = !S.review && (S.kind === 'archive' || (S.preview && !S.designPreview && resolveChallenge({now}).kind === 'today'));
  for (const id of ['introTodayBtn', 'liveTodayBtn', 'newDayBtn']) $(id).hidden = !todayAvailable;
  $('intro').setAttribute('aria-label', S.kind === 'archive' ? 'Try an archived glass' : S.preview ? 'Try a preview glass' : 'Start today’s sip');
  $('startLabel').textContent = S.review || S.kind === 'archive' ? 'Start this glass' : S.preview ? 'Start preview' : 'Start today’s glass';
  $('introNote').textContent = S.review ? (S.notice ? S.notice + ' ' : '') + 'Unlimited review sips. Scores are not saved.' : S.kind === 'archive'
    ? 'Archive · ' + challengeDate() + '. Sips here are not saved.'
    : S.preview ? (todayAvailable && S.key <= dayKey(now) ? 'Today’s glass is ready. This preview is not saved.' : S.notice ? S.notice + ' Preview scores are not saved.' : 'Design preview. Your score will not be saved.')
    : S.storageFailed ? 'Progress stays in this tab. This round will not be saved.'
    : (S.notice ? S.notice + ' ' : '') + (S.progress?.rounds.length ? S.progress.rounds.length + ' of 3 saved. Finish your round.' : 'All three count. Same challenge for everyone.');
  if (['approaching','ready','drinking','between'].includes(S.state)) $('hudMode').textContent = roundStatus() + ' · ' + sipKind();
  $('practiceBtn').textContent = 'Another round · ' + (S.review ? 'review' : S.preview ? 'preview' : S.kind === 'archive' ? 'archive' : 'practice');
  if (S.progress?.rounds.length && !S.progress.done) $('startLabel').textContent = 'Continue · ' + ROUND_STAGES[S.progress.rounds.length].label;
}
function refreshDayStatus(now = new Date()){
  if (S.switchingDay) return true;
  if (S.followToday && S.key){
    const current = resolveChallenge({now});
    if (current.kind === 'today' && (current.key !== S.key || S.kind === 'preview')){
      const idle = S.state === 'intro' || S.state === 'result';
      if (idle && !document.hidden && !$('shareBtn').disabled && !$('saveCardBtn').disabled){
        // Reload once so the next glass initializes its own assets and saved round.
        S.switchingDay = true; $('startHold').disabled = true;
        location.reload();
        return true;
      }
      // Keep an already-started round available to finish and share as an archive.
      if (!idle) S.followToday = false;
    }
  }
  if (S.kind === 'today' && !canRecordChallenge({key:S.key, kind:S.kind, now})){
    S.kind = 'archive'; S.notice = '';
    renderChallengeStatus(now);
    if (S.state === 'result'){ renderResult(); renderStats(); }
    else toast('A new glass is up. This sip is now an archive and will not be saved.');
  } else renderChallengeStatus(now);
  return false;
}

// ---------- storage ----------
function load(){ try { const v = JSON.parse(localStorage.getItem(STORE)); return v && v.days && typeof v.days === 'object' && !Array.isArray(v.days) ? v : {days: {}}; } catch { return {days: {}}; } }
function save(st){ try { localStorage.setItem(STORE, JSON.stringify(st)); return true; } catch { return false; } }

function recordingRound(now = new Date()){
  return !S.practice && !S.storageFailed && canRecordChallenge({key:S.key, kind:S.kind, now});
}
function writeProgress(record){
  S.progress = record;
  const st = load(); st.days[S.key] = record;
  if (!save(st) && !S.storageFailed){
    S.storageFailed = true;
    toast('This browser can’t save progress. Keep this tab open to finish your round.');
  }
}
function reserveCurrentRound(){
  if (S.roundToken) return true;
  const token = globalThis.crypto?.randomUUID?.() || String(Date.now()) + ':' + Math.random();
  const saved = recordingRound() ? load().days[S.key] : null;
  const existing = saved?.theme === S.theme.id ? saved : S.progress;
  const reserved = reserveRound(existing, S.baseP, token);
  if (!reserved.accepted || reserved.record.rounds.length !== S.round){
    toast('This round changed in another tab. Reload to continue your saved sips.');
    $('drinkControl').disabled = true; setPhase('blocked'); return false;
  }
  S.roundToken = token;
  if (recordingRound()) writeProgress(reserved.record); else S.progress = reserved.record;
  return true;
}

// ---------- layout and drawing ----------
function layout(){
  const app = $('app'); W = Math.max(280, app.clientWidth); H = Math.max(400, app.clientHeight);
  DPR = Math.min(2.5, window.devicePixelRatio || 1);
  scene.width = Math.round(W * DPR); scene.height = Math.round(H * DPR); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  // Measure the closed entry tray on resize, including wrapped notes and the
  // review footer. Keep this same vessel box after Start so it never jumps.
  const intro = $('intro'), rules = intro.querySelector('.rules');
  const wasHidden = intro.hidden, wasOpen = rules.open;
  intro.hidden = false; rules.open = false;
  S.glassFloor = intro.querySelector('.sheet').getBoundingClientRect().top - 12;
  rules.open = wasOpen; intro.hidden = wasHidden;
  const controls = $('liveControls'), hidden = controls.hidden;
  controls.hidden = false;
  S.liveFloor = controls.getBoundingClientRect().top - 22;
  controls.hidden = hidden;
}
function glassBox(w, h, theme){
  const b = theme.box, short = h < 740;
  const top = h * (h < 650 ? .24 : theme.vessel === 'bottle' ? .235 : theme.vessel === 'stein' ? .29 : .26);
  const preferredBottom = h * (short ? .625 : .665) - (S.review ? 52 : 0);
  const bot = Math.max(top + 80, Math.min(preferredBottom, S.glassFloor ?? Infinity));
  const stein = theme.vessel === 'stein', halfW = Math.min(w * (stein ? .27 : b.w), (bot - top) * b.h);
  // Center the stein's full silhouette, leaving room for its handle during a sip.
  return {cx: w / 2 - (stein ? halfW * .24 : 0), top, bot, halfW, glass: renderVessel(theme)};
}
function currentBackdrop(G){
  const key = S.theme.id + ':' + W + 'x' + H + ':' + DPR;
  if (key !== backdropKey){ backdrop = makeBackdrop(W, H, G, S.theme, DPR); backdropKey = key; }
  return backdrop;
}
function draw(now){
  const base = glassBox(W, H, S.theme);
  const foreground = focusedGlassBox(base, {w:W,h:H,floor:S.liveFloor,vessel:S.theme.vessel});
  const G = interpolateGlassBox(base, foreground, S.focus);
  const motion = {...S.motion, angle:S.motion.angle + S.visualSway};
  const blur = !reducedMotion && ['ready','drinking'].includes(S.state) ? S.P.sipBlur || 0 : 0;
  scene.style.filter = blur ? 'blur(' + blur + 'px)' : '';
  drawScene(ctx, {G, w: W, h: H, L: S.L, theme: S.theme, P: S.P, motion,
    drinking: S.state === 'drinking', drinkElapsed: S.drink?.elapsed || 0, now,
    bubbles: !reducedMotion, ambient: !reducedMotion, backdrop: currentBackdrop(base),
    targetHint: (S.state === 'intro' || S.state === 'ready') && S.targetAt !== null ? targetHintOpacity(now - S.targetAt, reducedMotion) : 0});
}

// ---------- the drink ----------
function begin(){
  S.mode = 'hold';
  if (refreshDayStatus()) return;
  $('result').classList.remove('fresh-sip');
  S.baseP ||= S.P;
  S.progress ||= normalizeRoundRecord(null, S.baseP);
  S.round = S.progress.rounds.length;
  if (S.round >= 3) return;
  S.P = roundParams(S.baseP, S.round); S.roundToken = null;
  setPhase('approaching'); S.L = S.L0; S.drained = false; S.holding = false; S.holdStart = 0;
  S.drink = makeDrinkState(S.P);
  S.motion = makeMotionState();
  S.targetAt = null; S.visualSway = 0;
  S.focusAt = performance.now(); S.focusFrom = S.focus;
  S.focusDuration = reducedMotion ? 100 : S.focus < .1 ? 620 : 240;
  renderRounds('liveRounds', S.progress.rounds, S.round);
  $('liveGoal').textContent = 'Split ' + S.theme.target + '.';
  $('nextSipBtn').hidden = true;
  $('intro').hidden = true; $('result').hidden = true;
  $('dayHeading').hidden = false; $('liveControls').hidden = false;
  $('hudMode').hidden = false; $('hudMode').textContent = roundStatus() + ' · ' + sipKind();
  $('drinkControl').hidden = false;
  $('drinkControl').disabled = true;
  $('drinkControl').setAttribute('aria-pressed', 'false');
  $('drinkControl').textContent = 'Get ready…';
  $('footPill').textContent = reducedMotion ? 'Finding the mark…' : 'Pulling your glass closer…';
  layout();
}
function readyToSip(now){
  setPhase('ready'); S.focus = 1; S.targetAt = now;
  $('drinkControl').disabled = false; $('drinkControl').textContent = 'Hold to drink';
  $('footPill').textContent = S.round === 0 ? 'Hold to sip. Release early; settle at the mark.' : S.round === 1 ? 'A little sway. Watch the line, then release.' : 'Less steady now. Find the mark and trust your timing.';
  $('drinkControl').focus({preventScroll:true});
}
const wantsDrink = () => S.holding;
const wantsStop = () => !S.holding;
function rate(){ return S.P.K; }
function frame(now){
  if (document.hidden){ S.last = 0; requestAnimationFrame(frame); return; }
  const dt = Math.min(0.25, (now - (S.last || now)) / 1000); S.last = now;
  const elapsed = S.drink?.elapsed || 0;
  let drinkDt = dt;
  if (S.state === 'approaching'){
    const progress = Math.min(1, (now - S.focusAt) / S.focusDuration);
    S.focus = reducedMotion ? 1 : S.focusFrom + (1 - S.focusFrom) * progress;
    if (progress >= 1) readyToSip(now);
  }
  if (S.state === 'ready' && wantsDrink()){
    refreshDayStatus();
    setPhase('drinking'); if (!S.holdStart) S.holdStart = now;
    drinkDt = Math.min(dt, Math.max(0, (now - S.holdStart) / 1000));
    analytics.capture('sip_started', {...gameProperties(S), sip_number:S.round+1, sip_stage:ROUND_STAGES[S.round].label.toLowerCase(), counts:recordingRound()});
    $('footPill').textContent = 'Release early. Let the sip settle.';
  }
  if (S.state === 'drinking'){
    if (wantsStop()) lock(now);
    else { S.drink = stepDrink(S.P, S.drink, rate(), drinkDt); S.L = S.drink.level; }
    if (S.L >= DRAIN_LEVEL){ S.drained = true; lock(now); }
  }
  if (S.state === 'locked'){
    S.drink = stepDrink(S.P, S.drink, 0, dt); S.L = S.drink.level;
    if (S.L >= DRAIN_LEVEL) S.drained = true;
  }
  S.motion = stepMotion(S.P, S.motion, {drinking: S.state === 'drinking',
    input: S.state === 'drinking' ? Math.min(1, rate() / S.P.K) : 0, level:S.L, elapsed, dt, reducedMotion: stillGlass()});
  const stageTime = (now - S.focusAt) / 1000;
  const sway = !reducedMotion && ['ready','drinking'].includes(S.state)
    ? (S.P.sipSway || 0) * (3.6 * Math.sin(stageTime * 1.65) + 1.1 * Math.sin(stageTime * 2.9)) : 0;
  S.visualSway += (sway - S.visualSway) * (1 - Math.exp(-dt * 12));
  if (S.state === 'locked' && isDrinkSettled(S.drink) && isMotionSettled(S.motion) && Math.abs(S.visualSway) < .025 && now - S.lockAt > 350) finish(now);
  // Ambient layers need only 30 fps at rest; the sip retains its full frame rate.
  if (S.state !== 'result' && ((S.state === 'drinking' || S.state === 'locked') || now - S.drawnAt >= 1000 / 30)){
    draw(now); S.drawnAt = now;
  }
  requestAnimationFrame(frame);
}
function lock(now){
  setPhase('locked'); S.lockAt = now; up();
  $('drinkControl').disabled = true; $('drinkControl').textContent = 'Settling…';
  $('footPill').textContent = stillGlass() ? 'Letting the sip settle…' : 'Returning upright. Let the sip settle…';
}
function showRoundOutcome(now = performance.now()){
  S.roundToken = null;
  const rounds = S.progress.rounds;
  if (S.progress.done){
    S.result = {...S.progress, counts:recordingRound(), attribution:{...S.attribution}};
    S.L = S.result.L; S.motion = makeMotionState(); S.visualSway = 0;
    draw(now); setPhase('result'); $('liveControls').hidden = true; $('hudMode').hidden = true;
    renderResult(); renderStats(); $('result').classList.add('fresh-sip');
    return;
  }
  setPhase('between'); scene.style.filter = '';
  const last = rounds.at(-1), best = summarizeRounds(rounds);
  renderRounds('liveRounds', rounds, -1, best.bestIndex);
  $('liveGoal').textContent = last.score + '/100';
  $('footPill').textContent = last.label + '. Average so far: ' + best.score + '/100.';
  $('drinkControl').hidden = true; $('nextSipBtn').hidden = false;
  $('nextSipBtn').textContent = 'Next sip · ' + ROUND_STAGES[rounds.length].label;
  $('nextSipBtn').focus({preventScroll:true});
  draw(now);
}
function finish(now){
  const finishedAt = new Date(); refreshDayStatus(finishedAt);
  const f = S.drained ? 2 : (S.L - S.P.markY) / S.P.markH, r = scoreFromOffset(f, S.theme.target);
  if (S.drained){ r.label = 'Drank the lot'; r.tone = 'miss'; r.score = 0; }
  const counts = recordingRound(finishedAt);
  const result = {f, score:r.score, label:r.label, tone:r.tone, drained:S.drained, L:S.L, mode:S.mode,
    counts, t:finishedAt.toISOString(), attribution:{...S.attribution}};
  const existing = counts ? load().days[S.key] || S.progress : S.progress;
  const completed = completeRound(existing, S.baseP, S.roundToken, result);
  if (!completed.accepted){
    S.progress = completed.record;
    if (S.progress?.done) showRoundOutcome(now);
    else { setPhase('blocked'); $('drinkControl').disabled = true; toast('This sip changed in another tab. Reload to continue.'); }
    return;
  }
  if (counts) writeProgress(completed.record); else S.progress = completed.record;
  analytics.capture('sip_completed', {...gameProperties(S, finishedAt),
    score:S.progress.done ? S.progress.score : r.score, drained:S.progress.done ? S.progress.drained : S.drained,
    sip_score:r.score, sip_drained:S.drained,
    sip_number:S.round+1, sip_stage:ROUND_STAGES[S.round].label.toLowerCase(),
    counts:counts && !S.storageFailed && S.progress.done, new_record:counts && !S.storageFailed && S.progress.done,
    round_complete:S.progress.done, best_score:S.progress.bestScore, average_score:S.progress.averageScore}, finishedAt);
  showRoundOutcome(now);
}

// ---------- results and sharing ----------
function shareText(){
  return buildShareText({num:S.num, key:S.key, theme:S.theme, result:S.result, url:SITE_URL, preview:S.preview, archive:S.kind === 'archive', review:S.review});
}
function renderResult(){
  const r = S.result;
  $('resScore').textContent = r.score; $('resScore').className = 'tone-' + r.tone;
  $('resLabel').textContent = r.label; $('resLabel').className = 'tone-' + r.tone;
  $('resDetail').textContent = r.drained ? 'You drank the lot.' : Math.round(Math.abs(r.f) * 100) === 0 ? 'Dead center. A lovely sip.' : Math.round(Math.abs(r.f) * 100) + '% of the mark’s height ' + (r.f < 0 ? 'high.' : 'low.');
  $('resKind').textContent = S.review ? 'Review · not saved' : S.preview ? 'Preview · not saved' : S.kind === 'archive' ? 'Archive · ' + (r.counts ? 'saved sip' : 'not saved') : S.storageFailed ? 'Today · not saved' : r.counts ? 'Today’s round' : 'Practice · not saved';
  const saved = load().days[S.key];
  $('officialBtn').hidden = r.counts || S.kind !== 'today' || !saved?.done || saved.theme !== S.theme.id;
  $('resStrip').textContent = bandEmoji(r.f);
  $('resStrip').hidden = r.rounds?.length === 3;
  $('resultRounds').hidden = !r.rounds?.length;
  if (r.rounds?.length) renderRounds('resultRounds', r.rounds, -1, r.bestIndex);
  if (r.rounds?.length === 3){
    $('resDetail').textContent = 'Best sip: ' + ROUND_STAGES[r.bestIndex].label + ' · ' + r.bestScore + '/100. ' + $('resDetail').textContent;
  }
  const comparison = S.friend ? comparisonCopy(S.friend, r) : null;
  $('friendComparison').hidden = !comparison;
  if (comparison){
    const kind = S.friend.kind === 'daily' || S.friend.kind === 'archive-saved' ? '' : ' (' + S.friend.kind + ')';
    $('friendComparison').textContent = 'You ' + r.score + ' · Shared ' + (S.friend.scoring === 'average' ? 'average ' : 'sip ') + S.friend.score + kind + '. ' + comparison.text;
    $('friendComparison').dataset.outcome = comparison.status;
  }
  $('result').dataset.perfect = String(r.rounds?.length === 3
    ? r.rounds.every(sip => !sip.drained && Math.abs(sip.f) <= PERFECT)
    : !r.drained && Math.abs(r.f) <= PERFECT);
  $('result').style.setProperty('--stop-line', ((48 + r.L * 642) / 750 * 100) + '%');
  $('result').classList.remove('fresh-sip');
  $('shareText').textContent = shareText(); $('shareText').closest('details').open = false;
  for (const id of ['shareBtn', 'copyBtn', 'saveCardBtn']) resetAction($(id));
  $('copyBtn').textContent = 'Copy text';
  $('dayHeading').hidden = true;
  $('result').hidden = false;
  // Prepare the postcard separately; sharing the result never waits for its image.
  const c = drawCard(); $('cardImg').src = c.toDataURL('image/png'); $('cardImg').hidden = false;
  $('cardImg').alt = (r.rounds?.length === 3 ? 'Average of three. ' : '') + S.theme.label + ': ' + r.score + ' out of 100. ' + r.label + '. ' + $('resDetail').textContent + ' ' + $('resKind').textContent + (comparison ? '. ' + comparison.text + ' Both best stopping lines are shown.' : '');
  S.card = new Promise(res => c.toBlob(blob => res({canvas: c, blob}), 'image/png'));
  $('result').scrollTop = 0;
}
function drawCard(){
  return drawShareCard($('card'), {num:S.num, key:S.key, theme:S.theme, P:S.P, result:S.result, friend:S.friend, url:SITE_URL, preview:S.preview, archive:S.kind === 'archive', review:S.review});
}
async function share(){
  const btn = $('shareBtn'); btn.disabled = true; btn.setAttribute('aria-busy', 'true');
  try {
    const outcome = await trackedResultAction({text:shareText(), platform:navigator, tracker:analytics, properties:resultProperties()});
    if (outcome === 'shared') confirmAction(btn, 'Shared');
    else if (outcome === 'copied'){
      confirmAction(btn, 'Copied'); toast('Result copied. Paste it into your group chat.');
    } else if (outcome === 'manual') showManualText(btn);
  } finally { btn.disabled = false; btn.removeAttribute('aria-busy'); }
}
async function savePostcard(){
  const btn = $('saveCardBtn'); btn.disabled = true; btn.setAttribute('aria-busy', 'true');
  const properties = resultProperties();
  analytics.capture('postcard_save_attempted', properties);
  try {
    const {blob} = await S.card, name = 'split-no-' + S.num + '.png';
    if (!blob) throw new Error('Postcard encoding failed');
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
    // Browser download initiation is observable; saving to the user's filesystem is not.
    analytics.capture('postcard_saved', {...properties, outcome:'download_initiated'});
    confirmAction(btn, 'Card saved');
    toast('Postcard saved. Send it with your result link.');
  } catch { analytics.capture('postcard_save_failed', properties); toast('Could not save the postcard. Try again.'); }
  finally { btn.disabled = false; btn.removeAttribute('aria-busy'); }
}
const actionFeedback = new WeakMap();
function resetAction(btn){
  const previous = actionFeedback.get(btn);
  if (previous){ clearTimeout(previous.timer); btn.innerHTML = previous.html; actionFeedback.delete(btn); }
  delete btn.dataset.confirmed;
}
function confirmAction(btn, label){
  const html = actionFeedback.get(btn)?.html || btn.innerHTML;
  resetAction(btn); btn.textContent = label; btn.dataset.confirmed = 'true';
  actionFeedback.set(btn, {html, timer: setTimeout(() => resetAction(btn), 1800)});
}
function showManualText(btn){
  resetAction(btn);
  const pre = $('shareText'); pre.closest('details').open = true;
  pre.focus({preventScroll:true});
  const range = document.createRange(); range.selectNodeContents(pre);
  const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
  if (btn === $('copyBtn')) btn.textContent = 'Select and copy';
  pre.scrollIntoView({block:'nearest'});
  toast('Copy the selected result into your group chat.');
}
async function copyText(){
  const btn = $('copyBtn'), outcome = await trackedResultAction({text:shareText(), platform:navigator, tracker:analytics,
    properties:resultProperties(), source:'copy_button'});
  if (outcome === 'copied') confirmAction(btn, 'Copied');
  else showManualText(btn);
}

// ---------- the record and the clock ----------
function renderStats(){
  const st = LAUNCH_READY ? load() : {days:{}}, keys = Object.keys(st.days).filter(k => st.days[k].done);
  let best = null, perfect = 0;
  for (const k of keys){
    const saved = st.days[k], d = saved.version === 2 && Array.isArray(saved.rounds) ? summarizeRounds(saved.rounds) : saved;
    if (best === null || d.score > best) best = d.score;
    if (d.rounds?.length === 3 ? d.rounds.every(sip => Math.abs(sip.f) <= PERFECT && !sip.drained) : Math.abs(d.f) <= PERFECT && !d.drained) perfect++;
  }
  let streak = 0; const cur = new Date(); cur.setHours(0, 0, 0, 0);
  if (!(st.days[dayKey(cur)] && st.days[dayKey(cur)].done)) cur.setDate(cur.getDate() - 1);
  while (st.days[dayKey(cur)] && st.days[dayKey(cur)].done){ streak++; cur.setDate(cur.getDate() - 1); }
  $('stDays').textContent = keys.length; $('stStreak').textContent = streak; $('stBest').textContent = best === null ? '—' : best; $('stPerfect').textContent = perfect;
}
function msToMidnight(){ const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1) - n; }
function tickClock(){
  const s = Math.max(0, Math.floor(msToMidnight() / 1000));
  $('countdown').textContent = pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s % 3600 / 60)) + ':' + pad(s % 60);
  refreshDayStatus();
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
  refreshDayStatus();
  if (!reserveCurrentRound()) return;
  if (e.cancelable) e.preventDefault();
  if (e.pointerId != null && e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
  $('drinkControl').setAttribute('aria-pressed', 'true');
  $('drinkControl').textContent = 'Release to stop';
  S.holding = true; if (S.state === 'ready') S.holdStart = performance.now();
  if (S.state === 'ready'){
    // A short tap is still a sip, even when both events precede the next frame.
    setPhase('drinking'); S.last = S.holdStart;
    analytics.capture('sip_started', {...gameProperties(S), sip_number:S.round+1,
      sip_stage:ROUND_STAGES[S.round].label.toLowerCase(), counts:recordingRound()});
    $('footPill').textContent = 'Release early. Let the sip settle.';
  }
};
const up = () => {
  // Account for the final part of a hold at the release event, rather than
  // allowing a slower screen's next animation frame to choose the stopping time.
  if (S.holding && S.state === 'drinking'){
    const now = performance.now(), dt = Math.max(0, Math.min(0.25, (now - S.last) / 1000));
    S.drink = stepDrink(S.P, S.drink, rate(), dt); S.L = S.drink.level; S.last = now;
    if (S.L >= DRAIN_LEVEL) S.drained = true;
    lock(now);
  }
  S.holding = false; $('drinkControl').setAttribute('aria-pressed', 'false');
  if (S.state === 'ready' || S.state === 'drinking') $('drinkControl').textContent = 'Hold to drink';
};
for (const target of [scene, $('drinkControl')]){
  target.addEventListener('pointerdown', down); target.addEventListener('pointerup', up); target.addEventListener('pointercancel', up);
  target.addEventListener('contextmenu', e => e.preventDefault());
}
window.addEventListener('pointerup', up);
window.addEventListener('blur', up);
document.addEventListener('visibilitychange', () => {
  if (document.hidden){ up(); if (S.state === 'drinking') lock(performance.now()); }
  else if (S.P) tickClock();
});
window.addEventListener('pageshow', () => { if (S.P) tickClock(); });
document.addEventListener('keydown', e => {
  // Space on a secondary control keeps its native action; the hold button and
  // noninteractive page area remain keyboard sipping targets.
  const secondary = e.target instanceof Element && e.target.closest('button,a,summary,input,textarea,select') && e.target !== $('drinkControl');
  if (e.code === 'Space' && !e.repeat && !secondary && (S.state === 'ready' || S.state === 'drinking')){ e.preventDefault(); down(e); }
});
document.addEventListener('keyup', e => { if (e.code === 'Space') up(); });
$('drinkControl').addEventListener('keydown', e => { if (e.code === 'Enter' && !e.repeat){ e.preventDefault(); down(e); } });
$('drinkControl').addEventListener('keyup', e => { if (e.code === 'Enter') up(); });
$('startHold').addEventListener('click', begin);
$('nextSipBtn').addEventListener('click', begin);
$('shareBtn').addEventListener('click', share);
$('saveCardBtn').addEventListener('click', savePostcard);
$('copyBtn').addEventListener('click', copyText);
$('practiceBtn').addEventListener('click', () => {
  S.practice = true; S.progress = null; S.focus = 0;
  begin();
});
$('reviewTheme').addEventListener('change', event => { location.hash = reviewHash(event.target.value); });
$('reviewRefill').addEventListener('click', () => { if (S.review && S.P){ S.practice = true; S.progress = null; S.focus = 0; begin(); } });
for (const id of ['introTodayBtn', 'liveTodayBtn', 'newDayBtn']) $(id).addEventListener('click', () => location.assign('./'));
$('officialBtn').addEventListener('click', () => {
  refreshDayStatus();
  if (!canRecordChallenge({key:S.key, kind:S.kind})) return;
  const rec = load().days[S.key]; if (!rec || !rec.done || rec.theme !== S.theme.id) return;
  S.progress = normalizeRoundRecord(rec, S.baseP);
  if (!S.progress?.done) return;
  S.practice = false; S.mode = S.progress.mode; S.L = S.progress.L;
  S.result = {...S.progress, counts:true}; setPhase('result'); draw(performance.now()); renderResult();
});
window.addEventListener('hashchange', () => location.reload());
window.addEventListener('resize', () => {
  layout(); if (S.theme && $('app').classList.contains('scene-ready')) draw(performance.now());
});
document.querySelector('.rules').addEventListener('toggle', event => {
  if (event.currentTarget.open && S.state === 'intro' && S.theme && $('app').classList.contains('scene-ready')){
    S.targetAt = performance.now(); draw(S.targetAt);
  }
});

// ---------- start ----------
async function init(){
  const now = new Date(), challenge = themeReview || resolveChallenge({now, search:location.search, hash:location.hash});
  S.num = challenge.num; S.key = challenge.key; S.kind = challenge.kind; S.notice = challenge.notice;
  const previewMatch = /^#day(\d{1,4})$/.exec(location.hash || '');
  S.preview = S.kind === 'preview'; S.designPreview = S.preview && !!previewMatch && Number(previewMatch[1]) >= 1;
  S.followToday = followsToday(challenge);
  S.P = themeReview?.P || dayParams(S.num); S.baseP = S.P; S.theme = S.P.theme;
  S.attribution = getCalendarAttribution(S.key, S.theme);
  S.friend = S.review ? null : readFriendChallenge({search:location.search, hash:location.hash, key:S.key, num:S.num, theme:S.theme});
  analytics.capture('game_opened', gameProperties(S, now), now);
  if (S.friend) analytics.capture('friend_link_opened', {...gameProperties(S, now), friend_sip_kind:S.friend.kind}, now);
  await loadSceneAssets(S.theme);
  S.L0 = startLevel(S.theme); S.L = S.L0;
  const palette = S.theme.palette || {bg:'#17110d', fg:'#f5ecdc', muted:'#b3a48e', sheet:'#221a14', line:'#3a2d23', accent:'#e9b949', accentFg:'#17110d'};
  for (const [name, value] of Object.entries(palette)) document.documentElement.style.setProperty('--' + (name === 'accentFg' ? 'accent-fg' : name), value);
  const light = S.theme.colorScheme ? S.theme.colorScheme === 'light' : S.theme.scene === 'beach' || S.theme.scene === 'munich';
  document.documentElement.style.colorScheme = light ? 'light' : 'dark';
  for (const [name,value] of Object.entries(light ? {good:'#267347',warn:'#936210',miss:'#b64037'} : {good:'#91dda8',warn:'#d9b874',miss:'#ffaaa0'})) document.documentElement.style.setProperty('--'+name,value);
  document.querySelector('meta[name="theme-color"]').content = palette.bg;
  $('hudSub').textContent = S.theme.name + (S.theme.id === 'pub' ? ' · Ireland' : S.theme.id === 'beach' ? ' · Cabo, Mexico' : S.theme.id === 'munich' ? ' · Munich, Germany' : ' · ' + S.theme.label);
  $('introNo').textContent = S.review ? 'Review ' + S.num + '/' + THEMES.length : 'No. ' + String(S.num).padStart(3, '0');
  $('introName').textContent = S.theme.label;
  $('memoryLine').textContent = S.theme.memory || ''; $('memoryLine').hidden = !S.theme.memory;
  $('friendInvite').hidden = !S.friend;
  if (S.friend){
    const kind = S.friend.kind === 'daily' || S.friend.kind === 'archive-saved' ? '' : ' (' + S.friend.kind + ')';
    $('friendInvite').textContent = 'Your friend’s ' + (S.friend.scoring === 'average' ? 'average: ' : '') + S.friend.score + '/100' + kind + ' to beat.';
  }
  $('introGoal').textContent = $('liveGoal').textContent = 'Split ' + S.theme.target + '.';
  $('introFeel').textContent = S.theme.feel || (S.P.choppy ? 'Wobbly pour' : 'Smooth pour');
  $('vesselHint').textContent = S.theme.vessel === 'bottle'
    ? 'The narrow neck empties quickly, then air enters in glugs through the body. Release a little early and let it settle.'
    : S.theme.vessel === 'stein'
      ? 'The heavy stein starts slowly and keeps flowing briefly after release. Come upright before the mark.'
      : S.theme.vessel === 'mug'
        ? 'The sip keeps moving briefly after release. Release before the mark and let it settle.'
        : 'As the glass narrows, the beer line falls faster. Release before the mark and let the sip settle.';
  renderMotionPreference();
  document.title = S.review ? 'Split theme review · ' + S.theme.name : 'Split No. ' + S.num + ' · ' + S.theme.label;
  scene.setAttribute('aria-label', S.theme.name + '. Match the beer line beneath the foam to the brief dashed target line across ' + S.theme.target + '.');
  if (S.designPreview){
    document.body.classList.add('preview'); $('previewNav').hidden = false;
    const active = $('previewNav').querySelector('a[href="#day' + S.num + '"]');
    if (active) active.setAttribute('aria-current', 'page');
  }
  if (S.review){
    document.body.classList.add('preview', 'theme-review');
    $('reviewNav').hidden = false;
    for (const theme of THEMES){
      const option = document.createElement('option'); option.value = theme.id; option.textContent = theme.name;
      $('reviewTheme').appendChild(option);
    }
    $('reviewTheme').value = S.theme.id;
    $('reviewPrev').href = reviewHash(adjacentReviewTheme(S.theme.id, -1));
    $('reviewNext').href = reviewHash(adjacentReviewTheme(S.theme.id, 1));
    document.querySelector('.stats').hidden = true;
    document.querySelector('.next').hidden = true;
  }

  renderRounds('introRounds', [], 0);
  setPhase('intro'); renderChallengeStatus(now); S.targetAt = performance.now(); layout(); draw(S.targetAt); $('app').classList.add('scene-ready');
  $('startHold').disabled = false;
  renderStats(); tickClock(); setInterval(tickClock, 1000);
  if (S.switchingDay) return;
  const rec = canRecordChallenge({key:S.key, kind:S.kind}) ? load().days[S.key] : null;
  if (rec && rec.theme === S.theme.id){
    const normalized = normalizeRoundRecord(rec, S.baseP);
    S.progress = recoverInterruptedRound(normalized, S.baseP);
    if (!normalized){
      S.progress = normalizeRoundRecord(null, S.baseP);
      writeProgress(S.progress);
      toast('This browser’s unfinished round could not be read. A fresh round is ready.');
    }
    if (rec.pending || rec.version !== 2 || rec.scoring !== 'average') writeProgress(S.progress);
    renderRounds('introRounds', S.progress.rounds, S.progress.done ? -1 : S.progress.rounds.length);
    if (S.progress.done){
      S.L = S.progress.L; S.mode = S.progress.mode || 'hold'; S.focus = 1;
      S.result = {...S.progress, counts:true}; setPhase('result');
      $('intro').hidden = true; draw(performance.now()); renderResult();
    } else {
      renderChallengeStatus(now);
      if (rec.pending) toast('Your interrupted sip counted as a miss. Continue the round.');
    }
  } else renderRounds('introRounds', [], 0);
  layout(); draw(performance.now());
  requestAnimationFrame(frame);
}
const fontsReady = document.fonts && document.fonts.load
  ? Promise.all([document.fonts.load('900 40px Fraunces'), document.fonts.load('700 16px Karla')]).catch(() => {})
  : Promise.resolve();
Promise.race([fontsReady, new Promise(r => setTimeout(r, 2500))]).then(init);
