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
    load_skill_scaling_rules,
    load_relation_coefficients,
    load_skill_templates,
)
from liufang.gem_board import SudokuGemBoard
from liufang.inventory import GemInventory
from liufang.loot import LootRuntime
from liufang.presentation import PresentationService
from liufang.skill_effects import SkillEffectCalculator


class PresentationTest(unittest.TestCase):
    def setUp(self) -> None:
        self.config_root = ROOT / "configs"
        self.definitions = load_gem_definitions(self.config_root)
        self.affixes = load_affix_definitions(self.config_root)
        self.inventory = GemInventory(self.definitions)
        self.board = SudokuGemBoard(load_board_rules(self.config_root), self.inventory)
        self.presenter = PresentationService.from_configs(self.config_root)

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

    def test_gem_detail_uses_localized_names_affixes_targets_and_filters(self) -> None:
        active = self.inventory.add_instance(
            "active",
            "active_fire_bolt",
            rarity="magic",
        )
        support = self.inventory.add_instance("support", "support_fire_mastery")
        passive = self.inventory.add_instance("passive", "passive_fire_focus")
        self.board.mount_gem(active.instance_id, 0, 0)
        self.board.mount_gem(support.instance_id, 0, 3)
        self.board.mount_gem(passive.instance_id, 1, 0)
        final_skills = self.calculator().calculate_all()

        active_detail = self.presenter.gem_detail(active, board=self.board, final_skills=final_skills)
        self.assertEqual(active_detail["name_text"], self.presenter.localizer.text("gem.active_fire_bolt.name"))
        self.assertIn("火球", active_detail["description_text"])
        self.assertIn("火焰伤害", active_detail["description_text"])
        self.assertNotIn("{projectile_count_text}", active_detail["description_text"])
        self.assertNotIn("验证", active_detail["description_text"])
        self.assertNotIn("标签", active_detail["description_text"])
        self.assertEqual(active_detail["category_text"], self.presenter.localizer.text("tag.active_skill_gem.name"))
        self.assertEqual(active_detail["gem_kind"], "active_skill")
        self.assertEqual(active_detail["sudoku_digit"], 1)
        self.assertEqual(active_detail["gem_type"]["number"], 1)
        self.assertNotIn("random_affixes", active_detail)
        self.assertNotIn("implicit_affixes", active_detail)
        self.assertTrue(active_detail["current_effective_targets"])
        active_tooltip = active_detail["tooltip_view"]
        self.assertEqual(active_tooltip["name_text"], self.presenter.localizer.text("gem.active_fire_bolt.name"))
        self.assertNotIn("random_affixes", active_tooltip["sections"])
        self.assertNotIn("current_targets", active_tooltip["sections"])
        self.assertNotIn("rules", active_tooltip["sections"])
        self.assertEqual(
            [tag["id"] for tag in active_tooltip["tags"]],
            ["gem", "spell", "fire", "projectile"],
        )
        self.assertNotIn(self.presenter.localizer.text("tag.active_skill_gem.name"), active_tooltip["subtitle_text"])
        self.assertNotIn(self.presenter.localizer.text("tag.loot_gem.name"), active_tooltip["subtitle_text"])
        self.assertNotIn(self.presenter.localizer.text("tag.gem_type_1.name"), active_tooltip["subtitle_text"])
        self.assertEqual(active_tooltip["sections"]["description"]["lines"], [active_detail["description_text"]])
        self.assertEqual(
            active_tooltip["sections"]["stats"]["lines"][0]["label_text"],
            self.presenter.localizer.text("ui.tooltip.level"),
        )
        self.assertTrue(active_tooltip["sections"]["recent_dps"]["lines"])
        self.assertTrue(active_tooltip["sections"]["bonuses"]["lines"])
        self.assertNotIn("同行", "；".join(active_tooltip["sections"]["bonuses"]["lines"]))

        support_detail = self.presenter.gem_detail(support, board=self.board, final_skills=final_skills)
        self.assertEqual(support_detail["description_text"], "使火焰技能的伤害提高 18%。")
        self.assertNotIn("标签", support_detail["description_text"])
        self.assertEqual(support_detail["category_text"], self.presenter.localizer.text("tag.support_gem.name"))
        self.assertEqual(support_detail["gem_kind"], "support")
        self.assertEqual(support_detail["sudoku_digit"], 5)
        self.assertIn("主动技能宝石", support_detail["can_affect"]["target_kinds"])
        self.assertIn("被动技能宝石", support_detail["can_affect"]["target_kinds"])
        self.assertEqual(
            support_detail["can_affect"]["tags_any"][0]["text"],
            self.presenter.localizer.text("tag.fire.name"),
        )
        self.assertEqual(
            support_detail["current_effective_targets"][0]["name_text"],
            self.presenter.localizer.text("gem.active_fire_bolt.name"),
        )
        support_tooltip = support_detail["tooltip_view"]
        self.assertEqual(support_tooltip["variant"], "support")
        self.assertEqual(support_tooltip["tags"], [])
        self.assertEqual(
            "".join(segment["text"] for segment in support_tooltip["summary_lines"][0]),
            "黄色、宝石",
        )
        self.assertNotIn("current_targets", support_tooltip["sections"])
        self.assertNotIn("rules", support_tooltip["sections"])
        self.assertNotIn("stats", support_tooltip["sections"])
        self.assertNotIn("random_affixes", support_tooltip["sections"])
        self.assertEqual(
            "".join(segment["text"] for segment in support_tooltip["sections"]["conditions"]["rich_lines"][0]),
            "辅助：火焰 宝石",
        )
        self.assertEqual(
            "".join(segment["text"] for segment in support_tooltip["sections"]["conditions"]["rich_lines"][1]),
            "连接：行、列、宫格",
        )
        self.assertEqual(
            "".join(segment["text"] for segment in support_tooltip["sections"]["support_rules"]["rich_lines"][0]),
            "同数独数字宝石不能位于同一行、列或宫格",
        )
        self.assertEqual(
            "".join(segment["text"] for segment in support_tooltip["sections"]["base_bonuses"]["rich_lines"][0]),
            "火焰伤害提高 18%",
        )

        passive_detail = self.presenter.gem_detail(passive, board=self.board, final_skills=final_skills)
        self.assertEqual(passive_detail["description_text"], "使火焰技能的伤害提高 10%。")
        self.assertEqual(passive_detail["category_text"], self.presenter.localizer.text("tag.passive_skill_gem.name"))
        self.assertEqual(passive_detail["gem_kind"], "passive_skill")
        self.assertEqual(passive_detail["sudoku_digit"], 2)
        passive_tooltip = passive_detail["tooltip_view"]
        self.assertEqual(passive_tooltip["variant"], "passive")
        self.assertIn("stats", passive_tooltip["sections"])
        self.assertNotIn("recent_dps", passive_tooltip["sections"])
        self.assertNotIn("random_affixes", passive_tooltip["sections"])
        self.assertNotIn("base_skill_level", passive_tooltip["sections"])
        self.assertEqual(
            passive_detail["current_effective_targets"][0]["name_text"],
            self.presenter.localizer.text("gem.active_fire_bolt.name"),
        )

    def test_all_gem_descriptions_resolve_localization_placeholders(self) -> None:
        for index, definition in enumerate(self.definitions.values()):
            with self.subTest(gem=definition.base_gem_id):
                instance = self.inventory.add_instance(f"gem_{index}", definition.base_gem_id)
                detail = self.presenter.gem_detail(instance)
                self.assertNotIn("{", detail["description_text"])
                self.assertNotIn("}", detail["description_text"])

    def test_board_view_includes_grid_boxes_prompts_highlights_influence_and_skill_preview(self) -> None:
        self.inventory.add_instance("active", "active_fire_bolt")
        self.inventory.add_instance("support", "support_fire_mastery")
        self.board.mount_gem("active", 0, 0)
        self.board.mount_gem("support", 0, 3)
        final_skills = self.calculator().calculate_all()

        view = self.presenter.board_view(self.board, final_skills=final_skills)
        self.assertEqual(len(view["cells"]), 9)
        self.assertEqual(len(view["cells"][0]), 9)
        self.assertEqual(len(view["boxes"]), 9)
        self.assertEqual(view["prompts"], [self.presenter.localizer.text("ui.board.valid")])
        self.assertTrue(view["highlights"]["same_row"])
        self.assertTrue(view["influence_preview"])
        self.assertEqual(
            view["skill_preview"][0]["name_text"],
            self.presenter.localizer.text("gem.active_fire_bolt.name"),
        )

    def test_skill_preview_dps_uses_formula_coverage_not_projectile_multiplier(self) -> None:
        active = self.inventory.add_instance("active", "active_fire_bolt")
        support = self.inventory.add_instance("support", "support_extra_projectile")
        self.board.mount_gem(active.instance_id, 0, 0)
        self.board.mount_gem(support.instance_id, 0, 3)

        final_skill = self.calculator().calculate_all()[0]
        preview = self.presenter.skill_preview(final_skill)
        active_detail = self.presenter.gem_detail(active, board=self.board, final_skills=(final_skill,))
        dps_line = active_detail["tooltip_view"]["sections"]["recent_dps"]["lines"][0]

        self.assertEqual(final_skill.projectile_count, 2)
        self.assertEqual(preview["hit_coverage_factor"], 1)
        self.assertAlmostEqual(preview["preview_dps"], final_skill.expected_hit_damage * final_skill.uses_per_second)
        self.assertNotAlmostEqual(
            preview["preview_dps"],
            final_skill.expected_hit_damage * final_skill.projectile_count * final_skill.uses_per_second,
        )
        self.assertEqual(dps_line["value_text"], self.presenter._format_number(final_skill.preview_dps))

    def test_active_gem_detail_shows_mana_cost(self) -> None:
        active = self.inventory.add_instance("active", "active_fire_bolt")
        self.board.mount_gem(active.instance_id, 0, 0)
        final_skill = self.calculator().calculate_all()[0]

        active_detail = self.presenter.gem_detail(active, board=self.board, final_skills=(final_skill,))
        stat_lines = active_detail["tooltip_view"]["sections"]["stats"]["lines"]

        self.assertIn(
            {
                "label_text": self.presenter.localizer.text("ui.skill.mana_cost"),
                "value_text": self.presenter._format_number(final_skill.mana_cost),
            },
            stat_lines,
        )

    def test_ice_shot_moves_weapon_attack_percents_from_description_to_stats(self) -> None:
        active = self.inventory.add_instance("active", "active_ice_shot", level=1)
        self.board.mount_gem(active.instance_id, 0, 0)
        final_skill = self.calculator().calculate_all()[0]

        active_detail = self.presenter.gem_detail(active, board=self.board, final_skills=(final_skill,))
        stat_lines = active_detail["tooltip_view"]["sections"]["stats"]["lines"]
        tooltip_tags = [tag["id"] for tag in active_detail["tooltip_view"]["tags"]]

        self.assertNotIn("313%", active_detail["description_text"])
        self.assertNotIn("157%", active_detail["description_text"])
        self.assertIn("冰霜爆炸", active_detail["description_text"])
        self.assertNotIn("bow", tooltip_tags)
        self.assertIn("attack", tooltip_tags)
        self.assertIn(
            {
                "label_text": self.presenter.localizer.text("ui.skill.attack_interval_ms"),
                "value_text": f"{self.presenter._format_number(final_skill.release_interval_ms)}{self.presenter.localizer.text('ui.tooltip.unit.ms')}",
            },
            stat_lines,
        )
        self.assertIn(
            {
                "label_text": self.presenter.localizer.text("ui.skill.weapon_attack_percent"),
                "value_text": "31.3%",
            },
            stat_lines,
        )
        self.assertIn(
            {
                "label_text": self.presenter.localizer.text("ui.skill.secondary_weapon_attack_percent"),
                "value_text": "15.7%",
            },
            stat_lines,
        )
        preview = self.presenter.skill_preview(final_skill)
        self.assertAlmostEqual(preview["hit"]["secondary_hits"][0]["base_damage"], 15.7)
        self.assertAlmostEqual(preview["hit"]["secondary_hits"][0]["weapon_attack_percent"], 15.7)

    def test_board_view_shows_localized_invalid_prompt(self) -> None:
        self.inventory.add_instance("support", "support_fast_attack")
        self.board.mount_gem("support", 0, 0)

        view = self.presenter.board_view(self.board)
        self.assertFalse(view["can_enter_combat"])
        self.assertIn(self.presenter.localizer.text("board.enter_combat.no_active_skill"), view["prompts"])

    def test_combat_hud_and_drop_prompt_use_localized_text(self) -> None:
        self.inventory.add_instance("active", "active_fire_bolt")
        self.board.mount_gem("active", 0, 0)
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
            loot_runtime=self.loot_runtime(),
        )

        session.tick(1)
        session.tick(420)
        hud = self.presenter.combat_hud(session)
        self.assertEqual(hud["player_life"]["label_text"], self.presenter.localizer.text("ui.hud.player_life"))
        self.assertEqual(hud["alive_monsters"]["value"], 0)
        self.assertEqual(hud["drop_prompts"][0]["status_text"], self.presenter.localizer.text("ui.drop.not_picked"))
        self.assertEqual(hud["pickup_prompts"][0]["status_text"], self.presenter.localizer.text("ui.pickup.pending"))

        session.pickup_nearby()
        picked_prompt = self.presenter.drop_prompt(session.dropped_gems[0])
        self.assertEqual(picked_prompt["status_text"], self.presenter.localizer.text("ui.drop.picked"))
        self.assertEqual(
            picked_prompt["inventory_result_text"],
            self.presenter.localizer.text("ui.pickup.success"),
        )


if __name__ == "__main__":
    unittest.main()
