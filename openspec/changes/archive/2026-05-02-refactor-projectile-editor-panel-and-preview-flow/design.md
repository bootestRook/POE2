## Context

当前技能编辑器已经支持 `active_fire_bolt` 和 `active_ice_shards` 等已迁移技能包的编辑、保存和测试场运行。投射物运行时已经输出 `projectile_spawn`、`projectile_hit`、`damage`、`hit_vfx`、`floating_text` 等事件，并在 payload 中保留发射点、目标点、方向、速度、投射物编号和半径等信息。

当前问题不在于缺少完整投射物运行时，而在于编辑器组织方式不适合调试投射物。发射点、目标点、飞行方向、视觉特效方向和碰撞半径都存在，但分散在多个 UI 区域和事件 payload 中，编辑者难以快速确认“配置值、运行事件、视觉表现”三者是否一致。

本设计以用户提供的 `1011.xml` 投射物结构作为组织参考。因为当前项目目录中没有找到真实 `1011.xml`，本次不会解析 XML，也不会实现 XML 导入器；只整理当前项目已经存在的字段和预览能力。

## Goals / Non-Goals

目标：

- 让技能编辑器形成左 / 中 / 右 / 底部的稳定操作结构。
- 让投射物事件参数按调试顺序组织，而不是按底层 YAML 区块分散展示。
- 让发射点、目标点、飞行方向线、碰撞半径和搜索范围可在预览中明确显示。
- 保存前做基础校验，并在面板内用中文展示错误。
- 保证 UI-only 调试状态不写入正式 `skill.yaml`。
- 只接入当前项目已有字段，不新增旧 XML 中当前项目没有的运行时能力。

非目标：

- 不实现 XML 导入器。
- 不复刻旧技能编辑器。
- 不新增旧 XML 中当前项目没有的运行时字段。
- 不修改宝石盘、数独合法性、宝石掉落、随机词缀、被动宝石、辅助宝石、导管路由或正式伤害公式。
- 不重构非投射物技能逻辑。
- 不改非技能编辑器 UI。
- 不改非预览场景逻辑。

## 新技能编辑器结构

### 左侧：技能与事件入口

左侧区域 SHALL 显示：

- 技能列表。
- 事件类型列表。

技能列表用于选择可打开的技能包。事件类型列表用于选择当前技能相关的逻辑事件类型，例如 `cast_start`、`projectile_spawn`、`projectile_hit`、`damage`、`hit_vfx`、`floating_text`、`cooldown_update`。

### 中间：技能时间轴 / 事件列表

中间区域 SHALL 显示：

- 当前技能的逻辑事件列表或时间轴。
- 测试场运行后的真实事件时间线。

未运行预览时，中间区域可以显示根据当前技能包和行为模板推导出的逻辑事件入口。运行预览后，中间区域显示真实 `SkillEvent` 序列，并允许选择某个事件作为右侧参数面板的上下文。

### 右侧：选中事件参数面板

右侧区域 SHALL 显示当前选中事件的参数面板。

当选中投射物事件时，右侧 SHALL 按投射物分组展示参数。参数来源只能是当前项目已有字段、事件 payload 中已有调试数据或只读推导信息。没有运行时能力的 XML 字段不得显示为可编辑参数。

### 底部：操作与反馈

底部区域 SHALL 显示：

- 运行。
- 暂停 / 重置。
- 保存。
- 校验结果。
- 运行日志。

运行预览 SHALL 使用当前编辑器 draft 和测试场临时数据。暂停、重置和调试显示开关属于 UI-only editor state，不得写入正式 `skill.yaml`。

## 投射物参数分组

投射物参数面板 SHALL 使用以下分组。每个分组只接入当前项目已有字段；不存在的字段不得新增功能。

### 一、基础

- 技能 ID：`id`
- 技能标签：`classification.tags`
- 行为模板：`behavior.template`
- 伤害类型：`classification.damage_type`
- 伤害形式：`classification.damage_form`
- 目标选择方式：`cast.target_selector`

### 二、发射位置

- 发射来源只读显示为：施法者 / 测试玩家。
- `spawn_offset.x`
- `spawn_offset.y`
- 逻辑发射点只读显示：来自 `projectile_spawn.payload.spawn_world_position` 或当前预览推导值。
- 特效发射点只读显示：来自 `projectile_spawn.payload.vfx_spawn_world_position` 或当前预览推导值。

### 三、发射方向

- 当前方向模式只读显示为：朝当前目标 / 最近目标。
- `spread_angle_deg` 或 `spread_angle`
- `angle_step`
- `direction_world` 只读显示：来自事件 payload 或当前预览推导值。
- `vfx_direction_world` 只读显示：来自事件 payload 或当前预览推导值。

当前项目尚无“朝鼠标 / 固定方向 / 自定义方向”的可保存字段，因此这些模式本次不显示为可编辑项。

### 四、目标搜索

- `cast.target_selector`
- `cast.search_range`
- `hit.target_policy`
- `max_targets`

