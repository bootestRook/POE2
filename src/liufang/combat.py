from __future__ import annotations

from dataclasses import dataclass, field
from math import dist

from .inventory import BoardPosition, GemInstance, GemInventory
from .loot import LootRuntime
from .skill_effects import FinalSkillInstance, SkillEffectCalculator, SkillEffectError
from .skill_runtime import SkillEvent, SkillRuntime


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
class Player:
    player_id: str
    current_life: float
    max_life: float
    position: Position
    item_interaction_reach: float
    move_speed: float = 1.0
    current_mana: float = 0.0
    max_mana: float = 0.0
    life_regen_flat: float = 0.0
    mana_regen_flat: float = 0.0
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
    damage_mitigation_final_percent: float = 0.0
    physical_damage_reduction_percent: float = 0.0
    fire_resistance_percent: float = 0.0
    cold_resistance_percent: float = 0.0
    lightning_resistance_percent: float = 0.0
    chaos_resistance_percent: float = 0.0
    elemental_resistance_percent: float = 0.0
    _energy_shield_recharge_delay_remaining_ms: int = 0

    def sync_runtime_bounds(self) -> None:
        self.max_life = max(1.0, float(self.max_life))
        self.current_life = min(max(0.0, float(self.current_life)), self.max_life)
        self.max_mana = max(0.0, float(self.max_mana))
        self.current_mana = min(max(0.0, float(self.current_mana)), self.max_mana)
        self.max_energy_shield = max(0.0, float(self.max_energy_shield))
        self.current_energy_shield = min(max(0.0, float(self.current_energy_shield)), self.max_energy_shield)

    def regenerate(self, delta_ms: int) -> None:
        seconds = max(0, delta_ms) / 1000.0
        if self.max_life > 0 and self.life_regen_flat > 0:
            self.current_life = min(self.max_life, self.current_life + self.life_regen_flat * seconds)
        if self.max_mana > 0 and self.mana_regen_flat > 0:
            self.current_mana = min(self.max_mana, self.current_mana + self.mana_regen_flat * seconds)
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

    def take_hit(self, damage: float, *, damage_type: str = "physical", hit_kind: str = "attack", avoidable: bool = True) -> float:
        incoming = max(0.0, float(damage))
        if incoming <= 0:
            return 0.0
        if avoidable:
            incoming *= 1.0 - self._evasion_chance()
        incoming *= 1.0 - self._block_chance(hit_kind) * max(0.0, self.block_damage_reduction_percent / 100.0)
        incoming = self._mitigated_damage(incoming, damage_type)
        self._energy_shield_recharge_delay_remaining_ms = max(0, int(self.energy_shield_charge_delay_ms))
        shield_damage = min(self.current_energy_shield, incoming)
        self.current_energy_shield -= shield_damage
        life_damage = incoming - shield_damage
        self.current_life = max(0.0, self.current_life - life_damage)
        return life_damage

    def _mitigated_damage(self, damage: float, damage_type: str) -> float:
        result = damage
        if damage_type == "physical":
            effective_armor = max(0.0, self.armor * (1.0 + self.armor_add_percent / 100.0))
            armor_reduction = effective_armor / (effective_armor + 10.0 * result) if result > 0 else 0.0
            result *= 1.0 - min(0.9, armor_reduction)
            result *= 1.0 - min(0.9, max(0.0, self.physical_damage_reduction_percent) / 100.0)
        result *= 1.0 - min(0.9, max(0.0, self._resistance(damage_type)) / 100.0)
        result *= 1.0 - min(0.9, max(0.0, self.damage_mitigation_final_percent) / 100.0)
        return max(0.0, result)

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

    def _evasion_chance(self) -> float:
        effective_evasion = max(0.0, self.evasion * (1.0 + self.evasion_add_percent / 100.0))
        return min(0.95, effective_evasion / (effective_evasion + 1000.0)) if effective_evasion > 0 else 0.0

    def _block_chance(self, hit_kind: str) -> float:
        chance = self.spell_block_chance_percent if hit_kind == "spell" else self.attack_block_chance_percent
        return min(0.75, max(0.0, chance) / 100.0)


