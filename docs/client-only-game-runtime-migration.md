# Client-Only Game Runtime Migration

This change removes the playable WebApp's normal-play dependency on backend gameplay services.

## Previous Playable Dependencies

- Initial state came from a backend state request.
- Board, equipment, save, GM, and some inventory mutations were submitted to backend actions.
- Skill-event pipeline skills requested backend runtime skill events before the frontend could render and apply them.
- Older tests treated backend `SkillRuntime` and `CombatSession` behavior as playable acceptance evidence.

## Current Playable Boundary

- The WebApp starts from frontend-owned seed data in `webapp/frontendGameData.ts`.
- Frontend state mutations use `applyFrontendState` and persist through local autosave.
- Board placement, unmount, equipment slot changes, new game, map entry, monster spawning, monster HP, kills, drops, pickup, and progress are normal frontend runtime behavior.
- The playable WebApp source must not contain `fetch(`, `/api/`, backend combat ticks, backend runtime skill-event calls, or backend canonical map-run calls.

## Effect Preservation

The generated frontend seed data captures existing effective outputs before migration:

- active skill final damage
- release interval and cooldown values
- mana cost
- projectile count and runtime parameters
- player stats
- map progression
- equipment slots

Implementation work must move ownership only. It must not intentionally change existing skill, equipment, monster, map, drop, reward, cooldown, resource, target, duration, tick, or visual-intent effects.
