from __future__ import annotations

import shutil
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT))

from liufang.config import (  # noqa: E402
    load_affix_definitions,
    load_character_panel_sections,
    load_player_base_stats,
    load_player_stat_definitions,
)
from liufang.web_api import V1WebAppApi  # noqa: E402
from tools import validate_v1_configs  # noqa: E402


OBSOLETE_STATS = {
    "pickup_radius",
    "active_skill_slots",
    "passive_skill_slots",
    "skill_slots_active",
}

SKILL_SHAPE_PANEL_STATS = {
    "area_add_percent",
    "area_final_percent",
    "projectile_count_add",
    "chain_count_add",
    "pierce_count_add",
    "duration_add_percent",
    "skill_effect_frequency_add_percent",
    "explosion_radius_add_percent",
}

BOARD_POWER_PANEL_STATS = {
    "source_power_row",
    "source_power_column",
    "source_power_box",
    "source_power_adjacent",
    "target_power_row",
    "target_power_column",
    "target_power_box",
    "target_power_adjacent",
    "conduit_power_row",
    "conduit_power_column",
    "conduit_power_box",
    "relation_effect_final_percent",
    "adjacent_bonus_final_percent",
}


class PlayerStatsPanelTest(unittest.TestCase):
    def setUp(self) -> None:
        self.config_root = ROOT / "configs"

    def temp_config_root(self) -> Path:
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        target = Path(temp.name) / "configs"
        shutil.copytree(self.config_root, target)
        return target

    def test_stat_definitions_have_v1_metadata_and_no_obsolete_ids(self) -> None:
        definitions = load_player_stat_definitions(self.config_root)

        self.assertFalse(OBSOLETE_STATS & set(definitions))
        for required in [
            "max_life",
            "current_life",
            "life_return_percent",
            "move_speed",
            "max_mana",
            "max_energy_shield",
            "shield_return_percent",
            "armor",
            "evasion",
            "hit_damage_add_percent",
            "elemental_damage_add_percent",
            "base_crit_chance_percent",
            "crit_rating",
            "crit_damage_rating",
            "cannot_crit",
            "chain_count_add",
            "pierce_count_add",
            "source_power_row",
            "target_power_box",
            "conduit_power_column",
        ]:
            self.assertIn(required, definitions)
            self.assertTrue(definitions[required].runtime_effective)

        for excluded in [
            "support_link_limit",
            "mana_cost_multiplier_percent",
            "mana_seal_percent",
            "projectile_spread_angle_add",
            "active_gem_level_add",
            "passive_gem_level_add",
            "support_gem_level_add",
            "gem_level",
        ]:
            self.assertIn(excluded, definitions)
            self.assertFalse(definitions[excluded].runtime_effective)
            self.assertFalse(definitions[excluded].affix_spawn_enabled_v1)

        for definition in definitions.values():
            if definition.v1_status != "V1_ACTIVE":
                self.assertFalse(definition.affix_spawn_enabled_v1)

    def test_base_stats_and_affixes_reference_legal_spawn_enabled_stats(self) -> None:
        definitions = load_player_stat_definitions(self.config_root)
        base_stats = load_player_base_stats(self.config_root)
        affix_enabled = {
            stat_id
            for stat_id, definition in definitions.items()
            if definition.affix_spawn_enabled_v1
        }

        self.assertFalse(OBSOLETE_STATS & set(base_stats))
        self.assertTrue({stat_id for stat_id, definition in definitions.items() if definition.runtime_effective}.issubset(base_stats))
        for affix in load_affix_definitions(self.config_root):
            self.assertIn(affix.stat, affix_enabled)

    def test_character_panel_config_binds_existing_stats(self) -> None:
        definitions = load_player_stat_definitions(self.config_root)
        sections = load_character_panel_sections(self.config_root)

        self.assertTrue(sections)
        bound_stats = {row.stat_id for section in sections for row in section.rows}
        self.assertIn("strength", bound_stats)
        self.assertIn("current_life", bound_stats)
        self.assertIn("move_speed", bound_stats)
        self.assertFalse(OBSOLETE_STATS & bound_stats)
        self.assertFalse(SKILL_SHAPE_PANEL_STATS & bound_stats)
        self.assertFalse(BOARD_POWER_PANEL_STATS & bound_stats)
        self.assertFalse(any(section.section_id == "skill_shape" for section in sections))
        self.assertFalse(any(section.section_id == "board_power" for section in sections))
        self.assertTrue(bound_stats.issubset(definitions))

    def test_web_state_exposes_expanded_stats_and_configured_panel(self) -> None:
        state = V1WebAppApi(self.config_root).state()

        self.assertIn("character_panel", state)
        self.assertIn("strength", state["player_stats"])
        self.assertEqual(state["player_stats"]["max_life"]["value"], 500)
        self.assertEqual(state["player_stats"]["max_life"]["trace"]["primary_attribute"], 5)
        self.assertEqual(state["player_stats"]["max_mana"]["value"], 100)
        self.assertEqual(state["player_stats"]["life_regen_flat"]["value"], 10)
        self.assertEqual(state["player_stats"]["life_return_percent"]["value"], 0)
        self.assertEqual(state["player_stats"]["mana_regen_flat"]["value"], 8)
        self.assertEqual(state["player_stats"]["shield_return_percent"]["value"], 0)
        self.assertEqual(state["player_stats"]["derived_crit_chance_percent"]["value"], 5)
        self.assertEqual(state["player_stats"]["derived_crit_damage_percent"]["value"], 150)
        self.assertEqual(state["player_stats"]["move_speed"]["value"], 250.0)
        self.assertEqual(state["player_stats"]["strength"]["v1_status"], "V1_ACTIVE")

        panel_rows = [
            (section, row)
            for section in state["character_panel"]["sections"]
            for row in section["rows"]
        ]
        flat_panel_rows = [row for _, row in panel_rows]
        self.assertTrue(any(row["stat_id"] == "strength" and row["label_text"] == "力量" for row in flat_panel_rows))
        self.assertTrue(any(row["stat_id"] == "current_life" for row in flat_panel_rows))
        self.assertTrue(
            any(
                row["stat_id"] == "life_return_percent"
                and section["id"] == "life"
                and row["label_text"] == "生命返还"
                and row["formatter"] == "percent"
                for section, row in panel_rows
            )
        )
        self.assertTrue(
            any(
                row["stat_id"] == "shield_return_percent"
                and section["id"] == "energy_shield"
                and row["label_text"] == "护盾返还"
                and row["formatter"] == "percent"
                for section, row in panel_rows
            )
        )
        self.assertTrue(any(row["stat_id"] == "crit_damage_rating" and row["formatter"] == "rating" for row in flat_panel_rows))
        self.assertFalse(any(row["stat_id"] == "support_link_limit" for row in flat_panel_rows))
        self.assertFalse(any(row["stat_id"] == "gem_level" for row in flat_panel_rows))
        self.assertFalse(any(row["stat_id"] == "elemental_resistance_percent" for row in flat_panel_rows))
        self.assertFalse(any(row["stat_id"] in SKILL_SHAPE_PANEL_STATS for row in flat_panel_rows))
        self.assertFalse(any(row["stat_id"] in BOARD_POWER_PANEL_STATS for row in flat_panel_rows))

    def test_character_panel_reflects_active_skill_modifier_deltas(self) -> None:
        api = V1WebAppApi(self.config_root)
        active = api.inventory.add_instance("active", "active_penetrating_shot")
        support = api.inventory.add_instance("support", "support_shotgun")
        conduit = api.inventory.add_instance("conduit", "support_box_conduit")
        api.board.mount_gem(active.instance_id, 4, 4)
        api.board.mount_gem(support.instance_id, 4, 3)
        api.board.mount_gem(conduit.instance_id, 3, 4)

        state = api.state()
        panel_rows = {
            row["stat_id"]: row
            for section in state["character_panel"]["sections"]
            for row in section["rows"]
        }

        self.assertEqual(state["player_stats"]["projectile_speed_add_percent"]["value"], 0)
        self.assertEqual(panel_rows["projectile_speed_add_percent"]["value"], -25)

    def test_character_panel_folds_elemental_resistance_into_three_element_rows(self) -> None:
        config_root = self.temp_config_root()
        base_stats_path = config_root / "player" / "player_base_stats.toml"
        base_stats_path.write_text(
            base_stats_path.read_text(encoding="utf-8")
            .replace("fire_resistance_percent = 0", "fire_resistance_percent = 1")
            .replace("cold_resistance_percent = 0", "cold_resistance_percent = 2")
            .replace("lightning_resistance_percent = 0", "lightning_resistance_percent = 3")
            .replace("chaos_resistance_percent = 0", "chaos_resistance_percent = 4")
            .replace("elemental_resistance_percent = 0", "elemental_resistance_percent = 5"),
            encoding="utf-8",
        )

        state = V1WebAppApi(config_root).state()
        resistance_rows = [
            row
            for section in state["character_panel"]["sections"]
            if section["layout"] == "resistance"
            for row in section["rows"]
        ]
        values = {row["stat_id"]: row["value"] for row in resistance_rows}

        self.assertEqual(values["fire_resistance_percent"], 6)
        self.assertEqual(values["cold_resistance_percent"], 7)
        self.assertEqual(values["lightning_resistance_percent"], 8)
        self.assertEqual(values["chaos_resistance_percent"], 4)
        self.assertNotIn("elemental_resistance_percent", values)

    def test_validation_rejects_obsolete_player_stat_references(self) -> None:
        config_root = self.temp_config_root()
        stat_defs = config_root / "player" / "player_stat_defs.toml"
        stat_defs.write_text(
            stat_defs.read_text(encoding="utf-8")
            + '\n[[stats]]\nid = "skill_slots_active"\nname_key = "stat.max_life.name"\ncategory = "runtime"\nvalue_type = "integer"\nv1_status = "V1_ACTIVE"\nruntime_effective = true\naffix_spawn_enabled_v1 = false\n',
            encoding="utf-8",
        )

        old_configs = validate_v1_configs.CONFIGS
        try:
            validate_v1_configs.CONFIGS = config_root
            errors = validate_v1_configs.validate()
        finally:
            validate_v1_configs.CONFIGS = old_configs

        self.assertTrue(any("obsolete" in error and "skill_slots_active" in error for error in errors))

    def test_validation_rejects_cooldown_reduction_percent_references(self) -> None:
        config_root = self.temp_config_root()
        stat_defs = config_root / "player" / "player_stat_defs.toml"
        stat_defs.write_text(
            stat_defs.read_text(encoding="utf-8")
            + '\n[[stats]]\nid = "cooldown_reduction_percent"\nname_key = "stat.cooldown_recovery_add_percent.name"\ncategory = "speed"\nvalue_type = "percent"\nv1_status = "V1_ACTIVE"\nruntime_effective = true\naffix_spawn_enabled_v1 = false\n',
            encoding="utf-8",
        )

        old_configs = validate_v1_configs.CONFIGS
        try:
            validate_v1_configs.CONFIGS = config_root
            errors = validate_v1_configs.validate()
        finally:
            validate_v1_configs.CONFIGS = old_configs

        self.assertTrue(any("cooldown_reduction_percent" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
