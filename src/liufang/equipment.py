from __future__ import annotations

import random
import re
from dataclasses import dataclass, replace
from pathlib import Path
from typing import Iterable


BASE_AFFIX_TYPE = "基础词缀"
AFFIX_TYPE_TO_POOL: dict[str, tuple[str, str]] = {
    "初阶前缀": ("initial", "prefix"),
    "初阶后缀": ("initial", "suffix"),
    "进阶前缀": ("advanced", "prefix"),
    "进阶后缀": ("advanced", "suffix"),
    "至臻前缀": ("pinnacle", "prefix"),
    "至臻后缀": ("pinnacle", "suffix"),
}
RARITY_AFFIX_COUNTS: dict[str, tuple[int, int]] = {
    "white": (0, 0),
    "白色": (0, 0),
    "blue": (1, 2),
    "蓝色": (1, 2),
    "purple": (3, 5),
    "紫色": (3, 5),
    "pink": (6, 6),
    "粉色": (6, 6),
}
SUPPORTED_UNDERLYING_MECHANIC_KEYWORDS = ("战意", "引导", "麻痹")
UNSUPPORTED_MECHANIC_KEYWORDS = (
    "召唤",
    "召唤物",
    "魔灵",
    "智械",
    "统御",
    "哨卫",
    "幻影",
    "祝福",
    "诅咒",
    "凋零",
    "收割",
    "贯注",
    "迷踪",
    "地面",
    "法术迸发",
    "连携",
    "魔力封印",
    "邪祟",
    "瘫痪",
    "麻痹",
    "偏斜",
    "迅疾之风",
    "破击蓄能",
    "灵药",
    "蓄能",
    "嘲讽",
    "纠缠",
    "瞄准",
    "轰炸",
    "战吼",
    "恶兆",
)


@dataclass(frozen=True)
class EquipmentTierRule:
    tier: int
    required_level: int
    weight: int
    value_scale: float


EQUIPMENT_TIER_RULES: tuple[EquipmentTierRule, ...] = (
    EquipmentTierRule(1, 86, 100, 1.00),
    EquipmentTierRule(2, 82, 200, 0.85),
    EquipmentTierRule(3, 76, 800, 0.70),
    EquipmentTierRule(4, 68, 3200, 0.55),
    EquipmentTierRule(5, 58, 3200, 0.40),
    EquipmentTierRule(6, 40, 6250, 0.28),
    EquipmentTierRule(7, 1, 6250, 0.18),
)


class EquipmentGenerationError(ValueError):
    def __init__(self, error_key: str, message: str) -> None:
        super().__init__(message)
        self.error_key = error_key
        self.message = message


@dataclass(frozen=True)
class EquipmentAffixDefinition:
    affix_id: str
    source_modifier_id: str
    source: str
    library: str
    gen: str
    tier: int
    required_level: int
    weight: int
    effect: str
    family_id: str
    enabled: bool = True
    disabled_reason: str = ""


@dataclass(frozen=True)
class EquipmentAffixRoll:
    affix_id: str
    source_modifier_id: str
    library: str
    gen: str
    tier: int
    effect: str
    family_id: str


@dataclass(frozen=True)
class EquipmentItem:
    instance_id: str
    source: str
    level: int
    rarity: str
    base_affix: EquipmentAffixRoll
    prefix_affixes: tuple[EquipmentAffixRoll, ...] = ()
    suffix_affixes: tuple[EquipmentAffixRoll, ...] = ()

    @property
    def ordinary_affixes(self) -> tuple[EquipmentAffixRoll, ...]:
        return self.prefix_affixes + self.suffix_affixes

    def count_library(self, library: str) -> int:
        return sum(1 for affix in self.ordinary_affixes if affix.library == library)


@dataclass(frozen=True)
class EquipmentEffectOperation:
    kind: str
    stat: str = ""
    value: float = 0.0
    value_min: float = 0.0
    value_max: float = 0.0
    source_text: str = ""
    runtime_hook: str = ""
    payload: dict[str, object] | None = None


@dataclass(frozen=True)
class EquipmentDesignAlignment:
    source_modifier_id: str
    effect: str
    reason: str
    proposed_hook: str
    affected_modules: tuple[str, ...]
    test_plan: str


@dataclass(frozen=True)
class EquipmentEffectMapping:
    source_modifier_id: str
    status: str
    effect: str
    operations: tuple[EquipmentEffectOperation, ...] = ()
    disabled_reason: str = ""
    alignment: EquipmentDesignAlignment | None = None


@dataclass(frozen=True)
class EquipmentStatModifier:
    source_instance_id: str
    source_modifier_id: str
    stat: str
    value: float
    reason_key: str = "modifier.equipment_affix"


def prefix_suffix_capacity(level: int) -> tuple[int, int]:
    if level < 1:
        raise EquipmentGenerationError("equipment.error.invalid_level", "装备等级必须大于等于 1")
    if level <= 10:
        return 1, 0
    if level <= 25:
        return 1, 1
    if level <= 40:
        return 2, 1
    if level <= 60:
        return 2, 2
    if level <= 80:
        return 3, 2
    return 3, 3


def equipment_affix_definitions_by_raw(
    definitions: Iterable[EquipmentAffixDefinition],
) -> dict[str, tuple[EquipmentAffixDefinition, ...]]:
    grouped: dict[str, list[EquipmentAffixDefinition]] = {}
    for definition in definitions:
        grouped.setdefault(definition.source_modifier_id, []).append(definition)
    return {key: tuple(value) for key, value in grouped.items()}


def classify_equipment_affix_effect(definitions: tuple[EquipmentAffixDefinition, ...]) -> EquipmentEffectMapping:
    if not definitions:
        raise EquipmentGenerationError("equipment.error.empty_effect_group", "装备词缀效果组为空")
    sample = definitions[0]
    disabled_reasons = sorted({definition.disabled_reason for definition in definitions if definition.disabled_reason})
    if disabled_reasons and not any(definition.enabled for definition in definitions):
        return EquipmentEffectMapping(
            source_modifier_id=sample.source_modifier_id,
            status="disabled",
            effect=sample.effect,
            disabled_reason=";".join(disabled_reasons),
        )

    operations = tuple(_map_equipment_effect_operations(sample.effect))
    if operations:
        return EquipmentEffectMapping(
            source_modifier_id=sample.source_modifier_id,
            status="mapped_effect",
            effect=sample.effect,
            operations=operations,
        )

    alignment = EquipmentDesignAlignment(
        source_modifier_id=sample.source_modifier_id,
        effect=sample.effect,
        reason="existing_runtime_mechanism_not_confirmed",
        proposed_hook=_proposed_alignment_hook(sample.effect),
        affected_modules=("equipment.py", "skill_effects.py", "skill_runtime.py", "combat.py"),
        test_plan="Add a focused runtime test after the missing mechanic is confirmed.",
    )
    return EquipmentEffectMapping(
        source_modifier_id=sample.source_modifier_id,
        status="requires_design_alignment",
        effect=sample.effect,
        alignment=alignment,
    )


def classify_all_equipment_affix_effects(
    definitions: Iterable[EquipmentAffixDefinition],
) -> dict[str, EquipmentEffectMapping]:
    return {
        source_modifier_id: classify_equipment_affix_effect(group)
        for source_modifier_id, group in equipment_affix_definitions_by_raw(definitions).items()
    }


