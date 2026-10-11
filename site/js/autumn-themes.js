// Seasonal seats derive from the actual catalog glass, never a second drink definition.
export const AUTUMN_BASE_IDS = Object.freeze([
  'pub', 'guinness-dublin', 'guinness-london', 'guinness-edinburgh', 'guinness-new-york',
  'heineken-amsterdam', 'pilsner-prague', 'stella-brussels', 'carlsberg-copenhagen', 'estrella-barcelona',
  'modelo-mexico-city', 'sam-adams-boston', 'high-life-milwaukee', 'coors-apres-ski', 'sierra-high-sierras'
]);
export const AUTUMN_THEME_IDS = Object.freeze(AUTUMN_BASE_IDS.map(id => 'autumn-' + id));
export const AUTUMN_GUINNESS_IDS = Object.freeze(AUTUMN_THEME_IDS.slice(0, 5));

/** Only the painted season changes. Every vessel, material, mark and pour is inherited. */
export function autumnThemePreviews(themes){
  return AUTUMN_BASE_IDS.map((baseId, index) => {
    const base = themes.find(theme => theme.id === baseId);
    if (!base) throw new Error('Missing autumn base theme: ' + baseId);
    return {...base, id:AUTUMN_THEME_IDS[index], scene:AUTUMN_THEME_IDS[index], baseThemeId:baseId,
      brand:base.brand || (baseId === 'pub' ? 'guinness' : undefined),
      colorScheme:base.colorScheme || (baseId === 'pub' ? 'dark' : undefined),
      seasonal:'autumn', preview:true};
  });
}
