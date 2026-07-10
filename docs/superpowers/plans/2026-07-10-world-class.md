# World Class Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `World` class that holds `EntityBase`-derived objects for a scene (add/remove/lookup/list), per
[docs/superpowers/specs/2026-07-10-world-class-design.md](../specs/2026-07-10-world-class-design.md).

**Architecture:** A single plain-TypeScript class in `src/scenes/World.ts`, storing entities in a
`Map<string, EntityBase>` keyed by `entity.id`. No physics/render coupling, no per-frame update loop.

**Tech Stack:** TypeScript only (no Three.js/Rapier — not installed yet per root CLAUDE.md).

## Global Constraints

- Tabs for indentation; Allman brace style; mandatory `{}` on all conditionals (see
  [src/CODING_STYLE.md](../../../src/CODING_STYLE.md)). ESLint is the source of truth — run `npm run lint`.
- Classes are `PascalCase`; variables/functions are `camelCase`.
- No automated test for this task — vitest is not installed yet (tracked separately in root CLAUDE.md
  "Remaining setup"). Verification is via `npm run lint` and `npx tsc --noEmit`.
- Ground (`y = 0`) is represented only as a comment on the class — no property, no method.

---

### Task 1: `World` entity container

**Files:**
- Create: `src/scenes/World.ts`

**Interfaces:**
- Consumes: `EntityBase` from `src/entities/EntityBase.ts` (has `readonly id: string`).
- Produces: `World` class with `addEntity(entity: EntityBase): void`, `removeEntity(id: string): void`,
  `getEntity(id: string): EntityBase | undefined`, `getEntities(): EntityBase[]`. No other task depends on
  this yet (it's the first consumer-facing piece of `src/scenes/`).

- [ ] **Step 1: Write `src/scenes/World.ts`**

```ts
import { EntityBase } from "../entities/EntityBase";

// The world's ground is conceptually an infinite plane at y = 0; not modeled as
// data here yet — that lands with physics/render implementation.
export class World
{
	private readonly entities: Map<string, EntityBase>;

	constructor()
	{
		this.entities = new Map();
	}

	addEntity(entity: EntityBase): void
	{
		if (this.entities.has(entity.id))
		{
			throw new Error(`World already has an entity with id "${entity.id}"`);
		}

		this.entities.set(entity.id, entity);
	}

	removeEntity(id: string): void
	{
		this.entities.delete(id);
	}

	getEntity(id: string): EntityBase | undefined
	{
		return this.entities.get(id);
	}

	getEntities(): EntityBase[]
	{
		return Array.from(this.entities.values());
	}
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors (tabs/Allman/mandatory-braces all satisfied by the code above).

- [ ] **Step 4: Manual smoke check**

Since vitest isn't wired up, verify behavior with a throwaway script instead of a committed test. Run:

```bash
npx tsx -e "
import { World } from './src/scenes/World';
import { EntityBase } from './src/entities/EntityBase';

const world = new World();
const a = new EntityBase('a');
const b = new EntityBase('b');

world.addEntity(a);
world.addEntity(b);
console.log(world.getEntities().map(e => e.id)); // expect ['a', 'b']
console.log(world.getEntity('a') === a); // expect true

world.removeEntity('a');
console.log(world.getEntities().map(e => e.id)); // expect ['b']
console.log(world.getEntity('a')); // expect undefined

try
{
	world.addEntity(b);
	console.log('ERROR: should have thrown');
}
catch (e)
{
	console.log('duplicate id threw as expected:', (e as Error).message);
}
"
```

Expected output:
```
[ 'a', 'b' ]
true
[ 'b' ]
undefined
duplicate id threw as expected: World already has an entity with id "b"
```

If `npx tsx` isn't available, install it ad hoc with `npx --yes tsx` (it's a dev-only run, not a project
dependency — do not add it to `package.json`).

- [ ] **Step 5: Commit**

Only commit if the user has asked for it in this session. If so:

```bash
git add src/scenes/World.ts docs/superpowers/specs/2026-07-10-world-class-design.md docs/superpowers/plans/2026-07-10-world-class.md
git commit -m "$(cat <<'EOF'
Add World entity container class

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```