def equipment_effect_alignment_report(
    definitions: Iterable[EquipmentAffixDefinition],
) -> tuple[EquipmentDesignAlignment, ...]:
    mappings = classify_all_equipment_affix_effects(definitions)
    return tuple(
        mapping.alignment
        for mapping in mappings.values()
        if mapping.status == "requires_design_alignment" and mapping.alignment is not None
    )


def mapped_operations_for_affix(
    affix: EquipmentAffixRoll,
    mappings: dict[str, EquipmentEffectMapping] | None = None,
    definitions: Iterable[EquipmentAffixDefinition] = (),
) -> tuple[EquipmentEffectOperation, ...]:
    if mappings is None:
        mappings = classify_all_equipment_affix_effects(definitions)
    mapping = mappings.get(affix.source_modifier_id)
    if mapping is None or mapping.status != "mapped_effect":
        return ()
    return tuple(
        replace(operation, source_text=affix.effect)
        for operation in _map_equipment_effect_operations(affix.effect)
    )


def equipment_stat_modifiers(
    items: Iterable[EquipmentItem],
    *,
    definitions: Iterable[EquipmentAffixDefinition],
) -> tuple[EquipmentStatModifier, ...]:
    mappings = classify_all_equipment_affix_effects(definitions)
    modifiers: list[EquipmentStatModifier] = []
    for item in items:
        modifiers.extend(_local_equipment_stat_modifiers(item, mappings))
        for affix in (item.base_affix,) + item.ordinary_affixes:
            for operation in mapped_operations_for_affix(affix, mappings=mappings):
                if operation.kind not in {"player_stat", "skill_stat", "damage_stat"} or not operation.stat:
                    continue
                if operation.stat.startswith("local_"):
                    continue
                modifiers.append(
                    EquipmentStatModifier(
                        source_instance_id=item.instance_id,
                        source_modifier_id=affix.source_modifier_id,
                        stat=operation.stat,
                        value=operation.value,
                    )
                )
    return tuple(modifiers)


def equipment_runtime_params(
    items: Iterable[EquipmentItem],
    *,
    definitions: Iterable[EquipmentAffixDefinition],
) -> dict[str, object]:
    mappings = classify_all_equipment_affix_effects(definitions)
    params: dict[str, object] = {}
    for item in items:
        for affix in (item.base_affix,) + item.ordinary_affixes:
            for operation in mapped_operations_for_affix(affix, mappings=mappings):
                if operation.kind != "runtime_hook" or operation.payload is None:
                    continue
                params.update(operation.payload)
    return params


def _local_equipment_stat_modifiers(
    item: EquipmentItem,
    mappings: dict[str, EquipmentEffectMapping],
) -> tuple[EquipmentStatModifier, ...]:
    base_operations = mapped_operations_for_affix(item.base_affix, mappings=mappings)
    base_physical_damage = sum(
        operation.value
        for operation in base_operations
        if operation.stat in {"added_physical_damage", "local_added_physical_damage"}
    )
    base_armor = sum(operation.value for operation in base_operations if operation.stat == "local_armor")
    base_evasion = sum(operation.value for operation in base_operations if operation.stat == "local_evasion")
    base_energy_shield = sum(operation.value for operation in base_operations if operation.stat == "local_energy_shield")
    local_energy_shield_percent = 0.0
    local_physical_percent = 0.0
    local_added_physical = 0.0
    local_added_damage: dict[str, float] = {}
    for operation in base_operations:
        if operation.stat.startswith("local_added_") and operation.stat.endswith("_damage"):
            damage_type = operation.stat.removeprefix("local_added_").removesuffix("_damage")
            if damage_type != "physical":
                local_added_damage[damage_type] = local_added_damage.get(damage_type, 0.0) + operation.value
    for affix in item.ordinary_affixes:
        for operation in mapped_operations_for_affix(affix, mappings=mappings):
            if operation.stat == "local_physical_damage_add_percent":
                local_physical_percent += operation.value
            elif operation.stat == "local_energy_shield_add_percent":
                local_energy_shield_percent += operation.value
            elif operation.stat == "local_added_physical_damage":
                local_added_physical += operation.value
            elif operation.stat.startswith("local_added_") and operation.stat.endswith("_damage"):
                damage_type = operation.stat.removeprefix("local_added_").removesuffix("_damage")
                local_added_damage[damage_type] = local_added_damage.get(damage_type, 0.0) + operation.value
    weapon_damage = base_physical_damage * (1.0 + local_physical_percent / 100.0) + local_added_physical
    energy_shield = base_energy_shield * (1.0 + local_energy_shield_percent / 100.0)
    modifiers: list[EquipmentStatModifier] = []
    if weapon_damage > 0:
        modifiers.append(
            EquipmentStatModifier(
                source_instance_id=item.instance_id,
                source_modifier_id=item.base_affix.source_modifier_id,
                stat="weapon_attack_base_damage",
                value=weapon_damage,
            )
        )
    for stat, value in {
        "armor": base_armor,
        "evasion": base_evasion,
        "max_energy_shield": energy_shield,
    }.items():
        if value > 0:
            modifiers.append(
                EquipmentStatModifier(
                    source_instance_id=item.instance_id,
                    source_modifier_id=item.base_affix.source_modifier_id,
                    stat=stat,
                    value=value,
                )
            )
    for damage_type, value in local_added_damage.items():
        if value > 0:
            modifiers.append(
                EquipmentStatModifier(
                    source_instance_id=item.instance_id,
                    source_modifier_id=item.base_affix.source_modifier_id,
                    stat=f"added_{damage_type}_damage",
                    value=value,
                )
            )
    return tuple(modifiers)


def load_equipment_affix_definitions(markdown_path: Path) -> tuple[EquipmentAffixDefinition, ...]:
    rows = _parse_tlidb_equipment_markdown(markdown_path)
    definitions: list[EquipmentAffixDefinition] = []
    for row in rows:
        disabled_reason = _disabled_reason_for_effect(row["effect"])
        if row["affix_type"] == BASE_AFFIX_TYPE:
            definitions.append(
                EquipmentAffixDefinition(
                    affix_id=row["modifier_id"],
                    source_modifier_id=row["modifier_id"],
                    source=row["source"],
                    library="base",
                    gen="base",
                    tier=int(row["tier"]),
                    required_level=int(row["level"]),
                    weight=int(row["weight"]),
                    effect=row["effect"],
                    family_id=row["modifier_id"],
                    enabled=not disabled_reason,
                    disabled_reason=disabled_reason,
                )
            )
            continue
        pool = AFFIX_TYPE_TO_POOL.get(row["affix_type"])
        if pool is None:
            continue
        library, gen = pool
        if library == "pinnacle":
            definitions.append(
                EquipmentAffixDefinition(
                    affix_id=f'{row["modifier_id"]}_t1',
                    source_modifier_id=row["modifier_id"],
                    source=row["source"],
                    library=library,
                    gen=gen,
                    tier=1,
                    required_level=int(row["level"]),
                    weight=int(row["weight"]),
                    effect=row["effect"],
                    family_id=row["modifier_id"],
                    enabled=not disabled_reason,
                    disabled_reason=disabled_reason,
                )
            )
            continue
        for rule in EQUIPMENT_TIER_RULES:
            effect = row["effect"] if rule.tier == 1 else _scale_effect_text(row["effect"], rule.value_scale)
            definitions.append(
                EquipmentAffixDefinition(
                    affix_id=f'{row["modifier_id"]}_t{rule.tier}',
                    source_modifier_id=row["modifier_id"],
                    source=row["source"],
                    library=library,
                    gen=gen,
                    tier=rule.tier,
                    required_level=rule.required_level,
                    weight=rule.weight,
                    effect=effect,
                    family_id=row["modifier_id"],
                    enabled=not disabled_reason,
                    disabled_reason=disabled_reason,
                )
            )
    return tuple(definitions)


