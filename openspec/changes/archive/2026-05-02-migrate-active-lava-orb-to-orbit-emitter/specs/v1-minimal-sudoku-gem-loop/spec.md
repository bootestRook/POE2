## ADDED Requirements

### Requirement: Orbit Emitter Module
V1 Skill Packages SHALL support a reusable `orbit_emitter` module that generates orbit entity and tick-position SkillEvents without performing hit tests or damage directly.

#### Scenario: Emit orbit spawn event
- **WHEN** Skill Runtime executes a Skill Package module with `type = orbit_emitter`
- **THEN** it SHALL emit `orbit_spawn` with orbit center, orbit radius, duration, orb count, orbit speed, and spawn VFX key payload data

#### Scenario: Emit orbit tick events
- **WHEN** the orbit emitter's tick schedule reaches a tick timestamp
- **THEN** it SHALL emit `orbit_tick` with `tick_index`, `tick_time_ms`, `orb_position`, `tick_marker_id`, and `tick_vfx_key`

#### Scenario: Orbit emitter does not hit or damage
- **WHEN** an `orbit_emitter` module emits `orbit_spawn` or `orbit_tick`
- **THEN** it SHALL NOT perform target hit testing, reduce HP, emit `damage`, or resolve damage directly

#### Scenario: Orbit emitter fields are whitelisted
- **WHEN** `configs/skills/behavior_templates/orbit_emitter.yaml` is validated
- **THEN** it SHALL declare only whitelisted fields for `orbit_center_policy`, `duration_ms`, `tick_interval_ms`, `orbit_radius`, `orbit_speed_deg_per_sec`, `orb_count`, `start_angle_deg`, `tick_marker_id`, `spawn_vfx_key`, and `tick_vfx_key`

#### Scenario: Orbit emitter rejects script-like params
- **WHEN** a Skill Package declares `orbit_emitter` parameters
- **THEN** validation SHALL reject arbitrary scripts, expression DSL fields, function-call strings, undeclared parameters, and frontend-only fake parameters

### Requirement: Tick Schedule Helper
V1 SHALL provide reusable tick scheduling logic for duration and interval based modules, and the logic SHALL NOT be specific to Lava Orb.

#### Scenario: Compute tick times
- **WHEN** tick scheduling receives `duration_ms` and `tick_interval_ms`
- **THEN** it SHALL compute deterministic `tick_index` and `timestamp_ms` values according to the configured duration and interval

#### Scenario: Validate tick inputs
- **WHEN** a module declares `duration_ms` and `tick_interval_ms`
- **THEN** validation SHALL require both values to be positive and SHALL reject `tick_interval_ms` greater than `duration_ms`

#### Scenario: Reusable timing boundary
- **WHEN** tick scheduling is implemented
- **THEN** it SHALL be reusable as an `orbit_emitter` helper or a shared timing helper and SHALL NOT contain `active_lava_orb` skill-id branches

#### Scenario: Tick schedule does not resolve combat
- **WHEN** tick scheduling outputs tick data
- **THEN** it SHALL NOT perform hit testing, select targets, emit damage, or reduce HP

### Requirement: Triggered Damage Zone Reuse For Orbit Ticks
V1 SHALL reuse the existing `damage_zone` circle hit test with `origin_policy = trigger_position` for orbit tick damage zones.

#### Scenario: Orbit tick marker triggers damage zone
- **WHEN** an `orbit_tick` emits a marker using `tick_marker_id`
- **THEN** a later `damage_zone` module SHALL be able to reference that marker through `trigger_marker_id`

#### Scenario: Damage zone uses tick position
- **WHEN** a `damage_zone` module declares `origin_policy = trigger_position` and is triggered by an orbit tick marker
- **THEN** Skill Runtime SHALL use the matching `orbit_tick.orb_position` as the `damage_zone` origin

#### Scenario: Reuse circle hit test
- **WHEN** the triggered orbit damage zone resolves with `shape = circle`
- **THEN** Skill Runtime SHALL use the shared `damage_zone` circle hit test and SHALL NOT use a Lava Orb-specific hit test

#### Scenario: Damage zone controls fire hit area
- **WHEN** Lava Orb's triggered `damage_zone` resolves
- **THEN** its radius SHALL control each tick's hit range and its `damage_type` SHALL be `fire`

### Requirement: Lava Orb Skill Package
V1 SHALL migrate `active_lava_orb / 熔岩球` into a Skill Package using an `orbit_emitter + damage_zone` module chain.

#### Scenario: Lava Orb package path
- **WHEN** `active_lava_orb` is migrated
- **THEN** its Skill Package SHALL be loaded from `configs/skills/active/active_lava_orb/skill.yaml`

