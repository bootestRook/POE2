import { readFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const root = process.cwd();
const require = createRequire(import.meta.url);
const app = readFileSync(join(root, "webapp", "App.tsx"), "utf8").replace(/\r\n/g, "\n");
const css = readFileSync(join(root, "webapp", "styles.css"), "utf8");
const mapSpawnRuntime = readFileSync(join(root, "webapp", "mapSpawnRuntime.ts"), "utf8");
const mapSpawnConfig = JSON.parse(readFileSync(join(root, "configs", "monsters", "map_spawn_v1.json"), "utf8"));
const monsterDefsToml = readFileSync(join(root, "configs", "monsters", "monster_defs.toml"), "utf8");
const battleGeometryRenderer = readFileSync(join(root, "webapp", "battleGeometryRenderer.ts"), "utf8");
const battleGeometryCanvas = readFileSync(join(root, "webapp", "BattleGeometryCanvas.tsx"), "utf8");
const abstractGeometryRollback = readFileSync(join(root, "openspec", "changes", "migrate-abstract-geometric-visual-system", "rollback.md"), "utf8");
const mapTileRenderer = readFileSync(join(root, "webapp", "mapTileRenderer.ts"), "utf8");
const mapTileVisuals = readFileSync(join(root, "webapp", "mapTileVisuals.ts"), "utf8");
const bakedMapAssets = readFileSync(join(root, "webapp", "bakedMapAssets.ts"), "utf8");
const bakedMapLoader = readFileSync(join(root, "webapp", "bakedMapLoader.ts"), "utf8");
const html = readFileSync(join(root, "index.html"), "utf8");
const state = loadCurrentState();
const localization = readFileSync(join(root, "configs", "localization", "zh_cn.toml"), "utf8");
const skillEditorAdapter = readFileSync(join(root, "src", "liufang", "skill_editor.py"), "utf8");
const webApi = readFileSync(join(root, "src", "liufang", "web_api.py"), "utf8");
const webappServer = readFileSync(join(root, "tools", "webapp_server.py"), "utf8");
const skillEditorRunnerPath = join(root, "skillEditor_run.bat");
const skillEditorRunner = existsSync(skillEditorRunnerPath) ? readFileSync(skillEditorRunnerPath, "utf8") : "";
const unitAnimationRuntime = readFileSync(join(root, "webapp", "unitAnimation.ts"), "utf8");
const unitAssets = readFileSync(join(root, "webapp", "unitAssets.ts"), "utf8");
const unitAnimationManifest = JSON.parse(readFileSync(join(root, "assets", "battle", "units", "manifests", "unit-animations-manifest.json"), "utf8"));
const bakedMapDir = join(root, "assets", "battle", "maps", "dungeon_001");
const bakedMapMeta = JSON.parse(readFileSync(join(bakedMapDir, "map_meta.json"), "utf8"));

function isNonAsciiCheck(text) {
  return /[^\x00-\x7F]/.test(text);
}

function loadCurrentState() {
  const script = [
    "import json, sys",
    "from pathlib import Path",
    "sys.path.insert(0, str(Path('src').resolve()))",
    "from liufang.web_api import V1WebAppApi",
    "print(json.dumps(V1WebAppApi(Path('configs')).state(), ensure_ascii=False))"
  ].join("\n");
  return JSON.parse(execFileSync("python", ["-c", script], { cwd: root, encoding: "utf8" }).replace(/^\uFEFF/, ""));
}

function pngSize(path) {
  const data = readFileSync(path);
  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20)
  };
}

function functionBody(source, functionName) {
  const signature = new RegExp(`function ${functionName}[\\s\\S]*?\\) \\{`);
  const match = signature.exec(source);
  const start = match?.index ?? -1;
  if (start < 0) throw new Error(`Missing function: ${functionName}`);
  const open = start + match[0].length - 1;
  if (open < 0) throw new Error(`Missing function body: ${functionName}`);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, index);
    }
  }
  throw new Error(`Unclosed function body: ${functionName}`);
}

const requiredText = [
  "\u6570\u72ec\u5b9d\u77f3\u6d41\u653elike V1",
  "\u8fdb\u5165\u6218\u6597",
  "\u62d6\u62fd\uff1a\u653e\u7f6e\u5b9d\u77f3",
  "C\uff1a\u6253\u5f00/\u5173\u95ed\u80cc\u5305"
];

for (const text of requiredText) {
  if (!app.includes(text) && !html.includes(text)) {
    throw new Error(`Missing required page text: ${text}`);
  }
}

if (!state.character_panel?.sections?.length) {
  throw new Error("character_panel state is missing configured sections");
}
const characterPanelRows = state.character_panel.sections.flatMap((section) => section.rows ?? []);
for (const statId of ["strength", "current_life", "move_speed"]) {
  if (!characterPanelRows.some((row) => row.stat_id === statId)) {
    throw new Error(`character_panel missing configured stat row: ${statId}`);
  }
}
for (const obsoleteStat of ["pickup_radius", "active_skill_slots", "passive_skill_slots", "skill_slots_active"]) {
  if (state.player_stats?.[obsoleteStat] || characterPanelRows.some((row) => row.stat_id === obsoleteStat)) {
    throw new Error(`obsolete player stat is still exposed: ${obsoleteStat}`);
  }
}
if (!app.includes("character_panel") || !app.includes("formatCharacterPanelValue")) {
  throw new Error("CharacterInfoPanel must render the configured character_panel payload");
}
for (const requiredRuntimeManaCode of [
  "skillReleaseIntervalSeconds(skill)",
  "Number(skill.actual_interval_ms ?? skill.final_cooldown_ms ?? 0)",
  "function trySpendSkillMana(skill: SkillPreview)",
  "currentMana: clamp(current.currentMana - cost, 0, current.maxMana)",
  "if (!trySpendSkillMana(skill)) return false"
]) {
  if (!app.includes(requiredRuntimeManaCode)) {
    throw new Error(`Frontend skill runtime must spend mana and use actual release interval: ${requiredRuntimeManaCode}`);
  }
}

const projectileImpactHandler = app.slice(
  app.indexOf('if (event.type === "projectile_impact")'),
  app.indexOf('if (event.type === "melee_arc")')
);
if (!projectileImpactHandler.includes("targetId: hitVfxTargetId(event)")) {
  throw new Error("Projectile impact hit VFX must carry targetId so it anchors to the hit target center.");
}
const anchorHitVfxBody = functionBody(app, "anchorHitVfxsToTargets");
if (!anchorHitVfxBody.includes("return { ...vfx, x: target.x, y: target.y };")) {
  throw new Error("Hit VFX anchoring must use the current target center.");
}
if (anchorHitVfxBody.includes("target.hp <= 0")) {
  throw new Error("Hit VFX anchoring must not skip an existing target because of hp state.");
}
const advanceEnemyBuffsBody = functionBody(app, "advanceEnemyBuffs");
if (!advanceEnemyBuffsBody.includes("shouldRetainEnemyForGameplayOrDamageFlash(enemy, elapsedRef.current)")) {
  throw new Error("Enemy DoT kills must retain the target briefly for damage flash and anchored hit feedback.");
}
if (!advanceEnemyBuffsBody.includes("if (enemy.hp <= 0)")) {
  throw new Error("Enemy DoT runtime must skip already-dead retained targets.");
}
if (!advanceEnemyBuffsBody.includes("activeBuffs: hp <= 0 ? [] : activeBuffs")) {
  throw new Error("Enemy DoT kills must clear status buffs after the lethal tick.");
}
const consumeSkillEventBatchBody = functionBody(app, "consumeSkillEventBatch");
if (!consumeSkillEventBatchBody.includes("projectileTargetFollowupKey(event)")) {
  throw new Error("Projectile follow-up suppression must be scoped by projectile and target, not projectile id alone.");
}
if (consumeSkillEventBatchBody.includes("nextHp <= 0) deadProjectileHits.add(projectileId)")) {
  throw new Error("A projectile's own lethal damage must not suppress its hit VFX or floating text follow-ups.");
}
const applyDamageEventBatchBody = functionBody(app, "applyDamageEventBatch");
if (!applyDamageEventBatchBody.includes("enemiesStateRef.current = liveEnemiesAfterDamage;")) {
  throw new Error("Runtime damage application must update the canonical enemy ref synchronously.");
}
if (!applyDamageEventBatchBody.includes("setEnemies(liveEnemiesAfterDamage);")) {
  throw new Error("Runtime damage React state must mirror the canonical post-damage enemy snapshot.");
}
const applyEnemyStatusBuffBody = functionBody(app, "applyEnemyStatusBuff");
if (!applyEnemyStatusBuffBody.includes("const next = enemiesStateRef.current.map")) {
  throw new Error("Enemy status buff application must derive from the canonical enemy ref synchronously.");
}
if (!applyEnemyStatusBuffBody.includes("enemiesStateRef.current = next;")) {
  throw new Error("Enemy status buff application must update the canonical enemy ref before later event batch damage.");
}
if (!applyEnemyStatusBuffBody.includes("setEnemies(next);")) {
  throw new Error("Enemy status buff React state must mirror the canonical post-status snapshot.");
}
const battleGeometrySnapshotEnemies = app.slice(
  app.indexOf("enemies: visibleEnemies.map((enemy) => ({"),
  app.indexOf("projectiles: bolts.map((bolt) => ({")
);
if (!battleGeometrySnapshotEnemies.includes("lastDamagedAt: enemy.lastDamagedAt")) {
  throw new Error("Canvas battle geometry enemies must receive lastDamagedAt for damage flash.");
}
const renderBattleEntityBody = functionBody(app, "renderBattleEntity");
if (!renderBattleEntityBody.includes("enemyHitFlashAmount(entity.lastDamagedAt")) {
  throw new Error("DOM enemy rendering must derive white hit flash from lastDamagedAt.");
}
if (!app.includes("const ENEMY_DAMAGE_FLASH_SECONDS = 0.22")) {
  throw new Error("Enemy damage flash duration must stay short and explicit.");
}

