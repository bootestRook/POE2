## ADDED Requirements

### Requirement: V1 简化击中伤害公式
V1 SHALL calculate active skill hit output from a unified skill stat context that includes player base stats, active skill modifiers, routed passive/support modifiers, and conduit-amplified routed values.

#### Scenario: 玩家基础伤害属性影响技能
- **WHEN** a V1-active player base stat such as `damage_add_percent`, `fire_damage_add_percent`, `spell_damage_add_percent`, or `projectile_damage_add_percent` has a non-zero value and an active skill matches that stat's formula condition
- **THEN** the final skill calculation SHALL include that value in the skill's additive increase pool

#### Scenario: 非匹配标签属性不影响技能
- **WHEN** a V1-active player or routed stat targets a damage type, source tag, or behavior tag that the active skill does not have
- **THEN** the final skill calculation SHALL NOT include that stat in the active skill's additive increase pool

#### Scenario: 元素属性匹配元素技能
- **WHEN** `elemental_damage_add_percent` is present and the active skill damage type is `fire`, `cold`, or `lightning`
- **THEN** the final skill calculation SHALL include `elemental_damage_add_percent` in that skill's additive increase pool

#### Scenario: 击中最终乘区参与 V1 公式
- **WHEN** `damage_final_percent` or `hit_damage_final_percent` is present in the skill stat context
- **THEN** V1 SHALL apply those final pools after the additive increase pool when calculating hit damage

### Requirement: V1 暴击期望输出
V1 SHALL expose critical expectation values for skill preview without requiring random critical strike rolls in the minimal combat loop.

#### Scenario: 可暴击技能计算期望伤害
- **WHEN** an active skill has `hit.can_crit = true` and the skill stat context includes `base_crit_chance_percent`, `crit_chance_add_percent`, or `crit_damage_add_percent`
- **THEN** the final skill instance SHALL expose clamped `crit_chance`, `crit_multiplier`, and `expected_hit_damage` derived from the V1 critical expectation formula

#### Scenario: 禁止暴击技能没有暴击收益
- **WHEN** an active skill cannot crit or the skill stat context has `cannot_crit = true`
- **THEN** the final skill instance SHALL expose `crit_chance = 0`, `crit_multiplier` for display only, and `expected_hit_damage` equal to non-critical hit damage

### Requirement: V1 预览 DPS 口径
V1 SHALL calculate preview DPS from expected hit damage, uses per second, and a hit coverage factor rather than directly multiplying single-target DPS by projectile count.

#### Scenario: 投射物数量不默认线性增加单体预览 DPS
- **WHEN** a projectile skill gains `projectile_count_add` but does not opt into multi-hit overlap for the same target
- **THEN** preview DPS SHALL use `hit_coverage_factor = 1` and SHALL NOT multiply expected single-target damage by projectile count

#### Scenario: 预览显示覆盖信息
- **WHEN** projectile count, area size, chain count, or pierce count changes a skill's coverage
- **THEN** the skill preview SHALL expose coverage-related values separately from preview DPS

### Requirement: 数独关系强度参与路由公式
V1 SHALL use source power, target power, relation coefficient, and conduit multiplier when routing support and passive effects across the board.

#### Scenario: 来源和接受强度改变传播值
- **WHEN** a source gem has a matching `source_power_row`, `source_power_column`, or `source_power_box` value and a target gem has the matching target power value for the active relation
- **THEN** the routed modifier value SHALL be multiplied by source power, target power, and relation coefficient before entering the target skill stat context

#### Scenario: 导管只放大关系不递归
- **WHEN** a row, column, or box conduit applies to a routed relation
- **THEN** the conduit SHALL multiply that relation's routed value and SHALL NOT create support-to-support, passive-to-passive, or recursive secondary propagation

## MODIFIED Requirements

### Requirement: 技能最终效果计算
V1 SHALL calculate final skill effects from active skill definitions, player base stats, active gem modifiers, support effects, passive effects, board routing, conduit amplification, additive modifiers, final modifiers, critical expectation, runtime parameter modifiers, and preview formula outputs.

#### Scenario: 固定计算顺序
- **WHEN** the final effect of an active skill is calculated
- **THEN** the system SHALL read the active skill base definition, read V1-active player base stats, apply the active gem's own V1-active modifiers, find support gems that can affect it, apply support base effects, apply routed passive effects, apply support-to-passive amplification, apply row / column / box conduit amplification, aggregate a unified skill stat context, calculate V1 additive hit damage pools, calculate V1 final hit damage pools, calculate V1 critical expectation, calculate speed/cooldown/runtime parameter modifiers, and output the final skill instance

#### Scenario: 战斗中使用最终技能实例
- **WHEN** combat automatically releases an activated skill
- **THEN** Skill Runtime SHALL use the final skill instance calculated from the current valid board, inventory state, player stat context, and V1 formula state

#### Scenario: 技能预览解释公式来源
- **WHEN** Presentation UX displays a final skill preview or active skill tooltip
- **THEN** it SHALL expose final damage, expected hit damage, preview DPS, cooldown or uses per second, projectile count or coverage values, and applied modifier traces from the final skill instance rather than recalculating divergent frontend-only formula values
