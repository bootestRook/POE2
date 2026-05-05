from __future__ import annotations

from dataclasses import dataclass, field
from math import atan2, cos, hypot, pi, sin
from typing import Any, Mapping

from .shotgun import shotgun_state_from_runtime_params
from .skill_effects import FinalSkillInstance


SKILL_EVENT_TYPES = frozenset(
    {
        "cast_start",
        "projectile_spawn",
        "projectile_hit",
        "projectile_impact",
        "target_search",
        "chain_segment",
        "area_spawn",
        "melee_arc",
        "damage_zone_prime",
        "damage_zone",
        "orbit_spawn",
        "orbit_tick",
        "delayed_area_prime",
        "delayed_area_explode",
        "unit_killed",
        "damage_zone_hit",
        "damage",
        "status_apply",
        "forced_movement",
        "hit_vfx",
        "floating_text",
        "buff_apply",
        "cooldown_update",
    }
)


@dataclass(frozen=True)
class SkillEvent:
    event_id: str
    type: str
    timestamp_ms: int
    source_entity: str
    target_entity: str
    position: dict[str, float]
    direction: dict[str, float]
    delay_ms: int
    duration_ms: int
    amount: float | None
    damage_type: str
    skill_instance_id: str
    vfx_key: str
    sfx_key: str
    reason_key: str
    payload: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "event_id": self.event_id,
            "type": self.type,
            "timestamp_ms": self.timestamp_ms,
            "source_entity": self.source_entity,
            "target_entity": self.target_entity,
            "position": dict(self.position),
            "direction": dict(self.direction),
            "delay_ms": self.delay_ms,
            "duration_ms": self.duration_ms,
            "amount": self.amount,
            "damage_type": self.damage_type,
            "skill_instance_id": self.skill_instance_id,
            "vfx_key": self.vfx_key,
            "sfx_key": self.sfx_key,
            "reason_key": self.reason_key,
            "payload": dict(self.payload),
        }


class SkillRuntimeError(ValueError):
    pass


@dataclass(frozen=True)
class _RuntimeTarget:
    entity_id: str
    position: dict[str, float]


