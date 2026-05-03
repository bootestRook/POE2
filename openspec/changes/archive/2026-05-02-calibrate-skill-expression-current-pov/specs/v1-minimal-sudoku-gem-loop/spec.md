## ADDED Requirements

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
