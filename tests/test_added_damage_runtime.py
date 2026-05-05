from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from liufang.config import (
    load_board_rules,
    load_gem_definitions,
    load_relation_coefficients,
    load_skill_scaling_rules,
    load_skill_templates,
)
from liufang.gem_board import SudokuGemBoard
from liufang.inventory import GemInventory
from liufang.skill_effects import SkillEffectCalculator


def _calculator():
    config_root = ROOT / "configs"
    definitions = load_gem_definitions(config_root)
    inventory = GemInventory(definitions)
    board = SudokuGemBoard(load_board_rules(config_root), inventory)
    calculator = SkillEffectCalculator(
        board=board,
        definitions=definitions,
        skill_templates=load_skill_templates(config_root),
        relation_coefficients=load_relation_coefficients(config_root),
        scaling_rules=load_skill_scaling_rules(config_root),
        affix_definitions={},
    )
    return inventory, board, calculator


def test_flat_added_damage_enters_base_components_before_scaling() -> None:
    inventory, board, calculator = _calculator()
    active = inventory.add_instance("active", "active_sparkle", level=20)
    inventory.add_instance("support", "support_added_fire_damage", level=20)
    board.mount_gem("active", 0, 0)
    board.mount_gem("support", 0, 1)

    skill = calculator.calculate_for_active(active)
    added_modifier = next(
        modifier
        for modifier in skill.applied_modifiers
        if modifier.source_base_gem_id == "support_added_fire_damage"
        and modifier.stat == "added_fire_damage"
    )

    assert skill.base_damage_components["lightning"] == 426.5
    assert skill.base_damage_components["fire"] == added_modifier.value
    assert skill.final_damage_components["fire"] == added_modifier.value
    assert skill.final_damage == 426.5 + added_modifier.value


def test_physical_to_fire_adds_physical_as_extra_fire_before_conversion() -> None:
    inventory, board, calculator = _calculator()
    active = inventory.add_instance("active", "active_whirlwind", level=20)
    inventory.add_instance("support", "support_physical_to_fire", level=20)
    board.mount_gem("active", 0, 0)
    board.mount_gem("support", 0, 1)

    skill = calculator.calculate_for_active(active)
    extra_modifier = next(
        modifier
        for modifier in skill.applied_modifiers
        if modifier.source_base_gem_id == "support_physical_to_fire"
        and modifier.stat == "added_fire_damage_from_physical_percent"
    )
    expected_extra_fire = 83.0 * extra_modifier.value / 100.0

    assert skill.base_damage_components["physical"] == 83.0
    assert skill.base_damage_components["fire"] == expected_extra_fire
    assert skill.converted_damage_components["fire"]["physical"] == 83.0
    assert skill.converted_damage_components["fire"]["fire"] == expected_extra_fire


def test_flat_added_damage_support_does_not_apply_to_dot_skill() -> None:
    inventory, board, calculator = _calculator()
    active = inventory.add_instance("active", "active_black_hole", level=20)
    inventory.add_instance("support", "support_added_fire_damage", level=20)
    board.mount_gem("active", 0, 0)
    board.mount_gem("support", 0, 1)

    skill = calculator.calculate_for_active(active)

    assert not any(
        modifier.source_base_gem_id == "support_added_fire_damage"
        for modifier in skill.applied_modifiers
    )
