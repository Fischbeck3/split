// December's festive cups are new entries. Earlier glasses and pours stay intact.
export const DECEMBER_FEATURE_IDS = Object.freeze([
  'december-local','december-market','december-lodge','december-game-day','december-desert','december-midnight'
]);

// One painted gathering per day, in December order. Existing paintings receive
// sibling glasses rather than changing their original review definitions.
export const DECEMBER_LINEUP = Object.freeze([
  {id:'december-market',cup:'market'},
  {id:'december-dublin-snug',cup:'local',source:'christmas-guinness-dublin-snug'},
  {id:'december-paris-cafe',cup:'midnight',source:'christmas-stella-paris-cafe'},
  {id:'december-record-night',cup:'game-day',source:'christmas-high-life-record-night'},
  {id:'december-canal-boat',cup:'market',source:'christmas-heineken-amsterdam-boat'},
  {id:'december-game-day',cup:'game-day'},
  {id:'december-tivoli',cup:'market',source:'christmas-carlsberg-tivoli'},
  {id:'december-local',cup:'local'},
  {id:'december-london-lights',cup:'local',source:'winter-guinness-london'},
  {id:'december-brussels-lights',cup:'midnight',source:'winter-stella-brussels'},
  {id:'december-copenhagen-harbor',cup:'market',source:'winter-carlsberg-copenhagen'},
  {id:'december-lodge',cup:'lodge'},
  {id:'december-prague-cellar',cup:'market',source:'winter-pilsner-prague'},
  {id:'december-dublin-gathering',cup:'local',source:'winter-guinness-dublin'},
  {id:'december-scottish-train',cup:'local',source:'christmas-guinness-edinburgh-train'},
  {id:'december-posada',cup:'desert',source:'christmas-modelo-posada'},
  {id:'december-seville-patio',cup:'desert',source:'christmas-estrella-seville-patio'},
  {id:'december-desert',cup:'desert'},
  {id:'december-boston-rooftop',cup:'game-day',source:'christmas-sam-adams-boston-rooftop'},
  {id:'december-milwaukee-lights',cup:'game-day',source:'winter-high-life-milwaukee'},
  {id:'december-edinburgh-hearth',cup:'local',source:'winter-guinness-edinburgh'},
  {id:'december-london-supper',cup:'local',source:'christmas-guinness-london-supper'},
  {id:'december-sierra-cabin',cup:'lodge',source:'christmas-sierra-high-sierras-cabin'},
  {id:'december-home-tree',cup:'local',source:'christmas-guinness-home-tree'},
  {id:'december-christmas-lodge',cup:'lodge',source:'christmas-coors-sleigh-lodge'},
  {id:'december-irish-pub',cup:'local',source:'winter-pub'},
  {id:'december-new-york',cup:'local',source:'winter-guinness-new-york'},
  {id:'december-amsterdam-snow',cup:'market',source:'winter-heineken-amsterdam'},
  {id:'december-barcelona-tapas',cup:'desert',source:'winter-estrella-barcelona'},
  {id:'december-vienna-evening',cup:'market',source:'christmas-pilsner-vienna-market'},
  {id:'december-midnight',cup:'midnight'}
].map((entry,index)=>Object.freeze({...entry,date:'2026-12-'+String(index+1).padStart(2,'0')})));
export const DECEMBER_THEME_IDS = Object.freeze(DECEMBER_LINEUP.map(entry=>entry.id));
export const DECEMBER_CALENDAR_DAYS = Object.freeze(Object.fromEntries(DECEMBER_LINEUP.map(({id,date})=>[
  date,Object.freeze({themeId:id,campaignId:'december-2026'})
])));

