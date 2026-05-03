from __future__ import annotations

import re
import sys
import tomllib
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
CONFIGS = ROOT / "configs"
sys.path.insert(0, str(ROOT / "src"))

from liufang.config import GemDefinition, load_gem_definitions, load_skill_packages

EXPECTED_FILES = [
    "core/id_rules.toml",
    "core/random_rules.toml",
    "player/player_base_stats.toml",
    "player/player_stat_defs.toml",
    "player/character_panel.toml",
    "combat/damage_types.toml",
    "combat/hit_rules.toml",
    "combat/status_effects.toml",
    "gems/gem_type_defs.toml",
    "gems/gem_tag_defs.toml",
    "gems/gem_instance_schema.toml",
    "sudoku_board/board_layout.toml",
    "sudoku_board/placement_rules.toml",
    "sudoku_board/relation_rules.toml",
    "sudoku_board/effect_routing_rules.toml",
    "skills/skill_scaling_rules.toml",
    "affixes/affix_defs.toml",
    "affixes/affix_spawn_rules.toml",
    "affixes/affix_groups.toml",
    "affixes/affix_tiers.toml",
    "loot/gem_drop_pools.toml",
    "loot/drop_weight_rules.toml",
    "monsters/monster_defs.toml",
    "monsters/monster_groups.toml",
    "localization/zh_cn.toml",
]
EXPECTED_SKILL_PACKAGE_FILES = [
    "skills/schema/skill.schema.json",
    "skills/active/active_fire_bolt/skill.yaml",
    "skills/active/active_ice_shards/skill.yaml",
    "skills/active/active_lightning_chain/skill.yaml",
    "skills/active/active_penetrating_shot/skill.yaml",
    "skills/active/active_frost_nova/skill.yaml",
    "skills/active/active_puncture/skill.yaml",
    "skills/active/active_fungal_petards/skill.yaml",
    "skills/active/active_lava_orb/skill.yaml",
    "skills/passive/passive_fire_focus/skill.yaml",
    "skills/passive/passive_vitality/skill.yaml",
    "skills/passive/passive_swift_gathering/skill.yaml",
    "skills/behavior_templates/projectile.yaml",
    "skills/behavior_templates/chain.yaml",
    "skills/behavior_templates/player_nova.yaml",
    "skills/behavior_templates/melee_arc.yaml",
    "skills/behavior_templates/damage_zone.yaml",
    "skills/behavior_templates/orbit_emitter.yaml",
]

REQUIRED_STATS = {
    "strength",
    "dexterity",
    "intelligence",
    "max_life",
    "current_life",
    "life_regen_flat",
    "max_mana",
    "current_mana",
    "mana_regen_flat",
    "max_energy_shield",
    "current_energy_shield",
    "energy_shield_charge_speed_percent",
    "energy_shield_charge_delay_ms",
    "move_speed",
    "physical_damage_add_percent",
    "fire_damage_add_percent",
    "cold_damage_add_percent",
    "lightning_damage_add_percent",
    "chaos_damage_add_percent",
    "elemental_damage_add_percent",
    "non_physical_damage_add_percent",
    "all_damage_type_add_percent",
    "hit_damage_add_percent",
    "dot_damage_add_percent",
    "secondary_damage_add_percent",
    "ailment_damage_add_percent",
    "minion_damage_add_percent",
    "attack_damage_add_percent",
    "spell_damage_add_percent",
    "melee_damage_add_percent",
    "ranged_damage_add_percent",
    "projectile_damage_add_percent",
    "area_damage_add_percent",
    "chain_damage_add_percent",
    "pierce_damage_add_percent",
    "orbit_damage_add_percent",
    "trap_mine_damage_add_percent",
    "aura_effect_add_percent",
    "buff_effect_add_percent",
    "damage_add_percent",
    "damage_final_percent",
    "damage_taken_final_percent",
    "hit_damage_final_percent",
    "dot_damage_final_percent",
    "skill_damage_effectiveness_percent",
    "double_damage_chance_percent",
    "resistance_penetration_percent",
    "conversion_physical_to_fire_percent",
    "conversion_physical_to_cold_percent",
    "conversion_physical_to_lightning_percent",
    "attack_speed_add_percent",
    "cast_speed_add_percent",
    "skill_speed_final_percent",
    "cooldown_recovery_add_percent",
    "added_cooldown_ms",
    "cooldown_recovery_final_percent",
    "projectile_speed_add_percent",
    "base_crit_chance_percent",
    "crit_chance_add_percent",
    "crit_rating",
    "crit_damage_rating",
    "crit_damage_add_percent",
    "crit_damage_final_percent",
    "derived_crit_chance_percent",
    "derived_crit_damage_percent",
    "cannot_crit",
    "area_add_percent",
    "area_final_percent",
    "projectile_count_add",
    "chain_count_add",
    "pierce_count_add",
    "duration_add_percent",
    "skill_effect_frequency_add_percent",
    "explosion_radius_add_percent",
    "status_chance_add_percent",
    "ignite_chance_add_percent",
    "frostbite_chance_add_percent",
    "shock_chance_add_percent",
    "trauma_chance_add_percent",
    "armor",
    "armor_add_percent",
    "evasion",
    "evasion_add_percent",
    "attack_block_chance_percent",
    "spell_block_chance_percent",
    "block_damage_reduction_percent",
    "damage_mitigation_final_percent",
    "physical_damage_reduction_percent",
    "fire_resistance_percent",
    "cold_resistance_percent",
    "lightning_resistance_percent",
    "chaos_resistance_percent",
    "elemental_resistance_percent",
    "gem_drop_quantity_add_percent",
    "gem_drop_rarity_add_percent",
    "source_power_row",
    "source_power_column",
    "source_power_box",
    "source_power_adjacent",
    "target_power_row",
    "target_power_column",
    "target_power_box",
    "target_power_adjacent",
    "conduit_power_row",
    "conduit_power_column",
    "conduit_power_box",
    "relation_effect_final_percent",
    "adjacent_bonus_final_percent",
}

OBSOLETE_PLAYER_STATS = {
    "pickup_radius",
    "active_skill_slots",
    "passive_skill_slots",
    "skill_slots_active",
}
ALLOWED_PLAYER_STAT_STATUSES = {"V1_ACTIVE", "V1_DISPLAY_ONLY", "V1_RESERVED", "V2_PLUS"}
ALLOWED_PLAYER_STAT_VALUE_TYPES = {"number", "integer", "percent", "boolean"}
MONSTER_TIER_NUMERIC_RULES = {
    "normal": {"min": 100000, "max": 199999, "group": 1001},
    "magic": {"min": 200000, "max": 299999, "group": 2001},
    "rare": {"min": 300000, "max": 399999, "group": 3001},
    "boss": {"min": 400000, "max": 499999, "group": 4001},
}
MONSTER_VISUAL_RULES = {
    "normal": {"role": "monster", "visual_rarity": "normal", "size": 38, "arc_color": "", "arc_segments": 0, "arc_width": 0, "pedestal_shape": "shadow", "pedestal_color": "#D9DDE1", "pedestal_alpha": 0.16, "pedestal_radius_scale": 0.72, "pedestal_line_width": 1.0, "pedestal_pulse": False},
    "magic": {"role": "monster", "visual_rarity": "magic", "size": 46, "arc_color": "", "arc_segments": 0, "arc_width": 0, "pedestal_shape": "diamond", "pedestal_color": "#4AA3FF", "pedestal_alpha": 0.82, "pedestal_radius_scale": 0.82, "pedestal_line_width": 2.0, "pedestal_pulse": False},
    "rare": {"role": "monster", "visual_rarity": "rare", "size": 58, "arc_color": "", "arc_segments": 0, "arc_width": 0, "pedestal_shape": "hexagon", "pedestal_color": "#F5C542", "pedestal_alpha": 0.88, "pedestal_radius_scale": 0.95, "pedestal_line_width": 2.5, "pedestal_pulse": False},
    "boss": {"role": "boss", "visual_rarity": "legendary", "size": 82, "arc_color": "", "arc_segments": 0, "arc_width": 0, "pedestal_shape": "hexagon", "pedestal_color": "#FF4D3D", "pedestal_alpha": 0.92, "pedestal_radius_scale": 1.15, "pedestal_line_width": 3.0, "pedestal_pulse": True},
}
MONSTER_STANDARD_PRIMARY_COLOR = "#F7F7F2"
MONSTER_STANDARD_ACCENT_COLOR = "#D9DDE1"
MONSTER_STANDARD_PALETTE_KEY = "encounter_standard"
PLAYER_GEOMETRY_RADIUS_PX = 18
ALLOWED_MONSTER_GEOMETRY_SHAPES = {
    "circle_ring",
    "triangle",
    "square_dot",
    "diamond_tail",
    "double_triangle",
    "hex_eye",
    "cluster",
    "needle_ghost",
    "circle_square",
    "tri_in_tri",
    "crystal_cross",
    "hex_core",
    "broken_ring_bolt",
    "square_invtri",
    "wind_wheel",
    "double_diamond",
    "tri_crown",
    "ring_square_corners",
    "star_diamonds",
    "hex_tri_layers",
    "square_spikes",
    "double_ring_eye",
    "obelisk",
    "twin_shadow",
    "boss_king",
    "boss_void",
    "boss_pinwheel",
    "boss_star_mother",
    "boss_judicator",
    "boss_eclipse",
    "boss_mirror",
    "boss_triad",
}
ALLOWED_MONSTER_MOVEMENT_KINDS = {
    "normal",
    "normal_slow",
    "normal_pause",
    "normal_desynced",
    "drift",
    "step_dash",
    "side_step",
    "blink_short",
    "blink_long",
    "lunge",
    "anchor_cast",
    "orbit",
    "phase_swap",
    "phase_step",
}
ALLOWED_MONSTER_FALLBACK_VISUALS = {"enemy_imp", "enemy_brute"}
HEX_COLOR_PATTERN = re.compile(r"^#[0-9A-Fa-f]{6}$")

