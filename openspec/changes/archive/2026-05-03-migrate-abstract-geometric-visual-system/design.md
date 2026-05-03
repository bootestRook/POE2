## Context

当前前端将主战斗、实体渲染、技能特效、HUD、背包、数独盘、角色信息面板集中在 `webapp/App.tsx`，视觉样式集中在 `webapp/styles.css`。战斗场景里的玩家、怪物、投射物、命中特效、范围圈、连锁和伤害数字大多由 React DOM 节点和 CSS 渐变/filter/box-shadow 表达；地图编辑器小地图已有 Canvas，但主战斗渲染没有 Canvas 批绘层。

目标是在不改玩法逻辑的前提下，将最终视觉方向迁移为“抽象几何图形极简风格”：深色哑光背景，白/橙/蓝/灰主色，角色、敌人、投射物、技能范围、掉落物、宝石和 UI 使用同一套几何语言表达。

## Goals / Non-Goals

**Goals:**

- 建立可复用的视觉 tokens，统一颜色、字号、边框、透明度、动效时长和轻量阴影。
- 新增 Canvas 战斗几何渲染层，先作为基础骨架接入，再逐步承接实体、投射物、范围、命中、掉落和伤害数字。
- 保留俯视 2D 战斗视角，使用现有世界坐标、镜头、深度排序和运行时状态作为输入。
- React DOM 继续负责 UI 面板、背包、数独盘、按钮、tooltip 和文字控件。
- 将旧像素/手绘/地牢资源降级为参考或 fallback，不作为最终风格。

**Non-Goals:**

- 不修改战斗数值、技能逻辑、宝石规则、数独规则、伤害公式、掉落规则或敌人配置。
- 不把角色、怪物或场景改为 3D，不改为等距地牢纸片风。
- 不新增随机词缀、宝石、技能或敌人配置。
- 不引入大型美术资源包。
- 不用大量 DOM/SVG 节点模拟弹幕、粒子或高频战斗对象。

## Decisions

### Decision: 战斗表现使用 Canvas 2D 批量绘制

主战斗中的玩家、怪物、投射物、掉落物、范围圈、命中特效、粒子和伤害数字 MUST 优先由 Canvas 2D 批量绘制。Canvas renderer 接收现有运行时数据的只读快照，负责绘制，不负责目标选择、伤害、碰撞、掉落或状态更新。

替代方案是继续用 React DOM/CSS 渲染战斗对象。该方案实现快，但无法支撑同屏 300 个敌人、1000 个投射物、300 个掉落物、200 个伤害数字的目标。

### Decision: React DOM 只保留 UI 与少量调试控件

背包、数独盘、角色信息、HUD、技能编辑器、按钮、tooltip、调试开关继续使用 React DOM。战斗对象不为每个敌人、投射物、粒子创建独立 DOM 节点。技能编辑器中的辅助线可以在过渡期保留 DOM，但最终也应能复用 Canvas 几何绘制。

### Decision: 视觉 tokens 与几何规则独立于玩法配置

新增 `webapp/visualTokens.ts` 用于定义前端视觉 tokens。几何形状映射基于现有前端运行时字段，例如 `kind`、`monsterId`、`boss`、`runtimeTier`、`damageType`、`vfxKey`、`rarity_text`，但不回写或改动配置文件。

### Decision: 渐进迁移，先搭边界再替换旧视觉

Phase 1 只建立 tokens 与 Canvas 基础层，并绘制轻量背景网格/基准标记，确保不会破坏现有玩法。后续阶段逐步让 Canvas 接管实体、投射物和特效，最后删除或降级旧像素/VFX/地牢素材依赖。

## Risks / Trade-offs

- [Risk] `App.tsx` 过大，接入 Canvas 时容易误碰玩法逻辑 → Mitigation: 新增独立 renderer 文件，`App.tsx` 只传入只读快照和挂载 canvas。
- [Risk] 初期 Canvas 与旧 DOM 视觉并存，可能出现重复绘制 → Mitigation: Phase 1 只做底层/调试型几何层，后续每阶段明确替换对象并删除对应 DOM 渲染路径。
- [Risk] Canvas 文本和几何在不同缩放下可读性不足 → Mitigation: 使用 tokens 中的最小线宽、字号和 alpha 规则，验收截图覆盖桌面与小屏。
- [Risk] 旧地图 mask 同时承担视觉和导航资源入口 → Mitigation: 不改 `walkable_mask`、`blocker_mask`、`spawn_mask`、`map_meta` 的语义；若替换底图，只替换视觉背景，不改导航数据。

## Migration Plan

1. Phase 1：建立视觉 tokens 和 Canvas renderer 骨架，接入主战斗层，不改玩法。
2. Phase 2：Canvas 接管玩家、怪物、投射物表现，旧 sprite 渲染降级。
3. Phase 3：Canvas 接管技能范围、命中、爆炸、连锁、地刺和伤害数字。
4. Phase 4：重做背包、数独盘、人物信息 UI 的几何极简皮肤。
5. Phase 5：删除或降级旧像素、旧地牢、旧 PNG VFX 素材依赖。

回滚策略：每个阶段保持独立提交边界；Phase 1 的 Canvas 层可通过一个局部开关禁用，确保旧 DOM 战斗画面仍可运行。

Phase 4 HUD/UI 回滚标记：HUD、技能栏、战斗日志、调试文字、背包、数独盘和角色面板的视觉迁移必须保持 CSS-only 或展示层改动，不得改变事件处理、React state、技能释放、宝石拖拽、放置规则、日志内容或调试开关语义。HUD 皮肤改动需要在 `webapp/styles.css` 标注 `abstract-geometric HUD skin rollback marker`，并在 `openspec/changes/migrate-abstract-geometric-visual-system/rollback.md` 留档说明还原范围。

## Open Questions

- 地面掉落物目前只在后端和 notice/log 中可见，是否需要新增前端地面掉落状态同步，待 Phase 2/3 前确认。
- 技能编辑器辅助线是否在 Phase 3 一并迁移 Canvas，还是保留 DOM 调试层到后续编辑器专项改造，待实际性能截图后决定。
## Additional Decision: Geometric Monster Rarity Readout

首批几何怪物定义 SHALL 使用局内统一的标准主体色，而不是每个怪物自带独立主色。怪物的形状继续表达类型差异，尺寸表达威胁体量。稀有度 SHALL 通过脚下底座表达，而不是画在怪物主体上：普通为淡灰投影，魔法为蓝色菱形底座，稀有为金色六边形底座，BOSS/传奇为更大的红色六边形底座并预留低频外扩脉冲。默认尺寸以玩家半径 18px 为基准，普通 22px、魔法 26px、稀有 32px、BOSS 52px，确保所有怪物主体都大于玩家。
