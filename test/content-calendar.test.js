import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, readdir, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {CALENDAR, LEGACY_OPENING_IDS, LEGACY_ROTATION_IDS} from '../site/js/calendar-data.js';
import {addDateDays, createCalendarFeed, getCalendarAttribution, getCampaignForDate, getPublishedEntry,
  isDateKey, keyToDayNumber, latestLiveDate, normalizeCalendarPlan, validateCalendarPlan} from '../site/js/content-calendar.js';
import {prepareCalendarChange, runCalendarCli, serializeCalendarPlan} from '../scripts/content-calendar.js';
import {buildCalendarFeeds} from '../scripts/build-calendar-feed.js';

const NOW = new Date('2026-10-09T20:30:00Z');
const copy = () => structuredClone(CALENDAR);
const theme = (date, id) => ({id:id || 'pub', name:'Guinness', label:'Old Irish pub', vessel:'tulip', scene:'pub'});
const options = {startDate:'2026-10-25', endDate:'2026-10-31', resolveTheme:theme, now:NOW};
const unfolded = value => value.replace(/\r\n[ \t]/g, '');
const events = value => unfolded(value).split('BEGIN:VEVENT\r\n').slice(1).map(item => item.split('\r\nEND:VEVENT')[0]);

test('date keys survive leap years, daylight-saving dates and the global live boundary', () => {
  for (const key of ['2026-02-29', '2026-02-30', '2026-13-01', '2026-10-9', 'constructor']) assert.equal(isDateKey(key), false);
  assert.equal(isDateKey('2028-02-29'), true);
  assert.equal(addDateDays('2028-02-28', 1), '2028-02-29');
  assert.equal(addDateDays('2028-02-29', 1), '2028-03-01');
  assert.equal(addDateDays('2026-11-01', 1), '2026-11-02');
  assert.equal(keyToDayNumber('2026-10-09'), 1);
  assert.equal(keyToDayNumber('2026-10-31'), 23);
  assert.equal(latestLiveDate('2026-10-09T09:59:59Z'), '2026-10-09');
  assert.equal(latestLiveDate('2026-10-09T10:00:00Z'), '2026-10-10');
  assert.throws(() => addDateDays('2026-02-30', 1), /Invalid calendar date/);
});

test('published attribution never takes a holiday draft or campaign span as approval', () => {
  assert.deepEqual(getPublishedEntry('2026-10-09'), {themeId:'pub', campaignId:'opening-2026'});
  const entry = getPublishedEntry('2026-10-09'); entry.themeId = 'cola';
  assert.equal(getPublishedEntry('2026-10-09').themeId, 'pub');
  assert.equal(getPublishedEntry('2026-10-25'), null);
  assert.equal(getCampaignForDate('2026-10-25'), null);
  assert.equal(getCampaignForDate('2026-10-25', CALENDAR, {includeDrafts:true}).id, 'halloween-2026');
  const t = {id:'pub', glassId:'guinness-tulip', vessel:'tulip', scene:'pub', visualTheme:'irish-pub'};
  assert.deepEqual(getCalendarAttribution('2026-10-10', t), {
    glass_id:'guinness-tulip', vessel:'tulip', scene:'pub', visual_theme:'irish-pub',
    campaign_id:'opening-2026', campaign_day:2, schedule_version:1
  });
  assert.equal(getCalendarAttribution('2026-10-25', t).campaign_id, 'none');
  const partial = copy(); partial.campaigns['halloween-2026'].status = 'published';
  assert.equal(getCalendarAttribution('2026-10-25', t, partial).campaign_id, 'none');
  assert.equal(getCalendarAttribution('2026-10-25', {id:'coffee', vessel:'cup'}).scene, 'bar');
});

