## Context

V1 already has a sudoku gem board, three gem kinds, support routing, passive-to-active contribution, skill package loading, combat auto-release, Chinese UI, validation tools, and reports. The current product skill content is project-invented and includes old active skill IDs that the new direction explicitly rejects.

The first playable version SHALL instead use TLIDB scraped Torchlight: Infinite skill data from `tlidb_skills/skills_for_ai.md` and `tlidb_skills/skills_for_ai.jsonl` as content source of truth. Existing project skill packages are implementation references only: they can teach schema, runtime behavior templates, validation, and UI/report plumbing, but not first-version content, names, or balance values.

## Goals / Non-Goals

**Goals:**

- Replace V1 product skill content with a curated TLIDB set: 16 active, 30 support, and 9 passive/aura gems.
- Keep the 3 existing project-owned board conduit supports as sudoku-board differentiators, separate from the TLIDB 30 support count.
- Preserve TLIDB card values as source values and generate level tables for skill levels 1-40, with player-visible gem levels limited to 1-20.
- Adapt selected active skills to automatic release while preserving their TLIDB numerical meaning.
- Keep support gems in the existing project categories so the sudoku board remains tactically distinct.
- Produce implementation-visible reporting for adopted skills, omitted skill families, source values, level tables, and final board-routed values.

**Non-Goals:**

- Do not keep old project active/support/passive gems as first-version product content.
- Do not import all TLIDB active/support/passive skills in this change.
- Do not add manual movement skills, potions, complex summon AI, class systems, equipment, talent trees, or season mechanics.
- Do not hand-balance replacement values when TLIDB values are available.
- Do not replace the existing sudoku legality, relation, or conduit model.

## Decisions

1. Use TLIDB source data plus generated level tables.

   Store `source_values` with TLIDB ID, display level, raw lines, parsed values, and anchors. Store runtime `level_table` values for levels 1-40. Runtime reads `level_table`; tools and reports preserve `source_values` for traceability.

   Alternative considered: store only level 20 values and scale by project formulas. Rejected because the user explicitly wants TLIDB values replicated and level 1-19 / 21-40 derived from those values instead of invented balance.

2. Treat scraped card values as level 20 anchors.

   TLIDB card values are interpreted as Lv20 unless a raw line provides explicit anchors such as `(Lv1:)`, `(Lv21:)`, or `(Lv41:)`. Fields with explicit anchors interpolate or step according to field type. Fixed mechanics such as 100% conversion stay fixed across levels.

   Alternative considered: assume every scraped value is current website default level with no level meaning. Rejected because the implementation needs deterministic 1-40 level curves and the user stated the scraped values should be treated as level 20.

3. Replace old content, but reuse runtime templates.

   Old IDs such as `active_fire_bolt` do not remain in the V1 product list. Existing behavior templates such as projectile, chain, nova, melee arc, persistent area, and conduit routing can be reused or generalized.

   Alternative considered: keep the existing 8 active gems and add TLIDB skills around them. Rejected because the user explicitly said not to retain them.

4. Select active skills by auto-release suitability.

   Adopt skills that can target nearest enemy, enemy cluster, self-centered area, duration window, or threshold/periodic defensive triggers. Exclude pure movement, movement attacks, potions, complex summons, and precise manual ground skills that cannot be adapted cleanly.

   Alternative considered: include high-profile manual skills and approximate them freely. Rejected because automatic release is core to the project and free approximation would drift from TLIDB.

5. Keep support categories project-native.

   TLIDB support skills map into existing categories: `general_skill_modifier`, `damage_type_enhancer`, `projectile_area_specialist`, `risk_reward`, `skill_shape_modifier`, and `skill_level` where used. `board_conduit` remains project-owned and separate.

   Alternative considered: add a TLIDB taxonomy. Rejected because the board, UI, loot pools, and build language already rely on project categories.

6. Preserve board uniqueness after TLIDB values.

   TLIDB values define the base modifier at a given skill level. Sudoku relation, source/target power, and conduit amplification route and scale that modifier afterward. Supports SHALL NOT become global always-on modifiers unless modeled as passive/aura behavior.

   Alternative considered: make support gems apply directly to all compatible active skills. Rejected because it would erase the sudoku board's main gameplay identity.

## Risks / Trade-offs

- TLIDB raw text may contain values that need special parsing -> Keep raw lines in `source_values`, validate parsed fields, and document manual mapping decisions in reports.
- Some TLIDB mechanics require statuses or runtime behaviors that V1 only partly supports -> Preserve the numerical/status semantic in config and implement deterministic V1 adapters instead of deleting the mechanic.
- Level 21-40 values can become speculative when no high-level anchors exist -> Use conservative extension rules and mark generated values with anchor metadata.
- Replacing old content can break tests and demos that hard-code old IDs -> Migrate tests/reports to TLIDB IDs and keep old packages only as reference fixtures if needed.
- Thirty support skills can create a large first patch -> Implement schema/import and category validation first, then migrate skills in category batches with representative combat tests.

## Migration Plan

1. Add TLIDB source fields and level-table validation to skill package/gem config loading.
2. Create the TLIDB adopted skill definitions and localization for 16 active, 30 support, and 9 passive/aura gems.
3. Preserve `support_row_conduit`, `support_column_conduit`, and `support_box_conduit` as project-owned `board_conduit` supports.
4. Remove old project skill gems from V1 drop pools, default boards, UI product lists, and acceptance tests.
5. Implement auto-release adapters and runtime mechanics needed by representative active skills.
6. Update reports/UI to show adopted/omitted scope, source values, level values, and board-routed final values.
7. Verify with config validation, unit tests, report generation, and at least one playable board for each major build family.
