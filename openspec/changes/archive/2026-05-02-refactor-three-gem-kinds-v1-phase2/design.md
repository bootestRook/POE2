# 1. 字段模型

第二阶段把旧 `gem_type` 的职责拆成两个明确字段：

```text
gem_kind = active_skill / passive_skill / support
sudoku_digit = 1~9
```

`gem_kind` 只表示宝石大类，不参与数独冲突判断。`sudoku_digit` 只表示数独数字，行 / 列 / 宫冲突判断只能检查 `sudoku_digit`。

字段含义如下：

| 字段 | 含义 | 允许值 | 是否参与数独冲突 |
|---|---|---|---|
| `gem_kind` | 宝石大类 | `active_skill` / `passive_skill` / `support` | 否 |
| `sudoku_digit` | 数独数字 | 1 到 9 | 是 |

当前 `gem_type_1..9` 同时承担数独数字、颜色、身份和部分角色语义。Apply 阶段应逐步把旧 `gem_type` 映射为 `sudoku_digit`，把旧 `active_skill_gem` / `support_gem` tag 映射为 `gem_kind`，避免一次性删除旧字段导致 UI、测试和旧数据同时断裂。

# 2. 数据定义

当前技能宝石定义在 `configs/gems/active_skill_gems.toml`，辅助宝石定义在 `configs/gems/support_gems.toml`，实例结构在 `src/liufang/inventory.py` 的 `GemInstance`。第二阶段建议新增被动技能宝石定义文件：

```text
configs/gems/passive_skill_gems.toml
```

基础定义建议统一包含：

```text
id
name_key
description_key
gem_kind
sudoku_digit
tags
effect_stats / passive_effects
apply_filter
skill_template
```

其中：

- 主动技能宝石保留 `skill_template`。
- 被动技能宝石不配置主动释放模板。
- 辅助宝石保留 `apply_filter`，后续可支持主动技能宝石或被动技能宝石。
- 真实宝石数据不得新增随机词缀字段。
- 现有 affix 残留文件不得删除，但不得作为第二阶段新增能力使用。

实例结构建议包含：

```text
instance_id
base_gem_id
gem_kind
sudoku_digit
rarity
level
locked
board_position
```

为了兼容旧数据，Apply 阶段可以临时保留旧 `gem_type` 读写适配，但新规则和新 UI 不应继续从 `gem_type` 推断宝石大类或数独合法性。

# 3. 数独盘规则

当前后端冲突判断使用 `instance.gem_type`，前端合法格高亮使用 `gemTypeKey(gem)`。第二阶段必须统一为：

```text
冲突 key = sudoku_digit
```

后端需要修改：

- `SudokuGemBoard._require_legal_gem_type` 的职责改为检查 `sudoku_digit`。
- `_append_duplicate_issues` 按 `sudoku_digit` 分组。
- 错误 key 和中文文案从 `gem_type` 语义迁移到 `sudoku_digit` 语义。
- 关系计算仍只看位置，不看 `gem_kind`。

前端需要修改：

- `gemTypeKey(gem)` 不再作为冲突 key。
- `useLegalDropCells` 和 `canPlaceGemOnBoard` 使用后端下发的 `sudoku_digit`。
- 合法格高亮、不可放置提示、预览摘要必须保持中文。

规则示例：

| 场景 | 结果 |
|---|---|
| 同一 `gem_kind`，不同 `sudoku_digit`，同行 | 不冲突 |
| 不同 `gem_kind`，同一 `sudoku_digit`，同行 | 冲突 |
| 同一 `sudoku_digit`，同宫 | 冲突 |
| 不同 `sudoku_digit`，同列 | 不冲突 |

# 4. UI 复用策略

被动技能宝石 UI 必须优先复用主动技能宝石已有路径，不新增复杂专属 UI。Explore 已确认可复用点包括：

- `PresentationService.gem_detail`
- `_gem_type_view`
- `_base_effect_view`
- 主动技能 tooltip 的布局 / 数值展示
- `GemOrb`
- 悬停定位和样式

推荐做法：

1. 在 `gem_detail` 输出中增加 `gem_kind` 和 `sudoku_digit`。
2. `_gem_category_text` 从二分判断改为三类映射。
3. 被动技能宝石 tooltip 优先走主动技能 tooltip 的结构，但隐藏主动释放字段，例如冷却、投射物数量、近期 DPS。
4. 被动效果展示复用主动 tooltip 的“核心数值”和“当前加成”区块。
5. 辅助宝石 tooltip 保持现有结构，只扩展可影响目标为主动或被动。

随机词缀 UI 不得恢复。前端现有 `random_affixes` section 类型和渲染逻辑可以作为残留存在，但后端不得输出该 section，测试需要防止它回归。

# 5. 悬停、高亮、连线

普通悬停高亮应继续复用 `useLinkedGemIds` 和后端 `board.highlights`。它们基于盘面关系而非宝石大类，适合直接覆盖被动宝石。

支持线和影响预览需要扩展：

- 当前 `useSupportPreview` 只识别 `support -> active`。
- 当前 `useSupportLines` 只绘制 `support -> active`。
- 当前 `useActiveTargetLines` 只在悬停主动技能宝石时显示 incoming support 线。

