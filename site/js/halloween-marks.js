// Flat seasonal glass print. Scored features sit at y=0: pumpkin mouth,
// ghost eyes, cauldron rim, bat wings, and skull eyes.
const INK='#182220', PAPER='#fff3d8';
function paint(c,fill){
  c.fillStyle=fill; c.fill();
  // Dark and light keylines keep the print legible through both beer and air.
  c.strokeStyle=INK; c.lineWidth=.095; c.stroke();
  c.strokeStyle=PAPER; c.lineWidth=.032; c.stroke();
}
function polygon(c,points){
  c.beginPath(); points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y)); c.closePath();
}
function circle(c,x,y,r){c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fillStyle=INK; c.fill();}
function caption(c,value){
  c.save(); c.scale(.01,.01); c.font='700 8.2px Karla, sans-serif'; c.textAlign='center'; c.textBaseline='middle';
  c.lineWidth=2.2; c.strokeStyle=INK; c.strokeText(value,0,83,112);
  c.fillStyle=PAPER; c.fillText(value,0,83,112); c.restore();
}
function pumpkin(c,theme){
  polygon(c,[[-.07,-.39],[-.08,-.63],[.075,-.67],[.04,-.38]]); paint(c,'#647644');
  c.beginPath(); c.ellipse(0,0,.45,.41,0,0,Math.PI*2); paint(c,theme.markFill);
  c.strokeStyle='#a85526'; c.lineWidth=.025;
  for (const x of [-.20,.20]){
    c.beginPath(); c.moveTo(x,-.34); c.bezierCurveTo(x*.38,-.16,x*.38,.17,x,.34); c.stroke();
  }
  polygon(c,[[-.30,-.12],[-.17,-.25],[-.10,-.11]]); c.fillStyle=INK; c.fill();
  polygon(c,[[.10,-.11],[.17,-.25],[.30,-.12]]); c.fill();
  c.beginPath(); c.moveTo(-.29,0); c.lineTo(-.13,.02); c.lineTo(-.13,.10); c.lineTo(-.045,.10);
  c.lineTo(-.045,.03); c.lineTo(.17,.02); c.lineTo(.17,.09); c.lineTo(.24,.09); c.lineTo(.29,0);
  c.bezierCurveTo(.18,.29,-.19,.29,-.29,0); c.closePath(); c.fill();
  caption(c,'PUMPKIN ALE');
}
function ghost(c,theme){
  c.beginPath(); c.moveTo(-.34,.45); c.lineTo(-.34,-.12);
  c.bezierCurveTo(-.34,-.58,.34,-.58,.34,-.12); c.lineTo(.34,.45);
  c.lineTo(.20,.35); c.lineTo(.07,.49); c.lineTo(-.07,.35); c.lineTo(-.21,.48); c.closePath(); paint(c,theme.markFill);
  circle(c,-.12,0,.055); circle(c,.12,0,.055);
  c.beginPath(); c.ellipse(0,.20,.053,.078,0,0,Math.PI*2); c.fillStyle=INK; c.fill();
  caption(c,'GHOST STORIES');
}
function smoke(c,x,dir){
  c.beginPath(); c.moveTo(x,-.15); c.bezierCurveTo(x-dir*.15,-.30,x+dir*.13,-.39,x-dir*.03,-.59);
  c.strokeStyle=INK; c.lineWidth=.105; c.stroke(); c.strokeStyle=PAPER; c.lineWidth=.042; c.stroke();
}
function cauldron(c,theme){
  smoke(c,-.16,-1); smoke(c,.17,1);
  polygon(c,[[-.30,.35],[-.35,.61],[-.20,.61],[-.13,.35]]); paint(c,theme.markFill);
  polygon(c,[[.13,.35],[.20,.61],[.35,.61],[.30,.35]]); paint(c,theme.markFill);
  c.beginPath(); c.moveTo(-.43,0); c.bezierCurveTo(-.52,.47,-.28,.53,0,.53);
  c.bezierCurveTo(.28,.53,.52,.47,.43,0); c.closePath(); paint(c,theme.markFill);
  c.beginPath(); c.ellipse(0,0,.45,.072,0,0,Math.PI*2); paint(c,'#b2d886');
  c.strokeStyle=PAPER; c.lineWidth=.022; c.beginPath(); c.moveTo(-.28,.18); c.quadraticCurveTo(-.35,.30,-.17,.40); c.stroke();
  caption(c,'WITCH’S BREW');
}
function bat(c,theme){
  polygon(c,[[-.12,-.06],[-.37,-.25],[-.76,-.35],[-.61,-.05],[-.75,.10],[-.49,.08],[-.42,.30],
    [-.25,.16],[-.11,.28],[0,.13],[.11,.28],[.25,.16],[.42,.30],[.49,.08],[.75,.10],[.61,-.05],[.76,-.35],[.37,-.25],[.12,-.06],
    [.10,-.28],[.035,-.18],[-.035,-.18],[-.10,-.28]]); paint(c,theme.markFill);
  c.strokeStyle=INK; c.lineWidth=.02;
  for (const side of [-1,1]){
    c.beginPath(); c.moveTo(side*.13,0); c.lineTo(side*.37,-.16); c.lineTo(side*.59,-.22); c.stroke();
  }
  circle(c,-.045,-.085,.012); circle(c,.045,-.085,.012);
  caption(c,'VAMPIRE’S TOAST');
}
function skull(c,theme){
  c.beginPath(); c.moveTo(-.26,.25); c.bezierCurveTo(-.56,.17,-.49,-.41,-.18,-.45);
  c.bezierCurveTo(.17,-.53,.50,-.31,.44,.10); c.quadraticCurveTo(.44,.23,.26,.25);
  c.lineTo(.24,.49); c.lineTo(-.24,.49); c.closePath(); paint(c,theme.markFill);
  c.beginPath(); c.ellipse(-.16,0,.103,.085,-.12,0,Math.PI*2); c.fillStyle=INK; c.fill();
  c.beginPath(); c.ellipse(.16,0,.103,.085,.12,0,Math.PI*2); c.fill();
  polygon(c,[[0,.10],[-.065,.23],[.065,.23]]); c.fill();
  c.strokeStyle=INK; c.lineWidth=.028;
  for (const x of [-.12,0,.12]){c.beginPath(); c.moveTo(x,.31); c.lineTo(x,.46); c.stroke();}
  caption(c,'MIDNIGHT BREW');
}
export const HALLOWEEN_MARK_DRAWERS=Object.freeze({
  'halloween-pumpkin':pumpkin,'halloween-ghost':ghost,'halloween-cauldron':cauldron,'halloween-bat':bat,'halloween-skull':skull
});
