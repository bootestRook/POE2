## 1. Monster Offense Data

- [x] 1.1 Add runtime `Enemy` offense fields for base damage, damage type, hit kind, attack range, attack cadence, and shared stat-id damage modifiers.
- [x] 1.2 Thread procedural pack `damage` and rarity `damage_multiplier` into the runtime offense fields when creating enemies.
- [x] 1.3 Add safe default offense values for enemies that do not yet have explicit monster combat config.
- [x] 1.4 Add or extend monster configuration fields for explicit offense attributes using existing player stat ids where applicable.

## 2. Player Defensive Resolution

- [x] 2.1 Implement a frontend helper that resolves monster outgoing damage against player block, resistance, physical reduction, final mitigation, energy shield, and life semantics.
- [x] 2.2 Keep helper stat ids aligned with existing player combat fields such as `attack_block_chance_percent`, `spell_block_chance_percent`, resistance stats, and `damage_mitigation_final_percent`.
- [x] 2.3 Update runtime player state so monster hits reduce shield/life and clamp values safely.
- [x] 2.4 Add battle feedback for monster damage through existing combat logs or floating text.

## 3. Direct Chase Behavior

- [x] 3.1 Replace aggro-locked close-range ring targeting with direct targeting of the player's current world position.
- [x] 3.2 Remove player-body repulsion and intentional retreat logic for aggro-locked monsters.
- [x] 3.3 Preserve wall collision and enemy-enemy separation safeguards.
- [x] 3.4 Double baseline normal and boss monster chase speed through a centralized multiplier or constants.

## 4. Monster Attack Loop

- [x] 4.1 Connect melee attack readiness to exactly one player damage hit per attack cycle.
- [x] 4.2 Ensure monsters do not deal damage every frame while overlapping the player.
- [x] 4.3 Ensure authored/procedural monsters only attack after becoming aggro-locked.
- [x] 4.4 Preserve existing visual attack state while adding real damage timing.

## 5. Pack Aggro Verification

- [x] 5.1 Verify entering one aggro source locks every living monster with that source id.
- [x] 5.2 Verify moving away from the source radius does not clear aggro lock.
- [x] 5.3 Verify battle reset clears triggered aggro source state.
- [x] 5.4 Verify dead monsters no longer chase or attack.

## 6. Tests And Smoke Checks

- [x] 6.1 Add smoke/static checks for monster offense fields, direct chase behavior, removed player repulsion, and speed multiplier.
- [x] 6.2 Add or update runtime tests/checks proving player defensive stats affect monster incoming damage.
- [x] 6.3 Run the relevant frontend smoke test and TypeScript/build check.
- [x] 6.4 Manually verify in the WebApp that aggro-locked monsters rush the player and player HP decreases on monster hits.
