// A catalog glass is not automatically a finished, approved theme. These six
// releases are backed by the approved opening lineup in DESIGN.md. Add a record
// only after the owner reviews the actual game scene, glass, and share card.
export const THEME_READINESS = Object.freeze({
  pub: Object.freeze({scene:'pub', approval:'opening-2026', artworkSha256:'567d095e8fd66a90bed98052d8cfb08ec4f2c7ac2a66ad050029a934858bceca'}),
  peroni: Object.freeze({scene:'rome', approval:'opening-2026', artworkSha256:'77fb5b8009238c7d82a0a4013ebeb24aaa88b7b0f9d05d6d6bfced7a59b8b7e7'}),
  sapporo: Object.freeze({scene:'tokyo', approval:'opening-2026', artworkSha256:'4ff26a8f550860bd39ed709cd8cc4194f5b8bda371f2e0d64532f234a7da4bde'}),
  munich: Object.freeze({scene:'munich', approval:'opening-2026', artworkSha256:'eac2ec8067edd4f88bf481d3d06f48be3b5b7ed2451feea546306b33d1d1938e'}),
  butterbeer: Object.freeze({scene:'hogsmeade', approval:'opening-2026', artworkSha256:'d4527632a15cfdc7e2187699bd5773e57b24516b2adebfd2d690cf6233fa550d'}),
  beach: Object.freeze({scene:'beach', approval:'opening-2026', artworkSha256:'dd203f59c5cec0037d5f6856f97fe821f27e44a672e6f093c30c19988e23feb2'})
});

// Reusing an approved glass does not approve a new holiday campaign. Each run
// needs its own content review and an explicit list of approved themes.
export const CAMPAIGN_READINESS = Object.freeze({
  'opening-2026': Object.freeze({approval:'DESIGN.md: Selected six-day lineup',
    themeIds:Object.freeze(['pub', 'peroni', 'sapporo', 'munich', 'butterbeer', 'beach'])})
});

export const isCampaignReady = id => Object.hasOwn(CAMPAIGN_READINESS, id);

export function contentReadiness(entry){
  if (!entry) return {ready:false, label:'Unplanned', reason:'No reviewed theme is assigned to this date. The game uses an automatic fallback.'};
  if (!Object.hasOwn(THEME_READINESS, entry.themeId)) return {
    ready:false, label:'Needs build & review', reason:'This catalog glass has not been approved as a finished scene, glass, and share card.'
  };
  if (entry.campaignId !== 'none'){
    const run = CAMPAIGN_READINESS[entry.campaignId];
    if (!run?.approval || !run.themeIds.includes(entry.themeId)) return {
      ready:false, label:'Needs campaign build & review', reason:'The themed run and its artwork have not been approved for this glass.'
    };
  }
  return {ready:true, label:'Built & approved', reason:'The scene, glass, and share card are approved. A draft still needs date review before scheduling.'};
}

export function assertContentReady(entry, date){
  const readiness = contentReadiness(entry);
  if (!readiness.ready) throw new Error(date + ': cannot schedule ' + entry.themeId + '. ' + readiness.reason);
}
