// Pull the vessel into the foreground while leaving its place and scoring fixed.
export function focusedGlassBox(G, {w, h, floor, vessel}){
  const topLimit = h < 650 ? 132 : 164;
  const bottom = Math.max(G.bot, Math.min(floor, h - 24));
  const height = G.bot - G.top;
  const bot = bottom;
  const scale = Math.max(1, Math.min(1.8, (bot - topLimit) / height,
    w * (vessel === 'stein' ? .30 : .34) / G.halfW));
  return {...G, top:bot - height * scale, bot, halfW:G.halfW * scale};
}

export function interpolateGlassBox(from, to, progress){
  const u = Math.max(0, Math.min(1, progress));
  const t = 1 - Math.pow(1 - u, 4);
  return {...from, ...Object.fromEntries(['cx','top','bot','halfW'].map(key =>
    [key, from[key] + (to[key] - from[key]) * t]))};
}
