## ADDED Requirements

### Requirement: V1 第二阶段三类宝石字段模型
V1 第二阶段 SHALL 使用 `gem_kind` 表示宝石大类，并使用 `sudoku_digit` 表示数独数字。

#### Scenario: gem_kind 合法值
- **WHEN** 宝石基础定义或宝石实例被校验
- **THEN** `gem_kind` SHALL 只能是 `active_skill`、`passive_skill` 或 `support`

#### Scenario: sudoku_digit 合法值
- **WHEN** 宝石基础定义或宝石实例被校验
- **THEN** `sudoku_digit` SHALL 只能是 1 到 9 的整数

#### Scenario: 字段职责分离
- **WHEN** 系统判断宝石大类、UI 分类、效果路由或数独合法性
- **THEN** 系统 MUST 使用 `gem_kind` 判断宝石大类，并 MUST 使用 `sudoku_digit` 判断数独数字

#### Scenario: gem_kind 不参与数独冲突
- **WHEN** 两颗宝石位于同一行、同一列或同一 3x3 宫
- **THEN** 行 / 列 / 宫冲突判断 SHALL NOT 检查 `gem_kind`

### Requirement: 被动技能宝石玩家属性贡献
V1 第二阶段 SHALL allow passive skill gems to provide non-release persistent player contributions without becoming active combat skills.

#### Scenario: self_stat 被动影响玩家属性
- **WHEN** 有效盘面中的被动技能宝石提供 `max_life`、`move_speed` 或 `pickup_radius` 类型贡献
- **THEN** 系统 SHALL 在进入战斗或刷新预览前把这些贡献汇总到玩家属性结果中

#### Scenario: 被动技能宝石不主动释放
- **WHEN** Combat Runtime 创建自动释放队列
- **THEN** 系统 SHALL only enqueue gems whose `gem_kind` is `active_skill`

### Requirement: 随机词缀防回归
V1 第二阶段 SHALL keep random affix systems inactive for real gem data and player-visible UI.

#### Scenario: 真实宝石数据不新增随机词缀
- **WHEN** 第二阶段新增或迁移真实宝石基础定义、宝石实例或掉落数据
- **THEN** 系统 SHALL NOT add random affix fields, random affix rolls, or random affix generated values to those real gem data paths

#### Scenario: UI 不恢复随机词缀
- **WHEN** 玩家查看主动技能宝石、被动技能宝石或辅助宝石详情
- **THEN** Presentation UX and WebApp SHALL NOT display a random affix section

#### Scenario: affix 残留只保留不启用
- **WHEN** 现有 affix 文件、字段、测试辅助对象或渲染逻辑仍存在
- **THEN** 系统 SHALL treat them as residual inactive code paths and SHALL NOT use them as second-phase gameplay, UI, or generation behavior

## MODIFIED Requirements

### Requirement: 配置拆分与校验
V1 SHALL split configuration into focused files under `configs/` and SHALL NOT use `all.xxx.toml` style aggregate configuration files. V1 第二阶段 SHALL validate `gem_kind` and `sudoku_digit` independently, and SHALL NOT require random affix generation as part of second-phase acceptance.

#### Scenario: 配置目录结构
- **WHEN** V1 第二阶段 configuration files are created or migrated
- **THEN** they SHALL be split across `configs/core/`, `configs/player/`, `configs/combat/`, `configs/gems/`, `configs/sudoku_board/`, `configs/skills/`, `configs/loot/`, and `configs/localization/`

#### Scenario: 必需配置文件
- **WHEN** V1 第二阶段 configuration completeness is validated
- **THEN** the system SHALL require the planned files `id_rules.toml`, `random_rules.toml`, `player_base_stats.toml`, `player_stat_defs.toml`, `damage_types.toml`, `hit_rules.toml`, `status_effects.toml`, `gem_type_defs.toml`, `active_skill_gems.toml`, `passive_skill_gems.toml`, `support_gems.toml`, `gem_tag_defs.toml`, `gem_instance_schema.toml`, `board_layout.toml`, `placement_rules.toml`, `relation_rules.toml`, `effect_routing_rules.toml`, `skill_templates.toml`, `skill_scaling_rules.toml`, `gem_drop_pools.toml`, `drop_weight_rules.toml`, and `zh_cn.toml`

#### Scenario: affix 残留文件不作为第二阶段必需能力
- **WHEN** `configs/affixes/` 中的既有 residual files 仍存在
- **THEN** validation MAY keep them readable for legacy compatibility but SHALL NOT require random affix spawning, random affix UI, or random affix generation behavior for this change

