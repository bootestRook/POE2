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
  lastDamagedAt?: number;
  monsterId?: string;
  spawnRarity?: MonsterGeometryTier;
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
  projectileVisualMode?: string;
  projectileWidth?: number;
  projectileHeight?: number;
  splitProjectile?: boolean;
  projectileSpeed?: number;
  damageType?: string;
  vfxKey?: string;
  ttl: number;
  duration: number;
  fadeDuration?: number;
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
  vfxScale?: number;
  warning?: boolean;
  hitAtMs?: number;
  tickProgress?: number;
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
  shapeEffects?: ReadonlyArray<string>;
  ttl: number;
  duration: number;
};

export type BattleGeometryText = {
  id: number;
  x: number;
  y: number;
  text: string;
  damageType?: string;
  critical?: boolean;
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
    guardActive?: boolean;
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
  drawAreaMarkers(context, snapshot, "under-entities");
  drawProjectileMarkers(context, snapshot);
  drawBattleEntityMarkers(context, snapshot, playerRotation);
  drawAreaMarkers(context, snapshot, "over-entities");
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
  const guardActive = Boolean(snapshot.player.guardActive);
  const guardPulse = 0.5 + 0.5 * Math.sin(snapshot.timeMs / 140);

  context.save();
  context.translate(x, y);
  context.rotate(rotation);

  if (guardActive) {
    context.save();
    context.shadowColor = "rgba(255, 210, 64, 0.95)";
    context.shadowBlur = 18 * scale;
    context.strokeStyle = "rgba(255, 218, 74, 0.88)";
    context.lineWidth = (5 + guardPulse * 1.4) * scale;
    regularPolygonPath(context, 0, 0, radius * (1.28 + guardPulse * 0.08), 3, 0);
    context.stroke();
    context.restore();
  }

  context.fillStyle = tokens.color.white;
  context.strokeStyle = guardActive ? "rgba(255, 218, 74, 0.98)" : tokens.color.blue;
  context.lineWidth = (guardActive ? 4.5 : 3) * scale;
  regularPolygonPath(context, 0, 0, radius, 3, 0);
  context.fill();
  context.stroke();

  context.fillStyle = guardActive ? "#FFE690" : tokens.color.blue;
  circlePath(context, 0, 0, 4.5 * scale);
  context.fill();
  context.restore();
}

function drawEnemyMarker(context: CanvasRenderingContext2D, enemy: BattleGeometryEnemy, snapshot: BattleGeometrySnapshot) {
  const tokens = GEOMETRIC_VISUAL_TOKENS;
  const scale = screenStableScale(snapshot);
  const visual = resolveMonsterGeometryVisual(enemy.monsterId);
  const tier = resolveEnemyGeometryTier(enemy);
  const elite = tier === "rare" || enemy.monsterId === "enemy_brute" || enemy.boss;
  const radius = visual ? visual.sizePx * 0.5 * scale : (enemy.boss ? tokens.geometry.bossRadius : elite ? tokens.geometry.eliteRadius : tokens.geometry.enemyRadius) * scale;
  const baseFill = enemy.visualPrimaryColor ?? visual?.primaryColor ?? (elite ? tokens.color.orange : tokens.color.gray);
  const damageFlash = enemyDamageFlash(snapshot, enemy);
  const fill = damageFlash > 0 ? mixColor(baseFill, "#FFFFFF", damageFlash) : baseFill;
  const rarityColor = monsterRarityColor(tier);
  const accent = damageFlash > 0 ? mixColor("#05070B", "#FFFFFF", damageFlash * 0.86) : "#05070B";
  const alpha = enemy.runtimeTier === "dormant" ? 0.34 : 0.88;
  const facingRotation = enemyFacingRotation(enemy, snapshot);

  drawMonsterRarityPedestal(context, enemy.x, enemy.y, radius, tier, rarityColor, scale, alpha);
  drawGroundShadow(context, enemy.x, enemy.y, radius * 1.65, radius * 0.46, alpha * 0.34);
  context.save();
  context.translate(enemy.x, enemy.y);
  context.rotate(facingRotation);
  context.fillStyle = fill;
  context.globalAlpha = alpha;
  if (damageFlash > 0) {
    context.shadowColor = "rgba(255, 255, 255, 0.95)";
    context.shadowBlur = (10 + damageFlash * 22) * scale;
  }
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
    drawHealthArc(context, enemy.x, enemy.y, radius + 6 * scale, enemy.hp, enemy.maxHp, tier, rarityColor, 0.92, scale);
  }
}

function resolveEnemyGeometryTier(enemy: BattleGeometryEnemy): MonsterGeometryTier {
  if (enemy.spawnRarity) return enemy.spawnRarity;
  const visual = resolveMonsterGeometryVisual(enemy.monsterId);
  return visual?.tier ?? (enemy.boss ? "boss" : enemy.monsterId === "enemy_brute" ? "rare" : "normal");
}

function enemyDamageFlash(snapshot: BattleGeometrySnapshot, enemy: BattleGeometryEnemy) {
  if (enemy.lastDamagedAt === undefined) return 0;
  const ageSeconds = snapshot.timeMs / 1000 - enemy.lastDamagedAt;
  if (ageSeconds < 0 || ageSeconds > 0.18) return 0;
  return 1 - smoothstep(0.02, 0.18, ageSeconds);
}

function mixColor(from: string, to: string, amount: number) {
  const left = parseHexColor(from);
  const right = parseHexColor(to);
  if (!left || !right) return amount >= 0.5 ? to : from;
  const t = clamp(amount, 0, 1);
  const r = Math.round(left.r + (right.r - left.r) * t);
  const g = Math.round(left.g + (right.g - left.g) * t);
  const b = Math.round(left.b + (right.b - left.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function parseHexColor(color: string) {
  const value = color.trim();
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value);
  if (!match) return null;
  const hex = match[1];
  const normalized = hex.length === 3
    ? hex.split("").map((char) => `${char}${char}`).join("")
    : hex;
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16)
  };
}