REQUIRED_TAGS = {
    "gem",
    "active_skill_gem",
    "passive_skill_gem",
    "support_gem",
    "loot_gem",
    "gem_type_1",
    "gem_type_2",
    "gem_type_3",
    "gem_type_4",
    "gem_type_5",
    "gem_type_6",
    "gem_type_7",
    "gem_type_8",
    "gem_type_9",
    "attack",
    "spell",
    "melee",
    "ranged",
    "bow",
    "summon",
    "physical",
    "fire",
    "cold",
    "lightning",
    "projectile",
    "area",
    "chain",
    "pierce",
    "orbit",
    "nova",
    "dot",
    "aura",
    "trap_or_mine",
    "skill_fire_bolt",
    "skill_ice_shards",
    "skill_lightning_chain",
    "skill_frost_nova",
    "skill_puncture",
    "skill_penetrating_shot",
    "skill_lava_orb",
    "skill_fungal_petards",
    "support_damage",
    "support_speed",
    "support_cooldown",
    "support_area",
    "support_projectile",
    "support_crit",
    "support_status",
    "support_level",
    "support_relation",
    "support_conduit",
    "support_shape",
}

REQUIRED_DAMAGE_TYPES = {"physical", "fire", "cold", "lightning", "chaos"}
REQUIRED_STATUS_EFFECTS = {"burning", "chill", "bleed"}
REQUIRED_BOARD_RELATIONS = {"adjacent", "same_row", "same_column", "same_box"}
REQUIRED_BOARD_LOCALIZATION_KEYS = {
    "board.enter_combat.empty_board",
    "board.enter_combat.no_active_skill",
    "board.invalid_sudoku_digit",
    "board.duplicate_sudoku_digit.row",
    "board.duplicate_sudoku_digit.column",
    "board.duplicate_sudoku_digit.box",
}
REQUIRED_RARITY_COUNTS = {"normal": 0, "magic": 1, "rare": 2}
REQUIRED_AFFIX_GENERATIONS = {"prefix", "suffix", "implicit"}
REQUIRED_AFFIX_CATEGORIES = {
    "skill_numeric",
    "tag_enhancement",
    "board_source",
    "board_target",
    "risk_reward_cost",
}
REQUIRED_BOARD_AFFIX_STATS = {
    "source_power_row",
    "source_power_column",
    "source_power_box",
    "target_power_row",
    "target_power_column",
    "target_power_box",
}
REQUIRED_AFFIX_GROUPS = {
    "damage_scaling",
    "speed_scaling",
    "projectile_scaling",
    "relation_source",
    "relation_target",
    "risk_reward",
}
REQUIRED_LOOT_POOLS = {"gem_basic", "active_skill_gems", "passive_skill_gems", "support_gems"}
REQUIRED_GEM_KINDS = {"active_skill", "passive_skill", "support"}
REQUIRED_PHASE4_LOCALIZATION_KEYS = {
    "rarity.normal.name",
    "rarity.magic.name",
    "rarity.rare.name",
    "affix.error.candidate_shortage",
    "loot.error.empty_pool",
    "loot.error.invalid_entry",
}
REQUIRED_PHASE5_LOCALIZATION_KEYS = {
    "skill_effect.error.invalid_board",
    "skill_effect.error.cannot_enter_combat",
    "skill_effect.error.missing_template",
    "modifier.support_base",
    "modifier.passive_base",
    "modifier.support_to_passive",
    "modifier.self_stat_passive",
    "modifier.conduit_amplifier",
    "modifier.ignored.unknown_affix",
    "modifier.ignored.apply_filter",
    "modifier.ignored.board_power_trace",
    "modifier.ignored.unsupported_stat",
    "modifier.ignored.duplicate_source_target_stat",
}
REQUIRED_PHASE6_LOCALIZATION_KEYS = {
    "combat.error.no_active_skill",
}
REQUIRED_PHASE7_LOCALIZATION_KEYS = {
    "ui.board.valid",
    "ui.board.box_suffix",
    "ui.gem.base_skill_effect",
    "ui.gem.passive_effect",
    "ui.gem.support_effect",
    "ui.gem.affects_self",
    "ui.gem.affects_filtered_targets",
    "ui.gem.affects_active_or_passive",
    "ui.gem.affects_active_targets",
    "ui.gem.self_stat_target",
    "ui.gem.active_target",
    "ui.affix.unknown",
    "ui.affix.gen.prefix",
    "ui.affix.gen.suffix",
    "ui.affix.gen.implicit",
    "ui.effect.active",
    "ui.effect.none",
    "ui.skill.base_damage",
    "ui.skill.final_damage",
    "ui.skill.base_cooldown_ms",
    "ui.skill.final_cooldown_ms",
    "ui.skill.projectile_count",
    "ui.skill.area_multiplier",
    "ui.skill.speed_multiplier",
    "ui.skill.ready",
    "ui.skill.cooldown",
    "ui.hud.player_life",
    "ui.hud.move_speed",
    "ui.hud.elapsed_ms",
    "ui.hud.alive_monsters",
    "ui.drop.picked",
    "ui.drop.not_picked",
    "ui.pickup.success",
    "ui.pickup.pending",
    "ui.pickup.out_of_range",
    "ui.modifier.layer.additive",
    "ui.modifier.layer.final",
    "ui.modifier.layer.ignored",
    "ui.modifier.conduit_multiplier",
    "ui.relation.self",
    *{f"ui.gem_type.{number}.identity" for number in range(1, 10)},
}
REQUIRED_RELATION_COEFFICIENTS = {
    "adjacent": 1.25,
    "same_row": 1.0,
    "same_column": 1.0,
    "same_box": 1.0,
}

REQUIRED_ACTIVE_GEMS = {
    "active_fire_bolt": "skill_fire_bolt",
    "active_ice_shards": "skill_ice_shards",
    "active_lightning_chain": "skill_lightning_chain",
    "active_frost_nova": "skill_frost_nova",
    "active_puncture": "skill_puncture",
    "active_penetrating_shot": "skill_penetrating_shot",
    "active_lava_orb": "skill_lava_orb",
    "active_fungal_petards": "skill_fungal_petards",
}

