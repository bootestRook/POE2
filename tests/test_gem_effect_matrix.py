from __future__ import annotations

import json
import random
import sys
from dataclasses import replace
from pathlib import Path
from typing import Any

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT))

from liufang.affixes import AffixGenerator
from liufang.combat import CombatSession, Monster, Player, Position
from liufang.config import (
    GemDefinition,
    SupportBaseModifier,
    load_affix_definitions,
    load_board_rules,
    load_gem_definitions,
    load_rarity_affix_counts,
    load_relation_coefficients,
    load_skill_scaling_rules,
    load_skill_templates,
)
from liufang.gem_board import SudokuGemBoard
from liufang.inventory import GemInventory
from liufang.loot import LootRuntime
from liufang.skill_effects import AppliedModifier, FinalSkillInstance, SkillEffectCalculator, SkillEffectError
from liufang.skill_runtime import SkillRuntime
from liufang.web_api import V1WebAppApi
from tools import run_skill_test_arena


CONFIG_ROOT = ROOT / "configs"
CONDUIT_POSITIONS = {
    "support_row_conduit": (0, 3),
    "support_column_conduit": (3, 0),
    "support_box_conduit": (1, 1),
}
PASSIVE_CONDUIT_POSITIONS = {
    "support_row_conduit": (3, 3),
    "support_column_conduit": (6, 0),
    "support_box_conduit": (4, 1),
}
LEVEL_TRACE_STATS = frozenset({"active_gem_level_add", "passive_gem_level_add"})


@pytest.fixture(scope="module")
def definitions() -> dict[str, GemDefinition]:
    return load_gem_definitions(CONFIG_ROOT)


@pytest.fixture(scope="module")
def support_modifiers() -> dict[str, tuple[SupportBaseModifier, ...]]:
    grouped: dict[str, list[SupportBaseModifier]] = {}
    for modifier in load_skill_scaling_rules(CONFIG_ROOT).support_base_modifiers:
        grouped.setdefault(modifier.support_id, []).append(modifier)
    return {support_id: tuple(items) for support_id, items in grouped.items()}


def _by_kind(definitions: dict[str, GemDefinition], kind: str) -> list[GemDefinition]:
    return sorted(
        (definition for definition in definitions.values() if definition.gem_kind == kind),
        key=lambda definition: definition.base_gem_id,
    )


def _support_matches_target(support: GemDefinition, target: GemDefinition) -> bool:
    if support.apply_filter_target_kinds and target.gem_kind not in support.apply_filter_target_kinds:
        return False
    if support.apply_filter_tags_any and not (support.apply_filter_tags_any & target.tags):
        return False
    if support.apply_filter_tags_all and not support.apply_filter_tags_all.issubset(target.tags):
        return False
    if support.apply_filter_tags_none and support.apply_filter_tags_none & target.tags:
        return False
    return True


def _calculator(definitions: dict[str, GemDefinition]) -> tuple[GemInventory, SudokuGemBoard, SkillEffectCalculator]:
    inventory = GemInventory(definitions)
    board = SudokuGemBoard(load_board_rules(CONFIG_ROOT), inventory)
    calculator = SkillEffectCalculator(
        board=board,
        definitions=definitions,
        skill_templates=load_skill_templates(CONFIG_ROOT),
        relation_coefficients=load_relation_coefficients(CONFIG_ROOT),
        scaling_rules=load_skill_scaling_rules(CONFIG_ROOT),
        affix_definitions={},
    )
    return inventory, board, calculator


def _active_skill(
    definitions: dict[str, GemDefinition],
    active_id: str,
    support_id: str | None = None,
) -> FinalSkillInstance:
    inventory, board, calculator = _calculator(definitions)
    active = inventory.add_instance("active", active_id, level=20)
    board.mount_gem("active", 0, 0)
    if support_id is not None:
        inventory.add_instance("support", support_id, level=20)
        board.mount_gem("support", *CONDUIT_POSITIONS.get(support_id, (0, 1)))
    return calculator.calculate_for_active(active)


def _active_passive_skill(
    definitions: dict[str, GemDefinition],
    active_id: str,
    passive_id: str,
    support_id: str | None = None,
) -> tuple[FinalSkillInstance, SkillEffectCalculator]:
    inventory, board, calculator = _calculator(definitions)
    inventory.add_instance("active", active_id, level=20)
    inventory.add_instance("passive", passive_id, level=20)
    board.mount_gem("active", 0, 0)
    board.mount_gem("passive", 3, 0)
    if support_id is not None:
        inventory.add_instance("support", support_id, level=20)
        board.mount_gem("support", *PASSIVE_CONDUIT_POSITIONS.get(support_id, (3, 1)))
    return calculator.calculate_all()[0], calculator


