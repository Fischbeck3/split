// Canvas drawing: the places, the vessels and the marks.
import {widthAt, mulberry32} from './core.js';

export const SCENES = ['pub', 'beach', 'munich', 'bar'];
export const MARKS = ['letter', 'crown', 'crest', 'star', 'apple', 'shamrock', 'hop', 'bean', 'leaf'];
const SERIF = 'Fraunces, "Playfair Display", Georgia, serif';

// ---------- places ----------
export function drawBackdrop(c, w, h, G, theme){
  const sc = theme.scene; let g;
  if (sc === 'pub'){
    g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#3b2516'); g.addColorStop(1, '#1c120b'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(0,0,0,0.28)'; c.lineWidth = 2;
    const step = Math.max(22, w / 14); for (let x = step / 2; x < w; x += step){ c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
    for (const lx of [0.18, 0.82]){
      const rg = c.createRadialGradient(w * lx, h * 0.1, 0, w * lx, h * 0.1, h * 0.45); rg.addColorStop(0, 'rgba(255,200,110,0.42)'); rg.addColorStop(1, 'rgba(255,200,110,0)'); c.fillStyle = rg; c.fillRect(0, 0, w, h);
      c.fillStyle = '#2a1a10'; c.fillRect(w * lx - 1.5, 0, 3, h * 0.06);
      c.fillStyle = '#c9a24a'; c.beginPath(); c.moveTo(w * lx - h * 0.05, h * 0.1); c.lineTo(w * lx + h * 0.05, h * 0.1); c.lineTo(w * lx + h * 0.025, h * 0.06); c.lineTo(w * lx - h * 0.025, h * 0.06); c.closePath(); c.fill();
      c.fillStyle = '#ffe9b0'; c.beginPath(); c.ellipse(w * lx, h * 0.1, h * 0.05, h * 0.01, 0, 0, Math.PI * 2); c.fill();
    }
    { const dx = w * 0.85, dy = h * 0.36, r = h * 0.07;
      for (let i = 5; i >= 1; i--){ c.fillStyle = i % 2 ? '#e9dfc6' : '#1a1a1a'; c.beginPath(); c.arc(dx, dy, r * i / 5, 0, Math.PI * 2); c.fill(); }
      c.lineWidth = r * 0.12; c.strokeStyle = '#c9302c'; c.beginPath(); c.arc(dx, dy, r * 0.62, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = '#2f8f52'; c.beginPath(); c.arc(dx, dy, r * 0.94, 0, Math.PI * 2); c.stroke();
      c.fillStyle = '#c9302c'; c.beginPath(); c.arc(dx, dy, r * 0.09, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#5a3a22'; c.fillRect(0, h * 0.6, w, h * 0.018); c.fillStyle = 'rgba(255,220,160,0.18)'; c.fillRect(0, h * 0.6, w, 2);
    const ct = G.bot - h * 0.015; g = c.createLinearGradient(0, ct, 0, h); g.addColorStop(0, '#4a2d18'); g.addColorStop(0.08, '#2b1a10'); g.addColorStop(1, '#140c07'); c.fillStyle = g; c.fillRect(0, ct, w, h - ct);
    c.fillStyle = '#c9a24a'; c.fillRect(0, ct + h * 0.055, w, 4); c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(0, ct, w, 3);
    return;
  }
  if (sc === 'beach'){
    g = c.createLinearGradient(0, 0, 0, h * 0.56); g.addColorStop(0, '#4fa9e6'); g.addColorStop(1, '#d7ecf8'); c.fillStyle = g; c.fillRect(0, 0, w, h * 0.56);
    const sx = w * 0.76, sy = h * 0.17, sr = h * 0.065, rg = c.createRadialGradient(sx, sy, sr * 0.5, sx, sy, sr * 3); rg.addColorStop(0, 'rgba(255,236,160,0.6)'); rg.addColorStop(1, 'rgba(255,236,160,0)'); c.fillStyle = rg; c.fillRect(0, 0, w, h * 0.56);
    c.fillStyle = '#ffe38a'; c.beginPath(); c.arc(sx, sy, sr, 0, Math.PI * 2); c.fill();
    g = c.createLinearGradient(0, h * 0.5, 0, h * 0.7); g.addColorStop(0, '#2d8ac7'); g.addColorStop(1, '#6cc1e6'); c.fillStyle = g; c.fillRect(0, h * 0.5, w, h * 0.2);
    c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 2;
    for (let i = 0; i < 3; i++){ const y = h * (0.55 + i * 0.045); c.beginPath(); for (let x = 0; x <= w; x += 8) c.lineTo(x, y + Math.sin((x / w) * Math.PI * 6 + i) * 3); c.stroke(); }
    g = c.createLinearGradient(0, h * 0.69, 0, h); g.addColorStop(0, '#f4e0b0'); g.addColorStop(1, '#dfc084'); c.fillStyle = g; c.fillRect(0, h * 0.69, w, h * 0.31);
    c.fillStyle = 'rgba(255,255,255,0.75)'; c.beginPath(); c.moveTo(0, h * 0.72); for (let x = 0; x <= w; x += 6) c.lineTo(x, h * 0.69 + Math.sin(x / 23) * 4); c.lineTo(w, h * 0.72); c.closePath(); c.fill();
    const r = mulberry32(11); c.fillStyle = 'rgba(120,90,40,0.25)'; for (let i = 0; i < 140; i++){ c.beginPath(); c.arc(r() * w, h * 0.73 + r() * h * 0.27, 1.3, 0, Math.PI * 2); c.fill(); }
    const fronds = [[0.46, 0.04, 11], [0.4, 0.15, 10], [0.3, 0.26, 9], [0.14, 0.33, 8]];
    c.strokeStyle = '#2f7a3a'; c.lineCap = 'round';
    for (const [ex, ey, lw] of fronds){ c.lineWidth = lw * (h / 700); c.beginPath(); c.moveTo(-w * 0.05, -h * 0.02); c.quadraticCurveTo(w * 0.2, h * 0.02, w * ex, h * ey); c.stroke(); }
    c.strokeStyle = '#3f9a4b'; c.lineWidth = 2.5 * (h / 700);
    for (const [ex, ey] of fronds){
      for (let k = 1; k <= 5; k++){
        const t = k / 6, u = 1 - t, x = u * u * (-w * 0.05) + 2 * u * t * (w * 0.2) + t * t * (w * ex), y = u * u * (-h * 0.02) + 2 * u * t * (h * 0.02) + t * t * (h * ey);
        c.beginPath(); c.moveTo(x, y); c.lineTo(x - h * 0.02, y + h * 0.045); c.moveTo(x, y); c.lineTo(x + h * 0.012, y + h * 0.05); c.stroke();
      }
    }
    return;
  }
  if (sc === 'munich'){
    g = c.createLinearGradient(0, 0, 0, h * 0.6); g.addColorStop(0, '#8fc1ec'); g.addColorStop(1, '#e3f0fb'); c.fillStyle = g; c.fillRect(0, 0, w, h * 0.6);
    c.fillStyle = 'rgba(255,255,255,0.88)';
    for (const [cx, cy, s] of [[0.18, 0.2, 1], [0.58, 0.13, 0.8], [0.84, 0.27, 0.7]]){ const x = w * cx, y = h * cy, r = h * 0.03 * s; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.arc(x + r * 1.1, y - r * 0.3, r * 1.25, 0, Math.PI * 2); c.arc(x + r * 2.4, y, r * 0.9, 0, Math.PI * 2); c.fill(); }
    const hz = h * 0.6; c.fillStyle = '#4b5a78';
    c.fillRect(0, hz - h * 0.04, w, h * 0.06);
    for (const [rx, rw, rh] of [[0.03, 0.12, 0.05], [0.56, 0.1, 0.045], [0.85, 0.13, 0.065]]) c.fillRect(w * rx, hz - h * rh - h * 0.02, w * rw, h * rh + h * 0.02);
    const tw = w * 0.07, tx1 = w * 0.27, tx2 = tx1 + tw * 1.7, th = h * 0.16;
    for (const tx of [tx1, tx2]){
      c.fillRect(tx, hz - th, tw, th + h * 0.02);
      c.beginPath(); c.ellipse(tx + tw / 2, hz - th, tw * 0.62, tw * 0.58, 0, Math.PI, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(tx + tw / 2, hz - th - tw * 0.58 - h * 0.035); c.lineTo(tx + tw / 2 - tw * 0.18, hz - th - tw * 0.5); c.lineTo(tx + tw / 2 + tw * 0.18, hz - th - tw * 0.5); c.closePath(); c.fill();
    }
    c.fillRect(tx1 + tw, hz - th * 0.62, tw * 0.7, th * 0.62);
    c.beginPath(); c.moveTo(w * 0.72, hz); c.lineTo(w * 0.72, hz - h * 0.14); c.lineTo(w * 0.735, hz - h * 0.2); c.lineTo(w * 0.75, hz - h * 0.14); c.lineTo(w * 0.75, hz); c.closePath(); c.fill();
    const tt = G.bot - h * 0.02;
    g = c.createLinearGradient(0, hz, 0, tt); g.addColorStop(0, '#a3b96f'); g.addColorStop(1, '#6f8f45'); c.fillStyle = g; c.fillRect(0, hz, w, tt - hz);
    g = c.createLinearGradient(0, tt, 0, h); g.addColorStop(0, '#b8803f'); g.addColorStop(0.1, '#8f5e2b'); g.addColorStop(1, '#5f3c1a'); c.fillStyle = g; c.fillRect(0, tt, w, h - tt);
    c.strokeStyle = 'rgba(0,0,0,0.22)'; c.lineWidth = 2; for (let y = tt + h * 0.05; y < h; y += h * 0.06){ c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    for (const [y0, sag, off] of [[0.07, 0.07, 0], [0.16, 0.05, 0.5]]){
      c.strokeStyle = 'rgba(60,60,60,0.6)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, h * y0); c.quadraticCurveTo(w / 2, h * (y0 + sag * 2), w, h * y0); c.stroke();
      const n = 9;
      for (let i = 0; i <= n; i++){
        const t = (i + off) / n; if (t > 1) continue;
        const u = 1 - t, x = 2 * u * t * (w / 2) + t * t * w, y = u * u * h * y0 + 2 * u * t * h * (y0 + sag * 2) + t * t * h * y0, fw = w / n * 0.42, fh = h * 0.045;
        c.fillStyle = i % 2 ? '#1f5fbf' : '#ffffff'; c.beginPath(); c.moveTo(x - fw, y); c.lineTo(x + fw, y); c.lineTo(x, y + fh); c.closePath(); c.fill();
      }
    }
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
  c.strokeStyle = 'rgba(255,255,255,0.38)'; c.lineWidth = G.halfW * (big ? 0.26 : 0.2); c.lineCap = 'round';
  c.beginPath(); c.ellipse(G.cx + G.halfW * (big ? 1.0 : 0.95), G.top + gh * 0.5, G.halfW * (big ? 0.5 : 0.42), gh * (big ? 0.26 : 0.22), 0, -Math.PI / 2, Math.PI / 2); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 3; c.stroke();
}
function drawVesselFront(c, G, theme){
  const gh = G.bot - G.top;
  if (theme.vessel === 'stein'){
    c.save(); glassPath(c, G); c.clip();
    const r = Math.min(G.halfW * 0.16, gh * 0.045), cols = 5, rows = Math.max(1, Math.floor(gh * 0.7 / (r * 2.4)));
    for (let j = 0; j < rows; j++){
      for (let i = 0; i < cols; i++){
        const x = G.cx + (i - (cols - 1) / 2) * G.halfW * 0.38 + (j % 2 ? G.halfW * 0.19 : 0), y = G.top + gh * 0.16 + j * r * 2.4;
        const rg = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r); rg.addColorStop(0, 'rgba(255,255,255,0.3)'); rg.addColorStop(0.7, 'rgba(255,255,255,0.05)'); rg.addColorStop(1, 'rgba(0,0,0,0.14)');
        c.fillStyle = rg; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      }
    }
    c.fillStyle = 'rgba(255,255,255,0.2)'; c.fillRect(G.cx - G.halfW - 5, G.bot - gh * 0.06, G.halfW * 2 + 10, gh * 0.06 + 5);
    c.restore();
  }
  if (theme.vessel === 'bottle'){
    const mw = widthAt('bottle', 0) * G.halfW, rr = gh * 0.05;
    c.save(); c.translate(G.cx + mw * 0.45, G.top + rr * 0.1); c.rotate(-0.45);
    c.fillStyle = '#8fcf4a'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, rr, Math.PI * 1.0, Math.PI * 2.0); c.closePath(); c.fill();
    c.fillStyle = '#dcf59b'; c.beginPath(); c.moveTo(0, -rr * 0.06); c.arc(0, -rr * 0.06, rr * 0.72, Math.PI * 1.05, Math.PI * 1.95); c.closePath(); c.fill();
    c.strokeStyle = '#4f8a2a'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, rr, Math.PI * 1.0, Math.PI * 2.0); c.stroke();
    c.strokeStyle = 'rgba(79,138,42,0.6)';
    for (let k = -2; k <= 2; k++){ c.beginPath(); c.moveTo(0, -rr * 0.06); c.lineTo(Math.cos(Math.PI * (1.5 + k * 0.2)) * rr * 0.7, -rr * 0.06 + Math.sin(Math.PI * (1.5 + k * 0.2)) * rr * 0.7); c.stroke(); }
    c.restore();
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
    const lw = h * 2.3, top = cy - h * 0.78, bot = cy + h * 1.95;
    c.fillStyle = 'rgba(250,245,230,0.3)'; c.strokeStyle = 'rgba(20,48,107,0.95)'; c.lineWidth = Math.max(2, h * 0.05);
    c.beginPath(); if (c.roundRect) c.roundRect(cx - lw / 2, top, lw, bot - top, h * 0.15); else c.rect(cx - lw / 2, top, lw, bot - top); c.fill(); c.stroke();
    c.fillStyle = 'rgba(20,48,107,0.9)'; c.fillRect(cx - lw * 0.3, cy + h * 0.78, lw * 0.6, h * 0.2); c.fillRect(cx - lw * 0.2, cy + h * 1.15, lw * 0.4, h * 0.11); c.fillRect(cx - lw * 0.26, cy + h * 1.45, lw * 0.52, h * 0.08);
    c.fillStyle = theme.markFill; c.strokeStyle = theme.markStroke; c.lineWidth = Math.max(2, h * 0.07);
    c.beginPath(); c.moveTo(cx - h * 0.5, cy + h * 0.5); c.lineTo(cx - h * 0.5, cy - h * 0.1); c.lineTo(cx - h * 0.25, cy + h * 0.15); c.lineTo(cx, cy - h * 0.5); c.lineTo(cx + h * 0.25, cy + h * 0.15); c.lineTo(cx + h * 0.5, cy - h * 0.1); c.lineTo(cx + h * 0.5, cy + h * 0.5); c.closePath(); c.stroke(); c.fill();
    for (const px of [-0.5, 0, 0.5]){ c.beginPath(); c.arc(cx + px * h, cy - (px === 0 ? 0.5 : 0.1) * h, h * 0.075, 0, Math.PI * 2); c.fill(); c.stroke(); }
  } else if (theme.mark === 'crest'){
    const sw = h * 0.84, shield = () => { c.beginPath(); c.moveTo(cx - sw / 2, cy - h / 2); c.lineTo(cx + sw / 2, cy - h / 2); c.lineTo(cx + sw / 2, cy + h * 0.1); c.quadraticCurveTo(cx + sw / 2, cy + h * 0.46, cx, cy + h / 2); c.quadraticCurveTo(cx - sw / 2, cy + h * 0.46, cx - sw / 2, cy + h * 0.1); c.closePath(); };
    c.save(); shield(); c.clip(); c.fillStyle = '#ffffff'; c.fillRect(cx - sw, cy - h, sw * 2, h * 2);
    c.fillStyle = theme.markFill; const d = h * 0.3;
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

/** Draw the place, the vessel, the drink at level L (0 rim, 1 base) and the mark.
 *  G is the vessel box: {cx, top, bot, halfW, glass}. Pass a pre-rendered backdrop to skip redrawing the place. */
export function drawScene(c, {G, w, h, L, theme, P, rollDeg = 0, now = 0, guides = false, bubbles = true, backdrop = null}){
  const gh = G.bot - G.top, yL = G.top + L * gh, ht = theme.headT * gh;
  if (backdrop) c.drawImage(backdrop, 0, 0, w, h); else drawBackdrop(c, w, h, G, theme);
  c.fillStyle = 'rgba(0,0,0,0.4)'; c.beginPath(); c.ellipse(G.cx, G.bot + gh * 0.025, G.halfW * 1.1, gh * 0.03, 0, 0, Math.PI * 2); c.fill();
  drawVesselBehind(c, G, theme);
  c.save(); glassPath(c, G); c.clip();
  c.fillStyle = 'rgba(255,255,255,0.07)'; c.fillRect(0, 0, w, h);
  c.save(); c.translate(G.cx, yL); c.rotate(rollDeg * Math.PI / 180);
  const big = w + h, lg = c.createLinearGradient(0, 0, 0, gh); lg.addColorStop(0, theme.body[0]); lg.addColorStop(0.3, theme.body[1]); lg.addColorStop(1, theme.body[1]);
  c.fillStyle = lg; c.fillRect(-big, 0, big * 2, gh * 2);
  c.fillStyle = theme.head; c.fillRect(-big, -ht, big * 2, ht);
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
  glassPath(c, G); c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 2; c.stroke();
  const hx = G.cx - widthAt(G.glass, 0.55) * G.halfW * 0.72;
  c.fillStyle = 'rgba(255,255,255,0.12)'; c.beginPath();
  if (c.roundRect) c.roundRect(hx, G.top + gh * 0.42, G.halfW * 0.07, gh * 0.45, 6); else c.rect(hx, G.top + gh * 0.42, G.halfW * 0.07, gh * 0.45);
  c.fill();
  if (guides){
    const my = G.top + P.markY * gh, ww = widthAt(G.glass, P.markY) * G.halfW;
    c.setLineDash([4, 6]); c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(G.cx - ww - 14, my); c.lineTo(G.cx - ww - 3, my); c.moveTo(G.cx + ww + 3, my); c.lineTo(G.cx + ww + 14, my); c.stroke(); c.setLineDash([]);
  }
}
