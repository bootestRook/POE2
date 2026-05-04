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
class BuffState:
    buff_type: str
    remaining_ms: int
    remaining_amount: float
    absorb_percent: float = 0.0
    exclude_damage_over_time: bool = False
    source_skill_id: str = ""


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
    buffs: list[BuffState] = field(default_factory=list)
    _energy_shield_recharge_delay_remaining_ms: int = 0

    def sync_runtime_bounds(self) -> None:
        self.max_life = max(1.0, float(self.max_life))
        self.current_life = min(max(0.0, float(self.current_life)), self.max_life)
        self.max_mana = max(0.0, float(self.max_mana))
        self.current_mana = min(max(0.0, float(self.current_mana)), self.max_mana)
        self.max_energy_shield = max(0.0, float(self.max_energy_shield))
        self.current_energy_shield = min(max(0.0, float(self.current_energy_shield)), self.max_energy_shield)

    def regenerate(self, delta_ms: int) -> None:
        self.tick_buffs(delta_ms)
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

    def take_hit(
        self,
        damage: float,
        *,
        damage_type: str = "physical",
        hit_kind: str = "attack",
        avoidable: bool = True,
        damage_over_time: bool = False,
    ) -> float:
        incoming = max(0.0, float(damage))
        if incoming <= 0:
            return 0.0
        if avoidable:
            incoming *= 1.0 - self._evasion_chance()
        incoming *= 1.0 - self._block_chance(hit_kind) * max(0.0, self.block_damage_reduction_percent / 100.0)
        incoming = self._mitigated_damage(incoming, damage_type)
        incoming = self._absorb_buff_damage(incoming, damage_over_time=damage_over_time)
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
        incoming = BuffState(
            buff_type=buff_type,
            remaining_ms=max(0, int(event.duration_ms or payload.get("duration_ms", 0))),
            remaining_amount=max(0.0, float(event.amount or payload.get("absorb_amount", 0.0))),
            absorb_percent=max(0.0, float(payload.get("absorb_percent", 0.0))),
            exclude_damage_over_time=bool(payload.get("exclude_damage_over_time", False)),
            source_skill_id=str(payload.get("skill_id", "")),
        )
        self.buffs = [
            buff
            for buff in self.buffs
            if not (buff.buff_type == incoming.buff_type and buff.source_skill_id == incoming.source_skill_id)
        ]
        if incoming.remaining_ms > 0 and (incoming.remaining_amount > 0 or incoming.absorb_percent > 0):
            self.buffs.append(incoming)

    def tick_buffs(self, delta_ms: int) -> None:
        elapsed = max(0, int(delta_ms))
        remaining: list[BuffState] = []
        for buff in self.buffs:
            buff.remaining_ms -= elapsed
            if buff.remaining_ms > 0 and buff.remaining_amount > 0:
                remaining.append(buff)
        self.buffs = remaining

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

    def _absorb_buff_damage(self, damage: float, *, damage_over_time: bool) -> float:
        incoming = max(0.0, damage)
        if incoming <= 0 or not self.buffs:
            return incoming
        remaining_buffs: list[BuffState] = []
        for index, buff in enumerate(self.buffs):
            if buff.remaining_ms <= 0 or buff.remaining_amount <= 0:
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
                    if later.remaining_ms > 0 and later.remaining_amount > 0
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

    def _evasion_chance(self) -> float:
        effective_evasion = max(0.0, self.evasion * (1.0 + self.evasion_add_percent / 100.0))
        return min(0.95, effective_evasion / (effective_evasion + 1000.0)) if effective_evasion > 0 else 0.0

    def _block_chance(self, hit_kind: str) -> float:
        chance = self.spell_block_chance_percent if hit_kind == "spell" else self.attack_block_chance_percent
        return min(0.75, max(0.0, chance) / 100.0)


@dataclass
class AilmentState:
    ailment_type: str
    remaining_ms: int
    stacks: int = 1
    buff_type: str = ""
    polarity: str = "negative"
    base_value: float = 0.0
    base_damage_per_second: float = 0.0
    source_damage_type: str = ""
    max_stacks: int = 1
    max_triggers: int = 0
    effect_per_stack: float = 0.0
    threshold: float = 0.0


def _status_buff_type(status_type: str) -> str:
    return {
        "frostbite": "cold_damage_taken_increase",
        "numbed": "lightning_damage_taken_increase",
    }.get(status_type, status_type)


