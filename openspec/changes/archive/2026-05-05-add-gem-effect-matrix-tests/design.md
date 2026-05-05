## Context

The current repository has several useful test paths, but they are fragmented:

- `SkillEffectCalculator` proves final skill calculation for selected mounted gems.
- `SkillRuntime` and `CombatSession` prove actual combat behavior for selected mechanics.
- `V1WebAppApi.runtime_skill_events` exposes the canonical runtime event path used by the playable WebApp.
- Old skill-editor and test-arena paths are disabled and must not be used as acceptance evidence.
- Some legacy tests are skipped by `tests/conftest.py` when they reference removed gem IDs.

The adopted content set is large enough that sample tests are no longer sufficient. The testing model needs to derive cases from loaded gem definitions, then assert expected results from the same runtime/config data used by the game.

## Goals / Non-Goals

**Goals:**

- Build a repeatable support-effect matrix over all loaded active, passive, and support gem definitions.
- Separate support eligibility from concrete effect applicability.
- Prove support-to-active effects through final skill outputs and, where relevant, canonical runtime events.
- Prove support-to-passive effects through support-to-passive modifier application and downstream passive-to-active or player-stat output.
- Preserve explicit negative coverage for filter matches that do not have compatible target stats.
- Keep the workflow non-destructive and independent of production inventory state.

**Non-Goals:**

- Do not rebalance skills, supports, passive values, cooldowns, damage, or TLIDB level tables.
- Do not re-enable the skill editor, test arena, or port `8765`.
- Do not add a frontend-local combat simulator.
- Do not change WebApp layout or VFX assets unless a later implementation finds a direct frontend bug.
- Do not change sudoku board relation semantics or gem routing rules.

## Decisions

1. Use loaded config as the matrix source of truth.

   The matrix should enumerate `load_gem_definitions(config_root)` and classify gems by `gem_kind`. This avoids hard-coded active/support/passive lists going stale when content changes.

   Alternative considered: maintain a hand-written manifest of expected pairs. That would be easier to inspect, but it would duplicate data that already exists in the configs and would drift quickly.

2. Test support eligibility separately from effect applicability.

   Eligibility is determined by `apply_filter.target_kinds`, `tags_any`, `tags_all`, and `tags_none`. Applicability is determined by whether the support's stats can affect the target's calculation path. For passive targets, this means the support stat must match a passive effect stat for the relevant passive target kind, except for conduit level supports.

   Alternative considered: require every filter-matching pair to produce an applied modifier. That would incorrectly fail legitimate cases where a broad support filter matches a passive gem but none of the passive's actual contribution stats can consume that support stat.

3. Use canonical gameplay paths for behavior proof.

   Calculation-only checks are enough for scalar preview fields such as damage pools, cooldown, area multiplier, or projectile count. Behavior-changing supports must also be verified through `SkillRuntime`, `CombatSession`, or `V1WebAppApi.runtime_skill_events` so tests prove real emitted events, target selection, damage, status, buffs, timing, or monster/player state.

   Alternative considered: assert only `FinalSkillInstance.runtime_params`. That is faster, but it misses event-generation bugs and violates the project rule that skill alignment tests prove runtime behavior.

4. Keep test fixtures non-destructive.

   Matrix tests should construct temporary `GemInventory` and `SudokuGemBoard` instances in memory. They should not write inventory files, skill configs, reports, browser logs, screenshots, or root-level artifacts.

   Alternative considered: drive tests through existing seeded WebApp inventory. That is closer to UI flow, but it makes exhaustive matrix coverage brittle and slower. WebApp runtime-event tests should be used for canonical event proof, not for every scalar pair.

5. Split matrix coverage into focused tiers.

   A single giant exhaustive test would be hard to debug. The implementation should use helper-generated cases but keep assertions grouped by responsibility: eligibility matrix, active calculation deltas, passive support routes, runtime behavior families, and disabled-surface guards.

## Risks / Trade-offs

- Large matrix tests may become noisy when content intentionally changes -> Mitigation: failure messages must include support ID, target ID, relation, expected reason, and observed modifiers or output fields.
- Some supports have broad filters but only affect a subset of target mechanics -> Mitigation: encode stat-to-consumer classification explicitly in test helpers and assert negative cases instead of treating them as failures.
- Runtime behavior can be expensive if every pair runs combat -> Mitigation: use runtime tests only for mechanics whose effects must emit or alter events, and use calculation checks for scalar-only modifiers.
- Existing obsolete skipped tests can hide gaps -> Mitigation: new tests must avoid removed gem IDs and should be written against currently loaded definitions.
- Frontend-affecting fixes discovered later will require browser screenshot verification -> Mitigation: keep this change scoped to tests first; if implementation changes WebApp rendering, add playable WebApp screenshot verification under `artifacts/screenshots/`.

## Migration Plan

1. Add non-destructive helper code in tests to build mounted active/support/passive boards from current definitions.
2. Add matrix tests for support eligibility and expected no-effect cases.
3. Add calculation delta tests for support-to-active and support-to-passive routes.
4. Add or extend focused runtime tests for behavior-changing support families.
5. Keep legacy skipped tests untouched unless a later change intentionally replaces them.

Rollback is straightforward: remove the new test helpers and tests. No production data or runtime behavior is expected to change.

## Open Questions

- Should the implementation produce a human-readable matrix report under `artifacts/` for manual QA, or keep the matrix purely inside tests?
- Should broad support filters be tightened in configs when many filter-matching passive pairs are intentionally no-op, or should tests continue documenting those as expected no-effect cases?