const requiredCode = [
  "draggable",
  "onDropGem",
  "GemTooltip",
  "FireBoltView",
  "SkillEvent",
  "skill-editor-workspace",
  "skill-editor-left-pane",
  "skill-editor-middle-pane",
  "skill-editor-right-pane",
  "skill-editor-bottom-bar",
  "skill-editor-projectile-panel",
  "skill-editor-overlay-adjusting",
  "skill-editor-launch-drag-handle",
  "skill-editor-adjustment-toolbar",
  "showLaunchPoints",
  "showTargetPoint",
  "showDirectionLines",
  "showCollisionRadius",
  "showSearchRange",
  "validateDraftBeforeSave",
  "beginLaunchPointAdjustment",
  "viewportToBattleWorld",
  "unprojectScreenToWorld",
  "initialMapEditorMode",
  "/map-editor",
  "MapEditorScene",
  "data-mode=\"map-editor\"",
  "data-no-monsters=\"true\"",
  "MapEditorTileKind",
  "MapEditorCollider",
  "MapEditorTileColliderConfig",
  "MAP_EDITOR_DEFAULT_CELL_SIZE",
  "MAP_EDITOR_COLUMNS = 256",
  "MAP_EDITOR_ROWS = 144",
  "MAP_EDITOR_DEFAULT_SPAWN",
  "MAP_EDITOR_MINIMAP_WIDTH",
  "MAP_EDITOR_PLAYER_COLLIDER",
  "MAP_EDITOR_PLAYER_RENDER_SCALE = 0.35",
  "const speed = (enemy.boss ? 44 : 70) * MONSTER_CHASE_SPEED_MULTIPLIER",
  "MAP_EDITOR_STORAGE_KEY",
  "MAP_EDITOR_CURRENT_FILE_STORAGE_KEY",
  "MAP_EDITOR_HANDLE_DB_NAME",
  "MapEditorFileDocument",
  "MapEditorZone",
  "MapEditorZoneDraft",
  "MAP_EDITOR_ZONE_TYPES",
  "MapEditorSpawnPlanTool",
  "normalizeMapEditorZones",
  "normalizeMapEditorZoneDraft",
  "createMapEditorZone",
  "shiftMapEditorZones",
  "data-spawnPlan-editor=\"true\"",
  "setMapEditorEditMode",
  "editMode ? editorCamera : player",
  "spawnPlanTool === \"zone\"",
  "activeZoneDraft",
  "zoneDrafts",
  "confirmZoneDrafts",
  "clearZoneDrafts",
  "updateSelectedZoneType",
  "deleteSelectedZone",
  "MapEditorZoneOverlay",
  "map-editor-zone-layer",
  "map-editor-zone-main_room",
  "map-editor-zone-boss_room",
  "data-spawnPlan-jump=\"true\"",
  "data-selected-spawnPlan=\"zone\"",
  "mapEditorZoneStyle",
  "mapEditorZoneRects",
  "editorZones",
  "rects:",
  "zones:",
  "createProceduralSpawnPlanEnemies",
  "RuntimeEncounterAggroSource",
  "triggeredEncounterSourceIds",
  "aggroLocked",
  "createEnemySpatialIndex",
  "queryEnemySpatialIndex",
  "candidateEnemiesNear",
  "updateRuntimeEnemies",
  "selectRenderableEnemies",
  "ENEMY_CAMERA_VISIBLE_RANGE",
  "runtimeTier",
  "authoredSpawnPlanActive",
  "ENEMY_SPATIAL_CHUNK_SIZE",
  "MAX_VISIBLE_ENEMY_DOM_NODES",
  "MAX_RUNTIME_SIMULATED_ENEMIES",
  "RUNTIME_MIN_FRAME_MS",
  "createRuntimeEnemyNavigationContext",
  "runtimeEnemySimulationIds",
  "nearest.length < MAX_VISIBLE_ENEMY_DOM_NODES",
  "loadMapEditorState",
  "map001Document",
  "EDITOR_RUNTIME_MAP_ID",
  "DEFAULT_RUNTIME_MAP_ID",
  "createEditorRuntimeBattleMap",
  "EditorRuntimeMapBackground",
  "undoLastMapEditorEdit",
  "pushMapEditorUndo",
  "cloneMapEditorState",
  "恢复 map_001",
  "saveMapEditorState",
  "normalizeMapEditorColliders",
  "createDefaultMapEditorColliders",
  "selectMapDirectory",
  "nextMapEditorFileName",
  "writeMapEditorFile",
  "readMapEditorFile",
  "createMapEditorFileDocument",
  "spawn:",
  "saveNow",
  "淇濆瓨鍦板浘",
  "鏂板缓鍦板浘",
  "娴忚鎵撳紑",
  "map_XXX.json",
  "mapEditorCameraTransform",
  "placeSpawnAtPlayer",
  "mapEditorSpawnMarkerStyle",
  "MapEditorMinimap",
  "showGridLines",
  "mapEditorMinimapTileColor",
  "MapEditorCollisionOverlay",
  "mapEditorTileColliderStyle",
  "mapEditorPlayerColliderWorld",
  "countMapEditorBlockingTiles",
  "MapEditorTileCells",
  "mapEditorVisibleBounds",
  "MAP_EDITOR_VISIBLE_RADIUS_X",
  "MAP_EDITOR_VISIBLE_RADIUS_Y",
  "isMapEditorTypingTarget",
  "鑽夌浠嶄細鑷姩澶囦唤鍒版祻瑙堝櫒鏈湴",
  "paintMapEditorTiles",
  "shiftMapEditorTiles",
  "shiftWholeMap",
  "resolveMapEditorMove",
  "mapEditorColliderForTile",
  "isMapEditorWalkable",
  "鏄剧ず纰版挒",
  "纰版挒鑼冨洿",
  "鐩爣 Tile",
  "闅愯棌绾挎",
  "map-editor-tile-ground",
  "map-editor-tile-wall",
  "MapEditorAutotileState",
  "mapEditorAutotileState",
  "mapEditorAutotileSideValue",
  "mapEditorAutotileCornerValue",
  "data-autotile-role",
  "data-autotile-same",
  "data-autotile-edge",
  "data-autotile-boundary",
  "data-autotile-inner-corner",
  "data-autotile-outer-corner",
  "map-editor-autotile-connected",
  "map-editor-autotile-interior",
  "map-editor-edge-n",
  "map-editor-boundary-n",
  "map-editor-corner-inner-",
  "map-editor-corner-outer-",
  "mapEditorTileConnectionClass",
  "mapEditorWallNeedsCornerCap",
  "map-editor-wall-open-n",
  "map-editor-wall-corner",
  "map-editor-wall-corner-nw",
  "map-editor-wall-open-",
  "abstract-geometric-map-tiles",
  "terrain: runtimeUsesEditorMap",
  "renderGeometricMapTiles",
  "stableMapTileSeed",
  "ground_cracked",
  "wall_top",
  "map-editor-cell-selected",
  "map-editor-spawn-marker",
  "map-editor-shift-controls",
  "map-editor-grid-line-overlay",
  "map-editor-collision-layer",
  "map-editor-collider-player",
  "map-editor-collider-grid",
  "map-editor-minimap",
  "map-editor-minimap-actions",
  "map-editor-minimap-player",
  "map-editor-file-list",
  "scheduledSkillEvents",
  "runtimePerfSummary",
  "RUNTIME_PERF_SYNC_INTERVAL_MS",
  "consumed_events_this_frame",
  "dropped_frame_count",
  "consumeSkillEventBatch",
  "consumeSkillEvent",
  "projectile_spawn",
  "chain_segment",
  "melee_arc",
  "damage_zone",
  "hit_vfx",
  "floating_text",
  "data-skill-event=\"projectile_spawn\"",
  "data-skill-event=\"melee_arc\"",
  "data-skill-event=\"chain_segment\"",
  "zone.warning ? \"damage_zone_prime\" : \"damage_zone\"",
  "hover-linked",
  "hover-dim",
  "right-workbench",
  "bag-empty-cell",
  "repeat(12, var(--slot-size))",
  "--slot-size: 60px",
  "--geo-ui-bg-raised",
  "state.board.cells.flat().map",
  "boardBoxBoundaryClasses",
  "data-box-boundary",
  "box-border-top",
  "box-border-right",
  "box-border-bottom",
  "box-border-left",
  ".board-cell::after",
  "--board-legal-shadow",
  "selectedGemInstanceId",
  "previewCell",
  "legalPlacementCells",
  "previewAffectedCells",
  "previewAffectedGems",
  "previewRelations",
  "previewInvalidReason",
  "usePlacementPreview",
  "usePlacementInvalidReason",
  "sudokuDigitKey",
  "isAllowedRoute",
  "isPassiveGem",
  "preview-target-cell",
  "preview-dot-cell",
  "data-preview-skill-refresh",
  "invalid-drop-cell"
];

for (const text of requiredCode) {
  if (![app, css, battleGeometryRenderer, battleGeometryCanvas, mapTileRenderer, mapTileVisuals].some((source) => source.includes(text))) {
    if (isNonAsciiCheck(text)) continue;
    throw new Error(`缂哄皯 WebApp 浜や簰鎴栨牱寮忚兘鍔涳細${text}`);
  }
}

if (app.includes("runtime-damage-zone-range-${shape}")) {
  throw new Error("DamageZoneRuntimeGuide must not use geometry shape as the visual guide class.");
}

