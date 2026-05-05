import equipmentData from "./frontendEquipmentData.json";

export type FrontendEquipmentAffixDefinition = {
  affix_id: string;
  source_modifier_id: string;
  source: string;
  library: "base" | "initial" | "advanced" | "pinnacle" | string;
  gen: "base" | "prefix" | "suffix" | string;
  tier: number;
  required_level: number;
  weight: number;
  effect: string;
  family_id: string;
  enabled: boolean;
  disabled_reason: string;
  operations?: FrontendEquipmentEffectOperation[];
};

export type FrontendEquipmentEffectOperation = {
  kind: string;
  stat: string;
  value: number;
  value_min: number | null;
  value_max: number | null;
  runtime_hook: string;
  payload: Record<string, unknown> | null;
  source_text: string;
};

export type FrontendEquipmentAffixRoll = {
  affix_id: string;
  source_modifier_id: string;
  library: string;
  gen: string;
  tier: number;
  effect: string;
  family_id: string;
  operations: FrontendEquipmentEffectOperation[];
};

export type FrontendEquipmentItem = {
  source: string;
  level: number;
  rarity: string;
  base_affix: FrontendEquipmentAffixRoll;
  prefix_affixes: FrontendEquipmentAffixRoll[];
  suffix_affixes: FrontendEquipmentAffixRoll[];
};

export type FrontendEquipmentStatModifier = {
  source_modifier_id: string;
  kind: string;
  stat: string;
  value: number;
  value_min?: number | null;
  value_max?: number | null;
  reason_key: string;
  runtime_hook?: string;
  payload?: Record<string, unknown> | null;
};

const DEFINITIONS = (equipmentData as { definitions: FrontendEquipmentAffixDefinition[] }).definitions;
const DEFINITIONS_BY_ID = new Map(DEFINITIONS.map((definition) => [definition.affix_id, definition]));
const SOURCE_OPTIONS = Array.from(new Set(DEFINITIONS.filter((definition) => definition.library === "base").map((definition) => definition.source))).sort();
const FRONTEND_BASE_MOVE_SPEED = 250;

const RARITY_COUNTS: Record<string, [number, number]> = {
  white: [0, 0],
  blue: [1, 2],
  purple: [3, 5],
  pink: [6, 6],
};

export function frontendEquipmentSources() {
  return SOURCE_OPTIONS.map((source) => ({ id: source, name_text: source }));
}

export function frontendEquipmentRarities() {
  return [
    { id: "white", name_text: "白色", affix_count: 0 },
    { id: "blue", name_text: "蓝色", affix_count: 2 },
    { id: "purple", name_text: "紫色", affix_count: 5 },
    { id: "pink", name_text: "粉色", affix_count: 6 },
  ];
}

export function frontendEquipmentRarityText(rarity: string) {
  return frontendEquipmentRarities().find((item) => item.id === rarity)?.name_text ?? rarity;
}

export function frontendEquipmentRarityForAffixCount(count: number) {
  if (count <= 0) return "white";
  if (count <= 2) return "blue";
  if (count <= 5) return "purple";
  return "pink";
}

export function prefixSuffixCapacity(level: number): { prefix: number; suffix: number } {
  if (level <= 10) return { prefix: 1, suffix: 0 };
  if (level <= 25) return { prefix: 1, suffix: 1 };
  if (level <= 40) return { prefix: 2, suffix: 1 };
  if (level <= 60) return { prefix: 2, suffix: 2 };
  if (level <= 80) return { prefix: 3, suffix: 2 };
  return { prefix: 3, suffix: 3 };
}

export function frontendEquipmentAffixOptions(source: string, level: number) {
  return DEFINITIONS
    .filter((definition) => definition.source === source && definition.enabled && definition.required_level <= level)
    .map((definition) => ({
      id: definition.affix_id,
      name_text: frontendEquipmentAffixDefinitionText(definition),
      effect_text: definition.effect,
      library: definition.library,
      gen: definition.gen,
      tier: definition.tier,
      family_id: definition.family_id,
      required_level: definition.required_level,
    }));
}