const palette=(bg,sheet,accent,muted,line)=>({bg,sheet,accent,muted,line,fg:'#f8eed9',accentFg:bg});
export function decemberThemes(themes){
  const pub=themes.find(theme=>theme.id==='pub');
  const lager={name:'Holiday lager',vessel:'mug',body:['#efc65d','#c4872d'],head:'#fff5df',headT:.08,
    box:{top:.16,bot:.84,w:.32,h:.34},markRange:[.50,.56],markHRange:[.14,.14],
    markFill:'#c5343e',markStroke:'#1a2922',speed:1,choppy:false,bubbles:true,garnish:'none',
    brandPrint:true,emoji:'🍺',colorScheme:'dark'};
  const cups={
    local:{...pub,brand:'guinness',colorScheme:'dark',festivePrint:'holly',label:'Christmas at the local',location:'THE CHRISTMAS LOCAL',
      memory:'Lights above the bar. Your friends kept a seat.',feel:'holly-printed Guinness pint'},
    market:{...lager,brand:'december-fir',mark:'fir',target:'the fir tree',festivePrint:'fir',
      label:'Market lights',location:'THE CHRISTMAS MARKET',memory:'Stars above the stalls. One more in the square.',
      feel:'etched Christmas market mug',palette:palette('#172c35','#263d45','#e4c27d','#c0d0ce','#5b777a')},
    lodge:{...lager,name:'Winter amber ale',vessel:'nonic',brand:'december-star',mark:'star',target:'the star',
      festivePrint:'fair-isle',markFill:'#edcf80',box:{top:.13,bot:.84,w:.32,h:.30},
      label:'Fireside after the slopes',location:'THE CHRISTMAS LODGE',memory:'Boots by the fire. Snow beyond the glass.',
      feel:'Fair Isle printed pint',palette:palette('#32251d','#443328','#e7bf82','#d4bfa4','#826951')},
    'game-day':{...lager,name:'Golden holiday lager',vessel:'cup',material:'plastic',headT:.045,
      brand:'december-football',mark:'football',target:'the laces',festivePrint:'candy-cane',markFill:'#e6c277',
      box:{top:.20,bot:.84,w:.34,h:.35},label:'A very merry game day',location:'THE HOLIDAY WATCH PARTY',
      memory:'The tree is lit. Everyone has their usual seat.',feel:'candy-striped party cup',
      palette:palette('#192d2b','#293e37','#dfbe79','#b9c9b7','#587466')},
    desert:{...lager,name:'Festive golden lager',vessel:'tumbler',brand:'december-bauble',mark:'bauble',target:'the bauble',
      festivePrint:'poinsettia',box:{top:.23,bot:.84,w:.35,h:.39},headT:.055,
      label:'Christmas in the desert',location:'THE DESERT CHRISTMAS PATIO',
      memory:'Paper stars. A little fire as the mountains turn pink.',feel:'poinsettia-printed tumbler',
      palette:palette('#35272f','#49343b','#ebc38d','#d5bcb5','#886775')},
    midnight:{...lager,name:'Golden celebration ale',vessel:'tulip',renderVessel:'chalice',brand:'december-midnight',
      mark:'star',target:'the midnight star',festivePrint:'confetti',markFill:'#efcf7c',
      box:{top:.12,bot:.84,w:.32,h:.34},markRange:[.40,.46],markHRange:[.13,.13],headT:.055,
      label:'One last holiday toast',location:'MIDNIGHT AT THE LOCAL',
      memory:'The tree stays lit. One more before the year turns.',feel:'gold-confetti beer chalice',
      palette:palette('#15263b','#24364c','#e6c579','#bfcbd9','#5b7089')}
  };
  return DECEMBER_LINEUP.map(entry=>{
    const cup=cups[entry.cup],source=entry.source && themes.find(theme=>theme.id===entry.source);
    if(entry.source && !source) throw new Error('Missing December scene: '+entry.source);
    const label=source?.label || cup.label, memory=source?.memory || cup.memory;
    return {...cup,id:entry.id,label,memory,scene:source?.scene || entry.id,location:source?.location || cup.location,
      line:memory+' Split '+cup.target+'.',seasonal:'december',preview:true,sourceThemeId:entry.source,
      collectionDate:entry.date};
  });
}
