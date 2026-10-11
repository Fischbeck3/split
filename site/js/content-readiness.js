// A catalog glass is not automatically a finished, approved theme. Approvals
// record the owner's release request and the verified scene, glass, and share card.
// The October selections are documented in docs/content/october-2026.md.
export const THEME_READINESS = Object.freeze({
  pub: Object.freeze({scene:'pub', approval:'opening-2026', artworkSha256:'567d095e8fd66a90bed98052d8cfb08ec4f2c7ac2a66ad050029a934858bceca'}),
  peroni: Object.freeze({scene:'rome', approval:'opening-2026', artworkSha256:'77fb5b8009238c7d82a0a4013ebeb24aaa88b7b0f9d05d6d6bfced7a59b8b7e7'}),
  sapporo: Object.freeze({scene:'tokyo', approval:'opening-2026', artworkSha256:'4ff26a8f550860bd39ed709cd8cc4194f5b8bda371f2e0d64532f234a7da4bde'}),
  munich: Object.freeze({scene:'munich', approval:'opening-2026', artworkSha256:'eac2ec8067edd4f88bf481d3d06f48be3b5b7ed2451feea546306b33d1d1938e'}),
  butterbeer: Object.freeze({scene:'hogsmeade', approval:'opening-2026', artworkSha256:'d4527632a15cfdc7e2187699bd5773e57b24516b2adebfd2d690cf6233fa550d'}),
  beach: Object.freeze({scene:'beach', approval:'opening-2026', artworkSha256:'dd203f59c5cec0037d5f6856f97fe821f27e44a672e6f093c30c19988e23feb2'}),
  'autumn-guinness-dublin': Object.freeze({scene:'autumn-guinness-dublin', approval:'october-2026', artworkSha256:'86570719a2fffb1dabe6b7c29fafb584a950c2c1d13f6d1801b782a736999aed'}),
  'autumn-pilsner-prague': Object.freeze({scene:'autumn-pilsner-prague', approval:'october-2026', artworkSha256:'3f40b7e3c2d47593f2bdecb7b4079a79ff160997e689c298af7f8dcac01ba4bb'}),
  'autumn-sierra-high-sierras': Object.freeze({scene:'autumn-sierra-high-sierras', approval:'october-2026', artworkSha256:'225ba0475b993a1a16a2290a2d9e7c27135f12e52d16603126615da3a743bd4c'}),
  'autumn-pub': Object.freeze({scene:'autumn-pub', approval:'october-2026', artworkSha256:'bc578143e8696ff0aca2088ec25cc6b04655831399509c4d3bc47961ce3e85ef'}),
  'autumn-heineken-amsterdam': Object.freeze({scene:'autumn-heineken-amsterdam', approval:'october-2026', artworkSha256:'5890182962fe5319005fbf0193c22290ee64124a8293caad4273748f6186fd88'}),
  'autumn-stella-brussels': Object.freeze({scene:'autumn-stella-brussels', approval:'october-2026', artworkSha256:'2d9547374aa9cf4833b13e259f38db4c3802b9e86a39cbb20a0a8fcd334d1399'}),
  'autumn-guinness-london': Object.freeze({scene:'autumn-guinness-london', approval:'october-2026', artworkSha256:'a0a38c4a5214252b5748f7ce93aa5158e30dd7a10ba9bd5791eb142d142ae616'}),
  'autumn-carlsberg-copenhagen': Object.freeze({scene:'autumn-carlsberg-copenhagen', approval:'october-2026', artworkSha256:'db5cf66a2d285ef42766557b44d36fb8d9c8119443d5a690f9f3bcb8ead840ec'}),
  'autumn-estrella-barcelona': Object.freeze({scene:'autumn-estrella-barcelona', approval:'october-2026', artworkSha256:'1724c6dc73c672136afe72c4e79cfa17d948edfe43c9f98d62c972306493805e'}),
  'autumn-guinness-edinburgh': Object.freeze({scene:'autumn-guinness-edinburgh', approval:'october-2026', artworkSha256:'752c8f809e524514bff87a3507abbd09c9764e8da0a5e65573b4be014496c4b2'}),
  'halloween-pumpkin-porch': Object.freeze({scene:'halloween-pumpkin-porch', approval:'october-2026', artworkSha256:'e2d402752d3fa45fbd57cba70283bec907e0f8ba797ecc080cff671090f8c45b'}),
  'halloween-ghost-stories': Object.freeze({scene:'halloween-ghost-stories', approval:'october-2026', artworkSha256:'4d83f93728521afdf97bdd914ee307d3ce12e0d24458748fa84514435dd3f98d'}),
  'halloween-witching-hour': Object.freeze({scene:'halloween-witching-hour', approval:'october-2026', artworkSha256:'b30aeadeda521a4dd639028b4321c3445227773b55bf03ed9d3eda70cba4c0f8'}),
  'halloween-ravens-rest': Object.freeze({scene:'halloween-ravens-rest', approval:'october-2026', artworkSha256:'79ae707e1bf7ce5c4c015407a778f39ff15c11bc0cf18ebb0bd756d6fee9f640'}),
  'halloween-vampires-toast': Object.freeze({scene:'halloween-vampires-toast', approval:'october-2026', artworkSha256:'1139ada7d0035180173d3a9c92486e149e8e34655f48f0ac3df8a3781a58e34e'}),
  'halloween-midnight-carnival': Object.freeze({scene:'halloween-midnight-carnival', approval:'october-2026', artworkSha256:'39de5ee8285a5eb3a3c640a8cbc6203e511f895c3b8d9a7bf6d7cf4659de49f0'}),
  'halloween-last-orders': Object.freeze({scene:'halloween-last-orders', approval:'october-2026', artworkSha256:'7add6802d42f2fb0d84bd972d5c076e74a111e0ec855e38a202539ab2670d5d8'})
});

// Reusing an approved glass does not approve a new holiday campaign. Each run
// needs its own content review and an explicit list of approved themes.
export const CAMPAIGN_READINESS = Object.freeze({
  'opening-2026': Object.freeze({approval:'DESIGN.md: Selected six-day lineup',
    themeIds:Object.freeze(['pub', 'peroni', 'sapporo', 'munich', 'butterbeer', 'beach'])}),
  'autumn-2026': Object.freeze({approval:'docs/content/october-2026.md: Autumn rounds',
    themeIds:Object.freeze(['autumn-guinness-dublin', 'autumn-pilsner-prague', 'autumn-sierra-high-sierras', 'autumn-pub',
      'autumn-heineken-amsterdam', 'autumn-stella-brussels', 'autumn-guinness-london',
      'autumn-carlsberg-copenhagen', 'autumn-estrella-barcelona', 'autumn-guinness-edinburgh'])}),
  'halloween-2026': Object.freeze({approval:'docs/content/october-2026.md: Halloween week',
    themeIds:Object.freeze(['halloween-pumpkin-porch', 'halloween-ghost-stories', 'halloween-witching-hour',
      'halloween-ravens-rest', 'halloween-vampires-toast', 'halloween-midnight-carnival', 'halloween-last-orders'])})
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
