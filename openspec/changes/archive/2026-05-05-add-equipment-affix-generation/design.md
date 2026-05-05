## Context

The current project has gem inventory and gem affix generation, but no canonical equipment item model. TLIDB equipment affix data already exists in `tlidb_equips/tlidb_craft_affixes.md`, grouped by source equipment type and affix library. The equipment system should reuse that data without mixing it into the existing gem affix generator.

## Goals / Non-Goals

**Goals:**
- Provide a canonical backend equipment affix model for drop generation and crafting.
- Parse TLIDB equipment affix rows into runtime definitions keyed by source, library, prefix/suffix kind, tier, level, weight, and effect text.
- Reverse-generate missing T2-T7 values for initial and advanced affixes from each existing T1 row.
- Enforce fixed base affixes, rarity affix counts, level-based prefix/suffix capacity, advanced caps, and pinnacle caps.
- Cover the rules with focused backend tests.

**Non-Goals:**
- Applying equipment stats to combat, player stats, skill runtime, or WebApp UI.
- Adding equipment to current combat gem drop rewards.
- Creating a full currency economy, inventory UI, item persistence schema, or affix semantic parser for every TLIDB effect.
- Reintroducing frontend-local combat or skill simulation.

## Decisions

1. Equipment affixes use a separate module from gem affixes.

   `src/liufang/equipment.py` will own equipment definitions, item instances, affix rolls, random generation, crafting, and TLIDB markdown parsing. This avoids changing the existing gem affix generator and keeps equipment behavior independently testable.

2. TLIDB `source` remains the canonical affix pool key.

   Game-facing categories like one-handed weapon or accessory may group several sources later, but the generator will choose affixes by the exact TLIDB source such as `力量头部`, `单手剑`, `项链`, or `灵戒`. This prevents accidental cross-pool leakage.

3. Initial and advanced missing tiers are generated mechanically from T1.

   Existing TLIDB initial/advanced affix rows are T1 rows. The system will generate T2-T7 from the T1 effect text by scaling numeric ranges:

   | Tier | Required Level | Weight | Value Scale |
   |---|---:|---:|---:|
   | T1 | 86 | 100 | 1.00 |
   | T2 | 82 | 200 | 0.85 |
   | T3 | 76 | 800 | 0.70 |
   | T4 | 68 | 3200 | 0.55 |
   | T5 | 58 | 3200 | 0.40 |
   | T6 | 40 | 6250 | 0.28 |
   | T7 | 1 | 6250 | 0.18 |

   Integer values remain integer-rounded with a minimum of 1 for positive values. Fixed counts such as `+1` can scale to `+1` at low tiers only if rounding would otherwise erase the mechanic.

4. Base affixes are fixed on every item and are not item-level gated.

   Every generated equipment item rolls exactly one base affix from its source's `基础词缀` pool using the source row weights. The base affix's TLIDB tier is preserved for display/data but does not use the T1-T7 unlock table.

5. Rarity count and item-level capacity are both hard constraints.

   Rarity determines the target ordinary affix count. Equipment level determines prefix/suffix capacity. The actual generated count is capped by available prefix/suffix capacity and candidate availability.

6. Crafting is explicit about library and side.

   Crafting calls choose `initial`, `advanced`, or `pinnacle` and `prefix` or `suffix` first, then roll within the eligible pool. Initial and advanced affixes obey the T1-T7 unlock table. Pinnacle affixes are craftable only on level 100 equipment and do not get generated T2-T7 tiers in this change.

7. Random equipment generation does not create pinnacle affixes.

   Random drops choose between initial and advanced libraries for ordinary affixes, respecting the advanced cap. Pinnacle affixes are reserved for explicit crafting because the user requirement says only level 100 equipment can craft pinnacle affixes.

## Risks / Trade-offs

- Mechanical text scaling can alter special mechanics awkwardly → Keep the scaler conservative and preserve positive fixed mechanics at a minimum of 1.
- TLIDB effect text is not stat-semantically parsed → Store and test effect text now; defer combat stat application to a later capability.
- Existing V1 spec excludes equipment → This change scopes equipment as a new backend capability and does not modify current gem battle drops or skill runtime behavior.
