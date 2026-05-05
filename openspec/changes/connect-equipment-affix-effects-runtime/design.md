## Context

The equipment backend already exists in `src/liufang/equipment.py`: it loads TLIDB equipment affixes, generates derived tiers, rolls base/prefix/suffix affixes, enforces rarity and level capacity, and supports crafting. The archived `add-equipment-affix-generation` change explicitly left combat, player stats, skill runtime, and WebApp UI integration out of scope.

The current TLIDB equipment corpus contains 2,121 raw modifier rows. Loading expands these into 7,893 tiered definitions; 6,408 tiered definitions from 1,650 raw modifiers are currently enabled, while 1,485 definitions from 471 raw modifiers are disabled by `disabled_reason`. This change makes effect handling explicit for the full raw corpus.

The project already has canonical runtime paths for many relevant mechanics: `aggregate_player_stats`, `SkillEffectCalculator._build_skill_stat_context`, `damage_model`, `FinalSkillInstance.runtime_params`, `SkillRuntime` event generation, and `CombatSession` consumption for damage, status/buff application, projectile, pierce/chain, channel/window, guard, damage zones, and on-kill follow-ups.

## Goals / Non-Goals

**Goals:**

- Cover every raw TLIDB equipment affix with one of three statuses: `mapped_effect`, `disabled`, or `requires_design_alignment`.
- Ensure every enabled affix has either a concrete semantic operation or a design-alignment record; enabled text-only effects are invalid.
- Map all effects that fit existing player stat, skill stat, damage model, runtime parameter, or existing event hook paths.
- Preserve existing disabled filtering unless a later decision explicitly re-enables a blocked family.
- Produce reports/tests that make unsupported and design-alignment cases visible before implementation can be considered complete.
- Keep the playable WebApp battle path consuming backend/canonical calculated results.

**Non-Goals:**

- Rewriting the existing equipment generator, crafting rules, tier scaling, or candidate-pool behavior.
- Creating a second gem affix or equipment affix generator.
- Adding new gameplay mechanisms without explicit user alignment.
- Implementing frontend-local combat, target selection, hit timing, projectile behavior, or damage application for equipment affix effects.
- Re-enabling currently disabled summon-only, blessing, harvest, ground, seal, curse, or similar blocked systems as part of this change unless separately agreed.

## Decisions

1. Keep equipment generation and equipment effects as separate layers.

   `EquipmentAffixDefinition` and `EquipmentAffixRoll` remain the canonical item data. A new effect mapping layer should consume these rolls and produce semantic operations. This avoids contaminating generation/crafting rules with combat-specific parsing.

2. Use explicit effect status as the coverage contract.

   Each raw TLIDB modifier gets one status:

   - `mapped_effect`: all enabled tier definitions for that raw modifier can produce one or more runtime operations.
   - `disabled`: the generator already excludes it with a stable `disabled_reason`.
   - `requires_design_alignment`: the affix is not disabled, but implementing it requires a new mechanism or design decision.

   Tests should fail if any enabled raw modifier is neither `mapped_effect` nor `requires_design_alignment`.

3. Map to existing runtime paths first.

   Pure stats become player or skill stat modifiers. Added damage and conversion-like effects reuse `damage_model` where already supported. Projectile, pierce, chain, area, cooldown, attack/cast speed, channel, guard, ailment, status, buff, and on-kill behavior should reuse existing runtime params, `SkillRuntime` event fields, and `CombatSession` consumption paths.

4. Design alignment is a first-class output, not a fallback.

   If an affix needs a missing mechanic, the implementation should emit a structured alignment item containing TLIDB text, affected rows, why existing mechanisms are insufficient, a proposed hook/stat/event, affected modules, and a suggested test. The code should not silently ignore it or approximate it with unrelated behavior.

