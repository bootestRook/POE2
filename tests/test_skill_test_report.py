from __future__ import annotations

import shutil
import sys
import tempfile
import unittest
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from liufang.skill_test_report import (
    SkillTestReportRequest,
    generate_skill_test_report,
    write_skill_test_report,
)
from liufang.web_api import V1WebAppApi


class SkillTestReportTest(unittest.TestCase):
    def setUp(self) -> None:
        self.config_root = ROOT / "configs"

    def temp_config_root(self) -> Path:
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        target = Path(temp.name) / "configs"
        shutil.copytree(self.config_root, target)
        return target

    def test_generate_fire_bolt_markdown_report_from_real_arena_result(self) -> None:
        report = generate_skill_test_report(
            self.config_root,
            SkillTestReportRequest(skill_id="active_fire_bolt", scenario_id="single_dummy"),
        )

        markdown = report.markdown
        self.assertEqual(report.conclusion, "通过")
        self.assertIn("# 技能自测报告", markdown)
        self.assertIn("测试技能 ID：`active_fire_bolt`", markdown)
        self.assertIn("技能中文名：火焰弹", markdown)
        self.assertIn("skill.yaml 路径：`configs/skills/active/active_fire_bolt/skill.yaml`", markdown)
        self.assertIn("behavior_template：`projectile`", markdown)
        self.assertIn("测试场景：单体木桩", markdown)
        self.assertIn("测试 Modifier Stack", markdown)
        self.assertIn("发射一枚火球，命中敌人造成火焰伤害。", markdown)
        self.assertIn("实际事件序列摘要", markdown)
        self.assertIn("投射物生成（`projectile_spawn`）", markdown)
        self.assertIn("伤害结算（`damage`）", markdown)
        self.assertIn("命中特效（`hit_vfx`）", markdown)
        self.assertIn("伤害浮字（`floating_text`）", markdown)
        self.assertIn("实际伤害与命中结果", markdown)
        self.assertIn("实际命中目标", markdown)
        self.assertIn("damage 不早于 projectile_spawn：通过", markdown)
        self.assertIn("投射物飞行期间未扣血：通过", markdown)
        self.assertIn("damage_type 为 fire：通过", markdown)
        self.assertIn("描述一致性结论：通过", markdown)
        self.assertTrue(report.source_result["event_timeline"])
        self.assertGreater(report.source_result["damage_results"][0]["amount"], 0)

    def test_generate_ice_shards_report_from_three_target_row(self) -> None:
        report = generate_skill_test_report(
            self.config_root,
            SkillTestReportRequest(skill_id="active_ice_shards", scenario_id="three_target_row"),
        )

        markdown = report.markdown
        self.assertEqual(report.conclusion, "通过")
        self.assertIn("测试技能 ID：`active_ice_shards`", markdown)
        self.assertIn("behavior_template：`projectile`", markdown)
        self.assertIn("自动向最近敌人方向射出一枚冰霜冰棱", markdown)
        self.assertIn("多枚 projectile_spawn：通过", markdown)
        self.assertIn("扇形方向：通过", markdown)
        self.assertIn("projectile_hit：通过", markdown)
        self.assertIn("damage_type 为 cold：通过", markdown)
        self.assertIn("projectile_count 修改后事件数量变化：通过", markdown)
        self.assertIn("spread_angle_deg 修改后方向变化：通过", markdown)
        self.assertFalse(report.source_result["timeline_checks"]["has_multiple_projectile_spawn"])

    def test_generate_frost_nova_report_from_dense_pack(self) -> None:
        report = generate_skill_test_report(
            self.config_root,
            SkillTestReportRequest(skill_id="active_frost_nova", scenario_id="dense_pack"),
        )

        markdown = report.markdown
        self.assertEqual(report.conclusion, "通过")
        self.assertIn("active_frost_nova", markdown)
        self.assertIn("behavior_template：`damage_zone`", markdown)
        self.assertIn("自动以玩家自身为中心释放一圈向外扩散的冰霜新星", markdown)
        self.assertIn("damage_zone：通过", markdown)
        self.assertIn("伤害区域起点：通过", markdown)
        self.assertIn("damage 不早于 damage_zone hit_at_ms：通过", markdown)
        self.assertIn("damage_type 为 cold：通过", markdown)
        self.assertIn("radius 修改后命中目标变化：通过", markdown)
        self.assertTrue(report.source_result["timeline_checks"]["has_damage_zone"])
        self.assertTrue(report.source_result["timeline_checks"]["damage_zone_origin_passed"])

    def test_generate_puncture_report_from_dense_pack(self) -> None:
        report = generate_skill_test_report(
            self.config_root,
            SkillTestReportRequest(skill_id="active_puncture", scenario_id="dense_pack"),
        )

        markdown = report.markdown
        self.assertEqual(report.conclusion, "通过")
        self.assertIn("active_puncture", markdown)
        self.assertIn("behavior_template：`damage_zone`", markdown)
        self.assertIn("自动朝锁定敌人的方向发出一列地刺", markdown)
        self.assertIn("damage_zone：通过", markdown)
        self.assertIn("伤害区域起点：通过", markdown)
        self.assertIn("伤害区域朝向：通过", markdown)
        self.assertIn("damage 不早于 damage_zone hit_at_ms：通过", markdown)
        self.assertIn("damage_type 为 physical：通过", markdown)
        self.assertIn("length 修改后命中目标变化：通过", markdown)
        self.assertIn("width 修改后命中目标变化：通过", markdown)
        self.assertTrue(report.source_result["timeline_checks"]["has_damage_zone"])
        self.assertTrue(report.source_result["timeline_checks"]["damage_zone_origin_passed"])

    def test_generate_lightning_chain_report_from_dense_pack(self) -> None:
        report = generate_skill_test_report(
            self.config_root,
            SkillTestReportRequest(skill_id="active_lightning_chain", scenario_id="dense_pack"),
        )

        markdown = report.markdown
        self.assertEqual(report.conclusion, "通过")
        self.assertIn("active_lightning_chain", markdown)
        self.assertIn("behavior_template：`chain`", markdown)
        self.assertIn("自动向最近敌人释放闪电链", markdown)
        self.assertIn("chain_segment：通过", markdown)
        self.assertIn("多段 chain_segment：通过", markdown)
        self.assertIn("damage_type 为 lightning：通过", markdown)
        self.assertIn("chain_count 修改后链段数量变化：通过", markdown)
        self.assertIn("chain_radius 修改后可跳跃目标变化：通过", markdown)
        self.assertIn("chain_delay_ms 修改后链段间隔变化：通过", markdown)
        self.assertIn("damage_falloff_per_chain 修改后后续伤害变化：通过", markdown)
        self.assertTrue(report.source_result["timeline_checks"]["has_chain_segment"])
        self.assertTrue(report.source_result["timeline_checks"]["chain_no_repeat_targets"])

    def test_generate_fungal_petards_report_from_dense_pack(self) -> None:
        report = generate_skill_test_report(
            self.config_root,
            SkillTestReportRequest(skill_id="active_fungal_petards", scenario_id="dense_pack"),
        )

        checks = report.source_result["timeline_checks"]
        event_types = [event["type"] for event in report.source_result["event_timeline"]]
        self.assertEqual(report.conclusion, "通过")
        self.assertIn("active_fungal_petards", report.markdown)
        self.assertIn("behavior_template：`module_chain`", report.markdown)
        self.assertIn("projectile_impact", event_types)
        self.assertIn("damage_zone_prime", event_types)
        self.assertTrue(checks["has_projectile_impact"])
        self.assertTrue(checks["projectile_spawn_ballistic"])
        self.assertTrue(checks["projectile_impact_marker_present"])
        self.assertTrue(checks["has_damage_zone_prime"])
        self.assertTrue(checks["damage_zone_prime_trigger_present"])
        self.assertTrue(checks["damage_zone_origin_matches_projectile_impact"])
        self.assertTrue(checks["damage_after_or_at_triggered_zone"])
        damage_events = [event for event in report.source_result["event_timeline"] if event["type"] == "damage"]
        self.assertTrue(damage_events)
        self.assertTrue(all(event["damage_type"] == "physical" for event in damage_events))

    def test_report_with_modifier_stack_uses_changed_real_amount(self) -> None:
        base = generate_skill_test_report(
            self.config_root,
            SkillTestReportRequest(skill_id="active_fire_bolt", scenario_id="single_dummy"),
        )
        modified = generate_skill_test_report(
            self.config_root,
            SkillTestReportRequest(
                skill_id="active_fire_bolt",
                scenario_id="single_dummy",
                use_modifier_stack=True,
                modifier_ids=("support_fire_mastery",),
                relation="same_row",
            ),
        )

        base_damage = next(event for event in base.source_result["event_timeline"] if event["type"] == "damage")
        modified_damage = next(event for event in modified.source_result["event_timeline"] if event["type"] == "damage")
        self.assertGreater(modified_damage["amount"], base_damage["amount"])
        self.assertIn("已启用", modified.markdown)
        self.assertIn("火焰强化", modified.markdown)
        self.assertIn(str(modified_damage["amount"]), modified.markdown)

    def test_report_does_not_write_skill_yaml_or_real_inventory(self) -> None:
        config_root = self.temp_config_root()
        path = config_root / "skills" / "active" / "active_fire_bolt" / "skill.yaml"
        before = path.read_text(encoding="utf-8")

        report = generate_skill_test_report(
            config_root,
            SkillTestReportRequest(
                skill_id="active_fire_bolt",
                scenario_id="single_dummy",
                use_modifier_stack=True,
                modifier_ids=("support_fire_mastery",),
                relation="same_row",
            ),
        )
        api = V1WebAppApi(config_root)

        self.assertEqual(path.read_text(encoding="utf-8"), before)
        self.assertFalse(any(instance.get("instance_id", "").startswith("test_modifier:") for instance in api.state()["inventory"]))
        self.assertNotIn("random_affixes", str(report.source_result))

    def test_write_report_outputs_markdown_file(self) -> None:
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        output_path = write_skill_test_report(
            self.config_root,
            SkillTestReportRequest(skill_id="active_fire_bolt", scenario_id="single_dummy"),
            Path(temp.name),
            timestamp=datetime(2026, 4, 30, 12, 0, 0),
        )

        self.assertEqual(output_path.name, "active_fire_bolt_single_dummy_20260430_120000.md")
        text = output_path.read_text(encoding="utf-8")
        self.assertIn("技能自测报告", text)
        self.assertIn("描述一致性结论：通过", text)

    def test_report_can_return_partial_or_failed_conclusion_from_real_result_rules(self) -> None:
        report = generate_skill_test_report(
            self.config_root,
            SkillTestReportRequest(skill_id="active_fire_bolt", scenario_id="single_dummy"),
        )

        self.assertIn(report.conclusion, {"通过", "不通过", "部分通过"})
        self.assertIn("不一致项列表", report.markdown)
        self.assertIn("建议修复项", report.markdown)


if __name__ == "__main__":
    unittest.main()