export function chooseFrontendEquipmentSource(seed: number) {
  if (SOURCE_OPTIONS.length === 0) return "装备";
  return SOURCE_OPTIONS[Math.floor(seedRandom(seed).nextFloat() * SOURCE_OPTIONS.length) % SOURCE_OPTIONS.length];
}

export function generateFrontendEquipment(source: string, level: number, rarity: string, seed: number): FrontendEquipmentItem {
  const rng = seedRandom(seed);
  const normalizedLevel = clampInt(level, 1, 100);
  const [minCount, maxCount] = RARITY_COUNTS[rarity] ?? RARITY_COUNTS.white;
  const rolledCount = maxCount > minCount ? rng.nextInt(minCount, maxCount) : minCount;
  const capacity = prefixSuffixCapacity(normalizedLevel);
  const targetCount = Math.min(rolledCount, capacity.prefix + capacity.suffix);
  let item: FrontendEquipmentItem = {
    source,
    level: normalizedLevel,
    rarity,
    base_affix: rollDefinition(weightedChoice(baseCandidates(source), rng), rng),
    prefix_affixes: [],
    suffix_affixes: [],
  };

  for (let index = 0; index < targetCount; index += 1) {
    const options = randomGenerationOptions(item);
    if (options.length === 0) break;
    const option = options[rng.nextInt(0, options.length - 1)];
    item = addAffixRoll(item, rollDefinition(weightedChoice(option.candidates, rng), rng));
  }
  return item;
}

export function createSpecifiedFrontendEquipment(source: string, level: number, affixIds: string[], seed: number): FrontendEquipmentItem {
  const rng = seedRandom(seed);
  const normalizedLevel = clampInt(level, 1, 100);
  const selectedBaseDefinitions: FrontendEquipmentAffixDefinition[] = [];
  const ordinaryDefinitions: FrontendEquipmentAffixDefinition[] = [];
  for (const affixId of affixIds) {
    const definition = DEFINITIONS_BY_ID.get(affixId);
    if (!definition || !definition.enabled || definition.source !== source || definition.required_level > normalizedLevel) {
      throw new Error(`GM 装备词缀不匹配当前装备类型或等级：${affixId}`);
    }
    if (definition.library === "base") selectedBaseDefinitions.push(definition);
    else ordinaryDefinitions.push(definition);
  }
  if (selectedBaseDefinitions.length > 1) throw new Error("GM 装备只能选择 1 条基础词缀。");

  const capacity = prefixSuffixCapacity(normalizedLevel);
  const seenFamilies = new Set<string>();
  let prefixCount = 0;
  let suffixCount = 0;
  let advancedCount = 0;
  let pinnacleCount = 0;
  const selectedRolls: FrontendEquipmentAffixRoll[] = [];
  for (const definition of ordinaryDefinitions) {
    if (seenFamilies.has(definition.family_id)) throw new Error("GM 装备不能添加同族重复词缀。");
    if (definition.gen === "prefix") {
      prefixCount += 1;
      if (prefixCount > capacity.prefix) throw new Error("GM 装备前缀数量超过当前等级上限。");
    } else if (definition.gen === "suffix") {
      suffixCount += 1;
      if (suffixCount > capacity.suffix) throw new Error("GM 装备后缀数量超过当前等级上限。");
    } else {
      throw new Error("GM 装备只支持前缀/后缀。");
    }
    if (definition.library === "advanced") {
      advancedCount += 1;
      if (advancedCount > 2) throw new Error("GM 装备进阶词缀最多 2 条。");
    }
    if (definition.library === "pinnacle") {
      if (normalizedLevel < 100) throw new Error("GM 装备至臻词缀需要 100 级装备。");
      pinnacleCount += 1;
      if (pinnacleCount > 2) throw new Error("GM 装备至臻词缀最多 2 条。");
    }
    seenFamilies.add(definition.family_id);
    selectedRolls.push(rollDefinition(definition, rng));
  }

  return {
    source,
    level: normalizedLevel,
    rarity: frontendEquipmentRarityForAffixCount(selectedRolls.length),
    base_affix: rollDefinition(selectedBaseDefinitions[0] ?? weightedChoice(baseCandidates(source), rng), rng),
    prefix_affixes: selectedRolls.filter((roll) => roll.gen === "prefix"),
    suffix_affixes: selectedRolls.filter((roll) => roll.gen === "suffix"),
  };
}

