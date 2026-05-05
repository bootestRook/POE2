from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from liufang.skill_expression_calibration import (  # noqa: E402
    EXPRESSION_ACTIVE_PATHS,
    calibrate_skill_expression,
    calibration_report_to_markdown,
)


class SkillExpressionCalibrationTest(unittest.TestCase):
    def setUp(self) -> None:
        self.config_root = ROOT / "configs"

    def temp_config_root(self) -> Path:
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        target = Path(temp.name) / "configs"
        shutil.copytree(self.config_root, target)
        return target

    def test_report_uses_current_pov_not_dummy_balance(self) -> None:
        report = calibrate_skill_expression(self.config_root)

        self.assertEqual(report["mode"], "current_pov_expression_calibration")
        self.assertFalse(report["uses_dummy_balance"])
        self.assertFalse(report["damage_tuning_enabled"])
        self.assertEqual(report["current_pov"]["world_width"], 512)
        self.assertEqual(report["current_pov"]["world_height"], 512)
        self.assertEqual(report["current_pov"]["camera_zoom"], 0.22)
        self.assertGreater(report["current_pov"]["normal_spawn_distance_median"], 250)
        self.assertLess(report["current_pov"]["normal_spawn_distance_median"], 340)

    def test_active_recommendations_are_expression_only_when_present(self) -> None:
        report = calibrate_skill_expression(self.config_root)
        recommended_paths = {
            recommendation["path"]
            for skill in report["active_skills"]
            for recommendation in skill["recommendations"]
        }

        self.assertTrue(recommended_paths <= EXPRESSION_ACTIVE_PATHS)
        self.assertNotIn("hit.base_damage", recommended_paths)
        self.assertNotIn("hit.hit_radius", recommended_paths)
        self.assertNotIn("classification.damage_type", recommended_paths)

    def test_support_and_passive_notes_ignore_damage_values(self) -> None:
        report = calibrate_skill_expression(self.config_root)
        support_stats = {item["stat"] for item in report["support_expression"]}
        passive_stats = {item["stat"] for item in report["passive_expression"]}

        self.assertIn("projectile_count_add", support_stats)
        self.assertIn("area_add_percent", support_stats)
        self.assertNotIn("damage_add_percent", support_stats)
        self.assertNotIn("damage_final_percent", support_stats)
        self.assertNotIn("damage_add_percent", passive_stats)
        self.assertNotIn("damage_final_percent", passive_stats)

    def test_markdown_report_contains_recommendations(self) -> None:
        markdown = calibration_report_to_markdown(calibrate_skill_expression(self.config_root))

        self.assertIn("# Current POV Skill Expression Calibration", markdown)
        self.assertIn("## Current POV", markdown)
        self.assertIn("## Active Skills", markdown)
        self.assertIn("active_fire_bolt", markdown)

    def test_cli_is_non_destructive(self) -> None:
        config_root = self.temp_config_root()
        watched = config_root / "skills" / "active" / "active_fire_bolt" / "skill.yaml"
        before = watched.read_text(encoding="utf-8")
        markdown_path = config_root.parent / "calibration.md"

        completed = subprocess.run(
            [
                sys.executable,
                str(ROOT / "tools" / "calibrate_skill_expression.py"),
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
