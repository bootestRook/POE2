from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from liufang.config import load_gem_definitions, load_localization, load_toml

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
