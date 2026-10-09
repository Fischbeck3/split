// Pure calendar data and iCalendar formatting. Core imports this file, so it must
// not import core, themes, or browser code. Callers supply theme resolution.
import {LAUNCH, SITE_URL} from './config.js';
import {CALENDAR, LEGACY_OPENING_IDS, LEGACY_ROTATION_IDS} from './calendar-data.js';
import {assertContentReady, contentReadiness, isCampaignReady} from './content-readiness.js';

const DAY_MS = 86400000;
const ID = /^[a-z][a-z0-9-]{0,63}$/;
const encoder = new TextEncoder();
const own = (object, key) => Object.hasOwn(object, key);

export function isDateKey(key){
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const time = Date.parse(key + 'T12:00:00Z');
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === key;
}
function dateTime(key){
  if (!isDateKey(key)) throw new Error('Invalid calendar date: ' + key);
  return Date.parse(key + 'T00:00:00Z');
}
export function keyToDayNumber(key){ return Math.round((dateTime(key) - dateTime(LAUNCH)) / DAY_MS) + 1; }
export function addDateDays(key, days){
  if (!Number.isInteger(days)) throw new Error('Date offset must be a whole number of days.');
  const result = new Date(dateTime(key) + days * DAY_MS).toISOString().slice(0, 10);
  if (!isDateKey(result)) throw new Error('Date is outside the supported calendar.');
  return result;
}
export function latestLiveDate(now = new Date()){
  const time = new Date(now).getTime();
  if (!Number.isFinite(time)) throw new Error('Invalid current time.');
  return new Date(time + 14 * 3600000).toISOString().slice(0, 10);
}

export function getPublishedEntry(date, plan = CALENDAR){
  return isDateKey(date) && own(plan.days, date) ? {...plan.days[date]} : null;
}
export function getCampaignForDate(date, plan = CALENDAR, {includeDrafts = false} = {}){
  if (!isDateKey(date)) return null;
  for (const [id, campaign] of Object.entries(plan.campaigns)){
    if ((includeDrafts || campaign.status === 'published') && date >= campaign.startDate && date <= campaign.endDate){
      return {id, ...campaign};
    }
  }
  return null;
}
export function getCalendarAttribution(date, theme, plan = CALENDAR){
  const entry = getPublishedEntry(date, plan), campaign = entry && plan.campaigns[entry.campaignId];
  const published = campaign?.status === 'published' && date >= campaign.startDate && date <= campaign.endDate;
  return {glass_id:theme.glassId || theme.id, vessel:theme.vessel, scene:theme.scene || 'bar',
    visual_theme:theme.visualTheme || theme.scene || 'bar', campaign_id:published ? entry.campaignId : 'none',
    campaign_day:published ? keyToDayNumber(date) - keyToDayNumber(campaign.startDate) + 1 : 0,
    schedule_version:plan.version};
}

function record(value, label){
  if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))){
    throw new Error(label + ' must be an object.');
  }
  return value;
}
function fields(value, allowed, label){
  record(value, label);
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new Error(label + ': unknown field ' + key);
}
function text(value, label, maximum = 2000){
  if (typeof value !== 'string' || value.length > maximum || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)){
    throw new Error(label + ' must be plain text of at most ' + maximum + ' characters.');
  }
  return value.replace(/\r\n?/g, '\n');
}
function sorted(object, map){
  return Object.fromEntries(Object.entries(object).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => [key, map(value, key)]));
}

