from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from liufang.combat import Position
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
from liufang.skill_runtime import SkillRuntime


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


def test_channel_preparation_sets_channel_stack_floor() -> None:
    inventory, board, calculator = _calculator()
    active = inventory.add_instance("active", "active_whirlwind", level=20)
    inventory.add_instance("support", "support_channel_preparation", level=20)
    board.mount_gem("active", 0, 0)
    board.mount_gem("support", 0, 1)

    final_skill = calculator.calculate_for_active(active)
    events = SkillRuntime().execute(
        final_skill,
        source_entity="player_1",
        source_position=Position(0, 0),
        target_entity="monster_1",
        target_position=Position(80, 0),
        timestamp_ms=1,
        runtime_context={"channel_stack": 0},
    )

    damage_zone = next(event for event in events if event.type == "damage_zone")
    assert final_skill.runtime_params["channel_min_stacks"] == 2
    assert damage_zone.payload["channel_min_stacks"] == 2
    assert damage_zone.payload["channel_stack"] == 2
    assert damage_zone.payload["next_channel_stack"] == 2


def test_channel_preparation_does_not_apply_to_non_channel_attack() -> None:
    inventory, board, calculator = _calculator()
    active = inventory.add_instance("active", "active_flame_slash", level=20)
    inventory.add_instance("support", "support_channel_preparation", level=20)
    board.mount_gem("active", 0, 0)
    board.mount_gem("support", 0, 1)

    final_skill = calculator.calculate_for_active(active)

    assert "channel_min_stacks" not in (final_skill.runtime_params or {})
    assert not any(
        modifier.source_base_gem_id == "support_channel_preparation"
        for modifier in final_skill.applied_modifiers
    )
