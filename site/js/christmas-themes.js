// New Christmas settings inherit familiar foreground drinks, independently of dates.
export const CHRISTMAS_BASE_IDS=Object.freeze([
  'pub','pilsner-prague','stella-brussels','high-life-milwaukee','guinness-dublin',
  'heineken-amsterdam','carlsberg-copenhagen','guinness-london','estrella-barcelona',
  'modelo-mexico-city','coors-apres-ski','guinness-edinburgh','sam-adams-boston','sierra-high-sierras'
]);
export const CHRISTMAS_THEME_IDS=Object.freeze([
  'christmas-guinness-home-tree','christmas-pilsner-vienna-market','christmas-stella-paris-cafe',
  'christmas-high-life-record-night','christmas-guinness-dublin-snug','christmas-heineken-amsterdam-boat',
  'christmas-carlsberg-tivoli','christmas-guinness-london-supper','christmas-estrella-seville-patio',
  'christmas-modelo-posada','christmas-coors-sleigh-lodge','christmas-guinness-edinburgh-train',
  'christmas-sam-adams-boston-rooftop','christmas-sierra-high-sierras-cabin'
]);
export const CHRISTMAS_GUINNESS_IDS=Object.freeze([0,4,7,11].map(i=>CHRISTMAS_THEME_IDS[i]));
const memories=[
  ['Christmas at home','THE CHRISTMAS TREE','Lights on the tree. The old friends are here.'],
  ['Vienna market','VIENNA CHRISTMAS MARKET','Stars above the stalls. One more in the square.'],
  ['Paris Christmas café','PARIS CHRISTMAS CAFÉ','Rain on the street. Stay a little longer.'],
  ['Record night','MILWAUKEE RECORD NIGHT','Another record. The Christmas lights stay on.'],
  ['Dublin snug','DUBLIN CHRISTMAS SNUG','Garland over the door. Your corner is waiting.'],
  ['Canal boat Christmas','AMSTERDAM CANAL BOAT','Bridge lights on the water. Friends aboard.'],
  ['Tivoli lights','COPENHAGEN CHRISTMAS GARDENS','Snow in the gardens. The carousel glows.'],
  ['London supper','LONDON CHRISTMAS SUPPER','Dinner is over. Everyone stays for one more.'],
  ['Seville patio','SEVILLE CHRISTMAS PATIO','Stars above the patio. Warm December air.'],
  ['Posada courtyard','MEXICO CITY POSADA','Paper stars. Another round in the courtyard.'],
  ['Christmas lodge','COLORADO CHRISTMAS LODGE','Boots off by the fire. Snow beyond the glass.'],
  ['Christmas train','THE SCOTTISH CHRISTMAS TRAIN','Snow beyond the window. Homeward together.'],
  ['Boston rooftop','BOSTON CHRISTMAS ROOFTOP','Lights across the roofs. One more with friends.'],
  ['Sierra cabin','HIGH SIERRAS CHRISTMAS CABIN','Pines outside. Christmas by the cabin fire.']
];
export function christmasThemePreviews(themes){
  return CHRISTMAS_BASE_IDS.map((baseId,index)=>{
    const base=themes.find(theme=>theme.id===baseId);
    if(!base)throw new Error('Missing Christmas base theme: '+baseId);
    const [label,location,memory]=memories[index];
    return {...base,id:CHRISTMAS_THEME_IDS[index],scene:CHRISTMAS_THEME_IDS[index],baseThemeId:baseId,
      brand:base.brand||(baseId==='pub'?'guinness':undefined),
      colorScheme:base.colorScheme||(baseId==='pub'?'dark':undefined),
      label,location,memory,line:memory+' Split '+base.target+'.',seasonal:'christmas',preview:true};
  });
}
