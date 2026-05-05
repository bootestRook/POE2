# v1-minimal-sudoku-gem-loop Specification

## Purpose
TBD - created by archiving change implement-v1-minimal-sudoku-gem-loop. Update Purpose after archive.
## Requirements
### Requirement: V1 正式最小循环

V1 SHALL be the first formal minimal loop version of the project, not a Demo, and SHALL validate the loop "刷宝石 -> 看词缀 -> 调盘面 -> 技能表现变化 -> 再刷宝石".

#### Scenario: 完成刷宝闭环
- **WHEN** 玩家通过战斗获得宝石、拾取入库、查看词缀、调整 9x9 数独盘并重新进入战斗
- **THEN** 系统 SHALL 使用新盘面和宝石词缀重新计算技能最终效果，并在战斗中体现技能表现变化

#### Scenario: 禁止 V1 外系统
- **WHEN** V1 gem loop 规格、配置或 UI 被审查 outside the explicit `equipment-affix-generation` capability
- **THEN** 系统 SHALL NOT include 地图词缀、腐化系统、复杂货币系统、法力系统、力量 / 敏捷 / 智力成长系统、完整元素抗性系统、完整护甲 / 闪避 / 能量护盾系统、赛季系统、复杂技能树或多角色职业, while the explicit `equipment-affix-generation` capability MAY define and connect equipment affixes to the playable skill runtime

### Requirement: 模块边界

V1 SHALL define and preserve module boundaries for Core Foundation, Content Rule Data, Gem Board Runtime, Skill Runtime, Combat Runtime, Loot Runtime, Inventory / Storage, and Presentation UX.

#### Scenario: 模块职责清晰
- **WHEN** 后续实现任务被拆分
- **THEN** 每个任务 SHALL map to one or more of the eight V1 modules and SHALL respect the forbidden responsibilities documented in the design

#### Scenario: 运行时不承担内容规则
- **WHEN** Gem Board Runtime, Skill Runtime, Combat Runtime, Loot Runtime, Inventory / Storage, or Presentation UX needs content definitions
- **THEN** they SHALL consume validated Content Rule Data rather than embedding static content tables directly in runtime logic

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

### Requirement: 技能定义 Skill Package
V1 技能系统 SHALL 将主动技能定义从集中式 `skill_templates` 迁移为 Skill Package 结构，每个主动技能 SHALL 拥有独立目录和独立 `skill.yaml`。

#### Scenario: 主动技能独立 skill.yaml
- **WHEN** 主动技能定义被加载
- **THEN** 系统 SHALL 从 `configs/skills/active/<skill_id>/skill.yaml` 读取对应主动技能定义，并 SHALL NOT 依赖单一集中大表表达所有主动技能语义

#### Scenario: 火焰弹 package 路径
- **WHEN** 第一轮 Apply 加载火焰弹技能定义
- **THEN** 系统 SHALL 从 `configs/skills/active/active_fire_bolt/skill.yaml` 加载 `active_fire_bolt`

#### Scenario: 技能字段完整性
- **WHEN** `skill.yaml` 被校验
- **THEN** 技能定义 SHALL 至少声明 `id`、`version`、`display.name_key`、`display.description_key`、`classification.tags`、`classification.damage_type`、`classification.damage_form`、`cast.mode`、`cast.target_selector`、`cast.search_range`、`cast.cooldown_ms`、`cast.windup_ms`、`cast.recovery_ms`、`behavior.template`、`behavior.params`、`hit.base_damage`、`hit.can_crit`、`hit.can_apply_status`、`scaling.additive_stats`、`scaling.final_stats`、`scaling.runtime_params`、`presentation.vfx`、`presentation.sfx`、`presentation.floating_text`、`presentation.screen_feedback` 和 `preview.show_fields`

### Requirement: skill.schema.json 校验
V1 技能系统 SHALL 使用统一 `configs/skills/schema/skill.schema.json` 校验 Skill Package 定义。

#### Scenario: schema 校验技能定义
- **WHEN** 技能 package 被加载
- **THEN** 系统 SHALL 使用 `skill.schema.json` 校验 `skill.yaml` 的必需字段、枚举、类型、模板引用和参数边界

#### Scenario: schema 不执行技能行为
- **WHEN** `skill.schema.json` 校验 `behavior.params`
- **THEN** schema SHALL 只校验结构和允许字段，并 SHALL NOT 执行脚本、解释表达式或计算技能效果

#### Scenario: 玩家可见文本使用本地化 key
- **WHEN** 技能 package 声明名称、描述、浮字、原因或反馈文案
- **THEN** 技能 package SHALL 使用中文本地化 key，并 SHALL NOT 写入英文玩家可见文案

### Requirement: 白名单 Behavior Template
V1 技能行为 SHALL 只能通过白名单 Behavior Template 执行，技能 YAML SHALL NOT 包含任意脚本、复杂 DSL 或复杂表达式解释器。

#### Scenario: 只允许白名单模板
- **WHEN** 技能定义声明 `behavior.template`
- **THEN** 系统 SHALL 只接受 `projectile`、`fan_projectile`、`chain`、`player_nova`、`melee_arc`、`line_pierce`、`orbit` 或 `delayed_area`

#### Scenario: 模板参数受控
- **WHEN** 技能定义声明 `behavior.params`
- **THEN** 系统 SHALL 只接受对应 Behavior Template 白名单中定义的参数，并 MUST reject 任意脚本、函数调用、表达式字符串或未声明参数

#### Scenario: V1 主动技能模板映射
- **WHEN** 后续迁移 8 个主动技能
- **THEN** `active_fire_bolt` SHALL use `projectile`，`active_ice_shards` SHALL use `fan_projectile`，`active_lightning_chain` SHALL use `chain`，`active_frost_nova` SHALL use `player_nova`，`active_puncture` SHALL use `melee_arc`，`active_penetrating_shot` SHALL use `line_pierce`，`active_lava_orb` SHALL use `orbit`，`active_fungal_petards` SHALL use `delayed_area`

### Requirement: FinalSkillInstance 最终技能参数
V1 技能系统 SHALL 使用 `FinalSkillInstance` 承接主动宝石、被动、辅助、数独关系和 modifier 聚合后的最终技能参数。

#### Scenario: FinalSkillInstance 输入来源
- **WHEN** 主动技能进入 Skill Runtime
- **THEN** `FinalSkillInstance` SHALL 包含来自主动技能 package、主动宝石实例、被动贡献、辅助贡献、数独关系、additive modifier、final modifier 和 runtime 参数 modifier 的最终结果

#### Scenario: FinalSkillInstance 兼容三类宝石字段
- **WHEN** `FinalSkillInstance` 记录来源信息
- **THEN** 来源信息 SHALL 兼容 `gem_kind` / `sudoku_digit` 字段模型，并 SHALL NOT 从旧 `gem_type` 推断宝石大类或数独数字

#### Scenario: FinalSkillInstance 不执行行为
- **WHEN** `FinalSkillInstance` 被创建
- **THEN** 它 SHALL 表示最终参数和来源上下文，并 SHALL NOT 包含任意脚本或直接执行技能行为

### Requirement: SkillEvent 事件接口
V1 技能系统 SHALL 使用 `SkillEvent[]` 作为技能表现与伤害结算的事件接口，并作为 Runtime 和 WebApp 的共同语言。

#### Scenario: SkillEvent 类型覆盖
- **WHEN** Skill Runtime 输出技能事件
- **THEN** `SkillEvent` SHALL 至少预留 `cast_start`、`projectile_spawn`、`projectile_hit`、`chain_segment`、`area_spawn`、`melee_arc`、`orbit_spawn`、`orbit_tick`、`delayed_area_prime`、`delayed_area_explode`、`damage`、`hit_vfx`、`floating_text` 和 `cooldown_update`

#### Scenario: SkillEvent 字段覆盖
- **WHEN** 任一 `SkillEvent` 被序列化给 Combat Runtime 或 WebApp
- **THEN** 事件 SHALL 能表达 `source_entity`、`target_entity`、`position`、`direction`、`delay_ms`、`duration_ms`、`amount`、`damage_type`、`skill_instance_id`、`vfx_key`、`sfx_key` 和 `reason_key`

#### Scenario: damage 事件代表真实结算点
- **WHEN** 技能造成伤害
- **THEN** 伤害结算 SHALL 由 `damage` 事件表达，Combat Runtime SHALL NOT 在技能释放瞬间提前扣除需要等待命中的伤害

### Requirement: Combat Runtime 与 Skill Runtime 分层
V1 Combat Runtime SHALL 管理战斗流程和实体结算，Skill Runtime SHALL 根据 `FinalSkillInstance` 与白名单 Behavior Template 生成 `SkillEvent[]`。

#### Scenario: Combat Runtime 不写具体技能分支
- **WHEN** Combat Runtime 自动释放主动技能
- **THEN** Combat Runtime SHALL 调用 Skill Runtime 执行技能，并 SHALL NOT 编写 `active_fire_bolt`、`active_lightning_chain`、`active_frost_nova` 等具体技能分支

#### Scenario: Skill Runtime 生成事件
- **WHEN** Skill Runtime 执行 `FinalSkillInstance`
- **THEN** Skill Runtime SHALL 根据 `behavior.template` 调用白名单行为模板，并输出真实 `SkillEvent[]`

#### Scenario: 火焰弹伤害时机
- **WHEN** `active_fire_bolt` 使用 `projectile` 行为模板命中目标
- **THEN** `damage` 事件 SHALL 与投射物命中时机一致，并 SHALL NOT 在 `cast_start` 时提前结算

### Requirement: WebApp 消费 SkillEvent
V1 WebApp SHALL 消费 `SkillEvent[]` 渲染技能表现，并 SHALL NOT 根据 `behavior_type + visual_effect` 猜测技能行为。

#### Scenario: WebApp 渲染投射物
- **WHEN** WebApp 收到 `projectile_spawn` 事件
- **THEN** WebApp SHALL 根据事件中的位置、方向、持续时间、`skill_instance_id` 和 `vfx_key` 渲染投射物表现

#### Scenario: WebApp 渲染命中与浮字
- **WHEN** WebApp 收到 `damage`、`hit_vfx` 或 `floating_text` 事件
- **THEN** WebApp SHALL 根据事件中的目标、位置、数值、伤害类型、`vfx_key` 和 `reason_key` 渲染命中表现与中文浮字

#### Scenario: 前端不猜技能行为
- **WHEN** WebApp 需要展示技能表现
- **THEN** WebApp SHALL 使用 `SkillEvent[]`，并 SHALL NOT 通过 `behavior_type`、`visual_effect` 或技能 ID 在前端反推伤害时机、目标选择或技能路径

### Requirement: 火焰弹第一轮垂直切片
V1 第一轮 Apply SHALL 只实现 `active_fire_bolt` 的 Skill Package、schema、FinalSkillInstance、SkillEvent、Combat Runtime 和 WebApp 消费垂直切片。

#### Scenario: 火焰弹加载和校验
- **WHEN** 第一轮 Apply 验收火焰弹
- **THEN** `active_fire_bolt` SHALL 从 `configs/skills/active/active_fire_bolt/skill.yaml` 加载，并 SHALL 通过 `skill.schema.json` 校验

#### Scenario: 火焰弹生成最终实例
- **WHEN** 火焰弹主动宝石在有效盘面中进入战斗
- **THEN** 系统 SHALL 生成包含最终参数的 `FinalSkillInstance`

#### Scenario: 火焰弹输出事件
- **WHEN** 火焰弹释放并命中目标
- **THEN** 系统 SHALL 输出至少包含 `projectile_spawn`、`damage`、`hit_vfx` 和 `floating_text` 的 `SkillEvent[]`

#### Scenario: 其他 7 个技能保持旧行为
- **WHEN** 第一轮 Apply 完成
- **THEN** `active_ice_shards`、`active_lightning_chain`、`active_frost_nova`、`active_puncture`、`active_penetrating_shot`、`active_lava_orb` 和 `active_fungal_petards` SHALL 保持旧行为，并 SHALL NOT 被半迁移、禁用或破坏

#### Scenario: 火焰弹完整验收更新
- **WHEN** `active_fire_bolt` 垂直切片被标记为完整完成
- **THEN** SkillEditor SHALL 能打开它，Skill Test Arena SHALL 能运行它，AI 自测报告 SHALL 能基于真实测试结果评估它

### Requirement: SkillEditor V0
V1 WebApp SHALL provide a browser-openable SkillEditor V0 for Skill Package editing.

#### Scenario: 打开已迁移 Skill Package
- **WHEN** SkillEditor V0 打开技能列表
- **THEN** SkillEditor SHALL list migrated active skill packages from `configs/skills/active/` and SHALL allow opening at least `configs/skills/active/active_fire_bolt/skill.yaml`

#### Scenario: 主动技能全部从 Skill Package 打开
- **WHEN** SkillEditor V0 displays the existing 8 active skills
- **THEN** SkillEditor SHALL allow every active skill to open from its migrated Skill Package and SHALL NOT depend on old centralized skill template definitions

#### Scenario: 显示基础 package 信息
- **WHEN** SkillEditor V0 opens `active_fire_bolt`
- **THEN** SkillEditor SHALL display the Chinese skill name, `skill.yaml` path, `behavior.template`, and current schema validation status

#### Scenario: 只编辑 schema 允许字段
- **WHEN** SkillEditor saves a Skill Package
- **THEN** SkillEditor SHALL edit only fields allowed by `skill.schema.json` and the referenced behavior template whitelist

#### Scenario: 保存失败中文错误
- **WHEN** SkillEditor validation fails before saving
- **THEN** SkillEditor SHALL display Chinese error text and SHALL NOT write invalid skill data

#### Scenario: 禁止脚本和复杂表达式
- **WHEN** SkillEditor edits or saves a Skill Package
- **THEN** SkillEditor SHALL NOT write arbitrary scripts, expression DSL, complex expression interpreters, or script-like fields

### Requirement: SkillEditor 模块化字段
SkillEditor SHALL organize editable fields by modules, and each implemented `behavior_template` SHALL expose all editable fields for that template before a skill is considered migrated.

#### Scenario: 基础信息模块
- **WHEN** SkillEditor opens `active_fire_bolt`
- **THEN** SkillEditor SHALL expose an information module with read-only `id`, editable `version`, `display.name_key`, `display.description_key`, `classification.tags`, `classification.damage_type`, and `classification.damage_form`

#### Scenario: 释放参数模块
- **WHEN** SkillEditor opens `active_fire_bolt`
- **THEN** SkillEditor SHALL expose a cast module with `cast.mode`, `cast.target_selector`, `cast.search_range`, `cast.cooldown_ms`, `cast.windup_ms`, and `cast.recovery_ms`

#### Scenario: projectile 子弹模块
- **WHEN** SkillEditor opens a `projectile` behavior template
- **THEN** SkillEditor SHALL expose `projectile_count`, `projectile_speed`, `projectile_width`, `projectile_height`, `max_distance`, `hit_policy`, `pierce_count`, `collision_radius`, `spawn_offset`, and `travel_duration` or a read-only flight time derived from speed and distance

#### Scenario: 伤害点模块
- **WHEN** SkillEditor opens `active_fire_bolt`
- **THEN** SkillEditor SHALL expose `hit.base_damage`, `hit.can_crit`, `hit.can_apply_status`, `damage_type`, `damage_form`, `damage_timing`, `hit_delay_ms`, `hit_radius`, and `target_policy`

#### Scenario: 表现模块
- **WHEN** SkillEditor opens `active_fire_bolt`
- **THEN** SkillEditor SHALL expose `cast_vfx_key`, `projectile_vfx_key`, `hit_vfx_key`, `sfx_key`, `floating_text_style`, `hit_stop_ms`, and `camera_shake`

#### Scenario: 预览字段模块
- **WHEN** SkillEditor opens `active_fire_bolt`
- **THEN** SkillEditor SHALL expose `preview.show_fields`

#### Scenario: behavior template 字段支持是迁移前置条件
- **WHEN** a behavior template is implemented for migration
- **THEN** SkillEditor SHALL expose all editable fields for that template before any skill using it is considered migrated

### Requirement: Modifier 测试栈
SkillEditor SHALL allow selecting support gem effects or scaling modifiers for test-only modifier stacks.

#### Scenario: 读取可测试 modifier
- **WHEN** SkillEditor builds a test Modifier Stack
- **THEN** it SHALL read testable modifiers from current support gem configuration or `skill_scaling_rules`

#### Scenario: 选择多个测试 modifier
- **WHEN** a user configures a test run
- **THEN** SkillEditor SHALL allow selecting one or more test modifiers

#### Scenario: 模拟关系与 power 参数
- **WHEN** a test Modifier Stack is configured
- **THEN** SkillEditor SHALL allow simulated relation selection for adjacent, same row, same column, and same box, and SHALL allow setting `source_power`, `target_power`, and conduit test parameters

#### Scenario: 测试 modifier 不写真实数据
- **WHEN** a test Modifier Stack is applied
- **THEN** it SHALL affect only the test run and SHALL NOT write real gem instances, real Skill Package files, or production inventory data

#### Scenario: 不恢复随机词缀
- **WHEN** test modifiers are used
- **THEN** test modifier stacks SHALL NOT write random affixes, real gem instance affixes, random affix generated values, random affix UI sections, or random affix fields into real skill files

### Requirement: Skill Test Arena
V1 WebApp SHALL provide a dedicated skill test arena for controlled skill behavior verification.

#### Scenario: 受控测试场景
- **WHEN** Skill Test Arena is opened
- **THEN** it SHALL provide single dummy, three-target horizontal row, vertical queue, and dense small monster scenarios

#### Scenario: 测试场操作
- **WHEN** Skill Test Arena runs a test
- **THEN** it SHALL support selecting a skill, applying or disabling the test Modifier Stack, run, pause, single-step, reset, viewing monster life, viewing hit targets, viewing actual damage results, and viewing the SkillEvent timeline

#### Scenario: 第一版支持火焰弹
- **WHEN** Skill Test Arena first ships
- **THEN** it SHALL support at least `active_fire_bolt`

#### Scenario: 火焰弹测试时序
- **WHEN** Skill Test Arena runs `active_fire_bolt`
- **THEN** it SHALL generate `projectile_spawn`, SHALL NOT reduce life while the projectile is flying, SHALL generate `damage` after arrival, and SHALL generate `hit_vfx` and `floating_text` after or with `damage`

#### Scenario: 火焰弹测试数值变化
- **WHEN** projectile speed, base damage, or test Modifier Stack changes for `active_fire_bolt`
- **THEN** Skill Test Arena SHALL show changed flight time, changed damage, and changed `FinalSkillInstance` or SkillEvent values

### Requirement: SkillEvent 时间线查看器
SkillEditor and Skill Test Arena SHALL expose a timeline viewer for real SkillEvent sequences.

#### Scenario: 时间线事件类型
- **WHEN** a SkillEvent timeline is displayed
- **THEN** it SHALL show `cast_start`, `projectile_spawn`, `projectile_hit`, `damage`, `hit_vfx`, `floating_text`, and `cooldown_update` event types when present

