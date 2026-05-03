import { GEOMETRIC_VISUAL_TOKENS, geometricToneColor } from "./visualTokens";
import { GeometricMapTileTerrain, renderGeometricMapTiles } from "./mapTileRenderer";
import { MonsterGeometryShape, MonsterGeometryTier, resolveMonsterGeometryVisual } from "./monsterGeometryVisuals";

const PLAYER_IDLE_ROTATION_RADIANS_PER_SECOND = Math.PI / 6;
const PLAYER_MOVING_ROTATION_RADIANS_PER_SECOND = Math.PI * 5 / 6;
const PLAYER_INITIAL_ROTATION_RADIANS = -Math.PI / 2;
const PLAYER_ROTATION_BY_CANVAS = new WeakMap<HTMLCanvasElement, { frameTimeMs: number; rotation: number }>();

export type BattleGeometryCamera = {
  screenX: number;
  screenY: number;
  zoom: number;
};

export type BattleGeometryEnemy = {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  monsterId?: string;
  visualPrimaryColor?: string;
  boss?: boolean;
  runtimeTier?: string;
};

export type BattleGeometryProjectile = {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  velocityX?: number;
  velocityY?: number;
  directionX?: number;
  directionY?: number;
  trajectory?: string;
  arcHeight?: number;
  projectileWidth?: number;
  projectileHeight?: number;
  projectileSpeed?: number;
  damageType?: string;
  vfxKey?: string;
  ttl: number;
  duration: number;
};

export type BattleGeometryArea = {
  id: number;
  kind: "passive-aura" | "nova" | "damage-zone" | "melee-arc" | "chain" | "lava-orbit";
  x?: number;
  y?: number;
  radius?: number;
  width?: number;
  height?: number;
  directionX?: number;
  directionY?: number;
  arcAngle?: number;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  orbitSpeedDegPerSec?: number;
  orbCount?: number;
  startAngleDeg?: number;
  elapsedMs?: number;
  damageRadius?: number;
  ringWidth?: number;
  damageType?: string;
  vfxKey?: string;
  warning?: boolean;
  ttl: number;
  duration: number;
};

export type BattleGeometryHit = {
  id: number;
  x: number;
  y: number;
  radius?: number;
  damageType?: string;
  vfxKey?: string;
  ttl: number;
  duration: number;
};

export type BattleGeometryText = {
  id: number;
  x: number;
  y: number;
  text: string;
  damageType?: string;
  ttl: number;
  duration: number;
};

export type BattleGeometrySnapshot = {
  width: number;
  height: number;
  timeMs: number;
  camera: BattleGeometryCamera;
  terrain?: GeometricMapTileTerrain;
  player: {
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    moving: boolean;
  };
  enemies: ReadonlyArray<BattleGeometryEnemy>;
  projectiles: ReadonlyArray<BattleGeometryProjectile>;
  areas: ReadonlyArray<BattleGeometryArea>;
  hits: ReadonlyArray<BattleGeometryHit>;
  texts: ReadonlyArray<BattleGeometryText>;
};

export function renderBattleGeometry(canvas: HTMLCanvasElement, snapshot: BattleGeometrySnapshot, frameTimeMs = performance.now()) {
  const context = canvas.getContext("2d");
  if (!context) return;
  const playerRotation = resolvePlayerRotation(canvas, snapshot, frameTimeMs);

  const width = Math.max(1, Math.round(snapshot.width));
  const height = Math.max(1, Math.round(snapshot.height));
  const pixelRatio = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  const pixelWidth = Math.round(width * pixelRatio);
  const pixelHeight = Math.round(height * pixelRatio);

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);
  drawMatteBackground(context, width, height);

  context.save();
  applyWorldCameraTransform(context, width, height, snapshot);
  if (snapshot.terrain) renderGeometricMapTiles(context, snapshot.terrain, snapshot.camera, { width, height });
  drawAreaMarkers(context, snapshot);
  drawProjectileMarkers(context, snapshot);
  drawBattleEntityMarkers(context, snapshot, playerRotation);
  drawHitMarkers(context, snapshot);
  drawFloatingTexts(context, snapshot);
  context.restore();
}

function drawMatteBackground(context: CanvasRenderingContext2D, width: number, height: number) {
  const tokens = GEOMETRIC_VISUAL_TOKENS;
  context.fillStyle = tokens.color.background;
  context.fillRect(0, 0, width, height);

  const minor = 64;
  const major = 256;
  context.lineWidth = tokens.geometry.minLineWidth;
  for (let x = 0; x <= width; x += minor) {
    context.strokeStyle = x % major === 0 ? tokens.color.gridMajor : tokens.color.gridMinor;
    line(context, x, 0, x, height);
  }
  for (let y = 0; y <= height; y += minor) {
    context.strokeStyle = y % major === 0 ? tokens.color.gridMajor : tokens.color.gridMinor;
    line(context, 0, y, width, y);
  }

  context.globalAlpha = 1;
}

function drawBattleEntityMarkers(context: CanvasRenderingContext2D, snapshot: BattleGeometrySnapshot, playerRotation: number) {
  const entities = [
    ...snapshot.enemies.map((enemy) => ({ kind: "enemy" as const, x: enemy.x, y: enemy.y, enemy })),
    { kind: "player" as const, x: snapshot.player.x, y: snapshot.player.y }
  ].sort(compareBattleEntityMarkerOrder);

  for (const entity of entities) {
    if (entity.kind === "player") drawPlayerMarker(context, snapshot, playerRotation);
    else drawEnemyMarker(context, entity.enemy, snapshot);
  }
}

function drawPlayerMarker(context: CanvasRenderingContext2D, snapshot: BattleGeometrySnapshot, rotation: number) {
  const tokens = GEOMETRIC_VISUAL_TOKENS;
  const scale = screenStableScale(snapshot);
  const radius = tokens.geometry.playerRadius * scale;
  const { x, y } = snapshot.player;

  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.fillStyle = tokens.color.white;
  context.strokeStyle = tokens.color.blue;
  context.lineWidth = 3 * scale;
  regularPolygonPath(context, 0, 0, radius, 3, 0);
  context.fill();
  context.stroke();

  context.fillStyle = tokens.color.blue;
  circlePath(context, 0, 0, 4.5 * scale);
  context.fill();
  context.restore();
}

