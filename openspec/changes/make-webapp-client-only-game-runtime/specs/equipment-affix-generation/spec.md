## ADDED Requirements

### Requirement: Equipment and affix gameplay data is frontend-owned
Playable equipment sources, affix pools, tier generation, rarity affix counts, prefix/suffix capacity, advanced/pinnacle caps, crafting rules, and runtime stat contributions SHALL be available in frontend-owned data/runtime.

#### Scenario: Frontend resolves equipment effects
- **WHEN** the playable WebApp creates equipment, displays equipment, crafts equipment, applies equipment stats, or calculates final player/skill effects
- **THEN** it SHALL resolve equipment and affix behavior from frontend-owned data and frontend-owned runtime code without backend equipment generation or backend affix services

#### Scenario: Equipment effects are preserved
- **WHEN** the same equipment source, rarity, level, affix pools, tier rules, random seed, crafting request, and current item state are evaluated before and after migration
- **THEN** base affix selection, ordinary affix count, prefix/suffix capacity, generated tier values, affix candidates, advanced caps, pinnacle caps, resulting affixes, and runtime stat contributions SHALL remain equivalent

### Requirement: Backend equipment logic is tooling only
Backend equipment and affix logic SHALL remain outside the playable normal-play path and SHALL be limited to import/export tooling, report generation, legacy comparison, or migration scaffolding when retained.

#### Scenario: Playable path avoids backend equipment APIs
- **WHEN** normal play needs equipment generation, crafting, affix inspection, stat calculation, or skill contribution
- **THEN** the playable WebApp SHALL NOT call backend equipment or affix APIs for that gameplay behavior
