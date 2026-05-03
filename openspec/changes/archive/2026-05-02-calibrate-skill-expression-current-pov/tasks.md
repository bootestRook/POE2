## 1. OpenSpec Setup

- [x] 1.1 Create proposal, design, tasks, and spec delta for current-POV expression calibration.
- [x] 1.2 Validate the change can be read by OpenSpec.

## 2. Calibration Module

- [x] 2.1 Add a Python module that loads active Skill Packages and skill scaling rules.
- [x] 2.2 Model the current battle POV without using dummy arenas as balance evidence.
- [x] 2.3 Generate expression-only active skill recommendations.
- [x] 2.4 Generate support/passive expression pressure notes while ignoring damage values.

## 3. CLI Report

- [x] 3.1 Add a CLI that prints JSON recommendations.
- [x] 3.2 Add optional Markdown output for review.
- [x] 3.3 Ensure the CLI does not write production config files.

## 4. Tests And Verification

- [x] 4.1 Add focused tests for damage-free recommendations and non-dummy current-POV metrics.
- [x] 4.2 Run the focused tests.
- [x] 4.3 Run the calibration CLI.
- [x] 4.4 Run OpenSpec strict validation.
