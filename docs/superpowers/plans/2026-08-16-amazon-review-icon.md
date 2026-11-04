# Amazon Review Exporter Icon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate a minimal Amazon-orange review icon and wire exact-size PNG assets into the Chrome extension manifest.

**Architecture:** Generate one high-resolution square raster master, inspect it, and derive all Chrome icon sizes from that single source using deterministic high-quality downscaling. Configure both the extension-level icon map and the toolbar action icon map in Manifest V3.

**Tech Stack:** Built-in image generation, PNG, macOS `sips`, Chrome Extension Manifest V3, JSON validation with Python.

## Global Constraints

- Background color: Amazon orange `#FF9900`.
- Center graphic: white comment bubble plus a small star.
- Flat, minimal, centered composition with a strong silhouette and safe margins; the orange background fills the square canvas without transparent corners.
- No text, letters, gradients, shadows, textures, photographs, Amazon smile arrow, or copied trademarks.
- Deliver exact `16×16`, `32×32`, `48×48`, and `128×128` PNG files.
- This directory has no Git metadata, so commit steps are omitted.

---

### Task 1: Generate and Validate the Master Icon

**Files:**
- Create: `src/icons/icon-source.png`

**Interfaces:**
- Consumes: approved visual requirements from `docs/superpowers/specs/2026-08-16-amazon-review-icon-design.md`.
- Produces: a square PNG master used as the only scaling source.

- [ ] **Step 1: Generate the master**

Use built-in image generation with a `logo-brand` prompt specifying the exact orange background, white comment bubble and star, flat geometry, centered safe margins, and all prohibited elements.

- [ ] **Step 2: Inspect the master visually**

Verify the result contains exactly one recognizable white comment bubble and one small star, uses no text or branding, is centered, and remains legible when mentally reduced.

- [ ] **Step 3: Persist the selected master**

Copy the selected generated PNG to `src/icons/icon-source.png` without overwriting an unrelated pre-existing asset.

### Task 2: Produce Chrome Sizes and Configure the Manifest

**Files:**
- Create: `src/icons/icon16.png`
- Create: `src/icons/icon32.png`
- Create: `src/icons/icon48.png`
- Create: `src/icons/icon128.png`
- Modify: `src/manifest.json`

**Interfaces:**
- Consumes: `src/icons/icon-source.png` from Task 1.
- Produces: exact-size extension icon assets and Manifest V3 icon references.

- [ ] **Step 1: Verify the manifest currently lacks icon mappings**

Run:

```bash
python3 -c 'import json; p="src/manifest.json"; d=json.load(open(p)); assert "icons" not in d and "default_icon" not in d.get("action", {})'
```

Expected: assertion passes before the change.

- [ ] **Step 2: Create exact-size PNG assets**

Run `sips -z SIZE SIZE src/icons/icon-source.png --out src/icons/iconSIZE.png` for sizes `16`, `32`, `48`, and `128`.

- [ ] **Step 3: Add the icon maps**

Add this top-level map and the same map under `action.default_icon`:

```json
{
  "16": "icons/icon16.png",
  "32": "icons/icon32.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
}
```

- [ ] **Step 4: Validate JSON, dimensions, format, and references**

Run:

```bash
python3 -c 'import json, pathlib, subprocess; root=pathlib.Path("src"); d=json.loads((root/"manifest.json").read_text()); expected={"16":"icons/icon16.png","32":"icons/icon32.png","48":"icons/icon48.png","128":"icons/icon128.png"}; assert d["icons"]==expected; assert d["action"]["default_icon"]==expected; [(_ for _ in ()).throw(AssertionError(p)) for p in expected.values() if not (root/p).is_file()]'
sips -g pixelWidth -g pixelHeight -g format src/icons/icon16.png src/icons/icon32.png src/icons/icon48.png src/icons/icon128.png
```

Expected: JSON assertions pass; each PNG reports matching width and height and `format: png`.

- [ ] **Step 5: Inspect the 16px and 128px outputs**

Render both final sizes and confirm the white bubble silhouette and star remain balanced, with no unexpected text, crop, or background artifacts.
