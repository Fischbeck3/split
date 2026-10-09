import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadDashboard, provisionDashboard} from '../scripts/provision-posthog-dashboard.js';

const options = {projectId:'123', personalKey:'phx_test_personal_key'};

test('saved native insights match the connected PostHog query schemas', async () => {
  const plan = await loadDashboard();
  // The connected query-trends, query-funnel and query-retention schemas
  // require string values in exact-match arrays, even for boolean properties.
  // Funnel EventsNode has no dau aggregation; its default is a unique-actor
  // funnel. Retention identifies named events using a string id.
  const property = (filters, key, value) => filters.some(filter =>
    filter.type === 'event' && filter.key === key && filter.operator === 'exact' &&
    Array.isArray(filter.value) && filter.value.includes(value));
  function checkFilters(filters) {
    for (const filter of filters) {
      assert.equal(filter.type, 'event');
      assert.equal(filter.operator, 'exact');
      assert.equal(typeof filter.key, 'string');
      assert.ok(Array.isArray(filter.value));
      assert.ok(filter.value.length > 0);
      assert.ok(filter.value.every(value => typeof value === 'string'), filter.key);
    }
  }
  for (const insight of plan.insights) {
    assert.ok(insight.description.length <= 400, insight.name);
    const source = insight.query.source;
    if (source.kind === 'HogQLQuery') continue;
    assert.deepEqual(source.dateRange, {date_from:'-30d', date_to:null});
    checkFilters(source.properties || []);
    if (source.kind === 'RetentionQuery') {
      const retention = source.retentionFilter;
      assert.equal(retention.period, 'Day');
      assert.equal(retention.totalIntervals, 2);
      assert.equal(retention.timeWindowMode, 'strict_calendar_dates');
      assert.equal(retention.cumulative, false);
      assert.equal(retention.retentionType, 'retention_recurring');
      for (const entity of [retention.targetEntity, retention.returningEntity]) {
        assert.equal(entity.id, 'sip_started');
        assert.equal(entity.type, 'events');
        checkFilters(entity.properties);
        assert.ok(property(entity.properties, 'attempt_kind', 'daily'));
      }
      continue;
    }
    assert.ok(source.series.length > 0);
    for (const node of source.series) {
      assert.equal(node.kind, 'EventsNode');
      assert.equal(typeof node.event, 'string');
      checkFilters(node.properties);
      if (node.event !== 'game_opened') assert.ok(property(node.properties, 'attempt_kind', 'daily'));
      if (['sip_completed','result_shared','result_copied','postcard_save_attempted','postcard_saved','postcard_save_failed'].includes(node.event)) {
        assert.ok(property(node.properties, 'counts', 'true'), node.event);
      }
      if (source.kind === 'FunnelsQuery') {
        assert.ok(!Object.hasOwn(node, 'math'), 'native funnels count actors without a dau field');
        assert.ok(!Object.hasOwn(node, 'name'), 'funnel event names use event/custom_name');
        assert.ok(property(node.properties, 'friend_link', 'true'));
      } else {
        assert.equal(source.kind, 'TrendsQuery');
        assert.ok(['dau','total'].includes(node.math));
        assert.equal(source.interval, 'day');
        assert.deepEqual(source.trendsFilter, {display:'ActionsLineGraph', showLegend:true});
        assert.ok(!Object.hasOwn(source, 'version'), 'typed TrendsQuery has no version field');
      }
    }
    if (source.kind === 'FunnelsQuery') {
      assert.deepEqual(source.funnelsFilter, {
        funnelVizType:'steps', funnelOrderType:'ordered',
        funnelWindowInterval:1, funnelWindowIntervalUnit:'hour', layout:'vertical'
      });
    }
  }
});

function fakePostHog(){
  const records = {dashboards:[], insights:[]};
  const calls = [];
  let nextId = 1, failName = null;
  return {records, calls, fail(name){failName = name;}, fetchImpl:async (url, options) => {
    assert.equal(options.redirect, 'error');
    const path = new URL(url).pathname;
    const [,resource,id] = path.match(/^\/api\/projects\/123\/(dashboards|insights)\/(\d+)?\/?$/) || [];
    assert.ok(resource, path);
    const body = options.body && JSON.parse(options.body);
    calls.push({method:options.method, resource, id, body});
    if (options.method === 'GET'){
      if (resource === 'insights') assert.equal(new URL(url).searchParams.get('include_dashboards'), 'true', 'request existing dashboard memberships explicitly');
      return {ok:true, json:async()=>({results:structuredClone(records[resource]), next:null})};
    }
    if (body.name === failName){failName = null; return {ok:false, status:503};}
    let record;
    if (options.method === 'POST'){
      record = {...body,id:nextId++};
      records[resource].push(record);
    } else {
      record = records[resource].find(item=>item.id === Number(id));
      assert.ok(record);
      Object.assign(record, body);
    }
    return {ok:true, json:async()=>structuredClone(record)};
  }};
}

