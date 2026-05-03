## Context

The runtime already creates procedural monster packs with shared `aggro_source_id`, life, base damage, rarity multipliers, and source aggro ranges. The WebApp converts those records into `Enemy` objects and keeps a monotonic `aggroLocked` flag once the player enters an encounter source range.

Two gaps remain. First, monster attacks are visual only and do not reduce player HP. Second, close-range movement deliberately steers monsters into rings around the player and applies player-body repulsion, which reads as avoidance when the desired experience is direct pressure.

The backend combat model already has player defensive semantics through `Player.take_hit(damage, damage_type, hit_kind, avoidable)`, including block, resistance, physical reduction, final mitigation, energy shield, and life. The frontend runtime should use the same vocabulary and outcome shape instead of inventing a separate monster damage system.

## Goals / Non-Goals

**Goals:**

- Make aggro-locked monster packs rush directly toward the player's current position.
- Remove close-range player repulsion and ring-position targeting for aggro-locked chase behavior.
- Double baseline monster chase speed as the first tuning pass.
- Give monsters explicit offense attributes using the existing player stat-id vocabulary where applicable.
- Resolve monster hits against the player's defensive attributes so player gear/stats counter monster damage.
- Keep pack-shared aggro monotonic until monster death or battle reset.
- Keep implementation scoped to the current V1 runtime and verification surface.

**Non-Goals:**

- No behavior tree, advanced pathfinding rewrite, patrol/leash/faction/threat-table system, or smart surround formation.
- No new dependency.
- No monster art or animation asset changes.
- No changes to player outgoing skill damage formulas.
- No saved map schema migration unless existing map data must explicitly store new monster offense fields later.
- No PvP or monster-vs-monster combat.

## Decisions

1. Use a monster offense context instead of a naked damage number.

   Runtime `Enemy` records should carry a compact offense context such as base damage, damage type, hit kind/damage form, attack interval, attack range, and relevant additive/final damage modifiers. Stat ids should match existing player combat vocabulary where possible, for example `damage_add_percent`, `physical_damage_add_percent`, `fire_damage_add_percent`, `attack_damage_add_percent`, `melee_damage_add_percent`, `damage_final_percent`, and `resistance_penetration_percent`.

   Rationale: shared stat names make monster damage easier to tune and later allows monster affixes/rarity to reuse existing combat concepts.

   Alternative considered: keep only `base_damage` and `damage_multiplier`. This is smaller, but it bypasses the user's requirement that monster damage attributes line up with player attributes.

2. Resolve monster hits through player defensive semantics.

   A monster melee hit should compute outgoing monster damage from its offense context, then apply player-side defenses using the same rules as the existing player incoming damage model: hit kind selects attack or spell block, damage type selects resistance, physical damage can use physical reduction, and final mitigation applies before energy shield/life loss.

   Rationale: this makes player defensive stats meaningful in real-time battle and avoids two inconsistent damage pipelines.

   Alternative considered: directly subtract final monster damage from `player.hp`. That would be quick, but it would make block, resistances, mitigation, and energy shield irrelevant.

3. Trigger damage from the monster attack loop, not from proximity alone.

   A monster should deal damage when it is aggro-locked, alive, in melee range, and its attack cooldown/hit timing allows a hit. The existing attack visual timing can be reused as the first hit cadence, as long as damage is emitted at a predictable point in the attack cycle and not every frame.

   Rationale: using an attack cadence prevents instant frame-by-frame HP deletion while matching the visual attack presentation.

   Alternative considered: periodic proximity aura damage. That is simpler, but it does not feel like a monster attack and makes animation timing meaningless.

4. Direct chase means no player repulsion and no ring target for aggro-locked monsters.

   For aggro-locked monsters, close-range movement should keep the player's current world position as the target. It should not switch to ring positions around the player, should not apply player-body repulsion, and should not intentionally retreat from the player. Enemy-vs-enemy separation and wall collision may remain to avoid total overlap and stuck movement.

   Rationale: the requested feel is "do not repel, just charge." Keeping only collision/wall safeguards preserves that pressure without making monsters pass through blocked terrain.

   Alternative considered: keep soft player repulsion but lower its strength. That still preserves the avoidance behavior the user explicitly rejected.

5. Double baseline monster speed with a single runtime multiplier.

   The first implementation should multiply the existing monster chase speeds by `2.0` for normal and boss monsters. If monster-specific move speed stats are introduced in config, the global multiplier can apply after those values.

   Rationale: a single multiplier is easy to verify and easy to tune back after playtesting.

   Alternative considered: tune each monster's speed individually now. That creates unnecessary content churn before the core behavior is proven.

6. Keep pack aggro source state as the source of shared hatred.

   `triggeredEncounterSourceIds` should remain the runtime source of truth. When a source triggers, every living enemy with that source id becomes or remains `aggroLocked`; no distance check should clear it.

   Rationale: the current architecture already supports pack-shared aggro, and the requested behavior is no-leash pursuit.

   Alternative considered: recompute aggro per monster by distance each frame. That would recreate leash behavior and break pack-shared hatred.

## Risks / Trade-offs

- Direct charge may make monsters visually overlap the player -> keep enemy-enemy separation, wall collision, and attack range checks while removing player repulsion.
- Doubling speed may expose navigation jitter -> verify on the existing battle map and leave the multiplier centralized for quick tuning.
- Player HP can drop too quickly when many monsters attack at once -> use attack cadence/hit timing and combat logs to make damage observable; tune damage values separately after behavior is proven.
- Reusing backend defense semantics in frontend can drift over time -> keep helper names and stat ids aligned with existing player combat fields and add smoke/static checks for required stat references.
- Monster offense attributes may be incomplete for every monster at first -> provide safe defaults from existing pack `damage` values and physical melee attack semantics.