function drawEnemyMarker(context: CanvasRenderingContext2D, enemy: BattleGeometryEnemy, snapshot: BattleGeometrySnapshot) {
  const tokens = GEOMETRIC_VISUAL_TOKENS;
  const scale = screenStableScale(snapshot);
  const visual = resolveMonsterGeometryVisual(enemy.monsterId);
  const elite = visual?.tier === "rare" || enemy.monsterId === "enemy_brute" || enemy.boss;
  const tier = visual?.tier ?? (enemy.boss ? "boss" : elite ? "rare" : "normal");
  const radius = visual ? visual.sizePx * 0.5 * scale : (enemy.boss ? tokens.geometry.bossRadius : elite ? tokens.geometry.eliteRadius : tokens.geometry.enemyRadius) * scale;
  const fill = enemy.visualPrimaryColor ?? visual?.primaryColor ?? (elite ? tokens.color.orange : tokens.color.gray);
  const accent = "#05070B";
  const alpha = enemy.runtimeTier === "dormant" ? 0.34 : 0.88;
  const facingRotation = enemyFacingRotation(enemy, snapshot);

  drawMonsterRarityPedestal(context, enemy.x, enemy.y, radius, tier, fill, scale, alpha);
  drawGroundShadow(context, enemy.x, enemy.y, radius * 1.65, radius * 0.46, alpha * 0.34);
  context.save();
  context.translate(enemy.x, enemy.y);
  context.rotate(facingRotation);
  context.fillStyle = fill;
  context.globalAlpha = alpha;
  context.lineWidth = (elite ? 2.5 : 1.5) * scale;
  if (visual) {
    drawMonsterGeometryShape(context, visual.shape, radius, fill, accent, scale, alpha);
  } else if (enemy.boss) {
    drawMonsterGeometryShape(context, "boss_king", radius, fill, accent, scale, alpha);
  } else if (elite) {
    drawMonsterGeometryShape(context, "double_diamond", radius, fill, accent, scale, alpha);
  } else {
    drawMonsterGeometryShape(context, "triangle", radius, fill, accent, scale, alpha);
  }
  context.restore();

  if (tier !== "boss") {
    drawHealthArc(context, enemy.x, enemy.y, radius + 6 * scale, enemy.hp, enemy.maxHp, tier, fill, 0.92, scale);
  }
}

function drawMonsterGeometryShape(
  context: CanvasRenderingContext2D,
  shape: MonsterGeometryShape,
  radius: number,
  fill: string,
  accent: string,
  scale: number,
  alpha: number
) {
  const cut = "#05070B";
  const tierScale = radius > 36 ? 1.1 : radius > 26 ? 1.0 : 0.86;
  switch (shape) {
    case "circle_ring":
      drawMarkerRing(context, fill, cut, 0, 0, radius * 0.74, 0.18, scale);
      break;
    case "triangle":
      drawMarkerTriangleShard(context, fill, cut, 0, 0, radius * 0.96, scale);
      break;
    case "square_dot":
      drawMarkerSquareFrame(context, fill, cut, 0, 0, radius * 1.2, -0.22, scale);
      drawMarkerChip(context, fill, cut, radius * 0.54, -radius * 0.54, radius * 0.24, 0.15, scale);
      break;
    case "diamond_tail":
      drawMarkerSquareFrame(context, fill, cut, 0, 0, radius * 1.18, Math.PI / 4, scale);
      drawMarkerChip(context, fill, cut, radius * 0.86, radius * 0.62, radius * 0.16, Math.PI / 4, scale);
      break;
    case "double_triangle":
      drawMarkerTriangleShard(context, fill, cut, -radius * 0.26, radius * 0.06, radius * 0.72, scale);
      drawMarkerChip(context, fill, cut, radius * 0.54, -radius * 0.42, radius * 0.24, 0.08, scale);
      break;
    case "hex_eye":
      drawMarkerHexCell(context, fill, cut, 0, 0, radius * 0.78, scale);
      drawMarkerCutLine(context, cut, -radius * 0.46, 0, radius * 0.46, 0, 3.4 * scale);
      break;
    case "cluster":
      drawMarkerRing(context, fill, cut, -radius * 0.38, radius * 0.08, radius * 0.34, 0.36, scale);
      drawMarkerRing(context, fill, cut, radius * 0.34, -radius * 0.18, radius * 0.3, 0.38, scale);
      drawMarkerChip(context, fill, cut, radius * 0.2, radius * 0.42, radius * 0.16, 0.2, scale);
      break;
    case "needle_ghost":
      drawMarkerTriangleShard(context, fill, cut, 0, 0, radius * 0.9, scale);
      drawMarkerCutLine(context, cut, radius * 0.02, -radius * 0.42, radius * 0.02, radius * 0.44, 3.2 * scale);
      break;
    case "circle_square":
      drawMarkerRing(context, fill, cut, 0, 0, radius * 0.78, 0.2, scale);
      drawMarkerSquareFrame(context, fill, cut, 0, 0, radius * 0.72, 0, scale);
      break;
    case "tri_in_tri":
      drawMarkerTriangleShard(context, fill, cut, 0, 0, radius, scale);
      drawMarkerCutTriangle(context, cut, 0, radius * 0.08, radius * 0.38);
      break;
    case "crystal_cross":
      drawMarkerSquareFrame(context, fill, cut, 0, 0, radius * 1.28, Math.PI / 4, scale);
      drawMarkerCutLine(context, cut, -radius * 0.5, 0, radius * 0.5, 0, 3.2 * scale);
      drawMarkerCutLine(context, cut, 0, -radius * 0.5, 0, radius * 0.5, 3.2 * scale);
      break;
    case "hex_core":
      drawMarkerHexCell(context, fill, cut, 0, 0, radius * 0.88, scale);
      drawMarkerHexCell(context, fill, cut, 0, 0, radius * 0.36, scale * 0.82);
      break;
    case "broken_ring_bolt":
      drawMarkerCrescent(context, fill, cut, 0, 0, radius * 0.86, scale);
      drawMarkerCutLine(context, cut, radius * 0.08, -radius * 0.66, -radius * 0.08, radius * 0.62, 3.2 * scale);
      break;
    case "square_invtri":
      drawMarkerSquareFrame(context, fill, cut, 0, 0, radius * 1.15, 0, scale);
      drawMarkerCutTriangle(context, cut, 0, radius * 0.06, radius * 0.42, Math.PI / 2);
      break;
    case "wind_wheel":
      drawMarkerSegmentedDisk(context, fill, cut, radius * 0.8, 6, scale);
      break;
    case "double_diamond":
      drawMarkerSquareFrame(context, fill, cut, -radius * 0.22, 0, radius * 0.94, Math.PI / 4, scale);
      drawMarkerSquareFrame(context, fill, cut, radius * 0.34, -radius * 0.04, radius * 0.64, Math.PI / 4, scale * 0.8);
      break;
    case "tri_crown":
      for (const x of [-0.46, 0, 0.46]) {
        drawMarkerTriangleShard(context, fill, cut, x * radius, Math.abs(x) > 0 ? radius * 0.12 : -radius * 0.04, radius * 0.5, scale);
      }
      break;
    case "ring_square_corners":
      drawMarkerRing(context, fill, cut, 0, 0, radius * 0.76, 0.2, scale);
      drawMarkerSquareFrame(context, fill, cut, 0, 0, radius * 0.66, 0, scale);
      drawMarkerChip(context, fill, cut, radius * 0.76, -radius * 0.76, radius * 0.14, 0.2, scale);
      break;
    case "star_diamonds":
      for (let index = 0; index < 6; index += 1) {
        const angle = index * Math.PI / 3;
        drawMarkerChip(context, fill, cut, Math.cos(angle) * radius * 0.5, Math.sin(angle) * radius * 0.5, radius * 0.22, Math.PI / 4, scale);
      }
      break;
    case "hex_tri_layers":
      drawMarkerHexCell(context, fill, cut, 0, 0, radius * 0.92, scale);
      drawMarkerTriangleShard(context, fill, cut, 0, 0, radius * 0.52, scale * 0.78);
      break;
    case "square_spikes":
      drawMarkerSquareFrame(context, fill, cut, 0, 0, radius * 1.08, 0, scale);
      for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
        drawMarkerChip(context, fill, cut, Math.cos(angle) * radius * 0.76, Math.sin(angle) * radius * 0.76, radius * 0.16, angle, scale);
      }
      break;
    case "double_ring_eye":
      drawMarkerRing(context, fill, cut, 0, 0, radius * 0.8, 0.18, scale);
      drawMarkerRing(context, fill, cut, 0, 0, radius * 0.42, 0.28, scale * 0.72);
      break;
    case "obelisk":
      drawMarkerObelisk(context, fill, cut, radius, scale);
      break;
    case "twin_shadow":
      drawMarkerTriangleShard(context, fill, cut, -radius * 0.2, 0, radius * 0.72, scale);
      drawMarkerTriangleShard(context, fill, cut, radius * 0.24, radius * 0.08, radius * 0.58, scale * 0.72);
      break;
    case "boss_king":
      drawMarkerSquareFrame(context, fill, cut, 0, 0, radius * 1.05, Math.PI / 4, scale * tierScale);
      drawMarkerTriangleShard(context, fill, cut, 0, -radius * 0.68, radius * 0.34, scale);
      drawMarkerChip(context, fill, cut, radius * 0.68, radius * 0.58, radius * 0.16, Math.PI / 4, scale);
      break;
    case "boss_void":
      drawMarkerCrescent(context, fill, cut, 0, 0, radius * 0.9, scale * 1.2);
      drawMarkerRing(context, fill, cut, radius * 0.6, radius * 0.18, radius * 0.18, 0.36, scale);
      break;
    case "boss_pinwheel":
      drawMarkerSegmentedDisk(context, fill, cut, radius * 0.86, 8, scale * 1.12);
      break;
    case "boss_star_mother":
      drawMarkerSegmentedDisk(context, fill, cut, radius * 0.78, 10, scale);
      for (let index = 0; index < 5; index += 1) {
        const angle = index * Math.PI * 2 / 5;
        drawMarkerChip(context, fill, cut, Math.cos(angle) * radius * 0.86, Math.sin(angle) * radius * 0.86, radius * 0.12, Math.PI / 4, scale);
      }
      break;
    case "boss_judicator":
      drawMarkerSquareFrame(context, fill, cut, 0, 0, radius * 1.22, 0, scale * 1.1);
      drawMarkerCutLine(context, cut, -radius * 0.5, 0, radius * 0.5, 0, 4 * scale);
      drawMarkerCutLine(context, cut, 0, -radius * 0.5, 0, radius * 0.5, 4 * scale);
      break;
    case "boss_eclipse":
      drawMarkerCrescent(context, fill, cut, 0, 0, radius * 0.92, scale * 1.28);
      break;
    case "boss_mirror":
      drawMarkerSquareFrame(context, fill, cut, 0, 0, radius * 1.18, Math.PI / 4, scale * 1.05);
      drawMarkerSquareFrame(context, fill, cut, 0, 0, radius * 0.66, Math.PI / 4, scale * 0.72);
      break;
    case "boss_triad":
      for (let index = 0; index < 3; index += 1) {
        const angle = index * Math.PI * 2 / 3 - Math.PI / 2;
        drawMarkerTriangleShard(context, fill, cut, Math.cos(angle) * radius * 0.26, Math.sin(angle) * radius * 0.26, radius * 0.48, scale);
      }
      break;
  }
  context.shadowColor = "transparent";
}

