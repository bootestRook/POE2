from __future__ import annotations

import re
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from liufang.equipment import EquipmentAffixRoll, EquipmentItem
from liufang.web_api import V1WebAppApi


class WebApiGmToolTest(unittest.TestCase):
    def setUp(self) -> None:
        self.api = V1WebAppApi(ROOT / "configs")

    def test_gm_adds_specific_gem_and_equipment_to_inventory(self) -> None:
        options = self.api.gm_options()
        gem_id = options["gems"][0]["id"]
        source = options["equipment_sources"][0]["id"]
        affixes = [
            item
            for item in self.api.gm_equipment_affixes(source, 86)["affixes"]
            if item["library"] != "base"
        ]

        state = self.api.gm_add_gem(gem_id, 7, 2)
        added_gems = [item for item in state["inventory"] if item["instance_id"].startswith("gm_gem_")]
        self.assertEqual(len(added_gems), 2)
        self.assertEqual({item["level"] for item in added_gems}, {7})
        self.assertEqual(len({item["instance_id"] for item in added_gems}), 2)
        added_instances = self.api.inventory.filter_instances(base_gem_id=gem_id)
        self.assertGreaterEqual(len(added_instances), 2)

        state = self.api.gm_add_equipment(source, 86, [item["id"] for item in affixes[:2]])
        equipment = state["inventory"][-1]
        self.assertEqual(equipment["item_kind"], "equipment")
        self.assertEqual(equipment["category_text"], source)
        self.assertEqual(equipment["rarity_text"], "蓝色")
        self.assertEqual(len(equipment["tooltip_view"]["sections"]["stats"]["lines"]), 3)
        for line in equipment["tooltip_view"]["sections"]["stats"]["lines"]:
            self.assertNotRegex(line["value_text"], re.compile(r"\d+\s*[–-]\s*\d+"))

    def test_gm_can_add_same_gem_after_autosave_reload(self) -> None:
        gem_id = self.api.gm_options()["gems"][0]["id"]
        with tempfile.TemporaryDirectory() as temp_dir:
            save_path = Path(temp_dir) / "save.json"
            api = V1WebAppApi(ROOT / "configs", autosave_enabled=True, autosave_path=save_path)
            api.gm_add_gem(gem_id, 7, 2)

            reloaded = V1WebAppApi(ROOT / "configs", autosave_enabled=True, autosave_path=save_path)
            state = reloaded.gm_add_gem(gem_id, 7, 2)

        added_gems = [item for item in state["inventory"] if item["instance_id"].startswith("gm_gem_")]
        added_instances = reloaded.inventory.filter_instances(base_gem_id=gem_id)
        self.assertEqual(len(added_gems), 4)
        self.assertEqual(len({item["instance_id"] for item in added_gems}), 4)
        self.assertEqual({item["level"] for item in added_gems}, {7})
        self.assertGreaterEqual(len(added_instances), 4)

    def test_equipment_affix_effect_status_api_exposes_summary_and_operations(self) -> None:
        status = self.api.equipment_affix_effect_status()

        self.assertEqual(status["summary"]["raw_modifier_count"], 2121)
        self.assertEqual(status["summary"]["requires_design_alignment"], 0)
        self.assertEqual(status["summary"]["alignment_report_count"], 0)
        self.assertEqual(status["summary"]["mapped_effect"], 1634)
        self.assertEqual(status["summary"]["disabled"], 487)
        by_id = {item["source_modifier_id"]: item for item in status["mappings"]}
        self.assertEqual(by_id["115800301"]["status"], "mapped_effect")
        self.assertEqual(by_id["115800301"]["operations"][0]["stat"], "block_life_recovery_percent")
        self.assertEqual(by_id["116800101"]["status"], "disabled")
        self.assertEqual(by_id["116800101"]["disabled_reason"], "unsupported_mechanic:战吼")

    def test_gm_rejects_equipment_affix_from_wrong_source(self) -> None:
        options = self.api.gm_options()
        first_source = options["equipment_sources"][0]["id"]
        second_source = options["equipment_sources"][1]["id"]
        wrong_affix = next(
            item["id"]
            for item in self.api.gm_equipment_affixes(second_source, 86)["affixes"]
            if item["library"] != "base"
        )

        with self.assertRaises(ValueError):
            self.api.gm_add_equipment(first_source, 86, [wrong_affix])

    def test_gm_random_equipment_uses_requested_legal_rarity(self) -> None:
        source = self.api.gm_options()["equipment_sources"][0]["id"]

        state = self.api.gm_add_equipment(source, 86, [], random_rarity="pink")

        equipment = state["inventory"][-1]
        self.assertEqual(equipment["item_kind"], "equipment")
        self.assertEqual(equipment["rarity_text"], "粉色")
        affix_lines = equipment["tooltip_view"]["sections"]["stats"]["lines"]
        self.assertLessEqual(len(affix_lines), 7)

    def test_equipped_equipment_changes_displayed_player_stats(self) -> None:
        definition = next(
            definition
            for definition in self.api._equipment_affix_definitions()
            if definition.source_modifier_id == "1507000"
        )
        item = EquipmentItem(
            instance_id="gm_test_life_item",
            source=definition.source,
            level=100,
            rarity="white",
            base_affix=EquipmentAffixRoll(
                affix_id=definition.affix_id,
                source_modifier_id=definition.source_modifier_id,
                library=definition.library,
                gen=definition.gen,
                tier=definition.tier,
                effect=definition.effect,
                family_id=definition.family_id,
            ),
        )
        self.api.equipment_items.append(item)

        baseline = self.api.state()["player_stats"]["max_life"]["value"]
        equipped = self.api.equip_item(item.instance_id, [0])

        self.assertEqual(equipped["equipment_slots"][0], item.instance_id)
        self.assertGreater(equipped["player_stats"]["max_life"]["value"], baseline)

        unequipped = self.api.unequip_item(item.instance_id)
        self.assertIsNone(unequipped["equipment_slots"][0])
        self.assertEqual(unequipped["player_stats"]["max_life"]["value"], baseline)

    def test_gm_rolled_on_kill_equipment_feeds_web_runtime_events(self) -> None:
        burning_shot = self.api.inventory.filter_instances(base_gem_id="active_burning_shot")[0]
        self.api.mount(burning_shot.instance_id, 0, 0)
        definition = next(
            definition
            for definition in self.api._equipment_affix_definitions()
            if definition.source_modifier_id == "1501120"
        )

        self.api.gm_add_equipment(definition.source, 100, [definition.affix_id])
        equipment = self.api.equipment_items[-1]
        self.api.equip_item(equipment.instance_id, [0])
        result = self.api.runtime_skill_events(
            {
                "skill_instance_id": burning_shot.instance_id,
                "source_entity": "player",
                "source_position": {"x": 0, "y": 0},
                "timestamp_ms": 10,
                "target_entities": [
                    {"entity_id": "monster_1", "position": {"x": 100, "y": 0}},
                ],
            }
        )

        self.assertTrue(result["ok"])
        damage = next(event for event in result["events"] if event["type"] == "damage")
        self.assertGreater(damage["payload"]["on_kill_explosion_chance_percent"], 0)
        self.assertEqual(damage["payload"]["on_kill_explosion_radius"], 6.0)
        self.assertGreater(damage["payload"]["on_kill_explosion_max_life_percent"], 0)
        self.assertEqual(damage["payload"]["on_kill_explosion_damage_type"], "true")

    def test_gm_rolled_added_damage_equipment_changes_runtime_damage(self) -> None:
        burning_shot = self.api.inventory.filter_instances(base_gem_id="active_burning_shot")[0]
        self.api.mount(burning_shot.instance_id, 0, 0)
        baseline_skill = self.api._final_skills_or_error()[0][0]
        baseline_damage = baseline_skill.final_damage
        baseline_fire = baseline_skill.final_damage_components["fire"]
        definition = next(
            definition
            for definition in self.api._equipment_affix_definitions()
            if definition.source_modifier_id == "1500801"
        )

        self.api.gm_add_equipment(definition.source, 100, [definition.affix_id])
        equipment = self.api.equipment_items[-1]
        self.api.equip_item(equipment.instance_id, [0])
        equipped_skill = self.api._final_skills_or_error()[0][0]
        result = self.api.runtime_skill_events(
            {
                "skill_instance_id": burning_shot.instance_id,
                "source_entity": "player",
                "source_position": {"x": 0, "y": 0},
                "timestamp_ms": 10,
                "target_entities": [
                    {"entity_id": "monster_1", "position": {"x": 100, "y": 0}},
                ],
            }
        )

        self.assertGreater(equipped_skill.skill_stats["added_fire_damage"], 0)
        self.assertGreater(equipped_skill.final_damage, baseline_damage)
        self.assertGreater(equipped_skill.final_damage_components["fire"], baseline_fire)
        damage = next(event for event in result["events"] if event["type"] == "damage")
        self.assertGreater(damage["payload"]["damage_components"]["fire"], baseline_fire)

    def test_support_added_damage_survives_web_runtime_stat_filter(self) -> None:
        burning_shot = self.api.inventory.filter_instances(base_gem_id="active_burning_shot")[0]
        self.api.gm_add_gem("support_added_fire_damage", 1, 1)
        added_fire = self.api.inventory.filter_instances(base_gem_id="support_added_fire_damage")[0]
        self.api.mount(burning_shot.instance_id, 0, 0)
        baseline_skill = self.api._final_skills_or_error()[0][0]

        self.api.mount(added_fire.instance_id, 0, 1)
        supported_skill = self.api._final_skills_or_error()[0][0]

        self.assertGreater(supported_skill.skill_stats["added_fire_damage"], 0)
        self.assertGreater(
            supported_skill.final_damage_components["fire"],
            baseline_skill.final_damage_components["fire"],
        )


if __name__ == "__main__":
    unittest.main()