export function craftFrontendEquipmentAffix(item: FrontendEquipmentItem, library: string, gen: string, seed: number): FrontendEquipmentItem {
  if (!["initial", "advanced", "pinnacle"].includes(library)) throw new Error(`不支持的装备词缀库：${library}`);
  if (!["prefix", "suffix"].includes(gen)) throw new Error(`不支持的装备词缀类型：${gen}`);
  validateCanAdd(item, library, gen);
  const candidates = affixCandidates(item.source, item.level, library, gen, item);
  if (candidates.length === 0) throw new Error("可用装备词缀候选不足。");
  return addAffixRoll(item, rollDefinition(weightedChoice(candidates, seedRandom(seed)), seedRandom(seed + 17)));
}

export function frontendEquipmentAffixTexts(item: FrontendEquipmentItem) {
  return [item.base_affix, ...item.prefix_affixes, ...item.suffix_affixes].map(frontendEquipmentAffixRollText);
}

export function frontendEquipmentOrdinaryAffixTexts(item: FrontendEquipmentItem) {
  return [...item.prefix_affixes, ...item.suffix_affixes].map(frontendEquipmentAffixRollText);
}

export function frontendEquipmentStatModifiers(item: FrontendEquipmentItem): FrontendEquipmentStatModifier[] {
  return [
    ...localFrontendEquipmentStatModifiers(item),
    ...[item.base_affix, ...item.prefix_affixes, ...item.suffix_affixes].flatMap((affix) =>
      affix.operations
      .filter((operation) =>
        ["player_stat", "skill_stat", "damage_stat", "runtime_hook"].includes(operation.kind)
        && (operation.stat || operation.runtime_hook)
        && !operation.stat.startsWith("local_")
      )
      .map((operation) => ({
        source_modifier_id: affix.source_modifier_id,
        kind: operation.kind,
        stat: operation.stat || operation.runtime_hook,
        value: operation.value,
        value_min: operation.value_min,
        value_max: operation.value_max,
        reason_key: "modifier.equipment_affix",
        runtime_hook: operation.runtime_hook,
        payload: operation.payload,
      }))
    ),
  ];
}

