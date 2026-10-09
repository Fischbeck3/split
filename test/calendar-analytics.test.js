import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ANALYTICS_DASHBOARD_URL, THEME_ANALYTICS_URL, CALENDAR_ANALYTICS_INSIGHTS,
  LEGACY_GLASS_ATTRIBUTION, analyticsQueryForDate, analyticsUrlForDate} from '../site/js/calendar-analytics.js';

test('saved calendar tables use the shared, bounded native query definitions', () => {
  const plan = JSON.parse(readFileSync(new URL('../scripts/calendar-analytics-insights.json', import.meta.url), 'utf8'));
  assert.equal(plan.timezone, 'UTC');
  assert.equal(plan.projectId, 655684);
  assert.deepEqual(plan.insights, CALENDAR_ANALYTICS_INSIGHTS);
  assert.equal(plan.insights.length, 4);
  assert.equal(new Set(plan.insights.flatMap(insight => insight.tags)).size, 4);
  for (const insight of plan.insights){
    assert.ok(insight.description.length <= 400);
    assert.equal(insight.query.kind, 'DataVisualizationNode');
    assert.equal(insight.query.display, 'ActionsTable');
    assert.equal(insight.query.source.kind, 'HogQLQuery');
    assert.deepEqual(insight.query.source.filters.dateRange, {date_from:'-90d', date_to:null});
    assert.equal(insight.query.source.query.match(/\bFROM events\b/g).length, 1, 'scan each bounded event range once');
    assert.equal(insight.query.source.query.match(/\{filters\}/g).length, 1);
    assert.ok(!/\b(?:JOIN|UNION)\b/.test(insight.query.source.query));
    const rate = insight.query.tableSettings.columns.find(column => column.column === 'share_rate');
    assert.deepEqual(rate.settings.formatting, {style:'percent', decimalPlaces:1});
  }
});

test('date links encode an exact challenge filter in a native query and reject invalid dates', () => {
  assert.match(ANALYTICS_DASHBOARD_URL, /^https:\/\/us\.posthog\.com\/project\/655684\/dashboard\/2191648$/);
  assert.ok(THEME_ANALYTICS_URL.startsWith('https://us.posthog.com/project/655684/dashboard/'));
  const url = new URL(analyticsUrlForDate('2028-02-29'));
  assert.equal(url.pathname, '/project/655684/insights/new');
  assert.equal(url.search, '', 'do not invent dashboard query parameters');
  const query = JSON.parse(decodeURIComponent(url.hash.slice(3)));
  assert.deepEqual(query, analyticsQueryForDate('2028-02-29'));
  assert.equal(query.kind, 'DataVisualizationNode');
  assert.equal(query.source.query, CALENDAR_ANALYTICS_INSIGHTS[0].query.source.query);
  assert.deepEqual(query.source.filters.properties, [{type:'event', key:'challenge_date', operator:'exact', value:['2028-02-29']}]);
  assert.deepEqual(query.source.filters.dateRange, {date_from:'2028-02-28T00:00:00.000Z', date_to:'2028-03-02T00:00:00.000Z'});
  assert.deepEqual(CALENDAR_ANALYTICS_INSIGHTS[0].query.source.filters, {dateRange:{date_from:'-90d', date_to:null}}, 'building a link leaves saved definitions intact');
  for (const value of [null, undefined, '', '2026-02-29', '2026-10-32', '2026-1-09', "2026-10-09' OR 1=1", '2026-10-09#q=bad']){
    assert.equal(analyticsQueryForDate(value), null);
    assert.equal(analyticsUrlForDate(value), THEME_ANALYTICS_URL);
  }
});

const properties = ['challenge_date', 'local_play_date', 'theme', 'glass_id', 'vessel', 'scene', 'visual_theme',
  'campaign_id', 'campaign_day', 'schedule_version', 'attempt_kind', 'counts', 'new_record'];
