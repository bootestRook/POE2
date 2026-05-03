## 0. Phase 0: 现状扫描与已迁移技能模板能力确认

- [x] 0.1 目标：确认 `migrate-active-frost-nova-to-player-nova` 已完成并归档，记录当前 active changes 状态，确认已迁移 Skill Package 至少包含 `active_fire_bolt` / `active_ice_shards` / `active_penetrating_shot` / `active_frost_nova`，确认 `active_puncture` 仍走旧 `skill_templates.toml` 路径，并确认 SkillEditor、Skill Test Arena、SkillEvent 时间线、AI 自测报告能力仍可作为迁移模板；允许修改范围：只读 OpenSpec 状态、`configs/skills/active/`、`configs/gems/active_skill_gems.toml`、`configs/skills/skill_templates.toml`、现有 SkillEditor/Test Arena/timeline/report 能力；禁止越界事项：不得创建 `active_puncture/skill.yaml`，不得改 runtime/WebApp/正式掉落/库存/宝石盘；验收标准：记录归档状态、active changes、已迁移 package 清单、旧路径证据和模板能力证据；推荐验证命令：`cmd /c openspec list --json`、`Get-ChildItem configs\skills\active -Directory`、`Select-String -Path configs\gems\active_skill_gems.toml -Pattern "active_puncture","skill_puncture"`、`Select-String -Path configs\skills\skill_templates.toml -Pattern "skill_puncture"`。

## 1. Phase 1: `melee_arc` schema / behavior template 设计

- [x] 1.1 目标：新增并校验 `configs/skills/behavior_templates/melee_arc.yaml` 字段白名单；允许修改范围：behavior template 配置、`configs/skills/schema/skill.schema.json`、`src/liufang/config.py`、`tools/validate_v1_configs.py`、相关配置测试；禁止越界事项：不得引入脚本、表达式 DSL、复杂表达式解释器、未声明参数透传或前端专属假参数；验收标准：字段至少包含 `arc_angle`、`arc_radius`、`windup_ms`、`hit_at_ms`、`max_targets`、`facing_policy`、`hit_shape`、`status_chance_scale`、`slash_vfx_key`，并校验角度、正半径、非负时序、`hit_at_ms` 与 `windup_ms` 的合法关系、目标上限、枚举、范围和 key-only VFX；推荐验证命令：`python tools\validate_v1_configs.py`、`python -m unittest tests.test_skill_editor -v`。

## 2. Phase 2: `active_puncture` Skill Package 创建

- [x] 2.1 目标：创建未来路径 `configs/skills/active/active_puncture/skill.yaml` 并迁移穿刺；允许修改范围：`active_puncture` Skill Package、必要中文本地化 key、配置加载/校验的最小适配；禁止越界事项：不得迁移 `active_lightning_chain`、`active_lava_orb`、`active_fungal_petards` 或其他技能，不得修改已迁移技能能力，不得修改正式掉落、库存或宝石盘；验收标准：package 包含 id、version、display、classification、cast、behavior、hit、scaling、presentation、preview，且 `classification.damage_type = physical`、`behavior.template = melee_arc`、玩家可见文本为中文 key；推荐验证命令：`python tools\validate_v1_configs.py`、`python -m unittest tests.test_skill_effects -v`、`python -m unittest tests.test_skill_editor -v`。

## 3. Phase 3: SkillEditor 新增 `melee_arc` 模块字段

- [x] 3.1 目标：在 SkillEditor 中新增 `melee_arc` 近战扇形模块；允许修改范围：`src/liufang/skill_editor.py`、`webapp/App.tsx`、`webapp/styles.css`、编辑器保存校验、相关测试；禁止越界事项：不得写入模板未声明字段，不得把近战范围字段写成前端专属假参数，不得创建节点编辑器或脚本 DSL；验收标准：字段覆盖 `arc_angle`、`arc_radius`、`windup_ms`、`hit_at_ms`、`max_targets`、`facing_policy`、`hit_shape`、`status_chance_scale`、`slash_vfx_key`、只读扇形范围摘要、只读命中时机摘要；推荐验证命令：`python -m unittest tests.test_skill_editor -v`、`cmd /c npm test`、`cmd /c npm run build`。
- [x] 3.2 目标：补齐 `melee_arc` 中文校验错误；允许修改范围：schema/template whitelist validation 和 WebApp 保存前校验；禁止越界事项：不得绕过后端 schema 保存非法参数，不得把 `slash_vfx_key` 当玩家可见文案；验收标准：非法 `arc_angle`、`arc_radius`、`windup_ms`、`hit_at_ms`、`max_targets`、`facing_policy`、`hit_shape`、`status_chance_scale`、`slash_vfx_key`、未知字段均被拒绝且错误为中文；推荐验证命令：`python -m unittest tests.test_skill_editor -v`、`python tools\validate_v1_configs.py`。

## 4. Phase 4: SkillRuntime 实现 `melee_arc`

- [x] 4.1 目标：实现近战扇形 SkillEvent 生成；允许修改范围：`src/liufang/skill_runtime.py`、`src/liufang/skill_effects.py`、必要 runtime helper 和单元测试；禁止越界事项：不得远程锁敌即时扣血，不得释放瞬间无视 `hit_at_ms` 直接扣血，不得使用静态假事件，不得在 Combat Runtime 写 `active_puncture` 专属分支；验收标准：输出 `cast_start`、`melee_arc`、`damage`、`hit_vfx`、`floating_text`，`melee_arc` 起点为玩家/释放源，朝向最近目标，按 `arc_angle + arc_radius + facing direction` 命中，范围外或扇形外不命中，`damage_type = physical`；推荐验证命令：`python -m unittest tests.test_skill_runtime -v`、`python -m unittest tests.test_combat -v`。
- [x] 4.2 目标：实现时序、目标上限和参数影响；允许修改范围：SkillRuntime damage timing、sector target selection、payload 字段、modifier runtime params；禁止越界事项：不得让 VFX 替代伤害结算，不得让前端猜伤害时机，不得绕过 `max_targets`；验收标准：`hit_at_ms` 前不扣血，`hit_at_ms` 后由 `damage` 事件扣血，`max_targets` 生效，`arc_radius` 改变命中范围，`arc_angle` 改变命中角度，`hit_at_ms` 改变 damage delay，Modifier 测试栈能影响最终伤害、范围或状态概率参数；推荐验证命令：`python -m unittest discover tests`。

