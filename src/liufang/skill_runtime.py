from __future__ import annotations

from dataclasses import dataclass, field
from math import atan2, cos, hypot, pi, sin
from typing import Any

from .skill_effects import FinalSkillInstance


SKILL_EVENT_TYPES = frozenset(
    {
        "cast_start",
        "projectile_spawn",
        "projectile_hit",
        "projectile_impact",
        "chain_segment",
        "area_spawn",
        "melee_arc",
        "damage_zone_prime",
        "damage_zone",
        "orbit_spawn",
        "orbit_tick",
        "delayed_area_prime",
        "delayed_area_explode",
        "damage",
        "hit_vfx",
        "floating_text",
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
    ) -> tuple[SkillEvent, ...]:
        if not skill.uses_skill_event_pipeline:
            raise SkillRuntimeError("skill does not use the SkillEvent pipeline")
        if skill.behavior_template not in {"projectile", "chain", "player_nova", "melee_arc", "damage_zone", "module_chain"}:
            raise SkillRuntimeError(f"unsupported behavior template: {skill.behavior_template}")
        if skill.behavior_template == "module_chain":
            targets = tuple(_runtime_targets(target_entities)) if target_entities is not None else (
                _RuntimeTarget(target_entity, _position_dict(target_position)),
            )
            return self._module_chain_events(
                skill,
                source_entity=source_entity,
                source_position=_position_dict(source_position),
                targets=targets,
                timestamp_ms=timestamp_ms,
            )
        if skill.behavior_template == "chain":
            targets = tuple(_runtime_targets(target_entities)) if target_entities is not None else (
                _RuntimeTarget(target_entity, _position_dict(target_position)),
            )
            return self._chain_events(
                skill,
                source_entity=source_entity,
                source_position=_position_dict(source_position),
                targets=targets,
                timestamp_ms=timestamp_ms,
            )
        if skill.behavior_template == "damage_zone":
            targets = tuple(_runtime_targets(target_entities)) if target_entities is not None else (
                _RuntimeTarget(target_entity, _position_dict(target_position)),
            )
            return self._damage_zone_events(
                skill,
                source_entity=source_entity,
                source_position=_position_dict(source_position),
                targets=targets,
                timestamp_ms=timestamp_ms,
            )
        if skill.behavior_template == "melee_arc":
            targets = tuple(_runtime_targets(target_entities)) if target_entities is not None else (
                _RuntimeTarget(target_entity, _position_dict(target_position)),
            )
            return self._melee_arc_events(
                skill,
                source_entity=source_entity,
                source_position=_position_dict(source_position),
                targets=targets,
                timestamp_ms=timestamp_ms,
            )
        if skill.behavior_template == "player_nova":
            targets = tuple(_runtime_targets(target_entities)) if target_entities is not None else (
                _RuntimeTarget(target_entity, _position_dict(target_position)),
            )
            return self._player_nova_events(
                skill,
                source_entity=source_entity,
                source_position=_position_dict(source_position),
                targets=targets,
                timestamp_ms=timestamp_ms,
            )
        if target_entities is not None:
            targets = tuple(_runtime_targets(target_entities))
            if targets:
                return self._projectile_multi_target_events(
                    skill,
                    source_entity=source_entity,
                    source_position=_position_dict(source_position),
                    targets=targets,
                    timestamp_ms=timestamp_ms,
                )
        return self._projectile_events(
            skill,
            source_entity=source_entity,
            source_position=_position_dict(source_position),
            target_entity=target_entity,
            target_position=_position_dict(target_position),
            timestamp_ms=timestamp_ms,
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
        center_policy = str(runtime_params.get("center_policy", "player_center"))
        damage_falloff = str(runtime_params.get("damage_falloff_by_distance", "none"))
        status_chance_scale = max(0.0, float(runtime_params.get("status_chance_scale", 1.0)))
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
                },
            ),
        ]
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
            }
            for event_type, amount, duration, vfx, reason, position in (
                ("damage", damage_amount, 0, hit_vfx_key, reason_key, target.position),
                ("hit_vfx", None, 420, hit_vfx_key, reason_key, target.position),
                ("floating_text", damage_amount, 800, hit_vfx_key, floating_key, {"x": target.position["x"], "y": target.position["y"] - 28.0}),
            ):
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
        projectile_params = _module_params(projectile_module)
        zone_params = _module_params(damage_zone_module)
        trigger_params = _module_trigger(damage_zone_module)

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
        projectile_id = _projectile_id(skill, timestamp_ms, 1)
        zone_id = f"{skill.active_gem_instance_id}.{timestamp_ms}.damage_zone.1"
        damage_delay_ms = travel_time_ms + trigger_delay_ms
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
            "shape": "circle",
            "origin": dict(impact_position),
            "origin_world_position": dict(impact_position),
            "origin_policy": "trigger_position",
            "trigger_marker_id": trigger_marker_id,
            "delay_ms": trigger_delay_ms,
            "radius": radius,
            "ring_width": float(zone_params.get("ring_width", 48.0)),
            "hit_at_ms": hit_at_ms,
            "max_targets": max_targets,
            "damage_type": skill.damage_type,
            "vfx_key": vfx_key,
            "zone_vfx_key": vfx_key,
            "hit_target_count": len(hit_targets),
        }
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
                timestamp_ms=timestamp_ms + damage_delay_ms,
                source_entity=source_entity,
                target_entity=primary_target.entity_id,
                position=impact_position,
                direction={"x": 0.0, "y": 0.0},
                delay_ms=damage_delay_ms,
                duration_ms=max(180, trigger_delay_ms),
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
        floating_text = _damage_text(damage_amount, skill.damage_type)
        if hit_targets:
            events.append(
                SkillEvent(
                    event_id=_event_id(skill, timestamp_ms, next_index, "hit_vfx"),
                    type="hit_vfx",
                    timestamp_ms=timestamp_ms + damage_delay_ms,
                    source_entity=source_entity,
                    target_entity=primary_target.entity_id,
                    position=dict(impact_position),
                    direction={"x": 0.0, "y": 0.0},
                    delay_ms=damage_delay_ms,
                    duration_ms=420,
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
            hit_payload = {
                **zone_payload,
                **target_payload,
                "target_world_position": dict(target.position),
                "hit_world_position": dict(target.position),
                "skill_name": skill.skill_package_id or skill.skill_template_id,
            }
            for event_type, amount, duration, event_vfx, event_reason, position in (
                ("damage", damage_amount, 0, hit_vfx_key, reason_key, target.position),
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
                    "delay_ms": trigger_delay_ms,
                    "radius": radius,
                    "ring_width": float(zone_params.get("ring_width", 28.0)),
                    "hit_at_ms": hit_at_ms,
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
                        duration_ms=max(180, hit_at_ms),
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
                if hit_targets:
                    events.append(
                        SkillEvent(
                            event_id=_event_id(skill, timestamp_ms, next_index, "hit_vfx"),
                            type="hit_vfx",
                            timestamp_ms=timestamp_ms + damage_delay_ms,
                            source_entity=source_entity,
                            target_entity=primary_target.entity_id,
                            position=dict(orb_position),
                            direction={"x": 0.0, "y": 0.0},
                            delay_ms=damage_delay_ms,
                            duration_ms=420,
                            amount=None,
                            damage_type=skill.damage_type,
                            skill_instance_id=skill.active_gem_instance_id,
                            vfx_key=hit_vfx_key,
                            sfx_key=sfx_key,
                            reason_key=reason_key,
                            payload={**zone_payload, "hit_world_position": dict(orb_position), "skill_name": skill.skill_package_id or skill.skill_template_id},
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
            "hit_target_count": len(hit_targets),
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
        for target, target_distance, target_angle in hit_targets:
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
        return _sorted_events(events)

    def _damage_zone_events(
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
        shape = str(runtime_params.get("shape", "circle"))
        origin_policy = str(runtime_params.get("origin_policy", "caster"))
        facing_policy = str(runtime_params.get("facing_policy", "none" if shape == "circle" else "nearest_target"))
        hit_at_ms = max(0, int(runtime_params.get("hit_at_ms", skill.hit.get("hit_delay_ms", 0) if skill.hit else 0)))
        max_targets = max(1, int(runtime_params.get("max_targets", len(targets) or 1)))
        status_chance_scale = max(0.0, float(runtime_params.get("status_chance_scale", 1.0)))
        expand_duration_ms = max(0, int(runtime_params.get("expand_duration_ms", hit_at_ms)))
        ring_width = max(1.0, float(runtime_params.get("ring_width", 48.0)))
        nearest_target = _nearest_target(origin, targets)
        primary_target = nearest_target or _RuntimeTarget("", origin)
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
        damage_amount = skill.final_damage
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
        duration_ms = max(hit_at_ms, expand_duration_ms if shape == "circle" else 0)
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
            "max_targets": max_targets,
            "damage_type": skill.damage_type,
            "vfx_key": vfx_key,
            "zone_vfx_key": vfx_key,
            "status_chance_scale": status_chance_scale,
            "hit_target_count": len(hit_targets),
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
                payload={"skill_id": skill.skill_package_id or skill.skill_template_id, "origin_policy": origin_policy, "facing_policy": facing_policy},
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
        for target, target_payload in hit_targets:
            target_direction = _direction(origin, target.position)
            hit_payload = {
                **base_payload,
                **target_payload,
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
        damage_amount = skill.final_damage
        max_distance = max(1.0, float(runtime_params.get("max_distance", 520.0)))
        pierce_count = max(0, int(runtime_params.get("pierce_count", 0)))
        hit_policy = str(runtime_params.get("hit_policy", "first_hit"))
        visual_distance = max_distance if pierce_count > 0 else 0.0
        spawn_position = _spawn_position(source_position, runtime_params)
        distance = hypot(target_position["x"] - spawn_position["x"], target_position["y"] - spawn_position["y"])
        visual_distance = visual_distance or distance
        duration_ms = _duration_ms(visual_distance, projectile_speed, min_duration_ms, max_duration_ms)
        impact_duration_ms = _duration_ms(distance, projectile_speed, min_duration_ms, max_duration_ms)
        direction = _direction(spawn_position, target_position)
        vfx_key = presentation.get("projectile_vfx_key", presentation.get("vfx", skill.visual_effect))
        hit_vfx_key = presentation.get("hit_vfx_key", presentation.get("vfx", vfx_key))
        sfx_key = presentation.get("sfx", "")
        floating_key = presentation.get("floating_text", "skill_event.fire_bolt.floating_text")
        reason_key = _damage_reason_key(skill)
        floating_text = _damage_text(damage_amount, skill.damage_type)

        spread_angles = _spread_angles(projectile_count, spread_angle_deg, angle_step_deg)
        directions = tuple(
            _rotate_direction(direction, spread_angle) if spread_angle else dict(direction)
            for spread_angle in spread_angles
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
                    "end_position": _projectile_end_position(spawn_position, projectile_direction, visual_distance),
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
                    "lifetime_ms": duration_ms,
                    "expire_time_ms": timestamp_ms + index * burst_interval_ms + duration_ms,
                    "expire_world_position": _projectile_end_position(spawn_position, projectile_direction, visual_distance),
                    "local_spread_angle": spread_angles[index],
                    "fan_angle": spread_angle_deg,
                    "burst_interval_ms": burst_interval_ms,
                    "spread_angle_deg": spread_angle_deg,
                    "angle_step": angle_step_deg,
                    "projectile_radius": runtime_params.get("projectile_radius", 0),
                    "impact_radius": runtime_params.get("impact_radius", 0),
                },
            )
            for index, projectile_direction in enumerate(directions)
            ],
        ]
        for index, projectile_direction in enumerate(directions):
            projectile_delay_ms = index * burst_interval_ms
            impact_delay_ms = projectile_delay_ms + impact_duration_ms
            impact_position = _projectile_end_position(spawn_position, projectile_direction, distance)
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
                "lifetime_ms": duration_ms,
                "expire_time_ms": timestamp_ms + projectile_delay_ms + duration_ms,
                "expire_world_position": _projectile_end_position(spawn_position, projectile_direction, visual_distance),
                "projectile_continues": pierce_count > 0,
                "impact_kind": "projectile_hit_continue" if pierce_count > 0 else "projectile_final_impact",
                "local_spread_angle": spread_angles[index],
                "fan_angle": spread_angle_deg,
                "hit_policy": hit_policy,
                "pierce_count": pierce_count,
            }
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
                        damage_type=skill.damage_type,
                        skill_instance_id=skill.active_gem_instance_id,
                        vfx_key=hit_vfx_key,
                        sfx_key=sfx_key,
                        reason_key=reason_key,
                        payload=projectile_payload,
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
                        amount=damage_amount,
                        damage_type=skill.damage_type,
                        skill_instance_id=skill.active_gem_instance_id,
                        vfx_key=hit_vfx_key,
                        sfx_key=sfx_key,
                        reason_key=reason_key,
                        payload=projectile_payload,
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
                        damage_type=skill.damage_type,
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
                        position=impact_position,
                        direction=projectile_direction,
                        delay_ms=impact_delay_ms,
                        duration_ms=800,
                        amount=damage_amount,
                        damage_type=skill.damage_type,
                        skill_instance_id=skill.active_gem_instance_id,
                        vfx_key=hit_vfx_key,
                        sfx_key=sfx_key,
                        reason_key=floating_key,
                        payload={**projectile_payload, "text": floating_text},
                    ),
                ]
            )
        return _sorted_events(events)

    def _projectile_multi_target_events(
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
        projectile_speed = max(1.0, float(runtime_params.get("projectile_speed", 720.0)))
        min_duration_ms = int(runtime_params.get("min_duration_ms", 0))
        max_duration_ms = _optional_int(runtime_params.get("max_duration_ms"))
        projectile_count = max(1, int(runtime_params.get("projectile_count", skill.projectile_count)))
        burst_interval_ms = max(0, int(runtime_params.get("burst_interval_ms", 0)))
        spread_angle_deg = _spread_angle_deg(runtime_params, skill.behavior_template)
        angle_step_deg = _angle_step_deg(runtime_params, skill.behavior_template)
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
        max_hits_per_projectile = pierce_count + 1 if pierce_count > 0 else 1
        visual_distance = max_distance if pierce_count > 0 else 0.0
        spawn_position = _spawn_position(source_position, runtime_params)
        primary_target = min(
            targets,
            key=lambda target: hypot(target.position["x"] - spawn_position["x"], target.position["y"] - spawn_position["y"]),
        )
        primary_distance = min(
            max_distance,
            hypot(primary_target.position["x"] - spawn_position["x"], primary_target.position["y"] - spawn_position["y"]),
        )
        visual_distance = visual_distance or primary_distance
        duration_ms = _duration_ms(visual_distance, projectile_speed, min_duration_ms, max_duration_ms)
        direction = _direction(spawn_position, primary_target.position)
        spread_angles = _spread_angles(projectile_count, spread_angle_deg, angle_step_deg)
        directions = tuple(
            _rotate_direction(direction, spread_angle) if spread_angle else dict(direction)
            for spread_angle in spread_angles
        )
        vfx_key = presentation.get("projectile_vfx_key", presentation.get("vfx", skill.visual_effect))
        hit_vfx_key = presentation.get("hit_vfx_key", presentation.get("vfx", vfx_key))
        sfx_key = presentation.get("sfx", "")
        floating_key = presentation.get("floating_text", "skill_event.fire_bolt.floating_text")
        reason_key = _damage_reason_key(skill)
        floating_text = _damage_text(damage_amount, skill.damage_type)
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
            projectile_delay_ms = (projectile_index - 1) * burst_interval_ms
            events.append(
                SkillEvent(
                    event_id=_event_id(skill, timestamp_ms, next_index, "projectile_spawn"),
                    type="projectile_spawn",
                    timestamp_ms=timestamp_ms + projectile_delay_ms,
                    source_entity=source_entity,
                    target_entity=primary_target.entity_id,
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
                        "end_position": {
                            "x": spawn_position["x"] + projectile_direction["x"] * visual_distance,
                            "y": spawn_position["y"] + projectile_direction["y"] * visual_distance,
                        },
                        "spawn_world_position": dict(spawn_position),
                        "target_world_position": dict(primary_target.position),
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
                        "lifetime_ms": duration_ms,
                        "expire_time_ms": timestamp_ms + projectile_delay_ms + duration_ms,
                        "expire_world_position": {
                            "x": spawn_position["x"] + projectile_direction["x"] * visual_distance,
                            "y": spawn_position["y"] + projectile_direction["y"] * visual_distance,
                        },
                        "local_spread_angle": spread_angles[projectile_index - 1],
                        "fan_angle": spread_angle_deg,
                        "burst_interval_ms": burst_interval_ms,
                        "spread_angle_deg": spread_angle_deg,
                        "angle_step": angle_step_deg,
                        "projectile_radius": runtime_params.get("projectile_radius", 0),
                        "impact_radius": runtime_params.get("impact_radius", 0),
                    },
                )
            )
            next_index += 1

        for projectile_index, projectile_direction in enumerate(directions, start=1):
            projectile_delay_ms = (projectile_index - 1) * burst_interval_ms
            projectile_hits = _projectile_hit_targets(
                spawn_position,
                projectile_direction,
                targets,
                max_distance=max_distance,
                collision_radius=collision_radius,
                max_hits=max_hits_per_projectile,
            )
            for hit_order, (target, forward) in enumerate(projectile_hits):
                impact_duration_ms = _duration_ms(forward, projectile_speed, min_duration_ms, max_duration_ms)
                impact_delay_ms = projectile_delay_ms + impact_duration_ms
                impact_position = _projectile_end_position(spawn_position, projectile_direction, forward)
                pierce_remaining = max(0, max_hits_per_projectile - hit_order - 1)
                projectile_continues = pierce_remaining > 0
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
                    "lifetime_ms": duration_ms,
                    "expire_time_ms": timestamp_ms + projectile_delay_ms + duration_ms,
                    "expire_world_position": {
                        "x": spawn_position["x"] + projectile_direction["x"] * visual_distance,
                        "y": spawn_position["y"] + projectile_direction["y"] * visual_distance,
                    },
                    "projectile_continues": projectile_continues,
                    "impact_kind": "projectile_hit_continue" if projectile_continues else "projectile_final_impact",
                    "local_spread_angle": spread_angles[projectile_index - 1],
                    "fan_angle": spread_angle_deg,
                    "hit_policy": hit_policy,
                    "pierce_count": pierce_count,
                }
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
                            damage_type=skill.damage_type,
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
                            amount=damage_amount,
                            damage_type=skill.damage_type,
                            skill_instance_id=skill.active_gem_instance_id,
                            vfx_key=hit_vfx_key,
                            sfx_key=sfx_key,
                            reason_key=reason_key,
                            payload=projectile_payload,
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
                            damage_type=skill.damage_type,
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
                            position=impact_position,
                            direction=projectile_direction,
                            delay_ms=impact_delay_ms,
                            duration_ms=800,
                            amount=damage_amount,
                            damage_type=skill.damage_type,
                            skill_instance_id=skill.active_gem_instance_id,
                            vfx_key=hit_vfx_key,
                            sfx_key=sfx_key,
                            reason_key=floating_key,
                            payload={**projectile_payload, "text": floating_text},
                        ),
                    ]
                )
                next_index += 4
        return _sorted_events(events)