@dataclass
class EquipmentGenerator:
    definitions: tuple[EquipmentAffixDefinition, ...]
    rng: random.Random

    @classmethod
    def from_tlidb_markdown(cls, markdown_path: Path, rng: random.Random | None = None) -> EquipmentGenerator:
        return cls(load_equipment_affix_definitions(markdown_path), rng or random.Random())

    def generate(self, source: str, level: int, rarity: str, *, instance_id: str = "") -> EquipmentItem:
        min_count, max_count = self._rarity_count_range(rarity)
        target_count = self.rng.randint(min_count, max_count) if max_count > min_count else min_count
        max_prefixes, max_suffixes = prefix_suffix_capacity(level)
        target_count = min(target_count, max_prefixes + max_suffixes)
        item = EquipmentItem(
            instance_id=instance_id,
            source=source,
            level=level,
            rarity=rarity,
            base_affix=self._roll_base_affix(source),
        )
        for _ in range(target_count):
            options = self._random_generation_options(item)
            if not options:
                break
            library, gen, candidates = self.rng.choice(options)
            selected = self._weighted_choice(candidates)
            item = self._add_affix_roll(item, self._roll(selected))
        return item

    def craft_affix(self, item: EquipmentItem, *, library: str, gen: str) -> EquipmentItem:
        if library not in {"initial", "advanced", "pinnacle"}:
            raise EquipmentGenerationError("equipment.error.invalid_library", f"不支持的装备词缀库：{library}")
        if gen not in {"prefix", "suffix"}:
            raise EquipmentGenerationError("equipment.error.invalid_affix_side", f"不支持的装备词缀类型：{gen}")
        self._validate_can_add(item, library, gen)
        candidates = self.candidates(item.source, item.level, library=library, gen=gen, existing_item=item)
        if not candidates:
            raise EquipmentGenerationError("equipment.error.candidate_shortage", "可用装备词缀候选不足")
        return self._add_affix_roll(item, self._roll(self._weighted_choice(candidates)))

    def candidates(
        self,
        source: str,
        level: int,
        *,
        library: str,
        gen: str,
        existing_item: EquipmentItem | None = None,
    ) -> tuple[EquipmentAffixDefinition, ...]:
        used_families = {affix.family_id for affix in existing_item.ordinary_affixes} if existing_item else set()
        return tuple(
            definition
            for definition in self.definitions
            if definition.source == source
            and definition.library == library
            and definition.gen == gen
            and definition.enabled
            and definition.required_level <= level
            and definition.family_id not in used_families
        )

    def probability_for_candidate_pool(self, candidates: tuple[EquipmentAffixDefinition, ...], target_affix_id: str) -> float:
        total = sum(definition.weight for definition in candidates)
        if total <= 0:
            return 0.0
        target = sum(definition.weight for definition in candidates if definition.affix_id == target_affix_id)
        return target / total

    def _random_generation_options(
        self,
        item: EquipmentItem,
    ) -> list[tuple[str, str, tuple[EquipmentAffixDefinition, ...]]]:
        max_prefixes, max_suffixes = prefix_suffix_capacity(item.level)
        side_capacity = {
            "prefix": len(item.prefix_affixes) < max_prefixes,
            "suffix": len(item.suffix_affixes) < max_suffixes,
        }
        options: list[tuple[str, str, tuple[EquipmentAffixDefinition, ...]]] = []
        for gen, has_capacity in side_capacity.items():
            if not has_capacity:
                continue
            for library in ("initial", "advanced"):
                if library == "advanced" and item.count_library("advanced") >= 2:
                    continue
                candidates = self.candidates(item.source, item.level, library=library, gen=gen, existing_item=item)
                if candidates:
                    options.append((library, gen, candidates))
        return options

    def _roll_base_affix(self, source: str) -> EquipmentAffixRoll:
        candidates = tuple(
            definition
            for definition in self.definitions
            if definition.source == source and definition.library == "base" and definition.enabled
        )
        if not candidates:
            raise EquipmentGenerationError("equipment.error.base_affix_missing", f"装备基础词缀池不存在：{source}")
        return self._roll(self._weighted_choice(candidates))

    def _validate_can_add(self, item: EquipmentItem, library: str, gen: str) -> None:
        max_prefixes, max_suffixes = prefix_suffix_capacity(item.level)
        if gen == "prefix" and len(item.prefix_affixes) >= max_prefixes:
            raise EquipmentGenerationError("equipment.error.prefix_full", "装备前缀已满")
        if gen == "suffix" and len(item.suffix_affixes) >= max_suffixes:
            raise EquipmentGenerationError("equipment.error.suffix_full", "装备后缀已满")
        if library == "advanced" and item.count_library("advanced") >= 2:
            raise EquipmentGenerationError("equipment.error.advanced_full", "装备进阶词缀已达上限")
        if library == "pinnacle":
            if item.level < 100:
                raise EquipmentGenerationError("equipment.error.pinnacle_level", "只有 100 级装备才能打造至臻词缀")
            if item.count_library("pinnacle") >= 2:
                raise EquipmentGenerationError("equipment.error.pinnacle_full", "装备至臻词缀已达上限")

    def _add_affix_roll(self, item: EquipmentItem, roll: EquipmentAffixRoll) -> EquipmentItem:
        if roll.gen == "prefix":
            return replace(item, prefix_affixes=item.prefix_affixes + (roll,))
        if roll.gen == "suffix":
            return replace(item, suffix_affixes=item.suffix_affixes + (roll,))
        raise EquipmentGenerationError("equipment.error.invalid_affix_side", f"不支持的装备词缀类型：{roll.gen}")

    def _weighted_choice(self, candidates: tuple[EquipmentAffixDefinition, ...]) -> EquipmentAffixDefinition:
        total = sum(candidate.weight for candidate in candidates)
        pick = self.rng.uniform(0, total)
        current = 0.0
        for candidate in candidates:
            current += candidate.weight
            if pick <= current:
                return candidate
        return candidates[-1]

    def _roll(self, definition: EquipmentAffixDefinition) -> EquipmentAffixRoll:
        return EquipmentAffixRoll(
            affix_id=definition.affix_id,
            source_modifier_id=definition.source_modifier_id,
            library=definition.library,
            gen=definition.gen,
            tier=definition.tier,
            effect=_roll_effect_text(definition.effect, self.rng),
            family_id=definition.family_id,
        )

    def _rarity_count_range(self, rarity: str) -> tuple[int, int]:
        if rarity not in RARITY_AFFIX_COUNTS:
            raise EquipmentGenerationError("equipment.error.invalid_rarity", f"不支持的装备稀有度：{rarity}")
        return RARITY_AFFIX_COUNTS[rarity]


