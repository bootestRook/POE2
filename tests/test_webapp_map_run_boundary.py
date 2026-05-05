from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def _app_source() -> str:
    return (ROOT / "webapp" / "App.tsx").read_text(encoding="utf-8")


def _server_source() -> str:
    return (ROOT / "tools" / "webapp_server.py").read_text(encoding="utf-8")


def test_playable_map_run_stays_frontend_owned() -> None:
    source = _app_source()
    start_game_body = source.split("function startGame", 1)[1].split("async function openSkillEditorPanel", 1)[0]

    assert "const spawnPlan = createProceduralSpawnPlanEnemies(battleMap" in start_game_body
    assert "setEnemies(spawnPlan.enemies)" in start_game_body
    assert "setAuthoredSpawnPlanActive(true)" in start_game_body
    assert "setAuthoredAggroSources(spawnPlan.aggroSources)" in start_game_body
    assert "spawnFrontendDrops(killedEnemies)" in source
    assert "processFrontendProjectileImpacts(dt)" in source
    assert "applyFrontendPickup(dropId, current)" in source
    assert 'requestState("/api/map/start"' not in source
    assert 'requestState("/api/combat/tick"' not in source
    assert 'requestState("/api/pickup"' not in source
    assert 'window.localStorage.setItem(FRONTEND_AUTOSAVE_STORAGE_KEY' in source
    assert 'requestState("/api/save/continue"' not in source
    assert 'requestState("/api/save/restore", { save })' not in source


def test_webapp_runner_does_not_enable_backend_autosave_file_storage() -> None:
    source = _server_source()

    assert "V1WebAppApi(ROOT / \"configs\", autosave_enabled=False)" in source


def test_playable_map_run_keeps_frontend_real_combat_calculation() -> None:
    source = _app_source()
    step_game_body = source.split("function stepGame", 1)[1].split("function recordRuntimePerf", 1)[0]
    consume_skill_event_body = source.split("function consumeSkillEventBatch", 1)[1].split("function applyEnemyBuffApplyEvent", 1)[0]

    assert "backendCanonicalMapRunActive" not in step_game_body
    assert "if (!skillEditorMode)" in step_game_body
    assert "requestBackendCombatTick" not in source
    assert "advanceEnemyBuffs(dt);" in step_game_body
    assert "processFrontendProjectileImpacts(dt)" in step_game_body
    assert "return projectileImpactEvents + activeDamageZoneEvents + consumeScheduledSkillEvents(dt);" in step_game_body
    assert "activeDamageZoneTickEvents" not in source
    assert "playerAttachedAreaDamageEvents" not in consume_skill_event_body
    assert "orbitHitTargets" not in consume_skill_event_body
    assert "damageEvents.push({" not in consume_skill_event_body


def test_frontend_loot_is_not_guaranteed_for_every_normal_kill() -> None:
    source = _app_source()

    assert "function frontendMonsterDropChance" in source
    assert "stage.base_drop_chance + (enemy.boss ? 0.35 : 0)" not in source
    assert '"base_drop_chance": 1.0' not in (ROOT / "webapp" / "frontendGameData.ts").read_text(encoding="utf-8")


def test_frontend_equipment_drop_level_rolls_inside_stage_map_level_range() -> None:
    source = _app_source()
    create_drop_body = source.split("function createFrontendDrop", 1)[1].split("function spawnFrontendDrops", 1)[0]

    assert "function frontendRandomMapLevel" in source
    assert "stage.map_level_min" in source
    assert "stage.map_level_max" in source
    assert "const equipmentLevel = frontendRandomMapLevel(stage, enemy, index + 83)" in create_drop_body
    assert "generateFrontendEquipment(equipmentSource, equipmentLevel, equipmentRarity, seed)" in create_drop_body
    assert 'level: lootKind === "equipment" ? equipmentLevel : level' in create_drop_body
    assert "generateFrontendEquipment(equipmentSource, stage.monster_level" not in create_drop_body
    assert 'level: lootKind === "equipment" ? stage.monster_level : level' not in create_drop_body


def test_frontend_equipment_rarity_uses_weights_with_normal_as_largest_share() -> None:
    source = _app_source()
    rarity_body = source.split("function frontendEquipmentDropRarity", 1)[1].split("function createFrontendDrop", 1)[0]
    create_drop_body = source.split("function createFrontendDrop", 1)[1].split("function spawnFrontendDrops", 1)[0]
    frontend_data = (ROOT / "webapp" / "frontendGameData.ts").read_text(encoding="utf-8")

    assert "stage.equipment_rarity_weights" in rarity_body
    assert 'if (enemy.boss) return "purple"' in rarity_body
    assert "kindRoll > 0.88" not in create_drop_body
    assert "kindRoll > 0.62" not in create_drop_body
    assert "frontendEquipmentDropRarity(stage, enemy" in create_drop_body
    assert '"white": 340' in frontend_data
    assert '"blue": 330' in frontend_data