const fixedNow = '2026-10-11T18:00:00.000Z';
const iso = value => new Date(value).toISOString();

async function fixtureDatabase(t){
  let DatabaseSync;
  try { ({DatabaseSync} = await import('node:sqlite')); } catch { t.skip('SQL fixture requires Node 22.16+; the game supports Node 20.'); return null; }
  if (!DatabaseSync?.prototype.aggregate){ t.skip('SQL fixture requires Node 22.16+.'); return null; }
  const db = new DatabaseSync(':memory:');
  db.aggregate('countIf', {start:0, step:(count, condition) => count + (condition ? 1 : 0), result:count => count});
  db.aggregate('minIf', {start:()=>null, step:(minimum, value, condition) => condition && (minimum === null || value < minimum) ? value : minimum, result:value => value});
  db.aggregate('argMinIf', {
    start:()=>({value:null, at:null}),
    step:(state, value, at, condition) => condition && (state.at === null || at < state.at) ? {value, at} : state,
    result:state => state.value
  });
  db.aggregate('groupArrayIf', {start:()=>[], step:(values, value, condition) => {if (condition) values.push(value); return values;}, result:values => JSON.stringify(values)});
  db.function('addHours', (at, hours) => at === null ? null : new Date(new Date(at).getTime() + hours * 3600000).toISOString());
  db.function('now', () => fixedNow);
  db.function('toString', value => value === null ? null : String(value));
  db.function('toDate', value => value === null ? null : iso(value).slice(0, 10));
  db.function('toInt', value => value === null ? null : Math.trunc(Number(value)));
  db.exec(`CREATE TABLE events (timestamp TEXT, event TEXT, distinct_id TEXT, ${properties.map(name => `${name} ${['counts','new_record','campaign_day','schedule_version'].includes(name) ? 'INTEGER' : 'TEXT'}`).join(', ')})`);
  const statement = db.prepare(`INSERT INTO events VALUES (${Array(3 + properties.length).fill('?').join(', ')})`);
  return {db, insert({event, browser, at, date = '2026-10-09', ...values}){
    const props = {challenge_date:date, local_play_date:date, theme:'pub', attempt_kind:'daily', counts:1,
      new_record:event === 'sip_completed' ? 1 : null, ...values};
    // The live project resolves these properties as DateTime values at UTC
    // midnight, even though the browser originally emits YYYY-MM-DD strings.
    for (const name of ['challenge_date', 'local_play_date']) if (props[name] !== null) props[name] = iso(props[name]);
    statement.run(iso(at), event, browser, ...properties.map(name => props[name] ?? null));
  }};
}

function sqliteQuery(node){
  const source = node.source;
  const range = source.filters.dateRange;
  const from = range.date_from === '-90d' ? new Date(new Date(fixedNow).getTime() - 90 * 86400000).toISOString() : range.date_from;
  const to = range.date_to || fixedNow;
  let filters = `timestamp >= '${from}' AND timestamp < '${to}'`;
  for (const property of source.filters.properties || []){
    assert.equal(property.type, 'event'); assert.equal(property.key, 'challenge_date'); assert.equal(property.operator, 'exact');
    assert.ok(property.value.every(value => /^\d{4}-\d{2}-\d{2}$/.test(value)));
    // Exact YYYY-MM-DD literals resolve to midnight for live DateTime fields.
    filters += ` AND toDate(challenge_date) IN (${property.value.map(value => `'${value}'`).join(', ')})`;
  }
  // Translate only storage syntax and array/lambda syntax. SQLite evaluates the
  // actual saved predicate (including its order and window comparisons), first
  // completion attribution, grouping and ratios rather than a JS metric clone.
  let sql = source.query.replace('{filters}', filters).replace(/properties\.(\w+)/g, '$1');
  const lambda = /arrayExists\(shared_at -> ([\s\S]*?), successful_share_times\)/;
  assert.ok(lambda.test(sql), 'the conversion predicate remains part of the tested query');
  sql = sql.replace(lambda, (_, predicate) => `(SELECT EXISTS(SELECT 1 FROM json_each(successful_share_times) WHERE ${predicate.replace(/\bshared_at\b/g, 'json_each.value')}))`);
  return sql;
}
const run = (db, node) => db.prepare(sqliteQuery(node)).all().map(row => ({...row}));