def _parse_tlidb_equipment_markdown(markdown_path: Path) -> list[dict[str, str]]:
    current_type = ""
    current_source = ""
    rows: list[dict[str, str]] = []
    for raw_line in markdown_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        type_match = re.match(r"^## (基础词缀|初阶前缀|初阶后缀|进阶前缀|进阶后缀|至臻前缀|至臻后缀)$", line)
        if type_match:
            current_type = type_match.group(1)
            continue
        source_match = re.match(r"^### (.+)$", line)
        if source_match:
            current_source = source_match.group(1)
            continue
        if not re.match(r"^\|\s*\d+\s*\|", line):
            continue
        cells = [cell.strip() for cell in line.strip("|").split("|")]
        if len(cells) < 5:
            continue
        rows.append(
            {
                "modifier_id": cells[0],
                "affix_type": current_type,
                "source": current_source,
                "tier": cells[1],
                "level": cells[2],
                "weight": cells[3],
                "effect": cells[4].replace("<br>", "\n"),
            }
        )
    return rows


def _disabled_reason_for_effect(effect: str) -> str:
    if any(keyword in effect for keyword in SUPPORTED_UNDERLYING_MECHANIC_KEYWORDS):
        return ""
    blocked_keywords = tuple(keyword for keyword in UNSUPPORTED_MECHANIC_KEYWORDS if keyword in effect)
    if not blocked_keywords:
        return ""
    return "unsupported_mechanic:" + ",".join(blocked_keywords)


_ANY_NUMBER_RE = re.compile(r"-?\d+(?:\.\d+)?")
_PAREN_RANGE_RE = re.compile(r"\((-?\d+(?:\.\d+)?)\s*[–-]\s*(-?\d+(?:\.\d+)?)\)")
_PLAIN_RANGE_RE = re.compile(r"(?<![\d(])(-?\d+(?:\.\d+)?)\s+[–-]\s+(-?\d+(?:\.\d+)?)(?![\d)])")


