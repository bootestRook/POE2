from __future__ import annotations

import ast
import json
import re
import tomllib
from copy import deepcopy
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from liufang.torchlight_adoption import (
    active_product_ids,
    manifest_present,
    passive_product_ids,
    support_product_ids,
)

GEM_KINDS = frozenset({"active_skill", "passive_skill", "support"})
ALLOWED_SKILL_BEHAVIOR_TEMPLATES = frozenset(
    {
        "projectile",
        "chain",
        "player_nova",
        "melee_arc",
        "damage_zone",
        "orbit_emitter",
        "line_pierce",
        "orbit",
        "delayed_area",
    }
)
LOCALIZATION_KEY_PATTERN = re.compile(r"^[a-z][a-z0-9_.-]*$")
SCRIPT_FIELD_NAMES = frozenset(
    {
        "script",
        "scripts",
        "code",
        "expression",
        "expressions",
        "formula",
        "formulas",
        "dsl",
    }
)
SKILL_PACKAGE_REQUIRED_PATHS = (
    ("id",),
    ("version",),
    ("display", "name_key"),
    ("display", "description_key"),
    ("classification", "tags"),
    ("classification", "damage_type"),
    ("classification", "damage_form"),
    ("cast", "mode"),
    ("cast", "target_selector"),
    ("cast", "search_range"),
    ("cast", "cooldown_ms"),
    ("cast", "release_interval_ms"),
    ("cast", "base_cooldown_ms"),
    ("cast", "trigger_interval_ms"),
    ("cast", "mana_cost"),
    ("cast", "windup_ms"),
    ("cast", "recovery_ms"),
    ("behavior", "template"),
    ("behavior", "params"),
    ("hit", "base_damage"),
    ("hit", "can_crit"),
    ("hit", "can_apply_status"),
    ("scaling", "additive_stats"),
    ("scaling", "final_stats"),
    ("scaling", "runtime_params"),
    ("presentation", "vfx"),
    ("presentation", "sfx"),
    ("presentation", "floating_text"),
    ("presentation", "screen_feedback"),
    ("preview", "show_fields"),
)
SKILL_PACKAGE_TOP_LEVEL_FIELDS = frozenset(
    {
        "id",
        "version",
        "product_status",
        "source_values",
        "level_table",
        "auto_release",
        "display",
        "classification",
        "cast",
        "behavior",
        "modules",
        "hit",
        "scaling",
        "presentation",
        "preview",
    }
)
SKILL_PACKAGE_FIELD_ALLOWLISTS = {
    "display": frozenset({"name_key", "description_key"}),
    "classification": frozenset({"tags", "damage_type", "damage_form"}),
    "cast": frozenset(
        {
            "mode",
            "target_selector",
            "search_range",
            "cooldown_ms",
            "release_interval_ms",
            "base_cooldown_ms",
            "trigger_interval_ms",
            "mana_cost",
            "windup_ms",
            "recovery_ms",
        }
    ),
    "behavior": frozenset({"template", "params"}),
    "hit": frozenset(
        {
            "base_damage",
            "can_crit",
            "can_apply_status",
            "damage_timing",
            "hit_delay_ms",
            "hit_radius",
            "target_policy",
        }
    ),
    "scaling": frozenset({"additive_stats", "final_stats", "runtime_params"}),
    "presentation": frozenset(
        {
            "vfx",
            "cast_vfx_key",
            "projectile_vfx_key",
            "hit_vfx_key",
            "sfx",
            "floating_text",
            "floating_text_style",
            "screen_feedback",
            "vfx_scale",
            "hit_stop_ms",
            "camera_shake",
        }
    ),
    "preview": frozenset({"show_fields"}),
}
ALLOWED_PREVIEW_SHOW_FIELDS = frozenset(
    {
        "final_damage",
        "final_cooldown_ms",
        "actual_interval_ms",
        "projectile_count",
        "speed_multiplier",
        "release_interval_ms",
        "base_damage",
        "base_cooldown_ms",
        "base_release_interval_ms",
        "trigger_interval_ms",
        "mana_cost",
        "damage_type",
        "damage_form",
        "trajectory",
        "travel_time_ms",
        "arc_height",
        "target_policy",
        "impact_marker_id",
        "trigger_marker_id",
        "trigger_delay_ms",
        "duration_ms",
        "tick_interval_ms",
        "orbit_radius",
        "orbit_speed_deg_per_sec",
        "orb_count",
        "start_angle_deg",
        "orbit_radius_cycle_enabled",
        "orbit_radius_cycle_amplitude",
        "orbit_radius_cycle_period_ms",
        "orbit_radius_cycle_phase_deg",
        "tick_marker_id",
        "radius",
    }
)


@dataclass(frozen=True)
class PassiveEffect:
    stat: str
    value: float
    layer: str
    target: str


@dataclass(frozen=True)
class GemDefinition:
    base_gem_id: str
    gem_type: str
    gem_kind: str
    sudoku_digit: int
    tags: frozenset[str]
    name_key: str = ""
    description_key: str = ""
    category: str = ""
    effect_stats: tuple[str, ...] = ()
    passive_effects: tuple[PassiveEffect, ...] = ()
    skill_template_id: str | None = None
    visual_effect: str = ""
    shape_effect: str = ""
    apply_filter_target_kinds: frozenset[str] = frozenset()
    apply_filter_tags_any: frozenset[str] = frozenset()
    apply_filter_tags_all: frozenset[str] = frozenset()
    apply_filter_tags_none: frozenset[str] = frozenset()
    source_values: dict[str, Any] = field(default_factory=dict)
    level_table: dict[str, Any] = field(default_factory=dict)
    auto_release: dict[str, Any] = field(default_factory=dict)

    @property
    def is_active_skill(self) -> bool:
        return self.gem_kind == "active_skill"

    @property
    def is_passive_skill(self) -> bool:
        return self.gem_kind == "passive_skill"

    @property
    def is_support(self) -> bool:
        return self.gem_kind == "support"


@dataclass(frozen=True)
class AffixDefinition:
    affix_id: str
    gen: str
    category: str
    stat: str
    value_range: tuple[int | float, int | float]
    group: str
    spawn_weights: dict[str, int]
    apply_filter_tags: frozenset[str]
    name_key: str = ""
    description_key: str = ""


@dataclass(frozen=True)
class PlayerStatDefinition:
    stat_id: str
    name_key: str
    category: str
    value_type: str
    v1_status: str
    runtime_effective: bool
    affix_spawn_enabled_v1: bool


@dataclass(frozen=True)
class CharacterPanelRow:
    row_id: str
    section_id: str
    stat_id: str
    icon_text: str
    tone: str
    formatter: str
    order: int


@dataclass(frozen=True)
class CharacterPanelSection:
    section_id: str
    title_key: str
    layout: str
    order: int
    rows: tuple[CharacterPanelRow, ...]


