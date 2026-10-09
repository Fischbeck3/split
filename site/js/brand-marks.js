// Compact glass-print artwork. The incoming origin is always the scored height:
// the top of Guinness's G crossbar, or the center of the other five emblems.
// Coordinates below are fractions of h; no font or image download is required.
const INK = '#183d50', GOLD = '#c4a254', PAPER = '#fff5d9';

function polygon(c, points){
  c.beginPath();
  for (const [i, [x, y]] of points.entries()) i ? c.lineTo(x, y) : c.moveTo(x, y);
  c.closePath();
}
function shield(c, w = .48, top = -.53, bottom = .56){
  c.beginPath(); c.moveTo(-w, top); c.lineTo(w, top); c.lineTo(w, .08);
  c.bezierCurveTo(w, .33, w * .58, bottom - .03, 0, bottom);
  c.bezierCurveTo(-w * .58, bottom - .03, -w, .33, -w, .08); c.closePath();
}
function dot(c, x, y, r){ c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
function word(c, text, y, size, maxWidth, color, family = 'Georgia, serif', weight = 700){
  c.fillStyle = color; c.font = `${weight} ${size}px ${family}`;
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 0, y, maxWidth);
}

function guinness(c, theme){
  const path = outline => {
    c.beginPath(); c.moveTo(.43, -.35);
    c.bezierCurveTo(.23, -.61, -.25, -.64, -.45, -.32);
    c.bezierCurveTo(-.63, -.02, -.47, .54, -.06, .54);
    c.bezierCurveTo(.17, .54, .35, .43, .46, .29);
    c.lineTo(.46, 0);
    // The outline skips this edge: its filled top is exactly the scored height.
    if (outline) c.moveTo(.005, 0); else c.lineTo(.005, 0);
    c.lineTo(.005, .145); c.lineTo(.235, .145); c.lineTo(.235, .275);
    c.bezierCurveTo(.065, .42, -.235, .32, -.25, .035);
    c.bezierCurveTo(-.29, -.285, .025, -.46, .265, -.23);
    // A cut serif at the upper terminal gives the G the Guinness print's shape.
    c.lineTo(.335, -.20); c.lineTo(.43, -.35);
    if (!outline) c.closePath();
  };
  c.lineCap = 'butt'; c.lineWidth = .035;
  c.strokeStyle = theme.markStroke || '#1a110b'; c.fillStyle = theme.markFill || '#f3e9cf';
  path(true); c.stroke(); path(false); c.fill();
  // Lower stem serif remains below cy, including its outline.
  polygon(c, [[.235,.18],[.46,.18],[.46,.29],[.50,.29],[.50,.345],[.19,.345],[.19,.29],[.235,.29]]);
  c.stroke(); c.fill();
}

function corona(c){
  c.fillStyle = GOLD; c.strokeStyle = INK; c.lineWidth = .036;
  polygon(c, [[-.47,.32],[-.52,-.30],[-.29,-.055],[-.26,-.44],[-.115,-.055],
    [0,-.54],[.115,-.055],[.26,-.44],[.29,-.055],[.52,-.30],[.47,.32]]);
  c.fill(); c.stroke();
  // Five rounded jewels and the bowed lower band distinguish the crown from a W.
  for (const [x,y] of [[-.52,-.31],[-.26,-.45],[0,-.55],[.26,-.45],[.52,-.31]]){
    c.fillStyle = GOLD; dot(c,x,y,.047); c.stroke();
  }
  c.beginPath(); c.moveTo(-.46,.22); c.quadraticCurveTo(0,.28,.46,.22);
  c.lineTo(.43,.43); c.quadraticCurveTo(0,.48,-.43,.43); c.closePath();
  c.fillStyle = INK; c.fill(); c.strokeStyle = PAPER; c.lineWidth = .025; c.stroke();
  c.strokeStyle = PAPER; c.lineWidth = .022;
  c.beginPath(); c.moveTo(-.40,.10); c.quadraticCurveTo(0,.17,.40,.10); c.stroke();
  c.fillStyle = PAPER;
  for (const x of [-.25,0,.25]) dot(c,x,.33,.026);
}

function bavaria(c){
  c.save(); shield(c,.45,-.52,.56); c.clip();
  c.fillStyle = '#fff8e7'; c.fillRect(-.6,-.65,1.2,1.3);
  c.fillStyle = '#2367ad';
  // Slanted blue and white lozenges, as on Bavarian flags and festival glassware.
  for (let row = -3; row <= 3; row++){
    for (let col = -4; col <= 4; col++){
      const x = col * .27 + row * .095, y = row * .34;
      polygon(c, [[x-.05,y-.20],[x+.145,y],[x+.05,y+.20],[x-.145,y]]); c.fill();
    }
  }
  c.restore(); shield(c,.45,-.52,.56);
  c.strokeStyle = '#244c75'; c.lineWidth = .066; c.stroke();
  c.strokeStyle = GOLD; c.lineWidth = .03; c.stroke();
}