#### Scenario: Lava Orb uses module chain
- **WHEN** the Lava Orb Skill Package is validated
- **THEN** it SHALL declare an `orbit_emitter` module followed by a `damage_zone` module linked by `tick_marker_id -> trigger_marker_id`

#### Scenario: Lava Orb does not use monolithic template
- **WHEN** Lava Orb is migrated
- **THEN** it SHALL NOT use or create a Lava Orb-specific monolithic behavior template

#### Scenario: Lava Orb package fields are complete
- **WHEN** the Lava Orb Skill Package is validated
- **THEN** it SHALL include display, classification, cast, modules, hit, scaling, presentation, and preview fields required by the Skill Package schema

#### Scenario: Lava Orb remains localized
- **WHEN** Lava Orb name, description, damage reason, VFX feedback, screen feedback, or floating text is shown
- **THEN** player-visible text SHALL be Chinese and SHALL come from localization keys

#### Scenario: Do not migrate other active skills
- **WHEN** this change is applied
- **THEN** it SHALL NOT migrate other active skills or modify formal drops, inventory, or gem board behavior

### Requirement: Lava Orb SkillEvent
V1 SHALL express Lava Orb through real SkillEvents for cast, orbit spawn, orbit ticks, triggered damage zones, damage, and presentation.

#### Scenario: Full Lava Orb event timeline is emitted
- **WHEN** Skill Runtime executes `active_lava_orb`
- **THEN** it SHALL output `cast_start`, `orbit_spawn`, multiple `orbit_tick`, `damage_zone`, `damage`, `hit_vfx`, `floating_text`, and `cooldown_update` when present

#### Scenario: Orbit spawn payload is complete
- **WHEN** Skill Runtime emits `orbit_spawn`
- **THEN** the payload SHALL include `orbit_center`, `orbit_radius`, `duration_ms`, `orb_count`, `orbit_speed_deg_per_sec`, and `spawn_vfx_key`

#### Scenario: Orbit tick payload is complete
- **WHEN** Skill Runtime emits `orbit_tick`
- **THEN** the payload SHALL include `tick_index`, `tick_time_ms`, `orb_position`, `tick_marker_id`, and `tick_vfx_key`

#### Scenario: Damage zone payload is linked to orbit tick
- **WHEN** Skill Runtime emits a Lava Orb `damage_zone`
- **THEN** the payload SHALL include `shape = circle`, `origin` equal to the matching orb position, `radius`, `damage_type = fire`, and `trigger_marker_id`

#### Scenario: Damage is the only HP-changing event
- **WHEN** targets are hit by Lava Orb
- **THEN** HP reduction SHALL occur only through `damage` events emitted after the matching `damage_zone`

### Requirement: SkillEditor Orbit Module Support
SkillEditor SHALL expose `orbit_emitter` and linked `damage_zone` fields for Lava Orb module-chain packages.

#### Scenario: Orbit emitter fields are shown
- **WHEN** SkillEditor opens a Skill Package with an `orbit_emitter` module
- **THEN** it SHALL expose `orbit_center_policy`, `duration_ms`, `tick_interval_ms`, `orbit_radius`, `orbit_speed_deg_per_sec`, `orb_count`, `start_angle_deg`, `tick_marker_id`, `spawn_vfx_key`, and `tick_vfx_key`

#### Scenario: Linked damage zone fields are shown
- **WHEN** SkillEditor opens the linked Lava Orb `damage_zone` module
- **THEN** it SHALL expose `trigger_marker_id`, `trigger_delay_ms`, `shape`, `origin_policy`, `radius`, `hit_at_ms`, `max_targets`, `damage_type`, and `vfx_key`

#### Scenario: Marker trigger link is shown
- **WHEN** SkillEditor displays the Lava Orb module chain
- **THEN** it SHALL show `orbit_emitter.tick_marker_id -> damage_zone.trigger_marker_id`

#### Scenario: Marker trigger consistency is validated
- **WHEN** SkillEditor saves a package with `orbit_emitter` and linked `damage_zone`
- **THEN** it SHALL reject missing marker references, unresolved triggers, duplicate marker ids, and invalid marker / trigger links

#### Scenario: Read-only orbit summaries are shown
- **WHEN** SkillEditor displays Lava Orb orbit modules
- **THEN** it SHALL show estimated tick count, estimated total duration, orbit radius, per-tick hit radius, and current module-chain connection status

#### Scenario: Test modifiers do not persist
- **WHEN** SkillEditor runs Lava Orb with a test Modifier Stack
- **THEN** it SHALL NOT write test modifier values into the real Skill Package YAML and SHALL NOT restore random affix editing

### Requirement: WebApp Orbit Rendering
WebApp SHALL render Lava Orb orbit and damage-zone behavior from SkillEvent payloads and SHALL NOT infer behavior from skill identity.

