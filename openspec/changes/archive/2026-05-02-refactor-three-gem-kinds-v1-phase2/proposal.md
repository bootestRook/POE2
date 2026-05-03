# 背景

当前 OpenSpec active changes 为空，当前相关 spec 是 `v1-minimal-sudoku-gem-loop`。V1 已有宝石、数独盘、效果路由、技能预览、中文 UI、WebApp 入口等基础能力，但宝石系统仍停留在旧结构：

- `active_skill_gem`
- `support_gem`
- `gem_type_1..9`

Explore 结论显示，当前 spec 仍使用旧 `gem_type`，并仍要求随机词缀，这是本次第二阶段需要修订的冲突点。当前 `gem_type_1..9` 同时承担数独数字、颜色、身份和部分角色语义，无法继续支撑三类宝石体系。

本 change 修改既有 capability：`v1-minimal-sudoku-gem-loop`。它不创建新业务模块，不进入 Apply，只为后续实现阶段建立三类宝石体系重构的规格、设计和任务边界。

# 问题

1. 当前没有 `gem_kind`。
2. 当前没有 `sudoku_digit`。
3. 当前没有 `passive_skill`。
4. 当前宝石系统只有 `active_skill_gem` 和 `support_gem` 两类。
5. 当前数独冲突判断仍依赖旧 `gem_type`：后端使用 `instance.gem_type`，前端使用 `gemTypeKey(gem)`。
6. 当前 `gem_type_1..9` 同时承担数独数字、颜色、身份和部分角色语义，导致“宝石大类”和“数独数字”无法独立演进。
7. 当前 spec 仍要求随机词缀，但用户最新要求是第二阶段不恢复随机词缀。
8. 当前随机词缀相关文件、字段、渲染逻辑仍有残留，但真实掉落不会生成随机词缀，后端也不输出随机词缀 section。
9. 当前 UI、连线、效果结算大量判断只认主动 / 辅助两类宝石，新增被动技能宝石后会失败。
10. 后续必须改为只检查 `sudoku_digit`，`gem_kind` 不得参与行 / 列 / 宫冲突判断。

# 目标

1. 将宝石系统重构为三类：
   - 主动技能宝石 `active_skill`
   - 被动技能宝石 `passive_skill`
   - 辅助宝石 `support`
2. 将原“技能宝石”正式迁移为“主动技能宝石”。
3. 新增被动技能宝石。
4. 拆分字段：
   - `gem_kind`：宝石大类。
   - `sudoku_digit`：数独数字。
5. 数独合法性只检查 `sudoku_digit`。
6. 被动技能宝石 UI 优先复用主动技能宝石已有 UI，包括：
   - `PresentationService.gem_detail`
   - `_gem_type_view`
   - `_base_effect_view`
   - 主动技能 tooltip 的布局 / 数值展示
   - `GemOrb`
   - 悬停定位和样式
7. 接入最小关系路由：
   - `support → passive`
   - `passive → active`
   - `support → active`
8. 保持旧主动技能宝石和旧辅助宝石行为不破坏。
9. 保证随机词缀 UI 和真实数据不回归。
10. 不删除现有 affix 残留系统，只做防回归约束，不恢复使用。

# 非目标

1. 不做随机词缀。
2. 不恢复随机词缀 UI。
3. 不恢复随机词缀生成。
4. 不删除现有 affix 残留文件。
5. 不做装备系统。
6. 不做魔力封印。
7. 不做完整异常系统。
8. 不做抗性 / 护甲 / 闪避。
9. 不做被动宝石专属复杂 UI。
10. 不做导管完整重构，除非只是兼容已有导管逻辑。
11. 不重构地图、怪物、投射物动画、资源资产、掉落主循环等无关模块。

# 验收标准

1. 旧主动技能宝石仍可识别、放置、预览、战斗使用。
2. 旧辅助宝石仍可识别、放置、影响主动技能。
3. 新增被动技能宝石可识别、放置、展示。
4. `gem_kind` 只表示宝石大类。
5. `sudoku_digit` 只表示数独数字。
6. 行 / 列 / 宫冲突只检查 `sudoku_digit`。
7. 同一 `gem_kind` 不同 `sudoku_digit` 不冲突。
8. 不同 `gem_kind` 同一 `sudoku_digit` 在同行 / 同列 / 同宫仍冲突。
9. 被动宝石详情 UI 复用主动宝石 UI 结构。
10. 被动宝石不主动释放技能。
11. `passive → active` 生效。
12. `support → passive` 生效。
13. `support → support` 禁止。
14. `passive → passive → active` 递归禁止。
15. 随机词缀 UI 不回归。
16. 随机词缀真实数据不回归。
17. 玩家可见文本全部中文。
