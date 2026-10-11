// Compact glass and bottle print geometry for the travel previews.
// Each mark's scored feature is centered at y=0; captions belong to the print.
const GREEN = '#165e3d', RED = '#b72632', GOLD = '#c4a254', PAPER = '#fff7df', BLUE = '#183d69';
function path(c, points){
  c.beginPath(); points.forEach(([x,y],i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.closePath();
}
function circle(c,x,y,r,color){ c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fillStyle=color; c.fill(); }
function star(c,x,y,r,color){
  const points = Array.from({length:10},(_,i) => {
    const a = -Math.PI/2 + i*Math.PI/5, radius = i%2 ? r*.40 : r;
    return [x+Math.cos(a)*radius,y+Math.sin(a)*radius];
  });
  path(c,points); c.fillStyle=color; c.fill();
}
// Layout text in ordinary font pixels before scaling, avoiding subpixel font
// rounding that can lift small labels out of their printed cartouches.
function text(c,value,x,y,size,width,color,{italic=false,family='Georgia, serif',weight=700} = {}){
  c.save(); c.scale(.01,.01); c.fillStyle=color;
  c.font=`${italic?'italic ':''}${weight} ${size*100}px ${family}`;
  c.textAlign='center'; c.textBaseline='middle'; c.fillText(value,x*100,y*100,width*100); c.restore();
}
function line(c,points,color,width=.018){
  c.beginPath(); points.forEach(([x,y],i) => i ? c.lineTo(x,y) : c.moveTo(x,y));
  c.strokeStyle=color; c.lineWidth=width; c.stroke();
}

function heineken(c){
  star(c,0,0,.46,RED); c.strokeStyle=PAPER; c.lineWidth=.027; c.stroke();
  text(c,'Heineken',0,.64,.25,1.65,GREEN,{family:'Georgia, serif',weight:900});
  text(c,'ORIGINAL',0,.87,.095,.78,GREEN,{family:'Karla, sans-serif'});
  line(c,[[-.55,.81],[-.43,.81]],RED); line(c,[[.43,.81],[.55,.81]],RED);
}
function pilsner(c){
  circle(c,0,-.52,.18,RED); circle(c,0,-.52,.145,PAPER); circle(c,0,-.52,.124,RED);
  text(c,'1842',0,-.52,.072,.22,PAPER);
  text(c,'Pilsner',0,0,.31,1.52,GREEN,{italic:true,weight:900});
  text(c,'Urquell',0,.29,.27,1.25,GREEN,{italic:true});
  line(c,[[-.56,.47],[0,.52],[.56,.47]],GOLD,.018);
}
function stella(c){
  // The red cartouche, gold horn-like scrolls and stacked serif name are the
  // chalice's familiar print. Its center, rather than the rim, is the target.
  path(c,[[-.62,-.28],[-.43,-.34],[0,-.31],[.43,-.34],[.62,-.28],[.57,.26],[.35,.35],[0,.39],[-.35,.35],[-.57,.26]]);
  c.fillStyle=RED; c.fill(); c.strokeStyle=GOLD; c.lineWidth=.04; c.stroke();
  c.strokeStyle=PAPER; c.lineWidth=.015; c.stroke();
  text(c,'STELLA',0,-.095,.205,1.04,PAPER,{weight:900});
  text(c,'ARTOIS',0,.13,.185,.95,PAPER,{weight:900});
  circle(c,0,-.47,.13,GOLD); text(c,'A',0,-.46,.15,.15,RED);
  for (const side of [-1,1]){
    c.save(); c.scale(side,1); c.strokeStyle=GOLD; c.lineWidth=.024;
    c.beginPath(); c.moveTo(.27,-.38); c.bezierCurveTo(.59,-.58,.73,-.33,.62,-.24);
    c.bezierCurveTo(.52,-.14,.46,-.31,.56,-.34); c.stroke();
    c.beginPath(); c.moveTo(.25,.39); c.bezierCurveTo(.48,.63,.77,.36,.67,.28); c.stroke(); c.restore();
  }
  text(c,'ANNO 1366',0,.56,.078,.66,GOLD);
}
function carlsberg(c){
  // A small hop leaf above the flowing green name.
  c.fillStyle=GREEN;
  for (const [x,y,rx,ry,a] of [[0,-.47,.08,.15,0],[-.105,-.44,.055,.12,-.7],[.105,-.44,.055,.12,.7]]){
    c.beginPath(); c.ellipse(x,y,rx,ry,a,0,Math.PI*2); c.fill();
  }
  text(c,'Carlsberg',0,0,.30,1.68,GREEN,{italic:true,weight:900});
  c.strokeStyle=GREEN; c.lineWidth=.025; c.beginPath(); c.moveTo(-.58,.18); c.bezierCurveTo(-.28,.31,.25,.23,.68,.18); c.stroke();
  text(c,'COPENHAGEN',0,.45,.09,1.07,GREEN,{family:'Karla, sans-serif'});
}
function estrella(c){
  star(c,0,0,.44,RED); c.strokeStyle=GOLD; c.lineWidth=.025; c.stroke();
  text(c,'Estrella',0,.58,.25,1.4,RED,{italic:true,weight:900});
  text(c,'DAMM',0,.82,.12,.76,RED,{family:'Karla, sans-serif',weight:700});
  text(c,'BARCELONA 1876',0,1,.07,1,GOLD,{family:'Karla, sans-serif'});
}
function modelo(c){
  c.beginPath(); c.ellipse(0,0,.78,.54,0,0,Math.PI*2); c.fillStyle=PAPER; c.fill();
  c.strokeStyle=GOLD; c.lineWidth=.055; c.stroke(); c.strokeStyle=BLUE; c.lineWidth=.014; c.stroke();
  // Twin gold lions and a red seal frame the navy wordmark.
  circle(c,0,-.38,.12,RED); text(c,'M',0,-.375,.11,.13,GOLD);
  for (const side of [-1,1]){
    c.save(); c.translate(side*.34,-.32); c.scale(side*.20,.20);
    path(c,[[-.6,.28],[-.3,-.16],[0,-.24],[.35,-.10],[.42,.10],[.17,.12],[.30,.4],[-.03,.4],[-.2,.09],[-.32,.34]]);
    c.fillStyle=GOLD; c.fill(); circle(c,.14,-.28,.21,GOLD); c.restore();
  }
  text(c,'Modelo',0,0,.29,1.37,BLUE,{weight:900});
  text(c,'ESPECIAL',0,.30,.104,.97,BLUE,{family:'Karla, sans-serif'});
}
function samAdams(c){
  // The brewer medallion is part of the cup's blue and red name print.
  circle(c,0,-.53,.24,GOLD); circle(c,0,-.53,.209,BLUE);
  path(c,[[-.10,-.71],[.01,-.73],[.07,-.66],[.08,-.57],[.13,-.54],[.08,-.51],[.05,-.43],[.14,-.37],[-.16,-.37],[-.12,-.46],[-.08,-.49],[-.11,-.58]]);
  c.fillStyle=PAPER; c.fill();
  path(c,[[-.73,-.30],[.73,-.30],[.73,.27],[0,.39],[-.73,.27]]); c.fillStyle=BLUE; c.fill();
  c.strokeStyle=RED; c.lineWidth=.045; c.stroke();
  text(c,'SAMUEL',0,-.105,.185,1.29,PAPER,{weight:900});
  text(c,'ADAMS',0,.13,.24,1.24,PAPER,{weight:900});
  text(c,'BOSTON LAGER',0,.55,.084,1.12,BLUE,{family:'Karla, sans-serif'});
}
function highLife(c){
  path(c,[[-.61,-.64],[.61,-.64],[.70,.49],[0,.65],[-.70,.49]]); c.fillStyle=PAPER; c.fill();
  c.strokeStyle=GOLD; c.lineWidth=.04; c.stroke();
  text(c,'THE CHAMPAGNE',0,-.46,.068,.98,RED,{family:'Karla, sans-serif'});
  text(c,'OF BEERS',0,-.34,.069,.70,RED,{family:'Karla, sans-serif'});
  text(c,'Miller',0,0,.33,1.22,RED,{italic:true,weight:900});
  text(c,'HIGH LIFE',0,.29,.17,1.2,RED,{family:'Georgia, serif',weight:900});
  line(c,[[-.43,.44],[0,.49],[.43,.44]],GOLD,.023);
}
function coors(c){
  const cream='#fff1c8', red='#ad302c';
  c.beginPath(); c.ellipse(0,0,.75,.54,0,0,Math.PI*2); c.fillStyle=cream; c.fill();
  c.strokeStyle=GOLD; c.lineWidth=.045; c.stroke();
  path(c,[[-.38,-.34],[-.17,-.50],[-.06,-.39],[.10,-.53],[.32,-.34]]); c.fillStyle=GOLD; c.fill();
  text(c,'Coors',0,0,.39,1.31,red,{italic:true,family:'"Snell Roundhand", "Brush Script MT", Georgia, serif',weight:700});
  c.strokeStyle=red; c.lineWidth=.018; c.beginPath(); c.moveTo(-.42,.21); c.bezierCurveTo(-.05,.27,.27,.20,.56,.12); c.stroke();
  text(c,'BANQUET',0,.35,.105,.94,red,{family:'Karla, sans-serif',weight:700});
}
function sierra(c){
  // The green label carries a cream mountain window and the full brewery name.
  path(c,[[-.69,-.57],[-.38,-.68],[0,-.71],[.38,-.68],[.69,-.57],[.73,.48],[.39,.60],[0,.65],[-.39,.60],[-.73,.48]]);
  c.fillStyle='#23623a'; c.fill(); c.strokeStyle=GOLD; c.lineWidth=.04; c.stroke();
  path(c,[[-.54,-.30],[-.29,-.52],[-.12,-.39],[.05,-.57],[.26,-.42],[.39,-.47],[.55,-.30]]);
  c.fillStyle=PAPER; c.fill();
  line(c,[[-.27,-.46],[-.12,-.33],[.07,-.50],[.22,-.35]],'#77a574',.018);
  text(c,'SIERRA',0,-.075,.205,1.20,PAPER,{weight:900});
  text(c,'NEVADA',0,.17,.20,1.29,PAPER,{weight:900});
  text(c,'PALE ALE',0,.42,.11,.93,'#edd18c',{family:'Karla, sans-serif'});
  line(c,[[-.36,.53],[0,.57],[.36,.53]],GOLD,.018);
}

export const TRAVEL_BRAND_DRAWERS = Object.freeze({heineken,pilsner,stella,carlsberg,estrella,modelo,'sam-adams':samAdams,'high-life':highLife,coors,sierra});
