// Vessel motion is a local choice. A shared sip never supplies this preference.
export const MOTION_PREFERENCE_KEY = 'split.motion.v1';

/** True is a still vessel, false is full vessel motion, null follows the device. */
export function readPreference(storage){
  try {
    const value = storage?.getItem(MOTION_PREFERENCE_KEY);
    return value === 'reduced' ? true : value === 'full' ? false : null;
  } catch {
    return null;
  }
}

/** An explicit choice wins; without one, changes to the device preference apply. */
export function loadPreference(storage, defaultReduced = false){
  return readPreference(storage) ?? defaultReduced === true;
}

/** Storage denial must not prevent the current page from applying the choice. */
export function savePreference(storage, reduced){
  if (typeof reduced !== 'boolean') return false;
  try {
    if (!storage || typeof storage.setItem !== 'function') return false;
    storage.setItem(MOTION_PREFERENCE_KEY, reduced ? 'reduced' : 'full');
    return true;
  } catch {
    return false;
  }
}