@dataclass(frozen=True)
class MonsterDefinition:
    monster_id: str
    numeric_id: int
    tier: str
    role: str
    visual_rarity: str
    palette_key: str
    group_numeric_id: int
    marker_id: str
    name_key: str
    geometry_shape: str
    primary_color: str
    accent_color: str
    size_px: int
    base_life: float
    base_attack: float
    rarity_arc_color: str
    rarity_arc_segments: int
    rarity_arc_width_px: int
    rarity_pedestal_shape: str
    rarity_pedestal_color: str
    rarity_pedestal_alpha: float
    rarity_pedestal_radius_scale: float
    rarity_pedestal_line_width_px: float
    rarity_pedestal_pulse: bool
    movement_kind: str
    movement_interval_sec: float
    movement_distance_px: int
    fallback_unit_visual: str


@dataclass(frozen=True)
class MonsterGroup:
    group_id: str
    numeric_id: int
    tier: str
    name_key: str
    selection_policy: str
    member_ids: tuple[str, ...]


@dataclass(frozen=True)
class BoardRules:
    rows: int
    columns: int
    box_rows: int
    box_columns: int
    allowed_gem_types: frozenset[str]
    allowed_sudoku_digits: frozenset[int]
    require_active_skill_to_enter_combat: bool
    allow_empty_board_to_enter_combat: bool


@dataclass(frozen=True)
class SkillTemplate:
    template_id: str
    tags: frozenset[str]
    base_damage: float
    base_release_interval_ms: int
    base_cooldown_ms: int
    trigger_interval_ms: int
    mana_cost: int
    name_key: str = ""
    damage_type: str = ""
    behavior_type: str = ""
    visual_effect: str = ""
    scaling_stats: tuple[str, ...] = ()
    skill_package_id: str = ""
    skill_package_version: str = ""
    behavior_template: str = ""
    damage_form: str = ""
    cast: dict[str, Any] = field(default_factory=dict)
    hit: dict[str, Any] = field(default_factory=dict)
    runtime_params: dict[str, Any] = field(default_factory=dict)
    presentation_keys: dict[str, Any] = field(default_factory=dict)
    preview_show_fields: tuple[str, ...] = ()
    source_values: dict[str, Any] = field(default_factory=dict)
    level_table: dict[str, Any] = field(default_factory=dict)
    auto_release: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class SupportBaseModifier:
    support_id: str
    stat: str
    value: float
    layer: str


@dataclass(frozen=True)
class ConduitAmplifier:
    support_id: str
    relation: str
    multiplier: float


@dataclass(frozen=True)
class SkillScalingRules:
    stat_layers: dict[str, str]
    support_base_modifiers: tuple[SupportBaseModifier, ...]
    conduit_amplifiers: tuple[ConduitAmplifier, ...]


def load_toml(path: Path) -> dict[str, Any]:
    with path.open("rb") as handle:
        data = tomllib.load(handle)
    if not isinstance(data, dict):
        raise ValueError(f"TOML root must be a table: {path}")
    return data


def load_yaml_file(path: Path) -> dict[str, Any]:
    data: dict[str, Any] = {}
    stack: list[tuple[int, dict[str, Any]]] = [(-1, data)]
    for line_number, raw_line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        line = raw_line.split("#", 1)[0].rstrip()
        if not line.strip():
            continue
        indent = len(line) - len(line.lstrip(" "))
        if indent % 2 != 0:
            raise ValueError(f"YAML indentation must use two-space levels: {path}:{line_number}")
        while stack and indent <= stack[-1][0]:
            stack.pop()
        if not stack:
            raise ValueError(f"YAML indentation is invalid: {path}:{line_number}")
        key, separator, value = line.strip().partition(":")
        if not separator or not key.strip():
            raise ValueError(f"YAML line must be a key/value pair: {path}:{line_number}")
        parent = stack[-1][1]
        key = key.strip()
        value = value.strip()
        if value == "":
            child: dict[str, Any] = {}
            parent[key] = child
            stack.append((indent, child))
        else:
            parent[key] = _parse_yaml_scalar(value)
    return data


def _parse_yaml_scalar(value: str) -> Any:
    if value in {"true", "True"}:
        return True
    if value in {"false", "False"}:
        return False
    if value in {"null", "Null", "~"}:
        return None
    if value.startswith("[") and value.endswith("]"):
        try:
            parsed = ast.literal_eval(value)
        except (SyntaxError, ValueError) as exc:
            raise ValueError(f"YAML inline arrays must use quoted scalar values: {value}") from exc
        if not isinstance(parsed, list):
            raise ValueError(f"YAML inline array expected: {value}")
        return parsed
    if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
        return ast.literal_eval(value)
    try:
        return int(value)
    except ValueError:
        try:
            return float(value)
        except ValueError:
            return value


def load_localization(config_root: Path) -> dict[str, str]:
    data = load_toml(config_root / "localization" / "zh_cn.toml")
    strings = data.get("strings", {})
    if not isinstance(strings, dict):
        raise ValueError("localization/zh_cn.toml must contain [strings]")
    return {str(key): str(value) for key, value in strings.items()}


def load_player_stat_definitions(config_root: Path) -> dict[str, PlayerStatDefinition]:
    data = load_toml(config_root / "player" / "player_stat_defs.toml")
    definitions: dict[str, PlayerStatDefinition] = {}
    for entry in data.get("stats", []):
        stat_id = str(entry["id"])
        definitions[stat_id] = PlayerStatDefinition(
            stat_id=stat_id,
            name_key=str(entry["name_key"]),
            category=str(entry["category"]),
            value_type=str(entry["value_type"]),
            v1_status=str(entry["v1_status"]),
            runtime_effective=bool(entry["runtime_effective"]),
            affix_spawn_enabled_v1=bool(entry["affix_spawn_enabled_v1"]),
        )
    return definitions


def load_player_base_stats(config_root: Path) -> dict[str, int | float | bool]:
    data = load_toml(config_root / "player" / "player_base_stats.toml")
    player_base = data.get("player_base", {})
    if not isinstance(player_base, dict):
        raise ValueError("player/player_base_stats.toml must contain [player_base]")
    result: dict[str, int | float | bool] = {}
    for key, value in player_base.items():
        if not isinstance(value, (int, float, bool)):
            raise ValueError(f"player base stat must be numeric or boolean: {key}")
        result[str(key)] = value
    return result


def load_character_panel_sections(config_root: Path) -> tuple[CharacterPanelSection, ...]:
    data = load_toml(config_root / "player" / "character_panel.toml")
    raw_rows = data.get("rows", [])
    rows_by_section: dict[str, list[CharacterPanelRow]] = {}
    for entry in raw_rows:
        row = CharacterPanelRow(
            row_id=str(entry["id"]),
            section_id=str(entry["section_id"]),
            stat_id=str(entry["stat_id"]),
            icon_text=str(entry.get("icon_text", "")),
            tone=str(entry.get("tone", "")),
            formatter=str(entry.get("formatter", "auto")),
            order=int(entry.get("order", 0)),
        )
        rows_by_section.setdefault(row.section_id, []).append(row)

    sections: list[CharacterPanelSection] = []
    for entry in data.get("sections", []):
        section_id = str(entry["id"])
        rows = tuple(sorted(rows_by_section.get(section_id, []), key=lambda row: (row.order, row.row_id)))
        sections.append(
            CharacterPanelSection(
                section_id=section_id,
                title_key=str(entry["title_key"]),
                layout=str(entry.get("layout", "detail")),
                order=int(entry.get("order", 0)),
                rows=rows,
            )
        )
    return tuple(sorted(sections, key=lambda section: (section.order, section.section_id)))


