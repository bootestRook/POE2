from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from liufang.gem_combination_report import (  # noqa: E402
    generate_gem_combination_report,
    report_to_markdown,
)


class GemCombinationReportTest(unittest.TestCase):
    def setUp(self) -> None:
        self.config_root = ROOT / "configs"

    def temp_config_root(self) -> Path:
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        target = Path(temp.name) / "configs"
        shutil.copytree(self.config_root, target)
        return target

    def case_by_name(self, report: dict, name: str) -> dict:
        return next(case for case in report["cases"] if case["case"] == name)

    def test_fire_bolt_support_passive_stack_reaches_runtime(self) -> None:
        report = generate_gem_combination_report(self.config_root)
        case = self.case_by_name(report, "fire_bolt_supports_and_passive")

        self.assertTrue(case["board_valid"])
        self.assertTrue(case["checks"]["projectile_count_changed"])
        self.assertTrue(case["checks"]["damage_changed_by_fire_supports"])
        self.assertTrue(case["checks"]["projectile_spawn_matches_count"])
        self.assertEqual(case["combo"]["projectile_count"], 2)
        self.assertEqual(case["runtime_event_counts"]["projectile_spawn"], 2)

    def test_frost_nova_area_combo_keeps_cooldown_faster_than_baseline(self) -> None:
        report = generate_gem_combination_report(self.config_root)
        case = self.case_by_name(report, "frost_nova_area_and_cooldown_interaction")

        self.assertTrue(case["checks"]["area_radius_increased"])
        self.assertTrue(case["checks"]["area_support_applied"])
        self.assertTrue(case["checks"]["cooldown_focus_applied"])
        self.assertGreater(case["combo"]["radius"], case["baseline"]["radius"])
        self.assertLess(case["combo"]["final_cooldown_ms"], case["baseline"]["final_cooldown_ms"])
        self.assertLess(case["combo"]["actual_interval_ms"], case["baseline"]["actual_interval_ms"])
        self.assertEqual(case["observations"], [])

    def test_same_row_conduit_is_reported(self) -> None:
        report = generate_gem_combination_report(self.config_root)
        case = self.case_by_name(report, "same_row_conduit_amplification")

        self.assertTrue(case["checks"]["conduit_multiplier_present"])
        self.assertTrue(case["checks"]["conduit_increases_support_value"])
        self.assertGreater(
            case["combo_with_conduit"]["final_damage"],
            case["baseline_same_row_support"]["final_damage"],
        )
        conduit_modifiers = [
            modifier for modifier in case["combo_with_conduit"]["applied_modifiers"]
            if modifier["stat"] == "conduit_multiplier"
        ]
        self.assertEqual(len(conduit_modifiers), 1)
        self.assertEqual(case["observations"], [])

    def test_self_stat_passives_apply(self) -> None:
        report = generate_gem_combination_report(self.config_root)
        case = self.case_by_name(report, "self_stat_passives")

        self.assertTrue(case["checks"]["max_life_increased"])
        self.assertTrue(case["checks"]["move_speed_increased"])
        self.assertEqual(case["player_stats"]["max_life"]["value"], 525)
        self.assertEqual(case["player_stats"]["move_speed"]["value"], 275.0)

    def test_markdown_report_summarizes_cases(self) -> None:
        markdown = report_to_markdown(generate_gem_combination_report(self.config_root))

        self.assertIn("# Gem Combination Effect Report", markdown)
        self.assertIn("fire_bolt_supports_and_passive", markdown)
        self.assertIn("frost_nova_area_and_cooldown_interaction", markdown)
        self.assertIn("- Observations: 0", markdown)
        self.assertNotIn("Observation:", markdown)

    def test_cli_is_non_destructive(self) -> None:
        config_root = self.temp_config_root()
        watched = config_root / "skills" / "active" / "active_fire_bolt" / "skill.yaml"
        before = watched.read_text(encoding="utf-8")
        markdown_path = config_root.parent / "gem-combination-report.md"

        completed = subprocess.run(
            [
                sys.executable,
                str(ROOT / "tools" / "generate_gem_combination_report.py"),
                "--config-root",
                str(config_root),
                "--markdown",
                str(markdown_path),
            ],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=True,
        )

        self.assertIn('"non_destructive": true', completed.stdout)
        self.assertTrue(markdown_path.exists())
        self.assertEqual(watched.read_text(encoding="utf-8"), before)


if __name__ == "__main__":
    unittest.main()
