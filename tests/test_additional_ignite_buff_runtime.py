from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from liufang.combat import Monster, Position
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


def test_additional_ignite_support_writes_ignite_buff_payload() -> None:
    inventory, board, calculator = _calculator()
    active = inventory.add_instance("active", "active_burning_shot", level=20)
    inventory.add_instance("support", "support_additional_ignite", level=20)
    board.mount_gem("active", 0, 0)
    board.mount_gem("support", 0, 1)

    skill = calculator.calculate_for_active(active)
    ignite = skill.ailments[0]
    status_apply = next(
        event
        for event in SkillRuntime().execute(
            skill,
            source_entity="player_1",
            source_position=Position(0, 0),
            target_entity="monster_1",
            target_position=Position(80, 0),
            timestamp_ms=1,
        )
        if event.type == "status_apply" and event.payload["status_type"] == "ignite"
    )

    assert ignite["stacks"] == 2
    assert status_apply.payload["stacks"] == 2
    assert status_apply.payload["dot_damage_bonus_per_ignite_stack_percent"] > 0
    assert status_apply.payload["dot_damage_bonus_max_percent"] > 0


def test_ignite_buff_scales_dot_by_current_ignite_stacks_with_cap() -> None:
    monster = Monster("monster_1", current_life=1000, max_life=1000, position=Position(0, 0))
    monster.apply_buff(
        {
            "status_type": "ignite",
            "duration_ms": 4000,
            "base_damage_per_second": 100,
            "stacks": 2,
            "max_stacks": 2,
            "dot_damage_bonus_per_ignite_stack_percent": 2.7,
            "dot_damage_bonus_max_percent": 10.8,
        }
    )
    monster.apply_buff(
        {
            "status_type": "ignite",
            "duration_ms": 4000,
            "base_damage_per_second": 0,
            "stacks": 3,
            "max_stacks": 3,
        }
    )

    dealt = monster.tick_buffs(1000)

    assert dealt == pytest.approx(221.6)
    assert monster.current_life == pytest.approx(778.4)


def test_ignite_without_stack_bonus_keeps_existing_dot_behavior() -> None:
    monster = Monster("monster_1", current_life=1000, max_life=1000, position=Position(0, 0))
    monster.apply_buff(
        {
            "status_type": "ignite",
            "duration_ms": 4000,
            "base_damage_per_second": 25,
            "max_stacks": 1,
        }
    )

    dealt = monster.tick_buffs(1000)

    assert dealt == 25
    assert monster.current_life == 975