5. Equipment contributions enter gameplay through backend stat/effect contexts.

   Equipped items should be aggregated into player/equipment modifier contexts that feed `aggregate_player_stats` and `SkillEffectCalculator`. Combat uses the resulting `Player`, `FinalSkillInstance`, and canonical `SkillEvent` stream. The WebApp may render status/debug information, but it must not become the source of truth.

6. Coverage is measured at raw modifier and tiered definition levels.

   Raw modifier coverage proves the 2,121 TLIDB rows have a status. Tiered definition coverage proves all generated definitions for enabled rows can be mapped consistently after T2-T7 scaling.

7. Condition keywords must have explicit gameplay semantics before mapping.

   `[低血]` means the player's current life is below 35% of maximum life. Equipment affixes gated by `[低血]` should use this threshold when they are mapped to conditional player stats, conditional skill stats, or conditional runtime hooks. The current TLIDB equipment corpus does not contain `[低血]` equipment affixes, so this is a semantic contract for later matching rather than an active mapping in this change.

8. Resistance maximum affixes use player resistance cap stats.

   The player's base resistance maximum is 75%. Affixes such as elemental resistance maximum should add to that cap rather than adding resistance value. Runtime mitigation should clamp each resistance against its effective maximum before applying resistance damage reduction. This is an implementable player-stat extension, not a new gameplay mechanism.

9. Equipment base affixes are the item base values.

   The `base_affix` on `EquipmentItem` is the base item value source. Local effects that say "该装备" apply to the equipped item's own base affix values first, then the resulting item totals are aggregated into player stats or weapon attack stats. For example, a local armor percent modifier scales the armor value parsed from that same item's base affix before contributing to player armor; a local weapon damage modifier scales that weapon's base attack damage before contributing to `weapon_attack_base_damage`.

10. Incoming damage conversion is allowed.

   Affixes that convert damage taken should convert incoming damage components before mitigation. The converted target damage types are then mitigated by the defender's corresponding armor effectiveness, resistance caps, resistance values, and final mitigation.

11. Armor effectiveness and armor reduction penetration have explicit mitigation semantics.

   Armor effectiveness is the percentage of armor that applies to a damage type when calculating armor reduction. Physical hit damage has 100% armor effectiveness by default; non-physical hit damage has 60% armor effectiveness by default. When calculating hit damage, use the lower applicable armor effectiveness value for the defender's armor reduction calculation.

   Armor reduction penetration belongs to the attacker. It subtracts from the defender's calculated armor reduction percentage and does not change the defender's actual armor value. Armor reduction penetration may reduce armor reduction below 0%, in which case the negative reduction increases the defender's damage taken by the corresponding amount.

12. Status and ailment equipment affixes should be mapped by concrete trigger and target.

   Status immunity affixes are player defensive state. Status apply affixes are hit/damage-triggered outgoing effects when their text says they apply on damage or hit. Minion clauses on the same text should be marked as player-only ignored until summon runtime is implemented. The mapping layer should not block the entire player effect only because the same TLIDB text also mentions minions.

   Equipment affixes that say "免疫 X" are always-on player immunities while equipped. They do not require a hit, damage event, kill, buff application, or any other trigger.

   Added base ignite damage increases the base damage of ignite damage-over-time caused by the player. It does not by itself grant ignite chance, add hit damage, or make a skill capable of igniting if that skill cannot otherwise apply ignite.

   Aggravation is a target debuff value. When a player's damage-over-time effect has non-zero aggravation value applied per second, that damage-over-time continuously adds aggravation value to the target. Each point of aggravation makes the target take 1% additional damage-over-time damage, and aggravation value is capped at 100. Aggravation effect increases the per-point damage-over-time taken effect; it does not increase aggravation application rate unless the affix explicitly modifies applied aggravation value.

   Affixes that apply a status "when dealing damage" trigger from all player-caused damage, including hits and damage-over-time. Any cooldown or interval stated in the affix text, such as a per-enemy interval, must be enforced.

   Damage-type-triggered status affixes should inspect actual damage components on the damage event. For example, "when dealing fire damage" should trigger only when the damage event contains a fire component, and should not be inferred from skill tags or a skill's primary damage type alone.

   Numbed is the runtime state for lightning paralysis. Numbed stacks last 2 seconds, cap at 10, and each stack makes the target take 5% additional lightning damage by default. If a target already has numbed, lightning hit damage applies one extra numbed stack per 10% of the target's maximum life plus maximum shield dealt, with a minimum threshold of 1%. Numbed effect affixes scale the per-stack lightning damage taken value.

