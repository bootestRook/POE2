## Why

Current skill-gem tests cover selected examples and several newer runtime mechanics, but they do not systematically prove whether every support gem takes effect or correctly does not take effect for every matching active and passive gem. This matters now because the adopted TLIDB content set has expanded to 16 active, 9 passive, and 36 support gems, making manual sample coverage too weak for regression safety.

## What Changes

- Add a matrix-based test workflow for support gem effects across active skill gems and passive skill gems.
- Require eligibility checks to use explicit gem filters (`target_kinds`, `tags_any`, `tags_all`, `tags_none`) and then verify whether each support's concrete stats can actually affect the target.
- Require runtime-level assertions for supports that change combat behavior, not only config payload or `applied_modifiers` presence.
- Require passive-target support tests to distinguish "filter matches but no compatible passive stat" from actual support-to-passive effect.
- Keep the skill editor and disabled test arena out of the verification path; WebApp/playable battle verification remains required for frontend-affecting changes.
- Do not change skill balance, TLIDB source values, VFX assets, frontend layout, or sudoku routing rules as part of this change.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `v1-minimal-sudoku-gem-loop`: Add acceptance requirements for comprehensive active/passive/support gem effect matrix testing through canonical calculation and runtime paths.

## Impact

- Affected tests: skill effect calculation tests, runtime/combat tests, WebApp runtime event tests, and any new matrix report or fixture tests.
- Affected code if implementation is needed: likely focused test helpers around `GemInventory`, `SudokuGemBoard`, `SkillEffectCalculator`, `V1WebAppApi.runtime_skill_events`, and `CombatSession`.
- No production gameplay behavior, public API, config schema, VFX, or frontend UI behavior is intended to change.