export function applyFrontendEquipmentStatModifiers<T extends Record<string, { value?: unknown; trace?: Record<string, number>; [key: string]: unknown }>>(
  baseStats: T,
  modifiers: FrontendEquipmentStatModifier[]
): T {
  const next = JSON.parse(JSON.stringify(baseStats)) as T;
  let moveSpeedAddPercent = 0;
  let strengthAdd = 0;
  let dexterityAdd = 0;
  let intelligenceAdd = 0;
  for (const modifier of modifiers) {
    if (modifier.kind !== "player_stat") continue;
    if (modifier.stat === "move_speed") {
      moveSpeedAddPercent += modifier.value;
      continue;
    }
    const current = next[modifier.stat] ?? { label_text: modifier.stat, value: 0, trace: {} };
    const numericValue = typeof current.value === "number" ? current.value : 0;
    next[modifier.stat] = {
      ...current,
      value: numericValue + modifier.value,
      trace: {
        ...(current.trace ?? {}),
        equipment: Number((current.trace?.equipment ?? 0) + modifier.value),
      },
    };
    if (modifier.stat === "strength") strengthAdd += modifier.value;
    if (modifier.stat === "dexterity") dexterityAdd += modifier.value;
    if (modifier.stat === "intelligence") intelligenceAdd += modifier.value;
  }
  addFrontendDerivedStat(next, "max_life", strengthAdd * 0.5);
  addFrontendDerivedStat(next, "melee_damage_add_percent", strengthAdd * 0.2);
  addFrontendDerivedStat(next, "attack_speed_add_percent", dexterityAdd * 0.2);
  addFrontendDerivedStat(next, "cast_speed_add_percent", dexterityAdd * 0.2);
  addFrontendDerivedStat(next, "evasion_add_percent", dexterityAdd * 0.2);
  addFrontendDerivedStat(next, "max_mana", intelligenceAdd * 0.5);
  const energyShieldAddPercent = frontendStatValue(next.max_energy_shield_add_percent);
  if (energyShieldAddPercent) {
    addFrontendDerivedStat(next, "max_energy_shield", frontendStatValue(next.max_energy_shield) * energyShieldAddPercent / 100);
  }
  if (intelligenceAdd) {
    addFrontendDerivedStat(next, "max_energy_shield", frontendStatValue(next.max_energy_shield) * intelligenceAdd * 0.002);
  }
  if (moveSpeedAddPercent !== 0) {
    const current = next.move_speed ?? { label_text: "move_speed", value: FRONTEND_BASE_MOVE_SPEED, trace: {} };
    const baseValue = typeof current.value === "number" ? current.value : FRONTEND_BASE_MOVE_SPEED;
    next.move_speed = {
      ...current,
      value: baseValue * (1 + moveSpeedAddPercent / 100),
      trace: {
        ...(current.trace ?? {}),
        equipment: Number((current.trace?.equipment ?? 0) + moveSpeedAddPercent),
      },
    };
  }
  return next;
}

function localFrontendEquipmentStatModifiers(item: FrontendEquipmentItem): FrontendEquipmentStatModifier[] {
  const baseOperations = item.base_affix.operations;
  const basePhysicalDamage = baseOperations
    .filter((operation) => ["added_physical_damage", "local_added_physical_damage"].includes(operation.stat))
    .reduce((total, operation) => total + operation.value, 0);
  const baseArmor = baseOperations.filter((operation) => operation.stat === "local_armor").reduce((total, operation) => total + operation.value, 0);
  const baseEvasion = baseOperations.filter((operation) => operation.stat === "local_evasion").reduce((total, operation) => total + operation.value, 0);
  const baseEnergyShield = baseOperations.filter((operation) => operation.stat === "local_energy_shield").reduce((total, operation) => total + operation.value, 0);
  let localArmor = 0;
  let localEvasion = 0;
  let localEnergyShield = 0;
  let localPhysicalPercent = 0;
  let localAddedPhysical = 0;
  let localEnergyShieldPercent = 0;
  const localAddedDamage: Record<string, { value: number; value_min: number | null; value_max: number | null }> = {};
  for (const operation of baseOperations) {
    addLocalDamageOperation(operation, localAddedDamage, false);
  }
  for (const operation of [...item.prefix_affixes, ...item.suffix_affixes].flatMap((affix) => affix.operations)) {
    if (operation.stat === "local_armor") localArmor += operation.value;
    else if (operation.stat === "local_evasion") localEvasion += operation.value;
    else if (operation.stat === "local_energy_shield") localEnergyShield += operation.value;
    else if (operation.stat === "local_physical_damage_add_percent") localPhysicalPercent += operation.value;
    else if (operation.stat === "local_energy_shield_add_percent") localEnergyShieldPercent += operation.value;
    else if (operation.stat === "local_added_physical_damage") localAddedPhysical += operation.value;
    else addLocalDamageOperation(operation, localAddedDamage, true);
  }
  const modifiers: FrontendEquipmentStatModifier[] = [];
  const weaponDamage = basePhysicalDamage * (1 + localPhysicalPercent / 100) + localAddedPhysical;
  if (weaponDamage > 0) modifiers.push(frontendEquipmentModifier(item.base_affix.source_modifier_id, "damage_stat", "weapon_attack_base_damage", weaponDamage));
  const armor = baseArmor + localArmor;
  const evasion = baseEvasion + localEvasion;
  const energyShield = (baseEnergyShield + localEnergyShield) * (1 + localEnergyShieldPercent / 100);
  if (armor > 0) modifiers.push(frontendEquipmentModifier(item.base_affix.source_modifier_id, "player_stat", "armor", armor));
  if (evasion > 0) modifiers.push(frontendEquipmentModifier(item.base_affix.source_modifier_id, "player_stat", "evasion", evasion));
  if (energyShield > 0) modifiers.push(frontendEquipmentModifier(item.base_affix.source_modifier_id, "player_stat", "max_energy_shield", energyShield));
  for (const [damageType, roll] of Object.entries(localAddedDamage)) {
    if (roll.value > 0) {
      modifiers.push(frontendEquipmentModifier(
        item.base_affix.source_modifier_id,
        "damage_stat",
        `added_${damageType}_damage`,
        roll.value,
        roll.value_min,
        roll.value_max,
      ));
    }
  }
  return modifiers;
}

