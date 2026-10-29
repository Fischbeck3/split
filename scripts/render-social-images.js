// Render one link-preview image per glass into site/og/, from the game's own
// scene and vessel drawing. Run after adding or scheduling a new glass:
//   npm install --no-save @napi-rs/canvas && node scripts/render-social-images.js
// The images are committed; the deploy build only links to them.
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dayPages, socialImagePath, socialHeadline} from './social-pages.js';

let canvasLibrary;
try { canvasLibrary = await import('@napi-rs/canvas'); }
catch { throw new Error('Install the renderer first: npm install --no-save @napi-rs/canvas'); }
const {createCanvas, Image: CanvasImage, GlobalFonts} = canvasLibrary;

// The drawing modules expect a browser: give them canvases and file-backed images.
globalThis.document = {createElement: tag => {
  if (tag !== 'canvas') throw new Error('Only canvases are available here.');
  return createCanvas(1, 1);
}};
globalThis.Image = class {
  set src(url){
    this._src = url;
    readFile(fileURLToPath(url)).then(data => {
      const image = new CanvasImage();
      image.onload = () => { this._image = image; this.onload?.(); };
      image.onerror = error => this.onerror?.(error);
      image.src = data;
    }, error => this.onerror?.(error));
  }
  get src(){ return this._src; }
  get naturalWidth(){ return this._image.width; }
  get naturalHeight(){ return this._image.height; }
  get width(){ return this._image.width; }
  get height(){ return this._image.height; }
  decode(){ return Promise.resolve(); }
};
// drawImage needs the decoded image itself, not the wrapper.
const unwrap = value => value?._image || value;
const context = createCanvas(1, 1).getContext('2d'), prototype = Object.getPrototypeOf(context);
const drawImage = prototype.drawImage, createPattern = prototype.createPattern;
prototype.drawImage = function(image, ...rest){ return drawImage.call(this, unwrap(image), ...rest); };
if (createPattern) prototype.createPattern = function(image, ...rest){ return createPattern.call(this, unwrap(image), ...rest); };

const fonts = new URL('../site/fonts/', import.meta.url);
GlobalFonts.registerFromPath(fileURLToPath(new URL('fraunces.ttf', fonts)), 'Fraunces');
for (const weight of [400, 600, 700]) GlobalFonts.registerFromPath(fileURLToPath(new URL('karla-' + weight + '.ttf', fonts)), 'Karla');

const {drawScene, loadSceneAssets} = await import('../site/js/draw.js');
const {renderVessel} = await import('../site/js/render-vessels.js');
const {startLevel} = await import('../site/js/core.js');

const W = 1200, H = 630, PHOTO_W = 540, DISPLAY = 'Fraunces, Georgia, serif', BODY = 'Karla, Arial, sans-serif';

function wrap(c, text, maxWidth){
  const lines = [];
  for (const word of text.split(' ')){
    const line = lines.length ? lines.at(-1) + ' ' + word : word;
    if (lines.length && c.measureText(line).width <= maxWidth) lines[lines.length - 1] = line;
    else lines.push(word);
  }
  return lines;
}

function palette(theme){
  const p = theme.palette || {bg:'#101b17', fg:'#eee7d6', sheet:'#1d2a23', accent:'#d9b874', accentFg:'#17221b'};
  const paperCard = theme.scene === 'pub' || theme.colorScheme === 'dark';
  return {paper: paperCard ? p.fg : p.sheet, ink: paperCard ? p.accentFg : p.fg};
}

async function render(P){
  const {theme} = P;
  await loadSceneAssets(theme);
  const canvas = createCanvas(W, H), c = canvas.getContext('2d'), colors = palette(theme);
  const photo = createCanvas(PHOTO_W, H), scene = photo.getContext('2d');
  // The postcard's glass, scaled to this panel and poured to the brim: the dare, before the first sip.
  const scale = 500 / 642, halfW = (theme.vessel === 'bottle' ? 128 : theme.vessel === 'stein' ? 200 : 190) * scale;
  const G = {cx:PHOTO_W / 2, top:66, bot:566, halfW, glass:renderVessel(theme)};
  drawScene(scene, {G, w:PHOTO_W, h:H, L:startLevel(theme), theme, P, bubbles:false, titleWash:false});
  c.fillStyle = colors.paper; c.fillRect(0, 0, W, H);
  c.drawImage(photo, 0, 0);

  const x = PHOTO_W + 60, maxWidth = W - x - 60;
  c.fillStyle = colors.ink; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  c.font = '900 52px ' + DISPLAY; c.fillText('Split.', x, 106);
  let size = 76; c.font = '900 ' + size + 'px ' + DISPLAY;
  let lines = wrap(c, socialHeadline(theme), maxWidth);
  while ((lines.length > 3 || lines.some(line => c.measureText(line).width > maxWidth)) && size > 44){
    size -= 2; c.font = '900 ' + size + 'px ' + DISPLAY; lines = wrap(c, socialHeadline(theme), maxWidth);
  }
  const lead = size * 1.08, top = 300 - (lines.length - 1) * lead / 2;
  lines.forEach((line, index) => c.fillText(line, x, top + index * lead));
  c.font = '700 28px ' + BODY;
  c.fillText(theme.label + ' · ' + theme.name, x, top + (lines.length - 1) * lead + 58, maxWidth);
  c.globalAlpha = .25; c.fillRect(x, 516, maxWidth, 2); c.globalAlpha = 1;
  c.font = '600 25px ' + BODY; c.fillText('One glass a day. Three sips. Beat your friends.', x, 560, maxWidth);
  c.font = '700 25px ' + BODY; c.fillText('dailysplit.us', x, 596);
  return canvas.encode('jpeg', 86);
}

const output = new URL('../site/', import.meta.url), seen = new Map();
for (const P of dayPages()) if (!seen.has(P.theme.id)) seen.set(P.theme.id, P);
await mkdir(new URL(socialImagePath({id:'x'}).replace(/[^/]+$/, ''), output), {recursive:true});
const only = process.argv.slice(2);
for (const [id, P] of seen){
  if (only.length && !only.includes(id)) continue;
  await writeFile(new URL(socialImagePath(P.theme), output), await render(P));
  console.log('Rendered ' + socialImagePath(P.theme));
}
