## 1. Encounter Data Model

- [x] 1.1 Add map editor encounter types for monster spawn points, boss groups, and normalized encounter state.
- [x] 1.2 Extend map editor saved state and file document creation to include optional encounter data.
- [x] 1.3 Normalize missing or malformed encounter data from existing map JSON files to empty lists and safe defaults.
- [x] 1.4 Ensure create-new, reset, load, local auto-save, and file save flows preserve encounter data.
- [x] 1.5 Ensure whole-map shifting also shifts monster spawn points and boss groups.

## 2. Edit Mode And Camera Controls

- [x] 2.1 Add a visible edit-mode toggle to `/map-editor`.
- [x] 2.2 Split keyboard handling so WASD moves the player reference when edit mode is off.
- [x] 2.3 Add editor camera pan state so WASD pans the view when edit mode is on.
- [x] 2.4 Preserve current typing-target guards so inputs, selects, and text fields do not trigger movement.
- [x] 2.5 Verify player collision preview still works when edit mode is off.

## 3. Monster Spawn Authoring

- [x] 3.1 Add a monster spawn placement tool that is available only in edit mode.
- [x] 3.2 Add a map-area context menu for the placement tool with an `鏂板鎬偣` action.
- [x] 3.3 Create monster spawn points at the clicked map position with default radius, placeholder monster ID, count, and density.
- [x] 3.4 Render monster spawn circles above the tile layer without changing tile paint behavior.
- [x] 3.5 Add selection, drag-to-move, and radius adjustment interactions for monster spawn points.
- [x] 3.6 Add selected-spawn controls for placeholder monster type, count, and density.
- [x] 3.7 Keep monster count authoring unrestricted by hard caps while validating numeric safety and non-negative values.

## 4. Boss Group Authoring

- [x] 4.1 Add boss group placement and selection UI in edit mode.
- [x] 4.2 Render boss group circles distinctly from normal monster spawn circles.
- [x] 4.3 Add boss group controls for radius, boss count, and placeholder boss dropdowns.
- [x] 4.4 Make boss count control the number of visible boss dropdowns in the selected group.
- [x] 4.5 Persist multiple boss group candidates in map JSON.

## 5. Runtime Encounter Initialization

- [x] 5.1 Add runtime helpers to sample monster positions from authored circular spawn ranges using count and density.
- [x] 5.2 Validate sampled positions against walkable map data and surface warnings for placement shortfall.
- [x] 5.3 Initialize authored map monsters at battle start as lightweight enemy records.
- [x] 5.4 Disable timer-based spawning for authored monster encounters while preserving fallback spawning when no authored data exists.
- [x] 5.5 Randomly select one boss group on map entry and spawn every configured boss in that group.
- [x] 5.6 Ensure unchosen boss groups do not spawn during the same map entry.

## 6. Runtime Performance

- [x] 6.1 Add a spatial chunk index for authored enemies.
- [x] 6.2 Route activation, nearby enemy lookup, skill targeting, and area damage through the spatial index where practical.
- [x] 6.3 Add dormant, aware, active, visible, and dead runtime tiers for authored enemies.
- [x] 6.4 Update only active enemies every frame and use lower-frequency or no updates for distant tiers.
- [x] 6.5 Render only visible or near-visible enemies to avoid per-monster DOM cost for distant authored enemies.
- [x] 6.6 Keep enemy HP, death, drops, targeting, and damage correctness stable across tier transitions.

## 7. Verification

- [x] 7.1 Extend WebApp smoke coverage for edit-mode WASD behavior and encounter tool gating.
- [x] 7.2 Extend WebApp smoke coverage for monster spawn creation, persistence, and reload normalization.
- [x] 7.3 Extend WebApp smoke coverage for boss group count-driven dropdowns and single-group runtime selection.
- [x] 7.4 Add targeted runtime checks for authored encounter initialization without timer spawning.
- [x] 7.5 Add performance-oriented checks or debug assertions proving large authored counts use indexing/tiers instead of full per-frame scans.
- [x] 7.6 Run `npm run build`.
- [x] 7.7 Run `npm test`.
- [x] 7.8 Run `openspec validate add-map-editor-encounter-placement --strict`.
