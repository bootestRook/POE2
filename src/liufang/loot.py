from __future__ import annotations

import random
from dataclasses import dataclass
from pathlib import Path

from .affixes import AffixGenerator
from .config import GemDefinition, load_toml
from .equipment import EquipmentGenerator, EquipmentItem
from .inventory import GemInstance, GemInventory
from .map_progression import LootContext, MapEntry, MapProgressionConfig


class LootGenerationError(ValueError):
    def __init__(self, error_key: str, message: str) -> None:
        super().__init__(message)
        self.error_key = error_key
        self.message = message


@dataclass(frozen=True)
class DropEntry:
    weight: int
    base_gem_id: str | None = None
    tag: str | None = None


@dataclass(frozen=True)
class GeneratedLoot:
    loot_kind: str
    gem_instance: GemInstance | None = None
    equipment_item: EquipmentItem | None = None
    map_entry: MapEntry | None = None


class LootRuntime:
    def __init__(
        self,
        definitions: dict[str, GemDefinition],
        drop_pools: dict[str, list[DropEntry]],
        rarity_weights: dict[str, int],
        affix_generator: AffixGenerator,
        equipment_generator: EquipmentGenerator | None = None,
        map_progression: MapProgressionConfig | None = None,
        player_stats: dict[str, int | float | bool] | None = None,
        rng: random.Random | None = None,
    ) -> None:
        self._definitions = definitions
        self._drop_pools = drop_pools
        self._rarity_weights = rarity_weights
        self._affix_generator = affix_generator
        self._equipment_generator = equipment_generator
        self._map_progression = map_progression
        self._player_stats = dict(player_stats or {})
        self._rng = rng or random.Random()
        self._next_instance_number = 1
        self._next_equipment_number = 1

    @classmethod
    def from_configs(
        cls,
        config_root: Path,
        definitions: dict[str, GemDefinition],
        rarity_weights: dict[str, int],
        affix_generator: AffixGenerator,
        equipment_generator: EquipmentGenerator | None = None,
        map_progression: MapProgressionConfig | None = None,
        player_stats: dict[str, int | float | bool] | None = None,
        rng: random.Random | None = None,
    ) -> "LootRuntime":
        pools_data = load_toml(config_root / "loot" / "gem_drop_pools.toml")
        pools: dict[str, list[DropEntry]] = {}
        for pool_name, pool_data in pools_data.get("drop_pool", {}).items():
            entries: list[DropEntry] = []
            for entry in pool_data.get("entries", []):
                entries.append(
                    DropEntry(
                        weight=int(entry["weight"]),
                        base_gem_id=entry.get("id"),
                        tag=entry.get("tag"),
                    )
                )
            pools[pool_name] = entries
        return cls(
            definitions,
            pools,
            rarity_weights,
            affix_generator,
            equipment_generator=equipment_generator,
            map_progression=map_progression,
            player_stats=player_stats,
            rng=rng,
        )

    def set_player_stats(self, player_stats: dict[str, int | float | bool]) -> None:
        self._player_stats = dict(player_stats)

    def generate_drops(self) -> tuple[GemInstance, ...]:
        quantity_add = self._numeric_player_stat("gem_drop_quantity_add_percent")
        expected_extra = max(0.0, quantity_add) / 100.0
        count = 1 + int(expected_extra)
        fractional = expected_extra - int(expected_extra)
        if fractional > 0 and self._rng.random() < fractional:
            count += 1
        return tuple(self.generate_drop() for _ in range(max(1, count)))

    def generate_drop(self) -> GemInstance:
        return self._generate_gem_drop(level=1, rarity_weights=self._rarity_weights_with_player_bonus())

    def generate_loot_drops(self, context: LootContext | None = None) -> tuple[GeneratedLoot, ...]:
        if context is None or self._map_progression is None:
            return tuple(GeneratedLoot("gem", gem_instance=gem) for gem in self.generate_drops())

        profile = self._map_progression.loot_profile(context.run.loot_profile_id)
        rarity = "boss" if context.is_boss else context.monster_rarity
        multiplier = self._map_progression.rarity_multipliers.get(
            rarity,
            self._map_progression.rarity_multipliers["normal"],
        )
        drops: list[GeneratedLoot] = []
        guaranteed = profile.boss_guaranteed_kinds if context.is_boss else ()
        for kind in guaranteed:
            drops.append(self._generate_context_loot(kind, context))
        quantity_chance = min(1.0, profile.base_drop_chance * max(0.0, multiplier.drop_quantity))
        if self._rng.random() < quantity_chance:
            drops.append(self._generate_context_loot(self._weighted_key(profile.drop_kind_weights()), context))
        extra_quantity = max(0.0, self._numeric_player_stat("item_drop_quantity_add_percent")) / 100.0
        if extra_quantity > 0 and self._rng.random() < min(1.0, extra_quantity):
            drops.append(self._generate_context_loot(self._weighted_key(profile.drop_kind_weights()), context))
        return tuple(drops)

    def pickup_loot(self, loot: GeneratedLoot, inventory: GemInventory) -> object:
        if loot.loot_kind == "gem" and loot.gem_instance is not None:
            return self.pickup(loot.gem_instance, inventory)
        if loot.loot_kind == "equipment" and loot.equipment_item is not None:
            return loot.equipment_item
        if loot.loot_kind == "map_entry" and loot.map_entry is not None:
            return loot.map_entry
        raise LootGenerationError("loot.error.invalid_entry", "invalid dropped loot")

    def _generate_context_loot(self, loot_kind: str, context: LootContext) -> GeneratedLoot:
        profile = self._map_progression.loot_profile(context.run.loot_profile_id) if self._map_progression else None
        if loot_kind == "gem":
            if profile is None:
                return GeneratedLoot("gem", gem_instance=self.generate_drop())
            level = self._rng.randint(profile.gem_level_min, profile.gem_level_max)
            return GeneratedLoot(
                "gem",
                gem_instance=self._generate_gem_drop(level=level, rarity_weights=profile.gem_rarity_weights),
            )
        if loot_kind == "equipment":
            return GeneratedLoot("equipment", equipment_item=self._generate_equipment_drop(context))
        if loot_kind == "map_entry":
            target_stage_id = self._map_progression.next_stage_id(context.run.stage_id) if self._map_progression else None
            return GeneratedLoot("map_entry", map_entry=MapEntry(target_stage_id or context.run.stage_id, 1))
        raise LootGenerationError("loot.error.invalid_entry", f"unknown loot kind: {loot_kind}")

    def _generate_gem_drop(self, *, level: int, rarity_weights: dict[str, int]) -> GemInstance:
        base_gem_id = self._choose_base_gem_id()
        rarity = self._weighted_key(rarity_weights)
        definition = self._definitions[base_gem_id]
        instance = GemInstance(
            instance_id=self._next_instance_id(),
            base_gem_id=base_gem_id,
            gem_type=definition.gem_type,
            gem_kind=definition.gem_kind,
            sudoku_digit=definition.sudoku_digit,
            rarity=rarity,
            level=max(1, min(20, int(level))),
            locked=False,
            tags=definition.tags,
            board_position=None,
        )
        return instance

    def _generate_equipment_drop(self, context: LootContext) -> EquipmentItem:
        if self._equipment_generator is None or self._map_progression is None:
            raise LootGenerationError("loot.error.empty_pool", "equipment generator is not configured")
        profile = self._map_progression.loot_profile(context.run.loot_profile_id)
        source = self._choose_equipment_source()
        rarity = self._weighted_key(self._equipment_rarity_weights_with_player_bonus(profile.equipment_rarity_weights))
        instance_id = f"equip_drop_{self._next_equipment_number:06d}"
        self._next_equipment_number += 1
        return self._equipment_generator.generate(source, context.run.map_level, rarity, instance_id=instance_id)

    def pickup(self, instance: GemInstance, inventory: GemInventory) -> GemInstance:
        return inventory.add_existing_instance(instance)

    def _choose_base_gem_id(self) -> str:
        top_entry = self._weighted_entry(self._require_pool("gem_basic"))
        if top_entry.tag == "active_skill_gem":
            return self._choose_from_pool("active_skill_gems")
        if top_entry.tag == "passive_skill_gem":
            return self._choose_from_pool("passive_skill_gems")
        if top_entry.tag == "support_gem":
            return self._choose_from_pool("support_gems")
        if top_entry.base_gem_id:
            return top_entry.base_gem_id
        raise LootGenerationError("loot.error.invalid_entry", "掉落池配置不合法")

    def _choose_from_pool(self, pool_name: str) -> str:
        entry = self._weighted_entry(self._require_pool(pool_name))
        if entry.base_gem_id is not None:
            if entry.base_gem_id not in self._definitions:
                raise LootGenerationError("loot.error.invalid_entry", "掉落池配置不合法")
            return entry.base_gem_id
        if entry.tag is None:
            raise LootGenerationError("loot.error.invalid_entry", "掉落池配置不合法")
        candidates = [
            definition.base_gem_id
            for definition in self._definitions.values()
            if entry.tag in definition.tags
        ]
        if not candidates:
            raise LootGenerationError("loot.error.empty_pool", "掉落池为空")
        return candidates[self._rng.randrange(len(candidates))]

    def _require_pool(self, pool_name: str) -> list[DropEntry]:
        entries = self._drop_pools.get(pool_name, [])
        if not entries:
            raise LootGenerationError("loot.error.empty_pool", "掉落池为空")
        return entries

    def _weighted_entry(self, entries: list[DropEntry]) -> DropEntry:
        total = sum(entry.weight for entry in entries)
        if total <= 0:
            raise LootGenerationError("loot.error.invalid_entry", "掉落池配置不合法")
        pick = self._rng.uniform(0, total)
        current = 0.0
        for entry in entries:
            current += entry.weight
            if pick <= current:
                return entry
        return entries[-1]

    def _weighted_key(self, weights: dict[str, int]) -> str:
        total = sum(weights.values())
        pick = self._rng.uniform(0, total)
        current = 0.0
        for key, weight in weights.items():
            current += weight
            if pick <= current:
                return key
        return next(reversed(weights))

    def _rarity_weights_with_player_bonus(self) -> dict[str, int]:
        rarity_add = max(0.0, self._numeric_player_stat("gem_drop_rarity_add_percent"))
        if rarity_add <= 0:
            return dict(self._rarity_weights)
        weights = dict(self._rarity_weights)
        weights["magic"] = max(1, round(weights.get("magic", 1) * (1.0 + rarity_add / 100.0)))
        weights["rare"] = max(1, round(weights.get("rare", 1) * (1.0 + rarity_add / 50.0)))
        return weights

    def _equipment_rarity_weights_with_player_bonus(self, base_weights: dict[str, int]) -> dict[str, int]:
        rarity_add = max(0.0, self._numeric_player_stat("item_drop_rarity_add_percent"))
        if rarity_add <= 0:
            return dict(base_weights)
        weights = dict(base_weights)
        weights["blue"] = max(1, round(weights.get("blue", 1) * (1.0 + rarity_add / 100.0)))
        weights["purple"] = max(1, round(weights.get("purple", 1) * (1.0 + rarity_add / 70.0)))
        weights["pink"] = max(1, round(weights.get("pink", 1) * (1.0 + rarity_add / 40.0)))
        return weights

    def _choose_equipment_source(self) -> str:
        if self._equipment_generator is None:
            raise LootGenerationError("loot.error.empty_pool", "equipment generator is not configured")
        sources = sorted({definition.source for definition in self._equipment_generator.definitions if definition.library == "base"})
        if not sources:
            raise LootGenerationError("loot.error.empty_pool", "equipment source pool is empty")
        return sources[self._rng.randrange(len(sources))]

    def _numeric_player_stat(self, stat: str) -> float:
        value = self._player_stats.get(stat, 0.0)
        if isinstance(value, bool):
            return 1.0 if value else 0.0
        if isinstance(value, (int, float)):
            return float(value)
        return 0.0

    def _next_instance_id(self) -> str:
        instance_id = f"gem_inst_{self._next_instance_number:06d}"
        self._next_instance_number += 1
        return instance_id
