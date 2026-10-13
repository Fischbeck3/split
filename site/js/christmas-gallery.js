import {mountSeasonalGallery} from './seasonal-gallery.js';
import {CHRISTMAS_REVIEW_IDS,HANUKKAH_THEME_IDS} from './holiday-themes.js';
const names=['Christmas at the Irish pub','Prague Christmas cellar','Brussels Christmas lights','Dublin Christmas gathering',
  'Amsterdam snowy canals','Milwaukee Christmas tavern','London winter lights','Barcelona Christmas tapas',
  'Copenhagen winter harbor','Edinburgh winter hearth','Mexico City December cantina','Christmas après-ski',
  'New York Christmas evening','Boston winter ballpark'];
const vessels=['Guinness tulip pint','Handled beer mug','Stella chalice','Guinness tulip pint','Tall lager glass',
  'Brown long-neck bottle','Guinness tulip pint','Small tapas glass','Slim lager glass','Guinness tulip pint',
  'Clear beer bottle','Frosty nonic pint','Guinness tulip pint','Clear plastic ballpark cup'];
const places=CHRISTMAS_REVIEW_IDS.map((id,i)=>({id,name:names[i],vessel:vessels[i]}));
const hanukkahNames=['Window lights','Dreidel night','Bakery gathering'];
const hanukkahVessels=['Guinness tulip pint','Golden lager glass','Amber ale tumbler'];
mountSeasonalGallery([
  {grid:'christmasFirstGrid',places:places.slice(0,7)},
  {grid:'christmasSecondGrid',places:places.slice(7)},
  {grid:'hanukkahGrid',places:HANUKKAH_THEME_IDS.map((id,i)=>({id,name:hanukkahNames[i],vessel:hanukkahVessels[i]}))}
]);
