from __future__ import annotations

from dataclasses import dataclass, field, replace
from math import dist, hypot

from .inventory import BoardPosition, GemInstance, GemInventory
from .loot import GeneratedLoot, LootRuntime
from .map_progression import LootContext, MapRunContext
from .player_stats import CRIT_CHANCE_RATING_CAP, CRIT_CHANCE_RATING_PIVOT, V1_CRIT_CHANCE_CAP_PERCENT
from .skill_effects import FinalSkillInstance, SkillEffectCalculator, SkillEffectError
from .skill_runtime import SkillEvent, SkillRuntime

ELEMENTAL_FUSION_NO_AILMENTS_BUFF = "elemental_fusion_no_ailments"
ELEMENTAL_FUSION_PREVENTED_STATUS_TYPES = frozenset({"ignite", "frostbite", "frozen", "numbed"})
PLAYER_UTILITY_BUFF_IDS = frozenset({ELEMENTAL_FUSION_NO_AILMENTS_BUFF})
PERSISTENT_COMBAT_BUFF_DURATION_MS = 2_147_483_647
BARRIER_BASE_ABSORB_PERCENT = 50.0
BARRIER_BASE_DURATION_MS = 10_000
BARRIER_BASE_POOL_PERCENT = 20.0


class CombatStartError(ValueError):
    def __init__(self, error_key: str, message: str) -> None:
        super().__init__(message)
        self.error_key = error_key
        self.message = message


@dataclass(frozen=True)
class Position:
    x: float
    y: float


@dataclass
class BuffState:
    buff_type: str
    remaining_ms: int
    effect_type: str = ""
    remaining_amount: float = 0.0
    absorb_percent: float = 0.0
    exclude_damage_over_time: bool = False
    polarity: str = "positive"
    stacks: int = 1
    base_value: float = 0.0
    base_damage_per_second: float = 0.0
    damage_over_time_more_percent: float = 0.0
    dot_damage_bonus_per_ignite_stack_percent: float = 0.0
    dot_damage_bonus_max_percent: float = 0.0
    source_damage_type: str = ""
    max_stacks: int = 1
    max_triggers: int = 0
    effect_per_stack: float = 0.0
    threshold: float = 0.0
    conversion_buff_type: str = ""
    conversion_consume_source: bool = True
    source_skill_id: str = ""


