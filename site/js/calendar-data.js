// Published dates choose the live glass. Drafts only appear in the planning calendar.
// Keep the legacy lists fixed so new themes cannot reroll old automatic challenges.
export const LEGACY_ROTATION_IDS = Object.freeze(['pub', 'beach', 'munich', 'sapporo', 'butterbeer', 'peroni', 'lager', 'pale', 'cider', 'red', 'coffee', 'choc', 'matcha', 'cola']);
export const LEGACY_OPENING_IDS = Object.freeze(['pub', 'peroni', 'sapporo', 'munich', 'butterbeer', 'beach']);
// Automatic future pours use only the six developed scenes.
export const ROTATION_IDS = Object.freeze(['pub', 'beach', 'munich', 'sapporo', 'butterbeer', 'peroni']);
// Reviewed calendar choices are independent of the automatic fallback rotation.
export const CALENDAR_THEME_IDS = Object.freeze([
  ...ROTATION_IDS,
  'autumn-guinness-dublin', 'autumn-pilsner-prague', 'autumn-sierra-high-sierras', 'autumn-pub',
  'autumn-heineken-amsterdam', 'autumn-stella-brussels', 'autumn-guinness-london',
  'autumn-carlsberg-copenhagen', 'autumn-estrella-barcelona', 'autumn-guinness-edinburgh',
  'halloween-pumpkin-porch', 'halloween-ghost-stories', 'halloween-witching-hour',
  'halloween-ravens-rest', 'halloween-vampires-toast', 'halloween-midnight-carnival', 'halloween-last-orders'
]);

export const CALENDAR = {
  // October 15–31 uses the reviewed autumn and Halloween scenes.
  version: 4,
  updatedAt: '2026-10-11T18:18:55.000Z',
  days: {
    '2026-10-09': {themeId: 'pub', campaignId: 'opening-2026'},
    '2026-10-10': {themeId: 'peroni', campaignId: 'opening-2026'},
    '2026-10-11': {themeId: 'sapporo', campaignId: 'opening-2026'},
    '2026-10-12': {themeId: 'munich', campaignId: 'opening-2026'},
    '2026-10-13': {themeId: 'butterbeer', campaignId: 'opening-2026'},
    '2026-10-14': {themeId: 'beach', campaignId: 'opening-2026'},
    '2026-10-15': {themeId: 'autumn-guinness-dublin', campaignId: 'autumn-2026'},
    '2026-10-16': {themeId: 'autumn-pilsner-prague', campaignId: 'autumn-2026'},
    '2026-10-17': {themeId: 'autumn-sierra-high-sierras', campaignId: 'autumn-2026'},
    '2026-10-18': {themeId: 'autumn-pub', campaignId: 'autumn-2026'},
    '2026-10-19': {themeId: 'autumn-heineken-amsterdam', campaignId: 'autumn-2026'},
    '2026-10-20': {themeId: 'autumn-stella-brussels', campaignId: 'autumn-2026'},
    '2026-10-21': {themeId: 'autumn-guinness-london', campaignId: 'autumn-2026'},
    '2026-10-22': {themeId: 'autumn-carlsberg-copenhagen', campaignId: 'autumn-2026'},
    '2026-10-23': {themeId: 'autumn-estrella-barcelona', campaignId: 'autumn-2026'},
    '2026-10-24': {themeId: 'autumn-guinness-edinburgh', campaignId: 'autumn-2026'},
    '2026-10-25': {themeId: 'halloween-pumpkin-porch', campaignId: 'halloween-2026'},
    '2026-10-26': {themeId: 'halloween-ghost-stories', campaignId: 'halloween-2026'},
    '2026-10-27': {themeId: 'halloween-witching-hour', campaignId: 'halloween-2026'},
    '2026-10-28': {themeId: 'halloween-ravens-rest', campaignId: 'halloween-2026'},
    '2026-10-29': {themeId: 'halloween-vampires-toast', campaignId: 'halloween-2026'},
    '2026-10-30': {themeId: 'halloween-midnight-carnival', campaignId: 'halloween-2026'},
    '2026-10-31': {themeId: 'halloween-last-orders', campaignId: 'halloween-2026'}
  },
  drafts: {},
  campaigns: {
    'opening-2026': {name: 'Opening lineup', startDate: '2026-10-09', endDate: '2026-10-14', status: 'published', notes: 'The six approved opening glasses.'},
    'autumn-2026': {name: 'Autumn rounds', startDate: '2026-10-15', endDate: '2026-10-24', status: 'published', notes: 'Autumn pub and café evenings, with a Sierra camp on Saturday. Guinness on October 15, 18, 21, and 24. Seasonal settings, without claiming a dated local event.'},
    'halloween-2026': {name: 'Halloween week', startDate: '2026-10-25', endDate: '2026-10-31', status: 'published', notes: 'Seven finished Halloween themes, Sunday through Halloween Saturday. Raven’s Rest Guinness on October 28 and Last orders Guinness on October 31. The four-day gap after October 24 keeps the opening three Halloween nights together.'}
  }
};
