// The liquid line moves inside a round glass, but its volume stays the same.
import {RENDER_PROFILES as PROFILES, renderWidthAt as widthAt} from './render-vessels.js';

const ROW_COUNT = 96;
const BISECTION_STEPS = 20;
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

function uprightVolume(widths, level){
  let volume = 0;
  for (let i = 0; i < ROW_COUNT; i++){
    const bottom = (i + 1) / ROW_COUNT;
    volume += Math.PI * widths[i] * widths[i] * Math.max(0, bottom - Math.max(i / ROW_COUNT, level));
  }
  return volume;
}

// Area of the portion of a unit disk to the left of the surface's crossing.
function diskArea(crossing){
  const u = Math.max(-1, Math.min(1, crossing));
  return Math.PI / 2 + Math.asin(u) + u * Math.sqrt(Math.max(0, 1 - u * u));
}

// The integral of diskArea from -1 to u. Each cached row is a thin cylinder;
// integrating its circular segment through its depth keeps tiny tilts smooth.
function diskIntegral(u){
  const root = Math.sqrt(Math.max(0, 1 - u * u));
  return u * (Math.PI / 2 + Math.asin(u)) + root * (2 + u * u) / 3;
}

function slantedVolume(widths, center, inclination){
  let volume = 0;
  for (let i = 0; i < ROW_COUNT; i++){
    const top = i / ROW_COUNT, bottom = (i + 1) / ROW_COUNT, width = widths[i];
    const extent = inclination * width;
    const dryUntil = center - extent;
    const fullFrom = center + extent;
    volume += Math.PI * width * width * Math.max(0, bottom - Math.max(top, fullFrom));
    const rampTop = Math.max(top, dryUntil), rampBottom = Math.min(bottom, fullFrom);
    if (rampBottom > rampTop){
      const span = rampBottom - rampTop;
      const uSpan = span / extent;
      if (uSpan < 1e-3){
        // Near a sideways glass, subtracting two almost equal primitives loses
        // precision. Two-point Gaussian integration stays stable even at 90°.
        const middle = ((rampTop + rampBottom) * 0.5 - center) / extent;
        const offset = uSpan / (2 * Math.sqrt(3));
        volume += width * width * span * (diskArea(middle - offset) + diskArea(middle + offset)) * 0.5;
      } else {
        const uTop = Math.max(-1, Math.min(1, (rampTop - center) / extent));
        const uBottom = Math.max(-1, Math.min(1, (rampBottom - center) / extent));
        volume += width * width * extent * (diskIntegral(uBottom) - diskIntegral(uTop));
      }
    }
  }
  return volume;
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

  // Radius is widthAt * aspect. The shared aspect² factor cancels from both
  // volumes, leaving the round cross sections in profile-relative units.
  const target = uprightVolume(widths, level);
  let low = -extent, high = 1 + extent;
  for (let i = 0; i < BISECTION_STEPS; i++){
    const center = (low + high) * 0.5;
    if (slantedVolume(widths, center, inclination) > target) low = center;
    else high = center;
  }
  return {centerLevel: (low + high) * 0.5, slope};
}
