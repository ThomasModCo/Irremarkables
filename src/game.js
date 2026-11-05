import * as THREE from 'three';
import { CONFIG } from './config.js';
import { POWERS, counterPowerFor } from './powers.js';
import { World } from './world.js';
import { FX } from './fx.js';
import { BamText } from './bam.js';
import { Collectibles } from './collectibles.js';
import { Character, setCharacterWorld } from './entities.js';
import { Director } from './rtp.js';
import { Controls } from './controls.js';
import { UI } from './ui.js';
import { SFX } from './audio.js';
import { rand, randInt, pick, clamp, botName, formatMoney, weightedPick, RUNTIME } from './utils.js';

const now = () => performance.now() / 1000;
const TK_COLOR = 0xc07bff;

const finite3 = (v) => Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);

// Blows only connect between characters at the same height: a flyer overhead is
// out of reach of someone on the pavement, and vice versa. The tolerance is
// about one body, so two heroes passing mid-climb can still trade hits.
const samePlane = (a, b) => Math.abs(a.feetY - b.feetY) <= CONFIG.HIT_Y_RANGE;
// straight-line distance between a character's chest and a world point
const chestDist = (ch, p) => Math.hypot(ch.pos.x - p.x, ch.feetY + 1.1 - p.y, ch.pos.z - p.z);

// Camera positions are lerp accumulators: once one holds a NaN it keeps it for
// the rest of the session and the scene renders black. Snap rather than blend
// whenever either side goes bad, so a single glitched frame can't stick.
function safeLerp(v, target, k) {
  if (!finite3(target)) return;
  if (!finite3(v)) { v.copy(target); return; }
  v.lerp(target, k);
}

