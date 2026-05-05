from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from liufang.config import load_gem_definitions, load_skill_scaling_rules


def _tlidb_support_lines() -> dict[str, list[str]]:
    result: dict[str, list[str]] = {}
    source = ROOT / "tlidb_skills" / "skills_for_ai.jsonl"
    for line in source.read_text(encoding="utf-8").splitlines():
        entry = json.loads(line)
        if entry.get("type_id") == "support":
            result[str(entry["skill_id"])] = str(entry["summary_description"]).splitlines()
    return result


def test_support_raw_effect_lines_match_tlidb_source() -> None:
    definitions = load_gem_definitions(ROOT / "configs")
    source_lines = _tlidb_support_lines()

    for definition in definitions.values():
        if definition.gem_kind != "support":
            continue
        tlidb_id = definition.source_values.get("tlidb_id")
        if not tlidb_id:
            continue

        assert definition.source_values.get("raw_lines") == source_lines[tlidb_id]


def test_tlidb_supports_have_generated_level_tables() -> None:
    definitions = load_gem_definitions(ROOT / "configs")

    for definition in definitions.values():
        if definition.gem_kind != "support":
            continue
        if not definition.source_values.get("tlidb_id"):
            continue

        levels = definition.level_table.get("levels")
        assert isinstance(levels, dict)
        assert {int(level) for level in levels} == set(range(1, 41))


def test_unsupported_tlidb_support_effects_are_not_faked_as_other_stats() -> None:
    rules = load_skill_scaling_rules(ROOT / "configs")
    runtime_stats = {(rule.support_id, rule.stat) for rule in rules.support_base_modifiers}

    forbidden = {
        ("support_added_fire_damage", "fire_damage_add_percent"),
        ("support_added_cold_damage", "cold_damage_add_percent"),
        ("support_added_lightning_damage", "lightning_damage_add_percent"),
        ("support_added_erosion_damage", "chaos_damage_add_percent"),
        ("support_elemental_fusion", "cannot_crit"),
        ("support_improved_corrosion", "chaos_damage_add_percent"),
        ("support_overload", "damage_final_percent"),
        ("support_physical_to_fire", "fire_damage_add_percent"),
        ("support_projectile_split", "projectile_count_add"),
        ("support_jump", "chain_count_add"),
    }

    assert runtime_stats.isdisjoint(forbidden)
    assert ("support_lightning_to_cold", "lightning_damage_add_percent") in runtime_stats
    assert ("support_lightning_to_cold", "cold_damage_add_percent") not in runtime_stats
    assert ("support_added_fire_damage", "added_fire_damage") in runtime_stats
    assert ("support_added_cold_damage", "added_cold_damage") in runtime_stats
    assert ("support_added_lightning_damage", "added_lightning_damage") in runtime_stats
    assert ("support_added_erosion_damage", "added_chaos_damage") in runtime_stats
    assert ("support_jump", "bounce_count_add") in runtime_stats
