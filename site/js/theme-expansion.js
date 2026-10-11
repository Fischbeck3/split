// Isolated travel previews. Nothing in this catalog publishes a calendar day.
export const GUINNESS_THEME_IDS = Object.freeze(['guinness-dublin', 'guinness-london', 'guinness-edinburgh', 'guinness-new-york', 'guinness-chicago']);
export const PREVIEW_THEME_IDS = Object.freeze([
  ...GUINNESS_THEME_IDS,
  'heineken-amsterdam', 'pilsner-prague', 'stella-brussels', 'carlsberg-copenhagen', 'estrella-barcelona',
  'modelo-mexico-city', 'sam-adams-boston', 'high-life-milwaukee', 'coors-apres-ski', 'sierra-high-sierras'
]);

const daylight = (bg, fg, accent, muted = '#596e61') => ({bg, fg, muted, sheet:'#fff9ed', line:'#c5cbbb', accent, accentFg:'#fff9ed'});
const evening = (bg, accent, muted = '#b5b7a0') => ({bg, fg:'#f4ead5', muted, sheet:'#253129', line:'#536052', accent, accentFg:bg});

/** Guinness changes its seat and light; the original vessel and pour stay exact. */
export function travelThemePreviews(pub){
  const guinness = (id, label, location, memory, palette, colorScheme) => ({...pub,
    id, label, location, memory, palette, colorScheme, scene:id, brand:'guinness',
    line:memory + ' Split the G.', preview:true
  });
  const lager = (id, name, label, location, vessel, memory, palette, print, target, options = {}) => ({
    id, name, label, location, vessel, scene:id, memory, palette, brand:print, brandPrint:true,
    line:memory + ' Split ' + target + '.', target, colorScheme:'light', feel:'crisp lager', emoji:'🍺',
    box:{top:.13, bot:.84, w:.30, h:.30}, body:['#f2c45c','#d79a32'], head:'#fff6e1', headT:.075,
    mark:'crest', markFill:'#173f34', markStroke:'#fff6e1', markRange:[.52,.585], markHRange:[.13,.13],
    speed:1, choppy:false, bubbles:true, garnish:'none', preview:true, ...options
  });
  return [
    guinness('guinness-dublin', 'Dublin afternoon', 'DUBLIN, IRELAND', 'Daylight across the bar. Your friends settle in.',
      daylight('#efe7d2','#253a2a','#416847','#697260'), 'light'),
    guinness('guinness-london', 'London rain', 'LONDON, ENGLAND', 'Coats on the chairs. Rain at the pub window.',
      evening('#152924','#d2b071','#b7bbad'), 'dark'),
    guinness('guinness-edinburgh', 'Edinburgh fireside', 'EDINBURGH, SCOTLAND', 'Cold hands around a pint. The fire catches.',
      {...evening('#29251e','#d8ad6a','#c2b59e'),sheet:'#393126',line:'#685c49'}, 'dark'),
    guinness('guinness-new-york', 'New York dusk', 'NEW YORK, USA', 'One more outside. The street lights come on.',
      {...evening('#1b2b30','#d4b876','#b5bbc0'),sheet:'#26393c',line:'#526566'}, 'dark'),
    guinness('guinness-chicago', 'Chicago St. Patrick’s Day', 'CHICAGO, USA', 'Green river. Friends in green. A pint in the spring sun.',
      daylight('#e9edd9','#153e2e','#286545','#5f745d'), 'light'),
    lager('heineken-amsterdam','Heineken','Amsterdam canals','AMSTERDAM, NETHERLANDS','tall',
      'Bicycles against the rail. Another round by the canal.', daylight('#eee7d7','#264d39','#34784c'), 'heineken','the star',
      {mark:'star',markFill:'#c22c35',markStroke:'#fff6e1',feel:'canal-side lager'}),
    lager('pilsner-prague','Pilsner Urquell','Prague beer cellar','PRAGUE, CZECHIA','mug',
      'A full mug. A long table. The evening is still young.', evening('#292a1e','#d9b75a','#bfc1a0'), 'pilsner','the wordmark',
      {colorScheme:'dark',headT:.13,body:['#e5b74b','#bb7720'],speed:.9,feel:'foamy Czech pilsner',box:{top:.2,bot:.84,w:.31,h:.34}}),
    lager('stella-brussels','Stella Artois','Brussels café','BRUSSELS, BELGIUM','tulip',
      'Wet cobbles. A café table. Nobody checks the time.', daylight('#ece8dd','#394e43','#8f2c32','#657365'), 'stella','the crest',
      {renderVessel:'chalice',markFill:'#ae2634',markRange:[.40,.46],markHRange:[.135,.135],feel:'gold-rimmed chalice',box:{top:.12,bot:.84,w:.32,h:.34}}),
    lager('carlsberg-copenhagen','Carlsberg','Copenhagen harbor','COPENHAGEN, DENMARK','tall',
      'The harbor turns gold. Your table stays in the shade.', daylight('#e9ead8','#205240','#26724b'), 'carlsberg','the wordmark',
      {box:{top:.12,bot:.84,w:.27,h:.27},feel:'harbor lager'}),
    lager('estrella-barcelona','Estrella Damm','Barcelona tapas','BARCELONA, SPAIN','tumbler',
      'Shared plates. A small cold glass. Dinner runs late.', daylight('#f1e2c9','#683f2b','#ad3530','#89644b'), 'estrella','the star',
      {headT:.055,mark:'star',markFill:'#b22d31',markStroke:'#f5d573',feel:'small tapas glass',box:{top:.22,bot:.84,w:.31,h:.33},body:['#e9bd5a','#c99434']}),
    lager('modelo-mexico-city','Modelo Especial','Mexico City cantina','MEXICO CITY, MEXICO','bottle',
      'Limes on a little plate. The table orders another round.', daylight('#efe3ca','#365741','#b2822c','#6d7356'), 'modelo','the wordmark',
      {box:{top:.06,bot:.84,w:.26,h:.19},headT:.015,feel:'cantina bottle',emoji:'🍾',markHRange:[.12,.12],body:['#f4d774','#dcb74c']}),
    lager('sam-adams-boston','Samuel Adams','Fenway afternoon','BOSTON, USA','cup',
      'Peanut shells underfoot. Your friends watch the next pitch.', daylight('#e8ecd6','#234939','#a23a35','#607360'), 'sam-adams','the name',
      {box:{top:.20,bot:.84,w:.34,h:.35},headT:.045,feel:'ballpark plastic cup',body:['#d9a13f','#ae6b21'],material:'plastic',markFill:'#224c73',markHRange:[.14,.14]}),
    lager('high-life-milwaukee','Miller High Life','Milwaukee corner bar','MILWAUKEE, USA','bottle',
      'The corner stools are taken. Your usual table is free.', evening('#302d24','#d4b56d','#bfb69e'), 'high-life','the label',
      {box:{top:.06,bot:.84,w:.26,h:.19},colorScheme:'dark',headT:.015,feel:'amber longneck',emoji:'🍾',markFill:'#a62d2f',body:['#e8b957','#bb842d'],bottleTint:'rgba(112,51,15,.46)',markHRange:[.12,.12]}),
    lager('coors-apres-ski','Coors Banquet','Colorado après-ski','COLORADO, USA','nonic',
      'Boots off. Cold pints. One last run told around the table.', daylight('#e8e8dc','#354d52','#a33b34','#687b7b'), 'coors','the wordmark',
      {headT:.085,box:{top:.13,bot:.84,w:.32,h:.32},feel:'frosty après-ski pint',material:'frosted',markFill:'#ab3530',markHRange:[.14,.14],body:['#e8bf5c','#c39134']}),
    lager('sierra-high-sierras','Sierra Nevada Pale Ale','High Sierras camp','HIGH SIERRAS, USA','bottle',
      'Boots by the tent. Friends by the lake. The peaks catch the last light.', evening('#28372e','#d6b574','#b8c4a9'), 'sierra','the name',
      {colorScheme:'dark',box:{top:.13,bot:.84,w:.31,h:.25},headT:.018,feel:'amber camp bottle',emoji:'🍾',markFill:'#246a3e',markRange:[.52,.585],markHRange:[.14,.14],body:['#d69539','#a76220'],bottleTint:'rgba(96,43,13,.50)'})
  ];
}
