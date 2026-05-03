## Why

当前战斗地图已经有 tilemap、可行走/阻挡网格、玩家出生点、编辑器怪点和 Boss 点，但怪物生成仍偏向手工预设或简单 fallback，缺少一个能基于地图结果稳定生成怪物包的最小运行时链路。

本变更引入 V1 程序化生怪骨架，让地图生成或加载完成后可以按区域类型、预算、距离和稀有度规则生成怪物，同时继续复用现有怪物定义、地图编辑器、碰撞判断和掉落逻辑。

## What Changes

- 新增地图区域标记与刷怪点生成能力，支持 `entrance`、`corridor`、`main_room`、`large_room`、`boss_room`，并为 `dead_end`、`exit_area` 预留规则字段。
- 新增 V1 生怪配置，包含 `map_spawn_profiles`、`monster_packs`、`monster_rarity_rules`。
- 新增程序化生怪运行时，按 `zone_type`、预算、出生点距离、包间距、可行走/阻挡规则筛选刷怪点。
- 支持怪物包生成，而不是只生成单个怪物；怪物包可以包含多种怪物条目和数量范围。
- 支持 V1 稀有度升级：`normal`、`magic`、`rare`，使用简单生命/伤害倍率，并限制稀有怪和魔法包数量。
- Boss 区域固定生成 Boss，并可生成少量随从。
- 新增中文调试输出，展示地图类型、预算、生成包数、普通/魔法/稀有数量、刷怪点区域、怪物包 ID 和过滤原因。
- 增加 smoke test / 单元测试覆盖入口不刷怪、阻挡格不刷怪、包间距、预算上限、large_room 可生成魔法怪、稀有数量上限、Boss 必出、死亡后仍走现有掉落链路。
- 不修改宝石系统规则、技能数值、数独盘规则、掉落公式、地图编辑器核心交互和美术资源生成逻辑。

## Capabilities

### New Capabilities

- `procedural-monster-spawn-v1`: 定义基于现有 tilemap/地图运行时数据的 V1 程序化怪物包生成、区域规则、稀有度升级、Boss 生成、过滤调试和掉落链路保持要求。

### Modified Capabilities

- 无。

## Impact

- 影响前端战斗运行时：`webapp/App.tsx`、新增生怪运行时模块、smoke test。
- 影响配置：新增怪物包、生怪 profile 和稀有度规则配置；复用现有 `configs/monsters/monster_defs.toml` 与 `configs/monsters/monster_groups.toml`。
- 影响测试：新增或扩展程序化生怪测试，并保留现有 `tests/test_combat.py` 掉落回归。
- 不引入新依赖；不迁移地图保存格式；不重做地图编辑器或 tilemap 数据结构。