def load_monster_definitions(config_root: Path) -> dict[str, MonsterDefinition]:
    data = load_toml(config_root / "monsters" / "monster_defs.toml")
    definitions: dict[str, MonsterDefinition] = {}
    for entry in data.get("monsters", []):
        monster_id = str(entry["id"])
        definitions[monster_id] = MonsterDefinition(
            monster_id=monster_id,
            numeric_id=int(entry["numeric_id"]),
            tier=str(entry["tier"]),
            role=str(entry["role"]),
            visual_rarity=str(entry["visual_rarity"]),
            palette_key=str(entry["palette_key"]),
            group_numeric_id=int(entry["group_numeric_id"]),
            marker_id=str(entry["marker_id"]),
            name_key=str(entry["name_key"]),
            geometry_shape=str(entry["geometry_shape"]),
            primary_color=str(entry["primary_color"]),
            accent_color=str(entry["accent_color"]),
            size_px=int(entry["size_px"]),
            base_life=float(entry["base_life"]),
            base_attack=float(entry["base_attack"]),
            rarity_arc_color=str(entry["rarity_arc_color"]),
            rarity_arc_segments=int(entry["rarity_arc_segments"]),
            rarity_arc_width_px=int(entry["rarity_arc_width_px"]),
            rarity_pedestal_shape=str(entry["rarity_pedestal_shape"]),
            rarity_pedestal_color=str(entry["rarity_pedestal_color"]),
            rarity_pedestal_alpha=float(entry["rarity_pedestal_alpha"]),
            rarity_pedestal_radius_scale=float(entry["rarity_pedestal_radius_scale"]),
            rarity_pedestal_line_width_px=float(entry["rarity_pedestal_line_width_px"]),
            rarity_pedestal_pulse=bool(entry["rarity_pedestal_pulse"]),
            movement_kind=str(entry["movement_kind"]),
            movement_interval_sec=float(entry["movement_interval_sec"]),
            movement_distance_px=int(entry["movement_distance_px"]),
            fallback_unit_visual=str(entry["fallback_unit_visual"]),
        )
    return definitions


def load_monster_groups(config_root: Path) -> dict[str, MonsterGroup]:
    data = load_toml(config_root / "monsters" / "monster_groups.toml")
    groups: dict[str, MonsterGroup] = {}
    for entry in data.get("monster_groups", []):
        group_id = str(entry["id"])
        groups[group_id] = MonsterGroup(
            group_id=group_id,
            numeric_id=int(entry["numeric_id"]),
            tier=str(entry["tier"]),
            name_key=str(entry["name_key"]),
            selection_policy=str(entry["selection_policy"]),
            member_ids=tuple(str(member_id) for member_id in entry.get("member_ids", [])),
        )
    return groups


def load_board_rules(config_root: Path) -> BoardRules:
    layout = load_toml(config_root / "sudoku_board" / "board_layout.toml")["board"]
    placement = load_toml(config_root / "sudoku_board" / "placement_rules.toml")["placement"]
    allowed_gem_types = frozenset(placement["allowed_gem_types"])
    return BoardRules(
        rows=int(layout["rows"]),
        columns=int(layout["columns"]),
        box_rows=int(layout["box_rows"]),
        box_columns=int(layout["box_columns"]),
        allowed_gem_types=allowed_gem_types,
        allowed_sudoku_digits=frozenset(_sudoku_digit_from_gem_type(gem_type) for gem_type in allowed_gem_types),
        require_active_skill_to_enter_combat=bool(placement["require_active_skill_to_enter_combat"]),
        allow_empty_board_to_enter_combat=bool(placement["allow_empty_board_to_enter_combat"]),
    )


def load_gem_definitions(config_root: Path) -> dict[str, GemDefinition]:
    definitions: dict[str, GemDefinition] = {}
    use_manifest = manifest_present(config_root)
    active_ids = active_product_ids(config_root) if use_manifest else set()
    passive_ids = passive_product_ids(config_root) if use_manifest else set()
    support_ids = support_product_ids(config_root) if use_manifest else set()
    for package in load_skill_packages(config_root).values():
        if use_manifest and str(package["id"]) not in active_ids:
            continue
        definition = _active_gem_definition_from_package(package)
        definitions[definition.base_gem_id] = definition
    for entry in _load_gem_definition_packages(config_root, "passive"):
        if use_manifest and str(entry.get("id", "")) not in passive_ids:
            continue
        definition = _gem_definition_from_entry(entry)
        definitions[definition.base_gem_id] = definition
    for entry in _load_gem_definition_packages(config_root, "support"):
        if use_manifest and str(entry.get("id", "")) not in support_ids:
            continue
        definition = _gem_definition_from_entry(entry)
        definitions[definition.base_gem_id] = definition
    return definitions


def _load_gem_definition_packages(config_root: Path, kind: str) -> list[dict[str, Any]]:
    package_dir = config_root / "skills" / kind
    if not package_dir.exists():
        return []
    packages = [load_yaml_file(path) for path in sorted(package_dir.glob("*/skill.yaml"))]
    return sorted(packages, key=lambda package: (int(package.get("sort_order", 999_999)), str(package.get("id", ""))))


def _gem_definition_from_entry(entry: dict[str, Any]) -> GemDefinition:
    base_gem_id = entry["id"]
    apply_filter = entry.get("apply_filter", {})
    gem_type = entry.get("gem_type") or f"gem_type_{entry.get('sudoku_digit')}"
    gem_kind = _gem_kind_from_entry(entry)
    sudoku_digit = int(entry.get("sudoku_digit", _sudoku_digit_from_gem_type(gem_type)))
    _require_valid_gem_kind(gem_kind, base_gem_id)
    _require_valid_sudoku_digit(sudoku_digit, base_gem_id)
    return GemDefinition(
        base_gem_id=base_gem_id,
        gem_type=gem_type,
        gem_kind=gem_kind,
        sudoku_digit=sudoku_digit,
        tags=frozenset(entry["tags"]),
        name_key=entry.get("name_key", ""),
        description_key=entry.get("description_key", ""),
        category=entry.get("category", ""),
        effect_stats=tuple(entry.get("effect_stats", [])),
        passive_effects=tuple(_passive_effects(entry)),
        skill_template_id=entry.get("skill_template"),
        visual_effect=str(entry.get("visual_effect", "")),
        shape_effect=str(entry.get("shape_effect", "")),
        apply_filter_target_kinds=frozenset(apply_filter.get("target_kinds", [])),
        apply_filter_tags_any=frozenset(apply_filter.get("tags_any", [])),
        apply_filter_tags_all=frozenset(apply_filter.get("tags_all", [])),
        apply_filter_tags_none=frozenset(apply_filter.get("tags_none", [])),
        source_values=dict(entry.get("source_values", {})),
        level_table=dict(entry.get("level_table", {})),
        auto_release=dict(entry.get("auto_release", {})),
    )


