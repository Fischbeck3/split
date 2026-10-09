import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {validateRevision, stampRelativeUrl, stampJavaScript, stampHtml, buildPages} from '../scripts/build-pages.js';

const revision = 'a1b2c3d'.padEnd(40, 'a');
const nextRevision = 'b1b2c3d'.padEnd(40, 'b');

test('revisions accept only 7–40 hex characters, with a stable normalized value', () => {
  assert.equal(validateRevision('ABC1234'), 'abc1234');
  assert.equal(validateRevision(revision), revision);
  for (const value of [undefined, '', 'abc123', 'g123456', 'a'.repeat(41), 'abc1234?extra=1', 'abc1234\n', 1234567]){
    assert.throws(() => validateRevision(value), /Git revision/);
  }
});

test('relative revision URLs preserve unrelated query values and fragments without duplicate versions', () => {
  assert.equal(stampRelativeUrl('./core.js', revision, true), './core.js?v=' + revision);
  assert.equal(stampRelativeUrl('../core.js?lang=en&v=old&lang=fr#exports', revision, true), '../core.js?lang=en&v=' + revision + '&lang=fr#exports');
  assert.equal(stampRelativeUrl('/js/core.js?debug=true#one#two', revision, true), '/js/core.js?debug=true&v=' + revision + '#one#two');
  assert.equal(stampRelativeUrl('js/main.js', revision), 'js/main.js?v=' + revision);
  for (const url of ['https://cdn.example/core.js', '//cdn.example/core.js', 'data:text/javascript,export{}', '#anchor', '?mode=one']){
    assert.equal(stampRelativeUrl(url, revision), url);
  }
  assert.equal(stampRelativeUrl('some-package', revision, true), 'some-package');
});

test('every static import and re-export form receives the same dependency revision', () => {
  const source = `import './side-effect.js';
import defaultValue, {
  a as alias,
  b
} from "./core.js?mode=full#exports";
import * as library from '../library.mjs';
export {alias as exported} from './other.js';
export * from './all.js';
export * as named from './named.js';
import remote from 'https://cdn.example/remote.js';
import packageValue from 'package-value';`;
  const output = stampJavaScript(source, revision);
  assert.match(output, new RegExp("'\\./side-effect.js\\?v=" + revision + "'"));
  assert.ok(output.includes('"./core.js?mode=full&v=' + revision + '#exports"'));
  for (const path of ['../library.mjs', './other.js', './all.js', './named.js']) assert.ok(output.includes("'" + path + '?v=' + revision + "'"), path);
  assert.ok(output.includes("'https://cdn.example/remote.js'"));
  assert.ok(output.includes("'package-value'"));
  assert.equal(stampJavaScript(output, revision), output, 'same revision is idempotent');
});

test('comments, strings, templates, regexes, dynamic imports and asset URLs stay unchanged', () => {
  const literals = `// import x from './comment.js';
/* export * from './block.js'; */
const example = "import x from './string.js';";
const template = \`export * from './template.js';\`;
const pattern = /import 'regex.js'/;
const dynamic = import('./dynamic.js');
const asset = new URL('../assets/scenes/irish-pub.webp', import.meta.url);
export const ordinary = "from './ordinary.js'";`;
  assert.equal(stampJavaScript(literals, revision), literals);
  assert.ok(stampJavaScript(literals + "\nimport real from './real.js';", revision).endsWith("import real from './real.js?v=" + revision + "';"));
});

test('HTML versions script sources, stylesheets and inline modules while preserving metadata and static assets', () => {
  const source = `<link rel="canonical" href="https://dailysplit.us/">
<meta property="og:image" content="https://dailysplit.us/og.png">
<link rel="icon" href="icons/icon.svg">
<link rel="manifest" href="manifest.webmanifest">
<link rel="stylesheet" href="css/style.css?theme=pub&amp;v=old#colors">
<link rel='stylesheet' href='https://cdn.example/remote.css'>
<script type="module" src="js/main.js"></script>
<script type='module'>import {draw} from './js/draw.js'; export * from './js/core.js';</script>
<script>const literal = "import x from './not-a-module.js';"; const html = '<link rel="stylesheet" href="stay.css">';</script>
<!-- <script type="module" src="comment.js"></script><link rel="stylesheet" href="comment.css"> -->
<img src="assets/scenes/irish-pub.webp"><style>@font-face{src:url('fonts/Karla.ttf')}</style>`;
  const output = stampHtml(source, revision);
  assert.ok(output.includes('href="css/style.css?theme=pub&amp;v=' + revision + '#colors"'));
  assert.ok(output.includes('src="js/main.js?v=' + revision + '"'));
  assert.ok(output.includes("from './js/draw.js?v=" + revision + "'"));
  assert.ok(output.includes("from './js/core.js?v=" + revision + "'"));
  for (const unchanged of ['href="https://dailysplit.us/"', 'content="https://dailysplit.us/og.png"', 'href="icons/icon.svg"', 'href="manifest.webmanifest"', "href='https://cdn.example/remote.css'", "'./not-a-module.js'", 'href="stay.css"', 'src="comment.js"', 'href="comment.css"', 'src="assets/scenes/irish-pub.webp"', "url('fonts/Karla.ttf')"]){
    assert.ok(output.includes(unchanged), unchanged);
  }
  assert.equal(stampHtml(output, revision), output);
});