第二阶段建议把前端线条生成从硬编码 `isSupportGem(source) && isActiveGem(target)` 改为读取后端 `applied_modifiers` 中的 source / target / relation / reason，并按 `gem_kind` 做最小过滤：

```text
允许显示：support -> active
允许显示：support -> passive
允许显示：passive -> active
禁止显示：support -> support
禁止显示：passive -> passive 递归链
```

被动宝石悬停时应至少显示自身、关系宝石、高亮格、可生效目标。复杂专属动画不属于本阶段目标。

# 6. 关系路由 / 效果结算

当前 `SkillEffectCalculator` 以主动技能为聚合入口，遍历关系内的 `support_gem`，生成 `FinalSkillInstance`。第二阶段保留主动技能作为最终战斗实例入口，但增加被动贡献层。

推荐固定顺序：

```text
1. 读取主动技能宝石基础定义
2. 计算 support -> active
3. 计算 support -> passive
4. 汇总 passive 自身基础效果和被 support 放大的被动效果
5. 计算 passive -> active
6. 应用已有行 / 列 / 宫 / 相邻关系系数和导管兼容逻辑
7. 按 additive / final 聚合主动技能最终数值
8. 输出 FinalSkillInstance
```

防递归规则：

- `support -> support` 必须禁止。
- `passive -> passive` 必须禁止作为二次传播链。
- `passive -> active` 只执行一层。
- `support -> passive -> active` 是允许的固定两段流程，但不得继续触发新的传播。
- 同一 source、target、stat 仍只结算一次。
- 导管只放大已有关系，不创建新的二次传播链。

# 7. 技能预览 / 战斗实例

主动技能最终数值仍由 `FinalSkillInstance` 承载，战斗仍只自动释放主动技能宝石。被动技能宝石不得进入自动释放队列。

技能预览建议扩展为：

- 主动技能预览继续显示最终伤害、最终冷却、范围、速度等字段。
- `applied_modifiers` 增加来自被动技能宝石的贡献来源。
- 被动贡献在 UI 中显示中文来源名称、关系文本、属性文本和值。

self_stat 被动建议接入玩家属性聚合层，而不是主动技能实例层。最小接入点：

- `max_life`
- `move_speed`
- `pickup_radius`

这些属性已有配置定义，可在战斗开始构造 `Player` 前完成被动贡献聚合，并把结果传给战斗和前端 HUD。第二阶段不实现完整属性系统，只实现被动宝石贡献到这些 V1 已有 self_stat 的最小路径。

# 8. 随机词缀防回归

Explore 已确认当前存在 affix 残留：

- `src/liufang/affixes.py`
- `GemInstance.prefix_affixes`
- `GemInstance.suffix_affixes`
- `GemInstance.implicit_affixes`
- `configs/affixes/*`
- `webapp/App.tsx` 的 `random_affixes` 渲染逻辑
- `configs/localization/zh_cn.toml` 中随机词缀相关文案

但当前真实掉落不会生成随机词缀，后端也不输出随机词缀 section。第二阶段要求：

- 不删除 affix 残留文件。
- 不新增随机词缀真实数据。
- 不恢复随机词缀生成逻辑。
- 不恢复随机词缀 UI。
- 不把被动技能宝石设计成随机词缀容器。
- 测试必须断言后端详情和前端 tooltip 不出现随机词缀 section。

# 9. 测试与验证

后续 Apply 阶段应补充以下测试：

1. `gem_kind` 三值校验。
2. `sudoku_digit` 1 到 9 校验。
3. 行 / 列 / 宫冲突只看 `sudoku_digit`。
4. 同一 `gem_kind` 不同 `sudoku_digit` 不冲突。
5. 不同 `gem_kind` 同一 `sudoku_digit` 冲突。
6. 旧主动技能宝石行为不变。
7. 旧辅助宝石行为不变。
8. 被动技能宝石可识别、放置、展示。
9. 被动宝石 tooltip 复用主动宝石 UI 结构。
10. `support -> passive` 生效。
11. `passive -> active` 生效。
12. `support -> support` 禁止。
13. `passive -> passive -> active` 递归禁止。
14. self_stat 被动影响生命、移动速度、拾取范围。
15. 随机词缀 UI 不回归。
16. 随机词缀真实生成不回归。
17. 玩家可见文本全部中文。

推荐验证命令：

```powershell
cmd /c openspec validate refactor-three-gem-kinds-v1-phase2 --strict
python tools\validate_v1_configs.py
python -m unittest discover tests
cmd /c npm test
cmd /c npm run build
```

# 10. 不应触碰的模块

本阶段后续 Apply 不应触碰以下模块，除非任务明确需要最小接入点：

- `configs/affixes/*`：只保留残留，不恢复随机词缀。
- `src/liufang/affixes.py`：只作为残留系统存在，不扩展生成路径。
- WebApp 地图、怪物、投射物动画和 `webapp/assets/*`：与三类宝石重构无关。
- 装备、货币、地图、赛季、职业等未实现系统：不属于 V1 第二阶段。
- 掉落主循环和战斗击杀主流程：只允许为 passive self_stat 做最小接入，不重构战斗玩法。
