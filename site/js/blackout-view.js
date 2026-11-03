// A small exposure stack, like the user's long-exposure reference. Render the
// scene once, then offset its copies; controls live outside these canvases.
export function makeBlackoutRenderer(){
  const frame = document.createElement('canvas'), frameCtx = frame.getContext('2d');
  const cool = document.createElement('canvas'), coolCtx = cool.getContext('2d');
  let pixelRatio = 1;
  function resize(w, h, dpr){
    // These frames are deliberately defocused; a capped backing store bounds compositing cost.
    pixelRatio = Math.min(1.5, dpr);
    for (const canvas of [frame,cool]){ canvas.width = Math.round(w * pixelRatio); canvas.height = Math.round(h * pixelRatio); }
    frameCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    coolCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }
  function paint(ctx, {w, h, view, draw}){
    ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
    if (view.exposure <= .001){ ctx.restore(); return; }
    frameCtx.clearRect(0, 0, w, h); draw(frameCtx);
    if (!view.echoes){ ctx.drawImage(frame, 0, 0, w, h); ctx.restore(); return; }
    coolCtx.clearRect(0, 0, w, h); coolCtx.drawImage(frame, 0, 0, w, h);
    coolCtx.globalCompositeOperation = 'multiply';
    coolCtx.fillStyle = '#76c5d8'; coolCtx.fillRect(0, 0, w, h);
    coolCtx.globalCompositeOperation = 'source-over';
    const spread = w * view.spread;
    // Older exposures fan away from the main image, with a faint blue cast.
    for (let index = view.echoes; index >= 1; index--){
      const side = index % 2 ? -1 : 1, distance = Math.ceil(index / 2);
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = view.exposure * (.33 - index * .035);
      ctx.translate(w / 2 + side * spread * distance, h * .4 + distance * spread * .13);
      ctx.rotate((view.roll + side * distance * .8) * Math.PI / 180);
      ctx.drawImage(index % 2 ? cool : frame, -w / 2, -h * .4, w, h); ctx.restore();
    }
    ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = view.exposure * .78;
    ctx.translate(w / 2 + view.driftX * w, h * .4 + view.driftY * h);
    ctx.rotate(view.roll * Math.PI / 180);
    ctx.drawImage(frame, -w / 2, -h * .4, w, h);
    ctx.restore();
  }
  return {resize, paint};
}
