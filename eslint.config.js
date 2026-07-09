import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import tseslint from "typescript-eslint";

export default tseslint.config(
	{
		// extension/ is a standalone Chrome extension (chrome.* / browser globals),
		// not part of the game's src/ codebase — out of scope for this config.
		ignores: ["dist/**", "node_modules/**", "extension/**"],
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ["**/*.{ts,tsx}"],
		plugins: {
			"@stylistic": stylistic,
		},
		rules: {
			// Indent: tabs everywhere.
			"@stylistic/indent": ["error", "tab"],
			"@stylistic/no-mixed-spaces-and-tabs": "error",
			"@stylistic/no-trailing-spaces": "error",

			// Brace style: Allman (opening brace on its own line) for every block —
			// classes, functions, if/for/while/switch, etc.
			"@stylistic/brace-style": ["error", "allman", { allowSingleLine: false }],

			// Conditionals/loops must always use {}, even for a single statement
			// or an early `return`.
			curly: ["error", "all"],
		},
	},
);
