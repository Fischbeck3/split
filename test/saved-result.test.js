import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {dayParams, bandEmoji, PERFECT, THEMES} from '../site/js/core.js';
import {ROUND_STAGES, normalizeRoundRecord, summarizeRounds} from '../site/js/rounds.js';

const main = readFileSync(new URL('../site/js/main.js', import.meta.url), 'utf8');
const render = main.slice(main.indexOf('function renderResult(){'), main.indexOf('function drawCard(){'));
const renderRounds = main.slice(main.indexOf('function renderRounds('), main.indexOf('function challengeDate(){'));
const restore = main.slice(main.indexOf("$('officialBtn').addEventListener('click'"), main.indexOf("window.addEventListener('hashchange'"));

// Run the real renderer and restore click, including the graduated score list.
// Canvas encoding and browser elements are replaced; saved round data is real.
function savedResult(savedTheme, kind = 'today'){
  const P = dayParams(1), rounds = [
    {L:P.markY + P.markH * .3, score:70, label:'Close', tone:'warn', f:.3, mode:'hold'},
    {L:P.markY + P.markH * .1, score:87, label:'Split', tone:'good', f:.1, mode:'tilt'},
    {L:P.markY + P.markH * .2, score:80, label:'Close', tone:'warn', f:.2, mode:'hold'}
  ];
  const saved = {...summarizeRounds(rounds), num:P.num, theme:savedTheme, pending:null,
    score:87, label:'Split', tone:'good'};
  delete saved.scoring; delete saved.averageScore; delete saved.bestScore;
  const S = {P, baseP:P, key:P.key, num:P.num, theme:P.theme, kind, preview:false,
    practice:true, friend:null, L:P.markY, mode:'hold',
    result:{...summarizeRounds(rounds.map(round => ({...round, score:100, f:0, L:P.markY}))), counts:false}};
  const elements = new Map();
  const $ = id => {
    if (!elements.has(id)) elements.set(id, {hidden:false, dataset:{}, children:[], attributes:{}, style:{setProperty(){}}, classList:{remove(){}},
      closest:() => ({open:false}), addEventListener(event, callback){ this.click = callback; },
      replaceChildren(...children){ this.children = children; }, append(...children){ this.children.push(...children); },
      setAttribute(name, value){ this.attributes[name] = value; }});
    return elements.get(id);
  };
  let created = 0;
  const context = {S, $, ROUND_STAGES, normalizeRoundRecord, document:{createElement:tag => $(tag + ':' + ++created)},
    load:() => ({days:{[S.key]:saved}}), bandEmoji, PERFECT,
    shareText:() => '', resetAction(){}, drawCard:() => ({toDataURL:() => 'data:image/png;base64,', toBlob:callback => callback({})}),
    refreshDayStatus(){}, canRecordChallenge:({kind}) => kind === 'today',
    setPhase:phase => { S.state = phase; }, draw(){}, performance:{now:() => 1}};
  vm.runInNewContext(renderRounds + '\n' + render + '\n' + restore + '\nrenderResult();', context);
  return {S, saved, button:$('officialBtn'), element:$};
}

test('a saved result from another glass is hidden and cannot be restored into the current theme', () => {
  const differentTheme = THEMES.find(theme => theme.id !== dayParams(1).theme.id).id;
  const {S, button} = savedResult(differentTheme);
  assert.equal(button.hidden, true);
  const before = structuredClone(S.result);
  button.click();
  assert.deepEqual(S.result, before);
  assert.equal(S.practice, true);
  assert.equal(S.mode, 'hold');
});

test('the matching saved three-sip round restores its normalized average, real best line and breakdown', () => {
  const current = savedResult(dayParams(1).theme.id);
  assert.equal(current.button.hidden, false);
  current.button.click();
  assert.equal(current.S.result.score, 79, 'restore normalizes the old best-score summary rather than showing its stale 87');
  assert.equal(current.S.result.averageScore, 79);
  assert.equal(current.S.result.bestScore, 87);
  assert.equal(current.S.result.scoring, 'average');
  assert.equal(current.S.result.counts, true);
  assert.equal(current.S.practice, false);
  assert.equal(current.S.mode, 'tilt');
  assert.equal(current.S.L, current.saved.rounds[1].L);
  assert.equal(current.S.result.bestIndex, 1);
  assert.equal(current.S.progress.rounds.length, 3);
  const list = current.element('resultRounds').children;
  assert.deepEqual(list.map(item => item.children[0].textContent), ['Sober', 'Tipsy', 'Drunk']);
  assert.deepEqual(list.map(item => item.children[1].textContent), ['70/100', '87/100', '80/100']);
  assert.equal(list[1].className, 'best-round');
  assert.match(current.element('resDetail').textContent, /^Best sip: Tipsy · 87\/100\./);
  assert.equal(current.element('resKind').textContent, 'Today’s round');
  assert.equal(current.element('resLabel').textContent, 'Three-sip average');
  assert.equal(current.element('resStrip').hidden, true, 'one representative position is not presented as the aggregate score');
  assert.match(current.element('cardImg').alt, /^Average of three\./);
});

test('archive controls cannot restore the official saved round into unsaved play', () => {
  const archive = savedResult(dayParams(1).theme.id, 'archive');
  const before = structuredClone(archive.S.result);
  assert.equal(archive.button.hidden, true);
  archive.button.click();
  assert.deepEqual(archive.S.result, before);
  assert.equal(archive.S.result.counts, false);
  assert.equal(archive.S.practice, true);
});
