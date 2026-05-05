from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class ShotgunHitState:
    enabled: bool = False
    followup_reduction: float = 0.0
    _target_hit_counts: dict[str, int] = field(default_factory=dict)

    def record_hit(self, target_entity: str) -> tuple[int, float]:
        sequence = self._target_hit_counts.get(target_entity, 0)
        self._target_hit_counts[target_entity] = sequence + 1
        return sequence, shotgun_damage_multiplier(
            sequence,
            enabled=self.enabled,
            followup_reduction=self.followup_reduction,
        )


def shotgun_damage_multiplier(
    hit_sequence: int,
    *,
    enabled: bool,
    followup_reduction: float,
) -> float:
    if not enabled or hit_sequence <= 0:
        return 1.0
    return 1.0 - max(0.0, min(1.0, float(followup_reduction)))


def shotgun_state_from_runtime_params(runtime_params: dict[str, object]) -> ShotgunHitState:
    return ShotgunHitState(
        enabled=bool(runtime_params.get("allow_same_target_projectile_hits", False)),
        followup_reduction=max(0.0, min(1.0, float(runtime_params.get("shotgun_falloff_coeff", 0.0)))),
    )
