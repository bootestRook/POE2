## MODIFIED Requirements

### Requirement: V1 正式最小循环

V1 SHALL be the first formal minimal loop version of the project, not a Demo, and SHALL validate the loop "刷宝石 -> 看词缀 -> 调盘面 -> 技能表现变化 -> 再刷宝石".

#### Scenario: 完成刷宝闭环
- **WHEN** 玩家通过战斗获得宝石、拾取入库、查看词缀、调整 9x9 数独盘并重新进入战斗
- **THEN** 系统 SHALL 使用新盘面和宝石词缀重新计算技能最终效果，并在战斗中体现技能表现变化

#### Scenario: 禁止 V1 外系统
- **WHEN** V1 gem loop 规格、配置或 UI 被审查 outside the explicit `equipment-affix-generation` capability
- **THEN** 系统 SHALL NOT include 地图词缀、腐化系统、复杂货币系统、法力系统、力量 / 敏捷 / 智力成长系统、完整元素抗性系统、完整护甲 / 闪避 / 能量护盾系统、赛季系统、复杂技能树或多角色职业, and SHALL NOT connect equipment affixes to the playable skill runtime until a later explicit capability defines that integration
