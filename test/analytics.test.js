import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {analyticsAllowed, attemptKind, gameProperties, resultProperties, cleanUrl, sanitizeEvent, createAnalytics, trackedResultAction} from '../site/js/analytics.js';
import {dayParams, scoreFromOffset, dayKey} from '../site/js/core.js';

const projectKey = 'phc_test_public_token';
const location = {protocol:'https:', hostname:'dailysplit.us', href:'https://dailysplit.us/?day=2026-10-09&vs=99&f=.02#day1'};
const state = () => ({key:'2026-10-09', num:1, theme:{id:'pub'}, kind:'today', mode:'hold', practice:false, preview:false, friend:null});
const browser = () => {
  const scripts = [], window = {location:{...location}};
  const document = {createElement:() => ({}), head:{appendChild:script => scripts.push(script)}};
  return {window, document, scripts};
};
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return {promise, resolve, reject};
};

test('calendar attribution distinguishes the glass, place, and published run', () => {
  const P = dayParams(1), properties = gameProperties({...state(), theme:P.theme, P}, new Date(2026, 9, 9));
  assert.equal(properties.glass_id, 'pub');
  assert.equal(properties.vessel, 'tulip');
  assert.equal(properties.scene, 'pub');
  assert.equal(properties.visual_theme, 'pub');
  assert.equal(properties.campaign_id, 'opening-2026');
  assert.equal(properties.campaign_day, 1);
  assert.equal(typeof properties.schedule_version, 'number');
});

test('restored results retain their recorded campaign and artwork attribution', () => {
  const recorded = {glass_id:'pub', vessel:'tulip', scene:'pub', visual_theme:'halloween-pub', campaign_id:'halloween-2026', campaign_day:4, schedule_version:3};
  const s = {...state(), P:dayParams(1), result:{score:91, drained:false, counts:true, attribution:{...recorded, $current_url:'https://bad.example/'}}};
  const properties = resultProperties(s, new Date(2026, 9, 9));
  for (const [key, value] of Object.entries(recorded)) assert.equal(properties[key], value);
  assert.equal(properties.challenge_date, '2026-10-09');
  assert.equal(properties.attempt_kind, 'daily');
  assert.equal(properties.counts, true);
  assert.equal(properties.$current_url, undefined);
});

test('only the configured HTTPS production hosts and a public project key enable capture', () => {
  assert.equal(analyticsAllowed({projectKey, location}), true);
  assert.equal(analyticsAllowed({projectKey, location:{...location, hostname:'www.dailysplit.us'}}), true);
  for (const hostname of ['localhost', '127.0.0.1', 'split-preview.pages.dev', 'dailysplit.us.example.com']){
    assert.equal(analyticsAllowed({projectKey, location:{...location, hostname}}), false);
  }
  for (const key of ['', '   ', 'phx_personal_secret', undefined]) assert.equal(analyticsAllowed({projectKey:key, location}), false);
  assert.equal(analyticsAllowed({projectKey, location:{...location, protocol:'http:'}}), false);
});

test('disabled analytics never requests a script or inspects storage', () => {
  for (const key of ['', 'phx_personal_secret']){
    const env = browser();
    Object.defineProperty(env.window, 'localStorage', {get(){ throw new Error('Do not read storage'); }});
    const analytics = createAnalytics({...env, projectKey:key});
    assert.doesNotThrow(() => analytics.capture('game_opened', gameProperties(state())));
    assert.deepEqual(env.scripts, []);
    assert.equal(env.window.posthog, undefined);
  }
});

test('the official SDK queue preserves event properties, timestamp, and event order while loading', () => {
  const env = browser(), analytics = createAnalytics({...env, projectKey});
  assert.equal(env.scripts.length, 1);
  assert.equal(env.scripts[0].src, 'https://us-assets.i.posthog.com/static/array.js');
  assert.equal(env.scripts[0].async, true);
  const [key, options, name] = env.window.posthog._i[0];
  assert.equal(key, projectKey); assert.equal(name, 'posthog');
  assert.equal(options.person_profiles, 'never'); assert.equal(options.persistence, 'localStorage');
  for (const flag of ['autocapture', 'capture_pageview', 'capture_pageleave', 'capture_exceptions', 'capture_heatmaps', 'capture_dead_clicks', 'capture_performance']) assert.equal(options[flag], false, flag);
  for (const flag of ['disable_session_recording', 'disable_surveys', 'disable_external_dependency_loading', 'advanced_disable_flags']) assert.equal(options[flag], true, flag);
  const now = new Date(2026, 9, 9, 12), properties = gameProperties(state(), now);
  analytics.capture('game_opened', properties, now);
  analytics.capture('sip_started', properties, now);
  properties.theme = 'mutated';
  assert.deepEqual(env.window.posthog.map(call => call.slice(0, 2)), [['capture','game_opened'], ['capture','sip_started']]);
  assert.equal(env.window.posthog[0][2].theme, 'pub');
  assert.equal(env.window.posthog[0][2].$current_url, 'https://dailysplit.us/');
  assert.equal(env.window.posthog[0][3].timestamp, now);
  const calls = [];
  env.window.posthog = {capture:(...args) => calls.push(args)};
  analytics.capture('sip_completed', {...properties, counts:true}, now);
  assert.equal(calls[0][0], 'sip_completed', 'later events go to the initialized SDK');
  assert.equal(calls[0][1].counts, true);
});

