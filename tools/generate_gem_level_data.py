from __future__ import annotations

import ast
import re
import sys
from fractions import Fraction
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from liufang.config import load_gem_definitions, load_yaml_file


CONDUIT_IDS = {
    "support_row_conduit",
    "support_column_conduit",
    "support_box_conduit",
}

ACTIVE_DESCRIPTIONS = {
    "gem.active_split_firebolt.description": "向前发射火球，火球命中后分裂成小型火球继续追击附近敌人。",
    "gem.active_ice_shot.description": "向前发射冰锥，命中后在目标身后引发冰霜爆炸，并可施加冰结。",
    "gem.active_chromatic_shot.description": "发射会追踪敌人的五彩魔矢，释放时随机选择火焰、冰霜或闪电形态；多个投射物可以命中同一敌人，击败敌人时可能引发爆炸。",
    "gem.active_whirlwind.description": "以自身为中心持续旋转挥击，覆盖周围区域。",
    "gem.active_stoneskin.description": "释放后获得短暂防护，用于承受直接打击。",
    "gem.active_thundercloud.description": "在自身上方凝聚雷云，雷云会持续锁定附近敌人并降下雷击。",
    "gem.active_blizzard.description": "在目标区域召唤多波暴风雪落点，持续打击范围内敌人。",
    "gem.active_chain_lightning.description": "向敌人释放闪电链，闪电会在附近目标之间弹射。",
    "gem.active_ring_of_ice.description": "以自身为中心形成冰环；击败敌人时可能在敌人位置再次触发冰环。",
    "gem.active_flame_slash.description": "向前方扇形区域挥击；触发斩击形态时改为释放多道可叠加命中的烈焰。",
    "gem.active_lightning_shot.description": "向前发射闪电箭，命中后分裂为多道闪电打击附近敌人。",
    "gem.active_corrosive_shot.description": "向前投射混沌弹，接触目标或落点后产生混沌区域并施加易伤。",
    "gem.active_burning_shot.description": "向前发射烈焰箭，有机会点燃敌人；命中已被点燃的敌人时引发爆燃。",
    "gem.active_rain_of_arrows.description": "向空中发射箭矢，随后在目标区域形成箭雨落点。",
    "gem.active_sparkle.description": "向前发射电火花，电火花会在飞行中持续作用于附近区域。",
    "gem.active_black_hole.description": "在目标位置形成黑洞，持续牵制范围内敌人并周期性造成混沌伤害。",
}


def _format_scalar(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float):
        rounded = round(value, 4)
        if rounded.is_integer():
            return str(int(rounded))
        return f"{rounded:.4f}".rstrip("0").rstrip(".")
    return repr(str(value))


def _parse_number(value: str) -> float:
    if "/" in value:
        return float(Fraction(value))
    return float(value)


def _round(value: float) -> float | int:
    rounded = round(value, 4)
    if rounded.is_integer():
        return int(rounded)
    return rounded


def _interpolate(points: list[tuple[int, float]], level: int) -> float:
    points = sorted(points)
    if level <= points[0][0]:
        return points[0][1]
    for (left_level, left_value), (right_level, right_value) in zip(points, points[1:]):
        if left_level <= level <= right_level:
            if right_level == left_level:
                return left_value
            progress = (level - left_level) / (right_level - left_level)
            return left_value + (right_value - left_value) * progress
    return points[-1][1]


def _anchor_groups(raw_lines: list[str]) -> list[list[tuple[int, float]]]:
    groups: list[list[tuple[int, float]]] = []
    for raw_line in raw_lines:
        current: list[tuple[int, float]] = []
        last_level = 0
        for match in re.finditer(r"\(Lv(\d+):([^)]+)\)", raw_line):
            level = int(match.group(1))
            value = _parse_number(match.group(2))
            if current and level <= last_level:
                groups.append(current)
                current = []
            current.append((level, value))
            last_level = level
        if current:
            groups.append(current)

    unique: list[list[tuple[int, float]]] = []
    seen: set[tuple[tuple[int, float], ...]] = set()
    for group in groups:
        key = tuple(group)
        if key in seen:
            continue
        seen.add(key)
        unique.append(group)
    return unique


def _support_stats(package: dict[str, Any]) -> list[tuple[str, Any]]:
    result: list[tuple[str, Any]] = []
    parsed = package.get("source_values", {}).get("parsed_values", {})
    if not isinstance(parsed, dict):
        parsed = {}
    for entry in package.get("effect_stats", []):
        if isinstance(entry, dict) and "stat" in entry:
            result.append((str(entry["stat"]), entry.get("value")))
        elif isinstance(entry, str):
            result.append((entry, parsed.get(entry)))
    return result


def _constant_support_stat(stat: str, value: Any) -> bool:
    if isinstance(value, bool):
        return True
    if stat.startswith("conversion_"):
        return True
    if stat in {
        "prevent_elemental_ailments",
        "ignite_stacks_add",
        "ignite_chance_add_percent",
        "projectile_count_add",
        "bounce_count_add",
        "split_projectile_chance_percent",
        "split_projectile_count_add",
        "energy_blessing_max_stacks",
        "guard_trigger_count",
        "guard_internal_cooldown_ms",
    }:
        return True
    return False


def _level_values_from_group(group: list[tuple[int, float]]) -> dict[int, float | int]:
    values: dict[int, float | int] = {}
    explicit = {level: value for level, value in group}
    for level in range(1, 41):
        if level in explicit:
            values[level] = _round(explicit[level])
        else:
            values[level] = _round(_interpolate(group, level))
    return values


