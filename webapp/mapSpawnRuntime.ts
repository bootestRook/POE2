export type ProceduralZoneType =
  | "entrance"
  | "corridor"
  | "main_room"
  | "large_room"
  | "dead_end"
  | "boss_room"
  | "exit_area";

export type ProceduralSpawnRarity = "normal" | "magic" | "rare" | "boss";

export type ProceduralMonsterVisualId = string;

export type ProceduralMapPoint = {
  x: number;
  y: number;
  gridX: number;
  gridY: number;
};

export type ProceduralBattleMapData = {
  id: string;
  displayName: string;
  meta: {
    grid_size: number;
    world_width: number;
    world_height: number;
  };
  gridWidth: number;
  gridHeight: number;
  walkableGrid: boolean[][];
  blockerGrid: boolean[][];
  walkablePoints: ProceduralMapPoint[];
  playerSpawn: ProceduralMapPoint;
  enemySpawnPoints: ProceduralMapPoint[];
  eliteSpawnPoints: ProceduralMapPoint[];
  bossPoints: ProceduralMapPoint[];
  exitPoints: ProceduralMapPoint[];
  zones?: ProceduralMapZone[];
};

export type ProceduralMapZone = {
  id: string;
  zoneType: ProceduralZoneType;
  shape: "rectangle" | "circle" | "polygon";
  points: ProceduralMapPoint[];
  rects?: Array<{ start: ProceduralMapPoint; end: ProceduralMapPoint }>;
};

export type MapSpawnZoneRule = {
  enabled: boolean;
  allowed_pack_tags: string[];
  fixed_pack_id?: string;
  fixed_pack_ids?: string[];
  max_pack_budget_cost?: number;
  rarity_bias?: "magic" | "rare";
};

export type MapSpawnProfile = {
  map_type: string;
  base_pack_budget: number;
  min_distance_from_player_spawn: number;
  min_distance_between_packs: number;
  max_active_packs: number;
  max_non_boss_monster_varieties?: number;
  max_boss_packs?: number;
  zone_rules: Record<ProceduralZoneType, MapSpawnZoneRule>;
};

export type MonsterPackEntry = {
  monster_id: ProceduralMonsterVisualId;
  count_min: number;
  count_max: number;
  life: number;
  damage: number;
  boss?: boolean;
  offense?: MonsterOffenseConfig;
};

export type MonsterPackDefinition = {
  pack_id: string;
  tags: string[];
  weight: number;
  budget_cost: number;
  entries: MonsterPackEntry[];
};

export type MonsterOffenseConfig = {
  damage_type?: string;
  hit_kind?: "attack" | "spell";
  attack_range?: number;
  attack_cadence_ms?: number;
  modifiers?: Record<string, number>;
};

export type MonsterRarityRules = {
  normal_weight: number;
  magic_weight: number;
  rare_weight: number;
  max_magic_monsters_per_map?: number;
  max_rare_per_map: number;
  max_magic_packs_per_map: number;
  magic_allowed_zone_types: ProceduralZoneType[];
  rare_allowed_zone_types: ProceduralZoneType[];
  multipliers: Record<ProceduralSpawnRarity, { life_multiplier: number; damage_multiplier: number }>;
};

export type MapSpawnV1Config = {
  map_spawn_profiles: MapSpawnProfile[];
  monster_packs: MonsterPackDefinition[];
  monster_rarity_rules: MonsterRarityRules;
  monster_offense_defaults?: MonsterOffenseConfig;
};

export type ProceduralSpawnFilterReason =
  | "入口区域不刷怪"
  | "距离玩家出生点过近"
  | "不可行走"
  | "阻挡格"
  | "怪物包距离过近"
  | "预算不足"
  | "区域规则不允许";

export type ProceduralSpawnPointDebug = {
  x: number;
  y: number;
  gridX: number;
  gridY: number;
  zone_type: ProceduralZoneType;
  monster_pack_id: string | null;
  accepted: boolean;
  filter_reason: ProceduralSpawnFilterReason | null;
};

