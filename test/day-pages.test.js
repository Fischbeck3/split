import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, writeFile, rm, copyFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runInNewContext} from 'node:vm';
import {fileURLToPath} from 'node:url';
import {dayParams, dayNumber} from '../site/js/core.js';
import {SITE_URL, SOCIAL_IMAGE} from '../site/js/config.js';
import {buildDayPages} from '../scripts/build-pages.js';
import {dayPages, renderDayPage, restoreScript, socialImagePath, HORIZON_DAYS} from '../scripts/social-pages.js';

const INDEX = fileURLToPath(new URL('../site/index.html', import.meta.url));
const now = new Date(2026, 9, 29, 12);
const meta = (html, pattern) => pattern.exec(html)?.[1];

function runScript(html, href){
  const calls = [];
  const body = /<script>([\s\S]*?)<\/script>/.exec(html)[1];
  runInNewContext(body, {URL, URLSearchParams, location:{href, replace:next => calls.push(['replace', next])},
    history:{state:null, replaceState:(state, title, next) => calls.push(['replaceState', next])}});
  return calls;
}

test('day pages cover launch through the build horizon, each with its own glass', () => {
  const pages = dayPages(now);
  assert.equal(pages[0].num, 1);
  assert.equal(pages.length, dayNumber(now) + HORIZON_DAYS);
  assert.equal(pages[dayNumber(now) - 1].key, '2026-10-29');
  assert.equal(pages[dayNumber(now) - 1].theme.id, 'halloween-vampires-toast');
});

test('a day page previews its glass and opening copy while keeping the game and its assets', async () => {
  const html = await readFile(INDEX, 'utf8'), P = dayParams(21);
  const page = renderDayPage(html, {P, siteUrl:SITE_URL, image:socialImagePath(P.theme)});
  assert.equal(meta(page, /<title>([^<]*)</), 'Split No. 021 · Can you split the bat wings?');
  assert.equal(meta(page, /property="og:title" content="([^"]*)"/), 'Can you split the bat wings?');
  assert.equal(meta(page, /property="og:url" content="([^"]*)"/), SITE_URL + 'd/2026-10-29/');
  assert.equal(meta(page, /property="og:image" content="([^"]*)"/), SITE_URL + 'og/halloween-vampires-toast.jpg');
  assert.equal(meta(page, /name="twitter:image" content="([^"]*)"/), SITE_URL + 'og/halloween-vampires-toast.jpg');
  assert.equal(meta(page, /<h1 id="introName">([^<]*)</), P.theme.label);
  assert.equal(meta(page, /<h2 id="introGoal">([^<]*)</), 'Split the bat wings.');
  assert.ok(page.indexOf('<base href="../../">') < page.indexOf('<script>'), 'base first, then the address fix');
  assert.ok(page.indexOf('<script>') < page.indexOf('type="module"'), 'the address is restored before the game reads it');
  // Past the opening copy, the page is the unchanged game.
  const game = text => text.slice(text.indexOf('<p class="instructions"'));
  assert.equal(game(page), game(html));
});

test('a day page restores the exact ?day= challenge before the game loads', () => {
  const page = renderDayPage(`<meta charset="utf-8">` + (dummyHead()), {P:dayParams(21), siteUrl:SITE_URL, image:SOCIAL_IMAGE});
  assert.deepEqual(runScript(page, 'https://dailysplit.us/d/2026-10-29/?vs=47&f=0.04&glass=x&sip=daily&empty=0&rounds=42,98,0'),
    [['replaceState', 'https://dailysplit.us/?day=2026-10-29&vs=47&f=0.04&glass=x&sip=daily&empty=0&rounds=42,98,0']]);
  assert.deepEqual(runScript(page, 'https://dailysplit.us/d/2026-10-29/'), [['replaceState', 'https://dailysplit.us/?day=2026-10-29']]);
  assert.deepEqual(runScript(page, 'https://dailysplit.us/d/2026-10-29/#result'), [['replaceState', 'https://dailysplit.us/?day=2026-10-29#result']]);
  assert.deepEqual(runScript(page, 'https://dailysplit.us/?day=2026-10-29'), []);
  assert.ok(restoreScript.startsWith('<script>') && !restoreScript.includes('</script><'));
});

function dummyHead(){
  return ['<title>x</title>', '<meta name="description" content="x">', '<meta property="og:title" content="x">',
    '<meta property="og:description" content="x">', '<link rel="canonical" href="x">', '<meta property="og:url" content="x">',
    '<meta property="og:image" content="x">', '<meta property="og:image:alt" content="x">', '<meta name="twitter:image" content="x">',
    '<meta name="twitter:image:alt" content="x">', '<span class="day-number" id="introNo">x</span>', '<h1 id="introName">x</h1>',
    '<p id="hudSub">x</p>', '<h2 id="introGoal">x</h2>'].join('\n');
}

test('the build writes every day page, falls back to the launch card, and forwards later dates', async () => {
  const root = await mkdtemp(join(tmpdir(), 'split-day-pages-'));
  try {
    await copyFile(INDEX, join(root, 'index.html'));
    await mkdir(join(root, 'og'));
    await writeFile(join(root, 'og', 'halloween-vampires-toast.jpg'), 'image');
    const result = await buildDayPages(root, {now, siteUrl:SITE_URL});
    assert.equal(result.pages, dayNumber(now) + HORIZON_DAYS);
    assert.ok(!result.missing.includes('halloween-vampires-toast') && result.missing.includes('pub'));
    const today = await readFile(join(root, 'd', '2026-10-29', 'index.html'), 'utf8');
    assert.equal(meta(today, /property="og:image" content="([^"]*)"/), SITE_URL + 'og/halloween-vampires-toast.jpg');
    const launch = await readFile(join(root, 'd', '2026-10-09', 'index.html'), 'utf8');
    assert.equal(meta(launch, /property="og:image" content="([^"]*)"/), SITE_URL + SOCIAL_IMAGE);
    const notFound = await readFile(join(root, '404.html'), 'utf8');
    assert.deepEqual(runScript(notFound, 'https://dailysplit.us/d/2031-01-01/?vs=9'), [['replace', 'https://dailysplit.us/?day=2031-01-01&vs=9']]);
    assert.deepEqual(runScript(notFound, 'https://dailysplit.us/missing'), []);
  } finally { await rm(root, {recursive:true, force:true}); }
});
