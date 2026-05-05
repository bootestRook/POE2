from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from liufang.combat import CombatSession, Monster, Player, Position
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


def _events_for(base_gem_id: str, *, include_extra_target: bool = True):
    inventory, board, calculator = _calculator()
    inventory.add_instance("active", base_gem_id, level=20)
    board.mount_gem("active", 0, 0)
    skill = calculator.calculate_all()[0]
    target_entities = [{"entity_id": "monster_1", "position": {"x": 100, "y": 0}}]
    if include_extra_target:
        target_entities.append({"entity_id": "monster_2", "position": {"x": 120, "y": 0}})
    events = SkillRuntime().execute(
        skill,
        source_entity="player_1",
        source_position=Position(0, 0),
        target_entity="monster_1",
        target_position=Position(100, 0),
        timestamp_ms=1,
        target_entities=target_entities,
    )
    return skill, events


def test_lightning_hit_applies_numbed_status_event() -> None:
    _, events = _events_for("active_lightning_shot")
    numbed = [
        event
        for event in events
        if event.type == "status_apply" and event.payload["status_type"] == "numbed"
    ]

    assert numbed
    assert all(event.payload["source_damage_type"] == "lightning" for event in numbed)
    assert all(event.payload["damage_components"]["lightning"] > 0 for event in numbed)


def test_cold_hit_applies_frostbite_status_event_without_duplicate_configured_frostbite() -> None:
    _, events = _events_for("active_ice_shot", include_extra_target=False)
    frostbite = [
        event
        for event in events
        if event.type == "status_apply" and event.payload["status_type"] == "frostbite"
    ]

    assert len(frostbite) == 2
    assert all(event.payload["source_damage_type"] == "cold" for event in frostbite)
    assert all(event.payload["damage_components"]["cold"] > 0 for event in frostbite)


def test_elemental_hit_ailments_are_consumed_as_buffs() -> None:
    _, events = _events_for("active_lightning_shot")
    monster = Monster("monster_1", current_life=1000, max_life=1000, position=Position(100, 0))
    session = CombatSession(
        player=Player("player_1", current_life=100, max_life=100, position=Position(0, 0), item_interaction_reach=1),
        monsters=[monster],
        dropped_gems=[],
        elapsed_ms=0,
        active_skill_instances=(),
        inventory=None,  # type: ignore[arg-type]
        loot_runtime=None,  # type: ignore[arg-type]
    )

    for event in events:
        if event.type == "status_apply" and event.target_entity == "monster_1":
            session._consume_status_event(event)

    assert monster.has_buff("numbed")
