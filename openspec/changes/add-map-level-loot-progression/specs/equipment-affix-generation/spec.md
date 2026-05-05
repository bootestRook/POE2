## ADDED Requirements

### Requirement: Dropped Equipment Item Level
Equipment dropped from map runs SHALL derive its item level from backend map-run reward context while continuing to use existing equipment generation, affix tier, rarity, capacity, advanced, and pinnacle rules.

#### Scenario: Map drop calls equipment generator
- **WHEN** Loot Runtime creates an equipment drop
- **THEN** it SHALL call the canonical equipment generator with source, item level, and rarity
- **AND** it SHALL NOT duplicate equipment affix tier selection logic in Loot Runtime

#### Scenario: Item level gates affix tiers
- **WHEN** dropped equipment has item level 40, 58, 68, 76, 82, 86, or 100
- **THEN** generated ordinary affix candidates SHALL follow the existing tier unlock rules for that equipment level

#### Scenario: Pinnacle remains special reward
- **WHEN** a normal map monster generates equipment below item level 100
- **THEN** the equipment generator SHALL NOT include pinnacle affixes
- **AND** item level 100 equipment SHALL only be possible when the map-run reward context explicitly grants that reward level
