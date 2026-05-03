## Context

当前 V1 技能没有真实角色动作系统，也没有按动画帧推进的攻击/施法动作。现有 `cast.cooldown_ms` 实际承担的是自动释放节奏，而不是严格意义上的真冷却；`SkillEffectCalculator` 又把攻击/施法速度、最终技能速度、附加冷却和 `cooldown_reduction_percent` 一起折算进 `final_cooldown_ms`。

目标口径需要接近《火炬之光：无限》：攻击速度/施法速度影响释放频率，冷却回复速度影响冷却恢复，二者同时存在时由更慢的一侧限制实际释放频率。由于本项目没有动作表现，本设计把“动作间隔”适配为“释放门槛间隔”，只作为 Runtime 调度概念，不引入动画、VFX 或动作资源。

## Goals / Non-Goals

**Goals:**

- 用 `cooldown_recovery_add_percent` 替代 `cooldown_reduction_percent`。
- 将技能频率拆为三类互不混淆的时间：
  - 释放门槛间隔：受攻击/施法速度和最终技能速度影响。
  - 真冷却：受冷却回复速度和附加冷却影响。
  - 触发间隔：控制触发/检测轮询频率，默认不受冷却回复速度影响。
- 保持现有技能数值不做平衡调整，只迁移字段语义和公式。
- 为现有所有主动、被动、辅助宝石重新整理与释放频率、冷却回复、触发间隔和资源消耗相关的效果定义。
- 为主动技能新增最小魔力消耗：配置 `mana_cost`，释放时扣除，魔力不足时不释放，并在宝石信息中展示。
- 让最终技能实例、预览、Debug、校验和测试都能解释新口径。
- 玩家可见文案和审阅 Markdown 使用中文。

**Non-Goals:**

- 不新增动作、动画、前摇、后摇或 VFX 资源。
- 不修改数独盘规则、宝石连接规则、掉落系统或技能伤害平衡。
- 不新增装备、护甲抗性、职业或复杂技能树系统。
- 不实现复杂魔力系统：不做魔力保留、魔力消耗倍率、装备词缀、按命中回蓝或技能树资源节点。
- 不把 `trigger_interval_ms` 默认当作冷却或释放间隔。

## Decisions

### 1. 将“动作间隔”落地为“释放门槛间隔”

内部可继续用 `ActionIntervalMs` 作为公式名，但配置、预览和中文 UI 优先使用“基础释放间隔 / 攻击释放间隔 / 施法释放间隔 / 实际释放间隔”。这避免玩家误解为项目存在动画动作系统。

备选方案是先新增完整动作系统，再接入攻击/施法速度。该方案超出范围，会修改表现和 Runtime 边界，因此不采用。

### 2. 将现有 `cast.cooldown_ms` 迁移为基础释放门槛

现有主动技能都依赖 `cast.cooldown_ms` 维持自动释放节奏。为避免顺手调数值，迁移时保留这些毫秒值，但把语义从“基础冷却”改为“基础释放间隔”：

- attack 标签技能读取为 `BaseAttackIntervalMs`。
- spell 标签技能读取为 `BaseCastIntervalMs`。
- 如果技能既没有 attack 也没有 spell 标签，则没有动作/释放门槛侧频率。

实现时可以在 schema 中新增 `release_interval_ms`，并用一次性配置迁移把原 `cast.cooldown_ms` 值搬过去。若为了兼容短期保留读取旧字段，旧字段不得继续作为真冷却参与新公式。

### 3. 新增独立真冷却字段

真冷却独立于释放门槛。建议在技能配置中新增 `base_cooldown_ms`，默认 0。普通循环技能可以没有真冷却；需要硬锁释放频率的技能才配置大于 0 的值。

公式为：

```text
FinalCooldownMs =
BaseCooldownMs / (1 + cooldown_recovery_add_percent / 100)
+ added_cooldown_ms

FinalCooldownMs = max(100, FinalCooldownMs)  // 仅当技能存在真冷却或附加冷却后有冷却侧约束
```

`added_cooldown_ms` 在冷却回复后追加。`cooldown_recovery_add_percent = 100` 会让 10000ms 变为 5000ms，而不是 0。

### 4. 实际释放频率取更慢的一侧

释放门槛间隔公式：

```text
AttackIntervalMs =
BaseAttackIntervalMs
/ (1 + attack_speed_add_percent / 100)
/ (1 + skill_speed_final_percent / 100)

CastIntervalMs =
BaseCastIntervalMs
/ (1 + cast_speed_add_percent / 100)
/ (1 + skill_speed_final_percent / 100)
```

实际释放间隔：

```text
ActualIntervalMs = max(ReleaseGateIntervalMs, FinalCooldownMs)
ActualUsesPerSecond = 1000 / ActualIntervalMs
```

如果技能只有真冷却，没有 attack/cast 释放门槛，则实际释放间隔使用真冷却。如果技能没有真冷却，则实际释放间隔使用释放门槛。

### 5. 触发间隔只控制触发/检测频率

