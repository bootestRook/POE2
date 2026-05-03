from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .combat import Position
from .skill_runtime import SkillRuntime
from .web_api import V1WebAppApi


MountSpec = tuple[str, str, int, int]


def generate_gem_combination_report(config_root: Path) -> dict[str, Any]:
    cases = [
        _fire_bolt_support_passive_case(config_root),
        _frost_nova_area_cooldown_case(config_root),
        _same_row_conduit_case(config_root),
        _self_stat_passive_case(config_root),
    ]
    return {
        "report_kind": "gem_combination_effect_report",
        "non_destructive": True,
        "wrote_production_state": False,
        "case_count": len(cases),
        "cases": cases,
        "summary": _summary(cases),
    }


def report_to_json(report: dict[str, Any]) -> str:
    return json.dumps(report, ensure_ascii=False, indent=2)


def report_to_markdown(report: dict[str, Any]) -> str:
    lines = [
        "# Gem Combination Effect Report",
        "",
        "## Safety",
        f"- Non-destructive: {report['non_destructive']}",
        f"- Wrote production state: {report['wrote_production_state']}",
        "",
        "## Summary",
        f"- Cases: {report['case_count']}",
        f"- Passed checks: {report['summary']['passed_checks']}/{report['summary']['total_checks']}",
        f"- Observations: {report['summary']['observation_count']}",
        "",
        "## Cases",
    ]
    for case in report["cases"]:
        lines.extend(
            [
                f"### {case['case']}",
                f"- Board valid: {case['board_valid']}",
                f"- Checks passed: {case['passed_checks']}/{case['total_checks']}",
            ]
        )
        if case.get("baseline"):
            lines.append("- Baseline: " + _compact_json(case["baseline"]))
        if case.get("combo"):
            lines.append("- Combo: " + _compact_json(case["combo"]))
        if case.get("baseline_same_row_support"):
            lines.append("- Baseline same-row support: " + _compact_json(case["baseline_same_row_support"]))
        if case.get("combo_with_conduit"):
            lines.append("- Combo with conduit: " + _compact_json(case["combo_with_conduit"]))
        if case.get("player_stats"):
            lines.append("- Player stats: " + _compact_json(case["player_stats"]))
        for check, passed in case["checks"].items():
            lines.append(f"- {check}: {'PASS' if passed else 'FAIL'}")
        for observation in case.get("observations", []):
            lines.append(f"- Observation: {observation}")
        lines.append("")
    return "\n".join(lines)


def _fire_bolt_support_passive_case(config_root: Path) -> dict[str, Any]:
    baseline_api = _setup_api(config_root, [("active_fire_bolt", "probe_fire_active", 0, 0)])
    combo_api = _setup_api(
        config_root,
        [
            ("active_fire_bolt", "probe_fire_active", 0, 0),
            ("support_extra_projectile", "probe_extra_projectile", 0, 1),
            ("support_fire_mastery", "probe_fire_mastery", 1, 0),
            ("passive_fire_focus", "probe_fire_focus", 1, 1),
        ],
    )
    baseline = _final_skill(baseline_api, "active_fire_bolt")
    combo = _final_skill(combo_api, "active_fire_bolt")
    event_counts = _runtime_event_counts(combo)
    checks = {
        "projectile_count_changed": combo.projectile_count > baseline.projectile_count,
        "damage_changed_by_fire_supports": combo.final_damage > baseline.final_damage,
        "projectile_spawn_matches_count": event_counts.get("projectile_spawn") == combo.projectile_count,
    }
    return _case(
        "fire_bolt_supports_and_passive",
        combo_api,
        checks,
        baseline=_skill_summary(baseline),
        combo=_skill_summary(combo),
        runtime_event_counts=event_counts,
    )


def _frost_nova_area_cooldown_case(config_root: Path) -> dict[str, Any]:
    baseline_api = _setup_api(config_root, [("active_frost_nova", "probe_nova_active", 0, 0)])
    combo_api = _setup_api(
        config_root,
        [
            ("active_frost_nova", "probe_nova_active", 0, 0),
            ("support_area_magnify", "probe_area_magnify", 0, 1),
            ("support_cooldown_focus", "probe_cooldown_focus", 3, 0),
        ],
    )
    baseline = _final_skill(baseline_api, "active_frost_nova")
    combo = _final_skill(combo_api, "active_frost_nova")
    checks = {
        "area_radius_increased": _runtime_value(combo, "radius") > _runtime_value(baseline, "radius"),
        "area_support_applied": _has_modifier(combo, "support_area_magnify", "area_add_percent"),
        "cooldown_focus_applied": _has_modifier(combo, "support_cooldown_focus", "cooldown_recovery_add_percent"),
    }
    observations: list[str] = []
    if combo.actual_interval_ms >= baseline.actual_interval_ms:
        observations.append(
            "Cooldown Focus applied, but Area Magnify speed penalty makes net release interval no faster."
        )
    return _case(
        "frost_nova_area_and_cooldown_interaction",
        combo_api,
        checks,
        baseline=_skill_summary(baseline),
        combo=_skill_summary(combo),
        observations=observations,
    )


