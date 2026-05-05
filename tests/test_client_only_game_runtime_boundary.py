from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WEBAPP = ROOT / "webapp"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_playable_webapp_has_no_backend_gameplay_api_calls() -> None:
    forbidden = [
        "/api/map/start",
        "/api/combat/tick",
        "/api/pickup",
        "/api/save/continue",
        "/api/save/restore",
        "requestState",
        "requestRuntimeSkillEvents",
        "runServerCombat",
        "backendCanonical",
        "requestBackendCombatTick",
        "SkillRuntime().execute",
        "CombatSession",
    ]
    for path in WEBAPP.rglob("*"):
        if path.suffix not in {".ts", ".tsx", ".js", ".mjs"}:
            continue
        source = _read(path)
        for token in forbidden:
            assert token not in source, f"{path.relative_to(ROOT)} still contains backend gameplay dependency {token!r}"


def test_frontend_seed_data_contains_effect_baselines() -> None:
    source = _read(WEBAPP / "frontendGameData.ts")

    assert "FRONTEND_INITIAL_APP_STATE" in source
    assert "FRONTEND_SKILL_PREVIEWS_BY_SKILL_TAG" in source
    for preserved_effect_token in [
        "final_damage",
        "actual_interval_ms",
        "final_cooldown_ms",
        "mana_cost",
        "projectile_count",
        "runtime_params",
        "map_progression",
        "equipment_slots",
    ]:
        assert preserved_effect_token in source


def test_client_only_runtime_recalculates_without_backend_adapters() -> None:
    source = _read(WEBAPP / "App.tsx")

    assert "createFrontendInitialAppState" in source
    assert "recalculateFrontendSkillPreview" in source
    assert "applyFrontendState" in source
    assert "createProceduralSpawnPlanEnemies(battleMap" in source
    assert "spawnFrontendDrops(killedEnemies)" in source
    assert "applyFrontendPickup(dropId, current)" in source


def test_frontend_equipment_affix_generation_and_gm_items_are_local() -> None:
    source = _read(WEBAPP / "App.tsx")
    runtime = _read(WEBAPP / "frontendEquipmentRuntime.ts")
    data = _read(WEBAPP / "frontendEquipmentData.json")

    assert "requestGmEquipmentAffixes" in source
    assert "frontendEquipmentAffixOptions" in source
    assert "generateFrontendEquipment" in source
    assert "createSpecifiedFrontendEquipment" in source
    assert "frontendEquipmentStatModifiers" in source
    assert "equipment_rarities" in source
    assert "recalculateFrontendCharacterPanel" in source
    assert "character_panel: recalculateFrontendCharacterPanel(playerStats)" in source
    assert "createFrontendInventoryItem" in source
    assert "createFrontendItemTooltipView" in source
    assert "tooltip_view: createFrontendItemTooltipView" in source
    assert 'loot_kind: "equipment"' in source
    assert 'action === "gm-add-equipment"' in source
    assert 'if (source.includes("盾牌")) return "weapon";' in source
    assert 'if (sourceSlot === "weapon") return isWeaponSlot(slot);' in source
    assert '? WEAPON_SLOT_INDICES' in source
    assert 'setMessage("已添加到物品栏。");\n      onClose();' in source
    assert "craftFrontendEquipmentAffix" in runtime
    assert "prefixSuffixCapacity" in runtime
    assert "applyFrontendEquipmentStatModifiers" in runtime
    assert 'operation.stat === "local_energy_shield"' in runtime
    assert 'baseEnergyShield + localEnergyShield' in runtime
    assert 'modifier.stat === "move_speed"' in runtime
    assert "1 + moveSpeedAddPercent / 100" in runtime
    assert '"definitions":' in data
    assert data.count('"affix_id"') >= 7800


def test_equipped_player_stats_feed_actual_frontend_combat_runtime() -> None:
    source = _read(WEBAPP / "App.tsx")

    assert "const playerStats = applyFrontendEquipmentStatModifiers(baseStats, modifiers)" in source
    assert "player_stats: playerStats" in source
    assert "character_panel: recalculateFrontendCharacterPanel(playerStats)" in source
    assert "resolveMonsterHitAgainstPlayer(enemy, playerBeforeHit, state?.player_stats, blocked)" in source
    assert "regeneratePlayerResources(currentPlayer, state?.player_stats, dt)" in source
    assert "applyFrontendEnergyShieldRecharge(regeneratePlayerResources(currentPlayer, state?.player_stats, dt), dt)" in source
    assert "resetEnergyShieldRechargeDelay(nowMs)" in source
    assert "frontendEnergyShieldRechargePercentPerSecond" in source
    assert "frontendEnergyShieldRechargeDelayMs" in source
    assert "energy_shield_charge_speed_percent" in source
    assert "energy_shield_charge_interval_add_percent" in source
    assert "statNumber(state?.player_stats?.move_speed, PLAYER_SPEED)" in source
    assert "statNumber(stats?.fire_resistance_percent, 0)" in source
    assert "statNumber(playerStats.elemental_resistance_percent, 0)" in source
    assert "statNumber(stats?.armor, 0)" in source
    assert "incoming *= 1 - Math.min(0.9, Math.max(0, resistancePercent) / 100)" in source


