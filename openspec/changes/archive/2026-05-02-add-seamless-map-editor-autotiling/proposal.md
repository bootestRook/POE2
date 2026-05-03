## Why

The current `/map-editor` paints semantic cells with repeated CSS floor and wall backgrounds, so adjacent tiles still show grid seams, hard borders, and no Unity Tilemap-style edge or corner adaptation. Designers need painted dungeon rooms and corridors to visually connect as continuous terrain while preserving the existing simple `empty` / `ground` / `wall` authoring model.

## What Changes

- Add seamless visual autotiling for the map editor so painted ground and wall regions render as connected terrain rather than isolated square cells.
- Derive visual variants from neighboring cells at render time instead of requiring authors to paint edge, corner, or transition tiles manually.
- Separate debug/editor grid lines from tile artwork so grid overlays can be visible while editing without becoming permanent seams.
- Add validation/smoke coverage that proves adjacent same-kind tiles do not render with mandatory borders and that ground/wall transitions use derived visual states.
- Keep the saved map format focused on tile intent; do not require existing map JSON files to store per-cell visual masks.

## Capabilities

### New Capabilities

- `seamless-map-editor-autotiling`: Covers map editor autotile visual derivation, seamless tile rendering, transition states, and verification expectations for Unity Tilemap-like connected terrain.

### Modified Capabilities

- None.

## Impact

- Affected areas: `webapp/App.tsx` map editor rendering/model helpers, `webapp/styles.css` map editor tile visuals, `webapp/smoke-test.mjs` map editor smoke coverage, and map-editor tile assets under `webapp/assets/` or `assets/battle/tiles/` if replacement or derived assets are needed.
- Existing map JSON files remain compatible because autotiling is derived from `tiles`, `cellSize`, and existing tile semantics.
- Out of scope: combat systems, skill/gem/loot systems, baked battle map runtime replacement, Unity asset import/export, enemy/encounter placement, and changing map persistence beyond backward-compatible derived visual behavior.