### 五、发射组

- `projectile_count`
- `burst_interval_ms`
- `spread_angle_deg` / `spread_angle`
- `angle_step`
- `spawn_pattern`

### 六、运动

- `projectile_speed`
- `max_distance`
- `min_duration_ms`
- `max_duration_ms`

### 七、碰撞

- `projectile_width`
- `projectile_height`
- `collision_radius`
- `projectile_radius`
- `impact_radius`
- `hit_policy`
- `pierce_count`

### 八、伤害

- `hit.base_damage`
- `per_projectile_damage_scale`
- `damage_timing`
- `hit_delay_ms`
- `hit_radius`
- `can_crit`
- `can_apply_status`

### 九、表现

- `cast_vfx_key`
- `projectile_vfx_key`
- `hit_vfx_key`
- `vfx`
- `sfx`
- `floating_text`
- `floating_text_style`
- `screen_feedback`
- `hit_stop_ms`
- `camera_shake`

### 十、调试

- 显示发射点。
- 显示目标点。
- 显示飞行方向线。
- 显示碰撞半径。
- 显示搜索范围。

这些调试开关 SHALL 是 UI-only editor state。它们不得写入正式 `skill.yaml`，不得进入正式技能配置，保存时也不得出现在提交给后端的技能包对象中。

## 预览调试显示

预览调试层 SHALL 整理当前已有辅助线能力：

- 发射点：区分逻辑发射点和特效发射点。
- 目标点：显示当前预览选中的目标点。
- 飞行方向线：显示每枚投射物的逻辑方向。
- 碰撞半径：显示投射物当前碰撞范围。
- 搜索范围：显示目标搜索范围。

调试层 SHALL 使用中文可见文案、中文按钮和中文提示。调试显示只服务于技能编辑器和预览场，不影响正式战斗。

## 保存前校验

保存前 SHALL 执行基础校验：

- 当前技能包对象存在。
- 技能 ID 与当前选择技能一致。
- 当前行为模板属于允许模板。
- 当前投射物面板展示的可编辑字段满足已有 schema 和 behavior template 约束。
- 数值字段满足最小值、最大值和整数要求。
- 枚举字段使用已有可选项。
- 未知字段或 UI-only 调试字段不得写入正式技能配置。

校验错误 SHALL 在面板内用中文展示。保存失败时 SHALL NOT 写入配置文件。

## XML 字段处理

旧 XML 中存在但当前项目没有运行时能力的字段，本次全部忽略，只作为后续扩展记录，不允许在本次 apply 中实现：

- 发射挂点
- 目标挂点
- Z 偏移
- 全局坐标开关
- 偏移是否受角色朝向影响
- 朝鼠标
- 固定方向
- 自定义方向
- 是否重新搜索目标
- 搜索中心
- 搜索角度
- 并行数量
- 并行间距
- 随机角度
- 最大速度
- 重力
- 锁定目标
- 转向速度
- 反弹
- 墙体 / 地面检测
- 碰撞形状枚举
- 是否造成伤害开关
- 单目标命中间隔
- 单目标最大命中次数
- 命中后触发器
- 轨迹特效
- 特效缩放
- 排序层
- 发射音效 / 命中音效分离

如果后续需要实现这些能力，必须另开 change，先提出运行时和配置 schema 的完整设计。

## 允许修改范围

- `webapp/App.tsx`
- `webapp/styles.css`
- `src/liufang/skill_editor.py`
- `src/liufang/web_api.py`，仅当接口返回结构需要调整
- `src/liufang/skill_runtime.py`，仅限投射物事件 payload / 预览调试数据补齐
- `tests/test_skill_editor.py`
- `tests/test_skill_runtime.py`
- `webapp/smoke-test.mjs`，仅做编辑器 / 预览 smoke 覆盖

## 禁止修改范围

- `src/liufang/gem_board.py`
- `configs/sudoku_board/**`
- `src/liufang/loot.py`
- `src/liufang/affixes.py`
- `src/liufang/inventory.py`
- `configs/loot/**`
- `configs/affixes/**`
- `configs/gems/**`
- `src/liufang/combat.py`
- 非投射物技能逻辑
- 非技能编辑器 UI
- 非预览场景逻辑

## Risks / Trade-offs

- 风险：把旧 XML 字段直接补进 schema 会扩大范围。缓解：只展示当前已有字段，缺失字段只记录“本次忽略 / 暂不实现”。
- 风险：UI-only 调试状态误写入 `skill.yaml`。缓解：调试状态保存在前端局部状态或等价临时状态中，保存 payload 只包含正式技能包字段。
- 风险：面板重组影响现有保存能力。缓解：保存仍走现有 schema 和 behavior template 白名单，新增前置校验只做更早的中文错误提示。
- 风险：运行预览显示与真实事件不一致。缓解：优先使用测试场真实 `SkillEvent`，没有运行结果时才显示当前 draft 的只读推导值。
