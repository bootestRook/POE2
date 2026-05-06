from __future__ import annotations

import sys
import unittest
from copy import deepcopy
from dataclasses import replace
from math import atan2, cos, degrees, hypot, sin
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from liufang.combat import Position
from liufang.config import (
    load_affix_definitions,
    load_board_rules,
    load_gem_definitions,
    load_relation_coefficients,
    load_skill_scaling_rules,
    load_skill_templates,
)
from liufang.gem_board import SudokuGemBoard
from liufang.inventory import GemInventory
from liufang.skill_effects import SkillEffectCalculator
from liufang.skill_runtime import SkillRuntime, tick_schedule


OBSOLETE_GEM_IDS = frozenset(
    {
        "active_fire_bolt",
        "active_frost_nova",
        "active_fungal_petards",
        "active_ice_shards",
        "active_lava_orb",
        "active_lightning_chain",
        "active_penetrating_shot",
        "active_puncture",
    }
)


class SkillRuntimeTest(unittest.TestCase):
    def setUp(self) -> None:
        self.config_root = ROOT / "configs"
        self.definitions = load_gem_definitions(self.config_root)
        self.inventory = GemInventory(self.definitions)
        self._skip_missing_obsolete_gems()
        self.board = SudokuGemBoard(load_board_rules(self.config_root), self.inventory)
        self.calculator = SkillEffectCalculator(
            board=self.board,
            definitions=self.definitions,
            skill_templates=load_skill_templates(self.config_root),
            relation_coefficients=load_relation_coefficients(self.config_root),
            scaling_rules=load_skill_scaling_rules(self.config_root),
            affix_definitions={
                definition.affix_id: definition
                for definition in load_affix_definitions(self.config_root)
            },
        )

    def _skip_missing_obsolete_gems(self) -> None:
        add_instance = self.inventory.add_instance

        def add_instance_or_skip(instance_id: str, base_gem_id: str, *args: object, **kwargs: object) -> object:
            if base_gem_id in OBSOLETE_GEM_IDS and base_gem_id not in self.definitions:
                self.skipTest(f"obsolete gem definition removed: {base_gem_id}")
            return add_instance(instance_id, base_gem_id, *args, **kwargs)

        self.inventory.add_instance = add_instance_or_skip  # type: ignore[method-assign]

    def test_fire_bolt_projectile_outputs_required_skill_events(self) -> None:
        self.inventory.add_instance("active", "active_fire_bolt")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]

        events = SkillRuntime().execute(
            final_skill,
            source_entity="player_1",
            source_position=Position(0, 0),
            target_entity="monster_1",
            target_position=Position(100, 0),
            timestamp_ms=10,
        )

        expected_spawn_count = final_skill.projectile_count
        event_types = [event.type for event in events]
        self.assertEqual(event_types.count("projectile_spawn"), expected_spawn_count)
        self.assertIn("damage", event_types)
        self.assertIn("hit_vfx", event_types)
        self.assertIn("floating_text", event_types)
        spawn_events = [event for event in events if event.type == "projectile_spawn"]
        spawn = spawn_events[0]
        impact_events = [event for event in events if event.type in {"damage", "hit_vfx", "floating_text"}]
        damage = next(event for event in events if event.type == "damage")
        hit_vfx = next(event for event in events if event.type == "hit_vfx")
        floating_text = next(event for event in events if event.type == "floating_text")
        runtime_params = final_skill.runtime_params or {}
        projectile_speed = max(1.0, float(runtime_params.get("projectile_speed", 720.0)))
        burst_interval_ms = max(0, int(runtime_params.get("burst_interval_ms", 0)))
        spread_angle_deg = max(0.0, float(runtime_params.get("spread_angle_deg", 0.0)))
        spawn_offset = runtime_params.get("spawn_offset", {})
        spawn_position = {"x": float(spawn_offset.get("x", 0.0)), "y": float(spawn_offset.get("y", 0.0))}
        expected_distance = hypot(100.0 - spawn_position["x"], 0.0 - spawn_position["y"])
        expected_duration_ms = round(expected_distance / projectile_speed * 1000)
        expected_duration_ms = max(
            int(runtime_params.get("min_duration_ms", 0)),
            min(expected_duration_ms, int(runtime_params.get("max_duration_ms", 1000))),
        )
        self.assertEqual(spawn.position, spawn_position)
        self.assertEqual(spawn.payload["spawn_world_position"], spawn_position)
        self.assertEqual(spawn.payload["vfx_spawn_world_position"], spawn_position)
        self.assertEqual(spawn.payload["direction_world"], spawn.direction)
        self.assertEqual(spawn.payload["vfx_direction_world"], spawn.direction)
        self.assertAlmostEqual(
            hypot(spawn.payload["velocity_world"]["x"], spawn.payload["velocity_world"]["y"]),
            projectile_speed,
            places=6,
        )
        self.assertEqual(spawn.payload["projectile_count"], expected_spawn_count)
        if expected_spawn_count > 1:
            self.assertEqual(spawn_events[1].delay_ms, burst_interval_ms)
            if spread_angle_deg > 0:
                self.assertNotEqual(spawn.payload["end_position"], {"x": 100.0, "y": 0.0})
                self.assertNotEqual(spawn_events[0].direction, spawn_events[1].direction)
                first_projectile_damage = next(
                    event for event in impact_events
                    if event.type == "damage" and event.payload["projectile_index"] == spawn.payload["projectile_index"]
                )
                self.assertAlmostEqual(first_projectile_damage.position["x"], spawn.payload["end_position"]["x"])
                self.assertAlmostEqual(first_projectile_damage.position["y"], spawn.payload["end_position"]["y"])
                self.assertEqual(first_projectile_damage.payload["impact_world_position"], first_projectile_damage.position)
            self.assertEqual(spawn.payload["spread_angle_deg"], spread_angle_deg)
            last_projectile_impacts = [
                event for event in impact_events
                if event.payload["projectile_index"] == expected_spawn_count
            ]
            self.assertTrue(last_projectile_impacts)
            self.assertEqual(last_projectile_impacts[0].delay_ms, expected_duration_ms + burst_interval_ms * (expected_spawn_count - 1))
        else:
            self.assertEqual(spawn.payload["end_position"], {"x": 100.0, "y": 0.0})
        self.assertEqual(spawn.duration_ms, expected_duration_ms)
        self.assertEqual(spawn.payload["lifetime_ms"], expected_duration_ms)
        self.assertEqual(spawn.payload["expire_time_ms"], 10 + expected_duration_ms)
        self.assertEqual(spawn.payload["expire_world_position"], spawn.payload["end_position"])
        self.assertEqual(damage.delay_ms, spawn.duration_ms)
        self.assertEqual(damage.timestamp_ms, 10 + expected_duration_ms)
        self.assertEqual(damage.target_entity, "monster_1")
        self.assertEqual(damage.amount, final_skill.final_damage)
        self.assertEqual(damage.damage_type, "fire")
        self.assertEqual(damage.reason_key, "skill_event.fire_bolt.damage_reason")
        self.assertEqual(hit_vfx.delay_ms, damage.delay_ms)
        self.assertEqual(floating_text.delay_ms, damage.delay_ms)
        self.assertIn("火焰伤害", floating_text.payload["text"])


    def test_projectile_end_cap_counts_collision_radius_for_hits(self) -> None:
        self.inventory.add_instance("active", "active_burning_shot")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]
        runtime_params = deepcopy(final_skill.runtime_params or {})
        runtime_params["target_policy"] = "nearest_enemy"
        final_skill = replace(final_skill, runtime_params=runtime_params)

        events = SkillRuntime().execute(
            final_skill,
            source_entity="player_1",
            source_position=Position(0, 0),
            target_entity="monster_1",
            target_position=Position(441, -20),
            timestamp_ms=10,
            target_entities=(
                {"entity_id": "monster_1", "position": {"x": 441, "y": -20}},
            ),
        )

        spawn = next(event for event in events if event.type == "projectile_spawn")
        hit = next(event for event in events if event.type == "projectile_hit")
        damage = next(event for event in events if event.type == "damage")

        self.assertEqual(hit.target_entity, "monster_1")
        self.assertEqual(damage.target_entity, "monster_1")
        self.assertFalse(hit.payload["projectile_continues"])
        self.assertEqual(hit.payload["pierce_remaining"], 0)
        self.assertAlmostEqual(hit.position["x"], spawn.payload["expire_world_position"]["x"])
        self.assertAlmostEqual(hit.position["y"], spawn.payload["expire_world_position"]["y"])

    def test_fire_bolt_projectile_alignment_payload_covers_eight_directions(self) -> None:
        self.inventory.add_instance("active", "active_fire_bolt")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]
        runtime_params = final_skill.runtime_params or {}
        runtime_params = {**runtime_params, "projectile_count": 1, "spread_angle_deg": 0}
        final_skill = replace(final_skill, projectile_count=1, runtime_params=runtime_params)
        spawn_offset = runtime_params.get("spawn_offset", {})
        spawn_position = {"x": float(spawn_offset.get("x", 0.0)), "y": float(spawn_offset.get("y", 0.0))}
        directions = [
            (1, 0),
            (-1, 0),
            (0, 1),
            (0, -1),
            (1, 1),
            (1, -1),
            (-1, 1),
            (-1, -1),
        ]

        for dx, dy in directions:
            with self.subTest(direction=(dx, dy)):
                length = hypot(dx, dy)
                expected_direction = {"x": dx / length, "y": dy / length}
                target = Position(
                    spawn_position["x"] + expected_direction["x"] * 100,
                    spawn_position["y"] + expected_direction["y"] * 100,
                )
                events = SkillRuntime().execute(
                    final_skill,
                    source_entity="player_1",
                    source_position=Position(0, 0),
                    target_entity="monster_1",
                    target_position=target,
                    timestamp_ms=10,
                )

                spawn = [event for event in events if event.type == "projectile_spawn"][0]
                hit_vfx = [event for event in events if event.type == "hit_vfx"][0]
                self.assertEqual(spawn.position, spawn_position)
                self.assertEqual(spawn.payload["spawn_world_position"], spawn_position)
                self.assertEqual(spawn.payload["vfx_spawn_world_position"], spawn_position)
                self.assertAlmostEqual(spawn.direction["x"], expected_direction["x"])
                self.assertAlmostEqual(spawn.direction["y"], expected_direction["y"])
                self.assertEqual(spawn.payload["direction_world"], spawn.direction)
                self.assertEqual(spawn.payload["vfx_direction_world"], spawn.direction)
                self.assertEqual(hit_vfx.position, {"x": target.x, "y": target.y})
                self.assertEqual(hit_vfx.payload["impact_world_position"], hit_vfx.position)

    def test_fire_bolt_projectile_multi_target_runtime_respects_pierce_and_projectile_count(self) -> None:
        self.inventory.add_instance("active", "active_fire_bolt")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]
        runtime_params = dict(final_skill.runtime_params or {})
        runtime_params["projectile_count"] = 2
        runtime_params["spread_angle_deg"] = 0
        runtime_params["hit_policy"] = "pierce"
        runtime_params["pierce_count"] = 1
        final_skill = final_skill.__class__(
            **{**final_skill.__dict__, "projectile_count": 2, "runtime_params": runtime_params}
        )

        events = SkillRuntime().execute(
            final_skill,
            source_entity="player_1",
            source_position=Position(0, 0),
            target_entity="monster_1",
            target_position=Position(100, 0),
            timestamp_ms=10,
            target_entities=[
                {"entity_id": "monster_1", "position": {"x": 100, "y": 0}},
                {"entity_id": "monster_2", "position": {"x": 160, "y": 0}},
            ],
        )

        damage_events = [event for event in events if event.type == "damage"]
        spawn_events = [event for event in events if event.type == "projectile_spawn"]
        self.assertEqual(len(spawn_events), 2)
        self.assertEqual(len(damage_events), 4)
        self.assertEqual({event.target_entity for event in damage_events}, {"monster_1", "monster_2"})

    def test_projectile_with_zero_pierce_stops_on_first_hit_even_with_pierce_policy(self) -> None:
        self.inventory.add_instance("active", "active_fire_bolt")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]
        runtime_params = {
            **(final_skill.runtime_params or {}),
            "projectile_count": 1,
            "spread_angle_deg": 0,
            "hit_policy": "pierce",
            "pierce_count": 0,
            "max_distance": 520,
        }
        final_skill = replace(final_skill, projectile_count=1, runtime_params=runtime_params)

        events = SkillRuntime().execute(
            final_skill,
            source_entity="player_1",
            source_position=Position(0, 0),
            target_entity="monster_1",
            target_position=Position(100, 0),
            timestamp_ms=10,
            target_entities=[
                {"entity_id": "monster_1", "position": {"x": 100, "y": 0}},
                {"entity_id": "monster_2", "position": {"x": 160, "y": 0}},
            ],
        )

        spawn = next(event for event in events if event.type == "projectile_spawn")
        hit = next(event for event in events if event.type == "projectile_hit")
        damage_events = [event for event in events if event.type == "damage"]

        self.assertEqual(len(damage_events), 1)
        self.assertEqual(damage_events[0].target_entity, "monster_1")
        self.assertAlmostEqual(spawn.payload["end_position"]["x"], hit.position["x"])
        self.assertAlmostEqual(spawn.payload["end_position"]["y"], hit.position["y"])
        self.assertAlmostEqual(spawn.payload["expire_world_position"]["x"], hit.position["x"])
        self.assertAlmostEqual(spawn.payload["expire_world_position"]["y"], hit.position["y"])
        self.assertFalse(hit.payload["projectile_continues"])
        self.assertEqual(hit.payload["impact_kind"], "projectile_final_impact")
        self.assertEqual(hit.payload["pierce_remaining"], 0)

    def test_split_firebolt_fissions_three_small_projectiles_on_hit(self) -> None:
        self.inventory.add_instance("active", "active_split_firebolt")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]
        runtime_params = {
            **(final_skill.runtime_params or {}),
            "spawn_offset": {"x": 0, "y": 0},
            "projectile_count": 1,
            "spread_angle_deg": 0,
            "pierce_count": 0,
            "hit_policy": "first_hit",
            "split_projectile_count": 3,
            "split_projectile_angle_step_deg": 25,
            "split_projectile_damage_multiplier": 0.5,
            "split_projectile_pierce_count": 1,
            "split_projectile_speed": 620,
            "split_projectile_max_distance": 240,
            "split_projectile_collision_radius": 10,
        }
        final_skill = replace(final_skill, projectile_count=1, runtime_params=runtime_params)
        center_hit = {"x": 100.0, "y": 0.0}
        child_targets = []
        for index, angle in enumerate((-25.0, 0.0, 25.0), start=1):
            radians = angle * 3.141592653589793 / 180.0
            child_targets.append(
                {
                    "entity_id": f"split_target_{index}",
                    "position": {"x": center_hit["x"] + 120.0 * cos(radians), "y": 120.0 * sin(radians)},
                }
            )

        events = SkillRuntime().execute(
            final_skill,
            source_entity="player_1",
            source_position=Position(0, 0),
            target_entity="monster_1",
            target_position=Position(100, 0),
            timestamp_ms=10,
            target_entities=[
                {"entity_id": "monster_1", "position": center_hit},
                *child_targets,
            ],
        )

        parent_hit = next(
            event
            for event in events
            if event.type == "projectile_hit" and not event.payload.get("split_projectile")
        )
        split_spawns = [
            event
            for event in events
            if event.type == "projectile_spawn" and event.payload.get("split_projectile")
        ]
        split_damage = sorted(
            (event for event in events if event.type == "damage" and event.payload.get("split_projectile")),
            key=lambda event: event.payload["split_projectile_index"],
        )

        self.assertEqual(len(split_spawns), 3)
        self.assertEqual(len(split_damage), 3)
        self.assertEqual([event.payload["local_spread_angle"] for event in split_spawns], [-25.0, 0.0, 25.0])
        self.assertTrue(all(event.position == parent_hit.position for event in split_spawns))
        self.assertTrue(all(event.payload["trigger_event_id"] == parent_hit.event_id for event in split_spawns))
        self.assertTrue(all(event.payload["parent_projectile_id"] == parent_hit.payload["projectile_id"] for event in split_spawns))
        self.assertTrue(all(event.payload["pierce_count"] == 1 for event in split_spawns))
        self.assertEqual({event.target_entity for event in split_damage}, {"split_target_1", "split_target_2", "split_target_3"})
        self.assertTrue(all(event.amount == final_skill.final_damage * 0.5 for event in split_damage))

    def test_projectile_split_support_adds_two_splits_when_release_roll_succeeds(self) -> None:
        self.inventory.add_instance("active", "active_burning_shot")
        self.inventory.add_instance("support", "support_projectile_split")
        self.board.mount_gem("active", 0, 0)
        self.board.mount_gem("support", 0, 2)
        final_skill = self.calculator.calculate_all()[0]

        self.assertEqual(final_skill.runtime_params["split_projectile_chance_percent"], 50.0)
        self.assertEqual(final_skill.runtime_params["split_projectile_count_add"], 2)
        self.assertEqual(final_skill.runtime_params["split_projectile_damage_multiplier"], 1.0)

        events = SkillRuntime().execute(
            final_skill,
            source_entity="player_1",
            source_position=Position(0, 0),
            target_entity="monster_1",
            target_position=Position(100, 0),
            timestamp_ms=3,
            target_entities=[{"entity_id": "monster_1", "position": {"x": 100.0, "y": 0.0}}],
        )

        split_spawns = [
            event
            for event in events
            if event.type == "projectile_spawn" and event.payload.get("split_projectile")
        ]

        self.assertEqual(len(split_spawns), 2)
        self.assertTrue(all(event.payload["split_projectile_base_count"] == 0 for event in split_spawns))
        self.assertTrue(all(event.payload["split_projectile_count_add"] == 2 for event in split_spawns))
        self.assertTrue(all(event.payload["split_projectile_chance_percent"] == 50.0 for event in split_spawns))
        self.assertTrue(all(event.payload["split_projectile_roll"] == 28.69 for event in split_spawns))
        self.assertTrue(all(event.payload["split_projectile_chance_triggered"] for event in split_spawns))

    def test_projectile_split_support_adds_no_splits_when_release_roll_fails(self) -> None:
        self.inventory.add_instance("active", "active_burning_shot")
        self.inventory.add_instance("support", "support_projectile_split")
        self.board.mount_gem("active", 0, 0)
        self.board.mount_gem("support", 0, 2)
        final_skill = self.calculator.calculate_all()[0]

        events = SkillRuntime().execute(
            final_skill,
            source_entity="player_1",
            source_position=Position(0, 0),
            target_entity="monster_1",
            target_position=Position(100, 0),
            timestamp_ms=1,
            target_entities=[{"entity_id": "monster_1", "position": {"x": 100.0, "y": 0.0}}],
        )

        self.assertFalse(
            any(event.type == "projectile_spawn" and event.payload.get("split_projectile") for event in events)
        )

    def test_jump_support_bounces_straight_projectile_to_nearby_targets(self) -> None:
        self.inventory.add_instance("active", "active_burning_shot")
        self.inventory.add_instance("support", "support_jump")
        self.board.mount_gem("active", 0, 0)
        self.board.mount_gem("support", 0, 2)
        final_skill = self.calculator.calculate_all()[0]

        self.assertEqual(final_skill.runtime_params["bounce_count"], 2)
        self.assertNotIn("chain_count", final_skill.skill_stats)

        events = SkillRuntime().execute(
            final_skill,
            source_entity="player_1",
            source_position=Position(0, 0),
            target_entity="monster_1",
            target_position=Position(100, 0),
            timestamp_ms=10,
            target_entities=[
                {"entity_id": "monster_1", "position": {"x": 100.0, "y": 0.0}},
                {"entity_id": "monster_2", "position": {"x": 175.0, "y": 0.0}},
                {"entity_id": "monster_3", "position": {"x": 250.0, "y": 0.0}},
            ],
        )

        bounce_spawns = [
            event
            for event in events
            if event.type == "projectile_spawn" and event.payload.get("bounce_projectile")
        ]
        bounce_damage = [
            event
            for event in events
            if event.type == "damage" and event.payload.get("bounce_projectile")
        ]

        self.assertEqual([event.target_entity for event in bounce_spawns], ["monster_2", "monster_3"])
        self.assertEqual([event.target_entity for event in bounce_damage], ["monster_2", "monster_3"])
        self.assertEqual([event.payload["bounce_index"] for event in bounce_spawns], [1, 2])
        self.assertEqual([event.payload["impact_kind"] for event in bounce_spawns], ["projectile_bounce_continue", "projectile_bounce_final"])

    def test_jump_support_adds_bounce_count_to_chain_skills(self) -> None:
        self.inventory.add_instance("active", "active_chain_lightning")
        self.inventory.add_instance("support", "support_jump")
        self.board.mount_gem("active", 0, 0)
        self.board.mount_gem("support", 0, 2)

        final_skill = self.calculator.calculate_all()[0]

        self.assertEqual(final_skill.skill_stats["bounce_count_add"], 2)
        self.assertEqual(final_skill.runtime_params["chain_count"], 5)
        self.assertEqual(final_skill.runtime_params["max_targets"], 6)

    def test_fire_bolt_projectile_respects_angle_step(self) -> None:
        self.inventory.add_instance("active", "active_fire_bolt")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]
        runtime_params = {
            **(final_skill.runtime_params or {}),
            "projectile_count": 3,
            "spread_angle_deg": 60,
            "angle_step": 15,
        }
        final_skill = replace(final_skill, projectile_count=3, runtime_params=runtime_params)

        events = SkillRuntime().execute(
            final_skill,
            source_entity="player_1",
            source_position=Position(0, 0),
            target_entity="monster_1",
            target_position=Position(100, 0),
            timestamp_ms=10,
        )

        spawn_events = [event for event in events if event.type == "projectile_spawn"]

        self.assertEqual([event.payload["local_spread_angle"] for event in spawn_events], [-15.0, 0.0, 15.0])
        self.assertEqual([event.payload["angle_step"] for event in spawn_events], [15.0, 15.0, 15.0])

    def test_chromatic_shot_targets_nearest_unique_enemies_first(self) -> None:
        self.inventory.add_instance("active", "active_chromatic_shot")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]
        runtime_params = {
            **(final_skill.runtime_params or {}),
            "projectile_count": 3,
            "burst_interval_ms": 100,
            "spread_angle_deg": 24,
            "random_angle_jitter_deg": 8,
            "target_policy": "nearest_unique_enemy",
            "spawn_offset": {"x": 0, "y": 0},
        }
        final_skill = replace(final_skill, projectile_count=3, runtime_params=runtime_params)

        events = SkillRuntime().execute(
            final_skill,
            source_entity="player_1",
            source_position=Position(0, 0),
            target_entity="initial",
            target_position=Position(240, 80),
            timestamp_ms=10,
            target_entities=[
                {"entity_id": "far", "position": {"x": 300, "y": -60}},
                {"entity_id": "side", "position": {"x": 180, "y": 90}},
                {"entity_id": "near", "position": {"x": 80, "y": 0}},
            ],
        )

        spawn_events = [event for event in events if event.type == "projectile_spawn"]
        damage_events = sorted(
            (event for event in events if event.type == "damage"),
            key=lambda event: event.payload["projectile_index"],
        )

        self.assertEqual(len(spawn_events), 3)
        self.assertEqual(len(damage_events), 3)
        self.assertEqual([event.delay_ms for event in spawn_events], [0, 100, 200])
        self.assertEqual([event.position for event in spawn_events], [{"x": 0.0, "y": 0.0}] * 3)
        self.assertEqual([event.target_entity for event in spawn_events], ["near", "side", "far"])
        self.assertEqual([event.target_entity for event in spawn_events], [event.target_entity for event in damage_events])
        self.assertTrue(all(event.payload["target_policy"] == "nearest_unique_enemy" for event in spawn_events))
        self.assertTrue(all(event.payload["spawn_policy"] == "caster_current_position" for event in spawn_events))
        self.assertTrue(all(event.payload["vfx_spawn_policy"] == "caster_current_position" for event in spawn_events))
        self.assertTrue(all(event.payload["random_angle_jitter_deg"] == 8 for event in spawn_events))
        self.assertTrue(all(event.payload["hit_world_position"] == event.payload["target_world_position"] for event in damage_events))

    def test_player_projectile_vfx_spawn_policy_anchors_to_caster_for_selected_targets(self) -> None:
        self.inventory.add_instance("active", "active_burning_shot")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]
        runtime_params = {**(final_skill.runtime_params or {}), "target_policy": "target_position"}
        final_skill = replace(final_skill, runtime_params=runtime_params)

        events = SkillRuntime().execute(
            final_skill,
            source_entity="player",
            source_position=Position(100, 50),
            target_entity="dummy",
            target_position=Position(360, 50),
            timestamp_ms=10,
            target_entities=[{"entity_id": "dummy", "position": {"x": 360, "y": 50}}],
        )

        spawn = next(event for event in events if event.type == "projectile_spawn")
        self.assertEqual(spawn.payload["spawn_policy"], "caster_current_position")
        self.assertEqual(spawn.payload["vfx_spawn_policy"], "caster_current_position")
        self.assertEqual(spawn.payload["spawn_world_position"], spawn.position)

    def test_chromatic_shot_forces_one_element_and_shotgun_falloff_per_release(self) -> None:
        self.inventory.add_instance("active", "active_chromatic_shot")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]
        runtime_params = {
            **(final_skill.runtime_params or {}),
            "projectile_count": 3,
            "burst_interval_ms": 0,
            "random_angle_jitter_deg": 0,
            "target_policy": "random_enemy",
            "forced_element_types": ["fire", "cold", "lightning"],
            "allow_same_target_projectile_hits": True,
            "shotgun_falloff_coeff": 0.7,
        }
        final_skill = replace(final_skill, projectile_count=3, runtime_params=runtime_params)

        events = SkillRuntime().execute(
            final_skill,
            source_entity="player_1",
            source_position=Position(0, 0),
            target_entity="near",
            target_position=Position(80, 0),
            timestamp_ms=10,
            target_entities=[
                {"entity_id": "near", "position": {"x": 80, "y": 0}},
            ],
        )

        damage_events = sorted(
            (event for event in events if event.type == "damage"),
            key=lambda event: event.payload["projectile_index"],
        )
        chosen_types = {event.damage_type for event in damage_events}

        self.assertEqual(len(damage_events), 3)
        self.assertEqual(len(chosen_types), 1)
        self.assertTrue(chosen_types.issubset({"fire", "cold", "lightning"}))
        self.assertEqual(
            {event.damage_type for event in events if event.type in {"projectile_hit", "hit_vfx", "floating_text"}},
            chosen_types,
        )
        self.assertEqual([event.payload["same_target_hit_sequence"] for event in damage_events], [0, 1, 2])
        self.assertEqual([event.payload["shotgun_falloff_coeff"] for event in damage_events], [0.7, 0.7, 0.7])
        self.assertAlmostEqual(damage_events[0].amount, final_skill.final_damage)
        self.assertAlmostEqual(damage_events[1].amount, final_skill.final_damage * 0.3)
        self.assertAlmostEqual(damage_events[2].amount, final_skill.final_damage * 0.3)
        for event in damage_events:
            self.assertEqual(event.payload["forced_element_type"], event.damage_type)
            self.assertEqual(event.payload["damage_components"], {event.damage_type: round(event.amount or 0, 6)})

    def test_chromatic_shot_varies_forced_element_across_releases(self) -> None:
        self.inventory.add_instance("active", "active_chromatic_shot")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]
        final_skill = replace(
            final_skill,
            runtime_params={
                **(final_skill.runtime_params or {}),
                "projectile_count": 3,
                "burst_interval_ms": 0,
                "forced_element_types": ["fire", "cold", "lightning"],
            },
        )

        chosen_types: set[str] = set()
        for timestamp_ms in range(0, 650 * 12, 650):
            events = SkillRuntime().execute(
                final_skill,
                source_entity="player_1",
                source_position=Position(0, 0),
                target_entity="near",
                target_position=Position(80, 0),
                timestamp_ms=timestamp_ms,
                target_entities=[
                    {"entity_id": "near", "position": {"x": 80, "y": 0}},
                ],
            )
            damage_events = [event for event in events if event.type == "damage"]
            release_types = {event.damage_type for event in damage_events}

            self.assertEqual(len(release_types), 1)
            chosen_types.update(release_types)

        self.assertEqual(chosen_types, {"fire", "cold", "lightning"})

    def test_penetrating_shot_uses_projectile_params_and_pierces_targets(self) -> None:
        self.inventory.add_instance("active", "active_penetrating_shot")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]

        events = SkillRuntime().execute(
            final_skill,
            source_entity="player_1",
            source_position=Position(0, 0),
            target_entity="monster_1",
            target_position=Position(120, 0),
            timestamp_ms=10,
            target_entities=[
                {"entity_id": "monster_1", "position": {"x": 120, "y": -18}},
                {"entity_id": "monster_2", "position": {"x": 240, "y": -18}},
                {"entity_id": "monster_3", "position": {"x": 360, "y": -18}},
            ],
        )

        spawn_events = [event for event in events if event.type == "projectile_spawn"]
        hit_events = [event for event in events if event.type == "projectile_hit"]
        damage_events = [event for event in events if event.type == "damage"]

        self.assertEqual(final_skill.skill_package_id, "active_penetrating_shot")
        self.assertEqual(final_skill.behavior_template, "projectile")
        self.assertEqual(final_skill.runtime_params["hit_policy"], "pierce")
        self.assertEqual(final_skill.runtime_params["spread_angle_deg"], 0)
        self.assertEqual(final_skill.runtime_params["angle_step"], 0)
        self.assertEqual(len(spawn_events), 1)
        self.assertEqual(len(hit_events), 3)
        self.assertEqual(len(damage_events), 3)
        self.assertEqual({event.target_entity for event in damage_events}, {"monster_1", "monster_2", "monster_3"})
        self.assertTrue(all(event.damage_type == "physical" for event in damage_events))
        self.assertTrue(all(event.payload["hit_policy"] == "pierce" for event in damage_events))
        self.assertTrue(all(event.delay_ms > 0 for event in damage_events))
        self.assertEqual(spawn_events[0].payload["skill_id"], "active_penetrating_shot")
        self.assertEqual(spawn_events[0].payload["vfx_spawn_world_position"], spawn_events[0].payload["spawn_world_position"])
        self.assertEqual(spawn_events[0].payload["vfx_direction_world"], spawn_events[0].payload["direction_world"])
        self.assertEqual(spawn_events[0].payload["projectile_speed"], final_skill.runtime_params["projectile_speed"])
        self.assertEqual(spawn_events[0].payload["pierce_remaining"], final_skill.runtime_params["pierce_count"])
        self.assertEqual([event.payload["pierce_remaining"] for event in hit_events], [3, 2, 1])
        self.assertTrue(all(event.payload["impact_kind"] == "projectile_hit_continue" for event in hit_events))
        self.assertTrue(all(event.payload["projectile_continues"] for event in hit_events))
        self.assertTrue(all(event.payload["hit_world_position"] == event.position for event in hit_events))

    def test_fungal_petards_module_chain_triggers_damage_zone_after_projectile_impact(self) -> None:
        self.inventory.add_instance("active", "active_fungal_petards")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]

        events = SkillRuntime().execute(
            final_skill,
            source_entity="player_1",
            source_position=Position(0, 0),
            target_entity="monster_1",
            target_position=Position(360, -12),
            timestamp_ms=100,
            target_entities=[
                {"entity_id": "monster_1", "position": {"x": 360, "y": -12}},
                {"entity_id": "monster_2", "position": {"x": 430, "y": -12}},
                {"entity_id": "monster_3", "position": {"x": 620, "y": -12}},
            ],
        )

        by_type = {event.type: event for event in events}
        damage_events = [event for event in events if event.type == "damage"]
        self.assertEqual(final_skill.behavior_template, "module_chain")
        for event_type in ("cast_start", "projectile_spawn", "projectile_impact", "damage_zone_prime", "damage_zone", "damage", "hit_vfx", "floating_text"):
            self.assertIn(event_type, by_type)
        spawn = by_type["projectile_spawn"]
        impact = by_type["projectile_impact"]
        prime = by_type["damage_zone_prime"]
        zone = by_type["damage_zone"]
        self.assertEqual(spawn.payload["trajectory"], "ballistic")
        self.assertEqual(spawn.payload["travel_time_ms"], 620)
        self.assertEqual(spawn.payload["arc_height"], 220)
        self.assertEqual(spawn.payload["impact_marker_id"], "fungal_impact")
        self.assertEqual(impact.payload["marker_id"], "fungal_impact")
        self.assertEqual(impact.payload["impact_position"], {"x": 360.0, "y": -12.0})
        self.assertEqual(prime.payload["trigger_marker_id"], "fungal_impact")
        self.assertEqual(prime.payload["delay_ms"], 320)
        self.assertEqual(zone.payload["shape"], "circle")
        self.assertEqual(zone.payload["origin"], impact.payload["impact_position"])
        self.assertEqual(zone.payload["radius"], 150)
        self.assertEqual(zone.timestamp_ms, impact.timestamp_ms + 320)
        self.assertTrue(all(event.timestamp_ms >= zone.timestamp_ms for event in damage_events))
        self.assertEqual({event.target_entity for event in damage_events}, {"monster_1", "monster_2"})
        self.assertTrue(all(event.damage_type == "physical" for event in damage_events))

    def test_fungal_petards_module_chain_parameters_affect_runtime_events(self) -> None:
        self.inventory.add_instance("active", "active_fungal_petards")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]
        runtime_params = dict(final_skill.runtime_params or {})
        modules = deepcopy(runtime_params["modules"])
        modules[0]["params"]["travel_time_ms"] = 920
        modules[0]["params"]["arc_height"] = 320
        modules[1]["trigger"]["trigger_delay_ms"] = 150
        modules[1]["params"]["radius"] = 50
        final_skill = replace(final_skill, runtime_params={**runtime_params, "modules": modules})

        events = SkillRuntime().execute(
            final_skill,
            source_entity="player_1",
            source_position=Position(0, 0),
            target_entity="monster_1",
            target_position=Position(360, -12),
            timestamp_ms=100,
            target_entities=[
                {"entity_id": "monster_1", "position": {"x": 360, "y": -12}},
                {"entity_id": "monster_2", "position": {"x": 430, "y": -12}},
            ],
        )

        spawn = next(event for event in events if event.type == "projectile_spawn")
        impact = next(event for event in events if event.type == "projectile_impact")
        zone = next(event for event in events if event.type == "damage_zone")
        damage_events = [event for event in events if event.type == "damage"]
        self.assertEqual(spawn.payload["travel_time_ms"], 920)
        self.assertEqual(spawn.payload["arc_height"], 320)
        self.assertEqual(impact.timestamp_ms, 1020)
        self.assertEqual(zone.timestamp_ms, 1170)
        self.assertEqual({event.target_entity for event in damage_events}, {"monster_1"})

    def test_penetrating_shot_single_target_visual_travels_past_hit(self) -> None:
        self.inventory.add_instance("active", "active_penetrating_shot")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]
        runtime_params = final_skill.runtime_params or {}

        events = SkillRuntime().execute(
            final_skill,
            source_entity="player_1",
            source_position=Position(0, 0),
            target_entity="monster_1",
            target_position=Position(120, 0),
            timestamp_ms=10,
            target_entities=[
                {"entity_id": "monster_1", "position": {"x": 120, "y": -18}},
            ],
        )

        spawn = next(event for event in events if event.type == "projectile_spawn")
        damage = next(event for event in events if event.type == "damage")
        projectile_speed = float(runtime_params["projectile_speed"])
        max_distance = float(runtime_params["max_distance"])
        spawn_position = spawn.payload["spawn_world_position"]
        expected_duration_ms = round(max_distance / projectile_speed * 1000)

        self.assertEqual(spawn.duration_ms, expected_duration_ms)
        direction_world = spawn.payload["direction_world"]
        self.assertAlmostEqual(spawn.payload["end_position"]["x"], spawn_position["x"] + direction_world["x"] * max_distance)
        self.assertAlmostEqual(spawn.payload["end_position"]["y"], spawn_position["y"] + direction_world["y"] * max_distance)
        self.assertLess(damage.delay_ms, spawn.duration_ms)
        self.assertAlmostEqual(damage.position["x"], 120.0)
        self.assertAlmostEqual(damage.position["y"], -18.0)
        self.assertEqual(damage.payload["pierce_remaining"], int(runtime_params["pierce_count"]))
        self.assertEqual(damage.payload["impact_kind"], "projectile_hit_continue")
        self.assertEqual(damage.payload["expire_world_position"], spawn.payload["end_position"])

    def test_puncture_melee_arc_outputs_timed_physical_sector_events(self) -> None:
        self.inventory.add_instance("active", "active_puncture")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]
        final_skill = replace(
            final_skill,
            runtime_params={
                **(final_skill.runtime_params or {}),
                "shape": "rectangle",
                "length": 220,
                "width": 80,
                "angle_offset_deg": 0,
                "hit_at_ms": 180,
                "max_targets": 2,
            },
        )

        events = SkillRuntime().execute(
            final_skill,
            source_entity="player_1",
            source_position=Position(0, 0),
            target_entity="monster_1",
            target_position=Position(120, 0),
            timestamp_ms=10,
            target_entities=[
                {"entity_id": "monster_1", "position": {"x": 120, "y": 0}},
                {"entity_id": "monster_2", "position": {"x": 160, "y": 28}},
                {"entity_id": "monster_far", "position": {"x": 360, "y": 0}},
                {"entity_id": "monster_side", "position": {"x": 80, "y": 180}},
            ],
        )

        event_types = [event.type for event in events]
        self.assertIn("cast_start", event_types)
        self.assertIn("damage_zone", event_types)
        self.assertIn("damage", event_types)
        self.assertIn("hit_vfx", event_types)
        self.assertIn("floating_text", event_types)
        zone = next(event for event in events if event.type == "damage_zone")
        damage_events = [event for event in events if event.type == "damage"]

        self.assertEqual(final_skill.skill_package_id, "active_puncture")
        self.assertEqual(final_skill.behavior_template, "damage_zone")
        self.assertEqual(zone.position, {"x": 0, "y": 0})
        self.assertEqual(zone.payload["origin"], {"x": 0, "y": 0})
        self.assertAlmostEqual(zone.direction["x"], 1.0)
        self.assertAlmostEqual(zone.direction["y"], 0.0)
        self.assertEqual(zone.payload["shape"], "rectangle")
        self.assertEqual(zone.payload["length"], 220.0)
        self.assertEqual(zone.payload["width"], 80.0)
        self.assertEqual(zone.payload["hit_at_ms"], 180)
        self.assertEqual(zone.payload["damage_type"], "physical")
        self.assertEqual({event.target_entity for event in damage_events}, {"monster_1", "monster_2"})
        self.assertTrue(all(event.timestamp_ms == 190 for event in damage_events))
        self.assertTrue(all(event.delay_ms == 180 for event in damage_events))
        self.assertTrue(all(event.damage_type == "physical" for event in damage_events))

    def test_flame_slash_forced_slash_generates_three_flame_waves_with_shotgun_falloff(self) -> None:
        self.inventory.add_instance("active", "active_flame_slash", level=20)
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]
        final_skill = replace(
            final_skill,
            runtime_params={
                **(final_skill.runtime_params or {}),
                "slash_chance_percent": 100,
                "flame_wave_count": 3,
                "flame_wave_distance": 140,
                "flame_wave_spread_angle": 48,
                "flame_wave_arc_angle": 82,
                "allow_same_target_projectile_hits": True,
                "shotgun_falloff_coeff": 0.5,
            },
        )

        events = SkillRuntime().execute(
            final_skill,
            source_entity="player_1",
            source_position=Position(0, 0),
            target_entity="monster_1",
            target_position=Position(100, 0),
            timestamp_ms=10,
            target_entities=[{"entity_id": "monster_1", "position": {"x": 100, "y": 0}}],
        )

        melee_arcs = [event for event in events if event.type == "melee_arc"]
        damage_events = [event for event in events if event.type == "damage"]

        self.assertEqual(len(melee_arcs), 4)
        self.assertTrue(melee_arcs[0].payload["slash_triggered"])
        self.assertEqual(sorted(event.payload.get("flame_wave_index") for event in melee_arcs[1:]), [1, 2, 3])
        ordered_damage = sorted(damage_events, key=lambda event: event.payload["same_target_hit_sequence"])
        self.assertEqual([event.target_entity for event in ordered_damage], ["monster_1", "monster_1", "monster_1"])
        self.assertEqual([event.payload["same_target_hit_sequence"] for event in ordered_damage], [0, 1, 2])
        self.assertEqual([event.amount for event in ordered_damage], [346.0, 173.0, 173.0])
        self.assertTrue(all(event.damage_type == "fire" for event in ordered_damage))
        self.assertTrue(all(event.payload["damage_components"] == {"fire": event.amount} for event in ordered_damage))
        self.assertTrue(all(event.payload["damage_conversions"][0]["from"] == "physical" for event in ordered_damage))

    def test_flame_slash_area_bonus_increases_flame_wave_count_and_distance(self) -> None:
        self.calculator.player_base_stats = {"area_add_percent": 230}
        self.inventory.add_instance("active", "active_flame_slash", level=20)
        self.board.mount_gem("active", 0, 0)

        final_skill = self.calculator.calculate_all()[0]

        self.assertEqual(final_skill.runtime_params["flame_wave_area_steps"], 2)
        self.assertEqual(final_skill.runtime_params["flame_wave_count"], 7)
        self.assertAlmostEqual(final_skill.runtime_params["flame_wave_distance"], 259.2)
        self.assertAlmostEqual(final_skill.runtime_params["arc_radius"], 534.6)

    def test_puncture_damage_zone_params_change_length_width_and_timing(self) -> None:
        self.inventory.add_instance("active", "active_puncture")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]
        target_entities = [
            {"entity_id": "near", "position": {"x": 120, "y": 0}},
            {"entity_id": "wide", "position": {"x": 160, "y": 44}},
            {"entity_id": "far", "position": {"x": 360, "y": 0}},
        ]

        short = replace(final_skill, runtime_params={**(final_skill.runtime_params or {}), "length": 140, "width": 120, "hit_at_ms": 160})
        long = replace(final_skill, runtime_params={**(final_skill.runtime_params or {}), "length": 420, "width": 120, "hit_at_ms": 160})
        narrow = replace(final_skill, runtime_params={**(final_skill.runtime_params or {}), "length": 420, "width": 20, "hit_at_ms": 260})

        short_damage = [
            event for event in SkillRuntime().execute(
                short,
                source_entity="player_1",
                source_position=Position(0, 0),
                target_entity="near",
                target_position=Position(120, 0),
                timestamp_ms=0,
                target_entities=target_entities,
            )
            if event.type == "damage"
        ]
        long_damage = [
            event for event in SkillRuntime().execute(
                long,
                source_entity="player_1",
                source_position=Position(0, 0),
                target_entity="near",
                target_position=Position(120, 0),
                timestamp_ms=0,
                target_entities=target_entities,
            )
            if event.type == "damage"
        ]
        narrow_damage = [
            event for event in SkillRuntime().execute(
                narrow,
                source_entity="player_1",
                source_position=Position(0, 0),
                target_entity="near",
                target_position=Position(120, 0),
                timestamp_ms=0,
                target_entities=target_entities,
            )
            if event.type == "damage"
        ]

        self.assertLess(len(short_damage), len(long_damage))
        self.assertLess(len(narrow_damage), len(long_damage))
        self.assertTrue(all(event.delay_ms == 260 for event in narrow_damage))

    def test_tick_schedule_outputs_reusable_interval_ticks(self) -> None:
        self.assertEqual(tick_schedule(900, 300), ((0, 300), (1, 600), (2, 900)))
        self.assertEqual(tick_schedule(1000, 400), ((0, 400), (1, 800)))

    def test_lava_orb_module_chain_emits_orbit_ticks_and_triggered_damage_zones(self) -> None:
        self.inventory.add_instance("active", "active_lava_orb")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]

        events = SkillRuntime().execute(
            final_skill,
            source_entity="player_1",
            source_position=Position(0, -12),
            target_entity="near",
            target_position=Position(180, -12),
            timestamp_ms=100,
            target_entities=[
                {"entity_id": "near", "position": {"x": 146, "y": 44}},
                {"entity_id": "mid", "position": {"x": 154, "y": 80}},
                {"entity_id": "far", "position": {"x": 360, "y": -12}},
            ],
        )

        event_types = [event.type for event in events]
        orbit_spawn = next(event for event in events if event.type == "orbit_spawn")
        orbit_ticks = [event for event in events if event.type == "orbit_tick"]
        zones = [event for event in events if event.type == "damage_zone"]
        damage_events = [event for event in events if event.type == "damage"]
        first_tick = orbit_ticks[0]
        first_zone = zones[0]

        self.assertEqual(final_skill.skill_package_id, "active_lava_orb")
        self.assertEqual(final_skill.behavior_template, "module_chain")
        self.assertIn("cast_start", event_types)
        self.assertEqual(orbit_spawn.payload["orbit_center"], {"x": 0.0, "y": -12.0})
        self.assertEqual(orbit_spawn.payload["orbit_radius"], 118)
        self.assertEqual(orbit_spawn.payload["duration_ms"], 3600)
        self.assertEqual(orbit_spawn.payload["orb_count"], 1)
        self.assertEqual(len(orbit_ticks), 20)
        self.assertEqual(len(zones), len(orbit_ticks))
        self.assertEqual(first_tick.payload["tick_marker_id"], "lava_orb_tick")
        self.assertEqual(first_tick.payload["tick_time_ms"], 180)
        self.assertIn("orb_position", first_tick.payload)
        self.assertEqual(first_zone.payload["trigger_marker_id"], "lava_orb_tick")
        self.assertEqual(first_zone.payload["origin"], first_tick.payload["orb_position"])
        self.assertEqual(first_zone.payload["shape"], "circle")
        self.assertEqual(first_zone.payload["damage_type"], "fire")
        self.assertTrue(all(event.damage_type == "fire" for event in damage_events))
        self.assertTrue(all(event.timestamp_ms >= first_zone.timestamp_ms for event in damage_events))
        self.assertNotIn("damage", [event.type for event in events if event.timestamp_ms < first_zone.timestamp_ms])
        self.assertNotIn("far", {event.target_entity for event in damage_events})

    def test_lava_orb_orb_count_evenly_spaces_orbit_damage_zones(self) -> None:
        self.inventory.add_instance("active", "active_lava_orb")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]
        runtime_params = deepcopy(final_skill.runtime_params or {})
        runtime_params["modules"][0]["params"]["orb_count"] = 6
        tuned_skill = replace(final_skill, runtime_params=runtime_params)

        events = SkillRuntime().execute(
            tuned_skill,
            source_entity="player_1",
            source_position=Position(0, -12),
            target_entity="near",
            target_position=Position(180, -12),
            timestamp_ms=100,
            target_entities=[],
        )

        orbit_spawn = next(event for event in events if event.type == "orbit_spawn")
        orbit_ticks = [event for event in events if event.type == "orbit_tick"]
        first_tick_orbs = [event for event in orbit_ticks if event.payload["tick_index"] == 1]
        self.assertEqual(orbit_spawn.payload["orb_count"], 6)
        self.assertEqual(len(first_tick_orbs), 6)
        first_tick_angles = sorted(
            round(
                degrees(
                    atan2(
                        event.payload["orb_position"]["y"] - orbit_spawn.payload["orbit_center"]["y"],
                        event.payload["orb_position"]["x"] - orbit_spawn.payload["orbit_center"]["x"],
                    )
                ) % 360,
                3,
            )
            for event in first_tick_orbs
        )
        angle_gaps = [
            round((first_tick_angles[(index + 1) % len(first_tick_angles)] - angle + 360) % 360, 3)
            for index, angle in enumerate(first_tick_angles)
        ]
        self.assertTrue(all(gap == 60 for gap in angle_gaps))

    def test_lava_orb_radius_cycle_changes_orbit_distance_when_enabled(self) -> None:
        self.inventory.add_instance("active", "active_lava_orb")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]
        runtime_params = deepcopy(final_skill.runtime_params or {})
        runtime_params["modules"][0]["params"].update(
            {
                "orbit_radius": 118,
                "orbit_radius_cycle_enabled": True,
                "orbit_radius_cycle_amplitude": 20,
                "orbit_radius_cycle_period_ms": 720,
                "orbit_radius_cycle_phase_deg": 0,
            }
        )
        tuned_skill = replace(final_skill, runtime_params=runtime_params)

        events = SkillRuntime().execute(
            tuned_skill,
            source_entity="player_1",
            source_position=Position(0, -12),
            target_entity="near",
            target_position=Position(180, -12),
            timestamp_ms=100,
            target_entities=[],
        )

        orbit_spawn = next(event for event in events if event.type == "orbit_spawn")
        orbit_ticks = [event for event in events if event.type == "orbit_tick"]
        first_tick = orbit_ticks[0]
        second_tick = orbit_ticks[1]
        center = orbit_spawn.payload["orbit_center"]
        first_distance = hypot(
            first_tick.payload["orb_position"]["x"] - center["x"],
            first_tick.payload["orb_position"]["y"] - center["y"],
        )
        second_distance = hypot(
            second_tick.payload["orb_position"]["x"] - center["x"],
            second_tick.payload["orb_position"]["y"] - center["y"],
        )
        self.assertAlmostEqual(first_distance, 138.0, places=6)
        self.assertAlmostEqual(second_distance, 118.0, places=6)
        self.assertAlmostEqual(first_tick.payload["orb_distance"], first_distance, places=6)

    def test_lava_orb_parameters_change_ticks_positions_or_hit_range(self) -> None:
        self.inventory.add_instance("active", "active_lava_orb")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]
        base_params = dict(final_skill.runtime_params or {})
        targets = [
            {"entity_id": "near", "position": {"x": 146, "y": 44}},
            {"entity_id": "mid", "position": {"x": 154, "y": 80}},
            {"entity_id": "far", "position": {"x": 360, "y": -12}},
        ]

        def with_modules(mutator: object) -> object:
            runtime_params = deepcopy(base_params)
            mutator(runtime_params["modules"])
            return replace(final_skill, runtime_params=runtime_params)

        def run(skill: object) -> tuple:
            return SkillRuntime().execute(
                skill,
                source_entity="player_1",
                source_position=Position(0, -12),
                target_entity="near",
                target_position=Position(180, -12),
                timestamp_ms=0,
                target_entities=targets,
            )

        short = run(with_modules(lambda modules: modules[0]["params"].update({"duration_ms": 900})))
        slow = run(with_modules(lambda modules: modules[0]["params"].update({"tick_interval_ms": 600})))
        wide_orbit = run(with_modules(lambda modules: modules[0]["params"].update({"orbit_radius": 220})))
        two_orbs = run(with_modules(lambda modules: modules[0]["params"].update({"orb_count": 2})))
        narrow_zone = run(with_modules(lambda modules: modules[1]["params"].update({"radius": 24})))
        wide_zone = run(with_modules(lambda modules: modules[1]["params"].update({"radius": 110})))

        self.assertEqual(len([event for event in short if event.type == "orbit_tick"]), 5)
        self.assertEqual(len([event for event in slow if event.type == "orbit_tick"]), 6)
        base_first_position = next(event for event in run(final_skill) if event.type == "orbit_tick").payload["orb_position"]
        wide_first_position = next(event for event in wide_orbit if event.type == "orbit_tick").payload["orb_position"]
        self.assertNotEqual(base_first_position, wide_first_position)
        self.assertEqual(len([event for event in two_orbs if event.type == "orbit_tick"]), 40)
        self.assertLess(
            len([event for event in narrow_zone if event.type == "damage"]),
            len([event for event in wide_zone if event.type == "damage"]),
        )

    def test_lightning_chain_outputs_ordered_chain_segments_and_timed_lightning_damage(self) -> None:
        self.inventory.add_instance("active", "active_lightning_chain")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]

        events = SkillRuntime().execute(
            final_skill,
            source_entity="player_1",
            source_position=Position(0, 0),
            target_entity="near",
            target_position=Position(120, 0),
            timestamp_ms=10,
            target_entities=[
                {"entity_id": "near", "position": {"x": 120, "y": 0}},
                {"entity_id": "next", "position": {"x": 210, "y": 0}},
                {"entity_id": "third", "position": {"x": 300, "y": 0}},
                {"entity_id": "far", "position": {"x": 620, "y": 0}},
            ],
        )

        event_types = [event.type for event in events]
        segments = [event for event in events if event.type == "chain_segment"]
        damage_events = [event for event in events if event.type == "damage"]
        self.assertEqual(final_skill.skill_package_id, "active_lightning_chain")
        self.assertEqual(final_skill.behavior_template, "chain")
        self.assertIn("cast_start", event_types)
        self.assertEqual(len(segments), 3)
        self.assertEqual([event.target_entity for event in segments], ["near", "next", "third"])
        self.assertEqual({event.target_entity for event in damage_events}, {"near", "next", "third"})
        self.assertNotIn("far", {event.target_entity for event in damage_events})
        self.assertTrue(all(event.damage_type == "lightning" for event in damage_events))
        self.assertTrue(all(event.delay_ms >= final_skill.cast["windup_ms"] for event in damage_events))
        self.assertEqual([event.payload["segment_index"] for event in segments], [0, 1, 2])
        self.assertEqual([event.delay_ms for event in segments], [80, 170, 260])
        self.assertEqual([event.delay_ms for event in damage_events], [80, 170, 260])
        self.assertEqual(segments[0].payload["start_position"], {"x": 0, "y": 0})
        self.assertEqual(segments[1].payload["from_target"], "near")
        self.assertLess(damage_events[1].amount, damage_events[0].amount)
        self.assertTrue(any(event.type == "hit_vfx" for event in events))
        self.assertTrue(any(event.type == "floating_text" for event in events))

    def test_lightning_chain_params_change_count_radius_delay_and_falloff(self) -> None:
        self.inventory.add_instance("active", "active_lightning_chain")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]
        targets = [
            {"entity_id": "near", "position": {"x": 120, "y": 0}},
            {"entity_id": "next", "position": {"x": 180, "y": 0}},
            {"entity_id": "third", "position": {"x": 240, "y": 0}},
        ]

        def run(**params: float | int) -> tuple:
            tested = replace(final_skill, runtime_params={**(final_skill.runtime_params or {}), **params})
            return SkillRuntime().execute(
                tested,
                source_entity="player_1",
                source_position=Position(0, 0),
                target_entity="near",
                target_position=Position(120, 0),
                timestamp_ms=0,
                target_entities=targets,
            )

        one = run(chain_count=1)
        three = run(chain_count=3)
        short_radius = run(chain_radius=30)
        long_radius = run(chain_radius=180)
        slow = run(chain_delay_ms=250)
        strong_falloff = run(damage_falloff_per_chain=0.5)

        self.assertEqual(len([event for event in one if event.type == "chain_segment"]), 1)
        self.assertEqual(len([event for event in three if event.type == "chain_segment"]), 3)
        self.assertLess(
            len([event for event in short_radius if event.type == "damage"]),
            len([event for event in long_radius if event.type == "damage"]),
        )
        self.assertEqual([event.delay_ms for event in slow if event.type == "chain_segment"], [80, 330, 580])
        damage = [event for event in strong_falloff if event.type == "damage"]
        self.assertLess(damage[1].amount, damage[0].amount)

    def test_ice_shards_projectile_outputs_real_spread_events(self) -> None:
        self.inventory.add_instance("active", "active_ice_shards")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]
        runtime_params = {**(final_skill.runtime_params or {}), "projectile_count": 3, "spread_angle_deg": 20, "angle_step": 10}
        final_skill = replace(final_skill, projectile_count=3, runtime_params=runtime_params)

        events = SkillRuntime().execute(
            final_skill,
            source_entity="player_1",
            source_position=Position(0, -12),
            target_entity="dummy_mid",
            target_position=Position(360, -12),
            timestamp_ms=0,
            target_entities=[
                {"entity_id": "dummy_left", "position": {"x": 360, "y": -72}},
                {"entity_id": "dummy_mid", "position": {"x": 360, "y": -12}},
                {"entity_id": "dummy_right", "position": {"x": 360, "y": 48}},
            ],
        )

        spawn_events = [event for event in events if event.type == "projectile_spawn"]
        hit_events = [event for event in events if event.type == "projectile_hit"]
        damage_events = [event for event in events if event.type == "damage"]
        hit_vfx_events = [event for event in events if event.type == "hit_vfx"]
        floating_events = [event for event in events if event.type == "floating_text"]
        directions = {(round(event.direction["x"], 4), round(event.direction["y"], 4)) for event in spawn_events}

        self.assertEqual(final_skill.skill_package_id, "active_ice_shards")
        self.assertEqual(final_skill.behavior_template, "projectile")
        self.assertEqual(final_skill.damage_type, "cold")
        self.assertEqual(len(spawn_events), final_skill.projectile_count)
        self.assertGreater(len(directions), 1)
        self.assertTrue(hit_events)
        self.assertTrue(damage_events)
        self.assertTrue(hit_vfx_events)
        self.assertTrue(floating_events)
        self.assertTrue(all(event.damage_type == "cold" for event in damage_events))
        self.assertGreater(min(event.delay_ms for event in damage_events), 0)
        self.assertGreaterEqual(min(event.timestamp_ms for event in damage_events), min(event.timestamp_ms for event in spawn_events))
        self.assertTrue({event.target_entity for event in damage_events}.issubset({"dummy_left", "dummy_mid", "dummy_right"}))
        spawn_by_index = {event.payload["projectile_index"]: event for event in spawn_events}
        self.assertEqual(sorted(spawn_by_index), [1, 2, 3])
        self.assertEqual(len({event.payload["projectile_id"] for event in spawn_events}), final_skill.projectile_count)
        self.assertEqual([event.payload["local_spread_angle"] for event in spawn_events], [-10.0, 0.0, 10.0])
        for event in hit_events + damage_events + hit_vfx_events + floating_events:
            spawn = spawn_by_index[event.payload["projectile_index"]]
            dx = event.position["x"] - spawn.position["x"]
            dy = event.position["y"] - spawn.position["y"]
            perpendicular = abs(dx * spawn.direction["y"] - dy * spawn.direction["x"])
            self.assertAlmostEqual(perpendicular, 0.0)
            self.assertEqual(event.payload["projectile_id"], spawn.payload["projectile_id"])
            self.assertEqual(event.payload["direction_world"], spawn.payload["direction_world"])
            self.assertEqual(event.payload["velocity_world"], spawn.payload["velocity_world"])
            self.assertEqual(event.payload["hit_world_position"], event.position)
            self.assertEqual(event.payload["impact_world_position"], event.position)

    def test_ice_shards_projectile_params_change_count_direction_and_flight_time(self) -> None:
        self.inventory.add_instance("active", "active_ice_shards")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]
        base_params = dict(final_skill.runtime_params or {})

        def with_params(**params: float | int) -> object:
            runtime_params = {**base_params, **params}
            projectile_count = int(runtime_params.get("projectile_count", final_skill.projectile_count))
            return final_skill.__class__(
                **{**final_skill.__dict__, "projectile_count": projectile_count, "runtime_params": runtime_params}
            )

        def run(skill: object) -> tuple:
            return SkillRuntime().execute(
                skill,
                source_entity="player_1",
                source_position=Position(0, -12),
                target_entity="dummy_mid",
                target_position=Position(360, -12),
                timestamp_ms=0,
                target_entities=[
                    {"entity_id": "dummy_left", "position": {"x": 360, "y": -72}},
                    {"entity_id": "dummy_mid", "position": {"x": 360, "y": -12}},
                    {"entity_id": "dummy_right", "position": {"x": 360, "y": 48}},
                ],
            )

        more_count_events = run(with_params(projectile_count=5))
        narrow_events = run(with_params(projectile_count=3, spread_angle_deg=10, angle_step=5))
        wide_events = run(with_params(projectile_count=3, spread_angle_deg=40, angle_step=20))
        slow_events = run(with_params(projectile_speed=240))
        fast_events = run(with_params(projectile_speed=720))

        self.assertEqual(len([event for event in more_count_events if event.type == "projectile_spawn"]), 5)
        narrow_directions = [event.direction for event in narrow_events if event.type == "projectile_spawn"]
        wide_directions = [event.direction for event in wide_events if event.type == "projectile_spawn"]
        self.assertNotEqual(narrow_directions, wide_directions)
        slow_spawn = next(event for event in slow_events if event.type == "projectile_spawn")
        fast_spawn = next(event for event in fast_events if event.type == "projectile_spawn")
        self.assertGreater(slow_spawn.duration_ms, fast_spawn.duration_ms)

    def test_ice_shards_low_projectile_speed_is_not_capped_to_one_second(self) -> None:
        self.inventory.add_instance("active", "active_ice_shards")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]
        runtime_params = dict(final_skill.runtime_params or {})
        runtime_params["projectile_speed"] = 20
        runtime_params.pop("max_duration_ms", None)
        final_skill = final_skill.__class__(**{**final_skill.__dict__, "runtime_params": runtime_params})

        events = SkillRuntime().execute(
            final_skill,
            source_entity="player_1",
            source_position=Position(0, -12),
            target_entity="dummy_mid",
            target_position=Position(360, -12),
            timestamp_ms=0,
            target_entities=[
                {"entity_id": "dummy_mid", "position": {"x": 360, "y": -12}},
            ],
        )

        spawn = next(event for event in events if event.type == "projectile_spawn")
        damage = next(event for event in events if event.type == "damage")
        expected_duration_ms = round(
            hypot(360.0 - spawn.position["x"], -12.0 - spawn.position["y"])
            / float(runtime_params["projectile_speed"])
            * 1000
        )
        self.assertEqual(spawn.duration_ms, expected_duration_ms)
        self.assertEqual(damage.delay_ms, expected_duration_ms)

    def test_ice_shards_projectile_vfx_alignment_payload_covers_counts_and_eight_directions(self) -> None:
        self.inventory.add_instance("active", "active_ice_shards")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]
        base_params = dict(final_skill.runtime_params or {})
        directions = [
            (1, 0),
            (-1, 0),
            (0, 1),
            (0, -1),
            (1, 1),
            (1, -1),
            (-1, 1),
            (-1, -1),
        ]

        for projectile_count in (1, 3, 5):
            runtime_params = {**base_params, "projectile_count": projectile_count}
            tested_skill = replace(final_skill, projectile_count=projectile_count, runtime_params=runtime_params)
            spawn_offset = runtime_params.get("spawn_offset", {})
            spawn_position = {
                "x": float(spawn_offset.get("x", 0.0)),
                "y": -12.0 + float(spawn_offset.get("y", 0.0)),
            }
            for dx, dy in directions:
                with self.subTest(projectile_count=projectile_count, direction=(dx, dy)):
                    length = hypot(dx, dy)
                    expected_direction = {"x": dx / length, "y": dy / length}
                    target = Position(
                        spawn_position["x"] + expected_direction["x"] * 360,
                        spawn_position["y"] + expected_direction["y"] * 360,
                    )
                    events = SkillRuntime().execute(
                        tested_skill,
                        source_entity="player_1",
                        source_position=Position(0, -12),
                        target_entity="dummy",
                        target_position=target,
                        timestamp_ms=0,
                    )
                    spawn_events = [event for event in events if event.type == "projectile_spawn"]
                    hit_vfx_events = [event for event in events if event.type == "hit_vfx"]

                    self.assertEqual(len(spawn_events), projectile_count)
                    self.assertEqual(len(hit_vfx_events), projectile_count)
                    for spawn in spawn_events:
                        self.assertEqual(spawn.position, spawn.payload["spawn_world_position"])
                        self.assertEqual(spawn.payload["vfx_spawn_world_position"], spawn.payload["spawn_world_position"])
                        self.assertEqual(spawn.payload["vfx_direction_world"], spawn.payload["direction_world"])
                        self.assertEqual(spawn.payload["direction_world"], spawn.direction)
                        self.assertAlmostEqual(
                            hypot(spawn.payload["velocity_world"]["x"], spawn.payload["velocity_world"]["y"]),
                            float(runtime_params["projectile_speed"]),
                            places=6,
                        )
                        self.assertEqual(spawn.payload["projectile_count"], projectile_count)
                        self.assertEqual(spawn.payload["skill_id"], "active_ice_shards")
                    hit_by_projectile = {event.payload["projectile_id"]: event for event in hit_vfx_events}
                    self.assertEqual(set(hit_by_projectile), {event.payload["projectile_id"] for event in spawn_events})
                    for spawn in spawn_events:
                        hit_vfx = hit_by_projectile[spawn.payload["projectile_id"]]
                        self.assertEqual(hit_vfx.position, hit_vfx.payload["impact_world_position"])
                        self.assertEqual(hit_vfx.position, hit_vfx.payload["hit_world_position"])

    def test_frost_nova_player_nova_outputs_area_events_and_respects_timing(self) -> None:
        self.inventory.add_instance("active", "active_frost_nova")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]
        runtime_params = {**(final_skill.runtime_params or {}), "radius": 300, "expand_duration_ms": 500, "hit_at_ms": 240}
        final_skill = replace(final_skill, runtime_params=runtime_params)

        events = SkillRuntime().execute(
            final_skill,
            source_entity="player_1",
            source_position=Position(0, -12),
            target_entity="near_1",
            target_position=Position(120, -12),
            timestamp_ms=0,
            target_entities=[
                {"entity_id": "near_1", "position": {"x": 120, "y": -12}},
                {"entity_id": "near_2", "position": {"x": 220, "y": -12}},
                {"entity_id": "far_1", "position": {"x": 420, "y": -12}},
            ],
        )

        event_types = [event.type for event in events]
        damage_zone = next(event for event in events if event.type == "damage_zone")
        damage_events = [event for event in events if event.type == "damage"]

        self.assertEqual(final_skill.skill_package_id, "active_frost_nova")
        self.assertEqual(final_skill.behavior_template, "damage_zone")
        self.assertEqual(final_skill.damage_type, "cold")
        self.assertIn("cast_start", event_types)
        self.assertEqual(damage_zone.position, {"x": 0.0, "y": -12.0})
        self.assertEqual(damage_zone.payload["origin"], damage_zone.position)
        self.assertEqual(damage_zone.payload["shape"], "circle")
        self.assertEqual(damage_zone.payload["radius"], 300)
        self.assertEqual(damage_zone.payload["ring_width"], runtime_params["ring_width"])
        self.assertEqual(damage_zone.duration_ms, 500)
        self.assertEqual(damage_zone.payload["hit_at_ms"], 240)
        self.assertEqual({event.target_entity for event in damage_events}, {"near_1", "near_2"})
        self.assertTrue(all(event.damage_type == "cold" for event in damage_events))
        self.assertTrue(all(event.delay_ms == 240 for event in damage_events))
        self.assertTrue(all(event.timestamp_ms >= damage_zone.timestamp_ms + damage_zone.payload["hit_at_ms"] for event in damage_events))
        self.assertIn("hit_vfx", event_types)
        self.assertIn("floating_text", event_types)

    def test_whirlwind_damage_zone_channel_emits_tick_and_full_stack_slash(self) -> None:
        self.inventory.add_instance("active", "active_whirlwind")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]
        runtime_params = {**(final_skill.runtime_params or {}), "slash_chance_percent": 100}
        final_skill = replace(final_skill, runtime_params=runtime_params)

        targets = [
            {"entity_id": "near_1", "position": {"x": 80, "y": 0}},
            {"entity_id": "slash_only", "position": {"x": 140, "y": 0}},
        ]
        events = SkillRuntime().execute(
            final_skill,
            source_entity="player",
            source_position=Position(0, 0),
            target_entity="near_1",
            target_position=Position(80, 0),
            timestamp_ms=5000,
            target_entities=targets,
            runtime_context={"channel_stack": 4, "channel_elapsed_ms": 2000},
        )

        zones = [event for event in events if event.type == "damage_zone"]
        tick_zone = next(event for event in zones if event.payload["channel_phase"] == "channel_tick")
        slash_zone = next(event for event in zones if event.payload["channel_phase"] == "channel_slash")
        tick_damage = [
            event for event in events
            if event.type == "damage" and event.payload["channel_phase"] == "channel_tick"
        ]
        slash_damage = [
            event for event in events
            if event.type == "damage" and event.payload["channel_phase"] == "channel_slash"
        ]

        self.assertEqual(tick_zone.payload["radius"], 111.8)
        self.assertEqual(tick_zone.payload["channel_stack"], 5)
        self.assertTrue(tick_zone.payload["channel_full_reached"])
        self.assertTrue(tick_zone.payload["slash_triggered"])
        self.assertEqual(tick_zone.payload["next_channel_stack"], 0)
        self.assertEqual(tick_zone.payload["channel_move_speed_multiplier"], 0.7)
        self.assertEqual(slash_zone.payload["radius"], 150)
        self.assertEqual(slash_zone.payload["slash_radius"], 150)
        self.assertEqual(slash_zone.payload["channel_move_speed_multiplier"], 0.7)
        self.assertEqual(slash_zone.payload["next_channel_stack"], 0)
        self.assertEqual({event.target_entity for event in tick_damage}, {"near_1"})
        self.assertEqual({event.target_entity for event in slash_damage}, {"near_1", "slash_only"})
        self.assertAlmostEqual(
            slash_damage[0].amount,
            final_skill.final_damage * runtime_params["slash_damage_scale"],
            places=5,
        )

    def test_ice_shot_outputs_cold_main_hit_back_explosion_and_frostbite(self) -> None:
        self.inventory.add_instance("active", "active_ice_shot", level=20)
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]

        events = SkillRuntime().execute(
            final_skill,
            source_entity="player_1",
            source_position=Position(0, 0),
            target_entity="monster_1",
            target_position=Position(100, 0),
            timestamp_ms=0,
        )

        damage_events = [event for event in events if event.type == "damage"]
        status_events = [event for event in events if event.type == "status_apply"]
        explosion_damage = next(event for event in damage_events if event.payload.get("secondary_hit_id") == "ice_cone_back_explosion")
        main_damage = next(event for event in damage_events if not event.payload.get("secondary_hit_id"))

        self.assertEqual(main_damage.amount, 313)
        self.assertEqual(main_damage.damage_type, "cold")
        self.assertEqual(main_damage.payload["damage_components"], {"cold": 313.0})
        self.assertEqual(explosion_damage.amount, 157)
        self.assertEqual(explosion_damage.damage_type, "cold")
        self.assertEqual(explosion_damage.payload["damage_components"], {"cold": 157.0})
        self.assertGreater(explosion_damage.position["x"], 100.0)
        self.assertAlmostEqual(
            hypot(explosion_damage.position["x"] - 100.0, explosion_damage.position["y"]),
            42.0,
            places=6,
        )
        self.assertEqual({event.payload["status_type"] for event in status_events}, {"frostbite"})
        self.assertEqual(len(status_events), 2)

    def test_frost_nova_params_change_radius_duration_and_hit_timing(self) -> None:
        self.inventory.add_instance("active", "active_frost_nova")
        self.board.mount_gem("active", 0, 0)
        final_skill = self.calculator.calculate_all()[0]
        base_params = dict(final_skill.runtime_params or {})

        def run(**params: float | int) -> tuple:
            tested_params = {**base_params, **params}
            tested_skill = replace(final_skill, runtime_params=tested_params)
            return SkillRuntime().execute(
                tested_skill,
                source_entity="player_1",
                source_position=Position(0, -12),
                target_entity="near_1",
                target_position=Position(180, -12),
                timestamp_ms=0,
                target_entities=[
                    {"entity_id": "near_1", "position": {"x": 180, "y": -12}},
                    {"entity_id": "mid_1", "position": {"x": 360, "y": -12}},
                ],
            )

        small = run(radius=220)
        large = run(radius=430)
        short = run(expand_duration_ms=300, hit_at_ms=200)
        long = run(expand_duration_ms=700, hit_at_ms=200)
        early = run(expand_duration_ms=700, hit_at_ms=120)
        late = run(expand_duration_ms=700, hit_at_ms=420)

        self.assertLess(len([event for event in small if event.type == "damage"]), len([event for event in large if event.type == "damage"]))
        self.assertLess(next(event for event in short if event.type == "damage_zone").duration_ms, next(event for event in long if event.type == "damage_zone").duration_ms)
        self.assertLess(next(event for event in early if event.type == "damage").delay_ms, next(event for event in late if event.type == "damage").delay_ms)


if __name__ == "__main__":
    unittest.main()
