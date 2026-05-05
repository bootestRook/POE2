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


def _flame_slash_skill():
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
    active = inventory.add_instance("active", "active_flame_slash", level=20)
    board.mount_gem("active", 0, 0)
    return calculator.calculate_for_active(active)


def _damage_events(skill, timestamp_ms: int = 1):
    return [
        event
        for event in SkillRuntime().execute(
            skill,
            source_entity="player_1",
            source_position=Position(0, 0),
            target_entity="monster_1",
            target_position=Position(80, 0),
            timestamp_ms=timestamp_ms,
        )
        if event.type == "damage"
    ]


def test_continuous_attack_guarantees_one_repeat_per_full_100_percent() -> None:
    base = _flame_slash_skill()
    skill = replace(
        base,
        runtime_params={
            **(base.runtime_params or {}),
            "continuous_attack_chance_percent": 250,
            "continuous_attack_damage_step_percent": 27,
        },
    )

    damages = _damage_events(skill)

    assert len(damages) == 3
    assert damages[0].payload.get("continuous_attack_index") is None
    assert damages[1].payload["continuous_attack_index"] == 1
    assert damages[2].payload["continuous_attack_index"] == 2
    assert damages[1].amount == damages[0].amount * 1.27
    assert damages[2].amount == damages[0].amount * 1.54


def test_continuous_attack_uses_stable_remainder_roll() -> None:
    base = _flame_slash_skill()
    skill = replace(
        base,
        runtime_params={
            **(base.runtime_params or {}),
            "continuous_attack_chance_percent": 101,
            "continuous_attack_damage_step_percent": 0,
        },
    )

    found_one_repeat = False
    found_two_repeats = False
    for timestamp_ms in range(1, 300):
        repeat_count = len(_damage_events(skill, timestamp_ms=timestamp_ms)) - 1
        found_one_repeat = found_one_repeat or repeat_count == 1
        found_two_repeats = found_two_repeats or repeat_count == 2
        if found_one_repeat and found_two_repeats:
            break

    assert found_one_repeat
    assert found_two_repeats
