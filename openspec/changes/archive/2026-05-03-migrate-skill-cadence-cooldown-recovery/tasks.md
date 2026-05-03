## 1. 配置字段迁移

- [x] 1.1 更新玩家属性定义、基础值和角色面板配置：移除活动 `cooldown_reduction_percent`，新增 `cooldown_recovery_add_percent`，保留 `attack_speed_add_percent`、`cast_speed_add_percent`、`skill_speed_final_percent` 和 `added_cooldown_ms`。
- [x] 1.2 更新技能 schema 和主动技能配置：将现有基础自动释放节奏迁移为基础释放间隔，新增独立真冷却字段，支持 `trigger_interval_ms`。
- [x] 1.2a 为所有主动技能配置 `mana_cost`，并明确每个主动技能的释放链条、真冷却和触发间隔口径。
- [x] 1.3 更新 `skill_scaling_rules.toml`：允许 `cooldown_recovery_add_percent`，移除 `cooldown_reduction_percent`，把 `support_cooldown_focus` 改为冷却回复速度。
- [x] 1.4 更新 `support_cooldown_focus` 等支持宝石声明，使 effect stats 和说明字段使用 `cooldown_recovery_add_percent`。
- [x] 1.5 更新词缀配置和 V1 白名单/候选规则，禁止生成 `cooldown_reduction_percent`，使用 `cooldown_recovery_add_percent`。
- [x] 1.6 更新 `zh_cn.toml`，补齐冷却回复速度、基础释放间隔、实际释放间隔、每秒释放次数、触发间隔等中文文案，并移除玩家可见“冷却缩减”口径。

## 2. Runtime 公式迁移

- [x] 2.1 更新技能配置加载模型，读取基础释放间隔、真冷却和触发间隔，并保持旧数值不做平衡调整。
- [x] 2.2 在最终技能计算中拆分攻击释放间隔、施法释放间隔、最终冷却、实际释放间隔和每秒释放次数。
- [x] 2.3 确保 attack 技能只读取 `attack_speed_add_percent`，spell 技能只读取 `cast_speed_add_percent`，两者都读取 `skill_speed_final_percent`。
- [x] 2.4 实现冷却回复公式：`BaseCooldownMs / (1 + cooldown_recovery_add_percent / 100) + added_cooldown_ms`，并只在存在真冷却侧约束时应用 100ms 下限。
- [x] 2.5 确保 `trigger_interval_ms` 不参与最终冷却计算，也不受 `cooldown_recovery_add_percent` 默认影响。
- [x] 2.6 更新 Combat Runtime 自动释放调度，使用 `actual_interval_ms` 而不是只表示真冷却侧的 `final_cooldown_ms`。
- [x] 2.7 更新 Combat Runtime 主动技能释放流程：释放前检查 `mana_cost`，魔力足够时扣除魔力并生成 SkillEvents，魔力不足时跳过该次释放并保留可解释状态。

## 2A. 宝石效果规划

- [x] 2A.1 逐个检查 8 个主动技能宝石，确认 attack/spell 来源、释放门槛、真冷却、触发间隔、魔力消耗、Runtime 行为模板和预览字段。
- [x] 2A.2 逐个检查现有被动技能宝石，确认其只提供玩家属性或主动技能 modifier，不生成主动释放链条。
- [x] 2A.3 逐个检查现有辅助技能宝石，迁移冷却类效果，保留附加冷却代价，并确认所有 effect stats 都是新口径合法字段。
- [x] 2A.4 未新增魔力消耗相关辅助字段；魔力消耗仅作为主动技能释放成本进入配置、Runtime、预览和测试。

## 3. 预览、Debug 与报告输出

- [x] 3.1 更新最终技能实例序列化和预览数据，暴露基础释放间隔、释放间隔、基础冷却、最终冷却、实际释放间隔、每秒释放次数和触发间隔。
- [x] 3.2 更新技能 tooltip、技能预览和 Debug 输出，按中文文案展示攻击速度、施法速度、最终技能速度、冷却回复速度、附加冷却、最终冷却、实际释放间隔、每秒释放次数和触发间隔。
- [x] 3.2a 更新主动技能宝石信息展示，显示中文“魔力消耗”并使用最终技能实例或配置中的真实 `mana_cost`。
- [x] 3.3 更新技能编辑器中与冷却/释放频率相关的字段文案和保存/展示逻辑，避免继续把基础释放节奏显示为真冷却。
- [x] 3.4 更新组合报告和表达校准报告中的冷却字段引用，使用 `cooldown_recovery_add_percent` 和实际释放间隔口径。

## 4. 校验与测试

- [x] 4.1 更新 `tools/validate_v1_configs.py`，将 `cooldown_recovery_add_percent` 纳入 V1 合法字段，并对活动配置中的 `cooldown_reduction_percent` 报错。
- [x] 4.2 新增或更新测试：攻击技能只吃攻击速度，施法速度不影响 attack 技能。
- [x] 4.3 新增或更新测试：法术技能只吃施法速度，攻击速度不影响 spell 技能。
- [x] 4.4 新增或更新测试：`BaseCooldownMs = 10000`、`cooldown_recovery_add_percent = 100`、`added_cooldown_ms = 0` 时 `FinalCooldownMs = 5000`。
- [x] 4.5 新增或更新测试：冷却回复后追加附加冷却，10000ms 基础冷却、100% 冷却回复、1000ms 附加冷却时最终冷却为 6000ms。
- [x] 4.6 新增或更新测试：同时存在释放门槛和冷却时，实际释放间隔取 `max(ActionIntervalMs, FinalCooldownMs)`。
- [x] 4.7 新增或更新测试：`trigger_interval_ms` 不受 `cooldown_recovery_add_percent` 影响。
- [x] 4.8 新增或更新测试：活动配置中出现 `cooldown_reduction_percent` 时校验失败或测试失败。
- [x] 4.9 新增或更新测试：魔力足够时主动技能释放会扣除 `mana_cost`，魔力不足时不生成释放事件。
- [x] 4.10 新增或更新测试：主动技能宝石信息中显示中文魔力消耗。

## 5. 验收

- [x] 5.1 运行 V1 配置校验，确认新字段合法、旧字段禁用、中文本地化齐全。
- [x] 5.2 运行相关单元测试和报告测试，确认技能频率、预览和战斗自动释放行为符合新口径。
- [x] 5.3 扫描活动代码、配置和测试，确认不存在 `cooldown_reduction_percent` 活动残留；归档 OpenSpec 和历史 reports 可作为历史记录保留。
- [x] 5.4 检查 diff，确认未修改技能表现/VFX/动画资源、数独盘规则、宝石连接规则、装备系统或护甲抗性系统；魔力消耗仅限本变更定义的主动技能释放成本。
- [x] 5.5 输出验收说明：修改文件清单、字段迁移说明、新旧公式差异、测试结果、旧字段残留情况、中文文案情况和范围外模块未改动情况。
