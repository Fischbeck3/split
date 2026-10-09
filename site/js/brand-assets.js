// Self-hosted glass print: decoded once before either the game or postcard paints.
const GUINNESS_PRINT_URL = new URL('../assets/brands/guinness-glass-print.svg', import.meta.url).href;
let guinnessImage = null, guinnessLoad = null;

/** Other drinks use vector marks and never request the Guinness print. */
export async function loadBrandAssets(theme){
  if (theme && theme.id !== 'pub') return null;
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
