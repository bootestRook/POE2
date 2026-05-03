## ADDED Requirements

### Requirement: 技能频率属性字段
系统 SHALL 使用明确分工的技能频率属性字段，并 SHALL NOT 在活动配置、Runtime、预览、校验或测试中继续使用 `cooldown_reduction_percent`。

#### Scenario: V1 频率字段清单
- **WHEN** V1 玩家属性、技能缩放规则、辅助宝石、词缀、预览或 Runtime 统计字段被校验
- **THEN** 系统 SHALL 支持 `attack_speed_add_percent`、`cast_speed_add_percent`、`skill_speed_final_percent`、`cooldown_recovery_add_percent`、`added_cooldown_ms` 和 `trigger_interval_ms`

#### Scenario: 旧字段禁用
- **WHEN** 活动配置、Runtime 代码路径、技能预览字段或 V1 校验规则引用 `cooldown_reduction_percent`
- **THEN** 校验 SHALL 失败并给出明确错误，说明应使用 `cooldown_recovery_add_percent`

#### Scenario: 字段含义
- **WHEN** 技能最终效果计算读取频率字段
- **THEN** `attack_speed_add_percent` SHALL 只影响 attack 标签技能，`cast_speed_add_percent` SHALL 只影响 spell 标签技能，`skill_speed_final_percent` SHALL 作为攻击和施法通用最终乘区，`cooldown_recovery_add_percent` SHALL 只影响真冷却恢复，`added_cooldown_ms` SHALL 作为固定冷却惩罚，`trigger_interval_ms` SHALL 只表示触发或检测间隔

### Requirement: 释放门槛间隔
系统 SHALL 将当前没有真实动作系统的“动作间隔”适配为内部释放门槛间隔，用于限制同一主动技能再次发起释放的基础节奏。

#### Scenario: 攻击技能释放门槛
- **WHEN** 主动技能带有 attack 标签并存在基础释放间隔
- **THEN** 系统 SHALL 使用 `BaseAttackIntervalMs / (1 + attack_speed_add_percent / 100) / (1 + skill_speed_final_percent / 100)` 计算攻击释放间隔，并 SHALL NOT 读取 `cast_speed_add_percent` 修正该间隔

#### Scenario: 法术技能释放门槛
- **WHEN** 主动技能带有 spell 标签并存在基础释放间隔
- **THEN** 系统 SHALL 使用 `BaseCastIntervalMs / (1 + cast_speed_add_percent / 100) / (1 + skill_speed_final_percent / 100)` 计算施法释放间隔，并 SHALL NOT 读取 `attack_speed_add_percent` 修正该间隔

#### Scenario: 释放门槛不代表动画动作
- **WHEN** 玩家查看技能预览、Debug 输出或中文说明
- **THEN** 系统 SHALL 使用“基础释放间隔”“攻击释放间隔”“施法释放间隔”或“实际释放间隔”等中文文案，且 SHALL NOT 暗示项目新增了动画动作、前摇或后摇系统

### Requirement: 冷却回复速度公式
系统 SHALL 使用冷却回复速度口径计算真冷却，并 SHALL 在冷却回复计算后追加附加冷却。

#### Scenario: 冷却回复不会把冷却归零
- **WHEN** `BaseCooldownMs = 10000`、`cooldown_recovery_add_percent = 100` 且 `added_cooldown_ms = 0`
- **THEN** `FinalCooldownMs` SHALL 为 `5000`，而不是 `0`

#### Scenario: 附加冷却在冷却回复后追加
- **WHEN** `BaseCooldownMs = 10000`、`cooldown_recovery_add_percent = 100` 且 `added_cooldown_ms = 1000`
- **THEN** `FinalCooldownMs` SHALL 为 `6000`

#### Scenario: 冷却下限
- **WHEN** 技能存在真冷却侧约束并计算得到的 `FinalCooldownMs` 小于 `100`
- **THEN** 系统 SHALL 将 `FinalCooldownMs` 限制为至少 `100`

#### Scenario: 无真冷却技能不被冷却下限强加冷却
- **WHEN** 技能没有真冷却且 `added_cooldown_ms = 0`
- **THEN** 系统 SHALL NOT 因冷却下限给该技能额外添加 `100ms` 真冷却

### Requirement: 实际释放间隔
系统 SHALL 将实际释放频率计算为释放门槛和真冷却中更慢的一侧。

