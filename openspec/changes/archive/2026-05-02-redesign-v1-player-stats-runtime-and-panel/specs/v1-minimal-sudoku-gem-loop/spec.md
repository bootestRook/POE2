## ADDED Requirements

### Requirement: 玩家属性面板分组
V1 SHALL render a config-driven player attribute panel that displays player-facing stats grouped by gameplay meaning rather than raw config category.

#### Scenario: 面板显示玩家需要关注的属性组
- **WHEN** the player attribute panel is rendered
- **THEN** it SHALL include groups for base attributes, life, mana, energy shield, defense, block, resistances, mobility, damage overview, skill type, speed/cooldown, crit, skill shape, status, effects, conversion, drops, and board power

#### Scenario: 面板排除不需要的属性
- **WHEN** the character panel configuration is validated
- **THEN** it SHALL NOT include `support_link_limit`, `mana_cost_multiplier_percent`, `mana_seal_percent`, `projectile_spread_angle_add`, `active_gem_level_add`, `passive_gem_level_add`, `support_gem_level_add`, or `gem_level`

#### Scenario: 面板不显示伤害类型组
- **WHEN** the player attribute panel is rendered
- **THEN** it SHALL NOT expose a damage-type group for physical, fire, cold, lightning, elemental, or all-damage-type increase stats, even if those stats remain valid backend formula stats

#### Scenario: 混沌抗性显示
- **WHEN** resistance stats are displayed
- **THEN** the former erosion resistance concept SHALL be displayed as chaos resistance

### Requirement: 主属性派生
V1 SHALL derive downstream player stats from strength, dexterity, and intelligence before combat, skill, board, loot, and panel values are exposed.

#### Scenario: 力量派生
- **WHEN** the player has strength
- **THEN** each 1 strength SHALL grant +0.5 max life and +0.2% melee damage

#### Scenario: 敏捷派生
- **WHEN** the player has dexterity
- **THEN** each 1 dexterity SHALL grant +0.2% attack speed, +0.2% cast speed, and +0.2% evasion

#### Scenario: 智慧派生
- **WHEN** the player has intelligence
- **THEN** each 1 intelligence SHALL grant +0.5 max mana and +0.2% max energy shield

#### Scenario: 派生值进入最终展示
- **WHEN** the API exposes `player_stats` or `character_panel`
- **THEN** downstream values SHALL include primary-attribute-derived contributions and SHALL remain distinguishable from base values in tests or traces

### Requirement: 资源与防御运行时
V1 SHALL make player-facing resource and defense stats affect combat state through deterministic V1 formulas.

#### Scenario: 魔力属性生效
- **WHEN** max mana, current mana, or mana regeneration stats are present
- **THEN** the player runtime and panel SHALL expose those values, and mana regeneration SHALL restore current mana up to max mana during combat ticks

#### Scenario: 能量护盾属性生效
- **WHEN** max energy shield, current energy shield, energy shield charge speed, or energy shield charge delay is present
- **THEN** incoming player damage SHALL deplete energy shield before life and shield recharge SHALL begin only after the configured delay

#### Scenario: 护甲减伤
- **WHEN** the player takes physical hit damage and armor or armor percent increases are present
- **THEN** V1 SHALL apply a deterministic armor mitigation formula before life damage is committed

#### Scenario: 闪避避免命中
- **WHEN** the player is targeted by an avoidable hit and evasion or evasion percent increases are present
- **THEN** V1 SHALL use a deterministic, testable evasion chance formula to determine whether the hit is avoided

#### Scenario: 格挡减伤
- **WHEN** attack block, spell block, or block damage reduction stats are present
- **THEN** V1 SHALL apply the matching block chance and block damage reduction to eligible incoming hits

#### Scenario: 抗性减伤
- **WHEN** incoming damage has fire, cold, lightning, or chaos type and matching resistance stats are present
- **THEN** V1 SHALL reduce that incoming damage according to the matching resistance before final life damage is applied

### Requirement: 掉落属性运行时
V1 SHALL make player-facing drop quantity and drop rarity stats affect gem drop generation.

#### Scenario: 掉落数量提高
- **WHEN** `gem_drop_quantity_add_percent` is present during combat reward generation
- **THEN** Loot Runtime SHALL increase the expected number of generated gem drops according to that value

#### Scenario: 掉落稀有度提高
- **WHEN** `gem_drop_rarity_add_percent` is present during gem rarity selection
- **THEN** Loot Runtime SHALL bias rarity weights toward higher rarities according to that value

## MODIFIED Requirements

### Requirement: 玩家属性定义