def _same_row_conduit_case(config_root: Path) -> dict[str, Any]:
    baseline_api = _setup_api(
        config_root,
        [
            ("active_fire_bolt", "probe_fire_active", 0, 0),
            ("support_fire_mastery", "probe_fire_mastery", 0, 3),
        ],
    )
    combo_api = _setup_api(
        config_root,
        [
            ("active_fire_bolt", "probe_fire_active", 0, 0),
            ("support_fire_mastery", "probe_fire_mastery", 0, 3),
            ("support_row_conduit", "probe_row_conduit", 0, 4),
        ],
    )
    baseline = _final_skill(baseline_api, "active_fire_bolt")
    combo = _final_skill(combo_api, "active_fire_bolt")
    conduit_modifiers = [
        modifier for modifier in combo.applied_modifiers
        if modifier.applied and modifier.stat == "conduit_multiplier"
    ]
    observations: list[str] = []
    if len(conduit_modifiers) > 1:
        observations.append("Conduit multiplier appears more than once in applied modifier debug output.")
    checks = {
        "conduit_multiplier_present": bool(conduit_modifiers),
        "conduit_increases_support_value": combo.final_damage > baseline.final_damage,
    }
    return _case(
        "same_row_conduit_amplification",
        combo_api,
        checks,
        baseline_same_row_support=_skill_summary(baseline),
        combo_with_conduit=_skill_summary(combo),
        observations=observations,
    )


def _self_stat_passive_case(config_root: Path) -> dict[str, Any]:
    api = _setup_api(
        config_root,
        [
            ("active_fire_bolt", "probe_fire_active", 0, 0),
            ("passive_vitality", "probe_vitality", 0, 1),
            ("passive_swift_gathering", "probe_swift", 0, 2),
        ],
    )
    player_stats = api.state()["player_stats"]
    checks = {
        "max_life_increased": player_stats["max_life"]["value"] == 525,
        "move_speed_increased": player_stats["move_speed"]["value"] == 1.1,
    }
    return _case("self_stat_passives", api, checks, player_stats=player_stats)


def _setup_api(config_root: Path, mounts: list[MountSpec]) -> V1WebAppApi:
    api = V1WebAppApi(config_root)
    for base_gem_id, instance_id, row, column in mounts:
        if api.inventory.get(instance_id) is None:
            api.inventory.add_instance(instance_id, base_gem_id)
        api.board.mount_gem(instance_id, row, column)
    return api


def _final_skill(api: V1WebAppApi, base_gem_id: str) -> Any:
    return next(skill for skill in api._calculator().calculate_all() if skill.base_gem_id == base_gem_id)


def _case(case_name: str, api: V1WebAppApi, checks: dict[str, bool], **extra: Any) -> dict[str, Any]:
    passed = sum(1 for value in checks.values() if value)
    return {
        "case": case_name,
        "board_valid": api.board.validate().is_valid,
        "relations": _relation_summary(api),
        "checks": checks,
        "passed_checks": passed,
        "total_checks": len(checks),
        **extra,
    }


def _skill_summary(skill: Any) -> dict[str, Any]:
    return {
        "base_gem_id": skill.base_gem_id,
        "final_damage": skill.final_damage,
        "non_crit_damage": skill.non_crit_damage,
        "expected_hit_damage": skill.expected_hit_damage,
        "preview_dps": skill.preview_dps,
        "uses_per_second": skill.uses_per_second,
        "hit_coverage_factor": skill.hit_coverage_factor,
        "crit_chance": skill.crit_chance,
        "crit_multiplier": skill.crit_multiplier,
        "increase_pool": skill.increase_pool,
        "final_pool": skill.final_pool,
        "final_cooldown_ms": skill.final_cooldown_ms,
        "actual_interval_ms": skill.actual_interval_ms,
        "mana_cost": skill.mana_cost,
        "projectile_count": skill.projectile_count,
        "projectile_speed": _runtime_value(skill, "projectile_speed"),
        "radius": _runtime_value(skill, "radius"),
        "area_multiplier": skill.area_multiplier,
        "speed_multiplier": skill.speed_multiplier,
        "applied_modifiers": [
            {
                "source": modifier.source_base_gem_id,
                "target": modifier.target_base_gem_id,
                "stat": modifier.stat,
                "value": modifier.value,
                "layer": modifier.layer,
                "relation": modifier.relation,
                "reason": modifier.reason_key,
            }
            for modifier in skill.applied_modifiers
            if modifier.applied
        ],
    }


def _relation_summary(api: V1WebAppApi) -> list[dict[str, Any]]:
    return [
        {
            "source": relation.source_instance_id,
            "target": relation.target_instance_id,
            "relation": relation.relation,
            "source_pos": [relation.source_position.row, relation.source_position.column],
            "target_pos": [relation.target_position.row, relation.target_position.column],
        }
        for relation in api.board.relations()
    ]


def _runtime_event_counts(skill: Any) -> dict[str, int]:
    events = SkillRuntime().execute(
        skill,
        source_entity="player_probe",
        source_position=Position(0, 0),
        target_entity="monster_probe",
        target_position=Position(360, 0),
        timestamp_ms=100,
        target_entities=[
            {"entity_id": "monster_probe", "position": {"x": 360, "y": 0}},
            {"entity_id": "monster_side", "position": {"x": 360, "y": 42}},
        ],
    )
    counts: dict[str, int] = {}
    for event in events:
        counts[event.type] = counts.get(event.type, 0) + 1
    return counts


def _runtime_value(skill: Any, key: str) -> Any:
    return (skill.runtime_params or {}).get(key)


def _has_modifier(skill: Any, source_base_gem_id: str, stat: str) -> bool:
    return any(
        modifier.applied
        and modifier.source_base_gem_id == source_base_gem_id
        and modifier.stat == stat
        for modifier in skill.applied_modifiers
    )


def _summary(cases: list[dict[str, Any]]) -> dict[str, int]:
    total_checks = sum(case["total_checks"] for case in cases)
    passed_checks = sum(case["passed_checks"] for case in cases)
    observation_count = sum(len(case.get("observations", [])) for case in cases)
    return {
        "total_checks": total_checks,
        "passed_checks": passed_checks,
        "observation_count": observation_count,
    }


def _compact_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True)
