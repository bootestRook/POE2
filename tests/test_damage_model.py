from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from liufang.damage_model import DamageConversion, calculate_converted_hit_damage, convert_damage_components


class DamageModelTest(unittest.TestCase):
    def test_conversion_over_100_percent_is_weighted_by_conversion_percent(self) -> None:
        converted = convert_damage_components(
            {"physical": 100},
            (
                DamageConversion("physical", "cold", 80),
                DamageConversion("physical", "fire", 80),
            ),
        )

        self.assertEqual(converted, {"cold": {"physical": 50.0}, "fire": {"physical": 50.0}})

    def test_converted_damage_uses_source_and_target_type_increases(self) -> None:
        final_damage, components, converted, increase_pool = calculate_converted_hit_damage(
            base_components={"physical": 100},
            conversions=(DamageConversion("physical", "cold", 100),),
            stats={
                "damage_add_percent": 10,
                "physical_damage_add_percent": 20,
                "cold_damage_add_percent": 30,
                "elemental_damage_add_percent": 40,
            },
            tags=frozenset({"attack"}),
            behavior_template="projectile",
            behavior_type="projectile",
            final_pool=0,
        )

        self.assertEqual(converted, {"cold": {"physical": 100.0}})
        self.assertAlmostEqual(increase_pool, 100.0)
        self.assertAlmostEqual(final_damage, 200.0)
        self.assertAlmostEqual(components["cold"], 200.0)


if __name__ == "__main__":
    unittest.main()
