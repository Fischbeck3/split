// Published dates choose the live glass. Drafts only appear in the planning calendar.
// Keep the legacy lists fixed so new themes cannot reroll old automatic challenges.
export const LEGACY_ROTATION_IDS = Object.freeze(['pub', 'beach', 'munich', 'sapporo', 'butterbeer', 'peroni', 'lager', 'pale', 'cider', 'red', 'coffee', 'choc', 'matcha', 'cola']);
export const LEGACY_OPENING_IDS = Object.freeze(['pub', 'peroni', 'sapporo', 'munich', 'butterbeer', 'beach']);
// Automatic future pours use only the six developed scenes.
export const ROTATION_IDS = Object.freeze(['pub', 'beach', 'munich', 'sapporo', 'butterbeer', 'peroni']);

export const CALENDAR = {
  // Remove unfinished draft glasses and advance subscription revisions.
  // The opening date assignments and seeded pours stay fixed.
  version: 3,
  updatedAt: '2026-10-09T23:56:37.000Z',
  days: {
    '2026-10-09': {themeId: 'pub', campaignId: 'opening-2026'},
    '2026-10-10': {themeId: 'peroni', campaignId: 'opening-2026'},
    '2026-10-11': {themeId: 'sapporo', campaignId: 'opening-2026'},
    '2026-10-12': {themeId: 'munich', campaignId: 'opening-2026'},
    '2026-10-13': {themeId: 'butterbeer', campaignId: 'opening-2026'},
    '2026-10-14': {themeId: 'beach', campaignId: 'opening-2026'}
  },
  drafts: {},
  campaigns: {
    'opening-2026': {name: 'Opening lineup', startDate: '2026-10-09', endDate: '2026-10-14', status: 'published', notes: 'The six approved opening glasses.'}
  }
};
