## 1. 配置与数据契约

- [x] 1.1 新增 `configs/monsters/map_spawn_v1.json`，包含 `map_spawn_profiles`、`monster_packs`、`monster_rarity_rules`。
- [x] 1.2 在配置中定义默认地图类型、`base_pack_budget`、玩家出生点安全距离、怪物包最小距离、最大激活包数和 `zone_rules`。
- [x] 1.3 在配置中定义 V1 怪物包：`imp_small`、`imp_mixed`、`brute_guard`、Boss 包和必要随从包。
- [x] 1.4 在配置中定义 `normal`、`magic`、`rare` 权重、倍率、区域白名单和数量上限。

## 2. 程序化生怪运行时

- [x] 2.1 新增 `webapp/mapSpawnRuntime.ts`，定义区域类型、配置类型、生成结果、调试记录和过滤原因类型。
- [x] 2.2 实现基于 `BakedBattleMapData` 的候选点收集，复用 `walkableGrid`、`blockerGrid`、`walkablePoints`、`playerSpawn`、`bossPoints` 和 `exitPoints`。
- [x] 2.3 实现 V1 区域分类：`entrance`、`corridor`、`main_room`、`large_room`、`boss_room`，并保留 `dead_end`、`exit_area` 字段。
- [x] 2.4 实现候选刷怪点过滤：入口、出生点距离、阻挡格、不可行走区域、包间距、区域规则和预算不足。
- [x] 2.5 实现按 `zone_rules` 和权重抽取 `monster_pack`，并按条目数量范围生成整包怪物。
- [x] 2.6 实现 `normal`、`magic`、`rare` 稀有度升级和生命/伤害倍率，并限制稀有怪和魔法包数量。
- [x] 2.7 实现 Boss 房固定 Boss 生成和少量随从生成。
- [x] 2.8 使用稳定 seed 生成随机结果，避免每帧重新随机。

## 3. 前端运行时接入

- [x] 3.1 在 `webapp/App.tsx` 中最小接入程序化生怪结果，把生成实例转换为现有 `Enemy`。
- [x] 3.2 保留现有 authored spawn 和 fallback spawn；当程序化生怪无可用结果时继续回退。
- [x] 3.3 保持地图编辑器 tile 选择、放置、保存、加载和核心交互不变。
- [x] 3.4 兼容现有 `Enemy` 字段和后续怪物动作差异字段，不改变技能伤害、碰撞半径和掉落公式。

## 4. 中文调试输出

- [x] 4.1 新增轻量中文调试日志或调试面板，显示当前地图类型、总预算和已生成怪物包数量。
- [x] 4.2 显示已生成普通怪、魔法怪、稀有怪数量。
- [x] 4.3 显示每个刷怪点的 `zone_type` 和 `monster_pack_id`。
- [x] 4.4 显示被过滤刷怪点的中文原因：入口区域不刷怪、距离玩家出生点过近、不可行走、阻挡格、怪物包距离过近、预算不足、区域规则不允许。

## 5. 测试与验证

- [x] 5.1 增加程序化生怪测试：`entrance` 区域不刷怪。
- [x] 5.2 增加程序化生怪测试：阻挡格和不可行走区域不刷怪。
- [x] 5.3 增加程序化生怪测试：怪物包之间距离不小于 `min_distance_between_packs`。
- [x] 5.4 增加程序化生怪测试：总生怪预算不超过 `base_pack_budget`。
- [x] 5.5 增加程序化生怪测试：`large_room` 可以生成 `magic` 怪。
- [x] 5.6 增加程序化生怪测试：`rare` 怪数量不超过 `max_rare_per_map`。
- [x] 5.7 增加程序化生怪测试：`boss_room` 必定生成 Boss。
- [x] 5.8 增加或保留掉落回归测试：生成怪物死亡后仍通过现有 `CombatSession` 掉落链路产生掉落。
- [x] 5.9 更新 `webapp/smoke-test.mjs`，检查 V1 生怪配置、运行时导出和中文调试文本。
- [x] 5.10 运行 `npm test`。
- [x] 5.11 运行 `npm run build`。
- [x] 5.12 执行浏览器或日志验收，确认中文调试输出可看到地图类型、预算、包数、稀有度计数、刷怪点结果和过滤原因。

## 6. 禁区确认

- [x] 6.1 确认没有修改宝石系统规则。
- [x] 6.2 确认没有修改技能系统数值。
- [x] 6.3 确认没有修改数独盘规则。
- [x] 6.4 确认没有修改掉落公式本身。
- [x] 6.5 确认没有修改地图编辑器核心交互或地图保存格式。
- [x] 6.6 确认没有修改美术资源生成逻辑。
