from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterable, Protocol


CRIT_CHANCE_RATING_CAP = 45.0
CRIT_CHANCE_RATING_PIVOT = 600.0
CRIT_DAMAGE_RATING_CAP = 200.0
CRIT_DAMAGE_RATING_PIVOT = 1000.0
BASE_CRIT_DAMAGE_PERCENT = 150.0
V1_CRIT_CHANCE_CAP_PERCENT = 95.0


class StatModifierLike(Protocol):
    stat: str
    value: float


@dataclass(frozen=True)
class PlayerStatContext:
    values: dict[str, int | float | bool]
    trace: dict[str, dict[str, float]]


def aggregate_player_stats(
    base_stats: dict[str, int | float | bool] | None,
    modifiers: Iterable[StatModifierLike] = (),
) -> PlayerStatContext:
    values: dict[str, int | float | bool] = dict(base_stats or {})
    trace: dict[str, dict[str, float]] = {}

    for stat, value in values.items():
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            trace.setdefault(stat, {})["base"] = float(value)

    move_speed_add_percent = 0.0
    for modifier in modifiers:
        if modifier.stat == "move_speed":
            move_speed_add_percent += float(modifier.value)
            trace.setdefault("move_speed", {})["modifier"] = trace.setdefault("move_speed", {}).get("modifier", 0.0) + float(modifier.value)
            continue
        _add(values, modifier.stat, float(modifier.value))
        trace.setdefault(modifier.stat, {})["modifier"] = trace.setdefault(modifier.stat, {}).get("modifier", 0.0) + float(modifier.value)

    if move_speed_add_percent:
        values["move_speed"] = _numeric(values, "move_speed") * (1.0 + move_speed_add_percent / 100.0)

    strength = _numeric(values, "strength")
    dexterity = _numeric(values, "dexterity")
    intelligence = _numeric(values, "intelligence")

    _derive(values, trace, "max_life", strength * 0.5)
    _derive(values, trace, "melee_damage_add_percent", strength * 0.2)
    _derive(values, trace, "attack_speed_add_percent", dexterity * 0.2)
    _derive(values, trace, "cast_speed_add_percent", dexterity * 0.2)
    _derive(values, trace, "evasion_add_percent", dexterity * 0.2)
    _derive(values, trace, "max_mana", intelligence * 0.5)
    energy_shield_add_percent = _numeric(values, "max_energy_shield_add_percent")
    if energy_shield_add_percent:
        _derive(values, trace, "max_energy_shield", _numeric(values, "max_energy_shield") * energy_shield_add_percent / 100.0)
    _derive(values, trace, "max_energy_shield", _numeric(values, "max_energy_shield") * intelligence * 0.002)

    base_crit = _numeric(values, "base_crit_chance_percent")
    direct_crit = _numeric(values, "crit_chance_add_percent")
    crit_rating = _numeric(values, "crit_rating")
    derived_crit = CRIT_CHANCE_RATING_CAP * crit_rating / (crit_rating + CRIT_CHANCE_RATING_PIVOT) if crit_rating > 0 else 0.0
    values["derived_crit_chance_percent"] = _clamp(base_crit + direct_crit + derived_crit, 0.0, V1_CRIT_CHANCE_CAP_PERCENT)
    trace.setdefault("derived_crit_chance_percent", {})["derived"] = float(values["derived_crit_chance_percent"])

    crit_damage_rating = _numeric(values, "crit_damage_rating")
    direct_crit_damage = _numeric(values, "crit_damage_add_percent")
    derived_crit_damage = (
        CRIT_DAMAGE_RATING_CAP * crit_damage_rating / (crit_damage_rating + CRIT_DAMAGE_RATING_PIVOT)
        if crit_damage_rating > 0
        else 0.0
    )
    values["derived_crit_damage_percent"] = BASE_CRIT_DAMAGE_PERCENT + direct_crit_damage + derived_crit_damage
    trace.setdefault("derived_crit_damage_percent", {})["derived"] = float(values["derived_crit_damage_percent"])

    return PlayerStatContext(values=values, trace=trace)


def numeric_stat(values: dict[str, Any], stat: str) -> float:
    return _numeric(values, stat)


def _derive(values: dict[str, int | float | bool], trace: dict[str, dict[str, float]], stat: str, value: float) -> None:
    if not value:
        return
    _add(values, stat, value)
    trace.setdefault(stat, {})["primary_attribute"] = trace.setdefault(stat, {}).get("primary_attribute", 0.0) + value


def _add(values: dict[str, int | float | bool], stat: str, value: float) -> None:
    current = values.get(stat, 0)
    if isinstance(current, bool):
        values[stat] = bool(current or value)
    else:
        values[stat] = float(current) + value


def _numeric(values: dict[str, Any], stat: str) -> float:
    value = values.get(stat, 0.0)
    if isinstance(value, bool):
        return 1.0 if value else 0.0
    if isinstance(value, (int, float)):
        return float(value)
    return 0.0


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return min(maximum, max(minimum, value))
