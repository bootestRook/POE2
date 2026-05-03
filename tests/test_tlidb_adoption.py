from __future__ import annotations

import json
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
from liufang.combat import CombatSession, Player, Position
from liufang.presentation import PresentationService
from liufang.skill_effects import SkillEffectCalculator


class TlidbAdoptionTest(unittest.TestCase):
    def setUp(self) -> None:
        self.config_root = ROOT / "configs"
        self.definitions = load_gem_definitions(self.config_root)
        self.common = {
            "skill_templates": load_skill_templates(self.config_root),
            "relation_coefficients": load_relation_coefficients(self.config_root),
            "scaling_rules": load_skill_scaling_rules(self.config_root),
            "affix_definitions": load_affix_definitions(self.config_root),
        }

    def calculator(self, inventory: GemInventory, board: SudokuGemBoard) -> SkillEffectCalculator:
        return SkillEffectCalculator(board, self.definitions, **self.common)

    def test_manifest_counts_and_product_filter(self) -> None:
        manifest = json.loads((self.config_root / "skills" / "tlidb_adopted_skills.json").read_text(encoding="utf-8"))

        self.assertEqual(manifest["counts"]["active"], 16)
        self.assertEqual(manifest["counts"]["support"], 30)
        self.assertEqual(manifest["counts"]["passive"], 9)
        self.assertEqual(manifest["counts"]["board_conduits"], 3)
        self.assertNotIn("active_fire_bolt", self.definitions)
        self.assertEqual(sum(1 for definition in self.definitions.values() if definition.gem_kind == "active_skill"), 16)
        self.assertEqual(sum(1 for definition in self.definitions.values() if definition.gem_kind == "support"), 33)
        self.assertEqual(sum(1 for definition in self.definitions.values() if definition.gem_kind == "passive_skill"), 9)

    def test_active_level_table_changes_runtime_damage(self) -> None:
        low_inventory = GemInventory(self.definitions)
        low = low_inventory.add_instance("low", "active_split_firebolt", level=1)
        low_board = SudokuGemBoard(load_board_rules(self.config_root), low_inventory)
        low_board.mount_gem("low", 0, 0)

        high_inventory = GemInventory(self.definitions)
        high = high_inventory.add_instance("high", "active_split_firebolt", level=20)
        high_board = SudokuGemBoard(load_board_rules(self.config_root), high_inventory)
        high_board.mount_gem("high", 0, 0)

        low_skill = self.calculator(low_inventory, low_board).calculate_for_active(low)
        high_skill = self.calculator(high_inventory, high_board).calculate_for_active(high)

        self.assertLess(low_skill.base_damage, high_skill.base_damage)
        self.assertEqual(high_skill.base_damage, 842.5)

    def test_support_routes_through_sudoku_relation(self) -> None:
        inventory = GemInventory(self.definitions)
        active = inventory.add_instance("active", "active_split_firebolt", level=20)
        inventory.add_instance("support", "support_multiple_projectiles", level=20)
        board = SudokuGemBoard(load_board_rules(self.config_root), inventory)
        board.mount_gem("active", 0, 0)
        board.mount_gem("support", 0, 1)

        final_skill = self.calculator(inventory, board).calculate_for_active(active)

        self.assertEqual(final_skill.projectile_count, 3)
        self.assertTrue(any(mod.source_base_gem_id == "support_multiple_projectiles" for mod in final_skill.applied_modifiers))

    def test_support_level_table_is_applied_before_sudoku_scaling(self) -> None:
        inventory = GemInventory(self.definitions)
        active = inventory.add_instance("active", "active_split_firebolt", level=20)
        low_support = inventory.add_instance("low_support", "support_added_fire_damage", level=1)
        high_support = inventory.add_instance("high_support", "support_added_fire_damage", level=20)

        low_board = SudokuGemBoard(load_board_rules(self.config_root), inventory)
        low_board.mount_gem("active", 0, 0)
        low_board.mount_gem("low_support", 0, 1)
        low_skill = self.calculator(inventory, low_board).calculate_for_active(active)
        low_value = next(
            modifier.value
            for modifier in low_skill.applied_modifiers
            if modifier.source_instance_id == low_support.instance_id
            and modifier.stat == "fire_damage_add_percent"
        )

        low_board.unmount_gem("low_support")
        low_board.mount_gem("high_support", 0, 1)
        high_skill = self.calculator(inventory, low_board).calculate_for_active(active)
        high_value = next(
            modifier.value
            for modifier in high_skill.applied_modifiers
            if modifier.source_instance_id == high_support.instance_id
            and modifier.stat == "fire_damage_add_percent"
        )

        self.assertEqual(low_value, 13)
        self.assertEqual(high_value, 130)

    def test_passive_affects_active_without_auto_release(self) -> None:
        inventory = GemInventory(self.definitions)
        active = inventory.add_instance("active", "active_whirlwind", level=20)
        inventory.add_instance("passive", "passive_weapon_amplification", level=20)
        board = SudokuGemBoard(load_board_rules(self.config_root), inventory)
        board.mount_gem("active", 0, 0)
        board.mount_gem("passive", 0, 1)

        calculator = self.calculator(inventory, board)
        final_skills = calculator.calculate_all()

        self.assertEqual(len(final_skills), 1)
        self.assertEqual(final_skills[0].base_gem_id, "active_whirlwind")
        self.assertGreater(final_skills[0].final_damage, final_skills[0].base_damage)

    def test_presentation_exposes_tlidb_source_level_routing_and_auto_release(self) -> None:
        inventory = GemInventory(self.definitions)
        active = inventory.add_instance("active", "active_split_firebolt", level=20)
        inventory.add_instance("support", "support_multiple_projectiles", level=20)
        board = SudokuGemBoard(load_board_rules(self.config_root), inventory)
        board.mount_gem("active", 0, 0)
        board.mount_gem("support", 0, 1)
        final_skill = self.calculator(inventory, board).calculate_for_active(active)

        presenter = PresentationService.from_configs(self.config_root)
        detail = presenter.gem_detail(active, board=board, final_skills=(final_skill,))
        preview = presenter.skill_preview(final_skill)

        self.assertEqual(detail["tlidb"]["source_values"]["tlidb_id"], "Split_Firebolt")
        self.assertEqual(detail["tlidb"]["level_values"]["base_damage"], 842.5)
        self.assertIn("tlidb_source", detail["tooltip_view"]["sections"])
        self.assertIn("auto_release", detail["tooltip_view"]["sections"])
        self.assertEqual(preview["tlidb"]["source_values"]["tlidb_id"], "Split_Firebolt")
        self.assertTrue(preview["tlidb"]["routed_modifiers"])
        self.assertEqual(preview["tlidb"]["final_values"]["projectile_count"], final_skill.projectile_count)

    def test_defensive_auto_release_uses_life_threshold(self) -> None:
        inventory = GemInventory(self.definitions)
        active = inventory.add_instance("active", "active_stoneskin", level=20)
        board = SudokuGemBoard(load_board_rules(self.config_root), inventory)
        board.mount_gem("active", 0, 0)
        final_skill = self.calculator(inventory, board).calculate_for_active(active)

        session = CombatSession(
            player=Player("player", current_life=100, max_life=100, position=Position(0, 0), item_interaction_reach=1),
            monsters=[],
            dropped_gems=[],
            elapsed_ms=0,
            active_skill_instances=(final_skill,),
            inventory=inventory,
            loot_runtime=None,
        )

        self.assertEqual(session._skill_release_skip_reason(final_skill), "combat.skip.defensive_threshold")
        session.player.current_life = 50
        self.assertEqual(session._skill_release_skip_reason(final_skill), "")

    def test_player_facing_gem_level_is_limited_to_twenty(self) -> None:
        inventory = GemInventory(self.definitions)

        with self.assertRaisesRegex(ValueError, "1-20"):
            inventory.add_instance("too_high", "active_split_firebolt", level=21)


if __name__ == "__main__":
    unittest.main()
