// Advect the painted flame texture, rather than flashing a light over the pub.
// Work at the source artwork's small hearth resolution, once per 30 fps frame.
const clamp = value => Math.max(0, Math.min(1, value));
function noise(position, seed){
  const n = Math.floor(position), f = position - n, blend = f * f * (3 - 2 * f);
  const random = i => { const v = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453; return (v - Math.floor(v)) * 2 - 1; };
  return random(n) * (1 - blend) + random(n + 1) * blend;
}

/** A soft heat matte comes from the painting's luminous warm pixels. */
export function createHearthMotion(frame, base){
  const {width, height, data} = frame, source = new Uint8ClampedArray(data);
  const hot = new Float32Array(width * height), grown = new Float32Array(hot.length), moving = [];
  for (let y = 0; y < base; y++) for (let x = 0; x < width; x++){
    const i = (y * width + x) * 4, [r, g, b] = source.subarray(i, i + 3);
    hot[y * width + x] = clamp((r - 165) / 65) * clamp((g - 85) / 90) * clamp((r - b - 30) / 65);
  }
  // Give the actual silhouette room to rise/curl; an undilated matte would pin
  // its original outline. Keep the grate, logs and surrounding stone fixed.
  for (let y = 0; y < base; y++) for (let x = 0; x < width; x++){
    let heat = 0;
    for (let yy = Math.max(0, y - 4); yy < Math.min(base, y + 13); yy++)
      for (let xx = Math.max(0, x - 6); xx < Math.min(width, x + 7); xx++) heat = Math.max(heat, hot[yy * width + xx]);
    grown[y * width + x] = heat;
  }
  for (let y = 0; y < base; y++) for (let x = 0; x < width; x++){
    let heat = 0, count = 0;
    for (let yy = Math.max(0, y - 3); yy <= Math.min(height - 1, y + 3); yy++)
      for (let xx = Math.max(0, x - 3); xx <= Math.min(width - 1, x + 3); xx++){ heat += grown[yy * width + xx]; count++; }
    const edge = Math.min(clamp(x / 4), clamp((width - 1 - x) / 4), clamp(y / 4), clamp((base - y) / 7));
    const weight = heat / count * edge;
    if (weight > .001) moving.push({x, y, i: (y * width + x) * 4, weight, rise: (base - y) / base});
  }
  return {frame, source, moving, base, tick: -1};
}

/** Inverse mapping replaces the old flame, so no static duplicate shows through. */
export function updateHearthMotion(state, now = 0){
  const tick = Math.floor((Number.isFinite(now) ? Math.max(0, now) : 0) * .03);
  if (state.tick === tick) return false;
  state.tick = tick;
  const t = tick / 30, {frame, source, moving, base} = state, {width, height, data} = frame;
  const stretch = Array.from({length: width}, (_, x) => 1 + .21 * noise(t * 2.15 + x * .065, 11));
  const curl = Array.from({length: height}, (_, y) => noise(t * 2.8 - (base - y) * .085, 29));
  for (const {x, y, i, weight, rise} of moving){
    const sx = Math.max(0, Math.min(width - 1, x + 7 * rise * weight * curl[y]));
    const sy = Math.max(0, Math.min(height - 1, y + ((base - (base - y) / stretch[x]) - y) * weight));
    const x0 = Math.floor(sx), y0 = Math.floor(sy), x1 = Math.min(width - 1, x0 + 1), y1 = Math.min(height - 1, y0 + 1);
    const fx = sx - x0, fy = sy - y0;
    for (let channel = 0; channel < 3; channel++){
      const a = source[(y0 * width + x0) * 4 + channel] * (1 - fx) + source[(y0 * width + x1) * 4 + channel] * fx;
      const b = source[(y1 * width + x0) * 4 + channel] * (1 - fx) + source[(y1 * width + x1) * 4 + channel] * fx;
      data[i + channel] = a * (1 - fy) + b * fy;
    }
  }
  return true;
}