export type ProceduralMonsterInstance = {
  runtime_id: number;
  monster_id: ProceduralMonsterVisualId;
  monster_pack_id: string;
  zone_type: ProceduralZoneType;
  spawn_rarity: ProceduralSpawnRarity;
  x: number;
  y: number;
  hp: number;
  max_hp: number;
  base_damage: number;
  damage_type: string;
  hit_kind: "attack" | "spell";
  attack_range: number;
  attack_cadence_ms: number;
  offense_modifiers: Record<string, number>;
  damage_multiplier: number;
  life_multiplier: number;
  boss: boolean;
  aggro_source_id: string;
};

export type ProceduralAggroSource = {
  id: string;
  kind: "monster" | "boss";
  x: number;
  y: number;
  aggroRadius: number;
};

export type ProceduralSpawnDebugSummary = {
  map_type: string;
  base_pack_budget: number;
  spent_pack_budget: number;
  generated_pack_count: number;
  normal_monster_count: number;
  magic_monster_count: number;
  rare_monster_count: number;
  boss_monster_count: number;
  spawn_points: ProceduralSpawnPointDebug[];
  filtered_points: ProceduralSpawnPointDebug[];
};

export type ProceduralSpawnResult = {
  enemies: ProceduralMonsterInstance[];
  aggroSources: ProceduralAggroSource[];
  nextId: number;
  debug: ProceduralSpawnDebugSummary;
};

export type ProceduralSpawnOptions = {
  mapType?: string;
  seed?: string;
  startId?: number;
  maxCandidatePoints?: number;
};

type CandidatePoint = ProceduralMapPoint & {
  zone_type: ProceduralZoneType;
  priority: number;
};

type MutableRarityState = {
  rareCount: number;
  magicCount: number;
  magicPackCount: number;
};

type MutableVarietyState = {
  allowedNonBossMonsterIds: Set<string>;
  bossPackCount: number;
};

const DEFAULT_AGGRO_RADIUS_CELLS = 7;
const LARGE_ROOM_SAMPLE_RADIUS_CELLS = 3;