def test_frontend_drop_kind_weights_are_equipment_first_with_rare_gems() -> None:
    source = _app_source()
    create_drop_body = source.split("function createFrontendDrop", 1)[1].split("function spawnFrontendDrops", 1)[0]

    assert "const FRONTEND_EQUIPMENT_DROP_KIND_CHANCE = 0.75" in source
    assert "const FRONTEND_MAP_ENTRY_DROP_KIND_CHANCE = 0.20" in source
    assert "const FRONTEND_GEM_DROP_KIND_CHANCE = 0.05" in source
    assert "const gemDropThreshold = 1 - FRONTEND_GEM_DROP_KIND_CHANCE" in create_drop_body
    assert "kindRoll < gemDropThreshold" in create_drop_body
    assert "kindRoll >= gemDropThreshold" in create_drop_body
    assert "kindRoll < 0.16" not in create_drop_body
    assert "kindRoll < 0.48" not in create_drop_body


def test_frontend_map_entry_can_drop_current_stage_except_first_stage() -> None:
    source = _app_source()
    target_body = source.split("function frontendMapEntryTargetStage", 1)[1].split("function frontendGemDropWeight", 1)[0]

    assert "...(stage.order > 1 ? [stage] : [])" in target_body
    assert "candidate.order === stage.order + 1" in target_body


def test_frontend_gem_drop_penalizes_active_skill_and_sudoku_nine() -> None:
    source = _app_source()
    gem_weight_body = source.split("function frontendGemDropWeight", 1)[1].split("function chooseFrontendGemDropOption", 1)[0]

    assert "if (Number(gem.sudoku_digit) === 9) return weight * 0.35" in gem_weight_body
    assert 'if (gem.kind === "active_skill") return weight * 0.35' in gem_weight_body
    assert 'if (gem.kind === "active_skill") weight *= 0.35' not in gem_weight_body
    assert "chooseFrontendGemDropOption(gemOptions, enemy, index + 41)" in source


def test_frontend_skill_preview_recalculates_template_damage_for_gem_level() -> None:
    source = _app_source()
    recalculate_body = source.split("function recalculateFrontendSkillPreview", 1)[1].split("function frontendSupportSkillModifiersForTarget", 1)[0]
    level_adapter_body = source.split("function frontendSkillPreviewForGemLevel", 1)[1].split("function frontendSkillClampedLevel", 1)[0]

    assert "frontendSkillPreviewForGemLevel(cloneFrontendData(template), fullGem)" in recalculate_body
    assert "const levelValues = frontendSkillLevelTableValues(skill, targetLevel)" in level_adapter_body
    assert "frontendLevelValueNumber(levelValues, \"base_damage\"" in level_adapter_body
    assert "targetLevel = frontendSkillClampedLevel" in level_adapter_body
    assert "damageScale = currentBaseDamage > 0 && targetBaseDamage > 0" in level_adapter_body
    assert "frontendLevelDamageComponents(levelValues, \"hit_damage_component_\")" in level_adapter_body
    assert "scaleFrontendSkillHitDamage(secondary, hitConfigScale, levelValues)" in level_adapter_body
    assert "applyFrontendModuleLevelValues(nextRuntimeParams.modules, levelValues)" in level_adapter_body
    assert "targetLevel === templateLevel" not in level_adapter_body
    assert "base_gem_level: targetLevel" in level_adapter_body
    assert "effective_gem_level: targetLevel" in level_adapter_body

def test_frontend_gem_drop_pool_is_not_seed_inventory() -> None:
    source = _app_source()
    options_body = source.split("async function requestGmOptions", 1)[1].split("async function requestGmEquipmentAffixes", 1)[0]
    pickup_body = source.split("function createFrontendInventoryItem", 1)[1].split("function applyFrontendPickup", 1)[0]
    drop_pool_source = (ROOT / "webapp" / "frontendGemDropData.ts").read_text(encoding="utf-8")

    assert "FRONTEND_GEM_DROP_POOL" in options_body
    assert "FRONTEND_INITIAL_APP_STATE.inventory" not in options_body
    assert "FRONTEND_GEM_DROP_POOL" in pickup_body
    assert '"sudoku_digit": 9' in drop_pool_source
    assert '"gem_type_9"' in drop_pool_source
    assert drop_pool_source.count('"base_gem_id"') >= 60
