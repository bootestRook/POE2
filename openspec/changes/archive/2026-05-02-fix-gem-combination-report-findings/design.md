# Design

## Conduit Debug Output

Relation scaling currently asks for matching conduits by target and relation only. When the current source support is itself a conduit, the conduit can appear in the debug modifier list for its own scaling pass. The fix is to pass the current source instance as an exclusion when collecting matching conduits.

The intended behavior is:

- A conduit can amplify other supports that share its effective relation to the active target.
- A conduit does not amplify or report itself while its own empty support modifier pass is being evaluated.

## Cooldown Focus Tuning

The report case represents a player-facing build expectation: combining a cooldown support with an area support should still visibly shorten cooldown, even if the area support carries a speed penalty. Increase `support_cooldown_focus` cooldown reduction enough to overcome Area Magnify's current adjacent penalty in the tested combination.

No damage tuning is included.
