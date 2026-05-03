## Report Model

Each test case creates a fresh in-memory `V1WebAppApi` instance, grants specific gem instances when needed, mounts gems onto the board, and uses existing calculators.

The report records:

- mounted board positions
- board validity
- relation summary
- baseline final skill or player stat values
- combo final skill or player stat values
- applied modifiers
- runtime SkillEvent counts for cases where event counts prove a final parameter reached runtime
- checks and observations

## Cases

### Fire Bolt support/passive stack

Mount Fire Bolt with Extra Projectile, Fire Mastery, and Fire Focus. Verify projectile count, fire modifiers, final damage, and projectile spawn count.

### Frost Nova area/cooldown interaction

Mount Frost Nova with Area Magnify and Cooldown Focus. Verify area radius increases and both support modifiers apply. If net cooldown is not reduced, report that as an observation rather than a failure.

### Same-row conduit

Mount Fire Bolt, Fire Mastery, and Row Conduit on the same row. Verify `conduit_multiplier` is present and final support value increases.

### Self-stat passives

Mount an active skill with Vitality and Swift Gathering. Verify max life and move speed increase in player preview stats.

## Safety

The report must not call save APIs, write skill YAML, write scaling TOML, or persist inventory/board state. Optional Markdown output is allowed because it is a report artifact.
