import {test} from 'node:test';
import assert from 'node:assert/strict';
import {shareResultText, copyResultText} from '../site/js/share-actions.js';

const text = 'Split #001 · 🍺 Guinness · Old Irish pub\n98/100 · Perfect split\n⬜⬜🟩⬜⬜\nOne sip. Your turn.\nhttps://dailysplit.us/?day=2026-10-09';
const nativeResult = {text:'Split #001 · 🍺 Guinness · Old Irish pub\n98/100 · Perfect split\n⬜⬜🟩⬜⬜\nOne sip. Your turn.', url:'https://dailysplit.us/?day=2026-10-09'};
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return {promise, resolve, reject};
};

test('native text sharing starts synchronously and never waits for a postcard or probes file support', async () => {
  const sheet = deferred(), calls = [];
  const platform = {
    share(data){ assert.equal(this, platform); calls.push(data); return sheet.promise; },
    get canShare(){ throw new Error('File support must not be inspected'); },
    get clipboard(){ throw new Error('Successful sharing must not copy'); }
  };
  const operation = shareResultText(text, platform);
  assert.deepEqual(calls, [nativeResult], 'the native sheet must open before the helper returns its promise');
  sheet.resolve();
  assert.equal(await operation, 'shared');
});

test('text sharing works when canShare is missing or rejects file sharing', async () => {
  for (const extra of [{}, {canShare: () => false}, {canShare(){ throw new Error('Do not check file sharing'); }}]){
    const calls = [];
    const platform = {...extra, share: async data => calls.push(data)};
    assert.equal(await shareResultText(text, platform), 'shared');
    assert.deepEqual(calls, [nativeResult]);
  }
});

test('a final standalone web link becomes an explicit native URL without changing its date or fragment', async () => {
  for (const link of ['https://dailysplit.us/?day=2026-10-09', 'https://dailysplit.us/#day3', 'http://localhost:8000/?day=2026-10-09#result']){
    const calls = [], body = 'Split #003\n⬜⬜🟩⬜⬜\nOne sip. Your turn.';
    assert.equal(await shareResultText(body + '\n' + link, {share: async data => calls.push(data)}), 'shared');
    assert.deepEqual(calls, [{text:body, url:link}]);
  }
  const calls = [];
  await shareResultText('Split\r\n  https://dailysplit.us/#day2  ', {share: async data => calls.push(data)});
  assert.deepEqual(calls, [{text:'Split', url:'https://dailysplit.us/#day2'}]);
});

test('ordinary text, inline links and invalid final links retain the unchanged text-only payload', async () => {
  for (const value of ['Split #001\n⬜⬜🟩⬜⬜', 'Play https://dailysplit.us/', 'Split\nhttps://dailysplit.us/\nYour turn.', 'Split\nhttps://', 'Split\njavascript:alert(1)', 'Split\nhttps://dailysplit.us/a b', 'Split\nhttps://dailysplit.us:99999/']){
    const calls = [];
    assert.equal(await shareResultText(value, {share: async data => calls.push(data)}), 'shared');
    assert.deepEqual(calls, [{text:value}], value);
  }
});

test('a link by itself is shared as a native URL without duplicating it in text', async () => {
  const calls = [];
  await shareResultText('https://dailysplit.us/', {share: async data => calls.push(data)});
  assert.deepEqual(calls, [{text:'', url:'https://dailysplit.us/'}]);
});

test('cancelling the native sheet does not copy or trigger a manual fallback', async () => {
  const sheet = deferred();
  const operation = shareResultText(text, {
    share: () => sheet.promise,
    get clipboard(){ throw new Error('Cancellation must not inspect the clipboard'); }
  });
  sheet.reject(new DOMException('Cancelled', 'AbortError'));
  assert.equal(await operation, 'cancelled');
});

test('without native sharing, copying starts synchronously in the same call stack', async () => {
  const write = deferred(), calls = [];
  const clipboard = {writeText(value){ assert.equal(this, clipboard); calls.push(value); return write.promise; }};
  const operation = shareResultText(text, {clipboard});
  assert.deepEqual(calls, [text], 'copy must start before a wait can lose the user gesture');
  write.resolve();
  assert.equal(await operation, 'copied');
});

test('copyResultText invokes writeText immediately and reports copied only after completion', async () => {
  const write = deferred(), calls = [];
  const operation = copyResultText(text, {clipboard: {writeText: value => { calls.push(value); return write.promise; }}});
  assert.deepEqual(calls, [text]);
  write.resolve();
  assert.equal(await operation, 'copied');
});

test('a failed native share falls back to copying the same complete result', async () => {
  for (const name of ['NotAllowedError', 'DataError', 'TypeError']){
    const calls = [];
    const platform = {
      share: async () => { throw Object.assign(new Error('Unavailable'), {name}); },
      clipboard: {writeText: async value => calls.push(value)}
    };
    assert.equal(await shareResultText(text, platform), 'copied', name);
    assert.deepEqual(calls, [text], name);
  }
});

test('a synchronous native share error also falls back to an immediate copy', async () => {
  const calls = [];
  const operation = shareResultText(text, {
    share(){ throw new Error('Unavailable'); },
    clipboard: {writeText: async value => calls.push(value)}
  });
  assert.deepEqual(calls, [text]);
  assert.equal(await operation, 'copied');
});

test('clipboard denial or absence requests the manual text fallback', async () => {
  const denied = {clipboard: {writeText: async () => { throw new DOMException('Denied', 'NotAllowedError'); }}};
  const synchronousFailure = {clipboard: {writeText(){ throw new Error('Denied'); }}};
  for (const platform of [{}, {clipboard: {}}, denied, synchronousFailure]){
    assert.equal(await copyResultText(text, platform), 'manual');
    assert.equal(await shareResultText(text, platform), 'manual');
  }
  assert.equal(await shareResultText(text, {share: async () => { throw new Error('Sharing failed'); }, ...denied}), 'manual');
});