REQUIRED_SUPPORT_GEMS = {
    "general_skill_modifier": {
        "support_fast_attack",
        "support_fast_cast",
        "support_skill_haste",
        "support_cooldown_focus",
        "support_heavy_impact",
        "support_wide_effect",
        "support_stable_output",
        "support_precision",
    },
    "damage_type_enhancer": {
        "support_physical_mastery",
        "support_fire_mastery",
        "support_cold_mastery",
        "support_lightning_mastery",
    },
    "projectile_area_specialist": {
        "support_extra_projectile",
        "support_shotgun",
        "support_projectile_speed",
        "support_area_magnify",
    },
    "risk_reward": {
        "support_overcharge",
        "support_overkill",
        "support_critical_burst",
    },
    "skill_level": {
        "support_elemental_level",
        "support_attack_spell_level",
        "support_projectile_level",
    },
    "board_conduit": {
        "support_row_conduit",
        "support_column_conduit",
        "support_box_conduit",
    },
    "skill_shape_modifier": {
        "support_fire_bolt_fork",
        "support_fire_bolt_nova",
        "support_fire_bolt_rain",
        "support_fire_bolt_lance",
        "support_fire_bolt_orbit",
        "support_ice_shards_fan",
        "support_ice_shards_storm",
        "support_ice_shards_mirror",
        "support_ice_shards_wall",
        "support_ice_shards_freeze_burst",
        "support_lightning_chain_fork",
        "support_lightning_chain_storm",
        "support_lightning_chain_ball",
        "support_lightning_chain_nova",
        "support_lightning_chain_beam",
        "support_frost_nova_double_ring",
        "support_frost_nova_mist",
        "support_frost_nova_spikes",
        "support_frost_nova_pulse",
        "support_frost_nova_glacier",
        "support_puncture_arc",
        "support_puncture_dash",
        "support_puncture_spin",
        "support_puncture_bleed_burst",
        "support_puncture_shadow_combo",
        "support_penetrating_shot_multi",
        "support_penetrating_shot_blast",
        "support_penetrating_shot_ricochet",
        "support_penetrating_shot_chain",
        "support_penetrating_shot_fan",
        "support_lava_orb_double",
        "support_lava_orb_volcano",
        "support_lava_orb_nova",
        "support_lava_orb_trail",
        "support_lava_orb_gravity",
        "support_fungal_petards_cloud",
        "support_fungal_petards_cluster",
        "support_fungal_petards_chain_burst",
        "support_fungal_petards_decoy",
        "support_fungal_petards_shock_spore",
    },
}
REQUIRED_PASSIVE_GEMS = {
    "passive_fire_focus",
    "passive_vitality",
    "passive_swift_gathering",
}

FORBIDDEN_CONFIG_IDS = {
    "equipment",
    "gear",
    "map",
    "currency",
    "corruption",
    "mana",
    "mana_regen",
    "strength",
    "dexterity",
    "intelligence",
    "armor",
    "evasion",
    "energy_shield",
    "resistance",
    "season",
    "class",
    "profession",
}
FORBIDDEN_ACTIVE_STAT_IDS = {
    "cooldown_reduction_percent",
}


def load_toml(path: Path) -> dict[str, Any]:
    with path.open("rb") as handle:
        data = tomllib.load(handle)
    if not isinstance(data, dict):
        raise ValueError("TOML root must be a table")
    return data


def items(data: dict[str, Any], table: str) -> list[dict[str, Any]]:
    value = data.get(table, [])
    if isinstance(value, list):
        return [item for item in value if isinstance(item, dict)]
    if isinstance(value, dict):
        nested = value.get("items", [])
        if isinstance(nested, list):
            return [item for item in nested if isinstance(item, dict)]
    return []


def unique_ids(entries: list[dict[str, Any]], label: str, errors: list[str]) -> set[str]:
    seen: set[str] = set()
    for entry in entries:
        entry_id = entry.get("id")
        if not isinstance(entry_id, str) or not entry_id:
            errors.append(f"{label}: entry missing non-empty id")
            continue
        if entry_id in seen:
            errors.append(f"{label}: duplicate id '{entry_id}'")
        seen.add(entry_id)
    return seen


def require_localization(
    entry: dict[str, Any],
    label: str,
    localization: dict[str, str],
    errors: list[str],
) -> None:
    name_key = entry.get("name_key")
    entry_id = entry.get("id", "<unknown>")
    if not isinstance(name_key, str) or not name_key:
        errors.append(f"{label}: '{entry_id}' missing name_key")
        return
    value = localization.get(name_key)
    if not isinstance(value, str) or not value.strip():
        errors.append(f"{label}: '{entry_id}' missing localization key '{name_key}'")
    if value == entry_id:
        errors.append(f"{label}: '{entry_id}' localization must not expose internal id")


def require_localized_key(
    entry: dict[str, Any],
    key: str,
    label: str,
    localization: dict[str, str],
    errors: list[str],
) -> None:
    entry_id = entry.get("id") or entry.get("template_id") or "<unknown>"
    localization_key = entry.get(key)
    if not isinstance(localization_key, str) or not localization_key:
        errors.append(f"{label}: '{entry_id}' missing {key}")
        return
    value = localization.get(localization_key)
    if not isinstance(value, str) or not value.strip():
        errors.append(f"{label}: '{entry_id}' missing localization key '{localization_key}'")
    if value == entry_id:
        errors.append(f"{label}: '{entry_id}' localization must not expose internal id")