#### Scenario: 配置引用校验
- **WHEN** V1 第二阶段 configuration validation runs
- **THEN** it SHALL validate unique IDs, existing references, legal tags, legal stats, legal `gem_kind`, legal `sudoku_digit`, legal relation IDs, legal routing rules, and required Chinese localization keys

### Requirement: 玩家属性定义
V1 SHALL define the minimal player stats required for combat, skill calculation, pickup, active skill slots, and passive self-stat contributions.

#### Scenario: 属性集合完整
- **WHEN** `player_stat_defs.toml` is validated
- **THEN** it SHALL include `max_life`, `current_life`, `move_speed`, `pickup_radius`, `skill_slots_active`, `damage_add_percent`, `damage_final_percent`, `attack_speed_add_percent`, `cast_speed_add_percent`, `skill_speed_final_percent`, `cooldown_reduction_percent`, `added_cooldown_ms`, `area_add_percent`, `projectile_count_add`, `projectile_speed_add_percent`, `crit_chance_add_percent`, `crit_damage_add_percent`, `status_chance_add_percent`, `physical_damage_add_percent`, `fire_damage_add_percent`, `cold_damage_add_percent`, and `lightning_damage_add_percent`

#### Scenario: self_stat 被动可使用现有玩家属性
- **WHEN** 被动技能宝石提供 self_stat contribution
- **THEN** it SHALL target existing V1 player stats such as `max_life`, `move_speed`, or `pickup_radius` rather than adding a new full attribute system

#### Scenario: V1 外成长属性不进入实现
- **WHEN** player stats are exposed to V1 gameplay or UI
- **THEN** mana, strength, dexterity, intelligence, full resistance stats, armor, evasion, and energy shield SHALL remain out of V1 implemented gameplay

### Requirement: 宝石定义与宝石实例
V1 SHALL separate base gem definitions from player-owned gem instances, and V1 第二阶段 SHALL classify gems by `gem_kind` while representing sudoku legality by `sudoku_digit`.

#### Scenario: 宝石实例引用基础定义
- **WHEN** a gem drops and is saved to inventory
- **THEN** the saved instance SHALL include an `instance_id`, `base_gem_id`, `gem_kind`, `sudoku_digit`, `rarity`, `level`, lock state, and board state while referencing the base definition by ID

#### Scenario: 主动技能宝石清单
- **WHEN** active skill gem content is validated
- **THEN** it SHALL include the existing V1 active skill IDs `active_fire_bolt`, `active_ice_shards`, `active_lightning_chain`, `active_frost_nova`, `active_puncture`, `active_penetrating_shot`, `active_lava_orb`, and `active_fungal_petards`, each using `gem_kind = active_skill`

#### Scenario: 被动技能宝石结构
- **WHEN** passive skill gem content is validated
- **THEN** it SHALL be loaded from passive skill gem definitions, use `gem_kind = passive_skill`, declare `sudoku_digit`, use Chinese localization keys, and declare non-release passive effects or self-stat contributions

#### Scenario: 辅助宝石结构
- **WHEN** support gem content is validated
- **THEN** existing support gem structures SHALL remain loadable with `gem_kind = support`, explicit `sudoku_digit`, explicit apply filters, and no random affix fields added by this change

#### Scenario: 辅助宝石适用条件
- **WHEN** a support gem definition is validated
- **THEN** it SHALL declare explicit apply filters using tags or target kind rules and SHALL NOT rely only on stat field names to imply affected targets

### Requirement: 数独宝石盘
V1 SHALL provide a 9x9 sudoku gem board with row, column, box, and orthogonal adjacency relationships. V1 第二阶段 sudoku legality SHALL be based only on `sudoku_digit`.

#### Scenario: sudoku_digit 合法性检查
- **WHEN** a gem is placed on the board
- **THEN** the board SHALL validate that its `sudoku_digit` is between 1 and 9

#### Scenario: 同行同列同宫不重复
- **WHEN** the board contains two placed gems with the same `sudoku_digit` in the same row, column, or 3x3 box
- **THEN** the placement SHALL be invalid regardless of their `gem_kind`

#### Scenario: 同类不同数字不冲突
- **WHEN** the board contains two placed gems with the same `gem_kind` but different `sudoku_digit` in the same row, column, or 3x3 box
- **THEN** the placement SHALL remain valid unless another rule is violated

#### Scenario: 异类同数字仍冲突
- **WHEN** the board contains two placed gems with different `gem_kind` but the same `sudoku_digit` in the same row, column, or 3x3 box
- **THEN** the placement SHALL be invalid

#### Scenario: 空盘不可进入战斗
- **WHEN** the board has no active skill gem
- **THEN** the system SHALL prevent entering combat

#### Scenario: 关系计算
- **WHEN** two gems are placed on the board
- **THEN** Gem Board Runtime SHALL calculate whether they are in the same row, same column, same 3x3 box, or orthogonally adjacent without checking `gem_kind`