test('actual SQL deduplicates browser challenges, unions successful shares, excludes old-day and uncounted sips, and weights rates', async t => {
  const fixture = await fixtureDatabase(t); if (!fixture) return;
  const {db, insert} = fixture;
  const modern = {glass_id:'pub', vessel:'tulip', scene:'pub', visual_theme:'default', campaign_id:'none', campaign_day:0, schedule_version:1};
  try {
    const complete = (browser, at, values = {}) => insert({event:'sip_completed', browser, at, ...modern, ...values});
    const share = (browser, at, values = {}) => insert({event:'result_copied', browser, at, ...modern, ...values});
    complete('a', '2026-10-09T12:00Z');
    for (const event of ['result_copied', 'result_shared', 'result_copied']) share('a', '2026-10-09T12:05Z', {event});
    // An early share and a later copy from another local day never convert b.
    share('b', '2026-10-09T11:00Z'); complete('b', '2026-10-09T12:00Z');
    share('b', '2026-10-10T00:05Z', {local_play_date:'2026-10-10'});
    // Orphan shares and completion events that aren't eligible add no cohort.
    share('orphan', '2026-10-09T12:05Z');
    for (const [browser, values] of [['practice',{attempt_kind:'practice'}], ['archive',{attempt_kind:'archive'}], ['preview',{attempt_kind:'preview'}], ['uncounted',{counts:0}], ['restored',{new_record:0}]]){
      complete(browser, '2026-10-09T12:00Z', values); share(browser, '2026-10-09T12:05Z', values);
    }
    // Attribution stays on the first completion, despite later altered metadata.
    insert({event:'sip_completed', browser:'legacy', at:'2026-10-09T10:00Z'});
    complete('legacy', '2026-10-09T11:00Z', {glass_id:'changed', visual_theme:'changed', campaign_id:'changed'});
    share('legacy', '2026-10-09T10:05Z', {glass_id:'changed', visual_theme:'changed', campaign_id:'changed'});
    complete('endpoint', '2026-10-09T00:00Z'); share('endpoint', '2026-10-10T00:00Z');
    complete('expired', '2026-10-09T01:00Z'); share('expired', '2026-10-10T01:00:01Z');
    // UTC midnight is allowed when both events concern the same local challenge.
    complete('utc-midnight', '2026-10-09T23:50Z'); share('utc-midnight', '2026-10-10T00:05Z');
    // The same browser contributes separately on a second challenge date.
    complete('a', '2026-10-10T14:00Z', {date:'2026-10-10'}); share('a', '2026-10-10T14:05Z', {date:'2026-10-10'});
    complete('m', '2026-10-10T19:00Z', {date:'2026-10-10'});
    // A named holiday theme can reuse the same base glass.
    const holiday = {date:'2026-10-11', visual_theme:'halloween', campaign_id:'halloween-2026', campaign_day:1, schedule_version:2};
    complete('h', '2026-10-11T12:00Z', holiday); share('h', '2026-10-11T12:05Z', holiday);

    const tables = CALENDAR_ANALYTICS_INSIGHTS.map(insight => run(db, insight.query));
    const day9 = tables[0].filter(row => row.challenge_date === '2026-10-09');
    assert.equal(day9.reduce((sum, row) => sum + row.finishers, 0), 6);
    assert.equal(day9.reduce((sum, row) => sum + row.converters, 0), 4);
    assert.ok(day9.every(row => row.partial_finishers === 0 && row.window_hours === 24));
    assert.equal(day9.find(row => row.visual_theme === 'default').schedule_version, '1', 'numeric schedule versions become a concrete string dimension');
    assert.equal(tables[0].find(row => row.visual_theme === 'Unknown').campaign_id, 'none');
    const glass = tables[1].find(row => row.glass_id === 'pub');
    assert.equal(glass.finishers, 9); assert.equal(glass.converters, 6);
    assert.equal(glass.share_rate, 6 / 9, 'weight browser-challenge finishers rather than averaging daily rates');
    assert.equal(glass.partial_finishers, 2);
    assert.equal(tables[1].length, 1, 'share metadata cannot create extra glass groups');
    const theme = Object.fromEntries(tables[2].map(row => [row.visual_theme, row]));
    assert.equal(theme.default.finishers, 7); assert.equal(theme.default.converters, 4);
    assert.equal(theme.Unknown.finishers, 1); assert.equal(theme.Unknown.converters, 1);
    assert.equal(theme.halloween.finishers, 1); assert.equal(theme.halloween.converters, 1);
    const campaigns = Object.fromEntries(tables[3].map(row => [row.campaign_id, row]));
    assert.equal(campaigns.none.finishers, 8); assert.equal(campaigns.none.converters, 5);
    assert.equal(campaigns['halloween-2026'].finishers, 1); assert.equal(campaigns['halloween-2026'].converters, 1);
    assert.ok(tables.flat().every(row => row.converters <= row.finishers && row.share_rate <= 1));

    const selected = run(db, analyticsQueryForDate('2026-10-09'));
    assert.ok(selected.every(row => row.challenge_date === '2026-10-09'));
    assert.equal(selected.reduce((sum, row) => sum + row.finishers, 0), 6);
    assert.equal(selected.reduce((sum, row) => sum + row.converters, 0), 4);
  } finally { db.close(); }
});

