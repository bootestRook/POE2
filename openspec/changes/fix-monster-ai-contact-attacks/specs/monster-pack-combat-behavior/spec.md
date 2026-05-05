## ADDED Requirements

### Requirement: Monster attack state is runtime-owned
Monster melee attack readiness, cooldown state, active attack window, and player hit application SHALL be owned by the runtime enemy/combat update loop rather than by visual synchronization.

#### Scenario: Stationary player is hit on cadence
- **WHEN** an aggro-locked living monster is already in melee range of a stationary living player and the monster attack cooldown is ready
- **THEN** the runtime combat update SHALL apply one monster hit to the player without requiring player movement

#### Scenario: Render synchronization does not own hits
- **WHEN** enemy visual synchronization runs for renderable enemies
- **THEN** it SHALL NOT be the authoritative place that starts attack cooldowns or applies monster damage to the player

#### Scenario: Non-rendered aggro monster keeps combat timing
- **WHEN** an aggro-locked monster remains alive and in the runtime enemy list
- **THEN** its melee attack readiness SHALL continue to advance from runtime combat time even if presentation filtering changes whether it is rendered

## MODIFIED Requirements

### Requirement: Aggro-locked monsters charge directly
Aggro-locked monsters SHALL chase the player's current position directly and SHALL NOT use player-body repulsion, ring-position targeting, or close-range avoidance-style side steering to avoid the player.

#### Scenario: Close-range chase targets player
- **WHEN** an aggro-locked monster is within close range of the player
- **THEN** its movement target SHALL remain the player's current world position rather than a ring slot around the player

#### Scenario: No player repulsion
- **WHEN** an aggro-locked monster overlaps or nearly overlaps the player's body radius
- **THEN** the movement solver SHALL NOT add a force that intentionally moves the monster away from the player

#### Scenario: No close-range side avoidance
- **WHEN** an aggro-locked monster is outside melee range but close enough to approach contact directly
- **THEN** the movement solver SHALL NOT select tangential steering that preserves or increases its distance from the player when a direct walkable approach is available

#### Scenario: Collision safeguards remain
- **WHEN** multiple aggro-locked monsters charge the player
- **THEN** enemy-enemy separation and wall collision safeguards MAY still prevent impossible overlap or blocked-terrain traversal

### Requirement: Monster melee attack cadence
Monsters SHALL damage the player through runtime-owned melee attack cadence rather than continuous per-frame proximity damage or visual-synchronization side effects.

#### Scenario: Hit requires attack readiness
- **WHEN** a monster is aggro-locked, alive, in melee range, and its runtime attack cooldown is ready
- **THEN** the monster SHALL be able to start an attack that schedules or applies one player damage hit for that attack cycle

#### Scenario: No frame damage
- **WHEN** a monster remains in melee range across multiple frames during one attack cooldown
- **THEN** the runtime SHALL NOT apply monster damage every frame

#### Scenario: Player movement is not required
- **WHEN** the player provides no movement input while a ready aggro-locked monster is in melee range
- **THEN** the monster attack cadence SHALL still apply its hit through the runtime combat update
