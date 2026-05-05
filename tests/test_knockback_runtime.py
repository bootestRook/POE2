from __future__ import annotations

import sys
from dataclasses import replace
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


def _flame_slash_skill():
    inventory, board, calculator = _calculator()
    active = inventory.add_instance("active", "active_flame_slash", level=20)
    board.mount_gem("active", 0, 0)
    return calculator.calculate_for_active(active)


def _events(skill):
    return SkillRuntime().execute(
        skill,
        source_entity="player_1",
        source_position=Position(0, 0),
        target_entity="monster_1",
        target_position=Position(80, 0),
        timestamp_ms=1,
    )


def test_knockback_emits_forced_movement_from_damage_hit() -> None:
    base = _flame_slash_skill()
    skill = replace(
        base,
        runtime_params={
            **(base.runtime_params or {}),
            "knockback_chance_percent": 100,
            "knockback_base_distance": 50,
            "knockback_distance_add_percent": 40,
        },
    )

    movement = next(event for event in _events(skill) if event.type == "forced_movement")

    assert movement.amount == 70
    assert movement.payload["movement_policy"] == "knockback"
    assert movement.payload["destination_world_position"] == {"x": 150.0, "y": 0.0}


def test_knockback_does_not_emit_without_trigger_chance() -> None:
    base = _flame_slash_skill()
    skill = replace(
        base,
        runtime_params={
            **(base.runtime_params or {}),
            "knockback_chance_percent": 0,
            "knockback_base_distance": 50,
            "knockback_distance_add_percent": 40,
        },
    )

    assert not any(event.type == "forced_movement" for event in _events(skill))


def test_melee_knockback_support_writes_runtime_params() -> None:
    inventory, board, calculator = _calculator()
    active = inventory.add_instance("active", "active_flame_slash", level=20)
    inventory.add_instance("support", "support_melee_knockback", level=20)
    board.mount_gem("active", 0, 0)
    board.mount_gem("support", 0, 1)

    skill = calculator.calculate_for_active(active)

    assert skill.runtime_params["knockback_chance_percent"] > 0
    assert skill.runtime_params["knockback_distance_add_percent"] > 0
    assert any(event.type == "forced_movement" for event in _events(replace(skill, runtime_params={**skill.runtime_params, "knockback_chance_percent": 100})))
