# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working within `src/`.

See the [repository root CLAUDE.md](../CLAUDE.md) for overall project status, tech stack, and commands.

**Before reading or writing any file in this directory, read [CODING_STYLE.md](CODING_STYLE.md) for naming and
formatting conventions (tabs, Allman braces, mandatory `{}` on conditionals — enforced by `npm run lint`).**

## Status

`main.tsx` and `app/App.tsx` exist (blank page, see root CLAUDE.md). All other folders below are currently
empty placeholders — this document defines the target structure for when implementation starts.

## Intended structure

```
src/
  main.tsx      entry point — mounts app/App.tsx
  app/          composition root: wires together game-mode + scenes + player + ui at startup
  core/         singleton-ish abstractions: game loop (requestAnimationFrame), fixed-timestep
                update/render split, the store/event-bridge to React
  input/        input abstraction — keyboard + gamepad, unified into device-agnostic actions
  player/       player-specific logic (controller, state, camera-follow, etc.)
  entities/     non-player game objects (enemies, items, obstacles, projectiles)
  game-mode/    game rules only — win/lose conditions, scoring, settings. Does NOT hold references
                to player/ui/entities instances; app/ reads game-mode/ and wires the rest.
  scenes/       individual levels/screens; each composes game-mode + player + entities + physics + render
  physics/      Rapier world setup; stepping the physics world and syncing results to render objects
  render/       Three.js renderer/scene/camera setup, instancing helpers
  ui/           React components (HUD, menus, dialogs) — DOM only, never in the per-frame path
  loaders/      asset loading/caching code (reads from the top-level assets/ folder)
  audio/        SFX/music playback control
  shared/       cross-cutting utilities: math helpers, shared types, constants
```

**Dependency direction**: `app` → `scenes`/`game-mode` → `player`/`entities`/`ui` → `physics`/`render`/`input`/
`audio`/`loaders`/`shared`. Lower layers must never import from higher layers (e.g. `physics/` must not import
from `player/`) — this is what keeps `game-mode` lightweight and avoids circular dependencies between
`player` and `ui`.

### `input/` — keyboard + gamepad

```
input/
  keyboard.ts   keydown/keyup listeners -> pressed-key set
  gamepad.ts    polls navigator.getGamepads() once per frame -> button/axis state
  actions.ts    maps both sources to game actions (e.g. "move", "jump", "confirm")
  index.ts      public InputManager: what scenes/core actually import
```

- **Design against actions, not devices.** Scenes/core call `input.isDown("jump")`, never
  `keyboard.isDown("Space")` or `gamepad.button(0)` directly — `actions.ts` is the only place that knows the
  keyboard-key-to-action and gamepad-button-to-action mappings, so a keybinding/remapping screen only has to
  change one place.
- **Keyboard is event-driven; gamepad must be polled.** The Gamepad API has no per-button-press events (only
  `gamepadconnected`/`gamepaddisconnected`) — `gamepad.ts` calls `navigator.getGamepads()` once per game-loop
  tick (inside `core/`'s frame loop, not a separate interval) and diffs button/axis state against the previous
  frame.
- **Handle analog input, not just digital.** Gamepad axes/triggers are floats (e.g. `-1..1`); expose both a
  digital view (past a deadzone threshold) and the raw analog value, since movement/aiming should use the
  analog value while menu navigation should use the digital view.
- **Multiple gamepads**: index into `navigator.getGamepads()` by slot; treat gamepad 0 as player 1 by default
  unless the game is explicitly multiplayer.

## Rules for this codebase

- **Keep React out of the frame loop.** React renders UI (menus/HUD); it must not re-render on every physics/
  render tick. Bridge frame-loop state to React through a store or event emitter, not through per-frame
  `setState`.
- **Fixed timestep for physics, variable for render.** Step the Rapier world at a fixed interval and interpolate/
  render at whatever rate `requestAnimationFrame` gives you, so gameplay is frame-rate independent.
- **Reuse physics bodies/colliders.** Create Rapier rigid bodies and colliders once per entity; mutate them
  instead of recreating them each frame.
- **Reuse Three.js geometry/materials.** Share geometries/materials across instances; use `InstancedMesh` for
  repeated objects instead of one mesh per instance.
- **Types cross the physics/render boundary.** Since physics (Rapier/WASM) and rendering (Three.js) are separate
  systems, keep the sync code (reading Rapier transforms into Three.js objects) in `physics/` or a dedicated
  sync module, not scattered across scenes.
