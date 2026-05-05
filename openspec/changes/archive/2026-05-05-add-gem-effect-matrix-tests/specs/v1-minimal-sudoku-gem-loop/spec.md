## ADDED Requirements

### Requirement: Gem effect matrix coverage
The system SHALL provide automated test coverage that derives the active skill, passive skill, and support gem matrix from loaded gem definitions rather than from stale hard-coded legacy gem lists.

#### Scenario: Matrix enumerates current gems
- **WHEN** the gem effect matrix tests run
- **THEN** they SHALL enumerate active, passive, and support gems from `load_gem_definitions(config_root)` and SHALL NOT require removed obsolete gem IDs.

#### Scenario: Support eligibility uses explicit filters
- **WHEN** a support gem is evaluated against an active or passive target gem
- **THEN** the matrix SHALL determine eligibility using `apply_filter.target_kinds`, `apply_filter.tags_any`, `apply_filter.tags_all`, and `apply_filter.tags_none`.

#### Scenario: Filter mismatch is proven inactive
- **WHEN** a support gem does not match a target gem's explicit filters
- **THEN** the tests SHALL prove that the support does not produce an applied support modifier for that target.

### Requirement: Support-to-active effect proof
The system SHALL test each eligible support-to-active pair according to the concrete support stats and the active skill mechanics that can consume those stats.

#### Scenario: Scalar support changes final skill output
- **WHEN** an eligible support gem contributes scalar stats to an active skill
- **THEN** the tests SHALL verify the corresponding `FinalSkillInstance` fields, skill stats, damage components, damage conversions, ailments, or runtime params changed in the expected direction or value.

#### Scenario: Behavior support reaches canonical runtime
- **WHEN** an eligible support gem changes projectile count, split, bounce, chain, area, duration, channel, guard, status, forced movement, or damage-event behavior
- **THEN** the tests SHALL verify the effect through `SkillRuntime`, `CombatSession`, or `V1WebAppApi.runtime_skill_events`, including emitted events, timing, targets, damage, status, buffs, or player/monster state as applicable.

#### Scenario: Calculation payload alone is insufficient for behavior support
- **WHEN** a support gem changes actual gameplay behavior
- **THEN** tests SHALL NOT treat config payload presence or `applied_modifiers` presence alone as sufficient proof.

### Requirement: Support-to-passive effect proof
The system SHALL test each eligible support-to-passive pair by distinguishing filter eligibility from whether the passive's actual contribution stats can consume the support effect.

#### Scenario: Compatible support modifies passive contribution
- **WHEN** an eligible support gem has a stat compatible with a passive gem's `passive_effects` or conduit level route
- **THEN** the tests SHALL verify a support-to-passive modifier is applied before the passive-to-active or self-stat contribution is calculated.

#### Scenario: Passive downstream result changes
- **WHEN** a compatible support modifies a passive gem that contributes to an active skill or player stat
- **THEN** the tests SHALL verify the downstream final skill output or player stat output changes accordingly.

#### Scenario: Filter match without compatible stat is no-op
- **WHEN** a support gem filter matches a passive gem but the support has no stat consumed by that passive's actual effects
- **THEN** the tests SHALL assert that no support-to-passive modifier is applied and SHALL report the pair as an expected no-effect case rather than a failure.

### Requirement: Verification surfaces for gem matrix tests
The system SHALL keep gem matrix verification on canonical runtime paths and SHALL NOT use disabled tooling surfaces as proof.

#### Scenario: Skill editor remains excluded
- **WHEN** gem matrix tests or reports are implemented
- **THEN** they SHALL NOT navigate to `/skill-editor`, call enabled skill-editor save or preview behavior, use `?skill_editor=1`, use `view=skill_editor`, start port `8765`, or use `dist-skill-editor`.

#### Scenario: Disabled test arena is not acceptance evidence
- **WHEN** skill behavior is verified for the matrix
- **THEN** disabled test arena helpers SHALL NOT be used as acceptance evidence for playable behavior.

#### Scenario: Frontend-affecting changes require playable WebApp verification
- **WHEN** implementation of this change alters frontend rendering, WebApp battle presentation, VFX timing, or visible gameplay behavior
- **THEN** the change SHALL be verified in the playable WebApp battle view with a screenshot stored outside the repository root under `artifacts/screenshots/`.