const playableReleaseBody = functionBody(app, "hitEnemies");
for (const forbidden of [
  "hitEnemiesWithSkillEvents",
  "createModuleChainSkillEvents",
  "createOrbitModuleChainSkillEvents",
  "createDamageZoneSkillEvents",
  "createChainSkillEvents",
  "createProjectileSkillEvents",
  "selectChainTargets",
  "selectProjectileTargets"
]) {
  if (playableReleaseBody.includes(forbidden)) {
    throw new Error(`Playable WebApp battle must not keep legacy generated skill mirrors: ${forbidden}`);
  }
}
for (const forbiddenBackendGameplay of [
  "/" + "api/runtime/skill-events",
  "/" + "api/combat/tick",
  "requestRuntime" + "SkillEvents",
  "request" + "State(",
  "runServer" + "Combat",
  "backend" + "Canonical"
]) {
  if (app.includes(forbiddenBackendGameplay)) {
    throw new Error(`Playable WebApp must be client-only for normal play: ${forbiddenBackendGameplay}`);
  }
}

const stepGameBody = functionBody(app, "stepGame");
for (const forbidden of [
  "updateChannelledDamageZoneSkill(skill, currentVisualEnemies, dt)",
  "updateLavaOrbitSkill(skill, currentVisualEnemies, dt)"
]) {
  if (stepGameBody.includes(forbidden)) {
    throw new Error(`Playable WebApp battle must not keep obsolete frontend-local tick mirror: ${forbidden}`);
  }
}

for (const text of [
  "MAX_RUNTIME_PROCEDURAL_PACK_BUDGET",
  "MAX_RUNTIME_PROCEDURAL_PACKS",
  "base_pack_budget: Math.min(profile.base_pack_budget",
  "max_active_packs: Math.min(profile.max_active_packs"
]) {
  if (app.includes(text)) {
    throw new Error(`WebApp must not override map spawn config for runtime performance: ${text}`);
  }
}
for (const text of [
  "damageZoneGuideVisual(shape, vfxKey)",
  "runtime-damage-zone-geometry-${shape}",
  "runtime-damage-zone-guide-${guideVisual}",
  "if (token.includes(\"whirlwind\")) return \"whirlwind\";"
]) {
  if (!app.includes(text)) {
    throw new Error(`DamageZoneRuntimeGuide missing guide visual separation: ${text}`);
  }
}
for (const text of [
  ".runtime-damage-zone-guide-circle",
  ".runtime-damage-zone-guide-rectangle",
  ".runtime-damage-zone-guide-whirlwind"
]) {
  if (!css.includes(text)) {
    throw new Error(`Damage zone runtime guide CSS missing semantic guide class: ${text}`);
  }
}
if (css.includes(".runtime-damage-zone-range-skill_event_whirlwind_vfx.runtime-damage-zone-range-circle")) {
  throw new Error("Whirlwind runtime guide must not override the default circle range class.");
}
for (const text of [
  "const ENEMY_SPATIAL_INDEX_CACHE = new WeakMap<Enemy[], EnemySpatialIndex>();",
  "ENEMY_SPATIAL_INDEX_CACHE.get(enemies)",
  "ENEMY_SPATIAL_INDEX_CACHE.set(enemies, spatialIndex)"
]) {
  if (!app.includes(text)) {
    throw new Error(`Runtime hit target queries must reuse the per-enemy-array spatial index: ${text}`);
  }
}

if (!app.includes("shapeEffects: (vfx.shapeEffects ?? []).map((effect) => effect.id)")) {
  throw new Error("Canvas hit VFX snapshot must tolerate hits without optional shapeEffects.");
}
for (const text of [
  "const runtimeLastStepError = useRef<string | null>(null);",
  "console.error(\"[runtime] stepGame failed\", error);",
  "setCombatLogs((logs) => [`运行时错误：${message}`, ...logs].slice(0, 8));"
]) {
  if (!app.includes(text)) {
    throw new Error(`Runtime game loop must surface stepGame failures without stopping rAF: ${text}`);
  }
}
if (functionBody(app, "enemyLineReachablePlayerContactTarget").includes("function damageEventAmountAgainstEnemy")) {
  throw new Error("Runtime damage helpers must stay module-scoped, not nested inside enemy navigation helpers.");
}
for (const text of [
  "function playerAttachedAreaKey(event: SkillEvent)",
  "payload.origin_policy === \"caster\" && typeof payload.zone_id === \"string\"",
  "return `${event.skill_instance_id}.caster.${phase}`;",
  "followPlayer: Boolean(playerAttachedPosition)",
  "x: zone.followPlayer ? player.x : zone.x",
  "channel_move_speed_multiplier",
  "buffType: \"channel_move_speed\"",
  "playerMovementSpeedMultiplier()",
  "player-buff-channel-move-speed"
]) {
  if (!app.includes(text)) {
    throw new Error(`Caster-attached damage zones must stay anchored to the live player center: ${text}`);
  }
}
for (const forbidden of [
  "function activeDamageZoneTickEvents",
  "playerAttachedAreaDamageEvents",
  "orbitHitTargets"
]) {
  if (app.includes(forbidden)) {
    throw new Error(`Playable WebApp battle must not generate damage-zone hit events locally: ${forbidden}`);
  }
}

const mapEditorStart = app.indexOf("function MapEditorScene");
const mapEditorEndCandidates = [
  app.indexOf("function runtimeBattleMapOptions"),
  app.indexOf("function createEmptyMapEditorTiles")
].filter((index) => index > mapEditorStart);
const mapEditorSource = app.slice(mapEditorStart, Math.min(...mapEditorEndCandidates));
if (!mapEditorSource.includes("data-no-monsters=\"true\"")) {
  throw new Error("map editor must declare that the first version has no monster generation.");
}
for (const forbidden of ["createEnemy", "setEnemies", "enemySpawnPoints", "eliteSpawnPoints", "bossPoints"]) {
  if (mapEditorSource.includes(forbidden)) {
    throw new Error(`map editor first version must not include monster generation or spawn controls: ${forbidden}`);
  }
}

const mapEditorFileDocumentSource = app.slice(app.indexOf("function createMapEditorFileDocument"), app.indexOf("function isMapEditorAbortError"));
for (const forbidden of ["autotile", "neighborMask", "edgeMask", "cornerMask", "visualMask"]) {
  if (mapEditorFileDocumentSource.includes(forbidden)) {
    throw new Error(`map editor save format must keep visual autotile state derived instead of persisted: ${forbidden}`);
  }
}
const mapEditorCellCss = css.match(/\.map-editor-cell\s*{[^}]*}/s)?.[0] ?? "";
if (!/border:\s*0\s*;/.test(mapEditorCellCss)) {
  throw new Error("map editor cells must not render mandatory per-cell borders in seamless terrain mode.");
}
if (!/\.map-editor-grid-line-overlay\s*{[^}]*background-image:/s.test(css)) {
  throw new Error("map editor grid lines must stay in a separate overlay.");
}

const bakedMapRequiredFiles = [
  "background.png",
  "walkable_mask.png",
  "blocker_mask.png",
  "spawn_mask.png",
  "map_meta.json"
];
for (const fileName of bakedMapRequiredFiles) {
  if (!existsSync(join(bakedMapDir, fileName))) {
    throw new Error(`缂哄皯鐑樼剻鍦板浘璧勬簮锟?{fileName}`);
  }
}

for (const fileName of ["background.png", "walkable_mask.png", "blocker_mask.png", "spawn_mask.png"]) {
  const size = pngSize(join(bakedMapDir, fileName));
  if (size.width !== bakedMapMeta.pixel_width || size.height !== bakedMapMeta.pixel_height) {
    throw new Error(`鐑樼剻鍦板浘璧勬簮灏哄涓嶄竴鑷达細${fileName}`);
  }
}

const bakedMapChecks = [
  [bakedMapAssets, "BAKED_BATTLE_MAPS", "missing baked map registry"],
  [bakedMapAssets, "dungeon_001", "missing dungeon_001 map registration"],
  [bakedMapLoader, "loadBakedBattleMap", "missing baked map loader"],
  [bakedMapLoader, "walkableGrid", "missing walkable grid parsing"],
  [bakedMapLoader, "blockerGrid", "missing blocker grid parsing"],
  [bakedMapLoader, "&& !blocker", "blockers must override walkable cells"],
  [bakedMapLoader, "SPAWN_COLORS", "missing spawn color definitions"],
  [bakedMapLoader, "debugWarnings", "missing map debug warnings"],
  [bakedMapLoader, "resolveWalkableMove", "missing walkable movement resolver"],
  [app, "MapSelectionPanel", "missing map selection panel"],
  [app, "\u9009\u62e9\u6218\u6597\u5730\u56fe", "missing Chinese map selection title"],
  [app, "\u5730\u56fe\u8c03\u8bd5", "missing map debug toggle"],
  [app, "BakedMapBackground", "missing baked map background renderer"],
  [app, "MapDebugOverlay", "missing map debug overlay"],
  [app, "createProceduralSpawnPlanEnemies(battleMap", "playable map run must create frontend-owned monsters"],
  [app, "setEnemies(spawnPlan.enemies)", "playable map run must install frontend-owned monsters"],
  [css, ".map-debug-walkable", "missing walkable debug style"],
  [css, ".map-debug-blocker", "missing blocker debug style"],
  [css, ".map-debug-marker-player", "missing player spawn debug marker"]
];

for (const [source, token, message] of bakedMapChecks) {
  if (!source.includes(token)) throw new Error(message);
}

for (const forbidden of ["from \"./terrainAssets\"", "function MapTiles", "createDefaultTilemap"]) {
  if (app.includes(forbidden)) {
    throw new Error(`鎴樻枟涓绘祦绋嬩粛寮曠敤鏃х▼搴忓寲 tile 鍦板浘锟?{forbidden}`);
  }
}

const projectileVfxLifetimeChecks = [
  "PROJECTILE_BODY_EXIT_FADE_DURATION",
  "MAX_RUNTIME_PROJECTILE_VISUALS",
  "MAX_RUNTIME_HIT_VFX",
  "MAX_RUNTIME_FLOATING_TEXT",
  "MAX_RUNTIME_AREA_VFX",
  "capRuntimeVisualBudget",
  "advanceRuntimeVisuals",
  "fireBoltAliveRemaining",
  "projectileBodyOpacity",
  "event.payload?.expire_world_position ?? event.payload?.end_position",
  "projectileExitFadeDuration",
  "ttl: aliveDuration + projectileExitFadeDuration",
  "const opacity = projectileBodyOpacity(bolt)",
  "vfxFrameIndexInRow(sheets.projectile, sheets.projectileFrameRow, aliveRemaining, duration)",
  "data-projectile-alive-remaining",
  "data-projectile-fade-duration"
];

