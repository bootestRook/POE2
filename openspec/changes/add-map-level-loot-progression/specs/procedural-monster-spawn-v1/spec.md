## ADDED Requirements

### Requirement: 后端 canonical 地图怪物实例
Playable map runs SHALL use backend-canonical monster instances for real combat, monster level, HP, damage, rarity, boss state, and loot context.

#### Scenario: 地图运行生成 canonical 怪物
- **WHEN** 玩家开始一个地图运行
- **THEN** 后端 SHALL create or provide monster instances with runtime id, monster id, pack id, zone type, spawn rarity, boss flag, position, current life, max life, base damage, damage multiplier, and loot context

#### Scenario: 前端生怪不决定真实战斗
- **WHEN** playable WebApp displays monsters for a map run
- **THEN** WebApp SHALL render or adapt backend-canonical monster instances
- **AND** WebApp SHALL NOT use frontend-only procedural spawn output as the source of truth for real HP, damage, rarity, boss state, or loot context

#### Scenario: 临时前端模拟被隔离
- **WHEN** frontend-only spawn or debug simulation remains in the repository
- **THEN** it SHALL be named or documented as non-canonical tooling/fallback
- **AND** tests SHALL prove the playable map-run path does not use it for real combat or drops

### Requirement: 地图等级影响生怪结果
Monster spawn output for playable map runs SHALL include map-stage and monster-level scaling from backend map run context.

#### Scenario: 怪物实例包含等级来源
- **WHEN** a monster instance is generated for a playable map run
- **THEN** it SHALL include or reference the map run `stage_id`, `map_level`, and `monster_level`

#### Scenario: 稀有度倍率复用
- **WHEN** a generated monster is normal, magic, rare, or boss
- **THEN** its final life and damage SHALL combine map-level scaling with existing rarity multipliers
