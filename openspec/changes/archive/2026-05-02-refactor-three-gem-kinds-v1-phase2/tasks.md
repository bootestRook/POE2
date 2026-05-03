## 1. 配置与模型迁移

- [x] 1.1 更新宝石基础定义模型，新增 `gem_kind` 和 `sudoku_digit`，并保留旧主动技能宝石与辅助宝石可读取。
- [x] 1.2 新增被动技能宝石定义入口，加载 `passive_skill_gems.toml`，并要求中文名称、描述、`gem_kind = passive_skill`、`sudoku_digit` 和被动效果字段。
- [x] 1.3 更新宝石实例结构，使实例保存 `gem_kind` 和 `sudoku_digit`，并避免为真实宝石新增随机词缀字段。
- [x] 1.4 更新配置校验，校验 `gem_kind` 三个合法值、`sudoku_digit` 1 到 9、被动宝石本地化 key、辅助宝石目标过滤规则。
- [x] 1.5 保留 affix 残留文件和辅助类型，但从第二阶段必需验收和真实数据生成路径中隔离随机词缀。

## 2. 数独盘规则

- [x] 2.1 将后端数独合法性检查从旧 `gem_type` 改为 `sudoku_digit`。
- [x] 2.2 将行 / 列 / 宫重复检查改为只按 `sudoku_digit` 分组。
- [x] 2.3 更新非法放置错误 key、中文文案和 board view 输出，使文案表达“数独数字”而非旧 `gem_type`。
- [x] 2.4 更新前端合法格高亮和放置预判，使 `useLegalDropCells`、`canPlaceGemOnBoard` 使用 `sudoku_digit`。
- [x] 2.5 增加测试覆盖同一 `gem_kind` 不同 `sudoku_digit` 不冲突，以及不同 `gem_kind` 同一 `sudoku_digit` 仍冲突。

## 3. 三类宝石 UI

- [x] 3.1 更新 `PresentationService.gem_detail` 输出 `gem_kind`、`sudoku_digit` 和三类中文分类。
- [x] 3.2 让被动技能宝石详情复用主动技能宝石 tooltip 的布局、数值展示、`GemOrb`、悬停定位和样式。
- [x] 3.3 为被动技能宝石隐藏主动释放字段，例如冷却、投射物数量和近期 DPS。
- [x] 3.4 扩展辅助宝石详情，使 apply filter 可显示主动技能宝石或被动技能宝石目标。
- [x] 3.5 增加 UI 测试，断言主动、被动、辅助宝石详情均为中文且不显示随机词缀 section。

## 4. 悬停、高亮与连线

- [x] 4.1 复用现有关系高亮，让被动技能宝石悬停时显示自身、相关宝石和关系格。
- [x] 4.2 将前端支持线生成从硬编码 `support -> active` 扩展为读取后端 modifier source / target / relation。
- [x] 4.3 显示 `support -> active`、`support -> passive`、`passive -> active` 的最小连线或影响反馈。
- [x] 4.4 禁止显示或计算 `support -> support` 与 `passive -> passive` 递归传播线。
- [x] 4.5 增加 WebApp smoke 或组件级检查，覆盖被动宝石悬停、合法格高亮和中文提示。

## 5. 关系路由与效果结算

- [x] 5.1 在技能效果结算中保留主动技能作为最终 `FinalSkillInstance` 聚合入口。
- [x] 5.2 实现 `support -> active` 旧行为兼容，确保旧辅助宝石仍影响旧主动技能宝石。
- [x] 5.3 实现 `support -> passive`，在被动贡献进入主动技能前先计算辅助对被动的放大或修正。
- [x] 5.4 实现 `passive -> active`，把被动技能宝石贡献纳入主动技能最终预览和战斗实例。
- [x] 5.5 保持同一 source / target / stat 只结算一次。
- [x] 5.6 禁止 `support -> support`、`passive -> passive -> active` 递归传播和导管创建二次传播链。
- [x] 5.7 增加单元测试覆盖三类路由、禁止路由、关系优先级、导管兼容和防重复。

## 6. 技能预览与战斗实例

- [x] 6.1 更新技能预览，使 applied modifiers 能显示被动宝石贡献来源、关系、属性和值。
- [x] 6.2 确保只有 `gem_kind = active_skill` 的宝石生成主动技能战斗实例。
- [x] 6.3 确保被动技能宝石不会进入自动释放队列。
- [x] 6.4 将 self_stat 被动最小接入 `max_life`、`move_speed`、`pickup_radius` 汇总。
- [x] 6.5 在战斗开始或状态刷新前应用 self_stat 被动贡献，并更新 HUD / 移动 / 拾取相关展示。
- [x] 6.6 增加测试覆盖被动不释放、被动贡献主动技能、self_stat 影响玩家属性。

## 7. 随机词缀防回归

- [x] 7.1 确认 Loot Runtime 第二阶段不会调用随机词缀生成并写入真实宝石实例。
- [x] 7.2 确认新增被动宝石配置不包含随机词缀字段。
- [x] 7.3 确认后端详情输出不包含 `random_affixes` 或随机词缀 section。
- [x] 7.4 确认 WebApp tooltip 不显示随机词缀 section。
- [x] 7.5 增加防回归测试，覆盖真实掉落无随机词缀、主动 / 被动 / 辅助 tooltip 无随机词缀。

## 8. 验证

- [x] 8.1 运行 `cmd /c openspec validate refactor-three-gem-kinds-v1-phase2 --strict`。
- [x] 8.2 运行 `python tools\validate_v1_configs.py`。
- [x] 8.3 运行 `python -m unittest discover tests`。
- [x] 8.4 运行 `cmd /c npm test`。
- [x] 8.5 运行 `cmd /c npm run build`。
- [x] 8.6 手动检查玩家可见文本、HUD、提示、调试可见文本、错误提示、交互提示均为中文。