function addLocalDamageOperation(
  operation: FrontendEquipmentEffectOperation,
  localAddedDamage: Record<string, { value: number; value_min: number | null; value_max: number | null }>,
  includePhysical: boolean
) {
  if (!operation.stat.startsWith("local_added_") || !operation.stat.endsWith("_damage")) return;
  const damageType = operation.stat.replace(/^local_added_/, "").replace(/_damage$/, "");
  if (!includePhysical && damageType === "physical") return;
  const current = localAddedDamage[damageType] ?? { value: 0, value_min: 0, value_max: 0 };
  localAddedDamage[damageType] = {
    value: current.value + operation.value,
    value_min: frontendNullableSum(current.value_min, operation.value_min ?? operation.value),
    value_max: frontendNullableSum(current.value_max, operation.value_max ?? operation.value),
  };
}

function frontendNullableSum(left: number | null, right: number | null) {
  if (left === null && right === null) return null;
  return Number(left ?? 0) + Number(right ?? 0);
}

function frontendEquipmentModifier(
  sourceModifierId: string,
  kind: string,
  stat: string,
  value: number,
  valueMin: number | null = null,
  valueMax: number | null = null
): FrontendEquipmentStatModifier {
  return {
    source_modifier_id: sourceModifierId,
    kind,
    stat,
    value,
    value_min: valueMin,
    value_max: valueMax,
    reason_key: "modifier.equipment_affix",
  };
}

function addFrontendDerivedStat<T extends Record<string, { value?: unknown; trace?: Record<string, number>; [key: string]: unknown }>>(
  stats: T,
  stat: string,
  value: number
) {
  if (!value) return;
  const current = stats[stat] ?? { label_text: stat, value: 0, trace: {} };
  stats[stat] = {
    ...current,
    value: frontendStatValue(current) + value,
    trace: {
      ...(current.trace ?? {}),
      primary_attribute: Number((current.trace?.primary_attribute ?? 0) + value),
    },
  };
}

function frontendStatValue(stat: { value?: unknown } | undefined) {
  return typeof stat?.value === "number" ? stat.value : 0;
}

function randomGenerationOptions(item: FrontendEquipmentItem) {
  const capacity = prefixSuffixCapacity(item.level);
  const options: { library: string; gen: string; candidates: FrontendEquipmentAffixDefinition[] }[] = [];
  for (const gen of ["prefix", "suffix"]) {
    if (gen === "prefix" && item.prefix_affixes.length >= capacity.prefix) continue;
    if (gen === "suffix" && item.suffix_affixes.length >= capacity.suffix) continue;
    for (const library of ["initial", "advanced"]) {
      if (library === "advanced" && countLibrary(item, "advanced") >= 2) continue;
      const candidates = affixCandidates(item.source, item.level, library, gen, item);
      if (candidates.length > 0) options.push({ library, gen, candidates });
    }
  }
  return options;
}

