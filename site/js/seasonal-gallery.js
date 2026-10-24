import {startLevel, scoreFromOffset} from './core.js';
import {drawScene, loadSceneAssets, SCENE_ART} from './draw.js';
import {renderVessel} from './render-vessels.js';
import {readThemeReview} from './theme-review.js';
import {drawShareCard} from './share.js';
import {SITE_URL} from './config.js';
import {isNFLTheme,nflPrintImage} from './brand-assets.js';

export function mountSeasonalGallery(groups){
const PLACES = groups.flatMap(group => group.places.map(place => ({...place,grid:group.grid})));
const reviews = [];
const fontReady = document.fonts.ready;
const arrow = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 13 13 3M4 3h9v9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function node(tag, className, text){
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text !== undefined) item.textContent = text;
  return item;
}

function glassBox(theme,w,h){
  const bottle = theme.vessel === 'bottle';
  const handled = theme.vessel === 'mug' || theme.vessel === 'stein';
  const top = h * (bottle ? .18 : .26), bot = h * .9;
  const halfW = Math.min(w * .29,(bot - top) * (bottle ? .19 : handled ? .32 : .28));
  return {cx:w / 2 - (handled ? halfW * .2 : 0),top,bot,halfW,glass:renderVessel(theme)};
}

function paint(review){
  const {canvas,P} = review;
  const w = 360,h = 486,dpr = Math.min(2,window.devicePixelRatio || 1);
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  const c = canvas.getContext('2d');
  if (!c) throw new Error('Canvas is unavailable.');
  c.setTransform(dpr,0,0,dpr,0,0);
  drawScene(c,{G:glassBox(P.theme,w,h),w,h,L:startLevel(P.theme),theme:P.theme,P,bubbles:false,ambient:false,titleWash:false,targetHint:1});
}

async function checkArt(theme){
  const art = SCENE_ART[theme.scene];
  if (!art) return false;
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(image.naturalWidth > 10 && image.naturalHeight > 10);
    image.onerror = () => resolve(false);
    image.src = art.url;
  });
}

function showIssue(review,message){
  if (review.error) return;
  const warning = node('p','scene-error',message + ' ');
  const retry = node('a','','Reload the scenes'); retry.href = location.pathname + '#' + review.place.id;
  retry.addEventListener('click',event => {event.preventDefault(); location.reload();});
  warning.append(retry); review.article.append(warning); review.error = warning;
}

async function loadReview(review){
  if (review.loading) return review.loading;
  review.loading = (async () => {
    try {
      const [,artReady] = await Promise.all([loadSceneAssets(review.P.theme),checkArt(review.P.theme),fontReady]);
      paint(review); review.loadingLabel.hidden = true; review.loaded = true;
      if (!artReady) showIssue(review,'The illustrated scene could not load. You can still try the glass.');
      else if (isNFLTheme(review.P.theme) && !nflPrintImage(review.P.theme)) showIssue(review,'The team print could not load. Open the glass to try it with the team initials.');
    } catch {
      review.loadingLabel.hidden = true;
      showIssue(review,'The preview could not load. Open the glass to try it.');
    }
  })();
  return review.loading;
}

async function showPostcard(review){
  if (review.postcardReady || review.postcardLoading) return;
  review.postcardLoading = true;
  await loadReview(review);
  const sample = {...scoreFromOffset(0,review.P.theme.target),f:0,L:review.P.markY,mode:'hold',counts:false,drained:false};
  try {
    drawShareCard(review.card,{num:review.num,key:review.key,theme:review.P.theme,P:review.P,result:sample,url:SITE_URL,review:true});
    const blob = await new Promise(resolve => review.card.toBlob(resolve,'image/png'));
    if (!blob) throw new Error('Postcard export is unavailable.');
    review.download.href = URL.createObjectURL(blob);
    review.download.hidden = false; review.postcardReady = true;
    review.card.setAttribute('aria-label',review.place.name + ' sample review postcard. Illustrative perfect split, 100 out of 100. Not a saved score.');
  } catch {
    review.sampleNote.textContent = 'The sample postcard could not load. Open this glass and take a sip to see its result card.';
    review.card.hidden = true;
  } finally { review.postcardLoading = false; }
}

function build(place){
  const route = readThemeReview('#admin/' + place.id);
  if (!route || route.theme.id !== place.id){
    document.getElementById('loadNotice').hidden = false;
    document.getElementById('loadNotice').textContent = 'Some review glasses are unavailable. Reload the page to try again.';
    return;
  }
  const theme = route.theme, article = node('article','theme'); article.id = place.id;
  const titleId = place.id + '-title'; article.setAttribute('aria-labelledby',titleId);
  article.style.setProperty('--scene-bg',theme.palette.bg);
  const sceneLink = node('a','scene-link'); sceneLink.href = './#admin/' + place.id;
  sceneLink.setAttribute('aria-label','Try ' + theme.name + ' · ' + place.name + '. Unsaved theme review.');
  const canvas = node('canvas'); canvas.setAttribute('role','img');
  canvas.setAttribute('aria-label',theme.label + '. ' + theme.memory + ' ' + place.vessel + '. Split ' + theme.target + '. The dashed line shows the target.');
  const loadingLabel = node('span','scene-loading','Preparing this glass'); loadingLabel.setAttribute('aria-hidden','true');
  sceneLink.append(canvas,loadingLabel);
  const heading = node('h3','',place.name); heading.id = titleId;
  const beer = node('p','beer-name',theme.name);
  const memory = node('p','theme-memory',theme.memory), vessel = node('p','vessel-info',place.vessel + ' · split ' + theme.target);
  const tryLink = node('a','try-link','Try this glass'); tryLink.href = sceneLink.href;
  tryLink.innerHTML += arrow; tryLink.setAttribute('aria-label','Try the ' + place.name + ' glass. Scores are not saved.');
  const details = node('details','postcard-details');
  const summary = node('summary','','See a sample postcard');
  const postcardBody = node('div','postcard-body'), card = node('canvas'); card.setAttribute('role','img');
  card.setAttribute('aria-label','Loading the sample ' + place.name + ' postcard.');
  const sampleNote = node('p','','Sample · 100/100 · not saved');
  const download = node('a','download-link','Save sample postcard'); download.download = 'split-' + place.id + '-sample.png'; download.hidden = true;
  postcardBody.append(card,sampleNote,download); details.append(summary,postcardBody);
  article.append(sceneLink,heading,beer,memory,vessel,tryLink,details);
  document.getElementById(place.grid).append(article);
  const review = {...route,place,article,canvas,loadingLabel,card,sampleNote,download,details,loaded:false};
  details.addEventListener('toggle',() => {if (details.open) showPostcard(review);});
  reviews.push(review);
  try {paint(review);} catch { /* Text and the playable link remain available. */ }
}

PLACES.forEach(build);
if ('IntersectionObserver' in window){
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries){
      if (!entry.isIntersecting) continue;
      const review = reviews.find(item => item.article === entry.target);
      if (review) loadReview(review);
      observer.unobserve(entry.target);
    }
  },{rootMargin:'500px 0px'});
  reviews.forEach(review => observer.observe(review.article));
} else reviews.forEach(loadReview);

window.addEventListener('pagehide',event => {
  // Back navigation restores this document and its already generated downloads.
  if (event.persisted) return;
  for (const review of reviews){if (review.postcardReady) URL.revokeObjectURL(review.download.href);}
});

}
