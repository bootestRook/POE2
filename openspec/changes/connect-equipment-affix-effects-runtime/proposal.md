## Why

Equipment generation and crafting now produce canonical TLIDB-derived equipment items, but their affix texts do not yet affect player stats, skill results, or playable combat. The next step is to make every non-disabled equipment affix either produce a real runtime effect through existing mechanisms or be explicitly held for design alignment before any new mechanism is added.

## What Changes

- Add an equipment affix semantic mapping layer that classifies all 2,121 raw TLIDB equipment affixes into `mapped_effect`, `disabled`, or `requires_design_alignment`.
- Convert mapped equipment affixes into canonical player stat modifiers, skill stat modifiers, damage model inputs, or existing SkillRuntime/CombatSession event hooks.
- Require every currently enabled equipment affix definition to have a semantic mapping or a `requires_design_alignment` record; enabled text-only affixes are not allowed.
- Preserve the existing disabled affix behavior for unsupported systems such as summon-only, blessing, harvest, ground, seal, and other already-blocked mechanics unless explicitly re-enabled later.
- Reuse existing runtime mechanisms such as player stat aggregation, damage components/conversions, on-kill follow-ups, status/buff application, channel/window behavior, pierce/projectile params, guard, ailment, and damage-zone events.
- Do not introduce new gameplay mechanisms silently. Any effect that cannot fit existing runtime paths must be reported for user alignment with the TLIDB text, missing runtime hook, recommended design, impact, and test plan.
- Add coverage proving the effect status of all 2,121 raw TLIDB equipment affixes and runtime behavior for representative mapped effect families.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `equipment-affix-generation`: Extend canonical equipment affix definitions beyond generation/crafting so they expose effect status and mapped runtime operations for all non-disabled affixes.
- `v1-minimal-sudoku-gem-loop`: Connect equipped equipment affix effects into the playable skill and combat runtime through canonical backend/player-stat paths without adding frontend-local combat simulation.

## Impact

- Affected code: `src/liufang/equipment.py`, likely new effect mapping helpers under `src/liufang/`, `src/liufang/player_stats.py`, `src/liufang/skill_effects.py`, `src/liufang/combat.py`, `src/liufang/skill_runtime.py`, `src/liufang/web_api.py`, and presentation adapters.
- Affected tests: equipment coverage, player stat aggregation tests, skill effect tests, skill runtime/combat tests, WebApp smoke or playable battle verification if UI/state changes are implemented.
- Data inputs: `tlidb_equips/tlidb_craft_affixes.md` and the generated equipment affix definitions remain the source data; this change should not duplicate or fork TLIDB rows.
- Frontend: WebApp may display equipment affix effect status and must consume backend-calculated skill/combat results if equipment is exposed there.