function affixCandidates(source: string, level: number, library: string, gen: string, existingItem?: FrontendEquipmentItem) {
  const usedFamilies = new Set(existingItem ? [...existingItem.prefix_affixes, ...existingItem.suffix_affixes].map((affix) => affix.family_id) : []);
  return DEFINITIONS.filter((definition) =>
    definition.source === source
    && definition.library === library
    && definition.gen === gen
    && definition.enabled
    && definition.required_level <= level
    && !usedFamilies.has(definition.family_id)
  );
}

function baseCandidates(source: string) {
  const candidates = DEFINITIONS.filter((definition) => definition.source === source && definition.library === "base" && definition.enabled);
  if (candidates.length === 0) throw new Error(`装备基础词缀池不存在：${source}`);
  return candidates;
}

function validateCanAdd(item: FrontendEquipmentItem, library: string, gen: string) {
  const capacity = prefixSuffixCapacity(item.level);
  if (gen === "prefix" && item.prefix_affixes.length >= capacity.prefix) throw new Error("装备前缀已满。");
  if (gen === "suffix" && item.suffix_affixes.length >= capacity.suffix) throw new Error("装备后缀已满。");
  if (library === "advanced" && countLibrary(item, "advanced") >= 2) throw new Error("装备进阶词缀已达上限。");
  if (library === "pinnacle") {
    if (item.level < 100) throw new Error("只有 100 级装备才能打造至臻词缀。");
    if (countLibrary(item, "pinnacle") >= 2) throw new Error("装备至臻词缀已达上限。");
  }
}

function addAffixRoll(item: FrontendEquipmentItem, roll: FrontendEquipmentAffixRoll): FrontendEquipmentItem {
  if (roll.gen === "prefix") return { ...item, prefix_affixes: [...item.prefix_affixes, roll] };
  if (roll.gen === "suffix") return { ...item, suffix_affixes: [...item.suffix_affixes, roll] };
  throw new Error(`不支持的装备词缀类型：${roll.gen}`);
}

function countLibrary(item: FrontendEquipmentItem, library: string) {
  return [...item.prefix_affixes, ...item.suffix_affixes].filter((affix) => affix.library === library).length;
}

function weightedChoice(candidates: FrontendEquipmentAffixDefinition[], rng: FrontendSeedRandom) {
  const total = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
  let pick = rng.nextFloat() * total;
  for (const candidate of candidates) {
    pick -= candidate.weight;
    if (pick <= 0) return candidate;
  }
  return candidates[candidates.length - 1];
}

function rollDefinition(definition: FrontendEquipmentAffixDefinition, rng: FrontendSeedRandom): FrontendEquipmentAffixRoll {
  const rolledEffect = rollEffect(definition.effect, rng);
  return {
    affix_id: definition.affix_id,
    source_modifier_id: definition.source_modifier_id,
    library: definition.library,
    gen: definition.gen,
    tier: definition.tier,
    effect: rolledEffect.text,
    family_id: definition.family_id,
    operations: rollEffectOperations(definition.effect, definition.operations ?? [], rolledEffect.ranges),
  };
}

type RolledEffectRange = {
  index: number;
  value: number;
};

const EFFECT_RANGE_PATTERN = /\((-?\d+(?:\.\d+)?)\s*[\u2013\u2014-]\s*(-?\d+(?:\.\d+)?)\)|(?<![\d.])(-?\d+(?:\.\d+)?)\s*[\u2013\u2014-]\s*(-?\d+(?:\.\d+)?)(?![\d.])/g;

function rollEffect(effect: string, rng: FrontendSeedRandom) {
  const ranges: RolledEffectRange[] = [];
  const text = effect.replace(
    EFFECT_RANGE_PATTERN,
    (match, groupMin, groupMax, plainMin, plainMax, offset) => {
      const rolled = rollRangeNumberText(groupMin ?? plainMin, groupMax ?? plainMax, rng);
      ranges.push({ index: Number(offset), value: rolled.value });
      return match.startsWith("(") ? `(${rolled.text})` : rolled.text;
    }
  );
  return { text, ranges };
}

