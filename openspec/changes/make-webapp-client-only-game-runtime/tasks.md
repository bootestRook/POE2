## 1. Boundary And Baseline

- [x] 1.1 Add static boundary tests that identify every playable WebApp call to backend gameplay APIs, including runtime skill events, combat ticks, backend state mutation, backend spawn, backend loot, backend map runtime, backend equipment, and backend final-skill calculation.
- [x] 1.2 Add seeded baseline fixtures for current effective outputs: final skill parameters, gem routing, equipment affix results, map spawn results, monster behavior parameters, loot results, and save-relevant state.
- [x] 1.3 Add a migration guard test proving implementation tasks do not intentionally change skill/equipment/monster/map/drop numbers, trigger conditions, cooldown semantics, resource semantics, target policies, durations, tick intervals, or reward rules.
- [x] 1.4 Document the current backend gameplay call graph used by the playable WebApp so each dependency can be removed deliberately.

## 2. Frontend Data Ownership

- [x] 2.1 Create frontend-owned data module boundaries for player defaults, gems, skills, supports, passives, equipment, affixes, maps, monsters, spawns, loot, rewards, localization, and visual keys.
- [x] 2.2 Mechanically convert or expose existing playable config/TLIDB/map/monster/equipment data into frontend-loadable modules or static assets without changing values.
- [x] 2.3 Add frontend data validation tests for IDs, references, tags, map references, monster references, drop references, affix references, and localization keys.
- [x] 2.4 Add equivalence tests comparing frontend-loaded data against the current playable baseline fixtures.

## 3. Frontend Gem, Skill, Equipment, And Affix Calculation

- [x] 3.1 Move sudoku legality, board relationships, source/target/relation/power routing, support-to-active, support-to-passive, and passive-to-active calculation into frontend-owned modules.
- [x] 3.2 Move final active skill calculation into frontend-owned modules while preserving final damage, components, tags, cooldowns, release intervals, resource values, projectile parameters, area parameters, chain parameters, duration parameters, status parameters, VFX keys, and Chinese descriptions.
- [x] 3.3 Move playable equipment generation, affix selection, crafting rules, and equipment stat contribution into frontend-owned modules without changing affix pools, tier rules, rarity counts, caps, or stat effects.
- [x] 3.4 Replace playable WebApp preview/combat final-skill dependencies on backend adapters with frontend calculation.
- [x] 3.5 Add equivalence tests for representative and full matrix gem/skill/equipment outputs against seeded baseline fixtures.

## 4. Frontend Skill Runtime And Presentation

- [x] 4.1 Create a frontend skill runtime that owns skill release, cooldowns, resource handling, target selection, projectile behavior, chain behavior, area behavior, orbit behavior, melee behavior, status behavior, damage calculation, HP updates, deaths, floating text, VFX scheduling, and audio hooks.
- [x] 4.2 Port each existing active skill family into the frontend runtime without changing counts, trajectories, timing semantics, target policies, damage values, status values, durations, tick intervals, or visual intent.
- [x] 4.3 Remove playable WebApp dependency on `/api/runtime/skill-events` and backend-generated `SkillEvent` timelines.
- [x] 4.4 Add frontend runtime tests for projectile, chain, nova/area, orbit/duration, melee, guard, status, forced movement, kill-triggered, floating text, and hit VFX behavior.
- [x] 4.5 Run playable WebApp browser verification for representative skill families and save screenshots under `artifacts/screenshots/`.

## 5. Frontend Map, Monster, Combat, Loot, And Progress Runtime

- [x] 5.1 Move playable map dimensions, tile data, walkability, blockers, collision, spawn points, boss points, exits, authored spawn plans, and procedural spawn profiles into frontend-owned map runtime/data.
- [x] 5.2 Move procedural zone analysis, spawn filtering, monster pack selection, rarity selection, boss placement, fallback behavior, and Chinese spawn debug output into frontend code without changing spawn effects.
- [x] 5.3 Move monster definitions, HP, speed, body size, collision radius, attack configuration, drop references, sprite keys, palette keys, visual keys, rarity multipliers, AI, movement, collision safeguards, attack cadence, outgoing damage, player HP/shield updates, and feedback into frontend code.
- [x] 5.4 Move loot generation, reward generation, pickup, inventory updates, map progress, and related feedback into frontend code without changing drop/reward effects.
- [x] 5.5 Remove playable WebApp dependency on backend combat tick, backend map run, backend monster state, backend HP updates, backend kill resolution, backend loot, and backend progress mutation.
- [x] 5.6 Add seeded equivalence tests for spawn, monster behavior, player damage, monster damage taken, HP/death, loot, rewards, pickup, and progress.
- [x] 5.7 Run playable WebApp browser verification for map entry, monster packs, monster attacks, kills, drops, pickup, and progress; save screenshots under `artifacts/screenshots/`.

## 6. Frontend Persistence

- [x] 6.1 Implement versioned frontend persistence for inventory, equipment, board layout, player progress, map progress, drops/rewards, settings, and other normal play state using localStorage or IndexedDB.
- [x] 6.2 Add save migration tests for current and previous frontend save schema versions.
- [x] 6.3 Replace normal-play backend save/load dependency with frontend persistence.
- [x] 6.4 Add Chinese recovery messaging for invalid or incompatible local saves.

## 7. Backend Demotion And Cleanup

- [x] 7.1 Mark remaining Python gameplay systems as legacy/tooling/comparison only, or remove them after frontend equivalence is proven.
- [x] 7.2 Keep import/export/report scripts only where they serve development tooling and do not drive the playable WebApp.
- [x] 7.3 Update tests that previously treated backend canonical runtime as playable acceptance evidence so they either become migration comparison tests or are replaced by frontend runtime tests.
- [x] 7.4 Add final static boundary tests proving normal playable WebApp code has no backend gameplay dependency.

## 8. Final Verification

- [x] 8.1 Build the WebApp and verify it can run as a standalone/static single-player game without backend gameplay APIs.
- [x] 8.2 Run frontend unit/integration tests, migrated equivalence tests, static boundary tests, and any remaining backend tooling tests that are still relevant.
- [x] 8.3 Run actual playable WebApp browser verification across board editing, skill preview, combat, representative skill families, monster combat, loot pickup, map progress, and save/load.
- [x] 8.4 Store final screenshots under `artifacts/screenshots/` and describe what is visible in each verification screenshot.
- [x] 8.5 Confirm no root-level screenshots, logs, server output, or generated verification artifacts were created.
