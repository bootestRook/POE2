from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .config import load_toml


DROP_KINDS = frozenset({"equipment", "gem", "map_entry"})


@dataclass(frozen=True)
class MonsterCurve:
    life_base: float
    life_per_level: float
    life_level_exponent: float
    damage_base: float
    damage_per_level: float
    damage_level_exponent: float

    def monster_life(self, monster_level: int, *, rarity_life: float = 1.0) -> float:
        level = max(1, int(monster_level))
        return round((self.life_base + self.life_per_level * (level ** self.life_level_exponent)) * rarity_life, 2)

    def monster_damage(self, monster_level: int, *, rarity_damage: float = 1.0) -> float:
        level = max(1, int(monster_level))
        return round((self.damage_base + self.damage_per_level * (level ** self.damage_level_exponent)) * rarity_damage, 2)


@dataclass(frozen=True)
class RarityMultiplier:
    rarity: str
    life: float
    damage: float
    drop_quantity: float
    drop_rarity: float


@dataclass(frozen=True)
class LootProfile:
    profile_id: str
    base_drop_chance: float
    equipment_weight: int
    gem_weight: int
    map_entry_weight: int
    equipment_rarity_weights: dict[str, int]
    gem_rarity_weights: dict[str, int]
    gem_level_min: int
    gem_level_max: int
    boss_guaranteed_kinds: tuple[str, ...]

    def drop_kind_weights(self) -> dict[str, int]:
        return {
            "equipment": self.equipment_weight,
            "gem": self.gem_weight,
            "map_entry": self.map_entry_weight,
        }


@dataclass(frozen=True)
class MapStage:
    stage_id: str
    display_name: str
    phase: str
    order: int
    map_level_min: int
    map_level_max: int
    monster_level: int
    loot_profile_id: str
    entry_cost: int
    free_entry: bool
    unlock_after_stage_id: str
    map_template_ids: tuple[str, ...]
    boss_stage: bool

    @property
    def map_level(self) -> int:
        return self.map_level_max


@dataclass(frozen=True)
class MapEntryRule:
    source_stage_id: str
    target_stage_id: str
    weight: int


@dataclass(frozen=True)
class MapEntry:
    stage_id: str
    quantity: int = 1


@dataclass(frozen=True)
class MapRunContext:
    run_id: str
    stage_id: str
    display_name: str
    map_level: int
    monster_level: int
    loot_profile_id: str
    map_template_id: str
    boss_stage: bool = False


@dataclass(frozen=True)
class LootContext:
    run: MapRunContext
    monster_id: str
    monster_rarity: str = "normal"
    is_boss: bool = False


@dataclass
class MapProgressionState:
    unlocked_stage_ids: set[str] = field(default_factory=set)
    map_entries: dict[str, int] = field(default_factory=dict)
    selected_stage_id: str = ""


@dataclass(frozen=True)
class MapProgressionConfig:
    schema_version: int
    default_stage_id: str
    stages: dict[str, MapStage]
    ordered_stage_ids: tuple[str, ...]
    loot_profiles: dict[str, LootProfile]
    entry_rules: tuple[MapEntryRule, ...]
    monster_curve: MonsterCurve
    rarity_multipliers: dict[str, RarityMultiplier]

    def stage(self, stage_id: str) -> MapStage:
        try:
            return self.stages[stage_id]
        except KeyError as exc:
            raise ValueError(f"unknown map stage: {stage_id}") from exc

    def loot_profile(self, profile_id: str) -> LootProfile:
        try:
            return self.loot_profiles[profile_id]
        except KeyError as exc:
            raise ValueError(f"unknown loot profile: {profile_id}") from exc

    def next_stage_id(self, stage_id: str) -> str | None:
        for rule in self.entry_rules:
            if rule.source_stage_id == stage_id:
                return rule.target_stage_id
        return None


