from __future__ import annotations

import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from liufang.web_api import V1WebAppApi


def test_webapp_runtime_events_use_canonical_skill_runtime_for_blizzard() -> None:
    api = V1WebAppApi(ROOT / "configs")
    blizzard = api.inventory.filter_instances(base_gem_id="active_blizzard")[0]
    api.mount(blizzard.instance_id, 0, 0)

    result = api.runtime_skill_events(
        {
            "skill_instance_id": blizzard.instance_id,
            "source_entity": "player",
            "source_position": {"x": 0, "y": 0},
            "timestamp_ms": 100,
            "target_entities": [
                {"entity_id": "3", "position": {"x": 160, "y": 0}},
                {"entity_id": "1", "position": {"x": 100, "y": 0}},
                {"entity_id": "4", "position": {"x": 900, "y": 0}},
                {"entity_id": "2", "position": {"x": 130, "y": 0}},
            ],
        }
    )

    assert result["ok"] is True
    events = result["events"]
    markers = [event for event in events if event["type"] == "damage_zone_hit"]
    zones = [event for event in events if event["type"] == "damage_zone"]
    assert len(markers) == 3
    assert len(zones) == 3
    assert {event["payload"]["wave_index"] for event in zones} == {1, 2, 3}
    assert [event["target_entity"] for event in markers] == ["1", "2", "3"]
    assert {event["payload"]["target_lock_policy"] for event in zones} == {"nearest_unique_enemy"}
    assert "4" not in {event["target_entity"] for event in markers}


def test_runtime_events_accept_unique_skill_package_id_fallback() -> None:
    api = V1WebAppApi(ROOT / "configs")
    ice_shot = api.inventory.filter_instances(base_gem_id="active_ice_shot")[0]
    api.mount(ice_shot.instance_id, 0, 0)

    result = api.runtime_skill_events(
        {
            "skill_instance_id": "active_ice_shot",
            "source_entity": "player",
            "source_position": {"x": 0, "y": 0},
            "timestamp_ms": 100,
            "target_entities": [
                {"entity_id": "1", "position": {"x": 100, "y": 0}},
            ],
        }
    )

    assert result["ok"] is True
    assert result["events"]
    assert {event["skill_instance_id"] for event in result["events"]} == {ice_shot.instance_id}


def test_webapp_runtime_events_pass_channel_context_to_whirlwind_runtime() -> None:
    api = V1WebAppApi(ROOT / "configs")
    whirlwind = api.inventory.filter_instances(base_gem_id="active_whirlwind")[0]
    api.mount(whirlwind.instance_id, 0, 0)

    result = api.runtime_skill_events(
        {
            "skill_instance_id": whirlwind.instance_id,
            "source_entity": "player",
            "source_position": {"x": 0, "y": 0},
            "timestamp_ms": 5000,
            "runtime_context": {"channel_stack": 4, "channel_elapsed_ms": 2000},
            "target_entities": [
                {"entity_id": "1", "position": {"x": 80, "y": 0}},
                {"entity_id": "2", "position": {"x": 140, "y": 0}},
            ],
        }
    )

    assert result["ok"] is True
    tick_zone = next(event for event in result["events"] if event["type"] == "damage_zone")
    assert tick_zone["payload"]["channel_stack"] == 5
    assert tick_zone["payload"]["channel_full_reached"] is True
    assert tick_zone["payload"]["next_channel_stack"] == 0


def test_black_hole_runtime_emits_area_pull_ticks_for_late_entrants() -> None:
    api = V1WebAppApi(ROOT / "configs")
    black_hole = api.inventory.filter_instances(base_gem_id="active_black_hole")[0]
    api.mount(black_hole.instance_id, 0, 0)

    result = api.runtime_skill_events(
        {
            "skill_instance_id": black_hole.instance_id,
            "source_entity": "player",
            "source_position": {"x": 0, "y": 0},
            "target_position": {"x": 100, "y": 0},
            "timestamp_ms": 100,
            "target_entities": [
                {"entity_id": "1", "position": {"x": 100, "y": 0}},
                {"entity_id": "2", "position": {"x": 130, "y": 0}},
                {"entity_id": "3", "position": {"x": 160, "y": 0}},
            ],
        }
    )

    assert result["ok"] is True
    events = result["events"]
    pulls = [event for event in events if event["type"] == "forced_movement"]
    assert len(pulls) == 40
    assert {event["target_entity"] for event in pulls} == {""}
    assert {event["payload"]["movement_scope"] for event in pulls} == {"damage_zone"}
    assert {event["payload"]["movement_policy"] for event in pulls} == {"pull_to_origin"}


def test_all_seeded_active_skills_emit_canonical_runtime_events() -> None:
    api = V1WebAppApi(ROOT / "configs")
    active_gem_ids = [
        instance.base_gem_id
        for instance in api.inventory.all_instances()
        if instance.gem_kind == "active_skill"
    ]

    assert active_gem_ids

    for base_gem_id in active_gem_ids:
        api = V1WebAppApi(ROOT / "configs")
        instance = api.inventory.filter_instances(base_gem_id=base_gem_id)[0]
        api.mount(instance.instance_id, 0, 0)

        result = api.runtime_skill_events(
            {
                "skill_instance_id": instance.instance_id,
                "source_entity": "player_1",
                "source_position": {"x": 600, "y": 500},
                "timestamp_ms": 1000,
                "target_entities": [
                    {"entity_id": "m1", "position": {"x": 680, "y": 500}},
                    {"entity_id": "m2", "position": {"x": 720, "y": 520}},
                    {"entity_id": "m3", "position": {"x": 760, "y": 540}},
                ],
            }
        )

        assert result["ok"] is True, base_gem_id
        assert result["events"], base_gem_id
