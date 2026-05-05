## Context

The combat runtime currently has two skill event paths for stateful effects. `status_apply` events are consumed by `CombatSession._consume_status_event()` and become monster `AilmentState` entries. `buff_apply` events are consumed by `CombatSession._consume_buff_event()` and either become player `BuffState` entries or are translated into monster-side ad hoc effects.

The target model is simpler: every runtime state is a buff. `status_apply` can remain as a compatibility event name, but consuming it must create a `BuffState` with a `buff_type` enum such as `ignite`, `frostbite`, `shock`, `guard`, `wilt`, or a buff `effect_type` enum such as `conversion` or `damage_taken_increase`. Runtime storage, ticking, queries, and damage modifiers must all read this one buff model.

## Goals / Non-Goals

**Goals:**
- Define one canonical query surface for combat state checks and state-derived values.
- Preserve existing `status_apply` and `buff_apply` event compatibility.
- Keep monster-side debuffs and damage-over-time effects available through stable methods instead of direct field reads.
- Remove `AilmentState` as the monster-side storage type and use `BuffState` as the only runtime state model.
- Keep player guard-style buffs functional through the same `BuffState` dataclass.
- Add tests that prove runtime behavior, not just payload shape.

**Non-Goals:**
- No Burning Shot behavior change.
- No skill-specific balance or VFX change.
- No frontend battle-runtime rewrite unless direct legacy state reads are found in the playable path.
- No skill config rename from `ailments` to `buffs`; this change targets runtime state storage and consumption.

## Decisions

1. Use `BuffState` as the only runtime state model.

   Monster-side effects are no longer only ailments: frostbite, ignite, shock, trauma, wilt, and damage-taken-increase effects all behave as buffs. Extend `BuffState` with the fields needed by damage-over-time, stacking, trigger counts, damage modifiers, and functional `effect_type` values, then store both player and monster runtime state in `buffs`.

   Alternative considered: introduce a neutral `RuntimeState`. That would remove `AilmentState`, but it would still leave "buff" and "state" as parallel concepts when the intended model is that all states are buffs.

2. Treat runtime events as inputs, not the canonical query API.

   `status_apply` and `buff_apply` remain valid event types, but gameplay decisions must query target state through buff-oriented methods such as `has_buff()` and `buff_damage_per_second()`.

   Alternative considered: collapse both event types into a new event name. That would be a breaking event pipeline change and would require broader frontend and test updates.

3. Normalize monster-targeted buff effects through the same monster state semantics.

   Monster-targeted `buff_apply` effects that represent negative functionality, such as `effect_type=damage_taken_increase`, should be stored in `monster.buffs` and be resolved through the buff effect enum plus optional filters such as `source_skill_id`.

   Alternative considered: keep a separate `Monster.states` collection. That would duplicate the concept of buff after deciding all runtime states are buffs.

4. Tests must prove consumed runtime behavior.

   Alignment tests should execute `SkillRuntime` and/or `CombatSession` consumption, then assert state presence, ticking, damage-over-time, stacking, or follow-up damage behavior. Config-only tests are insufficient for this migration.

## Risks / Trade-offs

- Existing code may still read `monster.ailments` directly -> Mitigation: migrate gameplay decisions and tests to `monster.buffs` or buff query helpers.
- Player and monster buff semantics are not identical -> Mitigation: use one dataclass with optional fields; player guard uses absorb fields, monster DoT/debuffs use damage and effect fields.
- New helper names could become a second abstraction layer without replacing old reads -> Mitigation: tasks must include targeted call-site migration, storage rename, and tests proving the new buff query methods are used for gameplay decisions.
- Frontend may have a local runtime mirror for state behavior -> Mitigation: inspect playable WebApp battle path during implementation; if frontend behavior changes, verify visually in the actual battle view.

## Migration Plan

1. Extend `BuffState` to cover duration, stacks, damage-over-time, effect value, trigger counts, polarity, and source skill.
2. Replace monster-side `AilmentState` and ailment collection usage with `monster.buffs`.
3. Route monster-targeted `status_apply` and compatible `buff_apply` consumption through shared buff application semantics.
4. Migrate gameplay condition checks from direct legacy field reads to buff query helpers.
5. Add focused runtime tests for buff presence, damage-over-time lookup, status-to-buff translation, monster-targeted buff application, and player guard compatibility.

## Open Questions

- None.
