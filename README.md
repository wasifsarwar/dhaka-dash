# Dhaka Dash · 1.0.0

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

One crash ends a run. Each cha adds 50 points; each whole distance meter adds one point. Traffic gets faster up to a cap. Every wave has a safe lane within one lane of the previous safe lane. Cha spawns in that safe lane. Hitboxes are intentionally smaller than sprites.

High scores and sound preferences live in this browser's localStorage. If storage is unavailable, play still works and the best remains in memory for the session. There is no server leaderboard, account, multiplayer, or backend in 1.0.0.

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

This workflow currently validates changes only: it does not deploy them. Public hosting and automatic production deployment still require connecting a hosting account. The production build targets Cloudflare Workers; deployment must use the generated `dist/server/wrangler.json` configuration. Never commit hosting tokens or put them in client-side environment variables.

## Artwork

`public/og.png` was created using the built-in ImageGen tool. Brief: a vintage Bangladesh arcade/travel poster, ivory/forest-green/terracotta/mustard, with a green CNG and the exact text “DHAKA DASH” and “ONE CNG. THREE LANES. ENDLESS CHAOS.” Game sprites are procedural Phaser graphics, independent of this poster.

## Validation notes

TypeScript, lint, and the production build pass. Deterministic checks covered 10,000 traffic waves, 100 two-minute automated runs, collision/pickup behavior, pause freezing, frame-delta clamping, and browser-storage failure recovery. Browser play-testing on real desktop/mobile screens remains to be done.

The build reports the expected large Phaser engine chunk. `npm audit` still reports four high-severity findings in the development-tool chain (`@cloudflare/vite-plugin` / `wrangler` / `miniflare` / `sharp`), all tracing to the image-processing dependency. The audit's suggested forced fix downgrades the toolchain, so it was not applied. Keep the preview local; review this before public hosting. No public deployment has been made.

## Next iterations

Play-test steering and difficulty before expanding. Candidates: richer Dhaka scenery, installable offline support, and a Go-backed cousin leaderboard.
