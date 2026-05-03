## ADDED Requirements

### Requirement: Runtime pack-shared aggro lock
Runtime encounter aggro SHALL treat each authored or procedural aggro source as shared hatred for all living monsters created from that source.

#### Scenario: Source trigger locks whole pack
- **WHEN** the player enters an encounter aggro source radius
- **THEN** every living monster with that source id SHALL become aggro-locked

#### Scenario: Aggro lock does not leash by distance
- **WHEN** a monster has become aggro-locked
- **THEN** moving the player outside the original aggro radius SHALL NOT clear that monster's aggro lock

#### Scenario: Aggro lock resets on battle reset
- **WHEN** a new battle starts or runtime enemies are recreated
- **THEN** previous aggro source trigger state SHALL be cleared for the new battle

#### Scenario: Dead monsters do not retain active aggro behavior
- **WHEN** an aggro-locked monster dies
- **THEN** that monster SHALL no longer chase or attack the player
