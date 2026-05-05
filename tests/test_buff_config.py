from __future__ import annotations

import sys
import unittest
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from liufang.config import (  # noqa: E402
    BUFF_EFFECT_IDS,
    BUFF_IDS,
    load_behavior_templates,
    load_skill_packages,
    load_skill_schema,
    validate_skill_package_data,
)


class BuffConfigTest(unittest.TestCase):
    def setUp(self) -> None:
        self.config_root = ROOT / "configs"
        self.schema = load_skill_schema(self.config_root)
        self.templates = load_behavior_templates(self.config_root)

    def test_buff_conversion_target_uses_full_buff_ids(self) -> None:
        package = deepcopy(load_skill_packages(self.config_root)["active_ice_shot"])
        package["hit"]["ailments"][0]["conversion_buff_type"] = "guard"

        validate_skill_package_data(package, self.schema, self.templates)

    def test_buff_conversion_target_rejects_unknown_buff_id(self) -> None:
        package = deepcopy(load_skill_packages(self.config_root)["active_ice_shot"])
        package["hit"]["ailments"][0]["conversion_buff_type"] = "unknown_buff"

        with self.assertRaisesRegex(ValueError, "conversion_buff_type"):
            validate_skill_package_data(package, self.schema, self.templates)

    def test_buff_module_type_uses_full_buff_ids(self) -> None:
        package = deepcopy(load_skill_packages(self.config_root)["active_corrosive_shot"])
        buff_module = next(module for module in package["modules"] if module["type"] == "buff")
        buff_module["params"]["buff_type"] = "ignite"
        buff_module["params"]["base_damage_per_second"] = 5

        validate_skill_package_data(package, self.schema, self.templates)

    def test_buff_module_effect_type_uses_buff_effect_ids(self) -> None:
        package = deepcopy(load_skill_packages(self.config_root)["active_corrosive_shot"])
        buff_module = next(module for module in package["modules"] if module["type"] == "buff")
        buff_module["params"]["effect_type"] = "damage_taken_increase"
        buff_module["params"].pop("buff_type", None)

        validate_skill_package_data(package, self.schema, self.templates)

    def test_guard_is_part_of_unified_buff_ids(self) -> None:
        self.assertIn("guard", BUFF_IDS)
        self.assertIn("aggravation", BUFF_IDS)
        self.assertIn("conversion", BUFF_EFFECT_IDS)
        self.assertIn("damage_taken_increase", BUFF_EFFECT_IDS)


if __name__ == "__main__":
    unittest.main()
