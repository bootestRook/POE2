from __future__ import annotations

from dataclasses import dataclass
import re
from typing import Any

from .config import (
    AffixDefinition,
    ConduitAmplifier,
    GemDefinition,
    PassiveEffect,
    SkillScalingRules,
    SkillTemplate,
    SupportBaseModifier,
)
from .damage_model import (
    DAMAGE_TYPES,
    calculate_converted_hit_damage,
    damage_components_payload,
    normalize_damage_components,
    normalize_damage_conversions,
    stat_conversions,
)
from .equipment import EquipmentAffixDefinition, EquipmentItem, equipment_runtime_params, equipment_stat_modifiers
from .gem_board import GemRelation, SudokuGemBoard
from .inventory import AffixRoll, GemInstance
from .player_stats import aggregate_player_stats


BOARD_SOURCE_STATS = {
    "same_row": "source_power_row",
    "same_column": "source_power_column",
    "same_box": "source_power_box",
    "adjacent": "source_power_adjacent",
}
BOARD_TARGET_STATS = {
    "same_row": "target_power_row",
    "same_column": "target_power_column",
    "same_box": "target_power_box",
    "adjacent": "target_power_adjacent",
}
RELATION_PRIORITY = ("adjacent", "same_row", "same_column", "same_box")
ELEMENTAL_DAMAGE_TYPES = frozenset({"fire", "cold", "lightning"})
SKILL_LEVEL_TAG_STATS = {
    "attack": "attack_skill_level_add",
    "spell": "spell_skill_level_add",
    "physical": "physical_skill_level_add",
    "fire": "fire_skill_level_add",
    "cold": "cold_skill_level_add",
    "lightning": "lightning_skill_level_add",
    "chaos": "chaos_skill_level_add",
    "core": "core_skill_level_add",
}
DAMAGE_TYPE_STATS = {
    "physical": ("physical_damage_add_percent",),
    "fire": ("fire_damage_add_percent", "elemental_damage_add_percent"),
    "cold": ("cold_damage_add_percent", "elemental_damage_add_percent"),
    "lightning": ("lightning_damage_add_percent", "elemental_damage_add_percent"),
    "chaos": ("chaos_damage_add_percent", "non_physical_damage_add_percent"),
}
SOURCE_TAG_DAMAGE_STATS = {
    "attack": "attack_damage_add_percent",
    "spell": "spell_damage_add_percent",
}
BEHAVIOR_TAG_DAMAGE_STATS = {
    "projectile": "projectile_damage_add_percent",
    "area": "area_damage_add_percent",
    "melee": "melee_damage_add_percent",
    "ranged": "ranged_damage_add_percent",
    "chain": "chain_damage_add_percent",
    "pierce": "pierce_damage_add_percent",
}
BOOLEAN_SKILL_STATS = frozenset({"cannot_crit", "prevent_elemental_ailments"})
CONDUIT_POWER_STATS = {
    "same_row": "conduit_power_row",
    "same_column": "conduit_power_column",
    "same_box": "conduit_power_box",
}
CONDUIT_LEVEL_ADD_STATS = {
    "active_skill": "active_gem_level_add",
    "passive_skill": "passive_gem_level_add",
}


class SkillEffectError(ValueError):
    def __init__(self, error_key: str, message: str) -> None:
        super().__init__(message)
        self.error_key = error_key
        self.message = message


@dataclass(frozen=True)
class AppliedModifier:
    source_instance_id: str
    source_base_gem_id: str
    target_instance_id: str
    stat: str
    value: float
    layer: str
    relation: str
    reason_key: str
    applied: bool = True
    target_base_gem_id: str = ""
    shape_effect: str = ""


@dataclass(frozen=True)
class FinalSkillInstance:
    active_gem_instance_id: str
    base_gem_id: str
    skill_template_id: str
    tags: frozenset[str]
    base_damage: float
    final_damage: float
    non_crit_damage: float
    increase_pool: float
    final_pool: float
    crit_chance: float
    crit_multiplier: float
    expected_hit_damage: float
    uses_per_second: float
    hit_coverage_factor: float
    preview_dps: float
    damage_type: str
    behavior_type: str
    visual_effect: str
    shape_effects: tuple[str, ...]
    base_release_interval_ms: int
    release_interval_ms: int
    base_cooldown_ms: int
    final_cooldown_ms: int
    actual_interval_ms: int
    trigger_interval_ms: int
    mana_cost: int
    projectile_count: int
    area_multiplier: float
    speed_multiplier: float
    applied_modifiers: tuple[AppliedModifier, ...]
    skill_package_id: str = ""
    skill_package_version: str = ""
    behavior_template: str = ""
    cast: dict[str, Any] | None = None
    hit: dict[str, Any] | None = None
    runtime_params: dict[str, Any] | None = None
    presentation_keys: dict[str, Any] | None = None
    source_context: dict[str, Any] | None = None
    skill_stats: dict[str, Any] | None = None
    base_damage_components: dict[str, float] | None = None
    final_damage_components: dict[str, float] | None = None
    converted_damage_components: dict[str, dict[str, float]] | None = None
    damage_conversions: tuple[dict[str, Any], ...] = ()
    ailments: tuple[dict[str, Any], ...] = ()
    secondary_hits: tuple[dict[str, Any], ...] = ()

    @property
    def uses_skill_event_pipeline(self) -> bool:
        return bool(self.skill_package_id and self.behavior_template)


@dataclass(frozen=True)
class PlayerStatModifier:
    source_instance_id: str
    source_base_gem_id: str
    stat: str
    value: float
    layer: str
    reason_key: str


