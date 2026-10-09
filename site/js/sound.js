// Small, optional material sounds. No context is created before the sound toggle.
const GLUG_PERIOD = 0.58;
const MASTER_LEVEL = 0.12;

export function createSipSound({AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext, onChange = () => {}} = {}){
  let context = null, master = null, enabled = false, desiredEnabled = false, revision = 0, resuming = null, suspended = false;
  let activeSip = false, landed = false, glugCycle = 0;
  const voices = new Set();
  const supported = typeof AudioContextClass === 'function';

  function changed(value){
    if (enabled === value) return;
    enabled = value;
    try { onChange(value); } catch { /* a UI callback must never interrupt input */ }
  }
  function stop(){
    activeSip = false;
    for (const source of voices){
      try { source.stop(); } catch { /* an already-ended voice is harmless */ }
      try { source.disconnect(); } catch { /* older audio implementations */ }
    }
    voices.clear();
  }
  function suspendContext(){
    if (context && context.state !== 'closed'){
      try { Promise.resolve(context.suspend()).catch(() => {}); } catch { /* no sound is safer than retrying */ }
    }
  }
  function suspend(){
    suspended = true;
    if (master) master.gain.value = 0;
    stop(); suspendContext();
  }
  function unavailable(){
    desiredEnabled = false; changed(false);
    if (master) master.gain.value = 0;
    suspend();
  }
  function resume(){
    if (!context || context.state === 'closed') return Promise.resolve(false);
    if (context.state === 'running') return Promise.resolve(true);
    if (resuming) return resuming;
    try {
      resuming = Promise.resolve(context.resume()).then(() => {
        // Hiding can race with a pending browser resume. Keep that success as an
        // enabled preference, but close audio again until the next sip input.
        const ready = context.state === 'running' || (suspended && context.state !== 'closed');
        if (suspended || !desiredEnabled) suspendContext();
        return ready;
      }, () => false).finally(() => { resuming = null; });
      return resuming;
    } catch { return Promise.resolve(false); }
  }
  async function setEnabled(value){
    const request = ++revision;
    desiredEnabled = !!value;
    if (!value){
      changed(false);
      if (master) master.gain.value = 0;
      suspend();
      return false;
    }
    if (!supported) return false;
    suspended = false;
    try {
      if (!context){
        context = new AudioContextClass({latencyHint:'interactive'});
        master = context.createGain();
        master.gain.value = 0;
        master.connect(context.destination);
      }
      // This resume call begins in the click handler, before the first await.
      const ready = await resume();
      if (request !== revision){
        if (!desiredEnabled) suspend();
        return false;
      }
      if (!ready){ unavailable(); return false; }
      master.gain.value = suspended ? 0 : MASTER_LEVEL;
      changed(true);
      return true;
    } catch { unavailable(); return false; }
  }
  function audible(){ return enabled && !suspended && context?.state === 'running' && master; }
  function track(source, nodes){
    voices.add(source);
    source.onended = () => {
      voices.delete(source);
      for (const node of [source, ...nodes]){
        try { node.disconnect(); } catch { /* cleanup is best effort */ }
      }
    };
  }
  function envelope(gain, at, duration, level, attack = 0.004){
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(level, at + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  }
  function noise({at = context.currentTime, duration, level, frequency, type = 'lowpass', q = 0.7}){
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
    source.buffer = buffer; filter.type = type; filter.frequency.value = frequency; filter.Q.value = q;
    envelope(gain, at, duration, level);
    source.connect(filter); filter.connect(gain); gain.connect(master);
    track(source, [filter, gain]); source.start(at); source.stop(at + duration);
  }
  function body({at = context.currentTime, duration, level, from, to}){
    const source = context.createOscillator(), gain = context.createGain();
    source.type = 'sine';
    source.frequency.setValueAtTime(from, at);
    source.frequency.exponentialRampToValueAtTime(to, at + duration);
    envelope(gain, at, duration, level, 0.003);
    source.connect(gain); gain.connect(master);
    track(source, [gain]); source.start(at); source.stop(at + duration);
  }
  function playGlug(){
    // A short cavity pulse beneath filtered liquid noise, rather than a pitched alert.
    noise({duration:0.105, level:0.14, frequency:720, type:'bandpass', q:0.9});
    body({duration:0.085, level:0.10, from:190, to:82});
  }
  function start(){
    stop();
    suspended = false;
    if (enabled && master) master.gain.value = MASTER_LEVEL;
    activeSip = true; landed = false; glugCycle = 0;
    if (enabled && context?.state !== 'running'){
      const request = revision;
      resume().then(ready => { if (!ready && request === revision) unavailable(); });
    }
  }
  function update(theme, {drinking = false, elapsed = 0} = {}){
    if (!activeSip || landed || !drinking || theme?.vessel !== 'bottle' || !Number.isFinite(elapsed)) return false;
    // The loudest liquid pulse is a quarter into the same .58-second drink cycle.
    const cycle = Math.floor((Math.max(0, elapsed) + GLUG_PERIOD * 0.75) / GLUG_PERIOD);
    if (cycle <= glugCycle) return false;
    glugCycle = cycle;
    // A resumed/slow frame makes at most one glug, never a queue of stale sounds.
    if (!audible()) return false;
    try { playGlug(); return true; } catch { unavailable(); return false; }
  }
  function land(theme, {perfect = false} = {}){
    if (!activeSip || landed) return false;
    landed = true;
    if (!audible()) return false;
    try {
      if (theme?.vessel === 'stein'){
        noise({duration:0.13, level:0.20, frequency:1050});
        body({duration:0.17, level:0.18, from:102, to:42});
        noise({at:context.currentTime + 0.012, duration:0.045, level:0.10, frequency:2700, type:'bandpass'});
      } else if (theme?.vessel === 'bottle'){
        noise({duration:0.06, level:0.12, frequency:2600, type:'bandpass', q:1.2});
        body({duration:0.09, level:0.05, from:165, to:65});
      } else {
        noise({duration:0.085, level:0.14, frequency:850});
        body({duration:0.12, level:0.11, from:90, to:43});
      }
      if (perfect) noise({at:context.currentTime + 0.10, duration:0.035, level:0.09, frequency:2800, type:'bandpass', q:1.1});
      return true;
    } catch { unavailable(); return false; }
  }
  return {get enabled(){ return enabled; }, get supported(){ return supported; }, setEnabled, start, update, land, stop, suspend};
}
