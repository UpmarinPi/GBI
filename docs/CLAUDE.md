# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working within `docs/`.

See the [repository root CLAUDE.md](../CLAUDE.md) for overall project status, tech stack, and commands.

## Status

No docs exist yet. This document defines what belongs here once written.

## What belongs in this folder

- **Game design notes** — mechanics, level structure, physics tuning parameters and why they were chosen.
- **Architecture decision records** — any time a tech-stack choice from the root CLAUDE.md is revisited
  (e.g. switching Rapier for another physics engine, dropping React), record the decision and reasoning here
  rather than only in a commit message.
- **Format**: plain Markdown, one topic per file.

## What does not belong here

- API/code documentation that's better derived from reading `src/` directly — don't duplicate what's obvious
  from the code.