def _map_equipment_effect_operations(effect: str) -> tuple[EquipmentEffectOperation, ...]:
    text = _normalize_effect_text(effect)
    if _requires_design_alignment_before_mapping(text):
        return ()
    operations: list[EquipmentEffectOperation] = []

    for phrase, stat, kind in _EQUIPMENT_EFFECT_STAT_PATTERNS:
        if phrase not in text:
            continue
        if "该装备" in text and stat in {"physical_damage_add_percent", "armor", "evasion", "max_energy_shield"}:
            continue
        if "抗性上限" in text and stat.endswith("_resistance_percent"):
            continue
        if "受到的" in text and "转化为" in text and stat.endswith("_damage_add_percent"):
            continue
        if "护甲有效率" in text and stat.endswith("_damage_add_percent"):
            continue
        if phrase == "最大生命" and "敌人最大生命" in text:
            continue
        if phrase.endswith("伤害") and f"点{phrase}" in text:
            continue
        value_min, value_max = _first_value_range(text)
        if value_min is None or value_max is None:
            continue
        operations.append(
            EquipmentEffectOperation(
                kind=kind,
                stat=stat,
                value=(value_min + value_max) / 2.0,
                value_min=value_min,
                value_max=value_max,
                source_text=effect,
            )
        )

    natural_regen = _natural_regen_operation(text, effect)
    if natural_regen is not None:
        operations.append(natural_regen)
    operations.extend(_safe_existing_stat_operations(text, effect))

    for damage_type, stat in {
        "物理": "added_physical_damage",
        "火焰": "added_fire_damage",
        "冰冷": "added_cold_damage",
        "冰霜": "added_cold_damage",
        "闪电": "added_lightning_damage",
        "腐蚀": "added_chaos_damage",
        "混沌": "added_chaos_damage",
    }.items():
        if ("攻击附加" in text or "法术附加" in text) and f"点{damage_type}伤害" in text:
            value_min, value_max = _added_damage_average_range(text)
            if value_min is not None and value_max is not None:
                operations.append(
                    EquipmentEffectOperation(
                        kind="damage_stat",
                        stat=stat,
                        value=(value_min + value_max) / 2.0,
                        value_min=value_min,
                        value_max=value_max,
                        source_text=effect,
                    )
                )

    if "该装备物理伤害" in text:
        value_min, value_max = _first_value_range(text)
        if value_min is not None and value_max is not None:
            operations.append(
                EquipmentEffectOperation(
                    kind="local_stat",
                    stat="local_physical_damage_add_percent",
                    value=(value_min + value_max) / 2.0,
                    value_min=value_min,
                    value_max=value_max,
                    source_text=effect,
                )
            )
    for damage_label, damage_type in {
        "物理": "physical",
        "火焰": "fire",
        "冰冷": "cold",
        "冰霜": "cold",
        "闪电": "lightning",
        "腐蚀": "chaos",
        "混沌": "chaos",
    }.items():
        if "该装备附加" in text and f"点{damage_label}伤害" in text:
            value_min, value_max = _added_damage_average_range(text)
            if value_min is not None and value_max is not None:
                operations.append(
                    EquipmentEffectOperation(
                        kind="local_stat",
                        stat=f"local_added_{damage_type}_damage",
                        value=(value_min + value_max) / 2.0,
                        value_min=value_min,
                        value_max=value_max,
                        source_text=effect,
                    )
                )
    for phrase, stat in {
        "该装备护甲值": "local_armor",
        "该装备闪避值": "local_evasion",
        "该装备能量护盾": "local_energy_shield",
    }.items():
        if phrase in text:
            value_min, value_max = _first_value_range(text)
            if value_min is not None and value_max is not None:
                operations.append(
                    EquipmentEffectOperation(
                        kind="local_stat",
                        stat=stat,
                        value=(value_min + value_max) / 2.0,
                        value_min=value_min,
                        value_max=value_max,
                        source_text=effect,
                    )
                )

    for phrase, stats in {
        "元素抗性上限": ("max_fire_resistance_percent", "max_cold_resistance_percent", "max_lightning_resistance_percent"),
        "元素和混沌抗性上限": (
            "max_fire_resistance_percent",
            "max_cold_resistance_percent",
            "max_lightning_resistance_percent",
            "max_chaos_resistance_percent",
        ),
    }.items():
        if phrase in text:
            value_min, value_max = _first_value_range(text)
            if value_min is not None and value_max is not None:
                value = (value_min + value_max) / 2.0
                for stat in stats:
                    operations.append(
                        EquipmentEffectOperation(
                            kind="player_stat",
                            stat=stat,
                            value=value,
                            value_min=value_min,
                            value_max=value_max,
                            source_text=effect,
                        )
                    )

    incoming_conversion = _incoming_conversion_operation(text, effect)
    if incoming_conversion is not None:
        operations.append(incoming_conversion)

    if "护甲有效率" in text and "非物理伤害" in text:
        value_min, value_max = _first_value_range(text)
        if value_min is not None and value_max is not None:
            operations.append(
                EquipmentEffectOperation(
                    kind="player_stat",
                    stat="non_physical_armor_effectiveness_percent",
                    value=(value_min + value_max) / 2.0,
                    value_min=value_min,
                    value_max=value_max,
                    source_text=effect,
                )
            )
    if "护甲减伤穿透" in text:
        value_min, value_max = _first_value_range(text)
        if value_min is not None and value_max is not None:
            operations.append(
                EquipmentEffectOperation(
                    kind="skill_stat",
                    stat="armor_reduction_penetration_percent",
                    value=(value_min + value_max) / 2.0,
                    value_min=value_min,
                    value_max=value_max,
                    source_text=effect,
                )
            )

    if "生命返还" in text:
        value_min, value_max = _first_value_range(text)
        if value_min is not None and value_max is not None:
            value = min(30.0, (value_min + value_max) / 2.0)
            operations.append(
                EquipmentEffectOperation(
                    kind="player_stat",
                    stat="life_return_percent",
                    value=value,
                    value_min=value_min,
                    value_max=value_max,
                    source_text=effect,
                )
            )
            if "护盾返还" in text:
                operations.append(
                    EquipmentEffectOperation(
                        kind="player_stat",
                        stat="shield_return_percent",
                        value=value,
                        value_min=value_min,
                        value_max=value_max,
                        source_text=effect,
                    )
                )

    if "免疫创伤" in text:
        operations.append(EquipmentEffectOperation(kind="player_stat", stat="immune_trauma", value=1.0, source_text=effect))
    if "免疫冰结" in text:
        operations.append(EquipmentEffectOperation(kind="player_stat", stat="immune_frostbite", value=1.0, source_text=effect))
        operations.append(EquipmentEffectOperation(kind="player_stat", stat="immune_frozen", value=1.0, source_text=effect))
    if "免疫减速" in text:
        operations.append(EquipmentEffectOperation(kind="player_stat", stat="immune_chill", value=1.0, source_text=effect))
    if "免疫虚弱" in text:
        operations.append(EquipmentEffectOperation(kind="player_stat", stat="immune_weakened", value=1.0, source_text=effect))

    if "基础点燃伤害" in text:
        value_min, value_max = _first_value_range(text)
        if value_min is not None and value_max is not None:
            operations.append(
                EquipmentEffectOperation(
                    kind="skill_stat",
                    stat="added_base_ignite_damage_per_second",
                    value=(value_min + value_max) / 2.0,
                    value_min=value_min,
                    value_max=value_max,
                    source_text=effect,
                )
            )
    if "加剧效果" in text:
        value_min, value_max = _first_value_range(text)
        if value_min is not None and value_max is not None:
            operations.append(
                EquipmentEffectOperation(
                    kind="skill_stat",
                    stat="aggravation_effect_add_percent",
                    value=(value_min + value_max) / 2.0,
                    value_min=value_min,
                    value_max=value_max,
                    source_text=effect,
                )
            )
    for phrase, stat in {
        "每秒施加加剧值": "aggravation_value_add",
        "冰结值上限": "frostbite_max_value_add",
        "点燃持续时间": "ignite_duration_add_percent",
        "点燃上限": "ignite_stacks_add",
        "麻痹效果": "numbed_effect_add_percent",
        "技能效果持续时间": "duration_add_percent",
    }.items():
        if phrase in text:
            value_min, value_max = _first_value_range(text)
            if value_min is not None and value_max is not None:
                operations.append(
                    EquipmentEffectOperation(
                        kind="skill_stat",
                        stat=stat,
                        value=(value_min + value_max) / 2.0,
                        value_min=value_min,
                        value_max=value_max,
                        source_text=effect,
                    )
                )

    if "直射投射物穿透次数" in text or "投射物穿透次数" in text:
        value_min, value_max = _first_value_range(text)
        if value_min is not None and value_max is not None:
            operations.append(
                EquipmentEffectOperation(
                    kind="skill_stat",
                    stat="pierce_count_add",
                    value=round((value_min + value_max) / 2.0),
                    value_min=value_min,
                    value_max=value_max,
                    source_text=effect,
                )
            )

    if "抛射投射物分裂数量" in text:
        value_min, value_max = _first_value_range(text)
        if value_min is not None and value_max is not None:
            operations.append(
                EquipmentEffectOperation(
                    kind="skill_stat",
                    stat="split_projectile_count_add",
                    value=round((value_min + value_max) / 2.0),
                    value_min=value_min,
                    value_max=value_max,
                    source_text=effect,
                )
            )

    for phrase, stat in {
        "引导层数上限": "channel_max_stacks_add",
        "引导层数下限": "channel_min_stacks_add",
    }.items():
        if phrase in text:
            value_min, value_max = _first_value_range(text)
            if value_min is not None and value_max is not None:
                operations.append(
                    EquipmentEffectOperation(
                        kind="skill_stat",
                        stat=stat,
                        value=round((value_min + value_max) / 2.0),
                        value_min=value_min,
                        value_max=value_max,
                        source_text=effect,
                    )
                )

    if "\u653b\u51fb\u548c\u6cd5\u672f\u683c\u6321\u7387" in text or "\u653b\u51fb\u4e0e\u6cd5\u672f\u683c\u6321\u7387" in text:
        value_min, value_max = _first_value_range(text)
        if value_min is not None and value_max is not None:
            value = (value_min + value_max) / 2.0
            for stat in ("attack_block_chance_percent", "spell_block_chance_percent"):
                operations.append(
                    EquipmentEffectOperation(
                        kind="player_stat",
                        stat=stat,
                        value=value,
                        value_min=value_min,
                        value_max=value_max,
                        source_text=effect,
                    )
                )

    if "格挡时" in text and "回复" in text:
        numbers = [float(value) for value in _ANY_NUMBER_RE.findall(text)]
        if numbers:
            recovery_percent = numbers[0]
            interval_ms = int(round((numbers[1] if len(numbers) > 1 else 0.0) * 1000.0))
            if "生命" in text:
                operations.extend(
                    (
                        EquipmentEffectOperation(kind="player_stat", stat="block_life_recovery_percent", value=recovery_percent, value_min=recovery_percent, value_max=recovery_percent, source_text=effect),
                        EquipmentEffectOperation(kind="player_stat", stat="block_life_recovery_interval_ms", value=interval_ms, value_min=interval_ms, value_max=interval_ms, source_text=effect),
                    )
                )
            if "护盾" in text:
                operations.extend(
                    (
                        EquipmentEffectOperation(kind="player_stat", stat="block_shield_recovery_percent", value=recovery_percent, value_min=recovery_percent, value_max=recovery_percent, source_text=effect),
                        EquipmentEffectOperation(kind="player_stat", stat="block_shield_recovery_interval_ms", value=interval_ms, value_min=interval_ms, value_max=interval_ms, source_text=effect),
                    )
                )

    if "击败敌人时" in text and "爆炸" in text:
        operations.append(
            EquipmentEffectOperation(
                kind="runtime_hook",
                runtime_hook="on_kill_explosion",
                source_text=effect,
                payload=_on_kill_explosion_runtime_payload(effect),
            )
        )
    if "造成伤害时" in text and "淘汰生命值低于" in text:
        value_min, value_max = _first_value_range(text)
        if value_min is not None and value_max is not None:
            operations.append(
                EquipmentEffectOperation(
                    kind="runtime_hook",
                    runtime_hook="cull_on_damage",
                    value=(value_min + value_max) / 2.0,
                    value_min=value_min,
                    value_max=value_max,
                    source_text=effect,
                    payload={"cull_threshold_percent": (value_min + value_max) / 2.0},
                )
            )
    if "拥有战意" in text:
        operations.append(EquipmentEffectOperation(kind="player_stat", stat="war_intent_enabled", value=1.0, source_text=effect))
    if "战意效果" in text:
        value_min, value_max = _first_value_range(text)
        if value_min is not None and value_max is not None:
            operations.append(
                EquipmentEffectOperation(
                    kind="player_stat",
                    stat="war_intent_effect_add_percent",
                    value=(value_min + value_max) / 2.0,
                    value_min=value_min,
                    value_max=value_max,
                    source_text=effect,
                )
            )
    if "获得法术激进" in text and "召唤物" not in text:
        operations.extend(
            (
                EquipmentEffectOperation(kind="skill_stat", stat="cast_speed_add_percent", value=7.0, source_text=effect),
                EquipmentEffectOperation(kind="skill_stat", stat="spell_damage_add_percent", value=7.0, source_text=effect),
                EquipmentEffectOperation(kind="skill_stat", stat="movement_skill_cooldown_recovery_add_percent", value=7.0, source_text=effect),
            )
        )
    if "获得攻击激进" in text and "召唤物" not in text:
        operations.extend(
            (
                EquipmentEffectOperation(kind="skill_stat", stat="attack_speed_add_percent", value=5.0, source_text=effect),
                EquipmentEffectOperation(kind="skill_stat", stat="attack_damage_add_percent", value=5.0, source_text=effect),
                EquipmentEffectOperation(kind="player_stat", stat="move_speed", value=10.0, source_text=effect),
            )
        )
    if "拥有迅捷" in text:
        operations.extend(
            (
                EquipmentEffectOperation(kind="skill_stat", stat="attack_speed_add_percent", value=8.0, source_text=effect),
                EquipmentEffectOperation(kind="skill_stat", stat="cast_speed_add_percent", value=8.0, source_text=effect),
                EquipmentEffectOperation(kind="player_stat", stat="move_speed", value=8.0, source_text=effect),
                EquipmentEffectOperation(kind="skill_stat", stat="movement_skill_cooldown_recovery_add_percent", value=8.0, source_text=effect),
            )
        )
    if "每 27 点属性" in text and "伤害" in text:
        operations.append(EquipmentEffectOperation(kind="skill_stat", stat="damage_add_percent_per_27_attributes", value=1.0, source_text=effect))
    if "每 12 点属性" in text and "伤害" in text:
        operations.append(EquipmentEffectOperation(kind="skill_stat", stat="damage_add_percent_per_12_attributes", value=1.0, source_text=effect))
    if "全属性" in text:
        value_min, value_max = _first_value_range(text)
        if value_min is not None and value_max is not None:
            value = (value_min + value_max) / 2.0
            for stat in ("strength", "dexterity", "intelligence"):
                operations.append(EquipmentEffectOperation(kind="player_stat", stat=stat, value=value, value_min=value_min, value_max=value_max, source_text=effect))
    if "异常基础伤害" in text:
        value_min, value_max = _added_damage_average_range(text)
        if value_min is not None and value_max is not None:
            operations.append(
                EquipmentEffectOperation(
                    kind="skill_stat",
                    stat="added_base_ailment_damage_per_second",
                    value=(value_min + value_max) / 2.0,
                    value_min=value_min,
                    value_max=value_max,
                    source_text=effect,
                )
            )
    if "基础创伤伤害" in text:
        value_min, value_max = _added_damage_average_range(text)
        if value_min is not None and value_max is not None:
            operations.append(
                EquipmentEffectOperation(
                    kind="skill_stat",
                    stat="added_base_trauma_damage_per_second",
                    value=(value_min + value_max) / 2.0,
                    value_min=value_min,
                    value_max=value_max,
                    source_text=effect,
                )
            )
    if "创伤持续时间" in text:
        value_min, value_max = _first_value_range(text)
        if value_min is not None and value_max is not None:
            operations.append(EquipmentEffectOperation(kind="skill_stat", stat="trauma_duration_add_percent", value=(value_min + value_max) / 2.0, value_min=value_min, value_max=value_max, source_text=effect))
    if "异常状态持续时间" in text:
        value_min, value_max = _first_value_range(text)
        if value_min is not None and value_max is not None:
            operations.append(EquipmentEffectOperation(kind="skill_stat", stat="ailment_duration_add_percent", value=(value_min + value_max) / 2.0, value_min=value_min, value_max=value_max, source_text=effect))
    if "几率避免元素异常状态" in text:
        value_min, value_max = _first_value_range(text)
        if value_min is not None and value_max is not None:
            operations.append(EquipmentEffectOperation(kind="player_stat", stat="avoid_elemental_ailments_percent", value=(value_min + value_max) / 2.0, value_min=value_min, value_max=value_max, source_text=effect))
    if "每 0.1 秒受到" in text and "真实伤害" in text:
        value_min, value_max = _first_value_range(text)
        if value_min is not None and value_max is not None:
            operations.append(EquipmentEffectOperation(kind="player_stat", stat="self_true_damage_per_100ms", value=(value_min + value_max) / 2.0, value_min=value_min, value_max=value_max, source_text=effect))
    if "伤害优先抵扣魔力" in text:
        value_min, value_max = _first_value_range(text)
        if value_min is not None and value_max is not None:
            operations.append(EquipmentEffectOperation(kind="player_stat", stat="damage_taken_from_mana_before_life_percent", value=(value_min + value_max) / 2.0, value_min=value_min, value_max=value_max, source_text=effect))
    if "屏障吸收量" in text:
        value_min, value_max = _first_value_range(text)
        if value_min is not None and value_max is not None:
            operations.append(EquipmentEffectOperation(kind="player_stat", stat="barrier_absorb_amount_add_percent", value=(value_min + value_max) / 2.0, value_min=value_min, value_max=value_max, source_text=effect))
    if "移动时" in text and "每秒回复" in text and "护盾" in text:
        value_min, value_max = _first_value_range(text)
        if value_min is not None and value_max is not None:
            operations.append(
                EquipmentEffectOperation(
                    kind="player_stat",
                    stat="moving_shield_recovery_percent_per_second",
                    value=(value_min + value_max) / 2.0,
                    value_min=value_min,
                    value_max=value_max,
                    source_text=effect,
                )
            )
    if "每移动" in text and "获得屏障" in text:
        numbers = [float(value) for value in _ANY_NUMBER_RE.findall(text)]
        if numbers:
            distance = numbers[0]
            chance = numbers[1] if len(numbers) > 1 else 100.0
            operations.extend(
                (
                    EquipmentEffectOperation(kind="player_stat", stat="movement_barrier_distance", value=distance, value_min=distance, value_max=distance, source_text=effect),
                    EquipmentEffectOperation(kind="player_stat", stat="movement_barrier_chance_percent", value=chance, value_min=chance, value_max=chance, source_text=effect),
                )
            )
    if "防御值" in text:
        value_min, value_max = _first_value_range(text)
        if value_min is not None and value_max is not None:
            value = (value_min + value_max) / 2.0
            for stat in ("armor_add_percent", "evasion_add_percent", "max_energy_shield_add_percent"):
                operations.append(EquipmentEffectOperation(kind="player_stat", stat=stat, value=value, value_min=value_min, value_max=value_max, source_text=effect))
    for phrase, stat in {
        "恶化几率": "deterioration_chance_add_percent",
        "恶化伤害": "deterioration_damage_add_percent",
        "恶化持续时间": "deterioration_duration_add_percent",
    }.items():
        if phrase in text:
            value_min, value_max = _first_value_range(text)
            if value_min is not None and value_max is not None:
                operations.append(EquipmentEffectOperation(kind="skill_stat", stat=stat, value=(value_min + value_max) / 2.0, value_min=value_min, value_max=value_max, source_text=effect))
    for phrase, stat in {
        "主动技能等级": "active_gem_level_add",
        "攻击技能等级": "attack_skill_level_add",
        "法术技能等级": "spell_skill_level_add",
        "辅助技能等级": "support_gem_level_add",
        "物理技能等级": "physical_skill_level_add",
        "火焰技能等级": "fire_skill_level_add",
        "冰霜技能等级": "cold_skill_level_add",
        "闪电技能等级": "lightning_skill_level_add",
        "混沌技能等级": "chaos_skill_level_add",
        "核心技能等级": "core_skill_level_add",
    }.items():
        if phrase in text:
            value_min, value_max = _first_value_range(text)
            if value_min is not None and value_max is not None:
                operations.append(
                    EquipmentEffectOperation(
                        kind="skill_stat",
                        stat=stat,
                        value=round((value_min + value_max) / 2.0),
                        value_min=value_min,
                        value_max=value_max,
                        source_text=effect,
                    )
                )
    unique: list[EquipmentEffectOperation] = []
    seen: set[tuple[str, str, str]] = set()
    for operation in operations:
        key = (operation.kind, operation.stat, operation.runtime_hook)
        if key in seen:
            continue
        seen.add(key)
        unique.append(operation)
    return tuple(unique)