### Requirement: 掉落与库存
V1 SHALL support gem drops, pickup, inventory storage, and board mount / unmount state for active skill, passive skill, and support gems.

#### Scenario: 只掉落宝石
- **WHEN** a combat reward drop is generated
- **THEN** Loot Runtime SHALL generate only active skill gems, passive skill gems, or support gems and SHALL NOT generate equipment, currency, maps, fragments, or materials

#### Scenario: 掉落实例不生成随机词缀
- **WHEN** Loot Runtime generates a gem instance during V1 第二阶段
- **THEN** it SHALL NOT roll or save random affixes on the generated instance

#### Scenario: 拾取入库
- **WHEN** the player picks up a dropped gem within pickup range
- **THEN** the gem instance SHALL be added to Inventory / Storage with its base gem reference, `gem_kind`, `sudoku_digit`, rarity, level, lock state, and board state preserved

#### Scenario: 上盘下盘
- **WHEN** a player mounts or unmounts a gem
- **THEN** Inventory / Storage SHALL update the gem's board occupancy state and Gem Board Runtime SHALL recalculate legality and relationships using `sudoku_digit`

### Requirement: 数独盘效果路由
V1 SHALL route gem effects through Source, Target, Relation, and Power using fixed enumerated rules. V1 第二阶段 SHALL support `support -> active_skill`, `support -> passive_skill`, and `passive_skill -> active_skill` while preventing recursive propagation.

#### Scenario: 基础路由公式
- **WHEN** a source gem effect is routed to a target gem
- **THEN** the routed effect SHALL be calculated from source effect, source power, target receiving power, and relation coefficient

#### Scenario: 关系系数
- **WHEN** relation coefficients are applied
- **THEN** V1 SHALL support adjacent coefficient, same row coefficient, same column coefficient, and same box coefficient

#### Scenario: 相邻关系优先
- **WHEN** two gems are both orthogonally adjacent and in the same row or column
- **THEN** the system SHALL calculate the relation once using the adjacent relationship and SHALL NOT add a second row or column calculation

#### Scenario: support 影响主动技能
- **WHEN** a support gem matches an active skill gem through relation and apply filters
- **THEN** the support gem SHALL contribute modifiers to the active skill gem

#### Scenario: support 影响被动技能
- **WHEN** a support gem matches a passive skill gem through relation and apply filters
- **THEN** the support gem SHALL contribute modifiers to the passive skill gem before passive-to-active aggregation

#### Scenario: passive 影响主动技能
- **WHEN** a passive skill gem has valid relation or aura rules for an active skill gem
- **THEN** the passive skill gem SHALL contribute non-release modifiers to the active skill final preview and combat instance

#### Scenario: support 不影响 support
- **WHEN** source / target routing evaluates a support gem targeting another support gem
- **THEN** the system SHALL reject that route and SHALL NOT apply modifiers

#### Scenario: 防重复和防递归
- **WHEN** source / target routing is evaluated
- **THEN** the same source gem SHALL affect the same target gem for the same stat at most once, `passive_skill -> passive_skill -> active_skill` recursive propagation SHALL NOT occur, and conduit gems SHALL only amplify without creating new secondary propagation chains

### Requirement: 技能最终效果计算
V1 SHALL calculate final active skill effects from active skill definitions, support effects, passive contributions, board routing, conduit amplification, additive modifiers, and final modifiers. V1 第二阶段 SHALL NOT use random affixes in final skill calculation.

#### Scenario: 固定计算顺序
- **WHEN** the final effect of an active skill is calculated
- **THEN** the system SHALL read the active skill base definition, find support gems that can affect it, apply support base effects, calculate support-to-passive contributions, calculate passive-to-active contributions, apply row / column / box conduit amplification where compatible, aggregate additive modifiers, aggregate final modifiers, and output the final skill instance

#### Scenario: 不使用随机词缀
- **WHEN** the final effect of an active skill is calculated during V1 第二阶段
- **THEN** the system SHALL NOT read, generate, display, or apply random affix rolls as part of the final skill instance

#### Scenario: 被动不生成主动技能实例
- **WHEN** final skill instances are generated for combat
- **THEN** only gems with `gem_kind = active_skill` SHALL produce `FinalSkillInstance` outputs

#### Scenario: 战斗中使用最终技能实例
- **WHEN** combat automatically releases an activated skill
- **THEN** Skill Runtime SHALL use the final skill instance calculated from the current valid board and inventory state

### Requirement: 最小战斗循环
V1 SHALL include a minimal combat loop that supports automatic active skill release, monster kills, gem drops, gem pickup, and returning to board adjustment.

