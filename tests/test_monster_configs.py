from __future__ import annotations

import shutil
import sys
import tempfile
import unittest
import json
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

    def test_seed_monsters_use_standard_colors_sizes_and_pedestals(self) -> None:
        definitions = load_monster_definitions(self.config_root)
        expected_visuals = {
            "normal": ("monster", "normal", 38, "shadow", "#D9DDE1", 0.16, 0.72, 1.0, False),
            "magic": ("monster", "magic", 46, "diamond", "#4AA3FF", 0.82, 0.82, 2.0, False),
            "rare": ("monster", "rare", 58, "hexagon", "#F5C542", 0.88, 0.95, 2.5, False),
            "boss": ("boss", "legendary", 82, "hexagon", "#FF4D3D", 0.92, 1.15, 3.0, True),
        }

        for monster in definitions.values():
            role, rarity, size, pedestal_shape, pedestal_color, pedestal_alpha, pedestal_radius, pedestal_width, pedestal_pulse = expected_visuals[monster.tier]
            self.assertEqual(monster.role, role)
            self.assertEqual(monster.visual_rarity, rarity)
            self.assertEqual(monster.palette_key, "encounter_standard")
            self.assertEqual(monster.primary_color, "#F7F7F2")
            self.assertEqual(monster.accent_color, "#D9DDE1")
            self.assertEqual(monster.size_px, size)
            self.assertGreaterEqual(monster.size_px, 36)
            self.assertEqual(monster.rarity_arc_color, "")
            self.assertEqual(monster.rarity_arc_segments, 0)
            self.assertEqual(monster.rarity_arc_width_px, 0)
            self.assertEqual(monster.rarity_pedestal_shape, pedestal_shape)
            self.assertEqual(monster.rarity_pedestal_color, pedestal_color)
            self.assertEqual(monster.rarity_pedestal_alpha, pedestal_alpha)
            self.assertEqual(monster.rarity_pedestal_radius_scale, pedestal_radius)
            self.assertEqual(monster.rarity_pedestal_line_width_px, pedestal_width)
            self.assertEqual(monster.rarity_pedestal_pulse, pedestal_pulse)

    def test_seed_monsters_define_base_combat_stats_by_tier(self) -> None:
        definitions = load_monster_definitions(self.config_root)
        expected_ranges = {
            "normal": ((32, 36), (8, 10)),
            "magic": ((40, 44), (10, 12)),
            "rare": ((48, 54), (12, 14)),
            "boss": ((480, 540), (22, 26)),
        }

        for monster in definitions.values():
            life_range, attack_range = expected_ranges[monster.tier]
            self.assertGreaterEqual(monster.base_life, life_range[0])
            self.assertLessEqual(monster.base_life, life_range[1])
            self.assertGreaterEqual(monster.base_attack, attack_range[0])
            self.assertLessEqual(monster.base_attack, attack_range[1])

    def test_map_spawn_entries_use_multipliers_not_base_stats(self) -> None:
        spawn_path = self.config_root / "monsters" / "map_spawn_v1.json"
        data = json.loads(spawn_path.read_text(encoding="utf-8"))

        for pack in data["monster_packs"]:
            for entry in pack["entries"]:
                self.assertNotIn("life", entry)
                self.assertNotIn("damage", entry)
                self.assertGreater(float(entry.get("life_multiplier", 1)), 0)
                self.assertGreaterEqual(float(entry.get("damage_multiplier", 1)), 0)

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