V1 SHALL define the player stats required for character display, combat, skill calculation, gem affixes, loot, resource/defense runtime, and sudoku-board stat routing, with explicit metadata that separates backend-only, runtime-effective, and panel-visible stats.

#### Scenario: 属性定义包含状态元数据
- **WHEN** `player_stat_defs.toml` is validated
- **THEN** every stat SHALL declare an id, Chinese localization key, category, value type, `v1_status`, `runtime_effective`, and `affix_spawn_enabled_v1`

#### Scenario: V1 生效属性集合完整
- **WHEN** `player_stat_defs.toml` is validated for V1 runtime-effective stats
- **THEN** it SHALL include primary attributes, life, mana, energy shield, defense, block, resistance, mobility, damage overview, backend damage-type, skill type, speed/cooldown, rating-based crit, skill shape, status, effect, conversion, drop, and board-power stats that are not explicitly excluded by this change

#### Scenario: 明确排除的属性不作为 V1 玩家面板属性
- **WHEN** player stat definitions and panel config are validated
- **THEN** `support_link_limit`, `mana_cost_multiplier_percent`, `mana_seal_percent`, `projectile_spread_angle_add`, `active_gem_level_add`, `passive_gem_level_add`, `support_gem_level_add`, and `gem_level` SHALL NOT be required player panel rows

#### Scenario: 多余玩家属性被清理
- **WHEN** player stat definitions, base stats, API state, UI type contracts, tests, or validation rules are inspected
- **THEN** they SHALL NOT define or reference `pickup_radius`, `active_skill_slots`, `passive_skill_slots`, or `skill_slots_active` as player stats

#### Scenario: V1 外属性可定义但不可误生效
- **WHEN** a stat has `v1_status` equal to `V1_DISPLAY_ONLY`, `V1_RESERVED`, or `V2_PLUS`
- **THEN** runtime calculation SHALL NOT apply it to combat, skill results, movement, drops, or board routing unless this or a later spec explicitly gives that stat a V1 runtime consumer

#### Scenario: 基础值与属性定义一致
- **WHEN** `player_base_stats.toml` is validated
- **THEN** every base value key SHALL reference an existing player stat and every runtime-effective player stat that requires a default SHALL have a defined base value

#### Scenario: 状态元数据约束词缀生成
- **WHEN** player stat definitions are validated
- **THEN** any stat whose `v1_status` is not `V1_ACTIVE` SHALL have `affix_spawn_enabled_v1 = false`

#### Scenario: 混沌命名替代腐蚀命名
- **WHEN** damage type, resistance, localization, or player stat ids are validated
- **THEN** first-party V1 configs SHALL use chaos naming for the former erosion damage/resistance concept

### Requirement: V1 简化击中伤害公式
V1 SHALL calculate active skill hit output from a unified skill stat context that includes player base stats, primary-attribute-derived stats, active skill modifiers, routed passive/support modifiers, and conduit-amplified routed values.

#### Scenario: 玩家基础伤害属性影响技能
- **WHEN** a V1-active player base stat such as `damage_add_percent`, `fire_damage_add_percent`, `spell_damage_add_percent`, or `projectile_damage_add_percent` has a non-zero value and an active skill matches that stat's formula condition
- **THEN** the final skill calculation SHALL include that value in the skill's additive increase pool

#### Scenario: 主属性派生伤害影响技能
- **WHEN** strength derives `melee_damage_add_percent` and the active skill has the melee tag
- **THEN** the final skill calculation SHALL include the derived melee damage value in the skill's additive increase pool

#### Scenario: 非匹配标签属性不影响技能
- **WHEN** a V1-active player or routed stat targets a damage type, source tag, or behavior tag that the active skill does not have
- **THEN** the final skill calculation SHALL NOT include that stat in the active skill's additive increase pool

#### Scenario: 元素属性匹配元素技能
- **WHEN** `elemental_damage_add_percent` is present and the active skill damage type is `fire`, `cold`, or `lightning`
- **THEN** the final skill calculation SHALL include `elemental_damage_add_percent` in that skill's additive increase pool

#### Scenario: 击中最终乘区参与 V1 公式
- **WHEN** `damage_final_percent` or `hit_damage_final_percent` is present in the skill stat context
- **THEN** V1 SHALL apply those final pools after the additive increase pool when calculating hit damage

#### Scenario: 连锁和穿透次数进入运行参数
- **WHEN** `chain_count_add` or `pierce_count_add` is present and a skill supports chain or pierce behavior
- **THEN** V1 SHALL add those values to the matching chain or pierce runtime parameter without changing preview DPS by default

### Requirement: V1 暴击期望输出
V1 SHALL expose critical expectation values for skill preview using rating-based critical chance and critical damage conversion, without requiring random critical strike rolls in the minimal combat loop.