function drawMarkerStroke(
  context: CanvasRenderingContext2D,
  color: string,
  cut: string,
  lineWidth: number,
  buildPath: () => void,
  shadowOffset = 4
) {
  context.save();
  context.lineCap = "butt";
  context.lineJoin = "miter";
  context.translate(shadowOffset, shadowOffset * 1.08);
  context.strokeStyle = cut;
  context.lineWidth = lineWidth;
  buildPath();
  context.stroke();
  context.restore();

  context.save();
  context.lineCap = "butt";
  context.lineJoin = "miter";
  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  buildPath();
  context.stroke();
  context.restore();
}

function drawMarkerFill(
  context: CanvasRenderingContext2D,
  color: string,
  cut: string,
  buildPath: () => void,
  shadowOffset = 4
) {
  context.save();
  context.translate(shadowOffset, shadowOffset * 1.08);
  context.fillStyle = cut;
  buildPath();
  context.fill();
  context.restore();

  context.save();
  context.fillStyle = color;
  buildPath();
  context.fill();
  context.restore();
}

function drawMarkerRing(context: CanvasRenderingContext2D, color: string, cut: string, x: number, y: number, radius: number, hollowRatio: number, scale: number) {
  const width = Math.max(3.4, radius * hollowRatio);
  drawMarkerStroke(context, color, cut, width, () => {
    context.beginPath();
    context.arc(x, y, radius - width * 0.5, 0, Math.PI * 2);
  }, 3.6 * scale);
}

function drawMarkerSquareFrame(context: CanvasRenderingContext2D, color: string, cut: string, x: number, y: number, size: number, rotation: number, scale: number) {
  const width = Math.max(3.2, size * 0.16);
  drawMarkerStroke(context, color, cut, width, () => {
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.beginPath();
    context.rect(-size * 0.5, -size * 0.5, size, size);
    context.restore();
  }, 3.8 * scale);
}

function drawMarkerTriangleShard(context: CanvasRenderingContext2D, color: string, cut: string, x: number, y: number, radius: number, scale: number) {
  drawMarkerFill(context, color, cut, () => regularPolygonPath(context, x, y, radius, 3, -Math.PI / 2), 3.5 * scale);
  drawMarkerCutLine(context, cut, x, y - radius * 0.72, x, y + radius * 0.28, Math.max(2.4, radius * 0.11));
}

function drawMarkerChip(context: CanvasRenderingContext2D, color: string, cut: string, x: number, y: number, size: number, rotation: number, scale: number) {
  drawMarkerFill(context, color, cut, () => {
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.beginPath();
    context.rect(-size * 0.5, -size * 0.5, size, size);
    context.restore();
  }, 3 * scale);
}

function drawMarkerHexCell(context: CanvasRenderingContext2D, color: string, cut: string, x: number, y: number, radius: number, scale: number) {
  drawMarkerStroke(context, color, cut, Math.max(3, radius * 0.14), () => regularPolygonPath(context, x, y, radius, 6, Math.PI / 6), 3.4 * scale);
}

function drawMarkerCutLine(context: CanvasRenderingContext2D, cut: string, x1: number, y1: number, x2: number, y2: number, width: number) {
  context.save();
  context.strokeStyle = cut;
  context.lineWidth = width;
  context.lineCap = "butt";
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
  context.restore();
}

function drawMarkerCutTriangle(context: CanvasRenderingContext2D, cut: string, x: number, y: number, radius: number, rotation = -Math.PI / 2) {
  context.save();
  context.fillStyle = cut;
  regularPolygonPath(context, x, y, radius, 3, rotation);
  context.fill();
  context.restore();
}

