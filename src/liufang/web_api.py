from __future__ import annotations

import json
import random
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .affixes import AffixGenerator
from .combat import CombatSession, Monster, Player, Position
from .config import (
    load_affix_definitions,
    load_board_rules,
    load_character_panel_sections,
    load_gem_definitions,
    load_player_base_stats,
    load_player_stat_definitions,
    load_rarity_affix_counts,
    load_relation_coefficients,
    load_skill_scaling_rules,
    load_skill_templates,
)
from .gem_board import SudokuGemBoard
from .inventory import GemInventory, GemInstance
from .loot import LootRuntime
from .presentation import PresentationService
from .player_stats import aggregate_player_stats
from .skill_editor import SkillEditorService
from .skill_effects import FinalSkillInstance, SkillEffectCalculator, SkillEffectError


@dataclass
class V1WebAppApi:
    config_root: Path
    definitions: dict = field(init=False)
    inventory: GemInventory = field(init=False)
    board: SudokuGemBoard = field(init=False)
    presenter: PresentationService = field(init=False)
    skill_editor: SkillEditorService = field(init=False)
    loot_runtime: LootRuntime = field(init=False)
    combat_session: CombatSession | None = None
    logs: list[str] = field(default_factory=list)

    def __post_init__(self) -> None:
        self.definitions = load_gem_definitions(self.config_root)
        self.inventory = GemInventory(self.definitions)
        self.board = SudokuGemBoard(load_board_rules(self.config_root), self.inventory)
        self.presenter = PresentationService.from_configs(self.config_root)
        self.skill_editor = SkillEditorService(self.config_root)
        self.loot_runtime = self._create_loot_runtime()
        self._seed_inventory()

    def state(self) -> dict[str, Any]:
        self._reload_config_backed_services()
        final_skills, skill_error = self._final_skills_or_error()
        board_view = self.presenter.board_view(self.board, final_skills=final_skills)
        inventory = [
            self.presenter.gem_detail(instance, board=self.board, final_skills=final_skills)
            for instance in self.inventory.sort_instances("acquired_order")
        ]
        inventory.append(self._test_item_detail())
        drops = []
        if self.combat_session is not None:
            drops = [self.presenter.drop_prompt(drop) for drop in self.combat_session.dropped_gems]
        player_stats = self._player_stats_view()
        return {
            "inventory": inventory,
            "board": board_view,
            "skill_preview": [self.presenter.skill_preview(skill) for skill in final_skills],
            "skill_error": skill_error,
            "combat": self.presenter.combat_hud(self.combat_session) if self.combat_session else None,
            "drops": drops,
            "logs": list(self.logs),
            "player_stats": player_stats,
            "character_panel": self._character_panel_view(final_skills, player_stats),
            "skill_editor": self.skill_editor.view(),
            "ui_text": {
                "only_gems_on_board": self.presenter.localizer.text("ui.inventory.only_gems_on_board"),
            },
        }

    def mount(self, instance_id: str, row: int, column: int) -> dict[str, Any]:
        self.board.mount_gem(instance_id, row, column)
        instance = self.inventory.require(instance_id)
        self.logs.append(f"已将{self._gem_name(instance)}放入第{row + 1}行第{column + 1}列。")
        return self.state()

    def unmount(self, instance_id: str) -> dict[str, Any]:
        instance = self.inventory.require(instance_id)
        self.board.unmount_gem(instance_id)
        self.logs.append(f"已将{self._gem_name(instance)}从盘面取下。")
        return self.state()

    def start_combat(self) -> dict[str, Any]:
        session = CombatSession.start(
            player=self._new_player("player_1"),
            monsters=[Monster("monster_1", current_life=5, max_life=5, position=Position(1, 0))],
            inventory=self.inventory,
            skill_effect_calculator=self._calculator(),
            loot_runtime=self.loot_runtime,
        )
        events = session.tick(1)
        self.combat_session = session
        self.logs.append("开始战斗。")
        for event in events:
            skill_name = self.presenter.localizer.text(self.definitions[event.skill_instance.base_gem_id].name_key)
            killed_text = "击杀怪物" if event.killed else "命中怪物"
            self.logs.append(f"{skill_name}自动释放，造成{event.damage:.2f}伤害，{killed_text}。")
        for dropped in session.dropped_gems:
            self.logs.append(f"掉落宝石：{self._gem_name(dropped.gem_instance)}。")
        return self.state()

    def pickup(self, drop_id: str) -> dict[str, Any]:
        if self.combat_session is None:
            raise ValueError("当前没有可拾取的掉落。")
        target = next((drop for drop in self.combat_session.dropped_gems if drop.drop_id == drop_id), None)
        if target is None:
            raise ValueError("掉落不存在。")
        if target.picked_up:
            raise ValueError("该宝石已经拾取。")
        picked = self.combat_session.pickup_nearby()
        if not picked:
            raise ValueError("距离太远，无法拾取该宝石。")
        for instance in picked:
            self.logs.append(f"已拾取{self._gem_name(instance)}并加入库存。")
        return self.state()

    def save_skill_package(self, skill_id: str, package: dict[str, Any]) -> dict[str, Any]:
        result = self.skill_editor.save_package(skill_id, package)
        if result["ok"]:
            self._reload_config_backed_services()
            self.combat_session = None
            result["skill_editor"] = self.skill_editor.view()
        state = self.state()
        state["skill_editor"] = result["skill_editor"]
        return {
            "ok": result["ok"],
            "message_text": result["message_text"],
            "state": state,
        }

    def preview_skill_modifier_stack(self, payload: dict[str, Any]) -> dict[str, Any]:
        result = self.skill_editor.preview_modifier_stack(payload)
        return {
            "ok": result["ok"],
            "message_text": result["message_text"],
            "preview": result["preview"],
        }

    def run_skill_test_arena(self, payload: dict[str, Any]) -> dict[str, Any]:
        result = self.skill_editor.run_test_arena(payload)
        return {
            "ok": result["ok"],
            "message_text": result["message_text"],
            "result": result["result"],
        }

    def _reload_config_backed_services(self) -> None:
        self.definitions = load_gem_definitions(self.config_root)
        self.inventory.update_definitions(self.definitions)
        self.presenter = PresentationService.from_configs(self.config_root)
        self.skill_editor = SkillEditorService(self.config_root)

    def _seed_inventory(self) -> None:
        active_seed_ids = [
            base_gem_id
            for base_gem_id, definition in sorted(self.definitions.items())
            if definition.is_active_skill
        ]
        passive_seed_ids = [
            base_gem_id
            for base_gem_id, definition in sorted(self.definitions.items())
            if definition.is_passive_skill
        ]
        support_seed_ids = self._support_seed_ids_by_category()

        for index, base_gem_id in enumerate((gem_id for gem_id in active_seed_ids if gem_id in self.definitions), start=1):
            definition = self.definitions[base_gem_id]
            self._add_seed_gem(
                f"web_seed_active_{index}_{base_gem_id}",
                base_gem_id,
                definition.gem_type,
                rarity="magic" if index == 1 else "normal",
                level=1,
            )
        for index, base_gem_id in enumerate((gem_id for gem_id in passive_seed_ids if gem_id in self.definitions), start=1):
            definition = self.definitions[base_gem_id]
            self._add_seed_gem(
                f"web_seed_passive_{index}_{base_gem_id}",
                base_gem_id,
                definition.gem_type,
                rarity="normal",
                level=1,
            )
        for category, base_gem_ids in support_seed_ids.items():
            for copy_index, base_gem_id in enumerate(base_gem_ids, start=1):
                definition = self.definitions[base_gem_id]
                self._add_seed_gem(
                    f"web_seed_support_{category}_{copy_index}_{base_gem_id}",
                    base_gem_id,
                    definition.gem_type,
                    rarity="normal",
                    level=1,
                )
        self.logs.append("已准备 TLIDB 主动技能宝石、被动/光环宝石，以及按数独分类抽样的辅助宝石。")

    def _support_seed_ids_by_category(self) -> dict[str, list[str]]:
        category_order = [
            "general_skill_modifier",
            "damage_type_enhancer",
            "projectile_area_specialist",
            "risk_reward",
            "skill_level",
            "board_conduit",
            "skill_shape_modifier",
        ]
        ids_by_category: dict[str, list[str]] = {category: [] for category in category_order}
        for base_gem_id, definition in self.definitions.items():
            if definition.is_support and definition.category in ids_by_category:
                ids_by_category[definition.category].append(base_gem_id)
        return {
            category: ids_by_category[category][:3]
            for category in category_order
            if ids_by_category[category]
        }

    def _add_seed_gem(
        self,
        instance_id: str,
        base_gem_id: str,
        gem_type: str,
        *,
        rarity: str,
        level: int,
    ) -> GemInstance:
        definition = self.definitions[base_gem_id]
        tags = frozenset(tag for tag in definition.tags if not tag.startswith("gem_type_")) | {gem_type}
        sudoku_digit = int(gem_type.rsplit("_", 1)[-1])
        return self.inventory.add_existing_instance(
            GemInstance(
                instance_id=instance_id,
                base_gem_id=base_gem_id,
                gem_type=gem_type,
                gem_kind=definition.gem_kind,
                sudoku_digit=sudoku_digit,
                tags=tags,
                rarity=rarity,
                level=level,
            )
        )

    def _final_skills_or_error(self) -> tuple[tuple[FinalSkillInstance, ...], str | None]:
        try:
            return self._calculator().calculate_all(), None
        except SkillEffectError as exc:
            return (), self.presenter.localizer.text(exc.error_key)

    def _calculator(self) -> SkillEffectCalculator:
        affixes = load_affix_definitions(self.config_root)
        return SkillEffectCalculator(
            board=self.board,
            definitions=self.definitions,
            skill_templates=load_skill_templates(self.config_root),
            relation_coefficients=load_relation_coefficients(self.config_root),
            scaling_rules=load_skill_scaling_rules(self.config_root),
            affix_definitions={definition.affix_id: definition for definition in affixes},
            player_runtime_stat_ids=self._player_runtime_stat_ids(),
            player_base_stats=load_player_base_stats(self.config_root),
        )

    def _create_loot_runtime(self) -> LootRuntime:
        seed = 6
        affixes = load_affix_definitions(self.config_root)
        return LootRuntime.from_configs(
            self.config_root,
            self.definitions,
            {"normal": 1},
            AffixGenerator(affixes, load_rarity_affix_counts(self.config_root), random.Random(seed)),
            rng=random.Random(seed),
        )

    def _player_runtime_stat_ids(self) -> frozenset[str]:
        definitions = load_player_stat_definitions(self.config_root)
        return frozenset(
            stat_id
            for stat_id, definition in definitions.items()
            if definition.runtime_effective
        )

    def _new_player(self, player_id: str) -> Player:
        base_stats = aggregate_player_stats(load_player_base_stats(self.config_root)).values
        return Player(
            player_id,
            current_life=float(base_stats.get("current_life", 100)),
            max_life=float(base_stats.get("max_life", 100)),
            position=Position(0, 0),
            item_interaction_reach=2,
            move_speed=float(base_stats.get("move_speed", 1.0)),
            current_mana=float(base_stats.get("current_mana", 0)),
            max_mana=float(base_stats.get("max_mana", 0)),
            life_regen_flat=float(base_stats.get("life_regen_flat", 0)),
            mana_regen_flat=float(base_stats.get("mana_regen_flat", 0)),
            current_energy_shield=float(base_stats.get("current_energy_shield", 0)),
            max_energy_shield=float(base_stats.get("max_energy_shield", 0)),
            energy_shield_charge_speed_percent=float(base_stats.get("energy_shield_charge_speed_percent", 0)),
            energy_shield_charge_delay_ms=int(base_stats.get("energy_shield_charge_delay_ms", 2000)),
            armor=float(base_stats.get("armor", 0)),
            armor_add_percent=float(base_stats.get("armor_add_percent", 0)),
            evasion=float(base_stats.get("evasion", 0)),
            evasion_add_percent=float(base_stats.get("evasion_add_percent", 0)),
            attack_block_chance_percent=float(base_stats.get("attack_block_chance_percent", 0)),
            spell_block_chance_percent=float(base_stats.get("spell_block_chance_percent", 0)),
            block_damage_reduction_percent=float(base_stats.get("block_damage_reduction_percent", 0)),
            damage_mitigation_final_percent=float(base_stats.get("damage_mitigation_final_percent", 0)),
            physical_damage_reduction_percent=float(base_stats.get("physical_damage_reduction_percent", 0)),
            fire_resistance_percent=float(base_stats.get("fire_resistance_percent", 0)),
            cold_resistance_percent=float(base_stats.get("cold_resistance_percent", 0)),
            lightning_resistance_percent=float(base_stats.get("lightning_resistance_percent", 0)),
            chaos_resistance_percent=float(base_stats.get("chaos_resistance_percent", 0)),
            elemental_resistance_percent=float(base_stats.get("elemental_resistance_percent", 0)),
        )

    def _calculated_player_stat_values(self) -> dict[str, Any]:
        base_stats = dict(load_player_base_stats(self.config_root))
        modifiers = self._calculator().calculate_player_stat_modifiers()
        return aggregate_player_stats(base_stats, modifiers).values

    def _player_stats_view(self) -> dict[str, Any]:
        stat_definitions = load_player_stat_definitions(self.config_root)
        base_stats = dict(load_player_base_stats(self.config_root))
        modifiers = self._calculator().calculate_player_stat_modifiers()
        stat_context = aggregate_player_stats(base_stats, modifiers)
        stat_values = stat_context.values
        return {
            stat_id: {
                "label_text": self.presenter.localizer.text(definition.name_key),
                "value": stat_values.get(stat_id, False if definition.value_type == "boolean" else 0),
                "value_type": definition.value_type,
                "category": definition.category,
                "v1_status": definition.v1_status,
                "runtime_effective": definition.runtime_effective,
                "affix_spawn_enabled_v1": definition.affix_spawn_enabled_v1,
                "trace": stat_context.trace.get(stat_id, {}),
            }
            for stat_id, definition in stat_definitions.items()
        }

    def _character_panel_view(
        self,
        final_skills: tuple[FinalSkillInstance, ...] = (),
        stat_view: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        stat_view = stat_view if stat_view is not None else self._player_stats_view()
        active_skill_stat_deltas = self._active_skill_stat_deltas(final_skills)
        sections = []
        for section in load_character_panel_sections(self.config_root):
            rows = []
            for row in section.rows:
                stat = stat_view[row.stat_id]
                value = stat["value"]
                if row.stat_id in active_skill_stat_deltas:
                    if stat["value_type"] == "boolean":
                        value = bool(value) or bool(active_skill_stat_deltas[row.stat_id])
                    elif isinstance(value, (int, float)) and not isinstance(value, bool):
                        value = float(value) + active_skill_stat_deltas[row.stat_id]
                if row.stat_id in {"fire_resistance_percent", "cold_resistance_percent", "lightning_resistance_percent"}:
                    value = float(value) + float(stat_view.get("elemental_resistance_percent", {}).get("value", 0))
                rows.append(
                    {
                        "id": row.row_id,
                        "stat_id": row.stat_id,
                        "label_text": stat["label_text"],
                        "value": value,
                        "value_type": stat["value_type"],
                        "formatter": row.formatter,
                        "icon_text": row.icon_text,
                        "tone": row.tone,
                        "v1_status": stat["v1_status"],
                    }
                )
            sections.append(
                {
                    "id": section.section_id,
                    "title_text": self.presenter.localizer.text(section.title_key),
                    "layout": section.layout,
                    "rows": rows,
                }
            )
        return {"sections": sections}

    def _active_skill_stat_deltas(self, final_skills: tuple[FinalSkillInstance, ...]) -> dict[str, float]:
        deltas: dict[str, float] = {}
        for skill in final_skills:
            for modifier in skill.applied_modifiers:
                if not modifier.applied or modifier.layer not in {"additive", "final"}:
                    continue
                deltas[modifier.stat] = deltas.get(modifier.stat, 0.0) + float(modifier.value)
        return deltas

    def _gem_name(self, instance: GemInstance) -> str:
        return self.presenter.localizer.text(self.definitions[instance.base_gem_id].name_key)

    def _test_item_detail(self) -> dict[str, Any]:
        name_text = self.presenter.localizer.text("item.test_whetstone.name")
        description_text = self.presenter.localizer.text("item.test_whetstone.description")
        category_text = self.presenter.localizer.text("item.category.normal_item")
        return {
            "instance_id": "web_test_whetstone",
            "item_kind": "ordinary",
            "name_text": name_text,
            "description_text": description_text,
            "category_text": category_text,
            "gem_type": {"id": "", "display_text": category_text, "identity_text": description_text},
            "gem_kind": "",
            "gem_kind_text": category_text,
            "sudoku_digit": 0,
            "rarity_text": self.presenter.localizer.text("rarity.normal.name"),
            "level": 1,
            "locked": False,
            "board_position": None,
            "tags": [{"id": "test_item", "text": self.presenter.localizer.text("tag.test_item.name")}],
            "base_effect": {},
            "can_affect": {"summary_text": description_text, "tags_any": [], "tags_all": [], "tags_none": []},
            "current_effective_targets": [],
            "board_relations": [],
            "tooltip_view": {
                "icon_text": name_text[:1],
                "icon_color_key": "",
                "icon_sprite": "",
                "name_text": name_text,
                "subtitle_text": f"{category_text} 路 {self.presenter.localizer.text('rarity.normal.name')}",
                "type_identity_text": description_text,
                "tags": [{"id": "test_item", "text": self.presenter.localizer.text("tag.test_item.name"), "tone": "category"}],
                "sections": {
                    "description": {
                        "title_text": self.presenter.localizer.text("ui.tooltip.section.description"),
                        "lines": [description_text],
                    },
                    "stats": {"title_text": self.presenter.localizer.text("ui.tooltip.section.stats"), "lines": []},
                    "current_targets": {"title_text": self.presenter.localizer.text("ui.tooltip.section.current_targets"), "lines": []},
                    "rules": {
                        "title_text": self.presenter.localizer.text("ui.tooltip.section.rules"),
                        "lines": [self.presenter.localizer.text("ui.inventory.only_gems_on_board")],
                    },
                },
            },
        }


def encode_json(data: Any) -> bytes:
    return json.dumps(data, ensure_ascii=False).encode("utf-8")
