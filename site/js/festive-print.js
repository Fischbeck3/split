// Flat fired-on glass decoration, shared by live play and postcard rendering.
import {CHALICE_BOWL_DEPTH} from './render-vessels.js';
import {targetGeometry} from './target.js';

const RED='#b62637', GREEN='#32704b', GOLD='#dcb66c', CREAM='#f6e8ca', INK='#25352d';
function polygon(c,points){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();}
function ink(c,color){c.fillStyle=color;c.fill();c.strokeStyle=CREAM;c.lineWidth=.055;c.stroke();}
function motif(c,x,y,size,paint){c.save();c.translate(x,y);c.scale(size,size);paint(c);c.restore();}
function star(c,points=5){
  polygon(c,Array.from({length:points*2},(_,i)=>{
    const angle=-Math.PI/2+i*Math.PI/points,r=i%2?.20:.52;
    return [Math.cos(angle)*r,Math.sin(angle)*r];
  }));
}
function fir(c){
  polygon(c,[[0,-.61],[.25,-.25],[.13,-.25],[.39,.04],[.22,.04],[.50,.36],[.07,.36],[.07,.54],[-.07,.54],[-.07,.36],[-.50,.36],[-.22,.04],[-.39,.04],[-.13,-.25],[-.25,-.25]]);
}
function snowflake(c){
  c.strokeStyle=CREAM;c.lineWidth=.055;c.lineCap='round';
  for(let i=0;i<6;i++){
    c.save();c.rotate(i*Math.PI/3);c.beginPath();c.moveTo(0,0);c.lineTo(0,-.48);
    c.moveTo(-.13,-.31);c.lineTo(0,-.20);c.lineTo(.13,-.31);c.stroke();c.restore();
  }
}
function leaf(c){
  polygon(c,[[0,-.6],[.14,-.37],[.30,-.36],[.20,-.15],[.35,.05],[.17,.14],[.14,.36],[0,.55],[-.14,.36],[-.17,.14],[-.35,.05],[-.20,-.15],[-.30,-.36],[-.14,-.37]]);
  ink(c,GREEN);c.strokeStyle=GOLD;c.lineWidth=.035;c.beginPath();c.moveTo(0,-.40);c.lineTo(0,.40);c.stroke();
}
function holly(c){
  c.save();c.rotate(-.65);motif(c,0,-.32,.9,leaf);c.restore();
  c.save();c.rotate(.65);motif(c,0,-.32,.9,leaf);c.restore();
  for(const[x,y]of[[-.13,.13],[.15,.12],[0,.32]]){
    c.beginPath();c.arc(x,y,.135,0,Math.PI*2);ink(c,RED);
  }
}
function poinsettia(c){
  for(let i=0;i<6;i++){
    c.save();c.rotate(i*Math.PI/3);polygon(c,[[0,0],[-.15,-.25],[0,-.62],[.15,-.25]]);ink(c,RED);c.restore();
  }
  c.fillStyle=GOLD;c.beginPath();c.arc(0,0,.10,0,Math.PI*2);c.fill();
}
function bauble(c,theme){
  c.strokeStyle=GOLD;c.lineWidth=.06;c.beginPath();c.arc(0,-.53,.09,Math.PI,0);c.stroke();
  c.fillStyle=GOLD;c.fillRect(-.13,-.49,.26,.13);
  c.beginPath();c.arc(0,0,.43,0,Math.PI*2);ink(c,theme.markFill);
  c.strokeStyle=CREAM;c.lineWidth=.03;c.beginPath();c.arc(0,0,.32,Math.PI*1.03,Math.PI*1.33);c.stroke();
}
function football(c,theme){
  c.beginPath();c.moveTo(-.61,0);c.bezierCurveTo(-.26,-.43,.26,-.43,.61,0);
  c.bezierCurveTo(.26,.43,-.26,.43,-.61,0);c.closePath();ink(c,theme.markFill);
  c.strokeStyle=INK;c.lineWidth=.055;c.beginPath();c.moveTo(-.27,0);c.lineTo(.27,0);
  for(const x of [-.18,-.06,.06,.18]){c.moveTo(x,-.10);c.lineTo(x,.10);}c.stroke();
}
export const DECEMBER_MARK_DRAWERS=Object.freeze({
  'december-fir':(c,theme)=>{fir(c);ink(c,theme.markFill);},
  'december-star':(c,theme)=>{star(c);ink(c,theme.markFill);},
  'december-football':football,
  'december-bauble':bauble,
  'december-midnight':(c,theme)=>{star(c,8);ink(c,theme.markFill);}
});