function drawMarkerSegmentedDisk(context: CanvasRenderingContext2D, color: string, cut: string, radius: number, segments: number, scale: number) {
  drawMarkerFill(context, color, cut, () => {
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
  }, 4 * scale);
  context.save();
  context.fillStyle = cut;
  context.beginPath();
  context.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
  context.fill();
  context.restore();
  for (let index = 0; index < segments; index += 1) {
    const angle = index * Math.PI * 2 / segments;
    drawMarkerCutLine(context, cut, Math.cos(angle) * radius * 0.18, Math.sin(angle) * radius * 0.18, Math.cos(angle) * radius * 0.92, Math.sin(angle) * radius * 0.92, Math.max(2.4, radius * 0.08));
  }
  drawMarkerRing(context, color, cut, 0, 0, radius * 0.9, 0.1, scale * 0.8);
}

function drawMarkerCrescent(context: CanvasRenderingContext2D, color: string, cut: string, x: number, y: number, radius: number, scale: number) {
  drawMarkerFill(context, color, cut, () => {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
  }, 3.8 * scale);
  context.save();
  context.fillStyle = cut;
  context.beginPath();
  context.arc(x + radius * 0.34, y - radius * 0.08, radius * 0.72, 0, Math.PI * 2);
  context.fill();
  context.restore();
  drawMarkerStroke(context, color, cut, Math.max(2.8, radius * 0.11), () => {
    context.beginPath();
    context.arc(x, y, radius * 0.84, Math.PI * 1.62, Math.PI * 0.28);
  }, 0);
}

function drawMarkerObelisk(context: CanvasRenderingContext2D, color: string, cut: string, radius: number, scale: number) {
  drawMarkerFill(context, color, cut, () => {
    context.beginPath();
    context.moveTo(0, -radius);
    context.lineTo(radius * 0.42, -radius * 0.18);
    context.lineTo(radius * 0.24, radius * 0.88);
    context.lineTo(-radius * 0.24, radius * 0.88);
    context.lineTo(-radius * 0.42, -radius * 0.18);
    context.closePath();
  }, 3.5 * scale);
  drawMarkerCutLine(context, cut, 0, -radius * 0.58, 0, radius * 0.56, Math.max(2.6, radius * 0.08));
}

function drawProjectileMarkers(context: CanvasRenderingContext2D, snapshot: BattleGeometrySnapshot) {
  const tokens = GEOMETRIC_VISUAL_TOKENS;
  const scale = screenStableScale(snapshot);
  for (const projectile of snapshot.projectiles) {
    const progress = clamp(1 - projectile.ttl / Math.max(0.001, projectile.duration), 0, 1);
    const groundX = projectile.x + (projectile.targetX - projectile.x) * progress;
    const groundY = projectile.y + (projectile.targetY - projectile.y) * progress;
    const lift = projectile.trajectory === "ballistic" ? ballisticLift(projectile, progress) : 0;
    const x = groundX;
    const y = groundY - lift;
    const direction = projectileDirection(projectile);
    const angle = Math.atan2(direction.y, direction.x);
    const color = geometricToneColor(projectile.vfxKey || projectile.damageType);
    const size = clamp(Math.max(projectile.projectileWidth ?? 0, projectile.projectileHeight ?? 0) * 0.12, tokens.geometry.projectileRadius, 11) * scale;
    const speedAlpha = clamp((projectile.projectileSpeed ?? 520) / 900, 0.48, 0.9);

    drawGroundShadow(context, groundX, groundY, size * 2.5, size * 0.72, projectile.trajectory === "ballistic" ? 0.18 : 0.1);
    drawProjectileTrail(context, x, y, direction, color, progress, speedAlpha, scale);

    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.globalAlpha = 0.82;
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = 2 * scale;
    regularPolygonPath(context, 0, 0, size, projectileShapeSides(projectile), 0);
    context.fill();
    context.strokeStyle = tokens.color.white;
    context.globalAlpha = 0.34;
    context.stroke();
    context.restore();
  }
  context.globalAlpha = 1;
}

function drawProjectileTrail(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: { x: number; y: number },
  color: string,
  progress: number,
  alpha: number,
  scale: number
) {
  context.save();
  context.strokeStyle = color;
  context.lineWidth = 2 * scale;
  for (let index = 0; index < 4; index += 1) {
    const offset = (10 + index * 9) * scale;
    context.globalAlpha = alpha * (1 - index / 4) * clamp(progress + 0.22, 0.22, 1);
    line(
      context,
      x - direction.x * offset,
      y - direction.y * offset,
      x - direction.x * (offset + 6 * scale),
      y - direction.y * (offset + 6 * scale)
    );
  }
  context.restore();
}

function drawAreaMarkers(context: CanvasRenderingContext2D, snapshot: BattleGeometrySnapshot) {
  for (const area of snapshot.areas) {
    const color = geometricToneColor(area.vfxKey || area.damageType);
    const progress = clamp(1 - area.ttl / Math.max(0.001, area.duration), 0, 1);
    context.save();
    context.globalAlpha = area.warning ? 0.18 + pulse(progress) * 0.18 : 0.16 + (1 - progress) * 0.18;
    context.strokeStyle = color;
    context.lineWidth = 2;

    if (area.kind === "chain" && area.startX !== undefined && area.startY !== undefined && area.endX !== undefined && area.endY !== undefined) {
      context.lineWidth = 2.5;
      line(context, area.startX, area.startY, area.endX, area.endY);
      drawChainNodes(context, area, color, progress);
    } else if (area.x !== undefined && area.y !== undefined) {
      const radius = Math.max(1, area.radius ?? Math.max(area.width ?? 1, area.height ?? 1) * 0.5);
      if (area.kind === "lava-orbit") {
        drawLavaOrbitBody(context, area, radius, color);
      } else if (area.kind === "damage-zone" && area.width !== undefined && area.height !== undefined) {
        drawDamageZoneRect(context, area, color);
      } else if (area.kind === "damage-zone" && skillEffectFamily(area.vfxKey || area.damageType) === "lava_orb") {
        drawLavaOrbZone(context, area, radius, color, progress);
      } else if (area.kind === "melee-arc") {
        drawMeleeArc(context, area, radius, color, progress);
      } else if (area.kind === "passive-aura") {
        drawPassiveAura(context, area, radius, color, progress);
      } else {
        const scale = area.kind === "nova" ? 0.18 + progress * 0.82 : 1;
        ellipse(context, area.x, area.y, radius * scale, radius * 0.42 * scale);
      }
    }

    context.restore();
  }
  context.globalAlpha = 1;
}

