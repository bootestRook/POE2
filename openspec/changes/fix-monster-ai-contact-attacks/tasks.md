## 1. Runtime Attack Ownership

- [x] 1.1 Add runtime enemy attack timing fields to the `Enemy` state shape and preserve them through enemy updates.
- [x] 1.2 Move melee attack readiness, cooldown updates, active attack window updates, and player hit application out of `syncEnemyVisuals()` and into the runtime enemy/combat update path.
- [x] 1.3 Ensure each ready in-range aggro-locked monster applies at most one player hit per attack cadence and does not apply per-frame proximity damage.
- [x] 1.4 Keep authored/procedural monsters blocked from attacking until they are aggro-locked.

## 2. Presentation Synchronization

- [x] 2.1 Update `syncEnemyVisuals()` so it reads runtime attack state for animation only and no longer mutates attack cooldowns or applies player damage.
- [x] 2.2 Preserve existing attack animation direction, active attack duration, and movement/idle visual behavior after the state ownership change.

## 3. Close-Range Direct Charge

- [x] 3.1 Remove or bypass close-range direct-charge side steering that makes aggro-locked monsters preserve or increase distance from the player before contact.
- [x] 3.2 Preserve wall collision and enemy-enemy overlap safeguards without adding player-body repulsion or ring targeting.
- [x] 3.3 Verify attack-locked monsters remain frozen for the active attack window while other aggro-locked monsters continue direct pressure.

## 4. Regression Coverage

- [x] 4.1 Add a focused regression check proving a stationary player takes one cadence-based hit from an in-range aggro-locked monster without player movement.
- [x] 4.2 Add or update checks proving visual synchronization is not the authoritative monster damage path.
- [x] 4.3 Add or update checks proving close-range direct charge does not use player-body repulsion, ring targeting, or avoidance-style side steering.

## 5. Verification

- [x] 5.1 Run `node webapp/smoke-test.mjs`.
- [x] 5.2 Run `cmd /c npm run build`.
- [x] 5.3 Run focused Python tests for existing player defensive semantics and monster config coverage.
- [x] 5.4 Manually verify in the WebApp that aggro-locked monsters press into the player and damage a stationary player on cadence.
