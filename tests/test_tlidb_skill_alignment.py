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
        blizzard_zone = next(event for event in blizzard_events if event.type == "damage_zone")
        self.assertEqual(blizzard.final_cooldown_ms, 2000)
        self.assertEqual(blizzard.source_context["added_damage_effectiveness_percent"], 47)
        self.assertEqual(blizzard_zone.position, {"x": 100.0, "y": 0.0})
        self.assertEqual(blizzard_zone.payload["tick_count"], 3)
        frostbite = next(event for event in blizzard_events if event.type == "status_apply" and event.payload["status_type"] == "frostbite")
        self.assertEqual(frostbite.payload["duration_ms"], 6000)
        self.assertEqual(frostbite.payload["effect_per_stack"], 10)

        thundercloud, thunder_events = self.execute("active_thundercloud")
        thunder_zone = next(event for event in thunder_events if event.type == "damage_zone")
        self.assertEqual(thunder_zone.payload["max_targets"], 3)
        self.assertEqual(thunder_zone.payload["tick_interval_ms"], 333)
        self.assertEqual(thundercloud.runtime_params["duration_ms"], 12500)

        black_hole, black_events = self.execute("active_black_hole")
        black_zone = next(event for event in black_events if event.type == "damage_zone")
        self.assertEqual(black_hole.source_context["damage_basis"], "flat")
        self.assertEqual(black_zone.position, {"x": 100.0, "y": 0.0})
        self.assertEqual(black_zone.payload["duration_ms"], 4000)
        self.assertEqual(black_zone.payload["tick_interval_ms"], 500)
        self.assertEqual(black_zone.payload["knockback_policy"], "reverse")
        self.assertEqual(black_zone.payload["aggravation_value"], 100)

    def test_projectile_and_chain_skills_expose_tlidb_secondary_behavior(self) -> None:
        lightning_shot = self.final_skill("active_lightning_shot")
        self.assertEqual(lightning_shot.hit["weapon_attack_percent"], 33.4)
        self.assertEqual(lightning_shot.damage_conversions[0]["to"], "lightning")
        self.assertEqual(lightning_shot.secondary_hits[0]["max_targets"], 3)

        corrosive = self.final_skill("active_corrosive_shot")
        self.assertEqual(corrosive.damage_conversions[0]["to"], "chaos")
        self.assertEqual(corrosive.ailments[0]["type"], "wilt")
        self.assertEqual(corrosive.secondary_hits[0]["id"], "corrosive_ground")
        _, corrosive_events = self.execute("active_corrosive_shot")
        self.assertTrue(any(event.type == "status_apply" and event.payload.get("secondary_hit_id") == "corrosive_ground" for event in corrosive_events))

        burning = self.final_skill("active_burning_shot")
        self.assertEqual(burning.final_cooldown_ms, 1000)
        self.assertEqual(burning.ailments[0]["type"], "ignite")
        self.assertEqual(burning.ailments[0]["chance_percent"], 25)
        self.assertEqual(burning.runtime_params["on_ignited_hit_explosion_radius"], 60)
        self.assertEqual(burning.runtime_params["on_ignited_hit_cooldown_ms"], 5000)

        chain, chain_events = self.execute("active_chain_lightning")
        self.assertEqual(chain.runtime_params["chain_count"], 3)
        self.assertEqual(len([event for event in chain_events if event.type == "chain_segment"]), 3)
        self.assertEqual(len([event for event in chain_events if event.type == "damage"]), 3)

    def test_projectile_count_and_repeating_projectile_skills_match_descriptions(self) -> None:
        rain = self.final_skill("active_rain_of_arrows")
        self.assertEqual(rain.projectile_count, 15)
        self.assertTrue(rain.runtime_params["allow_same_target_projectile_hits"])
        self.assertEqual(rain.runtime_params["shotgun_falloff_coeff"], 0.7)

        sparkle, sparkle_events = self.execute("active_sparkle")
        tick_damage = [
            event
            for event in sparkle_events
            if event.type == "damage" and "tick_interval_ms" in event.payload
        ]
        self.assertEqual(sparkle.runtime_params["duration_ms"], 1500)
        self.assertEqual(sparkle.runtime_params["tick_interval_ms"], 250)
        self.assertEqual(len(tick_damage), 6)

    def test_melee_and_nova_skills_keep_tlidb_payloads(self) -> None:
        flame = self.final_skill("active_flame_slash")
        self.assertEqual(flame.hit["weapon_attack_percent"], 34.6)
        self.assertEqual(flame.damage_conversions[0]["to"], "fire")
        self.assertEqual(flame.runtime_params["shotgun_falloff_coeff"], 0.5)

        ring, ring_events = self.execute("active_ring_of_ice")
        self.assertEqual(ring.behavior_template, "player_nova")
        area_spawn = next(event for event in ring_events if event.type == "area_spawn")
        self.assertEqual(area_spawn.payload["on_kill_recast_chance_percent"], 20)
        self.assertEqual(area_spawn.payload["on_kill_recast_max_per_area"], 1)
        self.assertEqual(ring.damage_type, "cold")


if __name__ == "__main__":
    unittest.main()