function drawHitMarkers(context: CanvasRenderingContext2D, snapshot: BattleGeometrySnapshot) {
  const stableScale = screenStableScale(snapshot);
  for (const hit of snapshot.hits) {
    const color = geometricToneColor(hit.vfxKey || hit.damageType);
    const progress = clamp(1 - hit.ttl / Math.max(0.001, hit.duration), 0, 1);
    const radius = Math.max(18, hit.radius ?? 24) * stableScale;
    const family = skillEffectFamily(hit.vfxKey || hit.damageType);

    context.save();
    context.translate(hit.x, hit.y);
    context.strokeStyle = color;
    context.fillStyle = color;
    context.shadowColor = color;
    if (family === "ice_shards" || family === "frost_nova") {
      drawIceHitMarker(context, radius, color, progress, stableScale);
    } else if (family === "penetrating_shot") {
      drawPierceHitMarker(context, radius, color, progress, stableScale);
    } else if (family === "lightning_chain") {
      drawLightningHitMarker(context, radius, color, progress, stableScale);
    } else if (family === "ground_spike") {
      drawSpikeHitMarker(context, radius, color, progress, stableScale);
    } else if (family === "fungal_petards") {
      drawSporeHitMarker(context, radius, color, progress, stableScale);
    } else if (family === "lava_orb") {
      drawLavaHitMarker(context, radius, color, progress, stableScale);
    } else {
      drawFireHitMarker(context, radius, color, progress, stableScale);
    }
    context.restore();
  }
  context.globalAlpha = 1;
}

type SkillEffectFamily = "fire_bolt" | "ice_shards" | "frost_nova" | "penetrating_shot" | "lightning_chain" | "ground_spike" | "fungal_petards" | "lava_orb";

function skillEffectFamily(token: string | undefined): SkillEffectFamily {
  const value = (token || "").toLowerCase();
  if (value.includes("lava_orb") || value.includes("lava")) return "lava_orb";
  if (value.includes("ice_shards") || value.includes("ice")) return "ice_shards";
  if (value.includes("frost_nova") || value.includes("frost")) return "frost_nova";
  if (value.includes("penetrating_shot") || value.includes("pierce")) return "penetrating_shot";
  if (value.includes("lightning_chain") || value.includes("lightning")) return "lightning_chain";
  if (value.includes("ground_spike") || value.includes("puncture") || value.includes("spike")) return "ground_spike";
  if (value.includes("fungal") || value.includes("spore")) return "fungal_petards";
  return "fire_bolt";
}

function drawFireHitMarker(context: CanvasRenderingContext2D, radius: number, color: string, progress: number, scale: number) {
  const burstRadius = radius * (0.78 + progress * 1.55);
  context.shadowBlur = 20 * scale;
  context.lineWidth = 5 * scale;
  context.globalAlpha = Math.max(0, 0.86 - progress * 0.62);
  ellipse(context, 0, 0, burstRadius * 1.22, burstRadius * 0.58);
  context.stroke();
  context.globalAlpha = Math.max(0, 0.30 - progress * 0.18);
  ellipse(context, 0, 0, burstRadius * 0.82, burstRadius * 0.38);
  context.fill();
  context.shadowBlur = 0;
  context.lineWidth = 3 * scale;
  context.globalAlpha = Math.max(0, 0.9 - progress * 0.7);
  for (let index = 0; index < 12; index += 1) {
    const angle = index * Math.PI / 6 + progress * 0.85;
    const inner = burstRadius * 0.2;
    const outer = burstRadius * (0.82 + (index % 2) * 0.18);
    line(context, Math.cos(angle) * inner, Math.sin(angle) * inner * 0.55, Math.cos(angle) * outer, Math.sin(angle) * outer * 0.55);
  }
}

function drawIceHitMarker(context: CanvasRenderingContext2D, radius: number, color: string, progress: number, scale: number) {
  const shardRadius = radius * (0.85 + progress * 1.15);
  context.shadowBlur = 12 * scale;
  context.lineWidth = 3 * scale;
  context.globalAlpha = Math.max(0, 0.92 - progress * 0.72);
  for (let index = 0; index < 8; index += 1) {
    const angle = index * Math.PI / 4 - progress * 0.35;
    const inner = shardRadius * 0.15;
    const outer = shardRadius * (0.88 + (index % 2) * 0.22);
    line(context, Math.cos(angle) * inner, Math.sin(angle) * inner * 0.58, Math.cos(angle) * outer, Math.sin(angle) * outer * 0.58);
    regularPolygonPath(context, Math.cos(angle) * outer, Math.sin(angle) * outer * 0.58, 4 * scale, 3, angle);
    context.fill();
  }
  context.globalAlpha = Math.max(0, 0.46 - progress * 0.26);
  context.lineWidth = 2 * scale;
  regularPolygonPath(context, 0, 0, shardRadius * 0.62, 8, Math.PI / 8);
  context.stroke();
}

function drawPierceHitMarker(context: CanvasRenderingContext2D, radius: number, color: string, progress: number, scale: number) {
  context.shadowBlur = 10 * scale;
  context.lineWidth = 4 * scale;
  context.globalAlpha = Math.max(0, 0.9 - progress * 0.72);
  for (let index = -2; index <= 2; index += 1) {
    const y = index * 5 * scale;
    const start = -radius * (1.1 + progress * 0.4);
    const end = radius * (1.4 + progress * 0.7);
    line(context, start, y, end, y - radius * 0.22);
  }
  context.globalAlpha = Math.max(0, 0.34 - progress * 0.22);
  ellipse(context, 0, 0, radius * (1.25 + progress), radius * 0.26);
  context.fill();
}

function drawLightningHitMarker(context: CanvasRenderingContext2D, radius: number, color: string, progress: number, scale: number) {
  context.shadowBlur = 18 * scale;
  context.lineWidth = 3 * scale;
  context.globalAlpha = Math.max(0, 0.95 - progress * 0.76);
  for (let branch = 0; branch < 4; branch += 1) {
    const angle = branch * Math.PI / 2 + progress * 0.4;
    let x = 0;
    let y = 0;
    for (let step = 1; step <= 4; step += 1) {
      const dist = radius * (0.22 + step * 0.24);
      const jitter = ((step % 2 === 0 ? 1 : -1) * radius * 0.14);
      const nextX = Math.cos(angle) * dist + Math.cos(angle + Math.PI / 2) * jitter;
      const nextY = (Math.sin(angle) * dist + Math.sin(angle + Math.PI / 2) * jitter) * 0.58;
      line(context, x, y, nextX, nextY);
      x = nextX;
      y = nextY;
    }
  }
  context.globalAlpha = Math.max(0, 0.52 - progress * 0.34);
  regularPolygonPath(context, 0, 0, radius * 0.42, 4, Math.PI / 4);
  context.fill();
}

function drawSpikeHitMarker(context: CanvasRenderingContext2D, radius: number, color: string, progress: number, scale: number) {
  context.shadowBlur = 10 * scale;
  context.lineWidth = 3 * scale;
  context.globalAlpha = Math.max(0, 0.88 - progress * 0.66);
  for (let index = -2; index <= 2; index += 1) {
    const height = radius * (0.74 + (2 - Math.abs(index)) * 0.18) * (1 - progress * 0.28);
    const x = index * radius * 0.24;
    context.beginPath();
    context.moveTo(x - 5 * scale, radius * 0.24);
    context.lineTo(x, -height);
    context.lineTo(x + 5 * scale, radius * 0.24);
    context.closePath();
    context.fill();
    context.stroke();
  }
  context.globalAlpha = Math.max(0, 0.26 - progress * 0.16);
  ellipse(context, 0, radius * 0.2, radius * 1.05, radius * 0.24);
  context.fill();
}

