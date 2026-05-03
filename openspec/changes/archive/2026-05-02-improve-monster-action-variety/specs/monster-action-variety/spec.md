## ADDED Requirements

### Requirement: Per-monster animation phase variation
Runtime monster animation SHALL support stable per-monster timing offsets so groups do not animate in lockstep.

#### Scenario: Monsters use different animation phases
- **WHEN** multiple monsters are visible and using the same animation state
- **THEN** the runtime SHALL allow each monster to resolve its animation frame from a stable per-monster phase offset

#### Scenario: Animation phase remains stable
- **WHEN** a monster remains alive across multiple frames
- **THEN** its animation phase offset SHALL remain stable and SHALL NOT be regenerated every render

### Requirement: Per-monster chase variation
Runtime monster chase behavior SHALL support small stable per-monster speed variation without changing authored combat stats.

#### Scenario: Active monsters chase with slight variation
- **WHEN** active monsters move toward the player
- **THEN** each monster MAY use a stable movement speed scale within a narrow configured range

#### Scenario: Variation does not change collision or damage
- **WHEN** movement speed variation is applied
- **THEN** monster collision radius, HP, damage taken, skill targeting, and authored spawn count SHALL remain unchanged

### Requirement: Per-monster attack timing variation
Runtime monster attack presentation SHALL support small stable timing variation to avoid synchronized attack beats.

#### Scenario: Attack visuals do not all start together
- **WHEN** multiple monsters satisfy attack visual range checks at nearly the same time
- **THEN** their attack visual start or cooldown timing SHALL allow small per-monster variation

#### Scenario: Attack timing variation preserves range checks
- **WHEN** attack timing variation is applied
- **THEN** existing attack range and screen-range checks SHALL still determine whether an attack visual can start

### Requirement: Monster attack size stability
Monster attack presentation SHALL NOT make the monster visually shrink below its baseline render scale.

#### Scenario: Attack playback preserves baseline size
- **WHEN** a monster plays an attack animation
- **THEN** the rendered monster scale SHALL remain at or above the same baseline size used by idle and walk playback

#### Scenario: Attack motion remains expressive
- **WHEN** attack scale shrink is prevented
- **THEN** the attack presentation MAY still use translation, rotation, lunge, swipe, or non-shrinking scale effects
