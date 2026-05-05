## ADDED Requirements

### Requirement: Equipped Equipment Effects Enter Playable Runtime
The playable V1 loop SHALL consume mapped equipment affix effects through backend canonical player stat, skill calculation, and combat runtime paths.

#### Scenario: Equipped player stats affect combat player state
- **WHEN** the player enters combat with equipped items whose mapped affixes grant player runtime stats
- **THEN** Combat Runtime SHALL initialize or update the player using stat values aggregated from base stats, supported passive stats, and equipped equipment affix modifiers

#### Scenario: Equipped skill stats affect final skill instances
- **WHEN** final active skill instances are calculated while equipment affix modifiers are active
- **THEN** `SkillEffectCalculator` SHALL include mapped equipment skill modifiers in the same canonical stat context used for support, passive, and player stat contributions

#### Scenario: Equipped event hooks affect canonical skill events
- **WHEN** an equipped affix maps to an existing SkillRuntime or CombatSession event mechanism
- **THEN** the playable battle path SHALL produce or consume canonical backend `SkillEvent` data for that effect and SHALL NOT recalculate targets, damage, timing, trajectories, or hit results in frontend-local logic

### Requirement: Equipment Effect Frontend Boundaries
The WebApp SHALL render equipment-driven effects from backend-calculated state and canonical event streams.

#### Scenario: WebApp consumes backend equipment results
- **WHEN** equipment effects change skill preview, player stats, combat events, floating text, or battle visuals
- **THEN** the WebApp SHALL display those results from backend/API state or canonical runtime events rather than implementing a separate equipment effect simulator

#### Scenario: Frontend verification uses playable battle view
- **WHEN** implementation changes equipment effect behavior visible in the WebApp
- **THEN** verification SHALL run the actual playable WebApp battle view and capture a screenshot under `artifacts/screenshots/`

### Requirement: Equipment Effects Do Not Change Gem Board Rules
Equipment affix effects SHALL not alter sudoku gem placement legality or gem routing unless a later explicit change defines that behavior.

#### Scenario: Equipment does not affect sudoku legality
- **WHEN** equipment affix effects are active
- **THEN** sudoku digit legality, row/column/box duplicate rules, and support/passive board routing SHALL remain governed by gem board rules and SHALL NOT use equipment affixes as board cells or routing sources
