import {test} from 'node:test';
import assert from 'node:assert/strict';
import {shareResultText, copyResultText} from '../site/js/share-actions.js';

const text = 'Split #001 · 🍺 Guinness · Old Irish pub\n98/100 · Perfect split\n⬜⬜🟩⬜⬜\nOne sip. Your turn.\nhttps://dailysplit.us/?day=2026-10-09';
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
  assert.deepEqual(calls, [{text}], 'the native sheet must open before the helper returns its promise');
  sheet.resolve();
  assert.equal(await operation, 'shared');
});

test('text sharing works when canShare is missing or rejects file sharing', async () => {
  for (const extra of [{}, {canShare: () => false}, {canShare(){ throw new Error('Do not check file sharing'); }}]){
    const calls = [];
    const platform = {...extra, share: async data => calls.push(data)};
    assert.equal(await shareResultText(text, platform), 'shared');
    assert.deepEqual(calls, [{text}]);
  }
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