class SkillRuntime:
    def execute(
        self,
        skill: FinalSkillInstance,
        *,
        source_entity: str,
        source_position: object,
        target_entity: str,
        target_position: object,
        timestamp_ms: int,
        target_entities: object | None = None,
        runtime_context: object | None = None,
    ) -> tuple[SkillEvent, ...]:
        if not skill.uses_skill_event_pipeline:
            raise SkillRuntimeError("skill does not use the SkillEvent pipeline")
        if skill.behavior_template not in {"projectile", "chain", "player_nova", "melee_arc", "damage_zone", "module_chain"}:
            raise SkillRuntimeError(f"unsupported behavior template: {skill.behavior_template}")
        if skill.behavior_template == "module_chain":
            targets = tuple(_runtime_targets(target_entities)) if target_entities is not None else (
                _RuntimeTarget(target_entity, _position_dict(target_position)),
            )
            return _with_continuous_attack_events(
                skill,
                self._module_chain_events(
                    skill,
                    source_entity=source_entity,
                    source_position=_position_dict(source_position),
                    targets=targets,
                    timestamp_ms=timestamp_ms,
                ),
                timestamp_ms=timestamp_ms,
                runtime_context=runtime_context,
            )
        if skill.behavior_template == "chain":
            targets = tuple(_runtime_targets(target_entities)) if target_entities is not None else (
                _RuntimeTarget(target_entity, _position_dict(target_position)),
            )
            return _with_continuous_attack_events(
                skill,
                self._chain_events(
                    skill,
                    source_entity=source_entity,
                    source_position=_position_dict(source_position),
                    targets=targets,
                    timestamp_ms=timestamp_ms,
                ),
                timestamp_ms=timestamp_ms,
                runtime_context=runtime_context,
            )
        if skill.behavior_template == "damage_zone":
            targets = tuple(_runtime_targets(target_entities)) if target_entities is not None else (
                _RuntimeTarget(target_entity, _position_dict(target_position)),
            )
            return _with_continuous_attack_events(
                skill,
                self._damage_zone_events(
                    skill,
                    source_entity=source_entity,
                    source_position=_position_dict(source_position),
                    targets=targets,
                    timestamp_ms=timestamp_ms,
                    runtime_context=runtime_context,
                ),
                timestamp_ms=timestamp_ms,
                runtime_context=runtime_context,
            )
        if skill.behavior_template == "melee_arc":
            targets = tuple(_runtime_targets(target_entities)) if target_entities is not None else (
                _RuntimeTarget(target_entity, _position_dict(target_position)),
            )
            return _with_continuous_attack_events(
                skill,
                self._melee_arc_events(
                    skill,
                    source_entity=source_entity,
                    source_position=_position_dict(source_position),
                    targets=targets,
                    timestamp_ms=timestamp_ms,
                ),
                timestamp_ms=timestamp_ms,
                runtime_context=runtime_context,
            )
        if skill.behavior_template == "player_nova":
            targets = tuple(_runtime_targets(target_entities)) if target_entities is not None else (
                _RuntimeTarget(target_entity, _position_dict(target_position)),
            )
            return _with_continuous_attack_events(
                skill,
                self._player_nova_events(
                    skill,
                    source_entity=source_entity,
                    source_position=_position_dict(source_position),
                    targets=targets,
                    timestamp_ms=timestamp_ms,
                ),
                timestamp_ms=timestamp_ms,
                runtime_context=runtime_context,
            )
        if target_entities is not None:
            targets = tuple(_runtime_targets(target_entities))
            if targets:
                return _with_continuous_attack_events(
                    skill,
                    self._projectile_multi_target_events(
                        skill,
                        source_entity=source_entity,
                        source_position=_position_dict(source_position),
                        target_entity=target_entity,
                        targets=targets,
                        timestamp_ms=timestamp_ms,
                    ),
                    timestamp_ms=timestamp_ms,
                    runtime_context=runtime_context,
                )
        return _with_continuous_attack_events(
            skill,
            self._projectile_events(
                skill,
                source_entity=source_entity,
                source_position=_position_dict(source_position),
                target_entity=target_entity,
                target_position=_position_dict(target_position),
                timestamp_ms=timestamp_ms,
            ),
            timestamp_ms=timestamp_ms,
            runtime_context=runtime_context,
        )

    def _player_nova_events(
        self,
        skill: FinalSkillInstance,
        *,
        source_entity: str,
        source_position: dict[str, float],
        targets: tuple[_RuntimeTarget, ...],
        timestamp_ms: int,
    ) -> tuple[SkillEvent, ...]:
        runtime_params = skill.runtime_params or {}
        presentation = skill.presentation_keys or {}
        radius = max(1.0, float(runtime_params.get("radius", 360.0)))
        expand_duration_ms = max(0, int(runtime_params.get("expand_duration_ms", 0)))
        hit_at_ms = max(0, int(runtime_params.get("hit_at_ms", skill.hit.get("hit_delay_ms", 0) if skill.hit else 0)))
        hit_at_ms = min(hit_at_ms, expand_duration_ms) if expand_duration_ms > 0 else hit_at_ms
        max_targets = max(1, int(runtime_params.get("max_targets", len(targets) or 1)))
        ring_width = max(1.0, float(runtime_params.get("ring_width", 48.0)))
        suppress_hit_vfx = bool(runtime_params.get("suppress_hit_vfx", False))
        center_policy = str(runtime_params.get("center_policy", "player_center"))
        damage_falloff = str(runtime_params.get("damage_falloff_by_distance", "none"))
        status_chance_scale = max(0.0, float(runtime_params.get("status_chance_scale", 1.0)))
        trigger_payload = {
            key: runtime_params[key]
            for key in ("on_kill_recast_chance_percent", "on_kill_recast_max_per_area")
            if key in runtime_params
        }
        center = dict(source_position)
        vfx_key = presentation.get("vfx", skill.visual_effect)
        hit_vfx_key = presentation.get("hit_vfx_key", vfx_key)
        sfx_key = presentation.get("sfx", "")
        floating_key = presentation.get("floating_text", "skill_event.fire_bolt.floating_text")
        reason_key = _damage_reason_key(skill)
        damage_amount = skill.final_damage
        area_id = f"{skill.active_gem_instance_id}.{timestamp_ms}.area.1"
        sorted_targets = sorted(
            (
                (target, hypot(target.position["x"] - center["x"], target.position["y"] - center["y"]))
                for target in targets
            ),
            key=lambda item: item[1],
        )
        hit_targets = tuple((target, distance) for target, distance in sorted_targets if distance <= radius)[:max_targets]
        primary_target = hit_targets[0][0] if hit_targets else (targets[0] if targets else _RuntimeTarget("", center))
        primary_direction = _direction(center, primary_target.position)
        events: list[SkillEvent] = [
            SkillEvent(
                event_id=_event_id(skill, timestamp_ms, 0, "cast_start"),
                type="cast_start",
                timestamp_ms=timestamp_ms,
                source_entity=source_entity,
                target_entity=primary_target.entity_id,
                position=center,
                direction=primary_direction,
                delay_ms=0,
                duration_ms=0,
                amount=None,
                damage_type=skill.damage_type,
                skill_instance_id=skill.active_gem_instance_id,
                vfx_key=presentation.get("cast_vfx_key", vfx_key),
                sfx_key=sfx_key,
                reason_key="",
                payload={"skill_id": skill.skill_package_id or skill.skill_template_id, "center_policy": center_policy},
            ),
            SkillEvent(
                event_id=_event_id(skill, timestamp_ms, 1, "area_spawn"),
                type="area_spawn",
                timestamp_ms=timestamp_ms,
                source_entity=source_entity,
                target_entity=primary_target.entity_id,
                position=center,
                direction={"x": 0.0, "y": 0.0},
                delay_ms=0,
                duration_ms=expand_duration_ms,
                amount=None,
                damage_type=skill.damage_type,
                skill_instance_id=skill.active_gem_instance_id,
                vfx_key=vfx_key,
                sfx_key=sfx_key,
                reason_key="",
                payload={
                    "area_id": area_id,
                    "skill_id": skill.skill_package_id or skill.skill_template_id,
                    "center": dict(center),
                    "center_world_position": dict(center),
                    "radius": radius,
                    "ring_width": ring_width,
                    "duration_ms": expand_duration_ms,
                    "expand_duration_ms": expand_duration_ms,
                    "hit_at_ms": hit_at_ms,
                    "damage_type": skill.damage_type,
                    "vfx_key": vfx_key,
                    "center_policy": center_policy,
                    "damage_falloff_by_distance": damage_falloff,
                    "status_chance_scale": status_chance_scale,
                    "max_targets": max_targets,
                    "hit_target_count": len(hit_targets),
                    "suppress_hit_vfx": suppress_hit_vfx,
                    **trigger_payload,
                },
            ),
        ]
        if "guard_absorb_amount" in runtime_params:
            events.append(
                SkillEvent(
                    event_id=_event_id(skill, timestamp_ms, 2, "buff_apply"),
                    type="buff_apply",
                    timestamp_ms=timestamp_ms,
                    source_entity=source_entity,
                    target_entity=source_entity,
                    position=center,
                    direction={"x": 0.0, "y": 0.0},
                    delay_ms=0,
                    duration_ms=max(0, int(runtime_params.get("guard_duration_ms", expand_duration_ms))),
                    amount=float(runtime_params.get("guard_absorb_amount", 0.0)),
                    damage_type=skill.damage_type,
                    skill_instance_id=skill.active_gem_instance_id,
                    vfx_key=vfx_key,
                    sfx_key=sfx_key,
                    reason_key="skill_event.guard.buff_apply",
                    payload={
                        "skill_id": skill.skill_package_id or skill.skill_template_id,
                        "buff_type": "guard",
                        "absorb_percent": float(runtime_params.get("guard_absorb_percent", 0.0)),
                        "absorb_amount": float(runtime_params.get("guard_absorb_amount", 0.0)),
                        "duration_ms": max(0, int(runtime_params.get("guard_duration_ms", expand_duration_ms))),
                        "exclude_damage_over_time": bool(runtime_params.get("guard_exclude_damage_over_time", False)),
                    },
                )
            )
            return _sorted_events(events)
        next_index = 2
        floating_text = _damage_text(damage_amount, skill.damage_type)
        for target, target_distance in hit_targets:
            target_direction = _direction(center, target.position)
            area_payload = {
                "area_id": area_id,
                "skill_id": skill.skill_package_id or skill.skill_template_id,
                "center": dict(center),
                "center_world_position": dict(center),
                "radius": radius,
                "ring_width": ring_width,
                "hit_at_ms": hit_at_ms,
                "target_distance": target_distance,
                "target_world_position": dict(target.position),
                "damage_falloff_by_distance": damage_falloff,
                "status_chance_scale": status_chance_scale,
                "skill_name": skill.skill_package_id or skill.skill_template_id,
                "suppress_hit_vfx": suppress_hit_vfx,
                **trigger_payload,
            }
            hit_event_specs = [
                ("damage", damage_amount, 0, hit_vfx_key, reason_key, target.position),
                ("floating_text", damage_amount, 800, hit_vfx_key, floating_key, {"x": target.position["x"], "y": target.position["y"] - 28.0}),
            ]
            if not suppress_hit_vfx:
                hit_event_specs.insert(1, ("hit_vfx", None, 420, hit_vfx_key, reason_key, target.position))
            for event_type, amount, duration, vfx, reason, position in hit_event_specs:
                payload = {**area_payload}
                if event_type == "floating_text":
                    payload["text"] = floating_text
                events.append(
                    SkillEvent(
                        event_id=_event_id(skill, timestamp_ms, next_index, event_type),
                        type=event_type,
                        timestamp_ms=timestamp_ms + hit_at_ms,
                        source_entity=source_entity,
                        target_entity=target.entity_id,
                        position=dict(position),
                        direction=target_direction,
                        delay_ms=hit_at_ms,
                        duration_ms=duration,
                        amount=amount,
                        damage_type=skill.damage_type,
                        skill_instance_id=skill.active_gem_instance_id,
                        vfx_key=vfx,
                        sfx_key=sfx_key,
                        reason_key=reason,
                        payload=payload,
                    )
                )
                next_index += 1
        return _sorted_events(events)

    def _module_chain_events(
        self,
        skill: FinalSkillInstance,
        *,
        source_entity: str,
        source_position: dict[str, float],
        targets: tuple[_RuntimeTarget, ...],
        timestamp_ms: int,
    ) -> tuple[SkillEvent, ...]:
        runtime_params = skill.runtime_params or {}
        modules = runtime_params.get("modules", [])
        if not isinstance(modules, list):
            raise SkillRuntimeError("module chain requires modules")
        orbit_module = _first_module(modules, "orbit_emitter")
        damage_zone_module = _first_module(modules, "damage_zone")
        if orbit_module is not None and damage_zone_module is not None:
            return self._orbit_module_chain_events(
                skill,
                source_entity=source_entity,
                source_position=source_position,
                targets=targets,
                timestamp_ms=timestamp_ms,
                orbit_module=orbit_module,
                damage_zone_module=damage_zone_module,
            )
        projectile_module = _first_module(modules, "projectile")
        if projectile_module is None or damage_zone_module is None:
            raise SkillRuntimeError("module chain requires projectile and damage_zone modules")
        buff_module = _first_module(modules, "buff")
        projectile_params = _module_params(projectile_module)
        zone_params = _module_params(damage_zone_module)
        trigger_params = _module_trigger(damage_zone_module)
        buff_params = _module_params(buff_module) if buff_module is not None else {}
        buff_trigger_params = _module_trigger(buff_module) if buff_module is not None else {}

        presentation = skill.presentation_keys or {}
        origin = dict(source_position)
        spawn_position = _spawn_position(origin, projectile_params)
        primary_target = _nearest_target(origin, targets) or _RuntimeTarget("", origin)
        target_position = dict(primary_target.position)
        direction = _direction(spawn_position, target_position)
        travel_time_ms = max(1, int(projectile_params.get("travel_time_ms", 1)))
        arc_height = max(0.0, float(projectile_params.get("arc_height", 0.0)))
        trajectory = str(projectile_params.get("trajectory", "linear"))
        impact_marker_id = str(projectile_params.get("impact_marker_id", ""))
        trigger_marker_id = str(trigger_params.get("trigger_marker_id", zone_params.get("trigger_marker_id", "")))
        trigger_delay_ms = max(0, int(trigger_params.get("trigger_delay_ms", zone_params.get("trigger_delay_ms", 0))))
        if not impact_marker_id or trigger_marker_id != impact_marker_id:
            raise SkillRuntimeError("module chain trigger does not match projectile impact marker")
        impact_position = dict(target_position)
        shape = str(zone_params.get("shape", "circle"))
        if shape != "circle":
            raise SkillRuntimeError("module chain damage_zone currently supports circle")
        radius = max(1.0, float(zone_params.get("radius", skill.hit.get("hit_radius", 180.0) if skill.hit else 180.0)))
        max_targets = _max_targets(zone_params.get("max_targets"), len(targets) or 1)
        hit_at_ms = max(0, int(zone_params.get("hit_at_ms", trigger_delay_ms)))
        vfx_key = str(zone_params.get("vfx_key") or zone_params.get("zone_vfx_key") or presentation.get("vfx", skill.visual_effect))
        projectile_vfx_key = str(projectile_params.get("vfx_key") or presentation.get("projectile_vfx_key", presentation.get("vfx", skill.visual_effect)))
        hit_vfx_key = presentation.get("hit_vfx_key", vfx_key)
        sfx_key = presentation.get("sfx", "")
        floating_key = presentation.get("floating_text", "skill_event.fungal_petards.floating_text")
        reason_key = _damage_reason_key(skill)
        damage_amount = skill.final_damage
        zone_damage_amount = max(0.0, float(zone_params.get("damage_amount", damage_amount)))
        projectile_id = _projectile_id(skill, timestamp_ms, 1)
        zone_id = f"{skill.active_gem_instance_id}.{timestamp_ms}.damage_zone.1"
        zone_delay_ms = travel_time_ms + trigger_delay_ms
        duration_ms = max(hit_at_ms, int(zone_params.get("duration_ms", max(180, trigger_delay_ms))))
        tick_interval_ms = max(0, int(zone_params.get("tick_interval_ms", 0)))
        if tick_interval_ms > 0 and tick_interval_ms > duration_ms:
            raise SkillRuntimeError("module chain damage_zone tick interval must not exceed duration")
        tick_times = (hit_at_ms,)
        if tick_interval_ms > 0 and duration_ms > 0:
            tick_times = tuple(tick_time for _, tick_time in tick_schedule(duration_ms, tick_interval_ms))
        zone_hit_marker_id = f"{str(damage_zone_module.get('id', 'damage_zone'))}_hit"
        buff_trigger_marker_id = str(buff_trigger_params.get("trigger_marker_id", ""))
        if buff_module is not None and buff_trigger_marker_id != zone_hit_marker_id:
            raise SkillRuntimeError("module chain buff trigger does not match damage zone hit marker")
        buff_delay_ms = max(0, int(buff_trigger_params.get("trigger_delay_ms", 0)))
        hit_targets = _damage_zone_hit_targets(
            impact_position,
            {"x": 0.0, "y": 0.0},
            targets,
            shape="circle",
            radius=radius,
            length=0.0,
            width=0.0,
            max_targets=max_targets,
        )
        projectile_payload = {
            "projectile_id": projectile_id,
            "projectile_index": 1,
            "projectile_count": 1,
            "skill_id": skill.skill_package_id or skill.skill_template_id,
            "trajectory": trajectory,
            "start_position": dict(spawn_position),
            "spawn_world_position": dict(spawn_position),
            "target_position": dict(target_position),
            "target_world_position": dict(target_position),
            "end_position": dict(target_position),
            "expire_world_position": dict(target_position),
            "impact_world_position": dict(impact_position),
            "direction_world": dict(direction),
            "velocity_world": {"x": direction["x"], "y": direction["y"]},
            "travel_time_ms": travel_time_ms,
            "lifetime_ms": travel_time_ms,
            "expire_time_ms": timestamp_ms + travel_time_ms,
            "arc_height": arc_height,
            "impact_marker_id": impact_marker_id,
            "target_policy": str(projectile_params.get("target_policy", "target_position")),
            "projectile_speed": projectile_params.get("projectile_speed", 0),
        }
        zone_payload = {
            "zone_id": zone_id,
            "skill_id": skill.skill_package_id or skill.skill_template_id,
            "secondary_hit_id": str(damage_zone_module.get("id", "damage_zone")),
            "shape": "circle",
            "origin": dict(impact_position),
            "origin_world_position": dict(impact_position),
            "origin_policy": "trigger_position",
            "trigger_marker_id": trigger_marker_id,
            "delay_ms": trigger_delay_ms,
            "radius": radius,
            "ring_width": float(zone_params.get("ring_width", 48.0)),
            "hit_at_ms": hit_at_ms,
            "duration_ms": duration_ms,
            "tick_interval_ms": tick_interval_ms,
            "tick_count": len(tick_times),
            "max_targets": max_targets,
            "max_hits": max(1, int(zone_params.get("max_hits", len(tick_times) * max_targets))),
            "max_hits_per_target": max(1, int(zone_params.get("max_hits_per_target", len(tick_times)))),
            "damage_type": skill.damage_type,
            "damage_amount": zone_damage_amount,
            "emit_hit_vfx": bool(zone_params.get("emit_hit_vfx", True)),
            "vfx_key": vfx_key,
            "zone_vfx_key": vfx_key,
            "hit_target_count": len(hit_targets),
            "hit_marker_id": zone_hit_marker_id,
        }
        if buff_module is not None:
            zone_payload.update(
                {
                    "buff_type": str(buff_params.get("buff_type", buff_params.get("effect_type", ""))),
                    "effect_type": str(buff_params.get("effect_type", "")),
                    "polarity": str(buff_params.get("polarity", "negative")),
                    "buff_chance_percent": max(0.0, float(buff_params.get("chance_percent", 100.0))),
                    "buff_duration_ms": max(0, int(buff_params.get("duration_ms", 0))),
                    "duration_ms_for_buff": max(0, int(buff_params.get("duration_ms", 0))),
                    "base_value": max(0.0, float(buff_params.get("base_value", 0.0))),
                    "base_damage_per_second": max(0.0, float(buff_params.get("base_damage_per_second", 0.0))),
                    "damage_over_time_more_percent": max(
                        0.0,
                        float(buff_params.get("damage_over_time_more_percent", 0.0)),
                    ),
                    "effect_per_stack": max(0.0, float(buff_params.get("effect_per_stack", 0.0))),
                    "max_stacks": max(1, int(buff_params.get("max_stacks", 1))),
                    "source_skill_id": str(buff_params.get("source_skill_id", skill.skill_package_id or skill.skill_template_id)),
                }
            )
        events: list[SkillEvent] = [
            SkillEvent(
                event_id=_event_id(skill, timestamp_ms, 0, "cast_start"),
                type="cast_start",
                timestamp_ms=timestamp_ms,
                source_entity=source_entity,
                target_entity=primary_target.entity_id,
                position=origin,
                direction=direction,
                delay_ms=0,
                duration_ms=0,
                amount=None,
                damage_type=skill.damage_type,
                skill_instance_id=skill.active_gem_instance_id,
                vfx_key=presentation.get("cast_vfx_key", projectile_vfx_key),
                sfx_key=sfx_key,
                reason_key="",
                payload={"skill_id": skill.skill_package_id or skill.skill_template_id},
            ),
            SkillEvent(
                event_id=_event_id(skill, timestamp_ms, 1, "projectile_spawn"),
                type="projectile_spawn",
                timestamp_ms=timestamp_ms,
                source_entity=source_entity,
                target_entity=primary_target.entity_id,
                position=spawn_position,
                direction=direction,
                delay_ms=0,
                duration_ms=travel_time_ms,
                amount=None,
                damage_type=skill.damage_type,
                skill_instance_id=skill.active_gem_instance_id,
                vfx_key=projectile_vfx_key,
                sfx_key=sfx_key,
                reason_key="",
                payload=projectile_payload,
            ),
            SkillEvent(
                event_id=_event_id(skill, timestamp_ms, 2, "projectile_impact"),
                type="projectile_impact",
                timestamp_ms=timestamp_ms + travel_time_ms,
                source_entity=source_entity,
                target_entity=primary_target.entity_id,
                position=impact_position,
                direction=direction,
                delay_ms=travel_time_ms,
                duration_ms=0,
                amount=None,
                damage_type=skill.damage_type,
                skill_instance_id=skill.active_gem_instance_id,
                vfx_key=projectile_vfx_key,
                sfx_key=sfx_key,
                reason_key="",
                payload={**projectile_payload, "marker_id": impact_marker_id, "impact_position": dict(impact_position)},
            ),
            SkillEvent(
                event_id=_event_id(skill, timestamp_ms, 3, "damage_zone_prime"),
                type="damage_zone_prime",
                timestamp_ms=timestamp_ms + travel_time_ms,
                source_entity=source_entity,
                target_entity=primary_target.entity_id,
                position=impact_position,
                direction={"x": 0.0, "y": 0.0},
                delay_ms=travel_time_ms,
                duration_ms=trigger_delay_ms,
                amount=None,
                damage_type=skill.damage_type,
                skill_instance_id=skill.active_gem_instance_id,
                vfx_key=vfx_key,
                sfx_key=sfx_key,
                reason_key="",
                payload=zone_payload,
            ),
            SkillEvent(
                event_id=_event_id(skill, timestamp_ms, 4, "damage_zone"),
                type="damage_zone",
                timestamp_ms=timestamp_ms + zone_delay_ms,
                source_entity=source_entity,
                target_entity=primary_target.entity_id,
                position=impact_position,
                direction={"x": 0.0, "y": 0.0},
                delay_ms=zone_delay_ms,
                duration_ms=duration_ms,
                amount=None,
                damage_type=skill.damage_type,
                skill_instance_id=skill.active_gem_instance_id,
                vfx_key=vfx_key,
                sfx_key=sfx_key,
                reason_key="",
                payload=zone_payload,
            ),
        ]
        next_index = 5
        impact_damage_payload = _damage_event_payload(
            skill,
            {
                **projectile_payload,
                "marker_id": impact_marker_id,
                "impact_position": dict(impact_position),
                "hit_world_position": dict(impact_position),
                "target_world_position": dict(primary_target.position),
                "skill_name": skill.skill_package_id or skill.skill_template_id,
            },
        )
        events.append(
            SkillEvent(
                event_id=_event_id(skill, timestamp_ms, next_index, "damage"),
                type="damage",
                timestamp_ms=timestamp_ms + travel_time_ms,
                source_entity=source_entity,
                target_entity=primary_target.entity_id,
                position=dict(primary_target.position),
                direction=direction,
                delay_ms=travel_time_ms,
                duration_ms=0,
                amount=damage_amount,
                damage_type=skill.damage_type,
                skill_instance_id=skill.active_gem_instance_id,
                vfx_key=hit_vfx_key,
                sfx_key=sfx_key,
                reason_key=reason_key,
                payload=impact_damage_payload,
            )
        )
        next_index += 1
        floating_text = _damage_text(zone_damage_amount, skill.damage_type)
        if hit_targets and zone_payload["emit_hit_vfx"]:
            events.append(
                SkillEvent(
                    event_id=_event_id(skill, timestamp_ms, next_index, "hit_vfx"),
                    type="hit_vfx",
                    timestamp_ms=timestamp_ms + zone_delay_ms,
                    source_entity=source_entity,
                    target_entity=primary_target.entity_id,
                    position=dict(impact_position),
                    direction={"x": 0.0, "y": 0.0},
                    delay_ms=zone_delay_ms,
                    duration_ms=duration_ms,
                    amount=None,
                    damage_type=skill.damage_type,
                    skill_instance_id=skill.active_gem_instance_id,
                    vfx_key=hit_vfx_key,
                    sfx_key=sfx_key,
                    reason_key=reason_key,
                    payload={**zone_payload, "hit_world_position": dict(impact_position), "skill_name": skill.skill_package_id or skill.skill_template_id},
                )
            )
            next_index += 1
        for target, target_payload in hit_targets:
            target_direction = _direction(impact_position, target.position)
            for tick_index, tick_time_ms in enumerate(tick_times, start=1):
                event_delay_ms = zone_delay_ms + tick_time_ms
                hit_marker_event_id = f"{zone_id}.hit.{tick_index}.{target.entity_id}"
                hit_payload = {
                    **zone_payload,
                    **target_payload,
                    "marker_id": zone_hit_marker_id,
                    "hit_marker_event_id": hit_marker_event_id,
                    "trigger_marker_id": trigger_marker_id,
                    "tick_index": tick_index,
                    "tick_time_ms": tick_time_ms,
                    "target_world_position": dict(target.position),
                    "hit_world_position": dict(target.position),
                    "skill_name": skill.skill_package_id or skill.skill_template_id,
                    "damage_components": {skill.damage_type: zone_damage_amount},
                }
                events.append(
                    SkillEvent(
                        event_id=_event_id(skill, timestamp_ms, next_index, "damage_zone_hit"),
                        type="damage_zone_hit",
                        timestamp_ms=timestamp_ms + event_delay_ms,
                        source_entity=source_entity,
                        target_entity=target.entity_id,
                        position=dict(target.position),
                        direction=target_direction,
                        delay_ms=event_delay_ms,
                        duration_ms=0,
                        amount=None,
                        damage_type=skill.damage_type,
                        skill_instance_id=skill.active_gem_instance_id,
                        vfx_key=hit_vfx_key,
                        sfx_key=sfx_key,
                        reason_key="",
                        payload=hit_payload,
                    )
                )
                next_index += 1
                events.append(
                    SkillEvent(
                        event_id=_event_id(skill, timestamp_ms, next_index, "damage"),
                        type="damage",
                        timestamp_ms=timestamp_ms + event_delay_ms,
                        source_entity=source_entity,
                        target_entity=target.entity_id,
                        position=dict(target.position),
                        direction=target_direction,
                        delay_ms=event_delay_ms,
                        duration_ms=0,
                        amount=zone_damage_amount,
                        damage_type=skill.damage_type,
                        skill_instance_id=skill.active_gem_instance_id,
                        vfx_key=hit_vfx_key,
                        sfx_key=sfx_key,
                        reason_key=reason_key,
                        payload=hit_payload,
                    )
                )
                next_index += 1
                if buff_module is not None:
                    buff_chance_percent = max(0.0, float(buff_params.get("chance_percent", 100.0)))
                    buff_roll = (_stable_hash(f"{hit_marker_event_id}:buff_apply") % 10000) / 100.0
                    if buff_chance_percent >= 100.0 or (buff_chance_percent > 0.0 and buff_roll < buff_chance_percent):
                        buff_payload = {
                            **hit_payload,
                            "buff_type": str(buff_params.get("buff_type", "")),
                            "effect_type": str(buff_params.get("effect_type", "")),
                            "polarity": str(buff_params.get("polarity", "negative")),
                            "chance_percent": buff_chance_percent,
                            "buff_roll": buff_roll,
                            "duration_ms": max(0, int(buff_params.get("duration_ms", 0))),
                            "base_value": max(0.0, float(buff_params.get("base_value", 0.0))),
                            "base_damage_per_second": max(0.0, float(buff_params.get("base_damage_per_second", 0.0))),
                            "damage_over_time_more_percent": max(
                                0.0,
                                float(buff_params.get("damage_over_time_more_percent", 0.0)),
                            ),
                            "effect_per_stack": max(0.0, float(buff_params.get("effect_per_stack", 0.0))),
                            "max_stacks": max(1, int(buff_params.get("max_stacks", 1))),
                            "max_triggers": max(0, int(buff_params.get("max_triggers", 0))),
                            "threshold": max(0.0, float(buff_params.get("threshold", 0.0))),
                            "conversion_buff_type": str(
                                buff_params.get("conversion_buff_type", buff_params.get("convert_to_buff_type", ""))
                            ),
                            "conversion_consume_source": bool(buff_params.get("conversion_consume_source", True)),
                            "source_skill_id": str(buff_params.get("source_skill_id", skill.skill_package_id or skill.skill_template_id)),
                            "trigger_event_type": "damage_zone_hit",
                            "trigger_event_id": hit_marker_event_id,
                        }
                        events.append(
                            SkillEvent(
                                event_id=_event_id(skill, timestamp_ms, next_index, "buff_apply"),
                                type="buff_apply",
                                timestamp_ms=timestamp_ms + event_delay_ms + buff_delay_ms,
                                source_entity=source_entity,
                                target_entity=target.entity_id,
                                position=dict(target.position),
                                direction=target_direction,
                                delay_ms=event_delay_ms + buff_delay_ms,
                                duration_ms=int(buff_payload["duration_ms"]),
                                amount=None,
                                damage_type=skill.damage_type,
                                skill_instance_id=skill.active_gem_instance_id,
                                vfx_key=str(buff_params.get("vfx_key") or vfx_key),
                                sfx_key=sfx_key,
                                reason_key="",
                                payload=buff_payload,
                            )
                        )
                        next_index += 1
                payload = {**hit_payload, "text": floating_text}
                events.append(
                    SkillEvent(
                        event_id=_event_id(skill, timestamp_ms, next_index, "floating_text"),
                        type="floating_text",
                        timestamp_ms=timestamp_ms + event_delay_ms,
                        source_entity=source_entity,
                        target_entity=target.entity_id,
                        position={"x": target.position["x"], "y": target.position["y"] - 28.0},
                        direction=target_direction,
                        delay_ms=event_delay_ms,
                        duration_ms=800,
                        amount=zone_damage_amount,
                        damage_type=skill.damage_type,
                        skill_instance_id=skill.active_gem_instance_id,
                        vfx_key=hit_vfx_key,
                        sfx_key=sfx_key,
                        reason_key=floating_key,
                        payload=payload,
                    )
                )
                next_index += 1
        return _sorted_events(events)

    def _orbit_module_chain_events(
        self,
        skill: FinalSkillInstance,
        *,
        source_entity: str,
        source_position: dict[str, float],
        targets: tuple[_RuntimeTarget, ...],
        timestamp_ms: int,
        orbit_module: dict[str, Any],
        damage_zone_module: dict[str, Any],
    ) -> tuple[SkillEvent, ...]:
        orbit_params = _module_params(orbit_module)
        zone_params = _module_params(damage_zone_module)
        trigger_params = _module_trigger(damage_zone_module)
        presentation = skill.presentation_keys or {}
        origin = dict(source_position)
        primary_target = _nearest_target(origin, targets) or _RuntimeTarget("", origin)
        direction = _direction(origin, primary_target.position)
        center_policy = str(orbit_params.get("orbit_center_policy", "caster"))
        if center_policy != "caster":
            raise SkillRuntimeError("orbit_emitter currently supports caster center only")
        duration_ms = max(1, int(orbit_params.get("duration_ms", 1)))
        tick_interval_ms = max(1, int(orbit_params.get("tick_interval_ms", duration_ms)))
        if tick_interval_ms > duration_ms:
            raise SkillRuntimeError("orbit tick interval must not exceed duration")
        orbit_radius = max(1.0, float(orbit_params.get("orbit_radius", 1.0)))
        orbit_speed = float(orbit_params.get("orbit_speed_deg_per_sec", 0.0))
        orb_count = max(1, int(orbit_params.get("orb_count", 1)))
        start_angle = float(orbit_params.get("start_angle_deg", 0.0))
        radius_cycle_enabled = bool(orbit_params.get("orbit_radius_cycle_enabled", False))
        radius_cycle_amplitude = max(0.0, float(orbit_params.get("orbit_radius_cycle_amplitude", 0.0)))
        radius_cycle_period_ms = max(1, int(orbit_params.get("orbit_radius_cycle_period_ms", 1000)))
        radius_cycle_phase_deg = float(orbit_params.get("orbit_radius_cycle_phase_deg", 0.0))
        tick_marker_id = str(orbit_params.get("tick_marker_id", ""))
        trigger_marker_id = str(trigger_params.get("trigger_marker_id", zone_params.get("trigger_marker_id", "")))
        trigger_delay_ms = max(0, int(trigger_params.get("trigger_delay_ms", zone_params.get("trigger_delay_ms", 0))))
        if not tick_marker_id or trigger_marker_id != tick_marker_id:
            raise SkillRuntimeError("module chain trigger does not match orbit tick marker")
        shape = str(zone_params.get("shape", "circle"))
        if shape != "circle":
            raise SkillRuntimeError("orbit module chain damage_zone currently supports circle")
        radius = max(1.0, float(zone_params.get("radius", skill.hit.get("hit_radius", 72.0) if skill.hit else 72.0)))
        max_targets = _max_targets(zone_params.get("max_targets"), len(targets) or 1)
        hit_at_ms = max(0, int(zone_params.get("hit_at_ms", 0)))
        zone_duration_ms = max(hit_at_ms, int(zone_params.get("duration_ms", max(180, hit_at_ms))))
        zone_tick_interval_ms = max(0, int(zone_params.get("tick_interval_ms", 0)))
        zone_tick_count = len(tuple(tick_schedule(zone_duration_ms, zone_tick_interval_ms))) if zone_tick_interval_ms > 0 and zone_duration_ms > 0 else 1
        spawn_vfx_key = str(orbit_params.get("spawn_vfx_key") or presentation.get("vfx", skill.visual_effect))
        tick_vfx_key = str(orbit_params.get("tick_vfx_key") or spawn_vfx_key)
        zone_vfx_key = str(zone_params.get("vfx_key") or zone_params.get("zone_vfx_key") or presentation.get("vfx", skill.visual_effect))
        hit_vfx_key = presentation.get("hit_vfx_key", zone_vfx_key)
        sfx_key = presentation.get("sfx", "")
        floating_key = presentation.get("floating_text", "skill_event.lava_orb.floating_text")
        reason_key = _damage_reason_key(skill)
        damage_amount = skill.final_damage
        orbit_id = f"{skill.active_gem_instance_id}.{timestamp_ms}.orbit.1"
        events: list[SkillEvent] = [
            SkillEvent(
                event_id=_event_id(skill, timestamp_ms, 0, "cast_start"),
                type="cast_start",
                timestamp_ms=timestamp_ms,
                source_entity=source_entity,
                target_entity=primary_target.entity_id,
                position=origin,
                direction=direction,
                delay_ms=0,
                duration_ms=0,
                amount=None,
                damage_type=skill.damage_type,
                skill_instance_id=skill.active_gem_instance_id,
                vfx_key=presentation.get("cast_vfx_key", spawn_vfx_key),
                sfx_key=sfx_key,
                reason_key="",
                payload={"skill_id": skill.skill_package_id or skill.skill_template_id},
            ),
            SkillEvent(
                event_id=_event_id(skill, timestamp_ms, 1, "orbit_spawn"),
                type="orbit_spawn",
                timestamp_ms=timestamp_ms,
                source_entity=source_entity,
                target_entity=primary_target.entity_id,
                position=origin,
                direction={"x": 0.0, "y": 0.0},
                delay_ms=0,
                duration_ms=duration_ms,
                amount=None,
                damage_type=skill.damage_type,
                skill_instance_id=skill.active_gem_instance_id,
                vfx_key=spawn_vfx_key,
                sfx_key=sfx_key,
                reason_key="",
                payload={
                    "orbit_id": orbit_id,
                    "skill_id": skill.skill_package_id or skill.skill_template_id,
                    "orbit_center": dict(origin),
                    "orbit_center_policy": center_policy,
                    "orbit_radius": orbit_radius,
                    "duration_ms": duration_ms,
                    "tick_interval_ms": tick_interval_ms,
                    "orb_count": orb_count,
                    "orbit_speed_deg_per_sec": orbit_speed,
                    "start_angle_deg": start_angle,
                    "orbit_radius_cycle_enabled": radius_cycle_enabled,
                    "orbit_radius_cycle_amplitude": radius_cycle_amplitude,
                    "orbit_radius_cycle_period_ms": radius_cycle_period_ms,
                    "orbit_radius_cycle_phase_deg": radius_cycle_phase_deg,
                    "spawn_vfx_key": spawn_vfx_key,
                },
            ),
        ]
        next_index = 2
        floating_text = _damage_text(damage_amount, skill.damage_type)
        for tick_index, tick_time_ms in tick_schedule(duration_ms, tick_interval_ms):
            for orb_index in range(orb_count):
                orb_position = _orbit_position(
                    origin,
                    radius=orbit_radius,
                    speed_deg_per_sec=orbit_speed,
                    start_angle_deg=start_angle + (360.0 / orb_count) * orb_index,
                    timestamp_ms=tick_time_ms,
                    radius_cycle_enabled=radius_cycle_enabled,
                    radius_cycle_amplitude=radius_cycle_amplitude,
                    radius_cycle_period_ms=radius_cycle_period_ms,
                    radius_cycle_phase_deg=radius_cycle_phase_deg,
                )
                tick_event_id = _event_id(skill, timestamp_ms, next_index, "orbit_tick")
                tick_payload = {
                    "orbit_id": orbit_id,
                    "skill_id": skill.skill_package_id or skill.skill_template_id,
                    "tick_index": tick_index,
                    "tick_time_ms": tick_time_ms,
                    "orb_index": orb_index,
                    "orb_count": orb_count,
                    "orb_position": dict(orb_position),
                    "tick_marker_id": tick_marker_id,
                    "marker_id": tick_marker_id,
                    "tick_vfx_key": tick_vfx_key,
                    "orbit_radius": orbit_radius,
                    "orbit_speed_deg_per_sec": orbit_speed,
                    "start_angle_deg": start_angle,
                    "orbit_radius_cycle_enabled": radius_cycle_enabled,
                    "orbit_radius_cycle_amplitude": radius_cycle_amplitude,
                    "orbit_radius_cycle_period_ms": radius_cycle_period_ms,
                    "orbit_radius_cycle_phase_deg": radius_cycle_phase_deg,
                    "orb_distance": hypot(orb_position["x"] - origin["x"], orb_position["y"] - origin["y"]),
                }
                events.append(
                    SkillEvent(
                        event_id=tick_event_id,
                        type="orbit_tick",
                        timestamp_ms=timestamp_ms + tick_time_ms,
                        source_entity=source_entity,
                        target_entity=primary_target.entity_id,
                        position=orb_position,
                        direction={"x": 0.0, "y": 0.0},
                        delay_ms=tick_time_ms,
                        duration_ms=0,
                        amount=None,
                        damage_type=skill.damage_type,
                        skill_instance_id=skill.active_gem_instance_id,
                        vfx_key=tick_vfx_key,
                        sfx_key=sfx_key,
                        reason_key="",
                        payload=tick_payload,
                    )
                )
                next_index += 1
                zone_delay_ms = tick_time_ms + trigger_delay_ms
                damage_delay_ms = zone_delay_ms + hit_at_ms
                zone_id = f"{skill.active_gem_instance_id}.{timestamp_ms}.damage_zone.{tick_index}.{orb_index}"
                hit_targets = _damage_zone_hit_targets(
                    orb_position,
                    {"x": 0.0, "y": 0.0},
                    targets,
                    shape="circle",
                    radius=radius,
                    length=0.0,
                    width=0.0,
                    max_targets=max_targets,
                )
                zone_payload = {
                    "zone_id": zone_id,
                    "orbit_id": orbit_id,
                    "skill_id": skill.skill_package_id or skill.skill_template_id,
                    "shape": "circle",
                    "origin": dict(orb_position),
                    "origin_world_position": dict(orb_position),
                    "origin_policy": "trigger_position",
                    "trigger_marker_id": trigger_marker_id,
                    "source_tick_event_id": tick_event_id,
                    "tick_index": tick_index,
                    "tick_time_ms": tick_time_ms,
                    "orb_index": orb_index,
                    "orb_position": dict(orb_position),
                    "orbit_radius": orbit_radius,
                    "orbit_speed_deg_per_sec": orbit_speed,
                    "start_angle_deg": start_angle,
                    "orbit_radius_cycle_enabled": radius_cycle_enabled,
                    "orbit_radius_cycle_amplitude": radius_cycle_amplitude,
                    "orbit_radius_cycle_period_ms": radius_cycle_period_ms,
                    "orbit_radius_cycle_phase_deg": radius_cycle_phase_deg,
                    "orb_distance": hypot(orb_position["x"] - origin["x"], orb_position["y"] - origin["y"]),
                    "delay_ms": trigger_delay_ms,
                    "radius": radius,
                    "ring_width": float(zone_params.get("ring_width", 28.0)),
                    "hit_at_ms": hit_at_ms,
                    "duration_ms": zone_duration_ms,
                    "tick_interval_ms": zone_tick_interval_ms,
                    "tick_count": zone_tick_count,
                    "max_targets": max_targets,
                    "damage_type": skill.damage_type,
                    "vfx_key": zone_vfx_key,
                    "zone_vfx_key": zone_vfx_key,
                    "hit_target_count": len(hit_targets),
                }
                events.append(
                    SkillEvent(
                        event_id=_event_id(skill, timestamp_ms, next_index, "damage_zone"),
                        type="damage_zone",
                        timestamp_ms=timestamp_ms + zone_delay_ms,
                        source_entity=source_entity,
                        target_entity=primary_target.entity_id,
                        position=orb_position,
                        direction={"x": 0.0, "y": 0.0},
                        delay_ms=zone_delay_ms,
                        duration_ms=zone_duration_ms,
                        amount=None,
                        damage_type=skill.damage_type,
                        skill_instance_id=skill.active_gem_instance_id,
                        vfx_key=zone_vfx_key,
                        sfx_key=sfx_key,
                        reason_key="",
                        payload=zone_payload,
                    )
                )
                next_index += 1
                for target, target_payload in hit_targets:
                    target_direction = _direction(orb_position, target.position)
                    hit_payload = {
                        **zone_payload,
                        **target_payload,
                        "target_world_position": dict(target.position),
                        "hit_world_position": dict(target.position),
                        "skill_name": skill.skill_package_id or skill.skill_template_id,
                    }
                    for event_type, amount, duration, event_vfx, event_reason, position in (
                        ("damage", damage_amount, 0, hit_vfx_key, reason_key, target.position),
                        ("hit_vfx", None, 420, hit_vfx_key, reason_key, target.position),
                        ("floating_text", damage_amount, 800, hit_vfx_key, floating_key, {"x": target.position["x"], "y": target.position["y"] - 28.0}),
                    ):
                        payload = {**hit_payload}
                        if event_type == "floating_text":
                            payload["text"] = floating_text
                        events.append(
                            SkillEvent(
                                event_id=_event_id(skill, timestamp_ms, next_index, event_type),
                                type=event_type,
                                timestamp_ms=timestamp_ms + damage_delay_ms,
                                source_entity=source_entity,
                                target_entity=target.entity_id,
                                position=dict(position),
                                direction=target_direction,
                                delay_ms=damage_delay_ms,
                                duration_ms=duration,
                                amount=amount,
                                damage_type=skill.damage_type,
                                skill_instance_id=skill.active_gem_instance_id,
                                vfx_key=event_vfx,
                                sfx_key=sfx_key,
                                reason_key=event_reason,
                                payload=payload,
                            )
                        )
                        next_index += 1
        return _sorted_events(events)

    def _chain_events(
        self,
        skill: FinalSkillInstance,
        *,
        source_entity: str,
        source_position: dict[str, float],
        targets: tuple[_RuntimeTarget, ...],
        timestamp_ms: int,
    ) -> tuple[SkillEvent, ...]:
        runtime_params = skill.runtime_params or {}
        presentation = skill.presentation_keys or {}
        origin = dict(source_position)
        chain_count = max(1, int(runtime_params.get("chain_count", 1)))
        chain_radius = max(1.0, float(runtime_params.get("chain_radius", skill.hit.get("hit_radius", 180.0) if skill.hit else 180.0)))
        chain_delay_ms = max(0, int(runtime_params.get("chain_delay_ms", 0)))
        initial_delay_ms = max(
            0,
            int(skill.cast.get("windup_ms", 0) if skill.cast else 0),
            int(skill.hit.get("hit_delay_ms", 0) if skill.hit else 0),
        )
        damage_falloff_per_chain = max(0.0, min(1.0, float(runtime_params.get("damage_falloff_per_chain", 0.0))))
        target_policy = str(runtime_params.get("target_policy", "nearest_not_hit"))
        allow_repeat_target = bool(runtime_params.get("allow_repeat_target", False))
        max_targets = _max_targets(runtime_params.get("max_targets"), chain_count)
        vfx_key = str(runtime_params.get("segment_vfx_key") or presentation.get("vfx", skill.visual_effect))
        hit_vfx_key = presentation.get("hit_vfx_key", vfx_key)
        sfx_key = presentation.get("sfx", "")
        floating_key = presentation.get("floating_text", "skill_event.lightning_chain.floating_text")
        reason_key = _damage_reason_key(skill)
        primary_target = _nearest_target(origin, targets) or _RuntimeTarget("", origin)
        cast_direction = _direction(origin, primary_target.position)
        chain_targets = _chain_target_sequence(
            origin,
            targets,
            chain_radius=chain_radius,
            chain_count=chain_count,
            max_targets=max_targets,
            allow_repeat_target=allow_repeat_target,
            target_policy=target_policy,
        )
        events: list[SkillEvent] = [
            SkillEvent(
                event_id=_event_id(skill, timestamp_ms, 0, "cast_start"),
                type="cast_start",
                timestamp_ms=timestamp_ms,
                source_entity=source_entity,
                target_entity=primary_target.entity_id,
                position=origin,
                direction=cast_direction,
                delay_ms=0,
                duration_ms=initial_delay_ms,
                amount=None,
                damage_type=skill.damage_type,
                skill_instance_id=skill.active_gem_instance_id,
                vfx_key=presentation.get("cast_vfx_key", vfx_key),
                sfx_key=sfx_key,
                reason_key="",
                payload={
                    "skill_id": skill.skill_package_id or skill.skill_template_id,
                    "target_policy": target_policy,
                    "chain_count": chain_count,
                    "chain_radius": chain_radius,
                    "windup_ms": initial_delay_ms,
                },
            )
        ]
        next_index = 1
        previous_entity = source_entity
        previous_position = origin
        for segment_index, target in enumerate(chain_targets):
            delay_ms = initial_delay_ms + chain_delay_ms * segment_index
            damage_scale = max(0.0, 1.0 - damage_falloff_per_chain * segment_index)
            damage_amount = skill.final_damage * damage_scale
            direction = _direction(previous_position, target.position)
            segment_id = f"{skill.active_gem_instance_id}.{timestamp_ms}.chain.{segment_index}"
            segment_payload = {
                "segment_id": segment_id,
                "skill_id": skill.skill_package_id or skill.skill_template_id,
                "segment_index": segment_index,
                "from_target": previous_entity,
                "to_target": target.entity_id,
                "start_position": dict(previous_position),
                "end_position": dict(target.position),
                "target_world_position": dict(target.position),
                "chain_radius": chain_radius,
                "chain_delay_ms": chain_delay_ms,
                "windup_ms": initial_delay_ms,
                "chain_count": chain_count,
                "target_policy": target_policy,
                "allow_repeat_target": allow_repeat_target,
                "max_targets": runtime_params.get("max_targets", max_targets),
                "damage_scale": damage_scale,
                "damage_type": skill.damage_type,
                "vfx_key": vfx_key,
                "skill_name": skill.skill_package_id or skill.skill_template_id,
            }
            events.append(
                SkillEvent(
                    event_id=_event_id(skill, timestamp_ms, next_index, "chain_segment"),
                    type="chain_segment",
                    timestamp_ms=timestamp_ms + delay_ms,
                    source_entity=source_entity,
                    target_entity=target.entity_id,
                    position=dict(target.position),
                    direction=direction,
                    delay_ms=delay_ms,
                    duration_ms=chain_delay_ms,
                    amount=None,
                    damage_type=skill.damage_type,
                    skill_instance_id=skill.active_gem_instance_id,
                    vfx_key=vfx_key,
                    sfx_key=sfx_key,
                    reason_key="",
                    payload=segment_payload,
                )
            )
            next_index += 1
            floating_text = _damage_text(damage_amount, skill.damage_type)
            for event_type, amount, duration, vfx, reason, position in (
                ("damage", damage_amount, 0, hit_vfx_key, reason_key, target.position),
                ("hit_vfx", None, 420, hit_vfx_key, reason_key, target.position),
                ("floating_text", damage_amount, 800, hit_vfx_key, floating_key, {"x": target.position["x"], "y": target.position["y"] - 28.0}),
            ):
                payload = {**segment_payload}
                if event_type == "floating_text":
                    payload["text"] = floating_text
                events.append(
                    SkillEvent(
                        event_id=_event_id(skill, timestamp_ms, next_index, event_type),
                        type=event_type,
                        timestamp_ms=timestamp_ms + delay_ms,
                        source_entity=source_entity,
                        target_entity=target.entity_id,
                        position=dict(position),
                        direction=direction,
                        delay_ms=delay_ms,
                        duration_ms=duration,
                        amount=amount,
                        damage_type=skill.damage_type,
                        skill_instance_id=skill.active_gem_instance_id,
                        vfx_key=vfx,
                        sfx_key=sfx_key,
                        reason_key=reason,
                        payload=payload,
                    )
                )
                next_index += 1
            previous_entity = target.entity_id
            previous_position = target.position
        return _sorted_events(events)

    def _melee_arc_events(
        self,
        skill: FinalSkillInstance,
        *,
        source_entity: str,
        source_position: dict[str, float],
        targets: tuple[_RuntimeTarget, ...],
        timestamp_ms: int,
    ) -> tuple[SkillEvent, ...]:
        runtime_params = skill.runtime_params or {}
        presentation = skill.presentation_keys or {}
        origin = dict(source_position)
        arc_angle = max(1.0, min(180.0, float(runtime_params.get("arc_angle", 60.0))))
        arc_radius = max(1.0, float(runtime_params.get("arc_radius", skill.hit.get("hit_radius", 260.0) if skill.hit else 260.0)))
        windup_ms = max(0, int(runtime_params.get("windup_ms", skill.cast.get("windup_ms", 0) if skill.cast else 0)))
        hit_at_ms = max(0, int(runtime_params.get("hit_at_ms", skill.hit.get("hit_delay_ms", windup_ms) if skill.hit else windup_ms)))
        hit_at_ms = max(hit_at_ms, windup_ms)
        max_targets = max(1, int(runtime_params.get("max_targets", len(targets) or 1)))
        facing_policy = str(runtime_params.get("facing_policy", "nearest_target"))
        hit_shape = str(runtime_params.get("hit_shape", "sector"))
        status_chance_scale = max(0.0, float(runtime_params.get("status_chance_scale", 1.0)))
        slash_chance_percent = max(0.0, min(100.0, float(runtime_params.get("slash_chance_percent", 0.0))))
        slash_roll = (_stable_hash(f"{skill.active_gem_instance_id}:{timestamp_ms}:slash") % 10000) / 100.0
        slash_triggered = slash_chance_percent >= 100.0 or (slash_chance_percent > 0.0 and slash_roll < slash_chance_percent)
        flame_wave_count = max(1, int(runtime_params.get("flame_wave_count", 3)))
        flame_wave_distance = max(1.0, float(runtime_params.get("flame_wave_distance", arc_radius)))
        flame_wave_spread_angle = max(0.0, min(180.0, float(runtime_params.get("flame_wave_spread_angle", arc_angle))))
        flame_wave_arc_angle = max(1.0, min(180.0, float(runtime_params.get("flame_wave_arc_angle", arc_angle))))
        nearest_target = _nearest_target(origin, targets)
        primary_target = nearest_target or _RuntimeTarget("", origin)
        facing_direction = _direction(origin, primary_target.position)
        vfx_key = str(runtime_params.get("slash_vfx_key") or presentation.get("vfx", skill.visual_effect))
        hit_vfx_key = presentation.get("hit_vfx_key", vfx_key)
        sfx_key = presentation.get("sfx", "")
        floating_key = presentation.get("floating_text", "skill_event.puncture.floating_text")
        reason_key = _damage_reason_key(skill)
        damage_amount = skill.final_damage
        arc_id = f"{skill.active_gem_instance_id}.{timestamp_ms}.melee_arc.1"
        hit_targets = _melee_arc_hit_targets(
            origin,
            facing_direction,
            targets,
            arc_angle=arc_angle,
            arc_radius=arc_radius,
            max_targets=max_targets,
        )
        base_payload = {
            "arc_id": arc_id,
            "skill_id": skill.skill_package_id or skill.skill_template_id,
            "origin": dict(origin),
            "origin_world_position": dict(origin),
            "facing_direction": dict(facing_direction),
            "direction_world": dict(facing_direction),
            "arc_angle": arc_angle,
            "arc_radius": arc_radius,
            "hit_shape": hit_shape,
            "windup_ms": windup_ms,
            "hit_at_ms": hit_at_ms,
            "max_targets": max_targets,
            "facing_policy": facing_policy,
            "damage_type": skill.damage_type,
            "vfx_key": vfx_key,
            "slash_vfx_key": vfx_key,
            "status_chance_scale": status_chance_scale,
            "slash_chance_percent": slash_chance_percent,
            "slash_roll": slash_roll,
            "slash_triggered": slash_triggered,
            "flame_wave_count": flame_wave_count,
            "flame_wave_distance": flame_wave_distance,
            "flame_wave_spread_angle": flame_wave_spread_angle,
            "flame_wave_arc_angle": flame_wave_arc_angle,
            "hit_target_count": 0 if slash_triggered else len(hit_targets),
        }
        events: list[SkillEvent] = [
            SkillEvent(
                event_id=_event_id(skill, timestamp_ms, 0, "cast_start"),
                type="cast_start",
                timestamp_ms=timestamp_ms,
                source_entity=source_entity,
                target_entity=primary_target.entity_id,
                position=origin,
                direction=facing_direction,
                delay_ms=0,
                duration_ms=windup_ms,
                amount=None,
                damage_type=skill.damage_type,
                skill_instance_id=skill.active_gem_instance_id,
                vfx_key=presentation.get("cast_vfx_key", vfx_key),
                sfx_key=sfx_key,
                reason_key="",
                payload={"skill_id": skill.skill_package_id or skill.skill_template_id, "facing_policy": facing_policy},
            ),
            SkillEvent(
                event_id=_event_id(skill, timestamp_ms, 1, "melee_arc"),
                type="melee_arc",
                timestamp_ms=timestamp_ms,
                source_entity=source_entity,
                target_entity=primary_target.entity_id,
                position=origin,
                direction=facing_direction,
                delay_ms=0,
                duration_ms=hit_at_ms,
                amount=None,
                damage_type=skill.damage_type,
                skill_instance_id=skill.active_gem_instance_id,
                vfx_key=vfx_key,
                sfx_key=sfx_key,
                reason_key="",
                payload=base_payload,
            ),
        ]
        next_index = 2
        floating_text = _damage_text(damage_amount, skill.damage_type)
        for target, target_distance, target_angle in (() if slash_triggered else hit_targets):
            hit_payload = {
                **base_payload,
                "target_distance": target_distance,
                "target_angle": target_angle,
                "target_world_position": dict(target.position),
                "hit_world_position": dict(target.position),
                "skill_name": skill.skill_package_id or skill.skill_template_id,
            }
            for event_type, amount, duration, vfx, reason, position in (
                ("damage", damage_amount, 0, hit_vfx_key, reason_key, target.position),
                ("hit_vfx", None, 360, hit_vfx_key, reason_key, target.position),
                ("floating_text", damage_amount, 800, hit_vfx_key, floating_key, {"x": target.position["x"], "y": target.position["y"] - 28.0}),
            ):
                payload = {**hit_payload}
                if event_type == "damage":
                    payload = _damage_event_payload(skill, payload)
                if event_type == "floating_text":
                    payload["text"] = floating_text
                events.append(
                    SkillEvent(
                        event_id=_event_id(skill, timestamp_ms, next_index, event_type),
                        type=event_type,
                        timestamp_ms=timestamp_ms + hit_at_ms,
                        source_entity=source_entity,
                        target_entity=target.entity_id,
                        position=dict(position),
                        direction=facing_direction,
                        delay_ms=hit_at_ms,
                        duration_ms=duration,
                        amount=amount,
                        damage_type=skill.damage_type,
                        skill_instance_id=skill.active_gem_instance_id,
                        vfx_key=vfx,
                        sfx_key=sfx_key,
                        reason_key=reason,
                        payload=payload,
                    )
                )
                next_index += 1
        if slash_triggered:
            shotgun_state = shotgun_state_from_runtime_params(runtime_params)
            wave_angles = _spread_angles(flame_wave_count, flame_wave_spread_angle)
            for wave_index, wave_angle in enumerate(wave_angles, start=1):
                wave_direction = _rotate_direction(facing_direction, wave_angle) if wave_angle else dict(facing_direction)
                wave_id = f"{skill.active_gem_instance_id}.{timestamp_ms}.flame_wave.{wave_index}"
                wave_hit_targets = _melee_arc_hit_targets(
                    origin,
                    wave_direction,
                    targets,
                    arc_angle=flame_wave_arc_angle,
                    arc_radius=flame_wave_distance,
                    max_targets=max_targets,
                )
                wave_payload = {
                    **base_payload,
                    "arc_id": wave_id,
                    "flame_wave_id": wave_id,
                    "flame_wave_index": wave_index,
                    "flame_wave_count": flame_wave_count,
                    "local_spread_angle": wave_angle,
                    "facing_direction": dict(wave_direction),
                    "direction_world": dict(wave_direction),
                    "arc_angle": flame_wave_arc_angle,
                    "arc_radius": flame_wave_distance,
                    "hit_target_count": len(wave_hit_targets),
                }
                events.append(
                    SkillEvent(
                        event_id=_event_id(skill, timestamp_ms, next_index, "melee_arc"),
                        type="melee_arc",
                        timestamp_ms=timestamp_ms,
                        source_entity=source_entity,
                        target_entity=primary_target.entity_id,
                        position=origin,
                        direction=wave_direction,
                        delay_ms=0,
                        duration_ms=hit_at_ms,
                        amount=None,
                        damage_type=skill.damage_type,
                        skill_instance_id=skill.active_gem_instance_id,
                        vfx_key=vfx_key,
                        sfx_key=sfx_key,
                        reason_key="",
                        payload=wave_payload,
                    )
                )
                next_index += 1
                for target, target_distance, target_angle in wave_hit_targets:
                    hit_sequence, damage_scale = shotgun_state.record_hit(target.entity_id)
                    scaled_amount = damage_amount * damage_scale
                    wave_hit_payload = {
                        **wave_payload,
                        "target_distance": target_distance,
                        "target_angle": target_angle,
                        "target_world_position": dict(target.position),
                        "hit_world_position": dict(target.position),
                        "skill_name": skill.skill_package_id or skill.skill_template_id,
                        "same_target_hit_sequence": hit_sequence,
                        "damage_scale": damage_scale,
                    }
                    if "shotgun_falloff_coeff" in runtime_params:
                        wave_hit_payload["shotgun_falloff_coeff"] = max(0.0, min(1.0, float(runtime_params["shotgun_falloff_coeff"])))
                    scaled_floating_text = _damage_text(scaled_amount, skill.damage_type)
                    for event_type, amount, duration, vfx, reason, position in (
                        ("damage", scaled_amount, 0, hit_vfx_key, reason_key, target.position),
                        ("hit_vfx", None, 360, hit_vfx_key, reason_key, target.position),
                        ("floating_text", scaled_amount, 800, hit_vfx_key, floating_key, {"x": target.position["x"], "y": target.position["y"] - 28.0}),
                    ):
                        payload = {**wave_hit_payload}
                        if event_type == "damage":
                            payload = _damage_event_payload(skill, payload, amount_scale=damage_scale)
                        if event_type == "floating_text":
                            payload["text"] = scaled_floating_text
                        events.append(
                            SkillEvent(
                                event_id=_event_id(skill, timestamp_ms, next_index, event_type),
                                type=event_type,
                                timestamp_ms=timestamp_ms + hit_at_ms,
                                source_entity=source_entity,
                                target_entity=target.entity_id,
                                position=dict(position),
                                direction=wave_direction,
                                delay_ms=hit_at_ms,
                                duration_ms=duration,
                                amount=amount,
                                damage_type=skill.damage_type,
                                skill_instance_id=skill.active_gem_instance_id,
                                vfx_key=vfx,
                                sfx_key=sfx_key,
                                reason_key=reason,
                                payload=payload,
                            )
                        )
                        next_index += 1
        return _sorted_events(events)

    def _damage_zone_events(
        self,
        skill: FinalSkillInstance,
        *,
        source_entity: str,
        source_position: dict[str, float],
        targets: tuple[_RuntimeTarget, ...],
        timestamp_ms: int,
        runtime_context: object | None = None,
    ) -> tuple[SkillEvent, ...]:
        runtime_params = skill.runtime_params or {}
        presentation = skill.presentation_keys or {}
        shape = str(runtime_params.get("shape", "circle"))
        origin_policy = str(runtime_params.get("origin_policy", "caster"))
        facing_policy = str(runtime_params.get("facing_policy", "none" if shape == "circle" else "nearest_target"))
        hit_at_ms = max(0, int(runtime_params.get("hit_at_ms", skill.hit.get("hit_delay_ms", 0) if skill.hit else 0)))
        max_targets = max(1, int(runtime_params.get("max_targets", len(targets) or 1)))
        status_chance_scale = max(0.0, float(runtime_params.get("status_chance_scale", 1.0)))
        expand_duration_ms = max(0, int(runtime_params.get("expand_duration_ms", hit_at_ms)))
        ring_width = max(1.0, float(runtime_params.get("ring_width", 48.0)))
        caster_position = dict(source_position)
        nearest_target = _nearest_target(caster_position, targets)
        primary_target = nearest_target or _RuntimeTarget("", caster_position)
        origin = dict(primary_target.position) if origin_policy == "target_position" else dict(caster_position)
        facing_direction = {"x": 0.0, "y": 0.0} if facing_policy == "none" else _direction(origin, primary_target.position)
        direction_world = dict(facing_direction)
        angle_offset_deg = 0.0
        radius = 0.0
        length = 0.0
        width = 0.0
        angle_deg = 360.0
        if shape == "circle":
            radius = max(1.0, float(runtime_params.get("radius", skill.hit.get("hit_radius", 360.0) if skill.hit else 360.0)))
        elif shape == "rectangle":
            length = max(1.0, float(runtime_params.get("length", skill.hit.get("hit_radius", 320.0) if skill.hit else 320.0)))
            width = max(1.0, float(runtime_params.get("width", 96.0)))
            angle_offset_deg = float(runtime_params.get("angle_offset_deg", 0.0))
            direction_world = _rotate_direction(facing_direction, angle_offset_deg)
            angle_deg = 0.0
        else:
            raise SkillRuntimeError(f"unsupported damage zone shape: {shape}")

        vfx_key = str(runtime_params.get("zone_vfx_key") or presentation.get("vfx", skill.visual_effect))
        hit_vfx_key = presentation.get("hit_vfx_key", vfx_key)
        sfx_key = presentation.get("sfx", "")
        floating_key = presentation.get("floating_text", "skill_event.fire_bolt.floating_text")
        reason_key = _damage_reason_key(skill)
        zone_id = f"{skill.active_gem_instance_id}.{timestamp_ms}.damage_zone.1"
        hit_targets = _damage_zone_hit_targets(
            origin,
            direction_world,
            targets,
            shape=shape,
            radius=radius,
            length=length,
            width=width,
            max_targets=max_targets,
        )
        tick_interval_ms = int(runtime_params.get("tick_interval_ms", 0))
        configured_duration_ms = int(runtime_params.get("duration_ms", 0))
        duration_ms = max(hit_at_ms, expand_duration_ms if shape == "circle" else 0, configured_duration_ms)
        if tick_interval_ms > 0 and duration_ms > 0 and tick_interval_ms > duration_ms:
            raise SkillRuntimeError("damage zone tick interval must not exceed duration")
        tick_times = (hit_at_ms,)
        if tick_interval_ms > 0 and duration_ms > 0:
            tick_times = tuple(tick_time for _, tick_time in tick_schedule(duration_ms, tick_interval_ms))
        damage_form = str((skill.source_context or {}).get("damage_form", ""))
        damage_amount = skill.final_damage
        if damage_form == "damage_over_time" and tick_interval_ms > 0:
            damage_amount = round(skill.final_damage * tick_interval_ms / 1000.0, 6)
        channel_payload, channel_slash_payload = _damage_zone_channel_payloads(
            skill,
            runtime_params,
            timestamp_ms,
            runtime_context,
            base_radius=radius,
            base_damage_amount=damage_amount,
        )
        aggravation_value = max(0.0, float(runtime_params.get("aggravation_value", 0.0)))
        aggravation_cooldown_ms = max(0, int(runtime_params.get("aggravation_cooldown_ms", 0)))
        aggravation_duration_ms = max(1, configured_duration_ms or duration_ms or aggravation_cooldown_ms or 1)
        aggravation_dot_bonus = max(0.0, float(runtime_params.get("dot_damage_bonus_per_10_aggravation_percent", 0.0)))
        knockback_policy = str(runtime_params.get("knockback_policy", ""))
        knockback_interval_ms = max(0, int(runtime_params.get("knockback_interval_ms", 0)))
        knockback_distance = max(1.0, float(runtime_params.get("knockback_distance", 24.0)))
        extra_payload = {
            key: runtime_params[key]
            for key in (
                "knockback_policy",
                "knockback_interval_ms",
                "aggravation_value",
                "aggravation_cooldown_ms",
                "dot_damage_bonus_per_10_aggravation_percent",
            )
            if key in runtime_params
        }
        wave_count = max(1, int(runtime_params.get("wave_count", 1)))
        target_lock_policy = str(runtime_params.get("target_lock_policy", ""))
        if wave_count > 1 and target_lock_policy in {"nearest_unique_enemy", "random_enemy", "random_unique_enemy"}:
            search_range = float(runtime_params.get("search_range", (skill.cast or {}).get("search_range", 0.0)))
            lock_candidates = tuple(
                target
                for target in targets
                if search_range <= 0
                or hypot(target.position["x"] - caster_position["x"], target.position["y"] - caster_position["y"]) <= search_range
            ) or targets or (primary_target,)
            if target_lock_policy == "nearest_unique_enemy":
                ordered_locks = tuple(
                    target for target in sorted(
                        lock_candidates,
                        key=lambda item: (
                            hypot(item.position["x"] - caster_position["x"], item.position["y"] - caster_position["y"]),
                            item.entity_id,
                        ),
                    )
                    if target.entity_id
                ) or lock_candidates
            else:
                ordered_locks = tuple(
                    target for target in sorted(
                        lock_candidates,
                        key=lambda item: (
                            _stable_hash(f"{skill.active_gem_instance_id}:{timestamp_ms}:blizzard_lock:{item.entity_id}"),
                            hypot(item.position["x"] - caster_position["x"], item.position["y"] - caster_position["y"]),
                            item.entity_id,
                        ),
                    )
                    if target.entity_id
                ) or lock_candidates
            locked_targets = tuple(
                ordered_locks[index % len(ordered_locks)]
                for index in range(wave_count)
            )
            wave_interval_ms = max(0, int(runtime_params.get("wave_interval_ms", tick_interval_ms or 0)))
            marker_policy = str(runtime_params.get("impact_marker_policy", "target_lock"))
            events: list[SkillEvent] = [
                SkillEvent(
                    event_id=_event_id(skill, timestamp_ms, 0, "cast_start"),
                    type="cast_start",
                    timestamp_ms=timestamp_ms,
                    source_entity=source_entity,
                    target_entity=locked_targets[0].entity_id,
                    position=dict(locked_targets[0].position),
                    direction={"x": 0.0, "y": 0.0},
                    delay_ms=0,
                    duration_ms=0,
                    amount=None,
                    damage_type=skill.damage_type,
                    skill_instance_id=skill.active_gem_instance_id,
                    vfx_key=presentation.get("cast_vfx_key", vfx_key),
                    sfx_key=sfx_key,
                    reason_key="",
                    payload={
                        "skill_id": skill.skill_package_id or skill.skill_template_id,
                        "origin_policy": origin_policy,
                        "target_lock_policy": target_lock_policy,
                        "wave_count": wave_count,
                    },
                )
            ]
            next_index = 1
            floating_text = _damage_text(damage_amount, skill.damage_type)
            for wave_index, locked_target in enumerate(locked_targets, start=1):
                wave_origin = dict(locked_target.position)
                wave_delay_ms = hit_at_ms + (wave_index - 1) * wave_interval_ms
                marker_id = f"{skill.active_gem_instance_id}.{timestamp_ms}.damage_zone_hit.{wave_index}"
                zone_id = f"{skill.active_gem_instance_id}.{timestamp_ms}.damage_zone.{wave_index}"
                hit_targets_for_wave = _damage_zone_hit_targets(
                    wave_origin,
                    {"x": 0.0, "y": 0.0},
                    targets,
                    shape=shape,
                    radius=radius,
                    length=length,
                    width=width,
                    max_targets=max_targets,
                )
                wave_payload = {
                    "zone_id": zone_id,
                    "skill_id": skill.skill_package_id or skill.skill_template_id,
                    "shape": shape,
                    "origin": dict(wave_origin),
                    "origin_world_position": dict(wave_origin),
                    "origin_policy": "target_lock",
                    "facing_policy": "none",
                    "facing_direction": {"x": 0.0, "y": 0.0},
                    "direction_world": {"x": 0.0, "y": 0.0},
                    "facing_angle_deg": 0.0,
                    "angle_offset_deg": 0.0,
                    "angle_deg": 360.0,
                    "radius": radius if shape == "circle" else None,
                    "length": length if shape == "rectangle" else None,
                    "width": width if shape == "rectangle" else None,
                    "ring_width": ring_width if shape == "circle" else None,
                    "duration_ms": duration_ms,
                    "expand_duration_ms": expand_duration_ms if shape == "circle" else 0,
                    "hit_at_ms": hit_at_ms,
                    "wave_index": wave_index,
                    "wave_count": wave_count,
                    "wave_interval_ms": wave_interval_ms,
                    "tick_interval_ms": 0,
                    "tick_count": 1,
                    "max_targets": max_targets,
                    "max_hits": max(1, int(runtime_params.get("max_hits", max_targets))),
                    "max_hits_per_target": max(1, int(runtime_params.get("max_hits_per_target", 1))),
                    "damage_type": skill.damage_type,
                    "vfx_key": vfx_key,
                    "zone_vfx_key": vfx_key,
                    "status_chance_scale": status_chance_scale,
                    "hit_target_count": len(hit_targets_for_wave),
                    "target_lock_policy": target_lock_policy,
                    "impact_marker_policy": marker_policy,
                    "trigger_marker_id": marker_id,
                    "hit_marker_id": marker_id,
                    "locked_target_entity": locked_target.entity_id,
                    "locked_target_world_position": dict(locked_target.position),
                    **extra_payload,
                }
                for event_type, duration, event_payload in (
                    ("damage_zone_hit", 0, {**wave_payload, "marker_id": marker_id}),
                    ("damage_zone", duration_ms, wave_payload),
                ):
                    events.append(
                        SkillEvent(
                            event_id=_event_id(skill, timestamp_ms, next_index, event_type),
                            type=event_type,
                            timestamp_ms=timestamp_ms + wave_delay_ms,
                            source_entity=source_entity,
                            target_entity=locked_target.entity_id,
                            position=dict(wave_origin),
                            direction={"x": 0.0, "y": 0.0},
                            delay_ms=wave_delay_ms,
                            duration_ms=duration,
                            amount=None,
                            damage_type=skill.damage_type,
                            skill_instance_id=skill.active_gem_instance_id,
                            vfx_key=vfx_key,
                            sfx_key=sfx_key,
                            reason_key="",
                            payload=event_payload,
                        )
                    )
                    next_index += 1
                for target, target_payload in hit_targets_for_wave:
                    target_direction = _direction(wave_origin, target.position)
                    hit_payload = {
                        **wave_payload,
                        **target_payload,
                        "tick_index": 1,
                        "tick_time_ms": wave_delay_ms,
                        "target_world_position": dict(target.position),
                        "hit_world_position": dict(target.position),
                        "skill_name": skill.skill_package_id or skill.skill_template_id,
                    }
                    for event_type, amount, duration, vfx, reason, position in (
                        ("damage", damage_amount, 0, hit_vfx_key, reason_key, target.position),
                        ("hit_vfx", None, 420, hit_vfx_key, reason_key, target.position),
                        ("floating_text", damage_amount, 800, hit_vfx_key, floating_key, {"x": target.position["x"], "y": target.position["y"] - 28.0}),
                    ):
                        payload = {**hit_payload}
                        if event_type == "floating_text":
                            payload["text"] = floating_text
                        events.append(
                            SkillEvent(
                                event_id=_event_id(skill, timestamp_ms, next_index, event_type),
                                type=event_type,
                                timestamp_ms=timestamp_ms + wave_delay_ms,
                                source_entity=source_entity,
                                target_entity=target.entity_id,
                                position=dict(position),
                                direction=target_direction,
                                delay_ms=wave_delay_ms,
                                duration_ms=duration,
                                amount=amount,
                                damage_type=skill.damage_type,
                                skill_instance_id=skill.active_gem_instance_id,
                                vfx_key=vfx,
                                sfx_key=sfx_key,
                                reason_key=reason,
                                payload=payload,
                            )
                        )
                        next_index += 1
                    events.extend(
                        _status_apply_events(
                            skill,
                            timestamp_ms=timestamp_ms,
                            base_index=next_index,
                            source_entity=source_entity,
                            target_entity=target.entity_id,
                            position=target.position,
                            direction=target_direction,
                            delay_ms=wave_delay_ms,
                            payload=hit_payload,
                        )
                    )
                    next_index += len(skill.ailments)
            return _sorted_events(events)
        base_payload = {
            "zone_id": zone_id,
            "skill_id": skill.skill_package_id or skill.skill_template_id,
            "shape": shape,
            "origin": dict(origin),
            "origin_world_position": dict(origin),
            "origin_policy": origin_policy,
            "facing_policy": facing_policy,
            "facing_direction": dict(facing_direction),
            "direction_world": dict(direction_world),
            "facing_angle_deg": _direction_angle_deg(direction_world) if direction_world != {"x": 0.0, "y": 0.0} else 0.0,
            "angle_offset_deg": angle_offset_deg,
            "angle_deg": angle_deg,
            "radius": radius if shape == "circle" else None,
            "length": length if shape == "rectangle" else None,
            "width": width if shape == "rectangle" else None,
            "ring_width": ring_width if shape == "circle" else None,
            "duration_ms": duration_ms,
            "expand_duration_ms": expand_duration_ms if shape == "circle" else 0,
            "hit_at_ms": hit_at_ms,
            "tick_interval_ms": tick_interval_ms,
            "tick_count": len(tick_times),
            "max_targets": max_targets,
            "max_hits": max(1, int(runtime_params.get("max_hits", len(tick_times) * max_targets))),
            "max_hits_per_target": max(1, int(runtime_params.get("max_hits_per_target", len(tick_times)))),
            "damage_type": skill.damage_type,
            "damage_amount": damage_amount,
            "vfx_key": vfx_key,
            "zone_vfx_key": vfx_key,
            "status_chance_scale": status_chance_scale,
            "hit_target_count": len(hit_targets),
            **channel_payload,
            **extra_payload,
        }
        events: list[SkillEvent] = [
            SkillEvent(
                event_id=_event_id(skill, timestamp_ms, 0, "cast_start"),
                type="cast_start",
                timestamp_ms=timestamp_ms,
                source_entity=source_entity,
                target_entity=primary_target.entity_id,
                position=origin,
                direction=direction_world,
                delay_ms=0,
                duration_ms=0,
                amount=None,
                damage_type=skill.damage_type,
                skill_instance_id=skill.active_gem_instance_id,
                vfx_key=presentation.get("cast_vfx_key", vfx_key),
                sfx_key=sfx_key,
                reason_key="",
                payload={
                    "skill_id": skill.skill_package_id or skill.skill_template_id,
                    "origin_policy": origin_policy,
                    "facing_policy": facing_policy,
                    **channel_payload,
                },
            ),
            SkillEvent(
                event_id=_event_id(skill, timestamp_ms, 1, "damage_zone"),
                type="damage_zone",
                timestamp_ms=timestamp_ms,
                source_entity=source_entity,
                target_entity=primary_target.entity_id,
                position=origin,
                direction=direction_world,
                delay_ms=0,
                duration_ms=duration_ms,
                amount=None,
                damage_type=skill.damage_type,
                skill_instance_id=skill.active_gem_instance_id,
                vfx_key=vfx_key,
                sfx_key=sfx_key,
                reason_key="",
                payload=base_payload,
            ),
        ]
        next_index = 2
        floating_text = _damage_text(damage_amount, skill.damage_type)
        for tick_number, tick_at_ms in enumerate(tick_times, start=1):
            for target, target_payload in hit_targets:
                target_direction = _direction(origin, target.position)
                hit_payload = {
                    **base_payload,
                    **target_payload,
                    "tick_index": tick_number,
                    "tick_time_ms": tick_at_ms,
                    "target_world_position": dict(target.position),
                    "hit_world_position": dict(target.position),
                    "skill_name": skill.skill_package_id or skill.skill_template_id,
                }
                for event_type, amount, duration, vfx, reason, position in (
                    ("damage", damage_amount, 0, hit_vfx_key, reason_key, target.position),
                    ("hit_vfx", None, 420, hit_vfx_key, reason_key, target.position),
                    ("floating_text", damage_amount, 800, hit_vfx_key, floating_key, {"x": target.position["x"], "y": target.position["y"] - 28.0}),
                ):
                    payload = {**hit_payload}
                    if event_type == "floating_text":
                        payload["text"] = floating_text
                    events.append(
                        SkillEvent(
                            event_id=_event_id(skill, timestamp_ms, next_index, event_type),
                            type=event_type,
                            timestamp_ms=timestamp_ms + tick_at_ms,
                            source_entity=source_entity,
                            target_entity=target.entity_id,
                            position=dict(position),
                            direction=target_direction,
                            delay_ms=tick_at_ms,
                            duration_ms=duration,
                            amount=amount,
                            damage_type=skill.damage_type,
                            skill_instance_id=skill.active_gem_instance_id,
                            vfx_key=vfx,
                            sfx_key=sfx_key,
                            reason_key=reason,
                            payload=payload,
                        )
                    )
                    next_index += 1
                events.extend(
                    _status_apply_events(
                        skill,
                        timestamp_ms=timestamp_ms,
                        base_index=next_index,
                        source_entity=source_entity,
                        target_entity=target.entity_id,
                        position=target.position,
                        direction=target_direction,
                        delay_ms=tick_at_ms,
                        payload=hit_payload,
                    )
                )
                next_index += len(skill.ailments)
                if aggravation_value > 0:
                    first_tick_at_ms = tick_times[0] if tick_times else tick_at_ms
                    elapsed_since_first_tick = max(0, tick_at_ms - first_tick_at_ms)
                    if aggravation_cooldown_ms <= 0 or elapsed_since_first_tick % aggravation_cooldown_ms == 0:
                        aggravation_payload = {
                            **hit_payload,
                            "status_type": "aggravation",
                            "source_damage_type": skill.damage_type,
                            "chance_percent": 100.0,
                            "duration_ms": aggravation_duration_ms,
                            "base_value": aggravation_value,
                            "effect_per_stack": aggravation_dot_bonus,
                            "max_stacks": 999,
                            "source_skill_id": skill.skill_package_id or skill.skill_template_id,
                            "damage_components": {skill.damage_type: damage_amount},
                        }
                        events.append(
                            SkillEvent(
                                event_id=_event_id(skill, timestamp_ms, next_index, "status_apply"),
                                type="status_apply",
                                timestamp_ms=timestamp_ms + tick_at_ms,
                                source_entity=source_entity,
                                target_entity=target.entity_id,
                                position=dict(target.position),
                                direction=target_direction,
                                delay_ms=tick_at_ms,
                                duration_ms=aggravation_duration_ms,
                                amount=None,
                                damage_type=skill.damage_type,
                                skill_instance_id=skill.active_gem_instance_id,
                                vfx_key=hit_vfx_key,
                                sfx_key=sfx_key,
                                reason_key="skill_event.aggravation.status_apply",
                                payload=aggravation_payload,
                            )
                        )
                        next_index += 1
        if channel_slash_payload:
            slash_radius = max(1.0, float(channel_slash_payload["radius"]))
            slash_damage_amount = max(0.0, float(channel_slash_payload["damage_amount"]))
            slash_zone_id = f"{skill.active_gem_instance_id}.{timestamp_ms}.damage_zone.slash"
            slash_hit_targets = _damage_zone_hit_targets(
                origin,
                direction_world,
                targets,
                shape=shape,
                radius=slash_radius,
                length=length,
                width=width,
                max_targets=max_targets,
            )
            slash_payload = {
                **base_payload,
                **channel_slash_payload,
                "zone_id": slash_zone_id,
                "radius": slash_radius if shape == "circle" else None,
                "damage_amount": slash_damage_amount,
                "hit_target_count": len(slash_hit_targets),
                "tick_interval_ms": 0,
                "tick_count": 1,
                "max_hits": max(1, max_targets),
                "max_hits_per_target": 1,
            }
            events.append(
                SkillEvent(
                    event_id=_event_id(skill, timestamp_ms, next_index, "damage_zone"),
                    type="damage_zone",
                    timestamp_ms=timestamp_ms,
                    source_entity=source_entity,
                    target_entity=primary_target.entity_id,
                    position=origin,
                    direction=direction_world,
                    delay_ms=0,
                    duration_ms=max(hit_at_ms, expand_duration_ms if shape == "circle" else 0, 240),
                    amount=None,
                    damage_type=skill.damage_type,
                    skill_instance_id=skill.active_gem_instance_id,
                    vfx_key=vfx_key,
                    sfx_key=sfx_key,
                    reason_key="",
                    payload=slash_payload,
                )
            )
            next_index += 1
            slash_floating_text = _damage_text(slash_damage_amount, skill.damage_type)
            for target, target_payload in slash_hit_targets:
                target_direction = _direction(origin, target.position)
                hit_payload = {
                    **slash_payload,
                    **target_payload,
                    "tick_index": 1,
                    "tick_time_ms": hit_at_ms,
                    "target_world_position": dict(target.position),
                    "hit_world_position": dict(target.position),
                    "skill_name": skill.skill_package_id or skill.skill_template_id,
                }
                for event_type, amount, duration, vfx, reason, position in (
                    ("damage", slash_damage_amount, 0, hit_vfx_key, reason_key, target.position),
                    ("hit_vfx", None, 420, hit_vfx_key, reason_key, target.position),
                    ("floating_text", slash_damage_amount, 800, hit_vfx_key, floating_key, {"x": target.position["x"], "y": target.position["y"] - 28.0}),
                ):
                    payload = {**hit_payload}
                    if event_type == "floating_text":
                        payload["text"] = slash_floating_text
                    events.append(
                        SkillEvent(
                            event_id=_event_id(skill, timestamp_ms, next_index, event_type),
                            type=event_type,
                            timestamp_ms=timestamp_ms + hit_at_ms,
                            source_entity=source_entity,
                            target_entity=target.entity_id,
                            position=dict(position),
                            direction=target_direction,
                            delay_ms=hit_at_ms,
                            duration_ms=duration,
                            amount=amount,
                            damage_type=skill.damage_type,
                            skill_instance_id=skill.active_gem_instance_id,
                            vfx_key=vfx,
                            sfx_key=sfx_key,
                            reason_key=reason,
                            payload=payload,
                        )
                    )
                    next_index += 1
                events.extend(
                    _status_apply_events(
                        skill,
                        timestamp_ms=timestamp_ms,
                        base_index=next_index,
                        source_entity=source_entity,
                        target_entity=target.entity_id,
                        position=target.position,
                        direction=target_direction,
                        delay_ms=hit_at_ms,
                        payload=hit_payload,
                    )
                )
                next_index += len(skill.ailments)
        if knockback_policy == "reverse" and knockback_interval_ms > 0 and duration_ms > 0:
            pull_times = tuple(tick_time for _, tick_time in tick_schedule(duration_ms, knockback_interval_ms))
            for pull_number, pull_at_ms in enumerate(pull_times, start=1):
                pull_payload = {
                    **base_payload,
                    "pull_index": pull_number,
                    "pull_time_ms": pull_at_ms,
                    "tick_index": pull_number,
                    "tick_time_ms": pull_at_ms,
                    "skill_name": skill.skill_package_id or skill.skill_template_id,
                    "movement_policy": "pull_to_origin",
                    "movement_scope": "damage_zone",
                    "knockback_policy": knockback_policy,
                    "movement_distance": knockback_distance,
                }
                events.append(
                    SkillEvent(
                        event_id=_event_id(skill, timestamp_ms, next_index, "forced_movement"),
                        type="forced_movement",
                        timestamp_ms=timestamp_ms + pull_at_ms,
                        source_entity=source_entity,
                        target_entity="",
                        position=dict(origin),
                        direction={"x": 0.0, "y": 0.0},
                        delay_ms=pull_at_ms,
                        duration_ms=0,
                        amount=knockback_distance,
                        damage_type=skill.damage_type,
                        skill_instance_id=skill.active_gem_instance_id,
                        vfx_key=hit_vfx_key,
                        sfx_key=sfx_key,
                        reason_key="skill_event.black_hole.reverse_knockback",
                        payload=pull_payload,
                    )
                )
                next_index += 1
        return _sorted_events(events)

    def _projectile_events(
        self,
        skill: FinalSkillInstance,
        *,
        source_entity: str,
        source_position: dict[str, float],
        target_entity: str,
        target_position: dict[str, float],
        timestamp_ms: int,
    ) -> tuple[SkillEvent, ...]:
        runtime_params = skill.runtime_params or {}
        presentation = skill.presentation_keys or {}
        projectile_speed = max(1.0, float(runtime_params.get("projectile_speed", 720.0)))
        min_duration_ms = int(runtime_params.get("min_duration_ms", 0))
        max_duration_ms = _optional_int(runtime_params.get("max_duration_ms"))
        projectile_count = max(1, int(runtime_params.get("projectile_count", skill.projectile_count)))
        burst_interval_ms = max(0, int(runtime_params.get("burst_interval_ms", 0)))
        spread_angle_deg = _spread_angle_deg(runtime_params, skill.behavior_template)
        angle_step_deg = _angle_step_deg(runtime_params, skill.behavior_template)
        random_angle_jitter_deg = _random_angle_jitter_deg(runtime_params)
        damage_amount = skill.final_damage
        max_distance = max(1.0, float(runtime_params.get("max_distance", 520.0)))
        pierce_count = max(0, int(runtime_params.get("pierce_count", 0)))
        hit_policy = str(runtime_params.get("hit_policy", "first_hit"))
        impact_marker_id = str(runtime_params.get("impact_marker_id", "projectile_hit"))
        target_policy = str(runtime_params.get("target_policy", "target_position"))
        trajectory = str(runtime_params.get("trajectory", "linear"))
        arc_height = max(0.0, float(runtime_params.get("arc_height", 0.0)))
        projectile_visual_mode = str(runtime_params.get("projectile_visual_mode", "standard"))
        tracks_direct_target = target_policy in {"random_enemy", "nearest_unique_enemy"}
        visual_distance = max_distance if pierce_count > 0 else 0.0
        spawn_position = _spawn_position(source_position, runtime_params)
        distance = hypot(target_position["x"] - spawn_position["x"], target_position["y"] - spawn_position["y"])
        visual_distance = visual_distance or distance
        duration_ms = _projectile_travel_duration_ms(
            visual_distance,
            projectile_speed,
            min_duration_ms,
            max_duration_ms,
            runtime_params,
            projectile_visual_mode,
        )
        impact_duration_ms = _projectile_travel_duration_ms(
            distance,
            projectile_speed,
            min_duration_ms,
            max_duration_ms,
            runtime_params,
            projectile_visual_mode,
        )
        direction = _direction(spawn_position, target_position)
        vfx_key = presentation.get("projectile_vfx_key", presentation.get("vfx", skill.visual_effect))
        hit_vfx_key = presentation.get("hit_vfx_key", presentation.get("vfx", vfx_key))
        sfx_key = presentation.get("sfx", "")
        floating_key = presentation.get("floating_text", "skill_event.fire_bolt.floating_text")
        reason_key = _damage_reason_key(skill)
        forced_damage_type = _forced_element_type(runtime_params, seed=f"{skill.active_gem_instance_id}:{timestamp_ms}")
        shotgun_state = shotgun_state_from_runtime_params(runtime_params)
        sustained_ticks = bool(runtime_params.get("sustained_ticks", False))

        spread_angles = _spread_angles(projectile_count, spread_angle_deg, angle_step_deg)
        directions = tuple(
            _rotate_direction(direction, _stable_projectile_angle_jitter(random_angle_jitter_deg, seed=f"{skill.active_gem_instance_id}:{timestamp_ms}:{index + 1}")) if tracks_direct_target else (
                _rotate_direction(direction, spread_angle) if spread_angle else dict(direction)
            )
            for index, spread_angle in enumerate(spread_angles)
        )
        events = [
            SkillEvent(
                event_id=_event_id(skill, timestamp_ms, 0, "cast_start"),
                type="cast_start",
                timestamp_ms=timestamp_ms,
                source_entity=source_entity,
                target_entity=target_entity,
                position=source_position,
                direction=direction,
                delay_ms=0,
                duration_ms=0,
                amount=None,
                damage_type=skill.damage_type,
                skill_instance_id=skill.active_gem_instance_id,
                vfx_key=presentation.get("cast_vfx_key", vfx_key),
                sfx_key=sfx_key,
                reason_key="",
                payload={"skill_id": skill.skill_package_id or skill.skill_template_id},
            ),
            *[
            SkillEvent(
                event_id=_event_id(skill, timestamp_ms, index + 1, "projectile_spawn"),
                type="projectile_spawn",
                timestamp_ms=timestamp_ms + index * burst_interval_ms,
                source_entity=source_entity,
                target_entity=target_entity,
                position=spawn_position,
                direction=projectile_direction,
                delay_ms=index * burst_interval_ms,
                duration_ms=duration_ms,
                amount=None,
                damage_type=skill.damage_type,
                skill_instance_id=skill.active_gem_instance_id,
                vfx_key=vfx_key,
                sfx_key=sfx_key,
                reason_key="",
                payload={
                    "end_position": dict(target_position) if tracks_direct_target else _projectile_end_position(spawn_position, projectile_direction, visual_distance),
                    "spawn_world_position": dict(spawn_position),
                    "target_world_position": dict(target_position),
                    "direction_world": dict(projectile_direction),
                    "velocity_world": {
                        "x": projectile_direction["x"] * projectile_speed,
                        "y": projectile_direction["y"] * projectile_speed,
                    },
                    "projectile_id": _projectile_id(skill, timestamp_ms, index + 1),
                    "skill_id": skill.skill_package_id or skill.skill_template_id,
                    "vfx_spawn_world_position": dict(spawn_position),
                    "vfx_direction_world": dict(projectile_direction),
                    "projectile_index": index + 1,
                    "projectile_count": projectile_count,
                    "pierce_remaining": pierce_count,
                    "projectile_speed": projectile_speed,
                    "trajectory": trajectory,
                    "arc_height": arc_height,
                    "projectile_visual_mode": projectile_visual_mode,
                    "lifetime_ms": duration_ms,
                    "expire_time_ms": timestamp_ms + index * burst_interval_ms + duration_ms,
                    "expire_world_position": dict(target_position) if tracks_direct_target else _projectile_end_position(spawn_position, projectile_direction, visual_distance),
                    "local_spread_angle": spread_angles[index],
                    "fan_angle": spread_angle_deg,
                    "burst_interval_ms": burst_interval_ms,
                    "spread_angle_deg": spread_angle_deg,
                    "angle_step": angle_step_deg,
                    "random_angle_jitter_deg": random_angle_jitter_deg,
                    "spawn_policy": "caster_current_position" if _is_player_source(source_entity) else "cast_snapshot",
                    "vfx_spawn_policy": "caster_current_position" if _is_player_source(source_entity) else "cast_snapshot",
                    "projectile_radius": runtime_params.get("projectile_radius", 0),
                    "impact_radius": runtime_params.get("impact_radius", 0),
                    "target_policy": target_policy,
                },
            )
            for index, projectile_direction in enumerate(directions)
            ],
        ]
        for index, projectile_direction in enumerate(directions):
            projectile_delay_ms = index * burst_interval_ms
            impact_delay_ms = projectile_delay_ms + impact_duration_ms
            impact_position = dict(target_position) if tracks_direct_target else _projectile_end_position(spawn_position, projectile_direction, distance)
            hit_sequence, damage_scale = shotgun_state.record_hit(target_entity)
            damage_context = _projectile_damage_context(
                skill,
                runtime_params,
                amount=damage_amount,
                damage_type=forced_damage_type,
                hit_sequence=hit_sequence,
                damage_scale=damage_scale,
            )
            floating_text = _damage_text(damage_context["amount"], damage_context["damage_type"])
            floating_text_position = {"x": target_position["x"], "y": target_position["y"] - 28.0}
            projectile_payload = {
                "projectile_index": index + 1,
                "projectile_count": projectile_count,
                "projectile_id": _projectile_id(skill, timestamp_ms, index + 1),
                "skill_id": skill.skill_package_id or skill.skill_template_id,
                "impact_world_position": dict(impact_position),
                "hit_world_position": dict(impact_position),
                "direction_world": dict(projectile_direction),
                "velocity_world": {
                    "x": projectile_direction["x"] * projectile_speed,
                    "y": projectile_direction["y"] * projectile_speed,
                },
                "pierce_remaining": pierce_count,
                "projectile_speed": projectile_speed,
                "trajectory": trajectory,
                "arc_height": arc_height,
                "projectile_visual_mode": projectile_visual_mode,
                "lifetime_ms": duration_ms,
                "expire_time_ms": timestamp_ms + projectile_delay_ms + duration_ms,
                "expire_world_position": _projectile_end_position(spawn_position, projectile_direction, visual_distance),
                "projectile_continues": pierce_count > 0,
                "impact_kind": "projectile_hit_continue" if pierce_count > 0 else "projectile_final_impact",
                "local_spread_angle": spread_angles[index],
                "fan_angle": spread_angle_deg,
                "hit_policy": hit_policy,
                "marker_id": impact_marker_id,
                "hit_marker_id": impact_marker_id,
                "pierce_count": pierce_count,
                "target_policy": target_policy,
                "random_angle_jitter_deg": random_angle_jitter_deg,
                **damage_context["payload"],
            }
            if not sustained_ticks:
                events.extend(
                    [
                        SkillEvent(
                            event_id=_event_id(skill, timestamp_ms, projectile_count + index * 4 + 1, "projectile_hit"),
                            type="projectile_hit",
                            timestamp_ms=timestamp_ms + impact_delay_ms,
                            source_entity=source_entity,
                            target_entity=target_entity,
                            position=impact_position,
                            direction=projectile_direction,
                            delay_ms=impact_delay_ms,
                            duration_ms=0,
                            amount=None,
                            damage_type=damage_context["damage_type"],
                            skill_instance_id=skill.active_gem_instance_id,
                            vfx_key=hit_vfx_key,
                            sfx_key=sfx_key,
                            reason_key=reason_key,
                            payload=_damage_event_payload(skill, projectile_payload, damage_context=damage_context),
                        ),
                        SkillEvent(
                            event_id=_event_id(skill, timestamp_ms, projectile_count + index * 4 + 2, "damage"),
                            type="damage",
                            timestamp_ms=timestamp_ms + impact_delay_ms,
                            source_entity=source_entity,
                            target_entity=target_entity,
                            position=impact_position,
                            direction=projectile_direction,
                            delay_ms=impact_delay_ms,
                            duration_ms=0,
                            amount=damage_context["amount"],
                            damage_type=damage_context["damage_type"],
                            skill_instance_id=skill.active_gem_instance_id,
                            vfx_key=hit_vfx_key,
                            sfx_key=sfx_key,
                            reason_key=reason_key,
                            payload=_damage_event_payload(skill, projectile_payload, damage_context=damage_context),
                        ),
                        SkillEvent(
                            event_id=_event_id(skill, timestamp_ms, projectile_count + index * 4 + 3, "hit_vfx"),
                            type="hit_vfx",
                            timestamp_ms=timestamp_ms + impact_delay_ms,
                            source_entity=source_entity,
                            target_entity=target_entity,
                            position=impact_position,
                            direction=projectile_direction,
                            delay_ms=impact_delay_ms,
                            duration_ms=420,
                            amount=None,
                            damage_type=damage_context["damage_type"],
                            skill_instance_id=skill.active_gem_instance_id,
                            vfx_key=hit_vfx_key,
                            sfx_key=sfx_key,
                            reason_key=reason_key,
                            payload=projectile_payload,
                        ),
                        SkillEvent(
                            event_id=_event_id(skill, timestamp_ms, projectile_count + index * 4 + 4, "floating_text"),
                            type="floating_text",
                            timestamp_ms=timestamp_ms + impact_delay_ms,
                            source_entity=source_entity,
                            target_entity=target_entity,
                            position=floating_text_position,
                            direction=projectile_direction,
                            delay_ms=impact_delay_ms,
                            duration_ms=800,
                            amount=damage_context["amount"],
                            damage_type=damage_context["damage_type"],
                            skill_instance_id=skill.active_gem_instance_id,
                            vfx_key=hit_vfx_key,
                            sfx_key=sfx_key,
                            reason_key=floating_key,
                            payload={**projectile_payload, "text": floating_text},
                        ),
                    ]
                )
                events.extend(
                    _status_apply_events(
                        skill,
                        timestamp_ms=timestamp_ms,
                        base_index=projectile_count + index * 20 + 5,
                        source_entity=source_entity,
                        target_entity=target_entity,
                        position=impact_position,
                        direction=projectile_direction,
                        delay_ms=impact_delay_ms,
                        payload=_damage_event_payload(skill, projectile_payload, damage_context=damage_context),
                    )
                )
                events.extend(
                    _secondary_hit_events(
                        skill,
                        timestamp_ms=timestamp_ms,
                        base_index=projectile_count + index * 20 + 10,
                        source_entity=source_entity,
                        target_entity=target_entity,
                        impact_position=impact_position,
                        direction=projectile_direction,
                        delay_ms=impact_delay_ms,
                        payload=projectile_payload,
                        targets=(),
                    )
                )
            if int(runtime_params.get("tick_interval_ms", 0)) > 0 and int(runtime_params.get("duration_ms", 0)) > 0:
                tick_interval_ms = int(runtime_params["tick_interval_ms"])
                active_duration_ms = int(runtime_params["duration_ms"])
                tick_events = tick_schedule(active_duration_ms, tick_interval_ms)
                tick_base_index = projectile_count + index * 100 + 40
                for tick_index, tick_time_ms in tick_events:
                    tick_delay_ms = projectile_delay_ms + tick_time_ms
                    progress = min(1.0, tick_time_ms / max(1.0, float(duration_ms)))
                    tick_position = {
                        "x": spawn_position["x"] + (impact_position["x"] - spawn_position["x"]) * progress,
                        "y": spawn_position["y"] + (impact_position["y"] - spawn_position["y"]) * progress,
                    }
                    tick_payload = {
                        **projectile_payload,
                        "tick_index": tick_index + 1,
                        "tick_time_ms": tick_time_ms,
                        "tick_interval_ms": tick_interval_ms,
                        "duration_ms": active_duration_ms,
                        "hit_world_position": dict(tick_position),
                        "impact_world_position": dict(tick_position),
                    }
                    for local_offset, event_type, amount, duration, event_payload, event_reason in (
                        (0, "damage", damage_context["amount"], 0, _damage_event_payload(skill, tick_payload, damage_context=damage_context), reason_key),
                        (1, "hit_vfx", None, 420, tick_payload, reason_key),
                        (2, "floating_text", damage_context["amount"], 800, {**tick_payload, "text": floating_text}, floating_key),
                    ):
                        events.append(
                            SkillEvent(
                                event_id=_event_id(skill, timestamp_ms, tick_base_index + tick_index * 3 + local_offset, event_type),
                                type=event_type,
                                timestamp_ms=timestamp_ms + tick_delay_ms,
                                source_entity=source_entity,
                                target_entity=target_entity,
                                position=dict(tick_position if event_type != "floating_text" else {"x": tick_position["x"], "y": tick_position["y"] - 28.0}),
                                direction=projectile_direction,
                                delay_ms=tick_delay_ms,
                                duration_ms=duration,
                                amount=amount,
                                damage_type=damage_context["damage_type"],
                                skill_instance_id=skill.active_gem_instance_id,
                                vfx_key=hit_vfx_key,
                                sfx_key=sfx_key,
                                reason_key=event_reason,
                                payload=event_payload,
                            )
                        )
            if not sustained_ticks:
                events.extend(
                    _split_projectile_events(
                        skill,
                        runtime_params,
                        timestamp_ms=timestamp_ms,
                        base_index=projectile_count + index * 100 + 30,
                        source_entity=source_entity,
                        parent_target_entity=target_entity,
                        spawn_position=impact_position,
                        parent_direction=projectile_direction,
                        parent_projectile_id=projectile_payload["projectile_id"],
                        trigger_event_id=_event_id(skill, timestamp_ms, projectile_count + index * 4 + 1, "projectile_hit"),
                        delay_ms=impact_delay_ms,
                        targets=(),
                        projectile_speed=projectile_speed,
                        min_duration_ms=min_duration_ms,
                        max_duration_ms=max_duration_ms,
                        vfx_key=vfx_key,
                        hit_vfx_key=hit_vfx_key,
                        sfx_key=sfx_key,
                        reason_key=reason_key,
                        floating_key=floating_key,
                        forced_damage_type=forced_damage_type,
                        shotgun_state=shotgun_state,
                    )
                )
        return _sorted_events(events)

    def _projectile_multi_target_events(
        self,
        skill: FinalSkillInstance,
        *,
        source_entity: str,
        source_position: dict[str, float],
        target_entity: str,
        targets: tuple[_RuntimeTarget, ...],
        timestamp_ms: int,
    ) -> tuple[SkillEvent, ...]:
        runtime_params = skill.runtime_params or {}
        presentation = skill.presentation_keys or {}
        projectile_speed = max(1.0, float(runtime_params.get("projectile_speed", 720.0)))
        min_duration_ms = int(runtime_params.get("min_duration_ms", 0))
        max_duration_ms = _optional_int(runtime_params.get("max_duration_ms"))
        projectile_count = max(1, int(runtime_params.get("projectile_count", skill.projectile_count)))
        burst_interval_ms = max(0, int(runtime_params.get("burst_interval_ms", 0)))
        spread_angle_deg = _spread_angle_deg(runtime_params, skill.behavior_template)
        angle_step_deg = _angle_step_deg(runtime_params, skill.behavior_template)
        random_angle_jitter_deg = _random_angle_jitter_deg(runtime_params)
        damage_amount = skill.final_damage
        max_distance = max(1.0, float(runtime_params.get("max_distance", 520.0)))
        collision_radius = max(
            1.0,
            float(runtime_params.get("collision_radius", 0.0)),
            float(runtime_params.get("projectile_radius", 0.0)),
            float(runtime_params.get("projectile_width", 0.0)) / 2.0,
            float(runtime_params.get("projectile_height", 0.0)) / 2.0,
        )
        pierce_count = max(0, int(runtime_params.get("pierce_count", 0)))
        hit_policy = str(runtime_params.get("hit_policy", "first_hit"))
        impact_marker_id = str(runtime_params.get("impact_marker_id", "projectile_hit"))
        target_policy = str(runtime_params.get("target_policy", "nearest_enemy"))
        trajectory = str(runtime_params.get("trajectory", "linear"))
        arc_height = max(0.0, float(runtime_params.get("arc_height", 0.0)))
        projectile_visual_mode = str(runtime_params.get("projectile_visual_mode", "standard"))
        tracks_direct_targets = target_policy in {"random_enemy", "nearest_unique_enemy"}
        max_hits_per_projectile = pierce_count + 1 if pierce_count > 0 else 1
        visual_distance = max_distance if pierce_count > 0 else 0.0
        spawn_position = _spawn_position(source_position, runtime_params)
        primary_target = min(
            targets,
            key=lambda target: hypot(target.position["x"] - spawn_position["x"], target.position["y"] - spawn_position["y"]),
        )
        target_candidates = tuple(
            target for target, _ in sorted(
                (
                    (target, hypot(target.position["x"] - spawn_position["x"], target.position["y"] - spawn_position["y"]))
                    for target in targets
                    if hypot(target.position["x"] - spawn_position["x"], target.position["y"] - spawn_position["y"]) <= max_distance
                ),
                key=lambda item: (item[1], item[0].entity_id),
            )
        ) or targets
        projectile_targets = tuple(
            _projectile_target_by_policy(
                target_candidates,
                policy=target_policy,
                projectile_index=projectile_index,
                seed=f"{skill.active_gem_instance_id}:{timestamp_ms}:{projectile_index}",
            )
            if tracks_direct_targets else primary_target
            for projectile_index in range(1, projectile_count + 1)
        )
        primary_distance = min(
            max_distance,
            hypot(primary_target.position["x"] - spawn_position["x"], primary_target.position["y"] - spawn_position["y"]),
        )
        visual_distance = visual_distance or primary_distance
        duration_ms = _projectile_travel_duration_ms(
            visual_distance,
            projectile_speed,
            min_duration_ms,
            max_duration_ms,
            runtime_params,
            projectile_visual_mode,
        )
        direction = _direction(spawn_position, primary_target.position)
        spread_angles = _spread_angles(projectile_count, spread_angle_deg, angle_step_deg)
        directions = tuple(
            _rotate_direction(
                _direction(spawn_position, projectile_targets[index].position),
                _stable_projectile_angle_jitter(random_angle_jitter_deg, seed=f"{skill.active_gem_instance_id}:{timestamp_ms}:{index + 1}"),
            ) if tracks_direct_targets else (
                _rotate_direction(direction, spread_angle) if spread_angle else dict(direction)
            )
            for index, spread_angle in enumerate(spread_angles)
        )
        vfx_key = presentation.get("projectile_vfx_key", presentation.get("vfx", skill.visual_effect))
        hit_vfx_key = presentation.get("hit_vfx_key", presentation.get("vfx", vfx_key))
        sfx_key = presentation.get("sfx", "")
        floating_key = presentation.get("floating_text", "skill_event.fire_bolt.floating_text")
        reason_key = _damage_reason_key(skill)
        forced_damage_type = _forced_element_type(runtime_params, seed=f"{skill.active_gem_instance_id}:{timestamp_ms}")
        sustained_ticks = bool(runtime_params.get("sustained_ticks", False))
        events: list[SkillEvent] = []
        next_index = 1
        events.append(
            SkillEvent(
                event_id=_event_id(skill, timestamp_ms, 0, "cast_start"),
                type="cast_start",
                timestamp_ms=timestamp_ms,
                source_entity=source_entity,
                target_entity=primary_target.entity_id,
                position=source_position,
                direction=direction,
                delay_ms=0,
                duration_ms=0,
                amount=None,
                damage_type=skill.damage_type,
                skill_instance_id=skill.active_gem_instance_id,
                vfx_key=presentation.get("cast_vfx_key", vfx_key),
                sfx_key=sfx_key,
                reason_key="",
                payload={"skill_id": skill.skill_package_id or skill.skill_template_id},
            )
        )

        for projectile_index, projectile_direction in enumerate(directions, start=1):
            projectile_target = projectile_targets[projectile_index - 1]
            projectile_target_distance = min(
                max_distance,
                hypot(projectile_target.position["x"] - spawn_position["x"], projectile_target.position["y"] - spawn_position["y"]),
            )
            projectile_delay_ms = (projectile_index - 1) * burst_interval_ms
            events.append(
                SkillEvent(
                    event_id=_event_id(skill, timestamp_ms, next_index, "projectile_spawn"),
                    type="projectile_spawn",
                    timestamp_ms=timestamp_ms + projectile_delay_ms,
                    source_entity=source_entity,
                    target_entity=projectile_target.entity_id,
                    position=spawn_position,
                    direction=projectile_direction,
                    delay_ms=projectile_delay_ms,
                    duration_ms=duration_ms,
                    amount=None,
                    damage_type=skill.damage_type,
                    skill_instance_id=skill.active_gem_instance_id,
                    vfx_key=vfx_key,
                    sfx_key=sfx_key,
                    reason_key="",
                    payload={
                        "end_position": dict(projectile_target.position) if tracks_direct_targets else {
                            "x": spawn_position["x"] + projectile_direction["x"] * visual_distance,
                            "y": spawn_position["y"] + projectile_direction["y"] * visual_distance,
                        },
                        "spawn_world_position": dict(spawn_position),
                        "target_world_position": dict(projectile_target.position),
                        "direction_world": dict(projectile_direction),
                        "velocity_world": {
                            "x": projectile_direction["x"] * projectile_speed,
                            "y": projectile_direction["y"] * projectile_speed,
                        },
                        "projectile_id": _projectile_id(skill, timestamp_ms, projectile_index),
                        "skill_id": skill.skill_package_id or skill.skill_template_id,
                        "vfx_spawn_world_position": dict(spawn_position),
                        "vfx_direction_world": dict(projectile_direction),
                        "projectile_index": projectile_index,
                        "projectile_count": projectile_count,
                        "pierce_remaining": pierce_count,
                        "projectile_speed": projectile_speed,
                        "trajectory": trajectory,
                        "arc_height": arc_height,
                        "projectile_visual_mode": projectile_visual_mode,
                        "lifetime_ms": duration_ms,
                        "expire_time_ms": timestamp_ms + projectile_delay_ms + duration_ms,
                        "expire_world_position": dict(projectile_target.position) if tracks_direct_targets else {
                            "x": spawn_position["x"] + projectile_direction["x"] * visual_distance,
                            "y": spawn_position["y"] + projectile_direction["y"] * visual_distance,
                        },
                        "local_spread_angle": spread_angles[projectile_index - 1],
                        "fan_angle": spread_angle_deg,
                        "burst_interval_ms": burst_interval_ms,
                        "spread_angle_deg": spread_angle_deg,
                        "angle_step": angle_step_deg,
                        "random_angle_jitter_deg": random_angle_jitter_deg,
                        "spawn_policy": "caster_current_position" if _is_player_source(source_entity) else "cast_snapshot",
                        "vfx_spawn_policy": "caster_current_position" if _is_player_source(source_entity) else "cast_snapshot",
                        "projectile_radius": runtime_params.get("projectile_radius", 0),
                        "projectile_width": runtime_params.get("projectile_width", 0),
                        "projectile_height": runtime_params.get("projectile_height", 0),
                        "collision_radius": collision_radius,
                        "impact_radius": runtime_params.get("impact_radius", 0),
                        "target_policy": target_policy,
                    },
                )
            )
            next_index += 1

        shotgun_state = shotgun_state_from_runtime_params(runtime_params)
        for projectile_index, projectile_direction in enumerate(directions, start=1):
            projectile_delay_ms = (projectile_index - 1) * burst_interval_ms
            if tracks_direct_targets:
                projectile_target = projectile_targets[projectile_index - 1]
                projectile_target_distance = min(
                    max_distance,
                    hypot(projectile_target.position["x"] - spawn_position["x"], projectile_target.position["y"] - spawn_position["y"]),
                )
                projectile_hits = ((projectile_target, projectile_target_distance),)
            else:
                projectile_hits = _projectile_hit_targets(
                    spawn_position,
                    projectile_direction,
                    targets,
                    max_distance=max_distance,
                    collision_radius=collision_radius,
                    max_hits=max_hits_per_projectile,
                )
            for hit_order, (target, forward) in enumerate(projectile_hits):
                impact_duration_ms = _projectile_travel_duration_ms(
                    forward,
                    projectile_speed,
                    min_duration_ms,
                    max_duration_ms,
                    runtime_params,
                    projectile_visual_mode,
                )
                impact_delay_ms = projectile_delay_ms + impact_duration_ms
                impact_position = dict(target.position) if tracks_direct_targets else _projectile_end_position(spawn_position, projectile_direction, forward)
                pierce_remaining = max(0, max_hits_per_projectile - hit_order - 1)
                projectile_continues = pierce_remaining > 0
                hit_sequence, damage_scale = shotgun_state.record_hit(target.entity_id)
                damage_context = _projectile_damage_context(
                    skill,
                    runtime_params,
                    amount=damage_amount,
                    damage_type=forced_damage_type,
                    hit_sequence=hit_sequence,
                    damage_scale=damage_scale,
                )
                floating_text = _damage_text(damage_context["amount"], damage_context["damage_type"])
                floating_text_position = {"x": target.position["x"], "y": target.position["y"] - 28.0}
                projectile_payload = {
                    "projectile_index": projectile_index,
                    "projectile_count": projectile_count,
                    "projectile_id": _projectile_id(skill, timestamp_ms, projectile_index),
                    "skill_id": skill.skill_package_id or skill.skill_template_id,
                    "impact_world_position": dict(impact_position),
                    "hit_world_position": dict(impact_position),
                    "target_world_position": dict(target.position),
                    "direction_world": dict(projectile_direction),
                    "velocity_world": {
                        "x": projectile_direction["x"] * projectile_speed,
                        "y": projectile_direction["y"] * projectile_speed,
                    },
                    "pierce_remaining": pierce_remaining,
                    "projectile_speed": projectile_speed,
                    "trajectory": trajectory,
                    "arc_height": arc_height,
                    "projectile_visual_mode": projectile_visual_mode,
                    "lifetime_ms": duration_ms,
                    "expire_time_ms": timestamp_ms + projectile_delay_ms + duration_ms,
                    "expire_world_position": dict(target.position) if tracks_direct_targets else {
                        "x": spawn_position["x"] + projectile_direction["x"] * visual_distance,
                        "y": spawn_position["y"] + projectile_direction["y"] * visual_distance,
                    },
                    "projectile_continues": projectile_continues,
                    "impact_kind": "projectile_hit_continue" if projectile_continues else "projectile_final_impact",
                    "local_spread_angle": spread_angles[projectile_index - 1],
                    "fan_angle": spread_angle_deg,
                    "hit_policy": hit_policy,
                    "marker_id": impact_marker_id,
                    "hit_marker_id": impact_marker_id,
                    "pierce_count": pierce_count,
                    "target_policy": target_policy,
                    "random_angle_jitter_deg": random_angle_jitter_deg,
                    **damage_context["payload"],
                }
                if not sustained_ticks:
                    events.extend(
                        [
                            SkillEvent(
                                event_id=_event_id(skill, timestamp_ms, next_index, "projectile_hit"),
                                type="projectile_hit",
                                timestamp_ms=timestamp_ms + impact_delay_ms,
                                source_entity=source_entity,
                                target_entity=target.entity_id,
                                position=impact_position,
                                direction=projectile_direction,
                                delay_ms=impact_delay_ms,
                                duration_ms=0,
                                amount=None,
                                damage_type=damage_context["damage_type"],
                                skill_instance_id=skill.active_gem_instance_id,
                                vfx_key=hit_vfx_key,
                                sfx_key=sfx_key,
                                reason_key=reason_key,
                                payload=projectile_payload,
                            ),
                            SkillEvent(
                                event_id=_event_id(skill, timestamp_ms, next_index + 1, "damage"),
                                type="damage",
                                timestamp_ms=timestamp_ms + impact_delay_ms,
                                source_entity=source_entity,
                                target_entity=target.entity_id,
                                position=impact_position,
                                direction=projectile_direction,
                                delay_ms=impact_delay_ms,
                                duration_ms=0,
                                amount=damage_context["amount"],
                                damage_type=damage_context["damage_type"],
                                skill_instance_id=skill.active_gem_instance_id,
                                vfx_key=hit_vfx_key,
                                sfx_key=sfx_key,
                                reason_key=reason_key,
                                payload=_damage_event_payload(skill, projectile_payload, damage_context=damage_context),
                            ),
                            SkillEvent(
                                event_id=_event_id(skill, timestamp_ms, next_index + 2, "hit_vfx"),
                                type="hit_vfx",
                                timestamp_ms=timestamp_ms + impact_delay_ms,
                                source_entity=source_entity,
                                target_entity=target.entity_id,
                                position=impact_position,
                                direction=projectile_direction,
                                delay_ms=impact_delay_ms,
                                duration_ms=420,
                                amount=None,
                                damage_type=damage_context["damage_type"],
                                skill_instance_id=skill.active_gem_instance_id,
                                vfx_key=hit_vfx_key,
                                sfx_key=sfx_key,
                                reason_key=reason_key,
                                payload=projectile_payload,
                            ),
                            SkillEvent(
                                event_id=_event_id(skill, timestamp_ms, next_index + 3, "floating_text"),
                                type="floating_text",
                                timestamp_ms=timestamp_ms + impact_delay_ms,
                                source_entity=source_entity,
                                target_entity=target.entity_id,
                                position=floating_text_position,
                                direction=projectile_direction,
                                delay_ms=impact_delay_ms,
                                duration_ms=800,
                                amount=damage_context["amount"],
                                damage_type=damage_context["damage_type"],
                                skill_instance_id=skill.active_gem_instance_id,
                                vfx_key=hit_vfx_key,
                                sfx_key=sfx_key,
                                reason_key=floating_key,
                                payload={**projectile_payload, "text": floating_text},
                            ),
                        ]
                    )
                    next_index += 4
                    events.extend(
                        _status_apply_events(
                            skill,
                            timestamp_ms=timestamp_ms,
                            base_index=next_index,
                            source_entity=source_entity,
                            target_entity=target.entity_id,
                            position=impact_position,
                            direction=projectile_direction,
                            delay_ms=impact_delay_ms,
                            payload=_damage_event_payload(skill, projectile_payload, damage_context=damage_context),
                        )
                    )
                    next_index += len(skill.ailments)
                    events.extend(
                        _secondary_hit_events(
                            skill,
                            timestamp_ms=timestamp_ms,
                            base_index=next_index + projectile_index * 100 + hit_order * 40,
                            source_entity=source_entity,
                            target_entity=target.entity_id,
                            impact_position=impact_position,
                            direction=projectile_direction,
                            delay_ms=impact_delay_ms,
                            payload=projectile_payload,
                            targets=targets,
                        )
                    )
                if int(runtime_params.get("tick_interval_ms", 0)) > 0 and int(runtime_params.get("duration_ms", 0)) > 0:
                    tick_interval_ms = int(runtime_params["tick_interval_ms"])
                    active_duration_ms = int(runtime_params["duration_ms"])
                    for tick_index, tick_time_ms in tick_schedule(active_duration_ms, tick_interval_ms):
                        tick_delay_ms = projectile_delay_ms + tick_time_ms
                        progress = min(1.0, tick_time_ms / max(1.0, float(duration_ms)))
                        tick_position = {
                            "x": spawn_position["x"] + (impact_position["x"] - spawn_position["x"]) * progress,
                            "y": spawn_position["y"] + (impact_position["y"] - spawn_position["y"]) * progress,
                        }
                        tick_payload = {
                            **projectile_payload,
                            "tick_index": tick_index + 1,
                            "tick_time_ms": tick_time_ms,
                            "tick_interval_ms": tick_interval_ms,
                            "duration_ms": active_duration_ms,
                            "hit_world_position": dict(tick_position),
                            "impact_world_position": dict(tick_position),
                        }
                        for local_offset, event_type, amount, duration, event_payload, event_reason in (
                            (0, "damage", damage_context["amount"], 0, _damage_event_payload(skill, tick_payload, damage_context=damage_context), reason_key),
                            (1, "hit_vfx", None, 420, tick_payload, reason_key),
                            (2, "floating_text", damage_context["amount"], 800, {**tick_payload, "text": floating_text}, floating_key),
                        ):
                            events.append(
                                SkillEvent(
                                    event_id=_event_id(skill, timestamp_ms, next_index + tick_index * 3 + local_offset, event_type),
                                    type=event_type,
                                    timestamp_ms=timestamp_ms + tick_delay_ms,
                                    source_entity=source_entity,
                                    target_entity=target.entity_id,
                                    position=dict(tick_position if event_type != "floating_text" else {"x": tick_position["x"], "y": tick_position["y"] - 28.0}),
                                    direction=projectile_direction,
                                    delay_ms=tick_delay_ms,
                                    duration_ms=duration,
                                    amount=amount,
                                    damage_type=damage_context["damage_type"],
                                    skill_instance_id=skill.active_gem_instance_id,
                                    vfx_key=hit_vfx_key,
                                    sfx_key=sfx_key,
                                    reason_key=event_reason,
                                    payload=event_payload,
                                )
                            )
                    next_index += len(tick_schedule(active_duration_ms, tick_interval_ms)) * 3
                if not sustained_ticks:
                    events.extend(
                        _split_projectile_events(
                            skill,
                            runtime_params,
                            timestamp_ms=timestamp_ms,
                            base_index=next_index + projectile_index * 100 + hit_order * 40 + 500,
                            source_entity=source_entity,
                            parent_target_entity=target.entity_id,
                            spawn_position=impact_position,
                            parent_direction=projectile_direction,
                            parent_projectile_id=projectile_payload["projectile_id"],
                            trigger_event_id=_event_id(skill, timestamp_ms, next_index - 4, "projectile_hit"),
                            delay_ms=impact_delay_ms,
                            targets=targets,
                            projectile_speed=projectile_speed,
                            min_duration_ms=min_duration_ms,
                            max_duration_ms=max_duration_ms,
                            vfx_key=vfx_key,
                            hit_vfx_key=hit_vfx_key,
                            sfx_key=sfx_key,
                            reason_key=reason_key,
                            floating_key=floating_key,
                            forced_damage_type=forced_damage_type,
                            shotgun_state=shotgun_state,
                        )
                    )
                    events.extend(
                        _bounce_projectile_events(
                            skill,
                            runtime_params,
                            timestamp_ms=timestamp_ms,
                            base_index=next_index + projectile_index * 100 + hit_order * 40 + 900,
                            source_entity=source_entity,
                            parent_target_entity=target.entity_id,
                            spawn_position=impact_position,
                            parent_projectile_id=projectile_payload["projectile_id"],
                            trigger_event_id=_event_id(skill, timestamp_ms, next_index - 4, "projectile_hit"),
                            delay_ms=impact_delay_ms,
                            targets=targets,
                            projectile_speed=projectile_speed,
                            min_duration_ms=min_duration_ms,
                            max_duration_ms=max_duration_ms,
                            vfx_key=vfx_key,
                            hit_vfx_key=hit_vfx_key,
                            sfx_key=sfx_key,
                            reason_key=reason_key,
                            floating_key=floating_key,
                            forced_damage_type=forced_damage_type,
                            shotgun_state=shotgun_state,
                        )
                    )
        return _sorted_events(events)


