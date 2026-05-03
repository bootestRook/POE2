## Context

The current Skill Package framework has migrated Skill Packages for:

- `active_fire_bolt`
- `active_ice_shards`
- `active_penetrating_shot`
- `active_frost_nova`
- `active_puncture`
- `active_lightning_chain`
- `active_fungal_petards`

`active_lava_orb` remains in `configs/skills/skill_templates.toml` with `behavior_type = "orbit"`. Existing reusable capabilities include Skill Package loading, behavior-template whitelists, SkillEvent output, SkillEditor module fields, Skill Test Arena, SkillEvent timeline, AI self-test reports, `damage_zone` circle hit testing, marker / trigger links, projectile modules, and module-chain execution patterns. This change should reuse those capabilities and should not rewrite public modules.

The target chain is:

```text
orbit_emitter
  -> orbit_tick(marker)
  -> damage_zone(circle, origin_policy = trigger_position)
  -> damage
  -> hit_vfx / floating_text
```

## Goals / Non-Goals

**Goals:**

- Define the future `active_lava_orb` Skill Package shape.
- Define `orbit_emitter` as a reusable module that emits orbit positions and markers.
- Define reusable `tick_schedule` logic for duration and interval based ticks.
- Reuse `damage_zone` circle hit testing and marker / trigger linking.
- Keep damage resolution event-driven and limited to `damage`.
- Keep WebApp rendering driven by SkillEvent payloads only.
- Define SkillEditor, Skill Test Arena, timeline, and AI report acceptance.

**Non-Goals:**

- Do not write runtime code in this round.
- Do not modify WebApp in this round.
- Do not create `configs/skills/active/active_lava_orb/skill.yaml` in this round.
- Do not create `configs/skills/behavior_templates/orbit_emitter.yaml` in this round.
- Do not implement `orbit_emitter`, `tick_schedule`, or modify `damage_zone` in this round.
- Do not modify formal drops, inventory, or gem board behavior.
- Do not create a Lava Orb-only monolithic template, node editor, script DSL, complex expression interpreter, static fake events, or frontend skill-id behavior guesses.

## Decisions

### Decision 1: `active_lava_orb` Skill Package structure

Future path:

```text
configs/skills/active/active_lava_orb/skill.yaml
```

The future Skill Package must include at least:

- `id`
- `version`
- `display.name_key`
- `display.description_key`
- `classification.tags`
- `classification.damage_type = fire`
- `classification.damage_form`
- `cast.mode`
- `cast.target_selector`
- `cast.search_range`
- `cast.cooldown_ms`
- `cast.windup_ms`
- `cast.recovery_ms`
- `modules`
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

Suggested future module chain:

```yaml
modules:
  - id: lava_orbit
    type: orbit_emitter
    params:
      orbit_center_policy: caster
      duration_ms: 3600
      tick_interval_ms: 300
      orbit_radius: 180
      orbit_speed_deg_per_sec: 180
      orb_count: 1
      start_angle_deg: 0
      tick_marker_id: lava_orb_tick
      spawn_vfx_key: skill_event.lava_orb.spawn
      tick_vfx_key: skill_event.lava_orb.tick

  - id: lava_orb_damage_zone
    type: damage_zone
    trigger:
      trigger_marker_id: lava_orb_tick
      trigger_delay_ms: 0
    params:
      shape: circle
      origin_policy: trigger_position
      radius: 72
      hit_at_ms: 0
      max_targets: 8
      damage_type: fire
      vfx_key: skill_event.lava_orb.hit
```

`orbit_emitter` does not directly cause damage. `orbit_tick` only provides position, time, and marker data. `damage_zone` uses `trigger_position` as the circular hit area center. `damage` remains the only HP-changing event.

### Decision 2: `orbit_emitter` behavior template

Future path:

```text
configs/skills/behavior_templates/orbit_emitter.yaml
```

Fields:

- `orbit_center_policy`
- `duration_ms`
- `tick_interval_ms`
- `orbit_radius`
- `orbit_speed_deg_per_sec`
- `orb_count`
- `start_angle_deg`
- `tick_marker_id`
- `spawn_vfx_key`
- `tick_vfx_key`

Field constraints:

- `orbit_center_policy` is an enum; first version supports at least `caster`.
- `duration_ms` is positive.
- `tick_interval_ms` is positive.
- `tick_interval_ms` must not be greater than `duration_ms`.
- `orbit_radius` is positive.
- `orbit_speed_deg_per_sec` is a legal numeric value.
- `orb_count` is a positive integer.
- `start_angle_deg` is a legal angle.
- `tick_marker_id` is unique in the Skill Package marker scope.
- `tick_marker_id` must be referenceable by a later `damage_zone.trigger_marker_id`.
- `spawn_vfx_key` and `tick_vfx_key` are key-only fields.
- Scripts, expression DSL fields, undeclared parameters, and frontend-only fake parameters are forbidden.