13. Life return and shield return are instant on-hit recovery.

   Life return and shield return immediately recover a percentage of the player's missing life or missing shield when the player hits. Life return and shield return each cap at 30%. Their cooldown intervals are independent, and the base interval for each is 0.5 seconds.

14. Mana compensation is out of scope; aura effect depends on current aura runtime.

   Mana compensation affixes remain not implemented for this change. Aura effect affixes may only be mapped if an existing aura runtime/stat path is present; otherwise they remain design-alignment items.

15. War intent has a defined base state.

   While war intent is active, each point of war intent grants 2% attack and spell critical rating. War intent gains 1 point when the player kills a monster or hits a tough enemy. A tough enemy means a monster with rarity/tier `rare` or `boss`. Its base duration is 10 seconds, and its base maximum is 100 points. War intent effect scales this base effect and any later additional base effects.

   War intent critical rating is dynamic combat state. At skill release time, combat derives the current war intent critical chance contribution from the same critical-rating curve used by player stats, creates a temporary `FinalSkillInstance` for that release, and feeds the updated expected hit damage and damage components through the canonical `SkillRuntime` event stream.

16. Minion clauses are player-only for now.

   Equipment affix text that includes minion clauses should mark the minion clause as ignored/player-only until summon runtime exists, while still applying the player-owned portion when it can map to existing runtime behavior.

17. Aggressive casting and aggressive attacking are player buffs.

   Spell aggression grants 7% more cast speed and 7% more spell damage, and grants 7% movement-skill cooldown recovery speed. Attack aggression grants 5% more attack speed and 5% more attack damage, and grants 10% movement speed.

18. Bombardment total-wave affixes are blocked for this change.

   Affixes that grant extra total waves to bombardment skills are intentionally not implemented in this change. They should remain disabled or classified as not mapped until bombardment skill runtime support is explicitly added.

## Risks / Trade-offs

- Regex/text parsing may misclassify Chinese TLIDB effects -> Keep mapping tables explicit, add representative tests per pattern family, and require a full unmapped report.
- Mapping too much at once could add accidental mechanics -> Gate non-existing mechanisms behind `requires_design_alignment` instead of inventing runtime behavior.
- Equipment effects may duplicate existing gem/passive stat paths -> Reuse `aggregate_player_stats`, `SkillEffectCalculator`, and `AppliedModifier`/stat context patterns rather than adding parallel damage math.
- Frontend verification is required once equipment effects are visible or affect battle -> Plan for WebApp playable battle screenshot verification during implementation, not just backend tests.

## Migration Plan

1. Add effect status and mapping structures without changing generation/crafting output.
2. Add full corpus coverage tests and an alignment report so gaps are visible before gameplay wiring.
3. Wire mapped player stat and skill stat effects into backend calculation.
4. Wire mapped event/runtime hooks only where existing canonical mechanisms are sufficient.
5. Expose mapped/disabled/alignment status through backend presentation/API if needed by WebApp.
6. Verify focused backend tests first, then run the playable WebApp battle view and capture screenshots if frontend-visible behavior changes.

## Open Questions

- Which `requires_design_alignment` families should be re-enabled first after the initial mapping report?
- Should equipment items be manually seeded in the current WebApp state for verification, or should equipment drops/equip UI be exposed in the same implementation change?
- Should the final alignment report be committed under `reports/` or generated on demand under `artifacts/` during verification?