def _active_for_passive(definitions: dict[str, GemDefinition], passive: GemDefinition) -> str:
    for active in _by_kind(definitions, "active_skill"):
        if _support_matches_target(passive, active):
            return active.base_gem_id
    raise AssertionError(f"no active target matches passive {passive.base_gem_id}")


def _applied_from(skill: FinalSkillInstance, source_base_gem_id: str) -> tuple[AppliedModifier, ...]:
    return tuple(
        modifier
        for modifier in skill.applied_modifiers
        if modifier.source_base_gem_id == source_base_gem_id and modifier.applied
    )


def _support_to_passive_from(skill: FinalSkillInstance, support_id: str, passive_id: str) -> tuple[AppliedModifier, ...]:
    return tuple(
        modifier
        for modifier in skill.applied_modifiers
        if modifier.source_base_gem_id == support_id
        and modifier.target_base_gem_id == passive_id
        and modifier.applied
    )


def _support_stats(support_modifiers: dict[str, tuple[SupportBaseModifier, ...]], support_id: str) -> set[str]:
    return {modifier.stat for modifier in support_modifiers.get(support_id, ())}


def _passive_stats(passive: GemDefinition) -> set[str]:
    return {effect.stat for effect in passive.passive_effects}


def _is_conduit(support: GemDefinition) -> bool:
    return "support_conduit" in support.tags


def _projected_skill_stats(skill: FinalSkillInstance) -> dict[str, Any]:
    return {
        key: value
        for key, value in skill.skill_stats.items()
        if key not in LEVEL_TRACE_STATS
    }


def _projection(skill: FinalSkillInstance) -> str:
    return json.dumps(
        {
            "final_damage": skill.final_damage,
            "expected_hit_damage": skill.expected_hit_damage,
            "crit_chance": skill.crit_chance,
            "crit_multiplier": skill.crit_multiplier,
            "final_cooldown_ms": skill.final_cooldown_ms,
            "actual_interval_ms": skill.actual_interval_ms,
            "projectile_count": skill.projectile_count,
            "area_multiplier": skill.area_multiplier,
            "speed_multiplier": skill.speed_multiplier,
            "runtime_params": skill.runtime_params,
            "skill_stats": _projected_skill_stats(skill),
            "base_damage_components": skill.base_damage_components,
            "final_damage_components": skill.final_damage_components,
            "converted_damage_components": skill.converted_damage_components,
            "damage_conversions": skill.damage_conversions,
            "ailments": skill.ailments,
            "shape_effects": skill.shape_effects,
        },
        sort_keys=True,
        default=str,
    )


def _diag(support_id: str, target_id: str, final_skill: FinalSkillInstance, expected: str) -> str:
    observed = [
        {
            "source": modifier.source_base_gem_id,
            "target": modifier.target_base_gem_id,
            "stat": modifier.stat,
            "reason": modifier.reason_key,
            "applied": modifier.applied,
        }
        for modifier in final_skill.applied_modifiers
    ]
    return f"support={support_id} target={target_id} expected={expected} observed={observed}"


def test_matrix_enumerates_current_loaded_gem_definitions(definitions: dict[str, GemDefinition]) -> None:
    support_definitions = _by_kind(definitions, "support")
    assert len(_by_kind(definitions, "active_skill")) == 16
    assert len(_by_kind(definitions, "passive_skill")) == 9
    assert support_definitions
    assert all("active_skill_gem" in definition.tags for definition in _by_kind(definitions, "active_skill"))
    assert all("passive_skill_gem" in definition.tags for definition in _by_kind(definitions, "passive_skill"))
    assert all("support_gem" in definition.tags for definition in support_definitions)


def test_support_filter_mismatches_do_not_apply_to_active_targets(
    definitions: dict[str, GemDefinition],
) -> None:
    checked = 0
    for support in _by_kind(definitions, "support"):
        for active in _by_kind(definitions, "active_skill"):
            if _support_matches_target(support, active):
                continue
            final_skill = _active_skill(definitions, active.base_gem_id, support.base_gem_id)
            assert not _applied_from(final_skill, support.base_gem_id), _diag(
                support.base_gem_id,
                active.base_gem_id,
                final_skill,
                "filter mismatch should not apply",
            )
            checked += 1

    assert checked > 0


