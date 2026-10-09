// Canvas drawing: the places, the vessels and the marks.
import {widthAt, mulberry32} from './core.js';
import {getLiquidSurface} from './liquid.js';
import {memoryScenePlacement, memoryMotion, MEMORY_DETAILS} from './ambient.js';
import {createHearthMotion, updateHearthMotion} from './hearth.js';

export const SCENES = ['pub', 'beach', 'munich', 'bar'];
export const MARKS = ['letter', 'crown', 'crest', 'star', 'apple', 'shamrock', 'hop', 'bean', 'leaf'];
const SERIF = 'Fraunces, "Playfair Display", Georgia, serif';
const SANS = 'Karla, sans-serif';
const SCENE_ART = {
  pub: {url: new URL('../assets/scenes/irish-pub.webp', import.meta.url).href, table: .606},
  beach: {url: new URL('../assets/scenes/cabo-beach.webp', import.meta.url).href, table: .627},
  munich: {url: new URL('../assets/scenes/munich-oktoberfest.webp', import.meta.url).href, table: .636}
};
const sceneImages = new Map(), sceneLoads = new Map();

/** Decode once before painting a game or export. A failed asset keeps the vector fallback. */
export async function loadSceneAssets(theme){
  const scenes = theme ? [theme.scene] : Object.keys(SCENE_ART);
  await Promise.all(scenes.map(scene => {
    if (!SCENE_ART[scene]) return;
    if (!sceneLoads.has(scene)) sceneLoads.set(scene, new Promise(resolve => {
      const image = new Image();
      image.onload = async () => {
        try { await image.decode(); } catch { /* onload already supplied valid pixels */ }
        sceneImages.set(scene, image); resolve();
      };
      image.onerror = () => resolve();
      image.src = SCENE_ART[scene].url;
    }));
    return sceneLoads.get(scene);
  }));
}

function drawMemoryBackdrop(c, w, h, G, theme, titleWash){
  const image = sceneImages.get(theme.scene), art = SCENE_ART[theme.scene];
  if (!image || !art) return false;
  // Anchor the illustrated tabletop to the vessel rather than to the viewport.
  const iw = image.naturalWidth, ih = image.naturalHeight;
  const {x, y, scale} = memoryScenePlacement(w, h, G, {width: iw, height: ih, table: art.table});
  c.drawImage(image, x, y, iw * scale, ih * scale);
  if (!titleWash) return true;
  drawTitleWash(c, w, h, theme.scene === 'pub');
  return true;
}
function drawTitleWash(c, w, h, dark){
  // The title lives on a quiet area of the place, while the vessel retains full contrast.
  const wash = c.createLinearGradient(0, 0, 0, h * .35);
  wash.addColorStop(0, dark ? 'rgba(16,27,23,.94)' : 'rgba(246,240,227,.96)');
  wash.addColorStop(.42, dark ? 'rgba(16,27,23,.68)' : 'rgba(246,240,227,.78)');
  wash.addColorStop(1, dark ? 'rgba(16,27,23,0)' : 'rgba(246,240,227,0)');
  c.fillStyle = wash; c.fillRect(0, 0, w, h * .35);
}

function roundedRect(c, x, y, w, h, r){
  c.beginPath();
  if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h);
}
function woodTable(c, w, h, y, palette){
  const g = c.createLinearGradient(0, y, 0, h);
  g.addColorStop(0, palette[0]); g.addColorStop(0.12, palette[1]); g.addColorStop(1, palette[2]);
  c.fillStyle = g; c.fillRect(0, y, w, h - y);
  c.fillStyle = 'rgba(255,242,211,0.22)'; c.fillRect(0, y, w, Math.max(1, h * 0.003));
  c.strokeStyle = 'rgba(30,19,10,0.16)'; c.lineWidth = Math.max(1, w * 0.002);
  for (let i = 1; i < 5; i++){
    const yy = y + (h - y) * i / 4;
    c.beginPath(); c.moveTo(0, yy); c.lineTo(w, yy); c.stroke();
  }
}