def test_frontend_equipment_runtime_consumes_recent_affix_effects() -> None:
    source = _read(WEBAPP / "App.tsx")
    equipment_source = _read(WEBAPP / "frontendEquipmentRuntime.ts")
    level_tables_source = _read(WEBAPP / "frontendSkillLevelTables.ts")

    for token in [
        "applyFrontendEquipmentSkillModifiers",
        "applyFrontendMovementEquipmentEffects",
        "triggerFrontendMovementBarrier",
        "resolveFrontendPlayerBlock",
        "recoverFrontendPlayerOnBlock",
        "recoverFrontendPlayerOnHit",
        "convertIncomingPlayerDamageComponents",
        "playerResistanceCap",
        "doubleDamageEventMultiplier",
        "frontendEquipmentSkillLevelAdd",
        "frontendSkillLevelDamageScale",
        "frontendSkillLevelTableValue",
        "frontendSupportSkillModifiersForTarget",
        "frontendSupportEffectiveLevel",
        "applyPlayerStatusBuffEvent",
        "frontendPlayerStatusPreventionReason",
        "frontendPlayerStatusImmunityStats",
        "avoid_elemental_ailments_percent",
        "immune_trauma",
        "immune_frozen",
        "cull_threshold_percent",
        "frontendSkillDotDamageMultiplier",
        "frontendSkillAilmentDamageMultiplier",
        "dot_damage_add_percent",
        "ailment_damage_deepen_percent",
        "ContinuousAttackRuntime",
        "enqueueFrontendContinuousAttack",
        "processFrontendContinuousAttack",
        "frontendContinuousAttackSkill",
        "continuous_attack_chance_percent",
        "continuous_attack_damage_step_percent",
        "final_damage_components",
        "frontendComponentAdditivePercent",
        "convertFrontendDamageComponents",
        "damagePayloadComponents(skill, Number(skill.final_damage ?? 0), skill.damage_type",
        "scaleFrontendRuntimeDurations",
        "duration_add_percent",
        "movement_skill_cooldown_recovery_add_percent",
        "resistance_penetration_percent",
        "armor_reduction_penetration_percent",
        "enemyResistancePercent",
        "enemyNumericStat",
        "final_damage_components",
        "damagePayloadComponents(skill, amount, damageType, skill.hit as Record<string, unknown>)",
        "floatingTextDamageComponents",
    ]:
        assert token in source
    for token in [
        "active_gem_level_add",
        "attack_skill_level_add",
        "spell_skill_level_add",
        "physical_skill_level_add",
        "fire_skill_level_add",
        "cold_skill_level_add",
        "lightning_skill_level_add",
        "chaos_skill_level_add",
        "support_gem_level_add",
    ]:
        assert token in source
    assert "FRONTEND_SKILL_LEVEL_TABLES" in source
    assert '"active_split_firebolt"' in level_tables_source
    assert '"support_added_fire_damage"' in level_tables_source
    assert '"40"' in level_tables_source
    for conduit_id in ["support_row_conduit", "support_column_conduit", "support_box_conduit"]:
        conduit_table = level_tables_source.split(f'"{conduit_id}"', 1)[1].split("\n  },", 1)[0]
        assert '"5"' in conduit_table
        assert '"6"' not in conduit_table
    assert 'modifier.kind !== "player_stat"' in source
    assert 'modifier.kind !== "player_stat"' in equipment_source


def test_every_seed_skill_family_has_frontend_runtime_branch() -> None:
    app_source = _read(WEBAPP / "App.tsx")
    data_source = _read(WEBAPP / "frontendGameData.ts")
    expected_families = {
        "projectile": "releaseFrontendProjectileSkill",
        "chain": "releaseFrontendChainSkill",
        "player_nova": "releaseFrontendNovaSkill",
        "damage_zone": "releaseFrontendDamageZoneSkill",
        "melee_arc": "releaseFrontendMeleeArcSkill",
        "module_chain": "releaseFrontendChainSkill",
    }

    for family, runtime_function in expected_families.items():
        assert f'"behavior_template": "{family}"' in data_source
        assert runtime_function in app_source

    assert "pendingDamage" in app_source
    assert "processFrontendProjectileImpacts" in app_source
    assert "applyFrontendSkillDamage" in app_source
    assert "applyGuardBuffsToMonsterHit" in app_source
    assert "applyEnemyStatusBuff" in app_source
    assert "applyForcedMovementEvent" in app_source
    assert "spawnFrontendDrops(killedEnemies)" in app_source


def test_frontend_seed_matrix_contains_skill_gem_and_equipment_outputs() -> None:
    source = _read(WEBAPP / "frontendGameData.ts")

    assert source.count('"gem_kind": "active_skill"') >= 16
    assert source.count('"behavior_template":') >= 16
    assert '"equipment_slots"' in source
    assert '"player_stats"' in source
    assert '"map_progression"' in source
    for preserved_runtime_field in [
        "damage_components",
        "damage_conversions",
        "ailments",
        "chain_count",
        "tick_interval_ms",
        "guard_absorb_percent",
        "projectile_speed",
    ]:
        assert preserved_runtime_field in source


def test_frontend_spawn_monster_loot_pickup_and_progress_paths_are_seeded() -> None:
    source = _read(WEBAPP / "App.tsx")

    for token in [
        "createProceduralSpawnPlanEnemies",
        "resolveMonsterHitAgainstPlayer",
        "applyRuntimeMonsterAttacks",
        "damageEventAmountAgainstEnemy",
        "spawnFrontendDrops(killedEnemies)",
        "createFrontendDrop",
        "createFrontendInventoryItem",
        "applyFrontendPickup",
        "target_stage_id",
        "entry_count: stage.entry_count + 1",
    ]:
        assert token in source


def test_frontend_save_has_version_and_chinese_recovery_messages() -> None:
    source = _read(WEBAPP / "App.tsx")

    assert "FRONTEND_SAVE_VERSION" in source
    assert "loadFrontendAutosaveResult" in source
    assert "本地存档格式无效，已恢复新游戏。" in source
    assert "本地存档版本不兼容，已恢复新游戏。" in source
    assert "本地存档读取失败，已恢复新游戏。" in source