def _added_damage_table(package: dict[str, Any], groups: list[list[tuple[int, float]]]) -> dict[int, dict[str, Any]]:
    parsed = package.get("source_values", {}).get("parsed_values", {})
    stat = next(stat for stat, _ in _support_stats(package) if stat.startswith("added_"))
    min_stat = next((key for key in parsed if key.endswith("_min")), f"{stat}_min")
    max_stat = next((key for key in parsed if key.endswith("_max")), f"{stat}_max")
    min_values = _level_values_from_group(groups[0])
    max_values = _level_values_from_group(groups[1])
    levels: dict[int, dict[str, Any]] = {}
    for level in range(1, 41):
        minimum = min_values[level]
        maximum = max_values[level]
        levels[level] = {
            min_stat: minimum,
            max_stat: maximum,
            stat: _round((float(minimum) + float(maximum)) / 2.0),
        }
    return levels


def _support_level_table(package: dict[str, Any]) -> dict[int, dict[str, Any]]:
    stats = _support_stats(package)
    groups = _anchor_groups(package.get("source_values", {}).get("raw_lines", []))
    if stats and stats[0][0].startswith("added_") and len(groups) >= 2:
        return _added_damage_table(package, groups)

    scaling_stats = [(stat, value) for stat, value in stats if not _constant_support_stat(stat, value)]
    mapped: dict[str, dict[int, float | int]] = {}
    if groups and scaling_stats:
        if len(groups) == 1:
            group_values = _level_values_from_group(groups[0])
            for stat, _ in scaling_stats:
                mapped[stat] = group_values
        else:
            for (stat, _), group in zip(scaling_stats, groups):
                mapped[stat] = _level_values_from_group(group)

    levels: dict[int, dict[str, Any]] = {level: {} for level in range(1, 41)}
    for stat, value in stats:
        for level in range(1, 41):
            if stat in mapped:
                levels[level][stat] = mapped[stat][level]
            elif _constant_support_stat(stat, value):
                levels[level][stat] = value
            elif isinstance(value, (int, float)):
                levels[level][stat] = _round(float(value) * level / 20.0)
    return levels


def _render_level_table(levels: dict[int, dict[str, Any]]) -> str:
    lines = ["level_table:", "  levels:"]
    for level in sorted(levels):
        lines.append(f"    {level}:")
        for stat, value in levels[level].items():
            lines.append(f"      {stat}: {_format_scalar(value)}")
    return "\n".join(lines)


def _insert_level_table(path: Path, levels: dict[int, dict[str, Any]]) -> None:
    text = path.read_text(encoding="utf-8")
    marker = "\ntags:"
    if marker not in text:
        raise ValueError(f"Cannot find tags marker in {path}")
    if "\nlevel_table:\n" in text:
        start = text.index("\nlevel_table:\n")
        end = text.index(marker, start)
        text = text[:start] + text[end:]
    text = text.replace(marker, "\n" + _render_level_table(levels) + marker, 1)
    path.write_text(text, encoding="utf-8", newline="\n")


def _update_support_level_tables() -> None:
    for path in sorted((ROOT / "configs" / "skills" / "support").glob("*/skill.yaml")):
        package = load_yaml_file(path)
        if package["id"] in CONDUIT_IDS:
            continue
        _insert_level_table(path, _support_level_table(package))


def _toml_string(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


def _write_item_catalog() -> None:
    definitions = load_gem_definitions(ROOT / "configs")
    lines = [
        "# Generated by tools/generate_gem_level_data.py.",
        "# Ordinary active/passive/support gems are player-facing Lv1-Lv20 items.",
        "# Digit-9 sudoku conduit supports are Lv1-Lv5 items.",
        "",
    ]
    for definition in sorted(definitions.values(), key=lambda item: (item.gem_kind, item.sudoku_digit, item.base_gem_id)):
        max_level = 5 if definition.base_gem_id in CONDUIT_IDS else 20
        for level in range(1, max_level + 1):
            lines.extend(
                [
                    "[[items]]",
                    f"id = {_toml_string(f'{definition.base_gem_id}_lv{level:02d}')}",
                    f"base_gem_id = {_toml_string(definition.base_gem_id)}",
                    f"level = {level}",
                    f"gem_kind = {_toml_string(definition.gem_kind)}",
                    f"gem_type = {_toml_string(definition.gem_type)}",
                    f"sudoku_digit = {definition.sudoku_digit}",
                    "",
                ]
            )
    (ROOT / "configs" / "gems" / "gem_level_items.toml").write_text("\n".join(lines), encoding="utf-8", newline="\n")


def _toml_quote(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


def _update_active_descriptions() -> None:
    path = ROOT / "configs" / "localization" / "zh_cn.toml"
    lines = path.read_text(encoding="utf-8").splitlines()
    result: list[str] = []
    for line in lines:
        stripped = line.strip()
        key = stripped.split("=", 1)[0].strip().strip('"') if "=" in stripped else ""
        if key in ACTIVE_DESCRIPTIONS:
            result.append(f'{_toml_quote(key)} = {_toml_quote(ACTIVE_DESCRIPTIONS[key])}')
        else:
            result.append(line)
    path.write_text("\n".join(result) + "\n", encoding="utf-8", newline="\n")


def main() -> None:
    _update_support_level_tables()
    _write_item_catalog()
    _update_active_descriptions()


if __name__ == "__main__":
    main()