@dataclass
class Player:
    player_id: str
    current_life: float
    max_life: float
    position: Position
    item_interaction_reach: float
    move_speed: float = 250.0
    current_mana: float = 0.0
    max_mana: float = 0.0
    life_regen_flat: float = 0.0
    mana_regen_flat: float = 0.0
    life_regen_add_percent: float = 0.0
    mana_regen_add_percent: float = 0.0
    life_regen_percent_per_second: float = 0.0
    current_energy_shield: float = 0.0
    max_energy_shield: float = 0.0
    energy_shield_charge_speed_percent: float = 0.0
    energy_shield_charge_delay_ms: int = 2000
    armor: float = 0.0
    armor_add_percent: float = 0.0
    evasion: float = 0.0
    evasion_add_percent: float = 0.0
    attack_block_chance_percent: float = 0.0
    spell_block_chance_percent: float = 0.0
    block_damage_reduction_percent: float = 0.0
    block_life_recovery_percent: float = 0.0
    block_life_recovery_interval_ms: int = 0
    block_shield_recovery_percent: float = 0.0
    block_shield_recovery_interval_ms: int = 0
    damage_mitigation_final_percent: float = 0.0
    physical_damage_reduction_percent: float = 0.0
    fire_resistance_percent: float = 0.0
    cold_resistance_percent: float = 0.0
    lightning_resistance_percent: float = 0.0
    chaos_resistance_percent: float = 0.0
    elemental_resistance_percent: float = 0.0
    max_fire_resistance_percent: float = 75.0
    max_cold_resistance_percent: float = 75.0
    max_lightning_resistance_percent: float = 75.0
    max_chaos_resistance_percent: float = 75.0
    max_elemental_resistance_percent: float = 75.0
    non_physical_armor_effectiveness_percent: float = 60.0
    incoming_conversion_physical_to_fire_percent: float = 0.0
    incoming_conversion_physical_to_cold_percent: float = 0.0
    incoming_conversion_physical_to_lightning_percent: float = 0.0
    incoming_conversion_physical_to_chaos_percent: float = 0.0
    incoming_conversion_chaos_to_fire_percent: float = 0.0
    incoming_conversion_chaos_to_cold_percent: float = 0.0
    incoming_conversion_chaos_to_lightning_percent: float = 0.0
    life_return_percent: float = 0.0
    shield_return_percent: float = 0.0
    avoid_elemental_ailments_percent: float = 0.0
    damage_taken_from_mana_before_life_percent: float = 0.0
    self_true_damage_per_100ms: float = 0.0
    barrier_absorb_amount_add_percent: float = 0.0
    moving_shield_recovery_percent_per_second: float = 0.0
    movement_barrier_distance: float = 0.0
    movement_barrier_chance_percent: float = 0.0
    war_intent_enabled: float = 0.0
    war_intent_effect_add_percent: float = 0.0
    war_intent_points: int = 0
    war_intent_remaining_ms: int = 0
    war_intent_crit_rating: float = 0.0
    buffs: list[BuffState] = field(default_factory=list)
    _energy_shield_recharge_delay_remaining_ms: int = 0
    _incoming_hit_counter: int = 0
    _block_life_recovery_ready_ms: int = 0
    _block_shield_recovery_ready_ms: int = 0

    def sync_runtime_bounds(self) -> None:
        self.max_life = max(1.0, float(self.max_life))
        self.current_life = min(max(0.0, float(self.current_life)), self.max_life)
        self.max_mana = max(0.0, float(self.max_mana))
        self.current_mana = min(max(0.0, float(self.current_mana)), self.max_mana)
        self.max_energy_shield = max(0.0, float(self.max_energy_shield))
        self.current_energy_shield = min(max(0.0, float(self.current_energy_shield)), self.max_energy_shield)

    def regenerate(self, delta_ms: int) -> None:
        self.tick_buffs(delta_ms)
        if self.war_intent_remaining_ms > 0:
            self.war_intent_remaining_ms = max(0, self.war_intent_remaining_ms - max(0, delta_ms))
            if self.war_intent_remaining_ms == 0:
                self.war_intent_points = 0
                self.war_intent_crit_rating = 0.0
        seconds = max(0, delta_ms) / 1000.0
        life_regen = self.life_regen_flat * (1.0 + max(0.0, self.life_regen_add_percent) / 100.0)
        life_regen += self.max_life * max(0.0, self.life_regen_percent_per_second) / 100.0
        if self.max_life > 0 and life_regen > 0:
            self.current_life = min(self.max_life, self.current_life + life_regen * seconds)
        mana_regen = self.mana_regen_flat * (1.0 + max(0.0, self.mana_regen_add_percent) / 100.0)
        if self.max_mana > 0 and mana_regen > 0:
            self.current_mana = min(self.max_mana, self.current_mana + mana_regen * seconds)
        if self.max_energy_shield <= 0:
            return
        if self._energy_shield_recharge_delay_remaining_ms > 0:
            remaining_delay = self._energy_shield_recharge_delay_remaining_ms
            self._energy_shield_recharge_delay_remaining_ms = max(0, remaining_delay - max(0, delta_ms))
            if delta_ms <= remaining_delay:
                return
            seconds = (delta_ms - remaining_delay) / 1000.0
        if self.energy_shield_charge_speed_percent > 0:
            recharge_per_second = self.max_energy_shield * self.energy_shield_charge_speed_percent / 100.0
            self.current_energy_shield = min(self.max_energy_shield, self.current_energy_shield + recharge_per_second * seconds)

    def can_spend_mana(self, amount: float) -> bool:
        cost = max(0.0, float(amount))
        return self.current_mana >= cost

    def spend_mana(self, amount: float) -> bool:
        cost = max(0.0, float(amount))
        if self.current_mana < cost:
            return False
        self.current_mana -= cost
        return True

    def take_hit(
        self,
        damage: float,
        *,
        damage_type: str = "physical",
        hit_kind: str = "attack",
        avoidable: bool = True,
        damage_over_time: bool = False,
        armor_reduction_penetration_percent: float = 0.0,
        timestamp_ms: int = 0,
    ) -> float:
        return self.take_hit_components(
            {damage_type: max(0.0, float(damage))},
            hit_kind=hit_kind,
            avoidable=avoidable,
            damage_over_time=damage_over_time,
            armor_reduction_penetration_percent=armor_reduction_penetration_percent,
            timestamp_ms=timestamp_ms,
        )

    def take_hit_components(
        self,
        components: dict[str, float],
        *,
        hit_kind: str = "attack",
        avoidable: bool = True,
        damage_over_time: bool = False,
        armor_reduction_penetration_percent: float = 0.0,
        timestamp_ms: int = 0,
    ) -> float:
        converted = self._incoming_converted_components(components)
        incoming = 0.0
        for damage_type, amount in converted.items():
            incoming += self._mitigated_damage(
                max(0.0, float(amount)),
                str(damage_type),
                armor_reduction_penetration_percent=armor_reduction_penetration_percent,
            )
        return self._apply_incoming_damage(
            incoming,
            hit_kind=hit_kind,
            avoidable=avoidable,
            damage_over_time=damage_over_time,
            timestamp_ms=timestamp_ms,
        )

    def _apply_incoming_damage(
        self,
        damage: float,
        *,
        hit_kind: str,
        avoidable: bool,
        damage_over_time: bool,
        timestamp_ms: int,
    ) -> float:
        incoming = max(0.0, float(damage))
        if incoming <= 0:
            return 0.0
        if avoidable:
            incoming *= 1.0 - self._evasion_chance()
        blocked = self._roll_block(hit_kind, damage_over_time=damage_over_time)
        if blocked:
            incoming *= 1.0 - max(0.0, min(100.0, self.block_damage_reduction_percent)) / 100.0
            self._recover_on_block(timestamp_ms)
        incoming = self._absorb_buff_damage(incoming, damage_over_time=damage_over_time)
        mana_soak_percent = max(0.0, min(100.0, self.damage_taken_from_mana_before_life_percent))
        if mana_soak_percent > 0 and self.current_mana > 0:
            mana_portion = incoming * mana_soak_percent / 100.0
            spent_mana = min(self.current_mana, mana_portion)
            self.current_mana -= spent_mana
            incoming -= spent_mana
        self._energy_shield_recharge_delay_remaining_ms = max(0, int(self.energy_shield_charge_delay_ms))
        shield_damage = min(self.current_energy_shield, incoming)
        self.current_energy_shield -= shield_damage
        life_damage = incoming - shield_damage
        self.current_life = max(0.0, self.current_life - life_damage)
        return life_damage

    def apply_buff_event(self, event: SkillEvent) -> None:
        payload = event.payload if isinstance(event.payload, dict) else {}
        buff_type = str(payload.get("buff_type", ""))
        if not buff_type:
            return
        if self.prevents_status_application(buff_type) or self._avoids_status_application(buff_type, event.event_id):
            return
        incoming = BuffState(
            buff_type=buff_type,
            remaining_ms=max(0, int(event.duration_ms or payload.get("duration_ms", 0))),
            remaining_amount=max(0.0, float(event.amount or payload.get("absorb_amount", 0.0))),
            absorb_percent=max(0.0, float(payload.get("absorb_percent", 0.0))),
            exclude_damage_over_time=bool(payload.get("exclude_damage_over_time", False)),
            polarity=str(payload.get("polarity", "positive")),
            source_skill_id=str(payload.get("source_skill_id", payload.get("skill_id", ""))),
        )
        self.buffs = [
            buff
            for buff in self.buffs
            if not (buff.buff_type == incoming.buff_type and buff.source_skill_id == incoming.source_skill_id)
        ]
        if incoming.remaining_ms > 0 and self._buff_has_runtime_effect(incoming):
            self.buffs.append(incoming)

    def tick_buffs(self, delta_ms: int) -> None:
        elapsed = max(0, int(delta_ms))
        remaining: list[BuffState] = []
        for buff in self.buffs:
            buff.remaining_ms -= elapsed
            if buff.remaining_ms > 0 and self._buff_has_runtime_effect(buff):
                remaining.append(buff)
        self.buffs = remaining

    def has_buff(self, buff_type: str) -> bool:
        return any(
            buff.remaining_ms > 0 and buff.buff_type == buff_type
            for buff in self.buffs
        )

    def prevents_status_application(self, status_type: str) -> bool:
        if status_type and bool(getattr(self, f"immune_{status_type}", False)):
            return True
        if status_type in ELEMENTAL_FUSION_PREVENTED_STATUS_TYPES:
            avoid_percent = max(0.0, min(100.0, float(getattr(self, "avoid_elemental_ailments_percent", 0.0))))
            if avoid_percent >= 100.0:
                return True
        return (
            status_type in ELEMENTAL_FUSION_PREVENTED_STATUS_TYPES
            and self.has_buff(ELEMENTAL_FUSION_NO_AILMENTS_BUFF)
        )

    def _avoids_status_application(self, status_type: str, seed: str) -> bool:
        if status_type not in ELEMENTAL_FUSION_PREVENTED_STATUS_TYPES:
            return False
        avoid_percent = max(0.0, min(100.0, float(getattr(self, "avoid_elemental_ailments_percent", 0.0))))
        return avoid_percent > 0 and _stable_percent(f"{seed}:avoid_status") < avoid_percent

    @staticmethod
    def _buff_has_runtime_effect(buff: BuffState) -> bool:
        return (
            buff.remaining_amount > 0
            or buff.absorb_percent > 0
            or buff.buff_type in PLAYER_UTILITY_BUFF_IDS
        )

    def _incoming_converted_components(self, components: dict[str, float]) -> dict[str, float]:
        result = {
            str(damage_type): max(0.0, float(amount))
            for damage_type, amount in components.items()
            if max(0.0, float(amount)) > 0
        }
        for source, target in (
            ("physical", "fire"),
            ("physical", "cold"),
            ("physical", "lightning"),
            ("physical", "chaos"),
            ("chaos", "fire"),
            ("chaos", "cold"),
            ("chaos", "lightning"),
        ):
            source_amount = result.get(source, 0.0)
            if source_amount <= 0:
                continue
            percent = max(0.0, float(getattr(self, f"incoming_conversion_{source}_to_{target}_percent", 0.0)))
            if percent <= 0:
                continue
            converted = source_amount * min(1.0, percent / 100.0)
            result[source] = max(0.0, result.get(source, 0.0) - converted)
            result[target] = result.get(target, 0.0) + converted
        return {damage_type: amount for damage_type, amount in result.items() if amount > 1e-9}

    def _mitigated_damage(
        self,
        damage: float,
        damage_type: str,
        *,
        armor_reduction_penetration_percent: float = 0.0,
    ) -> float:
        result = damage
        armor_effectiveness = 0.0
        if damage_type == "physical":
            armor_effectiveness = 100.0
        elif damage_type in {"fire", "cold", "lightning", "chaos"}:
            armor_effectiveness = max(0.0, self.non_physical_armor_effectiveness_percent)
        if armor_effectiveness > 0:
            effective_armor = max(0.0, self.armor * (1.0 + self.armor_add_percent / 100.0)) * armor_effectiveness / 100.0
            armor_reduction = effective_armor / (effective_armor + 10.0 * result) if result > 0 else 0.0
            armor_reduction_percent = min(90.0, armor_reduction * 100.0) - max(0.0, armor_reduction_penetration_percent)
            result *= 1.0 - armor_reduction_percent / 100.0
        if damage_type == "physical":
            result *= 1.0 - min(0.9, max(0.0, self.physical_damage_reduction_percent) / 100.0)
        result *= 1.0 - max(0.0, self._effective_resistance(damage_type)) / 100.0
        result *= 1.0 - min(0.9, max(0.0, self.damage_mitigation_final_percent) / 100.0)
        return max(0.0, result)

    def _absorb_buff_damage(self, damage: float, *, damage_over_time: bool) -> float:
        incoming = max(0.0, damage)
        if incoming <= 0 or not self.buffs:
            return incoming
        remaining_buffs: list[BuffState] = []
        for index, buff in enumerate(self.buffs):
            if buff.remaining_ms <= 0 or buff.remaining_amount <= 0:
                if buff.remaining_ms > 0 and self._buff_has_runtime_effect(buff):
                    remaining_buffs.append(buff)
                continue
            if damage_over_time and buff.exclude_damage_over_time:
                remaining_buffs.append(buff)
                continue
            absorb_cap = incoming * max(0.0, buff.absorb_percent) / 100.0
            absorbed = min(buff.remaining_amount, absorb_cap)
            buff.remaining_amount -= absorbed
            incoming -= absorbed
            if buff.remaining_ms > 0 and buff.remaining_amount > 0:
                remaining_buffs.append(buff)
            if incoming <= 0:
                remaining_buffs.extend(
                    later
                    for later in self.buffs[index + 1 :]
                    if later.remaining_ms > 0 and self._buff_has_runtime_effect(later)
                )
                break
        self.buffs = remaining_buffs
        return max(0.0, incoming)

    def _resistance(self, damage_type: str) -> float:
        if damage_type == "fire":
            return self.fire_resistance_percent + self.elemental_resistance_percent
        if damage_type == "cold":
            return self.cold_resistance_percent + self.elemental_resistance_percent
        if damage_type == "lightning":
            return self.lightning_resistance_percent + self.elemental_resistance_percent
        if damage_type == "chaos":
            return self.chaos_resistance_percent
        return 0.0

    def _effective_resistance(self, damage_type: str) -> float:
        resistance = max(0.0, self._resistance(damage_type))
        cap = self._resistance_cap(damage_type)
        return min(cap, resistance)

    def _resistance_cap(self, damage_type: str) -> float:
        if damage_type == "fire":
            return max(0.0, min(100.0, self.max_fire_resistance_percent + self.max_elemental_resistance_percent - 75.0))
        if damage_type == "cold":
            return max(0.0, min(100.0, self.max_cold_resistance_percent + self.max_elemental_resistance_percent - 75.0))
        if damage_type == "lightning":
            return max(0.0, min(100.0, self.max_lightning_resistance_percent + self.max_elemental_resistance_percent - 75.0))
        if damage_type == "chaos":
            return max(0.0, min(100.0, self.max_chaos_resistance_percent))
        return 0.0

    def _evasion_chance(self) -> float:
        effective_evasion = max(0.0, self.evasion * (1.0 + self.evasion_add_percent / 100.0))
        return min(0.95, effective_evasion / (effective_evasion + 1000.0)) if effective_evasion > 0 else 0.0

    def _block_chance(self, hit_kind: str) -> float:
        chance = self.spell_block_chance_percent if hit_kind == "spell" else self.attack_block_chance_percent
        return min(0.75, max(0.0, chance) / 100.0)

    def _roll_block(self, hit_kind: str, *, damage_over_time: bool) -> bool:
        if damage_over_time:
            return False
        chance = self._block_chance(hit_kind)
        if chance <= 0:
            return False
        self._incoming_hit_counter += 1
        return _stable_percent(f"{self.player_id}:block:{self._incoming_hit_counter}:{hit_kind}") < chance * 100.0

    def _recover_on_block(self, timestamp_ms: int) -> None:
        current_ms = max(0, int(timestamp_ms))
        life_percent = max(0.0, float(self.block_life_recovery_percent))
        if life_percent > 0 and current_ms >= self._block_life_recovery_ready_ms and self.max_life > self.current_life:
            self.current_life = min(self.max_life, self.current_life + self.max_life * life_percent / 100.0)
            self._block_life_recovery_ready_ms = current_ms + max(0, int(self.block_life_recovery_interval_ms))
        shield_percent = max(0.0, float(self.block_shield_recovery_percent))
        if (
            shield_percent > 0
            and current_ms >= self._block_shield_recovery_ready_ms
            and self.max_energy_shield > self.current_energy_shield
        ):
            self.current_energy_shield = min(
                self.max_energy_shield,
                self.current_energy_shield + self.max_energy_shield * shield_percent / 100.0,
            )
            self._block_shield_recovery_ready_ms = current_ms + max(0, int(self.block_shield_recovery_interval_ms))


