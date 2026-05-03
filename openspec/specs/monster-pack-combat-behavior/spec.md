# monster-pack-combat-behavior Specification

## Purpose
TBD - created by archiving change add-monster-pack-chase-damage. Update Purpose after archive.
## Requirements
### Requirement: Monster offense attributes
Runtime monsters SHALL have explicit offense attributes compatible with the existing player combat stat vocabulary.

#### Scenario: Runtime enemy includes offense context
- **WHEN** a monster is created from procedural spawn pack data
- **THEN** the runtime enemy SHALL include base damage, damage type, hit kind, attack range, attack cadence, and any available damage modifiers needed to compute its outgoing hit

#### Scenario: Offense attributes use shared stat ids
- **WHEN** monster damage modifiers are configured or materialized into runtime data
- **THEN** modifier ids SHALL use existing player stat ids where applicable, such as `damage_add_percent`, damage-type add percent stats, hit-kind damage add percent stats, `damage_final_percent`, and `resistance_penetration_percent`

#### Scenario: Safe default offense
- **WHEN** a monster or pack lacks explicit offense attributes beyond the existing pack damage value
- **THEN** the runtime SHALL treat the monster as a physical melee attack using the pack damage value and rarity damage multiplier

### Requirement: Monster hits use player defensive counterplay
Monster damage to the player SHALL be resolved against the player's defensive attributes instead of directly subtracting raw damage from life.

#### Scenario: Player defense reduces incoming monster hit
- **WHEN** an aggro-locked monster lands a melee hit on the player
- **THEN** the final player damage SHALL account for the monster's damage type and hit kind and the player's relevant block, resistance, physical damage reduction, final mitigation, energy shield, and life values

#### Scenario: Damage type selects resistance
- **WHEN** a monster hit uses fire, cold, lightning, chaos, or physical damage
- **THEN** the player's corresponding resistance or physical reduction rules SHALL affect the final damage using the same semantics as player incoming hit resolution

#### Scenario: Hit kind selects block type
- **WHEN** a monster hit declares `hit_kind = attack`
- **THEN** the player's attack block attributes SHALL be used for block mitigation

#### Scenario: Monster damage feedback
- **WHEN** a monster hit reduces player shield or life
- **THEN** the runtime SHALL update player HP/shield state and present damage feedback through existing battle UI channels such as combat logs or floating text

### Requirement: Aggro-locked monsters charge directly
Aggro-locked monsters SHALL chase the player's current position directly and SHALL NOT use player-body repulsion or ring-position targeting to avoid the player.

#### Scenario: Close-range chase targets player
- **WHEN** an aggro-locked monster is within close range of the player
- **THEN** its movement target SHALL remain the player's current world position rather than a ring slot around the player

#### Scenario: No player repulsion
- **WHEN** an aggro-locked monster overlaps or nearly overlaps the player's body radius
- **THEN** the movement solver SHALL NOT add a force that intentionally moves the monster away from the player

#### Scenario: Collision safeguards remain
- **WHEN** multiple aggro-locked monsters charge the player
- **THEN** enemy-enemy separation and wall collision safeguards MAY still prevent impossible overlap or blocked-terrain traversal

### Requirement: Monster melee attack cadence
Monsters SHALL damage the player through a melee attack cadence rather than continuous per-frame proximity damage.

#### Scenario: Hit requires attack readiness
- **WHEN** a monster is aggro-locked, alive, in melee range, and its attack cooldown is ready
- **THEN** the monster SHALL be able to start an attack that schedules or applies one player damage hit for that attack cycle

#### Scenario: No frame damage
- **WHEN** a monster remains in melee range across multiple frames during one attack cooldown
- **THEN** the runtime SHALL NOT apply monster damage every frame

### Requirement: Baseline monster speed multiplier
Monster chase speed SHALL be doubled for the first tuning pass.

#### Scenario: Normal monster speed doubles
- **WHEN** a normal runtime monster chases the player
- **THEN** its baseline chase speed SHALL be twice the previous normal monster baseline

#### Scenario: Boss monster speed doubles
- **WHEN** a boss runtime monster chases the player
- **THEN** its baseline chase speed SHALL be twice the previous boss monster baseline
