## Context

Runtime encounters currently activate monsters in batches. Once active, monsters share the same global animation clock, use the same base chase speed, and evaluate attack visual timing from similar conditions. This makes authored monster groups look overly synchronized even when their positions differ.

The current runtime already has the right integration points: authored aggro activation, `Enemy` runtime fields, `EnemyVisualRuntime`, `UnitAnimationContext`, and centralized rendering through `resolveUnitAnimation`. The change should stay in those presentation/runtime layers and avoid changing combat damage, collision sizes, saved map schema, or monster asset files.

## Goals / Non-Goals

**Goals:**
- Make monster groups feel less synchronized after an encounter point is triggered.
- Stagger monster wake-up within a short, deterministic-feeling random window.
- Offset per-monster animation timing so walk/idle/attack frames do not all match.
- Add slight per-monster movement and attack timing variation without changing authored encounter count or aggro rules.
- Prevent attack playback from visually shrinking monsters below their baseline render scale.

**Non-Goals:**
- No behavior tree, pathfinding rewrite, formation AI, flocking, or advanced steering system.
- No saved map schema migration.
- No changes to damage, HP, collision radii, skill targeting, or monster asset generation.
- No new dependency.

## Decisions

1. Store variety values on runtime enemies.

   Add optional runtime-only fields such as `wakeAt`, `animationPhaseOffsetMs`, `moveSpeedScale`, and `attackTimingOffsetMs` to `Enemy`. These values are initialized when monsters are created or when an authored group is triggered.

   Rationale: enemy-specific runtime fields keep the behavior stable across frames and avoid recalculating randomness every render. This is simpler than a separate randomization registry keyed by enemy id.

   Alternative considered: derive offsets from enemy id hashes only. That is deterministic and cheap, but less flexible for wake timing because wake delay needs to be relative to the actual trigger moment.

2. Apply wake staggering only to authored aggro-triggered encounters.

   When the player enters a monster spawn point or boss group aggro range, newly aggro-locked monsters from that source receive `wakeAt = now + random(0, 1.0s)`. Until `wakeAt`, they remain visible but do not chase; their animation should stay idle or alert-idle.

   Rationale: this addresses the user-facing problem directly without slowing unrelated continuously spawned monsters.

   Alternative considered: random delay for every monster spawn. This would affect baseline combat pacing and make non-authored spawns feel inconsistent.

3. Use per-monster animation phase offsets in animation context.

   `createBattleAnimationContexts` should pass `elapsedMs + animationPhaseOffsetMs` for enemy animations. The offset should be stable per enemy and can be seeded at creation time.

   Rationale: wake staggering alone only desynchronizes start time. Animation phase offset directly fixes matching walk cycles and matching idle cycles.

   Alternative considered: randomize FPS per monster. That can drift and create odd visual timing; a phase offset preserves authored animation speed.

4. Use small movement and attack timing variation.

   Active chase speed should multiply the existing enemy speed by a small scale, for example `0.92` to `1.08`. Attack visual start/cooldown can use a small offset, for example plus or minus `150ms`, while preserving the existing attack range checks.

   Rationale: slight variation breaks straight-line group edges and simultaneous attack beats without changing the intended encounter difficulty much.

   Alternative considered: random movement target offsets around the player. This can help later, but it risks changing collision pressure and melee feel more than the current goal needs.

5. Keep attack scale at or above baseline.

   Attack presentation should not apply a scale below the unit's normal render scale. If attack motion uses squash/stretch, the squash must be subtle and must not make monsters visibly smaller than idle/walk.

   Rationale: the user observed monsters shrinking during attack. The fix belongs in the visual motion style rather than asset or stat data.

## Risks / Trade-offs

- Random wake delays can make encounters feel slower → keep the delay capped at 1 second and apply only after aggro trigger.
- Movement speed variation can slightly affect crowd spacing → keep the range narrow and do not change collision radius or damage.
- Runtime-only enemy fields can be lost when enemies are recreated → initialize through all enemy creation paths and authored encounter activation paths.
- Animation offsets can complicate tests that assume exact frame indices → tests should verify fields and ranges rather than a single frame number.
- If attack scale is clamped too hard, attacks may feel less punchy → preserve translate/rotate/lunge motion while avoiding below-baseline shrink.