#### Scenario: 时间线事件字段
- **WHEN** a SkillEvent is shown in the timeline
- **THEN** the timeline SHALL display `timestamp_ms`, `delay_ms`, `duration_ms`, `source_entity`, `target_entity`, `amount`, `damage_type`, `vfx_key`, `reason_key`, and `payload`

#### Scenario: 时间线来源真实
- **WHEN** the timeline is used for validation
- **THEN** it SHALL display actual SkillEvent data from a test or runtime execution and SHALL NOT use static fake events

### Requirement: AI 自测报告
System SHALL generate a Chinese self-test report from actual skill test results.

#### Scenario: 报告基于真实结果
- **WHEN** an AI self-test report is generated
- **THEN** the report SHALL be based on actual Skill Test Arena results, actual SkillEvent sequences, actual damage results, and actual hit targets

#### Scenario: 报告格式
- **WHEN** an AI self-test report is exported
- **THEN** it SHALL be Markdown or JSON, and all natural-language report text SHALL be Chinese

#### Scenario: 报告内容
- **WHEN** an AI self-test report is generated
- **THEN** it SHALL include test skill ID, Chinese skill name, `skill.yaml` path, `behavior_template`, test scenario, test Modifier Stack, expected player-facing description, actual SkillEvent sequence, actual damage result, actual hit targets, presentation event completeness, whether damage timing matches presentation, whether actual behavior matches description, inconsistencies, and suggested fixes

#### Scenario: 对比期望与实际
- **WHEN** report evaluation runs
- **THEN** it SHALL compare the expected player-facing description with actual SkillEvent and damage outcomes

### Requirement: 技能系统与三类宝石字段兼容
V1 技能系统重构 SHALL 兼容三类宝石字段模型，并 SHALL NOT 破坏 `refactor-three-gem-kinds-v1-phase2` 的 active / passive / support 宝石重构方向。

#### Scenario: Apply 前确认字段模型
- **WHEN** 技能系统重构进入 Apply 阶段
- **THEN** 实现 SHALL 先确认 `gem_kind` / `sudoku_digit` 字段模型状态，并 SHALL 在三类宝石字段迁移完成后进行，或至少兼容该字段模型

#### Scenario: 不覆盖既有 active change
- **WHEN** `refactor-three-gem-kinds-v1-phase2` 仍为 active change
- **THEN** 本 change SHALL NOT 修改该 change 的 artifacts，也 SHALL NOT 设计成覆盖其字段迁移结果

### Requirement: 技能系统玩家可见文本中文
V1 技能系统 SHALL 保持所有玩家可见文本为中文。

#### Scenario: 技能 package 玩家文本
- **WHEN** 技能 package、presentation key、浮字或屏幕反馈被展示给玩家
- **THEN** 玩家可见文本 SHALL 来自中文本地化内容，并 SHALL NOT 引入英文玩家可见文案

#### Scenario: WebApp 事件反馈中文
- **WHEN** WebApp 渲染 SkillEvent 产生的 HUD、浮字、命中特效说明、冷却反馈或错误提示
- **THEN** 所有玩家可见文本 SHALL 使用中文

### Requirement: 冰棱散射 Skill Package
V1 SHALL migrate `active_ice_shards` / `冰棱散射` from the old centralized skill template path into an active Skill Package after the `active_fire_bolt` vertical slice is complete.

#### Scenario: 从 active Skill Package 加载冰棱散射
- **WHEN** `active_ice_shards` is considered migrated
- **THEN** the system SHALL load it from `configs/skills/active/active_ice_shards/skill.yaml`

#### Scenario: 使用 fan_projectile 行为模板
- **WHEN** the migrated `active_ice_shards` Skill Package is validated
- **THEN** it SHALL declare `behavior.template = fan_projectile`

#### Scenario: 保持中文玩家可见文本
- **WHEN** `active_ice_shards` name, description, hit reason, floating text, VFX feedback, or screen feedback is shown to the player
- **THEN** the player-visible text SHALL be Chinese and SHALL come from localization keys rather than embedded English text

#### Scenario: 不迁移其他主动技能
- **WHEN** this migration is applied
- **THEN** `active_lightning_chain`, `active_frost_nova`, `active_puncture`, `active_penetrating_shot`, `active_lava_orb`, and `active_fungal_petards` SHALL remain on their existing behavior paths unless a later change migrates them explicitly

### Requirement: fan_projectile Behavior Template
V1 SHALL provide a whitelisted `fan_projectile` Behavior Template for deterministic fan-shaped multi-projectile skills.

#### Scenario: 生成扇形多投射 SkillEvent
- **WHEN** Skill Runtime executes a skill using `fan_projectile`
- **THEN** it SHALL generate multiple projectile SkillEvents spread across a fan based on target direction, projectile count, spread angle, angle step, speed, distance, spawn pattern, and hit policy

#### Scenario: 声明 fan_projectile 参数白名单
- **WHEN** `configs/skills/behavior_templates/fan_projectile.yaml` is validated
- **THEN** it SHALL declare allowed params including `projectile_count`, `projectile_speed`, `projectile_width`, `projectile_height`, `spread_angle`, `angle_step`, `max_distance`, `hit_policy`, `collision_radius`, `spawn_pattern`, and `per_projectile_damage_scale`

#### Scenario: 禁止脚本和未声明参数
- **WHEN** a Skill Package declares `behavior.template = fan_projectile`
- **THEN** validation SHALL reject scripts, expression DSL fields, complex expression interpreter fields, function-call strings, and any params not declared by the `fan_projectile` template

### Requirement: SkillEditor fan_projectile 字段支持
SkillEditor SHALL expose and validate every editable `fan_projectile` field before any skill using `fan_projectile` is considered migrated.

#### Scenario: 暴露 fan_projectile 子弹模块字段
- **WHEN** SkillEditor opens a Skill Package whose `behavior.template` is `fan_projectile`
- **THEN** it SHALL expose editable fields for `projectile_count`, `projectile_speed`, `projectile_width`, `projectile_height`, `spread_angle`, `angle_step`, `max_distance`, `hit_policy`, `collision_radius`, `spawn_pattern`, and `per_projectile_damage_scale`, plus a read-only flight time or per-projectile flight time summary

#### Scenario: 使用 schema 和模板白名单校验
- **WHEN** SkillEditor edits or saves a `fan_projectile` Skill Package
- **THEN** it SHALL validate values through both the skill schema and behavior template whitelist and SHALL NOT write fields that the template does not declare

#### Scenario: 校验 fan_projectile 数值和枚举
- **WHEN** SkillEditor validates `fan_projectile` params
- **THEN** `projectile_count` SHALL be a positive integer, `spread_angle` and `angle_step` SHALL respect declared ranges, `projectile_speed`, `projectile_width`, `projectile_height`, `max_distance`, and `collision_radius` SHALL be legal positive numbers, `hit_policy` and `spawn_pattern` SHALL use declared enum values, and `per_projectile_damage_scale` SHALL respect its declared numeric range

### Requirement: 冰棱散射 SkillEvent
`active_ice_shards` SHALL express projectile generation, hit, damage, and presentation through real SkillEvents.

#### Scenario: 输出多条 projectile_spawn
- **WHEN** migrated `active_ice_shards` is cast with `projectile_count` greater than one
- **THEN** Skill Runtime SHALL output one `projectile_spawn` event per generated ice shard with independent direction data

#### Scenario: 命中后输出结算和表现事件
- **WHEN** an ice shard hits a target according to real collision or hit policy resolution
- **THEN** Skill Runtime SHALL output `projectile_hit`, `damage`, `hit_vfx`, and `floating_text` events for that hit

#### Scenario: damage 事件负责扣血
- **WHEN** `active_ice_shards` is cast
- **THEN** target life SHALL NOT be reduced at release time, and life reduction SHALL be caused by `damage` events after projectile travel and hit timing

#### Scenario: 冰霜伤害类型
- **WHEN** `active_ice_shards` emits a `damage` event
- **THEN** the event SHALL declare `damage_type = cold`

### Requirement: 冰棱散射测试场验收
Skill Test Arena SHALL validate migrated `active_ice_shards` through controlled scenarios that prove fan-shaped multi-projectile behavior.

#### Scenario: 三目标横排验证扇形多投射
- **WHEN** Skill Test Arena runs migrated `active_ice_shards` in the three-target horizontal row scenario
- **THEN** it SHALL verify multiple ice shard spawns, visible fan angle distribution, real hit targets, and damage only after projectile hit timing

#### Scenario: 密集小怪验证多目标覆盖
- **WHEN** Skill Test Arena runs migrated `active_ice_shards` in the dense small monster scenario
- **THEN** it SHALL verify that hit targets come from real projectile collision or hit policy resolution and that multiple projectiles can affect the result

#### Scenario: 单体木桩验证基础伤害时序
- **WHEN** Skill Test Arena runs migrated `active_ice_shards` against a single dummy
- **THEN** it SHALL verify no life is reduced during projectile flight and life is reduced only after `projectile_hit` and `damage`

#### Scenario: 参数修改影响实际事件
- **WHEN** SkillEditor or the arena test stack changes `projectile_count`, `spread_angle`, or `projectile_speed`
- **THEN** Skill Test Arena SHALL show changed projectile event count, changed fan direction distribution, or changed flight time respectively

#### Scenario: Modifier 测试栈影响结果
- **WHEN** Skill Test Arena runs `active_ice_shards` with a test Modifier Stack
- **THEN** the stack SHALL affect final damage or projectile runtime parameters used by actual SkillEvents without writing real inventory, gem instance, or Skill Package data

### Requirement: 冰棱散射 AI 自测报告
The AI self-test report SHALL evaluate migrated `active_ice_shards` against real Skill Test Arena results and the expected Chinese player-facing behavior.

#### Scenario: 基于真实结果判断玩家侧描述
- **WHEN** an AI self-test report is generated for migrated `active_ice_shards`
- **THEN** it SHALL compare actual SkillEvent sequences, damage results, hit targets, and presentation events against the expected description "自动向最近敌人方向射出多枚冰霜冰棱，冰棱以扇形展开飞行，命中后造成冰霜伤害，并显示冰霜命中特效与伤害浮字。"

#### Scenario: 检查关键事件和时序
- **WHEN** the report evaluates `active_ice_shards`
- **THEN** it SHALL check whether multiple `projectile_spawn` events exist, projectile directions form a fan, `projectile_hit` exists, `damage` exists, `hit_vfx` exists, `floating_text` exists, `damage` is not earlier than `projectile_spawn`, no life is reduced during projectile flight, and `damage_type` is `cold`

#### Scenario: 检查参数修改效果
- **WHEN** the report compares baseline and modified arena runs
- **THEN** it SHALL check whether changing `projectile_count` changes projectile event count and whether changing `spread_angle` changes projectile directions

#### Scenario: 输出中文结论和修复建议
- **WHEN** the report finishes evaluation
- **THEN** it SHALL output a conclusion of `通过`, `部分通过`, or `不通过`, plus Chinese inconsistency items and suggested fixes

### Requirement: 冰霜新星 Skill Package
V1 SHALL migrate `active_frost_nova` / `冰霜新星` from the old centralized skill template path into an active Skill Package.

#### Scenario: 从 active Skill Package 加载冰霜新星
- **WHEN** `active_frost_nova` is considered migrated
- **THEN** the system SHALL load it from `configs/skills/active/active_frost_nova/skill.yaml`

#### Scenario: 使用 player_nova 行为模板
- **WHEN** the migrated `active_frost_nova` Skill Package is validated
- **THEN** it SHALL declare `behavior.template = player_nova`

#### Scenario: 保持中文玩家可见文本
- **WHEN** `active_frost_nova` name, description, damage reason, floating text, VFX feedback, or screen feedback is shown to the player
- **THEN** the player-visible text SHALL be Chinese and SHALL come from localization keys rather than embedded English text

#### Scenario: 不迁移其他主动技能
- **WHEN** this migration is applied
- **THEN** `active_lightning_chain`, `active_puncture`, `active_lava_orb`, and `active_fungal_petards` SHALL remain on their existing behavior paths unless a later change migrates them explicitly

### Requirement: player_nova Behavior Template
V1 SHALL provide a whitelisted `player_nova` Behavior Template for deterministic player-centered expanding nova skills.

#### Scenario: 以玩家为中心生成范围新星 SkillEvent
- **WHEN** Skill Runtime executes a skill using `player_nova`
- **THEN** it SHALL generate an `area_spawn` SkillEvent centered on the player or cast source position using declared radius, ring width, expansion duration, hit timing, target cap, damage falloff, and presentation params

#### Scenario: 声明 player_nova 参数白名单
- **WHEN** `configs/skills/behavior_templates/player_nova.yaml` is validated
- **THEN** it SHALL declare allowed params including `radius`, `expand_duration_ms`, `hit_at_ms`, `max_targets`, `center_policy`, `damage_falloff_by_distance`, `ring_width`, and `status_chance_scale`

#### Scenario: 校验 player_nova 参数约束
- **WHEN** a Skill Package declares `behavior.template = player_nova`
- **THEN** validation SHALL require positive `radius`, non-negative `expand_duration_ms`, non-negative `hit_at_ms`, `hit_at_ms` not greater than `expand_duration_ms`, positive integer or explicitly declared unlimited `max_targets`, `center_policy = player_center`, legal `damage_falloff_by_distance`, positive `ring_width`, and ranged `status_chance_scale`

#### Scenario: 禁止脚本和未声明参数
- **WHEN** a Skill Package declares `behavior.template = player_nova`
- **THEN** validation SHALL reject scripts, expression DSL fields, complex expression interpreter fields, function-call strings, frontend-only fake params, and any params not declared by the `player_nova` template

### Requirement: SkillEditor player_nova 字段支持
SkillEditor SHALL expose and validate every editable `player_nova` field before `active_frost_nova` is considered migrated.

#### Scenario: 暴露 player_nova 范围新星模块字段
- **WHEN** SkillEditor opens a Skill Package whose `behavior.template` is `player_nova`
- **THEN** it SHALL expose editable fields for `radius`, `expand_duration_ms`, `hit_at_ms`, `max_targets`, `center_policy`, `damage_falloff_by_distance`, `ring_width`, and `status_chance_scale`, plus read-only range summary and hit timing summary

#### Scenario: 使用枚举和范围校验
- **WHEN** SkillEditor edits or saves a `player_nova` Skill Package
- **THEN** `center_policy` SHALL use an enum limited to player center in the first version, `radius`, `expand_duration_ms`, `hit_at_ms`, `ring_width`, and `status_chance_scale` SHALL use declared range validation, and `max_targets` SHALL use integer validation or an explicitly declared unlimited enum

#### Scenario: 使用 schema 和模板白名单校验
- **WHEN** SkillEditor saves a `player_nova` Skill Package
- **THEN** it SHALL validate through both the skill schema and behavior template whitelist and SHALL NOT write undeclared fields or frontend-only fake params

#### Scenario: 输出中文校验错误
- **WHEN** SkillEditor rejects invalid `player_nova` values such as `hit_at_ms > expand_duration_ms`, invalid enum values, or invalid numeric ranges
- **THEN** it SHALL display Chinese error text and SHALL NOT write invalid skill data

### Requirement: 冰霜新星 SkillEvent
`active_frost_nova` SHALL express area generation, hit timing, damage, and presentation through real SkillEvents.

#### Scenario: 输出 area_spawn
- **WHEN** migrated `active_frost_nova` is cast
- **THEN** Skill Runtime SHALL output an `area_spawn` event centered on the player or cast source position with radius, ring width, duration, hit timing, damage type, VFX key, and payload data

#### Scenario: 按玩家中心半径判断命中
- **WHEN** `active_frost_nova` resolves targets
- **THEN** targets inside the player-centered radius SHALL be eligible for hit and targets outside the radius SHALL NOT be hit

#### Scenario: damage 事件负责扣血
- **WHEN** `active_frost_nova` is cast
- **THEN** target life SHALL NOT be reduced at release time or before `hit_at_ms`, and life reduction SHALL be caused by `damage` events at or after `hit_at_ms`

#### Scenario: 输出伤害和表现事件
- **WHEN** an in-range target is hit by `active_frost_nova`
- **THEN** Skill Runtime SHALL output `damage`, `hit_vfx`, and `floating_text` events for that target after or with the hit timing

#### Scenario: 冰霜伤害类型
- **WHEN** `active_frost_nova` emits a `damage` event
- **THEN** the event SHALL declare `damage_type = cold`

#### Scenario: 禁止目标点爆炸和静态假事件
- **WHEN** Skill Runtime executes `active_frost_nova`
- **THEN** it SHALL NOT use target-point explosion semantics, static fake events, or a Combat Runtime branch specific to `active_frost_nova`

### Requirement: 冰霜新星测试场验收
Skill Test Arena SHALL validate migrated `active_frost_nova` through controlled scenarios that prove player-centered area behavior.

#### Scenario: 密集小怪验证范围多目标命中
- **WHEN** Skill Test Arena runs migrated `active_frost_nova` in the dense small monster scenario
- **THEN** it SHALL verify the nova is centered on the player, multiple in-range enemies can be hit, and out-of-range enemies are not hit

#### Scenario: 单体木桩验证伤害时序
- **WHEN** Skill Test Arena runs migrated `active_frost_nova` against a single dummy
- **THEN** it SHALL verify no life is reduced before `hit_at_ms` and life is reduced only by `damage` events at or after `hit_at_ms`

#### Scenario: 三目标横排验证范围边界
- **WHEN** Skill Test Arena runs migrated `active_frost_nova` in the three-target horizontal row scenario
- **THEN** it SHALL verify that targets inside the configured radius are hit and targets outside the configured radius are not hit

#### Scenario: 参数修改影响真实测试结果
- **WHEN** SkillEditor or the arena test stack changes `radius`, `expand_duration_ms`, or `hit_at_ms`
- **THEN** Skill Test Arena SHALL show changed target coverage, changed presentation timing, or changed damage timing respectively

#### Scenario: Modifier 测试栈影响结果
- **WHEN** Skill Test Arena runs `active_frost_nova` with a test Modifier Stack
- **THEN** the stack SHALL affect final damage or range runtime parameters used by actual SkillEvents without writing real inventory, gem instance, or Skill Package data

### Requirement: 冰霜新星 AI 自测报告
The AI self-test report SHALL evaluate migrated `active_frost_nova` against real Skill Test Arena results and the expected Chinese player-facing behavior.

#### Scenario: 基于真实结果判断玩家侧描述
- **WHEN** an AI self-test report is generated for migrated `active_frost_nova`
- **THEN** it SHALL compare actual SkillEvent sequences, damage results, hit targets, and presentation events against the expected description "自动以玩家自身为中心释放一圈向外扩散的冰霜新星，命中范围内敌人后造成冰霜伤害，并显示冰霜范围爆发特效与伤害浮字。"

#### Scenario: 检查 area_spawn 和玩家中心
- **WHEN** the report evaluates `active_frost_nova`
- **THEN** it SHALL check whether `area_spawn` exists and whether its center is the player or cast source position

