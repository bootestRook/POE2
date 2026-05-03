## MODIFIED Requirements

### Requirement: 瀹濈煶瀹氫箟涓庡疂鐭冲疄渚?V1 SHALL separate base gem definitions from player-owned gem instances, and V1 绗簩闃舵 SHALL classify gems by `gem_kind` while representing sudoku legality by `sudoku_digit`. First-version product gem content SHALL use the TLIDB-sourced content set defined by this change instead of the previous project-invented active/support/passive skill list.

#### Scenario: 瀹濈煶瀹炰緥寮曠敤鍩虹瀹氫箟
- **WHEN** a gem drops and is saved to inventory
- **THEN** the saved instance SHALL include an `instance_id`, `base_gem_id`, `gem_kind`, `sudoku_digit`, `rarity`, `level`, lock state, and board state while referencing the base definition by ID

#### Scenario: 涓诲姩鎶€鑳藉疂鐭虫竻鍗?- **WHEN** active skill gem content is validated for this change
- **THEN** it SHALL include exactly the adopted TLIDB active skills `Split_Firebolt`, `Ice_Shot`, `Chromatic_Shot`, `Whirlwind`, `Stoneskin`, `Thundercloud`, `Blizzard`, `Chain_Lightning`, `Ring_of_Ice`, `Flame_Slash`, `Lightning_Shot`, `Corrosive_Shot`, `Burning_Shot`, `Rain_of_Arrows`, `Sparkle`, and `Black_Hole`, each using `gem_kind = active_skill`, and SHALL NOT require the old project active IDs `active_fire_bolt`, `active_ice_shards`, `active_lightning_chain`, `active_frost_nova`, `active_puncture`, `active_penetrating_shot`, `active_lava_orb`, or `active_fungal_petards` as product content

#### Scenario: 琚姩鎶€鑳藉疂鐭崇粨鏋?- **WHEN** passive skill gem content is validated for this change
- **THEN** it SHALL include exactly 9 adopted TLIDB passive/aura gems, use `gem_kind = passive_skill`, declare `sudoku_digit`, use Chinese localization keys, and declare non-release passive effects or self-stat contributions

#### Scenario: 杈呭姪瀹濈煶缁撴瀯
- **WHEN** support gem content is validated for this change
- **THEN** it SHALL include exactly 30 TLIDB-sourced support gems plus the 3 project-owned board conduit supports `support_row_conduit`, `support_column_conduit`, and `support_box_conduit`, all using `gem_kind = support`, explicit `sudoku_digit`, explicit apply filters, and no random affix fields added by this change

#### Scenario: 杈呭姪瀹濈煶閫傜敤鏉′欢
- **WHEN** a support gem definition is validated
- **THEN** it SHALL declare explicit apply filters using tags or target kind rules and SHALL NOT rely only on stat field names to imply affected targets

## ADDED Requirements

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