test('validation rejects missing themes, malformed campaigns and altered released selections', () => {
  assert.deepEqual(validateCalendarPlan(CALENDAR, {now:NOW}), normalizeCalendarPlan(CALENDAR));
  const bad = change => {const plan = copy(); change(plan); return plan;};
  assert.throws(() => validateCalendarPlan(bad(plan => plan.drafts['2026-10-25'].themeId = 'concept-new'), {now:NOW}), /unknown theme/);
  assert.throws(() => validateCalendarPlan(bad(plan => plan.campaigns['halloween-2026'].endDate = '2026-02-30'), {now:NOW}), /date span/);
  assert.throws(() => validateCalendarPlan(bad(plan => plan.drafts['2026-10-24'] = {...plan.drafts['2026-10-25']}), {now:NOW}), /outside campaign/);
  assert.throws(() => validateCalendarPlan(bad(plan => plan.campaigns['extra'] = {...plan.campaigns['halloween-2026']}), {now:NOW}), /overlap/);
  assert.throws(() => validateCalendarPlan(bad(plan => plan.days['2026-10-09'].themeId = 'cola'), {now:NOW}), /opening glass fixed/);
  assert.throws(() => validateCalendarPlan(bad(plan => plan.days['2026-10-15'] = {themeId:'cola', campaignId:'none'}), {now:'2026-10-15T00:00:00Z'}), /served or globally live/);
  assert.throws(() => validateCalendarPlan(bad(plan => plan.campaigns['opening-2026'].name = 'Changed history'), {now:NOW}), /served campaign/);
  assert.throws(() => validateCalendarPlan(CALENDAR, {now:NOW, themeIds:LEGACY_ROTATION_IDS.slice(1)}), /legacy rotation/);
  assert.ok(Object.isFrozen(LEGACY_ROTATION_IDS)); assert.ok(Object.isFrozen(LEGACY_OPENING_IDS));
  assert.throws(() => normalizeCalendarPlan({...copy(), silentlyIgnored:'bad'}), /unknown field/);
});

test('imported IDs must stay scalar strings instead of accepting JavaScript coercion', () => {
  for (const [field, invalid] of [['themeId', ['choc']], ['themeId', true], ['campaignId', ['halloween-2026']], ['campaignId', true]]) {
    const plan = copy(); plan.drafts['2026-10-25'][field] = invalid;
    assert.throws(() => normalizeCalendarPlan(plan), /invalid (theme|campaign) ID/);
    assert.throws(() => prepareCalendarChange(plan, {now:NOW, publish:true}), /invalid (theme|campaign) ID/);
  }
});

test('draft imports preserve all published days; explicit promotion only accepts globally future dates', async () => {
  const input = copy(); input.drafts['2026-10-25'].themeId = 'cider';
  const draftReview = prepareCalendarChange(input, {now:NOW});
  assert.deepEqual(draftReview.plan.days, normalizeCalendarPlan(CALENDAR).days);
  assert.equal(draftReview.plan.campaigns['halloween-2026'].status, 'draft');
  assert.equal(draftReview.plan.version, 2);
  assert.equal(draftReview.changes.length, 1);
  assert.deepEqual(draftReview.changes[0], {section:'drafts', key:'2026-10-25', before:CALENDAR.drafts['2026-10-25'], after:input.drafts['2026-10-25']});
  const promoted = prepareCalendarChange(input, {now:NOW, publish:true});
  assert.equal(promoted.promotedDates.length, 7);
  assert.equal(promoted.plan.days['2026-10-25'].themeId, 'cider');
  assert.equal(promoted.plan.campaigns['halloween-2026'].status, 'published');
  assert.deepEqual(promoted.plan.drafts, {});
  assert.throws(() => prepareCalendarChange(input, {now:'2026-10-24T10:00:00Z', publish:true}), /globally live/);
  assert.throws(() => prepareCalendarChange(input, {now:'2026-10-25T20:00:00Z', publish:true, date:'2026-10-31'}), /already started/);
  const altered = copy(); altered.days['2026-10-13'].themeId = 'cola';
  assert.throws(() => prepareCalendarChange(altered, {now:NOW}), /Edit drafts/);
  assert.throws(() => prepareCalendarChange({...input, version:99}, {now:NOW}), /version is stale/);
  const serialized = serializeCalendarPlan(draftReview.plan);
  assert.match(serialized, /export const CALENDAR =/);
  assert.match(serialized, /LEGACY_ROTATION_IDS = Object.freeze/);
  const writes = [], logs = [];
  const dependencies = {now:NOW, read:async () => JSON.stringify(input), write:async (...args) => writes.push(args), log:value => logs.push(value)};
  await runCalendarCli(['--check','plan.json'], dependencies);
  await runCalendarCli(['--publish','plan.json','--check'], dependencies);
  assert.equal(writes.length, 0, 'reviews cannot write or publish');
  await runCalendarCli(['--apply','plan.json'], dependencies);
  assert.equal(writes.length, 1);
  const saved = JSON.parse(writes[0][1].split('export const CALENDAR = ')[1].trim().slice(0, -1));
  assert.deepEqual(saved.days, normalizeCalendarPlan(CALENDAR).days);
  assert.equal(saved.campaigns['halloween-2026'].status, 'draft');
  assert.equal(saved.drafts['2026-10-25'].themeId, 'cider');
  assert.equal(JSON.parse(logs[0]).mode, 'drafts');
  assert.equal(JSON.parse(logs[1]).mode, 'publish');
});

