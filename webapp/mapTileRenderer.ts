import {
  GeometricMapTileKind,
  isWallCorner,
  mapTileAt,
  mapTileNeighbors,
  resolveGroundTileVisual,
  stableMapTileSeed,
  stableMapTileUnit
} from "./mapTileVisuals";

export type GeometricMapTileTerrain = {
  tiles: ReadonlyArray<ReadonlyArray<GeometricMapTileKind>>;
  tileSize: number;
  width: number;
  height: number;
};

export type GeometricMapTileCamera = {
  screenX: number;
  screenY: number;
  zoom: number;
};

export type GeometricMapTileViewport = {
  width: number;
  height: number;
};

const TILE_COLORS = {
  void: "#090b0d",
  groundBase: "#161a1d",
  groundAlt: "#1a1e21",
  groundEdge: "rgba(88, 96, 102, 0.38)",
  groundCrack: "rgba(5, 6, 7, 0.48)",
  groundBroken: "rgba(7, 8, 10, 0.62)",
  groundBlood: "rgba(90, 21, 24, 0.64)",
  wallBlock: "#252a2f",
  wallTop: "#4a5056",
  wallTopAlt: "#565c62",
  wallDark: "#121519",
  wallHighlight: "rgba(190, 198, 202, 0.38)"
} as const;

export function renderGeometricMapTiles(
  context: CanvasRenderingContext2D,
  terrain: GeometricMapTileTerrain,
  camera: GeometricMapTileCamera,
  viewport: GeometricMapTileViewport
) {
  if (!terrain.tiles.length || terrain.tileSize <= 0) return;

  context.save();
  const bounds = visibleTileBounds(terrain, camera, viewport);
  context.fillStyle = TILE_COLORS.void;
  context.fillRect(
    bounds.minX * terrain.tileSize,
    bounds.minY * terrain.tileSize,
    (bounds.maxX - bounds.minX + 1) * terrain.tileSize,
    (bounds.maxY - bounds.minY + 1) * terrain.tileSize
  );

  for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      const tile = mapTileAt(terrain.tiles, x, y);
      if (tile === "ground") drawGroundTile(context, terrain, x, y);
      else if (tile === "wall") drawWallTile(context, terrain, x, y);
    }
  }

  context.restore();
}

function visibleTileBounds(
  terrain: GeometricMapTileTerrain,
  camera: GeometricMapTileCamera,
  viewport: GeometricMapTileViewport
) {
  const zoom = Math.max(0.05, camera.zoom || 1);
  const left = camera.screenX - viewport.width * 0.5 / zoom;
  const right = camera.screenX + viewport.width * 0.5 / zoom;
  const top = camera.screenY - viewport.height * 0.54 / zoom;
  const bottom = camera.screenY + viewport.height * 0.46 / zoom;
  const maxY = terrain.tiles.length - 1;
  const maxX = Math.max(0, terrain.tiles[0]?.length ?? 0) - 1;
  return {
    minX: clamp(Math.floor(left / terrain.tileSize) - 1, 0, maxX),
    maxX: clamp(Math.ceil(right / terrain.tileSize) + 1, 0, maxX),
    minY: clamp(Math.floor(top / terrain.tileSize) - 1, 0, maxY),
    maxY: clamp(Math.ceil(bottom / terrain.tileSize) + 1, 0, maxY)
  };
}

function drawGroundTile(context: CanvasRenderingContext2D, terrain: GeometricMapTileTerrain, x: number, y: number) {
  const tileSize = terrain.tileSize;
  const left = x * tileSize;
  const top = y * tileSize;
  const seed = stableMapTileSeed("ground", x, y);
  const neighbors = mapTileNeighbors(terrain.tiles, x, y);
  const visual = resolveGroundTileVisual(seed, neighbors);
  const inset = Math.max(1, tileSize * 0.015);

  context.fillStyle = stableMapTileUnit(seed, 2) > 0.5 ? TILE_COLORS.groundAlt : TILE_COLORS.groundBase;
  context.fillRect(left + inset, top + inset, tileSize - inset * 2, tileSize - inset * 2);

  if (visual === "ground_edge") drawGroundEdges(context, left, top, tileSize, neighbors);
  if (visual === "ground_cracked") drawGroundCrack(context, left, top, tileSize, seed);
  if (visual === "ground_broken") drawGroundBreak(context, left, top, tileSize, seed);
  if (visual === "ground_blood") drawGroundBlood(context, left, top, tileSize, seed);
}

function drawGroundEdges(
  context: CanvasRenderingContext2D,
  left: number,
  top: number,
  tileSize: number,
  neighbors: ReturnType<typeof mapTileNeighbors>
) {
  const edge = Math.max(2, tileSize * 0.08);
  context.fillStyle = TILE_COLORS.groundEdge;
  if (neighbors.n !== "ground") context.fillRect(left, top, tileSize, edge);
  if (neighbors.e !== "ground") context.fillRect(left + tileSize - edge, top, edge, tileSize);
  if (neighbors.s !== "ground") context.fillRect(left, top + tileSize - edge, tileSize, edge);
  if (neighbors.w !== "ground") context.fillRect(left, top, edge, tileSize);
}

