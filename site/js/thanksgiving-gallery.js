import {mountSeasonalGallery} from './seasonal-gallery.js';
import {THANKSGIVING_THEME_IDS} from './holiday-themes.js';
const names=['Homecoming pub','Friendsgiving','Harvest porch','Football afternoon','Wishbone toast','Pie kitchen','After-dinner fire'];
const vessels=['Guinness tulip pint','Amber nonic pint','Copper ale tumbler','Clear plastic game-day cup','Honey lager chalice','Pumpkin ale mug','Guinness tulip pint'];
mountSeasonalGallery([{grid:'thanksgivingGrid',places:THANKSGIVING_THEME_IDS.map((id,i)=>({id,name:names[i],vessel:vessels[i]}))}]);
