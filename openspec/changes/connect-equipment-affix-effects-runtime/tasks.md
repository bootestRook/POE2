## 1. Corpus Discovery And Status Contract

- [x] 1.1 Add or extend equipment effect status data structures for `mapped_effect`, `disabled`, and `requires_design_alignment`.
- [x] 1.2 Build raw modifier grouping by `source_modifier_id` so coverage is measured against the 2,121 TLIDB rows, not only tiered definitions.
- [x] 1.3 Preserve existing `disabled_reason` behavior and add tests proving disabled raw modifiers remain excluded from generation and crafting.
- [x] 1.4 Add a full coverage test that fails when any enabled raw modifier lacks mapped operations or a design-alignment record.
- [x] 1.5 Add an inspectable alignment report or structured output for all `requires_design_alignment` affixes.

## 2. Semantic Mapping Layer

- [x] 2.1 Implement numeric effect parsing for signed values, percentages, ranges, and T2-T7 scaled effect text.
- [x] 2.2 Map player stat families: life, mana, energy shield, armor, evasion, movement speed, block, resistance, and primary attributes.
- [x] 2.3 Map skill stat families: generic/type damage, attack/cast speed, cooldown recovery, added cooldown, area, crit, projectile count/speed, pierce, chain, and related existing stat ids.
- [x] 2.4 Map added damage and supported damage conversion families into existing `damage_model` inputs without duplicating damage math.
- [x] 2.5 Add tests proving representative tiered definitions use their own scaled numeric values in mapped operations.

## 3. Runtime Integration

- [x] 3.1 Add equipment modifier aggregation for equipped `EquipmentItem` instances without changing equipment generation or crafting APIs.
- [x] 3.2 Feed mapped equipment player stat modifiers into `aggregate_player_stats` and combat player initialization.
- [x] 3.3 Feed mapped equipment skill modifiers into `SkillEffectCalculator._build_skill_stat_context`.
- [x] 3.4 Reuse existing runtime paths for mapped event mechanics such as on-kill, status/buff application, guard, channel/window behavior, projectile, pierce, chain, damage zone, and ailments.
- [x] 3.5 For every effect that cannot reuse an existing mechanism, emit `requires_design_alignment` instead of adding a new runtime hook.

## 4. Backend Verification

- [x] 4.1 Add tests proving equipment player stat affixes change actual `Player` combat stats.
- [x] 4.2 Add tests proving equipment skill stat affixes change actual `FinalSkillInstance` values and runtime params.
- [x] 4.3 Add tests proving representative existing event-hook equipment affixes emit or affect canonical `SkillEvent` data.
- [x] 4.4 Add tests proving disabled and design-alignment affixes do not apply silent no-op mapped effects.
- [x] 4.5 Run focused equipment, player stat, skill effect, skill runtime, and combat tests.

## 5. Presentation And WebApp Boundary

- [x] 5.1 Expose equipment effect status, mapped operations, disabled reasons, and design-alignment records through backend presentation/API where needed.
- [x] 5.2 Ensure WebApp skill preview, player stat display, and battle behavior consume backend-calculated equipment effects rather than frontend-local simulation.
- [x] 5.3 If WebApp-visible behavior changes, run the playable WebApp battle view and capture verification screenshots under `artifacts/screenshots/`.
- [x] 5.4 Confirm no skill editor surface, `dist-skill-editor`, `/skill-editor`, or port `8765` is used for verification.

## 6. Scope Guard

- [x] 6.1 Confirm no equipment generation, crafting, tier scaling, rarity, or candidate-pool rules were rewritten outside the effect integration needs.
- [x] 6.2 Confirm no new gameplay mechanism was added without a corresponding user-aligned design decision.
- [x] 6.3 Confirm sudoku gem board legality and support/passive routing rules remain unchanged by equipment effects.
- [x] 6.4 Confirm no root-level screenshots, logs, or generated evidence were created.