def _active_gem_definition_from_package(package: dict[str, Any]) -> GemDefinition:
    package_id = str(package["id"])
    template_id = _legacy_template_id_from_package_id(package_id)
    classification = package["classification"]
    presentation = package["presentation"]
    tags = {"gem", "active_skill_gem", "loot_gem", "gem_type_1", template_id}
    tags.update(str(tag) for tag in classification["tags"])
    return GemDefinition(
        base_gem_id=package_id,
        gem_type="gem_type_1",
        gem_kind="active_skill",
        sudoku_digit=1,
        tags=frozenset(tags),
        name_key=str(package["display"]["name_key"]),
        description_key=str(package["display"]["description_key"]),
        skill_template_id=template_id,
        visual_effect=str(presentation["vfx"]),
        source_values=dict(package.get("source_values", {})),
        level_table=dict(package.get("level_table", {})),
        auto_release=dict(package.get("auto_release", {})),
    )


def _gem_kind_from_entry(entry: dict[str, Any]) -> str:
    if "gem_kind" in entry:
        return str(entry["gem_kind"])
    tags = set(entry.get("tags", []))
    if "active_skill_gem" in tags:
        return "active_skill"
    if "passive_skill_gem" in tags:
        return "passive_skill"
    if "support_gem" in tags:
        return "support"
    return ""


def _sudoku_digit_from_gem_type(gem_type: str) -> int:
    try:
        return int(str(gem_type).rsplit("_", 1)[-1])
    except ValueError as exc:
        raise ValueError(f"宝石 gem_type 无法映射为数独数字：{gem_type}") from exc


def _require_valid_gem_kind(gem_kind: str, base_gem_id: str) -> None:
    if gem_kind not in GEM_KINDS:
        raise ValueError(f"宝石大类不合法：{base_gem_id}")


def _require_valid_sudoku_digit(sudoku_digit: int, base_gem_id: str) -> None:
    if not 1 <= sudoku_digit <= 9:
        raise ValueError(f"宝石数独数字不合法：{base_gem_id}")


def _passive_effects(entry: dict[str, Any]) -> list[PassiveEffect]:
    effects: list[PassiveEffect] = []
    for effect in entry.get("passive_effects", []):
        effects.append(
            PassiveEffect(
                stat=str(effect["stat"]),
                value=float(effect["value"]),
                layer=str(effect.get("layer", "additive")),
                target=str(effect["target"]),
            )
        )
    return effects


def load_affix_definitions(config_root: Path) -> list[AffixDefinition]:
    data = load_toml(config_root / "affixes" / "affix_defs.toml")
    definitions: list[AffixDefinition] = []
    for entry in data.get("affixes", []):
        value_range = entry["value_range"]
        apply_filter = entry.get("apply_filter", {})
        definitions.append(
            AffixDefinition(
                affix_id=entry["id"],
                gen=entry["gen"],
                category=entry["category"],
                stat=entry["stat"],
                value_range=(value_range[0], value_range[1]),
                group=entry["group"],
                spawn_weights={
                    spawn_entry["tag"]: int(spawn_entry["weight"])
                    for spawn_entry in entry.get("spawn_tags", [])
                },
                apply_filter_tags=frozenset(apply_filter.get("tags_any", [])),
                name_key=entry.get("name_key", ""),
                description_key=entry.get("description_key", ""),
            )
        )
    return definitions


def load_rarity_affix_counts(config_root: Path) -> dict[str, int]:
    data = load_toml(config_root / "gems" / "gem_instance_schema.toml")
    return {key: int(value) for key, value in data["rarity_affix_counts"].items()}


def load_rarity_weights(config_root: Path) -> dict[str, int]:
    data = load_toml(config_root / "loot" / "drop_weight_rules.toml")
    return {key: int(value) for key, value in data["rarity_weights"].items()}


def load_skill_schema(config_root: Path) -> dict[str, Any]:
    path = config_root / "skills" / "schema" / "skill.schema.json"
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise ValueError("skill.schema.json root must be an object")
    return data


def load_behavior_templates(config_root: Path) -> dict[str, dict[str, Any]]:
    template_dir = config_root / "skills" / "behavior_templates"
    templates: dict[str, dict[str, Any]] = {}
    if not template_dir.exists():
        return templates
    for path in sorted(template_dir.glob("*.yaml")):
        template = load_yaml_file(path)
        template_id = str(template.get("id", path.stem))
        if template_id != path.stem:
            raise ValueError(f"behavior template id must match file name: {path}")
        if template_id not in ALLOWED_SKILL_BEHAVIOR_TEMPLATES:
            raise ValueError(f"behavior template is not whitelisted: {template_id}")
        allowed_params = template.get("allowed_params", [])
        if not isinstance(allowed_params, list) or not all(isinstance(item, str) for item in allowed_params):
            raise ValueError(f"behavior template allowed_params must be a string array: {template_id}")
        templates[template_id] = template
    return templates


def load_skill_packages(config_root: Path) -> dict[str, dict[str, Any]]:
    active_dir = config_root / "skills" / "active"
    if not active_dir.exists():
        return {}
    schema = load_skill_schema(config_root)
    behavior_templates = load_behavior_templates(config_root)
    packages: dict[str, dict[str, Any]] = {}
    for path in sorted(active_dir.glob("*/skill.yaml")):
        package = load_yaml_file(path)
        validate_skill_package_data(package, schema, behavior_templates, path)
        package_id = str(package["id"])
        packages[package_id] = package
    return packages


