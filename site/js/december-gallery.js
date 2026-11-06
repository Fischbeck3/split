import {mountSeasonalGallery} from './seasonal-gallery.js';
import {DECEMBER_LINEUP,DECEMBER_FEATURE_IDS} from './december-themes.js';
import {themeById} from './core.js';

const place=entry=>{
  const theme=themeById(entry.id);
  return {id:entry.id,name:'Dec '+Number(entry.date.slice(-2))+' · '+theme.label,vessel:theme.feel};
};
const remaining=DECEMBER_LINEUP.filter(entry=>!DECEMBER_FEATURE_IDS.includes(entry.id));
mountSeasonalGallery([
  {grid:'newGlasses',places:DECEMBER_FEATURE_IDS.map(id=>place(DECEMBER_LINEUP.find(entry=>entry.id===id)))},
  {grid:'decemberEarlyGrid',places:remaining.filter(entry=>entry.date<='2026-12-10').map(place)},
  {grid:'decemberMiddleGrid',places:remaining.filter(entry=>entry.date>'2026-12-10' && entry.date<='2026-12-20').map(place)},
  {grid:'decemberLateGrid',places:remaining.filter(entry=>entry.date>'2026-12-20').map(place)}
]);
