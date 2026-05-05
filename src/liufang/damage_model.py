from __future__ import annotations

from dataclasses import dataclass
from typing import Any


DAMAGE_TYPES = ("physical", "lightning", "cold", "fire", "chaos")
DAMAGE_TYPE_PRIORITY = {damage_type: index for index, damage_type in enumerate(DAMAGE_TYPES)}
ELEMENTAL_DAMAGE_TYPES = frozenset({"fire", "cold", "lightning"})


@dataclass(frozen=True)
class DamageConversion:
    source: str
    target: str
    percent: float


def normalize_damage_components(value: Any, *, fallback_type: str, fallback_amount: float) -> dict[str, float]:
    if isinstance(value, dict):
        result = {
            damage_type: max(0.0, float(value.get(damage_type, 0.0)))
            for damage_type in DAMAGE_TYPES
        }
        return {damage_type: amount for damage_type, amount in result.items() if amount > 0}
    amount = max(0.0, float(fallback_amount))
    return {fallback_type: amount} if amount > 0 else {}


def normalize_damage_conversions(value: Any) -> tuple[DamageConversion, ...]:
    if not isinstance(value, list):
        return ()
    conversions: list[DamageConversion] = []
    for entry in value:
        if not isinstance(entry, dict):
            continue
        source = str(entry.get("from", ""))
        target = str(entry.get("to", ""))
        percent = max(0.0, float(entry.get("percent", 0.0)))
        if source in DAMAGE_TYPE_PRIORITY and target in DAMAGE_TYPE_PRIORITY and percent > 0:
            conversions.append(DamageConversion(source=source, target=target, percent=percent))
    return tuple(conversions)


def stat_conversions(stats: dict[str, Any]) -> tuple[DamageConversion, ...]:
    conversions: list[DamageConversion] = []
    for source in DAMAGE_TYPES:
        for target in DAMAGE_TYPES:
            if DAMAGE_TYPE_PRIORITY[target] <= DAMAGE_TYPE_PRIORITY[source]:
                continue
            value = _numeric_stat(stats, f"conversion_{source}_to_{target}_percent")
            if value > 0:
                conversions.append(DamageConversion(source=source, target=target, percent=value))
    return tuple(conversions)


def convert_damage_components(
    base_components: dict[str, float],
    conversions: tuple[DamageConversion, ...],
) -> dict[str, dict[str, float]]:
    components: dict[str, dict[str, float]] = {
        damage_type: {damage_type: max(0.0, float(amount))}
        for damage_type, amount in base_components.items()
        if amount > 0
    }
    for source in DAMAGE_TYPES:
        outgoing = [
            conversion
            for conversion in conversions
            if conversion.source == source
            and DAMAGE_TYPE_PRIORITY[conversion.target] > DAMAGE_TYPE_PRIORITY[source]
        ]
        if not outgoing:
            continue
        total_percent = sum(conversion.percent for conversion in outgoing)
        if total_percent <= 0:
            continue
        source_amount_by_origin = components.get(source, {})
        if not source_amount_by_origin:
            continue
        original_source_amounts = dict(source_amount_by_origin)
        converted_fraction_total = min(1.0, total_percent / 100.0)
        for conversion in outgoing:
            fraction = converted_fraction_total * (conversion.percent / total_percent)
            if fraction <= 0:
                continue
            target_bucket = components.setdefault(conversion.target, {})
            for origin, amount in original_source_amounts.items():
                converted = amount * fraction
                if converted <= 0:
                    continue
                source_amount_by_origin[origin] = max(0.0, source_amount_by_origin.get(origin, 0.0) - converted)
                target_bucket[origin] = target_bucket.get(origin, 0.0) + converted
        components[source] = {
            origin: amount
            for origin, amount in source_amount_by_origin.items()
            if amount > 1e-9
        }
    return {
        damage_type: origins
        for damage_type, origins in components.items()
        if sum(origins.values()) > 1e-9
    }


def calculate_converted_hit_damage(
    *,
    base_components: dict[str, float],
    conversions: tuple[DamageConversion, ...],
    stats: dict[str, Any],
    tags: frozenset[str],
    behavior_template: str,
    behavior_type: str,
    final_pool: float,
) -> tuple[float, dict[str, float], dict[str, dict[str, float]], float]:
    converted = convert_damage_components(base_components, conversions)
    final_components: dict[str, float] = {}
    weighted_increase = 0.0
    total_base = 0.0
    for damage_type, origins in converted.items():
        for origin, amount in origins.items():
            if amount <= 0:
                continue
            increase = _increase_pool_for_component(
                stats=stats,
                final_type=damage_type,
                origin_type=origin,
                tags=tags,
                behavior_template=behavior_template,
                behavior_type=behavior_type,
            )
            scaled = amount * (1.0 + increase / 100.0) * (1.0 + final_pool / 100.0)
            final_components[damage_type] = final_components.get(damage_type, 0.0) + scaled
            weighted_increase += amount * increase
            total_base += amount
    final_damage = sum(final_components.values())
    increase_pool = weighted_increase / total_base if total_base > 0 else 0.0
    return final_damage, final_components, converted, increase_pool


def damage_components_payload(value: dict[str, float]) -> dict[str, float]:
    return {
        damage_type: round(amount, 6)
        for damage_type, amount in value.items()
        if amount > 1e-9
    }


def _increase_pool_for_component(
    *,
    stats: dict[str, Any],
    final_type: str,
    origin_type: str,
    tags: frozenset[str],
    behavior_template: str,
    behavior_type: str,
) -> float:
    pool = (
        _numeric_stat(stats, "damage_add_percent")
        + _numeric_stat(stats, "hit_damage_add_percent")
        + _numeric_stat(stats, "all_damage_type_add_percent")
    )
    for damage_type in dict.fromkeys((origin_type, final_type)):
        pool += _typed_damage_pool(stats, damage_type)
    for tag, stat in {
        "attack": "attack_damage_add_percent",
        "spell": "spell_damage_add_percent",
    }.items():
        if tag in tags:
            pool += _numeric_stat(stats, stat)
    for tag, stat in {
        "projectile": "projectile_damage_add_percent",
        "area": "area_damage_add_percent",
        "melee": "melee_damage_add_percent",
        "ranged": "ranged_damage_add_percent",
        "chain": "chain_damage_add_percent",
        "pierce": "pierce_damage_add_percent",
    }.items():
        if tag in tags or behavior_template == tag or behavior_type == tag:
            pool += _numeric_stat(stats, stat)
    return pool


def _typed_damage_pool(stats: dict[str, Any], damage_type: str) -> float:
    if damage_type == "physical":
        return _numeric_stat(stats, "physical_damage_add_percent")
    if damage_type == "fire":
        return _numeric_stat(stats, "fire_damage_add_percent") + _numeric_stat(stats, "elemental_damage_add_percent")
    if damage_type == "cold":
        return _numeric_stat(stats, "cold_damage_add_percent") + _numeric_stat(stats, "elemental_damage_add_percent")
    if damage_type == "lightning":
        return _numeric_stat(stats, "lightning_damage_add_percent") + _numeric_stat(stats, "elemental_damage_add_percent")
    if damage_type == "chaos":
        return _numeric_stat(stats, "chaos_damage_add_percent") + _numeric_stat(stats, "non_physical_damage_add_percent")
    return 0.0


def _numeric_stat(stats: dict[str, Any], stat: str) -> float:
    value = stats.get(stat, 0.0)
    return float(value) if isinstance(value, (int, float)) and not isinstance(value, bool) else 0.0