def load_map_progression(config_root: Path) -> MapProgressionConfig:
    data = load_toml(config_root / "maps" / "map_progression.toml")
    stages = _load_stages(data.get("stages", []))
    loot_profiles = _load_loot_profiles(data.get("loot_profile", {}))
    entry_rules = _load_entry_rules(data.get("entry_rules", []))
    monster_curve = _load_monster_curve(data.get("monster_curve", {}))
    rarity_multipliers = _load_rarity_multipliers(data.get("rarity_multiplier", {}))
    default_stage_id = str(data.get("default_stage_id", ""))
    ordered_stage_ids = tuple(stage.stage_id for stage in sorted(stages.values(), key=lambda stage: stage.order))
    config = MapProgressionConfig(
        schema_version=int(data.get("schema_version", 1)),
        default_stage_id=default_stage_id,
        stages=stages,
        ordered_stage_ids=ordered_stage_ids,
        loot_profiles=loot_profiles,
        entry_rules=entry_rules,
        monster_curve=monster_curve,
        rarity_multipliers=rarity_multipliers,
    )
    validate_map_progression_config(config)
    return config


def initial_progression_state(config: MapProgressionConfig) -> MapProgressionState:
    return MapProgressionState(
        unlocked_stage_ids={config.default_stage_id},
        map_entries={},
        selected_stage_id=config.default_stage_id,
    )


def stage_is_enterable(config: MapProgressionConfig, state: MapProgressionState, stage_id: str) -> bool:
    stage = config.stage(stage_id)
    if stage.free_entry:
        return True
    return stage_id in state.unlocked_stage_ids and state.map_entries.get(stage_id, 0) >= stage.entry_cost


def consume_stage_entry(config: MapProgressionConfig, state: MapProgressionState, stage_id: str) -> None:
    stage = config.stage(stage_id)
    if stage.free_entry:
        state.unlocked_stage_ids.add(stage_id)
        state.selected_stage_id = stage_id
        return
    if not stage_is_enterable(config, state, stage_id):
        raise ValueError(f"map stage is locked or lacks entry: {stage_id}")
    state.map_entries[stage_id] = max(0, state.map_entries.get(stage_id, 0) - stage.entry_cost)
    state.selected_stage_id = stage_id


def add_map_entry(config: MapProgressionConfig, state: MapProgressionState, stage_id: str, quantity: int = 1) -> None:
    config.stage(stage_id)
    amount = max(1, int(quantity))
    state.map_entries[stage_id] = state.map_entries.get(stage_id, 0) + amount
    state.unlocked_stage_ids.add(stage_id)


def unlock_after_clear(config: MapProgressionConfig, state: MapProgressionState, cleared_stage_id: str) -> str | None:
    next_stage_id = config.next_stage_id(cleared_stage_id)
    if next_stage_id is None:
        return None
    state.unlocked_stage_ids.add(next_stage_id)
    return next_stage_id


def create_map_run_context(
    config: MapProgressionConfig,
    stage_id: str,
    *,
    run_number: int = 1,
    template_index: int = 0,
) -> MapRunContext:
    stage = config.stage(stage_id)
    if not stage.map_template_ids:
        raise ValueError(f"map stage has no map template: {stage_id}")
    template = stage.map_template_ids[template_index % len(stage.map_template_ids)]
    return MapRunContext(
        run_id=f"run_{stage.stage_id}_{max(1, int(run_number)):06d}",
        stage_id=stage.stage_id,
        display_name=stage.display_name,
        map_level=stage.map_level,
        monster_level=stage.monster_level,
        loot_profile_id=stage.loot_profile_id,
        map_template_id=template,
        boss_stage=stage.boss_stage,
    )


def map_stage_view(config: MapProgressionConfig, state: MapProgressionState, stage: MapStage) -> dict[str, Any]:
    profile = config.loot_profile(stage.loot_profile_id)
    return {
        "id": stage.stage_id,
        "display_name": stage.display_name,
        "phase": stage.phase,
        "order": stage.order,
        "map_level_min": stage.map_level_min,
        "map_level_max": stage.map_level_max,
        "map_level_text": f"{stage.map_level_min}-{stage.map_level_max}" if stage.map_level_min != stage.map_level_max else str(stage.map_level_max),
        "monster_level": stage.monster_level,
        "entry_cost": stage.entry_cost,
        "free_entry": stage.free_entry,
        "entry_count": state.map_entries.get(stage.stage_id, 0),
        "unlocked": stage.stage_id in state.unlocked_stage_ids or stage.free_entry,
        "enterable": stage_is_enterable(config, state, stage.stage_id),
        "selected": state.selected_stage_id == stage.stage_id,
        "boss_stage": stage.boss_stage,
        "gem_level_min": profile.gem_level_min,
        "gem_level_max": profile.gem_level_max,
        "base_drop_chance": profile.base_drop_chance,
        "equipment_weight": profile.equipment_weight,
        "gem_weight": profile.gem_weight,
        "map_entry_weight": profile.map_entry_weight,
        "equipment_rarity_weights": dict(profile.equipment_rarity_weights),
        "gem_rarity_weights": dict(profile.gem_rarity_weights),
    }


