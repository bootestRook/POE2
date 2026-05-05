from __future__ import annotations

import random
import re
from dataclasses import dataclass, replace
from pathlib import Path


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
SUPPORTED_UNDERLYING_MECHANIC_KEYWORDS = ("战意", "引导")
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
            effect=definition.effect,
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


_RANGE_TOKEN = "__EQUIP_RANGE_{index}__"
_EN_DASH_RANGE_RE = re.compile(r"(-?\d+(?:\.\d+)?)\s*–\s*(-?\d+(?:\.\d+)?)")
_SIGNED_NUMBER_RE = re.compile(r"(?P<sign>[+-])(?P<number>\d+(?:\.\d+)?)")


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
