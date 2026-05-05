from __future__ import annotations

from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from liufang.shotgun import shotgun_damage_multiplier, shotgun_state_from_runtime_params


class ShotgunTest(unittest.TestCase):
    def test_followup_hits_use_fixed_reduction_not_compounding(self) -> None:
        state = shotgun_state_from_runtime_params(
            {
                "allow_same_target_projectile_hits": True,
                "shotgun_falloff_coeff": 0.7,
            }
        )

        self.assertEqual([round(state.record_hit("monster_1")[1], 6) for _ in range(4)], [1.0, 0.3, 0.3, 0.3])

    def test_disabled_shotgun_keeps_all_hits_at_full_damage(self) -> None:
        self.assertEqual(
            shotgun_damage_multiplier(3, enabled=False, followup_reduction=0.7),
            1.0,
        )


if __name__ == "__main__":
    unittest.main()