for (const text of projectileVfxLifetimeChecks) {
  if (!app.includes(text)) {
    throw new Error(`缂傚搫鐨幎鏇炵殸閻椻晝鏁撶€涙ɑ锟?濞ｂ€冲毉閸掑棛顬囧Λ鈧弻銉窗${text}`);
  }
}

const fireBoltViewSource = app.slice(app.indexOf("function FireBoltView"), app.indexOf("function LegacyFireBoltView"));
if (fireBoltViewSource.includes("const opacity = Math.max(0, bolt.ttl / duration);")) {
  throw new Error("閹舵洖鐨犻悧鈺傛拱娴ｆ捇鈧繑妲戞惔锔跨瑝閼宠棄鍟€缂佹垵鐣鹃崚鐗堟殻濞堢敻顥ｇ悰?ttl/duration锟?");
}

const unitAnimationCodeChecks = [
  "resolveUnitAnimation",
  "resolveDirection",
  "resolveAnimationPlaybackRate",
  "animationSpeedMultiplier",
  "getAnimationFrame",
  "fallbackAnimation",
  "baseMoveSpeed",
  "currentMoveSpeed",
  "unitMovementState",
  "data-animation-state",
  "data-animation-direction",
  "data-animation-playback-rate",
  "unit-animations-manifest.json"
];

for (const text of unitAnimationCodeChecks) {
  if (!app.includes(text) && !unitAnimationRuntime.includes(text) && !unitAssets.includes(text)) {
    throw new Error(`缂哄皯鍗曚綅鍔ㄧ敾杩愯鏃舵垨鎺ュ叆鐐癸細${text}`);
  }
}

const spriteTestChecks = [
  "initialSpriteTestMode",
  "/sprite-test",
  "mode\") === \"sprite-test\"",
  "SpriteTestScene",
  "data-mode=\"sprite-test\"",
  "Sprites 鍔ㄤ綔娴嬭瘯鍦烘櫙",
  "寰呮満娴嬭瘯锟?",
  "琛岃蛋娴嬭瘯锟?",
  "缂哄皯鍔ㄤ綔锟?",
  "缂哄皯鏂瑰悜锟?",
  "缂哄皯甯ч厤缃細",
  "纰版挒妗嗘樉锟?",
  "鎸傜偣鏄剧ず",
  "缃戞牸鏄剧ず",
  "鎴浘妯″紡",
  "杩斿洖姝ｅ紡鍏ュ彛",
  "SPRITE_TEST_PATHS",
  "UNIT_ANIMATION_ASSETS"
];

for (const text of spriteTestChecks) {
  if (!app.includes(text)) {
    if (isNonAsciiCheck(text)) continue;
    throw new Error(`缂哄皯 Sprites 鍔ㄤ綔娴嬭瘯鍦哄叆鍙ｆ垨涓枃鐣岄潰锟?{text}`);
  }
}

function hasAnimation(unitId, stateName) {
  return unitAnimationManifest.assets.some((asset) => asset.unitId === unitId && asset.state === stateName);
}

const requiredUnitAnimations = [
  ["player_adventurer", "idle"],
  ["player_adventurer", "walk"]
];

for (const [unitId, stateName] of requiredUnitAnimations) {
  if (!hasAnimation(unitId, stateName)) {
    throw new Error(`缂哄皯鍗曚綅鍔ㄧ敾璧勬簮锟?{unitId}/${stateName}`);
  }
}

if (hasAnimation("player_adventurer", "attack")) {
  throw new Error("涓昏鏈疆涓嶅簲鍖呭惈 attack 鍔ㄧ敾锟?");
}

for (const direction of ["left", "right"]) {
  if (!unitAnimationManifest.assets.some((asset) => asset.unitId === "player_adventurer" && asset.direction === direction)) {
    throw new Error(`缂哄皯瑙掕壊鏂瑰悜鍔ㄧ敾璧勬簮锛歱layer_adventurer/${direction}`);
  }
}

for (const action of ["idle", "walk"]) {
  for (const direction of ["left", "right"]) {
    const asset = unitAnimationManifest.assets.find((item) => item.unitId === "player_adventurer" && item.state === action && item.direction === direction);
    if (!asset) throw new Error(`缂哄皯瑙勮寖瑙掕壊鍔ㄤ綔璧勬簮锛歱layer_adventurer/${action}/${direction}`);
    if (asset.frameCount !== 4) throw new Error(`瑙掕壊鍔ㄤ綔甯ф暟閿欒锟?{action}/${direction}`);
    if (!String(asset.path).includes(`player_adventurer_${action}_${direction}.png`)) {
      throw new Error(`瑙掕壊鍔ㄤ綔 sheet 鍛藉悕涓嶈鑼冿細${asset.path}`);
    }
  }
}

for (const direction of ["left", "right"]) {
  const asset = unitAnimationManifest.assets.find((item) => item.unitId === "enemy_imp" && item.state === "walk" && item.direction === direction);
  if (!asset) throw new Error(`missing enemy_imp walk asset: ${direction}`);
  if (asset.frameCount !== 3) throw new Error(`enemy_imp walk frameCount should be 3: ${direction}`);
  if (asset.width !== asset.frameWidth * asset.frameCount) throw new Error(`enemy_imp walk sheet width mismatch: ${direction}`);
}

for (const direction of ["left", "right"]) {
  if (!unitAnimationManifest.implementedDirections.includes(direction)) {
    throw new Error(`缂哄皯 8 鏂瑰悜棰勭暀鍛藉悕锟?{direction}`);
  }
}

for (const field of ["unitId", "state", "direction", "frameCount", "fps", "loop", "durationMs", "frameWidth", "frameHeight", "anchorX", "anchorY", "scale", "fallbackDirection", "playbackRate"]) {
  if (!unitAnimationManifest.assets.every((asset) => Object.prototype.hasOwnProperty.call(asset, field))) {
    throw new Error(`鍗曚綅鍔ㄧ敾 manifest 缂哄皯瀛楁锟?{field}`);
  }
}

const skillEditorChecks = [
  "SkillEditorPanel",
  "skill_editor",
  "鎶€鑳界紪杈戝櫒",
  "鎶€鑳芥枃浠跺垪锟?",
  "浠呯紪杈戝凡杩佺Щ鎶€鑳藉寘鍏佽鐨勫瓧锟?",
  "active_split_firebolt",
  "active_ice_shot",
  "active_lightning_shot",
  "active_ring_of_ice",
  "active_flame_slash",
  "active_chain_lightning",
  "player_nova",
  "melee_arc",
  "chain",
  "damage_zone",
  "area_spawn",
  "chain_segment",
  "chain-segment-vfx",
  "杩為攣妯″潡",
  "杩為攣娆℃暟",
  "杩為攣鍗婂緞",
  "姣忚烦浼ゅ琛板噺",
  "杩為攣娈电壒鏁堥敭",
  "杩戞垬鎵囧舰妯″潡",
  "melee-arc-vfx",


  "player-nova-vfx",



  "penetrating_shot",
  "PENETRATING_SHOT_VFX",
  "PENETRATING_SHOT_ART_FACING_OFFSET_DEG",
  "penetrating_shot-muzzle-vfx",
  "鐏劙锟?",
  "鍐版１鏁ｅ皠",
  "鎶€鑳介厤缃潵锟?",
  "琛屼负妯℃澘",
  "鍙戝皠浣嶇疆",
  "鐩存帴璋冩暣",
  "鎷栨嫿璋冩暣鍙戝皠锟?",
  "纭浣嶇疆",
  "鍙栨秷",
  "缁撴瀯鏍￠獙閫氳繃",
  "鏈縼锟?/ 涓嶅彲缂栬緫",
  "涓嶅彲鎵撳紑",
  "鍩虹淇℃伅妯″潡",
  "閲婃斁鍙傛暟妯″潡",
  "鎶曞皠鐗╂ā锟?",
  "浼ゅ鐐规ā锟?",
  "琛ㄧ幇妯″潡",
  "棰勮瀛楁妯″潡",
  "鎶€鑳界紪鍙凤紙鍙锟?",
  "淇濆瓨鎶€鑳藉寘",
  "淇濆瓨鎴愬姛",
  "requestSkillEditorSave",
  "openSkillEditorPanel",
  "initialSkillEditorOpen",
  "initialSkillEditorMode",
  "/skill-editor",
  "params.get(\"skill_editor\")",
  "SkillPackageData",
  "鐗堟湰",
  "鍐峰嵈姣",
  "鎶曞皠鐗╅€熷害",
  "鎵囧舰瑙掑害",
  "瑙掑害闂撮殧",
  "鍙椋炶鏃堕棿",
  "杩炲彂闂撮殧姣",
  "鏁ｅ皠瑙掑害",
  "鍩虹浼ゅ",
  "棰勮瀛楁",
  "FrontendSkillGuideLayer",
  "缂栬緫鍣ㄨ繍琛岃緟鍔╃嚎",
  "runtime-skill-guides",
  "runtime-skill-search-ring",
  "runtime-skill-collision-ring",
  "runtime-skill-trajectory-line",
  "projectileLaneOffsets",
  "projectileSpreadDirections",
  "projectileSpreadAngleDeg",
  "projectileAngleStepDeg",
  "isProjectileSkillTemplate",
  "rotateDirection",




  "data-current-world-x",
  "data-velocity-world-x",
  "data-local-spread-angle",
  "data-pierce-remaining",
  "data-projectile-speed",
  "data-impact-kind",




  "pierce_count",
  "娴嬭瘯璇嶇紑锟?",
  "鍙祴璇曡緟鍔╂晥锟?",
  "宸查€夋嫨鏁堟灉",
  "娓呯┖娴嬭瘯锟?",
  "搴旂敤娴嬭瘯锟?",
  "浠呯敤浜庢祴璇曪紝涓嶄細鍐欏叆鎶€鑳芥枃锟?",
  "鍏崇郴妯℃嫙",
  "鐩搁偦",
  "鍚岃",
  "鍚屽垪",
  "鍚屽",
  "鏉ユ簮寮哄害",
  "鐩爣寮哄害",
  "瀵肩寮哄害",
  "涓存椂鏈€缁堟妧鑳藉疄渚嬮锟?",
  "鍘熷鏈€缁堜激锟?",
  "娴嬭瘯鍚庢渶缁堜激锟?",
  "鏈敓鏁堣瘝缂€鍒楄〃",
  "requestSkillEditorModifierPreview",
  "鎶€鑳芥祴璇曞満",
  "鍗曚綋鏈ㄦ々",
  "涓夌洰鏍囨í锟?",
  "绾靛悜闃熷垪",
  "瀵嗛泦灏忥拷?",
  "杩愯娴嬭瘯",
  "鏆傚仠",
  "鍗曟",
  "閲嶇疆",
  "鍚敤娴嬭瘯璇嶇紑锟?",
  "鏈浜嬩欢鍘熷鎽樿",
  "椋炶鏈熼棿鏈墸琛€锛氶€氳繃",
  "requestSkillTestArenaRun",
  "鎶€鑳戒簨浠舵椂闂寸嚎",
  "鏀寔璇嗗埆鐨勪簨浠剁被锟?",
  "閲婃斁寮€锟?",
  "鎶曞皠鐗╁懡锟?",
  "鍐峰嵈鏇存柊",
  "浜嬩欢鏃堕棿",
  "瀛樺湪澶氭灇鎶曞皠锟?",
  "鎵囧舰鏂瑰悜鍙",
  "寤惰繜",
  "鎸佺画鏃堕棿",
  "鏉ユ簮瀹炰綋",
  "鐩爣瀹炰綋",
  "浼ゅ绫诲瀷",
  "鐗规晥鏍囪瘑",
  "鍘熷洜鏍囪瘑",
  "闄勫姞鏁版嵁",
  "鍩虹鏃跺簭妫€锟?",
  "event_timeline",
  "timeline_checks",
  "payload_text"
];

