## 1. Source Data And Selection

- [x] 1.1 Verify `tlidb_skills/skills_for_ai.md` and `tlidb_skills/skills_for_ai.jsonl` contain descriptions and source values for the adopted 16 active, 30 support, and 9 passive/aura skills
- [x] 1.2 Create a machine-readable adopted-skill manifest that lists TLIDB ID, Chinese name, gem kind, category, auto-release suitability, omitted reason where applicable, and source file reference
- [x] 1.3 Add validation that adopted TLIDB support count is 30, adopted active count is 16, adopted passive/aura count is 9, and project board conduit count is 3
- [x] 1.4 Mark old project skill IDs as non-product reference content so they do not appear in first-version drop pools, default boards, product inventories, or acceptance reports

## 2. Schema And Level Tables

- [x] 2.1 Extend skill package schema and loaders to accept `source_values`, TLIDB IDs, raw source lines, anchors, and parsed source fields
- [x] 2.2 Implement level-table generation for levels 1-40 using Lv20 card anchors, explicit TLIDB anchors, field-type interpolation, step tables, and fixed-mechanic preservation
- [x] 2.3 Ensure player-facing gem level display, drop generation, and inventory storage expose levels 1-20 while runtime can read levels 21-40 for `+skill level` effects
- [x] 2.4 Add validation that adopted skills never rely on a single Lv20 runtime value when level-scaled fields exist
- [x] 2.5 Add erosion-to-chaos or equivalent damage/status mapping where TLIDB corrosion values must enter current project damage fields

## 3. Active Skill Migration

- [x] 3.1 Add TLIDB active skill packages for `Split_Firebolt`, `Ice_Shot`, `Chromatic_Shot`, `Lightning_Shot`, `Corrosive_Shot`, `Burning_Shot`, `Rain_of_Arrows`, and `Sparkle`
- [x] 3.2 Add TLIDB active skill packages for `Blizzard`, `Chain_Lightning`, `Ring_of_Ice`, `Thundercloud`, and `Black_Hole`
- [x] 3.3 Add TLIDB active skill packages for `Whirlwind`, `Flame_Slash`, and `Stoneskin`
- [x] 3.4 Implement or reuse behavior templates for projectile split, chain/bounce, cluster-targeted area, self-centered nova, persistent ground/zone damage, melee slash, channel-window ticks, and defensive absorb
- [x] 3.5 Configure auto-release target policies for every adopted active skill and reject pure movement, movement attack, potion, complex summon, and manual-ground families from active skill adoption reports
- [x] 3.6 Update combat scheduling so adopted active skills use final `actual_interval_ms`, mana cost, duration windows, cooldowns, and defensive thresholds correctly

## 4. Support Skill Migration

- [x] 4.1 Add the 9 `general_skill_modifier` TLIDB supports: `Multistrike`, `Quick_Decision`, `Cooldown_Reduction`, `Critical_Strike_Rating_Increase`, `Critical_Strike_Damage_Increase`, `Channel_Preparation`, `Control_Spell`, `Overload`, and `Melee_Knockback`
- [x] 4.2 Add the 12 `damage_type_enhancer` TLIDB supports: `High_Voltage`, `Glacial_Freeze`, `Additional_Ignite`, `Physical_to_Fire`, `Lightning_to_Cold`, `Added_Fire_Damage`, `Added_Cold_Damage`, `Added_Lightning_Damage`, `Added_Erosion_Damage`, `Elemental_Fusion`, `Tendonslicer`, and `Improved_Corrosion`
- [x] 4.3 Add the 4 `projectile_area_specialist` TLIDB supports: `Multiple_Projectiles`, `Projectile_Split`, `Increased_Area`, and `Jump`
- [x] 4.4 Add the 4 `risk_reward` TLIDB supports: `Spell_Concentration`, `Shortened_Duration`, `Guard`, and `Slow_Projectile`
- [x] 4.5 Add the 1 `skill_shape_modifier` TLIDB support: `Raging_Slash`
- [x] 4.6 Preserve `support_row_conduit`, `support_column_conduit`, and `support_box_conduit` as project-owned `board_conduit` supports, separate from the TLIDB 30 support count
- [x] 4.7 Update support apply filters so every TLIDB support uses explicit tag or target-kind rules and no support bypasses sudoku routing as a global modifier
- [x] 4.8 Update support routing so TLIDB level values are calculated before relation, source power, target power, and conduit scaling

## 5. Passive And Aura Migration

- [x] 5.1 Add passive/aura skill packages for 武器增幅, 法术增幅, 精准投射, 狂猛, 再生, 能量壁垒, 电能转化, 冰寒领域, and 魔源
- [x] 5.2 Model adopted passive/aura gems as `gem_kind = passive_skill` without generating active `FinalSkillInstance` outputs
- [x] 5.3 Route passive/aura effects through self-stat contributions or `passive_skill -> active_skill` board relations
- [x] 5.4 Ensure this change does not introduce mana reservation, mana seal, or class/aura-slot systems

## 6. UI, Reports, And Localization

- [x] 6.1 Add Chinese localization for all adopted TLIDB active, support, passive/aura, source-value, level-table, auto-release, and omitted-scope display strings
- [x] 6.2 Update WebApp inventory, board, gem details, skill previews, and combat HUD to list adopted TLIDB content instead of old project product skills
- [x] 6.3 Update skill/detail previews to show TLIDB source values, current level-table values, sudoku-routed modifiers, final computed values, and auto-release adaptation notes
- [x] 6.4 Generate an adopted/omitted scope report that states 16 active, 30 TLIDB supports, 9 passive/aura gems, 3 board conduits, and omitted skill families
- [x] 6.5 Update build/sample-board reports with playable examples for fire projectile, cold area, lightning chain, melee channel/slash, corrosion zone, and defensive/passive build families

## 7. Tests And Verification

- [x] 7.1 Update config validation tests for TLIDB source metadata, level tables, adopted counts, support categories, and old project content exclusion
- [x] 7.2 Add level-table tests for linear values, damage ranges, integer step values, fixed mechanics, duration/cooldown fields, probabilities, and explicit TLIDB anchors
- [x] 7.3 Add runtime tests for representative adopted active skills: projectile split, chain lightning, nova, area waves, persistent zone, channel-window ticks, melee slash, and defensive absorb
- [x] 7.4 Add support-routing tests that prove TLIDB support values are routed and scaled by sudoku relations and conduits without support-to-support recursion
- [x] 7.5 Add passive/aura tests proving passive gems do not auto-release and do affect active skills or player stats through the configured routes
- [x] 7.6 Run `python tools/validate_v1_configs.py`, skill package validation, unit tests, and report generation; record any intentionally deferred TLIDB mechanics in the final implementation document