@dataclass
class Monster:
    monster_id: str
    current_life: float
    max_life: float
    position: Position
    is_alive: bool = True
    rarity: str = "normal"
    is_boss: bool = False
    monster_template_id: str = "mon_100101"
    pack_id: str = ""
    zone_type: str = ""
    base_damage: float = 0.0
    damage_multiplier: float = 1.0
    map_stage_id: str = ""
    map_level: int = 0
    monster_level: int = 0
    max_energy_shield: float = 0.0
    buffs: list[BuffState] = field(default_factory=list)

    def take_hit(self, damage: float) -> bool:
        if not self.is_alive:
            return False
        self.current_life = max(0.0, self.current_life - damage)
        if self.current_life <= 0:
            self.is_alive = False
            return True
        return False

    def is_tough_enemy(self) -> bool:
        return self.is_boss or self.rarity in {"rare", "boss"}

    def take_hit_components(self, components: dict[str, float], *, source_skill_id: str = "") -> bool:
        adjusted: dict[str, float] = {}
        damage_taken_increase = self._damage_taken_increase_percent(source_skill_id)
        for damage_type, amount in components.items():
            scaled = max(0.0, float(amount))
            if damage_type == "cold":
                scaled *= 1.0 + self._negative_buff_effect_percent("frostbite") / 100.0
            elif damage_type == "lightning":
                scaled *= 1.0 + self._negative_buff_effect_percent("numbed") / 100.0
            if damage_taken_increase > 0:
                scaled *= 1.0 + damage_taken_increase / 100.0
            adjusted[str(damage_type)] = scaled
        shock_damage = self._consume_shock_damage()
        if shock_damage > 0:
            adjusted["lightning"] = adjusted.get("lightning", 0.0) + shock_damage
        return self.take_hit(sum(adjusted.values()))

    def apply_buff(self, payload: dict[str, object]) -> None:
        buff_type = str(payload.get("buff_type", payload.get("status_type", "")))
        effect_type = str(payload.get("effect_type", ""))
        if not buff_type and not effect_type:
            return
        duration_ms = max(0, int(payload.get("duration_ms", 0)))
        max_stacks = max(1, int(payload.get("max_stacks", 1)))
        conversion_buff_type = str(payload.get("conversion_buff_type", payload.get("convert_to_buff_type", "")))
        if not conversion_buff_type:
            conversion_buff_type = _default_conversion_buff_type(buff_type, payload)
        if conversion_buff_type and not effect_type:
            effect_type = "conversion"
        conversion_consume_source = payload.get("conversion_consume_source")
        if conversion_consume_source is None:
            conversion_consume_source = _default_conversion_consume_source(buff_type, payload)
        incoming = BuffState(
            buff_type=buff_type,
            remaining_ms=duration_ms,
            effect_type=effect_type,
            stacks=max(1, int(payload.get("stacks", 1))),
            polarity=str(payload.get("polarity", "negative")),
            base_value=max(0.0, float(payload.get("base_value", 0.0))),
            base_damage_per_second=max(0.0, float(payload.get("base_damage_per_second", 0.0)))
            * (1.0 + max(0.0, float(payload.get("damage_over_time_more_percent", 0.0))) / 100.0),
            damage_over_time_more_percent=max(0.0, float(payload.get("damage_over_time_more_percent", 0.0))),
            dot_damage_bonus_per_ignite_stack_percent=max(
                0.0,
                float(payload.get("dot_damage_bonus_per_ignite_stack_percent", 0.0)),
            ),
            dot_damage_bonus_max_percent=max(0.0, float(payload.get("dot_damage_bonus_max_percent", 0.0))),
            source_damage_type=str(payload.get("source_damage_type", "")),
            max_stacks=max_stacks,
            max_triggers=max(0, int(payload.get("max_triggers", 0))),
            effect_per_stack=max(0.0, float(payload.get("effect_per_stack", 0.0))),
            threshold=max(0.0, float(payload.get("threshold", 0.0))),
            conversion_buff_type=conversion_buff_type,
            conversion_consume_source=bool(conversion_consume_source),
            source_skill_id=str(payload.get("source_skill_id", "")),
        )
        existing = next(
            (
                buff
                for buff in self.buffs
                if buff.buff_type == incoming.buff_type
                and buff.effect_type == incoming.effect_type
                and buff.source_skill_id == incoming.source_skill_id
            ),
            None,
        )
        if existing is None or buff_type in {"ignite", "shock", "trauma"}:
            self.buffs.append(incoming)
        else:
            existing.stacks = min(existing.max_stacks, existing.stacks + max(1, incoming.stacks))
            existing.remaining_ms = max(existing.remaining_ms, incoming.remaining_ms)
            existing.base_value += incoming.base_value
            existing.base_damage_per_second = max(existing.base_damage_per_second, incoming.base_damage_per_second)
            if incoming.threshold > 0:
                existing.threshold = incoming.threshold
            if incoming.conversion_buff_type:
                existing.conversion_buff_type = incoming.conversion_buff_type
                existing.conversion_consume_source = incoming.conversion_consume_source
        self._apply_buff_conversions()

    def has_buff(self, buff_type: str) -> bool:
        return any(
            buff.remaining_ms > 0 and buff.buff_type == buff_type
            for buff in self.buffs
        )

    def buff_damage_per_second(self, buff_type: str) -> float:
        return sum(
            buff.base_damage_per_second * max(1, buff.stacks)
            for buff in self.buffs
            if buff.remaining_ms > 0 and buff.buff_type == buff_type
        )

    def tick_buffs(self, delta_ms: int) -> float:
        if not self.is_alive:
            return 0.0
        seconds = max(0, delta_ms) / 1000.0
        damage = 0.0
        remaining: list[BuffState] = []
        for buff in self.buffs:
            if buff.buff_type == "deterioration" and buff.base_value > 0 and buff.remaining_ms <= max(0, delta_ms):
                damage += buff.base_value * max(1, buff.stacks)
            if buff.buff_type in {"ignite", "trauma", "wilt"} and buff.base_damage_per_second > 0:
                dot_multiplier = 1.0 + self.aggravation_dot_bonus_percent() / 100.0
                if buff.buff_type == "ignite":
                    dot_multiplier *= 1.0 + self._ignite_stack_dot_bonus_percent(buff) / 100.0
                damage += buff.base_damage_per_second * max(1, buff.stacks) * dot_multiplier * seconds
            buff.remaining_ms -= max(0, delta_ms)
            if buff.remaining_ms > 0:
                remaining.append(buff)
        self.buffs = remaining
        self._apply_buff_conversions()
        if damage > 0:
            self.take_hit(damage)
        return damage

    def _apply_buff_conversions(self) -> None:
        consumed: set[int] = set()
        for source in tuple(self.buffs):
            if not source.conversion_buff_type or source.threshold <= 0 or source.remaining_ms <= 0:
                continue
            conversion_value = source.base_value if source.base_value > 0 else float(source.stacks)
            if conversion_value < source.threshold:
                continue
            target = next(
                (
                    buff
                    for buff in self.buffs
                    if buff.buff_type == source.conversion_buff_type and buff.source_skill_id == source.source_skill_id
                ),
                None,
            )
            if target is None:
                self.buffs.append(
                    BuffState(
                        buff_type=source.conversion_buff_type,
                        remaining_ms=max(1, source.remaining_ms),
                        polarity=source.polarity,
                        base_value=conversion_value,
                        source_skill_id=source.source_skill_id,
                    )
                )
            else:
                target.remaining_ms = max(target.remaining_ms, source.remaining_ms)
                target.base_value = max(target.base_value, conversion_value)
            if source.conversion_consume_source:
                consumed.add(id(source))
        if consumed:
            self.buffs = [buff for buff in self.buffs if id(buff) not in consumed]

    def _buff_effect_percent(self, buff_type: str) -> float:
        return sum(
            buff.effect_per_stack * max(1, buff.stacks)
            for buff in self.buffs
            if buff.buff_type == buff_type
        )

    def _negative_buff_effect_percent(self, buff_type: str) -> float:
        return sum(
            buff.effect_per_stack * max(1, buff.stacks)
            for buff in self.buffs
            if buff.polarity == "negative" and buff.buff_type == buff_type
        )

    def _damage_taken_increase_percent(self, source_skill_id: str) -> float:
        return sum(
            buff.effect_per_stack * max(1, buff.stacks)
            for buff in self.buffs
            if buff.polarity == "negative"
            and buff.effect_type == "damage_taken_increase"
            and (not buff.source_skill_id or buff.source_skill_id == source_skill_id)
        )

    def aggravation_dot_bonus_percent(self) -> float:
        return sum(
            (buff.base_value / 10.0) * buff.effect_per_stack
            for buff in self.buffs
            if buff.remaining_ms > 0 and buff.buff_type == "aggravation"
        )

    def _ignite_stack_dot_bonus_percent(self, source_buff: BuffState) -> float:
        per_stack = max(0.0, source_buff.dot_damage_bonus_per_ignite_stack_percent)
        if per_stack <= 0:
            return 0.0
        ignite_stacks = sum(
            max(1, buff.stacks)
            for buff in self.buffs
            if buff.remaining_ms > 0 and buff.buff_type == "ignite"
        )
        bonus = ignite_stacks * per_stack
        max_bonus = max(0.0, source_buff.dot_damage_bonus_max_percent)
        return min(max_bonus, bonus) if max_bonus > 0 else bonus

    def _consume_shock_damage(self) -> float:
        damage = 0.0
        remaining: list[BuffState] = []
        for buff in self.buffs:
            if buff.buff_type != "shock":
                remaining.append(buff)
                continue
            if buff.max_triggers <= 0:
                remaining.append(buff)
                continue
            damage += max(0.0, buff.base_value) * max(1, buff.stacks)
            buff.max_triggers -= 1
            if buff.max_triggers > 0:
                remaining.append(buff)
        self.buffs = remaining
        return damage