export function generateProceduralMonsterSpawns(
  map: ProceduralBattleMapData,
  config: MapSpawnV1Config,
  options: ProceduralSpawnOptions = {}
): ProceduralSpawnResult {
  const profile = selectSpawnProfile(config, options.mapType);
  const rng = createSeededRandom(options.seed ?? `${map.id}:${profile.map_type}:procedural-spawn-v1`);
  const maxCandidatePoints = Math.max(12, Math.floor(options.maxCandidatePoints ?? 180));
  const candidates = collectSpawnCandidates(map, profile, maxCandidatePoints);
  const packsById = new Map(config.monster_packs.map((pack) => [pack.pack_id, pack]));
  const debugPoints: ProceduralSpawnPointDebug[] = [];
  const filteredPoints: ProceduralSpawnPointDebug[] = [];
  const enemies: ProceduralMonsterInstance[] = [];
  const aggroSources: ProceduralAggroSource[] = [];
  const acceptedCenters: { x: number; y: number }[] = [];
  const rarityState: MutableRarityState = { rareCount: 0, magicCount: 0, magicPackCount: 0 };
  const varietyState: MutableVarietyState = {
    allowedNonBossMonsterIds: selectMapMonsterVarieties(config.monster_packs, profile, rng),
    bossPackCount: 0
  };
  let spentBudget = 0;
  let acceptedPackCount = 0;
  let nextId = Math.max(1, Math.floor(options.startId ?? 1));

  for (const candidate of candidates) {
    if (acceptedPackCount >= profile.max_active_packs) break;
    const rule = profile.zone_rules[candidate.zone_type];
    const baseDebug = spawnPointDebug(candidate, null, false, null);
    const filterReason = filterCandidate(map, profile, candidate, rule, acceptedCenters);
    if (filterReason) {
      const rejected: ProceduralSpawnPointDebug = { ...baseDebug, filter_reason: filterReason };
      debugPoints.push(rejected);
      filteredPoints.push(rejected);
      continue;
    }

    const pack = choosePackForZone(config.monster_packs, packsById, rule, profile, candidate.zone_type, profile.base_pack_budget - spentBudget, varietyState, rng);
    if (!pack) {
      const reason: ProceduralSpawnFilterReason = spentBudget >= profile.base_pack_budget ? "预算不足" : "区域规则不允许";
      const rejected: ProceduralSpawnPointDebug = { ...baseDebug, filter_reason: reason };
      debugPoints.push(rejected);
      filteredPoints.push(rejected);
      continue;
    }
    if (spentBudget + pack.budget_cost > profile.base_pack_budget) {
      const rejected: ProceduralSpawnPointDebug = { ...baseDebug, monster_pack_id: pack.pack_id, filter_reason: "预算不足" };
      debugPoints.push(rejected);
      filteredPoints.push(rejected);
      continue;
    }

    const aggroSourceId = `proc_${acceptedPackCount + 1}_${candidate.zone_type}`;
    const packMonsters = instantiatePack(candidate, pack, map, config.monster_rarity_rules, config.monster_offense_defaults, rarityState, varietyState, aggroSourceId, nextId, rng);
    if (packMonsters.length === 0) {
      const rejected: ProceduralSpawnPointDebug = { ...baseDebug, monster_pack_id: pack.pack_id, filter_reason: "不可行走" };
      debugPoints.push(rejected);
      filteredPoints.push(rejected);
      continue;
    }

    nextId += packMonsters.length;
    enemies.push(...packMonsters);
    if (packMonsters.some((monster) => monster.boss)) varietyState.bossPackCount += 1;
    acceptedCenters.push({ x: candidate.x, y: candidate.y });
    spentBudget += pack.budget_cost;
    acceptedPackCount += 1;
    aggroSources.push({
      id: aggroSourceId,
      kind: packMonsters.some((monster) => monster.boss) ? "boss" : "monster",
      x: candidate.x,
      y: candidate.y,
      aggroRadius: Math.max(map.meta.grid_size * DEFAULT_AGGRO_RADIUS_CELLS, map.meta.grid_size)
    });
    debugPoints.push(spawnPointDebug(candidate, pack.pack_id, true, null));
  }

  return {
    enemies,
    aggroSources,
    nextId,
    debug: {
      map_type: profile.map_type,
      base_pack_budget: profile.base_pack_budget,
      spent_pack_budget: spentBudget,
      generated_pack_count: acceptedPackCount,
      normal_monster_count: enemies.filter((enemy) => enemy.spawn_rarity === "normal").length,
      magic_monster_count: enemies.filter((enemy) => enemy.spawn_rarity === "magic").length,
      rare_monster_count: enemies.filter((enemy) => enemy.spawn_rarity === "rare").length,
      boss_monster_count: enemies.filter((enemy) => enemy.spawn_rarity === "boss" || enemy.boss).length,
      spawn_points: debugPoints,
      filtered_points: filteredPoints
    }
  };
}

export function selectSpawnProfile(config: MapSpawnV1Config, mapType?: string): MapSpawnProfile {
  const profile = config.map_spawn_profiles.find((item) => item.map_type === mapType) ?? config.map_spawn_profiles[0];
  if (!profile) throw new Error("程序化生怪配置缺少 map_spawn_profiles。");
  return profile;
}

export function collectSpawnCandidates(map: ProceduralBattleMapData, profile: MapSpawnProfile, maxCandidates: number): CandidatePoint[] {
  const candidates = new Map<string, CandidatePoint>();
  const addCandidate = (point: ProceduralMapPoint, zoneType?: ProceduralZoneType, priority = 3) => {
    const normalized = normalizePoint(map, point);
    const key = `${normalized.gridX},${normalized.gridY}`;
    const next: CandidatePoint = {
      ...normalized,
      zone_type: zoneType ?? classifyZoneType(map, normalized, profile),
      priority
    };
    const previous = candidates.get(key);
    if (!previous || next.priority < previous.priority) candidates.set(key, next);
  };

  addCandidate(map.playerSpawn, "entrance", 0);
  for (const point of map.bossPoints) addCandidate(point, "boss_room", 0);
  for (const point of map.exitPoints) addCandidate(point, "exit_area", 1);
  for (const point of map.eliteSpawnPoints) addCandidate(point, undefined, 1);
  for (const point of map.enemySpawnPoints) addCandidate(point, undefined, 2);

  const walkable = [...map.walkablePoints]
    .sort((a, b) => stablePointScore(map.id, a) - stablePointScore(map.id, b))
    .slice(0, maxCandidates);
  for (const point of walkable) addCandidate(point, undefined, 4);

  return [...candidates.values()]
    .sort((a, b) => a.priority - b.priority || stablePointScore(map.id, a) - stablePointScore(map.id, b));
}

