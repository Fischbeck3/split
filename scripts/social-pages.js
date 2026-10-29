// One small page per date, so a shared link previews that day's glass instead of
// the launch card. The game is unchanged: each page restores ?day= and plays as usual.
import {dayParams, dayNumber} from '../site/js/core.js';
import {playAddress} from '../site/js/day-page.js';

// Shares open dates up to today, but the site is rebuilt only when it changes,
// so pages are built well ahead. Later dates fall back to 404.html, which still plays.
export const HORIZON_DAYS = 400;
export const SOCIAL_DIR = 'og';

export const socialImagePath = theme => SOCIAL_DIR + '/' + theme.id + '.jpg';

/** Every dated challenge from No. 1 to the horizon, with the glass it pours. */
export function dayPages(now = new Date()){
  const last = dayNumber(now) + HORIZON_DAYS, pages = [];
  for (let num = 1; num <= last; num++) pages.push(dayParams(num));
  return pages;
}

/** The headline people already know from the pub: Split the G. */
export function socialHeadline(theme){
  return 'Can you split ' + (theme.target || 'the mark') + '?';
}

const escapeHtml = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function replaceOne(html, pattern, replacement, name){
  if ((html.match(new RegExp(pattern.source, 'g')) || []).length !== 1) throw new Error('Day pages expect one ' + name + ' in index.html.');
  return html.replace(pattern, () => replacement);
}

/** Restores the game's ?day= address before any module reads it. */
export const restoreScript = '<script>(function(){var next=(' + playAddress.toString() + ')(location.href);if(next)history.replaceState(history.state,"",next);})();</script>';

/** index.html for one date: its own preview, title and opening copy, assets from the site root. */
export function renderDayPage(html, {P, siteUrl, image}){
  const {num, key, theme} = P, no = String(num).padStart(3, '0');
  const pageUrl = new URL('d/' + key + '/', siteUrl).href, imageUrl = new URL(image, siteUrl).href;
  const title = 'Split No. ' + no + ' · ' + socialHeadline(theme);
  const description = theme.label + ' · ' + theme.name + '. One glass a day, three sips: sober, tipsy, drunk. Stop the beer on the mark.';
  const alt = theme.name + ' at ' + theme.label + '. ' + socialHeadline(theme) + ' One glass a day on Split.';
  const meta = (pattern, name, value) => { html = replaceOne(html, pattern, value, name); };
  meta(/<meta charset="utf-8">/, 'charset', '<meta charset="utf-8">\n<base href="../../">\n' + restoreScript);
  meta(/<title>[^<]*<\/title>/, 'title', '<title>' + escapeHtml(title) + '</title>');
  meta(/<meta name="description" content="[^"]*">/, 'description', '<meta name="description" content="' + escapeHtml(description) + '">');
  meta(/<meta property="og:title" content="[^"]*">/, 'social title', '<meta property="og:title" content="' + escapeHtml(socialHeadline(theme)) + '">');
  meta(/<meta property="og:description" content="[^"]*">/, 'social description', '<meta property="og:description" content="' + escapeHtml('Split No. ' + no + ' · ' + theme.label + '. Three sips. Beat your friends.') + '">');
  meta(/<link rel="canonical" href="[^"]*">/, 'canonical URL', '<link rel="canonical" href="' + pageUrl + '">\n<meta name="robots" content="noindex">');
  meta(/<meta property="og:url" content="[^"]*">/, 'social URL', '<meta property="og:url" content="' + pageUrl + '">');
  meta(/<meta property="og:image" content="[^"]*">/, 'social image', '<meta property="og:image" content="' + imageUrl + '">');
  meta(/<meta property="og:image:alt" content="[^"]*">/, 'social image text', '<meta property="og:image:alt" content="' + escapeHtml(alt) + '">');
  meta(/<meta name="twitter:image" content="[^"]*">/, 'Twitter image', '<meta name="twitter:image" content="' + imageUrl + '">');
  meta(/<meta name="twitter:image:alt" content="[^"]*">/, 'Twitter image text', '<meta name="twitter:image:alt" content="' + escapeHtml(alt) + '">');
  // The opening copy already names this glass, so nothing flashes before the game loads.
  meta(/<span class="day-number" id="introNo">[^<]*<\/span>/, 'day number', '<span class="day-number" id="introNo">No. ' + no + '</span>');
  meta(/<h1 id="introName">[^<]*<\/h1>/, 'glass name', '<h1 id="introName">' + escapeHtml(theme.label) + '</h1>');
  meta(/<p id="hudSub">[^<]*<\/p>/, 'glass line', '<p id="hudSub">' + escapeHtml(theme.name) + '</p>');
  meta(/<h2 id="introGoal">[^<]*<\/h2>/, 'goal', '<h2 id="introGoal">Split ' + escapeHtml(theme.target || 'the mark') + '.</h2>');
  return html;
}

/** Any date past the horizon still plays: the not-found page forwards to the game. */
export function renderNotFound(siteUrl){
  return '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>Split</title>\n' +
    '<script>(function(){var next=(' + playAddress.toString() + ')(location.href);if(next)location.replace(next);})();</script>\n' +
    '<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#142b24;color:#eee7d6;font:600 18px/1.4 Karla,"Helvetica Neue",Arial,sans-serif}a{color:#d9b874}</style>\n' +
    '</head>\n<body>\n<p>That page isn’t here. <a href="' + escapeHtml(siteUrl) + '">Play today’s glass</a>.</p>\n</body>\n</html>\n';
}