def validate_monster_configs(
    monster_data: dict[str, Any],
    group_data: dict[str, Any],
    localization: dict[str, str],
    errors: list[str],
) -> None:
    monsters = items(monster_data, "monsters")
    monster_ids = unique_ids(monsters, "monsters", errors)
    numeric_ids: set[int] = set()
    marker_ids: set[str] = set()
    monster_tiers: dict[str, str] = {}
    monsters_by_group: dict[int, set[str]] = {}

    if len(monsters) != 32:
        errors.append("monsters: expected 32 seed geometric monster definitions")

    for monster in monsters:
        monster_id = monster.get("id")
        context = f"monsters:{monster_id or '<unknown>'}"
        tier = monster.get("tier")
        numeric_id = monster.get("numeric_id")
        group_numeric_id = monster.get("group_numeric_id")

        if not isinstance(numeric_id, int):
            errors.append(f"{context}: numeric_id must be an integer")
        else:
            expected_id = f"mon_{numeric_id}"
            if monster_id != expected_id:
                errors.append(f"{context}: id must match numeric_id as '{expected_id}'")
            if numeric_id in numeric_ids:
                errors.append(f"{context}: duplicate numeric_id '{numeric_id}'")
            numeric_ids.add(numeric_id)

        if tier not in MONSTER_TIER_NUMERIC_RULES:
            errors.append(f"{context}: unknown tier '{tier}'")
        elif isinstance(numeric_id, int):
            rule = MONSTER_TIER_NUMERIC_RULES[tier]
            visual_rule = MONSTER_VISUAL_RULES[tier]
            if not rule["min"] <= numeric_id <= rule["max"]:
                errors.append(f"{context}: numeric_id must be in {tier} range {rule['min']}..{rule['max']}")
            if group_numeric_id != rule["group"]:
                errors.append(f"{context}: group_numeric_id must be {rule['group']} for tier '{tier}'")
            if monster.get("role") != visual_rule["role"]:
                errors.append(f"{context}: role must be '{visual_rule['role']}' for tier '{tier}'")
            if monster.get("visual_rarity") != visual_rule["visual_rarity"]:
                errors.append(f"{context}: visual_rarity must be '{visual_rule['visual_rarity']}' for tier '{tier}'")
            if monster.get("size_px") != visual_rule["size"]:
                errors.append(f"{context}: size_px must be {visual_rule['size']} for tier '{tier}'")
            if monster.get("size_px", 0) < PLAYER_GEOMETRY_RADIUS_PX * 2:
                errors.append(f"{context}: size_px must be at least player diameter {PLAYER_GEOMETRY_RADIUS_PX * 2}")
            if monster.get("rarity_arc_color") != visual_rule["arc_color"]:
                errors.append(f"{context}: rarity_arc_color must be '{visual_rule['arc_color']}' for tier '{tier}'")
            if monster.get("rarity_arc_segments") != visual_rule["arc_segments"]:
                errors.append(f"{context}: rarity_arc_segments must be {visual_rule['arc_segments']} for tier '{tier}'")
            if monster.get("rarity_arc_width_px") != visual_rule["arc_width"]:
                errors.append(f"{context}: rarity_arc_width_px must be {visual_rule['arc_width']} for tier '{tier}'")
            if monster.get("rarity_pedestal_shape") != visual_rule["pedestal_shape"]:
                errors.append(f"{context}: rarity_pedestal_shape must be '{visual_rule['pedestal_shape']}' for tier '{tier}'")
            if monster.get("rarity_pedestal_color") != visual_rule["pedestal_color"]:
                errors.append(f"{context}: rarity_pedestal_color must be '{visual_rule['pedestal_color']}' for tier '{tier}'")
            if monster.get("rarity_pedestal_alpha") != visual_rule["pedestal_alpha"]:
                errors.append(f"{context}: rarity_pedestal_alpha must be {visual_rule['pedestal_alpha']} for tier '{tier}'")
            if monster.get("rarity_pedestal_radius_scale") != visual_rule["pedestal_radius_scale"]:
                errors.append(f"{context}: rarity_pedestal_radius_scale must be {visual_rule['pedestal_radius_scale']} for tier '{tier}'")
            if monster.get("rarity_pedestal_line_width_px") != visual_rule["pedestal_line_width"]:
                errors.append(f"{context}: rarity_pedestal_line_width_px must be {visual_rule['pedestal_line_width']} for tier '{tier}'")
            if monster.get("rarity_pedestal_pulse") != visual_rule["pedestal_pulse"]:
                errors.append(f"{context}: rarity_pedestal_pulse must be {visual_rule['pedestal_pulse']} for tier '{tier}'")

        if isinstance(monster_id, str):
            monster_tiers[monster_id] = str(tier)
        if isinstance(group_numeric_id, int) and isinstance(monster_id, str):
            monsters_by_group.setdefault(group_numeric_id, set()).add(monster_id)

        marker_id = monster.get("marker_id")
        if not isinstance(marker_id, str) or not re.match(r"^[NMEB]-\d{2}$", marker_id):
            errors.append(f"{context}: marker_id must use N-01/M-01/E-01/B-01 style")
        elif marker_id in marker_ids:
            errors.append(f"{context}: duplicate marker_id '{marker_id}'")
        else:
            marker_ids.add(marker_id)

        if monster.get("geometry_shape") not in ALLOWED_MONSTER_GEOMETRY_SHAPES:
            errors.append(f"{context}: unknown geometry_shape '{monster.get('geometry_shape')}'")
        if monster.get("movement_kind") not in ALLOWED_MONSTER_MOVEMENT_KINDS:
            errors.append(f"{context}: unknown movement_kind '{monster.get('movement_kind')}'")
        if monster.get("fallback_unit_visual") not in ALLOWED_MONSTER_FALLBACK_VISUALS:
            errors.append(f"{context}: fallback_unit_visual must be enemy_imp or enemy_brute")
        if not isinstance(monster.get("size_px"), int) or monster.get("size_px") <= 0:
            errors.append(f"{context}: size_px must be a positive integer")
        if not isinstance(monster.get("base_life"), (int, float)) or monster["base_life"] <= 0:
            errors.append(f"{context}: base_life must be a positive number")
        if not isinstance(monster.get("base_attack"), (int, float)) or monster["base_attack"] < 0:
            errors.append(f"{context}: base_attack must be a non-negative number")
        if monster.get("palette_key") != MONSTER_STANDARD_PALETTE_KEY:
            errors.append(f"{context}: palette_key must be '{MONSTER_STANDARD_PALETTE_KEY}'")
        if monster.get("primary_color") != MONSTER_STANDARD_PRIMARY_COLOR:
            errors.append(f"{context}: primary_color must use standard monster body color {MONSTER_STANDARD_PRIMARY_COLOR}")
        if monster.get("accent_color") != MONSTER_STANDARD_ACCENT_COLOR:
            errors.append(f"{context}: accent_color must use standard monster accent color {MONSTER_STANDARD_ACCENT_COLOR}")
        for field in ("primary_color", "accent_color"):
            if not isinstance(monster.get(field), str) or not HEX_COLOR_PATTERN.match(monster[field]):
                errors.append(f"{context}: {field} must be #RRGGBB")
        if monster.get("rarity_arc_color"):
            if not isinstance(monster.get("rarity_arc_color"), str) or not HEX_COLOR_PATTERN.match(monster["rarity_arc_color"]):
                errors.append(f"{context}: rarity_arc_color must be empty or #RRGGBB")
        for field in ("rarity_arc_segments", "rarity_arc_width_px"):
            if not isinstance(monster.get(field), int) or monster[field] < 0:
                errors.append(f"{context}: {field} must be a non-negative integer")
        if monster.get("rarity_pedestal_shape") not in {"shadow", "diamond", "hexagon"}:
            errors.append(f"{context}: rarity_pedestal_shape must be shadow, diamond, or hexagon")
        if not isinstance(monster.get("rarity_pedestal_color"), str) or not HEX_COLOR_PATTERN.match(monster["rarity_pedestal_color"]):
            errors.append(f"{context}: rarity_pedestal_color must be #RRGGBB")
        for field in ("rarity_pedestal_alpha", "rarity_pedestal_radius_scale", "rarity_pedestal_line_width_px"):
            if not isinstance(monster.get(field), (int, float)) or monster[field] <= 0:
                errors.append(f"{context}: {field} must be a positive number")
        if not isinstance(monster.get("rarity_pedestal_pulse"), bool):
            errors.append(f"{context}: rarity_pedestal_pulse must be boolean")
        for field in ("movement_interval_sec", "movement_distance_px"):
            if not isinstance(monster.get(field), (int, float)) or monster[field] < 0:
                errors.append(f"{context}: {field} must be non-negative")
        require_localization(monster, "monsters", localization, errors)

    groups = items(group_data, "monster_groups")
    group_ids = unique_ids(groups, "monster groups", errors)
    expected_group_ids = {f"monster_group_{rule['group']}" for rule in MONSTER_TIER_NUMERIC_RULES.values()}
    if group_ids != expected_group_ids:
        errors.append("monster groups must exactly cover 1001 normal, 2001 magic, 3001 rare, and 4001 boss")

    for group in groups:
        group_id = group.get("id")
        context = f"monster_groups:{group_id or '<unknown>'}"
        tier = group.get("tier")
        numeric_id = group.get("numeric_id")
        member_ids = group.get("member_ids", [])
        if tier not in MONSTER_TIER_NUMERIC_RULES:
            errors.append(f"{context}: unknown tier '{tier}'")
            expected_numeric_id = None
        else:
            expected_numeric_id = MONSTER_TIER_NUMERIC_RULES[tier]["group"]
            if numeric_id != expected_numeric_id:
                errors.append(f"{context}: numeric_id must be {expected_numeric_id} for tier '{tier}'")
            if group_id != f"monster_group_{expected_numeric_id}":
                errors.append(f"{context}: id must be monster_group_{expected_numeric_id}")

        if group.get("selection_policy") != "uniform":
            errors.append(f"{context}: selection_policy must be uniform")
        if not isinstance(member_ids, list) or not member_ids:
            errors.append(f"{context}: member_ids must be a non-empty array")
            member_ids = []
        if len(member_ids) != len(set(member_ids)):
            errors.append(f"{context}: member_ids must be unique")
        for member_id in member_ids:
            if member_id not in monster_ids:
                errors.append(f"{context}: unknown monster member '{member_id}'")
                continue
            if monster_tiers.get(member_id) != tier:
                errors.append(f"{context}: member '{member_id}' is tier '{monster_tiers.get(member_id)}', not '{tier}'")
        if isinstance(expected_numeric_id, int):
            expected_members = monsters_by_group.get(expected_numeric_id, set())
            if set(member_ids) != expected_members:
                errors.append(f"{context}: member_ids must exactly match monsters assigned to group {expected_numeric_id}")
        require_localization(group, "monster groups", localization, errors)


def check_tags(tag_refs: Any, tag_ids: set[str], context: str, errors: list[str]) -> None:
    if tag_refs is None:
        return
    if not isinstance(tag_refs, list):
        errors.append(f"{context}: tag references must be an array")
        return
    for tag in tag_refs:
        if tag not in tag_ids:
            errors.append(f"{context}: unknown tag '{tag}'")


def check_gem_kind_and_digit(entry: dict[str, Any], expected_kind: str, context: str, errors: list[str]) -> None:
    gem_kind = entry.get("gem_kind")
    if gem_kind != expected_kind:
        errors.append(f"{context}: gem_kind must be '{expected_kind}'")
    if gem_kind not in REQUIRED_GEM_KINDS:
        errors.append(f"{context}: invalid gem_kind '{gem_kind}'")
    sudoku_digit = entry.get("sudoku_digit")
    if not isinstance(sudoku_digit, int) or not 1 <= sudoku_digit <= 9:
        errors.append(f"{context}: sudoku_digit must be an integer from 1 to 9")
    gem_type = entry.get("gem_type")
    if isinstance(gem_type, str) and gem_type.startswith("gem_type_") and isinstance(sudoku_digit, int):
        try:
            legacy_digit = int(gem_type.rsplit("_", 1)[-1])
        except ValueError:
            errors.append(f"{context}: gem_type cannot map to sudoku_digit")
        else:
            if legacy_digit != sudoku_digit:
                errors.append(f"{context}: legacy gem_type and sudoku_digit must match during migration")