test('a blocked SDK has a bounded queue, then becomes a no-op on load failure', () => {
  const env = browser(), analytics = createAnalytics({...env, projectKey});
  for (let index = 0; index < 200; index++) analytics.capture('game_opened', {});
  assert.equal(env.window.posthog.length, 100);
  env.scripts[0].onerror();
  analytics.capture('sip_started', {});
  assert.equal(env.window.posthog.length, 0);
});

test('DOM, init, and capture failures cannot propagate into the game', () => {
  const failedDom = browser(); failedDom.document.head.appendChild = () => { throw new Error('blocked'); };
  assert.doesNotThrow(() => createAnalytics({...failedDom, projectKey}).capture('game_opened'));
  const failedInit = browser(); failedInit.window.posthog = {__SV:1, init(){ throw new Error('SDK unavailable'); }};
  assert.doesNotThrow(() => createAnalytics({...failedInit, projectKey}).capture('game_opened'));
  const failedCapture = browser();
  const tracker = createAnalytics({...failedCapture, projectKey});
  failedCapture.window.posthog = {capture(){ throw new Error('storage unavailable'); }};
  assert.doesNotThrow(() => tracker.capture('sip_started', {}));
});

test('SDK automatic events are rejected and incoming/previous URLs lose query strings and fragments', () => {
  assert.equal(sanitizeEvent({event:'$autocapture', properties:{}}), null);
  assert.equal(sanitizeEvent({event:'$pageview', properties:{}}), null);
  const raw = {event:'game_opened', properties:{$current_url:location.href, $initial_current_url:location.href,
    $session_entry_url:location.href, $referrer:'https://example.com/chat?private=value#fragment',
    $initial_referrer:'https://example.com/?vs=42', $session_entry_referrer:'https://example.com/?private=1',
    $title:'dynamic title', challenge_date:'2026-10-09'}};
  const event = sanitizeEvent(raw);
  assert.equal(event.properties.$current_url, 'https://dailysplit.us/');
  assert.equal(event.properties.$initial_current_url, 'https://dailysplit.us/');
  assert.equal(event.properties.$session_entry_url, 'https://dailysplit.us/');
  assert.equal(event.properties.$referrer, 'https://example.com/chat');
  assert.equal(event.properties.$initial_referrer, 'https://example.com/');
  assert.equal(event.properties.$session_entry_referrer, 'https://example.com/');
  assert.equal(event.properties.$title, 'Daily Split');
  assert.equal(raw.properties.$current_url, location.href, 'sanitization does not mutate callers');
  assert.equal(cleanUrl('not a URL'), '');
});

test('daily, practice, archive, and preview classification follows game recording semantics', () => {
  assert.equal(attemptKind(state()), 'daily');
  assert.equal(attemptKind({...state(), practice:true}), 'practice');
  assert.equal(attemptKind({...state(), result:{counts:false}}), 'practice');
  assert.equal(attemptKind({...state(), practice:true, kind:'archive', result:{counts:true}}), 'archive');
  assert.equal(attemptKind({...state(), practice:true, kind:'preview'}), 'preview');
  const context = gameProperties({...state(), key:'2026-10-08', kind:'archive', mode:'tilt', friend:{score:90}}, new Date(2026, 9, 9, 1));
  const {glass_id, vessel, scene, visual_theme, campaign_id, campaign_day, schedule_version, ...eventContext} = context;
  assert.deepEqual(eventContext, {local_play_date:'2026-10-09', challenge_date:'2026-10-08', challenge_number:1,
    theme:'pub', input_mode:'tilt', attempt_kind:'archive', friend_link:true});
  assert.equal(campaign_id, 'none');
  assert.equal(campaign_day, 0);
});

test('native sharing starts before telemetry, and attributes its later handoff to the clicked result', async () => {
  const sheet = deferred(), sequence = [], events = [], properties = {attempt_kind:'daily', score:98};
  const tracker = {capture(event, props){ sequence.push(event); events.push({event, props}); }};
  const operation = trackedResultAction({text:'Split\nhttps://dailysplit.us/', platform:{share(){ sequence.push('native'); return sheet.promise; }}, tracker, properties});
  assert.deepEqual(sequence, ['native','result_share_attempted']);
  properties.attempt_kind = 'practice'; properties.score = 2;
  sheet.resolve();
  assert.equal(await operation, 'shared');
  assert.deepEqual(events.map(e => e.event), ['result_share_attempted','result_shared']);
  assert.equal(events[1].props.score, 98); assert.equal(events[1].props.attempt_kind, 'daily');
  assert.equal(events[1].props.method, 'native');
});

