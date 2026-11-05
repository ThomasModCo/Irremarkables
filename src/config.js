// Central tuning knobs for the whole game.
export const CONFIG = {
  // ---- Betting / RTP ----
  RTP: 0.96,               // long-run return-to-player the director steers toward
  BETS: [1, 5, 10, 25, 50, 100],
  STARTING_WALLET: 1000,

  // Target-multiplier distribution brackets: [weight, min, max].
  // The director samples the round's payout multiplier from these, then
  // rescales so the expected value equals RTP exactly.
  MULT_BRACKETS: [
    [0.58, 0.05, 0.85],
    [0.26, 0.90, 1.80],
    [0.11, 1.80, 4.00],
    [0.042, 4.00, 12.0],
    [0.008, 12.0, 40.0],
  ],

  // ---- Economy (all values are multiples of the bet) ----
  TOKEN_VALUE: 0.006,      // idle token pickup
  KILL_VALUE_MIN: 0.05,    // bot kill bounty range
  KILL_VALUE_MAX: 0.16,

  // ---- Player ----
  PLAYER_SPEED: 9.5,
  // ---- Flight ----
  FLIGHT_DECK: 6.5,        // cruising height above the ground (metres)
  BOT_FLIGHT_DECK: 5,
  FLIGHT_CLEARANCE: 1.8,   // how far above a rooftop a flyer skims
  FLIGHT_CLIMB: 10,        // m/s up when something taller is in the way
  FLIGHT_DESCEND: 7,       // m/s back down once it's cleared
  FLIGHT_LOOKAHEAD: 9,     // metres ahead to look for tall structures
  // ---- Superhero Landing potion: up, steer, meteor down ----
  METEOR_APEX: 10,         // how high the pickup throws you
  METEOR_UP_TIME: 0.45,    // seconds to reach the apex
  METEOR_HANG_TIME: 0.9,   // seconds to steer at the top
  METEOR_FALL_SPEED: 30,   // m/s on the way down
  LANDING_RADIUS: 8.5,     // impact kill radius
  PLAYER_HP: 100,
  HP_REGEN: 4,             // hp per second
  SWITCHES_PER_GAME: 3,
  ADRENALINE_COOLDOWN: 14, // seconds between cinematic near-death escapes

  // ---- Bots ----
  BOT_COUNT: 26,
  BOT_SPEED: 6.0,
  BOT_ATTACK_DPS: 16,
  BOT_ATTACK_RANGE: 2.6,
  HIT_Y_RANGE: 2.4,        // vertical reach of a melee blow (a hero is ~1.85m)

  // ---- Hunters (how the director ends a round, disguised as normal play) ----
  STALK_FRACTION: 0.65,    // of the target: hunters start drifting toward the player
  HUNTER_COUNT: 2,         // bots quietly assigned to the job
  HUNTER_SPEED: 11.5,      // strike-phase chase speed (player runs 9.5)
  HUNTER_HP: 320,          // strike-phase toughness
  HUNTER_DAMAGE: 0.9,      // fraction of the archetype's damage that lands on the player
  HUNTER_FIREBALL_AT: 8,   // seconds into the strike before hunters start lobbing fireballs
  HUNTER_GIANT_AT: 15,     // ... before reinforcements arrive enlarged
  HUNTER_BLINK_AT: 22,     // ... before hunters blink straight to the player

  // ---- World (streamed chunks; biomes blend spatially via a drifting noise field) ----
  BLOCK: 22,               // city block size
  ROAD: 8,                 // road width
  CHUNK_RADIUS: 5,         // chunks kept alive around the focus (Chebyshev)
  RECYCLE_DIST: 135,       // tokens/items/bots beyond this hop back near the player
  TOKEN_COUNT: 150,
  PILL_COUNT: 6,
  POTION_COUNT: 6,

  // ---- Telekinesis ----
  TK_RANGE: 13,            // grab reach
  TK_PULL_SPEED: 8,        // reel-in speed (m/s)
  TK_THROW_SPEED: 27,      // fling speed (m/s)

  // Pill spawn probabilities (must sum to 1)
  PILLS: [
    { id: 'absorb', name: 'Power Absorption', emblem: '\u{1F9EC}', p: 0.45, duration: 45 },
    { id: 'twopower', name: 'Two Powers', emblem: '\u{262F}', p: 0.30, duration: 30 },
    { id: 'extraswitch', name: 'Extra Switch', emblem: '\u{1F504}', p: 0.25, duration: 0 },
  ],
  // Potion spawn probabilities (must sum to 1)
  POTIONS: [
    { id: 'enlarge', name: 'Enlarge', emblem: '\u{1F9B9}', p: 1 / 3, duration: 15 },
    { id: 'fireball', name: 'Fireball', emblem: '\u{2604}', p: 1 / 3, duration: 0 },
    { id: 'landing', name: 'Superhero Landing', emblem: '\u{1F4A5}', p: 1 / 3, duration: 0 },
  ],
};