function drawGroundCrack(context: CanvasRenderingContext2D, left: number, top: number, tileSize: number, seed: number) {
  context.strokeStyle = TILE_COLORS.groundCrack;
  context.lineWidth = Math.max(1.2, tileSize * 0.018);
  context.beginPath();
  const startX = left + tileSize * (0.22 + stableMapTileUnit(seed, 3) * 0.16);
  const startY = top + tileSize * (0.26 + stableMapTileUnit(seed, 4) * 0.2);
  context.moveTo(startX, startY);
  context.lineTo(left + tileSize * (0.48 + stableMapTileUnit(seed, 5) * 0.12), top + tileSize * 0.52);
  context.lineTo(left + tileSize * (0.64 + stableMapTileUnit(seed, 6) * 0.12), top + tileSize * (0.68 + stableMapTileUnit(seed, 7) * 0.12));
  context.stroke();
}

function drawGroundBreak(context: CanvasRenderingContext2D, left: number, top: number, tileSize: number, seed: number) {
  const cx = left + tileSize * (0.34 + stableMapTileUnit(seed, 8) * 0.32);
  const cy = top + tileSize * (0.36 + stableMapTileUnit(seed, 9) * 0.28);
  const radius = tileSize * (0.08 + stableMapTileUnit(seed, 10) * 0.06);
  context.fillStyle = TILE_COLORS.groundBroken;
  context.beginPath();
  context.moveTo(cx - radius, cy - radius * 0.25);
  context.lineTo(cx - radius * 0.1, cy - radius);
  context.lineTo(cx + radius, cy - radius * 0.15);
  context.lineTo(cx + radius * 0.2, cy + radius);
  context.closePath();
  context.fill();
}

function drawGroundBlood(context: CanvasRenderingContext2D, left: number, top: number, tileSize: number, seed: number) {
  context.fillStyle = TILE_COLORS.groundBlood;
  for (let index = 0; index < 3; index += 1) {
    const cx = left + tileSize * (0.28 + stableMapTileUnit(seed, 11 + index * 3) * 0.44);
    const cy = top + tileSize * (0.26 + stableMapTileUnit(seed, 12 + index * 3) * 0.46);
    const radius = tileSize * (0.025 + stableMapTileUnit(seed, 13 + index * 3) * 0.035);
    context.beginPath();
    context.arc(cx, cy, radius, 0, Math.PI * 2);
    context.fill();
  }
}

function drawWallTile(context: CanvasRenderingContext2D, terrain: GeometricMapTileTerrain, x: number, y: number) {
  const tileSize = terrain.tileSize;
  const left = x * tileSize;
  const top = y * tileSize;
  const seed = stableMapTileSeed("wall", x, y);
  const neighbors = mapTileNeighbors(terrain.tiles, x, y);
  const topHeight = tileSize * 0.34;
  const inset = Math.max(1, tileSize * 0.018);

  context.fillStyle = TILE_COLORS.wallBlock;
  context.fillRect(left + inset, top + inset, tileSize - inset * 2, tileSize - inset * 2);
  context.fillStyle = stableMapTileUnit(seed, 20) > 0.55 ? TILE_COLORS.wallTopAlt : TILE_COLORS.wallTop;
  context.fillRect(left + inset, top + inset, tileSize - inset * 2, topHeight);

  context.strokeStyle = TILE_COLORS.wallHighlight;
  context.lineWidth = Math.max(1, tileSize * 0.018);
  context.beginPath();
  context.moveTo(left + tileSize * 0.12, top + topHeight);
  context.lineTo(left + tileSize * 0.88, top + topHeight);
  if (neighbors.n !== "wall") {
    context.moveTo(left + tileSize * 0.14, top + tileSize * 0.08);
    context.lineTo(left + tileSize * 0.86, top + tileSize * 0.08);
  }
  context.stroke();

  if (isWallCorner(neighbors)) drawWallCornerMarks(context, left, top, tileSize, neighbors);
}

function drawWallCornerMarks(
  context: CanvasRenderingContext2D,
  left: number,
  top: number,
  tileSize: number,
  neighbors: ReturnType<typeof mapTileNeighbors>
) {
  const size = tileSize * 0.18;
  context.fillStyle = TILE_COLORS.wallDark;
  if (neighbors.n !== "wall" || neighbors.w !== "wall") context.fillRect(left, top, size, size);
  if (neighbors.n !== "wall" || neighbors.e !== "wall") context.fillRect(left + tileSize - size, top, size, size);
  if (neighbors.s !== "wall" || neighbors.w !== "wall") context.fillRect(left, top + tileSize - size, size, size);
  if (neighbors.s !== "wall" || neighbors.e !== "wall") context.fillRect(left + tileSize - size, top + tileSize - size, size, size);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
