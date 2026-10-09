import {getCalendarAttribution} from '../site/js/content-calendar.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {CALENDAR, LEGACY_ROTATION_IDS} from '../site/js/calendar-data.js';
import {THEMES, dayParams, themeForDay, keyForDay} from '../site/js/core.js';

// Captured from the released game before calendar integration.
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
    "num": 6,
    "key": "2026-10-14",
    "theme": "beach",
    "markY": 0.5980367915751412,
    "markH": 0.08945404598489404,
    "K": 0.1268917262274772,
    "wobble": 0,
    "choppy": false
  },
  {
    "num": 7,
    "key": "2026-10-15",
    "theme": "matcha",
    "markY": 0.4737578340712935,
    "markH": 0.1222100926283747,
    "K": 0.13089448445942253,
    "wobble": 0.8611041117925197,
    "choppy": true
  },
  {
    "num": 8,
    "key": "2026-10-16",
    "theme": "cola",
    "markY": 0.6076752865593881,
    "markH": 0.1016794997267425,
    "K": 0.1179448270983994,
    "wobble": 0,
    "choppy": false
  },
  {
    "num": 15,
    "key": "2026-10-23",
    "theme": "pale",
    "markY": 0.6422719722986221,
    "markH": 0.13122361313551667,
    "K": 0.14497380350250752,
    "wobble": 0,
    "choppy": false
  },
  {
    "num": 30,
    "key": "2026-11-07",
    "theme": "pub",
    "markY": 0.5178083018213511,
    "markH": 0.10833298539277167,
    "K": 0.13373258777894081,
    "wobble": 0,
    "choppy": false
  },
  {
    "num": 64,
    "key": "2026-12-11",
    "theme": "coffee",
    "markY": 0.5242640510573984,
    "markH": 0.1273277011793107,
    "K": 0.1336961137596518,
    "wobble": 0,
    "choppy": false
  },
  {
    "num": 366,
    "key": "2027-10-09",
    "theme": "beach",
    "markY": 0.5310160180367529,
    "markH": 0.07101218053139746,
    "K": 0.1270150105142966,
    "wobble": 0,
    "choppy": false
  },
  {
    "num": 1000,
    "key": "2029-07-04",
    "theme": "cola",
    "markY": 0.6017959657497705,
    "markH": 0.11131807585246861,
    "K": 0.14523167226463557,
    "wobble": 0,
    "choppy": false
  }
];

function snapshot(n, calendar){
  const p = dayParams(n, calendar);
  return {num:n, key:p.key, theme:p.theme.id, markY:p.markY, markH:p.markH, K:p.K, wobble:p.wobble, choppy:p.choppy};
}

test('calendar integration retains released glasses, marks and flow seeds', () => {
  assert.deepEqual(RELEASED.map(p => snapshot(p.num)), RELEASED);
});

test('adding a holiday glass cannot reroll the existing automatic calendar', () => {
  const future = {...THEMES[0], id:'future-halloween-pint', glassId:'pub', visualTheme:'halloween-pub'};
  THEMES.push(future);
  try {
    assert.deepEqual(RELEASED.map(p => snapshot(p.num)), RELEASED);
    assert.equal(LEGACY_ROTATION_IDS.includes(future.id), false);
    const date = keyForDay(30), plan = {...CALENDAR, days:{...CALENDAR.days, [date]:{themeId:future.id, campaignId:'none'}}};
    assert.equal(themeForDay(30, plan).id, future.id);
    assert.deepEqual(snapshot(31, plan), snapshot(31));
  } finally { THEMES.pop(); }
});

test('a published date pin changes that date while drafts leave live play alone', () => {
  const n = 22, date = keyForDay(n), before = themeForDay(n);
  const chosen = before.id === 'pub' ? 'beach' : 'pub';
  const draft = {...CALENDAR, drafts:{[date]:{themeId:chosen, campaignId:'halloween-2026', notes:'A possible holiday glass'}}};
  assert.deepEqual(snapshot(n, draft), snapshot(n));
  assert.equal(getCalendarAttribution(date, themeForDay(n, draft), draft).campaign_id, 'none');
  const published = {...draft, days:{...CALENDAR.days, [date]:{themeId:chosen, campaignId:'halloween-2026'}}, campaigns:{...CALENDAR.campaigns, 'halloween-2026':{...CALENDAR.campaigns['halloween-2026'], status:'published'}}};
  assert.equal(themeForDay(n, published).id, chosen);
  assert.equal(getCalendarAttribution(date, themeForDay(n, published), published).campaign_id, 'halloween-2026');
  for (const neighbor of [n - 1, n + 1, n + 2]) assert.deepEqual(snapshot(neighbor, published), snapshot(neighbor));
});
