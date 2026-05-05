## Why

The project is ready to move beyond gem-only loot into equipment progression. Equipment needs deterministic, testable rules for TLIDB-derived base affixes, generated affix tiers, drop generation, and crafting so later combat/stat integration can consume one canonical equipment model.

## What Changes

- Add equipment base types for strength, dexterity, and wisdom armor pieces; one-handed weapons, two-handed weapons, shields; and accessory slots.
- Import or parse TLIDB equipment affix data from `tlidb_equips/tlidb_craft_affixes.md` into runtime-readable equipment affix definitions.
- Define equipment rarity rules: white has the fixed base affix only, blue adds 1-2 normal affixes, purple adds 3-5, and pink targets 6.
- Enforce fixed base affixes for every equipment item; base affix tiers are not gated by equipment level.
- Enforce equipment-level prefix/suffix capacity from 1-10 through 81+.
- Generate missing T2-T7 initial and advanced affix tiers by reverse-scaling existing T1 values, unlock levels, and weights.
- Enforce at most 3 prefixes, 3 suffixes, 2 advanced affixes, and 2 pinnacle affixes per equipment item.
- Add random drop generation and crafting APIs that use the same canonical rules.
- Add focused tests for tier unlocks, weights, slot capacity, rarity affix counts, base affix behavior, advanced/pinnacle caps, and probability-sensitive candidate pools.

## Capabilities

### New Capabilities
- `equipment-affix-generation`: Defines equipment types, affix pools, tier scaling, random generation, and crafting behavior for equipment.

### Modified Capabilities
- `v1-minimal-sudoku-gem-loop`: Relax the previous V1-only exclusion of equipment for this new equipment progression capability while keeping gem board, skill runtime, and battle skill event generation unchanged.

## Impact

- New backend equipment data model and generator modules under `src/liufang/`.
- New or extended config loading for TLIDB equipment affix definitions.
- New tests under `tests/` for equipment generation and crafting.
- No frontend battle runtime change is required for the initial equipment generator/crafting rules.