/** Normalize a full browser-exported plan; reject fields that would be discarded. */
export function normalizeCalendarPlan(input){
  fields(input, ['version', 'updatedAt', 'days', 'drafts', 'campaigns'], 'Calendar');
  if (!Number.isSafeInteger(input.version) || input.version < 1 || input.version > 2147483647) throw new Error('Calendar version must be a positive integer.');
  if (typeof input.updatedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(input.updatedAt) || !Number.isFinite(Date.parse(input.updatedAt))){
    throw new Error('updatedAt must be an ISO timestamp.');
  }
  const entry = (value, date, draft) => {
    fields(value, draft ? ['themeId', 'campaignId', 'notes'] : ['themeId', 'campaignId'], date);
    if (!isDateKey(date) || date < LAUNCH) throw new Error('Invalid or pre-launch calendar date: ' + date);
    if (typeof value.themeId !== 'string' || !ID.test(value.themeId)) throw new Error(date + ': invalid theme ID.');
    if (typeof value.campaignId !== 'string' || !ID.test(value.campaignId)) throw new Error(date + ': invalid campaign ID.');
    return {themeId:value.themeId, campaignId:value.campaignId, ...(draft ? {notes:text(value.notes ?? '', date + ' notes')} : {})};
  };
  const campaigns = sorted(record(input.campaigns, 'campaigns'), (value, id) => {
    fields(value, ['name', 'startDate', 'endDate', 'status', 'notes'], 'Campaign ' + id);
    if (!ID.test(id) || id === 'none') throw new Error('Invalid campaign ID: ' + id);
    if (!isDateKey(value.startDate) || !isDateKey(value.endDate) || value.startDate < LAUNCH || value.endDate < value.startDate){
      throw new Error(id + ': invalid campaign date span.');
    }
    if (!['published', 'draft'].includes(value.status)) throw new Error(id + ': invalid campaign status.');
    const name = text(value.name, id + ' name', 120).trim();
    if (!name || name.includes('\n')) throw new Error(id + ': campaign name must be one nonempty line.');
    return {name, startDate:value.startDate, endDate:value.endDate, status:value.status, notes:text(value.notes ?? '', id + ' notes')};
  });
  return {version:input.version, updatedAt:new Date(input.updatedAt).toISOString(),
    days:sorted(record(input.days, 'days'), (value, date) => entry(value, date, false)),
    drafts:sorted(record(input.drafts, 'drafts'), (value, date) => entry(value, date, true)), campaigns};
}

/** Validate a reviewed plan against the previously published calendar. */
export function validateCalendarPlan(input, {baseline = CALENDAR, now = new Date(), themeIds = LEGACY_ROTATION_IDS} = {}){
  const plan = normalizeCalendarPlan(input), before = normalizeCalendarPlan(baseline), known = new Set(themeIds);
  if (plan.version < before.version) throw new Error('Calendar version cannot go backwards.');
  for (const id of LEGACY_ROTATION_IDS) if (!known.has(id)) throw new Error('The legacy rotation is missing ' + id + '.');
  for (let i = 0; i < LEGACY_OPENING_IDS.length; i++){
    const date = addDateDays(LAUNCH, i);
    if (plan.days[date]?.themeId !== LEGACY_OPENING_IDS[i]) throw new Error('Keep the opening glass fixed on ' + date + '.');
  }
  const campaigns = Object.entries(plan.campaigns);
  for (let i = 0; i < campaigns.length; i++) for (let j = i + 1; j < campaigns.length; j++){
    const [a, x] = campaigns[i], [b, y] = campaigns[j];
    if (x.startDate <= y.endDate && y.startDate <= x.endDate) throw new Error('Campaign date spans overlap: ' + a + ' and ' + b + '.');
  }
  for (const [kind, entries] of [['days', plan.days], ['drafts', plan.drafts]]) for (const [date, value] of Object.entries(entries)){
    if (!known.has(value.themeId)) throw new Error(date + ': unknown theme ' + value.themeId + '.');
    if (value.campaignId === 'none') continue;
    const campaign = plan.campaigns[value.campaignId];
    if (!campaign) throw new Error(date + ': unknown campaign ' + value.campaignId + '.');
    if (date < campaign.startDate || date > campaign.endDate) throw new Error(date + ': outside campaign date span.');
    if (kind === 'days' && campaign.status !== 'published') throw new Error(date + ': a published day cannot use a draft campaign.');
  }
  const live = latestLiveDate(now);
  for (const date of new Set([...Object.keys(before.days), ...Object.keys(plan.days)])){
    if (date <= live && JSON.stringify(plan.days[date]) !== JSON.stringify(before.days[date])){
      throw new Error('Cannot change a served or globally live date: ' + date + '.');
    }
  }
  for (const [id, campaign] of Object.entries(before.campaigns)){
    if (campaign.status === 'published' && campaign.startDate <= live && JSON.stringify(plan.campaigns[id]) !== JSON.stringify(campaign)){
      throw new Error('Cannot change a served campaign: ' + id + '.');
    }
  }
  for (const [id, campaign] of campaigns){
    if (campaign.status === 'published' && campaign.startDate <= live && !own(before.campaigns, id)){
      throw new Error('Cannot add a published campaign to served dates: ' + id + '.');
    }
  }
  for (const [date, entry] of Object.entries(plan.days)) assertContentReady(entry, date);
  for (const [id, campaign] of campaigns){
    if (campaign.status === 'published' && !isCampaignReady(id)) throw new Error('Campaign content is not built and approved: ' + id);
  }
  return plan;
}