def validate_skill_package_data(
    package: dict[str, Any],
    schema: dict[str, Any],
    behavior_templates: dict[str, dict[str, Any]],
    path: Path | None = None,
) -> None:
    if not isinstance(package, dict):
        raise ValueError("skill package root must be an object")
    _reject_script_fields(package, ())
    _reject_unknown_fields(package, SKILL_PACKAGE_TOP_LEVEL_FIELDS, "root", str(package.get("id", "<unknown>")))
    for required_path in SKILL_PACKAGE_REQUIRED_PATHS:
        if _nested_value(package, required_path) is None:
            raise ValueError(f"skill package missing required field: {'.'.join(required_path)}")

    package_id = _require_string(package["id"], "id")
    if path is not None and path.parent.name != package_id:
        raise ValueError(f"skill package id must match directory name: {path}")
    version = _require_string(package["version"], "version")
    if not re.match(r"^\d+\.\d+\.\d+$", version):
        raise ValueError(f"skill package version must use MAJOR.MINOR.PATCH: {package_id}")
    if "product_status" in package and package["product_status"] not in {"product", "reference_only"}:
        raise ValueError(f"skill package product_status is invalid: {package_id}")
    if "source_values" in package:
        _validate_source_values(package["source_values"], package_id)
    if "level_table" in package:
        _validate_level_table(package["level_table"], package_id)
    if "auto_release" in package:
        _validate_auto_release(package["auto_release"], package_id)

    display = _require_mapping(package["display"], "display")
    _reject_unknown_fields(display, SKILL_PACKAGE_FIELD_ALLOWLISTS["display"], "display", package_id)
    _require_localization_key_shape(display["name_key"], "display.name_key")
    _require_localization_key_shape(display["description_key"], "display.description_key")

    classification = _require_mapping(package["classification"], "classification")
    _reject_unknown_fields(classification, SKILL_PACKAGE_FIELD_ALLOWLISTS["classification"], "classification", package_id)
    tags = classification["tags"]
    if not isinstance(tags, list) or not tags or not all(isinstance(tag, str) and tag for tag in tags):
        raise ValueError(f"skill package classification.tags must be a non-empty string array: {package_id}")
    if classification["damage_type"] not in {"physical", "fire", "cold", "lightning", "chaos"}:
        raise ValueError(f"skill package has invalid damage_type: {package_id}")
    if classification["damage_form"] not in {"attack", "spell", "secondary", "damage_over_time"}:
        raise ValueError(f"skill package has invalid damage_form: {package_id}")

    cast = _require_mapping(package["cast"], "cast")
    _reject_unknown_fields(cast, SKILL_PACKAGE_FIELD_ALLOWLISTS["cast"], "cast", package_id)
    if cast["mode"] not in {"instant", "attack", "spell"}:
        raise ValueError(f"skill package has invalid cast.mode: {package_id}")
    if cast["target_selector"] not in {"nearest_enemy", "target_enemy", "self", "ground"}:
        raise ValueError(f"skill package has invalid cast.target_selector: {package_id}")
    if not _is_number(cast["search_range"]) or cast["search_range"] < 0:
        raise ValueError(f"skill package cast.search_range must be non-negative: {package_id}")
    for field_name in ["cooldown_ms", "release_interval_ms", "base_cooldown_ms", "trigger_interval_ms", "mana_cost", "windup_ms", "recovery_ms"]:
        if not _is_integer(cast[field_name]) or cast[field_name] < 0:
            raise ValueError(f"skill package cast.{field_name} must be a non-negative integer: {package_id}")

    behavior = _require_mapping(package["behavior"], "behavior")
    _reject_unknown_fields(behavior, SKILL_PACKAGE_FIELD_ALLOWLISTS["behavior"], "behavior", package_id)
    behavior_template = _require_string(behavior["template"], "behavior.template")
    if behavior_template not in ALLOWED_SKILL_BEHAVIOR_TEMPLATES or behavior_template not in behavior_templates:
        raise ValueError(f"skill package behavior.template is not allowed: {package_id}")
    params = _require_mapping(behavior["params"], "behavior.params")
    allowed_params = set(behavior_templates[behavior_template].get("allowed_params", []))
    for param_name, param_value in params.items():
        if param_name not in allowed_params:
            raise ValueError(f"skill package behavior.params has unsupported parameter '{param_name}': {package_id}")
        _validate_behavior_param(
            param_name,
            param_value,
            _require_mapping(behavior_templates[behavior_template].get("param_constraints", {}), "param_constraints").get(param_name, {}),
            package_id,
        )
    if behavior_template == "player_nova":
        hit_at_ms = params.get("hit_at_ms")
        expand_duration_ms = params.get("expand_duration_ms")
        if _is_integer(hit_at_ms) and _is_integer(expand_duration_ms) and hit_at_ms > expand_duration_ms:
            raise ValueError(f"skill package behavior.params.hit_at_ms must not exceed expand_duration_ms: {package_id}")
    if behavior_template == "melee_arc":
        hit_at_ms = params.get("hit_at_ms")
        windup_ms = params.get("windup_ms")
        allow_hit_during_windup = bool(behavior_templates[behavior_template].get("allow_hit_during_windup", False))
        if (
            not allow_hit_during_windup
            and _is_integer(hit_at_ms)
            and _is_integer(windup_ms)
            and hit_at_ms < windup_ms
        ):
            raise ValueError(f"skill package behavior.params.hit_at_ms must not be earlier than windup_ms: {package_id}")
    if behavior_template == "chain":
        _validate_chain_params(params, package_id)
    if behavior_template == "damage_zone":
        _validate_damage_zone_params(params, behavior_templates[behavior_template], package_id)
    if behavior_template == "orbit_emitter":
        _validate_orbit_emitter_params(params, package_id)
    modules = package.get("modules")
    if modules is not None:
        _validate_skill_modules(modules, behavior_templates, package_id)

    hit = _require_mapping(package["hit"], "hit")
    _reject_unknown_fields(hit, SKILL_PACKAGE_FIELD_ALLOWLISTS["hit"], "hit", package_id)
    if not _is_number(hit["base_damage"]) or hit["base_damage"] < 0:
        raise ValueError(f"skill package hit.base_damage must be non-negative: {package_id}")
    if not isinstance(hit["can_crit"], bool) or not isinstance(hit["can_apply_status"], bool):
        raise ValueError(f"skill package hit crit/status fields must be booleans: {package_id}")
    if "damage_timing" in hit and hit["damage_timing"] not in {"on_projectile_hit", "on_area_hit", "on_melee_hit", "on_damage_zone_hit", "on_chain_hit"}:
        raise ValueError(f"skill package hit.damage_timing is invalid: {package_id}")
    if "hit_delay_ms" in hit and (not _is_integer(hit["hit_delay_ms"]) or hit["hit_delay_ms"] < 0):
        raise ValueError(f"skill package hit.hit_delay_ms must be a non-negative integer: {package_id}")
    if "hit_radius" in hit and (not _is_number(hit["hit_radius"]) or hit["hit_radius"] < 0):
        raise ValueError(f"skill package hit.hit_radius must be non-negative: {package_id}")
    if "target_policy" in hit and hit["target_policy"] not in {"selected_target", "nearest_enemy"}:
        raise ValueError(f"skill package hit.target_policy is invalid: {package_id}")

    scaling = _require_mapping(package["scaling"], "scaling")
    _reject_unknown_fields(scaling, SKILL_PACKAGE_FIELD_ALLOWLISTS["scaling"], "scaling", package_id)
    for field_name in ["additive_stats", "final_stats", "runtime_params"]:
        values = scaling[field_name]
        if not isinstance(values, list) or not all(isinstance(item, str) and item for item in values):
            raise ValueError(f"skill package scaling.{field_name} must be a string array: {package_id}")

    presentation = _require_mapping(package["presentation"], "presentation")
    _reject_unknown_fields(presentation, SKILL_PACKAGE_FIELD_ALLOWLISTS["presentation"], "presentation", package_id)
    for key in ["vfx", "sfx", "floating_text", "screen_feedback", "cast_vfx_key", "projectile_vfx_key", "hit_vfx_key", "floating_text_style"]:
        if key in presentation:
            _require_localization_key_shape(presentation[key], f"presentation.{key}")
    if "hit_stop_ms" in presentation and (not _is_integer(presentation["hit_stop_ms"]) or presentation["hit_stop_ms"] < 0):
        raise ValueError(f"skill package presentation.hit_stop_ms must be a non-negative integer: {package_id}")
    if "camera_shake" in presentation and (not _is_number(presentation["camera_shake"]) or presentation["camera_shake"] < 0):
        raise ValueError(f"skill package presentation.camera_shake must be non-negative: {package_id}")

    preview = _require_mapping(package["preview"], "preview")
    _reject_unknown_fields(preview, SKILL_PACKAGE_FIELD_ALLOWLISTS["preview"], "preview", package_id)
    show_fields = preview["show_fields"]
    if not isinstance(show_fields, list) or not all(isinstance(item, str) and item for item in show_fields):
        raise ValueError(f"skill package preview.show_fields must be a string array: {package_id}")
    unknown_preview_fields = sorted(set(show_fields) - ALLOWED_PREVIEW_SHOW_FIELDS)
    if unknown_preview_fields:
        raise ValueError(f"skill package preview.show_fields has unknown fields {unknown_preview_fields}: {package_id}")

    # The file is intentionally not executed as JSON Schema here. The checked
    # schema fields are the contract this loader enforces without adding a DSL.
    if "required" not in schema:
        raise ValueError("skill.schema.json must declare root required fields")


