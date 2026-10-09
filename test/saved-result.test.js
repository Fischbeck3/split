import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {dayParams, bandEmoji, PERFECT, THEMES} from '../site/js/core.js';

const main = readFileSync(new URL('../site/js/main.js', import.meta.url), 'utf8');
const render = main.slice(main.indexOf('function renderResult(){'), main.indexOf('function drawCard(){'));
const restore = main.slice(main.indexOf("$('officialBtn').addEventListener('click'"), main.indexOf("window.addEventListener('hashchange'"));

// Exercise the real result renderer and restore click with only canvas and
// browser elements stubbed. An earlier theme may remain in local storage.
function savedResult(savedTheme, kind = 'today'){
  const P = dayParams(1), S = {P, key:P.key, num:1, theme:P.theme, kind, preview:false,
    practice:true, friend:null, L:P.markY, mode:'hold', result:{score:100, label:'Perfect split', tone:'good', f:0, L:P.markY, counts:false}};
  const saved = {theme:savedTheme, done:true, L:P.markY + 0.01, score:87, label:'Split', tone:'good', f:0.1, mode:'tilt'};
  const elements = new Map();
  const $ = id => {
    if (!elements.has(id)) elements.set(id, {hidden:false, dataset:{}, style:{setProperty(){}}, classList:{remove(){}},
      closest:() => ({open:false}), addEventListener(event, callback){ this.click = callback; }});
    return elements.get(id);
  };
  const context = {S, $, load:() => ({days:{[S.key]:saved}}), bandEmoji, PERFECT,
    shareText:() => '', resetAction(){}, drawCard:() => ({toDataURL:() => 'data:image/png;base64,', toBlob:callback => callback({})}),
    refreshDayStatus(){}, canRecordChallenge:({kind}) => kind === 'today',
    setPhase:phase => { S.state = phase; }, draw(){}, performance:{now:() => 1}};
  vm.runInNewContext(render + '\n' + restore + '\nrenderResult();', context);
  return {S, saved, button:$('officialBtn')};
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

test('a matching saved daily sip is restorable, while archive controls stay hidden', () => {
  const theme = dayParams(1).theme.id, current = savedResult(theme);
  assert.equal(current.button.hidden, false);
  current.button.click();
  assert.equal(current.S.result.score, current.saved.score);
  assert.equal(current.S.result.counts, true);
  assert.equal(current.S.practice, false);
  assert.equal(current.S.mode, 'tilt');
  const archive = savedResult(theme, 'archive');
  assert.equal(archive.button.hidden, true);
  archive.button.click();
  assert.equal(archive.S.result.counts, false);
});