#### Scenario: Render orbit from event payload
- **WHEN** WebApp receives `orbit_spawn`
- **THEN** it SHALL render the orbit entity using event-provided orbit center, radius, duration, orb count, orbit speed, and VFX key

#### Scenario: Render tick position from event payload
- **WHEN** WebApp receives `orbit_tick`
- **THEN** it SHALL update or display the orb position using event-provided `orb_position`, `tick_index`, and timing data

#### Scenario: Render damage zone from event payload
- **WHEN** WebApp receives a Lava Orb `damage_zone`
- **THEN** it SHALL render the circular hit area using event-provided origin, radius, damage type, trigger marker id, and VFX key

#### Scenario: Render hit results from real events
- **WHEN** WebApp receives `damage`, `hit_vfx`, or `floating_text`
- **THEN** it SHALL render HP changes, hit effects, and floating text from those events

#### Scenario: Do not guess Lava Orb behavior
- **WHEN** WebApp renders `active_lava_orb`
- **THEN** it SHALL NOT infer orbit behavior from skill id, old `behavior_type`, `visual_effect`, VFX key, or hardcoded Lava Orb branches

### Requirement: Lava Orb Skill Test Arena Acceptance
Skill Test Arena SHALL validate Lava Orb using real orbit, tick, triggered damage zone, damage, and presentation events.

#### Scenario: Validate dense small monsters
- **WHEN** Skill Test Arena runs `active_lava_orb` against dense small monsters
- **THEN** it SHALL verify `orbit_spawn`, multiple `orbit_tick` events, triggered circular `damage_zone` events, fire `damage`, hit VFX, floating text, and multi-target circle hits

#### Scenario: Validate single dummy timing
- **WHEN** Skill Test Arena runs `active_lava_orb` against one dummy
- **THEN** it SHALL verify `cast_start` does not reduce HP, `orbit_tick` does not directly reduce HP, and HP is reduced only after `damage_zone` produces `damage`

#### Scenario: Validate three target row range
- **WHEN** Skill Test Arena runs `active_lava_orb` against three horizontal targets
- **THEN** it SHALL verify hit selection changes according to orbit tick position and `damage_zone.radius`

#### Scenario: Validate orbit timing parameter effects
- **WHEN** Skill Test Arena changes `duration_ms` or `tick_interval_ms`
- **THEN** tick count or tick frequency SHALL change according to the modified value

#### Scenario: Validate orbit geometry parameter effects
- **WHEN** Skill Test Arena changes `orbit_radius`, `orb_count`, or `damage_zone.radius`
- **THEN** orb positions, orbit entity count, or hit coverage SHALL change according to the modified value

#### Scenario: Validate modifier stack effects
- **WHEN** Skill Test Arena runs Lava Orb with a test Modifier Stack
- **THEN** the stack SHALL affect final damage, range, or tick parameters used by actual SkillEvents without writing production inventory, gem instances, or Skill Package data

### Requirement: AI Report Orbit Validation
The AI self-test report SHALL validate Lava Orb orbit, tick, damage-zone, and damage behavior from real Skill Test Arena events.

#### Scenario: Check orbit spawn
- **WHEN** the AI self-test report evaluates `active_lava_orb`
- **THEN** it SHALL check whether `orbit_spawn` exists and whether it is centered on the player or caster

#### Scenario: Check orbit ticks
- **WHEN** the AI self-test report evaluates `active_lava_orb`
- **THEN** it SHALL check whether multiple `orbit_tick` events exist, whether tick count matches `duration_ms / tick_interval_ms`, and whether each relevant tick includes `orb_position`

#### Scenario: Check triggered damage zone chain
- **WHEN** the AI self-test report evaluates `active_lava_orb`
- **THEN** it SHALL check whether `damage_zone` exists, whether its origin equals the matching `orbit_tick` position, and whether it uses `damage_type = fire`

#### Scenario: Check damage timing
- **WHEN** the AI self-test report evaluates `active_lava_orb`
- **THEN** it SHALL check that `cast_start` does not reduce HP, `orbit_tick` does not directly reduce HP, and `damage` is produced only after `damage_zone` hit resolution

#### Scenario: Check parameter mutation effects
- **WHEN** the AI self-test report evaluates changed Lava Orb parameters
- **THEN** it SHALL check that `duration_ms`, `tick_interval_ms`, `orbit_radius`, and `damage_zone.radius` changes affect real event counts, timing, positions, or hit coverage

#### Scenario: Report Chinese conclusion and fixes
- **WHEN** the AI self-test report finishes evaluating `active_lava_orb`
- **THEN** it SHALL output a conclusion of `通过`, `部分通过`, or `不通过`, plus Chinese inconsistency items and suggested fixes
