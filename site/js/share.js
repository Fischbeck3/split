// The same daily vessel and stopping position, ready for a group chat.
import {bandEmoji, widthAt} from './core.js';
import {drawScene} from './draw.js';

const DISPLAY = 'Fraunces, "Playfair Display", Georgia, serif';
const BODY = 'Karla, "Helvetica Neue", Arial, sans-serif';
const CARD_W = 1080, CARD_H = 1350, SCENE_H = 920;

function statusLabel(result, preview){
  return preview ? 'Preview' : result.counts === false ? 'Practice' : '';
}

function canonicalUrl(url){
  try {
    const parsed = new URL(url);
    return parsed.origin + parsed.pathname;
  } catch {
    return String(url || '').split(/[?#]/)[0];
  }
}

function cardUrl(url){
  try {
    const parsed = new URL(canonicalUrl(url));
    return parsed.host + (parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/$/, ''));
  } catch {
    return canonicalUrl(url);
  }
}

function offsetLabel(result){
  if (result.drained) return 'You drank the lot.';
  const pct = Math.round(Math.abs(result.f) * 100);
  return pct === 0 ? 'Dead center.' : pct + '% of mark ' + (result.f < 0 ? 'high' : 'low');
}

/** Pure text sharing. The strip is one stopping position, never a grid of attempts. */
export function buildShareText({num, theme, result, url, preview = false}){
  const status = statusLabel(result, preview);
  const emoji = theme.emoji || (theme.vessel === 'stein' ? '🍻' : '🍺');
  return [
    'Split #' + String(num).padStart(3, '0') + ' · ' + emoji + ' ' + theme.name + ' · ' + theme.label + (status ? ' · ' + status : ''),
    result.score + '/100 · ' + result.label,
    bandEmoji(result.f),
    'One sip. Your turn.',
    canonicalUrl(url)
  ].join('\n');
}

function fitText(c, value, x, y, maxW, size, family, weight = 700){
  // Measure the actual verdict, including future marks and long translations.
  let fitted = size;
  c.font = weight + ' ' + fitted + 'px ' + family;
  while (c.measureText(value).width > maxW && fitted > 18){
    fitted -= 1;
    c.font = weight + ' ' + fitted + 'px ' + family;
  }
  c.fillText(value, x, y);
  return fitted;
}

function paletteFor(theme){
  const p = theme.palette || {bg: '#101b17', fg: '#eee7d6', sheet: '#1d2a23', accent: '#d9b874', accentFg: '#17221b'};
  return {...p, band: theme.scene === 'pub' ? p.accent : p.fg, bandInk: theme.scene === 'pub' ? p.accentFg : p.sheet};
}

/** A quieter version of each place gives the exported vessel room to be read. */
function drawCardBackdrop(c, theme, palette){
  c.fillStyle = palette.bg;
  c.fillRect(0, 0, CARD_W, SCENE_H);
  if (theme.scene === 'beach'){
    c.fillStyle = '#d9eef0'; c.fillRect(0, 250, CARD_W, 276);
    c.fillStyle = '#2f9da5'; c.fillRect(0, 526, CARD_W, 114);
    c.fillStyle = '#73c7c6'; c.fillRect(0, 612, CARD_W, 74);
    c.fillStyle = '#fbf8ed';
    c.beginPath(); c.moveTo(0, 684); c.bezierCurveTo(310, 661, 670, 711, CARD_W, 679);
    c.lineTo(CARD_W, SCENE_H); c.lineTo(0, SCENE_H); c.closePath(); c.fill();
    c.strokeStyle = '#fffdf4'; c.lineWidth = 9;
    c.beginPath(); c.moveTo(0, 675); c.bezierCurveTo(310, 652, 670, 702, CARD_W, 670); c.stroke();
    c.fillStyle = '#f1cd6a'; c.beginPath(); c.arc(886, 340, 47, 0, Math.PI * 2); c.fill();
    return;
  }
  if (theme.scene === 'munich'){
    c.fillStyle = '#e0edf4'; c.fillRect(0, 250, CARD_W, 573);
    c.fillStyle = '#fffaf0'; c.fillRect(0, 283, CARD_W, 100);
    c.fillStyle = '#3c72a4';
    for (let x = -70; x < CARD_W + 120; x += 154){
      c.beginPath(); c.moveTo(x, 283); c.lineTo(x + 78, 333); c.lineTo(x, 383); c.lineTo(x - 78, 333); c.closePath(); c.fill();
    }
    c.fillStyle = '#9b693c'; c.fillRect(0, 823, CARD_W, SCENE_H - 823);
    c.fillStyle = '#c4985e'; c.fillRect(0, 823, CARD_W, 6);
    c.strokeStyle = 'rgba(60,38,21,0.25)'; c.lineWidth = 2;
    for (const y of [865, 908]){ c.beginPath(); c.moveTo(0, y); c.lineTo(CARD_W, y); c.stroke(); }
    return;
  }
  c.strokeStyle = '#28392d'; c.lineWidth = 2;
  for (const x of [180, 360, 720, 900]){ c.beginPath(); c.moveTo(x, 250); c.lineTo(x, 825); c.stroke(); }
  for (const x of [164, 916]){
    const glow = c.createRadialGradient(x, 343, 10, x, 343, 200);
    glow.addColorStop(0, 'rgba(217,184,116,0.16)'); glow.addColorStop(1, 'rgba(217,184,116,0)');
    c.fillStyle = glow; c.fillRect(x - 200, 250, 400, 400);
    c.fillStyle = '#c9a46c'; c.beginPath(); c.moveTo(x - 51, 343); c.lineTo(x + 51, 343); c.lineTo(x + 27, 306); c.lineTo(x - 27, 306); c.closePath(); c.fill();
    c.fillStyle = '#f7deaa'; c.fillRect(x - 43, 341, 86, 5);
  }
  c.fillStyle = '#4c3324'; c.fillRect(0, 823, CARD_W, SCENE_H - 823);
  c.fillStyle = '#b18b58'; c.fillRect(0, 823, CARD_W, 5);
}

function drawGuide(c, G, P, result, palette){
  const gh = G.bot - G.top, markY = G.top + P.markY * gh, lineY = G.top + result.L * gh;
  const markW = widthAt(G.glass, P.markY) * G.halfW;
  const lineW = widthAt(G.glass, result.L) * G.halfW;
  c.save();
  c.strokeStyle = palette.fg; c.fillStyle = palette.fg; c.lineWidth = 3;
  c.setLineDash([10, 8]); c.beginPath(); c.moveTo(151, markY); c.lineTo(G.cx - markW - 22, markY); c.stroke();
  c.setLineDash([]); c.beginPath(); c.moveTo(G.cx + lineW + 22, lineY); c.lineTo(929, lineY); c.stroke();
  c.font = '700 22px ' + BODY; c.textBaseline = 'middle';
  c.textAlign = 'left'; c.fillText('MARK', 68, markY);
  c.textAlign = 'right'; c.fillText('STOP', 1012, lineY);
  c.restore();
}

function drawBand(c, f, x, y, ink){
  const idx = f < -0.3 ? 0 : f < -0.1 ? 1 : f <= 0.1 ? 2 : f <= 0.3 ? 3 : 4;
  const outside = Math.abs(f) > 0.5;
  for (let i = 0; i < 5; i++){
    c.strokeStyle = ink; c.lineWidth = 2;
    c.strokeRect(x + i * 76, y, 60, 60);
    if (!outside && i === idx){
      c.fillStyle = i === 2 ? '#5a9d6b' : i === 1 || i === 3 ? '#e2b95c' : '#d77e44';
      c.fillRect(x + i * 76 + 5, y + 5, 50, 50);
    }
  }
  if (outside){
    const ax = f < 0 ? x - 27 : x + 5 * 76 + 11, ay = y + 30, dir = f < 0 ? -1 : 1;
    c.strokeStyle = ink; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(ax, ay - dir * 14); c.lineTo(ax, ay + dir * 14);
    c.moveTo(ax - 9, ay + dir * 4); c.lineTo(ax, ay + dir * 14); c.lineTo(ax + 9, ay + dir * 4); c.stroke();
  }
}

/** Draw synchronously after the caller has loaded the app's Fraunces and Karla fonts. */
export function drawShareCard(canvas, {num, theme, P, result, url, preview = false}){
  canvas.width = CARD_W; canvas.height = CARD_H;
  const c = canvas.getContext('2d'), palette = paletteFor(theme);
  const doc = canvas.ownerDocument || document;
  const backdrop = doc.createElement('canvas'); backdrop.width = CARD_W; backdrop.height = SCENE_H;
  drawCardBackdrop(backdrop.getContext('2d'), theme, palette);
  const G = {cx: 540, top: 250, bot: 840, halfW: theme.vessel === 'bottle' ? 120 : theme.vessel === 'stein' ? 185 : 180, glass: theme.vessel};
  drawScene(c, {G, w: CARD_W, h: SCENE_H, L: result.L, theme, P, bubbles: false, backdrop});
  drawGuide(c, G, P, result, palette);

  // A fixed masthead makes the place recognizable while the card remains Split.
  c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = palette.fg;
  c.font = '900 84px ' + DISPLAY; c.fillText('Split.', 64, 121);
  fitText(c, theme.label, 64, 208, 952, 70, DISPLAY, 900);
  c.textAlign = 'right'; c.font = '700 32px ' + BODY;
  c.fillText('#' + String(num).padStart(3, '0'), 1016, 95);
  const status = statusLabel(result, preview);
  if (status){ c.font = '700 25px ' + BODY; c.fillText(status + ' · not saved', 1016, 137); }

  // Score and error use different units: a score is /100, an offset is mark height.
  c.fillStyle = palette.band; c.fillRect(0, SCENE_H, CARD_W, CARD_H - SCENE_H);
  c.fillStyle = palette.bandInk; c.textAlign = 'left';
  c.font = '900 218px ' + DISPLAY; c.fillText(String(result.score), 64, 1131);
  c.font = '700 40px ' + BODY; c.fillText('/100', 72, 1199);
  fitText(c, result.label, 550, 1010, 466, 45, DISPLAY, 900);
  fitText(c, offsetLabel(result), 550, 1065, 466, 30, BODY, 600);
  drawBand(c, result.f, 566, 1120, palette.bandInk);
  c.fillStyle = palette.bandInk;
  if (status){ c.font = '700 24px ' + BODY; c.fillText(status + ' sip', 550, 1220); }
  c.strokeStyle = palette.bandInk; c.globalAlpha = 0.25; c.lineWidth = 1;
  c.beginPath(); c.moveTo(64, 1249); c.lineTo(1016, 1249); c.stroke(); c.globalAlpha = 1;
  fitText(c, cardUrl(url), 64, 1302, 450, 29, BODY, 700);
  c.textAlign = 'right'; c.font = '700 33px ' + BODY; c.fillText('One sip. Your turn.', 1016, 1302);
  return canvas;
}