test('feeds keep actual and draft glass selections separate with stable all-day identifiers', () => {
  const plan = copy(); plan.drafts['2026-10-25'].themeId = 'cider';
  const actual = events(createCalendarFeed({...options, plan}));
  const drafts = events(createCalendarFeed({...options, plan, includeDrafts:true}));
  assert.equal(actual.length, 7); assert.equal(drafts.length, 8);
  assert.ok(actual.every(event => event.includes('STATUS:CONFIRMED')));
  assert.ok(drafts.every(event => event.includes('STATUS:TENTATIVE')));
  assert.match(actual[0], /UID:split-2026-10-25@dailysplit.us/);
  assert.match(drafts[0], /UID:split-2026-10-25@dailysplit.us/);
  assert.match(actual[0], /Automatic rotation/);
  assert.match(drafts[0], /Draft lineup/);
  assert.match(actual[0], /DTSTART;VALUE=DATE:20261025\r\nDTEND;VALUE=DATE:20261026/);
  assert.match(actual[0], /URL:https:\/\/dailysplit.us\/#day17/);
  assert.match(drafts.at(-1), /DTSTART;VALUE=DATE:20261025\r\nDTEND;VALUE=DATE:20261101/);
  assert.match(drafts.at(-1), /UID:split-campaign-halloween-2026@dailysplit.us/);
  assert.match(drafts[0], /SEQUENCE:1/);
  const requested = [];
  createCalendarFeed({...options, plan, includeDrafts:true, resolveTheme:(date,id) => {requested.push([date,id]); return theme(date,id);}});
  assert.deepEqual(requested[0], ['2026-10-25','cider']);
  assert.throws(() => createCalendarFeed({...options, plan, includeDrafts:true, resolveTheme:() => theme('2026-10-25')}), /requested glass/);
});

test('iCalendar text is escaped and folds UTF-8 without splitting characters', () => {
  const plan = copy(), notes = 'Café 🍺, friends; tales\\stories\n' + '雪'.repeat(110);
  plan.drafts['2026-10-25'].notes = notes;
  const feed = createCalendarFeed({...options, plan, includeDrafts:true});
  assert.equal(feed.replace(/\r\n/g, '').includes('\n'), false, 'only CRLF line endings');
  for (const line of feed.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75, line);
  assert.ok(Buffer.from(feed, 'utf8').toString('utf8') === feed, 'UTF-8 survives a round trip');
  assert.ok(unfolded(feed).includes('Café 🍺\\, friends\\; tales\\\\stories\\n' + '雪'.repeat(110)));
});

test('static builds emit both 90-day feeds without editing the source plan', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'split-calendar-'));
  const before = JSON.stringify(CALENDAR);
  try {
    const result = await buildCalendarFeeds(directory, {now:NOW});
    assert.equal(result.startDate, '2026-10-09'); assert.equal(result.endDate, '2027-01-06');
    assert.deepEqual((await readdir(directory)).sort(), ['calendar-planning.ics','calendar.ics']);
    assert.equal(events(await readFile(result.published, 'utf8')).length, 90);
    assert.equal(events(await readFile(result.planning, 'utf8')).length, 91);
    assert.equal(JSON.stringify(CALENDAR), before);
    const later = await buildCalendarFeeds(directory, {now:'2026-11-01T00:00:00Z'});
    assert.equal(later.startDate, '2026-10-25');
  } finally {await rm(directory, {recursive:true, force:true});}
});
