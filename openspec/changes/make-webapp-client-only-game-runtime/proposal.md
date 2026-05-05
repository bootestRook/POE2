## Why

The playable game is a single-player WebApp, but its current moment-to-moment gameplay is split across frontend code, Python combat/session APIs, and backend-generated skill events. This creates poor skill feel, slow iteration, and unnecessary architecture for a client-only game.

## What Changes

- **BREAKING**: Make the playable WebApp a standalone client-side game runtime.
- **BREAKING**: Stop requiring backend `SkillRuntime`, `CombatSession`, runtime skill event APIs, backend combat ticks, backend monster spawning, backend map runtime, or backend loot/runtime APIs for normal play.
- Move playable game content ownership to the frontend, including skills, gems, equipment, affixes, maps, collision, spawn plans, monster definitions, monster AI, damage, HP, kills, drops, rewards, map progress, and save state.
- Replace backend-canonical skill/event consumption in the playable WebApp with a frontend-owned gameplay runtime and presentation runtime.
- Keep Python/backend code only as optional development tooling, legacy compatibility, data import/export, or migration scaffolding; it must not drive the playable WebApp.
- Make offline/static WebApp play a first-class acceptance requirement.
- Preserve existing gameplay effects exactly during migration: skill/equipment/monster/map/drop numbers, trigger conditions, timing semantics, target policies, and player-visible outcomes must not be intentionally rebalanced or redesigned by this change.

## Capabilities

### New Capabilities
- `client-only-game-runtime`: Defines the standalone frontend game runtime boundary, data ownership, persistence expectations, and backend exclusion rules for playable WebApp.

### Modified Capabilities
- `v1-minimal-sudoku-gem-loop`: Change the V1 loop so WebApp rules, gem/skill calculation, combat, loot, inventory, and presentation are owned by the frontend instead of backend/adapters.
- `procedural-monster-spawn-v1`: Move playable map zone analysis, spawn configuration, spawn filtering, monster pack instantiation, rarity, and debug output to frontend-owned runtime/data.
- `monster-pack-combat-behavior`: Move playable monster offense, movement, attack cadence, and player damage application to frontend-owned runtime.
- `equipment-affix-generation`: Move playable equipment affix loading, generation, crafting, and runtime stat contribution to frontend-owned data/runtime.

## Impact

- Affected frontend: `webapp/App.tsx`, frontend data modules, frontend runtime modules, persistence layer, WebApp build/static play path, browser verification.
- Affected backend: `src/liufang/skill_runtime.py`, `src/liufang/combat.py`, `src/liufang/web_api.py`, backend state/combat/runtime endpoints, Python tests that currently assert backend canonical gameplay.
- Affected configs/data: playable config files currently under `configs/`, generated TLIDB-derived data, map data, monster data, loot/drop data, equipment/affix data.
- Affected tests: backend canonical runtime tests must stop being acceptance evidence for playable behavior; frontend unit/integration tests and playable WebApp screenshot verification become required for gameplay changes.