def _default_conversion_buff_type(buff_type: str, payload: dict[str, object]) -> str:
    if buff_type == "frostbite" and float(payload.get("threshold", 0.0)) > 0:
        return "frozen"
    return ""


def _default_conversion_consume_source(buff_type: str, payload: dict[str, object]) -> bool:
    return True


@dataclass
class DroppedGem:
    drop_id: str
    gem_instance: GemInstance | None
    position: Position
    picked_up: bool = False
    loot_kind: str = "gem"
    equipment_item: object | None = None
    map_entry: object | None = None

    @property
    def generated_loot(self) -> GeneratedLoot:
        return GeneratedLoot(
            self.loot_kind,
            gem_instance=self.gem_instance,
            equipment_item=self.equipment_item,  # type: ignore[arg-type]
            map_entry=self.map_entry,  # type: ignore[arg-type]
        )


@dataclass
class SkillCooldown:
    skill: FinalSkillInstance
    remaining_ms: int = 0


@dataclass
class SkillReleaseEvent:
    skill_instance: FinalSkillInstance
    monster_id: str
    damage: float
    killed: bool
    skill_events: tuple[SkillEvent, ...] = ()
    mana_spent: int = 0
    skipped_reason: str = ""


@dataclass
class PendingSkillEvent:
    skill: FinalSkillInstance
    event: SkillEvent
    remaining_ms: int


