## Why

We need a repeatable way to prove that active skill gems, passive skill gems, support gems, board relations, and conduit amplification are truly affecting final skill/player results. One-off in-memory probes are useful, but they are easy to lose and hard to compare after later balance changes.

The report should simulate a test scenario by granting gems in memory, mounting them on the sudoku board, calculating final skills/player stats, and checking runtime event counts where appropriate. It must not use this as damage balance tuning, and it must not write production inventory, board, skill package, or scaling data.

## What Changes

- Add a read-only gem combination report module.
- Add a CLI that can print JSON and optionally write Markdown.
- Include representative cases:
  - active + support + passive effects on Fire Bolt
  - area and cooldown support interaction on Frost Nova
  - same-row conduit amplification
  - passive self-stat effects on player preview
- Highlight combinations that are technically effective but counterintuitive, such as net cooldown becoming slower after stacking area magnify and cooldown focus.

## Non-goals

- Do not tune values.
- Do not create or persist player inventory.
- Do not change runtime behavior, board rules, skill definitions, or support scaling.
- Do not hide counterintuitive results behind a simple pass/fail.

## Impact

- New Python report module and CLI.
- New focused tests for combo effectiveness and non-destructive execution.
- Optional Markdown output under `reports/`.
