// Holiday review collections are separate from published dates and campaigns.
export const THANKSGIVING_THEME_IDS = Object.freeze([
  'thanksgiving-homecoming','thanksgiving-friendsgiving','thanksgiving-harvest-porch',
  'thanksgiving-football','thanksgiving-wishbone','thanksgiving-pie-kitchen','thanksgiving-fireside'
]);
export const HANUKKAH_THEME_IDS = Object.freeze([
  'hanukkah-window-lights','hanukkah-dreidel-night','hanukkah-bakery'
]);
export const HOLIDAY_THEME_IDS = Object.freeze([...THANKSGIVING_THEME_IDS,...HANUKKAH_THEME_IDS]);
export const HOLIDAY_GUINNESS_IDS = Object.freeze([
  'thanksgiving-homecoming','thanksgiving-fireside','hanukkah-window-lights'
]);
// Fourteen already-built winter scenes, arranged with a familiar G every third glass.
export const CHRISTMAS_REVIEW_IDS = Object.freeze([
  'winter-pub','winter-pilsner-prague','winter-stella-brussels','winter-guinness-dublin',
  'winter-heineken-amsterdam','winter-high-life-milwaukee','winter-guinness-london',
  'winter-estrella-barcelona','winter-carlsberg-copenhagen','winter-guinness-edinburgh',
  'winter-modelo-mexico-city','winter-coors-apres-ski','winter-guinness-new-york','winter-sam-adams-boston'
]);

const colors=(bg,sheet,accent,muted,line)=>({bg,sheet,accent,muted,line,fg:'#f8eed9',accentFg:bg});
const harvest=colors('#2b241c','#3c3022','#e1b776','#cbb99f','#79654d');
const porch=colors('#283225','#39412e','#dfbe70','#c2c7a9','#687855');
const football=colors('#192d2b','#293e37','#dfbe79','#b9c9b7','#587466');
const supper=colors('#342522','#49332c','#e3bf87','#d1b7a3','#866859');
const kitchen=colors('#203434','#2e4644','#e9be82','#bdcfc3','#5c7d76');
const fire=colors('#29241f','#3b3027','#dbb780','#c7b89f','#77634d');
const lights=colors('#182b3b','#283d4d','#e3c88f','#bbccda','#5c778b');
const games=colors('#202d42','#303f54','#dfc789','#bdcce0','#637a99');
const bakery=colors('#342b25','#48382c','#e5c28c','#d0bda4','#866f58');

export function holidayThemePreviews(pub){
  const pint=(id,label,location,memory,palette,seasonal)=>({...pub,id,label,location,memory,palette,
    scene:id,line:memory+' Split the G.',brand:'guinness',colorScheme:'dark',preview:true,seasonal});
  const beer=(id,name,label,location,vessel,body,mark,target,memory,palette,seasonal,extra={})=>({
    id,name,label,location,vessel,body,mark,target,memory,palette,scene:id,seasonal,preview:true,
    line:memory+' Split '+target+'.',brand:'holiday-'+mark,brandPrint:true,colorScheme:'dark',emoji:'🍺',
    head:'#fff2dc',headT:.08,box:{top:.13,bot:.84,w:.32,h:.32},markFill:'#e5bd7c',markStroke:'#192321',
    markRange:[.52,.585],markHRange:[.14,.14],speed:1,choppy:false,bubbles:true,garnish:'none',...extra
  });
  return [
    pint('thanksgiving-homecoming','Homecoming pub','THE HOMETOWN PUB',
      'Coats on the hooks. The old friends are back.',harvest,'thanksgiving'),
    beer('thanksgiving-friendsgiving','Harvest amber ale','Friendsgiving','THE FRIENDSGIVING LOFT','nonic',
      ['#d98d36','#9e521c'],'leaf','the leaf','Chairs pulled close. Everyone brought something.',harvest,'thanksgiving',
      {feel:'warm amber pint',markFill:'#b76b38'}),
    beer('thanksgiving-harvest-porch','Copper pale ale','Harvest porch','THE FARMHOUSE PORCH','tumbler',
      ['#dfad57','#b56f28'],'turkey','the turkey','Gold across the valley. One more on the porch.',porch,'thanksgiving',
      {feel:'copper porch ale',box:{top:.23,bot:.84,w:.35,h:.39},markFill:'#ad6240',headT:.07}),
    beer('thanksgiving-football','Golden lager','Football afternoon','THE LIVING ROOM','cup',
      ['#e8bc5b','#c28a30'],'football','the laces','The game is on. Your usual seat is waiting.',football,'thanksgiving',
      {feel:'crisp lager in a plastic cup',material:'plastic',box:{top:.20,bot:.84,w:.34,h:.35},headT:.045,markFill:'#a95e31'}),
    beer('thanksgiving-wishbone','Honey lager','Wishbone toast','THE HOLIDAY TABLE','tulip',
      ['#efc976','#d59c49'],'wishbone','the wishbone','Candles on the table. Make a little wish.',supper,'thanksgiving',
      {feel:'honey-gold chalice',renderVessel:'chalice',markFill:'#f2dfb7',markRange:[.40,.46],markHRange:[.135,.135],headT:.055,box:{top:.12,bot:.84,w:.32,h:.34}}),
    beer('thanksgiving-pie-kitchen','Pumpkin ale','Pie kitchen','THE PIE KITCHEN','mug',
      ['#dc913f','#af6028'],'pie','the pie','Pies on the counter. Dinner runs into dessert.',kitchen,'thanksgiving',
      {feel:'copper pumpkin ale',box:{top:.20,bot:.84,w:.31,h:.35},markFill:'#d5944b',headT:.09}),
    pint('thanksgiving-fireside','After-dinner fire','THE CABIN FIRE',
      'The plates are cleared. Nobody rushes home.',fire,'thanksgiving'),
    pint('hanukkah-window-lights','Window lights','THE HANUKKAH WINDOW',
      'A candle at the window. Friends settle in.',lights,'hanukkah'),
    beer('hanukkah-dreidel-night','Festival lager','Dreidel night','THE DREIDEL TABLE','tall',
      ['#efd178','#d2a43e'],'dreidel','the dreidel','Chocolate coins. Another spin around the table.',games,'hanukkah',
      {feel:'bright festival lager',box:{top:.12,bot:.84,w:.28,h:.28},markFill:'#527ba0',headT:.09}),
    beer('hanukkah-bakery','Bakery amber ale','Bakery gathering','THE HANUKKAH BAKERY','tumbler',
      ['#dca05b','#b16c30'],'jam','the jam dot','Warm doughnuts. One more at the baker’s table.',bakery,'hanukkah',
      {feel:'soft amber ale',box:{top:.23,bot:.84,w:.35,h:.39},markFill:'#ecd2a2',headT:.075})
  ];
}