@dataclass
class SkillEffectCalculator:
    board: SudokuGemBoard
    definitions: dict[str, GemDefinition]
    skill_templates: dict[str, SkillTemplate]
    relation_coefficients: dict[str, float]
    scaling_rules: SkillScalingRules
    affix_definitions: dict[str, AffixDefinition]
    player_runtime_stat_ids: frozenset[str] | None = None
    player_base_stats: dict[str, int | float | bool] | None = None
    equipment_items: tuple[EquipmentItem, ...] = ()
    equipment_affix_definitions: tuple[EquipmentAffixDefinition, ...] = ()

    def calculate_all(self) -> tuple[FinalSkillInstance, ...]:
        validation = self.board.validate()
        if not validation.is_valid:
            raise SkillEffectError("skill_effect.error.invalid_board", "非法盘面不可用于战斗")
        if not validation.can_enter_combat:
            raise SkillEffectError(
                validation.enter_combat_error_key or "skill_effect.error.cannot_enter_combat",
                validation.enter_combat_message or "当前盘面不可进入战斗",
            )

        active_instances = [
            self.board.inventory.require(instance_id)
            for instance_id in self.board.view().cells.values()
            if self.board.inventory.require(instance_id).gem_kind == "active_skill"
        ]
        return tuple(self.calculate_for_active(instance) for instance in active_instances)

    def calculate_for_active(self, active: GemInstance) -> FinalSkillInstance:
        definition = self.definitions[active.base_gem_id]
        if active.gem_kind != "active_skill":
            raise SkillEffectError("skill_effect.error.missing_template", "主动技能缺少技能模板")
        if definition.skill_template_id is None:
            raise SkillEffectError("skill_effect.error.missing_template", "主动技能缺少技能模板")
        template = self.skill_templates[definition.skill_template_id]
        modifiers: list[AppliedModifier] = []
        dedupe: set[tuple[str, str, str]] = set()
        conduit_level_modifiers = self._conduit_level_modifiers(active)
        modifiers.extend(conduit_level_modifiers)

        for roll in active.random_affixes + active.implicit_affixes:
            self._append_affix_modifier(
                modifiers,
                dedupe,
                source=active,
                target=active,
                roll=roll,
                relation="self",
                scale=1.0,
                reason_key="modifier.active_affix",
                active_tags=template.tags,
            )

        for support, relation in self._support_sources_for(active):
            support_definition = self.definitions[support.base_gem_id]
            if not self._gem_filter_matches(support_definition, definition):
                continue
            relation_scale, conduit_modifiers = self._relation_scale(support, active, relation)
            modifiers.extend(conduit_modifiers)
            for base_modifier in self._support_base_modifiers(support):
                self._append_raw_modifier(
                    modifiers,
                    dedupe,
                    source=support,
                    target=active,
                    stat=base_modifier.stat,
                    raw_value=base_modifier.value,
                    layer=base_modifier.layer,
                    relation=relation,
                    scale=relation_scale,
                    reason_key="modifier.support_base",
                )

        self._append_passive_contributions(active, definition, modifiers, dedupe)
        return self._build_final_skill(active, template, tuple(modifiers))

    def calculate_player_stat_modifiers(self) -> tuple[PlayerStatModifier, ...]:
        validation = self.board.validate()
        if not validation.is_valid:
            return ()
        modifiers: list[PlayerStatModifier] = []
        for passive in self._passive_instances():
            passive_definition = self.definitions[passive.base_gem_id]
            supported_values = self._support_values_for_passive(passive, passive_definition, "self_stat", [])
            effective_level = self._effective_level_with_conduits(passive, "passive_gem_level_add")
            for effect in passive_definition.passive_effects:
                if effect.target != "self_stat":
                    continue
                if self.player_runtime_stat_ids is not None and effect.stat not in self.player_runtime_stat_ids:
                    continue
                value = _definition_level_number(passive_definition, effective_level, effect.stat, effect.value)
                value += supported_values.get(effect.stat, 0.0)
                modifiers.append(
                    PlayerStatModifier(
                        source_instance_id=passive.instance_id,
                        source_base_gem_id=passive.base_gem_id,
                        stat=effect.stat,
                        value=value,
                        layer=effect.layer,
                        reason_key="modifier.self_stat_passive",
                    )
                )
        return tuple(modifiers)

    def apply_player_stat_contributions(self, player: object) -> tuple[PlayerStatModifier, ...]:
        modifiers = self.calculate_player_stat_modifiers()
        base_stats = dict(self.player_base_stats or {})
        if not base_stats:
            base_stats = {
                key: getattr(player, key)
                for key in dir(player)
                if not key.startswith("_") and isinstance(getattr(player, key), (int, float, bool))
            }
        old_max_life = float(getattr(player, "max_life", base_stats.get("max_life", 100)))
        old_current_life = float(getattr(player, "current_life", base_stats.get("current_life", old_max_life)))
        context = aggregate_player_stats(base_stats, tuple(modifiers) + self._equipment_stat_modifiers())
        for stat, value in context.values.items():
            setattr(player, stat, value)
        if old_current_life >= old_max_life:
            setattr(player, "current_life", context.values.get("max_life", old_current_life))
        if hasattr(player, "sync_runtime_bounds"):
            player.sync_runtime_bounds()
        return modifiers

    def _support_sources_for(self, target: GemInstance) -> list[tuple[GemInstance, str]]:
        sources: list[tuple[GemInstance, str]] = []
        for instance_id in self.board.view().cells.values():
            if instance_id == target.instance_id:
                continue
            instance = self.board.inventory.require(instance_id)
            if instance.gem_kind != "support":
                continue
            if target.gem_kind == "support":
                continue
            relation = self._effective_relation(instance.instance_id, target.instance_id)
            if relation is not None:
                sources.append((instance, relation))
        return sources

    def _passive_instances(self) -> list[GemInstance]:
        return [
            self.board.inventory.require(instance_id)
            for instance_id in self.board.view().cells.values()
            if self.board.inventory.require(instance_id).gem_kind == "passive_skill"
        ]

    def _append_passive_contributions(
        self,
        active: GemInstance,
        active_definition: GemDefinition,
        modifiers: list[AppliedModifier],
        dedupe: set[tuple[str, str, str]],
    ) -> None:
        for passive in self._passive_instances():
            passive_definition = self.definitions[passive.base_gem_id]
            if not self._gem_filter_matches(passive_definition, active_definition):
                continue
            relation = self._effective_relation(passive.instance_id, active.instance_id)
            if relation is None:
                continue
            passive_level_modifiers = self._conduit_level_modifiers(passive)
            modifiers.extend(passive_level_modifiers)
            supported_values = self._support_values_for_passive(passive, passive_definition, "active_skill", modifiers, dedupe)
            relation_scale, conduit_modifiers = self._relation_scale(passive, active, relation)
            modifiers.extend(conduit_modifiers)
            for effect in passive_definition.passive_effects:
                if effect.target != "active_skill":
                    continue
                self._append_passive_effect_modifier(
                    modifiers,
                    dedupe,
                    source=passive,
                    target=active,
                    effect=effect,
                    relation=relation,
                    scale=relation_scale,
                    extra_value=supported_values.get(effect.stat, 0.0),
                )

    def _support_values_for_passive(
        self,
        passive: GemInstance,
        passive_definition: GemDefinition,
        target_effect_kind: str,
        modifiers: list[AppliedModifier],
        dedupe: set[tuple[str, str, str]] | None = None,
    ) -> dict[str, float]:
        supported_stats = {
            effect.stat
            for effect in passive_definition.passive_effects
            if effect.target == target_effect_kind
        }
        values: dict[str, float] = {}
        local_dedupe: set[tuple[str, str, str]] = set()
        for support, relation in self._support_sources_for(passive):
            support_definition = self.definitions[support.base_gem_id]
            if not self._gem_filter_matches(support_definition, passive_definition):
                continue
            relation_scale, conduit_modifiers = self._relation_scale(support, passive, relation)
            modifiers.extend(conduit_modifiers)
            for base_modifier in self._support_base_modifiers(support):
                if base_modifier.stat not in supported_stats:
                    continue
                key = (support.instance_id, passive.instance_id, base_modifier.stat)
                route_dedupe = dedupe if dedupe is not None else local_dedupe
                if key in route_dedupe:
                    self._append_ignored(
                        modifiers,
                        support,
                        passive,
                        base_modifier.stat,
                        base_modifier.value,
                        relation,
                        "modifier.ignored.duplicate_source_target_stat",
                    )
                    continue
                route_dedupe.add(key)
                value = base_modifier.value * relation_scale
                values[base_modifier.stat] = values.get(base_modifier.stat, 0.0) + value
                modifiers.append(
                    AppliedModifier(
                        source_instance_id=support.instance_id,
                        source_base_gem_id=support.base_gem_id,
                        target_instance_id=passive.instance_id,
                        stat=base_modifier.stat,
                        value=value,
                        layer=base_modifier.layer,
                        relation=relation,
                        reason_key="modifier.support_to_passive",
                        applied=True,
                        target_base_gem_id=passive.base_gem_id,
                    )
                )
        return values

    def _effective_relation(self, source_id: str, target_id: str) -> str | None:
        relations = [
            relation.relation
            for relation in self.board.relations()
            if {relation.source_instance_id, relation.target_instance_id} == {source_id, target_id}
        ]
        for candidate in RELATION_PRIORITY:
            if candidate in relations:
                return candidate
        return None

    def _relation_scale(
        self,
        source: GemInstance,
        target: GemInstance,
        relation: str,
    ) -> tuple[float, list[AppliedModifier]]:
        relation_coefficient = self.relation_coefficients[relation]
        if relation == "adjacent":
            source_power = self._board_power(source, BOARD_SOURCE_STATS[relation])
            target_power = self._board_power(target, BOARD_TARGET_STATS[relation])
            adjacent_final = 1.0 + self._player_numeric_stat("adjacent_bonus_final_percent") / 100.0
            relation_final = 1.0 + self._player_numeric_stat("relation_effect_final_percent") / 100.0
            return relation_coefficient * source_power * target_power * adjacent_final * relation_final, []

        source_power = self._board_power(source, BOARD_SOURCE_STATS[relation])
        target_power = self._board_power(target, BOARD_TARGET_STATS[relation])
        conduit_multiplier, conduit_modifiers = self._conduit_multiplier(
            target,
            relation,
            excluded_instance_id=source.instance_id,
        )
        relation_final = 1.0 + self._player_numeric_stat("relation_effect_final_percent") / 100.0
        return relation_coefficient * source_power * target_power * conduit_multiplier * relation_final, conduit_modifiers

    def _board_power(self, instance: GemInstance, stat: str) -> float:
        value = self._player_numeric_stat(stat)
        for roll in instance.random_affixes + instance.implicit_affixes:
            if roll.stat == stat:
                value += float(roll.value)
        return 1.0 + value / 100.0

    def _conduit_multiplier(
        self,
        target: GemInstance,
        relation: str,
        *,
        excluded_instance_id: str | None = None,
    ) -> tuple[float, list[AppliedModifier]]:
        return 1.0, []

    def _conduit_level_modifiers(self, target: GemInstance) -> list[AppliedModifier]:
        stat = CONDUIT_LEVEL_ADD_STATS.get(target.gem_kind, "")
        if not stat:
            return []
        modifiers: list[AppliedModifier] = []
        for relation in ("same_row", "same_column", "same_box"):
            for conduit in self._matching_conduits(target, relation):
                amplifier = self._conduit_amplifier(conduit.base_gem_id, relation)
                if amplifier is None:
                    continue
                conduit_definition = self.definitions.get(conduit.base_gem_id)
                level_add = 1.0
                if conduit_definition is not None:
                    level_add = _definition_level_number(
                        conduit_definition,
                        conduit.level,
                        "skill_level_add",
                        min(conduit.level, 5),
                    )
                modifiers.append(
                    AppliedModifier(
                        source_instance_id=conduit.instance_id,
                        source_base_gem_id=conduit.base_gem_id,
                        target_instance_id=target.instance_id,
                        stat=stat,
                        value=level_add,
                        layer="additive",
                        relation=relation,
                        reason_key="modifier.conduit_skill_level",
                        applied=True,
                        target_base_gem_id=target.base_gem_id,
                    )
                )
        return modifiers

    def _effective_level_with_conduits(self, target: GemInstance, stat: str) -> int:
        return _effective_gem_level(target, self._conduit_level_modifiers(target), stat)

    def _matching_conduits(
        self,
        target: GemInstance,
        relation: str,
        *,
        excluded_instance_id: str | None = None,
    ) -> list[GemInstance]:
        conduits: list[GemInstance] = []
        for instance_id in self.board.view().cells.values():
            instance = self.board.inventory.require(instance_id)
            if instance.instance_id == excluded_instance_id:
                continue
            if "support_conduit" not in instance.tags:
                continue
            if self._effective_relation(instance.instance_id, target.instance_id) == relation:
                conduits.append(instance)
        return conduits

    def _conduit_amplifier(self, support_id: str, relation: str) -> ConduitAmplifier | None:
        for amplifier in self.scaling_rules.conduit_amplifiers:
            if amplifier.support_id == support_id and amplifier.relation == relation:
                return amplifier
        return None

    def _support_base_modifiers(self, support: GemInstance) -> list[SupportBaseModifier]:
        definition = self.definitions.get(support.base_gem_id)
        result: list[SupportBaseModifier] = []
        for modifier in self.scaling_rules.support_base_modifiers:
            if modifier.support_id != support.base_gem_id:
                continue
            value = modifier.value
            if definition is not None:
                value = _definition_level_number(definition, support.level, modifier.stat, modifier.value)
            result.append(
                SupportBaseModifier(
                    support_id=modifier.support_id,
                    stat=modifier.stat,
                    value=value,
                    layer=modifier.layer,
                )
            )
        return result

    def _append_affix_modifier(
        self,
        modifiers: list[AppliedModifier],
        dedupe: set[tuple[str, str, str]],
        *,
        source: GemInstance,
        target: GemInstance,
        roll: AffixRoll,
        relation: str,
        scale: float,
        reason_key: str,
        active_tags: frozenset[str],
    ) -> None:
        affix_definition = self.affix_definitions.get(roll.affix_id)
        if affix_definition is None:
            self._append_ignored(modifiers, source, target, roll.stat, roll.value, relation, "modifier.ignored.unknown_affix")
            return
        if affix_definition.apply_filter_tags and not (affix_definition.apply_filter_tags & active_tags):
            self._append_ignored(modifiers, source, target, roll.stat, roll.value, relation, "modifier.ignored.apply_filter")
            return
        if roll.stat.startswith("source_power_") or roll.stat.startswith("target_power_"):
            self._append_ignored(modifiers, source, target, roll.stat, roll.value, relation, "modifier.ignored.board_power_trace")
            return
        layer = self.scaling_rules.stat_layers.get(roll.stat)
        if layer is None:
            self._append_ignored(modifiers, source, target, roll.stat, roll.value, relation, "modifier.ignored.unsupported_stat")
            return
        self._append_raw_modifier(
            modifiers,
            dedupe,
            source=source,
            target=target,
            stat=roll.stat,
            raw_value=float(roll.value),
            layer=layer,
            relation=relation,
            scale=scale,
            reason_key=reason_key,
        )

    def _append_raw_modifier(
        self,
        modifiers: list[AppliedModifier],
        dedupe: set[tuple[str, str, str]],
        *,
        source: GemInstance,
        target: GemInstance,
        stat: str,
        raw_value: float,
        layer: str,
        relation: str,
        scale: float,
        reason_key: str,
    ) -> None:
        key = (source.instance_id, target.instance_id, stat)
        if key in dedupe:
            self._append_ignored(modifiers, source, target, stat, raw_value, relation, "modifier.ignored.duplicate_source_target_stat")
            return
        dedupe.add(key)
        value = raw_value * scale
        source_definition = self.definitions.get(source.base_gem_id)
        modifiers.append(
            AppliedModifier(
                source_instance_id=source.instance_id,
                source_base_gem_id=source.base_gem_id,
                target_instance_id=target.instance_id,
                stat=stat,
                value=value,
                layer=layer,
                relation=relation,
                reason_key=reason_key,
                target_base_gem_id=target.base_gem_id,
                shape_effect=source_definition.shape_effect if source_definition is not None else "",
            )
        )

    def _append_passive_effect_modifier(
        self,
        modifiers: list[AppliedModifier],
        dedupe: set[tuple[str, str, str]],
        *,
        source: GemInstance,
        target: GemInstance,
        effect: PassiveEffect,
        relation: str,
        scale: float,
        extra_value: float,
    ) -> None:
        source_definition = self.definitions.get(source.base_gem_id)
        base_value = effect.value
        if source_definition is not None:
            effective_level = self._effective_level_with_conduits(source, "passive_gem_level_add")
            base_value = _definition_level_number(source_definition, effective_level, effect.stat, effect.value)
        self._append_raw_modifier(
            modifiers,
            dedupe,
            source=source,
            target=target,
            stat=effect.stat,
            raw_value=base_value + extra_value,
            layer=effect.layer,
            relation=relation,
            scale=scale,
            reason_key="modifier.passive_base",
        )

    def _append_ignored(
        self,
        modifiers: list[AppliedModifier],
        source: GemInstance,
        target: GemInstance,
        stat: str,
        value: float,
        relation: str,
        reason_key: str,
    ) -> None:
        modifiers.append(
            AppliedModifier(
                source_instance_id=source.instance_id,
                source_base_gem_id=source.base_gem_id,
                target_instance_id=target.instance_id,
                stat=stat,
                value=float(value),
                layer="ignored",
                relation=relation,
                reason_key=reason_key,
                applied=False,
                target_base_gem_id=target.base_gem_id,
            )
        )

    def _gem_filter_matches(self, definition: GemDefinition, target_definition: GemDefinition) -> bool:
        if definition.apply_filter_target_kinds and target_definition.gem_kind not in definition.apply_filter_target_kinds:
            return False
        target_tags = target_definition.tags
        if definition.apply_filter_tags_any and not (definition.apply_filter_tags_any & target_tags):
            return False
        if definition.apply_filter_tags_all and not definition.apply_filter_tags_all.issubset(target_tags):
            return False
        if definition.apply_filter_tags_none and definition.apply_filter_tags_none & target_tags:
            return False
        return True

    def _build_final_skill(
        self,
        active: GemInstance,
        template: SkillTemplate,
        modifiers: tuple[AppliedModifier, ...],
    ) -> FinalSkillInstance:
        applied = [modifier for modifier in modifiers if modifier.applied]
        skill_stats = self._build_skill_stat_context(applied)
        shape_effects = tuple(
            dict.fromkeys(modifier.shape_effect for modifier in applied if modifier.shape_effect)
        )
        active_definition = self.definitions[active.base_gem_id]
        effective_level = _effective_gem_level(active, applied, "active_gem_level_add") + self._equipment_skill_level_add(template)
        level_values = _template_level_values(template, effective_level)
        source_parsed_values = active_definition.source_values.get("parsed_values", {})
        added_damage_effectiveness_percent = (
            float(source_parsed_values.get("added_damage_effectiveness_percent", 100.0))
            if isinstance(source_parsed_values, dict)
            else 100.0
        )
        skill_stats["added_damage_effectiveness_percent"] = added_damage_effectiveness_percent
        base_damage = _level_number(level_values, "base_damage", template.base_damage)
        weapon_attack_base_damage = self._weapon_attack_base_damage(skill_stats)
        weapon_attack_percent_scale = 1.0
        if template.hit.get("damage_basis") == "weapon_attack":
            weapon_attack_percent = _level_number(level_values, "weapon_attack_percent", base_damage)
            template_weapon_attack_percent = float(template.hit.get("weapon_attack_percent", weapon_attack_percent))
            if template_weapon_attack_percent > 0:
                weapon_attack_percent_scale = weapon_attack_percent / template_weapon_attack_percent
            base_damage = weapon_attack_base_damage * weapon_attack_percent / 100.0
        base_release_interval_ms = round(_level_number(level_values, "release_interval_ms", template.base_release_interval_ms))
        base_cooldown_ms = round(_level_number(level_values, "base_cooldown_ms", template.base_cooldown_ms))
        trigger_interval_ms = round(_level_number(level_values, "trigger_interval_ms", template.trigger_interval_ms))
        mana_cost = round(_level_number(level_values, "mana_cost", template.mana_cost))

        projectile_speed_damage_bonus_percent = 0.0
        projectile_speed_damage_conversion_percent = float(
            template.runtime_params.get("projectile_speed_damage_conversion_percent", 0.0)
        )
        if projectile_speed_damage_conversion_percent > 0:
            projectile_speed_damage_bonus_percent = (
                self._numeric_stat(skill_stats, "projectile_speed_add_percent")
                * projectile_speed_damage_conversion_percent
                / 100.0
            )
        final_pool = self._numeric_stat(skill_stats, "damage_final_percent") + self._numeric_stat(
            skill_stats,
            "hit_damage_final_percent",
        ) + projectile_speed_damage_bonus_percent
        level_base_damage_components = _level_damage_components(level_values, "hit_damage_component_")
        if level_base_damage_components:
            base_damage_components = level_base_damage_components
            component_total = sum(base_damage_components.values())
            level_damage_scale = base_damage / component_total if component_total > 0 else 1.0
        else:
            base_damage_components = normalize_damage_components(
                template.hit.get("damage_components"),
                fallback_type=template.damage_type,
                fallback_amount=base_damage,
            )
            component_total = sum(base_damage_components.values())
            if component_total > 0 and abs(component_total - base_damage) > 1e-9:
                level_damage_scale = base_damage / component_total
                base_damage_components = {
                    damage_type: amount * level_damage_scale
                    for damage_type, amount in base_damage_components.items()
                }
            else:
                level_damage_scale = 1.0
        base_damage_components = _add_supported_damage_components(
            base_damage_components,
            skill_stats,
            added_damage_effectiveness_percent=added_damage_effectiveness_percent,
        )
        package_conversions = normalize_damage_conversions(template.hit.get("damage_conversions"))
        all_conversions = package_conversions + stat_conversions(skill_stats)
        final_damage, final_damage_components, converted_damage_components, increase_pool = calculate_converted_hit_damage(
            base_components=base_damage_components,
            conversions=all_conversions,
            stats=skill_stats,
            tags=template.tags,
            behavior_template=template.behavior_template,
            behavior_type=template.behavior_type,
            final_pool=final_pool,
        )
        non_crit_damage = final_damage
        can_crit = bool(template.hit.get("can_crit", False)) and not bool(skill_stats.get("cannot_crit", False))
        crit_multiplier = self._numeric_stat(skill_stats, "derived_crit_damage_percent") / 100.0
        if can_crit:
            crit_chance = _clamp(self._numeric_stat(skill_stats, "derived_crit_chance_percent") / 100.0, 0.0, 0.95)
        else:
            crit_chance = 0.0
        expected_hit_damage = non_crit_damage * ((1.0 - crit_chance) + crit_chance * crit_multiplier)

        attack_speed_add_percent = self._numeric_stat(skill_stats, "attack_speed_add_percent")
        cast_speed_add_percent = self._numeric_stat(skill_stats, "cast_speed_add_percent")
        skill_speed_final_percent = self._numeric_stat(skill_stats, "skill_speed_final_percent")
        cooldown_recovery_add_percent = self._numeric_stat(skill_stats, "cooldown_recovery_add_percent")
        added_cooldown_ms = self._numeric_stat(skill_stats, "added_cooldown_ms")

        release_speed_add = 0.0
        if "attack" in template.tags:
            release_speed_add = attack_speed_add_percent
        elif "spell" in template.tags:
            release_speed_add = cast_speed_add_percent
        speed_multiplier = max(0.01, 1.0 + release_speed_add / 100.0)
        speed_multiplier *= max(0.01, 1.0 + skill_speed_final_percent / 100.0)

        release_interval = 0.0
        if base_release_interval_ms > 0 and ("attack" in template.tags or "spell" in template.tags):
            release_interval = base_release_interval_ms / speed_multiplier
        release_interval_ms = max(1, round(release_interval)) if release_interval > 0 else 0

        cooldown_recovery_multiplier = max(0.01, 1.0 + cooldown_recovery_add_percent / 100.0)
        cooldown = 0.0
        has_cooldown_constraint = base_cooldown_ms > 0 or added_cooldown_ms != 0
        if has_cooldown_constraint:
            cooldown = base_cooldown_ms / cooldown_recovery_multiplier + added_cooldown_ms
            cooldown = max(100.0, cooldown)
        final_cooldown_ms = max(0, round(cooldown))
        actual_interval_ms = max(release_interval_ms, final_cooldown_ms)
        uses_per_second = 1000.0 / actual_interval_ms if actual_interval_ms > 0 else 0.0
        hit_coverage_factor = 1.0
        preview_dps = expected_hit_damage * uses_per_second * hit_coverage_factor
        area_multiplier = 1.0 + self._numeric_stat(skill_stats, "area_add_percent") / 100.0
        area_add_percent = self._numeric_stat(skill_stats, "area_add_percent")
        projectile_speed_multiplier = 1.0 + self._numeric_stat(skill_stats, "projectile_speed_add_percent") / 100.0
        runtime_params = dict(template.runtime_params)
        for key, value in level_values.items():
            if key in {
                "base_damage",
                "release_interval_ms",
                "base_cooldown_ms",
                "trigger_interval_ms",
                "mana_cost",
            }:
                continue
            if isinstance(value, (int, float)) and not isinstance(value, bool):
                runtime_params[key] = value
        if "projectile_speed" in runtime_params:
            runtime_params["projectile_speed"] = float(runtime_params["projectile_speed"]) * projectile_speed_multiplier
        if "radius" in runtime_params:
            runtime_params["radius"] = float(runtime_params["radius"]) * area_multiplier
        if "chain_radius" in runtime_params:
            runtime_params["chain_radius"] = float(runtime_params["chain_radius"]) * area_multiplier
        if "arc_radius" in runtime_params:
            runtime_params["arc_radius"] = float(runtime_params["arc_radius"]) * area_multiplier
        if "length" in runtime_params:
            runtime_params["length"] = float(runtime_params["length"]) * area_multiplier
        if "width" in runtime_params:
            runtime_params["width"] = float(runtime_params["width"]) * area_multiplier
        if isinstance(runtime_params.get("modules"), list):
            runtime_params["modules"] = _apply_module_level_values(runtime_params["modules"], level_values)
            runtime_params["modules"] = _scaled_modules(
                runtime_params["modules"],
                area_multiplier,
                projectile_speed_multiplier,
                round(self._numeric_stat(skill_stats, "chain_count_add")),
                round(self._numeric_stat(skill_stats, "pierce_count_add")),
            )
        if "status_chance_scale" in runtime_params:
            runtime_params["status_chance_scale"] = float(runtime_params["status_chance_scale"]) * (
                1.0 + self._numeric_stat(skill_stats, "status_chance_add_percent") / 100.0
            )
        if "dot_damage_bonus_per_10_aggravation_percent" in runtime_params:
            runtime_params["dot_damage_bonus_per_10_aggravation_percent"] = float(
                runtime_params["dot_damage_bonus_per_10_aggravation_percent"]
            ) * (1.0 + self._numeric_stat(skill_stats, "aggravation_effect_add_percent") / 100.0)
        numbed_effect_add_percent = self._numeric_stat(skill_stats, "numbed_effect_add_percent")
        if numbed_effect_add_percent > 0:
            runtime_params["numbed_effect_add_percent"] = numbed_effect_add_percent
        aggravation_value_add = max(0.0, self._numeric_stat(skill_stats, "aggravation_value_add"))
        if aggravation_value_add > 0 and template.damage_form == "damage_over_time":
            runtime_params["aggravation_value"] = max(0.0, float(runtime_params.get("aggravation_value", 0.0))) + aggravation_value_add
            runtime_params.setdefault(
                "dot_damage_bonus_per_10_aggravation_percent",
                10.0 * (1.0 + self._numeric_stat(skill_stats, "aggravation_effect_add_percent") / 100.0),
            )
        armor_reduction_penetration_percent = self._numeric_stat(skill_stats, "armor_reduction_penetration_percent")
        if armor_reduction_penetration_percent > 0:
            runtime_params["armor_reduction_penetration_percent"] = armor_reduction_penetration_percent
        cull_threshold_percent = self._numeric_stat(skill_stats, "cull_threshold_percent")
        if cull_threshold_percent > 0:
            runtime_params["cull_threshold_percent"] = max(0.0, min(100.0, cull_threshold_percent))
        double_damage_chance_percent = self._numeric_stat(skill_stats, "double_damage_chance_percent")
        if double_damage_chance_percent > 0:
            runtime_params["double_damage_chance_percent"] = max(0.0, min(100.0, double_damage_chance_percent))
        deterioration_chance = self._numeric_stat(skill_stats, "deterioration_chance_add_percent")
        if deterioration_chance > 0:
            runtime_params["deterioration_chance_percent"] = max(0.0, min(100.0, deterioration_chance))
            runtime_params["deterioration_damage_percent_of_chaos_hit"] = 60.0 * (
                1.0 + max(0.0, self._numeric_stat(skill_stats, "deterioration_damage_add_percent")) / 100.0
            )
            runtime_params["deterioration_duration_ms"] = max(
                1,
                round(1000.0 * (1.0 + self._numeric_stat(skill_stats, "deterioration_duration_add_percent") / 100.0)),
            )
        duration_multiplier = max(
            0.01,
            1.0 + self._numeric_stat(skill_stats, "duration_add_percent") / 100.0,
        )
        if abs(duration_multiplier - 1.0) > 1e-9:
            _scale_runtime_durations(runtime_params, duration_multiplier)
        if "slash_chance_percent" in runtime_params:
            runtime_params["slash_chance_percent"] = _clamp(
                float(runtime_params.get("slash_chance_percent", 0.0))
                + self._numeric_stat(skill_stats, "slash_chance_add_percent"),
                0.0,
                100.0,
            )
        continuous_attack_chance_percent = self._numeric_stat(skill_stats, "continuous_attack_chance_percent")
        if continuous_attack_chance_percent > 0 and "attack" in template.tags:
            runtime_params["continuous_attack_chance_percent"] = max(0.0, continuous_attack_chance_percent)
            runtime_params["continuous_attack_damage_step_percent"] = max(
                0.0,
                self._numeric_stat(skill_stats, "continuous_attack_damage_step_percent"),
            )
        knockback_chance_percent = self._numeric_stat(skill_stats, "knockback_chance_percent")
        if knockback_chance_percent > 0:
            runtime_params["knockback_chance_percent"] = max(0.0, knockback_chance_percent)
            runtime_params["knockback_distance_add_percent"] = self._numeric_stat(skill_stats, "knockback_distance_add_percent")
            runtime_params["knockback_base_distance"] = float(runtime_params.get("knockback_base_distance", 48.0))
        energy_blessing_damage_per_stack_percent = self._numeric_stat(skill_stats, "energy_blessing_damage_per_stack_percent")
        if energy_blessing_damage_per_stack_percent > 0 and "spell" in template.tags:
            runtime_params["overload_buff_type"] = "energy_blessing"
            runtime_params["overload_damage_per_stack_percent"] = max(0.0, energy_blessing_damage_per_stack_percent)
            runtime_params["overload_max_stacks"] = 8
        guard_trigger_count = round(self._numeric_stat(skill_stats, "guard_trigger_count"))
        if guard_trigger_count > 0:
            runtime_params["guard_trigger_count"] = max(1, guard_trigger_count)
            runtime_params["guard_internal_cooldown_ms"] = max(
                0,
                round(self._numeric_stat(skill_stats, "guard_internal_cooldown_ms")),
            )
            runtime_params.setdefault("guard_absorb_percent", 70)
            runtime_params.setdefault("guard_absorb_amount", 150)
            runtime_params.setdefault("guard_duration_ms", 6000)
            runtime_params.setdefault("guard_exclude_damage_over_time", True)
        if skill_stats.get("prevent_elemental_ailments"):
            runtime_params["prevent_elemental_ailments"] = True
            runtime_params["prevent_status_buff_type"] = "elemental_fusion_no_ailments"
            runtime_params["prevented_status_types"] = ["ignite", "frozen", "numbed"]
        split_projectile_chance_percent = self._numeric_stat(skill_stats, "split_projectile_chance_percent")
        split_projectile_count_add = round(self._numeric_stat(skill_stats, "split_projectile_count_add"))
        if split_projectile_chance_percent > 0 and split_projectile_count_add > 0 and "projectile" in template.tags:
            runtime_params["split_projectile_chance_percent"] = max(0.0, split_projectile_chance_percent)
            runtime_params["split_projectile_count_add"] = max(0, split_projectile_count_add)
            runtime_params.setdefault("split_projectile_damage_multiplier", 1.0)
            runtime_params.setdefault("split_projectile_angle_step_deg", 25.0)
        if "flame_wave_count" in runtime_params:
            area_step = max(1.0, float(runtime_params.get("flame_wave_area_step_percent", 115.0)))
            area_steps = int(max(0.0, area_add_percent) // area_step)
            count_per_step = max(0, int(runtime_params.get("flame_wave_count_per_area_step", 0)))
            runtime_params["flame_wave_area_steps"] = area_steps
            runtime_params["flame_wave_count"] = max(
                1,
                int(runtime_params.get("flame_wave_count", 1)) + area_steps * count_per_step,
            )
            if "flame_wave_distance" in runtime_params:
                distance_bonus = max(
                    0.0,
                    float(runtime_params.get("flame_wave_distance_bonus_per_area_step_percent", 0.0)),
                )
                runtime_params["flame_wave_distance"] = float(runtime_params["flame_wave_distance"]) * (
                    1.0 + area_steps * distance_bonus / 100.0
                )
        if "split_projectile_base_damage" in runtime_params and base_damage > 0:
            runtime_params["split_projectile_damage_multiplier"] = max(
                0.0,
                float(runtime_params["split_projectile_base_damage"]) / base_damage,
            )
        base_projectile_count = int(runtime_params.get("projectile_count", 1))
        projectile_count_add = round(self._numeric_stat(skill_stats, "projectile_count_add"))
        runtime_params["projectile_count"] = max(
            1,
            base_projectile_count + projectile_count_add,
        )
        if (
            projectile_count_add > 0
            and runtime_params["projectile_count"] > 1
            and float(runtime_params.get("spread_angle_deg", 0.0)) <= 0.0
            and float(runtime_params.get("angle_step", 0.0)) <= 0.0
        ):
            runtime_params["spread_angle_deg"] = min(60.0, 12.0 * (int(runtime_params["projectile_count"]) - 1))
        if runtime_params.get("max_targets") != "unlimited":
            runtime_params["max_targets"] = max(1, int(runtime_params.get("max_targets", 1)))
        bounce_count_add = round(self._numeric_stat(skill_stats, "bounce_count_add"))
        if "chain_count" in runtime_params:
            chain_count_bonus = round(self._numeric_stat(skill_stats, "chain_count_add")) + bounce_count_add
            runtime_params["chain_count"] = max(
                0,
                int(runtime_params.get("chain_count", 0)) + chain_count_bonus,
            )
            if runtime_params.get("max_targets") != "unlimited":
                runtime_params["max_targets"] = max(int(runtime_params.get("max_targets", 1)), int(runtime_params["chain_count"]) + 1)
        elif bounce_count_add > 0 and "projectile" in template.tags:
            runtime_params["bounce_count"] = max(0, int(runtime_params.get("bounce_count", 0)) + bounce_count_add)
            runtime_params.setdefault("bounce_radius", 180.0)
        if "channel_max_stacks" in runtime_params:
            runtime_params["channel_max_stacks"] = max(
                1,
                int(runtime_params.get("channel_max_stacks", 1)) + round(self._numeric_stat(skill_stats, "channel_max_stacks_add")),
            )
            runtime_params["channel_min_stacks"] = max(
                0,
                min(
                    int(runtime_params["channel_max_stacks"]),
                    int(runtime_params.get("channel_min_stacks", 0)) + round(self._numeric_stat(skill_stats, "channel_min_stacks_add")),
                ),
            )
        if "channel_time_per_stack_ms" in runtime_params:
            channel_time_multiplier = max(
                0.01,
                1.0 - self._numeric_stat(skill_stats, "channel_time_per_stack_ms_reduction_percent") / 100.0,
            )
            runtime_params["channel_time_per_stack_ms"] = max(
                1,
                round(float(runtime_params.get("channel_time_per_stack_ms", 1)) * channel_time_multiplier),
            )
        if "pierce_count" in runtime_params:
            runtime_params["pierce_count"] = max(
                0,
                int(runtime_params.get("pierce_count", 0)) + round(self._numeric_stat(skill_stats, "pierce_count_add")),
            )
        if runtime_params.get("pierce") is True and "pierce_count" not in runtime_params:
            runtime_params["pierce_count"] = max(0, round(self._numeric_stat(skill_stats, "pierce_count_add")))
        runtime_params.update(self._equipment_runtime_params())

        secondary_hits = tuple(
            _scaled_secondary_hit(
                hit,
                level_damage_scale,
                weapon_attack_base_damage,
                weapon_attack_percent_scale=weapon_attack_percent_scale,
                level_values=level_values,
            )
            for hit in template.hit.get("secondary_hits", ())
            if isinstance(hit, dict)
        )
        hit_payload = {**dict(template.hit), "base_damage": base_damage}
        if template.hit.get("damage_basis") == "weapon_attack":
            hit_payload["weapon_attack_percent"] = weapon_attack_percent
        if base_damage_components:
            hit_payload["damage_components"] = damage_components_payload(base_damage_components)
        if secondary_hits:
            hit_payload["secondary_hits"] = [dict(hit) for hit in secondary_hits]

        ailments = _scaled_ailments(
            _apply_ailment_level_values(
                tuple(dict(ailment) for ailment in template.hit.get("ailments", ()) if isinstance(ailment, dict)),
                level_values,
                "hit_ailment_",
            ),
            skill_stats,
        )
        if ailments:
            hit_payload["ailments"] = [dict(ailment) for ailment in ailments]

        return FinalSkillInstance(
            active_gem_instance_id=active.instance_id,
            base_gem_id=active.base_gem_id,
            skill_template_id=template.template_id,
            tags=template.tags,
            base_damage=base_damage,
            final_damage=final_damage,
            non_crit_damage=non_crit_damage,
            increase_pool=increase_pool,
            final_pool=final_pool,
            crit_chance=crit_chance,
            crit_multiplier=crit_multiplier,
            expected_hit_damage=expected_hit_damage,
            uses_per_second=uses_per_second,
            hit_coverage_factor=hit_coverage_factor,
            preview_dps=preview_dps,
            damage_type=template.damage_type,
            behavior_type=template.behavior_type,
            visual_effect=active_definition.visual_effect or template.visual_effect or template.behavior_type,
            shape_effects=shape_effects,
            base_release_interval_ms=base_release_interval_ms,
            release_interval_ms=release_interval_ms,
            base_cooldown_ms=base_cooldown_ms,
            final_cooldown_ms=final_cooldown_ms,
            actual_interval_ms=actual_interval_ms,
            trigger_interval_ms=trigger_interval_ms,
            mana_cost=mana_cost,
            projectile_count=int(runtime_params["projectile_count"]),
            area_multiplier=area_multiplier,
            speed_multiplier=speed_multiplier,
            applied_modifiers=modifiers,
            skill_package_id=template.skill_package_id,
            skill_package_version=template.skill_package_version,
            behavior_template=template.behavior_template,
            cast={
                **dict(template.cast),
                "release_interval_ms": base_release_interval_ms,
                "base_cooldown_ms": base_cooldown_ms,
                "trigger_interval_ms": trigger_interval_ms,
                "mana_cost": mana_cost,
            },
            hit=hit_payload,
            runtime_params=runtime_params,
            presentation_keys=dict(template.presentation_keys),
            source_context={
                "active_gem_instance_id": active.instance_id,
                "base_gem_id": active.base_gem_id,
                "gem_kind": active.gem_kind,
                "sudoku_digit": active.sudoku_digit,
                "base_gem_level": active.level,
                "effective_gem_level": effective_level,
                "tlidb_source_values": dict(active_definition.source_values),
                "level_values": dict(level_values),
                "auto_release": dict(active_definition.auto_release or template.auto_release),
                "damage_basis": template.hit.get("damage_basis", "flat"),
                "damage_form": template.damage_form,
                "weapon_attack_base_damage": weapon_attack_base_damage,
                "added_damage_effectiveness_percent": added_damage_effectiveness_percent,
            },
            skill_stats=skill_stats,
            base_damage_components=damage_components_payload(base_damage_components),
            final_damage_components=damage_components_payload(final_damage_components),
            converted_damage_components={
                damage_type: damage_components_payload(origins)
                for damage_type, origins in converted_damage_components.items()
                if damage_type in DAMAGE_TYPES
            },
            damage_conversions=tuple(
                {
                    "from": conversion.source,
                    "to": conversion.target,
                    "percent": conversion.percent,
                }
                for conversion in all_conversions
            ),
            ailments=ailments,
            secondary_hits=secondary_hits,
        )

    def _sum_by_stat(self, modifiers: list[AppliedModifier], layer: str) -> dict[str, float]:
        result: dict[str, float] = {}
        for modifier in modifiers:
            if modifier.layer != layer:
                continue
            result[modifier.stat] = result.get(modifier.stat, 0.0) + modifier.value
        return result

    def _build_skill_stat_context(self, applied: list[AppliedModifier]) -> dict[str, Any]:
        result: dict[str, Any] = {}
        player_context = aggregate_player_stats(self.player_base_stats)
        for stat, value in player_context.values.items():
            if not self._stat_can_enter_skill_context(stat):
                continue
            if stat in BOOLEAN_SKILL_STATS:
                result[stat] = bool(value)
            elif isinstance(value, (int, float)) and not isinstance(value, bool):
                result[stat] = float(value)

        equipment_context = aggregate_player_stats({}, self._equipment_stat_modifiers())
        for stat, value in equipment_context.values.items():
            if not self._stat_can_enter_skill_context(stat, require_player_runtime_stat=False):
                continue
            if stat in BOOLEAN_SKILL_STATS:
                result[stat] = bool(result.get(stat, False) or value)
            elif isinstance(value, (int, float)) and not isinstance(value, bool):
                result[stat] = self._numeric_stat(result, stat) + float(value)

        for modifier in applied:
            if modifier.layer not in {"additive", "final"}:
                continue
            if not self._stat_can_enter_skill_context(modifier.stat, require_player_runtime_stat=False):
                continue
            if modifier.stat in BOOLEAN_SKILL_STATS:
                result[modifier.stat] = bool(result.get(modifier.stat, False) or modifier.value)
                continue
            result[modifier.stat] = self._numeric_stat(result, modifier.stat) + modifier.value
        return result

    def _stat_can_enter_skill_context(self, stat: str, *, require_player_runtime_stat: bool = True) -> bool:
        if stat not in self.scaling_rules.stat_layers:
            return False
        if require_player_runtime_stat and self.player_runtime_stat_ids is not None and stat not in self.player_runtime_stat_ids:
            return False
        return True

    def _increase_pool(self, stats: dict[str, Any], template: SkillTemplate) -> float:
        pool = (
            self._numeric_stat(stats, "damage_add_percent")
            + self._numeric_stat(stats, "hit_damage_add_percent")
            + self._numeric_stat(stats, "all_damage_type_add_percent")
        )
        attribute_damage = self._numeric_stat(stats, "damage_add_percent_per_27_attributes")
        if attribute_damage:
            attributes = (
                self._numeric_stat(stats, "strength")
                + self._numeric_stat(stats, "dexterity")
                + self._numeric_stat(stats, "intelligence")
            )
            pool += (attributes // 27.0) * attribute_damage
        attribute_damage_per_12 = self._numeric_stat(stats, "damage_add_percent_per_12_attributes")
        if attribute_damage_per_12:
            attributes = (
                self._numeric_stat(stats, "strength")
                + self._numeric_stat(stats, "dexterity")
                + self._numeric_stat(stats, "intelligence")
            )
            pool += (attributes // 12.0) * attribute_damage_per_12
        for stat in DAMAGE_TYPE_STATS.get(template.damage_type, ()):
            pool += self._numeric_stat(stats, stat)
        for tag, stat in SOURCE_TAG_DAMAGE_STATS.items():
            if tag in template.tags:
                pool += self._numeric_stat(stats, stat)
        for tag, stat in BEHAVIOR_TAG_DAMAGE_STATS.items():
            if tag in template.tags or template.behavior_template == tag or template.behavior_type == tag:
                pool += self._numeric_stat(stats, stat)
        return pool

    def _numeric_stat(self, stats: dict[str, Any], stat: str) -> float:
        value = stats.get(stat, 0.0)
        if isinstance(value, bool):
            return 1.0 if value else 0.0
        if isinstance(value, (int, float)):
            return float(value)
        return 0.0

    def _player_numeric_stat(self, stat: str) -> float:
        if not stat:
            return 0.0
        return self._numeric_stat(aggregate_player_stats(self.player_base_stats, self._equipment_stat_modifiers()).values, stat)

    def _equipment_stat_modifiers(self) -> tuple[object, ...]:
        if not self.equipment_items or not self.equipment_affix_definitions:
            return ()
        return equipment_stat_modifiers(self.equipment_items, definitions=self.equipment_affix_definitions)

    def _equipment_skill_level_add(self, template: SkillTemplate) -> int:
        equipment_context = aggregate_player_stats({}, self._equipment_stat_modifiers())
        equipment_stats = equipment_context.values
        total = round(self._numeric_stat(equipment_stats, "active_gem_level_add"))
        for tag, stat in SKILL_LEVEL_TAG_STATS.items():
            if tag in template.tags or template.damage_type == tag:
                total += round(self._numeric_stat(equipment_stats, stat))
        return max(0, total)

    def _equipment_runtime_params(self) -> dict[str, object]:
        if not self.equipment_items or not self.equipment_affix_definitions:
            return {}
        return equipment_runtime_params(self.equipment_items, definitions=self.equipment_affix_definitions)

    def _weapon_attack_base_damage(self, skill_stats: dict[str, Any]) -> float:
        from_skill_context = self._numeric_stat(skill_stats, "weapon_attack_base_damage")
        if from_skill_context > 0:
            return from_skill_context
        from_player_context = self._player_numeric_stat("weapon_attack_base_damage")
        if from_player_context > 0:
            return from_player_context
        return 100.0


def _scaled_modules(
    modules: object,
    area_multiplier: float,
    speed_multiplier: float,
    chain_count_add: int = 0,
    pierce_count_add: int = 0,
) -> list[dict[str, Any]]:
    scaled: list[dict[str, Any]] = []
    if not isinstance(modules, list):
        return scaled
    for module in modules:
        if not isinstance(module, dict):
            continue
        next_module = {
            key: (dict(value) if isinstance(value, dict) else value)
            for key, value in module.items()
        }
        params = dict(next_module.get("params", {})) if isinstance(next_module.get("params"), dict) else {}
        if "projectile_speed" in params:
            params["projectile_speed"] = float(params["projectile_speed"]) * speed_multiplier
        for area_key in ("radius", "length", "width", "orbit_radius"):
            if area_key in params:
                params[area_key] = float(params[area_key]) * area_multiplier
        if "chain_count" in params:
            params["chain_count"] = max(0, int(params["chain_count"]) + chain_count_add)
        if "pierce_count" in params:
            params["pierce_count"] = max(0, int(params["pierce_count"]) + pierce_count_add)
        next_module["params"] = params
        scaled.append(next_module)
    return scaled


def _scale_runtime_durations(runtime_params: dict[str, Any], duration_multiplier: float) -> None:
    for key in ("duration_ms", "cloud_duration_per_stack_ms"):
        if key in runtime_params:
            runtime_params[key] = max(1, round(float(runtime_params[key]) * duration_multiplier))
    modules = runtime_params.get("modules")
    if not isinstance(modules, list):
        return
    for module in modules:
        if not isinstance(module, dict):
            continue
        params = module.get("params")
        if not isinstance(params, dict):
            continue
        for key in ("duration_ms", "cloud_duration_per_stack_ms"):
            if key in params:
                params[key] = max(1, round(float(params[key]) * duration_multiplier))


def _add_supported_damage_components(
    base_components: dict[str, float],
    skill_stats: dict[str, Any],
    *,
    added_damage_effectiveness_percent: float,
) -> dict[str, float]:
    result = dict(base_components)
    effectiveness = max(0.0, float(added_damage_effectiveness_percent)) / 100.0
    for damage_type, stat in {
        "physical": "added_physical_damage",
        "fire": "added_fire_damage",
        "cold": "added_cold_damage",
        "lightning": "added_lightning_damage",
        "chaos": "added_chaos_damage",
    }.items():
        amount = _numeric_context_stat(skill_stats, stat) * effectiveness
        if amount > 0:
            result[damage_type] = result.get(damage_type, 0.0) + amount
    physical_base = result.get("physical", 0.0)
    fire_from_physical_percent = _numeric_context_stat(skill_stats, "added_fire_damage_from_physical_percent")
    if physical_base > 0 and fire_from_physical_percent > 0:
        result["fire"] = result.get("fire", 0.0) + physical_base * fire_from_physical_percent / 100.0
    return {damage_type: amount for damage_type, amount in result.items() if amount > 1e-9}


def _numeric_context_stat(stats: dict[str, Any], stat: str) -> float:
    value = stats.get(stat, 0.0)
    return float(value) if isinstance(value, (int, float)) and not isinstance(value, bool) else 0.0


def _scaled_ailments(ailments: tuple[dict[str, Any], ...], skill_stats: dict[str, Any]) -> tuple[dict[str, Any], ...]:
    if not ailments:
        return ()
    ignite_chance_add = _numeric_context_stat(skill_stats, "ignite_chance_add_percent")
    ignite_stacks_add = max(0, round(_numeric_context_stat(skill_stats, "ignite_stacks_add")))
    ignite_duration_multiplier = max(
        0.01,
        1.0
        + (
            _numeric_context_stat(skill_stats, "duration_add_percent")
            + _numeric_context_stat(skill_stats, "ignite_duration_add_percent")
        )
        / 100.0,
    )
    ailment_duration_multiplier = max(
        0.01,
        1.0 + _numeric_context_stat(skill_stats, "ailment_duration_add_percent") / 100.0,
    )
    trauma_duration_multiplier = max(
        0.01,
        1.0
        + (
            _numeric_context_stat(skill_stats, "duration_add_percent")
            + _numeric_context_stat(skill_stats, "trauma_duration_add_percent")
        )
        / 100.0,
    )
    ignite_bonus_per_stack = max(0.0, _numeric_context_stat(skill_stats, "ignite_damage_bonus_per_stack_percent"))
    ignite_bonus_max = max(0.0, _numeric_context_stat(skill_stats, "ignite_damage_bonus_max_percent"))
    frostbite_max_value_add = max(0.0, _numeric_context_stat(skill_stats, "frostbite_max_value_add"))
    added_base_ailment_damage = max(0.0, _numeric_context_stat(skill_stats, "added_base_ailment_damage_per_second"))
    added_base_trauma_damage = max(0.0, _numeric_context_stat(skill_stats, "added_base_trauma_damage_per_second"))
    ailment_damage_multiplier = 1.0 + max(0.0, _numeric_context_stat(skill_stats, "ailment_damage_deepen_percent")) / 100.0
    result: list[dict[str, Any]] = []
    for ailment in ailments:
        next_ailment = dict(ailment)
        ailment_type = str(next_ailment.get("type", ""))
        if ailment_type == "ignite":
            added_base_ignite_damage = max(0.0, _numeric_context_stat(skill_stats, "added_base_ignite_damage_per_second"))
            added_base_ignite_damage += added_base_ailment_damage
            if added_base_ignite_damage > 0:
                next_ailment["base_damage_per_second"] = float(next_ailment.get("base_damage_per_second", 0.0)) + added_base_ignite_damage
            if ignite_chance_add:
                next_ailment["chance_percent"] = max(0.0, float(next_ailment.get("chance_percent", 100.0)) + ignite_chance_add)
            if ignite_stacks_add:
                base_stacks = max(1, int(next_ailment.get("stacks", 1)))
                next_ailment["stacks"] = base_stacks + ignite_stacks_add
                next_ailment["max_stacks"] = max(int(next_ailment.get("max_stacks", 1)), int(next_ailment["stacks"]))
            if ignite_bonus_per_stack > 0:
                next_ailment["dot_damage_bonus_per_ignite_stack_percent"] = ignite_bonus_per_stack
                next_ailment["dot_damage_bonus_max_percent"] = ignite_bonus_max
            if abs(ignite_duration_multiplier - 1.0) > 1e-9:
                next_ailment["duration_ms"] = max(
                    1,
                    round(float(next_ailment.get("duration_ms", 4000)) * ignite_duration_multiplier * ailment_duration_multiplier),
                )
        elif ailment_type == "frostbite" and frostbite_max_value_add > 0:
            current_threshold = float(next_ailment.get("threshold", 100.0))
            if current_threshold > 0:
                next_ailment["threshold"] = current_threshold + frostbite_max_value_add
            next_ailment["max_value"] = float(next_ailment.get("max_value", current_threshold or 100.0)) + frostbite_max_value_add
        elif ailment_type == "trauma":
            added = added_base_ailment_damage + added_base_trauma_damage
            if added > 0:
                next_ailment["base_damage_per_second"] = float(next_ailment.get("base_damage_per_second", 0.0)) + added
            next_ailment["duration_ms"] = max(
                1,
                round(float(next_ailment.get("duration_ms", 4000)) * trauma_duration_multiplier * ailment_duration_multiplier),
            )
        elif ailment_type in {"shock", "wilt"}:
            if added_base_ailment_damage > 0:
                key = "base_value" if ailment_type == "shock" else "base_damage_per_second"
                next_ailment[key] = float(next_ailment.get(key, 0.0)) + added_base_ailment_damage
        if ailment_type in {"ignite", "shock", "trauma", "wilt"} and ailment_damage_multiplier > 1.0:
            for key in ("base_damage_per_second", "base_value"):
                if key in next_ailment:
                    next_ailment[key] = float(next_ailment[key]) * ailment_damage_multiplier
        result.append(next_ailment)
    return tuple(result)


def _scaled_secondary_hit(
    hit: dict[str, Any],
    level_damage_scale: float,
    weapon_attack_base_damage: float,
    *,
    weapon_attack_percent_scale: float = 1.0,
    level_values: dict[str, object] | None = None,
) -> dict[str, Any]:
    result = dict(hit)
    level_values = level_values or {}
    secondary_id = _safe_level_key_fragment(result.get("id", "secondary_hit"))
    level_key_prefix = f"secondary_hit_{secondary_id}"
    level_base_damage = _level_optional_number(level_values, f"{level_key_prefix}_base_damage")
    level_weapon_attack_percent = _level_optional_number(level_values, f"{level_key_prefix}_weapon_attack_percent")
    level_components = _level_damage_components(level_values, f"{level_key_prefix}_damage_component_")
    base_damage_already_scaled = False
    component_scale = level_damage_scale
    if result.get("damage_basis") == "weapon_attack":
        weapon_attack_percent = (
            level_weapon_attack_percent
            if level_weapon_attack_percent is not None
            else float(result.get("weapon_attack_percent", result.get("base_damage", 0.0))) * weapon_attack_percent_scale
        )
        result["weapon_attack_percent"] = weapon_attack_percent
        result["base_damage"] = weapon_attack_base_damage * weapon_attack_percent / 100.0
        components = level_components or result.get("damage_components")
        if isinstance(components, dict):
            component_total = sum(
                float(amount)
                for amount in components.values()
                if isinstance(amount, (int, float)) and not isinstance(amount, bool)
            )
            if component_total > 0:
                component_scale = float(result["base_damage"]) / component_total
            else:
                component_scale = weapon_attack_percent_scale
        base_damage_already_scaled = True
    if (
        not base_damage_already_scaled
        and isinstance(result.get("base_damage"), (int, float))
        and not isinstance(result.get("base_damage"), bool)
    ):
        result["base_damage"] = level_base_damage if level_base_damage is not None else float(result["base_damage"]) * level_damage_scale
    elif not base_damage_already_scaled and level_base_damage is not None:
        result["base_damage"] = level_base_damage
    components = level_components or result.get("damage_components")
    if isinstance(components, dict):
        result["damage_components"] = {
            str(damage_type): float(amount) * component_scale
            for damage_type, amount in components.items()
            if isinstance(amount, (int, float)) and not isinstance(amount, bool)
        }
    return result


def _level_damage_components(level_values: dict[str, object], prefix: str) -> dict[str, float]:
    result: dict[str, float] = {}
    for key, value in level_values.items():
        if not str(key).startswith(prefix):
            continue
        if not isinstance(value, (int, float)) or isinstance(value, bool):
            continue
        damage_type = str(key)[len(prefix) :]
        if damage_type:
            result[damage_type] = float(value)
    return result


def _level_optional_number(level_values: dict[str, object], key: str) -> float | None:
    value = level_values.get(key)
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return float(value)
    return None


def _safe_level_key_fragment(value: object) -> str:
    return re.sub(r"[^0-9A-Za-z_]+", "_", str(value)).strip("_").lower()


def _apply_ailment_level_values(
    ailments: tuple[dict[str, Any], ...],
    level_values: dict[str, object],
    prefix: str,
) -> tuple[dict[str, Any], ...]:
    result: list[dict[str, Any]] = []
    for ailment in ailments:
        next_ailment = dict(ailment)
        ailment_type = _safe_level_key_fragment(next_ailment.get("type", "unknown"))
        base_damage_per_second = _level_optional_number(level_values, f"{prefix}{ailment_type}_base_damage_per_second")
        if base_damage_per_second is not None:
            next_ailment["base_damage_per_second"] = base_damage_per_second
        result.append(next_ailment)
    return tuple(result)


def _apply_module_level_values(
    modules: list[Any],
    level_values: dict[str, object],
) -> list[Any]:
    result: list[Any] = []
    for module in modules:
        if not isinstance(module, dict):
            result.append(module)
            continue
        next_module = dict(module)
        module_id = _safe_level_key_fragment(next_module.get("id", "module"))
        params = next_module.get("params")
        if isinstance(params, dict):
            next_params = dict(params)
            for key in tuple(next_params):
                level_value = _level_optional_number(level_values, f"module_{module_id}_{key}")
                if level_value is not None:
                    next_params[key] = level_value
            next_module["params"] = next_params
        result.append(next_module)
    return result


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return min(maximum, max(minimum, value))


def _template_level_values(template: SkillTemplate, level: int) -> dict[str, object]:
    levels = template.level_table.get("levels") if isinstance(template.level_table, dict) else None
    if not isinstance(levels, dict):
        return {}
    clamped_level = max(1, min(40, int(level)))
    value = levels.get(str(clamped_level), levels.get(clamped_level))
    if isinstance(value, dict):
        return value
    return {}


def _definition_level_values(definition: GemDefinition, level: int) -> dict[str, object]:
    levels = definition.level_table.get("levels") if isinstance(definition.level_table, dict) else None
    if not isinstance(levels, dict):
        return {}
    clamped_level = max(1, min(40, int(level)))
    value = levels.get(str(clamped_level), levels.get(clamped_level))
    if isinstance(value, dict):
        return value
    return {}


def _level_number(level_values: dict[str, object], key: str, fallback: float | int) -> float:
    value = level_values.get(key)
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return float(value)
    return float(fallback)


def _definition_level_number(definition: GemDefinition, level: int, key: str, fallback: float | int) -> float:
    return _level_number(_definition_level_values(definition, level), key, fallback)


def _effective_gem_level(instance: GemInstance, modifiers: list[AppliedModifier], stat: str) -> int:
    level_add = sum(
        modifier.value
        for modifier in modifiers
        if modifier.applied
        and modifier.target_instance_id == instance.instance_id
        and modifier.stat == stat
    )
    return max(1, min(40, int(round(instance.level + level_add))))
