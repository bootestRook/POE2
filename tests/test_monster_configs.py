from __future__ import annotations

import shutil
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT))

from liufang.config import load_monster_definitions, load_monster_groups  # noqa: E402
from tools import validate_v1_configs  # noqa: E402


class MonsterConfigTest(unittest.TestCase):
    def setUp(self) -> None:
        self.config_root = ROOT / "configs"

    def temp_config_root(self) -> Path:
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        target = Path(temp.name) / "configs"
        shutil.copytree(self.config_root, target)
        return target

    def test_seed_monsters_use_tiered_numeric_ids(self) -> None:
        definitions = load_monster_definitions(self.config_root)

        self.assertEqual(len(definitions), 32)
        expected_ranges = {
            "normal": (100000, 199999, 1001),
            "magic": (200000, 299999, 2001),
            "rare": (300000, 399999, 3001),
            "boss": (400000, 499999, 4001),
        }
        for tier, (minimum, maximum, group_id) in expected_ranges.items():
            tier_monsters = [monster for monster in definitions.values() if monster.tier == tier]
            self.assertEqual(len(tier_monsters), 8)
            for monster in tier_monsters:
                self.assertGreaterEqual(monster.numeric_id, minimum)
                self.assertLessEqual(monster.numeric_id, maximum)
                self.assertEqual(monster.monster_id, f"mon_{monster.numeric_id}")
                self.assertEqual(monster.group_numeric_id, group_id)

    def test_seed_groups_keep_one_tier_per_group(self) -> None:
        definitions = load_monster_definitions(self.config_root)
        groups = load_monster_groups(self.config_root)

        expected_groups = {
            "monster_group_1001": ("normal", 1001),
            "monster_group_2001": ("magic", 2001),
            "monster_group_3001": ("rare", 3001),
            "monster_group_4001": ("boss", 4001),
        }
        self.assertEqual(set(groups), set(expected_groups))
        for group_id, (tier, numeric_id) in expected_groups.items():
            group = groups[group_id]
            self.assertEqual(group.tier, tier)
            self.assertEqual(group.numeric_id, numeric_id)
            self.assertEqual(len(group.member_ids), 8)
            self.assertTrue(all(definitions[member_id].tier == tier for member_id in group.member_ids))

    def test_validation_rejects_cross_tier_group_members(self) -> None:
        config_root = self.temp_config_root()
        group_path = config_root / "monsters" / "monster_groups.toml"
        group_path.write_text(
            group_path.read_text(encoding="utf-8").replace('"mon_100108"', '"mon_200101"', 1),
            encoding="utf-8",
        )

        old_configs = validate_v1_configs.CONFIGS
        try:
            validate_v1_configs.CONFIGS = config_root
            errors = validate_v1_configs.validate()
        finally:
            validate_v1_configs.CONFIGS = old_configs

        self.assertTrue(any("monster_group_1001" in error and "mon_200101" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
