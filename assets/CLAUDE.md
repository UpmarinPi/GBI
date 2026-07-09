# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working within `assets/`.

See the [repository root CLAUDE.md](../CLAUDE.md) for overall project status, tech stack, and commands.

## Status

No assets exist yet. This document defines the conventions to follow once assets are added.

## Why this matters

The project's core requirement is **instant startup** in the browser. Asset format and size choices here
directly determine load time, so prefer compressed/GPU-friendly formats over convenience formats.

## Conventions

- **3D models**: `.glb` (binary glTF), Draco-compressed geometry where the model is complex enough to benefit.
- **Textures**: prefer KTX2/Basis Universal (GPU-compressed, loads directly into VRAM) over raw PNG/JPG for
  anything used in the Three.js scene. Reserve PNG/JPG for UI images rendered by React/DOM, not the 3D scene.
- **Audio**: compressed formats (`.mp3`/`.ogg`), not uncompressed `.wav`, except for very short SFX where
  decode-latency matters more than size.
- **Naming**: lowercase, hyphen-separated (e.g. `player-character.glb`, `level-01-heightmap.ktx2`).
- **No unoptimized source files committed as runtime assets** — if you keep original/high-res source files
  (e.g. `.blend`, uncompressed `.png`), put them under a clearly separate subfolder so the build doesn't
  accidentally ship them.