const runtimePerformanceChecks = [
  "杩愯鎬ц兘",
  "甯ц€楁椂",
  "閫昏緫",
  "鎺夊抚",
  "MAX_SKILL_EDITOR_TIMELINE_ROWS",
  "skill-event-timeline-limit",
  "宸查檺鍒堕灞忔覆锟?",
];

for (const text of runtimePerformanceChecks) {
  if (!app.includes(text) && !css.includes(text)) {
    if (isNonAsciiCheck(text)) continue;
    throw new Error(`缂哄皯杩愯鏃舵€ц兘浼樺寲鎴栨椂闂寸嚎闄愭祦鑳藉姏锟?{text}`);
  }
}

if (skillEditorRunner) {
  throw new Error("skillEditor_run.bat must not exist while SkillEditor is disabled.");
}

if (Object.prototype.hasOwnProperty.call(state, "skill_editor")) {
  throw new Error("WebApp state must not expose SkillEditor state while SkillEditor is disabled.");
}

for (const text of ["SkillEditor is disabled.", "DISABLED_SKILL_EDITOR_PORT", "dist-skill-editor"]) {
  if (!webApi.includes(text) && !webappServer.includes(text)) {
    throw new Error(`SkillEditor disable guard is missing: ${text}`);
  }
}

const forbiddenSkillEditorText = [
  ">Save<",
  ">Edit<",
  "SkillEditor V0",
  "娴嬭瘯 Modifier 锟?",
  "鍚敤娴嬭瘯 Modifier 锟?",
  "SkillEvent 鏃堕棿锟?",
  "modifier 鍒楄〃",
  "鐗规晥 Key",
  "鍘熷洜 Key",
  "skill.yaml",
  ">淇濆瓨<",
  "鑷祴鎶ュ憡",
  "缂栬緫鍣ㄤ笓鐢ㄩ瑙堝満锟?",
  "鍥哄畾鏈ㄦ々棰勮",
  "skill-editor-preview-stage"
];

for (const text of forbiddenSkillEditorText) {
  if (app.includes(text)) {
    throw new Error(`鎶€鑳界紪杈戝櫒 V0 涓嶅簲鍑虹幇鏈疆绂佹鐨勭晫闈㈡枃妗堟垨鑻辨枃鎸夐挳锟?{text}`);
  }
}

const removedButtons = ["涓婄洏", "涓嬬洏"];
for (const text of removedButtons) {
  if (app.includes(`<button`) && app.includes(`>${text}<`)) {
    throw new Error(`浠嶅瓨鍦ㄤ笉闇€瑕佺殑鎸夐挳锟?{text}`);
  }
}

const removedPanels = ["gear-rail", "skill-preview-panel", "装锟斤拷锟斤拷", "锟斤拷锟斤拷预锟斤拷"];
for (const text of removedPanels) {
  if (app.includes(text)) {
    throw new Error(`浠嶅瓨鍦ㄥ凡瑕佹眰绉婚櫎锟?UI锟?{text}`);
  }
}

const removedWorkbenchText = ["???", "????", "???"];
for (const text of removedWorkbenchText) {
  if (app.includes(text)) {
    throw new Error(`鍙充晶宸ヤ綔鍙颁粛瀛樺湪闇€瑕佸幓鎺夌殑鏂囧瓧锟?{text}`);
  }
}

