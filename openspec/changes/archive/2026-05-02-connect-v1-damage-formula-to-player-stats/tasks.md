## 1. Formula Contract Tests

- [x] 1.1 Add focused tests proving player base stats enter active skill additive pools for generic, hit, type, elemental, source-tag, and behavior-tag stats.
- [x] 1.2 Add tests proving non-matching damage type, source-tag, and behavior-tag stats do not affect unrelated active skills.
- [x] 1.3 Add tests for row/column/box source power, target power, relation coefficient, and conduit multiplier routing.
- [x] 1.4 Add tests for `cannot_crit`, crit chance clamping, crit multiplier, non-critical hit damage, and expected hit damage.
- [x] 1.5 Add presentation/API tests proving preview DPS no longer multiplies single-target DPS by projectile count by default and coverage values remain visible.

## 2. Skill Stat Aggregation

- [x] 2.1 Add a small skill stat context aggregation path that starts from `load_player_base_stats()` and overlays active/routed modifiers for each active skill.
- [x] 2.2 Gate aggregation to V1 runtime-effective/scaling-supported stats so reserved or display-only stats cannot accidentally affect combat.
- [x] 2.3 Preserve applied modifier traces while making aggregated player stat contributions inspectable enough for tests and previews.

## 3. V1 Hit Formula Implementation

- [x] 3.1 Replace the current damage-add lookup with V1 increase-pool matching for generic, hit, physical/fire/cold/lightning, elemental, attack/spell, projectile/area/melee/ranged, chain, and pierce stats.
- [x] 3.2 Apply `damage_final_percent` and `hit_damage_final_percent` after the additive pool using the selected V1 final-pool semantics.
- [x] 3.3 Compute and expose `non_crit_damage`, `crit_chance`, `crit_multiplier`, `expected_hit_damage`, `uses_per_second`, `hit_coverage_factor`, and `preview_dps` on final skill output.
- [x] 3.4 Keep combat damage behavior explicit by either preserving `final_damage` as non-critical hit damage or updating all affected tests if it becomes expected hit damage.

## 4. Board Routing Power

- [x] 4.1 Implement `_board_power()` so row/column/box source and target power stats affect relation scaling.
- [x] 4.2 Ensure adjacent relation behavior remains coefficient-only unless an explicit adjacent power rule is later added.
- [x] 4.3 Verify conduit amplification remains non-recursive and appears once in applied modifier debug output for a routed relation.

## 5. Preview, Reports, And UI

- [x] 5.1 Update skill preview and active tooltip output to display formula-backed damage, expected damage, cooldown or uses per second, preview DPS, and coverage values.
- [x] 5.2 Update gem combination report summaries to include the new formula fields where useful for acceptance checks.
- [x] 5.3 Ensure WebApp state and TypeScript types tolerate the new optional skill preview fields without frontend-only recalculation.

## 6. Verification

- [x] 6.1 Run targeted Python tests for skill effects, presentation, player stats, combat, and gem combination reports.
- [x] 6.2 Run the WebApp smoke test if API or frontend state shape changes.
- [x] 6.3 Review OpenSpec status and confirm all tasks are complete before archiving.