const PRINTS={
  holly(c,w,h){
    c.strokeStyle=GOLD;c.lineWidth=Math.max(1,h*.005);c.beginPath();c.moveTo(-w,h*.025);c.lineTo(w,h*.025);c.stroke();
    for(const x of [-.58,.58]) motif(c,w*x,h*.84,w*.52,holly);
  },
  fir(c,w,h){
    c.strokeStyle=RED;c.lineWidth=h*.014;c.beginPath();c.moveTo(-w,h*.93);c.lineTo(w,h*.93);c.stroke();
    for(let i=-3;i<=3;i++) motif(c,i*w*.28,h*.83,w*.32,p=>{fir(p);ink(p,i%2?CREAM:RED);});
    for(let i=-2;i<=2;i++) motif(c,i*w*.38,h*(i%2?.14:.19),w*.19,p=>{star(p,6);ink(p,GOLD);});
  },
  'fair-isle'(c,w,h){
    for(const t of [.16,.84]){
      c.fillStyle=RED;c.fillRect(-w,h*(t-.055),w*2,h*.11);
      c.strokeStyle=CREAM;c.lineWidth=h*.006;
      for(const edge of [-.065,.065]){c.beginPath();c.moveTo(-w,h*(t+edge));c.lineTo(w,h*(t+edge));c.stroke();}
      for(let i=-2;i<=2;i++) motif(c,i*w*.36,h*t,Math.min(w*.23,h*.075),snowflake);
    }
  },
  'candy-cane'(c,w,h){
    c.save();c.beginPath();c.rect(-w,h*.80,w*2,h*.14);c.clip();
    c.fillStyle=CREAM;c.fillRect(-w,h*.80,w*2,h*.14);
    for(let i=-6;i<=6;i++){
      const x=i*w*.24;c.fillStyle=i%2?RED:GREEN;
      polygon(c,[[x,h*.80],[x+w*.13,h*.80],[x-w*.10,h*.94],[x-w*.23,h*.94]]);c.fill();
    }
    c.restore();
    for(let i=-2;i<=2;i++) motif(c,i*w*.34,h*(i%2?.13:.22),w*.19,snowflake);
  },
  poinsettia(c,w,h){
    for(let i=-2;i<=2;i++){
      motif(c,i*w*.42,h*.86,w*.50,p=>{p.save();p.rotate(.4);leaf(p);p.restore();poinsettia(p);});
    }
    c.strokeStyle=GOLD;c.lineWidth=Math.max(1,h*.006);c.beginPath();c.moveTo(-w,h*.95);c.lineTo(w,h*.95);c.stroke();
  },
  confetti(c,w,h){
    // Fixed positions keep decoration stable while the live liquid moves.
    for(let i=0;i<64;i++){
      const t=i%4 ? .77+(i%9)*.020 : .045+(i%5)*.024;
      const span=t>.5 ? .68-(t-.75)*2 : .85;
      const x=Math.sin(i*19.7)*span*w;
      c.fillStyle=i%3?GOLD:CREAM;
      c.beginPath();c.arc(x,h*t,w*(i%3===0?.033:.022),0,Math.PI*2);c.fill();
    }
    c.strokeStyle=GOLD;c.lineWidth=Math.max(1,h*.006);c.beginPath();c.moveTo(-w,h*.02);c.lineTo(w,h*.02);c.stroke();
  }
};

/** Caller clips to the actual vessel outline and retains its sip transform. */
export function drawFestivePrint(c,G,P,theme){
  const print=PRINTS[theme.festivePrint];if(!print)return;
  const gh=G.bot-G.top,bodyHeight=gh*(G.glass==='chalice'?CHALICE_BOWL_DEPTH:1);
  const aim=targetGeometry(G,P,theme);
  // Clip decorations away from the seeded mark, even for an unusual pour.
  const clearTop=Math.max(0,Math.min(bodyHeight*.30,aim.y-G.top-aim.markHeight*.85));
  const clearBottom=Math.min(bodyHeight,Math.max(bodyHeight*.73,aim.y-G.top+aim.markHeight*.85));
  c.save();c.translate(G.cx,G.top);c.beginPath();
  c.rect(-G.halfW,0,G.halfW*2,clearTop);
  c.rect(-G.halfW,clearBottom,G.halfW*2,bodyHeight-clearBottom);c.clip();
  print(c,G.halfW,bodyHeight);c.restore();
}
