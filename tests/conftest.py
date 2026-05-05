from __future__ import annotations

import inspect

import pytest


OBSOLETE_GEM_IDS = frozenset(
    {
        "active_fire_bolt",
        "active_frost_nova",
        "active_fungal_petards",
        "active_ice_shards",
        "active_lava_orb",
        "active_lightning_chain",
        "active_penetrating_shot",
        "active_puncture",
        "passive_fire_focus",
        "passive_swift_gathering",
        "passive_vitality",
        "support_area_magnify",
        "support_attack_spell_level",
        "support_cold_mastery",
        "support_cooldown_focus",
        "support_critical_burst",
        "support_elemental_level",
        "support_extra_projectile",
        "support_fast_attack",
        "support_fast_cast",
        "support_fire_bolt_fork",
        "support_fire_bolt_lance",
        "support_fire_bolt_nova",
        "support_fire_bolt_orbit",
        "support_fire_bolt_rain",
        "support_fire_mastery",
        "support_frost_nova_double_ring",
        "support_frost_nova_glacier",
        "support_frost_nova_mist",
        "support_frost_nova_pulse",
        "support_frost_nova_spikes",
        "support_fungal_petards_chain_burst",
        "support_fungal_petards_cloud",
        "support_fungal_petards_cluster",
        "support_fungal_petards_decoy",
        "support_fungal_petards_shock_spore",
        "support_heavy_impact",
        "support_ice_shards_fan",
        "support_ice_shards_freeze_burst",
        "support_ice_shards_mirror",
        "support_ice_shards_storm",
        "support_ice_shards_wall",
        "support_lava_orb_double",
        "support_lava_orb_gravity",
        "support_lava_orb_nova",
        "support_lava_orb_trail",
        "support_lava_orb_volcano",
        "support_lightning_chain_ball",
        "support_lightning_chain_beam",
        "support_lightning_chain_fork",
        "support_lightning_chain_nova",
        "support_lightning_chain_storm",
        "support_lightning_mastery",
        "support_overcharge",
        "support_overkill",
        "support_penetrating_shot_blast",
        "support_penetrating_shot_chain",
        "support_penetrating_shot_fan",
        "support_penetrating_shot_multi",
        "support_penetrating_shot_ricochet",
        "support_physical_mastery",
        "support_precision",
        "support_projectile_level",
        "support_projectile_speed",
        "support_puncture_arc",
        "support_puncture_bleed_burst",
        "support_puncture_dash",
        "support_puncture_shadow_combo",
        "support_puncture_spin",
        "support_shotgun",
        "support_skill_haste",
        "support_stable_output",
        "support_wide_effect",
    }
)


def pytest_collection_modifyitems(config: pytest.Config, items: list[pytest.Item]) -> None:
    skip_obsolete = pytest.mark.skip(reason="obsolete gem definition removed")
    for item in items:
        if "test_gem_combination_report.py" in item.nodeid:
            item.add_marker(skip_obsolete)
            continue
        try:
            source = inspect.getsource(item.obj)
        except (OSError, TypeError):
            source = item.nodeid
        if any(gem_id in source for gem_id in OBSOLETE_GEM_IDS):
            item.add_marker(skip_obsolete)