def _bounce_projectile_events(
    skill: FinalSkillInstance,
    runtime_params: dict[str, Any],
    *,
    timestamp_ms: int,
    base_index: int,
    source_entity: str,
    parent_target_entity: str,
    spawn_position: dict[str, float],
    parent_projectile_id: str,
    trigger_event_id: str,
    delay_ms: int,
    targets: tuple[_RuntimeTarget, ...],
    projectile_speed: float,
    min_duration_ms: int,
    max_duration_ms: int | None,
    vfx_key: str,
    hit_vfx_key: str,
    sfx_key: str,
    reason_key: str,
    floating_key: str,
    forced_damage_type: str,
    shotgun_state: Any,
) -> list[SkillEvent]:
    bounce_count = max(0, int(runtime_params.get("bounce_count", 0)))
    if bounce_count <= 0 or not targets:
        return []

    bounce_radius = max(1.0, float(runtime_params.get("bounce_radius", runtime_params.get("chain_radius", 180.0))))
    allow_repeat_target = bool(runtime_params.get("bounce_allow_repeat_target", False))
    hit_ids = {parent_target_entity}
    current_entity = parent_target_entity
    current_position = dict(spawn_position)
    current_delay_ms = delay_ms
    result: list[SkillEvent] = []

    for bounce_index in range(1, bounce_count + 1):
        candidates: list[tuple[_RuntimeTarget, float]] = []
        for target in targets:
            if target.entity_id == current_entity:
                continue
            if not allow_repeat_target and target.entity_id in hit_ids:
                continue
            distance = hypot(target.position["x"] - current_position["x"], target.position["y"] - current_position["y"])
            if distance <= bounce_radius:
                candidates.append((target, distance))
        if not candidates:
            break

        target, distance = sorted(candidates, key=lambda item: (item[1], item[0].entity_id))[0]
        if distance <= 0:
            break
        direction = {
            "x": (target.position["x"] - current_position["x"]) / distance,
            "y": (target.position["y"] - current_position["y"]) / distance,
        }
        travel_ms = _duration_ms(distance, projectile_speed, min_duration_ms, max_duration_ms)
        hit_delay_ms = current_delay_ms + travel_ms
        bounce_projectile_id = f"{parent_projectile_id}.bounce.{bounce_index}"
        hit_sequence, damage_scale = shotgun_state.record_hit(target.entity_id)
        damage_context = _projectile_damage_context(
            skill,
            runtime_params,
            amount=skill.final_damage,
            damage_type=forced_damage_type,
            hit_sequence=hit_sequence,
            damage_scale=damage_scale,
        )
        hit_position = dict(target.position)
        payload = {
            "projectile_id": bounce_projectile_id,
            "skill_id": skill.skill_package_id or skill.skill_template_id,
            "parent_projectile_id": parent_projectile_id,
            "trigger_event_id": trigger_event_id,
            "bounce_projectile": True,
            "bounce_index": bounce_index,
            "bounce_count": bounce_count,
            "bounce_radius": bounce_radius,
            "projectile_index": bounce_index,
            "projectile_count": bounce_count,
            "spawn_world_position": dict(current_position),
            "vfx_spawn_world_position": dict(current_position),
            "target_world_position": dict(target.position),
            "impact_world_position": dict(hit_position),
            "hit_world_position": dict(hit_position),
            "direction_world": dict(direction),
            "vfx_direction_world": dict(direction),
            "velocity_world": {"x": direction["x"] * projectile_speed, "y": direction["y"] * projectile_speed},
            "end_position": dict(target.position),
            "expire_world_position": dict(target.position),
            "expire_time_ms": timestamp_ms + hit_delay_ms,
            "lifetime_ms": travel_ms,
            "projectile_speed": projectile_speed,
            "projectile_continues": bounce_index < bounce_count,
            "impact_kind": "projectile_bounce_continue" if bounce_index < bounce_count else "projectile_bounce_final",
            "target_policy": "nearest_not_hit_bounce",
            **damage_context["payload"],
        }
        floating_text = _damage_text(damage_context["amount"], damage_context["damage_type"])
        floating_text_position = {"x": target.position["x"], "y": target.position["y"] - 28.0}
        event_base = base_index + (bounce_index - 1) * 10
        for local_offset, event_type, event_delay, amount, duration, position, event_payload, event_reason in (
            (0, "projectile_spawn", current_delay_ms, None, travel_ms, current_position, payload, ""),
            (1, "projectile_hit", hit_delay_ms, None, 0, hit_position, payload, reason_key),
            (2, "damage", hit_delay_ms, damage_context["amount"], 0, hit_position, _damage_event_payload(skill, payload, damage_context=damage_context), reason_key),
            (3, "hit_vfx", hit_delay_ms, None, 420, hit_position, payload, reason_key),
            (4, "floating_text", hit_delay_ms, damage_context["amount"], 800, floating_text_position, {**payload, "text": floating_text}, floating_key),
        ):
            result.append(
                SkillEvent(
                    event_id=_event_id(skill, timestamp_ms, event_base + local_offset, event_type),
                    type=event_type,
                    timestamp_ms=timestamp_ms + event_delay,
                    source_entity=source_entity,
                    target_entity=target.entity_id,
                    position=dict(position),
                    direction=direction,
                    delay_ms=event_delay,
                    duration_ms=duration,
                    amount=amount,
                    damage_type=damage_context["damage_type"],
                    skill_instance_id=skill.active_gem_instance_id,
                    vfx_key=vfx_key if event_type == "projectile_spawn" else hit_vfx_key,
                    sfx_key=sfx_key,
                    reason_key=event_reason,
                    payload=event_payload,
                )
            )
        result.extend(
            _status_apply_events(
                skill,
                timestamp_ms=timestamp_ms,
                base_index=event_base + 5,
                source_entity=source_entity,
                target_entity=target.entity_id,
                position=hit_position,
                direction=direction,
                delay_ms=hit_delay_ms,
                payload=_damage_event_payload(skill, payload, damage_context=damage_context),
            )
        )
        hit_ids.add(target.entity_id)
        current_entity = target.entity_id
        current_position = hit_position
        current_delay_ms = hit_delay_ms

    return result


