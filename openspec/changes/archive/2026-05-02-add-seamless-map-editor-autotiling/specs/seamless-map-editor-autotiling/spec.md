## ADDED Requirements

### Requirement: Semantic Autotile Derivation
The map editor SHALL derive visual autotile states from the existing semantic tile grid without requiring saved map files to store per-cell visual masks.

#### Scenario: Adjacent same-kind ground derives connected state
- **WHEN** two or more orthogonally adjacent cells are `ground`
- **THEN** the editor SHALL classify those cells as connected ground for visual rendering

#### Scenario: Saved map omits visual masks
- **WHEN** the editor saves a map after autotile rendering is enabled
- **THEN** the saved map document SHALL keep tile intent in `tiles` and SHALL NOT require per-cell edge, corner, or neighbor-mask fields

### Requirement: Seamless Same-Kind Terrain Rendering
The map editor SHALL render same-kind connected terrain without mandatory per-cell seams in the tile artwork.

#### Scenario: Ground region renders without permanent borders
- **WHEN** adjacent `ground` cells are visible in the editor scene
- **THEN** their tile artwork SHALL render without always-on borders or inset outlines between those cells

#### Scenario: Editing grid remains separate from artwork
- **WHEN** the editor displays grid, selection, or collision debugging affordances
- **THEN** those affordances SHALL be rendered as separate overlays rather than as permanent tile artwork seams

### Requirement: Derived Transition States
The map editor SHALL derive visible transition states where ground, wall, and empty cells meet.

#### Scenario: Ground next to empty derives edge state
- **WHEN** a `ground` cell has an orthogonally adjacent `empty` cell
- **THEN** the editor SHALL expose a derived edge state for that ground cell in the direction of the empty neighbor

#### Scenario: Ground next to wall derives boundary state
- **WHEN** a `ground` cell has an orthogonally adjacent `wall` cell
- **THEN** the editor SHALL expose a derived boundary state for that ground cell in the direction of the wall neighbor

#### Scenario: Corner neighbors derive corner state
- **WHEN** a visible cell has neighboring cells that form an inner or outer corner transition
- **THEN** the editor SHALL expose a derived corner state that can be styled independently from straight edges

### Requirement: Autotiling Does Not Change Movement Rules
The map editor SHALL keep collision and movement behavior based on semantic tile kind and collider configuration, not derived visual autotile state.

#### Scenario: Visual edge does not change walkability
- **WHEN** a `ground` cell is rendered with a derived edge or corner state
- **THEN** player walkability SHALL remain governed by the `ground` tile collider configuration

#### Scenario: Wall remains blocking regardless of visual state
- **WHEN** a `wall` cell is rendered with any derived visual transition state
- **THEN** player movement SHALL continue to treat it according to the `wall` tile collider configuration

### Requirement: Map Editor Autotile Verification
The map editor SHALL include automated verification for autotile derivation and seamless rendering contracts.

#### Scenario: Smoke test detects derived visual states
- **WHEN** the WebApp smoke test opens `/map-editor`
- **THEN** it SHALL verify that visible cells expose derived autotile state for connected interiors, edges, or corners

#### Scenario: Build remains valid
- **WHEN** the map editor autotiling change is implemented
- **THEN** the WebApp build and map editor smoke test SHALL pass
