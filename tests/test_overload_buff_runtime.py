from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from liufang.combat import BuffState, Position
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


def _overload_spell_skill():
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
    active = inventory.add_instance("active", "active_blizzard", level=20)
    inventory.add_instance("support", "support_overload", level=20)
    board.mount_gem("active", 0, 0)
    board.mount_gem("support", 0, 1)
    return calculator.calculate_for_active(active)


def _first_damage(skill, runtime_context=None):
    events = SkillRuntime().execute(
        skill,
        source_entity="player_1",
        source_position=Position(0, 0),
        target_entity="monster_1",
        target_position=Position(80, 0),
        timestamp_ms=1,
        target_entities=[{"entity_id": "monster_1", "position": {"x": 80, "y": 0}}],
        runtime_context=runtime_context,
    )
    return next(event for event in events if event.type == "damage")


def test_overload_does_not_add_damage_without_energy_blessing_buff() -> None:
    skill = _overload_spell_skill()

    damage = _first_damage(skill)

    assert skill.runtime_params["overload_buff_type"] == "energy_blessing"
    assert "overload_buff_applied" not in damage.payload


def test_overload_reads_energy_blessing_stacks_from_buff_context() -> None:
    skill = _overload_spell_skill()
    base_damage = _first_damage(skill).amount

    damage = _first_damage(
        skill,
        runtime_context={"buffs": [BuffState("energy_blessing", remaining_ms=1000, stacks=5)]},
    )

    per_stack = skill.runtime_params["overload_damage_per_stack_percent"]
    expected_scale = 1.0 + per_stack * 5 / 100.0
    assert damage.payload["overload_buff_stacks"] == 5
    assert damage.amount == base_damage * expected_scale


def test_overload_clamps_energy_blessing_stacks_to_configured_cap() -> None:
    skill = _overload_spell_skill()
    base_damage = _first_damage(skill).amount

    damage = _first_damage(
        skill,
        runtime_context={"buff_stacks": {"energy_blessing": 20}},
    )

    per_stack = skill.runtime_params["overload_damage_per_stack_percent"]
    max_stacks = skill.runtime_params["overload_max_stacks"]
    expected_scale = 1.0 + per_stack * max_stacks / 100.0
    assert max_stacks == 8
    assert damage.payload["overload_buff_stacks"] == max_stacks
    assert damage.amount == base_damage * expected_scale