@dataclass
class CombatSession:
    player: Player
    monsters: list[Monster]
    dropped_gems: list[DroppedGem]
    elapsed_ms: int
    active_skill_instances: tuple[FinalSkillInstance, ...]
    inventory: GemInventory
    loot_runtime: LootRuntime
    map_run_context: MapRunContext | None = None
    skill_events: list[SkillEvent] = field(default_factory=list)
    _cooldowns: dict[str, SkillCooldown] = field(default_factory=dict)
    _pending_skill_events: list[PendingSkillEvent] = field(default_factory=list)
    _on_kill_recast_counts: dict[str, int] = field(default_factory=dict)
    _on_ignited_hit_cooldowns: dict[str, int] = field(default_factory=dict)
    _life_return_ready_ms: int = 0
    _shield_return_ready_ms: int = 0
    _movement_barrier_distance_accumulator: float = 0.0
    _guard_release_counts: dict[str, int] = field(default_factory=dict)
    _guard_internal_cooldowns: dict[str, int] = field(default_factory=dict)
    _skill_runtime: SkillRuntime = field(default_factory=SkillRuntime)
    _next_drop_number: int = 1
    _last_release_skip_reasons: dict[str, str] = field(default_factory=dict)

    @classmethod
    def start(
        cls,
        *,
        player: Player,
        monsters: list[Monster],
        inventory: GemInventory,
        skill_effect_calculator: SkillEffectCalculator,
        loot_runtime: LootRuntime,
        map_run_context: MapRunContext | None = None,
    ) -> "CombatSession":
        try:
            active_skill_instances = skill_effect_calculator.calculate_all()
        except SkillEffectError as exc:
            raise CombatStartError(exc.error_key, exc.message) from exc
        if not active_skill_instances:
            raise CombatStartError("combat.error.no_active_skill", "没有主动技能宝石不可进入战斗")
        skill_effect_calculator.apply_player_stat_contributions(player)
        cls._apply_skill_owner_buffs(player, active_skill_instances)
        loot_runtime.set_player_stats(
            {
                key: value
                for key, value in vars(player).items()
                if isinstance(value, (int, float, bool))
            }
        )

        session = cls(
            player=player,
            monsters=monsters,
            dropped_gems=[],
            elapsed_ms=0,
            active_skill_instances=active_skill_instances,
            inventory=inventory,
            loot_runtime=loot_runtime,
            map_run_context=map_run_context,
        )
        session._cooldowns = {
            skill.active_gem_instance_id: SkillCooldown(skill=skill, remaining_ms=0)
            for skill in active_skill_instances
        }
        return session

    def move_player_to(self, position: Position, *, elapsed_ms: int = 0) -> None:
        distance = self._distance(self.player.position, position)
        self.player.position = position
        if distance <= 0:
            return
        self._recover_player_shield_while_moving(elapsed_ms)
        self._trigger_player_movement_barrier(distance)

    def _recover_player_shield_while_moving(self, elapsed_ms: int) -> None:
        percent_per_second = max(0.0, float(self.player.moving_shield_recovery_percent_per_second))
        if percent_per_second <= 0 or self.player.max_energy_shield <= 0:
            return
        seconds = max(0, int(elapsed_ms)) / 1000.0
        if seconds <= 0:
            return
        recovered = self.player.max_energy_shield * percent_per_second / 100.0 * seconds
        self.player.current_energy_shield = min(
            self.player.max_energy_shield,
            self.player.current_energy_shield + recovered,
        )

    def _trigger_player_movement_barrier(self, distance: float) -> None:
        required_distance = max(0.0, float(self.player.movement_barrier_distance))
        chance_percent = max(0.0, min(100.0, float(self.player.movement_barrier_chance_percent)))
        if required_distance <= 0 or chance_percent <= 0:
            return
        self._movement_barrier_distance_accumulator += max(0.0, float(distance))
        while self._movement_barrier_distance_accumulator + 1e-9 >= required_distance:
            self._movement_barrier_distance_accumulator -= required_distance
            if self.player.has_buff("barrier"):
                continue
            seed = f"{self.player.player_id}:{self.elapsed_ms}:movement_barrier:{self._movement_barrier_distance_accumulator:.3f}"
            if _stable_percent(seed) < chance_percent:
                self._grant_player_barrier()

    def _grant_player_barrier(self) -> None:
        if self.player.has_buff("barrier"):
            return
        pool = max(0.0, self.player.max_life) + max(0.0, self.player.max_energy_shield)
        absorb_amount = pool * BARRIER_BASE_POOL_PERCENT / 100.0
        absorb_amount *= 1.0 + max(0.0, self.player.barrier_absorb_amount_add_percent) / 100.0
        if absorb_amount <= 0:
            return
        payload = {
            "buff_type": "barrier",
            "absorb_percent": BARRIER_BASE_ABSORB_PERCENT,
            "absorb_amount": absorb_amount,
            "duration_ms": BARRIER_BASE_DURATION_MS,
            "exclude_damage_over_time": True,
            "source_skill_id": "equipment_movement_barrier",
        }
        event = SkillEvent(
            event_id=f"{self.player.player_id}.{self.elapsed_ms}.movement_barrier",
            type="buff_apply",
            timestamp_ms=self.elapsed_ms,
            source_entity=self.player.player_id,
            target_entity=self.player.player_id,
            position={"x": self.player.position.x, "y": self.player.position.y},
            direction={"x": 0.0, "y": 0.0},
            delay_ms=0,
            duration_ms=BARRIER_BASE_DURATION_MS,
            amount=absorb_amount,
            damage_type="",
            skill_instance_id="equipment_movement_barrier",
            vfx_key="",
            sfx_key="",
            reason_key="equipment.movement_barrier.buff_apply",
            payload=payload,
        )
        self.skill_events.append(event)
        self.player.apply_buff_event(event)

    @staticmethod
    def _apply_skill_owner_buffs(player: Player, active_skill_instances: tuple[FinalSkillInstance, ...]) -> None:
        if any(
            (skill.runtime_params or {}).get("prevent_elemental_ailments")
            for skill in active_skill_instances
        ) and not player.has_buff(ELEMENTAL_FUSION_NO_AILMENTS_BUFF):
            player.buffs.append(
                BuffState(
                    buff_type=ELEMENTAL_FUSION_NO_AILMENTS_BUFF,
                    remaining_ms=PERSISTENT_COMBAT_BUFF_DURATION_MS,
                    effect_type="prevent_status_application",
                    source_skill_id="support_elemental_fusion",
                )
            )

    def tick(self, delta_ms: int) -> tuple[SkillReleaseEvent, ...]:
        self.elapsed_ms += delta_ms
        self.player.regenerate(delta_ms)
        self._apply_player_periodic_self_damage(delta_ms)
        for monster in self.monsters:
            monster.tick_buffs(delta_ms)
        events: list[SkillReleaseEvent] = list(self._consume_pending_skill_events(delta_ms))
        for cooldown in self._cooldowns.values():
            cooldown.remaining_ms = max(0, cooldown.remaining_ms - delta_ms)
            while cooldown.remaining_ms == 0:
                monster = self._first_alive_monster()
                if monster is None:
                    break
                skip_reason = self._skill_release_skip_reason(cooldown.skill)
                if skip_reason:
                    self._last_release_skip_reasons[cooldown.skill.active_gem_instance_id] = skip_reason
                    cooldown.remaining_ms = max(1, cooldown.skill.actual_interval_ms)
                    events.append(
                        SkillReleaseEvent(
                            skill_instance=cooldown.skill,
                            monster_id=monster.monster_id,
                            damage=0.0,
                            killed=False,
                            skipped_reason=skip_reason,
                        )
                    )
                    break
                if not self.player.spend_mana(cooldown.skill.mana_cost):
                    self._last_release_skip_reasons[cooldown.skill.active_gem_instance_id] = "combat.skip.insufficient_mana"
                    cooldown.remaining_ms = max(1, cooldown.skill.actual_interval_ms)
                    break
                self._last_release_skip_reasons.pop(cooldown.skill.active_gem_instance_id, None)
                release_skill = self._skill_with_dynamic_war_intent(cooldown.skill)
                guard_event = self._trigger_guard_support(release_skill)
                if guard_event is not None:
                    self.skill_events.append(guard_event)
                    self._consume_buff_event(guard_event)
                if release_skill.uses_skill_event_pipeline:
                    skill_events = self._skill_runtime.execute(
                        release_skill,
                        source_entity=self.player.player_id,
                        source_position=self.player.position,
                        target_entity=monster.monster_id,
                        target_position=monster.position,
                        timestamp_ms=self.elapsed_ms,
                        target_entities=[
                            {"entity_id": alive.monster_id, "position": alive.position}
                            for alive in self.monsters
                            if alive.is_alive
                        ],
                    )
                    self.skill_events.extend(skill_events)
                    self._consume_immediate_skill_events(skill_events)
                    self._queue_pending_skill_events(release_skill, skill_events)
                else:
                    killed = monster.take_hit(release_skill.final_damage)
                    event = SkillReleaseEvent(
                        skill_instance=release_skill,
                        monster_id=monster.monster_id,
                        damage=release_skill.final_damage,
                        killed=killed,
                        mana_spent=release_skill.mana_cost,
                    )
                    events.append(event)
                    if killed:
                        self._drop_from_monster(monster)
                cooldown.remaining_ms = max(1, cooldown.skill.actual_interval_ms)
        return tuple(events)

    def _apply_player_periodic_self_damage(self, delta_ms: int) -> None:
        damage_per_100ms = max(0.0, float(getattr(self.player, "self_true_damage_per_100ms", 0.0)))
        if damage_per_100ms <= 0 or delta_ms <= 0:
            return
        self.player.take_hit_components(
            {"true": damage_per_100ms * max(0, delta_ms) / 100.0},
            avoidable=False,
            damage_over_time=True,
        )

    def _skill_with_dynamic_war_intent(self, skill: FinalSkillInstance) -> FinalSkillInstance:
        war_crit_rating = max(0.0, float(getattr(self.player, "war_intent_crit_rating", 0.0)))
        if war_crit_rating <= 0 or skill.non_crit_damage <= 0:
            return skill
        hit = skill.hit or {}
        if not bool(hit.get("can_crit", False)):
            return skill
        added_crit_chance = CRIT_CHANCE_RATING_CAP * war_crit_rating / (war_crit_rating + CRIT_CHANCE_RATING_PIVOT)
        crit_chance = min(V1_CRIT_CHANCE_CAP_PERCENT / 100.0, max(0.0, skill.crit_chance + added_crit_chance / 100.0))
        expected_hit_damage = skill.non_crit_damage * ((1.0 - crit_chance) + crit_chance * skill.crit_multiplier)
        if expected_hit_damage <= 0:
            return skill
        damage_scale = expected_hit_damage / skill.non_crit_damage
        final_components = {
            damage_type: amount * damage_scale
            for damage_type, amount in (skill.final_damage_components or {skill.damage_type: skill.final_damage}).items()
        }
        runtime_params = dict(skill.runtime_params or {})
        runtime_params["war_intent_crit_rating"] = war_crit_rating
        runtime_params["war_intent_crit_chance_add_percent"] = added_crit_chance
        skill_stats = dict(skill.skill_stats or {})
        skill_stats["war_intent_crit_rating"] = war_crit_rating
        skill_stats["war_intent_crit_chance_add_percent"] = added_crit_chance
        return replace(
            skill,
            final_damage=expected_hit_damage,
            crit_chance=crit_chance,
            expected_hit_damage=expected_hit_damage,
            preview_dps=expected_hit_damage * skill.uses_per_second * skill.hit_coverage_factor,
            runtime_params=runtime_params,
            skill_stats=skill_stats,
            final_damage_components=final_components,
        )

    def _trigger_guard_support(self, skill: FinalSkillInstance) -> SkillEvent | None:
        runtime_params = skill.runtime_params or {}
        trigger_count = max(0, int(runtime_params.get("guard_trigger_count", 0)))
        if trigger_count <= 0:
            return None
        key = skill.active_gem_instance_id
        current_count = self._guard_release_counts.get(key, 0) + 1
        self._guard_release_counts[key] = current_count
        if current_count < trigger_count:
            return None
        if self.player.has_buff("guard"):
            return None
        if self._guard_internal_cooldowns.get(key, 0) > self.elapsed_ms:
            return None

        self._guard_release_counts[key] = 0
        internal_cooldown_ms = max(0, int(runtime_params.get("guard_internal_cooldown_ms", 0)))
        if internal_cooldown_ms > 0:
            self._guard_internal_cooldowns[key] = self.elapsed_ms + internal_cooldown_ms

        absorb_amount = max(0.0, float(runtime_params.get("guard_absorb_amount", 150.0)))
        duration_ms = max(0, int(runtime_params.get("guard_duration_ms", 6000)))
        position = {"x": self.player.position.x, "y": self.player.position.y}
        payload = {
            "skill_id": skill.skill_package_id or skill.skill_template_id,
            "buff_type": "guard",
            "absorb_percent": max(0.0, float(runtime_params.get("guard_absorb_percent", 70.0))),
            "absorb_amount": absorb_amount,
            "duration_ms": duration_ms,
            "exclude_damage_over_time": bool(runtime_params.get("guard_exclude_damage_over_time", True)),
            "guard_trigger_count": trigger_count,
            "guard_internal_cooldown_ms": internal_cooldown_ms,
            "source_skill_id": skill.skill_package_id or skill.skill_template_id,
        }
        return SkillEvent(
            event_id=f"{key}.{self.elapsed_ms}.guard_support",
            type="buff_apply",
            timestamp_ms=self.elapsed_ms,
            source_entity=self.player.player_id,
            target_entity=self.player.player_id,
            position=position,
            direction={"x": 0.0, "y": 0.0},
            delay_ms=0,
            duration_ms=duration_ms,
            amount=absorb_amount,
            damage_type=skill.damage_type,
            skill_instance_id=key,
            vfx_key=str((skill.presentation_keys or {}).get("vfx", skill.visual_effect)),
            sfx_key=str((skill.presentation_keys or {}).get("sfx", "")),
            reason_key="skill_event.guard.buff_apply",
            payload=payload,
        )

    def _skill_release_skip_reason(self, skill: FinalSkillInstance) -> str:
        source_context = skill.source_context or {}
        auto_release = source_context.get("auto_release", {})
        if not isinstance(auto_release, dict):
            return ""
        if auto_release.get("policy") != "defensive_threshold":
            return ""
        life_threshold = float(auto_release.get("low_life_percent", 70.0))
        shield_threshold = float(auto_release.get("low_shield_percent", 50.0))
        life_ratio = (self.player.current_life / self.player.max_life * 100.0) if self.player.max_life > 0 else 0.0
        shield_ratio = 100.0
        if self.player.max_energy_shield > 0:
            shield_ratio = self.player.current_energy_shield / self.player.max_energy_shield * 100.0
        if life_ratio <= life_threshold:
            return ""
        if self.player.max_energy_shield > 0 and shield_ratio <= shield_threshold:
            return ""
        return "combat.skip.defensive_threshold"

    def _queue_pending_skill_events(
        self,
        skill: FinalSkillInstance,
        skill_events: tuple[SkillEvent, ...],
    ) -> None:
        for event in skill_events:
            if event.delay_ms <= 0:
                continue
            self._pending_skill_events.append(
                PendingSkillEvent(skill=skill, event=event, remaining_ms=event.delay_ms)
            )

    def _consume_pending_skill_events(self, delta_ms: int) -> tuple[SkillReleaseEvent, ...]:
        release_events: list[SkillReleaseEvent] = []
        remaining: list[PendingSkillEvent] = []
        pending_events = self._pending_skill_events
        self._pending_skill_events = []
        for pending in pending_events:
            pending.remaining_ms -= delta_ms
            if pending.remaining_ms > 0:
                remaining.append(pending)
                continue
            if pending.event.type == "damage":
                release_event = self._consume_damage_event(pending.skill, pending.event)
                if release_event is not None:
                    release_events.append(release_event)
            elif pending.event.type == "status_apply":
                self._consume_status_event(pending.event)
            elif pending.event.type == "buff_apply":
                self._consume_buff_event(pending.event)
            elif pending.event.type == "forced_movement":
                self._consume_forced_movement_event(pending.event)
        self._pending_skill_events = remaining + self._pending_skill_events
        return tuple(release_events)

    def _consume_immediate_skill_events(self, skill_events: tuple[SkillEvent, ...]) -> None:
        for event in skill_events:
            if event.delay_ms > 0:
                continue
            if event.type == "buff_apply":
                self._consume_buff_event(event)
            elif event.type == "status_apply":
                self._consume_status_event(event)
            elif event.type == "forced_movement":
                self._consume_forced_movement_event(event)

    def _consume_damage_event(
        self,
        skill: FinalSkillInstance,
        event: SkillEvent,
    ) -> SkillReleaseEvent | None:
        target = self._monster_by_id(event.target_entity)
        if target is None:
            return None
        damage = float(event.amount or 0.0)
        components = event.payload.get("damage_components", {}) if isinstance(event.payload, dict) else {}
        source_skill_id = str(event.payload.get("skill_id", "")) if isinstance(event.payload, dict) else ""
        dot_bonus_per_10_aggravation = (
            max(0.0, float(event.payload.get("dot_damage_bonus_per_10_aggravation_percent", 0.0)))
            if isinstance(event.payload, dict)
            else 0.0
        )
        double_damage_chance = (
            max(0.0, min(100.0, float(event.payload.get("double_damage_chance_percent", 0.0))))
            if isinstance(event.payload, dict)
            else 0.0
        )
        if double_damage_chance > 0 and _stable_percent(f"{event.event_id}:double_damage") < double_damage_chance:
            damage *= 2.0
            if isinstance(components, dict) and components:
                components = {
                    str(damage_type): max(0.0, float(amount)) * 2.0
                    for damage_type, amount in components.items()
                }
        if dot_bonus_per_10_aggravation > 0:
            multiplier = 1.0 + target.aggravation_dot_bonus_percent() / 100.0
            damage *= multiplier
            if isinstance(components, dict) and components:
                components = {
                    str(damage_type): max(0.0, float(amount)) * multiplier
                    for damage_type, amount in components.items()
                }
        killed = (
            target.take_hit_components(components, source_skill_id=source_skill_id)
            if isinstance(components, dict) and components
            else target.take_hit(damage)
        )
        if isinstance(components, dict):
            self._trigger_numbed_layers_from_lightning_hit(target, components)
        if not killed:
            killed = self._trigger_cull_on_damage(event, target)
        self._trigger_war_intent_on_hit(target)
        if killed:
            self._trigger_on_kill_explosion(skill, event, target)
            self._trigger_on_kill_recast(skill, event, target)
            self._drop_from_monster(target)
            self._trigger_war_intent_on_kill()
        self._trigger_player_on_hit_return(skill, event)
        self._trigger_on_ignited_hit_explosion(skill, event, target)
        related_events = tuple(
            skill_event
            for skill_event in self.skill_events
            if skill_event.skill_instance_id == event.skill_instance_id
            and skill_event.timestamp_ms == event.timestamp_ms
        )
        return SkillReleaseEvent(
            skill_instance=skill,
            monster_id=target.monster_id,
            damage=damage,
            killed=killed,
            skill_events=related_events or (event,),
        )

    def _trigger_cull_on_damage(self, event: SkillEvent, target: Monster) -> bool:
        payload = event.payload if isinstance(event.payload, dict) else {}
        threshold_percent = max(0.0, min(100.0, float(payload.get("cull_threshold_percent", 0.0))))
        if threshold_percent <= 0 or not target.is_alive or target.max_life <= 0:
            return False
        if target.current_life / target.max_life * 100.0 >= threshold_percent:
            return False
        target.current_life = 0.0
        target.is_alive = False
        return True

    def _trigger_war_intent_on_hit(self, target: Monster) -> None:
        if target.is_tough_enemy():
            self._gain_war_intent_point()

    def _trigger_numbed_layers_from_lightning_hit(self, target: Monster, components: dict[str, object]) -> None:
        if not target.is_alive or not target.has_buff("numbed"):
            return
        lightning_damage = max(0.0, float(components.get("lightning", 0.0)))
        if lightning_damage <= 0:
            return
        threshold = max(1.0, (target.max_life + max(0.0, target.max_energy_shield)) * 0.10)
        extra_layers = int(lightning_damage // threshold)
        if extra_layers <= 0:
            return
        target.apply_buff(
            {
                "status_type": "numbed",
                "duration_ms": 2000,
                "stacks": extra_layers,
                "max_stacks": 10,
                "effect_per_stack": 5,
            }
        )

    def _trigger_war_intent_on_kill(self) -> None:
        self._gain_war_intent_point()

    def _gain_war_intent_point(self) -> None:
        if float(getattr(self.player, "war_intent_enabled", 0.0)) <= 0:
            return
        self.player.war_intent_points = min(100, max(0, int(self.player.war_intent_points)) + 1)
        self.player.war_intent_remaining_ms = 10_000
        effect_multiplier = 1.0 + max(0.0, float(getattr(self.player, "war_intent_effect_add_percent", 0.0))) / 100.0
        self.player.war_intent_crit_rating = self.player.war_intent_points * 2.0 * effect_multiplier

    def _trigger_player_on_hit_return(self, skill: FinalSkillInstance | None, event: SkillEvent) -> None:
        if skill is None:
            return
        if (skill.source_context or {}).get("damage_form") == "damage_over_time":
            return
        if event.type != "damage" or event.amount is None or event.amount <= 0:
            return
        life_percent = min(30.0, max(0.0, float(getattr(self.player, "life_return_percent", 0.0))))
        if life_percent > 0 and self.elapsed_ms >= self._life_return_ready_ms and self.player.max_life > self.player.current_life:
            missing_life = max(0.0, self.player.max_life - self.player.current_life)
            self.player.current_life = min(self.player.max_life, self.player.current_life + missing_life * life_percent / 100.0)
            self._life_return_ready_ms = self.elapsed_ms + 500
        shield_percent = min(30.0, max(0.0, float(getattr(self.player, "shield_return_percent", 0.0))))
        if (
            shield_percent > 0
            and self.elapsed_ms >= self._shield_return_ready_ms
            and self.player.max_energy_shield > self.player.current_energy_shield
        ):
            missing_shield = max(0.0, self.player.max_energy_shield - self.player.current_energy_shield)
            self.player.current_energy_shield = min(
                self.player.max_energy_shield,
                self.player.current_energy_shield + missing_shield * shield_percent / 100.0,
            )
            self._shield_return_ready_ms = self.elapsed_ms + 500

    def _consume_status_event(self, event: SkillEvent) -> None:
        target = self._monster_by_id(event.target_entity)
        if target is None:
            return
        payload = event.payload if isinstance(event.payload, dict) else {}
        status_type = str(payload.get("status_type", payload.get("buff_type", "")))
        if self._source_prevents_status_application(event.source_entity, status_type):
            return
        target.apply_buff(event.payload)

    def _source_prevents_status_application(self, source_entity: str, status_type: str) -> bool:
        if source_entity == self.player.player_id:
            return self.player.prevents_status_application(status_type)
        source_monster = self._monster_by_id(source_entity)
        return (
            status_type in ELEMENTAL_FUSION_PREVENTED_STATUS_TYPES
            and source_monster is not None
            and source_monster.has_buff(ELEMENTAL_FUSION_NO_AILMENTS_BUFF)
        )

    def _consume_buff_event(self, event: SkillEvent) -> None:
        if event.target_entity == self.player.player_id:
            self.player.apply_buff_event(event)
            return
        target = self._monster_by_id(event.target_entity)
        if target is None:
            return
        payload = event.payload if isinstance(event.payload, dict) else {}
        target.apply_buff(
            {
                **payload,
                "source_skill_id": str(payload.get("source_skill_id", payload.get("skill_id", ""))),
            }
        )

    def _consume_forced_movement_event(self, event: SkillEvent) -> None:
        target = self._monster_by_id(event.target_entity)
        payload = event.payload if isinstance(event.payload, dict) else {}
        if target is None and payload.get("movement_policy") == "pull_to_origin" and payload.get("movement_scope") == "damage_zone":
            origin = payload.get("origin_world_position", payload.get("origin"))
            try:
                origin_x = float(origin["x"])
                origin_y = float(origin["y"])
                radius = max(0.0, float(payload.get("radius", 0.0)))
                movement_distance = max(0.0, float(payload.get("movement_distance", event.amount or 0.0)))
            except (KeyError, TypeError, ValueError):
                return
            if radius <= 0 or movement_distance <= 0:
                return
            for monster in self.monsters:
                if not monster.is_alive:
                    continue
                dx = origin_x - monster.position.x
                dy = origin_y - monster.position.y
                length = hypot(dx, dy)
                if length <= 0 or length > radius:
                    continue
                distance = min(movement_distance, length)
                monster.position = Position(
                    monster.position.x + dx / length * distance,
                    monster.position.y + dy / length * distance,
                )
            return
        if target is None or not target.is_alive:
            return
        destination = payload.get("destination_world_position", event.position)
        if payload.get("movement_policy") == "pull_to_origin":
            origin = payload.get("origin_world_position", payload.get("origin"))
            try:
                origin_x = float(origin["x"])
                origin_y = float(origin["y"])
                movement_distance = max(0.0, float(payload.get("movement_distance", event.amount or 0.0)))
            except (KeyError, TypeError, ValueError):
                origin_x = origin_y = movement_distance = 0.0
            if movement_distance > 0:
                dx = origin_x - target.position.x
                dy = origin_y - target.position.y
                length = hypot(dx, dy)
                if length > 0:
                    distance = min(movement_distance, length)
                    destination = {
                        "x": target.position.x + dx / length * distance,
                        "y": target.position.y + dy / length * distance,
                    }
                else:
                    destination = {"x": origin_x, "y": origin_y}
        if not isinstance(destination, dict):
            return
        try:
            target.position = Position(float(destination["x"]), float(destination["y"]))
        except (KeyError, TypeError, ValueError):
            return

    def _trigger_on_ignited_hit_explosion(
        self,
        skill: FinalSkillInstance,
        event: SkillEvent,
        trigger_target: Monster,
    ) -> None:
        payload = event.payload if isinstance(event.payload, dict) else {}
        radius = max(0.0, float(payload.get("on_ignited_hit_explosion_radius", 0.0)))
        true_damage_percent = max(0.0, float(payload.get("on_ignited_hit_true_damage_percent_of_ignite_dps", 0.0)))
        indirect_fire_damage = max(0.0, float(payload.get("on_ignited_hit_indirect_fire_damage", 0.0)))
        cooldown_ms = max(0, int(payload.get("on_ignited_hit_cooldown_ms", 0)))
        if radius <= 0 or (true_damage_percent <= 0 and indirect_fire_damage <= 0):
            return
        if not trigger_target.has_buff("ignite"):
            return

        now_ms = max(self.elapsed_ms, int(event.timestamp_ms))
        cooldown_key = f"{event.skill_instance_id}:{trigger_target.monster_id}:on_ignited_hit"
        if self._on_ignited_hit_cooldowns.get(cooldown_key, -1) > now_ms:
            return
        if cooldown_ms > 0:
            self._on_ignited_hit_cooldowns[cooldown_key] = now_ms + cooldown_ms

        ignite_dps = trigger_target.buff_damage_per_second("ignite")
        true_damage = ignite_dps * true_damage_percent / 100.0
        origin = trigger_target.position
        center = {"x": origin.x, "y": origin.y}
        skill_id = skill.skill_package_id or skill.skill_template_id
        zone_id = f"{event.event_id}.ignited_hit.zone"
        explosion_vfx_key = f"skill_event.{skill_id}.ignited_hit.explosion"
        trigger_payload = {
            "skill_id": skill_id,
            "trigger_event_id": event.event_id,
            "trigger_event_type": event.type,
            "trigger_target": trigger_target.monster_id,
            "trigger_target_ignite_dps": ignite_dps,
            "effect": "on_ignited_hit_explosion",
        }
        zone_payload = {
            **trigger_payload,
            "zone_id": zone_id,
            "origin": center,
            "origin_world_position": center,
            "shape": "circle",
            "radius": radius,
            "hit_at_ms": 0,
            "damage_type": "true",
            "damage_module": "ignite_dps_true_damage_and_indirect_fire",
            "true_damage_percent_of_ignite_dps": true_damage_percent,
            "indirect_fire_damage": indirect_fire_damage,
        }
        self.skill_events.append(
            SkillEvent(
                event_id=zone_id,
                type="damage_zone",
                timestamp_ms=event.timestamp_ms,
                source_entity=event.source_entity,
                target_entity=trigger_target.monster_id,
                position=center,
                direction={"x": 0.0, "y": 0.0},
                delay_ms=event.delay_ms,
                duration_ms=180,
                amount=None,
                damage_type="true",
                skill_instance_id=event.skill_instance_id,
                vfx_key=explosion_vfx_key,
                sfx_key=event.sfx_key,
                reason_key=f"skill_event.{skill_id}.ignited_hit.zone",
                payload=zone_payload,
            )
        )
        hit_index = 0
        for monster in self.monsters:
            if not monster.is_alive:
                continue
            target_distance = self._distance(origin, monster.position)
            if target_distance > radius:
                continue
            hit_index += 1
            hit_marker_id = f"{zone_id}.hit.{hit_index}"
            target_position = {"x": monster.position.x, "y": monster.position.y}
            hit_payload = {
                **zone_payload,
                "hit_marker_id": hit_marker_id,
                "target_entity": monster.monster_id,
                "target_distance": target_distance,
                "target_world_position": target_position,
                "hit_world_position": target_position,
            }
            damage_components: dict[str, float] = {}
            if true_damage > 0:
                damage_components["true"] = true_damage
            if indirect_fire_damage > 0:
                damage_components["fire"] = indirect_fire_damage
            killed_by_explosion = monster.take_hit_components(damage_components, source_skill_id=skill_id)
            self.skill_events.append(
                SkillEvent(
                    event_id=hit_marker_id,
                    type="damage_zone_hit",
                    timestamp_ms=event.timestamp_ms,
                    source_entity=event.source_entity,
                    target_entity=monster.monster_id,
                    position=target_position,
                    direction={"x": 0.0, "y": 0.0},
                    delay_ms=event.delay_ms,
                    duration_ms=0,
                    amount=None,
                    damage_type="true",
                    skill_instance_id=event.skill_instance_id,
                    vfx_key=explosion_vfx_key,
                    sfx_key=event.sfx_key,
                    reason_key=f"skill_event.{skill_id}.ignited_hit.hit",
                    payload=hit_payload,
                )
            )
            for damage_type, amount, damage_form in (
                ("true", true_damage, "secondary"),
                ("fire", indirect_fire_damage, "indirect"),
            ):
                if amount <= 0:
                    continue
                damage_event_id = f"{hit_marker_id}.{damage_type}.{damage_form}_damage"
                self.skill_events.append(
                    SkillEvent(
                        event_id=damage_event_id,
                        type="damage",
                        timestamp_ms=event.timestamp_ms,
                        source_entity=event.source_entity,
                        target_entity=monster.monster_id,
                        position=target_position,
                        direction={"x": 0.0, "y": 0.0},
                        delay_ms=event.delay_ms,
                        duration_ms=0,
                        amount=amount,
                        damage_type=damage_type,
                        skill_instance_id=event.skill_instance_id,
                        vfx_key=explosion_vfx_key,
                        sfx_key=event.sfx_key,
                        reason_key=f"skill_event.{skill_id}.ignited_hit.{damage_form}_damage",
                        payload={
                            **hit_payload,
                            "trigger_event_id": hit_marker_id,
                            "trigger_event_type": "damage_zone_hit",
                            "damage_components": {damage_type: amount},
                            "damage_form": damage_form,
                        },
                    )
                )
            if killed_by_explosion:
                self.skill_events.append(
                    SkillEvent(
                        event_id=f"{hit_marker_id}.unit_killed",
                        type="unit_killed",
                        timestamp_ms=event.timestamp_ms,
                        source_entity=event.source_entity,
                        target_entity=monster.monster_id,
                        position=target_position,
                        direction={"x": 0.0, "y": 0.0},
                        delay_ms=event.delay_ms,
                        duration_ms=0,
                        amount=None,
                        damage_type="true",
                        skill_instance_id=event.skill_instance_id,
                        vfx_key=event.vfx_key,
                        sfx_key=event.sfx_key,
                        reason_key=f"skill_event.{skill_id}.unit_killed",
                        payload={
                            **trigger_payload,
                            "trigger_event_id": hit_marker_id,
                            "trigger_event_type": "damage_zone_hit",
                            "defeated_target": monster.monster_id,
                            "defeated_target_max_life": monster.max_life,
                        },
                    )
                )
                self._drop_from_monster(monster)

    def _trigger_on_kill_explosion(
        self,
        skill: FinalSkillInstance,
        event: SkillEvent,
        defeated: Monster,
    ) -> None:
        payload = event.payload if isinstance(event.payload, dict) else {}
        chance_percent = max(0.0, float(payload.get("on_kill_explosion_chance_percent", 0.0)))
        radius = max(0.0, float(payload.get("on_kill_explosion_radius", 0.0)))
        max_life_percent = max(0.0, float(payload.get("on_kill_explosion_max_life_percent", 0.0)))
        if chance_percent <= 0 or radius <= 0 or max_life_percent <= 0:
            return
        if _stable_percent(f"{event.event_id}:kill_explosion") >= chance_percent:
            return
        origin = defeated.position
        damage_type = str(payload.get("on_kill_explosion_damage_type", "true"))
        skill_id = skill.skill_package_id or skill.skill_template_id
        zone_id = f"{event.event_id}.kill_explosion.zone"
        kill_payload = {
            "skill_id": skill_id,
            "trigger_event_id": event.event_id,
            "trigger_event_type": event.type,
            "defeated_target": defeated.monster_id,
            "defeated_target_max_life": defeated.max_life,
            "kill_position": {"x": origin.x, "y": origin.y},
            "effect": "on_kill_explosion",
        }
        zone_payload = {
            **kill_payload,
            "zone_id": zone_id,
            "origin": {"x": origin.x, "y": origin.y},
            "origin_world_position": {"x": origin.x, "y": origin.y},
            "shape": "circle",
            "radius": radius,
            "hit_at_ms": 0,
            "damage_type": damage_type,
            "damage_module": "max_life_percent_true_damage",
            "max_life_percent": max_life_percent,
        }
        self.skill_events.extend(
            [
                SkillEvent(
                    event_id=f"{event.event_id}.unit_killed",
                    type="unit_killed",
                    timestamp_ms=event.timestamp_ms,
                    source_entity=event.source_entity,
                    target_entity=defeated.monster_id,
                    position={"x": origin.x, "y": origin.y},
                    direction={"x": 0.0, "y": 0.0},
                    delay_ms=event.delay_ms,
                    duration_ms=0,
                    amount=None,
                    damage_type=event.damage_type,
                    skill_instance_id=event.skill_instance_id,
                    vfx_key=event.vfx_key,
                    sfx_key=event.sfx_key,
                    reason_key=f"skill_event.{skill_id}.unit_killed",
                    payload=kill_payload,
                ),
                SkillEvent(
                    event_id=zone_id,
                    type="damage_zone",
                    timestamp_ms=event.timestamp_ms,
                    source_entity=event.source_entity,
                    target_entity=defeated.monster_id,
                    position={"x": origin.x, "y": origin.y},
                    direction={"x": 0.0, "y": 0.0},
                    delay_ms=event.delay_ms,
                    duration_ms=180,
                    amount=None,
                    damage_type=damage_type,
                    skill_instance_id=event.skill_instance_id,
                    vfx_key=event.vfx_key,
                    sfx_key=event.sfx_key,
                    reason_key=f"skill_event.{skill_id}.kill_explosion.zone",
                    payload=zone_payload,
                ),
            ]
        )
        hit_index = 0
        for monster in self.monsters:
            if monster.monster_id == defeated.monster_id or not monster.is_alive:
                continue
            if self._distance(origin, monster.position) > radius:
                continue
            hit_index += 1
            hit_marker_id = f"{zone_id}.hit.{hit_index}"
            amount = monster.max_life * max_life_percent / 100.0
            hit_payload = {
                **zone_payload,
                "hit_marker_id": hit_marker_id,
                "target_entity": monster.monster_id,
                "target_max_life": monster.max_life,
                "target_world_position": {"x": monster.position.x, "y": monster.position.y},
                "hit_world_position": {"x": monster.position.x, "y": monster.position.y},
            }
            damage_payload = {
                **hit_payload,
                "trigger_event_id": hit_marker_id,
                "trigger_event_type": "damage_zone_hit",
                "damage_components": {damage_type: amount},
            }
            killed_by_explosion = monster.take_hit_components({damage_type: amount})
            self.skill_events.extend(
                [
                    SkillEvent(
                        event_id=hit_marker_id,
                        type="damage_zone_hit",
                        timestamp_ms=event.timestamp_ms,
                        source_entity=event.source_entity,
                        target_entity=monster.monster_id,
                        position={"x": monster.position.x, "y": monster.position.y},
                        direction={"x": 0.0, "y": 0.0},
                        delay_ms=event.delay_ms,
                        duration_ms=0,
                        amount=None,
                        damage_type=damage_type,
                        skill_instance_id=event.skill_instance_id,
                        vfx_key=event.vfx_key,
                        sfx_key=event.sfx_key,
                        reason_key=f"skill_event.{skill_id}.kill_explosion.hit",
                        payload=hit_payload,
                    ),
                    SkillEvent(
                        event_id=f"{hit_marker_id}.max_life_percent_true_damage",
                        type="damage",
                        timestamp_ms=event.timestamp_ms,
                        source_entity=event.source_entity,
                        target_entity=monster.monster_id,
                        position={"x": monster.position.x, "y": monster.position.y},
                        direction={"x": 0.0, "y": 0.0},
                        delay_ms=event.delay_ms,
                        duration_ms=0,
                        amount=amount,
                        damage_type=damage_type,
                        skill_instance_id=event.skill_instance_id,
                        vfx_key=event.vfx_key,
                        sfx_key=event.sfx_key,
                        reason_key=f"skill_event.{skill_id}.kill_explosion.damage",
                        payload=damage_payload,
                    ),
                ]
            )
            if killed_by_explosion:
                self.skill_events.append(
                    SkillEvent(
                        event_id=f"{hit_marker_id}.max_life_percent_true_damage.unit_killed",
                        type="unit_killed",
                        timestamp_ms=event.timestamp_ms,
                        source_entity=event.source_entity,
                        target_entity=monster.monster_id,
                        position={"x": monster.position.x, "y": monster.position.y},
                        direction={"x": 0.0, "y": 0.0},
                        delay_ms=event.delay_ms,
                        duration_ms=0,
                        amount=None,
                        damage_type=damage_type,
                        skill_instance_id=event.skill_instance_id,
                        vfx_key=event.vfx_key,
                        sfx_key=event.sfx_key,
                        reason_key=f"skill_event.{skill_id}.unit_killed",
                        payload={
                            **kill_payload,
                            "trigger_event_id": f"{hit_marker_id}.max_life_percent_true_damage",
                            "trigger_event_type": "damage",
                            "defeated_target": monster.monster_id,
                            "defeated_target_max_life": monster.max_life,
                        },
                    )
                )
                self._drop_from_monster(monster)

    def _trigger_on_kill_recast(
        self,
        skill: FinalSkillInstance,
        event: SkillEvent,
        defeated: Monster,
    ) -> None:
        payload = event.payload if isinstance(event.payload, dict) else {}
        chance_percent = max(0.0, float(payload.get("on_kill_recast_chance_percent", 0.0)))
        max_per_area = max(1, int(payload.get("on_kill_recast_max_per_area", 1)))
        source_area_id = str(payload.get("area_id", ""))
        if chance_percent <= 0 or not source_area_id:
            return
        if self._on_kill_recast_counts.get(source_area_id, 0) >= max_per_area:
            return
        if _stable_percent(f"{event.event_id}:kill_recast") >= chance_percent:
            return

        recast_index = self._on_kill_recast_counts.get(source_area_id, 0) + 1
        self._on_kill_recast_counts[source_area_id] = recast_index
        origin = defeated.position
        center = {"x": origin.x, "y": origin.y}
        skill_id = skill.skill_package_id or skill.skill_template_id
        runtime_params = skill.runtime_params or {}
        radius = max(1.0, float(payload.get("radius", runtime_params.get("radius", 1.0))))
        ring_width = max(1.0, float(payload.get("ring_width", runtime_params.get("ring_width", 48.0))))
        expand_duration_ms = max(0, int(payload.get("expand_duration_ms", payload.get("duration_ms", 0))))
        hit_at_ms = max(0, int(payload.get("hit_at_ms", 0)))
        hit_at_ms = min(hit_at_ms, expand_duration_ms) if expand_duration_ms > 0 else hit_at_ms
        max_targets = max(1, int(payload.get("max_targets", len(self.monsters) or 1)))
        suppress_hit_vfx = bool(payload.get("suppress_hit_vfx", runtime_params.get("suppress_hit_vfx", False)))
        recast_area_id = f"{event.event_id}.kill_recast.area.{recast_index}"
        damage_amount = float(event.amount or skill.final_damage)
        floating_key = (skill.presentation_keys or {}).get("floating_text", "skill_event.fire_bolt.floating_text")
        reason_key = event.reason_key
        kill_payload = {
            "skill_id": skill_id,
            "trigger_event_id": event.event_id,
            "trigger_event_type": event.type,
            "defeated_target": defeated.monster_id,
            "defeated_target_max_life": defeated.max_life,
            "kill_position": center,
            "source_area_id": source_area_id,
            "area_id": recast_area_id,
            "effect": "on_kill_recast",
        }
        area_payload = {
            **kill_payload,
            "center": center,
            "center_world_position": center,
            "radius": radius,
            "ring_width": ring_width,
            "duration_ms": expand_duration_ms,
            "expand_duration_ms": expand_duration_ms,
            "hit_at_ms": hit_at_ms,
            "damage_type": skill.damage_type,
            "vfx_key": event.vfx_key,
            "center_policy": "kill_position",
            "damage_falloff_by_distance": str(payload.get("damage_falloff_by_distance", "none")),
            "status_chance_scale": float(payload.get("status_chance_scale", 1.0)),
            "max_targets": max_targets,
            "on_kill_recast_chance_percent": chance_percent,
            "on_kill_recast_max_per_area": max_per_area,
            "suppress_hit_vfx": suppress_hit_vfx,
            "skill_name": skill_id,
        }
        hit_targets = sorted(
            (
                (monster, self._distance(origin, monster.position))
                for monster in self.monsters
                if monster.monster_id != defeated.monster_id and monster.is_alive
            ),
            key=lambda item: item[1],
        )
        hit_targets = [(monster, distance) for monster, distance in hit_targets if distance <= radius][:max_targets]
        area_payload["hit_target_count"] = len(hit_targets)
        recast_events: list[SkillEvent] = [
            SkillEvent(
                event_id=f"{event.event_id}.unit_killed",
                type="unit_killed",
                timestamp_ms=event.timestamp_ms,
                source_entity=event.source_entity,
                target_entity=defeated.monster_id,
                position=center,
                direction={"x": 0.0, "y": 0.0},
                delay_ms=event.delay_ms,
                duration_ms=0,
                amount=None,
                damage_type=event.damage_type,
                skill_instance_id=event.skill_instance_id,
                vfx_key=event.vfx_key,
                sfx_key=event.sfx_key,
                reason_key=f"skill_event.{skill_id}.unit_killed",
                payload=kill_payload,
            ),
            SkillEvent(
                event_id=recast_area_id,
                type="area_spawn",
                timestamp_ms=event.timestamp_ms,
                source_entity=event.source_entity,
                target_entity=defeated.monster_id,
                position=center,
                direction={"x": 0.0, "y": 0.0},
                delay_ms=0,
                duration_ms=expand_duration_ms,
                amount=None,
                damage_type=skill.damage_type,
                skill_instance_id=event.skill_instance_id,
                vfx_key=event.vfx_key,
                sfx_key=event.sfx_key,
                reason_key=f"skill_event.{skill_id}.kill_recast.area",
                payload=area_payload,
            ),
        ]
        floating_text = f"{round(damage_amount)}点{skill.damage_type}伤害"
        for index, (monster, target_distance) in enumerate(hit_targets, start=1):
            target_position = {"x": monster.position.x, "y": monster.position.y}
            target_direction = {
                "x": (monster.position.x - origin.x) / (target_distance or 1.0),
                "y": (monster.position.y - origin.y) / (target_distance or 1.0),
            }
            hit_payload = {
                **area_payload,
                "target_distance": target_distance,
                "target_world_position": target_position,
                "hit_world_position": target_position,
            }
            hit_event_specs = [
                ("damage", damage_amount, 0, reason_key, target_position),
                ("floating_text", damage_amount, 800, floating_key, {"x": monster.position.x, "y": monster.position.y - 28.0}),
            ]
            if not suppress_hit_vfx:
                hit_event_specs.insert(1, ("hit_vfx", None, 420, reason_key, target_position))
            for event_type, amount, duration, reason, position in hit_event_specs:
                event_payload = {**hit_payload}
                if event_type == "floating_text":
                    event_payload["text"] = floating_text
                recast_events.append(
                    SkillEvent(
                        event_id=f"{recast_area_id}.{monster.monster_id}.{event_type}.{index}",
                        type=event_type,
                        timestamp_ms=event.timestamp_ms + hit_at_ms,
                        source_entity=event.source_entity,
                        target_entity=monster.monster_id,
                        position=dict(position),
                        direction=target_direction,
                        delay_ms=hit_at_ms,
                        duration_ms=duration,
                        amount=amount,
                        damage_type=skill.damage_type,
                        skill_instance_id=event.skill_instance_id,
                        vfx_key=event.vfx_key,
                        sfx_key=event.sfx_key,
                        reason_key=reason,
                        payload=event_payload,
                    )
                )
        self.skill_events.extend(recast_events)
        self._queue_pending_skill_events(skill, tuple(recast_events))

    def pickup_nearby(self) -> tuple[GemInstance, ...]:
        picked: list[object] = []
        for dropped in self.dropped_gems:
            if dropped.picked_up:
                continue
            if self._distance(self.player.position, dropped.position) > self.player.item_interaction_reach:
                continue
            stored = self.loot_runtime.pickup_loot(dropped.generated_loot, self.inventory)
            dropped.picked_up = True
            picked.append(stored)
        return tuple(picked)  # type: ignore[return-value]

    def _drop_from_monster(self, monster: Monster) -> DroppedGem:
        first_drop: DroppedGem | None = None
        loot_context = None
        if self.map_run_context is not None:
            loot_context = LootContext(
                run=self.map_run_context,
                monster_id=monster.monster_id,
                monster_rarity=monster.rarity,
                is_boss=monster.is_boss,
            )
        for loot in self.loot_runtime.generate_loot_drops(loot_context):
            dropped = DroppedGem(
                drop_id=f"drop_{self._next_drop_number:06d}",
                gem_instance=loot.gem_instance,
                position=monster.position,
                picked_up=False,
                loot_kind=loot.loot_kind,
                equipment_item=loot.equipment_item,
                map_entry=loot.map_entry,
            )
            self._next_drop_number += 1
            self.dropped_gems.append(dropped)
            if first_drop is None:
                first_drop = dropped
        if first_drop is None:
            return DroppedGem(
                drop_id=f"drop_{self._next_drop_number:06d}",
                gem_instance=None,
                position=monster.position,
                picked_up=True,
                loot_kind="none",
            )
        return first_drop

    def _first_alive_monster(self) -> Monster | None:
        for monster in self.monsters:
            if monster.is_alive:
                return monster
        return None

    def _monster_by_id(self, monster_id: str) -> Monster | None:
        for monster in self.monsters:
            if monster.monster_id == monster_id:
                return monster
        return None

    def _distance(self, a: Position, b: Position) -> float:
        return dist((a.x, a.y), (b.x, b.y))


def _stable_percent(seed: str) -> float:
    value = 0
    for char in seed:
        value = (value * 131 + ord(char)) & 0xFFFFFFFF
    return (value % 10000) / 100.0
