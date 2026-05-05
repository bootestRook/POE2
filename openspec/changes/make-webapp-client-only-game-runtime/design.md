## Context

The playable WebApp currently depends on backend systems for normal gameplay: Python `SkillRuntime` emits skill events, `CombatSession` owns combat state, backend APIs provide runtime skill events and combat ticks, and tests treat backend canonical behavior as acceptance evidence. That shape is wrong for a single-player WebApp and is a direct cause of poor skill feel.

The target is a client-only game runtime. The frontend owns all playable content, gameplay state, combat resolution, map runtime, monster runtime, loot, rewards, and save state. Backend code can remain for development tooling, legacy comparison, data import/export, or temporary migration support, but it cannot drive normal play.

The user constraint is strict: this change migrates ownership only. It must not rebalance, redesign, simplify, remove, or change any existing gameplay effect.

## Goals / Non-Goals

**Goals:**
- Make the built playable WebApp run as a standalone single-player game without backend runtime APIs.
- Move playable skill, gem, equipment, affix, map, monster, combat, loot, reward, progress, and save ownership into frontend code/data.
- Preserve existing skill/equipment/monster/map/drop effects exactly during the migration.
- Replace backend-canonical acceptance for playable behavior with frontend runtime tests and playable WebApp browser verification.
- Keep migration steps small enough to compare old and new behavior before backend runtime calls are removed from the playable path.

**Non-Goals:**
- No effect rebalance.
- No skill redesign.
- No monster AI redesign.
- No map redesign.
- No drop table redesign.
- No new online/multiplayer/server-authoritative model.
- No use of the disabled skill editor as verification evidence.

## Decisions

### Decision: WebApp owns the game runtime

Playable WebApp code SHALL become the source of truth for normal play. Skills, cooldowns, resource use, target selection, hit resolution, damage, HP, deaths, loot, rewards, map progress, monster AI, and save state all execute in the frontend.

Alternative considered: keep backend damage or hit validation. Rejected because the game is single-player and the user explicitly rejected backend validation, backend HP updates, backend skill data, backend map data, and backend monster data.

### Decision: Preserve effects with equivalence snapshots

Before moving each subsystem, capture old effective outputs and expected player-visible behavior, then assert the frontend-owned implementation returns equivalent outputs for the same seed/input/state. The comparison focuses on existing effects, not file structure.

Examples of preserved outputs:
- final active skill parameters after gem/equipment modifiers
- release intervals, cooldown values, mana values, projectile counts, chain counts, area radii, durations, tick intervals, status values, and damage components
- monster spawn counts, pack composition, rarity multipliers, movement/attack cadence, damage values, and collision radius
- generated drop count, rarity, gem/equipment identity, affix rolls, and map progress effects

Alternative considered: rewrite systems directly in a cleaner frontend design and tune later. Rejected because it would change effects and make regressions impossible to separate from migration.

### Decision: Frontend data modules replace backend runtime config for playable use

Playable data SHALL live in frontend-loadable modules or static assets. Existing backend `configs/` and TLIDB-derived files may be converted mechanically into frontend data, but the playable WebApp cannot call backend config loaders during normal play.

Alternative considered: fetch configuration from local backend APIs at startup. Rejected because the final WebApp must run offline/static.

### Decision: Backend becomes tooling/legacy only

Python systems may remain temporarily as migration reference implementations, import/export tools, reports, or compatibility scaffolding. The WebApp production/playable path must not require `SkillRuntime`, `CombatSession`, `/api/runtime/skill-events`, `/api/combat/tick`, backend monster spawning, backend loot, or backend map-run runtime.

Alternative considered: delete backend first. Rejected because old behavior is still needed as a comparison oracle while preserving effects.

### Decision: Verify the actual playable WebApp

Any frontend-affecting migration step requires the actual playable WebApp battle view to run in a browser and produce screenshots under `artifacts/screenshots/`. Skill editor, disabled arenas, backend-only tests, or build success alone are not acceptance evidence.

Alternative considered: rely on unit tests and backend comparison only. Rejected because the reported problem is skill feel and visual gameplay quality.

## Risks / Trade-offs

- Effect drift during porting -> Use equivalence tests and seeded fixtures before removing each backend dependency.
- Large migration diff -> Split by subsystem: data loading, gem/skill finalization, skill runtime, monster/map runtime, loot/rewards, persistence, backend disconnection.
- Temporary duplicate logic -> Allow old backend logic only as a migration oracle; add tests proving playable WebApp stops calling it when each subsystem is complete.
- Browser storage limits or save corruption -> Use versioned frontend save schemas and migration tests for localStorage/IndexedDB payloads.
- Hidden backend dependency remains -> Add static boundary tests that fail on playable WebApp calls to runtime/combat backend APIs.
- Visual regressions despite numeric equivalence -> Require playable battle screenshots for representative projectile, chain, nova/area, orbit/duration, melee, monster attack, loot, and map progress scenarios.

## Migration Plan

1. Add boundary tests and specs proving the playable WebApp must be client-only and must preserve existing effects.
2. Introduce frontend data/runtime module boundaries without changing behavior.
3. Move gem board, skill finalization, equipment/affix contribution, and content loading to frontend-owned data while comparing final outputs to current behavior.
4. Move skill runtime and presentation to frontend-owned modules, preserving all current skill effects and visual intent.
5. Move map runtime, collision, spawn planning, monster configuration, monster AI, player damage, monster HP, death, loot, rewards, and map progress to frontend-owned modules.
6. Move save/load to frontend persistence.
7. Remove playable WebApp calls to backend runtime/combat/config APIs.
8. Keep or delete backend code only after the playable path and tests no longer depend on it.

Rollback during migration is per subsystem: keep the old backend path behind non-playable tooling or comparison fixtures until the frontend equivalent is verified, then remove the playable call site.
