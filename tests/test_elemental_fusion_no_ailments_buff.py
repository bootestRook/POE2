from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from liufang.combat import (
    ELEMENTAL_FUSION_NO_AILMENTS_BUFF,
    BuffState,
    CombatSession,
    Monster,
    Player,
    Position,
)
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
from liufang.skill_runtime import SkillEvent


class _LootRuntimeStub:
    def set_player_stats(self, stats: dict[str, object]) -> None:
        self.player_stats = dict(stats)


def _player() -> Player:
    return Player(
        player_id="player_1",
        current_life=100,
        max_life=100,
        position=Position(0, 0),
        item_interaction_reach=2,
        current_mana=100,
        max_mana=100,
    )


def _status_event(status_type: str, *, source_entity: str = "player_1") -> SkillEvent:
    return SkillEvent(
        event_id=f"test.{status_type}",
        type="status_apply",
        timestamp_ms=0,
        source_entity=source_entity,
        target_entity="monster_1",
        position={"x": 0, "y": 0},
        direction={"x": 1, "y": 0},
        delay_ms=0,
        duration_ms=4000,
        amount=0,
        damage_type="fire",
        skill_instance_id="active",
        vfx_key="",
        sfx_key="",
        reason_key="test",
        payload={
            "status_type": status_type,
            "duration_ms": 4000,
            "base_damage_per_second": 10,
            "skill_id": "active_burning_shot",
            "source_skill_id": "active_burning_shot",
        },
    )


def _session_with_no_ailments_buff() -> CombatSession:
    player = _player()
    player.buffs.append(
        BuffState(
            ELEMENTAL_FUSION_NO_AILMENTS_BUFF,
            remaining_ms=10_000,
            effect_type="prevent_status_application",
        )
    )
    return CombatSession(
        player=player,
        monsters=[Monster("monster_1", current_life=1000, max_life=1000, position=Position(80, 0))],
        dropped_gems=[],
        elapsed_ms=0,
        active_skill_instances=(),
        inventory=GemInventory({}),
        loot_runtime=_LootRuntimeStub(),  # type: ignore[arg-type]
    )


def test_elemental_fusion_buff_blocks_owner_ignite_frostbite_frozen_and_numbed() -> None:
    session = _session_with_no_ailments_buff()

    for status_type in ("ignite", "frostbite", "frozen", "numbed"):
        session._consume_status_event(_status_event(status_type))

    assert session.monsters[0].buffs == []


def test_elemental_fusion_buff_does_not_block_other_statuses() -> None:
    session = _session_with_no_ailments_buff()

    session._consume_status_event(_status_event("shock"))

    assert session.monsters[0].has_buff("shock")


def test_elemental_fusion_support_grants_player_no_ailments_buff_at_combat_start() -> None:
    config_root = ROOT / "configs"
    definitions = load_gem_definitions(config_root)
    inventory = GemInventory(definitions)
    board = SudokuGemBoard(load_board_rules(config_root), inventory)
    active = inventory.add_instance("active", "active_burning_shot", level=20)
    inventory.add_instance("support", "support_elemental_fusion", level=20)
    board.mount_gem(active.instance_id, 0, 0)
    board.mount_gem("support", 0, 1)
    calculator = SkillEffectCalculator(
        board=board,
        definitions=definitions,
        skill_templates=load_skill_templates(config_root),
        relation_coefficients=load_relation_coefficients(config_root),
        scaling_rules=load_skill_scaling_rules(config_root),
        affix_definitions={},
    )

    session = CombatSession.start(
        player=_player(),
        monsters=[Monster("monster_1", current_life=1000, max_life=1000, position=Position(80, 0))],
        inventory=inventory,
        skill_effect_calculator=calculator,
        loot_runtime=_LootRuntimeStub(),  # type: ignore[arg-type]
    )

    assert session.active_skill_instances[0].runtime_params["prevent_elemental_ailments"] is True
    assert session.player.has_buff(ELEMENTAL_FUSION_NO_AILMENTS_BUFF)
    session._consume_status_event(_status_event("ignite"))
    assert not session.monsters[0].has_buff("ignite")
