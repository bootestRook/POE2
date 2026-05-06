from __future__ import annotations

import sys
import unittest
from collections import Counter
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
from liufang.equipment import (
    EquipmentAffixDefinition,
    EquipmentAffixRoll,
    EquipmentItem,
    classify_all_equipment_affix_effects,
    equipment_affix_definitions_by_raw,
    equipment_effect_alignment_report,
    equipment_stat_modifiers,
    load_equipment_affix_definitions,
)
from liufang.gem_board import SudokuGemBoard
from liufang.inventory import GemInventory
from liufang.player_stats import aggregate_player_stats
from liufang.skill_effects import SkillEffectCalculator
from liufang.skill_runtime import SkillRuntime


class EquipmentEffectRuntimeTest(unittest.TestCase):
    def setUp(self) -> None:
        self.config_root = ROOT / "configs"
        self.equipment_definitions = load_equipment_affix_definitions(
            ROOT / "tlidb_equips" / "tlidb_craft_affixes.md"
        )
        self.gem_definitions = load_gem_definitions(self.config_root)
        self.skill_templates = load_skill_templates(self.config_root)
        self.board_rules = load_board_rules(self.config_root)
        self.relation_coefficients = load_relation_coefficients(self.config_root)
        self.scaling_rules = load_skill_scaling_rules(self.config_root)
        self.affixes = {definition.affix_id: definition for definition in load_affix_definitions(self.config_root)}

    def test_classification_covers_all_raw_tlidb_modifiers(self) -> None:
        grouped = equipment_affix_definitions_by_raw(self.equipment_definitions)
        mappings = classify_all_equipment_affix_effects(self.equipment_definitions)
        status_counts = Counter(mapping.status for mapping in mappings.values())

        self.assertEqual(len(self.equipment_definitions), 7893)
        self.assertEqual(len(grouped), 2121)
        self.assertEqual(set(mappings), set(grouped))
        self.assertEqual(set(status_counts), {"mapped_effect", "disabled"})
        self.assertEqual(status_counts["disabled"], 487)
        self.assertGreater(status_counts["mapped_effect"], 1600)
        self.assertEqual(status_counts.get("requires_design_alignment", 0), 0)
        self.assertTrue(all(mapping.alignment is None for mapping in mappings.values() if mapping.status != "requires_design_alignment"))

    def test_disabled_and_alignment_modifiers_do_not_emit_runtime_operations(self) -> None:
        mappings = classify_all_equipment_affix_effects(self.equipment_definitions)
        self.assertEqual(mappings["140700201"].status, "disabled")
        self.assertEqual(mappings["140700201"].operations, ())
        self.assertEqual(mappings["1506017"].status, "mapped_effect")
        self.assertEqual(mappings["1506017"].operations[0].stat, "self_true_damage_per_100ms")
        self.assertEqual(mappings["116800101"].status, "disabled")
        self.assertEqual(mappings["116800101"].disabled_reason, "unsupported_mechanic:战吼")
        self.assertEqual(mappings["140201501"].status, "disabled")
        self.assertEqual(mappings["140201501"].disabled_reason, "unsupported_mechanic:恶兆")
        self.assertEqual(mappings["115800301"].status, "mapped_effect")
        self.assertEqual(mappings["115800301"].operations[0].stat, "block_life_recovery_percent")

        report = equipment_effect_alignment_report(self.equipment_definitions)
        self.assertFalse(any(item.source_modifier_id == "1506017" for item in report))

    def test_scaled_equipment_affix_emits_player_stat_modifier(self) -> None:
        definition = self._definition("108700001", tier=3)
        item = self._item(definition)

        modifiers = equipment_stat_modifiers((item,), definitions=self.equipment_definitions)
        self.assertEqual(len(modifiers), 1)
        self.assertEqual(modifiers[0].stat, "fire_resistance_percent")
        self.assertEqual(modifiers[0].source_modifier_id, "108700001")
        self.assertAlmostEqual(modifiers[0].value, 16.0)

        context = aggregate_player_stats({}, modifiers)
        self.assertAlmostEqual(context.values["fire_resistance_percent"], 16.0)

    def test_equipment_player_stat_feeds_skill_calculator_player_context(self) -> None:
        item = self._item(self._definition("1507000"))
        calculator = self._calculator("active_burning_shot", item)

        player = type("Player", (), {"max_life": 100.0, "current_life": 100.0})()
        calculator.apply_player_stat_contributions(player)

        self.assertAlmostEqual(player.max_life, 164.0)
        self.assertAlmostEqual(player.current_life, 164.0)

    def test_equipment_skill_area_stat_scales_final_skill_runtime_radius(self) -> None:
        baseline = self._calculator("active_black_hole").calculate_all()[0]
        equipped = self._calculator("active_black_hole", self._item(self._definition("1507009"))).calculate_all()[0]

        self.assertAlmostEqual(equipped.skill_stats["area_add_percent"], 22.0)
        self.assertAlmostEqual(equipped.area_multiplier, 1.22)
        self.assertAlmostEqual(equipped.runtime_params["radius"], baseline.runtime_params["radius"] * 1.22)

    def test_equipment_added_fire_damage_enters_damage_model(self) -> None:
        baseline = self._calculator("active_burning_shot").calculate_all()[0]
        equipped = self._calculator("active_burning_shot", self._item(self._definition("1500801"))).calculate_all()[0]

        self.assertAlmostEqual(equipped.skill_stats["added_fire_damage"], 14.5)
        self.assertGreater(equipped.final_damage, baseline.final_damage)
        self.assertGreater(equipped.final_damage_components["fire"], baseline.final_damage_components["fire"])

    def test_equipment_on_kill_explosion_reuses_damage_event_payload(self) -> None:
        final_skill = self._calculator("active_burning_shot", self._item(self._definition("1501120"))).calculate_all()[0]

        self.assertAlmostEqual(final_skill.runtime_params["on_kill_explosion_chance_percent"], 22.5)
        self.assertAlmostEqual(final_skill.runtime_params["on_kill_explosion_radius"], 6.0)
        self.assertAlmostEqual(final_skill.runtime_params["on_kill_explosion_max_life_percent"], 275.0)
        self.assertEqual(final_skill.runtime_params["on_kill_explosion_damage_type"], "true")

        events = SkillRuntime().execute(
            final_skill,
            source_entity="player",
            source_position=Position(0, 0),
            target_entity="monster_1",
            target_position=Position(100, 0),
            timestamp_ms=10,
        )
        damage = next(event for event in events if event.type == "damage")

        self.assertAlmostEqual(damage.payload["on_kill_explosion_chance_percent"], 22.5)
        self.assertAlmostEqual(damage.payload["on_kill_explosion_radius"], 6.0)
        self.assertAlmostEqual(damage.payload["on_kill_explosion_max_life_percent"], 275.0)
        self.assertEqual(damage.payload["on_kill_explosion_damage_type"], "true")

    def test_rolled_equipment_on_kill_explosion_reuses_damage_event_payload(self) -> None:
        definition = self._definition("1501120")
        item = EquipmentItem(
            instance_id="rolled_on_kill_explosion",
            source=definition.source,
            level=100,
            rarity="test",
            base_affix=EquipmentAffixRoll(
                affix_id=definition.affix_id,
                source_modifier_id=definition.source_modifier_id,
                library=definition.library,
                gen=definition.gen,
                tier=definition.tier,
                effect="攻击或者法术击败敌人时 21% 几率爆炸，对半径 6 米内的敌人造成被击败的敌人最大生命 289% 的真实伤害",
                family_id=definition.family_id,
            ),
        )
        final_skill = self._calculator("active_burning_shot", item).calculate_all()[0]

        self.assertAlmostEqual(final_skill.runtime_params["on_kill_explosion_chance_percent"], 21.0)
        self.assertAlmostEqual(final_skill.runtime_params["on_kill_explosion_radius"], 6.0)
        self.assertAlmostEqual(final_skill.runtime_params["on_kill_explosion_max_life_percent"], 289.0)

        events = SkillRuntime().execute(
            final_skill,
            source_entity="player",
            source_position=Position(0, 0),
            target_entity="monster_1",
            target_position=Position(100, 0),
            timestamp_ms=10,
        )
        damage = next(event for event in events if event.type == "damage")

        self.assertAlmostEqual(damage.payload["on_kill_explosion_chance_percent"], 21.0)
        self.assertAlmostEqual(damage.payload["on_kill_explosion_radius"], 6.0)
        self.assertAlmostEqual(damage.payload["on_kill_explosion_max_life_percent"], 289.0)
        self.assertEqual(damage.payload["on_kill_explosion_damage_type"], "true")

    def test_equipment_resistance_cap_maps_to_player_caps_without_resistance_value(self) -> None:
        item = self._item(self._definition("1507014"))

        modifiers = equipment_stat_modifiers((item,), definitions=self.equipment_definitions)

        by_stat = {modifier.stat: modifier.value for modifier in modifiers}
        self.assertEqual(by_stat["max_fire_resistance_percent"], 4.0)
        self.assertEqual(by_stat["max_cold_resistance_percent"], 4.0)
        self.assertEqual(by_stat["max_lightning_resistance_percent"], 4.0)
        self.assertNotIn("elemental_resistance_percent", by_stat)

    def test_equipment_flat_natural_life_regen_maps_to_player_regen(self) -> None:
        flat_item = self._item(self._definition("104700101"))
        percent_item = self._item(self._definition("104600201"))

        flat_modifiers = equipment_stat_modifiers((flat_item,), definitions=self.equipment_definitions)
        flat_by_stat = {modifier.stat: modifier.value for modifier in flat_modifiers}
        percent_modifiers = equipment_stat_modifiers((percent_item,), definitions=self.equipment_definitions)

        self.assertAlmostEqual(flat_by_stat["life_regen_flat"], 289.5)
        self.assertNotIn("max_life", flat_by_stat)
        self.assertFalse(any(modifier.stat == "life_regen_flat" for modifier in percent_modifiers))

    def test_equipment_safe_existing_stat_mappings_cover_unblocked_generic_effects(self) -> None:
        cases = {
            "1507013": ("aura_effect_add_percent", 7.5),
            "140700101": ("damage_add_percent", 61.5),
            "107340601": ("dot_damage_add_percent", 92.5),
            "140080905": ("shield_return_percent", 13.5),
            "105700201": ("block_damage_reduction_percent", 11.5),
            "130080501": ("double_damage_chance_percent", 34.5),
        }

        for source_modifier_id, (stat, expected_value) in cases.items():
            with self.subTest(source_modifier_id=source_modifier_id):
                item = self._item(self._definition(source_modifier_id))
                modifiers = equipment_stat_modifiers((item,), definitions=self.equipment_definitions)
                by_stat = {modifier.stat: modifier.value for modifier in modifiers}

                self.assertAlmostEqual(by_stat[stat], expected_value)

    def test_equipment_local_energy_shield_percent_scales_base_energy_shield(self) -> None:
        base = self._definition("105720001")
        percent = self._definition("105720101")
        item = EquipmentItem(
            instance_id="shield_item",
            source=base.source,
            level=100,
            rarity="blue",
            base_affix=self._roll(base),
            suffix_affixes=(self._roll(percent),),
        )

        modifiers = equipment_stat_modifiers((item,), definitions=self.equipment_definitions)
        by_stat = {modifier.stat: modifier.value for modifier in modifiers}

        self.assertAlmostEqual(by_stat["max_energy_shield"], 453.0675)

    def test_equipment_incoming_conversion_and_armor_effectiveness_map_to_player_stats(self) -> None:
        conversion_item = self._item(self._definition("1507015"))
        armor_item = self._item(self._definition("1507017"))

        modifiers = equipment_stat_modifiers((conversion_item, armor_item), definitions=self.equipment_definitions)
        by_stat = {modifier.stat: modifier.value for modifier in modifiers}

        self.assertEqual(by_stat["incoming_conversion_physical_to_fire_percent"], 18.0)
        self.assertEqual(by_stat["non_physical_armor_effectiveness_percent"], 13.5)
        self.assertNotIn("physical_damage_add_percent", by_stat)
        self.assertNotIn("fire_damage_add_percent", by_stat)

    def test_equipment_crit_damage_reduction_maps_to_defense_stat(self) -> None:
        item = self._item(self._definition("1504016"))

        modifiers = equipment_stat_modifiers((item,), definitions=self.equipment_definitions)
        by_stat = {modifier.stat: modifier.value for modifier in modifiers}

        self.assertEqual(by_stat["crit_damage_taken_reduction_percent"], 16.0)
        self.assertNotIn("crit_damage_add_percent", by_stat)

    def test_equipment_local_weapon_modifiers_apply_to_base_affix_before_aggregation(self) -> None:
        item = EquipmentItem(
            instance_id="bow",
            source=self._definition("1500900").source,
            level=100,
            rarity="test",
            base_affix=self._roll(self._definition("1500900")),
            prefix_affixes=(self._roll(self._definition("1500917")),),
            suffix_affixes=(self._roll(self._definition("1500918")),),
        )

        modifiers = equipment_stat_modifiers((item,), definitions=self.equipment_definitions)
        weapon_damage = next(modifier.value for modifier in modifiers if modifier.stat == "weapon_attack_base_damage")

        self.assertAlmostEqual(weapon_damage, 164.58)

    def test_equipment_ignite_and_aggravation_effects_feed_existing_skill_runtime(self) -> None:
        ignite = self._calculator("active_burning_shot", self._item(self._definition("140061301"))).calculate_all()[0]
        aggravation = self._calculator("active_black_hole", self._item(self._definition("1503407"))).calculate_all()[0]

        self.assertAlmostEqual(ignite.ailments[0]["base_damage_per_second"], 525.6)
        self.assertAlmostEqual(aggravation.runtime_params["dot_damage_bonus_per_10_aggravation_percent"], 3.92)

    def test_equipment_immunity_and_return_affixes_map_to_player_state(self) -> None:
        trauma = self._item(self._definition("1502120"))
        frozen = self._item(self._definition("1502023"))
        returns = self._item(self._definition("1501121"))

        modifiers = equipment_stat_modifiers((trauma, frozen, returns), definitions=self.equipment_definitions)
        by_stat = {modifier.stat: modifier.value for modifier in modifiers}

        self.assertEqual(by_stat["immune_trauma"], 1.0)
        self.assertEqual(by_stat["immune_frozen"], 1.0)
        self.assertEqual(by_stat["life_return_percent"], 16.0)
        self.assertEqual(by_stat["shield_return_percent"], 16.0)

    def test_equipment_status_detail_affixes_feed_existing_ailment_runtime(self) -> None:
        immunity = self._item(self._definition("1502317"))
        aggravation_item = self._item(self._definition("116340201"))
        frostbite_item = self._item(self._definition("140211201"))
        ignite_duration_item = self._item(self._definition("140340301"))
        ignite_stack_item = self._item(self._definition("140231001"))
        numbed_item = self._item(self._definition("140700701"))

        modifiers = equipment_stat_modifiers((immunity,), definitions=self.equipment_definitions)
        by_stat = {modifier.stat: modifier.value for modifier in modifiers}
        self.assertEqual(by_stat["immune_chill"], 1.0)
        self.assertEqual(by_stat["immune_weakened"], 1.0)

        aggravation = self._calculator("active_black_hole", aggravation_item).calculate_all()[0]
        self.assertAlmostEqual(aggravation.skill_stats["aggravation_value_add"], 132.0)
        self.assertAlmostEqual(aggravation.runtime_params["aggravation_value"], 232.0)

        frostbite = self._calculator("active_ice_shot", frostbite_item).calculate_all()[0]
        frostbite_ailment = next(ailment for ailment in frostbite.ailments if ailment["type"] == "frostbite")
        self.assertAlmostEqual(frostbite_ailment["threshold"], 117.5)
        self.assertAlmostEqual(frostbite_ailment["max_value"], 117.5)

        ignite_duration = self._calculator("active_burning_shot", ignite_duration_item).calculate_all()[0]
        self.assertEqual(ignite_duration.ailments[0]["duration_ms"], 5680)

        ignite_stack = self._calculator("active_burning_shot", ignite_stack_item).calculate_all()[0]
        self.assertEqual(ignite_stack.ailments[0]["max_stacks"], 2)

        numbed = self._calculator("active_lightning_shot", numbed_item).calculate_all()[0]
        events = SkillRuntime().execute(
            numbed,
            source_entity="player",
            source_position=Position(0, 0),
            target_entity="monster_1",
            target_position=Position(100, 0),
            timestamp_ms=10,
        )
        numbed_status = next(event for event in events if event.type == "status_apply" and event.payload["status_type"] == "numbed")
        self.assertAlmostEqual(numbed_status.payload["effect_per_stack"], 7.25)

    def test_equipment_local_defense_and_elemental_weapon_base_affixes_aggregate(self) -> None:
        armor_item = self._item(self._definition("105700001"))
        weapon_item = EquipmentItem(
            instance_id="weapon",
            source=self._definition("106080001").source,
            level=100,
            rarity="test",
            base_affix=self._roll(self._definition("106080001")),
            prefix_affixes=(self._roll(self._definition("106080101")),),
        )

        modifiers = equipment_stat_modifiers((armor_item, weapon_item), definitions=self.equipment_definitions)
        by_stat = {modifier.stat: modifier.value for modifier in modifiers}

        self.assertAlmostEqual(by_stat["armor"], 2448.5)
        self.assertAlmostEqual(by_stat["weapon_attack_base_damage"], 41.0)
        self.assertAlmostEqual(by_stat["added_fire_damage"], 144.25)

    def test_equipment_cull_war_intent_and_aggression_affixes_map_to_runtime(self) -> None:
        cull = self._calculator("active_burning_shot", self._item(self._definition("1501111"))).calculate_all()[0]
        war = equipment_stat_modifiers((self._item(self._definition("130200601")), self._item(self._definition("1502112"))), definitions=self.equipment_definitions)
        spell_aggression = equipment_stat_modifiers((self._item(self._definition("1502127")),), definitions=self.equipment_definitions)

        self.assertAlmostEqual(cull.runtime_params["cull_threshold_percent"], 12.0)
        by_stat = {modifier.stat: modifier.value for modifier in war}
        self.assertEqual(by_stat["war_intent_enabled"], 1.0)
        self.assertAlmostEqual(by_stat["war_intent_effect_add_percent"], 17.5)
        aggression_stats = {modifier.stat: modifier.value for modifier in spell_aggression}
        self.assertEqual(aggression_stats["cast_speed_add_percent"], 7.0)
        self.assertEqual(aggression_stats["spell_damage_add_percent"], 7.0)

    def test_equipment_movement_affixes_map_to_player_runtime_stats(self) -> None:
        modifiers = equipment_stat_modifiers(
            (
                self._item(self._definition("104520501")),
                self._item(self._definition("140902701")),
            ),
            definitions=self.equipment_definitions,
        )

        by_stat = {modifier.stat: modifier.value for modifier in modifiers}
        self.assertEqual(by_stat["moving_shield_recovery_percent_per_second"], 3.0)
        self.assertEqual(by_stat["movement_barrier_distance"], 5.0)
        self.assertEqual(by_stat["movement_barrier_chance_percent"], 100.0)

    def test_equipment_block_recovery_affixes_map_to_player_runtime_stats(self) -> None:
        modifiers = equipment_stat_modifiers(
            (
                self._item(self._definition("115800301")),
                self._item(self._definition("115820301")),
            ),
            definitions=self.equipment_definitions,
        )

        by_stat = {modifier.stat: modifier.value for modifier in modifiers}
        self.assertEqual(by_stat["block_life_recovery_percent"], 4.0)
        self.assertEqual(by_stat["block_life_recovery_interval_ms"], 300.0)
        self.assertEqual(by_stat["block_shield_recovery_percent"], 4.0)
        self.assertEqual(by_stat["block_shield_recovery_interval_ms"], 300.0)

    def _calculator(self, skill_id: str, item: EquipmentItem | None = None) -> SkillEffectCalculator:
        inventory = GemInventory(self.gem_definitions)
        board = SudokuGemBoard(self.board_rules, inventory)
        inventory.add_instance("active", skill_id, level=1)
        board.mount_gem("active", 0, 0)
        return SkillEffectCalculator(
            board=board,
            definitions=self.gem_definitions,
            skill_templates=self.skill_templates,
            relation_coefficients=self.relation_coefficients,
            scaling_rules=self.scaling_rules,
            affix_definitions=self.affixes,
            equipment_items=(item,) if item is not None else (),
            equipment_affix_definitions=self.equipment_definitions,
        )

    def _definition(self, source_modifier_id: str, *, tier: int | None = None) -> EquipmentAffixDefinition:
        return next(
            definition
            for definition in self.equipment_definitions
            if definition.source_modifier_id == source_modifier_id and (tier is None or definition.tier == tier)
        )

    def _item(self, definition: EquipmentAffixDefinition) -> EquipmentItem:
        return EquipmentItem(
            instance_id=f"item_{definition.source_modifier_id}",
            source=definition.source,
            level=100,
            rarity="test",
            base_affix=self._roll(definition),
        )

    def _roll(self, definition: EquipmentAffixDefinition) -> EquipmentAffixRoll:
        return EquipmentAffixRoll(
            affix_id=definition.affix_id,
            source_modifier_id=definition.source_modifier_id,
            library=definition.library,
            gen=definition.gen,
            tier=definition.tier,
            effect=definition.effect,
            family_id=definition.family_id,
        )


if __name__ == "__main__":
    unittest.main()
