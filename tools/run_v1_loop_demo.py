from __future__ import annotations

import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from liufang.affixes import AffixGenerator
from liufang.combat import CombatSession, Monster, Player, Position
from liufang.config import (
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
from liufang.presentation import PresentationService
from liufang.skill_effects import SkillEffectCalculator


CONFIG_ROOT = ROOT / "configs"


def build_calculator(board: SudokuGemBoard, definitions: dict) -> SkillEffectCalculator:
    affixes = load_affix_definitions(CONFIG_ROOT)
    return SkillEffectCalculator(
        board=board,
        definitions=definitions,
        skill_templates=load_skill_templates(CONFIG_ROOT),
        relation_coefficients=load_relation_coefficients(CONFIG_ROOT),
        scaling_rules=load_skill_scaling_rules(CONFIG_ROOT),
        affix_definitions={definition.affix_id: definition for definition in affixes},
    )


def build_loot_runtime(definitions: dict, seed: int) -> LootRuntime:
    affixes = load_affix_definitions(CONFIG_ROOT)
    return LootRuntime.from_configs(
        CONFIG_ROOT,
        definitions,
        {"normal": 1},
        AffixGenerator(affixes, load_rarity_affix_counts(CONFIG_ROOT), random.Random(seed)),
        rng=random.Random(seed),
    )


def print_gem_detail(title: str, detail: dict) -> None:
    print(f"\n== {title} ==")
    print(f"名称：{detail['name_text']}")
    print(f"类型：{detail['category_text']} / {detail['gem_type']['display_text']} / {detail['gem_type']['identity_text']}")
    print("标签：" + "、".join(tag["text"] for tag in detail["tags"]))
    print(f"稀有度：{detail['rarity_text']}")
    targets = [target["name_text"] for target in detail["current_effective_targets"]]
    print("当前生效对象：" + "、".join(targets))


def print_board(title: str, board_view: dict) -> None:
    print(f"\n== {title} ==")
    print("盘面提示：" + "；".join(board_view["prompts"]))
    print("已放置宝石：")
    for gem in board_view["placed_gems"]:
        position = gem["position"]
        print(f"  - ({position['row'] + 1}, {position['column'] + 1}) {gem['name_text']} [{gem['gem_type']['display_text']}]")
    print("关系预览：")
    for relation in board_view["influence_preview"]:
        print(f"  - {relation['source']['name_text']} -> {relation['target']['name_text']}：{relation['relation_text']}")
    if board_view["skill_preview"]:
        skill = board_view["skill_preview"][0]
        print("技能预览：")
        print(f"  - {skill['name_text']}：最终伤害 {skill['final_damage']:.2f}，最终冷却 {skill['final_cooldown_ms']} 毫秒")


def print_combat_hud(hud: dict) -> None:
    print("\n== 战斗 HUD ==")
    life = hud["player_life"]
    print(f"{life['label_text']}：{life['current']}/{life['max']}")
    print(f"{hud['elapsed_ms']['label_text']}：{hud['elapsed_ms']['value']} 毫秒")
    print(f"{hud['alive_monsters']['label_text']}：{hud['alive_monsters']['value']}")
    for skill in hud["active_skills"]:
        print(f"技能：{skill['name_text']} / {skill['status_text']} / 剩余 {skill['remaining_ms']} 毫秒")
    for drop in hud["drop_prompts"]:
        print(f"掉落：{drop['name_text']} / {drop['rarity_text']} / {drop['status_text']}")
    for pickup in hud["pickup_prompts"]:
        print(f"拾取：{pickup['name_text']} / {pickup['status_text']}")


def main() -> int:
    definitions = load_gem_definitions(CONFIG_ROOT)
    inventory = GemInventory(definitions)
    board = SudokuGemBoard(load_board_rules(CONFIG_ROOT), inventory)
    presenter = PresentationService.from_configs(CONFIG_ROOT)

    print("========================================")
    print("V1 正式最小循环控制台展示")
    print("========================================")
    print("流程：看基础信息 -> 调盘面 -> 技能表现变化 -> 战斗刷宝石 -> 拾取 -> 再调盘面")

    active = inventory.add_instance(
        "demo_active_fire_bolt",
        "active_fire_bolt",
        rarity="magic",
    )
    board.mount_gem(active.instance_id, 0, 0)

    initial_skills = build_calculator(board, definitions).calculate_all()
    print_gem_detail(
        "库存宝石详情",
        presenter.gem_detail(active, board=board, final_skills=initial_skills),
    )
    initial_board = presenter.board_view(board, final_skills=initial_skills)
    print_board("初始数独盘与技能预览", initial_board)
    initial_damage = initial_board["skill_preview"][0]["final_damage"]

    session = CombatSession.start(
        player=Player("player_1", current_life=100, max_life=100, position=Position(0, 0), item_interaction_reach=2),
        monsters=[Monster("monster_1", current_life=5, max_life=5, position=Position(1, 0))],
        inventory=inventory,
        skill_effect_calculator=build_calculator(board, definitions),
        loot_runtime=build_loot_runtime(definitions, seed=6),
    )
    events = session.tick(1)
    print("\n== 自动战斗 ==")
    for event in events:
        print(f"自动释放技能造成 {event.damage:.2f} 伤害，击杀：{'是' if event.killed else '否'}")
    print_combat_hud(presenter.combat_hud(session))

    picked = session.pickup_nearby()
    if not picked:
        print("\n没有拾取到宝石。")
        return 1
    new_gem = picked[0]
    print_gem_detail(
        "新拾取宝石详情",
        presenter.gem_detail(new_gem, board=board, final_skills=initial_skills),
    )

    board.mount_gem(new_gem.instance_id, 0, 3)
    updated_skills = build_calculator(board, definitions).calculate_all()
    updated_board = presenter.board_view(board, final_skills=updated_skills)
    updated_damage = updated_board["skill_preview"][0]["final_damage"]
    print_board("重新上盘后的数独盘与技能预览", updated_board)

    print("\n== 闭环结果 ==")
    print(f"调整前最终伤害：{initial_damage:.2f}")
    print(f"调整后最终伤害：{updated_damage:.2f}")
    print("技能表现已随新宝石和盘面关系发生变化。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