def map_progression_view(config: MapProgressionConfig, state: MapProgressionState) -> dict[str, Any]:
    return {
        "selected_stage_id": state.selected_stage_id,
        "stages": [
            map_stage_view(config, state, config.stages[stage_id])
            for stage_id in config.ordered_stage_ids
        ],
    }


def _load_stages(raw_stages: object) -> dict[str, MapStage]:
    if not isinstance(raw_stages, list) or not raw_stages:
        raise ValueError("maps/map_progression.toml must contain [[stages]]")
    stages: dict[str, MapStage] = {}
    for raw in raw_stages:
        if not isinstance(raw, dict):
            raise ValueError("map stage must be a table")
        stage = MapStage(
            stage_id=str(raw["id"]),
            display_name=str(raw["display_name"]),
            phase=str(raw["phase"]),
            order=int(raw["order"]),
            map_level_min=int(raw["map_level_min"]),
            map_level_max=int(raw["map_level_max"]),
            monster_level=int(raw["monster_level"]),
            loot_profile_id=str(raw["loot_profile_id"]),
            entry_cost=int(raw["entry_cost"]),
            free_entry=bool(raw["free_entry"]),
            unlock_after_stage_id=str(raw.get("unlock_after_stage_id", "")),
            map_template_ids=tuple(str(value) for value in raw.get("map_template_ids", [])),
            boss_stage=bool(raw.get("boss_stage", False)),
        )
        if stage.stage_id in stages:
            raise ValueError(f"duplicate map stage id: {stage.stage_id}")
        stages[stage.stage_id] = stage
    return stages


def _load_loot_profiles(raw_profiles: object) -> dict[str, LootProfile]:
    if not isinstance(raw_profiles, dict) or not raw_profiles:
        raise ValueError("maps/map_progression.toml must contain [loot_profile.*]")
    profiles: dict[str, LootProfile] = {}
    for profile_id, raw in raw_profiles.items():
        if not isinstance(raw, dict):
            raise ValueError(f"loot profile must be a table: {profile_id}")
        profile = LootProfile(
            profile_id=str(profile_id),
            base_drop_chance=float(raw["base_drop_chance"]),
            equipment_weight=int(raw["equipment_weight"]),
            gem_weight=int(raw["gem_weight"]),
            map_entry_weight=int(raw["map_entry_weight"]),
            equipment_rarity_weights=_int_weight_map(raw.get("equipment_rarity_weights", {}), f"{profile_id}.equipment_rarity_weights"),
            gem_rarity_weights=_int_weight_map(raw.get("gem_rarity_weights", {}), f"{profile_id}.gem_rarity_weights"),
            gem_level_min=int(raw["gem_level_min"]),
            gem_level_max=int(raw["gem_level_max"]),
            boss_guaranteed_kinds=tuple(str(kind) for kind in raw.get("boss_guaranteed_kinds", [])),
        )
        profiles[profile.profile_id] = profile
    return profiles


def _load_entry_rules(raw_rules: object) -> tuple[MapEntryRule, ...]:
    if not isinstance(raw_rules, list):
        raise ValueError("entry_rules must be an array")
    return tuple(
        MapEntryRule(
            source_stage_id=str(raw["source_stage_id"]),
            target_stage_id=str(raw["target_stage_id"]),
            weight=int(raw.get("weight", 1)),
        )
        for raw in raw_rules
        if isinstance(raw, dict)
    )


