## Context

The current V1 stat model has three overlapping surfaces: the backend stat dictionary, the runtime formula context, and the character panel. They are no longer aligned. `player_stat_defs.toml` contains active and reserved stats, the runtime only consumes a subset, and the panel shows a small mixed set of primary, resource, and defensive values.

This change deliberately separates three ideas:

- canonical stat definition: the complete player stat vocabulary;
- runtime-effective stat: a stat with a concrete combat, skill, loot, board, or derived-stat consumer;
- panel-visible stat: a stat the player should inspect directly.

## Goals / Non-Goals

**Goals:**

- Make selected V1-reserved player stats runtime-effective in V1.
- Keep excluded stats out of the player panel: support link limit, damage-type increase group, gem growth group, mana cost multiplier, mana seal, and projectile spread angle.
- Add primary attribute derivation from strength, dexterity, and intelligence.
- Replace direct crit percentage scaling with rating-to-result conversion for the main rollable crit surface.
- Add panel grouping that reflects player-facing concepts instead of raw config categories.
- Rename corrosion/erosion resistance to chaos resistance in player-facing and internal combat naming.

**Non-Goals:**

- No equipment, map, currency, or non-gem item system.
- No support-link-count cap; support links remain unlimited for this scope.
- No skill mana-cost system, mana reservation/seal system, or active gem level progression system.
- No player-facing damage-type panel group, even if damage-type stats continue to exist for backend skill matching.

## Decisions

1. **Use a panel allowlist rather than showing every runtime-effective stat.**
   The V1 runtime needs backend stats such as physical/fire/cold/lightning damage increases, but the requested panel intentionally hides the damage-type group and gem-growth stats. A config-driven allowlist in `character_panel.toml` keeps that product decision explicit.

2. **Treat primary attributes as upstream stats.**
   Strength, dexterity, and intelligence remain visible and rollable, but they apply by generating derived contributions:
   - strength -> max life and melee damage;
   - dexterity -> attack speed, cast speed, and evasion;
   - intelligence -> max mana and max energy shield.
   This avoids duplicating primary-attribute logic across skill formulas, player objects, and UI widgets.

3. **Use rating curves for crit.**
   `crit_rating` and a new `crit_damage_rating` become the main rollable crit stats. The runtime derives crit chance and crit damage from diminishing-return curves, then exposes both the raw ratings and derived results to the panel/API. Direct percent stats can remain special-case internal modifiers, but they are not the main rollable/player-facing surface.

4. **Make resources and defenses concrete but minimal.**
   V1 should support current/max mana, mana regeneration, current/max energy shield, energy shield recharge timing, armor, evasion, block, mitigation, and resistances with deterministic formulas. The implementation should prefer simple formulas and traceable outputs over a large action-RPG simulation.

5. **Make board power stats consume player global values.**
   Existing relation routing reads source/target power from gem rolls. This change adds player global source/target/conduit power as an additive global contribution before relation multipliers are applied.

6. **Rename erosion to chaos.**
   The player-facing term shall be chaos resistance. Internal IDs should migrate from `erosion_*` to `chaos_*` where feasible, with compatibility handled in validation/API only if existing configs still reference old IDs during migration.

## Risks / Trade-offs

- **Risk: Large stat migration causes config/test churn.** -> Mitigation: update validation first, then configs, then runtime consumers, then UI/tests.
- **Risk: Derived stats double-count with existing direct stats.** -> Mitigation: centralize stat aggregation and expose a trace for base value, primary-derived value, and direct modifier value.
- **Risk: Defense formulas become too deep for V1.** -> Mitigation: use simple deterministic V1 formulas and mark deeper hit/avoidance simulation as later work.
- **Risk: Panel becomes too long.** -> Mitigation: group sections by player intent and keep hidden backend-only stats out of `character_panel.toml`.
- **Risk: Renaming erosion breaks saved/config references.** -> Mitigation: update all first-party configs and tests in one change; add temporary alias validation only if a migration gap appears.

## Migration Plan

1. Update stat definitions, localization, and base stats to the new active/reserved/display split.
2. Add derived-stat aggregation and crit conversion before changing combat formulas.
3. Update runtime consumers for resource, defense, loot, shape, and board power stats.
4. Rebuild `character_panel.toml` groups and update the frontend formatter/rendering for the larger panel.
5. Update tests and smoke coverage.

Rollback is config-based: restore the previous stat definition, base stats, and panel config, then remove the new runtime consumers if the expanded stat model causes blocking regressions.

## Open Questions

- Exact armor/evasion/resistance formulas can be tuned during implementation, but they must be deterministic and covered by tests.
- Whether direct crit percent stats remain config-defined as hidden internal modifiers or are fully replaced after all support gems are migrated.
