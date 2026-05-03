## ADDED Requirements

### Requirement: Gem Combination Effect Report
V1 SHALL provide a non-destructive report that verifies active, passive, support, and conduit gem combinations through the real board and skill effect calculator.

#### Scenario: Grant and mount gems in memory
- **WHEN** the gem combination report runs
- **THEN** it SHALL create test gem instances and board placements in memory without writing production inventory or board state

#### Scenario: Verify active support and passive effects
- **WHEN** an active skill is mounted with compatible support and passive gems
- **THEN** the report SHALL show the final skill values and applied modifiers produced by the real `SkillEffectCalculator`

#### Scenario: Verify runtime event propagation
- **WHEN** a final skill parameter affects runtime-visible event counts
- **THEN** the report SHALL execute the real `SkillRuntime` and show matching event counts such as `projectile_spawn`

#### Scenario: Verify self-stat passives
- **WHEN** passive gems provide player self-stat effects
- **THEN** the report SHALL show the player preview stat changes from the real player stat contribution path

#### Scenario: Surface counterintuitive net effects
- **WHEN** multiple real modifiers apply but the net result is counterintuitive
- **THEN** the report SHALL include an observation rather than hiding the interaction behind a simple pass/fail

#### Scenario: Keep report non-destructive
- **WHEN** the report completes
- **THEN** it SHALL NOT write Skill Package YAML, support scaling TOML, production inventory, board state, runtime code, or WebApp code
