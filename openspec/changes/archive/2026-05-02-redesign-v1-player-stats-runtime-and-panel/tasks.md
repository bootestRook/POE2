## 1. Validation And Config

- [x] 1.1 Update player stat validation expectations for the new runtime-effective, backend-only, and panel-visible split.
- [x] 1.2 Rename first-party erosion damage/resistance stats and localization to chaos naming.
- [x] 1.3 Add `crit_damage_rating` and adjust crit stat metadata so rating stats are the normal rollable crit surface.
- [x] 1.4 Update `player_base_stats.toml` defaults for newly effective resource, defense, resistance, drop, board-power, and crit rating stats.
- [x] 1.5 Rebuild `character_panel.toml` with the approved player-facing groups and excluded stats removed.
- [x] 1.6 Update Chinese localization strings for new groups, chaos resistance, crit rating, crit damage rating, and derived crit display.

## 2. Stat Aggregation

- [x] 2.1 Add a centralized player stat aggregation path that combines base stats, passive/self-stat modifiers, and derived primary-attribute contributions.
- [x] 2.2 Implement strength derivation into max life and melee damage.
- [x] 2.3 Implement dexterity derivation into attack speed, cast speed, and evasion.
- [x] 2.4 Implement intelligence derivation into max mana and max energy shield.
- [x] 2.5 Expose enough stat trace data in tests to prove derived values are not double-counted.

## 3. Skill And Crit Runtime

- [x] 3.1 Replace normal crit percent scaling with `crit_rating` to crit chance conversion.
- [x] 3.2 Add `crit_damage_rating` to crit damage conversion.
- [x] 3.3 Keep `cannot_crit` behavior intact for non-crit and forbidden-crit skills.
- [x] 3.4 Route derived melee damage, attack speed, cast speed, and shield/mana values through the existing skill stat context where applicable.
- [x] 3.5 Apply `chain_count_add` to chain-capable skill runtime params.
- [x] 3.6 Apply `pierce_count_add` to pierce-capable skill runtime params.
- [x] 3.7 Preserve preview DPS semantics so coverage stats are shown separately from single-target DPS.

## 4. Resource, Defense, And Damage Intake

- [x] 4.1 Extend the player combat model with mana, energy shield, armor, evasion, block, and resistance fields.
- [x] 4.2 Implement mana regeneration during combat ticks without adding skill mana costs.
- [x] 4.3 Implement energy shield damage absorption and recharge delay/speed.
- [x] 4.4 Implement deterministic armor mitigation for physical incoming hits.
- [x] 4.5 Implement deterministic evasion handling for avoidable incoming hits.
- [x] 4.6 Implement attack/spell block chance and block damage reduction.
- [x] 4.7 Implement fire, cold, lightning, and chaos resistance mitigation for incoming typed damage.

## 5. Loot And Board Power Runtime

- [x] 5.1 Pass the aggregated player stat context into loot reward generation.
- [x] 5.2 Apply `gem_drop_quantity_add_percent` to expected gem drop count.
- [x] 5.3 Apply `gem_drop_rarity_add_percent` to rarity weight selection.
- [x] 5.4 Add player global source/target row, column, box, and adjacent power into board routing.
- [x] 5.5 Add player global conduit row, column, and box power into conduit multipliers.
- [x] 5.6 Apply relation final and adjacent final bonuses without recursive propagation.

## 6. API And Frontend

- [x] 6.1 Update `player_stats` API output to include final aggregated values and derived crit outputs.
- [x] 6.2 Update `character_panel` API output to serve all configured panel groups.
- [x] 6.3 Update WebApp panel rendering for the larger grouped stat set without hardcoding group assumptions.
- [x] 6.4 Add formatters for rating, percent, multiplier, milliseconds/seconds, boolean, and derived display values.
- [x] 6.5 Ensure excluded stats do not appear in the player-facing panel.

## 7. Tests And Verification

- [x] 7.1 Update config validation tests for the new V1 stat metadata and chaos naming.
- [x] 7.2 Add tests for primary attribute derivation.
- [x] 7.3 Add tests for crit rating and crit damage rating conversion.
- [x] 7.4 Add tests for chain and pierce runtime parameter changes.
- [x] 7.5 Add combat tests for mana regeneration, energy shield, armor, evasion, block, and resistance.
- [x] 7.6 Add loot tests for drop quantity and rarity stat effects.
- [x] 7.7 Add board routing tests for player global source, target, adjacent, conduit, and relation final power.
- [x] 7.8 Update player stats panel tests and WebApp smoke tests for grouped panel rendering and excluded stats.
- [x] 7.9 Run the Python test suite, config validator, and web smoke test.
