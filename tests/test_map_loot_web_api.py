from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from liufang.combat import Monster, Position
from liufang.map_progression import add_map_entry
from liufang.web_api import V1WebAppApi


class MapLootWebApiTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.save_path = Path(self.temp_dir.name) / "autosave.json"
        self.api = V1WebAppApi(ROOT / "configs", autosave_enabled=True, autosave_path=self.save_path)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_start_i_is_free_and_state_exposes_map_selection(self) -> None:
        state = self.api.state()
        stages = state["map_progression"]["stages"]

        self.assertEqual(stages[0]["display_name"], "起始区域 I")
        self.assertTrue(stages[0]["free_entry"])
        self.assertTrue(stages[0]["enterable"])
        self.assertFalse(stages[1]["enterable"])

        started = self.api.start_map("start_i")
        self.assertEqual(started["current_map_run"]["stage_id"], "start_i")
        self.assertEqual(started["current_map_run"]["map_level"], 9)
        self.assertTrue(self.save_path.exists())

    def test_start_map_exposes_backend_canonical_monster_instances(self) -> None:
        started = self.api.start_map("start_i")
        run = started["current_map_run"]
        monsters = run["monsters"]

        self.assertEqual(started["drops"], [])
        self.assertGreaterEqual(len(monsters), 4)
        self.assertTrue(all(monster["current_life"] > 0 for monster in monsters))
        self.assertEqual({monster["map_stage_id"] for monster in monsters}, {"start_i"})
        self.assertEqual({monster["map_level"] for monster in monsters}, {9})
        self.assertEqual({monster["monster_level"] for monster in monsters}, {5})
        self.assertIn("normal", {monster["spawn_rarity"] for monster in monsters})
        self.assertIn("magic", {monster["spawn_rarity"] for monster in monsters})
        first = monsters[0]
        self.assertEqual(first["runtime_id"], "start_i_monster_1")
        self.assertEqual(first["monster_id"], "mon_100101")
        self.assertEqual(first["pack_id"], "start_i_pack_main")
        self.assertEqual(first["zone_type"], "main_room")
        self.assertIn("current_life", first)
        self.assertGreater(first["max_life"], 0)
        self.assertGreater(first["base_damage"], 0)
        self.assertEqual(first["loot_context"]["stage_id"], "start_i")
        self.assertEqual(first["loot_context"]["monster_rarity"], first["spawn_rarity"])

    def test_combat_tick_advances_map_run_and_can_create_drops_after_start(self) -> None:
        started = self.api.start_map("start_i")
        self.assertEqual(started["drops"], [])

        ticked = self.api.combat_tick(1200)

        self.assertGreaterEqual(len(ticked["current_map_run"]["monsters"]), 4)
        self.assertIn("drops", ticked)

    def test_start_map_reuses_existing_spawn_layout_for_canonical_monsters(self) -> None:
        started = self.api.start_map(
            "start_i",
            [
                {
                    "runtime_id": 42,
                    "monster_id": "mon_200101",
                    "monster_pack_id": "geo_room_shard_mix",
                    "zone_type": "main_room",
                    "spawn_rarity": "magic",
                    "x": 4368,
                    "y": 7536,
                    "life_multiplier": 1.25,
                    "damage_multiplier": 1.1,
                }
            ],
        )
        monsters = started["current_map_run"]["monsters"]

        self.assertEqual(len(monsters), 1)
        self.assertEqual(monsters[0]["runtime_id"], "start_i_monster_42")
        self.assertEqual(monsters[0]["monster_id"], "mon_200101")
        self.assertEqual(monsters[0]["pack_id"], "geo_room_shard_mix")
        self.assertEqual(monsters[0]["zone_type"], "main_room")
        self.assertEqual(monsters[0]["spawn_rarity"], "magic")
        self.assertEqual(monsters[0]["position"], {"x": 4368.0, "y": 7536.0})
        self.assertGreater(monsters[0]["max_life"], 0)

    def test_contextual_drop_can_pick_up_equipment_and_map_entry(self) -> None:
        self.api.start_map("start_i")
        session = self.api.combat_session
        self.assertIsNotNone(session)
        assert session is not None
        monster = Monster("forced_boss", current_life=0, max_life=100, position=Position(1, 0), rarity="boss", is_boss=True)

        session._drop_from_monster(monster)
        drops = [drop for drop in session.dropped_gems if not drop.picked_up]
        self.assertTrue({drop.loot_kind for drop in drops} & {"equipment", "map_entry", "gem"})
        session.player.position = Position(1, 0)

        self.api.pickup(drops[0].drop_id)

        state = self.api.state()
        self.assertTrue(any(item.get("item_kind") == "equipment" for item in state["inventory"]))
        self.assertGreaterEqual(state["map_progression"]["stages"][1]["entry_count"], 1)

    def test_autosave_round_trips_map_entries_and_equipment_slots(self) -> None:
        source = self.api.gm_options()["equipment_sources"][0]["id"]
        self.api.gm_add_equipment(source, 30, [], random_rarity="blue")
        equipment_id = self.api.equipment_items[-1].instance_id
        self.api.equip_item(equipment_id, [0])
        add_map_entry(self.api.map_progression, self.api.map_state, "start_ii")
        self.api._autosave()

        restored = V1WebAppApi(ROOT / "configs", autosave_enabled=True, autosave_path=self.save_path)
        state = restored.state()

        self.assertEqual(state["equipment_slots"][0], equipment_id)
        self.assertEqual(state["map_progression"]["stages"][1]["entry_count"], 1)

    def test_new_game_continue_missing_fields_and_broken_tickets_keep_start_i_enterable(self) -> None:
        new_state = self.api.new_game()
        self.assertTrue(self.save_path.exists())
        self.assertEqual(new_state["map_progression"]["stages"][0]["id"], "start_i")
        self.assertTrue(new_state["map_progression"]["stages"][0]["enterable"])

        add_map_entry(self.api.map_progression, self.api.map_state, "start_ii")
        self.api.start_map("start_ii")
        continued = self.api.continue_game()
        self.assertGreaterEqual(continued["map_progression"]["stages"][1]["entry_count"], 0)

        self.save_path.write_text(json.dumps({"version": 1, "map_state": {"map_entries": {"start_ii": 0}}}), encoding="utf-8")
        restored = V1WebAppApi(ROOT / "configs", autosave_enabled=True, autosave_path=self.save_path)
        state = restored.state()
        self.assertTrue(state["map_progression"]["stages"][0]["enterable"])
        self.assertEqual(state["map_progression"]["stages"][0]["id"], "start_i")
        restored.start_map("start_i")


if __name__ == "__main__":
    unittest.main()
