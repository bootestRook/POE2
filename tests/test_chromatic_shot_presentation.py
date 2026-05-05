from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from liufang.config import (
    load_affix_definitions,
    load_board_rules,
    load_gem_definitions,
    load_relation_coefficients,
    load_skill_scaling_rules,
    load_skill_templates,
)
from liufang.gem_board import SudokuGemBoard
from liufang.inventory import GemInventory
from liufang.presentation import PresentationService
from liufang.skill_effects import SkillEffectCalculator


class ChromaticShotPresentationTest(unittest.TestCase):
    def test_gem_detail_includes_description_and_shotgun_falloff_stat(self) -> None:
        config_root = ROOT / "configs"
        definitions = load_gem_definitions(config_root)
        inventory = GemInventory(definitions)
        board = SudokuGemBoard(load_board_rules(config_root), inventory)
        active = inventory.add_instance("active", "active_chromatic_shot")
        board.mount_gem(active.instance_id, 0, 0)
        affix_definitions = {
            definition.affix_id: definition
            for definition in load_affix_definitions(config_root)
        }
        calculator = SkillEffectCalculator(
            board=board,
            definitions=definitions,
            skill_templates=load_skill_templates(config_root),
            relation_coefficients=load_relation_coefficients(config_root),
            scaling_rules=load_skill_scaling_rules(config_root),
            affix_definitions=affix_definitions,
        )
        final_skill = calculator.calculate_all()[0]
        presenter = PresentationService.from_configs(config_root)

        detail = presenter.gem_detail(active, board=board, final_skills=(final_skill,))
        stat_lines = detail["tooltip_view"]["sections"]["stats"]["lines"]

        self.assertEqual(final_skill.final_damage, 84.6)
        self.assertIn("五彩魔矢", detail["description_text"])
        self.assertIn("火焰、冰霜或闪电", detail["description_text"])
        self.assertIn("多个投射物可以命中同一敌人", detail["description_text"])
        self.assertNotIn("59-110", detail["description_text"])
        self.assertNotIn("10%", detail["description_text"])
        self.assertEqual(
            stat_lines[-1],
            {
                "label_text": presenter.localizer.text("ui.skill.shotgun_falloff_coeff"),
                "value_text": "70%",
            },
        )
