## Why

`active_lava_orb / 熔岩球` is the last V1 active skill that does not yet have an independent Skill Package directory after the completed migrations for `active_fire_bolt`, `active_ice_shards`, `active_penetrating_shot`, `active_frost_nova`, `active_puncture`, `active_lightning_chain`, and `active_fungal_petards`. It still exists on the old `configs/skills/skill_templates.toml` path as `behavior_type = "orbit"`, which prevents it from using the same package validation, SkillEditor fields, Skill Test Arena scenarios, SkillEvent timeline, and AI self-test report loop as the migrated skills.

Lava Orb is more complex than the earlier migrations because its player-facing behavior is persistent and position-producing: an orb is spawned around the caster, moves on an orbit for a duration, emits repeated ticks, and each tick creates a small circular fire damage area at the current orb position. Earlier skills could be represented as one projectile, one chain, one nova, one melee arc, or one projectile-to-zone trigger. Lava Orb needs reusable temporal and positional composition.

This must not become a monolithic `lava_orb` template. A large dedicated template would duplicate timing, marker / trigger linking, circle hit testing, damage resolution, event rendering, editor fields, and report checks. The intended model is a reusable module chain:

```text
orbit_emitter
  -> orbit_tick
  -> damage_zone(circle)
  -> damage
  -> hit_vfx / floating_text
```

`orbit_emitter` should only create orbit entities and tick positions. `tick_schedule` should only compute tick timing. `damage_zone` should reuse the existing circle hit test with `origin_policy = trigger_position`. `damage` should remain the only HP-changing event. The existing marker / trigger mechanism from Fungal Petards is the right connection model, because it already expresses "one module emits a marker; a later module listens to that marker" without inventing a new module-link DSL.

WebApp must not infer orbit behavior from `active_lava_orb`, the old `behavior_type`, `visual_effect`, or a VFX key. It should consume `SkillEvent` payloads: `orbit_spawn` creates the orbit presentation, `orbit_tick` updates or displays the current orb position, `damage_zone` renders the hit area, and `damage` / `hit_vfx` / `floating_text` render results.

This change proposes the Lava Orb migration only. It does not migrate other active skills. It does not create a node editor, script DSL, complex expression interpreter, static fake event system, or frontend skill-id behavior guesses. It should not rewrite existing public modules; implementation should reuse existing module-chain, marker / trigger, damage zone, SkillEvent, SkillEditor, Skill Test Arena, and AI report capabilities, extracting only small reusable helpers when necessary.

## What Changes

- Plan migration of only `active_lava_orb / 熔岩球` from `configs/skills/skill_templates.toml` to a future Skill Package at `configs/skills/active/active_lava_orb/skill.yaml`.
- Define a reusable `orbit_emitter` behavior template that emits `orbit_spawn` and repeated `orbit_tick` events.
- Define `tick_schedule` as reusable timing logic, either internal to `orbit_emitter` or as a shared helper, with no Lava Orb-specific behavior.
- Reuse existing `damage_zone` circle hit testing by triggering it from each `orbit_tick` marker and using `origin_policy = trigger_position`.
- Require the player-side effect: "自动生成围绕玩家旋转的熔岩球，熔岩球在持续时间内周期性扫过附近敌人，每次 tick 在熔岩球当前位置产生小范围火焰伤害，并显示灼烧命中特效与伤害浮字。"
- Require SkillEvents for `cast_start`, `orbit_spawn`, `orbit_tick`, `damage_zone`, `damage`, `hit_vfx`, `floating_text`, and `cooldown_update` when present.
- Require SkillEditor support for an "环绕模块 orbit_emitter" section, linked `damage_zone` fields, marker / trigger consistency validation, and read-only timing/range summaries.
- Require Skill Test Arena acceptance for dense small monsters, a single dummy, and three horizontal targets.
- Require the AI self-test report to validate the orbit / tick / damage_zone / damage chain from real events.
- Keep this round to OpenSpec Explore / Propose artifacts only: no runtime code, no WebApp edits, no `active_lava_orb/skill.yaml`, and no `skill.yaml` creation.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `v1-minimal-sudoku-gem-loop`: Add requirements for `orbit_emitter`, reusable `tick_schedule`, triggered `damage_zone` reuse from orbit tick markers, Lava Orb Skill Package migration, Lava Orb SkillEvents, SkillEditor orbit module support, WebApp orbit rendering, Skill Test Arena acceptance, and AI report orbit validation.

## Impact

- Future config scope: `configs/skills/behavior_templates/orbit_emitter.yaml`, `configs/skills/schema/skill.schema.json`, future `configs/skills/active/active_lava_orb/skill.yaml`, behavior-template whitelist, validation tools, and Chinese localization keys when needed.
- Future runtime scope: SkillRuntime module-chain execution for `orbit_emitter`, reusable tick scheduling, orbit position calculation, marker emission, triggered `damage_zone` execution, circle hit testing, fire damage events, hit VFX, floating text, and cooldown updates.
- Future editor/testing/report scope: SkillEditor orbit module fields, module-chain link display, marker / trigger validation, Skill Test Arena scenarios and parameter mutations, SkillEvent timeline display, and AI self-test report checks.
- Future WebApp scope: render orbit entities, tick positions, circular damage zones, HP deltas, hit VFX, and floating text from SkillEvent payloads only.
- Explicitly out of scope for this round: runtime code, WebApp code, `active_lava_orb/skill.yaml`, `skill.yaml` creation, formal drops, inventory, gem board behavior, node graph editing, script DSL, complex expression interpretation, static fake events, skill-id based frontend behavior, and English player-visible copy.
