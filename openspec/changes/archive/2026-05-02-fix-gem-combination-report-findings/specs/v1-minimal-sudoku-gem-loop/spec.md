## MODIFIED Requirements

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