def test_filter_matching_support_to_active_pairs_apply_or_are_expected_no_effects(
    definitions: dict[str, GemDefinition],
    support_modifiers: dict[str, tuple[SupportBaseModifier, ...]],
) -> None:
    checked = 0
    no_effect_pairs: list[tuple[str, str]] = []
    for support in _by_kind(definitions, "support"):
        for active in _by_kind(definitions, "active_skill"):
            if not _support_matches_target(support, active):
                continue
            baseline = _active_skill(definitions, active.base_gem_id)
            final_skill = _active_skill(definitions, active.base_gem_id, support.base_gem_id)
            applied = _applied_from(final_skill, support.base_gem_id)
            if _is_conduit(support):
                assert any(modifier.stat == "active_gem_level_add" for modifier in applied), _diag(
                    support.base_gem_id,
                    active.base_gem_id,
                    final_skill,
                    "conduit should apply active level modifier",
                )
            elif support_modifiers.get(support.base_gem_id):
                assert applied, _diag(
                    support.base_gem_id,
                    active.base_gem_id,
                    final_skill,
                    "matching support should apply base modifier",
                )
            else:
                assert not applied, _diag(
                    support.base_gem_id,
                    active.base_gem_id,
                    final_skill,
                    "unsupported sourced support should stay no-op",
                )

            if _projection(final_skill) == _projection(baseline):
                no_effect_pairs.append((support.base_gem_id, active.base_gem_id))
            checked += 1

    assert checked > 0
    assert no_effect_pairs


def test_added_damage_support_matrix_covers_hit_and_incompatible_targets(
    definitions: dict[str, GemDefinition],
) -> None:
    hit_skill = _active_skill(definitions, "active_sparkle", "support_added_fire_damage")
    added = next(
        modifier
        for modifier in hit_skill.applied_modifiers
        if modifier.source_base_gem_id == "support_added_fire_damage"
        and modifier.stat == "added_fire_damage"
    )
    assert hit_skill.base_damage_components["fire"] == added.value
    assert hit_skill.final_damage_components["fire"] == added.value

    dot_skill = _active_skill(definitions, "active_black_hole", "support_added_fire_damage")
    guard_skill = _active_skill(definitions, "active_stoneskin", "support_added_fire_damage")
    assert not _applied_from(dot_skill, "support_added_fire_damage")
    assert not _applied_from(guard_skill, "support_added_fire_damage")


def test_focused_active_support_families_change_expected_outputs(
    definitions: dict[str, GemDefinition],
) -> None:
    cases = [
        ("support_multiple_projectiles", "active_ice_shot", lambda before, after: after.projectile_count > before.projectile_count),
        ("support_jump", "active_chain_lightning", lambda before, after: after.runtime_params["chain_count"] > before.runtime_params["chain_count"]),
        ("support_increased_area", "active_ring_of_ice", lambda before, after: after.area_multiplier > before.area_multiplier),
        ("support_cooldown_reduction", "active_blizzard", lambda before, after: after.final_cooldown_ms < before.final_cooldown_ms),
        ("support_slow_projectile", "active_ice_shot", lambda before, after: after.runtime_params["projectile_speed"] != before.runtime_params["projectile_speed"]),
        ("support_critical_strike_rating_increase", "active_sparkle", lambda before, after: after.skill_stats["crit_rating"] > before.skill_stats.get("crit_rating", 0)),
        ("support_lightning_to_cold", "active_sparkle", lambda before, after: bool(after.damage_conversions)),
        ("support_additional_ignite", "active_burning_shot", lambda before, after: after.ailments[0].get("stacks", 1) > before.ailments[0].get("stacks", 1)),
        ("support_channel_preparation", "active_whirlwind", lambda before, after: after.runtime_params["channel_min_stacks"] > before.runtime_params["channel_min_stacks"]),
        ("support_melee_knockback", "active_flame_slash", lambda before, after: after.runtime_params["knockback_chance_percent"] > before.runtime_params.get("knockback_chance_percent", 0)),
        ("support_raging_slash", "active_whirlwind", lambda before, after: after.runtime_params["slash_chance_percent"] > before.runtime_params.get("slash_chance_percent", 0)),
    ]
    for support_id, active_id, assertion in cases:
        before = _active_skill(definitions, active_id)
        after = _active_skill(definitions, active_id, support_id)
        assert assertion(before, after), _diag(support_id, active_id, after, "focused support output change")


