## Current POV Model

The calibration pass uses current battle presentation constants rather than dummy arenas:

- world size: 512x512
- camera zoom: 0.22
- player speed: 250 world units / second
- enemy chase speed: 58 world units / second
- enemy spawn cadence: about 1.2s early, tightening toward 0.45s
- normal spawn distances from the current map: roughly 238 to 338, median about 302

These values define the target band for "skills feel connected to the encounter." Ranges that greatly exceed this band may still be mechanically valid, but they reduce player-visible distance decisions in this POV.

## Scoring

The tool produces recommendations, not automatic writes. It evaluates:

- `cast.search_range`
- `cast.cooldown_ms`
- projectile `max_distance`, `projectile_count`, `projectile_speed`, `spread_angle_deg`, `collision_radius`
- area `radius`, `length`, `width`
- chain `chain_count`, `chain_radius`, `chain_delay_ms`
- orbit `duration_ms`, `tick_interval_ms`, `orbit_radius`, `orb_count`
- delayed projectile `travel_time_ms`, `trigger_delay_ms`
- support expression modifiers such as `projectile_count_add`, `projectile_speed_add_percent`, `area_add_percent`, `skill_speed_final_percent`, `cooldown_reduction_percent`, and `added_cooldown_ms`
- passive expression modifiers such as `move_speed`

Damage and survivability fields are reported as ignored when encountered.

## Output

The CLI prints JSON by default and optionally writes Markdown. Each active skill gets:

- current values
- recommended values
- issue list
- rationale

Each support/passive expression modifier gets a small pressure note so later tuning can decide whether it should be conservative, neutral, or high impact.

## Safety

The first implementation is intentionally read-only. Applying recommendations to configs is a future explicit step after review.
