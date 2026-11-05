import { CONFIG } from './config.js';
import { rand } from './utils.js';

// The director controls the economics of a round. At round start it samples
// a target payout multiplier from a bracketed distribution whose expected
// value is normalized to exactly CONFIG.RTP. The player accrues winnings
// through play; the moment their total reaches the target, the director
// has a couple of ordinary-looking bots close in on the player and take them
// out. The payout always lands on the target, so the long-run return trends
// to the configured RTP while every round still looks and feels skill-driven.
//
// Phases: playing -> stalk (total nearing the target: hunters drift toward
// the player) -> strike (target reached: the hunters attack) -> done.

function bracketsMean() {
  let mean = 0;
  for (const [w, lo, hi] of CONFIG.MULT_BRACKETS) mean += w * (lo + hi) / 2;
  return mean;
}

const CALIBRATION = CONFIG.RTP / bracketsMean();

export function sampleTargetMultiplier() {
  let r = Math.random();
  let chosen = CONFIG.MULT_BRACKETS[CONFIG.MULT_BRACKETS.length - 1];
  for (const b of CONFIG.MULT_BRACKETS) {
    if (r < b[0]) { chosen = b; break; }
    r -= b[0];
  }
  const [, lo, hi] = chosen;
  return rand(lo, hi) * CALIBRATION;
}

export class Director {
  constructor() {
    this.bet = 0;
    this.targetMult = 1;
    this.total = 0;          // player's accrued winnings this round ($)
    this.phase = 'idle';     // idle | playing | stalk | strike | done
    this.strikeDelay = 0;    // short beat between hitting the target and the ambush
  }

  startRound(bet) {
    this.bet = bet;
    this.targetMult = sampleTargetMultiplier();
    this.total = 0;
    this.phase = 'playing';
    this.strikeDelay = rand(1.0, 2.5);
  }

  get target() { return this.bet * this.targetMult; }
  get mult() { return this.bet > 0 ? this.total / this.bet : 0; }
  get live() { return this.phase === 'playing' || this.phase === 'stalk' || this.phase === 'strike'; }

  // Add winnings, clamped so the total can never overshoot the scripted
  // payout — the last pickup/kill lands exactly on target.
  addWinnings(amount) {
    if (!this.live) return 0;
    const room = Math.max(0, this.target - this.total);
    const gain = Math.min(amount, room);
    this.total += gain;
    return gain;
  }

  get targetReached() { return this.total >= this.target - 1e-9; }
  get stalkReached() { return this.total >= this.target * CONFIG.STALK_FRACTION; }

  // Called each frame while live. Returns 'stalk' once when the hunters
  // should start closing in, 'strike' once when they should attack, else null.
  update(dt) {
    if (this.phase === 'playing' && this.stalkReached) {
      this.phase = 'stalk';
      return 'stalk';
    }
    if ((this.phase === 'stalk' || this.phase === 'playing') && this.targetReached) {
      this.strikeDelay -= dt;
      if (this.strikeDelay <= 0) {
        this.phase = 'strike';
        return 'strike';
      }
    }
    return null;
  }

  endRound() {
    this.phase = 'done';
    return this.total;
  }
}
