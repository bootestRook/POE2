from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from liufang.map_progression import (
    add_map_entry,
    consume_stage_entry,
    create_map_run_context,
    initial_progression_state,
    load_map_progression,
    map_progression_view,
    stage_is_enterable,
    unlock_after_clear,
)


class MapProgressionConfigTest(unittest.TestCase):
    def setUp(self) -> None:
        self.config = load_map_progression(ROOT / "configs")

    def test_stage_table_matches_torchlight_like_progression(self) -> None:
        stage_ids = self.config.ordered_stage_ids

        self.assertEqual(len(stage_ids), 18)
        self.assertEqual(stage_ids[0], "start_i")
        self.assertEqual(stage_ids[-1], "timemark_8_4")
        self.assertEqual(self.config.stage("start_i").map_level_min, 1)
        self.assertEqual(self.config.stage("danger_ii").map_level_max, 59)
        self.assertEqual(self.config.stage("timemark_1").map_level_min, 60)
        self.assertEqual(self.config.stage("timemark_8_4").map_level_max, 100)

    def test_start_i_is_free_and_later_maps_need_entries(self) -> None:
        state = initial_progression_state(self.config)

        self.assertTrue(stage_is_enterable(self.config, state, "start_i"))
        self.assertFalse(stage_is_enterable(self.config, state, "start_ii"))

        unlocked = unlock_after_clear(self.config, state, "start_i")
        self.assertEqual(unlocked, "start_ii")
        self.assertFalse(stage_is_enterable(self.config, state, "start_ii"))

        add_map_entry(self.config, state, "start_ii")
        self.assertTrue(stage_is_enterable(self.config, state, "start_ii"))
        consume_stage_entry(self.config, state, "start_ii")
        self.assertEqual(state.map_entries["start_ii"], 0)

    def test_run_context_uses_map_level_as_single_reward_level_source(self) -> None:
        context = create_map_run_context(self.config, "timemark_8_4", run_number=7)

        self.assertEqual(context.run_id, "run_timemark_8_4_000007")
        self.assertEqual(context.map_level, 100)
        self.assertEqual(context.monster_level, 92)
        self.assertEqual(context.loot_profile_id, "timemark_8")
        self.assertTrue(context.boss_stage)

    def test_loot_profile_and_monster_curve_scale_by_stage(self) -> None:
        early = self.config.loot_profile(self.config.stage("start_i").loot_profile_id)
        late = self.config.loot_profile(self.config.stage("timemark_8_4").loot_profile_id)
        normal = self.config.rarity_multipliers["normal"]
        boss = self.config.rarity_multipliers["boss"]

        self.assertLess(early.gem_level_max, late.gem_level_min)
        self.assertGreater(early.base_drop_chance, 0)
        self.assertLess(early.base_drop_chance, late.base_drop_chance)
        self.assertLess(late.base_drop_chance, 1.0)
        for profile in self.config.loot_profiles.values():
            self.assertEqual(profile.equipment_weight, 70)
            self.assertEqual(profile.gem_weight, 20)
            self.assertEqual(profile.map_entry_weight, 10)
        for profile in self.config.loot_profiles.values():
            weights = profile.equipment_rarity_weights
            self.assertGreater(weights["white"], weights["blue"])
            self.assertGreater(weights["blue"], weights["purple"])
            self.assertGreater(weights["purple"], weights["pink"])
        self.assertGreater(
            self.config.monster_curve.monster_life(92, rarity_life=boss.life),
            self.config.monster_curve.monster_life(5, rarity_life=normal.life),
        )

    def test_progression_view_exposes_ui_ready_map_selection_data(self) -> None:
        state = initial_progression_state(self.config)
        view = map_progression_view(self.config, state)

        first = view["stages"][0]
        second = view["stages"][1]
        self.assertEqual(view["selected_stage_id"], "start_i")
        self.assertEqual(first["display_name"], "起始区域 I")
        self.assertTrue(first["enterable"])
        self.assertTrue(first["free_entry"])
        self.assertFalse(second["enterable"])
        self.assertEqual(first["map_level_text"], "1-9")
        self.assertEqual(first["equipment_weight"], 70)
        self.assertEqual(first["gem_weight"], 20)
        self.assertEqual(first["map_entry_weight"], 10)


if __name__ == "__main__":
    unittest.main()
