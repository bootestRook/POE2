## Why

当前游戏视觉表现混合了像素/手绘角色、地牢写实底图、PNG 技能特效和厚重 UI 纹理，战斗对象主要由 React DOM 节点渲染；这会限制同屏大量敌人、投射物、掉落物和伤害数字时的可读性与帧率。

本变更将整体视觉方向迁移为“抽象几何图形极简风格”，用统一的几何语言表达战斗信息，并把高频战斗表现迁移到 Canvas 批量绘制，同时不改变任何玩法、数值、技能、宝石、数独或掉落规则。

## What Changes

- 建立全局视觉 design tokens，覆盖颜色、字号、边框、透明度、轻量阴影和动效时长。
- 新增战斗 Canvas 几何表现层，用于批量绘制玩家、怪物、投射物、技能范围、命中反馈、掉落物和伤害数字。
- 将玩家、普通怪、精英怪、Boss、投射物、掉落物统一为圆形、三角形、方块、六边形、线段、环形等基础几何体。
- 将技能特效表达收敛为 Canvas 批绘的范围圈、弹幕、命中、爆炸、连锁、地刺和短时粒子。
- 将 HUD、角色信息面板、背包、数独宝石盘、技能栏和 tooltip 改为深色哑光、细边框、几何图标化的极简 UI 皮肤。
- 旧像素角色、旧 PNG VFX、旧地牢/工作台素材只能作为位置、尺寸、交互逻辑参考或临时 fallback，不能作为最终视觉方向。
- 不引入大型美术资源包，不改为 3D，不改为等距地牢纸片风。

## Capabilities

### New Capabilities

- `abstract-geometric-visual-system`: 定义抽象几何极简视觉系统的表现范围、渲染边界、性能要求和验收标准。

### Modified Capabilities

- 无。现有 `v1-minimal-sudoku-gem-loop` 与 `map-editor-encounter-aggro` 的玩法/规则需求不变。

## Impact

- 主要影响 `webapp/App.tsx`、`webapp/styles.css` 以及新增的视觉 tokens、Canvas renderer、几何图标模块。
- 旧视觉资源入口 `webapp/unitAssets.ts`、`webapp/unitAnimation.ts`、`webapp/vfxAssets.ts` 会被逐步降级为参考或 fallback。
- 战斗逻辑、技能 runtime、数值配置、掉落配置、宝石配置、数独盘规则、后端 API 数据结构不应被修改。
- 需要新增截图验收与性能 smoke 验证，确认同屏 300 个敌人、1000 个投射物、300 个掉落物、200 个伤害数字时，战斗对象仍由 Canvas 批量绘制，而不是由大量 DOM 节点承担。
