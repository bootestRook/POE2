## Why

V1 already defines a broad player stat vocabulary and a simplified hit damage formula, but the current skill calculation only consumes routed gem modifiers and leaves player base stats, tag-based damage pools, critical expectation, and preview DPS semantics partially disconnected. Connecting the formula to the existing stat pool makes board changes, player stats, support/passive routing, and skill preview use one explainable runtime path.

## What Changes

- Add a V1 skill stat aggregation path that combines player base stats with active skill modifiers, routed passive/support modifiers, and conduit-amplified routed values before final skill output.
- Extend V1 hit damage calculation to read generic, hit, damage-type, elemental, source-tag, and behavior-tag additive pools from the aggregated stat context.
- Add explicit V1 critical expectation output for skills that can crit, while preserving non-critical hit damage as a clear intermediate value.
- Align skill preview DPS with the V1 formula by using expected hit damage, uses-per-second, and a non-shotgun `HitCoverageFactor` instead of directly multiplying single-target DPS by projectile count.
- Wire source/target board power stats into routed relation scaling so existing row/column/box power stats affect routed modifier values.
- Preserve V1 non-goals: no full defense calculation, DoT formula, damage conversion matrix, minion damage formula, or full ailment damage implementation.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `v1-minimal-sudoku-gem-loop`: Skill final effect calculation and preview requirements change to use the V1 damage formula against the existing player stat pool and routed gem modifiers.

## Impact

- Affected code: `src/liufang/skill_effects.py`, `src/liufang/presentation.py`, `src/liufang/web_api.py`, and focused tests under `tests/`.
- Affected data/contracts: `configs/player/player_base_stats.toml`, `configs/player/player_stat_defs.toml`, `configs/skills/skill_scaling_rules.toml`, active Skill Package scaling metadata, and existing skill preview API fields.
- Runtime impact: skill preview and combat damage will become sensitive to V1-active player stats, tag pools, board power stats, and critical expectation fields.
- UI impact: skill preview/tooltips should expose the new formula outputs clearly without treating projectile count as automatic single-target DPS multiplication.
