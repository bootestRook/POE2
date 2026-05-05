## ADDED Requirements

### Requirement: Playable WebApp runs without backend gameplay services
The playable WebApp SHALL be a standalone client-side game runtime for normal play.

#### Scenario: Static build starts normal play
- **WHEN** the production WebApp build is served as static frontend assets without the Python backend gameplay APIs
- **THEN** the player SHALL be able to load a save or start a run, enter the playable battle view, use skills, fight monsters, receive drops, update progress, and save progress without calling backend combat, skill runtime, map runtime, monster runtime, loot runtime, or config runtime APIs

#### Scenario: Backend runtime APIs are excluded from normal play
- **WHEN** the playable WebApp executes normal gameplay
- **THEN** it SHALL NOT call `/api/runtime/skill-events`, `/api/combat/tick`, backend `SkillRuntime`, backend `CombatSession`, backend monster spawning, backend loot generation, backend map runtime, or backend equipment/skill calculation services

### Requirement: Frontend owns all playable game data
The playable WebApp SHALL own the data needed for normal play inside frontend-loadable modules or static assets.

#### Scenario: Frontend loads game content
- **WHEN** the playable WebApp initializes
- **THEN** it SHALL load or import player defaults, gem definitions, skill definitions, support/passive definitions, equipment definitions, affix pools, map definitions, collision data, spawn plans, monster definitions, drop tables, reward rules, localization, and visual keys from frontend-owned data

#### Scenario: Backend data providers are not required
- **WHEN** normal play needs skill, equipment, map, monster, loot, reward, or localization data
- **THEN** the WebApp SHALL resolve that data from frontend-owned data and SHALL NOT require a backend request to provide it

### Requirement: Frontend owns all playable game logic
The playable WebApp SHALL execute all moment-to-moment game logic in frontend code.

#### Scenario: Frontend resolves combat
- **WHEN** gameplay is running
- **THEN** the frontend SHALL resolve skill release, cooldowns, resources, target selection, hit resolution, projectile behavior, chain behavior, area behavior, orbit behavior, melee behavior, status behavior, monster AI, monster movement, monster attacks, damage, HP updates, deaths, loot, rewards, map progress, and feedback timing

#### Scenario: Backend is not a gameplay authority
- **WHEN** the frontend updates gameplay state during normal play
- **THEN** no backend service SHALL validate, approve, recalculate, or overwrite hit legality, cooldowns, resource use, damage, HP, death, loot, map progress, monster AI, or skill behavior

### Requirement: Migration preserves existing gameplay effects
The migration SHALL preserve existing gameplay effects and player-visible outcomes unless a later explicit balancing change modifies them.

#### Scenario: Equivalent seeded gameplay
- **WHEN** the same initial player state, board state, equipment state, map state, monster state, random seed, and input timeline are run through the migrated frontend runtime
- **THEN** final skill parameters, skill timings, damage values, target policies, monster HP changes, deaths, drops, rewards, and map progress SHALL match the pre-migration behavior

#### Scenario: No incidental effect changes
- **WHEN** this change is implemented
- **THEN** skill/equipment/monster/map/drop numbers, trigger conditions, cooldown semantics, resource semantics, projectile counts, chain counts, area sizes, durations, tick intervals, status values, spawn budgets, rarity multipliers, and reward rules SHALL NOT be intentionally changed

### Requirement: Frontend persistence replaces backend play-state persistence
Normal single-player play SHALL persist through frontend-owned storage.

#### Scenario: Save and load locally
- **WHEN** the player changes inventory, equipment, board layout, map progress, drops, rewards, settings, or other normal play state
- **THEN** the WebApp SHALL save and load that state through versioned frontend persistence such as localStorage or IndexedDB without requiring backend persistence

#### Scenario: Save schema is migratable
- **WHEN** a saved frontend payload is loaded after a schema version change
- **THEN** the WebApp SHALL either migrate the payload to the current version or present a Chinese player-visible recovery message without corrupting the save

### Requirement: Playable verification uses frontend runtime
Acceptance evidence for gameplay SHALL come from the frontend-owned playable WebApp runtime.

#### Scenario: Browser verification for gameplay changes
- **WHEN** implementation changes gameplay, battle presentation, VFX timing, unit visuals, map visuals, targeting guides, damage areas, loot feedback, or save/load behavior
- **THEN** verification SHALL run the actual playable WebApp in a browser and store screenshots under `artifacts/screenshots/`

#### Scenario: Disabled tooling is not acceptance evidence
- **WHEN** gameplay behavior is verified
- **THEN** `/skill-editor`, `?skill_editor=1`, `view=skill_editor`, port `8765`, `dist-skill-editor`, disabled test arenas, and backend-only runtime tests SHALL NOT be used as acceptance evidence for playable behavior