#### Scenario: 同时存在释放门槛和冷却
- **WHEN** `ActionIntervalMs = 500` 且 `FinalCooldownMs = 2000`
- **THEN** `ActualIntervalMs` SHALL 为 `2000`

#### Scenario: 只有冷却没有释放门槛
- **WHEN** 主动技能只有真冷却配置而没有 attack 或 spell 释放门槛
- **THEN** 系统 SHALL 使用 `FinalCooldownMs` 作为 `ActualIntervalMs`

#### Scenario: 只有释放门槛没有冷却
- **WHEN** 主动技能有 attack 或 spell 释放门槛且没有真冷却
- **THEN** 系统 SHALL 使用释放门槛间隔作为 `ActualIntervalMs`

#### Scenario: 每秒释放次数
- **WHEN** `ActualIntervalMs` 大于 `0`
- **THEN** `ActualUsesPerSecond` SHALL 使用 `1000 / ActualIntervalMs` 计算

#### Scenario: 战斗自动释放使用实际释放间隔
- **WHEN** Combat Runtime 自动释放已激活主动技能
- **THEN** Combat Runtime SHALL 使用最终技能实例的 `actual_interval_ms` 调度下一次释放，而不是使用只表示真冷却侧的 `final_cooldown_ms`

### Requirement: 触发间隔独立
系统 SHALL 将 `trigger_interval_ms` 作为触发或检测轮询间隔，并 SHALL NOT 默认将它作为冷却或释放门槛参与实际释放频率计算。

#### Scenario: 触发间隔不受冷却回复影响
- **WHEN** `trigger_interval_ms = 500` 且 `cooldown_recovery_add_percent = 100`
- **THEN** `TriggerIntervalMs` SHALL 仍为 `500`

#### Scenario: 触发间隔单独显示
- **WHEN** 技能存在 `trigger_interval_ms`
- **THEN** 技能预览和 Debug 输出 SHALL 单独显示“触发间隔”，并 SHALL NOT 将它显示为“冷却”或“最终冷却”

### Requirement: 冷却回复支持宝石与随机词缀
系统 SHALL 将所有冷却缩减类支持宝石和可生成随机词缀迁移为冷却回复速度口径。

#### Scenario: 冷却专注辅助宝石
- **WHEN** `support_cooldown_focus` 应用到匹配的主动技能或被动贡献路径
- **THEN** 它 SHALL 提供 `cooldown_recovery_add_percent` 修正，并 SHALL NOT 提供 `cooldown_reduction_percent`

#### Scenario: 附加冷却代价保留
- **WHEN** 辅助宝石或词缀提供 `added_cooldown_ms`
- **THEN** 系统 SHALL 保留该固定冷却惩罚，并以中文显示“附加冷却 +X 毫秒”

#### Scenario: 随机词缀不生成旧字段
- **WHEN** V1 随机词缀候选、白名单或词缀配置被校验
- **THEN** `affix.stat` SHALL NOT 引用 `cooldown_reduction_percent`，并 SHALL 使用 `cooldown_recovery_add_percent` 表示冷却回复速度词缀

### Requirement: 技能频率预览与中文文案
系统 SHALL 在技能最终预览、tooltip、Debug 输出和本地化中展示新的技能频率字段，并 SHALL 保证玩家可见文本为中文。

#### Scenario: 技能预览显示频率拆解
- **WHEN** 玩家查看主动技能最终预览
- **THEN** 系统 SHALL 能展示基础释放间隔、攻击速度提高、施法速度提高、最终技能速度、基础冷却、冷却回复速度、附加冷却、最终冷却、实际释放间隔和每秒释放次数

#### Scenario: 触发间隔文案
- **WHEN** 技能存在 `trigger_interval_ms`
- **THEN** 系统 SHALL 使用中文文案“触发间隔”单独展示该值

#### Scenario: 冷却回复中文本地化
- **WHEN** 玩家查看属性、辅助宝石、词缀或技能预览
- **THEN** 系统 SHALL 使用“冷却回复速度提高 +X%”描述 `cooldown_recovery_add_percent`

#### Scenario: 旧冷却缩减文案不再玩家可见
- **WHEN** 玩家查看属性面板、宝石详情、词缀说明、技能预览、HUD 或 Debug 可见文本
- **THEN** 系统 SHALL NOT 显示“冷却缩减”作为活动字段文案

### Requirement: 主动技能释放链条与魔力消耗
系统 SHALL 为每个主动技能宝石定义真实生效的释放链条和最小魔力消耗，并 SHALL 在释放时检查和扣除魔力。