function drawSporeHitMarker(context: CanvasRenderingContext2D, radius: number, color: string, progress: number, scale: number) {
  context.shadowBlur = 14 * scale;
  context.globalAlpha = Math.max(0, 0.72 - progress * 0.5);
  for (let index = 0; index < 9; index += 1) {
    const angle = index * Math.PI * 2 / 9 + 0.5;
    const dist = radius * (0.18 + (index % 3) * 0.18 + progress * 0.74);
    const dot = radius * (0.13 + (index % 2) * 0.04) * (1 - progress * 0.35);
    ellipse(context, Math.cos(angle) * dist, Math.sin(angle) * dist * 0.6, dot, dot * 0.7);
    context.fill();
  }
  context.lineWidth = 2 * scale;
  context.globalAlpha = Math.max(0, 0.42 - progress * 0.3);
  ellipse(context, 0, 0, radius * (0.72 + progress * 0.8), radius * (0.34 + progress * 0.36));
  context.stroke();
}

function drawLavaHitMarker(context: CanvasRenderingContext2D, radius: number, color: string, progress: number, scale: number) {
  const ringRadius = radius * (0.95 + progress * 1.05);
  context.shadowBlur = 22 * scale;
  context.lineWidth = 6 * scale;
  context.globalAlpha = Math.max(0, 0.92 - progress * 0.72);
  ellipse(context, 0, 0, ringRadius * 1.18, ringRadius * 0.54);
  context.stroke();
  context.globalAlpha = Math.max(0, 0.5 - progress * 0.34);
  regularPolygonPath(context, 0, 0, ringRadius * 0.36, 6, progress * 1.8);
  context.fill();
  context.shadowBlur = 0;
  context.lineWidth = 3 * scale;
  for (let index = 0; index < 6; index += 1) {
    const angle = index * Math.PI / 3 + progress * 1.4;
    const x = Math.cos(angle) * ringRadius * 0.72;
    const y = Math.sin(angle) * ringRadius * 0.42;
    regularPolygonPath(context, x, y, 5 * scale, 5, angle);
    context.fill();
  }
}

function drawLavaOrbZone(context: CanvasRenderingContext2D, area: BattleGeometryArea, radius: number, color: string, progress: number) {
  if (area.x === undefined || area.y === undefined) return;
  context.save();
  context.translate(area.x, area.y);
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = 4;
  context.shadowColor = color;
  context.shadowBlur = 16;
  context.globalAlpha = 0.72;
  ellipse(context, 0, 0, radius * 0.92, radius * 0.42);
  context.stroke();
  context.globalAlpha = 0.22;
  ellipse(context, 0, 0, radius * 0.62, radius * 0.28);
  context.fill();
  context.shadowBlur = 0;
  context.globalAlpha = 0.92;
  regularPolygonPath(context, 0, 0, Math.max(8, radius * 0.24), 6, progress * Math.PI * 2);
  context.fill();
  for (let index = 0; index < 5; index += 1) {
    const angle = index * Math.PI * 2 / 5 + progress * Math.PI * 2;
    regularPolygonPath(context, Math.cos(angle) * radius * 0.62, Math.sin(angle) * radius * 0.28, Math.max(3, radius * 0.08), 5, angle);
    context.fill();
  }
  context.restore();
}

function drawLavaOrbitBody(context: CanvasRenderingContext2D, area: BattleGeometryArea, radius: number, color: string) {
  if (area.x === undefined || area.y === undefined) return;
  const scale = 1;
  const orbCount = Math.max(1, Math.round(area.orbCount ?? 1));
  const elapsedMs = area.elapsedMs ?? 0;
  const speed = area.orbitSpeedDegPerSec ?? 0;
  const startAngle = area.startAngleDeg ?? -90;
  const damageRadius = Math.max(18, area.damageRadius ?? 52);
  const ringWidth = Math.max(8, area.ringWidth ?? 20);

  context.save();
  context.translate(area.x, area.y);
  context.strokeStyle = color;
  context.fillStyle = color;
  context.shadowColor = color;

  context.globalAlpha = 0.28;
  context.lineWidth = ringWidth * 0.28;
  ellipse(context, 0, 0, radius, radius * 0.44);
  context.stroke();

  context.globalAlpha = 0.9;
  context.lineWidth = 4 * scale;
  for (let orbIndex = 0; orbIndex < orbCount; orbIndex += 1) {
    const angle = (startAngle + (360 / orbCount) * orbIndex + speed * (elapsedMs / 1000)) * Math.PI / 180;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.44;
    context.save();
    context.translate(x, y);
    context.rotate(angle + elapsedMs / 260);
    context.shadowBlur = 22;
    context.globalAlpha = 0.32;
    ellipse(context, 0, 0, damageRadius * 1.15, damageRadius * 0.5);
    context.fill();
    context.globalAlpha = 0.96;
    context.shadowBlur = 18;
    regularPolygonPath(context, 0, 0, damageRadius * 0.44, 6, Math.PI / 6);
    context.fill();
    context.shadowBlur = 0;
    context.strokeStyle = "rgba(255, 236, 164, 0.92)";
    context.lineWidth = 3;
    regularPolygonPath(context, 0, 0, damageRadius * 0.44, 6, Math.PI / 6);
    context.stroke();
    context.fillStyle = "rgba(42, 31, 19, 0.82)";
    regularPolygonPath(context, 0, 0, damageRadius * 0.18, 6, 0);
    context.fill();
    context.fillStyle = color;
    context.globalAlpha = 0.9;
    for (let chip = 0; chip < 5; chip += 1) {
      const chipAngle = chip * Math.PI * 2 / 5 - elapsedMs / 380;
      regularPolygonPath(context, Math.cos(chipAngle) * damageRadius * 0.67, Math.sin(chipAngle) * damageRadius * 0.35, 4.5, 5, chipAngle);
      context.fill();
    }
    context.restore();
  }
  context.restore();
}

function drawFloatingTexts(context: CanvasRenderingContext2D, snapshot: BattleGeometrySnapshot) {
  const tokens = GEOMETRIC_VISUAL_TOKENS;
  const scale = screenStableScale(snapshot);
  context.save();
  context.textAlign = "center";
  context.textBaseline = "middle";
  for (const item of snapshot.texts) {
    const progress = clamp(1 - item.ttl / Math.max(0.001, item.duration), 0, 1);
    const alpha = clamp(item.ttl / Math.max(0.001, item.duration), 0, 1);
    const pop = 1 + Math.sin((1 - Math.min(progress, 0.34) / 0.34) * Math.PI) * 0.22;
    const fontSize = Math.max(18, tokens.font.number * 1.95) * scale * pop;
    const color = geometricToneColor(item.damageType);
    const y = item.y - progress * 34 * scale;
    context.font = `900 ${fontSize}px ${tokens.font.family}`;
    context.globalAlpha = alpha;
    context.lineWidth = Math.max(3, fontSize * 0.18);
    context.strokeStyle = "rgba(18, 10, 7, 0.86)";
    context.strokeText(item.text, item.x, y);
    context.shadowColor = color;
    context.shadowBlur = 8 * scale;
    context.fillStyle = color;
    context.fillText(item.text, item.x, y);
    context.shadowBlur = 0;
  }
  context.restore();
}

