// The same daily vessel and stopping position, ready for a group chat.
import {bandEmoji, keyForDay} from './core.js';
import {renderVessel, renderWidthAt as widthAt} from './render-vessels.js';
import {isCalendarDateKey} from './challenge.js';
import {SITE_URL} from './config.js';
import {drawScene} from './draw.js';
import {readFriendChallenge, comparisonCopy} from './friend.js';
import {ROUND_STAGES} from './rounds.js';

const DISPLAY = 'Fraunces, "Playfair Display", Georgia, serif';
const BODY = 'Karla, "Helvetica Neue", Arial, sans-serif';
const CARD_W = 1080, CARD_H = 1350;
const PHOTO = {x: 40, y: 246, w: 1000, h: 750};
const ROUND_LABELS = ROUND_STAGES.map(stage => stage.label);

// A partial or damaged round must not claim three completed attempts. Legacy sips
// retain their original text and postcard, including previously saved results.
function completedRound(result){
  if (result.version !== 2 || result.done !== true || !Array.isArray(result.rounds) || result.rounds.length !== 3 ||
      !Number.isInteger(result.bestIndex) || result.bestIndex < 0 || result.bestIndex > 2) return null;
  if (!result.rounds.every(sip => sip && Number.isInteger(sip.score) && sip.score >= 0 && sip.score <= 100 &&
      Number.isFinite(sip.f) && Number.isFinite(sip.L) && typeof sip.label === 'string')) return null;
  const best = result.rounds[result.bestIndex];
  if (result.rounds.some(sip => sip.score > best.score) ||
      best.score !== result.score || best.f !== result.f || best.L !== result.L || Boolean(best.drained) !== Boolean(result.drained)) return null;
  return result.rounds;
}

function statusLabel(result, preview, archive, review){
  return review ? 'Review' : preview ? 'Preview' : archive ? 'Archive' : result.counts === false ? 'Practice' : '';
}

function canonicalUrl(url){
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol) || !parsed.hostname) throw new Error('Not a web address');
    return parsed.origin + parsed.pathname;
  } catch {
    return SITE_URL;
  }
}

function challengeUrl({url, key, num, preview, archive, theme, result, review}){
  const parsed = new URL(canonicalUrl(url));
  if (review){ parsed.hash = 'admin/' + theme.id; return parsed.href; }
  const day = Number.isInteger(num) && num >= 1 && isCalendarDateKey(keyForDay(num)) ? num : 1;
  if (preview) parsed.hash = 'day' + (day <= 9999 ? day : 1);
  else parsed.searchParams.set('day', isCalendarDateKey(key) ? key : keyForDay(day));
  if (result && theme && Number.isFinite(result.f)){
    parsed.searchParams.set('vs', String(result.score));
    parsed.searchParams.set('f', String(result.f));
    parsed.searchParams.set('glass', theme.id);
    parsed.searchParams.set('sip', preview ? 'preview' : archive ? result.counts === false ? 'archive' : 'archive-saved' : result.counts === false ? 'practice' : 'daily');
    parsed.searchParams.set('empty', result.drained ? '1' : '0');
    const accepted = readFriendChallenge({search: parsed.search, hash: parsed.hash, key: keyForDay(day), num: day, theme});
    if (!accepted) for (const field of ['vs', 'f', 'glass', 'sip', 'empty']) parsed.searchParams.delete(field);
  }
  return parsed.href;
}

function cardUrl(url, num){
  const parsed = new URL(url);
  const compact = parsed.host + (parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/$/, '')) + parsed.search + parsed.hash;
  // Very long custom base paths still leave a readable day cue on the postcard.
  return compact.length > 48 ? parsed.host + ' · #' + String(num).padStart(3, '0') : compact;
}

function offsetLabel(result){
  if (result.drained) return 'You drank the lot.';
  const pct = Math.round(Math.abs(result.f) * 100);
  return pct === 0 ? 'Dead center.' : pct + '% of mark ' + (result.f < 0 ? 'high' : 'low');
}

