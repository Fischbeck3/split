// Published dates choose the live glass. Drafts only appear in the planning calendar.
// Keep the legacy lists fixed so new themes cannot reroll old automatic challenges.
export const LEGACY_ROTATION_IDS = Object.freeze(['pub', 'beach', 'munich', 'sapporo', 'butterbeer', 'peroni', 'lager', 'pale', 'cider', 'red', 'coffee', 'choc', 'matcha', 'cola']);
export const LEGACY_OPENING_IDS = Object.freeze(['pub', 'peroni', 'sapporo', 'munich', 'butterbeer', 'beach']);

export const CALENDAR = {
  version: 1,
  updatedAt: '2026-10-09T20:00:00.000Z',
  days: {
    '2026-10-09': {themeId: 'pub', campaignId: 'opening-2026'},
    '2026-10-10': {themeId: 'peroni', campaignId: 'opening-2026'},
    '2026-10-11': {themeId: 'sapporo', campaignId: 'opening-2026'},
    '2026-10-12': {themeId: 'munich', campaignId: 'opening-2026'},
    '2026-10-13': {themeId: 'butterbeer', campaignId: 'opening-2026'},
    '2026-10-14': {themeId: 'beach', campaignId: 'opening-2026'}
  },
  drafts: {
    '2026-10-25': {themeId: 'choc', campaignId: 'halloween-2026', notes: 'Planning placeholder using the existing glass. Holiday artwork is not approved.'},
    '2026-10-26': {themeId: 'butterbeer', campaignId: 'halloween-2026', notes: 'Planning placeholder using the existing glass. Holiday artwork is not approved.'},
    '2026-10-27': {themeId: 'coffee', campaignId: 'halloween-2026', notes: 'Planning placeholder using the existing glass. Holiday artwork is not approved.'},
    '2026-10-28': {themeId: 'sapporo', campaignId: 'halloween-2026', notes: 'Planning placeholder using the existing glass. Holiday artwork is not approved.'},
    '2026-10-29': {themeId: 'cider', campaignId: 'halloween-2026', notes: 'Planning placeholder using the existing glass. Holiday artwork is not approved.'},
    '2026-10-30': {themeId: 'butterbeer', campaignId: 'halloween-2026', notes: 'Planning placeholder using the existing glass. Holiday artwork is not approved.'},
    '2026-10-31': {themeId: 'matcha', campaignId: 'halloween-2026', notes: 'Planning placeholder using the existing glass. Holiday artwork is not approved.'}
  },
  campaigns: {
    'opening-2026': {name: 'Opening lineup', startDate: '2026-10-09', endDate: '2026-10-14', status: 'published', notes: 'The six approved opening glasses.'},
    'halloween-2026': {name: 'Halloween week', startDate: '2026-10-25', endDate: '2026-10-31', status: 'draft', notes: 'Draft only. Existing glasses are placeholders; holiday glasses and artwork still need approval.'}
  }
};
