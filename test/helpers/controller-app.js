import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as core from '../../site/js/core.js';
import * as motion from '../../site/js/motion.js';
import * as rounds from '../../site/js/rounds.js';
import {canRecordChallenge, resolveChallenge} from '../../site/js/challenge.js';
import {gameProperties} from '../../site/js/analytics.js';
import {LAUNCH, LAUNCH_READY, RECORD_RUN} from '../../site/js/config.js';

const main = readFileSync(new URL('../../site/js/main.js', import.meta.url), 'utf8');
function section(from, to){
  const start = main.indexOf(from), end = main.indexOf(to, start);
  if (start < 0 || end <= start) throw new Error('Missing controller section: ' + from);
  return main.slice(start, end);
}
export const storageKey = 'split.v1:' + LAUNCH + ':' + RECORD_RUN;

export function browserStorage(entries = [], {failWrites = false, failOnWrite = 0} = {}){
  const values = new Map(entries), writes = [];
  return {values, writes, localStorage:{
    getItem:key => values.get(key) ?? null,
    setItem(key, value){
      writes.push({key, value});
      if (failWrites || writes.length === failOnWrite) throw new DOMException('Browser storage is read only', 'QuotaExceededError');
      values.set(key, value);
    }
  }};
}

// Execute the application's state, input, frames, reservation, completion and
// reload paths. Only pixels and DOM presentation are replaced; all pours,
// motion, session transitions, dates and saved-data rules use production code.
export function controllerApp({P = core.dayParams(1), storage = browserStorage(), deviceReduced = false,
  kind = 'today', review = false, practice = false, previousMode = 'hold', calendarDate} = {}){
  let now = 1000, calendar = (calendarDate ?? new Date(P.key + 'T12:00:00')).getTime();
  class AppDate extends Date {
    constructor(...args){ super(...(args.length ? args : [calendar])); }
    static now(){ return calendar; }
  }
  const elements = new Map(), events = [], draws = [], messages = [], audio = {constructed:0};
  class AudioContext {
    constructor(){ audio.constructed++; throw new Error('Visual play must stay quiet.'); }
  }
  function element(id){
    if (!elements.has(id)){
      const classes = new Set();
      elements.set(id, {hidden:false, disabled:false, textContent:'', dataset:{}, attributes:{}, children:[],
        listeners:{}, addEventListener(event, callback){ this.listeners[event] = callback; }, click(){ this.listeners.click?.({currentTarget:this}); },
        style:{setProperty(){}}, classList:{add:name => classes.add(name), remove:name => classes.delete(name), contains:name => classes.has(name)},
        setAttribute(name, value){ this.attributes[name] = value; }, removeAttribute(name){ delete this.attributes[name]; },
        focus(){ this.focused = true; }, append(...children){ this.children.push(...children); },
        replaceChildren(...children){ this.children = children; }});
    }
    return elements.get(id);
  }
  let created = 0;
  const document = {hidden:false, createElement:tag => element(tag + ':' + ++created)};
  const context = vm.createContext({...core, ...motion, ...rounds, LAUNCH, LAUNCH_READY, RECORD_RUN,
    Date:AppDate, Math, themeReview:review ? {} : null, $:element, document,
    scene:{style:{}}, AudioContext,
    window:{AudioContext, matchMedia:() => ({matches:deviceReduced, addEventListener(){}})},
    localStorage:storage.localStorage, performance:{now:() => now}, requestAnimationFrame(){},
    globalThis:{crypto:{randomUUID:() => 'tab-' + (++created) + '-' + Math.random()}},
    analytics:{capture:(event, properties) => events.push({event, properties:structuredClone(properties)})},
    canRecordChallenge, resolveChallenge, gameProperties,
    layout(){}, draw(){ draws.push({state:vm.runInContext('S.state', context)}); },
    toast:text => messages.push(text), renderResult(){ element('result').hidden = false; },
    setPhase:phase => { vm.runInContext('S', context).state = phase; element('app').dataset.phase = phase; }});
  const store = main.match(/^const STORE = .+;$/m)?.[0];
  if (!store) throw new Error('Missing app storage namespace');
  const code = [
    store,
    section('const motionQuery = ', 'const S = '),
    section('const S = ', 'const analytics = '),
    section('function sipKind(){', '// ---------- storage ----------'),
    section('function load(){', '// ---------- layout and drawing ----------'),
    section('function begin(){', '// ---------- results and sharing ----------'),
    section('function renderStats(){', 'function msToMidnight(){'),
    section('const down = ', 'for (const target of '),
    section("$('practiceBtn').addEventListener('click'", "$('reviewTheme').addEventListener"),
    section("$('reviewRefill').addEventListener('click'", "for (const id of ['introTodayBtn'"),
    'function restoreSession(){ const now = new Date();',
    section('  const rec = canRecordChallenge({key:S.key, kind:S.kind})', '  requestAnimationFrame(frame);'),
    '}'
  ].join('\n');
  vm.runInContext(code, context);
  const S = vm.runInContext('S', context), initial = core.makeDrinkState(P);
  Object.assign(S, {P, baseP:P, num:P.num, key:P.key, theme:P.theme, kind, review,
    preview:kind === 'preview', practice, mode:previousMode, L:initial.level, L0:initial.level,
    drink:initial, last:now, attribution:{}, targetAt:now});
  const run = code => vm.runInContext(code, context);
  const advance = (frames, hz = 60) => {
    for (let frame = 0; frame < frames; frame++){
      now += 1000 / hz; context.frameTime = now; run('frame(frameTime);');
    }
  };
  const begin = () => run('begin();');
  const ready = () => {
    let remaining = 100;
    while (S.state === 'approaching' && remaining-- > 0) advance(1);
    if (S.state !== 'ready') throw new Error('Approach did not reach ready: ' + S.state);
  };
  const press = () => run('down({cancelable:true,preventDefault(){}});');
  const release = () => run('up();');
  const settle = () => {
    let remaining = 500;
    while (S.state === 'locked' && remaining-- > 0) advance(1);
    if (S.state !== 'between' && S.state !== 'result' && S.state !== 'blocked') throw new Error('Sip did not settle: ' + S.state);
  };
  const sip = (heldFrames = 30) => { begin(); ready(); press(); advance(heldFrames); release(); settle(); return S.progress.rounds.at(-1); };
  return {S, storage, context, initial, element, events, draws, messages, audio, advance, begin, ready, press, release, settle, sip,
    restore:() => run('restoreSession();'),
    practice:() => element('practiceBtn').click(), reviewRefill:() => element('reviewRefill').click(),
    finish:() => { context.frameTime = now; return run('finish(frameTime);'); },
    stats:() => { run('renderStats();'); return Object.fromEntries(['stDays','stStreak','stBest','stPerfect'].map(id => [id, element(id).textContent])); },
    setCalendar:value => { calendar = value.getTime(); },
    read:() => structuredClone(run('load();'))};
}
