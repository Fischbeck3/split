import {mountSeasonalGallery} from './seasonal-gallery.js';
import {CHRISTMAS_THEME_IDS} from './christmas-themes.js';
import {HANUKKAH_THEME_IDS} from './holiday-themes.js';
const names=['Christmas around the home tree','Vienna Christmas market','Paris Christmas café','Milwaukee Christmas record night',
  'Dublin Christmas snug','Amsterdam Christmas canal boat','Christmas at Tivoli','London Christmas supper',
  'Seville Christmas patio','Mexico City posada courtyard','Colorado Christmas lodge','Scottish Christmas train',
  'Boston holiday rooftop','High Sierras Christmas cabin'];
const vessels=['Guinness tulip pint','Handled beer mug','Stella chalice','Brown long-neck bottle','Guinness tulip pint',
  'Tall lager glass','Slim lager glass','Guinness tulip pint','Small tapas glass','Clear beer bottle',
  'Frosty nonic pint','Guinness tulip pint','Clear plastic party cup','Brown short-neck bottle'];
const places=CHRISTMAS_THEME_IDS.map((id,i)=>({id,name:names[i],vessel:vessels[i]}));
const hanukkahNames=['Window lights','Dreidel night','Bakery gathering'];
const hanukkahVessels=['Guinness tulip pint','Golden lager glass','Amber ale tumbler'];
mountSeasonalGallery([
  {grid:'christmasFirstGrid',places:places.slice(0,7)},
  {grid:'christmasSecondGrid',places:places.slice(7)},
  {grid:'hanukkahGrid',places:HANUKKAH_THEME_IDS.map((id,i)=>({id,name:hanukkahNames[i],vessel:hanukkahVessels[i]}))}
]);