The module computes orbit positions from caster/source position, radius, speed, start angle, orb count, tick index, and timestamp. It does not perform hit testing, target selection, HP mutation, damage resolution, or presentation decisions beyond emitting declared event payload keys.

### Decision 3: `tick_schedule` common logic

`tick_schedule` may be implemented as an internal helper used by `orbit_emitter`, or as a generic timing helper shared by later modules. The important boundary is that it is reusable and not Lava Orb-specific.

Inputs:

- `duration_ms`
- `tick_interval_ms`

Outputs:

- `tick_index`
- `timestamp_ms`

Rules:

- It computes deterministic tick times from duration and interval.
- It should produce a tick count approximately equal to `duration_ms / tick_interval_ms`, with implementation defining whether the terminal timestamp is inclusive.
- It does not compute orbit positions by itself unless called by an orbit module.
- It does not perform hit testing.
- It does not emit damage.
- It does not mutate HP.
- It does not contain skill-id branches.

### Decision 4: `damage_zone` reuse

Lava Orb must not introduce a Lava Orb-specific hit area or damage resolver. It reuses existing `damage_zone` circle semantics:

- `shape = circle`
- `origin_policy = trigger_position`
- `trigger_marker_id = orbit_emitter.tick_marker_id`
- `trigger_delay_ms = 0`, or a configurable non-negative delay
- `radius` controls each tick hit range
- `hit_at_ms` controls each tick damage timing
- `damage_type = fire`

Each `orbit_tick` produces a marker containing the current orb position. The linked `damage_zone` listens for that marker and uses the marker position as its origin. The existing circle hit test finds targets. Only `damage` events reduce HP.

### Decision 5: SkillEvent design

Lava Orb must output at least:

- `cast_start`
- `orbit_spawn`
- `orbit_tick`
- `damage_zone`
- `damage`
- `hit_vfx`
- `floating_text`
- `cooldown_update`, when present

`orbit_spawn` expresses persistent orbit entity creation. Payload includes:

- `orbit_center`
- `orbit_radius`
- `duration_ms`
- `orb_count`
- `orbit_speed_deg_per_sec`
- `spawn_vfx_key`

`orbit_tick` expresses each tick time and orb position. Payload includes:

- `tick_index`
- `tick_time_ms`
- `orb_position`
- `tick_marker_id`
- `tick_vfx_key`

`damage_zone` expresses the circular hit area triggered by `orbit_tick`. Payload includes:

- `shape = circle`
- `origin = orb_position`
- `radius`
- `damage_type = fire`
- `trigger_marker_id`

`damage` is emitted only after the `damage_zone` hit test succeeds and is the only HP-changing event. `hit_vfx` and `floating_text` are emitted from real hits, not from static fake events.

### Decision 6: Runtime design

Runtime must:

- Create `orbit_spawn` at cast time.
- Use `tick_schedule` to generate multiple `orbit_tick` events.
- Compute each tick's `orb_position` from orbit parameters.
- Emit a marker for each `orbit_tick`.
- Let `damage_zone` listen to the tick marker.
- Use the tick position as the damage zone origin.
- Use existing `damage_zone` circle hit test to find targets.
- Emit `damage` for HP changes.
- Emit `hit_vfx` and `floating_text` from damage results.
- Emit `cooldown_update` when the runtime already supports it.

Runtime must not:

- Reduce HP at `cast_start`.
- Let `orbit_tick` directly reduce HP.
- Add a Lava Orb-specific hit test.
- Add a Lava Orb-specific damage resolver.
- Add an `active_lava_orb` special branch in Combat Runtime.
- Recalculate skill behavior in WebApp.

### Decision 7: WebApp design

WebApp must:

- Render orbit entities from `orbit_spawn`.
- Update Lava Orb position or display tick events from `orbit_tick`.
- Render small fire hit areas from `damage_zone`.
- Render HP changes from `damage`.
- Render hit VFX from `hit_vfx`.
- Render damage numbers from `floating_text`.

WebApp must not infer behavior from `skill_id`, old `behavior_type`, `visual_effect`, or VFX key. The event payload is the contract.

### Decision 8: SkillEditor design

SkillEditor adds an "环绕模块 orbit_emitter" module section.

Orbit fields:

- `orbit_center_policy`
- `duration_ms`
- `tick_interval_ms`
- `orbit_radius`
- `orbit_speed_deg_per_sec`
- `orb_count`
- `start_angle_deg`
- `tick_marker_id`
- `spawn_vfx_key`
- `tick_vfx_key`

SkillEditor adds or reuses a `damage_zone` module section.

Damage zone fields:

- `trigger_marker_id`
- `trigger_delay_ms`
- `shape = circle`
- `origin_policy = trigger_position`
- `radius`
- `hit_at_ms`
- `max_targets`
- `damage_type = fire`
- `vfx_key`

Link display:

