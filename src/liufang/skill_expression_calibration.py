from __future__ import annotations

from dataclasses import dataclass
import json
from pathlib import Path
from typing import Any

from .config import load_skill_packages, load_skill_scaling_rules, load_yaml_file


EXPRESSION_ACTIVE_PATHS = frozenset(
    {
        "cast.search_range",
        "cast.cooldown_ms",
        "behavior.params.max_distance",
        "behavior.params.projectile_count",
        "behavior.params.projectile_speed",
        "behavior.params.spread_angle_deg",
        "behavior.params.collision_radius",
        "behavior.params.radius",
        "behavior.params.length",
        "behavior.params.width",
        "behavior.params.chain_count",
        "behavior.params.chain_radius",
        "behavior.params.chain_delay_ms",
        "behavior.params.duration_ms",
        "behavior.params.tick_interval_ms",
        "behavior.params.orbit_radius",
        "behavior.params.orb_count",
        "behavior.params.travel_time_ms",
        "behavior.params.trigger_delay_ms",
        "modules.*.params.max_distance",
        "modules.*.params.projectile_count",
        "modules.*.params.projectile_speed",
        "modules.*.params.radius",
        "modules.*.params.duration_ms",
        "modules.*.params.tick_interval_ms",
        "modules.*.params.orbit_radius",
        "modules.*.params.orb_count",
        "modules.*.params.travel_time_ms",
        "modules.*.trigger.trigger_delay_ms",
    }
)
EXPRESSION_SUPPORT_STATS = frozenset(
    {
        "attack_speed_add_percent",
        "cast_speed_add_percent",
        "skill_speed_final_percent",
        "cooldown_recovery_add_percent",
        "added_cooldown_ms",
        "area_add_percent",
        "projectile_count_add",
        "projectile_speed_add_percent",
    }
)
EXPRESSION_PASSIVE_STATS = frozenset({"move_speed"})
DAMAGE_OR_SURVIVAL_STATS = frozenset(
    {
        "damage_add_percent",
        "damage_final_percent",
        "physical_damage_add_percent",
        "fire_damage_add_percent",
        "cold_damage_add_percent",
        "lightning_damage_add_percent",
        "crit_chance_add_percent",
        "crit_damage_add_percent",
        "status_chance_add_percent",
        "max_life",
        "current_life",
    }
)


@dataclass(frozen=True)
class CurrentPovMetrics:
    world_width: int = 512
    world_height: int = 512
    camera_zoom: float = 0.22
    player_speed: float = 250.0
    enemy_chase_speed: float = 58.0
    spawn_interval_start_sec: float = 1.2
    spawn_interval_floor_sec: float = 0.45
    normal_spawn_distance_min: float = 238.4
    normal_spawn_distance_median: float = 302.3
    normal_spawn_distance_max: float = 337.7

    def to_dict(self) -> dict[str, float | int]:
        return {
            "world_width": self.world_width,
            "world_height": self.world_height,
            "camera_zoom": self.camera_zoom,
            "player_speed": self.player_speed,
            "enemy_chase_speed": self.enemy_chase_speed,
            "spawn_interval_start_sec": self.spawn_interval_start_sec,
            "spawn_interval_floor_sec": self.spawn_interval_floor_sec,
            "normal_spawn_distance_min": self.normal_spawn_distance_min,
            "normal_spawn_distance_median": self.normal_spawn_distance_median,
            "normal_spawn_distance_max": self.normal_spawn_distance_max,
        }


def calibrate_skill_expression(config_root: Path, pov: CurrentPovMetrics | None = None) -> dict[str, Any]:
    metrics = pov or CurrentPovMetrics()
    packages = load_skill_packages(config_root)
    scaling_rules = load_skill_scaling_rules(config_root)
    active_reports = [
        _active_skill_report(skill_id, package, metrics)
        for skill_id, package in sorted(packages.items())
    ]
    return {
        "mode": "current_pov_expression_calibration",
        "non_destructive": True,
        "uses_dummy_balance": False,
        "damage_tuning_enabled": False,
        "current_pov": metrics.to_dict(),
        "active_skills": active_reports,
        "support_expression": _support_expression_report(scaling_rules.support_base_modifiers),
        "passive_expression": _passive_expression_report(config_root),
        "ignored_damage_or_survival_stats": sorted(DAMAGE_OR_SURVIVAL_STATS),
    }