def check_no_random_affix_fields(entry: dict[str, Any], context: str, errors: list[str]) -> None:
    forbidden_fields = {"prefix_affixes", "suffix_affixes", "implicit_affixes", "random_affixes"}
    present = sorted(forbidden_fields & set(entry))
    if present:
        errors.append(f"{context}: real gem config must not contain random affix fields: {', '.join(present)}")


def gem_definition_entry(definition: GemDefinition) -> dict[str, Any]:
    return {
        "id": definition.base_gem_id,
        "name_key": definition.name_key,
        "description_key": definition.description_key,
        "category": definition.category,
        "gem_type": definition.gem_type,
        "gem_kind": definition.gem_kind,
        "sudoku_digit": definition.sudoku_digit,
        "skill_template": definition.skill_template_id,
        "visual_effect": definition.visual_effect,
        "shape_effect": definition.shape_effect,
        "tags": sorted(definition.tags),
        "effect_stats": list(definition.effect_stats),
        "passive_effects": [
            {
                "target": effect.target,
                "stat": effect.stat,
                "value": effect.value,
                "layer": effect.layer,
            }
            for effect in definition.passive_effects
        ],
        "apply_filter": {
            "target_kinds": list(definition.apply_filter_target_kinds),
            "tags_any": list(definition.apply_filter_tags_any),
            "tags_all": list(definition.apply_filter_tags_all),
            "tags_none": list(definition.apply_filter_tags_none),
        },
    }


def check_forbidden_config_entries(value: Any, path: str, errors: list[str]) -> None:
    if isinstance(value, dict):
        for key, nested in value.items():
            check_forbidden_config_entries(nested, f"{path}.{key}", errors)
        return
    if isinstance(value, list):
        for index, nested in enumerate(value):
            check_forbidden_config_entries(nested, f"{path}[{index}]", errors)
        return
    if not isinstance(value, str):
        return

    field_name = path.rsplit(".", 1)[-1]
    if field_name not in {"id", "category", "v1_role", "behavior_type"}:
        return
    lowered = value.lower()
    if path.startswith("configs/player/"):
        return

    for forbidden in FORBIDDEN_CONFIG_IDS:
        if forbidden in lowered:
            errors.append(f"{path}: forbidden V1 config entry '{value}' contains '{forbidden}'")


