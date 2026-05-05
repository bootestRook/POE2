from __future__ import annotations

import json
import random
from collections import Counter
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
from .equipment import (
    EquipmentAffixDefinition,
    EquipmentAffixRoll,
    EquipmentGenerator,
    EquipmentItem,
    classify_all_equipment_affix_effects,
    equipment_effect_alignment_report,
    load_equipment_affix_definitions,
    prefix_suffix_capacity,
)
from .gem_board import SudokuGemBoard
from .inventory import BoardPosition, GemInventory, GemInstance
from .loot import LootRuntime
from .map_progression import (
    MapProgressionConfig,
    MapProgressionState,
    MapRunContext,
    add_map_entry,
    consume_stage_entry,
    create_map_run_context,
    initial_progression_state,
    load_map_progression,
    map_progression_view,
    unlock_after_clear,
)
from .presentation import PresentationService
from .player_stats import aggregate_player_stats
from .skill_effects import FinalSkillInstance, SkillEffectCalculator, SkillEffectError
from .skill_runtime import SkillRuntime
from .torchlight_adoption import adopted_entries


@dataclass
class V1WebAppApi:
    config_root: Path
    autosave_enabled: bool = False
    autosave_path: Path | None = None
    definitions: dict = field(init=False)
    inventory: GemInventory = field(init=False)
    board: SudokuGemBoard = field(init=False)
    presenter: PresentationService = field(init=False)
    loot_runtime: LootRuntime = field(init=False)
    map_progression: MapProgressionConfig = field(init=False)
    map_state: MapProgressionState = field(init=False)
    current_map_run: MapRunContext | None = None
    equipment_items: list[EquipmentItem] = field(default_factory=list)
    equipment_slots: list[str | None] = field(default_factory=lambda: [None] * 10)
    _next_gm_item_index: int = 1
    combat_session: CombatSession | None = None
    logs: list[str] = field(default_factory=list)
    _next_map_run_number: int = 1

    def __post_init__(self) -> None:
        self.definitions = load_gem_definitions(self.config_root)
        self.inventory = GemInventory(self.definitions)
        self.board = SudokuGemBoard(load_board_rules(self.config_root), self.inventory)
        self.presenter = PresentationService.from_configs(self.config_root)
        self.map_progression = load_map_progression(self.config_root)
        self.map_state = initial_progression_state(self.map_progression)
        if self.autosave_path is None:
            self.autosave_path = self.config_root.parent / "artifacts" / "saves" / "v1_autosave.json"
        self.loot_runtime = self._create_loot_runtime()
        self._seed_inventory()
        if self.autosave_enabled:
            self._load_autosave()

    def state(self) -> dict[str, Any]:
        self._reload_config_backed_services()
        final_skills, skill_error = self._final_skills_or_error()
        board_view = self.presenter.board_view(self.board, final_skills=final_skills)
        inventory = [
            self.presenter.gem_detail(instance, board=self.board, final_skills=final_skills)
            for instance in self.inventory.sort_instances("acquired_order")
        ]
        inventory.extend(self._equipment_detail(item) for item in self.equipment_items)
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
            "equipment_slots": list(self.equipment_slots),
            "map_progression": map_progression_view(self.map_progression, self.map_state),
            "current_map_run": self._map_run_view(self.current_map_run),
            "autosave": {
                "enabled": self.autosave_enabled,
                "path": str(self.autosave_path) if self.autosave_path else "",
            },
            "frontend_save": self._save_payload(),
            "ui_text": {
                "only_gems_on_board": self.presenter.localizer.text("ui.inventory.only_gems_on_board"),
            },
        }

    def mount(self, instance_id: str, row: int, column: int) -> dict[str, Any]:
        self.board.mount_gem(instance_id, row, column)
        instance = self.inventory.require(instance_id)
        self.logs.append(f"已将{self._gem_name(instance)}放入第{row + 1}行第{column + 1}列。")
        self._autosave()
        return self.state()

    def unmount(self, instance_id: str) -> dict[str, Any]:
        instance = self.inventory.require(instance_id)
        self.board.unmount_gem(instance_id)
        self.logs.append(f"已将{self._gem_name(instance)}从盘面取下。")
        self._autosave()
        return self.state()

    def start_combat(self) -> dict[str, Any]:
        return self.start_map(self.map_state.selected_stage_id or self.map_progression.default_stage_id)

    def start_map(self, stage_id: str, spawn_monsters: list[dict[str, Any]] | None = None) -> dict[str, Any]:
        self._ensure_default_active_skill_mounted()
        consume_stage_entry(self.map_progression, self.map_state, stage_id)
        run_context = create_map_run_context(
            self.map_progression,
            stage_id,
            run_number=self._next_map_run_number,
        )
        self._next_map_run_number += 1
        stage = self.map_progression.stage(stage_id)
        normal_multiplier = self.map_progression.rarity_multipliers["normal"]
        magic_multiplier = self.map_progression.rarity_multipliers["magic"]
        rare_multiplier = self.map_progression.rarity_multipliers["rare"]
        boss_multiplier = self.map_progression.rarity_multipliers["boss"]
        normal_life = self.map_progression.monster_curve.monster_life(
            stage.monster_level,
            rarity_life=normal_multiplier.life,
        )
        normal_damage = self.map_progression.monster_curve.monster_damage(
            stage.monster_level,
            rarity_damage=normal_multiplier.damage,
        )
        magic_life = self.map_progression.monster_curve.monster_life(
            stage.monster_level,
            rarity_life=magic_multiplier.life,
        )
        magic_damage = self.map_progression.monster_curve.monster_damage(
            stage.monster_level,
            rarity_damage=magic_multiplier.damage,
        )
        rare_life = self.map_progression.monster_curve.monster_life(
            stage.monster_level,
            rarity_life=rare_multiplier.life,
        )
        rare_damage = self.map_progression.monster_curve.monster_damage(
            stage.monster_level,
            rarity_damage=rare_multiplier.damage,
        )
        boss_life = self.map_progression.monster_curve.monster_life(
            stage.monster_level,
            rarity_life=boss_multiplier.life,
        )
        boss_damage = self.map_progression.monster_curve.monster_damage(
            stage.monster_level,
            rarity_damage=boss_multiplier.damage,
        )
        if spawn_monsters:
            monsters = self._canonical_monsters_from_spawn_layout(stage, run_context, spawn_monsters)
        else:
            monsters = [
                Monster(
                    f"{stage_id}_monster_{index}",
                    current_life=normal_life,
                    max_life=normal_life,
                    position=Position(600 + index * 34, 480 + (index % 2) * 42),
                    rarity="normal",
                    monster_template_id="mon_100101",
                    pack_id=f"{stage_id}_pack_main",
                    zone_type="main_room",
                    base_damage=normal_damage,
                    damage_multiplier=normal_multiplier.damage,
                    map_stage_id=stage.stage_id,
                    map_level=run_context.map_level,
                    monster_level=run_context.monster_level,
                )
                for index in range(1, 4)
            ]
            monsters.append(
                Monster(
                    f"{stage_id}_magic_guard",
                    current_life=magic_life,
                    max_life=magic_life,
                    position=Position(730, 522),
                    rarity="magic",
                    monster_template_id="mon_200101",
                    pack_id=f"{stage_id}_pack_guard",
                    zone_type="main_room",
                    base_damage=magic_damage,
                    damage_multiplier=magic_multiplier.damage,
                    map_stage_id=stage.stage_id,
                    map_level=run_context.map_level,
                    monster_level=run_context.monster_level,
                )
            )
            if run_context.map_level >= 20:
                monsters.append(
                    Monster(
                        f"{stage_id}_rare_elite",
                        current_life=rare_life,
                        max_life=rare_life,
                        position=Position(790, 522),
                        rarity="rare",
                        monster_template_id="mon_300101",
                        pack_id=f"{stage_id}_pack_elite",
                        zone_type="large_room",
                        base_damage=rare_damage,
                        damage_multiplier=rare_multiplier.damage,
                        map_stage_id=stage.stage_id,
                        map_level=run_context.map_level,
                        monster_level=run_context.monster_level,
                    )
                )
            if stage.boss_stage:
                monsters.append(
                    Monster(
                        f"{stage_id}_boss",
                        current_life=boss_life,
                        max_life=boss_life,
                        position=Position(760, 560),
                        rarity="boss",
                        is_boss=True,
                        monster_template_id="mon_400101",
                        pack_id=f"{stage_id}_pack_boss",
                        zone_type="boss_room",
                        base_damage=boss_damage,
                        damage_multiplier=boss_multiplier.damage,
                        map_stage_id=stage.stage_id,
                        map_level=run_context.map_level,
                        monster_level=run_context.monster_level,
                    )
                )
        player = self._new_player("player_1")
        player.position = Position(600, 500)
        session = CombatSession.start(
            player=player,
            monsters=monsters,
            inventory=self.inventory,
            skill_effect_calculator=self._calculator(),
            loot_runtime=self.loot_runtime,
            map_run_context=run_context,
        )
        events = ()
        self.combat_session = session
        self.current_map_run = run_context
        self.logs.append(f"进入地图：{stage.display_name}（地图等级 {run_context.map_level}）。")
        for event in events:
            skill_name = self.presenter.localizer.text(self.definitions[event.skill_instance.base_gem_id].name_key)
            killed_text = "击杀怪物" if event.killed else "命中怪物"
            self.logs.append(f"{skill_name}自动释放，造成{event.damage:.2f}伤害，{killed_text}。")
        for dropped in session.dropped_gems:
            if not dropped.picked_up:
                self.logs.append(f"掉落：{self.presenter.drop_prompt(dropped)['name_text']}。")
        self._autosave()
        return self.state()

    def combat_tick(self, delta_ms: int = 250) -> dict[str, Any]:
        if self.combat_session is None:
            return self.state()
        before_drop_count = len(self.combat_session.dropped_gems)
        before_alive_count = sum(1 for monster in self.combat_session.monsters if monster.is_alive)
        events = self.combat_session.tick(max(1, min(2000, int(delta_ms))))
        for event in events:
            skill_name = self.presenter.localizer.text(self.definitions[event.skill_instance.base_gem_id].name_key)
            if event.skipped_reason:
                self.logs.append(f"{skill_name}暂未释放：{event.skipped_reason}。")
                continue
            killed_text = "击杀怪物" if event.killed else "命中怪物"
            self.logs.append(f"{skill_name}自动释放，造成{event.damage:.2f}伤害，{killed_text}。")
        for dropped in self.combat_session.dropped_gems[before_drop_count:]:
            if not dropped.picked_up:
                self.logs.append(f"掉落：{self.presenter.drop_prompt(dropped)['name_text']}。")
        after_alive_count = sum(1 for monster in self.combat_session.monsters if monster.is_alive)
        if self.current_map_run is not None and before_alive_count > 0 and after_alive_count == 0:
            unlocked = unlock_after_clear(self.map_progression, self.map_state, self.current_map_run.stage_id)
            if unlocked:
                self.logs.append(f"已解锁：{self.map_progression.stage(unlocked).display_name}。")
        if events or len(self.combat_session.dropped_gems) != before_drop_count or before_alive_count != after_alive_count:
            self._autosave()
        return self.state()

    def _canonical_monsters_from_spawn_layout(
        self,
        stage: Any,
        run_context: MapRunContext,
        spawn_monsters: list[dict[str, Any]],
    ) -> list[Monster]:
        monsters: list[Monster] = []
        for index, raw in enumerate(spawn_monsters, start=1):
            if not isinstance(raw, dict):
                continue
            rarity = str(raw.get("spawn_rarity", "normal"))
            if rarity not in self.map_progression.rarity_multipliers:
                rarity = "normal"
            boss = bool(raw.get("boss", False)) or rarity == "boss"
            if boss:
                rarity = "boss"
            rarity_multiplier = self.map_progression.rarity_multipliers[rarity]
            life_multiplier = max(0.01, float(raw.get("life_multiplier", 1.0) or 1.0))
            damage_multiplier = max(0.01, float(raw.get("damage_multiplier", 1.0) or 1.0))
            max_life = self.map_progression.monster_curve.monster_life(
                stage.monster_level,
                rarity_life=rarity_multiplier.life * life_multiplier,
            )
            base_damage = self.map_progression.monster_curve.monster_damage(
                stage.monster_level,
                rarity_damage=rarity_multiplier.damage * damage_multiplier,
            )
            runtime_id = str(raw.get("runtime_id", raw.get("id", index)))
            monsters.append(
                Monster(
                    f"{stage.stage_id}_monster_{runtime_id}",
                    current_life=max_life,
                    max_life=max_life,
                    position=Position(
                        float(raw.get("x", 600.0) or 600.0),
                        float(raw.get("y", 500.0) or 500.0),
                    ),
                    rarity=rarity,
                    is_boss=boss,
                    monster_template_id=str(raw.get("monster_id", "mon_100101") or "mon_100101"),
                    pack_id=str(raw.get("monster_pack_id", raw.get("pack_id", "")) or ""),
                    zone_type=str(raw.get("zone_type", "")),
                    base_damage=base_damage,
                    damage_multiplier=rarity_multiplier.damage * damage_multiplier,
                    map_stage_id=stage.stage_id,
                    map_level=run_context.map_level,
                    monster_level=run_context.monster_level,
                )
            )
        return monsters

    def new_game(self) -> dict[str, Any]:
        self.inventory.clear()
        self.board = SudokuGemBoard(load_board_rules(self.config_root), self.inventory)
        self.equipment_items = []
        self.equipment_slots = [None] * 10
        self.combat_session = None
        self.current_map_run = None
        self.map_state = initial_progression_state(self.map_progression)
        self.logs = ["已开始新游戏。"]
        self._seed_inventory()
        self._autosave()
        return self.state()

    def continue_game(self) -> dict[str, Any]:
        self._load_autosave(force=True)
        return self.state()

    def restore_frontend_save(self, payload: dict[str, Any]) -> dict[str, Any]:
        self._apply_save_payload(payload)
        self.logs.append("已读取前端本地存档。")
        return self.state()

    def _legacy_start_combat(self) -> dict[str, Any]:
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
            self.logs.append(f"掉落：{self.presenter.drop_prompt(dropped)['name_text']}。")
        self._autosave()
        return self.state()

    def pickup(self, drop_id: str) -> dict[str, Any]:
        if self.combat_session is None:
            raise ValueError("当前没有可拾取的掉落。")
        target = next((drop for drop in self.combat_session.dropped_gems if drop.drop_id == drop_id), None)
        if target is None:
            raise ValueError("掉落不存在。")
        if target.picked_up:
            raise ValueError("该掉落已经拾取。")
        picked = self.combat_session.pickup_nearby()
        if not picked:
            self.combat_session.move_player_to(target.position)
            picked = self.combat_session.pickup_nearby()
        if not picked:
            raise ValueError("距离太远，无法拾取该掉落。")
        for item in picked:
            if isinstance(item, GemInstance):
                self.logs.append(f"已拾取{self._gem_name(item)}并加入库存。")
                continue
            if hasattr(item, "ordinary_affixes"):
                self.equipment_items.append(item)
                self.logs.append(f"已拾取{self._equipment_name(item)}并加入库存。")
                continue
            stage_id = str(getattr(item, "stage_id", ""))
            quantity = int(getattr(item, "quantity", 1))
            if stage_id:
                add_map_entry(self.map_progression, self.map_state, stage_id, quantity)
                self.logs.append(f"已拾取地图门票：{self.map_progression.stage(stage_id).display_name} x{quantity}。")
        if self.current_map_run is not None and all(not monster.is_alive for monster in self.combat_session.monsters):
            unlocked = unlock_after_clear(self.map_progression, self.map_state, self.current_map_run.stage_id)
            if unlocked:
                self.logs.append(f"已解锁：{self.map_progression.stage(unlocked).display_name}。")
        self._autosave()
        return self.state()

    def save_skill_package(self, skill_id: str, package: dict[str, Any]) -> dict[str, Any]:
        return _disabled_skill_editor_response(state=self.state())

    def preview_skill_modifier_stack(self, payload: dict[str, Any]) -> dict[str, Any]:
        return _disabled_skill_editor_response(preview=None)

    def run_skill_test_arena(self, payload: dict[str, Any]) -> dict[str, Any]:
        return _disabled_skill_editor_response(result=None)

    def runtime_skill_events(self, payload: dict[str, Any]) -> dict[str, Any]:
        final_skills, skill_error = self._final_skills_or_error()
        if skill_error:
            return {"ok": False, "message_text": skill_error, "events": []}
        skill_instance_id = str(payload.get("skill_instance_id", ""))
        skill = self._runtime_skill_by_id(final_skills, skill_instance_id)
        if skill is None:
            return {"ok": False, "message_text": "skill instance not found", "events": []}
        if not skill.uses_skill_event_pipeline:
            return {"ok": False, "message_text": "skill does not use runtime events", "events": []}

        source_position = _runtime_position(payload.get("source_position", {}))
        source_runtime_position = Position(source_position["x"], source_position["y"])
        timestamp_ms = max(0, int(payload.get("timestamp_ms", 0)))
        targets = self._runtime_target_snapshot(skill, source_position, payload.get("target_entities", []))
        primary = targets[0] if targets else {"entity_id": "", "position": source_position}
        primary_position = primary["position"]
        events = SkillRuntime().execute(
            skill,
            source_entity=str(payload.get("source_entity", "player")),
            source_position=source_runtime_position,
            target_entity=str(primary["entity_id"]),
            target_position=Position(primary_position["x"], primary_position["y"]),
            timestamp_ms=timestamp_ms,
            target_entities=targets,
            runtime_context=payload.get("runtime_context"),
        )
        return {
            "ok": True,
            "message_text": "",
            "events": [event.to_dict() for event in events],
        }

    def _map_run_view(self, run: MapRunContext | None) -> dict[str, Any] | None:
        if run is None:
            return None
        return {
            "run_id": run.run_id,
            "stage_id": run.stage_id,
            "display_name": run.display_name,
            "map_level": run.map_level,
            "monster_level": run.monster_level,
            "loot_profile_id": run.loot_profile_id,
            "map_template_id": run.map_template_id,
            "boss_stage": run.boss_stage,
            "monsters": [
                self._monster_view(monster, run)
                for monster in (self.combat_session.monsters if self.combat_session and self.combat_session.map_run_context == run else ())
            ],
        }

    def _monster_view(self, monster: Monster, run: MapRunContext) -> dict[str, Any]:
        return {
            "runtime_id": monster.monster_id,
            "monster_id": monster.monster_template_id,
            "pack_id": monster.pack_id,
            "zone_type": monster.zone_type,
            "spawn_rarity": monster.rarity,
            "boss": monster.is_boss,
            "position": {"x": monster.position.x, "y": monster.position.y},
            "current_life": monster.current_life,
            "max_life": monster.max_life,
            "base_damage": monster.base_damage,
            "damage_multiplier": monster.damage_multiplier,
            "map_stage_id": monster.map_stage_id or run.stage_id,
            "map_level": monster.map_level or run.map_level,
            "monster_level": monster.monster_level or run.monster_level,
            "loot_context": {
                "stage_id": run.stage_id,
                "loot_profile_id": run.loot_profile_id,
                "monster_rarity": monster.rarity,
                "is_boss": monster.is_boss,
            },
        }

    def _autosave(self) -> None:
        if not self.autosave_enabled or self.autosave_path is None:
            return
        payload = self._save_payload()
        self.autosave_path.parent.mkdir(parents=True, exist_ok=True)
        self.autosave_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    def _load_autosave(self, *, force: bool = False) -> None:
        if self.autosave_path is None or not self.autosave_path.exists():
            if force:
                self.logs.append("没有可继续的自动存档。")
            return
        try:
            payload = json.loads(self.autosave_path.read_text(encoding="utf-8"))
            self._apply_save_payload(payload)
            self.logs.append("已读取自动存档。")
        except Exception as exc:
            self.logs.append(f"自动存档读取失败：{exc}")

    def _ensure_default_active_skill_mounted(self) -> None:
        if self.inventory.mounted_instances():
            return
        active = next((item for item in self.inventory.sort_instances("acquired_order") if item.is_active_skill), None)
        if active is None:
            return
        self.board.mount_gem(active.instance_id, 0, 0)
        self.logs.append(f"已自动装配默认技能：{self._gem_name(active)}。")

    def _save_payload(self) -> dict[str, Any]:
        return {
            "version": 1,
            "map_state": {
                "unlocked_stage_ids": sorted(self.map_state.unlocked_stage_ids),
                "map_entries": dict(self.map_state.map_entries),
                "selected_stage_id": self.map_state.selected_stage_id,
            },
            "next_map_run_number": self._next_map_run_number,
            "next_gm_item_index": self._next_gm_item_index,
            "gems": [self._gem_save_view(instance) for instance in self.inventory.sort_instances("acquired_order")],
            "equipment_items": [self._equipment_save_view(item) for item in self.equipment_items],
            "equipment_slots": list(self.equipment_slots),
        }

    def _apply_save_payload(self, payload: dict[str, Any]) -> None:
        if int(payload.get("version", 0)) != 1:
            raise ValueError("unsupported save version")
        raw_map_state = payload.get("map_state", {})
        if not isinstance(raw_map_state, dict):
            raw_map_state = {}
        selected_stage_id = str(raw_map_state.get("selected_stage_id", self.map_progression.default_stage_id))
        self.map_state = MapProgressionState(
            unlocked_stage_ids={
                stage_id
                for stage_id in raw_map_state.get("unlocked_stage_ids", [self.map_progression.default_stage_id])
                if str(stage_id) in self.map_progression.stages
            },
            map_entries={
                str(stage_id): max(0, int(quantity))
                for stage_id, quantity in dict(raw_map_state.get("map_entries", {})).items()
                if str(stage_id) in self.map_progression.stages
            },
            selected_stage_id=selected_stage_id if selected_stage_id in self.map_progression.stages else self.map_progression.default_stage_id,
        )
        self.map_state.unlocked_stage_ids.add(self.map_progression.default_stage_id)
        self._next_map_run_number = max(1, int(payload.get("next_map_run_number", 1)))
        self._next_gm_item_index = max(1, int(payload.get("next_gm_item_index", self._next_gm_item_index)))
        self.inventory.clear()
        self.board = SudokuGemBoard(load_board_rules(self.config_root), self.inventory)
        pending_positions: list[tuple[str, BoardPosition]] = []
        for raw in payload.get("gems", []):
            if not isinstance(raw, dict):
                continue
            position = raw.get("board_position")
            instance = self.inventory.add_instance(
                str(raw["instance_id"]),
                str(raw["base_gem_id"]),
                rarity=str(raw.get("rarity", "normal")),
                level=int(raw.get("level", 1)),
                locked=bool(raw.get("locked", False)),
            )
            if isinstance(position, dict):
                pending_positions.append((instance.instance_id, BoardPosition(int(position["row"]), int(position["column"]))))
        for instance_id, position in pending_positions:
            self.board.mount_gem(instance_id, position.row, position.column)
        if not self.inventory.sort_instances("acquired_order"):
            self._seed_inventory()
        self.equipment_items = [
            self._equipment_from_save(raw)
            for raw in payload.get("equipment_items", [])
            if isinstance(raw, dict)
        ]
        known_equipment_ids = {item.instance_id for item in self.equipment_items}
        raw_slots = payload.get("equipment_slots", [])
        self.equipment_slots = [
            str(instance_id) if instance_id in known_equipment_ids else None
            for instance_id in list(raw_slots)[:10]
        ]
        while len(self.equipment_slots) < 10:
            self.equipment_slots.append(None)
        self.combat_session = None
        self.current_map_run = None

    def _gem_save_view(self, instance: GemInstance) -> dict[str, Any]:
        return {
            "instance_id": instance.instance_id,
            "base_gem_id": instance.base_gem_id,
            "rarity": instance.rarity,
            "level": instance.level,
            "locked": instance.locked,
            "board_position": {
                "row": instance.board_position.row,
                "column": instance.board_position.column,
            } if instance.board_position is not None else None,
        }

    def _equipment_save_view(self, item: EquipmentItem) -> dict[str, Any]:
        return {
            "instance_id": item.instance_id,
            "source": item.source,
            "level": item.level,
            "rarity": item.rarity,
            "base_affix": self._equipment_affix_save_view(item.base_affix),
            "prefix_affixes": [self._equipment_affix_save_view(affix) for affix in item.prefix_affixes],
            "suffix_affixes": [self._equipment_affix_save_view(affix) for affix in item.suffix_affixes],
        }

    def _equipment_affix_save_view(self, affix: EquipmentAffixRoll) -> dict[str, Any]:
        return {
            "affix_id": affix.affix_id,
            "source_modifier_id": affix.source_modifier_id,
            "library": affix.library,
            "gen": affix.gen,
            "tier": affix.tier,
            "effect": affix.effect,
            "family_id": affix.family_id,
        }

    def _equipment_from_save(self, raw: dict[str, Any]) -> EquipmentItem:
        return EquipmentItem(
            instance_id=str(raw["instance_id"]),
            source=str(raw["source"]),
            level=int(raw["level"]),
            rarity=str(raw["rarity"]),
            base_affix=self._equipment_affix_from_save(dict(raw["base_affix"])),
            prefix_affixes=tuple(self._equipment_affix_from_save(dict(affix)) for affix in raw.get("prefix_affixes", [])),
            suffix_affixes=tuple(self._equipment_affix_from_save(dict(affix)) for affix in raw.get("suffix_affixes", [])),
        )

    def _equipment_affix_from_save(self, raw: dict[str, Any]) -> EquipmentAffixRoll:
        return EquipmentAffixRoll(
            affix_id=str(raw["affix_id"]),
            source_modifier_id=str(raw["source_modifier_id"]),
            library=str(raw["library"]),
            gen=str(raw["gen"]),
            tier=int(raw["tier"]),
            effect=str(raw["effect"]),
            family_id=str(raw["family_id"]),
        )

    def gm_options(self) -> dict[str, Any]:
        self._reload_config_backed_services()
        equipment_definitions = self._equipment_affix_definitions()
        sources = sorted(
            {
                definition.source
                for definition in equipment_definitions
                if definition.enabled and definition.library == "base"
            }
        )
        return {
            "gems": [
                {
                    "id": base_gem_id,
                    "name_text": self.presenter.localizer.text(definition.name_key),
                    "kind": definition.gem_kind,
                    "gem_type": definition.gem_type,
                    "sudoku_digit": definition.sudoku_digit,
                }
                for base_gem_id, definition in sorted(
                    self.definitions.items(),
                    key=lambda item: (item[1].gem_kind, item[1].sudoku_digit, self.presenter.localizer.text(item[1].name_key), item[0]),
                )
            ],
            "equipment_sources": [{"id": source, "name_text": source} for source in sources],
            "equipment_rarities": [
                {"id": "white", "name_text": "白色", "affix_count": 0},
                {"id": "blue", "name_text": "蓝色", "affix_count": 2},
                {"id": "purple", "name_text": "紫色", "affix_count": 5},
                {"id": "pink", "name_text": "粉色", "affix_count": 6},
            ],
        }

    def gm_equipment_affixes(self, source: str, level: int) -> dict[str, Any]:
        level = max(1, min(100, int(level)))
        max_prefixes, max_suffixes = prefix_suffix_capacity(level)
        mappings = classify_all_equipment_affix_effects(self._equipment_affix_definitions())
        affixes = [
            definition
            for definition in self._equipment_affix_definitions()
            if definition.source == source
            and definition.enabled
            and definition.required_level <= level
        ]
        return {
            "source": source,
            "level": level,
            "capacity": {"prefix": max_prefixes, "suffix": max_suffixes},
            "affixes": [
                {
                    "id": definition.affix_id,
                    "name_text": self._equipment_affix_label(definition),
                    "effect_text": definition.effect,
                    "library": definition.library,
                    "gen": definition.gen,
                    "tier": definition.tier,
                    "family_id": definition.family_id,
                    "required_level": definition.required_level,
                    "effect_status": mappings[definition.source_modifier_id].status,
                }
                for definition in sorted(affixes, key=lambda item: (item.library != "base", item.gen, item.library, item.tier, item.effect, item.affix_id))
            ],
        }

    def equipment_affix_effect_status(self) -> dict[str, Any]:
        definitions = self._equipment_affix_definitions()
        mappings = classify_all_equipment_affix_effects(definitions)
        counts = Counter(mapping.status for mapping in mappings.values())
        alignment = equipment_effect_alignment_report(definitions)
        return {
            "summary": {
                "raw_modifier_count": len(mappings),
                "mapped_effect": counts.get("mapped_effect", 0),
                "disabled": counts.get("disabled", 0),
                "requires_design_alignment": counts.get("requires_design_alignment", 0),
                "alignment_report_count": len(alignment),
            },
            "mappings": [
                self._equipment_effect_mapping_view(mapping)
                for mapping in sorted(mappings.values(), key=lambda item: item.source_modifier_id)
            ],
            "alignment": [self._equipment_alignment_view(item) for item in alignment],
        }

    def gm_add_gem(self, base_gem_id: str, level: int, quantity: int) -> dict[str, Any]:
        level = max(1, min(20, int(level)))
        quantity = max(1, min(60, int(quantity)))
        if base_gem_id not in self.definitions:
            raise ValueError("GM 宝石不存在。")
        added = []
        for _ in range(quantity):
            instance = self.inventory.add_instance(
                self._next_gm_instance_id("gem"),
                base_gem_id,
                rarity="normal",
                level=level,
            )
            added.append(self._gem_name(instance))
        self.logs.append(f"GM 添加宝石：{added[0]} x{len(added)}。")
        self._autosave()
        return self.state()

    def equip_item(self, instance_id: str, slot_indices: list[int] | tuple[int, ...]) -> dict[str, Any]:
        item = self._equipment_item_by_id(instance_id)
        if item is None:
            raise ValueError("装备不存在。")
        normalized_indices = tuple(dict.fromkeys(int(index) for index in slot_indices))
        if not normalized_indices:
            raise ValueError("装备槽位不能为空。")
        if any(index < 0 or index >= len(self.equipment_slots) for index in normalized_indices):
            raise ValueError("装备槽位非法。")
        for index, equipped_id in enumerate(list(self.equipment_slots)):
            if equipped_id == instance_id or index in normalized_indices:
                self.equipment_slots[index] = None
        for index in normalized_indices:
            self.equipment_slots[index] = instance_id
        self.logs.append(f"已装备：{self._equipment_name(item)}。")
        self._autosave()
        return self.state()

    def unequip_item(self, instance_id: str) -> dict[str, Any]:
        item = self._equipment_item_by_id(instance_id)
        if item is None:
            raise ValueError("装备不存在。")
        self.equipment_slots = [
            None if equipped_id == instance_id else equipped_id
            for equipped_id in self.equipment_slots
        ]
        self.logs.append(f"已卸下：{self._equipment_name(item)}。")
        self._autosave()
        return self.state()

    def gm_add_equipment(
        self,
        source: str,
        level: int,
        affix_ids: list[str] | tuple[str, ...] = (),
        *,
        random_rarity: str | None = None,
    ) -> dict[str, Any]:
        level = max(1, min(100, int(level)))
        generator = self._equipment_generator()
        instance_id = self._next_gm_instance_id("equip")
        if random_rarity:
            item = generator.generate(source, level, random_rarity, instance_id=instance_id)
        else:
            item = self._specified_equipment_item(generator, source, level, tuple(str(affix_id) for affix_id in affix_ids), instance_id)
        self.equipment_items.append(item)
        self.logs.append(f"GM 添加装备：{self._equipment_name(item)}。")
        self._autosave()
        return self.state()

    def _runtime_skill_by_id(
        self,
        final_skills: tuple[FinalSkillInstance, ...],
        skill_id: str,
    ) -> FinalSkillInstance | None:
        skill = next((item for item in final_skills if item.active_gem_instance_id == skill_id), None)
        if skill is not None:
            return skill
        matches = [
            item
            for item in final_skills
            if item.skill_package_id == skill_id
            or item.skill_template_id == skill_id
            or item.base_gem_id == skill_id
        ]
        return matches[0] if len(matches) == 1 else None

    def _runtime_target_snapshot(
        self,
        skill: FinalSkillInstance,
        source_position: dict[str, float],
        raw_targets: Any,
    ) -> list[dict[str, Any]]:
        if not isinstance(raw_targets, list):
            return []
        search_range = max(0.0, float((skill.cast or {}).get("search_range", 0.0))) * max(0.0, skill.area_multiplier)
        targets: list[dict[str, Any]] = []
        for raw in raw_targets:
            if not isinstance(raw, dict):
                continue
            entity_id = str(raw.get("entity_id", ""))
            if not entity_id:
                continue
            position = _runtime_position(raw.get("position", {}))
            distance = ((position["x"] - source_position["x"]) ** 2 + (position["y"] - source_position["y"]) ** 2) ** 0.5
            if search_range > 0 and distance > search_range:
                continue
            targets.append({"entity_id": entity_id, "position": position, "distance": distance})
        targets.sort(key=lambda item: (float(item["distance"]), str(item["entity_id"])))
        return [{"entity_id": item["entity_id"], "position": item["position"]} for item in targets]

    def _reload_config_backed_services(self) -> None:
        self.definitions = load_gem_definitions(self.config_root)
        self.inventory.update_definitions(self.definitions)
        self.presenter = PresentationService.from_configs(self.config_root)
        self.map_progression = load_map_progression(self.config_root)

    def _equipment_affix_definitions(self) -> tuple[EquipmentAffixDefinition, ...]:
        affix_path = self.config_root.parent / "tlidb_equips" / "tlidb_craft_affixes.md"
        if not affix_path.exists():
            affix_path = Path(__file__).resolve().parents[2] / "tlidb_equips" / "tlidb_craft_affixes.md"
        return load_equipment_affix_definitions(affix_path)

    def _equipment_generator(self) -> EquipmentGenerator:
        return EquipmentGenerator(self._equipment_affix_definitions(), random.Random())

    def _specified_equipment_item(
        self,
        generator: EquipmentGenerator,
        source: str,
        level: int,
        affix_ids: tuple[str, ...],
        instance_id: str,
    ) -> EquipmentItem:
        definitions_by_id = {definition.affix_id: definition for definition in generator.definitions}
        selected_base_definitions = []
        ordinary_affix_ids = []
        for affix_id in affix_ids:
            definition = definitions_by_id.get(affix_id)
            if definition is None or not definition.enabled:
                raise ValueError(f"GM 装备词缀非法：{affix_id}")
            if definition.source != source or definition.required_level > level:
                raise ValueError(f"GM 装备词缀不匹配当前装备类型或等级：{affix_id}")
            if definition.library == "base":
                selected_base_definitions.append(definition)
            else:
                ordinary_affix_ids.append(affix_id)
        if len(selected_base_definitions) > 1:
            raise ValueError("GM 装备只能选择 1 条基础词缀。")
        base_affix = generator._roll(selected_base_definitions[0]) if selected_base_definitions else generator._roll_base_affix(source)
        selected = []
        seen_families: set[str] = set()
        max_prefixes, max_suffixes = prefix_suffix_capacity(level)
        prefix_count = 0
        suffix_count = 0
        advanced_count = 0
        pinnacle_count = 0
        for affix_id in ordinary_affix_ids:
            definition = definitions_by_id.get(affix_id)
            if definition is None or not definition.enabled:
                raise ValueError(f"GM 装备词缀非法：{affix_id}")
            if definition.source != source or definition.library == "base" or definition.required_level > level:
                raise ValueError(f"GM 装备词缀不匹配当前装备类型或等级：{affix_id}")
            if definition.family_id in seen_families:
                raise ValueError("GM 装备不能添加同族重复词缀。")
            if definition.gen == "prefix":
                prefix_count += 1
                if prefix_count > max_prefixes:
                    raise ValueError("GM 装备前缀数量超过当前等级上限。")
            elif definition.gen == "suffix":
                suffix_count += 1
                if suffix_count > max_suffixes:
                    raise ValueError("GM 装备后缀数量超过当前等级上限。")
            else:
                raise ValueError("GM 装备只支持前缀/后缀。")
            if definition.library == "advanced":
                advanced_count += 1
                if advanced_count > 2:
                    raise ValueError("GM 装备进阶词缀最多 2 条。")
            if definition.library == "pinnacle":
                if level < 100:
                    raise ValueError("GM 装备至臻词缀需要 100 级装备。")
                pinnacle_count += 1
                if pinnacle_count > 2:
                    raise ValueError("GM 装备至臻词缀最多 2 条。")
            seen_families.add(definition.family_id)
            selected.append(generator._roll(definition))
        rarity = self._equipment_rarity_for_affix_count(len(selected))
        return EquipmentItem(
            instance_id=instance_id,
            source=source,
            level=level,
            rarity=rarity,
            base_affix=base_affix,
            prefix_affixes=tuple(roll for roll in selected if roll.gen == "prefix"),
            suffix_affixes=tuple(roll for roll in selected if roll.gen == "suffix"),
        )

    def _equipment_detail(self, item: EquipmentItem) -> dict[str, Any]:
        affixes = (item.base_affix,) + item.ordinary_affixes
        affix_lines = [self._equipment_affix_text(affix) for affix in affixes]
        rarity_text = self._equipment_rarity_text(item.rarity)
        return {
            "instance_id": item.instance_id,
            "item_kind": "equipment",
            "name_text": self._equipment_name(item),
            "description_text": "GM 生成装备",
            "category_text": item.source,
            "gem_type": {"id": item.source, "display_text": item.source, "identity_text": item.source},
            "gem_kind": "",
            "gem_kind_text": "装备",
            "sudoku_digit": 0,
            "rarity_text": rarity_text,
            "level": item.level,
            "locked": False,
            "board_position": None,
            "tags": [
                {"id": "equipment", "text": "装备"},
                {"id": self._equipment_slot_tag(item.source), "text": item.source},
            ],
            "base_effect": {},
            "can_affect": {"summary_text": "可拖入匹配装备槽", "tags_any": [], "tags_all": [], "tags_none": []},
            "current_effective_targets": [],
            "board_relations": [],
            "tooltip_view": {
                "icon_text": self._equipment_icon_text(item.source),
                "icon_color_key": "",
                "icon_sprite": "",
                "name_text": self._equipment_name(item),
                "subtitle_text": f"{item.source} · {rarity_text} · {item.level}级",
                "type_identity_text": item.source,
                "tags": [
                    {"id": "equipment", "text": "装备", "tone": "category"},
                    {"id": self._equipment_slot_tag(item.source), "text": item.source, "tone": "category"},
                ],
                "sections": {
                    "description": {"title_text": "说明", "lines": ["GM 生成装备，可拖到匹配装备槽。"]},
                    "stats": {
                        "title_text": "词缀",
                        "lines": [
                            {"label_text": "基础" if index == 0 else self._equipment_affix_side_text(affix), "value_text": line}
                            for index, (affix, line) in enumerate(zip(affixes, affix_lines))
                        ],
                    },
                    "current_targets": {"title_text": "当前影响", "lines": []},
                    "rules": {"title_text": "规则", "lines": ["装备不能放入数独宝石盘。"]},
                },
            },
        }

    def _next_gm_instance_id(self, prefix: str) -> str:
        existing_ids = {instance.instance_id for instance in self.inventory.sort_instances("acquired_order")}
        existing_ids.update(item.instance_id for item in self.equipment_items)
        while True:
            value = f"gm_{prefix}_{self._next_gm_item_index}"
            self._next_gm_item_index += 1
            if value not in existing_ids:
                break
        return value

    def _equipment_name(self, item: EquipmentItem) -> str:
        return f"{self._equipment_rarity_text(item.rarity)} {item.source}"

    def _equipment_rarity_for_affix_count(self, count: int) -> str:
        if count <= 0:
            return "white"
        if count <= 2:
            return "blue"
        if count <= 5:
            return "purple"
        return "pink"

    def _equipment_rarity_text(self, rarity: str) -> str:
        return {
            "white": "白色",
            "blue": "蓝色",
            "purple": "紫色",
            "pink": "粉色",
            "鐧借壊": "白色",
            "钃濊壊": "蓝色",
            "绱壊": "紫色",
            "绮夎壊": "粉色",
        }.get(rarity, rarity)

    def _equipment_affix_label(self, definition: EquipmentAffixDefinition) -> str:
        return f"{self._equipment_library_text(definition.library)}{self._equipment_gen_text(definition.gen)} T{definition.tier}：{definition.effect}"

    def _equipment_affix_text(self, affix: EquipmentAffixRoll) -> str:
        if affix.library == "base":
            return affix.effect
        return f"{self._equipment_library_text(affix.library)}{self._equipment_gen_text(affix.gen)} T{affix.tier}：{affix.effect}"

    def _equipment_affix_side_text(self, affix: EquipmentAffixRoll) -> str:
        return self._equipment_gen_text(affix.gen)

    def _equipment_effect_mapping_view(self, mapping: Any) -> dict[str, Any]:
        return {
            "source_modifier_id": mapping.source_modifier_id,
            "status": mapping.status,
            "effect_text": mapping.effect,
            "disabled_reason": mapping.disabled_reason,
            "operations": [
                {
                    "kind": operation.kind,
                    "stat": operation.stat,
                    "value": operation.value,
                    "value_min": operation.value_min,
                    "value_max": operation.value_max,
                    "runtime_hook": operation.runtime_hook,
                    "payload": dict(operation.payload or {}),
                    "source_text": operation.source_text,
                }
                for operation in mapping.operations
            ],
            "alignment": self._equipment_alignment_view(mapping.alignment) if mapping.alignment is not None else None,
        }

    def _equipment_alignment_view(self, alignment: Any) -> dict[str, Any]:
        return {
            "source_modifier_id": alignment.source_modifier_id,
            "effect_text": alignment.effect,
            "reason": alignment.reason,
            "proposed_hook": alignment.proposed_hook,
            "affected_modules": list(alignment.affected_modules),
            "test_plan": alignment.test_plan,
        }

    def _equipment_library_text(self, library: str) -> str:
        return {"initial": "初阶", "advanced": "进阶", "pinnacle": "至臻", "base": "基础"}.get(library, library)

    def _equipment_gen_text(self, gen: str) -> str:
        return {"prefix": "前缀", "suffix": "后缀", "base": ""}.get(gen, gen)

    def _equipment_icon_text(self, source: str) -> str:
        return source[:1] if source else "装"

    def _equipment_slot_tag(self, source: str) -> str:
        text = source.lower()
        if "头" in source or "helm" in text:
            return "head"
        if "胸" in source or "甲" in source or "chest" in text or "armor" in text:
            return "chest"
        if "项链" in source or "amulet" in text:
            return "amulet"
        if "手套" in source or "glove" in text:
            return "gloves"
        if "腰带" in source or "belt" in text:
            return "belt"
        if "鞋" in source or "靴" in source or "boot" in text:
            return "boots"
        if "戒指" in source or "ring" in text:
            return "ring"
        return "weapon"

    def _seed_inventory(self) -> None:
        self.inventory.clear()
        active_seed_ids = [
            str(entry["id"])
            for entry in adopted_entries(self.config_root, "active")
            if isinstance(entry.get("id"), str)
        ]

        for index, base_gem_id in enumerate((gem_id for gem_id in active_seed_ids if gem_id in self.definitions), start=1):
            definition = self.definitions[base_gem_id]
            self._add_seed_gem(
                f"web_seed_active_{index}_{base_gem_id}",
                base_gem_id,
                definition.gem_type,
                rarity="magic" if index == 1 else "normal",
                level=1,
            )
        self.logs.append("已清空物品栏，并加入 16 个 TLIDB 主动技能宝石。")

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
            equipment_items=self._equipped_equipment_items(),
            equipment_affix_definitions=self._equipment_affix_definitions(),
        )

    def _create_loot_runtime(self) -> LootRuntime:
        seed = 6
        affixes = load_affix_definitions(self.config_root)
        return LootRuntime.from_configs(
            self.config_root,
            self.definitions,
            {"normal": 1},
            AffixGenerator(affixes, load_rarity_affix_counts(self.config_root), random.Random(seed)),
            equipment_generator=EquipmentGenerator(self._equipment_affix_definitions(), random.Random(seed + 1)),
            map_progression=self.map_progression,
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
        calculator = self._calculator()
        modifiers = calculator.calculate_player_stat_modifiers()
        return aggregate_player_stats(base_stats, tuple(modifiers) + calculator._equipment_stat_modifiers()).values

    def _player_stats_view(self) -> dict[str, Any]:
        stat_definitions = load_player_stat_definitions(self.config_root)
        base_stats = dict(load_player_base_stats(self.config_root))
        calculator = self._calculator()
        modifiers = calculator.calculate_player_stat_modifiers()
        stat_context = aggregate_player_stats(base_stats, tuple(modifiers) + calculator._equipment_stat_modifiers())
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

    def _equipment_item_by_id(self, instance_id: str) -> EquipmentItem | None:
        return next((item for item in self.equipment_items if item.instance_id == instance_id), None)

    def _equipped_equipment_items(self) -> tuple[EquipmentItem, ...]:
        by_id = {item.instance_id: item for item in self.equipment_items}
        equipped: list[EquipmentItem] = []
        seen: set[str] = set()
        for instance_id in self.equipment_slots:
            if not instance_id or instance_id in seen:
                continue
            item = by_id.get(instance_id)
            if item is None:
                continue
            equipped.append(item)
            seen.add(instance_id)
        return tuple(equipped)

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


def _disabled_skill_editor_response(**extra: Any) -> dict[str, Any]:
    return {
        "ok": False,
        "message_text": "SkillEditor is disabled.",
        **extra,
    }


def _runtime_position(raw: Any) -> dict[str, float]:
    if not isinstance(raw, dict):
        return {"x": 0.0, "y": 0.0}
    return {
        "x": float(raw.get("x", 0.0)),
        "y": float(raw.get("y", 0.0)),
    }
