// Procedural WebAudio SFX in the style of an 80s Saturday-morning superhero
// cartoon: brass stabs, timpani hits, crash cymbals, punchy foley thumps,
// analog synth zaps and sweeps, slide whistles and boings, all through a
// slightly saturated bus and a twangy spring reverb. No audio assets: every
// sound is synthesised on the spot (zero download, works on any host).
const rnd = (a, b) => a + Math.random() * (b - a);

// loudness trims per event (balanced from offline renders: hits up front,
// channels like the telekinesis hum and the flame roar sit underneath)
const VOL = {
  click: 1.5, coin: 1.4, punch: 1.6, kill: 1.15, hurt: 1.3, whoosh: 2.4, teleport: 1.3, flame: 0.7, freeze: 1.1,
  shatter: 1.1, tk: 0.55, slam: 1.0, invis: 1.4, xray: 1.3, morph: 1.2, dupe: 1.0, pickup: 1.1, potion: 1.0,
  fireball: 1.6, explosion: 1.0, landing: 0.95, grow: 0.8, nemesis: 0.8, death: 0.8, worldshift: 1.2, cashout: 0.8,
};

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = (() => { try { return localStorage.getItem('irr_sound') !== '0'; } catch { return true; } })();
    this.noiseBuf = null;
    this.last = {};
    this._k = 1;
    for (const [name, k] of Object.entries(VOL)) {
      const fn = this[name];
      this[name] = (...args) => { this._k = k; try { fn.apply(this, args); } finally { this._k = 1; } };
    }
  }

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try { this.attach(new (window.AudioContext || window.webkitAudioContext)()); } catch { /* no audio available */ }
  }

  // build the mix bus on a (real or offline) context
  attach(ctx) {
    this.ctx = ctx;
    const sr = ctx.sampleRate;
    // white noise, 2 s
    this.noiseBuf = ctx.createBuffer(1, sr * 2, sr);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    // master: gentle glue compressor so stacked hits don't clip
    this.master = ctx.createGain();
    this.master.gain.value = 0.62;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4;
    comp.attack.value = 0.004; comp.release.value = 0.18;
    this.master.connect(comp).connect(ctx.destination);

    // dry bus with soft tape-style saturation (the 80s TV-speaker grit)
    this.dry = ctx.createGain();
    const sat = ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i++) { const x = (i / 511.5) - 1; curve[i] = Math.tanh(x * 1.6) / Math.tanh(1.6); }
    sat.curve = curve; sat.oversample = '2x';
    this.dry.connect(sat).connect(this.master);

    // spring reverb send: decaying noise with the dispersive "boing" chirps of a spring tank
    this.wet = ctx.createGain();
    const conv = ctx.createConvolver();
    const len = Math.floor(sr * 1.8), ir = ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const o = ir.getChannelData(ch);
      let phase = 0;
      for (let i = 0; i < len; i++) {
        const t = i / sr, period = 0.043 + ch * 0.004, k = (t % period) / period;
        phase += (2 * Math.PI * (3200 * (1 - k) * (1 - k) + 250)) / sr;
        o[i] = (Math.random() * 2 - 1) * 0.55 * Math.exp(-t * 3.4) + Math.sin(phase) * 0.35 * Math.exp(-t * 4.2);
      }
    }
    conv.buffer = ir;
    const wetOut = ctx.createGain(); wetOut.gain.value = 0.32;
    this.wet.connect(conv).connect(wetOut).connect(this.master);
  }

  setEnabled(on) {
    this.enabled = on;
    try { localStorage.setItem('irr_sound', on ? '1' : '0'); } catch { /* private mode */ }
  }

  get t() { return this.ctx.currentTime + 0.005; }
  get on() { return !!this.ctx && this.enabled; }
  // per-sound rate limit so a brawl doesn't become white noise
  gate(name, gap) {
    const now = this.ctx.currentTime;
    if ((this.last[name] ?? -1) + gap > now) return false;
    this.last[name] = now;
    return true;
  }

  // ---------------------------------------------------------------------------
  // building blocks
  // ---------------------------------------------------------------------------
  // output stage for one voice: envelope gain -> dry (+ reverb send, + pan)
  out(t, { a = 0.005, peak = 0.3, hold = 0, d = 0.2, send = 0.1, pan = 0 }) {
    peak *= this._k;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
    if (hold) g.gain.setValueAtTime(Math.max(peak, 0.0002), t + a + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + d);
    let node = g;
    if (pan && this.ctx.createStereoPanner) { const p = this.ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); node = p; }
    node.connect(this.dry);
    if (send) { const s = this.ctx.createGain(); s.gain.value = send; node.connect(s).connect(this.wet); }
    return { g, end: t + a + hold + d + 0.05 };
  }

  vibrato(param, t, rate, depth, end, delay = 0) {
    const l = this.ctx.createOscillator(), lg = this.ctx.createGain();
    l.frequency.value = rate;
    lg.gain.setValueAtTime(0, t);
    lg.gain.linearRampToValueAtTime(depth, t + delay + 0.05);
    l.connect(lg).connect(param);
    l.start(t); l.stop(end);
  }

  // oscillator voice. f -> f2 glide ('exp' | 'lin'), optional curve [multipliers],
  // optional lowpass with cutoff sweep, optional vibrato
  osc({ t = this.t, type = 'sine', f = 440, f2 = f, glide = 'exp', curve = null, dur = 0.2, a = 0.005, peak = 0.2, hold = 0, d = null,
    lp = null, lp2 = null, q = 0.7, vib = null, detune = 0, send = 0.1, pan = 0 }) {
    const c = this.ctx, o = c.createOscillator();
    o.type = type; o.detune.value = detune;
    if (curve) {
      o.frequency.setValueCurveAtTime(Float32Array.from(curve, (m) => Math.max(1, f * m)), t, dur);
    } else {
      o.frequency.setValueAtTime(f, t);
      if (f2 !== f) glide === 'lin' ? o.frequency.linearRampToValueAtTime(f2, t + dur) : o.frequency.exponentialRampToValueAtTime(Math.max(f2, 1), t + dur);
    }
    const env = this.out(t, { a, peak, hold, d: d ?? Math.max(0.01, dur - a - hold), send, pan });
    let src = o;
    if (lp) {
      const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = q;
      fl.frequency.setValueAtTime(lp, t);
      if (lp2) fl.frequency.exponentialRampToValueAtTime(lp2, t + dur);
      o.connect(fl); src = fl;
    }
    src.connect(env.g);
    if (vib) this.vibrato(o.frequency, t, vib[0], vib[1], env.end, vib[2] || 0);
    o.start(t); o.stop(env.end);
    return o;
  }

  // filtered noise voice; fcurve: array of cutoff/centre frequencies over dur
  noise({ t = this.t, dur = 0.3, a = 0.004, peak = 0.3, hold = 0, d = null, type = 'bandpass', f = 1000, f2 = f, fcurve = null, q = 1, send = 0.08, pan = 0 }) {
    const c = this.ctx, s = c.createBufferSource();
    s.buffer = this.noiseBuf; s.loop = true;
    s.playbackRate.value = rnd(0.9, 1.1);
    const fl = c.createBiquadFilter(); fl.type = type; fl.Q.value = q;
    if (fcurve) fl.frequency.setValueCurveAtTime(Float32Array.from(fcurve), t, dur);
    else { fl.frequency.setValueAtTime(f, t); if (f2 !== f) fl.frequency.exponentialRampToValueAtTime(Math.max(f2, 20), t + dur); }
    const env = this.out(t, { a, peak, hold, d: d ?? Math.max(0.01, dur - a - hold), send, pan });
    s.connect(fl).connect(env.g);
    s.start(t, Math.random() * 1.5); s.stop(env.end);
  }

  // foley body hit: pitched thump with a click on top
  thump(t, vol = 0.5, f = 100) {
    this.osc({ t, type: 'sine', f: f * 2.4, f2: f * 0.5, dur: 0.16, a: 0.002, peak: vol, send: 0.05 });
    this.noise({ t, dur: 0.025, peak: vol * 0.5, type: 'lowpass', f: 3000, send: 0 });
  }
  // orchestral timpani: pitch settles after the mallet strike
  timp(f, t, vol = 0.4, dur = 1.0) {
    this.osc({ t, type: 'sine', f: f * 1.45, f2: f, dur: 0.05, a: 0.002, peak: vol, hold: 0, d: dur, send: 0.25 });
    this.osc({ t, type: 'triangle', f: f * 2.2, f2: f * 1.5, dur: 0.05, a: 0.002, peak: vol * 0.25, d: dur * 0.6, send: 0.2 });
    this.noise({ t, dur: 0.07, peak: vol * 0.45, type: 'lowpass', f: 900, send: 0.1 });
  }
  // crash / splash cymbal
  crash(t, vol = 0.15, dur = 1.2) {
    this.noise({ t, dur, a: 0.002, peak: vol, type: 'highpass', f: 5200, f2: 3200, q: 0.5, send: 0.3 });
    this.noise({ t, dur: dur * 0.6, a: 0.002, peak: vol * 0.6, type: 'bandpass', f: 7800, q: 2.5, send: 0.2 });
  }
  // brass section stab: detuned saws through a lowpass that "blats" open
  brass(freqs, t, dur = 0.3, vol = 0.12, { fall = 0, vib = false, wah = false } = {}) {
    const c = this.ctx;
    for (const f of freqs) {
      for (const det of [-9, 7]) {
        const o = c.createOscillator(); o.type = 'sawtooth'; o.detune.value = det;
        o.frequency.setValueAtTime(f, t);
        if (fall) o.frequency.exponentialRampToValueAtTime(f * fall, t + dur);
        const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = 1.2;
        fl.frequency.setValueAtTime(320, t);
        fl.frequency.exponentialRampToValueAtTime(wah ? 1600 : 3200, t + (wah ? dur * 0.35 : 0.035));
        fl.frequency.exponentialRampToValueAtTime(wah ? 380 : 1300, t + dur);
        const env = this.out(t, { a: 0.018, peak: vol / freqs.length, hold: dur * 0.55, d: dur * 0.45 + 0.08, send: 0.22 });
        o.connect(fl).connect(env.g);
        if (vib) this.vibrato(o.frequency, t, 5.5, f * 0.025, env.end, dur * 0.3);
        o.start(t); o.stop(env.end);
      }
    }
  }
  // FM bell / chime ("ding!")
  bell(f, t, vol = 0.1, dur = 0.4, ratio = 3.5, send = 0.2) {
    const c = this.ctx, car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain();
    car.frequency.value = f; mod.frequency.value = f * ratio;
    mg.gain.setValueAtTime(f * 2.2, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + dur);
    mod.connect(mg).connect(car.frequency);
    const env = this.out(t, { a: 0.002, peak: vol, d: dur, send });
    car.connect(env.g);
    car.start(t); mod.start(t); car.stop(env.end); mod.stop(env.end);
  }
  // cartoon spring "boing": pitch wobbles and settles
  boing(f, t, vol = 0.2, dur = 0.55, type = 'triangle') {
    const n = 64, curve = [];
    for (let i = 0; i < n; i++) { const x = i / (n - 1); curve.push(1 + 0.55 * Math.sin(x * dur * 2 * Math.PI * 13) * Math.exp(-x * 4) + x * 0.15); }
    this.osc({ t, type, f, curve, dur, a: 0.004, peak: vol, send: 0.25 });
  }
  // slide whistle
  slide(f1, f2, t, dur, vol = 0.1) {
    this.osc({ t, type: 'sine', f: f1, f2, glide: 'lin', dur, a: 0.03, peak: vol, vib: [6.5, f1 * 0.025, 0.05], send: 0.25 });
  }

  // ---------------------------------------------------------------------------
  // game events (same API as before)
  // ---------------------------------------------------------------------------
  click() {
    if (!this.on) return; const t = this.t;
    this.osc({ t, type: 'sine', f: 1900, f2: 1500, dur: 0.045, peak: 0.12, send: 0 });
    this.noise({ t, dur: 0.02, peak: 0.07, f: 2600, q: 6, send: 0 });
  }
  coin() {
    if (!this.on || !this.gate('coin', 0.04)) return; const t = this.t, k = rnd(0.98, 1.03);
    this.bell(1568 * k, t, 0.12, 0.22, 2, 0.12);
    this.bell(2093 * k, t + 0.07, 0.11, 0.38, 2, 0.15);
  }
  punch() {
    if (!this.on || !this.gate('punch', 0.035)) return; const t = this.t, k = rnd(0.88, 1.12);
    this.thump(t, 0.55, 92 * k);
    this.noise({ t, dur: 0.06, peak: 0.42, f: 1500 * k, f2: 700, q: 1.3, send: 0.08 });          // crack
    this.osc({ t, type: 'sawtooth', f: 420 * k, f2: 110, dur: 0.075, peak: 0.16, lp: 2200, lp2: 400, send: 0.06 }); // whap
  }
  kill() {
    if (!this.on || !this.gate('kill', 0.05)) return; const t = this.t, k = rnd(0.9, 1.1);
    this.thump(t, 0.6, 78 * k);
    this.noise({ t, dur: 0.22, peak: 0.35, f: 1100 * k, f2: 180, q: 0.9, send: 0.12 });
    this.timp(104 * k, t, 0.32, 0.6);
    this.crash(t + 0.01, 0.1, 0.6);
    this.osc({ t: t + 0.02, type: 'square', f: 880 * k, f2: 160, dur: 0.16, peak: 0.06, lp: 2600, send: 0.15 });    // ricochet "pyew"
  }
  hurt() {
    if (!this.on || !this.gate('hurt', 0.08)) return; const t = this.t;
    this.thump(t, 0.35, 85);
    this.osc({ t, type: 'square', f: 330, f2: 150, dur: 0.24, peak: 0.12, lp: 1400, vib: [22, 25], send: 0.12 });       // "bwonk"
  }
  whoosh() {
    if (!this.on || !this.gate('whoosh', 0.06)) return; const t = this.t, dur = rnd(0.22, 0.32), lo = rnd(280, 420), hi = rnd(1900, 3000);
    this.noise({ t, dur, a: dur * 0.45, peak: 0.28, d: dur * 0.55, fcurve: [lo, hi, hi * 0.9, lo * 1.5], q: 1.8, send: 0.1, pan: rnd(-0.4, 0.4) });
  }
  teleport() {
    if (!this.on) return; const t = this.t;
    [880, 1320, 1760, 2640].forEach((f, i) => this.bell(f, t + i * 0.035, 0.07, 0.25, 1.5, 0.3));
    this.osc({ t, type: 'sine', f: 220, f2: 2600, dur: 0.26, peak: 0.1, vib: [32, 90], send: 0.3 });
    this.noise({ t, dur: 0.18, peak: 0.08, type: 'highpass', f: 4000, send: 0.2 });
  }
  flame() {
    if (!this.on) return; const t = this.t;
    this.noise({ t, dur: 1.6, a: 0.12, peak: 0.42, hold: 1.1, d: 0.35, type: 'lowpass', f: 650, f2: 900, q: 0.8, send: 0.08 }); // roar
    this.noise({ t, dur: 1.6, a: 0.1, peak: 0.1, hold: 1.1, d: 0.4, f: 2600, q: 0.7, send: 0.05 });                      // hiss
    this.osc({ t, type: 'sawtooth', f: 52, f2: 60, dur: 1.6, a: 0.1, peak: 0.12, hold: 1.1, d: 0.4, lp: 180, send: 0 });    // rumble
    for (let i = 0; i < 16; i++) this.noise({ t: t + rnd(0.05, 1.5), dur: 0.012, peak: rnd(0.08, 0.18), f: rnd(2500, 6000), q: 3, send: 0 }); // crackle
  }
  freeze() {
    if (!this.on) return; const t = this.t;
    for (let i = 0; i < 11; i++) this.bell(rnd(4800, 6200) - i * 300, t + i * 0.045, rnd(0.04, 0.07), rnd(0.15, 0.35), 2.7, 0.35);
    this.noise({ t, dur: 0.8, a: 0.02, peak: 0.12, type: 'highpass', f: 6500, f2: 2600, q: 0.7, send: 0.2 });
    this.osc({ t, type: 'sine', f: 1800, f2: 620, dur: 0.7, peak: 0.06, vib: [9, 40], send: 0.3 });
  }
  shatter() {
    if (!this.on || !this.gate('shatter', 0.05)) return; const t = this.t;
    this.thump(t, 0.25, 140);
    this.crash(t, 0.22, 0.45);
    for (let i = 0; i < 14; i++) this.bell(rnd(3000, 9000), t + rnd(0, 0.16), rnd(0.04, 0.08), rnd(0.06, 0.22), rnd(1.3, 3.1), 0.2);
  }
  tk() {
    if (!this.on) return; const t = this.t;
    // theremin "woo-ooo": wobbling sine with a ghostly fifth
    this.osc({ t, type: 'sine', f: 330, f2: 560, glide: 'lin', dur: 1.3, a: 0.2, peak: 0.12, hold: 0.7, d: 0.4, vib: [6, 14, 0.1], send: 0.4 });
    this.osc({ t, type: 'sine', f: 495, f2: 840, glide: 'lin', dur: 1.3, a: 0.3, peak: 0.04, hold: 0.6, d: 0.4, vib: [6.3, 20, 0.1], send: 0.4 });
    this.osc({ t, type: 'triangle', f: 82, f2: 110, dur: 1.3, a: 0.15, peak: 0.08, hold: 0.8, d: 0.35, send: 0.1 });
  }
  slam() {
    if (!this.on || !this.gate('slam', 0.06)) return; const t = this.t;
    this.thump(t, 0.7, 62);
    this.timp(65, t, 0.45, 1.1);
    this.noise({ t, dur: 0.42, peak: 0.48, type: 'lowpass', f: 500, f2: 60, q: 0.6, send: 0.12 });
    this.crash(t + 0.01, 0.14, 0.9);
  }
  invis() {
    if (!this.on) return; const t = this.t;
    this.noise({ t, dur: 0.48, a: 0.03, peak: 0.24, f: 3200, f2: 280, q: 3, send: 0.35 });   // "shwoop"
    this.osc({ t, type: 'sine', f: 1300, f2: 140, dur: 0.48, peak: 0.1, vib: [18, 60], send: 0.35 });
  }
  xray() {
    if (!this.on) return; const t = this.t;
    // scanning synth "bee-oo-bee-oo" then a ping
    const curve = []; for (let i = 0; i < 48; i++) curve.push(1 + 0.45 * Math.sign(Math.sin(i / 47 * Math.PI * 2 * 4)));
    this.osc({ t, type: 'square', f: 620, curve, dur: 0.5, a: 0.01, peak: 0.07, lp: 2400, send: 0.25 });
    this.bell(2490, t + 0.5, 0.08, 0.5, 1.5, 0.35);
  }
  morph() {
    if (!this.on) return; const t = this.t;
    this.boing(220, t, 0.18, 0.6);
    this.osc({ t: t + 0.05, type: 'sine', f: 420, curve: [1, 1.8, 2.2, 1.4, 0.7, 0.8], dur: 0.5, peak: 0.08, send: 0.25 });
  }
  dupe() {
    if (!this.on) return; const t = this.t;
    [0, 0.11, 0.22].forEach((dt, i) => this.osc({ t: t + dt, type: 'sine', f: 300 + i * 120, f2: 950 + i * 300, dur: 0.08, peak: 0.2, send: 0.15 })); // bloop-bloop-bloop
    this.bell(1760, t + 0.3, 0.06, 0.3, 2, 0.3);
  }
  pickup() {
    if (!this.on || !this.gate('pickup', 0.05)) return; const t = this.t;
    [1047, 1319, 1568, 2093].forEach((f, i) => this.bell(f, t + i * 0.05, 0.09, 0.3, 2, 0.2));
  }
  potion() {
    if (!this.on) return; const t = this.t;
    [0, 0.09, 0.18].forEach((dt) => this.osc({ t: t + dt, type: 'sine', f: rnd(230, 280), f2: rnd(480, 560), dur: 0.07, peak: 0.2, send: 0.1 })); // glug
    this.slide(620, 1900, t + 0.26, 0.34, 0.08);
    [2093, 2637].forEach((f, i) => this.bell(f, t + 0.55 + i * 0.06, 0.06, 0.35, 2, 0.3));
  }
  fireball() {
    if (!this.on) return; const t = this.t;
    this.noise({ t, dur: 0.6, a: 0.04, peak: 0.45, type: 'lowpass', fcurve: [200, 1600, 900, 500], q: 0.9, send: 0.12 }); // "fwoom"
    this.osc({ t, type: 'sawtooth', f: 70, f2: 150, dur: 0.5, peak: 0.14, lp: 300, send: 0 });
    for (let i = 0; i < 8; i++) this.noise({ t: t + rnd(0.05, 0.5), dur: 0.012, peak: rnd(0.08, 0.15), f: rnd(2500, 6000), q: 3, send: 0 });
  }
  explosion() {
    if (!this.on || !this.gate('explosion', 0.08)) return; const t = this.t;
    this.thump(t, 0.85, 52);
    this.noise({ t, dur: 1.4, a: 0.003, peak: 0.62, type: 'lowpass', f: 1400, f2: 70, q: 0.7, send: 0.25 });  // rumble
    this.timp(55, t, 0.45, 1.5);
    this.crash(t + 0.01, 0.2, 1.4);
    for (let i = 0; i < 10; i++) this.noise({ t: t + rnd(0.1, 0.9), dur: 0.015, peak: rnd(0.06, 0.12), f: rnd(1500, 4500), q: 2, send: 0.05 }); // debris
  }
  landing() {
    if (!this.on) return; const t = this.t;
    this.thump(t, 0.85, 48);
    this.noise({ t, dur: 0.95, peak: 0.5, type: 'lowpass', f: 900, f2: 55, q: 0.7, send: 0.22 });
    this.timp(62, t, 0.55, 1.3);
    this.crash(t + 0.01, 0.2, 1.3);
    this.brass([98, 147, 196], t + 0.02, 0.38, 0.16);           // power-chord stab
  }
  grow() {
    if (!this.on) return; const t = this.t;
    this.slide(280, 1150, t, 0.8, 0.09);                         // slide whistle up
    this.osc({ t, type: 'sawtooth', f: 55, f2: 110, dur: 0.8, a: 0.05, peak: 0.16, lp: 420, vib: [5, 2], send: 0.1 }); // tuba
    this.timp(73, t + 0.78, 0.35, 0.8);
  }
  nemesis() {
    if (!this.on) return; const t = this.t;
    // "dun dun DUNNN": diminished brass hits over timpani
    this.brass([110, 131, 156], t, 0.13, 0.2); this.timp(55, t, 0.35, 0.5);
    this.brass([110, 131, 156], t + 0.2, 0.13, 0.2); this.timp(55, t + 0.2, 0.35, 0.5);
    this.brass([104, 123, 147, 175], t + 0.46, 1.05, 0.26, { vib: true }); this.timp(52, t + 0.46, 0.5, 1.4);
    this.crash(t + 0.46, 0.14, 1.4);
  }
  death() {
    if (!this.on) return; const t = this.t;
    // sad trombone "wah wah wah waaah"
    [233, 220, 208].forEach((f, i) => this.brass([f], t + i * 0.36, 0.3, 0.2, { wah: true }));
    this.brass([196], t + 1.08, 0.95, 0.22, { wah: true, vib: true, fall: 0.94 });
  }
  worldshift() {
    if (!this.on) return; const t = this.t;
    this.noise({ t, dur: 1.4, a: 0.3, peak: 0.14, fcurve: [300, 900, 2400, 4200, 2000], q: 4, send: 0.3 }); // phaser-ish sweep
    this.osc({ t, type: 'sawtooth', f: 110, f2: 220, dur: 1.3, a: 0.2, peak: 0.1, lp: 300, lp2: 2600, q: 4, send: 0.3 });
    this.bell(1760, t + 1.2, 0.08, 0.6, 1.5, 0.4);
  }
  cashout() {
    if (!this.on) return; const t = this.t;
    // ta-da fanfare
    [523, 659, 784].forEach((f, i) => this.brass([f], t + i * 0.1, 0.09, 0.15));
    this.brass([523, 659, 784, 1047], t + 0.32, 0.7, 0.24, { vib: true });
    this.timp(131, t + 0.32, 0.35, 0.9);
    this.crash(t + 0.32, 0.1, 1.0);
    [2093, 2637, 3136].forEach((f, i) => this.bell(f, t + 0.36 + i * 0.07, 0.05, 0.4, 2, 0.35));
  }
}

export const SFX = new AudioEngine();
export { AudioEngine };