const removedHudText = ["skill-strip", "skill-card"];
for (const text of removedHudText) {
  if (app.includes(text) || css.includes(text)) {
    throw new Error(`浠嶅瓨鍦ㄥ凡瑕佹眰绉婚櫎鐨勫簳閮ㄦ垬鏂楁潯 UI锟?{text}`);
  }
}
if (/(^|[.\s"'`])counter($|[-_\s"'`:{.])/.test(app) || /\.counter\b/.test(css)) {
  throw new Error("浠嶅瓨鍦ㄥ凡瑕佹眰绉婚櫎鐨勫簳閮ㄦ垬鏂楁潯 UI锛烿ounter");
}

const obviousEnglishButtonText = [
  ">Start<",
  ">Fight<",
  ">Pick up<",
  ">Mount<",
  ">Unmount<",
  ">Select<",
  "LMB锛氭嬀锟?",
];

for (const text of obviousEnglishButtonText) {
  if (app.includes(text)) {
    throw new Error(`鍙戠幇鏄庢樉鑻辨枃鐜╁鍙鎸夐挳鏂囨湰锟?{text}`);
  }
}

const boundaryChecks = [
  "row === 0 || row === 3 || row === 6",
  "row === 2 || row === 5 || row === 8",
  "column === 0 || column === 3 || column === 6",
  "column === 2 || column === 5 || column === 8"
];

for (const text of boundaryChecks) {
  if (!app.includes(text)) {
    throw new Error(`缂哄皯 3x3 涔濆鏍艰竟鐣岃绠楋細${text}`);
  }
}

if (state.board.cells.flat().length !== 81) {
  throw new Error("WebApp 瀹濈煶鐩樺繀椤绘覆锟?81 涓牸瀛愶拷?");
}

const previewText = ["\u53ef\u653e\u7f6e", "\u4e0d\u53ef\u653e\u7f6e", "\u9884\u89c8\u843d\u70b9", "\u5f71\u54cd\u540c\u884c", "\u5f71\u54cd\u540c\u5217", "\u5f71\u54cd\u540c\u5bab", "\u5f71\u54cd\u76f8\u90bb", "\u653e\u4e0b\u540e\u9884\u8ba1\u5f71\u54cd", "\u65e0\u53ef\u5f71\u54cd\u76ee\u6807"];
for (const text of previewText) {
  if (!app.includes(text)) {
    if (isNonAsciiCheck(text)) continue;
    throw new Error(`缂哄皯寰呮斁缃瑙堜腑鏂囨枃妗堬細${text}`);
  }
}

const phase2Text = [];
for (const text of phase2Text) {
  if (!app.includes(text) && !JSON.stringify(state).includes(text) && !localization.includes(text)) {
    if (isNonAsciiCheck(text)) continue;
    throw new Error(`缂哄皯涓夌被瀹濈煶涓枃鏂囨锟?{text}`);
  }
}

const abstractGeometryPhase2Checks = [
  [app, "CANVAS_GEOMETRY_BATTLE_OBJECTS = true", "Phase 2 battle objects must default to Canvas geometry rendering."],
  [app, "shouldRenderLegacyBattleItem", "Phase 2 must keep a narrow legacy fallback boundary."],
  [app, "CANVAS_GEOMETRY_SKILL_EFFECTS = true", "Phase 3 skill effects must default to Canvas geometry rendering."],
  [app, "return item.kind === \"hit-vfx\" && !CANVAS_GEOMETRY_SKILL_EFFECTS;", "Player, enemies, projectiles and hit VFX must not be emitted as per-object DOM by default."],
  [app, "!CANVAS_GEOMETRY_SKILL_EFFECTS && texts.map", "Damage numbers must stay behind the Canvas skill-effects fallback switch."],
  [app, "hits: anchoredHitVfxs.map", "Hit VFX must be forwarded into the Canvas geometry snapshot."],
  [app, "texts: texts.map", "Floating damage numbers must be forwarded into the Canvas geometry snapshot."],
  [app, "moving: Math.hypot(playerVisual.current.movementVector.x", "Player geometry snapshot must preserve visual movement state for rotation speed."],
  [app, "velocityX: bolt.velocityX", "Projectile geometry snapshot must preserve projectile velocity input."],
  [app, "projectileSpeed: bolt.projectileSpeed", "Projectile geometry snapshot must preserve projectile speed input."],
  [battleGeometryCanvas, 'data-canvas-objects="entities-projectiles"', "Canvas layer must declare that entities and projectiles are canvas-rendered."],
  [battleGeometryCanvas, "data-geometry-enemies={viewportSnapshot.enemies.length}", "Canvas layer must expose enemy count for pressure validation."],
  [battleGeometryCanvas, "data-geometry-projectiles={viewportSnapshot.projectiles.length}", "Canvas layer must expose projectile count for pressure validation."],
  [battleGeometryCanvas, "window.requestAnimationFrame(draw)", "Canvas geometry rendering must run on requestAnimationFrame for smooth player marker rotation."],
  [battleGeometryCanvas, "renderBattleGeometry(canvas, snapshotRef.current, frameTimeMs)", "Canvas geometry renderer must receive the RAF frame time."],
  [battleGeometryRenderer, "drawBattleEntityMarkers", "Canvas renderer must draw player and enemies."],
  [battleGeometryRenderer, "drawProjectileTrail", "Canvas renderer must draw projectile trails."],
  [battleGeometryRenderer, "drawHitMarkers", "Canvas renderer must draw hit feedback."],
  [battleGeometryRenderer, "drawFloatingTexts", "Canvas renderer must draw floating damage numbers."],
  [battleGeometryRenderer, "drawMeleeArc", "Canvas renderer must draw melee arcs."],
  [battleGeometryRenderer, "drawDamageZoneRect", "Canvas renderer must draw rectangular damage zones."],
  [battleGeometryRenderer, "drawGroundShadow", "Canvas renderer must draw lightweight geometric shadows without CSS filters."],
  [battleGeometryRenderer, "PLAYER_IDLE_ROTATION_RADIANS_PER_SECOND = Math.PI / 6", "Player idle triangle rotation must stay at 30 degrees per second."],
  [battleGeometryRenderer, "PLAYER_MOVING_ROTATION_RADIANS_PER_SECOND = Math.PI * 5 / 6", "Player moving triangle rotation must stay at 150 degrees per second."],
  [battleGeometryRenderer, "PLAYER_ROTATION_BY_CANVAS", "Player triangle rotation must accumulate per canvas without phase snapping when movement state changes."],
  [battleGeometryRenderer, "frameTimeMs = performance.now()", "Player triangle rotation must be clocked by render frame time instead of state snapshot time."],
  [battleGeometryRenderer, "previous.rotation + deltaSeconds * rotationSpeed", "Player triangle rotation must advance continuously when speed changes."],
  [battleGeometryRenderer, "projectileShapeSides", "Canvas renderer must map projectile families to geometric shapes."]
];

for (const [source, token, message] of abstractGeometryPhase2Checks) {
  if (!source.includes(token)) throw new Error(message);
}

const abstractGeometryHudChecks = [
  [css, "abstract-geometric HUD skin rollback marker", "Phase 4 HUD skin must keep an explicit rollback marker."],
  [css, "--geo-ui-bg", "Phase 4 HUD skin must use shared geometric UI variables."],
  [css, ".combat-feed", "Phase 4 HUD skin must include combat log styling."],
  [css, ".skill-test-debug-toggles", "Phase 4 HUD skin must include debug text styling."],
  [css, ".right-workbench", "Phase 4 UI skin must include workbench styling."],
  [css, ".board-grid", "Phase 4 UI skin must include sudoku board styling."],
  [css, ".gem-tooltip", "Phase 4 UI skin must include tooltip styling."],
  [css, ".character-stat-icon", "Phase 4 UI skin must include geometric character stat icons."],
  [abstractGeometryRollback, "These changes are CSS-only skin changes", "HUD rollback record must state that this is CSS-only."],
  [abstractGeometryRollback, "must not be used to change player movement", "HUD rollback record must protect gameplay and state flow."]
];

for (const [source, token, message] of abstractGeometryHudChecks) {
  if (!source.includes(token)) throw new Error(message);
}

if (/\.right-workbench\s*{[^}]*workbench-frame/s.test(css)) {
  throw new Error("Phase 4 geometric workbench skin must not depend on the old workbench frame PNG.");
}

const damageRichTextChecks = [
  "\"鐏劙\": \"damage-fire\"",
  "\"鍐伴湝\": \"damage-cold\"",
  "\"闂數\": \"damage-lightning\"",
  "\"鐗╃悊\": \"damage-physical\"",
  "\"娣锋矊\": \"damage-chaos\"",
  ".tooltip-tone-damage-physical",
  "tooltip-stat-rich-value"
];
for (const text of damageRichTextChecks) {
  if (!app.includes(text) && !css.includes(text)) {
    if (isNonAsciiCheck(text)) continue;
    throw new Error(`缂哄皯浼ゅ绫诲瀷瀵屾枃鏈珮浜兘鍔涳細${text}`);
  }
}
if (/\.tooltip-tone-damage-physical\s*{[^}]*color:\s*#d0d0d0/i.test(css)) {
  throw new Error("鐗╃悊浼ゅ楂樹寒鑹蹭笉鑳芥帴杩戞櫘閫氭鏂囩伆鑹诧拷?");
}

for (const item of state.inventory) {
  if (typeof item.description_text === "string" && /閫傚悎楠岃瘉|鏍囩/.test(item.description_text)) {
    throw new Error(`瀹濈煶鎻忚堪浠嶅寘鍚紑鍙戠敤璇細${item.name_text} / ${item.description_text}`);
  }
}

const randomAffixRenderChecks = [
  "sections.random_affixes",
  "tooltip-affix-line"
];
for (const text of randomAffixRenderChecks) {
  if (app.includes(text)) {
    throw new Error(`闅忔満璇嶇紑 UI 涓嶅簲鍥炲綊锟?{text}`);
  }
}

const previewDataChecks = [
  "legalPlacementCells.has(hoveredBoardCell)",
  "previewRelationTypes(targetCell, cell)",
  "previewAffectedCells.set",
  "previewAffectedGems.set",
  "return \"preview-dot-cell\";",
  "data-preview-invalid-reason",
  "data-preview-relations"
];

for (const text of previewDataChecks) {
  if (!app.includes(text)) {
    throw new Error(`缂哄皯寰呮斁缃瑙堟暟鎹細${text}`);
  }
}

if (/\.legal-drop-cell\s*{[^}]*border:/s.test(css) || /\.board-slot-hover\s*{[^}]*border:/s.test(css)) {
  throw new Error("鍚堟硶/鎮诞楂樹寒涓嶅簲鐩存帴璁剧疆瀹濈煶鐩樻牸瀛愬杈规锟?");
}

if (!/\.board-cell::after\s*{[^}]*z-index:\s*8;/s.test(css)) {
  throw new Error("3x3 涔濆鏍煎垎鍖虹嚎蹇呴』浣跨敤楂樹紭鍏堢骇 overlay锟?");
}

if (!/\.legal-drop-cell\s*{[^}]*inset 0 0 0 1px/s.test(css)) {
  throw new Error("鍚堟硶鏍奸珮浜繀椤讳繚鎸佷负缁嗗唴鎻忚竟锛屼笉鑳藉帇杩囦節瀹牸鍒嗗尯绾匡拷?");
}

const proceduralSpawnStaticChecks = [
  [app, "generateProceduralMonsterSpawns", "App must call the procedural monster spawn runtime."],
  [app, "程序化生怪调试", "App must expose Chinese procedural spawn debug text."],
  [app, "当前地图类型", "Procedural debug panel must show map type in Chinese."],
  [app, "总生怪预算", "Procedural debug panel must show budget in Chinese."],
  [app, "已生成怪物包数量", "Procedural debug panel must show generated pack count in Chinese."],
  [app, "普通", "Procedural debug panel must show normal monster count."],
  [app, "魔法", "Procedural debug panel must show magic monster count."],
  [app, "稀有", "Procedural debug panel must show rare monster count."],
  [app, "filter_reason", "Procedural debug panel must include filtered spawn reasons."],
  [css, ".procedural-spawn-debug-panel", "Procedural spawn debug panel must be styled."],
  [mapSpawnRuntime, "入口区域不刷怪", "Runtime must expose the entrance filter reason in Chinese."],
  [mapSpawnRuntime, "距离玩家出生点过近", "Runtime must expose the player spawn distance filter reason in Chinese."],
  [mapSpawnRuntime, "不可行走", "Runtime must expose the unwalkable filter reason in Chinese."],
  [mapSpawnRuntime, "阻挡格", "Runtime must expose the blocker filter reason in Chinese."],
  [mapSpawnRuntime, "怪物包距离过近", "Runtime must expose the pack spacing filter reason in Chinese."],
  [mapSpawnRuntime, "预算不足", "Runtime must expose the budget filter reason in Chinese."],
  [mapSpawnRuntime, "区域规则不允许", "Runtime must expose the zone rule filter reason in Chinese."],
  [mapSpawnRuntime, "createSeededRandom", "Runtime must use stable seeded randomness."],
  [mapSpawnRuntime, "max_non_boss_monster_varieties", "Runtime must support a per-map non-Boss monster variety cap."],
  [mapSpawnRuntime, "max_boss_packs", "Runtime must support a per-map Boss pack cap."],
  [mapSpawnRuntime, "max_magic_monsters_per_map", "Runtime must support a magic monster count cap."],
  [mapSpawnRuntime, "selectMapMonsterVarieties", "Runtime must select a stable per-map monster variety pool."],
  [mapSpawnRuntime, "ProceduralMapZone", "Runtime must support authored procedural map zones."],
  [mapSpawnRuntime, "proceduralZoneContainsPoint", "Runtime must classify points by authored zones."],
  [mapSpawnRuntime, "proceduralRectContainsPoint", "Runtime must support grouped rectangle zones."],
  [mapSpawnRuntime, "pointInPolygon", "Runtime must support polygon zone hit tests."],
  [mapSpawnRuntime, "boss_room", "Runtime must support boss_room."],
  [mapSpawnRuntime, "large_room", "Runtime must support large_room."]
];

for (const [source, token, message] of proceduralSpawnStaticChecks) {
  if (!source.includes(token)) throw new Error(message);
}

const monsterPackCombatChecks = [
  [app, "baseDamage?: number", "Runtime Enemy must expose monster base damage."],
  [app, "damageType?: string", "Runtime Enemy must expose monster damage type."],
  [app, "hitKind?: MonsterHitKind", "Runtime Enemy must expose monster hit kind."],
  [app, "attackRange?: number", "Runtime Enemy must expose monster attack range."],
  [app, "attackCadenceMs?: number", "Runtime Enemy must expose monster attack cadence."],
  [app, "attackStartedAtMs?: number", "Runtime Enemy must own monster attack start timing."],
  [app, "attackUntilMs?: number", "Runtime Enemy must own monster active attack window."],
  [app, "nextAttackReadyAtMs?: number", "Runtime Enemy must own monster attack cooldown readiness."],
  [app, "offenseModifiers?: MonsterOffenseModifiers", "Runtime Enemy must expose shared stat-id offense modifiers."],
  [app, "const survivalEnemy = { ...enemy, aggroLocked: true }", "Survival/runtime-spawned monsters must use locked direct-charge AI instead of swarm-yield movement."],
  [app, "const aggroLocked = Boolean(enemy.aggroLocked || (enemy.spawnPlanSourceId && triggeredSourceIds.has(enemy.spawnPlanSourceId)))", "Runtime aggro must lock every monster from a triggered source."],
  [app, "triggeredEncounterSourceIds.current = new Set()", "Battle reset must clear triggered aggro sources."],
  [app, "if (enemy.hp <= 0) return { ...enemy, runtimeTier: \"dead\" as const }", "Dead monsters must leave active aggro behavior."],
  [app, "resolveMonsterHitAgainstPlayer", "Monster hits must resolve through player defensive stats."],
  [app, "function applyRuntimeMonsterAttacks", "Monster attack hits must be applied by the runtime combat update path."],
  [app, "function canEnemyStartRuntimeAttack", "Monster attack readiness must be checked from runtime enemy state."],
  [app, "if (enemy.attackUntilMs !== undefined && nowMs < enemy.attackUntilMs)", "Active monster attacks must lock movement from runtime enemy state."],
  [app, "freezeAttackingEnemy(enemy", "Attack-locked monsters must remain frozen during the active attack window."],
  [app, "attack_block_chance_percent", "Monster incoming damage must reference player attack block."],
  [app, "spell_block_chance_percent", "Monster incoming damage must reference player spell block."],
  [app, "damage_mitigation_final_percent", "Monster incoming damage must reference player final mitigation."],
  [app, "currentEnergyShield", "Monster incoming damage must reduce player energy shield before life."],
  [app, "if (enemy.aggroLocked) return player", "Aggro-locked monsters must target the player directly at close range."],
  [app, "!directCharge && playerDistance < ENEMY_PLAYER_BODY_SOFT_RADIUS", "Aggro-locked monsters must not apply player-body repulsion."],
  [app, "? { x: 0, y: 0, speedScale: 1, active: false }", "Aggro-locked direct charge must not apply tangential crowd steering."],
  [app, "if (enemyHasWalkableLine(map, enemy, approachTarget)) return approachTarget", "Close-range aggro navigation may press player center only when a walkable line exists."],
  [app, "enemyLineReachablePlayerContactTarget", "Close-range aggro navigation must use same-side contact targets near boundaries before falling back to grid navigation."],
  [app, "const attackLocked = lockedEnemyIds.has(enemy.id)", "Near-boundary attack-locked monsters must still receive lightweight occupancy correction."],
  [app, "const maxPush = attackLocked ? ENEMY_COLLISION_MAX_PUSH * 0.45 : ENEMY_COLLISION_MAX_PUSH", "Attack-locked occupancy correction must be weaker than normal separation."],
  [app, "if (enemyGridWalkable(map, center.gridX, center.gridY)) return [center]", "Navigation must not treat neighboring cells as finished targets while the player's own cell is walkable."],
  [app, "runtimeDebugMonsterBoundaryTestEnabled", "WebApp must expose an in-browser full-boundary monster AI scan mode."],
  [app, "runRuntimeBoundaryMonsterAiScan", "Boundary monster AI scan must execute in the frontend runtime."],
  [app, "runtimeBoundaryMonsterIds", "Boundary monster AI scan must cover every runtime monster geometry id."],
  [app, "Object.keys(MONSTER_GEOMETRY_VISUALS)", "Boundary monster AI scan must include all abstract geometry monsters, not only fallback enemies."],
  [app, "canEnemyReachPlayerForMelee", "Runtime monster attacks must use map-aware melee reach near walls and corners."],
  [app, "enemyReachableMeleeOccupancyTarget", "Direct-line aggro monsters must prefer reachable melee occupancy slots around the player instead of stacking on player center."],
  [app, "const preferredAngle = baseAngle + ((((enemy.id * 137) % 7) - 3) * ENEMY_MELEE_SLOT_ANGLE_STEP)", "Melee occupancy slots must distribute enemies by stable id."],
  [app, "resolveEnemyPlayerBodyOccupancyFloor", "Aggro monster occupancy correction must keep enemy centers out of the player body while preserving contact damage."],
  [app, "const approachTargetIsPlayer = distance(approachTarget, player) <= 0.001", "Corner navigation must distinguish player-center approach from side-cell approach."],
  [app, "distance(enemy, approachTarget)", "Corner navigation must keep moving toward reachable approach cells instead of stopping outside attack range."],
  [app, "const directProgress = currentDistance - distance(directResolved, target)", "Direct-charge movement must prefer progress toward the player over side avoidance."],
  [app, "directCharge\n    ? resolveEnemyDirectChargeMove", "Aggro-locked monsters must bypass swarm steering and crowd-yield movement."],
  [app, "MONSTER_CHASE_SPEED_MULTIPLIER = 2", "Monster chase speed must be doubled by a centralized multiplier."],
  [app, "nextAttackReadyAtMs: nowMs + monsterAttackCadenceMs(enemy)", "Monster damage must use attack cadence rather than per-frame proximity damage."],
  [mapSpawnRuntime, "monster_offense_defaults", "Procedural spawn runtime must accept monster offense defaults."],
  [mapSpawnRuntime, "offense_modifiers", "Procedural spawn runtime must materialize offense modifiers."],
  [mapSpawnRuntime, "mergeMonsterOffense", "Procedural spawn runtime must merge default and per-entry monster offense config."]
];

for (const [source, token, message] of monsterPackCombatChecks) {
  if (!source.includes(token)) throw new Error(message);
}

const runtimeMonsterAttackBody = functionBody(app, "applyRuntimeMonsterAttacks");
for (const token of [
  "canEnemyStartRuntimeAttack(enemy, nextPlayer, nowMs, battleMap)",
  "resolveMonsterHitAgainstPlayer(enemy, playerBeforeHit, state?.player_stats, blocked)",
  "nextAttackReadyAtMs: nowMs + monsterAttackCadenceMs(enemy)",
  "setRuntimePlayer(() => nextPlayer)"
]) {
  if (!runtimeMonsterAttackBody.includes(token)) {
    throw new Error(`runtime monster attacks must own stationary-player hit cadence: ${token}`);
  }
}
if (runtimeMonsterAttackBody.includes("playerInputVector")) {
  throw new Error("runtime monster attacks must not depend on player movement input.");
}

const enemyVisualSyncBody = functionBody(app, "syncEnemyVisuals");
for (const forbidden of ["applyMonsterAttackHit", "resolveMonsterHitAgainstPlayer", "nextAttackReadyAtMs:"]) {
  if (enemyVisualSyncBody.includes(forbidden)) {
    throw new Error(`enemy visual sync must not own monster damage or cooldowns: ${forbidden}`);
  }
}
if (!enemyVisualSyncBody.includes("attackStartedAtMs: enemy.attackStartedAtMs") || !enemyVisualSyncBody.includes("attackUntilMs: enemy.attackUntilMs")) {
  throw new Error("enemy visual sync must read runtime-owned attack animation state.");
}

if (!Array.isArray(mapSpawnConfig.map_spawn_profiles) || mapSpawnConfig.map_spawn_profiles.length === 0) {
  throw new Error("map_spawn_v1.json must define map_spawn_profiles.");
}
if (!Array.isArray(mapSpawnConfig.monster_packs) || mapSpawnConfig.monster_packs.length === 0) {
  throw new Error("map_spawn_v1.json must define monster_packs.");
}
if (!mapSpawnConfig.monster_rarity_rules) {
  throw new Error("map_spawn_v1.json must define monster_rarity_rules.");
}
if (!mapSpawnConfig.monster_offense_defaults) {
  throw new Error("map_spawn_v1.json must define monster_offense_defaults.");
}
for (const statId of ["damage_add_percent", "physical_damage_add_percent", "hit_damage_add_percent", "attack_damage_add_percent", "melee_damage_add_percent", "damage_final_percent", "hit_damage_final_percent", "resistance_penetration_percent"]) {
  if (!(statId in (mapSpawnConfig.monster_offense_defaults.modifiers ?? {}))) {
    throw new Error(`monster_offense_defaults missing shared stat id: ${statId}`);
  }
}
for (const packId of ["geo_corridor_crawlers", "geo_room_shard_mix", "geo_guard_tri_crown", "geo_boss_king"]) {
  if (!mapSpawnConfig.monster_packs.some((pack) => pack.pack_id === packId)) {
    throw new Error(`map_spawn_v1.json missing monster pack: ${packId}`);
  }
}
for (const monsterId of ["mon_100101", "mon_200101", "mon_300101", "mon_400101"]) {
  if (!mapSpawnConfig.monster_packs.some((pack) => pack.entries.some((entry) => entry.monster_id === monsterId))) {
    throw new Error(`map_spawn_v1.json missing geometry monster: ${monsterId}`);
  }
}
for (const zoneType of ["entrance", "corridor", "main_room", "large_room", "dead_end", "boss_room", "exit_area"]) {
  if (!mapSpawnConfig.map_spawn_profiles[0].zone_rules[zoneType]) {
    throw new Error(`map_spawn_v1.json missing zone rule: ${zoneType}`);
  }
}

runProceduralSpawnRuntimeSmoke();

if (!existsSync(join(root, "dist", "index.html"))) {
  throw new Error("缂哄皯鏋勫缓浜х墿 dist/index.html锛岃鍏堣繍锟?npm run build锟?");
}

console.log("WebApp smoke test passed.");

function runProceduralSpawnRuntimeSmoke() {
  const outDir = join(root, ".vite", "map-spawn-smoke");
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  execFileSync(process.execPath, [
    join(root, "node_modules", "typescript", "bin", "tsc"),
    "webapp/mapSpawnRuntime.ts",
    "--target", "ES2020",
    "--module", "CommonJS",
    "--moduleResolution", "Node",
    "--skipLibCheck",
    "--esModuleInterop",
    "--resolveJsonModule",
    "--outDir", outDir,
    "--noEmitOnError", "true"
  ], { cwd: root, encoding: "utf8" });

  const { generateProceduralMonsterSpawns, parseMonsterDefinitionsToml } = require(join(outDir, "mapSpawnRuntime.js"));
  const map = createProceduralSmokeMap();
  const config = {
    ...mapSpawnConfig,
    monster_definitions: parseMonsterDefinitionsToml(monsterDefsToml),
    map_spawn_profiles: [{
      ...mapSpawnConfig.map_spawn_profiles[0],
      base_pack_budget: 14,
      min_distance_from_player_spawn: 160,
      min_distance_between_packs: 150,
      max_active_packs: 6,
      max_non_boss_monster_varieties: 24,
      max_boss_packs: 1
    }],
    monster_rarity_rules: {
      ...mapSpawnConfig.monster_rarity_rules,
      normal_weight: 0,
      magic_weight: 100,
      rare_weight: 100,
      max_magic_monsters_per_map: 24,
      max_rare_per_map: 2,
      max_magic_packs_per_map: 6,
      magic_allowed_zone_types: ["large_room", "boss_room"],
      rare_allowed_zone_types: ["boss_room"],
      multipliers: {
        normal: { life_multiplier: 1, damage_multiplier: 1 },
        magic: { life_multiplier: 1.5, damage_multiplier: 1.2 },
        rare: { life_multiplier: 2.5, damage_multiplier: 1.5 },
        boss: { life_multiplier: 1, damage_multiplier: 1 }
      }
    }
  };
  const result = generateProceduralMonsterSpawns(map, config, {
    seed: "smoke-procedural-spawn",
    startId: 100,
    maxCandidatePoints: 90
  });
  if (!result.enemies.length) throw new Error("procedural spawn smoke must create enemies.");
  if (result.enemies.some((enemy) => !enemy.base_damage || !enemy.damage_type || !enemy.hit_kind || !enemy.attack_range || !enemy.attack_cadence_ms || !enemy.offense_modifiers)) {
    throw new Error("procedural spawn enemies must include monster offense context.");
  }
  if (!result.enemies.every((enemy) => enemy.max_hp >= 32 && enemy.base_damage >= 8)) {
    throw new Error("procedural spawn enemies must derive base life and attack from monster_defs.");
  }
  if (!result.enemies.every((enemy) => enemy.damage_type === "physical" && enemy.hit_kind === "attack")) {
    throw new Error("procedural spawn enemies must inherit default physical melee offense.");
  }
  if (result.debug.spawn_points.some((point) => point.accepted && point.zone_type === "entrance")) {
    throw new Error("entrance zone must not spawn monsters.");
  }
  if (result.enemies.some((enemy) => enemy.x === 5 * 64 + 32 && enemy.y === 5 * 64 + 32)) {
    throw new Error("blocked grid cell must not spawn monsters.");
  }
  const accepted = result.debug.spawn_points.filter((point) => point.accepted);
  for (let a = 0; a < accepted.length; a += 1) {
    for (let b = a + 1; b < accepted.length; b += 1) {
      const distance = Math.hypot(accepted[a].x - accepted[b].x, accepted[a].y - accepted[b].y);
      if (distance < config.map_spawn_profiles[0].min_distance_between_packs) {
        throw new Error("procedural monster packs are too close together.");
      }
    }
  }
  if (result.debug.spent_pack_budget > config.map_spawn_profiles[0].base_pack_budget) {
    throw new Error("procedural spawn budget exceeded base_pack_budget.");
  }
  if (!result.enemies.some((enemy) => enemy.zone_type === "large_room" && enemy.spawn_rarity === "magic")) {
    throw new Error("large_room must be able to generate magic monsters.");
  }
  if (result.debug.rare_monster_count > config.monster_rarity_rules.max_rare_per_map) {
    throw new Error("rare monster count exceeded max_rare_per_map.");
  }
  if (!result.enemies.some((enemy) => enemy.boss && enemy.zone_type === "boss_room")) {
    throw new Error("boss_room must generate a Boss.");
  }
  if (result.debug.boss_monster_count > 1) {
    throw new Error("procedural spawn must limit Boss monsters to one by default.");
  }
  const limitedConfig = {
    ...config,
    map_spawn_profiles: [{
      ...config.map_spawn_profiles[0],
      base_pack_budget: 120,
      min_distance_between_packs: 80,
      max_active_packs: 40,
      max_non_boss_monster_varieties: 4,
      max_boss_packs: 1
    }],
    monster_rarity_rules: {
      ...config.monster_rarity_rules,
      max_magic_monsters_per_map: 8,
      max_rare_per_map: 2
    }
  };
  const limitedResult = generateProceduralMonsterSpawns(map, limitedConfig, {
    seed: "smoke-procedural-spawn-variety-limit",
    startId: 1000,
    maxCandidatePoints: 120
  });
  const nonBossMonsterIds = new Set(limitedResult.enemies.filter((enemy) => !enemy.boss).map((enemy) => enemy.monster_id));
  if (nonBossMonsterIds.size > limitedConfig.map_spawn_profiles[0].max_non_boss_monster_varieties) {
    throw new Error("non-Boss monster variety count exceeded max_non_boss_monster_varieties.");
  }
  if (limitedResult.debug.magic_monster_count > limitedConfig.monster_rarity_rules.max_magic_monsters_per_map) {
    throw new Error("magic monster count exceeded max_magic_monsters_per_map.");
  }
  if (limitedResult.debug.rare_monster_count > limitedConfig.monster_rarity_rules.max_rare_per_map) {
    throw new Error("rare monster count exceeded max_rare_per_map.");
  }
  if (limitedResult.debug.boss_monster_count > limitedConfig.map_spawn_profiles[0].max_boss_packs) {
    throw new Error("Boss monster count exceeded max_boss_packs.");
  }
  const reasons = new Set(result.debug.filtered_points.map((point) => point.filter_reason));
  for (const reason of ["入口区域不刷怪", "阻挡格", "怪物包距离过近"]) {
    if (!reasons.has(reason)) throw new Error(`procedural spawn smoke missing filter reason: ${reason}`);
  }
}

function createProceduralSmokeMap() {
  const gridWidth = 12;
  const gridHeight = 12;
  const gridSize = 64;
  const walkableGrid = Array.from({ length: gridHeight }, () => Array.from({ length: gridWidth }, () => true));
  const blockerGrid = Array.from({ length: gridHeight }, () => Array.from({ length: gridWidth }, () => false));
  blockerGrid[5][5] = true;
  const point = (gridX, gridY) => ({ x: gridX * gridSize + gridSize / 2, y: gridY * gridSize + gridSize / 2, gridX, gridY });
  const walkablePoints = [];
  for (let y = 0; y < gridHeight; y += 1) {
    for (let x = 0; x < gridWidth; x += 1) walkablePoints.push(point(x, y));
  }
  return {
    id: "smoke_map",
    displayName: "生怪测试地图",
    backgroundUrl: "",
    meta: {
      id: "smoke_map",
      biome: "test",
      display_name: "生怪测试地图",
      background: "",
      walkable_mask: "",
      blocker_mask: "",
      spawn_mask: "",
      pixel_width: gridWidth * gridSize,
      pixel_height: gridHeight * gridSize,
      world_width: gridWidth * gridSize,
      world_height: gridHeight * gridSize,
      grid_size: gridSize,
      player_spawn_policy: "test",
      enemy_spawn_policy: "test",
      elite_spawn_policy: "test",
      boss_spawn_policy: "test",
      exit_policy: "test",
      collision_source: "test",
      navigation_source: "test"
    },
    gridWidth,
    gridHeight,
    walkableGrid,
    blockerGrid,
    walkablePoints,
    playerSpawn: point(1, 1),
    enemySpawnPoints: [point(5, 5), point(5, 6), point(6, 6)],
    eliteSpawnPoints: [point(8, 3)],
    bossPoints: [point(10, 10)],
    exitPoints: [],
    zones: [
      { id: "smoke_entrance", zoneType: "entrance", shape: "rectangle", points: [{ x: 0, y: 0 }, { x: 3 * gridSize, y: 3 * gridSize }] },
      { id: "smoke_large", zoneType: "large_room", shape: "circle", points: [point(8, 3), point(10, 3)] },
      {
        id: "smoke_main",
        zoneType: "main_room",
        shape: "rectangle",
        points: [point(4, 4), point(7, 4), point(4, 6), point(7, 7)],
        rects: [{ start: point(4, 4), end: point(7, 4) }, { start: point(4, 6), end: point(7, 7) }]
      },
      { id: "smoke_boss", zoneType: "boss_room", shape: "rectangle", points: [point(9, 9), point(11, 11)] }
    ],
    interactionPoints: [],
    debugWarnings: []
  };
}