test('HTML supports unquoted attributes and leaves external script sources alone', () => {
  const output = stampHtml('<LINK REL=stylesheet HREF=css/style.css><script TYPE=module SRC=js/main.js></script><script src="//cdn.example/js.js"></script>', revision);
  assert.ok(output.includes('HREF=css/style.css?v=' + revision));
  assert.ok(output.includes('SRC=js/main.js?v=' + revision));
  assert.ok(output.includes('src="//cdn.example/js.js"'));
});

test('two releases have distinct entry and dependency URLs', () => {
  const js = "import {config} from './config.js';";
  const html = '<link rel="stylesheet" href="css/style.css"><script type="module" src="js/main.js"></script>';
  assert.notEqual(stampJavaScript(js, revision), stampJavaScript(js, nextRevision));
  assert.notEqual(stampHtml(html, revision), stampHtml(html, nextRevision));
  assert.equal(stampJavaScript(stampJavaScript(js, revision), nextRevision), stampJavaScript(js, nextRevision));
});

test('build copies and stamps the full module graph while keeping sources and binary assets untouched', async () => {
  const root = await mkdtemp(join(tmpdir(), 'split-pages-test-'));
  try {
    const source = join(root, 'site'), destination = join(root, '.pages');
    await mkdir(join(source, 'js'), {recursive:true});
    const files = {
      'index.html':'<link rel="stylesheet" href="style.css"><script type="module" src="js/main.js"></script>',
      'js/main.js':"import {a} from './core.js'; import './scene.js';",
      'js/core.js':"export {a} from './config.js';",
      'js/config.js':'export const a = 1;',
      'js/scene.js':"import {a} from './core.js'; const scene = new URL('../scene.webp', import.meta.url);",
      'style.css':"@font-face{src:url('font.ttf')} body{color:green}",
      'scene.webp':Buffer.from([0, 255, 12, 35]),
      'font.ttf':Buffer.from([0, 1, 0, 0])
    };
    for (const [path, content] of Object.entries(files)) await writeFile(join(source, path), content);
    assert.deepEqual(await buildPages({revision, source, destination}), {revision, destination});
    for (const [path, content] of Object.entries(files)){
      assert.deepEqual(await readFile(join(source, path)), Buffer.from(content), 'source modified: ' + path);
      const expected = path.endsWith('.js') ? stampJavaScript(content, revision) : path.endsWith('.html') ? stampHtml(content, revision) : content;
      assert.deepEqual(await readFile(join(destination, path)), Buffer.from(expected), path);
    }
    await writeFile(join(destination, 'stale.txt'), 'remove on rebuild');
    await buildPages({revision:nextRevision, source, destination});
    await assert.rejects(readFile(join(destination, 'stale.txt')), {code:'ENOENT'});
    assert.ok((await readFile(join(destination, 'js/main.js'), 'utf8')).includes('?v=' + nextRevision));
    assert.equal(await readFile(join(source, 'js/main.js'), 'utf8'), files['js/main.js']);
  } finally { await rm(root, {recursive:true, force:true}); }
});

test('invalid revisions and unsafe output paths fail before altering an existing build', async () => {
  const root = await mkdtemp(join(tmpdir(), 'split-pages-validation-'));
  try {
    const source = join(root, 'site'), destination = join(root, '.pages');
    await mkdir(source); await mkdir(destination); await writeFile(join(destination, 'keep.txt'), 'keep');
    await assert.rejects(buildPages({revision:'not-a-revision', source, destination}), /Git revision/);
    assert.equal(await readFile(join(destination, 'keep.txt'), 'utf8'), 'keep');
    for (const output of [source, join(source, 'nested'), root]){
      await assert.rejects(buildPages({revision, source, destination:output}), /separate from the source/);
    }
  } finally { await rm(root, {recursive:true, force:true}); }
});