_EQUIPMENT_EFFECT_STAT_PATTERNS: tuple[tuple[str, str, str], ...] = (
    ("最大生命", "max_life", "player_stat"),
    ("最大魔力", "max_mana", "player_stat"),
    ("最大护盾", "max_energy_shield", "player_stat"),
    ("护甲值", "armor", "player_stat"),
    ("闪避值", "evasion", "player_stat"),
    ("能量护盾", "max_energy_shield", "player_stat"),
    ("护盾充能速度", "energy_shield_charge_speed_percent", "player_stat"),
    ("移动速度", "move_speed", "player_stat"),
    ("火焰抗性", "fire_resistance_percent", "player_stat"),
    ("冰霜抗性", "cold_resistance_percent", "player_stat"),
    ("闪电抗性", "lightning_resistance_percent", "player_stat"),
    ("混沌抗性", "chaos_resistance_percent", "player_stat"),
    ("元素抗性", "elemental_resistance_percent", "player_stat"),
    ("力量", "strength", "player_stat"),
    ("敏捷", "dexterity", "player_stat"),
    ("智慧", "intelligence", "player_stat"),
    ("攻击速度", "attack_speed_add_percent", "skill_stat"),
    ("施法速度", "cast_speed_add_percent", "skill_stat"),
    ("冷却回复速度", "cooldown_recovery_add_percent", "skill_stat"),
    ("技能范围", "area_add_percent", "skill_stat"),
    ("\u6295\u5c04\u7269\u6570\u91cf", "projectile_count_add", "skill_stat"),
    ("\u6295\u5c04\u7269\u901f\u5ea6", "projectile_speed_add_percent", "skill_stat"),
    ("暴击值", "crit_rating", "skill_stat"),
    ("暴击伤害", "crit_damage_add_percent", "skill_stat"),
    ("元素和混沌抗性穿透", "resistance_penetration_percent", "skill_stat"),
    ("额外", "damage_final_percent", "skill_stat"),
    ("攻击伤害", "attack_damage_add_percent", "skill_stat"),
    ("法术伤害", "spell_damage_add_percent", "skill_stat"),
    ("近战伤害", "melee_damage_add_percent", "skill_stat"),
    ("远程伤害", "ranged_damage_add_percent", "skill_stat"),
    ("投射物伤害", "projectile_damage_add_percent", "skill_stat"),
    ("物理伤害", "physical_damage_add_percent", "skill_stat"),
    ("元素伤害", "elemental_damage_add_percent", "skill_stat"),
    ("混沌伤害", "chaos_damage_add_percent", "skill_stat"),
    ("火焰伤害", "fire_damage_add_percent", "skill_stat"),
    ("冰霜伤害", "cold_damage_add_percent", "skill_stat"),
    ("闪电伤害", "lightning_damage_add_percent", "skill_stat"),
    ("连续攻击几率", "continuous_attack_chance_percent", "skill_stat"),
    ("斩击伤害", "slash_chance_add_percent", "skill_stat"),
)


