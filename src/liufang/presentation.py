from __future__ import annotations

from dataclasses import dataclass
from math import dist
from pathlib import Path
from typing import Any

from .combat import CombatSession, DroppedGem
from .config import (
    AffixDefinition,
    GemDefinition,
    SkillScalingRules,
    SkillTemplate,
    load_affix_definitions,
    load_gem_definitions,
    load_localization,
    load_skill_scaling_rules,
    load_skill_templates,
)
from .gem_board import BoardIssue, GemRelation, SudokuGemBoard
from .inventory import AffixRoll, GemInstance
from .skill_effects import AppliedModifier, FinalSkillInstance


@dataclass(frozen=True)
class Localizer:
    strings: dict[str, str]

    def text(self, key: str) -> str:
        value = self.strings.get(key)
        if value:
            return value
        return f"未配置文案：{key}"

    def format(self, key: str, **values: Any) -> str:
        return self.text(key).format(**values)


@dataclass
class PresentationService:
    localizer: Localizer
    definitions: dict[str, GemDefinition]
    skill_templates: dict[str, SkillTemplate]
    scaling_rules: SkillScalingRules
    affix_definitions: dict[str, AffixDefinition]

    @classmethod
    def from_configs(cls, config_root: Path) -> "PresentationService":
        affixes = load_affix_definitions(config_root)
        return cls(
            localizer=Localizer(load_localization(config_root)),
            definitions=load_gem_definitions(config_root),
            skill_templates=load_skill_templates(config_root),
            scaling_rules=load_skill_scaling_rules(config_root),
            affix_definitions={definition.affix_id: definition for definition in affixes},
        )

    def gem_detail(
        self,
        instance: GemInstance,
        *,
        board: SudokuGemBoard | None = None,
        final_skills: tuple[FinalSkillInstance, ...] = (),
    ) -> dict[str, Any]:
        definition = self.definitions[instance.base_gem_id]
        detail = {
            "instance_id": instance.instance_id,
            "name_text": self.localizer.text(definition.name_key),
            "description_text": self._gem_description_text(definition),
            "category_text": self._gem_category_text(definition),
            "gem_type": self._gem_type_view(instance.gem_type),
            "gem_kind": instance.gem_kind,
            "gem_kind_text": self._gem_kind_text(instance.gem_kind),
            "sudoku_digit": instance.sudoku_digit,
            "rarity_text": self.localizer.text(f"rarity.{instance.rarity}.name"),
            "level": instance.level,
            "locked": instance.locked,
            "board_position": self._position_view(instance.board_position),
            "tags": [self._tag_view(tag) for tag in sorted(instance.tags)],
            "base_effect": self._base_effect_view(definition),
            "can_affect": self._apply_filter_view(definition),
            "current_effective_targets": self._current_effective_targets(instance, final_skills),
            "board_relations": self._relations_for_instance(instance, board) if board is not None else [],
            "visual_effect": definition.visual_effect,
            "shape_effect": definition.shape_effect,
            "shape_effect_text": self._shape_effect_text(definition.shape_effect),
        }
        detail["tooltip_view"] = self._gem_tooltip_view(instance, detail, final_skills)
        return detail

    def board_view(
        self,
        board: SudokuGemBoard,
        *,
        final_skills: tuple[FinalSkillInstance, ...] = (),
    ) -> dict[str, Any]:
        runtime_view = board.view()
        validation = runtime_view.validation
        prompts = [self._issue_text(issue) for issue in validation.issues]
        if validation.enter_combat_error_key:
            prompts.append(self.localizer.text(validation.enter_combat_error_key))
        if not prompts:
            prompts.append(self.localizer.text("ui.board.valid"))

        return {
            "cells": self._cells_view(board),
            "boxes": self._boxes_view(board),
            "placed_gems": [
                self._placed_gem_view(board.inventory.require(instance_id))
                for instance_id in runtime_view.cells.values()
            ],
            "is_valid": validation.is_valid,
            "can_enter_combat": validation.can_enter_combat,
            "prompts": prompts,
            "highlights": self._highlights_view(runtime_view.highlights),
            "influence_preview": self._influence_preview(board),
            "skill_preview": [self.skill_preview(skill) for skill in final_skills],
        }

    def skill_preview(self, skill: FinalSkillInstance) -> dict[str, Any]:
        definition = self.definitions[skill.base_gem_id]
        template = self.skill_templates[skill.skill_template_id]
        return {
            "active_gem_instance_id": skill.active_gem_instance_id,
            "name_text": self.localizer.text(definition.name_key),
            "skill_template_id": skill.skill_template_id,
            "skill_package_id": skill.skill_package_id,
            "skill_package_version": skill.skill_package_version,
            "template_text": self.localizer.text(template.name_key),
            "damage_type": skill.damage_type,
            "behavior_type": skill.behavior_type,
            "behavior_template": skill.behavior_template,
            "visual_effect": skill.visual_effect,
            "cast": dict(skill.cast or {}),
            "hit": dict(skill.hit or {}),
            "runtime_params": dict(skill.runtime_params or {}),
            "presentation_keys": dict(skill.presentation_keys or {}),
            "source_context": dict(skill.source_context or {}),
            "shape_effects": [
                {"id": effect, "text": self._shape_effect_text(effect)}
                for effect in skill.shape_effects
            ],
            "labels": {
                "base_damage": self.localizer.text("ui.skill.base_damage"),
                "final_damage": self.localizer.text("ui.skill.final_damage"),
                "expected_hit_damage": self.localizer.text("ui.skill.expected_hit_damage"),
                "preview_dps": self.localizer.text("ui.skill.preview_dps"),
                "base_release_interval_ms": self.localizer.text("ui.skill.base_release_interval_ms"),
                "release_interval_ms": self.localizer.text("ui.skill.release_interval_ms"),
                "base_cooldown_ms": self.localizer.text("ui.skill.base_cooldown_ms"),
                "final_cooldown_ms": self.localizer.text("ui.skill.final_cooldown_ms"),
                "actual_interval_ms": self.localizer.text("ui.skill.actual_interval_ms"),
                "trigger_interval_ms": self.localizer.text("ui.skill.trigger_interval_ms"),
                "mana_cost": self.localizer.text("ui.skill.mana_cost"),
                "projectile_count": self.localizer.text("ui.skill.projectile_count"),
                "area_multiplier": self.localizer.text("ui.skill.area_multiplier"),
                "speed_multiplier": self.localizer.text("ui.skill.speed_multiplier"),
            },
            "base_damage": skill.base_damage,
            "final_damage": skill.final_damage,
            "non_crit_damage": skill.non_crit_damage,
            "increase_pool": skill.increase_pool,
            "final_pool": skill.final_pool,
            "crit_chance": skill.crit_chance,
            "crit_multiplier": skill.crit_multiplier,
            "expected_hit_damage": skill.expected_hit_damage,
            "uses_per_second": skill.uses_per_second,
            "hit_coverage_factor": skill.hit_coverage_factor,
            "preview_dps": skill.preview_dps,
            "base_release_interval_ms": skill.base_release_interval_ms,
            "release_interval_ms": skill.release_interval_ms,
            "base_cooldown_ms": skill.base_cooldown_ms,
            "final_cooldown_ms": skill.final_cooldown_ms,
            "actual_interval_ms": skill.actual_interval_ms,
            "trigger_interval_ms": skill.trigger_interval_ms,
            "mana_cost": skill.mana_cost,
            "projectile_count": skill.projectile_count,
            "area_multiplier": skill.area_multiplier,
            "speed_multiplier": skill.speed_multiplier,
            "tags": [self._tag_view(tag) for tag in sorted(skill.tags)],
            "applied_modifiers": [
                self._modifier_view(modifier) for modifier in skill.applied_modifiers
            ],
            "skill_stats": dict(skill.skill_stats or {}),
        }

    def combat_hud(self, session: CombatSession) -> dict[str, Any]:
        cooldowns = getattr(session, "_cooldowns", {})
        return {
            "player_life": {
                "label_text": self.localizer.text("ui.hud.player_life"),
                "current": session.player.current_life,
                "max": session.player.max_life,
            },
            "elapsed_ms": {
                "label_text": self.localizer.text("ui.hud.elapsed_ms"),
                "value": session.elapsed_ms,
            },
            "alive_monsters": {
                "label_text": self.localizer.text("ui.hud.alive_monsters"),
                "value": sum(1 for monster in session.monsters if monster.is_alive),
            },
            "player_stats": {
                "move_speed": {
                    "label_text": self.localizer.text("ui.hud.move_speed"),
                    "value": session.player.move_speed,
                },
            },
            "active_skills": [
                {
                    "name_text": self.localizer.text(self.definitions[cooldown.skill.base_gem_id].name_key),
                    "remaining_ms": cooldown.remaining_ms,
                    "status_text": self.localizer.text(
                        getattr(session, "_last_release_skip_reasons", {}).get(cooldown.skill.active_gem_instance_id)
                        or ("ui.skill.ready" if cooldown.remaining_ms == 0 else "ui.skill.cooldown")
                    ),
                    "mana_cost": cooldown.skill.mana_cost,
                }
                for cooldown in cooldowns.values()
            ],
            "drop_prompts": [self.drop_prompt(dropped) for dropped in session.dropped_gems],
            "pickup_prompts": [self._pickup_prompt(session, dropped) for dropped in session.dropped_gems],
        }

    def drop_prompt(self, dropped: DroppedGem) -> dict[str, Any]:
        definition = self.definitions[dropped.gem_instance.base_gem_id]
        return {
            "drop_id": dropped.drop_id,
            "name_text": self.localizer.text(definition.name_key),
            "rarity_text": self.localizer.text(f"rarity.{dropped.gem_instance.rarity}.name"),
            "picked_up": dropped.picked_up,
            "status_text": self.localizer.text(
                "ui.drop.picked" if dropped.picked_up else "ui.drop.not_picked"
            ),
            "inventory_result_text": self.localizer.text(
                "ui.pickup.success" if dropped.picked_up else "ui.pickup.pending"
            ),
        }

    def _gem_type_view(self, gem_type: str) -> dict[str, Any]:
        number = gem_type.rsplit("_", 1)[-1]
        return {
            "id": gem_type,
            "number": int(number),
            "display_text": self.localizer.text(f"gem_type.{number}.name"),
            "identity_text": self.localizer.text(f"ui.gem_type.{number}.identity"),
            "color_key": self._gem_color_key(int(number)),
        }

    def _gem_category_text(self, definition: GemDefinition) -> str:
        return self._gem_kind_text(definition.gem_kind)

    def _gem_kind_text(self, gem_kind: str) -> str:
        if gem_kind == "active_skill":
            return self.localizer.text("tag.active_skill_gem.name")
        if gem_kind == "passive_skill":
            return self.localizer.text("tag.passive_skill_gem.name")
        if gem_kind == "support":
            return self.localizer.text("tag.support_gem.name")
        return gem_kind

    def _tag_view(self, tag: str) -> dict[str, str]:
        return {"id": tag, "text": self.localizer.text(f"tag.{tag}.name")}

    def _base_effect_view(self, definition: GemDefinition) -> dict[str, Any]:
        if definition.skill_template_id:
            template = self.skill_templates[definition.skill_template_id]
            return {
                "title_text": self.localizer.text("ui.gem.base_skill_effect"),
                "template_text": self.localizer.text(template.name_key),
                "damage_type_text": self.localizer.text(f"damage_type.{template.damage_type}.name"),
                "base_damage": template.base_damage,
                "base_release_interval_ms": template.base_release_interval_ms,
                "base_cooldown_ms": template.base_cooldown_ms,
                "trigger_interval_ms": template.trigger_interval_ms,
                "mana_cost": template.mana_cost,
                "scaling_stats": [self._stat_view(stat) for stat in template.scaling_stats],
            }

        if definition.is_passive_skill:
            return {
                "title_text": self.localizer.text("ui.gem.passive_effect"),
                "modifiers": [
                    {
                        "stat": self._stat_view(effect.stat),
                        "value": effect.value,
                        "layer_text": self.localizer.text(f"ui.modifier.layer.{effect.layer}"),
                        "target_text": self.localizer.text(
                            "ui.gem.self_stat_target"
                            if effect.target == "self_stat"
                            else "ui.gem.active_target"
                        ),
                    }
                    for effect in definition.passive_effects
                ],
            }

        modifiers = [
            modifier
            for modifier in self.scaling_rules.support_base_modifiers
            if modifier.support_id == definition.base_gem_id
        ]
        view = {
            "title_text": self.localizer.text("ui.gem.support_effect"),
            "modifiers": [
                {
                    "stat": self._stat_view(modifier.stat),
                    "value": modifier.value,
                    "layer_text": self.localizer.text(f"ui.modifier.layer.{modifier.layer}"),
                }
                for modifier in modifiers
            ],
        }
        if definition.shape_effect:
            view["shape_effect"] = definition.shape_effect
            view["shape_effect_text"] = self._shape_effect_text(definition.shape_effect)
        return view

    def _affix_roll_view(self, roll: AffixRoll) -> dict[str, Any]:
        definition = self.affix_definitions.get(roll.affix_id)
        return {
            "affix_id": roll.affix_id,
            "name_text": self.localizer.text(definition.name_key) if definition else self.localizer.text("ui.affix.unknown"),
            "description_text": self.localizer.text(definition.description_key) if definition else self.localizer.text("ui.affix.unknown"),
            "gen_text": self.localizer.text(f"ui.affix.gen.{roll.gen}"),
            "stat": self._stat_view(roll.stat),
            "value": roll.value,
            "group_text": self.localizer.text(f"affix_group.{roll.group}.name"),
        }

    def _stat_view(self, stat: str) -> dict[str, str]:
        prefix = "routing_stat" if stat.startswith(("source_power_", "target_power_")) else "stat"
        return {"id": stat, "text": self.localizer.text(f"{prefix}.{stat}.name")}

    def _shape_effect_text(self, shape_effect: str) -> str:
        if not shape_effect:
            return ""
        return self.localizer.text(f"shape_effect.{shape_effect}.name")

    def _gem_description_text(self, definition: GemDefinition) -> str:
        values: dict[str, Any] = {}
        if definition.skill_template_id:
            template = self.skill_templates.get(definition.skill_template_id)
            if template:
                for key, value in template.runtime_params.items():
                    values[key] = self._format_number(value)
                    values[f"{key}_text"] = self._count_text(value, self._counter_for_param(key))
        for effect in definition.passive_effects:
            values[effect.stat] = self._format_number(effect.value)
            values[f"{effect.stat}_text"] = self._count_text(effect.value, self._counter_for_param(effect.stat))
        for modifier in self.scaling_rules.support_base_modifiers:
            if modifier.support_id != definition.base_gem_id:
                continue
            values[modifier.stat] = self._format_number(modifier.value)
            values[f"{modifier.stat}_abs"] = self._format_number(abs(modifier.value))
            values[f"{modifier.stat}_text"] = self._count_text(modifier.value, self._counter_for_param(modifier.stat))
        for amplifier in self.scaling_rules.conduit_amplifiers:
            if amplifier.support_id != definition.base_gem_id:
                continue
            values["conduit_multiplier"] = self._format_number(amplifier.multiplier)
            values["conduit_bonus_percent"] = self._format_number((amplifier.multiplier - 1) * 100)
        try:
            return self.localizer.format(definition.description_key, **values)
        except (KeyError, ValueError):
            return self.localizer.text(definition.description_key)

    def _counter_for_param(self, param: str) -> str:
        if "projectile_count" in param:
            return "枚"
        return ""

    def _count_text(self, value: Any, counter: str) -> str:
        if not counter:
            return self._format_number(value)
        number = int(value) if isinstance(value, (int, float)) and float(value).is_integer() else value
        text = {
            0: "零",
            1: "一",
            2: "两",
            3: "三",
            4: "四",
            5: "五",
            6: "六",
            7: "七",
            8: "八",
            9: "九",
            10: "十",
        }.get(number, self._format_number(value))
        return f"{text}{counter}"

    def _apply_filter_view(self, definition: GemDefinition) -> dict[str, Any]:
        if definition.is_active_skill:
            return {"summary_text": self.localizer.text("ui.gem.affects_self"), "tags_any": [], "tags_all": [], "tags_none": []}
        if definition.is_passive_skill:
            return {
                "summary_text": self.localizer.text("ui.gem.affects_active_targets"),
                "target_kinds": [self._gem_kind_text(kind) for kind in sorted(definition.apply_filter_target_kinds)],
                "tags_any": [self._tag_view(tag) for tag in sorted(definition.apply_filter_tags_any)],
                "tags_all": [self._tag_view(tag) for tag in sorted(definition.apply_filter_tags_all)],
                "tags_none": [self._tag_view(tag) for tag in sorted(definition.apply_filter_tags_none)],
            }
        return {
            "summary_text": self.localizer.text("ui.gem.affects_active_or_passive")
            if "passive_skill" in definition.apply_filter_target_kinds
            else self.localizer.text("ui.gem.affects_filtered_targets"),
            "target_kinds": [self._gem_kind_text(kind) for kind in sorted(definition.apply_filter_target_kinds)],
            "tags_any": [self._tag_view(tag) for tag in sorted(definition.apply_filter_tags_any)],
            "tags_all": [self._tag_view(tag) for tag in sorted(definition.apply_filter_tags_all)],
            "tags_none": [self._tag_view(tag) for tag in sorted(definition.apply_filter_tags_none)],
        }

    def _gem_tooltip_view(
        self,
        instance: GemInstance,
        detail: dict[str, Any],
        final_skills: tuple[FinalSkillInstance, ...],
    ) -> dict[str, Any]:
        final_skill = next(
            (skill for skill in final_skills if skill.active_gem_instance_id == instance.instance_id),
            None,
        )
        if instance.is_active_skill:
            return self._active_skill_tooltip_view(instance, detail, final_skill)
        if instance.is_passive_skill:
            return self._passive_skill_tooltip_view(instance, detail)
        if "support_gem" in instance.tags:
            return self._support_gem_tooltip_view(instance, detail)

        tags = self._unique_tooltip_tags(
            [
                {"id": "category", "text": detail["category_text"], "tone": "category"},
                {"id": detail["gem_type"]["id"], "text": detail["gem_type"]["display_text"], "tone": "type"},
                *detail["tags"],
            ]
        )
        return {
            "icon_text": detail["name_text"][:1],
            "icon_color_key": detail["gem_type"]["color_key"],
            "icon_sprite": "",
            "name_text": detail["name_text"],
            "subtitle_text": f"{detail['category_text']} · {detail['rarity_text']} · {detail['gem_type']['display_text']}",
            "type_identity_text": detail["gem_type"]["identity_text"],
            "tags": tags,
            "sections": {
                "description": {
                    "title_text": self.localizer.text("ui.tooltip.section.description"),
                    "lines": [detail["description_text"], detail["can_affect"]["summary_text"]],
                },
                "stats": {
                    "title_text": self.localizer.text("ui.tooltip.section.stats"),
                    "lines": self._tooltip_stat_lines(instance, detail, final_skill),
                },
                "current_targets": {
                    "title_text": self.localizer.text("ui.tooltip.section.current_targets"),
                    "lines": self._tooltip_target_lines(detail["current_effective_targets"]),
                },
                "rules": {
                    "title_text": self.localizer.text("ui.tooltip.section.rules"),
                    "lines": self._tooltip_rule_lines(detail),
                },
            },
        }

    def _support_gem_tooltip_view(
        self,
        instance: GemInstance,
        detail: dict[str, Any],
    ) -> dict[str, Any]:
        return {
            "variant": "support",
            "icon_text": detail["name_text"][:1],
            "icon_color_key": detail["gem_type"]["color_key"],
            "icon_sprite": "",
            "name_text": detail["name_text"],
            "subtitle_text": "",
            "type_identity_text": "",
            "tags": [],
            "summary_lines": [
                self._join_segments(
                    [
                        *self._gem_color_segments(detail["gem_type"]["number"]),
                        {"text": "、", "tone": "muted"},
                        {"text": self.localizer.text("tag.gem.name"), "tone": "muted"},
                    ]
                )
            ],
            "sections": {
                "description": {
                    "rich_lines": [self._highlight_terms(detail["description_text"])],
                },
                "conditions": {
                    "rich_lines": [
                        self._join_segments(
                            [
                                {"text": self.localizer.text("ui.tooltip.support.target_prefix"), "tone": "label"},
                                *self._support_target_segments(detail["can_affect"]),
                            ]
                        ),
                        self._join_segments(
                            [
                                {"text": self.localizer.text("ui.tooltip.support.connection_prefix"), "tone": "label"},
                                {"text": self.localizer.text("ui.tooltip.support.connections"), "tone": "muted"},
                            ]
                        ),
                    ],
                },
                "support_rules": {
                    "rich_lines": [
                        [{"text": self.localizer.text("ui.tooltip.support.sudoku_rule"), "tone": "rule"}]
                    ],
                },
                "base_bonuses": {
                    "rich_lines": self._support_bonus_lines(detail["base_effect"]),
                },
            },
        }

    def _passive_skill_tooltip_view(
        self,
        instance: GemInstance,
        detail: dict[str, Any],
    ) -> dict[str, Any]:
        tags = self._active_tooltip_tags(detail["tags"])
        sections: dict[str, Any] = {
            "description": {
                "title_text": self.localizer.text("ui.tooltip.section.description"),
                "lines": [detail["description_text"]],
            },
            "stats": {
                "title_text": self.localizer.text("ui.tooltip.section.stats"),
                "lines": self._tooltip_stat_lines(instance, detail, None),
            },
        }
        bonus_lines = [
            f"{modifier['target_text']}：{modifier['stat']['text']} {self._format_modifier_value(modifier['stat']['id'], modifier['value'])}"
            for modifier in detail["base_effect"].get("modifiers", [])
        ]
        shape_effect_text = detail["base_effect"].get("shape_effect_text", "")
        if shape_effect_text:
            bonus_lines.append(f"{self.localizer.text('ui.tooltip.shape_effect')}：{shape_effect_text}")
        bonus_lines.append(self.localizer.text("ui.tooltip.support.sudoku_rule"))
        sections["bonuses"] = {
            "title_text": self.localizer.text("ui.tooltip.section.current_bonus"),
            "lines": bonus_lines,
        }
        return {
            "variant": "passive",
            "icon_text": detail["name_text"][:1],
            "icon_color_key": detail["gem_type"]["color_key"],
            "icon_sprite": "",
            "name_text": detail["name_text"],
            "subtitle_text": self._active_tooltip_subtitle_text(detail, tags),
            "type_identity_text": "",
            "tags": tags,
            "sections": sections,
        }

    def _active_skill_tooltip_view(
        self,
        instance: GemInstance,
        detail: dict[str, Any],
        final_skill: FinalSkillInstance | None,
    ) -> dict[str, Any]:
        tags = self._active_tooltip_tags(detail["tags"])
        sections: dict[str, Any] = {
            "description": {
                "title_text": self.localizer.text("ui.tooltip.section.description"),
                "lines": [detail["description_text"]],
            },
            "stats": {
                "title_text": self.localizer.text("ui.tooltip.section.stats"),
                "lines": self._active_tooltip_stat_lines(instance, detail, final_skill),
            },
            "recent_dps": {
                "title_text": self.localizer.text("ui.tooltip.section.recent_dps"),
                "lines": self._active_tooltip_dps_lines(final_skill),
            },
            "base_skill_level": {
                "lines": [
                    self.localizer.format(
                        "ui.tooltip.base_skill_level",
                        level=instance.level,
                    )
                ],
            },
        }
        bonus_lines = self._active_tooltip_bonus_lines(final_skill)
        bonus_lines.append(self.localizer.text("ui.tooltip.support.sudoku_rule"))
        sections["bonuses"] = {
            "title_text": self.localizer.text("ui.tooltip.section.current_bonus"),
            "lines": bonus_lines,
        }
        return {
            "variant": "active",
            "icon_text": detail["name_text"][:1],
            "icon_color_key": detail["gem_type"]["color_key"],
            "icon_sprite": "",
            "name_text": detail["name_text"],
            "subtitle_text": self._active_tooltip_subtitle_text(detail, tags),
            "type_identity_text": "",
            "tags": tags,
            "sections": sections,
        }

    def _unique_tooltip_tags(self, tags: list[dict[str, Any]]) -> list[dict[str, Any]]:
        seen: set[str] = set()
        result: list[dict[str, Any]] = []
        for tag in tags:
            text = tag["text"]
            if text in seen:
                continue
            seen.add(text)
            result.append(tag)
        return result

    def _active_tooltip_subtitle_text(self, detail: dict[str, Any], tags: list[dict[str, str]]) -> str:
        color_text = self.localizer.text(f"ui.gem_color.{self._gem_color_key(detail['gem_type']['number'])}")
        return "、".join([color_text, *(tag["text"] for tag in tags)])

    def _join_segments(self, segments: list[dict[str, str]]) -> list[dict[str, str]]:
        return [segment for segment in segments if segment["text"]]

    def _gem_color_segments(self, gem_type_number: int) -> list[dict[str, str]]:
        color_key = self._gem_color_key(gem_type_number)
        return [
            {
                "text": self.localizer.text(f"ui.gem_color.{color_key}"),
                "tone": f"color-{color_key}",
            }
        ]

    def _gem_color_key(self, gem_type_number: int) -> str:
        return {
            1: "red",
            2: "blue",
            3: "green",
            4: "pink",
            5: "yellow",
            6: "white",
            7: "black",
            8: "cyan",
            9: "orange",
        }.get(gem_type_number, "white")

    def _support_target_segments(self, can_affect: dict[str, Any]) -> list[dict[str, str]]:
        tags = can_affect["tags_any"] or can_affect["tags_all"]
        target_kinds = can_affect.get("target_kinds", [])
        if not tags and target_kinds:
            return [{"text": "或".join(target_kinds), "tone": "muted"}]
        if not tags:
            return [{"text": self.localizer.text("tag.gem.name"), "tone": "muted"}]
        segments: list[dict[str, str]] = []
        for index, tag in enumerate(tags):
            if index:
                segments.append({"text": "、", "tone": "muted"})
            segments.extend(self._tag_target_segments(tag))
        if not any(segment["text"] == self.localizer.text("tag.gem.name") for segment in segments):
            segments.append({"text": " ", "tone": "muted"})
            segments.append({"text": self.localizer.text("tag.gem.name"), "tone": "muted"})
        return segments

    def _tag_target_segments(self, tag: dict[str, str]) -> list[dict[str, str]]:
        tag_id = tag["id"]
        if tag_id in {"active_skill_gem", "passive_skill_gem"}:
            return [{"text": self.localizer.text("tag.gem.name"), "tone": "muted"}]
        if tag_id.startswith("gem_type_"):
            number = int(tag_id.rsplit("_", 1)[-1])
            return self._gem_color_segments(number)
        return self._highlight_terms(tag["text"])

    def _support_bonus_lines(self, base_effect: dict[str, Any]) -> list[list[dict[str, str]]]:
        lines: list[list[dict[str, str]]] = []
        for modifier in base_effect.get("modifiers", []):
            value = modifier["value"]
            if value is None or value == 0:
                continue
            tone = "bonus-positive" if value > 0 else "bonus-negative"
            lines.append(
                [
                    {
                        "text": f"{modifier['stat']['text']} {self._format_support_bonus_value(modifier['stat']['id'], value)}",
                        "tone": tone,
                    }
                ]
            )
        return lines

    def _format_support_bonus_value(self, stat: str, value: float) -> str:
        if stat == "conduit_multiplier":
            return f"×{self._format_number(value)}"
        if stat.endswith("_percent"):
            return self._format_number(value) + "%"
        return self._format_number(value)

    def _highlight_terms(self, text: str) -> list[dict[str, str]]:
        terms = [
            ("红色", "color-red"),
            ("蓝色", "color-blue"),
            ("绿色", "color-green"),
            ("粉色", "color-pink"),
            ("黄色", "color-yellow"),
            ("白色", "color-white"),
            ("黑色", "color-black"),
            ("青色", "color-cyan"),
            ("橙色", "color-orange"),
            ("火焰", "damage-fire"),
            ("冰霜", "damage-cold"),
            ("闪电", "damage-lightning"),
            ("物理", "damage-physical"),
            ("混沌", "damage-chaos"),
            ("宝石", "muted"),
        ]
        segments: list[dict[str, str]] = []
        index = 0
        while index < len(text):
            match = next(
                ((term, tone) for term, tone in terms if text.startswith(term, index)),
                None,
            )
            if match is None:
                next_index = min(
                    [text.find(term, index + 1) for term, _tone in terms if text.find(term, index + 1) >= 0]
                    or [len(text)]
                )
                segments.append({"text": text[index:next_index], "tone": "body"})
                index = next_index
                continue
            term, tone = match
            segments.append({"text": term, "tone": tone})
            index += len(term)
        return segments

    def _active_tooltip_tags(self, tags: list[dict[str, str]]) -> list[dict[str, str]]:
        hidden = {"active_skill_gem", "passive_skill_gem", "loot_gem"}
        visible = [
            tag
            for tag in tags
            if tag["id"] not in hidden and not tag["id"].startswith(("gem_type_", "skill_"))
        ]
        order = {
            tag_id: index
            for index, tag_id in enumerate(
                [
                    "gem",
                    "bow",
                    "melee",
                    "ranged",
                    "attack",
                    "spell",
                    "summon",
                    "physical",
                    "fire",
                    "cold",
                    "lightning",
                    "projectile",
                    "area",
                    "chain",
                    "pierce",
                    "orbit",
                    "nova",
                    "dot",
                    "trap_or_mine",
                ]
            )
        }
        return self._unique_tooltip_tags(sorted(visible, key=lambda tag: order.get(tag["id"], 999)))

    def _active_tooltip_stat_lines(
        self,
        instance: GemInstance,
        detail: dict[str, Any],
        final_skill: FinalSkillInstance | None,
    ) -> list[dict[str, str]]:
        lines = self._non_empty_stat_lines(
            [
                {
                    "label_text": self.localizer.text("ui.tooltip.level"),
                    "value_text": str(instance.level),
                }
                if instance.level
                else None
            ]
        )
        base_effect = detail["base_effect"]
        if "base_damage" not in base_effect:
            return lines

        tags = final_skill.tags if final_skill is not None else frozenset(tag["id"] for tag in detail["tags"])
        base_damage = float(base_effect["base_damage"])
        damage = final_skill.final_damage if final_skill is not None else base_damage
        damage_delta = damage - base_damage
        lines.extend(
            self._non_empty_stat_lines(
                [
                    {
                        "label_text": self._active_damage_label(tags),
                        "value_text": self._format_with_delta(damage, damage_delta),
                    },
                    self._cooldown_line(base_effect, final_skill),
                    self._actual_interval_line(final_skill),
                    self._mana_cost_line(base_effect, final_skill),
                    self._projectile_line(final_skill, tags),
                    self._area_line(final_skill, tags),
                    self._speed_line(final_skill),
                ]
            )
        )
        return lines

    def _active_tooltip_dps_lines(self, final_skill: FinalSkillInstance | None) -> list[dict[str, str]]:
        if final_skill is None or final_skill.actual_interval_ms <= 0:
            return []
        return [
            {
                "label_text": self.localizer.text("ui.tooltip.recent_dps"),
                "value_text": self._format_number(final_skill.preview_dps),
            }
        ]

    def _active_tooltip_bonus_lines(self, final_skill: FinalSkillInstance | None) -> list[str]:
        if final_skill is None:
            return []
        return [
            self._modifier_effect_text(modifier)
            for modifier in final_skill.applied_modifiers
            if modifier.applied and modifier.value != 0
        ]

    def _active_damage_label(self, tags: frozenset[str]) -> str:
        if "attack" in tags:
            return self.localizer.text("ui.tooltip.stat.attack_damage")
        if "spell" in tags:
            return self.localizer.text("ui.tooltip.stat.spell_damage")
        return self.localizer.text("ui.tooltip.stat.skill_damage")

    def _cooldown_line(
        self,
        base_effect: dict[str, Any],
        final_skill: FinalSkillInstance | None,
    ) -> dict[str, str] | None:
        base_cooldown = float(base_effect["base_cooldown_ms"])
        cooldown = final_skill.final_cooldown_ms if final_skill is not None else base_cooldown
        if cooldown <= 0:
            return None
        return {
            "label_text": self.localizer.text("ui.tooltip.stat.cooldown"),
            "value_text": self._format_with_delta(cooldown, cooldown - base_cooldown, suffix=self.localizer.text("ui.tooltip.unit.ms")),
        }

    def _actual_interval_line(self, final_skill: FinalSkillInstance | None) -> dict[str, str] | None:
        if final_skill is None or final_skill.actual_interval_ms <= 0:
            return None
        return {
            "label_text": self.localizer.text("ui.skill.actual_interval_ms"),
            "value_text": self._format_number(final_skill.actual_interval_ms) + self.localizer.text("ui.tooltip.unit.ms"),
        }

    def _mana_cost_line(
        self,
        base_effect: dict[str, Any],
        final_skill: FinalSkillInstance | None,
    ) -> dict[str, str] | None:
        mana_cost = final_skill.mana_cost if final_skill is not None else int(base_effect.get("mana_cost", 0))
        if mana_cost <= 0:
            return None
        return {
            "label_text": self.localizer.text("ui.skill.mana_cost"),
            "value_text": self._format_number(mana_cost),
        }

    def _projectile_line(
        self,
        final_skill: FinalSkillInstance | None,
        tags: frozenset[str],
    ) -> dict[str, str] | None:
        if final_skill is None or "projectile" not in tags or final_skill.projectile_count <= 0:
            return None
        return {
            "label_text": self.localizer.text("ui.skill.projectile_count"),
            "value_text": str(final_skill.projectile_count),
        }

    def _area_line(
        self,
        final_skill: FinalSkillInstance | None,
        tags: frozenset[str],
    ) -> dict[str, str] | None:
        if final_skill is None or not (tags & {"area", "nova", "orbit"}) or final_skill.area_multiplier <= 0:
            return None
        delta = final_skill.area_multiplier - 1
        return {
            "label_text": self.localizer.text("ui.skill.area_multiplier"),
            "value_text": self._format_multiplier_with_delta(final_skill.area_multiplier, delta),
        }

    def _speed_line(self, final_skill: FinalSkillInstance | None) -> dict[str, str] | None:
        if final_skill is None or final_skill.speed_multiplier <= 0:
            return None
        delta_percent = (final_skill.speed_multiplier - 1) * 100
        return {
            "label_text": self.localizer.text("ui.tooltip.stat.skill_speed"),
            "value_text": self.localizer.format(
                "ui.tooltip.value.base_percent",
                value=self._format_number(final_skill.speed_multiplier * 100),
            )
            + (self._delta_text(delta_percent, suffix="%") if delta_percent else ""),
        }

    def _non_empty_stat_lines(self, lines: list[dict[str, str] | None]) -> list[dict[str, str]]:
        return [
            line
            for line in lines
            if line is not None and line["value_text"] not in {"", "0", "0%"}
        ]

    def _modifier_effect_text(self, modifier: AppliedModifier) -> str:
        return f"{self._stat_view(modifier.stat)['text']} {self._format_modifier_value(modifier.stat, modifier.value)}"

    def _format_modifier_value(self, stat: str, value: float) -> str:
        if stat == "conduit_multiplier":
            return f"×{self._format_number(value)}"
        if stat.endswith("_percent"):
            return self._format_number(value, signed=True) + "%"
        return self._format_number(value, signed=True)

    def _format_with_delta(self, value: float, delta: float, *, suffix: str = "") -> str:
        return self._format_number(value) + suffix + self._delta_text(delta, suffix=suffix)

    def _format_multiplier_with_delta(self, value: float, delta: float) -> str:
        return f"{self._format_number(value)}{self._delta_text(delta)}"

    def _delta_text(self, delta: float, *, suffix: str = "") -> str:
        if delta == 0:
            return ""
        return f"（{self._format_number(delta, signed=True)}{suffix}）"

    def _tooltip_stat_lines(
        self,
        instance: GemInstance,
        detail: dict[str, Any],
        final_skill: FinalSkillInstance | None,
    ) -> list[dict[str, str]]:
        lines = [
            {
                "label_text": self.localizer.text("ui.tooltip.level"),
                "value_text": str(instance.level),
            }
        ]
        base_effect = detail["base_effect"]
        if "base_damage" in base_effect:
            lines.extend(
                [
                    {
                        "label_text": self.localizer.text("ui.skill.base_damage"),
                        "value_text": self._format_number(base_effect["base_damage"]),
                    },
                    {
                        "label_text": self.localizer.text("ui.skill.base_release_interval_ms"),
                        "value_text": self._format_number(base_effect["base_release_interval_ms"]),
                    },
                    {
                        "label_text": self.localizer.text("ui.skill.base_cooldown_ms"),
                        "value_text": self._format_number(base_effect["base_cooldown_ms"]),
                    },
                    {
                        "label_text": self.localizer.text("ui.skill.mana_cost"),
                        "value_text": self._format_number(base_effect.get("mana_cost", 0)),
                    },
                    {
                        "label_text": self.localizer.text("ui.tooltip.damage_type"),
                        "value_text": base_effect["damage_type_text"],
                    },
                ]
            )
            if final_skill is not None:
                lines.extend(
                    [
                        {
                            "label_text": self.localizer.text("ui.skill.final_damage"),
                            "value_text": self._format_number(final_skill.final_damage),
                        },
                        {
                            "label_text": self.localizer.text("ui.skill.final_cooldown_ms"),
                            "value_text": self._format_number(final_skill.final_cooldown_ms),
                        },
                        {
                            "label_text": self.localizer.text("ui.skill.actual_interval_ms"),
                            "value_text": self._format_number(final_skill.actual_interval_ms),
                        },
                        {
                            "label_text": self.localizer.text("ui.skill.projectile_count"),
                            "value_text": self._format_number(final_skill.projectile_count),
                        },
                        {
                            "label_text": self.localizer.text("ui.skill.area_multiplier"),
                            "value_text": self._format_number(final_skill.area_multiplier),
                        },
                        {
                            "label_text": self.localizer.text("ui.skill.speed_multiplier"),
                            "value_text": self._format_number(final_skill.speed_multiplier),
                        },
                    ]
                )
            return lines

        for modifier in base_effect.get("modifiers", []):
            target_text = modifier.get("target_text")
            label = f"{modifier['stat']['text']}（{modifier['layer_text']}）"
            if target_text:
                label = f"{target_text}：{label}"
            lines.append(
                {
                    "label_text": label,
                    "value_text": self._format_number(modifier["value"], signed=True),
                }
            )
        return lines

    def _tooltip_target_lines(self, targets: list[dict[str, str]]) -> list[dict[str, str]]:
        return [
            {
                "name_text": target["name_text"],
                "status_text": target["status_text"],
            }
            for target in targets
        ]

    def _tooltip_rule_lines(self, detail: dict[str, Any]) -> list[str]:
        position = detail["board_position"]
        lines = [
            self.localizer.format(
                "ui.tooltip.position.placed",
                row=position["row"] + 1,
                column=position["column"] + 1,
            )
            if position
            else self.localizer.text("ui.tooltip.position.unplaced")
        ]
        lines.extend(
            self.localizer.format(
                "ui.tooltip.relation",
                relation=relation["relation_text"],
                source=relation["source"]["name_text"],
                target=relation["target"]["name_text"],
            )
            for relation in detail["board_relations"]
        )
        return lines

    def _format_number(self, value: int | float, *, signed: bool = False) -> str:
        number = f"{value:g}" if isinstance(value, float) else str(value)
        if signed and value > 0:
            return f"+{number}"
        return number

    def _current_effective_targets(
        self,
        instance: GemInstance,
        final_skills: tuple[FinalSkillInstance, ...],
    ) -> list[dict[str, str]]:
        targets: dict[str, dict[str, str]] = {}
        for skill in final_skills:
            if instance.instance_id == skill.active_gem_instance_id:
                targets[skill.active_gem_instance_id] = {
                    "instance_id": skill.active_gem_instance_id,
                    "name_text": self.localizer.text(self.definitions[skill.base_gem_id].name_key),
                    "status_text": self.localizer.text("ui.effect.active"),
                }
            for modifier in skill.applied_modifiers:
                if modifier.source_instance_id != instance.instance_id or not modifier.applied:
                    continue
                target_base_gem_id = modifier.target_base_gem_id or skill.base_gem_id
                target_definition = self.definitions[target_base_gem_id]
                targets[modifier.target_instance_id] = {
                    "instance_id": modifier.target_instance_id,
                    "name_text": self.localizer.text(target_definition.name_key),
                    "status_text": self.localizer.text("ui.effect.active"),
                }
        if targets:
            return list(targets.values())
        return [{"instance_id": "", "name_text": self.localizer.text("ui.effect.none"), "status_text": self.localizer.text("ui.effect.none")}]

    def _relations_for_instance(
        self,
        instance: GemInstance,
        board: SudokuGemBoard,
    ) -> list[dict[str, Any]]:
        return [
            self._relation_view(board, relation)
            for relation in board.relations()
            if instance.instance_id in {relation.source_instance_id, relation.target_instance_id}
        ]

    def _cells_view(self, board: SudokuGemBoard) -> list[list[dict[str, Any]]]:
        runtime_view = board.view()
        rows: list[list[dict[str, Any]]] = []
        for row in range(board.rules.rows):
            row_cells: list[dict[str, Any]] = []
            for column in range(board.rules.columns):
                instance_id = runtime_view.cells.get((row, column))
                instance = board.inventory.require(instance_id) if instance_id else None
                row_cells.append(
                    {
                        "row": row,
                        "column": column,
                        "box": self._box_index(board, row, column),
                        "gem": self._placed_gem_view(instance) if instance else None,
                    }
                )
            rows.append(row_cells)
        return rows

    def _boxes_view(self, board: SudokuGemBoard) -> list[dict[str, Any]]:
        boxes: list[dict[str, Any]] = []
        boxes_per_row = board.rules.columns // board.rules.box_columns
        total_boxes = boxes_per_row * (board.rules.rows // board.rules.box_rows)
        for box_index in range(total_boxes):
            start_row = (box_index // boxes_per_row) * board.rules.box_rows
            start_column = (box_index % boxes_per_row) * board.rules.box_columns
            cells = [
                {"row": row, "column": column}
                for row in range(start_row, start_row + board.rules.box_rows)
                for column in range(start_column, start_column + board.rules.box_columns)
            ]
            boxes.append({"box": box_index, "label_text": f"{box_index + 1}{self.localizer.text('ui.board.box_suffix')}", "cells": cells})
        return boxes

    def _placed_gem_view(self, instance: GemInstance) -> dict[str, Any]:
        definition = self.definitions[instance.base_gem_id]
        return {
            "instance_id": instance.instance_id,
            "name_text": self.localizer.text(definition.name_key),
            "category_text": self._gem_category_text(definition),
            "gem_type": self._gem_type_view(instance.gem_type),
            "gem_kind": instance.gem_kind,
            "gem_kind_text": self._gem_kind_text(instance.gem_kind),
            "sudoku_digit": instance.sudoku_digit,
            "rarity_text": self.localizer.text(f"rarity.{instance.rarity}.name"),
            "position": self._position_view(instance.board_position),
        }

    def _position_view(self, position: Any) -> dict[str, int] | None:
        if position is None:
            return None
        return {"row": position.row, "column": position.column}

    def _issue_text(self, issue: BoardIssue) -> str:
        return self.localizer.text(issue.error_key)

    def _highlights_view(
        self,
        highlights: dict[str, dict[int | tuple[int, int], tuple[str, ...]]],
    ) -> dict[str, list[dict[str, Any]]]:
        return {
            relation: [
                {
                    "target": target,
                    "relation_text": self.localizer.text(f"relation.{relation}.name"),
                    "instance_ids": instance_ids,
                }
                for target, instance_ids in entries.items()
            ]
            for relation, entries in highlights.items()
        }

    def _influence_preview(self, board: SudokuGemBoard) -> list[dict[str, Any]]:
        return [self._relation_view(board, relation) for relation in board.relations()]

    def _relation_view(self, board: SudokuGemBoard, relation: GemRelation) -> dict[str, Any]:
        source = board.inventory.require(relation.source_instance_id)
        target = board.inventory.require(relation.target_instance_id)
        return {
            "source": self._placed_gem_view(source),
            "target": self._placed_gem_view(target),
            "relation": relation.relation,
            "relation_text": self.localizer.text(f"relation.{relation.relation}.name"),
        }

    def _modifier_view(self, modifier: AppliedModifier) -> dict[str, Any]:
        target_base_gem_id = modifier.target_base_gem_id or ""
        return {
            "source_instance_id": modifier.source_instance_id,
            "source_name_text": self.localizer.text(self.definitions[modifier.source_base_gem_id].name_key),
            "target_instance_id": modifier.target_instance_id,
            "target_name_text": self.localizer.text(self.definitions[target_base_gem_id].name_key)
            if target_base_gem_id in self.definitions
            else "",
            "stat": self._stat_view(modifier.stat)
            if modifier.stat != "conduit_multiplier"
            else {"id": modifier.stat, "text": self.localizer.text("ui.modifier.conduit_multiplier")},
            "value": modifier.value,
            "layer_text": self.localizer.text(f"ui.modifier.layer.{modifier.layer}"),
            "relation": modifier.relation,
            "relation_text": self.localizer.text(f"relation.{modifier.relation}.name")
            if modifier.relation != "self"
            else self.localizer.text("ui.relation.self"),
            "reason_key": modifier.reason_key,
            "reason_text": self.localizer.text(modifier.reason_key),
            "applied": modifier.applied,
            "shape_effect": modifier.shape_effect,
            "shape_effect_text": self._shape_effect_text(modifier.shape_effect),
        }

    def _pickup_prompt(self, session: CombatSession, dropped: DroppedGem) -> dict[str, Any]:
        if dropped.picked_up:
            status_key = "ui.pickup.success"
        elif dist(
            (session.player.position.x, session.player.position.y),
            (dropped.position.x, dropped.position.y),
        ) <= session.player.item_interaction_reach:
            status_key = "ui.pickup.pending"
        else:
            status_key = "ui.pickup.out_of_range"
        return {
            "drop_id": dropped.drop_id,
            "name_text": self.localizer.text(self.definitions[dropped.gem_instance.base_gem_id].name_key),
            "status_text": self.localizer.text(status_key),
        }

    def _box_index(self, board: SudokuGemBoard, row: int, column: int) -> int:
        box_row = row // board.rules.box_rows
        box_column = column // board.rules.box_columns
        boxes_per_row = board.rules.columns // board.rules.box_columns
        return box_row * boxes_per_row + box_column