test('legacy mapping only fills known glass/vessel/scene and never invents campaigns or visual themes', async t => {
  const fixture = await fixtureDatabase(t); if (!fixture) return;
  const {db, insert} = fixture;
  try {
    for (const theme of Object.keys(LEGACY_GLASS_ATTRIBUTION)) insert({event:'sip_completed', browser:theme, at:'2026-10-09T12:00Z', theme});
    insert({event:'sip_completed', browser:'unknown', at:'2026-10-09T12:00Z', theme:'unreleased'});
    insert({event:'sip_completed', browser:'explicit', at:'2026-10-09T12:00Z', theme:'pub', glass_id:'new-glass', vessel:'bottle', scene:'new-scene', visual_theme:'new-art', campaign_id:'new-campaign', campaign_day:7, schedule_version:2});
    const rows = run(db, CALENDAR_ANALYTICS_INSIGHTS[0].query);
    for (const [id, expected] of Object.entries(LEGACY_GLASS_ATTRIBUTION)){
      const row = rows.find(row => row.glass_id === id);
      assert.equal(row.vessel, expected.vessel); assert.equal(row.scene, expected.scene);
      assert.equal(row.visual_theme, 'Unknown'); assert.equal(row.campaign_id, 'none'); assert.equal(row.campaign_day, 0);
      assert.equal(row.schedule_version, 'Unknown');
    }
    const unknown = rows.find(row => row.theme === 'unreleased');
    assert.equal(unknown.glass_id, 'Unknown'); assert.equal(unknown.vessel, 'Unknown'); assert.equal(unknown.scene, 'Unknown');
    const explicit = rows.find(row => row.glass_id === 'new-glass');
    assert.equal(explicit.vessel, 'bottle'); assert.equal(explicit.scene, 'new-scene');
    assert.equal(explicit.visual_theme, 'new-art'); assert.equal(explicit.campaign_id, 'new-campaign'); assert.equal(explicit.campaign_day, 7); assert.equal(explicit.schedule_version, '2');
    assert.ok(rows.every(row => row.converters === 0 && row.share_rate === 0));
  } finally { db.close(); }
});