function rollEffectOperations(
  effect: string,
  operations: FrontendEquipmentEffectOperation[],
  ranges: RolledEffectRange[]
): FrontendEquipmentEffectOperation[] {
  if (ranges.length === 0) return operations;
  return operations.map((operation) => {
    if (operation.value_min === null && operation.value_max === null) return operation;
    const values = rolledValuesForSourceText(effect, ranges, operation.source_text);
    if (values.length === 0) return operation;
    if (values.length === 1) {
      return {
        ...operation,
        value: values[0],
        value_min: values[0],
        value_max: values[0],
      };
    }
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    return {
      ...operation,
      value: (minimum + maximum) / 2,
      value_min: minimum,
      value_max: maximum,
    };
  });
}

function rolledValuesForSourceText(effect: string, ranges: RolledEffectRange[], sourceText: string) {
  const sourceIndex = sourceText ? effect.indexOf(sourceText) : -1;
  if (sourceIndex < 0) return ranges.map((range) => range.value);
  const sourceEnd = sourceIndex + sourceText.length;
  return ranges
    .filter((range) => range.index >= sourceIndex && range.index < sourceEnd)
    .map((range) => range.value);
}

function rollRangeNumberText(minimumText: string, maximumText: string, rng: FrontendSeedRandom) {
  let minimum = Number(minimumText);
  let maximum = Number(maximumText);
  if (minimum > maximum) [minimum, maximum] = [maximum, minimum];
  const decimalPlaces = Math.max(countDecimalPlaces(minimumText), countDecimalPlaces(maximumText));
  const value = decimalPlaces === 0 ? rng.nextInt(Math.round(minimum), Math.round(maximum)) : minimum + rng.nextFloat() * (maximum - minimum);
  return {
    text: decimalPlaces === 0 ? String(Math.round(value)) : value.toFixed(decimalPlaces),
    value: decimalPlaces === 0 ? Math.round(value) : Number(value.toFixed(decimalPlaces)),
  };
}

function countDecimalPlaces(value: string) {
  return value.includes(".") ? value.split(".")[1].length : 0;
}

function frontendEquipmentAffixDefinitionText(definition: FrontendEquipmentAffixDefinition) {
  if (definition.library === "base") return `基础 T${definition.tier}：${definition.effect}`;
  return `${libraryText(definition.library)}${genText(definition.gen)} T${definition.tier}：${definition.effect}`;
}

function frontendEquipmentAffixRollText(affix: FrontendEquipmentAffixRoll) {
  if (affix.library === "base") return affix.effect;
  return `${libraryText(affix.library)}${genText(affix.gen)} T${affix.tier}：${affix.effect}`;
}

function libraryText(library: string) {
  return ({ initial: "初阶", advanced: "进阶", pinnacle: "至臻", base: "基础" } as Record<string, string>)[library] ?? library;
}

function genText(gen: string) {
  return ({ prefix: "前缀", suffix: "后缀", base: "" } as Record<string, string>)[gen] ?? gen;
}

function clampInt(value: number, minimum: number, maximum: number) {
  if (!Number.isFinite(value)) return minimum;
  return Math.max(minimum, Math.min(maximum, Math.round(value)));
}

type FrontendSeedRandom = ReturnType<typeof seedRandom>;

function seedRandom(seed: number) {
  let state = (Math.floor(seed) >>> 0) || 0x9e3779b9;
  return {
    nextFloat() {
      state += 0x6D2B79F5;
      let value = state;
      value = Math.imul(value ^ value >>> 15, value | 1);
      value ^= value + Math.imul(value ^ value >>> 7, value | 61);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    },
    nextInt(minimum: number, maximum: number) {
      return Math.floor(this.nextFloat() * (maximum - minimum + 1)) + minimum;
    },
  };
}
