## Why

当前技能释放频率把“自动释放节奏”“动作速度”和“冷却缩减”混在同一个 `final_cooldown_ms` 里，导致 `cooldown_reduction_percent = 100` 这类数值会把冷却推到 0，也很难表达《火炬之光：无限》式的“冷却回复速度提高”口径。

本项目目前没有真正意义上的角色动作或动画动作间隔，因此本变更将“动作间隔”适配为内部的“释放门槛间隔”：它只表示 Skill Runtime 允许同一个主动技能再次发起一次释放的最短基础节奏，不引入动画、VFX 或动作系统。

## What Changes

- **BREAKING**：废弃 `cooldown_reduction_percent`，活动配置、Runtime、预览、校验和测试不得继续引用该字段。
- 新增 `cooldown_recovery_add_percent`，表示“冷却回复速度提高”，按 `BaseCooldownMs / (1 + cooldown_recovery_add_percent / 100)` 计算。
- 保留 `attack_speed_add_percent`、`cast_speed_add_percent`、`skill_speed_final_percent` 和 `added_cooldown_ms`，但明确它们的职责边界。
- 将现有技能基础释放节奏从“冷却”语义迁移为“释放门槛间隔”：攻击技能受攻击速度影响，法术技能受施法速度影响，两者都受最终技能速度影响。
- 新增或显式支持 `base_cooldown_ms` 作为真冷却，普通循环技能可为 0；真冷却受 `cooldown_recovery_add_percent` 和 `added_cooldown_ms` 影响。
- 新增 `trigger_interval_ms`，用于触发或检测轮询间隔；默认不参与冷却计算，也不受冷却回复速度影响。
- 技能同时存在释放门槛间隔和真冷却时，实际释放间隔取两者更慢者。
- 为所有主动技能宝石明确释放链条：基础释放门槛、真冷却、触发间隔、实际释放间隔、资源消耗与 Skill Runtime 事件链路。
- 重新规划现有主动技能宝石、被动技能宝石和辅助技能宝石的频率/冷却/资源相关效果，确保配置含义与 Runtime 口径一致。
- 新增最小魔力消耗口径：主动技能可以配置 `mana_cost`，释放时真实扣除魔力，魔力不足时不释放，并在宝石信息中显示；本变更不扩展复杂魔力保留、魔力倍率或装备词缀系统。
- 更新冷却类辅助宝石、随机词缀白名单/校验、中文本地化、技能预览和 Debug 输出文案。
- 不修改 VFX/动画资源、不修改数独盘规则、不修改宝石连接规则、不新增装备、护甲抗性等系统。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `v1-minimal-sudoku-gem-loop`: 修改技能释放频率、攻击/施法速度、冷却回复速度、附加冷却、触发间隔、技能预览和相关配置校验的需求。

## Impact

- 配置：`configs/player/player_stat_defs.toml`、`configs/player/player_base_stats.toml`、`configs/player/character_panel.toml`、`configs/skills/skill_scaling_rules.toml`、`configs/skills/schema/skill.schema.json`、主动技能 `skill.yaml`、`support_cooldown_focus`、`configs/affixes/affix_defs.toml`、`configs/localization/zh_cn.toml`。
- Runtime：`src/liufang/skill_effects.py`、`src/liufang/config.py`、战斗自动释放使用的最终技能实例字段。
- Combat：主动技能释放调度需要检查并扣除 `mana_cost`，魔力不足时跳过本次释放并保留可解释状态。
- 预览/Debug：`src/liufang/presentation.py`、`src/liufang/skill_editor.py`、组合报告或校准报告中涉及冷却字段的输出。
- 校验与测试：`tools/validate_v1_configs.py`、技能效果测试、配置校验测试、组合报告测试，以及旧字段禁用测试。
- 不影响：技能表现/VFX/动画资源、数独盘规则、宝石连接规则、装备系统、护甲抗性系统。
