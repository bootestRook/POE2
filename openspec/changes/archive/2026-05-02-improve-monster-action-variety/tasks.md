## 1. Runtime Fields And Initialization

- [ ] 1.1 Add runtime-only monster variety fields for wake time, animation phase offset, move speed scale, and attack timing offset.
- [ ] 1.2 Initialize variety fields for normal enemy creation, skill test dummies, authored monster spawn points, and authored boss groups.
- [ ] 1.3 Ensure generated random values are stable for each enemy after creation and are not regenerated every render.

## 2. Encounter Wake Staggering

- [ ] 2.1 Detect the first runtime aggro trigger for each authored encounter source.
- [ ] 2.2 Assign per-monster wake delays within 1 second when a monster spawn point enters aggro range.
- [ ] 2.3 Assign per-monster wake delays within 1 second when a boss group enters aggro range.
- [ ] 2.4 Keep pre-wake monsters idle or alert-idle and prevent chase movement until their wake time arrives.

## 3. Animation And Movement Desynchronization

- [ ] 3.1 Apply enemy animation phase offsets when creating battle animation contexts.
- [ ] 3.2 Apply stable enemy movement speed scales to active chase movement.
- [ ] 3.3 Apply small enemy attack visual timing variation without bypassing existing attack range checks.
- [ ] 3.4 Preserve existing collision radius, HP, damage, skill targeting, and authored spawn counts.

## 4. Attack Presentation Stability

- [ ] 4.1 Inspect current attack motion styling to identify where monster scale drops below baseline.
- [ ] 4.2 Update attack motion so monster scale remains at or above idle/walk baseline during attack playback.
- [ ] 4.3 Preserve expressive attack motion through translate, rotate, lunge, swipe, or non-shrinking scale effects.

## 5. Verification

- [ ] 5.1 Add or update smoke checks for runtime variety fields and the 1 second wake delay limit.
- [ ] 5.2 Add or update checks that attack presentation does not shrink below baseline scale.
- [ ] 5.3 Run `npm test`.
- [ ] 5.4 Run `npm run build`.
- [ ] 5.5 Perform a runtime browser check that triggered encounter monsters wake unevenly and no longer walk or attack in lockstep.