def calibration_report_to_markdown(report: dict[str, Any]) -> str:
    lines = [
        "# Current POV Skill Expression Calibration",
        "",
        "## Safety",
        f"- Non-destructive: {report['non_destructive']}",
        f"- Uses dummy balance: {report['uses_dummy_balance']}",
        f"- Damage tuning enabled: {report['damage_tuning_enabled']}",
        "",
        "## Current POV",
    ]
    pov = report["current_pov"]
    for key in (
        "world_width",
        "world_height",
        "camera_zoom",
        "player_speed",
        "enemy_chase_speed",
        "normal_spawn_distance_min",
        "normal_spawn_distance_median",
        "normal_spawn_distance_max",
    ):
        lines.append(f"- {key}: {pov[key]}")
    lines.extend(["", "## Active Skills"])
    for skill in report["active_skills"]:
        lines.append(f"### {skill['skill_id']}")
        if not skill["recommendations"]:
            lines.append("- No expression changes recommended.")
            continue
        for item in skill["recommendations"]:
            lines.append(
                f"- `{item['path']}`: {item['current']} -> {item['recommended']} ({item['reason']})"
            )
    lines.extend(["", "## Support Expression Pressure"])
    for item in report["support_expression"]:
        lines.append(f"- `{item['support_id']}` `{item['stat']}` {item['value']}: {item['pressure']}")
    lines.extend(["", "## Passive Expression Pressure"])
    for item in report["passive_expression"]:
        lines.append(f"- `{item['passive_id']}` `{item['stat']}` {item['value']}: {item['pressure']}")
    return "\n".join(lines) + "\n"


def report_to_json(report: dict[str, Any]) -> str:
    return json.dumps(report, ensure_ascii=False, indent=2)


def _active_skill_report(skill_id: str, package: dict[str, Any], pov: CurrentPovMetrics) -> dict[str, Any]:
    current: dict[str, Any] = {}
    recommendations: list[dict[str, Any]] = []
    cast = package.get("cast", {})
    params = package.get("behavior", {}).get("params", {})
    modules = package.get("modules", [])
    template = package.get("behavior", {}).get("template", "")
    tags = set(package.get("classification", {}).get("tags", []))

    def rec(path: str, value: Any, recommended: Any, reason: str) -> None:
        if path not in EXPRESSION_ACTIVE_PATHS:
            raise ValueError(f"calibration attempted non-expression path: {path}")
        current[path] = value
        if _meaningfully_different(value, recommended):
            recommendations.append(
                {
                    "path": path,
                    "current": value,
                    "recommended": recommended,
                    "reason": reason,
                }
            )

    profile = _skill_profile(skill_id, template, tags, modules)
    target = _profile_targets(profile, pov)
    rec("cast.search_range", cast.get("search_range"), target["search_range"], target["search_reason"])
    rec("cast.cooldown_ms", cast.get("cooldown_ms"), target["cooldown_ms"], target["cooldown_reason"])

    if template == "projectile":
        _projectile_recommendations(rec, params, target)
    if template == "damage_zone":
        _damage_zone_recommendations(rec, params, target)
    if template == "chain":
        rec("behavior.params.chain_count", params.get("chain_count"), target["chain_count"], "keep chain readable under current spawn density")
        rec("behavior.params.chain_radius", params.get("chain_radius"), target["chain_radius"], "fit jump distance to the current encounter cluster")
        rec("behavior.params.chain_delay_ms", params.get("chain_delay_ms"), target["chain_delay_ms"], "make chain cadence visible without feeling sluggish")
    if template == "orbit_emitter":
        _orbit_recommendations(rec, params, target)
    if modules:
        _module_recommendations(recommendations, current, modules, target)

    return {
        "skill_id": skill_id,
        "profile": profile,
        "current": current,
        "recommendations": recommendations,
        "ignored_paths": ["hit.base_damage"],
    }


def _projectile_recommendations(rec: Any, params: dict[str, Any], target: dict[str, Any]) -> None:
    rec("behavior.params.max_distance", params.get("max_distance"), target["max_distance"], "match projectile reach to current POV engagement distance")
    rec("behavior.params.projectile_speed", params.get("projectile_speed"), target["projectile_speed"], "keep projectile travel visible but not late")
    if "projectile_count" in params:
        rec("behavior.params.projectile_count", params.get("projectile_count"), target["projectile_count"], "maintain projectile identity and visual density")
    if "spread_angle_deg" in params:
        rec("behavior.params.spread_angle_deg", params.get("spread_angle_deg"), target["spread_angle_deg"], "keep spread readable in the compact battle view")
    if "collision_radius" in params:
        rec("behavior.params.collision_radius", params.get("collision_radius"), target["collision_radius"], "allow readable hits without turning into full area damage")