def _natural_regen_operation(effect: str, source_text: str) -> EquipmentEffectOperation | None:
    if "每秒自然回复" not in effect or "%" in effect:
        return None
    stat = ""
    if "生命" in effect:
        stat = "life_regen_flat"
    elif "魔力" in effect:
        stat = "mana_regen_flat"
    if not stat:
        return None
    value_min, value_max = _first_value_range(effect)
    if value_min is None or value_max is None:
        return None
    return EquipmentEffectOperation(
        kind="player_stat",
        stat=stat,
        value=(value_min + value_max) / 2.0,
        value_min=value_min,
        value_max=value_max,
        source_text=source_text,
    )


def _safe_existing_stat_operations(effect: str, source_text: str) -> tuple[EquipmentEffectOperation, ...]:
    operations: list[EquipmentEffectOperation] = []
    for phrase, stat, kind in (
        ("光环效果", "aura_effect_add_percent", "skill_stat"),
        ("护盾返还", "shield_return_percent", "player_stat"),
        ("格挡比例", "block_damage_reduction_percent", "player_stat"),
        ("几率造成双倍伤害", "double_damage_chance_percent", "skill_stat"),
        ("魔力自然回复速度", "mana_regen_add_percent", "player_stat"),
        ("生命自然回复速度", "life_regen_add_percent", "player_stat"),
        ("异常伤害加深", "ailment_damage_deepen_percent", "skill_stat"),
    ):
        if phrase not in effect:
            continue
        value_min, value_max = _first_value_range(effect)
        if value_min is None or value_max is None:
            continue
        operations.append(
            EquipmentEffectOperation(
                kind=kind,
                stat=stat,
                value=(value_min + value_max) / 2.0,
                value_min=value_min,
                value_max=value_max,
                source_text=source_text,
            )
        )

    if _is_exact_percent_effect(effect, "持续伤害"):
        value_min, value_max = _first_value_range(effect)
        if value_min is not None and value_max is not None:
            operations.append(
                EquipmentEffectOperation(
                    kind="skill_stat",
                    stat="dot_damage_add_percent",
                    value=(value_min + value_max) / 2.0,
                    value_min=value_min,
                    value_max=value_max,
                    source_text=source_text,
                )
            )
    elif "每秒自然回复" in effect and "%" in effect and "生命" in effect:
        value_min, value_max = _first_value_range(effect)
        if value_min is not None and value_max is not None:
            operations.append(
                EquipmentEffectOperation(
                    kind="player_stat",
                    stat="life_regen_percent_per_second",
                    value=(value_min + value_max) / 2.0,
                    value_min=value_min,
                    value_max=value_max,
                    source_text=source_text,
                )
            )
    elif _is_exact_percent_effect(effect, "伤害"):
        value_min, value_max = _first_value_range(effect)
        if value_min is not None and value_max is not None:
            operations.append(
                EquipmentEffectOperation(
                    kind="skill_stat",
                    stat="damage_add_percent",
                    value=(value_min + value_max) / 2.0,
                    value_min=value_min,
                    value_max=value_max,
                    source_text=source_text,
                )
            )

    if "该装备护盾" in effect:
        value_min, value_max = _first_value_range(effect)
        if value_min is not None and value_max is not None:
            operations.append(
                EquipmentEffectOperation(
                    kind="local_stat",
                    stat="local_energy_shield_add_percent" if "%" in effect else "local_energy_shield",
                    value=(value_min + value_max) / 2.0,
                    value_min=value_min,
                    value_max=value_max,
                    source_text=source_text,
                )
            )
    return tuple(operations)