function drawDamageZoneRect(context: CanvasRenderingContext2D, area: BattleGeometryArea, color: string) {
  if (area.x === undefined || area.y === undefined || area.width === undefined || area.height === undefined) return;
  const direction = normalizedDirection(area.directionX ?? 1, area.directionY ?? 0);
  const angle = Math.atan2(direction.y, direction.x);
  context.save();
  context.translate(area.x, area.y);
  context.rotate(angle);
  context.strokeStyle = color;
  context.strokeRect(0, -area.height * 0.5, area.width, area.height);
  context.restore();
}

function drawMeleeArc(context: CanvasRenderingContext2D, area: BattleGeometryArea, radius: number, color: string, progress: number) {
  if (area.x === undefined || area.y === undefined) return;
  const direction = normalizedDirection(area.directionX ?? 1, area.directionY ?? 0);
  const angle = Math.atan2(direction.y, direction.x);
  const arc = (area.arcAngle ?? 90) * Math.PI / 180;
  context.save();
  context.translate(area.x, area.y);
  context.rotate(angle);
  context.scale(1, 0.42);
  context.beginPath();
  context.arc(0, 0, radius * (0.82 + progress * 0.18), -arc * 0.5, arc * 0.5);
  context.strokeStyle = color;
  context.lineWidth = 3;
  context.stroke();
  context.restore();
}

function drawPassiveAura(context: CanvasRenderingContext2D, area: BattleGeometryArea, radius: number, color: string, progress: number) {
  if (area.x === undefined || area.y === undefined) return;
  context.save();
  context.strokeStyle = color;
  context.globalAlpha *= 0.62;
  ellipse(context, area.x, area.y, radius * (0.92 + pulse(progress) * 0.08), radius * 0.36);
  context.globalAlpha *= 0.64;
  regularPolygonPath(context, area.x, area.y, radius * 0.34, 6, progress * Math.PI);
  context.stroke();
  context.restore();
}

function drawChainNodes(context: CanvasRenderingContext2D, area: BattleGeometryArea, color: string, progress: number) {
  if (area.startX === undefined || area.startY === undefined || area.endX === undefined || area.endY === undefined) return;
  context.fillStyle = color;
  context.globalAlpha *= 0.78;
  for (const t of [0, 0.5, 1]) {
    const x = area.startX + (area.endX - area.startX) * t;
    const y = area.startY + (area.endY - area.startY) * t;
    regularPolygonPath(context, x, y, 4 + pulse(progress + t) * 2, 4, Math.PI / 4);
    context.fill();
  }
}

function drawHealthArc(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  hp: number,
  maxHp: number,
  tier: MonsterGeometryTier,
  encounterColor: string,
  alpha = 0.72,
  scale = 1
) {
  const ratio = clamp(hp / Math.max(1, maxHp), 0, 1);
  const hasRarityBorder = tier === "magic" || tier === "rare";
  const start = Math.PI * 0.15;
  const end = Math.PI * 0.85;
  const healthEnd = Math.PI * (0.15 + 0.7 * ratio);

  context.save();
  context.globalAlpha = alpha;
  context.lineCap = "round";
  if (hasRarityBorder) {
    context.strokeStyle = "rgba(5, 7, 11, 0.96)";
    context.lineWidth = 12 * scale;
    context.beginPath();
    context.arc(x, y, radius, start, end);
    context.stroke();
    context.strokeStyle = encounterColor;
    context.lineWidth = (tier === "rare" ? 10.2 : 9.2) * scale;
    context.beginPath();
    context.arc(x, y, radius, start, end);
    context.stroke();
    if (tier === "rare") {
      context.strokeStyle = "rgba(5, 7, 11, 0.82)";
      context.lineWidth = 2.2 * scale;
      context.beginPath();
      context.arc(x, y, radius + 4.8 * scale, start, end);
      context.stroke();
      context.strokeStyle = encounterColor;
      context.lineWidth = 2.2 * scale;
      context.beginPath();
      context.arc(x, y, radius + 7.2 * scale, start, end);
      context.stroke();
    }
  }
  context.strokeStyle = "rgba(5, 7, 11, 0.88)";
  context.lineWidth = 6.4 * scale;
  context.beginPath();
  context.arc(x, y, radius, start, end);
  context.stroke();
  context.strokeStyle = "#D71F2A";
  context.lineWidth = 4.8 * scale;
  context.beginPath();
  context.arc(x, y, radius, start, healthEnd);
  context.stroke();
  context.restore();
}

