## ADDED Requirements

### Requirement: Procedural spawn runtime is frontend-owned for play
Playable map zone analysis, spawn filtering, monster pack selection, rarity selection, and monster instantiation SHALL execute in frontend code.

#### Scenario: Frontend generates playable spawns
- **WHEN** the player starts or enters a playable map
- **THEN** the frontend runtime SHALL derive zone types, filter spawn points, select monster packs, apply rarity rules, instantiate monsters, and expose Chinese debug output without backend spawn services

#### Scenario: Spawn effects are preserved
- **WHEN** the same map data, spawn profile, monster pack data, rarity rules, random seed, and player spawn are evaluated before and after migration
- **THEN** accepted spawn points, rejected spawn reasons, pack budget use, pack identities, monster counts, rarity upgrades, boss placement, and fallback behavior SHALL remain equivalent

### Requirement: Map runtime data is frontend-owned
Playable map dimensions, tile data, walkability, blockers, collision, spawn points, boss points, exits, authored spawn plans, and procedural spawn profiles SHALL be available to the frontend without backend runtime services.

#### Scenario: Frontend resolves map traversal and spawn constraints
- **WHEN** the playable WebApp evaluates movement, collision, zone types, or spawn legality
- **THEN** it SHALL use frontend-owned map data and SHALL NOT call backend map runtime APIs

#### Scenario: Existing map editor compatibility remains
- **WHEN** existing map/editor data is migrated or loaded for play
- **THEN** tile format, spawn format, collider format, authored spawn fallback, and visible map behavior SHALL remain compatible with existing authored content
