from __future__ import annotations

import sys
import unittest
from copy import deepcopy
from dataclasses import replace
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from liufang.config import (
    SkillScalingRules,
    SupportBaseModifier,
    load_behavior_templates,
    load_affix_definitions,
    load_board_rules,
    load_gem_definitions,
    load_relation_coefficients,
    load_skill_scaling_rules,
    load_skill_packages,
    load_skill_schema,
    load_skill_templates,
    validate_skill_package_data,
)
from liufang.gem_board import SudokuGemBoard
from liufang.inventory import AffixRoll, GemInventory
from liufang.skill_effects import SkillEffectCalculator, SkillEffectError


class SkillEffectTest(unittest.TestCase):
    def setUp(self) -> None:
        self.config_root = ROOT / "configs"
        self.definitions = load_gem_definitions(self.config_root)
        self.inventory = GemInventory(self.definitions)
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

    def _fresh_calculator(self) -> tuple[GemInventory, SudokuGemBoard, SkillEffectCalculator]:
        inventory = GemInventory(self.definitions)
        board = SudokuGemBoard(load_board_rules(self.config_root), inventory)
        calculator = SkillEffectCalculator(
            board=board,
            definitions=self.definitions,
            skill_templates=load_skill_templates(self.config_root),
            relation_coefficients=load_relation_coefficients(self.config_root),
            scaling_rules=load_skill_scaling_rules(self.config_root),
            affix_definitions={},
        )
        return inventory, board, calculator

    def test_active_fire_bolt_loads_from_skill_package(self) -> None:
        packages = load_skill_packages(self.config_root)
        templates = load_skill_templates(self.config_root)

        self.assertEqual(set(packages), {"active_fire_bolt", "active_ice_shards", "active_penetrating_shot", "active_frost_nova", "active_puncture", "active_lightning_chain", "active_fungal_petards", "active_lava_orb"})
        self.assertEqual(packages["active_fire_bolt"]["behavior"]["template"], "projectile")
        self.assertEqual(packages["active_ice_shards"]["behavior"]["template"], "projectile")
        self.assertEqual(packages["active_penetrating_shot"]["behavior"]["template"], "projectile")
        self.assertEqual(packages["active_frost_nova"]["behavior"]["template"], "damage_zone")
        self.assertEqual(packages["active_puncture"]["behavior"]["template"], "damage_zone")
        self.assertEqual(packages["active_lightning_chain"]["behavior"]["template"], "chain")
        self.assertEqual(packages["active_puncture"]["classification"]["damage_type"], "physical")
        self.assertEqual(packages["active_lightning_chain"]["classification"]["damage_type"], "lightning")
        self.assertEqual(packages["active_penetrating_shot"]["behavior"]["params"]["hit_policy"], "pierce")
        self.assertEqual(templates["skill_fire_bolt"].skill_package_id, "active_fire_bolt")
        self.assertEqual(templates["skill_fire_bolt"].behavior_template, "projectile")
        self.assertEqual(templates["skill_ice_shards"].skill_package_id, "active_ice_shards")
        self.assertEqual(templates["skill_ice_shards"].behavior_template, "projectile")
        self.assertEqual(templates["skill_ice_shards"].damage_type, "cold")
        self.assertEqual(templates["skill_penetrating_shot"].skill_package_id, "active_penetrating_shot")
        self.assertEqual(templates["skill_penetrating_shot"].behavior_template, "projectile")
        self.assertEqual(templates["skill_penetrating_shot"].damage_type, "physical")
        self.assertEqual(templates["skill_frost_nova"].skill_package_id, "active_frost_nova")
        self.assertEqual(templates["skill_frost_nova"].behavior_template, "damage_zone")
        self.assertEqual(templates["skill_frost_nova"].damage_type, "cold")
        self.assertEqual(templates["skill_puncture"].skill_package_id, "active_puncture")
        self.assertEqual(templates["skill_puncture"].behavior_template, "damage_zone")
        self.assertEqual(templates["skill_puncture"].damage_type, "physical")
        self.assertEqual(templates["skill_lightning_chain"].skill_package_id, "active_lightning_chain")
        self.assertEqual(templates["skill_lightning_chain"].behavior_template, "chain")
        self.assertEqual(templates["skill_lightning_chain"].damage_type, "lightning")
        self.assertEqual(templates["skill_fungal_petards"].skill_package_id, "active_fungal_petards")
        self.assertEqual(templates["skill_fungal_petards"].behavior_template, "module_chain")
        self.assertEqual(templates["skill_lava_orb"].skill_package_id, "active_lava_orb")
        self.assertEqual(templates["skill_lava_orb"].behavior_template, "module_chain")

    def test_gem_definitions_load_from_skill_package_dirs(self) -> None:
        self.assertFalse((self.config_root / "gems" / "active_skill_gems.toml").exists())
        self.assertFalse((self.config_root / "gems" / "passive_skill_gems.toml").exists())
        self.assertFalse((self.config_root / "gems" / "support_gems.toml").exists())
        self.assertEqual(sum(1 for definition in self.definitions.values() if definition.gem_kind == "active_skill"), 16)
        self.assertEqual(sum(1 for definition in self.definitions.values() if definition.gem_kind == "passive_skill"), 9)
        support_definitions = [definition for definition in self.definitions.values() if definition.gem_kind == "support"]
        self.assertGreater(len(support_definitions), 0)
        self.assertTrue(all("support_gem" in definition.tags for definition in support_definitions))

    def test_shape_supports_affect_current_product_active_skills(self) -> None:
        cases = [
            ("support_nova_shot", "active_rain_of_arrows", "projectile_speed_add_percent"),
            ("support_precision_strike", "active_flame_slash", "area_add_percent"),
            ("support_steamroll", "active_whirlwind", "melee_damage_add_percent"),
        ]
        for support_id, active_id, expected_stat in cases:
            with self.subTest(support=support_id):
                inventory, board, calculator = self._fresh_calculator()
                active = inventory.add_instance("active", active_id, level=20)
                inventory.add_instance("support", support_id, level=20)
                board.mount_gem("active", 0, 0)
                board.mount_gem("support", 0, 1)

                final_skill = calculator.calculate_for_active(active)

                self.assertTrue(
                    any(
                        modifier.source_base_gem_id == support_id
                        and modifier.stat == expected_stat
                        and modifier.applied
                        for modifier in final_skill.applied_modifiers
                    )
                )
                support_definition = self.definitions[support_id]
                self.assertEqual(support_definition.gem_type, "gem_type_7")
                self.assertIn("support_shape", support_definition.tags)

    def test_all_migrated_active_and_passive_skill_gems_take_effect(self) -> None:
        active_ids = sorted(
            definition.base_gem_id
            for definition in self.definitions.values()
            if definition.gem_kind == "active_skill"
        )
        for active_id in active_ids:
            with self.subTest(active=active_id):
                inventory, board, calculator = self._fresh_calculator()
                inventory.add_instance("active", active_id)
                board.mount_gem("active", 0, 0)
                final_skill = calculator.calculate_all()[0]
                self.assertEqual(final_skill.base_gem_id, active_id)
                self.assertEqual(final_skill.skill_package_id, active_id)
                self.assertGreater(final_skill.final_damage, 0)

        for passive_id in ["passive_fire_focus", "passive_vitality", "passive_swift_gathering"]:
            with self.subTest(passive=passive_id):
                inventory, board, calculator = self._fresh_calculator()
                inventory.add_instance("active", "active_fire_bolt")
                inventory.add_instance("passive", passive_id)
                board.mount_gem("active", 0, 0)
                board.mount_gem("passive", 1, 0)
                if passive_id == "passive_fire_focus":
                    final_skill = calculator.calculate_all()[0]
                    self.assertTrue(
                        any(
                            modifier.source_base_gem_id == passive_id
                            and modifier.reason_key == "modifier.passive_base"
                            and modifier.applied
                            for modifier in final_skill.applied_modifiers
                        )
                    )
                else:
                    class PlayerStub:
                        current_life = 100
                        max_life = 100
                        move_speed = 250.0

                    player = PlayerStub()
                    calculator.apply_player_stat_contributions(player)
                    if passive_id == "passive_vitality":
                        self.assertEqual(player.max_life, 125)
                    if passive_id == "passive_swift_gathering":
                        self.assertAlmostEqual(player.move_speed, 275.0)

    def test_all_migrated_support_skill_gems_take_effect(self) -> None:
        active_definitions = [
            definition
            for definition in self.definitions.values()
            if definition.gem_kind == "active_skill"
        ]

        def matches_active(support_definition: object, active_definition: object) -> bool:
            if "active_skill" not in support_definition.apply_filter_target_kinds:
                return False
            if support_definition.apply_filter_tags_any and not (
                support_definition.apply_filter_tags_any & active_definition.tags
            ):
                return False
            if support_definition.apply_filter_tags_all and not (
                support_definition.apply_filter_tags_all <= active_definition.tags
            ):
                return False
            if support_definition.apply_filter_tags_none and (
                support_definition.apply_filter_tags_none & active_definition.tags
            ):
                return False
            return True

        conduit_positions = {
            "support_row_conduit": ((0, 0), (0, 3), (0, 6)),
            "support_column_conduit": ((0, 0), (3, 0), (6, 0)),
            "support_box_conduit": ((0, 0), (1, 1), (2, 2)),
        }
        support_definitions = sorted(
            (
                definition
                for definition in self.definitions.values()
                if definition.gem_kind == "support"
            ),
            key=lambda definition: definition.base_gem_id,
        )
        for support_definition in support_definitions:
            support_id = support_definition.base_gem_id
            with self.subTest(support=support_id):
                inventory, board, calculator = self._fresh_calculator()
                if support_id in conduit_positions:
                    active_pos, support_pos, conduit_pos = conduit_positions[support_id]
                    inventory.add_instance("active", "active_fire_bolt")
                    inventory.add_instance("support", "support_fire_mastery")
                    inventory.add_instance("conduit", support_id)
                    board.mount_gem("active", *active_pos)
                    board.mount_gem("support", *support_pos)
                    board.mount_gem("conduit", *conduit_pos)
                    final_skill = calculator.calculate_all()[0]
                    self.assertTrue(
                        any(
                            modifier.source_base_gem_id == support_id
                            and modifier.reason_key == "modifier.conduit_skill_level"
                            and modifier.stat == "active_gem_level_add"
                            and modifier.applied
                            for modifier in final_skill.applied_modifiers
                        )
                    )
                    continue

                candidates = [
                    definition.base_gem_id
                    for definition in active_definitions
                    if matches_active(support_definition, definition)
                ]
                self.assertTrue(candidates)
                inventory.add_instance("active", candidates[0])
                inventory.add_instance("support", support_id)
                board.mount_gem("active", 0, 0)
                board.mount_gem("support", 0, 1)
                final_skill = calculator.calculate_all()[0]
                if support_definition.shape_effect:
                    self.assertIn(support_definition.shape_effect, final_skill.shape_effects)
                else:
                    self.assertTrue(
                        any(
                            modifier.source_base_gem_id == support_id
                            and modifier.reason_key == "modifier.support_base"
                            and modifier.applied
                            for modifier in final_skill.applied_modifiers
                        )
                    )

    def test_skill_package_schema_rejects_missing_required_field(self) -> None:
        package = deepcopy(load_skill_packages(self.config_root)["active_fire_bolt"])
        del package["hit"]["base_damage"]

        with self.assertRaisesRegex(ValueError, "hit.base_damage"):
            validate_skill_package_data(
                package,
                load_skill_schema(self.config_root),
                load_behavior_templates(self.config_root),
            )

    def test_skill_package_schema_rejects_invalid_behavior_template(self) -> None:
        package = deepcopy(load_skill_packages(self.config_root)["active_fire_bolt"])
        package["behavior"]["template"] = "scripted_projectile"

        with self.assertRaisesRegex(ValueError, "behavior.template"):
            validate_skill_package_data(
                package,
                load_skill_schema(self.config_root),
                load_behavior_templates(self.config_root),
            )

    def test_skill_package_schema_rejects_invalid_behavior_params(self) -> None:
        package = deepcopy(load_skill_packages(self.config_root)["active_fire_bolt"])
        package["behavior"]["params"]["script"] = "deal_damage()"

        with self.assertRaisesRegex(ValueError, "script"):
            validate_skill_package_data(
                package,
                load_skill_schema(self.config_root),
                load_behavior_templates(self.config_root),
            )

    def test_ice_shards_projectile_schema_rejects_unknown_fields_and_invalid_values(self) -> None:
        package = deepcopy(load_skill_packages(self.config_root)["active_ice_shards"])
        package["behavior"]["params"]["forbidden_param"] = 1

        with self.assertRaisesRegex(ValueError, "unsupported parameter"):
            validate_skill_package_data(
                package,
                load_skill_schema(self.config_root),
                load_behavior_templates(self.config_root),
            )

        package = deepcopy(load_skill_packages(self.config_root)["active_ice_shards"])
        package["behavior"]["params"]["projectile_count"] = 0
        with self.assertRaisesRegex(ValueError, "projectile_count"):
            validate_skill_package_data(
                package,
                load_skill_schema(self.config_root),
                load_behavior_templates(self.config_root),
            )

        package = deepcopy(load_skill_packages(self.config_root)["active_ice_shards"])
        package["behavior"]["params"]["spread_angle_deg"] = 181
        with self.assertRaisesRegex(ValueError, "spread_angle_deg"):
            validate_skill_package_data(
                package,
                load_skill_schema(self.config_root),
                load_behavior_templates(self.config_root),
            )

        package = deepcopy(load_skill_packages(self.config_root)["active_ice_shards"])
        package["behavior"]["params"]["hit_policy"] = "chain"
        with self.assertRaisesRegex(ValueError, "hit_policy"):
            validate_skill_package_data(
                package,
                load_skill_schema(self.config_root),
                load_behavior_templates(self.config_root),
            )

    def test_damage_zone_circle_schema_rejects_unknown_fields_and_invalid_values(self) -> None:
        package = deepcopy(load_skill_packages(self.config_root)["active_frost_nova"])
        package["behavior"]["params"]["forbidden_param"] = 1

        with self.assertRaisesRegex(ValueError, "unsupported parameter"):
            validate_skill_package_data(
                package,
                load_skill_schema(self.config_root),
                load_behavior_templates(self.config_root),
            )

        package = deepcopy(load_skill_packages(self.config_root)["active_frost_nova"])
        package["behavior"]["params"]["radius"] = 0
        with self.assertRaisesRegex(ValueError, "radius"):
            validate_skill_package_data(
                package,
                load_skill_schema(self.config_root),
                load_behavior_templates(self.config_root),
            )

        package = deepcopy(load_skill_packages(self.config_root)["active_frost_nova"])
        package["behavior"]["params"]["length"] = 100
        with self.assertRaisesRegex(ValueError, "length"):
            validate_skill_package_data(
                package,
                load_skill_schema(self.config_root),
                load_behavior_templates(self.config_root),
            )

        package = deepcopy(load_skill_packages(self.config_root)["active_frost_nova"])
        package["behavior"]["params"]["shape"] = "triangle"
        with self.assertRaisesRegex(ValueError, "shape"):
            validate_skill_package_data(
                package,
                load_skill_schema(self.config_root),
                load_behavior_templates(self.config_root),
            )

    def test_damage_zone_rectangle_schema_rejects_unknown_fields_and_invalid_values(self) -> None:
        package = deepcopy(load_skill_packages(self.config_root)["active_puncture"])
        package["behavior"]["params"]["script"] = "deal_damage()"

        with self.assertRaisesRegex(ValueError, "script"):
            validate_skill_package_data(
                package,
                load_skill_schema(self.config_root),
                load_behavior_templates(self.config_root),
            )

        invalid_cases = [
            ("length", 0),
            ("width", 0),
            ("angle_offset_deg", 181),
            ("hit_at_ms", -1),
            ("max_targets", 0),
            ("facing_policy", "target_point"),
            ("origin_policy", "target"),
            ("status_chance_scale", 11),
            ("zone_vfx_key", "not a key"),
        ]
        for key, value in invalid_cases:
            with self.subTest(key=key):
                package = deepcopy(load_skill_packages(self.config_root)["active_puncture"])
                package["behavior"]["params"][key] = value
                with self.assertRaisesRegex(ValueError, key):
                    validate_skill_package_data(
                        package,
                        load_skill_schema(self.config_root),
                        load_behavior_templates(self.config_root),
                    )

        package = deepcopy(load_skill_packages(self.config_root)["active_puncture"])
        package["behavior"]["params"]["radius"] = 120
        with self.assertRaisesRegex(ValueError, "radius"):
            validate_skill_package_data(
                package,
                load_skill_schema(self.config_root),
                load_behavior_templates(self.config_root),
            )

    def test_chain_schema_rejects_unknown_fields_and_invalid_values(self) -> None:
        package = deepcopy(load_skill_packages(self.config_root)["active_lightning_chain"])
        package["behavior"]["params"]["script"] = "deal_damage()"

        with self.assertRaisesRegex(ValueError, "script"):
            validate_skill_package_data(
                package,
                load_skill_schema(self.config_root),
                load_behavior_templates(self.config_root),
            )

        invalid_cases = [
            ("chain_count", 0),
            ("chain_radius", 0),
            ("chain_delay_ms", -1),
            ("damage_falloff_per_chain", 1.5),
            ("target_policy", "nearest_enemy"),
            ("allow_repeat_target", "false"),
            ("max_targets", 0),
            ("segment_vfx_key", "not a key"),
        ]
        for key, value in invalid_cases:
            with self.subTest(key=key):
                package = deepcopy(load_skill_packages(self.config_root)["active_lightning_chain"])
                package["behavior"]["params"][key] = value
                with self.assertRaisesRegex(ValueError, key):
                    validate_skill_package_data(
                        package,
                        load_skill_schema(self.config_root),
                        load_behavior_templates(self.config_root),
                    )

    def test_invalid_or_empty_board_does_not_output_combat_skill(self) -> None:
        with self.assertRaises(SkillEffectError) as empty_error:
            self.calculator.calculate_all()
        self.assertEqual(empty_error.exception.error_key, "board.enter_combat.empty_board")

        self.inventory.add_instance("active_a", "active_fire_bolt")
        self.inventory.add_instance("active_b", "active_ice_shards")
        self.board.mount_gem("active_a", 0, 0)
        self.board.mount_gem("active_b", 0, 1)

        with self.assertRaises(SkillEffectError) as invalid_error:
            self.calculator.calculate_all()
        self.assertEqual(invalid_error.exception.error_key, "skill_effect.error.invalid_board")

    def test_support_base_and_conduit_apply_without_random_affixes(self) -> None:
        active = self.inventory.add_instance("active", "active_fire_bolt")
        support = self.inventory.add_instance("support", "support_fire_mastery")
        self.inventory.add_instance("conduit", "support_row_conduit")
        self.board.mount_gem(active.instance_id, 0, 0)
        self.board.mount_gem(support.instance_id, 0, 3)
        self.board.mount_gem("conduit", 0, 6)

        final_skill = self.calculator.calculate_all()[0]
        self.assertEqual(final_skill.active_gem_instance_id, "active")
        self.assertEqual(final_skill.skill_template_id, "skill_fire_bolt")
        self.assertEqual(final_skill.skill_package_id, "active_fire_bolt")
        self.assertEqual(final_skill.skill_package_version, "1.0.0")
        self.assertEqual(final_skill.behavior_template, "projectile")
        self.assertEqual(final_skill.cast["target_selector"], "nearest_enemy")
        self.assertEqual(final_skill.hit["base_damage"], 12)
        package_count = load_skill_packages(self.config_root)["active_fire_bolt"]["behavior"]["params"]["projectile_count"]
        self.assertEqual(final_skill.projectile_count, package_count)
        self.assertEqual(final_skill.runtime_params["max_targets"], 1)
        self.assertEqual(final_skill.presentation_keys["floating_text"], "skill_event.fire_bolt.floating_text")
        self.assertEqual(final_skill.source_context["gem_kind"], "active_skill")
        self.assertEqual(final_skill.source_context["sudoku_digit"], 1)
        self.assertEqual(final_skill.base_damage, 12)
        self.assertAlmostEqual(final_skill.final_damage, 14.112, places=3)
        self.assertTrue(
            any(modifier.reason_key == "modifier.conduit_skill_level" for modifier in final_skill.applied_modifiers)
        )
        self.assertTrue(
            any(
                modifier.source_instance_id == "support"
                and modifier.target_instance_id == "active"
                and modifier.stat == "fire_damage_add_percent"
                and modifier.relation == "same_row"
                for modifier in final_skill.applied_modifiers
            )
        )
        self.assertFalse(any("affix" in modifier.reason_key for modifier in final_skill.applied_modifiers))

    def test_apply_filter_blocks_non_matching_support(self) -> None:
        self.inventory.add_instance("active", "active_fire_bolt")
        self.inventory.add_instance("support", "support_fast_attack")
        self.board.mount_gem("active", 0, 0)
        self.board.mount_gem("support", 0, 3)

        final_skill = self.calculator.calculate_all()[0]
        self.assertEqual(final_skill.final_damage, 12)
        self.assertFalse(
            any(modifier.source_base_gem_id == "support_fast_attack" for modifier in final_skill.applied_modifiers)
        )

    def test_player_base_stats_enter_v1_hit_formula_by_matching_tags(self) -> None:
        self.calculator.player_base_stats = {
            "damage_add_percent": 10,
            "hit_damage_add_percent": 5,
            "fire_damage_add_percent": 20,
            "cold_damage_add_percent": 900,
            "elemental_damage_add_percent": 15,
            "all_damage_type_add_percent": 3,
            "spell_damage_add_percent": 8,
            "attack_damage_add_percent": 900,
            "projectile_damage_add_percent": 7,
            "area_damage_add_percent": 900,
            "damage_final_percent": 10,
            "hit_damage_final_percent": 5,
        }
        self.inventory.add_instance("active", "active_fire_bolt")
        self.board.mount_gem("active", 0, 0)

        final_skill = self.calculator.calculate_all()[0]

        self.assertAlmostEqual(final_skill.increase_pool, 68)
        self.assertAlmostEqual(final_skill.final_pool, 15)
        self.assertAlmostEqual(final_skill.final_damage, 12 * 1.68 * 1.15)
        self.assertEqual(final_skill.skill_stats["cold_damage_add_percent"], 900.0)

    def test_player_base_stats_do_not_apply_to_unmatched_damage_type_or_tags(self) -> None:
        self.calculator.player_base_stats = {
            "cold_damage_add_percent": 900,
            "attack_damage_add_percent": 900,
            "area_damage_add_percent": 900,
        }
        self.inventory.add_instance("active", "active_fire_bolt")
        self.board.mount_gem("active", 0, 0)

        final_skill = self.calculator.calculate_all()[0]

        self.assertEqual(final_skill.increase_pool, 0)
        self.assertEqual(final_skill.final_damage, 12)

    def test_ice_shot_keeps_physical_source_but_converts_hit_to_cold(self) -> None:
        inventory, board, calculator = self._fresh_calculator()
        inventory.add_instance("active", "active_ice_shot", level=20)
        board.mount_gem("active", 0, 0)

        final_skill = calculator.calculate_all()[0]

        self.assertEqual(final_skill.base_damage_components, {"physical": 313.0})
        self.assertEqual(final_skill.converted_damage_components, {"cold": {"physical": 313.0}})
        self.assertEqual(final_skill.final_damage_components, {"cold": 313.0})
        self.assertEqual(final_skill.damage_conversions, ({"from": "physical", "to": "cold", "percent": 100.0},))
        self.assertEqual(final_skill.ailments[0]["type"], "frostbite")
        self.assertEqual(final_skill.secondary_hits[0]["base_damage"], 157.0)
        self.assertEqual(final_skill.source_context["damage_basis"], "weapon_attack")
        self.assertEqual(final_skill.source_context["weapon_attack_base_damage"], 100.0)

    def test_ice_shot_weapon_attack_percent_scales_with_gem_level(self) -> None:
        inventory, board, calculator = self._fresh_calculator()
        inventory.add_instance("active", "active_ice_shot", level=1)
        board.mount_gem("active", 0, 0)

        final_skill = calculator.calculate_all()[0]

        self.assertEqual(final_skill.base_damage, 31.3)
        self.assertEqual(final_skill.hit["weapon_attack_percent"], 31.3)
        self.assertEqual(final_skill.base_damage_components, {"physical": 31.3})
        self.assertEqual(final_skill.final_damage_components, {"cold": 31.3})
        self.assertAlmostEqual(final_skill.secondary_hits[0]["base_damage"], 15.7)
        self.assertAlmostEqual(final_skill.secondary_hits[0]["weapon_attack_percent"], 15.7)
        self.assertAlmostEqual(final_skill.secondary_hits[0]["damage_components"]["physical"], 15.7)
        self.assertAlmostEqual(final_skill.hit["secondary_hits"][0]["base_damage"], 15.7)
        self.assertAlmostEqual(final_skill.hit["secondary_hits"][0]["weapon_attack_percent"], 15.7)

    def test_active_level_table_drives_nested_damage_outputs(self) -> None:
        cases = [
            ("active_flame_slash", lambda skill: self.assertEqual(skill.hit["damage_components"], {"physical": 34.6})),
            ("active_split_firebolt", lambda skill: self.assertEqual(skill.runtime_params["split_projectile_base_damage"], 42.125)),
            (
                "active_corrosive_shot",
                lambda skill: (
                    self.assertEqual(skill.ailments[0]["base_damage_per_second"], 0.57),
                    self.assertEqual(skill.runtime_params["modules"][1]["params"]["damage_amount"], 0.741),
                ),
            ),
            (
                "active_burning_shot",
                lambda skill: (
                    self.assertEqual(skill.ailments[0]["base_damage_per_second"], 2.56),
                    self.assertEqual(skill.runtime_params["on_ignited_hit_indirect_fire_damage"], 0.5),
                ),
            ),
        ]
        for skill_id, assertion in cases:
            with self.subTest(skill_id=skill_id):
                inventory, board, calculator = self._fresh_calculator()
                inventory.add_instance("active", skill_id, level=1)
                board.mount_gem("active", 0, 0)

                final_skill = calculator.calculate_all()[0]

                assertion(final_skill)

    def test_weapon_attack_damage_basis_uses_player_weapon_attack_hook(self) -> None:
        inventory, board, calculator = self._fresh_calculator()
        calculator.player_base_stats = {"weapon_attack_base_damage": 200}
        inventory.add_instance("active", "active_ice_shot", level=20)
        board.mount_gem("active", 0, 0)

        final_skill = calculator.calculate_all()[0]

        self.assertEqual(final_skill.base_damage, 626.0)
        self.assertEqual(final_skill.base_damage_components, {"physical": 626.0})
        self.assertEqual(final_skill.final_damage_components, {"cold": 626.0})
        self.assertEqual(final_skill.secondary_hits[0]["base_damage"], 314.0)
        self.assertEqual(final_skill.source_context["weapon_attack_base_damage"], 200.0)

    def test_row_column_and_box_power_stats_scale_routed_values_with_conduit(self) -> None:
        cases = [
            ("same_row", "source_power_row", "target_power_row", "support_row_conduit", (0, 0), (0, 3), (0, 6)),
            ("same_column", "source_power_column", "target_power_column", "support_column_conduit", (0, 0), (3, 0), (6, 0)),
            ("same_box", "source_power_box", "target_power_box", "support_box_conduit", (0, 0), (1, 1), (2, 2)),
        ]
        for relation, source_stat, target_stat, conduit_id, active_pos, support_pos, conduit_pos in cases:
            with self.subTest(relation=relation):
                inventory, board, calculator = self._fresh_calculator()
                inventory.add_instance(
                    "active",
                    "active_fire_bolt",
                    suffix_affixes=(AffixRoll(f"target_{relation}", target_stat, 20, "suffix", "relation_target"),),
                )
                inventory.add_instance(
                    "support",
                    "support_fire_mastery",
                    suffix_affixes=(AffixRoll(f"source_{relation}", source_stat, 10, "suffix", "relation_source"),),
                )
                inventory.add_instance("conduit", conduit_id)
                board.mount_gem("active", *active_pos)
                board.mount_gem("support", *support_pos)
                board.mount_gem("conduit", *conduit_pos)

                final_skill = calculator.calculate_all()[0]
                fire_modifier = next(
                    modifier
                    for modifier in final_skill.applied_modifiers
                    if modifier.source_instance_id == "support" and modifier.stat == "fire_damage_add_percent"
                )
                conduit_modifiers = [
                    modifier
                    for modifier in final_skill.applied_modifiers
                    if modifier.stat == "active_gem_level_add" and modifier.applied
                ]

                self.assertEqual(fire_modifier.relation, relation)
                self.assertAlmostEqual(fire_modifier.value, 18 * 1.1 * 1.2)
                self.assertEqual(len(conduit_modifiers), 1)
                self.assertEqual(conduit_modifiers[0].reason_key, "modifier.conduit_skill_level")

    def test_v1_critical_expectation_fields_are_exposed(self) -> None:
        self.calculator.player_base_stats = {
            "base_crit_chance_percent": 5,
            "crit_rating": 600,
            "crit_damage_rating": 1000,
        }
        self.inventory.add_instance("active", "active_fire_bolt")
        self.board.mount_gem("active", 0, 0)

        final_skill = self.calculator.calculate_all()[0]

        self.assertEqual(final_skill.final_damage, 12)
        self.assertAlmostEqual(final_skill.skill_stats["derived_crit_chance_percent"], 27.5)
        self.assertAlmostEqual(final_skill.skill_stats["derived_crit_damage_percent"], 250)
        self.assertAlmostEqual(final_skill.crit_chance, 0.275)
        self.assertAlmostEqual(final_skill.crit_multiplier, 2.5)
        self.assertAlmostEqual(final_skill.expected_hit_damage, 16.95)

    def test_cannot_crit_forces_expected_damage_to_non_critical_damage(self) -> None:
        self.calculator.player_base_stats = {
            "base_crit_chance_percent": 95,
            "crit_chance_add_percent": 20,
            "crit_damage_add_percent": 50,
            "cannot_crit": True,
        }
        self.inventory.add_instance("active", "active_fire_bolt")
        self.board.mount_gem("active", 0, 0)

        final_skill = self.calculator.calculate_all()[0]

        self.assertEqual(final_skill.crit_chance, 0)
        self.assertEqual(final_skill.crit_multiplier, 2)
        self.assertEqual(final_skill.expected_hit_damage, final_skill.final_damage)

    def test_chain_and_pierce_count_player_stats_enter_runtime_params(self) -> None:
        self.calculator.player_base_stats = {"chain_count_add": 2}
        self.inventory.add_instance("active", "active_lightning_chain")
        self.board.mount_gem("active", 0, 0)

        chain_skill = self.calculator.calculate_all()[0]

        self.assertEqual(chain_skill.runtime_params["chain_count"], 6)
        self.assertEqual(chain_skill.runtime_params["max_targets"], 7)

        inventory, board, calculator = self._fresh_calculator()
        calculator.player_base_stats = {"pierce_count_add": 3}
        inventory.add_instance("active", "active_penetrating_shot")
        board.mount_gem("active", 0, 0)

        pierce_skill = calculator.calculate_all()[0]

        self.assertEqual(pierce_skill.runtime_params["pierce_count"], 6)

    def test_player_global_board_power_and_conduit_stats_scale_routing(self) -> None:
        self.calculator.player_base_stats = {
            "source_power_row": 10,
            "target_power_row": 20,
            "conduit_power_row": 40,
            "relation_effect_final_percent": 5,
        }
        self.inventory.add_instance("active", "active_fire_bolt")
        self.inventory.add_instance("support", "support_fire_mastery")
        self.inventory.add_instance("conduit", "support_row_conduit")
        self.board.mount_gem("active", 0, 0)
        self.board.mount_gem("support", 0, 3)
        self.board.mount_gem("conduit", 0, 6)

        final_skill = self.calculator.calculate_all()[0]
        fire_modifier = next(
            modifier for modifier in final_skill.applied_modifiers if modifier.stat == "fire_damage_add_percent"
        )

        self.assertAlmostEqual(fire_modifier.value, 24.948)
        self.assertTrue(
            any(
                modifier.stat == "active_gem_level_add"
                and modifier.value == 1
                and modifier.relation == "same_row"
                for modifier in final_skill.applied_modifiers
            )
        )

    def test_adjacent_relation_takes_priority_over_row_column_or_box(self) -> None:
        self.inventory.add_instance("active", "active_fire_bolt")
        self.inventory.add_instance(
            "support",
            "support_fast_cast",
            suffix_affixes=(
                AffixRoll("affix_row_source_power_t1", "source_power_row", 50, "suffix", "relation_source"),
            ),
        )
        self.board.mount_gem("active", 0, 0)
        self.board.mount_gem("support", 0, 1)

        final_skill = self.calculator.calculate_all()[0]
        cast_modifier = next(
            modifier for modifier in final_skill.applied_modifiers if modifier.stat == "cast_speed_add_percent"
        )
        self.assertEqual(cast_modifier.relation, "adjacent")
        self.assertAlmostEqual(cast_modifier.value, 12.5)
        self.assertAlmostEqual(final_skill.speed_multiplier, 1.125)

    def test_attack_skill_only_uses_attack_speed_for_release_interval(self) -> None:
        inventory, board, calculator = self._fresh_calculator()
        inventory.add_instance("active", "active_puncture")
        board.mount_gem("active", 0, 0)

        baseline = calculator.calculate_all()[0]
        calculator.player_base_stats = {"attack_speed_add_percent": 100, "cast_speed_add_percent": 0}
        attack_speed_skill = calculator.calculate_all()[0]
        calculator.player_base_stats = {"attack_speed_add_percent": 0, "cast_speed_add_percent": 100}
        cast_speed_skill = calculator.calculate_all()[0]

        self.assertLess(attack_speed_skill.release_interval_ms, baseline.release_interval_ms)
        self.assertEqual(cast_speed_skill.release_interval_ms, baseline.release_interval_ms)

    def test_spell_skill_only_uses_cast_speed_for_release_interval(self) -> None:
        inventory, board, calculator = self._fresh_calculator()
        inventory.add_instance("active", "active_fire_bolt")
        board.mount_gem("active", 0, 0)

        baseline = calculator.calculate_all()[0]
        calculator.player_base_stats = {"cast_speed_add_percent": 100, "attack_speed_add_percent": 0}
        cast_speed_skill = calculator.calculate_all()[0]
        calculator.player_base_stats = {"cast_speed_add_percent": 0, "attack_speed_add_percent": 100}
        attack_speed_skill = calculator.calculate_all()[0]

        self.assertLess(cast_speed_skill.release_interval_ms, baseline.release_interval_ms)
        self.assertEqual(attack_speed_skill.release_interval_ms, baseline.release_interval_ms)

    def test_cooldown_recovery_formula_does_not_reduce_to_zero(self) -> None:
        inventory, board, calculator = self._fresh_calculator()
        inventory.add_instance("active", "active_frost_nova")
        board.mount_gem("active", 0, 0)
        template = calculator.skill_templates["skill_frost_nova"]
        calculator.skill_templates = {
            **calculator.skill_templates,
            "skill_frost_nova": replace(template, base_release_interval_ms=0, base_cooldown_ms=10000),
        }
        calculator.player_base_stats = {"cooldown_recovery_add_percent": 100, "added_cooldown_ms": 0}

        final_skill = calculator.calculate_all()[0]

        self.assertEqual(final_skill.final_cooldown_ms, 5000)
        self.assertEqual(final_skill.actual_interval_ms, 5000)

    def test_added_cooldown_is_applied_after_cooldown_recovery(self) -> None:
        inventory, board, calculator = self._fresh_calculator()
        inventory.add_instance("active", "active_frost_nova")
        board.mount_gem("active", 0, 0)
        template = calculator.skill_templates["skill_frost_nova"]
        calculator.skill_templates = {
            **calculator.skill_templates,
            "skill_frost_nova": replace(template, base_release_interval_ms=0, base_cooldown_ms=10000),
        }
        calculator.player_base_stats = {"cooldown_recovery_add_percent": 100, "added_cooldown_ms": 1000}

        final_skill = calculator.calculate_all()[0]

        self.assertEqual(final_skill.final_cooldown_ms, 6000)
        self.assertEqual(final_skill.actual_interval_ms, 6000)

    def test_actual_interval_uses_slower_release_gate_or_cooldown(self) -> None:
        inventory, board, calculator = self._fresh_calculator()
        inventory.add_instance("active", "active_frost_nova")
        board.mount_gem("active", 0, 0)
        template = calculator.skill_templates["skill_frost_nova"]
        calculator.skill_templates = {
            **calculator.skill_templates,
            "skill_frost_nova": replace(template, base_release_interval_ms=500, base_cooldown_ms=2000),
        }

        final_skill = calculator.calculate_all()[0]

        self.assertEqual(final_skill.release_interval_ms, 500)
        self.assertEqual(final_skill.final_cooldown_ms, 2000)
        self.assertEqual(final_skill.actual_interval_ms, 2000)

    def test_trigger_interval_is_not_affected_by_cooldown_recovery(self) -> None:
        inventory, board, calculator = self._fresh_calculator()
        inventory.add_instance("active", "active_frost_nova")
        board.mount_gem("active", 0, 0)
        template = calculator.skill_templates["skill_frost_nova"]
        calculator.skill_templates = {
            **calculator.skill_templates,
            "skill_frost_nova": replace(template, trigger_interval_ms=500, base_release_interval_ms=0, base_cooldown_ms=1000),
        }
        calculator.player_base_stats = {"cooldown_recovery_add_percent": 100}

        final_skill = calculator.calculate_all()[0]

        self.assertEqual(final_skill.trigger_interval_ms, 500)
        self.assertEqual(final_skill.final_cooldown_ms, 500)

    def test_same_source_target_stat_is_settled_once(self) -> None:
        self.inventory.add_instance("active", "active_fire_bolt")
        self.inventory.add_instance("support", "support_overcharge")
        self.board.mount_gem("active", 0, 0)
        self.board.mount_gem("support", 0, 3)

        duplicate_rules = SkillScalingRules(
            stat_layers=self.calculator.scaling_rules.stat_layers,
            support_base_modifiers=self.calculator.scaling_rules.support_base_modifiers
            + (SupportBaseModifier("support_overcharge", "damage_final_percent", 5, "final"),),
            conduit_amplifiers=self.calculator.scaling_rules.conduit_amplifiers,
        )
        self.calculator.scaling_rules = duplicate_rules

        final_skill = self.calculator.calculate_all()[0]
        damage_final_modifiers = [
            modifier for modifier in final_skill.applied_modifiers if modifier.stat == "damage_final_percent"
        ]
        self.assertEqual(len(damage_final_modifiers), 2)
        self.assertTrue(damage_final_modifiers[0].applied)
        self.assertFalse(damage_final_modifiers[1].applied)
        self.assertEqual(damage_final_modifiers[1].reason_key, "modifier.ignored.duplicate_source_target_stat")

    def test_final_skill_output_contains_core_fields(self) -> None:
        self.inventory.add_instance("active", "active_ice_shards")
        self.inventory.add_instance("support", "support_extra_projectile")
        self.board.mount_gem("active", 0, 0)
        self.board.mount_gem("support", 0, 3)

        final_skill = self.calculator.calculate_all()[0]
        self.assertEqual(final_skill.base_gem_id, "active_ice_shards")
        self.assertEqual(final_skill.skill_package_id, "active_ice_shards")
        self.assertEqual(final_skill.behavior_template, "projectile")
        self.assertEqual(final_skill.projectile_count, 2)
        expected_spread_angle = load_skill_packages(self.config_root)["active_ice_shards"]["behavior"]["params"]["spread_angle_deg"]
        self.assertEqual(final_skill.runtime_params["spread_angle_deg"], expected_spread_angle)
        self.assertEqual(final_skill.final_cooldown_ms, 0)
        self.assertGreater(final_skill.actual_interval_ms, 0)
        self.assertGreater(final_skill.area_multiplier, 0)
        self.assertGreater(final_skill.uses_per_second, 0)
        self.assertEqual(final_skill.hit_coverage_factor, 1)
        self.assertAlmostEqual(final_skill.preview_dps, final_skill.expected_hit_damage * final_skill.uses_per_second)
        self.assertIsInstance(final_skill.applied_modifiers, tuple)

    def test_extra_projectile_support_adds_visible_spread_when_target_has_none(self) -> None:
        self.inventory.add_instance("active", "active_penetrating_shot")
        self.inventory.add_instance("support", "support_extra_projectile")
        self.board.mount_gem("active", 0, 0)
        self.board.mount_gem("support", 1, 0)

        final_skill = self.calculator.calculate_all()[0]

        self.assertEqual(final_skill.projectile_count, 2)
        self.assertEqual(final_skill.runtime_params["projectile_count"], 2)
        self.assertGreater(final_skill.runtime_params["spread_angle_deg"], 0)

    def test_passive_to_active_and_support_to_passive_are_applied_in_order(self) -> None:
        self.inventory.add_instance("active", "active_fire_bolt")
        self.inventory.add_instance("passive", "passive_fire_focus")
        self.inventory.add_instance("support", "support_fire_mastery")
        self.board.mount_gem("active", 0, 0)
        self.board.mount_gem("passive", 1, 0)
        self.board.mount_gem("support", 1, 3)

        final_skill = self.calculator.calculate_all()[0]
        support_to_passive = [
            modifier for modifier in final_skill.applied_modifiers if modifier.reason_key == "modifier.support_to_passive"
        ]
        passive_to_active = [
            modifier for modifier in final_skill.applied_modifiers if modifier.reason_key == "modifier.passive_base"
        ]

        self.assertTrue(support_to_passive)
        self.assertTrue(passive_to_active)
        self.assertLess(
            final_skill.applied_modifiers.index(support_to_passive[0]),
            final_skill.applied_modifiers.index(passive_to_active[0]),
        )
        self.assertEqual(support_to_passive[0].target_instance_id, "passive")
        self.assertEqual(passive_to_active[0].source_instance_id, "passive")
        self.assertEqual(passive_to_active[0].target_instance_id, "active")
        self.assertGreater(final_skill.final_damage, 12)

    def test_support_to_support_and_passive_recursive_routes_are_forbidden(self) -> None:
        self.inventory.add_instance("active", "active_fire_bolt")
        self.inventory.add_instance("passive_a", "passive_fire_focus")
        self.inventory.add_instance("passive_b", "passive_vitality")
        self.inventory.add_instance("support_a", "support_fire_mastery")
        self.inventory.add_instance("support_b", "support_fast_cast")
        self.board.mount_gem("active", 0, 0)
        self.board.mount_gem("passive_a", 1, 0)
        self.board.mount_gem("passive_b", 1, 1)
        self.board.mount_gem("support_a", 1, 3)
        self.board.mount_gem("support_b", 1, 4)

        final_skill = self.calculator.calculate_all()[0]
        routes = {(modifier.source_instance_id, modifier.target_instance_id) for modifier in final_skill.applied_modifiers}

        self.assertNotIn(("support_a", "support_b"), routes)
        self.assertNotIn(("support_b", "support_a"), routes)
        self.assertNotIn(("passive_b", "passive_a"), routes)
        self.assertNotIn(("passive_a", "passive_b"), routes)

    def test_passive_self_stats_update_player_attributes(self) -> None:
        self.inventory.add_instance("active", "active_fire_bolt")
        self.inventory.add_instance("life", "passive_vitality")
        self.inventory.add_instance("speed", "passive_swift_gathering")
        self.board.mount_gem("active", 0, 0)
        self.board.mount_gem("life", 1, 0)
        self.board.mount_gem("speed", 2, 0)

        class PlayerStub:
            current_life = 100
            max_life = 100
            move_speed = 250.0

        player = PlayerStub()
        modifiers = self.calculator.apply_player_stat_contributions(player)

        self.assertEqual({modifier.stat for modifier in modifiers}, {"max_life", "move_speed"})
        self.assertEqual(player.max_life, 125)
        self.assertEqual(player.current_life, 125)
        self.assertAlmostEqual(player.move_speed, 275.0)

    def test_each_active_skill_has_five_visible_shape_supports(self) -> None:
        active_skill_tags = {
            "active_fire_bolt": "skill_fire_bolt",
            "active_ice_shards": "skill_ice_shards",
            "active_lightning_chain": "skill_lightning_chain",
            "active_frost_nova": "skill_frost_nova",
            "active_puncture": "skill_puncture",
            "active_penetrating_shot": "skill_penetrating_shot",
            "active_lava_orb": "skill_lava_orb",
            "active_fungal_petards": "skill_fungal_petards",
        }

        for active_id, skill_tag in active_skill_tags.items():
            with self.subTest(active_id=active_id):
                inventory = GemInventory(self.definitions)
                board = SudokuGemBoard(load_board_rules(self.config_root), inventory)
                calculator = SkillEffectCalculator(
                    board=board,
                    definitions=self.definitions,
                    skill_templates=load_skill_templates(self.config_root),
                    relation_coefficients=load_relation_coefficients(self.config_root),
                    scaling_rules=load_skill_scaling_rules(self.config_root),
                    affix_definitions={},
                )
                shape_supports = [
                    definition
                    for definition in self.definitions.values()
                    if definition.category == "skill_shape_modifier"
                    and skill_tag in definition.apply_filter_tags_all
                ]

                self.assertEqual(len(shape_supports), 5)
                inventory.add_instance("active", active_id)
                board.mount_gem("active", 0, 0)
                for index, support_definition in enumerate(
                    sorted(shape_supports, key=lambda definition: definition.sudoku_digit)
                ):
                    instance_id = f"shape_{index}"
                    inventory.add_instance(instance_id, support_definition.base_gem_id)
                    board.mount_gem(instance_id, 0, index + 1)

                final_skill = calculator.calculate_all()[0]

                self.assertEqual(
                    set(final_skill.shape_effects),
                    {definition.shape_effect for definition in shape_supports},
                )

    def test_only_active_skill_gems_generate_final_skill_instances(self) -> None:
        self.inventory.add_instance("active", "active_fire_bolt")
        self.inventory.add_instance("passive", "passive_fire_focus")
        self.inventory.add_instance("support", "support_fire_mastery")
        self.board.mount_gem("active", 0, 0)
        self.board.mount_gem("passive", 1, 0)
        self.board.mount_gem("support", 1, 3)

        final_skills = self.calculator.calculate_all()

        self.assertEqual(len(final_skills), 1)
        self.assertEqual(final_skills[0].active_gem_instance_id, "active")


if __name__ == "__main__":
    unittest.main()
