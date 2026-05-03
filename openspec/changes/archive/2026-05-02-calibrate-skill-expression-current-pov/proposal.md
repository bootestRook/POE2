## Why

Current active, passive, and support skill checks are good at proving SkillEvent behavior, but they still lean on fixed test-arena targets. Fixed dummies are useful for regression, not for judging player feel.

The next calibration pass should tune only expression-facing parameters for the current battle POV: skill distance, search range, projectile count, cooldown cadence, projectile speed, area coverage, chain reach, orbit duration, tick interval, and support scaling pressure. Damage values should stay out of this pass.

The current WebApp battle surface is a 512x512 world with a 0.22 follow camera, player speed 250, enemy chase speed 58, and normal spawn distances clustered around the 240-340 world-unit band from the player spawn. Several skills currently use search ranges near or beyond the whole encounter scale, which can flatten skill identity and make distance/cooldown choices hard to feel.

## What Changes

- Add a current-POV skill expression calibration tool that reads active Skill Packages and support scaling rules.
- Score active-skill expression parameters without using dummy scenarios as balance evidence.
- Produce recommended expression-only adjustments for distance, cooldown, count, timing, and coverage fields.
- Analyze support/passive expression pressure separately from damage modifiers.
- Keep the tool non-destructive: it emits a report and does not write `skill.yaml`, scaling TOML, inventory, gem board, or damage values.

## Non-goals

- Do not tune `hit.base_damage`, damage type modifiers, crit, or HP.
- Do not change runtime target selection, SkillEvent semantics, VFX rendering, loot, inventory, or sudoku board rules.
- Do not treat test-arena wood dummies as player-feel evidence.

## Impact

- New code: a small Python calibration module and CLI.
- New tests: focused checks that the calibration is damage-free, non-destructive, and current-POV based.
- Future follow-up: after reviewing the report, apply chosen recommendations to skill/support configs in a separate explicit change.