// ---------- places ----------
export function drawBackdrop(c, w, h, G, theme, titleWash = true){
  if (drawMemoryBackdrop(c, w, h, G, theme, titleWash)) return;
  const sc = theme.scene; let g;
  if (sc === 'pub'){
    g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#101b17'); g.addColorStop(0.6, '#23332a'); g.addColorStop(1, '#15221b'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    const ct = G.bot - h * 0.006, rail = Math.min(ct - h * 0.025, h * 0.47);
    c.fillStyle = '#19271f'; c.fillRect(0, rail, w, ct - rail);
    c.strokeStyle = 'rgba(219,184,116,0.13)'; c.lineWidth = Math.max(1, w * 0.004);
    const step = w / 4;
    for (let x = -step / 2; x < w; x += step){
      c.strokeRect(x + step * 0.12, h * 0.055, step * 0.76, rail - h * 0.095);
      c.strokeRect(x + step * 0.12, rail + h * 0.022, step * 0.76, Math.max(0, ct - rail - h * 0.044));
    }
    c.fillStyle = '#344034'; c.fillRect(0, rail, w, h * 0.009);
    c.fillStyle = 'rgba(219,184,116,0.19)'; c.fillRect(0, rail, w, Math.max(1, h * 0.002));
    for (const lx of [0.13, 0.87]){
      const x = w * lx, y = h * 0.245, s = Math.min(w * 0.072, h * 0.04);
      const light = c.createRadialGradient(x, y, s * 0.25, x, y, h * 0.17);
      light.addColorStop(0, 'rgba(241,181,82,0.24)'); light.addColorStop(1, 'rgba(241,181,82,0)'); c.fillStyle = light; c.fillRect(0, 0, w, ct);
      c.fillStyle = '#9e7946'; roundedRect(c, x - s * 0.3, y - s * 0.62, s * 0.6, s * 1.9, s * 0.13); c.fill();
      c.fillStyle = '#e0bd75'; roundedRect(c, x - s * 0.62, y - s * 0.72, s * 1.24, s * 1.06, s * 0.18); c.fill();
      c.fillStyle = '#fae3ac'; roundedRect(c, x - s * 0.52, y - s * 0.58, s * 1.04, s * 0.72, s * 0.12); c.fill();
      c.fillStyle = '#715231'; c.fillRect(x - s * 0.68, y + s * 0.28, s * 1.36, s * 0.14);
    }
    woodTable(c, w, h, ct, ['#8a6038', '#51361f', '#211a13']);
    c.fillStyle = '#ae8a53'; c.fillRect(0, ct + h * 0.027, w, h * 0.005);
    return;
  }
  if (sc === 'beach'){
    const horizon = h * 0.385, shore = h * 0.53;
    g = c.createLinearGradient(0, 0, 0, horizon); g.addColorStop(0, '#c7e6e8'); g.addColorStop(1, '#e6f2ee'); c.fillStyle = g; c.fillRect(0, 0, w, horizon);
    const sx = w * 0.84, sy = h * 0.22, sr = Math.min(w * 0.07, h * 0.038);
    c.fillStyle = '#fff8df'; c.beginPath(); c.arc(sx, sy, sr, 0, Math.PI * 2); c.fill();
    g = c.createLinearGradient(0, horizon, 0, shore); g.addColorStop(0, '#51b3be'); g.addColorStop(0.42, '#71ced0'); g.addColorStop(1, '#b5e6db'); c.fillStyle = g; c.fillRect(0, horizon, w, shore - horizon);
    c.fillStyle = 'rgba(255,255,255,0.48)'; c.fillRect(0, horizon, w, Math.max(1, h * 0.002));
    c.strokeStyle = 'rgba(255,255,255,0.62)'; c.lineWidth = Math.max(1, h * 0.0025);
    for (const [start, end, yy] of [[0.02, 0.3, 0.44], [0.72, 0.94, 0.465], [0.04, 0.25, 0.495]]){
      c.beginPath(); c.moveTo(w * start, h * yy); c.quadraticCurveTo(w * (start + end) / 2, h * (yy - 0.006), w * end, h * yy); c.stroke();
    }
    g = c.createLinearGradient(0, shore, 0, h); g.addColorStop(0, '#fff9ed'); g.addColorStop(1, '#f0e8d5'); c.fillStyle = g; c.fillRect(0, shore, w, h - shore);
    c.fillStyle = '#edf8ed'; c.beginPath(); c.moveTo(0, shore); c.quadraticCurveTo(w * 0.28, shore - h * 0.008, w * 0.51, shore + h * 0.004); c.quadraticCurveTo(w * 0.73, shore + h * 0.015, w, shore - h * 0.002); c.lineTo(w, shore + h * 0.009); c.quadraticCurveTo(w * 0.52, shore + h * 0.023, 0, shore + h * 0.01); c.closePath(); c.fill();
    const r = mulberry32(11); c.fillStyle = 'rgba(131,119,81,0.13)'; for (let i = 0; i < 32; i++){
      const x = r() * w, y = shore + h * 0.035 + r() * (h - shore - h * 0.035);
      c.beginPath(); c.ellipse(x, y, w * 0.004, h * 0.0009, -0.2, 0, Math.PI * 2); c.fill();
    }
    const fronds = [[0.27, 0.035, 5], [0.22, 0.1, 5], [0.13, 0.17, 4]];
    c.strokeStyle = '#67957c'; c.lineCap = 'round';
    for (const [ex, ey, lw] of fronds){ c.lineWidth = lw * (w / 400); c.beginPath(); c.moveTo(-w * 0.035, -h * 0.018); c.quadraticCurveTo(w * 0.11, h * 0.025, w * ex, h * ey); c.stroke(); }
    c.strokeStyle = '#7da78e'; c.lineWidth = Math.max(1, w * 0.003);
    for (const [ex, ey] of fronds){
      for (let k = 1; k <= 6; k++){
        const t = k / 7, u = 1 - t, x = u * u * (-w * 0.035) + 2 * u * t * (w * 0.11) + t * t * (w * ex), y = u * u * (-h * 0.018) + 2 * u * t * (h * 0.025) + t * t * (h * ey);
        c.beginPath(); c.moveTo(x, y); c.lineTo(x - w * 0.018, y + h * 0.026); c.moveTo(x, y); c.lineTo(x + w * 0.035, y + h * 0.01); c.stroke();
      }
    }
    return;
  }
  if (sc === 'munich'){
    const tt = G.bot - h * 0.007;
    g = c.createLinearGradient(0, 0, 0, tt); g.addColorStop(0, '#f0f5f7'); g.addColorStop(1, '#e4edf1'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = '#faf9ee'; c.beginPath(); c.moveTo(w * 0.5, -h * 0.07); c.lineTo(w * 1.08, h * 0.25); c.lineTo(w, tt); c.lineTo(0, tt); c.lineTo(-w * 0.08, h * 0.25); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(165,168,155,0.22)'; c.lineWidth = Math.max(1, w * 0.003);
    for (const x of [0.08, 0.25, 0.75, 0.92]){ c.beginPath(); c.moveTo(w * 0.5, -h * 0.07); c.lineTo(w * x, h * 0.3); c.lineTo(w * x, tt); c.stroke(); }
    c.fillStyle = '#b7a78e'; c.fillRect(w * 0.035, h * 0.17, w * 0.015, tt - h * 0.17); c.fillRect(w * 0.95, h * 0.17, w * 0.015, tt - h * 0.17);
    const y0 = Math.min(h * .24, G.top - h * .075), sag = h * 0.025, n = 10;
    c.strokeStyle = '#a8b9c4'; c.lineWidth = Math.max(1, w * 0.002); c.beginPath(); c.moveTo(0, y0); c.quadraticCurveTo(w / 2, y0 + sag * 2, w, y0); c.stroke();
    for (let i = 0; i < n; i++){
      const t = (i + 0.5) / n, x = w * t, y = y0 + 4 * sag * t * (1 - t), fw = w / n * 0.4, fh = h * 0.035;
      c.fillStyle = i % 2 ? '#fbfcf8' : '#4b89b5'; c.beginPath(); c.moveTo(x - fw, y); c.lineTo(x + fw, y); c.lineTo(x, y + fh); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(71,119,151,0.2)'; c.lineWidth = Math.max(0.6, w * 0.001); c.stroke();
    }
    woodTable(c, w, h, tt, ['#d2aa6b', '#b1894f', '#785a33']);
    return;
  }
  g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2b2018'); g.addColorStop(1, '#120d0a'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  const vg = c.createRadialGradient(w / 2, h * 0.45, h * 0.1, w / 2, h * 0.45, h * 0.8); vg.addColorStop(0, 'rgba(255,220,170,0.10)'); vg.addColorStop(1, 'rgba(0,0,0,0.35)'); c.fillStyle = vg; c.fillRect(0, 0, w, h);
}
/** The backdrop rendered once into its own canvas, so frames only copy it. */
export function makeBackdrop(w, h, G, theme, dpr, {titleWash = true} = {}){
  const cv = document.createElement('canvas'); cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); drawBackdrop(g, w, h, G, theme, titleWash);
  return cv;
}

