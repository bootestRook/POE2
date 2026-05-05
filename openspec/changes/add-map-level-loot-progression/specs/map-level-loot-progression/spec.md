## ADDED Requirements

### Requirement: 玩家地图阶段模型
系统 SHALL 提供玩家可见的地图阶段模型，覆盖 1-59 成长地图和 60+ 异界时刻地图，并 SHALL 使用阶段配置驱动地图等级、怪物等级、入口消耗和掉落档位。

#### Scenario: 成长地图阶段可见
- **WHEN** 玩家打开地图选择界面
- **THEN** 系统 SHALL 展示 `起始区域 I`、`起始区域 II`、`边境区域`、`深层区域`、`高危区域 I`、`高危区域 II`
- **AND** 每个成长阶段 SHALL 显示对应等级范围、怪物等级范围和主要掉落提示

#### Scenario: 异界时刻阶段可见
- **WHEN** 玩家达到异界阶段
- **THEN** 系统 SHALL 展示 `时刻 1` 到 `时刻 6`、`时刻 7-1`、`时刻 7-2`、`时刻 8-1` 到 `时刻 8-4`
- **AND** 每个时刻节点 SHALL 显示地图等级、怪物等级、入口消耗和主要奖励差异

#### Scenario: 起始区域一永久免费
- **WHEN** 玩家选择 `起始区域 I`
- **THEN** 系统 SHALL 允许玩家进入地图且不消耗任何地图入口
- **AND** `起始区域 I` SHALL 在任意存档状态下保持可进入

#### Scenario: 后续地图需要解锁或入口
- **WHEN** 玩家选择 `起始区域 II` 或更高阶段地图
- **THEN** 系统 SHALL 检查该阶段是否已解锁
- **AND** 系统 SHALL 检查玩家是否拥有所需地图入口或满足首次解锁条件

### Requirement: 后端地图运行上下文
系统 SHALL 使用后端 canonical map run context 作为地图等级、怪物等级、掉落表和奖励加成的唯一真实来源。

#### Scenario: 创建地图运行上下文
- **WHEN** 玩家从地图选择界面开始一次地图运行
- **THEN** 后端 SHALL 创建包含 `map_id`、`stage_id`、`map_level`、`monster_level`、`timemark`、`loot_profile`、`reward_level_bonus`、`entry_cost` 和 seed 的 map run context

#### Scenario: 战斗引用地图运行上下文
- **WHEN** Combat Runtime 创建怪物、计算击杀掉落或返回战斗状态
- **THEN** Combat Runtime SHALL 引用当前 map run context
- **AND** Combat Runtime SHALL NOT 使用前端传入的非 canonical 地图等级、怪物等级或掉落等级作为真实结果

#### Scenario: 前端只消费 canonical 结果
- **WHEN** playable WebApp 渲染地图怪物、战斗 HUD、掉落或拾取结果
- **THEN** WebApp SHALL 消费后端返回的 map run、monster、combat 和 loot 数据
- **AND** WebApp SHALL NOT 重新计算真实怪物等级、真实怪物生命、真实掉落结果或真实奖励等级

### Requirement: 地图怪物数值曲线
系统 SHALL 根据 map run context 的 `monster_level` 和地图阶段配置计算怪物生命与伤害，并 SHALL 复用现有 normal、magic、rare、boss 稀有度倍率。

#### Scenario: 低级地图怪物数值较低
- **WHEN** 系统在 `起始区域 I` 创建普通怪物
- **THEN** 怪物生命和伤害 SHALL 使用该阶段的低级怪物等级曲线
- **AND** 怪物数值 SHALL 小于相同怪物在 `高危区域 II` 的数值

#### Scenario: 稀有度倍率叠加到等级曲线
- **WHEN** 系统创建 magic、rare 或 boss 怪物
- **THEN** 系统 SHALL 在地图等级曲线结果上叠加现有稀有度生命和伤害倍率

#### Scenario: 高时刻主要提升奖励
- **WHEN** 玩家进入 `时刻 8` 节点
- **THEN** 系统 MAY 将 monster level 保持在高等级上限附近
- **AND** 系统 SHALL 通过掉落倍率、奖励等级加成或 Boss 奖励提升收益

### Requirement: 通用掉落表
系统 SHALL 通过配置化 loot profile 为地图阶段定义装备、宝石和地图入口的掉落权重、稀有度权重、数量倍率和 Boss 保底规则。

#### Scenario: 怪物可不掉落物品
- **WHEN** 普通怪物死亡并触发掉落计算
- **THEN** Loot Runtime MAY 生成零个掉落
- **AND** Combat Runtime SHALL 将零掉落视为合法结果

#### Scenario: 怪物可掉多种物品
- **WHEN** 怪物死亡并成功掷出多个掉落
- **THEN** Loot Runtime SHALL 能生成宝石、装备和地图入口中的一种或多种通用掉落

#### Scenario: Boss 可有保底掉落
- **WHEN** 地图 Boss 死亡
- **THEN** Loot Runtime SHALL 按当前 loot profile 应用 Boss 保底规则
- **AND** Boss 保底规则 SHALL 能指定保底装备、宝石或地图入口

#### Scenario: 玩家掉落属性参与计算
- **WHEN** 玩家拥有掉落数量或掉落稀有度相关 runtime stats
- **THEN** Loot Runtime SHALL 将这些属性应用到当前 map run 的通用掉落计算