function monsterRarityColor(tier: MonsterGeometryTier) {
  const tokens = GEOMETRIC_VISUAL_TOKENS;
  if (tier === "boss") return tokens.color.danger;
  if (tier === "rare") return tokens.color.orange;
  if (tier === "magic") return tokens.color.blue;
  return tokens.color.gray;
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
    const fadeDuration = Math.max(0, projectile.fadeDuration ?? 0);
    const aliveRemaining = Math.max(0, projectile.ttl - fadeDuration);
    const progress = clamp(1 - aliveRemaining / Math.max(0.001, projectile.duration), 0, 1);
    const fadeAlpha = fadeDuration > 0 && projectile.ttl <= fadeDuration
      ? clamp(projectile.ttl / fadeDuration, 0, 1)
      : 1;
    if (fadeAlpha <= 0.02) continue;
    const groundX = projectile.projectileVisualMode === "falling_arrow"
      ? projectile.targetX
      : projectile.x + (projectile.targetX - projectile.x) * progress;
    const groundY = projectile.projectileVisualMode === "falling_arrow"
      ? projectile.targetY
      : projectile.y + (projectile.targetY - projectile.y) * progress;
    const lift = projectile.projectileVisualMode === "falling_arrow"
      ? Math.max(0, projectile.arcHeight ?? 0) * 2.8 * (1 - progress)
      : projectile.trajectory === "ballistic" ? ballisticLift(projectile, progress) : 0;
    const x = groundX;
    const y = groundY - lift;
    const direction = projectileDirection(projectile);
    const angle = Math.atan2(direction.y, direction.x);
    const color = geometricToneColor(projectile.vfxKey || projectile.damageType);
    const family = skillEffectFamily(projectile.vfxKey || projectile.damageType);
    const size = clamp(Math.max(projectile.projectileWidth ?? 0, projectile.projectileHeight ?? 0) * 0.12, tokens.geometry.projectileRadius, 11) * scale;
    const speedAlpha = clamp((projectile.projectileSpeed ?? 520) / 900, 0.48, 0.9) * fadeAlpha;

    drawGroundShadow(context, groundX, groundY, size * 2.5, size * 0.72, (projectile.trajectory === "ballistic" ? 0.18 : 0.1) * fadeAlpha);
    if (family === "corrosive_shot") {
      drawCorrosiveProjectileTrail(context, x, y, direction, progress, speedAlpha, scale);
      drawCorrosiveProjectileSphere(context, x, y, size, progress, scale);
      continue;
    }
    if (family === "lightning_shot") {
      drawLightningShotProjectile(context, x, y, direction, size, progress, scale);
      continue;
    }
    if (family === "split_firebolt") {
      drawSplitFireboltProjectile(context, x, y, direction, size, progress, speedAlpha, scale, projectile.splitProjectile);
      continue;
    }
    if (family === "burning_shot") {
      drawBurningShotProjectile(context, x, y, direction, size, progress, speedAlpha, scale);
      continue;
    }
    if (family === "sparkle") {
      drawSparkleProjectile(context, x, y, direction, size, progress, speedAlpha, scale);
      continue;
    }
    drawProjectileTrail(context, x, y, direction, color, progress, speedAlpha, scale);

    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.globalAlpha = 0.82 * fadeAlpha;
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = 2 * scale;
    regularPolygonPath(context, 0, 0, size, projectileShapeSides(projectile), 0);
    context.fill();
    context.strokeStyle = tokens.color.white;
    context.globalAlpha = 0.34 * fadeAlpha;
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

function drawBurningShotProjectile(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: { x: number; y: number },
  size: number,
  progress: number,
  alpha: number,
  scale: number
) {
  const angle = Math.atan2(direction.y, direction.x);
  const length = Math.max(34 * scale, size * 5.2);
  const shaftWidth = Math.max(2.4 * scale, size * 0.32);
  const flamePulse = 0.74 + pulse(progress * 2.2) * 0.26;

  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.globalAlpha = alpha;

  const trail = context.createLinearGradient(-length * 0.92, 0, -length * 0.1, 0);
  trail.addColorStop(0, "rgba(180, 20, 0, 0)");
  trail.addColorStop(0.38, "rgba(255, 59, 0, 0.22)");
  trail.addColorStop(0.74, "rgba(255, 126, 15, 0.58)");
  trail.addColorStop(1, "rgba(255, 225, 87, 0.82)");
  context.strokeStyle = trail;
  context.lineWidth = shaftWidth * 3.2;
  context.shadowColor = "rgba(255, 73, 0, 0.72)";
  context.shadowBlur = 14 * scale;
  line(context, -length * 0.88, 0, -length * 0.18, 0);
  context.globalAlpha = alpha * 0.42 * flamePulse;
  context.lineWidth = shaftWidth * 1.6;
  line(context, -length * 0.72, -size * 0.24, -length * 0.22, -size * 0.06);
  line(context, -length * 0.68, size * 0.24, -length * 0.2, size * 0.06);

  context.globalAlpha = alpha * 0.94;
  context.strokeStyle = "rgba(255, 139, 32, 0.98)";
  context.lineWidth = shaftWidth;
  context.shadowColor = "rgba(255, 121, 19, 0.92)";
  context.shadowBlur = 10 * scale;
  line(context, -length * 0.28, 0, length * 0.36, 0);

  context.fillStyle = "rgba(255, 247, 184, 0.98)";
  context.strokeStyle = "rgba(255, 91, 0, 0.96)";
  context.lineWidth = Math.max(1.2 * scale, shaftWidth * 0.36);
  context.beginPath();
  context.moveTo(length * 0.56, 0);
  context.lineTo(length * 0.2, -size * 0.54);
  context.lineTo(length * 0.31, -size * 0.08);
  context.lineTo(-length * 0.02, -size * 0.08);
  context.lineTo(-length * 0.02, size * 0.08);
  context.lineTo(length * 0.31, size * 0.08);
  context.lineTo(length * 0.2, size * 0.54);
  context.closePath();
  context.fill();
  context.stroke();

  context.globalAlpha = alpha * 0.78;
  context.fillStyle = "rgba(255, 255, 245, 0.94)";
  circlePath(context, length * 0.22, 0, Math.max(1.8 * scale, size * 0.18));
  context.fill();
  context.restore();
}

function drawSplitFireboltProjectile(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: { x: number; y: number },
  size: number,
  progress: number,
  alpha: number,
  scale: number,
  splitProjectile?: boolean
) {
  const angle = Math.atan2(direction.y, direction.x);
  const bodyRadius = size * (splitProjectile ? 0.82 : 1.16);
  const trailLength = size * (splitProjectile ? 4.2 : 5.8);
  const pulseScale = 0.92 + pulse(progress * 2.6) * 0.18;

  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.globalAlpha = alpha;

  const trail = context.createLinearGradient(-trailLength, 0, -bodyRadius * 0.2, 0);
  trail.addColorStop(0, "rgba(255, 45, 0, 0)");
  trail.addColorStop(0.28, "rgba(255, 70, 8, 0.18)");
  trail.addColorStop(0.64, "rgba(255, 122, 24, 0.54)");
  trail.addColorStop(1, "rgba(255, 221, 92, 0.82)");
  context.strokeStyle = trail;
  context.lineWidth = bodyRadius * 1.18;
  context.shadowColor = "rgba(255, 91, 0, 0.8)";
  context.shadowBlur = 12 * scale;
  line(context, -trailLength, 0, -bodyRadius * 0.28, 0);

  context.globalAlpha = alpha * 0.42;
  context.lineWidth = Math.max(1.4 * scale, bodyRadius * 0.28);
  line(context, -trailLength * 0.82, -bodyRadius * 0.52, -bodyRadius * 0.55, -bodyRadius * 0.16);
  line(context, -trailLength * 0.74, bodyRadius * 0.5, -bodyRadius * 0.42, bodyRadius * 0.15);

  context.globalAlpha = alpha * 0.9;
  const outer = context.createRadialGradient(-bodyRadius * 0.32, -bodyRadius * 0.35, bodyRadius * 0.14, 0, 0, bodyRadius * 1.42 * pulseScale);
  outer.addColorStop(0, "rgba(255, 255, 230, 0.98)");
  outer.addColorStop(0.2, "rgba(255, 224, 95, 0.96)");
  outer.addColorStop(0.48, "rgba(255, 111, 20, 0.9)");
  outer.addColorStop(0.78, "rgba(202, 28, 0, 0.58)");
  outer.addColorStop(1, "rgba(202, 28, 0, 0)");
  context.fillStyle = outer;
  circlePath(context, 0, 0, bodyRadius * 1.42 * pulseScale);
  context.fill();

  context.globalAlpha = alpha;
  context.strokeStyle = "rgba(255, 168, 28, 0.94)";
  context.lineWidth = Math.max(1.4 * scale, bodyRadius * 0.18);
  context.shadowBlur = 8 * scale;
  regularPolygonPath(context, 0, 0, bodyRadius * pulseScale, splitProjectile ? 5 : 7, Math.PI / 7);
  context.stroke();

  context.fillStyle = "rgba(255, 255, 238, 0.95)";
  circlePath(context, bodyRadius * 0.18, -bodyRadius * 0.1, Math.max(1.8 * scale, bodyRadius * 0.24));
  context.fill();
  context.restore();
}

function drawCorrosiveProjectileTrail(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: { x: number; y: number },
  progress: number,
  alpha: number,
  scale: number
) {
  context.save();
  context.lineCap = "round";
  context.strokeStyle = "rgba(92, 255, 127, 0.74)";
  context.lineWidth = 2.4 * scale;
  for (let index = 0; index < 4; index += 1) {
    const offset = (9 + index * 8) * scale;
    context.globalAlpha = alpha * (1 - index / 4) * clamp(progress + 0.26, 0.26, 1);
    line(
      context,
      x - direction.x * offset,
      y - direction.y * offset,
      x - direction.x * (offset + 5 * scale),
      y - direction.y * (offset + 5 * scale)
    );
  }
  context.fillStyle = "rgba(190, 255, 195, 0.72)";
  for (let index = 0; index < 5; index += 1) {
    const phase = (progress * 2.3 + index * 0.21) % 1;
    const offset = (15 + index * 7 + phase * 7) * scale;
    const side = index % 2 === 0 ? 1 : -1;
    const bubbleRadius = (1.1 + (index % 3) * 0.35) * scale;
    context.globalAlpha = (0.18 + (1 - phase) * 0.34) * alpha;
    circlePath(
      context,
      x - direction.x * offset - direction.y * side * (2.5 + index % 2) * scale,
      y - direction.y * offset + direction.x * side * (2.5 + index % 2) * scale,
      bubbleRadius
    );
    context.fill();
  }
  context.restore();
}

function drawCorrosiveProjectileSphere(context: CanvasRenderingContext2D, x: number, y: number, size: number, progress: number, scale: number) {
  const radius = size * 1.18;
  context.save();
  context.translate(x, y);
  context.shadowColor = "rgba(92, 255, 127, 0.9)";
  context.shadowBlur = 12 * scale;
  const gradient = context.createRadialGradient(-radius * 0.36, -radius * 0.38, radius * 0.12, 0, 0, radius);
  gradient.addColorStop(0, "rgba(244, 255, 218, 0.98)");
  gradient.addColorStop(0.28, "rgba(151, 255, 112, 0.96)");
  gradient.addColorStop(0.72, "rgba(38, 200, 81, 0.92)");
  gradient.addColorStop(1, "rgba(8, 97, 44, 0.82)");
  context.globalAlpha = 0.9;
  context.fillStyle = gradient;
  circlePath(context, 0, 0, radius);
  context.fill();
  context.lineWidth = Math.max(1.3, radius * 0.18);
  context.strokeStyle = "rgba(220, 255, 198, 0.72)";
  context.globalAlpha = 0.5 + pulse(progress) * 0.16;
  circlePath(context, 0, 0, radius * 0.92);
  context.stroke();
  context.globalAlpha = 0.72;
  context.fillStyle = "rgba(247, 255, 225, 0.86)";
  circlePath(context, -radius * 0.32, -radius * 0.38, radius * 0.22);
  context.fill();
  context.restore();
}

function drawAreaMarkers(context: CanvasRenderingContext2D, snapshot: BattleGeometrySnapshot, layer: "under-entities" | "over-entities" = "under-entities") {
  for (const area of snapshot.areas) {
    const family = skillEffectFamily(area.vfxKey || area.damageType);
    if (isLightningShotChainStrike(area.vfxKey)) continue;
    const overEntityArea = area.kind === "melee-arc" || family === "blizzard";
    if (layer === "under-entities" && overEntityArea) continue;
    if (layer === "over-entities" && !overEntityArea) continue;
    const color = geometricToneColor(area.vfxKey || area.damageType);
    const progress = clamp(1 - area.ttl / Math.max(0.001, area.duration), 0, 1);
    context.save();
    context.globalAlpha = area.warning ? 0.18 + pulse(progress) * 0.18 : 0.16 + (1 - progress) * 0.18;
    context.strokeStyle = color;
    context.lineWidth = 2;

    if (area.kind === "chain" && area.startX !== undefined && area.startY !== undefined && area.endX !== undefined && area.endY !== undefined) {
      if (family === "thundercloud") {
        drawThundercloudChainSegment(context, area, color, progress);
      } else {
        context.lineWidth = 2.5;
        line(context, area.startX, area.startY, area.endX, area.endY);
        drawChainNodes(context, area, color, progress);
      }
    } else if (area.x !== undefined && area.y !== undefined) {
      const radius = Math.max(1, area.radius ?? Math.max(area.width ?? 1, area.height ?? 1) * 0.5);
      if (area.kind === "lava-orbit") {
        drawLavaOrbitBody(context, area, radius, color);
      } else if (area.kind === "damage-zone" && area.width !== undefined && area.height !== undefined) {
        drawDamageZoneRect(context, area, color);
      } else if (area.kind === "damage-zone") {
        drawDamageZoneCircle(context, area, radius, color, progress);
      } else if (area.kind === "melee-arc") {
        drawMeleeArc(context, area, radius, color, progress);
      } else if (area.kind === "passive-aura") {
        drawPassiveAura(context, area, radius, color, progress);
      } else if (area.kind === "nova" && family === "ring_of_ice") {
        drawRingOfIceNova(context, area, radius, progress);
      } else {
        const scale = area.kind === "nova" ? 0.18 + progress * 0.82 : 1;
        circle(context, area.x, area.y, radius * scale);
      }
    }

    context.restore();
  }
  context.globalAlpha = 1;
}

function drawHitMarkers(context: CanvasRenderingContext2D, snapshot: BattleGeometrySnapshot) {
  const stableScale = screenStableScale(snapshot);
  for (const hit of snapshot.hits) {
    const color = geometricToneColor(hit.damageType || hit.vfxKey);
    const progress = clamp(1 - hit.ttl / Math.max(0.001, hit.duration), 0, 1);
    const radius = Math.max(18, hit.radius ?? 24) * stableScale;
    const family = skillEffectFamily(hit.vfxKey || hit.damageType);

    context.save();
    context.translate(hit.x, hit.y);
    context.strokeStyle = color;
    context.fillStyle = color;
    context.shadowColor = color;
    if (family === "blizzard") {
      drawBlizzardHitMarker(context, radius, progress, stableScale);
    } else if (family === "ice_shards" || family === "frost_nova") {
      drawIceHitMarker(context, radius, color, progress, stableScale);
    } else if (family === "penetrating_shot") {
      drawPierceHitMarker(context, radius, color, progress, stableScale);
    } else if (family === "thundercloud") {
      drawThundercloudHitMarker(context, radius, color, progress, stableScale);
    } else if (family === "lightning_shot") {
      drawLightningShotHitMarker(context, radius, progress, stableScale, hit.vfxKey);
    } else if (family === "lightning_chain") {
      drawLightningHitMarker(context, radius, color, progress, stableScale);
    } else if (family === "sparkle") {
      drawSparkleHitMarker(context, radius, progress, stableScale);
    } else if (family === "ground_spike") {
      drawSpikeHitMarker(context, radius, color, progress, stableScale);
    } else if (family === "fungal_petards") {
      drawSporeHitMarker(context, radius, color, progress, stableScale);
    } else if (family === "lava_orb") {
      drawLavaHitMarker(context, radius, color, progress, stableScale);
    } else if (family === "black_hole") {
      drawBlackHoleHitMarker(context, radius, progress, stableScale);
    } else {
      drawFireHitMarker(context, radius, color, progress, stableScale);
    }
    drawHitShapeEffects(context, hit.shapeEffects, radius, color, progress, stableScale);
    context.restore();
  }
  context.globalAlpha = 1;
}

type SkillEffectFamily = "burning_shot" | "split_firebolt" | "fire_bolt" | "flame_slash" | "ice_shards" | "frost_nova" | "ring_of_ice" | "blizzard" | "penetrating_shot" | "lightning_shot" | "lightning_chain" | "sparkle" | "thundercloud" | "whirlwind" | "ground_spike" | "fungal_petards" | "lava_orb" | "corrosive_shot" | "black_hole";

function skillEffectFamily(token: string | undefined): SkillEffectFamily {
  const value = (token || "").toLowerCase();
  if (value.includes("black_hole")) return "black_hole";
  if (value.includes("split_firebolt")) return "split_firebolt";
  if (value.includes("burning_shot")) return "burning_shot";
  if (value.includes("sparkle")) return "sparkle";
  if (value.includes("lightning_shot")) return "lightning_shot";
  if (value.includes("corrosive_shot") || value.includes("corrosive") || value.includes("corrosion")) return "corrosive_shot";
  if (value.includes("flame_slash")) return "flame_slash";
  if (value.includes("thundercloud")) return "thundercloud";
  if (value.includes("whirlwind")) return "whirlwind";
  if (value.includes("lava_orb") || value.includes("lava")) return "lava_orb";
  if (value.includes("blizzard")) return "blizzard";
  if (value.includes("ring_of_ice")) return "ring_of_ice";
  if (value.includes("ice_shards") || value.includes("ice")) return "ice_shards";
  if (value.includes("frost_nova") || value.includes("frost")) return "frost_nova";
  if (value.includes("penetrating_shot") || value.includes("pierce")) return "penetrating_shot";
  if (value.includes("lightning_chain") || value.includes("lightning")) return "lightning_chain";
  if (value.includes("ground_spike") || value.includes("puncture") || value.includes("spike")) return "ground_spike";
  if (value.includes("fungal") || value.includes("spore")) return "fungal_petards";
  return "fire_bolt";
}

function isLightningShotChainStrike(vfxKey: string | undefined) {
  const value = (vfxKey || "").toLowerCase();
  return value.includes("lightning_shot") && value.includes("chain_strike");
}

function drawLightningShotProjectile(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: { x: number; y: number },
  size: number,
  progress: number,
  scale: number
) {
  const angle = Math.atan2(direction.y, direction.x);
  const length = Math.max(34 * scale, size * 5.4);
  const coreWidth = Math.max(3.2 * scale, size * 0.38);
  const flash = 0.68 + pulse(progress * 2.4) * 0.32;

  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.shadowColor = "rgba(124, 232, 255, 0.96)";
  context.shadowBlur = 18 * scale;

  context.strokeStyle = "rgba(74, 197, 255, 0.72)";
  context.lineWidth = coreWidth * 2.2;
  context.globalAlpha = 0.42 * flash;
  drawJaggedBolt(context, -length * 0.62, 0, length * 0.44, 0, size * 0.38);

  context.strokeStyle = "rgba(244, 253, 255, 0.98)";
  context.lineWidth = coreWidth;
  context.globalAlpha = 0.96;
  drawJaggedBolt(context, -length * 0.52, 0, length * 0.52, 0, size * 0.28);

  context.fillStyle = "rgba(255, 235, 86, 0.96)";
  context.globalAlpha = 0.9;
  context.beginPath();
  context.moveTo(length * 0.62, 0);
  context.lineTo(length * 0.28, -size * 0.34);
  context.lineTo(length * 0.38, 0);
  context.lineTo(length * 0.28, size * 0.34);
  context.closePath();
  context.fill();

  context.globalAlpha = 0.36;
  context.strokeStyle = "rgba(117, 232, 255, 0.82)";
  context.lineWidth = Math.max(1.2 * scale, coreWidth * 0.42);
  for (let index = 0; index < 3; index += 1) {
    const trail = -length * (0.72 + index * 0.18);
    drawJaggedBolt(context, trail, size * (index - 1) * 0.18, trail + length * 0.18, size * (index - 1) * 0.08, size * 0.18);
  }
  context.restore();
}

function drawSparkleProjectile(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: { x: number; y: number },
  size: number,
  progress: number,
  alpha: number,
  scale: number
) {
  const angle = Math.atan2(direction.y, direction.x);
  const radius = Math.max(8 * scale, size * 1.28);
  const pulseAmount = 0.72 + pulse(progress * 8.5) * 0.28;
  const trailLength = Math.max(26 * scale, radius * 3.1);

  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.shadowColor = "rgba(128, 235, 255, 0.96)";
  context.shadowBlur = 18 * scale;

  context.globalAlpha = 0.28 * alpha;
  context.strokeStyle = "rgba(62, 129, 255, 0.72)";
  context.lineWidth = Math.max(5 * scale, radius * 0.56);
  line(context, -trailLength, 0, -radius * 0.25, 0);

  context.globalAlpha = 0.58 * alpha;
  context.strokeStyle = "rgba(128, 235, 255, 0.9)";
  context.lineWidth = Math.max(2 * scale, radius * 0.18);
  drawJaggedBolt(context, -trailLength * 0.9, 0, radius * 0.32, 0, radius * 0.42);

  context.globalAlpha = 0.95 * pulseAmount;
  context.strokeStyle = "rgba(246, 254, 255, 0.98)";
  context.lineWidth = Math.max(2.2 * scale, radius * 0.2);
  drawJaggedBolt(context, -radius * 0.95, -radius * 0.18, radius * 1.05, radius * 0.12, radius * 0.55);

  context.globalAlpha = 0.72 * pulseAmount;
  context.strokeStyle = "rgba(118, 235, 255, 0.92)";
  context.lineWidth = Math.max(1.4 * scale, radius * 0.12);
  drawJaggedBolt(context, -radius * 0.42, radius * 0.62, radius * 0.72, -radius * 0.54, radius * 0.38);

  const core = context.createRadialGradient(0, 0, radius * 0.05, 0, 0, radius * 1.18);
  core.addColorStop(0, "rgba(255, 255, 255, 0.98)");
  core.addColorStop(0.24, "rgba(194, 248, 255, 0.9)");
  core.addColorStop(0.54, "rgba(80, 203, 255, 0.54)");
  core.addColorStop(1, "rgba(48, 118, 255, 0)");
  context.globalAlpha = 0.92;
  context.fillStyle = core;
  circlePath(context, 0, 0, radius * (0.95 + pulseAmount * 0.18));
  context.fill();

  context.fillStyle = "rgba(255, 255, 255, 0.98)";
  context.globalAlpha = 0.9;
  circlePath(context, 0, 0, Math.max(2.5 * scale, radius * 0.22));
  context.fill();
  context.restore();
}

function drawLightningShotHitMarker(
  context: CanvasRenderingContext2D,
  radius: number,
  progress: number,
  scale: number,
  vfxKey: string | undefined
) {
  if (isLightningShotChainStrike(vfxKey)) {
    drawLightningShotChainStrikeMarker(context, radius, progress, scale);
    return;
  }

  const fade = Math.max(0, 1 - progress * 0.82);
  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.shadowColor = "rgba(180, 245, 255, 0.98)";
  context.shadowBlur = 18 * scale;

  context.globalAlpha = 0.9 * fade;
  context.strokeStyle = "rgba(239, 253, 255, 0.98)";
  context.lineWidth = Math.max(2.6 * scale, radius * 0.08);
  drawJaggedBolt(context, -radius * 0.72, -radius * 0.12, radius * 0.72, radius * 0.08, radius * 0.16);

  context.globalAlpha = 0.52 * fade;
  context.strokeStyle = "rgba(255, 232, 80, 0.88)";
  context.lineWidth = Math.max(1.5 * scale, radius * 0.038);
  drawJaggedBolt(context, -radius * 0.44, radius * 0.28, radius * 0.22, -radius * 0.38, radius * 0.11);
  drawJaggedBolt(context, radius * 0.08, radius * 0.44, radius * 0.54, -radius * 0.22, radius * 0.1);

  const coreGradient = context.createRadialGradient(0, 0, radius * 0.04, 0, 0, radius * 0.72);
  coreGradient.addColorStop(0, "rgba(248, 254, 255, 0.72)");
  coreGradient.addColorStop(0.42, "rgba(95, 216, 255, 0.22)");
  coreGradient.addColorStop(1, "rgba(95, 216, 255, 0)");
  context.globalAlpha = 0.56 * fade;
  context.fillStyle = coreGradient;
  circlePath(context, 0, 0, radius * 0.72);
  context.fill();
  context.restore();
}

function drawSparkleHitMarker(
  context: CanvasRenderingContext2D,
  radius: number,
  progress: number,
  scale: number
) {
  const fade = Math.max(0, 1 - progress);
  const ringRadius = radius * (0.42 + progress * 0.76);

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.shadowColor = "rgba(150, 240, 255, 0.98)";
  context.shadowBlur = 20 * scale;

  context.globalAlpha = 0.68 * fade;
  context.strokeStyle = "rgba(105, 220, 255, 0.9)";
  context.lineWidth = Math.max(2.2 * scale, radius * 0.055);
  circlePath(context, 0, 0, ringRadius);
  context.stroke();

  context.globalAlpha = 0.95 * fade;
  context.strokeStyle = "rgba(250, 254, 255, 0.98)";
  context.lineWidth = Math.max(2 * scale, radius * 0.07);
  drawJaggedBolt(context, -radius * 0.72, -radius * 0.1, radius * 0.72, radius * 0.08, radius * 0.18);
  drawJaggedBolt(context, -radius * 0.28, radius * 0.46, radius * 0.42, -radius * 0.42, radius * 0.15);

  const burst = context.createRadialGradient(0, 0, radius * 0.04, 0, 0, radius * 0.88);
  burst.addColorStop(0, "rgba(255, 255, 255, 0.72)");
  burst.addColorStop(0.38, "rgba(120, 232, 255, 0.24)");
  burst.addColorStop(1, "rgba(48, 118, 255, 0)");
  context.globalAlpha = 0.54 * fade;
  context.fillStyle = burst;
  circlePath(context, 0, 0, radius * 0.88);
  context.fill();
  context.restore();
}

function drawLightningShotChainStrikeMarker(context: CanvasRenderingContext2D, radius: number, progress: number, scale: number) {
  const fade = Math.max(0, 1 - progress * 0.88);
  const strikeHeight = Math.max(58 * scale, radius * 2.3);
  const strikeWidth = Math.max(9 * scale, radius * 0.24);

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.shadowColor = "rgba(190, 248, 255, 0.98)";
  context.shadowBlur = 20 * scale;

  context.globalAlpha = 0.92 * fade;
  context.strokeStyle = "rgba(246, 254, 255, 0.98)";
  context.lineWidth = Math.max(2.8 * scale, radius * 0.07);
  context.beginPath();
  context.moveTo(-strikeWidth * 0.2, -strikeHeight * 0.62);
  context.lineTo(strikeWidth * 0.55, -strikeHeight * 0.22);
  context.lineTo(-strikeWidth * 0.18, -strikeHeight * 0.18);
  context.lineTo(strikeWidth * 0.46, strikeHeight * 0.32);
  context.lineTo(-strikeWidth * 0.34, strikeHeight * 0.02);
  context.stroke();

  context.globalAlpha = 0.45 * fade;
  context.strokeStyle = "rgba(255, 232, 83, 0.86)";
  context.lineWidth = Math.max(1.4 * scale, radius * 0.032);
  drawJaggedBolt(context, -strikeWidth * 1.1, -strikeHeight * 0.04, -strikeWidth * 2.5, strikeHeight * 0.18, radius * 0.07);
  drawJaggedBolt(context, strikeWidth * 1.0, strikeHeight * 0.08, strikeWidth * 2.7, strikeHeight * 0.24, radius * 0.07);

  context.globalAlpha = 0.38 * fade;
  context.fillStyle = "rgba(124, 232, 255, 0.42)";
  circlePath(context, 0, strikeHeight * 0.36, radius * (0.18 + progress * 0.16));
  context.fill();
  context.restore();
}

function drawBlizzardHitMarker(context: CanvasRenderingContext2D, radius: number, progress: number, scale: number) {
  const fall = smoothstep(0.05, 0.74, progress);
  const landed = smoothstep(0.7, 0.88, progress);
  const airborne = Math.max(0, 1 - smoothstep(0.72, 0.9, progress));
  const start = { x: radius * 1.08, y: -radius * 2.2 };
  const impact = { x: -radius * 0.1, y: radius * 0.16 };
  const x = start.x + (impact.x - start.x) * fall;
  const y = start.y + (impact.y - start.y) * fall;
  const angle = Math.atan2(impact.y - start.y, impact.x - start.x);

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";

  if (airborne > 0) {
    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.shadowColor = "rgba(170, 246, 255, 0.95)";
    context.shadowBlur = 14 * scale;
    context.globalAlpha = (0.54 + fall * 0.38) * airborne;
    context.strokeStyle = "rgba(118, 232, 255, 0.78)";
    context.lineWidth = Math.max(2, radius * 0.05);
    line(context, -radius * 1.36, 0, -radius * 0.12, 0);
    context.strokeStyle = "rgba(238, 254, 255, 0.9)";
    context.lineWidth = Math.max(1.2, radius * 0.024);
    for (let dot = 0; dot < 7; dot += 1) {
      const dotX = -radius * (0.32 + dot * 0.16);
      circlePath(context, dotX, Math.sin(dot * 1.7) * radius * 0.06, Math.max(1.1, radius * (0.018 + dot * 0.002)));
      context.fillStyle = "rgba(218, 254, 255, 0.82)";
      context.fill();
    }
    context.fillStyle = "rgba(238, 254, 255, 0.98)";
    context.strokeStyle = "rgba(65, 190, 246, 0.96)";
    context.lineWidth = Math.max(1.2, radius * 0.026);
    context.beginPath();
    context.moveTo(radius * 0.24, 0);
    context.lineTo(-radius * 0.1, -radius * 0.11);
    context.lineTo(-radius * 0.22, 0);
    context.lineTo(-radius * 0.1, radius * 0.11);
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();
  }

  if (landed > 0) {
    context.globalAlpha = Math.max(0, (1 - progress * 0.5) * landed);
    context.shadowColor = "rgba(207, 250, 255, 0.95)";
    context.shadowBlur = 16 * scale;
    context.strokeStyle = "rgba(226, 254, 255, 0.92)";
    context.fillStyle = "rgba(77, 190, 255, 0.2)";
    context.lineWidth = Math.max(2, radius * 0.045);
    circlePath(context, impact.x, impact.y, radius * (0.38 + landed * 0.24));
    context.fill();
    context.stroke();
    for (let ray = 0; ray < 10; ray += 1) {
      const rayAngle = ray * Math.PI * 2 / 10;
      const inner = radius * 0.1;
      const outer = radius * (0.36 + landed * 0.2);
      line(context, impact.x + Math.cos(rayAngle) * inner, impact.y + Math.sin(rayAngle) * inner * 0.42, impact.x + Math.cos(rayAngle) * outer, impact.y + Math.sin(rayAngle) * outer * 0.42);
    }
  }

  context.restore();
}

function drawFireHitMarker(context: CanvasRenderingContext2D, radius: number, color: string, progress: number, scale: number) {
  const burstRadius = radius * (0.78 + progress * 1.55);
  context.shadowBlur = 20 * scale;
  context.lineWidth = 5 * scale;
  context.globalAlpha = Math.max(0, 0.86 - progress * 0.62);
  circle(context, 0, 0, burstRadius * 1.22);
  context.stroke();
  context.shadowBlur = 0;
}

function drawHitShapeEffects(
  context: CanvasRenderingContext2D,
  shapeEffects: ReadonlyArray<string> | undefined,
  radius: number,
  color: string,
  progress: number,
  scale: number
) {
  if (!shapeEffects?.length) return;
  if (shapeEffects.includes("fire_bolt_fork")) drawFireBoltForkShapeMarker(context, radius, color, progress, scale);
  if (shapeEffects.includes("fire_bolt_nova")) drawFireBoltNovaShapeMarker(context, radius, color, progress, scale);
  if (shapeEffects.includes("fire_bolt_rain")) drawFireBoltRainShapeMarker(context, radius, color, progress, scale);
}

function drawFireBoltForkShapeMarker(context: CanvasRenderingContext2D, radius: number, color: string, progress: number, scale: number) {
  const length = radius * (2.4 + progress * 2.6);
  context.save();
  context.strokeStyle = color;
  context.fillStyle = color;
  context.shadowColor = color;
  context.shadowBlur = 18 * scale;
  context.lineWidth = Math.max(3, radius * 0.16);
  context.globalAlpha = Math.max(0, 0.96 - progress * 0.72);
  for (let index = 0; index < 7; index += 1) {
    const angle = (-58 + index * 19 + (index % 2) * 5) * Math.PI / 180;
    const inner = radius * 0.2;
    const outer = length * (0.72 + (index % 3) * 0.12);
    line(context, Math.cos(angle) * inner, Math.sin(angle) * inner, Math.cos(angle) * outer, Math.sin(angle) * outer);
    circlePath(context, Math.cos(angle) * outer, Math.sin(angle) * outer, Math.max(2, radius * 0.13));
    context.fill();
  }
  context.restore();
}

function drawFireBoltNovaShapeMarker(context: CanvasRenderingContext2D, radius: number, color: string, progress: number, scale: number) {
  const ringRadius = radius * (1.5 + progress * 3.4);
  context.save();
  context.strokeStyle = color;
  context.fillStyle = color;
  context.shadowColor = color;
  context.shadowBlur = 24 * scale;
  context.lineWidth = Math.max(5, radius * 0.22);
  context.globalAlpha = Math.max(0, 0.95 - progress * 0.68);
  circlePath(context, 0, 0, ringRadius);
  context.stroke();
  context.globalAlpha = Math.max(0, 0.48 - progress * 0.34);
  circlePath(context, 0, 0, ringRadius * 0.62);
  context.stroke();
  context.lineWidth = Math.max(2.5, radius * 0.1);
  context.globalAlpha = Math.max(0, 0.86 - progress * 0.7);
  for (let index = 0; index < 12; index += 1) {
    const angle = index * Math.PI / 6 + progress * 0.7;
    const inner = ringRadius * 0.72;
    const outer = ringRadius * 1.12;
    line(context, Math.cos(angle) * inner, Math.sin(angle) * inner, Math.cos(angle) * outer, Math.sin(angle) * outer);
  }
  context.restore();
}

function drawFireBoltRainShapeMarker(context: CanvasRenderingContext2D, radius: number, color: string, progress: number, scale: number) {
  context.save();
  context.strokeStyle = color;
  context.fillStyle = color;
  context.shadowColor = color;
  context.shadowBlur = 20 * scale;
  context.lineWidth = Math.max(4, radius * 0.18);
  context.globalAlpha = Math.max(0, 0.95 - progress * 0.64);
  for (let index = 0; index < 6; index += 1) {
    const lane = (index - 2.5) * radius * 0.58;
    const delay = index * 0.07;
    const fall = clamp((progress - delay) / 0.72, 0, 1);
    const x = lane + fall * radius * 0.42;
    const y = -radius * 3.1 + fall * radius * 4.2;
    line(context, x - radius * 0.48, y - radius * 0.72, x + radius * 0.12, y + radius * 0.26);
    circlePath(context, x + radius * 0.12, y + radius * 0.26, Math.max(2.5, radius * 0.15));
    context.fill();
  }
  context.globalAlpha = Math.max(0, 0.42 - progress * 0.3);
  circle(context, 0, radius * 0.7, radius * 2.15);
  context.fill();
  context.restore();
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
  circle(context, 0, 0, radius * (1.25 + progress));
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

function drawThundercloudHitMarker(context: CanvasRenderingContext2D, radius: number, color: string, progress: number, scale: number) {
  const strikeHeight = Math.max(34 * scale, radius * 1.8);
  const strikeWidth = Math.max(9 * scale, radius * 0.24);
  const fade = Math.max(0, 1 - progress);
  context.shadowColor = "#DFFBFF";
  context.shadowBlur = 18 * scale;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = Math.max(2.2, 2.8 * scale);
  context.globalAlpha = 0.88 * fade + 0.16;
  context.strokeStyle = "#EAFDFF";
  context.beginPath();
  context.moveTo(-strikeWidth * 0.35, -strikeHeight * 0.82);
  context.lineTo(strikeWidth * 0.34, -strikeHeight * 0.36);
  context.lineTo(-strikeWidth * 0.08, -strikeHeight * 0.28);
  context.lineTo(strikeWidth * 0.5, strikeHeight * 0.5);
  context.stroke();

  context.strokeStyle = color;
  context.lineWidth = Math.max(1.4, 1.8 * scale);
  context.globalAlpha = 0.58 * fade;
  for (const side of [-1, 1]) {
    context.beginPath();
    context.moveTo(side * strikeWidth * 0.2, -strikeHeight * 0.2);
    context.lineTo(side * strikeWidth * 1.12, strikeHeight * 0.06);
    context.lineTo(side * strikeWidth * 0.5, strikeHeight * 0.28);
    context.stroke();
  }

  context.shadowBlur = 10 * scale;
  context.globalAlpha = 0.34 * fade;
  context.strokeStyle = "#B8F7FF";
  context.lineWidth = Math.max(1, 1.2 * scale);
  circlePath(context, 0, strikeHeight * 0.46, strikeWidth * (1.45 + progress * 0.75));
  context.stroke();
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
  circle(context, 0, radius * 0.2, radius * 1.05);
  context.fill();
}

function drawSporeHitMarker(context: CanvasRenderingContext2D, radius: number, color: string, progress: number, scale: number) {
  context.shadowBlur = 14 * scale;
  context.globalAlpha = Math.max(0, 0.72 - progress * 0.5);
  for (let index = 0; index < 9; index += 1) {
    const angle = index * Math.PI * 2 / 9 + 0.5;
    const dist = radius * (0.18 + (index % 3) * 0.18 + progress * 0.74);
    const dot = radius * (0.13 + (index % 2) * 0.04) * (1 - progress * 0.35);
    circle(context, Math.cos(angle) * dist, Math.sin(angle) * dist, dot);
    context.fill();
  }
  context.lineWidth = 2 * scale;
  context.globalAlpha = Math.max(0, 0.42 - progress * 0.3);
  circle(context, 0, 0, radius * (0.72 + progress * 0.8));
  context.stroke();
}

function drawLavaHitMarker(context: CanvasRenderingContext2D, radius: number, color: string, progress: number, scale: number) {
  const ringRadius = radius * (0.95 + progress * 1.05);
  context.shadowBlur = 22 * scale;
  context.lineWidth = 6 * scale;
  context.globalAlpha = Math.max(0, 0.92 - progress * 0.72);
  circle(context, 0, 0, ringRadius * 1.18);
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

function drawBlackHoleHitMarker(context: CanvasRenderingContext2D, radius: number, progress: number, scale: number) {
  const fade = Math.max(0, 1 - progress * 0.72);
  const spin = progress * Math.PI * 3.5;
  const ringRadius = radius * (1.02 + progress * 0.18);

  context.shadowColor = "rgba(196, 196, 214, 0.82)";
  context.shadowBlur = 18 * scale;
  context.globalAlpha = 0.86 * fade;
  context.lineWidth = Math.max(2.2 * scale, radius * 0.08);
  context.strokeStyle = "rgba(205, 205, 220, 0.74)";
  for (let index = 0; index < 4; index += 1) {
    context.save();
    context.rotate(spin + index * Math.PI * 0.5);
    context.beginPath();
    context.arc(0, 0, ringRadius * 0.72, -0.46, 0.5);
    context.stroke();
    context.restore();
  }

  context.globalAlpha = 0.94 * fade;
  const coreGradient = context.createRadialGradient(0, 0, radius * 0.04, 0, 0, radius * 0.48);
  coreGradient.addColorStop(0, "rgba(0, 0, 0, 1)");
  coreGradient.addColorStop(0.48, "rgba(0, 0, 0, 0.98)");
  coreGradient.addColorStop(0.66, "rgba(178, 176, 205, 0.42)");
  coreGradient.addColorStop(1, "rgba(30, 28, 42, 0)");
  context.fillStyle = coreGradient;
  circlePath(context, 0, 0, radius * (0.5 + progress * 0.08));
  context.fill();

  context.shadowBlur = 0;
  context.globalAlpha = 0.46 * fade;
  context.lineWidth = Math.max(1.4 * scale, radius * 0.04);
  context.strokeStyle = "rgba(132, 130, 156, 0.52)";
  circlePath(context, 0, 0, radius * (1.15 + progress * 0.44));
  context.stroke();
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
  circle(context, 0, 0, radius * 0.92);
  context.stroke();
  context.globalAlpha = 0.22;
  circle(context, 0, 0, radius * 0.62);
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
  circle(context, 0, 0, radius);
  context.stroke();

  context.globalAlpha = 0.9;
  context.lineWidth = 4 * scale;
  for (let orbIndex = 0; orbIndex < orbCount; orbIndex += 1) {
    const angle = (startAngle + (360 / orbCount) * orbIndex + speed * (elapsedMs / 1000)) * Math.PI / 180;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    context.save();
    context.translate(x, y);
    context.rotate(angle + elapsedMs / 260);
    context.shadowBlur = 22;
    context.globalAlpha = 0.32;
    circle(context, 0, 0, damageRadius * 1.15);
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
      regularPolygonPath(context, Math.cos(chipAngle) * damageRadius * 0.67, Math.sin(chipAngle) * damageRadius * 0.67, 4.5, 5, chipAngle);
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
    const pop = 1 + Math.sin((1 - Math.min(progress, 0.22) / 0.22) * Math.PI) * 0.18;
    const shrink = 1 - smoothstep(0.48, 1, progress);
    const criticalScale = item.critical ? 1.14 : 1;
    const fontSize = Math.max(0.001, Math.max(14, tokens.font.number * 1.56) * scale * pop * criticalScale * shrink);
    const color = item.critical ? "#FFF3A6" : geometricToneColor(item.damageType);
    const offset = floatingTextOffset(item.id, Boolean(item.critical), scale);
    const y = item.y + offset.y;
    context.font = `900 ${fontSize}px ${tokens.font.family}`;
    context.globalAlpha = 1;
    context.lineWidth = Math.max(item.critical ? 3.6 : 2.4, fontSize * (item.critical ? 0.2 : 0.16));
    context.strokeStyle = item.critical ? "rgba(72, 20, 4, 0.92)" : "rgba(18, 10, 7, 0.86)";
    context.strokeText(item.text, item.x + offset.x, y);
    context.shadowColor = color;
    context.shadowBlur = (item.critical ? 13 : 8) * scale;
    context.fillStyle = color;
    context.fillText(item.text, item.x + offset.x, y);
    context.shadowBlur = 0;
  }
  context.restore();
}

function floatingTextOffset(id: number, critical: boolean, scale: number) {
  const slot = Math.abs(id) % 9;
  const angle = slot * Math.PI * 2 / 9;
  const radius = ((critical ? 16 : 10) + (slot % 3) * 3) * scale;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius * 0.55 - (critical ? 6 * scale : 0)
  };
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

function drawDamageZoneCircle(context: CanvasRenderingContext2D, area: BattleGeometryArea, radius: number, color: string, progress: number) {
  if (area.x === undefined || area.y === undefined) return;
  if (isBurningShotIgnitedExplosion(area.vfxKey)) {
    context.save();
    context.translate(area.x, area.y);
    drawBurningShotIgnitedExplosionZone(context, radius, progress);
    context.restore();
    return;
  }
  const family = skillEffectFamily(area.vfxKey || area.damageType);
  if (family === "lava_orb") {
    drawLavaOrbZone(context, area, radius, color, progress);
    return;
  }
  if (family === "thundercloud") {
    drawThundercloudZone(context, area, radius, color, progress);
    return;
  }
  if (family === "whirlwind") {
    drawWhirlwindZone(context, area, radius, color);
    return;
  }
  if (family === "blizzard") {
    drawBlizzardZone(context, area, radius, progress);
    return;
  }
  if (family === "corrosive_shot") {
    drawCorrosiveGroundZone(context, area, radius, progress);
    return;
  }
  if (family === "black_hole") {
    drawBlackHoleZone(context, area, radius, progress);
    return;
  }

  context.save();
  context.translate(area.x, area.y);
  context.strokeStyle = color;
  context.fillStyle = color;
  context.shadowColor = color;
  context.shadowBlur = area.warning ? 6 : 12;
  context.lineWidth = area.warning ? 2 : 3;
  circlePath(context, 0, 0, radius);
  context.stroke();
  const elapsedMs = Math.max(0, (area.duration - area.ttl) * 1000);
  const fillProgress = area.warning
    ? progress
    : area.hitAtMs && area.hitAtMs > 0
      ? clamp(elapsedMs / area.hitAtMs, 0, 1)
      : 1;
  context.globalAlpha *= area.warning ? 0.18 : 0.24;
  circlePath(context, 0, 0, radius * fillProgress);
  context.fill();
  if (family === "frost_nova") {
    drawFrostNovaZonePattern(context, radius, color, fillProgress, area.warning);
  }
  context.restore();
}

function isBurningShotIgnitedExplosion(vfxKey: string | undefined) {
  const value = (vfxKey || "").toLowerCase();
  return value.includes("burning_shot") && value.includes("ignited_hit") && value.includes("explosion");
}

function drawBurningShotIgnitedExplosionZone(context: CanvasRenderingContext2D, radius: number, progress: number) {
  const expand = 0.38 + progress * 0.72;
  const fade = Math.max(0, 1 - progress * 0.84);
  context.globalAlpha *= fade;
  context.shadowColor = "#38f7ff";
  context.shadowBlur = 18;
  context.strokeStyle = "#38f7ff";
  context.fillStyle = "rgba(56, 247, 255, 0.18)";
  context.lineWidth = 5;
  circlePath(context, 0, 0, radius * expand);
  context.fill();
  context.stroke();
  context.strokeStyle = "#ff38d1";
  context.lineWidth = 3;
  for (let index = 0; index < 4; index += 1) {
    context.save();
    context.rotate(index * Math.PI / 2 + progress * Math.PI * 0.4);
    line(context, radius * 0.2, 0, radius * (0.82 + progress * 0.25), 0);
    context.restore();
  }
}

function drawCorrosiveGroundZone(context: CanvasRenderingContext2D, area: BattleGeometryArea, radius: number, progress: number) {
  if (area.x === undefined || area.y === undefined) return;
  const elapsedMs = Math.max(0, area.elapsedMs ?? (area.duration - area.ttl) * 1000);
  const tickPulse = area.tickProgress !== undefined ? 1 - Math.abs(area.tickProgress - 0.5) * 2 : pulse((elapsedMs % 900) / 900);
  const fade = Math.max(0.24, 1 - progress * 0.42);

  context.save();
  context.translate(area.x, area.y);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.shadowColor = "rgba(92, 255, 127, 0.82)";
  context.shadowBlur = 18;

  const groundGradient = context.createRadialGradient(0, 0, radius * 0.08, 0, 0, radius * 0.98);
  groundGradient.addColorStop(0, "rgba(184, 255, 119, 0.34)");
  groundGradient.addColorStop(0.42, "rgba(68, 225, 89, 0.24)");
  groundGradient.addColorStop(0.78, "rgba(22, 135, 61, 0.18)");
  groundGradient.addColorStop(1, "rgba(8, 64, 34, 0)");
  context.globalAlpha = 0.72 * fade;
  context.fillStyle = groundGradient;
  circlePath(context, 0, 0, radius * 0.98);
  context.fill();

  context.globalAlpha = (0.55 + tickPulse * 0.22) * fade;
  context.strokeStyle = "rgba(204, 255, 154, 0.84)";
  context.lineWidth = Math.max(2.2, radius * 0.026);
  circlePath(context, 0, 0, radius * (0.84 + tickPulse * 0.04));
  context.stroke();

  context.globalAlpha = 0.28 * fade;
  context.strokeStyle = "rgba(119, 255, 106, 0.72)";
  context.lineWidth = Math.max(1.2, radius * 0.012);
  for (let ring = 0; ring < 3; ring += 1) {
    const ringPulse = (elapsedMs / 1100 + ring / 3) % 1;
    circlePath(context, 0, 0, radius * (0.24 + ringPulse * 0.58));
    context.stroke();
  }

  const seedBase = area.id * 31 + Math.round((area.x || 0) * 0.1) + Math.round((area.y || 0) * 0.1);
  for (let index = 0; index < 18; index += 1) {
    const seedA = hashUnit(seedBase + index * 17);
    const seedB = hashUnit(seedBase + index * 47);
    const seedC = hashUnit(seedBase + index * 89);
    const orbit = Math.sqrt(seedA) * 0.88;
    const angle = seedB * Math.PI * 2;
    const phase = (elapsedMs / (820 + seedC * 520) + seedC) % 1;
    const localX = Math.cos(angle) * radius * orbit;
    const localY = Math.sin(angle) * radius * orbit - phase * radius * 0.16;
    const bubbleRadius = radius * (0.018 + seedC * 0.026) * (0.72 + pulse(phase) * 0.4);
    const alpha = Math.sin(phase * Math.PI) * (0.44 + tickPulse * 0.18) * fade;
    context.globalAlpha = alpha;
    context.fillStyle = "rgba(204, 255, 162, 0.58)";
    context.strokeStyle = "rgba(238, 255, 211, 0.72)";
    context.lineWidth = Math.max(0.9, bubbleRadius * 0.18);
    circlePath(context, localX, localY, bubbleRadius);
    context.fill();
    circlePath(context, localX, localY, bubbleRadius);
    context.stroke();
  }
  context.restore();
}

function drawBlackHoleZone(context: CanvasRenderingContext2D, area: BattleGeometryArea, radius: number, progress: number) {
  if (area.x === undefined || area.y === undefined) return;
  const elapsedMs = Math.max(0, area.elapsedMs ?? (area.duration - area.ttl) * 1000);
  const fade = Math.max(0.28, 1 - progress * 0.32);
  const pullPulse = 0.5 + Math.sin(elapsedMs / 92) * 0.5;

  context.save();
  context.translate(area.x, area.y);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.shadowColor = "rgba(185, 185, 205, 0.7)";
  context.shadowBlur = 22;

  const lensGradient = context.createRadialGradient(0, 0, radius * 0.08, 0, 0, radius * 1.02);
  lensGradient.addColorStop(0, "rgba(0, 0, 0, 0.96)");
  lensGradient.addColorStop(0.2, "rgba(3, 5, 6, 0.94)");
  lensGradient.addColorStop(0.34, "rgba(88, 86, 112, 0.2)");
  lensGradient.addColorStop(0.66, "rgba(45, 43, 62, 0.16)");
  lensGradient.addColorStop(1, "rgba(3, 3, 6, 0)");
  context.globalAlpha = 0.88 * fade;
  context.fillStyle = lensGradient;
  circlePath(context, 0, 0, radius);
  context.fill();

  context.globalAlpha = (0.42 + pullPulse * 0.18) * fade;
  context.strokeStyle = "rgba(198, 198, 214, 0.58)";
  context.lineWidth = Math.max(2.4, radius * 0.018);
  circlePath(context, 0, 0, radius * (0.78 + pullPulse * 0.03));
  context.stroke();

  context.globalAlpha = 0.74 * fade;
  for (let ring = 0; ring < 3; ring += 1) {
    const ringProgress = (elapsedMs / 820 + ring / 3) % 1;
    const ringRadius = radius * (0.24 + (1 - ringProgress) * 0.52);
    context.strokeStyle = `rgba(118, 116, 144, ${0.2 + (1 - ringProgress) * 0.26})`;
    context.lineWidth = Math.max(1.1, radius * 0.01);
    circlePath(context, 0, 0, ringRadius);
    context.stroke();
  }

  context.rotate(elapsedMs / 340);
  for (let index = 0; index < 5; index += 1) {
    const angle = index * Math.PI * 2 / 5;
    context.save();
    context.rotate(angle);
    context.strokeStyle = index % 2 === 0 ? "rgba(226, 226, 236, 0.62)" : "rgba(102, 100, 128, 0.48)";
    context.lineWidth = Math.max(2, radius * 0.018);
    context.beginPath();
    context.arc(0, 0, radius * 0.48, -0.44, 0.42);
    context.stroke();
    context.restore();
  }

  context.globalAlpha = 0.98;
  const coreGradient = context.createRadialGradient(0, 0, radius * 0.02, 0, 0, radius * 0.24);
  coreGradient.addColorStop(0, "rgba(0, 0, 0, 1)");
  coreGradient.addColorStop(0.58, "rgba(0, 0, 0, 0.98)");
  coreGradient.addColorStop(0.76, "rgba(178, 176, 205, 0.38)");
  coreGradient.addColorStop(1, "rgba(30, 28, 42, 0)");
  context.fillStyle = coreGradient;
  circlePath(context, 0, 0, radius * (0.2 + pullPulse * 0.03));
  context.fill();
  context.restore();
}

function drawBlizzardZone(context: CanvasRenderingContext2D, area: BattleGeometryArea, radius: number, progress: number) {
  if (area.x === undefined || area.y === undefined) return;
  const elapsedMs = Math.max(0, (area.duration - area.ttl) * 1000);
  const fallProgress = area.hitAtMs && area.hitAtMs > 0 ? clamp(elapsedMs / area.hitAtMs, 0, 1) : clamp(progress * 1.6, 0, 1);
  const fade = Math.max(0, 1 - progress * 0.7);
  const easeOut = (value: number) => 1 - Math.pow(1 - clamp(value, 0, 1), 3);

  context.save();
  context.translate(area.x, area.y);
  context.lineCap = "round";
  context.lineJoin = "round";

  const lanes = [
    { x: -0.34, y: -0.18, phase: 0.0, size: 0.72 },
    { x: -0.08, y: 0.04, phase: 0.12, size: 0.82 },
    { x: 0.22, y: -0.08, phase: 0.24, size: 0.74 },
    { x: 0.46, y: 0.12, phase: 0.36, size: 0.66 },
  ];
  const fallVector = { x: -radius * 0.52, y: radius * 1.42 };
  const fallAngle = Math.atan2(fallVector.y, fallVector.x);
  const laneStates = lanes.map((lane) => {
    const localProgress = clamp((fallProgress - lane.phase) / 0.62, 0, 1);
    const landed = smoothstep(0.82, 1, localProgress);
    const impactPulse = landed * Math.max(0, 1 - Math.max(0, progress - 0.34 - lane.phase * 0.18) / 0.5);
    const impactX = lane.x * radius;
    const impactY = lane.y * radius;
    const startX = impactX - fallVector.x * (0.98 + lane.phase * 0.12);
    const startY = impactY - fallVector.y * (0.98 + lane.phase * 0.12);
    const easedFall = easeOut(localProgress);
    return {
      lane,
      localProgress,
      landed,
      impactPulse,
      impactX,
      impactY,
      shardX: startX + (impactX - startX) * easedFall,
      shardY: startY + (impactY - startY) * easedFall,
    };
  });
  const groundPulse = laneStates.reduce((maxPulse, state) => Math.max(maxPulse, state.impactPulse), 0);

  const groundGradient = context.createRadialGradient(0, 0, radius * 0.08, 0, 0, radius * 0.95);
  groundGradient.addColorStop(0, "rgba(239, 254, 255, 0.42)");
  groundGradient.addColorStop(0.34, "rgba(76, 193, 255, 0.28)");
  groundGradient.addColorStop(0.72, "rgba(18, 111, 178, 0.20)");
  groundGradient.addColorStop(1, "rgba(18, 111, 178, 0)");
  context.globalAlpha = 0.46 * fade * groundPulse;
  context.fillStyle = groundGradient;
  circlePath(context, 0, 0, radius * 0.92);
  context.fill();

  context.strokeStyle = "rgba(169, 238, 255, 0.72)";
  context.lineWidth = Math.max(2, radius * 0.018);
  context.globalAlpha = 0.72 * fade * groundPulse;
  circlePath(context, 0, 0, radius * (0.56 + groundPulse * 0.34));
  context.stroke();

  for (const state of laneStates) {
    const { lane, localProgress, impactX, impactY, shardX, shardY, landed, impactPulse } = state;
    const airborne = Math.max(0, 1 - smoothstep(0.86, 1, localProgress));
    const trailLength = radius * (0.92 + lane.size * 0.34) * (0.8 + localProgress * 0.24);

    if (airborne > 0) {
      context.save();
      context.translate(shardX, shardY);
      context.rotate(fallAngle);
      context.shadowColor = "rgba(177, 247, 255, 0.92)";
      context.shadowBlur = 14;
      context.globalAlpha = (0.5 + localProgress * 0.42) * fade * airborne;
      context.strokeStyle = "rgba(137, 236, 255, 0.72)";
      context.lineWidth = Math.max(1.8, radius * 0.018 * lane.size);
      line(context, -trailLength, 0, -radius * 0.08, 0);
      context.strokeStyle = "rgba(238, 254, 255, 0.9)";
      context.lineWidth = Math.max(1.1, radius * 0.01);
      for (let dot = 0; dot < 7; dot += 1) {
        const dotX = -trailLength * (0.16 + dot * 0.11);
        const dotR = Math.max(0.9, radius * (0.0065 + dot * 0.001));
        circlePath(context, dotX, Math.sin(dot + lane.phase * 8) * radius * 0.022, dotR);
        context.fillStyle = "rgba(217, 254, 255, 0.82)";
        context.fill();
      }
      context.fillStyle = "rgba(238, 254, 255, 0.98)";
      context.strokeStyle = "rgba(63, 188, 245, 0.92)";
      context.lineWidth = Math.max(1, radius * 0.008);
      const shardLength = radius * 0.092 * lane.size;
      const shardWidth = radius * 0.032 * lane.size;
      context.beginPath();
      context.moveTo(shardLength, 0);
      context.lineTo(-shardLength * 0.16, -shardWidth);
      context.lineTo(-shardLength * 0.5, 0);
      context.lineTo(-shardLength * 0.16, shardWidth);
      context.closePath();
      context.fill();
      context.stroke();
      context.restore();
    }

    context.save();
    context.translate(impactX, impactY);
    context.globalAlpha = Math.max(0, (0.18 + impactPulse * 0.78) * fade * landed);
    context.shadowColor = "rgba(203, 249, 255, 0.95)";
    context.shadowBlur = 14;
    context.strokeStyle = "rgba(225, 253, 255, 0.88)";
    context.lineWidth = Math.max(1.5, radius * 0.014);
    circlePath(context, 0, 0, radius * (0.08 + impactPulse * 0.16) * lane.size);
    context.stroke();
    for (let ray = 0; ray < 8; ray += 1) {
      const angle = (ray / 8) * Math.PI * 2;
      const inner = radius * 0.04;
      const outer = radius * (0.08 + impactPulse * 0.18) * lane.size;
      line(context, Math.cos(angle) * inner, Math.sin(angle) * inner * 0.45, Math.cos(angle) * outer, Math.sin(angle) * outer * 0.45);
    }
    context.restore();
  }

  context.globalAlpha = Math.max(0, 0.72 - progress * 0.46) * groundPulse;
  context.strokeStyle = "rgba(245, 254, 255, 0.86)";
  context.lineWidth = Math.max(1.5, radius * 0.015);
  for (let crack = 0; crack < 10; crack += 1) {
    const angle = crack * Math.PI * 0.2 + 0.2;
    const length = radius * (0.18 + (crack % 3) * 0.06);
    const x = Math.cos(angle) * radius * 0.2;
    const y = Math.sin(angle) * radius * 0.1 + 8;
    line(context, x, y, x + Math.cos(angle) * length, y + Math.sin(angle) * length * 0.42);
  }
  context.restore();
}

function drawWhirlwindZone(context: CanvasRenderingContext2D, area: BattleGeometryArea, radius: number, color: string) {
  if (area.x === undefined || area.y === undefined) return;
  const elapsedMs = Math.max(0, area.elapsedMs ?? (area.duration - area.ttl) * 1000);
  const spin = elapsedMs / 82;
  const boost = area.warning ? 1 : 0;
  const coreRadius = radius * (0.44 + boost * 0.08);
  const outerRadius = radius * (0.78 + boost * 0.08);

  context.save();
  context.translate(area.x, area.y);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.shadowColor = "rgba(255, 238, 192, 0.9)";
  context.shadowBlur = 15 + boost * 12;

  const dustGradient = context.createRadialGradient(0, 0, radius * 0.08, 0, 0, radius * 0.58);
  dustGradient.addColorStop(0, "rgba(255, 246, 220, 0.24)");
  dustGradient.addColorStop(0.46, "rgba(198, 178, 138, 0.12)");
  dustGradient.addColorStop(1, "rgba(198, 178, 138, 0)");
  context.globalAlpha = 0.34 + boost * 0.12;
  context.fillStyle = dustGradient;
  circlePath(context, 0, 0, radius * 0.48);
  context.fill();

  context.globalAlpha = 0.92;
  for (let band = 0; band < 6; band += 1) {
    const t = band / 6;
    const bandAngle = spin + band * Math.PI * 0.74;
    const bandRadius = coreRadius + (outerRadius - coreRadius) * (0.2 + t * 0.72);
    const verticalScale = 0.34 + t * 0.08;
    const lineWidth = Math.max(5, radius * (0.075 - t * 0.004)) * (1 + boost * 0.26);
    const alpha = (0.84 - t * 0.055) * (1 + boost * 0.12);
    const bandColor = band % 2 === 0 ? "rgba(255, 250, 224, 0.94)" : "rgba(224, 211, 176, 0.68)";
    drawWhirlwindSweep(context, bandRadius, verticalScale, bandAngle, lineWidth, bandColor, alpha);
  }

  context.shadowBlur = 18 + boost * 10;
  for (let edge = 0; edge < 3; edge += 1) {
    const edgeAngle = -spin * 1.16 + edge * Math.PI * 0.86;
    drawWhirlwindSweep(
      context,
      outerRadius * (0.82 + edge * 0.08),
      0.24 + edge * 0.035,
      edgeAngle,
      Math.max(3.2, radius * 0.038),
      edge === 1 ? color : "rgba(185, 42, 36, 0.82)",
      0.66 + boost * 0.24
    );
  }

  context.restore();
}

function drawWhirlwindSweep(
  context: CanvasRenderingContext2D,
  radius: number,
  verticalScale: number,
  angle: number,
  lineWidth: number,
  color: string,
  alpha: number,
) {
  context.save();
  context.rotate(angle);
  void verticalScale;
  context.globalAlpha *= alpha;
  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  context.beginPath();
  context.arc(0, 0, radius, -0.1, Math.PI * 0.86);
  context.stroke();

  context.globalAlpha *= 0.55;
  context.strokeStyle = "rgba(255, 255, 238, 0.88)";
  context.lineWidth = Math.max(1, lineWidth * 0.34);
  context.beginPath();
  context.arc(0, 0, radius * 0.98, Math.PI * 0.22, Math.PI * 0.62);
  context.stroke();
  context.restore();
}

function drawThundercloudZone(context: CanvasRenderingContext2D, area: BattleGeometryArea, radius: number, color: string, progress: number) {
  if (area.x === undefined || area.y === undefined) return;
  const elapsedMs = Math.max(0, (area.duration - area.ttl) * 1000);
  const hover = Math.sin(elapsedMs / 180) * 3;
  const cloudWidth = Math.max(42, radius * 0.92);
  const cloudHeight = Math.max(22, radius * 0.34);
  const cloudY = -radius * 0.42 + hover;
  const flash = pulse(progress * 2.7 + elapsedMs / 520);
  const tickProgress = clamp(area.tickProgress ?? 0, 0, 1);

  context.save();
  context.translate(area.x, area.y);
  context.shadowColor = color;
  context.shadowBlur = 18;
  context.lineCap = "round";
  context.lineJoin = "round";

  context.globalAlpha = 0.22;
  context.strokeStyle = "rgba(198, 243, 255, 0.58)";
  context.lineWidth = Math.max(1, radius * 0.008);
  context.shadowBlur = 5;
  circlePath(context, 0, 0, radius);
  context.stroke();
  context.shadowBlur = 18;

  const lobes = [
    { x: -0.34, y: 0.1, rx: 0.3, ry: 0.45, fill: "rgba(24, 32, 52, 0.94)" },
    { x: -0.1, y: -0.12, rx: 0.34, ry: 0.58, fill: "rgba(58, 76, 105, 0.95)" },
    { x: 0.2, y: 0.08, rx: 0.36, ry: 0.5, fill: "rgba(18, 24, 42, 0.96)" },
    { x: 0.45, y: -0.04, rx: 0.24, ry: 0.4, fill: "rgba(78, 101, 132, 0.86)" }
  ];
  for (const lobe of lobes) {
    context.fillStyle = lobe.fill;
    context.strokeStyle = "rgba(190, 245, 255, 0.18)";
    context.lineWidth = 1.2;
    context.globalAlpha = 0.92;
    circlePath(context, lobe.x * cloudWidth, cloudY + lobe.y * cloudHeight, Math.max(lobe.rx * cloudWidth, lobe.ry * cloudHeight));
    context.fill();
    context.stroke();
  }

  const barWidth = cloudWidth * 0.58;
  const barHeight = Math.max(4, cloudHeight * 0.12);
  const barX = -barWidth * 0.5;
  const barY = cloudY + cloudHeight * 0.24;
  context.shadowBlur = 8;
  context.globalAlpha = 0.56;
  context.fillStyle = "rgba(5, 9, 18, 0.82)";
  roundRectPath(context, barX, barY, barWidth, barHeight, barHeight * 0.5);
  context.fill();
  context.globalAlpha = 0.34;
  context.strokeStyle = "rgba(215, 252, 255, 0.54)";
  context.lineWidth = 1;
  roundRectPath(context, barX, barY, barWidth, barHeight, barHeight * 0.5);
  context.stroke();
  if (tickProgress > 0.015) {
    const fillWidth = Math.max(barHeight, barWidth * tickProgress);
    context.globalAlpha = 0.42 + tickProgress * 0.34;
    context.fillStyle = "#BDF8FF";
    context.shadowColor = "#BDF8FF";
    context.shadowBlur = 10 + tickProgress * 10;
    roundRectPath(context, barX, barY, fillWidth, barHeight, barHeight * 0.5);
    context.fill();
  }

  context.globalAlpha = 0.3 + flash * 0.34;
  context.strokeStyle = "#EAFDFF";
  context.lineWidth = 2.2;
  drawJaggedBolt(context, -cloudWidth * 0.14, cloudY + cloudHeight * 0.18, -cloudWidth * 0.02, -radius * 0.02, radius * 0.055);
  context.strokeStyle = color;
  context.globalAlpha = 0.22 + flash * 0.28;
  context.lineWidth = 1.6;
  drawJaggedBolt(context, cloudWidth * 0.18, cloudY + cloudHeight * 0.08, cloudWidth * 0.08, radius * 0.1, radius * 0.045);

  context.globalAlpha = 0.12 + flash * 0.08;
  context.fillStyle = "#B8F7FF";
  circlePath(context, 0, cloudY + cloudHeight * 0.2, cloudWidth * 0.42);
  context.fill();
  context.restore();
}

function drawFrostNovaZonePattern(context: CanvasRenderingContext2D, radius: number, color: string, fillProgress: number, warning?: boolean) {
  const patternRadius = radius * (0.32 + fillProgress * 0.5);
  const alpha = (warning ? 0.22 : 0.5) * clamp(fillProgress, 0.18, 1);
  context.save();
  context.strokeStyle = color;
  context.fillStyle = color;
  context.shadowColor = color;
  context.shadowBlur = warning ? 4 : 10;
  context.lineWidth = Math.max(1.5, radius * 0.012);
  context.globalAlpha = alpha;
  for (let index = 0; index < 6; index += 1) {
    const angle = index * Math.PI / 3 - Math.PI / 2;
    const inner = patternRadius * 0.1;
    const outer = patternRadius;
    const innerX = Math.cos(angle) * inner;
    const innerY = Math.sin(angle) * inner;
    const outerX = Math.cos(angle) * outer;
    const outerY = Math.sin(angle) * outer;
    line(context, innerX, innerY, outerX, outerY);
    for (const side of [-1, 1]) {
      const branchAngle = angle + side * Math.PI / 5;
      const branchStart = outer * 0.48;
      const branchEnd = outer * 0.68;
      const startX = Math.cos(angle) * branchStart;
      const startY = Math.sin(angle) * branchStart;
      line(
        context,
        startX,
        startY,
        startX + Math.cos(branchAngle) * branchEnd * 0.24,
        startY + Math.sin(branchAngle) * branchEnd * 0.24
      );
    }
  }
  context.globalAlpha = alpha * 0.72;
  regularPolygonPath(context, 0, 0, Math.max(6, radius * 0.075), 6, Math.PI / 6);
  context.stroke();
  context.restore();
}

function drawRingOfIceNova(context: CanvasRenderingContext2D, area: BattleGeometryArea, radius: number, progress: number) {
  if (area.x === undefined || area.y === undefined) return;
  const visualScale = Math.max(1, area.vfxScale ?? 1);
  const currentRadius = radius * (0.18 + progress * 0.82) * visualScale;
  const ringWidth = Math.max(18, Number(area.ringWidth ?? 48) * (0.62 + progress * 0.38) * visualScale);
  const fade = Math.max(0, 1 - progress * 0.76);
  const wave = Math.sin(progress * Math.PI * 2.2);
  const seedBase = area.id * 37 + Math.round(area.x * 0.1) + Math.round(area.y * 0.1);

  context.save();
  context.translate(area.x, area.y);
  context.lineCap = "round";
  context.lineJoin = "round";

  context.globalAlpha = 0.2 * fade;
  context.fillStyle = "rgba(34, 177, 255, 0.16)";
  circlePath(context, 0, 0, currentRadius + ringWidth * 0.34);
  context.fill();

  const gradient = context.createRadialGradient(0, 0, Math.max(1, currentRadius - ringWidth), 0, 0, currentRadius + ringWidth);
  gradient.addColorStop(0, "rgba(46, 156, 255, 0)");
  gradient.addColorStop(0.42, "rgba(65, 205, 255, 0.2)");
  gradient.addColorStop(0.58, "rgba(196, 249, 255, 0.78)");
  gradient.addColorStop(0.72, "rgba(64, 186, 255, 0.38)");
  gradient.addColorStop(1, "rgba(21, 88, 180, 0)");
  context.globalAlpha = 0.72 * fade;
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(0, 0, currentRadius + ringWidth * 0.55, 0, Math.PI * 2);
  context.arc(0, 0, Math.max(1, currentRadius - ringWidth * 0.55), Math.PI * 2, 0, true);
  context.fill();

  context.shadowColor = "rgba(136, 230, 255, 0.95)";
  context.shadowBlur = 18;
  context.globalAlpha = 0.95 * fade;
  context.strokeStyle = "rgba(201, 250, 255, 0.92)";
  context.lineWidth = ringWidth * 0.42;
  circlePath(context, 0, 0, currentRadius + wave * ringWidth * 0.03);
  context.stroke();

  context.shadowBlur = 8;
  context.globalAlpha = 0.78 * fade;
  context.strokeStyle = "rgba(55, 183, 255, 0.92)";
  context.lineWidth = Math.max(8, ringWidth * 0.16);
  for (let index = 0; index < 3; index += 1) {
    const offset = (index - 1) * ringWidth * 0.34;
    circlePath(context, 0, 0, Math.max(1, currentRadius + offset + Math.sin(progress * Math.PI * 2 + index) * ringWidth * 0.04));
    context.stroke();
  }

  context.shadowBlur = 0;
  for (let index = 0; index < 26; index += 1) {
    const seedA = hashUnit(seedBase + index * 19);
    const seedB = hashUnit(seedBase + index * 43);
    const angle = seedA * Math.PI * 2 + progress * (index % 2 === 0 ? 0.36 : -0.28);
    const splashProgress = (progress + seedB * 0.55) % 1;
    const distanceFromRing = (seedB - 0.5) * ringWidth * 0.95 + Math.sin(splashProgress * Math.PI) * ringWidth * 0.24;
    const splashRadius = Math.max(2.4, ringWidth * (0.045 + hashUnit(seedBase + index * 71) * 0.045));
    const x = Math.cos(angle) * (currentRadius + distanceFromRing);
    const y = Math.sin(angle) * (currentRadius + distanceFromRing);
    context.globalAlpha = Math.sin(splashProgress * Math.PI) * 0.78 * fade;
    context.fillStyle = index % 3 === 0 ? "rgba(233, 254, 255, 0.9)" : "rgba(91, 210, 255, 0.78)";
    circlePath(context, x, y, splashRadius);
    context.fill();
  }

  context.globalAlpha = 0.4 * fade;
  context.strokeStyle = "rgba(224, 253, 255, 0.76)";
  context.lineWidth = Math.max(2, ringWidth * 0.045);
  for (let arcIndex = 0; arcIndex < 8; arcIndex += 1) {
    const start = arcIndex * Math.PI * 0.25 + progress * Math.PI * 0.7;
    const end = start + Math.PI * (0.12 + (arcIndex % 3) * 0.035);
    context.beginPath();
    context.arc(0, 0, currentRadius + Math.sin(arcIndex + progress * 6) * ringWidth * 0.18, start, end);
    context.stroke();
  }

  context.restore();
}

function drawMeleeArc(context: CanvasRenderingContext2D, area: BattleGeometryArea, radius: number, color: string, progress: number) {
  if (area.x === undefined || area.y === undefined) return;
  const direction = normalizedDirection(area.directionX ?? 1, area.directionY ?? 0);
  const angle = Math.atan2(direction.y, direction.x);
  const arc = (area.arcAngle ?? 90) * Math.PI / 180;
  const family = skillEffectFamily(area.vfxKey || area.damageType);
  if (family === "flame_slash") {
    drawFlameSlashSwing(context, area.x, area.y, angle, radius, arc, progress);
    return;
  }
  const visualScale = family === "flame_slash" ? 1 : Math.max(1, area.vfxScale ?? 1);
  const alpha = Math.max(0, 1 - progress * 0.76);
  const slam = Math.sin(Math.min(1, progress / 0.35) * Math.PI);
  const outerRadius = radius * visualScale;
  const innerRadius = outerRadius * (family === "flame_slash" ? 0.64 : 0.72);
  const coreOuterRadius = outerRadius * 0.96;
  const coreInnerRadius = outerRadius * 0.76;
  const trailOuterRadius = outerRadius * 0.88;
  const trailInnerRadius = outerRadius * 0.7;
  const hotCore = "#FFF6D8";
  const hotEdge = "#FFB23C";
  const flameEdge = "#FF3124";
  context.save();
  context.translate(area.x, area.y);
  context.rotate(angle);
  context.globalCompositeOperation = "lighter";
  context.lineCap = "round";
  context.lineJoin = "round";
  context.shadowColor = flameEdge;
  context.shadowBlur = 22;
  context.globalAlpha *= alpha * 0.58;
  context.fillStyle = flameEdge;
  meleeArcWedgePath(context, 0, 0, innerRadius, outerRadius, -arc * 0.5, arc * 0.5);
  context.fill();

  context.shadowColor = hotEdge;
  context.shadowBlur = 16;
  context.globalAlpha = alpha * 0.82;
  context.fillStyle = hotEdge;
  meleeArcWedgePath(context, 0, 0, coreInnerRadius, coreOuterRadius, -arc * 0.46, arc * 0.46);
  context.fill();

  context.shadowColor = hotCore;
  context.shadowBlur = 10;
  context.globalAlpha = alpha * (0.86 + slam * 0.14);
  context.fillStyle = hotCore;
  meleeArcWedgePath(context, 0, 0, outerRadius * 0.82, outerRadius * 0.94, -arc * 0.4, arc * 0.4);
  context.fill();

  context.strokeStyle = hotCore;
  context.shadowBlur = 12;
  context.globalAlpha = alpha;
  context.lineWidth = Math.max(6, radius * 0.045);
  context.beginPath();
  context.arc(0, 0, outerRadius * 0.98, -arc * 0.43, arc * 0.43);
  context.stroke();

  context.shadowBlur = 0;
  context.globalAlpha = alpha * 0.42;
  context.strokeStyle = "#FF6A2C";
  context.lineWidth = Math.max(2, radius * 0.015);
  for (const offset of [0.12, 0.22, 0.32]) {
    context.beginPath();
    context.arc(0, 0, trailOuterRadius - radius * offset, -arc * 0.36, arc * 0.36);
    context.stroke();
  }

  context.globalAlpha = Math.max(0, 0.38 - progress * 0.38);
  context.strokeStyle = color;
  context.lineWidth = Math.max(2, radius * 0.016);
  context.beginPath();
  context.arc(0, 0, trailInnerRadius, -arc * 0.32, arc * 0.32);
  context.stroke();
  context.restore();
}

function drawFlameSlashSwing(context: CanvasRenderingContext2D, x: number, y: number, angle: number, radius: number, arc: number, progress: number) {
  const eased = easeOutCubic(clamp(progress, 0, 1));
  const alpha = Math.max(0, 1 - progress * 0.82);
  const r = Math.max(48, radius);
  const startAngle = -arc * 0.5;
  const endAngle = arc * 0.5;
  const waveRadius = r * eased;
  if (waveRadius <= 1) return;
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.globalCompositeOperation = "lighter";
  context.lineCap = "round";
  context.lineJoin = "round";
  flameSlashDamageClip(context, r, startAngle, endAngle);

  context.shadowColor = "#FF4A18";
  context.shadowBlur = 24;
  context.globalAlpha = alpha * 0.55;
  context.strokeStyle = "#FF4A18";
  context.lineWidth = Math.max(10, r * 0.11);
  context.beginPath();
  context.arc(0, 0, waveRadius, startAngle, endAngle, false);
  context.stroke();

  context.shadowColor = "#FFB13B";
  context.shadowBlur = 18;
  context.globalAlpha = alpha * 0.88;
  context.strokeStyle = "#FFB13B";
  context.lineWidth = Math.max(7, r * 0.075);
  context.beginPath();
  context.arc(0, 0, waveRadius, startAngle, endAngle, false);
  context.stroke();

  context.shadowColor = "#FFF3CF";
  context.shadowBlur = 10;
  context.globalAlpha = alpha;
  context.strokeStyle = "#FFF3CF";
  context.lineWidth = Math.max(3, r * 0.026);
  context.beginPath();
  context.arc(0, 0, waveRadius, startAngle, endAngle, false);
  context.stroke();

  const trailRadius = waveRadius - r * 0.12;
  if (trailRadius > 4) {
    context.shadowBlur = 8;
    context.globalAlpha = alpha * 0.28;
    context.strokeStyle = "#FF7A24";
    context.lineWidth = Math.max(2, r * 0.018);
    context.beginPath();
    context.arc(0, 0, trailRadius, startAngle, endAngle, false);
    context.stroke();
  }
  context.restore();
}

function easeOutCubic(value: number) {
  const t = clamp(value, 0, 1);
  return 1 - Math.pow(1 - t, 3);
}

function flameSlashDamageClip(context: CanvasRenderingContext2D, radius: number, startAngle: number, endAngle: number) {
  context.beginPath();
  context.moveTo(0, 0);
  context.arc(0, 0, radius, startAngle, endAngle, false);
  context.closePath();
  context.clip();
}

function flameSlashCrescentPath(
  context: CanvasRenderingContext2D,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
) {
  context.beginPath();
  context.arc(0, 0, outerRadius, startAngle, endAngle, false);
  context.arc(0, 0, innerRadius, endAngle, startAngle, true);
  context.closePath();
}

function meleeArcWedgePath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
) {
  context.beginPath();
  context.arc(x, y, outerRadius, startAngle, endAngle);
  context.arc(x, y, innerRadius, endAngle, startAngle, true);
  context.closePath();
}

function drawPassiveAura(context: CanvasRenderingContext2D, area: BattleGeometryArea, radius: number, color: string, progress: number) {
  if (area.x === undefined || area.y === undefined) return;
  context.save();
  context.strokeStyle = color;
  context.globalAlpha *= 0.62;
  circle(context, area.x, area.y, radius * (0.92 + pulse(progress) * 0.08));
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

function drawThundercloudChainSegment(context: CanvasRenderingContext2D, area: BattleGeometryArea, color: string, progress: number) {
  if (area.startX === undefined || area.startY === undefined || area.endX === undefined || area.endY === undefined) return;
  const dx = area.endX - area.startX;
  const dy = area.endY - area.startY;
  const length = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / length;
  const ny = dx / length;
  const amplitude = Math.min(16, Math.max(5, length * 0.08));
  const points: Array<{ x: number; y: number }> = [];
  for (let index = 0; index <= 6; index += 1) {
    const t = index / 6;
    const jitter = index === 0 || index === 6 ? 0 : (index % 2 === 0 ? 1 : -1) * amplitude * (0.7 + 0.3 * pulse(progress + index * 0.13));
    points.push({
      x: area.startX + dx * t + nx * jitter,
      y: area.startY + dy * t + ny * jitter
    });
  }

  context.save();
  context.strokeStyle = "#EAFDFF";
  context.shadowColor = color;
  context.shadowBlur = 12;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = 2.1;
  context.globalAlpha *= 0.72;
  polyline(context, points);
  context.stroke();

  context.strokeStyle = color;
  context.lineWidth = 1.2;
  context.globalAlpha *= 0.72;
  for (let index = 1; index < points.length - 1; index += 2) {
    const branch = points[index];
    const sign = index % 4 === 1 ? 1 : -1;
    line(context, branch.x, branch.y, branch.x + nx * amplitude * sign, branch.y + ny * amplitude * sign);
  }
  context.restore();
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
  circlePath(context, x, y, Math.max(radiusX, radiusY));
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
    circlePath(context, x, baseY, Math.max(pedestalX, pedestalY));
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
  const depth = topDownDepth(left.x, left.y) - topDownDepth(right.x, right.y);
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
  const tier = resolveEnemyGeometryTier(enemy);
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

function polyline(context: CanvasRenderingContext2D, points: ReadonlyArray<{ x: number; y: number }>) {
  if (points.length === 0) return;
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) {
    context.lineTo(point.x, point.y);
  }
}

function drawJaggedBolt(context: CanvasRenderingContext2D, startX: number, startY: number, endX: number, endY: number, amplitude: number) {
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / length;
  const ny = dx / length;
  const points: Array<{ x: number; y: number }> = [];
  for (let index = 0; index <= 4; index += 1) {
    const t = index / 4;
    const jitter = index === 0 || index === 4 ? 0 : (index % 2 === 0 ? 1 : -1) * amplitude;
    points.push({
      x: startX + dx * t + nx * jitter,
      y: startY + dy * t + ny * jitter
    });
  }
  polyline(context, points);
  context.stroke();
}

function roundRectPath(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width * 0.5, height * 0.5);
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function circle(context: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  circlePath(context, x, y, radius);
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

function topDownDepth(x: number, y: number) {
  void x;
  return y;
}

function enemyFacingRotation(enemy: BattleGeometryEnemy, snapshot: BattleGeometrySnapshot) {
  if (enemy.runtimeTier === "aware" || enemy.runtimeTier === "active" || enemy.runtimeTier === "visible" || enemy.boss) {
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
  if (projectile.projectileVisualMode === "falling_arrow") return { x: 0, y: 1 };
  const vx = typeof projectile.velocityX === "number" ? projectile.velocityX : projectile.directionX ?? projectile.targetX - projectile.x;
  const vy = typeof projectile.velocityY === "number" ? projectile.velocityY : projectile.directionY ?? projectile.targetY - projectile.y;
  const length = Math.hypot(vx, vy) || 1;
  return { x: vx / length, y: vy / length };
}

function projectileShapeSides(projectile: BattleGeometryProjectile) {
  const token = `${projectile.vfxKey ?? ""} ${projectile.damageType ?? ""}`.toLowerCase();
  if (!projectile.splitProjectile && token.includes("split_firebolt")) return 4;
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

function hashUnit(seed: number) {
  let value = Math.imul(seed || 1, 2654435761);
  value = Math.imul(value ^ (value >>> 16), 2246822519);
  return ((value ^ (value >>> 13)) >>> 0) / 4294967296;
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

function smoothstep(edge0: number, edge1: number, value: number) {
  if (edge0 === edge1) return value < edge0 ? 0 : 1;
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}