#### Scenario: 检查关键事件和时序
- **WHEN** the report evaluates `active_frost_nova`
- **THEN** it SHALL check whether `damage`, `hit_vfx`, and `floating_text` exist, whether `damage` is not earlier than `hit_at_ms`, whether no life is reduced before `hit_at_ms`, and whether `damage_type` is `cold`

#### Scenario: 检查范围命中规则
- **WHEN** the report evaluates `active_frost_nova`
- **THEN** it SHALL check whether in-range targets are hit, out-of-range targets are not hit, and changing `radius` changes hit target coverage

#### Scenario: 输出中文结论和修复建议
- **WHEN** the report finishes evaluation
- **THEN** it SHALL output a conclusion of `通过`, `部分通过`, or `不通过`, plus Chinese inconsistency items and suggested fixes

### Requirement: Damage Zone Behavior Template
V1 SHALL provide a declarative `damage_zone` behavior template for non-projectile damage settlement areas / hit zones.

#### Scenario: Declare supported damage zone shapes
- **WHEN** `configs/skills/behavior_templates/damage_zone.yaml` is validated
- **THEN** it SHALL declare supported shapes including `circle` and `rectangle`

#### Scenario: Reject scripts and undeclared params
- **WHEN** a Skill Package declares `behavior.template = damage_zone`
- **THEN** validation SHALL reject scripts, expression DSL fields, complex expression interpreter fields, function-call strings, frontend-only fake params, and params not declared by the `damage_zone` template

#### Scenario: Validate common damage zone params
- **WHEN** a Skill Package declares `behavior.template = damage_zone`
- **THEN** validation SHALL require legal `shape`, `origin_policy`, `facing_policy`, non-negative `hit_at_ms`, positive integer or explicitly declared unlimited `max_targets`, legal `status_chance_scale`, and key-only `zone_vfx_key`

#### Scenario: Validate circle params
- **WHEN** a `damage_zone` Skill Package declares `shape = circle`
- **THEN** validation SHALL require positive `radius` and SHALL treat the effective angle as 360 degrees

#### Scenario: Validate rectangle params
- **WHEN** a `damage_zone` Skill Package declares `shape = rectangle`
- **THEN** validation SHALL require positive `length`, positive `width`, and legal `angle_offset_deg` or equivalent declared angle field

### Requirement: Frost Nova Damage Zone
V1 SHALL represent `active_frost_nova` / `冰霜新星` as a circular `damage_zone`.

#### Scenario: Load frost nova as circle damage zone
- **WHEN** `active_frost_nova` Skill Package is loaded
- **THEN** it SHALL declare `behavior.template = damage_zone` and `shape = circle`

#### Scenario: Frost nova keeps circular hit semantics
- **WHEN** Skill Runtime executes `active_frost_nova`
- **THEN** targets inside the configured circle radius SHALL be eligible for damage and targets outside the radius SHALL NOT be hit

#### Scenario: Frost nova timing remains event based
- **WHEN** Skill Runtime executes `active_frost_nova`
- **THEN** target life SHALL NOT be reduced before `hit_at_ms`, and life reduction SHALL occur through `damage` events at or after `hit_at_ms`

#### Scenario: Frost nova keeps Chinese player-facing text
- **WHEN** `active_frost_nova` name, description, damage reason, VFX feedback, or floating text is shown
- **THEN** the player-visible text SHALL remain Chinese and SHALL come from localization keys

### Requirement: Ground Spike Damage Zone
V1 SHALL rework `active_puncture` / `穿刺` into player-facing `地刺`, represented as a rectangular `damage_zone`.

#### Scenario: Load ground spike as rectangle damage zone
- **WHEN** `active_puncture` Skill Package is loaded after this change
- **THEN** it SHALL declare `behavior.template = damage_zone`, `shape = rectangle`, and `classification.damage_type = physical`

#### Scenario: Show ground spike Chinese text
- **WHEN** the skill name, description, damage reason, VFX feedback, or floating text for `active_puncture` is shown
- **THEN** the player-visible Chinese text SHALL describe `地刺` rather than a melee slash or ranged instant puncture

#### Scenario: Fire a rectangular spike line toward target direction
- **WHEN** Skill Runtime executes the ground spike skill
- **THEN** it SHALL create a rectangular damage zone from the player or cast source position toward the locked target direction, or nearest target direction when no explicit locked target is available

#### Scenario: Ground spike rectangle hit testing
- **WHEN** ground spike resolves targets
- **THEN** targets inside the rectangle defined by origin, facing direction, `length`, `width`, and angle offset SHALL be eligible for hit, while targets beyond length or outside width SHALL NOT be hit

#### Scenario: Ground spike timing and damage events
- **WHEN** ground spike is cast
- **THEN** target life SHALL NOT be reduced at release time or before `hit_at_ms`, and life reduction SHALL occur through `damage` events at or after `hit_at_ms`

#### Scenario: Ground spike physical presentation events
- **WHEN** a target is hit by ground spike
- **THEN** Skill Runtime SHALL output `damage`, `hit_vfx`, and `floating_text` events with `damage_type = physical`

### Requirement: Damage Zone SkillEvent
V1 SHALL express circular and rectangular hit zones through real `damage_zone` SkillEvents.

#### Scenario: Emit damage zone event
- **WHEN** Skill Runtime executes a skill using `damage_zone`
- **THEN** it SHALL emit a `damage_zone` event containing `shape`, `origin`, `origin_world_position`, `facing_policy`, `facing_direction`, `facing_angle_deg`, `hit_at_ms`, `max_targets`, `damage_type`, `vfx_key`, and payload data

#### Scenario: Include circle geometry
- **WHEN** the emitted `damage_zone` event has `shape = circle`
- **THEN** its payload SHALL include `radius` and effective angle information of 360 degrees

#### Scenario: Include rectangle geometry
- **WHEN** the emitted `damage_zone` event has `shape = rectangle`
- **THEN** its payload SHALL include `length`, `width`, angle offset or equivalent angle field, and the runtime facing direction

#### Scenario: Timeline displays damage zone events
- **WHEN** SkillEvent timeline displays a damage zone skill run
- **THEN** it SHALL show `cast_start`, `damage_zone`, `damage`, `hit_vfx`, `floating_text`, and `cooldown_update` when present

#### Scenario: Timeline event fields
- **WHEN** SkillEvent timeline displays a `damage_zone` related event
- **THEN** it SHALL include `timestamp_ms`, `delay_ms`, `duration_ms`, `source_entity`, `target_entity`, `amount`, `damage_type`, `vfx_key`, `reason_key`, and `payload`

### Requirement: SkillEditor Damage Zone Module
SkillEditor SHALL expose one shared damage zone module for skills whose `behavior.template` is `damage_zone`.

#### Scenario: Show common damage zone fields
- **WHEN** SkillEditor opens a `damage_zone` Skill Package
- **THEN** it SHALL expose editable common fields for zone shape, origin policy, facing policy, hit timing, max targets, status chance scale, and VFX key

#### Scenario: Show circle fields
- **WHEN** SkillEditor edits a `damage_zone` package with `shape = circle`
- **THEN** it SHALL show `radius` and SHALL hide angle or show it read-only as 360 degrees

#### Scenario: Show rectangle fields
- **WHEN** SkillEditor edits a `damage_zone` package with `shape = rectangle`
- **THEN** it SHALL show `length`, `width`, and angle offset or equivalent angle field

#### Scenario: Save only whitelisted fields
- **WHEN** SkillEditor saves a `damage_zone` Skill Package
- **THEN** it SHALL validate through the skill schema and behavior-template whitelist and SHALL NOT write undeclared fields or frontend-only fake params

#### Scenario: Chinese validation errors
- **WHEN** SkillEditor rejects invalid `damage_zone` values
- **THEN** it SHALL display Chinese error text and SHALL NOT persist invalid skill data

### Requirement: WebApp Damage Zone Consumption
WebApp SHALL render damage zone visuals from `damage_zone` SkillEvent payloads.

#### Scenario: Render circle damage zone from event
- **WHEN** WebApp receives a `damage_zone` event with `shape = circle`
- **THEN** it SHALL render a circular damage zone using event-provided origin, radius, timing, and VFX key

#### Scenario: Render rectangle damage zone from event
- **WHEN** WebApp receives a `damage_zone` event with `shape = rectangle`
- **THEN** it SHALL render a rectangular ground spike line using event-provided origin, facing direction, length, width, angle, timing, and VFX key

#### Scenario: Do not guess damage zone behavior
- **WHEN** WebApp renders frost nova or ground spike
- **THEN** it SHALL NOT infer behavior from skill id, legacy skill template id, behavior type, visual effect name, or VFX key

#### Scenario: Render presentation events from events
- **WHEN** WebApp receives `damage`, `hit_vfx`, or `floating_text`
- **THEN** it SHALL render damage, hit effects, and floating text from those events rather than from static fake events

### Requirement: Damage Zone Test Arena Acceptance
Skill Test Arena SHALL validate both circular frost nova and rectangular ground spike using real SkillEvents.

#### Scenario: Validate circle radius behavior
- **WHEN** Skill Test Arena runs `active_frost_nova`
- **THEN** it SHALL verify circular in-radius targets are hit, out-of-radius targets are not hit, and changing `radius` changes hit coverage

#### Scenario: Validate rectangle length behavior
- **WHEN** Skill Test Arena runs ground spike
- **THEN** it SHALL verify targets within rectangle length are hit, targets beyond length are not hit, and changing `length` changes hit coverage

#### Scenario: Validate rectangle width behavior
- **WHEN** Skill Test Arena runs ground spike
- **THEN** it SHALL verify targets within rectangle width are hit, targets outside width are not hit, and changing `width` changes lateral hit coverage

#### Scenario: Validate rectangle angle behavior
- **WHEN** Skill Test Arena runs ground spike
- **THEN** it SHALL verify changing angle offset or equivalent angle field changes the rectangle hit direction

#### Scenario: Validate damage timing
- **WHEN** Skill Test Arena observes a `damage_zone` skill before `hit_at_ms`
- **THEN** it SHALL verify target life is unchanged until `damage` events occur at or after `hit_at_ms`

#### Scenario: Validate modifier stack effect
- **WHEN** Skill Test Arena runs a `damage_zone` skill with the test Modifier Stack
- **THEN** the stack SHALL affect final damage, zone geometry, or status chance runtime parameters used by actual SkillEvents without writing production inventory, gem instances, or Skill Package data

### Requirement: Damage Zone AI Self-Test Report
The AI self-test report SHALL evaluate `damage_zone` skills from real Skill Test Arena results.

#### Scenario: Report frost nova circle checks
- **WHEN** an AI self-test report is generated for `active_frost_nova`
- **THEN** it SHALL check for `damage_zone`, `shape = circle`, circle origin, radius hit coverage, damage timing, cold damage, hit VFX, floating text, and radius parameter effects

#### Scenario: Report ground spike rectangle checks
- **WHEN** an AI self-test report is generated for ground spike
- **THEN** it SHALL check for `damage_zone`, `shape = rectangle`, origin, facing toward locked or nearest target, length/width/angle hit coverage, damage timing, physical damage, hit VFX, floating text, and geometry parameter effects

#### Scenario: Report Chinese conclusion and fixes
- **WHEN** a `damage_zone` AI self-test report finishes evaluation
- **THEN** it SHALL output a conclusion of `通过`, `部分通过`, or `不通过`, plus Chinese inconsistency items and suggested fixes

### Requirement: Projectile Body VFX Stays Visible Until Runtime Destroy
WebApp projectile presentation SHALL keep projectile body VFX visible while the runtime projectile is alive, loop the in-flight body frames during that lifetime, and fade the body only after the runtime projectile reaches hit-driven destruction or max-distance expiry.

#### Scenario: Long flight keeps projectile body visible
- **WHEN** WebApp renders a `projectile_spawn` event whose runtime lifetime is longer than the projectile body sprite sheet duration
- **THEN** the projectile body VFX SHALL remain visible during the runtime lifetime and SHALL loop its in-flight frames instead of fading out across the full flight

#### Scenario: Projectile body follows runtime position during flight
- **WHEN** a projectile body VFX is rendered before the runtime lifetime has ended
- **THEN** its current visual position SHALL be derived from the runtime spawn position, direction, velocity or end position, and event lifetime data from the `projectile_spawn` event

#### Scenario: Projectile body fades only after runtime expiry
- **WHEN** the runtime projectile reaches the expiry time or end position supplied by the `projectile_spawn` event
- **THEN** the projectile body VFX SHALL enter a short visual fade-out phase and SHALL NOT start that fade earlier during normal flight

#### Scenario: Hit impact remains event driven
- **WHEN** a projectile hits a target and Skill Runtime emits `projectile_hit` and `hit_vfx` events
- **THEN** WebApp SHALL render impact VFX from the `hit_vfx` event and SHALL NOT infer or trigger impact VFX from the projectile body fade transition

#### Scenario: Projectile logic and combat values are unchanged
- **WHEN** this presentation behavior is applied
- **THEN** projectile speed, max distance, collision, pierce, target selection, damage, cooldown, skill YAML values, and runtime hit rules SHALL remain unchanged

#### Scenario: Multi-projectile bodies fade independently
- **WHEN** a skill emits multiple `projectile_spawn` events for a fan or burst projectile skill
- **THEN** each projectile body VFX SHALL loop, remain visible, reach expiry, and fade independently according to its own runtime event identity and lifetime data

### Requirement: Lightning Chain Skill Package
V1 SHALL migrate `active_lightning_chain / 连锁闪电` from the old skill template path into a Skill Package.

#### Scenario: Load lightning chain Skill Package
- **WHEN** `active_lightning_chain` is migrated
- **THEN** the system SHALL load it from `configs/skills/active/active_lightning_chain/skill.yaml`

#### Scenario: Use chain behavior template
- **WHEN** the `active_lightning_chain` Skill Package is loaded
- **THEN** it SHALL declare `behavior.template = chain`

#### Scenario: Use lightning damage type
- **WHEN** the `active_lightning_chain` Skill Package is validated
- **THEN** it SHALL declare `classification.damage_type = lightning`

#### Scenario: Keep Chinese player-facing text
- **WHEN** `active_lightning_chain` name, description, damage reason, VFX feedback, screen feedback, or floating text is shown
- **THEN** the player-visible text SHALL be Chinese and SHALL come from localization keys

#### Scenario: Do not migrate other active skills
- **WHEN** this change is applied
- **THEN** it SHALL NOT create Skill Packages for `active_lava_orb`, `active_fungal_petards`, or any other active skill outside this change

### Requirement: Chain Behavior Template
V1 SHALL provide a declarative `chain` behavior template for real multi-target lightning jumps.

#### Scenario: Declare chain template fields
- **WHEN** `configs/skills/behavior_templates/chain.yaml` is validated
- **THEN** it SHALL declare a whitelist including `chain_count`, `chain_radius`, `chain_delay_ms`, `damage_falloff_per_chain`, `target_policy`, `allow_repeat_target`, `max_targets`, and `segment_vfx_key`

#### Scenario: Validate numeric chain fields
- **WHEN** a Skill Package declares `behavior.template = chain`
- **THEN** validation SHALL require positive integer `chain_count`, positive `chain_radius`, non-negative `chain_delay_ms`, and legal numeric-range `damage_falloff_per_chain`

#### Scenario: Validate target selection fields
- **WHEN** a Skill Package declares `behavior.template = chain`
- **THEN** validation SHALL require enum `target_policy` with first-version support for `nearest_not_hit`, boolean `allow_repeat_target` defaulting to `false`, and positive integer or explicitly declared `unlimited` `max_targets`

#### Scenario: Validate key-only segment VFX
- **WHEN** a Skill Package declares `segment_vfx_key`
- **THEN** validation SHALL treat it as a key-only field and SHALL NOT use it as player-visible text

#### Scenario: Reject undeclared chain params
- **WHEN** a Skill Package declares `behavior.template = chain`
- **THEN** validation SHALL reject scripts, expression DSL fields, complex expression interpreter fields, function-call strings, frontend-only fake params, and params not declared by the `chain` template

#### Scenario: Generate real chain segments
- **WHEN** Skill Runtime executes a `chain` skill
- **THEN** it SHALL generate one or more `chain_segment` SkillEvents from the initial target through subsequent chained targets according to `chain_count`, `chain_radius`, `target_policy`, `allow_repeat_target`, and `max_targets`

### Requirement: SkillEditor Chain Field Support
SkillEditor SHALL expose a dedicated `chain` module before the lightning chain migration is considered complete.

#### Scenario: Show all editable chain fields
- **WHEN** SkillEditor opens a Skill Package whose `behavior.template = chain`
- **THEN** it SHALL expose editable fields for `chain_count`, `chain_radius`, `chain_delay_ms`, `damage_falloff_per_chain`, `target_policy`, `allow_repeat_target`, `max_targets`, and `segment_vfx_key`

#### Scenario: Show read-only chain summaries
- **WHEN** SkillEditor opens a Skill Package whose `behavior.template = chain`
- **THEN** it SHALL show a read-only maximum chain segment summary and a read-only estimated total chain duration summary

#### Scenario: Validate chain editor fields
- **WHEN** SkillEditor saves `chain` behavior params
- **THEN** it SHALL validate integer fields, numeric ranges, enum fields, boolean fields, key-only `segment_vfx_key`, and unknown fields through the skill schema and behavior-template whitelist

#### Scenario: Reject invalid chain values in Chinese
- **WHEN** SkillEditor rejects invalid `chain_count`, `chain_radius`, `chain_delay_ms`, `damage_falloff_per_chain`, `target_policy`, `allow_repeat_target`, `max_targets`, `segment_vfx_key`, or undeclared fields
- **THEN** it SHALL display Chinese error text and SHALL NOT persist invalid skill data

#### Scenario: Do not save frontend-only chain params
- **WHEN** SkillEditor saves a `chain` Skill Package
- **THEN** it SHALL NOT write frontend-only fake params or any field not declared by the `chain` behavior template

### Requirement: Lightning Chain SkillEvent
V1 SHALL express `active_lightning_chain` through real SkillEvents for chain segments, damage, and presentation.

#### Scenario: Emit chain event timeline
- **WHEN** Skill Runtime executes `active_lightning_chain`
- **THEN** it SHALL output `cast_start`, one or more `chain_segment`, one or more `damage`, `hit_vfx`, `floating_text`, and `cooldown_update` when present

#### Scenario: Include required event fields
- **WHEN** SkillEvent timeline displays `active_lightning_chain` events
- **THEN** each relevant event SHALL include `timestamp_ms`, `delay_ms`, `duration_ms`, `source_entity`, `target_entity`, `amount`, `damage_type`, `vfx_key`, `reason_key`, and `payload`

#### Scenario: Include chain segment payload
- **WHEN** Skill Runtime outputs a `chain_segment`
- **THEN** its payload SHALL include `segment_index`, `from_target`, `to_target`, `start_position`, `end_position`, `chain_radius`, `chain_delay_ms`, `damage_scale`, and `vfx_key`

#### Scenario: Select initial and subsequent targets
- **WHEN** Skill Runtime executes `active_lightning_chain`
- **THEN** it SHALL select the nearest enemy as the initial target and then choose subsequent targets within `chain_radius` according to `target_policy`

