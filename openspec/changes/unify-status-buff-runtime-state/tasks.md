## 1. Runtime State Discovery

- [x] 1.1 Inspect `CombatSession`, `Monster`, `Player`, and `SkillRuntime` state application paths for `status_apply`, `buff_apply`, `AilmentState`, `BuffState`, `has_status`, and `status_damage_per_second`
- [x] 1.2 Search gameplay code for direct `monster.ailments`, `player.buffs`, `ailment_type`, and `buff_type` reads and classify which reads affect actual gameplay decisions
- [x] 1.3 Inspect the playable WebApp battle path for frontend-local state simulation or direct legacy state-field dependencies

## 2. Canonical Buff Layer

- [x] 2.1 Extend `BuffState` so it can represent guard, ignite, frostbite, shock, trauma, wilt, and functional buff effects such as damage-taken increase
- [x] 2.2 Replace monster-side `AilmentState` and ailment-only storage with `BuffState` and `monster.buffs`
- [x] 2.3 Add canonical buff query helpers around player and monster buff storage
- [x] 2.4 Ensure monster buff queries match the direct `buff_type` enum
- [x] 2.5 Ensure damage-over-time buff queries return active buff DPS and ignore expired buffs
- [x] 2.6 Preserve player guard buff absorption behavior through the existing player buff storage path
- [x] 2.7 Represent frozen as `BuffState(buff_type="frozen")` instead of a separate monster flag
- [x] 2.8 Support threshold-based buff conversion with configurable source consumption

## 3. Event Consumption Compatibility

- [x] 3.1 Route `status_apply` monster consumption through canonical buff application semantics
- [x] 3.2 Preserve supported monster-targeted `buff_apply` as queryable monster buffs
- [x] 3.3 Keep unsupported or player-targeted `buff_apply` behavior compatible with existing tests
- [x] 3.4 Migrate gameplay decisions that directly inspect legacy ailment fields or collections to use canonical buff query helpers
- [x] 3.5 Remove `AilmentState` imports/usages from runtime and tests, keeping only temporary compatibility aliases if required by non-gameplay callers

## 4. Verification

- [x] 4.1 Add or update combat tests proving `status_apply` consumption creates queryable monster buffs
- [x] 4.2 Add or update combat tests proving damage-over-time buff ticking and DPS query behavior
- [x] 4.3 Add or update combat tests proving monster-targeted `buff_apply` becomes queryable buff state
- [x] 4.4 Add or update tests proving player guard buff behavior remains unchanged
- [x] 4.5 Add or update tests proving `AilmentState` is no longer the monster-side runtime storage model
- [x] 4.6 Run focused runtime/combat tests for the changed paths
- [x] 4.7 If frontend battle behavior is affected, run the playable WebApp in a browser and capture a screenshot under `artifacts/screenshots/`

## 5. Scope Guard

- [x] 5.1 Confirm no Burning Shot-specific behavior, balance, cooldown, damage-zone, or VFX change is included
- [x] 5.2 Confirm no root-level screenshots, logs, or generated evidence were created
