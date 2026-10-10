// Unscheduled studio ideas. Nothing here joins the public release calendar.
import {hashStr, mulberry32} from './core.js';

const japan = {bg:'#14221f', fg:'#f2ead7', muted:'#b4bcae', sheet:'#20332b', line:'#4a5b4e', accent:'#dcb66b', accentFg:'#18251d'};
const magic = {bg:'#25201b', fg:'#f6ebd5', muted:'#c5b49d', sheet:'#342c23', line:'#685642', accent:'#e5bb71', accentFg:'#302218'};
const italy = {bg:'#efe8d9', fg:'#23483b', muted:'#547162', sheet:'#fffaf0', line:'#bfc8b5', accent:'#285c44', accentFg:'#fff8e8'};

function theme(id, name, label, vessel, settings){
  return {id:'concept-' + id, name, label, vessel, scene:'bar', body:['#efc65d','#cd8b2f'], head:'#fff5df', headT:.09,
    speed:1, bubbles:true, mark:'letter', letter:'P', markFill:'#f9edcf', markStroke:'#173328', target:'the P',
    brandText:name.toUpperCase(), garnish:'none', box:{top:.13,bot:.84,w:.3,h:.3}, ...settings};
}

export const CONCEPT_CHAPTERS = [
  {id:'japan', title:'Sapporo, Japan.', drink:'Sapporo', asset:'assets/concepts/japan-options.jpg', table:.57,
    brief:'A crisp star to split. Three ways to remember Japan: a tiny city counter, a snowy evening, or a grand old beer hall.',
    options:[
      {id:'tokyo-izakaya', name:'Tokyo izakaya', panel:0, memory:'One more at the little counter. The last train can wait.',
        glass:'Proposed souvenir glass · tall star glass', feel:'Crisp lager. A clean stop.',
        theme:theme('tokyo-izakaya','Sapporo','Tokyo izakaya','tall',{palette:japan, mark:'star', markFill:'#eac977', markStroke:'#3b2e16', target:'the star', brandSubline:'JAPAN'})},
      {id:'snowy-sapporo', name:'Snowy Sapporo', panel:1, memory:'Snow outside. Warm hands around the first beer.',
        glass:'Proposed souvenir glass · handled star mug', feel:'A solid mug. A clean stop.',
        theme:theme('snowy-sapporo','Sapporo','Snowy Sapporo','mug',{palette:japan, mark:'star', markFill:'#eac977', markStroke:'#3b2e16', target:'the star', headT:.12, speed:.9, brandSubline:'JAPAN'})},
      {id:'sapporo-hall', name:'Red-brick beer hall', panel:2, memory:'The long table fills up. Pull another chair closer.',
        glass:'Proposed souvenir glass · tulip star glass', feel:'Soft foam. A steady sip.',
        theme:theme('sapporo-hall','Sapporo','Sapporo beer hall','tulip',{palette:japan, mark:'star', markFill:'#eac977', markStroke:'#3b2e16', target:'the star', headT:.11, brandSubline:'JAPAN'})}
    ]},
  {id:'hogsmeade', title:'Butterbeer, Hogsmeade.', drink:'Butterbeer', asset:'assets/concepts/hogsmeade-options.jpg', table:.664,
    brief:'A sweet, foamy sip at the inn or in the snow. Bring the liquid line beneath the foam through the H.',
    options:[
      {id:'hogs-head', name:'The Hog’s Head', panel:0, memory:'A crooked table. Your friends. One sweet, foamy round.',
        glass:'Proposed souvenir glass · H-crest tavern mug', feel:'Thick foam. A slow sip with a clean stop.',
        theme:theme('hogs-head','Butterbeer','The Hog’s Head','mug',{palette:magic, body:['#d7973e','#91521e'], head:'#fff0cc', headT:.19, speed:.65,
          letter:'H', markFrame:'shield', markFill:'#f4deac', markStroke:'#3d2918', target:'the H crest', brandSubline:'HOGSMEADE'})},
      {id:'three-broomsticks', name:'Three Broomsticks', panel:1, memory:'The window fogs up. Nobody wants to head back yet.',
        glass:'Proposed souvenir glass · H-crest stein', feel:'A heavy stein. A little follow-through.',
        theme:theme('three-broomsticks','Butterbeer','Three Broomsticks','stein',{palette:magic, body:['#d7973e','#91521e'], head:'#fff0cc', headT:.17, speed:.7,
          letter:'H', markFrame:'shield', markFill:'#f4deac', markStroke:'#3d2918', target:'the H crest', brandSubline:'HOGSMEADE'})},
      {id:'snowy-hogsmeade', name:'Snowy Hogsmeade', panel:2, memory:'Snow on the rooftops. Something warm before the walk.',
        glass:'Proposed souvenir glass · H-crest tulip', feel:'A creamy head. A steady sip.',
        theme:theme('snowy-hogsmeade','Butterbeer','Snowy Hogsmeade','tulip',{palette:magic, body:['#d7973e','#91521e'], head:'#fff0cc', headT:.17, speed:.8,
          letter:'H', markFrame:'shield', markFill:'#f4deac', markStroke:'#3d2918', target:'the H crest', brandSubline:'HOGSMEADE'})}
    ]},
  {id:'rome', title:'Peroni, Rome.', drink:'Peroni', asset:'assets/concepts/rome-options.jpg', table:.66,
    brief:'Cold beer, warm stone, and a P to split. The same Roman holiday can look very different from a rooftop or a pavement table.',
    options:[
      {id:'trastevere-sunset', name:'Trastevere sunset', panel:0, memory:'Dinner runs late. Nobody checks the time.',
        glass:'Proposed souvenir glass · tall Peroni-label glass', feel:'Light lager. A clean stop.',
        theme:theme('trastevere-sunset','Peroni','Trastevere sunset','tall',{palette:italy, body:['#f1cf72','#d5a544'], head:'#fff8e7', headT:.065,
          markFill:'#245b9b', markStroke:'#fbf2d9', brandColor:'#245b9b', brandSubline:'ROMA'})},
      {id:'rooftop-rome', name:'Rooftop Rome', panel:1, memory:'The city lights come on. Stay for the next story.',
        glass:'Proposed souvenir glass · green bottle, Peroni label', feel:'A quick neck, then a slower glug.',
        theme:theme('rooftop-rome','Peroni','Rooftop Rome','bottle',{palette:italy, body:['#ebd17b','#ccab4b'], head:'#fff8e7', headT:.02,
          markFill:'#fff9e9', markStroke:'#215b32', brandColor:'#fff9e9', glassTint:'rgba(42,105,38,.24)', brandSubline:'ROMA', box:{top:.06,bot:.84,w:.26,h:.19}})},
      {id:'piazza-lunch', name:'Piazza lunch', panel:2, memory:'A table in the shade. The afternoon can wait.',
        glass:'Proposed souvenir glass · Peroni-label tumbler', feel:'An easy tumbler. A clean stop.',
        theme:theme('piazza-lunch','Peroni','Piazza lunch','tumbler',{palette:italy, body:['#f1cf72','#d5a544'], head:'#fff8e7', headT:.065,
          markFill:'#ab3e31', markStroke:'#fbf2d9', brandColor:'#ab3e31', brandSubline:'ROMA'})}
    ]}
];

export function conceptParams(option){
  const random = mulberry32(hashStr('split-concept:' + option.id));
  return {num:0, key:'concept:' + option.id, theme:option.theme,
    markY:.52 + random() * .065, markH:option.theme.markFrame === 'shield' ? .135 : .12,
    K:.135 + random() * .012, wobble:0, choppy:false};
}
