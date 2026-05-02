from __future__ import annotations

import random
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from liufang.affixes import AffixGenerationError, AffixGenerator
from liufang.config import (
    AffixDefinition,
    load_affix_definitions,
    load_board_rules,
    load_gem_definitions,
    load_rarity_affix_counts,
    load_rarity_weights,
)
from liufang.gem_board import SudokuGemBoard
from liufang.inventory import GemInventory
from liufang.loot import LootRuntime


class LootInventoryTest(unittest.TestCase):
    def setUp(self) -> None:
        self.config_root = ROOT / "configs"
        self.definitions = load_gem_definitions(self.config_root)
        self.affixes = load_affix_definitions(self.config_root)
        self.rarity_counts = load_rarity_affix_counts(self.config_root)

    def generator(self, seed: int = 1) -> AffixGenerator:
        return AffixGenerator(self.affixes, self.rarity_counts, random.Random(seed))

    def test_rarity_controls_random_affix_count(self) -> None:
        gem = self.definitions["active_fire_bolt"]
        generator = self.generator()

        self.assertEqual(generator.generate_for_gem(gem, "normal"), ())
        self.assertEqual(len(generator.generate_for_gem(gem, "magic")), 1)
        rare_rolls = generator.generate_for_gem(gem, "rare")
        self.assertEqual(len(rare_rolls), 2)
        self.assertEqual(len({roll.affix_id for roll in rare_rolls}), 2)
        self.assertEqual(len({roll.group for roll in rare_rolls}), 2)

    def test_gem_kind_and_sudoku_digit_are_loaded_for_three_kinds(self) -> None:
        kinds = {definition.gem_kind for definition in self.definitions.values()}
        self.assertEqual(kinds, {"active_skill", "passive_skill", "support"})
        self.assertTrue(all(1 <= definition.sudoku_digit <= 9 for definition in self.definitions.values()))
        self.assertEqual(self.definitions["active_fire_bolt"].gem_kind, "active_skill")
        self.assertEqual(self.definitions["passive_fire_focus"].gem_kind, "passive_skill")
        self.assertEqual(self.definitions["support_fire_mastery"].gem_kind, "support")

    def test_candidate_shortage_returns_chinese_keyed_error(self) -> None:
        definition = AffixDefinition(
            affix_id="only_damage",
            gen="prefix",
            category="skill_numeric",
            stat="damage_add_percent",
            value_range=(1, 1),
            group="damage_scaling",
            spawn_weights={"active_skill_gem": 100},
            apply_filter_tags=frozenset(),
        )
        generator = AffixGenerator([definition], {"rare": 2}, random.Random(1))

        with self.assertRaises(AffixGenerationError) as raised:
            generator.generate_for_gem(self.definitions["active_fire_bolt"], "rare")
        self.assertEqual(raised.exception.error_key, "affix.error.candidate_shortage")
        self.assertEqual(raised.exception.message, "可用词缀候选不足")

    def test_drop_generation_creates_instance_without_random_affixes(self) -> None:
        loot = LootRuntime.from_configs(
            self.config_root,
            self.definitions,
            {"rare": 1},
            self.generator(2),
            rng=random.Random(2),
        )

        instance = loot.generate_drop()
        self.assertTrue(instance.instance_id.startswith("gem_inst_"))
        self.assertIn(instance.base_gem_id, self.definitions)
        self.assertIn(instance.gem_kind, {"active_skill", "passive_skill", "support"})
        self.assertGreaterEqual(instance.sudoku_digit, 1)
        self.assertLessEqual(instance.sudoku_digit, 9)
        self.assertEqual(instance.rarity, "rare")
        self.assertEqual(instance.random_affixes, ())
        self.assertEqual(instance.implicit_affixes, ())
        self.assertIsNone(instance.board_position)
        self.assertFalse(hasattr(instance, "skill_template"))

    def test_player_drop_quantity_and_rarity_stats_affect_generation(self) -> None:
        loot = LootRuntime.from_configs(
            self.config_root,
            self.definitions,
            {"normal": 100, "magic": 10, "rare": 5},
            self.generator(2),
            player_stats={
                "gem_drop_quantity_add_percent": 200,
                "gem_drop_rarity_add_percent": 100,
            },
            rng=random.Random(2),
        )

        drops = loot.generate_drops()

        self.assertEqual(len(drops), 3)
        self.assertEqual(loot._rarity_weights_with_player_bonus(), {"normal": 100, "magic": 20, "rare": 15})

    def test_pickup_inventory_lock_filter_and_sort(self) -> None:
        inventory = GemInventory(self.definitions)
        loot = LootRuntime.from_configs(
            self.config_root,
            self.definitions,
            load_rarity_weights(self.config_root),
            self.generator(3),
            rng=random.Random(3),
        )
        first = loot.pickup(loot.generate_drop(), inventory)
        second = inventory.add_instance("manual_magic", "active_fire_bolt", rarity="magic")

        inventory.set_locked(first.instance_id, True)
        self.assertTrue(inventory.require(first.instance_id).locked)
        self.assertEqual(inventory.filter_instances(rarity="magic"), [second])
        self.assertIn(second, inventory.filter_instances(tag="active_skill_gem"))
        self.assertEqual(inventory.filter_instances(base_gem_id="active_fire_bolt"), [second])
        self.assertEqual(
            [instance.instance_id for instance in inventory.sort_instances("acquired_order")],
            [first.instance_id, "manual_magic"],
        )
        self.assertEqual(
            [instance.instance_id for instance in inventory.sort_instances("base_gem_id")],
            sorted([first.instance_id, "manual_magic"], key=lambda value: inventory.require(value).base_gem_id),
        )

    def test_board_mount_unmount_preserves_empty_affixes_and_locked_state(self) -> None:
        inventory = GemInventory(self.definitions)
        loot = LootRuntime.from_configs(
            self.config_root,
            self.definitions,
            {"rare": 1},
            self.generator(4),
            rng=random.Random(4),
        )
        instance = loot.pickup(loot.generate_drop(), inventory)
        inventory.set_locked(instance.instance_id, True)
        board = SudokuGemBoard(load_board_rules(self.config_root), inventory)

        board.mount_gem(instance.instance_id, 0, 0)
        board.unmount_gem(instance.instance_id)

        stored = inventory.require(instance.instance_id)
        self.assertEqual(stored.random_affixes, ())
        self.assertEqual(stored.implicit_affixes, ())
        self.assertTrue(stored.locked)
        self.assertIsNone(stored.board_position)


if __name__ == "__main__":
    unittest.main()
