from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from liufang.config import load_gem_definitions, load_localization, load_toml, load_yaml_file

CONDUIT_IDS = {
    "support_row_conduit",
    "support_column_conduit",
    "support_box_conduit",
}


def test_generated_gem_item_catalog_has_expected_player_facing_levels() -> None:
    definitions = load_gem_definitions(ROOT / "configs")
    items = load_toml(ROOT / "configs" / "gems" / "gem_level_items.toml")["items"]
    by_base: dict[str, list[int]] = {}
    for item in items:
        by_base.setdefault(item["base_gem_id"], []).append(int(item["level"]))

    assert set(by_base) == set(definitions)
    for base_gem_id in definitions:
        expected = list(range(1, 6)) if base_gem_id in CONDUIT_IDS else list(range(1, 21))
        assert sorted(by_base[base_gem_id]) == expected


def test_support_level_tables_are_planned_to_forty_except_digit_nine_conduits() -> None:
    definitions = load_gem_definitions(ROOT / "configs")

    for definition in definitions.values():
        if definition.gem_kind != "support":
            continue
        levels = definition.level_table.get("levels")
        assert isinstance(levels, dict)
        expected = set(range(1, 6)) if definition.base_gem_id in CONDUIT_IDS else set(range(1, 41))
        assert {int(level) for level in levels} == expected

    for conduit_id in CONDUIT_IDS:
        levels = definitions[conduit_id].level_table["levels"]
        assert [levels.get(level, levels[str(level)])["skill_level_add"] for level in range(1, 6)] == [1, 2, 3, 4, 5]


def test_active_skill_descriptions_do_not_expose_concrete_numbers() -> None:
    localization = load_localization(ROOT / "configs")

    for key, text in localization.items():
        if not key.startswith("gem.active_") or not key.endswith(".description"):
            continue
        assert not re.search(r"\d|%|％", text), f"{key}: {text}"

def test_active_level_tables_cover_nested_damage_outputs() -> None:
    expected_fields = {
        "active_burning_shot": {
            "hit_damage_component_physical": 25.6,
            "hit_ailment_ignite_base_damage_per_second": 2.56,
            "on_ignited_hit_indirect_fire_damage": 0.5,
        },
        "active_corrosive_shot": {
            "hit_damage_component_physical": 9.5,
            "hit_ailment_wilt_base_damage_per_second": 0.57,
            "module_corrosive_ground_damage_amount": 0.741,
        },
        "active_flame_slash": {
            "hit_damage_component_physical": 34.6,
            "weapon_attack_percent": 34.6,
        },
        "active_ice_shot": {
            "secondary_hit_ice_cone_back_explosion_base_damage": 15.7,
            "secondary_hit_ice_cone_back_explosion_damage_component_physical": 15.7,
            "secondary_hit_ice_cone_back_explosion_weapon_attack_percent": 15.7,
        },
        "active_lightning_shot": {
            "secondary_hit_forked_lightning_base_damage": 33.4,
            "secondary_hit_forked_lightning_damage_component_physical": 33.4,
            "secondary_hit_forked_lightning_weapon_attack_percent": 33.4,
        },
        "active_rain_of_arrows": {
            "hit_damage_component_physical": 13.4,
            "weapon_attack_percent": 13.4,
        },
        "active_split_firebolt": {
            "split_projectile_base_damage": 42.125,
        },
    }

    for skill_id, fields in expected_fields.items():
        package = load_yaml_file(ROOT / "configs" / "skills" / "active" / skill_id / "skill.yaml")
        levels = package["level_table"]["levels"]
        level_one = levels.get(1, levels.get("1"))
        assert isinstance(level_one, dict)
        for field, expected in fields.items():
            assert field in level_one, f"{skill_id} missing {field}"
            assert level_one[field] == expected
