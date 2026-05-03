## Context

The active skill migration framework is already in place for four Skill Packages:

- `configs/skills/active/active_fire_bolt/skill.yaml`
- `configs/skills/active/active_ice_shards/skill.yaml`
- `configs/skills/active/active_penetrating_shot/skill.yaml`
- `configs/skills/active/active_frost_nova/skill.yaml`

Those slices established the migration template this change should reuse: schema-backed Skill Packages, whitelisted behavior templates, SkillEditor modules, Skill Test Arena scenarios, real SkillEvent timelines, and Chinese AI self-test reports.

`migrate-active-frost-nova-to-player-nova` has been completed and archived at `openspec/changes/archive/2026-04-30-migrate-active-frost-nova-to-player-nova`. The current active OpenSpec changes are `refactor-projectile-editor-panel-and-preview-flow` and `refactor-three-gem-kinds-v1-phase2`, both reported complete by `openspec list --json`.

`active_puncture` is still on the old path:

- `configs/gems/active_skill_gems.toml` declares `active_puncture` with `skill_template = "skill_puncture"`.
- `configs/skills/skill_templates.toml` declares `skill_puncture`.
- `configs/skills/active/active_puncture/skill.yaml` does not exist.

The important design distinction is melee ownership. Puncture must be a short-range, directional, sector-shaped melee slash from the player or cast source. It must not remain a remote nearest-target damage action with slash visuals attached.

## Goals / Non-Goals

**Goals:**

- Define the future `active_puncture` Skill Package at `configs/skills/active/active_puncture/skill.yaml`.
- Define the future `melee_arc` behavior template at `configs/skills/behavior_templates/melee_arc.yaml`.
- Make `melee_arc` a declarative behavior template with close-range sector hit semantics: no scripts, no expression DSL, no arbitrary params.
- Ensure SkillRuntime will emit real `cast_start`, `melee_arc`, `damage`, `hit_vfx`, `floating_text`, and optional `cooldown_update` events.
- Ensure damage occurs only through `damage` events at or after `hit_at_ms`.
- Ensure SkillEditor exposes and validates every declared `melee_arc` field before puncture is considered migrated.
- Ensure Skill Test Arena, SkillEvent timeline, and AI self-test report can validate real melee range, facing, hit timing, physical damage, and presentation.

**Non-Goals:**

- Do not write runtime code during Propose.
- Do not create `configs/skills/active/active_puncture/skill.yaml` during Propose.
- Do not implement `melee_arc` during Propose.
- Do not create `configs/skills/behavior_templates/melee_arc.yaml` during Propose.
- Do not migrate `active_lightning_chain`, `active_lava_orb`, `active_fungal_petards`, or any other active skill.
- Do not modify already migrated skill capabilities.
- Do not modify formal loot, inventory, gem board, or production drop data.
- Do not create a node editor, script DSL, or complex expression interpreter.
- Do not let the frontend guess behavior from skill id, old `behavior_type`, `visual_effect`, or VFX key.
- Do not use static fake SkillEvents.
- Do not introduce English player-visible copy.

## Decisions

### 1. `active_puncture` Skill Package structure

Future path:

`configs/skills/active/active_puncture/skill.yaml`

The package must include:

- `id`
- `version`
- `display.name_key`
- `display.description_key`
- `classification.tags`
- `classification.damage_type = physical`
- `classification.damage_form`
- `cast.mode`
- `cast.target_selector`
- `cast.search_range`
- `cast.cooldown_ms`
- `cast.windup_ms`
- `cast.recovery_ms`
- `behavior.template = melee_arc`
- `behavior.params`
- `hit.base_damage`
- `hit.can_crit`
- `hit.can_apply_status`
- `scaling.additive_stats`
- `scaling.final_stats`
- `scaling.runtime_params`
- `presentation.vfx`
- `presentation.sfx`
- `presentation.floating_text`
- `presentation.screen_feedback`
- `preview.show_fields`

Rationale: this keeps puncture aligned with the existing Skill Package contract while making the physical melee behavior explicit and editable.

### 2. `melee_arc` Behavior Template

