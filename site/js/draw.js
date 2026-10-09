// Canvas drawing: the places, the vessels and the marks.
import {widthAt, mulberry32} from './core.js';

export const SCENES = ['pub', 'beach', 'munich', 'bar'];
export const MARKS = ['letter', 'crown', 'crest', 'star', 'apple', 'shamrock', 'hop', 'bean', 'leaf'];
const SERIF = 'Fraunces, "Playfair Display", Georgia, serif';
const SANS = 'Karla, sans-serif';

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
export function drawBackdrop(c, w, h, G, theme){
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
export function makeBackdrop(w, h, G, theme, dpr){
  const cv = document.createElement('canvas'); cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); drawBackdrop(g, w, h, G, theme);
  return cv;
}

// ---------- vessels ----------
export function glassPath(c, G){
  const n = 40, gh = G.bot - G.top, wb = widthAt(G.glass, 1) * G.halfW, r = Math.min(16, wb * 0.3), tEnd = 1 - r / gh;
  c.beginPath();
  for (let i = 0; i <= n; i++){ const t = tEnd * i / n, w = widthAt(G.glass, t) * G.halfW, y = G.top + t * gh; if (i === 0) c.moveTo(G.cx - w, y); else c.lineTo(G.cx - w, y); }
  c.quadraticCurveTo(G.cx - wb, G.bot, G.cx - wb + r, G.bot); c.lineTo(G.cx + wb - r, G.bot); c.quadraticCurveTo(G.cx + wb, G.bot, G.cx + wb, G.bot - r);
  for (let i = n; i >= 0; i--){ const t = tEnd * i / n, w = widthAt(G.glass, t) * G.halfW, y = G.top + t * gh; c.lineTo(G.cx + w, y); }
  c.closePath();
}
function drawVesselBehind(c, G, theme){
  if (theme.vessel !== 'mug' && theme.vessel !== 'stein') return;
  const gh = G.bot - G.top, big = theme.vessel === 'stein';
  c.save(); c.lineCap = 'round';
  c.beginPath(); c.ellipse(G.cx + G.halfW * (big ? 0.89 : 0.95), G.top + gh * 0.5, G.halfW * (big ? 0.49 : 0.42), gh * (big ? 0.255 : 0.22), 0, -Math.PI / 2, Math.PI / 2);
  c.strokeStyle = big ? 'rgba(88,119,136,0.48)' : 'rgba(255,255,255,0.38)'; c.lineWidth = G.halfW * (big ? 0.27 : 0.2); c.stroke();
  c.strokeStyle = big ? 'rgba(240,248,246,0.92)' : 'rgba(255,255,255,0.3)'; c.lineWidth = G.halfW * (big ? 0.21 : 0.12); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = Math.max(1, G.halfW * 0.035); c.stroke();
  c.restore();
}
function drawVesselFront(c, G, theme){
  const gh = G.bot - G.top;
  if (theme.vessel === 'stein'){
    c.save(); glassPath(c, G); c.clip();
    const r = Math.min(G.halfW * 0.17, gh * 0.049), cols = 4, rows = Math.max(1, Math.floor(gh * 0.67 / (r * 2.75)));
    for (let j = 0; j < rows; j++){
      for (let i = 0; i < cols; i++){
        const x = G.cx + (i - (cols - 1) / 2) * G.halfW * 0.44, y = G.top + gh * 0.19 + j * r * 2.75;
        const rg = c.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.05, x, y, r);
        rg.addColorStop(0, 'rgba(255,255,255,0.36)'); rg.addColorStop(0.65, 'rgba(255,255,255,0.02)'); rg.addColorStop(1, 'rgba(91,68,34,0.19)');
        c.fillStyle = rg; c.beginPath(); c.ellipse(x, y, r * 0.9, r, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = 'rgba(255,255,255,0.38)'; c.lineWidth = Math.max(1, gh * 0.004);
        c.beginPath(); c.ellipse(x, y, r * 0.9, r, 0, Math.PI * 1.05, Math.PI * 1.8); c.stroke();
      }
    }
    c.fillStyle = 'rgba(228,241,235,0.4)'; c.fillRect(G.cx - G.halfW - 5, G.bot - gh * 0.065, G.halfW * 2 + 10, gh * 0.065 + 5);
    c.fillStyle = 'rgba(255,255,255,0.78)'; c.fillRect(G.cx - G.halfW, G.bot - gh * 0.021, G.halfW * 2, gh * 0.01);
    c.restore();
  }
  if (theme.vessel === 'bottle'){
    const mw = widthAt('bottle', 0) * G.halfW, rr = gh * 0.046;
    c.strokeStyle = 'rgba(235,250,233,0.8)'; c.lineWidth = Math.max(1.3, gh * 0.009);
    for (const depth of [0.012, 0.04]){ c.beginPath(); c.moveTo(G.cx - mw * 0.88, G.top + gh * depth); c.lineTo(G.cx + mw * 0.88, G.top + gh * depth); c.stroke(); }
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
const BUBBLES = (() => { const r = mulberry32(7), out = []; for (let i = 0; i < 18; i++) out.push({x: r(), y: r(), s: 0.6 + r() * 0.9, v: 0.4 + r() * 0.8}); return out; })();
const FOAM = (() => { const r = mulberry32(23), out = []; for (let i = 0; i < 15; i++) out.push({x: r(), y: r(), s: 0.6 + r() * 0.7}); return out; })();

/** Draw the place, the vessel, the drink at level L (0 rim, 1 base) and the mark.
 *  G is the vessel box: {cx, top, bot, halfW, glass}. Pass a pre-rendered backdrop to skip redrawing the place. */
export function drawScene(c, {G, w, h, L, theme, P, rollDeg = 0, now = 0, guides = false, bubbles = true, backdrop = null}){
  const gh = G.bot - G.top, yL = G.top + L * gh, ht = theme.headT * gh;
  if (backdrop) c.drawImage(backdrop, 0, 0, w, h); else drawBackdrop(c, w, h, G, theme);
  c.fillStyle = theme.scene === 'beach' ? 'rgba(87,105,91,0.18)' : theme.scene === 'munich' ? 'rgba(56,60,37,0.22)' : 'rgba(0,0,0,0.3)';
  c.beginPath(); c.ellipse(G.cx + G.halfW * 0.09, G.bot + gh * 0.014, G.halfW * 1.1, gh * 0.025, 0, 0, Math.PI * 2); c.fill();
  drawVesselBehind(c, G, theme);
  c.save(); glassPath(c, G); c.clip();
  c.fillStyle = 'rgba(255,255,255,0.07)'; c.fillRect(0, 0, w, h);
  c.save(); c.translate(G.cx, yL); c.rotate(rollDeg * Math.PI / 180);
  const big = w + h, lg = c.createLinearGradient(0, 0, 0, gh); lg.addColorStop(0, theme.body[0]); lg.addColorStop(0.3, theme.body[1]); lg.addColorStop(1, theme.body[1]);
  c.fillStyle = lg; c.fillRect(-big, 0, big * 2, gh * 2);
  c.fillStyle = theme.head; c.fillRect(-big, -ht, big * 2, ht);
  if (theme.headT > 0.05){
    c.fillStyle = 'rgba(158,122,65,0.1)';
    for (const f of FOAM){
      c.beginPath(); c.arc((f.x - 0.5) * G.halfW * 1.7, -ht * (0.2 + f.y * 0.6), Math.max(0.65, gh * 0.004 * f.s), 0, Math.PI * 2); c.fill();
    }
  }
  c.fillStyle = 'rgba(0,0,0,0.28)'; c.fillRect(-big, -1.2, big * 2, 2.4);
  c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(-big, -ht, big * 2, Math.max(1, ht * 0.08));
  c.restore();
  if (theme.bubbles && bubbles){
    c.fillStyle = 'rgba(255,255,255,0.22)';
    for (const b of BUBBLES){
      const t = ((now / 1000) * b.v * 0.1 + b.y) % 1, by = G.bot - t * (G.bot - yL), bx = G.cx + (b.x - 0.5) * 2 * G.halfW * 0.8 * widthAt(G.glass, (by - G.top) / gh);
      if (by > yL + 4){ c.beginPath(); c.arc(bx, by, b.s * gh * 0.006 + 1, 0, Math.PI * 2); c.fill(); }
    }
  }
  c.restore();
  drawVesselFront(c, G, theme);
  drawMark(c, theme, G.cx, G.top + P.markY * gh, P.markH * gh);
  glassPath(c, G); c.strokeStyle = theme.scene === 'beach' ? 'rgba(66,115,111,0.48)' : theme.scene === 'munich' ? 'rgba(73,108,129,0.46)' : 'rgba(248,242,217,0.57)'; c.lineWidth = Math.max(1.5, gh * 0.006); c.stroke();
  const hx = G.cx - widthAt(G.glass, 0.55) * G.halfW * 0.72;
  c.fillStyle = theme.vessel === 'bottle' ? 'rgba(255,255,244,0.5)' : 'rgba(255,255,255,0.19)';
  roundedRect(c, hx, G.top + gh * 0.42, G.halfW * 0.065, gh * 0.44, G.halfW * 0.035);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.13)';
  roundedRect(c, G.cx + widthAt(G.glass, 0.55) * G.halfW * 0.79, G.top + gh * 0.44, G.halfW * 0.025, gh * 0.37, G.halfW * 0.015); c.fill();
  const rim = widthAt(G.glass, 0) * G.halfW;
  c.strokeStyle = 'rgba(255,255,247,0.7)'; c.lineWidth = Math.max(1.2, gh * (theme.vessel === 'stein' ? 0.012 : 0.006));
  c.beginPath(); c.moveTo(G.cx - rim + 1, G.top + 1); c.lineTo(G.cx + rim - 1, G.top + 1); c.stroke();
  if (guides){
    const my = G.top + P.markY * gh, ww = widthAt(G.glass, P.markY) * G.halfW;
    c.setLineDash([4, 6]); c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(G.cx - ww - 14, my); c.lineTo(G.cx - ww - 3, my); c.moveTo(G.cx + ww + 3, my); c.lineTo(G.cx + ww + 14, my); c.stroke(); c.setLineDash([]);
  }
}
