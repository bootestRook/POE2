from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import liufang.combat as combat
from liufang.combat import BuffState, CombatSession, Monster, Player, Position
from liufang.skill_runtime import SkillEvent


class MonsterDamageTakenTest(unittest.TestCase):
    def test_ailment_state_model_is_removed_from_runtime_storage(self) -> None:
        self.assertFalse(hasattr(combat, "AilmentState"))

    def test_status_apply_event_creates_queryable_monster_buff(self) -> None:
        monster = Monster("monster_1", current_life=1000, max_life=1000, position=Position(0, 0))
        session = CombatSession(
            player=Player("player", current_life=100, max_life=100, position=Position(0, 0), item_interaction_reach=1),
            monsters=[monster],
            dropped_gems=[],
            elapsed_ms=0,
            active_skill_instances=(),
            inventory=None,
            loot_runtime=None,
        )

        session._consume_status_event(
            SkillEvent(
                event_id="event.status",
                type="status_apply",
                timestamp_ms=0,
                source_entity="player",
                target_entity="monster_1",
                position={"x": 0.0, "y": 0.0},
                direction={"x": 1.0, "y": 0.0},
                delay_ms=0,
                duration_ms=2000,
                amount=None,
                damage_type="fire",
                skill_instance_id="active_test_skill",
                vfx_key="",
                sfx_key="",
                reason_key="",
                payload={
                    "skill_id": "active_test_skill",
                    "status_type": "ignite",
                    "duration_ms": 2000,
                    "base_damage_per_second": 25,
                    "source_skill_id": "active_test_skill",
                },
            )
        )

        self.assertTrue(monster.has_buff("ignite"))
        self.assertEqual(monster.buff_damage_per_second("ignite"), 25)
        self.assertIsInstance(monster.buffs[0], BuffState)
        self.assertEqual(monster.buffs[0].buff_type, "ignite")

    def test_status_apply_event_converts_threshold_buff_and_consumes_source_by_default(self) -> None:
        monster = Monster("monster_1", current_life=1000, max_life=1000, position=Position(0, 0))
        session = CombatSession(
            player=Player("player", current_life=100, max_life=100, position=Position(0, 0), item_interaction_reach=1),
            monsters=[monster],
            dropped_gems=[],
            elapsed_ms=0,
            active_skill_instances=(),
            inventory=None,
            loot_runtime=None,
        )

        session._consume_status_event(
            SkillEvent(
                event_id="event.frostbite",
                type="status_apply",
                timestamp_ms=0,
                source_entity="player",
                target_entity="monster_1",
                position={"x": 0.0, "y": 0.0},
                direction={"x": 1.0, "y": 0.0},
                delay_ms=0,
                duration_ms=4000,
                amount=None,
                damage_type="cold",
                skill_instance_id="active_test_skill",
                vfx_key="",
                sfx_key="",
                reason_key="",
                payload={
                    "skill_id": "active_test_skill",
                    "status_type": "frostbite",
                    "duration_ms": 4000,
                    "base_value": 100,
                    "threshold": 100,
                    "conversion_buff_type": "",
                    "source_skill_id": "active_test_skill",
                },
            )
        )

        self.assertFalse(monster.has_buff("frostbite"))
        self.assertTrue(monster.has_buff("frozen"))
        frozen = next(buff for buff in monster.buffs if buff.buff_type == "frozen")
        self.assertIsInstance(frozen, BuffState)
        self.assertEqual(frozen.base_value, 100)

    def test_immediate_status_apply_event_is_consumed_as_buff(self) -> None:
        monster = Monster("monster_1", current_life=1000, max_life=1000, position=Position(0, 0))
        session = CombatSession(
            player=Player("player", current_life=100, max_life=100, position=Position(0, 0), item_interaction_reach=1),
            monsters=[monster],
            dropped_gems=[],
            elapsed_ms=0,
            active_skill_instances=(),
            inventory=None,
            loot_runtime=None,
        )

        session._consume_immediate_skill_events(
            (
                SkillEvent(
                    event_id="event.immediate_status",
                    type="status_apply",
                    timestamp_ms=0,
                    source_entity="player",
                    target_entity="monster_1",
                    position={"x": 0.0, "y": 0.0},
                    direction={"x": 1.0, "y": 0.0},
                    delay_ms=0,
                    duration_ms=4000,
                    amount=None,
                    damage_type="chaos",
                    skill_instance_id="active_test_skill",
                    vfx_key="",
                    sfx_key="",
                    reason_key="",
                    payload={
                        "skill_id": "active_test_skill",
                        "status_type": "aggravation",
                        "duration_ms": 4000,
                        "base_value": 100,
                        "effect_per_stack": 3.5,
                    },
                ),
            )
        )

        self.assertTrue(monster.has_buff("aggravation"))

    def test_damage_taken_increase_effect_can_be_limited_to_matching_skill(self) -> None:
        monster = Monster("monster_1", current_life=1000, max_life=1000, position=Position(0, 0))
        monster.apply_buff(
            {
                "effect_type": "damage_taken_increase",
                "duration_ms": 2000,
                "effect_per_stack": 30,
                "max_stacks": 1,
                "source_skill_id": "active_corrosive_shot",
            }
        )

        monster.take_hit_components({"chaos": 10}, source_skill_id="active_corrosive_shot")
        monster.take_hit_components({"chaos": 10}, source_skill_id="active_other_skill")

        self.assertEqual(monster.current_life, 977)

    def test_buff_apply_event_can_add_enemy_damage_taken_increase_effect(self) -> None:
        monster = Monster("monster_1", current_life=1000, max_life=1000, position=Position(0, 0))
        session = CombatSession(
            player=Player("player", current_life=100, max_life=100, position=Position(0, 0), item_interaction_reach=1),
            monsters=[monster],
            dropped_gems=[],
            elapsed_ms=0,
            active_skill_instances=(),
            inventory=None,
            loot_runtime=None,
        )
        session._consume_buff_event(
            SkillEvent(
                event_id="event.buff",
                type="buff_apply",
                timestamp_ms=0,
                source_entity="player",
                target_entity="monster_1",
                position={"x": 0.0, "y": 0.0},
                direction={"x": 1.0, "y": 0.0},
                delay_ms=0,
                duration_ms=2000,
                amount=None,
                damage_type="chaos",
                skill_instance_id="active_corrosive_shot",
                vfx_key="",
                sfx_key="",
                reason_key="",
                payload={
                    "skill_id": "active_corrosive_shot",
                    "effect_type": "damage_taken_increase",
                    "duration_ms": 2000,
                    "effect_per_stack": 30,
                    "max_stacks": 1,
                    "source_skill_id": "active_corrosive_shot",
                },
            )
        )

        monster.take_hit_components({"chaos": 10}, source_skill_id="active_corrosive_shot")

        self.assertEqual(monster.buffs[0].effect_type, "damage_taken_increase")
        self.assertEqual(monster.buffs[0].buff_type, "")
        self.assertEqual(monster.current_life, 987)

    def test_buff_apply_event_can_add_any_enemy_buff_type(self) -> None:
        monster = Monster("monster_1", current_life=1000, max_life=1000, position=Position(0, 0))
        session = CombatSession(
            player=Player("player", current_life=100, max_life=100, position=Position(0, 0), item_interaction_reach=1),
            monsters=[monster],
            dropped_gems=[],
            elapsed_ms=0,
            active_skill_instances=(),
            inventory=None,
            loot_runtime=None,
        )

        session._consume_buff_event(
            SkillEvent(
                event_id="event.generic_buff",
                type="buff_apply",
                timestamp_ms=0,
                source_entity="player",
                target_entity="monster_1",
                position={"x": 0.0, "y": 0.0},
                direction={"x": 1.0, "y": 0.0},
                delay_ms=0,
                duration_ms=4000,
                amount=None,
                damage_type="fire",
                skill_instance_id="active_test_skill",
                vfx_key="",
                sfx_key="",
                reason_key="",
                payload={
                    "skill_id": "active_test_skill",
                    "buff_type": "ignite",
                    "duration_ms": 4000,
                    "base_damage_per_second": 10,
                },
            )
        )

        self.assertTrue(monster.has_buff("ignite"))
        self.assertEqual(monster.buff_damage_per_second("ignite"), 10)

    def test_damage_event_uses_current_aggravation_for_black_hole_dot_bonus(self) -> None:
        monster = Monster("monster_1", current_life=1000, max_life=1000, position=Position(0, 0))
        monster.apply_buff(
            {
                "status_type": "aggravation",
                "duration_ms": 4000,
                "base_value": 100,
                "effect_per_stack": 3.5,
                "source_skill_id": "active_black_hole",
            }
        )
        session = CombatSession(
            player=Player("player", current_life=100, max_life=100, position=Position(0, 0), item_interaction_reach=1),
            monsters=[monster],
            dropped_gems=[],
            elapsed_ms=0,
            active_skill_instances=(),
            inventory=None,
            loot_runtime=None,
        )

        session._consume_damage_event(
            None,
            SkillEvent(
                event_id="black_hole.damage",
                type="damage",
                timestamp_ms=0,
                source_entity="player",
                target_entity="monster_1",
                position={"x": 0.0, "y": 0.0},
                direction={"x": 0.0, "y": 0.0},
                delay_ms=0,
                duration_ms=0,
                amount=100,
                damage_type="chaos",
                skill_instance_id="active_black_hole",
                vfx_key="",
                sfx_key="",
                reason_key="",
                payload={
                    "skill_id": "active_black_hole",
                    "dot_damage_bonus_per_10_aggravation_percent": 3.5,
                },
            ),
        )

        self.assertEqual(monster.current_life, 865)

    def test_forced_movement_event_moves_monster_to_canonical_destination(self) -> None:
        monster = Monster("monster_1", current_life=1000, max_life=1000, position=Position(100, 0))
        session = CombatSession(
            player=Player("player", current_life=100, max_life=100, position=Position(0, 0), item_interaction_reach=1),
            monsters=[monster],
            dropped_gems=[],
            elapsed_ms=0,
            active_skill_instances=(),
            inventory=None,
            loot_runtime=None,
        )

        session._consume_forced_movement_event(
            SkillEvent(
                event_id="black_hole.pull",
                type="forced_movement",
                timestamp_ms=0,
                source_entity="player",
                target_entity="monster_1",
                position={"x": 76.0, "y": 0.0},
                direction={"x": -1.0, "y": 0.0},
                delay_ms=0,
                duration_ms=0,
                amount=24,
                damage_type="chaos",
                skill_instance_id="active_black_hole",
                vfx_key="",
                sfx_key="",
                reason_key="",
                payload={"destination_world_position": {"x": 76.0, "y": 0.0}},
            )
        )

        self.assertEqual(monster.position, Position(76.0, 0.0))

    def test_pull_to_origin_forced_movement_uses_current_monster_position(self) -> None:
        monster = Monster("monster_1", current_life=1000, max_life=1000, position=Position(100, 0))
        session = CombatSession(
            player=Player("player", current_life=100, max_life=100, position=Position(0, 0), item_interaction_reach=1),
            monsters=[monster],
            dropped_gems=[],
            elapsed_ms=0,
            active_skill_instances=(),
            inventory=None,
            loot_runtime=None,
        )
        event = SkillEvent(
            event_id="black_hole.pull",
            type="forced_movement",
            timestamp_ms=0,
            source_entity="player",
            target_entity="monster_1",
            position={"x": 76.0, "y": 0.0},
            direction={"x": -1.0, "y": 0.0},
            delay_ms=0,
            duration_ms=0,
            amount=48,
            damage_type="chaos",
            skill_instance_id="active_black_hole",
            vfx_key="",
            sfx_key="",
            reason_key="",
            payload={
                "movement_policy": "pull_to_origin",
                "movement_distance": 48,
                "origin_world_position": {"x": 0.0, "y": 0.0},
                "destination_world_position": {"x": 76.0, "y": 0.0},
            },
        )

        session._consume_forced_movement_event(event)
        self.assertEqual(monster.position, Position(52.0, 0.0))

        session._consume_forced_movement_event(event)
        self.assertEqual(monster.position, Position(4.0, 0.0))

    def test_damage_zone_pull_event_moves_current_monsters_inside_area(self) -> None:
        inside = Monster("monster_inside", current_life=1000, max_life=1000, position=Position(100, 0))
        outside = Monster("monster_outside", current_life=1000, max_life=1000, position=Position(500, 0))
        session = CombatSession(
            player=Player("player", current_life=100, max_life=100, position=Position(0, 0), item_interaction_reach=1),
            monsters=[inside, outside],
            dropped_gems=[],
            elapsed_ms=0,
            active_skill_instances=(),
            inventory=None,
            loot_runtime=None,
        )

        session._consume_forced_movement_event(
            SkillEvent(
                event_id="black_hole.area_pull",
                type="forced_movement",
                timestamp_ms=0,
                source_entity="player",
                target_entity="",
                position={"x": 0.0, "y": 0.0},
                direction={"x": 0.0, "y": 0.0},
                delay_ms=0,
                duration_ms=0,
                amount=24,
                damage_type="chaos",
                skill_instance_id="active_black_hole",
                vfx_key="",
                sfx_key="",
                reason_key="",
                payload={
                    "movement_policy": "pull_to_origin",
                    "movement_scope": "damage_zone",
                    "movement_distance": 24,
                    "origin_world_position": {"x": 0.0, "y": 0.0},
                    "radius": 220,
                },
            )
        )

        self.assertEqual(inside.position, Position(76.0, 0.0))
        self.assertEqual(outside.position, Position(500, 0))


if __name__ == "__main__":
    unittest.main()
