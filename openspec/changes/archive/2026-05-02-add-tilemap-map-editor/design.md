# Design

## Entry

`/map-editor` is handled before `GameApp`, like `/sprite-test`. This keeps editor state out of the battle loop and avoids accidental enemy spawning.

## Tile Model

The editor stores tile intent, not masks:

- `empty`: no tile, not walkable
- `ground`: painted floor, walkable
- `wall`: painted wall, blocking

The UI exposes ground and wall as tile brushes. Clear operations set cells to `empty`.

## Walkable And Blocker Derivation

The first version should not expose a separate walkable/blocker paint layer. Separate collision masks are powerful later, but too easy to desync from visuals in the first editor.

Derived rules:

- `ground` -> walkable
- `wall` -> blocker
- `empty` -> blocker/void

The movable character uses the derived walkable rule. If a cell is not ground, movement stops at the previous position.

## Editing Interaction

The editor supports:

- Single-cell fill with the selected brush.
- Single-cell clear.
- Rectangle fill by dragging from a start cell to an end cell.
- Rectangle clear with a clear mode.
- Adjustable cell size with a bounded numeric control.

The first version keeps all state in browser memory so the user can validate the workflow before adding file persistence.

## Rendering

Ground and wall tiles are drawn with CSS in a top-down dungeon style matching the supplied grayscale stone reference. The movable player uses the existing `player_adventurer` unit animation so scale is comparable with battle scenes.
