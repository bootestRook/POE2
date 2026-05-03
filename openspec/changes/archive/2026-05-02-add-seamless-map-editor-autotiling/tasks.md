## 1. Autotile Derivation

- [x] 1.1 Add map-editor helper types for derived autotile state, including interior, edge, boundary, inner-corner, and outer-corner signals.
- [x] 1.2 Implement neighbor-mask derivation from visible `tiles` without changing saved map JSON.
- [x] 1.3 Add focused unit-style or smoke-accessible checks that same-kind ground cells classify as connected terrain.

## 2. Seamless Rendering

- [x] 2.1 Update `MapEditorTileCells` to expose derived visual state through class names or `data-*` attributes for each visible cell.
- [x] 2.2 Refactor map-editor CSS so tile artwork has no mandatory per-cell border or inset outline between same-kind connected cells.
- [x] 2.3 Move grid, selection, and debug visuals into separate overlays or state-specific classes so editing affordances do not become terrain seams.
- [x] 2.4 Add or adjust narrowly scoped map-editor terrain assets only if existing floor/wall images cannot render acceptable connected interiors and transitions.

## 3. Transition States

- [x] 3.1 Style ground-to-empty edge states for north, south, east, and west neighbors.
- [x] 3.2 Style ground-to-wall boundary states independently from ground-to-empty edges.
- [x] 3.3 Style inner-corner and outer-corner transition states so room and corridor corners read consistently.

## 4. Behavior Preservation

- [x] 4.1 Verify paint, rectangle fill, clear, spawn placement, minimap, and file save/load behavior remain compatible with existing maps.
- [x] 4.2 Verify player movement and collision still use semantic tile kind plus collider configuration, not visual autotile state.
- [x] 4.3 Ensure existing map files load without migration and save without new required visual-mask fields.

## 5. Verification

- [x] 5.1 Extend `webapp/smoke-test.mjs` to cover derived autotile state on `/map-editor`.
- [x] 5.2 Run WebApp build and record the result.
- [x] 5.3 Run map editor smoke test and record the result.
- [x] 5.4 Run `openspec validate add-seamless-map-editor-autotiling --strict` and record the result.
