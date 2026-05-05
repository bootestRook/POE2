from __future__ import annotations

import random
import re
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from liufang.equipment import (
    EquipmentGenerationError,
    EquipmentGenerator,
    load_equipment_affix_definitions,
    prefix_suffix_capacity,
)


class EquipmentAffixGenerationTest(unittest.TestCase):
    def setUp(self) -> None:
        self.markdown_path = ROOT / "tlidb_equips" / "tlidb_craft_affixes.md"
        self.definitions = load_equipment_affix_definitions(self.markdown_path)
        self.generator = EquipmentGenerator(self.definitions, random.Random(7))

    def test_loads_source_scoped_base_affixes(self) -> None:
        dex_chest_base = [
            definition
            for definition in self.definitions
            if definition.source == "敏捷胸甲" and definition.library == "base"
        ]

        self.assertEqual(len(dex_chest_base), 18)
        self.assertTrue(any(definition.effect == "+(3–5)% 元素抗性上限" for definition in dex_chest_base))

    def test_base_affix_is_present_and_not_level_gated(self) -> None:
        item = self.generator.generate("敏捷胸甲", 1, "白色", instance_id="dex_chest")

        self.assertEqual(item.base_affix.library, "base")
        self.assertEqual(item.base_affix.gen, "base")
        self.assertEqual(item.ordinary_affixes, ())
        self.assertNotRegex(item.base_affix.effect, re.compile(r"\d+\s*[–-]\s*\d+"))

    def test_roll_instantiates_numeric_ranges_on_equipment_instance(self) -> None:
        item = self.generator.generate("力量头部", 86, "粉色", instance_id="str_head")
        range_pattern = re.compile(r"\d+\s*[–-]\s*\d+")

        self.assertNotRegex(item.base_affix.effect, range_pattern)
        self.assertTrue(item.ordinary_affixes)
        for affix in item.ordinary_affixes:
            self.assertNotRegex(affix.effect, range_pattern)

    def test_prefix_suffix_capacity_by_level(self) -> None:
        self.assertEqual(prefix_suffix_capacity(1), (1, 0))
        self.assertEqual(prefix_suffix_capacity(11), (1, 1))
        self.assertEqual(prefix_suffix_capacity(26), (2, 1))
        self.assertEqual(prefix_suffix_capacity(41), (2, 2))
        self.assertEqual(prefix_suffix_capacity(61), (3, 2))
        self.assertEqual(prefix_suffix_capacity(81), (3, 3))

    def test_generated_initial_t3_fire_resistance_uses_level_weight_and_scaled_value(self) -> None:
        definition = next(
            definition
            for definition in self.definitions
            if definition.source == "力量头部"
            and definition.library == "initial"
            and definition.gen == "suffix"
            and definition.tier == 3
            and definition.source_modifier_id == "108700001"
        )

        self.assertEqual(definition.required_level, 76)
        self.assertEqual(definition.weight, 800)
        self.assertEqual(definition.effect, "+(13–19)% 火焰抗性")

    def test_level_76_strength_head_initial_suffix_probability_pool(self) -> None:
        candidates = self.generator.candidates("力量头部", 76, library="initial", gen="suffix")
        fire_t3 = next(
            definition
            for definition in candidates
            if definition.source_modifier_id == "108700001" and definition.tier == 3
        )

        self.assertEqual(len(candidates), 40)
        self.assertEqual(sum(definition.weight for definition in candidates), 157600)
        self.assertEqual(fire_t3.weight, 800)
        self.assertAlmostEqual(
            self.generator.probability_for_candidate_pool(candidates, fire_t3.affix_id),
            800 / 157600,
        )

    def test_unsupported_mechanics_are_marked_and_excluded_from_candidates(self) -> None:
        minion_affix = next(
            definition
            for definition in self.definitions
            if definition.source_modifier_id == "140700201" and definition.tier == 1
        )
        blessing_affix = next(
            definition
            for definition in self.definitions
            if definition.source_modifier_id == "1500814"
        )
        spell_burst_affix = next(
            definition
            for definition in self.definitions
            if definition.source_modifier_id == "116700601"
        )

        self.assertFalse(minion_affix.enabled)
        self.assertIn("召唤物", minion_affix.disabled_reason)
        self.assertFalse(blessing_affix.enabled)
        self.assertIn("祝福", blessing_affix.disabled_reason)
        self.assertFalse(spell_burst_affix.enabled)
        self.assertIn("法术迸发", spell_burst_affix.disabled_reason)

        candidates = self.generator.candidates("力量头部", 86, library="initial", gen="prefix")
        self.assertNotIn(minion_affix.affix_id, {definition.affix_id for definition in candidates})

    def test_war_intent_and_channel_mechanics_are_kept(self) -> None:
        war_intent = next(
            definition
            for definition in self.definitions
            if definition.source_modifier_id == "130210601" and definition.library == "pinnacle"
        )
        channel = next(
            definition
            for definition in self.definitions
            if definition.source_modifier_id == "116140101" and definition.library == "pinnacle"
        )

        self.assertTrue(war_intent.enabled)
        self.assertEqual(war_intent.disabled_reason, "")
        self.assertTrue(channel.enabled)
        self.assertEqual(channel.disabled_reason, "")
        self.assertIn(
            war_intent.affix_id,
            {
                definition.affix_id
                for definition in self.generator.candidates("戒指", 100, library="pinnacle", gen="suffix")
            },
        )
        self.assertIn(
            channel.affix_id,
            {
                definition.affix_id
                for definition in self.generator.candidates("武杖", 100, library="pinnacle", gen="suffix")
            },
        )

    def test_pink_level_76_random_generation_is_capped_by_level_capacity(self) -> None:
        item = self.generator.generate("力量头部", 76, "粉色", instance_id="str_head")

        self.assertEqual(len(item.ordinary_affixes), 5)
        self.assertLessEqual(len(item.prefix_affixes), 3)
        self.assertLessEqual(len(item.suffix_affixes), 2)
        self.assertLessEqual(item.count_library("advanced"), 2)

    def test_crafting_enforces_advanced_cap(self) -> None:
        item = self.generator.generate("力量头部", 86, "白色", instance_id="str_head")
        item = self.generator.craft_affix(item, library="advanced", gen="prefix")
        item = self.generator.craft_affix(item, library="advanced", gen="prefix")

        with self.assertRaisesRegex(EquipmentGenerationError, "进阶词缀已达上限"):
            self.generator.craft_affix(item, library="advanced", gen="prefix")

    def test_crafting_enforces_pinnacle_level_gate_and_cap(self) -> None:
        low_item = self.generator.generate("力量头部", 99, "白色", instance_id="low_head")
        with self.assertRaisesRegex(EquipmentGenerationError, "100 级装备"):
            self.generator.craft_affix(low_item, library="pinnacle", gen="prefix")

        item = self.generator.generate("力量头部", 100, "白色", instance_id="high_head")
        item = self.generator.craft_affix(item, library="pinnacle", gen="prefix")
        item = self.generator.craft_affix(item, library="pinnacle", gen="prefix")
        with self.assertRaisesRegex(EquipmentGenerationError, "至臻词缀已达上限"):
            self.generator.craft_affix(item, library="pinnacle", gen="prefix")


if __name__ == "__main__":
    unittest.main()