// Small, feathered copies of the actual painting, including its title wash. Each
// cached backdrop builds these once; a frame moves only the selected detail.
// Keeping this cache on the backdrop also releases old patches after a resize.
const memoryPatches = new WeakMap(), ambientBackdrops = new WeakMap();
function makeMemoryPatches(backdrop, w, h, G, theme){
  if (memoryPatches.has(backdrop)) return memoryPatches.get(backdrop);
  const image = sceneImages.get(theme.scene), art = SCENE_ART[theme.scene], details = MEMORY_DETAILS[theme.scene];
  if (!image || !art || !details) return null;
  const iw = image.naturalWidth, ih = image.naturalHeight, dpr = backdrop.width / w;
  const placement = memoryScenePlacement(w, h, G, {width: iw, height: ih, table: art.table});
  const point = ([x, y]) => [placement.x + x * iw * placement.scale, placement.y + y * ih * placement.scale];
  const patches = [];
  for (const detail of details){
    const [x, y] = point(detail.box), width = detail.box[2] * iw * placement.scale, height = detail.box[3] * ih * placement.scale;
    if (x + width < 0 || x > w || y + height < 0 || y > h) continue;
    if (detail.kind === 'fire'){
      const cv = document.createElement('canvas');
      cv.width = Math.round(detail.box[2] * iw); cv.height = Math.round(detail.box[3] * ih);
      const p = cv.getContext('2d', {willReadFrequently: true});
      p.drawImage(image, detail.box[0] * iw, detail.box[1] * ih, cv.width, cv.height, 0, 0, cv.width, cv.height);
      const hearth = createHearthMotion(p.getImageData(0, 0, cv.width, cv.height), Math.round((detail.base - detail.box[1]) * ih));
      patches.push({canvas: cv, context: p, hearth, x, y, width, height, kind: detail.kind});
      continue;
    }
    const cv = document.createElement('canvas'); cv.width = Math.ceil(width * dpr); cv.height = Math.ceil(height * dpr);
    const p = cv.getContext('2d'); p.setTransform(dpr, 0, 0, dpr, 0, 0);
    p.save(); p.beginPath();
    if (detail.ellipse) p.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
    else if (detail.polygon){
      for (const [i, coordinate] of detail.polygon.entries()){
        const [px, py] = point(coordinate);
        if (!i) p.moveTo(px - x, py - y); else p.lineTo(px - x, py - y);
      }
      p.closePath();
    } else p.rect(0, 0, width, height);
    p.clip(); p.drawImage(backdrop, -x, -y, w, h); p.restore();
    // Fade all four outer edges so a shifted source slice has no visible seam.
    p.globalCompositeOperation = 'destination-in';
    const feather = Math.min(5, width * .1, height * .1);
    for (const [length, vertical] of [[width, false], [height, true]]){
      const mask = p.createLinearGradient(0, 0, vertical ? 0 : length, vertical ? length : 0);
      mask.addColorStop(0, 'rgba(0,0,0,0)'); mask.addColorStop(feather / length, '#000');
      mask.addColorStop(1 - feather / length, '#000'); mask.addColorStop(1, 'rgba(0,0,0,0)');
      p.fillStyle = mask; p.fillRect(0, 0, width, height);
    }
    patches.push({canvas: cv, x, y, width, height, kind: detail.kind});
  }
  const data = {patches, placement, iw, ih}; memoryPatches.set(backdrop, data); return data;
}
function drawMemoryLife(c, {w, h, G, theme, now, backdrop, titleWash}){
  if (!sceneImages.has(theme.scene) || !MEMORY_DETAILS[theme.scene]) return;
  // Consumers without a cached backdrop still get one stable base per layout.
  if (!backdrop){
    const key = [theme.scene, w, h, G.bot, titleWash].join(':');
    let cache = ambientBackdrops.get(c.canvas);
    if (!cache || cache.key !== key){ cache = {key, backdrop: makeBackdrop(w, h, G, theme, 1, {titleWash})}; ambientBackdrops.set(c.canvas, cache); }
    backdrop = cache.backdrop;
  }
  const data = makeMemoryPatches(backdrop, w, h, G, theme);
  if (!data) return;
  const motion = memoryMotion(now), t = Number.isFinite(now) ? now / 1000 : 0, scale = data.placement.scale;
  c.save();
  for (const patch of data.patches){
    const {canvas, x, y, width, height, kind} = patch;
    c.save(); c.beginPath(); c.rect(x, y, width, height); c.clip();
    if (kind === 'fire'){
      if (updateHearthMotion(patch.hearth, now)) patch.context.putImageData(patch.hearth.frame, 0, 0);
      c.drawImage(canvas, x, y, width, height);
      // The heat matte needs raw luminous paint. Reapply the same global wash
      // inside this clip so the animated crop blends into the cached backdrop.
      if (titleWash) drawTitleWash(c, w, h, true);
    } else {
      const strips = kind === 'cloth' ? 7 : kind === 'surf' ? 11 : 5;
      for (let i = 0; i < strips; i++){
        const sourceY = canvas.height * i / strips, sourceH = canvas.height / strips;
        const rowY = height * i / strips, rowH = height / strips;
        const dx = kind === 'cloth'
          ? motion.breeze * 2.8 * scale * Math.sin(Math.PI * i / strips)
          : Math.sin(t * .9 + i * .4) * (kind === 'surf' ? 3.2 : 1.8) * scale;
        const dy = kind === 'cloth' ? 0 : motion.surf * (kind === 'surf' ? 2.4 : .7) * scale;
        c.drawImage(canvas, 0, sourceY, canvas.width, sourceH, x + dx, y + rowY + dy, width, rowH + .5);
      }
    }
    c.restore();
  }
  c.restore();
}

