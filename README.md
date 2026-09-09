# Dhaka Dash · 1.2.0

A flight-built arcade love letter to Dhaka. Steer a green CNG, collect cha, dodge traffic, and give pedestrians room.

**Play:** https://wasifsarwar.github.io/dhaka-dash/

## This release

- Smooth three-minute speed ramp from 210 to 440 world pixels/second; traffic density rises gradually too.
- Weathered green/red city buses and white/silver sedans, all facing north with unchanged collision boxes.
- Compact cream/green layout, restrained red/mustard accents, Bangla route board, and expandable instructions available on mobile.
- Existing best scores, power-ups, rolling tires, shops, and occasional pedestrian crossings preserved.
- Unused CNG drafts moved into `docs/artwork-archive/`, outside the deployed public assets. Previous artwork prompts remain in Git history.

## Develop

Node.js 22.13+ and npm are required; CI uses Node 24.

```sh
npm ci
npm run dev
```

Open the URL printed by the server (normally http://localhost:3000). The original Vinext development/server build is retained. GitHub Pages uses a separate static Vite entry that renders the same React/Phaser game:

```sh
npm run typecheck
npm run lint
npm run build
npm run build:pages
npm run preview:pages
```

The static preview uses `/dhaka-dash/`. Dependencies must be installed for offline development. Hosted play needs no network once loaded, but there is no service worker or guaranteed offline reload.

## Controls and rules

- Arrows or A/D steer; on mobile swipe or tap the arrows. Holding a key does not repeat.
- Space starts/pauses/resumes/retries; Escape pauses; R retries after a crash; H sounds the horn when audio is enabled.
- Leaving the window pauses the game. Sound and best scores stay in localStorage, with a session-only fallback when storage is unavailable.
- Cha gives +50 points; distance adds points. Smaller-than-art hitboxes make near misses forgiving.
- Orange **Jhalmuri Rush** gives 4 seconds of 1.45× speed and traffic protection. Mint **Rickshaw Shield** gives 6 seconds of traffic protection. Pickups activate automatically, refresh rather than stack duration, pause with gameplay, and reset on restart.
- One pedestrian crosses occasionally: first due after 16 seconds, then scheduled every 22–32 seconds after traffic clears. A 1.2-second curbside warning precedes crossing; traffic waves wait until it passes. Pedestrian contact always ends the run with an emergency stop, including while protected. Crossing approach speed is capped separately to preserve reaction time during boosts.
- Traffic waves keep a reachable safe lane. Neighborhood labels are arcade scenery, not a geographic route.

## CI/CD

Push or merge into `main` to run locked dependency installation, TypeScript, lint, and both builds. Only successful `main` runs deploy `dist/pages` to GitHub Pages. Pull requests run checks without deploying. Actions are pinned to commits; deployment uses GitHub's short-lived workflow credentials, not a personal token.

Follow progress in the repository's Actions tab. Failed checks leave the previous game live. To roll back, revert the relevant commit and push. Never commit secrets or expose them in browser environment variables.

## Code map

- `lib/game/core.ts`: deterministic simulation, speed curve, spawning, pickups, collisions, and crossings.
- `lib/game/scene.ts`: Phaser artwork, rendering, tire animation, controls, and lifecycle.
- `lib/game/audio.ts`, `lib/game/storage.ts`: optional procedural audio and browser persistence.
- `components/dhaka-dash.tsx`, `app/globals.css`: interface and responsive styling.
- `pages-entry.tsx`, `index.html`, `vite.pages.config.ts`: static entry, social metadata, and GitHub Pages base path.
- `app/page.tsx`, `app/layout.tsx`, `vite.config.ts`: original Vinext entry and build.

No accounts, leaderboard service, multiplayer, or runtime image service.

## Artwork

All raster artwork was created with built-in ImageGen. Active files:

- `public/cng-compact-v1.1.png`: compact north-facing CNG; tire tread is animated separately in Phaser.
- `public/dhaka-market-v1.1.png`: four roadside shop/stall frames with in-game Bangla labels.
- `public/dhaka-walkers-v1.1.png`: two two-frame walk cycles.
- `public/dhaka-traffic-v1.2.png`: two buses and two sedans; explicit atlas regions preserve the generated vehicle proportions.
- `public/og.png`: original branded social poster, preserved unchanged.

Traffic generation prompt: “Create ONE transparent game sprite atlas, square image, exactly FOUR equal cells in a 2x2 grid. Each object centered entirely inside its cell with 12% transparent margins. ALL vehicles face NORTH straight up, elevated TOP DOWN REAR view, rear bumper and red tail lights at BOTTOM, front at TOP, strictly zero diagonal yaw. TOP LEFT: weathered Dhaka city bus, green with cream roof and red/yellow painted swoosh on sides, rows of windows, roof vents, broad squared rear. TOP RIGHT: weathered Dhaka city bus, terracotta red with cream roof and green painted side stripe, roof vents, broad rear. BOTTOM LEFT: familiar white compact Japanese sedan seen from above/behind, dark windows, red rear lights. BOTTOM RIGHT: silver compact sedan same view. Crisp realistic painted arcade art matching a green Bangladesh CNG sprite, bold readable forms, restrained weathering, not photoreal backgrounds. No brand logos or text, no license text, no people, no road, no shadows outside objects, NO checkerboard. Genuine alpha transparent PNG, independent sprites, do not cross cell boundaries. Vehicles should occupy comparable cell heights with bus wider than car, buses realistically longer than sedans when scaled in game.”

## Validation and known limits

1.2.0 checks cover the monotonic speed curve and cap, 10,000 safe traffic waves, a simulated ten-minute run, rare crossings, pause freezing, and boosted crossing reaction bounds. The generated traffic orientation and transparency were inspected. Real desktop/mobile visual and control play-testing remains to be done.

Phaser produces an expected large bundle warning. Four high-severity audit findings remain in the original Cloudflare development-tool chain (`miniflare` / `sharp`); the suggested forced fix downgrades the toolchain and was not applied. GitHub Pages ships only static browser files, not that server runtime. Keep development servers local and review these dependencies before deploying the server build.