def test_support_to_passive_pairs_are_classified(
    definitions: dict[str, GemDefinition],
    support_modifiers: dict[str, tuple[SupportBaseModifier, ...]],
) -> None:
    compatible: list[tuple[str, str]] = []
    expected_noop: list[tuple[str, str]] = []
    mismatched = 0
    for support in _by_kind(definitions, "support"):
        for passive in _by_kind(definitions, "passive_skill"):
            stats_overlap = _support_stats(support_modifiers, support.base_gem_id) & _passive_stats(passive)
            if _support_matches_target(support, passive):
                if stats_overlap or _is_conduit(support):
                    compatible.append((support.base_gem_id, passive.base_gem_id))
                else:
                    expected_noop.append((support.base_gem_id, passive.base_gem_id))
            else:
                active_id = _active_for_passive(definitions, passive)
                try:
                    final_skill, _calculator_instance = _active_passive_skill(
                        definitions,
                        active_id,
                        passive.base_gem_id,
                        support.base_gem_id,
                    )
                except SkillEffectError as error:
                    if error.error_key == "skill_effect.error.invalid_board":
                        continue
                    raise
                assert not _support_to_passive_from(final_skill, support.base_gem_id, passive.base_gem_id), _diag(
                    support.base_gem_id,
                    passive.base_gem_id,
                    final_skill,
                    "passive filter mismatch should not apply",
                )
                mismatched += 1

    assert compatible
    assert expected_noop
    assert mismatched > 0


def test_compatible_support_to_passive_modifiers_apply_before_passive_aggregation(
    definitions: dict[str, GemDefinition],
) -> None:
    active_id = _active_for_passive(definitions, definitions["passive_fearless"])
    baseline, _baseline_calculator = _active_passive_skill(definitions, active_id, "passive_fearless")
    final_skill, _calculator_instance = _active_passive_skill(
        definitions,
        active_id,
        "passive_fearless",
        "support_critical_strike_rating_increase",
    )
    support_to_passive = _support_to_passive_from(
        final_skill,
        "support_critical_strike_rating_increase",
        "passive_fearless",
    )
    passive_to_active = [
        modifier
        for modifier in final_skill.applied_modifiers
        if modifier.source_base_gem_id == "passive_fearless"
        and modifier.reason_key == "modifier.passive_base"
        and modifier.applied
    ]

    assert support_to_passive
    assert passive_to_active
    assert final_skill.applied_modifiers.index(support_to_passive[0]) < final_skill.applied_modifiers.index(passive_to_active[0])
    assert final_skill.skill_stats["crit_rating"] > baseline.skill_stats.get("crit_rating", 0)


def test_supported_passive_effect_changes_player_stat_output(
    definitions: dict[str, GemDefinition],
) -> None:
    active_id = _active_for_passive(definitions, definitions["passive_energy_fortress"])
    baseline_skill, baseline_calculator = _active_passive_skill(definitions, active_id, "passive_energy_fortress")
    supported_skill, supported_calculator = _active_passive_skill(
        definitions,
        active_id,
        "passive_energy_fortress",
        "support_row_conduit",
    )

    baseline_stats = baseline_calculator.calculate_player_stat_modifiers()
    supported_stats = supported_calculator.calculate_player_stat_modifiers()
    baseline_energy = next(mod.value for mod in baseline_stats if mod.stat == "max_energy_shield")
    supported_energy = next(mod.value for mod in supported_stats if mod.stat == "max_energy_shield")

    assert _support_to_passive_from(supported_skill, "support_row_conduit", "passive_energy_fortress")
    assert supported_energy > baseline_energy


def test_filter_matching_but_stat_incompatible_passive_pairs_are_expected_no_effects(
    definitions: dict[str, GemDefinition],
    support_modifiers: dict[str, tuple[SupportBaseModifier, ...]],
) -> None:
    checked = 0
    for support in _by_kind(definitions, "support"):
        for passive in _by_kind(definitions, "passive_skill"):
            if not _support_matches_target(support, passive):
                continue
            if _is_conduit(support) or (_support_stats(support_modifiers, support.base_gem_id) & _passive_stats(passive)):
                continue
            active_id = _active_for_passive(definitions, passive)
            try:
                baseline, _baseline_calculator = _active_passive_skill(definitions, active_id, passive.base_gem_id)
                final_skill, _calculator_instance = _active_passive_skill(
                    definitions,
                    active_id,
                    passive.base_gem_id,
                    support.base_gem_id,
                )
            except SkillEffectError as error:
                if error.error_key == "skill_effect.error.invalid_board":
                    continue
                raise
            assert not _support_to_passive_from(final_skill, support.base_gem_id, passive.base_gem_id), _diag(
                support.base_gem_id,
                passive.base_gem_id,
                final_skill,
                "filter match without compatible passive stat should be no-op",
            )
            assert _projection(final_skill) == _projection(baseline), _diag(
                support.base_gem_id,
                passive.base_gem_id,
                final_skill,
                "passive no-op should not change downstream output",
            )
            checked += 1

    assert checked > 0


