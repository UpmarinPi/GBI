# World class design

Date: 2026-07-10

## Purpose

A container that holds `EntityBase`-derived objects placed into a scene. This is the first piece of
`src/scenes/`, which today only has an empty `SceneBase` placeholder.

## Scope

- Entity management only: add, remove, look up by id, list all.
- No per-frame `update(dt)` loop, no physics/render coupling, no tests (vitest is not wired up yet — tracked
  separately in the root CLAUDE.md "Remaining setup" section).
- Ground is **not** modeled as data or a method. The game's ground is conceptually an infinite plane at
  `y = 0`; that's recorded as a single comment on the class, to be turned into real physics/render code once
  Rapier/Three.js land.

## API

`src/scenes/World.ts`:

- `addEntity(entity: EntityBase): void` — stores the entity keyed by `entity.id`. Throws if an entity with
  that id is already present, to catch id collisions as bugs rather than silently overwriting.
- `removeEntity(id: string): void` — removes the entity with that id, if present; no-op otherwise.
- `getEntity(id: string): EntityBase | undefined` — look up by id.
- `getEntities(): EntityBase[]` — snapshot array of all currently-held entities (not a live view of internal
  storage, so callers can't mutate world state by holding onto the returned array).

## Internal storage

`Map<string, EntityBase>` keyed by `entity.id`, for O(1) add/remove/lookup.

## Out of scope (deliberately deferred)

- Per-frame update loop over entities (`world.update(dt)`).
- Ground collision/physics.
- Rendering sync.
- Automated tests (depends on vitest setup, a separate task).
