// Local calendar dates choose the daily sip; a shared date preserves the same pour.
import {dayNumber, dayKey, keyForDay} from './core.js';
import {LAUNCH, LAUNCH_READY} from './config.js';

/** Reject overflow dates such as February 30 rather than letting Date normalize them. */
export function isCalendarDateKey(key){
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const date = new Date(key + 'T12:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === key;
}

function localDate(key){
  const [year, month, day] = key.split('-').map(Number);
  // Noon avoids a daylight-saving transition at midnight.
  return new Date(year, month - 1, day, 12);
}

function launchNotice(){
  const date = localDate(LAUNCH);
  const label = new Intl.DateTimeFormat('en-US', {month: 'long', day: 'numeric', year: 'numeric'}).format(date);
  return 'The daily run starts ' + label + '. Try a preview sip.';
}

/** Resolve public date links and the deliberately separate design previews. */
export function resolveChallenge({now = new Date(), search = '', hash = '', launchReady = LAUNCH_READY} = {}){
  const today = dayKey(now), beforeLaunch = today < LAUNCH;
  const match = /^#day(\d{1,4})$/.exec(hash);
  const previewNum = match ? Number(match[1]) : 0;
  if (previewNum >= 1 && previewNum <= 9999){
    return {num: previewNum, key: keyForDay(previewNum), kind: 'preview', notice: !launchReady ? 'The daily run opens soon.' : beforeLaunch ? launchNotice() : ''};
  }
  if (!launchReady) return {num: 1, key: keyForDay(1), kind: 'preview', notice: 'The daily run opens soon.'};
  if (beforeLaunch) return {num: 1, key: keyForDay(1), kind: 'preview', notice: launchNotice()};

  const current = {num: dayNumber(now), key: today, kind: 'today', notice: ''};
  const dates = new URLSearchParams(search).getAll('day');
  if (!dates.length){
    if (String(hash).startsWith('#day')) current.notice = 'That preview is unavailable. Here’s today’s sip.';
    return current;
  }
  const key = dates[0];
  if (dates.length !== 1 || !isCalendarDateKey(key)){
    return {...current, notice: 'That challenge link has an invalid date. Here’s today’s sip.'};
  }
  if (key < LAUNCH) return {...current, notice: 'That date was before our first sip. Here’s today’s sip.'};
  if (key > today){
    const tomorrow = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12));
    // A friend across the date line can already be playing tomorrow's glass.
    // Preserve their pour without allowing an early official score here.
    if (key === tomorrow) return {num: dayNumber(localDate(key)), key, kind: 'preview',
      notice: 'Your friend’s glass arrives here tomorrow. Try it as a preview.'};
    return {...current, notice: 'That sip hasn’t arrived yet. Here’s today’s sip.'};
  }
  return {num: dayNumber(localDate(key)), key, kind: key === today ? 'today' : 'archive', notice: ''};
}

/** Check again when the sip finishes, so an old tab cannot record yesterday as today. */
export function canRecordChallenge({key, kind, now = new Date(), launchReady = LAUNCH_READY} = {}){
  return launchReady && kind === 'today' && isCalendarDateKey(key) && key >= LAUNCH && key === dayKey(now);
}
