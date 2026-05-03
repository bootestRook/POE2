## ADDED Requirements

### Requirement: 技能编辑器投射物事件面板结构
V1 SkillEditor SHALL provide a left / middle / right / bottom editor layout for projectile skill debugging without changing non-editor gameplay systems.

#### Scenario: 打开技能编辑器显示左侧技能列表
- **WHEN** 用户打开技能编辑器
- **THEN** 界面 SHALL 显示左侧技能列表

#### Scenario: 选择投射物技能
- **WHEN** 用户在技能列表中选择火焰弹或其他已迁移投射物技能
- **THEN** 技能编辑器 SHALL 打开该技能的编辑上下文，并 SHALL NOT 进入 XML 导入流程

#### Scenario: 中间显示事件列表或时间轴
- **WHEN** 技能编辑器打开一个技能
- **THEN** 中间区域 SHALL 显示当前技能的技能事件列表或时间轴

#### Scenario: 测试场运行后显示真实事件时间线
- **WHEN** 用户运行预览并生成测试场结果
- **THEN** 中间区域 SHALL 显示本次运行产生的真实 SkillEvent 时间线

#### Scenario: 右侧显示选中事件参数
- **WHEN** 用户选择技能事件或时间线事件
- **THEN** 右侧区域 SHALL 显示当前选中事件的参数面板

#### Scenario: 底部显示操作和反馈
- **WHEN** 技能编辑器处于可操作状态
- **THEN** 底部区域 SHALL 显示运行、暂停 / 重置、保存、校验结果和运行日志

### Requirement: 投射物参数按调试分组展示
SkillEditor SHALL organize current existing projectile parameters by projectile-debugging groups when a projectile event is selected.

#### Scenario: 选中投射物事件显示分组参数
- **WHEN** 用户选中投射物事件
- **THEN** 右侧参数面板 SHALL 按基础、发射位置、发射方向、目标搜索、发射组、运动、碰撞、伤害、表现、调试分组显示当前已有投射物参数

#### Scenario: 基础分组显示已有基础字段
- **WHEN** 投射物参数面板显示基础分组
- **THEN** 基础分组 SHALL 显示技能 ID、技能标签、行为模板、伤害类型、伤害形式和目标选择方式

#### Scenario: 发射位置分组显示已有发射字段
- **WHEN** 投射物参数面板显示发射位置分组
- **THEN** 发射位置分组 SHALL 显示只读发射来源、`spawn_offset.x`、`spawn_offset.y`、只读逻辑发射点和只读特效发射点

#### Scenario: 发射方向分组显示已有方向字段
- **WHEN** 投射物参数面板显示发射方向分组
- **THEN** 发射方向分组 SHALL 显示只读当前方向模式、`spread_angle_deg` 或 `spread_angle`、`angle_step`、只读 `direction_world` 和只读 `vfx_direction_world`

#### Scenario: 目标搜索分组显示已有目标字段
- **WHEN** 投射物参数面板显示目标搜索分组
- **THEN** 目标搜索分组 SHALL 显示 `cast.target_selector`、`cast.search_range`、`hit.target_policy` 和 `max_targets`

#### Scenario: 发射组分组显示已有发射组字段
- **WHEN** 投射物参数面板显示发射组分组
- **THEN** 发射组分组 SHALL 显示 `projectile_count`、`burst_interval_ms`、`spread_angle_deg` 或 `spread_angle`、`angle_step` 和 `spawn_pattern`

#### Scenario: 运动分组显示已有运动字段
- **WHEN** 投射物参数面板显示运动分组
- **THEN** 运动分组 SHALL 显示 `projectile_speed`、`max_distance`、`min_duration_ms` 和 `max_duration_ms`

#### Scenario: 碰撞分组显示已有碰撞字段
- **WHEN** 投射物参数面板显示碰撞分组
- **THEN** 碰撞分组 SHALL 显示 `projectile_width`、`projectile_height`、`collision_radius`、`projectile_radius`、`impact_radius`、`hit_policy` 和 `pierce_count`

