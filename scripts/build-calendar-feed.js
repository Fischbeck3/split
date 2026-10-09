// Build subscription feeds alongside the static site. Dates remain all-day local
// calendar keys; the planning feed has a clearly tentative draft overlay.
import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {CALENDAR} from '../site/js/calendar-data.js';
import {LAUNCH} from '../site/js/config.js';
import {dayParams, themeById, THEMES} from '../site/js/core.js';
import {addDateDays, createCalendarFeed, keyToDayNumber, validateCalendarPlan} from '../site/js/content-calendar.js';
import {checkCalendarContent} from './check-calendar-content.js';

export async function buildCalendarFeeds(outputDir, {now = new Date(), plan = CALENDAR,
  resolveTheme = (date, themeId) => themeId ? themeById(themeId) : dayParams(keyToDayNumber(date)).theme} = {}){
  if (!outputDir) throw new Error('Provide the calendar feed output directory.');
  const normalized = validateCalendarPlan(plan, {now, themeIds:THEMES.map(theme => theme.id)});
  await checkCalendarContent(normalized);
  const today = new Date(now).toISOString().slice(0, 10);
  const startDate = [LAUNCH, addDateDays(today, -7)].sort().at(-1), endDate = addDateDays(startDate, 89);
  const files = {published:resolve(outputDir, 'calendar.ics'), planning:resolve(outputDir, 'calendar-planning.ics')};
  const options = {startDate, endDate, plan:normalized, resolveTheme, now};
  const published = createCalendarFeed(options), planning = createCalendarFeed({...options, includeDrafts:true});
  await mkdir(outputDir, {recursive:true});
  await writeFile(files.published, published, 'utf8');
  await writeFile(files.planning, planning, 'utf8');
  return {...files, startDate, endDate};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)){
  const args = process.argv.slice(2);
  (args.length === 1 ? buildCalendarFeeds(args[0]) : Promise.reject(new Error('Usage: node scripts/build-calendar-feed.js OUTPUT_DIR')))
    .then(result => console.log(JSON.stringify(result))).catch(error => {console.error(error.message); process.exitCode = 1;});
}
