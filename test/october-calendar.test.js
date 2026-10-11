import test from 'node:test';
import assert from 'node:assert/strict';
import {CALENDAR, CALENDAR_THEME_IDS, ROTATION_IDS} from '../site/js/calendar-data.js';
import {CALENDAR_THEMES, dayParams, themeById, secondsToMark, DRAIN_LEVEL} from '../site/js/core.js';
import {HALLOWEEN_THEME_IDS} from '../site/js/halloween-themes.js';
import {canRecordChallenge, resolveChallenge} from '../site/js/challenge.js';
import {addDateDays, createCalendarFeed, getCalendarAttribution, keyToDayNumber, validateCalendarPlan} from '../site/js/content-calendar.js';
import {contentReadiness} from '../site/js/content-readiness.js';
import {checkCalendarContent} from '../scripts/check-calendar-content.js';
import {serializeCalendarPlan} from '../scripts/content-calendar.js';

test('every remaining October date has approved artwork, a reachable pour, and an official daily challenge', async () => {
  assert.doesNotThrow(() => validateCalendarPlan(CALENDAR, {now:'2026-10-11T18:18:55Z'}));
  await checkCalendarContent(CALENDAR);
  for (let date = '2026-10-15'; date <= '2026-10-31'; date = addDateDays(date, 1)) {
    const entry = CALENDAR.days[date], P = dayParams(keyToDayNumber(date));
    assert.ok(entry, date + ': missing assignment');
    assert.equal(contentReadiness(entry).ready, true, date);
    assert.equal(P.theme.id, entry.themeId, date + ': calendar/game mismatch');
    assert.ok(CALENDAR_THEMES.includes(P.theme), date + ': missing planning choice');
    assert.ok(P.markY + P.markH / 2 < DRAIN_LEVEL, date + ': mark cannot be reached');
    assert.ok(secondsToMark(P) < 15, date + ': pour cannot reach the target');
    const [year, month, day] = date.split('-').map(Number), now = new Date(year, month - 1, day, 12);
    const challenge = resolveChallenge({now, search:'?day=' + date, launchReady:true});
    assert.equal(challenge.kind, 'today');
    assert.equal(canRecordChallenge({...challenge, now, launchReady:true}), true, date + ': scheduled review theme cannot save a daily result');
    const attribution = getCalendarAttribution(date, P.theme);
    assert.equal(attribution.campaign_id, entry.campaignId);
    assert.equal(attribution.scene, P.theme.scene);
    assert.equal(attribution.visual_theme, P.theme.scene);
  }
});

test('Halloween fills its exact Sunday–Saturday week and Guinness returns every three or four days', () => {
  assert.deepEqual(Array.from({length:7}, (_, index) => CALENDAR.days['2026-10-' + (25 + index)].themeId), HALLOWEEN_THEME_IDS);
  const guinness = Object.entries(CALENDAR.days).filter(([date, entry]) => date >= '2026-10-15' && themeById(entry.themeId).name === 'Guinness').map(([date]) => keyToDayNumber(date));
  assert.equal(guinness.length, 6);
  for (let index = 1; index < guinness.length; index++) assert.ok([3, 4].includes(guinness[index] - guinness[index - 1]));
  assert.equal(themeById(CALENDAR.days['2026-10-31'].themeId).name, 'Guinness');
  assert.ok(Object.values(CALENDAR.days).every(entry => !/chicago|sam-adams|apres-ski/.test(entry.themeId)), 'seasonally misplaced event scene was assigned');
});

test('calendar catalog survives CLI serialization without changing fallbacks or approving unused previews', async () => {
  assert.deepEqual(new Set(CALENDAR_THEMES.map(theme => theme.id)), new Set(CALENDAR_THEME_IDS));
  const serialized = serializeCalendarPlan(CALENDAR);
  const roundTrip = await import('data:text/javascript,' + encodeURIComponent(serialized));
  assert.deepEqual(roundTrip.CALENDAR_THEME_IDS, CALENDAR_THEME_IDS);
  assert.deepEqual(roundTrip.ROTATION_IDS, ROTATION_IDS);
  assert.deepEqual(roundTrip.CALENDAR, CALENDAR);
  for (const id of ['guinness-chicago', 'autumn-guinness-new-york', 'autumn-coors-apres-ski']) {
    assert.equal(CALENDAR_THEME_IDS.includes(id), false);
    assert.equal(contentReadiness({themeId:id, campaignId:'none'}).ready, false);
  }
  assert.equal(contentReadiness({themeId:'autumn-pub', campaignId:'halloween-2026'}).ready, false, 'a built autumn pint cannot substitute for reviewed Halloween art');
});

test('both subscription feeds confirm October assignments and keep November tentative', () => {
  for (const includeDrafts of [false, true]) {
    const feed = createCalendarFeed({startDate:'2026-10-15', endDate:'2026-11-01', includeDrafts,
      resolveTheme:(date, id) => id ? themeById(id) : dayParams(keyToDayNumber(date)).theme, now:'2026-10-11T18:18:55Z'}).replace(/\r\n[ \t]/g, '');
    const events = feed.split('BEGIN:VEVENT\r\n').slice(1);
    assert.equal(events.length, 18);
    assert.ok(events.slice(0, 17).every(event => event.includes('STATUS:CONFIRMED')));
    assert.match(events[10], /Pumpkin ale/);
    assert.match(events[16], /Last orders/);
    assert.match(events[17], /STATUS:TENTATIVE/);
    assert.match(events[17], /Unplanned fallback/);
  }
});
