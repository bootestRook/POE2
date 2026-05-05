## ADDED Requirements

### Requirement: Equipment Affix Effect Status Coverage
The equipment affix system SHALL classify every raw TLIDB equipment modifier as `mapped_effect`, `disabled`, or `requires_design_alignment`.

#### Scenario: Full raw modifier status coverage
- **WHEN** TLIDB equipment affix definitions are loaded from `tlidb_equips/tlidb_craft_affixes.md`
- **THEN** every raw `source_modifier_id` SHALL have exactly one effect status of `mapped_effect`, `disabled`, or `requires_design_alignment`

#### Scenario: Disabled modifiers remain excluded
- **WHEN** a raw equipment modifier is classified as `disabled`
- **THEN** every generated equipment affix definition for that raw modifier SHALL remain unavailable to random generation and crafting and SHALL expose a non-empty disabled reason

#### Scenario: Enabled text-only modifiers are invalid
- **WHEN** a generated equipment affix definition is enabled
- **THEN** its raw modifier SHALL either produce at least one mapped runtime effect operation or produce a `requires_design_alignment` record

### Requirement: Equipment Affix Semantic Mapping
The equipment affix system SHALL convert mapped equipment affix rolls into canonical runtime operations rather than relying on player-visible text.

#### Scenario: Pure player stats map to player modifiers
- **WHEN** an equipped affix grants existing player stats such as maximum life, mana, armor, evasion, energy shield, movement speed, block, resistance, or primary attributes
- **THEN** the system SHALL emit player stat modifiers consumable by `aggregate_player_stats`

#### Scenario: Resistance maximum affixes map to player caps
- **WHEN** an equipped affix grants resistance maximum
- **THEN** the system SHALL treat the player's base resistance maximum as 75% and SHALL add the affix value to the relevant effective resistance maximum before resistance mitigation clamps incoming damage

#### Scenario: Incoming damage conversion maps before mitigation
- **WHEN** an equipped affix converts damage taken from one type to another
- **THEN** the system SHALL convert incoming damage components before armor effectiveness, resistance, resistance cap, and final mitigation are applied

#### Scenario: Armor effectiveness changes armor mitigation participation
- **WHEN** a hit is mitigated by armor
- **THEN** physical damage SHALL use 100% default armor effectiveness and non-physical damage SHALL use 60% default armor effectiveness unless equipment effects provide a lower applicable value for the defender

#### Scenario: Armor reduction penetration belongs to the attacker
- **WHEN** an attacker has armor reduction penetration
- **THEN** the system SHALL subtract that value from the defender's calculated armor reduction percentage without changing actual armor and SHALL allow the resulting armor reduction percentage to become negative

#### Scenario: Local equipment modifiers apply to base affix values
- **WHEN** an equipped affix modifies "该装备" armor, evasion, energy shield, or weapon damage
- **THEN** the system SHALL apply that modifier to the same `EquipmentItem` base affix value before aggregating the item into player stats or `weapon_attack_base_damage`

#### Scenario: Minion clauses are ignored without blocking player clauses
- **WHEN** an equipment affix text contains both player-owned effects and minion clauses
- **THEN** the system SHALL mark the minion clause as ignored/player-only until summon runtime exists and SHALL still map the player-owned effect when it can reuse existing runtime behavior

#### Scenario: Immunity affixes are always-on player state
- **WHEN** an equipped affix grants immunity to a status or ailment
- **THEN** the system SHALL apply that immunity as always-on player defensive state while the item is equipped without requiring any trigger event

#### Scenario: Added base ignite damage affects player ignite DOT only
- **WHEN** an equipped affix grants added base ignite damage
- **THEN** the system SHALL increase only the base damage of ignite damage-over-time caused by the player and SHALL NOT add hit damage, grant ignite chance, or make a non-igniting skill able to ignite

#### Scenario: Aggravation effect scales DOT taken per aggravation point
- **WHEN** a player damage-over-time effect applies non-zero aggravation value per second
- **THEN** the target SHALL continuously gain aggravation value up to 100 points, each point SHALL make the target take 1% additional damage-over-time damage before aggravation effect scaling, and aggravation effect SHALL scale that per-point damage-over-time taken effect rather than the application rate unless explicitly stated

#### Scenario: Damage-triggered status application includes hits and DOT
- **WHEN** an equipped affix applies a status when the player deals damage
- **THEN** the system SHALL trigger from all player-caused damage including hits and damage-over-time and SHALL enforce any cooldown or interval stated by the affix text