#### Scenario: 主动技能释放链条
- **WHEN** Combat Runtime 自动调度一个已激活主动技能
- **THEN** 系统 SHALL 按 `actual_interval_ms` 判断是否到期，检查 `mana_cost` 是否可支付，支付魔力后调用 Skill Runtime 生成该技能的真实 SkillEvents

#### Scenario: 魔力不足不释放
- **WHEN** 主动技能到达释放时间但玩家当前魔力小于该技能的 `mana_cost`
- **THEN** 系统 SHALL NOT 生成该次释放的 SkillEvents，SHALL NOT 造成该次技能伤害，并 SHALL 保留可供 Debug 或日志说明的魔力不足状态

#### Scenario: 魔力消耗显示在宝石信息
- **WHEN** 玩家查看主动技能宝石详情、技能预览或 Debug 输出
- **THEN** 系统 SHALL 使用中文显示该技能的魔力消耗

#### Scenario: 不扩展复杂魔力系统
- **WHEN** 本变更实现魔力消耗
- **THEN** 系统 SHALL NOT 新增装备魔力词缀、魔力保留、复杂消耗倍率、按命中回蓝或技能树资源节点

### Requirement: 宝石效果重新规划
系统 SHALL 按新释放频率、冷却回复、触发间隔和魔力消耗口径整理现有主动技能宝石、被动技能宝石和辅助技能宝石的效果。

#### Scenario: 主动技能宝石释放配置完整
- **WHEN** V1 主动技能宝石配置被校验
- **THEN** 每个主动技能 SHALL 明确 attack 或 spell 释放来源、基础释放间隔、真冷却配置、触发间隔配置、魔力消耗、Skill Runtime 行为模板和预览字段

#### Scenario: 被动技能宝石不生成释放链条
- **WHEN** V1 被动技能宝石配置被校验或进入最终技能计算
- **THEN** 被动技能宝石 SHALL NOT 生成主动释放实例，且其贡献只能通过玩家属性或主动技能 modifier 进入最终结果

#### Scenario: 辅助技能宝石效果字段符合新口径
- **WHEN** V1 辅助技能宝石配置被校验
- **THEN** 辅助技能宝石 SHALL 使用新合法字段表达攻击速度、施法速度、最终技能速度、冷却回复速度、附加冷却、魔力消耗或既有伤害/范围/投射物效果，并 SHALL NOT 使用 `cooldown_reduction_percent`

#### Scenario: 宝石效果规划不改变范围外规则
- **WHEN** 宝石效果按新口径调整完成
- **THEN** 数独盘合法性、宝石连接/路由规则、技能 VFX/动画资源、装备系统和护甲抗性系统 SHALL 保持不变

### Requirement: 技能频率迁移验收
系统 SHALL 通过针对技能频率迁移的测试，证明攻击速度、施法速度、冷却回复速度、附加冷却、实际释放间隔和触发间隔互不混淆。

#### Scenario: 攻击技能只吃攻击速度
- **WHEN** attack 技能获得 `attack_speed_add_percent`
- **THEN** 释放间隔 SHALL 降低；当同一 attack 技能只获得 `cast_speed_add_percent` 时，释放间隔 SHALL 不受影响

#### Scenario: 法术技能只吃施法速度
- **WHEN** spell 技能获得 `cast_speed_add_percent`
- **THEN** 释放间隔 SHALL 降低；当同一 spell 技能只获得 `attack_speed_add_percent` 时，释放间隔 SHALL 不受影响

#### Scenario: 配置无旧字段残留
- **WHEN** 迁移完成后扫描活动配置、Runtime、校验和测试
- **THEN** 系统 SHALL 不再出现 `cooldown_reduction_percent` 活动引用；若出现，校验 SHALL 失败或测试 SHALL 失败

#### Scenario: 魔力消耗真实生效
- **WHEN** 玩家当前魔力足够释放主动技能
- **THEN** Combat Runtime SHALL 扣除该技能的 `mana_cost` 并生成释放事件；当魔力不足时 SHALL 不扣除负数魔力且不生成释放事件

#### Scenario: 不改动范围外模块
- **WHEN** 本变更完成
- **THEN** 技能表现/VFX/动画资源、数独盘规则、宝石连接规则、装备系统、护甲抗性系统和非相关技能数值平衡 SHALL 保持未被本变更修改
