## ADDED Requirements

### Requirement: Monster combat behavior is frontend-owned for play
Playable monster offense, movement, attack cadence, collision behavior, player damage, and visual feedback SHALL execute in frontend code.

#### Scenario: Frontend runs monster behavior
- **WHEN** monsters are alive in the playable battle view
- **THEN** frontend runtime SHALL update monster AI, movement, target pursuit, collision safeguards, attack readiness, attack cadence, outgoing damage, player HP or shield changes, and feedback without backend combat ticks

#### Scenario: Monster behavior effects are preserved
- **WHEN** the same monster pack, rarity, player stats, map geometry, elapsed time, and random seed are evaluated before and after migration
- **THEN** monster speed multipliers, chase behavior, aggro behavior, attack range, attack cadence, damage type, hit kind, outgoing damage, mitigation results, and feedback timing SHALL remain equivalent

### Requirement: Frontend owns monster definitions for play
Playable monster type, base HP, movement speed, body size, collision radius, attack configuration, drop references, sprite keys, palette keys, visual keys, and rarity multipliers SHALL be frontend-owned data.

#### Scenario: Monster data loads without backend
- **WHEN** the playable WebApp creates runtime monsters
- **THEN** it SHALL resolve all monster configuration from frontend-owned data included in or loaded by the WebApp build

#### Scenario: Backend monster state is not authoritative
- **WHEN** monsters move, attack, take damage, lose HP, die, or trigger feedback during normal play
- **THEN** backend monster state SHALL NOT be required, polled, or used to overwrite frontend runtime state