def _validate_source_values(value: Any, package_id: str) -> None:
    source_values = _require_mapping(value, "source_values")
    if source_values.get("source") != "tlidb":
        raise ValueError(f"skill package source_values.source must be tlidb: {package_id}")
    _require_string(source_values.get("tlidb_id"), "source_values.tlidb_id")
    display_level = source_values.get("display_level")
    if not _is_integer(display_level) or display_level <= 0:
        raise ValueError(f"skill package source_values.display_level must be a positive integer: {package_id}")
    raw_lines = source_values.get("raw_lines")
    if not isinstance(raw_lines, list) or not all(isinstance(line, str) for line in raw_lines):
        raise ValueError(f"skill package source_values.raw_lines must be a string array: {package_id}")
    anchors = source_values.get("anchors", {})
    if anchors is not None and not isinstance(anchors, dict):
        raise ValueError(f"skill package source_values.anchors must be an object: {package_id}")
    parsed_values = source_values.get("parsed_values", {})
    if parsed_values is not None and not isinstance(parsed_values, dict):
        raise ValueError(f"skill package source_values.parsed_values must be an object: {package_id}")


def _validate_level_table(value: Any, package_id: str) -> None:
    level_table = _require_mapping(value, "level_table")
    levels = level_table.get("levels")
    if not isinstance(levels, dict):
        raise ValueError(f"skill package level_table.levels must be an object: {package_id}")
    expected_keys = {str(level) for level in range(1, 41)}
    actual_keys = {str(key) for key in levels}
    if actual_keys != expected_keys:
        raise ValueError(f"skill package level_table.levels must cover levels 1-40 exactly: {package_id}")
    for level, fields in levels.items():
        if not isinstance(fields, dict):
            raise ValueError(f"skill package level_table.levels.{level} must be an object: {package_id}")


def _validate_auto_release(value: Any, package_id: str) -> None:
    auto_release = _require_mapping(value, "auto_release")
    policy = auto_release.get("policy")
    allowed = {"nearest_enemy", "target_cluster", "self_center", "duration_window", "periodic", "defensive_threshold"}
    if policy not in allowed:
        raise ValueError(f"skill package auto_release.policy is invalid: {package_id}")
    notes = auto_release.get("notes", [])
    if notes is not None and (not isinstance(notes, list) or not all(isinstance(note, str) for note in notes)):
        raise ValueError(f"skill package auto_release.notes must be a string array: {package_id}")


def _reject_script_fields(value: Any, path: tuple[str, ...]) -> None:
    if isinstance(value, dict):
        for key, nested in value.items():
            if str(key) in SCRIPT_FIELD_NAMES:
                dotted = ".".join(path + (str(key),))
                raise ValueError(f"skill package must not contain script-like field: {dotted}")
            _reject_script_fields(nested, path + (str(key),))
    elif isinstance(value, list):
        for index, nested in enumerate(value):
            _reject_script_fields(nested, path + (str(index),))


def _reject_unknown_fields(value: dict[str, Any], allowed: frozenset[str], label: str, package_id: str) -> None:
    unknown = sorted(set(str(key) for key in value) - allowed)
    if unknown:
        raise ValueError(f"skill package {label} has unsupported fields {unknown}: {package_id}")


def _validate_behavior_param(param_name: str, param_value: Any, constraint: Any, package_id: str) -> None:
    if not isinstance(constraint, dict):
        constraint = {}
    expected_type = constraint.get("type")
    if expected_type == "integer":
        if not _is_integer(param_value):
            raise ValueError(f"skill package behavior.params.{param_name} must be an integer: {package_id}")
        _validate_minimum(param_name, param_value, constraint, package_id)
        return
    if expected_type == "integer_or_unlimited":
        if param_value == "unlimited":
            return
        if not _is_integer(param_value):
            raise ValueError(f"skill package behavior.params.{param_name} must be a positive integer or unlimited: {package_id}")
        _validate_minimum(param_name, param_value, constraint, package_id)
        return
    if expected_type == "number":
        if not _is_number(param_value):
            raise ValueError(f"skill package behavior.params.{param_name} must be a number: {package_id}")
        _validate_minimum(param_name, param_value, constraint, package_id)
        return
    if expected_type == "boolean":
        if not isinstance(param_value, bool):
            raise ValueError(f"skill package behavior.params.{param_name} must be a boolean: {package_id}")
        return
    if expected_type == "string":
        if not isinstance(param_value, str):
            raise ValueError(f"skill package behavior.params.{param_name} must be a string enum: {package_id}")
        enum_values = constraint.get("enum", [])
        if isinstance(enum_values, list) and enum_values and param_value not in enum_values:
            raise ValueError(f"skill package behavior.params.{param_name} has invalid enum value: {package_id}")
        pattern = constraint.get("pattern")
        if isinstance(pattern, str) and not re.match(pattern, param_value):
            raise ValueError(f"skill package behavior.params.{param_name} must match required key pattern: {package_id}")
        return
    if expected_type == "key":
        if not isinstance(param_value, str) or not LOCALIZATION_KEY_PATTERN.match(param_value) or "." not in param_value:
            raise ValueError(f"skill package behavior.params.{param_name} must be a key: {package_id}")
        return
    if expected_type == "object":
        if not isinstance(param_value, dict):
            raise ValueError(f"skill package behavior.params.{param_name} must be an object: {package_id}")
        required = constraint.get("required", [])
        if isinstance(required, list):
            for key in required:
                if key not in param_value:
                    raise ValueError(f"skill package behavior.params.{param_name} missing field {key}: {package_id}")
        properties = constraint.get("properties", [])
        if isinstance(properties, list):
            _reject_unknown_fields(param_value, frozenset(str(key) for key in properties), f"behavior.params.{param_name}", package_id)
        for key, value in param_value.items():
            if not _is_number(value):
                raise ValueError(f"skill package behavior.params.{param_name}.{key} must be a number: {package_id}")
        return
    if isinstance(param_value, str):
        raise ValueError(f"skill package behavior.params must not contain expression strings: {package_id}.{param_name}")