/** Pure text sharing. Each strip is its actual stopping position. */
export function buildShareText({num, key, theme, result, url = SITE_URL, preview = false, archive = false, review = false}){
  const status = statusLabel(result, preview, archive, review);
  const emoji = theme.emoji || (theme.vessel === 'stein' ? '🍻' : '🍺');
  const rounds = completedRound(result);
  return [
    'Split #' + String(num).padStart(3, '0') + ' · ' + emoji + ' ' + theme.name + ' · ' + theme.label + (status ? ' · ' + status : ''),
    (rounds ? 'Best of 3 · ' : '') + result.score + '/100 · ' + result.label,
    ...(rounds ? rounds.map((sip, index) => bandEmoji(sip.f) + '  ' + ROUND_LABELS[index] + ' ' + sip.score + '/100' + (index === result.bestIndex ? ' · Best' : '')) : [bandEmoji(result.f)]),
    rounds ? 'Beat my best. Your turn.' : 'Beat my sip. One sip. Your turn.',
    challengeUrl({url, key, num, preview, archive, theme, result, review})
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
  const paperCard = theme.scene === 'pub' || theme.colorScheme === 'dark';
  return {...p, paper: paperCard ? p.fg : p.sheet, ink: paperCard ? p.accentFg : p.fg,
    guidePaper: paperCard ? p.bg : p.sheet};
}

function placeCopy(theme){
  if (theme.scene === 'pub') return {title: 'Old Irish pub.', line: theme.name + ' · Ireland'};
  if (theme.scene === 'beach') return {title: 'Cabo, Mexico.', line: theme.name + ' · Beach day'};
  if (theme.scene === 'munich') return {title: 'Oktoberfest.', line: theme.name + ' · Munich, Germany'};
  return {title: theme.label || theme.name, line: theme.name + (theme.location ? ' · ' + theme.location : '')};
}

function drawGuide(c, G, P, result, palette, friend){
  const gh = G.bot - G.top, markY = G.top + P.markY * gh, lineY = G.top + result.L * gh;
  const markW = widthAt(G.glass, P.markY) * G.halfW;
  const lineW = widthAt(G.glass, result.L) * G.halfW;
  c.save();
  if (friend){
    const sharedY = G.top + friend.L * gh, sharedW = widthAt(G.glass, friend.L) * G.halfW;
    const labelY = Math.max(30, Math.min(PHOTO.h - 30, Math.abs(sharedY - markY) < 55 ? markY - 62 : sharedY));
    // A dashed line is the shared beer position; the solid STOP guide remains the player's actual boundary.
    c.setLineDash([8, 8]); c.beginPath();
    c.moveTo(G.cx - sharedW, sharedY); c.lineTo(G.cx + sharedW, sharedY);
    c.strokeStyle = palette.guidePaper; c.lineWidth = 6; c.stroke();
    c.strokeStyle = palette.fg; c.lineWidth = 2; c.stroke();
    c.setLineDash([]); c.beginPath(); c.moveTo(180, labelY);
    c.lineTo(218, labelY); c.lineTo(240, sharedY); c.lineTo(G.cx - sharedW - 14, sharedY);
    c.strokeStyle = palette.guidePaper; c.lineWidth = 5; c.stroke();
    c.strokeStyle = palette.fg; c.lineWidth = 2; c.stroke();
    c.fillStyle = palette.guidePaper; c.globalAlpha = 0.94; c.fillRect(18, labelY - 23, 155, 46);
    c.globalAlpha = 1; c.fillStyle = palette.fg; c.font = '700 26px ' + BODY;
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('SHARED ' + friend.score, 95, labelY);
  }
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

function drawBand(c, f, x, y, ink, scale = 1){
  const idx = f < -0.3 ? 0 : f < -0.1 ? 1 : f <= 0.1 ? 2 : f <= 0.3 ? 3 : 4;
  const outside = Math.abs(f) > 0.5;
  for (let i = 0; i < 5; i++){
    c.strokeStyle = ink; c.lineWidth = 2;
    c.strokeRect(x + i * 76 * scale, y, 60 * scale, 60 * scale);
    if (!outside && i === idx){
      c.fillStyle = i === 2 ? '#5a9d6b' : i === 1 || i === 3 ? '#e2b95c' : '#d77e44';
      c.fillRect(x + (i * 76 + 5) * scale, y + 5 * scale, 50 * scale, 50 * scale);
    }
  }
  if (outside){
    const ax = f < 0 ? x - 27 * scale : x + (5 * 76 + 11) * scale, ay = y + 30 * scale, dir = f < 0 ? -1 : 1;
    c.strokeStyle = ink; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(ax, ay - dir * 14 * scale); c.lineTo(ax, ay + dir * 14 * scale);
    c.moveTo(ax - 9 * scale, ay + dir * 4 * scale); c.lineTo(ax, ay + dir * 14 * scale); c.lineTo(ax + 9 * scale, ay + dir * 4 * scale); c.stroke();
  }
}

/** Draw synchronously after the caller has loaded the fonts and shared place assets. */
export function drawShareCard(canvas, {num, key, theme, P, result, friend = null, url = SITE_URL, preview = false, archive = false, review = false}){
  canvas.width = CARD_W; canvas.height = CARD_H;
  const c = canvas.getContext('2d'), palette = paletteFor(theme), place = placeCopy(theme);
  const rounds = completedRound(result);
  const doc = canvas.ownerDocument || document;
  const photo = doc.createElement('canvas'); photo.width = PHOTO.w; photo.height = PHOTO.h;
  const scene = photo.getContext('2d');
  const G = {cx: PHOTO.w / 2, top: 48, bot: 690, halfW: theme.vessel === 'bottle' ? 128 : theme.vessel === 'stein' ? 200 : 190, glass: renderVessel(theme)};
  // The same place and exact stopped level travel with the sip. Only the paper changes.
  drawScene(scene, {G, w: PHOTO.w, h: PHOTO.h, L: result.L, theme, P, bubbles: false, titleWash: false});
  drawGuide(scene, G, P, result, palette, friend);
  c.fillStyle = palette.paper; c.fillRect(0, 0, CARD_W, CARD_H);
  c.drawImage(photo, PHOTO.x, PHOTO.y);

  // A place-led postcard feels like something brought home from a shared trip.
  c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = palette.ink;
  c.font = '900 52px ' + DISPLAY; c.fillText('Split.', 64, 85);
  fitText(c, place.title, 64, 177, 952, 82, DISPLAY, 900);
  fitText(c, place.line, 64, 221, 952, 30, BODY, 600);
  c.textAlign = 'right'; c.font = '700 30px ' + BODY;
  c.fillText('#' + String(num).padStart(3, '0'), 1016, 82);
  const status = statusLabel(result, preview, archive, review);
  if (status){
    c.font = '700 23px ' + BODY;
    c.fillText(status + (archive && !preview && result.counts ? ' · saved sip' : ' · not saved'), 1016, 117);
  }

  // Score and error use different units: a score is /100, an offset is mark height.
  c.textAlign = 'left';
  if (rounds){
    c.font = '700 28px ' + BODY; c.fillText('Best of 3', 64, 1042);
  }
  c.font = '900 ' + (rounds ? 154 : 178) + 'px ' + DISPLAY;
  c.fillText(String(result.score), 64, rounds ? 1203 : 1189);
  c.font = '700 34px ' + BODY; c.fillText('/100', 72, 1237);
  if (rounds){
    fitText(c, result.label, 536, 1036, 480, 36, DISPLAY, 900);
    rounds.forEach((sip, index) => {
      const y = 1058 + index * 58;
      drawBand(c, sip.f, 552, y, palette.ink, 0.5);
      c.fillStyle = palette.ink;
      fitText(c, ROUND_LABELS[index] + ' ' + sip.score + (index === result.bestIndex ? ' · Best' : ''), 770, y + 22, 246, 22, BODY, index === result.bestIndex ? 800 : 600);
    });
  } else {
    fitText(c, result.label, 536, 1058, 480, 45, DISPLAY, 900);
    fitText(c, offsetLabel(result), 536, 1104, 480, 28, BODY, 600);
    drawBand(c, result.f, 552, 1146, palette.ink);
  }
  c.fillStyle = palette.ink;
  c.font = '600 22px ' + BODY;
  const comparison = comparisonCopy(friend, result);
  fitText(c, comparison ? 'You ' + result.score + ' · Shared sip ' + friend.score : rounds ? offsetLabel(result) : 'One stopping point', 536, 1240, 480, 22, BODY, 600);
  c.strokeStyle = palette.ink; c.globalAlpha = 0.25; c.lineWidth = 1;
  c.beginPath(); c.moveTo(64, 1267); c.lineTo(1016, 1267); c.stroke(); c.globalAlpha = 1;
  // Keep the printed address short; the benchmark travels in the text link, not an unreadable query on paper.
  fitText(c, cardUrl(challengeUrl({url, key, num, preview, review, theme}), num), 64, 1313, 450, 27, BODY, 700);
  c.textAlign = 'right'; fitText(c, rounds ? 'Beat my best. Your turn.' : 'Beat my sip. Your turn.', 1016, 1313, 510, 31, BODY, 700);
  return canvas;
}
