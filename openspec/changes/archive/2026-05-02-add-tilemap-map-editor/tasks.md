## 1. OpenSpec Setup

- [x] 1.1 Create proposal, design, tasks, and spec delta.
- [x] 1.2 Validate the change can be read by OpenSpec.

## 2. Editor Entry And Model

- [x] 2.1 Add an independent `/map-editor` entry.
- [x] 2.2 Add an in-memory tilemap model with `empty`, `ground`, and `wall` cells.
- [x] 2.3 Add bounded cell size control.

## 3. Paint Tools

- [x] 3.1 Add ground and wall tile selection.
- [x] 3.2 Support single-cell fill and clear.
- [x] 3.3 Support rectangle fill and clear.

## 4. Walkability Preview

- [x] 4.1 Derive walkable/blocker behavior from tile type.
- [x] 4.2 Add a movable player character as scale reference.
- [x] 4.3 Ensure the editor does not spawn monsters or render monster spawn controls.

## 5. Verification

- [x] 5.1 Extend smoke test coverage for the map editor entry.
- [x] 5.2 Run WebApp build.
- [x] 5.3 Run smoke test.
- [x] 5.4 Run OpenSpec strict validation.
