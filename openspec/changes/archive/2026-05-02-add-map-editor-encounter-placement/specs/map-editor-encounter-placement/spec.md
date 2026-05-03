## ADDED Requirements

### Requirement: Map editor edit mode
The map editor SHALL provide an edit mode that changes keyboard movement from player-reference movement to editor-view movement.

#### Scenario: Edit mode moves the view
- **WHEN** edit mode is enabled and the user presses W, A, S, or D outside text inputs
- **THEN** the editor SHALL pan the map view and SHALL NOT move the player reference character

#### Scenario: Preview mode moves the player reference
- **WHEN** edit mode is disabled and the user presses W, A, S, or D outside text inputs
- **THEN** the editor SHALL preserve the existing player-reference movement behavior

### Requirement: Encounter tools require edit mode
The map editor SHALL allow encounter placement tools only while edit mode is enabled.

#### Scenario: Encounter tool disabled outside edit mode
- **WHEN** edit mode is disabled
- **THEN** monster spawn and boss group placement controls SHALL be unavailable or inert

#### Scenario: Encounter tool enabled in edit mode
- **WHEN** edit mode is enabled
- **THEN** the editor SHALL allow the user to choose an encounter placement tool

### Requirement: Monster spawn context placement
The map editor SHALL support adding monster spawn points through a small map-area context menu.

#### Scenario: Open monster spawn context menu
- **WHEN** edit mode is enabled, the monster spawn placement tool is active, and the user clicks the map area
- **THEN** the editor SHALL show a small context menu at that map location with an `新增怪点` action

#### Scenario: Add monster spawn point
- **WHEN** the user chooses `新增怪点`
- **THEN** the editor SHALL create a monster spawn point centered at the clicked map location

### Requirement: Monster spawn authoring controls
The map editor SHALL allow each monster spawn point to be moved, resized, assigned a placeholder monster type, and configured with count and density.

#### Scenario: Adjust monster spawn circle
- **WHEN** the user selects a monster spawn point
- **THEN** the editor SHALL show a circular range control whose radius can be adjusted

#### Scenario: Move monster spawn point
- **WHEN** the user drags a selected monster spawn point
- **THEN** the editor SHALL update the spawn point center without modifying terrain tiles

#### Scenario: Configure monster spawn values
- **WHEN** the user edits a selected monster spawn point
- **THEN** the editor SHALL expose monster type, monster count, and density controls

#### Scenario: Placeholder monster options
- **WHEN** the monster type dropdown is shown before formal monster tables exist
- **THEN** the editor SHALL offer placeholder options including `enemy_imp` and `enemy_brute`

### Requirement: Boss group placement
The map editor SHALL support authoring multiple candidate boss groups while selecting only one group for runtime map entry.

#### Scenario: Author multiple boss groups
- **WHEN** edit mode is enabled
- **THEN** the editor SHALL allow multiple boss group locations to be authored on the same map

#### Scenario: Configure boss count
- **WHEN** the user changes a boss group's boss count
- **THEN** the editor SHALL show the same number of boss selection dropdowns for that group

#### Scenario: Spawn bosses from one group
- **WHEN** a map containing multiple boss groups is entered at runtime
- **THEN** the runtime SHALL randomly choose one boss group and spawn only the bosses configured in that chosen group

#### Scenario: Bosses share one group area
- **WHEN** a chosen boss group contains multiple boss selections
- **THEN** all bosses from that group SHALL spawn inside the same configured boss area

### Requirement: Encounter data persistence
The map editor SHALL persist encounter data in map JSON without breaking existing maps.

#### Scenario: Save encounter data
- **WHEN** the user saves a map after adding monster spawns or boss groups
- **THEN** the saved map document SHALL include encounter data for those points and groups

#### Scenario: Load map without encounter data
- **WHEN** an existing map JSON file has no encounter data
- **THEN** the editor SHALL load it successfully with empty monster spawn and boss group lists

#### Scenario: Shift map preserves encounter alignment
- **WHEN** the user shifts the whole map
- **THEN** authored monster spawn points and boss groups SHALL shift with the terrain and player spawn point

### Requirement: High-count encounter authoring
The map editor SHALL NOT impose a hard authoring cap on the number of monsters requested by encounter points.

#### Scenario: Large count remains valid authoring data
- **WHEN** the user enters a large monster count for a spawn point
- **THEN** the editor SHALL preserve that requested count as authoring data rather than rejecting it only because it is large

#### Scenario: Density does not multiply count
- **WHEN** the user sets both monster count and density
- **THEN** the final requested monster count SHALL come from the count field, while density SHALL control placement compactness or spacing
