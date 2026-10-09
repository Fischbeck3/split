import {dayKey} from './core.js';
import {POSTHOG_PROJECT_KEY, POSTHOG_API_HOST, ANALYTICS_HOSTNAMES} from './config.js';
import {shareResultText, copyResultText} from './share-actions.js';

const EVENTS = new Set(['game_opened', 'friend_link_opened', 'sip_started', 'sip_completed',
  'result_share_attempted', 'result_shared', 'result_copied', 'result_share_cancelled',
  'result_share_manual', 'result_share_failed', 'postcard_save_attempted', 'postcard_saved', 'postcard_save_failed']);

export function attemptKind(state){
  return state.preview || state.kind === 'preview' ? 'preview' : state.kind === 'archive' ? 'archive' :
    state.practice || state.result?.counts === false ? 'practice' : 'daily';
}

/** Dates belong to the visitor's calendar; dashboard timestamps can use one project timezone. */
export function gameProperties(state, now = new Date()){
  return {local_play_date:dayKey(now), challenge_date:state.key, challenge_number:state.num,
    theme:state.theme?.id, input_mode:state.mode, attempt_kind:attemptKind(state), friend_link:!!state.friend};
}

export function cleanUrl(value){
  try { const url = new URL(value); return url.origin + url.pathname; } catch { return ''; }
}

/** Also scrub SDK-added entry/referrer URLs, including values persisted on an earlier visit. */
export function sanitizeEvent(event){
  if (!event || !EVENTS.has(event.event)) return null;
  const properties = {...event.properties};
  for (const name of Object.keys(properties)){
    if (name.startsWith('$') && /(?:url|referrer)$/.test(name)) properties[name] = cleanUrl(properties[name]);
  }
  properties.$title = 'Daily Split';
  return {...event, properties};
}

export function analyticsAllowed({projectKey, location, hostnames = ANALYTICS_HOSTNAMES} = {}){
  return typeof projectKey === 'string' && /^phc_[A-Za-z0-9_-]+$/.test(projectKey) &&
    location?.protocol === 'https:' && hostnames.includes(location.hostname);
}

/** PostHog's official array.js snippet protocol, kept here so the game needs no package dependency.
 * https://posthog.com/docs/libraries/js
 * Captures queue immediately while the asynchronous SDK loads; the queue is bounded if it is blocked.
 */
export function createAnalytics({projectKey = POSTHOG_PROJECT_KEY, apiHost = POSTHOG_API_HOST,
  hostnames = ANALYTICS_HOSTNAMES, window:win = globalThis.window, document:doc = globalThis.document} = {}){
  let enabled = false;
  const tracker = {capture(event, properties = {}, now = new Date()){
    try {
      if (!enabled || !EVENTS.has(event)) return;
      const sdk = win.posthog;
      if (Array.isArray(sdk) && sdk.length >= 100) return;
      sdk.capture(event, {...properties, $current_url:cleanUrl(win.location.href), $title:'Daily Split'}, {timestamp:now});
    } catch { /* Analytics must never affect input, animation, storage, or sharing. */ }
  }};
  try {
    if (!analyticsAllowed({projectKey, location:win?.location, hostnames})) return tracker;
    const options = {api_host:apiHost, ui_host:'https://us.posthog.com', defaults:'2026-08-30',
      persistence:'localStorage', persistence_name:'split.analytics', person_profiles:'never',
      autocapture:false, capture_pageview:false, capture_pageleave:false, rageclick:false,
      capture_dead_clicks:false, capture_heatmaps:false, capture_exceptions:false, capture_performance:false,
      disable_session_recording:true, disable_surveys:true, disable_surveys_automatic_display:true,
      disable_product_tours:true, disable_conversations:true, disable_web_experiments:true,
      disable_external_dependency_loading:true, advanced_disable_flags:true, opt_in_site_apps:false,
      save_referrer:false, save_campaign_params:false, disable_scroll_properties:true,
      disable_capture_url_hashes:true, before_send:sanitizeEvent};
    const sdk = win.posthog || [];
    if (!sdk.__SV){
      win.posthog = sdk;
      sdk._i = []; sdk.people = []; sdk.__SV = 1;
      sdk.toString = () => 'posthog (stub)';
      sdk.people.toString = () => 'posthog.people (stub)';
      // The official snippet queues SDK calls as [method, ...arguments].
      const methods = 'init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug';
      for (const name of methods.split(' ')) sdk[name] = (...args) => sdk.push([name, ...args]);
      sdk._i.push([projectKey, options, 'posthog']);
      const script = doc.createElement('script');
      script.async = true; script.crossOrigin = 'anonymous';
      script.src = apiHost.replace('.i.posthog.com', '-assets.i.posthog.com') + '/static/array.js';
      script.onerror = () => { enabled = false; sdk.length = 0; };
      doc.head.appendChild(script);
    } else sdk.init(projectKey, options);
    enabled = true;
  } catch { enabled = false; }
  return tracker;
}

function safeCapture(tracker, event, properties){
  try { tracker.capture(event, properties); } catch { /* An observer cannot block a browser action. */ }
}

function errorKind(error){
  return ['AbortError', 'NotAllowedError', 'DataError', 'TypeError', 'SecurityError'].includes(error?.name)
    ? error.name : 'Error';
}

/** Observe errors without moving share()/writeText() out of the original click call stack. */
function observedPlatform(platform, onError){
  const invoke = (object, method, args, stage) => {
    try { return Promise.resolve(object[method](...args)).catch(error => { onError(error, stage); throw error; }); }
    catch (error){ onError(error, stage); throw error; }
  };
  return {
    get share(){ return typeof platform?.share === 'function' ? (...args) => invoke(platform, 'share', args, 'native') : undefined; },
    get clipboard(){
      const clipboard = platform?.clipboard;
      return typeof clipboard?.writeText === 'function' ? {writeText:(...args) => invoke(clipboard, 'writeText', args, 'clipboard')} : undefined;
    }
  };
}

export async function trackedResultAction({text, platform = globalThis.navigator, tracker, properties, source = 'share_button'}){
  // Snapshot clicked result properties so a later practice sip cannot change attribution.
  const context = {...properties, source};
  let actionStarted = false;
  const earlyErrors = [];
  const observed = observedPlatform(platform, (error, stage) => {
    if (error?.name === 'AbortError') return;
    const failure = {...context, stage, error_kind:errorKind(error)};
    if (actionStarted) safeCapture(tracker, 'result_share_failed', failure);
    else earlyErrors.push(failure);
  });
  // Start the browser action before any SDK work, preserving native user activation.
  const operation = source === 'copy_button' ? copyResultText(text, observed) : shareResultText(text, observed);
  safeCapture(tracker, 'result_share_attempted', context);
  actionStarted = true;
  for (const failure of earlyErrors) safeCapture(tracker, 'result_share_failed', failure);
  const outcome = await operation;
  const event = {shared:'result_shared', copied:'result_copied', cancelled:'result_share_cancelled', manual:'result_share_manual'}[outcome];
  if (event) safeCapture(tracker, event, {...context, method:outcome === 'shared' ? 'native' : outcome === 'copied' ? 'clipboard' : outcome});
  return outcome;
}