def _event_id(skill: FinalSkillInstance, timestamp_ms: int, index: int, event_type: str) -> str:
    return f"{skill.active_gem_instance_id}.{timestamp_ms}.{index}.{event_type}"


def _sorted_events(events: list[SkillEvent]) -> tuple[SkillEvent, ...]:
    return tuple(sorted(events, key=lambda event: (event.timestamp_ms, _runtime_event_sort_order(event.type), event.event_id)))


def _runtime_event_sort_order(event_type: str) -> int:
    return {
        "cast_start": 0,
        "area_spawn": 1,
        "chain_segment": 1,
        "melee_arc": 1,
        "orbit_spawn": 1,
        "damage_zone": 1,
        "projectile_spawn": 1,
        "orbit_tick": 2,
        "projectile_impact": 2,
        "damage_zone_prime": 3,
        "projectile_hit": 4,
        "damage": 5,
        "hit_vfx": 6,
        "floating_text": 7,
        "cooldown_update": 8,
    }.get(event_type, 99)


def _projectile_id(skill: FinalSkillInstance, timestamp_ms: int, projectile_index: int) -> str:
    return f"{skill.active_gem_instance_id}.{timestamp_ms}.projectile.{projectile_index}"


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
) -> dict[str, float]:
    angle_deg = start_angle_deg + speed_deg_per_sec * (timestamp_ms / 1000.0)
    angle_rad = angle_deg * pi / 180.0
    return {
        "x": center["x"] + cos(angle_rad) * radius,
        "y": center["y"] + sin(angle_rad) * radius,
    }


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
        if forward < 0 or forward > max_distance:
            continue
        candidates.append((target, forward, perpendicular))
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
