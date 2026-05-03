## Context

The current `/map-editor` stores author intent as `empty`, `ground`, and `wall` cells and renders visible cells as absolutely positioned buttons with CSS background images. This keeps editing simple, but it also means every cell is visually independent: borders, per-cell overlays, and static floor/wall backgrounds prevent a painted region from reading as continuous dungeon terrain.

Unity Tilemap-style seamlessness comes from a combination of grid-aligned rendering, tileable art, and neighbor-aware sprite selection. This change should add those properties to the existing editor without turning the saved map format into an authored visual-mask format.

## Goals / Non-Goals

**Goals:**

- Render same-kind adjacent ground cells as continuous floor without mandatory seams.
- Derive wall/ground/empty transition variants from neighboring cells at render time.
- Keep `tiles` as the source of truth for saved map files.
- Preserve current paint, rectangle fill, clear, spawn placement, collider editing, minimap, and player walkability behavior.
- Add smoke/build verification for derived autotile states and the absence of always-on cell borders in seamless mode.

**Non-Goals:**

- Importing Unity Tilemap assets or matching Unity serialization.
- Replacing the baked battle map runtime.
- Adding monster, encounter, loot, boss, or exit placement.
- Reworking combat, skill, gem, loot, affix, or Sudoku systems.
- Requiring designers to manually paint edge or corner tile kinds.

## Decisions

### Derive Visual Masks From Tile Semantics

For each visible map editor cell, derive a compact neighbor mask from the eight surrounding cells. The model remains `empty | ground | wall`; helper functions decide whether a neighbor is same-kind, ground-like, blocked, or void-like.

Alternative considered: store per-cell visual variants in map JSON. That would make maps harder to edit, create stale data when neighboring cells change, and duplicate information already derivable from `tiles`.

### Use Layered Rendering Instead Of Permanent Cell Borders

Tile artwork should not include the editing grid. The editor may keep a separate grid/selection/debug overlay, but seamless terrain mode must render tile cells without mandatory per-cell borders or inset outlines.

Alternative considered: keep CSS borders and tune opacity. That still creates visible seams by design and does not solve the core continuity problem.

### Start With Runtime CSS/Asset Variants Before Larger Atlas Work

The first implementation can use existing map-editor floor/wall images plus derived CSS classes or data attributes for same-kind interior, straight edges, outer corners, inner corners, and transition states. If replacement bitmap assets are needed, they should be narrowly scoped to map-editor terrain and validated visually.

Alternative considered: introduce a full tileset atlas and atlas parser immediately. That is more powerful, but it is larger than the current editor needs and increases the risk of unrelated asset churn.

### Keep Collision Independent From Visual Autotiling

Walkability and collision should continue to use tile semantics plus the existing collider configuration. Derived visual variants must not alter whether a cell blocks movement.

Alternative considered: infer collision from derived edge/corner visuals. That couples rendering to movement rules and would make debugging author intent harder.

## Risks / Trade-offs

- Missing or non-tileable source art -> Use a small editor-specific replacement asset set or CSS fallback states, and verify with screenshots/smoke selectors before calling the change complete.
- Derived masks could be expensive on the full 256 x 144 map -> Derive only for visible bounds or memoize derived rows keyed by `tiles`, matching the current visible-cell rendering strategy.
- Editor grid may become harder to see after removing borders -> Provide a separate grid overlay/debug state so editing affordances remain clear without being baked into tile art.
- Existing local maps may contain only sparse or sample layouts -> Keep file format backward compatible and normalize missing data through existing loaders.

## Migration Plan

No saved map migration is required. Existing map JSON files continue to load because they already store semantic `tiles`, `cellSize`, `spawn`, and `colliders`.

Rollback is limited to disabling the derived visual class/data attribute path and restoring the previous static tile classes; map data remains unchanged.

## Open Questions

- Should the first pass target only top-down map-editor floor/wall assets, or also reuse isometric dungeon floor assets from `assets/battle/tiles/cropped/` when they are present?
- Should seamless mode be always on, or should the editor expose a visual debug toggle for raw cell boundaries?