#### Scenario: Do not repeat targets by default
- **WHEN** `allow_repeat_target = false`
- **THEN** Skill Runtime SHALL NOT choose an already-hit target for a later chain segment

#### Scenario: Apply chain count and target limits
- **WHEN** Skill Runtime executes `active_lightning_chain`
- **THEN** `chain_count` SHALL limit the maximum number of `chain_segment` events and `max_targets` SHALL limit the maximum number of damaged targets

#### Scenario: Delay damage by chain segment timing
- **WHEN** Skill Runtime executes `active_lightning_chain`
- **THEN** target life SHALL NOT be reduced at `cast_start`, and life reduction SHALL occur only through `damage` events at or after the corresponding `chain_segment`

#### Scenario: Apply lightning damage and falloff
- **WHEN** a target is damaged by `active_lightning_chain`
- **THEN** the `damage` event SHALL use `damage_type = lightning`, and later chain segments SHALL apply damage according to `damage_falloff_per_chain`

#### Scenario: Emit presentation events from real hits
- **WHEN** a target is hit by `active_lightning_chain`
- **THEN** Skill Runtime SHALL emit `hit_vfx` and `floating_text` aligned with the corresponding `damage` event

#### Scenario: Do not fake chain behavior
- **WHEN** Skill Runtime executes `active_lightning_chain`
- **THEN** it SHALL NOT resolve the skill as a single visual line, a release-time instant damage batch, a static fake event list, or an `active_lightning_chain` special branch in Combat Runtime

### Requirement: Lightning Chain Test Arena Acceptance
Skill Test Arena SHALL validate `active_lightning_chain` using real `chain_segment` and `damage` results.

#### Scenario: Validate three target row chain behavior
- **WHEN** Skill Test Arena runs `active_lightning_chain` in the three-target-row scenario
- **THEN** it SHALL verify the initial target is hit, subsequent targets are selected by `chain_radius`, and chain segment order is visible

#### Scenario: Validate dense pack chain behavior
- **WHEN** Skill Test Arena runs `active_lightning_chain` in the dense-pack scenario
- **THEN** it SHALL verify real multi-target jumps and SHALL verify targets are not repeated by default

#### Scenario: Validate single dummy timing
- **WHEN** Skill Test Arena runs `active_lightning_chain` in the single-dummy scenario
- **THEN** it SHALL verify the base cast, chain segment, damage, hit VFX, floating text, and no life reduction before the relevant damage event

#### Scenario: Validate chain count parameter
- **WHEN** Skill Test Arena changes `chain_count`
- **THEN** the number of emitted `chain_segment` events SHALL change according to the configured limit

#### Scenario: Validate chain radius parameter
- **WHEN** Skill Test Arena changes `chain_radius`
- **THEN** the set of reachable chained targets SHALL change according to the configured radius

#### Scenario: Validate chain delay parameter
- **WHEN** Skill Test Arena changes `chain_delay_ms`
- **THEN** the time interval between chain segments and corresponding damage events SHALL change

#### Scenario: Validate damage falloff parameter
- **WHEN** Skill Test Arena changes `damage_falloff_per_chain`
- **THEN** later chain segment damage amounts SHALL change according to the configured falloff

#### Scenario: Validate modifier stack effects
- **WHEN** Skill Test Arena runs `active_lightning_chain` with the test Modifier Stack
- **THEN** the stack SHALL affect final damage or chain runtime parameters used by actual SkillEvents without writing production inventory, gem instances, or Skill Package data

### Requirement: Lightning Chain AI Self-Test Report
The AI self-test report SHALL evaluate `active_lightning_chain` from real Skill Test Arena results.

#### Scenario: Generate lightning chain report
- **WHEN** `python tools\generate_skill_test_report.py --skill active_lightning_chain --scenario dense_pack` is run
- **THEN** it SHALL generate a Chinese AI self-test report based on real test results

#### Scenario: Check required chain events
- **WHEN** the AI self-test report evaluates `active_lightning_chain`
- **THEN** it SHALL check whether `chain_segment`, multiple `chain_segment` events, `damage`, `hit_vfx`, and `floating_text` exist

#### Scenario: Check chain timing and damage type
- **WHEN** the AI self-test report evaluates `active_lightning_chain`
- **THEN** it SHALL check whether damage is not earlier than the corresponding `chain_segment`, no HP is reduced at `cast_start`, and `damage_type = lightning`

#### Scenario: Check target selection behavior
- **WHEN** the AI self-test report evaluates `active_lightning_chain`
- **THEN** it SHALL check whether multiple targets are hit, whether the default behavior avoids repeated targets, and whether out-of-radius targets are not chained

#### Scenario: Check chain parameter effects
- **WHEN** the AI self-test report evaluates `active_lightning_chain`
- **THEN** it SHALL check whether changing `chain_count`, `chain_radius`, `chain_delay_ms`, and `damage_falloff_per_chain` changes real chain results

#### Scenario: Report Chinese conclusion and fixes
- **WHEN** the AI self-test report finishes evaluating `active_lightning_chain`
- **THEN** it SHALL output a conclusion of `通过`, `部分通过`, or `不通过`, plus Chinese inconsistency items and suggested fixes

### Requirement: SkillEditor projectile launch point direct adjustment
SkillEditor SHALL provide a direct scene adjustment flow for editable projectile launch positions that updates the current draft `behavior.params.spawn_offset` without bypassing existing save validation.

#### Scenario: Enter direct adjustment from launch position section
- **WHEN** the user opens an editable Skill Package whose behavior template supports persisted `spawn_offset`
- **THEN** the "发射位置" section SHALL provide a Chinese "直接调整" action that enters scene adjustment mode

#### Scenario: Ice shards uses generic projectile spread
- **WHEN** `active_ice_shards` is editable in SkillEditor
- **THEN** it SHALL use the generic `projectile` behavior template with projectile count and spread-angle params rather than requiring a separate fan-projectile template

#### Scenario: Hide editor shell during adjustment
- **WHEN** scene adjustment mode is active
- **THEN** the full SkillEditor panel SHALL be temporarily hidden while the editor draft remains mounted and available

#### Scenario: Drag launch point in battle scene
- **WHEN** the user drags the launch-point handle in the battle scene
- **THEN** SkillEditor SHALL convert the dragged scene position into `behavior.params.spawn_offset.x` and `behavior.params.spawn_offset.y` relative to the current cast source in the editor draft

#### Scenario: Confirm adjusted position
- **WHEN** the user confirms the adjusted launch position
- **THEN** SkillEditor SHALL return to the full editor panel with the numeric launch offset fields and read-only launch-point preview reflecting the adjusted draft value

#### Scenario: Cancel adjusted position
- **WHEN** the user cancels scene adjustment mode
- **THEN** SkillEditor SHALL restore the launch offset values that existed before entering adjustment mode and return to the full editor panel

#### Scenario: Save still uses existing validation
- **WHEN** the user saves after confirming a directly adjusted launch position
- **THEN** SkillEditor SHALL use the existing save flow, schema validation, and behavior-template whitelist before writing the Skill Package

#### Scenario: Do not expose unsupported templates
- **WHEN** the current Skill Package behavior template does not allow persisted `spawn_offset`
- **THEN** SkillEditor SHALL NOT enable direct launch-position adjustment for that package

#### Scenario: No runtime behavior change
- **WHEN** Skill Runtime executes a projectile skill after this editor change is applied
- **THEN** projectile spawning, targeting, trajectory, damage, and SkillEvent semantics SHALL remain determined by existing runtime logic and the saved `spawn_offset` value

### Requirement: WebApp Runtime Performance Observability
V1 WebApp SHALL provide low-overhead runtime performance observability for battle and SkillEditor test-arena runtime without changing gameplay behavior.

#### Scenario: Record frame performance summary
- **WHEN** WebApp runtime is playing
- **THEN** it SHALL record recent frame time, logic step time, active visual object counts, scheduled SkillEvent count, consumed SkillEvent count, and dropped-frame count

#### Scenario: Performance observability does not cause high-frequency UI renders
- **WHEN** performance data is updated every animation frame
- **THEN** high-frequency samples SHALL be stored outside React state, and any visible summary SHALL update at a lower frequency

#### Scenario: Show Chinese performance summary in development context
- **WHEN** the SkillEditor or development runtime performance summary is visible
- **THEN** all visible labels and warnings SHALL be Chinese

### Requirement: Batched SkillEvent Consumption
WebApp runtime SHALL consume same-frame SkillEvents in batches to reduce React state churn while preserving event order and gameplay results.

#### Scenario: Consume ready scheduled events as an ordered batch
- **WHEN** multiple scheduled SkillEvents become ready in the same animation frame
- **THEN** WebApp SHALL collect them in existing timeline order and consume them through a batch path

#### Scenario: Batch projectile visual updates
- **WHEN** a batch contains multiple `projectile_spawn` events
- **THEN** WebApp SHALL append their projectile body visuals with a single state update for that visual collection

#### Scenario: Batch impact and floating text visual updates
- **WHEN** a batch contains multiple `projectile_impact`, `hit_vfx`, or `floating_text` events
- **THEN** WebApp SHALL append their corresponding visual objects with batched state updates

#### Scenario: Batch damage application without changing results
- **WHEN** a batch contains multiple `damage` events
- **THEN** WebApp SHALL apply all damage events in event order and produce the same enemy HP, death count, and combat log result as individual consumption

#### Scenario: Preserve SkillEvent semantics
- **WHEN** SkillEvent batching is enabled
- **THEN** event count, event ordering, event payloads, damage timing, target selection, projectile lifetime, cooldown behavior, and visible SkillEvent timeline data SHALL remain unchanged

### Requirement: Runtime Visual Object Budget
WebApp runtime SHALL cap front-end-only visual object counts to avoid DOM growth causing frame drops without dropping logic events.

#### Scenario: Cap projectile and impact visuals
- **WHEN** active projectile bodies or impact VFX exceed the configured visual budget
- **THEN** WebApp SHALL remove older or near-expired visual objects while keeping underlying SkillEvents and damage results intact

#### Scenario: Cap floating text visuals
- **WHEN** active floating text objects exceed the configured visual budget
- **THEN** WebApp SHALL remove older or near-expired floating text objects without changing damage events or enemy HP

#### Scenario: Cap area, chain, and melee visuals
- **WHEN** active area, chain, damage-zone, or melee-arc visual objects exceed the configured visual budget
- **THEN** WebApp SHALL limit only front-end presentation objects and SHALL NOT alter Skill Runtime output

#### Scenario: Do not use budget for gameplay logic
- **WHEN** visual budgets are applied
- **THEN** budgets SHALL NOT be used to skip SkillEvent generation, target selection, damage calculation, cooldown updates, enemy HP updates, or test-arena results

### Requirement: SkillEditor Debug Layer Performance
SkillEditor runtime debug layers SHALL avoid excessive render and layout work while preserving projectile and damage-zone debugging visibility.

#### Scenario: Render debug layers only when relevant
- **WHEN** SkillEditor debug options are disabled or the user is outside SkillEditor debug context
- **THEN** launch points, target points, direction lines, collision radii, and search ranges SHALL NOT render unnecessary DOM nodes

#### Scenario: Reuse projected guide calculations
- **WHEN** debug guide positions are rendered for projectile, chain, melee, or damage-zone previews
- **THEN** WebApp SHALL reuse or memoize world-to-screen projection results where practical instead of recalculating equivalent guide positions repeatedly during the same render

#### Scenario: Limit event timeline rendering cost
- **WHEN** SkillEditor test-arena event timeline contains many events
- **THEN** the timeline SHALL limit initially rendered rows or keep large payload text collapsed until needed, while still allowing the user to inspect the real event details

#### Scenario: Preserve debug correctness
- **WHEN** debug-layer optimizations are applied
- **THEN** launch point, target point, direction line, collision radius, search range, and event payload displays SHALL remain derived from SkillEvent data or current editor draft data

### Requirement: Runtime Optimization Scope Guard
Runtime performance optimization SHALL NOT change formal runtime rules, skill configuration, or unrelated V1 systems.

#### Scenario: Do not change Skill Runtime behavior
- **WHEN** this change is applied
- **THEN** `src/liufang/skill_runtime.py` behavior semantics, event ordering, damage timing, projectile trajectories, target selection, cooldown events, and payload meanings SHALL remain unchanged

#### Scenario: Do not change formal skill configuration
- **WHEN** this change is applied
- **THEN** formal `configs/skills/**` values, skill schema, behavior template whitelist, and saved `skill.yaml` contents SHALL remain unchanged unless a later explicit change requests it

#### Scenario: Do not affect non-runtime systems
- **WHEN** this change is applied
- **THEN** gem board, sudoku legality, loot, affixes, inventory, localization content, and formal combat module behavior SHALL remain unchanged

#### Scenario: Build and tests pass
- **WHEN** runtime performance optimization is complete
- **THEN** WebApp build, WebApp smoke test, and relevant Python runtime tests SHALL pass

### Requirement: Skill Module Chain
V1 Skill Packages SHALL support ordered modules inside one Skill Package for skills that require composition of reusable behavior modules.

#### Scenario: Ordered modules are declared
- **WHEN** a Skill Package declares `modules`
- **THEN** each module SHALL have a stable `id`, a whitelisted `type`, and declared fields only

#### Scenario: Module ids are unique
- **WHEN** a Skill Package declares multiple modules
- **THEN** validation SHALL reject duplicate module ids within that Skill Package

#### Scenario: Marker trigger links are declared
- **WHEN** one module declares an output marker and a later module declares a trigger
- **THEN** the trigger SHALL reference the marker by id through declared marker / trigger fields

#### Scenario: Unresolved triggers are rejected
- **WHEN** a module declares `trigger_marker_id` that does not match a preceding declared marker id
- **THEN** validation SHALL reject the Skill Package and SHALL NOT silently execute the triggered module

#### Scenario: Module chain is not scripting
- **WHEN** a Skill Package declares modules
- **THEN** validation SHALL reject arbitrary scripts, node graph data, complex expression interpreter fields, function-call strings, and undeclared fields

### Requirement: Projectile Ballistic Extension
The projectile module SHALL support ballistic projectile timing and marker emission for thrown skills.

#### Scenario: Ballistic trajectory is supported
- **WHEN** a projectile module declares `trajectory = ballistic`
- **THEN** validation SHALL accept it as a legal projectile trajectory enum value

#### Scenario: Ballistic timing fields are validated
- **WHEN** a projectile module declares `travel_time_ms` and `arc_height`
- **THEN** `travel_time_ms` SHALL be positive and `arc_height` SHALL be non-negative

#### Scenario: Projectile target policy is validated
- **WHEN** a projectile module declares `target_policy`
- **THEN** validation SHALL accept only `nearest_enemy`, `locked_target`, or `target_position`

#### Scenario: Impact marker is emitted
- **WHEN** a projectile with `impact_marker_id` reaches its impact point
- **THEN** Skill Runtime SHALL emit `projectile_impact` with `marker_id` and `impact_position`

#### Scenario: Projectile spawn payload includes ballistic data
- **WHEN** Skill Runtime emits `projectile_spawn` for a ballistic projectile
- **THEN** the payload SHALL include `trajectory`, `start_position`, `target_position`, `travel_time_ms`, `arc_height`, and `impact_marker_id`

### Requirement: Triggered Damage Zone
The `damage_zone` module SHALL support marker-triggered execution and trigger-position origin for composed skills.

#### Scenario: Trigger marker is validated
- **WHEN** a damage zone module declares `trigger_marker_id`
- **THEN** validation SHALL require it to match a preceding module marker such as `projectile.impact_marker_id`

#### Scenario: Trigger delay is validated
- **WHEN** a damage zone module declares `trigger_delay_ms`
- **THEN** validation SHALL require it to be non-negative

#### Scenario: Trigger position origin is supported
- **WHEN** a damage zone module declares `origin_policy = trigger_position`
- **THEN** Skill Runtime SHALL use the matched `projectile_impact.impact_position` as the damage zone origin

#### Scenario: Warning event is emitted before triggered hit
- **WHEN** a triggered damage zone is primed by a projectile impact marker
- **THEN** Skill Runtime SHALL emit `damage_zone_prime` with `trigger_marker_id`, `origin`, `delay_ms`, `radius`, and `vfx_key`

#### Scenario: Triggered damage zone does not silently execute without source
- **WHEN** no matching trigger marker is emitted
- **THEN** Skill Runtime SHALL NOT emit the triggered `damage_zone` or `damage` events as if the trigger succeeded

### Requirement: Fungal Petards Skill Package
V1 SHALL migrate `active_fungal_petards / 真菌爆弹` from the old `skill_templates.toml` path into a Skill Package using a projectile plus triggered damage zone module chain.

#### Scenario: Fungal Petards uses module chain
- **WHEN** `active_fungal_petards` is migrated
- **THEN** its Skill Package SHALL use a `projectile` module followed by a `damage_zone` module linked by marker / trigger ids

#### Scenario: Fungal Petards does not use delayed area
- **WHEN** `active_fungal_petards` is migrated
- **THEN** it SHALL NOT use or create a `delayed_area` behavior template

#### Scenario: Fungal Petards uses physical circular explosion
- **WHEN** the triggered damage zone resolves for `active_fungal_petards`
- **THEN** the `damage_zone` SHALL have `shape = circle`, `damage_type = physical`, and origin from the projectile impact position

#### Scenario: Fungal Petards remains localized
- **WHEN** Fungal Petards name, description, damage reason, VFX feedback, screen feedback, or floating text is shown
- **THEN** player-visible text SHALL be Chinese and SHALL come from localization keys

#### Scenario: Lava orb is not migrated
- **WHEN** this change is applied
- **THEN** it SHALL NOT migrate `active_lava_orb` or create a Lava Orb Skill Package

### Requirement: Fungal Petards SkillEvent
V1 SHALL express `active_fungal_petards` through real SkillEvents for cast, ballistic projectile, impact marker, warning, explosion, damage, and presentation.

#### Scenario: Full event timeline is emitted
- **WHEN** Skill Runtime executes `active_fungal_petards`
- **THEN** it SHALL output `cast_start`, `projectile_spawn`, `projectile_impact`, `damage_zone_prime`, `damage_zone`, `damage`, `hit_vfx`, `floating_text`, and `cooldown_update` when present

#### Scenario: Damage zone payload is circular
- **WHEN** Skill Runtime emits `damage_zone` for `active_fungal_petards`
- **THEN** the payload SHALL include `shape = circle`, `origin`, `radius`, `hit_at_ms`, `damage_type`, and `vfx_key`

#### Scenario: Damage occurs only after explosion hit
- **WHEN** `active_fungal_petards` is cast
- **THEN** target life SHALL NOT be reduced at `cast_start`, before `projectile_impact`, or before the triggered damage zone hit resolves

#### Scenario: Damage is the only HP-changing event
- **WHEN** targets are hit by `active_fungal_petards`
- **THEN** HP reduction SHALL occur only through `damage` events emitted after the `damage_zone`

