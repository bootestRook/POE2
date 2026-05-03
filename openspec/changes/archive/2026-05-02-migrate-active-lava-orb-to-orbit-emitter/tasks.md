## 0. Phase 0: Current State Scan And Migrated Capability Confirmation

Goal: Confirm the work starts from the completed Skill Package framework and does not hide an unarchived prerequisite.
Allowed scope: OpenSpec files, current skill configs, behavior templates, SkillEditor / Skill Test Arena / SkillEvent / AI report references.
Forbidden scope: Runtime edits, WebApp edits, `active_lava_orb/skill.yaml`, behavior template creation, formal drops, inventory, gem board changes.
Acceptance: `migrate-active-fungal-petards-to-triggered-damage-zone` is archived; active changes are listed; migrated Skill Packages include the seven completed skills; `active_lava_orb` is confirmed on the old `skill_templates.toml` path; reusable module-chain capabilities are identified.
Recommended verification command: `cmd /c openspec list`

- [x] 0.1 Confirm `migrate-active-fungal-petards-to-triggered-damage-zone` is archived.
- [x] 0.2 List current active changes and note any completed but unarchived work.
- [x] 0.3 Confirm migrated Skill Packages include `active_fire_bolt`, `active_ice_shards`, `active_penetrating_shot`, `active_frost_nova`, `active_puncture`, `active_lightning_chain`, and `active_fungal_petards`.
- [x] 0.4 Confirm `active_lava_orb` still uses `configs/skills/skill_templates.toml`.
- [x] 0.5 Confirm existing Skill Package, behavior template whitelist, SkillEvent, SkillEditor module fields, Skill Test Arena, SkillEvent timeline, AI self-test report, `damage_zone` circle hit test, marker / trigger, projectile, and module-chain capabilities.

## 1. Phase 1: `orbit_emitter` Schema / Behavior Template Design

Goal: Add a reusable orbit position emitter module that is not Lava Orb-specific.
Allowed scope: Skill schema, behavior-template whitelist, future `configs/skills/behavior_templates/orbit_emitter.yaml`, validation utilities, focused schema tests.
Forbidden scope: Lava Orb-specific monolithic template, hit testing, damage resolution, WebApp-only parameters, scripts, DSL, undeclared fields.
Acceptance: `orbit_emitter` fields and constraints are validated; invalid values, unknown fields, scripts, and unresolved marker references are rejected.
Recommended verification command: `python tools\\validate_skill_packages.py`

- [x] 1.1 Add `orbit_emitter` to the behavior-template whitelist.
- [x] 1.2 Define `orbit_center_policy`, `duration_ms`, `tick_interval_ms`, `orbit_radius`, `orbit_speed_deg_per_sec`, `orb_count`, `start_angle_deg`, `tick_marker_id`, `spawn_vfx_key`, and `tick_vfx_key`.
- [x] 1.3 Validate positive duration, interval, radius, and orb count.
- [x] 1.4 Validate `tick_interval_ms <= duration_ms`.
- [x] 1.5 Validate key-only VFX fields and reject scripts, expressions, undeclared parameters, and frontend-only fake parameters.
- [x] 1.6 Validate `tick_marker_id` uniqueness and later trigger referenceability.

## 2. Phase 2: `tick_schedule` Common Logic Design

Goal: Define reusable tick timing behavior for duration and interval driven modules.
Allowed scope: Shared runtime helper or internal `orbit_emitter` helper, focused unit tests, design comments where necessary.
Forbidden scope: Lava Orb-specific code, hit testing, damage, HP mutation, target selection, WebApp logic.
Acceptance: Given `duration_ms` and `tick_interval_ms`, the helper outputs deterministic `tick_index` and `timestamp_ms`; changing duration or interval changes tick count or frequency.
Recommended verification command: `python -m pytest tests`

- [x] 2.1 Decide whether `tick_schedule` is an internal `orbit_emitter` helper or a shared helper.
- [x] 2.2 Define input validation for `duration_ms` and `tick_interval_ms`.
- [x] 2.3 Define whether the first tick occurs at `0` or after one interval.
- [x] 2.4 Define whether the terminal duration boundary is inclusive.
- [x] 2.5 Add focused tests proving reusable timing behavior without Lava Orb skill-id branches.

## 3. Phase 3: `damage_zone trigger_position` Reuse Confirmation

Goal: Reuse existing `damage_zone` circle hit testing from orbit tick markers.
Allowed scope: Damage zone validation and runtime trigger integration if missing, focused tests for marker-origin behavior.
Forbidden scope: Lava Orb-specific hit test, Lava Orb-specific damage resolver, new hit area module, rewriting existing public damage-zone semantics.
Acceptance: `damage_zone` can listen to `orbit_emitter.tick_marker_id`, use `origin_policy = trigger_position`, and resolve circle hits from the tick position.
Recommended verification command: `python -m pytest tests`

