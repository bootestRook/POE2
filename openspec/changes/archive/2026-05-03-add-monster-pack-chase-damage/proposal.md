## Why

Current runtime monsters can be spawned in packs and visually attack, but they do not apply damage to the player. Their close-range movement also steers into ring positions and player-body repulsion, making them feel like they are avoiding the player instead of relentlessly chasing.

This change makes monster packs feel dangerous: once a pack is angered, all living members chase the player without leash behavior, rush directly into contact, and deal damage through a clear melee hit loop.

## What Changes

- Add runtime monster combat behavior so monsters can damage the player when in melee range.
- Add monster offense attributes that use the same stat-id vocabulary as player combat stats where applicable.
- Carry monster pack damage values and combat attributes from spawn/config data into runtime `Enemy` records.
- Resolve monster hits against the player's existing defensive attributes, including hit kind, damage type, block, resistance, mitigation, energy shield, and life.
- Preserve pack-shared aggro: when a source triggers, every living monster from that source remains aggro-locked until death or battle reset.
- Change close-range chase behavior so aggro-locked monsters push toward the player directly instead of choosing ring positions or applying player-body repulsion.
- Double baseline monster chase speed as the first tuning pass.
- Display player damage feedback through existing runtime UI channels such as player HP, combat logs, and floating text where practical.
- Add focused verification for pack aggro, direct chase, speed scaling, and player damage.

## Capabilities

### New Capabilities
- `monster-pack-combat-behavior`: Runtime behavior for aggro-locked monster packs, direct chasing, monster offense attributes, monster melee damage, player defensive counterplay, and baseline monster chase speed.

### Modified Capabilities
- `map-editor-encounter-aggro`: Add runtime expectations for pack-shared aggro source activation and no-leash aggro lock after trigger.

## Impact

- Affected frontend runtime: `webapp/App.tsx`.
- Affected spawn bridge: procedural monster spawn data from `webapp/mapSpawnRuntime.ts` into runtime enemies.
- Affected monster configuration: monster definitions and/or spawn pack entries need explicit offense attributes compatible with existing player stat ids.
- Affected tests/checks: `webapp/smoke-test.mjs` and any relevant runtime assertions.
- No new dependencies.
- No saved map schema migration.
- No changes to player skill damage formulas, loot generation, gem board rules, or monster art assets.