test('cancellation is separate from sharing and never attempts clipboard fallback', async () => {
  const events = [];
  const result = await trackedResultAction({text:'Split', tracker:{capture:name => events.push(name)}, properties:{},
    platform:{share:async () => { throw new DOMException('Cancelled', 'AbortError'); }, get clipboard(){ throw new Error('Must not copy'); }}});
  assert.equal(result, 'cancelled');
  assert.deepEqual(events, ['result_share_attempted','result_share_cancelled']);
});

test('native failure followed by a successful copy is an error and copy, never a native share', async () => {
  const events = [], clipboard = {writeText(value){ assert.equal(this, clipboard); assert.equal(value, 'Split'); return Promise.resolve(); }};
  const result = await trackedResultAction({text:'Split', properties:{counts:true}, tracker:{capture:(event, props) => events.push({event, props})},
    platform:{share:async () => { throw new DOMException('Unsupported', 'DataError'); }, clipboard}});
  assert.equal(result, 'copied');
  assert.deepEqual(events.map(e => e.event), ['result_share_attempted','result_share_failed','result_copied']);
  assert.equal(events[1].props.stage, 'native'); assert.equal(events[1].props.error_kind, 'DataError');
});

test('explicit and fallback clipboard actions remain immediate even if every capture throws', async () => {
  for (const source of ['share_button', 'copy_button']){
    const write = deferred(), calls = [];
    const operation = trackedResultAction({text:'Split', source, properties:{}, tracker:{capture(){ throw new Error('telemetry failed'); }},
      platform:{clipboard:{writeText(text){ calls.push(text); return write.promise; }}}});
    assert.deepEqual(calls, ['Split']);
    write.resolve(); assert.equal(await operation, 'copied');
  }
});

test('a synchronous native failure still starts clipboard before any telemetry and reports events in order', async () => {
  const sequence = [];
  const operation = trackedResultAction({text:'Split', properties:{}, tracker:{capture:name => sequence.push(name)},
    platform:{share(){ sequence.push('native'); throw new TypeError('Unavailable'); },
      clipboard:{writeText(){ sequence.push('clipboard'); return Promise.resolve(); }}}});
  assert.deepEqual(sequence, ['native','clipboard','result_share_attempted','result_share_failed']);
  assert.equal(await operation, 'copied');
  assert.equal(sequence.at(-1), 'result_copied');
});

test('manual fallback and clipboard failure have separate observable outcomes', async () => {
  const events = [];
  assert.equal(await trackedResultAction({text:'Split', properties:{}, source:'copy_button',
    tracker:{capture:(event, props) => events.push({event, props})},
    platform:{clipboard:{writeText:async () => { throw new DOMException('Denied', 'NotAllowedError'); }}}}), 'manual');
  assert.deepEqual(events.map(e => e.event), ['result_share_attempted','result_share_failed','result_share_manual']);
  assert.equal(events[1].props.stage, 'clipboard'); assert.equal(events[2].props.source, 'copy_button');
});

// Exercise the real finish() body with browser rendering stubbed out, including the stale-tab race.
const mainSource = readFileSync(new URL('../site/js/main.js', import.meta.url), 'utf8');
const finishSource = mainSource.slice(mainSource.indexOf('function finish(now){'), mainSource.indexOf('// ---------- results and sharing ----------'));
function completeSip({saved = false, practice = false, kind = 'today', mode = 'hold'} = {}){
  const P = dayParams(1), key = dayKey(new Date()), events = [], store = {days:{}};
  const S = {...state(), key, P, theme:P.theme, L:P.markY, drained:false, practice, kind, mode, state:'locked'};
  if (saved) store.days[key] = {done:true, theme:P.theme.id, L:P.markY, mode:'hold', score:99, f:0};
  const element = {hidden:false, classList:{add(){}}};
  const context = {S, analytics:{capture:(event, props) => events.push({event, props})}, gameProperties,
    refreshDayStatus(){}, scoreFromOffset, canRecordChallenge:({kind}) => kind === 'today',
    load:() => store, save(){}, toast(){}, draw(){}, setPhase:phase => { S.state = phase; },
    $:() => element, renderResult(){}, renderStats(){}, sound:{land(){}}, PERFECT:.02, Date};
  vm.runInNewContext(finishSource + '\nfinish(1000);', context);
  return {events, S};
}

test('first daily completion counts once; a stale tab reuses its saved result without another daily completion', () => {
  const first = completeSip();
  assert.equal(first.events[0].event, 'sip_completed');
  assert.equal(first.events[0].props.counts, true); assert.equal(first.events[0].props.new_record, true);
  const second = completeSip({saved:true, mode:'tilt'});
  assert.equal(second.events[0].props.counts, false); assert.equal(second.events[0].props.new_record, false);
  assert.equal(second.S.result.score, 99, 'the original saved result is still displayed');
  assert.equal(second.events[0].props.input_mode, 'tilt', 'completion describes the actual attempt before a saved result is restored');
  for (const options of [{practice:true}, {kind:'archive'}, {kind:'preview'}]){
    const event = completeSip(options).events[0];
    assert.equal(event.props.counts, false); assert.equal(event.props.new_record, false);
  }
});
