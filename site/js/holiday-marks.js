// Flat glass prints. The scored feature of every icon crosses local y=0.
const INK='#192321',PAPER='#fff2db';
function polygon(c,points){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();}
function paint(c,fill){
  c.fillStyle=fill;c.fill();c.strokeStyle=INK;c.lineWidth=.095;c.stroke();
  c.strokeStyle=PAPER;c.lineWidth=.032;c.stroke();
}
function caption(c,text){
  c.save();c.scale(.01,.01);c.font='700 8.2px Karla, sans-serif';c.textAlign='center';c.textBaseline='middle';
  c.strokeStyle=INK;c.lineWidth=2.2;c.strokeText(text,0,83,112);c.fillStyle=PAPER;c.fillText(text,0,83,112);c.restore();
}
function line(c,points,color=PAPER,width=.04){
  c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=INK;c.lineWidth=width+.045;c.stroke();
  c.strokeStyle=color;c.lineWidth=width;c.stroke();
}
function leaf(c,theme){
  polygon(c,[[0,-.60],[.13,-.28],[.30,-.37],[.27,-.12],[.52,-.17],[.40,.12],[.16,.24],
    [.09,.50],[-.09,.50],[-.16,.24],[-.40,.12],[-.52,-.17],[-.27,-.12],[-.30,-.37],[-.13,-.28]]);
  paint(c,theme.markFill);line(c,[[0,-.35],[0,0],[0,.45]],PAPER,.028);caption(c,'FRIENDSGIVING');
}
function turkey(c,theme){
  c.beginPath();c.arc(0,-.08,.49,Math.PI,Math.PI*2);c.lineTo(.36,.17);c.lineTo(-.36,.17);c.closePath();paint(c,theme.markFill);
  for(const x of [-.30,-.15,0,.15,.30])line(c,[[0,.03],[x,-.40]],'#dfbb78',.022);
  c.beginPath();c.ellipse(0,0,.23,.27,0,0,Math.PI*2);paint(c,'#7d4630');
  c.beginPath();c.arc(.10,-.33,.12,0,Math.PI*2);paint(c,theme.markFill);
  polygon(c,[[.18,-.34],[.32,-.29],[.18,-.25]]);paint(c,'#e0b367');
  line(c,[[-.07,.27],[-.10,.43],[-.18,.45]],'#e0b367',.035);
  line(c,[[.07,.27],[.10,.43],[.18,.45]],'#e0b367',.035);caption(c,'HARVEST ALE');
}
function football(c,theme){
  c.beginPath();c.moveTo(-.59,0);c.bezierCurveTo(-.22,-.43,.22,-.43,.59,0);
  c.bezierCurveTo(.22,.43,-.22,.43,-.59,0);c.closePath();paint(c,theme.markFill);
  line(c,[[-.40,-.17],[-.37,0],[-.40,.17]],PAPER,.028);
  line(c,[[.40,-.17],[.37,0],[.40,.17]],PAPER,.028);
  // The horizontal seam and all four laces meet the actual score origin.
  line(c,[[-.23,0],[.23,0]],PAPER,.04);
  for(const x of [-.16,-.055,.055,.16])line(c,[[x,-.085],[x,.085]],PAPER,.035);
  caption(c,'GAME DAY');
}
function wishbone(c,theme){
  // The joined fork, rather than a decorative offset, is the scored feature.
  c.beginPath();c.moveTo(-.04,-.38);c.lineTo(.04,-.38);c.lineTo(.07,-.04);
  c.bezierCurveTo(.12,.10,.25,.28,.40,.43);c.lineTo(.31,.51);
  c.bezierCurveTo(.14,.37,.05,.19,0,0);c.bezierCurveTo(-.05,.19,-.14,.37,-.31,.51);
  c.lineTo(-.40,.43);c.bezierCurveTo(-.25,.28,-.12,.10,-.07,-.04);c.closePath();paint(c,theme.markFill);
  caption(c,'MAKE A WISH');
}
function pie(c,theme){
  polygon(c,[[-.42,-.32],[.48,0],[-.42,.32]]);paint(c,theme.markFill);
  line(c,[[-.42,-.32],[-.47,-.22],[-.42,-.12],[-.47,0],[-.42,.12],[-.47,.22],[-.42,.32]],'#ead1a4',.065);
  line(c,[[-.27,-.19],[.19,.14]],PAPER,.025);line(c,[[-.27,.19],[.19,-.14]],PAPER,.025);
  caption(c,'PIE & COMPANY');
}
function dreidel(c,theme){
  polygon(c,[[-.065,-.66],[.065,-.66],[.065,-.34],[-.065,-.34]]);paint(c,'#c6a675');
  polygon(c,[[-.31,-.34],[.31,-.34],[.34,.21],[0,.55],[-.34,.21]]);paint(c,theme.markFill);
  line(c,[[0,-.32],[0,0],[0,.51]],'#ddbd77',.035);
  line(c,[[-.30,.20],[0,.32],[.30,.20]],PAPER,.024);caption(c,'DREIDEL NIGHT');
}
function jam(c,theme){
  // A round filled sufganiyah has no doughnut hole. The red jam dot is y=0.
  c.beginPath();c.ellipse(0,0,.45,.37,0,0,Math.PI*2);paint(c,theme.markFill);
  c.fillStyle=PAPER;
  for(const[x,y,r]of[[-.25,-.12,.025],[-.15,-.24,.03],[.07,-.22,.027],[.25,-.09,.026],[-.22,.18,.022],[.20,.18,.028]]){
    c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
  }
  c.beginPath();c.arc(0,0,.13,0,Math.PI*2);paint(c,'#a72f3f');caption(c,'BAKERY GATHERING');
}
export const HOLIDAY_MARK_DRAWERS=Object.freeze({
  'holiday-leaf':leaf,'holiday-turkey':turkey,'holiday-football':football,'holiday-wishbone':wishbone,
  'holiday-pie':pie,'holiday-dreidel':dreidel,'holiday-jam':jam
});
