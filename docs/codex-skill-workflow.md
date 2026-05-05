# Codex Skill Workflow

Use this workflow before proposing or editing skill behavior, skill configs, skill VFX, or skill tests.

## 1. Start From The Mechanism

Do not search only by the requested skill ID.

Identify the gameplay mechanism first:

- kill-triggered effects
- projectile launch, hit, pierce, chain, split, or shotgun behavior
- area, nova, damage zone, orbit, chain, guard, ailment, or buff behavior
- duration, tick, cooldown, mana, cast speed, or targeting behavior
- VFX, hit feedback, floating text, or frontend preview behavior

Then search for the mechanism names, event names, behavior templates, runtime params, and at least one existing migrated skill that uses the same mechanism.

## 2. Prefer Existing Paths

Before adding a new runtime path, find whether the project already has:

- a config field for the same behavior
- a behavior template parameter
- a `SkillRuntime` event path
- a `CombatSession` consumption path
- frontend local simulation for the same event
- tests proving similar behavior

If a similar path exists, extend or parameterize it instead of creating a parallel implementation.

If no path exists, record what was searched and why a new path is necessary.

## 3. Kill-Triggered Effects

For effects described as "on kill", "after defeating an enemy", or "when this skill kills":

1. Search `on_kill`, `unit_killed`, `killed`, `defeated`, `kill_explosion`, and similar terms.
2. Check the damage consumption flow before adding new kill detection.
3. Reuse the existing killed result and stable trigger roll if available.
4. Emit or reuse explicit events for kill-triggered follow-up effects.
5. Enforce per-source limits using an existing event identifier such as `area_id`, projectile id, chain segment id, or trigger event id.

Example: five-color magic bolt uses the damage kill flow in `CombatSession._consume_damage_event`, then triggers its kill explosion from the existing killed result.

## 4. Runtime And Frontend Must Match

When changing runtime skill behavior, check whether the frontend has a local mirror implementation.

Backend-only changes are not enough if the player can see or exercise the skill in the browser.

Keep event names, payload fields, positions, delays, VFX keys, hit targets, and floating text behavior aligned between Python runtime and frontend simulation.

## 5. Tests Must Prove Behavior

Skill alignment tests must prove actual runtime behavior, not only config payload presence.

Prefer focused tests that assert:

- the triggering condition occurs
- the follow-up event is emitted
- the event position, target, delay, amount, and damage type match the skill description
- limits such as "once per area" are enforced
- existing behavior still passes for the reference skill being reused

## 6. State The Reuse Point

In the plan or final summary, explicitly name the reused function, event, config field, or test.

If the implementation creates a new mechanism, state why reuse was not sufficient.
