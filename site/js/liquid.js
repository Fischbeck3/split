// The liquid line moves inside the glass, but its amount stays the same.
import {PROFILES, widthAt} from './core.js';

const ROW_COUNT = 96;
const BISECTION_STEPS = 16;
const profiles = new Map();
const finite = (value, fallback) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;

function sampledProfile(vessel){
  if (profiles.has(vessel)) return profiles.get(vessel);
  const widths = new Float64Array(ROW_COUNT);
  const maxWidth = Math.max(...PROFILES[vessel].map(point => point[1]));
  for (let i = 0; i < ROW_COUNT; i++){
    widths[i] = widthAt(vessel, (i + 0.5) / ROW_COUNT);
  }
  const profile = {widths, maxWidth};
  profiles.set(vessel, profile);
  return profile;
}

function uprightArea(widths, level){
  let area = 0;
  for (let i = 0; i < ROW_COUNT; i++){
    const bottom = (i + 1) / ROW_COUNT;
    area += 2 * widths[i] * Math.max(0, bottom - Math.max(i / ROW_COUNT, level));
  }
  return area;
}

// Each cached row is a thin rectangle. Integrating its clipped ramp exactly
// keeps small inclinations continuous instead of snapping between sample rows.
function slantedArea(widths, center, inclination){
  let area = 0;
  for (let i = 0; i < ROW_COUNT; i++){
    const top = i / ROW_COUNT, bottom = (i + 1) / ROW_COUNT, width = widths[i];
    const dryUntil = center - inclination * width;
    const fullFrom = center + inclination * width;
    area += 2 * width * Math.max(0, bottom - Math.max(top, fullFrom));
    const rampTop = Math.max(top, dryUntil), rampBottom = Math.min(bottom, fullFrom);
    if (rampBottom > rampTop){
      const topSpan = width + (rampTop - center) / inclination;
      const bottomSpan = width + (rampBottom - center) / inclination;
      area += (topSpan + bottomSpan) * 0.5 * (rampBottom - rampTop);
    }
  }
  return area;
}

/** A volume-preserving surface in vessel-local coordinates.
 *  level runs from the rim (0) to the base (1); aspect is half-width / height.
 *  In pixels: y = top + centerLevel * height + slope * (x - centerX).
 *  Angles are degrees; liquidAngle is the liquid's angle in the world.
 */
export function getLiquidSurface(options = {}){
  const input = options && typeof options === 'object' ? options : {};
  const vessel = typeof input.vessel === 'string' && Object.hasOwn(PROFILES, input.vessel) ? input.vessel : 'tulip';
  const level = Math.max(0, Math.min(1, finite(input.level, 0.5)));
  // Even a very wide vessel fits this numerical range. Invalid dimensions use
  // the ordinary glass aspect, while tiny dimensions retain a finite surface.
  const inputAspect = finite(input.aspect, 0.3);
  const aspect = Math.max(1e-6, Math.min(100, inputAspect > 0 ? inputAspect : 0.3));
  const vesselAngle = finite(input.vesselAngle, 0), liquidAngle = finite(input.liquidAngle, 0);
  let relativeAngle = liquidAngle - vesselAngle;
  if (!Number.isFinite(relativeAngle)) relativeAngle = liquidAngle % 180 - vesselAngle % 180;
  const slope = Math.tan((relativeAngle % 180) * Math.PI / 180);
  const inclination = Math.abs(slope) * aspect;
  if (inclination < 1e-9) return {centerLevel: level, slope};

  const {widths, maxWidth} = sampledProfile(vessel);
  const extent = inclination * maxWidth;
  if (level === 0) return {centerLevel: -extent, slope};
  if (level === 1) return {centerLevel: 1 + extent, slope};

  const target = uprightArea(widths, level);
  let low = -extent, high = 1 + extent;
  for (let i = 0; i < BISECTION_STEPS; i++){
    const center = (low + high) * 0.5;
    if (slantedArea(widths, center, inclination) > target) low = center;
    else high = center;
  }
  return {centerLevel: (low + high) * 0.5, slope};
}
