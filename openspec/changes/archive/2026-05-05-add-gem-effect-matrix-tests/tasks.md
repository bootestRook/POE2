## 1. Matrix Test Foundations

- [x] 1.1 Add test helpers that load current gem definitions and classify active, passive, and support gems by `gem_kind`
- [x] 1.2 Add a reusable support filter matcher that mirrors `SkillEffectCalculator._gem_filter_matches`
- [x] 1.3 Add fixture helpers that mount active/support/passive combinations on a valid in-memory `SudokuGemBoard`
- [x] 1.4 Add diagnostic output for matrix failures including support ID, target ID, relation, expected status, and observed modifiers

## 2. Support-To-Active Coverage

- [x] 2.1 Add matrix tests proving filter-mismatched support-to-active pairs do not apply support modifiers
- [x] 2.2 Add matrix tests proving eligible scalar support-to-active pairs change the expected `FinalSkillInstance` field, skill stat, damage component, conversion, ailment, or runtime param
- [x] 2.3 Add focused tests for added damage supports across compatible hit skills and incompatible dot/guard skills
- [x] 2.4 Add focused tests for projectile, chain, area, cooldown, speed, crit, conversion, and status support families using currently loaded active gems

## 3. Support-To-Passive Coverage

- [x] 3.1 Add tests that classify eligible support-to-passive pairs as compatible effect, conduit level effect, or expected no-op
- [x] 3.2 Add tests proving compatible support-to-passive modifiers are applied before passive-to-active aggregation
- [x] 3.3 Add tests proving supported passive effects change downstream final skill output or player stat output
- [x] 3.4 Add tests proving filter-matching but stat-incompatible passive pairs are reported as expected no-effect cases

## 4. Canonical Runtime Proof

- [x] 4.1 Add or extend `SkillRuntime` tests for behavior-changing supports such as projectile count, split, bounce, chain, area, duration, channel, status, and forced movement
- [x] 4.2 Add or extend `CombatSession` tests for supports that change player or monster state, including guard, ailments, damage taken modifiers, and kill/hit follow-up behavior
- [x] 4.3 Add or extend `V1WebAppApi.runtime_skill_events` tests for canonical WebApp event output where WebApp battle rendering consumes runtime events
- [x] 4.4 Assert behavior tests do not use `SkillEditorService.run_test_arena` or disabled test arena helpers as acceptance evidence

## 5. Verification

- [x] 5.1 Run the new focused matrix tests and relevant existing runtime tests
- [x] 5.2 Run `openspec.cmd validate add-gem-effect-matrix-tests --strict` or the nearest available OpenSpec validation command
- [x] 5.3 If implementation changes frontend rendering or visible battle behavior, run the playable WebApp battle view and save screenshots under `artifacts/screenshots/`
- [x] 5.4 Confirm no screenshots, logs, or generated evidence files were written to the repository root
