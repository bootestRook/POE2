from __future__ import annotations

from dataclasses import dataclass
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
BOOLEAN_SKILL_STATS = frozenset({"cannot_crit"})
CONDUIT_POWER_STATS = {
    "same_row": "conduit_power_row",
    "same_column": "conduit_power_column",
    "same_box": "conduit_power_box",
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
            for base_modifier in self._support_base_modifiers(support.base_gem_id):
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
            for effect in passive_definition.passive_effects:
                if effect.target != "self_stat":
                    continue
                if self.player_runtime_stat_ids is not None and effect.stat not in self.player_runtime_stat_ids:
                    continue
                value = effect.value + supported_values.get(effect.stat, 0.0)
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
        context = aggregate_player_stats(base_stats, modifiers)
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
            for base_modifier in self._support_base_modifiers(support.base_gem_id):
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
        multiplier = 1.0
        modifiers: list[AppliedModifier] = []
        for conduit in self._matching_conduits(
            target,
            relation,
            excluded_instance_id=excluded_instance_id,
        ):
            amplifier = self._conduit_amplifier(conduit.base_gem_id, relation)
            if amplifier is None:
                continue
            conduit_stat = CONDUIT_POWER_STATS.get(relation, "")
            player_conduit_multiplier = 1.0 + self._player_numeric_stat(conduit_stat) / 100.0
            multiplier *= amplifier.multiplier * player_conduit_multiplier
            modifiers.append(
                AppliedModifier(
                    source_instance_id=conduit.instance_id,
                    source_base_gem_id=conduit.base_gem_id,
                    target_instance_id=target.instance_id,
                    stat="conduit_multiplier",
                    value=amplifier.multiplier * player_conduit_multiplier,
                    layer="final",
                    relation=relation,
                    reason_key="modifier.conduit_amplifier",
                    applied=True,
                    target_base_gem_id=target.base_gem_id,
                )
            )
        return multiplier, modifiers

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

    def _support_base_modifiers(self, support_id: str) -> list[SupportBaseModifier]:
        return [
            modifier
            for modifier in self.scaling_rules.support_base_modifiers
            if modifier.support_id == support_id
        ]

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
        self._append_raw_modifier(
            modifiers,
            dedupe,
            source=source,
            target=target,
            stat=effect.stat,
            raw_value=effect.value + extra_value,
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

        increase_pool = self._increase_pool(skill_stats, template)
        final_pool = self._numeric_stat(skill_stats, "damage_final_percent") + self._numeric_stat(
            skill_stats,
            "hit_damage_final_percent",
        )
        non_crit_damage = template.base_damage * (1.0 + increase_pool / 100.0) * (1.0 + final_pool / 100.0)
        final_damage = non_crit_damage
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
        if template.base_release_interval_ms > 0 and ("attack" in template.tags or "spell" in template.tags):
            release_interval = template.base_release_interval_ms / speed_multiplier
        release_interval_ms = max(1, round(release_interval)) if release_interval > 0 else 0

        cooldown_recovery_multiplier = max(0.01, 1.0 + cooldown_recovery_add_percent / 100.0)
        cooldown = 0.0
        has_cooldown_constraint = template.base_cooldown_ms > 0 or added_cooldown_ms != 0
        if has_cooldown_constraint:
            cooldown = template.base_cooldown_ms / cooldown_recovery_multiplier + added_cooldown_ms
            cooldown = max(100.0, cooldown)
        final_cooldown_ms = max(0, round(cooldown))
        actual_interval_ms = max(release_interval_ms, final_cooldown_ms)
        uses_per_second = 1000.0 / actual_interval_ms if actual_interval_ms > 0 else 0.0
        hit_coverage_factor = 1.0
        preview_dps = expected_hit_damage * uses_per_second * hit_coverage_factor
        area_multiplier = 1.0 + self._numeric_stat(skill_stats, "area_add_percent") / 100.0
        projectile_speed_multiplier = 1.0 + self._numeric_stat(skill_stats, "projectile_speed_add_percent") / 100.0
        runtime_params = dict(template.runtime_params)
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
        base_projectile_count = int(runtime_params.get("projectile_count", 1))
        runtime_params["projectile_count"] = max(
            1,
            base_projectile_count + round(self._numeric_stat(skill_stats, "projectile_count_add")),
        )
        if runtime_params.get("max_targets") != "unlimited":
            runtime_params["max_targets"] = max(1, int(runtime_params.get("max_targets", 1)))
        if "chain_count" in runtime_params:
            runtime_params["chain_count"] = max(
                0,
                int(runtime_params.get("chain_count", 0)) + round(self._numeric_stat(skill_stats, "chain_count_add")),
            )
            if runtime_params.get("max_targets") != "unlimited":
                runtime_params["max_targets"] = max(int(runtime_params.get("max_targets", 1)), int(runtime_params["chain_count"]) + 1)
        if "pierce_count" in runtime_params:
            runtime_params["pierce_count"] = max(
                0,
                int(runtime_params.get("pierce_count", 0)) + round(self._numeric_stat(skill_stats, "pierce_count_add")),
            )
        if runtime_params.get("pierce") is True and "pierce_count" not in runtime_params:
            runtime_params["pierce_count"] = max(0, round(self._numeric_stat(skill_stats, "pierce_count_add")))

        return FinalSkillInstance(
            active_gem_instance_id=active.instance_id,
            base_gem_id=active.base_gem_id,
            skill_template_id=template.template_id,
            tags=template.tags,
            base_damage=template.base_damage,
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
            base_release_interval_ms=template.base_release_interval_ms,
            release_interval_ms=release_interval_ms,
            base_cooldown_ms=template.base_cooldown_ms,
            final_cooldown_ms=final_cooldown_ms,
            actual_interval_ms=actual_interval_ms,
            trigger_interval_ms=template.trigger_interval_ms,
            mana_cost=template.mana_cost,
            projectile_count=int(runtime_params["projectile_count"]),
            area_multiplier=area_multiplier,
            speed_multiplier=speed_multiplier,
            applied_modifiers=modifiers,
            skill_package_id=template.skill_package_id,
            skill_package_version=template.skill_package_version,
            behavior_template=template.behavior_template,
            cast=dict(template.cast),
            hit=dict(template.hit),
            runtime_params=runtime_params,
            presentation_keys=dict(template.presentation_keys),
            source_context={
                "active_gem_instance_id": active.instance_id,
                "base_gem_id": active.base_gem_id,
                "gem_kind": active.gem_kind,
                "sudoku_digit": active.sudoku_digit,
            },
            skill_stats=skill_stats,
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

        for modifier in applied:
            if modifier.layer not in {"additive", "final"}:
                continue
            if not self._stat_can_enter_skill_context(modifier.stat):
                continue
            if modifier.stat in BOOLEAN_SKILL_STATS:
                result[modifier.stat] = bool(result.get(modifier.stat, False) or modifier.value)
                continue
            result[modifier.stat] = self._numeric_stat(result, modifier.stat) + modifier.value
        return result

    def _stat_can_enter_skill_context(self, stat: str) -> bool:
        if stat not in self.scaling_rules.stat_layers:
            return False
        if self.player_runtime_stat_ids is not None and stat not in self.player_runtime_stat_ids:
            return False
        return True

    def _increase_pool(self, stats: dict[str, Any], template: SkillTemplate) -> float:
        pool = (
            self._numeric_stat(stats, "damage_add_percent")
            + self._numeric_stat(stats, "hit_damage_add_percent")
            + self._numeric_stat(stats, "all_damage_type_add_percent")
        )
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
        return self._numeric_stat(aggregate_player_stats(self.player_base_stats).values, stat)


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


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return min(maximum, max(minimum, value))
