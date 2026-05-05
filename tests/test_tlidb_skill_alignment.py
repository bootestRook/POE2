from __future__ import annotations

import sys
import unittest
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
from liufang.skill_runtime import SkillRuntime


TARGET_SKILL_DAMAGE = {
    "active_stoneskin": 0,
    "active_thundercloud": 35.9,
    "active_blizzard": 3.5,
    "active_chain_lightning": 73.3,
    "active_ring_of_ice": 76.5,
    "active_flame_slash": 34.6,
    "active_lightning_shot": 33.4,
    "active_corrosive_shot": 9.5,
    "active_burning_shot": 25.6,
    "active_rain_of_arrows": 13.4,
    "active_sparkle": 42.65,
    "active_black_hole": 24.9,
    "active_whirlwind": 8.3,
}


class TlidbSkillAlignmentTest(unittest.TestCase):
    def setUp(self) -> None:
        self.config_root = ROOT / "configs"
        self.definitions = load_gem_definitions(self.config_root)
        self.templates = load_skill_templates(self.config_root)
        self.rules = load_board_rules(self.config_root)
        self.relation_coefficients = load_relation_coefficients(self.config_root)
        self.scaling_rules = load_skill_scaling_rules(self.config_root)
        self.affixes = {definition.affix_id: definition for definition in load_affix_definitions(self.config_root)}

    def final_skill(self, skill_id: str):
        inventory = GemInventory(self.definitions)
        board = SudokuGemBoard(self.rules, inventory)
        inventory.add_instance("active", skill_id, level=1)
        board.mount_gem("active", 0, 0)
        calculator = SkillEffectCalculator(
            board=board,
            definitions=self.definitions,
            skill_templates=self.templates,
            relation_coefficients=self.relation_coefficients,
            scaling_rules=self.scaling_rules,
            affix_definitions=self.affixes,
        )
        return calculator.calculate_all()[0]

    def final_skill_with_player_stats(self, skill_id: str, player_stats: dict[str, float]):
        inventory = GemInventory(self.definitions)
        board = SudokuGemBoard(self.rules, inventory)
        inventory.add_instance("active", skill_id, level=20)
        board.mount_gem("active", 0, 0)
        calculator = SkillEffectCalculator(
            board=board,
            definitions=self.definitions,
            skill_templates=self.templates,
            relation_coefficients=self.relation_coefficients,
            scaling_rules=self.scaling_rules,
            affix_definitions=self.affixes,
        )
        calculator.player_base_stats = player_stats
        return calculator.calculate_all()[0]

    def execute(self, skill_id: str):
        final_skill = self.final_skill(skill_id)
        events = SkillRuntime().execute(
            final_skill,
            source_entity="player",
            source_position=Position(0, 0),
            target_entity="monster_1",
            target_position=Position(100, 0),
            timestamp_ms=100,
            target_entities=[
                {"entity_id": "monster_1", "position": {"x": 100, "y": 0}},
                {"entity_id": "monster_2", "position": {"x": 130, "y": 0}},
                {"entity_id": "monster_3", "position": {"x": 160, "y": 0}},
                {"entity_id": "monster_4", "position": {"x": 240, "y": 0}},
            ],
        )
        return final_skill, events

    def test_target_skills_use_level_one_damage_values(self) -> None:
        for skill_id, expected_damage in TARGET_SKILL_DAMAGE.items():
            with self.subTest(skill_id=skill_id):
                final_skill = self.final_skill(skill_id)
                self.assertAlmostEqual(final_skill.base_damage, expected_damage)
                self.assertAlmostEqual(final_skill.final_damage, expected_damage)

    def test_stoneskin_applies_guard_buff(self) -> None:
        _, events = self.execute("active_stoneskin")
        buff = next(event for event in events if event.type == "buff_apply")
        self.assertEqual(buff.amount, 150)
        self.assertEqual(buff.duration_ms, 6000)
        self.assertEqual(buff.payload["absorb_percent"], 70)
        self.assertTrue(buff.payload["exclude_damage_over_time"])

    def test_repeating_area_skills_match_targeted_or_sustained_descriptions(self) -> None:
        blizzard, blizzard_events = self.execute("active_blizzard")
        blizzard_zones = [event for event in blizzard_events if event.type == "damage_zone"]
        blizzard_markers = [event for event in blizzard_events if event.type == "damage_zone_hit"]
        self.assertEqual(blizzard.final_cooldown_ms, 2000)
        self.assertEqual(blizzard.source_context["added_damage_effectiveness_percent"], 47)
        self.assertEqual(len(blizzard_markers), 3)
        self.assertEqual(len(blizzard_zones), 3)
        self.assertEqual([event.target_entity for event in blizzard_markers], ["monster_1", "monster_2", "monster_3"])
        self.assertEqual({event.payload["target_lock_policy"] for event in blizzard_zones}, {"nearest_unique_enemy"})
        self.assertEqual({event.payload["wave_index"] for event in blizzard_zones}, {1, 2, 3})
        self.assertTrue(all(event.payload["trigger_marker_id"] for event in blizzard_zones))
        self.assertEqual({event.payload["tick_count"] for event in blizzard_zones}, {1})
        frostbite = next(event for event in blizzard_events if event.type == "status_apply" and event.payload["status_type"] == "frostbite")
        self.assertEqual(frostbite.payload["duration_ms"], 6000)
        self.assertEqual(frostbite.payload["effect_per_stack"], 10)

        thundercloud, thunder_events = self.execute("active_thundercloud")
        thunder_zone = next(event for event in thunder_events if event.type == "damage_zone")
        self.assertEqual(thunder_zone.payload["max_targets"], 3)
        self.assertEqual(thunder_zone.payload["tick_interval_ms"], 333)
        self.assertEqual(thunder_zone.payload["channel_stack"], 1)
        self.assertEqual(thundercloud.runtime_params["duration_ms"], 12500)

        whirlwind, whirlwind_events = self.execute("active_whirlwind")
        whirlwind_zone = next(event for event in whirlwind_events if event.type == "damage_zone")
        self.assertEqual(whirlwind_zone.payload["radius"], 111.8)
        self.assertEqual(whirlwind_zone.payload["channel_stack"], 1)
        self.assertEqual(whirlwind_zone.payload["channel_max_stacks"], 5)
        self.assertEqual(whirlwind_zone.payload["channel_move_speed_multiplier"], 0.7)
        self.assertEqual(whirlwind.runtime_params["slash_radius"], 150)
        self.assertEqual(whirlwind.runtime_params["slash_chance_percent"], 20)

        black_hole, black_events = self.execute("active_black_hole")
        black_zone = next(event for event in black_events if event.type == "damage_zone")
        self.assertEqual(black_hole.source_context["damage_basis"], "flat")
        self.assertEqual(black_zone.position, {"x": 100.0, "y": 0.0})
        self.assertEqual(black_zone.payload["duration_ms"], 4000)
        self.assertEqual(black_zone.payload["tick_interval_ms"], 500)
        self.assertEqual(black_zone.payload["knockback_policy"], "reverse")
        self.assertEqual(black_zone.payload["knockback_interval_ms"], 100)
        self.assertEqual(black_zone.payload["aggravation_value"], 100)
        black_damage = [event for event in black_events if event.type == "damage"]
        black_aggravation = [
            event
            for event in black_events
            if event.type == "status_apply" and event.payload["status_type"] == "aggravation"
        ]
        black_pull = [event for event in black_events if event.type == "forced_movement"]
        self.assertEqual(len(black_damage), 24)
        self.assertEqual(len(black_aggravation), 12)
        self.assertEqual(len(black_pull), 40)
        self.assertTrue(all(event.amount == 12.45 for event in black_damage))
        self.assertFalse(any(event.type == "status_apply" and event.payload["status_type"] == "wilt" for event in black_events))
        self.assertEqual(
            {event.payload["tick_time_ms"] for event in black_aggravation},
            {500, 1500, 2500, 3500},
        )
        self.assertTrue(all(event.payload["movement_policy"] == "pull_to_origin" for event in black_pull))
        self.assertEqual({event.payload["movement_scope"] for event in black_pull}, {"damage_zone"})
        self.assertEqual({event.target_entity for event in black_pull}, {""})
        self.assertEqual({event.payload["pull_time_ms"] for event in black_pull}, set(range(100, 4001, 100)))
        aggravation = next(
            event for event in black_aggravation
        )
        self.assertEqual(aggravation.payload["base_value"], 100)
        self.assertEqual(aggravation.payload["effect_per_stack"], 3.5)
        self.assertEqual(aggravation.payload["duration_ms"], 4000)

    def test_projectile_and_chain_skills_expose_tlidb_secondary_behavior(self) -> None:
        lightning_shot = self.final_skill("active_lightning_shot")
        self.assertEqual(lightning_shot.hit["weapon_attack_percent"], 33.4)
        self.assertEqual(lightning_shot.damage_conversions[0]["to"], "lightning")
        self.assertEqual(lightning_shot.secondary_hits[0]["max_targets"], 3)
        _, lightning_events = self.execute("active_lightning_shot")
        main_projectile_hits = [
            event for event in lightning_events
            if event.type == "projectile_hit" and event.target_entity == "monster_1"
        ]
        secondary_zone = next(
            event for event in lightning_events
            if event.type == "damage_zone" and event.payload.get("secondary_hit_id") == "forked_lightning"
        )
        secondary_damage = [
            event for event in lightning_events
            if event.type == "damage" and event.payload.get("secondary_hit_id") == "forked_lightning"
        ]
        secondary_search = next(
            event for event in lightning_events
            if event.type == "target_search" and event.payload.get("secondary_hit_id") == "forked_lightning"
        )
        secondary_markers = [
            event for event in lightning_events
            if event.type == "damage_zone_hit" and event.payload.get("secondary_hit_id") == "forked_lightning"
        ]
        secondary_hit_vfx = [
            event for event in lightning_events
            if event.type == "hit_vfx" and event.payload.get("secondary_hit_id") == "forked_lightning"
        ]
        self.assertEqual(len(main_projectile_hits), 1)
        self.assertEqual(main_projectile_hits[0].payload["marker_id"], "lightning_shot_hit_a")
        self.assertEqual(main_projectile_hits[0].payload["hit_marker_id"], "lightning_shot_hit_a")
        self.assertEqual(secondary_zone.payload["max_targets"], 3)
        self.assertEqual(secondary_zone.payload["hit_target_count"], 3)
        self.assertEqual(secondary_zone.payload["trigger_marker_id"], "lightning_shot_hit_a")
        self.assertEqual(secondary_zone.payload["search_module_id"], "lightning_shot_target_search")
        self.assertEqual(secondary_zone.payload["direct_damage_module_id"], "lightning_shot_direct_damage")
        self.assertEqual(secondary_search.payload["locked_target_count"], 3)
        self.assertEqual(secondary_search.payload["trigger_marker_id"], "lightning_shot_hit_a")
        self.assertEqual(secondary_search.payload["search_module_id"], "lightning_shot_target_search")
        self.assertEqual(len(secondary_markers), 3)
        self.assertTrue(all(event.payload["marker_id"] == "lightning_shot_hit_b" for event in secondary_markers))
        self.assertEqual(len(secondary_damage), 3)
        self.assertEqual({event.target_entity for event in secondary_damage}, {"monster_1", "monster_2", "monster_3"})
        self.assertNotIn("monster_4", {event.target_entity for event in secondary_damage})
        self.assertTrue(all(event.damage_type == "lightning" for event in secondary_damage))
        self.assertTrue(all(event.payload["trigger_event_type"] == "target_search" for event in secondary_damage))
        self.assertTrue(all(event.payload["direct_damage_module_id"] == "lightning_shot_direct_damage" for event in secondary_damage))
        self.assertTrue(all(event.payload["marker_id"] == "lightning_shot_hit_b" for event in secondary_damage))
        self.assertTrue(
            all(event.payload["damage_components"] == {"lightning": 33.4} for event in secondary_damage)
        )
        self.assertEqual(len([event for event in secondary_hit_vfx if event.target_entity != ""]), 3)
        self.assertTrue(all(event.vfx_key == "skill_event.lightning_shot.chain_strike" for event in secondary_hit_vfx))

        corrosive = self.final_skill("active_corrosive_shot")
        self.assertEqual(corrosive.behavior_template, "module_chain")
        self.assertEqual(corrosive.damage_conversions[0]["to"], "chaos")
        self.assertEqual(corrosive.ailments[0]["type"], "wilt")
        self.assertEqual(corrosive.secondary_hits, ())
        _, corrosive_events = self.execute("active_corrosive_shot")
        corrosive_spawn = next(event for event in corrosive_events if event.type == "projectile_spawn")
        corrosive_impact = next(event for event in corrosive_events if event.type == "projectile_impact")
        corrosive_zone = next(event for event in corrosive_events if event.type == "damage_zone")
        corrosive_ground_hits = [
            event
            for event in corrosive_events
            if event.type == "damage_zone_hit" and event.payload.get("marker_id") == "corrosive_ground_hit"
        ]
        corrosive_ground_damage = [
            event
            for event in corrosive_events
            if event.type == "damage" and event.payload.get("marker_id") == "corrosive_ground_hit"
        ]
        corrosive_buffs = [
            event
            for event in corrosive_events
            if event.type == "buff_apply" and event.payload.get("trigger_event_type") == "damage_zone_hit"
        ]
        corrosive_ground_hit_vfx = [
            event
            for event in corrosive_events
            if event.type == "hit_vfx" and event.payload.get("hit_marker_id") == "corrosive_ground_hit"
        ]
        self.assertEqual(corrosive_spawn.payload["trajectory"], "linear")
        self.assertEqual(corrosive_spawn.payload["arc_height"], 0)
        self.assertEqual(corrosive_impact.payload["marker_id"], "corrosive_impact")
        self.assertEqual(corrosive_zone.payload["trigger_marker_id"], "corrosive_impact")
        self.assertFalse(corrosive_zone.payload["emit_hit_vfx"])
        self.assertEqual(corrosive_zone.duration_ms, 20000)
        self.assertEqual(corrosive_zone.payload["tick_count"], 20)
        self.assertEqual(corrosive_zone.payload["hit_target_count"], 3)
        self.assertEqual(len(corrosive_ground_hits), 60)
        self.assertEqual(len(corrosive_ground_damage), 60)
        self.assertEqual(len(corrosive_buffs), 21)
        self.assertEqual(corrosive_ground_hit_vfx, [])
        self.assertEqual(
            {event.payload["tick_time_ms"] for event in corrosive_ground_hits},
            set(range(1000, 21000, 1000)),
        )
        self.assertTrue(all(event.amount == 0.741 for event in corrosive_ground_damage))
        self.assertTrue(all(event.payload["buff_type"] == "" for event in corrosive_buffs))
        self.assertTrue(all(event.payload["effect_type"] == "damage_taken_increase" for event in corrosive_buffs))
        self.assertTrue(all(event.payload["chance_percent"] == 40 for event in corrosive_buffs))
        self.assertTrue(all(event.payload["buff_roll"] < 40 for event in corrosive_buffs))
        self.assertTrue(all(event.payload["effect_per_stack"] == 30 for event in corrosive_buffs))
        self.assertTrue(all(event.payload["source_skill_id"] == "active_corrosive_shot" for event in corrosive_buffs))

        burning = self.final_skill("active_burning_shot")
        self.assertEqual(burning.final_cooldown_ms, 1000)
        self.assertEqual(burning.ailments[0]["type"], "ignite")
        self.assertEqual(burning.ailments[0]["chance_percent"], 25)
        self.assertEqual(burning.ailments[0]["base_damage_per_second"], 2.56)
        self.assertEqual(burning.ailments[0]["damage_over_time_more_percent"], 30)
        self.assertEqual(burning.runtime_params["on_ignited_hit_explosion_radius"], 60)
        self.assertEqual(burning.runtime_params["on_ignited_hit_indirect_fire_damage"], 0.5)
        self.assertEqual(burning.runtime_params["on_ignited_hit_cooldown_ms"], 5000)

        chain, chain_events = self.execute("active_chain_lightning")
        self.assertEqual(chain.runtime_params["chain_count"], 3)
        self.assertEqual(len([event for event in chain_events if event.type == "chain_segment"]), 3)
        self.assertEqual(len([event for event in chain_events if event.type == "damage"]), 3)

    def test_projectile_count_and_repeating_projectile_skills_match_descriptions(self) -> None:
        rain, rain_events = self.execute("active_rain_of_arrows")
        self.assertEqual(rain.projectile_count, 15)
        self.assertTrue(rain.runtime_params["allow_same_target_projectile_hits"])
        self.assertEqual(rain.runtime_params["shotgun_falloff_coeff"], 0.7)
        self.assertEqual(rain.runtime_params["target_policy"], "nearest_unique_enemy")
        self.assertEqual(rain.runtime_params["projectile_visual_mode"], "falling_arrow")
        self.assertEqual(rain.runtime_params["travel_time_ms"], 140)
        self.assertEqual(rain.runtime_params["projectile_speed_damage_conversion_percent"], 25)

        rain_spawns = [event for event in rain_events if event.type == "projectile_spawn"]
        rain_damage = [event for event in rain_events if event.type == "damage"]
        rain_floating_text = [event for event in rain_events if event.type == "floating_text"]
        self.assertEqual(len(rain_spawns), 15)
        self.assertEqual(len(rain_damage), 15)
        self.assertEqual(len(rain_floating_text), 15)
        self.assertEqual([event.target_entity for event in rain_spawns[:4]], ["monster_1", "monster_2", "monster_3", "monster_4"])
        rain_damage_by_projectile = sorted(rain_damage, key=lambda event: event.payload["projectile_index"])
        self.assertEqual([event.target_entity for event in rain_damage_by_projectile[:4]], ["monster_1", "monster_2", "monster_3", "monster_4"])
        self.assertEqual(rain_damage_by_projectile[4].target_entity, "monster_1")
        self.assertTrue(all(event.payload["trajectory"] == "ballistic" for event in rain_spawns))
        self.assertTrue(all(event.payload["arc_height"] == 90 for event in rain_spawns))
        self.assertTrue(all(event.duration_ms == 140 for event in rain_spawns))
        self.assertTrue(all(event.payload["lifetime_ms"] == 140 for event in rain_spawns))
        self.assertTrue(all(event.payload["projectile_visual_mode"] == "falling_arrow" for event in rain_spawns))
        self.assertTrue(all(event.payload["hit_world_position"] == event.payload["target_world_position"] for event in rain_damage))
        for event in rain_floating_text:
            self.assertEqual(
                event.position,
                {"x": event.payload["target_world_position"]["x"], "y": event.payload["target_world_position"]["y"] - 28.0},
            )
            self.assertEqual(event.payload["hit_world_position"], event.payload["target_world_position"])
        self.assertLess(len({event.target_entity for event in rain_damage}), len(rain_damage))
        repeated_damage = [event for event in rain_damage if event.payload["same_target_hit_sequence"] > 0]
        self.assertTrue(repeated_damage)
        for event in repeated_damage:
            self.assertAlmostEqual(event.amount, rain.final_damage * 0.3)

        baseline_rain = self.final_skill_with_player_stats("active_rain_of_arrows", {})
        faster_rain = self.final_skill_with_player_stats("active_rain_of_arrows", {"projectile_speed_add_percent": 40})
        baseline_lightning = self.final_skill_with_player_stats("active_lightning_shot", {})
        faster_lightning = self.final_skill_with_player_stats("active_lightning_shot", {"projectile_speed_add_percent": 40})
        self.assertAlmostEqual(faster_rain.final_damage, baseline_rain.final_damage * 1.1)
        self.assertAlmostEqual(faster_lightning.final_damage, baseline_lightning.final_damage)
        self.assertGreater(faster_rain.runtime_params["projectile_speed"], baseline_rain.runtime_params["projectile_speed"])

        sparkle, sparkle_events = self.execute("active_sparkle")
        sparkle_damage = [event for event in sparkle_events if event.type == "damage"]
        tick_damage = [
            event
            for event in sparkle_events
            if event.type == "damage" and "tick_interval_ms" in event.payload
        ]
        self.assertEqual(sparkle.runtime_params["duration_ms"], 1500)
        self.assertEqual(sparkle.runtime_params["tick_interval_ms"], 250)
        self.assertTrue(sparkle.runtime_params["sustained_ticks"])
        self.assertNotIn("projectile_hit", [event.type for event in sparkle_events])
        self.assertEqual(len(sparkle_damage), 6)
        self.assertEqual(len(tick_damage), 6)
        self.assertEqual([event.payload["tick_time_ms"] for event in tick_damage], [250, 500, 750, 1000, 1250, 1500])

    def test_damage_zone_duration_is_not_hardcoded_in_runtime_mirrors(self) -> None:
        frontend_runtime = (ROOT / "webapp" / "App.tsx").read_text(encoding="utf-8")
        python_runtime = (ROOT / "src" / "liufang" / "skill_runtime.py").read_text(encoding="utf-8")
        self.assertNotIn("duration_ms: Math.max(180, hitAtMs)", frontend_runtime)
        self.assertNotIn("duration_ms=max(180, hit_at_ms)", python_runtime)

    def test_melee_and_nova_skills_keep_tlidb_payloads(self) -> None:
        flame = self.final_skill("active_flame_slash")
        self.assertEqual(flame.hit["weapon_attack_percent"], 34.6)
        self.assertEqual(flame.damage_conversions[0]["to"], "fire")
        self.assertIn("slash", flame.tags)
        self.assertEqual(flame.runtime_params["arc_radius"], 162)
        self.assertEqual(flame.runtime_params["arc_angle"], 120)
        self.assertEqual(flame.runtime_params["flame_wave_count"], 3)
        self.assertEqual(flame.runtime_params["flame_wave_distance"], 162)
        self.assertEqual(flame.runtime_params["flame_wave_arc_angle"], 120)
        self.assertEqual(flame.runtime_params["slash_chance_percent"], 20)
        self.assertEqual(flame.runtime_params["shotgun_falloff_coeff"], 0.5)

        ring, ring_events = self.execute("active_ring_of_ice")
        self.assertEqual(ring.behavior_template, "player_nova")
        area_spawn = next(event for event in ring_events if event.type == "area_spawn")
        self.assertEqual(ring.cast["search_range"], 118)
        self.assertEqual(ring.hit["hit_radius"], 118)
        self.assertEqual(ring.runtime_params["radius"], 118)
        self.assertEqual(area_spawn.position, {"x": 0.0, "y": 0.0})
        self.assertEqual(area_spawn.payload["center_world_position"], {"x": 0.0, "y": 0.0})
        self.assertEqual(area_spawn.payload["radius"], 118)
        self.assertEqual(area_spawn.payload["on_kill_recast_chance_percent"], 20)
        self.assertEqual(area_spawn.payload["on_kill_recast_max_per_area"], 1)
        self.assertEqual(area_spawn.payload["ring_width"], 82)
        self.assertTrue(area_spawn.payload["suppress_hit_vfx"])
        self.assertNotIn("hit_vfx", [event.type for event in ring_events])
        self.assertEqual(ring.damage_type, "cold")

    def test_raging_slash_support_adds_slash_chance_not_status_chance(self) -> None:
        inventory = GemInventory(self.definitions)
        board = SudokuGemBoard(self.rules, inventory)
        inventory.add_instance("active", "active_flame_slash", level=20)
        inventory.add_instance("support", "support_raging_slash", level=20)
        board.mount_gem("active", 0, 0)
        board.mount_gem("support", 0, 1)
        calculator = SkillEffectCalculator(
            board=board,
            definitions=self.definitions,
            skill_templates=self.templates,
            relation_coefficients=self.relation_coefficients,
            scaling_rules=self.scaling_rules,
            affix_definitions=self.affixes,
        )

        flame = calculator.calculate_all()[0]

        self.assertEqual(flame.runtime_params["slash_chance_percent"], 70.0)
        self.assertEqual(flame.runtime_params["status_chance_scale"], 1.0)
        self.assertEqual(flame.applied_modifiers[0].stat, "slash_chance_add_percent")


if __name__ == "__main__":
    unittest.main()
