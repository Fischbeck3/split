// Review/import browser-exported calendar drafts. Publishing is an explicit,
// future-only operation; neither command deploys the site.
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {CALENDAR, LEGACY_OPENING_IDS, LEGACY_ROTATION_IDS} from '../site/js/calendar-data.js';
import {THEMES} from '../site/js/themes.js';
import {latestLiveDate, normalizeCalendarPlan, validateCalendarPlan} from '../site/js/content-calendar.js';
import {checkCalendarContent} from './check-calendar-content.js';

const SOURCE = fileURLToPath(new URL('../site/js/calendar-data.js', import.meta.url));
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Prepare an exact review without writing. Published inputs are never accepted
 * as an alternate source of truth: promotion only comes from reviewed drafts. */
export function prepareCalendarChange(input, {baseline = CALENDAR, now = new Date(), publish = false, date,
  themeIds = THEMES.map(theme => theme.id)} = {}){
  const before = normalizeCalendarPlan(baseline), imported = normalizeCalendarPlan(input);
  if (imported.version !== before.version) throw new Error('Exported calendar version is stale. Reload the calendar and export your draft against the current version.');
  if (!equal(imported.days, before.days)) throw new Error('Exported published days differ. Edit drafts, not published dates.');
  for (const [id, campaign] of Object.entries(before.campaigns)){
    if (campaign.status === 'published' && !equal(imported.campaigns[id], campaign)){
      throw new Error('Preserve published campaign ' + id + '.');
    }
  }
  for (const [id, campaign] of Object.entries(imported.campaigns)){
    if (campaign.status === 'published' && before.campaigns[id]?.status !== 'published'){
      throw new Error('New campaigns must arrive as drafts. Use --publish to promote them.');
    }
  }
  const next = validateCalendarPlan({...imported, version:before.version, updatedAt:before.updatedAt}, {baseline:before, now, themeIds});
  const live = latestLiveDate(now), promoted = [];
  if (date && !publish) throw new Error('--date is only supported with --publish.');
  if (publish){
    const selected = date ? [[date, next.drafts[date]]] : Object.entries(next.drafts);
    if (!selected.length || selected.some(([, entry]) => !entry)) throw new Error('No matching draft dates to publish.');
    for (const [key, entry] of selected){
      if (key <= live) throw new Error('Cannot publish a served or globally live date: ' + key + '.');
      if (entry.campaignId !== 'none'){
        const campaign = next.campaigns[entry.campaignId];
        if (campaign.status === 'draft' && campaign.startDate <= live) throw new Error('Cannot publish a campaign that has already started: ' + entry.campaignId + '.');
        campaign.status = 'published';
      }
      next.days[key] = {themeId:entry.themeId, campaignId:entry.campaignId};
      delete next.drafts[key]; promoted.push(key);
    }
  }
  const changes = [];
  for (const section of ['days', 'drafts', 'campaigns']){
    const keys = [...new Set([...Object.keys(before[section]), ...Object.keys(next[section])])].sort();
    for (const key of keys) if (!equal(before[section][key], next[section][key])){
      changes.push({section, key, before:before[section][key] ?? null, after:next[section][key] ?? null});
    }
  }
  if (changes.length){
    next.version = before.version + 1; next.updatedAt = new Date(now).toISOString();
  }
  const plan = validateCalendarPlan(next, {baseline:before, now, themeIds});
  return {mode:publish ? 'publish' : 'drafts', immutableThrough:live, previousVersion:before.version,
    nextVersion:plan.version, promotedDates:promoted.sort(), changes, plan};
}

export function serializeCalendarPlan(plan){
  const normalized = normalizeCalendarPlan(plan);
  return '// Published dates choose the live glass. Drafts only appear in the planning calendar.\n' +
    '// Keep the legacy lists fixed so new themes cannot reroll old automatic challenges.\n' +
    'export const LEGACY_ROTATION_IDS = Object.freeze(' + JSON.stringify(LEGACY_ROTATION_IDS) + ');\n' +
    'export const LEGACY_OPENING_IDS = Object.freeze(' + JSON.stringify(LEGACY_OPENING_IDS) + ');\n\n' +
    'export const CALENDAR = ' + JSON.stringify(normalized, null, 2) + ';\n';
}

/** --check FILE previews draft import. --publish FILE --check previews promotion. */
export async function runCalendarCli(args, {now = new Date(), baseline = CALENDAR, read = readFile, write = writeFile,
  log = console.log, destination = SOURCE} = {}){
  let mode = null, inputPath = null, check = false, date;
  for (let index = 0; index < args.length; index++){
    const argument = args[index];
    if (['--apply', '--publish'].includes(argument)){
      if (mode) throw new Error('Choose either --apply or --publish.');
      mode = argument.slice(2);
    } else if (argument === '--check') check = true;
    else if (argument === '--date'){
      if (date || !args[index + 1] || args[index + 1].startsWith('--')) throw new Error('Provide one --date YYYY-MM-DD.');
      date = args[++index];
    } else if (argument.startsWith('--') || inputPath) throw new Error('Usage: node scripts/content-calendar.js (--check | --apply | --publish) FILE [--check] [--date YYYY-MM-DD]');
    else inputPath = argument;
  }
  if (!inputPath || (!mode && !check)) throw new Error('Provide an exported plan and --check, --apply or --publish.');
  const input = JSON.parse(await read(resolve(inputPath), 'utf8'));
  const review = prepareCalendarChange(input, {baseline, now, publish:mode === 'publish', date});
  if (mode === 'publish') await checkCalendarContent(review.plan);
  log(JSON.stringify(review, null, 2));
  if (!check && review.changes.length){
    await write(destination, serializeCalendarPlan(review.plan), 'utf8');
    log(mode === 'publish' ? 'Promoted reviewed future drafts locally. Review and deploy the change to publish it on the site.' : 'Saved drafts locally. The published lineup is unchanged.');
  }
  return review;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)){
  runCalendarCli(process.argv.slice(2)).catch(error => {console.error(error.message); process.exitCode = 1;});
}
