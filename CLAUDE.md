# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project name

**GBI** — "Good Bye Incompetence"

## Project status

Minimal scaffold only: Vite + React + TypeScript is wired up and `npm start` renders a blank page. Three.js and
Rapier are **not installed yet** — game loop, rendering, physics, and input (`src/input/`) are still to be
implemented per the architecture below.

## Project concept

A browser-based game that:
- Runs entirely client-side as a **static site** (no backend, works fully offline once loaded/built).
- Uses physics simulation for gameplay.
- Prioritizes **fast startup and consistent frame rate**, leaning on GPU-accelerated rendering rather than
  CPU-bound canvas drawing.

## Target tech stack

| Concern | Choice | Why |
|---|---|---|
| Build tool | [Vite](https://vitejs.dev/) | Static output, fast dev server/HMR, first-class TS support |
| Language | TypeScript | Type safety across game/physics/render boundaries |
| UI shell | React | Menus, HUD, overlays — **not** the per-frame game loop |
| Rendering | [Three.js](https://threejs.org/) (WebGL) | GPU-accelerated; works for both 2D (orthographic camera) and 3D scenes |
| Physics | [Rapier](https://rapier.rs/) (`@dimforge/rapier3d-compat` or `rapier2d-compat`) | Rust/WASM physics engine, near-native speed, SIMD-capable |

Key architectural rule: **React never touches the render loop.** React owns DOM UI only (menus, score, dialogs).
The game loop, Three.js scene graph, and Rapier world step run outside React on `requestAnimationFrame`,
communicating with React via a small state/store bridge (e.g. a plain event emitter or a minimal store) rather
than re-rendering React per frame.

## Remaining setup (not yet done)

```bash
npm install three @dimforge/rapier3d-compat
npm install -D vitest
```

ESLint is already configured (`eslint.config.js`) — it enforces the formatting rules in
[src/CODING_STYLE.md](src/CODING_STYLE.md) (tab indentation, Allman brace style, mandatory `{}` on
conditionals) and is the source of truth if this doc and ESLint ever disagree.

## Common commands

```bash
npm install     # install dependencies
npm start        # start Vite dev server (alias of `npm run dev`)
npm run build      # production build -> dist/ (static, deployable anywhere, no server required)
npm run preview      # serve the production build locally to sanity-check the static output
npm run lint            # ESLint (tabs / Allman braces / mandatory {} on conditionals — see src/CODING_STYLE.md)
npm run test              # run test suite (not configured yet — vitest)
npm run test -- path/to/file.test.ts   # run a single test file (once vitest is added)
```

## High-level architecture (target)

See [src/CLAUDE.md](src/CLAUDE.md) for the full `src/` folder breakdown (app, core, input, player, entities,
game-mode, scenes, physics, render, ui, loaders, audio, shared) and the dependency-direction rule between them.

```
src/       game source — see src/CLAUDE.md
assets/    models, textures, audio (see assets/CLAUDE.md)
docs/      design docs, ADRs (see docs/CLAUDE.md)
```

The core loop pattern: each frame, step the Rapier physics world, read back transforms into the Three.js scene
graph, render. Keep physics step and render step decoupled (fixed timestep for physics, variable for render) so
gameplay stays stable regardless of frame rate.

## Performance notes

- Physics runs via WASM (Rapier) — avoid recreating rigid bodies/colliders every frame; reuse and mutate.
- Prefer instancing (`InstancedMesh`) in Three.js for repeated geometry instead of many draw calls.
- See [assets/CLAUDE.md](assets/CLAUDE.md) for asset formats that affect load time (compression, etc.).
