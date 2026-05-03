## Why

The current skill content is project-invented and no longer matches the desired direction: first-version combat should use Torchlight: Infinite skills and their verified card values as the source of truth. This change replaces the old active/support/passive product content with a curated TLIDB-sourced skill set that still works with the project's automatic combat and sudoku gem board.

## What Changes

- **BREAKING**: Do not keep the existing project skill gems as first-version product content; existing skill packages may only be used as runtime/config examples during migration.
- Adopt a TLIDB-sourced first-version content set:
  - 16 active skills suitable for automatic release.
  - 30 support skills, mapped into the existing support categories.
  - 9 passive/aura skills, modeled as passive skill gems.
  - 3 project-owned board conduit supports remain as sudoku-board differentiators.
- Treat TLIDB card values as level 20 anchors and generate skill level tables for levels 1-40.
- Keep player-facing gem levels at 1-20; reserve 21-40 for +level effects and future advanced variants.
- Preserve sudoku-board uniqueness: TLIDB values define base effects, while board relations route and scale those effects.
- Exclude first-version skills that do not fit automatic release, including pure movement, potions, complex summons, and strongly manual timing skills.
- Add implementation tasks for data import, validation, runtime adaptations, UI/report updates, and tests.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `v1-minimal-sudoku-gem-loop`: Replace first-version skill gem content requirements with TLIDB-sourced active/support/passive gems, level-table handling, automatic-release adaptation, and sudoku-board relation scaling.

## Impact

- Content data under `configs/skills/`, `configs/gems/`, and `configs/localization/zh_cn.toml`.
- Skill loading/validation for source values, level tables, TLIDB identifiers, and level 1-40 calculated values.
- Skill effect calculation and runtime event generation for TLIDB mechanics and automatic-release adaptations.
- Sudoku board support routing for 30 TLIDB support skills plus existing board conduit supports.
- Web UI and reports that display skill levels, TLIDB source values, final routed values, and adopted/omitted scope.
- Tests for configuration validation, skill level tables, support routing, automatic release behavior, and representative build combinations.
