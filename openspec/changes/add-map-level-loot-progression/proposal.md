## Why

The project now has backend equipment generation/crafting, map construction, monster packs, and playable skill gems, but the playable loop still lacks a coherent map-level loot progression system. This change establishes the full loot-run experience: early growth maps, post-60 Timemark-style endgame maps, monster scaling, equipment/gem/map-entry drops, and backend-canonical reward generation.

## What Changes

- Add a player-facing map progression model with free repeatable `起始区域 I`, gated later growth areas, and post-60 Timemark stages.
- Add backend map-run context for `map_id`, `stage_id`, `map_level`, `monster_level`, `timemark`, `loot_profile`, and reward bonuses.
- Add configured monster scaling curves driven by map stage and monster level while reusing existing monster rarity multipliers.
- Replace the gem-only combat drop contract with a generic loot drop contract that can represent gems, equipment, and map entries.
- Extend loot generation so monster deaths may produce zero, one, or multiple drops depending on map stage, monster rarity, boss state, player stats, and loot profile.
- Add equipment drops that reuse canonical `EquipmentGenerator.generate(source, level, rarity)` and existing affix tier unlock gates.
- Add gem drops whose item level is derived from map level instead of being fixed at level 1.
- Add map-entry drops that sustain progression from `起始区域 II` onward and create the Timemark loop after level 60.
- Add the player-facing main-screen and map-selection UI needed to choose unlocked growth areas, Timemark stages, map entries, and the free `起始区域 I` fallback.
- Add automatic save/load for player progression, unlocked maps, map entries, inventory, equipment, board state, and current run-safe state.
- Ensure the playable WebApp consumes backend-canonical map run, monster, combat, and loot results rather than recalculating real gameplay outcomes in frontend-only runtime code.

## Capabilities

### New Capabilities

- `map-level-loot-progression`: Defines player-facing growth map stages, Timemark stages, map-run context, monster-level scaling, generic loot tables, map-entry rules, and the backend-canonical loot-run loop.

### Modified Capabilities

- `v1-minimal-sudoku-gem-loop`: Changes the loot requirement from gem-only drops to generic backend-canonical loot drops while preserving gem pickup and inventory behavior.
- `procedural-monster-spawn-v1`: Changes monster spawn output requirements so playable map runs can be represented by backend-canonical monster instances and scaling context, with frontend logic limited to rendering/adapting canonical results.
- `equipment-affix-generation`: Clarifies that dropped equipment item level comes from map-run reward context and continues to gate equipment affix tiers through the existing level rules.

## Impact

- Affected backend code: `src/liufang/loot.py`, `src/liufang/combat.py`, `src/liufang/web_api.py`, `src/liufang/equipment.py`, likely new map progression/runtime helpers and save-state helpers under `src/liufang/`.
- Affected configs: new or extended map progression, loot table, monster scaling, and map-entry drop configs under `configs/`.
- Affected frontend code: main screen, map-selection UI, playable WebApp map/battle state, loot display, pickup handling, and any current frontend-only real gameplay map spawn/drop mirrors.
- Affected tests: loot runtime, combat kill drops, equipment drop level/tier gates, gem drop levels, map-entry progression, monster scaling, WebApp API, and playable WebApp visual verification.
- No new external dependency is expected.