export function classifyZoneType(map: ProceduralBattleMapData, point: ProceduralMapPoint, profile: MapSpawnProfile): ProceduralZoneType {
  const authoredZone = map.zones?.find((zone) => proceduralZoneContainsPoint(zone, point));
  if (authoredZone) return authoredZone.zoneType;
  if (distance(point, map.playerSpawn) < profile.min_distance_from_player_spawn) return "entrance";
  if (map.bossPoints.some((bossPoint) => distance(point, bossPoint) <= map.meta.grid_size * 4)) return "boss_room";
  if (map.exitPoints.some((exitPoint) => distance(point, exitPoint) <= map.meta.grid_size * 4)) return "exit_area";

  const cardinal = [
    isGridWalkable(map, point.gridX + 1, point.gridY),
    isGridWalkable(map, point.gridX - 1, point.gridY),
    isGridWalkable(map, point.gridX, point.gridY + 1),
    isGridWalkable(map, point.gridX, point.gridY - 1)
  ].filter(Boolean).length;
  if (cardinal <= 2) return "corridor";

  const roomScore = countWalkableCellsNear(map, point.gridX, point.gridY, LARGE_ROOM_SAMPLE_RADIUS_CELLS);
  if (roomScore >= 38) return "large_room";
  return "main_room";
}

function proceduralZoneContainsPoint(zone: ProceduralMapZone, point: ProceduralMapPoint) {
  if (zone.rects?.some((rect) => proceduralRectContainsPoint(rect.start, rect.end, point))) return true;
  if (zone.shape === "circle") {
    const [center, edge] = zone.points;
    return Boolean(center && edge && distance(point, center) <= distance(center, edge));
  }
  if (zone.shape === "polygon") {
    return pointInPolygon(point, zone.points);
  }
  const [a, b] = zone.points;
  if (!a || !b) return false;
  return proceduralRectContainsPoint(a, b, point);
}

function proceduralRectContainsPoint(a: ProceduralMapPoint, b: ProceduralMapPoint, point: ProceduralMapPoint) {
  return point.gridX >= Math.min(a.gridX, b.gridX)
    && point.gridX <= Math.max(a.gridX, b.gridX)
    && point.gridY >= Math.min(a.gridY, b.gridY)
    && point.gridY <= Math.max(a.gridY, b.gridY);
}

function pointInPolygon(point: ProceduralMapPoint, polygon: ProceduralMapPoint[]) {
  if (polygon.length < 3) return false;
  let inside = false;
  const x = point.gridX + 0.5;
  const y = point.gridY + 0.5;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].gridX + 0.5;
    const yi = polygon[i].gridY + 0.5;
    const xj = polygon[j].gridX + 0.5;
    const yj = polygon[j].gridY + 0.5;
    const crosses = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