function sapporo(c){
  c.strokeStyle = '#1b2722'; c.lineWidth = .035;
  c.beginPath(); c.arc(0,0,.50,0,Math.PI * 2); c.stroke();
  c.strokeStyle = GOLD; c.lineWidth = .018;
  c.beginPath(); c.arc(0,0,.515,0,Math.PI * 2); c.stroke();
  c.beginPath();
  for (let i = 0; i < 10; i++){
    const angle = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .19 : .44;
    const x = Math.cos(angle) * r, y = Math.sin(angle) * r;
    i ? c.lineTo(x,y) : c.moveTo(x,y);
  }
  c.closePath(); c.fillStyle = '#d6b15a'; c.fill();
  c.strokeStyle = '#17251e'; c.lineWidth = .035; c.stroke();
}

function peroni(c){
  const red = '#b52131', blue = '#163d71';
  shield(c,.49,-.50,.55); c.fillStyle = '#fff9e9'; c.fill();
  c.strokeStyle = blue; c.lineWidth = .034; c.stroke();
  // Blue ribbon, the red/gold seal and the red serif wordmark are the label cues.
  polygon(c,[[-.61,-.40],[-.51,-.50],[0,-.44],[.51,-.50],[.61,-.40],[.53,-.30],[0,-.35],[-.53,-.30]]);
  c.fillStyle = blue; c.fill(); c.strokeStyle = PAPER; c.lineWidth = .015; c.stroke();
  c.fillStyle = red; dot(c,0,-.42,.17); c.strokeStyle = GOLD; c.lineWidth = .018; c.stroke();
  c.save(); c.translate(0,-.42); c.scale(.17,.17); eagle(c,GOLD); c.restore();
  c.fillStyle = '#fff9e9'; c.fillRect(-.58,-.17,1.16,.34);
  // The P stays part of the actual name. The split runs through this wordmark's center.
  word(c,'PERONI',0,.28,1.15,red,'Georgia, serif',900);
  polygon(c,[[-.60,.19],[-.47,.16],[0,.20],[.47,.16],[.60,.19],[.54,.32],[0,.38],[-.54,.32]]);
  c.fillStyle = blue; c.fill();
  word(c,'NASTRO AZZURRO',.275,.088,1.04,'#fff9e9','Georgia, serif',700);
  c.strokeStyle = GOLD; c.lineWidth = .018;
  c.beginPath(); c.moveTo(-.34,.43); c.quadraticCurveTo(0,.55,.34,.43); c.stroke();
}