def _validate_damage_zone_params(params: dict[str, Any], template: dict[str, Any], package_id: str) -> None:
    shape = params.get("shape")
    if shape not in {"circle", "rectangle"}:
        raise ValueError(f"skill package behavior.params.shape is invalid: {package_id}")
    if params.get("origin_policy") not in {"caster", "trigger_position"}:
        raise ValueError(f"skill package behavior.params.origin_policy is invalid: {package_id}")
    if params.get("facing_policy") not in {"none", "nearest_target", "locked_or_nearest_target"}:
        raise ValueError(f"skill package behavior.params.facing_policy is invalid: {package_id}")
    if not _is_integer(params.get("hit_at_ms")) or params["hit_at_ms"] < 0:
        raise ValueError(f"skill package behavior.params.hit_at_ms must be a non-negative integer: {package_id}")
    if not _is_integer(params.get("max_targets")) or params["max_targets"] < 1:
        raise ValueError(f"skill package behavior.params.max_targets must be a positive integer: {package_id}")

    shape_sets = _require_mapping(template.get("shape_param_sets", {}), "shape_param_sets")
    shape_rules = _require_mapping(shape_sets.get(str(shape), {}), f"shape_param_sets.{shape}")
    for field_name in shape_rules.get("required", []):
        if field_name not in params:
            raise ValueError(f"skill package behavior.params.{field_name} is required for {shape}: {package_id}")
    for field_name in shape_rules.get("forbidden", []):
        if field_name in params:
            raise ValueError(f"skill package behavior.params.{field_name} is not allowed for {shape}: {package_id}")
    if shape == "circle" and params.get("facing_policy") != "none":
        raise ValueError(f"skill package behavior.params.facing_policy must be none for circle: {package_id}")
    if shape == "rectangle" and params.get("facing_policy") == "none":
        raise ValueError(f"skill package behavior.params.facing_policy must choose a target direction for rectangle: {package_id}")
    if "trigger_delay_ms" in params and (not _is_integer(params["trigger_delay_ms"]) or params["trigger_delay_ms"] < 0):
        raise ValueError(f"skill package behavior.params.trigger_delay_ms must be a non-negative integer: {package_id}")
    if params.get("origin_policy") == "trigger_position" and not params.get("trigger_marker_id"):
        raise ValueError(f"skill package behavior.params.trigger_marker_id is required for trigger_position: {package_id}")


def _validate_orbit_emitter_params(params: dict[str, Any], package_id: str) -> None:
    if params.get("orbit_center_policy") != "caster":
        raise ValueError(f"skill package behavior.params.orbit_center_policy is invalid: {package_id}")
    if not _is_integer(params.get("duration_ms")) or params["duration_ms"] <= 0:
        raise ValueError(f"skill package behavior.params.duration_ms must be positive: {package_id}")
    if not _is_integer(params.get("tick_interval_ms")) or params["tick_interval_ms"] <= 0:
        raise ValueError(f"skill package behavior.params.tick_interval_ms must be positive: {package_id}")
    if params["tick_interval_ms"] > params["duration_ms"]:
        raise ValueError(f"skill package behavior.params.tick_interval_ms must not exceed duration_ms: {package_id}")
    if not _is_number(params.get("orbit_radius")) or params["orbit_radius"] <= 0:
        raise ValueError(f"skill package behavior.params.orbit_radius must be positive: {package_id}")
    if not _is_number(params.get("orbit_speed_deg_per_sec")):
        raise ValueError(f"skill package behavior.params.orbit_speed_deg_per_sec must be numeric: {package_id}")
    if not _is_integer(params.get("orb_count")) or params["orb_count"] <= 0:
        raise ValueError(f"skill package behavior.params.orb_count must be a positive integer: {package_id}")
    if not _is_number(params.get("start_angle_deg")):
        raise ValueError(f"skill package behavior.params.start_angle_deg must be numeric: {package_id}")
    if "orbit_radius_cycle_enabled" in params and not isinstance(params["orbit_radius_cycle_enabled"], bool):
        raise ValueError(f"skill package behavior.params.orbit_radius_cycle_enabled must be boolean: {package_id}")
    if "orbit_radius_cycle_amplitude" in params and (not _is_number(params["orbit_radius_cycle_amplitude"]) or params["orbit_radius_cycle_amplitude"] < 0):
        raise ValueError(f"skill package behavior.params.orbit_radius_cycle_amplitude must be non-negative: {package_id}")
    if "orbit_radius_cycle_period_ms" in params and (not _is_integer(params["orbit_radius_cycle_period_ms"]) or params["orbit_radius_cycle_period_ms"] <= 0):
        raise ValueError(f"skill package behavior.params.orbit_radius_cycle_period_ms must be positive: {package_id}")
    if "orbit_radius_cycle_phase_deg" in params and not _is_number(params["orbit_radius_cycle_phase_deg"]):
        raise ValueError(f"skill package behavior.params.orbit_radius_cycle_phase_deg must be numeric: {package_id}")
    marker_id = params.get("tick_marker_id")
    if not isinstance(marker_id, str) or not marker_id:
        raise ValueError(f"skill package behavior.params.tick_marker_id must be a non-empty string: {package_id}")


def _validate_skill_modules(
    modules: Any,
    behavior_templates: dict[str, dict[str, Any]],
    package_id: str,
) -> None:
    if not isinstance(modules, list) or not modules:
        raise ValueError(f"skill package modules must be a non-empty array: {package_id}")
    module_ids: set[str] = set()
    marker_ids: set[str] = set()
    for index, module in enumerate(modules):
        if not isinstance(module, dict):
            raise ValueError(f"skill package modules[{index}] must be an object: {package_id}")
        _reject_unknown_fields(module, frozenset({"id", "type", "params", "trigger"}), f"modules[{index}]", package_id)
        module_id = _require_string(module.get("id"), f"modules[{index}].id")
        if module_id in module_ids:
            raise ValueError(f"skill package modules duplicate id '{module_id}': {package_id}")
        module_ids.add(module_id)
        module_type = _require_string(module.get("type"), f"modules[{index}].type")
        if module_type not in behavior_templates:
            raise ValueError(f"skill package modules[{index}].type is not allowed: {package_id}")
        params = _require_mapping(module.get("params", {}), f"modules[{index}].params")
        trigger = module.get("trigger", {})
        if trigger is None:
            trigger = {}
        trigger_map = _require_mapping(trigger, f"modules[{index}].trigger")
        _reject_unknown_fields(trigger_map, frozenset({"trigger_marker_id", "trigger_delay_ms"}), f"modules[{index}].trigger", package_id)

        template = behavior_templates[module_type]
        allowed_params = set(template.get("allowed_params", []))
        for param_name, param_value in params.items():
            if param_name not in allowed_params:
                raise ValueError(f"skill package modules[{index}].params has unsupported parameter '{param_name}': {package_id}")
            _validate_behavior_param(
                param_name,
                param_value,
                _require_mapping(template.get("param_constraints", {}), "param_constraints").get(param_name, {}),
                package_id,
            )
        if module_type == "projectile":
            marker_id = params.get("impact_marker_id")
            if marker_id is not None:
                if not isinstance(marker_id, str) or not marker_id:
                    raise ValueError(f"skill package modules[{index}].params.impact_marker_id must be a non-empty string: {package_id}")
                if marker_id in marker_ids:
                    raise ValueError(f"skill package modules duplicate marker id '{marker_id}': {package_id}")
                marker_ids.add(marker_id)
            if params.get("trajectory") == "ballistic":
                if not _is_integer(params.get("travel_time_ms")) or params["travel_time_ms"] <= 0:
                    raise ValueError(f"skill package modules[{index}].params.travel_time_ms must be positive: {package_id}")
                if not _is_number(params.get("arc_height")) or params["arc_height"] < 0:
                    raise ValueError(f"skill package modules[{index}].params.arc_height must be non-negative: {package_id}")
        if module_type == "orbit_emitter":
            _validate_orbit_emitter_params(params, package_id)
            marker_id = params.get("tick_marker_id")
            if marker_id is not None:
                if marker_id in marker_ids:
                    raise ValueError(f"skill package modules duplicate marker id '{marker_id}': {package_id}")
                marker_ids.add(str(marker_id))
        if trigger_map:
            trigger_marker_id = trigger_map.get("trigger_marker_id")
            if not isinstance(trigger_marker_id, str) or not trigger_marker_id:
                raise ValueError(f"skill package modules[{index}].trigger.trigger_marker_id must be a non-empty string: {package_id}")
            if trigger_marker_id not in marker_ids:
                raise ValueError(f"skill package modules[{index}].trigger unresolved trigger id '{trigger_marker_id}': {package_id}")
            trigger_delay_ms = trigger_map.get("trigger_delay_ms", 0)
            if not _is_integer(trigger_delay_ms) or trigger_delay_ms < 0:
                raise ValueError(f"skill package modules[{index}].trigger.trigger_delay_ms must be a non-negative integer: {package_id}")
        if module_type == "damage_zone":
            merged_params = dict(params)
            if trigger_map:
                merged_params.setdefault("trigger_marker_id", trigger_map["trigger_marker_id"])
                merged_params.setdefault("trigger_delay_ms", trigger_map.get("trigger_delay_ms", 0))
            _validate_damage_zone_params(merged_params, template, package_id)


