# Abstract Geometric UI Rollback Marker

This file records the reversible UI-only layer for the abstract geometric migration.

## Scope

- HUD shell: `.top-hud`, `.hud-button`
- Help and debug overlays: `.help-text`, `.map-debug-toggle`, `.skill-test-debug-toggles`
- Combat log: `.combat-feed`
- Transitional bottom HUD skin: `.bottom-hud`, `.orb`, `.life-orb`, `.mana-orb`
- Shared visual variables: `--geo-ui-*`

## Restore Rule

These changes are CSS-only skin changes. They must not be used to change player movement, skill casting, combat logs, inventory toggles, map selection, camera/debug controls, or any React state flow.

To restore the previous visual skin, revert the CSS block marked:

`abstract-geometric HUD skin rollback marker`

and remove the `--geo-ui-*` variables if no remaining UI skin uses them.

## Verification

- `webapp/App.tsx` event handlers and state calls remain unchanged for HUD, help text, combat feed, map/debug toggles, and skill editor controls.
- Smoke checks assert the rollback marker and geometric HUD variables remain present while this phase is active.
