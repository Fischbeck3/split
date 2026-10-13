// Seasonal review seats inherit the real glass; the published calendar stays separate.
export const WINTER_BASE_IDS = Object.freeze([
  'pub', 'guinness-dublin', 'guinness-london', 'guinness-edinburgh', 'guinness-new-york',
  'heineken-amsterdam', 'pilsner-prague', 'stella-brussels', 'carlsberg-copenhagen', 'estrella-barcelona',
  'modelo-mexico-city', 'sam-adams-boston', 'high-life-milwaukee', 'coors-apres-ski', 'sierra-high-sierras'
]);
export const WINTER_THEME_IDS = Object.freeze(WINTER_BASE_IDS.map(id => 'winter-' + id));
export const WINTER_GUINNESS_IDS = Object.freeze(WINTER_THEME_IDS.slice(0,5));

const memories = [
  ['Christmas at the Irish pub','Stockings above the fire. The usual table is waiting.'],
  ['Dublin Christmas gathering','A wreath at the window. Friends settle in from the cold.'],
  ['London winter lights','Rain outside. Golden stars at the window.'],
  ['Edinburgh winter hearth','Snow on the rooftops. One more pint beside the fire.'],
  ['New York Christmas evening','Snow along the street. Your friends stay for one more.'],
  ['Amsterdam snowy canals','Snow by the canal. Warm windows opposite.'],
  ['Prague Christmas cellar','Greenery over the long table. The next round arrives.'],
  ['Brussels Christmas lights','Market lights across the winter square.'],
  ['Copenhagen winter harbor','Lanterns at the table. The harbor settles into blue.'],
  ['Barcelona Christmas tapas','Stars above the street. Shared plates and a late dinner.'],
  ['Mexico City winter','Paper stars over the doorway. Another round with friends.'],
  ['Boston winter ballpark','Snow in the empty stands. The ballpark lights stay warm.'],
  ['Milwaukee lights','Old colored bulbs above the bar. Your usual table is free.'],
  ['Christmas après-ski','Fresh snow on the deck. One last run told around the table.'],
  ['High Sierras camp','Snow by the lake. The tent glows as the peaks turn blue.']
];

export function winterThemePreviews(themes){
  return WINTER_BASE_IDS.map((baseId,index) => {
    const base = themes.find(theme => theme.id === baseId);
    if (!base) throw new Error('Missing winter base theme: ' + baseId);
    const [label,memory] = memories[index];
    return {...base,id:WINTER_THEME_IDS[index],scene:WINTER_THEME_IDS[index],baseThemeId:baseId,
      brand:base.brand || (baseId === 'pub' ? 'guinness' : undefined),
      colorScheme:base.colorScheme || (baseId === 'pub' ? 'dark' : undefined),
      label,memory,line:memory + ' Split ' + base.target + '.',seasonal:'winter',preview:true};
  });
}
