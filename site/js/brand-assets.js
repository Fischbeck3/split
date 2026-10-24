// Self-hosted glass print: decoded once before either the game or postcard paints.
import {GUINNESS_THEME_IDS} from './theme-expansion.js';
import {HALLOWEEN_GUINNESS_IDS} from './halloween-themes.js';
import {AUTUMN_GUINNESS_IDS} from './autumn-themes.js';
import {WINTER_GUINNESS_IDS} from './winter-themes.js';
import {HOLIDAY_GUINNESS_IDS} from './holiday-themes.js';
import {CHRISTMAS_GUINNESS_IDS} from './christmas-themes.js';
import {NFL_TEAMS} from './nfl-themes.js';
const NFL_BRANDS = new Set(NFL_TEAMS.map(team => 'nfl-'+team.abbr.toLowerCase()));
const nflImages = new Map(), nflLoads = new Map();
export const isNFLTheme = theme => NFL_BRANDS.has(theme?.brand);
export const nflPrintURL = theme => isNFLTheme(theme) ? new URL('../assets/brands/nfl/'+theme.brand.slice(4)+'.png',import.meta.url).href : null;
export const nflPrintImage = theme => nflImages.get(theme?.brand) || null;
async function loadNFLPrint(theme){
  if (!nflLoads.has(theme.brand)) nflLoads.set(theme.brand,new Promise(resolve => {
    if (typeof Image === 'undefined'){resolve(null);return;}
    const image = new Image();
    image.onload = async () => {try {await image.decode();nflImages.set(theme.brand,image);resolve(image);}catch {resolve(null);}};
    image.onerror = () => resolve(null);
    image.src = nflPrintURL(theme);
  }));
  return nflLoads.get(theme.brand);
}
const GUINNESS_PRINT_URL = new URL('../assets/brands/guinness-glass-print.svg', import.meta.url).href;
let guinnessImage = null, guinnessLoad = null;

/** The original glass print is common to every Guinness seat and ambience. */
export const isGuinnessTheme = theme => theme?.id === 'pub' || theme?.brand === 'guinness' || GUINNESS_THEME_IDS.includes(theme?.id) || HALLOWEEN_GUINNESS_IDS.includes(theme?.id) || AUTUMN_GUINNESS_IDS.includes(theme?.id) || WINTER_GUINNESS_IDS.includes(theme?.id) || HOLIDAY_GUINNESS_IDS.includes(theme?.id) || CHRISTMAS_GUINNESS_IDS.includes(theme?.id);

/** Other drinks use vector marks and never request the Guinness print. */
export async function loadBrandAssets(theme){
  if (isNFLTheme(theme)) return loadNFLPrint(theme);
  if (theme && !isGuinnessTheme(theme)) return null;
  if (!guinnessLoad) guinnessLoad = new Promise(resolve => {
    if (typeof Image === 'undefined'){ resolve(null); return; }
    try {
      const image = new Image();
      image.onload = async () => {
        try {
          await image.decode();
          guinnessImage = image; resolve(image);
        } catch { resolve(null); }
      };
      image.onerror = () => resolve(null);
      image.src = GUINNESS_PRINT_URL;
    } catch { resolve(null); }
  });
  return guinnessLoad;
}

/** Null until decoded, or after a failure; callers retain their vector fallback. */
export function guinnessPrintImage(){ return guinnessImage; }
