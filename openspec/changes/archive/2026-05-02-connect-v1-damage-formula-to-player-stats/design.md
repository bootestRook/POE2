## Context

The project already defines V1-active player stats, skill package scaling metadata, sudoku-board routing rules, relation coefficients, support/passive/conduit modifiers, and final skill instances. The current runtime calculates skill output mostly from routed `AppliedModifier` values, while player base stats remain exposed through the character panel and combat player object rather than being merged into skill formula input.

The damage formula document defines V1 as a simplified hit pipeline:

```text
FinalStats -> IncreasePool -> NonCritDamage -> ExpectedDamage -> UsesPerSecond -> PreviewDPS
```

This change connects that pipeline to existing configuration and runtime classes without introducing the full long-term damage system.

## Goals / Non-Goals

**Goals:**

- Build one V1 skill stat context per active skill from player base stats plus active/routed modifiers.
- Make V1-active damage, tag, speed, cooldown, area, projectile, status, critical, and board power stats affect skill output through explicit formula steps.
- Preserve combat damage compatibility while adding formula fields that make non-critical damage, expected hit damage, crit chance, crit multiplier, uses per second, and preview DPS explainable.
- Make relation power stats and conduit amplification follow the documented routing formula.
- Keep UI preview and test reports aligned with the runtime calculation.

**Non-Goals:**

- No enemy armor, evasion, block, resistance, mitigation, shield, or damage buffer implementation.
- No DoT, damage conversion matrix, minion damage formula, reflected damage, double damage, or full ailment damage formula.
- No broad rebalance of skill package numbers unless a failing acceptance case requires small fixture adjustments.
- No frontend-only reimplementation of formula logic.

## Decisions

1. Use a `SkillStatContext`-style aggregation step before `_build_final_skill`.

   Rationale: the formula needs both player stats and routed gem stats. A single context avoids duplicating stat lookup logic across damage, cooldown, runtime params, preview, and reports.

   Alternative considered: keep summing only `AppliedModifier` values and special-case player stats in each formula section. That is smaller initially but makes later formula fields harder to reason about and easier to drift.

2. Keep `final_damage` as the hit damage used by combat, and add explicit preview/trace fields for formula clarity.

   Rationale: existing combat and SkillRuntime code already use `final_damage` for actual HP changes. The safest V1 path is to update its value to the formula's expected hit damage only if acceptance tests define that behavior clearly; otherwise expose `non_crit_damage` and `expected_hit_damage` separately and migrate UI wording.

   Alternative considered: immediately redefine `final_damage` as expected damage. That is simpler for DPS preview but can silently change combat balance and tests.

3. Match additive pools by skill data rather than support identity.

   Rationale: `damage_type`, `tags`, and behavior/runtime template are already skill metadata. Formula matching should use those fields so player stats, passive stats, support stats, and future affixes share the same path.

   Alternative considered: add more support-specific branches. That keeps current behavior but fails the purpose of connecting formula to the attribute system.

4. Treat projectile count as coverage by default in preview DPS.

   Rationale: the formula document explicitly warns that projectile count should not automatically multiply single-target DPS. Runtime may still emit multiple projectile events for skills that support it, but preview DPS should use `HitCoverageFactor = 1` unless a skill explicitly opts into overlap.

   Alternative considered: preserve `final_damage * projectile_count / cooldown`. That matches current tooltip behavior but overstates single-target output for coverage-oriented projectile skills.

5. Route board power stats through the existing relation scale function.

   Rationale: `source_power_row`, `target_power_box`, and conduit amplification already exist in configs and tests. Implementing them in the relation scale keeps the routing formula centralized.

   Alternative considered: pre-expand board power into separate modifiers. That would make trace output noisier and risks recursive-looking routes.

## Risks / Trade-offs

- Formula output changes may shift existing combat damage numbers -> Mitigate with focused tests around baseline skills and support/passive combinations, and keep expected changes explicit in fixtures.
- Adding preview fields can expand API payloads -> Mitigate by preserving existing fields and adding optional fields instead of removing keys.
- Critical expectation can be confused with actual random crits -> Mitigate by naming preview fields `expected_hit_damage`, `crit_chance`, and `crit_multiplier`, and leaving random crit rolls out of V1 combat unless separately specified.
- Board power currently comes from stats that may be generated as affixes -> Mitigate by filtering to V1-active/runtime-effective stats and testing spawn eligibility.
- Projectile coverage semantics may conflict with current SkillRuntime multi-projectile damage events -> Mitigate by separating combat event behavior from preview DPS wording and using a `hit_coverage_factor` field.

## Migration Plan

1. Add focused tests for player stat aggregation, tag-matched additive pools, relation power scaling, crit expectation, and preview DPS.
2. Implement the aggregation and formula path in `SkillEffectCalculator`.
3. Preserve existing skill preview API fields while adding formula outputs.
4. Update presentation/report code to consume the new fields.
5. Run targeted Python tests and WebApp smoke coverage for state shape and tooltip output.

Rollback is straightforward: the change is localized to skill calculation, presentation, and tests. Existing configs remain valid because new formula inputs already have base defaults.

## Open Questions

- Should `final_damage` represent non-critical hit damage or expected hit damage after this change? The safer default is non-critical combat hit damage plus separate `expected_hit_damage` for preview.
- Should any V1 skill explicitly allow projectile overlap to affect single-target preview DPS, or should all skills use `HitCoverageFactor = 1` for now?
