# Dhaka Dash · 1.1.0

A flight-built, single-player arcade game: steer a green CNG through three lanes of Dhaka traffic, collect cha, and chase a device-local high score.

## Run locally

Requires Node.js 22.13+ and npm. Dependencies are already installed on the development machine.

```sh
cd "$HOME/Desktop/Dhaka Dash"
npm install
npm run dev
```

Open the local URL printed by the server (normally http://localhost:3000).
Once dependencies are installed, development and gameplay work without internet. Keep the local server running. This iteration does not install a service worker: a hosted copy is not guaranteed to reopen while offline.

## Controls

- Left/right arrows or A/D: move one lane; holding a key does not repeat.
- Space: start, pause, resume, or retry. R: retry after a crash.
- Escape: pause. H: horn, if sound is enabled.
- Touch: swipe horizontally on the road, or use the on-screen arrows.
- The pause and speaker buttons work with keyboard and touch.
- Leaving the tab or window pauses the game; resume explicitly.

## Game rules

An unprotected crash ends a run. Each cha adds 50 points; each whole distance meter adds one point. Traffic gets faster up to a cap. Every wave has a safe lane within one lane of the previous safe lane. Collectibles spawn in that safe lane. Hitboxes are intentionally smaller than sprites.

### New in 1.1.0

- North-facing green CNG sprite viewed from above and behind, with a canvas canopy, open passenger sides, cream seats, and a single front wheel.
- Scrolling Bangla roadside signs and rotating neighborhood labels (an arcade backdrop, not a geographic route).
- **Jhalmuri Rush (orange J):** 4 seconds at 1.45× speed with immunity, earning distance points faster.
- **Rickshaw Shield (mint R):** 6 seconds of immunity at normal speed. Protected collisions clear the obstacle without ending the run.
- Power-ups activate on pickup, alternate on a roughly 9-second spawn schedule after the first 5 seconds, and show countdowns. Recollecting refreshes duration rather than adding time. Effects can overlap, pause with the game, and reset on restart.

High scores and sound preferences live in this browser's localStorage. Existing personal bests are retained across this update. If storage is unavailable, play still works and the best remains in memory for the session. There is no server leaderboard, account, multiplayer, or backend.

## Architecture

- `app/page.tsx`: route entry.
- `components/dhaka-dash.tsx`: React menus, HUD, touch controls, local-best integration.
- `lib/game/core.ts`: plain TypeScript simulation, fair spawning, scoring, collision detection.
- `lib/game/scene.ts`: Phaser rendering and the keyboard/lifecycle bridge.
- `lib/game/audio.ts`: optional procedural Web Audio effects.
- `lib/game/storage.ts`: validated, fault-tolerant browser persistence.
- `app/globals.css`: responsive visual theme.

React owns interface state; Phaser owns frame-by-frame rendering. The core has no React, Phaser, DOM, or network dependency. This keeps game mechanics independently verifiable and leaves room for a Go leaderboard later.

The project uses the Sites React/Vite-based Vinext scaffold. Phaser is imported on the client only. No external fonts, image services, or audio downloads are required during play.

## Checks

```sh
npm run typecheck
npm run lint
npm run build
```

## Continuous integration

GitHub Actions runs `npm ci`, TypeScript checks, lint, and a production build on Node.js 24 for pushes and pull requests targeting `main`. The workflow can also be started manually from the repository's Actions tab. Actions are pinned to exact commits and receive read-only repository permissions.

For each change, work locally, run the checks above, then commit and push. Use a pull request when you want checks before merging into `main`.

After all checks and both builds pass on `main`, the same workflow publishes `dist/pages` to GitHub Pages. Pull requests run checks without deploying. Deployment uses GitHub's short-lived workflow credentials; no personal access token or hosting secret is needed.

Public game: https://wasifsarwar.github.io/dhaka-dash/

The existing `npm run dev` and `npm run build` commands retain the original Vinext setup. GitHub Pages uses a separate static Vite entry that renders the same React/Phaser game, with no server runtime. Run `npm run build:pages` then `npm run preview:pages` to preview that build at `/dhaka-dash/`. The base path is configured in `vite.pages.config.ts`; social preview URLs are in `index.html`.

To release an update: edit locally, commit, and push to `main` (or merge a checked pull request). Watch the Actions tab for the deployment result. Failed checks do not replace the live game. To roll back, revert the offending commit and push the revert so CI deploys it. Never commit tokens or put secrets in client-side environment variables.

## Artwork

Current sprite: `public/cng-compact-v1.1.png`, created with built-in ImageGen. A compact north-facing rear view replaces the exposed fork: rounded cabin, rear window, silver bumper, and hidden front wheel. Rear-tire tread overlays move with distance traveled and share the player's steering angle. They speed up during boosts, freeze while ready/paused/crashed, and reset on restart. Earlier sprites below are retained but unused.

Current generation prompt: “ONE realistic Bangladesh green CNG auto-rickshaw GAME SPRITE, north-facing driving away toward TOP edge. Elevated REAR view directly centered, symmetrical NO diagonal angle. Authentic SHORT COMPACT three-wheeler cabin with rounded dark green fabric canopy, emerald green lower body, silver rear bumper, two red rear lights, small cream rear license plate, tiny glimpses of open side passenger entry and cream bench. Front is at TOP, rear at BOTTOM. CRITICAL: FRONT WHEEL COMPLETELY HIDDEN behind cabin and SHORT ROUNDED green front mudguard; NO protruding long motorcycle fork, NO exposed wheel poking above roof, NO pointed nose. Roof/cabin defines top silhouette, not wheel. Two rear tires visible at bottom left/right, short dark rubber tread faces directly toward viewer, not side-facing rims. Compact real CNG proportions, not elongated car or motorcycle. Polished realistic painted sprite with simplified crisp details legible at 70x90 pixels. Vehicle centered fills 90% of image width and height, portrait 4:5 composition. Entire isolated vehicle on actual alpha TRANSPARENT background, NO floor, no shadow outside silhouette, no glow, no checkerboard. Wheels located near lower left and right corners underneath green rear fenders. Do not add text outside vehicle. Re-emphasize north facing rear view, roof at top and rear lights bottom; front wheel hidden.”

### Historical artwork notes (superseded)

The active sprite is `public/cng-north-v1.1.png`, generated with the built-in ImageGen tool to correct the earlier angled version. Prompt: “Game sprite: ONE authentic compact green Bangladesh CNG auto-rickshaw driving AWAY from viewer, toward NORTH / TOP edge. Camera directly ABOVE AND BEHIND vehicle, centered on longitudinal axis, ZERO left/right yaw. Rear bumper and red rear lights at BOTTOM; single front wheel and narrow front nose at TOP. Symmetrical north-facing top-down silhouette. Must NOT show front-facing headlights or frontal windshield facing viewer, must NOT point diagonally or toward bottom. Short rounded dark green canvas canopy (not stretched car roof), emerald green body, silver side safety rails and hints of cream passenger benches on both open sides, two rear wheels at bottom corners and one central front wheel at top. Stylized clean arcade illustration, bold simple shapes legible at 70x90 pixels, matching muted forest-green/ivory/mustard road game. Vehicle fills portrait canvas with 5 percent margin, no perspective rotation. Actual transparent alpha PNG background, no checkerboard, no ground, no glow or shadow outside vehicle, no captions. The orientation is the most important constraint: vehicle traveling straight UP, rear toward viewer at bottom.” North-facing orientation was visually inspected and its alpha channel verified. The earlier angled sprite below is retained but unused.

`public/cng-v1.1.png` was generated with the built-in ImageGen tool using the user's two CNG photos as visual references. Final prompt: “Create a game sprite using the TWO user reference photos of Bangladesh CNG auto rickshaws as reference images, not edit targets. Faithfully match their short chunky proportions: bright emerald green rounded upright front nose, very tall broad windshield with single diagonal wiper, dark green canvas canopy, OPEN side passenger doorway and cream bench seats, metal frame, TWO small round headlights, a single central front wheel with green mudguard and two rear wheels. White small CNG lettering on green nose. NOT a long automobile with a huge black roof. One isolated compact rickshaw, crisp charming hand-painted arcade sprite, subtle dark outline. Show elevated front three-quarter view, front nose pointing towards upper right of image, enough frontal visibility to clearly see windshield/headlights/front wheel and open passenger side, but enough overhead view for use on vertical scrolling game road. Entire vehicle within canvas with 5% padding. GENUINE TRANSPARENT BACKGROUND alpha channel, no checkerboard, no scene, no ground plane or drop shadow, no captions outside vehicle. Keep visual silhouette readable at 70x90 pixels. Save PNG.” The asset has a verified alpha channel; the original social poster is preserved.

`public/og.png` was created using the built-in ImageGen tool. Brief: a vintage Bangladesh arcade/travel poster, ivory/forest-green/terracotta/mustard, with a green CNG and the exact text “DHAKA DASH” and “ONE CNG. THREE LANES. ENDLESS CHAOS.” Traffic and pickup sprites use Phaser graphics; the player uses the separate CNG image above.

## Validation notes

Version 1.1.0 mechanics checks passed for power-up pickup, protected collisions, expiry, paused timers, duration refresh, boosted speed, cha scoring, restart reset, and 10,000 safe power-up waves. Both the original and GitHub Pages builds pass. The new sprite's alpha channel was verified. Real desktop/mobile play-testing of the new artwork and balancing remains to be done.

TypeScript, lint, and the production build pass. Deterministic checks covered 10,000 traffic waves, 100 two-minute automated runs, collision/pickup behavior, pause freezing, frame-delta clamping, and browser-storage failure recovery. Browser play-testing on real desktop/mobile screens remains to be done.

The build reports the expected large Phaser engine chunk. `npm audit` reports high-severity findings in the original development-tool chain (`@cloudflare/vite-plugin` / `wrangler` / `miniflare` / `sharp`). The audit's suggested forced fix downgrades the toolchain, so it was not applied. GitHub Pages publishes only the static browser bundle and public assets, not the Cloudflare server or its image-processing tools. Keep development servers local and review these dependencies before deploying the original server build.

## Next iterations

Play-test steering and difficulty before expanding. Candidates: richer Dhaka scenery, installable offline support, and a Go-backed cousin leaderboard.
