from __future__ import annotations

import random
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from liufang.affixes import AffixGenerator
from liufang.combat import CombatSession, Monster, Player, Position
from liufang.config import (
    load_affix_definitions,
    load_board_rules,
    load_gem_definitions,
    load_rarity_affix_counts,
    load_relation_coefficients,
    load_skill_scaling_rules,
    load_skill_templates,
)
from liufang.gem_board import SudokuGemBoard
from liufang.inventory import GemInventory
from liufang.loot import LootRuntime
from liufang.presentation import PresentationService
from liufang.skill_effects import SkillEffectCalculator
from liufang.web_api import V1WebAppApi


class V1LoopTest(unittest.TestCase):
    def setUp(self) -> None:
        self.config_root = ROOT / "configs"
        self.definitions = load_gem_definitions(self.config_root)
        self.affixes = load_affix_definitions(self.config_root)
        self.inventory = GemInventory(self.definitions)
        self.board = SudokuGemBoard(load_board_rules(self.config_root), self.inventory)
        self.presenter = PresentationService.from_configs(self.config_root)

    def test_web_state_includes_non_gem_test_item(self) -> None:
        api = V1WebAppApi(ROOT / "configs")
        state = api.state()

        test_item = next(item for item in state["inventory"] if item["instance_id"] == "web_test_whetstone")

        self.assertEqual(test_item["item_kind"], "ordinary")
        self.assertIsNone(test_item["board_position"])
        self.assertNotIn("gem", {tag["id"] for tag in test_item["tags"]})
        self.assertEqual(state["ui_text"]["only_gems_on_board"], api.presenter.localizer.text("ui.inventory.only_gems_on_board"))

    def test_web_seed_inventory_uses_requested_gem_mix(self) -> None:
        api = V1WebAppApi(ROOT / "configs")
        seeded_gems = [
            instance
            for instance in api.inventory.sort_instances("acquired_order")
            if instance.instance_id.startswith("web_seed_")
        ]

        active_gems = [instance for instance in seeded_gems if instance.gem_kind == "active_skill"]
        passive_gems = [instance for instance in seeded_gems if instance.gem_kind == "passive_skill"]
        support_gems = [instance for instance in seeded_gems if instance.gem_kind == "support"]
        support_counts_by_category: dict[str, int] = {}
        support_base_ids_by_category: dict[str, set[str]] = {}
        for instance in seeded_gems:
            definition = api.definitions[instance.base_gem_id]
            if definition.is_support:
                support_counts_by_category[definition.category] = support_counts_by_category.get(definition.category, 0) + 1
                support_base_ids_by_category.setdefault(definition.category, set()).add(instance.base_gem_id)

        self.assertEqual(
            {instance.base_gem_id for instance in active_gems},
            {
                "active_fire_bolt",
                "active_ice_shards",
                "active_lightning_chain",
                "active_frost_nova",
                "active_puncture",
                "active_penetrating_shot",
                "active_lava_orb",
                "active_fungal_petards",
            },
        )
        self.assertEqual(len(active_gems), 8)
        self.assertEqual(len(passive_gems), 3)
        self.assertEqual({instance.base_gem_id for instance in passive_gems}, {
            "passive_fire_focus",
            "passive_vitality",
            "passive_swift_gathering",
        })
        self.assertEqual(set(support_counts_by_category), {
            "general_skill_modifier",
            "damage_type_enhancer",
            "projectile_area_specialist",
            "risk_reward",
            "skill_level",
            "board_conduit",
            "skill_shape_modifier",
        })
        self.assertTrue(all(count == 3 for count in support_counts_by_category.values()))
        self.assertTrue(all(len(base_ids) == 3 for base_ids in support_base_ids_by_category.values()))
        self.assertEqual({instance.gem_kind for instance in seeded_gems}, {"active_skill", "passive_skill", "support"})
        self.assertTrue(all(instance.board_position is None for instance in seeded_gems))
        self.assertFalse(api.board.view().cells)
        self.assertIn("已准备现有主动技能宝石各 1 颗、3 颗不同被动技能宝石，以及 7 类辅助宝石各 3 颗。", api.logs)

    def calculator(self) -> SkillEffectCalculator:
        return SkillEffectCalculator(
            board=self.board,
            definitions=self.definitions,
            skill_templates=load_skill_templates(self.config_root),
            relation_coefficients=load_relation_coefficients(self.config_root),
            scaling_rules=load_skill_scaling_rules(self.config_root),
            affix_definitions={definition.affix_id: definition for definition in self.affixes},
        )

    def loot_runtime(self, seed: int = 6) -> LootRuntime:
        return LootRuntime.from_configs(
            self.config_root,
            self.definitions,
            {"normal": 1},
            AffixGenerator(self.affixes, load_rarity_affix_counts(self.config_root), random.Random(seed)),
            rng=random.Random(seed),
        )

    def test_brush_gem_view_affix_adjust_board_combat_pickup_and_recalculate_loop(self) -> None:
        active = self.inventory.add_instance("active", "active_fire_bolt")
        self.board.mount_gem(active.instance_id, 0, 0)

        active_detail = self.presenter.gem_detail(active, board=self.board)
        self.assertEqual(active_detail["name_text"], self.presenter.localizer.text("gem.active_fire_bolt.name"))

        first_skills = self.calculator().calculate_all()
        first_board_view = self.presenter.board_view(self.board, final_skills=first_skills)
        first_damage = first_board_view["skill_preview"][0]["final_damage"]
        self.assertTrue(first_board_view["can_enter_combat"])

        session = CombatSession.start(
            player=Player(
                "player_1",
                current_life=100,
                max_life=100,
                position=Position(0, 0),
                item_interaction_reach=2,
                current_mana=100,
                max_mana=100,
            ),
            monsters=[Monster("monster_1", current_life=5, max_life=5, position=Position(1, 0))],
            inventory=self.inventory,
            skill_effect_calculator=self.calculator(),
            loot_runtime=self.loot_runtime(seed=33),
        )
        session.tick(1)
        events = session.tick(420)
        self.assertTrue(events[0].killed)
        self.assertEqual(len(session.dropped_gems), 1)

        drop_prompt = self.presenter.drop_prompt(session.dropped_gems[0])
        self.assertEqual(drop_prompt["status_text"], self.presenter.localizer.text("ui.drop.not_picked"))

        picked = session.pickup_nearby()
        self.assertEqual(len(picked), 1)
        new_gem = picked[0]
        self.assertIn("support_gem", new_gem.tags)

        new_detail = self.presenter.gem_detail(new_gem, board=self.board, final_skills=first_skills)
        self.assertEqual(new_detail["name_text"], self.presenter.localizer.text("gem.support_attack_spell_level.name"))

        self.board.mount_gem(new_gem.instance_id, 0, 3)
        second_skills = self.calculator().calculate_all()
        second_board_view = self.presenter.board_view(self.board, final_skills=second_skills)
        second_damage = second_board_view["skill_preview"][0]["final_damage"]

        self.assertGreater(second_damage, first_damage)
        self.assertTrue(second_board_view["influence_preview"])
        self.assertEqual(
            self.presenter.gem_detail(new_gem, board=self.board, final_skills=second_skills)[
                "current_effective_targets"
            ][0]["name_text"],
            self.presenter.localizer.text("gem.active_fire_bolt.name"),
        )


if __name__ == "__main__":
    unittest.main()