export function createSeededRandom(seedText: string): () => number {
  let seed = 2166136261;
  for (let index = 0; index < seedText.length; index += 1) {
    seed ^= seedText.charCodeAt(index);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed += 0x6D2B79F5;
    let value = seed;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function filterCandidate(
  map: ProceduralBattleMapData,
  profile: MapSpawnProfile,
  candidate: CandidatePoint,
  rule: MapSpawnZoneRule | undefined,
  acceptedCenters: { x: number; y: number }[]
): ProceduralSpawnFilterReason | null {
  if (!rule?.enabled || candidate.zone_type === "entrance") return "入口区域不刷怪";
  if (!isGridWalkable(map, candidate.gridX, candidate.gridY)) return "不可行走";
  if (isGridBlocked(map, candidate.gridX, candidate.gridY)) return "阻挡格";
  if (distance(candidate, map.playerSpawn) < profile.min_distance_from_player_spawn) return "距离玩家出生点过近";
  if (acceptedCenters.some((center) => distance(candidate, center) < profile.min_distance_between_packs)) return "怪物包距离过近";
  return null;
}

function choosePackForZone(
  packs: MonsterPackDefinition[],
  packsById: Map<string, MonsterPackDefinition>,
  rule: MapSpawnZoneRule,
  profile: MapSpawnProfile,
  zoneType: ProceduralZoneType,
  remainingBudget: number,
  varietyState: MutableVarietyState,
  rng: () => number
) {
  if (rule.fixed_pack_ids?.length) {
    if (varietyState.bossPackCount >= maxBossPacks(profile)) return null;
    const fixed = rule.fixed_pack_ids
      .map((packId) => packsById.get(packId))
      .filter((pack): pack is MonsterPackDefinition => Boolean(pack) && pack.budget_cost <= remainingBudget);
    return fixed.length > 0 ? weightedChoice(fixed, (pack) => pack.weight, rng) : null;
  }
  if (rule.fixed_pack_id) {
    if (varietyState.bossPackCount >= maxBossPacks(profile)) return null;
    const fixed = packsById.get(rule.fixed_pack_id);
    return fixed && fixed.budget_cost <= remainingBudget ? fixed : null;
  }
  const allowed = packs.filter((pack) => {
    if (pack.budget_cost > remainingBudget) return false;
    if (rule.max_pack_budget_cost !== undefined && pack.budget_cost > rule.max_pack_budget_cost) return false;
    if (pack.tags.includes("boss")) return false;
    if (!packHasAllowedMonster(pack, varietyState.allowedNonBossMonsterIds)) return false;
    return rule.allowed_pack_tags.some((tag) => pack.tags.includes(tag));
  });
  if (allowed.length === 0) return null;
  const biased = zoneType === "large_room" ? allowed.filter((pack) => pack.tags.includes("dense") || pack.tags.includes("guard")) : allowed;
  return weightedChoice(biased.length > 0 ? biased : allowed, (pack) => pack.weight, rng);
}

function selectMapMonsterVarieties(packs: MonsterPackDefinition[], profile: MapSpawnProfile, rng: () => number) {
  const maxVarieties = Math.max(1, Math.floor(profile.max_non_boss_monster_varieties ?? 999));
  const allIds = uniqueNonBossMonsterIds(packs);
  if (allIds.length <= maxVarieties) return new Set(allIds);

  const normal = shuffled(allIds.filter((id) => /^mon_100\d{3}$/.test(id)), rng);
  const magic = shuffled(allIds.filter((id) => /^mon_200\d{3}$/.test(id)), rng);
  const rare = shuffled(allIds.filter((id) => /^mon_300\d{3}$/.test(id)), rng);
  const other = shuffled(allIds.filter((id) => !/^mon_[123]00\d{3}$/.test(id)), rng);
  const chosen: string[] = [];
  const add = (ids: string[], count: number) => {
    for (const id of ids) {
      if (chosen.length >= maxVarieties || count <= 0) break;
      if (!chosen.includes(id)) {
        chosen.push(id);
        count -= 1;
      }
    }
  };

  add(normal, Math.min(2, maxVarieties));
  add(magic, maxVarieties > 2 ? 1 : 0);
  add(rare, maxVarieties > 3 ? 1 : 0);
  add([...normal, ...magic, ...rare, ...other], maxVarieties - chosen.length);
  return new Set(chosen.slice(0, maxVarieties));
}

function uniqueNonBossMonsterIds(packs: MonsterPackDefinition[]) {
  return [...new Set(packs.flatMap((pack) => pack.entries.filter((entry) => !entry.boss && !/^mon_400\d{3}$/.test(entry.monster_id)).map((entry) => entry.monster_id)))];
}

function packHasAllowedMonster(pack: MonsterPackDefinition, allowedNonBossMonsterIds: Set<string>) {
  return pack.entries.some((entry) => !entry.boss && allowedNonBossMonsterIds.has(entry.monster_id));
}

function maxBossPacks(profile: MapSpawnProfile) {
  return Math.max(0, Math.floor(profile.max_boss_packs ?? 1));
}

function maxMagicMonsters(rules: MonsterRarityRules) {
  return Math.max(0, Math.floor(rules.max_magic_monsters_per_map ?? Number.POSITIVE_INFINITY));
}

function shuffled<T>(items: T[], rng: () => number) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function instantiatePack(
  center: CandidatePoint,
  pack: MonsterPackDefinition,
  map: ProceduralBattleMapData,
  rarityRules: MonsterRarityRules,
  offenseDefaults: MonsterOffenseConfig | undefined,
  rarityState: MutableRarityState,
  varietyState: MutableVarietyState,
  aggroSourceId: string,
  startId: number,
  rng: () => number
) {
  const monsters: ProceduralMonsterInstance[] = [];
  let nextId = startId;
  let monsterIndex = 0;
  let packHasMagic = false;
  for (const entry of pack.entries) {
    if (!entry.boss && !varietyState.allowedNonBossMonsterIds.has(entry.monster_id)) continue;
    const count = randomInt(entry.count_min, entry.count_max, rng);
    for (let index = 0; index < count; index += 1) {
      const point = findPackMonsterPoint(map, center, monsterIndex, rng);
      if (!point) continue;
      const rarity = chooseMonsterRarity(entry.monster_id, center.zone_type, entry.boss === true, packHasMagic, rarityRules, rarityState, rng);
      if (rarity === "magic" && rarityState.magicCount >= maxMagicMonsters(rarityRules)) continue;
      if (rarity === "rare" && rarityState.rareCount >= rarityRules.max_rare_per_map) continue;
      if (rarity === "magic") packHasMagic = true;
      if (rarity === "magic") rarityState.magicCount += 1;
      if (rarity === "rare") rarityState.rareCount += 1;
      const multiplier = rarityRules.multipliers[rarity] ?? rarityRules.multipliers.normal;
      const offense = mergeMonsterOffense(offenseDefaults, entry.offense);
      monsters.push({
        runtime_id: nextId++,
        monster_id: entry.monster_id,
        monster_pack_id: pack.pack_id,
        zone_type: center.zone_type,
        spawn_rarity: rarity,
        x: point.x,
        y: point.y,
        hp: Math.round(entry.life * multiplier.life_multiplier),
        max_hp: Math.round(entry.life * multiplier.life_multiplier),
        base_damage: entry.damage,
        damage_type: offense.damage_type,
        hit_kind: offense.hit_kind,
        attack_range: offense.attack_range,
        attack_cadence_ms: offense.attack_cadence_ms,
        offense_modifiers: offense.modifiers,
        damage_multiplier: multiplier.damage_multiplier,
        life_multiplier: multiplier.life_multiplier,
        boss: entry.boss === true,
        aggro_source_id: aggroSourceId
      });
      monsterIndex += 1;
    }
  }
  if (packHasMagic) rarityState.magicPackCount += 1;
  return monsters;
}

function mergeMonsterOffense(defaults: MonsterOffenseConfig | undefined, override: MonsterOffenseConfig | undefined) {
  return {
    damage_type: String(override?.damage_type ?? defaults?.damage_type ?? "physical"),
    hit_kind: (override?.hit_kind ?? defaults?.hit_kind ?? "attack") === "spell" ? "spell" as const : "attack" as const,
    attack_range: Math.max(1, Number(override?.attack_range ?? defaults?.attack_range ?? 96)),
    attack_cadence_ms: Math.max(120, Number(override?.attack_cadence_ms ?? defaults?.attack_cadence_ms ?? 1160)),
    modifiers: {
      ...(defaults?.modifiers ?? {}),
      ...(override?.modifiers ?? {})
    }
  };
}

function chooseMonsterRarity(
  monsterId: string,
  zoneType: ProceduralZoneType,
  boss: boolean,
  packHasMagic: boolean,
  rules: MonsterRarityRules,
  rarityState: MutableRarityState,
  rng: () => number
): ProceduralSpawnRarity {
  const configured = configuredMonsterRarity(monsterId, boss);
  if (configured) return configured;
  return chooseRarity(zoneType, boss, packHasMagic, rules, rarityState, rng);
}

function configuredMonsterRarity(monsterId: string, boss: boolean): ProceduralSpawnRarity | null {
  if (boss || /^mon_400\d{3}$/.test(monsterId)) return "boss";
  if (/^mon_300\d{3}$/.test(monsterId)) return "rare";
  if (/^mon_200\d{3}$/.test(monsterId)) return "magic";
  if (/^mon_100\d{3}$/.test(monsterId)) return "normal";
  return null;
}

function chooseRarity(
  zoneType: ProceduralZoneType,
  boss: boolean,
  packHasMagic: boolean,
  rules: MonsterRarityRules,
  rarityState: MutableRarityState,
  rng: () => number
): ProceduralSpawnRarity {
  if (boss) {
    return "boss";
  }
  const rareAllowed = rules.rare_allowed_zone_types.includes(zoneType) && rarityState.rareCount < rules.max_rare_per_map;
  const magicAllowed = rules.magic_allowed_zone_types.includes(zoneType)
    && rarityState.magicCount < maxMagicMonsters(rules)
    && (packHasMagic || rarityState.magicPackCount < rules.max_magic_packs_per_map);
  const choices: { rarity: ProceduralSpawnRarity; weight: number }[] = [
    { rarity: "normal", weight: rules.normal_weight }
  ];
  if (magicAllowed) choices.push({ rarity: "magic", weight: rules.magic_weight });
  if (rareAllowed) choices.push({ rarity: "rare", weight: rules.rare_weight });
  const rarity = weightedChoice(choices, (choice) => choice.weight, rng).rarity;
  return rarity;
}

function findPackMonsterPoint(map: ProceduralBattleMapData, center: CandidatePoint, monsterIndex: number, rng: () => number): ProceduralMapPoint | null {
  const cellRadius = Math.max(1, Math.min(4, Math.ceil(Math.sqrt(monsterIndex + 1))));
  const attempts = 10;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const angle = ((monsterIndex * 137.5 + attempt * 41) * Math.PI) / 180;
    const radius = map.meta.grid_size * (0.35 + rng() * cellRadius);
    const point = normalizePoint(map, {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
      gridX: center.gridX,
      gridY: center.gridY
    });
    if (isGridWalkable(map, point.gridX, point.gridY) && !isGridBlocked(map, point.gridX, point.gridY)) return point;
  }
  return isGridWalkable(map, center.gridX, center.gridY) && !isGridBlocked(map, center.gridX, center.gridY) ? center : null;
}

function normalizePoint(map: ProceduralBattleMapData, point: ProceduralMapPoint): ProceduralMapPoint {
  const x = clamp(point.x, 0, Math.max(0, map.meta.world_width - 1));
  const y = clamp(point.y, 0, Math.max(0, map.meta.world_height - 1));
  return {
    x,
    y,
    gridX: clamp(Math.floor(x / map.meta.grid_size), 0, map.gridWidth - 1),
    gridY: clamp(Math.floor(y / map.meta.grid_size), 0, map.gridHeight - 1)
  };
}

function spawnPointDebug(
  candidate: CandidatePoint,
  packId: string | null,
  accepted: boolean,
  reason: ProceduralSpawnFilterReason | null
): ProceduralSpawnPointDebug {
  return {
    x: candidate.x,
    y: candidate.y,
    gridX: candidate.gridX,
    gridY: candidate.gridY,
    zone_type: candidate.zone_type,
    monster_pack_id: packId,
    accepted,
    filter_reason: reason
  };
}

function isGridWalkable(map: ProceduralBattleMapData, gridX: number, gridY: number) {
  return Boolean(map.walkableGrid[gridY]?.[gridX]);
}

function isGridBlocked(map: ProceduralBattleMapData, gridX: number, gridY: number) {
  return Boolean(map.blockerGrid[gridY]?.[gridX]);
}

function countWalkableCellsNear(map: ProceduralBattleMapData, gridX: number, gridY: number, radius: number) {
  let count = 0;
  for (let y = gridY - radius; y <= gridY + radius; y += 1) {
    for (let x = gridX - radius; x <= gridX + radius; x += 1) {
      if (isGridWalkable(map, x, y) && !isGridBlocked(map, x, y)) count += 1;
    }
  }
  return count;
}

function weightedChoice<T>(items: T[], weight: (item: T) => number, rng: () => number): T {
  const total = items.reduce((sum, item) => sum + Math.max(0, weight(item)), 0);
  if (total <= 0) return items[0];
  let roll = rng() * total;
  for (const item of items) {
    roll -= Math.max(0, weight(item));
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

function randomInt(min: number, max: number, rng: () => number) {
  const low = Math.ceil(Math.min(min, max));
  const high = Math.floor(Math.max(min, max));
  return low + Math.floor(rng() * (high - low + 1));
}

function stablePointScore(seed: string, point: { gridX: number; gridY: number }) {
  let value = 2166136261;
  const text = `${seed}:${point.gridX},${point.gridY}`;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