#### Scenario: 伤害分组显示已有伤害字段
- **WHEN** 投射物参数面板显示伤害分组
- **THEN** 伤害分组 SHALL 显示 `hit.base_damage`、`per_projectile_damage_scale`、`damage_timing`、`hit_delay_ms`、`hit_radius`、`can_crit` 和 `can_apply_status`

#### Scenario: 表现分组显示已有表现字段
- **WHEN** 投射物参数面板显示表现分组
- **THEN** 表现分组 SHALL 显示 `cast_vfx_key`、`projectile_vfx_key`、`hit_vfx_key`、`vfx`、`sfx`、`floating_text`、`floating_text_style`、`screen_feedback`、`hit_stop_ms` 和 `camera_shake`

#### Scenario: 当前项目没有的 XML 字段不作为可编辑参数出现
- **WHEN** 投射物参数面板显示可编辑字段
- **THEN** 当前项目没有运行时能力的 XML 字段 SHALL NOT 出现在可编辑参数中

### Requirement: 投射物预览调试显示
SkillEditor SHALL provide UI-only projectile debug visualization for launch, target, direction, collision, and search range.

#### Scenario: 运行预览显示调试元素
- **WHEN** 用户运行投射物技能预览
- **THEN** 预览 SHALL 能显示发射点、目标点、飞行方向线、碰撞半径和搜索范围

#### Scenario: 区分逻辑发射点和特效发射点
- **WHEN** 调试显示开启发射点
- **THEN** 预览 SHALL 区分逻辑发射点和特效发射点

#### Scenario: 修改已有参数后运行预览验证效果
- **WHEN** 用户修改当前已有投射物参数后运行预览
- **THEN** 预览 SHALL 使用当前 draft 验证效果，并 SHALL NOT 要求保存后才能运行

#### Scenario: 调试开关不写入正式配置
- **WHEN** 用户切换显示发射点、显示目标点、显示飞行方向线、显示碰撞半径或显示搜索范围
- **THEN** 这些 UI-only 调试开关 SHALL NOT 写入正式 `skill.yaml`

### Requirement: 技能编辑器保存前中文校验
SkillEditor SHALL validate basic projectile editor input before save and display validation failures in Chinese.

#### Scenario: 保存前执行基础校验
- **WHEN** 用户点击保存技能包
- **THEN** 技能编辑器 SHALL 在写入配置前执行基础校验

#### Scenario: 校验错误中文显示
- **WHEN** 保存前校验失败
- **THEN** 技能编辑器 SHALL 在参数面板内用中文显示错误

#### Scenario: 保存失败不写入配置
- **WHEN** 保存前校验或后端 schema 校验失败
- **THEN** 技能编辑器 SHALL NOT 写入配置文件

#### Scenario: UI 状态不进入正式 skill.yaml
- **WHEN** 技能编辑器保存技能包
- **THEN** UI-only 调试开关、选中事件、面板展开状态、运行日志和暂停状态 SHALL NOT 写入正式 `skill.yaml`

### Requirement: 投射物面板重组不影响非目标模块
The projectile editor panel refactor SHALL NOT affect formal combat, gem board, loot, affixes, sudoku routing, or formal damage formula.

#### Scenario: 不影响正式战斗和正式伤害公式
- **WHEN** 本变更应用后运行正式战斗逻辑
- **THEN** 正式战斗和正式伤害公式 SHALL 保持既有行为

#### Scenario: 不影响宝石盘和数独规则
- **WHEN** 本变更应用后使用宝石盘和数独合法性检查
- **THEN** 宝石盘、数独合法性和数独路由 SHALL 保持既有行为

#### Scenario: 不影响掉落词缀和宝石规则
- **WHEN** 本变更应用后运行掉落、词缀、被动宝石、辅助宝石或导管相关流程
- **THEN** 这些流程 SHALL 保持既有行为

#### Scenario: 构建和测试通过
- **WHEN** 本变更完成
- **THEN** WebApp 构建、最小 smoke 测试和现有相关测试 SHALL 通过