### Requirement: 装备地图掉落
系统 SHALL 从地图掉落中生成装备，并 SHALL 使用 map run context、怪物稀有度和 Boss 奖励计算装备 item level。

#### Scenario: 装备等级来自地图运行
- **WHEN** Loot Runtime 生成装备掉落
- **THEN** 装备 `item_level` SHALL 来自 `monster_level + reward_level_bonus + monster_rarity_bonus`
- **AND** 装备 `item_level` SHALL 被限制在装备系统允许的范围内

#### Scenario: 装备生成复用装备生成器
- **WHEN** 装备掉落需要创建装备实例
- **THEN** 系统 SHALL 调用 canonical `EquipmentGenerator.generate(source, item_level, rarity)`
- **AND** 系统 SHALL NOT 复制装备词缀候选池、词缀 tier 或容量规则

#### Scenario: 装备 tier 随地图等级解锁
- **WHEN** 玩家在 40、58、68、76、82、86 或奖励等级 100 的掉落上下文中生成装备
- **THEN** 装备词缀候选 SHALL 继续按现有装备等级门槛解锁 T6、T5、T4、T3、T2、T1 或至臻相关候选

### Requirement: 宝石地图掉落
系统 SHALL 根据地图阶段和 map level 生成宝石等级，不得在地图掉落中固定生成 Lv1 宝石。

#### Scenario: 成长地图掉落低中等级宝石
- **WHEN** Loot Runtime 在 1-59 成长地图中生成宝石掉落
- **THEN** 宝石等级 SHALL 来自该阶段配置的宝石等级权重
- **AND** 宝石等级 SHALL 位于玩家可见宝石等级 1-20 范围内

#### Scenario: 异界时刻掉落高等级宝石
- **WHEN** Loot Runtime 在 60+ 时刻地图中生成宝石掉落
- **THEN** 宝石等级 SHALL 来自时刻阶段配置
- **AND** 高时刻 SHALL 比低时刻更容易掉落高等级宝石

#### Scenario: 宝石种类复用现有池
- **WHEN** 宝石掉落选择基础宝石 ID
- **THEN** Loot Runtime SHALL 复用现有 active、passive 和 support 宝石定义与掉落池规则

### Requirement: 地图入口掉落和推进
系统 SHALL 支持地图入口掉落，使 `起始区域 II` 以后和异界时刻地图形成可持续刷图循环。

#### Scenario: 起始区域一掉后续入口
- **WHEN** 玩家在 `起始区域 I` 击杀怪物或 Boss
- **THEN** Loot Runtime MAY 掉落 `起始区域 II` 入口
- **AND** 该入口 SHALL 用于解锁或进入 `起始区域 II`

#### Scenario: 中后期地图掉同层或下一层入口
- **WHEN** 玩家在 `起始区域 II` 或更高地图中击杀怪物
- **THEN** Loot Runtime MAY 掉落同层、低一层或高一层地图入口
- **AND** Boss 或 rare 怪物 SHALL 比普通怪物更容易掉落高一层入口

#### Scenario: 断票仍可继续游戏
- **WHEN** 玩家没有任何消耗型地图入口
- **THEN** 地图选择界面 SHALL 仍允许进入 `起始区域 I`

### Requirement: 主界面和地图选择 UI
系统 SHALL 提供玩家可用的主界面和地图选择 UI，用于继续存档、新建存档、查看进度、选择地图阶段并开始地图运行。

#### Scenario: 主界面显示存档入口
- **WHEN** 玩家打开 WebApp
- **THEN** 系统 SHALL 显示继续游戏、新游戏和地图选择入口
- **AND** 若存在自动存档，系统 SHALL 显示当前角色进度摘要

#### Scenario: 地图选择显示可进入状态
- **WHEN** 玩家打开地图选择界面
- **THEN** 系统 SHALL 显示每个地图节点是否免费、可进入、入口不足或未解锁
- **AND** 不可进入节点 SHALL 显示中文原因

#### Scenario: 地图选择展示掉落预览
- **WHEN** 玩家查看一个地图节点
- **THEN** 地图选择 UI SHALL 显示地图等级、怪物等级、装备 tier 提示、宝石等级范围、地图入口产出和 Boss 奖励提示

### Requirement: 自动存档
系统 SHALL 自动保存和加载玩家刷宝进度，确保刷新、退出和重新打开后可以继续游戏。

#### Scenario: 自动创建存档
- **WHEN** 玩家首次开始新游戏
- **THEN** 系统 SHALL 创建带版本号的存档
- **AND** 存档 SHALL 初始化已解锁地图、地图入口、背包、装备、数独盘和玩家进度

#### Scenario: 关键操作触发存档
- **WHEN** 玩家进入地图、击杀产生掉落、拾取物品、装备物品、卸下物品、宝石上盘、宝石下盘、解锁地图或返回主界面
- **THEN** 系统 SHALL 自动保存当前安全状态

#### Scenario: 存档恢复进度
- **WHEN** 玩家重新打开 WebApp 并选择继续游戏
- **THEN** 系统 SHALL 恢复已解锁地图、地图入口库存、宝石背包、装备背包、装备槽、数独盘状态和最近安全地图选择

#### Scenario: 存档兼容缺失字段
- **WHEN** 系统读取旧版本或缺字段存档
- **THEN** 系统 SHALL 使用安全默认值补齐缺失字段
- **AND** 系统 SHALL NOT 阻止玩家进入永久免费 `起始区域 I`
