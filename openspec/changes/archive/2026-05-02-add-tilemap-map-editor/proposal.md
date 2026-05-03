# Add Tilemap Map Editor

## Why

The current battle map flow is built around baked masks and procedural blockout data. That is useful for runtime verification, but it makes authoring maps slow because changing a room or corridor requires editing generated data or image masks.

We need a Unity Tilemap-style editor entry where a designer can paint a small set of dungeon tiles directly, test scale with the playable character, and derive walkable/blocker data from tile semantics.

## What Changes

- Add an independent `/map-editor` entry separate from battle, map debug, sprite test, and skill editor flows.
- Provide a grid-based tilemap canvas with ground and wall tile choices.
- Support single-cell fill/clear and rectangle fill/clear.
- Allow adjusting the cell unit size used by the editor map.
- Show a movable player character in the editor scene as a size reference.
- Derive walkable and blocker grids from tile semantics instead of asking the user to paint separate masks.
- Prevent monster, elite, boss, or enemy spawn generation in the first version.

## Out Of Scope

- Monster placement and generation.
- Boss, elite, exit, loot, or encounter authoring.
- Persisting maps to server-side project files.
- Importing or exporting Unity Tilemap assets.
- Replacing the existing baked battle map runtime.

## Impact

Allowed implementation scope:

- `webapp/App.tsx`
- `webapp/styles.css`
- `webapp/smoke-test.mjs`

Do not modify:

- Combat, skill, gem, loot, affix, or sudoku systems.
- Existing baked map assets.
- Monster spawn logic except to keep it out of the map editor entry.