def _damage_zone_recommendations(rec: Any, params: dict[str, Any], target: dict[str, Any]) -> None:
    if params.get("shape") == "circle":
        rec("behavior.params.radius", params.get("radius"), target["radius"], "fit area coverage to current spawn cluster")
    if params.get("shape") == "rectangle":
        rec("behavior.params.length", params.get("length"), target["length"], "make the line skill reach visible enemies in the current POV")
        rec("behavior.params.width", params.get("width"), target["width"], "make the line skill forgiving enough for moving targets")


def _orbit_recommendations(rec: Any, params: dict[str, Any], target: dict[str, Any]) -> None:
    rec("behavior.params.duration_ms", params.get("duration_ms"), target["duration_ms"], "keep persistent orbit readable without filling the screen forever")
    rec("behavior.params.tick_interval_ms", params.get("tick_interval_ms"), target["tick_interval_ms"], "reduce tick spam while preserving rhythm")
    rec("behavior.params.orbit_radius", params.get("orbit_radius"), target["orbit_radius"], "keep orbit near the player under current camera scale")
    rec("behavior.params.orb_count", params.get("orb_count"), target["orb_count"], "keep baseline orbit simple before damage tuning")


def _module_recommendations(
    recommendations: list[dict[str, Any]],
    current: dict[str, Any],
    modules: Any,
    target: dict[str, Any],
) -> None:
    if not isinstance(modules, list):
        return

    def rec(path: str, value: Any, recommended: Any, reason: str) -> None:
        if path not in EXPRESSION_ACTIVE_PATHS:
            raise ValueError(f"calibration attempted non-expression path: {path}")
        current[path] = value
        if _meaningfully_different(value, recommended):
            recommendations.append({"path": path, "current": value, "recommended": recommended, "reason": reason})

    for module in modules:
        if not isinstance(module, dict):
            continue
        params = module.get("params", {})
        trigger = module.get("trigger", {})
        if module.get("type") == "projectile":
            rec("modules.*.params.max_distance", params.get("max_distance"), target["max_distance"], "match module projectile reach to current POV")
            rec("modules.*.params.projectile_speed", params.get("projectile_speed"), target["projectile_speed"], "keep module projectile readable")
            if "travel_time_ms" in params:
                rec("modules.*.params.travel_time_ms", params.get("travel_time_ms"), target["travel_time_ms"], "make delayed projectile land before moving packs drift too far")
        if module.get("type") == "damage_zone":
            rec("modules.*.params.radius", params.get("radius"), target["radius"], "fit triggered area to current spawn cluster")
            if isinstance(trigger, dict) and "trigger_delay_ms" in trigger:
                rec("modules.*.trigger.trigger_delay_ms", trigger.get("trigger_delay_ms"), target["trigger_delay_ms"], "keep warning readable without feeling disconnected")
        if module.get("type") == "orbit_emitter":
            rec("modules.*.params.duration_ms", params.get("duration_ms"), target["duration_ms"], "keep persistent orbit readable")
            rec("modules.*.params.tick_interval_ms", params.get("tick_interval_ms"), target["tick_interval_ms"], "control orbit tick visual density")
            rec("modules.*.params.orbit_radius", params.get("orbit_radius"), target["orbit_radius"], "keep orbit close enough to the player")
            rec("modules.*.params.orb_count", params.get("orb_count"), target["orb_count"], "baseline orbit count")


def _skill_profile(skill_id: str, template: str, tags: set[str], modules: Any) -> str:
    if skill_id == "active_lightning_shot" or "pierce" in tags and "ranged" in tags:
        return "long_pierce_projectile"
    if skill_id == "active_ice_shot":
        return "fan_projectile"
    if modules and skill_id == "active_black_hole":
        return "delayed_area_projectile"
    if modules and skill_id == "active_thundercloud":
        return "orbit_area"
    if template == "damage_zone" and "area" in tags and "pierce" in tags:
        return "short_line_area"
    if template == "damage_zone":
        return "self_area"
    if template == "chain":
        return "chain"
    return "single_projectile"


