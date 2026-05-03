## Context

`/map-editor` currently owns terrain authoring, file persistence, player spawn placement, collider settings, minimap rendering, and a movable player reference character. The battle runtime currently creates enemies through timer-based spawning when the game is playing, while baked map data can expose coarse enemy and boss points from masks.

This change adds authored encounter data to map editor JSON and makes runtime map entry initialize enemies from that authored data. The design must preserve the dark ARPG expectation that large maps can contain many pre-authored monsters without imposing an authoring-time hard cap.

## Goals / Non-Goals

**Goals:**

- Add an edit mode where keyboard movement controls the editor camera instead of the player reference character.
- Add monster spawn points with circular placement ranges, monster type, count, and density controls.
- Add boss groups where multiple candidate locations can be authored and only one group is chosen per map entry.
- Keep encounter data backward-compatible for existing map JSON files.
- Support high monster counts through runtime spatial indexing, activation tiers, low-frequency simulation for distant monsters, and visible-entity rendering.
- Use placeholder monster/BOSS options in the first pass until formal content tables exist.

**Non-Goals:**

- Build a formal monster database or boss configuration table.
- Implement full encounter scripting, waves, loot chests, exits, elite affixes, or map modifiers.
- Convert map rendering, terrain autotiling, or the skill system as part of this change.
- Solve every high-count rendering path with a new engine dependency in the first pass.

## Decisions

### Store Semantic Encounter Data In Map JSON

Add an optional `encounters` object to the map editor saved state:

```ts
type MapEditorEncounterData = {
  monsterSpawns: Array<{
    id: string;
    x: number;
    y: number;
    radius: number;
    monsterId: string;
    count: number;
    density: number;
  }>;
  bossGroups: Array<{
    id: string;
    x: number;
    y: number;
    radius: number;
    bossCount: number;
    bossIds: string[];
  }>;
};
```

Coordinates are stored in map world/cell space consistently with current editor placement data. Existing maps normalize missing `encounters` to empty arrays.

Alternative considered: encode encounters into spawn mask colors. That would be compact for baked assets but too limited for count, density, monster identity, and multi-boss group data.

### Separate Preview Movement From Edit Movement

The editor exposes an edit-mode toggle. When edit mode is off, existing WASD movement keeps controlling the player reference. When edit mode is on, WASD pans the editor camera and does not move the player reference.

Alternative considered: always pan the view and remove player movement. That would break the current scale and collision preview workflow.

### Use Context Placement For Encounter Tools

The first encounter tool opens a small context menu at the clicked map location and offers `新增怪点`. This keeps the interaction expandable for later actions such as adding boss groups, deleting nearby encounter points, or adding exits without overloading single-click painting.

Alternative considered: make every click immediately create a spawn. That is faster for bulk placement but makes accidental placements too easy once the editor has multiple object tools.

### Treat Count And Density As Separate Authoring Controls

`count` is the requested number of monsters for the spawn point. `density` controls placement compactness, spacing, and sampling attempts inside the circular range. Density must not be interpreted as a hidden multiplier that changes the final count.

Alternative considered: make density multiply count. That makes authoring unpredictable and increases performance risk without clear feedback.

### Initialize All Authored Monsters As Lightweight Records

When a battle starts on a map with authored encounters, the runtime samples all configured monster positions at entry time and creates lightweight monster records. The runtime must not simulate or render every record every frame.

Runtime tiers:

- `dormant`: stored in spatial index, no per-frame AI or DOM rendering.
- `aware`: near the player or relevant to skills, updated at reduced cadence.
- `active`: in combat radius, updated every frame for movement and attacks.
- `visible`: in or near the viewport, eligible for visual rendering.
- `dead`: removed from active indexes or retained only for drops/results.

Alternative considered: continue timer spawning from authored points. That would perform well but violates the requirement that encounters already exist at match start.

### Use Spatial Indexing As The Primary Performance Contract

Enemy lookup, activation, targeting, area damage, and movement updates should query a map-grid or chunk index instead of scanning all enemies. The index can begin as a simple fixed-size chunk map and later move to a more specialized structure if needed.

Alternative considered: keep array scans and rely on React rendering limits. That will fail once maps contain high monster counts and skills need area queries.

### Choose One Boss Group Per Entry

Boss groups are authored as multiple candidate points. On map entry, the runtime selects one group at random and spawns all bosses configured in that group inside the same circular range. Bosses are few enough to be fully active immediately.

Alternative considered: spawn one boss from each authored point. That removes the random-location gameplay requested by the designer.

## Risks / Trade-offs

- High monster counts still overload DOM rendering -> Render only visible/near-visible enemies first; leave a future canvas/WebGL renderer possible without changing encounter data.
- Skill targeting accidentally scans all lightweight records -> Route target search and area damage through the spatial index.
- Distant monsters feel inactive -> Keep this intentional for performance, and promote monsters to aware/active before they are close enough for the player to notice.
- Dense placement samples invalid terrain -> Clamp or resample against walkable cells and report editor/runtime warnings when requested counts cannot be placed cleanly.
- Placeholder monster IDs leak into long-term content -> Isolate placeholders behind a small option list so later content tables can replace them without changing saved encounter shape.

## Migration Plan

Existing maps require no file migration. Loading normalizes missing `encounters`, `monsterSpawns`, and `bossGroups` to empty arrays. Saving writes the normalized shape once encounter tools are used.

Rollback can ignore `encounters` at runtime and keep the map editor terrain data intact.

## Open Questions

- What chunk size gives the best balance for current map scale and skill ranges?
- Should boss-group placement be added to the same context menu in the first implementation, or appear as a toolbar-selected tool after monster placement is working?
- Should the first pass expose a visible stress/debug overlay showing dormant/aware/active/visible counts?
