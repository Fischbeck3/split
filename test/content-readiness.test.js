import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readdir, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {CALENDAR} from '../site/js/calendar-data.js';
import {contentReadiness} from '../site/js/content-readiness.js';
import {createCalendarFeed, validateCalendarPlan} from '../site/js/content-calendar.js';
import {prepareCalendarChange, runCalendarCli} from '../scripts/content-calendar.js';
import {checkCalendarContent} from '../scripts/check-calendar-content.js';
import {buildCalendarFeeds} from '../scripts/build-calendar-feed.js';

const NOW = new Date('2026-10-09T20:30:00Z');

test('a catalog prototype cannot be scheduled or written by the publishing command', async () => {
  const plan = structuredClone(CALENDAR);
  plan.drafts['2026-11-01'] = {themeId:'cola', campaignId:'none', notes:'A proposal, not a finished theme.'};
  assert.equal(contentReadiness(plan.drafts['2026-11-01']).ready, false);
  assert.doesNotThrow(() => prepareCalendarChange(plan, {now:NOW}));
  let writes = 0;
  await assert.rejects(runCalendarCli(['--publish', 'plan.json', '--date', '2026-11-01'], {
    now:NOW, read:async () => JSON.stringify(plan), write:async () => writes++, log:() => {}
  }), /cannot schedule cola/);
  assert.equal(writes, 0);
});

test('reusing a built glass does not approve a holiday run', () => {
  const plan = structuredClone(CALENDAR);
  plan.drafts['2026-10-25'].themeId = 'pub';
  assert.match(contentReadiness(plan.drafts['2026-10-25']).label, /Needs campaign build & review/);
  assert.throws(() => prepareCalendarChange(plan, {now:NOW, publish:true, date:'2026-10-25'}), /themed run and its artwork have not been approved/);
  const emptyRun = structuredClone(CALENDAR);
  emptyRun.campaigns['halloween-2026'].status = 'published';
  assert.throws(() => validateCalendarPlan(emptyRun, {now:NOW}), /Campaign content is not built and approved/);
});

test('approved opening artwork is present; missing or changed artwork blocks release', async () => {
  await assert.doesNotReject(checkCalendarContent(CALENDAR));
  await assert.rejects(checkCalendarContent(CALENDAR, {read:async () => {throw new Error('ENOENT');}}), /missing scene artwork for pub/);
  await assert.rejects(checkCalendarContent(CALENDAR, {read:async () => Buffer.from('unreviewed replacement')}), /scene artwork changed since approval/);
});

test('editing published JSON directly cannot bypass validation, feeds, or the static build', async () => {
  const plan = structuredClone(CALENDAR);
  plan.days['2026-11-01'] = {themeId:'cola', campaignId:'none'};
  assert.throws(() => validateCalendarPlan(plan, {now:NOW}), /cannot schedule cola/);
  assert.throws(() => createCalendarFeed({plan, startDate:'2026-11-01', endDate:'2026-11-01',
    resolveTheme:() => ({id:'cola', name:'Cola'}), now:NOW}), /cannot schedule cola/);
  const directory = await mkdtemp(join(tmpdir(), 'split-unready-'));
  try {
    await assert.rejects(buildCalendarFeeds(directory, {plan, now:NOW}), /cannot schedule cola/);
    assert.deepEqual(await readdir(directory), [], 'no misleading feed is written');
  } finally {await rm(directory, {recursive:true, force:true});}
});