- [x] 3.1 Confirm `trigger_marker_id` and `trigger_delay_ms` are accepted for module-chain damage zones.
- [x] 3.2 Confirm `origin_policy = trigger_position` uses marker position as origin.
- [x] 3.3 Confirm circle hit test remains shared and unchanged in responsibility.
- [x] 3.4 Confirm `damage` is emitted only after `damage_zone` hit resolution.

## 4. Phase 4: `active_lava_orb` Skill Package Creation

Goal: Create the Lava Orb Skill Package using `orbit_emitter + damage_zone`.
Allowed scope: `configs/skills/active/active_lava_orb/skill.yaml`, Chinese localization keys if needed, validation fixtures.
Forbidden scope: Other active skill migrations, formal drops, inventory, gem board behavior, random affix restoration, monolithic `lava_orb` template.
Acceptance: Lava Orb declares fire classification, orbit module, linked triggered circle damage zone, package fields, presentation keys, scaling fields, and preview fields.
Recommended verification command: `python tools\\validate_skill_packages.py`

- [x] 4.1 Create `configs/skills/active/active_lava_orb/skill.yaml`.
- [x] 4.2 Declare required package fields including display, classification, cast, modules, hit, scaling, presentation, and preview.
- [x] 4.3 Define `lava_orbit` as `orbit_emitter`.
- [x] 4.4 Define `lava_orb_damage_zone` as `damage_zone` triggered by `lava_orb_tick`.
- [x] 4.5 Use `damage_type = fire` and circle damage zone radius.
- [x] 4.6 Remove runtime dependency on the old `skill_templates.toml` path only after validation passes.

## 5. Phase 5: SkillEditor Orbit Module And Module-Chain Fields

Goal: Expose safe editing for `orbit_emitter` and linked `damage_zone` fields.
Allowed scope: SkillEditor module-chain UI, validation messages, controlled marker inputs, read-only summaries, test modifier preview plumbing.
Forbidden scope: Node editor, script DSL, arbitrary expression editing, writing test modifiers to real `skill.yaml`, restoring random affix editing.
Acceptance: SkillEditor shows orbit fields, damage-zone fields, the marker / trigger link, estimated tick count, total duration, orbit radius, hit radius, and connection status; save rejects missing triggers.
Recommended verification command: `npm test -- --runInBand SkillEditor`

- [x] 5.1 Add "鐜粫妯″潡 orbit_emitter" field support.
- [x] 5.2 Show orbit fields: `orbit_center_policy`, `duration_ms`, `tick_interval_ms`, `orbit_radius`, `orbit_speed_deg_per_sec`, `orb_count`, `start_angle_deg`, `tick_marker_id`, `spawn_vfx_key`, `tick_vfx_key`.
- [x] 5.3 Show linked damage zone fields: `trigger_marker_id`, `trigger_delay_ms`, `shape`, `origin_policy`, `radius`, `hit_at_ms`, `max_targets`, `damage_type`, and `vfx_key`.
- [x] 5.4 Show `orbit_emitter.tick_marker_id -> damage_zone.trigger_marker_id`.
- [x] 5.5 Use dropdown or controlled input for `tick_marker_id` and prefer existing marker dropdowns for `trigger_marker_id`.
- [x] 5.6 Validate marker / trigger consistency before save.

## 6. Phase 6: SkillRuntime `orbit_emitter + tick_schedule + damage_zone` Trigger

Goal: Execute Lava Orb through reusable module-chain runtime events.
Allowed scope: SkillRuntime module-chain executor, `orbit_emitter` runtime module, tick scheduling helper, marker emission, triggered damage zone integration, focused tests.
Forbidden scope: Combat Runtime `active_lava_orb` branch, cast-start damage, orbit-tick direct damage, Lava Orb-only hit testing, static fake events.
Acceptance: Runtime emits `orbit_spawn`, multiple `orbit_tick` markers, triggered `damage_zone`, fire `damage`, `hit_vfx`, `floating_text`, and cooldown events in order.
Recommended verification command: `python -m pytest tests`

- [x] 6.1 Emit `orbit_spawn` at cast time.
- [x] 6.2 Generate tick times through `tick_schedule`.
- [x] 6.3 Compute orb positions from center, radius, speed, start angle, orb count, and tick time.
- [x] 6.4 Emit `orbit_tick` with `tick_marker_id` and `orb_position`.
- [x] 6.5 Trigger `damage_zone` from each tick marker.
- [x] 6.6 Use `damage_zone` circle hit test from tick position.
- [x] 6.7 Apply HP changes only through `damage` events.

## 7. Phase 7: WebApp Orbit / Damage Zone SkillEvent Consumption

