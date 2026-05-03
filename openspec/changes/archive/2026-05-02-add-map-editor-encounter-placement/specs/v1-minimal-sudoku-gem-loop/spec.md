## ADDED Requirements

### Requirement: Authored encounter runtime initialization
V1 WebApp battle runtime SHALL initialize enemies from authored map encounter data when that data is present.

#### Scenario: Use authored monster spawns
- **WHEN** a battle starts on a map with authored monster spawn points
- **THEN** the runtime SHALL sample monster positions from those spawn points at match start

#### Scenario: Do not use timer spawning for authored encounters
- **WHEN** authored monster spawn data exists for the current map
- **THEN** the runtime SHALL NOT rely on the normal timer-based enemy spawning loop for those authored monsters

#### Scenario: Use fallback spawning only without authored encounters
- **WHEN** a battle starts on a map without authored encounter data
- **THEN** the runtime MAY preserve the existing fallback spawning behavior

### Requirement: Runtime spatial indexing for authored enemies
V1 WebApp battle runtime SHALL use spatial indexing for authored enemies so runtime cost does not require scanning every monster every frame.

#### Scenario: Query nearby enemies through spatial index
- **WHEN** runtime systems need nearby enemies for activation, targeting, movement, or area damage
- **THEN** they SHALL query a spatial index or chunk structure instead of requiring a full enemy-list scan

#### Scenario: Update index when enemy moves or dies
- **WHEN** an active enemy changes chunk or is removed
- **THEN** the runtime SHALL update the spatial index so future queries remain correct

### Requirement: Runtime activation tiers for authored enemies
V1 WebApp battle runtime SHALL separate authored enemies into simulation and rendering tiers.

#### Scenario: Distant enemies remain lightweight
- **WHEN** authored enemies are far from the player and irrelevant to active skills
- **THEN** they SHALL remain dormant or low-frequency records without per-frame AI, movement, animation, or DOM rendering

#### Scenario: Nearby enemies become active
- **WHEN** authored enemies enter the configured activation range or become relevant to skill targeting
- **THEN** they SHALL be promoted into an active simulation tier

#### Scenario: Visible enemies render
- **WHEN** active or nearby enemies are inside or near the viewport
- **THEN** they SHALL be eligible for visual rendering

#### Scenario: Offscreen enemies avoid rendering cost
- **WHEN** enemies are outside the visible or near-visible area
- **THEN** the runtime SHALL avoid rendering individual DOM nodes for those enemies

### Requirement: Authored boss group runtime selection
V1 WebApp battle runtime SHALL select at most one authored boss group when a map is entered.

#### Scenario: Randomly select one boss group
- **WHEN** a map contains multiple authored boss groups
- **THEN** the runtime SHALL randomly select one group for that map entry

#### Scenario: Spawn all bosses in chosen group
- **WHEN** a boss group is selected
- **THEN** the runtime SHALL spawn every boss configured in that group inside the group's authored area

#### Scenario: Do not spawn unchosen boss groups
- **WHEN** one boss group has been selected
- **THEN** bosses from unchosen boss groups SHALL NOT spawn during that map entry

### Requirement: Authored encounter performance contract
V1 WebApp battle runtime SHALL support dark ARPG-style high monster counts without imposing an authoring-time hard cap.

#### Scenario: No authoring cap as performance substitute
- **WHEN** authored encounter data requests many monsters
- **THEN** runtime performance SHALL be handled through indexing, activation tiers, low-frequency updates, and view-based rendering rather than rejecting the data solely because the count is large

#### Scenario: Preserve gameplay correctness under optimization
- **WHEN** enemies move between dormant, aware, active, visible, or dead tiers
- **THEN** enemy HP, death, drops, skill targeting, and damage results SHALL remain consistent with the enemies that are logically present on the map

#### Scenario: Report placement shortfall
- **WHEN** runtime sampling cannot place every requested monster on valid walkable positions inside a spawn area
- **THEN** the runtime SHALL surface a debug warning or notice instead of silently pretending every requested monster was placed
