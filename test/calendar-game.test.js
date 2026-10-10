import {getCalendarAttribution} from '../site/js/content-calendar.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {CALENDAR, LEGACY_ROTATION_IDS, ROTATION_IDS} from '../site/js/calendar-data.js';
import {THEMES, dayParams, themeForDay, keyForDay} from '../site/js/core.js';
import {futureCalendar} from './fixtures/calendar-plans.js';

// Captured before catalog cleanup: released Day 1 and the five frozen opening pours.
const RELEASED = [
  {
    "num": 1,
    "key": "2026-10-09",
    "theme": "pub",
    "markY": 0.6336473895981908,
    "markH": 0.10183376568136737,
    "K": 0.16028254496864974,
    "wobble": 0,
    "choppy": false
  },
  {
    "num": 2,
    "key": "2026-10-10",
    "theme": "peroni",
    "markY": 0.5663179596420377,
    "markH": 0.12,
    "K": 0.1561537075182423,
    "wobble": 0,
    "choppy": false
  },
  {
    "num": 3,
    "key": "2026-10-11",
    "theme": "sapporo",
    "markY": 0.5226813578151632,
    "markH": 0.12,
    "K": 0.1159373656474054,
    "wobble": 0,
    "choppy": false
  },
  {
    "num": 4,
    "key": "2026-10-12",
    "theme": "munich",
    "markY": 0.5053066613525152,
    "markH": 0.19762092594988645,
    "K": 0.13169651078991593,
    "wobble": 0,
    "choppy": false
  },
  {
    "num": 5,
    "key": "2026-10-13",
    "theme": "butterbeer",
    "markY": 0.5629532196151558,
    "markH": 0.135,
    "K": 0.12857423663139345,
    "wobble": 0,
    "choppy": false
  },
  {
    "num": 6,
    "key": "2026-10-14",
    "theme": "beach",
    "markY": 0.5980367915751412,
    "markH": 0.08945404598489404,
    "K": 0.1268917262274772,
    "wobble": 0,
    "choppy": false
  },

];

function snapshot(n, calendar){
  const p = dayParams(n, calendar);
  return {num:n, key:p.key, theme:p.theme.id, markY:p.markY, markH:p.markH, K:p.K, wobble:p.wobble, choppy:p.choppy};
}

test('catalog cleanup retains all six opening glasses, marks and flow seeds', () => {
  assert.deepEqual(RELEASED.map(p => snapshot(p.num)), RELEASED);
});

test('adding a holiday glass cannot reroll the existing automatic calendar', () => {
  const future = {...THEMES[0], id:'future-halloween-pint', glassId:'pub', visualTheme:'halloween-pub'};
  const futureDays = [7, 8, 15, 30, 64, 366, 1000], before = futureDays.map(n => snapshot(n));
  THEMES.push(future);
  try {
    assert.deepEqual(RELEASED.map(p => snapshot(p.num)), RELEASED);
    assert.deepEqual(futureDays.map(n => snapshot(n)), before);
    assert.equal(ROTATION_IDS.includes(future.id), false);
    assert.equal(LEGACY_ROTATION_IDS.includes(future.id), false);
    const date = keyForDay(30), plan = {...CALENDAR, days:{...CALENDAR.days, [date]:{themeId:future.id, campaignId:'none'}}};
    assert.equal(themeForDay(30, plan).id, future.id);
    assert.deepEqual(snapshot(31, plan), snapshot(31));
  } finally { THEMES.pop(); }
});

test('a published date pin changes that date while drafts leave live play alone', () => {
  const n = 22, date = keyForDay(n), before = themeForDay(n);
  const chosen = before.id === 'pub' ? 'beach' : 'pub';
  const draft = {...futureCalendar(), drafts:{[date]:{themeId:chosen, campaignId:'halloween-2026', notes:'A possible holiday glass'}}};
  assert.deepEqual(snapshot(n, draft), snapshot(n));
  assert.equal(getCalendarAttribution(date, themeForDay(n, draft), draft).campaign_id, 'none');
  const published = {...draft, days:{...CALENDAR.days, [date]:{themeId:chosen, campaignId:'halloween-2026'}}, campaigns:{...draft.campaigns, 'halloween-2026':{...draft.campaigns['halloween-2026'], status:'published'}}};
  assert.equal(themeForDay(n, published).id, chosen);
  assert.equal(getCalendarAttribution(date, themeForDay(n, published), published).campaign_id, 'halloween-2026');
  for (const neighbor of [n - 1, n + 1, n + 2]) assert.deepEqual(snapshot(neighbor, published), snapshot(neighbor));
});

test('future automatic dates use only the six developed glasses', () => {
  const built = ['pub', 'beach', 'munich', 'sapporo', 'butterbeer', 'peroni'];
  assert.deepEqual(ROTATION_IDS, built);
  assert.deepEqual(THEMES.map(theme => theme.id), built);
  assert.ok(Object.isFrozen(ROTATION_IDS));
  for (let n = 7; n <= 400; n++) {
    const theme = themeForDay(n);
    assert.ok(built.includes(theme.id), keyForDay(n) + ': unfinished glass in automatic rotation');
    assert.notEqual(theme.id, themeForDay(n - 1).id, keyForDay(n) + ': repeated glass');
  }
  for (const n of [1000, 9999]) assert.ok(built.includes(themeForDay(n).id));
  assert.deepEqual(CALENDAR.drafts, {});
  assert.deepEqual(Object.keys(CALENDAR.campaigns), ['opening-2026']);
});