// comic-book impact words per hit kind
const BAM_WORDS = {
  hit: ['POW!', 'WHAM!', 'SMACK!', 'BIFF!', 'THWACK!', 'BONK!', 'WHACK!', 'BAM!'],
  kill: ['KAPOW!', 'CRUNCH!', 'BLAM!', 'KRAK!', 'WHAMMO!', 'KA-BLAM!'],
  fire: ['FWOOSH!', 'KABOOM!', 'BLAZE!'],
  shatter: ['CRACK!', 'SHATTER!', 'KRISH!'],
  slam: ['SLAM!', 'CRASH!', 'WHUMP!'],
  hurt: ['OOF!', 'OUCH!', 'UGH!', 'ARGH!'],
  boom: ['BOOM!', 'KABOOM!', 'KRAKOOM!'],
  squish: ['SQUISH!', 'SPLAT!', 'CRUNCH!'],
};
const BAM_STYLE = {
  hit: { size: 1 },
  kill: { size: 1.35 },
  fire: { size: 1.45 },
  shatter: { size: 1.25 },
  slam: { size: 1.35 },
  hurt: { size: 0.9 },
  boom: { size: 1.7 },
  squish: { size: 1.25 },
};

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;

    // real-time sun shadows on desktop; mobile keeps cheap blob shadows only
    RUNTIME.shadows = window.matchMedia('(pointer: fine)').matches && !('ontouchstart' in window);
    if (RUNTIME.shadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(68, 1, 0.1, 600);
    this.baseFov = 68;

    this.world = new World(this.scene);
    setCharacterWorld(this.world);
    this.fx = new FX(this.scene);
    this.bams = new BamText(this.scene);
    this.collectibles = new Collectibles(this.scene, this.world);
    this.ui = new UI();
    this.controls = new Controls(canvas);
    this.director = new Director();

    this.state = 'menu';
    this.timescale = 1;
    this.slowmoUntil = 0;
    this.time = 0;

    this.wallet = parseFloat(localStorage.getItem('irr_wallet') ?? '') || CONFIG.STARTING_WALLET;

    this.bots = [];
    this.clones = [];
    this.thrown = [];          // telekinetically flung bodies & props
    this.pendingHits = [];     // scheduled melee impacts (land on the animation's hit frame)
    this.corpses = [];         // fallen heroes playing out their death clip before vanishing
    this.pendingRespawns = [];
    this.player = null;
    this.hunters = [];        // bots quietly assigned to end the round
    this.strikeT = 0;         // seconds since the strike began (drives escalation)
    this.hunterRefill = 0;
    this.hunterFireCd = 0;

    // camera state
    this.camYaw = 0;
    this.camPitch = 0.42;
    this.camPos = new THREE.Vector3(0, 30, 40);
    this.camTarget = new THREE.Vector3();
    this.attractBot = null;
    this.attractTimer = 0;
    this.deathT = 0;

    this.lbTimer = 0;

    this._v1 = new THREE.Vector3();
    this._v2 = new THREE.Vector3();

    this.collectibles.respawnAll();
    for (let i = 0; i < CONFIG.BOT_COUNT; i++) this.spawnBot({ initial: true });

    this.ui.onPlay = (power, bet) => this.startRound(power, bet);
    this.ui.onResultsDone = () => this.backToMenu();
    this.ui.onSwitchOpen = () => this.openSwitch();
    this.ui.onSwitchPick = (p) => this.doSwitch(p);
    this.controls.onAttack = () => this.playerAttack();
    this.controls.onPowerDown = () => this.powerDown();
    this.controls.onPowerUp = () => this.powerUp();
    this.controls.onSwitch = () => this.openSwitch();

    this.ui.showMenu(this.wallet);
    window.addEventListener('pointerdown', () => SFX.unlock(), { once: true });
  }

  saveWallet() { localStorage.setItem('irr_wallet', String(this.wallet)); }

  resize(w, h) {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  get focusPos() {
    if (this.player && (this.state === 'playing' || this.state === 'dying')) return this.player.ch.pos;
    if (this.attractBot?.ch.alive) return this.attractBot.ch.pos;
    return this.world.focus;
  }

  // ---- comic impact words ----
  bam(x, y, z, kind, sizeMul = 1) {
    const dc = Math.hypot(x - this.camPos.x, z - this.camPos.z);
    if (dc > 55) return;
    const st = BAM_STYLE[kind] || BAM_STYLE.hit;
    // words are world-sized sprites: slightly larger far away so they stay readable
    const far = clamp(0.8 + dc / 30, 0.8, 1.9);
    this.bams.spawn(x + rand(-0.25, 0.25), y + rand(-0.1, 0.25), z + rand(-0.25, 0.25), pick(BAM_WORDS[kind] || BAM_WORDS.hit),
      { size: st.size * sizeMul * far, camPos: this.camPos });
  }

  // ================= BOTS =================

  spawnBot({ initial = false, pos = null } = {}) {
    const power = weightedPick(POWERS, (p) => (p.rare ? 0.35 : 1));
    const ch = new Character(this.scene, { name: botName(), power });
    let p = pos;
    if (!p && !initial && this.player && this.state === 'playing' && Math.random() < 0.65) {
      // bias replacements toward the player so the lobby stays lively nearby
      p = this.world.randomOpenPos(this.player.ch.pos, 25, 65);
    }
    p = p || this.world.randomOpenPos(this.focusPos, 15, 90);
    ch.pos.set(p.x, 0, p.z);
    ch.yaw = rand(0, Math.PI * 2);
    const bot = {
      ch, power,
      state: 'roam',
      target: null,
      wander: this.world.randomOpenPos(p, 8, 40),
      repath: rand(0.5, 3),
      attackCd: 0,
      quirkCd: rand(2, 8),
      aggressive: Math.random() < 0.35,
      score: initial ? rand(0.2, 8) * 10 : rand(0.5, 3),
      hunter: false,
      stalkCd: 0,
      farT: 0,
      hp: 100,
      held: false,
    };
    this.bots.push(bot);
    return bot;
  }

  updateBot(b, dt) {
    const ch = b.ch;
    if (!ch.alive) return;
    if (b.held) { ch.update(dt, this.time); return; }  // telekinesis has them
    ch.update(dt, this.time);
    if (ch.rootMoved) this.world.resolve(ch.pos, 0.55, ch.altitude);
    if (ch.frozen) { ch.vel.set(0, 0, 0); return; }

    // keep the lobby near the action: far-drifted bots quietly re-enter nearby
    const f = this.focusPos;
    if (!b.hunter && Math.hypot(ch.pos.x - f.x, ch.pos.z - f.z) > CONFIG.RECYCLE_DIST + 20) {
      const p = this.world.randomOpenPos(f, 55, 100);
      ch.pos.set(p.x, 0, p.z);
      b.target = null;
      b.wander = this.world.randomOpenPos(f, 15, 60);
    }

    b.repath -= dt;
    b.attackCd -= dt;
    b.quirkCd -= dt;
    b.stalkCd -= dt;

    const phase = this.director.phase;
    const hunting = b.hunter && phase === 'strike' && this.player?.ch.alive && this.state === 'playing';
    const stalking = b.hunter && phase === 'stalk' && this.player?.ch.alive && this.state === 'playing';
    const playerTargetable = this.player && this.player.ch.alive && this.state === 'playing' &&
      !this.playerHidden() && this.player.ch.curScale < 1.5;

    if (b.repath <= 0 && !hunting) {
      b.repath = rand(1.2, 3);
      b.target = null;
      let best = null, bestD = 24;
      for (const other of this.bots) {
        if (other === b || !other.ch.alive || other.ch.frozen || other.held) continue;
        if (Math.abs(other.ch.feetY - ch.feetY) > 4) continue;   // can't reach them up there
        const d = ch.pos.distanceTo(other.ch.pos);
        if (d < bestD) { best = other; bestD = d; }
      }
      if (playerTargetable && b.aggressive && !stalking && Math.abs(this.player.ch.feetY - ch.feetY) < 4) {
        const dP = ch.pos.distanceTo(this.player.ch.pos);
        if (dP < 15 && dP < bestD) { b.target = 'player'; }
      }
      if (!b.target && best && Math.random() < (stalking ? 0.25 : 0.55)) b.target = best;
      if (!b.target && !stalking && Math.random() < 0.6) b.wander = this.world.randomOpenPos(ch.pos, 10, 45);
    }

    // stalking: look like an idle wanderer, but always drift to within a few
    // metres of the player so the strike starts from close range
    if (stalking && b.stalkCd <= 0) {
      b.stalkCd = rand(1.5, 3.5);
      const pp = this.player.ch.pos;
      const ang = rand(0, Math.PI * 2), r = rand(6, 13);
      const wx = pp.x + Math.sin(ang) * r, wz = pp.z + Math.cos(ang) * r;
      b.wander = this.world.isBlocked(wx, wz, 0.9) ? this.world.randomOpenPos(pp, 5, 13) : { x: wx, z: wz };
      if (b.target && ch.pos.distanceTo(pp) > 18) b.target = null;   // don't get dragged off by a brawl
    }

    if (hunting) b.target = 'player';

    let dest = b.wander, chasing = false;
    if (b.target === 'player') {
      if (!this.player || !this.player.ch.alive || (!hunting && !playerTargetable)) b.target = null;
      else { dest = this.player.ch.pos; chasing = true; }
    } else if (b.target) {
      if (!b.target.ch.alive || b.target.ch.frozen || b.target.held) b.target = null;
      else { dest = b.target.ch.pos; chasing = true; }
    }

    const dx = dest.x - ch.pos.x, dz = dest.z - ch.pos.z;
    const dist = Math.hypot(dx, dz);
    let speed = hunting ? CONFIG.HUNTER_SPEED : CONFIG.BOT_SPEED;

    // power quirks — spectacle & motion variety
    if (b.quirkCd <= 0) {
      b.quirkCd = rand(4, 10);
      const id = b.power.id;
      if (id === 'speed') { b.speedBurst = now() + 1.2; }
      else if (id === 'flight') { b.flyUntil = now() + rand(3, 6); }
      else if (id === 'teleport' && dist > 8) {
        const k = Math.min(9, dist * 0.6) / dist;
        const nx = ch.pos.x + dx * k, nz = ch.pos.z + dz * k;
        if (!this.world.isBlocked(nx, nz)) {
          this.fx.emit(ch.pos.x, 1.2, ch.pos.z, { count: 14, color: 0x7dffca, speed: 5, life: 0.4 });
          ch.pos.set(nx, 0, nz);
          this.fx.emit(nx, 1.2, nz, { count: 14, color: 0x7dffca, speed: 5, life: 0.4 });
        }
      } else if (id === 'invisibility') { b.fadeUntil = now() + 2.5; }
      else if (id === 'telekinesis') {
        this.fx.emit(ch.pos.x, 1.6, ch.pos.z, { count: 10, color: TK_COLOR, speed: 2.5, life: 0.7, gravity: 1 });
      }
    }
    if (b.speedBurst && now() < b.speedBurst) {
      speed *= 2.1;
      this.fx.emitDir(ch.pos.x, 1, ch.pos.z, this._v1.set(-dx / (dist || 1), 0, -dz / (dist || 1)),
        { count: 1, color: 0xffe45c, speed: 3, life: 0.3, size: 1.2, cone: 0.2 });
    }
    ch.setOpacity(b.fadeUntil && now() < b.fadeUntil ? 0.25 : 1);

    // flight altitude
    const chasingFlyer = hunting && this.player.ch.altitude > 2;
    const wantFly = (b.flyUntil && now() < b.flyUntil) || chasingFlyer;
    let targetAlt = 0;
    if (wantFly) {
      const deck = chasingFlyer ? Math.max(0, this.player.ch.altitude) : CONFIG.BOT_FLIGHT_DECK + Math.sin(this.time * 0.7 + ch.phase) * 1.2;
      // flyers lift over rooftops in their path rather than passing through them
      targetAlt = Math.max(deck, this.flightCeiling(ch, ch.vel.x, ch.vel.z));
    }
    if (!Number.isFinite(ch.altitude)) ch.altitude = 0;
    ch.altitude += (targetAlt - ch.altitude) * Math.min(1, dt * (targetAlt > ch.altitude ? 3.2 : 2.2));
    if (!(ch.altitude > 0.05)) ch.altitude = 0;
    // flying pose only for real flight (and the glide back down after it)
    ch.flying = wantFly || (ch.flying && ch.altitude > 0.4);

    // a hunter that loses the player quietly re-enters the scene nearby
    if (hunting) {
      const dP = ch.pos.distanceTo(this.player.ch.pos);
      if (dP > 34) b.farT += dt; else b.farT = 0;
      if (b.farT > 2.5 || (this.strikeT > CONFIG.HUNTER_BLINK_AT && dP > 9)) {
        this.relocateHunter(b, this.strikeT > CONFIG.HUNTER_BLINK_AT);
        b.farT = 0;
      }
      // enlarged reinforcements crush on contact
      if (ch.curScale > 1.5 && dP < 1.9 * ch.curScale && samePlane(this.player.ch, ch)) {
        this.bam(this.player.ch.pos.x, 1.2 + this.player.ch.altitude, this.player.ch.pos.z, 'squish', 1.3);
        this.playerDeath(b);
        return;
      }
    }

    // move (hold position while swinging; infighters close tighter)
    const stopDist = chasing ? Math.max(1.6, ch.combat.range * 0.72) : 1.2;
    if (ch.attacking && chasing) {
      ch.vel.set(0, 0, 0);
    } else if (dist > stopDist) {
      const vx = (dx / dist) * speed, vz = (dz / dist) * speed;
      ch.vel.set(vx, 0, vz);
      ch.pos.x += vx * dt;
      ch.pos.z += vz * dt;
      const targetYaw = Math.atan2(vx, vz);
      let dy = targetYaw - ch.yaw;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      ch.yaw += dy * Math.min(1, dt * 8);
      this.world.resolve(ch.pos, 0.55, ch.altitude);   // walls hold you until you're over them
    } else {
      ch.vel.set(0, 0, 0);
      if (!chasing && b.repath > 1) b.wander = this.world.randomOpenPos(ch.pos, 10, 45);
    }

    // attack: play the archetype's move, land the hit on its impact frame
    const victim = b.target === 'player' ? this.player?.ch : b.target?.ch;
    if (chasing && dist < ch.combat.range && b.attackCd <= 0 && victim && samePlane(ch, victim) && !ch.attacking) {
      const mv = ch.startAttack();
      b.attackCd = mv.duration + rand(0.25, 0.7);
      // face the target for the swing
      ch.yaw = Math.atan2(dx, dz);
      for (const at of mv.hits) {
        this.pendingHits.push({ at: this.time + at, owner: 'bot', bot: b, target: b.target, damage: mv.damage, range: mv.range });
      }
    }
  }

  // Resolve scheduled melee impacts (player, bots, clones).
  processHits() {
    for (let i = this.pendingHits.length - 1; i >= 0; i--) {
      const h = this.pendingHits[i];
      if (h.at > this.time) continue;
      this.pendingHits.splice(i, 1);
      if (h.owner === 'player') { this.resolvePlayerHit(h); continue; }
      const att = h.owner === 'bot' ? h.bot : h.clone;
      if (!att || !att.ch.alive) continue;
      if (h.owner === 'bot' && h.target === 'player') {
        if (!this.player?.ch.alive) continue;
        const d = att.ch.pos.distanceTo(this.player.ch.pos);
        const striking = att.hunter && this.director.phase === 'strike';
        if (d < h.range + 0.6 && samePlane(att.ch, this.player.ch)) {
          this.damagePlayer(h.damage * (striking ? CONFIG.HUNTER_DAMAGE : 0.3), att);
        }
        continue;
      }
      const tgt = h.target;
      if (!tgt || !tgt.ch?.alive || tgt.held) continue;
      const d = att.ch.pos.distanceTo(tgt.ch.pos);
      if (d > h.range + 0.6 || !samePlane(att.ch, tgt.ch)) continue;
      tgt.hp -= h.damage;
      tgt.ch.hitReaction();
      this.fx.emit(tgt.ch.pos.x, 1.4 + tgt.ch.altitude, tgt.ch.pos.z, { count: 6, color: 0xffffff, speed: 3.5, life: 0.3, size: 1.1 });
      if (tgt.hp <= 0) this.killBot(tgt, h.owner === 'clone' ? { byPlayer: true } : { byBot: att });
      else if (h.owner === 'clone' || Math.random() < 0.5) this.bam(tgt.ch.pos.x, 1.5 + tgt.ch.altitude, tgt.ch.pos.z, 'hit', 0.75);
    }
  }

  killBot(b, { byPlayer = false, byBot = null, cause = 'attack', silent = false } = {}) {
    if (!b.ch.alive) return;
    b.ch.alive = false;

    const px = b.ch.pos.x, py = b.ch.altitude + 1.2, pz = b.ch.pos.z;
    if (!silent) {
      const col = b.power.color;
      if (cause === 'shatter') {
        // the block bursts: shards, frost puff, a cold shockwave — nothing left behind
        this.fx.emit(px, py, pz, { count: 44, color: 0x9df2ff, speed: 11, life: 0.85, size: 2.0, gravity: 4 });
        this.fx.emit(px, py, pz, { count: 26, color: 0xffffff, speed: 5, life: 0.6, size: 2.6, gravity: -1 });
        this.fx.emit(px, py - 0.6, pz, { count: 18, color: 0x5fb9ff, speed: 7, life: 0.7, size: 1.4, gravity: 6 });
        this.fx.ring(px, pz, { color: 0x9df2ff, maxR: 4.5, dur: 0.5 });
        this.fx.addShake(0.25);
        SFX.shatter();
      }
      else if (cause === 'fire') { this.fx.emit(px, py, pz, { count: 30, color: 0xff7a3c, speed: 7, life: 0.7, size: 2.2, gravity: 3 }); }
      else if (cause === 'slam') { this.fx.emit(px, py, pz, { count: 30, color: TK_COLOR, speed: 9, life: 0.8, size: 1.9 }); SFX.slam(); }
      else { this.fx.emit(px, py, pz, { count: 24, color: col, speed: 8, life: 0.7, size: 1.8 }); }
      this.fx.ring(px, pz, { color: col, maxR: 3, dur: 0.4 });
      SFX.kill();
      const word = cause === 'fire' ? 'fire' : cause === 'shatter' ? 'shatter' : cause === 'slam' ? 'slam' : cause === 'squish' ? 'squish' : 'kill';
      this.bam(px, py + 0.4, pz, word, byPlayer ? 1 : 0.8);
    }

    if (byPlayer && this.player) {
      const bounty = this.director.bet * rand(CONFIG.KILL_VALUE_MIN, CONFIG.KILL_VALUE_MAX) *
        (1 + Math.min(2, b.score / 200));
      const gain = this.director.addWinnings(bounty);
      this.player.kills++;
      if (gain > 0) {
        const s = this.project(this._v1.set(px, py, pz));
        if (s) this.ui.popup(s.x, s.y, '+' + formatMoney(gain), true);
        this.ui.setTotal(this.director.total, this.director.mult, true);
      }
      SFX.coin();
      this.ui.killfeed(`<b>You</b> ⚡ eliminated <b>${b.ch.name}</b>`, true);
      if (this.player.absorbUntil > now() && b.power.id !== this.playerMainPower().id) {
        this.setPlayerPower(b.power);
        this.ui.announce(`ABSORBED ${b.power.name.toUpperCase()}`, { dur: 1800 });
        SFX.pickup();
      }
    } else if (byBot) {
      byBot.score += 2 + b.score * 0.25;
      if (Math.random() < 0.5 || b.ch.pos.distanceTo(this.camPos) < 70) {
        this.ui.killfeed(`<b>${byBot.ch.name}</b> ⚔ <b>${b.ch.name}</b>`);
      }
    }

    if (b.hunter) {
      // the director quietly hands the job to someone else
      const hi = this.hunters.indexOf(b);
      if (hi >= 0) this.hunters.splice(hi, 1);
      if (this.director.phase === 'strike') this.hunterRefill = Math.min(this.hunterRefill || 9, rand(1, 2));
    }

    const idx = this.bots.indexOf(b);
    if (idx >= 0) this.bots.splice(idx, 1);
    if (silent || cause === 'shatter') {
      // shattered heroes vanish with their ice block; no corpse to second-guess
      b.ch.dispose();
    } else {
      // fall over and lie there a moment before vanishing
      const attacker = byPlayer ? this.player?.ch : byBot?.ch;
      b.ch.die(this.deathKindFor(b.ch, attacker, cause));
      b.ch.vel.set(0, 0, 0);
      this.corpses.push({ ch: b.ch, ttl: 2.8 });
    }
    this.pendingRespawns.push(rand(1.5, 4));
  }

  // Which death clip fits: flung/burned/shattered bodies fly back; melee
  // from the front knocks you onto your back, from behind onto your face.
  deathKindFor(victim, attacker, cause) {
    if (cause === 'slam' || cause === 'fire' || cause === 'shatter') return 'fly';
    if (!attacker) return 'back';
    const dx = attacker.pos.x - victim.pos.x, dz = attacker.pos.z - victim.pos.z;
    const facing = dx * Math.sin(victim.yaw) + dz * Math.cos(victim.yaw);
    return facing >= 0 ? 'back' : 'forward';
  }

  updateCorpses(dt) {
    for (let i = this.corpses.length - 1; i >= 0; i--) {
      const c = this.corpses[i];
      c.ttl -= dt;
      c.ch.update(dt, this.time);
      if (c.ttl < 0.6) c.ch.setOpacity(Math.max(0, c.ttl / 0.6));
      if (c.ttl <= 0) { c.ch.dispose(); this.corpses.splice(i, 1); }
    }
  }

  // ================= ROUND FLOW =================

  startRound(power, bet) {
    if (bet > this.wallet) return;
    this.wallet -= bet;
    this.saveWallet();
    this.director.startRound(bet);

    if (this.player) this.player.ch.dispose();
    const ch = new Character(this.scene, { name: 'YOU', isPlayer: true, power });
    const p = this.world.randomOpenPos(this.focusPos, 5, 40);
    ch.pos.set(p.x, 0, p.z);
    this.player = {
      ch, powerMain: power, secondPower: null,
      switchesLeft: CONFIG.SWITCHES_PER_GAME,
      cds: {}, flying: false,
      speedUntil: 0, invisUntil: 0, disguiseUntil: 0, xrayUntil: 0,
      absorbUntil: 0, twoUntil: 0, enlargeUntil: 0, meteor: null, ambushUntil: 0,
      fireballArmed: false, flameUntil: 0,
      invulnUntil: now() + 2, adrenalineReady: now(),
      kills: 0, tokens: 0,
      prevAlt: 0,
      tk: null,
    };
    ch.hp = CONFIG.PLAYER_HP;

    this.state = 'playing';
    this.clearHunters();
    this.camYaw = ch.yaw + Math.PI;
    this.camPitch = 0.42;
    // start the chase camera parked behind the hero rather than inheriting
    // wherever the menu camera happened to be
    this.camTarget.set(p.x, 1.6, p.z);
    this.camPos.set(p.x - Math.sin(this.camYaw) * 8.5, 6.6, p.z - Math.cos(this.camYaw) * 8.5);
    this.ui.showHUD(this.controls.isTouch);
    this.ui.setSwitches(this.player.switchesLeft);
    this.ui.setTotal(0, 0);
    this.ui.setHP(1);
    this.controls.setEnabled(true);
    this.ui.announce(power.name.toUpperCase(), { dur: 1800, icon: power.id });
    this.fx.ring(p.x, p.z, { color: power.color, maxR: 6, dur: 0.7 });
    this.fx.emit(p.x, 1, p.z, { count: 30, color: power.color, speed: 7, life: 0.8 });
    SFX.whoosh();
  }

  playerMainPower() { return this.player.powerMain; }

  playerHidden() {
    if (!this.player) return false;
    return this.player.invisUntil > now() || !!this.player.ch.propMesh;
  }

  setPlayerPower(power) {
    this.player.powerMain = power;
    this.player.ch.setPower(power);
    if (power.id !== 'flight') this.player.flying = false;
    if (power.id !== 'telekinesis') this.cancelTelekinesis(true);
  }

  openSwitch() {
    if (this.state !== 'playing') return;
    if (this.ui.switchOpen) { this.ui.closeSwitch(); return; }
    this.ui.openSwitch(this.player.powerMain.id, this.player.switchesLeft);
  }

  doSwitch(power) {
    if (this.state !== 'playing' || !power) return;
    if (this.player.switchesLeft <= 0) return;
    this.player.switchesLeft--;
    this.ui.setSwitches(this.player.switchesLeft);
    this.setPlayerPower(power);
    const p = this.player.ch.pos;
    this.fx.ring(p.x, p.z, { color: power.color, maxR: 5, dur: 0.5 });
    this.fx.emit(p.x, 1.4, p.z, { count: 26, color: power.color, speed: 6, life: 0.7 });
    this.ui.announce(power.name.toUpperCase(), { dur: 1500, icon: power.id });
    SFX.morph();
  }

  // ================= PLAYER COMBAT =================

  playerAttack() {
    if (this.state !== 'playing' || !this.player?.ch.alive) return;
    const P = this.player, ch = P.ch;

    if (P.fireballArmed) { this.launchFireball(); return; }
    if (ch.attacking) return;   // one swing at a time — archetype speed sets the cadence
    if (ch.propMesh) this.revealDisguise(true);   // the "prop" springs to life

    // aim the swing where the camera looks
    ch.yaw = this.camYaw;
    const mv = ch.startAttack();
    SFX.whoosh();
    for (const at of mv.hits) {
      this.pendingHits.push({ at: this.time + at, owner: 'player', damage: mv.damage, range: mv.range * ch.curScale, arc: mv.arc });
    }
  }

  resolvePlayerHit(h) {
    const P = this.player;
    if (!P?.ch.alive) return;
    const ch = P.ch;
    const scale = ch.curScale;
    const fx = Math.sin(ch.yaw), fz = Math.cos(ch.yaw);
    let hitAny = false;

    for (const b of [...this.bots]) {
      if (!b.ch.alive || b.held) continue;
      const dx = b.ch.pos.x - ch.pos.x, dz = b.ch.pos.z - ch.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > h.range + 0.6) continue;
      if (!samePlane(b.ch, ch)) continue;
      const dot = (dx * fx + dz * fz) / (d || 1);
      if (d > 1.2 && dot < h.arc) continue;
      hitAny = true;

      const ambush = P.ambushUntil > now();   // struck from a prop disguise: one-shot
      const giant = scale > 1.5;
      if (b.ch.frozen) { this.killBot(b, { byPlayer: true, cause: 'shatter' }); continue; }
      if (ambush || giant) {
        this.killBot(b, { byPlayer: true });
        continue;
      }
      b.hp -= h.damage;
      b.ch.hitReaction();
      this.fx.emit(b.ch.pos.x, 1.4 + b.ch.altitude, b.ch.pos.z, { count: 8, color: 0xffffff, speed: 4, life: 0.3, size: 1.2 });
      this.fx.addShake(0.1 + h.damage * 0.002);
      SFX.punch();
      if (b.hp <= 0) this.killBot(b, { byPlayer: true });
      else {
        this.bam(b.ch.pos.x, 1.5 + b.ch.altitude, b.ch.pos.z, 'hit');
        const k = (0.6 + h.damage * 0.012) / (d || 1);
        b.ch.pos.x += dx * k; b.ch.pos.z += dz * k;
        if (Math.random() < 0.5) { b.target = 'player'; b.aggressive = true; }
      }
    }
    if (hitAny) this.fx.addShake(0.12);
    if (P.ambushUntil) P.ambushUntil = 0;
  }

  launchFireball() {
    const P = this.player, ch = P.ch;
    P.fireballArmed = false;
    SFX.fireball();
    const dir = this._v1.set(Math.sin(ch.yaw), 0, Math.cos(ch.yaw)).clone();
    const start = ch.pos.clone().setY(1.4 + ch.feetY);
    this.projectiles = this.projectiles || [];
    this.projectiles.push({ pos: start, dir, speed: 26, life: 2.2, r: 0 });
    this.fx.addShake(0.3);
  }

  updateProjectiles(dt) {
    if (!this.projectiles) return;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.life -= dt;
      pr.pos.addScaledVector(pr.dir, pr.speed * dt);
      this.fx.emit(pr.pos.x, pr.pos.y, pr.pos.z, { count: 6, color: 0xff7a3c, speed: 2.5, life: 0.45, size: 2.6, gravity: 2, jitter: 0.35 });
      this.fx.emit(pr.pos.x, pr.pos.y, pr.pos.z, { count: 2, color: 0xffd166, speed: 2, life: 0.3, size: 2 });
      const fromBot = pr.owner === 'bot';
      if (fromBot && pr.homing && this.player?.ch.alive) {
        // hunters' fireballs curve toward the player so a dodge isn't free
        const P = this.player.ch;
        const to = this._v1.set(P.pos.x, P.feetY + 1.1, P.pos.z).sub(pr.pos).normalize();
        pr.dir.lerp(to, Math.min(1, pr.homing * dt)).normalize();
      }
      const hitWall = this.world.isBlocked(pr.pos.x, pr.pos.z, 0.5) && this.world.buildingHeightAt(pr.pos.x, pr.pos.z) > pr.pos.y;
      let hitBot = false;
      if (!fromBot) {
        for (const b of this.bots) {
          if (b.ch.alive && !b.held && chestDist(b.ch, pr.pos) < 1.6) { hitBot = true; break; }
        }
      }
      const hitPlayer = fromBot && this.player?.ch.alive && chestDist(this.player.ch, pr.pos) < 1.8;
      if (pr.life <= 0 || hitWall || hitBot || hitPlayer) {
        SFX.explosion();
        this.fx.addShake(0.8);
        this.fx.emit(pr.pos.x, pr.pos.y, pr.pos.z, { count: 60, color: 0xff7a3c, speed: 14, life: 0.9, size: 3, gravity: -2 });
        this.fx.emit(pr.pos.x, pr.pos.y, pr.pos.z, { count: 30, color: 0xffd166, speed: 10, life: 0.7, size: 2.2 });
        this.fx.ring(pr.pos.x, pr.pos.z, { color: 0xff7a3c, maxR: 8, dur: 0.6 });
        this.bam(pr.pos.x, pr.pos.y + 0.5, pr.pos.z, 'boom', 1.2);
        for (const b of [...this.bots]) {
          if (b.ch.alive && b !== pr.bot && chestDist(b.ch, pr.pos) < 7.5) {
            this.killBot(b, fromBot ? { byBot: pr.bot, cause: 'fire' } : { byPlayer: true, cause: 'fire' });
          }
        }
        if (fromBot && this.player?.ch.alive) {
          const dP = chestDist(this.player.ch, pr.pos);
          if (dP < 6) this.damagePlayer(dP < 2.5 ? 999 : 60, pr.bot);
        }
        this.projectiles.splice(i, 1);
      }
    }
  }

  // ================= POWERS =================

  powerDown() {
    if (this.state !== 'playing' || !this.player?.ch.alive) return;
    const P = this.player;
    const powers = [P.powerMain];
    if (P.twoUntil > now() && P.secondPower) powers.push(P.secondPower);
    for (const pw of powers) {
      if (pw.id === 'telekinesis') this.startTelekinesis(pw);
      else this.activatePower(pw);
    }
  }

  powerUp() {
    if (!this.player) return;
    if (this.player.tk && this.player.tk.phase !== 'thrown') this.releaseTelekinesis();
  }

  activatePower(power) {
    const P = this.player, ch = P.ch;
    const t = now();
    if ((P.cds[power.id] || 0) > t) return;
    if (ch.propMesh && power.id !== 'shapeshift') this.revealDisguise();   // using a power blows the cover

    const px = ch.pos.x, pz = ch.pos.z, py = 1.2 + ch.altitude;
    let used = true;
    ch.cast(power.id);   // power-specific body language

    switch (power.id) {
      case 'flight': {
        P.flying = !P.flying;
        if (P.flying) {
          SFX.whoosh();
          this.fx.ring(px, pz, { color: 0x8ecbff, maxR: 4, dur: 0.5 });
          this.fx.emitDir(px, 0.5, pz, this._v1.set(0, -1, 0), { count: 22, color: 0x8ecbff, speed: 6, life: 0.6, cone: 0.6 });
        }
        break;
      }
      case 'speed': {
        P.speedUntil = t + 3;
        SFX.whoosh();
        this.fx.ring(px, pz, { color: 0xffe45c, maxR: 5, dur: 0.45 });
        break;
      }
      case 'invisibility': {
        P.invisUntil = t + 5;
        SFX.invis();
        this.fx.emit(px, py, pz, { count: 24, color: 0xbfc7de, speed: 4, life: 0.6, size: 1.6 });
        for (const b of this.bots) if (b.target === 'player' && !(b.hunter && this.director.phase === 'strike')) b.target = null;
        break;
      }
      case 'pyro': {
        P.flameUntil = t + 1.6;
        SFX.flame();
        break;
      }
      case 'cryo': {
        SFX.freeze();
        this.fx.ring(px, pz, { color: 0x9df2ff, maxR: 10, dur: 0.8 });
        this.fx.emit(px, 0.6, pz, { count: 70, color: 0x9df2ff, speed: 11, life: 0.9, size: 1.8, gravity: -1, spread: 1.2 });
        this.fx.addShake(0.3);
        for (const b of this.bots) {
          if (b.ch.alive && !b.held && b.ch.pos.distanceTo(ch.pos) < 10 && Math.abs(b.ch.altitude - ch.altitude) < 4) {
            b.ch.freeze(4.5);
            b.ch.vel.set(0, 0, 0);
          }
        }
        break;
      }
      case 'teleport': {
        const dirYaw = ch.yaw;
        let bx = Math.sin(dirYaw), bz = Math.cos(dirYaw);
        let dist = 14, nx = px, nz = pz;
        for (; dist >= 4; dist -= 2) {
          const tx = px + bx * dist, tz = pz + bz * dist;
          if (!this.world.isBlocked(tx, tz, 0.9)) { nx = tx; nz = tz; break; }
        }
        if (nx === px && nz === pz) { used = false; break; }
        SFX.teleport();
        this.fx.emit(px, py, pz, { count: 26, color: 0x7dffca, speed: 6, life: 0.5, size: 1.8 });
        ch.pos.set(nx, 0, nz);
        this.fx.emit(nx, py, nz, { count: 26, color: 0x7dffca, speed: 6, life: 0.5, size: 1.8 });
        this.fx.ring(nx, nz, { color: 0x7dffca, maxR: 4, dur: 0.45 });
        break;
      }
      case 'xray': {
        P.xrayUntil = t + 6;
        this.world.setXray(true);
        this.collectibles.setXray(true);
        SFX.xray();
        this.ui.flash();
        break;
      }
      case 'shapeshift': {
        // become scenery: nobody notices a bin until it moves
        if (ch.propMesh || P.flying || P.tk) { used = false; break; }
        P.disguiseUntil = t + 90;   // safety cap; moving ends it sooner
        SFX.morph();
        this.fx.emit(px, py, pz, { count: 30, color: 0xff9de2, speed: 5, life: 0.7, size: 1.8 });
        ch.setOpacity(1);
        const pitch = CONFIG.BLOCK + CONFIG.ROAD;
        const kind = pick(this.world.themeAt(Math.round(px / pitch), Math.round(pz / pitch)) === 'suburb'
          ? ['bin', 'mailbox', 'bush', 'hydrant', 'tree', 'bench']
          : ['bin', 'bench', 'hydrant', 'lamppost', 'car']);
        ch.disguiseAsProp(this.world.makePropMesh(kind));
        ch.vel.set(0, 0, 0);
        for (const b of this.bots) if (b.target === 'player') b.target = null;
        break;
      }
      case 'duplication': {
        SFX.dupe();
        for (let i = 0; i < 2; i++) {
          const cch = new Character(this.scene, { name: 'YOU', power: P.powerMain, paletteSeed: ch.paletteSeed });
          cch.pos.set(px + rand(-2, 2), 0, pz + rand(-2, 2));
          this.fx.emit(cch.pos.x, 1.2, cch.pos.z, { count: 20, color: 0xffb27d, speed: 5, life: 0.6 });
          this.clones.push({
            ch: cch, until: t + 10, attackCd: 0, target: null, repath: 0,
          });
        }
        this.fx.ring(px, pz, { color: 0xffb27d, maxR: 5, dur: 0.5 });
        break;
      }
    }

    if (used) P.cds[power.id] = t + power.cooldown;
  }

  // ---------------- telekinesis (hold to channel) ----------------

  startTelekinesis(power) {
    const P = this.player;
    const t = now();
    if (P.tk || (P.cds[power.id] || 0) > t) return;
    const ch = P.ch;
    if (ch.propMesh) this.revealDisguise();

    // nearest bot or liftable prop in range
    let kind = null, bot = null, prop = null, bestD = CONFIG.TK_RANGE;
    for (const b of this.bots) {
      if (!b.ch.alive || b.held || b.ch.frozen) continue;
      const d = b.ch.pos.distanceTo(ch.pos);
      if (d < bestD) { bot = b; bestD = d; kind = 'bot'; }
    }
    for (const { l, d } of this.world.liftablesNear(ch.pos, CONFIG.TK_RANGE)) {
      if (d < bestD) { prop = l; bot = null; bestD = d; kind = 'prop'; }
    }

    if (!kind) {
      // fizzle — nothing to grab
      this.fx.emit(ch.pos.x, 1.6, ch.pos.z, { count: 8, color: TK_COLOR, speed: 2, life: 0.4 });
      return;
    }

    P.tk = { kind, bot, prop, phase: 'lift', y: 0, auraT: 0 };
    ch.cast('telekinesis', true);   // held channel pose until the fling / release
    if (bot) { bot.held = true; bot.ch.vel.set(0, 0, 0); bot.ch.setHeld(true); }
    if (prop) { prop.busy = true; prop.baseRot = prop.mesh.rotation.y; }
    SFX.tk();
    const pos = kind === 'bot' ? bot.ch.pos : prop.mesh.position;
    this.fx.ring(pos.x, pos.z, { color: TK_COLOR, maxR: 3.5, dur: 0.5 });
  }

  tkTargetPos(tk) {
    if (tk.kind === 'bot') {
      const c = tk.bot.ch;
      return { x: c.pos.x, y: c.altitude, z: c.pos.z };
    }
    const m = tk.prop.mesh.position;
    return { x: m.x, y: m.y, z: m.z };
  }

  tkSetPos(tk, x, y, z) {
    if (tk.kind === 'bot') {
      tk.bot.ch.pos.x = x; tk.bot.ch.pos.z = z;
      tk.bot.ch.altitude = y;
    } else {
      tk.prop.mesh.position.set(x, y, z);
    }
  }

  updateTelekinesis(dt) {
    const P = this.player;
    const tk = P?.tk;
    if (!tk) return;

    // target died / vanished mid-channel
    if ((tk.kind === 'bot' && !tk.bot.ch.alive) || (tk.kind === 'prop' && !tk.prop.alive)) {
      P.tk = null;
      P.cds['telekinesis'] = now() + 1.5;
      return;
    }

    const ch = P.ch;
    const pos = this.tkTargetPos(tk);

    // purple channel aura
    tk.auraT += dt;
    this.fx.emit(pos.x, pos.y + 1.2, pos.z, { count: 2, color: TK_COLOR, speed: 1.6, life: 0.45, size: 1.5, gravity: 2, jitter: 0.7 });
    if (tk.auraT > 0.3) {
      tk.auraT = 0;
      this.fx.ring(pos.x, pos.z, { color: TK_COLOR, maxR: 2.2, dur: 0.4 });
    }

    // spin the victim slowly while held
    if (tk.kind === 'bot') tk.bot.ch.yaw += dt * 5;
    else tk.prop.mesh.rotation.y = tk.prop.baseRot + (tk.prop.mesh.rotation.y - tk.prop.baseRot) + dt * 3;

    const LIFT_H = 3.0;
    if (tk.phase === 'lift') {
      const ny = Math.min(LIFT_H, pos.y + dt * 6);
      this.tkSetPos(tk, pos.x, ny, pos.z);
      if (ny >= LIFT_H - 0.01) tk.phase = 'pull';
    } else if (tk.phase === 'pull') {
      const dx = ch.pos.x - pos.x, dz = ch.pos.z - pos.z;
      const d = Math.hypot(dx, dz);
      const bobY = LIFT_H + Math.sin(this.time * 5) * 0.25;
      if (d > 3.6) {
        const step = CONFIG.TK_PULL_SPEED * dt;
        this.tkSetPos(tk, pos.x + (dx / d) * step, bobY, pos.z + (dz / d) * step);
      } else {
        // in range — hurl it where the player is aiming (camera direction)
        const aim = this.camYaw;
        ch.yaw = aim;
        const vel = new THREE.Vector3(Math.sin(aim) * CONFIG.TK_THROW_SPEED, 1.5, Math.cos(aim) * CONFIG.TK_THROW_SPEED);
        this.thrown.push({ kind: tk.kind, bot: tk.bot, prop: tk.prop, vel, mode: 'throw', spin: rand(3, 7) });
        P.cds['telekinesis'] = now() + this.playerMainPower().cooldown;
        P.tk = null;
        ch.stopCast();
        ch.startAttack();   // hurl with a throw motion
        SFX.whoosh();
        this.fx.addShake(0.35);
        this.fx.emit(pos.x, bobY + 1, pos.z, { count: 20, color: TK_COLOR, speed: 6, life: 0.5, size: 1.8 });
      }
    }
  }

  releaseTelekinesis() {
    const P = this.player;
    const tk = P?.tk;
    if (!tk) return;
    // dropped early: the grip just cuts out and gravity takes over
    this.thrown.push({ kind: tk.kind, bot: tk.bot, prop: tk.prop, vel: new THREE.Vector3(0, 0, 0), mode: 'drop', spin: 0 });
    P.cds['telekinesis'] = now() + 1.5;
    P.tk = null;
    P.ch.stopCast();
    SFX.invis();
  }

  cancelTelekinesis(silent = false) {
    const P = this.player;
    if (!P?.tk) return;
    if (silent) {
      const tk = P.tk;
      if (tk.kind === 'bot' && tk.bot.ch.alive) { tk.bot.held = false; tk.bot.ch.altitude = 0; tk.bot.ch.setHeld(false); }
      if (tk.kind === 'prop' && tk.prop.alive) { tk.prop.busy = false; tk.prop.mesh.position.y = tk.prop.baseY || 0; }
      P.tk = null;
      P.ch.stopCast();
    } else {
      this.releaseTelekinesis();
    }
  }

  updateThrown(dt) {
    for (let i = this.thrown.length - 1; i >= 0; i--) {
      const th = this.thrown[i];
      const alive = th.kind === 'bot' ? th.bot.ch.alive : th.prop.alive;
      if (!alive) { this.thrown.splice(i, 1); continue; }

      const pos = th.kind === 'bot'
        ? { x: th.bot.ch.pos.x, y: th.bot.ch.altitude, z: th.bot.ch.pos.z }
        : th.prop.mesh.position;

      th.vel.y -= 26 * dt;
      const nx = pos.x + th.vel.x * dt;
      const ny = pos.y + th.vel.y * dt;
      const nz = pos.z + th.vel.z * dt;
      if (th.kind === 'bot') {
        th.bot.ch.pos.x = nx; th.bot.ch.pos.z = nz;
        th.bot.ch.altitude = Math.max(0, ny);
        th.bot.ch.yaw += th.spin * dt;
      } else {
        th.prop.mesh.position.set(nx, Math.max(0, ny), nz);
        th.prop.mesh.rotation.x += th.spin * dt * 0.5;
      }

      if (th.mode === 'throw') {
        // trailing sparkle
        this.fx.emit(nx, Math.max(0.5, ny) + 1, nz, { count: 2, color: TK_COLOR, speed: 1.5, life: 0.35, size: 1.4 });
        // mow down anyone in the flight path
        for (const other of [...this.bots]) {
          if (!other.ch.alive || other.held) continue;
          if (th.kind === 'bot' && other === th.bot) continue;
          const dd = Math.hypot(other.ch.pos.x - nx, other.ch.pos.z - nz);
          const hitR = th.kind === 'prop' ? 2.3 : 1.9;
          if (dd < hitR && Math.abs(other.ch.altitude - ny) < 3.2) {
            this.killBot(other, { byPlayer: true, cause: 'slam' });
          }
        }
      }

      const hitWall = this.world.isBlocked(nx, nz, 0.4) && this.world.buildingHeightAt(nx, nz) > ny;
      const hitGround = ny <= 0.15;

      if (hitWall || hitGround) {
        if (th.mode === 'throw') {
          this.fx.ring(nx, nz, { color: TK_COLOR, maxR: 4.5, dur: 0.5 });
          this.fx.addShake(0.4);
          if (th.kind === 'bot') {
            th.bot.held = false;
            this.killBot(th.bot, { byPlayer: true, cause: 'slam' });
          } else {
            SFX.slam();
            this.fx.emit(nx, Math.max(0.5, ny), nz, { count: 30, color: 0x9aa0a8, speed: 8, life: 0.7, size: 1.8 });
            this.world.removeLiftable(th.prop);
          }
        } else {
          // soft drop: it just lands where the grip failed
          if (th.kind === 'bot') {
            th.bot.held = false;
            th.bot.ch.altitude = 0;
            th.bot.ch.setHeld(false);
            th.bot.repath = 1.5;
            this.fx.emit(nx, 0.6, nz, { count: 8, color: 0xffffff, speed: 3, life: 0.3, size: 1.1 });
          } else {
            th.prop.mesh.position.y = this.world.groundHeightAt(nx, nz);
            th.prop.mesh.rotation.x = 0;
            th.prop.busy = false;
          }
        }
        this.thrown.splice(i, 1);
      }
    }
  }

  revealDisguise(ambush = false) {
    const P = this.player, ch = P.ch;
    if (!ch.propMesh && !ch.disguise) return;
    P.disguiseUntil = 0;
    ch.undisguise();
    this.fx.emit(ch.pos.x, 1.4, ch.pos.z, { count: 18, color: 0xff9de2, speed: 5, life: 0.5 });
    SFX.morph();
    // bursting out of a disguise at someone drops them in one blow
    if (ambush) P.ambushUntil = now() + 1.2;
  }

  superheroLanding() {
    const P = this.player, ch = P.ch;
    ch.landing();
    SFX.landing();
    this.fx.addShake(1.1);
    this.ui.flash();
    this.fx.ring(ch.pos.x, ch.pos.z, { color: 0xffd166, maxR: 9, dur: 0.7 });
    this.fx.ring(ch.pos.x, ch.pos.z, { color: 0xffffff, maxR: 5, dur: 0.5 });
    this.fx.emit(ch.pos.x, 0.6, ch.pos.z, { count: 60, color: 0xffd166, speed: 12, life: 0.8, size: 2.2 });
    this.bam(ch.pos.x, 1.6, ch.pos.z, 'boom', 1.3);
    for (const b of [...this.bots]) {
      if (b.ch.alive && b.ch.pos.distanceTo(ch.pos) < CONFIG.LANDING_RADIUS && samePlane(b.ch, ch)) this.killBot(b, { byPlayer: true });
    }
  }

  // ================= PICKUPS =================

  applyItem(it) {
    const P = this.player, t = now();
    SFX.pickup();
    const label = `${it.def.emblem} ${it.def.name.toUpperCase()}`;
    this.ui.announce(label, { dur: 1800 });
    if (it.kind === 'pill') {
      if (it.def.id === 'absorb') P.absorbUntil = t + it.def.duration;
      else if (it.def.id === 'twopower') {
        P.twoUntil = t + it.def.duration;
        const others = POWERS.filter((p) => p.id !== P.powerMain.id);
        P.secondPower = pick(others);
        this.ui.announce(`TWO POWERS: ${P.secondPower.name.toUpperCase()}`, { dur: 2200, icon: P.secondPower.id });
      } else if (it.def.id === 'extraswitch') {
        P.switchesLeft++;
        this.ui.setSwitches(P.switchesLeft);
      }
    } else {
      SFX.potion();
      if (it.def.id === 'enlarge') {
        P.enlargeUntil = t + it.def.duration;
        P.ch.scaleTarget = 2.3;
        SFX.grow();
        this.fx.addShake(0.4);
      } else if (it.def.id === 'fireball') {
        P.fireballArmed = true;
        this.ui.announce('☄ FIREBALL ARMED — ATTACK TO LAUNCH', { dur: 2600 });
      } else if (it.def.id === 'landing') {
        // straight up, a beat to steer, then down like a meteor onto whatever you aim at
        P.meteor = { phase: 'up', t: 0, ringT: 0 };
        this.cancelTelekinesis(true);
        this.ui.announce('SUPERHERO LANDING — STEER YOUR DROP', { dur: 2200 });
        SFX.whoosh();
        this.fx.ring(P.ch.pos.x, P.ch.pos.z, { color: 0xffd166, maxR: 4, dur: 0.4 });
        this.fx.emitDir(P.ch.pos.x, 0.5, P.ch.pos.z, this._v1.set(0, -1, 0), { count: 26, color: 0xffd166, speed: 7, life: 0.6, cone: 0.6 });
      }
    }
  }

  // ================= DAMAGE / DEATH =================

  damagePlayer(amount, byBot) {
    const P = this.player;
    if (!P || !P.ch.alive || this.state !== 'playing') return;
    const t = now();
    if (t < P.invulnUntil) return;

    P.ch.hp -= amount;
    P.ch.hitReaction();
    SFX.hurt();
    this.fx.addShake(0.3);
    this.fx.emit(P.ch.pos.x, 1.4 + P.ch.altitude, P.ch.pos.z, { count: 8, color: 0xff5470, speed: 4, life: 0.4 });
    if (P.ch.propMesh) this.revealDisguise();   // a bin that says "oof" is no longer a bin
    if (P.ch.hp > 0) this.bam(P.ch.pos.x, 1.6 + P.ch.altitude, P.ch.pos.z, 'hurt');

    if (P.ch.hp <= 0) {
      if (byBot?.hunter && this.director.phase === 'strike') {
        this.bam(P.ch.pos.x, 1.6 + P.ch.altitude, P.ch.pos.z, 'kill', 1.4);
        this.playerDeath(byBot);
        return;
      }
      // The house never lets a random mob end your run: you always slip away.
      P.ch.hp = 1;
      if (t > P.adrenalineReady) {
        P.adrenalineReady = t + CONFIG.ADRENALINE_COOLDOWN;
        P.invulnUntil = t + 1.6;
        P.speedUntil = Math.max(P.speedUntil, t + 1.6);
        this.slowmoUntil = performance.now() / 1000 + 0.7;
        this.timescale = 0.35;
        this.ui.announce('ADRENALINE RUSH', { dur: 1400 });
        this.ui.flash();
        SFX.whoosh();
        if (byBot) { byBot.target = null; byBot.repath = 4; }
      } else {
        P.invulnUntil = t + 0.9;
      }
    }
  }

  // ================= THE HUNT =================
  // The director never announces itself. As the total nears the target a
  // couple of nearby bots are told to hang around the player; when it lands,
  // they attack like any aggressive bot would — only tougher, faster, and
  // not fooled by disguises. If the player keeps slipping away the pressure
  // escalates (fireballs, enlarged reinforcements, finally blinking in).

  // A spot near the player but out of the camera's view.
  hiddenSpotNear(p, minR, maxR) {
    for (let i = 0; i < 8; i++) {
      const ang = this.camYaw + Math.PI + rand(-1.3, 1.3);   // behind the camera
      const r = rand(minR, maxR);
      const x = p.x - Math.sin(ang) * r, z = p.z - Math.cos(ang) * r;
      if (!this.world.isBlocked(x, z, 0.9)) return { x, z };
    }
    return this.world.randomOpenPos(p, minR, maxR);
  }

  assignHunters(n) {
    if (!this.player) return;
    const pp = this.player.ch.pos;
    const counter = counterPowerFor(this.player.powerMain.id);
    const cands = this.bots
      .filter((b) => b.ch.alive && !b.hunter && !b.held)
      .map((b) => ({ b, d: b.ch.pos.distanceTo(pp) - (b.power.id === counter.id ? 12 : 0) }))
      .filter((c) => c.d < 70)
      .sort((a, b) => a.d - b.d);
    while (this.hunters.length < n) {
      let b = cands.shift()?.b;
      if (!b) {
        const s = this.hiddenSpotNear(pp, 22, 40);
        b = this.spawnBot({ pos: s });
        if (Math.random() < 0.6) { b.power = counter; b.ch.setPower(counter); }
      }
      b.hunter = true;
      b.aggressive = true;
      b.stalkCd = 0;
      b.farT = 0;
      b.target = null;
      this.hunters.push(b);
    }
  }

  beginStrike() {
    this.strikeT = 0;
    this.hunterFireCd = 1.5;
    this.assignHunters(CONFIG.HUNTER_COUNT);
    for (const b of this.hunters) this.armHunter(b);
  }

  armHunter(b) {
    b.hp = Math.max(b.hp, CONFIG.HUNTER_HP);
    b.target = 'player';
    b.attackCd = Math.min(b.attackCd, 0.3);
    if (this.strikeT > CONFIG.HUNTER_GIANT_AT) b.ch.scaleTarget = 2.0;
  }

  relocateHunter(b, blink) {
    const p = this.player.ch.pos;
    const s = blink ? this.world.randomOpenPos(p, 3, 6) : this.hiddenSpotNear(p, 14, 22);
    if (blink) {
      this.fx.emit(b.ch.pos.x, 1.2, b.ch.pos.z, { count: 14, color: 0x7dffca, speed: 5, life: 0.4 });
      SFX.teleport();
    }
    b.ch.pos.set(s.x, 0, s.z);
    b.ch.altitude = this.player.ch.altitude > 2 ? this.player.ch.altitude : 0;
    if (blink) this.fx.emit(s.x, 1.2, s.z, { count: 14, color: 0x7dffca, speed: 5, life: 0.4 });
  }

  updateHunt(dt) {
    if (this.director.phase !== 'strike' || !this.player?.ch.alive) return;
    this.strikeT += dt;
    const P = this.player, pp = P.ch.pos;

    // keep the pressure on: replace fallen hunters, add muscle over time
    this.hunters = this.hunters.filter((b) => b.ch.alive);
    const want = CONFIG.HUNTER_COUNT + (this.strikeT > CONFIG.HUNTER_GIANT_AT ? 2 : 0);
    if (this.hunters.length < want) {
      this.hunterRefill -= dt;
      if (this.hunterRefill <= 0) {
        this.hunterRefill = 1.5;
        const before = this.hunters.length;
        this.assignHunters(Math.min(want, before + 1));
        for (const b of this.hunters.slice(before)) this.armHunter(b);
      }
    }
    if (this.strikeT > CONFIG.HUNTER_GIANT_AT) {
      for (const b of this.hunters) if (b.ch.scaleTarget < 2) b.ch.scaleTarget = 2.0;
    }

    // ranged pressure once the chase drags on
    if (this.strikeT > CONFIG.HUNTER_FIREBALL_AT) {
      this.hunterFireCd -= dt;
      if (this.hunterFireCd <= 0) {
        const shooter = this.hunters.find((b) => {
          const d = b.ch.pos.distanceTo(pp);
          return d > 4 && d < 30 && !b.ch.attacking;
        });
        if (shooter) {
          this.hunterFireCd = rand(2.2, 3.5);
          this.botFireball(shooter);
        }
      }
    }
  }

  botFireball(b) {
    const P = this.player;
    const from = b.ch.pos.clone().setY(1.4 + b.ch.feetY);
    const to = P.ch.pos.clone().setY(1.2 + P.ch.feetY);
    const dir = to.sub(from).normalize();
    b.ch.yaw = Math.atan2(dir.x, dir.z);
    b.ch.cast('pyro');
    SFX.fireball();
    this.projectiles = this.projectiles || [];
    this.projectiles.push({ pos: from, dir, speed: 22, life: 2.4, r: 0, owner: 'bot', bot: b, homing: 2.2 });
  }

  clearHunters() {
    for (const b of this.bots) {
      if (b.hunter) { b.hunter = false; b.hp = Math.min(b.hp, 100); b.ch.scaleTarget = 1; b.target = null; }
    }
    this.hunters = [];
    this.strikeT = 0;
    this.hunterRefill = 0;
  }

  playerDeath(killer) {
    const P = this.player;
    this.cancelTelekinesis(true);
    P.ch.alive = false;
    P.ch.vel.set(0, 0, 0);
    P.ch.flying = false;
    P.meteor = null; P.ch.dive = false;
    P.ch.die(this.deathKindFor(P.ch, killer?.ch, 'attack'));
    this.state = 'dying';
    this.deathT = 0;
    this.deathKiller = killer;
    this.controls.setEnabled(false);
    this.ui.closeSwitch();
    this.timescale = 0.3;
    this.slowmoUntil = performance.now() / 1000 + 2.0;
    SFX.death();
    this.fx.addShake(1.2);
    this.ui.flash();
    const c = P.ch.pos;
    this.fx.emit(c.x, 1.4 + P.ch.altitude, c.z, { count: 50, color: killer ? killer.power.color : 0xff5470, speed: 9, life: 1.1, size: 2 });
    this.fx.ring(c.x, c.z, { color: 0xff2038, maxR: 7, dur: 0.8 });
    this.world.setXray(false);
    this.collectibles.setXray(false);
  }

  finishRound() {
    const payout = this.director.endRound();
    this.wallet += payout;
    this.saveWallet();
    const win = payout >= this.director.bet;
    const rows = this.leaderboardRows();
    const place = rows.find((r) => r.me)?.rank ?? this.bots.length + 1;
    if (win) SFX.cashout();
    this.ui.showResults({
      payout,
      mult: this.director.mult,
      kills: this.player.kills,
      tokens: this.player.tokens,
      place,
      killerName: this.deathKiller?.ch.name,
      killerPower: this.deathKiller?.power.name,
      win,
    });
    this.state = 'results';
  }

  backToMenu() {
    this.cancelTelekinesis(true);
    for (const th of this.thrown) {
      if (th.kind === 'bot' && th.bot.ch.alive) { th.bot.held = false; th.bot.ch.altitude = 0; th.bot.ch.setHeld(false); }
      if (th.kind === 'prop' && th.prop.alive) { th.prop.busy = false; th.prop.mesh.position.y = th.prop.baseY || 0; }
    }
    this.thrown = [];
    this.pendingHits = [];
    for (const c of this.corpses) c.ch.dispose();
    this.corpses = [];
    if (this.player) { this.player.ch.dispose(); this.player = null; }
    this.clearHunters();
    for (const c of this.clones) c.ch.dispose();
    this.clones = [];
    this.state = 'menu';
    this.attractBot = null;
    this.attractTimer = 0;
    this.ui.showMenu(this.wallet);
  }

  // Height a flyer needs to clear whatever is under it and just ahead of it
  // (0 when the way is open). dx/dz is the horizontal heading, any length.
  flightCeiling(ch, dx, dz) {
    const d = Math.hypot(dx, dz);
    const ux = d > 0.05 ? dx / d : Math.sin(ch.yaw), uz = d > 0.05 ? dz / d : Math.cos(ch.yaw);
    const px = -uz, pz = ux;   // sideways, to sample a little wider than a point
    let h = 0;
    const steps = d > 0.05 ? [0, 0.25, 0.5, 0.75, 1] : [0, 0.2];
    for (const s of steps) {
      const ax = ch.pos.x + ux * s * CONFIG.FLIGHT_LOOKAHEAD, az = ch.pos.z + uz * s * CONFIG.FLIGHT_LOOKAHEAD;
      for (const side of [-0.9, 0, 0.9]) {
        h = Math.max(h, this.world.buildingHeightAt(ax + px * side, az + pz * side));
      }
    }
    return h > 0 ? h + CONFIG.FLIGHT_CLEARANCE : 0;
  }

  // ================= PLAYER UPDATE =================

  updatePlayer(dt, input) {
    const P = this.player, ch = P.ch;
    if (!ch.alive) return;
    const t = now();

    // camera-relative movement: W/S along the view axis, joystick strafes
    const speedBoost = (P.speedUntil > t ? 2.4 : 1) * (P.enlargeUntil > t ? 1.2 : 1);
    const flySpeed = P.meteor ? 1.6 : P.flying ? 1.35 : 1;
    const spd = CONFIG.PLAYER_SPEED * speedBoost * flySpeed;
    const sin = Math.sin(this.camYaw), cos = Math.cos(this.camYaw);
    const mx = -input.moveX * cos + input.moveZ * sin;
    const mz = input.moveX * sin + input.moveZ * cos;
    const moving = Math.hypot(mx, mz) > 0.05;

    // a disguised prop that moves is just a hero again
    if (ch.propMesh && moving) this.revealDisguise();

    ch.vel.set(mx * spd, 0, mz * spd);
    ch.pos.x += ch.vel.x * dt;
    ch.pos.z += ch.vel.z * dt;
    // backpedalling keeps you facing the camera and plays the backward clips
    const backward = input.moveZ < -0.2 && Math.abs(input.moveX) < 0.5;
    ch.backward = backward && moving;
    if (moving) {
      const targetYaw = backward ? this.camYaw : Math.atan2(mx, mz);
      let dy = targetYaw - ch.yaw;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      ch.yaw += dy * Math.min(1, dt * 10);
    } else if (input.turn) {
      // turning in place rotates the hero with the camera
      let dy = this.camYaw - ch.yaw;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      ch.yaw += dy * Math.min(1, dt * 6);
    }

    // altitude / flight
    P.prevAlt = ch.altitude;
    // flying pose while flight is on, and while gliding back down after it ends
    ch.flying = (P.flying && P.powerMain.id === 'flight') || (ch.flying && ch.altitude > 0.4);
    ch.bank += ((input.turn * 0.9 + input.look * 6) - ch.bank) * Math.min(1, dt * 4);
    if (P.meteor) {
      const m = P.meteor;
      m.t += dt;
      ch.flying = true;   // float pose on the way up, prone dive on the way down
      if (m.phase === 'up') {
        ch.altitude = Math.min(CONFIG.METEOR_APEX, ch.altitude + dt * CONFIG.METEOR_APEX / CONFIG.METEOR_UP_TIME);
        if (m.t >= CONFIG.METEOR_UP_TIME) { m.phase = 'hang'; m.t = 0; }
      } else if (m.phase === 'hang') {
        ch.altitude = CONFIG.METEOR_APEX + Math.sin(m.t * 6) * 0.15;
        if (m.t >= CONFIG.METEOR_HANG_TIME) { m.phase = 'down'; m.t = 0; ch.dive = true; SFX.whoosh(); }
      } else {
        ch.altitude -= dt * CONFIG.METEOR_FALL_SPEED;
        this.fx.emit(ch.pos.x, ch.altitude + 1, ch.pos.z, { count: 4, color: 0xffd166, speed: 2.5, life: 0.45, size: 2.2, gravity: -1 });
        this.fx.emit(ch.pos.x, ch.altitude + 1, ch.pos.z, { count: 2, color: 0xff7a3c, speed: 2, life: 0.4, size: 1.8 });
        if (ch.altitude <= 0) {
          ch.altitude = 0;
          ch.dive = false;
          P.meteor = null;
          this.superheroLanding();
        }
      }
      // pulse the impact zone on the ground under you while you steer
      if (P.meteor && m.phase !== 'up') {
        m.ringT -= dt;
        if (m.ringT <= 0) { m.ringT = 0.22; this.fx.ring(ch.pos.x, ch.pos.z, { color: 0xffd166, maxR: CONFIG.LANDING_RADIUS, dur: 0.3 }); }
      }
    } else if (P.flying && P.powerMain.id === 'flight') {
      // cruise at the flight deck, but climb over anything taller in the way and
      // settle back down once it's behind you
      const want = Math.max(CONFIG.FLIGHT_DECK, this.flightCeiling(ch, mx, mz));
      if (ch.altitude < want) ch.altitude = Math.min(want, ch.altitude + dt * CONFIG.FLIGHT_CLIMB);
      else ch.altitude = Math.max(want, ch.altitude - dt * CONFIG.FLIGHT_DESCEND);
      if (Math.random() < 0.6) {
        this.fx.emitDir(ch.pos.x, ch.altitude + 0.4, ch.pos.z, this._v1.set(-mx, 0, -mz),
          { count: 1, color: 0x8ecbff, speed: 4, life: 0.4, size: 1.4, cone: 0.3 });
      }
    } else if (ch.altitude > 0) {
      ch.altitude = Math.max(0, ch.altitude - dt * 16);
      if (ch.altitude === 0 && P.prevAlt > 3.5) {
        this.fx.ring(ch.pos.x, ch.pos.z, { color: 0xffffff, maxR: 3, dur: 0.4 }); this.fx.addShake(0.3); SFX.punch();
      }
    }
    this.world.resolve(ch.pos, 0.6 * ch.curScale, ch.altitude);

    // speed streaks
    if (P.speedUntil > t && moving) {
      this.fx.emitDir(ch.pos.x, 0.9, ch.pos.z, this._v1.set(-mx, 0.05, -mz),
        { count: 2, color: 0xffe45c, speed: 6, life: 0.35, size: 1.5, cone: 0.15 });
    }

    // flame cone (pyrokinesis channel)
    if (P.flameUntil > t) {
      const fxd = this._v1.set(Math.sin(ch.yaw), 0.05, Math.cos(ch.yaw));
      this.fx.emitDir(ch.pos.x + fxd.x, 1.3 + ch.altitude, ch.pos.z + fxd.z, fxd,
        { count: 10, color: 0xff7a3c, speed: 15, life: 0.5, size: 2.6, cone: 0.22, gravity: 2 });
      this.fx.emitDir(ch.pos.x + fxd.x, 1.3 + ch.altitude, ch.pos.z + fxd.z, fxd,
        { count: 3, color: 0xffd166, speed: 13, life: 0.35, size: 2, cone: 0.18 });
      for (const b of [...this.bots]) {
        if (!b.ch.alive || b.held) continue;
        const dx = b.ch.pos.x - ch.pos.x, dz = b.ch.pos.z - ch.pos.z;
        const d = Math.hypot(dx, dz);
        if (d < 8.5 && (dx * fxd.x + dz * fxd.z) / (d || 1) > 0.72 && samePlane(b.ch, ch)) {
          this.killBot(b, { byPlayer: true, cause: 'fire' });
        }
      }
    }

    // timed effects wearing off
    ch.setOpacity(P.invisUntil > t ? 0.15 : 1);
    if (P.disguiseUntil > 0 && P.disguiseUntil < t && (ch.disguise || ch.propMesh)) this.revealDisguise();
    if (P.xrayUntil > 0 && P.xrayUntil < t) {
      P.xrayUntil = 0;
      this.world.setXray(false);
      this.collectibles.setXray(false);
    }
    if (P.enlargeUntil > 0 && P.enlargeUntil < t) { P.enlargeUntil = 0; ch.scaleTarget = 1; }
    if (P.twoUntil > 0 && P.twoUntil < t) { P.twoUntil = 0; P.secondPower = null; }

    // hp regen
    ch.hp = Math.min(ch.maxHp, ch.hp + CONFIG.HP_REGEN * dt);

    // pickups
    const reach = 1.7 * ch.curScale;
    const got = this.collectibles.collectTokens(ch.pos.x, ch.pos.z, reach);
    if (got > 0) {
      P.tokens += got;
      const gain = this.director.addWinnings(got * this.director.bet * CONFIG.TOKEN_VALUE);
      SFX.coin();
      if (gain > 0) {
        const s = this.project(this._v1.set(ch.pos.x, 1.5, ch.pos.z));
        if (s) this.ui.popup(s.x, s.y, '+' + formatMoney(gain));
        this.ui.setTotal(this.director.total, this.director.mult);
      }
    }
    const item = this.collectibles.collectItem(ch.pos.x, ch.pos.z, reach + 0.4);
    if (item) this.applyItem(item);

    // giant crush: walking over bots while enlarged
    if (ch.curScale > 1.5) {
      for (const b of [...this.bots]) {
        if (b.ch.alive && !b.held && b.ch.curScale < 1.5 && b.ch.pos.distanceTo(ch.pos) < 1.9 * ch.curScale && samePlane(b.ch, ch)) {
          this.killBot(b, { byPlayer: true, cause: 'squish' });
          this.fx.addShake(0.3);
        }
      }
    }

    ch.update(dt, this.time);
    if (ch.rootMoved) this.world.resolve(ch.pos, 0.6 * ch.curScale, ch.altitude);
  }

  updateClones(dt) {
    const t = now();
    for (let i = this.clones.length - 1; i >= 0; i--) {
      const c = this.clones[i];
      if (t > c.until) {
        this.fx.emit(c.ch.pos.x, 1.2, c.ch.pos.z, { count: 16, color: 0xffb27d, speed: 5, life: 0.5 });
        c.ch.dispose();
        this.clones.splice(i, 1);
        continue;
      }
      c.repath -= dt;
      c.attackCd -= dt;
      if (c.repath <= 0 || !c.target?.ch.alive) {
        c.repath = 1;
        let best = null, bestD = 26;
        for (const b of this.bots) {
          if (!b.ch.alive || b.held) continue;
          const d = c.ch.pos.distanceTo(b.ch.pos);
          if (d < bestD) { best = b; bestD = d; }
        }
        c.target = best;
      }
      if (c.target) {
        const dx = c.target.ch.pos.x - c.ch.pos.x, dz = c.target.ch.pos.z - c.ch.pos.z;
        const d = Math.hypot(dx, dz);
        if (d > 1.8) {
          c.ch.vel.set((dx / d) * 8.5, 0, (dz / d) * 8.5);
          c.ch.pos.x += c.ch.vel.x * dt;
          c.ch.pos.z += c.ch.vel.z * dt;
          c.ch.yaw = Math.atan2(dx, dz);
          this.world.resolve(c.ch.pos, 0.55, 0);
        } else if (c.attackCd <= 0 && !c.ch.attacking) {
          const mv = c.ch.startAttack();
          c.attackCd = mv.duration + 0.3;
          for (const at of mv.hits) {
            this.pendingHits.push({ at: this.time + at, owner: 'clone', clone: c, target: c.target, damage: mv.damage * 0.8, range: mv.range });
          }
        }
      } else {
        c.ch.vel.set(0, 0, 0);
      }
      c.ch.update(dt, this.time);
      if (c.ch.rootMoved) this.world.resolve(c.ch.pos, 0.55, 0);
    }
  }

  // ================= CAMERA =================

  updateCameraPlay(dt, input) {
    const P = this.player, ch = P.ch;
    this.camYaw -= input.look + input.turn * 2.6 * dt;
    this.camPitch = clamp(this.camPitch + input.pitch, 0.12, 1.1);
    if (!Number.isFinite(this.camYaw)) this.camYaw = ch.yaw + Math.PI;
    if (!Number.isFinite(this.camPitch)) this.camPitch = 0.42;
    const scale = ch.curScale;
    // airborne: pull in tighter and lower behind the hero, with a slow drift and
    // a lean into turns so the view feels like it's floating along too
    const air = clamp((ch.altitude - 0.6) / 2.5, 0, 1);
    const flySpeed = Math.hypot(ch.vel.x, ch.vel.z);
    const dist = (8.5 - 2.9 * air + Math.min(1.2, flySpeed * 0.06) * air) * (0.75 + scale * 0.35);
    const h = (3.2 + Math.sin(this.camPitch) * 6) * (0.7 + scale * 0.3) * (1 - 0.45 * air);
    const swayX = Math.sin(this.time * 0.8) * 0.45 * air, swayY = Math.sin(this.time * 1.25 + 1.3) * 0.3 * air;

    const tx = ch.pos.x - Math.sin(this.camYaw) * dist + Math.cos(this.camYaw) * swayX;
    const tz = ch.pos.z - Math.cos(this.camYaw) * dist - Math.sin(this.camYaw) * swayX;
    const ty = ch.altitude + h + swayY;

    // occlusion: march from the player's head toward the desired position and
    // stop short of the first building that would block the view
    const hx = ch.pos.x, hy = ch.altitude + 1.8 * scale, hz = ch.pos.z;
    let k = 1;
    const steps = 10;
    for (let s = 1; s <= steps; s++) {
      const f = s / steps;
      const sx = hx + (tx - hx) * f;
      const sy = hy + (ty - hy) * f;
      const sz = hz + (tz - hz) * f;
      if (this.world.buildingHeightAt(sx, sz) > sy) { k = Math.max(0.18, (s - 1) / steps); break; }
    }
    this._v2.set(hx + (tx - hx) * k, hy + (ty - hy) * k, hz + (tz - hz) * k);
    safeLerp(this.camPos, this._v2, Math.min(1, dt * 7));

    this.camera.position.copy(this.camPos).add(this.fx.shakeOffset);
    safeLerp(this.camTarget, this._v2.set(ch.pos.x, ch.altitude + (1.6 - 0.5 * air) * scale, ch.pos.z), Math.min(1, dt * 10));
    this.camera.lookAt(this.camTarget);
    // bank the camera with the hero when flying into a turn
    this.camRoll = (this.camRoll || 0) + ((-ch.bank * 0.16 * air) - (this.camRoll || 0)) * Math.min(1, dt * 5);
    if (Number.isFinite(this.camRoll)) this.camera.rotateZ(this.camRoll);

    const t = now();
    const targetFov = this.baseFov + (P.speedUntil > t ? 14 : 0) + (air > 0 ? 4 + Math.min(6, flySpeed * 0.5) * air : 0);
    this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, dt * 5);
    this.camera.updateProjectionMatrix();
  }

  updateCameraMenu(dt) {
    this.attractTimer -= dt;
    if (this.attractTimer <= 0 || !this.attractBot?.ch.alive) {
      this.attractTimer = rand(7, 11);
      const candidates = this.bots.filter((b) => b.ch.alive);
      this.attractBot = candidates.length ? pick(candidates) : null;
      this.attractAngle = rand(0, Math.PI * 2);
    }
    if (!this.attractBot) return;
    this.attractAngle += dt * 0.12;
    const p = this.attractBot.ch.pos;
    const r = 13;
    this._v2.set(
      p.x + Math.cos(this.attractAngle) * r,
      5.5 + Math.sin(this.time * 0.3) * 2 + this.attractBot.ch.altitude,
      p.z + Math.sin(this.attractAngle) * r
    );
    safeLerp(this.camPos, this._v2, Math.min(1, dt * 1.2));
    safeLerp(this.camTarget, this._v2.set(p.x, this.attractBot.ch.altitude + 1.5, p.z), Math.min(1, dt * 2.5));
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camTarget);
    this.camera.fov += (this.baseFov - this.camera.fov) * Math.min(1, dt);
    this.camera.updateProjectionMatrix();
  }

  updateCameraDeath(dt) {
    this.deathT += dt;
    const P = this.player;
    const p = P.ch.pos;
    const ang = this.camYaw + this.deathT * 0.7;
    const r = 7 + this.deathT * 2;
    this.camPos.lerp(this._v2.set(p.x - Math.sin(ang) * r, 3.5 + this.deathT * 1.5, p.z - Math.cos(ang) * r), Math.min(1, dt * 4));
    this.camera.position.copy(this.camPos).add(this.fx.shakeOffset);
    this.camera.lookAt(p.x, 1, p.z);
  }

  // ================= LEADERBOARD =================

  leaderboardRows() {
    const entries = this.bots
      .map((b) => ({ name: b.ch.name, score: b.score * this.director.bet * 0.02 + b.score, me: false }));
    if (this.player && this.state !== 'menu') {
      entries.push({ name: 'You', score: this.director.total, me: true });
    }
    entries.sort((a, b) => b.score - a.score);
    const rows = entries.slice(0, 6).map((e, i) => ({ ...e, rank: i + 1 }));
    const meIdx = entries.findIndex((e) => e.me);
    if (meIdx >= 6) rows.push({ ...entries[meIdx], rank: meIdx + 1 });
    return rows.length ? rows : [];
  }

  // ================= MAIN UPDATE =================

  update(rawDt) {
    const dt = Math.min(rawDt, 0.05) * this.timescale;
    this.time += dt;

    if (this.timescale < 1 && performance.now() / 1000 > this.slowmoUntil && this.state !== 'dying') {
      this.timescale = Math.min(1, this.timescale + rawDt * 2);
    }

    // stream the world around the action
    this.world.update(this.focusPos, dt);

    for (const b of [...this.bots]) this.updateBot(b, dt);
    for (let i = this.pendingRespawns.length - 1; i >= 0; i--) {
      this.pendingRespawns[i] -= dt;
      if (this.pendingRespawns[i] <= 0) {
        this.pendingRespawns.splice(i, 1);
        if (this.bots.length < CONFIG.BOT_COUNT + (this.director.phase === 'strike' ? 2 : 0)) this.spawnBot({});
      }
    }
    if (Math.random() < dt * 2 && this.bots.length) {
      const b = pick(this.bots);
      b.score += rand(0.5, 4);
    }

    this.collectibles.update(dt, this.time);
    this.updateProjectiles(dt);
    this.updateThrown(dt);
    this.processHits();
    this.updateCorpses(dt);
    this.fx.update(dt);
    this.bams.update(dt);

    const input = this.controls.poll();

    if (this.state === 'playing') {
      this.updatePlayer(dt, input);
      this.updateTelekinesis(dt);
      this.updateClones(dt);

      // the director decides when your story ends
      const ev = this.director.update(dt);
      if (ev === 'stalk') this.assignHunters(CONFIG.HUNTER_COUNT);
      else if (ev === 'strike') this.beginStrike();
      this.updateHunt(dt);

      this.updateCameraPlay(dt, input);

      // HUD
      const P = this.player, t = now();
      this.ui.setHP(P.ch.hp / P.ch.maxHp);
      const main = P.powerMain;
      const cdLeft = Math.max(0, (P.cds[main.id] || 0) - t);
      this.ui.setPowerButton(main, cdLeft / main.cooldown);
      this.lbTimer -= dt;
      if (this.lbTimer <= 0) {
        this.lbTimer = 0.5;
        this.ui.leaderboard(this.leaderboardRows());
        const buffs = [];
        if (P.absorbUntil > t) buffs.push({ emblem: '🧬', label: Math.ceil(P.absorbUntil - t) + 's' });
        if (P.twoUntil > t && P.secondPower) buffs.push({ icon: P.secondPower.id, label: Math.ceil(P.twoUntil - t) + 's' });
        if (P.enlargeUntil > t) buffs.push({ emblem: '🦹', label: Math.ceil(P.enlargeUntil - t) + 's' });
        if (P.fireballArmed) buffs.push({ emblem: '☄', label: 'armed' });
        if (P.invisUntil > t) buffs.push({ icon: 'invisibility', label: Math.ceil(P.invisUntil - t) + 's' });
        if (P.ch.propMesh) buffs.push({ icon: 'shapeshift', label: 'hidden' });
        if (P.tk) buffs.push({ icon: 'telekinesis', label: 'hold' });
        this.ui.setBuffs(buffs);
      }
    } else if (this.state === 'menu' || this.state === 'results') {
      this.updateCameraMenu(dt);
    } else if (this.state === 'dying') {
      this.updateCameraDeath(rawDt);
      this.player.ch.update(dt, this.time);
      if (this.deathT > 3.0) {
        this.timescale = 1;
        this.finishRound();
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  project(v) {
    this._v2.copy(v).project(this.camera);
    if (this._v2.z > 1) return null;
    return {
      x: (this._v2.x * 0.5 + 0.5) * this.canvas.clientWidth,
      y: (-this._v2.y * 0.5 + 0.5) * this.canvas.clientHeight,
    };
  }
}
