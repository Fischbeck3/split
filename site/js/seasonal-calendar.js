// Reviewed on November 6. These fill future gaps around the existing NFL dates.
// Seasonal settings are not claims that a particular local event happens that day.
export const SEASONAL_CALENDAR_DAYS = Object.freeze({
  '2026-11-10': {themeId:'autumn-guinness-dublin', campaignId:'november-autumn-2026'},
  '2026-11-11': {themeId:'autumn-stella-brussels', campaignId:'november-autumn-2026'},
  '2026-11-13': {themeId:'autumn-pilsner-prague', campaignId:'november-autumn-2026'},
  '2026-11-14': {themeId:'autumn-guinness-edinburgh', campaignId:'november-autumn-2026'},
  '2026-11-17': {themeId:'autumn-guinness-london', campaignId:'november-autumn-2026'},
  '2026-11-18': {themeId:'autumn-carlsberg-copenhagen', campaignId:'november-autumn-2026'},
  '2026-11-20': {themeId:'autumn-pub', campaignId:'november-autumn-2026'},
  '2026-11-21': {themeId:'thanksgiving-friendsgiving', campaignId:'thanksgiving-gatherings-2026'},
  '2026-11-24': {themeId:'thanksgiving-homecoming', campaignId:'thanksgiving-gatherings-2026'},
  '2026-11-28': {themeId:'thanksgiving-fireside', campaignId:'thanksgiving-gatherings-2026'},
  '2026-12-01': {themeId:'winter-guinness-dublin', campaignId:'december-lights-2026'},
  '2026-12-02': {themeId:'winter-heineken-amsterdam', campaignId:'december-lights-2026'},
  '2026-12-04': {themeId:'hanukkah-window-lights', campaignId:'december-lights-2026', occasion:{
    title:'Hanukkah · first candle lighting', detail:'Hanukkah begins this evening. The window painting shows the first lighting night; this is an all-day content date, not a candle-lighting time.',
    sourceUrl:'https://www.hebcal.com/holidays/chanukah-2026', checkedAt:'2026-11-06'}},
  '2026-12-05': {themeId:'winter-pilsner-prague', campaignId:'december-lights-2026'},
  '2026-12-08': {themeId:'winter-guinness-edinburgh', campaignId:'december-lights-2026'},
  '2026-12-09': {themeId:'christmas-pilsner-vienna-market', campaignId:'december-lights-2026'},
  '2026-12-11': {themeId:'hanukkah-bakery', campaignId:'december-lights-2026', occasion:{
    title:'Hanukkah · eighth candle lighting', detail:'The final candle-lighting date. The bakery painting shows eight festival lights and a raised shamash. Hanukkah ends tomorrow night.',
    sourceUrl:'https://www.hebcal.com/holidays/chanukah-2026', checkedAt:'2026-11-06'}},
  '2026-12-12': {themeId:'christmas-guinness-home-tree', campaignId:'christmas-gatherings-2026'},
  '2026-12-15': {themeId:'christmas-guinness-dublin-snug', campaignId:'christmas-gatherings-2026'},
  '2026-12-16': {themeId:'christmas-modelo-posada', campaignId:'christmas-gatherings-2026', occasion:{
    title:'Las Posadas begins', detail:'Mexico’s December 16–24 Posadas season begins. The courtyard is an illustrated seasonal gathering, not a ticketed event or venue booking.',
    sourceUrl:'https://sic.cultura.gob.mx/ficha.php?table=festividad&table_id=115', checkedAt:'2026-11-06'}},
  '2026-12-18': {themeId:'christmas-guinness-london-supper', campaignId:'christmas-gatherings-2026'},
  '2026-12-22': {themeId:'winter-guinness-london', campaignId:'christmas-gatherings-2026'},
  '2026-12-23': {themeId:'christmas-stella-paris-cafe', campaignId:'christmas-gatherings-2026'},
  '2026-12-26': {themeId:'christmas-guinness-edinburgh-train', campaignId:'christmas-gatherings-2026'},
  '2026-12-29': {themeId:'winter-guinness-new-york', campaignId:'christmas-gatherings-2026'},
  '2026-12-30': {themeId:'christmas-high-life-record-night', campaignId:'christmas-gatherings-2026'}
});

// Only these newly selected previews join the planning catalog. Review order and
// automatic fallback membership remain independent of content approval.
export const NEW_SEASONAL_THEME_IDS = Object.freeze(Object.values(SEASONAL_CALENDAR_DAYS)
  .map(entry => entry.themeId).filter(id => !id.startsWith('autumn-')));

export const SEASONAL_CAMPAIGNS = Object.freeze({
  'november-autumn-2026': {name:'November autumn evenings', startDate:'2026-11-10', endDate:'2026-11-20', status:'published', notes:'Seven reviewed autumn pub and café dates around the fixed NFL games. Guinness on November 10, 14, 17 and 20. These are seasonal settings, without a dated local-event claim.'},
  'thanksgiving-gatherings-2026': {name:'Thanksgiving gatherings', startDate:'2026-11-21', endDate:'2026-11-28', status:'published', notes:'Friendsgiving on Saturday, a homecoming pint before Thanksgiving and a fireside pint on the long weekend. The existing November 25–27 and 29 NFL selections remain separate standalone assignments.'},
  'december-lights-2026': {name:'December lights', startDate:'2026-12-01', endDate:'2026-12-11', status:'published', notes:'Seven winter pub, canal, cellar and market dates, including two Hanukkah gatherings on the first and eighth candle-lighting dates that match the built paintings. This is not an eight-night Hanukkah lineup. The fourth-night painting remains an unscheduled review because December 7 already has an NFL assignment.'},
  'christmas-gatherings-2026': {name:'Christmas gatherings', startDate:'2026-12-12', endDate:'2026-12-30', status:'published', notes:'Nine reviewed home, pub, courtyard, café, train and record-room settings around the fixed NFL games. The Posada courtyard falls on December 16. Christmas Eve, Christmas Day and New Year’s Eve retain their NFL cups.'}
});