test('partial dashboard provisioning resumes without duplicate insights or overwriting an unrelated same-name dashboard', async () => {
  const plan = await loadDashboard();
  const api = fakePostHog();
  api.records.dashboards.push({id:999, name:plan.dashboard.name, tags:['another-owner']});
  api.fail(plan.insights[2].name);
  const messages = [];
  await assert.rejects(provisionDashboard({...options, ...api, log:message=>messages.push(message)}), /HTTP 503/);
  assert.equal(api.records.dashboards.length, 2);
  assert.equal(api.records.insights.length, 2);
  const result = await provisionDashboard({...options, ...api, log:message=>messages.push(message)});
  assert.equal(api.records.dashboards.length, 2);
  assert.equal(api.records.insights.length, plan.insights.length);
  assert.ok(api.records.insights.every(insight=>insight.dashboards.includes(result.id)));
  assert.deepEqual(api.records.dashboards[0], {id:999, name:plan.dashboard.name, tags:['another-owner']});
  assert.ok(!messages.join('\n').includes(options.personalKey));

  // A manual rename and attachment to another dashboard don't break reruns.
  api.records.insights[0].name = 'Renamed in PostHog';
  api.records.insights[0].dashboards.push(777);
  api.records.insights[0].tags.push('keep-user-tag');
  const previousCreates = api.calls.filter(call=>call.method === 'POST').length;
  await provisionDashboard({...options, ...api, log:()=>{}});
  assert.equal(api.calls.filter(call=>call.method === 'POST').length, previousCreates);
  assert.ok(api.records.insights[0].dashboards.includes(777));
  assert.ok(api.records.insights[0].tags.includes('keep-user-tag'));
});

test('unsafe hosts, public capture keys and non-numeric project IDs fail before any network request', async () => {
  let calls = 0;
  const fetchImpl = async()=>{calls++; throw new Error('Unexpected request');};
  for (const host of ['http://us.posthog.com','https://attacker.example','https://us.posthog.com/redirect','https://user:password@us.posthog.com']){
    await assert.rejects(provisionDashboard({...options,host,fetchImpl}), /POSTHOG_APP_HOST/);
  }
  await assert.rejects(provisionDashboard({...options,personalKey:'phc_public_capture_key',fetchImpl}), /personal API key/);
  await assert.rejects(provisionDashboard({...options,projectId:'123/other',fetchImpl}), /positive project ID/);
  assert.equal(calls, 0);
});

test('pagination cannot forward the personal API key outside the selected project', async () => {
  let calls = 0;
  await assert.rejects(provisionDashboard({...options,log:()=>{},fetchImpl:async()=>{
    calls++;
    return {ok:true,json:async()=>({results:[],next:'https://attacker.example/api/projects/123/dashboards/'})};
  }}), /outside this PostHog project/);
  assert.equal(calls, 1);
});

test('duplicate managed dashboards stop provisioning before a write', async () => {
  const api = fakePostHog();
  const plan = await loadDashboard();
  api.records.dashboards.push({id:10,...plan.dashboard},{id:11,...plan.dashboard});
  await assert.rejects(provisionDashboard({...options,...api,log:()=>{}}), /Resolve the duplicate/);
  assert.ok(api.calls.every(call=>call.method === 'GET'));
});

test('share SQL deduplicates native plus copy per browser and UTC day, excludes uncounted modes, and handles no finishers', async t => {
  let DatabaseSync;
  try { ({DatabaseSync} = await import('node:sqlite')); } catch { return t.skip('SQL fixture requires Node 22.16+; provisioning supports Node 20.'); }
  if (!DatabaseSync?.prototype.aggregate) return t.skip('SQL fixture requires Node 22.16+.');
  const db = new DatabaseSync(':memory:');
  try {
    // SQLite evaluates the stored SQL locally. These adapters supply HogQL's
    // aggregate/timezone functions and flatten JSON properties. This verifies
    // metric semantics; it does not replace validation in a PostHog project.
    db.aggregate('uniqExactIf', {
      start:()=>new Set(),
      step:(ids,id,condition)=>{if (condition && id !== null) ids.add(id); return ids;},
      result:ids=>ids.size
    });
    db.function('toTimeZone', (timestamp,timeZone)=>new Intl.DateTimeFormat('en-CA',{timeZone}).format(new Date(timestamp)));
    db.function('toDate', value=>value.slice(0,10));
    db.exec('CREATE TABLE events (timestamp TEXT, event TEXT, distinct_id TEXT, attempt_kind TEXT, counts INTEGER)');
    const insert = db.prepare('INSERT INTO events VALUES (?, ?, ?, ?, ?)');
    const beforeMidnight = '2026-10-08T23:50:00Z', afterMidnight = '2026-10-09T00:05:00Z';
    for (const name of ['sip_completed','result_shared','result_copied','result_shared']) insert.run(beforeMidnight,name,'a','daily',1);
    insert.run(beforeMidnight,'sip_completed','b','daily',1);
    for (const name of ['result_shared','result_copied']) insert.run(afterMidnight,name,'a','daily',1);
    for (const mode of ['practice','archive','preview']){
      insert.run(afterMidnight,'result_copied',mode,mode,1);
      insert.run(afterMidnight,'sip_completed',mode,mode,1);
    }
    insert.run(afterMidnight,'result_copied','race','daily',0);
    insert.run(afterMidnight,'sip_completed','race','daily',0);
    insert.run(afterMidnight,'result_share_attempted','attempt-only','daily',1);
    const plan = await loadDashboard();
    assert.equal(plan.timezone, 'UTC');
    const stored = plan.insights.find(item=>item.tags.includes('dailysplit:share-rate')).query.source.query;
    const query = stored.replace('FROM events','FROM events AS properties').replace('{filters}', "timestamp >= '2026-10-08T00:00:00Z' AND timestamp < '2026-10-10T00:00:00Z'");
    const rows = db.prepare(query).all().map(row=>({...row}));
    assert.deepEqual(rows, [
      {day:'2026-10-09',unique_sharers:1,daily_finishers:0,share_rate:null},
      {day:'2026-10-08',unique_sharers:1,daily_finishers:2,share_rate:0.5}
    ]);
  } finally { db.close(); }
});
