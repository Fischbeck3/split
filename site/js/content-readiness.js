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
  'halloween-last-orders': Object.freeze({scene:'halloween-last-orders', approval:'october-2026', artworkSha256:'7add6802d42f2fb0d84bd972d5c076e74a111e0ec855e38a202539ab2670d5d8'}),
  'halloween-lantern-maze': Object.freeze({scene:'halloween-lantern-maze', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'0902d284a26400dfd350005f801067e4e80e7ed7a4a84b4d3b730970b51f96f0'}),
  'nfl-49ers': Object.freeze({scene:'nfl-49ers', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'8497e98a65ce1d03c5be0e19cb0e961be1cfdebde4f9fceda70e363e951f0a20', brandArtworkSha256:'fd10ab566d083fd8cb1ba595a1552d614728b0bb1259bf1d6aacea44ff3d9886'}),
  'nfl-seahawks': Object.freeze({scene:'nfl-seahawks', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'f9f6ba4db70d2ef4dd0027d7d70caea9a6c86c9e378742224546496076d468d9', brandArtworkSha256:'c8703cbbac368f5309e8670e61dfdf96bde73657ca2c62d1ba516448876ccf64'}),
  'nfl-rams': Object.freeze({scene:'nfl-rams', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'fa6a8fcd7c2dedbe8e6d6a3f798337bdea4ed8096b9bcf8559cd7c43062ce531', brandArtworkSha256:'85041bba37c33dd319b8360499683ecae1001a9cef3301ff1a72bf611567eada'}),
  'nfl-cardinals': Object.freeze({scene:'nfl-cardinals', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'f88bb5ffe483f54dc81e9ebc1e5faacb1cbce42aa9b45e6a996ee144ccf57232', brandArtworkSha256:'0d76790621405f0655dd13f122da20530551f7287917490a560183019f983117'}),
  'nfl-cowboys': Object.freeze({scene:'nfl-cowboys', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'afd09f995ebba9bee7e413685ed650efddeb7377be14009ca399c36f42c4baf4', brandArtworkSha256:'ca90cbfcbf2f0d8e7dd657c1181bdcb5a16b37e25912dd11db772e9dd4cc8b68'}),
  'nfl-giants': Object.freeze({scene:'nfl-giants', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'d540c4037a6885636080bb8d358b504807e56d4b4e4ce6d91a9cc63decbf725d', brandArtworkSha256:'79660efbe792170c245808e8e9c2ac48de6e46a33cda93e79c1e465f94e3f336'}),
  'nfl-eagles': Object.freeze({scene:'nfl-eagles', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'8a61e2bc523f6011d6c75132038d4d5818265065633299d51a240cf9d47bdc88', brandArtworkSha256:'0c199c831a056b9d8d44aa2318f4b3e2f521d89aa30cf42586a5722541715476'}),
  'nfl-commanders': Object.freeze({scene:'nfl-commanders', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'16f675d46ae57c358708bfd222b660c0e05871ebbb7e12ad14184a26a108c98c', brandArtworkSha256:'769a959dc854f3ed1a598d9fee86cf12f816f05bda603c2b39ab5e3420bc50b8'}),
  'nfl-packers': Object.freeze({scene:'nfl-packers', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'1f5a88645a719d7c68295324311aa9cdd33c23da2f3ca370188aad0c98876953', brandArtworkSha256:'3c7fc6e95d31debc1c2ada6924e40d75905e3ffab60d1f36fbddf7b47b4bbd9f'}),
  'nfl-bears': Object.freeze({scene:'nfl-bears', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'b927b76b18f4b9fd346c697e6d042514422cf60df7340a63f4ddca1ab523f6e0', brandArtworkSha256:'c0cc647a84d0ab8a7035cb02ebb1f2540b57086c1394cd3639e84cfadbad1c4f'}),
  'nfl-lions': Object.freeze({scene:'nfl-lions', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'74af24a14a4f60f81d21c91cec8fa205fd62fb62407d23cad134dcb1890ce82a', brandArtworkSha256:'62435bb746560aa4bd465daaf8c69197bb615d80eca945985b75d610104018de'}),
  'nfl-vikings': Object.freeze({scene:'nfl-vikings', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'6a00a71c11e9e1be759b639d11cf58323a30f4b414782cab1833f23a9e8db7e7', brandArtworkSha256:'de3db779df8206314695fc150c6b320d9e2c7e8225b8c3080349d783a00fa8ad'}),
  'nfl-saints': Object.freeze({scene:'nfl-saints', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'3a4e20fc8b72666d3641ce0f9740a84a70155584b9c23d8fd5df7ca84ddadb8b', brandArtworkSha256:'3287c23da32c188f2bce98daa1219281a1fb96bb4d4de003a90715c87bbc4052'}),
  'nfl-buccaneers': Object.freeze({scene:'nfl-buccaneers', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'f6bfb64a9d21c89dd32be8f821449c36e50a77181d7c69f1a88af2440f2c50b5', brandArtworkSha256:'b6e2ec016f45af404b222e2f65155cad2e4b460d3d58b3251752a3109ce2c382'}),
  'nfl-falcons': Object.freeze({scene:'nfl-falcons', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'657750e527e63a8ca7964c4c86162952e247ba0583a4acc05c189ea1dd71cd1a', brandArtworkSha256:'3c6c84de07f6ce9473d05708daaf8accc921d29ff1bb631c45f0dcdb453cce41'}),
  'nfl-panthers': Object.freeze({scene:'nfl-panthers', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'ea972dd3d348e2637af4b944063d681853fcf82ed80bcec146e4821c440e9806', brandArtworkSha256:'96321653cf9ab5e180f20936b528156dc13695b698b6ef69370a5450b1ba8321'}),
  'nfl-bills': Object.freeze({scene:'nfl-bills', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'6a19c820c9e3e2cbb0e5b3b1f5b7b67cfe25c5fc483c659dec0f10bb91a6235c', brandArtworkSha256:'83d433905d4349939b12f19031244858db68f7c340eeee92ad342a6741633d18'}),
  'nfl-dolphins': Object.freeze({scene:'nfl-dolphins', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'c2765926f1972a29657e2f9eea29283900730cb7176c9f8920507dd481e8e75b', brandArtworkSha256:'4eeede1bcd66ec643a079a832b1b0166e6abfeae7aef6fb71bb19b27a0418fc0'}),
  'nfl-jets': Object.freeze({scene:'nfl-jets', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'052f7f1aa6a41366d7bde5100e3162a6a80ac1c1ee440a3c67c1a9b7b2e5206c', brandArtworkSha256:'7cff9b741a0ba5a67e4e5d5a4ffa85c8e5364abc3d2283557573ce7a23a344a8'}),
  'nfl-patriots': Object.freeze({scene:'nfl-patriots', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'8373c8ddf141181f3ce2aae737d587958cd8602b8bab40df0fe5ceac47e31e74', brandArtworkSha256:'15d18205fd0d999cbc65b1dac0f6f0304801551cb417cd5396780d620ed8f0f9'}),
  'nfl-ravens': Object.freeze({scene:'nfl-ravens', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'022aca972e0874cc4595e63e6f3a9595c16928f9abedb2b1250d97c8befee7e0', brandArtworkSha256:'bd75219e27dc019e70d13d16e016f0ce6431270b33ab5eeaef7cf16982c0fa17'}),
  'nfl-bengals': Object.freeze({scene:'nfl-bengals', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'f806e7a6f0cfac6caa1d02495024ef6fc2ff845cf76b28b36dada810e0ae96ff', brandArtworkSha256:'37dbcb56d53028ccd727b9c43bbd94067074ce9a5aa2bbdd4a2c78028e0ad162'}),
  'nfl-browns': Object.freeze({scene:'nfl-browns', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'bc45e318d6c0da2213d20851ee3caa3e6478e7b72602507f3f5306c6142bf464', brandArtworkSha256:'1b91de57432ee54780919977388b162078f5b0305f9e03f70883776ba8718c11'}),
  'nfl-steelers': Object.freeze({scene:'nfl-steelers', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'070a71889b4d4724c47655b007e17cc5eb104b3292d327e67f64a5d74289114e', brandArtworkSha256:'21d54bfc0f4668824fdacafa80423073160b81f4f2ab8276c389883cc38fbc9c'}),
  'nfl-texans': Object.freeze({scene:'nfl-texans', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'0bd652d1b11589185864fe607a9f4e7f1114668ac7b79cdb2012f672ec143600', brandArtworkSha256:'e3175dbc1d63fe74c411328bae25f9728aa670f8786d4f479566f705a8141cb4'}),
  'nfl-colts': Object.freeze({scene:'nfl-colts', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'ed216ed6e6a21a1bc441d18d77dfc446ccb8d21a857274ef7d94852998324c20', brandArtworkSha256:'99ce2785dd0b87ff31c87e04323760d50e2a2677cb557ff74ab60cce541db5a1'}),
  'nfl-jaguars': Object.freeze({scene:'nfl-jaguars', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'0b370e4196739d332df8989abc2f78a7ab6a6b168858bdc2f7f316cca766a964', brandArtworkSha256:'91cfc86e61ce71c2867f05da19013b27dfc03a6687155981630a4b8f1fc2de99'}),
  'nfl-titans': Object.freeze({scene:'nfl-titans', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'492ad416948830577e7a59cece36f5c002b03d74f739b0aeac78b9714634c73c', brandArtworkSha256:'b1332193d0d945f433173b9588967ef5a85ebd2b77b6e7724fdead82d15b0270'}),
  'nfl-chiefs': Object.freeze({scene:'nfl-chiefs', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'74c72ab80efc4a7a9916c79ce38d8afbe091f9e65ee8938996dfaf9c87b1bd1a', brandArtworkSha256:'5cf2e7e5e7bd3bf694fa5f5b48b0ce2e0c5257b6ff7b5c2b3fa1bf1a65ab31da'}),
  'nfl-raiders': Object.freeze({scene:'nfl-raiders', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'7bb29f9967bf86f0c52189c042388c63c6b391279f55ea4d813e6ee4bb9089b2', brandArtworkSha256:'c5aa32e78c9f444367bd9a0212dbcab8f46d852a95c8e3ba48e5eea5eba2e4ed'}),
  'nfl-broncos': Object.freeze({scene:'nfl-broncos', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'96b9c9b2c93a8eb39da9610b9675787e76cf71e0b7b22ea151e3122a186b95c3', brandArtworkSha256:'8f1ef2be60f330c9ff4f739f2823e9f40bc11dc06d184374588e1a7feddab4c9'}),
  'nfl-chargers': Object.freeze({scene:'nfl-chargers', approval:'docs/content/halloween-nfl-2026.md', artworkSha256:'f31445b8a3d5fa5298d9736b7a02ec4a5a007ceed1a6d930d6e9d0b1ef3920f4', brandArtworkSha256:'16bf638027ee9f20897e09bcd602f9573244ce1b6783c1fa9deb32169ff955cb'})
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
  'halloween-2026': Object.freeze({approval:'docs/content/halloween-nfl-2026.md: Eight Halloween nights',
    themeIds:Object.freeze(['halloween-pumpkin-porch', 'halloween-ghost-stories', 'halloween-witching-hour',
      'halloween-ravens-rest', 'halloween-vampires-toast', 'halloween-midnight-carnival', 'halloween-last-orders', 'halloween-lantern-maze'])})
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