def _is_exact_percent_effect(effect: str, phrase: str) -> bool:
    text = _normalize_effect_text(effect).strip()
    if "\n" in effect or "召唤物" in text or "额外" in text:
        return False
    return bool(re.fullmatch(rf"\+\s*(?:\(-?\d+(?:\.\d+)?\s*-\s*-?\d+(?:\.\d+)?\)|-?\d+(?:\.\d+)?)%\s*{re.escape(phrase)}", text))


def _normalize_effect_text(effect: str) -> str:
    return effect.replace("\n", " ").replace("–", "-")


def _requires_design_alignment_before_mapping(effect: str) -> bool:
    return False


def _first_value_range(effect: str) -> tuple[float | None, float | None]:
    range_match = _PAREN_RANGE_RE.search(effect)
    if range_match:
        return float(range_match.group(1)), float(range_match.group(2))
    plain_range_match = _PLAIN_RANGE_RE.search(effect)
    if plain_range_match:
        return float(plain_range_match.group(1)), float(plain_range_match.group(2))
    number_match = _ANY_NUMBER_RE.search(effect)
    if number_match:
        value = float(number_match.group(0))
        return value, value
    return None, None


def _added_damage_average_range(effect: str) -> tuple[float | None, float | None]:
    ranges = _PAREN_RANGE_RE.findall(effect)
    if len(ranges) >= 2:
        low_min, low_max = (float(ranges[0][0]), float(ranges[0][1]))
        high_min, high_max = (float(ranges[1][0]), float(ranges[1][1]))
        return (low_min + high_min) / 2.0, (low_max + high_max) / 2.0
    return _first_value_range(effect)


def _incoming_conversion_operation(effect: str, source_text: str) -> EquipmentEffectOperation | None:
    if "受到的" not in effect or "转化为" not in effect:
        return None
    source = ""
    target = ""
    for label, damage_type in {
        "物理": "physical",
        "火焰": "fire",
        "冰冷": "cold",
        "冰霜": "cold",
        "闪电": "lightning",
        "腐蚀": "chaos",
        "混沌": "chaos",
    }.items():
        if f"受到的{label}伤害" in effect:
            source = damage_type
        if f"转化为{label}伤害" in effect:
            target = damage_type
    if not source or not target or source == target:
        return None
    value_min, value_max = _first_value_range(effect)
    if value_min is None or value_max is None:
        return None
    return EquipmentEffectOperation(
        kind="player_stat",
        stat=f"incoming_conversion_{source}_to_{target}_percent",
        value=(value_min + value_max) / 2.0,
        value_min=value_min,
        value_max=value_max,
        source_text=source_text,
    )


def _on_kill_explosion_runtime_payload(effect: str) -> dict[str, object]:
    text = _normalize_effect_text(effect)
    ranges = [
        (float(minimum), float(maximum))
        for minimum, maximum in _PAREN_RANGE_RE.findall(text)
    ]
    numbers = [float(match.group(0)) for match in _ANY_NUMBER_RE.finditer(text)]
    if len(ranges) >= 2:
        chance = (ranges[0][0] + ranges[0][1]) / 2.0
        max_life_percent = (ranges[-1][0] + ranges[-1][1]) / 2.0
        radius = numbers[2] if len(numbers) >= 5 else 0.0
    else:
        chance = numbers[0] if len(numbers) >= 1 else 0.0
        radius = numbers[1] if len(numbers) >= 2 else 0.0
        max_life_percent = numbers[2] if len(numbers) >= 3 else 0.0
    return {
        "on_kill_explosion_chance_percent": chance,
        "on_kill_explosion_radius": radius,
        "on_kill_explosion_max_life_percent": max_life_percent,
        "on_kill_explosion_damage_type": "true",
    }


def _proposed_alignment_hook(effect: str) -> str:
    text = _normalize_effect_text(effect)
    if "受到" in text or "转化为" in text:
        return "incoming_damage_conversion_or_mitigation"
    if "诅咒" in text:
        return "curse_runtime_state"
    if "召唤" in text or "召唤物" in text:
        return "summon_runtime"
    if "光环" in text or "封印" in text:
        return "aura_or_mana_seal_runtime"
    return "equipment_affix_runtime_hook"


_RANGE_TOKEN = "__EQUIP_RANGE_{index}__"
_EN_DASH_RANGE_RE = re.compile(r"(-?\d+(?:\.\d+)?)\s*–\s*(-?\d+(?:\.\d+)?)")
_ROLL_RANGE_RE = re.compile(
    r"\((-?\d+(?:\.\d+)?)\s*[–-]\s*(-?\d+(?:\.\d+)?)\)"
    r"|(?<![\d.])(-?\d+(?:\.\d+)?)\s*[–-]\s*(-?\d+(?:\.\d+)?)(?![\d.])"
)
_SIGNED_NUMBER_RE = re.compile(r"(?P<sign>[+-])(?P<number>\d+(?:\.\d+)?)")


def _roll_effect_text(effect: str, rng: random.Random) -> str:
    def replace_range(match: re.Match[str]) -> str:
        minimum = match.group(1) if match.group(1) is not None else match.group(3)
        maximum = match.group(2) if match.group(2) is not None else match.group(4)
        return _roll_range_number_text(minimum, maximum, rng)

    return _ROLL_RANGE_RE.sub(replace_range, effect)


def _roll_range_number_text(minimum: str, maximum: str, rng: random.Random) -> str:
    low = float(minimum)
    high = float(maximum)
    if low > high:
        low, high = high, low
        minimum, maximum = maximum, minimum
    if "." not in minimum and "." not in maximum:
        return str(rng.randint(int(low), int(high)))
    precision = max(_decimal_places(minimum), _decimal_places(maximum))
    value = rng.uniform(low, high)
    return f"{value:.{precision}f}".rstrip("0").rstrip(".")


def _decimal_places(value: str) -> int:
    return len(value.partition(".")[2])


def _scale_effect_text(effect: str, scale: float) -> str:
    replacements: list[str] = []

    def replace_range(match: re.Match[str]) -> str:
        index = len(replacements)
        minimum = _scale_number_text(match.group(1), scale)
        maximum = _scale_number_text(match.group(2), scale)
        replacements.append(f"{minimum}–{maximum}")
        return _RANGE_TOKEN.format(index=index)

    masked = _EN_DASH_RANGE_RE.sub(replace_range, effect)

    def replace_signed(match: re.Match[str]) -> str:
        return f'{match.group("sign")}{_scale_number_text(match.group("number"), scale)}'

    scaled = _SIGNED_NUMBER_RE.sub(replace_signed, masked)
    for index, value in enumerate(replacements):
        scaled = scaled.replace(_RANGE_TOKEN.format(index=index), value)
    return scaled


def _scale_number_text(value: str, scale: float) -> str:
    numeric = float(value)
    scaled = numeric * scale
    if "." in value:
        rounded = round(scaled, 2)
        if numeric > 0 and 0 < rounded < 0.01:
            rounded = 0.01
        return f"{rounded:g}"
    rounded_int = round(scaled)
    if numeric > 0 and rounded_int < 1:
        rounded_int = 1
    if numeric < 0 and rounded_int > -1:
        rounded_int = -1
    return str(int(rounded_int))
