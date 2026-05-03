## ADDED Requirements

### Requirement: Encounter runtime wake staggering
When an authored monster spawn point or boss group enters aggro range, the runtime SHALL support staggered wake timing for monsters belonging to that encounter source.

#### Scenario: Monster group wakes over a short random window
- **WHEN** the player enters the aggro range for an authored monster spawn point
- **THEN** monsters from that spawn point SHALL become eligible to chase after individual random delays within 1 second

#### Scenario: Boss group wakes over a short random window
- **WHEN** the player enters the aggro range for an authored boss group
- **THEN** monsters from that boss group SHALL become eligible to chase after individual random delays within 1 second

#### Scenario: Waiting monsters do not chase early
- **WHEN** an encounter monster has been triggered but its wake time has not arrived
- **THEN** that monster SHALL remain idle or alert-idle and SHALL NOT perform chase movement

#### Scenario: Wake staggering does not change authored encounter data
- **WHEN** runtime wake delays are assigned
- **THEN** the saved map document, spawn radius, aggro radius, monster count, and boss selections SHALL remain unchanged
