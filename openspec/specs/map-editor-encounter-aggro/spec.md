# map-editor-encounter-aggro Specification

## Purpose
TBD - created by archiving change extend-map-editor-encounter-aggro. Update Purpose after archive.
## Requirements
### Requirement: Encounter aggro range authoring
The map editor SHALL allow designers to configure a separate aggro/search range for each monster spawn point and boss group.

#### Scenario: Configure monster aggro range
- **WHEN** a monster spawn point is selected in edit mode
- **THEN** the editor SHALL expose an editable aggro range value separate from the spawn radius

#### Scenario: Configure boss aggro range
- **WHEN** a boss group is selected in edit mode
- **THEN** the editor SHALL expose an editable aggro range value separate from the boss spawn radius

#### Scenario: Adjust aggro range on the map
- **WHEN** the user adjusts an encounter point's aggro range handle on the map
- **THEN** the editor SHALL update that point's aggro range without changing its spawn radius or center point

#### Scenario: Show separate range rings
- **WHEN** monster spawn points or boss groups are visible in edit mode
- **THEN** the editor SHALL render spawn range and aggro range as visually distinct rings

### Requirement: Encounter aggro data persistence
The map editor SHALL persist aggro range data in map JSON while preserving compatibility with existing maps.

#### Scenario: Save aggro ranges
- **WHEN** the user saves a map with configured monster or boss aggro ranges
- **THEN** the saved map document SHALL include those aggro ranges in the corresponding `spawnPlans` entries

#### Scenario: Load map without aggro ranges
- **WHEN** an existing map JSON file has monster or boss points without aggro range fields
- **THEN** the editor SHALL load the map successfully and normalize those points with safe default aggro ranges

#### Scenario: Shift map preserves aggro data
- **WHEN** the user shifts the whole map
- **THEN** encounter center points SHALL shift with the map while aggro range values SHALL remain unchanged

### Requirement: Monster spawn random count multiplier authoring
The map editor SHALL allow each monster spawn point to define a random count multiplier interval.

#### Scenario: Configure decimal multiplier range
- **WHEN** a monster spawn point is selected
- **THEN** the editor SHALL expose editable minimum and maximum count multiplier values that support decimal input

#### Scenario: Normalize multiplier order
- **WHEN** the user enters a multiplier minimum greater than the multiplier maximum
- **THEN** the editor SHALL normalize the interval into a valid ordered range before runtime use

#### Scenario: Preserve explicit boss counts
- **WHEN** a boss group is selected
- **THEN** the editor SHALL keep boss count controlled by explicit boss selections and SHALL NOT require random count multiplier controls for that boss group

### Requirement: Encounter jump navigation
The map editor SHALL provide a list control for selecting authored encounter points and jumping the editor view to their positions.

#### Scenario: List monster and boss points
- **WHEN** the encounter panel is shown
- **THEN** the editor SHALL list authored monster spawn points and boss groups with enough type and position information to distinguish them

#### Scenario: Jump to selected encounter
- **WHEN** the user selects an encounter from the list
- **THEN** the editor SHALL select that encounter and pan the editor view to its map position

#### Scenario: Jump list does not modify map data
- **WHEN** the user changes the selected encounter through the jump list
- **THEN** the editor SHALL NOT change terrain tiles, spawn values, boss selections, or saved encounter data except for normal selection state

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
