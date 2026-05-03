# 火炬之光技能复刻 V1 实施报告

生成日期：2026-05-03

## 内容统计

| 类型 | 数量 | 状态 |
| --- | ---: | --- |
| TLIDB 主动技能 | 16 | 已作为第一版产品内容接入 |
| TLIDB 辅助技能 | 30 | 已按现有辅助分类接入 |
| TLIDB 被动/光环技能 | 9 | 已作为 `passive_skill` 接入 |
| 项目数独导管辅助 | 3 | 已保留，且不计入 TLIDB 30 个辅助 |
| TLIDB 内容合计 | 55 | 主动 + 辅助 + 被动/光环 |
| 总宝石内容 | 58 | 55 个 TLIDB 内容 + 3 个项目导管 |

## 已完成

- 旧项目主动/辅助/被动不再作为第一版产品内容出现；`load_gem_definitions()` 会按 `configs/skills/tlidb_adopted_skills.json` 过滤产品内容。
- 16 个主动技能、30 个 TLIDB 辅助、9 个被动/光环、3 个项目导管都已生成配置，并纳入掉落池、默认 WebApp 库存和校验。
- 每个采用技能都带有 `source_values`、`level_table`、自动释放适配信息或明确的被动/辅助路由信息。
- 主动技能运行时会按宝石等级读取等级表里的 `base_damage`、`release_interval_ms`、`base_cooldown_ms`、`trigger_interval_ms`、`mana_cost` 以及 runtime params。
- 辅助技能现在先按自身等级读取 TLIDB 等级表数值，再经过数独关系、source/target power 和导管缩放。
- 被动/光环按自身等级读取等级表数值，通过 `passive_skill -> active_skill` 或 `self_stat` 生效，不生成主动释放实例。
- 自动释放适配已区分普通目标策略、持续窗口，以及 `Stoneskin` 这类防御阈值技能；健康状态未触发时不会消耗魔力。
- 技能详情和技能预览已暴露 TLIDB 源数值、当前等级表数值、数独路由后的 modifier、最终计算值和自动释放策略。
- 已输出采用/剔除范围报告与六类样例搭配报告。

## 未完整复刻或后续增强

- `Stoneskin` 已按防御阈值触发，但完整的伤害吸收护盾层、吸收上限消耗和持续期间减伤事件还未做成独立 buff 系统。
- 点燃、冰结、麻痹、凋零等状态目前以数值和接口语义保留，完整异常状态栈、持续伤害结算和怪物状态 UI 仍是后续工作。
- `Overload`、`Guard`、`Channel_Preparation` 等依赖层数或每 N 次触发的复杂辅助，第一版先按可落地的固定/期望值进入数独路由，完整层数状态机后续实现。
- 位移、药水、复杂召唤、精确手动地面技能、职业/装备/天赋/赛季系统未纳入本版。

## 验证记录

通过：

- `python tools/validate_v1_configs.py`
- `python tools/validate_skill_packages.py`
- `python -m pytest tests/test_tlidb_adoption.py`

已运行但未通过：

- `python -m pytest tests/test_combat.py tests/test_presentation.py tests/test_skill_effects.py`

失败主因是这些旧测试仍大量硬编码旧产品 ID，例如 `active_fire_bolt`、`active_lava_orb`、`support_fast_attack`、`passive_fire_focus`。这些 ID 按本变更要求已被排除出第一版产品定义，因此旧测试需要迁移到 TLIDB 新 ID 或改成参考内容测试。

## 可玩样例

样例搭配已写入 `reports/torchlight_sample_boards.md`，覆盖：

- 火焰投射清图
- 冰冷范围控制
- 闪电连锁
- 近战持续窗口/挥斩
- 腐蚀区域
- 防御/被动生存
