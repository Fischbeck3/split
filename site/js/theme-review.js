// A bookmark-only, unsaved glass catalog. It grants no publishing privileges.
import {THEMES, dayParams, keyForDay} from './core.js';

export function reviewHash(themeId){
  if (!THEMES.some(theme => theme.id === themeId)) throw new Error('Unknown review theme');
  return '#admin/' + themeId;
}

export function adjacentReviewTheme(themeId, direction){
  const index = Math.max(0, THEMES.findIndex(theme => theme.id === themeId));
  return THEMES[(index + (direction < 0 ? -1 : 1) + THEMES.length) % THEMES.length].id;
}

export function readThemeReview(hash = ''){
  if (!String(hash).startsWith('#admin')) return null;
  const match = /^#admin(?:\/([a-z][a-z0-9-]*))?$/.exec(hash);
  const requested = match?.[1];
  const found = THEMES.findIndex(theme => theme.id === requested);
  const index = found < 0 ? 0 : found, theme = THEMES[index];
  const num = index + 1, key = keyForDay(num);
  // Pin only this isolated pour. The public calendar and its released seeds stay fixed.
  const P = dayParams(num, {days:{[key]:{themeId:theme.id}}});
  return {index, num, key, kind:'preview', theme, P,
    notice: hash !== '#admin' && found < 0 ? 'That theme is unavailable. Showing Guinness.' : ''};
}