#### Scenario: 暴击值转化为暴击率
- **WHEN** an active skill has `hit.can_crit = true` and the skill stat context includes `crit_rating`
- **THEN** the final skill instance SHALL derive crit chance from `base_crit_chance_percent` plus `45 * crit_rating / (crit_rating + 600)`, clamped to the V1 crit chance cap

#### Scenario: 暴击伤害值转化为暴击伤害
- **WHEN** an active skill has `hit.can_crit = true` and the skill stat context includes `crit_damage_rating`
- **THEN** the final skill instance SHALL derive crit multiplier from `150% + 200 * crit_damage_rating / (crit_damage_rating + 1000)`

#### Scenario: 直接百分比暴击属性不是主要投放面
- **WHEN** affix spawn candidates are generated for V1 crit stats
- **THEN** `crit_rating` and `crit_damage_rating` SHALL be the normal rollable crit stats, while direct crit chance or direct crit damage percent stats SHALL be hidden, derived, or special-case modifiers

#### Scenario: 禁止暴击技能没有暴击收益
- **WHEN** an active skill cannot crit or the skill stat context has `cannot_crit = true`
- **THEN** the final skill instance SHALL expose `crit_chance = 0`, `crit_multiplier` for display only, and `expected_hit_damage` equal to non-critical hit damage

### Requirement: V1 预览 DPS 口径
V1 SHALL calculate preview DPS from expected hit damage, uses per second, and a hit coverage factor rather than directly multiplying single-target DPS by projectile, chain, or pierce count.

#### Scenario: 投射物数量不默认线性增加单体预览 DPS
- **WHEN** a projectile skill gains `projectile_count_add` but does not opt into multi-hit overlap for the same target
- **THEN** preview DPS SHALL use `hit_coverage_factor = 1` and SHALL NOT multiply expected single-target damage by projectile count

#### Scenario: 覆盖类属性单独展示
- **WHEN** projectile count, area size, chain count, or pierce count changes a skill's coverage
- **THEN** the skill preview SHALL expose coverage-related values separately from preview DPS

### Requirement: 数独关系强度参与路由公式
V1 SHALL use global player board power, gem source power, gem target power, relation coefficient, relation final modifiers, adjacent bonuses, and conduit multiplier when routing support and passive effects across the board.

#### Scenario: 来源和接受强度改变传播值
- **WHEN** a source gem or the player has a matching `source_power_row`, `source_power_column`, or `source_power_box` value and a target gem or the player has the matching target power value for the active relation
- **THEN** the routed modifier value SHALL be multiplied by combined source power, combined target power, and relation coefficient before entering the target skill stat context

#### Scenario: 相邻强度参与相邻传播
- **WHEN** an adjacent relation is routed and `source_power_adjacent`, `target_power_adjacent`, or `adjacent_bonus_final_percent` is present
- **THEN** V1 SHALL include those player global values in the adjacent relation's routed value

#### Scenario: 导管强度影响导管倍率
- **WHEN** a row, column, or box conduit applies to a routed relation and matching `conduit_power_row`, `conduit_power_column`, or `conduit_power_box` is present
- **THEN** the conduit multiplier SHALL include that global conduit power in addition to the support conduit's base multiplier

#### Scenario: 导管只放大关系不递归
- **WHEN** a row, column, or box conduit applies to a routed relation
- **THEN** the conduit SHALL multiply that relation's routed value and SHALL NOT create support-to-support, passive-to-passive, or recursive secondary propagation

### Requirement: 掉落与库存

V1 SHALL support gem drops, pickup, inventory storage, drop quantity scaling, drop rarity scaling, and board mount / unmount state.

#### Scenario: 只掉落宝石
- **WHEN** a combat reward drop is generated
- **THEN** Loot Runtime SHALL generate only active skill gems or support gems and SHALL NOT generate equipment, currency, maps, fragments, or materials

#### Scenario: 玩家掉落属性影响宝石掉落
- **WHEN** `gem_drop_quantity_add_percent` or `gem_drop_rarity_add_percent` is present in the player runtime stat context
- **THEN** Loot Runtime SHALL apply those values to gem drop count and gem rarity selection

#### Scenario: 拾取入库
- **WHEN** the player picks up a dropped gem within pickup range
- **THEN** the gem instance SHALL be added to Inventory / Storage with its base gem reference, rarity, affixes, and board state preserved

#### Scenario: 上盘下盘
- **WHEN** a player mounts or unmounts a gem
- **THEN** Inventory / Storage SHALL update the gem's board occupancy state and Gem Board Runtime SHALL recalculate legality and relationships
