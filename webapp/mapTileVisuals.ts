export type GeometricMapTileKind = "empty" | "ground" | "wall";

export type GeometricMapTileVisualKind =
  | "ground_normal"
  | "ground_cracked"
  | "ground_broken"
  | "ground_blood"
  | "ground_edge"
  | "wall_block"
  | "wall_top"
  | "wall_corner"
  | "wall_door"
  | "void";

export const GEOMETRIC_MAP_TILE_VISUAL_KINDS: GeometricMapTileVisualKind[] = [
  "ground_normal",
  "ground_cracked",
  "ground_broken",
  "ground_blood",
  "ground_edge",
  "wall_block",
  "wall_top",
  "wall_corner",
  "wall_door",
  "void"
];

export type GeometricMapTileNeighbors = {
  n: GeometricMapTileKind;
  e: GeometricMapTileKind;
  s: GeometricMapTileKind;
  w: GeometricMapTileKind;
};

export function stableMapTileSeed(tile: GeometricMapTileKind, x: number, y: number) {
  let hash = 2166136261;
  const value = `${tile}:${x}:${y}`;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function stableMapTileUnit(seed: number, salt = 0) {
  const mixed = Math.imul(seed ^ Math.imul(salt + 1, 374761393), 668265263) >>> 0;
  return (mixed & 0xffff) / 0xffff;
}

export function mapTileAt(
  tiles: ReadonlyArray<ReadonlyArray<GeometricMapTileKind>>,
  x: number,
  y: number
): GeometricMapTileKind {
  if (y < 0 || y >= tiles.length) return "empty";
  const row = tiles[y];
  if (x < 0 || x >= row.length) return "empty";
  return row[x] ?? "empty";
}

export function mapTileNeighbors(
  tiles: ReadonlyArray<ReadonlyArray<GeometricMapTileKind>>,
  x: number,
  y: number
): GeometricMapTileNeighbors {
  return {
    n: mapTileAt(tiles, x, y - 1),
    e: mapTileAt(tiles, x + 1, y),
    s: mapTileAt(tiles, x, y + 1),
    w: mapTileAt(tiles, x - 1, y)
  };
}

export function resolveGroundTileVisual(seed: number, neighbors: GeometricMapTileNeighbors): GeometricMapTileVisualKind {
  if (Object.values(neighbors).some((tile) => tile !== "ground")) return "ground_edge";
  const roll = stableMapTileUnit(seed, 1);
  if (roll > 0.982) return "ground_blood";
  if (roll > 0.94) return "ground_broken";
  if (roll > 0.84) return "ground_cracked";
  return "ground_normal";
}

export function isWallCorner(neighbors: GeometricMapTileNeighbors) {
  return Object.values(neighbors).some((tile) => tile !== "wall");
}