@dataclass
class Monster:
    monster_id: str
    current_life: float
    max_life: float
    position: Position
    is_alive: bool = True
    ailments: list[AilmentState] = field(default_factory=list)
    is_frozen: bool = False

    def take_hit(self, damage: float) -> bool:
        if not self.is_alive:
            return False
        self.current_life = max(0.0, self.current_life - damage)
        if self.current_life <= 0:
            self.is_alive = False
            return True
        return False

    def take_hit_components(self, components: dict[str, float]) -> bool:
        adjusted: dict[str, float] = {}
        for damage_type, amount in components.items():
            scaled = max(0.0, float(amount))
            if damage_type == "cold":
                scaled *= 1.0 + self._negative_buff_effect_percent("cold_damage_taken_increase") / 100.0
            elif damage_type == "lightning":
                scaled *= 1.0 + self._negative_buff_effect_percent("lightning_damage_taken_increase") / 100.0
            adjusted[str(damage_type)] = scaled
        shock_damage = self._consume_shock_damage()
        if shock_damage > 0:
            adjusted["lightning"] = adjusted.get("lightning", 0.0) + shock_damage
        return self.take_hit(sum(adjusted.values()))

    def apply_ailment(self, payload: dict[str, object]) -> None:
        ailment_type = str(payload.get("status_type", ""))
        if not ailment_type:
            return
        duration_ms = max(0, int(payload.get("duration_ms", 0)))
        max_stacks = max(1, int(payload.get("max_stacks", 1)))
        incoming = AilmentState(
            ailment_type=ailment_type,
            remaining_ms=duration_ms,
            stacks=1,
            buff_type=_status_buff_type(ailment_type),
            polarity="negative",
            base_value=max(0.0, float(payload.get("base_value", 0.0))),
            base_damage_per_second=max(0.0, float(payload.get("base_damage_per_second", 0.0))),
            source_damage_type=str(payload.get("source_damage_type", "")),
            max_stacks=max_stacks,
            max_triggers=max(0, int(payload.get("max_triggers", 0))),
            effect_per_stack=max(0.0, float(payload.get("effect_per_stack", 0.0))),
            threshold=max(0.0, float(payload.get("threshold", 0.0))),
        )
        existing = next((state for state in self.ailments if state.ailment_type == ailment_type), None)
        if existing is None or ailment_type in {"ignite", "shock", "trauma"}:
            self.ailments.append(incoming)
        else:
            existing.stacks = min(existing.max_stacks, existing.stacks + 1)
            existing.remaining_ms = max(existing.remaining_ms, incoming.remaining_ms)
            existing.base_value += incoming.base_value
            existing.base_damage_per_second = max(existing.base_damage_per_second, incoming.base_damage_per_second)
        frostbite_value = sum(state.base_value for state in self.ailments if state.ailment_type == "frostbite")
        if frostbite_value > 100:
            self.is_frozen = True

    def tick_ailments(self, delta_ms: int) -> float:
        if not self.is_alive:
            return 0.0
        seconds = max(0, delta_ms) / 1000.0
        damage = 0.0
        remaining: list[AilmentState] = []
        for ailment in self.ailments:
            if ailment.ailment_type in {"ignite", "trauma", "wilt"} and ailment.base_damage_per_second > 0:
                damage += ailment.base_damage_per_second * max(1, ailment.stacks) * seconds
            ailment.remaining_ms -= max(0, delta_ms)
            if ailment.remaining_ms > 0:
                remaining.append(ailment)
        self.ailments = remaining
        self.is_frozen = sum(state.base_value for state in self.ailments if state.ailment_type == "frostbite") > 100
        if damage > 0:
            self.take_hit(damage)
        return damage

    def _ailment_effect_percent(self, ailment_type: str) -> float:
        return sum(
            state.effect_per_stack * max(1, state.stacks)
            for state in self.ailments
            if state.ailment_type == ailment_type
        )

    def _negative_buff_effect_percent(self, buff_type: str) -> float:
        return sum(
            state.effect_per_stack * max(1, state.stacks)
            for state in self.ailments
            if state.polarity == "negative" and state.buff_type == buff_type
        )

    def _consume_shock_damage(self) -> float:
        damage = 0.0
        remaining: list[AilmentState] = []
        for state in self.ailments:
            if state.ailment_type != "shock":
                remaining.append(state)
                continue
            if state.max_triggers <= 0:
                remaining.append(state)
                continue
            damage += max(0.0, state.base_value) * max(1, state.stacks)
            state.max_triggers -= 1
            if state.max_triggers > 0:
                remaining.append(state)
        self.ailments = remaining
        return damage


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
    _on_kill_recast_counts: dict[str, int] = field(default_factory=dict)
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
        for monster in self.monsters:
            monster.tick_ailments(delta_ms)
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
                        target_entities=[
                            {"entity_id": alive.monster_id, "position": alive.position}
                            for alive in self.monsters
                            if alive.is_alive
                        ],
                    )
                    self.skill_events.extend(skill_events)
                    self._consume_immediate_skill_events(skill_events)
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
        self._pending_skill_events = remaining + self._pending_skill_events
        return tuple(release_events)

    def _consume_immediate_skill_events(self, skill_events: tuple[SkillEvent, ...]) -> None:
        for event in skill_events:
            if event.delay_ms > 0:
                continue
            if event.type == "buff_apply":
                self._consume_buff_event(event)

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
        killed = (
            target.take_hit_components(components)
            if isinstance(components, dict) and components
            else target.take_hit(damage)
        )
        if killed:
            self._trigger_on_kill_explosion(skill, event, target)
            self._trigger_on_kill_recast(skill, event, target)
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

    def _consume_status_event(self, event: SkillEvent) -> None:
        target = self._monster_by_id(event.target_entity)
        if target is None:
            return
        target.apply_ailment(event.payload)

    def _consume_buff_event(self, event: SkillEvent) -> None:
        if event.target_entity != self.player.player_id:
            return
        self.player.apply_buff_event(event)

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
            for event_type, amount, duration, reason, position in (
                ("damage", damage_amount, 0, reason_key, target_position),
                ("hit_vfx", None, 420, reason_key, target_position),
                ("floating_text", damage_amount, 800, floating_key, {"x": monster.position.x, "y": monster.position.y - 28.0}),
            ):
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


def _stable_percent(seed: str) -> float:
    value = 0
    for char in seed:
        value = (value * 131 + ord(char)) & 0xFFFFFFFF
    return (value % 10000) / 100.0