def test_behavior_supports_reach_skill_runtime_events(definitions: dict[str, GemDefinition]) -> None:
    split_skill = _active_skill(definitions, "active_burning_shot", "support_projectile_split")
    split_skill = replace(
        split_skill,
        runtime_params={**(split_skill.runtime_params or {}), "split_projectile_chance_percent": 100},
    )
    split_events = SkillRuntime().execute(
        split_skill,
        source_entity="player",
        source_position=Position(0, 0),
        target_entity="monster_1",
        target_position=Position(100, 0),
        timestamp_ms=1,
        target_entities=[
            {"entity_id": "monster_1", "position": {"x": 100, "y": 0}},
            {"entity_id": "monster_2", "position": {"x": 160, "y": 30}},
        ],
    )
    assert any(event.type == "projectile_spawn" and event.payload.get("split_projectile") for event in split_events)

    knockback_skill = _active_skill(definitions, "active_flame_slash", "support_melee_knockback")
    knockback_skill = replace(
        knockback_skill,
        runtime_params={**(knockback_skill.runtime_params or {}), "knockback_chance_percent": 100},
    )
    knockback_events = SkillRuntime().execute(
        knockback_skill,
        source_entity="player",
        source_position=Position(0, 0),
        target_entity="monster_1",
        target_position=Position(80, 0),
        timestamp_ms=1,
    )
    assert any(event.type == "forced_movement" for event in knockback_events)


def test_guard_support_changes_player_state_through_combat_session(
    definitions: dict[str, GemDefinition],
) -> None:
    inventory, board, calculator = _calculator(definitions)
    inventory.add_instance("active", "active_burning_shot", level=20)
    inventory.add_instance("support", "support_guard", level=20)
    board.mount_gem("active", 0, 0)
    board.mount_gem("support", 0, 1)
    affixes = load_affix_definitions(CONFIG_ROOT)
    loot_runtime = LootRuntime.from_configs(
        CONFIG_ROOT,
        definitions,
        {"normal": 1},
        AffixGenerator(affixes, load_rarity_affix_counts(CONFIG_ROOT), random.Random(1)),
        rng=random.Random(1),
    )
    player = Player(
        player_id="player_1",
        current_life=100,
        max_life=100,
        position=Position(0, 0),
        item_interaction_reach=2,
        current_mana=1000,
        max_mana=1000,
        mana_regen_flat=0,
    )
    session = CombatSession.start(
        player=player,
        monsters=[Monster("monster_1", current_life=10000, max_life=10000, position=Position(100, 0))],
        inventory=inventory,
        skill_effect_calculator=calculator,
        loot_runtime=loot_runtime,
    )

    trigger_count = session.active_skill_instances[0].runtime_params["guard_trigger_count"]
    for _ in range(trigger_count):
        session.tick(session.active_skill_instances[0].actual_interval_ms)

    guard_events = [
        event
        for event in session.skill_events
        if event.type == "buff_apply" and event.payload.get("buff_type") == "guard"
    ]
    assert guard_events
    assert player.has_buff("guard")
    assert player.buffs[0].remaining_amount == 150


def test_webapp_runtime_events_use_canonical_supported_skill_output() -> None:
    api = V1WebAppApi(CONFIG_ROOT)
    active = api.inventory.filter_instances(base_gem_id="active_ice_shot")[0]
    support = api.inventory.add_instance("matrix_support_multiple_projectiles", "support_multiple_projectiles", level=20)
    api.mount(active.instance_id, 0, 0)
    api.mount(support.instance_id, 0, 1)
    result = api.runtime_skill_events(
        {
            "skill_instance_id": active.instance_id,
            "source_entity": "player",
            "source_position": {"x": 0, "y": 0},
            "timestamp_ms": 100,
            "target_entities": [
                {"entity_id": "1", "position": {"x": 100, "y": 0}},
                {"entity_id": "2", "position": {"x": 120, "y": 40}},
                {"entity_id": "3", "position": {"x": 120, "y": -40}},
            ],
        }
    )

    assert result["ok"] is True
    spawns = [event for event in result["events"] if event["type"] == "projectile_spawn"]
    assert len(spawns) == 3
    assert {event["skill_instance_id"] for event in result["events"]} == {active.instance_id}


def test_disabled_skill_editor_and_test_arena_are_not_matrix_acceptance_surfaces() -> None:
    api = V1WebAppApi(CONFIG_ROOT)

    assert api.preview_skill_modifier_stack({})["ok"] is False
    assert api.run_skill_test_arena({})["ok"] is False
    assert run_skill_test_arena.main() == 2