#### Scenario: No fake fungal events
- **WHEN** Skill Runtime executes `active_fungal_petards`
- **THEN** it SHALL NOT emit static fake event lists or resolve the skill as target-point instant damage

### Requirement: SkillEditor Module Chain Support
SkillEditor SHALL expose module-chain Skill Packages through a controlled “技能模块链” panel.

#### Scenario: Projectile module fields are shown
- **WHEN** SkillEditor opens `active_fungal_petards`
- **THEN** it SHALL show projectile module fields for `trajectory`, `travel_time_ms`, `arc_height`, `target_policy`, `impact_marker_id`, `projectile_speed`, `projectile_width`, `projectile_height`, and `vfx_key`

#### Scenario: Damage zone module fields are shown
- **WHEN** SkillEditor opens `active_fungal_petards`
- **THEN** it SHALL show damage zone module fields for `trigger_marker_id`, `trigger_delay_ms`, `shape`, `origin_policy`, `radius`, `hit_at_ms`, `max_targets`, `damage_type`, and `vfx_key`

#### Scenario: Marker trigger link is shown
- **WHEN** SkillEditor displays the module chain
- **THEN** it SHALL show `projectile.impact_marker_id -> damage_zone.trigger_marker_id`

#### Scenario: Trigger input is controlled
- **WHEN** SkillEditor edits `trigger_marker_id`
- **THEN** it SHALL prefer selecting from existing declared marker ids and SHALL NOT allow saving a trigger that references a missing marker

#### Scenario: Test modifiers do not persist
- **WHEN** SkillEditor runs Fungal Petards with a test Modifier Stack
- **THEN** it SHALL NOT write test modifier values into the real Skill Package YAML and SHALL NOT restore random affix editing

### Requirement: WebApp Module Chain Rendering
WebApp SHALL render Fungal Petards from SkillEvent payloads instead of skill identity or legacy behavior guesses.

#### Scenario: Render ballistic projectile from event
- **WHEN** WebApp receives `projectile_spawn` with `trajectory = ballistic`
- **THEN** it SHALL render the projectile path using event-provided `start_position`, `target_position`, `travel_time_ms`, and `arc_height`

#### Scenario: Render impact and warning from events
- **WHEN** WebApp receives `projectile_impact` and `damage_zone_prime`
- **THEN** it SHALL render the landing and warning circle from event-provided marker, origin, delay, radius, and VFX payload data

#### Scenario: Render explosion from damage zone event
- **WHEN** WebApp receives `damage_zone` with `shape = circle`
- **THEN** it SHALL render the explosion range from event-provided origin, radius, timing, damage type, and VFX key

#### Scenario: Render presentation events from real events
- **WHEN** WebApp receives `damage`, `hit_vfx`, or `floating_text`
- **THEN** it SHALL render HP changes, hit effects, and floating text from those events

#### Scenario: Do not guess Fungal Petards behavior
- **WHEN** WebApp renders `active_fungal_petards`
- **THEN** it SHALL NOT infer behavior from skill id, old `behavior_type`, `visual_effect`, VFX key, or hardcoded Fungal Petards branches

### Requirement: Fungal Petards Skill Test Arena Acceptance
Skill Test Arena SHALL validate `active_fungal_petards` using real projectile impact, triggered damage zone, damage, and presentation events.

#### Scenario: Validate single dummy timing
- **WHEN** Skill Test Arena runs `active_fungal_petards` against one dummy
- **THEN** it SHALL verify `projectile_spawn`, `projectile_impact`, `damage_zone_prime`, `damage_zone`, no HP loss before explosion, HP loss after `damage`, hit VFX, and floating text

#### Scenario: Validate dense pack area behavior
- **WHEN** Skill Test Arena runs `active_fungal_petards` against dense small monsters
- **THEN** it SHALL verify targets inside the circular radius are hit and targets outside the radius are not hit

#### Scenario: Validate three target row radius behavior
- **WHEN** Skill Test Arena runs `active_fungal_petards` against three horizontal targets
- **THEN** it SHALL verify hit selection changes according to circular radius and impact position

#### Scenario: Validate timing and geometry parameter effects
- **WHEN** Skill Test Arena changes `travel_time_ms`, `arc_height`, `trigger_delay_ms`, or `radius`
- **THEN** projectile impact timing, projectile arc payload or rendering, explosion timing, or hit coverage SHALL change according to the modified parameter

#### Scenario: Validate modifier stack effects
- **WHEN** Skill Test Arena runs `active_fungal_petards` with a test Modifier Stack
- **THEN** the stack SHALL affect final damage or range parameters used by actual SkillEvents without writing production inventory, gem instances, or Skill Package data

### Requirement: AI Report Module Chain Validation
The AI self-test report SHALL evaluate Fungal Petards module-chain behavior from real Skill Test Arena events and HP results.

#### Scenario: Check projectile impact chain
- **WHEN** the AI self-test report evaluates `active_fungal_petards`
- **THEN** it SHALL check whether `projectile_spawn` exists, `trajectory = ballistic`, `projectile_impact` exists, and `projectile_impact` carries `marker_id`

#### Scenario: Check triggered damage zone chain
- **WHEN** the AI self-test report evaluates `active_fungal_petards`
- **THEN** it SHALL check whether `damage_zone_prime` exists, references `trigger_marker_id`, `damage_zone` exists, `shape = circle`, and damage zone origin equals projectile impact position

#### Scenario: Check damage timing and damage type
- **WHEN** the AI self-test report evaluates `active_fungal_petards`
- **THEN** it SHALL check that damage is not earlier than `projectile_impact + trigger_delay_ms`, no HP is reduced before explosion, HP is reduced after `damage`, and `damage_type = physical`

#### Scenario: Check parameter mutation effects
- **WHEN** the AI self-test report evaluates changed Fungal Petards parameters
- **THEN** it SHALL check that radius changes hit targets, `travel_time_ms` changes landing timing, `arc_height` changes ballistic presentation parameters, and `trigger_delay_ms` changes explosion timing

#### Scenario: Report Chinese conclusion and fixes
- **WHEN** the AI self-test report finishes evaluating `active_fungal_petards`
- **THEN** it SHALL output a conclusion of `通过`, `部分通过`, or `不通过`, plus Chinese inconsistency items and suggested fixes

### Requirement: Authored encounter aggro runtime
V1 WebApp battle runtime SHALL use authored encounter aggro ranges to trigger group-wide enemy aggression.

#### Scenario: Trigger monster point aggro
- **WHEN** the player enters a monster spawn point's authored aggro range during battle
- **THEN** every living enemy spawned from that monster spawn point SHALL lock onto the player

#### Scenario: Trigger boss group aggro
- **WHEN** the player enters a chosen boss group's authored aggro range during battle
- **THEN** every living boss spawned from that boss group SHALL lock onto the player

#### Scenario: Aggro persists after leaving range
- **WHEN** an enemy has locked onto the player because its authored encounter source was triggered
- **THEN** that enemy SHALL continue pursuing the player until death or battle reset even if the player leaves the original aggro range

#### Scenario: Untriggered distant enemies stay lightweight
- **WHEN** authored enemies have not been triggered and are far from the player and camera
- **THEN** runtime SHALL keep them as lightweight records without full per-frame AI or DOM rendering

### Requirement: Authored encounter random count multiplier runtime
V1 WebApp battle runtime SHALL apply authored monster count multiplier ranges when initializing monster spawn points.

#### Scenario: Roll actual monster count
- **WHEN** a battle starts on a map with a monster spawn point that defines a count multiplier interval
- **THEN** runtime SHALL calculate that point's actual monster count as `floor(configured count * random(min, max))`

#### Scenario: Decimal multipliers are supported
- **WHEN** a monster spawn point defines decimal multiplier bounds
- **THEN** runtime SHALL use those decimal values when rolling the actual monster count

#### Scenario: Default multiplier preserves existing maps
- **WHEN** a monster spawn point has no multiplier interval fields
- **THEN** runtime SHALL treat the interval as `[1, 1]` and preserve the existing configured count behavior

#### Scenario: Boss explicit counts are preserved
- **WHEN** a battle starts with an authored boss group
- **THEN** runtime SHALL spawn bosses according to the chosen boss group's explicit boss count and boss selections rather than applying the monster count multiplier

### Requirement: Authored encounter start presence
V1 WebApp battle runtime SHALL keep authored enemies logically present from battle start while avoiding close-range pop-in and frame drops.

#### Scenario: Initialize authored enemies at battle start
- **WHEN** a battle starts on a map with authored monster spawn points or boss groups
- **THEN** runtime SHALL create enemy records for the rolled authored encounter enemies at battle start

#### Scenario: Visible untriggered enemies can render before aggro
- **WHEN** an untriggered authored enemy is inside or near the current camera view
- **THEN** runtime SHALL allow that enemy to render as present without requiring it to start chasing the player

#### Scenario: Distant authored enemies avoid render cost
- **WHEN** authored enemies are outside the visible or near-visible area
- **THEN** runtime SHALL avoid rendering individual DOM nodes for those enemies

#### Scenario: Performance optimizations preserve encounter logic
- **WHEN** authored enemies move between dormant, visible, triggered, active, or dead runtime states
- **THEN** enemy HP, death, drops, skill targeting, damage results, and aggro lock state SHALL remain consistent with the enemies logically present on the map

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

### Requirement: Gem Combination Effect Report
V1 SHALL provide a non-destructive report that verifies active, passive, support, and conduit gem combinations through the real board and skill effect calculator.

#### Scenario: Verify active support and passive effects
- **WHEN** an active skill is mounted with compatible support and passive gems
- **THEN** the report SHALL show the final skill values and applied modifiers produced by the real `SkillEffectCalculator`

#### Scenario: Verify runtime event propagation
- **WHEN** a final skill parameter affects runtime-visible event counts
- **THEN** the report SHALL execute the real `SkillRuntime` and show matching event counts such as `projectile_spawn`

#### Scenario: Verify cooldown support player experience
- **WHEN** Cooldown Focus is combined with Area Magnify on Frost Nova in the report scenario
- **THEN** the final cooldown SHALL be faster than the active skill baseline while the area radius still increases

#### Scenario: Verify conduit debug clarity
- **WHEN** a same-row conduit amplifies another support in the report scenario
- **THEN** the applied modifier debug output SHALL include one conduit multiplier entry for that amplification, not a duplicate self-application entry

#### Scenario: Keep report non-destructive
- **WHEN** the report completes
- **THEN** it SHALL NOT write Skill Package YAML, support scaling TOML, production inventory, board state, runtime code, or WebApp code

### Requirement: Authored encounter runtime initialization
V1 WebApp battle runtime SHALL initialize enemies from authored map encounter data when that data is present.

#### Scenario: Use authored monster spawns
- **WHEN** a battle starts on a map with authored monster spawn points
- **THEN** the runtime SHALL sample monster positions from those spawn points at match start

#### Scenario: Do not use timer spawning for authored encounters
- **WHEN** authored monster spawn data exists for the current map
- **THEN** the runtime SHALL NOT rely on the normal timer-based enemy spawning loop for those authored monsters

#### Scenario: Use fallback spawning only without authored encounters
- **WHEN** a battle starts on a map without authored encounter data
- **THEN** the runtime MAY preserve the existing fallback spawning behavior

### Requirement: Runtime spatial indexing for authored enemies
V1 WebApp battle runtime SHALL use spatial indexing for authored enemies so runtime cost does not require scanning every monster every frame.

#### Scenario: Query nearby enemies through spatial index
- **WHEN** runtime systems need nearby enemies for activation, targeting, movement, or area damage
- **THEN** they SHALL query a spatial index or chunk structure instead of requiring a full enemy-list scan

#### Scenario: Update index when enemy moves or dies
- **WHEN** an active enemy changes chunk or is removed
- **THEN** the runtime SHALL update the spatial index so future queries remain correct

### Requirement: Runtime activation tiers for authored enemies
V1 WebApp battle runtime SHALL separate authored enemies into simulation and rendering tiers.

#### Scenario: Distant enemies remain lightweight
- **WHEN** authored enemies are far from the player and irrelevant to active skills
- **THEN** they SHALL remain dormant or low-frequency records without per-frame AI, movement, animation, or DOM rendering

#### Scenario: Nearby enemies become active
- **WHEN** authored enemies enter the configured activation range or become relevant to skill targeting
- **THEN** they SHALL be promoted into an active simulation tier

#### Scenario: Visible enemies render
- **WHEN** active or nearby enemies are inside or near the viewport
- **THEN** they SHALL be eligible for visual rendering

#### Scenario: Offscreen enemies avoid rendering cost
- **WHEN** enemies are outside the visible or near-visible area
- **THEN** the runtime SHALL avoid rendering individual DOM nodes for those enemies

### Requirement: Authored boss group runtime selection
V1 WebApp battle runtime SHALL select at most one authored boss group when a map is entered.

#### Scenario: Randomly select one boss group
- **WHEN** a map contains multiple authored boss groups
- **THEN** the runtime SHALL randomly select one group for that map entry

#### Scenario: Spawn all bosses in chosen group
- **WHEN** a boss group is selected
- **THEN** the runtime SHALL spawn every boss configured in that group inside the group's authored area

#### Scenario: Do not spawn unchosen boss groups
- **WHEN** one boss group has been selected
- **THEN** bosses from unchosen boss groups SHALL NOT spawn during that map entry

### Requirement: Authored encounter performance contract
V1 WebApp battle runtime SHALL support dark ARPG-style high monster counts without imposing an authoring-time hard cap.

#### Scenario: No authoring cap as performance substitute
- **WHEN** authored encounter data requests many monsters
- **THEN** runtime performance SHALL be handled through indexing, activation tiers, low-frequency updates, and view-based rendering rather than rejecting the data solely because the count is large

#### Scenario: Preserve gameplay correctness under optimization
- **WHEN** enemies move between dormant, aware, active, visible, or dead tiers
- **THEN** enemy HP, death, drops, skill targeting, and damage results SHALL remain consistent with the enemies that are logically present on the map

#### Scenario: Report placement shortfall
- **WHEN** runtime sampling cannot place every requested monster on valid walkable positions inside a spawn area
- **THEN** the runtime SHALL surface a debug warning or notice instead of silently pretending every requested monster was placed

### Requirement: Independent Tilemap Map Editor Entry
V1 WebApp SHALL provide an independent map editor entry for hand-authored tilemap editing.

#### Scenario: Open map editor route
- **WHEN** the user opens `/map-editor`
- **THEN** the app SHALL show the map editor instead of the battle scene, skill editor, sprite test scene, or map selection panel

#### Scenario: No monsters in first editor version
- **WHEN** the map editor is open
- **THEN** the editor SHALL NOT generate monsters, enemies, elites, boss units, or monster spawn controls

### Requirement: Tilemap Paint Tools
The map editor SHALL allow Unity Tilemap-style painting with a small tile set.

#### Scenario: Select tile brush
- **WHEN** the user selects a brush
- **THEN** the editor SHALL allow choosing ground or wall tiles

#### Scenario: Single-cell fill and clear
- **WHEN** the user clicks a map cell in fill or clear mode
- **THEN** the editor SHALL update only that cell to the selected tile or empty state

#### Scenario: Rectangle fill and clear
- **WHEN** the user drags from one map cell to another in rectangle mode
- **THEN** the editor SHALL fill or clear every cell inside the selected rectangle

#### Scenario: Adjust cell unit size
- **WHEN** the user changes the cell size control
- **THEN** the editor SHALL resize the map cells and use the new value as the map unit size

### Requirement: Derived Walkable And Blocker Layers
The map editor SHALL derive walkable and blocker behavior from tile semantics in the first version.

#### Scenario: Ground is walkable
- **WHEN** a cell contains a ground tile
- **THEN** the editor SHALL treat that cell as walkable

#### Scenario: Wall and empty cells block movement
- **WHEN** a cell contains a wall tile or is empty
- **THEN** the editor SHALL treat that cell as blocked for the player reference character

### Requirement: Movable Player Scale Reference
The map editor SHALL show a movable player character in the editable scene.

#### Scenario: Player appears in editor
- **WHEN** the map editor opens
- **THEN** the editor SHALL render the existing player character animation as a scale reference inside the editable grid

#### Scenario: Player movement respects derived walkability
- **WHEN** the user moves the player reference character with keyboard input
- **THEN** the character SHALL move through ground cells and stop at wall or empty cells

### Requirement: Current POV Skill Expression Calibration
V1 SHALL provide a non-destructive calibration report for skill expression parameters under the current battle POV.

#### Scenario: Use current battle POV metrics
- **WHEN** skill expression calibration runs
- **THEN** it SHALL evaluate current battle world size, camera zoom, player speed, enemy chase speed, spawn cadence, and normal spawn distance band instead of using fixed dummy scenarios as player-feel evidence

#### Scenario: Recommend only expression parameters
- **WHEN** calibration evaluates active skills
- **THEN** it SHALL recommend only expression-facing parameters such as search range, cooldown, projectile count, projectile speed, maximum distance, area radius, line length, line width, chain count, chain radius, chain delay, orbit duration, tick interval, orbit radius, orb count, travel time, and trigger delay

#### Scenario: Do not tune damage in expression pass
- **WHEN** calibration evaluates skill packages or scaling rules
- **THEN** it SHALL NOT recommend changes to base damage, damage type modifiers, crit values, enemy HP, or player HP

#### Scenario: Keep calibration non-destructive
- **WHEN** calibration emits recommendations
- **THEN** it SHALL NOT write Skill Package YAML, support scaling TOML, inventory data, board data, loot data, or runtime behavior files

#### Scenario: Include support and passive expression pressure
- **WHEN** calibration evaluates support and passive skills
- **THEN** it SHALL identify expression-related modifiers such as skill speed, cooldown, area, projectile speed, projectile count, and move speed while ignoring damage-only modifiers

### Requirement: Orbit Emitter Module
V1 Skill Packages SHALL support a reusable `orbit_emitter` module that generates orbit entity and tick-position SkillEvents without performing hit tests or damage directly.

#### Scenario: Emit orbit spawn event
- **WHEN** Skill Runtime executes a Skill Package module with `type = orbit_emitter`
- **THEN** it SHALL emit `orbit_spawn` with orbit center, orbit radius, duration, orb count, orbit speed, and spawn VFX key payload data

#### Scenario: Emit orbit tick events
- **WHEN** the orbit emitter's tick schedule reaches a tick timestamp
- **THEN** it SHALL emit `orbit_tick` with `tick_index`, `tick_time_ms`, `orb_position`, `tick_marker_id`, and `tick_vfx_key`

#### Scenario: Orbit emitter does not hit or damage
- **WHEN** an `orbit_emitter` module emits `orbit_spawn` or `orbit_tick`
- **THEN** it SHALL NOT perform target hit testing, reduce HP, emit `damage`, or resolve damage directly

#### Scenario: Orbit emitter fields are whitelisted
- **WHEN** `configs/skills/behavior_templates/orbit_emitter.yaml` is validated
- **THEN** it SHALL declare only whitelisted fields for `orbit_center_policy`, `duration_ms`, `tick_interval_ms`, `orbit_radius`, `orbit_speed_deg_per_sec`, `orb_count`, `start_angle_deg`, `tick_marker_id`, `spawn_vfx_key`, and `tick_vfx_key`

