## Why

当前技能编辑器已经能打开并保存已迁移的投射物技能包，但投射物参数分散在基础信息、释放参数、子弹模块、伤害点、表现和测试场等区域。调试发射点、目标点、飞行方向、特效朝向和碰撞半径时，编辑者需要在多个位置来回查找字段，容易误判实际运行结果。

旧技能编辑器样本 `1011.xml` 提供了更接近投射物调试思路的组织方式：先看发射位置，再看发射方向、目标搜索、发射组、运动、碰撞、伤害、表现和调试显示。本次不读取真实 XML 文件，也不实现 XML 导入器，只把当前项目已有投射物参数按这个组织方式重新整理到技能编辑器和预览流中。

## What Changes

- 调整技能编辑器的操作结构：左侧显示技能列表和事件类型列表，中间显示技能时间轴或事件列表，右侧显示当前选中事件的参数面板，底部显示运行、暂停、重置、保存、校验结果和运行日志。
- 当选中投射物事件时，右侧参数面板按“基础、发射位置、发射方向、目标搜索、发射组、运动、碰撞、伤害、表现、调试”展示当前项目已有字段。
- 整理投射物预览调试显示，使编辑器能更直观看到发射点、目标点、飞行方向线、碰撞半径和搜索范围。
- 将调试开关定义为 UI-only editor state，不写入正式 `skill.yaml`，不进入正式技能配置。
- 保存前增加基础校验，参数错误在面板内用中文显示；校验失败时不写入配置。
- 增加或更新最小测试，覆盖技能编辑器打开、技能选择、投射物参数分组显示、运行预览、保存前校验、构建通过和现有测试通过。
- 明确旧 XML 中存在但当前项目没有运行时能力的字段，本次全部标记为“本次忽略 / 暂不实现”，不新增旧项目的大量字段。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `v1-minimal-sudoku-gem-loop`: 增加技能编辑器投射物事件面板、投射物参数分组、预览调试显示、UI-only 调试开关和保存前中文校验的验收要求。

## Impact

允许修改范围：

- `webapp/App.tsx`
- `webapp/styles.css`
- `src/liufang/skill_editor.py`
- `src/liufang/web_api.py`，仅当接口返回结构需要调整
- `src/liufang/skill_runtime.py`，仅限投射物事件 payload / 预览调试数据补齐
- `tests/test_skill_editor.py`
- `tests/test_skill_runtime.py`
- `webapp/smoke-test.mjs`，仅做编辑器 / 预览 smoke 覆盖

禁止修改范围：

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

本次不覆盖：

- XML 导入器
- 旧 XML 编辑器复刻
- 新增旧 XML 中当前项目没有的运行时字段
- 宝石盘
- 数独合法性
- 宝石掉落
- 随机词缀
- 被动宝石
- 辅助宝石
- 导管路由
- 正式伤害公式