Future path:

`configs/skills/behavior_templates/melee_arc.yaml`

Allowed params must include at least:

- `arc_angle`
- `arc_radius`
- `windup_ms`
- `hit_at_ms`
- `max_targets`
- `facing_policy`
- `hit_shape`
- `status_chance_scale`
- `slash_vfx_key`

Validation rules:

- `arc_angle` must be a legal angle using the template-declared range.
- `arc_radius` must be a positive number.
- `windup_ms` must be a non-negative number.
- `hit_at_ms` must be a non-negative number.
- `hit_at_ms` must not be earlier than `windup_ms` unless the template explicitly declares that hits may occur during windup.
- `max_targets` must be a positive integer, or a clearly declared `unlimited` enum if the schema supports it.
- `facing_policy` must be an enum; the first version must support at least `nearest_target`.
- `hit_shape` must be an enum; the first version must support at least `sector` / `arc`.
- `status_chance_scale` must have a legal numeric range.
- `slash_vfx_key` must be a key only, not player-visible text or script content.
- Scripts, expression DSL fields, function-call strings, complex expression interpreter fields, undeclared params, and frontend-only fake params must be rejected.

Rationale: puncture needs geometry and timing semantics, not a puncture-specific runtime branch. A template whitelist keeps the behavior reusable while preventing arbitrary logic from entering config.

### 3. SkillEditor `melee_arc` module

SkillEditor must add a melee sector module for `behavior.template = melee_arc` with:

- `arc_angle`
- `arc_radius`
- `windup_ms`
- `hit_at_ms`
- `max_targets`
- `facing_policy`
- `hit_shape`
- `status_chance_scale`
- `slash_vfx_key`
- read-only sector range summary
- read-only hit timing summary

The editor must use schema and behavior-template whitelist validation on edit and save. `facing_policy` and `hit_shape` must use enums. `arc_angle`, `arc_radius`, `windup_ms`, `hit_at_ms`, and `status_chance_scale` must use declared range validation. `max_targets` must use integer validation or an explicitly declared `unlimited` enum. `slash_vfx_key` must accept only a key. The editor must not write undeclared fields or frontend-only fake params.

Rationale: migration is incomplete unless designers can edit all geometry, timing, target cap, and presentation-key params in the same editor model used by previous migrated skills.

### 4. SkillRuntime `melee_arc` behavior

Runtime behavior must:

- Use the player position or cast source position as the arc origin.
- Face toward the nearest target by default, or use the configured `facing_policy` when more policies are added.
- Emit `cast_start`.
- Emit `melee_arc` with origin, facing direction, `arc_angle`, `arc_radius`, `hit_shape`, `windup_ms`, `hit_at_ms`, `max_targets`, `damage_type`, VFX key, and relevant payload.
- Select targets by `arc_angle + arc_radius + facing direction`.
- Allow targets inside the sector to be hit.
- Exclude targets outside the sector or outside `arc_radius`.
- Respect `max_targets`.
- Avoid HP changes before `hit_at_ms`.
- Emit `damage` at or after `hit_at_ms`, and make that event the source of life reduction.
- Emit `hit_vfx` and `floating_text` after or with `damage`.
- Use `damage_type = physical`.
- Avoid remote lock-on immediate damage semantics.
- Avoid release-time direct HP removal.
- Avoid static fake events.
- Avoid a Combat Runtime branch specific to `active_puncture`.

Rationale: SkillEvent is the shared runtime contract. Geometry, timing, and presentation must be visible to tests, WebApp, timeline, and AI report.

### 5. WebApp SkillEvent consumption

WebApp must consume real `melee_arc` events and use event payload fields such as origin, facing direction, arc angle, radius, duration/timing, `hit_shape`, and `vfx_key`. `damage`, `hit_vfx`, and `floating_text` must be rendered from their corresponding events.

It must not infer puncture behavior from `active_puncture`, legacy `skill_puncture`, `visual_effect = "puncture"`, `behavior_type`, or slash VFX names.

### 6. Skill Test Arena acceptance

Required scenarios:

