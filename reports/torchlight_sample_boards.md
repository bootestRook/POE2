# Torchlight TLIDB V1 Sample Boards

These samples are for first-pass playability checks. Coordinates use `row,column`; the UI can adjust exact cells to satisfy sudoku-digit legality.

## Fire Projectile Clear

- Active: `active_split_firebolt`.
- Supports: `support_multiple_projectiles`, `support_added_fire_damage`, `support_physical_to_fire`.
- Passive: `passive_spell_amplification` or `passive_weapon_amplification`.
- Intent: stack projectile count, fire added damage, and fire conversion around Split Firebolt.

## Cold Area Control

- Active: `active_blizzard` or `active_ring_of_ice`.
- Supports: `support_increased_area`, `support_glacial_freeze`, `support_spell_concentration`.
- Passive: `passive_frigid_domain`.
- Intent: auto-target monster clusters or self-centered defense with cold area scaling.

## Lightning Chain

- Active: `active_chain_lightning` or `active_lightning_shot`.
- Supports: `support_jump`, `support_high_voltage`, `support_lightning_to_cold`.
- Passive: `passive_electric_conversion`.
- Intent: chain/bounce clear with lightning damage routed through sudoku relations.

## Melee Duration Window

- Active: `active_whirlwind` or `active_flame_slash`.
- Supports: `support_multistrike`, `support_melee_knockback`, `support_raging_slash`, `support_guard`.
- Passive: `passive_fearless`.
- Intent: automatic close-range windows with guard and knockback stability.

## Corrosion Zone

- Active: `active_corrosive_shot` or `active_black_hole`.
- Supports: `support_added_erosion_damage`, `support_improved_corrosion`, `support_shortened_duration`.
- Passive: `passive_magical_source` or `passive_spell_amplification`.
- Intent: map TLIDB erosion to current chaos fields and use automatic cluster-centered zones.

## Defense And Resource

- Active: `active_stoneskin`.
- Supports: `support_cooldown_reduction`, `support_guard`.
- Passive: `passive_rejuvenation`, `passive_energy_fortress`, `passive_magical_source`.
- Intent: defensive layer for automatic combat; low-life/low-shield threshold and true absorb events remain a follow-up task.
