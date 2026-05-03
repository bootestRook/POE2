# Fix Gem Combination Report Findings

## Why

The gem combination effect report found two issues in real board combinations:

- Frost Nova with Area Magnify and Cooldown Focus applies both supports, but the net cooldown becomes slower than baseline.
- Same-row conduit amplification works numerically, but the applied modifier debug output reports the conduit multiplier more than once.

Both issues reduce confidence in the new POV-focused skill expression checks.

## What Changes

- Prevent a conduit support from reporting/amplifying itself while calculating its own relation scale.
- Tune Cooldown Focus so it still produces a faster net cooldown when paired with Area Magnify's speed penalty.
- Update the focused report tests and regenerate the Markdown report.

## Out Of Scope

- Damage rebalance.
- New gem types or board rules.
- Production inventory or saved board state changes.