- Single dummy.
- Dense small monsters.
- Three-target horizontal row as sector boundary support.

Required checks:

- Puncture releases from the player or cast source position.
- Puncture faces the nearest target in the first-version default policy.
- Nearby targets inside the sector are hit.
- Far targets outside `arc_radius` are not hit.
- Targets outside the sector are not hit.
- HP is unchanged before `hit_at_ms`.
- HP changes only through `damage` events at or after `hit_at_ms`.
- Changing `arc_radius` changes hit coverage.
- Changing `arc_angle` changes angular coverage.
- Changing `hit_at_ms` changes damage timing.
- Modifier Test Stack can affect final damage, range, or status chance runtime params without writing production data.

### 7. SkillEvent timeline acceptance

Timeline must display real events for `active_puncture`, including:

- `cast_start`
- `melee_arc`
- `damage`
- `hit_vfx`
- `floating_text`
- `cooldown_update` when present

Each displayed event must include:

- `timestamp_ms`
- `delay_ms`
- `duration_ms`
- `source_entity`
- `target_entity`
- `amount`
- `damage_type`
- `vfx_key`
- `reason_key`
- `payload`

### 8. AI self-test report acceptance

Expected player-facing description:

"自动朝最近敌人方向释放一次短距离扇形穿刺斩击，命中近战扇形范围内敌人后造成物理伤害，并显示物理斩击命中特效与伤害浮字。"

The report must check:

- `melee_arc` exists.
- `melee_arc` starts from the player position or cast source position.
- `melee_arc` faces the nearest target.
- `damage` exists.
- `hit_vfx` exists.
- `floating_text` exists.
- `damage` is not earlier than `hit_at_ms`.
- HP is not reduced before `hit_at_ms`.
- Targets inside the melee sector are hit.
- Far targets or outside-sector targets are not hit.
- `damage_type = physical`.
- Changing `arc_radius` changes hit target coverage.
- Changing `arc_angle` changes hit target coverage.
- The conclusion is `通过`, `部分通过`, or `不通过`.
- Inconsistencies and suggested fixes are Chinese.

## Risks / Trade-offs

- Melee behavior could accidentally reuse ranged nearest-target damage -> Mitigation: require an explicit `melee_arc` event, origin/facing/sector payload, arena geometry checks, and AI report geometry checks.
- Damage timing could collapse into release-time HP mutation -> Mitigation: require no life reduction before `hit_at_ms` and require `damage` events as the only HP reduction source.
- `max_targets` could be ambiguous if unlimited is allowed -> Mitigation: require either a positive integer or an explicitly declared `unlimited` enum across schema, template, editor, runtime, and tests.
- Frontend could special-case puncture visuals -> Mitigation: acceptance requires rendering from SkillEvents and forbids guessing from skill id or VFX names.
- Arc boundary math can be brittle around angle edges -> Mitigation: three-target horizontal row and parameter variation tests must cover inside, outside, and far targets.

## Migration Plan

1. Add `melee_arc` schema/template validation.
2. Create the `active_puncture` Skill Package.
3. Add SkillEditor `melee_arc` fields and validation.
4. Implement SkillRuntime `melee_arc` event generation and damage timing.
5. Consume `melee_arc` SkillEvents in WebApp.
6. Add Skill Test Arena puncture scenarios and parameter variation checks.
7. Add SkillEvent timeline and AI self-test report checks.
8. Run OpenSpec strict validation, config validation, Python tests, WebApp build/test, and puncture AI report generation.

Rollback strategy: because this migration introduces a new Skill Package path, rollback can remove or disable `active_puncture/skill.yaml` and keep the old `skill_templates.toml` path for non-migrated skills. Apply must not migrate any other active skill as part of this change.

## Open Questions

- Should the first implementation allow literal `unlimited` for `max_targets`, or require a positive integer only?
- Should `hit_shape` expose both `sector` and `arc` in the first Apply, or alias them to one implementation while keeping the enum explicit?
- Should status application use `status_chance_scale` immediately for bleed-oriented future work, or remain a validated no-op until status effects are connected?