def validate() -> list[str]:
    errors: list[str] = []

    if not CONFIGS.exists():
        return ["configs directory does not exist"]

    for relative in EXPECTED_FILES:
        if not (CONFIGS / relative).is_file():
            errors.append(f"missing required config file: configs/{relative}")
    for relative in EXPECTED_SKILL_PACKAGE_FILES:
        if not (CONFIGS / relative).is_file():
            errors.append(f"missing required skill package file: configs/{relative}")

    for path in CONFIGS.rglob("*.toml"):
        if path.name.startswith("all."):
            errors.append(f"forbidden aggregate config file: {path.relative_to(ROOT)}")

    data: dict[str, dict[str, Any]] = {}
    for relative in EXPECTED_FILES:
        path = CONFIGS / relative
        if not path.exists():
            continue
        try:
            data[relative] = load_toml(path)
        except Exception as exc:
            errors.append(f"invalid TOML in configs/{relative}: {exc}")

    for relative, parsed in data.items():
        check_forbidden_config_entries(parsed, f"configs/{relative}", errors)

    localization = data.get("localization/zh_cn.toml", {}).get("strings", {})
    if not isinstance(localization, dict):
        errors.append("localization/zh_cn.toml: [strings] table is required")
        localization = {}
    validate_monster_configs(
        data.get("monsters/monster_defs.toml", {}),
        data.get("monsters/monster_groups.toml", {}),
        localization,
        errors,
    )
    try:
        skill_packages = load_skill_packages(CONFIGS)
    except Exception as exc:
        errors.append(f"skill packages: {exc}")
        skill_packages = {}
    expected_skill_packages = {"active_fire_bolt", "active_ice_shards", "active_lightning_chain", "active_penetrating_shot", "active_frost_nova", "active_puncture", "active_fungal_petards", "active_lava_orb"}
    if set(skill_packages) != expected_skill_packages:
        errors.append("skill packages must contain all migrated V1 active skill packages including active_lava_orb")
    for package_id, package in skill_packages.items():
        display = package.get("display", {})
        presentation = package.get("presentation", {})
        for key_name in ["name_key", "description_key"]:
            localization_key = display.get(key_name) if isinstance(display, dict) else None
            if localization_key not in localization:
                errors.append(f"skill package '{package_id}' missing localization key '{localization_key}'")
        if isinstance(presentation, dict):
            for key_name, localization_key in presentation.items():
                if key_name in {"hit_stop_ms", "camera_shake", "vfx_scale"}:
                    continue
                if localization_key not in localization:
                    errors.append(
                        f"skill package '{package_id}' presentation.{key_name} missing localization key '{localization_key}'"
                    )

    id_pattern = data.get("core/id_rules.toml", {}).get("id_rules", {}).get(
        "allowed_pattern", "^[a-z][a-z0-9_]*$"
    )
    try:
        compiled_id_pattern = re.compile(str(id_pattern))
    except re.error as exc:
        errors.append(f"core/id_rules.toml: invalid allowed_pattern: {exc}")
        compiled_id_pattern = re.compile(r"^[a-z][a-z0-9_]*$")

    stats = items(data.get("player/player_stat_defs.toml", {}), "stats")
    stat_ids = unique_ids(stats, "player stats", errors)
    missing_stats = sorted(REQUIRED_STATS - stat_ids)
    if missing_stats:
        errors.append(f"player stats missing required ids: {', '.join(missing_stats)}")
    obsolete_stats = sorted(OBSOLETE_PLAYER_STATS & stat_ids)
    if obsolete_stats:
        errors.append(f"player stats contain obsolete ids: {', '.join(obsolete_stats)}")
    forbidden_stats = sorted(FORBIDDEN_ACTIVE_STAT_IDS & stat_ids)
    if forbidden_stats:
        errors.append(f"player stats contain forbidden ids: {', '.join(forbidden_stats)}")
    runtime_stat_ids: set[str] = set()
    affix_spawn_enabled_stat_ids: set[str] = set()
    for stat in stats:
        stat_id = stat.get("id")
        if isinstance(stat_id, str) and not compiled_id_pattern.match(stat_id):
            errors.append(f"player stats: id '{stat_id}' does not match id_rules")
        require_localization(stat, "player stats", localization, errors)
        if stat.get("category") is None:
            errors.append(f"player stats: '{stat_id}' missing category")
        if stat.get("value_type") not in ALLOWED_PLAYER_STAT_VALUE_TYPES:
            errors.append(f"player stats: '{stat_id}' has invalid value_type '{stat.get('value_type')}'")
        v1_status = stat.get("v1_status")
        if v1_status not in ALLOWED_PLAYER_STAT_STATUSES:
            errors.append(f"player stats: '{stat_id}' has invalid v1_status '{v1_status}'")
        runtime_effective = stat.get("runtime_effective")
        if not isinstance(runtime_effective, bool):
            errors.append(f"player stats: '{stat_id}' runtime_effective must be boolean")
        elif runtime_effective and isinstance(stat_id, str):
            runtime_stat_ids.add(stat_id)
        affix_spawn_enabled = stat.get("affix_spawn_enabled_v1")
        if not isinstance(affix_spawn_enabled, bool):
            errors.append(f"player stats: '{stat_id}' affix_spawn_enabled_v1 must be boolean")
        elif affix_spawn_enabled:
            if v1_status != "V1_ACTIVE":
                errors.append(f"player stats: '{stat_id}' cannot enable V1 affix spawning unless V1_ACTIVE")
            if isinstance(stat_id, str):
                affix_spawn_enabled_stat_ids.add(stat_id)
    missing_runtime_stats = sorted(REQUIRED_STATS - runtime_stat_ids)
    if missing_runtime_stats:
        errors.append(f"player stats missing runtime-effective ids: {', '.join(missing_runtime_stats)}")

    player_base = data.get("player/player_base_stats.toml", {}).get("player_base", {})
    if not isinstance(player_base, dict):
        errors.append("player/player_base_stats.toml: [player_base] table is required")
        player_base = {}
    for stat_id in player_base:
        if stat_id not in stat_ids:
            errors.append(f"player_base: unknown stat '{stat_id}'")
        if stat_id in OBSOLETE_PLAYER_STATS:
            errors.append(f"player_base: obsolete stat '{stat_id}'")
        if stat_id in FORBIDDEN_ACTIVE_STAT_IDS:
            errors.append(f"player_base: forbidden stat '{stat_id}'")
        if not isinstance(player_base[stat_id], (int, float, bool)):
            errors.append(f"player_base: stat '{stat_id}' value must be numeric or boolean")
    missing_base_stats = sorted(runtime_stat_ids - set(player_base))
    if missing_base_stats:
        errors.append(f"player_base missing runtime-effective stats: {', '.join(missing_base_stats)}")

    character_panel = data.get("player/character_panel.toml", {})
    panel_sections = items(character_panel, "sections")
    panel_rows = items(character_panel, "rows")
    panel_section_ids = unique_ids(panel_sections, "character panel sections", errors)
    panel_row_ids = unique_ids(panel_rows, "character panel rows", errors)
    _ = panel_row_ids
    for section in panel_sections:
        require_localized_key(section, "title_key", "character panel sections", localization, errors)
        if section.get("layout") not in {"attributes", "core", "resistance", "detail"}:
            errors.append(f"character panel section '{section.get('id')}': invalid layout '{section.get('layout')}'")
    for row in panel_rows:
        row_id = row.get("id", "<unknown>")
        section_id = row.get("section_id")
        stat_id = row.get("stat_id")
        if section_id not in panel_section_ids:
            errors.append(f"character panel row '{row_id}': unknown section_id '{section_id}'")
        if stat_id not in stat_ids:
            errors.append(f"character panel row '{row_id}': unknown stat_id '{stat_id}'")
        if stat_id in OBSOLETE_PLAYER_STATS:
            errors.append(f"character panel row '{row_id}': obsolete stat_id '{stat_id}'")
        if stat_id in FORBIDDEN_ACTIVE_STAT_IDS:
            errors.append(f"character panel row '{row_id}': forbidden stat_id '{stat_id}'")
        if not isinstance(row.get("icon_text"), str) or not row.get("icon_text"):
            errors.append(f"character panel row '{row_id}': icon_text is required")
        if row.get("formatter") not in {"auto", "integer", "number", "percent", "multiplier", "seconds_from_ms", "boolean", "rating"}:
            errors.append(f"character panel row '{row_id}': invalid formatter '{row.get('formatter')}'")

    damage_types = items(data.get("combat/damage_types.toml", {}), "damage_types")
    damage_type_ids = unique_ids(damage_types, "damage types", errors)
    if damage_type_ids != REQUIRED_DAMAGE_TYPES:
        errors.append("damage types must be exactly physical, fire, cold, lightning, and chaos")
    for damage_type in damage_types:
        require_localization(damage_type, "damage types", localization, errors)
        require_localized_key(damage_type, "display_name_key", "damage types", localization, errors)

    status_effects = items(data.get("combat/status_effects.toml", {}), "status_effects")
    status_effect_ids = unique_ids(status_effects, "status effects", errors)
    if status_effect_ids != REQUIRED_STATUS_EFFECTS:
        errors.append("status effects must be exactly burning, chill, and bleed")
    for status_effect in status_effects:
        require_localization(status_effect, "status effects", localization, errors)
        require_localized_key(status_effect, "display_name_key", "status effects", localization, errors)
        require_localized_key(status_effect, "description_key", "status effects", localization, errors)
        if status_effect.get("v1_runtime") != "placeholder":
            errors.append(f"status effects: '{status_effect.get('id')}' must remain a V1 placeholder")

    gem_types = items(data.get("gems/gem_type_defs.toml", {}), "gem_types")
    gem_type_ids = unique_ids(gem_types, "gem types", errors)
    expected_gem_types = {f"gem_type_{number}" for number in range(1, 10)}
    if gem_type_ids != expected_gem_types:
        errors.append("gem types must be exactly gem_type_1 through gem_type_9")
    for gem_type in gem_types:
        require_localization(gem_type, "gem types", localization, errors)

    tags = items(data.get("gems/gem_tag_defs.toml", {}), "tags")
    tag_ids = unique_ids(tags, "gem tags", errors)
    missing_tags = sorted(REQUIRED_TAGS - tag_ids)
    extra_required_context = sorted(tag_ids - REQUIRED_TAGS)
    if missing_tags:
        errors.append(f"gem tags missing required ids: {', '.join(missing_tags)}")
    for tag in tags:
        require_localization(tag, "gem tags", localization, errors)
        require_localized_key(tag, "display_name_key", "gem tags", localization, errors)
    for damage_type_id in damage_type_ids:
        if damage_type_id not in tag_ids:
            errors.append(f"damage type '{damage_type_id}' must also exist as a tag")

    placement = data.get("sudoku_board/placement_rules.toml", {}).get("placement", {})
    allowed_gem_types = placement.get("allowed_gem_types", []) if isinstance(placement, dict) else []
    board_layout = data.get("sudoku_board/board_layout.toml", {}).get("board", {})
    if not isinstance(board_layout, dict):
        errors.append("board_layout.toml: [board] table is required")
        board_layout = {}
    if (
        board_layout.get("rows") != 9
        or board_layout.get("columns") != 9
        or board_layout.get("box_rows") != 3
        or board_layout.get("box_columns") != 3
    ):
        errors.append("board layout must be fixed at 9 rows, 9 columns, and 3x3 boxes")
    if not isinstance(placement, dict):
        errors.append("placement_rules.toml: [placement] table is required")
        placement = {}
    if placement.get("allow_empty_board_to_enter_combat") is not False:
        errors.append("placement.allow_empty_board_to_enter_combat must be false")
    if placement.get("require_active_skill_to_enter_combat") is not True:
        errors.append("placement.require_active_skill_to_enter_combat must be true")
    if set(allowed_gem_types) != expected_gem_types:
        errors.append("placement.allowed_gem_types must reference all gem_type_1 through gem_type_9")
    for gem_type in allowed_gem_types:
        if gem_type not in gem_type_ids:
            errors.append(f"placement: unknown gem_type '{gem_type}'")

    relations = items(data.get("sudoku_board/relation_rules.toml", {}), "relations")
    relation_ids = unique_ids(relations, "relations", errors)
    if relation_ids != REQUIRED_BOARD_RELATIONS:
        errors.append("board relations must be exactly adjacent, same_row, same_column, and same_box")
    for relation in relations:
        require_localization(relation, "relations", localization, errors)
        relation_id = str(relation.get("id"))
        if relation_id in REQUIRED_RELATION_COEFFICIENTS:
            actual = float(relation.get("coefficient"))
            expected = REQUIRED_RELATION_COEFFICIENTS[relation_id]
            if actual != expected:
                errors.append(f"relation '{relation_id}' coefficient must be {expected}")
    for required_key in REQUIRED_BOARD_LOCALIZATION_KEYS:
        if required_key not in localization:
            errors.append(f"localization missing board key '{required_key}'")
    for required_key in REQUIRED_PHASE4_LOCALIZATION_KEYS:
        if required_key not in localization:
            errors.append(f"localization missing Phase 4 key '{required_key}'")
    for required_key in REQUIRED_PHASE5_LOCALIZATION_KEYS:
        if required_key not in localization:
            errors.append(f"localization missing Phase 5 key '{required_key}'")
    for required_key in REQUIRED_PHASE6_LOCALIZATION_KEYS:
        if required_key not in localization:
            errors.append(f"localization missing Phase 6 key '{required_key}'")
    for required_key in REQUIRED_PHASE7_LOCALIZATION_KEYS:
        if required_key not in localization:
            errors.append(f"localization missing Phase 7 key '{required_key}'")

    routing_stats = items(data.get("sudoku_board/effect_routing_rules.toml", {}), "routing_stats")
    routing_stat_ids = unique_ids(routing_stats, "routing stats", errors)
    for routing_stat in routing_stats:
        require_localization(routing_stat, "routing stats", localization, errors)

    legal_stat_ids = stat_ids | routing_stat_ids

    affix_groups = items(data.get("affixes/affix_groups.toml", {}), "affix_groups")
    affix_group_ids = unique_ids(affix_groups, "affix groups", errors)
    if affix_group_ids != REQUIRED_AFFIX_GROUPS:
        errors.append("affix groups must exactly cover V1 mutual exclusion groups")
    for group in affix_groups:
        require_localization(group, "affix groups", localization, errors)

    affix_tiers = items(data.get("affixes/affix_tiers.toml", {}), "affix_tiers")
    unique_ids(affix_tiers, "affix tiers", errors)
    for tier in affix_tiers:
        require_localization(tier, "affix tiers", localization, errors)

    try:
        active_skill_packages = load_skill_packages(CONFIGS)
    except Exception as exc:
        errors.append(f"active skill packages failed validation: {exc}")
        active_skill_packages = {}
    if set(active_skill_packages) != set(REQUIRED_ACTIVE_GEMS):
        errors.append("active Skill Packages must match the 8 V1 active gem ids exactly")
    all_skill_template_ids = set(REQUIRED_ACTIVE_GEMS.values())

    try:
        gem_definitions = load_gem_definitions(CONFIGS)
    except Exception as exc:
        errors.append(f"gem definition packages failed validation: {exc}")
        gem_definitions = {}

    active_gems = [
        gem_definition_entry(definition)
        for definition in gem_definitions.values()
        if definition.gem_kind == "active_skill"
    ]
    passive_gems = [
        gem_definition_entry(definition)
        for definition in gem_definitions.values()
        if definition.gem_kind == "passive_skill"
    ]
    support_gems = [
        gem_definition_entry(definition)
        for definition in gem_definitions.values()
        if definition.gem_kind == "support"
    ]

    active_gem_ids = unique_ids(active_gems, "active skill gems", errors)
    if active_gem_ids != set(REQUIRED_ACTIVE_GEMS):
        errors.append("active skill gems must match the 8 V1 active gem ids exactly")
    for gem in active_gems:
        context = f"active_skill_gems:{gem.get('id', '<unknown>')}"
        gem_id = gem.get("id")
        check_gem_kind_and_digit(gem, "active_skill", context, errors)
        check_no_random_affix_fields(gem, context, errors)
        if gem.get("gem_type") != "gem_type_1":
            errors.append(f"{context}: active skill gems must use gem_type_1")
        if gem.get("sudoku_digit") != 1:
            errors.append(f"{context}: active skill gems must use sudoku_digit 1")
        tags_value = gem.get("tags")
        check_tags(tags_value, tag_ids, context, errors)
        tags_set = set(tags_value) if isinstance(tags_value, list) else set()
        if "attack" in tags_set and "spell" in tags_set:
            errors.append(f"{context}: active gem cannot be both attack and spell in V1")
        if gem.get("skill_template") not in all_skill_template_ids:
            errors.append(f"{context}: unknown skill_template '{gem.get('skill_template')}'")
        if gem_id in REQUIRED_ACTIVE_GEMS and gem.get("skill_template") != REQUIRED_ACTIVE_GEMS[gem_id]:
            errors.append(f"{context}: expected skill_template '{REQUIRED_ACTIVE_GEMS[gem_id]}'")
        require_localization(gem, "active skill gems", localization, errors)
        require_localized_key(gem, "description_key", "active skill gems", localization, errors)

    passive_gem_ids = unique_ids(passive_gems, "passive skill gems", errors)
    if passive_gem_ids != REQUIRED_PASSIVE_GEMS:
        errors.append("passive skill gems must match the planned V1 Phase 2 passive ids exactly")
    for gem in passive_gems:
        context = f"passive_skill_gems:{gem.get('id', '<unknown>')}"
        check_gem_kind_and_digit(gem, "passive_skill", context, errors)
        check_no_random_affix_fields(gem, context, errors)
        if gem.get("skill_template"):
            errors.append(f"{context}: passive skill gems must not declare skill_template")
        if gem.get("gem_type") not in gem_type_ids:
            errors.append(f"{context}: unknown gem_type '{gem.get('gem_type')}'")
        tags_value = gem.get("tags")
        check_tags(tags_value, tag_ids, context, errors)
        tags_set = set(tags_value) if isinstance(tags_value, list) else set()
        if "passive_skill_gem" not in tags_set:
            errors.append(f"{context}: passive skill gems must include passive_skill_gem tag")
        passive_effects = gem.get("passive_effects", [])
        if not isinstance(passive_effects, list) or not passive_effects:
            errors.append(f"{context}: passive skill gem must declare passive_effects")
        else:
            for effect in passive_effects:
                if not isinstance(effect, dict):
                    errors.append(f"{context}: passive_effects entries must be tables")
                    continue
                if effect.get("target") not in {"active_skill", "self_stat"}:
                    errors.append(f"{context}: passive effect target must be active_skill or self_stat")
                stat = effect.get("stat")
                if stat not in legal_stat_ids:
                    errors.append(f"{context}: unknown passive effect stat '{stat}'")
                if stat in FORBIDDEN_ACTIVE_STAT_IDS:
                    errors.append(f"{context}: forbidden passive effect stat '{stat}'")
                if not isinstance(effect.get("value"), (int, float)):
                    errors.append(f"{context}: passive effect value must be numeric")
                if effect.get("layer") not in {"additive", "final"}:
                    errors.append(f"{context}: passive effect layer must be additive or final")
        apply_filter = gem.get("apply_filter", {})
        if isinstance(apply_filter, dict):
            target_kinds = apply_filter.get("target_kinds", [])
            if target_kinds:
                for kind in target_kinds:
                    if kind not in REQUIRED_GEM_KINDS - {"support"}:
                        errors.append(f"{context}: invalid passive target kind '{kind}'")
            check_tags(apply_filter.get("tags_any"), tag_ids, context, errors)
            check_tags(apply_filter.get("tags_all"), tag_ids, context, errors)
            check_tags(apply_filter.get("tags_none"), tag_ids, context, errors)
        require_localization(gem, "passive skill gems", localization, errors)
        require_localized_key(gem, "description_key", "passive skill gems", localization, errors)

    support_gem_ids = unique_ids(support_gems, "support gems", errors)
    required_support_ids = set().union(*REQUIRED_SUPPORT_GEMS.values())
    if support_gem_ids != required_support_ids:
        errors.append("support gems must match the planned V1 support gem ids exactly")
    category_counts: dict[str, int] = {}
    for gem in support_gems:
        context = f"support_gems:{gem.get('id', '<unknown>')}"
        category = gem.get("category")
        check_gem_kind_and_digit(gem, "support", context, errors)
        check_no_random_affix_fields(gem, context, errors)
        if isinstance(category, str):
            category_counts[category] = category_counts.get(category, 0) + 1
        if gem.get("gem_type") not in gem_type_ids:
            errors.append(f"{context}: unknown gem_type '{gem.get('gem_type')}'")
        tags_value = gem.get("tags")
        check_tags(tags_value, tag_ids, context, errors)
        apply_filter = gem.get("apply_filter")
        if not isinstance(apply_filter, dict) or not any(
            apply_filter.get(key) for key in ["tags_any", "tags_all", "tags_none"]
        ):
            errors.append(f"{context}: support gem must declare non-empty apply_filter tags")
        elif isinstance(apply_filter, dict):
            target_kinds = apply_filter.get("target_kinds", [])
            if not isinstance(target_kinds, list) or not target_kinds:
                errors.append(f"{context}: support gem must declare apply_filter.target_kinds")
            else:
                for kind in target_kinds:
                    if kind not in {"active_skill", "passive_skill"}:
                        errors.append(f"{context}: support target kind must be active_skill or passive_skill")
            check_tags(apply_filter.get("tags_any"), tag_ids, context, errors)
            check_tags(apply_filter.get("tags_all"), tag_ids, context, errors)
            check_tags(apply_filter.get("tags_none"), tag_ids, context, errors)
        effect_stats = gem.get("effect_stats", [])
        if not isinstance(effect_stats, list) or not effect_stats:
            errors.append(f"{context}: support gem must declare effect_stats")
        elif isinstance(effect_stats, list):
            for stat in effect_stats:
                if stat not in legal_stat_ids:
                    errors.append(f"{context}: unknown effect stat '{stat}'")
                if stat in FORBIDDEN_ACTIVE_STAT_IDS:
                    errors.append(f"{context}: forbidden effect stat '{stat}'")
        require_localization(gem, "support gems", localization, errors)
        require_localized_key(gem, "description_key", "support gems", localization, errors)

    for category, expected_ids in REQUIRED_SUPPORT_GEMS.items():
        actual_ids = {gem.get("id") for gem in support_gems if gem.get("category") == category}
        if actual_ids != expected_ids:
            errors.append(
                f"support gem category '{category}' must contain {len(expected_ids)} expected ids"
            )

    scaling_rules = data.get("skills/skill_scaling_rules.toml", {})
    stat_layers = scaling_rules.get("stat_layers", {})
    if not isinstance(stat_layers, dict):
        errors.append("skill_scaling_rules.toml: [stat_layers] table is required")
        stat_layers = {}
    for stat, layer in stat_layers.items():
        if stat not in legal_stat_ids:
            errors.append(f"stat_layers: unknown stat '{stat}'")
        if layer not in {"additive", "final"}:
            errors.append(f"stat_layers: stat '{stat}' has invalid layer '{layer}'")

    support_base_modifiers = scaling_rules.get("support_base_modifiers", [])
    if not isinstance(support_base_modifiers, list) or not support_base_modifiers:
        errors.append("support_base_modifiers must be non-empty")
        support_base_modifiers = []
    modifier_support_ids = {entry.get("support_id") for entry in support_base_modifiers}
    missing_modifier_supports = required_support_ids - modifier_support_ids - {
        "support_row_conduit",
        "support_column_conduit",
        "support_box_conduit",
    }
    if missing_modifier_supports:
        errors.append(
            "support_base_modifiers missing support ids: "
            + ", ".join(sorted(str(item) for item in missing_modifier_supports))
        )
    for entry in support_base_modifiers:
        if entry.get("support_id") not in required_support_ids:
            errors.append(f"support_base_modifiers: unknown support_id '{entry.get('support_id')}'")
        if entry.get("stat") not in legal_stat_ids:
            errors.append(f"support_base_modifiers: unknown stat '{entry.get('stat')}'")
        if entry.get("stat") in FORBIDDEN_ACTIVE_STAT_IDS:
            errors.append(f"support_base_modifiers: forbidden stat '{entry.get('stat')}'")
        if entry.get("layer") not in {"additive", "final"}:
            errors.append(f"support_base_modifiers: invalid layer '{entry.get('layer')}'")
        if not isinstance(entry.get("value"), (int, float)):
            errors.append("support_base_modifiers: value must be numeric")

    conduit_amplifiers = scaling_rules.get("conduit_amplifiers", [])
    expected_conduits = {
        ("support_row_conduit", "same_row"),
        ("support_column_conduit", "same_column"),
        ("support_box_conduit", "same_box"),
    }
    actual_conduits = {(entry.get("support_id"), entry.get("relation")) for entry in conduit_amplifiers}
    if actual_conduits != expected_conduits:
        errors.append("conduit_amplifiers must cover row, column, and box conduits only")
    for entry in conduit_amplifiers:
        if entry.get("relation") == "adjacent":
            errors.append("conduit_amplifiers must not affect adjacent relation")
        if not isinstance(entry.get("multiplier"), (int, float)) or entry.get("multiplier") <= 1:
            errors.append("conduit_amplifiers multiplier must be greater than 1")

    schema = data.get("gems/gem_instance_schema.toml", {})
    schema_fields = set(schema.get("gem_instance_schema", {}).get("required_fields", []))
    required_instance_fields = {
        "instance_id",
        "base_gem_id",
        "gem_kind",
        "sudoku_digit",
        "gem_type",
        "rarity",
        "level",
        "locked",
        "board_position",
    }
    if not required_instance_fields.issubset(schema_fields):
        errors.append("gem instance schema missing required Phase 2 fields")
    forbidden_instance_fields = {"prefix_affixes", "suffix_affixes", "implicit_affixes", "random_affixes"}
    if forbidden_instance_fields & schema_fields:
        errors.append("gem instance schema must not require random affix fields in Phase 2")
    rarity_counts = schema.get("rarity_affix_counts", {})
    if rarity_counts != REQUIRED_RARITY_COUNTS:
        errors.append("rarity affix counts must be normal=0, magic=1, rare=2")

    affixes = items(data.get("affixes/affix_defs.toml", {}), "affixes")
    affix_ids = unique_ids(affixes, "affixes", errors)
    affix_generations: set[str] = set()
    affix_categories: set[str] = set()
    affix_stats: set[str] = set()
    for affix in affixes:
        context = f"affix_defs:{affix.get('id', '<unknown>')}"
        affix_generations.add(str(affix.get("gen")))
        affix_categories.add(str(affix.get("category")))
        affix_stats.add(str(affix.get("stat")))
        if affix.get("gen") not in REQUIRED_AFFIX_GENERATIONS:
            errors.append(f"{context}: gen must be prefix, suffix, or implicit")
        if affix.get("category") not in REQUIRED_AFFIX_CATEGORIES:
            errors.append(f"{context}: unknown V1 affix category '{affix.get('category')}'")
        if affix.get("stat") not in legal_stat_ids:
            errors.append(f"{context}: unknown stat '{affix.get('stat')}'")
        elif affix.get("stat") in FORBIDDEN_ACTIVE_STAT_IDS:
            errors.append(f"{context}: forbidden stat '{affix.get('stat')}'")
        elif affix.get("stat") not in affix_spawn_enabled_stat_ids:
            errors.append(f"{context}: stat '{affix.get('stat')}' is not enabled for V1 random affix spawning")
        if affix.get("group") not in affix_group_ids:
            errors.append(f"{context}: unknown affix group '{affix.get('group')}'")
        value_range = affix.get("value_range")
        if (
            not isinstance(value_range, list)
            or len(value_range) != 2
            or not all(isinstance(value, (int, float)) for value in value_range)
            or value_range[0] > value_range[1]
        ):
            errors.append(f"{context}: value_range must be [min, max] with min <= max")
        spawn_tags = affix.get("spawn_tags", [])
        if not isinstance(spawn_tags, list) or not spawn_tags:
            errors.append(f"{context}: spawn_tags must be non-empty")
        else:
            check_tags([entry.get("tag") for entry in spawn_tags], tag_ids, context, errors)
            for entry in spawn_tags:
                if not isinstance(entry.get("weight"), int) or entry.get("weight") <= 0:
                    errors.append(f"{context}: spawn tag weights must be positive integers")
        apply_filter = affix.get("apply_filter", {})
        if isinstance(apply_filter, dict):
            check_tags(apply_filter.get("tags_any"), tag_ids, context, errors)
            check_tags(apply_filter.get("tags_all"), tag_ids, context, errors)
            check_tags(apply_filter.get("tags_none"), tag_ids, context, errors)
        require_localization(affix, "affixes", localization, errors)
        require_localized_key(affix, "description_key", "affixes", localization, errors)
    if not REQUIRED_AFFIX_GENERATIONS.issubset(affix_generations):
        errors.append("affixes must cover prefix, suffix, and implicit")
    if not REQUIRED_AFFIX_CATEGORIES.issubset(affix_categories):
        errors.append("affixes must cover all V1 affix categories")
    if not REQUIRED_BOARD_AFFIX_STATS.issubset(affix_stats):
        errors.append("affixes must cover all V1 board affix directions")

    rarity_weights = data.get("loot/drop_weight_rules.toml", {}).get("rarity_weights", {})
    for rarity in REQUIRED_RARITY_COUNTS:
        if rarity not in rarity_weights:
            errors.append(f"drop_weight_rules: missing rarity weight '{rarity}'")
        elif not isinstance(rarity_weights[rarity], int) or rarity_weights[rarity] <= 0:
            errors.append(f"drop_weight_rules: rarity weight '{rarity}' must be positive")

    drop_pool = data.get("loot/gem_drop_pools.toml", {}).get("drop_pool", {})
    if not isinstance(drop_pool, dict):
        errors.append("gem_drop_pools.toml: [drop_pool.*] tables are required")
        drop_pool = {}
    if set(drop_pool) != REQUIRED_LOOT_POOLS:
        errors.append("drop pools must be exactly gem_basic, active_skill_gems, passive_skill_gems, and support_gems")
    for pool_name, pool in drop_pool.items():
        entries = pool.get("entries", []) if isinstance(pool, dict) else []
        if not isinstance(entries, list) or not entries:
            errors.append(f"drop pool '{pool_name}' must have non-empty entries")
            continue
        for entry in entries:
            has_id = isinstance(entry.get("id"), str)
            has_tag = isinstance(entry.get("tag"), str)
            if has_id == has_tag:
                errors.append(f"drop pool '{pool_name}' entries must reference exactly one id or tag")
            if has_id and entry["id"] not in active_gem_ids | passive_gem_ids | support_gem_ids:
                errors.append(f"drop pool '{pool_name}': unknown gem id '{entry['id']}'")
            if has_tag and entry["tag"] not in tag_ids:
                errors.append(f"drop pool '{pool_name}': unknown tag '{entry['tag']}'")
            if not isinstance(entry.get("weight"), int) or entry.get("weight") <= 0:
                errors.append(f"drop pool '{pool_name}' weights must be positive integers")

    return errors


def main() -> int:
    errors = validate()
    if errors:
        print("V1 配置校验失败：")
        for error in errors:
            print(f"- {error}")
        return 1
    print("V1 配置校验通过")
    return 0


if __name__ == "__main__":
    sys.exit(main())