function drawGroundShadow(context: CanvasRenderingContext2D, x: number, y: number, radiusX: number, radiusY: number, alpha: number) {
  context.save();
  context.globalAlpha = alpha;
  context.fillStyle = "rgba(0, 0, 0, 0.36)";
  context.beginPath();
  context.ellipse(x, y + radiusY * 0.32, radiusX, radiusY, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawMonsterRarityPedestal(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  tier: MonsterGeometryTier,
  encounterColor: string,
  scale: number,
  alpha: number
) {
  const rules: Record<MonsterGeometryTier, { opacity: number; scale: number; width: number; shape: "shadow" | "diamond" | "hexagon" }> = {
    normal: { opacity: 0.16, scale: 0.72, width: 1, shape: "shadow" },
    magic: { opacity: 0.82, scale: 0.82, width: 2.4, shape: "diamond" },
    rare: { opacity: 0.9, scale: 0.95, width: 3.2, shape: "hexagon" },
    boss: { opacity: 0.92, scale: 1.15, width: 4, shape: "hexagon" }
  };
  const rule = rules[tier];
  const pedestalX = radius * rule.scale;
  const pedestalY = pedestalX * 0.34;
  const baseY = y + radius * 1.0;

  context.save();
  context.globalAlpha = alpha * rule.opacity;
  context.strokeStyle = encounterColor;
  context.fillStyle = encounterColor;
  context.lineWidth = rule.width * scale;
  if (rule.shape === "shadow") {
    context.beginPath();
    context.ellipse(x, baseY, pedestalX, pedestalY, 0, 0, Math.PI * 2);
    context.fill();
  } else if (rule.shape === "diamond") {
    context.beginPath();
    context.moveTo(x, baseY - pedestalY);
    context.lineTo(x + pedestalX, baseY);
    context.lineTo(x, baseY + pedestalY);
    context.lineTo(x - pedestalX, baseY);
    context.closePath();
    context.stroke();
  } else {
    const outer = tier === "boss" ? 1.18 : 1;
    flatHexPath(context, x, baseY, pedestalX * outer, pedestalY * outer);
    context.stroke();
    if (tier === "boss") {
      context.globalAlpha = alpha * 0.22;
      flatHexPath(context, x, baseY, pedestalX * 1.38, pedestalY * 1.38);
      context.stroke();
    }
  }
  context.restore();
}

function flatHexPath(context: CanvasRenderingContext2D, x: number, y: number, radiusX: number, radiusY: number) {
  context.beginPath();
  context.moveTo(x - radiusX, y);
  context.lineTo(x - radiusX * 0.5, y - radiusY);
  context.lineTo(x + radiusX * 0.5, y - radiusY);
  context.lineTo(x + radiusX, y);
  context.lineTo(x + radiusX * 0.5, y + radiusY);
  context.lineTo(x - radiusX * 0.5, y + radiusY);
  context.closePath();
}

function compareBattleEntityMarkerOrder(
  left: { kind: "enemy"; x: number; y: number; enemy: BattleGeometryEnemy } | { kind: "player"; x: number; y: number },
  right: { kind: "enemy"; x: number; y: number; enemy: BattleGeometryEnemy } | { kind: "player"; x: number; y: number }
) {
  const depth = dimetricDepth(left.x, left.y) - dimetricDepth(right.x, right.y);
  if (left.kind === "enemy" && right.kind === "enemy") {
    const rarity = enemyRarityRank(left.enemy) - enemyRarityRank(right.enemy);
    if (rarity !== 0) return rarity;
    return depth || left.enemy.id - right.enemy.id;
  }
  if (Math.abs(depth) > 28) return depth;
  return entityRarityRank(left) - entityRarityRank(right);
}

function entityRarityRank(entity: { kind: "enemy"; enemy: BattleGeometryEnemy } | { kind: "player" }) {
  if (entity.kind === "player") return 2;
  return enemyRarityRank(entity.enemy);
}

function enemyRarityRank(enemy: BattleGeometryEnemy) {
  const visual = resolveMonsterGeometryVisual(enemy.monsterId);
  const tier = visual?.tier ?? (enemy.boss ? "boss" : "normal");
  if (tier === "boss") return 4;
  if (tier === "rare") return 3;
  if (tier === "magic") return 1;
  return 0;
}

function line(context: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
}

function ellipse(context: CanvasRenderingContext2D, x: number, y: number, radiusX: number, radiusY: number) {
  context.beginPath();
  context.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
  context.stroke();
}

function circlePath(context: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
}

function fillCircle(context: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  const previous = context.fillStyle;
  circlePath(context, x, y, radius);
  context.fillStyle = color;
  context.fill();
  context.fillStyle = previous;
}

function diamondPath(context: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  context.beginPath();
  context.moveTo(x, y - radius);
  context.lineTo(x + radius, y);
  context.lineTo(x, y + radius);
  context.lineTo(x - radius, y);
  context.closePath();
}

function drawCornerTicks(context: CanvasRenderingContext2D, radius: number) {
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      line(context, sx * radius * 0.58, sy * radius * 0.58, sx * radius * 0.86, sy * radius * 0.86);
    }
  }
}

function drawRadialSpikes(context: CanvasRenderingContext2D, radius: number, count: number) {
  for (let index = 0; index < count; index += 1) {
    const angle = index * Math.PI * 2 / count;
    line(
      context,
      Math.cos(angle) * radius * 0.66,
      Math.sin(angle) * radius * 0.66,
      Math.cos(angle) * radius * 1.04,
      Math.sin(angle) * radius * 1.04
    );
  }
}

function regularPolygonPath(context: CanvasRenderingContext2D, x: number, y: number, radius: number, sides: number, rotation = 0) {
  context.beginPath();
  for (let index = 0; index < sides; index += 1) {
    const angle = rotation + index * Math.PI * 2 / sides;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (index === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  }
  context.closePath();
}

function dimetricDepth(x: number, y: number) {
  return x + y;
}

function enemyFacingRotation(enemy: BattleGeometryEnemy, snapshot: BattleGeometrySnapshot) {
  if (enemy.runtimeTier === "aware" || enemy.runtimeTier === "active" || enemy.boss) {
    const angleToPlayer = Math.atan2(snapshot.player.y - enemy.y, snapshot.player.x - enemy.x);
    return angleToPlayer + Math.PI / 2;
  }
  return stableInitialEnemyRotation(enemy.id, enemy.monsterId);
}

function stableInitialEnemyRotation(enemyId: number, monsterId?: string) {
  let hash = Math.imul(enemyId || 1, 2654435761);
  for (let index = 0; index < (monsterId?.length ?? 0); index += 1) {
    hash = Math.imul(hash ^ monsterId!.charCodeAt(index), 2246822519);
  }
  return ((hash >>> 0) / 4294967296) * Math.PI * 2;
}

function projectileDirection(projectile: BattleGeometryProjectile) {
  const vx = typeof projectile.velocityX === "number" ? projectile.velocityX : projectile.directionX ?? projectile.targetX - projectile.x;
  const vy = typeof projectile.velocityY === "number" ? projectile.velocityY : projectile.directionY ?? projectile.targetY - projectile.y;
  const length = Math.hypot(vx, vy) || 1;
  return { x: vx / length, y: vy / length };
}

function projectileShapeSides(projectile: BattleGeometryProjectile) {
  const token = `${projectile.vfxKey ?? ""} ${projectile.damageType ?? ""}`.toLowerCase();
  if (token.includes("ice") || token.includes("cold") || token.includes("frost")) return 4;
  if (token.includes("lightning")) return 3;
  if (token.includes("penetrating")) return 6;
  return 3;
}

function resolvePlayerRotation(canvas: HTMLCanvasElement, snapshot: BattleGeometrySnapshot, frameTimeMs: number) {
  const previous = PLAYER_ROTATION_BY_CANVAS.get(canvas);
  const rotationSpeed = snapshot.player.moving
    ? PLAYER_MOVING_ROTATION_RADIANS_PER_SECOND
    : PLAYER_IDLE_ROTATION_RADIANS_PER_SECOND;

  if (!previous || frameTimeMs < previous.frameTimeMs) {
    const rotation = PLAYER_INITIAL_ROTATION_RADIANS;
    PLAYER_ROTATION_BY_CANVAS.set(canvas, { frameTimeMs, rotation });
    return rotation;
  }

  const deltaSeconds = Math.min((frameTimeMs - previous.frameTimeMs) / 1000, 0.05);
  const rotation = previous.rotation + deltaSeconds * rotationSpeed;
  PLAYER_ROTATION_BY_CANVAS.set(canvas, { frameTimeMs, rotation });
  return rotation;
}

function ballisticLift(projectile: BattleGeometryProjectile, progress: number) {
  return Math.max(0, projectile.arcHeight ?? 0) * 1.75 * 4 * progress * (1 - progress);
}

function normalizedDirection(x: number, y: number) {
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
}

function pulse(progress: number) {
  return 0.5 + Math.sin(progress * Math.PI * 2) * 0.5;
}

function screenStableScale(snapshot: BattleGeometrySnapshot) {
  return clamp(1 / Math.max(0.12, snapshot.camera.zoom || 1), 1, 5.4);
}

function applyWorldCameraTransform(context: CanvasRenderingContext2D, width: number, height: number, snapshot: BattleGeometrySnapshot) {
  context.translate(width * 0.5, height * 0.54);
  context.scale(snapshot.camera.zoom, snapshot.camera.zoom);
  context.translate(-snapshot.camera.screenX, -snapshot.camera.screenY);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
