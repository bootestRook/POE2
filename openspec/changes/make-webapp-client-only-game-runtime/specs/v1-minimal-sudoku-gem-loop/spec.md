## ADDED Requirements

### Requirement: V1 loop is client-owned in playable WebApp
The V1 minimal loop SHALL execute as a frontend-owned single-player loop in the playable WebApp.

#### Scenario: Board to battle loop stays frontend
- **WHEN** the player views inventory, inspects gems, mounts or unmounts gems, previews final skill effects, starts combat, kills monsters, receives drops, picks up drops, and returns to board adjustment
- **THEN** the playable WebApp SHALL complete the loop using frontend-owned data, frontend-owned calculation, frontend-owned combat, frontend-owned loot, and frontend-owned persistence without backend gameplay APIs

#### Scenario: Existing V1 effects are preserved
- **WHEN** V1 gem board routing, active/passive/support contributions, final active skill calculation, combat release, loot, inventory, or Chinese presentation is migrated to frontend ownership
- **THEN** the migrated frontend behavior SHALL preserve the existing effective outputs and player-visible outcomes for the same state, seed, and inputs

### Requirement: Final skill calculation is frontend-owned for play
The playable WebApp SHALL calculate final active skill effects from frontend-owned gem, board, equipment, affix, and skill data.

#### Scenario: Final skill instance remains equivalent
- **WHEN** the same valid board, inventory, equipment, gem levels, affixes, and source data are evaluated before and after migration
- **THEN** the frontend-owned final skill calculation SHALL produce equivalent final damage, damage components, tags, cooldowns, release intervals, resource values, projectile parameters, area parameters, chain parameters, duration parameters, status parameters, VFX keys, and Chinese descriptions

#### Scenario: Backend finalization is not required
- **WHEN** the playable WebApp needs final active skill data for preview or combat
- **THEN** it SHALL calculate that data in frontend code and SHALL NOT require backend final-skill APIs, backend config loaders, backend `SkillRuntime`, or backend `CombatSession`

### Requirement: Playable combat loop is frontend-owned
The playable WebApp SHALL run automatic active skill release, monster kills, drops, pickup, and return-to-board flow in frontend code.

#### Scenario: Automatic skill release uses frontend runtime
- **WHEN** combat is running and the board has valid active skill gems
- **THEN** frontend runtime SHALL release those active skills according to the same final cooldown, speed, trigger, and resource values used before migration

#### Scenario: Loot and inventory remain equivalent
- **WHEN** monsters die and drops are picked up after migration
- **THEN** frontend runtime SHALL generate, display, pick up, and persist drops with the same drop rules, rarity rules, item/gem identity rules, and inventory state changes as before migration

### Requirement: V1 WebApp no longer reuses backend rules for play
The playable WebApp SHALL NOT call backend rule adapters for sudoku legality, board relationships, skill final effects, combat results, loot drops, or inventory updates during normal play.

#### Scenario: Frontend rule implementation is the playable rule path
- **WHEN** the WebApp needs sudoku legality, board relationships, skill final effects, combat results, loot drops, inventory updates, or state persistence
- **THEN** it SHALL use frontend-owned rule modules that are included in the WebApp build

#### Scenario: Backend comparison is temporary tooling only
- **WHEN** backend implementations are retained during migration
- **THEN** they SHALL be used only by tests, reports, import/export tools, or legacy comparison tooling and SHALL NOT be called by the playable WebApp normal-play path