#### Scenario: Damage-type triggers inspect actual components
- **WHEN** an equipped affix triggers from dealing a specific damage type
- **THEN** the system SHALL trigger only when the canonical damage event contains that damage type component and SHALL NOT infer the trigger from skill tags or primary skill damage type alone

#### Scenario: Life return and shield return are instant on-hit recovery
- **WHEN** the player hits and has life return or shield return
- **THEN** the system SHALL immediately recover the configured percentage of missing life or missing shield, capped at 30% for each return type with independent 0.5 second base intervals

#### Scenario: War intent base state
- **WHEN** war intent is active
- **THEN** each war intent point SHALL grant 2% attack and spell critical rating, last 10 seconds by default, stack up to 100 points by default, gain 1 point on player kill or hit against a `rare` or `boss` enemy, and be scaled by war intent effect

#### Scenario: Aggression buffs map to player and skill stats
- **WHEN** an equipped affix grants spell aggression
- **THEN** the system SHALL grant 7% more cast speed, 7% more spell damage, and 7% movement-skill cooldown recovery speed while active
- **WHEN** an equipped affix grants attack aggression
- **THEN** the system SHALL grant 5% more attack speed, 5% more attack damage, and 10% movement speed while active

#### Scenario: Bombardment wave affixes are blocked
- **WHEN** an equipment affix grants extra total waves to bombardment skills
- **THEN** the system SHALL NOT map it in this change and SHALL keep it disabled or design-aligned until bombardment runtime support is explicitly added

#### Scenario: Skill-affecting stats map to skill context
- **WHEN** an equipped affix grants existing skill stats such as damage increases, attack speed, cast speed, cooldown recovery, added cooldown, area, crit, projectile count, projectile speed, pierce, chain, added damage, or damage conversion supported by the current runtime
- **THEN** the system SHALL emit modifiers consumable by `SkillEffectCalculator` and the existing damage model or runtime parameter paths

#### Scenario: Existing event mechanics map to canonical events
- **WHEN** an equipped affix describes behavior already represented by existing canonical runtime paths such as on-kill explosion, status application, buff application, guard, channel/window effects, projectile, pierce, chain, damage zone, ailment, or floating damage feedback
- **THEN** the system SHALL map the effect to those existing `SkillRuntime` event fields and `CombatSession` consumption paths without creating a parallel runtime

#### Scenario: Mapping preserves scaled tiers
- **WHEN** initial or advanced equipment affixes are generated as T2-T7 derived definitions
- **THEN** their mapped effect operations SHALL use the scaled numeric values from the generated effect text rather than the original T1 values

#### Scenario: Low life conditional semantics
- **WHEN** an equipped affix is gated by `[低血]`
- **THEN** the condition SHALL be treated as active only while current life is below 35% of maximum life

### Requirement: Equipment Affix Design Alignment Gate
The equipment affix system SHALL require explicit design alignment before adding new gameplay mechanisms for equipment affixes.

#### Scenario: Missing mechanism produces alignment record
- **WHEN** an enabled equipment affix cannot be represented by existing stats, damage model inputs, runtime params, SkillRuntime events, or CombatSession consumers
- **THEN** the system SHALL classify it as `requires_design_alignment` and SHALL include the TLIDB text, affected modifier ids, why existing mechanisms are insufficient, the proposed hook/stat/event, affected modules, and a recommended test plan

#### Scenario: No silent approximation
- **WHEN** an equipped affix is classified as `requires_design_alignment`
- **THEN** the playable runtime SHALL NOT approximate it with unrelated existing behavior and SHALL NOT apply it as a no-op mapped effect

#### Scenario: Re-enabling blocked families requires explicit change
- **WHEN** an affix family is currently disabled by `disabled_reason`
- **THEN** this change SHALL NOT re-enable it unless the implementation also updates the disable rule, adds semantic mapping, and adds tests proving the runtime behavior

### Requirement: Equipment Affix Coverage Verification
The equipment affix system SHALL provide verification that proves full corpus coverage and representative runtime behavior.

#### Scenario: Corpus coverage test
- **WHEN** equipment effect coverage tests run
- **THEN** they SHALL assert that all 2,121 raw TLIDB equipment modifiers are classified and that every enabled generated definition is mapped or requires design alignment

#### Scenario: Representative mapped family tests
- **WHEN** mapped effect family tests run
- **THEN** they SHALL prove representative player stat, skill stat, damage model, runtime param, and existing event-hook affixes change actual backend runtime behavior, not only mapping payload presence

#### Scenario: Alignment report is inspectable
- **WHEN** any enabled affix requires design alignment
- **THEN** the system SHALL expose an inspectable report or structured output listing those affixes and their proposed alignment details
