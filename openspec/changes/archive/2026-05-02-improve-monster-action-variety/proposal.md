## Why

Monsters currently feel too synchronized: groups wake, walk, and attack with nearly identical timing, which makes authored encounters look artificial. This change improves runtime monster presentation while keeping combat rules, damage values, and encounter authoring data stable.

## What Changes

- Add per-monster wake staggering when an authored encounter point enters aggro range.
- Add per-monster animation phase offsets so walk/idle/attack frames do not advance in lockstep.
- Add small per-monster movement speed variation for active chase behavior.
- Add a small per-monster attack timing variation to reduce simultaneous attack beats.
- Fix attack presentation so monsters no longer visually shrink during attack playback.
- Keep monster collision, damage, HP, authored spawn counts, and aggro range authoring semantics unchanged.

## Capabilities

### New Capabilities
- `monster-action-variety`: Covers runtime monster desynchronization, per-monster animation variation, movement timing variation, and attack presentation stability.

### Modified Capabilities
- `map-editor-encounter-aggro`: Authored encounter aggro activation SHALL support staggered runtime monster wake timing after a monster or boss group is triggered.

## Impact

- Affected frontend runtime: `webapp/App.tsx`, `webapp/unitAnimation.ts`, and related animation context/types.
- Affected tests: `webapp/smoke-test.mjs` should verify the new runtime fields and attack scale behavior.
- No new dependencies.
- No backend API, saved map schema, combat stat, damage, or resource pipeline changes expected.
