## MODIFIED Requirements

### Requirement: 掉落与库存
V1 SHALL support generic combat drops, pickup, inventory storage, gem drop scaling, equipment drop storage, map-entry storage, and board mount / unmount state.

#### Scenario: 通用掉落种类
- **WHEN** a combat reward drop is generated from a map run
- **THEN** Loot Runtime SHALL be able to generate `gem`, `equipment`, and `map_entry` drops
- **AND** Loot Runtime SHALL NOT generate currency, fragments, crafting materials, trading items, or season-only rewards in this change

#### Scenario: 玩家掉落属性影响宝石掉落
- **WHEN** `gem_drop_quantity_add_percent` or `gem_drop_rarity_add_percent` is present in the player runtime stat context
- **THEN** Loot Runtime SHALL apply those values to gem drop count and gem rarity selection inside the current map-run loot profile

#### Scenario: 拾取宝石入库
- **WHEN** the player picks up a dropped gem within pickup range
- **THEN** the gem instance SHALL be added to Inventory / Storage with its base gem reference, level, rarity, affixes, and board state preserved

#### Scenario: 拾取装备入库
- **WHEN** the player picks up a dropped equipment item within pickup range
- **THEN** the equipment instance SHALL be added to equipment inventory with source, level, rarity, base affix, ordinary affixes, and generated effect text preserved

#### Scenario: 拾取地图入口入库
- **WHEN** the player picks up a dropped map entry within pickup range
- **THEN** the map entry SHALL be added to map-entry storage or map-selection resource state
- **AND** the map selection UI SHALL reflect the updated entry count

#### Scenario: 上盘下盘
- **WHEN** a player mounts or unmounts a gem
- **THEN** Inventory / Storage SHALL update the gem's board occupancy state and Gem Board Runtime SHALL recalculate legality and relationships

### Requirement: 最小战斗循环
V1 SHALL include a combat loop that supports automatic active skill release, monster kills, generic map-run drops, pickup, and returning to board or map selection.

#### Scenario: 自动释放已激活主动技能
- **WHEN** combat is running and the board has valid activated active skill gems
- **THEN** Combat Runtime SHALL trigger Skill Runtime to automatically release those active skills according to their final cooldown and speed values

#### Scenario: 被动技能不自动释放
- **WHEN** combat is running and the board contains passive skill gems
- **THEN** Combat Runtime SHALL NOT automatically release passive skill gems as combat skills

#### Scenario: 击杀触发地图掉落
- **WHEN** monsters are killed in a map run
- **THEN** Combat Runtime SHALL trigger Loot Runtime with the current map run context and monster loot context
- **AND** Loot Runtime SHALL roll generic drops instead of assuming every kill produces a gem

#### Scenario: 零掉落合法
- **WHEN** Loot Runtime returns zero drops for a monster kill
- **THEN** Combat Runtime SHALL continue normally and SHALL NOT raise an error

### Requirement: WebApp 可操作入口
V1 SHALL provide a browser-openable WebApp entry for the loop. V1 WebApp SHALL represent `gem_kind` and `sudoku_digit` consistently with backend rules, provide main-screen and map-selection UI, and SHALL NOT implement divergent gameplay rules in frontend code.

#### Scenario: 浏览器打开 WebApp
- **WHEN** 玩家启动 V1 WebApp
- **THEN** WebApp SHALL open in a browser page with a Chinese title

#### Scenario: WebApp 完成刷宝循环操作
- **WHEN** 玩家使用 WebApp
- **THEN** WebApp SHALL allow player to continue or start a save, select an unlocked map node, start a map run, view inventory, inspect active skill gems, inspect passive skill gems, inspect support gems, inspect equipment, mount/unmount gems on the 9x9 board, equip/unequip equipment, preview final skill effects, fight monsters, see drops, and pick up drops

#### Scenario: WebApp 中文玩家可见文本
- **WHEN** WebApp displays buttons, titles, prompts, errors, HUD, logs, inventory, board, skill preview, map selection, combat, drops, pickup feedback, passive effects, equipment effects, save status, or debug-visible interaction hints
- **THEN** WebApp SHALL display all player-visible text in Chinese

#### Scenario: WebApp 复用 V1 规则层
- **WHEN** WebApp needs sudoku legality, board relationships, skill final effects, passive contributions, equipment effects, combat results, map run state, loot drops, pickup results, or inventory updates
- **THEN** WebApp SHALL call or reuse backend/canonical V1 rules through an API or adapter layer
- **AND** WebApp SHALL NOT reimplement a divergent rule set in frontend code

#### Scenario: WebApp 合法格预判使用 sudoku_digit
- **WHEN** WebApp previews whether a dragged gem can be placed in a board cell
- **THEN** WebApp SHALL use `sudoku_digit` as the conflict key and SHALL NOT use old `gem_type` display text or identity text as the conflict key
