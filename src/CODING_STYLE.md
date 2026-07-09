# Coding style

**ESLint is the source of truth.** `eslint.config.js` (repo root) enforces the formatting rules below via
`npm run lint`. If anything in this document ever disagrees with what ESLint actually enforces, ESLint wins —
fix this doc, not the other way around.

## Formatting

- **Indentation**: tabs, everywhere (`@stylistic/indent: ["error", "tab"]`). No spaces for indentation, in
  `.ts`/`.tsx` or in config files like `eslint.config.js`.
- **Brace style**: Allman for every block — classes, functions, `if`/`for`/`while`/`switch`, arrow function
  bodies with a block, etc. The opening `{` goes on its own line, not at the end of the declaration/condition
  line (`@stylistic/brace-style: ["error", "allman", { allowSingleLine: false }]`).
  ```ts
  export class PlayerController
  {
  	update(dt: number)
  	{
  		if (dt <= 0)
  		{
  			return;
  		}
  	}
  }
  ```
  - **Exception ESLint allows**: a genuinely empty block may stay as `{}` on the line after the declaration
    (e.g. `export class Foo\n{}`) — `brace-style` does not force an empty body onto its own extra line, and
    this repo follows that rather than inventing a stricter local rule.
  - Arrow functions with an **expression body** (no block) are not a "brace" at all — `curly` and
    `brace-style` don't apply to them: `const double = (x: number) => x * 2;` is correct as-is; don't wrap the
    expression in a block just to force braces.
- **Conditionals always use `{}`**, even for a single statement or an early `return`
  (`curly: ["error", "all"]`). This applies to `if`, `else`, `for`, `while`, `do...while`. Never write
  `if (!ready) return;` — write:
  ```ts
  if (!ready)
  {
  	return;
  }
  ```

Run `npm run lint` (add `-- --fix` via `npx eslint . --fix` to auto-fix indentation/brace placement) before
committing.

## Naming

Naming conventions for `src/`:

- **Variables and functions**: `camelCase`
- **Classes**: `PascalCase`