#### Scenario: Orbit emitter rejects script-like params
- **WHEN** a Skill Package declares `orbit_emitter` parameters
- **THEN** validation SHALL reject arbitrary scripts, expression DSL fields, function-call strings, undeclared parameters, and frontend-only fake parameters

### Requirement: Tick Schedule Helper
V1 SHALL provide reusable tick scheduling logic for duration and interval based modules, and the logic SHALL NOT be specific to Lava Orb.

#### Scenario: Compute tick times
- **WHEN** tick scheduling receives `duration_ms` and `tick_interval_ms`
- **THEN** it SHALL compute deterministic `tick_index` and `timestamp_ms` values according to the configured duration and interval

#### Scenario: Validate tick inputs
- **WHEN** a module declares `duration_ms` and `tick_interval_ms`
- **THEN** validation SHALL require both values to be positive and SHALL reject `tick_interval_ms` greater than `duration_ms`

#### Scenario: Reusable timing boundary
- **WHEN** tick scheduling is implemented
- **THEN** it SHALL be reusable as an `orbit_emitter` helper or a shared timing helper and SHALL NOT contain `active_lava_orb` skill-id branches

#### Scenario: Tick schedule does not resolve combat
- **WHEN** tick scheduling outputs tick data
- **THEN** it SHALL NOT perform hit testing, select targets, emit damage, or reduce HP

### Requirement: Triggered Damage Zone Reuse For Orbit Ticks
V1 SHALL reuse the existing `damage_zone` circle hit test with `origin_policy = trigger_position` for orbit tick damage zones.

#### Scenario: Orbit tick marker triggers damage zone
- **WHEN** an `orbit_tick` emits a marker using `tick_marker_id`
- **THEN** a later `damage_zone` module SHALL be able to reference that marker through `trigger_marker_id`

#### Scenario: Damage zone uses tick position
- **WHEN** a `damage_zone` module declares `origin_policy = trigger_position` and is triggered by an orbit tick marker
- **THEN** Skill Runtime SHALL use the matching `orbit_tick.orb_position` as the `damage_zone` origin

#### Scenario: Reuse circle hit test
- **WHEN** the triggered orbit damage zone resolves with `shape = circle`
- **THEN** Skill Runtime SHALL use the shared `damage_zone` circle hit test and SHALL NOT use a Lava Orb-specific hit test

#### Scenario: Damage zone controls fire hit area
- **WHEN** Lava Orb's triggered `damage_zone` resolves
- **THEN** its radius SHALL control each tick's hit range and its `damage_type` SHALL be `fire`

### Requirement: Lava Orb Skill Package
V1 SHALL migrate `active_lava_orb / 熔岩球` into a Skill Package using an `orbit_emitter + damage_zone` module chain.

#### Scenario: Lava Orb package path
- **WHEN** `active_lava_orb` is migrated
- **THEN** its Skill Package SHALL be loaded from `configs/skills/active/active_lava_orb/skill.yaml`

#### Scenario: Lava Orb uses module chain
- **WHEN** the Lava Orb Skill Package is validated
- **THEN** it SHALL declare an `orbit_emitter` module followed by a `damage_zone` module linked by `tick_marker_id -> trigger_marker_id`

#### Scenario: Lava Orb does not use monolithic template
- **WHEN** Lava Orb is migrated
- **THEN** it SHALL NOT use or create a Lava Orb-specific monolithic behavior template

#### Scenario: Lava Orb package fields are complete
- **WHEN** the Lava Orb Skill Package is validated
- **THEN** it SHALL include display, classification, cast, modules, hit, scaling, presentation, and preview fields required by the Skill Package schema

#### Scenario: Lava Orb remains localized
- **WHEN** Lava Orb name, description, damage reason, VFX feedback, screen feedback, or floating text is shown
- **THEN** player-visible text SHALL be Chinese and SHALL come from localization keys

#### Scenario: Do not migrate other active skills
- **WHEN** this change is applied
- **THEN** it SHALL NOT migrate other active skills or modify formal drops, inventory, or gem board behavior

### Requirement: Lava Orb SkillEvent
V1 SHALL express Lava Orb through real SkillEvents for cast, orbit spawn, orbit ticks, triggered damage zones, damage, and presentation.

#### Scenario: Full Lava Orb event timeline is emitted
- **WHEN** Skill Runtime executes `active_lava_orb`
- **THEN** it SHALL output `cast_start`, `orbit_spawn`, multiple `orbit_tick`, `damage_zone`, `damage`, `hit_vfx`, `floating_text`, and `cooldown_update` when present

#### Scenario: Orbit spawn payload is complete
- **WHEN** Skill Runtime emits `orbit_spawn`
- **THEN** the payload SHALL include `orbit_center`, `orbit_radius`, `duration_ms`, `orb_count`, `orbit_speed_deg_per_sec`, and `spawn_vfx_key`

#### Scenario: Orbit tick payload is complete
- **WHEN** Skill Runtime emits `orbit_tick`
- **THEN** the payload SHALL include `tick_index`, `tick_time_ms`, `orb_position`, `tick_marker_id`, and `tick_vfx_key`

#### Scenario: Damage zone payload is linked to orbit tick
- **WHEN** Skill Runtime emits a Lava Orb `damage_zone`
- **THEN** the payload SHALL include `shape = circle`, `origin` equal to the matching orb position, `radius`, `damage_type = fire`, and `trigger_marker_id`

#### Scenario: Damage is the only HP-changing event
- **WHEN** targets are hit by Lava Orb
- **THEN** HP reduction SHALL occur only through `damage` events emitted after the matching `damage_zone`

### Requirement: SkillEditor Orbit Module Support
SkillEditor SHALL expose `orbit_emitter` and linked `damage_zone` fields for Lava Orb module-chain packages.

#### Scenario: Orbit emitter fields are shown
- **WHEN** SkillEditor opens a Skill Package with an `orbit_emitter` module
- **THEN** it SHALL expose `orbit_center_policy`, `duration_ms`, `tick_interval_ms`, `orbit_radius`, `orbit_speed_deg_per_sec`, `orb_count`, `start_angle_deg`, `tick_marker_id`, `spawn_vfx_key`, and `tick_vfx_key`

#### Scenario: Linked damage zone fields are shown
- **WHEN** SkillEditor opens the linked Lava Orb `damage_zone` module
- **THEN** it SHALL expose `trigger_marker_id`, `trigger_delay_ms`, `shape`, `origin_policy`, `radius`, `hit_at_ms`, `max_targets`, `damage_type`, and `vfx_key`

#### Scenario: Marker trigger link is shown
- **WHEN** SkillEditor displays the Lava Orb module chain
- **THEN** it SHALL show `orbit_emitter.tick_marker_id -> damage_zone.trigger_marker_id`

#### Scenario: Marker trigger consistency is validated
- **WHEN** SkillEditor saves a package with `orbit_emitter` and linked `damage_zone`
- **THEN** it SHALL reject missing marker references, unresolved triggers, duplicate marker ids, and invalid marker / trigger links

#### Scenario: Read-only orbit summaries are shown
- **WHEN** SkillEditor displays Lava Orb orbit modules
- **THEN** it SHALL show estimated tick count, estimated total duration, orbit radius, per-tick hit radius, and current module-chain connection status

#### Scenario: Test modifiers do not persist
- **WHEN** SkillEditor runs Lava Orb with a test Modifier Stack
- **THEN** it SHALL NOT write test modifier values into the real Skill Package YAML and SHALL NOT restore random affix editing

### Requirement: WebApp Orbit Rendering
WebApp SHALL render Lava Orb orbit and damage-zone behavior from SkillEvent payloads and SHALL NOT infer behavior from skill identity.

#### Scenario: Render orbit from event payload
- **WHEN** WebApp receives `orbit_spawn`
- **THEN** it SHALL render the orbit entity using event-provided orbit center, radius, duration, orb count, orbit speed, and VFX key

#### Scenario: Render tick position from event payload
- **WHEN** WebApp receives `orbit_tick`
- **THEN** it SHALL update or display the orb position using event-provided `orb_position`, `tick_index`, and timing data

#### Scenario: Render damage zone from event payload
- **WHEN** WebApp receives a Lava Orb `damage_zone`
- **THEN** it SHALL render the circular hit area using event-provided origin, radius, damage type, trigger marker id, and VFX key

#### Scenario: Render hit results from real events
- **WHEN** WebApp receives `damage`, `hit_vfx`, or `floating_text`
- **THEN** it SHALL render HP changes, hit effects, and floating text from those events

#### Scenario: Do not guess Lava Orb behavior
- **WHEN** WebApp renders `active_lava_orb`
- **THEN** it SHALL NOT infer orbit behavior from skill id, old `behavior_type`, `visual_effect`, VFX key, or hardcoded Lava Orb branches

### Requirement: Lava Orb Skill Test Arena Acceptance
Skill Test Arena SHALL validate Lava Orb using real orbit, tick, triggered damage zone, damage, and presentation events.

#### Scenario: Validate dense small monsters
- **WHEN** Skill Test Arena runs `active_lava_orb` against dense small monsters
- **THEN** it SHALL verify `orbit_spawn`, multiple `orbit_tick` events, triggered circular `damage_zone` events, fire `damage`, hit VFX, floating text, and multi-target circle hits

#### Scenario: Validate single dummy timing
- **WHEN** Skill Test Arena runs `active_lava_orb` against one dummy
- **THEN** it SHALL verify `cast_start` does not reduce HP, `orbit_tick` does not directly reduce HP, and HP is reduced only after `damage_zone` produces `damage`

#### Scenario: Validate three target row range
- **WHEN** Skill Test Arena runs `active_lava_orb` against three horizontal targets
- **THEN** it SHALL verify hit selection changes according to orbit tick position and `damage_zone.radius`

#### Scenario: Validate orbit timing parameter effects
- **WHEN** Skill Test Arena changes `duration_ms` or `tick_interval_ms`
- **THEN** tick count or tick frequency SHALL change according to the modified value

#### Scenario: Validate orbit geometry parameter effects
- **WHEN** Skill Test Arena changes `orbit_radius`, `orb_count`, or `damage_zone.radius`
- **THEN** orb positions, orbit entity count, or hit coverage SHALL change according to the modified value

#### Scenario: Validate modifier stack effects
- **WHEN** Skill Test Arena runs Lava Orb with a test Modifier Stack
- **THEN** the stack SHALL affect final damage, range, or tick parameters used by actual SkillEvents without writing production inventory, gem instances, or Skill Package data

### Requirement: AI Report Orbit Validation
The AI self-test report SHALL validate Lava Orb orbit, tick, damage-zone, and damage behavior from real Skill Test Arena events.

#### Scenario: Check orbit spawn
- **WHEN** the AI self-test report evaluates `active_lava_orb`
- **THEN** it SHALL check whether `orbit_spawn` exists and whether it is centered on the player or caster

#### Scenario: Check orbit ticks
- **WHEN** the AI self-test report evaluates `active_lava_orb`
- **THEN** it SHALL check whether multiple `orbit_tick` events exist, whether tick count matches `duration_ms / tick_interval_ms`, and whether each relevant tick includes `orb_position`

#### Scenario: Check triggered damage zone chain
- **WHEN** the AI self-test report evaluates `active_lava_orb`
- **THEN** it SHALL check whether `damage_zone` exists, whether its origin equals the matching `orbit_tick` position, and whether it uses `damage_type = fire`

#### Scenario: Check damage timing
- **WHEN** the AI self-test report evaluates `active_lava_orb`
- **THEN** it SHALL check that `cast_start` does not reduce HP, `orbit_tick` does not directly reduce HP, and `damage` is produced only after `damage_zone` hit resolution

#### Scenario: Check parameter mutation effects
- **WHEN** the AI self-test report evaluates changed Lava Orb parameters
- **THEN** it SHALL check that `duration_ms`, `tick_interval_ms`, `orbit_radius`, and `damage_zone.radius` changes affect real event counts, timing, positions, or hit coverage

#### Scenario: Report Chinese conclusion and fixes
- **WHEN** the AI self-test report finishes evaluating `active_lava_orb`
- **THEN** it SHALL output a conclusion of `通过`, `部分通过`, or `不通过`, plus Chinese inconsistency items and suggested fixes

### Requirement: 穿刺 Skill Package
V1 SHALL migrate `active_puncture` / `穿刺` from the old centralized skill template path into an active Skill Package.

#### Scenario: 从 active Skill Package 加载穿刺
- **WHEN** `active_puncture` is considered migrated
- **THEN** the system SHALL load it from `configs/skills/active/active_puncture/skill.yaml`

#### Scenario: 使用 melee_arc 行为模板
- **WHEN** the migrated `active_puncture` Skill Package is validated
- **THEN** it SHALL declare `behavior.template = melee_arc`

#### Scenario: 保持物理伤害分类
- **WHEN** the migrated `active_puncture` Skill Package is validated
- **THEN** it SHALL declare `classification.damage_type = physical`

#### Scenario: 保持中文玩家可见文本
- **WHEN** `active_puncture` name, description, damage reason, floating text, VFX feedback, or screen feedback is shown to the player
- **THEN** the player-visible text SHALL be Chinese and SHALL come from localization keys rather than embedded English text

#### Scenario: 不迁移其他主动技能
- **WHEN** this migration is applied
- **THEN** `active_lightning_chain`, `active_lava_orb`, and `active_fungal_petards` SHALL remain on their existing behavior paths unless a later change migrates them explicitly

### Requirement: melee_arc Behavior Template
V1 SHALL provide a whitelisted `melee_arc` Behavior Template for deterministic short-range directional sector melee skills.

#### Scenario: 从玩家或释放源生成近战扇形 SkillEvent
- **WHEN** Skill Runtime executes a skill using `melee_arc`
- **THEN** it SHALL generate a `melee_arc` SkillEvent from the player or cast source position using declared facing policy, arc angle, arc radius, hit shape, windup, hit timing, target cap, status chance scaling, and slash VFX key

#### Scenario: 按朝向角度和半径判断命中
- **WHEN** Skill Runtime resolves targets for a `melee_arc` skill
- **THEN** targets inside the sector defined by facing direction, `arc_angle`, and `arc_radius` SHALL be eligible for hit, while targets outside the sector or outside `arc_radius` SHALL NOT be hit

#### Scenario: 声明 melee_arc 参数白名单
- **WHEN** `configs/skills/behavior_templates/melee_arc.yaml` is validated
- **THEN** it SHALL declare allowed params including `arc_angle`, `arc_radius`, `windup_ms`, `hit_at_ms`, `max_targets`, `facing_policy`, `hit_shape`, `status_chance_scale`, and `slash_vfx_key`

#### Scenario: 校验 melee_arc 参数约束
- **WHEN** a Skill Package declares `behavior.template = melee_arc`
- **THEN** validation SHALL require legal `arc_angle`, positive `arc_radius`, non-negative `windup_ms`, non-negative `hit_at_ms`, legal timing relation between `hit_at_ms` and `windup_ms`, positive integer or explicitly declared unlimited `max_targets`, legal `facing_policy`, legal `hit_shape`, ranged `status_chance_scale`, and key-only `slash_vfx_key`

#### Scenario: 禁止脚本表达式和未声明参数
- **WHEN** a Skill Package declares `behavior.template = melee_arc`
- **THEN** validation SHALL reject scripts, expression DSL fields, complex expression interpreter fields, function-call strings, frontend-only fake params, and any params not declared by the `melee_arc` template

### Requirement: SkillEditor melee_arc 字段支持
SkillEditor SHALL expose and validate every editable `melee_arc` field before `active_puncture` is considered migrated.

#### Scenario: 暴露 melee_arc 近战扇形模块字段
- **WHEN** SkillEditor opens a Skill Package whose `behavior.template` is `melee_arc`
- **THEN** it SHALL expose editable fields for `arc_angle`, `arc_radius`, `windup_ms`, `hit_at_ms`, `max_targets`, `facing_policy`, `hit_shape`, `status_chance_scale`, and `slash_vfx_key`, plus read-only sector range summary and hit timing summary

#### Scenario: 使用枚举整数和范围校验
- **WHEN** SkillEditor edits or saves a `melee_arc` Skill Package
- **THEN** `facing_policy` and `hit_shape` SHALL use declared enums, `arc_angle`, `arc_radius`, `windup_ms`, `hit_at_ms`, and `status_chance_scale` SHALL use declared range validation, `max_targets` SHALL use integer validation or an explicitly declared unlimited enum, and `slash_vfx_key` SHALL accept only a key

#### Scenario: 使用 schema 和模板白名单校验
- **WHEN** SkillEditor saves a `melee_arc` Skill Package
- **THEN** it SHALL validate through both the skill schema and behavior template whitelist and SHALL NOT write undeclared fields or frontend-only fake params

#### Scenario: 不写入模板未声明字段
- **WHEN** SkillEditor persists `melee_arc` params
- **THEN** it SHALL write only params declared by `configs/skills/behavior_templates/melee_arc.yaml`

#### Scenario: 输出中文校验错误
- **WHEN** SkillEditor rejects invalid `melee_arc` values such as illegal angles, invalid enum values, invalid numeric ranges, invalid timing, or unknown fields
- **THEN** it SHALL display Chinese error text and SHALL NOT write invalid skill data

### Requirement: 穿刺 SkillEvent
`active_puncture` SHALL express melee slash generation, hit timing, damage, and presentation through real SkillEvents.

#### Scenario: 输出 melee_arc
- **WHEN** migrated `active_puncture` is cast
- **THEN** Skill Runtime SHALL output a `melee_arc` event from the player or cast source position with facing direction, arc angle, arc radius, hit shape, windup, hit timing, target cap, damage type, VFX key, and payload data

#### Scenario: 朝最近目标方向释放
- **WHEN** migrated `active_puncture` uses `facing_policy = nearest_target`
- **THEN** Skill Runtime SHALL orient the `melee_arc` event toward the nearest valid enemy target

#### Scenario: 由扇形范围判断命中
- **WHEN** `active_puncture` resolves targets
- **THEN** targets inside the configured melee sector SHALL be eligible for hit, while far targets or outside-sector targets SHALL NOT be hit

#### Scenario: damage 事件负责扣血
- **WHEN** `active_puncture` is cast
- **THEN** target life SHALL NOT be reduced at release time or before `hit_at_ms`, and life reduction SHALL be caused by `damage` events at or after `hit_at_ms`

#### Scenario: 输出伤害和表现事件
- **WHEN** an in-sector target is hit by `active_puncture`
- **THEN** Skill Runtime SHALL output `damage`, `hit_vfx`, and `floating_text` events for that target after or with the hit timing

#### Scenario: 物理伤害类型
- **WHEN** `active_puncture` emits a `damage` event
- **THEN** the event SHALL declare `damage_type = physical`

#### Scenario: 禁止远程锁敌即时扣血和静态假事件
- **WHEN** Skill Runtime executes `active_puncture`
- **THEN** it SHALL NOT use remote lock-on immediate damage, release-time direct HP removal, static fake events, or a Combat Runtime branch specific to `active_puncture`