`trigger_interval_ms` 是触发或检测轮询间隔，不是冷却，也不是释放门槛。默认不受 `cooldown_recovery_add_percent` 影响。只有后续配置显式声明某个触发间隔可被特定属性修正时，才允许进入触发间隔公式；本变更不实现这种例外。

### 6. 最终技能实例需要暴露可解释字段

`FinalSkillInstance` 除现有伤害和 Runtime 参数外，应暴露或可序列化以下字段：

- `base_release_interval_ms`
- `release_interval_ms`
- `base_cooldown_ms`
- `final_cooldown_ms`
- `actual_interval_ms`
- `uses_per_second`
- `trigger_interval_ms`
- `attack_speed_add_percent`
- `cast_speed_add_percent`
- `skill_speed_final_percent`
- `cooldown_recovery_add_percent`
- `added_cooldown_ms`
- `mana_cost`
- `can_pay_mana` 或等价 Runtime 判断结果

其中 `final_cooldown_ms` 只表示真冷却侧结果，不再混合释放门槛速度；战斗自动释放队列应使用 `actual_interval_ms`。

### 7. 主动技能释放链条必须显式

每个主动技能应声明或可推导其释放链条：

```text
Combat Runtime 自动调度
-> 检查 actual_interval_ms 是否到期
-> 检查 mana_cost 是否可支付
-> 扣除魔力
-> 调用 Skill Runtime 生成 SkillEvents
-> 按 actual_interval_ms 安排下一次尝试
```

投射物、连锁、近战扇形、范围、轨道、延迟区域等技能继续使用现有 Skill Runtime 事件链，不新增表现资源。主动技能配置只补充释放节奏、真冷却、触发间隔和魔力成本。

### 8. 宝石效果规划边界

本变更允许重新规划现有主动、被动、辅助宝石的效果字段，使它们符合新频率和资源口径。调整原则：

- 主动技能：明确 attack/spell 标签、基础释放间隔、真冷却、触发间隔、魔力消耗和预览字段。
- 被动技能：可以提供玩家属性或主动技能贡献，但不得生成主动释放实例。
- 辅助技能：可以改变攻击速度、施法速度、最终技能速度、冷却回复速度、附加冷却、伤害或范围等既有允许字段；若引入魔力相关辅助，只能影响本变更定义的最小魔力消耗字段。
- 不新增宝石连接规则、不改变数独路由、不新增装备或复杂资源系统。

## Risks / Trade-offs

- `final_cooldown_ms` 语义改变 → 通过新增 `actual_interval_ms` 并更新预览/测试降低误读风险。
- 旧报告或归档文档仍含 `cooldown_reduction_percent` → 活动配置、Runtime、测试和玩家可见文案必须清零；归档历史可保留，不作为实现残留。
- 现有 `cooldown_ms` 字段语义迁移可能影响编辑器 → 通过 schema、编辑器字段文案和保存校验同时迁移，避免前端继续把释放门槛显示成冷却。
- `max(100, FinalCooldownMs)` 对无真冷却技能可能误加 100ms → 仅当存在真冷却侧约束时应用冷却下限；纯释放门槛技能不因为下限获得额外冷却。
- 攻击/施法标签缺失会导致释放门槛不可计算 → 校验主动技能必须明确 attack 或 spell，或显式配置仅冷却释放模式。
- 魔力不足可能让自动战斗看似“卡住” → 战斗日志、Debug 或预览应能说明魔力不足导致跳过释放；基础魔力回复仍使用现有 `mana_regen_flat`。
- 重新规划宝石效果容易变成平衡重做 → 只调整频率、冷却、触发、魔力和字段口径；伤害、范围、投射数量等既有数值不做无关优化。

## Migration Plan

1. 配置字段迁移：新增 `cooldown_recovery_add_percent`、`trigger_interval_ms`、基础释放间隔和真冷却字段，删除活动配置里的 `cooldown_reduction_percent`。
2. Runtime 迁移：拆分释放门槛、真冷却、实际释放间隔和触发间隔计算。
3. 魔力消耗迁移：主动技能配置 `mana_cost`，最终技能实例暴露该值，Combat Runtime 在释放前检查并扣除魔力。
4. 宝石效果迁移：逐个检查主动、被动、辅助宝石，明确释放链条和新字段效果。
5. 预览迁移：展示基础释放间隔、攻击/施法速度、最终技能速度、基础冷却、冷却回复速度、附加冷却、最终冷却、实际释放间隔、每秒释放次数、触发间隔和魔力消耗。
6. 校验迁移：配置校验禁止活动配置引用 `cooldown_reduction_percent`，并要求中文本地化存在。
7. 测试迁移：补充攻击/施法速度隔离、冷却回复公式、附加冷却顺序、实际间隔取 max、触发间隔不受冷却回复影响、魔力不足不释放、旧字段禁用测试。

## Open Questions

- 是否要在实现中彻底移除 `cast.cooldown_ms`，还是保留短期兼容读取并在保存时写入新字段？推荐彻底迁移配置，避免双字段语义长期并存。
- 普通循环技能默认 `base_cooldown_ms = 0` 后，技能预览是否仍显示“基础冷却 0 毫秒”，还是隐藏无真冷却项？推荐 Debug 显示，玩家 tooltip 可隐藏 0 值。