def _profile_targets(profile: str, pov: CurrentPovMetrics) -> dict[str, Any]:
    median = pov.normal_spawn_distance_median
    base = {
        "search_range": _round_to_10(median + 80),
        "search_reason": "avoid whole-map auto targeting while reaching normal spawn pressure",
        "cooldown_ms": 1250,
        "cooldown_reason": "keep baseline auto-cast rhythm visible under current spawn cadence",
        "max_distance": _round_to_10(median + 100),
        "projectile_speed": 620,
        "projectile_count": 1,
        "spread_angle_deg": 0,
        "collision_radius": 20,
        "radius": _round_to_10(median * 0.9),
        "length": _round_to_10(median * 0.85),
        "width": 64,
        "chain_count": 4,
        "chain_radius": 170,
        "chain_delay_ms": 90,
        "duration_ms": 3200,
        "tick_interval_ms": 380,
        "orbit_radius": 150,
        "orb_count": 1,
        "travel_time_ms": 620,
        "trigger_delay_ms": 320,
    }
    if profile == "fan_projectile":
        base.update({"cooldown_ms": 1300, "projectile_speed": 460, "projectile_count": 1, "spread_angle_deg": 70, "collision_radius": 22})
    elif profile == "long_pierce_projectile":
        base.update({"search_range": 520, "max_distance": 520, "cooldown_ms": 1350, "projectile_speed": 760, "collision_radius": 18})
    elif profile == "self_area":
        base.update({"search_range": 340, "cooldown_ms": 1800, "radius": 340})
    elif profile == "short_line_area":
        base.update({"search_range": 320, "cooldown_ms": 1150, "length": 260, "width": 72})
    elif profile == "chain":
        base.update({"search_range": 380, "cooldown_ms": 1700, "chain_radius": 165, "chain_delay_ms": 90})
    elif profile == "orbit_area":
        base.update({"search_range": 300, "cooldown_ms": 2200, "radius": 68, "duration_ms": 3200, "tick_interval_ms": 380, "orbit_radius": 150, "orb_count": 1, "trigger_delay_ms": 0})
    elif profile == "delayed_area_projectile":
        base.update({"search_range": 420, "max_distance": 420, "cooldown_ms": 2400, "projectile_speed": 620, "radius": 150, "travel_time_ms": 620, "trigger_delay_ms": 320})
    return base


def _support_expression_report(modifiers: Any) -> list[dict[str, Any]]:
    report = []
    for modifier in modifiers:
        stat = modifier.stat
        if stat in EXPRESSION_SUPPORT_STATS:
            report.append(
                {
                    "support_id": modifier.support_id,
                    "stat": stat,
                    "value": modifier.value,
                    "pressure": _support_pressure(stat, modifier.value),
                }
            )
    return report


def _passive_expression_report(config_root: Path) -> list[dict[str, Any]]:
    report: list[dict[str, Any]] = []
    passive_dir = config_root / "skills" / "passive"
    if not passive_dir.exists():
        return report
    for path in sorted(passive_dir.glob("*/skill.yaml")):
        package = load_yaml_file(path)
        passive_id = str(package.get("id", path.parent.name))
        for effect in package.get("passive_effects", []):
            if not isinstance(effect, dict):
                continue
            stat = str(effect.get("stat", ""))
            if stat not in EXPRESSION_PASSIVE_STATS:
                continue
            value = float(effect.get("value", 0))
            report.append(
                {
                    "passive_id": passive_id,
                    "stat": stat,
                    "value": value,
                    "pressure": "movement changes encounter spacing; review with camera and spawn pressure",
                }
            )
    return report


def _support_pressure(stat: str, value: float) -> str:
    magnitude = abs(value)
    if stat == "projectile_count_add":
        return "high visual density" if magnitude >= 2 else "moderate visual density"
    if stat in {"skill_speed_final_percent", "cooldown_recovery_add_percent"}:
        return "high cadence pressure" if magnitude >= 15 else "moderate cadence pressure"
    if stat == "added_cooldown_ms":
        return "slower cadence tradeoff" if value > 0 else "cadence accelerator"
    if stat == "area_add_percent":
        return "high coverage pressure" if magnitude >= 25 else "moderate coverage pressure"
    if stat == "projectile_speed_add_percent":
        return "projectile readability pressure" if magnitude >= 20 else "minor projectile readability pressure"
    return "expression pressure"


def _meaningfully_different(current: Any, recommended: Any) -> bool:
    if current is None:
        return False
    if isinstance(current, (int, float)) and isinstance(recommended, (int, float)):
        return abs(float(current) - float(recommended)) >= max(5.0, abs(float(recommended)) * 0.08)
    return current != recommended


def _round_to_10(value: float) -> int:
    return int(round(value / 10.0) * 10)
