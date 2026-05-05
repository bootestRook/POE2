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


def _corrosive_events():
    config_root = ROOT / "configs"
    definitions = load_gem_definitions(config_root)
    inventory = GemInventory(definitions)
    board = SudokuGemBoard(load_board_rules(config_root), inventory)
    inventory.add_instance("active", "active_corrosive_shot", level=20)
    board.mount_gem("active", 0, 0)
    calculator = SkillEffectCalculator(
        board=board,
        definitions=definitions,
        skill_templates=load_skill_templates(config_root),
        relation_coefficients=load_relation_coefficients(config_root),
        scaling_rules=load_skill_scaling_rules(config_root),
        affix_definitions={},
    )
    skill = calculator.calculate_all()[0]
    return SkillRuntime().execute(
        skill,
        source_entity="player_1",
        source_position=Position(0, 0),
        target_entity="monster_1",
        target_position=Position(100, 0),
        timestamp_ms=1,
        target_entities=[
            {"entity_id": "monster_1", "position": {"x": 100, "y": 0}},
            {"entity_id": "monster_2", "position": {"x": 120, "y": 0}},
            {"entity_id": "monster_3", "position": {"x": 180, "y": 0}},
        ],
    )


def test_corrosive_damage_taken_increase_uses_40_percent_stable_chance() -> None:
    events = _corrosive_events()
    ground_hits = [
        event
        for event in events
        if event.type == "damage_zone_hit" and event.payload.get("marker_id") == "corrosive_ground_hit"
    ]
    exposure = [
        event
        for event in events
        if event.type == "buff_apply" and event.payload.get("effect_type") == "damage_taken_increase"
    ]

    assert len(ground_hits) == 60
    assert len(exposure) == 20
    assert all(event.payload["chance_percent"] == 40 for event in exposure)
    assert all(event.payload["buff_roll"] < 40 for event in exposure)


def test_chanced_damage_taken_increase_buff_still_scales_matching_skill_damage() -> None:
    exposure = next(
        event
        for event in _corrosive_events()
        if event.type == "buff_apply"
        and event.target_entity == "monster_1"
        and event.payload.get("effect_type") == "damage_taken_increase"
    )
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

    session._consume_buff_event(exposure)
    monster.take_hit_components({"chaos": 10}, source_skill_id="active_corrosive_shot")

    assert monster.current_life == 987
