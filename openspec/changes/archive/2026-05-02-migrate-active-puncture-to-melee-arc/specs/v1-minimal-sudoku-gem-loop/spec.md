## ADDED Requirements

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
