// The same daily vessel and stopping position, ready for a group chat.
import {bandEmoji, widthAt} from './core.js';
import {drawScene} from './draw.js';

const DISPLAY = 'Fraunces, "Playfair Display", Georgia, serif';
const BODY = 'Karla, "Helvetica Neue", Arial, sans-serif';
const CARD_W = 1080, CARD_H = 1350;
const PHOTO = {x: 40, y: 246, w: 1000, h: 750};

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
  return {...p, paper: theme.scene === 'pub' ? p.fg : p.sheet, ink: theme.scene === 'pub' ? p.accentFg : p.fg,
    guidePaper: theme.scene === 'pub' ? p.bg : p.sheet};
}

function placeCopy(theme){
  if (theme.scene === 'pub') return {title: 'Old Irish pub.', line: theme.name + ' · Ireland'};
  if (theme.scene === 'beach') return {title: 'Cabo, Mexico.', line: theme.name + ' · Beach day'};
  if (theme.scene === 'munich') return {title: 'Oktoberfest.', line: theme.name + ' · Munich, Germany'};
  return {title: theme.label || theme.name, line: theme.name + (theme.location ? ' · ' + theme.location : '')};
}

function drawGuide(c, G, P, result, palette){
  const gh = G.bot - G.top, markY = G.top + P.markY * gh, lineY = G.top + result.L * gh;
  const markW = widthAt(G.glass, P.markY) * G.halfW;
  const lineW = widthAt(G.glass, result.L) * G.halfW;
  c.save();
  // Paper-backed ink keeps the actual mark and stop readable over each place.
  for (const [start, end, y, dash] of [[113, G.cx - markW - 22, markY, [10, 8]], [G.cx + lineW + 22, PHOTO.w - 112, lineY, []]]){
    c.setLineDash(dash);
    c.beginPath(); c.moveTo(start, y); c.lineTo(end, y);
    c.strokeStyle = palette.guidePaper; c.lineWidth = 5; c.globalAlpha = 0.8; c.stroke();
    c.strokeStyle = palette.fg; c.lineWidth = 2; c.globalAlpha = 1; c.stroke();
  }
  c.setLineDash([]); c.fillStyle = palette.guidePaper; c.globalAlpha = 0.92;
  c.fillRect(18, markY - 23, 83, 46); c.fillRect(PHOTO.w - 101, lineY - 23, 83, 46);
  c.fillStyle = palette.fg; c.globalAlpha = 1; c.font = '700 22px ' + BODY; c.textBaseline = 'middle';
  c.textAlign = 'center'; c.fillText('MARK', 59, markY); c.fillText('STOP', PHOTO.w - 59, lineY);
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

/** Draw synchronously after the caller has loaded the fonts and shared place assets. */
export function drawShareCard(canvas, {num, theme, P, result, url, preview = false}){
  canvas.width = CARD_W; canvas.height = CARD_H;
  const c = canvas.getContext('2d'), palette = paletteFor(theme), place = placeCopy(theme);
  const doc = canvas.ownerDocument || document;
  const photo = doc.createElement('canvas'); photo.width = PHOTO.w; photo.height = PHOTO.h;
  const scene = photo.getContext('2d');
  const G = {cx: PHOTO.w / 2, top: 48, bot: 690, halfW: theme.vessel === 'bottle' ? 128 : theme.vessel === 'stein' ? 200 : 190, glass: theme.vessel};
  // The same place and exact stopped level travel with the sip. Only the paper changes.
  drawScene(scene, {G, w: PHOTO.w, h: PHOTO.h, L: result.L, theme, P, bubbles: false, titleWash: false});
  drawGuide(scene, G, P, result, palette);
  c.fillStyle = palette.paper; c.fillRect(0, 0, CARD_W, CARD_H);
  c.drawImage(photo, PHOTO.x, PHOTO.y);

  // A place-led postcard feels like something brought home from a shared trip.
  c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = palette.ink;
  c.font = '900 52px ' + DISPLAY; c.fillText('Split.', 64, 85);
  fitText(c, place.title, 64, 177, 952, 82, DISPLAY, 900);
  fitText(c, place.line, 64, 221, 952, 30, BODY, 600);
  c.textAlign = 'right'; c.font = '700 30px ' + BODY;
  c.fillText('#' + String(num).padStart(3, '0'), 1016, 82);
  const status = statusLabel(result, preview);
  if (status){ c.font = '700 23px ' + BODY; c.fillText(status + ' · not saved', 1016, 117); }

  // Score and error use different units: a score is /100, an offset is mark height.
  c.textAlign = 'left'; c.font = '900 178px ' + DISPLAY;
  c.fillText(String(result.score), 64, 1189);
  c.font = '700 34px ' + BODY; c.fillText('/100', 72, 1237);
  fitText(c, result.label, 536, 1058, 480, 45, DISPLAY, 900);
  fitText(c, offsetLabel(result), 536, 1104, 480, 28, BODY, 600);
  drawBand(c, result.f, 552, 1146, palette.ink);
  c.fillStyle = palette.ink;
  c.font = '600 22px ' + BODY; c.fillText('One stopping point', 536, 1240);
  c.strokeStyle = palette.ink; c.globalAlpha = 0.25; c.lineWidth = 1;
  c.beginPath(); c.moveTo(64, 1267); c.lineTo(1016, 1267); c.stroke(); c.globalAlpha = 1;
  fitText(c, cardUrl(url), 64, 1313, 450, 27, BODY, 700);
  c.textAlign = 'right'; c.font = '700 31px ' + BODY; c.fillText('One sip. Your turn.', 1016, 1313);
  return canvas;
}