## 5. Phase 5: WebApp 消费 `melee_arc` SkillEvent

- [x] 5.1 目标：WebApp 根据真实 `melee_arc` 渲染近战扇形穿刺斩击；允许修改范围：`webapp/App.tsx`、`webapp/styles.css`、`webapp/smoke-test.mjs`、必要表现资源引用；禁止越界事项：不得通过 `behavior_type`、`visual_effect`、`skill_puncture` 或 skill id 猜测行为，不得新增静态假事件，不得引入英文玩家可见文案；验收标准：斩击起点、朝向、角度、半径、命中时机、VFX、damage、hit_vfx、floating_text 均由 SkillEvent 驱动；推荐验证命令：`cmd /c npm test`、`cmd /c npm run build`。

## 6. Phase 6: Skill Test Arena 接入穿刺

- [x] 6.1 目标：Skill Test Arena 支持选择并运行 `active_puncture`；允许修改范围：`src/liufang/skill_editor.py`、`src/liufang/web_api.py`、`tools/webapp_server.py`、WebApp 测试场 UI、相关测试；禁止越界事项：不得写真实 inventory、gem instance、production skill files 之外的数据，不得迁移其他技能；验收标准：单体木桩、密集小怪、三目标横排场景可运行穿刺；推荐验证命令：`python -m unittest tests.test_skill_editor -v`、`cmd /c npm test`。
- [x] 6.2 目标：验证真实近战范围效果和参数变化；允许修改范围：arena runner、scenario fixtures、result model、测试栈参数覆盖；禁止越界事项：不得只改 UI 数字而不影响 SkillEvents；验收标准：穿刺从玩家位置按朝向释放，近距离扇形内目标命中，远距离目标不命中，扇形外目标不命中，`hit_at_ms` 前不扣血，命中后通过 `damage` 扣血，修改 `arc_radius` / `arc_angle` / `hit_at_ms` 产生真实差异，Modifier 测试栈影响最终伤害、范围或状态概率参数；推荐验证命令：`python -m unittest tests.test_skill_editor -v`、`python -m unittest tests.test_skill_runtime -v`。

## 7. Phase 7: SkillEvent 时间线与 AI 自测报告接入穿刺

- [x] 7.1 目标：SkillEvent 时间线显示 `active_puncture` 真实事件；允许修改范围：timeline event mapping、field display、test arena result serialization、WebApp timeline display；禁止越界事项：不得展示静态示例事件，不得隐藏关键字段；验收标准：显示 `cast_start`、`melee_arc`、`damage`、`hit_vfx`、`floating_text`、存在时的 `cooldown_update`，字段包含 `timestamp_ms`、`delay_ms`、`duration_ms`、`source_entity`、`target_entity`、`amount`、`damage_type`、`vfx_key`、`reason_key`、`payload`；推荐验证命令：`python -m unittest tests.test_skill_editor -v`、`cmd /c npm test`。
- [x] 7.2 目标：AI 自测报告支持 `active_puncture`；允许修改范围：`src/liufang/skill_test_report.py`、`tools/generate_skill_test_report.py`、报告测试；禁止越界事项：不得基于静态假事件或手写结论生成通过，不得输出英文自然语言报告；验收标准：报告检查 `melee_arc`、玩家/释放源起点、朝向最近目标、damage、hit_vfx、floating_text、`hit_at_ms` 时序、近战扇形内命中、远距离或扇形外不命中、`damage_type = physical`、`arc_radius` 修改效果、`arc_angle` 修改效果，结论为 `通过` / `部分通过` / `不通过`，不一致项和建议修复项为中文；推荐验证命令：`python -m unittest tests.test_skill_test_report -v`、`python tools\generate_skill_test_report.py --skill active_puncture --scenario dense_pack`。

## 8. Phase 8: 验证与回归

- [x] 8.1 目标：运行 OpenSpec、配置和后端回归验证；允许修改范围：仅修复本 change 范围内验证失败；禁止越界事项：不得借验证失败重构无关模块，不得修改正式掉落、库存、宝石盘或已迁移技能能力；验收标准：OpenSpec strict validate、配置校验、Python 单元测试通过；推荐验证命令：`cmd /c openspec validate migrate-active-puncture-to-melee-arc --strict`、`python tools\validate_v1_configs.py`、`python -m unittest discover tests`。
- [x] 8.2 目标：运行 WebApp 和报告验收；允许修改范围：仅修复 `melee_arc` WebApp consumption、Skill Test Arena、timeline、AI report 相关问题；禁止越界事项：不得恢复随机词缀 UI/生成，不得出现英文玩家可见文本，不得修改其他主动技能能力；验收标准：`active_fire_bolt`、`active_ice_shards`、`active_penetrating_shot`、`active_frost_nova` 无回归，其他未迁移技能保持未迁移，WebApp build/test 通过，穿刺 AI 自测报告生成；推荐验证命令：`cmd /c npm run build`、`cmd /c npm test`、`python tools\generate_skill_test_report.py --skill active_puncture --scenario dense_pack`。