def _load_monster_curve(raw: object) -> MonsterCurve:
    if not isinstance(raw, dict):
        raise ValueError("monster_curve must be a table")
    return MonsterCurve(
        life_base=float(raw["life_base"]),
        life_per_level=float(raw["life_per_level"]),
        life_level_exponent=float(raw["life_level_exponent"]),
        damage_base=float(raw["damage_base"]),
        damage_per_level=float(raw["damage_per_level"]),
        damage_level_exponent=float(raw["damage_level_exponent"]),
    )


def _load_rarity_multipliers(raw: object) -> dict[str, RarityMultiplier]:
    if not isinstance(raw, dict):
        raise ValueError("rarity_multiplier must be a table")
    result: dict[str, RarityMultiplier] = {}
    for rarity, values in raw.items():
        if not isinstance(values, dict):
            raise ValueError(f"rarity multiplier must be a table: {rarity}")
        result[str(rarity)] = RarityMultiplier(
            rarity=str(rarity),
            life=float(values["life"]),
            damage=float(values["damage"]),
            drop_quantity=float(values["drop_quantity"]),
            drop_rarity=float(values["drop_rarity"]),
        )
    return result


def validate_map_progression_config(config: MapProgressionConfig) -> None:
    if config.default_stage_id not in config.stages:
        raise ValueError(f"default map stage is missing: {config.default_stage_id}")
    default_stage = config.stages[config.default_stage_id]
    if not default_stage.free_entry or default_stage.entry_cost != 0:
        raise ValueError("default map stage must be free and cost 0")
    if config.ordered_stage_ids != tuple(sorted(config.ordered_stage_ids, key=lambda stage_id: config.stages[stage_id].order)):
        raise ValueError("map stage order is invalid")
    previous_max = 0
    for stage_id in config.ordered_stage_ids:
        stage = config.stages[stage_id]
        if stage.map_level_min < 1 or stage.map_level_max > 100 or stage.map_level_min > stage.map_level_max:
            raise ValueError(f"map stage level range is invalid: {stage_id}")
        if stage.map_level_min != previous_max + 1:
            raise ValueError(f"map stage level ranges must cover 1-100 without gaps: {stage_id}")
        previous_max = stage.map_level_max
        if not stage.map_template_ids:
            raise ValueError(f"map stage needs a template: {stage_id}")
        if stage.loot_profile_id not in config.loot_profiles:
            raise ValueError(f"map stage references missing loot profile: {stage_id}")
        if stage.unlock_after_stage_id and stage.unlock_after_stage_id not in config.stages:
            raise ValueError(f"map stage references missing unlock source: {stage_id}")
    if previous_max != 100:
        raise ValueError("map stages must end at level 100")
    for profile in config.loot_profiles.values():
        if not 0 <= profile.base_drop_chance <= 1:
            raise ValueError(f"loot profile drop chance is invalid: {profile.profile_id}")
        if sum(profile.drop_kind_weights().values()) <= 0:
            raise ValueError(f"loot profile drop weights are empty: {profile.profile_id}")
        if profile.gem_level_min < 1 or profile.gem_level_max > 20 or profile.gem_level_min > profile.gem_level_max:
            raise ValueError(f"loot profile gem level range is invalid: {profile.profile_id}")
        invalid_kinds = set(profile.boss_guaranteed_kinds) - DROP_KINDS
        if invalid_kinds:
            raise ValueError(f"loot profile has invalid guaranteed kind: {profile.profile_id}")
    for rule in config.entry_rules:
        if rule.source_stage_id not in config.stages or rule.target_stage_id not in config.stages:
            raise ValueError("map entry rule references missing stage")
        if rule.weight <= 0:
            raise ValueError("map entry rule weight must be positive")
    for required_rarity in ("normal", "magic", "rare", "boss"):
        if required_rarity not in config.rarity_multipliers:
            raise ValueError(f"missing rarity multiplier: {required_rarity}")


def _int_weight_map(raw: object, label: str) -> dict[str, int]:
    if not isinstance(raw, dict) or not raw:
        raise ValueError(f"weight map is empty: {label}")
    result = {str(key): int(value) for key, value in raw.items()}
    if sum(result.values()) <= 0:
        raise ValueError(f"weight map has no positive weight: {label}")
    return result
