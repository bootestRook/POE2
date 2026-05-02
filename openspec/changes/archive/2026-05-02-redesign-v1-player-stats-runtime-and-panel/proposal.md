## Why

The current player stat dictionary is broader than the actual runtime and character panel: some V1-active stats are not consumed, many V1-reserved defensive/resource stats are hidden, and crit uses direct percentage modifiers that leave too little room for item and gem stat rolls. This change makes the player stat model explicit, readable, and scalable for V1 combat.

## What Changes

- Expand the V1 player stat contract so selected `V1_RESERVED` stats become real V1 player stats with runtime effects and panel display.
- Remove `support_link_limit`, damage-type increase stats, gem-level growth stats, mana cost multiplier, mana seal, and projectile spread angle from the player panel scope.
- Rename the erosion resistance concept to chaos resistance, and align chaos damage naming where damage-type stats remain in the backend.
- Add primary attribute derivation:
  - Strength: each 1 point grants +0.5 max life and +0.2% melee damage.
  - Dexterity: each 1 point grants +0.2% attack speed, +0.2% cast speed, and +0.2% evasion.
  - Intelligence: each 1 point grants +0.5 max mana and +0.2% max energy shield.
- Redesign crit so rollable stats are rating-based:
  - Crit rating converts to derived crit chance with diminishing returns.
  - Crit damage rating converts to derived crit damage with diminishing returns.
  - Direct crit chance and crit damage percent become derived or special-case stats rather than the main rollable surface.
- Add runtime effects for resources, defense, resistance, loot, board power, chain/pierce count, status chance, and shape stats that remain in panel scope.
- Rebuild the player attribute panel into clear groups: base attributes, life, mana, energy shield, defense, block, resistances, mobility, damage overview, skill type, speed/cooldown, crit, skill shape, status, effects, conversion, drops, and board power.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `v1-minimal-sudoku-gem-loop`: redefine the V1 player stat set, runtime consumption rules, crit conversion rules, chaos resistance naming, and character panel grouping.

## Impact

- Affected configs: `configs/player/player_stat_defs.toml`, `configs/player/player_base_stats.toml`, `configs/player/character_panel.toml`, `configs/localization/zh_cn.toml`, combat/damage/loot config where chaos naming appears.
- Affected runtime: player stat aggregation, skill stat context, combat session resource/defense handling, board relation scaling, loot rarity/quantity handling, and skill runtime params.
- Affected UI/API: `player_stats` and `character_panel` payloads, `webapp/App.tsx` panel rendering/formatting, and smoke coverage.
- Affected tests: config validation, player stats panel tests, skill effect tests, combat tests, loot tests, and web smoke tests.
