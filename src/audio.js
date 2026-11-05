// Procedural WebAudio SFX — no audio assets required.
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.enabled = localStorage.getItem('irr_sound') !== '0';
    this.noiseBuf = null;
  }

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 1.5;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch { /* no audio available */ }
  }

  setEnabled(on) {
    this.enabled = on;
    localStorage.setItem('irr_sound', on ? '1' : '0');
  }

  get t() { return this.ctx.currentTime; }

  env(gainNode, t0, attack, peak, decay) {
    const g = gainNode.gain;
    g.setValueAtTime(0.0001, t0);
    g.exponentialRampToValueAtTime(Math.max(peak, 0.0001), t0 + attack);
    g.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
  }

  tone({ type = 'sine', from = 440, to = from, dur = 0.2, vol = 0.3, attack = 0.005, delay = 0 }) {
    if (!this.ctx || !this.enabled) return;
    const t0 = this.t + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t0 + dur);
    this.env(g, t0, attack, vol, dur);
    osc.connect(g).connect(this.master);
    osc.start(t0); osc.stop(t0 + dur + attack + 0.05);
  }

  noise({ dur = 0.3, vol = 0.3, from = 800, to = 300, q = 1, attack = 0.005, delay = 0, type = 'bandpass' }) {
    if (!this.ctx || !this.enabled) return;
    const t0 = this.t + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf; src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(from, t0);
    f.frequency.exponentialRampToValueAtTime(Math.max(to, 20), t0 + dur);
    const g = this.ctx.createGain();
    this.env(g, t0, attack, vol, dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t0); src.stop(t0 + dur + attack + 0.05);
  }

  // ---- game events ----
  click()      { this.tone({ type: 'triangle', from: 900, to: 700, dur: 0.06, vol: 0.15 }); }
  coin()       { this.tone({ type: 'sine', from: 1150, to: 1600, dur: 0.09, vol: 0.14 }); this.tone({ type: 'sine', from: 1720, to: 2100, dur: 0.10, vol: 0.10, delay: 0.05 }); }
  punch()      { this.noise({ dur: 0.12, vol: 0.4, from: 500, to: 120, q: 0.8 }); this.tone({ type: 'square', from: 150, to: 60, dur: 0.1, vol: 0.2 }); }
  kill()       { this.noise({ dur: 0.25, vol: 0.5, from: 900, to: 90, q: 0.7 }); this.tone({ type: 'sawtooth', from: 320, to: 50, dur: 0.3, vol: 0.28 }); }
  hurt()       { this.tone({ type: 'sawtooth', from: 220, to: 90, dur: 0.15, vol: 0.3 }); }
  whoosh()     { this.noise({ dur: 0.35, vol: 0.35, from: 400, to: 2400, q: 2 }); }
  teleport()   { this.tone({ type: 'sine', from: 300, to: 1800, dur: 0.18, vol: 0.25 }); this.noise({ dur: 0.2, vol: 0.2, from: 2000, to: 4000, q: 3 }); }
  flame()      { this.noise({ dur: 1.6, vol: 0.35, from: 300, to: 700, q: 0.5, attack: 0.15 }); }
  freeze()     { this.noise({ dur: 0.8, vol: 0.3, from: 4000, to: 900, q: 4 }); this.tone({ type: 'sine', from: 1400, to: 500, dur: 0.7, vol: 0.15 }); }
  shatter()    { this.noise({ dur: 0.3, vol: 0.45, from: 5000, to: 2000, q: 1.5 }); }
  tk()         { this.tone({ type: 'sine', from: 90, to: 240, dur: 1.4, vol: 0.2 }); this.tone({ type: 'sine', from: 93, to: 246, dur: 1.4, vol: 0.15 }); }
  slam()       { this.noise({ dur: 0.4, vol: 0.55, from: 400, to: 60, q: 0.6 }); this.tone({ type: 'square', from: 100, to: 35, dur: 0.4, vol: 0.3 }); }
  invis()      { this.tone({ type: 'sine', from: 900, to: 200, dur: 0.5, vol: 0.18 }); }
  xray()       { this.tone({ type: 'triangle', from: 500, to: 1400, dur: 0.4, vol: 0.16 }); }
  morph()      { this.tone({ type: 'sawtooth', from: 200, to: 700, dur: 0.35, vol: 0.16 }); this.tone({ type: 'sawtooth', from: 700, to: 250, dur: 0.3, vol: 0.14, delay: 0.3 }); }
  dupe()       { this.tone({ type: 'square', from: 400, to: 800, dur: 0.15, vol: 0.14 }); this.tone({ type: 'square', from: 400, to: 800, dur: 0.15, vol: 0.14, delay: 0.12 }); }
  pickup()     { this.tone({ type: 'triangle', from: 600, to: 1200, dur: 0.2, vol: 0.22 }); this.tone({ type: 'triangle', from: 900, to: 1800, dur: 0.25, vol: 0.18, delay: 0.1 }); }
  potion()     { this.tone({ type: 'sine', from: 300, to: 900, dur: 0.4, vol: 0.22 }); this.noise({ dur: 0.3, vol: 0.12, from: 1500, to: 3500, q: 2, delay: 0.1 }); }
  fireball()   { this.noise({ dur: 0.9, vol: 0.5, from: 200, to: 900, q: 0.6 }); }
  explosion()  { this.noise({ dur: 0.9, vol: 0.65, from: 700, to: 45, q: 0.5 }); this.tone({ type: 'square', from: 90, to: 28, dur: 0.8, vol: 0.35 }); }
  landing()    { this.noise({ dur: 0.6, vol: 0.6, from: 500, to: 50, q: 0.5 }); this.tone({ type: 'square', from: 120, to: 30, dur: 0.55, vol: 0.32 }); }
  grow()       { this.tone({ type: 'sawtooth', from: 120, to: 420, dur: 0.8, vol: 0.22 }); }
  nemesis()    { this.tone({ type: 'sawtooth', from: 55, to: 52, dur: 1.6, vol: 0.4 }); this.tone({ type: 'sawtooth', from: 110, to: 104, dur: 1.6, vol: 0.25 }); this.noise({ dur: 1.4, vol: 0.15, from: 150, to: 60, q: 1 }); }
  death()      { this.tone({ type: 'sawtooth', from: 400, to: 40, dur: 1.4, vol: 0.4 }); this.noise({ dur: 1.2, vol: 0.35, from: 1200, to: 80, q: 0.8 }); }
  worldshift() { this.tone({ type: 'sine', from: 200, to: 1000, dur: 1.2, vol: 0.25 }); this.noise({ dur: 1.4, vol: 0.18, from: 500, to: 4000, q: 2, attack: 0.3 }); }
  cashout()    { const n = [523, 659, 784, 1047]; n.forEach((f, i) => this.tone({ type: 'triangle', from: f, to: f, dur: 0.25, vol: 0.2, delay: i * 0.11 })); }
}

export const SFX = new AudioEngine();
