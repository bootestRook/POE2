## 1. OpenSpec 验证任务

- [x] 1.1 创建 `proposal.md`、`design.md`、`tasks.md` 和 `specs/v1-minimal-sudoku-gem-loop/spec.md`。
- [x] 1.2 运行 `openspec validate refactor-projectile-editor-panel-and-preview-flow --strict`。
- [x] 1.3 若 OpenSpec 校验失败，只修正 OpenSpec 文档，不修改实现代码。

## 2. 前端结构任务

- [x] 2.1 调整技能编辑器为左 / 中 / 右 / 底部结构。
- [x] 2.2 左侧显示技能列表与事件类型列表。
- [x] 2.3 中间显示技能时间轴或事件列表。
- [x] 2.4 中间在测试场运行后显示真实事件时间线。
- [x] 2.5 右侧显示选中事件参数。
- [x] 2.6 底部显示运行、暂停 / 重置、保存、校验结果和运行日志。
- [x] 2.7 保持所有编辑器内可见 UI 文案、按钮、提示、错误提示和调试文本为中文。

## 3. 投射物参数面板任务

- [x] 3.1 按基础、发射位置、发射方向、目标搜索、发射组、运动、碰撞、伤害、表现、调试分组重组投射物参数面板。
- [x] 3.2 基础分组接入技能 ID、技能标签、行为模板、伤害类型、伤害形式和目标选择方式。
- [x] 3.3 发射位置分组接入发射来源只读显示、`spawn_offset.x`、`spawn_offset.y`、逻辑发射点只读显示和特效发射点只读显示。
- [x] 3.4 发射方向分组接入当前方向模式只读显示、`spread_angle_deg` 或 `spread_angle`、`angle_step`、`direction_world` 只读显示和 `vfx_direction_world` 只读显示。
- [x] 3.5 目标搜索分组接入 `cast.target_selector`、`cast.search_range`、`hit.target_policy` 和 `max_targets`。
- [x] 3.6 发射组分组接入 `projectile_count`、`burst_interval_ms`、`spread_angle_deg` / `spread_angle`、`angle_step` 和 `spawn_pattern`。
- [x] 3.7 运动分组接入 `projectile_speed`、`max_distance`、`min_duration_ms` 和 `max_duration_ms`。
- [x] 3.8 碰撞分组接入 `projectile_width`、`projectile_height`、`collision_radius`、`projectile_radius`、`impact_radius`、`hit_policy` 和 `pierce_count`。
- [x] 3.9 伤害分组接入 `hit.base_damage`、`per_projectile_damage_scale`、`damage_timing`、`hit_delay_ms`、`hit_radius`、`can_crit` 和 `can_apply_status`。
- [x] 3.10 表现分组接入 `cast_vfx_key`、`projectile_vfx_key`、`hit_vfx_key`、`vfx`、`sfx`、`floating_text`、`floating_text_style`、`screen_feedback`、`hit_stop_ms` 和 `camera_shake`。
- [x] 3.11 只接入当前已有参数，没有运行时能力的 XML 字段不新增、不保存、不显示为可编辑字段。

## 4. 调试显示任务

- [x] 4.1 把现有辅助线整理为 UI-only 开关。
- [x] 4.2 支持显示发射点。
- [x] 4.3 支持显示目标点。
- [x] 4.4 支持显示飞行方向线。
- [x] 4.5 支持显示碰撞半径。
- [x] 4.6 支持显示搜索范围。
- [x] 4.7 区分逻辑发射点和特效发射点。
- [x] 4.8 调试开关不得写入正式 `skill.yaml`，不得进入保存 payload。

## 5. 校验任务

- [x] 5.1 增加保存前基础校验。
- [x] 5.2 参数错误在面板内用中文展示。
- [x] 5.3 保存失败时不写入配置。
- [x] 5.4 UI 状态不写入正式技能配置。
- [x] 5.5 保存仍使用当前 schema 和 behavior template 白名单校验。

## 6. 测试任务

- [x] 6.1 更新或新增最小 smoke 测试。
- [x] 6.2 覆盖技能编辑器打开。
- [x] 6.3 覆盖技能选择。
- [x] 6.4 覆盖投射物参数分组显示。
- [x] 6.5 覆盖运行预览。
- [x] 6.6 覆盖保存前校验。
- [x] 6.7 运行 WebApp 构建并通过。
- [x] 6.8 运行现有相关测试并通过。

## 7. 范围约束任务

- [x] 7.1 只在允许修改范围内实现：`webapp/App.tsx`、`webapp/styles.css`、`src/liufang/skill_editor.py`、必要时的 `src/liufang/web_api.py`、仅限投射物事件 payload / 预览调试数据补齐的 `src/liufang/skill_runtime.py`、`tests/test_skill_editor.py`、`tests/test_skill_runtime.py`、`webapp/smoke-test.mjs`。
- [x] 7.2 不修改禁止范围：`src/liufang/gem_board.py`、`configs/sudoku_board/**`、`src/liufang/loot.py`、`src/liufang/affixes.py`、`src/liufang/inventory.py`、`configs/loot/**`、`configs/affixes/**`、`configs/gems/**`、`src/liufang/combat.py`、非投射物技能逻辑、非技能编辑器 UI、非预览场景逻辑。