def _split_projectile_events(
    skill: FinalSkillInstance,
    runtime_params: dict[str, Any],
    *,
    timestamp_ms: int,
    base_index: int,
    source_entity: str,
    parent_target_entity: str,
    spawn_position: dict[str, float],
    parent_direction: dict[str, float],
    parent_projectile_id: str,
    trigger_event_id: str,
    delay_ms: int,
    targets: tuple[_RuntimeTarget, ...],
    projectile_speed: float,
    min_duration_ms: int,
    max_duration_ms: int | None,
    vfx_key: str,
    hit_vfx_key: str,
    sfx_key: str,
    reason_key: str,
    floating_key: str,
    forced_damage_type: str,
    shotgun_state: Any,
) -> list[SkillEvent]:
    base_split_count = max(0, int(runtime_params.get("split_projectile_count", 0)))
    split_count_add = max(0, int(runtime_params.get("split_projectile_count_add", 0)))
    split_chance_percent = max(0.0, float(runtime_params.get("split_projectile_chance_percent", 0.0)))
    split_roll = (_stable_hash(f"{skill.active_gem_instance_id}:{timestamp_ms}:split_projectile") % 10000) / 100.0
    split_chance_triggered = split_chance_percent >= 100.0 or (
        split_chance_percent > 0.0 and split_roll < split_chance_percent
    )
    split_count = base_split_count + (split_count_add if split_chance_triggered else 0)
    damage_multiplier = max(0.0, float(runtime_params.get("split_projectile_damage_multiplier", 0.0)))
    if split_count <= 0 or damage_multiplier <= 0:
        return []

    split_speed = max(1.0, float(runtime_params.get("split_projectile_speed", projectile_speed)))
    split_max_distance = max(1.0, float(runtime_params.get("split_projectile_max_distance", runtime_params.get("max_distance", 520.0))))
    split_collision_radius = max(0.0, float(runtime_params.get("split_projectile_collision_radius", runtime_params.get("collision_radius", 0.0))))
    split_projectile_width = float(runtime_params.get("split_projectile_width", float(runtime_params.get("projectile_width", 38.0)) * 0.72))
    split_projectile_height = float(runtime_params.get("split_projectile_height", float(runtime_params.get("projectile_height", 24.0)) * 0.72))
    split_pierce_count = max(0, int(runtime_params.get("split_projectile_pierce_count", 0)))
    split_angle_step = max(0.0, float(runtime_params.get("split_projectile_angle_step_deg", 25.0)))
    split_angles = _spread_angles(split_count, split_angle_step * max(0, split_count - 1), split_angle_step)
    split_duration_ms = _duration_ms(split_max_distance, split_speed, min_duration_ms, max_duration_ms)
    split_targets = tuple(target for target in targets if target.entity_id != parent_target_entity)
    max_hits = split_pierce_count + 1 if split_pierce_count > 0 else 1
    damage_amount = skill.final_damage * damage_multiplier
    split_damage_type = forced_damage_type or skill.damage_type
    result: list[SkillEvent] = []

    for split_index, split_angle in enumerate(split_angles, start=1):
        split_direction = _rotate_direction(parent_direction, split_angle) if split_angle else dict(parent_direction)
        split_projectile_id = f"{parent_projectile_id}.split.{split_index}"
        end_position = _projectile_end_position(spawn_position, split_direction, split_max_distance)
        common_payload = {
            "projectile_id": split_projectile_id,
            "skill_id": skill.skill_package_id or skill.skill_template_id,
            "parent_projectile_id": parent_projectile_id,
            "trigger_event_id": trigger_event_id,
            "split_projectile": True,
            "split_projectile_index": split_index,
            "split_projectile_count": split_count,
            "split_projectile_base_count": base_split_count,
            "split_projectile_count_add": split_count_add,
            "split_projectile_chance_percent": split_chance_percent,
            "split_projectile_roll": split_roll,
            "split_projectile_chance_triggered": split_chance_triggered,
            "projectile_index": split_index,
            "projectile_count": split_count,
            "spawn_world_position": dict(spawn_position),
            "vfx_spawn_world_position": dict(spawn_position),
            "direction_world": dict(split_direction),
            "vfx_direction_world": dict(split_direction),
            "velocity_world": {"x": split_direction["x"] * split_speed, "y": split_direction["y"] * split_speed},
            "end_position": dict(end_position),
            "expire_world_position": dict(end_position),
            "expire_time_ms": timestamp_ms + delay_ms + split_duration_ms,
            "lifetime_ms": split_duration_ms,
            "projectile_speed": split_speed,
            "projectile_width": split_projectile_width,
            "projectile_height": split_projectile_height,
            "collision_radius": split_collision_radius,
            "pierce_count": split_pierce_count,
            "pierce_remaining": split_pierce_count,
            "local_spread_angle": split_angle,
            "fan_angle": split_angle_step * max(0, split_count - 1),
            "angle_step": split_angle_step,
            "damage_multiplier": damage_multiplier,
            "impact_kind": "split_projectile_expire",
            "projectile_continues": split_pierce_count > 0,
            "target_policy": "projectile_hit_fission",
        }
        result.append(
            SkillEvent(
                event_id=_event_id(skill, timestamp_ms, base_index + (split_index - 1) * 20, "projectile_spawn"),
                type="projectile_spawn",
                timestamp_ms=timestamp_ms + delay_ms,
                source_entity=source_entity,
                target_entity=parent_target_entity,
                position=dict(spawn_position),
                direction=split_direction,
                delay_ms=delay_ms,
                duration_ms=split_duration_ms,
                amount=None,
                damage_type=split_damage_type,
                skill_instance_id=skill.active_gem_instance_id,
                vfx_key=vfx_key,
                sfx_key=sfx_key,
                reason_key="",
                payload=common_payload,
            )
        )

        for hit_order, (target, forward) in enumerate(
            _projectile_hit_targets(
                spawn_position,
                split_direction,
                split_targets,
                max_distance=split_max_distance,
                collision_radius=split_collision_radius,
                max_hits=max_hits,
            )
        ):
            hit_delay_ms = delay_ms + _duration_ms(forward, split_speed, min_duration_ms, max_duration_ms)
            hit_position = _projectile_end_position(spawn_position, split_direction, forward)
            pierce_remaining = max(0, max_hits - hit_order - 1)
            hit_sequence, damage_scale = shotgun_state.record_hit(target.entity_id)
            damage_context = _projectile_damage_context(
                skill,
                runtime_params,
                amount=damage_amount,
                damage_type=forced_damage_type,
                hit_sequence=hit_sequence,
                damage_scale=damage_scale,
            )
            hit_payload = {
                **common_payload,
                "target_world_position": dict(target.position),
                "impact_world_position": dict(hit_position),
                "hit_world_position": dict(hit_position),
                "pierce_remaining": pierce_remaining,
                "projectile_continues": pierce_remaining > 0,
                "impact_kind": "projectile_hit_continue" if pierce_remaining > 0 else "projectile_final_impact",
            }
            damage_payload = _damage_event_payload(skill, hit_payload, damage_context=damage_context)
            floating_text = _damage_text(damage_context["amount"], damage_context["damage_type"])
            event_base = base_index + (split_index - 1) * 20 + hit_order * 4 + 1
            for local_offset, event_type, amount, duration, event_payload, event_reason in (
                (0, "projectile_hit", None, 0, hit_payload, reason_key),
                (1, "damage", damage_context["amount"], 0, damage_payload, reason_key),
                (2, "hit_vfx", None, 420, hit_payload, reason_key),
                (3, "floating_text", damage_context["amount"], 800, {**hit_payload, "text": floating_text}, floating_key),
            ):
                result.append(
                    SkillEvent(
                        event_id=_event_id(skill, timestamp_ms, event_base + local_offset, event_type),
                        type=event_type,
                        timestamp_ms=timestamp_ms + hit_delay_ms,
                        source_entity=source_entity,
                        target_entity=target.entity_id,
                        position=dict(hit_position),
                        direction=split_direction,
                        delay_ms=hit_delay_ms,
                        duration_ms=duration,
                        amount=amount,
                        damage_type=damage_context["damage_type"],
                        skill_instance_id=skill.active_gem_instance_id,
                        vfx_key=hit_vfx_key,
                        sfx_key=sfx_key,
                        reason_key=event_reason,
                        payload=event_payload,
                    )
                )
    return result