// ---------- vessels ----------
export function glassPath(c, G){
  const n = 56, gh = G.bot - G.top, wb = widthAt(G.glass, 1) * G.halfW, r = Math.min(gh * 0.032, wb * 0.22), tEnd = 1 - r / gh;
  c.beginPath();
  for (let i = 0; i <= n; i++){ const t = tEnd * i / n, w = widthAt(G.glass, t) * G.halfW, y = G.top + t * gh; if (i === 0) c.moveTo(G.cx - w, y); else c.lineTo(G.cx - w, y); }
  c.quadraticCurveTo(G.cx - wb, G.bot, G.cx - wb + r, G.bot); c.lineTo(G.cx + wb - r, G.bot); c.quadraticCurveTo(G.cx + wb, G.bot, G.cx + wb, G.bot - r);
  for (let i = n; i >= 0; i--){ const t = tEnd * i / n, w = widthAt(G.glass, t) * G.halfW, y = G.top + t * gh; c.lineTo(G.cx + w, y); }
  c.closePath();
}
function contour(c, G, side, from, to, inset = 0){
  const gh = G.bot - G.top;
  c.beginPath();
  for (let i = 0; i <= 24; i++){
    const t = from + (to - from) * i / 24, x = G.cx + side * (widthAt(G.glass, t) * G.halfW - inset), y = G.top + gh * t;
    if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
  }
}
function drawVesselBehind(c, G, theme){
  if (theme.vessel !== 'mug' && theme.vessel !== 'stein') return;
  const gh = G.bot - G.top, big = theme.vessel === 'stein';
  c.save(); c.lineCap = 'round';
  const x = G.cx + G.halfW * (big ? 0.87 : 0.95), cy = G.top + gh * 0.49, rx = G.halfW * (big ? 0.52 : 0.42), ry = gh * (big ? 0.247 : 0.22);
  c.beginPath(); c.moveTo(x, cy - ry); c.bezierCurveTo(x + rx * 1.05, cy - ry, x + rx * 1.08, cy - ry * 0.72, x + rx, cy); c.bezierCurveTo(x + rx * 1.08, cy + ry * 0.72, x + rx * 1.05, cy + ry, x, cy + ry);
  c.strokeStyle = big ? 'rgba(87,113,120,0.65)' : 'rgba(255,255,255,0.38)'; c.lineWidth = G.halfW * (big ? 0.29 : 0.2); c.stroke();
  const glass = c.createLinearGradient(x, cy, x + rx, cy); glass.addColorStop(0, 'rgba(237,246,239,0.88)'); glass.addColorStop(0.5, 'rgba(223,236,224,0.66)'); glass.addColorStop(1, 'rgba(255,255,248,0.96)');
  c.strokeStyle = big ? glass : 'rgba(255,255,255,0.3)'; c.lineWidth = G.halfW * (big ? 0.23 : 0.12); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.96)'; c.lineWidth = Math.max(1, G.halfW * 0.034); c.stroke();
  if (big){
    c.strokeStyle = 'rgba(95,124,130,0.21)'; c.lineWidth = G.halfW * 0.025;
    c.beginPath(); c.moveTo(x + G.halfW * 0.06, cy - ry * 0.91); c.bezierCurveTo(x + rx * 0.77, cy - ry * 0.86, x + rx * 0.75, cy + ry * 0.84, x + G.halfW * 0.06, cy + ry * 0.9); c.stroke();
  }
  c.restore();
}
function drawVesselFront(c, G, theme){
  const gh = G.bot - G.top;
  if (theme.vessel === 'stein'){
    c.save(); glassPath(c, G); c.clip();
    const r = Math.min(G.halfW * 0.17, gh * 0.049), cols = 4, rows = Math.max(1, Math.floor(gh * 0.64 / (r * 2.58)));
    for (let j = 0; j < rows; j++){
      for (let i = 0; i < cols; i++){
        const x = G.cx + (i - (cols - 1) / 2) * G.halfW * 0.44, y = G.top + gh * 0.2 + j * r * 2.58;
        const rg = c.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.05, x, y, r);
        rg.addColorStop(0, 'rgba(255,255,249,0.44)'); rg.addColorStop(0.48, 'rgba(255,255,255,0.03)'); rg.addColorStop(0.78, 'rgba(144,122,77,0.02)'); rg.addColorStop(1, 'rgba(91,68,34,0.24)');
        c.fillStyle = rg; c.beginPath(); c.ellipse(x, y, r * 0.9, r, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = 'rgba(255,255,255,0.38)'; c.lineWidth = Math.max(1, gh * 0.004);
        c.beginPath(); c.ellipse(x, y, r * 0.9, r, 0, Math.PI * 1.05, Math.PI * 1.8); c.stroke();
        c.strokeStyle = 'rgba(94,93,51,0.12)'; c.beginPath(); c.ellipse(x, y, r * 0.81, r * 0.88, 0, 0.05, Math.PI * 0.68); c.stroke();
      }
    }
    c.restore();
  }
  if (theme.vessel === 'bottle'){
    const mw = widthAt('bottle', 0) * G.halfW, rr = gh * 0.046;
    c.strokeStyle = 'rgba(235,250,233,0.8)'; c.lineWidth = Math.max(1.3, gh * 0.009);
    for (const depth of [0.015, 0.038]){
      c.beginPath(); c.ellipse(G.cx, G.top + gh * depth, mw * 0.93, gh * 0.006, 0, 0, Math.PI * 2); c.stroke();
    }
    c.fillStyle = 'rgba(56,93,75,0.16)'; c.beginPath(); c.ellipse(G.cx, G.top + gh * 0.004, mw * 0.89, gh * 0.009, 0, 0, Math.PI * 2); c.fill();
    c.save(); c.translate(G.cx + mw * 0.38, G.top + rr * 0.28); c.rotate(-0.34);
    c.fillStyle = '#6b9b43'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, rr, Math.PI, Math.PI * 2); c.closePath(); c.fill();
    c.fillStyle = '#d6eaa4'; c.beginPath(); c.moveTo(0, -rr * 0.09); c.arc(0, -rr * 0.09, rr * 0.78, Math.PI * 1.05, Math.PI * 1.95); c.closePath(); c.fill();
    c.strokeStyle = '#56783a'; c.lineWidth = Math.max(1, rr * 0.07); c.beginPath(); c.arc(0, 0, rr, Math.PI, Math.PI * 2); c.stroke();
    c.strokeStyle = 'rgba(106,144,63,0.65)'; c.lineWidth = Math.max(0.75, rr * 0.04);
    for (let k = -2; k <= 2; k++){ c.beginPath(); c.moveTo(0, -rr * 0.06); c.lineTo(Math.cos(Math.PI * (1.5 + k * 0.2)) * rr * 0.7, -rr * 0.06 + Math.sin(Math.PI * (1.5 + k * 0.2)) * rr * 0.7); c.stroke(); }
    c.restore();
  }
  // The printed brand sits below the scored mark, so the liquid line stays legible.
  c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
  if (theme.id === 'pub'){
    c.fillStyle = '#eee7d6'; c.font = '700 ' + Math.min(gh * 0.048, G.halfW * 0.2) + 'px ' + SERIF;
    c.fillText('GUINNESS', G.cx, G.top + gh * 0.82);
    c.strokeStyle = 'rgba(238,231,214,0.35)'; c.lineWidth = Math.max(0.8, gh * 0.002);
    c.beginPath(); c.moveTo(G.cx - G.halfW * 0.42, G.top + gh * 0.863); c.lineTo(G.cx + G.halfW * 0.42, G.top + gh * 0.863); c.stroke();
  } else if (theme.id === 'beach'){
    c.fillStyle = '#163e55'; c.font = '600 ' + Math.min(gh * 0.075, G.halfW * 0.34) + 'px ' + SERIF;
    c.fillText('Corona', G.cx, G.top + gh * 0.8);
    c.font = '700 ' + gh * 0.023 + 'px ' + SANS; c.fillText('CERVEZA', G.cx, G.top + gh * 0.858);
  } else if (theme.id === 'munich'){
    c.fillStyle = 'rgba(53,74,81,0.68)'; c.font = '700 ' + gh * 0.028 + 'px ' + SANS;
    c.fillText('1 L', G.cx, G.top + gh * 0.875);
  }
  c.restore();
}
function drawGlassMaterial(c, G, theme){
  const gh = G.bot - G.top, bottle = theme.vessel === 'bottle', stein = theme.vessel === 'stein', rim = widthAt(G.glass, 0) * G.halfW, wb = widthAt(G.glass, 1) * G.halfW;
  c.save(); glassPath(c, G); c.clip();
  const glaze = c.createLinearGradient(G.cx - G.halfW, 0, G.cx + G.halfW, 0);
  glaze.addColorStop(0, 'rgba(132,170,151,0.24)'); glaze.addColorStop(0.06, 'rgba(255,255,243,0.36)'); glaze.addColorStop(0.17, 'rgba(255,255,255,0.04)'); glaze.addColorStop(0.78, 'rgba(255,255,255,0)'); glaze.addColorStop(0.96, 'rgba(235,246,225,0.24)'); glaze.addColorStop(1, 'rgba(79,121,111,0.28)');
  c.fillStyle = glaze; c.fillRect(G.cx - G.halfW, G.top, G.halfW * 2, gh);
  c.lineCap = 'round';
  const shine = c.createLinearGradient(0, G.top, 0, G.bot);
  shine.addColorStop(0, 'rgba(255,255,249,0.64)'); shine.addColorStop(0.45, 'rgba(255,255,249,0.36)'); shine.addColorStop(1, 'rgba(255,255,249,0.68)');
  c.strokeStyle = shine; c.lineWidth = G.halfW * (stein ? 0.065 : 0.045);
  contour(c, G, -1, bottle ? 0.065 : 0.035, 0.95, G.halfW * 0.052); c.stroke();
  c.strokeStyle = 'rgba(255,255,246,0.73)'; c.lineWidth = Math.max(0.8, G.halfW * 0.012);
  contour(c, G, -1, bottle ? 0.055 : 0.03, 0.92, G.halfW * 0.03); c.stroke();
  c.strokeStyle = 'rgba(255,255,246,0.28)'; c.lineWidth = G.halfW * (stein ? 0.046 : 0.028);
  contour(c, G, 1, bottle ? 0.08 : 0.05, 0.945, G.halfW * 0.057); c.stroke();
  const baseT = stein ? 0.057 : bottle ? 0.04 : 0.026, baseY = G.bot - gh * baseT;
  const base = c.createLinearGradient(0, baseY, 0, G.bot);
  base.addColorStop(0, 'rgba(132,165,140,0.27)'); base.addColorStop(0.55, 'rgba(250,255,235,0.69)'); base.addColorStop(1, 'rgba(106,140,120,0.35)');
  c.fillStyle = base; c.fillRect(G.cx - wb, baseY, wb * 2, gh * baseT);
  c.strokeStyle = 'rgba(248,255,241,0.73)'; c.lineWidth = Math.max(1, gh * 0.005);
  c.beginPath(); c.ellipse(G.cx, baseY + gh * baseT * 0.16, wb * 0.94, gh * baseT * 0.26, 0, 0, Math.PI); c.stroke();
  c.strokeStyle = 'rgba(255,255,250,0.78)'; c.lineWidth = Math.max(1, gh * 0.004);
  c.beginPath(); c.ellipse(G.cx, G.bot - gh * baseT * 0.27, wb * 0.89, gh * baseT * 0.18, 0, 0, Math.PI); c.stroke();
  if (bottle){
    c.strokeStyle = 'rgba(123,152,108,0.3)'; c.lineWidth = Math.max(1, gh * 0.005);
    c.beginPath(); c.ellipse(G.cx, G.bot - gh * 0.016, wb * 0.57, gh * 0.01, 0, Math.PI, Math.PI * 2); c.stroke();
    for (const d of CONDENSATION){
      const t = 0.39 + d.y * 0.53, x = G.cx + (d.x - 0.5) * 1.57 * widthAt(G.glass, t) * G.halfW, y = G.top + gh * t, r = gh * 0.0035 * d.s;
      c.fillStyle = 'rgba(242,253,236,0.24)'; c.beginPath(); c.ellipse(x, y, r * 0.8, r * 1.18, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(66,108,88,0.15)'; c.lineWidth = Math.max(0.5, gh * 0.001);
      c.beginPath(); c.ellipse(x, y, r * 0.8, r * 1.18, 0, 0, Math.PI * 0.85); c.stroke();
      c.fillStyle = 'rgba(255,255,250,0.65)'; c.beginPath(); c.arc(x - r * 0.21, y - r * 0.43, Math.max(0.4, r * 0.3), 0, Math.PI * 2); c.fill();
    }
  }
  c.restore();
  glassPath(c, G); c.strokeStyle = theme.scene === 'beach' ? 'rgba(68,109,92,0.53)' : theme.scene === 'munich' ? 'rgba(65,100,112,0.51)' : 'rgba(241,236,216,0.67)'; c.lineWidth = Math.max(1.2, gh * 0.0045); c.stroke();
  if (!bottle){
    c.strokeStyle = 'rgba(85,114,108,0.4)'; c.lineWidth = Math.max(1, gh * (stein ? 0.011 : 0.006));
    c.beginPath(); c.ellipse(G.cx, G.top + gh * 0.007, rim * 0.98, gh * (stein ? 0.015 : 0.011), 0, Math.PI, Math.PI * 2); c.stroke();
    c.strokeStyle = 'rgba(255,255,247,0.82)'; c.lineWidth = Math.max(1.3, gh * (stein ? 0.013 : 0.005));
    c.beginPath(); c.ellipse(G.cx, G.top + gh * 0.007, rim * 0.98, gh * (stein ? 0.015 : 0.011), 0, 0, Math.PI); c.stroke();
  }
}

// ---------- marks ----------
export function drawMark(c, theme, cx, cy, h){
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round'; c.lineWidth = Math.max(2, h * 0.07); c.strokeStyle = theme.markStroke; c.fillStyle = theme.markFill;
  if (theme.mark === 'letter'){
    const probe = 100; c.font = '900 ' + probe + 'px ' + SERIF; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    const m = c.measureText(theme.letter), gh0 = (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) || probe * 0.7;
    c.font = '900 ' + (probe * h / gh0) + 'px ' + SERIF;
    const m2 = c.measureText(theme.letter), base = cy + (m2.actualBoundingBoxAscent - m2.actualBoundingBoxDescent) / 2;
    c.strokeText(theme.letter, cx, base); c.fillText(theme.letter, cx, base);
  } else if (theme.mark === 'crown'){
    c.lineWidth = Math.max(1.5, h * 0.045);
    c.beginPath(); c.moveTo(cx - h * 0.49, cy + h * 0.5); c.lineTo(cx - h * 0.6, cy - h * 0.32); c.lineTo(cx - h * 0.25, cy + h * 0.035); c.lineTo(cx, cy - h * 0.5); c.lineTo(cx + h * 0.25, cy + h * 0.035); c.lineTo(cx + h * 0.6, cy - h * 0.32); c.lineTo(cx + h * 0.49, cy + h * 0.5); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = theme.markStroke; c.lineWidth = Math.max(1, h * 0.032);
    c.beginPath(); c.moveTo(cx - h * 0.39, cy + h * 0.3); c.lineTo(cx + h * 0.39, cy + h * 0.3); c.stroke();
  } else if (theme.mark === 'crest'){
    const sw = h * 0.84, shield = () => { c.beginPath(); c.moveTo(cx - sw / 2, cy - h / 2); c.lineTo(cx + sw / 2, cy - h / 2); c.lineTo(cx + sw / 2, cy + h * 0.1); c.quadraticCurveTo(cx + sw / 2, cy + h * 0.46, cx, cy + h / 2); c.quadraticCurveTo(cx - sw / 2, cy + h * 0.46, cx - sw / 2, cy + h * 0.1); c.closePath(); };
    c.save(); shield(); c.clip(); c.fillStyle = 'rgba(255,255,249,0.4)'; c.fillRect(cx - sw, cy - h, sw * 2, h * 2);
    c.globalAlpha *= 0.78; c.fillStyle = theme.markFill; const d = h * 0.3;
    for (let j = -3; j <= 3; j++){ for (let i = -2; i <= 2; i++){ const x = cx + i * d, y = cy + j * d; c.beginPath(); c.moveTo(x, y - d * 0.5); c.lineTo(x + d * 0.5, y); c.lineTo(x, y + d * 0.5); c.lineTo(x - d * 0.5, y); c.closePath(); c.fill(); } }
    c.restore(); shield(); c.strokeStyle = theme.markStroke; c.lineWidth = Math.max(2.5, h * 0.06); c.stroke();
  } else if (theme.mark === 'star'){
    c.beginPath(); for (let i = 0; i < 10; i++){ const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? h * 0.2 : h * 0.5; c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } c.closePath(); c.stroke(); c.fill();
  } else if (theme.mark === 'apple'){
    const body = () => { c.beginPath(); c.arc(cx - h * 0.17, cy + h * 0.07, h * 0.33, 0, Math.PI * 2); c.arc(cx + h * 0.17, cy + h * 0.07, h * 0.33, 0, Math.PI * 2); };
    body(); c.stroke(); body(); c.fill();
    c.strokeStyle = theme.markStroke; c.lineWidth = Math.max(2, h * 0.07); c.beginPath(); c.moveTo(cx, cy - h * 0.2); c.quadraticCurveTo(cx + h * 0.05, cy - h * 0.4, cx + h * 0.12, cy - h * 0.5); c.stroke();
    c.fillStyle = '#4f9a3c'; c.beginPath(); c.ellipse(cx + h * 0.2, cy - h * 0.36, h * 0.16, h * 0.08, -0.6, 0, Math.PI * 2); c.fill();
  } else if (theme.mark === 'shamrock'){
    const r = h * 0.2, leaves = () => { c.beginPath(); c.arc(cx, cy - r * 1.1, r, 0, Math.PI * 2); c.arc(cx - r * 1.05, cy + r * 0.5, r, 0, Math.PI * 2); c.arc(cx + r * 1.05, cy + r * 0.5, r, 0, Math.PI * 2); };
    leaves(); c.stroke(); leaves(); c.fill();
    c.strokeStyle = theme.markFill; c.lineWidth = Math.max(3, h * 0.09); c.beginPath(); c.moveTo(cx, cy + r * 0.3); c.quadraticCurveTo(cx + r * 0.3, cy + r * 1.6, cx + r * 0.9, cy + r * 2.4); c.stroke();
  } else if (theme.mark === 'hop'){
    c.beginPath(); c.moveTo(cx, cy - h * 0.5); c.bezierCurveTo(cx + h * 0.55, cy - h * 0.35, cx + h * 0.45, cy + h * 0.35, cx, cy + h * 0.5); c.bezierCurveTo(cx - h * 0.45, cy + h * 0.35, cx - h * 0.55, cy - h * 0.35, cx, cy - h * 0.5); c.closePath(); c.stroke(); c.fill();
    c.strokeStyle = theme.markStroke; c.lineWidth = Math.max(1.5, h * 0.04);
    for (let i = -1; i <= 1; i++){ c.beginPath(); c.moveTo(cx, cy - h * 0.1 + i * h * 0.22); c.quadraticCurveTo(cx + h * 0.22, cy + i * h * 0.22, cx + h * 0.3, cy + h * 0.18 + i * h * 0.22); c.moveTo(cx, cy - h * 0.1 + i * h * 0.22); c.quadraticCurveTo(cx - h * 0.22, cy + i * h * 0.22, cx - h * 0.3, cy + h * 0.18 + i * h * 0.22); c.stroke(); }
  } else if (theme.mark === 'bean'){
    c.save(); c.translate(cx, cy); c.rotate(-0.5); c.beginPath(); c.ellipse(0, 0, h * 0.3, h * 0.48, 0, 0, Math.PI * 2); c.stroke(); c.fill();
    c.strokeStyle = theme.markStroke; c.lineWidth = Math.max(2, h * 0.07); c.beginPath(); c.moveTo(0, -h * 0.44); c.bezierCurveTo(h * 0.18, -h * 0.15, -h * 0.18, h * 0.15, 0, h * 0.44); c.stroke(); c.restore();
  } else if (theme.mark === 'leaf'){
    c.beginPath(); c.moveTo(cx, cy - h * 0.5); c.quadraticCurveTo(cx + h * 0.5, cy - h * 0.1, cx, cy + h * 0.5); c.quadraticCurveTo(cx - h * 0.5, cy - h * 0.1, cx, cy - h * 0.5); c.closePath(); c.stroke(); c.fill();
    c.strokeStyle = theme.markStroke; c.lineWidth = Math.max(1.5, h * 0.045); c.beginPath(); c.moveTo(cx, cy - h * 0.42); c.lineTo(cx, cy + h * 0.42); c.stroke();
  }
  c.restore();
}

// ---------- the whole scene ----------
function seededDetail(seed, count){
  const r = mulberry32(seed), out = [];
  for (let i = 0; i < count; i++) out.push({x: r(), y: r(), s: 0.55 + r() * 0.9, v: 0.4 + r() * 0.8});
  return out;
}
const BUBBLES = seededDetail(7, 32);
const FOAM = seededDetail(23, 112);
const NITRO = seededDetail(31, 80);
const CONDENSATION = seededDetail(41, 31);
const LACE = seededDetail(53, 24);

function drawFoam(c, G, theme, ht, big, activity, elapsed){
  const gh = G.bot - G.top, stout = theme.id === 'pub', stein = theme.vessel === 'stein', dome = gh * (stout ? 0.014 : stein ? 0.018 : 0.002);
  const fg = c.createLinearGradient(0, -ht - dome, 0, 0);
  fg.addColorStop(0, stout ? '#fcf7e7' : theme.head); fg.addColorStop(0.62, theme.head); fg.addColorStop(1, stout ? '#ded3b2' : stein ? '#eadcc0' : theme.head);
  c.fillStyle = fg; c.beginPath(); c.moveTo(-big, 0); c.lineTo(-big, -ht);
  for (let i = 0; i <= 36; i++){
    const x = -G.halfW * 1.5 + G.halfW * 3 * i / 36, u = x / (G.halfW * 1.5);
    const ripple = (Math.sin(i * 1.7) + Math.sin(i * 0.81 + elapsed * 4) * activity * 0.55) * ht * (stein ? 0.07 : stout ? 0.028 : 0.05);
    c.lineTo(x, -ht - dome * (1 - u * u) + ripple);
  }
  c.lineTo(big, -ht); c.lineTo(big, 0); c.closePath(); c.fill();
  if (theme.headT > 0.045){
    for (let i = 0; i < FOAM.length; i++){
      const f = FOAM[i], x = (f.x - 0.5) * G.halfW * 2.3, y = -ht * (0.08 + f.y * 0.84), r = Math.max(0.4, gh * (stout ? 0.0017 : 0.0029) * f.s);
      c.fillStyle = i % 4 === 0 ? 'rgba(255,255,249,0.6)' : 'rgba(157,131,87,0.14)';
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      if (stein && i % 5 === 0){ c.strokeStyle = 'rgba(255,255,250,0.5)'; c.lineWidth = Math.max(0.5, gh * 0.001); c.stroke(); }
    }
  }
  c.strokeStyle = stout ? 'rgba(106,86,56,0.28)' : 'rgba(123,99,52,0.24)'; c.lineWidth = Math.max(1, gh * 0.0035);
  c.beginPath(); c.moveTo(-big, 0); c.lineTo(big, 0); c.stroke();
}
function drawLacing(c, G, theme, L){
  if (theme.id !== 'pub' && theme.vessel !== 'stein') return;
  const gh = G.bot - G.top, bottom = Math.min(0.9, L - theme.headT - 0.012);
  c.fillStyle = theme.id === 'pub' ? 'rgba(237,229,200,0.3)' : 'rgba(255,248,225,0.45)';
  for (let i = 0; i < LACE.length; i++){
    const f = LACE[i], t = 0.055 + i * 0.034;
    if (t >= bottom) break;
    for (const side of [-1, 1]){
      const x = G.cx + side * (widthAt(G.glass, t) * G.halfW - G.halfW * (0.035 + f.x * 0.06)), y = G.top + t * gh, ww = G.halfW * (0.032 + f.y * 0.045), hh = gh * (0.005 + f.s * 0.007);
      roundedRect(c, x - ww / 2, y, ww, hh, ww * 0.38); c.fill();
    }
  }
}

/** Draw the place, the vessel, the drink at level L (0 rim, 1 base) and the mark.
 *  G is the vessel box: {cx, top, bot, halfW, glass}. Pass a pre-rendered backdrop to skip redrawing the place.
 *  Ambient is opt-in; leave it false for reduced motion and stable postcard exports. */
export function drawScene(c, {G, w, h, L, theme, P, rollDeg = 0, now = 0, guides = false, bubbles = true, backdrop = null, motion = null, drinking = false, drinkElapsed = 0, titleWash = true, ambient = false}){
  const gh = G.bot - G.top, ht = theme.headT * gh, angle = motion?.angle || 0, lift = (motion?.lift || 0) * gh, activity = bubbles ? (motion?.activity || 0) : 0;
  const surface = getLiquidSurface({vessel: theme.vessel, level: L, aspect: G.halfW / gh, vesselAngle: angle, liquidAngle: motion ? motion.liquidAngle || 0 : rollDeg});
  const yL = G.top + surface.centerLevel * gh, liquidRotation = Math.atan(surface.slope), clock = bubbles ? now / 1000 : 0;
  if (backdrop) c.drawImage(backdrop, 0, 0, w, h); else drawBackdrop(c, w, h, G, theme, titleWash);
  if (ambient) drawMemoryLife(c, {w, h, G, theme, now, backdrop, titleWash});
  // The table and shadow stay put. Everything attached to the vessel tips together.
  c.save(); c.globalAlpha *= Math.max(0.22, 1 - lift / gh * 2.5);
  c.fillStyle = theme.scene === 'beach' ? 'rgba(87,105,91,0.18)' : theme.scene === 'munich' ? 'rgba(56,60,37,0.22)' : 'rgba(0,0,0,0.3)';
  c.beginPath(); c.ellipse(G.cx + G.halfW * 0.09, G.bot + gh * 0.014, G.halfW * 1.1, gh * 0.025, 0, 0, Math.PI * 2); c.fill();
  c.restore();
  const pivotY = G.top + gh * 0.58;
  c.save(); c.translate(G.cx, pivotY - lift); c.rotate(angle * Math.PI / 180); c.translate(-G.cx, -pivotY);
  drawVesselBehind(c, G, theme);
  c.save(); glassPath(c, G); c.clip();
  c.fillStyle = theme.vessel === 'bottle' ? 'rgba(246,253,232,0.11)' : 'rgba(255,255,245,0.08)'; c.fillRect(G.cx - G.halfW, G.top, G.halfW * 2, gh);
  c.save(); c.translate(G.cx, yL); c.rotate(liquidRotation);
  const big = w + h, lg = c.createLinearGradient(0, 0, 0, gh);
  lg.addColorStop(0, theme.body[0]); lg.addColorStop(0.42, theme.body[1]); lg.addColorStop(1, theme.id === 'pub' ? '#160d08' : theme.vessel === 'bottle' ? '#dba946' : theme.body[1]);
  c.fillStyle = lg; c.fillRect(-big, 0, big * 2, gh * 2);
  c.save(); c.beginPath(); c.rect(-big, 0, big * 2, big * 2); c.clip();
  const tint = c.createLinearGradient(-G.halfW, 0, G.halfW, 0);
  tint.addColorStop(0, theme.id === 'pub' ? 'rgba(119,55,30,0.34)' : 'rgba(152,115,43,0.12)'); tint.addColorStop(0.24, 'rgba(255,242,193,0.04)'); tint.addColorStop(0.78, 'rgba(255,251,215,0.17)'); tint.addColorStop(1, 'rgba(97,80,23,0.11)');
  c.fillStyle = tint; c.fillRect(-big, 0, big * 2, big * 2);
  const distance = gh * Math.max(0.08, 1 - surface.centerLevel);
  if (theme.id === 'pub'){
    c.fillStyle = 'rgba(218,191,137,0.12)';
    for (const b of NITRO){
      const yy = (((b.y + clock * b.v * 0.018 * activity) % 1) * Math.min(distance, gh * 0.24)), xx = (b.x - 0.5) * G.halfW * 1.76;
      c.beginPath(); c.arc(xx, yy + gh * 0.005, Math.max(0.35, gh * 0.00115 * b.s), 0, Math.PI * 2); c.fill();
    }
  }
  if ((theme.bubbles || theme.vessel === 'stein') && bubbles){
    c.strokeStyle = 'rgba(255,255,233,0.4)'; c.lineWidth = Math.max(0.6, gh * 0.0015);
    c.fillStyle = 'rgba(255,255,233,0.17)';
    for (const b of BUBBLES){
      const t = (clock * b.v * (0.07 + activity * 0.045) + b.y) % 1, yy = distance * (1 - t), xx = (b.x - 0.5) * G.halfW * 1.62 + Math.sin(clock * 1.2 + b.y * 7) * G.halfW * 0.022;
      const r = Math.max(0.6, b.s * gh * (theme.vessel === 'bottle' ? 0.0028 : 0.002));
      c.beginPath(); c.arc(xx, yy, r, 0, Math.PI * 2); c.fill(); c.stroke();
    }
    if (drinking && theme.vessel === 'bottle'){
      const phase = ((drinkElapsed || clock) % 0.58) / 0.58, r = gh * (0.008 + Math.sin(phase * Math.PI) * 0.012), xx = -G.halfW * 0.18 + Math.sin(phase * Math.PI) * G.halfW * 0.25, yy = distance * (1 - phase) * 0.78;
      c.fillStyle = 'rgba(249,253,225,0.26)'; c.strokeStyle = 'rgba(255,255,237,0.6)'; c.lineWidth = Math.max(0.8, gh * 0.002);
      c.beginPath(); c.ellipse(xx, yy, r * (0.8 + phase * 0.2), r * 1.28, phase * 0.2, 0, Math.PI * 2); c.fill(); c.stroke();
    }
  }
  c.restore();
  drawFoam(c, G, theme, ht, big, activity, clock);
  c.restore();
  drawLacing(c, G, theme, L);
  c.restore();
  drawVesselFront(c, G, theme);
  drawGlassMaterial(c, G, theme);
  drawMark(c, theme, G.cx, G.top + P.markY * gh, P.markH * gh);
  if (guides){
    const my = G.top + P.markY * gh, ww = widthAt(G.glass, P.markY) * G.halfW;
    c.setLineDash([4, 6]); c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(G.cx - ww - 14, my); c.lineTo(G.cx - ww - 3, my); c.moveTo(G.cx + ww + 3, my); c.lineTo(G.cx + ww + 14, my); c.stroke(); c.setLineDash([]);
  }
  c.restore();
}