// Four small heraldic silhouettes: their strong outlines survive the phone size.
function lion(c, color){
  c.fillStyle = color; c.strokeStyle = color; c.lineWidth = .11;
  c.beginPath(); c.moveTo(-.16,.28); c.bezierCurveTo(-.37,.06,-.30,-.24,-.11,-.25);
  c.lineTo(.11,-.30); c.lineTo(.20,-.12); c.lineTo(.10,.03);
  c.lineTo(.25,.10); c.lineTo(.33,-.05); c.lineTo(.42,-.02); c.lineTo(.34,.22);
  c.lineTo(.03,.20); c.lineTo(.10,.39); c.lineTo(.27,.39); c.lineTo(.27,.49);
  c.lineTo(-.06,.49); c.lineTo(-.16,.28); c.lineTo(-.28,.45); c.lineTo(-.44,.45);
  c.lineTo(-.44,.35); c.closePath(); c.fill();
  dot(c,.05,-.32,.19); dot(c,.18,-.33,.12);
  c.beginPath(); c.moveTo(-.22,.13); c.bezierCurveTo(-.55,.03,-.53,-.31,-.36,-.38); c.stroke();
  c.beginPath(); c.ellipse(-.34,-.40,.10,.06,-.5,0,Math.PI * 2); c.fill();
}
function serpent(c){
  c.strokeStyle = '#dddccc'; c.fillStyle = '#dddccc'; c.lineWidth = .14;
  c.beginPath(); c.moveTo(.16,-.37); c.bezierCurveTo(-.35,-.40,-.40,-.04,.03,.01);
  c.bezierCurveTo(.39,.06,.36,.35,-.02,.34); c.quadraticCurveTo(-.30,.34,-.25,.48); c.stroke();
  c.beginPath(); c.ellipse(.18,-.37,.14,.09,0,0,Math.PI * 2); c.fill();
  c.fillStyle = '#163c2b'; dot(c,.21,-.40,.025);
}
function eagle(c, color){
  c.fillStyle = color;
  polygon(c, [[0,-.32],[-.15,-.20],[-.43,-.42],[-.45,-.20],[-.32,-.04],[-.42,-.08],
    [-.29,.08],[-.35,.06],[-.19,.22],[-.09,.14],[-.07,.33],[-.22,.48],
    [0,.39],[.22,.48],[.07,.33],[.09,.14],[.19,.22],[.35,.06],[.29,.08],
    [.42,-.08],[.32,-.04],[.45,-.20],[.43,-.42],[.15,-.20]]); c.fill();
  dot(c,.01,-.32,.105); polygon(c,[[.06,-.37],[.20,-.30],[.06,-.26]]); c.fill();
}
function badger(c){
  c.fillStyle = '#27271e';
  c.beginPath(); c.ellipse(-.065,.05,.32,.17,0,0,Math.PI * 2); c.fill();
  polygon(c,[[.17,-.04],[.31,-.035],[.46,.08],[.26,.13],[.15,.09]]); c.fill();
  c.fillRect(-.25,.12,.09,.20); c.fillRect(.11,.11,.09,.19);
  polygon(c,[[-.36,.05],[-.48,.02],[-.37,.13]]); c.fill();
  c.fillStyle = '#f8eac4'; polygon(c,[[.20,-.03],[.26,-.04],[.41,.07],[.30,.085]]); c.fill();
  c.fillStyle = '#27271e'; dot(c,.25,-.045,.06);
}
function hogwarts(c){
  const border = '#6b4825', parchment = '#eddbad';
  c.save(); shield(c,.51,-.54,.56); c.clip();
  c.fillStyle = '#8d2930'; c.fillRect(-.56,-.60,.56,.60);
  c.fillStyle = '#24503d'; c.fillRect(0,-.60,.56,.60);
  c.fillStyle = '#d0a645'; c.fillRect(-.56,0,.56,.66);
  c.fillStyle = '#294c73'; c.fillRect(0,0,.56,.66);
  for (const [x,y,draw] of [[-.275,-.285,lion],[.275,-.285,serpent],[-.265,.265,badger],[.265,.265,eagle]]){
    c.save(); c.translate(x,y); c.scale(.44,.44); draw(c,'#dcbb6d'); c.restore();
  }
  c.restore(); shield(c,.51,-.54,.56); c.strokeStyle = border; c.lineWidth = .07; c.stroke();
  c.strokeStyle = '#d5b15e'; c.lineWidth = .029; c.stroke();
  c.fillStyle = parchment; dot(c,0,0,.19); c.strokeStyle = border; c.lineWidth = .024; c.stroke();
  // A geometric serif H keeps its crossbar centered at cy independent of fonts.
  c.fillStyle = '#392a1d';
  c.fillRect(-.115,-.14,.05,.28); c.fillRect(.065,-.14,.05,.28); c.fillRect(-.075,-.024,.15,.048);
  for (const x of [-.115,.065]){
    c.fillRect(x-.024,-.155,.098,.03); c.fillRect(x-.024,.125,.098,.03);
  }
  // The top banner names the school; the bottom parchment echoes the familiar crest.
  polygon(c,[[-.62,-.60],[-.54,-.66],[0,-.61],[.54,-.66],[.62,-.60],[.54,-.50],[0,-.54],[-.54,-.50]]);
  c.fillStyle = parchment; c.fill(); c.strokeStyle = border; c.lineWidth = .023; c.stroke();
  word(c,'HOGWARTS',-.575,.112,.95,border,'Georgia, serif',700);
  polygon(c,[[-.57,.50],[-.42,.47],[0,.56],[.42,.47],[.57,.50],[.50,.64],[0,.69],[-.50,.64]]);
  c.fillStyle = parchment; c.fill(); c.stroke();
  c.strokeStyle = border; c.lineWidth = .015;
  c.beginPath(); c.moveTo(-.32,.57); c.quadraticCurveTo(0,.64,.32,.57); c.stroke();
}

const DRAWERS = {pub: guinness, beach: corona, munich: bavaria, sapporo, peroni, butterbeer: hogwarts};
const CONCEPT_DRAWERS = new Map([['Sapporo',sapporo],['Butterbeer',hogwarts],['Peroni',peroni]]);

/** Paint a released or named concept brand at its scoring origin. Other themes keep their generic mark. */
export function drawBrandMark(c, theme, cx, cy, h){
  const draw = Object.hasOwn(DRAWERS, theme?.id) ? DRAWERS[theme.id] : CONCEPT_DRAWERS.get(theme?.name);
  if (!draw || ![cx,cy,h].every(Number.isFinite) || h <= 0) return false;
  c.save(); c.translate(cx,cy); c.scale(h,h); c.lineJoin = 'round'; c.lineCap = 'round';
  draw(c,theme); c.restore(); return true;
}
