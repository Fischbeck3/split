// Decorative motion only. These clocks never enter the drink or score model.

/** Keep the original image's tabletop aligned with the foot of the vessel. */
export function memoryScenePlacement(w, h, G, {width, height, table}){
  const tableY = Math.max(h * .4, G.bot - h * .08);
  const scale = Math.max(w / width, tableY / (height * table), (h - tableY) / (height * (1 - table)));
  return {x: (w - width * scale) / 2, y: tableY - height * table * scale, scale};
}

/** Smooth, bounded motion, driven by wall time rather than drinking progress. */
export function memoryMotion(now = 0){
  const t = Number.isFinite(now) ? Math.max(0, now) / 1000 : 0;
  return {
    surf: Math.sin(t * Math.PI * 2 / 6.8),
    breeze: Math.sin(t * Math.PI * 2 / 7.6)
  };
}

// Source-image coordinates, traced around the existing painted details. The surf
// stays between the foreground tables and shoreline walkers; the tent motion
// stays on cloth, with the rafters and chandelier still in place.
export const MEMORY_DETAILS = {
  pub: [
    {kind: 'fire', box: [804 / 1024, 530 / 1536, 84 / 1024, 94 / 1536], base: 615 / 1536}
  ],
  beach: [
    {kind: 'water', box: [.305, .385, .402, .034]},
    {kind: 'surf', box: [.300, .418, .448, .068], polygon: [[.302,.449],[.458,.435],[.605,.425],[.742,.418],[.748,.437],[.602,.457],[.423,.477],[.303,.485]]}
  ],
  munich: [
    {kind: 'cloth', box: [.301, .231, .181, .066], polygon: [[.307,.267],[.362,.251],[.473,.232],[.479,.262],[.366,.293],[.308,.286]]},
    {kind: 'cloth', box: [.539, .227, .207, .071], polygon: [[.543,.228],[.613,.242],[.742,.275],[.735,.296],[.632,.273],[.541,.254]]}
  ]
};