export function escapeCalendarText(value){ return String(value).replace(/\\/g, '\\\\').replace(/\r\n?|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,'); }
/** RFC 5545 limits each physical line to 75 UTF-8 octets; fold between code points. */
export function foldCalendarLine(value){
  const lines = []; let line = '', bytes = 0;
  for (const character of String(value)){
    const length = encoder.encode(character).length;
    if (bytes + length > 75){ lines.push(line); line = ' '; bytes = 1; }
    line += character; bytes += length;
  }
  lines.push(line); return lines.join('\r\n');
}
function timestamp(value){
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid calendar timestamp.');
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}
const compactDate = date => date.replace(/-/g, '');

/** endDate is inclusive. resolveTheme(date, pinnedThemeId?) resolves catalog objects. */
export function createCalendarFeed({startDate, endDate, plan = CALENDAR, resolveTheme, includeDrafts = false, now = new Date()} = {}){
  const normalized = normalizeCalendarPlan(plan);
  if (!isDateKey(startDate) || !isDateKey(endDate) || startDate < LAUNCH || endDate < startDate) throw new Error('Invalid calendar feed date range.');
  if (keyToDayNumber(endDate) - keyToDayNumber(startDate) > 3660) throw new Error('Calendar feed date range is too large.');
  if (typeof resolveTheme !== 'function') throw new Error('Provide a theme resolver.');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Daily Split//Content Calendar//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:' + (includeDrafts ? 'Daily Split planning' : 'Daily Split lineup')];
  function event({uid, start, end, summary, description, tentative, url}){
    lines.push('BEGIN:VEVENT', 'UID:' + uid, 'DTSTAMP:' + timestamp(now), 'LAST-MODIFIED:' + timestamp(normalized.updatedAt),
      'SEQUENCE:' + normalized.version, 'DTSTART;VALUE=DATE:' + compactDate(start), 'DTEND;VALUE=DATE:' + compactDate(end),
      'SUMMARY:' + escapeCalendarText(summary), 'DESCRIPTION:' + escapeCalendarText(description),
      'STATUS:' + (tentative ? 'TENTATIVE' : 'CONFIRMED'), 'TRANSP:TRANSPARENT', 'URL:' + url, 'END:VEVENT');
  }
  for (let date = startDate; date <= endDate; date = addDateDays(date, 1)){
    const draft = includeDrafts && normalized.drafts[date], entry = draft || getPublishedEntry(date, normalized);
    if (entry && !draft) assertContentReady(entry, date);
    const theme = resolveTheme(date, entry?.themeId);
    if (!theme?.id || (entry && theme.id !== entry.themeId)) throw new Error('Theme resolver did not return the requested glass on ' + date + '.');
    const campaign = entry && normalized.campaigns[entry.campaignId], number = keyToDayNumber(date);
    const readiness = contentReadiness(entry);
    const description = [draft ? 'Draft lineup. ' + readiness.label + '. This does not change the daily game.' :
      entry ? 'Scheduled theme. Built and approved.' : 'Automatic rotation. Unplanned date; this fallback is not a reviewed theme assignment.',
      campaign ? campaign.name + ' (' + entry.campaignId + ').' : '', theme.vessel ? 'Glass: ' + theme.vessel + '.' : '',
      theme.scene ? 'Place: ' + theme.scene + '.' : '', draft?.notes || '', 'The link opens an unsaved preview.'].filter(Boolean).join('\n');
    event({uid:'split-' + date + '@dailysplit.us', start:date, end:addDateDays(date, 1),
      summary:(draft ? 'Draft · ' + readiness.label + ' · ' : !entry ? 'Unplanned fallback · ' : '') + 'Split #' + String(number).padStart(3, '0') + ' · ' + (theme.name || theme.id) + ' · ' + (theme.label || theme.id),
      description, tentative:!!draft || !entry, url:SITE_URL + '#day' + number});
  }
  if (includeDrafts) for (const [id, campaign] of Object.entries(normalized.campaigns)){
    if (campaign.status !== 'draft' || campaign.endDate < startDate || campaign.startDate > endDate) continue;
    event({uid:'split-campaign-' + id + '@dailysplit.us', start:campaign.startDate, end:addDateDays(campaign.endDate, 1),
      summary:'Draft week · ' + (isCampaignReady(id) ? 'needs date review' : 'needs build & review') + ' · ' + campaign.name,
      description:'Tentative campaign. ' + (isCampaignReady(id) ? 'Built content; dates still need review.' : 'Campaign content is not built and approved.') + '\n' + campaign.notes, tentative:true,
      url:SITE_URL + 'calendar.html?campaign=' + encodeURIComponent(id)});
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldCalendarLine).join('\r\n') + '\r\n';
}
