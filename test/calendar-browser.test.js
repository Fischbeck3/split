import test from 'node:test';
import assert from 'node:assert/strict';
import {validateBrowserPlan} from '../site/js/calendar.js';
import {futureCalendar} from './fixtures/calendar-plans.js';

const CALENDAR = futureCalendar();

const NOW = new Date('2026-10-09T20:30:00Z');
const copy = () => structuredClone(CALENDAR);
const validate = plan => validateBrowserPlan(plan, {baseline:CALENDAR, now:NOW});
const standalone = {themeId:'pub', campaignId:'none', notes:'An evening at the pub.'};

test('browser plans validate without DOM or storage and preserve the input baseline', () => {
  assert.equal(typeof window, 'undefined');
  assert.equal(typeof document, 'undefined');
  const plan = copy(), before = structuredClone(plan);
  plan.drafts['2026-11-01'] = {...standalone};
  const proposal = validate(plan);
  assert.deepEqual(proposal.days, before.days);
  assert.deepEqual(proposal.drafts['2026-11-01'], standalone);
  assert.deepEqual(plan.drafts['2026-11-01'], standalone);
  proposal.drafts['2026-11-01'].notes = 'Changed returned value';
  assert.equal(plan.drafts['2026-11-01'].notes, standalone.notes, 'validation returns a detached plan');
  assert.deepEqual(CALENDAR, before, 'validation does not change the source calendar');
});

test('browser import cannot add, remove, or replace any published date, even a future one', () => {
  for (const change of [
    plan => {plan.days['2026-11-01'] = {themeId:'pub', campaignId:'none'};},
    plan => {delete plan.days['2026-10-14'];},
    plan => {plan.days['2026-10-14'] = {themeId:'beach', campaignId:'none'};}
  ]) {
    const plan = copy(); change(plan);
    assert.throws(() => validate(plan), /published lineup|opening glass fixed/);
  }
});

test('browser import preserves published runs and cannot promote or create one', () => {
  const edited = copy(); edited.campaigns['opening-2026'].name = 'Rewritten opening';
  assert.throws(() => validate(edited), /served campaign/);
  const promoted = copy(); promoted.campaigns['halloween-2026'].status = 'published';
  assert.throws(() => validate(promoted), /Campaign content is not built and approved/);
  const created = copy(); created.campaigns['winter-2026'] = {
    name:'Winter week', startDate:'2026-12-01', endDate:'2026-12-07', status:'published', notes:''
  };
  assert.throws(() => validate(created), /Campaign content is not built and approved/);
});

test('draft editing locks as soon as the date is live in UTC+14', () => {
  const plan = copy(); plan.drafts['2026-10-10'] = {...standalone};
  assert.ok(validateBrowserPlan(plan, {baseline:CALENDAR, now:new Date('2026-10-09T09:59:59Z')}));
  assert.throws(() => validateBrowserPlan(plan, {baseline:CALENDAR, now:new Date('2026-10-09T10:00:00Z')}), /globally live date, 2026-10-10/);
  const run = copy(); run.campaigns['started-run'] = {
    name:'Already started', startDate:'2026-10-15', endDate:'2026-10-17', status:'draft', notes:''
  };
  assert.throws(() => validateBrowserPlan(run, {baseline:CALENDAR, now:new Date('2026-10-14T10:00:00Z')}), /New runs must start after/);
});

test('source drafts remain readable after their live boundary, but cannot be edited or removed', () => {
  const now = new Date('2026-10-24T10:00:00Z');
  assert.deepEqual(validateBrowserPlan(CALENDAR, {baseline:CALENDAR, now}), CALENDAR);
  const edited = copy(); edited.drafts['2026-10-25'].notes = 'Changed after opening';
  assert.throws(() => validateBrowserPlan(edited, {baseline:CALENDAR, now}), /globally live date/);
  const removed = copy(); delete removed.drafts['2026-10-25'];
  assert.throws(() => validateBrowserPlan(removed, {baseline:CALENDAR, now}), /globally live date/);
  const movedRun = copy(); movedRun.campaigns['halloween-2026'].notes = 'Changed run';
  assert.throws(() => validateBrowserPlan(movedRun, {baseline:CALENDAR, now}), /already live runs unchanged/);
});

test('future draft removal and standalone proposals need no campaign or publishing action', () => {
  const plan = copy(); delete plan.drafts['2026-10-25'];
  plan.drafts['2026-11-01'] = {...standalone};
  const result = validate(plan);
  assert.equal(Object.hasOwn(result.drafts, '2026-10-25'), false);
  assert.equal(result.drafts['2026-11-01'].campaignId, 'none');
  assert.deepEqual(result.days, CALENDAR.days);
  assert.equal(result.campaigns['halloween-2026'].status, 'draft');
});

test('browser imports reject overlapping runs, unknown IDs, coercible IDs, and invalid dates', () => {
  const overlap = copy(); overlap.campaigns['other-week'] = {
    name:'Other week', startDate:'2026-10-27', endDate:'2026-11-01', status:'draft', notes:''
  };
  assert.throws(() => validate(overlap), /overlap/);
  for (const entry of [
    {...standalone, themeId:'unapproved-glass'},
    {...standalone, campaignId:'unknown-run'},
    {...standalone, themeId:['pub']},
    {...standalone, campaignId:['none']}
  ]) {
    const plan = copy(); plan.drafts['2026-11-01'] = entry;
    assert.throws(() => validate(plan), /unknown theme|unknown campaign|invalid (theme|campaign) ID/);
  }
  const date = copy(); date.drafts['2026-11-31'] = {...standalone};
  assert.throws(() => validate(date), /Invalid or pre-launch calendar date/);
});

test('browser imports reject an export older than the current baseline', () => {
  const baseline = copy(); baseline.version = CALENDAR.version + 1;
  assert.throws(() => validateBrowserPlan(copy(), {baseline, now:NOW}), /version cannot go backwards/);
});

test('browser draft imports reject every retired prototype', () => {
  for (const id of ['lager', 'pale', 'cider', 'red', 'coffee', 'choc', 'matcha', 'cola']) {
    const plan = copy();
    plan.drafts['2026-11-01'] = {...standalone, themeId:id};
    assert.throws(() => validate(plan), /unknown theme/);
  }
});