### Requirement: 穿刺测试场验收
Skill Test Arena SHALL validate migrated `active_puncture` through controlled scenarios that prove melee range, facing, sector hit rules, timing, and modifier effects.

#### Scenario: 单体木桩验证基础近战命中
- **WHEN** Skill Test Arena runs migrated `active_puncture` against a single dummy placed inside the melee sector
- **THEN** it SHALL verify puncture releases from the player or cast source position, faces the target, emits `melee_arc`, and hits through `damage` at or after `hit_at_ms`

#### Scenario: 密集小怪验证扇形多目标命中
- **WHEN** Skill Test Arena runs migrated `active_puncture` in the dense small monster scenario
- **THEN** it SHALL verify close enemies inside the melee sector can be hit and that `max_targets` is respected

#### Scenario: 三目标横排验证扇形边界
- **WHEN** Skill Test Arena runs migrated `active_puncture` in the three-target horizontal row scenario
- **THEN** it SHALL verify sector-inside targets are hit, sector-outside targets are not hit, and targets outside `arc_radius` are not hit

#### Scenario: 验证 hit_at_ms 前不扣血
- **WHEN** Skill Test Arena observes target life before `hit_at_ms`
- **THEN** it SHALL verify target life is unchanged until a `damage` event occurs at or after `hit_at_ms`

#### Scenario: 参数修改影响真实测试结果
- **WHEN** SkillEditor or the arena test stack changes `arc_radius`, `arc_angle`, or `hit_at_ms`
- **THEN** Skill Test Arena SHALL show changed hit coverage, changed angular coverage, or changed damage timing respectively

#### Scenario: Modifier 测试栈影响结果
- **WHEN** Skill Test Arena runs `active_puncture` with a test Modifier Stack
- **THEN** the stack SHALL affect final damage, range, or status probability runtime parameters used by actual SkillEvents without writing real inventory, gem instance, or Skill Package data

### Requirement: 穿刺 AI 自测报告
The AI self-test report SHALL evaluate migrated `active_puncture` against real Skill Test Arena results and the expected Chinese player-facing behavior.

#### Scenario: 基于真实结果判断玩家侧描述
- **WHEN** an AI self-test report is generated for migrated `active_puncture`
- **THEN** it SHALL compare actual SkillEvent sequences, damage results, hit targets, and presentation events against the expected description "自动朝最近敌人方向释放一次短距离扇形穿刺斩击，命中近战扇形范围内敌人后造成物理伤害，并显示物理斩击命中特效与伤害浮字。"

#### Scenario: 检查 melee_arc 和朝向
- **WHEN** the report evaluates `active_puncture`
- **THEN** it SHALL check whether `melee_arc` exists, whether it starts from the player or cast source position, and whether it faces the nearest target

#### Scenario: 检查关键事件和时序
- **WHEN** the report evaluates `active_puncture`
- **THEN** it SHALL check whether `damage`, `hit_vfx`, and `floating_text` exist, whether `damage` is not earlier than `hit_at_ms`, whether no life is reduced before `hit_at_ms`, and whether `damage_type` is `physical`

#### Scenario: 检查近战扇形命中规则
- **WHEN** the report evaluates `active_puncture`
- **THEN** it SHALL check whether melee sector targets are hit, far targets are not hit, outside-sector targets are not hit, changing `arc_radius` changes hit target coverage, and changing `arc_angle` changes hit target coverage

#### Scenario: 输出中文结论和修复建议
- **WHEN** the report finishes evaluation
- **THEN** it SHALL output a conclusion of `通过`, `部分通过`, or `不通过`, plus Chinese inconsistency items and suggested fixes

### Requirement: 技能编辑器投射物事件面板结构
V1 SkillEditor SHALL provide a left / middle / right / bottom editor layout for projectile skill debugging without changing non-editor gameplay systems.

#### Scenario: 打开技能编辑器显示左侧技能列表
- **WHEN** 用户打开技能编辑器
- **THEN** 界面 SHALL 显示左侧技能列表

#### Scenario: 选择投射物技能
- **WHEN** 用户在技能列表中选择火焰弹或其他已迁移投射物技能
- **THEN** 技能编辑器 SHALL 打开该技能的编辑上下文，并 SHALL NOT 进入 XML 导入流程

#### Scenario: 中间显示事件列表或时间轴
- **WHEN** 技能编辑器打开一个技能
- **THEN** 中间区域 SHALL 显示当前技能的技能事件列表或时间轴

#### Scenario: 测试场运行后显示真实事件时间线
- **WHEN** 用户运行预览并生成测试场结果
- **THEN** 中间区域 SHALL 显示本次运行产生的真实 SkillEvent 时间线

#### Scenario: 右侧显示选中事件参数
- **WHEN** 用户选择技能事件或时间线事件
- **THEN** 右侧区域 SHALL 显示当前选中事件的参数面板

#### Scenario: 底部显示操作和反馈
- **WHEN** 技能编辑器处于可操作状态
- **THEN** 底部区域 SHALL 显示运行、暂停 / 重置、保存、校验结果和运行日志

### Requirement: 投射物参数按调试分组展示
SkillEditor SHALL organize current existing projectile parameters by projectile-debugging groups when a projectile event is selected.

#### Scenario: 选中投射物事件显示分组参数
- **WHEN** 用户选中投射物事件
- **THEN** 右侧参数面板 SHALL 按基础、发射位置、发射方向、目标搜索、发射组、运动、碰撞、伤害、表现、调试分组显示当前已有投射物参数

#### Scenario: 基础分组显示已有基础字段
- **WHEN** 投射物参数面板显示基础分组
- **THEN** 基础分组 SHALL 显示技能 ID、技能标签、行为模板、伤害类型、伤害形式和目标选择方式

#### Scenario: 发射位置分组显示已有发射字段
- **WHEN** 投射物参数面板显示发射位置分组
- **THEN** 发射位置分组 SHALL 显示只读发射来源、`spawn_offset.x`、`spawn_offset.y`、只读逻辑发射点和只读特效发射点

#### Scenario: 发射方向分组显示已有方向字段
- **WHEN** 投射物参数面板显示发射方向分组
- **THEN** 发射方向分组 SHALL 显示只读当前方向模式、`spread_angle_deg` 或 `spread_angle`、`angle_step`、只读 `direction_world` 和只读 `vfx_direction_world`

#### Scenario: 目标搜索分组显示已有目标字段
- **WHEN** 投射物参数面板显示目标搜索分组
- **THEN** 目标搜索分组 SHALL 显示 `cast.target_selector`、`cast.search_range`、`hit.target_policy` 和 `max_targets`

#### Scenario: 发射组分组显示已有发射组字段
- **WHEN** 投射物参数面板显示发射组分组
- **THEN** 发射组分组 SHALL 显示 `projectile_count`、`burst_interval_ms`、`spread_angle_deg` 或 `spread_angle`、`angle_step` 和 `spawn_pattern`

#### Scenario: 运动分组显示已有运动字段
- **WHEN** 投射物参数面板显示运动分组
- **THEN** 运动分组 SHALL 显示 `projectile_speed`、`max_distance`、`min_duration_ms` 和 `max_duration_ms`

#### Scenario: 碰撞分组显示已有碰撞字段
- **WHEN** 投射物参数面板显示碰撞分组
- **THEN** 碰撞分组 SHALL 显示 `projectile_width`、`projectile_height`、`collision_radius`、`projectile_radius`、`impact_radius`、`hit_policy` 和 `pierce_count`

#### Scenario: 伤害分组显示已有伤害字段
- **WHEN** 投射物参数面板显示伤害分组
- **THEN** 伤害分组 SHALL 显示 `hit.base_damage`、`per_projectile_damage_scale`、`damage_timing`、`hit_delay_ms`、`hit_radius`、`can_crit` 和 `can_apply_status`

#### Scenario: 表现分组显示已有表现字段
- **WHEN** 投射物参数面板显示表现分组
- **THEN** 表现分组 SHALL 显示 `cast_vfx_key`、`projectile_vfx_key`、`hit_vfx_key`、`vfx`、`sfx`、`floating_text`、`floating_text_style`、`screen_feedback`、`hit_stop_ms` 和 `camera_shake`

#### Scenario: 当前项目没有的 XML 字段不作为可编辑参数出现
- **WHEN** 投射物参数面板显示可编辑字段
- **THEN** 当前项目没有运行时能力的 XML 字段 SHALL NOT 出现在可编辑参数中

### Requirement: 投射物预览调试显示
SkillEditor SHALL provide UI-only projectile debug visualization for launch, target, direction, collision, and search range.

#### Scenario: 运行预览显示调试元素
- **WHEN** 用户运行投射物技能预览
- **THEN** 预览 SHALL 能显示发射点、目标点、飞行方向线、碰撞半径和搜索范围

#### Scenario: 区分逻辑发射点和特效发射点
- **WHEN** 调试显示开启发射点
- **THEN** 预览 SHALL 区分逻辑发射点和特效发射点

#### Scenario: 修改已有参数后运行预览验证效果
- **WHEN** 用户修改当前已有投射物参数后运行预览
- **THEN** 预览 SHALL 使用当前 draft 验证效果，并 SHALL NOT 要求保存后才能运行

#### Scenario: 调试开关不写入正式配置
- **WHEN** 用户切换显示发射点、显示目标点、显示飞行方向线、显示碰撞半径或显示搜索范围
- **THEN** 这些 UI-only 调试开关 SHALL NOT 写入正式 `skill.yaml`

### Requirement: 技能编辑器保存前中文校验
SkillEditor SHALL validate basic projectile editor input before save and display validation failures in Chinese.

#### Scenario: 保存前执行基础校验
- **WHEN** 用户点击保存技能包
- **THEN** 技能编辑器 SHALL 在写入配置前执行基础校验

#### Scenario: 校验错误中文显示
- **WHEN** 保存前校验失败
- **THEN** 技能编辑器 SHALL 在参数面板内用中文显示错误

#### Scenario: 保存失败不写入配置
- **WHEN** 保存前校验或后端 schema 校验失败
- **THEN** 技能编辑器 SHALL NOT 写入配置文件

#### Scenario: UI 状态不进入正式 skill.yaml
- **WHEN** 技能编辑器保存技能包
- **THEN** UI-only 调试开关、选中事件、面板展开状态、运行日志和暂停状态 SHALL NOT 写入正式 `skill.yaml`

### Requirement: 投射物面板重组不影响非目标模块
The projectile editor panel refactor SHALL NOT affect formal combat, gem board, loot, affixes, sudoku routing, or formal damage formula.

#### Scenario: 不影响正式战斗和正式伤害公式
- **WHEN** 本变更应用后运行正式战斗逻辑
- **THEN** 正式战斗和正式伤害公式 SHALL 保持既有行为

#### Scenario: 不影响宝石盘和数独规则
- **WHEN** 本变更应用后使用宝石盘和数独合法性检查
- **THEN** 宝石盘、数独合法性和数独路由 SHALL 保持既有行为

#### Scenario: 不影响掉落词缀和宝石规则
- **WHEN** 本变更应用后运行掉落、词缀、被动宝石、辅助宝石或导管相关流程
- **THEN** 这些流程 SHALL 保持既有行为

#### Scenario: 构建和测试通过
- **WHEN** 本变更完成
- **THEN** WebApp 构建、最小 smoke 测试和现有相关测试 SHALL 通过

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

### Requirement: 技能频率属性字段
系统 SHALL 使用明确分工的技能频率属性字段，并 SHALL NOT 在活动配置、Runtime、预览、校验或测试中继续使用 `cooldown_reduction_percent`。

#### Scenario: V1 频率字段清单
- **WHEN** V1 玩家属性、技能缩放规则、辅助宝石、词缀、预览或 Runtime 统计字段被校验
- **THEN** 系统 SHALL 支持 `attack_speed_add_percent`、`cast_speed_add_percent`、`skill_speed_final_percent`、`cooldown_recovery_add_percent`、`added_cooldown_ms` 和 `trigger_interval_ms`

#### Scenario: 旧字段禁用
- **WHEN** 活动配置、Runtime 代码路径、技能预览字段或 V1 校验规则引用 `cooldown_reduction_percent`
- **THEN** 校验 SHALL 失败并给出明确错误，说明应使用 `cooldown_recovery_add_percent`

#### Scenario: 字段含义
- **WHEN** 技能最终效果计算读取频率字段
- **THEN** `attack_speed_add_percent` SHALL 只影响 attack 标签技能，`cast_speed_add_percent` SHALL 只影响 spell 标签技能，`skill_speed_final_percent` SHALL 作为攻击和施法通用最终乘区，`cooldown_recovery_add_percent` SHALL 只影响真冷却恢复，`added_cooldown_ms` SHALL 作为固定冷却惩罚，`trigger_interval_ms` SHALL 只表示触发或检测间隔

### Requirement: 释放门槛间隔
系统 SHALL 将当前没有真实动作系统的“动作间隔”适配为内部释放门槛间隔，用于限制同一主动技能再次发起释放的基础节奏。

#### Scenario: 攻击技能释放门槛
- **WHEN** 主动技能带有 attack 标签并存在基础释放间隔
- **THEN** 系统 SHALL 使用 `BaseAttackIntervalMs / (1 + attack_speed_add_percent / 100) / (1 + skill_speed_final_percent / 100)` 计算攻击释放间隔，并 SHALL NOT 读取 `cast_speed_add_percent` 修正该间隔

#### Scenario: 法术技能释放门槛
- **WHEN** 主动技能带有 spell 标签并存在基础释放间隔
- **THEN** 系统 SHALL 使用 `BaseCastIntervalMs / (1 + cast_speed_add_percent / 100) / (1 + skill_speed_final_percent / 100)` 计算施法释放间隔，并 SHALL NOT 读取 `attack_speed_add_percent` 修正该间隔

#### Scenario: 释放门槛不代表动画动作
- **WHEN** 玩家查看技能预览、Debug 输出或中文说明
- **THEN** 系统 SHALL 使用“基础释放间隔”“攻击释放间隔”“施法释放间隔”或“实际释放间隔”等中文文案，且 SHALL NOT 暗示项目新增了动画动作、前摇或后摇系统

### Requirement: 冷却回复速度公式
系统 SHALL 使用冷却回复速度口径计算真冷却，并 SHALL 在冷却回复计算后追加附加冷却。

#### Scenario: 冷却回复不会把冷却归零
- **WHEN** `BaseCooldownMs = 10000`、`cooldown_recovery_add_percent = 100` 且 `added_cooldown_ms = 0`
- **THEN** `FinalCooldownMs` SHALL 为 `5000`，而不是 `0`

#### Scenario: 附加冷却在冷却回复后追加
- **WHEN** `BaseCooldownMs = 10000`、`cooldown_recovery_add_percent = 100` 且 `added_cooldown_ms = 1000`
- **THEN** `FinalCooldownMs` SHALL 为 `6000`

#### Scenario: 冷却下限
- **WHEN** 技能存在真冷却侧约束并计算得到的 `FinalCooldownMs` 小于 `100`
- **THEN** 系统 SHALL 将 `FinalCooldownMs` 限制为至少 `100`

#### Scenario: 无真冷却技能不被冷却下限强加冷却
- **WHEN** 技能没有真冷却且 `added_cooldown_ms = 0`
- **THEN** 系统 SHALL NOT 因冷却下限给该技能额外添加 `100ms` 真冷却

### Requirement: 实际释放间隔
系统 SHALL 将实际释放频率计算为释放门槛和真冷却中更慢的一侧。

#### Scenario: 同时存在释放门槛和冷却
- **WHEN** `ActionIntervalMs = 500` 且 `FinalCooldownMs = 2000`
- **THEN** `ActualIntervalMs` SHALL 为 `2000`

#### Scenario: 只有冷却没有释放门槛
- **WHEN** 主动技能只有真冷却配置而没有 attack 或 spell 释放门槛
- **THEN** 系统 SHALL 使用 `FinalCooldownMs` 作为 `ActualIntervalMs`

#### Scenario: 只有释放门槛没有冷却
- **WHEN** 主动技能有 attack 或 spell 释放门槛且没有真冷却
- **THEN** 系统 SHALL 使用释放门槛间隔作为 `ActualIntervalMs`

#### Scenario: 每秒释放次数
- **WHEN** `ActualIntervalMs` 大于 `0`
- **THEN** `ActualUsesPerSecond` SHALL 使用 `1000 / ActualIntervalMs` 计算

#### Scenario: 战斗自动释放使用实际释放间隔
- **WHEN** Combat Runtime 自动释放已激活主动技能
- **THEN** Combat Runtime SHALL 使用最终技能实例的 `actual_interval_ms` 调度下一次释放，而不是使用只表示真冷却侧的 `final_cooldown_ms`

### Requirement: 触发间隔独立
系统 SHALL 将 `trigger_interval_ms` 作为触发或检测轮询间隔，并 SHALL NOT 默认将它作为冷却或释放门槛参与实际释放频率计算。

#### Scenario: 触发间隔不受冷却回复影响
- **WHEN** `trigger_interval_ms = 500` 且 `cooldown_recovery_add_percent = 100`
- **THEN** `TriggerIntervalMs` SHALL 仍为 `500`

#### Scenario: 触发间隔单独显示
- **WHEN** 技能存在 `trigger_interval_ms`
- **THEN** 技能预览和 Debug 输出 SHALL 单独显示“触发间隔”，并 SHALL NOT 将它显示为“冷却”或“最终冷却”

### Requirement: 冷却回复支持宝石与随机词缀
系统 SHALL 将所有冷却缩减类支持宝石和可生成随机词缀迁移为冷却回复速度口径。

#### Scenario: 冷却专注辅助宝石
- **WHEN** `support_cooldown_focus` 应用到匹配的主动技能或被动贡献路径
- **THEN** 它 SHALL 提供 `cooldown_recovery_add_percent` 修正，并 SHALL NOT 提供 `cooldown_reduction_percent`

#### Scenario: 附加冷却代价保留
- **WHEN** 辅助宝石或词缀提供 `added_cooldown_ms`
- **THEN** 系统 SHALL 保留该固定冷却惩罚，并以中文显示“附加冷却 +X 毫秒”

#### Scenario: 随机词缀不生成旧字段
- **WHEN** V1 随机词缀候选、白名单或词缀配置被校验
- **THEN** `affix.stat` SHALL NOT 引用 `cooldown_reduction_percent`，并 SHALL 使用 `cooldown_recovery_add_percent` 表示冷却回复速度词缀

### Requirement: 技能频率预览与中文文案
系统 SHALL 在技能最终预览、tooltip、Debug 输出和本地化中展示新的技能频率字段，并 SHALL 保证玩家可见文本为中文。

#### Scenario: 技能预览显示频率拆解
- **WHEN** 玩家查看主动技能最终预览
- **THEN** 系统 SHALL 能展示基础释放间隔、攻击速度提高、施法速度提高、最终技能速度、基础冷却、冷却回复速度、附加冷却、最终冷却、实际释放间隔和每秒释放次数

#### Scenario: 触发间隔文案
- **WHEN** 技能存在 `trigger_interval_ms`
- **THEN** 系统 SHALL 使用中文文案“触发间隔”单独展示该值