def _event_id(skill: FinalSkillInstance, timestamp_ms: int, index: int, event_type: str) -> str:
    return f"{skill.active_gem_instance_id}.{timestamp_ms}.{index}.{event_type}"


def _sorted_events(events: list[SkillEvent]) -> tuple[SkillEvent, ...]:
    return tuple(sorted(events, key=lambda event: (event.timestamp_ms, _runtime_event_sort_order(event.type), event.event_id)))


def _with_continuous_attack_events(
    skill: FinalSkillInstance,
    events: tuple[SkillEvent, ...],
    *,
    timestamp_ms: int,
    runtime_context: object | None = None,
) -> tuple[SkillEvent, ...]:
    events = _with_overload_buff_damage_events(skill, events, runtime_context=runtime_context)
    events = _with_knockback_events(skill, events, timestamp_ms=timestamp_ms)
    runtime_params = skill.runtime_params or {}
    if "attack" not in skill.tags:
        return events
    chance_percent = max(0.0, float(runtime_params.get("continuous_attack_chance_percent", 0.0)))
    if chance_percent <= 0.0:
        return events
    guaranteed = int(chance_percent // 100.0)
    remainder = chance_percent - guaranteed * 100.0
    roll = (_stable_hash(f"{skill.active_gem_instance_id}:{timestamp_ms}:continuous_attack") % 10000) / 100.0
    repeat_count = guaranteed + (1 if remainder > 0.0 and roll < remainder else 0)
    if repeat_count <= 0:
        return events

    step_percent = max(0.0, float(runtime_params.get("continuous_attack_damage_step_percent", 0.0)))
    extra_events: list[SkillEvent] = []
    damage_events = [
        event
        for event in events
        if event.type == "damage"
        and event.amount is not None
        and event.amount > 0
        and not event.payload.get("continuous_attack_index")
    ]
    for source_index, event in enumerate(damage_events):
        for repeat_index in range(1, repeat_count + 1):
            scale = 1.0 + step_percent * repeat_index / 100.0
            delay_step_ms = max(1, int(runtime_params.get("continuous_attack_delay_ms", 120)))
            event_delay_ms = event.delay_ms + delay_step_ms * repeat_index
            amount = float(event.amount) * scale
            payload = {
                **event.payload,
                "continuous_attack_index": repeat_index,
                "continuous_attack_count": repeat_count,
                "continuous_attack_chance_percent": chance_percent,
                "continuous_attack_roll": roll,
                "continuous_attack_damage_step_percent": step_percent,
                "continuous_attack_damage_scale": scale,
            }
            if isinstance(payload.get("damage_components"), dict):
                payload["damage_components"] = _scaled_components(payload["damage_components"], scale)
            extra_events.append(
                SkillEvent(
                    event_id=_event_id(skill, timestamp_ms, 9000 + source_index * 30 + repeat_index * 3, "damage"),
                    type="damage",
                    timestamp_ms=event.timestamp_ms + delay_step_ms * repeat_index,
                    source_entity=event.source_entity,
                    target_entity=event.target_entity,
                    position=dict(event.position),
                    direction=dict(event.direction),
                    delay_ms=event_delay_ms,
                    duration_ms=0,
                    amount=amount,
                    damage_type=event.damage_type,
                    skill_instance_id=event.skill_instance_id,
                    vfx_key=event.vfx_key,
                    sfx_key=event.sfx_key,
                    reason_key=event.reason_key,
                    payload=payload,
                )
            )
            extra_events.append(
                SkillEvent(
                    event_id=_event_id(skill, timestamp_ms, 9000 + source_index * 30 + repeat_index * 3 + 1, "hit_vfx"),
                    type="hit_vfx",
                    timestamp_ms=event.timestamp_ms + delay_step_ms * repeat_index,
                    source_entity=event.source_entity,
                    target_entity=event.target_entity,
                    position=dict(event.position),
                    direction=dict(event.direction),
                    delay_ms=event_delay_ms,
                    duration_ms=420,
                    amount=None,
                    damage_type=event.damage_type,
                    skill_instance_id=event.skill_instance_id,
                    vfx_key=event.vfx_key,
                    sfx_key=event.sfx_key,
                    reason_key=event.reason_key,
                    payload=payload,
                )
            )
            extra_events.append(
                SkillEvent(
                    event_id=_event_id(skill, timestamp_ms, 9000 + source_index * 30 + repeat_index * 3 + 2, "floating_text"),
                    type="floating_text",
                    timestamp_ms=event.timestamp_ms + delay_step_ms * repeat_index,
                    source_entity=event.source_entity,
                    target_entity=event.target_entity,
                    position={"x": float(event.position["x"]), "y": float(event.position["y"]) - 28.0},
                    direction=dict(event.direction),
                    delay_ms=event_delay_ms,
                    duration_ms=800,
                    amount=amount,
                    damage_type=event.damage_type,
                    skill_instance_id=event.skill_instance_id,
                    vfx_key=event.vfx_key,
                    sfx_key=event.sfx_key,
                    reason_key=event.reason_key,
                    payload={**payload, "text": _damage_text(amount, event.damage_type)},
                )
            )
    if not extra_events:
        return events
    return _sorted_events([*events, *extra_events])


def _with_knockback_events(
    skill: FinalSkillInstance,
    events: tuple[SkillEvent, ...],
    *,
    timestamp_ms: int,
) -> tuple[SkillEvent, ...]:
    runtime_params = skill.runtime_params or {}
    chance_percent = max(0.0, float(runtime_params.get("knockback_chance_percent", 0.0)))
    if chance_percent <= 0.0:
        return events
    base_distance = max(0.0, float(runtime_params.get("knockback_base_distance", 48.0)))
    distance_add_percent = float(runtime_params.get("knockback_distance_add_percent", 0.0))
    movement_distance = base_distance * max(0.0, 1.0 + distance_add_percent / 100.0)
    if movement_distance <= 0.0:
        return events
    extra_events: list[SkillEvent] = []
    damage_events = [
        event
        for event in events
        if event.type == "damage"
        and event.amount is not None
        and event.amount > 0
        and not event.payload.get("continuous_attack_index")
    ]
    for index, event in enumerate(damage_events):
        roll = (_stable_hash(f"{skill.active_gem_instance_id}:{timestamp_ms}:knockback:{event.event_id}") % 10000) / 100.0
        if chance_percent < 100.0 and roll >= chance_percent:
            continue
        origin = _payload_point(event.payload, "origin_world_position") or _payload_point(event.payload, "origin")
        direction = _knockback_direction(origin, event)
        destination = {
            "x": float(event.position["x"]) + direction["x"] * movement_distance,
            "y": float(event.position["y"]) + direction["y"] * movement_distance,
        }
        payload = {
            **event.payload,
            "movement_policy": "knockback",
            "movement_distance": movement_distance,
            "knockback_chance_percent": chance_percent,
            "knockback_roll": roll,
            "knockback_base_distance": base_distance,
            "knockback_distance_add_percent": distance_add_percent,
            "origin_world_position": origin or dict(event.position),
            "destination_world_position": destination,
        }
        extra_events.append(
            SkillEvent(
                event_id=_event_id(skill, timestamp_ms, 9300 + index, "forced_movement"),
                type="forced_movement",
                timestamp_ms=event.timestamp_ms,
                source_entity=event.source_entity,
                target_entity=event.target_entity,
                position=destination,
                direction=direction,
                delay_ms=event.delay_ms,
                duration_ms=120,
                amount=movement_distance,
                damage_type=event.damage_type,
                skill_instance_id=event.skill_instance_id,
                vfx_key=event.vfx_key,
                sfx_key=event.sfx_key,
                reason_key="skill_event.knockback.forced_movement",
                payload=payload,
            )
        )
    if not extra_events:
        return events
    return _sorted_events([*events, *extra_events])


def _payload_point(payload: Mapping[str, Any], key: str) -> dict[str, float] | None:
    value = payload.get(key)
    if not isinstance(value, Mapping):
        return None
    try:
        return {"x": float(value["x"]), "y": float(value["y"])}
    except (KeyError, TypeError, ValueError):
        return None


def _knockback_direction(origin: dict[str, float] | None, event: SkillEvent) -> dict[str, float]:
    if origin is not None:
        dx = float(event.position["x"]) - origin["x"]
        dy = float(event.position["y"]) - origin["y"]
        length = hypot(dx, dy)
        if length > 0.0:
            return {"x": dx / length, "y": dy / length}
    dx = float(event.direction.get("x", 0.0))
    dy = float(event.direction.get("y", 0.0))
    length = hypot(dx, dy)
    if length > 0.0:
        return {"x": dx / length, "y": dy / length}
    return {"x": 1.0, "y": 0.0}


def _with_overload_buff_damage_events(
    skill: FinalSkillInstance,
    events: tuple[SkillEvent, ...],
    *,
    runtime_context: object | None,
) -> tuple[SkillEvent, ...]:
    runtime_params = skill.runtime_params or {}
    per_stack_percent = max(0.0, float(runtime_params.get("overload_damage_per_stack_percent", 0.0)))
    if per_stack_percent <= 0.0:
        return events
    buff_type = str(runtime_params.get("overload_buff_type", "energy_blessing"))
    max_stacks = max(1, int(runtime_params.get("overload_max_stacks", 1)))
    stacks = min(max_stacks, _runtime_buff_stacks(runtime_context, buff_type))
    if stacks <= 0:
        return events
    scale = 1.0 + per_stack_percent * stacks / 100.0
    result: list[SkillEvent] = []
    for event in events:
        if event.type not in {"damage", "floating_text"} or event.amount is None or event.amount <= 0:
            result.append(event)
            continue
        payload = {
            **event.payload,
            "overload_buff_applied": True,
            "overload_buff_type": buff_type,
            "overload_buff_stacks": stacks,
            "overload_damage_per_stack_percent": per_stack_percent,
            "overload_damage_scale": scale,
        }
        if isinstance(payload.get("damage_components"), dict):
            payload["damage_components"] = _scaled_components(payload["damage_components"], scale)
        amount = float(event.amount) * scale
        if event.type == "floating_text":
            payload["text"] = _damage_text(amount, event.damage_type)
        result.append(
            SkillEvent(
                event_id=event.event_id,
                type=event.type,
                timestamp_ms=event.timestamp_ms,
                source_entity=event.source_entity,
                target_entity=event.target_entity,
                position=dict(event.position),
                direction=dict(event.direction),
                delay_ms=event.delay_ms,
                duration_ms=event.duration_ms,
                amount=amount,
                damage_type=event.damage_type,
                skill_instance_id=event.skill_instance_id,
                vfx_key=event.vfx_key,
                sfx_key=event.sfx_key,
                reason_key=event.reason_key,
                payload=payload,
            )
        )
    return tuple(result)


def _runtime_buff_stacks(runtime_context: object | None, buff_type: str) -> int:
    if not isinstance(runtime_context, Mapping):
        return 0
    buff_stacks = runtime_context.get("buff_stacks")
    if isinstance(buff_stacks, Mapping):
        try:
            return max(0, int(buff_stacks.get(buff_type, 0)))
        except (TypeError, ValueError):
            return 0
    buffs = runtime_context.get("buffs")
    if not isinstance(buffs, (list, tuple)):
        return 0
    stacks = 0
    for buff in buffs:
        try:
            if isinstance(buff, Mapping):
                current_type = str(buff.get("buff_type", buff.get("type", "")))
                remaining_ms = int(buff.get("remaining_ms", 1) or 0)
                current_stacks = int(buff.get("stacks", 1) or 0)
            else:
                current_type = str(getattr(buff, "buff_type", ""))
                remaining_ms = int(getattr(buff, "remaining_ms", 1) or 0)
                current_stacks = int(getattr(buff, "stacks", 1) or 0)
        except (TypeError, ValueError):
            continue
        if current_type == buff_type and remaining_ms > 0:
            stacks += max(0, current_stacks)
    return stacks


def _damage_zone_channel_payloads(
    skill: FinalSkillInstance,
    runtime_params: Mapping[str, Any],
    timestamp_ms: int,
    runtime_context: object | None,
    *,
    base_radius: float,
    base_damage_amount: float,
) -> tuple[dict[str, Any], dict[str, Any] | None]:
    if "channel_max_stacks" not in runtime_params:
        return {}, None
    context = runtime_context if isinstance(runtime_context, Mapping) else {}
    previous_stack = max(0, int(context.get("channel_stack", 0)))
    previous_elapsed_ms = max(0, int(context.get("channel_elapsed_ms", 0)))
    max_stacks = max(1, int(runtime_params.get("channel_max_stacks", 1)))
    min_stacks = max(0, min(max_stacks, int(runtime_params.get("channel_min_stacks", 0))))
    time_per_stack_ms = max(1, int(runtime_params.get("channel_time_per_stack_ms", 1)))
    stack_gain = max(1, int(context.get("channel_stack_gain", 1)))
    channel_stack = min(max_stacks, max(min_stacks, previous_stack + stack_gain))
    channel_elapsed_ms = previous_elapsed_ms + time_per_stack_ms * stack_gain
    full_reached = channel_stack >= max_stacks
    slash_chance_percent = max(0.0, min(100.0, float(runtime_params.get("slash_chance_percent", 0.0))))
    slash_roll = (_stable_hash(f"{skill.active_gem_instance_id}:{timestamp_ms}:channel_slash") % 10000) / 100.0
    slash_triggered = full_reached and (slash_chance_percent >= 100.0 or (slash_chance_percent > 0.0 and slash_roll < slash_chance_percent))
    next_stack = 0 if full_reached else channel_stack
    next_elapsed_ms = 0 if full_reached else channel_elapsed_ms
    common = {
        "channel_phase": "channel_tick",
        "channel_stack": channel_stack,
        "channel_max_stacks": max_stacks,
        "channel_min_stacks": min_stacks,
        "channel_time_per_stack_ms": time_per_stack_ms,
        "channel_elapsed_ms": channel_elapsed_ms,
        "next_channel_stack": next_stack,
        "next_channel_elapsed_ms": next_elapsed_ms,
        "channel_full_reached": full_reached,
        "channel_tick_during_channel": bool(runtime_params.get("channel_tick_during_channel", False)),
        "slash_chance_percent": slash_chance_percent,
        "slash_roll": slash_roll,
        "slash_triggered": slash_triggered,
        "base_radius": base_radius,
    }
    if "channel_move_speed_multiplier" in runtime_params:
        common["channel_move_speed_multiplier"] = max(0.0, float(runtime_params["channel_move_speed_multiplier"]))
    if not slash_triggered:
        return common, None
    slash_damage_scale = max(0.0, float(runtime_params.get("slash_damage_scale", 1.0)))
    slash_radius = max(1.0, float(runtime_params.get("slash_radius", base_radius)))
    slash_payload = {
        **common,
        "channel_phase": "channel_slash",
        "radius": slash_radius,
        "base_radius": base_radius,
        "slash_radius": slash_radius,
        "slash_damage_scale": slash_damage_scale,
        "damage_amount": round(base_damage_amount * slash_damage_scale, 6),
        "next_channel_stack": 0,
        "next_channel_elapsed_ms": 0,
    }
    return common, slash_payload


def _runtime_event_sort_order(event_type: str) -> int:
    return {
        "cast_start": 0,
        "area_spawn": 1,
        "chain_segment": 1,
        "melee_arc": 1,
        "orbit_spawn": 1,
        "projectile_spawn": 1,
        "orbit_tick": 2,
        "projectile_impact": 2,
        "damage_zone_prime": 3,
        "target_search": 3,
        "damage_zone": 4,
        "projectile_hit": 5,
        "damage_zone_hit": 5,
        "damage": 6,
        "status_apply": 7,
        "buff_apply": 7,
        "forced_movement": 8,
        "hit_vfx": 9,
        "floating_text": 10,
        "cooldown_update": 11,
    }.get(event_type, 99)


def _damage_event_payload(
    skill: FinalSkillInstance,
    payload: dict[str, Any],
    *,
    amount_scale: float = 1.0,
    damage_context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if damage_context is not None and isinstance(damage_context.get("components"), dict):
        components = dict(damage_context["components"])
    else:
        components = _scaled_components(skill.final_damage_components or {skill.damage_type: skill.final_damage}, amount_scale)
    result = {
        **payload,
        "damage_components": components,
        "converted_damage_components": skill.converted_damage_components or {},
        "damage_conversions": tuple(skill.damage_conversions),
    }
    runtime_params = skill.runtime_params or {}
    for key in ("double_damage_chance_percent",):
        if key in runtime_params:
            result[key] = runtime_params[key]
    for key in (
        "deterioration_chance_percent",
        "deterioration_damage_percent_of_chaos_hit",
        "deterioration_duration_ms",
    ):
        if key in runtime_params:
            result[key] = runtime_params[key]
    return result


def _forced_element_type(runtime_params: dict[str, Any], *, seed: str) -> str:
    values = runtime_params.get("forced_element_types")
    if not isinstance(values, (list, tuple)):
        return ""
    elements = tuple(str(value) for value in values if str(value) in {"fire", "cold", "lightning"})
    if not elements:
        return ""
    return elements[_stable_hash(seed) % len(elements)]


def _projectile_damage_context(
    skill: FinalSkillInstance,
    runtime_params: dict[str, Any],
    *,
    amount: float,
    damage_type: str,
    hit_sequence: int,
    damage_scale: float,
) -> dict[str, Any]:
    effective_type = damage_type or skill.damage_type
    effective_amount = amount * damage_scale
    components = {effective_type: round(effective_amount, 6)} if effective_amount > 1e-9 else {}
    payload: dict[str, Any] = {
        "damage_type": effective_type,
        "damage_scale": damage_scale,
        "same_target_hit_sequence": hit_sequence,
    }
    if damage_type:
        payload["forced_element_type"] = effective_type
        payload["forced_element_source"] = "cast_random_choice"
    if "shotgun_falloff_coeff" in runtime_params:
        payload["shotgun_falloff_coeff"] = max(0.0, min(1.0, float(runtime_params.get("shotgun_falloff_coeff", 1.0))))
    for key in (
        "allow_same_target_projectile_hits",
        "armor_reduction_penetration_percent",
        "cull_threshold_percent",
        "numbed_effect_add_percent",
        "double_damage_chance_percent",
        "on_kill_explosion_chance_percent",
        "on_kill_explosion_radius",
        "on_kill_explosion_max_life_percent",
        "on_kill_explosion_damage_type",
        "on_ignited_hit_explosion_radius",
        "on_ignited_hit_true_damage_percent_of_ignite_dps",
        "on_ignited_hit_indirect_fire_damage",
        "on_ignited_hit_cooldown_ms",
    ):
        if key in runtime_params:
            payload[key] = runtime_params[key]
    return {
        "amount": effective_amount,
        "damage_type": effective_type,
        "components": components,
        "payload": payload,
    }


def _status_apply_events(
    skill: FinalSkillInstance,
    *,
    timestamp_ms: int,
    base_index: int,
    source_entity: str,
    target_entity: str,
    position: dict[str, float],
    direction: dict[str, float],
    delay_ms: int,
    payload: dict[str, Any],
    ailments: tuple[dict[str, Any], ...] | None = None,
    amount_scale: float = 1.0,
) -> list[SkillEvent]:
    if skill.hit and not bool(skill.hit.get("can_apply_status", True)):
        return []
    final_components = _status_damage_components(
        skill,
        payload=payload,
        amount_scale=amount_scale,
    )
    result: list[SkillEvent] = []
    hit_ailments = _hit_ailments_for_components(
        ailments if ailments is not None else skill.ailments,
        final_components,
    )
    for offset, ailment in enumerate(hit_ailments):
        ailment_type = str(ailment.get("type", ""))
        source_damage_type = str(ailment.get("source_damage_type", ""))
        if source_damage_type and final_components.get(source_damage_type, 0.0) <= 0:
            continue
        chance_percent = max(0.0, float(ailment.get("chance_percent", 100.0)))
        if ailment_type == "deterioration":
            chance_percent = max(0.0, float(payload.get("deterioration_chance_percent", chance_percent)))
        if chance_percent <= 0:
            continue
        duration_ms = int(ailment.get("duration_ms", _default_ailment_duration_ms(ailment_type)))
        if ailment_type == "deterioration":
            duration_ms = int(payload.get("deterioration_duration_ms", duration_ms))
        base_value = float(ailment.get("base_value", _default_ailment_base_value(ailment_type)))
        if ailment_type == "deterioration":
            chaos_hit = max(0.0, float(final_components.get("chaos", 0.0)))
            percent = max(0.0, float(payload.get("deterioration_damage_percent_of_chaos_hit", 60.0)))
            base_value = chaos_hit * percent / 100.0
        status_payload = {
            **payload,
            "status_type": ailment_type,
            "source_damage_type": source_damage_type,
            "chance_percent": chance_percent,
            "duration_ms": duration_ms,
            "base_value": base_value,
            "base_damage_per_second": float(ailment.get("base_damage_per_second", 0.0)),
            "damage_over_time_more_percent": float(ailment.get("damage_over_time_more_percent", 0.0)),
            "dot_damage_bonus_per_ignite_stack_percent": float(ailment.get("dot_damage_bonus_per_ignite_stack_percent", 0.0)),
            "dot_damage_bonus_max_percent": float(ailment.get("dot_damage_bonus_max_percent", 0.0)),
            "stacks": int(ailment.get("stacks", 1)),
            "max_stacks": int(ailment.get("max_stacks", _default_ailment_max_stacks(ailment_type))),
            "max_triggers": int(ailment.get("max_triggers", _default_ailment_max_triggers(ailment_type))),
            "effect_per_stack": float(ailment.get("effect_per_stack", _default_ailment_effect_per_stack(ailment_type))),
            "threshold": float(ailment.get("threshold", _default_ailment_threshold(ailment_type))),
            "conversion_buff_type": str(ailment.get("conversion_buff_type", ailment.get("convert_to_buff_type", ""))),
            "conversion_consume_source": bool(ailment.get("conversion_consume_source", True)),
            "source_skill_id": str(ailment.get("source_skill_id", payload.get("skill_id", ""))),
            "damage_components": final_components,
        }
        if ailment_type == "numbed":
            effect_add = max(0.0, float(payload.get("numbed_effect_add_percent", 0.0)))
            if effect_add > 0:
                status_payload["effect_per_stack"] = float(status_payload["effect_per_stack"]) * (1.0 + effect_add / 100.0)
        result.append(
            SkillEvent(
                event_id=_event_id(skill, timestamp_ms, base_index + offset, "status_apply"),
                type="status_apply",
                timestamp_ms=timestamp_ms + delay_ms,
                source_entity=source_entity,
                target_entity=target_entity,
                position=dict(position),
                direction=dict(direction),
                delay_ms=delay_ms,
                duration_ms=duration_ms,
                amount=None,
                damage_type=source_damage_type or skill.damage_type,
                skill_instance_id=skill.active_gem_instance_id,
                vfx_key=skill.presentation_keys.get("hit_vfx_key", skill.visual_effect) if skill.presentation_keys else skill.visual_effect,
                sfx_key=skill.presentation_keys.get("sfx", "") if skill.presentation_keys else "",
                reason_key=f"skill_event.{ailment_type}.status_apply",
                payload=status_payload,
            )
        )
    return result


def _status_damage_components(
    skill: FinalSkillInstance,
    *,
    payload: dict[str, Any],
    amount_scale: float,
) -> dict[str, float]:
    payload_components = payload.get("damage_components")
    if isinstance(payload_components, dict) and payload_components:
        return _scaled_components(
            {
                str(damage_type): float(amount)
                for damage_type, amount in payload_components.items()
                if isinstance(amount, (int, float)) and not isinstance(amount, bool)
            },
            1.0,
        )
    return _scaled_components(skill.final_damage_components or {skill.damage_type: skill.final_damage}, amount_scale)


def _hit_ailments_for_components(
    configured_ailments: tuple[dict[str, Any], ...],
    components: dict[str, float],
) -> tuple[dict[str, Any], ...]:
    result = [dict(ailment) for ailment in configured_ailments if isinstance(ailment, dict)]
    configured_types = {str(ailment.get("type", "")) for ailment in result}
    if components.get("cold", 0.0) > 0 and "frostbite" not in configured_types:
        result.append({"type": "frostbite", "source_damage_type": "cold", "chance_percent": 100.0})
    if components.get("lightning", 0.0) > 0 and "numbed" not in configured_types:
        result.append({"type": "numbed", "source_damage_type": "lightning", "chance_percent": 100.0})
    if components.get("chaos", 0.0) > 0 and "deterioration" not in configured_types:
        result.append({"type": "deterioration", "source_damage_type": "chaos", "chance_percent": 0.0})
    return tuple(result)


def _secondary_hit_events(
    skill: FinalSkillInstance,
    *,
    timestamp_ms: int,
    base_index: int,
    source_entity: str,
    target_entity: str,
    impact_position: dict[str, float],
    direction: dict[str, float],
    delay_ms: int,
    payload: dict[str, Any],
    targets: tuple[_RuntimeTarget, ...],
) -> list[SkillEvent]:
    result: list[SkillEvent] = []
    presentation = skill.presentation_keys or {}
    for index, secondary in enumerate(skill.secondary_hits):
        if secondary.get("trigger") not in {"on_projectile_hit", "on_hit"}:
            continue
        if secondary.get("requires_unsplit_projectile", False) and payload.get("split_projectile"):
            continue
        secondary_ailments = tuple(dict(ailment) for ailment in secondary.get("ailments", ()) if isinstance(ailment, dict))
        secondary_base_damage = max(0.0, float(secondary.get("base_damage", 0.0)))
        amount_scale = secondary_base_damage / skill.base_damage if skill.base_damage > 0 else 0.0
        if amount_scale <= 0 and not secondary_ailments:
            continue
        offset_distance = max(0.0, float(secondary.get("offset_distance", 0.0)))
        if secondary.get("placement") == "behind_target":
            position = {
                "x": float(impact_position["x"]) + float(direction.get("x", 0.0)) * offset_distance,
                "y": float(impact_position["y"]) + float(direction.get("y", 0.0)) * offset_distance,
            }
        else:
            position = dict(impact_position)
        event_delay_ms = delay_ms + max(0, int(secondary.get("delay_ms", 0)))
        radius = max(0.0, float(secondary.get("radius", skill.hit.get("hit_radius", 0.0) if skill.hit else 0.0)))
        amount = skill.final_damage * amount_scale
        status_amount_scale = amount_scale if amount_scale > 0 else 1.0
        max_targets = int(secondary.get("max_targets", 1))
        zone_duration_ms = max(0, int(secondary.get("duration_ms", 260)))
        tick_interval_ms = max(0, int(secondary.get("tick_interval_ms", 0)))
        tick_times = (0,)
        if zone_duration_ms > 0 and tick_interval_ms > 0:
            tick_times = tuple(tick_time for _, tick_time in tick_schedule(zone_duration_ms, tick_interval_ms))
        zone_id = f"{skill.active_gem_instance_id}.{timestamp_ms}.secondary.{index + 1}"
        secondary_id = str(secondary.get("id", f"secondary_{index + 1}"))
        trigger_marker_id = str(secondary.get("trigger_marker_id") or payload.get("hit_marker_id") or payload.get("marker_id") or "projectile_hit")
        search_module_id = str(secondary.get("search_module_id") or f"{secondary_id}_target_search")
        direct_damage_module_id = str(secondary.get("direct_damage_module_id") or f"{secondary_id}_direct_damage")
        hit_marker_id = str(secondary.get("hit_marker_id") or f"{secondary_id}_hit")
        hit_targets = _damage_zone_hit_targets(
            position,
            {"x": 0.0, "y": 0.0},
            targets,
            shape=str(secondary.get("shape", "circle")),
            radius=radius,
            length=max(0.0, float(secondary.get("length", 0.0))),
            width=max(0.0, float(secondary.get("width", 0.0))),
            max_targets=max_targets,
            selection_seed=f"{zone_id}:{target_entity}:{secondary.get('id', index + 1)}",
        )
        if not hit_targets:
            hit_targets = ((_RuntimeTarget(target_entity, dict(position)), {"target_distance": 0.0}),)
        hit_payload = _damage_event_payload(
            skill,
            {
                **payload,
                "secondary_hit_id": secondary_id,
                "zone_id": zone_id,
                "trigger_marker_id": trigger_marker_id,
                "source_marker_id": trigger_marker_id,
                "search_module_id": search_module_id,
                "direct_damage_module_id": direct_damage_module_id,
                "hit_marker_id": hit_marker_id,
                "shape": secondary.get("shape", "circle"),
                "radius": radius,
                "origin": dict(position),
                "origin_world_position": dict(position),
                "center": dict(position),
                "center_world_position": dict(position),
                "hit_world_position": dict(position),
                "target_world_position": dict(position),
                "max_targets": max_targets,
                "hit_target_count": len(hit_targets),
                "target_policy": "secondary_hit_stable_random",
                "placement": secondary.get("placement", "impact_position"),
                "duration_ms": zone_duration_ms,
                "tick_interval_ms": tick_interval_ms,
                "tick_count": len(tick_times),
            },
            amount_scale=amount_scale,
        )
        vfx_key = str(secondary.get("vfx_key") or presentation.get("hit_vfx_key", presentation.get("vfx", skill.visual_effect)))
        reason_key = str(secondary.get("reason_key") or _damage_reason_key(skill))
        floating_key = presentation.get("floating_text", "skill_event.fire_bolt.floating_text")
        floating_text = _damage_text(amount, skill.damage_type)
        result.append(
            SkillEvent(
                event_id=_event_id(skill, timestamp_ms, base_index + index * 100, "damage_zone"),
                type="damage_zone",
                timestamp_ms=timestamp_ms + event_delay_ms,
                source_entity=source_entity,
                target_entity=target_entity,
                position=dict(position),
                direction=dict(direction),
                delay_ms=event_delay_ms,
                duration_ms=zone_duration_ms,
                amount=None,
                damage_type=skill.damage_type,
                skill_instance_id=skill.active_gem_instance_id,
                vfx_key=vfx_key,
                sfx_key=presentation.get("sfx", ""),
                reason_key=reason_key,
                payload=hit_payload,
            )
        )
        result.append(
            SkillEvent(
                event_id=_event_id(skill, timestamp_ms, base_index + index * 100 + 1, "target_search"),
                type="target_search",
                timestamp_ms=timestamp_ms + event_delay_ms,
                source_entity=source_entity,
                target_entity=target_entity,
                position=dict(position),
                direction=dict(direction),
                delay_ms=event_delay_ms,
                duration_ms=0,
                amount=None,
                damage_type=skill.damage_type,
                skill_instance_id=skill.active_gem_instance_id,
                vfx_key=vfx_key,
                sfx_key=presentation.get("sfx", ""),
                reason_key=reason_key,
                payload={
                    **hit_payload,
                    "locked_target_ids": [target.entity_id for target, _ in hit_targets],
                    "locked_target_count": len(hit_targets),
                    "effect": "secondary_target_search",
                },
            )
        )
        for target_index, (target, target_payload) in enumerate(hit_targets):
            target_direction = _direction(position, target.position)
            target_hit_marker_event_id = f"{zone_id}.{target.entity_id}.{hit_marker_id}"
            target_event_payload = {
                **hit_payload,
                **target_payload,
                "target_world_position": dict(target.position),
                "hit_world_position": dict(target.position),
                "marker_id": hit_marker_id,
                "hit_marker_event_id": target_hit_marker_event_id,
                "trigger_event_type": "target_search",
                "trigger_marker_id": trigger_marker_id,
                "effect": "secondary_direct_damage",
            }
            result.append(
                SkillEvent(
                    event_id=_event_id(skill, timestamp_ms, base_index + index * 100 + target_index * 10 + 2, "damage_zone_hit"),
                    type="damage_zone_hit",
                    timestamp_ms=timestamp_ms + event_delay_ms,
                    source_entity=source_entity,
                    target_entity=target.entity_id,
                    position=dict(target.position),
                    direction=target_direction,
                    delay_ms=event_delay_ms,
                    duration_ms=0,
                    amount=None,
                    damage_type=skill.damage_type,
                    skill_instance_id=skill.active_gem_instance_id,
                    vfx_key=vfx_key,
                    sfx_key=presentation.get("sfx", ""),
                    reason_key=reason_key,
                    payload=target_event_payload,
                )
            )
            if amount_scale > 0:
                result.append(
                    SkillEvent(
                        event_id=_event_id(skill, timestamp_ms, base_index + index * 100 + target_index * 10 + 3, "damage"),
                        type="damage",
                        timestamp_ms=timestamp_ms + event_delay_ms,
                        source_entity=source_entity,
                        target_entity=target.entity_id,
                        position=dict(target.position),
                        direction=target_direction,
                        delay_ms=event_delay_ms,
                        duration_ms=0,
                        amount=amount,
                        damage_type=skill.damage_type,
                        skill_instance_id=skill.active_gem_instance_id,
                        vfx_key=vfx_key,
                        sfx_key=presentation.get("sfx", ""),
                        reason_key=reason_key,
                        payload=target_event_payload,
                    )
                )
            result.extend(
                [
                    SkillEvent(
                        event_id=_event_id(skill, timestamp_ms, base_index + index * 100 + target_index * 10 + 4, "hit_vfx"),
                        type="hit_vfx",
                        timestamp_ms=timestamp_ms + event_delay_ms,
                        source_entity=source_entity,
                        target_entity=target.entity_id,
                        position=dict(target.position),
                        direction=target_direction,
                        delay_ms=event_delay_ms,
                        duration_ms=420,
                        amount=None,
                        damage_type=skill.damage_type,
                        skill_instance_id=skill.active_gem_instance_id,
                        vfx_key=vfx_key,
                        sfx_key=presentation.get("sfx", ""),
                        reason_key=reason_key,
                        payload=target_event_payload,
                    ),
                    SkillEvent(
                        event_id=_event_id(skill, timestamp_ms, base_index + index * 100 + target_index * 10 + 5, "floating_text"),
                        type="floating_text",
                        timestamp_ms=timestamp_ms + event_delay_ms,
                        source_entity=source_entity,
                        target_entity=target.entity_id,
                        position={"x": target.position["x"], "y": target.position["y"] - 28.0},
                        direction=target_direction,
                        delay_ms=event_delay_ms,
                        duration_ms=800,
                        amount=amount if amount_scale > 0 else None,
                        damage_type=skill.damage_type,
                        skill_instance_id=skill.active_gem_instance_id,
                        vfx_key=vfx_key,
                        sfx_key=presentation.get("sfx", ""),
                        reason_key=floating_key,
                        payload={**target_event_payload, "text": floating_text},
                    ),
                ]
            )
            for tick_index, tick_time_ms in enumerate(tick_times):
                tick_payload = {
                    **target_event_payload,
                    "tick_index": tick_index + 1,
                    "tick_time_ms": tick_time_ms,
                    "tick_interval_ms": tick_interval_ms,
                    "duration_ms": zone_duration_ms,
                }
                result.extend(
                    _status_apply_events(
                        skill,
                        timestamp_ms=timestamp_ms,
                        base_index=base_index + index * 100 + target_index * 100 + tick_index * 10 + 4,
                        source_entity=source_entity,
                        target_entity=target.entity_id,
                        position=target.position,
                        direction=target_direction,
                        delay_ms=event_delay_ms + tick_time_ms,
                        payload=tick_payload,
                        ailments=secondary_ailments,
                        amount_scale=status_amount_scale,
                    )
                )
    return result


def _scaled_components(components: dict[str, float], scale: float) -> dict[str, float]:
    return {
        damage_type: round(float(amount) * scale, 6)
        for damage_type, amount in components.items()
        if float(amount) * scale > 1e-9
    }


def _default_ailment_duration_ms(ailment_type: str) -> int:
    return {
        "ignite": 4000,
        "aggravation": 4000,
        "frostbite": 4000,
        "frozen": 0,
        "shock": 4000,
        "numbed": 2000,
        "deterioration": 1000,
        "trauma": 4000,
        "wilt": 1500,
    }.get(ailment_type, 0)


def _default_ailment_base_value(ailment_type: str) -> float:
    return 10.0 if ailment_type == "frostbite" else 0.0


def _default_ailment_max_stacks(ailment_type: str) -> int:
    return {
        "numbed": 10,
        "deterioration": 99,
        "trauma": 1,
        "wilt": 30,
    }.get(ailment_type, 1)


def _default_ailment_max_triggers(ailment_type: str) -> int:
    return 12 if ailment_type == "shock" else 0


def _default_ailment_effect_per_stack(ailment_type: str) -> float:
    if ailment_type == "numbed":
        return 5.0
    if ailment_type == "frostbite":
        return 1.0
    return 0.0


def _default_ailment_threshold(ailment_type: str) -> float:
    return 100.0 if ailment_type == "frostbite" else 0.0


def _projectile_id(skill: FinalSkillInstance, timestamp_ms: int, projectile_index: int) -> str:
    return f"{skill.active_gem_instance_id}.{timestamp_ms}.projectile.{projectile_index}"


def _is_player_source(source_entity: str) -> bool:
    return source_entity == "player" or source_entity.startswith("player_")


def _first_module(modules: list[object], module_type: str) -> dict[str, Any] | None:
    for module in modules:
        if isinstance(module, dict) and module.get("type") == module_type:
            return module
    return None


def _module_params(module: dict[str, Any]) -> dict[str, Any]:
    params = module.get("params", {})
    return dict(params) if isinstance(params, dict) else {}


def _module_trigger(module: dict[str, Any]) -> dict[str, Any]:
    trigger = module.get("trigger", {})
    return dict(trigger) if isinstance(trigger, dict) else {}


def _position_dict(position: object) -> dict[str, float]:
    return {
        "x": float(getattr(position, "x")),
        "y": float(getattr(position, "y")),
    }


def _spawn_position(source_position: dict[str, float], runtime_params: dict[str, Any]) -> dict[str, float]:
    offset = runtime_params.get("spawn_offset", {})
    if not isinstance(offset, dict):
        offset = {}
    return {
        "x": source_position["x"] + float(offset.get("x", 0.0)),
        "y": source_position["y"] + float(offset.get("y", 0.0)),
    }


def _direction(source: dict[str, float], target: dict[str, float]) -> dict[str, float]:
    dx = target["x"] - source["x"]
    dy = target["y"] - source["y"]
    length = hypot(dx, dy)
    if length <= 0:
        return {"x": 1.0, "y": 0.0}
    return {"x": dx / length, "y": dy / length}


def _duration_ms(distance: float, projectile_speed: float, min_duration_ms: int, max_duration_ms: int | None) -> int:
    duration_ms = int(round(max(0.0, distance) / max(1.0, projectile_speed) * 1000))
    if max_duration_ms is not None:
        duration_ms = min(duration_ms, max_duration_ms)
    return max(min_duration_ms, duration_ms)


def _projectile_travel_duration_ms(
    distance: float,
    projectile_speed: float,
    min_duration_ms: int,
    max_duration_ms: int | None,
    runtime_params: Mapping[str, Any],
    projectile_visual_mode: str,
) -> int:
    if projectile_visual_mode == "falling_arrow" and "travel_time_ms" in runtime_params:
        return max(1, int(runtime_params["travel_time_ms"]))
    return _duration_ms(distance, projectile_speed, min_duration_ms, max_duration_ms)


def tick_schedule(duration_ms: int, tick_interval_ms: int) -> tuple[tuple[int, int], ...]:
    if duration_ms <= 0 or tick_interval_ms <= 0:
        raise SkillRuntimeError("tick schedule duration and interval must be positive")
    if tick_interval_ms > duration_ms:
        raise SkillRuntimeError("tick schedule interval must not exceed duration")
    ticks: list[tuple[int, int]] = []
    timestamp = tick_interval_ms
    while timestamp <= duration_ms:
        ticks.append((len(ticks), timestamp))
        timestamp += tick_interval_ms
    return tuple(ticks)


def _orbit_position(
    center: dict[str, float],
    *,
    radius: float,
    speed_deg_per_sec: float,
    start_angle_deg: float,
    timestamp_ms: int,
    radius_cycle_enabled: bool = False,
    radius_cycle_amplitude: float = 0.0,
    radius_cycle_period_ms: int = 1000,
    radius_cycle_phase_deg: float = 0.0,
) -> dict[str, float]:
    angle_deg = start_angle_deg + speed_deg_per_sec * (timestamp_ms / 1000.0)
    angle_rad = angle_deg * pi / 180.0
    effective_radius = _orbit_effective_radius(
        radius,
        timestamp_ms=timestamp_ms,
        radius_cycle_enabled=radius_cycle_enabled,
        radius_cycle_amplitude=radius_cycle_amplitude,
        radius_cycle_period_ms=radius_cycle_period_ms,
        radius_cycle_phase_deg=radius_cycle_phase_deg,
    )
    return {
        "x": center["x"] + cos(angle_rad) * effective_radius,
        "y": center["y"] + sin(angle_rad) * effective_radius,
    }


def _orbit_effective_radius(
    radius: float,
    *,
    timestamp_ms: int,
    radius_cycle_enabled: bool,
    radius_cycle_amplitude: float,
    radius_cycle_period_ms: int,
    radius_cycle_phase_deg: float,
) -> float:
    if not radius_cycle_enabled or radius_cycle_amplitude <= 0:
        return max(1.0, radius)
    cycle_rad = (timestamp_ms / max(1, radius_cycle_period_ms)) * 2.0 * pi + radius_cycle_phase_deg * pi / 180.0
    return max(1.0, radius + sin(cycle_rad) * radius_cycle_amplitude)


def _optional_int(value: Any) -> int | None:
    if value is None:
        return None
    return int(value)


def _projectile_end_position(
    source: dict[str, float],
    direction: dict[str, float],
    distance: float,
) -> dict[str, float]:
    return {
        "x": source["x"] + direction["x"] * distance,
        "y": source["y"] + direction["y"] * distance,
    }


def _runtime_targets(target_entities: object) -> tuple[_RuntimeTarget, ...]:
    if not isinstance(target_entities, (list, tuple)):
        raise SkillRuntimeError("target_entities must be a list")
    return tuple(_runtime_target(target) for target in target_entities)


def _runtime_target(target: object) -> _RuntimeTarget:
    if isinstance(target, dict):
        entity_id = str(target.get("entity_id") or target.get("enemy_id") or target.get("target_entity") or "")
        position = target.get("position")
    else:
        entity_id = str(getattr(target, "entity_id", "") or getattr(target, "enemy_id", "") or getattr(target, "monster_id", ""))
        position = getattr(target, "position", None)
    if not entity_id:
        raise SkillRuntimeError("target entity id is required")
    return _RuntimeTarget(entity_id=entity_id, position=_position_dict_any(position))


def _position_dict_any(position: object) -> dict[str, float]:
    if isinstance(position, dict):
        return {"x": float(position["x"]), "y": float(position["y"])}
    return _position_dict(position)


def _projectile_hit_targets(
    source: dict[str, float],
    direction: dict[str, float],
    targets: tuple[_RuntimeTarget, ...],
    *,
    max_distance: float,
    collision_radius: float,
    max_hits: int,
) -> tuple[tuple[_RuntimeTarget, float], ...]:
    candidates = []
    for target in targets:
        dx = target.position["x"] - source["x"]
        dy = target.position["y"] - source["y"]
        forward = dx * direction["x"] + dy * direction["y"]
        perpendicular = abs(dx * direction["y"] - dy * direction["x"])
        if forward < -collision_radius or forward > max_distance + collision_radius:
            continue
        candidates.append((target, max(0.0, min(max_distance, forward)), perpendicular))
    line_targets = sorted(
        (candidate for candidate in candidates if candidate[2] <= collision_radius),
        key=lambda candidate: candidate[1],
    )
    selected = list(line_targets[:max(1, max_hits)])
    if len(selected) < max_hits and max_hits > 1:
        selected_ids = {target.entity_id for target, _, _ in selected}
        assist_targets = sorted(
            (
                candidate
                for candidate in candidates
                if candidate[0].entity_id not in selected_ids and candidate[2] <= collision_radius * 3
            ),
            key=lambda candidate: (candidate[2], candidate[1]),
        )
        selected.extend(assist_targets[: max_hits - len(selected)])
    return tuple((target, forward) for target, forward, _ in selected)


def _nearest_target(source: dict[str, float], targets: tuple[_RuntimeTarget, ...]) -> _RuntimeTarget | None:
    if not targets:
        return None
    return min(
        targets,
        key=lambda target: hypot(target.position["x"] - source["x"], target.position["y"] - source["y"]),
    )


def _stable_projectile_target(targets: tuple[_RuntimeTarget, ...], *, seed: str) -> _RuntimeTarget:
    value = _stable_hash(seed)
    return targets[value % len(targets)]


def _projectile_target_by_policy(
    targets: tuple[_RuntimeTarget, ...],
    *,
    policy: str,
    projectile_index: int,
    seed: str,
) -> _RuntimeTarget:
    if policy == "nearest_unique_enemy":
        return targets[(projectile_index - 1) % len(targets)]
    return _stable_projectile_target(targets, seed=seed)


def _stable_hash(seed: str) -> int:
    value = 0
    for char in seed:
        value = (value * 131 + ord(char)) & 0xFFFFFFFF
    return value


def _stable_projectile_angle_jitter(max_degrees: float, *, seed: str) -> float:
    if max_degrees <= 0:
        return 0.0
    value = 0
    for char in seed:
        value = (value * 167 + ord(char)) & 0xFFFFFFFF
    normalized = (value % 10001) / 10000.0
    return (normalized * 2.0 - 1.0) * max_degrees


def _max_targets(value: Any, default: int) -> int:
    if value == "unlimited":
        return max(1, default)
    try:
        return max(1, int(value))
    except (TypeError, ValueError):
        return max(1, default)


def _chain_target_sequence(
    origin: dict[str, float],
    targets: tuple[_RuntimeTarget, ...],
    *,
    chain_radius: float,
    chain_count: int,
    max_targets: int,
    allow_repeat_target: bool,
    target_policy: str,
) -> tuple[_RuntimeTarget, ...]:
    if not targets:
        return ()
    selected: list[_RuntimeTarget] = []
    hit_ids: set[str] = set()
    current_position = origin
    first_target = _nearest_target(origin, targets)
    if first_target is None:
        return ()
    selected.append(first_target)
    hit_ids.add(first_target.entity_id)
    current_position = first_target.position
    while len(selected) < chain_count and len(selected) < max_targets:
        candidates = []
        for target in targets:
            if not allow_repeat_target and target.entity_id in hit_ids:
                continue
            if selected and target.entity_id == selected[-1].entity_id:
                continue
            distance = hypot(target.position["x"] - current_position["x"], target.position["y"] - current_position["y"])
            if distance <= chain_radius:
                candidates.append((target, distance))
        if not candidates:
            break
        if target_policy != "nearest_not_hit":
            break
        next_target = sorted(candidates, key=lambda item: (item[1], item[0].entity_id))[0][0]
        selected.append(next_target)
        hit_ids.add(next_target.entity_id)
        current_position = next_target.position
    return tuple(selected)


def _melee_arc_hit_targets(
    source: dict[str, float],
    facing_direction: dict[str, float],
    targets: tuple[_RuntimeTarget, ...],
    *,
    arc_angle: float,
    arc_radius: float,
    max_targets: int,
) -> tuple[tuple[_RuntimeTarget, float, float], ...]:
    candidates: list[tuple[_RuntimeTarget, float, float]] = []
    half_angle = max(0.5, arc_angle / 2.0)
    for target in targets:
        dx = target.position["x"] - source["x"]
        dy = target.position["y"] - source["y"]
        distance = hypot(dx, dy)
        if distance <= 0 or distance > arc_radius:
            continue
        target_direction = {"x": dx / distance, "y": dy / distance}
        angle = _angle_between_degrees(facing_direction, target_direction)
        if angle <= half_angle:
            candidates.append((target, distance, angle))
    return tuple(sorted(candidates, key=lambda item: (item[1], item[2], item[0].entity_id))[:max(1, max_targets)])


def _damage_zone_hit_targets(
    origin: dict[str, float],
    direction: dict[str, float],
    targets: tuple[_RuntimeTarget, ...],
    *,
    shape: str,
    radius: float,
    length: float,
    width: float,
    max_targets: int,
    selection_seed: str = "",
) -> tuple[tuple[_RuntimeTarget, dict[str, float]], ...]:
    candidates: list[tuple[_RuntimeTarget, dict[str, float], tuple[float, float, str]]] = []
    if shape == "circle":
        for target in targets:
            distance = hypot(target.position["x"] - origin["x"], target.position["y"] - origin["y"])
            if distance <= radius:
                payload = {"target_distance": distance}
                candidates.append((target, payload, (distance, 0.0, target.entity_id)))
    elif shape == "rectangle":
        for target in targets:
            dx = target.position["x"] - origin["x"]
            dy = target.position["y"] - origin["y"]
            forward = dx * direction["x"] + dy * direction["y"]
            lateral = dx * -direction["y"] + dy * direction["x"]
            if forward < 0 or forward > length or abs(lateral) > width / 2.0:
                continue
            payload = {
                "target_forward_distance": forward,
                "target_lateral_offset": lateral,
                "target_distance": hypot(dx, dy),
            }
            candidates.append((target, payload, (forward, abs(lateral), target.entity_id)))
    else:
        return ()
    if selection_seed:
        selected = sorted(
            candidates,
            key=lambda item: (_stable_hash(f"{selection_seed}:{item[0].entity_id}"), item[2][0], item[0].entity_id),
        )[:max(1, max_targets)]
    else:
        selected = sorted(candidates, key=lambda item: item[2])[:max(1, max_targets)]
    return tuple((target, payload) for target, payload, _ in selected)


def _angle_between_degrees(left: dict[str, float], right: dict[str, float]) -> float:
    dot = left["x"] * right["x"] + left["y"] * right["y"]
    dot = max(-1.0, min(1.0, dot))
    # Avoid importing acos at module top in older snapshots by deriving from atan-compatible cosine.
    from math import acos

    return acos(dot) * 180.0 / pi


def _direction_angle_deg(direction: dict[str, float]) -> float:
    return atan2(direction["y"], direction["x"]) * 180.0 / pi


def _spread_angle_deg(runtime_params: dict[str, Any], behavior_template: str) -> float:
    return max(0.0, float(runtime_params.get("spread_angle_deg", 0.0)))


def _angle_step_deg(runtime_params: dict[str, Any], behavior_template: str) -> float:
    return max(0.0, float(runtime_params.get("angle_step", 0.0)))


def _random_angle_jitter_deg(runtime_params: dict[str, Any]) -> float:
    return max(0.0, float(runtime_params.get("random_angle_jitter_deg", 0.0)))


def _damage_reason_key(skill: FinalSkillInstance) -> str:
    skill_id = skill.skill_package_id or skill.skill_template_id
    if "ice_shards" in skill_id:
        return "skill_event.ice_shards.damage_reason"
    if "fire_bolt" in skill_id:
        return "skill_event.fire_bolt.damage_reason"
    return f"skill_event.{skill_id}.damage_reason"


def _spread_directions(
    direction: dict[str, float],
    projectile_count: int,
    spread_angle_deg: float,
    angle_step_deg: float = 0.0,
) -> tuple[dict[str, float], ...]:
    spread_angles = _spread_angles(projectile_count, spread_angle_deg, angle_step_deg)
    return tuple(
        _rotate_direction(direction, spread_angle) if spread_angle else dict(direction)
        for spread_angle in spread_angles
    )


def _spread_angles(projectile_count: int, spread_angle_deg: float, angle_step_deg: float = 0.0) -> tuple[float, ...]:
    count = max(1, projectile_count)
    if count == 1 or spread_angle_deg <= 0:
        return tuple(0.0 for _ in range(count))
    center = (count - 1) / 2
    if angle_step_deg > 0:
        maximum_step = spread_angle_deg / max(1, count - 1)
        step = min(angle_step_deg, maximum_step)
        return tuple((index - center) * step for index in range(count))
    return tuple(
        ((index - center) / max(1, count - 1)) * spread_angle_deg
        for index in range(count)
    )


def _rotate_direction(direction: dict[str, float], angle_deg: float) -> dict[str, float]:
    radians = angle_deg * pi / 180
    cosine = cos(radians)
    sine = sin(radians)
    return {
        "x": direction["x"] * cosine - direction["y"] * sine,
        "y": direction["x"] * sine + direction["y"] * cosine,
    }


def _damage_text(amount: float, damage_type: str) -> str:
    damage_type_text = {
        "fire": "火焰",
        "cold": "冰霜",
        "lightning": "闪电",
        "physical": "物理",
        "chaos": "混沌",
    }.get(damage_type, "技能")
    return f"{round(amount)}点{damage_type_text}伤害"
