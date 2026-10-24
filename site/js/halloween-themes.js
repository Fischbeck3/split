// Eight Halloween settings; explicit date assignments live in calendar-data.js.
export const HALLOWEEN_THEME_IDS = Object.freeze([
  'halloween-pumpkin-porch', 'halloween-ghost-stories', 'halloween-witching-hour',
  'halloween-ravens-rest', 'halloween-vampires-toast', 'halloween-midnight-carnival', 'halloween-last-orders',
  'halloween-lantern-maze'
]);
export const HALLOWEEN_GUINNESS_IDS = Object.freeze(['halloween-ravens-rest','halloween-last-orders','halloween-lantern-maze']);

const palette = (bg, sheet, accent, muted, line) => ({bg,sheet,accent,muted,line,fg:'#f8eed9',accentFg:bg});
const porch = palette('#2b211a','#3c2b20','#edb562','#cbb297','#775b3f');
const ghost = palette('#172a30','#243b40','#e0c897','#b4cac6','#537472');
const witch = palette('#152a23','#213e2e','#b1d778','#b3c9a1','#527647');
const raven = palette('#19231f','#28352c','#d1b477','#b7c3af','#5b6e53');
const vampire = palette('#301a26','#462334','#e2a494','#c9a9b9','#805366');
const carnival = palette('#241c36','#362847','#d4abdf','#c1afd1','#745587');
const crypt = palette('#1b2527','#2c3837','#d6be8c','#b7c4b7','#627465');

export function halloweenThemePreviews(pub){
  const beer = (id,name,label,location,vessel,body,mark,target,memory,colors,options={}) => ({
    id,name,label,location,vessel,body,mark,target,memory,palette:colors,scene:id,
    line:memory+' Split '+target+'.', brand:'halloween-'+mark, brandPrint:true, preview:true, seasonal:'halloween',
    colorScheme:'dark',emoji:'🍺',head:'#fff2d9',headT:.08,
    box:{top:.13,bot:.84,w:.32,h:.32},markFill:'#f4dcab',markStroke:'#192321',
    markRange:[.52,.585],markHRange:[.14,.14],speed:1,choppy:false,bubbles:true,garnish:'none', ...options
  });
  const guinness = (id,label,location,memory,colors) => ({...pub,
    id,label,location,memory,palette:colors,scene:id,brand:'guinness',preview:true,seasonal:'halloween',colorScheme:'dark',
    line:memory+' Split the G.'
  });
  return [
    beer('halloween-pumpkin-porch','Pumpkin ale','Pumpkin porch','THE PUMPKIN PORCH','tumbler',
      ['#e99437','#ac4c1c'],'pumpkin','the pumpkin','Lanterns on the steps. Friends stay for one more.',porch,
      {feel:'copper pumpkin ale',box:{top:.23,bot:.84,w:.35,h:.39},markFill:'#ed9e44',headT:.09}),
    beer('halloween-ghost-stories','Wheat beer','Ghost stories','THE OLD MANOR','tall',
      ['#f0d788','#cca950'],'ghost','the ghost','A sheet in the doorway. Nobody volunteers to look.',ghost,
      {feel:'pale wheat beer',markFill:'#fff4de',headT:.10,box:{top:.12,bot:.84,w:.28,h:.28}}),
    beer('halloween-witching-hour','Witch’s brew','Witching hour','THE WITCH’S KITCHEN','mug',
      ['#5faf7d','#246747'],'cauldron','the cauldron','Candles by the copper pot. Something green in your mug.',witch,
      {feel:'emerald fantasy beer',markFill:'#2d4735',markHRange:[.15,.15],box:{top:.20,bot:.84,w:.31,h:.35},head:'#e9f0cc'}),
    guinness('halloween-ravens-rest','Raven’s Rest','THE HAUNTED IRISH PUB',
      'Cobwebs over the bar. A raven watches the next round.',raven),
    beer('halloween-vampires-toast','Red ale','Vampire’s toast','THE VAMPIRE’S BANQUET','tulip',
      ['#b93e51','#681a33'],'bat','the bat wings','Candles along the table. Capes over the chairs.',vampire,
      {feel:'crimson red ale',renderVessel:'chalice',markFill:'#eee2cf',markRange:[.40,.46],markHRange:[.135,.135],head:'#f4d8cc',headT:.045,box:{top:.12,bot:.84,w:.32,h:.34}}),
    beer('halloween-midnight-carnival','Midnight brew','Midnight carnival','THE MIDNIGHT CARNIVAL','nonic',
      ['#9068bf','#563379'],'skull','the skull','The rides have stopped. Your table stays bright.',carnival,
      {feel:'violet fantasy beer',markFill:'#f8e9cf',head:'#eadef6',markHRange:[.15,.15]}),
    guinness('halloween-last-orders','Last orders','THE CRYPT BEER GARDEN',
      'Pumpkins on the walls. One last pint beside the crypt.',crypt),
    guinness('halloween-lantern-maze','Lantern maze','THE HALLOWEEN CORN MAZE',
      'Lanterns in the corn. A pint before the path turns.',porch)
  ];
}
