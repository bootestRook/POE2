## Why

`active_puncture` / `穿刺` is the next migration target because the Skill Package framework has already proven projectile, fan projectile, line pierce, and player-centered nova slices through SkillEditor, Skill Test Arena, SkillEvent timeline, and AI self-test report coverage. Puncture is the first remaining active skill whose intended player experience is melee and directional, so it must prove that the new skill system can express close-range facing and sector hit rules instead of only ranged or area behaviors.

The current old `skill_templates.toml` path can still make puncture behave like remote target lock or immediate damage. That is not acceptable for the target fantasy: "自动朝最近敌人方向释放一次短距离扇形穿刺斩击，命中近战扇形范围内敌人后造成物理伤害，并显示物理斩击命中特效与伤害浮字。"

## What Changes

- Migrate only `active_puncture` from the old `skill_templates.toml` path to a future Skill Package at `configs/skills/active/active_puncture/skill.yaml`.
- Introduce a whitelisted `melee_arc` behavior template at `configs/skills/behavior_templates/melee_arc.yaml`.
- Require `melee_arc` to express melee distance, facing direction, sector/arc hit shape, hit timing, max target handling, slash VFX key, and status chance scaling through declared params only.
- Require runtime behavior to originate from the player or cast source position and face the nearest target by first-version default.
- Require target selection by `arc_angle + arc_radius + facing direction`, so close targets inside the sector can be hit and far or outside-sector targets cannot be hit.
- Require `SkillEvent` output for `cast_start`, `melee_arc`, `damage`, `hit_vfx`, `floating_text`, and `cooldown_update` when present.
- Require damage to be applied only by `damage` events at or after `hit_at_ms`; release-time instant HP removal is forbidden.
- Extend SkillEditor with a `melee_arc` module exposing every declared field plus read-only range and hit timing summaries.
- Extend Skill Test Arena acceptance for single dummy, dense small monsters, and three-target horizontal row scenarios that prove actual melee range and sector boundaries.
- Extend SkillEvent timeline and AI self-test report acceptance for puncture, including Chinese inconsistency items and suggested fixes.
- Keep existing migrated Skill Packages intact: `active_fire_bolt`, `active_ice_shards`, `active_penetrating_shot`, and `active_frost_nova`.
- Do not migrate `active_lightning_chain`, `active_lava_orb`, `active_fungal_petards`, or any other active skill in this change.
- Do not create a node editor, script DSL, complex expression interpreter, static fake event system, frontend behavior guessing, or English player-visible copy.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `v1-minimal-sudoku-gem-loop`: Add requirements for the `active_puncture` Skill Package migration, `melee_arc` behavior template, SkillEditor field support, SkillEvent output, Skill Test Arena acceptance, and AI self-test report acceptance.

## Impact

- Future config scope: `configs/skills/active/active_puncture/skill.yaml`, `configs/skills/behavior_templates/melee_arc.yaml`, skill schema/template validation, and Chinese localization keys.
- Future runtime scope: SkillRuntime behavior template dispatch, nearest-target facing, sector hit testing, hit timing, max target handling, physical damage events, and presentation events.
- Future editor/testing/report scope: SkillEditor `melee_arc` module fields and validation, Skill Test Arena puncture scenarios, SkillEvent timeline display, and AI self-test report checks.
- Future WebApp scope: consume `melee_arc`, `damage`, `hit_vfx`, and `floating_text` SkillEvents without guessing behavior from skill id, legacy `behavior_type`, or VFX names.
- Current confirmed preconditions: `migrate-active-frost-nova-to-player-nova` is archived under `openspec/changes/archive/2026-04-30-migrate-active-frost-nova-to-player-nova`; active changes are `refactor-projectile-editor-panel-and-preview-flow` and `refactor-three-gem-kinds-v1-phase2`, both currently complete but not archived; migrated Skill Packages include `active_fire_bolt`, `active_ice_shards`, `active_penetrating_shot`, and `active_frost_nova`; `active_puncture` still references `skill_puncture` in `configs/gems/active_skill_gems.toml` and `configs/skills/skill_templates.toml`.
