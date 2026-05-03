## ADDED Requirements

### Requirement: Independent Tilemap Map Editor Entry
V1 WebApp SHALL provide an independent map editor entry for hand-authored tilemap editing.

#### Scenario: Open map editor route
- **WHEN** the user opens `/map-editor`
- **THEN** the app SHALL show the map editor instead of the battle scene, skill editor, sprite test scene, or map selection panel

#### Scenario: No monsters in first editor version
- **WHEN** the map editor is open
- **THEN** the editor SHALL NOT generate monsters, enemies, elites, boss units, or monster spawn controls

### Requirement: Tilemap Paint Tools
The map editor SHALL allow Unity Tilemap-style painting with a small tile set.

#### Scenario: Select tile brush
- **WHEN** the user selects a brush
- **THEN** the editor SHALL allow choosing ground or wall tiles

#### Scenario: Single-cell fill and clear
- **WHEN** the user clicks a map cell in fill or clear mode
- **THEN** the editor SHALL update only that cell to the selected tile or empty state

#### Scenario: Rectangle fill and clear
- **WHEN** the user drags from one map cell to another in rectangle mode
- **THEN** the editor SHALL fill or clear every cell inside the selected rectangle

#### Scenario: Adjust cell unit size
- **WHEN** the user changes the cell size control
- **THEN** the editor SHALL resize the map cells and use the new value as the map unit size

### Requirement: Derived Walkable And Blocker Layers
The map editor SHALL derive walkable and blocker behavior from tile semantics in the first version.

#### Scenario: Ground is walkable
- **WHEN** a cell contains a ground tile
- **THEN** the editor SHALL treat that cell as walkable

#### Scenario: Wall and empty cells block movement
- **WHEN** a cell contains a wall tile or is empty
- **THEN** the editor SHALL treat that cell as blocked for the player reference character

### Requirement: Movable Player Scale Reference
The map editor SHALL show a movable player character in the editable scene.

#### Scenario: Player appears in editor
- **WHEN** the map editor opens
- **THEN** the editor SHALL render the existing player character animation as a scale reference inside the editable grid

#### Scenario: Player movement respects derived walkability
- **WHEN** the user moves the player reference character with keyboard input
- **THEN** the character SHALL move through ground cells and stop at wall or empty cells