def _validate_chain_params(params: dict[str, Any], package_id: str) -> None:
    required = {
        "chain_count",
        "chain_radius",
        "chain_delay_ms",
        "damage_falloff_per_chain",
        "target_policy",
        "allow_repeat_target",
        "max_targets",
        "segment_vfx_key",
    }
    missing = sorted(required - set(params))
    if missing:
        raise ValueError(f"skill package behavior.params missing chain fields {missing}: {package_id}")
    if params.get("target_policy") != "nearest_not_hit":
        raise ValueError(f"skill package behavior.params.target_policy has invalid enum value: {package_id}")
    if not isinstance(params.get("allow_repeat_target"), bool):
        raise ValueError(f"skill package behavior.params.allow_repeat_target must be a boolean: {package_id}")


def _validate_minimum(param_name: str, param_value: int | float, constraint: dict[str, Any], package_id: str) -> None:
    minimum = constraint.get("minimum")
    if isinstance(minimum, (int, float)) and param_value < minimum:
        raise ValueError(f"skill package behavior.params.{param_name} is below minimum {minimum}: {package_id}")
    maximum = constraint.get("maximum")
    if isinstance(maximum, (int, float)) and param_value > maximum:
        raise ValueError(f"skill package behavior.params.{param_name} is above maximum {maximum}: {package_id}")


def _is_integer(value: Any) -> bool:
    return isinstance(value, int) and not isinstance(value, bool)


def _is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _nested_value(data: dict[str, Any], path: tuple[str, ...]) -> Any:
    value: Any = data
    for key in path:
        if not isinstance(value, dict) or key not in value:
            return None
        value = value[key]
    return value


def _require_mapping(value: Any, label: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError(f"skill package field must be an object: {label}")
    return value


def _require_string(value: Any, label: str) -> str:
    if not isinstance(value, str) or not value:
        raise ValueError(f"skill package field must be a non-empty string: {label}")
    return value


def _require_localization_key_shape(value: Any, label: str) -> str:
    text = _require_string(value, label)
    if not LOCALIZATION_KEY_PATTERN.match(text) or "." not in text:
        raise ValueError(f"skill package field must be a localization key: {label}")
    return text


def load_skill_templates(config_root: Path) -> dict[str, SkillTemplate]:
    templates: dict[str, SkillTemplate] = {}
    for package in load_skill_packages(config_root).values():
        template = _skill_template_from_package(package)
        templates[template.template_id] = template
    return templates


def _skill_template_from_package(package: dict[str, Any]) -> SkillTemplate:
    package_id = str(package["id"])
    classification = package["classification"]
    cast = dict(package["cast"])
    behavior = package["behavior"]
    hit = dict(package["hit"])
    scaling = package["scaling"]
    presentation = package["presentation"]
    runtime_params = dict(behavior["params"])
    modules = package.get("modules")
    if isinstance(modules, list):
        runtime_params["modules"] = deepcopy(modules)
    template_id = _legacy_template_id_from_package_id(package_id)
    return SkillTemplate(
        template_id=template_id,
        tags=frozenset(str(tag) for tag in classification["tags"]),
        base_damage=float(hit["base_damage"]),
        base_release_interval_ms=int(cast["release_interval_ms"]),
        base_cooldown_ms=int(cast["base_cooldown_ms"]),
        trigger_interval_ms=int(cast["trigger_interval_ms"]),
        mana_cost=int(cast["mana_cost"]),
        name_key=str(package["display"]["name_key"]),
        damage_type=str(classification["damage_type"]),
        behavior_type="module_chain" if isinstance(modules, list) and modules else str(behavior["template"]),
        visual_effect=str(presentation["vfx"]),
        scaling_stats=tuple(
            str(stat)
            for stat in (
                list(scaling["additive_stats"])
                + list(scaling["final_stats"])
                + list(scaling["runtime_params"])
            )
        ),
        skill_package_id=package_id,
        skill_package_version=str(package["version"]),
        behavior_template="module_chain" if isinstance(modules, list) and modules else str(behavior["template"]),
        damage_form=str(classification["damage_form"]),
        cast=cast,
        hit=hit,
        runtime_params=runtime_params,
        presentation_keys=dict(presentation),
        preview_show_fields=tuple(str(field) for field in package["preview"]["show_fields"]),
        source_values=dict(package.get("source_values", {})),
        level_table=dict(package.get("level_table", {})),
        auto_release=dict(package.get("auto_release", {})),
    )


def _legacy_template_id_from_package_id(package_id: str) -> str:
    if package_id.startswith("active_"):
        return f"skill_{package_id[len('active_'):]}"
    return package_id


def load_relation_coefficients(config_root: Path) -> dict[str, float]:
    data = load_toml(config_root / "sudoku_board" / "relation_rules.toml")
    return {entry["id"]: float(entry["coefficient"]) for entry in data.get("relations", [])}


def load_skill_scaling_rules(config_root: Path) -> SkillScalingRules:
    data = load_toml(config_root / "skills" / "skill_scaling_rules.toml")
    return SkillScalingRules(
        stat_layers={key: str(value) for key, value in data.get("stat_layers", {}).items()},
        support_base_modifiers=tuple(
            SupportBaseModifier(
                support_id=entry["support_id"],
                stat=entry["stat"],
                value=float(entry["value"]),
                layer=entry["layer"],
            )
            for entry in data.get("support_base_modifiers", [])
        ),
        conduit_amplifiers=tuple(
            ConduitAmplifier(
                support_id=entry["support_id"],
                relation=entry["relation"],
                multiplier=float(entry["multiplier"]),
            )
            for entry in data.get("conduit_amplifiers", [])
        ),
    )