#### Scenario: 冷却回复中文本地化
- **WHEN** 玩家查看属性、辅助宝石、词缀或技能预览
- **THEN** 系统 SHALL 使用“冷却回复速度提高 +X%”描述 `cooldown_recovery_add_percent`

#### Scenario: 旧冷却缩减文案不再玩家可见
- **WHEN** 玩家查看属性面板、宝石详情、词缀说明、技能预览、HUD 或 Debug 可见文本
- **THEN** 系统 SHALL NOT 显示“冷却缩减”作为活动字段文案

### Requirement: 主动技能释放链条与魔力消耗
系统 SHALL 为每个主动技能宝石定义真实生效的释放链条和最小魔力消耗，并 SHALL 在释放时检查和扣除魔力。

#### Scenario: 主动技能释放链条
- **WHEN** Combat Runtime 自动调度一个已激活主动技能
- **THEN** 系统 SHALL 按 `actual_interval_ms` 判断是否到期，检查 `mana_cost` 是否可支付，支付魔力后调用 Skill Runtime 生成该技能的真实 SkillEvents

#### Scenario: 魔力不足不释放
- **WHEN** 主动技能到达释放时间但玩家当前魔力小于该技能的 `mana_cost`
- **THEN** 系统 SHALL NOT 生成该次释放的 SkillEvents，SHALL NOT 造成该次技能伤害，并 SHALL 保留可供 Debug 或日志说明的魔力不足状态

#### Scenario: 魔力消耗显示在宝石信息
- **WHEN** 玩家查看主动技能宝石详情、技能预览或 Debug 输出
- **THEN** 系统 SHALL 使用中文显示该技能的魔力消耗

#### Scenario: 不扩展复杂魔力系统
- **WHEN** 本变更实现魔力消耗
- **THEN** 系统 SHALL NOT 新增装备魔力词缀、魔力保留、复杂消耗倍率、按命中回蓝或技能树资源节点

### Requirement: 宝石效果重新规划
系统 SHALL 按新释放频率、冷却回复、触发间隔和魔力消耗口径整理现有主动技能宝石、被动技能宝石和辅助技能宝石的效果。

#### Scenario: 主动技能宝石释放配置完整
- **WHEN** V1 主动技能宝石配置被校验
- **THEN** 每个主动技能 SHALL 明确 attack 或 spell 释放来源、基础释放间隔、真冷却配置、触发间隔配置、魔力消耗、Skill Runtime 行为模板和预览字段

#### Scenario: 被动技能宝石不生成释放链条
- **WHEN** V1 被动技能宝石配置被校验或进入最终技能计算
- **THEN** 被动技能宝石 SHALL NOT 生成主动释放实例，且其贡献只能通过玩家属性或主动技能 modifier 进入最终结果

#### Scenario: 辅助技能宝石效果字段符合新口径
- **WHEN** V1 辅助技能宝石配置被校验
- **THEN** 辅助技能宝石 SHALL 使用新合法字段表达攻击速度、施法速度、最终技能速度、冷却回复速度、附加冷却、魔力消耗或既有伤害/范围/投射物效果，并 SHALL NOT 使用 `cooldown_reduction_percent`

#### Scenario: 宝石效果规划不改变范围外规则
- **WHEN** 宝石效果按新口径调整完成
- **THEN** 数独盘合法性、宝石连接/路由规则、技能 VFX/动画资源、装备系统和护甲抗性系统 SHALL 保持不变

### Requirement: 技能频率迁移验收
系统 SHALL 通过针对技能频率迁移的测试，证明攻击速度、施法速度、冷却回复速度、附加冷却、实际释放间隔和触发间隔互不混淆。

#### Scenario: 攻击技能只吃攻击速度
- **WHEN** attack 技能获得 `attack_speed_add_percent`
- **THEN** 释放间隔 SHALL 降低；当同一 attack 技能只获得 `cast_speed_add_percent` 时，释放间隔 SHALL 不受影响

#### Scenario: 法术技能只吃施法速度
- **WHEN** spell 技能获得 `cast_speed_add_percent`
- **THEN** 释放间隔 SHALL 降低；当同一 spell 技能只获得 `attack_speed_add_percent` 时，释放间隔 SHALL 不受影响

#### Scenario: 配置无旧字段残留
- **WHEN** 迁移完成后扫描活动配置、Runtime、校验和测试
- **THEN** 系统 SHALL 不再出现 `cooldown_reduction_percent` 活动引用；若出现，校验 SHALL 失败或测试 SHALL 失败

#### Scenario: 魔力消耗真实生效
- **WHEN** 玩家当前魔力足够释放主动技能
- **THEN** Combat Runtime SHALL 扣除该技能的 `mana_cost` 并生成释放事件；当魔力不足时 SHALL 不扣除负数魔力且不生成释放事件

#### Scenario: 不改动范围外模块
- **WHEN** 本变更完成
- **THEN** 技能表现/VFX/动画资源、数独盘规则、宝石连接规则、装备系统、护甲抗性系统和非相关技能数值平衡 SHALL 保持未被本变更修改

### Requirement: TLIDB source skill content
The system SHALL use TLIDB scraped Torchlight: Infinite skill data as the source of truth for adopted first-version skill content and SHALL preserve traceability from runtime config back to the scraped source.

#### Scenario: Source data is preserved
- **WHEN** an adopted TLIDB active, support, or passive/aura skill definition is validated
- **THEN** it SHALL contain `source_values` metadata with TLIDB source, TLIDB ID, display level, raw source lines or equivalent references, parsed source values, and source anchors used to build runtime values

#### Scenario: Project-invented values are rejected
- **WHEN** an adopted TLIDB skill has source values available from `tlidb_skills/skills_for_ai.md` or `tlidb_skills/skills_for_ai.jsonl`
- **THEN** first-version config SHALL replicate those values or document a runtime-equivalent adaptation, and SHALL NOT replace them with project-invented damage, multiplier, duration, cooldown, projectile count, chain count, conversion, or status values

#### Scenario: Old project content is excluded
- **WHEN** V1 product skill lists, drop pools, default boards, UI inventories, reports, or acceptance tests enumerate first-version content
- **THEN** they SHALL use the adopted TLIDB content set and SHALL NOT treat previous project skill gems as required product content

### Requirement: TLIDB skill level tables
The system SHALL calculate adopted active, support, and passive/aura skill values from level tables covering internal skill levels 1-40.

#### Scenario: Level table range
- **WHEN** an adopted TLIDB skill definition is validated
- **THEN** it SHALL define a runtime-readable `level_table` for levels 1 through 40 and SHALL NOT rely on a single level 20 value for runtime calculation

#### Scenario: Gem level exposure
- **WHEN** player-facing gem levels, drop rules, inventory, or gem detail UI display adopted TLIDB gems
- **THEN** normal gem levels SHALL be limited to 1-20 while internal levels 21-40 SHALL be reserved for `+skill level` effects or future advanced variants

#### Scenario: Level 20 anchor
- **WHEN** TLIDB scraped card values are converted into `level_table`
- **THEN** the card values SHALL be treated as level 20 anchors unless explicit TLIDB source anchors state otherwise

#### Scenario: Explicit TLIDB anchors
- **WHEN** TLIDB source text includes anchors such as `(Lv1:)`, `(Lv21:)`, or `(Lv41:)`
- **THEN** the generated `level_table` SHALL use those anchors before fallback interpolation or extension rules

#### Scenario: Field-type generation rules
- **WHEN** generating levels outside explicit anchors
- **THEN** linear percentages and damage ranges SHALL interpolate or extend numerically, integer counts SHALL use step tables, fixed mechanics SHALL remain fixed, duration/cooldown/interval values SHALL change only when anchored, and probabilities SHALL stay fixed unless anchored

### Requirement: Automatic-release adaptation
The system SHALL only adopt active skills that can be represented as deterministic automatic combat behavior without manual player aiming, timing, movement, or hold-to-channel input.

#### Scenario: Adopted active targeting
- **WHEN** Combat Runtime automatically releases an adopted TLIDB active skill
- **THEN** the skill SHALL use a configured automatic target policy such as nearest enemy, enemy cluster center, self center, duration window, periodic trigger, or defensive threshold trigger

#### Scenario: Channel skills become duration windows
- **WHEN** an adopted TLIDB skill is originally a channeling skill such as `Whirlwind` or `Thundercloud`
- **THEN** V1 SHALL adapt it to an automatic duration window with configured tick interval, stack or layer semantics, and end-of-window behavior while preserving TLIDB source values

#### Scenario: Defensive skills use thresholds or cadence
- **WHEN** an adopted defensive active such as `Stoneskin` is available for automatic release
- **THEN** Combat Runtime SHALL trigger it by configured low-life, low-shield, or periodic conditions and SHALL preserve TLIDB absorb, duration, cooldown, and cost values

#### Scenario: Unsuitable active families are omitted
- **WHEN** adopted active skills are validated or reported
- **THEN** the system SHALL mark pure movement skills, movement attacks, potions, complex summons, and strongly manual ground-placement skills as omitted from first-version automatic release

### Requirement: Adopted TLIDB active skills
The system SHALL implement the adopted active skill set as first-version playable build options with TLIDB mechanics preserved as closely as the current runtime allows.

#### Scenario: Adopted active count
- **WHEN** adopted active skill content is counted
- **THEN** the count SHALL be 16 TLIDB active skills

#### Scenario: Projectile and ranged active family
- **WHEN** adopted projectile or ranged active skills are validated
- **THEN** `Split_Firebolt`, `Ice_Shot`, `Chromatic_Shot`, `Lightning_Shot`, `Corrosive_Shot`, `Burning_Shot`, `Rain_of_Arrows`, and `Sparkle` SHALL keep their TLIDB projectile counts, split/chain/pierce/targeting semantics, conversion values, and damage values through level tables

#### Scenario: Area and spell active family
- **WHEN** adopted area or spell active skills are validated
- **THEN** `Blizzard`, `Chain_Lightning`, `Ring_of_Ice`, `Thundercloud`, and `Black_Hole` SHALL keep their TLIDB wave, chain, nova, tick, control, duration, and damage values through level tables

#### Scenario: Melee and defensive active family
- **WHEN** adopted melee or defensive active skills are validated
- **THEN** `Whirlwind`, `Flame_Slash`, and `Stoneskin` SHALL keep their TLIDB weapon-damage, slash, hit, guard, absorb, duration, cooldown, and mana-cost values through level tables

### Requirement: TLIDB support classification and sudoku routing
The system SHALL map adopted TLIDB support gems into the current project support categories while preserving sudoku-board routing as the way support effects reach active or passive gems.

#### Scenario: Adopted support count
- **WHEN** adopted TLIDB support content is counted
- **THEN** the count SHALL be exactly 30 TLIDB-sourced support gems, excluding project-owned board conduits

#### Scenario: General support category
- **WHEN** support category `general_skill_modifier` is validated
- **THEN** it SHALL include `Multistrike`, `Quick_Decision`, `Cooldown_Reduction`, `Critical_Strike_Rating_Increase`, `Critical_Strike_Damage_Increase`, `Channel_Preparation`, `Control_Spell`, `Overload`, and `Melee_Knockback`

#### Scenario: Damage type support category
- **WHEN** support category `damage_type_enhancer` is validated
- **THEN** it SHALL include `High_Voltage`, `Glacial_Freeze`, `Additional_Ignite`, `Physical_to_Fire`, `Lightning_to_Cold`, `Added_Fire_Damage`, `Added_Cold_Damage`, `Added_Lightning_Damage`, `Added_Erosion_Damage`, `Elemental_Fusion`, `Tendonslicer`, and `Improved_Corrosion`

#### Scenario: Projectile and area support category
- **WHEN** support category `projectile_area_specialist` is validated
- **THEN** it SHALL include `Multiple_Projectiles`, `Projectile_Split`, `Increased_Area`, and `Jump`

#### Scenario: Risk reward support category
- **WHEN** support category `risk_reward` is validated
- **THEN** it SHALL include `Spell_Concentration`, `Shortened_Duration`, `Guard`, and `Slow_Projectile`

#### Scenario: Skill shape support category
- **WHEN** support category `skill_shape_modifier` is validated
- **THEN** it SHALL include `Raging_Slash`

#### Scenario: Skill level support category is empty
- **WHEN** first-version TLIDB support categories are validated
- **THEN** `skill_level` SHALL contain zero adopted TLIDB supports for this change

#### Scenario: Board conduits remain separate
- **WHEN** project-owned support category `board_conduit` is validated
- **THEN** it SHALL include `support_row_conduit`, `support_column_conduit`, and `support_box_conduit`, and these 3 supports SHALL NOT be counted inside the 30 TLIDB support skills

#### Scenario: Support routing order
- **WHEN** a TLIDB support modifies an active or passive gem
- **THEN** the system SHALL calculate the support's TLIDB level value first, then apply sudoku relation, source power, target power, and conduit scaling before producing final skill effects

### Requirement: Adopted TLIDB passive and aura gems
The system SHALL model adopted TLIDB passive/aura skills as passive skill gems that contribute through player stats or passive-to-active routes rather than automatic release.

#### Scenario: Adopted passive count
- **WHEN** adopted passive/aura content is counted
- **THEN** the count SHALL be 9 TLIDB passive/aura gems

#### Scenario: Passive list
- **WHEN** adopted passive/aura skill content is validated
- **THEN** it SHALL include 姝﹀櫒澧炲箙, 娉曟湳澧炲箙, 绮惧噯鎶曞皠, 鐙傜寷, 鍐嶇敓, 鑳介噺澹佸瀿, 鐢佃兘杞寲, 鍐板瘨棰嗗煙, and 榄旀簮

#### Scenario: No mana reservation system
- **WHEN** adopted TLIDB aura-like passive gems are active on the board
- **THEN** V1 SHALL NOT introduce a mana reservation or mana seal system for them in this change

#### Scenario: Passive contribution route
- **WHEN** final active skill effects are calculated
- **THEN** adopted passive/aura gems SHALL contribute through `passive_skill -> active_skill` routes or self-stat contributions and SHALL NOT generate `FinalSkillInstance` outputs

### Requirement: Adopted and omitted scope reporting
The system SHALL provide a human-readable report or document that states what TLIDB skill content was adopted, what was omitted, and why.

#### Scenario: Adopted scope report
- **WHEN** content reports are generated after this change
- **THEN** they SHALL show 16 active skills, 30 TLIDB support skills, 9 passive/aura skills, 3 project-owned board conduit supports, and a total of 55 TLIDB content gems plus 3 board conduits

#### Scenario: Omitted scope report
- **WHEN** omitted TLIDB skill families are reported
- **THEN** the report SHALL include pure movement, movement attacks, potions, complex summons, precise manual ground skills, full class/equipment/talent/season systems, and full TLIDB import as not implemented in this version

#### Scenario: Source and final value visibility
- **WHEN** reports, skill detail UI, or debug previews display adopted TLIDB skill effects
- **THEN** they SHALL be able to show TLIDB source values, current level-table values, sudoku-routed modifiers, and final computed skill values in Chinese player-visible text where applicable

### Requirement: Gem effect matrix coverage
The system SHALL provide automated test coverage that derives the active skill, passive skill, and support gem matrix from loaded gem definitions rather than from stale hard-coded legacy gem lists.

#### Scenario: Matrix enumerates current gems
- **WHEN** the gem effect matrix tests run
- **THEN** they SHALL enumerate active, passive, and support gems from `load_gem_definitions(config_root)` and SHALL NOT require removed obsolete gem IDs.

#### Scenario: Support eligibility uses explicit filters
- **WHEN** a support gem is evaluated against an active or passive target gem
- **THEN** the matrix SHALL determine eligibility using `apply_filter.target_kinds`, `apply_filter.tags_any`, `apply_filter.tags_all`, and `apply_filter.tags_none`.

#### Scenario: Filter mismatch is proven inactive
- **WHEN** a support gem does not match a target gem's explicit filters
- **THEN** the tests SHALL prove that the support does not produce an applied support modifier for that target.

### Requirement: Support-to-active effect proof
The system SHALL test each eligible support-to-active pair according to the concrete support stats and the active skill mechanics that can consume those stats.

#### Scenario: Scalar support changes final skill output
- **WHEN** an eligible support gem contributes scalar stats to an active skill
- **THEN** the tests SHALL verify the corresponding `FinalSkillInstance` fields, skill stats, damage components, damage conversions, ailments, or runtime params changed in the expected direction or value.

#### Scenario: Behavior support reaches canonical runtime
- **WHEN** an eligible support gem changes projectile count, split, bounce, chain, area, duration, channel, guard, status, forced movement, or damage-event behavior
- **THEN** the tests SHALL verify the effect through `SkillRuntime`, `CombatSession`, or `V1WebAppApi.runtime_skill_events`, including emitted events, timing, targets, damage, status, buffs, or player/monster state as applicable.

#### Scenario: Calculation payload alone is insufficient for behavior support
- **WHEN** a support gem changes actual gameplay behavior
- **THEN** tests SHALL NOT treat config payload presence or `applied_modifiers` presence alone as sufficient proof.

### Requirement: Support-to-passive effect proof
The system SHALL test each eligible support-to-passive pair by distinguishing filter eligibility from whether the passive's actual contribution stats can consume the support effect.

#### Scenario: Compatible support modifies passive contribution
- **WHEN** an eligible support gem has a stat compatible with a passive gem's `passive_effects` or conduit level route
- **THEN** the tests SHALL verify a support-to-passive modifier is applied before the passive-to-active or self-stat contribution is calculated.

#### Scenario: Passive downstream result changes
- **WHEN** a compatible support modifies a passive gem that contributes to an active skill or player stat
- **THEN** the tests SHALL verify the downstream final skill output or player stat output changes accordingly.

#### Scenario: Filter match without compatible stat is no-op
- **WHEN** a support gem filter matches a passive gem but the support has no stat consumed by that passive's actual effects
- **THEN** the tests SHALL assert that no support-to-passive modifier is applied and SHALL report the pair as an expected no-effect case rather than a failure.

### Requirement: Verification surfaces for gem matrix tests
The system SHALL keep gem matrix verification on canonical runtime paths and SHALL NOT use disabled tooling surfaces as proof.

#### Scenario: Skill editor remains excluded
- **WHEN** gem matrix tests or reports are implemented
- **THEN** they SHALL NOT navigate to `/skill-editor`, call enabled skill-editor save or preview behavior, use `?skill_editor=1`, use `view=skill_editor`, start port `8765`, or use `dist-skill-editor`.

#### Scenario: Disabled test arena is not acceptance evidence
- **WHEN** skill behavior is verified for the matrix
- **THEN** disabled test arena helpers SHALL NOT be used as acceptance evidence for playable behavior.

#### Scenario: Frontend-affecting changes require playable WebApp verification
- **WHEN** implementation of this change alters frontend rendering, WebApp battle presentation, VFX timing, or visible gameplay behavior
- **THEN** the change SHALL be verified in the playable WebApp battle view with a screenshot stored outside the repository root under `artifacts/screenshots/`.