@dataclass
class Monster:
    monster_id: str
    current_life: float
    max_life: float
    position: Position
    is_alive: bool = True

    def take_hit(self, damage: float) -> bool:
        if not self.is_alive:
            return False
        self.current_life = max(0.0, self.current_life - damage)
        if self.current_life <= 0:
            self.is_alive = False
            return True
        return False


@dataclass
class DroppedGem:
    drop_id: str
    gem_instance: GemInstance
    position: Position
    picked_up: bool = False


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
    skill_events: list[SkillEvent] = field(default_factory=list)
    _cooldowns: dict[str, SkillCooldown] = field(default_factory=dict)
    _pending_skill_events: list[PendingSkillEvent] = field(default_factory=list)
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
    ) -> "CombatSession":
        try:
            active_skill_instances = skill_effect_calculator.calculate_all()
        except SkillEffectError as exc:
            raise CombatStartError(exc.error_key, exc.message) from exc
        if not active_skill_instances:
            raise CombatStartError("combat.error.no_active_skill", "没有主动技能宝石不可进入战斗")
        skill_effect_calculator.apply_player_stat_contributions(player)
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
        )
        session._cooldowns = {
            skill.active_gem_instance_id: SkillCooldown(skill=skill, remaining_ms=0)
            for skill in active_skill_instances
        }
        return session

    def tick(self, delta_ms: int) -> tuple[SkillReleaseEvent, ...]:
        self.elapsed_ms += delta_ms
        self.player.regenerate(delta_ms)
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
                if cooldown.skill.uses_skill_event_pipeline:
                    skill_events = self._skill_runtime.execute(
                        cooldown.skill,
                        source_entity=self.player.player_id,
                        source_position=self.player.position,
                        target_entity=monster.monster_id,
                        target_position=monster.position,
                        timestamp_ms=self.elapsed_ms,
                    )
                    self.skill_events.extend(skill_events)
                    self._queue_pending_skill_events(cooldown.skill, skill_events)
                else:
                    killed = monster.take_hit(cooldown.skill.final_damage)
                    event = SkillReleaseEvent(
                        skill_instance=cooldown.skill,
                        monster_id=monster.monster_id,
                        damage=cooldown.skill.final_damage,
                        killed=killed,
                        mana_spent=cooldown.skill.mana_cost,
                    )
                    events.append(event)
                    if killed:
                        self._drop_from_monster(monster)
                cooldown.remaining_ms = max(1, cooldown.skill.actual_interval_ms)
        return tuple(events)

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
        for pending in self._pending_skill_events:
            pending.remaining_ms -= delta_ms
            if pending.remaining_ms > 0:
                remaining.append(pending)
                continue
            if pending.event.type == "damage":
                release_event = self._consume_damage_event(pending.skill, pending.event)
                if release_event is not None:
                    release_events.append(release_event)
        self._pending_skill_events = remaining
        return tuple(release_events)

    def _consume_damage_event(
        self,
        skill: FinalSkillInstance,
        event: SkillEvent,
    ) -> SkillReleaseEvent | None:
        target = self._monster_by_id(event.target_entity)
        if target is None:
            return None
        damage = float(event.amount or 0.0)
        killed = target.take_hit(damage)
        if killed:
            self._drop_from_monster(target)
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

    def pickup_nearby(self) -> tuple[GemInstance, ...]:
        picked: list[GemInstance] = []
        for dropped in self.dropped_gems:
            if dropped.picked_up:
                continue
            if self._distance(self.player.position, dropped.position) > self.player.item_interaction_reach:
                continue
            stored = self.loot_runtime.pickup(dropped.gem_instance, self.inventory)
            dropped.picked_up = True
            picked.append(stored)
        return tuple(picked)

    def _drop_from_monster(self, monster: Monster) -> DroppedGem:
        first_drop: DroppedGem | None = None
        for gem_instance in self.loot_runtime.generate_drops():
            dropped = DroppedGem(
                drop_id=f"drop_{self._next_drop_number:06d}",
                gem_instance=gem_instance,
                position=monster.position,
                picked_up=False,
            )
            self._next_drop_number += 1
            self.dropped_gems.append(dropped)
            if first_drop is None:
                first_drop = dropped
        if first_drop is None:
            raise RuntimeError("loot runtime did not generate any drops")
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
