## Context

The current WebApp runtime already gives procedural monsters offense fields, shared aggro lock, direct chase, and melee hit resolution against player defenses. The problematic behavior is in ownership and close-range steering: melee attack readiness and hit application are coupled to `syncEnemyVisuals()`, while attack cooldown state lives in `enemyVisuals`. That makes damage depend on presentation timing and renderable-enemy synchronization instead of the runtime AI/combat tick.

Close-range aggro movement also still uses direct-charge crowd steering and alternate angle selection. Those safeguards can look like monsters dodging around the player even after aggro is locked. The fix should keep terrain and overlap safeguards, but remove avoidance-style steering as monsters enter contact range.

## Goals / Non-Goals

**Goals:**

- Make aggro-locked monsters able to damage a stationary player as soon as melee cadence allows.
- Move monster attack readiness, cooldown, and hit application into the runtime enemy/combat update path.
- Keep enemy visuals synchronized from runtime attack state rather than using visuals to decide hits.
- Stop close-range aggro-locked monsters from choosing side-step movement that reads as avoiding the player.
- Add focused regression coverage for stationary-player contact attacks and render-independent attack state.

**Non-Goals:**

- No behavior tree, threat table, patrol, leash, or full pathfinding rewrite.
- No monster stat tuning beyond preserving existing damage/range/cadence semantics.
- No new dependency.
- No map data or monster config migration.
- No changes to player outgoing skill damage.

## Decisions

1. Runtime enemy state owns attack cadence.

   Add or reuse runtime enemy fields for attack timing, such as next attack readiness and active attack visual timing, on `Enemy` rather than storing the authoritative values in `enemyVisuals`. The runtime tick should evaluate alive, aggro-locked, in-range monsters and apply at most one player hit when the cooldown is ready.

   Rationale: combat should advance every game tick while `playing`, regardless of whether the enemy is currently renderable or whether the player moved. Visual state should mirror combat state, not drive it.

   Alternative considered: keep `enemyVisuals` as the attack source of truth and call it more often. That still leaves combat coupled to presentation and makes future culling/visibility changes risky.

2. Visual sync becomes presentation-only.

   `syncEnemyVisuals()` should read runtime attack fields to show attack animation, direction, and movement vectors. It should not call player damage helpers or mutate attack cooldowns.

   Rationale: separating presentation from combat makes the bug class testable and prevents invisible/offscreen monsters from losing combat behavior by accident.

   Alternative considered: duplicate attack checks in both runtime and visual sync. That risks double hits and inconsistent cooldowns.

3. Direct charge removes close-range avoidance steering.

   For aggro-locked monsters inside a small contact/attack approach band, movement should target the player's current world position directly. Enemy-enemy and wall safeguards may clamp or block impossible moves, but direct-charge steering should not choose tangential side-step routes that increase or preserve distance from the player when contact is still needed.

   Rationale: the player-facing requirement is pressure: monsters should close and attack, not form a ring or visibly avoid the player. Terrain and overlap checks remain safety constraints, not behavior goals.

   Alternative considered: lowering tangent force. That still leaves sidestep behavior in the contact band and makes the fix tuning-dependent.

4. Regression coverage should exercise logic, not just token presence.

   Existing smoke checks verify many static strings. This change needs a focused check that models a stationary player and an aggro-locked monster already in melee range, then verifies one hit occurs on cadence without player movement or render synchronization.

   Rationale: the observed bug is temporal. Static checks cannot prove the runtime loop applies damage when the player is idle.

   Alternative considered: manual-only WebApp verification. Useful, but too easy to regress.

## Risks / Trade-offs

- More runtime state on `Enemy` could increase object churn -> keep fields minimal and update them inside existing enemy mapping.
- Multiple nearby monsters may hit on the same frame -> preserve existing cadence/range rules and current damage values; tune separately if gameplay is too punishing.
- Removing close-range sidestep can create more visual overlap -> keep collision/wall safeguards, but ensure they do not intentionally push monsters away from the player.
- Smoke-test extraction may be brittle if implemented as string checks only -> prefer a small exported or text-parsed simulation helper if feasible; otherwise add precise static checks plus manual smoke notes.
