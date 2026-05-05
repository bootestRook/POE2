## 1. Data Model And Loading

- [x] 1.1 Add canonical equipment data classes for affix definitions, affix rolls, item instances, rarity counts, and slot capacity.
- [x] 1.2 Parse `tlidb_equips/tlidb_craft_affixes.md` into source-scoped base, initial, advanced, and pinnacle affix definitions.
- [x] 1.3 Generate T2-T7 initial and advanced affix definitions from T1 rows using the agreed level, weight, and scaling table.

## 2. Generation And Crafting

- [x] 2.1 Implement fixed base affix rolling that is not gated by equipment level.
- [x] 2.2 Implement random equipment generation with rarity targets, level-based prefix/suffix capacity, source isolation, and advanced cap enforcement.
- [x] 2.3 Implement crafting that chooses library and prefix/suffix side first, then rolls eligible affixes while enforcing level gates and advanced/pinnacle caps.
- [x] 2.4 Expose candidate-pool inspection helpers for probability verification.

## 3. Verification

- [x] 3.1 Add tests for source loading, base affix behavior, generated tier levels/weights/scaled values, and level capacity.
- [x] 3.2 Add tests for rarity generation caps, advanced/pinnacle caps, crafting level gates, and the level 76 `力量头部` fire-resistance T3 candidate pool.
- [x] 3.3 Run the focused equipment tests and the relevant existing backend tests.
