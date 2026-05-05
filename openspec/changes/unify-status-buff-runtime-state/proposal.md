## Why

Runtime skill effects currently use separate `status_apply` and `buff_apply` event paths, with monster-side debuffs stored as `AilmentState` and player-side buffs stored as `BuffState`. This makes new state-driven skill behavior easy to implement against the wrong field or event path, especially when an effect needs to ask whether a target has a state or how much damage-over-time that state contributes.

## What Changes

- Introduce a canonical runtime-state capability that defines how status and buff-like effects are applied, stored, queried, and ticked.
- Keep existing `status_apply` and `buff_apply` event inputs compatible while replacing the monster-side `AilmentState` storage model with unified `BuffState` runtime storage.
- Add stable query semantics for target buff checks, including presence checks and damage-over-time lookup.
- Require skill runtime behavior and tests to use canonical buff query methods rather than direct reads of legacy state fields.
- Exclude skill-specific behavior changes from this change; Burning Shot and other individual skill adjustments remain out of scope.

## Capabilities

### New Capabilities
- `runtime-state-effects`: Canonical application, storage, ticking, and query behavior for combat runtime buffs produced by skill events.

### Modified Capabilities
- None.

## Impact

- Affected code: `src/liufang/combat.py`, `src/liufang/skill_runtime.py`, skill runtime tests, combat tests, and any adapters that inspect runtime skill event state.
- Affected APIs: internal runtime query methods for monster/player state checks; no public web API change is intended.
- Dependencies: none expected.
- Frontend: no visual behavior change is intended unless implementation reveals that the playable WebApp reads legacy state fields directly.