#### Scenario: 自动释放已激活主动技能
- **WHEN** combat is running and the board has valid activated active skill gems
- **THEN** Combat Runtime SHALL trigger Skill Runtime to automatically release those active skills according to their final cooldown and speed values

#### Scenario: 被动技能不自动释放
- **WHEN** combat is running and the board contains passive skill gems
- **THEN** Combat Runtime SHALL NOT automatically release passive skill gems as combat skills

#### Scenario: 击杀触发掉落
- **WHEN** monsters are killed in combat
- **THEN** Combat Runtime SHALL trigger Loot Runtime to roll gem drops

### Requirement: 中文 UI
V1 SHALL display all player-visible text in Chinese. V1 第二阶段 SHALL include active skill, passive skill, support, sudoku digit, route, preview, error, HUD, debug-visible, and interaction prompt text in Chinese.

#### Scenario: 主动技能宝石详情展示
- **WHEN** the player views an active skill gem
- **THEN** Presentation UX SHALL show Chinese name, active skill category, `sudoku_digit`, tags, base skill effect, affected target rules, current effective targets on the board, and no random affix section

#### Scenario: 被动技能宝石详情展示
- **WHEN** the player views a passive skill gem
- **THEN** Presentation UX SHALL show Chinese name, passive skill category, `sudoku_digit`, tags, passive or self-stat effect, affected target rules, current effective targets on the board, and no random affix section while reusing active skill gem UI structure

#### Scenario: 辅助宝石详情展示
- **WHEN** the player views a support gem
- **THEN** Presentation UX SHALL show Chinese name, support category, `sudoku_digit`, tags, support effect, apply filters for active or passive targets, current effective targets on the board, and no random affix section

#### Scenario: 数独盘展示
- **WHEN** the player edits the board
- **THEN** Presentation UX SHALL show the 9x9 grid, 3x3 box sections, invalid placement prompts, same row / same column / same box highlights, gem influence preview, and final skill effect preview in Chinese

#### Scenario: 战斗与掉落展示
- **WHEN** combat or loot feedback is displayed
- **THEN** combat HUD, drop prompts, invalid placement prompts, skill final effect descriptions, and passive contribution descriptions SHALL use Chinese player-visible text

### Requirement: WebApp 可操作入口
V1 SHALL provide a browser-openable WebApp entry for the minimal loop. V1 第二阶段 WebApp SHALL represent `gem_kind` and `sudoku_digit` consistently with backend rules and SHALL NOT implement a divergent sudoku rule set based on old `gem_type`.

#### Scenario: 浏览器打开 WebApp
- **WHEN** 玩家启动 V1 WebApp
- **THEN** WebApp SHALL open in a browser page with the Chinese title `数独宝石流放like V1`

#### Scenario: WebApp 完成最小循环操作
- **WHEN** 玩家使用 WebApp
- **THEN** WebApp SHALL allow player to view inventory, inspect active skill gems, inspect passive skill gems, inspect support gems, mount/unmount gems on the 9x9 board, preview final skill effects, start minimal combat, see drops, and pick up drops

#### Scenario: WebApp 中文玩家可见文本
- **WHEN** WebApp displays buttons, titles, prompts, errors, HUD, logs, inventory, board, skill preview, combat, drops, pickup feedback, passive effects, or debug-visible interaction hints
- **THEN** WebApp SHALL display all player-visible text in Chinese

#### Scenario: WebApp 复用 V1 规则层
- **WHEN** WebApp needs sudoku legality, board relationships, skill final effects, passive contributions, combat results, loot drops, or inventory updates
- **THEN** WebApp SHALL call or reuse the current V1 rules capability through an API or adapter layer and SHALL NOT reimplement a divergent rule set in frontend code

#### Scenario: WebApp 合法格预判使用 sudoku_digit
- **WHEN** WebApp previews whether a dragged gem can be placed in a board cell
- **THEN** WebApp SHALL use `sudoku_digit` as the conflict key and SHALL NOT use old `gem_type` display text or identity text as the conflict key

## REMOVED Requirements

### Requirement: 随机词缀
**Reason**: V1 第二阶段明确不恢复随机词缀 UI、真实数据字段或随机词缀生成逻辑；现有 spec 要求随机词缀与本阶段目标冲突。

**Migration**: Existing affix files, helper types, tests, and inactive rendering logic MAY remain as residual compatibility artifacts, but Phase 2 behavior SHALL NOT generate or display random affixes.

#### Scenario: 不再作为第二阶段验收要求
- **WHEN** V1 第二阶段 validates gem definitions, gem instances, loot generation, skill preview, or UI
- **THEN** random affix generation and random affix display SHALL NOT be required for acceptance