Goal: Render Lava Orb entirely from SkillEvent payloads.
Allowed scope: WebApp SkillEvent renderer, orbit visuals, tick position visuals, damage-zone visuals, HP / VFX / floating text rendering, tests or screenshots.
Forbidden scope: Skill-id guessing, old `behavior_type` guessing, `visual_effect` guessing, VFX key behavior guessing, fake frontend events.
Acceptance: WebApp renders orbit spawn, tick positions, circular fire hit zones, damage, hit VFX, and floating text from event payloads only.
Recommended verification command: `npm test -- --runInBand`

- [x] 7.1 Render orbit entity from `orbit_spawn`.
- [x] 7.2 Update or display orb position from `orbit_tick`.
- [x] 7.3 Render circular fire hit area from `damage_zone`.
- [x] 7.4 Render HP deltas from `damage`.
- [x] 7.5 Render hit VFX and floating text from `hit_vfx` and `floating_text`.
- [x] 7.6 Add regression checks that WebApp does not branch on `active_lava_orb`.

## 8. Phase 8: Skill Test Arena Lava Orb Acceptance

Goal: Prove the player-side Lava Orb behavior with controlled scenarios and parameter mutations.
Allowed scope: Skill Test Arena scenarios, test modifier stack, event assertions, HP/range/timing checks.
Forbidden scope: Static fake reports, writing test modifiers to production data, formal inventory, formal drops, gem board changes.
Acceptance: Dense pack, single dummy, and three-target-row scenarios prove orbit spawn, repeated ticks, tick-position damage zones, fire damage, no early HP loss, range changes, timing changes, and modifier effects.
Recommended verification command: `python tools\\run_skill_test_arena.py --skill active_lava_orb`

- [x] 8.1 Add dense small monster acceptance.
- [x] 8.2 Add single dummy acceptance.
- [x] 8.3 Add three-target horizontal row acceptance.
- [x] 8.4 Verify tick count approximately matches `duration_ms / tick_interval_ms`.
- [x] 8.5 Verify every `damage_zone.origin` equals a corresponding `orbit_tick.orb_position`.
- [x] 8.6 Verify parameter mutation effects for duration, interval, orbit radius, orb count, damage radius, and modifier stacks.

## 9. Phase 9: SkillEvent Timeline And AI Self-Test Report

Goal: Make Lava Orb debuggable through the existing timeline and Chinese AI report loop.
Allowed scope: Timeline display, report generator checks, Chinese report output, event comparison utilities.
Forbidden scope: Static fake timeline, static fake report, English player-visible report content, skill-id behavior guessing.
Acceptance: Timeline shows real orbit and damage-zone events; AI report checks orbit spawn, ticks, trigger-position damage zones, fire damage, parameter effects, and Chinese conclusion/fix items.
Recommended verification command: `python tools\\generate_skill_test_report.py --skill active_lava_orb --scenario dense_pack`

- [x] 9.1 Add timeline support for `orbit_spawn` and `orbit_tick` payloads.
- [x] 9.2 Show tick marker ids, tick index, tick time, orb position, origin, radius, damage type, and VFX keys.
- [x] 9.3 Add AI report checks for orbit spawn center and orbit parameters.
- [x] 9.4 Add AI report checks for repeated orbit ticks and tick count.
- [x] 9.5 Add AI report checks for triggered damage zone origin and damage timing.
- [x] 9.6 Add AI report checks for duration, tick interval, orbit radius, damage-zone radius, and modifier effects.
- [x] 9.7 Output Chinese conclusion as `閫氳繃`, `閮ㄥ垎閫氳繃`, or `涓嶉€氳繃`, with Chinese inconsistency items and suggested fixes.

## 10. Phase 10: Verification And Regression

Goal: Confirm migration behavior without broadening scope.
Allowed scope: Validation commands, focused runtime/editor/WebApp/test-arena/report checks, OpenSpec task updates.
Forbidden scope: Unrelated refactors, unrelated active skill migration, formal drops, inventory, gem board changes, node editor, script DSL, complex expression interpreter.
Acceptance: OpenSpec strict validation passes; Skill Package validation passes; focused runtime/editor/WebApp/test-arena/report checks pass; forbidden files remain untouched except explicitly allowed apply-phase files.
Recommended verification command: `cmd /c openspec validate migrate-active-lava-orb-to-orbit-emitter --strict`

- [x] 10.1 Run OpenSpec strict validation.
- [x] 10.2 Run Skill Package validation.
- [x] 10.3 Run focused runtime tests for orbit emitter, tick schedule, and triggered damage zone behavior.
- [x] 10.4 Run focused SkillEditor tests for orbit module fields and marker / trigger validation.
- [x] 10.5 Run focused WebApp tests for SkillEvent-driven orbit rendering.
- [x] 10.6 Run Skill Test Arena and AI self-test report for `active_lava_orb`.
- [x] 10.7 Confirm no runtime, WebApp, formal drop, inventory, gem board, or unrelated migration files changed outside the apply scope.
