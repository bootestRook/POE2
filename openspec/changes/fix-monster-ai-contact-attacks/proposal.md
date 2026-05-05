## Why

Aggro-locked monsters can still appear to dodge or yield around the player at close range, and some monsters only damage the player after the player moves even when the player is already stationary in melee range. This breaks the expected combat loop: once aggro is locked, monsters should press into contact and attack through their own cadence regardless of player input.

## What Changes

- Move monster melee readiness and hit application into the runtime AI/combat update path instead of relying on visual synchronization.
- Keep attack animation state as a presentation of runtime attack state, not the source of truth for dealing damage.
- Remove remaining close-range direct-charge steering that makes aggro-locked monsters sidestep away from the player before contact.
- Preserve wall collision and enemy-enemy overlap safeguards where they prevent impossible movement, while ensuring those safeguards do not intentionally retreat from the player.
- Add regression coverage proving a stationary player takes cadence-based monster hits when an aggro-locked monster is in melee range.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `monster-pack-combat-behavior`: Clarify that aggro-locked monster attacks are runtime combat behavior independent of player movement or render visibility, and that close-range direct charge must not include avoidance-style side steering away from the player.

## Impact

- `webapp/App.tsx`: Runtime enemy update loop, attack cadence state, hit application, and visual state synchronization.
- `webapp/smoke-test.mjs`: Add focused regression checks for stationary-player monster contact attacks and runtime-owned attack state.
- Existing frontend build/smoke checks; no new dependencies or data schema migration expected.
