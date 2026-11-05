# Irremarkables

A third-person, open-world, **simulated-multiplayer** superhero betting game, playable as a PWA on desktop and mobile.

Pick a superpower, place your bet, and drop into a continuous lobby battle royale (think agar.io / slither.io, but 3D and third-person). Grow your total by eliminating other "players" and hoovering up idle tokens — and try to stay alive while the lobby hunts each other around you.

## How the game works

- **Simulated multiplayer** — the lobby is filled with named bots that roam, fight, fly, blink, and kill each other. A live leaderboard and kill feed keep the lobby feeling occupied. When a "player" dies, another one joins.
- **Betting / RTP director** (`src/rtp.js`) — each round you place a bet. The director samples a hidden target payout multiplier from a bracketed distribution whose expected value is normalized to exactly `CONFIG.RTP` (0.96 by default). Your winnings (kills + tokens) are clamped so the final pickup lands exactly on target — and the instant you hit it, a **nemesis** carrying a counter to your current power is dispatched to end your run. Long-run return trends to the configured RTP while every round plays and reads as skill.
- **Streaming, regenerating world** — the map is generated in chunks around the player. Each chunk samples a slowly drifting biome field, so suburban neighbourhoods blend into metropolitan blocks (and back) at the edges as new terrain generates — always daytime, never a visible map swap.

## Superpowers

Flight, Super Speed, Invisibility, Telekinesis, Pyrokinesis (rare), Cryokinesis (rare), Teleportation, X-Ray Vision, Shapeshifting, Duplication. You can switch powers a limited number of times per game (3 by default).

## Collectibles

- **Pills** — Power Absorption (45%), Two Powers (30%), Extra Switch (25%)
- **Potions** — Enlarge (40%), Fireball (40%), Superhero Landing (20%)
- **Idle tokens** — low-value coins spawning constantly across the map

## Controls

| | Move | Turn | Attack | Use power | Switch power | Camera |
|---|---|---|---|---|---|---|
| **Mobile** | dynamic joystick (touch anywhere) | joystick | ATTACK button | power button (hold for telekinesis) | SWITCH button | second finger drag |
| **Desktop** | W / S | A / D | M | Space (hold for telekinesis) | Tab | mouse drag |

Telekinesis is a channelled power: hold the power input to seize the nearest enemy or liftable prop (cars, benches, bins), reel it in, and hurl it in your aim direction. Release early and it drops on the spot.

## Development

```bash
npm install
npm run dev       # local dev server
npm run build     # generates PWA icons + font + production build in dist/
npm run preview   # serve the production build
npm run check     # verify dist/ contains only host-safe file types
npm run catalog   # re-render the asset catalog (see below)
```

## Asset catalog

A browsable reference of every hero, building, prop, collectible, effect, icon
and animation lives at **`/asset-catalog/`** on the deployed site
(<https://arifialkov.github.io/irremarkables/asset-catalog/>). Each entry has
renders from several angles, measured size, triangle count, materials, colour
palette, variation rules, notes for a reskin and links to the source.

The pictures are rendered by the game's own code, so they always match what the
game draws. After changing any asset, regenerate and commit the output:

```bash
npm run catalog           # everything (about 30 s)
npm run catalog -- hero   # only ids containing "hero"
```

`scripts/build-catalog.mjs` starts a Vite server, opens
`scripts/catalog/render.html` in headless Chromium (Playwright), and writes
`public/asset-catalog/catalog.json` plus `img/*.png`. Asset definitions,
descriptions and camera views live in `scripts/catalog/render.js`. Run it from
a clean commit so the source links point at that commit. Playwright is not a
project dependency: install it once with `npm i -g playwright` and
`npx playwright install chromium` if you do not have it.

## Deploying to your own host

`npm run build` writes the complete site to `dist/`. **Upload the *contents* of
`dist/`, not the repository folder** — `index.html` must land at the root of
whatever you serve. Nothing else in this repo (README, `src/`, `scripts/`,
`package.json`, …) belongs on the server.

The build deliberately emits only file types static hosts accept:

```
dist/
├── index.html
├── manifest.json     PWA manifest (named .json, not .webmanifest)
├── sw.js             service worker — offline + installable
├── assets/           game bundle: one .js, one .css (font embedded inline)
├── icons/            icon-192.png, icon-512.png
└── asset-catalog/    asset reference pages (optional; safe to leave out)
```

`npm run build` ends by running `scripts/check-dist.mjs`, which fails the build
if anything outside `.html .js .css .json .png` ends up in `dist/`.

The build uses relative paths, so it works from a domain root or any
sub-directory. `sw.js` and `manifest.json` are optional — delete them and the
game still plays, you just lose offline/installable support (which also
requires the site be served over HTTPS).

Tuning knobs (RTP, bet sizes, spawn probabilities, bot counts, world size, etc.) live in `src/config.js`.

## PWA

`public/manifest.webmanifest` + `public/sw.js` make the production build installable and playable offline once cached (service worker registers over HTTPS). Icons are generated at build time by `scripts/gen-icons.mjs` with no image dependencies.
