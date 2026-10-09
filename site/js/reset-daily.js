import {dayKey,dayNumber,dayParams} from './core.js';
import {LAUNCH,LAUNCH_READY} from './config.js';
import {inspectDaily,resetDaily,restoreDaily} from './personal-reset.js';

const $ = id => document.getElementById(id);
let displayedKey;
function today(){ return dayKey(new Date()); }
function browserStorage(){
  try { return window.localStorage; }
  catch { throw new Error('This browser cannot read saved sips. Check its storage settings and try again.'); }
}
function status(message,error = false){
  $('resetStatus').textContent = message;
  $('resetStatus').hidden = !message;
  $('resetStatus').dataset.error = String(error);
}
function showDaily(message = ''){
  const now = new Date(), key = dayKey(now);
  displayedKey = key;
  if (!LAUNCH_READY || key < LAUNCH){
    $('resetDay').textContent = 'The daily run has not started here yet.';
    $('resetRecord').textContent = 'Preview sips are not saved.';
    $('resetDaily').hidden = true;
    return;
  }
  const num = dayNumber(now), theme = dayParams(num).theme;
  const date = new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(now);
  $('resetDay').textContent = 'No. ' + String(num).padStart(3,'0') + ' · ' + date + ' · ' + theme.name;
  const {record,backup} = inspectDaily(browserStorage(),key);
  const score = record && Number.isFinite(record.score) && record.score >= 0 && record.score <= 100;
  $('resetRecord').textContent = record ? (score ? 'Saved sip: ' + record.score + '/100' : 'You have a saved sip today.') : 'Your daily is fresh. No saved sip today.';
  $('resetDaily').hidden = !record;
  $('resetDaily').disabled = false;
  $('undoReset').hidden = !!record || !backup;
  $('openDaily').classList.toggle('is-primary',!record);
  status(message);
}
function fail(error){
  $('resetDaily').disabled = true;
  $('undoReset').hidden = true;
  $('resetRecord').textContent = 'Your saved sip could not be checked.';
  status(error.message || 'This browser could not update your saved sip. Try reopening this page.',true);
}
function checkDaily(){ try { showDaily(); } catch (error){ fail(error); } }
$('resetDaily').addEventListener('click',() => {
  try {
    const key = today();
    if (key !== displayedKey) return showDaily('A new day has started. Check today’s sip before resetting.');
    if (!LAUNCH_READY || key < LAUNCH) return checkDaily();
    const result = resetDaily(browserStorage(),key);
    showDaily(result.changed ? 'Today’s sip is reset. Open a fresh daily to play again.' : 'Your daily is already fresh.');
  } catch (error){ fail(error); }
});
$('undoReset').addEventListener('click',() => {
  try {
    const key = today();
    if (key !== displayedKey) return showDaily('A new day has started. Check today’s sip before restoring.');
    const result = restoreDaily(browserStorage(),key);
    showDaily(result.restored ? 'Your saved sip is restored.' : 'Your current sip has been kept.');
  } catch (error){ fail(error); }
});
// Re-read on return from another tab, so Undo never replaces a newly played sip.
window.addEventListener('pageshow',checkDaily);
window.addEventListener('focus',checkDaily);
window.addEventListener('storage',checkDaily);
checkDaily();
