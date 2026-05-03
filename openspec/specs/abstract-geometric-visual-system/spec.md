# abstract-geometric-visual-system Specification

## Purpose
TBD - created by archiving change migrate-abstract-geometric-visual-system. Update Purpose after archive.
## Requirements
### Requirement: 战斗视觉必须使用抽象几何语言

系统 SHALL 使用深色哑光背景和白、橙、蓝、灰为主的抽象几何语言表达战斗对象与战斗信息。玩家、普通怪、精英怪、Boss、投射物、掉落物、技能范围、命中反馈和伤害数字 MUST 使用基础几何体或几何组合表达，不能依赖写实地牢、像素角色、手绘怪物或拟物特效作为最终视觉。

#### Scenario: 战斗对象使用几何表达

- **WHEN** 玩家进入主战斗场景
- **THEN** 玩家、怪物、投射物和技能范围以圆形、三角形、方块、六边形、线段、环形或扇形等几何元素表达
- **AND** 旧像素/手绘资源最多作为过渡 fallback 或尺寸参考

### Requirement: 高频战斗对象必须批量绘制

系统 MUST 使用 Canvas 或 WebGL 批量渲染主战斗场景中的玩家、怪物、投射物、掉落物、范围圈、粒子特效和伤害数字。系统 MUST NOT 为每个敌人、投射物、粒子或伤害数字创建独立 React DOM 节点作为最终渲染方案。

#### Scenario: 高密度战斗对象保持批量渲染

- **WHEN** 同屏存在 300 个敌人、1000 个投射物、300 个掉落物和 200 个伤害数字的压力场景
- **THEN** 战斗对象仍由 Canvas 或 WebGL 批量绘制
- **AND** React DOM 节点数量不会随这些战斗对象数量线性增长

### Requirement: React DOM 仅负责界面层

系统 SHALL 使用 React DOM 渲染 UI 面板、背包、数独盘、按钮、tooltip、HUD、技能栏、角色信息和文字控件。战斗表现层与 UI 表现层 MUST 保持边界清晰，UI 改造不得改变宝石放置、背包交换、技能计算或战斗规则。

#### Scenario: 背包和数独盘保持规则不变

- **WHEN** 玩家打开背包并拖拽宝石到数独盘
- **THEN** 背包、数独盘和 tooltip 使用几何极简 UI 皮肤显示
- **AND** 可放置格、不可放置格、支持连线和放置结果遵循既有规则

### Requirement: 视觉迁移不得修改玩法逻辑

系统 MUST NOT 在视觉迁移中修改战斗数值、技能逻辑、宝石规则、数独规则、伤害公式、掉落规则、敌人配置或随机词缀配置。视觉层可以读取现有运行时状态和配置展示信息，但不能改变这些状态和配置的语义。

#### Scenario: 构建与玩法测试仍通过

- **WHEN** 完成任一视觉迁移阶段
- **THEN** 现有构建与 smoke test 通过
- **AND** 技能、宝石、数独、掉落和战斗相关测试不因视觉改造出现规则性变更

### Requirement: 特效必须轻量且可读

系统 SHALL 使用 Canvas 或 WebGL 绘制简单几何形状表达技能特效。系统 MUST NOT 使用大量 CSS filter、blur、box-shadow 或复杂渐变动画作为主战斗特效方案。

#### Scenario: 技能爆发表现可读

- **WHEN** 火焰、冰霜、闪电、物理、范围、连锁、地刺或爆炸类技能触发
- **THEN** 特效通过短时几何形状、线段、圆环、扇形、三角碎片或脉冲表达
- **AND** 玩家可以从颜色、形状和运动方向读出技能类型与影响范围
