## Context

当前项目同时存在前端战斗运行时和后端战斗/掉落链路。前端侧已经可以从 `map/map_001.json` 或 baked map 资源得到 `walkableGrid`、`blockerGrid`、`walkablePoints`、`playerSpawn`、`enemySpawnPoints`、`bossPoints` 和 `exitPoints`；地图编辑器也已经保存 `spawnPlans.monsterSpawns` 与 `spawnPlans.bossGroups`。后端侧 `CombatSession` 在怪物死亡时调用 `_drop_from_monster()`，并继续使用 `LootRuntime.generate_drop()` 生成掉落。

本设计把 V1 程序化生怪限制在地图生成/加载后的运行时表现和配置层，不重做 tilemap、地图编辑器、地图保存格式、碰撞规则或掉落公式。已有 `improve-monster-action-variety` change 负责怪物动作与醒来节奏的表现差异，本 change 只负责“在哪里生成什么怪物包”。

## Goals / Non-Goals

**Goals:**

- 基于现有地图运行时数据生成 `zone_type`、刷怪点、怪物包和怪物实例。
- 支持 V1 必需区域：`entrance`、`corridor`、`main_room`、`large_room`、`boss_room`，并预留 `dead_end`、`exit_area`。
- 用配置驱动 `map_spawn_profiles`、`monster_packs`、`monster_rarity_rules`。
- 复用现有怪物视觉类型、怪物定义、地图可行走/阻挡判断和掉落链路。
- 所有调试可见文本使用中文。
- 通过 smoke test / 单元测试覆盖核心过滤、预算、稀有度、Boss 和掉落回归。

**Non-Goals:**

- 不做 Atlas、Tablet、地图词缀、赛季机制或复杂事件。
- 不修改宝石系统规则、技能系统数值、数独盘规则或掉落公式。
- 不改地图编辑器核心交互，不迁移 `map_001.json` 保存格式。
- 不新增美术资源生成逻辑，不重做怪物 AI 或寻路系统。
- 不把 V1 程序化生怪扩展成完整关卡生成器。

## Decisions

1. 新增独立的前端生怪运行时模块。

   新增 `webapp/mapSpawnRuntime.ts`，导出纯函数，例如 `generateMapSpawnPlan(map, config, seed)`。该模块只消费 `BakedBattleMapData` 与配置，返回生成的敌人描述、刷怪点调试记录、过滤记录和汇总统计。

   理由：当前可见战斗运行时在前端，`App.tsx` 已经负责把地图点转成 `Enemy`。把算法放在独立模块可以避免继续膨胀 `App.tsx`，也方便 smoke test 和后续迁移。

   备选方案：直接在 `App.tsx` 内实现。该方案 diff 更集中，但会让已有超大文件继续承担算法、配置和 UI 调试职责，不利于测试。

2. 使用 JSON 作为 V1 生怪配置格式。

   新增 `configs/monsters/map_spawn_v1.json`，包含 `map_spawn_profiles`、`monster_packs`、`monster_rarity_rules`。前端可以通过 Vite 直接 import JSON，后端或测试也可以用标准库读取。

   理由：项目已有 TOML 配置，但浏览器侧没有 TOML 解析依赖；JSON 可以避免新增依赖，符合 V1 最小接入。

   备选方案：新增多个 TOML 文件并扩展 `src/liufang/config.py`。这更贴近后端配置风格，但前端需要额外转换或解析路径，会扩大本轮改动。

3. 区域识别采用保守启发式。

   V1 不依赖复杂房间图。生成器先基于已有点位和网格做保守分类：

   - 玩家出生点附近标为 `entrance`。
   - `bossPoints` 周边标为 `boss_room`；没有 Boss 点时可选择远离出生点的最大可行走候选区作为 Boss 区。
   - 候选点周围可行走邻域较窄时标为 `corridor`。
   - 大面积可行走邻域标为 `large_room`。
   - 其他可行走候选点标为 `main_room`。
   - `dead_end`、`exit_area` 保留配置字段，等地图结构能可靠识别后启用。

   理由：当前地图保存结构没有完整房间拓扑，强行识别死胡同和出口强度容易产生误判。先实现可测试、可解释的最小分类。

4. 怪物包以预算为主控。

   每个 `monster_pack` 有 `budget_cost`、`tags`、`weight` 和条目数量范围。生成器按 `zone_rules` 过滤可选包，并在 `base_pack_budget` 内抽取。超过预算的候选点记录中文过滤原因，不继续生成。

   理由：预算是防止无限生成和控制地图强度的最简单机制，也便于测试。

5. 稀有度作为运行时实例属性，不重命名既有怪物配置。

   V1 生成的实例带 `spawn_rarity: normal | magic | rare`、`life_multiplier`、`damage_multiplier` 和中文显示名。现有怪物组中的 `epic` 可作为 rare 候选来源或保持不用；本 change 不要求把既有 `epic` 配置迁移为 `rare`。

   理由：用户要求显示和规则使用“稀有”，但当前配置与测试已经存在 `epic` 分组。直接重命名会牵动怪物配置验证和本轮无关内容。

6. 死亡掉落通过现有回归测试确认。

   本 change 不修改 `LootRuntime` 和掉落权重。验收中通过现有或新增测试确认由生成结果创建的 `Monster` 在 `CombatSession` 中死亡后仍触发 `dropped_gems`。

   理由：需求是“继续走现有掉落逻辑”，不是改变掉落公式。

7. 调试输出先做轻量中文面板/日志。

   在战斗开始后展示或记录程序化生怪调试数据，包括地图类型、预算、包数量、普通/魔法/稀有数量、每个刷怪点的 `zone_type`、`monster_pack_id` 和过滤原因。

   理由：满足验收需要，同时避免改 UI 大结构。

## Risks / Trade-offs

- 区域识别不够精细 → V1 只承诺稳定识别入口、通道、普通房、大房和 Boss 房；`dead_end`、`exit_area` 先保留字段。
- JSON 配置与现有 TOML 风格不完全一致 → 用单文件 V1 配置降低前端接入成本，后续稳定后可迁移到统一配置加载。
- 前端生成与后端 `CombatSession` 不是同一个实例系统 → 本轮以可见战斗接入前端生怪，以后端掉落测试保护死亡掉落逻辑，后续可再做统一服务端战斗源。
- 现有 `App.tsx` 已很大 → 算法放新模块，`App.tsx` 只做最小接线和中文调试显示。
- 其他进行中的 change 可能同时改 `Enemy` 运行时字段 → 程序化生怪只设置必要字段，兼容后续动作差异字段，不反向依赖。

## Migration Plan

1. 新增配置和独立生怪模块，不改地图保存格式。
2. 在 `startGame()` 中优先尝试程序化 V1 生怪；若无可用结果，保留现有 authored spawn / fallback 行为。
3. 增加测试与 smoke 校验。
4. 如发现生成结果异常，可通过禁用 V1 配置或回退接线恢复现有 authored spawn 行为。

## Open Questions

- `rare` 是否最终要替换现有 `epic` 怪物组命名，还是长期作为运行时显示稀有度存在。
- 程序化刷怪是否应在后续版本完全取代编辑器手工怪点，还是长期与手工点混用。
- `dead_end` 与 `exit_area` 的可靠识别是否需要地图生成器输出额外区域元数据。
