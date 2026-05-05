## ADDED Requirements

### Requirement: Canonical Runtime State Query
The combat runtime SHALL provide canonical buff query methods for checking whether a combat target has a runtime buff and for reading buff-derived damage-over-time values without requiring callers to inspect legacy storage fields directly.

#### Scenario: Monster status presence is queried canonically
- **WHEN** a monster has an active ignite or frostbite state
- **THEN** gameplay code can query the state by its status or state identifier through the canonical query method

#### Scenario: Expired monster state is not reported
- **WHEN** a monster state has no remaining duration after ticking
- **THEN** the canonical presence query reports that the state is absent

### Requirement: BuffState Is The Only Runtime State Model
The combat runtime SHALL NOT retain `AilmentState` as the monster-side storage model after this change; monster-side status, ailment, debuff, and damage-over-time effects MUST be represented as `BuffState` entries.

#### Scenario: Monster state storage uses buffs
- **WHEN** monster runtime state is stored after event consumption
- **THEN** the storage type is `BuffState` and the primary collection is buff-oriented

#### Scenario: Frozen is represented as a buff
- **WHEN** frostbite accumulation freezes a monster
- **THEN** the monster receives a `BuffState` with `buff_type` set to `frozen` instead of setting a separate frozen flag

#### Scenario: Buff condition conversion consumes source by default
- **WHEN** a buff reaches its conversion threshold and does not explicitly disable source consumption
- **THEN** the runtime creates the target buff and removes the source buff

#### Scenario: Buff condition conversion can preserve source
- **WHEN** a buff reaches its conversion threshold with source consumption disabled
- **THEN** the runtime creates the target buff and keeps the source buff active

#### Scenario: Legacy gameplay reads are removed
- **WHEN** gameplay logic needs to check monster state
- **THEN** it uses canonical buff query methods instead of directly reading `AilmentState` fields or an ailment-only collection

### Requirement: Status Apply Consumption
The combat runtime SHALL consume `status_apply` skill events into target buffs using canonical buff semantics while preserving existing status event payload compatibility.

#### Scenario: Status apply creates monster state
- **WHEN** `CombatSession` consumes a `status_apply` event targeting a monster
- **THEN** the monster has the corresponding `BuffState` with duration, stacking, source skill, effect value, and damage-over-time fields available through canonical buff queries

#### Scenario: Damage-over-time state ticks
- **WHEN** a monster has an active damage-over-time state and combat time advances
- **THEN** the runtime applies the correct damage-over-time amount and reduces the state duration

### Requirement: Buff Apply Compatibility
The combat runtime SHALL preserve `buff_apply` compatibility for player buffs and monster-targeted negative buff effects.

#### Scenario: Player buff remains compatible
- **WHEN** `CombatSession` consumes a guard-style `buff_apply` event targeting the player
- **THEN** the player receives an active buff that absorbs eligible incoming damage according to the existing buff payload

#### Scenario: Monster-targeted buff becomes queryable state
- **WHEN** `CombatSession` consumes a supported negative `buff_apply` event targeting a monster
- **THEN** the monster stores the effect as `BuffState` and gameplay can resolve it through `effect_type` and optional filters such as `source_skill_id`

### Requirement: Runtime Behavior Tests
Runtime buff alignment tests MUST prove consumed gameplay behavior rather than only checking config payloads or emitted event fields.

#### Scenario: Test proves state application after event consumption
- **WHEN** a skill runtime event is emitted for a status or buff-like state effect
- **THEN** tests consume the event through the combat runtime and assert the resulting target state behavior

#### Scenario: Test proves state-derived follow-up behavior
- **WHEN** a later gameplay decision depends on the target state
- **THEN** tests assert the follow-up behavior using the canonical state query result or its observable combat outcome

### Requirement: Skill-Specific Changes Are Out Of Scope
This change SHALL NOT alter individual skill behavior, balance, or visuals unless required solely to migrate that skill away from direct legacy state-field reads.

#### Scenario: Burning Shot behavior is unchanged
- **WHEN** this change is implemented
- **THEN** Burning Shot-specific explosion, cooldown, damage-zone, and VFX behavior remains outside this change scope
