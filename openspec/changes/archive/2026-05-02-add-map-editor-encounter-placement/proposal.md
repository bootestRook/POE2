## Why

The map editor can author terrain, collision, and player spawn data, but it cannot author monster encounters or boss placement. Designers need encounter points in the map editor so dark ARPG-style maps can start with pre-authored enemy packs already distributed across the level instead of relying on runtime timer spawning.

## What Changes

- Add an encounter editing mode to `/map-editor` where WASD moves the editor view instead of the player reference character.
- Gate encounter placement tools behind edit mode so normal map preview movement remains available when edit mode is off.
- Add a monster spawn placement tool that opens a small context menu over the clicked map area, initially offering `新增怪点`.
- Allow placed monster spawn points to be moved, resized with a circular range control, assigned a placeholder monster type, and configured with monster count and density.
- Add boss point/group placement where multiple candidate boss locations can be authored, but each map entry randomly selects only one boss group to spawn.
- Allow each boss group to contain one or more placeholder boss selections, with the boss count controlling how many dropdowns are shown.
- Replace normal battle timer spawning for authored maps with encounter initialization that samples all configured monsters at match start, while preserving performance through spatial indexing, activation tiers, and view-based rendering.

## Capabilities

### New Capabilities

- `map-editor-encounter-placement`: Covers edit mode behavior, monster spawn point authoring, boss group authoring, saved map encounter data, and runtime initialization/performance contracts for pre-authored encounters.

### Modified Capabilities

- `v1-minimal-sudoku-gem-loop`: V1 WebApp battle entry must consume authored encounter data when present and avoid relying on timer-based monster spawning for those maps.

## Impact

- Affected areas: `webapp/App.tsx` map editor state, map editor toolbar/stage interactions, map JSON persistence, battle enemy initialization, runtime enemy update/render budgeting, and smoke coverage in `webapp/smoke-test.mjs`.
- The first implementation may use placeholder monster IDs such as `enemy_imp` and `enemy_brute` until a formal monster/BOSS configuration table is added.
- Existing map JSON files must remain loadable by normalizing missing encounter data to empty arrays.
- Current seamless/autotiling work remains separate; this change should not alter tile visual derivation except where encounter overlays are rendered above the map.