```text
orbit_emitter.tick_marker_id -> damage_zone.trigger_marker_id
```

Read-only summaries:

- Estimated tick count.
- Estimated total duration.
- Orbit radius.
- Per-tick hit radius.
- Current module-chain connection status.

Editing requirements:

- `tick_marker_id` uses a dropdown or controlled input.
- `trigger_marker_id` prefers selecting from existing markers.
- Saving rejects nonexistent trigger references.
- Saving validates marker / trigger consistency.
- Test modifiers must not write into real `skill.yaml`.
- Random affix editing must not be restored.

### Decision 9: Skill Test Arena acceptance

Required scenes:

- Dense small monsters.
- Single dummy.
- Three horizontal targets.

Acceptance checks:

- `orbit_spawn` exists.
- `orbit_tick` appears multiple times.
- Tick count is approximately `duration_ms / tick_interval_ms`.
- Every `orbit_tick` has a position.
- `damage_zone` is triggered by `orbit_tick`.
- `damage_zone.origin` equals the tick position.
- HP changes only after `damage`.
- `cast_start` does not reduce HP.
- `orbit_tick` does not directly reduce HP.
- Changing `duration_ms` changes tick count.
- Changing `tick_interval_ms` changes tick frequency.
- Changing `orbit_radius` changes `orb_position`.
- Changing `orb_count` changes orbit entity count.
- Changing `damage_zone.radius` changes hit coverage.
- Modifier test stacks affect final damage, range, or tick parameters without writing production data.

### Decision 10: AI self-test report acceptance

Expected player-side description:

```text
自动生成围绕玩家旋转的熔岩球，熔岩球在持续时间内周期性扫过附近敌人，每次 tick 在熔岩球当前位置产生小范围火焰伤害，并显示灼烧命中特效与伤害浮字。
```

The report must check:

- Whether `orbit_spawn` exists.
- Whether `orbit_spawn` is centered on player / caster.
- Whether multiple `orbit_tick` events exist.
- Whether `tick_count` matches `duration_ms / tick_interval_ms`.
- Whether `orbit_tick` includes `orb_position`.
- Whether `damage_zone` exists.
- Whether `damage_zone.origin` equals the matching `orbit_tick` position.
- Whether `damage` exists.
- Whether `damage` is produced only after `damage_zone` hits.
- Whether `cast_start` does not reduce HP.
- Whether `orbit_tick` does not directly reduce HP.
- Whether `damage_type = fire`.
- Whether changing `duration_ms` changes tick count.
- Whether changing `tick_interval_ms` changes tick frequency.
- Whether changing `orbit_radius` changes `orb_position`.
- Whether changing `damage_zone.radius` changes hit coverage.
- Whether the conclusion is `通过`, `部分通过`, or `不通过`.
- Whether Chinese inconsistency items and suggested fixes are emitted.

## Risks / Trade-offs

- [Risk] `orbit_emitter` could grow into a Lava Orb-only template. Mitigation: keep it limited to orbit entity creation, position calculation, tick markers, and event payloads.
- [Risk] `tick_schedule` could duplicate timing logic in several modules. Mitigation: define it as a reusable helper boundary even if first implemented internally.
- [Risk] Damage could be applied too early from `orbit_tick`. Mitigation: require `damage_zone` hit test and `damage` as the only HP mutation path.
- [Risk] WebApp could special-case `active_lava_orb` for visuals. Mitigation: require rendering from `orbit_spawn`, `orbit_tick`, `damage_zone`, `damage`, `hit_vfx`, and `floating_text` payloads.
- [Risk] Marker ids could collide across repeated ticks. Mitigation: config marker ids are package-scoped declarations; runtime events should carry tick identity in payload (`tick_index`, timestamp, and instance identity if needed).

## Migration Plan

1. Confirm current state and reusable module-chain capabilities.
2. Add `orbit_emitter` schema / behavior-template design.
3. Define reusable `tick_schedule` semantics.
4. Confirm `damage_zone` trigger-position reuse.
5. Create the future Lava Orb Skill Package during apply, after validation rules exist.
6. Add SkillEditor fields and marker / trigger validation.
7. Implement runtime orbit ticks and triggered damage zone execution without skill-id branches.
8. Update WebApp to render orbit events from payloads.
9. Add Skill Test Arena, SkillEvent timeline, and AI report acceptance.
10. Run strict OpenSpec, package validation, runtime/editor/WebApp/test-arena/report regressions.

Rollback during apply should keep the old `skill_templates.toml` entry available until the new package passes validation and acceptance.

## Open Questions

- Should `tick_schedule` include a tick at `timestamp_ms = 0`, or should the first damage tick occur after one `tick_interval_ms`?
- Should `start_angle_deg` be normalized to `[0, 360)` during validation or accepted as any numeric angle and normalized at runtime?
- Should `orb_count > 1` emit one `orbit_tick` event per orb per tick, or one event containing multiple orb positions?
