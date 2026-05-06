import { CSSProperties, DragEvent, MouseEvent, ReactNode, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { compareDimetricDepth, dimetricDepth } from "./isoDepth";
import React from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { unprojectScreenToWorld } from "./isoProjection";
import { BAKED_BATTLE_MAPS, bakedMapAssetById, DEFAULT_BAKED_BATTLE_MAP_ID } from "./bakedMapAssets";
import { BakedBattleMapData, isMapPointWalkable, loadBakedBattleMap, MapPoint, resolveWalkableMove } from "./bakedMapLoader";
import mapSpawnV1Config from "../configs/monsters/map_spawn_v1.json";
import monsterDefsToml from "../configs/monsters/monster_defs.toml?raw";
import map001Document from "../map/map_001.json";
import { generateProceduralMonsterSpawns, parseMonsterDefinitionsToml } from "./mapSpawnRuntime";
import type { MapSpawnV1Config, ProceduralSpawnDebugSummary, ProceduralSpawnRarity, ProceduralZoneType } from "./mapSpawnRuntime";
import { getAnimationFrame, resolveDirection, resolveUnitAnimation, UnitAnimationContext, UnitAnimationFrame } from "./unitAnimation";
import { BattleGeometryCanvas } from "./BattleGeometryCanvas";
import type { BattleGeometrySnapshot } from "./battleGeometryRenderer";
import { fallbackUnitVisualForMonster, MONSTER_GEOMETRY_VISUALS, resolveMonsterGeometryVisual } from "./monsterGeometryVisuals";
import {
  selectEnemyUnitType,
  UNIT_ANIMATION_ASSETS,
  UNIT_ANIMATION_BY_KEY,
  UnitAnimationAsset,
  UnitAnimationState,
  UnitDirection,
  UnitVisualType,
  unitAnimationKey
} from "./unitAssets";
import { FIRE_BOLT_VFX, ICE_SHARDS_VFX, PENETRATING_SHOT_VFX, VfxSpriteSheet } from "./vfxAssets";
import { FRONTEND_GEM_DROP_POOL } from "./frontendGemDropData";
import { FRONTEND_INITIAL_APP_STATE, FRONTEND_SKILL_PREVIEWS_BY_SKILL_TAG } from "./frontendGameData";
import { FRONTEND_SKILL_LEVEL_TABLES } from "./frontendSkillLevelTables";
import {
  applyFrontendEquipmentStatModifiers,
  chooseFrontendEquipmentSource,
  createSpecifiedFrontendEquipment,
  frontendEquipmentAffixOptions,
  frontendEquipmentAffixTexts,
  frontendEquipmentRarities,
  frontendEquipmentRarityText,
  frontendEquipmentSources,
  frontendEquipmentStatModifiers,
  generateFrontendEquipment,
  prefixSuffixCapacity,
} from "./frontendEquipmentRuntime";
import type { FrontendEquipmentAffixRoll, FrontendEquipmentStatModifier } from "./frontendEquipmentRuntime";

type Gem = {
  instance_id: string;
  base_gem_id?: string;
  item_kind?: "gem" | "ordinary" | "equipment";
  name_text: string;
  description_text?: string;
  category_text: string;
  rarity_text: string;
  gem_kind?: "active_skill" | "passive_skill" | "support" | "";
  sudoku_digit?: number;
  gem_type: { id?: string; number?: number; display_text: string; identity_text: string };
  tags: { id?: string; text: string }[];
  current_effective_targets: { name_text: string }[];
  board_position: { row: number; column: number } | null;
  visual_effect?: string;
  shape_effect?: string;
  shape_effect_text?: string;
  tooltip_view?: TooltipView;
  base_effect?: {
    base_release_interval_ms?: number;
    release_interval_ms?: number;
  };
  level?: number;
  equipment_affixes?: FrontendEquipmentAffixRoll[];
  equipment_stat_modifiers?: FrontendEquipmentStatModifier[];
};

type TooltipView = {
  variant?: "active" | "passive" | "support";
  icon_text: string;
  icon_color_key?: string;
  icon_sprite?: string;
  name_text: string;
  subtitle_text: string;
  type_identity_text: string;
  tags: TooltipTagView[];
  summary_lines?: TooltipRichLine[];
  sections: {
    description: { title_text: string; lines: string[] };
    stats: { title_text: string; lines: TooltipStatLine[] };
    recent_dps?: { title_text: string; lines: TooltipStatLine[] };
    bonuses?: { title_text: string; lines: string[] };
    base_skill_level?: { lines: string[] };
    conditions?: { rich_lines: TooltipRichLine[] };
    support_rules?: { rich_lines: TooltipRichLine[] };
    base_bonuses?: { rich_lines: TooltipRichLine[] };
    current_targets?: { title_text: string; lines: TooltipTargetLine[] };
    rules?: { title_text: string; lines: string[] };
  };
};

type TooltipTagView = {
  id?: string;
  text: string;
  tone?: string;
};

type TooltipStatLine = {
  label_text: string;
  value_text: string;
};

type TooltipTargetLine = {
  name_text: string;
  status_text: string;
};

type TooltipTextSegment = {
  text: string;
  tone?: string;
};

type TooltipRichLine = TooltipTextSegment[];

type ShapeEffectPreview = { id: string; text: string };

type Cell = {
  row: number;
  column: number;
  box: number;
  gem: Gem | null;
};

type SkillPreview = {
  active_gem_instance_id: string;
  name_text: string;
  skill_template_id: string;
  skill_package_id?: string;
  skill_package_version?: string;
  template_text: string;
  damage_type: string;
  behavior_type: string;
  behavior_template?: string;
  visual_effect: string;
  cast?: Record<string, number | string | boolean>;
  hit?: Record<string, number | string | boolean>;
  runtime_params?: Record<string, unknown>;
  presentation_keys?: Record<string, unknown>;
  source_context?: Record<string, number | string>;
  skill_stats?: Record<string, number | boolean>;
  shape_effects: ShapeEffectPreview[];
  final_damage: number;
  non_crit_damage?: number;
  increase_pool?: number;
  final_pool?: number;
  crit_chance?: number;
  crit_multiplier?: number;
  expected_hit_damage?: number;
  final_damage_components?: Record<string, number>;
  uses_per_second?: number;
  base_release_interval_ms?: number;
  release_interval_ms?: number;
  actual_interval_ms?: number;
  mana_cost?: number;
  hit_coverage_factor?: number;
  preview_dps?: number;
  final_cooldown_ms: number;
  projectile_count: number;
  area_multiplier: number;
  speed_multiplier: number;
  applied_modifiers: {
    source_instance_id: string;
    source_name_text: string;
    target_instance_id: string;
    stat: { text: string };
    value: number;
    relation_text: string;
    reason_text: string;
    applied: boolean;
    shape_effect?: string;
    shape_effect_text?: string;
  }[];
};

type SkillEditorSchemaStatus = {
  is_valid: boolean;
  text: string;
  errors: string[];
};

type SkillPackageData = {
  id: string;
  version: string;
  display: {
    name_key: string;
    description_key: string;
  };
  classification: {
    tags: string[];
    damage_type: string;
    damage_form: string;
  };
  cast: {
    mode: string;
    target_selector: string;
    search_range: number;
    cooldown_ms: number;
    windup_ms: number;
    recovery_ms: number;
  };
  behavior: {
    template: string;
    params: {
      projectile_count?: number;
      burst_interval_ms?: number;
      spread_angle_deg?: number;
      angle_step?: number;
      random_angle_jitter_deg?: number;
      projectile_speed?: number;
      projectile_width?: number;
      projectile_height?: number;
      max_distance?: number;
      hit_policy?: string;
      pierce_count?: number;
      collision_radius?: number;
      spawn_offset?: { x: number; y: number };
      projectile_radius?: number;
      impact_radius?: number;
      max_targets?: number;
      arc_angle?: number;
      arc_radius?: number;
      windup_ms?: number;
      hit_at_ms?: number;
      facing_policy?: string;
      hit_shape?: string;
      status_chance_scale?: number;
      slash_vfx_key?: string;
      min_duration_ms?: number;
      max_duration_ms?: number;
      [key: string]: unknown;
    };
  };
  modules?: {
    id: string;
    type: string;
    trigger?: {
      trigger_marker_id?: string;
      trigger_delay_ms?: number;
      [key: string]: unknown;
    };
    params: {
      [key: string]: unknown;
    };
  }[];
  hit: {
    base_damage: number;
    can_crit: boolean;
    can_apply_status: boolean;
    damage_timing?: string;
    hit_delay_ms?: number;
    hit_radius?: number;
    target_policy?: string;
    secondary_hits?: SecondaryHitConfig[];
  };
  scaling: {
    additive_stats: string[];
    final_stats: string[];
    runtime_params: string[];
  };
  presentation: {
    vfx: string;
    cast_vfx_key?: string;
    projectile_vfx_key?: string;
    hit_vfx_key?: string;
    sfx: string;
    floating_text: string;
    floating_text_style?: string;
    screen_feedback: string;
    vfx_scale?: number;
    hit_stop_ms?: number;
    camera_shake?: number;
  };
  preview: {
    show_fields: string[];
  };
};

type SkillEditorEntry = {
  id: string;
  name_text: string;
  migrated: boolean;
  openable: boolean;
  editable: boolean;
  status_text: string;
  skill_yaml_path: string;
  behavior_template: string;
  schema_status: SkillEditorSchemaStatus;
  detail: {
    id: string;
    version: string;
    damage_type: string;
    damage_form: string;
    tags: string[];
    cooldown_ms: number | string | null;
    base_damage: number | string | null;
  } | null;
  package_data: SkillPackageData | null;
};

type SkillEditorOption = {
  value: string;
  text: string;
};

type SkillEditorModifierStat = {
  stat: string;
  stat_text: string;
  value: number;
  layer: string;
  layer_text: string;
  relation?: string;
  relation_text?: string;
};

type SkillEditorTestModifier = {
  id: string;
  name_text: string;
  description_text: string;
  source_text: string;
  category: string;
  stats: SkillEditorModifierStat[];
  filter_text: string;
};

type SkillEditorModifierStackView = {
  panel_title_text: string;
  available_title_text: string;
  selected_title_text: string;
  notice_text: string;
  relation_label_text: string;
  power_label_text: string;
  apply_button_text: string;
  clear_button_text: string;
  relation_options: SkillEditorOption[];
  power_limits: { min: number; max: number };
  available_modifiers: SkillEditorTestModifier[];
};

type SkillEditorModifierPreview = {
  skill_id: string;
  skill_name_text: string;
  relation: string;
  relation_text: string;
  source_power: number;
  target_power: number;
  conduit_power: number;
  baseline: {
    final_damage: number;
    final_cooldown_ms: number;
    projectile_count: number;
    projectile_speed: number;
    arc_radius?: number;
    chain_radius?: number;
    chain_count?: number;
    status_chance_scale?: number;
  };
  tested: {
    final_damage: number;
    final_cooldown_ms: number;
    projectile_count: number;
    projectile_speed: number;
    arc_radius?: number;
    chain_radius?: number;
    chain_count?: number;
    status_chance_scale?: number;
  };
  applied_modifiers: SkillEditorPreviewModifier[];
  unapplied_modifiers: SkillEditorPreviewModifier[];
  writes_real_data: boolean;
};

type SkillTestArenaEnemy = {
  enemy_id: string;
  name_text: string;
  position: { x: number; y: number };
  max_life: number;
  current_life: number;
  is_alive: boolean;
};

type SkillTestArenaView = {
  panel_title_text: string;
  entry_button_text: string;
  notice_text: string;
  skills: {
    id: string;
    name_text: string;
    testable: boolean;
    status_text: string;
  }[];
  scenes: {
    scene_id: string;
    name_text: string;
    enemies: SkillTestArenaEnemy[];
  }[];
};

type SkillTestArenaEventSummary = {
  event_id: string;
  type: string;
  type_text: string;
  delay_ms: number;
  duration_ms: number;
  target_entity: string;
  amount: number | null;
  projectile_index?: number;
  segment_index?: number;
};

type SkillEventTimelineItem = {
  event_id: string;
  type: string;
  type_text: string;
  original_index: number;
  timestamp_ms: number;
  source_entity: string;
  target_entity: string;
  position: { x: number; y: number };
  direction: { x: number; y: number };
  delay_ms: number;
  duration_ms: number;
  amount: number | null;
  damage_type: string;
  skill_instance_id: string;
  vfx_key: string;
  sfx_key: string;
  reason_key: string;
  payload: Record<string, unknown>;
  payload_text: string;
};

type SkillEventTimelineChecks = {
  has_projectile_spawn: boolean;
  has_multiple_projectile_spawn: boolean;
  has_damage_zone?: boolean;
  has_area_spawn?: boolean;
  has_melee_arc?: boolean;
  has_chain_segment?: boolean;
  has_multiple_chain_segment?: boolean;
  has_projectile_hit: boolean;
  has_damage: boolean;
  has_hit_vfx: boolean;
  has_floating_text: boolean;
  damage_after_or_at_projectile_spawn: boolean;
  damage_after_or_at_area_hit?: boolean;
  damage_after_or_at_melee_hit?: boolean;
  damage_after_or_at_damage_zone_hit?: boolean;
  damage_after_or_at_chain_segment?: boolean;
  chain_no_repeat_targets?: boolean;
  chain_hits_multiple_targets?: boolean;
  area_center_passed?: boolean;
  melee_arc_origin_passed?: boolean;
  damage_zone_origin_passed?: boolean;
  flight_no_damage_passed: boolean;
  fan_direction_passed: boolean;
  basic_timing_passed: boolean;
};

type SkillTestArenaDamageResult = {
  enemy_id: string;
  name_text: string;
  amount: number;
  delay_ms: number;
  projectile_index?: number;
  segment_index?: number;
};

type SkillTestArenaStage = {
  stage_name_text: string;
  monsters: SkillTestArenaEnemy[];
  hit_targets: { enemy_id: string; name_text: string }[];
  damage_results: SkillTestArenaDamageResult[];
  applied_event_count: number;
  event_summary: SkillTestArenaEventSummary[];
  total_event_count: number;
};

type SkillTestArenaResult = {
  skill_id: string;
  skill_name_text: string;
  scene_id: string;
  scene_name_text: string;
  modifier_stack_enabled: boolean;
  modifier_relation_text: string;
  source_power: number;
  target_power: number;
  conduit_power: number;
  baseline: SkillEditorModifierPreview["baseline"];
  tested: SkillEditorModifierPreview["tested"];
  monsters: SkillTestArenaEnemy[];
  initial_monsters: SkillTestArenaEnemy[];
  hit_targets: { enemy_id: string; name_text: string }[];
  damage_results: SkillTestArenaDamageResult[];
  event_count: number;
  event_counts: Record<string, number>;
  has_projectile_spawn: boolean;
  has_damage_zone?: boolean;
  has_area_spawn?: boolean;
  has_melee_arc?: boolean;
  has_chain_segment?: boolean;
  has_damage: boolean;
  has_hit_vfx: boolean;
  has_floating_text: boolean;
  flight_no_damage_passed: boolean;
  flight_duration_ms: number;
  stages: SkillTestArenaStage[];
  event_summary: SkillTestArenaEventSummary[];
  event_timeline: SkillEventTimelineItem[];
  timeline_supported_types: { type: string; text: string }[];
  timeline_checks: SkillEventTimelineChecks;
  writes_real_data: boolean;
};

type SkillEditorPreviewModifier = {
  id: string;
  name_text: string;
  stat: SkillEditorModifierStat;
  value: number;
  layer: string;
  layer_text: string;
  relation: string;
  relation_text: string;
  reason_key: string;
  reason_text: string;
  applied: boolean;
};

type SkillEditorState = {
  title_text: string;
  subtitle_text: string;
  selected_id: string;
  entries: SkillEditorEntry[];
  options: {
    damage_types: SkillEditorOption[];
    damage_forms: SkillEditorOption[];
    cast_modes: SkillEditorOption[];
    target_selectors: SkillEditorOption[];
    hit_policies: SkillEditorOption[];
    damage_timings: SkillEditorOption[];
    center_policies: SkillEditorOption[];
    zone_shapes: SkillEditorOption[];
    origin_policies: SkillEditorOption[];
    facing_policies: SkillEditorOption[];
    hit_shapes: SkillEditorOption[];
    damage_falloff_modes: SkillEditorOption[];
    target_policies: SkillEditorOption[];
    chain_target_policies: SkillEditorOption[];
    preview_fields: SkillEditorOption[];
  };
  modifier_stack: SkillEditorModifierStackView;
  test_arena: SkillTestArenaView;
};

type SkillEditorDebugOptions = {
  showLaunchPoints: boolean;
  showTargetPoint: boolean;
  showDirectionLines: boolean;
  showCollisionRadius: boolean;
  showSearchRange: boolean;
};

type SkillEditorCameraSettings = {
  zoom: number;
};

const DEFAULT_SKILL_EDITOR_DEBUG_OPTIONS: SkillEditorDebugOptions = {
  showLaunchPoints: true,
  showTargetPoint: true,
  showDirectionLines: true,
  showCollisionRadius: true,
  showSearchRange: true
};

const SKILL_EDITOR_CAMERA_STORAGE_KEY = "poe.skillEditor.camera";
const SKILL_EDITOR_CAMERA_MIN_ZOOM = 0.18;
const SKILL_EDITOR_CAMERA_MAX_ZOOM = 0.6;
const DEFAULT_SKILL_EDITOR_CAMERA_SETTINGS: SkillEditorCameraSettings = {
  zoom: 0.34
};

type SkillEditorSaveResponse = {
  ok: boolean;
  message_text: string;
  state: AppState;
};

type SkillEditorModifierPreviewResponse = {
  ok: boolean;
  message_text: string;
  preview: SkillEditorModifierPreview | null;
};

type SkillTestArenaResponse = {
  ok: boolean;
  message_text: string;
  result: SkillTestArenaResult | null;
};

function initialSkillEditorOpen() {
  return false;
}

function initialSkillEditorMode() {
  return false;
}

function initialSpriteTestMode() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  const path = window.location.pathname.replace(/\/+$/, "");
  return path === "/sprite-test" || params.get("mode") === "sprite-test";
}

function initialMapEditorMode() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  const path = window.location.pathname.replace(/\/+$/, "");
  return path === "/map-editor" || params.get("mode") === "map-editor";
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function normalizeSkillEditorCameraSettings(value: unknown): SkillEditorCameraSettings {
  const source = value && typeof value === "object" ? value as Partial<SkillEditorCameraSettings> : {};
  return {
    zoom: clampNumber(Number(source.zoom ?? DEFAULT_SKILL_EDITOR_CAMERA_SETTINGS.zoom), SKILL_EDITOR_CAMERA_MIN_ZOOM, SKILL_EDITOR_CAMERA_MAX_ZOOM)
  };
}

function loadSkillEditorCameraSettings(): SkillEditorCameraSettings {
  if (typeof window === "undefined") return DEFAULT_SKILL_EDITOR_CAMERA_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SKILL_EDITOR_CAMERA_STORAGE_KEY);
    return normalizeSkillEditorCameraSettings(raw ? JSON.parse(raw) : DEFAULT_SKILL_EDITOR_CAMERA_SETTINGS);
  } catch {
    return DEFAULT_SKILL_EDITOR_CAMERA_SETTINGS;
  }
}

function saveSkillEditorCameraSettings(settings: SkillEditorCameraSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SKILL_EDITOR_CAMERA_STORAGE_KEY, JSON.stringify(normalizeSkillEditorCameraSettings(settings)));
}

type SkillEvent = {
  event_id: string;
  type:
    | "cast_start"
    | "projectile_spawn"
    | "projectile_hit"
    | "projectile_impact"
    | "target_search"
    | "chain_segment"
    | "area_spawn"
    | "melee_arc"
    | "damage_zone_prime"
    | "damage_zone"
    | "damage_zone_hit"
    | "orbit_spawn"
    | "orbit_tick"
    | "delayed_area_prime"
    | "delayed_area_explode"
    | "unit_killed"
    | "damage"
    | "status_apply"
    | "forced_movement"
    | "buff_apply"
    | "hit_vfx"
    | "floating_text"
    | "cooldown_update";
  timestamp_ms: number;
  source_entity: string;
  target_entity: string;
  position: { x: number; y: number };
  direction: { x: number; y: number };
  delay_ms: number;
  duration_ms: number;
  amount: number | null;
  damage_type: string;
  skill_instance_id: string;
  vfx_key: string;
  sfx_key: string;
  reason_key: string;
  payload?: {
    end_position?: { x: number; y: number };
    text?: string;
    skill_name?: string;
    [key: string]: unknown;
  };
};

type SecondaryHitConfig = {
  id?: string;
  trigger?: string;
  shape?: string;
  placement?: string;
  offset_distance?: number;
  radius?: number;
  base_damage?: number;
  weapon_attack_percent?: number;
  max_targets?: number;
  delay_ms?: number;
  vfx_key?: string;
  reason_key?: string;
  damage_conversions?: Record<string, unknown>[];
  damage_components?: Record<string, number>;
  ailments?: Record<string, unknown>[];
  hit_marker_id?: string;
  trigger_marker_id?: string;
  search_module_id?: string;
  direct_damage_module_id?: string;
};

type AppState = {
  inventory: Gem[];
  board: {
    cells: Cell[][];
    prompts: string[];
    highlights: Record<string, { instance_ids: string[]; relation_text: string }[]>;
  };
  skill_preview: SkillPreview[];
  skill_error: string | null;
  drops: DropPrompt[];
  logs: string[];
  player_stats?: Record<string, PlayerStatView>;
  character_panel?: CharacterPanelView;
  equipment_slots?: (string | null)[];
  map_progression?: {
    selected_stage_id: string;
    stages: MapProgressionStageView[];
  };
  current_map_run?: {
    run_id: string;
    stage_id: string;
    display_name: string;
    map_level: number;
    monster_level: number;
    map_template_id: string;
    monsters?: FrontendMapRunMonster[];
  } | null;
  autosave?: {
    enabled: boolean;
    path: string;
  };
  frontend_save?: FrontendSavePayload;
  skill_editor?: SkillEditorState;
  ui_text?: {
    only_gems_on_board?: string;
  };
};

type FrontendSavePayload = {
  version: number;
  saved_at?: string;
  inventory?: Gem[];
  board?: AppState["board"];
  skill_preview?: SkillPreview[];
  skill_error?: string | null;
  drops?: DropPrompt[];
  logs?: string[];
  player_stats?: Record<string, PlayerStatView>;
  character_panel?: CharacterPanelView;
  equipment_slots?: (string | null)[];
  map_progression?: AppState["map_progression"];
  ui_text?: AppState["ui_text"];
  next_frontend_item_index?: number;
  [key: string]: unknown;
};

type FrontendMapRunMonster = {
  runtime_id: string;
  monster_id: string;
  pack_id: string;
  zone_type: string;
  spawn_rarity: ProceduralSpawnRarity;
  boss: boolean;
  position: { x: number; y: number };
  current_life: number;
  max_life: number;
  base_damage: number;
  damage_multiplier: number;
  map_stage_id: string;
  map_level: number;
  monster_level: number;
  loot_context: {
    stage_id: string;
    loot_profile_id: string;
    monster_rarity: string;
    is_boss: boolean;
  };
};

type DropPrompt = {
  drop_id: string;
  loot_kind?: "gem" | "equipment" | "map_entry" | string;
  name_text: string;
  rarity_text: string;
  picked_up: boolean;
  status_text: string;
  position?: { x: number; y: number };
  level?: number;
  equipment_source?: string;
  equipment_rarity?: string;
  equipment_affixes?: FrontendEquipmentAffixRoll[];
  equipment_stat_modifiers?: FrontendEquipmentStatModifier[];
  base_gem_instance_id?: string;
  target_stage_id?: string;
};

type MapProgressionStageView = {
  id: string;
  display_name: string;
  phase: string;
  order: number;
  map_level_text: string;
  map_level_min: number;
  map_level_max: number;
  monster_level: number;
  entry_cost: number;
  free_entry: boolean;
  entry_count: number;
  unlocked: boolean;
  enterable: boolean;
  selected: boolean;
  boss_stage: boolean;
  gem_level_min: number;
  gem_level_max: number;
  base_drop_chance: number;
  equipment_weight?: number;
  gem_weight?: number;
  map_entry_weight?: number;
  equipment_rarity_weights?: Record<string, number>;
};

type GmGemOption = {
  id: string;
  name_text: string;
  kind: string;
  gem_type: string;
  sudoku_digit: number;
};

type GmEquipmentSourceOption = {
  id: string;
  name_text: string;
};

type GmEquipmentRarityOption = {
  id: string;
  name_text: string;
  affix_count: number;
};

type GmOptions = {
  gems: GmGemOption[];
  equipment_sources: GmEquipmentSourceOption[];
  equipment_rarities: GmEquipmentRarityOption[];
};

type GmEquipmentAffixOption = {
  id: string;
  name_text: string;
  effect_text: string;
  library: string;
  gen: string;
  tier: number;
  family_id: string;
  required_level: number;
};

type GmEquipmentAffixResponse = {
  source: string;
  level: number;
  capacity: { prefix: number; suffix: number };
  affixes: GmEquipmentAffixOption[];
};

type PlayerStatView = {
  label_text: string;
  value: number | boolean;
  value_type: string;
  category: string;
  v1_status: string;
  runtime_effective: boolean;
  affix_spawn_enabled_v1: boolean;
};

type PlayerRuntimeState = {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  currentMana: number;
  maxMana: number;
  currentEnergyShield: number;
  maxEnergyShield: number;
};

type MonsterHitKind = "attack" | "spell";

type MonsterOffenseModifiers = Record<string, number>;

type CharacterPanelRowView = {
  id: string;
  stat_id: string;
  label_text: string;
  value: number | boolean;
  value_type: string;
  formatter: string;
  icon_text: string;
  tone: string;
  v1_status: string;
};

type CharacterPanelSectionView = {
  id: string;
  title_text: string;
  layout: "attributes" | "core" | "resistance" | "detail";
  rows: CharacterPanelRowView[];
};

type CharacterPanelView = {
  sections: CharacterPanelSectionView[];
};

type EnemyBuff = {
  buffType: string;
  statusType: string;
  polarity: "positive" | "negative";
  remaining: number;
  duration: number;
  valuePercent: number;
  baseValue?: number;
  baseDamagePerSecond?: number;
  damageType?: string;
  nextFloatingTextIn?: number;
  sourceSkillId: string;
};

type Enemy = {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  lastDamagedAt?: number;
  monsterId?: string;
  visualPrimaryColor?: string;
  authored?: boolean;
  boss?: boolean;
  spawnPlanSourceId?: string;
  proceduralMonsterPackId?: string;
  proceduralZoneType?: ProceduralZoneType;
  spawnRarity?: ProceduralSpawnRarity;
  lifeMultiplier?: number;
  damageMultiplier?: number;
  baseDamage?: number;
  damageType?: string;
  hitKind?: MonsterHitKind;
  attackRange?: number;
  attackCadenceMs?: number;
  offenseModifiers?: MonsterOffenseModifiers;
  aggroLocked?: boolean;
  runtimeTier?: EnemyRuntimeTier;
  attackStartedAtMs?: number;
  attackUntilMs?: number;
  nextAttackReadyAtMs?: number;
  nextThinkAt?: number;
  engagementTier?: EnemyEngagementTier;
  engagementRing?: number;
  engagementSlot?: number;
  velocityX?: number;
  velocityY?: number;
  navTargetGridX?: number;
  navTargetGridY?: number;
  activeBuffs?: EnemyBuff[];
};

type EncounterMonsterPalette = {
  primary: string;
};

type EnemyRuntimeTier = "dormant" | "aware" | "active" | "visible" | "dead";
type EnemyEngagementTier = "inner" | "outer";

type RuntimeEncounterAggroSource = {
  id: string;
  kind: "monster" | "boss";
  x: number;
  y: number;
  aggroRadius: number;
};

type FloatingText = {
  id: number;
  x: number;
  y: number;
  text: string;
  damageType: string;
  ttl: number;
  duration: number;
};

type PlayerBuff = {
  id: number;
  buffType: string;
  skillId: string;
  remaining: number;
  duration: number;
  remainingAmount: number;
  absorbPercent: number;
  excludeDamageOverTime: boolean;
  moveSpeedMultiplier?: number;
  vfxKey: string;
};

type FireBolt = {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  directionX: number;
  directionY: number;
  velocityX?: number;
  velocityY?: number;
  trajectory?: string;
  arcHeight?: number;
  projectileVisualMode?: string;
  targetId?: number;
  projectileId?: string;
  skillId?: string;
  projectileIndex?: number;
  projectileCount?: number;
  fanAngle?: number;
  localSpreadAngle?: number;
  pierceRemaining?: number;
  projectileSpeed?: number;
  projectileWidth?: number;
  projectileHeight?: number;
  splitProjectile?: boolean;
  impactRadius?: number;
  ttl: number;
  duration: number;
  fadeDuration: number;
  skillTemplateId: string;
  behaviorType: string;
  damageType: string;
  visualEffect: string;
  vfxKey: string;
  shapeEffects: ShapeEffectPreview[];
  areaScale: number;
  vfxScale?: number;
  pendingDamage?: boolean;
  damageAmount?: number;
  sourceSkillName?: string;
  sourceSkillInstanceId?: string;
};

type HitVfx = {
  id: number;
  x: number;
  y: number;
  targetId?: number;
  projectileId?: string;
  projectileIndex?: number;
  projectileCount?: number;
  pierceRemaining?: number;
  impactKind?: string;
  projectileWidth?: number;
  projectileHeight?: number;
  impactRadius?: number;
  ttl: number;
  duration: number;
  damageType: string;
  vfxKey: string;
  skillTemplateId?: string;
  shapeEffects: ShapeEffectPreview[];
  vfxScale?: number;
};

type AreaNova = {
  id: number;
  x: number;
  y: number;
  radius: number;
  ringWidth: number;
  ttl: number;
  duration: number;
  damageType: string;
  vfxKey: string;
  areaId?: string;
  skillId?: string;
  followPlayer?: boolean;
  vfxScale?: number;
};

type MeleeArcVfx = {
  id: number;
  x: number;
  y: number;
  radius: number;
  arcAngle: number;
  directionX: number;
  directionY: number;
  ttl: number;
  duration: number;
  damageType: string;
  vfxKey: string;
  arcId?: string;
  skillId?: string;
  vfxScale?: number;
};

type ChainSegmentVfx = {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  ttl: number;
  duration: number;
  damageType: string;
  vfxKey: string;
  segmentIndex: number;
  segmentId?: string;
  skillId?: string;
  vfxScale?: number;
};

type DamageZoneVfx = {
  id: number;
  x: number;
  y: number;
  shape: "circle" | "rectangle";
  radius: number;
  length: number;
  width: number;
  directionX: number;
  directionY: number;
  ttl: number;
  duration: number;
  hitAtMs?: number;
  damageType: string;
  vfxKey: string;
  zoneId?: string;
  skillId?: string;
  warning?: boolean;
  followPlayer?: boolean;
  vfxScale?: number;
  tickProgress?: number;
};

type ActiveDamageZoneRuntime = {
  zoneId: string;
  event: SkillEvent;
  payload: NonNullable<SkillEvent["payload"]>;
  origin: { x: number; y: number };
  direction: { x: number; y: number };
  shape: "circle" | "rectangle";
  radius: number;
  length: number;
  width: number;
  followPlayer: boolean;
  remainingMs: number;
  tickIntervalMs: number;
  nextTickMs: number;
  tickIndex: number;
  maxTargets: number;
  maxHits: number;
  maxHitsPerTarget: number;
  totalHits: number;
  hitCounts: Map<number, number>;
};

type ThundercloudChannelRuntime = {
  stacks: number;
  progressMs: number;
  noChannelMs: number;
  lockedMs: number;
};

type ScheduledSkillEvent = {
  event: SkillEvent;
  remaining: number;
};

type ContinuousAttackRuntime = {
  skillId: string;
  skill: SkillPreview;
  repeatsRemaining: number;
  nextRepeatIndex: number;
  remainingSeconds: number;
};

type RuntimeSkillEventsResponse = {
  ok: boolean;
  message_text: string;
  events: SkillEvent[];
};

type RuntimePerfSummary = {
  frame_ms: number;
  logic_ms: number;
  active_projectiles: number;
  active_hit_vfx: number;
  active_area_vfx: number;
  active_floating_text: number;
  active_enemies: number;
  scheduled_events: number;
  consumed_events_this_frame: number;
  dropped_frame_count: number;
};

type RuntimeBoundaryScanSummary = {
  status: "idle" | "running" | "done";
  tested: number;
  passed: number;
  failed: number;
  failures: string[];
};

type Tooltip = {
  gem: Gem;
  left: number;
  top: number;
  transform: string;
};

type FloatingOrigin =
  | { kind: "board"; row: number; column: number }
  | { kind: "bag"; slotIndex: number; instanceId: string }
  | { kind: "equipment"; slotIndex: number; slotId: string; instanceId: string };

type FloatingGem = {
  gem: Gem;
  origin: FloatingOrigin;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
};

type DropTarget =
  | { kind: "board"; row: number; column: number }
  | { kind: "bag"; slotIndex: number }
  | { kind: "equipment"; slotIndex: number; slotId: string }
  | { kind: "invalid" };

type PlacementResult =
  | { type: "place" }
  | { type: "swap"; nextFloatingItem: Gem; origin: FloatingOrigin }
  | { type: "reject"; reason?: "only_gems_on_board" };

type PlacementPrompt = {
  id: number;
  text: string;
  x: number;
  y: number;
};

type SupportPreview = {
  source: { row: number; column: number; instanceId: string };
  targets: { row: number; column: number; instanceId: string }[];
  color: string;
};

type SupportLine = {
  id: string;
  source: { row: number; column: number };
  target: { row: number; column: number };
  color: string;
};

type PreviewRelationType = "row" | "column" | "box" | "adjacent";

type PlacementPreview = {
  previewCell: { row: number; column: number };
  previewAffectedCells: Map<string, { types: PreviewRelationType[] }>;
  previewAffectedGems: Map<string, { labels: string[]; modifierCount: number }>;
  previewRelations: { row: number; column: number; types: PreviewRelationType[]; instanceId?: string }[];
  previewSkillSummary: string;
};

type Camera2D = {
  screenX: number;
  screenY: number;
  zoom: number;
};

type UnitVisualRuntime = {
  direction: UnitDirection;
  movementVector: { x: number; y: number };
  attackStartedAtMs?: number;
  attackUntilMs?: number;
};

type EnemyVisualRuntime = UnitVisualRuntime & {
  lastX: number;
  lastY: number;
};

type BattleRenderEntity =
  | { kind: "enemy"; id: number; x: number; y: number; hp: number; maxHp: number; lastDamagedAt?: number; monsterId?: string; spawnRarity?: ProceduralSpawnRarity; runtimeTier?: EnemyRuntimeTier; playerDistance: number; renderScale: number }
  | { kind: "player"; id: "player"; x: number; y: number; hp: number; maxHp: number; renderScale: number; guardActive: boolean };

type BattleRenderItem =
  | BattleRenderEntity
  | { kind: "fire-bolt"; id: number; x: number; y: number; bolt: FireBolt }
  | { kind: "hit-vfx"; id: number; x: number; y: number; vfx: HitVfx };

type BattleAnimationContexts = {
  player: UnitAnimationContext;
  enemies: Map<number, UnitAnimationContext>;
};

const DEFAULT_BAKED_BATTLE_MAP = BAKED_BATTLE_MAPS[0];
const MAP_WIDTH = DEFAULT_BAKED_BATTLE_MAP.meta.world_width;
const MAP_HEIGHT = DEFAULT_BAKED_BATTLE_MAP.meta.world_height;
const MAP_VISUAL_WIDTH = MAP_WIDTH;
const MAP_VISUAL_HEIGHT = MAP_HEIGHT;
const PLAYER_SPEED = 250;
const FLOATING_TEXT_VISUAL_RISE_SPEED = 22;
const BATTLE_CAMERA_ZOOM = 0.22;
const BATTLE_CAMERA_ANCHOR_X = "50vw";
const BATTLE_CAMERA_ANCHOR_Y = "54vh";
const BATTLE_CAMERA_FOLLOW_OFFSET_Y = 0;
const BATTLE_ENTITY_Z_INDEX_BASE = 10;
const CANVAS_GEOMETRY_BATTLE_OBJECTS = true;
const CANVAS_GEOMETRY_SKILL_EFFECTS = true;
const FIRE_BOLT_FAKE_Z = 22;
const FIRE_BOLT_PROJECTILE_FAKE_Z = 0;
const FIRE_BOLT_TRAIL_LENGTH = 0;
const FIRE_BOLT_IMPACT_DURATION_MS = 420;
const FIRE_BOLT_PROJECTILE_FRAME_ROW = 0;
const FIRE_BOLT_PROJECTILE_ART_FACING_OFFSET_DEG = 0;
const FIRE_BOLT_PROJECTILE_ART_FACING_OFFSET = FIRE_BOLT_PROJECTILE_ART_FACING_OFFSET_DEG * Math.PI / 180;
const PROJECTILE_BODY_EXIT_FADE_DURATION = 0.16;
const ICE_SHARDS_FAKE_Z = 24;
const ICE_SHARDS_PROJECTILE_FAKE_Z = 0;
const ICE_SHARDS_TRAIL_LENGTH = 8;
const ICE_SHARDS_IMPACT_DURATION_MS = 420;
const ICE_SHARDS_PROJECTILE_FRAME_ROW = 0;
const ICE_SHARDS_PROJECTILE_ART_FACING_OFFSET_DEG = 0;
const ICE_SHARDS_PROJECTILE_ART_FACING_OFFSET = ICE_SHARDS_PROJECTILE_ART_FACING_OFFSET_DEG * Math.PI / 180;
const PENETRATING_SHOT_PROJECTILE_FAKE_Z = 0;
const PENETRATING_SHOT_TRAIL_LENGTH = 6;
const PENETRATING_SHOT_IMPACT_DURATION_MS = 260;
const PENETRATING_SHOT_PROJECTILE_FRAME_ROW = 0;
const PENETRATING_SHOT_ART_FACING_OFFSET_DEG = 0;
const PENETRATING_SHOT_ART_FACING_OFFSET = PENETRATING_SHOT_ART_FACING_OFFSET_DEG * Math.PI / 180;
const RUNTIME_PERF_SYNC_INTERVAL_MS = 500;
const RUNTIME_DROPPED_FRAME_MS = 33;
const RUNTIME_SLOW_LOGIC_MS = 16;
const RUNTIME_MIN_FRAME_MS = 8;
const TRIGGERED_SKILL_EVENT_MIN_DELAY_SECONDS = 1 / 60;
const FRONTEND_EQUIPMENT_DROP_KIND_CHANCE = 0.75;
const FRONTEND_MAP_ENTRY_DROP_KIND_CHANCE = 0.20;
const FRONTEND_GEM_DROP_KIND_CHANCE = 0.05;
const MAX_RUNTIME_PROJECTILE_VISUALS = 80;
const MAX_RUNTIME_HIT_VFX = 80;
const MAX_RUNTIME_FLOATING_TEXT = 60;
const MAX_RUNTIME_AREA_VFX = 80;
const DOT_FLOATING_TEXT_INTERVAL_SECONDS = 0.5;
const MAX_SKILL_EDITOR_TIMELINE_ROWS = 40;
const ENEMY_SPATIAL_CHUNK_SIZE = 256;
const ENEMY_AWARE_RANGE = 900;
const ENEMY_ACTIVE_RANGE = 560;
const ENEMY_VISIBLE_RANGE = 760;
const ENEMY_CAMERA_VISIBLE_RANGE = 1180;
const ENEMY_INDIVIDUAL_AGGRO_RADIUS = 320;
const ENEMY_LOW_FREQUENCY_THINK_INTERVAL = 0.18;
const MAX_VISIBLE_ENEMY_DOM_NODES = 180;
const MAX_RUNTIME_SIMULATED_ENEMIES = 240;
const MONSTER_CHASE_SPEED_MULTIPLIER = 2;
const PLAYER_GEOMETRY_RADIUS = 18;
const ENEMY_MELEE_ATTACK_DISTANCE = 42;
const ENEMY_MELEE_ATTACK_RANGE_MAX = 120;
const ENEMY_MELEE_CONTACT_GAP = 4;
const ENEMY_MELEE_EDGE_CONTACT_TOLERANCE = 14;
const ENEMY_ATTACK_VISUAL_DURATION_MS = 640;
const ENEMY_ATTACK_VISUAL_COOLDOWN_MS = 520;
const ENEMY_WALK_VISUAL_DEADZONE = 0.35;
const ENEMY_HEALTH_VISIBLE_SECONDS = 5;
const ENEMY_DAMAGE_FLASH_SECONDS = 0.22;
const ENEMY_COLLISION_RADIUS = 25;
const ENEMY_BOSS_COLLISION_RADIUS = 40;
const ENEMY_COLLISION_MAX_PUSH = 2.2;
const ENEMY_PLAYER_CONTACT_HOLD_RADIUS = 42;
const ENEMY_PLAYER_CONTACT_SLOW_RADIUS = 84;
const ENEMY_PLAYER_BODY_SOFT_RADIUS = 0;
const ENEMY_PLAYER_BODY_REPEL_FORCE = 2.25;
const ENEMY_SWARM_INNER_RING_RADIUS = 88;
const ENEMY_SWARM_RING_SPACING = 30;
const ENEMY_SWARM_RING_COUNT = 4;
const ENEMY_SWARM_SEPARATION_RATIO = 1.04;
const ENEMY_SWARM_SEPARATION_FORCE = 1.2;
const ENEMY_SWARM_TANGENT_FORCE = 0;
const ENEMY_DIRECT_CHARGE_TANGENT_FORCE = 0.85;
const ENEMY_SWARM_MAX_REPEL = 1.35;
const ENEMY_SWARM_MIN_CHASE_WEIGHT = 0.58;
const ENEMY_SWARM_VELOCITY_LERP = 0.24;
const ENEMY_SWARM_DENSE_SLOWDOWN = 0.28;
const ENEMY_SOFT_OVERLAP_RATIO = 0.84;
const ENEMY_STEERING_LOOKAHEAD = 96;
const ENEMY_STEERING_NEIGHBOR_RADIUS = 128;
const ENEMY_STEERING_COMFORT_GAP = 4;
const ENEMY_STEERING_MIN_SPEED_SCALE = 0.48;
const ENEMY_STEERING_ANGLE_OFFSETS = [0, 18, -18, 36, -36, 58, -58, 82, -82, 112, -112].map((degrees) => degrees * Math.PI / 180);
const ENEMY_APPROACH_RING_RADIUS = 72;
const ENEMY_APPROACH_SIDE_STEP = 24;
const ENEMY_APPROACH_MAX_SIDE_OFFSET = 72;
const ENEMY_MELEE_SLOT_ANGLE_STEP = 22.5 * Math.PI / 180;
const ENEMY_CROWD_SCORE_RADIUS = 118;
const ENEMY_CROWD_SLOT_PENALTY = 34;
const ENEMY_WALL_CLEARANCE_RADIUS = 72;
const ENEMY_WALL_CLEARANCE_STEP = 24;
const ENEMY_WALL_COLLISION_PENALTY = 4.8;
const ENEMY_WALL_CLEARANCE_BONUS = 0.42;
const ENEMY_NAVIGATION_INF = 1_000_000;
const ENEMY_NAVIGATION_OCCUPANCY_COST = 8.5;
const ENEMY_NAVIGATION_WALL_COST = 3.6;
const ENEMY_NAVIGATION_LOCAL_OCCUPANCY_SCORE = 0.14;
const ENEMY_NAVIGATION_LOCAL_WALL_SCORE = 0.7;
const ENEMY_NAVIGATION_SWITCH_MARGIN = 0.72;
const ENEMY_NAVIGATION_TARGET_RADIUS_CELLS = 3;
const ENEMY_NAVIGATION_WALL_CHECK_RADIUS_CELLS = 2;
const ENEMY_NAVIGATION_DIRECTIONS = [
  { x: 1, y: 0, cost: 1 },
  { x: -1, y: 0, cost: 1 },
  { x: 0, y: 1, cost: 1 },
  { x: 0, y: -1, cost: 1 },
  { x: 1, y: 1, cost: Math.SQRT2 },
  { x: -1, y: 1, cost: Math.SQRT2 },
  { x: 1, y: -1, cost: Math.SQRT2 },
  { x: -1, y: -1, cost: Math.SQRT2 }
];
const SKILL_TEST_DUMMY_MAX_HP = 9999999;
const SKILL_TEST_DUMMY_OFFSETS = [
  { x: 300, y: 0 },
  { x: 420, y: -120 },
  { x: 420, y: 120 },
  { x: 560, y: -220 },
  { x: 560, y: 220 }
];
const ENCOUNTER_MONSTER_PALETTES: EncounterMonsterPalette[] = [
  { primary: "#EF4444" },
  { primary: "#F97316" },
  { primary: "#EAB308" },
  { primary: "#84CC16" },
  { primary: "#14B8A6" },
  { primary: "#38BDF8" },
  { primary: "#818CF8" },
  { primary: "#A78BFA" },
  { primary: "#F472B6" },
  { primary: "#94A3B8" }
];
const UNIT_RENDER_SCALE = 0.7;
const FLOATING_GEM_OFFSET = { x: 18, y: 18 };
const INVENTORY_SLOT_COUNT = 60;
const INVENTORY_COLUMNS = 12;
const EQUIPMENT_SLOT_SPECS = [
  { id: "head", label: "头部", accepts: ["head", "helmet", "helm", "头部", "头盔"] },
  { id: "chest", label: "胸甲", accepts: ["chest", "body", "armor", "armour", "胸甲", "护甲", "衣服"] },
  { id: "amulet", label: "项链", accepts: ["amulet", "necklace", "项链"] },
  { id: "gloves", label: "手套", accepts: ["gloves", "glove", "手套"] },
  { id: "belt", label: "腰带", accepts: ["belt", "腰带"] },
  { id: "boots", label: "鞋子", accepts: ["boots", "shoes", "鞋子", "鞋", "靴子"] },
  { id: "ring_1", label: "戒指1", accepts: ["ring", "戒指", "灵戒"] },
  { id: "ring_2", label: "戒指2", accepts: ["ring", "戒指", "灵戒"] },
  { id: "main_weapon", label: "主武器", accepts: ["main_weapon", "weapon", "weapons", "武器", "主武器"] },
  { id: "off_weapon", label: "副武器", accepts: ["off_weapon", "offhand", "off_hand", "weapon", "weapons", "武器", "副武器", "副手"] }
] as const;
const EQUIPMENT_SLOT_COUNT = EQUIPMENT_SLOT_SPECS.length;
const MAIN_WEAPON_SLOT_INDEX = 8;
const OFF_WEAPON_SLOT_INDEX = 9;
const WEAPON_SLOT_INDICES = [MAIN_WEAPON_SLOT_INDEX, OFF_WEAPON_SLOT_INDEX] as const;
const TOOLTIP_WIDTH = 410;
const TOOLTIP_SCREEN_PADDING = 8;
const FRONTEND_AUTOSAVE_STORAGE_KEY = "poe2.v1.frontend.autosave";
const FRONTEND_ACTIVE_SAVE_SLOT_STORAGE_KEY = "poe2.v1.frontend.active_save_slot";
const FRONTEND_SAVE_SLOT_KEY_PREFIX = "poe2.v1.frontend.save.slot.";
const FRONTEND_SAVE_SLOT_COUNT = 5;
const FRONTEND_SAVE_VERSION = 1;

type FrontendSaveSlotSummary = {
  id: number;
  save: FrontendSavePayload | null;
  errorText: string;
};

function cloneFrontendData<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

function frontendSkillTagForGem(gem: Gem) {
  return gem.tags.find((tag) => typeof tag.id === "string" && tag.id.startsWith("skill_"))?.id ?? "";
}

function frontendEquippedEquipmentModifiers(state: AppState) {
  const byId = new Map(state.inventory.map((item) => [item.instance_id, item]));
  const equippedIds = new Set((state.equipment_slots ?? []).slice(0, EQUIPMENT_SLOT_COUNT).filter(Boolean) as string[]);
  const modifiers: FrontendEquipmentStatModifier[] = [];
  equippedIds.forEach((instanceId) => {
    modifiers.push(...(byId.get(instanceId)?.equipment_stat_modifiers ?? []));
  });
  return modifiers;
}

function recalculateFrontendSkillPreview(state: AppState): AppState {
  const nextSkills: SkillPreview[] = [];
  const equipmentSkillModifiers = frontendEquippedEquipmentModifiers(state).filter((modifier) => modifier.kind !== "player_stat");
  const itemById = new Map(state.inventory.map((item) => [item.instance_id, item]));
  for (const row of state.board.cells) {
    for (const cell of row) {
      const gem = cell.gem;
      if (!gem || gem.gem_kind !== "active_skill") continue;
      const skillTag = frontendSkillTagForGem(gem);
      const template = (FRONTEND_SKILL_PREVIEWS_BY_SKILL_TAG as Record<string, SkillPreview>)[skillTag];
      if (!template) continue;
      const fullGem = itemById.get(gem.instance_id) ?? gem;
      const supportModifiers = frontendSupportSkillModifiersForTarget(state, fullGem, template, equipmentSkillModifiers, itemById);
      nextSkills.push(applyFrontendEquipmentSkillModifiers({
        ...frontendSkillPreviewForGemLevel(cloneFrontendData(template), fullGem),
        active_gem_instance_id: fullGem.instance_id,
        name_text: fullGem.name_text,
      }, fullGem, [...supportModifiers.modifiers, ...equipmentSkillModifiers], supportModifiers.appliedModifiers));
    }
  }
  return {
    ...state,
    skill_preview: nextSkills,
    skill_error: null,
  };
}

function frontendSupportSkillModifiersForTarget(
  state: AppState,
  targetGem: Gem,
  skill: SkillPreview,
  equipmentSkillModifiers: FrontendEquipmentStatModifier[],
  itemById: Map<string, Gem>
) {
  const modifiers: FrontendEquipmentStatModifier[] = [];
  const appliedModifiers: SkillPreview["applied_modifiers"] = [];
  const targetTags = new Set(targetGem.tags.map((tag) => tag.id ?? tag.text));
  const supportLevelAdd = Math.max(0, Math.floor(equipmentSkillModifiers
    .filter((modifier) => modifier.kind !== "runtime_hook" && modifier.stat === "support_gem_level_add")
    .reduce((total, modifier) => total + modifier.value, 0)));
  for (const sourceCell of state.board.cells.flat()) {
    const sourceGem = sourceCell.gem ? itemById.get(sourceCell.gem.instance_id) ?? sourceCell.gem : null;
    if (!sourceGem || sourceGem.instance_id === targetGem.instance_id || !isSupportGem(sourceGem)) continue;
    if (!isAllowedRoute(sourceGem, targetGem)) continue;
    const relation = frontendBoardRelation(sourceGem.board_position, targetGem.board_position);
    if (!relation) continue;
    if (!frontendSupportCanAffect(sourceGem, targetTags)) continue;
    const supportLevel = frontendSupportEffectiveLevel(sourceGem, supportLevelAdd);
    for (const modifier of frontendGemBaseModifiers(sourceGem)) {
      const stat = String(frontendRecord(modifier.stat).id ?? "");
      if (!stat) continue;
      const baseValue = Number(modifier.value ?? 0);
      const value = frontendSkillLevelTableValueById(String(sourceGem.base_gem_id ?? sourceGem.instance_id), supportLevel, stat) ?? baseValue;
      if (!Number.isFinite(value) || value === 0) continue;
      modifiers.push({
        source_modifier_id: `${sourceGem.instance_id}:${targetGem.instance_id}:${stat}`,
        kind: "skill_stat",
        stat,
        value: value * frontendRelationCoefficient(relation),
        reason_key: "modifier.support_base",
      });
      appliedModifiers.push({
        source_instance_id: sourceGem.instance_id,
        source_name_text: sourceGem.name_text,
        target_instance_id: targetGem.instance_id,
        stat: { text: String(frontendRecord(modifier.stat).text ?? stat) },
        value,
        relation_text: frontendRelationText(relation),
        reason_text: supportLevelAdd ? `辅助等级 ${supportLevel}` : "辅助基础效果",
        applied: true,
      });
    }
  }
  return { modifiers, appliedModifiers };
}

function frontendSkillPreviewForGemLevel(skill: SkillPreview, gem: Gem): SkillPreview {
  const sourceContext = frontendRecord(skill.source_context);
  const templateLevel = Math.max(1, Math.floor(Number(sourceContext.effective_gem_level ?? sourceContext.base_gem_level ?? 1)));
  const targetLevel = frontendSkillClampedLevel(skill, Math.max(1, Math.floor(Number(gem.level ?? templateLevel))));
  const levelValues = frontendSkillLevelTableValues(skill, targetLevel);

  const currentBaseDamage = frontendSkillLevelValue(skill, "base_damage", templateLevel, Number(skill.base_damage ?? skill.final_damage ?? 0), templateLevel);
  const targetBaseDamage = frontendLevelValueNumber(levelValues, "base_damage", frontendSkillLevelValue(skill, "base_damage", targetLevel, currentBaseDamage, templateLevel));
  const damageScale = currentBaseDamage > 0 && targetBaseDamage > 0 ? targetBaseDamage / currentBaseDamage : 1;
  const nextHit = { ...(skill.hit ?? {}) };
  const hitComponentTotal = frontendDamageMapTotal(nextHit.damage_components);
  const hitConfigScale = hitComponentTotal > 0 && targetBaseDamage > 0 ? targetBaseDamage / hitComponentTotal : damageScale;
  if (typeof nextHit.base_damage === "number") nextHit.base_damage = targetBaseDamage;
  if (nextHit.damage_components && typeof nextHit.damage_components === "object" && !Array.isArray(nextHit.damage_components)) {
    nextHit.damage_components = frontendLevelDamageComponents(levelValues, "hit_damage_component_") ?? normalizeFrontendDamageMapTotal(nextHit.damage_components, targetBaseDamage);
  }
  if (Array.isArray(nextHit.ailments)) {
    nextHit.ailments = applyFrontendAilmentLevelValues(nextHit.ailments, levelValues, "hit_ailment_");
  }
  if (Array.isArray(nextHit.secondary_hits)) {
    nextHit.secondary_hits = nextHit.secondary_hits.map((secondary) => scaleFrontendSkillHitDamage(secondary, hitConfigScale, levelValues));
  }
  const nextRuntimeParams = { ...(skill.runtime_params ?? {}) };
  for (const [key, value] of Object.entries(levelValues)) {
    if (["base_damage", "mana_cost", "release_interval_ms", "base_cooldown_ms", "trigger_interval_ms"].includes(key)) continue;
    nextRuntimeParams[key] = value;
  }
  if (Array.isArray(nextRuntimeParams.modules)) {
    nextRuntimeParams.modules = applyFrontendModuleLevelValues(nextRuntimeParams.modules, levelValues);
  }
  if (Number(nextRuntimeParams.split_projectile_base_damage ?? 0) > 0 && targetBaseDamage > 0) {
    nextRuntimeParams.split_projectile_damage_multiplier = Number(nextRuntimeParams.split_projectile_base_damage) / targetBaseDamage;
  }
  return {
    ...skill,
    base_damage: targetBaseDamage,
    final_damage: Number(skill.final_damage ?? 0) * damageScale,
    non_crit_damage: Number(skill.non_crit_damage ?? skill.final_damage ?? 0) * damageScale,
    expected_hit_damage: Number(skill.expected_hit_damage ?? skill.final_damage ?? 0) * damageScale,
    preview_dps: Number(skill.preview_dps ?? 0) * damageScale,
    base_damage_components: scaleFrontendDamageMap(skill.base_damage_components, damageScale),
    final_damage_components: scaleFrontendDamageMap(skill.final_damage_components, damageScale),
    hit: nextHit,
    cast: {
      ...(skill.cast ?? {}),
      ...(typeof levelValues.release_interval_ms === "number" ? { release_interval_ms: levelValues.release_interval_ms } : {}),
      ...(typeof levelValues.base_cooldown_ms === "number" ? { base_cooldown_ms: levelValues.base_cooldown_ms } : {}),
      ...(typeof levelValues.trigger_interval_ms === "number" ? { trigger_interval_ms: levelValues.trigger_interval_ms } : {}),
      ...(typeof levelValues.mana_cost === "number" ? { mana_cost: levelValues.mana_cost } : {}),
    },
    base_release_interval_ms: typeof levelValues.release_interval_ms === "number" ? levelValues.release_interval_ms : skill.base_release_interval_ms,
    release_interval_ms: typeof levelValues.release_interval_ms === "number" ? levelValues.release_interval_ms : skill.release_interval_ms,
    base_cooldown_ms: typeof levelValues.base_cooldown_ms === "number" ? levelValues.base_cooldown_ms : skill.base_cooldown_ms,
    final_cooldown_ms: typeof levelValues.base_cooldown_ms === "number" ? levelValues.base_cooldown_ms : skill.final_cooldown_ms,
    actual_interval_ms: typeof levelValues.release_interval_ms === "number" ? levelValues.release_interval_ms : skill.actual_interval_ms,
    trigger_interval_ms: typeof levelValues.trigger_interval_ms === "number" ? levelValues.trigger_interval_ms : skill.trigger_interval_ms,
    mana_cost: typeof levelValues.mana_cost === "number" ? levelValues.mana_cost : skill.mana_cost,
    runtime_params: nextRuntimeParams,
    source_context: {
      ...sourceContext,
      base_gem_level: targetLevel,
      effective_gem_level: targetLevel,
      level_values: levelValues,
    } as SkillPreview["source_context"],
  };
}

function frontendSkillClampedLevel(skill: SkillPreview, level: number) {
  const table = (FRONTEND_SKILL_LEVEL_TABLES as Record<string, Record<number, Record<string, number>>>)[String(skill.base_gem_id ?? skill.skill_package_id ?? "")];
  const levels = table ? Object.keys(table).map(Number).filter(Number.isFinite).sort((a, b) => a - b) : [];
  if (levels.length === 0) return Math.max(1, Math.min(40, level));
  return clamp(level, levels[0], levels[levels.length - 1]);
}

function frontendSkillLevelTableValues(skill: SkillPreview, level: number): Record<string, number> {
  const table = (FRONTEND_SKILL_LEVEL_TABLES as Record<string, Record<number, Record<string, number>>>)[String(skill.base_gem_id ?? skill.skill_package_id ?? "")];
  return { ...(table?.[level] ?? {}) };
}

function frontendLevelValueNumber(levelValues: Record<string, number>, key: string, fallback: number) {
  const value = levelValues[key];
  return Number.isFinite(value) ? value : fallback;
}

function scaleFrontendDamageMap(value: unknown, scale: number) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([damageType, amount]) => [damageType, Number(amount ?? 0) * scale])
  );
}

function normalizeFrontendDamageMapTotal(value: unknown, targetTotal: number) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const entries = Object.entries(value as Record<string, unknown>)
    .map(([damageType, amount]) => [damageType, Number(amount ?? 0)] as const)
    .filter(([, amount]) => Number.isFinite(amount) && amount > 0);
  const currentTotal = frontendDamageMapEntriesTotal(entries);
  if (currentTotal <= 0 || targetTotal <= 0) return value;
  const scale = targetTotal / currentTotal;
  return Object.fromEntries(entries.map(([damageType, amount]) => [damageType, amount * scale]));
}

function frontendDamageMapTotal(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return 0;
  return frontendDamageMapEntriesTotal(
    Object.entries(value as Record<string, unknown>)
      .map(([, amount]) => Number(amount ?? 0))
      .filter((amount) => Number.isFinite(amount) && amount > 0)
  );
}

function frontendDamageMapEntriesTotal(entries: readonly (readonly [string, number])[] | readonly number[]) {
  return entries.reduce((total, entry) => total + (Array.isArray(entry) ? entry[1] : entry), 0);
}

function scaleFrontendSkillHitDamage<T extends Record<string, unknown>>(hit: T, scale: number, levelValues: Record<string, number> = {}): T {
  const next = { ...hit };
  const hitId = frontendSafeLevelKeyFragment(String(next.id ?? "secondary_hit"));
  const prefix = `secondary_hit_${hitId}`;
  const levelBaseDamage = frontendOptionalLevelNumber(levelValues, `${prefix}_base_damage`);
  const levelWeaponAttackPercent = frontendOptionalLevelNumber(levelValues, `${prefix}_weapon_attack_percent`);
  if (typeof next.base_damage === "number") next.base_damage = levelBaseDamage ?? next.base_damage * scale;
  if (typeof next.weapon_attack_percent === "number") next.weapon_attack_percent = levelWeaponAttackPercent ?? next.weapon_attack_percent * scale;
  if (next.damage_components && typeof next.damage_components === "object" && !Array.isArray(next.damage_components)) {
    next.damage_components = frontendLevelDamageComponents(levelValues, `${prefix}_damage_component_`) ?? scaleFrontendDamageMap(next.damage_components, scale);
  }
  if (Array.isArray(next.ailments)) {
    next.ailments = applyFrontendAilmentLevelValues(next.ailments, levelValues, `${prefix}_ailment_`);
  }
  return next;
}

function frontendLevelDamageComponents(levelValues: Record<string, number>, prefix: string): Record<string, number> | null {
  const entries = Object.entries(levelValues)
    .filter(([key, value]) => key.startsWith(prefix) && Number.isFinite(value))
    .map(([key, value]) => [key.slice(prefix.length), value] as const)
    .filter(([damageType]) => damageType.length > 0);
  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

function frontendOptionalLevelNumber(levelValues: Record<string, number>, key: string): number | null {
  const value = levelValues[key];
  return Number.isFinite(value) ? value : null;
}

function frontendSafeLevelKeyFragment(value: string) {
  return value.replace(/[^0-9A-Za-z_]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase();
}

function applyFrontendAilmentLevelValues(ailments: unknown[], levelValues: Record<string, number>, prefix: string): unknown[] {
  return ailments.map((ailment) => {
    if (!ailment || typeof ailment !== "object" || Array.isArray(ailment)) return ailment;
    const next = { ...(ailment as Record<string, unknown>) };
    const type = frontendSafeLevelKeyFragment(String(next.type ?? "unknown"));
    const baseDamagePerSecond = frontendOptionalLevelNumber(levelValues, `${prefix}${type}_base_damage_per_second`);
    if (baseDamagePerSecond !== null) next.base_damage_per_second = baseDamagePerSecond;
    return next;
  });
}

function applyFrontendModuleLevelValues(modules: unknown[], levelValues: Record<string, number>): unknown[] {
  return modules.map((module) => {
    if (!module || typeof module !== "object" || Array.isArray(module)) return module;
    const next = { ...(module as Record<string, unknown>) };
    const moduleId = frontendSafeLevelKeyFragment(String(next.id ?? "module"));
    const params = next.params;
    if (params && typeof params === "object" && !Array.isArray(params)) {
      const nextParams = { ...(params as Record<string, unknown>) };
      for (const key of Object.keys(nextParams)) {
        const levelValue = frontendOptionalLevelNumber(levelValues, `module_${moduleId}_${key}`);
        if (levelValue !== null) nextParams[key] = levelValue;
      }
      next.params = nextParams;
    }
    return next;
  });
}

function frontendSupportEffectiveLevel(sourceGem: Gem, supportLevelAdd: number) {
  const baseGemId = String(sourceGem.base_gem_id ?? sourceGem.instance_id);
  const table = (FRONTEND_SKILL_LEVEL_TABLES as Record<string, Record<number, Record<string, number>>>)[baseGemId];
  const levels = table ? Object.keys(table).map(Number).filter(Number.isFinite).sort((a, b) => a - b) : [];
  const currentLevel = Math.max(1, Math.floor(Number(sourceGem.level ?? 1)));
  if (levels.length === 0) return currentLevel + supportLevelAdd;
  return clamp(currentLevel + supportLevelAdd, levels[0], levels[levels.length - 1]);
}

function frontendGemBaseModifiers(gem: Gem) {
  const baseEffect = frontendRecord(frontendRecord(gem).base_effect);
  const modifiers = baseEffect.modifiers;
  return Array.isArray(modifiers) ? modifiers.map(frontendRecord) : [];
}

function frontendSupportCanAffect(sourceGem: Gem, targetTags: Set<string>) {
  const canAffect = frontendRecord(frontendRecord(sourceGem).can_affect);
  const anyTags = frontendTagIds(canAffect.tags_any);
  const allTags = frontendTagIds(canAffect.tags_all);
  const noneTags = frontendTagIds(canAffect.tags_none);
  if (anyTags.length > 0 && !anyTags.some((tag) => targetTags.has(tag))) return false;
  if (allTags.some((tag) => !targetTags.has(tag))) return false;
  if (noneTags.some((tag) => targetTags.has(tag))) return false;
  return true;
}

function frontendTagIds(value: unknown) {
  return Array.isArray(value)
    ? value.map((entry) => String(frontendRecord(entry).id ?? frontendRecord(entry).text ?? "")).filter(Boolean)
    : [];
}

function frontendBoardRelation(source: Gem["board_position"], target: Gem["board_position"]) {
  if (!source || !target) return "";
  if (Math.abs(source.row - target.row) + Math.abs(source.column - target.column) === 1) return "adjacent";
  if (source.row === target.row) return "same_row";
  if (source.column === target.column) return "same_column";
  if (Math.floor(source.row / 3) === Math.floor(target.row / 3) && Math.floor(source.column / 3) === Math.floor(target.column / 3)) return "same_box";
  return "";
}

function frontendRelationCoefficient(relation: string) {
  return relation === "adjacent" ? 1.25 : 1;
}

function frontendRelationText(relation: string) {
  if (relation === "adjacent") return "相邻";
  if (relation === "same_row") return "同行";
  if (relation === "same_column") return "同列";
  if (relation === "same_box") return "同宫";
  return relation;
}

function applyFrontendEquipmentSkillModifiers(
  skill: SkillPreview,
  gem: Gem,
  modifiers: FrontendEquipmentStatModifier[],
  appliedModifiers: SkillPreview["applied_modifiers"] = []
): SkillPreview {
  if (modifiers.length === 0) return skill;
  const skillStats = { ...(skill.skill_stats ?? {}) };
  for (const modifier of modifiers) {
    if (modifier.kind === "runtime_hook") continue;
    const stat = modifier.reason_key === "modifier.equipment_affix"
      ? frontendEquipmentAttackAddedDamageStat(modifier) || modifier.stat
      : modifier.stat;
    skillStats[stat] = Number(skillStats[stat] ?? 0) + modifier.value;
  }
  const tags = new Set(gem.tags.map((tag) => tag.id ?? tag.text));
  const damageType = skill.damage_type;
  const skillLevelAdd = frontendEquipmentSkillLevelAdd(skill, gem, skillStats, tags);
  const levelDamageScale = frontendSkillLevelDamageScale(skill, gem, skillLevelAdd);
  if (skillLevelAdd) skillStats.equipment_skill_level_add = skillLevelAdd;
  const finalPercent =
    statValue(skillStats, "damage_final_percent")
    + statValue(skillStats, "hit_damage_final_percent")
    + (tags.has("attack") ? statValue(skillStats, "attack_damage_final_percent") : 0)
    + (tags.has("spell") ? statValue(skillStats, "spell_damage_final_percent") : 0);
  const baselineDamage = Number(skill.final_damage ?? 0) * levelDamageScale;
  const addedDamageEffectiveness = Math.max(0, statValue(skillStats, "added_damage_effectiveness_percent") || 100) / 100;
  const baseComponents = frontendSkillBaseDamageComponents(skill, damageType, baselineDamage);
  addFrontendDamageComponent(baseComponents, damageType, statValue(skillStats, "added_damage") * addedDamageEffectiveness);
  addFrontendDamageComponent(baseComponents, "physical", statValue(skillStats, "added_physical_damage") * addedDamageEffectiveness);
  addFrontendDamageComponent(baseComponents, "fire", statValue(skillStats, "added_fire_damage") * addedDamageEffectiveness);
  addFrontendDamageComponent(baseComponents, "cold", statValue(skillStats, "added_cold_damage") * addedDamageEffectiveness);
  addFrontendDamageComponent(baseComponents, "lightning", statValue(skillStats, "added_lightning_damage") * addedDamageEffectiveness);
  addFrontendDamageComponent(baseComponents, "chaos", statValue(skillStats, "added_chaos_damage") * addedDamageEffectiveness);
  if (tags.has("attack")) {
    addFrontendDamageComponent(baseComponents, "physical", statValue(skillStats, "weapon_attack_base_damage"));
  }
  const convertedComponents = convertFrontendDamageComponents(baseComponents, frontendDamageConversions(skill));
  const finalDamageComponents = Object.fromEntries(Object.entries(convertedComponents)
    .map(([componentType, componentAmount]) => [
      componentType,
      Math.max(0, componentAmount * (1 + frontendComponentAdditivePercent(componentType, skillStats, tags) / 100) * (1 + finalPercent / 100))
    ])
    .filter(([, componentAmount]) => componentAmount > 0));
  const nextDamage = Object.values(finalDamageComponents).reduce((total, value) => total + value, 0);
  const attackSpeed = tags.has("attack") ? statValue(skillStats, "attack_speed_add_percent") : 0;
  const castSpeed = tags.has("spell") ? statValue(skillStats, "cast_speed_add_percent") : 0;
  const speedMultiplier = Math.max(0.05, 1 + (attackSpeed + castSpeed) / 100);
  const runtimeParams = { ...(skill.runtime_params ?? {}) };
  for (const modifier of modifiers) {
    if (modifier.kind === "runtime_hook" && modifier.payload && typeof modifier.payload === "object") {
      Object.assign(runtimeParams, modifier.payload);
    }
  }
  const grantedEffects = frontendEquipmentGrantedEffects(modifiers, skillStats, tags, finalPercent, addedDamageEffectiveness, damageType);
  if (grantedEffects.length > 0) runtimeParams.frontend_equipment_granted_effects = grantedEffects;
  for (const key of [
    "armor_reduction_penetration_percent",
    "cull_threshold_percent",
    "double_damage_chance_percent",
    "continuous_attack_chance_percent",
    "continuous_attack_damage_step_percent",
    "continuous_attack_damage_step_final_percent",
    "duration_add_percent",
    "resistance_penetration_percent",
    "movement_skill_cooldown_recovery_add_percent",
    "aura_effect_add_percent",
    "dot_damage_add_percent",
    "ailment_damage_add_percent",
    "ailment_damage_deepen_percent",
    "numbed_effect_add_percent",
    "deterioration_chance_add_percent",
    "deterioration_damage_add_percent",
    "deterioration_duration_add_percent",
    "added_base_ignite_damage_per_second",
    "added_base_trauma_damage_per_second",
    "added_base_ailment_damage_per_second",
    "aggravation_value_add",
    "aggravation_effect_add_percent",
    "frostbite_max_value_add",
    "ailment_duration_add_percent",
    "ignite_duration_add_percent",
    "trauma_duration_add_percent",
    "ignite_stacks_add",
  ]) {
    const value = statValue(skillStats, key);
    if (value) runtimeParams[key] = value;
  }
  addRuntimeParam(runtimeParams, "split_projectile_count", statValue(skillStats, "split_projectile_count_add"));
  addRuntimeParam(runtimeParams, "pierce_count", statValue(skillStats, "pierce_count_add"));
  addRuntimeParam(runtimeParams, "chain_count", statValue(skillStats, "chain_count_add"));
  addRuntimeParam(runtimeParams, "channel_max_stacks", statValue(skillStats, "channel_max_stacks_add"));
  addRuntimeParam(runtimeParams, "channel_min_stacks", statValue(skillStats, "channel_min_stacks_add"));
  addRuntimeParam(runtimeParams, "slash_chance_percent", statValue(skillStats, "slash_chance_add_percent"));
  runtimeParams.frontend_skill_tags = [...tags];
  scaleRuntimeParam(runtimeParams, "projectile_speed", statValue(skillStats, "projectile_speed_add_percent"));
  scaleFrontendRuntimeDurations(runtimeParams, statValue(skillStats, "duration_add_percent"));
  const projectileCount = Math.max(1, Math.round(Number(skill.projectile_count ?? 1) + statValue(skillStats, "projectile_count_add")));
  const critChance = frontendExpectedCritChance(skill, skillStats);
  const critMultiplier = frontendExpectedCritMultiplier(skill, skillStats);
  const expectedHitDamage = nextDamage * ((1 - critChance) + critChance * critMultiplier);
  const movementCooldownRecovery = tags.has("movement") || tags.has("skill_movement")
    ? statValue(skillStats, "movement_skill_cooldown_recovery_add_percent")
    : 0;
  return {
    ...skill,
    skill_stats: skillStats,
    source_context: skillLevelAdd ? frontendSkillSourceContextWithEquipmentLevel(skill, gem, skillLevelAdd) : skill.source_context,
    final_damage: nextDamage,
    final_damage_components: finalDamageComponents,
    non_crit_damage: nextDamage,
    crit_chance: critChance,
    crit_multiplier: critMultiplier,
    expected_hit_damage: expectedHitDamage,
    preview_dps: Number(skill.preview_dps ?? 0) > 0 ? Number(skill.preview_dps) * (expectedHitDamage / Math.max(1, baselineDamage)) * speedMultiplier : skill.preview_dps,
    actual_interval_ms: Math.max(1, Number(skill.actual_interval_ms ?? 1000) / speedMultiplier),
    final_cooldown_ms: Math.max(0, Number(skill.final_cooldown_ms ?? 0) / Math.max(0.05, 1 + (statValue(skillStats, "cooldown_recovery_add_percent") + movementCooldownRecovery) / 100)),
    projectile_count: projectileCount,
    area_multiplier: Number(skill.area_multiplier ?? 1) * Math.max(0.05, 1 + statValue(skillStats, "area_add_percent") / 100),
    runtime_params: runtimeParams,
    applied_modifiers: [...(skill.applied_modifiers ?? []), ...appliedModifiers],
  };
}

function frontendEquipmentAttackAddedDamageStat(modifier: FrontendEquipmentStatModifier) {
  if (modifier.kind !== "damage_stat") return "";
  if (modifier.stat === "added_damage") return "equipment_attack_added_damage";
  const match = modifier.stat.match(/^added_(physical|fire|cold|lightning|chaos)_damage$/);
  return match ? `equipment_attack_added_${match[1]}_damage` : "";
}

function frontendEquipmentGrantedEffects(
  modifiers: FrontendEquipmentStatModifier[],
  skillStats: Record<string, number | boolean>,
  tags: Set<string>,
  finalPercent: number,
  addedDamageEffectiveness: number,
  primaryDamageType: string
) {
  return modifiers
    .map((modifier) => frontendEquipmentGrantedEffect(modifier, skillStats, tags, finalPercent, addedDamageEffectiveness, primaryDamageType))
    .filter((effect): effect is Record<string, unknown> => Boolean(effect));
}

function frontendEquipmentGrantedEffect(
  modifier: FrontendEquipmentStatModifier,
  skillStats: Record<string, number | boolean>,
  tags: Set<string>,
  finalPercent: number,
  addedDamageEffectiveness: number,
  primaryDamageType: string
) {
  if (modifier.reason_key !== "modifier.equipment_affix" || modifier.kind !== "damage_stat") return null;
  const damageType = frontendAddedDamageStatType(modifier.stat);
  if (!damageType) return null;
  const resolvedDamageType = damageType === "generic" ? primaryDamageType : damageType;
  const multiplier = addedDamageEffectiveness * (1 + frontendComponentAdditivePercent(resolvedDamageType, skillStats, tags) / 100) * (1 + finalPercent / 100);
  return {
    id: `equipment_affix.${modifier.source_modifier_id}.${modifier.stat}`,
    effect_kind: "direct_damage",
    trigger_condition: frontendEquipmentGrantedEffectTriggerCondition(modifier),
    direct_damage_module_id: `equipment_affix.${modifier.source_modifier_id}.direct_damage`,
    damage_type: damageType,
    value: modifier.value,
    value_min: modifier.value_min ?? modifier.value,
    value_max: modifier.value_max ?? modifier.value,
    damage_multiplier: multiplier,
    source_modifier_id: modifier.source_modifier_id,
  };
}

function frontendAddedDamageStatType(stat: string) {
  if (stat === "added_damage") return "generic";
  const match = stat.match(/^added_(physical|fire|cold|lightning|chaos)_damage$/);
  return match?.[1] ?? "";
}

function frontendEquipmentGrantedEffectTriggerCondition(modifier: FrontendEquipmentStatModifier) {
  const payloadCondition = modifier.payload?.trigger_condition;
  if (typeof payloadCondition === "string" && payloadCondition) return payloadCondition;
  if (modifier.source_text?.includes("法术附加")) return "spell_hit";
  return "attack_hit";
}

function attributeScaledDamageAddPercent(skillStats: Record<string, number | boolean>) {
  const attributes = statValue(skillStats, "strength") + statValue(skillStats, "dexterity") + statValue(skillStats, "intelligence");
  return Math.floor(attributes / 12) * statValue(skillStats, "damage_add_percent_per_12_attributes")
    + Math.floor(attributes / 27) * statValue(skillStats, "damage_add_percent_per_27_attributes");
}

function frontendSkillBaseDamageComponents(skill: SkillPreview, fallbackDamageType: string, baselineDamage: number) {
  const existing = skill.final_damage_components;
  if (existing && typeof existing === "object" && !Array.isArray(existing)) {
    return Object.fromEntries(Object.entries(existing).map(([damageType, value]) => [damageType, Number(value ?? 0)]));
  }
  return { [fallbackDamageType]: baselineDamage };
}

function addFrontendDamageComponent(components: Record<string, number>, damageType: string, amount: number) {
  if (!Number.isFinite(amount) || amount === 0) return;
  components[damageType] = (components[damageType] ?? 0) + amount;
}

function frontendDamageConversions(skill: SkillPreview, hitConfig?: Record<string, unknown>) {
  return Array.isArray(hitConfig?.damage_conversions)
    ? hitConfig.damage_conversions as Record<string, unknown>[]
    : Array.isArray(skill.hit?.damage_conversions)
      ? skill.hit.damage_conversions as Record<string, unknown>[]
      : [];
}

function convertFrontendDamageComponents(components: Record<string, number>, conversions: Record<string, unknown>[]) {
  const converted: Record<string, number> = {};
  for (const [damageType, rawAmount] of Object.entries(components)) {
    let remainder = Math.max(0, Number(rawAmount ?? 0));
    const matchingConversions = conversions
      .filter((conversion) => String(conversion.from ?? "") === damageType && typeof conversion.to === "string")
      .map((conversion) => ({ to: String(conversion.to), percent: Math.max(0, Number(conversion.percent ?? 0)) }));
    if (matchingConversions.length === 0) {
      addFrontendDamageComponent(converted, damageType, remainder);
      continue;
    }
    const totalPercent = matchingConversions.reduce((total, conversion) => total + conversion.percent, 0);
    const scale = totalPercent > 100 ? 100 / totalPercent : 1;
    for (const conversion of matchingConversions) {
      const amount = Math.max(0, rawAmount * conversion.percent * scale / 100);
      remainder -= amount;
      addFrontendDamageComponent(converted, conversion.to, amount);
    }
    if (remainder > 0.000001) addFrontendDamageComponent(converted, damageType, remainder);
  }
  return converted;
}

function frontendComponentAdditivePercent(
  damageType: string,
  skillStats: Record<string, number | boolean>,
  tags: Set<string>
) {
  const elementalDamageAdd = ["fire", "cold", "lightning"].includes(damageType)
    ? statValue(skillStats, "elemental_damage_add_percent")
    : 0;
  return statValue(skillStats, "damage_add_percent")
    + statValue(skillStats, `${damageType}_damage_add_percent`)
    + elementalDamageAdd
    + statValue(skillStats, "hit_damage_add_percent")
    + (tags.has("attack") ? statValue(skillStats, "attack_damage_add_percent") : 0)
    + (tags.has("spell") ? statValue(skillStats, "spell_damage_add_percent") : 0)
    + (tags.has("projectile") ? statValue(skillStats, "projectile_damage_add_percent") : 0)
    + (tags.has("projectile") || tags.has("ranged") ? statValue(skillStats, "ranged_damage_add_percent") : 0)
    + (tags.has("melee") ? statValue(skillStats, "melee_damage_add_percent") : 0)
    + attributeScaledDamageAddPercent(skillStats);
}

function frontendEquipmentSkillLevelAdd(
  skill: SkillPreview,
  gem: Gem,
  skillStats: Record<string, number | boolean>,
  tags: Set<string>
) {
  let total = statValue(skillStats, "active_gem_level_add");
  const damageType = skill.damage_type;
  if (tags.has("attack")) total += statValue(skillStats, "attack_skill_level_add");
  if (tags.has("spell")) total += statValue(skillStats, "spell_skill_level_add");
  if (tags.has("core")) total += statValue(skillStats, "core_skill_level_add");
  if (damageType === "physical" || tags.has("physical")) total += statValue(skillStats, "physical_skill_level_add");
  if (damageType === "fire" || tags.has("fire")) total += statValue(skillStats, "fire_skill_level_add");
  if (damageType === "cold" || tags.has("cold")) total += statValue(skillStats, "cold_skill_level_add");
  if (damageType === "lightning" || tags.has("lightning")) total += statValue(skillStats, "lightning_skill_level_add");
  if (damageType === "chaos" || tags.has("chaos")) total += statValue(skillStats, "chaos_skill_level_add");
  if (["fire", "cold", "lightning"].includes(damageType) || tags.has("elemental")) {
    total += statValue(skillStats, "elemental_skill_level_add");
  }
  if (statValue(skillStats, "support_gem_level_add")) {
    skillStats.equipment_support_gem_level_add = statValue(skillStats, "support_gem_level_add");
  }
  return Math.max(0, Math.floor(total));
}

function frontendSkillSourceContextWithEquipmentLevel(skill: SkillPreview, gem: Gem, skillLevelAdd: number) {
  const sourceContext = frontendRecord(skill.source_context);
  const currentLevel = frontendSkillCurrentLevel(skill, gem);
  return {
    ...sourceContext,
    equipment_skill_level_add: skillLevelAdd,
    effective_gem_level: currentLevel + skillLevelAdd,
  } as SkillPreview["source_context"];
}

function frontendSkillLevelDamageScale(skill: SkillPreview, gem: Gem, skillLevelAdd: number) {
  if (skillLevelAdd <= 0) return 1;
  const currentLevel = frontendSkillCurrentLevel(skill, gem);
  const targetLevel = Math.min(40, currentLevel + skillLevelAdd);
  const currentBaseDamage = frontendSkillLevelValue(skill, "base_damage", currentLevel, Number(skill.final_damage ?? 0), currentLevel);
  const targetBaseDamage = frontendSkillLevelValue(skill, "base_damage", targetLevel, currentBaseDamage, currentLevel);
  if (currentBaseDamage > 0 && targetBaseDamage > 0) {
    return Math.max(0, targetBaseDamage / currentBaseDamage);
  }
  return 1;
}

function frontendSkillCurrentLevel(skill: SkillPreview, gem: Gem) {
  const sourceContext = frontendRecord(skill.source_context);
  return Math.max(1, Math.floor(Number(sourceContext.effective_gem_level ?? sourceContext.base_gem_level ?? gem.level ?? 1)));
}

function frontendSkillLevelValue(skill: SkillPreview, key: string, targetLevel: number, fallback: number, currentLevel: number) {
  const tableValue = frontendSkillLevelTableValue(skill, targetLevel, key);
  if (tableValue !== null) return tableValue;
  const anchors = frontendSkillLevelAnchors(skill, key);
  const levelValues = frontendRecord(frontendRecord(skill.source_context).level_values);
  const currentValue = Number(levelValues[key] ?? fallback);
  const points = [...anchors];
  if (Number.isFinite(currentValue)) {
    const existingCurrent = points.findIndex(([level]) => level === currentLevel);
    if (existingCurrent >= 0) {
      points[existingCurrent] = [currentLevel, currentValue];
    } else {
      points.push([currentLevel, currentValue]);
    }
  }
  points.sort((a, b) => a[0] - b[0]);
  if (points.length === 0) return fallback;
  const exact = points.find(([level]) => level === targetLevel);
  if (exact) return exact[1];
  if (points.length === 1) {
    const [anchorLevel, anchorValue] = points[0];
    if (anchorLevel <= 0 || anchorValue <= 0) return fallback;
    return Math.max(0, anchorValue * (targetLevel / anchorLevel));
  }
  let lower = points[0];
  let upper = points[points.length - 1];
  for (let index = 0; index < points.length - 1; index += 1) {
    if (targetLevel >= points[index][0] && targetLevel <= points[index + 1][0]) {
      lower = points[index];
      upper = points[index + 1];
      break;
    }
  }
  const [lowerLevel, lowerValue] = lower;
  const [upperLevel, upperValue] = upper;
  if (upperLevel === lowerLevel) return lowerValue;
  const ratio = (targetLevel - lowerLevel) / (upperLevel - lowerLevel);
  return Math.max(0, lowerValue + (upperValue - lowerValue) * ratio);
}

function frontendSkillLevelTableValue(skill: SkillPreview, targetLevel: number, key: string) {
  const sourceContext = frontendRecord(skill.source_context);
  const tableId = String(sourceContext.base_gem_id ?? skill.skill_template_id ?? "");
  return frontendSkillLevelTableValueById(tableId, targetLevel, key);
}

function frontendSkillLevelTableValueById(tableId: string, targetLevel: number, key: string) {
  const table = (FRONTEND_SKILL_LEVEL_TABLES as Record<string, Record<number, Record<string, number>>>)[tableId];
  if (!table) return null;
  const levels = Object.keys(table).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (levels.length === 0) return null;
  const clampedLevel = clamp(Math.floor(targetLevel), levels[0], levels[levels.length - 1]);
  const value = table[clampedLevel]?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function frontendSkillLevelAnchors(skill: SkillPreview, key: string): [number, number][] {
  const sourceContext = frontendRecord(skill.source_context);
  const sourceValues = frontendRecord(sourceContext.tlidb_source_values);
  const parsedValues = frontendRecord(sourceValues.parsed_values);
  const anchorsByKey = frontendRecord(parsedValues.anchors);
  const anchors = frontendRecord(anchorsByKey[key]);
  return Object.entries(anchors)
    .map(([level, value]) => [Number(level), Number(value)] as [number, number])
    .filter(([level, value]) => Number.isFinite(level) && Number.isFinite(value));
}

function frontendRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function normalizeFrontendStatusType(statusType: string) {
  const normalized = statusType.trim().toLowerCase();
  const aliases: Record<string, string> = {
    freeze: "frozen",
    frozen: "frozen",
    frostbite: "frostbite",
    chill: "chill",
    chilled: "chill",
    ignite: "ignite",
    burning: "ignite",
    shock: "shock",
    numbed: "numbed",
    paralysis: "numbed",
    trauma: "trauma",
    wilt: "wilt",
    wither: "wilt",
    weakened: "weakened",
    weak: "weakened",
    scorch: "scorch",
    scorched: "scorch",
    rot: "rot",
    rotten: "rot",
    maimed: "maimed"
  };
  return aliases[normalized] ?? normalized;
}

function frontendPlayerStatusImmunityStats(statusType: string) {
  const normalized = normalizeFrontendStatusType(statusType);
  const aliases: Record<string, string[]> = {
    ignite: ["immune_ignite", "immune_scorch"],
    frostbite: ["immune_frostbite", "immune_chill", "immune_frozen"],
    frozen: ["immune_frozen"],
    chill: ["immune_chill", "immune_frostbite"],
    shock: ["immune_shock"],
    numbed: ["immune_numbed"],
    trauma: ["immune_trauma", "immune_maimed"],
    wilt: ["immune_wilt", "immune_wither", "immune_rot"],
    weakened: ["immune_weakened"],
    scorch: ["immune_scorch", "immune_ignite"],
    rot: ["immune_rot", "immune_wilt", "immune_wither"],
    maimed: ["immune_maimed", "immune_trauma"]
  };
  return aliases[normalized] ?? [`immune_${normalized}`];
}

function frontendElementalAilmentTypes() {
  return new Set(["ignite", "frostbite", "frozen", "chill", "shock", "numbed", "scorch"]);
}

function frontendSkillDotDamageMultiplier(skill: SkillPreview) {
  return Math.max(0, 1 + Number(skill.runtime_params?.dot_damage_add_percent ?? 0) / 100);
}

function frontendSkillAilmentDamageMultiplier(skill: SkillPreview) {
  const addPercent =
    Number(skill.runtime_params?.dot_damage_add_percent ?? 0)
    + Number(skill.runtime_params?.ailment_damage_add_percent ?? 0)
    + Number(skill.runtime_params?.ailment_damage_deepen_percent ?? 0);
  return Math.max(0, 1 + addPercent / 100);
}

function addRuntimeParam(runtimeParams: Record<string, unknown>, key: string, value: number) {
  if (!value) return;
  runtimeParams[key] = Number(runtimeParams[key] ?? 0) + value;
}

function scaleRuntimeParam(runtimeParams: Record<string, unknown>, key: string, addPercent: number) {
  if (!addPercent || runtimeParams[key] === undefined) return;
  runtimeParams[key] = Number(runtimeParams[key] ?? 0) * (1 + addPercent / 100);
}

function scaleFrontendRuntimeDurations(runtimeParams: Record<string, unknown>, addPercent: number) {
  if (!addPercent) return;
  const multiplier = Math.max(0.01, 1 + addPercent / 100);
  for (const key of ["duration_ms", "cloud_duration_per_stack_ms"]) {
    if (runtimeParams[key] !== undefined) runtimeParams[key] = Math.max(1, Number(runtimeParams[key] ?? 0) * multiplier);
  }
  const modules = runtimeParams.modules;
  if (!Array.isArray(modules)) return;
  for (const module of modules) {
    if (!module || typeof module !== "object") continue;
    const params = (module as { params?: Record<string, unknown> }).params;
    if (!params || typeof params !== "object") continue;
    for (const key of ["duration_ms", "cloud_duration_per_stack_ms"]) {
      if (params[key] !== undefined) params[key] = Math.max(1, Number(params[key] ?? 0) * multiplier);
    }
  }
}

function frontendExpectedCritChance(skill: SkillPreview, skillStats: Record<string, number | boolean>) {
  if (skillStats.cannot_crit === true) return 0;
  const baseCritPercent = Number(skill.crit_chance ?? 0) * 100;
  const directCritPercent = statValue(skillStats, "crit_chance_add_percent");
  const critRating = statValue(skillStats, "crit_rating");
  const ratingCritPercent = critRating > 0 ? 45 * critRating / (critRating + 600) : 0;
  return clamp((baseCritPercent + directCritPercent + ratingCritPercent) / 100, 0, 0.95);
}

function frontendExpectedCritMultiplier(skill: SkillPreview, skillStats: Record<string, number | boolean>) {
  const baseCritDamagePercent = Number(skill.crit_multiplier ?? 1.5) * 100;
  const critDamageRating = statValue(skillStats, "crit_damage_rating");
  const ratingCritDamagePercent = critDamageRating > 0 ? 200 * critDamageRating / (critDamageRating + 1000) : 0;
  return Math.max(1, (baseCritDamagePercent + statValue(skillStats, "crit_damage_add_percent") + ratingCritDamagePercent) / 100);
}

function createFrontendInitialAppState(): AppState {
  return recalculateFrontendSkillPreview(cloneFrontendData(FRONTEND_INITIAL_APP_STATE) as AppState);
}

function createFrontendNewGameState(slotId?: number): AppState {
  if (slotId) clearFrontendSaveSlot(slotId);
  else clearFrontendAutosave();
  return createFrontendInitialAppState();
}

function loadFrontendAutosaveResult(): { save: FrontendSavePayload | null; errorText: string } {
  try {
    const raw = window.localStorage.getItem(FRONTEND_AUTOSAVE_STORAGE_KEY);
    if (!raw) return { save: null, errorText: "" };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return { save: null, errorText: "本地存档格式无效，已恢复新游戏。" };
    }
    const save = parsed as FrontendSavePayload;
    if (save.version !== FRONTEND_SAVE_VERSION) {
      return { save: null, errorText: "本地存档版本不兼容，已恢复新游戏。" };
    }
    return { save, errorText: "" };
  } catch {
    return { save: null, errorText: "本地存档读取失败，已恢复新游戏。" };
  }
}

function loadFrontendAutosave(): FrontendSavePayload | null {
  return loadFrontendAutosaveResult().save;
}

function frontendSaveSlotKey(slotId: number) {
  return `${FRONTEND_SAVE_SLOT_KEY_PREFIX}${slotId}`;
}

function normalizeFrontendSaveSlotId(value: unknown): number | null {
  const slotId = Number(value);
  if (!Number.isInteger(slotId) || slotId < 1 || slotId > FRONTEND_SAVE_SLOT_COUNT) return null;
  return slotId;
}

function loadActiveFrontendSaveSlotId(): number | null {
  try {
    return normalizeFrontendSaveSlotId(window.localStorage.getItem(FRONTEND_ACTIVE_SAVE_SLOT_STORAGE_KEY));
  } catch {
    return null;
  }
}

function saveActiveFrontendSaveSlotId(slotId: number | null) {
  if (slotId === null) {
    window.localStorage.removeItem(FRONTEND_ACTIVE_SAVE_SLOT_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(FRONTEND_ACTIVE_SAVE_SLOT_STORAGE_KEY, String(slotId));
}

function loadFrontendSaveSlotResult(slotId: number): { save: FrontendSavePayload | null; errorText: string } {
  try {
    const raw = window.localStorage.getItem(frontendSaveSlotKey(slotId));
    if (!raw) return { save: null, errorText: "" };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return { save: null, errorText: `存档 ${slotId} 格式无效。` };
    }
    const save = parsed as FrontendSavePayload;
    if (save.version !== FRONTEND_SAVE_VERSION) {
      return { save: null, errorText: `存档 ${slotId} 版本不兼容。` };
    }
    return { save, errorText: "" };
  } catch {
    return { save: null, errorText: `存档 ${slotId} 读取失败。` };
  }
}

function migrateLegacyFrontendAutosaveToSaveSlots() {
  try {
    const anySlotUsed = Array.from({ length: FRONTEND_SAVE_SLOT_COUNT }, (_, index) => index + 1)
      .some((slotId) => Boolean(window.localStorage.getItem(frontendSaveSlotKey(slotId))));
    if (anySlotUsed) return;
    const legacy = loadFrontendAutosaveResult().save;
    if (!legacy) return;
    window.localStorage.setItem(frontendSaveSlotKey(1), JSON.stringify({ ...legacy, saved_at: legacy.saved_at ?? new Date().toISOString() }));
    window.localStorage.setItem(FRONTEND_ACTIVE_SAVE_SLOT_STORAGE_KEY, "1");
  } catch {
    // Ignore migration errors; the save menu can still create fresh client-side slots.
  }
}

function loadFrontendSaveSlotSummaries(): FrontendSaveSlotSummary[] {
  migrateLegacyFrontendAutosaveToSaveSlots();
  return Array.from({ length: FRONTEND_SAVE_SLOT_COUNT }, (_, index) => {
    const id = index + 1;
    const result = loadFrontendSaveSlotResult(id);
    return { id, save: result.save, errorText: result.errorText };
  });
}

function latestFrontendSaveSlotId(slots: FrontendSaveSlotSummary[]) {
  const sorted = slots
    .filter((slot) => slot.save)
    .sort((a, b) => frontendSaveTimestamp(b.save) - frontendSaveTimestamp(a.save));
  return sorted[0]?.id ?? null;
}

function frontendSaveTimestamp(save: FrontendSavePayload | null | undefined) {
  const timestamp = Date.parse(save?.saved_at ?? "");
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function clearFrontendSaveSlot(slotId: number) {
  const activeSlotId = loadActiveFrontendSaveSlotId();
  window.localStorage.removeItem(frontendSaveSlotKey(slotId));
  if (activeSlotId === slotId) saveActiveFrontendSaveSlotId(null);
  if (activeSlotId === slotId || slotId === 1) window.localStorage.removeItem(FRONTEND_AUTOSAVE_STORAGE_KEY);
}

function appStateFromFrontendSave(save: FrontendSavePayload | null): AppState | null {
  if (!save || Number(save.version) !== FRONTEND_SAVE_VERSION) return null;
  const legacyState = save.app_state;
  if (legacyState && typeof legacyState === "object") {
    return recalculateFrontendSkillPreview(legacyState as AppState);
  }
  const initial = createFrontendInitialAppState();
  return recalculateFrontendSkillPreview({
    ...initial,
    inventory: Array.isArray(save.inventory) ? save.inventory : initial.inventory,
    board: save.board ?? initial.board,
    skill_preview: Array.isArray(save.skill_preview) ? save.skill_preview : initial.skill_preview,
    skill_error: save.skill_error ?? null,
    drops: Array.isArray(save.drops) ? save.drops : [],
    logs: Array.isArray(save.logs) ? save.logs : initial.logs,
    player_stats: save.player_stats ?? initial.player_stats,
    character_panel: save.character_panel ?? initial.character_panel,
    equipment_slots: Array.isArray(save.equipment_slots) ? save.equipment_slots : initial.equipment_slots,
    map_progression: save.map_progression ?? initial.map_progression,
    current_map_run: null,
    autosave: initial.autosave,
    ui_text: save.ui_text ?? initial.ui_text
  });
}

function frontendSavePayloadFromState(state: AppState): FrontendSavePayload {
  return {
    version: FRONTEND_SAVE_VERSION,
    saved_at: new Date().toISOString(),
    inventory: state.inventory,
    board: state.board,
    skill_preview: state.skill_preview,
    skill_error: state.skill_error,
    drops: state.drops,
    logs: state.logs,
    player_stats: state.player_stats,
    character_panel: state.character_panel,
    equipment_slots: state.equipment_slots,
    map_progression: state.map_progression,
    ui_text: state.ui_text
  };
}

function saveFrontendAutosave(state: AppState) {
  const payload = frontendSavePayloadFromState(state);
  window.localStorage.setItem(FRONTEND_AUTOSAVE_STORAGE_KEY, JSON.stringify(payload));
  const activeSlotId = loadActiveFrontendSaveSlotId();
  if (activeSlotId !== null) {
    window.localStorage.setItem(frontendSaveSlotKey(activeSlotId), JSON.stringify(payload));
  }
}

function clearFrontendAutosave() {
  window.localStorage.removeItem(FRONTEND_AUTOSAVE_STORAGE_KEY);
}

function createFrontendItemTooltipView(item: {
  nameText: string;
  rarityText: string;
  categoryText: string;
  identityText: string;
  descriptionText: string;
  iconText: string;
  iconColorKey?: string;
  tags: TooltipTagView[];
  statLines?: TooltipStatLine[];
  bonusLines?: string[];
}): TooltipView {
  return {
    icon_text: item.iconText,
    icon_color_key: item.iconColorKey ?? "orange",
    name_text: item.nameText,
    subtitle_text: `${item.rarityText} · ${item.categoryText}`,
    type_identity_text: item.identityText,
    tags: item.tags,
    sections: {
      description: {
        title_text: "说明",
        lines: [item.descriptionText]
      },
      stats: {
        title_text: "属性",
        lines: item.statLines ?? []
      },
      bonuses: item.bonusLines && item.bonusLines.length > 0 ? {
        title_text: "词缀",
        lines: item.bonusLines
      } : undefined
    }
  };
}

async function requestGmOptions(): Promise<GmOptions> {
  const gems = (FRONTEND_GEM_DROP_POOL as readonly Gem[]).map((item) => ({
    id: item.base_gem_id ?? item.instance_id,
    name_text: item.name_text,
    kind: item.gem_kind || "ordinary",
    gem_type: item.gem_type.id ?? item.gem_type.identity_text,
    sudoku_digit: Number(item.sudoku_digit ?? 1)
  }));
  return {
    gems,
    equipment_sources: frontendEquipmentSources(),
    equipment_rarities: frontendEquipmentRarities()
  };
}

async function requestGmEquipmentAffixes(source: string, level: number): Promise<GmEquipmentAffixResponse> {
  return { source, level, capacity: prefixSuffixCapacity(level), affixes: frontendEquipmentAffixOptions(source, level) };
}

function recalculateFrontendEquipmentState(state: AppState): AppState {
  const baseStats = cloneFrontendData(FRONTEND_INITIAL_APP_STATE.player_stats ?? {}) as Record<string, PlayerStatView>;
  const modifiers = frontendEquippedEquipmentModifiers(state);
  const playerStats = applyFrontendEquipmentStatModifiers(baseStats, modifiers);
  return {
    ...state,
    player_stats: playerStats,
    character_panel: recalculateFrontendCharacterPanel(playerStats)
  };
}

function recalculateFrontendCharacterPanel(playerStats: Record<string, PlayerStatView>): CharacterPanelView | undefined {
  const basePanel = cloneFrontendData(FRONTEND_INITIAL_APP_STATE.character_panel) as CharacterPanelView | undefined;
  if (!basePanel) return undefined;
  return {
    ...basePanel,
    sections: basePanel.sections.map((section) => ({
      ...section,
      rows: section.rows.map((row) => {
        const stat = playerStats[row.stat_id];
        if (["fire_resistance_percent", "cold_resistance_percent", "lightning_resistance_percent"].includes(row.stat_id)) {
          const value = statNumber(stat, 0) + statNumber(playerStats.elemental_resistance_percent, 0);
          return { ...row, value };
        }
        if (row.stat_id === "life_regen_flat") {
          const value = Math.max(0, statNumber(playerStats.life_regen_flat, 0) * (1 + Math.max(0, statNumber(playerStats.life_regen_add_percent, 0)) / 100))
            + Math.max(0, statNumber(playerStats.max_life, 0) * statNumber(playerStats.life_regen_percent_per_second, 0) / 100);
          return { ...row, value };
        }
        if (row.stat_id === "mana_regen_flat") {
          const value = Math.max(0, statNumber(playerStats.mana_regen_flat, 0) * (1 + Math.max(0, statNumber(playerStats.mana_regen_add_percent, 0)) / 100));
          return { ...row, value };
        }
        return typeof stat?.value === "number" || typeof stat?.value === "boolean"
          ? { ...row, value: stat.value }
          : row;
      })
    }))
  };
}

async function requestBackendState(path: string, body: unknown): Promise<AppState> {
  void path;
  void body;
  throw new Error("普通单机玩法不再调用后端状态接口。");
}

async function requestSkillEditorSave(skillId: string, draft: SkillPackageData): Promise<SkillEditorSaveResponse> {
  void skillId;
  void draft;
  throw new Error("技能编辑器已禁用。");
}

async function requestSkillEditorModifierPreview(payload: {
  skill_id: string;
  modifier_ids: string[];
  relation: string;
  source_power: number;
  target_power: number;
  conduit_power: number;
}): Promise<SkillEditorModifierPreviewResponse> {
  void payload;
  throw new Error("技能编辑器已禁用。");
}

async function requestSkillTestArenaRun(payload: {
  skill_id: string;
  scene_id: string;
  package: SkillPackageData | null;
  use_modifier_stack: boolean;
  modifier_ids: string[];
  relation: string;
  source_power: number;
  target_power: number;
  conduit_power: number;
}): Promise<SkillTestArenaResponse> {
  void payload;
  throw new Error("技能编辑器已禁用。");
}

export function App() {
  const [spriteTestMode] = useState(() => initialSpriteTestMode());
  const [mapEditorMode] = useState(() => initialMapEditorMode());
  if (mapEditorMode) return <MapEditorScene />;
  return spriteTestMode ? <SpriteTestScene /> : <GameApp />;
}

type MapEditorTileKind = "empty" | "ground" | "wall";
type MapEditorBrush = Exclude<MapEditorTileKind, "empty">;
type MapEditorPaintMode = "single" | "rectangle";
type MapEditorPaintAction = "fill" | "clear";
type MapEditorCellPoint = { x: number; y: number };
type MapEditorWorldPoint = { x: number; y: number };
type MapEditorSpawnPlanTool = "tiles" | "zone";
type MapEditorZoneRect = {
  start: MapEditorCellPoint;
  end: MapEditorCellPoint;
};
type MapEditorZone = {
  id: string;
  zoneType: ProceduralZoneType;
  shape: "rectangle";
  points: MapEditorCellPoint[];
  rects: MapEditorZoneRect[];
};
type MapEditorZoneDraft = {
  zoneType: ProceduralZoneType;
  start: MapEditorCellPoint;
  current: MapEditorCellPoint;
};
type MapEditorCollider = {
  enabled: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
};
type MapEditorColliderNumericField = "x" | "y" | "width" | "height";
type MapEditorTileColliderConfig = Record<MapEditorTileKind, MapEditorCollider>;
type MapEditorDragState = {
  start: MapEditorCellPoint;
  current: MapEditorCellPoint;
};
type MapEditorSavedState = {
  tiles: MapEditorTileKind[][];
  cellSize: number;
  spawn: MapEditorCellPoint;
  colliders: MapEditorTileColliderConfig;
  zones: MapEditorZone[];
  width: number;
  height: number;
};
type MapEditorFileDocument = MapEditorSavedState & {
  format: "poe.tilemap.editor";
  version: 1;
  name: string;
  savedAt: string;
};
type EditorRuntimeBattleMapData = BakedBattleMapData & {
  editorTiles: MapEditorTileKind[][];
  editorZones: MapEditorZone[];
};
type RuntimeBattleMapOption = {
  id: string;
  displayName: string;
  biome: string;
  worldWidth: number;
  worldHeight: number;
};
type MapEditorVisibleBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};
const MAP_EDITOR_WALL_SIDES = ["n", "e", "s", "w"] as const;
type MapEditorWallSide = typeof MAP_EDITOR_WALL_SIDES[number];
const MAP_EDITOR_WALL_CORNERS = ["nw", "ne", "se", "sw"] as const;
type MapEditorWallCorner = typeof MAP_EDITOR_WALL_CORNERS[number];
type MapEditorAutotileRole = "empty" | "isolated" | "connected" | "interior";
type MapEditorAutotileState = {
  role: MapEditorAutotileRole;
  sameSides: MapEditorWallSide[];
  edgeSides: MapEditorWallSide[];
  boundarySides: MapEditorWallSide[];
  innerCorners: MapEditorWallCorner[];
  outerCorners: MapEditorWallCorner[];
};
type MapEditorFileHandle = {
  kind: "file";
  name: string;
  getFile: () => Promise<File>;
  createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void> }>;
};
type MapEditorDirectoryHandle = {
  kind: "directory";
  name: string;
  values: () => AsyncIterable<MapEditorFileHandle | MapEditorDirectoryHandle>;
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<MapEditorFileHandle>;
  queryPermission?: (descriptor?: { mode?: "read" | "readwrite" }) => Promise<PermissionState>;
  requestPermission?: (descriptor?: { mode?: "read" | "readwrite" }) => Promise<PermissionState>;
};
type MapEditorWindowWithFilePickers = Window & {
  showDirectoryPicker?: (options?: { id?: string; mode?: "read" | "readwrite" }) => Promise<MapEditorDirectoryHandle>;
  showOpenFilePicker?: (options?: {
    id?: string;
    multiple?: boolean;
    startIn?: "desktop" | "documents" | "downloads" | MapEditorDirectoryHandle;
    types?: Array<{ description: string; accept: Record<string, string[]> }>;
  }) => Promise<MapEditorFileHandle[]>;
};

const MAP_EDITOR_COLUMNS = 256;
const MAP_EDITOR_ROWS = 144;
const MAP_EDITOR_MIN_CELL_SIZE = 32;
const MAP_EDITOR_MAX_CELL_SIZE = 96;
const MAP_EDITOR_DEFAULT_CELL_SIZE = 64;
const MAP_EDITOR_PLAYER_SPEED = 260 * 5;
const MAP_EDITOR_PLAYER_RENDER_SCALE = 0.35;
const MAP_EDITOR_STORAGE_KEY = "poe.mapEditor.tilemap.v1";
const MAP_EDITOR_CURRENT_FILE_STORAGE_KEY = "poe.mapEditor.currentFile.v1";
const MAP_EDITOR_HANDLE_DB_NAME = "poe-map-editor-handles";
const MAP_EDITOR_HANDLE_STORE_NAME = "handles";
const MAP_EDITOR_DIRECTORY_HANDLE_KEY = "mapDirectory";
const MAP_EDITOR_VISIBLE_RADIUS_X = 18;
const MAP_EDITOR_VISIBLE_RADIUS_Y = 12;
const MAP_EDITOR_DEFAULT_SPAWN: MapEditorCellPoint = { x: 55, y: 35 };
const MAP_EDITOR_SAMPLE_OFFSET: MapEditorCellPoint = { x: 48, y: 28 };
const MAP_EDITOR_MINIMAP_WIDTH = 256;
const MAP_EDITOR_MINIMAP_HEIGHT = 144;
const MAP_EDITOR_PLAYER_COLLIDER: MapEditorCollider = { enabled: true, x: 0.29, y: 0.42, width: 0.42, height: 0.36 };
const MAP_EDITOR_CAMERA_PAN_SPEED = 900;
const MAP_EDITOR_ZONE_TYPES: Array<{ id: ProceduralZoneType; label: string }> = [
  { id: "entrance", label: "入口区域" },
  { id: "corridor", label: "通道" },
  { id: "main_room", label: "普通房间" },
  { id: "large_room", label: "大房间" },
  { id: "dead_end", label: "死胡同" },
  { id: "boss_room", label: "Boss 房" },
  { id: "exit_area", label: "出口区域" }
];
const EDITOR_RUNTIME_MAP_ID = "map_001";
const DEFAULT_RUNTIME_MAP_ID = EDITOR_RUNTIME_MAP_ID;
const MAP_EDITOR_TILE_OPTIONS: Array<{ id: MapEditorBrush; label: string }> = [
  { id: "ground", label: "地面" },
  { id: "wall", label: "墙壁" }
];

export function clearLaunchCacheIfRequested() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const shouldClear = params.get("clear_cache") === "1" || params.get("clear-cache") === "1";
  if (!shouldClear) return;

  [
    MAP_EDITOR_STORAGE_KEY,
    MAP_EDITOR_CURRENT_FILE_STORAGE_KEY,
    SKILL_EDITOR_CAMERA_STORAGE_KEY
  ].forEach((key) => window.localStorage.removeItem(key));

  if ("caches" in window) {
    window.caches.keys()
      .then((keys) => Promise.all(keys.map((key) => window.caches.delete(key))))
      .catch(() => undefined);
  }

  params.delete("clear_cache");
  params.delete("clear-cache");
  params.delete("v");
  const query = params.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
}

function MapEditorScene() {
  const initialEditorState = useMemo(() => loadMapEditorState(), []);
  const [tiles, setTiles] = useState<MapEditorTileKind[][]>(() => initialEditorState.tiles);
  const [brush, setBrush] = useState<MapEditorBrush>("ground");
  const [paintMode, setPaintMode] = useState<MapEditorPaintMode>("single");
  const [paintAction, setPaintAction] = useState<MapEditorPaintAction>("fill");
  const [cellSize, setCellSize] = useState(initialEditorState.cellSize);
  const [spawn, setSpawn] = useState<MapEditorCellPoint>(() => initialEditorState.spawn);
  const [colliders, setColliders] = useState<MapEditorTileColliderConfig>(() => initialEditorState.colliders);
  const [zones, setZones] = useState<MapEditorZone[]>(() => initialEditorState.zones);
  const [zoneType, setZoneType] = useState<ProceduralZoneType>("main_room");
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [zoneDrafts, setZoneDrafts] = useState<MapEditorZoneDraft[]>([]);
  const [activeZoneDraft, setActiveZoneDraft] = useState<MapEditorZoneDraft | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [spawnPlanTool, setSpawnPlanTool] = useState<MapEditorSpawnPlanTool>("tiles");
  const [editorCamera, setEditorCamera] = useState<MapEditorWorldPoint>(() => mapEditorCellCenter(initialEditorState.spawn.x, initialEditorState.spawn.y, initialEditorState.cellSize));
  const [showMinimap, setShowMinimap] = useState(true);
  const [showGridLines, setShowGridLines] = useState(true);
  const [showCollisionOverlay, setShowCollisionOverlay] = useState(false);
  const [mapDirectory, setMapDirectory] = useState<MapEditorDirectoryHandle | null>(null);
  const [mapFiles, setMapFiles] = useState<string[]>([]);
  const [currentMapFileName, setCurrentMapFileName] = useState(() => loadMapEditorCurrentFileName());
  const [currentMapFileHandle, setCurrentMapFileHandle] = useState<MapEditorFileHandle | null>(null);
  const [dragState, setDragState] = useState<MapEditorDragState | null>(null);
  const [player, setPlayer] = useState(() => mapEditorCellCenter(initialEditorState.spawn.x, initialEditorState.spawn.y, initialEditorState.cellSize));
  const [elapsedMs, setElapsedMs] = useState(0);
  const [saveNotice, setSaveNotice] = useState("自动保存已开启");
  const [undoStack, setUndoStack] = useState<MapEditorSavedState[]>([]);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const keys = useRef(new Set<string>());
  const lastFrame = useRef<number | null>(null);
  const playerVisual = useRef<UnitVisualRuntime>({ direction: "down", movementVector: { x: 0, y: 0 } });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (isMapEditorTypingTarget(target)) return;
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === "z") {
        event.preventDefault();
        undoLastMapEditorEdit();
        return;
      }
      if (!["w", "a", "s", "d"].includes(key)) return;
      event.preventDefault();
      keys.current.add(key);
    }
    function onKeyUp(event: KeyboardEvent) {
      keys.current.delete(event.key.toLowerCase());
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    saveMapEditorState({ tiles, cellSize, spawn, colliders, zones, width: MAP_EDITOR_COLUMNS, height: MAP_EDITOR_ROWS });
  }, [tiles, cellSize, spawn, colliders, zones]);

  useEffect(() => {
    let cancelled = false;
    loadMapEditorDirectoryHandle().then(async (handle) => {
      if (!handle || cancelled) return;
      setMapDirectory(handle);
      const files = await listMapEditorFiles(handle).catch(() => []);
      if (!cancelled) setMapFiles(files);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const currentEditorState = useCallback((): MapEditorSavedState => ({
    tiles,
    cellSize,
    spawn,
    colliders,
    zones,
    width: MAP_EDITOR_COLUMNS,
    height: MAP_EDITOR_ROWS
  }), [cellSize, colliders, spawn, tiles, zones]);

  async function selectMapDirectory() {
    const pickerWindow = window as MapEditorWindowWithFilePickers;
    if (!pickerWindow.showDirectoryPicker) {
      setSaveNotice("当前浏览器不支持直接保存本地文件，请使用 Chromium/Edge/Chrome。");
      return null;
    }
    try {
      const handle = await pickerWindow.showDirectoryPicker({ id: "poe-map-editor-maps", mode: "readwrite" });
      await storeMapEditorDirectoryHandle(handle);
      setMapDirectory(handle);
      const files = await refreshMapFileList(handle);
      if (currentMapFileName && !files.includes(currentMapFileName)) {
        setCurrentMapFileName(null);
        setCurrentMapFileHandle(null);
        clearMapEditorCurrentFileName();
      }
      setSaveNotice(`地图目录已设为 ${handle.name}，发现 ${files.length} 个地图文件。`);
      return handle;
    } catch (error) {
      if (!isMapEditorAbortError(error)) setSaveNotice("设置地图目录失败。");
      return null;
    }
  }

  async function ensureMapDirectory() {
    const handle = mapDirectory ?? await selectMapDirectory();
    if (!handle) return null;
    const granted = await requestMapEditorDirectoryWritePermission(handle);
    if (!granted) {
      setSaveNotice("没有地图目录写入权限，保存已取消。");
      return null;
    }
    return handle;
  }

  async function refreshMapFileList(handle = mapDirectory) {
    if (!handle) return [];
    const files = await listMapEditorFiles(handle);
    setMapFiles(files);
    return files;
  }

  async function saveCurrentMapFile() {
    saveMapEditorState(currentEditorState());
    const handle = currentMapFileHandle ? mapDirectory : await ensureMapDirectory();
    if (!handle && !currentMapFileHandle) return null;
    const fileName = currentMapFileName ?? await nextMapEditorFileName(handle as MapEditorDirectoryHandle);
    const fileHandle = currentMapFileHandle ?? await (handle as MapEditorDirectoryHandle).getFileHandle(fileName, { create: true });
    await writeMapEditorFileHandle(fileHandle, fileName, currentEditorState());
    setCurrentMapFileName(fileName);
    setCurrentMapFileHandle(fileHandle);
    saveMapEditorCurrentFileName(fileName);
    if (handle) await refreshMapFileList(handle);
    setSaveNotice(`已保存到 ${fileName} ${new Date().toLocaleTimeString()}`);
    return { directory: handle, fileName };
  }

  async function saveNow() {
    await saveCurrentMapFile();
  }

  async function createNewMap() {
    const saved = await saveCurrentMapFile();
    if (!saved) return;
    const directory = saved.directory ?? await ensureMapDirectory();
    if (!directory) return;
    const nextFileName = await nextMapEditorFileName(directory);
    const nextSpawn = { x: 0, y: 0 };
    pushMapEditorUndo();
    setTiles(createEmptyMapEditorTiles());
    setSpawn(nextSpawn);
    setColliders(createDefaultMapEditorColliders());
    setZones([]);
    setCellSize(MAP_EDITOR_DEFAULT_CELL_SIZE);
    setPlayer(mapEditorCellCenter(nextSpawn.x, nextSpawn.y, MAP_EDITOR_DEFAULT_CELL_SIZE));
    setEditorCamera(mapEditorCellCenter(nextSpawn.x, nextSpawn.y, MAP_EDITOR_DEFAULT_CELL_SIZE));
    setSelectedZoneId(null);
    setZoneDrafts([]);
    setActiveZoneDraft(null);
    setCurrentMapFileName(nextFileName);
    setCurrentMapFileHandle(null);
    saveMapEditorCurrentFileName(nextFileName);
    setSaveNotice(`已新建地图 ${nextFileName}，点击保存会写入该文件。`);
  }

  async function openMapFile(fileName: string) {
    const saved = await saveCurrentMapFile();
    if (!saved || !saved.directory) return;
    try {
      const fileHandle = await saved.directory.getFileHandle(fileName);
      const state = await readMapEditorFile(fileHandle);
      applyLoadedMapEditorState(state, fileName, fileHandle);
      setSaveNotice(`已打开 ${fileName}，之前的地图已自动保存。`);
    } catch {
      setSaveNotice(`打开 ${fileName} 失败。`);
    }
  }

  async function browseMapFile() {
    const saved = await saveCurrentMapFile();
    if (!saved) return;
    const pickerWindow = window as MapEditorWindowWithFilePickers;
    if (!pickerWindow.showOpenFilePicker) {
      setSaveNotice("当前浏览器不支持选择本地地图文件。");
      return;
    }
    try {
      const [fileHandle] = await pickerWindow.showOpenFilePicker({
        id: "poe-map-editor-maps",
        multiple: false,
        startIn: saved.directory ?? undefined,
        types: [{ description: "POE tilemap JSON", accept: { "application/json": [".json"] } }]
      });
      if (!fileHandle) return;
      const state = await readMapEditorFile(fileHandle);
      applyLoadedMapEditorState(state, fileHandle.name, fileHandle);
      setSaveNotice(`已打开 ${fileHandle.name}，之前的地图已自动保存。`);
    } catch (error) {
      if (!isMapEditorAbortError(error)) setSaveNotice("浏览打开地图失败。");
    }
  }

  function applyLoadedMapEditorState(state: MapEditorSavedState, fileName: string, fileHandle: MapEditorFileHandle | null = null) {
    applyMapEditorState(state);
    setPlayer(mapEditorCellCenter(state.spawn.x, state.spawn.y, state.cellSize));
    setEditorCamera(mapEditorCellCenter(state.spawn.x, state.spawn.y, state.cellSize));
    setSelectedZoneId(null);
    setZoneDrafts([]);
    setActiveZoneDraft(null);
    setCurrentMapFileName(fileName);
    setCurrentMapFileHandle(fileHandle);
    saveMapEditorCurrentFileName(fileName);
    saveMapEditorState(state);
  }

  function currentMapEditorState(): MapEditorSavedState {
    return cloneMapEditorState({ tiles, cellSize, spawn, colliders, zones, width: MAP_EDITOR_COLUMNS, height: MAP_EDITOR_ROWS });
  }

  function pushMapEditorUndo() {
    setUndoStack((current) => [...current.slice(-49), currentMapEditorState()]);
  }

  function applyMapEditorState(state: MapEditorSavedState) {
    const snapshot = cloneMapEditorState(state);
    setTiles(snapshot.tiles);
    setCellSize(snapshot.cellSize);
    setSpawn(snapshot.spawn);
    setColliders(snapshot.colliders);
    setZones(snapshot.zones);
  }

  function undoLastMapEditorEdit() {
    const previous = undoStack[undoStack.length - 1];
    if (!previous) return;
    applyMapEditorState(previous);
    setUndoStack((current) => current.slice(0, -1));
    setSelectedZoneId(null);
    setZoneDrafts([]);
    setActiveZoneDraft(null);
    setPlayer(mapEditorCellCenter(previous.spawn.x, previous.spawn.y, previous.cellSize));
    setEditorCamera(mapEditorCellCenter(previous.spawn.x, previous.spawn.y, previous.cellSize));
    setSaveNotice("已撤销上一步操作。");
  }

  useEffect(() => {
    let frame = 0;
    function tick(now: number) {
      if (lastFrame.current === null) lastFrame.current = now;
      const dt = Math.min(0.05, (now - lastFrame.current) / 1000);
      lastFrame.current = now;
      const moveVector = playerInputVector(keys.current);
      const hasMoveInput = Math.hypot(moveVector.x, moveVector.y) > 0.001;
      const projectedMoveVector = projectMovementVectorForAnimation(moveVector);
      playerVisual.current = {
        direction: resolveAnimationDirection(projectedMoveVector, playerVisual.current.direction),
        movementVector: projectedMoveVector
      };
      if (editMode) {
        playerVisual.current = {
          direction: playerVisual.current.direction,
          movementVector: { x: 0, y: 0 }
        };
        if (hasMoveInput) {
          setEditorCamera((current) => clampMapEditorWorldPoint({
            x: current.x + moveVector.x * MAP_EDITOR_CAMERA_PAN_SPEED * dt,
            y: current.y + moveVector.y * MAP_EDITOR_CAMERA_PAN_SPEED * dt
          }, cellSize));
        }
      } else if (hasMoveInput) {
        setPlayer((current) => resolveMapEditorMove(tiles, cellSize, current, moveVector, MAP_EDITOR_PLAYER_SPEED * dt, colliders));
      }
      if (hasMoveInput) setElapsedMs(now);
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [tiles, cellSize, colliders, editMode]);

  const tileCounts = useMemo(() => ({
    ground: countMapEditorTiles(tiles, "ground"),
    wall: countMapEditorTiles(tiles, "wall")
  }), [tiles]);
  const blockedCount = useMemo(() => countMapEditorBlockingTiles(tiles, colliders), [colliders, tiles]);
  const playerGrid = mapEditorWorldToGrid(player, cellSize);
  const cameraGrid = mapEditorWorldToGrid(editMode ? editorCamera : player, cellSize);
  const visibleBounds = useMemo(
    () => mapEditorVisibleBounds(cameraGrid),
    [cameraGrid.x, cameraGrid.y]
  );
  const moving = Math.hypot(playerVisual.current.movementVector.x, playerVisual.current.movementVector.y) > 0.001;
  const playerFrame = resolveUnitAnimation({
    unitId: "player_adventurer",
    requestedState: unitMovementState(moving, MAP_EDITOR_PLAYER_SPEED, moving ? MAP_EDITOR_PLAYER_SPEED : 0),
    movementVector: playerVisual.current.movementVector,
    fallbackDirection: playerVisual.current.direction,
    elapsedMs,
    baseMoveSpeed: MAP_EDITOR_PLAYER_SPEED,
    currentMoveSpeed: moving ? MAP_EDITOR_PLAYER_SPEED : 0
  });

  function changeCellSize(value: number) {
    const nextCellSize = Math.round(clampNumber(value, MAP_EDITOR_MIN_CELL_SIZE, MAP_EDITOR_MAX_CELL_SIZE));
    if (nextCellSize === cellSize) return;
    pushMapEditorUndo();
    setPlayer((current) => ({
      x: (current.x / cellSize) * nextCellSize,
      y: (current.y / cellSize) * nextCellSize
    }));
    setEditorCamera((current) => ({
      x: (current.x / cellSize) * nextCellSize,
      y: (current.y / cellSize) * nextCellSize
    }));
    setCellSize(nextCellSize);
  }

  function updateSelectedTileCollider(field: "enabled", value: boolean): void;
  function updateSelectedTileCollider(field: MapEditorColliderNumericField, value: number): void;
  function updateSelectedTileCollider(field: keyof MapEditorCollider, value: number | boolean) {
    pushMapEditorUndo();
    setColliders((current) => ({
      ...current,
      [brush]: normalizeMapEditorCollider({
        ...current[brush],
        [field]: typeof value === "boolean" ? value : value / 100
      })
    }));
  }

  const applyCells = useCallback((start: MapEditorCellPoint, end: MapEditorCellPoint) => {
    pushMapEditorUndo();
    setTiles((current) => paintMapEditorTiles(current, start, end, paintAction === "clear" ? "empty" : brush));
  }, [brush, paintAction, pushMapEditorUndo]);

  const placeSpawnAtPlayer = useCallback(() => {
    const point = mapEditorWorldToGrid(player, cellSize);
    if (point.x === spawn.x && point.y === spawn.y) return;
    pushMapEditorUndo();
    setSpawn(point);
    setDragState(null);
    setSaveNotice(`出生点已设为角色当前位置 ${point.x}, ${point.y}`);
  }, [cellSize, player, pushMapEditorUndo, spawn.x, spawn.y]);

  const beginPaint = useCallback((event: ReactPointerEvent<HTMLButtonElement>, x: number, y: number) => {
    event.preventDefault();
    event.stopPropagation();
    if (editMode && spawnPlanTool === "zone") {
      const point = { x, y };
      setDragState(null);
      setSelectedZoneId(null);
      setActiveZoneDraft({ zoneType, start: point, current: point });
      return;
    }
    const point = { x, y };
    setDragState({ start: point, current: point });
    if (paintMode === "single") applyCells(point, point);
  }, [applyCells, editMode, spawnPlanTool, paintMode, zoneType]);

  const updatePaint = useCallback((x: number, y: number) => {
    setActiveZoneDraft((current) => current ? { ...current, current: { x, y } } : current);
    setDragState((current) => current ? { ...current, current: { x, y } } : current);
  }, []);

  const finishPaint = useCallback(() => {
    if (activeZoneDraft) {
      setZoneDrafts((current) => [...current, normalizeMapEditorZoneDraft(activeZoneDraft)]);
      setActiveZoneDraft(null);
      setSaveNotice("已加入待确定区域。");
      return;
    }
    if (dragState && paintMode === "rectangle") applyCells(dragState.start, dragState.current);
    setDragState(null);
  }, [activeZoneDraft, applyCells, dragState, paintMode]);

  function setMapEditorEditMode(enabled: boolean) {
    setEditMode(enabled);
    setDragState(null);
    setActiveZoneDraft(null);
    setZoneDrafts([]);
    if (enabled) {
      setEditorCamera(player);
    } else {
      setSpawnPlanTool("tiles");
      setSelectedZoneId(null);
    }
  }

  function confirmZoneDrafts() {
    const pending = activeZoneDraft ? [...zoneDrafts, normalizeMapEditorZoneDraft(activeZoneDraft)] : zoneDrafts;
    if (pending.length === 0) return;
    pushMapEditorUndo();
    const zone = createMapEditorZone(zoneType, pending.map(mapEditorZoneRectFromDraft));
    setZones((current) => [...current, zone]);
    setSelectedZoneId(zone.id);
    setZoneDrafts([]);
    setActiveZoneDraft(null);
    setSaveNotice(`已新增 1 个 ${mapEditorZoneTypeLabel(zoneType)} 区域，包含 ${pending.length} 个框选范围。`);
  }

  function clearZoneDrafts() {
    setZoneDrafts([]);
    setActiveZoneDraft(null);
    setSaveNotice("已清空待确定区域。");
  }

  function updateSelectedZoneType(nextZoneType: ProceduralZoneType) {
    if (!selectedZoneId) return;
    const currentZone = zones.find((zone) => zone.id === selectedZoneId);
    if (!currentZone || currentZone.zoneType === nextZoneType) return;
    pushMapEditorUndo();
    setZones((current) => current.map((zone) => zone.id === selectedZoneId ? { ...zone, zoneType: nextZoneType } : zone));
  }

  function deleteSelectedZone() {
    if (!selectedZoneId) return;
    pushMapEditorUndo();
    setZones((current) => current.filter((zone) => zone.id !== selectedZoneId));
    setSelectedZoneId(null);
    setSaveNotice("已删除区域。");
  }

  function clearAll() {
    const nextSpawn = { x: 0, y: 0 };
    pushMapEditorUndo();
    setTiles(createEmptyMapEditorTiles());
    setSpawn(nextSpawn);
    setColliders(createDefaultMapEditorColliders());
    setZones([]);
    setSelectedZoneId(null);
    setZoneDrafts([]);
    setActiveZoneDraft(null);
    setPlayer(mapEditorCellCenter(nextSpawn.x, nextSpawn.y, cellSize));
    setEditorCamera(mapEditorCellCenter(nextSpawn.x, nextSpawn.y, cellSize));
  }

  function resetSample() {
    pushMapEditorUndo();
    const restored = createDefaultMapEditorState();
    applyMapEditorState(restored);
    setSelectedZoneId(null);
    setZoneDrafts([]);
    setActiveZoneDraft(null);
    setPlayer(mapEditorCellCenter(restored.spawn.x, restored.spawn.y, restored.cellSize));
    setEditorCamera(mapEditorCellCenter(restored.spawn.x, restored.spawn.y, restored.cellSize));
    setCurrentMapFileName("map_001.json");
    setCurrentMapFileHandle(null);
    saveMapEditorCurrentFileName("map_001.json");
    saveMapEditorState(restored);
    setSaveNotice("已从内置 map_001 恢复。");
  }

  function movePlayerToSpawn() {
    setPlayer(mapEditorCellCenter(spawn.x, spawn.y, cellSize));
  }

  function shiftWholeMap(dx: number, dy: number) {
    pushMapEditorUndo();
    setTiles((current) => shiftMapEditorTiles(current, dx, dy));
    setSpawn((current) => shiftMapEditorPoint(current, dx, dy));
    setZones((current) => shiftMapEditorZones(current, dx, dy));
    setPlayer((current) => clampMapEditorWorldPoint({
      x: current.x + dx * cellSize,
      y: current.y + dy * cellSize
    }, cellSize));
    setEditorCamera((current) => clampMapEditorWorldPoint({
      x: current.x + dx * cellSize,
      y: current.y + dy * cellSize
    }, cellSize));
  }

  const selectedTileCollider = colliders[brush];
  const selectedZone = selectedZoneId ? zones.find((zone) => zone.id === selectedZoneId) ?? null : null;

  return (
    <main className="map-editor-screen" data-mode="map-editor" data-no-monsters="true" data-spawnPlan-editor="true">
      <aside className="map-editor-toolbar" aria-label="地图编辑器工具栏">
        <header>
          <h1>Tilemap 地图编辑器</h1>
          <p>独立入口：编辑地形、碰撞、出生点和刷怪区域。</p>
        </header>

        <section>
          <h2>编辑模式</h2>
          <label className="map-editor-checkbox">
            <input
              type="checkbox"
              checked={editMode}
              onChange={(event) => setMapEditorEditMode(event.currentTarget.checked)}
            />
            <span>{editMode ? "编辑模式：WASD 控制视图" : "预览模式：WASD 控制角色"}</span>
          </label>
          <div className="map-editor-segment">
            <button type="button" className={spawnPlanTool === "tiles" ? "active" : ""} onClick={() => setSpawnPlanTool("tiles")}>
              地形
            </button>
            <button type="button" className={spawnPlanTool === "zone" ? "active" : ""} disabled={!editMode} onClick={() => setSpawnPlanTool("zone")}>
              区域
            </button>
          </div>
        </section>

        <section>
          <h2>文件</h2>
          <p>地图目录：{mapDirectory?.name ?? "未设置"}</p>
          <p>当前地图：{currentMapFileName ?? "未命名"}</p>
          <div className="map-editor-actions">
            <button type="button" onClick={() => void selectMapDirectory()}>设置目录</button>
            <button type="button" onClick={() => void saveNow()}>保存地图</button>
            <button type="button" onClick={() => void createNewMap()}>新建地图</button>
            <button type="button" onClick={() => void browseMapFile()}>浏览打开</button>
          </div>
          <div className="map-editor-file-list" aria-label="本地地图文件">
            {mapFiles.length > 0 ? mapFiles.map((fileName) => (
              <button
                key={fileName}
                type="button"
                className={fileName === currentMapFileName ? "active" : ""}
                onClick={() => void openMapFile(fileName)}
              >
                {fileName}
              </button>
            )) : <span>设置目录后显示 map_XXX.json</span>}
          </div>
        </section>

        <section>
          <h2>Tiles</h2>
          <label className="map-editor-select-field">
            <span>目标 Tile</span>
            <select value={brush} onChange={(event) => setBrush(event.currentTarget.value as MapEditorBrush)}>
              {MAP_EDITOR_TILE_OPTIONS.map((tile) => (
                <option key={tile.id} value={tile.id}>{tile.label}</option>
              ))}
            </select>
          </label>
        </section>

        <section>
          <h2>刷怪区域</h2>
          <dl className="map-editor-stats">
            <div><dt>区域数量</dt><dd>{zones.length}</dd></div>
            <div><dt>待确定</dt><dd>{zoneDrafts.length + (activeZoneDraft ? 1 : 0)}</dd></div>
            <div><dt>当前类型</dt><dd>{mapEditorZoneTypeLabel(zoneType)}</dd></div>
            <div><dt>当前工具</dt><dd>{mapEditorSpawnPlanToolLabel(spawnPlanTool)}</dd></div>
          </dl>
          <label className="map-editor-select-field">
            <span>zone_type</span>
            <select value={zoneType} onChange={(event) => setZoneType(event.currentTarget.value as ProceduralZoneType)}>
              {MAP_EDITOR_ZONE_TYPES.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="map-editor-select-field" data-spawnPlan-jump="true">
            <span>选择区域</span>
            <select value={selectedZoneId ?? ""} onChange={(event) => setSelectedZoneId(event.currentTarget.value || null)}>
              <option value="">选择刷怪区域</option>
              {zones.map((zone, index) => (
                <option key={zone.id} value={zone.id}>{index + 1}. {mapEditorZoneTypeLabel(zone.zoneType)}</option>
              ))}
            </select>
          </label>
          <div className="map-editor-actions">
            <button type="button" disabled={zoneDrafts.length + (activeZoneDraft ? 1 : 0) === 0} onClick={confirmZoneDrafts}>确定</button>
            <button type="button" disabled={zoneDrafts.length + (activeZoneDraft ? 1 : 0) === 0} onClick={clearZoneDrafts}>清空待确定</button>
          </div>
          {selectedZone ? (
            <div className="map-editor-spawnPlan-controls" data-selected-spawnPlan="zone">
              <strong>区域 {selectedZone.id}</strong>
              <label>
                <span>zone_type</span>
                <select value={selectedZone.zoneType} onChange={(event) => updateSelectedZoneType(event.currentTarget.value as ProceduralZoneType)}>
                  {MAP_EDITOR_ZONE_TYPES.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
              </label>
              <span>范围：{selectedZone.points.length} 点矩形</span>
              <button type="button" onClick={deleteSelectedZone}>删除区域</button>
            </div>
          ) : (
            <p>进入编辑模式后选择“区域”，可连续框选多个待确定区域，最后点击“确定”。</p>
          )}
        </section>

        <section>
          <h2>碰撞范围</h2>
          <label className="map-editor-checkbox">
            <input
              type="checkbox"
              checked={selectedTileCollider.enabled}
              onChange={(event) => updateSelectedTileCollider("enabled", event.currentTarget.checked)}
            />
            <span>{mapEditorTileLabel(brush)} 阻挡</span>
          </label>
          <div className="map-editor-collider-grid">
            {(["x", "y", "width", "height"] as MapEditorColliderNumericField[]).map((field) => (
              <label key={field}>
                <span>{mapEditorColliderFieldLabel(field)}</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={mapEditorColliderPercent(selectedTileCollider[field])}
                  onChange={(event) => updateSelectedTileCollider(field, Number(event.currentTarget.value))}
                />
              </label>
            ))}
          </div>
        </section>

        <section>
          <h2>绘制</h2>
          <div className="map-editor-segment">
            <button type="button" className={paintAction === "fill" ? "active" : ""} onClick={() => setPaintAction("fill")}>
              填充
            </button>
            <button type="button" className={paintAction === "clear" ? "active" : ""} onClick={() => setPaintAction("clear")}>
              清除
            </button>
          </div>
          <div className="map-editor-segment">
            <button type="button" className={paintMode === "single" ? "active" : ""} onClick={() => setPaintMode("single")}>
              单格
            </button>
            <button type="button" className={paintMode === "rectangle" ? "active" : ""} onClick={() => setPaintMode("rectangle")}>
              框选
            </button>
          </div>
        </section>

        <section>
          <h2>单位大小</h2>
          <label className="map-editor-cell-size">
            <input
              type="range"
              min={MAP_EDITOR_MIN_CELL_SIZE}
              max={MAP_EDITOR_MAX_CELL_SIZE}
              step="4"
              value={cellSize}
              onChange={(event) => changeCellSize(Number(event.currentTarget.value))}
            />
            <span>{cellSize}px / cell</span>
          </label>
        </section>

        <section>
          <h2>视图</h2>
          <div className="map-editor-segment">
            <button type="button" className={showMinimap ? "active" : ""} onClick={() => setShowMinimap((current) => !current)}>
              {showMinimap ? "隐藏小地图" : "显示小地图"}
            </button>
            <button type="button" className={showCollisionOverlay ? "active" : ""} onClick={() => setShowCollisionOverlay((current) => !current)}>
              {showCollisionOverlay ? "隐藏碰撞" : "显示碰撞"}
            </button>
          </div>
        </section>

        <section>
          <h2>玩家出生点</h2>
          <div className="map-editor-segment">
            <button type="button" onClick={placeSpawnAtPlayer}>
              放置出生点
            </button>
            <button type="button" onClick={movePlayerToSpawn}>
              回到出生点
            </button>
          </div>
        </section>

        <section>
          <h2>整体移动</h2>
          <div className="map-editor-shift-controls" aria-label="地图整体移动">
            <span />
            <button type="button" onClick={() => shiftWholeMap(0, -1)} aria-label="整体上移一格">上移</button>
            <span />
            <button type="button" onClick={() => shiftWholeMap(-1, 0)} aria-label="整体左移一格">左移</button>
            <button type="button" onClick={() => shiftWholeMap(0, 1)} aria-label="整体下移一格">下移</button>
            <button type="button" onClick={() => shiftWholeMap(1, 0)} aria-label="整体右移一格">右移</button>
          </div>
        </section>

        <section>
          <h2>派生层</h2>
          <dl className="map-editor-stats">
            <div><dt>地图范围</dt><dd>{MAP_EDITOR_COLUMNS} x {MAP_EDITOR_ROWS}</dd></div>
            <div><dt>可行走</dt><dd>{tileCounts.ground}</dd></div>
            <div><dt>阻挡/虚空</dt><dd>{blockedCount}</dd></div>
            <div><dt>墙壁</dt><dd>{tileCounts.wall}</dd></div>
            <div><dt>角色格</dt><dd>{playerGrid.x}, {playerGrid.y}</dd></div>
            <div><dt>视图格</dt><dd>{cameraGrid.x}, {cameraGrid.y}</dd></div>
            <div><dt>出生点</dt><dd>{spawn.x}, {spawn.y}</dd></div>
          </dl>
        </section>

        <section>
          <h2>场景</h2>
          <p>草稿仍会自动备份到浏览器本地；正式保存会写入地图 JSON 文件。</p>
          <div className="map-editor-actions">
            <button type="button" onClick={undoLastMapEditorEdit} disabled={undoStack.length === 0}>撤销</button>
            <button type="button" onClick={resetSample}>恢复 map_001</button>
            <button type="button" onClick={clearAll}>清空</button>
          </div>
          <p>{saveNotice}</p>
        </section>
      </aside>

      <section
        className="map-editor-stage"
        aria-label="tilemap 编辑场景"
      >
        <div
          ref={gridRef}
          className="map-editor-grid"
          style={{
            width: MAP_EDITOR_COLUMNS * cellSize,
            height: MAP_EDITOR_ROWS * cellSize,
            gridTemplateColumns: `repeat(${MAP_EDITOR_COLUMNS}, ${cellSize}px)`,
            transform: mapEditorCameraTransform(editMode ? editorCamera : player),
            ["--map-editor-cell-size" as string]: `${cellSize}px`
          } as CSSProperties}
        >
          <MapEditorTileCells
            tiles={tiles}
            cellSize={cellSize}
            dragState={dragState}
            visibleBounds={visibleBounds}
            onBeginPaint={beginPaint}
            onUpdatePaint={updatePaint}
            onFinishPaint={finishPaint}
          />
          <span
            className="map-editor-spawn-marker"
            style={mapEditorSpawnMarkerStyle(spawn, cellSize)}
            title={`玩家出生点 x:${spawn.x} y:${spawn.y}`}
          />
          <MapEditorZoneOverlay
            zones={zones}
            drafts={activeZoneDraft ? [...zoneDrafts, activeZoneDraft] : zoneDrafts}
            cellSize={cellSize}
            selectedZoneId={selectedZoneId}
            onSelect={setSelectedZoneId}
          />
          {showGridLines ? (
            <div
              className="map-editor-grid-line-overlay"
              style={{ backgroundSize: `${cellSize}px ${cellSize}px` }}
              aria-hidden="true"
            />
          ) : null}
          {showCollisionOverlay ? (
            <MapEditorCollisionOverlay
              tiles={tiles}
              cellSize={cellSize}
              colliders={colliders}
              player={player}
              visibleBounds={visibleBounds}
            />
          ) : null}
          <div
            className="map-editor-player player unit-visual unit-visual-player"
            style={mapEditorPlayerStyle(player, playerFrame)}
            data-animation-state={playerFrame.animation.state}
            data-animation-direction={playerFrame.animation.direction}
            aria-label="可移动角色大小参照物"
          >
            <UnitAnimationSprite frame={playerFrame} />
          </div>
        </div>
        {showMinimap ? (
          <MapEditorMinimap
            tiles={tiles}
            playerGrid={playerGrid}
            spawn={spawn}
            visibleBounds={visibleBounds}
            showGridLines={showGridLines}
            onToggleGridLines={() => setShowGridLines((current) => !current)}
            onClose={() => setShowMinimap(false)}
          />
        ) : null}
      </section>
    </main>
  );
}

function MapEditorMinimap({
  tiles,
  playerGrid,
  spawn,
  visibleBounds,
  showGridLines,
  onToggleGridLines,
  onClose
}: {
  tiles: MapEditorTileKind[][];
  playerGrid: MapEditorCellPoint;
  spawn: MapEditorCellPoint;
  visibleBounds: MapEditorVisibleBounds;
  showGridLines: boolean;
  onToggleGridLines: () => void;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const image = context.createImageData(MAP_EDITOR_COLUMNS, MAP_EDITOR_ROWS);
    for (let y = 0; y < MAP_EDITOR_ROWS; y += 1) {
      for (let x = 0; x < MAP_EDITOR_COLUMNS; x += 1) {
        const offset = (y * MAP_EDITOR_COLUMNS + x) * 4;
        const tile = tiles[y]?.[x] ?? "empty";
        const color = mapEditorMinimapTileColor(tile);
        image.data[offset] = color.r;
        image.data[offset + 1] = color.g;
        image.data[offset + 2] = color.b;
        image.data[offset + 3] = 255;
      }
    }
    context.putImageData(image, 0, 0);
  }, [tiles]);

  return (
    <aside className="map-editor-minimap" aria-label="小地图">
      <div className="map-editor-minimap-header">
        <strong>小地图</strong>
        <div className="map-editor-minimap-actions">
          <button
            type="button"
            className={showGridLines ? "active" : ""}
            onClick={onToggleGridLines}
            aria-pressed={showGridLines}
            aria-label="切换地图格子线框"
          >
            {showGridLines ? "隐藏线框" : "显示线框"}
          </button>
          <button type="button" onClick={onClose} aria-label="关闭小地图">关闭</button>
        </div>
      </div>
      <div className="map-editor-minimap-body">
        <canvas
          ref={canvasRef}
          width={MAP_EDITOR_COLUMNS}
          height={MAP_EDITOR_ROWS}
          style={{ width: MAP_EDITOR_MINIMAP_WIDTH, height: MAP_EDITOR_MINIMAP_HEIGHT }}
        />
        <span className="map-editor-minimap-viewport" style={mapEditorMinimapBoundsStyle(visibleBounds)} />
        <span className="map-editor-minimap-spawn" style={mapEditorMinimapPointStyle(spawn)} />
        <span className="map-editor-minimap-player" style={mapEditorMinimapPointStyle(playerGrid)} />
      </div>
    </aside>
  );
}

const MapEditorCollisionOverlay = memo(function MapEditorCollisionOverlay({
  tiles,
  cellSize,
  colliders,
  player,
  visibleBounds
}: {
  tiles: MapEditorTileKind[][];
  cellSize: number;
  colliders: MapEditorTileColliderConfig;
  player: { x: number; y: number };
  visibleBounds: MapEditorVisibleBounds;
}) {
  const nodes: ReactNode[] = [];
  for (let y = visibleBounds.minY; y <= visibleBounds.maxY; y += 1) {
    for (let x = visibleBounds.minX; x <= visibleBounds.maxX; x += 1) {
      const tile = tiles[y]?.[x] ?? "empty";
      const collider = mapEditorColliderForTile(tile, colliders);
      if (!collider.enabled || collider.width <= 0 || collider.height <= 0) continue;
      nodes.push(
        <span
          key={`${x}-${y}`}
          className={`map-editor-collider-box map-editor-collider-${tile}`}
          style={mapEditorTileColliderStyle(x, y, collider, cellSize)}
        />
      );
    }
  }
  nodes.push(
    <span
      key="player"
      className="map-editor-collider-box map-editor-collider-player"
      style={mapEditorWorldColliderStyle(mapEditorPlayerColliderWorld(player, cellSize))}
    />
  );
  return <div className="map-editor-collision-layer" aria-label="碰撞体范围">{nodes}</div>;
});

const MapEditorZoneOverlay = memo(function MapEditorZoneOverlay({
  zones,
  drafts,
  cellSize,
  selectedZoneId,
  onSelect
}: {
  zones: MapEditorZone[];
  drafts: MapEditorZoneDraft[];
  cellSize: number;
  selectedZoneId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="map-editor-zone-layer" aria-label="刷怪区域">
      {zones.map((zone) => (
        mapEditorZoneRects(zone).map((rect, rectIndex, rects) => (
          <button
            key={`${zone.id}-${rectIndex}`}
            type="button"
            className={`map-editor-zone map-editor-zone-${zone.zoneType} ${selectedZoneId === zone.id ? "selected" : ""}`}
            style={mapEditorZoneRectStyle(rect, cellSize, rects)}
            data-zone-type={zone.zoneType}
            title={`${mapEditorZoneTypeLabel(zone.zoneType)} / 区域 ${zone.id}`}
            onPointerDown={(event) => {
              event.stopPropagation();
              onSelect(zone.id);
            }}
          >
            {rectIndex === 0 ? <span>{mapEditorZoneTypeLabel(zone.zoneType)}</span> : null}
          </button>
        ))
      ))}
      {drafts.map((draft, index) => (
        <div
          key={`draft-${index}`}
          className={`map-editor-zone map-editor-zone-draft map-editor-zone-${draft.zoneType}`}
          style={mapEditorZoneRectStyle(mapEditorZoneRectFromDraft(draft), cellSize, drafts.map(mapEditorZoneRectFromDraft))}
          data-zone-type={draft.zoneType}
        >
          <span>待确定 {index + 1}</span>
        </div>
      ))}
    </div>
  );
});

const MapEditorTileCells = memo(function MapEditorTileCells({
  tiles,
  cellSize,
  dragState,
  visibleBounds,
  onBeginPaint,
  onUpdatePaint,
  onFinishPaint
}: {
  tiles: MapEditorTileKind[][];
  cellSize: number;
  dragState: MapEditorDragState | null;
  visibleBounds: MapEditorVisibleBounds;
  onBeginPaint: (event: ReactPointerEvent<HTMLButtonElement>, x: number, y: number) => void;
  onUpdatePaint: (x: number, y: number) => void;
  onFinishPaint: () => void;
}) {
  const selection = dragState ? mapEditorSelectionSet(dragState.start, dragState.current) : null;
  const cells: ReactNode[] = [];
  for (let y = visibleBounds.minY; y <= visibleBounds.maxY; y += 1) {
    for (let x = visibleBounds.minX; x <= visibleBounds.maxX; x += 1) {
      const tile = tiles[y]?.[x] ?? "empty";
      const selected = selection?.has(mapEditorPointKey(x, y)) ?? false;
      const autotile = mapEditorAutotileState(tiles, x, y, tile);
      const connectionClass = mapEditorTileConnectionClass(tiles, x, y, tile, autotile);
      cells.push(
        <button
          key={`${x}-${y}`}
          type="button"
          className={`map-editor-cell map-editor-tile-${tile} ${connectionClass} ${selected ? "map-editor-cell-selected" : ""}`}
          data-autotile-role={autotile.role}
          data-autotile-same={mapEditorAutotileSideValue(autotile.sameSides)}
          data-autotile-edge={mapEditorAutotileSideValue(autotile.edgeSides)}
          data-autotile-boundary={mapEditorAutotileSideValue(autotile.boundarySides)}
          data-autotile-inner-corner={mapEditorAutotileCornerValue(autotile.innerCorners)}
          data-autotile-outer-corner={mapEditorAutotileCornerValue(autotile.outerCorners)}
          title={`x:${x} y:${y} ${mapEditorTileLabel(tile)}`}
          style={{
            left: x * cellSize,
            top: y * cellSize,
            backgroundPosition: `${-x * cellSize}px ${-y * cellSize}px`,
            backgroundSize: `${cellSize * 4}px ${cellSize * 4}px`
          }}
          onPointerDown={(event) => onBeginPaint(event, x, y)}
          onPointerEnter={() => onUpdatePaint(x, y)}
          onPointerUp={onFinishPaint}
        />
      );
    }
  }
  return <>{cells}</>;
});

function isMapEditorTypingTarget(target: HTMLElement | null) {
  if (!target) return false;
  if (target.tagName === "TEXTAREA" || target.tagName === "SELECT") return true;
  if (target instanceof HTMLInputElement) return target.type !== "range";
  return false;
}

function loadMapEditorState(): MapEditorSavedState {
  if (typeof window === "undefined") {
    return createDefaultMapEditorState();
  }
  try {
    const raw = window.localStorage.getItem(MAP_EDITOR_STORAGE_KEY);
    if (!raw) return createDefaultMapEditorState();
    const parsed = JSON.parse(raw) as Partial<MapEditorSavedState>;
    const sourceSize = mapEditorTileSourceSize(parsed.tiles);
    const expansionOffset = mapEditorExpansionOffset(sourceSize.width, sourceSize.height);
    return {
      tiles: normalizeMapEditorTiles(parsed.tiles),
      cellSize: Math.round(clampNumber(Number(parsed.cellSize ?? MAP_EDITOR_DEFAULT_CELL_SIZE), MAP_EDITOR_MIN_CELL_SIZE, MAP_EDITOR_MAX_CELL_SIZE)),
      spawn: normalizeMapEditorSpawn(parsed.spawn, expansionOffset),
      colliders: normalizeMapEditorColliders(parsed.colliders),
      zones: normalizeMapEditorZones(parsed.zones, expansionOffset),
      width: MAP_EDITOR_COLUMNS,
      height: MAP_EDITOR_ROWS
    };
  } catch {
    return createDefaultMapEditorState();
  }
}

function saveMapEditorState(state: MapEditorSavedState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MAP_EDITOR_STORAGE_KEY, JSON.stringify({
    tiles: normalizeMapEditorTiles(state.tiles),
    cellSize: Math.round(clampNumber(state.cellSize, MAP_EDITOR_MIN_CELL_SIZE, MAP_EDITOR_MAX_CELL_SIZE)),
    spawn: clampMapEditorPoint(state.spawn),
    colliders: normalizeMapEditorColliders(state.colliders),
    zones: normalizeMapEditorZones(state.zones),
    width: MAP_EDITOR_COLUMNS,
    height: MAP_EDITOR_ROWS
  }));
}

function loadMapEditorCurrentFileName() {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(MAP_EDITOR_CURRENT_FILE_STORAGE_KEY);
  return value && value.endsWith(".json") ? value : null;
}

function saveMapEditorCurrentFileName(fileName: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MAP_EDITOR_CURRENT_FILE_STORAGE_KEY, fileName);
}

function clearMapEditorCurrentFileName() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(MAP_EDITOR_CURRENT_FILE_STORAGE_KEY);
}

async function requestMapEditorDirectoryWritePermission(handle: MapEditorDirectoryHandle) {
  const descriptor = { mode: "readwrite" as const };
  if (handle.queryPermission && await handle.queryPermission(descriptor) === "granted") return true;
  if (!handle.requestPermission) return true;
  return await handle.requestPermission(descriptor) === "granted";
}

async function listMapEditorFiles(handle: MapEditorDirectoryHandle) {
  const files: string[] = [];
  for await (const entry of handle.values()) {
    if (entry.kind === "file" && entry.name.toLowerCase().endsWith(".json")) files.push(entry.name);
  }
  return files.sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
}

async function nextMapEditorFileName(handle: MapEditorDirectoryHandle) {
  const files = await listMapEditorFiles(handle).catch(() => []);
  const maxIndex = files.reduce((max, fileName) => {
    const match = /^map_(\d+)\.json$/i.exec(fileName);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `map_${String(maxIndex + 1).padStart(3, "0")}.json`;
}

async function writeMapEditorFile(handle: MapEditorDirectoryHandle, fileName: string, state: MapEditorSavedState) {
  const fileHandle = await handle.getFileHandle(fileName, { create: true });
  await writeMapEditorFileHandle(fileHandle, fileName, state);
}

async function writeMapEditorFileHandle(fileHandle: MapEditorFileHandle, fileName: string, state: MapEditorSavedState) {
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(createMapEditorFileDocument(fileName, state), null, 2));
  await writable.close();
}

async function readMapEditorFile(fileHandle: MapEditorFileHandle): Promise<MapEditorSavedState> {
  const file = await fileHandle.getFile();
  const parsed = JSON.parse(await file.text()) as Partial<MapEditorFileDocument>;
  return normalizeMapEditorFileDocument(parsed);
}

function normalizeMapEditorFileDocument(parsed: Partial<MapEditorFileDocument>): MapEditorSavedState {
  return {
    tiles: normalizeMapEditorTiles(parsed.tiles),
    cellSize: Math.round(clampNumber(Number(parsed.cellSize ?? MAP_EDITOR_DEFAULT_CELL_SIZE), MAP_EDITOR_MIN_CELL_SIZE, MAP_EDITOR_MAX_CELL_SIZE)),
    spawn: normalizeMapEditorSpawn(parsed.spawn),
    colliders: normalizeMapEditorColliders(parsed.colliders),
    zones: normalizeMapEditorZones(parsed.zones),
    width: MAP_EDITOR_COLUMNS,
    height: MAP_EDITOR_ROWS
  };
}

function createMapEditorFileDocument(fileName: string, state: MapEditorSavedState): MapEditorFileDocument {
  return {
    format: "poe.tilemap.editor",
    version: 1,
    name: fileName.replace(/\.json$/i, ""),
    savedAt: new Date().toISOString(),
    tiles: normalizeMapEditorTiles(state.tiles),
    cellSize: Math.round(clampNumber(state.cellSize, MAP_EDITOR_MIN_CELL_SIZE, MAP_EDITOR_MAX_CELL_SIZE)),
    spawn: clampMapEditorPoint(state.spawn),
    colliders: normalizeMapEditorColliders(state.colliders),
    zones: normalizeMapEditorZones(state.zones),
    width: MAP_EDITOR_COLUMNS,
    height: MAP_EDITOR_ROWS
  };
}

function isMapEditorAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

async function loadMapEditorDirectoryHandle() {
  if (typeof indexedDB === "undefined") return null;
  try {
    const db = await openMapEditorHandleDatabase();
    const transaction = db.transaction(MAP_EDITOR_HANDLE_STORE_NAME, "readonly");
    const request = transaction.objectStore(MAP_EDITOR_HANDLE_STORE_NAME).get(MAP_EDITOR_DIRECTORY_HANDLE_KEY);
    const handle = await mapEditorIdbRequest<unknown>(request);
    db.close();
    return isMapEditorDirectoryHandle(handle) ? handle : null;
  } catch {
    return null;
  }
}

async function storeMapEditorDirectoryHandle(handle: MapEditorDirectoryHandle) {
  if (typeof indexedDB === "undefined") return;
  try {
    const db = await openMapEditorHandleDatabase();
    const transaction = db.transaction(MAP_EDITOR_HANDLE_STORE_NAME, "readwrite");
    await mapEditorIdbRequest(transaction.objectStore(MAP_EDITOR_HANDLE_STORE_NAME).put(handle, MAP_EDITOR_DIRECTORY_HANDLE_KEY));
    db.close();
  } catch {
    // Directory handles are an enhancement; saving still works for the current session without persistence.
  }
}

function openMapEditorHandleDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(MAP_EDITOR_HANDLE_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MAP_EDITOR_HANDLE_STORE_NAME)) db.createObjectStore(MAP_EDITOR_HANDLE_STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function mapEditorIdbRequest<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function isMapEditorDirectoryHandle(value: unknown): value is MapEditorDirectoryHandle {
  return Boolean(value && typeof value === "object" && (value as Partial<MapEditorDirectoryHandle>).kind === "directory");
}

function normalizeMapEditorTiles(value: unknown): MapEditorTileKind[][] {
  if (!Array.isArray(value)) return createDefaultMapEditorTiles();
  const sourceSize = mapEditorTileSourceSize(value);
  const offset = mapEditorExpansionOffset(sourceSize.width, sourceSize.height);
  const next = createEmptyMapEditorTiles();
  for (let sourceY = 0; sourceY < sourceSize.height; sourceY += 1) {
    const row = (value as unknown[][])[sourceY];
    if (!Array.isArray(row)) continue;
    for (let sourceX = 0; sourceX < sourceSize.width; sourceX += 1) {
      const tile = row[sourceX];
      if (tile !== "ground" && tile !== "wall" && tile !== "empty") continue;
      const targetX = sourceX + offset.x;
      const targetY = sourceY + offset.y;
      if (targetX < 0 || targetX >= MAP_EDITOR_COLUMNS || targetY < 0 || targetY >= MAP_EDITOR_ROWS) continue;
      next[targetY][targetX] = tile;
    }
  }
  return next;
}

function createDefaultMapEditorColliders(): MapEditorTileColliderConfig {
  return {
    empty: { enabled: true, x: 0, y: 0, width: 1, height: 1 },
    ground: { enabled: false, x: 0, y: 0, width: 1, height: 1 },
    wall: { enabled: true, x: 0, y: 0, width: 1, height: 1 }
  };
}

function normalizeMapEditorColliders(value: unknown): MapEditorTileColliderConfig {
  const defaults = createDefaultMapEditorColliders();
  if (!value || typeof value !== "object") return defaults;
  const source = value as Partial<Record<MapEditorTileKind, Partial<MapEditorCollider>>>;
  return {
    empty: normalizeMapEditorCollider({ ...defaults.empty, ...source.empty }),
    ground: normalizeMapEditorCollider({ ...defaults.ground, ...source.ground }),
    wall: normalizeMapEditorCollider({ ...defaults.wall, ...source.wall })
  };
}

function normalizeMapEditorZones(value: unknown, offset: MapEditorCellPoint = { x: 0, y: 0 }): MapEditorZone[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => normalizeMapEditorZone(item, offset)).filter((zone): zone is MapEditorZone => Boolean(zone));
}

function normalizeMapEditorZone(value: unknown, offset: MapEditorCellPoint = { x: 0, y: 0 }): MapEditorZone | null {
  const source = value && typeof value === "object" ? value as Partial<MapEditorZone> : {};
  const rects = normalizeMapEditorZoneRects(source, offset);
  if (rects.length === 0) return null;
  return {
    id: safeMapEditorId(source.id, "zone"),
    zoneType: normalizeMapEditorZoneType(source.zoneType),
    shape: "rectangle",
    points: rects.flatMap((rect) => [rect.start, rect.end]),
    rects
  };
}

function normalizeMapEditorZoneRects(source: Partial<MapEditorZone>, offset: MapEditorCellPoint): MapEditorZoneRect[] {
  if (Array.isArray(source.rects)) {
    return source.rects
      .map((rect) => normalizeMapEditorZoneRect(rect, offset))
      .filter((rect): rect is MapEditorZoneRect => Boolean(rect));
  }
  const points = Array.isArray(source.points)
    ? source.points.map((point) => normalizeMapEditorZonePoint(point, offset)).filter((point): point is MapEditorCellPoint => Boolean(point))
    : [];
  const rects: MapEditorZoneRect[] = [];
  for (let index = 0; index + 1 < points.length; index += 2) {
    rects.push({ start: points[index], end: points[index + 1] });
  }
  return rects;
}

function normalizeMapEditorZoneRect(value: unknown, offset: MapEditorCellPoint): MapEditorZoneRect | null {
  if (!value || typeof value !== "object") return null;
  const rect = value as Partial<MapEditorZoneRect>;
  const start = normalizeMapEditorZonePoint(rect.start, offset);
  const end = normalizeMapEditorZonePoint(rect.end, offset);
  return start && end ? { start, end } : null;
}

function normalizeMapEditorZonePoint(value: unknown, offset: MapEditorCellPoint): MapEditorCellPoint | null {
  if (!value || typeof value !== "object") return null;
  const point = value as Partial<MapEditorCellPoint>;
  const x = Number(point.x);
  const y = Number(point.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return clampMapEditorPoint({ x: Math.round(x) + offset.x, y: Math.round(y) + offset.y });
}

function normalizeMapEditorZoneType(value: unknown): ProceduralZoneType {
  return MAP_EDITOR_ZONE_TYPES.some((option) => option.id === value) ? value as ProceduralZoneType : "main_room";
}

function normalizeMapEditorZoneDraft(draft: MapEditorZoneDraft): MapEditorZoneDraft {
  return {
    zoneType: draft.zoneType,
    start: clampMapEditorPoint(draft.start),
    current: clampMapEditorPoint(draft.current)
  };
}

function mapEditorZoneRectFromDraft(draft: MapEditorZoneDraft): MapEditorZoneRect {
  return {
    start: clampMapEditorPoint(draft.start),
    end: clampMapEditorPoint(draft.current)
  };
}

function safeMapEditorId(value: unknown, prefix: string) {
  return typeof value === "string" && /^[a-z0-9_-]+$/i.test(value)
    ? value
    : `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function runtimeBattleMapOptions(): RuntimeBattleMapOption[] {
  const editorMap = map001Document as unknown as MapEditorFileDocument;
  const gridSize = editorRuntimeGridSize(editorMap);
  return [
    {
      id: EDITOR_RUNTIME_MAP_ID,
      displayName: editorMap.name || "map_001",
      biome: "map editor",
      worldWidth: (editorMap.width || MAP_EDITOR_COLUMNS) * gridSize,
      worldHeight: (editorMap.height || MAP_EDITOR_ROWS) * gridSize
    }
  ];
}

function createEditorRuntimeBattleMap(source: MapEditorFileDocument): EditorRuntimeBattleMapData {
  const tiles = normalizeMapEditorTiles(source.tiles);
  const colliders = normalizeMapEditorColliders(source.colliders);
  const zones = normalizeMapEditorZones(source.zones);
  const gridWidth = source.width || MAP_EDITOR_COLUMNS;
  const gridHeight = source.height || MAP_EDITOR_ROWS;
  const gridSize = editorRuntimeGridSize(source);
  const worldWidth = gridWidth * gridSize;
  const worldHeight = gridHeight * gridSize;
  const walkableGrid = Array.from({ length: gridHeight }, () => Array.from({ length: gridWidth }, () => false));
  const blockerGrid = Array.from({ length: gridHeight }, () => Array.from({ length: gridWidth }, () => true));
  const walkablePoints: MapPoint[] = [];
  for (let gridY = 0; gridY < gridHeight; gridY += 1) {
    for (let gridX = 0; gridX < gridWidth; gridX += 1) {
      const tile = tiles[gridY]?.[gridX] ?? "empty";
      const blocked = mapEditorRuntimeTileBlocks(tile, colliders);
      walkableGrid[gridY][gridX] = !blocked;
      blockerGrid[gridY][gridX] = blocked;
      if (!blocked) walkablePoints.push(editorRuntimeMapPoint(gridX, gridY, gridSize));
    }
  }

  const meta = {
    id: EDITOR_RUNTIME_MAP_ID,
    biome: "map editor",
    display_name: source.name || "map_001",
    background: "map_001.json",
    walkable_mask: "map_001.json tiles",
    blocker_mask: "map_001.json colliders",
    spawn_mask: "map_001.json zones",
    pixel_width: worldWidth,
    pixel_height: worldHeight,
    world_width: worldWidth,
    world_height: worldHeight,
    grid_size: gridSize,
    player_spawn_policy: "map_001.json spawn",
    enemy_spawn_policy: "map_001.json zones",
    elite_spawn_policy: "map_001.json zones",
    boss_spawn_policy: "map_001.json boss_room zones",
    exit_policy: "map_001.json exit_area zones",
    collision_source: "map_001.json colliders",
    navigation_source: "map_001.json tiles"
  };
  const requestedSpawn = source.spawn ?? MAP_EDITOR_DEFAULT_SPAWN;
  const playerSpawn = nearestEditorRuntimeWalkablePoint(
    editorRuntimeMapPoint(Math.floor(requestedSpawn.x), Math.floor(requestedSpawn.y), gridSize),
    walkablePoints
  );
  const zoneCenters = zones.map((zone) => mapEditorZoneCenter(zone));
  const enemySpawnPoints = zoneCenters.map((point) => editorRuntimeCoordinatePoint(point.x, point.y, gridSize));
  const bossPoints = zones
    .filter((zone) => zone.zoneType === "boss_room")
    .map((zone) => mapEditorZoneCenter(zone))
    .map((point) => editorRuntimeCoordinatePoint(point.x, point.y, gridSize));

  return {
    id: EDITOR_RUNTIME_MAP_ID,
    displayName: source.name || "map_001",
    backgroundUrl: "",
    meta,
    gridWidth,
    gridHeight,
    walkableGrid,
    blockerGrid,
    walkablePoints,
    playerSpawn,
    enemySpawnPoints,
    eliteSpawnPoints: [],
    bossPoints,
    exitPoints: [],
    interactionPoints: [],
    debugWarnings: [],
    editorTiles: tiles,
    editorZones: zones
  };
}

function editorRuntimeGridSize(source: Partial<MapEditorSavedState>) {
  return Number.isFinite(source.cellSize) && Number(source.cellSize) > 0
    ? Number(source.cellSize)
    : MAP_EDITOR_DEFAULT_CELL_SIZE;
}

function mapEditorRuntimeTileBlocks(tile: MapEditorTileKind, colliders: MapEditorTileColliderConfig) {
  const collider = mapEditorColliderForTile(tile, colliders);
  return collider.enabled && collider.width > 0 && collider.height > 0;
}

function editorRuntimeMapPoint(gridX: number, gridY: number, gridSize: number): MapPoint {
  return {
    x: gridX * gridSize + gridSize / 2,
    y: gridY * gridSize + gridSize / 2,
    gridX,
    gridY
  };
}

function editorRuntimeCoordinatePoint(x: number, y: number, gridSize: number): MapPoint {
  return {
    x: clamp(x * gridSize, 0, MAP_EDITOR_COLUMNS * gridSize - 1),
    y: clamp(y * gridSize, 0, MAP_EDITOR_ROWS * gridSize - 1),
    gridX: clamp(Math.floor(x), 0, MAP_EDITOR_COLUMNS - 1),
    gridY: clamp(Math.floor(y), 0, MAP_EDITOR_ROWS - 1)
  };
}

function nearestEditorRuntimeWalkablePoint(point: MapPoint, walkablePoints: MapPoint[]) {
  if (walkablePoints.length === 0) return point;
  let nearest = walkablePoints[0];
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of walkablePoints) {
    const candidateDistance = Math.hypot(candidate.x - point.x, candidate.y - point.y);
    if (candidateDistance < nearestDistance) {
      nearest = candidate;
      nearestDistance = candidateDistance;
    }
  }
  return nearest;
}

function isEditorRuntimeBattleMap(map: BakedBattleMapData): map is EditorRuntimeBattleMapData {
  return Array.isArray((map as Partial<EditorRuntimeBattleMapData>).editorTiles);
}

function normalizeMapEditorCollider(value: Partial<MapEditorCollider>): MapEditorCollider {
  const x = clampNumber(Number(value.x ?? 0), 0, 1);
  const y = clampNumber(Number(value.y ?? 0), 0, 1);
  return {
    enabled: Boolean(value.enabled),
    x,
    y,
    width: clampNumber(Number(value.width ?? 1), 0, 1 - x),
    height: clampNumber(Number(value.height ?? 1), 0, 1 - y)
  };
}

function mapEditorTileSourceSize(value: unknown) {
  if (!Array.isArray(value)) return { width: 0, height: 0 };
  const height = value.length;
  const width = value.reduce((maxWidth, row) => Array.isArray(row) ? Math.max(maxWidth, row.length) : maxWidth, 0);
  return { width, height };
}

function mapEditorExpansionOffset(width: number, height: number): MapEditorCellPoint {
  return {
    x: width > 0 && width < MAP_EDITOR_COLUMNS ? Math.floor((MAP_EDITOR_COLUMNS - width) / 2) : 0,
    y: height > 0 && height < MAP_EDITOR_ROWS ? Math.floor((MAP_EDITOR_ROWS - height) / 2) : 0
  };
}

function normalizeMapEditorSpawn(value: unknown, offset: MapEditorCellPoint = { x: 0, y: 0 }): MapEditorCellPoint {
  if (value && typeof value === "object" && "x" in value && "y" in value) {
    const point = value as Partial<MapEditorCellPoint>;
    const x = Number(point.x);
    const y = Number(point.y);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      return clampMapEditorPoint({ x: Math.round(x) + offset.x, y: Math.round(y) + offset.y });
    }
  }
  return { ...MAP_EDITOR_DEFAULT_SPAWN };
}

function createDefaultMapEditorState(): MapEditorSavedState {
  return normalizeMapEditorFileDocument(map001Document as unknown as MapEditorFileDocument);
}

function cloneMapEditorState(state: MapEditorSavedState): MapEditorSavedState {
  return {
    tiles: state.tiles.map((row) => [...row]),
    cellSize: state.cellSize,
    spawn: { ...state.spawn },
    colliders: normalizeMapEditorColliders(state.colliders),
    zones: state.zones.map((zone) => ({
      ...zone,
      points: zone.points.map((point) => ({ ...point }))
    })),
    width: MAP_EDITOR_COLUMNS,
    height: MAP_EDITOR_ROWS
  };
}

function createEmptyMapEditorTiles(): MapEditorTileKind[][] {
  return Array.from({ length: MAP_EDITOR_ROWS }, () => Array.from({ length: MAP_EDITOR_COLUMNS }, () => "empty" as const));
}

function createDefaultMapEditorTiles(): MapEditorTileKind[][] {
  const tiles = createEmptyMapEditorTiles();
  const paint = (start: MapEditorCellPoint, end: MapEditorCellPoint, tile: MapEditorTileKind) => {
    paintMapEditorTilesInPlace(
      tiles,
      { x: start.x + MAP_EDITOR_SAMPLE_OFFSET.x, y: start.y + MAP_EDITOR_SAMPLE_OFFSET.y },
      { x: end.x + MAP_EDITOR_SAMPLE_OFFSET.x, y: end.y + MAP_EDITOR_SAMPLE_OFFSET.y },
      tile
    );
  };
  paint({ x: 5, y: 5 }, { x: 44, y: 28 }, "ground");
  paint({ x: 5, y: 5 }, { x: 44, y: 5 }, "wall");
  paint({ x: 5, y: 28 }, { x: 44, y: 28 }, "wall");
  paint({ x: 5, y: 5 }, { x: 5, y: 28 }, "wall");
  paint({ x: 44, y: 5 }, { x: 44, y: 28 }, "wall");
  paint({ x: 70, y: 32 }, { x: 118, y: 62 }, "ground");
  paint({ x: 70, y: 32 }, { x: 118, y: 32 }, "wall");
  paint({ x: 70, y: 62 }, { x: 118, y: 62 }, "wall");
  paint({ x: 70, y: 32 }, { x: 70, y: 62 }, "wall");
  paint({ x: 118, y: 32 }, { x: 118, y: 62 }, "wall");
  paint({ x: 44, y: 15 }, { x: 70, y: 15 }, "ground");
  paint({ x: 44, y: 14 }, { x: 70, y: 14 }, "wall");
  paint({ x: 44, y: 16 }, { x: 70, y: 16 }, "wall");
  paint({ x: 88, y: 44 }, { x: 94, y: 50 }, "wall");
  paint({ x: 23, y: 5 }, { x: 26, y: 5 }, "ground");
  paint({ x: 5, y: 16 }, { x: 5, y: 19 }, "ground");
  paint({ x: 118, y: 46 }, { x: 118, y: 49 }, "ground");
  return tiles;
}

function paintMapEditorTiles(current: MapEditorTileKind[][], start: MapEditorCellPoint, end: MapEditorCellPoint, tile: MapEditorTileKind) {
  const next = current.map((row) => [...row]);
  paintMapEditorTilesInPlace(next, start, end, tile);
  return next;
}

function shiftMapEditorTiles(current: MapEditorTileKind[][], dx: number, dy: number) {
  const next = createEmptyMapEditorTiles();
  for (let y = 0; y < MAP_EDITOR_ROWS; y += 1) {
    for (let x = 0; x < MAP_EDITOR_COLUMNS; x += 1) {
      const tile = current[y]?.[x] ?? "empty";
      const targetX = x + dx;
      const targetY = y + dy;
      if (targetX < 0 || targetX >= MAP_EDITOR_COLUMNS || targetY < 0 || targetY >= MAP_EDITOR_ROWS) continue;
      next[targetY][targetX] = tile;
    }
  }
  return next;
}

function shiftMapEditorPoint(point: MapEditorCellPoint, dx: number, dy: number): MapEditorCellPoint {
  return clampMapEditorPoint({ x: point.x + dx, y: point.y + dy });
}

function mapEditorSpawnPlanToolLabel(tool: MapEditorSpawnPlanTool) {
  if (tool === "zone") return "刷怪区域";
  return "地形";
}

function paintMapEditorTilesInPlace(tiles: MapEditorTileKind[][], start: MapEditorCellPoint, end: MapEditorCellPoint, tile: MapEditorTileKind) {
  const minX = clamp(Math.min(start.x, end.x), 0, MAP_EDITOR_COLUMNS - 1);
  const maxX = clamp(Math.max(start.x, end.x), 0, MAP_EDITOR_COLUMNS - 1);
  const minY = clamp(Math.min(start.y, end.y), 0, MAP_EDITOR_ROWS - 1);
  const maxY = clamp(Math.max(start.y, end.y), 0, MAP_EDITOR_ROWS - 1);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      tiles[y][x] = tile;
    }
  }
}

function mapEditorSelectionSet(start: MapEditorCellPoint, end: MapEditorCellPoint) {
  const result = new Set<string>();
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) result.add(mapEditorPointKey(x, y));
  }
  return result;
}

function mapEditorPointKey(x: number, y: number) {
  return `${x}-${y}`;
}

function mapEditorWallNeighborPoint(x: number, y: number, side: MapEditorWallSide) {
  switch (side) {
    case "n":
      return { x, y: y - 1 };
    case "e":
      return { x: x + 1, y };
    case "s":
      return { x, y: y + 1 };
    case "w":
      return { x: x - 1, y };
  }
}

function mapEditorWallHasNeighbor(tiles: MapEditorTileKind[][], x: number, y: number, side: MapEditorWallSide) {
  const next = mapEditorWallNeighborPoint(x, y, side);
  return next.x >= 0 && next.x < MAP_EDITOR_COLUMNS && next.y >= 0 && next.y < MAP_EDITOR_ROWS && tiles[next.y]?.[next.x] === "wall";
}

function mapEditorTileAt(tiles: MapEditorTileKind[][], x: number, y: number): MapEditorTileKind {
  if (x < 0 || x >= MAP_EDITOR_COLUMNS || y < 0 || y >= MAP_EDITOR_ROWS) return "empty";
  return tiles[y]?.[x] ?? "empty";
}

function mapEditorCornerNeighborPoint(x: number, y: number, corner: MapEditorWallCorner) {
  switch (corner) {
    case "nw":
      return { x: x - 1, y: y - 1 };
    case "ne":
      return { x: x + 1, y: y - 1 };
    case "se":
      return { x: x + 1, y: y + 1 };
    case "sw":
      return { x: x - 1, y: y + 1 };
  }
}

function mapEditorCornerSides(corner: MapEditorWallCorner): [MapEditorWallSide, MapEditorWallSide] {
  switch (corner) {
    case "nw":
      return ["n", "w"];
    case "ne":
      return ["n", "e"];
    case "se":
      return ["s", "e"];
    case "sw":
      return ["s", "w"];
  }
}

function mapEditorAutotileState(tiles: MapEditorTileKind[][], x: number, y: number, tile: MapEditorTileKind): MapEditorAutotileState {
  if (tile === "empty") {
    return { role: "empty", sameSides: [], edgeSides: [], boundarySides: [], innerCorners: [], outerCorners: [] };
  }

  const sameSides = MAP_EDITOR_WALL_SIDES.filter((side) => mapEditorTileAt(tiles, mapEditorWallNeighborPoint(x, y, side).x, mapEditorWallNeighborPoint(x, y, side).y) === tile);
  const edgeSides = MAP_EDITOR_WALL_SIDES.filter((side) => {
    const point = mapEditorWallNeighborPoint(x, y, side);
    return mapEditorTileAt(tiles, point.x, point.y) === "empty";
  });
  const boundarySides = MAP_EDITOR_WALL_SIDES.filter((side) => {
    const point = mapEditorWallNeighborPoint(x, y, side);
    const neighbor = mapEditorTileAt(tiles, point.x, point.y);
    return neighbor !== "empty" && neighbor !== tile;
  });
  const innerCorners = MAP_EDITOR_WALL_CORNERS.filter((corner) => {
    const [first, second] = mapEditorCornerSides(corner);
    const diagonal = mapEditorCornerNeighborPoint(x, y, corner);
    return sameSides.includes(first)
      && sameSides.includes(second)
      && mapEditorTileAt(tiles, diagonal.x, diagonal.y) !== tile;
  });
  const outerCorners = MAP_EDITOR_WALL_CORNERS.filter((corner) => {
    const [first, second] = mapEditorCornerSides(corner);
    return (edgeSides.includes(first) || boundarySides.includes(first))
      && (edgeSides.includes(second) || boundarySides.includes(second));
  });
  const role: MapEditorAutotileRole = sameSides.length === 4 && innerCorners.length === 0
    ? "interior"
    : sameSides.length > 0
      ? "connected"
      : "isolated";

  return { role, sameSides, edgeSides, boundarySides, innerCorners, outerCorners };
}

function mapEditorAutotileSideValue(sides: MapEditorWallSide[]) {
  return sides.length > 0 ? sides.join(" ") : "none";
}

function mapEditorAutotileCornerValue(corners: MapEditorWallCorner[]) {
  return corners.length > 0 ? corners.join(" ") : "none";
}

function mapEditorAutotileClass(autotile: MapEditorAutotileState) {
  return [
    `map-editor-autotile-${autotile.role}`,
    ...autotile.edgeSides.map((side) => `map-editor-edge-${side}`),
    ...autotile.boundarySides.map((side) => `map-editor-boundary-${side}`),
    ...autotile.innerCorners.map((corner) => `map-editor-corner-inner-${corner}`),
    ...autotile.outerCorners.map((corner) => `map-editor-corner-outer-${corner}`)
  ].join(" ");
}

function mapEditorTileConnectionClass(
  tiles: MapEditorTileKind[][],
  x: number,
  y: number,
  tile: MapEditorTileKind,
  autotile: MapEditorAutotileState = mapEditorAutotileState(tiles, x, y, tile)
) {
  const autotileClass = mapEditorAutotileClass(autotile);
  if (tile !== "wall") return autotileClass;
  return [
    autotileClass,
    ...MAP_EDITOR_WALL_SIDES
      .map((side) => mapEditorWallHasNeighbor(tiles, x, y, side) ? `map-editor-wall-${side}` : `map-editor-wall-open-${side}`),
    ...MAP_EDITOR_WALL_CORNERS
      .map((corner) => mapEditorWallNeedsCornerCap(tiles, x, y, corner) ? `map-editor-wall-corner-${corner}` : "")
  ].filter(Boolean).join(" ");
}

function mapEditorWallNeedsCornerCap(tiles: MapEditorTileKind[][], x: number, y: number, corner: MapEditorWallCorner) {
  switch (corner) {
    case "nw":
      return !mapEditorWallHasNeighbor(tiles, x, y, "n") || !mapEditorWallHasNeighbor(tiles, x, y, "w");
    case "ne":
      return !mapEditorWallHasNeighbor(tiles, x, y, "n") || !mapEditorWallHasNeighbor(tiles, x, y, "e");
    case "se":
      return !mapEditorWallHasNeighbor(tiles, x, y, "s") || !mapEditorWallHasNeighbor(tiles, x, y, "e");
    case "sw":
      return !mapEditorWallHasNeighbor(tiles, x, y, "s") || !mapEditorWallHasNeighbor(tiles, x, y, "w");
  }
}

function mapEditorCellCenter(x: number, y: number, cellSize: number) {
  return {
    x: x * cellSize + cellSize / 2,
    y: y * cellSize + cellSize / 2
  };
}

function clampMapEditorPoint(point: MapEditorCellPoint): MapEditorCellPoint {
  return {
    x: clamp(point.x, 0, MAP_EDITOR_COLUMNS - 1),
    y: clamp(point.y, 0, MAP_EDITOR_ROWS - 1)
  };
}

function clampMapEditorWorldPoint(point: { x: number; y: number }, cellSize: number) {
  return {
    x: clamp(point.x, 0, MAP_EDITOR_COLUMNS * cellSize - 1),
    y: clamp(point.y, 0, MAP_EDITOR_ROWS * cellSize - 1)
  };
}

function mapEditorWorldToGrid(point: { x: number; y: number }, cellSize: number) {
  return {
    x: clamp(Math.floor(point.x / cellSize), 0, MAP_EDITOR_COLUMNS - 1),
    y: clamp(Math.floor(point.y / cellSize), 0, MAP_EDITOR_ROWS - 1)
  };
}

function mapEditorVisibleBounds(center: MapEditorCellPoint): MapEditorVisibleBounds {
  return {
    minX: clamp(center.x - MAP_EDITOR_VISIBLE_RADIUS_X, 0, MAP_EDITOR_COLUMNS - 1),
    maxX: clamp(center.x + MAP_EDITOR_VISIBLE_RADIUS_X, 0, MAP_EDITOR_COLUMNS - 1),
    minY: clamp(center.y - MAP_EDITOR_VISIBLE_RADIUS_Y, 0, MAP_EDITOR_ROWS - 1),
    maxY: clamp(center.y + MAP_EDITOR_VISIBLE_RADIUS_Y, 0, MAP_EDITOR_ROWS - 1)
  };
}

function mapEditorColliderForTile(tile: MapEditorTileKind, colliders: MapEditorTileColliderConfig) {
  return colliders[tile] ?? createDefaultMapEditorColliders()[tile];
}

function mapEditorTileColliderWorld(x: number, y: number, collider: MapEditorCollider, cellSize: number) {
  const left = (x + collider.x) * cellSize;
  const top = (y + collider.y) * cellSize;
  const width = collider.width * cellSize;
  const height = collider.height * cellSize;
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height
  };
}

function mapEditorPlayerColliderWorld(player: { x: number; y: number }, cellSize: number) {
  const width = MAP_EDITOR_PLAYER_COLLIDER.width * cellSize;
  const height = MAP_EDITOR_PLAYER_COLLIDER.height * cellSize;
  const left = player.x - width / 2;
  const top = player.y - height / 2 + (MAP_EDITOR_PLAYER_COLLIDER.y - 0.5) * cellSize;
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height
  };
}

function rectanglesIntersect(
  left: { left: number; right: number; top: number; bottom: number },
  right: { left: number; right: number; top: number; bottom: number }
) {
  return left.left < right.right && left.right > right.left && left.top < right.bottom && left.bottom > right.top;
}

function isMapEditorWalkable(
  tiles: MapEditorTileKind[][],
  cellSize: number,
  point: { x: number; y: number },
  colliders: MapEditorTileColliderConfig
) {
  const playerCollider = mapEditorPlayerColliderWorld(point, cellSize);
  const minGridX = clamp(Math.floor(playerCollider.left / cellSize), 0, MAP_EDITOR_COLUMNS - 1);
  const maxGridX = clamp(Math.floor(playerCollider.right / cellSize), 0, MAP_EDITOR_COLUMNS - 1);
  const minGridY = clamp(Math.floor(playerCollider.top / cellSize), 0, MAP_EDITOR_ROWS - 1);
  const maxGridY = clamp(Math.floor(playerCollider.bottom / cellSize), 0, MAP_EDITOR_ROWS - 1);
  for (let y = minGridY; y <= maxGridY; y += 1) {
    for (let x = minGridX; x <= maxGridX; x += 1) {
      const tileCollider = mapEditorColliderForTile(tiles[y]?.[x] ?? "empty", colliders);
      if (!tileCollider.enabled || tileCollider.width <= 0 || tileCollider.height <= 0) continue;
      if (rectanglesIntersect(playerCollider, mapEditorTileColliderWorld(x, y, tileCollider, cellSize))) return false;
    }
  }
  return true;
}

function resolveMapEditorMove(
  tiles: MapEditorTileKind[][],
  cellSize: number,
  current: { x: number; y: number },
  moveVector: { x: number; y: number },
  distancePx: number,
  colliders: MapEditorTileColliderConfig
) {
  const length = Math.hypot(moveVector.x, moveVector.y);
  if (length <= 0) return current;
  const next = {
    x: clamp(current.x + (moveVector.x / length) * distancePx, 0, MAP_EDITOR_COLUMNS * cellSize - 1),
    y: clamp(current.y + (moveVector.y / length) * distancePx, 0, MAP_EDITOR_ROWS * cellSize - 1)
  };
  if (isMapEditorWalkable(tiles, cellSize, next, colliders)) return next;
  const xOnly = { x: next.x, y: current.y };
  if (isMapEditorWalkable(tiles, cellSize, xOnly, colliders)) return xOnly;
  const yOnly = { x: current.x, y: next.y };
  if (isMapEditorWalkable(tiles, cellSize, yOnly, colliders)) return yOnly;
  return current;
}

function countMapEditorTiles(tiles: MapEditorTileKind[][], tile: MapEditorTileKind) {
  return tiles.reduce((total, row) => total + row.filter((cell) => cell === tile).length, 0);
}

function countMapEditorBlockingTiles(tiles: MapEditorTileKind[][], colliders: MapEditorTileColliderConfig) {
  return tiles.reduce((total, row) => (
    total + row.filter((cell) => {
      const collider = mapEditorColliderForTile(cell, colliders);
      return collider.enabled && collider.width > 0 && collider.height > 0;
    }).length
  ), 0);
}

function mapEditorTileLabel(tile: MapEditorTileKind) {
  if (tile === "ground") return "地面 / 可行走";
  if (tile === "wall") return "墙壁 / 阻挡";
  return "空 / 阻挡";
}

function mapEditorColliderFieldLabel(field: MapEditorColliderNumericField) {
  if (field === "x") return "X";
  if (field === "y") return "Y";
  if (field === "width") return "W";
  return "H";
}

function mapEditorColliderPercent(value: number) {
  return Math.round(clampNumber(value, 0, 1) * 100);
}

function mapEditorMinimapTileColor(tile: MapEditorTileKind) {
  if (tile === "ground") return { r: 199, g: 201, b: 195 };
  if (tile === "wall") return { r: 94, g: 99, b: 97 };
  return { r: 7, g: 8, b: 8 };
}

function mapEditorMinimapPointStyle(point: MapEditorCellPoint): CSSProperties {
  return {
    left: `${((point.x + 0.5) / MAP_EDITOR_COLUMNS) * 100}%`,
    top: `${((point.y + 0.5) / MAP_EDITOR_ROWS) * 100}%`
  };
}

function mapEditorMinimapBoundsStyle(bounds: MapEditorVisibleBounds): CSSProperties {
  return {
    left: `${(bounds.minX / MAP_EDITOR_COLUMNS) * 100}%`,
    top: `${(bounds.minY / MAP_EDITOR_ROWS) * 100}%`,
    width: `${((bounds.maxX - bounds.minX + 1) / MAP_EDITOR_COLUMNS) * 100}%`,
    height: `${((bounds.maxY - bounds.minY + 1) / MAP_EDITOR_ROWS) * 100}%`
  };
}

function mapEditorPlayerStyle(player: { x: number; y: number }, frame: UnitAnimationFrame): CSSProperties {
  return {
    ...battleUnitStyle(player, frame, 60),
    "--unit-render-scale": MAP_EDITOR_PLAYER_RENDER_SCALE,
    pointerEvents: "none"
  };
}

function mapEditorSpawnMarkerStyle(spawn: MapEditorCellPoint, cellSize: number): CSSProperties {
  const size = clampNumber(cellSize * 0.42, 18, 34);
  return {
    left: spawn.x * cellSize + cellSize / 2,
    top: spawn.y * cellSize + cellSize / 2,
    width: size,
    height: size
  };
}

function mapEditorZoneStyle(zone: MapEditorZone, cellSize: number): CSSProperties {
  return mapEditorZoneRectStyle(mapEditorZoneRects(zone)[0], cellSize);
}

function mapEditorZoneRectStyle(rect: MapEditorZoneRect, cellSize: number, groupRects: MapEditorZoneRect[] = [rect]): CSSProperties {
  const minX = Math.min(rect.start.x, rect.end.x);
  const minY = Math.min(rect.start.y, rect.end.y);
  const maxX = Math.max(rect.start.x, rect.end.x);
  const maxY = Math.max(rect.start.y, rect.end.y);
  const hiddenBorders = mapEditorZoneRectInternalBorders(rect, groupRects);
  return {
    left: minX * cellSize,
    top: minY * cellSize,
    width: (maxX - minX + 1) * cellSize,
    height: (maxY - minY + 1) * cellSize,
    borderTopWidth: hiddenBorders.top ? 0 : undefined,
    borderRightWidth: hiddenBorders.right ? 0 : undefined,
    borderBottomWidth: hiddenBorders.bottom ? 0 : undefined,
    borderLeftWidth: hiddenBorders.left ? 0 : undefined
  };
}

function mapEditorZoneRectInternalBorders(rect: MapEditorZoneRect, groupRects: MapEditorZoneRect[]) {
  const current = mapEditorZoneRectBounds(rect);
  const hidden = { top: false, right: false, bottom: false, left: false };
  for (const otherRect of groupRects) {
    if (otherRect === rect) continue;
    const other = mapEditorZoneRectBounds(otherRect);
    const verticalOverlap = current.minY <= other.maxY && current.maxY >= other.minY;
    const horizontalOverlap = current.minX <= other.maxX && current.maxX >= other.minX;
    if (verticalOverlap && other.maxX + 1 === current.minX) hidden.left = true;
    if (verticalOverlap && other.minX - 1 === current.maxX) hidden.right = true;
    if (horizontalOverlap && other.maxY + 1 === current.minY) hidden.top = true;
    if (horizontalOverlap && other.minY - 1 === current.maxY) hidden.bottom = true;
  }
  return hidden;
}

function mapEditorZoneRectBounds(rect: MapEditorZoneRect) {
  return {
    minX: Math.min(rect.start.x, rect.end.x),
    minY: Math.min(rect.start.y, rect.end.y),
    maxX: Math.max(rect.start.x, rect.end.x),
    maxY: Math.max(rect.start.y, rect.end.y)
  };
}

function mapEditorPointerToCell(clientX: number, clientY: number, grid: HTMLDivElement | null, cellSize: number): MapEditorWorldPoint | null {
  if (!grid) return null;
  const bounds = grid.getBoundingClientRect();
  return {
    x: clampNumber((clientX - bounds.left) / cellSize, 0, MAP_EDITOR_COLUMNS - 1),
    y: clampNumber((clientY - bounds.top) / cellSize, 0, MAP_EDITOR_ROWS - 1)
  };
}

function mapEditorTileColliderStyle(x: number, y: number, collider: MapEditorCollider, cellSize: number): CSSProperties {
  return mapEditorWorldColliderStyle(mapEditorTileColliderWorld(x, y, collider, cellSize));
}

function mapEditorWorldColliderStyle(rect: { left: number; top: number; width: number; height: number }): CSSProperties {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height
  };
}

function mapEditorCameraTransform(player: { x: number; y: number }) {
  return `translate(${-player.x}px, ${-player.y}px)`;
}

const SPRITE_TEST_DIRECTIONS: UnitDirection[] = ["left", "right"];
const SPRITE_TEST_ACTIONS: UnitAnimationState[] = ["idle", "walk", "attack"];
const SPRITE_TEST_SPEEDS = [0.25, 0.5, 1, 2];
const SPRITE_TEST_DIRECTION_TEXT: Record<UnitDirection, string> = {
  up: "上",
  down: "下",
  left: "左",
  right: "右",
  up_left: "左上",
  up_right: "右上",
  down_left: "左下",
  down_right: "右下"
};
const SPRITE_TEST_ACTION_TEXT: Record<UnitAnimationState, string> = {
  idle: "待机",
  walk: "行走",
  attack: "攻击"
};
const SPRITE_TEST_RESOURCE_TEXT: Record<UnitVisualType, string> = {
  player_adventurer: "玩家角色 sprite",
  enemy_imp: "普通怪物 sprite",
  enemy_brute: "精英怪物 sprite"
};
const SPRITE_TEST_DIRECTION_VECTOR: Record<UnitDirection, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up_left: { x: -1, y: -1 },
  up_right: { x: 1, y: -1 },
  down_left: { x: -1, y: 1 },
  down_right: { x: 1, y: 1 }
};
const SPRITE_TEST_DIRECTION_FALLBACK: Record<UnitDirection, UnitDirection> = {
  down: "right",
  down_right: "right",
  right: "right",
  up_right: "right",
  up: "right",
  up_left: "left",
  left: "left",
  down_left: "left"
};
const SPRITE_TEST_UNITS = Array.from(new Set(UNIT_ANIMATION_ASSETS.map((asset) => asset.unitId))) as UnitVisualType[];
const SPRITE_TEST_PATHS = [
  { id: "horizontal", label: "横向直线", points: [{ x: 70, y: 150 }, { x: 440, y: 150 }] },
  { id: "vertical", label: "纵向直线", points: [{ x: 250, y: 40 }, { x: 250, y: 270 }] },
  { id: "diagonal", label: "斜向直线", points: [{ x: 90, y: 255 }, { x: 430, y: 55 }] },
  { id: "turn", label: "折线路径", points: [{ x: 80, y: 70 }, { x: 220, y: 70 }, { x: 220, y: 230 }, { x: 430, y: 230 }] }
];

type SpriteTestResolvedFrame = {
  frame: UnitAnimationFrame;
  exact: boolean;
  missingAction: boolean;
  requestedAction: UnitAnimationState;
  requestedDirection: UnitDirection;
};

function SpriteTestScene() {
  const [unitIndex, setUnitIndex] = useState(0);
  const [action, setAction] = useState<UnitAnimationState>("idle");
  const [direction, setDirection] = useState<UnitDirection>("right");
  const [playing, setPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [manualFrame, setManualFrame] = useState<number | null>(null);
  const [showCollision, setShowCollision] = useState(false);
  const [showAttachment, setShowAttachment] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [autoCycle, setAutoCycle] = useState(false);
  const [screenshotMode, setScreenshotMode] = useState(false);
  const [pathId, setPathId] = useState(SPRITE_TEST_PATHS[0].id);
  const unitId = SPRITE_TEST_UNITS[unitIndex] ?? SPRITE_TEST_UNITS[0] ?? "player_adventurer";
  const resolved = resolveSpriteTestFrame(unitId, action, direction, elapsedMs, playbackSpeed, manualFrame);
  const currentAsset = resolved.frame.animation;
  const currentFrame = resolved.frame.frameIndex;
  const missingMessages = spriteTestMissingMessages(unitId, action, direction, resolved);
  const walkPath = SPRITE_TEST_PATHS.find((path) => path.id === pathId) ?? SPRITE_TEST_PATHS[0];
  const walkProgress = ((elapsedMs * playbackSpeed) % 3200) / 3200;
  const walkPoint = pointOnSpriteTestPath(walkPath.points, walkProgress);
  const walkDirection = directionFromSpriteTestPath(walkPath.points, walkProgress);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let previous = performance.now();
    function tick(now: number) {
      const dt = Math.min(80, now - previous);
      previous = now;
      setElapsedMs((value) => value + dt);
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  useEffect(() => {
    if (!autoCycle) return;
    const timer = window.setInterval(() => {
      setDirection((current) => {
        const index = SPRITE_TEST_DIRECTIONS.indexOf(current);
        return SPRITE_TEST_DIRECTIONS[(index + 1) % SPRITE_TEST_DIRECTIONS.length];
      });
      setManualFrame(null);
      setElapsedMs(0);
    }, action === "attack" ? 900 : 1300);
    return () => window.clearInterval(timer);
  }, [action, autoCycle]);

  function selectUnit(nextIndex: number) {
    const count = Math.max(1, SPRITE_TEST_UNITS.length);
    setUnitIndex((nextIndex + count) % count);
    setManualFrame(null);
    setElapsedMs(0);
  }

  function selectAction(nextAction: UnitAnimationState) {
    setAction(nextAction);
    setManualFrame(null);
    setElapsedMs(0);
  }

  function stepFrame() {
    const frameCount = Math.max(1, currentAsset.frameCount);
    setPlaying(false);
    setManualFrame((value) => ((value ?? currentFrame) + 1) % frameCount);
  }

  return (
    <main className={`sprite-test-screen ${screenshotMode ? "sprite-test-screen-shot" : ""}`} data-mode="sprite-test">
      <header className="sprite-test-header">
        <div>
          <h1>Sprites 动作测试场景</h1>
          <p>独立 Debug 入口：/sprite-test，只读现有 sprites manifest，不进入正式游戏流程；当前资源只测试左右方向。</p>
        </div>
        <a className="sprite-test-exit" href="/" aria-label="返回正式入口">返回正式入口</a>
      </header>

      <section className="sprite-test-control-panel" aria-label="测试控制面板">
        <div className="sprite-test-control-status">
          <span>当前资源：{SPRITE_TEST_RESOURCE_TEXT[unitId] ?? unitId}</span>
          <span>当前动作：{SPRITE_TEST_ACTION_TEXT[action]}</span>
          <span>当前方向：{SPRITE_TEST_DIRECTION_TEXT[direction]}</span>
          <span>播放状态：{playing ? "播放" : "暂停"}</span>
          <span>播放速度：{playbackSpeed}x</span>
          <span>当前帧：{currentFrame + 1} / {currentAsset.frameCount}</span>
          <span>资源路径：{spriteTestAssetPath(currentAsset)}</span>
          <span>碰撞框显示：{showCollision ? "开" : "关"}</span>
          <span>挂点显示：{showAttachment ? "开" : "关"}</span>
          <span>网格显示：{showGrid ? "开" : "关"}</span>
        </div>
        <div className="sprite-test-controls">
          <button type="button" onClick={() => selectUnit(unitIndex - 1)}>上一个资源</button>
          <button type="button" onClick={() => selectUnit(unitIndex + 1)}>下一个资源</button>
          <select value={unitId} aria-label="资源测试对象" onChange={(event) => selectUnit(SPRITE_TEST_UNITS.indexOf(event.target.value as UnitVisualType))}>
            {SPRITE_TEST_UNITS.map((item) => <option key={item} value={item}>{SPRITE_TEST_RESOURCE_TEXT[item] ?? item}</option>)}
          </select>
          <button type="button" onClick={() => selectAction(nextSpriteTestAction(action))}>切换动作</button>
          <button type="button" onClick={() => setDirection(nextSpriteTestDirection(direction))}>切换方向</button>
          <button type="button" onClick={() => setPlaying((value) => !value)}>{playing ? "暂停" : "播放"}</button>
          <button type="button" onClick={stepFrame}>单帧前进</button>
          <button type="button" onClick={() => { setElapsedMs(0); setManualFrame(null); }}>重置位置</button>
          <button type="button" onClick={() => setScreenshotMode((value) => !value)}>截图模式</button>
        </div>
        <div className="sprite-test-toggles">
          <label><input type="checkbox" checked={autoCycle} onChange={(event) => setAutoCycle(event.target.checked)} /> 轮播方向</label>
          <label><input type="checkbox" checked={showCollision} onChange={(event) => setShowCollision(event.target.checked)} /> 碰撞框显示</label>
          <label><input type="checkbox" checked={showAttachment} onChange={(event) => setShowAttachment(event.target.checked)} /> 挂点显示</label>
          <label><input type="checkbox" checked={showGrid} onChange={(event) => setShowGrid(event.target.checked)} /> 网格显示</label>
          <label>
            播放速度：
            <select value={playbackSpeed} onChange={(event) => setPlaybackSpeed(Number(event.target.value))}>
              {SPRITE_TEST_SPEEDS.map((speed) => <option key={speed} value={speed}>{speed}x</option>)}
            </select>
          </label>
        </div>
        <div className="sprite-test-warnings" aria-live="polite">
          {missingMessages.length === 0 ? <span>资源状态：当前动作与方向可直接播放。</span> : missingMessages.map((message) => <span key={message}>{message}</span>)}
        </div>
      </section>

      <section className="sprite-test-zones" aria-label="Sprites 动作测试区">
        <SpriteIdleTestZone
          unitId={unitId}
          direction={direction}
          frame={resolved.frame}
          elapsedMs={elapsedMs}
          playbackSpeed={playbackSpeed}
          showCollision={showCollision}
          showAttachment={showAttachment}
          showGrid={showGrid}
          onDirection={setDirection}
        />
        <SpriteMoveTestZone
          unitId={unitId}
          state="walk"
          title="行走测试区"
          actionText="行走"
          direction={direction}
          activePathId={pathId}
          walkPoint={walkPoint}
          walkDirection={walkDirection}
          elapsedMs={elapsedMs}
          playbackSpeed={playbackSpeed}
          manualFrame={manualFrame}
          showCollision={showCollision}
          showAttachment={showAttachment}
          showGrid={showGrid}
          onPath={setPathId}
        />
      </section>
    </main>
  );
}

function SpriteIdleTestZone({
  unitId,
  direction,
  frame,
  elapsedMs,
  playbackSpeed,
  showCollision,
  showAttachment,
  showGrid,
  onDirection
}: {
  unitId: UnitVisualType;
  direction: UnitDirection;
  frame: UnitAnimationFrame;
  elapsedMs: number;
  playbackSpeed: number;
  showCollision: boolean;
  showAttachment: boolean;
  showGrid: boolean;
  onDirection: (direction: UnitDirection) => void;
}) {
  return (
    <section className={`sprite-test-zone sprite-test-idle-zone ${showGrid ? "sprite-test-grid-on" : ""}`} aria-label="待机测试区">
      <div className="sprite-test-zone-title">
        <h2>待机测试区</h2>
        <span>当前方向：{SPRITE_TEST_DIRECTION_TEXT[direction]}，当前动作：待机，左右方向</span>
      </div>
      <div className="sprite-test-direction-stage">
        <SpriteTestSprite frame={frame} showCollision={showCollision} showAttachment={showAttachment} style={{ left: "50%", top: "72%" }} />
        {SPRITE_TEST_DIRECTIONS.map((item) => (
          <button
            key={item}
            className={`sprite-test-direction-marker sprite-test-direction-${item} ${item === direction ? "active" : ""}`}
            type="button"
            onClick={() => onDirection(item)}
          >
            {SPRITE_TEST_DIRECTION_TEXT[item]}
          </button>
        ))}
      </div>
      <SpriteDirectionSamples unitId={unitId} state="idle" elapsedMs={elapsedMs} playbackSpeed={playbackSpeed} showCollision={showCollision} showAttachment={showAttachment} />
    </section>
  );
}

function SpriteMoveTestZone({
  unitId,
  state,
  title,
  actionText,
  direction,
  activePathId,
  walkPoint,
  walkDirection,
  elapsedMs,
  playbackSpeed,
  manualFrame,
  showCollision,
  showAttachment,
  showGrid,
  onPath
}: {
  unitId: UnitVisualType;
  state: UnitAnimationState;
  title: string;
  actionText: string;
  direction: UnitDirection;
  activePathId: string;
  walkPoint: { x: number; y: number };
  walkDirection: UnitDirection;
  elapsedMs: number;
  playbackSpeed: number;
  manualFrame: number | null;
  showCollision: boolean;
  showAttachment: boolean;
  showGrid: boolean;
  onPath: (pathId: string) => void;
}) {
  const frame = resolveSpriteTestFrame(unitId, state, walkDirection || direction, elapsedMs, playbackSpeed, manualFrame).frame;
  return (
    <section className={`sprite-test-zone sprite-test-walk-zone ${showGrid ? "sprite-test-grid-on" : ""}`} aria-label="行走测试区">
      <div className="sprite-test-zone-title">
        <h2>{title}</h2>
        <span>当前方向：{SPRITE_TEST_DIRECTION_TEXT[walkDirection]}，当前动作：{actionText}，重点检查脚底锚点</span>
      </div>
      <div className="sprite-test-path-buttons">
        {SPRITE_TEST_PATHS.map((path) => (
          <button key={path.id} className={path.id === activePathId ? "active" : ""} type="button" onClick={() => onPath(path.id)}>
            {path.label}
          </button>
        ))}
      </div>
      <div className="sprite-test-walk-field" aria-label="行走路径网格">
        <svg viewBox="0 0 520 310" aria-hidden="true">
          {SPRITE_TEST_PATHS.map((path) => (
            <polyline key={path.id} className={path.id === activePathId ? "sprite-test-path-active" : ""} points={path.points.map((point) => `${point.x},${point.y}`).join(" ")} />
          ))}
        </svg>
        <SpriteTestSprite frame={frame} showCollision={showCollision} showAttachment={showAttachment} style={{ left: walkPoint.x, top: walkPoint.y }} />
      </div>
      <SpriteDirectionSamples unitId={unitId} state={state} elapsedMs={elapsedMs} playbackSpeed={playbackSpeed} showCollision={showCollision} showAttachment={showAttachment} />
    </section>
  );
}

function SpriteDirectionSamples({
  unitId,
  state,
  elapsedMs,
  playbackSpeed,
  showCollision,
  showAttachment
}: {
  unitId: UnitVisualType;
  state: UnitAnimationState;
  elapsedMs: number;
  playbackSpeed: number;
  showCollision: boolean;
  showAttachment: boolean;
}) {
  return (
    <div className="sprite-test-samples" aria-label={`左右方向 ${SPRITE_TEST_ACTION_TEXT[state]} 样例`}>
      {SPRITE_TEST_DIRECTIONS.map((direction) => {
        const resolved = resolveSpriteTestFrame(unitId, state, direction, elapsedMs, playbackSpeed, null);
        return (
          <div key={`${state}-${direction}`} className={`sprite-test-sample ${resolved.exact ? "" : "sprite-test-sample-missing"}`}>
            <SpriteTestSprite frame={resolved.frame} scale={0.38} showCollision={showCollision} showAttachment={showAttachment} style={{ left: "50%", top: "78%" }} />
            <span>{SPRITE_TEST_DIRECTION_TEXT[direction]}</span>
            {!resolved.exact && <small>缺少方向</small>}
          </div>
        );
      })}
    </div>
  );
}

function SpriteTestSprite({
  frame,
  scale = 0.58,
  showCollision,
  showAttachment,
  style
}: {
  frame: UnitAnimationFrame;
  scale?: number;
  showCollision: boolean;
  showAttachment: boolean;
  style: CSSProperties;
}) {
  const asset = frame.animation;
  return (
    <div
      className={`sprite-test-sprite unit-visual-${asset.unitId}`}
      style={{
        width: asset.frameWidth,
        height: asset.frameHeight,
        "--unit-anchor-x": asset.anchorX,
        "--unit-anchor-y": asset.anchorY,
        "--sprite-test-scale": scale * asset.scale,
        ...style
      } as CSSProperties}
      data-animation-state={asset.state}
      data-animation-direction={asset.direction}
      data-animation-frame={frame.frameIndex}
    >
      {showCollision && <span className="sprite-test-collision-box" aria-hidden="true" />}
      {showAttachment && (
        <>
          <span className="sprite-test-anchor-point" aria-hidden="true" />
          <span className="sprite-test-attachment-point" aria-hidden="true" />
        </>
      )}
      <UnitAnimationSprite frame={frame} />
    </div>
  );
}

function resolveSpriteTestFrame(
  unitId: UnitVisualType,
  state: UnitAnimationState,
  direction: UnitDirection,
  elapsedMs: number,
  playbackSpeed: number,
  manualFrame: number | null
): SpriteTestResolvedFrame {
  const exact = UNIT_ANIMATION_BY_KEY.get(unitAnimationKey(unitId, state, direction));
  const stateFallback = UNIT_ANIMATION_BY_KEY.get(unitAnimationKey(unitId, state, SPRITE_TEST_DIRECTION_FALLBACK[direction]))
    ?? UNIT_ANIMATION_BY_KEY.get(unitAnimationKey(unitId, state, "right"))
    ?? UNIT_ANIMATION_BY_KEY.get(unitAnimationKey(unitId, state, "left"));
  const idleFallback = UNIT_ANIMATION_BY_KEY.get(unitAnimationKey(unitId, "idle", SPRITE_TEST_DIRECTION_FALLBACK[direction]))
    ?? UNIT_ANIMATION_BY_KEY.get(unitAnimationKey(unitId, "idle", "right"))
    ?? UNIT_ANIMATION_BY_KEY.get(unitAnimationKey(unitId, "idle", "left"))
    ?? UNIT_ANIMATION_ASSETS[0];
  const asset = exact ?? stateFallback ?? idleFallback;
  const hasAction = UNIT_ANIMATION_ASSETS.some((item) => item.unitId === unitId && item.state === state);
  const resolved = getAnimationFrame(asset, elapsedMs, playbackSpeed);
  return {
    frame: {
      ...resolved,
      frameIndex: manualFrame === null ? resolved.frameIndex : manualFrame % Math.max(1, asset.frameCount)
    },
    exact: Boolean(exact),
    missingAction: !hasAction,
    requestedAction: state,
    requestedDirection: direction
  };
}

function spriteTestMissingMessages(unitId: UnitVisualType, action: UnitAnimationState, direction: UnitDirection, resolved: SpriteTestResolvedFrame) {
  const messages: string[] = [];
  if (resolved.missingAction) messages.push(`缺少动作：${action}`);
  if (!resolved.exact) messages.push(`缺少方向：${SPRITE_TEST_DIRECTION_TEXT[direction]}（${direction}）`);
  if (resolved.frame.animation.frameCount <= 0) messages.push(`缺少帧配置：${action}/${direction}`);
  if (!UNIT_ANIMATION_ASSETS.some((asset) => asset.unitId === unitId)) messages.push(`缺少资源：${unitId}`);
  if (action === "attack" && resolved.missingAction) messages.push("当前 sprite 未配置攻击动作");
  return messages;
}

function nextSpriteTestAction(action: UnitAnimationState) {
  return SPRITE_TEST_ACTIONS[(SPRITE_TEST_ACTIONS.indexOf(action) + 1) % SPRITE_TEST_ACTIONS.length];
}

function nextSpriteTestDirection(direction: UnitDirection) {
  return SPRITE_TEST_DIRECTIONS[(SPRITE_TEST_DIRECTIONS.indexOf(direction) + 1) % SPRITE_TEST_DIRECTIONS.length];
}

function spriteTestAssetPath(asset: UnitAnimationAsset) {
  return (asset as UnitAnimationAsset & { path?: string }).path ?? asset.src;
}

function pointOnSpriteTestPath(points: { x: number; y: number }[], progress: number) {
  const segments = points.slice(1).map((point, index) => {
    const previous = points[index];
    return { from: previous, to: point, length: Math.hypot(point.x - previous.x, point.y - previous.y) };
  });
  const total = segments.reduce((sum, segment) => sum + segment.length, 0) || 1;
  let distanceLeft = progress * total;
  for (const segment of segments) {
    if (distanceLeft <= segment.length) {
      const local = segment.length <= 0 ? 0 : distanceLeft / segment.length;
      return {
        x: segment.from.x + (segment.to.x - segment.from.x) * local,
        y: segment.from.y + (segment.to.y - segment.from.y) * local
      };
    }
    distanceLeft -= segment.length;
  }
  return points[points.length - 1] ?? { x: 0, y: 0 };
}

function directionFromSpriteTestPath(points: { x: number; y: number }[], progress: number): UnitDirection {
  const now = pointOnSpriteTestPath(points, progress);
  const next = pointOnSpriteTestPath(points, (progress + 0.02) % 1);
  return next.x - now.x < 0 ? "left" : "right";
}

function GameApp() {
  const [state, setState] = useState<AppState | null>(null);
  const [bagOpen, setBagOpen] = useState(false);
  const [skillEditorMode] = useState(() => initialSkillEditorMode());
  const [entryStep, setEntryStep] = useState<"title" | "save" | "map">(() => skillEditorMode ? "map" : "title");
  const [saveSlots, setSaveSlots] = useState<FrontendSaveSlotSummary[]>(() => loadFrontendSaveSlotSummaries());
  const [selectedSaveSlotId, setSelectedSaveSlotId] = useState(() => loadActiveFrontendSaveSlotId() ?? latestFrontendSaveSlotId(saveSlots) ?? 1);
  const [saveStartMode, setSaveStartMode] = useState<"continue" | "new">(() => latestFrontendSaveSlotId(saveSlots) ? "continue" : "new");
  const [skillEditorOpen, setSkillEditorOpen] = useState(() => initialSkillEditorOpen());
  const [selectedSkillEditorId, setSelectedSkillEditorId] = useState<string | null>(null);
  const [skillEditorGuidePackage, setSkillEditorGuidePackage] = useState<SkillPackageData | null>(null);
  const [skillEditorDebugOptions, setSkillEditorDebugOptions] = useState<SkillEditorDebugOptions>(DEFAULT_SKILL_EDITOR_DEBUG_OPTIONS);
  const [skillEditorCameraSettings, setSkillEditorCameraSettings] = useState<SkillEditorCameraSettings>(() => loadSkillEditorCameraSettings());
  const [selectedMapId, setSelectedMapId] = useState<string | null>(() => skillEditorMode ? DEFAULT_BAKED_BATTLE_MAP_ID : DEFAULT_RUNTIME_MAP_ID);
  const [battleMap, setBattleMap] = useState<BakedBattleMapData | null>(null);
  const [mapDebugEnabled, setMapDebugEnabled] = useState(false);
  const [authoredSpawnPlanActive, setAuthoredSpawnPlanActive] = useState(false);
  const [authoredAggroSources, setAuthoredAggroSources] = useState<RuntimeEncounterAggroSource[]>([]);
  const [spawnPlanWarnings, setSpawnPlanWarnings] = useState<string[]>([]);
  const [proceduralSpawnDebug, setProceduralSpawnDebug] = useState<ProceduralSpawnDebugSummary | null>(null);
  const [notice, setNotice] = useState("正在载入。");
  const [playing, setPlaying] = useState(() => skillEditorMode);
  const [gameFailureOpen, setGameFailureOpen] = useState(false);
  const [player, setPlayer] = useState<PlayerRuntimeState>({
    x: MAP_WIDTH / 2,
    y: MAP_HEIGHT / 2,
    hp: 100,
    maxHp: 100,
    currentMana: 0,
    maxMana: 0,
    currentEnergyShield: 0,
    maxEnergyShield: 0
  });
  const [enemies, setEnemies] = useState<Enemy[]>(() => skillEditorMode ? createSkillTestDummies(1, MAP_WIDTH / 2, MAP_HEIGHT / 2) : []);
  const [texts, setTexts] = useState<FloatingText[]>([]);
  const [activePlayerBuffs, setActivePlayerBuffs] = useState<PlayerBuff[]>([]);
  const [bolts, setBolts] = useState<FireBolt[]>([]);
  const [areaNovas, setAreaNovas] = useState<AreaNova[]>([]);
  const [meleeArcs, setMeleeArcs] = useState<MeleeArcVfx[]>([]);
  const [chainSegments, setChainSegments] = useState<ChainSegmentVfx[]>([]);
  const [damageZones, setDamageZones] = useState<DamageZoneVfx[]>([]);
  const [hitVfxs, setHitVfxs] = useState<HitVfx[]>([]);
  const [kills, setKills] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [combatLogs, setCombatLogs] = useState<string[]>([]);
  const [runtimePerfSummary, setRuntimePerfSummary] = useState<RuntimePerfSummary>({
    frame_ms: 0,
    logic_ms: 0,
    active_projectiles: 0,
    active_hit_vfx: 0,
    active_area_vfx: 0,
    active_floating_text: 0,
    active_enemies: 0,
    scheduled_events: 0,
    consumed_events_this_frame: 0,
    dropped_frame_count: 0
  });
  const [runtimeBoundaryScan, setRuntimeBoundaryScan] = useState<RuntimeBoundaryScanSummary>({
    status: "idle",
    tested: 0,
    passed: 0,
    failed: 0,
    failures: []
  });
  const [hoveredGemId, setHoveredGemId] = useState<string | null>(null);
  const [hoveredBoardCell, setHoveredBoardCell] = useState<string | null>(null);
  const [hoveredBagSlot, setHoveredBagSlot] = useState<number | null>(null);
  const [hoveredEquipmentSlot, setHoveredEquipmentSlot] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [floatingGem, setFloatingGem] = useState<FloatingGem | null>(null);
  const [placementPrompt, setPlacementPrompt] = useState<PlacementPrompt | null>(null);
  const [showPersistentSupportLines, setShowPersistentSupportLines] = useState(true);
  const [gmOpen, setGmOpen] = useState(false);
  const [gmOptions, setGmOptions] = useState<GmOptions | null>(null);
  const [gmAffixes, setGmAffixes] = useState<GmEquipmentAffixResponse | null>(null);
  const [inventorySlots, setInventorySlots] = useState<(string | null)[]>(() => Array(INVENTORY_SLOT_COUNT).fill(null));
  const [equipmentSlots, setEquipmentSlots] = useState<(string | null)[]>(() => Array(EQUIPMENT_SLOT_COUNT).fill(null));
  const keys = useRef(new Set<string>());
  const floatingGemRef = useRef<FloatingGem | null>(null);
  const dropInProgressRef = useRef(false);
  const lastFrame = useRef<number | null>(null);
  const nextEnemyId = useRef(skillEditorMode ? SKILL_TEST_DUMMY_OFFSETS.length + 1 : 1);
  const nextTextId = useRef(1);
  const nextPlayerBuffId = useRef(1);
  const nextBoltId = useRef(1);
  const nextAreaNovaId = useRef(1);
  const nextMeleeArcId = useRef(1);
  const nextChainSegmentId = useRef(1);
  const nextDamageZoneId = useRef(1);
  const nextHitVfxId = useRef(1);
  const nextPromptId = useRef(1);
  const attackTimers = useRef<Record<string, number>>({});
  const thundercloudChannels = useRef<Record<string, ThundercloudChannelRuntime>>({});
  const scheduledSkillEvents = useRef<ScheduledSkillEvent[]>([]);
  const continuousAttackRuntime = useRef<ContinuousAttackRuntime | null>(null);
  const activeDamageZones = useRef<ActiveDamageZoneRuntime[]>([]);
  const onKillRecastCounts = useRef<Map<string, number>>(new Map());
  const runtimePerf = useRef<RuntimePerfSummary>({
    frame_ms: 0,
    logic_ms: 0,
    active_projectiles: 0,
    active_hit_vfx: 0,
    active_area_vfx: 0,
    active_floating_text: 0,
    active_enemies: 0,
    scheduled_events: 0,
    consumed_events_this_frame: 0,
    dropped_frame_count: 0
  });
  const runtimePerfLastSync = useRef(0);
  const runtimeLastStepError = useRef<string | null>(null);
  const spawnTimer = useRef(0);
  const playerVisual = useRef<UnitVisualRuntime>({ direction: "down", movementVector: { x: 0, y: 0 } });
  const enemyVisuals = useRef(new Map<number, EnemyVisualRuntime>());
  const triggeredEncounterSourceIds = useRef<Set<string>>(new Set());
  const encounterMonsterPalette = useRef<EncounterMonsterPalette>(createEncounterMonsterPalette());
  const playerStateRef = useRef(player);
  const activePlayerBuffsRef = useRef<PlayerBuff[]>([]);
  const enemiesStateRef = useRef(enemies);
  const boltsStateRef = useRef(bolts);
  const elapsedRef = useRef(0);
  const elapsedLastUiSync = useRef(0);
  const pendingDropPickup = useRef<{ dropId: string; x: number; y: number } | null>(null);
  const pickupRequestInFlight = useRef(false);
  const dropDisplayPositions = useRef<Map<string, { x: number; y: number }>>(new Map());
  const knownDropIds = useRef<Set<string>>(new Set());
  const frontendDropId = useRef(1);
  const frontendItemId = useRef(1);
  const movementBarrierDistanceAccumulator = useRef(0);
  const playerBlockHitCounter = useRef(0);
  const blockLifeRecoveryReadyMs = useRef(0);
  const blockShieldRecoveryReadyMs = useRef(0);
  const lifeReturnReadyMs = useRef(0);
  const shieldReturnReadyMs = useRef(0);
  const energyShieldRechargeReadyMs = useRef(0);
  const warIntentState = useRef({ points: 0, remainingMs: 0 });

  function applyServerState(nextState: AppState, options: { persist?: boolean } = {}) {
    const persist = options.persist ?? true;
    const recalculated = recalculateFrontendSkillPreview(recalculateFrontendEquipmentState(nextState));
    setState(recalculated);
    if (persist) saveFrontendAutosave(recalculated);
  }

  function applyFrontendState(updater: (current: AppState) => AppState | null) {
    setState((current) => {
      if (!current) return current;
      const next = updater(current);
      if (!next) return current;
      const recalculated = recalculateFrontendSkillPreview(recalculateFrontendEquipmentState(next));
      saveFrontendAutosave(recalculated);
      return recalculated;
    });
  }

  function setRuntimePlayer(updater: (current: typeof player) => typeof player) {
    const next = updater(playerStateRef.current);
    playerStateRef.current = next;
    setPlayer(next);
  }

  function setRuntimePlayerBuffs(next: PlayerBuff[]) {
    activePlayerBuffsRef.current = next;
    setActivePlayerBuffs(next);
  }

  function warIntentEnabled() {
    return statNumber(state?.player_stats?.war_intent_enabled, 0) > 0;
  }

  function gainWarIntentPoint() {
    if (!warIntentEnabled()) return;
    warIntentState.current = {
      points: Math.min(100, warIntentState.current.points + 1),
      remainingMs: 10_000,
    };
  }

  function advanceWarIntent(deltaMs: number) {
    if (warIntentState.current.remainingMs <= 0) return;
    const remainingMs = Math.max(0, warIntentState.current.remainingMs - Math.max(0, Math.round(deltaMs)));
    warIntentState.current = remainingMs > 0 ? { ...warIntentState.current, remainingMs } : { points: 0, remainingMs: 0 };
  }

  function applyFrontendWarIntentToSkill(skill: SkillPreview): SkillPreview {
    if (!warIntentEnabled() || warIntentState.current.points <= 0) return skill;
    const effectMultiplier = 1 + Math.max(0, statNumber(state?.player_stats?.war_intent_effect_add_percent, 0)) / 100;
    const warCritRating = warIntentState.current.points * 2 * effectMultiplier;
    if (warCritRating <= 0) return skill;
    const skillStats = { ...(skill.skill_stats ?? {}) };
    skillStats.crit_rating = Number(skillStats.crit_rating ?? 0) + warCritRating;
    const critChance = frontendExpectedCritChance(skill, skillStats);
    const critMultiplier = frontendExpectedCritMultiplier(skill, skillStats);
    const nonCritDamage = Number(skill.non_crit_damage ?? skill.final_damage ?? 0);
    const expectedHitDamage = nonCritDamage * ((1 - critChance) + critChance * critMultiplier);
    return {
      ...skill,
      skill_stats: skillStats,
      crit_chance: critChance,
      crit_multiplier: critMultiplier,
      expected_hit_damage: expectedHitDamage,
    };
  }

  function advancePlayerBuffs(dt: number) {
    const next = activePlayerBuffsRef.current
      .map((buff) => ({ ...buff, remaining: buff.remaining - dt }))
      .filter((buff) => buff.remaining > 0 && (!playerAbsorbBuffType(buff.buffType) || buff.remainingAmount > 0));
    setRuntimePlayerBuffs(next);
  }

  function playerMovementSpeedMultiplier(buffs = activePlayerBuffsRef.current) {
    return buffs.reduce((multiplier, buff) => {
      if (buff.remaining <= 0 || buff.buffType !== "channel_move_speed") return multiplier;
      const buffMultiplier = Number(buff.moveSpeedMultiplier ?? 1);
      if (!Number.isFinite(buffMultiplier)) return multiplier;
      return multiplier * clamp(buffMultiplier, 0, 5);
    }, 1);
  }

  function applyFrontendMovementEquipmentEffects(previousPlayer: PlayerRuntimeState, nextPlayer: PlayerRuntimeState, dt: number): PlayerRuntimeState {
    const movedDistance = distance(previousPlayer, nextPlayer);
    if (movedDistance <= 0) return nextPlayer;
    let updatedPlayer = nextPlayer;
    const shieldRecoveryPercent = Math.max(0, statNumber(state?.player_stats?.moving_shield_recovery_percent_per_second, 0));
    if (shieldRecoveryPercent > 0 && updatedPlayer.maxEnergyShield > 0 && dt > 0) {
      updatedPlayer = {
        ...updatedPlayer,
        currentEnergyShield: clamp(
          updatedPlayer.currentEnergyShield + updatedPlayer.maxEnergyShield * shieldRecoveryPercent / 100 * dt,
          0,
          updatedPlayer.maxEnergyShield
        )
      };
    }
    triggerFrontendMovementBarrier(movedDistance, updatedPlayer);
    return updatedPlayer;
  }

  function triggerFrontendMovementBarrier(movedDistance: number, playerAfterMove: PlayerRuntimeState) {
    const requiredDistance = Math.max(0, statNumber(state?.player_stats?.movement_barrier_distance, 0));
    const chancePercent = clamp(statNumber(state?.player_stats?.movement_barrier_chance_percent, 0), 0, 100);
    if (requiredDistance <= 0 || chancePercent <= 0) return;
    movementBarrierDistanceAccumulator.current += movedDistance;
    let nextBuffs = activePlayerBuffsRef.current;
    let changed = false;
    while (movementBarrierDistanceAccumulator.current + 1e-9 >= requiredDistance) {
      movementBarrierDistanceAccumulator.current -= requiredDistance;
      if (nextBuffs.some((buff) => buff.buffType === "barrier" && buff.remaining > 0)) continue;
      const roll = stablePercent(`player:movement_barrier:${Math.round(elapsedRef.current * 1000)}:${movementBarrierDistanceAccumulator.current.toFixed(3)}`);
      if (roll >= chancePercent) continue;
      const amountAddPercent = Math.max(0, statNumber(state?.player_stats?.barrier_absorb_amount_add_percent, 0));
      const absorbAmount = (playerAfterMove.maxHp + playerAfterMove.maxEnergyShield) * 0.2 * (1 + amountAddPercent / 100);
      if (absorbAmount <= 0) continue;
      nextBuffs = [
        ...nextBuffs,
        {
          id: nextPlayerBuffId.current++,
          buffType: "barrier",
          skillId: "equipment_movement_barrier",
          remaining: 10,
          duration: 10,
          remainingAmount: absorbAmount,
          absorbPercent: 50,
          excludeDamageOverTime: true,
          vfxKey: "equipment_movement_barrier"
        }
      ];
      changed = true;
    }
    if (changed) setRuntimePlayerBuffs(nextBuffs);
  }

  function applyFrontendPlayerSelfDamage(playerBeforeDamage: PlayerRuntimeState, dt: number): PlayerRuntimeState {
    const damagePer100ms = Math.max(0, statNumber(state?.player_stats?.self_true_damage_per_100ms, 0));
    if (damagePer100ms <= 0 || dt <= 0) return playerBeforeDamage;
    return applyFrontendDamageToPlayer(playerBeforeDamage, damagePer100ms * dt * 10);
  }

  function resetEnergyShieldRechargeDelay(nowMs = elapsedRef.current * 1000) {
    energyShieldRechargeReadyMs.current = nowMs + frontendEnergyShieldRechargeDelayMs(state?.player_stats);
  }

  function applyFrontendEnergyShieldRecharge(playerBeforeRecharge: PlayerRuntimeState, dt: number): PlayerRuntimeState {
    if (dt <= 0 || playerBeforeRecharge.maxEnergyShield <= 0) return playerBeforeRecharge;
    if (playerBeforeRecharge.currentEnergyShield >= playerBeforeRecharge.maxEnergyShield) return playerBeforeRecharge;
    if (elapsedRef.current * 1000 + 1e-6 < energyShieldRechargeReadyMs.current) return playerBeforeRecharge;
    const rechargePercentPerSecond = frontendEnergyShieldRechargePercentPerSecond(state?.player_stats);
    if (rechargePercentPerSecond <= 0) return playerBeforeRecharge;
    return {
      ...playerBeforeRecharge,
      currentEnergyShield: clamp(
        playerBeforeRecharge.currentEnergyShield + playerBeforeRecharge.maxEnergyShield * rechargePercentPerSecond / 100 * dt,
        0,
        playerBeforeRecharge.maxEnergyShield
      )
    };
  }

  function resolveFrontendPlayerBlock(enemy: Enemy, hitKind: MonsterHitKind) {
    const chanceStat = hitKind === "spell" ? "spell_block_chance_percent" : "attack_block_chance_percent";
    const blockChance = clamp(statNumber(state?.player_stats?.[chanceStat], 0), 0, 75);
    if (blockChance <= 0) return false;
    playerBlockHitCounter.current += 1;
    return stablePercent(`player:block:${playerBlockHitCounter.current}:${enemy.id}:${hitKind}`) < blockChance;
  }

  function recoverFrontendPlayerOnBlock(playerBeforeHit: PlayerRuntimeState, nowMs: number): PlayerRuntimeState {
    let nextPlayer = playerBeforeHit;
    const lifePercent = Math.max(0, statNumber(state?.player_stats?.block_life_recovery_percent, 0));
    const lifeInterval = Math.max(0, statNumber(state?.player_stats?.block_life_recovery_interval_ms, 0));
    if (lifePercent > 0 && nowMs >= blockLifeRecoveryReadyMs.current && nextPlayer.hp < nextPlayer.maxHp) {
      nextPlayer = { ...nextPlayer, hp: clamp(nextPlayer.hp + nextPlayer.maxHp * lifePercent / 100, 0, nextPlayer.maxHp) };
      blockLifeRecoveryReadyMs.current = nowMs + lifeInterval;
    }
    const shieldPercent = Math.max(0, statNumber(state?.player_stats?.block_shield_recovery_percent, 0));
    const shieldInterval = Math.max(0, statNumber(state?.player_stats?.block_shield_recovery_interval_ms, 0));
    if (shieldPercent > 0 && nowMs >= blockShieldRecoveryReadyMs.current && nextPlayer.currentEnergyShield < nextPlayer.maxEnergyShield) {
      nextPlayer = {
        ...nextPlayer,
        currentEnergyShield: clamp(nextPlayer.currentEnergyShield + nextPlayer.maxEnergyShield * shieldPercent / 100, 0, nextPlayer.maxEnergyShield)
      };
      blockShieldRecoveryReadyMs.current = nowMs + shieldInterval;
    }
    return nextPlayer;
  }

  function playerAbsorbBuffType(buffType: string) {
    return buffType === "guard" || buffType === "barrier";
  }

  function recoverFrontendPlayerOnHit(playerBeforeRecovery: PlayerRuntimeState): PlayerRuntimeState {
    const nowMs = Math.round(elapsedRef.current * 1000);
    let nextPlayer = playerBeforeRecovery;
    const lifePercent = Math.min(30, Math.max(0, statNumber(state?.player_stats?.life_return_percent, 0)));
    if (lifePercent > 0 && nowMs >= lifeReturnReadyMs.current && nextPlayer.hp < nextPlayer.maxHp) {
      const missingLife = Math.max(0, nextPlayer.maxHp - nextPlayer.hp);
      nextPlayer = { ...nextPlayer, hp: clamp(nextPlayer.hp + missingLife * lifePercent / 100, 0, nextPlayer.maxHp) };
      lifeReturnReadyMs.current = nowMs + 500;
    }
    const shieldPercent = Math.min(30, Math.max(0, statNumber(state?.player_stats?.shield_return_percent, 0)));
    if (shieldPercent > 0 && nowMs >= shieldReturnReadyMs.current && nextPlayer.currentEnergyShield < nextPlayer.maxEnergyShield) {
      const missingShield = Math.max(0, nextPlayer.maxEnergyShield - nextPlayer.currentEnergyShield);
      nextPlayer = { ...nextPlayer, currentEnergyShield: clamp(nextPlayer.currentEnergyShield + missingShield * shieldPercent / 100, 0, nextPlayer.maxEnergyShield) };
      shieldReturnReadyMs.current = nowMs + 500;
    }
    return nextPlayer;
  }

  function applyFrontendDamageToPlayer(playerBeforeDamage: PlayerRuntimeState, damage: number): PlayerRuntimeState {
    let incoming = Math.max(0, damage);
    const manaSoakPercent = clamp(statNumber(state?.player_stats?.damage_taken_from_mana_before_life_percent, 0), 0, 100);
    let currentMana = playerBeforeDamage.currentMana;
    if (manaSoakPercent > 0 && currentMana > 0) {
      const manaPortion = incoming * manaSoakPercent / 100;
      const spentMana = Math.min(currentMana, manaPortion);
      currentMana -= spentMana;
      incoming -= spentMana;
    }
    const shieldDamage = Math.min(Math.max(0, playerBeforeDamage.currentEnergyShield), incoming);
    const lifeDamage = Math.max(0, incoming - shieldDamage);
    return {
      ...playerBeforeDamage,
      currentMana: clamp(currentMana, 0, playerBeforeDamage.maxMana),
      currentEnergyShield: clamp(playerBeforeDamage.currentEnergyShield - shieldDamage, 0, playerBeforeDamage.maxEnergyShield),
      hp: clamp(playerBeforeDamage.hp - lifeDamage, 0, playerBeforeDamage.maxHp)
    };
  }

  function advanceEnemyBuffs(dt: number) {
    const current = enemiesStateRef.current;
    let changed = false;
    let killed = 0;
    const killedEnemies: Enemy[] = [];
    const dotTexts: FloatingText[] = [];
    const next = current.map((enemy) => {
      if (!enemy.activeBuffs?.length) return enemy;
      if (enemy.hp <= 0) {
        changed = true;
        return { ...enemy, activeBuffs: [] };
      }
      let damageOverTime = 0;
      let floatingTextDamage = 0;
      let floatingTextDamageType = "fire";
      const activeBuffs = enemy.activeBuffs
        .map((buff) => {
          const elapsed = Math.min(Math.max(0, buff.remaining), dt);
          const dps = Math.max(0, buff.baseDamagePerSecond ?? 0);
          let nextFloatingTextIn = buff.nextFloatingTextIn ?? DOT_FLOATING_TEXT_INTERVAL_SECONDS;
          if (dps > 0 && elapsed > 0) {
            damageOverTime += dps * elapsed;
            nextFloatingTextIn -= elapsed;
            if (nextFloatingTextIn <= 0) {
              floatingTextDamage += dps * DOT_FLOATING_TEXT_INTERVAL_SECONDS;
              floatingTextDamageType = buff.damageType ?? floatingTextDamageType;
              while (nextFloatingTextIn <= 0) nextFloatingTextIn += DOT_FLOATING_TEXT_INTERVAL_SECONDS;
            }
          }
          return { ...buff, remaining: buff.remaining - dt, nextFloatingTextIn };
        })
        .filter((buff) => buff.remaining > 0);
      const hp = damageOverTime > 0 ? enemy.hp - damageOverTime : enemy.hp;
      if (hp <= 0 && damageOverTime > 0 && floatingTextDamage <= 0) {
        floatingTextDamage = Math.max(1, Math.min(enemy.hp, damageOverTime));
      }
      if (floatingTextDamage > 0) {
        dotTexts.push({
          id: nextTextId.current++,
          x: enemy.x,
          y: enemy.y - 34,
          text: damageNumberText(floatingTextDamage),
          damageType: floatingTextDamageType,
          ttl: 0.7,
          duration: 0.7
        });
      }
      if (hp <= 0) {
        killed += 1;
        killedEnemies.push(enemy);
      }
      if (
        damageOverTime <= 0
        && activeBuffs.length === enemy.activeBuffs.length
        && activeBuffs.every((buff, index) => buff === enemy.activeBuffs?.[index])
      ) return enemy;
      changed = true;
      return {
        ...enemy,
        hp,
        activeBuffs: hp <= 0 ? [] : activeBuffs,
        lastDamagedAt: damageOverTime > 0 ? elapsedRef.current : enemy.lastDamagedAt
      };
    }).filter((enemy) => shouldRetainEnemyForGameplayOrDamageFlash(enemy, elapsedRef.current));
    if (!changed) return;
    enemiesStateRef.current = next;
    setEnemies(next);
    if (dotTexts.length > 0) {
      setTexts((items) => capRuntimeVisualBudget([...items, ...dotTexts], MAX_RUNTIME_FLOATING_TEXT));
    }
    if (killed > 0) {
      setKills((value) => value + killed);
      spawnFrontendDrops(killedEnemies);
      setCombatLogs((logs) => [`点燃击杀 ${killed} 个怪物。`, ...logs].slice(0, 8));
    }
  }

  useEffect(() => {
    if (skillEditorMode) {
      const { save, errorText } = loadFrontendAutosaveResult();
      const savedState = appStateFromFrontendSave(save);
      applyServerState(savedState ?? createFrontendInitialAppState(), { persist: false });
      setNotice(errorText || (savedState ? "已读取前端本地存档。按 C 打开背包。" : "准备就绪。按 C 打开背包。"));
    } else {
      applyServerState(createFrontendInitialAppState(), { persist: false });
      setNotice("点击开始游戏选择存档。");
    }
    requestGmOptions()
      .then(setGmOptions)
      .catch((error: Error) => console.warn("[gm] options preload failed", error));
  }, []);

  useEffect(() => {
    if (!bagOpen || !gmOpen) return;
    const optionsPromise = gmOptions ? Promise.resolve(gmOptions) : requestGmOptions().then((options) => {
      setGmOptions(options);
      return options;
    });
    optionsPromise
      .then((options) => {
        if (gmAffixes) return null;
        const firstSource = options.equipment_sources[0]?.id;
        return firstSource ? requestGmEquipmentAffixes(firstSource, 86) : null;
      })
      .then((affixes) => {
        if (affixes) setGmAffixes(affixes);
      })
      .catch((error: Error) => setNotice(error.message));
  }, [bagOpen, gmOpen, gmOptions, gmAffixes]);

  useEffect(() => {
    if (!state) return;
    const equippedIds = new Set(equipmentSlots.filter(Boolean) as string[]);
    setInventorySlots((current) => reconcileInventorySlots(current, state, floatingGemRef.current?.gem.instance_id ?? null, equippedIds));
  }, [state, floatingGem?.gem.instance_id, equipmentSlots]);

  useEffect(() => {
    if (!state?.equipment_slots) return;
    setEquipmentSlots(normalizeEquipmentSlots(state.equipment_slots));
  }, [state?.equipment_slots]);

  useEffect(() => {
    if (!selectedMapId) {
      setBattleMap(null);
      return;
    }

    if (selectedMapId === EDITOR_RUNTIME_MAP_ID) {
      const map = createEditorRuntimeBattleMap(map001Document as unknown as MapEditorFileDocument);
      setBattleMap(map);
      setAuthoredSpawnPlanActive(false);
      setSpawnPlanWarnings([]);
      setRuntimePlayer((current) => ({ ...current, x: map.playerSpawn.x, y: map.playerSpawn.y }));
      setEnemies([]);
      setNotice(`${map.displayName} 已载入，请进入战斗。`);
      return;
    }

    const asset = bakedMapAssetById(selectedMapId);
    if (!asset) {
      setBattleMap(null);
      setNotice("地图资源配置不存在。");
      return;
    }

    let cancelled = false;
    setNotice("正在加载地图资源。");
    loadBakedBattleMap(asset)
      .then((map) => {
        if (cancelled) return;
        setBattleMap(map);
        setAuthoredSpawnPlanActive(false);
        setAuthoredAggroSources([]);
        triggeredEncounterSourceIds.current = new Set();
        setSpawnPlanWarnings([]);
        setRuntimePlayer((current) => ({ ...current, x: map.playerSpawn.x, y: map.playerSpawn.y }));
        if (skillEditorMode) {
          nextEnemyId.current = SKILL_TEST_DUMMY_OFFSETS.length + 1;
          const nextPalette = createEncounterMonsterPalette();
          encounterMonsterPalette.current = nextPalette;
          setEnemies(createSkillTestDummies(1, map.playerSpawn.x, map.playerSpawn.y, nextPalette));
        } else {
          setEnemies([]);
        }
        setNotice(skillEditorMode ? `${map.displayName} 已载入，技能测试地图已就绪。` : `${map.displayName} 已载入，请进入战斗。`);
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setBattleMap(null);
        setPlaying(false);
        setNotice(error.message || "地图资源加载失败。");
      });
    return () => {
      cancelled = true;
    };
  }, [selectedMapId, skillEditorMode]);

  useEffect(() => {
    const maxLife = statNumber(state?.player_stats?.max_life, 0);
    if (!maxLife) return;
    setRuntimePlayer((current) => ({ ...current, hp: Math.max(current.hp, maxLife), maxHp: maxLife }));
  }, [state?.player_stats?.max_life?.value]);

  useEffect(() => {
    const maxMana = statNumber(state?.player_stats?.max_mana, 0);
    const currentMana = statNumber(state?.player_stats?.current_mana, maxMana);
    setRuntimePlayer((current) => ({
      ...current,
      currentMana: Math.max(current.currentMana, currentMana),
      maxMana
    }));
  }, [state?.player_stats?.current_mana?.value, state?.player_stats?.max_mana?.value]);

  useEffect(() => {
    const maxEnergyShield = statNumber(state?.player_stats?.max_energy_shield, 0);
    const currentEnergyShield = statNumber(state?.player_stats?.current_energy_shield, maxEnergyShield);
    setRuntimePlayer((current) => ({
      ...current,
      currentEnergyShield: Math.max(current.currentEnergyShield, currentEnergyShield),
      maxEnergyShield
    }));
  }, [state?.player_stats?.current_energy_shield?.value, state?.player_stats?.max_energy_shield?.value]);

  useEffect(() => {
    floatingGemRef.current = floatingGem;
  }, [floatingGem]);

  useEffect(() => {
    function onMouseMove(event: globalThis.MouseEvent) {
      const current = floatingGemRef.current;
      if (!current) return;
      setFloatingGem({ ...current, x: event.clientX + current.offsetX, y: event.clientY + current.offsetY });
    }

    async function onMouseUp(event: globalThis.MouseEvent) {
      const current = floatingGemRef.current;
      if (!current) return;
      if (event.button !== 0) return;
      event.preventDefault();
      if (dropInProgressRef.current) return;
      dropInProgressRef.current = true;
      const element = document.elementFromPoint(event.clientX, event.clientY);
      const target = resolveDropTarget(element);
      clearDragHoverState();
      clearFloatingGem();
      try {
        const result = await placeFloatingItem(current, target, event);
        if (result.type === "swap") {
          setFloatingItem(result.nextFloatingItem, result.origin, event.clientX, event.clientY, current.offsetX, current.offsetY);
        }
      } finally {
        window.setTimeout(clearDragHoverState, 0);
        window.setTimeout(clearDragHoverState, 50);
        dropInProgressRef.current = false;
      }
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [state, inventorySlots, equipmentSlots]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      if (key === "c") {
        event.preventDefault();
        setBagOpen((current) => !current);
        setTooltip(null);
        setHoveredGemId(null);
        return;
      }
      if (["w", "a", "s", "d"].includes(key)) keys.current.add(key);
    }
    function onKeyUp(event: KeyboardEvent) {
      keys.current.delete(event.key.toLowerCase());
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    playerStateRef.current = player;
  }, [player]);

  useEffect(() => {
    enemiesStateRef.current = enemies;
  }, [enemies]);

  useEffect(() => {
    boltsStateRef.current = bolts;
  }, [bolts]);

  useEffect(() => {
    if (!battleMap || !runtimeDebugMonsterBoundaryTestEnabled()) return;
    let cancelled = false;
    setRuntimeBoundaryScan({ status: "running", tested: 0, passed: 0, failed: 0, failures: [] });
    window.setTimeout(() => {
      if (cancelled) return;
      const summary = runRuntimeBoundaryMonsterAiScan(battleMap);
      if (!cancelled) setRuntimeBoundaryScan(summary);
    }, 50);
    return () => {
      cancelled = true;
    };
  }, [battleMap]);

  const activeSkills = state?.skill_preview ?? [];

  useEffect(() => {
    if (!state?.skill_editor?.selected_id || selectedSkillEditorId) return;
    setSelectedSkillEditorId(state.skill_editor.selected_id);
  }, [state?.skill_editor?.selected_id, selectedSkillEditorId]);

  useEffect(() => {
    if (!playing) {
      lastFrame.current = null;
      return;
    }

    let frame = 0;
    function tick(now: number) {
      if (lastFrame.current === null) lastFrame.current = now;
      const frameMs = now - lastFrame.current;
      if (frameMs < RUNTIME_MIN_FRAME_MS) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const dt = Math.min(0.05, frameMs / 1000);
      lastFrame.current = now;
      const logicStart = performance.now();
      let consumedEvents = 0;
      try {
        consumedEvents = stepGame(dt);
        runtimeLastStepError.current = null;
      } catch (error) {
        console.error("[runtime] stepGame failed", error);
        const message = error instanceof Error ? error.message : String(error);
        if (runtimeLastStepError.current !== message) {
          runtimeLastStepError.current = message;
          setCombatLogs((logs) => [`运行时错误：${message}`, ...logs].slice(0, 8));
        }
      }
      const logicMs = performance.now() - logicStart;
      recordRuntimePerf(frameMs, logicMs, consumedEvents, now);
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, activeSkills, state?.player_stats?.move_speed?.value, battleMap, authoredAggroSources, authoredSpawnPlanActive, skillEditorMode]);

  function stepGame(dt: number) {
    elapsedRef.current += dt;
    advanceWarIntent(dt * 1000);
    if (elapsedRef.current - elapsedLastUiSync.current >= 0.1) {
      elapsedLastUiSync.current = elapsedRef.current;
      setElapsed(elapsedRef.current);
    }
    const playerSpeed = statNumber(state?.player_stats?.move_speed, PLAYER_SPEED) * playerMovementSpeedMultiplier();
    const currentPlayer = playerStateRef.current;
    const pickupTarget = pendingDropPickup.current;
    const manualMoveVector = playerInputVector(keys.current);
    const pickupVector = pickupTarget
      ? { x: pickupTarget.x - currentPlayer.x, y: pickupTarget.y - currentPlayer.y }
      : null;
    const pickupDistance = pickupVector ? Math.hypot(pickupVector.x, pickupVector.y) : 0;
    const playerMoveVector = pickupTarget && pickupDistance > 10
      ? { x: pickupVector!.x / pickupDistance, y: pickupVector!.y / pickupDistance }
      : manualMoveVector;
    if ((manualMoveVector.x !== 0 || manualMoveVector.y !== 0) && pickupTarget) {
      pendingDropPickup.current = null;
    } else if (pickupTarget && pickupDistance <= 10 && !pickupRequestInFlight.current) {
      pendingDropPickup.current = null;
      void finishDropPickup(pickupTarget.dropId);
    }
    syncPlayerVisual(playerMoveVector);
    const dx = playerMoveVector.x;
    const dy = playerMoveVector.y;
    const length = Math.hypot(dx, dy) || 1;
    const mapWidth = battleMap?.meta.world_width ?? MAP_WIDTH;
    const mapHeight = battleMap?.meta.world_height ?? MAP_HEIGHT;
    const regeneratedPlayer = applyFrontendEnergyShieldRecharge(regeneratePlayerResources(currentPlayer, state?.player_stats, dt), dt);
    const nextPlayerPosition = resolveWalkableMove(battleMap, currentPlayer, {
      x: clamp(regeneratedPlayer.x + (dx / length) * playerSpeed * dt, 40, mapWidth - 40),
      y: clamp(regeneratedPlayer.y + (dy / length) * playerSpeed * dt, 40, mapHeight - 40)
    });
    let nextPlayer = {
      ...regeneratedPlayer,
      x: nextPlayerPosition.x,
      y: nextPlayerPosition.y
    };
    if (length > 0) continuousAttackRuntime.current = null;
    nextPlayer = applyFrontendMovementEquipmentEffects(currentPlayer, nextPlayer, dt);
    nextPlayer = applyFrontendPlayerSelfDamage(nextPlayer, dt);
    setRuntimePlayer(() => nextPlayer);

    let currentVisualEnemies = enemiesStateRef.current;
    if (!skillEditorMode) {
      spawnTimer.current -= dt;
      let spawnEnemy = false;
      if (!authoredSpawnPlanActive && spawnTimer.current <= 0 && !runtimeDebugMonsterCornerTestEnabled()) {
        spawnTimer.current = Math.max(0.45, 1.2 - elapsedRef.current / 80);
        spawnEnemy = true;
      }

      const nowMs = elapsedRef.current * 1000;
      const attackLockedEnemyIds = currentEnemyAttackLockedIds(nowMs, enemiesStateRef.current, nextPlayer, battleMap);
      const movingEnemies = updateRuntimeEnemies(enemiesStateRef.current, nextPlayer, battleMap, dt, elapsedRef.current, authoredSpawnPlanActive, authoredAggroSources, triggeredEncounterSourceIds.current, attackLockedEnemyIds);
      currentVisualEnemies = applyRuntimeMonsterAttacks(
        spawnEnemy ? [...movingEnemies, createEnemy(nextEnemyId.current++, nextPlayer.x, nextPlayer.y, battleMap, "normal", encounterMonsterPalette.current)] : movingEnemies,
        nowMs
      );
      enemiesStateRef.current = currentVisualEnemies;
      setEnemies(currentVisualEnemies);
    }
    syncEnemyVisuals(selectRenderableEnemies(currentVisualEnemies, nextPlayer, elapsedRef.current), nextPlayer, elapsedRef.current * 1000);

    const consumedContinuousAttack = processFrontendContinuousAttack(dt, enemiesStateRef.current);

    if (!consumedContinuousAttack && activeSkills.length > 0) {
      const activeIds = new Set(activeSkills.map((skill) => skill.active_gem_instance_id));
      for (const timerId of Object.keys(attackTimers.current)) {
        if (!activeIds.has(timerId)) delete attackTimers.current[timerId];
      }
      for (const timerId of Object.keys(thundercloudChannels.current)) {
        if (!activeIds.has(timerId)) delete thundercloudChannels.current[timerId];
      }
      for (const skill of activeSkills) {
        if (isThundercloudSkill(skill)) {
          processThundercloudChannel(skill, dt, enemiesStateRef.current);
          continue;
        }
        const timerId = skill.active_gem_instance_id;
        attackTimers.current[timerId] = (attackTimers.current[timerId] ?? 0) - dt;
        if (attackTimers.current[timerId] <= 0) {
          const released = hitEnemies(enemiesStateRef.current, skill);
          attackTimers.current[timerId] = released ? skillReleaseIntervalSeconds(skill) : 0.05;
        }
      }
    }

    const projectileImpactEvents = processFrontendProjectileImpacts(dt);
    const activeDamageZoneEvents = updateActiveDamageZones(dt);
    setTexts((current) => advanceRuntimeVisuals(current, dt, MAX_RUNTIME_FLOATING_TEXT));
    advancePlayerBuffs(dt);
    advanceEnemyBuffs(dt);
    setBolts((current) => advanceRuntimeVisuals(current, dt, MAX_RUNTIME_PROJECTILE_VISUALS));
    setAreaNovas((current) => advanceRuntimeVisuals(current, dt, MAX_RUNTIME_AREA_VFX));
    setMeleeArcs((current) => advanceRuntimeVisuals(current, dt, MAX_RUNTIME_AREA_VFX));
    setChainSegments((current) => advanceRuntimeVisuals(current, dt, MAX_RUNTIME_AREA_VFX));
    setDamageZones((current) => advanceRuntimeVisuals(current, dt, MAX_RUNTIME_AREA_VFX));
    setHitVfxs((current) => advanceRuntimeVisuals(current, dt, MAX_RUNTIME_HIT_VFX));
    return projectileImpactEvents + activeDamageZoneEvents + consumeScheduledSkillEvents(dt);
  }

  function recordRuntimePerf(frameMs: number, logicMs: number, consumedEvents: number, now: number) {
    const previous = runtimePerf.current;
    const next = {
      frame_ms: frameMs,
      logic_ms: logicMs,
      active_projectiles: bolts.length,
      active_hit_vfx: hitVfxs.length,
      active_area_vfx: areaNovas.length + meleeArcs.length + chainSegments.length + damageZones.length,
      active_floating_text: texts.length,
      active_enemies: enemies.length,
      scheduled_events: scheduledSkillEvents.current.length,
      consumed_events_this_frame: consumedEvents,
      dropped_frame_count: previous.dropped_frame_count + (frameMs > RUNTIME_DROPPED_FRAME_MS || logicMs > RUNTIME_SLOW_LOGIC_MS ? 1 : 0)
    };
    runtimePerf.current = next;
    if (now - runtimePerfLastSync.current >= RUNTIME_PERF_SYNC_INTERVAL_MS) {
      runtimePerfLastSync.current = now;
      setRuntimePerfSummary(next);
    }
  }

function syncPlayerVisual(moveVector: { x: number; y: number }) {
    const projectedMoveVector = projectMovementVectorForAnimation(moveVector);
    const direction = resolveAnimationDirection(projectedMoveVector, playerVisual.current.direction);
    playerVisual.current = {
      direction,
      movementVector: projectedMoveVector
    };
  }

  function syncEnemyVisuals(currentEnemies: Enemy[], currentPlayer: { x: number; y: number }, nowMs: number) {
    const activeEnemyIds = new Set(currentEnemies.map((enemy) => enemy.id));
    for (const enemyId of enemyVisuals.current.keys()) {
      if (!activeEnemyIds.has(enemyId)) enemyVisuals.current.delete(enemyId);
    }

    for (const enemy of currentEnemies) {
      const previous = enemyVisuals.current.get(enemy.id);
      const worldMovementVector = previous ? { x: enemy.x - previous.lastX, y: enemy.y - previous.lastY } : { x: currentPlayer.x - enemy.x, y: currentPlayer.y - enemy.y };
      const chaseVector = { x: currentPlayer.x - enemy.x, y: currentPlayer.y - enemy.y };
      const movementVector = Math.hypot(worldMovementVector.x, worldMovementVector.y) > ENEMY_WALK_VISUAL_DEADZONE
        ? chaseVector
        : { x: 0, y: 0 };
      const direction = resolveAnimationDirection(chaseVector, previous?.direction ?? "down");
      enemyVisuals.current.set(enemy.id, {
        direction,
        movementVector,
        attackStartedAtMs: enemy.attackStartedAtMs,
        attackUntilMs: enemy.attackUntilMs,
        lastX: enemy.x,
        lastY: enemy.y
      });
    }
  }

  function applyRuntimeMonsterAttacks(currentEnemies: Enemy[], nowMs: number) {
    let nextPlayer = playerStateRef.current;
    let nextBuffs = activePlayerBuffsRef.current;
    const hits: Array<{
      hit: ReturnType<typeof resolveMonsterHitAgainstPlayer>;
      playerPosition: { x: number; y: number };
    }> = [];
    const nextEnemies = currentEnemies.map((enemy) => {
      if (enemy.hp <= 0) return enemy;
      if (nextPlayer.hp <= 0 || !canEnemyStartRuntimeAttack(enemy, nextPlayer, nowMs, battleMap)) return enemy;
      const attackedEnemy = {
        ...enemy,
        attackStartedAtMs: nowMs,
        attackUntilMs: nowMs + ENEMY_ATTACK_VISUAL_DURATION_MS,
        nextAttackReadyAtMs: nowMs + monsterAttackCadenceMs(enemy),
        velocityX: 0,
        velocityY: 0
      };
      const hitKind = enemy.hitKind ?? "attack";
      const blocked = resolveFrontendPlayerBlock(enemy, hitKind);
      const playerBeforeHit = blocked ? recoverFrontendPlayerOnBlock(nextPlayer, nowMs) : nextPlayer;
      const hit = resolveMonsterHitAgainstPlayer(enemy, playerBeforeHit, state?.player_stats, blocked);
      const guarded = applyGuardBuffsToMonsterHit(hit, playerBeforeHit, nextBuffs);
      nextBuffs = guarded.nextBuffs;
      if (guarded.hit.totalDamage <= 0) return attackedEnemy;
      resetEnergyShieldRechargeDelay(nowMs);
      hits.push({ hit: guarded.hit, playerPosition: { x: nextPlayer.x, y: nextPlayer.y } });
      nextPlayer = guarded.hit.nextPlayer;
      return attackedEnemy;
    });
    if (hits.length === 0) {
      if (nextBuffs !== activePlayerBuffsRef.current) setRuntimePlayerBuffs(nextBuffs);
      return nextEnemies;
    }

    setRuntimePlayerBuffs(nextBuffs);
    const defeated = !skillEditorMode && nextPlayer.hp <= 0;
    setRuntimePlayer(() => nextPlayer);
    if (defeated) {
      setPlaying(false);
      setBagOpen(false);
      setGameFailureOpen(true);
      setNotice("游戏失败。玩家生命已归零。");
    }
    setTexts((items) => capRuntimeVisualBudget([
      ...items,
      ...hits.map(({ hit, playerPosition }) => ({
        id: nextTextId.current++,
        x: playerPosition.x,
        y: playerPosition.y - 42,
        text: `-${Math.max(1, Math.round(hit.totalDamage))}`,
        ttl: 0.8,
        duration: 0.8
      }))
    ], MAX_RUNTIME_FLOATING_TEXT));
    setCombatLogs((logs) => [
      ...(defeated ? ["玩家生命归零，游戏失败。"] : []),
      ...hits.map(({ hit }) => `怪物攻击造成 ${formatPreviewNumber(hit.totalDamage)} 点${damageTypeText(hit.damageType)}伤害${hit.blocked ? "（已格挡）" : ""}。`),
      ...logs
    ].slice(0, 8));
    return nextEnemies;
  }

  function applyGuardBuffsToMonsterHit(
    hit: ReturnType<typeof resolveMonsterHitAgainstPlayer>,
    playerBeforeHit: PlayerRuntimeState,
    buffs: PlayerBuff[]
  ) {
    let incoming = hit.totalDamage;
    const nextBuffs: PlayerBuff[] = [];
    for (const buff of buffs) {
      if (buff.remaining <= 0 || buff.remainingAmount <= 0) continue;
      if (!playerAbsorbBuffType(buff.buffType)) {
        nextBuffs.push(buff);
        continue;
      }
      const absorbed = Math.min(buff.remainingAmount, incoming * buff.absorbPercent / 100);
      const nextBuff = { ...buff, remainingAmount: buff.remainingAmount - absorbed };
      incoming = Math.max(0, incoming - absorbed);
      if (nextBuff.remainingAmount > 0) nextBuffs.push(nextBuff);
    }
    const nextPlayer = applyFrontendDamageToPlayer(playerBeforeHit, incoming);
    const shieldDamage = Math.max(0, playerBeforeHit.currentEnergyShield - nextPlayer.currentEnergyShield);
    const lifeDamage = Math.max(0, playerBeforeHit.hp - nextPlayer.hp);
    return {
      hit: {
        ...hit,
        totalDamage: incoming,
        shieldDamage,
        lifeDamage,
        nextPlayer
      },
      nextBuffs
    };
  }

  function applyChannelMovementBuff(event: SkillEvent) {
    const payload = event.payload ?? {};
    const rawMultiplier = Number(payload.channel_move_speed_multiplier);
    if (!Number.isFinite(rawMultiplier)) return;
    const moveSpeedMultiplier = Math.max(0, rawMultiplier);
    const tickMs = Math.max(0, Number(payload.channel_time_per_stack_ms ?? 0));
    const duration = Math.max(0.3, tickMs / 1000 + 0.15);
    const skillId = String(payload.skill_id ?? event.skill_instance_id);
    const nextBuff: PlayerBuff = {
      id: nextPlayerBuffId.current++,
      buffType: "channel_move_speed",
      skillId,
      remaining: duration,
      duration,
      remainingAmount: 1,
      absorbPercent: 0,
      excludeDamageOverTime: false,
      moveSpeedMultiplier,
      vfxKey: event.vfx_key || String(payload.zone_vfx_key ?? "channel_move_speed")
    };
    setRuntimePlayerBuffs([
      ...activePlayerBuffsRef.current.filter((buff) => !(buff.buffType === nextBuff.buffType && buff.skillId === nextBuff.skillId)),
      nextBuff
    ]);
  }

  function currentEnemyAttackLockedIds(
    nowMs: number,
    currentEnemies: Enemy[] = [],
    currentPlayer?: { x: number; y: number },
    map?: BakedBattleMapData | null
  ) {
    const lockedIds = new Set<number>();
    for (const enemy of currentEnemies) {
      if (enemy.attackUntilMs !== undefined && nowMs < enemy.attackUntilMs) {
        lockedIds.add(enemy.id);
        continue;
      }
      if (currentPlayer && canEnemyStartRuntimeAttack(enemy, currentPlayer, nowMs, map)) lockedIds.add(enemy.id);
    }
    return lockedIds;
  }

  function skillReleaseIntervalSeconds(skill: SkillPreview) {
    const intervalMs = Number(skill.actual_interval_ms ?? skill.final_cooldown_ms ?? 0);
    if (isThundercloudSkill(skill)) {
      const params = skill.runtime_params ?? {};
      const channelStacks = Math.max(1, Math.round(Number(params.channel_max_stacks ?? 5)));
      const channelTimePerStackMs = Math.max(1, Number(params.channel_time_per_stack_ms ?? (intervalMs || 333)));
      const cloudDurationMs = Math.max(
        1,
        Number(params.duration_ms ?? channelStacks * Number(params.cloud_duration_per_stack_ms ?? 2500))
      );
      const cooldownMs = Math.max(0, Number(skill.final_cooldown_ms ?? 0));
      return Math.max(0.16, (channelStacks * channelTimePerStackMs + cloudDurationMs + cooldownMs) / 1000);
    }
    return Math.max(0.16, intervalMs / 1000);
  }

  function thundercloudChannelParams(skill: SkillPreview) {
    const params = skill.runtime_params ?? {};
    const maxStacks = Math.max(1, Math.round(Number(params.channel_max_stacks ?? 5)));
    const timePerStackMs = Math.max(1, Number(params.channel_time_per_stack_ms ?? skill.actual_interval_ms ?? 333));
    const cloudDurationMs = Math.max(
      1,
      Number(params.duration_ms ?? maxStacks * Number(params.cloud_duration_per_stack_ms ?? 2500))
    );
    const cooldownMs = Math.max(0, Number(skill.final_cooldown_ms ?? 0));
    return { maxStacks, timePerStackMs, cloudDurationMs, cooldownMs };
  }

  function processThundercloudChannel(skill: SkillPreview, dt: number, current: Enemy[]) {
    const timerId = skill.active_gem_instance_id;
    const channel = thundercloudChannels.current[timerId] ?? {
      stacks: 0,
      progressMs: 0,
      noChannelMs: 0,
      lockedMs: 0
    };
    thundercloudChannels.current[timerId] = channel;
    const { maxStacks, timePerStackMs, cloudDurationMs, cooldownMs } = thundercloudChannelParams(skill);
    const deltaMs = Math.max(0, dt * 1000);
    if (channel.lockedMs > 0) {
      channel.lockedMs = Math.max(0, channel.lockedMs - deltaMs);
      return false;
    }
    const hasChannelTarget = current.length > 0 && hasLiveEnemyInCastRange(current, skill, playerStateRef.current);
    if (!hasChannelTarget) {
      channel.progressMs = 0;
      if (channel.stacks > 0) {
        channel.noChannelMs += deltaMs;
        while (channel.noChannelMs >= 3000 && channel.stacks > 0) {
          channel.stacks -= 1;
          channel.noChannelMs -= 1000;
        }
      } else {
        channel.noChannelMs = 0;
      }
      return false;
    }
    channel.noChannelMs = 0;
    channel.progressMs += deltaMs;
    while (channel.progressMs >= timePerStackMs && channel.stacks < maxStacks) {
      channel.stacks += 1;
      channel.progressMs -= timePerStackMs;
    }
    if (channel.stacks < maxStacks) return false;
    if (!trySpendSkillMana(skill)) return false;
    const released = releaseFrontendCanonicalSkill(skill, current);
    if (!released) return false;
    channel.stacks = 0;
    channel.progressMs = 0;
    channel.noChannelMs = 0;
    channel.lockedMs = cloudDurationMs + cooldownMs;
    return true;
  }

  function skillManaCost(skill: SkillPreview) {
    return Math.max(0, Number(skill.mana_cost ?? 0));
  }

  function frontendSkillTags(skill: SkillPreview) {
    const rawTags = skill.runtime_params?.frontend_skill_tags;
    if (!Array.isArray(rawTags)) return new Set<string>();
    return new Set(rawTags.map(String));
  }

  function isFrontendContinuousAttackEligible(skill: SkillPreview) {
    const tags = frontendSkillTags(skill);
    const castMode = String(skill.cast?.mode ?? "");
    const isAttack = tags.has("attack") || castMode === "attack";
    if (!isAttack) return false;
    const blockedTags = ["channel", "movement", "displacement", "mobility", "sentinel"];
    if (blockedTags.some((tag) => tags.has(tag))) return false;
    if (isThundercloudSkill(skill)) return false;
    return Number(skill.runtime_params?.continuous_attack_chance_percent ?? 0) > 0;
  }

  function frontendContinuousAttackRepeatCount(skill: SkillPreview) {
    const chancePercent = Math.max(0, Number(skill.runtime_params?.continuous_attack_chance_percent ?? 0));
    const guaranteed = Math.floor(chancePercent / 100);
    const remainder = chancePercent - guaranteed * 100;
    const rollKey = `${skill.active_gem_instance_id}:continuous_attack:${Math.floor(elapsedRef.current * 1000)}`;
    const extra = remainder > 0 && stablePercent(rollKey) < remainder ? 1 : 0;
    return Math.min(20, guaranteed + extra);
  }

  function frontendContinuousAttackIntervalSeconds(skill: SkillPreview) {
    return Math.max(0.05, skillReleaseIntervalSeconds(skill) / 1.2);
  }

  function frontendContinuousAttackSkill(skill: SkillPreview, repeatIndex: number) {
    const stepPercent = Math.max(0, Number(skill.runtime_params?.continuous_attack_damage_step_percent ?? 0));
    const stepFinalPercent = Math.max(0, Number(skill.runtime_params?.continuous_attack_damage_step_final_percent ?? 0));
    const damageMultiplier = Math.max(0, 1 + (stepPercent * (1 + stepFinalPercent / 100) * repeatIndex) / 100);
    const finalDamageComponents = skill.final_damage_components
      ? Object.fromEntries(Object.entries(skill.final_damage_components)
          .map(([damageType, amount]) => [damageType, Math.max(0, Number(amount ?? 0) * damageMultiplier)]))
      : undefined;
    return {
      ...skill,
      final_damage: Math.max(0, Number(skill.final_damage ?? 0) * damageMultiplier),
      non_crit_damage: Math.max(0, Number(skill.non_crit_damage ?? skill.final_damage ?? 0) * damageMultiplier),
      expected_hit_damage: Math.max(0, Number(skill.expected_hit_damage ?? skill.final_damage ?? 0) * damageMultiplier),
      final_damage_components: finalDamageComponents,
      runtime_params: {
        ...(skill.runtime_params ?? {}),
        continuous_attack_repeat_index: repeatIndex,
        continuous_attack_damage_multiplier: damageMultiplier
      }
    };
  }

  function enqueueFrontendContinuousAttack(skill: SkillPreview) {
    if (!isFrontendContinuousAttackEligible(skill)) return;
    const repeats = frontendContinuousAttackRepeatCount(skill);
    if (repeats <= 0) return;
    continuousAttackRuntime.current = {
      skillId: skill.active_gem_instance_id,
      skill,
      repeatsRemaining: repeats,
      nextRepeatIndex: 1,
      remainingSeconds: frontendContinuousAttackIntervalSeconds(skill)
    };
  }

  function processFrontendContinuousAttack(dt: number, current: Enemy[]) {
    const runtime = continuousAttackRuntime.current;
    if (!runtime) return false;
    runtime.remainingSeconds -= dt;
    if (runtime.remainingSeconds > 0) return true;
    if (runtime.repeatsRemaining <= 0) {
      continuousAttackRuntime.current = null;
      return false;
    }
    const repeatSkill = frontendContinuousAttackSkill(runtime.skill, runtime.nextRepeatIndex);
    const released = hitEnemies(current, repeatSkill, { isContinuousRepeat: true });
    if (!released) {
      continuousAttackRuntime.current = null;
      return true;
    }
    runtime.repeatsRemaining -= 1;
    runtime.nextRepeatIndex += 1;
    runtime.remainingSeconds = frontendContinuousAttackIntervalSeconds(runtime.skill);
    if (runtime.repeatsRemaining <= 0) continuousAttackRuntime.current = null;
    return true;
  }

  function trySpendSkillMana(skill: SkillPreview) {
    const cost = skillManaCost(skill);
    if (cost <= 0) return true;
    const currentMana = playerStateRef.current.currentMana;
    if (currentMana < cost) {
      setCombatLogs((logs) => [`${skill.name_text} 魔力不足。`, ...logs].slice(0, 8));
      return false;
    }
    setRuntimePlayer((current) => ({
      ...current,
      currentMana: clamp(current.currentMana - cost, 0, current.maxMana)
    }));
    return true;
  }

  function frontendRuntimeNumber(skill: SkillPreview, key: string, fallback: number) {
    const value = skill.runtime_params?.[key] ?? skill.hit?.[key] ?? skill.cast?.[key];
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function frontendRuntimeMaxTargets(skill: SkillPreview, fallback = 1) {
    return Math.max(1, Math.round(frontendRuntimeNumber(skill, "max_targets", fallback)));
  }

  function frontendRuntimeRange(skill: SkillPreview, fallback = 420) {
    return Math.max(
      1,
      frontendRuntimeNumber(skill, "max_distance", frontendRuntimeNumber(skill, "search_range", fallback))
        * Math.max(0.1, skill.area_multiplier)
    );
  }

  function isFrontendSelfBuffSkill(skill: SkillPreview) {
    return skill.cast?.target_selector === "self"
      || Number(skill.runtime_params?.guard_absorb_amount ?? 0) > 0
      || Number(skill.runtime_params?.guard_absorb_percent ?? 0) > 0;
  }

  function frontendNearestSkillTargets(current: Enemy[], source: { x: number; y: number }, range: number, maxTargets: number) {
    return [...current]
      .filter((enemy) => enemy.hp > 0 && distance(enemy, source) <= range)
      .sort((a, b) => distance(a, source) - distance(b, source))
      .slice(0, maxTargets);
  }

  function frontendCircleSkillTargets(current: Enemy[], center: { x: number; y: number }, radius: number, maxTargets: number) {
    return [...current]
      .filter((enemy) => enemy.hp > 0 && distance(enemy, center) <= radius)
      .sort((a, b) => distance(a, center) - distance(b, center))
      .slice(0, maxTargets);
  }

  function frontendMeleeArcTargets(
    current: Enemy[],
    origin: { x: number; y: number },
    direction: { x: number; y: number },
    radius: number,
    arcAngle: number,
    maxTargets: number
  ) {
    const facing = normalizedWorldDirection(direction);
    return [...current]
      .filter((enemy) => {
        if (enemy.hp <= 0 || distance(enemy, origin) > radius) return false;
        const toEnemy = normalizedWorldDirection({ x: enemy.x - origin.x, y: enemy.y - origin.y });
        const angle = Math.acos(clamp(facing.x * toEnemy.x + facing.y * toEnemy.y, -1, 1)) * 180 / Math.PI;
        return angle <= arcAngle / 2;
      })
      .sort((a, b) => distance(a, origin) - distance(b, origin))
      .slice(0, maxTargets);
  }

  function frontendSkillDamageAgainstEnemy(skill: SkillPreview, enemy: Enemy, amount = skill.final_damage) {
    const components = damagePayloadComponents(skill, Number(amount ?? 0), skill.damage_type, skill.hit as Record<string, unknown>);
    const resistancePenetrationPercent = Number(skill.runtime_params?.resistance_penetration_percent ?? 0);
    const armorReductionPenetrationPercent = Number(skill.runtime_params?.armor_reduction_penetration_percent ?? 0);
    return Object.entries(components).reduce((total, [damageType, value]) => {
      return total + scaledDamageAgainstEnemy(damageType, Number(value ?? 0), enemy, resistancePenetrationPercent, armorReductionPenetrationPercent);
    }, 0);
  }

  function frontendRuntimeRoll(skill: SkillPreview, enemy: Enemy, salt: number) {
    const skillHash = Array.from(skill.active_gem_instance_id).reduce((total, char) => total + char.charCodeAt(0), 0);
    const raw = Math.sin(enemy.id * 12.9898 + skillHash * 0.193 + salt * 78.233) * 43758.5453;
    return raw - Math.floor(raw);
  }

  function frontendSkillStatusBuffs(skill: SkillPreview, enemy: Enemy): EnemyBuff[] {
    const hit = skill.hit as Record<string, unknown> | undefined;
    const ailments = Array.isArray(hit?.ailments) ? hit.ailments as Record<string, unknown>[] : [];
    const statusBuffs: EnemyBuff[] = [];
    ailments.forEach((ailment, index) => {
      const chance = clamp(Number(ailment.chance_percent ?? 0) / 100, 0, 1);
      if (chance <= 0 || frontendRuntimeRoll(skill, enemy, index + 101) > chance) return;
      const statusType = String(ailment.type ?? "");
      if (!statusType) return;
      const duration = Math.max(0.1, Number(ailment.duration_ms ?? 0) / 1000);
      statusBuffs.push({
        buffType: statusType,
        statusType,
        polarity: "negative",
        remaining: duration,
        duration,
        valuePercent: Math.max(0, Number(ailment.effect_per_stack ?? ailment.base_value ?? 0)),
        baseValue: Math.max(0, Number(ailment.base_value ?? 0)),
        baseDamagePerSecond: Math.max(0, Number(ailment.base_damage_per_second ?? 0) * frontendSkillAilmentDamageMultiplier(skill)),
        damageType: String(ailment.source_damage_type ?? skill.damage_type),
        nextFloatingTextIn: DOT_FLOATING_TEXT_INTERVAL_SECONDS,
        sourceSkillId: skill.skill_package_id ?? skill.skill_template_id
      });
    });
    return statusBuffs;
  }

  function mergeFrontendEnemyBuffs(enemy: Enemy, buffs: EnemyBuff[]) {
    if (buffs.length === 0) return enemy;
    let activeBuffs = [...(enemy.activeBuffs ?? [])];
    for (const buff of buffs) {
      const existing = activeBuffs.find((item) => item.statusType === buff.statusType && item.sourceSkillId === buff.sourceSkillId);
      const merged = existing
        ? {
            ...buff,
            remaining: Math.max(existing.remaining, buff.remaining),
            baseValue: (existing.baseValue ?? 0) + (buff.baseValue ?? 0),
            baseDamagePerSecond: Math.max(existing.baseDamagePerSecond ?? 0, buff.baseDamagePerSecond ?? 0)
          }
        : buff;
      activeBuffs = [
        ...activeBuffs.filter((item) => !(item.statusType === buff.statusType && item.sourceSkillId === buff.sourceSkillId)),
        merged
      ];
    }
    return { ...enemy, activeBuffs };
  }

  function applyFrontendGuardRuntime(skill: SkillPreview) {
    const absorbAmount = frontendRuntimeNumber(skill, "guard_absorb_amount", 0);
    const absorbPercent = frontendRuntimeNumber(skill, "guard_absorb_percent", 0);
    const duration = Math.max(0, frontendRuntimeNumber(skill, "guard_duration_ms", 0)) / 1000;
    if (absorbAmount <= 0 || absorbPercent <= 0 || duration <= 0) return false;
    const skillId = skill.skill_package_id ?? skill.skill_template_id;
    const nextBuff: PlayerBuff = {
      id: nextPlayerBuffId.current++,
      buffType: "guard",
      skillId,
      remaining: duration,
      duration,
      remainingAmount: absorbAmount,
      absorbPercent,
      excludeDamageOverTime: Boolean(skill.runtime_params?.guard_exclude_damage_over_time),
      vfxKey: skill.visual_effect
    };
    setRuntimePlayerBuffs([
      ...activePlayerBuffsRef.current.filter((buff) => !(buff.buffType === nextBuff.buffType && buff.skillId === nextBuff.skillId)),
      nextBuff
    ]);
    setAreaNovas((items) => capRuntimeVisualBudget([
      ...items,
      {
        id: nextAreaNovaId.current++,
        x: playerStateRef.current.x,
        y: playerStateRef.current.y,
        radius: Math.max(24, frontendRuntimeNumber(skill, "radius", 72)),
        ringWidth: Math.max(8, frontendRuntimeNumber(skill, "ring_width", 24)),
        ttl: Math.min(duration, 1.2),
        duration: Math.min(duration, 1.2),
        damageType: skill.damage_type,
        vfxKey: skill.visual_effect,
        skillId,
        followPlayer: true,
        vfxScale: skillPreviewVfxScale(skill)
      }
    ], MAX_RUNTIME_AREA_VFX));
    return true;
  }

  function applyFrontendSkillHits(
    current: Enemy[],
    skill: SkillPreview,
    hitTargets: Array<{ enemy: Enemy; damageAmount?: number; statusBuffs?: EnemyBuff[] }>
  ) {
    const damageByTarget = new Map<number, number>();
    const buffsByTarget = new Map<number, EnemyBuff[]>();
    const targetById = new Map(hitTargets.map((hit) => [hit.enemy.id, hit.enemy]));
    hitTargets.forEach((hit) => {
      const damage = frontendSkillDamageAgainstEnemy(skill, hit.enemy, hit.damageAmount ?? skill.final_damage);
      damageByTarget.set(hit.enemy.id, (damageByTarget.get(hit.enemy.id) ?? 0) + damage);
      const buffs = [...frontendSkillStatusBuffs(skill, hit.enemy), ...(hit.statusBuffs ?? [])];
      if (buffs.length > 0) buffsByTarget.set(hit.enemy.id, [...(buffsByTarget.get(hit.enemy.id) ?? []), ...buffs]);
    });
    if (damageByTarget.size === 0 && buffsByTarget.size === 0) return current;
    const nextTexts: FloatingText[] = [];
    const killedTargets: Enemy[] = [];
    const survivors = current
      .map((enemy) => {
        const damage = damageByTarget.get(enemy.id) ?? 0;
        const buffs = buffsByTarget.get(enemy.id) ?? [];
        if (damage <= 0 && buffs.length === 0) return enemy;
        const hp = enemy.hp - damage;
        if (damage > 0) {
          nextTexts.push({
            id: nextTextId.current++,
            x: enemy.x,
            y: enemy.y - 28,
            text: Math.round(damage).toString(),
            damageType: skill.damage_type,
            ttl: 0.8,
            duration: 0.8
          });
        }
        const damagedEnemy = mergeFrontendEnemyBuffs({ ...enemy, hp, lastDamagedAt: damage > 0 ? elapsedRef.current : enemy.lastDamagedAt }, buffs);
        if (enemy.hp > 0 && hp <= 0) killedTargets.push(targetById.get(enemy.id) ?? enemy);
        return damagedEnemy;
      })
      .filter((enemy) => shouldRetainEnemyForGameplayOrDamageFlash(enemy, elapsedRef.current));
    const killed = killedTargets.length;
    if (killed > 0) {
      setKills((value) => value + killed);
      spawnFrontendDrops(killedTargets);
      setCombatLogs((logs) => [`${skill.name_text} 击杀 ${killed} 个怪物。`, ...logs].slice(0, 8));
    } else {
      setCombatLogs((logs) => [`${skill.name_text} 自动释放。`, ...logs].slice(0, 8));
    }
    if (nextTexts.length > 0) {
      setTexts((items) => capRuntimeVisualBudget([...items, ...nextTexts], MAX_RUNTIME_FLOATING_TEXT));
    }
    return survivors;
  }

  function frontendSkillEvent(
    skill: SkillPreview,
    type: SkillEvent["type"],
    target: Enemy | null,
    position: { x: number; y: number },
    direction: { x: number; y: number },
    amount: number | null,
    damageType = skill.damage_type,
    payload: Record<string, unknown> = {},
    durationMs = 0,
    delayMs = 0
  ): SkillEvent {
    const nowMs = Math.round(elapsedRef.current * 1000);
    return {
      event_id: `frontend_${type}_${skill.active_gem_instance_id}_${target?.id ?? "area"}_${nowMs}_${nextTextId.current++}`,
      type,
      timestamp_ms: nowMs + delayMs,
      source_entity: "player",
      target_entity: target ? String(target.id) : "",
      position,
      direction,
      delay_ms: delayMs,
      duration_ms: durationMs,
      amount,
      damage_type: damageType,
      skill_instance_id: skill.active_gem_instance_id,
      vfx_key: String(payload.vfx_key ?? skill.visual_effect),
      sfx_key: "",
      reason_key: String(payload.reason_key ?? "frontend_client_skill_runtime"),
      payload: {
        skill_id: skill.skill_package_id ?? skill.skill_template_id,
        skill_name: skill.name_text,
        vfx_scale: skillPreviewVfxScale(skill),
        ...payload
      }
    };
  }

  function frontendSkillVfxKey(skill: SkillPreview, role: "cast" | "projectile" | "hit" | "zone" | "segment" = "hit", fallback?: unknown) {
    const keys = skill.presentation_keys ?? {};
    const params = skill.runtime_params ?? {};
    const candidates = [
      fallback,
      role === "projectile" ? keys.projectile_vfx_key : undefined,
      role === "hit" ? keys.hit_vfx_key : undefined,
      role === "cast" ? keys.cast_vfx_key : undefined,
      role === "zone" ? params.zone_vfx_key : undefined,
      role === "segment" ? params.segment_vfx_key : undefined,
      keys.vfx,
      skill.visual_effect,
      skill.skill_package_id,
      skill.skill_template_id
    ];
    const value = candidates.find((candidate) => typeof candidate === "string" && candidate.length > 0);
    return String(value ?? skill.visual_effect);
  }

  function convertedDamageType(skill: SkillPreview, hitConfig?: Record<string, unknown>) {
    const conversions = Array.isArray(hitConfig?.damage_conversions)
      ? hitConfig.damage_conversions as Record<string, unknown>[]
      : Array.isArray(skill.hit?.damage_conversions)
        ? skill.hit.damage_conversions as Record<string, unknown>[]
        : [];
    const fullConversion = conversions.find((conversion) => Number(conversion.percent ?? 0) >= 100 && typeof conversion.to === "string");
    return String(fullConversion?.to ?? skill.damage_type);
  }

  function damagePayloadComponents(skill: SkillPreview, amount: number, damageType: string, hitConfig?: Record<string, unknown>) {
    const explicitComponents = hitConfig?.damage_components;
    if (
      skill.final_damage_components
      && typeof skill.final_damage_components === "object"
      && !Array.isArray(skill.final_damage_components)
      && !damageComponentsContainTrueDamage(explicitComponents)
    ) {
      const ratio = Number(skill.final_damage ?? 0) > 0 ? amount / Number(skill.final_damage) : 1;
      return Object.fromEntries(Object.entries(skill.final_damage_components)
        .map(([componentType, componentAmount]) => [componentType, Math.max(0, Number(componentAmount ?? 0) * ratio)])
        .filter(([, componentAmount]) => componentAmount > 0));
    }
    if (explicitComponents && typeof explicitComponents === "object" && !Array.isArray(explicitComponents)) {
      return convertFrontendDamageComponents(
        Object.fromEntries(Object.entries(explicitComponents as Record<string, unknown>)
          .map(([componentType, componentAmount]) => [componentType, Number(componentAmount ?? 0)])),
        frontendDamageConversions(skill, hitConfig)
      );
    }
    return { [damageType]: amount };
  }

  function damageComponentsContainTrueDamage(components: unknown) {
    return Boolean(components && typeof components === "object" && !Array.isArray(components) && "true" in components);
  }

  function mergeFrontendDamageComponents(...componentMaps: Record<string, number>[]) {
    const merged: Record<string, number> = {};
    for (const components of componentMaps) {
      for (const [damageType, amount] of Object.entries(components)) {
        addFrontendDamageComponent(merged, damageType, Number(amount ?? 0));
      }
    }
    return merged;
  }

  function frontendEquipmentGrantedDamageComponents(
    skill: SkillPreview,
    target: Enemy,
    payload: Record<string, unknown>,
    primaryDamageType: string
  ) {
    const effects = Array.isArray(skill.runtime_params?.frontend_equipment_granted_effects)
      ? skill.runtime_params.frontend_equipment_granted_effects as Record<string, unknown>[]
      : [];
    const components: Record<string, number> = {};
    const floatingComponents: Record<string, unknown>[] = [];
    const applied: Record<string, unknown>[] = [];
    effects.forEach((effect, index) => {
      if (effect.effect_kind !== "direct_damage") return;
      if (!frontendGrantedEffectTriggerMatches(skill, effect)) return;
      const damageType = String(effect.damage_type ?? primaryDamageType);
      const resolvedDamageType = damageType === "generic" ? primaryDamageType : damageType;
      const min = Number(effect.value_min ?? effect.value ?? 0);
      const max = Number(effect.value_max ?? effect.value ?? min);
      const low = Math.min(min, max);
      const high = Math.max(min, max);
      const seed = [
        skill.active_gem_instance_id,
        target.id,
        payload.marker_id ?? payload.projectile_id ?? payload.secondary_hit_id ?? payload.area_id ?? "hit",
        effect.id ?? effect.source_modifier_id ?? index,
        Math.round(elapsedRef.current * 1000)
      ].join(":");
      const rolled = low + (high - low) * stablePercent(seed) / 100;
      const amount = rolled * Math.max(0, Number(effect.damage_multiplier ?? 1));
      if (amount <= 0) return;
      addFrontendDamageComponent(components, resolvedDamageType, amount);
      floatingComponents.push({
        source: "equipment_granted_direct_damage",
        id: effect.id,
        direct_damage_module_id: effect.direct_damage_module_id,
        trigger_condition: effect.trigger_condition,
        damage_type: resolvedDamageType,
        amount
      });
      applied.push({
        id: effect.id,
        trigger_condition: effect.trigger_condition,
        direct_damage_module_id: effect.direct_damage_module_id,
        damage_type: resolvedDamageType,
        amount
      });
    });
    return { components, floatingComponents, applied };
  }

  function frontendGrantedEffectTriggerMatches(skill: SkillPreview, effect: Record<string, unknown>) {
    const condition = String(effect.trigger_condition ?? "hit");
    const tags = new Set(Array.isArray(skill.runtime_params?.frontend_skill_tags) ? skill.runtime_params.frontend_skill_tags.map(String) : []);
    if (condition === "hit") return true;
    if (condition === "attack_hit") return tags.has("attack");
    if (condition === "spell_hit") return tags.has("spell");
    return false;
  }

  function ailmentConfigsForHit(skill: SkillPreview, hitConfig?: Record<string, unknown>) {
    const configs = Array.isArray(hitConfig?.ailments)
      ? [...hitConfig.ailments as Record<string, unknown>[]]
      : Array.isArray(skill.hit?.ailments)
        ? [...skill.hit.ailments as Record<string, unknown>[]]
        : [];
    const damageType = convertedDamageType(skill, hitConfig);
    if (damageType === "cold" && !configs.some((item) => item.type === "frostbite")) {
      configs.push({ type: "frostbite", chance_percent: 0, duration_ms: 2000, base_value: 10, effect_per_stack: 10, source_damage_type: "cold" });
    }
    if (damageType === "lightning" && !configs.some((item) => item.type === "numbed")) {
      const effect = 5 * (1 + Number(skill.runtime_params?.numbed_effect_add_percent ?? 0) / 100);
      configs.push({ type: "numbed", chance_percent: 0, duration_ms: 2000, base_value: effect, effect_per_stack: effect, max_stacks: 10, source_damage_type: "lightning" });
    }
    if (damageType === "chaos" && Number(skill.runtime_params?.deterioration_chance_add_percent ?? 0) > 0) {
      configs.push({
        type: "deterioration",
        chance_percent: Number(skill.runtime_params?.deterioration_chance_add_percent ?? 0),
        duration_ms: 1000 * (1 + (Number(skill.runtime_params?.duration_add_percent ?? 0) + Number(skill.runtime_params?.deterioration_duration_add_percent ?? 0)) / 100),
        base_value: Number(skill.final_damage ?? 0) * 0.6 * (1 + Number(skill.runtime_params?.deterioration_damage_add_percent ?? 0) / 100),
        effect_per_stack: 0,
        max_stacks: 99,
        source_damage_type: "chaos"
      });
    }
    return configs.map((config) => {
      const type = String(config.type ?? "");
      const durationAdd = Number(skill.runtime_params?.duration_add_percent ?? 0)
        + Number(skill.runtime_params?.ailment_duration_add_percent ?? 0)
        + (type === "ignite" ? Number(skill.runtime_params?.ignite_duration_add_percent ?? 0) : 0)
        + (type === "trauma" ? Number(skill.runtime_params?.trauma_duration_add_percent ?? 0) : 0);
      const nextConfig = {
        ...config,
        duration_ms: Number(config.duration_ms ?? 0) * (1 + durationAdd / 100),
      };
      if (type === "ignite") {
        nextConfig.base_damage_per_second = Number(nextConfig.base_damage_per_second ?? 0)
          + Number(skill.runtime_params?.added_base_ignite_damage_per_second ?? 0)
          + Number(skill.runtime_params?.added_base_ailment_damage_per_second ?? 0);
        nextConfig.max_stacks = Number(nextConfig.max_stacks ?? 1) + Number(skill.runtime_params?.ignite_stacks_add ?? 0);
      }
      if (type === "trauma") {
        nextConfig.base_damage_per_second = Number(nextConfig.base_damage_per_second ?? 0)
          + Number(skill.runtime_params?.added_base_trauma_damage_per_second ?? 0)
          + Number(skill.runtime_params?.added_base_ailment_damage_per_second ?? 0);
      }
      if (type === "frostbite") {
        const maxValue = 100 + Number(skill.runtime_params?.frostbite_max_value_add ?? 0);
        nextConfig.threshold = maxValue;
        nextConfig.max_value = maxValue;
      }
      return nextConfig;
    });
  }

  function frontendStatusEventsForTarget(
    skill: SkillPreview,
    target: Enemy,
    position: { x: number; y: number },
    direction: { x: number; y: number },
    hitConfig?: Record<string, unknown>,
    delayMs = 0
  ) {
    return ailmentConfigsForHit(skill, hitConfig).flatMap((ailment, index) => {
      const chance = clamp(Number(ailment.chance_percent ?? 0) / 100, 0, 1);
      if (chance <= 0 || frontendRuntimeRoll(skill, target, index + 701) > chance) return [];
      const statusType = String(ailment.type ?? "");
      if (!statusType) return [];
      const durationMs = Math.max(0, Number(ailment.duration_ms ?? 0));
      return [frontendSkillEvent(skill, "status_apply", target, position, direction, null, String(ailment.source_damage_type ?? skill.damage_type), {
        status_type: statusType,
        source_skill_id: skill.skill_package_id ?? skill.skill_template_id,
        duration_ms: durationMs,
        base_value: Number(ailment.base_value ?? 0),
        effect_per_stack: Number(ailment.effect_per_stack ?? ailment.base_value ?? 0),
        base_damage_per_second: Number(ailment.base_damage_per_second ?? 0),
        damage_over_time_more_percent: Number(ailment.damage_over_time_more_percent ?? 0),
        dot_damage_add_percent: Number(skill.runtime_params?.dot_damage_add_percent ?? 0),
        ailment_damage_add_percent: Number(skill.runtime_params?.ailment_damage_add_percent ?? 0),
        ailment_damage_deepen_percent: Number(skill.runtime_params?.ailment_damage_deepen_percent ?? 0),
        max_stacks: Number(ailment.max_stacks ?? 1)
      }, durationMs, delayMs)];
    });
  }

  function frontendDamageEventsForTarget(
    skill: SkillPreview,
    target: Enemy,
    position: { x: number; y: number },
    direction: { x: number; y: number },
    amount: number,
    hitConfig?: Record<string, unknown>,
    payload: Record<string, unknown> = {},
    delayMs = 0
  ) {
    const damageType = convertedDamageType(skill, hitConfig);
    const hitVfxKey = String(payload.hit_vfx_key ?? payload.vfx_key ?? frontendSkillVfxKey(skill, "hit"));
    const emitHitVfx = payload.emit_hit_vfx !== false && !payload.tick_interval_ms;
    const baseDamageComponents = damagePayloadComponents(skill, amount, damageType, hitConfig);
    const grantedDamage = frontendEquipmentGrantedDamageComponents(skill, target, payload, damageType);
    const damageComponents = mergeFrontendDamageComponents(baseDamageComponents, grantedDamage.components);
    const floatingDamageComponents = [
      ...frontendFloatingDamageComponentPayload(baseDamageComponents, "skill_direct_damage"),
      ...grantedDamage.floatingComponents
    ];
    const damagePayload = {
      ...payload,
      damage_conversions: hitConfig?.damage_conversions ?? skill.hit?.damage_conversions ?? [],
      armor_reduction_penetration_percent: skill.runtime_params?.armor_reduction_penetration_percent,
      resistance_penetration_percent: skill.runtime_params?.resistance_penetration_percent,
      cull_threshold_percent: skill.runtime_params?.cull_threshold_percent,
      double_damage_chance_percent: skill.runtime_params?.double_damage_chance_percent,
      numbed_effect_add_percent: skill.runtime_params?.numbed_effect_add_percent,
      equipment_granted_direct_damage: grantedDamage.applied,
      damage_components: damageComponents,
      floating_damage_components: floatingDamageComponents,
      hit_world_position: position,
      hit_vfx_key: hitVfxKey
    };
    const eventAmount = frontendDamageMapTotal(damageComponents) || amount;
    const events = [
      frontendSkillEvent(skill, "damage", target, position, direction, eventAmount, damageType, damagePayload, 0, delayMs),
      frontendSkillEvent(skill, "floating_text", target, { x: position.x, y: position.y - 28 }, direction, eventAmount, damageType, damagePayload, 800, delayMs),
      ...frontendStatusEventsForTarget(skill, target, position, direction, hitConfig, delayMs)
    ];
    if (emitHitVfx) {
      events.push(frontendSkillEvent(skill, "hit_vfx", target, position, direction, amount, damageType, {
        ...damagePayload,
        vfx_key: hitVfxKey,
        hit_world_position: position,
        impact_world_position: position
      }, 360, delayMs));
    }
    return events;
  }

  function frontendFloatingDamageComponentPayload(components: Record<string, number>, source: string) {
    return Object.entries(components)
      .map(([damageType, amount]) => ({
        source,
        damage_type: damageType,
        amount: Number(amount ?? 0)
      }))
      .filter((item) => Number.isFinite(item.amount) && item.amount > 0);
  }

  function frontendSecondaryHitAmount(skill: SkillPreview, secondary: SecondaryHitConfig) {
    const baseAmount = Math.max(0, Number(secondary.base_damage ?? secondary.weapon_attack_percent ?? skill.final_damage ?? 0));
    return frontendScaledSkillConfigDamageAmount(skill, baseAmount);
  }

  function frontendScaledSkillConfigDamageAmount(skill: SkillPreview, baseAmount: number) {
    const primaryBaseAmount = Math.max(0, Number(skill.base_damage ?? skill.hit?.base_damage ?? 0));
    const primaryFinalAmount = Math.max(0, Number(skill.non_crit_damage ?? skill.final_damage ?? 0));
    if (baseAmount <= 0 || primaryBaseAmount <= 0 || primaryFinalAmount <= 0) return baseAmount;
    return baseAmount * (primaryFinalAmount / primaryBaseAmount);
  }

  function frontendUniqueTargetsByDistance(
    current: Enemy[],
    origin: { x: number; y: number },
    radius: number,
    maxTargets: number,
    excludeIds = new Set<number>()
  ) {
    return candidateEnemiesNear(current, origin, radius)
      .filter((enemy) => enemy.hp > 0 && !excludeIds.has(enemy.id) && distance(enemy, origin) <= radius)
      .sort((a, b) => distance(a, origin) - distance(b, origin))
      .slice(0, Math.max(1, maxTargets));
  }

  function consumeSkillEventTimeline(events: SkillEvent[]) {
    if (events.length === 0) return;
    const immediate: SkillEvent[] = [];
    for (const event of events) {
      const delaySeconds = Math.max(0, Number(event.delay_ms ?? 0)) / 1000;
      if (delaySeconds <= 0) {
        immediate.push(event);
      } else {
        scheduledSkillEvents.current.push({ event, remaining: delaySeconds });
      }
    }
    if (immediate.length > 0) consumeSkillEventBatch(immediate);
  }

  function releaseFrontendCanonicalSkill(skill: SkillPreview, current: Enemy[]) {
    const runtimeSkill = applyFrontendWarIntentToSkill(skill);
    if (applyFrontendGuardRuntime(runtimeSkill)) {
      setCombatLogs((logs) => [`${skill.name_text} 获得防护。`, ...logs].slice(0, 8));
      return true;
    }
    const caster = playerStateRef.current;
    const behavior = runtimeSkill.behavior_template ?? runtimeSkill.behavior_type;
    const range = frontendRuntimeRange(runtimeSkill, 520);
    const targets = frontendNearestSkillTargets(current, caster, range, Math.max(1, runtimeSkill.projectile_count));
    if (targets.length === 0) return false;
    const events = buildFrontendCanonicalSkillEvents(runtimeSkill, caster, targets, current, behavior);
    if (events.length === 0) return false;
    consumeSkillEventTimeline(events);
    setCombatLogs((logs) => [`${skill.name_text} 自动释放。`, ...logs].slice(0, 8));
    return true;
  }

  function buildFrontendCanonicalSkillEvents(
    skill: SkillPreview,
    caster: PlayerRuntimeState,
    initialTargets: Enemy[],
    current: Enemy[],
    behavior: string | undefined
  ) {
    if (skillHasProjectileDamageZoneModules(skill)) return buildFrontendModuleChainSkillEvents(skill, caster, initialTargets, current);
    if (isProjectileSkillTemplate(behavior)) return buildFrontendProjectileSkillEvents(skill, caster, initialTargets, current);
    if (behavior === "chain") return buildFrontendChainSkillEvents(skill, caster, initialTargets, current);
    if (behavior === "module_chain") return buildFrontendModuleChainSkillEvents(skill, caster, initialTargets, current);
    if (behavior === "damage_zone") return buildFrontendDamageZoneSkillEvents(skill, caster, initialTargets, current);
    if (behavior === "melee_arc") return buildFrontendMeleeArcSkillEvents(skill, caster, initialTargets, current);
    if (behavior === "player_nova" || behavior === "nova") return buildFrontendNovaSkillEvents(skill, caster, current);
    return initialTargets.flatMap((target) => frontendDamageEventsForTarget(skill, target, { x: target.x, y: target.y }, guideDirection(caster, target), skill.final_damage, skill.hit as Record<string, unknown>));
  }

  function hitEnemies(current: Enemy[], skill: SkillPreview, options: { isContinuousRepeat?: boolean } = {}) {
    const selfBuffSkill = isFrontendSelfBuffSkill(skill);
    if (current.length === 0 && !selfBuffSkill) return false;
    if (!selfBuffSkill && !hasLiveEnemyInCastRange(current, skill, playerStateRef.current)) return false;
    if (!trySpendSkillMana(skill)) return false;
    const released = releaseFrontendCanonicalSkill(skill, current);
    if (released && !options.isContinuousRepeat) enqueueFrontendContinuousAttack(skill);
    return released;
  }

  function buildFrontendProjectileSkillEvents(skill: SkillPreview, caster: PlayerRuntimeState, initialTargets: Enemy[], current: Enemy[]) {
    const params = skill.runtime_params ?? {};
    const events: SkillEvent[] = [];
    const timestampMs = Math.round(elapsedRef.current * 1000);
    const projectileCount = Math.max(1, Math.round(Number(params.projectile_count ?? skill.projectile_count ?? 1)));
    const allowSameTargetHits = Boolean(params.allow_same_target_projectile_hits);
    const targetPolicy = String(params.target_policy ?? "");
    const forcedElements = Array.isArray(params.forced_element_types) ? params.forced_element_types.map(String) : [];
    const forcedElement = forcedElements.length > 0 ? forcedElementDamageType(skill, timestampMs) : null;
    const burstIntervalMs = Math.max(0, Number(params.burst_interval_ms ?? 0));
    const targetPool = targetPolicy === "nearest_unique_enemy"
      ? frontendUniqueTargetsByDistance(current, caster, frontendRuntimeRange(skill, 520), projectileCount)
      : initialTargets;
    const firstTarget = targetPool[0] ?? initialTargets[0];
    const baseDirection = guideDirection(caster, firstTarget);
    const spreadDirections = projectileSpreadDirections(baseDirection, projectileCount, Number(params.spread_angle_deg ?? 0), Number(params.angle_step ?? 0));
    const hitSequences = new Map<number, number>();

    for (let index = 0; index < projectileCount; index += 1) {
      const target = allowSameTargetHits
        ? (targetPool[index % targetPool.length] ?? firstTarget)
        : (targetPool[index] ?? firstTarget);
      if (!target) continue;
      const spawn = projectileSpawnWorldPosition(caster, params);
      const directDirection = targetPolicy === "nearest_unique_enemy" || targetPolicy === "random_enemy"
        ? guideDirection(spawn, target)
        : (spreadDirections[index] ?? baseDirection);
      const jitter = Number(params.random_angle_jitter_deg ?? 0);
      const jitterRoll = jitter > 0 ? stablePercent(`${skill.active_gem_instance_id}:${timestampMs}:${index + 1}:angle_jitter`) / 100 : 0.5;
      const direction = jitter > 0 ? rotateDirection(directDirection, (jitterRoll * 2 - 1) * jitter) : directDirection;
      const projectileDelayMs = index * burstIntervalMs;
      const projectileId = `${skill.active_gem_instance_id}.projectile.${timestampMs}.${index + 1}`;
      const sameTargetSequence = hitSequences.get(target.id) ?? 0;
      hitSequences.set(target.id, sameTargetSequence + 1);
      const shotgunCoeff = Number(params.shotgun_falloff_coeff ?? 0);
      const damageScale = sameTargetSequence > 0 && shotgunCoeff > 0 ? 1 - shotgunCoeff : 1;
      const damageType = forcedElement ?? convertedDamageType(skill, skill.hit as Record<string, unknown>);
      const amount = Math.max(0, Number(skill.final_damage ?? 0)) * damageScale;
      const hitPosition = { x: target.x, y: target.y };
      const sustainedTicks = Boolean(params.sustained_ticks);
      const lifetimeMs = Math.max(
        Number(params.min_duration_ms ?? 80),
        Number(params.duration_ms ?? params.travel_time_ms ?? Math.min(Number(params.max_duration_ms ?? 2200), distance(spawn, hitPosition) / Math.max(1, Number(params.projectile_speed ?? 600)) * 1000))
      );
      const expirePosition = {
        x: spawn.x + direction.x * Number(params.max_distance ?? distance(spawn, hitPosition)),
        y: spawn.y + direction.y * Number(params.max_distance ?? distance(spawn, hitPosition))
      };
      events.push(frontendSkillEvent(skill, "projectile_spawn", target, spawn, direction, null, damageType, {
        vfx_key: frontendSkillVfxKey(skill, "projectile"),
        projectile_id: projectileId,
        projectile_index: index + 1,
        projectile_count: projectileCount,
        target_world_position: sustainedTicks ? expirePosition : hitPosition,
        expire_world_position: sustainedTicks ? expirePosition : hitPosition,
        spawn_world_position: spawn,
        spawn_policy: "caster_current_position",
        vfx_spawn_policy: "caster_current_position",
        direction_world: direction,
        velocity_world: { x: direction.x * Number(params.projectile_speed ?? 600), y: direction.y * Number(params.projectile_speed ?? 600) },
        projectile_speed: Number(params.projectile_speed ?? 600),
        projectile_width: Number(params.projectile_width ?? 38),
        projectile_height: Number(params.projectile_height ?? 24),
        impact_radius: Number(params.impact_radius ?? skill.hit?.hit_radius ?? 24),
        projectile_visual_mode: String(params.projectile_visual_mode ?? "standard"),
        trajectory: String(params.trajectory ?? "linear"),
        arc_height: Number(params.arc_height ?? 0),
        lifetime_ms: lifetimeMs,
        local_spread_angle: index === 0 ? 0 : undefined,
        burst_interval_ms: burstIntervalMs
      }, lifetimeMs, projectileDelayMs));
      if (sustainedTicks) {
        const tickIntervalMs = Math.max(1, Number(params.tick_interval_ms ?? 0));
        const activeDurationMs = Math.max(tickIntervalMs, Number(params.duration_ms ?? lifetimeMs));
        const tickCount = Math.max(1, Math.floor(activeDurationMs / tickIntervalMs));
        const tickRadius = Math.max(1, Number(params.impact_radius ?? skill.hit?.hit_radius ?? 20));
        const tickMaxTargets = Math.max(1, Math.round(Number(params.max_targets ?? 1)));
        for (let tick = 0; tick < tickCount; tick += 1) {
          const tickTimeMs = (tick + 1) * tickIntervalMs;
          const progress = clamp(tickTimeMs / Math.max(1, lifetimeMs), 0, 1);
          const tickPosition = {
            x: spawn.x + (hitPosition.x - spawn.x) * progress,
            y: spawn.y + (hitPosition.y - spawn.y) * progress
          };
          const tickDelayMs = projectileDelayMs + tickTimeMs;
          const tickTargets = frontendUniqueTargetsByDistance(current, tickPosition, tickRadius, tickMaxTargets);
          for (const tickTarget of tickTargets) {
            const tickTargetPosition = { x: tickTarget.x, y: tickTarget.y };
            const tickDamageComponents = forcedElement
              ? { [damageType]: amount }
              : damagePayloadComponents(skill, amount, damageType, skill.hit as Record<string, unknown>);
            const tickPayload = {
              projectile_id: projectileId,
              projectile_index: index + 1,
              projectile_count: projectileCount,
              tick_index: tick + 1,
              tick_time_ms: tickTimeMs,
              tick_interval_ms: tickIntervalMs,
              duration_ms: activeDurationMs,
              hit_world_position: tickTargetPosition,
              impact_world_position: tickPosition,
              projectile_world_position: tickPosition,
              target_world_position: tickTargetPosition,
              damage_components: tickDamageComponents,
              armor_reduction_penetration_percent: skill.runtime_params?.armor_reduction_penetration_percent,
              resistance_penetration_percent: skill.runtime_params?.resistance_penetration_percent,
              cull_threshold_percent: skill.runtime_params?.cull_threshold_percent,
              double_damage_chance_percent: skill.runtime_params?.double_damage_chance_percent,
              hit_vfx_key: frontendSkillVfxKey(skill, "hit")
            };
            events.push(frontendSkillEvent(skill, "damage", tickTarget, tickTargetPosition, direction, amount, damageType, tickPayload, 0, tickDelayMs));
            events.push(frontendSkillEvent(skill, "hit_vfx", tickTarget, tickTargetPosition, direction, null, damageType, {
              ...tickPayload,
              vfx_key: frontendSkillVfxKey(skill, "hit")
            }, 420, tickDelayMs));
            events.push(frontendSkillEvent(skill, "floating_text", tickTarget, { x: tickTargetPosition.x, y: tickTargetPosition.y - 28 }, direction, amount, damageType, tickPayload, 800, tickDelayMs));
          }
        }
        continue;
      }
      events.push(frontendSkillEvent(skill, "projectile_hit", target, hitPosition, direction, amount, damageType, {
        vfx_key: frontendSkillVfxKey(skill, "hit"),
        projectile_id: projectileId,
        projectile_index: index + 1,
        projectile_count: projectileCount,
        projectile_continues: false,
        hit_world_position: hitPosition,
        target_world_position: hitPosition,
        marker_id: params.impact_marker_id ?? `${skill.active_gem_instance_id}.hit`,
        hit_marker_id: params.impact_marker_id ?? `${skill.active_gem_instance_id}.hit`
      }, 0, projectileDelayMs + lifetimeMs));
      events.push(...frontendDamageEventsForTarget(skill, target, hitPosition, direction, amount, {
        ...(skill.hit as Record<string, unknown>),
        damage_conversions: forcedElement ? [] : skill.hit?.damage_conversions
      }, {
        projectile_id: projectileId,
        projectile_index: index + 1,
        projectile_count: projectileCount,
        forced_element_type: forcedElement ?? undefined,
        same_target_hit_sequence: sameTargetSequence,
        shotgun_falloff_coeff: shotgunCoeff,
        damage_components: forcedElement
          ? { [damageType]: amount }
          : damagePayloadComponents(skill, amount, damageType, skill.hit as Record<string, unknown>),
        hit_vfx_key: frontendSkillVfxKey(skill, "hit"),
        marker_id: params.impact_marker_id ?? `${skill.active_gem_instance_id}.hit`,
        on_kill_explosion_chance_percent: params.on_kill_explosion_chance_percent,
        on_kill_explosion_radius: params.on_kill_explosion_radius,
        on_kill_explosion_max_life_percent: params.on_kill_explosion_max_life_percent,
        on_kill_explosion_damage_type: params.on_kill_explosion_damage_type
      }, projectileDelayMs + lifetimeMs));
      events.push(...buildFrontendSecondaryHitEvents(skill, target, hitPosition, direction, current, projectileDelayMs + lifetimeMs));
      events.push(...buildFrontendSplitProjectileEvents(skill, target, hitPosition, direction, current, projectileId, projectileDelayMs + lifetimeMs));
      events.push(...buildFrontendIgnitedHitExplosionEvents(skill, target, hitPosition, direction, current, projectileDelayMs + lifetimeMs));
    }
    return events;
  }

  function buildFrontendSecondaryHitEvents(skill: SkillPreview, triggerTarget: Enemy, triggerPosition: { x: number; y: number }, direction: { x: number; y: number }, current: Enemy[], triggerDelayMs = 0) {
    const secondaryHits = Array.isArray(skill.hit?.secondary_hits) ? skill.hit.secondary_hits as SecondaryHitConfig[] : [];
    const events: SkillEvent[] = [];
    for (const secondary of secondaryHits) {
      const placement = String(secondary.placement ?? "impact_position");
      const center = placement === "behind_target"
        ? {
            x: triggerPosition.x + direction.x * Number(secondary.offset_distance ?? 0),
            y: triggerPosition.y + direction.y * Number(secondary.offset_distance ?? 0)
          }
        : triggerPosition;
      const radius = Math.max(1, Number(secondary.radius ?? skill.hit?.hit_radius ?? 60));
      const maxTargets = Math.max(1, Math.round(Number(secondary.max_targets ?? 1)));
      const targets = frontendUniqueTargetsByDistance(current, center, radius, maxTargets);
      const secondaryId = String(secondary.id ?? "secondary_hit");
      const secondaryDelayMs = triggerDelayMs + Math.max(0, Number(secondary.delay_ms ?? 0));
      events.push(frontendSkillEvent(skill, "damage_zone", null, center, direction, null, convertedDamageType(skill, secondary), {
        vfx_key: secondary.vfx_key ?? frontendSkillVfxKey(skill, "zone"),
        secondary_hit_id: secondaryId,
        shape: secondary.shape ?? "circle",
        radius,
        max_targets: maxTargets,
        hit_target_count: targets.length,
        trigger_marker_id: secondary.trigger_marker_id,
        search_module_id: secondary.search_module_id,
        direct_damage_module_id: secondary.direct_damage_module_id
      }, 180, secondaryDelayMs));
      for (const target of targets) {
        const amount = frontendSecondaryHitAmount(skill, secondary);
        events.push(frontendSkillEvent(skill, "damage_zone_hit", target, { x: target.x, y: target.y }, direction, amount, convertedDamageType(skill, secondary), {
          vfx_key: secondary.hit_vfx_key ?? secondary.vfx_key ?? frontendSkillVfxKey(skill, "hit"),
          secondary_hit_id: secondaryId,
          marker_id: secondary.hit_marker_id ?? `${secondaryId}.hit`,
          hit_world_position: { x: target.x, y: target.y },
          trigger_marker_id: secondary.trigger_marker_id,
          search_module_id: secondary.search_module_id,
          direct_damage_module_id: secondary.direct_damage_module_id
        }, 0, secondaryDelayMs));
        events.push(...frontendDamageEventsForTarget(skill, target, { x: target.x, y: target.y }, direction, amount, secondary, {
          secondary_hit_id: secondaryId,
          hit_vfx_key: secondary.hit_vfx_key ?? secondary.vfx_key ?? frontendSkillVfxKey(skill, "hit"),
          marker_id: secondary.hit_marker_id ?? `${secondaryId}.hit`,
          trigger_event_type: "target_search",
          direct_damage_module_id: secondary.direct_damage_module_id
        }, secondaryDelayMs));
      }
    }
    return events;
  }

  function buildFrontendSplitProjectileEvents(skill: SkillPreview, triggerTarget: Enemy, triggerPosition: { x: number; y: number }, direction: { x: number; y: number }, current: Enemy[], parentProjectileId: string, triggerDelayMs = 0) {
    const params = skill.runtime_params ?? {};
    const splitCount = Math.max(0, Math.round(Number(params.split_projectile_count ?? 0)));
    if (splitCount <= 0) return [];
    const events: SkillEvent[] = [];
    const center = (splitCount - 1) / 2;
    const step = Number(params.split_projectile_angle_step_deg ?? 25);
    for (let index = 0; index < splitCount; index += 1) {
      const angle = (index - center) * step;
      const splitDirection = rotateDirection(direction, angle);
      const maxDistance = Number(params.split_projectile_max_distance ?? 240);
      const candidates = current
        .filter((enemy) => enemy.hp > 0 && enemy.id !== triggerTarget.id && distance(enemy, triggerPosition) <= maxDistance)
        .map((enemy) => ({ enemy, angle: angleBetweenDegrees(splitDirection, guideDirection(triggerPosition, enemy)), dist: distance(enemy, triggerPosition) }))
        .sort((a, b) => a.angle - b.angle || a.dist - b.dist);
      const target = candidates[0]?.enemy;
      const projectileId = `${parentProjectileId}.split.${index + 1}`;
      const damageType = convertedDamageType(skill, skill.hit as Record<string, unknown>);
      const amount = Number(skill.final_damage ?? 0) * Number(params.split_projectile_damage_multiplier ?? 0.5);
      const expirePosition = {
        x: triggerPosition.x + splitDirection.x * maxDistance,
        y: triggerPosition.y + splitDirection.y * maxDistance
      };
      const targetPosition = target ? { x: target.x, y: target.y } : expirePosition;
      const splitLifetimeMs = Math.max(
        Number(params.min_duration_ms ?? 80),
        Math.min(Number(params.max_duration_ms ?? 2200), distance(triggerPosition, targetPosition) / Math.max(1, Number(params.split_projectile_speed ?? params.projectile_speed ?? 600)) * 1000)
      );
      events.push(frontendSkillEvent(skill, "projectile_spawn", target, triggerPosition, splitDirection, null, damageType, {
        vfx_key: frontendSkillVfxKey(skill, "projectile", params.split_projectile_vfx_key),
        split_projectile: true,
        split_projectile_index: index + 1,
        projectile_id: projectileId,
        parent_projectile_id: parentProjectileId,
        projectile_index: index + 1,
        projectile_count: splitCount,
        local_spread_angle: angle,
        target_world_position: targetPosition,
        expire_world_position: expirePosition,
        spawn_world_position: triggerPosition,
        direction_world: splitDirection,
        projectile_speed: Number(params.split_projectile_speed ?? params.projectile_speed ?? 600),
        projectile_width: Number(params.split_projectile_width ?? params.projectile_width ?? 38),
        projectile_height: Number(params.split_projectile_height ?? params.projectile_height ?? 24),
        pierce_count: Number(params.split_projectile_pierce_count ?? 0),
        lifetime_ms: splitLifetimeMs
      }, splitLifetimeMs, triggerDelayMs));
      if (!target) continue;
      events.push(frontendSkillEvent(skill, "projectile_hit", target, { x: target.x, y: target.y }, splitDirection, amount, damageType, {
        vfx_key: frontendSkillVfxKey(skill, "hit"),
        split_projectile: true,
        projectile_id: projectileId,
        parent_projectile_id: parentProjectileId,
        projectile_index: index + 1,
        projectile_count: splitCount,
        projectile_continues: false,
        hit_world_position: { x: target.x, y: target.y },
        target_world_position: { x: target.x, y: target.y }
      }, 0, triggerDelayMs + splitLifetimeMs));
      events.push(...frontendDamageEventsForTarget(skill, target, { x: target.x, y: target.y }, splitDirection, amount, skill.hit as Record<string, unknown>, {
        split_projectile: true,
        hit_vfx_key: frontendSkillVfxKey(skill, "hit"),
        split_projectile_index: index + 1,
        parent_projectile_id: parentProjectileId,
        projectile_id: projectileId
      }, triggerDelayMs + splitLifetimeMs));
    }
    return events;
  }

  function buildFrontendIgnitedHitExplosionEvents(skill: SkillPreview, triggerTarget: Enemy, triggerPosition: { x: number; y: number }, direction: { x: number; y: number }, current: Enemy[], triggerDelayMs = 0) {
    const params = skill.runtime_params ?? {};
    const radius = Number(params.on_ignited_hit_explosion_radius ?? 0);
    if (radius <= 0) return [];
    const ignite = (triggerTarget.activeBuffs ?? []).find((buff) => buff.statusType === "ignite" && buff.remaining > 0);
    if (!ignite) return [];
    const trueDamage = (ignite.baseDamagePerSecond ?? 0) * Number(params.on_ignited_hit_true_damage_percent_of_ignite_dps ?? 0) / 100;
    const fireDamage = frontendScaledSkillConfigDamageAmount(skill, Number(params.on_ignited_hit_indirect_fire_damage ?? 0));
    const amount = trueDamage + fireDamage;
    const targets = frontendUniqueTargetsByDistance(current, triggerPosition, radius, 8);
    return [
      frontendSkillEvent(skill, "damage_zone", null, triggerPosition, direction, amount, "fire", {
        secondary_hit_id: "ignited_hit_explosion",
        radius,
        max_targets: 8,
        hit_target_count: targets.length,
        vfx_key: "skill_event.active_burning_shot.ignited_hit.explosion"
      }, 240, triggerDelayMs),
      ...targets.flatMap((target) => frontendDamageEventsForTarget(skill, target, { x: target.x, y: target.y }, direction, amount, { damage_components: { true: trueDamage, fire: fireDamage } }, {
        secondary_hit_id: "ignited_hit_explosion",
        hit_vfx_key: "skill_event.active_burning_shot.ignited_hit.explosion",
        damage_components: { true: trueDamage, fire: fireDamage }
      }, triggerDelayMs))
    ];
  }

  function buildFrontendChainSkillEvents(skill: SkillPreview, caster: PlayerRuntimeState, initialTargets: Enemy[], current: Enemy[]) {
    const params = skill.runtime_params ?? {};
    const maxSegments = Math.max(1, Math.round(Number(params.chain_count ?? 1)));
    const chainRadius = Math.max(1, Number(params.chain_radius ?? skill.cast?.search_range ?? 180));
    const chainDelayMs = Math.max(0, Number(params.chain_delay_ms ?? 90));
    const events: SkillEvent[] = [];
    const hitIds = new Set<number>();
    let start: { x: number; y: number } = caster;
    let target = initialTargets[0];
    for (let index = 0; index < maxSegments && target; index += 1) {
      const segmentDelayMs = index * chainDelayMs;
      hitIds.add(target.id);
      const direction = guideDirection(start, target);
      const segmentId = `${skill.active_gem_instance_id}.chain.${Math.round(elapsedRef.current * 1000)}.${index + 1}`;
      events.push(frontendSkillEvent(skill, "chain_segment", target, start, direction, skill.final_damage, skill.damage_type, {
        vfx_key: frontendSkillVfxKey(skill, "segment"),
        segment_id: segmentId,
        segment_index: index,
        start_position: { x: start.x, y: start.y },
        end_position: { x: target.x, y: target.y },
        target_world_position: { x: target.x, y: target.y },
        hit_at_ms: segmentDelayMs
      }, 180, segmentDelayMs));
      events.push(...frontendDamageEventsForTarget(skill, target, { x: target.x, y: target.y }, direction, skill.final_damage, skill.hit as Record<string, unknown>, {
        hit_vfx_key: frontendSkillVfxKey(skill, "hit"),
        chain_segment_id: segmentId,
        segment_index: index
      }, segmentDelayMs));
      start = target;
      target = frontendUniqueTargetsByDistance(current, start, chainRadius, 1, hitIds)[0];
    }
    return events;
  }

  function buildFrontendModuleChainSkillEvents(skill: SkillPreview, caster: PlayerRuntimeState, initialTargets: Enemy[], current: Enemy[]) {
    const params = skill.runtime_params ?? {};
    const modules = Array.isArray(params.modules) ? params.modules as Array<{ id?: string; type?: string; params?: Record<string, unknown>; trigger?: Record<string, unknown> }> : [];
    const projectileModule = modules.find((module) => module.type === "projectile");
    const zoneModule = modules.find((module) => module.type === "damage_zone");
    const buffModule = modules.find((module) => module.type === "buff");
    if (!projectileModule || !zoneModule) return buildFrontendChainSkillEvents(skill, caster, initialTargets, current);
    const target = initialTargets[0];
    const projectileParams = projectileModule.params ?? {};
    const zoneParams = zoneModule.params ?? {};
    const spawn = projectileSpawnWorldPosition(caster, projectileParams);
    const direction = guideDirection(spawn, target);
    const impact = { x: target.x, y: target.y };
    const projectileId = `${skill.active_gem_instance_id}.module_projectile.${Math.round(elapsedRef.current * 1000)}`;
    const events: SkillEvent[] = [
      frontendSkillEvent(skill, "projectile_spawn", target, spawn, direction, null, skill.damage_type, {
        vfx_key: projectileParams.vfx_key ?? frontendSkillVfxKey(skill, "projectile"),
        projectile_id: projectileId,
        target_world_position: impact,
        spawn_world_position: spawn,
        direction_world: direction,
        velocity_world: {
          x: direction.x * Number(projectileParams.projectile_speed ?? params.projectile_speed ?? 540),
          y: direction.y * Number(projectileParams.projectile_speed ?? params.projectile_speed ?? 540)
        },
        projectile_speed: Number(projectileParams.projectile_speed ?? params.projectile_speed ?? 540),
        projectile_width: Number(projectileParams.projectile_width ?? params.projectile_width ?? 46),
        projectile_height: Number(projectileParams.projectile_height ?? params.projectile_height ?? 30),
        trajectory: String(projectileParams.trajectory ?? "linear"),
        arc_height: Number(projectileParams.arc_height ?? 0),
        lifetime_ms: Number(projectileParams.travel_time_ms ?? 520)
      }, Number(projectileParams.travel_time_ms ?? 520)),
      frontendSkillEvent(skill, "projectile_impact", target, impact, direction, null, skill.damage_type, {
      vfx_key: projectileParams.vfx_key ?? frontendSkillVfxKey(skill, "hit"),
      projectile_id: projectileId,
      marker_id: projectileParams.impact_marker_id ?? "corrosive_impact",
      impact_position: impact
    }, 180, Number(projectileParams.travel_time_ms ?? 520))
    ];
    const impactDelayMs = Number(projectileParams.travel_time_ms ?? 520);
    events.push(...frontendDamageEventsForTarget(skill, target, impact, direction, skill.final_damage, skill.hit as Record<string, unknown>, {
      projectile_id: projectileId,
      hit_vfx_key: frontendSkillVfxKey(skill, "hit", projectileParams.vfx_key),
      marker_id: projectileParams.impact_marker_id ?? "corrosive_impact"
    }, impactDelayMs));
    const radius = Number(zoneParams.radius ?? 80) * skill.area_multiplier;
    const tickIntervalMs = Math.max(1, Number(zoneParams.tick_interval_ms ?? 1000));
    const durationMs = Math.max(tickIntervalMs, Number(zoneParams.duration_ms ?? 20000));
    const tickCount = Math.max(1, Math.floor(durationMs / tickIntervalMs));
    const zoneTargets = frontendUniqueTargetsByDistance(current, impact, radius, Math.max(1, Number(zoneParams.max_targets ?? 8)));
    const zoneBaseDamageAmount = frontendScaledSkillConfigDamageAmount(skill, Number(zoneParams.damage_amount ?? 0));
    const zoneDamageAmount = zoneBaseDamageAmount * frontendSkillDotDamageMultiplier(skill);
    const zoneId = `${skill.active_gem_instance_id}.corrosive_ground.${Math.round(elapsedRef.current * 1000)}`;
    const zoneDelayMs = impactDelayMs + Math.max(0, Number(zoneModule.trigger?.trigger_delay_ms ?? zoneParams.trigger_delay_ms ?? 0));
    const hitAtMs = Math.max(0, Number(zoneParams.hit_at_ms ?? 0));
    const useDynamicTickRuntime = tickIntervalMs > 0 && durationMs > 0;
    const dynamicBuffApply = buffModule?.params ? {
      trigger_event_type: "damage_zone_hit",
      buff_type: "",
      effect_type: buffModule.params.effect_type ?? "damage_taken_increase",
      chance_percent: Number(buffModule.params.chance_percent ?? 0),
      effect_per_stack: Number(buffModule.params.effect_per_stack ?? 0),
      duration_ms: Number(buffModule.params.duration_ms ?? 2000),
      trigger_delay_ms: Math.max(0, Number(buffModule.trigger?.trigger_delay_ms ?? 0)),
      source_skill_id: skill.skill_package_id ?? skill.skill_template_id
    } : null;
    events.push(frontendSkillEvent(skill, "damage_zone", null, impact, direction, zoneDamageAmount, skill.damage_type, {
      vfx_key: zoneParams.vfx_key ?? frontendSkillVfxKey(skill, "zone"),
      zone_id: zoneId,
      marker_id: "corrosive_ground",
      trigger_marker_id: zoneModule.trigger?.trigger_marker_id ?? projectileParams.impact_marker_id,
      shape: zoneParams.shape ?? "circle",
      radius,
      hit_at_ms: hitAtMs,
      tick_interval_ms: tickIntervalMs,
      tick_count: tickCount,
      max_targets: Number(zoneParams.max_targets ?? 8),
      hit_target_count: zoneTargets.length,
      max_hits: Number(zoneParams.max_hits ?? Number.MAX_SAFE_INTEGER),
      max_hits_per_target: Number(zoneParams.max_hits_per_target ?? Number.MAX_SAFE_INTEGER),
      dynamic_tick_runtime: useDynamicTickRuntime,
      damage_amount: zoneDamageAmount,
      emit_hit_vfx: Boolean(zoneParams.emit_hit_vfx ?? false),
      dynamic_buff_apply: dynamicBuffApply
    }, durationMs, zoneDelayMs));
    if (useDynamicTickRuntime) return events;
    for (let tick = 1; tick <= tickCount; tick += 1) {
      for (const zoneTarget of zoneTargets) {
        const tickTimeMs = hitAtMs + (tick - 1) * tickIntervalMs;
        const eventDelayMs = zoneDelayMs + tickTimeMs;
        const tickPayload = { zone_id: zoneId, marker_id: "corrosive_ground_hit", tick_time_ms: tickTimeMs, tick_interval_ms: tickIntervalMs };
        events.push(frontendSkillEvent(skill, "damage_zone_hit", zoneTarget, { x: zoneTarget.x, y: zoneTarget.y }, direction, zoneDamageAmount, skill.damage_type, { ...tickPayload, vfx_key: zoneParams.vfx_key ?? frontendSkillVfxKey(skill, "zone") }, 0, eventDelayMs));
        events.push(...frontendDamageEventsForTarget(skill, zoneTarget, { x: zoneTarget.x, y: zoneTarget.y }, direction, zoneDamageAmount, {
          damage_components: damagePayloadComponents(skill, zoneDamageAmount, skill.damage_type, skill.hit as Record<string, unknown>)
        }, { ...tickPayload, emit_hit_vfx: false }, eventDelayMs));
        if (buffModule?.params && stablePercent(`${zoneId}:${zoneTarget.id}:${tick}:buff_apply`) <= Number(buffModule.params.chance_percent ?? 0)) {
          events.push(frontendSkillEvent(skill, "buff_apply", zoneTarget, { x: zoneTarget.x, y: zoneTarget.y }, direction, null, skill.damage_type, {
            trigger_event_type: "damage_zone_hit",
            buff_type: "",
            effect_type: buffModule.params.effect_type ?? "damage_taken_increase",
            chance_percent: Number(buffModule.params.chance_percent ?? 0),
            effect_per_stack: Number(buffModule.params.effect_per_stack ?? 0),
            duration_ms: Number(buffModule.params.duration_ms ?? 2000),
            source_skill_id: skill.skill_package_id ?? skill.skill_template_id
          }, Number(buffModule.params.duration_ms ?? 2000), eventDelayMs + Math.max(0, Number(buffModule.trigger?.trigger_delay_ms ?? 0))));
        }
      }
    }
    return events;
  }

  function buildFrontendDamageZoneSkillEvents(skill: SkillPreview, caster: PlayerRuntimeState, initialTargets: Enemy[], current: Enemy[]) {
    const params = skill.runtime_params ?? {};
    const originPolicy = String(params.origin_policy ?? "target_position");
    const originTarget = initialTargets[0];
    const origin = originPolicy === "caster" ? caster : { x: originTarget.x, y: originTarget.y };
    const direction = guideDirection(caster, originTarget);
    const radius = Number(params.radius ?? skill.hit?.hit_radius ?? 120) * skill.area_multiplier;
    const waveCount = Math.max(1, Math.round(Number(params.wave_count ?? 1)));
    const tickIntervalMs = Math.max(0, Number(params.tick_interval_ms ?? 0));
    const durationMs = Math.max(Number(params.duration_ms ?? params.hit_at_ms ?? 240), tickIntervalMs || 1);
    const tickCount = tickIntervalMs > 0 ? Math.max(1, Math.floor(durationMs / tickIntervalMs)) : 1;
    const hitAtMs = Math.max(0, Number(params.hit_at_ms ?? 0));
    const waveIntervalMs = Math.max(0, Number(params.wave_interval_ms ?? 0));
    const events: SkillEvent[] = [];
    for (let wave = 0; wave < waveCount; wave += 1) {
      const waveDelayMs = wave * waveIntervalMs;
      const waveOriginTarget = String(params.target_lock_policy ?? "") === "nearest_unique_enemy"
        ? (frontendUniqueTargetsByDistance(current, caster, Number(skill.cast?.search_range ?? 630), waveCount)[wave] ?? originTarget)
        : originTarget;
      const center = originPolicy === "caster" ? caster : { x: waveOriginTarget.x, y: waveOriginTarget.y };
      const zoneTargets = frontendUniqueTargetsByDistance(current, center, radius, Math.max(1, Number(params.max_targets ?? 8)));
      const zoneId = `${skill.active_gem_instance_id}.zone.${Math.round(elapsedRef.current * 1000)}.${wave + 1}`;
      const useDynamicTickRuntime = tickIntervalMs > 0 && durationMs > 0;
      const tickDamageBaseAmount = tickIntervalMs > 0 && skill.damage_type === "chaos" ? Number(skill.final_damage) * (tickIntervalMs / 1000) : Number(skill.final_damage);
      const tickDamageAmount = tickIntervalMs > 0 ? tickDamageBaseAmount * frontendSkillDotDamageMultiplier(skill) : tickDamageBaseAmount;
      events.push(frontendSkillEvent(skill, "damage_zone", null, center, direction, skill.final_damage, skill.damage_type, {
        vfx_key: frontendSkillVfxKey(skill, "zone"),
        zone_id: zoneId,
        shape: params.shape ?? "circle",
        radius,
        ring_width: Number(params.ring_width ?? 48),
        tick_interval_ms: tickIntervalMs,
        tick_count: tickCount,
        duration_ms: durationMs,
        max_targets: Number(params.max_targets ?? 8),
        hit_target_count: zoneTargets.length,
        wave_index: wave + 1,
        target_lock_policy: params.target_lock_policy,
        origin_policy: originPolicy,
        dynamic_tick_runtime: useDynamicTickRuntime,
        dynamic_tick_hit_vfx: isThundercloudSkill(skill),
        damage_amount: tickDamageAmount,
        damage_components: damagePayloadComponents(skill, tickDamageAmount, skill.damage_type, skill.hit as Record<string, unknown>),
        max_hits: Number(params.max_hits ?? Number.MAX_SAFE_INTEGER),
        max_hits_per_target: Number(params.max_hits_per_target ?? Number.MAX_SAFE_INTEGER),
        channel_stack: Number(params.channel_min_stacks ?? 0) + 1,
        channel_max_stacks: params.channel_max_stacks,
        channel_move_speed_multiplier: params.channel_move_speed_multiplier,
        knockback_policy: params.knockback_policy,
        knockback_interval_ms: params.knockback_interval_ms,
        aggravation_value: params.aggravation_value,
        aggravation_cooldown_ms: params.aggravation_cooldown_ms,
        dot_damage_bonus_per_10_aggravation_percent: params.dot_damage_bonus_per_10_aggravation_percent
      }, durationMs, waveDelayMs));
      if (useDynamicTickRuntime) continue;
      for (let tick = 1; tick <= tickCount; tick += 1) {
        for (const target of zoneTargets) {
          const baseAmount = tickIntervalMs > 0 && skill.damage_type === "chaos" ? Number(skill.final_damage) * (tickIntervalMs / 1000) : Number(skill.final_damage);
          const amount = tickIntervalMs > 0 ? baseAmount * frontendSkillDotDamageMultiplier(skill) : baseAmount;
          const tickTimeMs = tickIntervalMs > 0 ? hitAtMs + (tick - 1) * tickIntervalMs : hitAtMs;
          const eventDelayMs = waveDelayMs + tickTimeMs;
          const tickPayload = {
            vfx_key: frontendSkillVfxKey(skill, "zone"),
            zone_id: zoneId,
            tick_time_ms: tickTimeMs,
            tick_interval_ms: tickIntervalMs,
            dot_damage_bonus_per_10_aggravation_percent: params.dot_damage_bonus_per_10_aggravation_percent
          };
          events.push(frontendSkillEvent(skill, "damage_zone_hit", target, { x: target.x, y: target.y }, direction, amount, skill.damage_type, tickPayload, 0, eventDelayMs));
          events.push(...frontendDamageEventsForTarget(skill, target, { x: target.x, y: target.y }, direction, amount, skill.hit as Record<string, unknown>, {
            ...tickPayload,
            hit_vfx_key: frontendSkillVfxKey(skill, "hit"),
            emit_hit_vfx: tickIntervalMs <= 0 || isThundercloudSkill(skill)
          }, eventDelayMs));
          if (Number(params.aggravation_value ?? 0) > 0 && tickIntervalMs > 0 && tickTimeMs % Math.max(1, Number(params.aggravation_cooldown_ms ?? 1000)) === hitAtMs % Math.max(1, Number(params.aggravation_cooldown_ms ?? 1000))) {
            events.push(frontendSkillEvent(skill, "status_apply", target, { x: target.x, y: target.y }, direction, null, skill.damage_type, {
              status_type: "aggravation",
              source_skill_id: skill.skill_package_id ?? skill.skill_template_id,
              base_value: Number(params.aggravation_value ?? 0),
              effect_per_stack: Number(params.dot_damage_bonus_per_10_aggravation_percent ?? 0),
              duration_ms: durationMs
            }, durationMs, eventDelayMs));
          }
        }
      }
      if (String(params.knockback_policy ?? "") === "reverse") {
        for (let pullMs = Number(params.knockback_interval_ms ?? 100); pullMs <= durationMs; pullMs += Number(params.knockback_interval_ms ?? 100)) {
          events.push(frontendSkillEvent(skill, "forced_movement", null, center, direction, Number(params.knockback_distance ?? 0), skill.damage_type, {
            origin_world_position: center,
            origin: center,
            radius,
            movement_policy: "pull_to_origin",
            movement_scope: "damage_zone",
            movement_distance: Number(params.knockback_distance ?? 0),
            pull_time_ms: pullMs
          }, 120, waveDelayMs + pullMs));
        }
      }
    }
    return events;
  }

  function buildFrontendMeleeArcSkillEvents(skill: SkillPreview, caster: PlayerRuntimeState, initialTargets: Enemy[], current: Enemy[]) {
    const params = skill.runtime_params ?? {};
    const target = initialTargets[0];
    const direction = guideDirection(caster, target);
    const radius = Number(params.arc_radius ?? params.radius ?? 160) * skill.area_multiplier;
    const arcAngle = Number(params.arc_angle ?? 120);
    const hitAtMs = Math.max(0, Number(params.hit_at_ms ?? skill.hit?.hit_delay_ms ?? 0));
    const maxTargets = Math.max(1, Number(params.max_targets ?? 6));
    const targets = frontendMeleeArcTargets(current, caster, direction, radius, arcAngle, maxTargets);
    const events: SkillEvent[] = [
      frontendSkillEvent(skill, "melee_arc", null, caster, direction, skill.final_damage, convertedDamageType(skill, skill.hit as Record<string, unknown>), {
        vfx_key: frontendSkillVfxKey(skill, "hit", params.slash_vfx_key),
        arc_radius: radius,
        arc_angle: arcAngle,
        origin_world_position: caster,
        direction_world: direction,
        hit_at_ms: hitAtMs,
        slash_triggered: frontendRuntimeRoll(skill, target, 901) * 100 <= Number(params.slash_chance_percent ?? 0)
      }, 220)
    ];
    for (const hitTarget of targets) {
      events.push(...frontendDamageEventsForTarget(skill, hitTarget, { x: hitTarget.x, y: hitTarget.y }, direction, skill.final_damage, skill.hit as Record<string, unknown>, {
        hit_vfx_key: frontendSkillVfxKey(skill, "hit", params.slash_vfx_key)
      }, hitAtMs));
    }
    const slashTriggered = Boolean(events[0].payload?.slash_triggered);
    if (slashTriggered) {
      const flameWaveCount = Math.max(1, Math.round(Number(params.flame_wave_count ?? 3)));
      const waveRadius = Number(params.flame_wave_distance ?? radius);
      const waveTargets = frontendMeleeArcTargets(current, caster, direction, waveRadius, Number(params.flame_wave_arc_angle ?? arcAngle), Math.max(maxTargets, 8));
      const sequenceByTarget = new Map<number, number>();
      for (let wave = 0; wave < flameWaveCount; wave += 1) {
        events.push(frontendSkillEvent(skill, "melee_arc", null, caster, direction, skill.final_damage, convertedDamageType(skill, skill.hit as Record<string, unknown>), {
          vfx_key: frontendSkillVfxKey(skill, "hit", params.slash_vfx_key),
          arc_radius: waveRadius,
          arc_angle: Number(params.flame_wave_arc_angle ?? arcAngle),
          flame_wave_index: wave + 1,
          origin_world_position: caster,
          direction_world: direction
        }, 220));
        for (const waveTarget of waveTargets) {
          const seq = sequenceByTarget.get(waveTarget.id) ?? 0;
          sequenceByTarget.set(waveTarget.id, seq + 1);
          const amount = Number(skill.final_damage) * (seq > 0 ? 1 - Number(params.shotgun_falloff_coeff ?? 0.5) : 1);
          events.push(...frontendDamageEventsForTarget(skill, waveTarget, { x: waveTarget.x, y: waveTarget.y }, direction, amount, skill.hit as Record<string, unknown>, {
            hit_vfx_key: frontendSkillVfxKey(skill, "hit", params.slash_vfx_key),
            flame_wave_index: wave + 1,
            same_target_hit_sequence: seq
          }));
        }
      }
    }
    return events;
  }

  function buildFrontendNovaSkillEvents(skill: SkillPreview, caster: PlayerRuntimeState, current: Enemy[]) {
    const params = skill.runtime_params ?? {};
    const radius = Number(params.radius ?? skill.hit?.hit_radius ?? 118) * skill.area_multiplier;
    const direction = { x: 1, y: 0 };
    const targets = frontendUniqueTargetsByDistance(current, caster, radius, Math.max(1, Number(params.max_targets ?? 8)));
    const areaId = `${skill.active_gem_instance_id}.nova.${Math.round(elapsedRef.current * 1000)}`;
    const hitAtMs = Math.max(0, Number(params.hit_at_ms ?? skill.hit?.hit_delay_ms ?? 0));
    return [
      frontendSkillEvent(skill, "area_spawn", null, caster, direction, skill.final_damage, skill.damage_type, {
        vfx_key: frontendSkillVfxKey(skill, "zone"),
        area_id: areaId,
        center_world_position: caster,
        center_policy: params.center_policy ?? "player_center",
        radius,
        ring_width: Number(params.ring_width ?? 48),
        on_kill_recast_chance_percent: params.on_kill_recast_chance_percent,
        on_kill_recast_max_per_area: params.on_kill_recast_max_per_area,
        suppress_hit_vfx: params.suppress_hit_vfx
      }, Math.max(250, Number(params.expand_duration_ms ?? 250))),
      ...targets.flatMap((target) => frontendDamageEventsForTarget(skill, target, { x: target.x, y: target.y }, guideDirection(caster, target), skill.final_damage, skill.hit as Record<string, unknown>, {
        hit_vfx_key: frontendSkillVfxKey(skill, "hit"),
        area_id: areaId,
        hit_at_ms: hitAtMs,
        on_kill_recast_chance_percent: params.on_kill_recast_chance_percent,
        on_kill_recast_max_per_area: params.on_kill_recast_max_per_area,
        radius,
        ring_width: Number(params.ring_width ?? 48)
      }, hitAtMs))
    ];
  }

  function releaseFrontendProjectileSkill(skill: SkillPreview, caster: PlayerRuntimeState, targets: Enemy[], vfxScale: number) {
    const legacyProjectileVfxKind = projectileVfxKind(skill.visual_effect) ?? projectileVfxKind(skill.skill_template_id);
    const projectileExitFadeDuration = legacyProjectileVfxKind === "burning_shot" ? 0 : PROJECTILE_BODY_EXIT_FADE_DURATION;
    const nextBolts: FireBolt[] = targets.map((target) => {
      const launch = createFireBoltProjectileLaunch(skill, caster, target, 0);
      return {
        id: nextBoltId.current++,
        x: launch.spawnWorldPosition.x,
        y: launch.spawnWorldPosition.y,
        targetX: launch.targetWorldPosition.x,
        targetY: launch.targetWorldPosition.y,
        directionX: launch.directionWorld.x,
        directionY: launch.directionWorld.y,
        velocityX: launch.velocityWorld.x,
        velocityY: launch.velocityWorld.y,
        projectileId: launch.projectileId,
        skillId: launch.skillId,
        projectileIndex: 1,
        projectileCount: targets.length,
        fanAngle: 0,
        localSpreadAngle: 0,
        pierceRemaining: 0,
        projectileSpeed: Math.hypot(launch.velocityWorld.x, launch.velocityWorld.y),
        projectileWidth: Number(skill.runtime_params?.projectile_width ?? 38),
        projectileHeight: Number(skill.runtime_params?.projectile_height ?? 24),
        impactRadius: Number(skill.runtime_params?.impact_radius ?? skill.hit?.hit_radius ?? 18),
        ttl: 0.42 + projectileExitFadeDuration,
        duration: 0.42,
        fadeDuration: projectileExitFadeDuration,
        skillTemplateId: skill.skill_template_id,
        behaviorType: skill.behavior_type,
        damageType: skill.damage_type,
        visualEffect: skill.visual_effect,
        vfxKey: skill.visual_effect,
        shapeEffects: skill.shape_effects ?? [],
        areaScale: skill.area_multiplier,
        vfxScale,
        pendingDamage: true,
        damageAmount: skill.final_damage,
        sourceSkillName: skill.name_text,
        sourceSkillInstanceId: skill.active_gem_instance_id,
        targetId: target.id
      };
    });
    setBolts((items) => capRuntimeVisualBudget([...items, ...nextBolts], MAX_RUNTIME_PROJECTILE_VISUALS));
  }

  function releaseFrontendMeleeArcSkill(skill: SkillPreview, caster: PlayerRuntimeState, targets: Enemy[], vfxScale: number) {
    const target = targets[0] ?? caster;
    const direction = guideDirection(caster, target);
    setMeleeArcs((items) => capRuntimeVisualBudget([...items, {
      id: nextMeleeArcId.current++,
      x: caster.x,
      y: caster.y,
      radius: Math.max(40, Number(skill.runtime_params?.radius ?? 120) * skill.area_multiplier),
      directionX: direction.x,
      directionY: direction.y,
      arcAngle: Math.max(30, Number(skill.runtime_params?.arc_angle_deg ?? 90)),
      ttl: 0.22,
      duration: 0.22,
      damageType: skill.damage_type,
      vfxKey: skill.visual_effect,
      vfxScale
    }], MAX_RUNTIME_AREA_VFX));
    applyFrontendSkillDamage(skill, targets, 80);
  }

  function releaseFrontendNovaSkill(skill: SkillPreview, caster: PlayerRuntimeState, targets: Enemy[], vfxScale: number) {
    const radius = Math.max(60, Number(skill.runtime_params?.radius ?? skill.runtime_params?.area_radius ?? 160) * skill.area_multiplier);
    setAreaNovas((items) => capRuntimeVisualBudget([...items, {
      id: nextAreaNovaId.current++,
      x: caster.x,
      y: caster.y,
      radius,
      ringWidth: Math.max(4, radius * 0.08),
      ttl: 0.28,
      duration: 0.28,
      damageType: skill.damage_type,
      vfxKey: skill.visual_effect,
      vfxScale
    }], MAX_RUNTIME_AREA_VFX));
    const novaTargets = enemiesStateRef.current.filter((enemy) => enemy.hp > 0 && distance(enemy, caster) <= radius).slice(0, Math.max(targets.length, 12));
    applyFrontendSkillDamage(skill, novaTargets, 120);
  }

  function releaseFrontendChainSkill(skill: SkillPreview, caster: PlayerRuntimeState, targets: Enemy[], vfxScale: number) {
    const chainTargets = targets.slice(0, Math.max(1, Number(skill.runtime_params?.chain_count ?? targets.length)));
    const segments = chainTargets.map((target, index) => {
      const start = index === 0 ? caster : chainTargets[index - 1];
      return {
        id: nextChainSegmentId.current++,
        startX: start.x,
        startY: start.y,
        endX: target.x,
        endY: target.y,
        ttl: 0.18,
        duration: 0.18,
        damageType: skill.damage_type,
        vfxKey: skill.visual_effect,
        segmentIndex: index,
        vfxScale
      };
    });
    setChainSegments((items) => capRuntimeVisualBudget([...items, ...segments], MAX_RUNTIME_AREA_VFX));
    applyFrontendSkillDamage(skill, chainTargets, 100);
  }

  function releaseFrontendDamageZoneSkill(skill: SkillPreview, caster: PlayerRuntimeState, targets: Enemy[], vfxScale: number) {
    const target = targets[0] ?? caster;
    const direction = guideDirection(caster, target);
    const radius = Math.max(40, Number(skill.runtime_params?.radius ?? skill.runtime_params?.area_radius ?? 140) * skill.area_multiplier);
    setDamageZones((items) => capRuntimeVisualBudget([...items, {
      id: nextDamageZoneId.current++,
      x: target.x,
      y: target.y,
      shape: "circle",
      radius,
      length: radius * 2,
      width: radius * 2,
      directionX: direction.x,
      directionY: direction.y,
      ttl: 0.7,
      duration: 0.7,
      damageType: skill.damage_type,
      vfxKey: skill.visual_effect,
      zoneId: `frontend_zone_${nextDamageZoneId.current}`,
      skillId: skill.active_gem_instance_id,
      vfxScale,
      tickProgress: 0
    }], MAX_RUNTIME_AREA_VFX));
    const zoneTargets = enemiesStateRef.current.filter((enemy) => enemy.hp > 0 && distance(enemy, target) <= radius).slice(0, Math.max(targets.length, 12));
    applyFrontendSkillDamage(skill, zoneTargets, 220);
  }

  function processFrontendProjectileImpacts(dt: number) {
    const impacts: FireBolt[] = [];
    const nextBolts = boltsStateRef.current.map((bolt) => {
      if (!bolt.pendingDamage) return bolt;
      const impactThreshold = Math.max(0, bolt.fadeDuration ?? 0);
      if (bolt.ttl - dt > impactThreshold) return bolt;
      impacts.push(bolt);
      return { ...bolt, pendingDamage: false };
    });
    if (impacts.length === 0) return 0;
    boltsStateRef.current = nextBolts;
    setBolts(nextBolts);
    const liveById = new Map(enemiesStateRef.current.filter((enemy) => enemy.hp > 0).map((enemy) => [enemy.id, enemy]));
    const events: SkillEvent[] = [];
    const hitVfx: HitVfx[] = [];
    impacts.forEach((bolt) => {
      const target = bolt.targetId !== undefined ? liveById.get(bolt.targetId) : undefined;
      if (!target) return;
      const eventBase: SkillEvent = {
        event_id: `frontend_projectile_impact_${bolt.projectileId ?? bolt.id}_${Math.round(elapsedRef.current * 1000)}`,
        type: "damage",
        timestamp_ms: Math.round(elapsedRef.current * 1000),
        source_entity: "player",
        target_entity: String(target.id),
        position: { x: target.x, y: target.y },
        direction: { x: bolt.directionX ?? 0, y: bolt.directionY ?? 0 },
        delay_ms: 0,
        duration_ms: 0,
        amount: bolt.damageAmount ?? 0,
        damage_type: bolt.damageType,
        skill_instance_id: bolt.sourceSkillInstanceId ?? bolt.skillId ?? bolt.skillTemplateId ?? "",
        vfx_key: bolt.vfxKey,
        sfx_key: "",
        reason_key: "frontend_projectile_impact",
        payload: { skill_name: bolt.sourceSkillName ?? "技能" }
      };
      events.push(eventBase, { ...eventBase, event_id: `${eventBase.event_id}_text`, type: "floating_text", duration_ms: 800 });
      hitVfx.push({
        id: nextHitVfxId.current++,
        x: target.x,
        y: target.y,
        targetId: target.id,
        projectileId: bolt.projectileId,
        ttl: projectileVfxKind(bolt.vfxKey) === "ice_shards" ? ICE_SHARDS_IMPACT_DURATION_MS / 1000 : FIRE_BOLT_IMPACT_DURATION_MS / 1000,
        duration: projectileVfxKind(bolt.vfxKey) === "ice_shards" ? ICE_SHARDS_IMPACT_DURATION_MS / 1000 : FIRE_BOLT_IMPACT_DURATION_MS / 1000,
        damageType: bolt.damageType,
        vfxKey: bolt.vfxKey,
        skillTemplateId: bolt.skillTemplateId,
        projectileWidth: bolt.projectileWidth,
        projectileHeight: bolt.projectileHeight,
        impactRadius: bolt.impactRadius,
        shapeEffects: bolt.shapeEffects ?? [],
        vfxScale: bolt.vfxScale
      });
    });
    if (hitVfx.length > 0) setHitVfxs((items) => capRuntimeVisualBudget([...items, ...hitVfx], MAX_RUNTIME_HIT_VFX));
    consumeSkillEventBatch(events);
    return events.length;
  }

  function frontendDamageEvent(skill: SkillPreview, enemy: Enemy): SkillEvent {
    const damagePayload = {
      skill_name: skill.name_text,
      damage_components: damagePayloadComponents(skill, Number(skill.final_damage ?? 0), skill.damage_type, skill.hit as Record<string, unknown>),
      damage_conversions: skill.hit?.damage_conversions ?? [],
      armor_reduction_penetration_percent: skill.runtime_params?.armor_reduction_penetration_percent,
      resistance_penetration_percent: skill.runtime_params?.resistance_penetration_percent,
      cull_threshold_percent: skill.runtime_params?.cull_threshold_percent,
      double_damage_chance_percent: skill.runtime_params?.double_damage_chance_percent
    };
    return {
      event_id: `frontend_damage_${skill.active_gem_instance_id}_${enemy.id}_${Math.round(elapsedRef.current * 1000)}_${nextTextId.current}`,
      type: "damage",
      timestamp_ms: Math.round(elapsedRef.current * 1000),
      source_entity: "player",
      target_entity: String(enemy.id),
      position: { x: enemy.x, y: enemy.y },
      direction: guideDirection(playerStateRef.current, enemy),
      delay_ms: 0,
      duration_ms: 0,
      amount: skill.final_damage,
      damage_type: skill.damage_type,
      skill_instance_id: skill.active_gem_instance_id,
      vfx_key: skill.visual_effect,
      sfx_key: "",
      reason_key: "frontend_skill_damage",
      payload: damagePayload
    };
  }

  function applyFrontendSkillDamage(skill: SkillPreview, targets: Enemy[], delayMs: number) {
    const liveTargets = targets.filter((target) => (enemiesStateRef.current.find((enemy) => enemy.id === target.id)?.hp ?? 0) > 0);
    if (liveTargets.length === 0) return;
    const damageEvents = liveTargets.map((target) => frontendDamageEvent(skill, target));
    const floatingEvents = liveTargets.map((target) => ({
      ...frontendDamageEvent(skill, target),
      event_id: `frontend_text_${skill.active_gem_instance_id}_${target.id}_${Math.round(elapsedRef.current * 1000)}_${nextTextId.current}`,
      type: "floating_text" as const,
      duration_ms: 800
    }));
    const events = [...damageEvents, ...floatingEvents];
    if (delayMs <= 0) {
      consumeSkillEventBatch(events);
      return;
    }
    events.forEach((event) => scheduledSkillEvents.current.push({ event, remaining: delayMs / 1000 }));
  }

  function isDynamicDamageZoneFollowupEvent(event: SkillEvent) {
    const payload = event.payload ?? {};
    if (Number(payload.tick_interval_ms ?? 0) <= 0 || typeof payload.zone_id !== "string") return false;
    return event.type === "damage_zone_hit"
      || event.type === "damage"
      || event.type === "buff_apply"
      || event.type === "floating_text"
      || event.type === "hit_vfx";
  }

function consumeImmediateSkillEvents(events: SkillEvent[]) {
    consumeSkillEventBatch(events.filter((event) => event.delay_ms === 0));
  }

  function consumeScheduledSkillEvents(dt: number) {
    const ready: SkillEvent[] = [];
    const pending: ScheduledSkillEvent[] = [];
    for (const scheduled of scheduledSkillEvents.current) {
      const remaining = scheduled.remaining - dt;
      if (remaining <= 0) {
        ready.push(scheduled.event);
      } else {
        pending.push({ ...scheduled, remaining });
      }
    }
    scheduledSkillEvents.current = pending;
    consumeSkillEventBatch(ready);
    return ready.length;
  }

  function registerActiveDamageZone(event: SkillEvent, zoneId: string, origin: { x: number; y: number }, direction: { x: number; y: number }, shape: "circle" | "rectangle") {
    if (event.type !== "damage_zone") return;
    const payload = event.payload ?? {};
    if (payload.dynamic_tick_runtime !== true) return;
    const tickIntervalMs = Math.max(0, Math.round(Number(payload.tick_interval_ms ?? 0)));
    const damageAmount = Math.max(0, Number(payload.damage_amount ?? event.amount ?? 0));
    if (tickIntervalMs <= 0 || event.duration_ms <= 0 || damageAmount <= 0) return;
    const firstTickMs = Math.max(0, Math.round(Number(payload.hit_at_ms ?? tickIntervalMs)));
    const runtime: ActiveDamageZoneRuntime = {
      zoneId,
      event,
      payload,
      origin,
      direction,
      shape,
      radius: Math.max(1, Number(payload.radius ?? 120)),
      length: Math.max(1, Number(payload.length ?? payload.radius ?? 160)),
      width: Math.max(1, Number(payload.width ?? payload.radius ?? 80)),
      followPlayer: event.source_entity === "player" && payload.origin_policy === "caster",
      remainingMs: Math.max(0, event.duration_ms),
      tickIntervalMs,
      nextTickMs: firstTickMs > 0 ? firstTickMs : tickIntervalMs,
      tickIndex: 0,
      maxTargets: Math.max(1, Math.round(Number(payload.max_targets ?? (enemiesStateRef.current.length || 1)))),
      maxHits: Math.max(1, Math.round(Number(payload.max_hits ?? Number.MAX_SAFE_INTEGER))),
      maxHitsPerTarget: Math.max(1, Math.round(Number(payload.max_hits_per_target ?? Number.MAX_SAFE_INTEGER))),
      totalHits: 0,
      hitCounts: new Map()
    };
    activeDamageZones.current = [
      ...activeDamageZones.current.filter((zone) => zone.zoneId !== zoneId),
      runtime
    ];
  }

  function updateActiveDamageZones(dt: number) {
    if (activeDamageZones.current.length === 0) return 0;
    const deltaMs = Math.max(0, Math.round(dt * 1000));
    if (deltaMs <= 0) return 0;
    const remainingZones: ActiveDamageZoneRuntime[] = [];
    const tickEvents: SkillEvent[] = [];
    for (const zone of activeDamageZones.current) {
      zone.remainingMs -= deltaMs;
      zone.nextTickMs -= deltaMs;
      while (zone.nextTickMs <= 0 && zone.remainingMs >= 0 && zone.tickIntervalMs > 0) {
        zone.tickIndex += 1;
        tickEvents.push(...activeDamageZoneRuntimeTickEvents(zone));
        zone.nextTickMs += zone.tickIntervalMs;
      }
      if (zone.remainingMs > 0 && zone.totalHits < zone.maxHits) remainingZones.push(zone);
    }
    activeDamageZones.current = remainingZones;
    if (tickEvents.length > 0) consumeSkillEventBatch(tickEvents);
    return tickEvents.length;
  }

  function activeDamageZoneRuntimeTickEvents(zone: ActiveDamageZoneRuntime) {
    const origin = zone.followPlayer ? { x: playerStateRef.current.x, y: playerStateRef.current.y } : zone.origin;
    const maxTargets = Math.max(1, zone.maxTargets);
    const targets = zone.shape === "circle"
      ? frontendUniqueTargetsByDistance(enemiesStateRef.current, origin, zone.radius, maxTargets)
      : frontendUniqueTargetsByDistance(enemiesStateRef.current, origin, Math.max(zone.length, zone.width), maxTargets)
          .filter((enemy) => damageZoneRectangleContains(enemy, origin, zone.direction, zone.length, zone.width));
    const damageAmount = Math.max(0, Number(zone.payload.damage_amount ?? zone.event.amount ?? 0));
    if (damageAmount <= 0 || targets.length === 0) return [];
    const tickTimeMs = zone.tickIndex * zone.tickIntervalMs;
    const events: SkillEvent[] = [];
    for (const target of targets) {
      if (zone.totalHits >= zone.maxHits) break;
      const previousHits = zone.hitCounts.get(target.id) ?? 0;
      if (previousHits >= zone.maxHitsPerTarget) continue;
      zone.totalHits += 1;
      zone.hitCounts.set(target.id, previousHits + 1);
      const position = { x: target.x, y: target.y };
      const direction = guideDirection(origin, target);
      const tickDamageComponents = zone.payload.damage_components && typeof zone.payload.damage_components === "object" && !Array.isArray(zone.payload.damage_components)
        ? zone.payload.damage_components
        : { [zone.event.damage_type]: damageAmount };
      const basePayload = {
        ...zone.payload,
        zone_id: zone.zoneId,
        tick_index: zone.tickIndex,
        tick_time_ms: tickTimeMs,
        tick_interval_ms: zone.tickIntervalMs,
        hit_world_position: position,
        impact_world_position: position,
        target_world_position: position,
        origin_world_position: origin,
        damage_components: tickDamageComponents,
        armor_reduction_penetration_percent: zone.payload.armor_reduction_penetration_percent,
        resistance_penetration_percent: zone.payload.resistance_penetration_percent,
        cull_threshold_percent: zone.payload.cull_threshold_percent,
        double_damage_chance_percent: zone.payload.double_damage_chance_percent,
        hit_vfx_key: zone.event.vfx_key,
        emit_hit_vfx: zone.payload.dynamic_tick_hit_vfx === true || zone.payload.emit_hit_vfx === true
      };
      const baseId = `${zone.event.event_id}.runtime_tick.${zone.tickIndex}.${target.id}`;
      events.push({
        ...zone.event,
        event_id: `${baseId}.damage_zone_hit`,
        type: "damage_zone_hit",
        target_entity: String(target.id),
        position,
        direction,
        delay_ms: 0,
        duration_ms: 0,
        amount: damageAmount,
        payload: basePayload
      });
      events.push({
        ...zone.event,
        event_id: `${baseId}.damage`,
        type: "damage",
        target_entity: String(target.id),
        position,
        direction,
        delay_ms: 0,
        duration_ms: 0,
        amount: damageAmount,
        payload: basePayload
      });
      if (basePayload.emit_hit_vfx) {
        events.push({
          ...zone.event,
          event_id: `${baseId}.hit_vfx`,
          type: "hit_vfx",
          target_entity: String(target.id),
          position,
          direction,
          delay_ms: 0,
          duration_ms: 420,
          amount: null,
          payload: basePayload
        });
      }
      events.push({
        ...zone.event,
        event_id: `${baseId}.floating_text`,
        type: "floating_text",
        target_entity: String(target.id),
        position: { x: position.x, y: position.y - 28 },
        direction,
        delay_ms: 0,
        duration_ms: 800,
        amount: damageAmount,
        payload: { ...basePayload, text: damageNumberText(damageAmount) }
      });
      const dynamicBuffApply = typeof zone.payload.dynamic_buff_apply === "object" && zone.payload.dynamic_buff_apply
        ? zone.payload.dynamic_buff_apply as Record<string, unknown>
        : null;
      if (dynamicBuffApply && stablePercent(`${baseId}.buff_apply`) <= Number(dynamicBuffApply.chance_percent ?? 0)) {
        events.push({
          ...zone.event,
          event_id: `${baseId}.buff_apply`,
          type: "buff_apply",
          target_entity: String(target.id),
          position,
          direction,
          delay_ms: Math.max(0, Number(dynamicBuffApply.trigger_delay_ms ?? 0)),
          duration_ms: Math.max(0, Number(dynamicBuffApply.duration_ms ?? 0)),
          amount: null,
          payload: {
            ...basePayload,
            trigger_event_type: dynamicBuffApply.trigger_event_type ?? "damage_zone_hit",
            buff_type: dynamicBuffApply.buff_type ?? "",
            effect_type: dynamicBuffApply.effect_type ?? "damage_taken_increase",
            chance_percent: Number(dynamicBuffApply.chance_percent ?? 0),
            effect_per_stack: Number(dynamicBuffApply.effect_per_stack ?? 0),
            duration_ms: Math.max(0, Number(dynamicBuffApply.duration_ms ?? 0)),
            source_skill_id: dynamicBuffApply.source_skill_id ?? zone.event.skill_instance_id
          }
        });
      }
      const aggravationValue = Number(zone.payload.aggravation_value ?? 0);
      const aggravationCooldownMs = Math.max(1, Number(zone.payload.aggravation_cooldown_ms ?? 1000));
      if (aggravationValue > 0 && tickTimeMs % aggravationCooldownMs === 0) {
        events.push({
          ...zone.event,
          event_id: `${baseId}.status_apply`,
          type: "status_apply",
          target_entity: String(target.id),
          position,
          direction,
          delay_ms: 0,
          duration_ms: zone.event.duration_ms,
          amount: null,
          payload: {
            ...basePayload,
            status_type: "aggravation",
            source_skill_id: zone.event.skill_instance_id,
            base_value: aggravationValue,
            effect_per_stack: Number(zone.payload.dot_damage_bonus_per_10_aggravation_percent ?? 0),
            duration_ms: zone.event.duration_ms
          }
        });
      }
    }
    return events;
  }

  function damageZoneRectangleContains(point: { x: number; y: number }, origin: { x: number; y: number }, direction: { x: number; y: number }, length: number, width: number) {
    const facing = normalizedWorldDirection(direction);
    const right = { x: -facing.y, y: facing.x };
    const dx = point.x - origin.x;
    const dy = point.y - origin.y;
    const forward = dx * facing.x + dy * facing.y;
    const lateral = dx * right.x + dy * right.y;
    return forward >= 0 && forward <= length && Math.abs(lateral) <= width / 2;
  }

  function activeDamageZoneTickProgress(zoneId: string | undefined) {
    if (!zoneId) return undefined;
    const zone = activeDamageZones.current.find((item) => item.zoneId === zoneId);
    if (!zone || zone.tickIntervalMs <= 0) return undefined;
    return 1 - clamp(zone.nextTickMs / zone.tickIntervalMs, 0, 1);
  }

  function consumeSkillEvent(event: SkillEvent) {
    consumeSkillEventBatch([event]);
  }

  function projectileSpawnPositionForEvent(event: SkillEvent) {
    if (event.payload?.vfx_spawn_policy === "caster_current_position" || event.payload?.spawn_policy === "caster_current_position") {
      return { x: playerStateRef.current.x, y: playerStateRef.current.y };
    }
    return pointFromUnknown(event.payload?.vfx_spawn_world_position)
      ?? pointFromUnknown(event.payload?.spawn_world_position)
      ?? event.position;
  }

  function liveOrbitCenter(payload: Record<string, unknown>, fallback: { x: number; y: number }) {
    if (payload.orbit_center_policy === "caster") {
      return { x: playerStateRef.current.x, y: playerStateRef.current.y };
    }
    const center = (payload.orbit_center ?? fallback) as { x?: number; y?: number };
    return {
      x: Number(center.x ?? fallback.x),
      y: Number(center.y ?? fallback.y)
    };
  }

  function liveOrbitPosition(payload: Record<string, unknown>, fallback: { x: number; y: number }) {
    const center = liveOrbitCenter(payload, fallback);
    const tickTimeMs = Number(payload.tick_time_ms ?? 0);
    const orbCount = Math.max(1, Math.round(Number(payload.orb_count ?? 1)));
    const orbIndex = Math.max(0, Math.round(Number(payload.orb_index ?? 0)));
    const radius = Math.max(1, Number(payload.orbit_radius ?? 1));
    const speed = Number(payload.orbit_speed_deg_per_sec ?? 0);
    const startAngle = Number(payload.start_angle_deg ?? 0);
    const radiusCycleEnabled = Boolean(payload.orbit_radius_cycle_enabled ?? false);
    const radiusCycleAmplitude = Math.max(0, Number(payload.orbit_radius_cycle_amplitude ?? 0));
    const radiusCyclePeriodMs = Math.max(1, Math.round(Number(payload.orbit_radius_cycle_period_ms ?? 1000)));
    const radiusCyclePhaseDeg = Number(payload.orbit_radius_cycle_phase_deg ?? 0);
    const angleDeg = startAngle + (360 / orbCount) * orbIndex + speed * (tickTimeMs / 1000);
    const angleRad = (angleDeg * Math.PI) / 180;
    const effectiveRadius = orbitEffectiveRadius(radius, tickTimeMs, radiusCycleEnabled, radiusCycleAmplitude, radiusCyclePeriodMs, radiusCyclePhaseDeg);
    return {
      x: center.x + Math.cos(angleRad) * effectiveRadius,
      y: center.y + Math.sin(angleRad) * effectiveRadius
    };
  }

  function orbitEffectiveRadius(
    radius: number,
    timestampMs: number,
    radiusCycleEnabled: boolean,
    radiusCycleAmplitude: number,
    radiusCyclePeriodMs: number,
    radiusCyclePhaseDeg: number
  ) {
    if (!radiusCycleEnabled || radiusCycleAmplitude <= 0) return Math.max(1, radius);
    const cycleRad = (timestampMs / Math.max(1, radiusCyclePeriodMs)) * Math.PI * 2 + radiusCyclePhaseDeg * Math.PI / 180;
    return Math.max(1, radius + Math.sin(cycleRad) * radiusCycleAmplitude);
  }

  function isPlayerAttachedAreaEvent(event: SkillEvent) {
    return event.source_entity === "player" && playerAttachedAreaKey(event) !== null;
  }

  function playerAttachedAreaKey(event: SkillEvent) {
    const payload = event.payload ?? {};
    const radius = Number(payload.radius ?? 0);
    if (radius <= 0) return null;
    if (payload.center_policy === "player_center" && typeof payload.area_id === "string") {
      return payload.area_id;
    }
    if (payload.origin_policy === "caster" && typeof payload.zone_id === "string") {
      const phase = typeof payload.channel_phase === "string" ? payload.channel_phase : "damage_zone";
      return `${event.skill_instance_id}.caster.${phase}`;
    }
    return null;
  }

  function playerAttachedAreaPosition(event: SkillEvent) {
    return isPlayerAttachedAreaEvent(event) ? { x: playerStateRef.current.x, y: playerStateRef.current.y } : null;
  }

  function consumeSkillEventBatch(events: SkillEvent[]) {
    if (events.length === 0) return;
    const nextChainSegments: ChainSegmentVfx[] = [];
    const nextDamageZones: DamageZoneVfx[] = [];
    const replaceDamageZoneIds = new Set<string>();
    const nextHitVfxs: HitVfx[] = [];
    const nextAreaNovas: AreaNova[] = [];
    const nextMeleeArcs: MeleeArcVfx[] = [];
    const nextBolts: FireBolt[] = [];
    const nextTexts: FloatingText[] = [];
    const damageEvents: SkillEvent[] = [];
    const projectedEnemyHp = new Map(enemiesStateRef.current.map((enemy) => [enemy.id, enemy.hp]));
    const projectedEnemyById = new Map(enemiesStateRef.current.map((enemy) => [enemy.id, enemy]));
    const liveProjectileHits = new Set<string>();
    const deadProjectileHits = new Set<string>();
    const acceptedProjectileDamageTicks = new Set<string>();
    const acceptedDamageDisplayKeys = new Set<string>();
    const completedProjectileIds = new Set<string>();

    for (const event of events) {
      if (event.type === "buff_apply") {
        const payload = event.payload ?? {};
        if (Number.isFinite(Number(event.target_entity))) {
          applyEnemyBuffApplyEvent(event);
          continue;
        }
        const buffType = String(payload.buff_type ?? "");
        if (buffType) {
          const duration = Math.max(0.3, event.duration_ms / 1000);
          const skillId = String(payload.skill_id ?? event.skill_instance_id);
          const nextBuff: PlayerBuff = {
            id: nextPlayerBuffId.current++,
            buffType,
            skillId,
            remaining: duration,
            duration,
            remainingAmount: Math.max(0, Number(event.amount ?? payload.absorb_amount ?? 0)),
            absorbPercent: Math.max(0, Number(payload.absorb_percent ?? 0)),
            excludeDamageOverTime: Boolean(payload.exclude_damage_over_time ?? false),
            moveSpeedMultiplier: Number.isFinite(Number(payload.move_speed_multiplier))
              ? Math.max(0, Number(payload.move_speed_multiplier))
              : undefined,
            vfxKey: event.vfx_key
          };
          setRuntimePlayerBuffs([
            ...activePlayerBuffsRef.current.filter((buff) => !(buff.buffType === nextBuff.buffType && buff.skillId === nextBuff.skillId)),
            nextBuff
          ]);
          nextTexts.push({
            id: nextTextId.current++,
            x: playerStateRef.current.x,
            y: playerStateRef.current.y - 52,
            text: buffType === "guard" ? "石肤术" : "增益",
            damageType: "guard",
            ttl: 0.9,
            duration: 0.9
          });
        }
        continue;
      }
      if (event.type === "chain_segment") {
        const payload = event.payload ?? {};
        const start = (payload.start_position ?? event.position) as { x?: number; y?: number };
        const end = (payload.end_position ?? payload.target_world_position ?? event.position) as { x?: number; y?: number };
        const duration = Math.max(0.16, event.duration_ms / 1000);
        nextChainSegments.push({
          id: nextChainSegmentId.current++,
          startX: Number(start.x ?? event.position.x),
          startY: Number(start.y ?? event.position.y),
          endX: Number(end.x ?? event.position.x),
          endY: Number(end.y ?? event.position.y),
          ttl: duration,
          duration,
          hitAtMs: Math.max(0, Math.round(Number(payload.hit_at_ms ?? 0))),
          damageType: event.damage_type,
          vfxKey: event.vfx_key,
          segmentIndex: Number(payload.segment_index ?? 0),
          segmentId: typeof payload.segment_id === "string" ? payload.segment_id : event.event_id,
          skillId: typeof payload.skill_id === "string" ? payload.skill_id : event.skill_instance_id,
          vfxScale: normalizedVfxScale(payload.vfx_scale)
        });
        continue;
      }
      if (event.type === "damage_zone_prime" || event.type === "damage_zone") {
        const payload = event.payload ?? {};
        if (event.type === "damage_zone") applyChannelMovementBuff(event);
        const followedOrbitPosition = typeof payload.orbit_id === "string" ? liveOrbitPosition(payload, event.position) : null;
        const playerAttachedPosition = playerAttachedAreaPosition(event);
        const origin = playerAttachedPosition ?? followedOrbitPosition ?? ((payload.origin_world_position ?? payload.origin ?? event.position) as { x?: number; y?: number });
        const direction = (payload.direction_world ?? payload.facing_direction ?? event.direction) as { x?: number; y?: number };
        const shape = String(payload.shape ?? "circle") === "rectangle" ? "rectangle" : "circle";
        const duration = Math.max(0.18, event.duration_ms / 1000);
        const zoneId = playerAttachedAreaKey(event) ?? (typeof payload.zone_id === "string" ? payload.zone_id : event.event_id);
        const radius = Math.max(1, Number(payload.radius ?? 120));
        if (event.type === "damage_zone") replaceDamageZoneIds.add(zoneId);
        nextDamageZones.push({
          id: nextDamageZoneId.current++,
          x: Number(origin.x ?? event.position.x),
          y: Number(origin.y ?? event.position.y),
          shape,
          radius,
          length: Math.max(1, Number(payload.length ?? 160)),
          width: Math.max(1, Number(payload.width ?? 80)),
          directionX: Number(direction.x ?? event.direction.x),
          directionY: Number(direction.y ?? event.direction.y),
          ttl: duration,
          duration,
          damageType: event.damage_type,
          vfxKey: event.vfx_key,
          zoneId,
          skillId: typeof payload.skill_id === "string" ? payload.skill_id : event.skill_instance_id,
          warning: event.type === "damage_zone_prime",
          followPlayer: Boolean(playerAttachedPosition),
          vfxScale: normalizedVfxScale(payload.vfx_scale),
          tickProgress: 0
        });
        registerActiveDamageZone(
          event,
          zoneId,
          { x: Number(origin.x ?? event.position.x), y: Number(origin.y ?? event.position.y) },
          { x: Number(direction.x ?? event.direction.x), y: Number(direction.y ?? event.direction.y) },
          shape
        );
        continue;
      }
      if (event.type === "orbit_spawn" || event.type === "orbit_tick") {
        const payload = event.payload ?? {};
        const rawPosition = event.type === "orbit_spawn"
          ? liveOrbitCenter(payload, event.position)
          : liveOrbitPosition(payload, event.position);
        const visualDuration = event.type === "orbit_spawn"
          ? Math.max(0.3, Math.min(1.0, event.duration_ms / 1000))
          : 0.18;
        nextHitVfxs.push({
          id: nextHitVfxId.current++,
          x: Number(rawPosition.x ?? event.position.x),
          y: Number(rawPosition.y ?? event.position.y),
          projectileId: typeof payload.orbit_id === "string" ? payload.orbit_id : event.event_id,
          projectileIndex: Number(payload.orb_index ?? 0) + 1,
          projectileCount: Number(payload.orb_count ?? 1),
          impactKind: event.type,
          ttl: visualDuration,
          duration: visualDuration,
          damageType: event.damage_type,
          vfxKey: event.vfx_key,
          skillTemplateId: event.skill_instance_id,
          shapeEffects: shapeEffectsFromUnknown(payload.shape_effects),
          vfxScale: normalizedVfxScale(payload.vfx_scale)
        });
        continue;
      }
      if (event.type === "projectile_impact") {
        const payload = event.payload ?? {};
        const impact = (payload.impact_position ?? event.position) as { x?: number; y?: number };
        nextHitVfxs.push({
          id: nextHitVfxId.current++,
          x: Number(impact.x ?? event.position.x),
          y: Number(impact.y ?? event.position.y),
          targetId: hitVfxTargetId(event),
          projectileId: typeof payload.projectile_id === "string" ? payload.projectile_id : undefined,
          ttl: 0.18,
          duration: 0.18,
          damageType: event.damage_type,
          vfxKey: event.vfx_key,
          skillTemplateId: event.skill_instance_id,
          shapeEffects: shapeEffectsFromUnknown(payload.shape_effects),
          vfxScale: normalizedVfxScale(payload.vfx_scale)
        });
        continue;
      }
      if (event.type === "melee_arc") {
        const payload = event.payload ?? {};
        const origin = (payload.origin_world_position ?? payload.origin ?? event.position) as { x?: number; y?: number };
        const direction = (payload.direction_world ?? payload.facing_direction ?? event.direction) as { x?: number; y?: number };
        const duration = Math.max(0.18, event.duration_ms / 1000);
        nextMeleeArcs.push({
          id: nextMeleeArcId.current++,
          x: Number(origin.x ?? event.position.x),
          y: Number(origin.y ?? event.position.y),
          radius: Math.max(1, Number(payload.arc_radius ?? 160)),
          arcAngle: clamp(Number(payload.arc_angle ?? 70), 1, 180),
          directionX: Number(direction.x ?? event.direction.x),
          directionY: Number(direction.y ?? event.direction.y),
          ttl: duration,
          duration,
          damageType: event.damage_type,
          vfxKey: event.vfx_key,
          arcId: typeof payload.arc_id === "string" ? payload.arc_id : event.event_id,
          skillId: typeof payload.skill_id === "string" ? payload.skill_id : event.skill_instance_id,
          vfxScale: normalizedVfxScale(payload.vfx_scale)
        });
        continue;
      }
      if (event.type === "area_spawn") {
        const payload = event.payload ?? {};
        const center = (payload.center_world_position ?? payload.center ?? event.position) as { x?: number; y?: number };
        const duration = Math.max(0.25, event.duration_ms / 1000);
        nextAreaNovas.push({
          id: nextAreaNovaId.current++,
          x: Number(center.x ?? event.position.x),
          y: Number(center.y ?? event.position.y),
          radius: Math.max(1, Number(payload.radius ?? 120)),
          ringWidth: Math.max(1, Number(payload.ring_width ?? 48)),
          ttl: duration,
          duration,
          damageType: event.damage_type,
          vfxKey: event.vfx_key,
          areaId: typeof payload.area_id === "string" ? payload.area_id : event.event_id,
          skillId: typeof payload.skill_id === "string" ? payload.skill_id : event.skill_instance_id,
          followPlayer: payload.center_policy === "player_center" && event.source_entity === "player",
          vfxScale: normalizedVfxScale(payload.vfx_scale)
        });
        continue;
      }
      if (event.type === "projectile_spawn") {
        const spawnPosition = projectileSpawnPositionForEvent(event);
        const targetPosition = pointFromUnknown(event.payload?.target_world_position);
        const payloadDirection = pointFromUnknown(event.payload?.direction_world);
        const velocityPayload = event.payload?.velocity_world as { x?: number; y?: number } | undefined;
        const velocityLength = Math.hypot(Number(velocityPayload?.x ?? 0), Number(velocityPayload?.y ?? 0));
        const projectileSpeed = Number(event.payload?.projectile_speed ?? velocityLength);
        const directionWorld = velocityLength > 0
          ? normalizedWorldDirection({ x: Number(velocityPayload?.x ?? 0), y: Number(velocityPayload?.y ?? 0) })
          : payloadDirection
            ? normalizedWorldDirection(payloadDirection)
            : normalizedWorldDirection(event.direction);
        const velocityWorld = velocityLength > 0
          ? { x: Number(velocityPayload?.x ?? 0), y: Number(velocityPayload?.y ?? 0) }
          : {
              x: directionWorld.x * projectileSpeed,
              y: directionWorld.y * projectileSpeed
            };
        const payloadEndPosition = event.payload?.expire_world_position ?? event.payload?.end_position;
        const endPosition = targetPosition ?? pointFromUnknown(payloadEndPosition) ?? event.position;
        const lifetimeMs = Number(event.payload?.lifetime_ms ?? event.duration_ms);
        const aliveDuration = Math.max(0.001, lifetimeMs / 1000);
        const runtimeProjectileVfxKind = projectileVfxKind(event.vfx_key) ?? projectileVfxKind(event.skill_instance_id);
        const projectileExitFadeDuration = runtimeProjectileVfxKind === "burning_shot" ? 0 : PROJECTILE_BODY_EXIT_FADE_DURATION;
        nextBolts.push({
          id: nextBoltId.current++,
          x: spawnPosition.x,
          y: spawnPosition.y,
          targetX: endPosition.x,
          targetY: endPosition.y,
          directionX: directionWorld.x,
          directionY: directionWorld.y,
          velocityX: velocityWorld?.x,
          velocityY: velocityWorld?.y,
          projectileId: typeof event.payload?.projectile_id === "string" ? event.payload.projectile_id : event.event_id,
          skillId: typeof event.payload?.skill_id === "string" ? event.payload.skill_id : event.skill_instance_id,
          projectileIndex: Number(event.payload?.projectile_index ?? 1),
          projectileCount: Number(event.payload?.projectile_count ?? 1),
          fanAngle: Number(event.payload?.fan_angle ?? event.payload?.spread_angle_deg ?? 0),
          localSpreadAngle: Number(event.payload?.local_spread_angle ?? 0),
          pierceRemaining: Number(event.payload?.pierce_remaining ?? 0),
          projectileSpeed: Number(event.payload?.projectile_speed ?? Math.hypot(velocityWorld?.x ?? 0, velocityWorld?.y ?? 0)),
          projectileWidth: Number(event.payload?.projectile_width ?? 38),
          projectileHeight: Number(event.payload?.projectile_height ?? 24),
          splitProjectile: Boolean(event.payload?.split_projectile),
          impactRadius: Number(event.payload?.impact_radius ?? 18),
          trajectory: String(event.payload?.trajectory ?? "linear"),
          arcHeight: Number(event.payload?.arc_height ?? 0),
          projectileVisualMode: String(event.payload?.projectile_visual_mode ?? "standard"),
          targetId: Number.isFinite(Number(event.target_entity)) ? Number(event.target_entity) : undefined,
          ttl: aliveDuration + projectileExitFadeDuration,
          duration: aliveDuration,
          fadeDuration: projectileExitFadeDuration,
          skillTemplateId: event.skill_instance_id,
          behaviorType: "projectile",
          damageType: event.damage_type,
          visualEffect: event.vfx_key,
          vfxKey: event.vfx_key,
          shapeEffects: [],
          areaScale: 1,
          vfxScale: normalizedVfxScale(event.payload?.vfx_scale)
        });
        continue;
      }
      if (event.type === "projectile_hit") {
        const projectileId = projectileIdFromEvent(event);
        if (projectileId && event.payload?.projectile_continues === false) {
          completedProjectileIds.add(projectileId);
        }
        const targetId = Number(event.target_entity);
        const hitTargetKey = projectileTargetFollowupKey(event);
        if (hitTargetKey && Number.isFinite(targetId) && (projectedEnemyHp.get(targetId) ?? 0) <= 0) {
          deadProjectileHits.add(hitTargetKey);
        } else if (hitTargetKey) {
          liveProjectileHits.add(hitTargetKey);
        }
        continue;
      }
      if (event.type === "damage") {
        const targetId = Number(event.target_entity);
        const projectileId = projectileIdFromEvent(event);
        const hitTargetKey = projectileTargetFollowupKey(event);
        if (hitTargetKey && deadProjectileHits.has(hitTargetKey)) continue;
        if (Number.isFinite(targetId)) {
          const currentHp = projectedEnemyHp.get(targetId);
          if (currentHp === undefined || currentHp <= 0) continue;
          const enemy = projectedEnemyById.get(targetId);
          const damage = enemy ? damageEventAmountAgainstEnemy(event, enemy) : Number(event.amount ?? 0);
          if (damage <= 0) continue;
          const nextHp = currentHp - damage;
          if (projectileId && isProjectileTickFollowup(event)) {
            acceptedProjectileDamageTicks.add(projectileFollowupKey(event));
          }
          acceptedDamageDisplayKeys.add(damageDisplayKey(event));
          projectedEnemyHp.set(targetId, nextHp);
        }
        damageEvents.push(event);
        continue;
      }
      if (event.type === "status_apply") {
        if (isFrontendPlayerStatusTarget(event)) {
          applyPlayerStatusBuffEvent(event);
          continue;
        }
        const targetId = Number(event.target_entity);
        if (Number.isFinite(targetId) && (projectedEnemyHp.get(targetId) ?? 0) <= 0) continue;
        applyEnemyStatusBuff(event);
        continue;
      }
      if (event.type === "forced_movement") {
        applyForcedMovementEvent(event);
        continue;
      }
      if (event.type === "hit_vfx") {
        const projectileId = projectileIdFromEvent(event);
        if (projectileId && shouldSuppressProjectileFollowup(event, projectedEnemyHp, liveProjectileHits, deadProjectileHits, acceptedProjectileDamageTicks)) continue;
        const eventVfxKind = projectileVfxKind(event.vfx_key) ?? projectileVfxKind(event.skill_instance_id);
        const visualDuration = eventVfxKind === "penetrating_shot" ? PENETRATING_SHOT_IMPACT_DURATION_MS / 1000 : Math.max(0.12, event.duration_ms / 1000);
        const targetEnemy = targetedEnemyForEvent(event, projectedEnemyById);
        const impact = targetEnemy
          ?? pointFromUnknown(event.payload?.hit_world_position)
          ?? pointFromUnknown(event.payload?.impact_world_position)
          ?? pointFromUnknown(event.position)
          ?? event.position;
        nextHitVfxs.push({
          id: nextHitVfxId.current++,
          x: impact.x,
          y: impact.y,
          targetId: hitVfxTargetId(event),
          projectileId: typeof event.payload?.projectile_id === "string" ? event.payload.projectile_id : undefined,
          projectileIndex: Number(event.payload?.projectile_index ?? 1),
          projectileCount: Number(event.payload?.projectile_count ?? 1),
          pierceRemaining: Number(event.payload?.pierce_remaining ?? 0),
          impactKind: typeof event.payload?.impact_kind === "string" ? event.payload.impact_kind : undefined,
          projectileWidth: Number(event.payload?.projectile_width ?? 38),
          projectileHeight: Number(event.payload?.projectile_height ?? 24),
          impactRadius: Number(event.payload?.impact_radius ?? 18),
          ttl: visualDuration,
          duration: visualDuration,
          damageType: event.damage_type,
          vfxKey: event.vfx_key,
          skillTemplateId: event.skill_instance_id,
          shapeEffects: shapeEffectsFromUnknown(event.payload?.shape_effects),
          vfxScale: normalizedVfxScale(event.payload?.vfx_scale)
        });
        continue;
      }
      if (event.type === "floating_text") {
        const projectileId = projectileIdFromEvent(event);
        if (projectileId && shouldSuppressProjectileFollowup(event, projectedEnemyHp, liveProjectileHits, deadProjectileHits, acceptedProjectileDamageTicks)) continue;
        const targetId = Number(event.target_entity);
        const displayKey = damageDisplayKey(event);
        const hasAcceptedDamage = acceptedDamageDisplayKeys.has(displayKey);
        if (Number.isFinite(targetId) && (projectedEnemyHp.get(targetId) ?? 0) <= 0 && !hasAcceptedDamage) continue;
        if (hasAcceptedDamage) acceptedDamageDisplayKeys.delete(displayKey);
        const targetEnemy = targetedEnemyForEvent(event, projectedEnemyById);
        const textPosition = targetEnemy ? { x: targetEnemy.x, y: targetEnemy.y - 28 } : event.position;
        const floatingComponents = floatingTextDamageComponents(event);
        floatingComponents.forEach(([damageType, amount], index) => {
          nextTexts.push({
            id: nextTextId.current++,
            x: textPosition.x + (index - (floatingComponents.length - 1) / 2) * 18,
            y: textPosition.y - index * 14,
            text: damageNumberText(amount),
            damageType,
            ttl: Math.max(0.3, event.duration_ms / 1000),
            duration: Math.max(0.3, event.duration_ms / 1000)
          });
        });
      }
    }

    if (nextChainSegments.length > 0) {
      setChainSegments((items) => capRuntimeVisualBudget([...items, ...nextChainSegments], MAX_RUNTIME_AREA_VFX));
    }
    if (nextDamageZones.length > 0) {
      const uniqueNextDamageZones = uniqueDamageZonesByZoneId(nextDamageZones);
      setDamageZones((items) => capRuntimeVisualBudget(
        [
          ...uniqueDamageZonesByZoneId(items).filter((zone) => !zone.zoneId || !replaceDamageZoneIds.has(zone.zoneId)),
          ...uniqueNextDamageZones
        ],
        MAX_RUNTIME_AREA_VFX
      ));
    }
    if (nextHitVfxs.length > 0) {
      setHitVfxs((items) => capRuntimeVisualBudget([...items, ...nextHitVfxs], MAX_RUNTIME_HIT_VFX));
    }
    if (nextAreaNovas.length > 0) {
      setAreaNovas((items) => capRuntimeVisualBudget([...items, ...nextAreaNovas], MAX_RUNTIME_AREA_VFX));
    }
    if (nextMeleeArcs.length > 0) {
      setMeleeArcs((items) => capRuntimeVisualBudget([...items, ...nextMeleeArcs], MAX_RUNTIME_AREA_VFX));
    }
    if (nextBolts.length > 0) {
      setBolts((items) => capRuntimeVisualBudget([...items, ...nextBolts], MAX_RUNTIME_PROJECTILE_VISUALS));
    }
    if (nextTexts.length > 0) {
      setTexts((items) => capRuntimeVisualBudget([...items, ...nextTexts], MAX_RUNTIME_FLOATING_TEXT));
    }
    if (damageEvents.length > 0) {
      applyDamageEventBatch(damageEvents);
    }
  }

  function applyEnemyBuffApplyEvent(event: SkillEvent) {
    const payload = event.payload ?? {};
    const buffType = String(payload.buff_type ?? payload.effect_type ?? "");
    const effectType = String(payload.effect_type ?? buffType);
    if (!buffType && !effectType) return;
    applyEnemyStatusBuff({
      ...event,
      type: "status_apply",
      payload: {
        ...payload,
        status_type: effectType || buffType,
        buff_type: buffType || effectType,
        polarity: String(payload.polarity ?? "negative"),
        base_value: Number(payload.base_value ?? 0),
        effect_per_stack: Number(payload.effect_per_stack ?? payload.base_value ?? 0)
      }
    });
  }

  function isFrontendPlayerStatusTarget(event: SkillEvent) {
    const targetText = String(event.target_entity ?? event.payload?.target_entity ?? event.payload?.target_type ?? "");
    return targetText === "player" || targetText === "player_1" || targetText.startsWith("player:");
  }

  function applyPlayerStatusBuffEvent(event: SkillEvent) {
    const payload = event.payload ?? {};
    const statusType = normalizeFrontendStatusType(String(payload.status_type ?? payload.buff_type ?? ""));
    if (!statusType) return;
    const preventionReason = frontendPlayerStatusPreventionReason(statusType, event);
    if (preventionReason) {
      setTexts((items) => capRuntimeVisualBudget([
        ...items,
        {
          id: nextTextId.current++,
          x: playerStateRef.current.x,
          y: playerStateRef.current.y - 52,
          text: preventionReason,
          damageType: "guard",
          ttl: 0.75,
          duration: 0.75
        }
      ], MAX_RUNTIME_FLOATING_TEXT));
      return;
    }
    const duration = Math.max(0.1, Number(payload.duration_ms ?? event.duration_ms ?? 0) / 1000);
    const skillId = String(payload.source_skill_id ?? payload.skill_id ?? event.skill_instance_id ?? "monster_status");
    const nextBuff: PlayerBuff = {
      id: nextPlayerBuffId.current++,
      buffType: statusType,
      skillId,
      remaining: duration,
      duration,
      remainingAmount: 0,
      absorbPercent: 0,
      excludeDamageOverTime: false,
      vfxKey: event.vfx_key
    };
    setRuntimePlayerBuffs([
      ...activePlayerBuffsRef.current.filter((buff) => !(buff.buffType === nextBuff.buffType && buff.skillId === nextBuff.skillId)),
      nextBuff
    ]);
  }

  function frontendPlayerStatusPreventionReason(statusType: string, event: SkillEvent) {
    for (const stat of frontendPlayerStatusImmunityStats(statusType)) {
      if (frontendPlayerStatActive(stat)) return "免疫";
    }
    if (frontendElementalAilmentTypes().has(statusType)) {
      if (frontendPlayerStatActive("prevent_elemental_ailments")) return "免疫";
      const avoidPercent = Math.max(0, statNumber(state?.player_stats?.avoid_elemental_ailments_percent, 0));
      if (avoidPercent >= 100) return "避免";
      if (avoidPercent > 0 && stablePercent(`${event.event_id}:${statusType}:player_avoid_ailment`) < avoidPercent) return "避免";
    }
    return "";
  }

  function frontendPlayerStatActive(stat: string) {
    const value = state?.player_stats?.[stat]?.value;
    return value === true || (typeof value === "number" && value > 0);
  }

  function applyEnemyStatusBuff(event: SkillEvent) {
    const targetId = Number(event.target_entity);
    if (!Number.isFinite(targetId)) return;
    const payload = event.payload ?? {};
    const statusType = String(payload.status_type ?? "");
    if (!statusType) return;
    const duration = Math.max(0.1, Number(payload.duration_ms ?? event.duration_ms ?? 0) / 1000);
    const valuePercent = Math.max(0, Number(payload.effect_per_stack ?? payload.base_value ?? 0));
    const baseValue = Math.max(0, Number(payload.base_value ?? 0));
    const sourceSkillId = String(payload.source_skill_id ?? payload.skill_id ?? event.skill_instance_id);
    const statusDamageAddPercent =
      Number(payload.dot_damage_add_percent ?? 0)
      + Number(payload.ailment_damage_add_percent ?? 0)
      + Number(payload.ailment_damage_deepen_percent ?? 0);
    const baseDamagePerSecond = Math.max(0, Number(payload.base_damage_per_second ?? 0))
      * Math.max(0, 1 + statusDamageAddPercent / 100)
      * (1 + Math.max(0, Number(payload.damage_over_time_more_percent ?? 0)) / 100);
    const nextBuff: EnemyBuff = {
      buffType: statusType,
      statusType,
      polarity: "negative",
      remaining: duration,
      duration,
      valuePercent,
      baseValue,
      baseDamagePerSecond,
      damageType: event.damage_type,
      nextFloatingTextIn: DOT_FLOATING_TEXT_INTERVAL_SECONDS,
      sourceSkillId
    };
    const next = enemiesStateRef.current.map((enemy) => {
      if (enemy.id !== targetId || enemy.hp <= 0) return enemy;
      const existing = (enemy.activeBuffs ?? []).find((buff) => buff.statusType === nextBuff.statusType && buff.sourceSkillId === nextBuff.sourceSkillId);
      const mergedBuff = existing
        ? {
            ...nextBuff,
            remaining: Math.max(existing.remaining, nextBuff.remaining),
            baseValue: (existing.baseValue ?? 0) + (nextBuff.baseValue ?? 0),
            baseDamagePerSecond: Math.max(existing.baseDamagePerSecond ?? 0, nextBuff.baseDamagePerSecond ?? 0)
          }
        : nextBuff;
      const activeBuffs = [
        ...(enemy.activeBuffs ?? []).filter((buff) => !(buff.statusType === nextBuff.statusType && buff.sourceSkillId === nextBuff.sourceSkillId)),
        mergedBuff
      ];
      return { ...enemy, activeBuffs };
    });
    enemiesStateRef.current = next;
    setEnemies(next);
  }

  function applyForcedMovementEvent(event: SkillEvent) {
    const rawTargetEntity = String(event.target_entity ?? "").trim();
    const targetId = rawTargetEntity === "" ? Number.NaN : Number(rawTargetEntity);
    const payload = event.payload ?? {};
    const fallbackDestination = pointFromUnknown(payload.destination_world_position) ?? pointFromUnknown(event.position);
    const origin = pointFromUnknown(payload.origin_world_position) ?? pointFromUnknown(payload.origin);
    const movementPolicy = String(payload.movement_policy ?? "");
    const movementScope = String(payload.movement_scope ?? "");
    const movementDistance = Math.max(0, Number(payload.movement_distance ?? event.amount ?? 0));
    if (!Number.isFinite(targetId) && !(movementPolicy === "pull_to_origin" && movementScope === "damage_zone" && origin && movementDistance > 0)) return;
    setEnemies((current) => {
      const next = current.map((enemy) => {
        if (enemy.hp <= 0) return enemy;
        if (Number.isFinite(targetId) && enemy.id !== targetId) return enemy;
        let destination = fallbackDestination;
        if (movementPolicy === "pull_to_origin" && origin && movementDistance > 0) {
          const dx = origin.x - enemy.x;
          const dy = origin.y - enemy.y;
          const length = Math.hypot(dx, dy);
          const radius = Math.max(0, Number(payload.radius ?? 0));
          if (!Number.isFinite(targetId) && (radius <= 0 || length > radius)) return enemy;
          if (length > 0) {
            const distance = Math.min(movementDistance, length);
            destination = {
              x: enemy.x + dx / length * distance,
              y: enemy.y + dy / length * distance
            };
          } else {
            destination = origin;
          }
        }
        if (!destination) return enemy;
        return { ...enemy, x: destination.x, y: destination.y, velocityX: 0, velocityY: 0 };
      });
      enemiesStateRef.current = next;
      return next;
    });
  }

  function mergeBackendInventoryState(nextState: AppState) {
    applyFrontendState((current) => ({
      ...current,
      inventory: nextState.inventory,
      board: nextState.board,
      skill_preview: nextState.skill_preview,
      skill_error: nextState.skill_error,
      logs: nextState.logs,
      player_stats: nextState.player_stats,
      character_panel: nextState.character_panel,
      equipment_slots: nextState.equipment_slots,
      ui_text: nextState.ui_text ?? current.ui_text
    }));
    if (nextState.equipment_slots) setEquipmentSlots(normalizeEquipmentSlots(nextState.equipment_slots));
  }

  function applyDamageEventBatch(events: SkillEvent[]) {
    const damageByTarget = new Map<number, number>();
    const enemyById = new Map(enemiesStateRef.current.map((enemy) => [enemy.id, enemy]));
    const remainingHp = new Map(enemiesStateRef.current.map((enemy) => [enemy.id, enemy.hp]));
    const killedTriggers: { event: SkillEvent; enemy: Enemy }[] = [];
    for (const event of events) {
      const targetId = Number(event.target_entity);
      if (!Number.isFinite(targetId)) continue;
      const enemy = enemyById.get(targetId);
      const damage = enemy ? damageEventAmountAgainstEnemy(event, enemy) : Number(event.amount ?? 0);
      damageByTarget.set(targetId, (damageByTarget.get(targetId) ?? 0) + damage);
      if (!enemy || damage <= 0) continue;
      if (enemy.boss || enemy.spawnRarity === "rare") gainWarIntentPoint();
      const before = remainingHp.get(targetId) ?? enemy.hp;
      let after = before - damage;
      const cullThresholdPercent = Math.max(0, Number(event.payload?.cull_threshold_percent ?? 0));
      if (cullThresholdPercent > 0 && enemy.maxHp > 0 && after > 0 && after / enemy.maxHp * 100 <= cullThresholdPercent) {
        after = 0;
      }
      if (before > 0 && after <= 0) {
        killedTriggers.push({ event, enemy });
      }
      remainingHp.set(targetId, after);
    }
    if (damageByTarget.size === 0) return;
    setRuntimePlayer((current) => recoverFrontendPlayerOnHit(current));
    const liveEnemiesAfterDamage = enemiesStateRef.current
      .map((enemy) => {
        const hp = remainingHp.get(enemy.id) ?? enemy.hp;
        return { ...enemy, hp, lastDamagedAt: hp < enemy.hp ? elapsedRef.current : enemy.lastDamagedAt };
      })
      .filter((enemy) => shouldRetainEnemyForGameplayOrDamageFlash(enemy, elapsedRef.current));
    let killed = 0;
    const killedEnemies: Enemy[] = [];
    for (const enemy of enemiesStateRef.current) {
      const before = enemy.hp;
      const after = remainingHp.get(enemy.id) ?? before;
      if (before > 0 && after <= 0) {
        killed += 1;
        killedEnemies.push(enemy);
        gainWarIntentPoint();
      }
    }
    const onKillEvents: SkillEvent[] = [];
    for (const trigger of killedTriggers) {
      const event = trigger.event;
      const payload = event.payload ?? {};
      const chromaticChance = Number(payload.on_kill_explosion_chance_percent ?? 0);
      const chromaticRadius = Number(payload.on_kill_explosion_radius ?? 0);
      const chromaticPercent = Number(payload.on_kill_explosion_max_life_percent ?? 0);
      if (chromaticChance > 0 && chromaticRadius > 0 && chromaticPercent > 0) {
        const roll = stablePercent(`${event.event_id}:on_kill_explosion`);
        if (roll <= chromaticChance) {
          const amount = trigger.enemy.maxHp * chromaticPercent / 100;
          const targets = frontendUniqueTargetsByDistance(enemiesStateRef.current, trigger.enemy, chromaticRadius, 8);
          onKillEvents.push(frontendSkillEvent({
            active_gem_instance_id: event.skill_instance_id,
            name_text: String(payload.skill_name ?? "五彩魔矢"),
            skill_template_id: String(payload.skill_id ?? event.skill_instance_id),
            template_text: String(payload.skill_name ?? "五彩魔矢"),
            damage_type: "true",
            behavior_type: "damage_zone",
            visual_effect: event.vfx_key,
            shape_effects: [],
            final_damage: amount,
            final_cooldown_ms: 0,
            projectile_count: 1,
            area_multiplier: 1,
            speed_multiplier: 1,
            applied_modifiers: []
          }, "damage_zone", null, { x: trigger.enemy.x, y: trigger.enemy.y }, event.direction, amount, "true", {
            secondary_hit_id: "on_kill_explosion",
            radius: chromaticRadius,
            hit_target_count: targets.length,
            trigger_event_type: "unit_killed"
          }, 240));
          for (const target of targets) {
            if (target.id === trigger.enemy.id) continue;
            onKillEvents.push({
              ...event,
              event_id: `${event.event_id}.on_kill.${target.id}`,
              type: "damage",
              target_entity: String(target.id),
              position: { x: target.x, y: target.y },
              amount,
              damage_type: "true",
              payload: {
                ...payload,
                secondary_hit_id: "on_kill_explosion",
                damage_components: { true: amount },
                trigger_event_type: "unit_killed"
              }
            });
            onKillEvents.push({
              ...event,
              event_id: `${event.event_id}.on_kill_text.${target.id}`,
              type: "floating_text",
              target_entity: String(target.id),
              position: { x: target.x, y: target.y - 28 },
              amount,
              damage_type: "true",
              duration_ms: 800,
              payload: {
                ...payload,
                secondary_hit_id: "on_kill_explosion",
                damage_components: { true: amount },
                trigger_event_type: "unit_killed"
              }
            });
          }
        }
      }
      const recastChance = Number(payload.on_kill_recast_chance_percent ?? 0);
      const areaId = typeof payload.area_id === "string" ? payload.area_id : "";
      if (recastChance > 0 && areaId) {
        const maxRecasts = Math.max(1, Number(payload.on_kill_recast_max_per_area ?? 1));
        const currentCount = onKillRecastCounts.current.get(areaId) ?? 0;
        if (currentCount < maxRecasts && stablePercent(`${event.event_id}:on_kill_recast:${currentCount + 1}`) <= recastChance) {
          onKillRecastCounts.current.set(areaId, currentCount + 1);
          const radius = Number(payload.radius ?? 118);
          const targets = frontendUniqueTargetsByDistance(enemiesStateRef.current, trigger.enemy, radius, 8, new Set([trigger.enemy.id]));
          onKillEvents.push({
            ...event,
            event_id: `${event.event_id}.recast_area`,
            type: "area_spawn",
            target_entity: "",
            position: { x: trigger.enemy.x, y: trigger.enemy.y },
            amount: null,
            payload: {
              ...payload,
              area_id: `${areaId}.recast.${currentCount + 1}`,
              center_world_position: { x: trigger.enemy.x, y: trigger.enemy.y },
              trigger_event_type: "unit_killed"
            }
          });
          for (const target of targets) {
            onKillEvents.push({
              ...event,
              event_id: `${event.event_id}.recast_damage.${target.id}`,
              target_entity: String(target.id),
              position: { x: target.x, y: target.y },
              payload: {
                ...payload,
                area_id: `${areaId}.recast.${currentCount + 1}`,
                damage_components: { [event.damage_type]: Number(event.amount ?? 0) },
                trigger_event_type: "unit_killed"
              }
            });
          }
        }
      }
    }
    enemiesStateRef.current = liveEnemiesAfterDamage;
    setEnemies(liveEnemiesAfterDamage);
    if (killed > 0) {
      const skillName = events.find((event) => typeof event.payload?.skill_name === "string")?.payload?.skill_name ?? "技能";
      setKills((value) => value + killed);
      spawnFrontendDrops(killedEnemies);
      setCombatLogs((logs) => [`${skillName} 击杀 ${killed} 个怪物。`, ...logs].slice(0, 8));
    }
    if (onKillEvents.length > 0) consumeSkillEventBatch(onKillEvents);
  }

async function placeFloatingItem(current: FloatingGem, target: DropTarget, event: globalThis.MouseEvent): Promise<PlacementResult> {
    if (target.kind === "invalid") return { type: "reject" };
    if (isDropBackToOrigin(current, target, state, inventorySlots, equipmentSlots)) return { type: "place" };
    if (target.kind === "bag") return await placeItemInBag(current, target.slotIndex);
    if (target.kind === "equipment") return await placeItemInEquipmentSlot(current, target.slotIndex, event);
    return await placeItemOnBoard(current, target.row, target.column, event);
  }

  async function placeItemInBag(current: FloatingGem, slotIndex: number): Promise<PlacementResult> {
    if (!state) return { type: "reject" };
    const instanceId = current.gem.instance_id;
    const dragged = inventoryItemById(state, instanceId);
    if (!dragged) {
      setNotice("没有找到这颗宝石。");
      return { type: "reject" };
    }
    const targetItem = inventoryItemById(state, inventorySlots[slotIndex]);
    const previousState = state;
    const previousInventorySlots = inventorySlots;
    const previousEquipmentSlots = equipmentSlots;
    setEquipmentSlots((slots) => removeItemsFromEquipmentSlots(slots, [instanceId]));
    setInventorySlots((slots) => moveItemToInventorySlot(slots, instanceId, slotIndex));
    if (!dragged.board_position) {
      if (equipmentSlots.includes(instanceId)) {
        applyFrontendState((currentState) => ({
          ...currentState,
          equipment_slots: removeItemsFromEquipmentSlots(normalizeEquipmentSlots(currentState.equipment_slots), [instanceId]),
        }));
      }
      return targetItem ? { type: "swap", nextFloatingItem: targetItem, origin: { kind: "bag", slotIndex, instanceId: targetItem.instance_id } } : { type: "place" };
    }

    applyFrontendState((currentState) => optimisticUnmountBoardItem(currentState, instanceId));
    setNotice(`已取下${dragged.name_text}。`);
    return targetItem ? { type: "swap", nextFloatingItem: targetItem, origin: { kind: "bag", slotIndex, instanceId: targetItem.instance_id } } : { type: "place" };
  }

  async function placeItemInEquipmentSlot(current: FloatingGem, slotIndex: number, event: globalThis.MouseEvent): Promise<PlacementResult> {
    if (!state) return { type: "reject" };
    const slot = EQUIPMENT_SLOT_SPECS[slotIndex];
    if (!slot) return { type: "reject" };
    const instanceId = current.gem.instance_id;
    const dragged = current.gem;
    if (dragged.board_position) {
      showPlacementPrompt("宝石盘上的宝石不能放入装备栏。", event.clientX, event.clientY);
      return { type: "reject" };
    }
    if (!canPlaceItemInEquipmentSlot(dragged, slot)) {
      showPlacementPrompt(`只能放入${slot.label}装备。`, event.clientX, event.clientY);
      return { type: "reject" };
    }

    const targetIndices = equipmentTargetSlotIndices(dragged, slotIndex);
    const displacedIds = uniqueEquipmentSlotIds(equipmentSlots, targetIndices).filter((id) => id !== instanceId);
    const targetItem = inventoryItemById(state, displacedIds[0]);
    if (isTwoHandedWeapon(dragged) && displacedIds.length > 0 && !(displacedIds.length === 1 && targetItem && isTwoHandedWeapon(targetItem))) {
      showPlacementPrompt("双手武器需要空出主武器和副武器。", event.clientX, event.clientY);
      return { type: "reject" };
    }
    const targetOriginIndex = targetItem ? equipmentSlots.findIndex((id) => id === targetItem.instance_id) : slotIndex;
    const targetOriginSlot = EQUIPMENT_SLOT_SPECS[targetOriginIndex >= 0 ? targetOriginIndex : slotIndex] ?? slot;
    const previousState = state;
    const previousInventorySlots = inventorySlots;
    const previousEquipmentSlots = equipmentSlots;
    setEquipmentSlots((slots) => moveItemToEquipmentSlot(removeItemsFromEquipmentSlots(slots, displacedIds), instanceId, targetIndices));
    setInventorySlots((slots) => removeItemsFromInventorySlots(slots, [instanceId, targetItem?.instance_id ?? ""]));
    applyFrontendState((currentState) => ({
      ...currentState,
      equipment_slots: moveItemToEquipmentSlot(
        removeItemsFromEquipmentSlots(normalizeEquipmentSlots(currentState.equipment_slots), displacedIds),
        instanceId,
        targetIndices
      ),
    }));
    setNotice(`已将${dragged.name_text}放入${slot.label}。`);
    return targetItem
      ? { type: "swap", nextFloatingItem: targetItem, origin: { kind: "equipment", slotIndex: targetOriginIndex, slotId: targetOriginSlot.id, instanceId: targetItem.instance_id } }
      : { type: "place" };
  }

  async function placeItemOnBoard(current: FloatingGem, row: number, column: number, event: globalThis.MouseEvent): Promise<PlacementResult> {
    if (!state) return { type: "reject" };
    const instanceId = current.gem.instance_id;
    if (!isGemItem(current.gem)) {
      showPlacementPrompt(state.ui_text?.only_gems_on_board ?? "", event.clientX, event.clientY);
      return { type: "reject", reason: "only_gems_on_board" };
    }
    const target = state.board.cells[row]?.[column]?.gem;
    const targetItem = inventoryItemById(state, target?.instance_id);
    const dragged = inventoryItemById(state, instanceId);
    if (!dragged) {
      setNotice("没有找到这颗宝石。");
      return { type: "reject" };
    }
    if (dragged.board_position?.row === row && dragged.board_position.column === column) return { type: "place" };
    if (!canPlaceGemOnBoard(state, dragged, row, column, new Set([instanceId, targetItem?.instance_id ?? ""]))) return { type: "reject" };

    const previousState = state;
    const previousInventorySlots = inventorySlots;
    const previousEquipmentSlots = equipmentSlots;
    applyFrontendState((currentState) => optimisticPlaceItemOnBoard(currentState, instanceId, row, column, targetItem?.instance_id));
    setInventorySlots((slots) => removeItemsFromInventorySlots(slots, [instanceId, targetItem?.instance_id ?? ""]));
    setNotice(`已将${dragged.name_text}放入第${row + 1}行第${column + 1}列。`);
    return targetItem ? { type: "swap", nextFloatingItem: targetItem, origin: { kind: "board", row, column } } : { type: "place" };
  }

  async function dropGemOnCell(instanceId: string, row: number, column: number): Promise<boolean> {
    const item = state ? inventoryItemById(state, instanceId) : null;
    if (!item) return false;
    const result = await placeItemOnBoard(
      { gem: item, origin: { kind: "board", row, column }, x: 0, y: 0, offsetX: FLOATING_GEM_OFFSET.x, offsetY: FLOATING_GEM_OFFSET.y },
      row,
      column,
      { clientX: 0, clientY: 0 } as globalThis.MouseEvent
    );
    return result.type !== "reject";
  }

  function clearFloatingGem() {
    floatingGemRef.current = null;
    setFloatingGem(null);
  }

  function clearDragHoverState() {
    setHoveredBoardCell(null);
    setHoveredBagSlot(null);
    setHoveredEquipmentSlot(null);
    setHoveredGemId(null);
    setTooltip(null);
  }

  function setFloatingItem(item: Gem, origin: FloatingOrigin, x: number, y: number, offsetX = FLOATING_GEM_OFFSET.x, offsetY = FLOATING_GEM_OFFSET.y) {
    const nextFloatingGem: FloatingGem = {
      gem: item,
      origin,
      x: x + offsetX,
      y: y + offsetY,
      offsetX,
      offsetY
    };
    floatingGemRef.current = nextFloatingGem;
    setFloatingGem(nextFloatingGem);
  }

  function showPlacementPrompt(text: string, x: number, y: number) {
    const id = nextPromptId.current++;
    setPlacementPrompt({ id, text, x, y });
    window.setTimeout(() => {
      setPlacementPrompt((current) => (current?.id === id ? null : current));
    }, 900);
  }

  async function unmountGem(instanceId: string) {
    const gem = state?.inventory.find((item) => item.instance_id === instanceId);
    applyFrontendState((currentState) => optimisticUnmountBoardItem(currentState, instanceId));
    setNotice(gem ? `已取下${gem.name_text}。` : "宝石已下盘。");
  }

  function syncDropDisplayPositions(nextState: AppState) {
    const nextPositions = new Map(dropDisplayPositions.current);
    nextState.drops.forEach((drop, index) => {
      if (!drop.position || drop.picked_up) {
        nextPositions.delete(drop.drop_id);
        return;
      }
      if (nextPositions.has(drop.drop_id)) return;
      nextPositions.set(drop.drop_id, {
        x: drop.position.x + (index % 3) * 22,
        y: drop.position.y + Math.floor(index / 3) * 28
      });
    });
    dropDisplayPositions.current = nextPositions;
  }

  function selectedFrontendMapStage(stageIdOverride?: string, sourceState = state) {
    const stages = sourceState?.map_progression?.stages ?? [];
    return stages.find((stage) => stage.id === stageIdOverride)
      ?? stages.find((stage) => stage.selected)
      ?? stages.find((stage) => stage.enterable)
      ?? null;
  }

  function frontendDropRoll(enemy: Enemy, salt: number) {
    const raw = Math.sin(enemy.id * 12.9898 + salt * 78.233 + Math.floor(elapsedRef.current * 10) * 37.719) * 43758.5453;
    return raw - Math.floor(raw);
  }

  function frontendMonsterDropChance(stage: MapProgressionStageView, enemy: Enemy) {
    const baseChance = clamp(stage.base_drop_chance, 0, 0.6);
    const rarityMultiplier: Record<string, number> = {
      normal: 1,
      magic: 1.8,
      rare: 3.2,
      boss: 6,
      legendary: 6
    };
    const rarity = enemy.boss ? "boss" : String(enemy.spawnRarity ?? "normal");
    return clamp(baseChance * (rarityMultiplier[rarity] ?? 1), 0, enemy.boss ? 0.9 : 0.65);
  }

  function frontendRandomMapLevel(stage: MapProgressionStageView, enemy: Enemy, salt: number) {
    const minLevel = Math.max(1, Math.round(Math.min(stage.map_level_min, stage.map_level_max)));
    const maxLevel = Math.max(minLevel, Math.round(Math.max(stage.map_level_min, stage.map_level_max)));
    return Math.floor(minLevel + frontendDropRoll(enemy, salt) * (maxLevel - minLevel + 1));
  }

  function frontendEquipmentDropRarity(stage: MapProgressionStageView, enemy: Enemy, roll: number) {
    if (enemy.boss) return "purple";
    const weights = stage.equipment_rarity_weights ?? { white: 700, blue: 250, purple: 50, pink: 0 };
    const white = Math.max(0, Number(weights.white ?? 0));
    const blue = Math.max(0, Number(weights.blue ?? 0));
    const purple = Math.max(0, Number(weights.purple ?? 0));
    const pink = Math.max(0, Number(weights.pink ?? 0));
    const total = white + blue + purple + pink;
    if (total <= 0) return "white";
    const cursor = roll * total;
    if (cursor < white) return "white";
    if (cursor < white + blue) return "blue";
    if (cursor < white + blue + purple) return "purple";
    return "pink";
  }

  function frontendMapEntryTargetStage(stage: MapProgressionStageView, stages: MapProgressionStageView[], enemy: Enemy, salt: number) {
    const candidates = [
      ...(stage.order > 1 ? [stage] : []),
      ...stages.filter((candidate) => candidate.order === stage.order + 1 && candidate.id !== stage.id)
    ];
    if (candidates.length === 0) return null;
    return candidates[Math.floor(frontendDropRoll(enemy, salt) * candidates.length) % candidates.length];
  }

  function frontendGemDropWeight(gem: GmGemOption) {
    let weight = 1;
    if (Number(gem.sudoku_digit) === 9) return weight * 0.35;
    if (gem.kind === "active_skill") return weight * 0.35;
    return weight;
  }

  function chooseFrontendGemDropOption(gems: GmGemOption[], enemy: Enemy, salt: number) {
    if (gems.length === 0) return null;
    const weighted = gems.map((gem) => ({ gem, weight: frontendGemDropWeight(gem) }));
    const total = weighted.reduce((sum, item) => sum + item.weight, 0);
    if (total <= 0) return gems[Math.floor(frontendDropRoll(enemy, salt) * gems.length) % gems.length];
    let cursor = frontendDropRoll(enemy, salt) * total;
    for (const item of weighted) {
      cursor -= item.weight;
      if (cursor <= 0) return item.gem;
    }
    return weighted[weighted.length - 1]?.gem ?? null;
  }

  function createFrontendDrop(enemy: Enemy, stage: MapProgressionStageView, index: number): DropPrompt | null {
    const dropChance = frontendMonsterDropChance(stage, enemy);
    if (frontendDropRoll(enemy, index) > dropChance) return null;
    const stages = state?.map_progression?.stages ?? [];
    const mapEntryStage = frontendMapEntryTargetStage(stage, stages, enemy, index + 109);
    const kindRoll = frontendDropRoll(enemy, index + 17);
    const gemDropThreshold = 1 - FRONTEND_GEM_DROP_KIND_CHANCE;
    const level = Math.round(clamp(stage.gem_level_min + frontendDropRoll(enemy, index + 29) * (stage.gem_level_max - stage.gem_level_min), stage.gem_level_min, stage.gem_level_max));
    const equipmentLevel = frontendRandomMapLevel(stage, enemy, index + 83);
    let lootKind: DropPrompt["loot_kind"] = "equipment";
    let nameText = `Lv${equipmentLevel} 装备`;
    let equipmentRarity = frontendEquipmentDropRarity(stage, enemy, frontendDropRoll(enemy, index + 97));
    let rarityText = frontendEquipmentRarityText(equipmentRarity);
    let targetStageId: string | undefined;
    let baseGemInstanceId: string | undefined;
    let equipmentSource = chooseFrontendEquipmentSource(Math.floor(frontendDropRoll(enemy, index + 53) * 1000000000));
    let equipmentAffixes: FrontendEquipmentAffixRoll[] | undefined;
    let equipmentStatModifiers: FrontendEquipmentStatModifier[] | undefined;
    let statusText = "点击拾取";
    if (kindRoll >= FRONTEND_EQUIPMENT_DROP_KIND_CHANCE
      && kindRoll < gemDropThreshold
      && mapEntryStage) {
      lootKind = "map_entry";
      nameText = `${mapEntryStage.display_name} 门票`;
      rarityText = "地图";
      targetStageId = mapEntryStage.id;
    } else if (kindRoll >= gemDropThreshold
      || (kindRoll >= FRONTEND_EQUIPMENT_DROP_KIND_CHANCE && !mapEntryStage)) {
      lootKind = "gem";
      const gemOptions = gmOptions?.gems ?? [];
      const gemOption = chooseFrontendGemDropOption(gemOptions, enemy, index + 41);
      baseGemInstanceId = gemOption?.id ?? state?.inventory.find((item) => item.item_kind !== "equipment")?.instance_id;
      nameText = gemOption ? `Lv${level} ${gemOption.name_text}` : `Lv${level} 技能宝石`;
      rarityText = "宝石";
    } else {
      const seed = enemy.id * 1000003 + index * 9176 + Math.floor(frontendDropRoll(enemy, index + 71) * 1000000);
      const generated = generateFrontendEquipment(equipmentSource, equipmentLevel, equipmentRarity, seed);
      equipmentAffixes = [generated.base_affix, ...generated.prefix_affixes, ...generated.suffix_affixes];
      equipmentStatModifiers = frontendEquipmentStatModifiers(generated);
      const affixTexts = frontendEquipmentAffixTexts(generated);
      nameText = `Lv${equipmentLevel} ${generated.source}`;
      rarityText = frontendEquipmentRarityText(generated.rarity);
      equipmentRarity = generated.rarity;
      equipmentSource = generated.source;
      statusText = affixTexts.join("、");
    }
    return {
      drop_id: `frontend_drop_${frontendDropId.current++}`,
      loot_kind: lootKind,
      name_text: nameText,
      rarity_text: rarityText,
      picked_up: false,
      status_text: statusText,
      position: { x: enemy.x, y: enemy.y },
      level: lootKind === "equipment" ? equipmentLevel : level,
      equipment_source: equipmentSource,
      equipment_rarity: equipmentRarity,
      equipment_affixes: equipmentAffixes,
      equipment_stat_modifiers: equipmentStatModifiers,
      base_gem_instance_id: baseGemInstanceId,
      target_stage_id: targetStageId
    };
  }

  function spawnFrontendDrops(killedEnemies: Enemy[]) {
    const stage = selectedFrontendMapStage();
    if (!stage || killedEnemies.length === 0) return;
    const drops = killedEnemies
      .map((enemy, index) => createFrontendDrop(enemy, stage, index))
      .filter((drop): drop is DropPrompt => Boolean(drop));
    if (drops.length === 0) return;
    drops.forEach((drop, index) => {
      const position = drop.position ?? { x: playerStateRef.current.x, y: playerStateRef.current.y };
      dropDisplayPositions.current.set(drop.drop_id, {
        x: position.x + (index % 3) * 22,
        y: position.y + Math.floor(index / 3) * 28
      });
      knownDropIds.current.add(drop.drop_id);
    });
    applyFrontendState((current) => ({ ...current, drops: [...current.drops, ...drops] }));
    setNotice(`掉落：${drops.map((drop) => drop.name_text).join("、")}。`);
  }

  function createFrontendInventoryItem(drop: DropPrompt, current: AppState): Gem {
    const id = `frontend_item_${frontendItemId.current++}`;
    if (drop.loot_kind === "gem") {
      const seedInventory = FRONTEND_INITIAL_APP_STATE.inventory as Gem[];
      const template = current.inventory.find((item) => item.instance_id === drop.base_gem_instance_id)
        ?? seedInventory.find((item) => item.instance_id === drop.base_gem_instance_id)
        ?? (FRONTEND_GEM_DROP_POOL as readonly Gem[]).find((item) => item.base_gem_id === drop.base_gem_instance_id || item.instance_id === drop.base_gem_instance_id)
        ?? current.inventory.find((item) => item.item_kind !== "equipment")
        ?? seedInventory.find((item) => item.item_kind !== "equipment");
      if (template) {
        return {
          ...template,
          instance_id: id,
          name_text: drop.name_text,
          rarity_text: drop.rarity_text || template.rarity_text,
          board_position: null,
          level: drop.level ?? template.level
        };
      }
    }
    if (drop.loot_kind === "equipment") {
      const rarityText = drop.rarity_text || "普通";
      const sourceText = gmOptions?.equipment_sources.find((source) => source.id === drop.equipment_source)?.name_text
        ?? drop.equipment_source
        ?? "装备";
      const bonusLines = drop.equipment_affixes?.map((affix) => {
        if (affix.library === "base") return affix.effect;
        const prefix = affix.library === "initial" ? "初阶" : affix.library === "advanced" ? "进阶" : affix.library === "pinnacle" ? "至臻" : affix.library;
        const side = affix.gen === "prefix" ? "前缀" : affix.gen === "suffix" ? "后缀" : affix.gen;
        return `${prefix}${side} T${affix.tier}：${affix.effect}`;
      }) ?? (drop.status_text && drop.status_text !== "点击拾取" && drop.status_text !== "GM 添加"
        ? drop.status_text.split(/[、；]/).map((line) => line.trim()).filter(Boolean)
        : []);
      const descriptionText = `${rarityText}${sourceText}。等级 ${drop.level ?? 1}。`;
      const tags = [
        { id: "equipment", text: "装备", tone: "category" },
        { id: drop.equipment_source ?? "equipment", text: sourceText, tone: "type" },
        { id: String(drop.equipment_rarity ?? "rarity"), text: rarityText }
      ];
      return {
        instance_id: id,
        item_kind: "equipment",
        name_text: drop.name_text,
        description_text: bonusLines.length > 0 ? `${descriptionText} ${bonusLines.join("；")}` : descriptionText,
        category_text: sourceText,
        rarity_text: rarityText,
        gem_kind: "",
        gem_type: { id: drop.equipment_source ?? "equipment", display_text: sourceText, identity_text: drop.equipment_source ?? "equipment" },
        tags,
        current_effective_targets: [],
        board_position: null,
        level: drop.level,
        tooltip_view: createFrontendItemTooltipView({
          nameText: drop.name_text,
          rarityText,
          categoryText: sourceText,
          identityText: `${sourceText} / ${rarityText}`,
          descriptionText,
          iconText: sourceText.slice(0, 1),
          iconColorKey: drop.equipment_rarity === "blue" ? "blue" : drop.equipment_rarity === "purple" ? "orange" : "white",
          tags,
          statLines: [
            { label_text: "等级", value_text: String(drop.level ?? 1) },
            { label_text: "来源", value_text: sourceText }
          ],
          bonusLines
        }),
        equipment_affixes: drop.equipment_affixes,
        equipment_stat_modifiers: drop.equipment_stat_modifiers ?? []
      };
    }
    const rarityText = drop.rarity_text || "普通";
    const descriptionText = `${rarityText}掉落物。`;
    return {
      instance_id: id,
      item_kind: "ordinary",
      name_text: drop.name_text,
      description_text: descriptionText,
      category_text: "地图门票",
      rarity_text: rarityText,
      gem_kind: "",
      gem_type: { display_text: "地图门票", identity_text: String(drop.loot_kind ?? "loot") },
      tags: [{ id: "drop", text: "掉落" }],
      current_effective_targets: [],
      board_position: null,
      level: drop.level,
      tooltip_view: createFrontendItemTooltipView({
        nameText: drop.name_text,
        rarityText,
        categoryText: "地图门票",
        identityText: "地图门票",
        descriptionText,
        iconText: "图",
        iconColorKey: "cyan",
        tags: [{ id: "drop", text: "掉落", tone: "category" }],
        statLines: drop.target_stage_id ? [{ label_text: "解锁地图", value_text: drop.target_stage_id }] : []
      })
    };
  }

  function applyFrontendPickup(dropId: string, current: AppState) {
    const target = current.drops.find((drop) => drop.drop_id === dropId);
    if (!target || target.picked_up) return null;
    const nextDrops = current.drops.map((drop) => (
      drop.drop_id === dropId ? { ...drop, picked_up: true, status_text: "已拾取" } : drop
    ));
    if (target.loot_kind === "map_entry" && target.target_stage_id && current.map_progression) {
      return {
        ...current,
        drops: nextDrops,
        map_progression: {
          ...current.map_progression,
          stages: current.map_progression.stages.map((stage) => (
            stage.id === target.target_stage_id
              ? { ...stage, unlocked: true, enterable: true, entry_count: stage.entry_count + 1 }
              : stage
          ))
        }
      };
    }
    return {
      ...current,
      drops: nextDrops,
      inventory: [...current.inventory, createFrontendInventoryItem(target, current)]
    };
  }

  function beginDropPickup(drop: DropPrompt) {
    if (!drop.position || drop.picked_up) return;
    const target = dropDisplayPositions.current.get(drop.drop_id) ?? drop.position;
    pendingDropPickup.current = { dropId: drop.drop_id, x: target.x, y: target.y };
    setNotice(`正在前往拾取：${drop.name_text}`);
  }

  function finishDropPickup(dropId: string) {
    if (pickupRequestInFlight.current) return;
    pickupRequestInFlight.current = true;
    const picked = state?.drops.find((drop) => drop.drop_id === dropId);
    dropDisplayPositions.current.delete(dropId);
    applyFrontendState((current) => applyFrontendPickup(dropId, current));
    setNotice(picked ? `已拾取：${picked.name_text}` : "已拾取掉落。");
    pickupRequestInFlight.current = false;
  }

  function resetBattleRuntimeForChallenge(spawnPoint: { x: number; y: number }) {
    const resetPlayer = {
      ...playerStateRef.current,
      x: spawnPoint.x,
      y: spawnPoint.y,
      hp: playerStateRef.current.maxHp,
      currentMana: playerStateRef.current.maxMana,
      currentEnergyShield: playerStateRef.current.maxEnergyShield
    };
    setRuntimePlayer(() => resetPlayer);
    enemiesStateRef.current = [];
    setEnemies([]);
    setTexts([]);
    setRuntimePlayerBuffs([]);
    setBolts([]);
    setAreaNovas([]);
    setMeleeArcs([]);
    setChainSegments([]);
    setDamageZones([]);
    setHitVfxs([]);
    setKills(0);
    setElapsed(0);
    elapsedRef.current = 0;
    elapsedLastUiSync.current = 0;
    lastFrame.current = null;
    spawnTimer.current = 0;
    attackTimers.current = {};
    thundercloudChannels.current = {};
    scheduledSkillEvents.current = [];
    activeDamageZones.current = [];
    onKillRecastCounts.current.clear();
    enemyVisuals.current = new Map();
    playerVisual.current = { direction: "down", movementVector: { x: 0, y: 0 } };
    triggeredEncounterSourceIds.current = new Set();
    nextEnemyId.current = skillEditorMode ? SKILL_TEST_DUMMY_OFFSETS.length + 1 : 1;
  }

  function startGame(stageIdOverride?: string) {
    if (!selectedMapId) {
      setNotice("请先选择地图。");
      return;
    }
    if (!battleMap) {
      setNotice("地图资源仍在加载，请稍候。");
      return;
    }
    if (runtimeDebugMonsterCornerTestEnabled()) {
      const challengeSpawn = runtimeDebugCornerPlayerSpawn(battleMap);
      const nextEncounterPalette = createEncounterMonsterPalette();
      encounterMonsterPalette.current = nextEncounterPalette;
      resetBattleRuntimeForChallenge(challengeSpawn);
      const debugEnemies = createRuntimeDebugCornerEnemies(challengeSpawn, battleMap, nextEncounterPalette);
      enemiesStateRef.current = debugEnemies;
      setEnemies(debugEnemies);
      setGameFailureOpen(false);
      setPlaying(true);
      setCombatLogs(["边缘角落怪物 AI 测试开始。玩家静止，怪物应直接贴近并按节奏攻击。"]);
      setNotice(`${battleMap.displayName} 边缘角落怪物 AI 测试中。`);
      return;
    }
    const challengeSpawn = battleMap.playerSpawn;
    const nextEncounterPalette = createEncounterMonsterPalette();
    encounterMonsterPalette.current = nextEncounterPalette;
    resetBattleRuntimeForChallenge(challengeSpawn);
    setGameFailureOpen(false);
    setPlaying(true);
    setBagOpen(false);
    if (!skillEditorMode) {
      const selectedStage = selectedFrontendMapStage(stageIdOverride);
      if (!selectedStage?.enterable) {
        setPlaying(false);
        setNotice("该地图尚未解锁或门票不足。");
        return;
      }
      applyFrontendState((current) => {
        if (!current.map_progression) return { ...current, current_map_run: null, drops: [] };
        return {
          ...current,
          current_map_run: null,
          drops: [],
          map_progression: {
            ...current.map_progression,
            selected_stage_id: selectedStage.id,
            stages: current.map_progression.stages.map((stage) => {
              if (stage.id !== selectedStage.id) return { ...stage, selected: false };
              const entryCount = stage.free_entry ? stage.entry_count : Math.max(0, stage.entry_count - stage.entry_cost);
              return { ...stage, selected: true, entry_count: entryCount, enterable: stage.free_entry || entryCount >= stage.entry_cost };
            })
          }
        };
      });
      setAuthoredSpawnPlanActive(true);
      setAuthoredAggroSources([]);
      setSpawnPlanWarnings([]);
      setProceduralSpawnDebug(null);
      dropDisplayPositions.current = new Map();
      knownDropIds.current = new Set();
      const spawnPlan = createProceduralSpawnPlanEnemies(battleMap, nextEnemyId.current, selectedMapId, selectedStage);
      nextEnemyId.current = spawnPlan.nextId;
      enemiesStateRef.current = spawnPlan.enemies;
      setEnemies(spawnPlan.enemies);
      setAuthoredAggroSources(spawnPlan.aggroSources);
      setProceduralSpawnDebug(spawnPlan.debug);
      setCombatLogs([`${battleMap.displayName} 地图运行开始。怪物、击杀和掉落由前端运行。`]);
      setNotice(`${battleMap.displayName} 地图运行中。按 C 管理背包。`);
      return;
    }
    setAuthoredSpawnPlanActive(false);
    setAuthoredAggroSources([]);
    setSpawnPlanWarnings([]);
    setProceduralSpawnDebug(null);
    const nextEnemies = createSkillTestDummies(1, challengeSpawn.x, challengeSpawn.y, nextEncounterPalette);
    enemiesStateRef.current = nextEnemies;
    setEnemies(nextEnemies);
    nextEnemyId.current = SKILL_TEST_DUMMY_OFFSETS.length + 1;
    setCombatLogs([
      `${battleMap.displayName} 战斗开始。WASD 移动，技能会自动释放。`
    ]);
    setNotice(`${battleMap.displayName} 战斗中。按 C 管理背包。`);
  }

  async function openSkillEditorPanel() {
    setSkillEditorOpen(false);
    setSkillEditorGuidePackage(null);
    setNotice("技能编辑器已禁用。");
  }

  function beginDrag(event: DragEvent) {
    event.preventDefault();
  }

  function beginPointerDrag(event: MouseEvent, gem: Gem, origin: FloatingOrigin) {
    if (event.button !== 0) return;
    if (floatingGemRef.current || dropInProgressRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    clearDragHoverState();
    setFloatingItem(gem, origin, event.clientX, event.clientY);
  }

  function onGemHover(event: MouseEvent, gem: Gem, source: "board" | "inventory" | "equipment", slotIndex?: number) {
    setHoveredGemId(gem.instance_id);
    const preview = state?.skill_preview.find((skill) => skill.active_gem_instance_id === gem.instance_id);
    setTooltip({ gem: gemWithFrontendSkillPreviewTooltip(gem, preview), ...resolveTooltipPosition(event.currentTarget as HTMLElement, source, slotIndex) });
  }

  const linkedGemIds = useLinkedGemIds(state, hoveredGemId);
  const fullGemById = useMemo(() => {
    const result = new Map<string, Gem>();
    for (const gem of state?.inventory ?? []) result.set(gem.instance_id, gem);
    return result;
  }, [state]);
  const hoveredBoardGemId = hoveredGemId && fullGemById.get(hoveredGemId)?.board_position ? hoveredGemId : null;
  const legalDropCells = useLegalDropCells(state, floatingGem && isGemItem(floatingGem.gem) ? floatingGem.gem : null);
  const selectedGemInstanceId = floatingGem?.gem.instance_id ?? null;
  const legalPlacementCells = legalDropCells;
  const previewCell = floatingGem && hoveredBoardCell && legalPlacementCells.has(hoveredBoardCell) ? hoveredBoardCell : null;
  const previewInvalidReason = usePlacementInvalidReason(state, floatingGem, hoveredBoardCell, legalPlacementCells);
  const placementPreview = usePlacementPreview(state, fullGemById, floatingGem, previewCell);
  const previewAffectedCells = placementPreview?.previewAffectedCells ?? new Map<string, { types: PreviewRelationType[] }>();
  const previewAffectedGems = placementPreview?.previewAffectedGems ?? new Map<string, { labels: string[]; modifierCount: number }>();
  const previewRelations = placementPreview?.previewRelations ?? [];
  const supportPreview = useSupportPreview(state, fullGemById, hoveredGemId, floatingGem);
  const persistentSupportLines = useSupportLines(state, fullGemById);
  const activeTargetLines = useActiveTargetLines(persistentSupportLines, fullGemById, hoveredGemId, floatingGem);
  const passiveVisualEffects = useMountedPassiveVisualEffects(state, fullGemById);
  const gmGemOptionsById = useMemo(() => new Map((gmOptions?.gems ?? []).map((gem) => [gem.id, gem])), [gmOptions]);
  const bagSlots = inventorySlots.map((instanceId) => (instanceId ? fullGemById.get(instanceId) ?? null : null));
  const equippedItems = equipmentSlots.map((instanceId) => (instanceId ? fullGemById.get(instanceId) ?? null : null));

  async function loadGmEquipmentAffixes(source: string, level: number) {
    const affixes = await requestGmEquipmentAffixes(source, level);
    setGmAffixes(affixes);
    return affixes;
  }

  async function submitGmRequest(action: string, body: unknown, successText: string) {
    const payload = body && typeof body === "object" ? body as Record<string, unknown> : {};
    applyFrontendState((current) => {
      if (action === "gm-add-gem") {
        const baseGemId = String(payload.base_gem_id ?? gmOptions?.gems[0]?.id ?? "");
        const level = Number(payload.level ?? 1);
        const drop: DropPrompt = {
          drop_id: `frontend_gm_gem_${frontendDropId.current++}`,
          loot_kind: "gem",
          name_text: gmOptions?.gems.find((gem) => gem.id === baseGemId)?.name_text ?? "技能宝石",
          rarity_text: "宝石",
          picked_up: false,
          status_text: "GM 添加",
          level,
          base_gem_instance_id: baseGemId
        };
        return { ...current, inventory: [...current.inventory, createFrontendInventoryItem(drop, current)] };
      }
      if (action === "gm-add-equipment") {
        const source = String(payload.source ?? gmOptions?.equipment_sources[0]?.id ?? frontendEquipmentSources()[0]?.id ?? "装备");
        const level = Number(payload.level ?? selectedFrontendMapStage()?.monster_level ?? 1);
        const affixIds = Array.isArray(payload.affix_ids) ? payload.affix_ids.map(String) : [];
        const randomRarity = String(payload.random_rarity ?? (affixIds.length >= 6 ? "pink" : affixIds.length >= 3 ? "purple" : affixIds.length > 0 ? "blue" : "white"));
        const seed = Date.now() + frontendDropId.current * 1009;
        const generated = affixIds.length > 0
          ? createSpecifiedFrontendEquipment(source, level, affixIds, seed)
          : generateFrontendEquipment(source, level, randomRarity, seed);
        const affixTexts = frontendEquipmentAffixTexts(generated);
        const drop: DropPrompt = {
          drop_id: `frontend_gm_equipment_${frontendDropId.current++}`,
          loot_kind: "equipment",
          name_text: `Lv${generated.level} ${generated.source}`,
          rarity_text: frontendEquipmentRarityText(generated.rarity),
          picked_up: false,
          status_text: affixTexts.join("、"),
          level: generated.level,
          equipment_source: generated.source,
          equipment_rarity: generated.rarity,
          equipment_affixes: [generated.base_affix, ...generated.prefix_affixes, ...generated.suffix_affixes],
          equipment_stat_modifiers: frontendEquipmentStatModifiers(generated)
        };
        const item = createFrontendInventoryItem(drop, current);
        return {
          ...current,
          logs: [...current.logs, successText],
          inventory: [...current.inventory, item]
        };
      }
      return current;
    });
    setNotice(successText);
  }

  function refreshFrontendSaveSlots() {
    setSaveSlots(loadFrontendSaveSlotSummaries());
  }

  function chooseNewSaveSlot() {
    const emptySlot = saveSlots.find((slot) => !slot.save)?.id;
    setSelectedSaveSlotId(emptySlot ?? selectedSaveSlotId);
    setSaveStartMode("new");
    setNotice(emptySlot ? `将使用存档 ${emptySlot} 开始新游戏。` : `将覆盖存档 ${selectedSaveSlotId} 开始新游戏。`);
  }

  function chooseLatestSaveSlot() {
    const latestSlotId = latestFrontendSaveSlotId(saveSlots);
    if (!latestSlotId) {
      setSaveStartMode("new");
      setNotice("没有可继续的本地存档，请新建游戏。");
      return;
    }
    setSelectedSaveSlotId(latestSlotId);
    setSaveStartMode("continue");
    setNotice(`已选择最近的存档 ${latestSlotId}。`);
  }

  function deleteSaveSlot(slotId: number) {
    clearFrontendSaveSlot(slotId);
    const nextSlots = loadFrontendSaveSlotSummaries();
    setSaveSlots(nextSlots);
    if (selectedSaveSlotId === slotId && saveStartMode === "continue") {
      setSaveStartMode(latestFrontendSaveSlotId(nextSlots) ? "continue" : "new");
    }
    setNotice(`已删除存档 ${slotId}。`);
  }

  function startFromSelectedSaveSlot() {
    const slot = saveSlots.find((item) => item.id === selectedSaveSlotId);
    saveActiveFrontendSaveSlotId(selectedSaveSlotId);
    if (saveStartMode === "new") {
      const nextState = createFrontendNewGameState(selectedSaveSlotId);
      applyServerState(nextState);
      refreshFrontendSaveSlots();
      setEntryStep("map");
      setNotice(`已在存档 ${selectedSaveSlotId} 开始新游戏，请选择地图。`);
      return;
    }
    if (!slot?.save) {
      setNotice(`存档 ${selectedSaveSlotId} 为空，请选择新建游戏。`);
      return;
    }
    const savedState = appStateFromFrontendSave(slot.save);
    if (!savedState) {
      setNotice(slot.errorText || `存档 ${selectedSaveSlotId} 无法读取。`);
      return;
    }
    applyServerState(savedState, { persist: false });
    setEntryStep("map");
    setNotice(`已读取存档 ${selectedSaveSlotId}，请选择地图。`);
  }

  if (!state) return <main className="game-screen loading">{notice}</main>;
  const runtimeUsesEditorMap = battleMap ? isEditorRuntimeBattleMap(battleMap) : false;
  const battleCamera = createBattleCamera(player.x, player.y, skillEditorMode ? skillEditorCameraSettings.zoom : runtimeUsesEditorMap ? 1 : BATTLE_CAMERA_ZOOM);
  const visibleEnemies = selectRenderableEnemies(enemies, player, elapsed);
  const anchoredHitVfxs = anchorHitVfxsToTargets(hitVfxs, enemies);
  const anchoredBolts = anchorProjectilesToTargets(bolts, enemies);
  const activeBossEnemy = visibleEnemies.find((enemy) => enemy.boss && enemy.hp > 0) ?? null;
  const guardActive = activePlayerBuffs.some((buff) => buff.buffType === "guard" && buff.remaining > 0 && buff.remainingAmount > 0);
  const sortedRenderItems = createBattleRenderItems(player, visibleEnemies, anchoredBolts, anchoredHitVfxs, runtimeUsesEditorMap ? MAP_EDITOR_PLAYER_RENDER_SCALE : UNIT_RENDER_SCALE, guardActive);
  const animationNowMs = elapsed * 1000;
  const battleAnimationContexts = createBattleAnimationContexts(
    playerVisual.current,
    enemyVisuals.current,
    visibleEnemies,
    player,
    animationNowMs,
    statNumber(state.player_stats?.move_speed, PLAYER_SPEED) * playerMovementSpeedMultiplier(activePlayerBuffs)
  );
  const runtimeDebugCornerSummary = runtimeDebugMonsterCornerTestEnabled()
    ? runtimeDebugMonsterCornerSummary(enemies, player)
    : null;
  const runtimeBoundaryScanLine = runtimeDebugMonsterBoundaryTestEnabled()
    ? runtimeBoundaryMonsterScanLine(runtimeBoundaryScan)
    : null;
  const terrainWidth = battleMap?.meta.world_width ?? MAP_VISUAL_WIDTH;
  const terrainHeight = battleMap?.meta.world_height ?? MAP_VISUAL_HEIGHT;
  const battleGeometrySnapshot: BattleGeometrySnapshot = {
    width: terrainWidth,
    height: terrainHeight,
    timeMs: animationNowMs,
    camera: battleCamera,
    terrain: runtimeUsesEditorMap ? {
      tiles: battleMap.editorTiles,
      tileSize: battleMap.meta.grid_size,
      width: battleMap.meta.world_width,
      height: battleMap.meta.world_height
    } : undefined,
    player: {
      ...player,
      moving: Math.hypot(playerVisual.current.movementVector.x, playerVisual.current.movementVector.y) > 0.001,
      guardActive
    },
    enemies: visibleEnemies.map((enemy) => ({
      id: enemy.id,
      x: enemy.x,
      y: enemy.y,
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      lastDamagedAt: enemy.lastDamagedAt,
      monsterId: enemy.monsterId,
      spawnRarity: enemy.spawnRarity,
      visualPrimaryColor: enemy.visualPrimaryColor,
      boss: enemy.boss,
      runtimeTier: enemy.runtimeTier
    })),
    projectiles: anchoredBolts.map((bolt) => ({
      id: bolt.id,
      x: bolt.x,
      y: bolt.y,
      targetX: bolt.targetX,
      targetY: bolt.targetY,
      velocityX: bolt.velocityX,
      velocityY: bolt.velocityY,
      directionX: bolt.directionX,
      directionY: bolt.directionY,
      trajectory: bolt.trajectory,
      arcHeight: bolt.arcHeight,
      projectileVisualMode: bolt.projectileVisualMode,
      projectileWidth: bolt.projectileWidth,
      projectileHeight: bolt.projectileHeight,
      splitProjectile: bolt.splitProjectile,
      projectileSpeed: bolt.projectileSpeed,
      damageType: bolt.damageType,
      vfxKey: bolt.vfxKey,
      ttl: bolt.ttl,
      duration: bolt.duration,
      fadeDuration: bolt.fadeDuration
    })),
    areas: [
      ...passiveVisualEffects.map((gem, index) => ({
        id: index,
        kind: "passive-aura" as const,
        x: player.x,
        y: player.y,
        radius: 92 + index * 16,
        vfxKey: gem.visual_effect || gem.instance_id,
        ttl: 1,
        duration: 1
      })),
      ...areaNovas.map((nova) => ({
        id: nova.id,
        kind: "nova" as const,
        x: nova.followPlayer ? player.x : nova.x,
        y: nova.followPlayer ? player.y : nova.y,
        radius: nova.radius,
        ringWidth: nova.ringWidth,
        damageType: nova.damageType,
        vfxKey: nova.vfxKey,
        vfxScale: nova.vfxScale,
        ttl: nova.ttl,
        duration: nova.duration
      })),
      ...damageZones.map((zone) => ({
        id: zone.id,
        kind: "damage-zone" as const,
        x: zone.followPlayer ? player.x : zone.x,
        y: zone.followPlayer ? player.y : zone.y,
        radius: zone.shape === "circle" ? zone.radius : undefined,
        width: zone.shape === "rectangle" ? zone.length : undefined,
        height: zone.shape === "rectangle" ? zone.width : undefined,
        directionX: zone.directionX,
        directionY: zone.directionY,
        damageType: zone.damageType,
        vfxKey: zone.vfxKey,
        warning: zone.warning,
        hitAtMs: zone.hitAtMs,
        elapsedMs: elapsedRef.current * 1000,
        tickProgress: activeDamageZoneTickProgress(zone.zoneId) ?? zone.tickProgress,
        ttl: zone.ttl,
        duration: zone.duration
      })),
      ...meleeArcs.map((arc) => ({
        id: arc.id,
        kind: "melee-arc" as const,
        x: arc.x,
        y: arc.y,
        radius: arc.radius,
        directionX: arc.directionX,
        directionY: arc.directionY,
        arcAngle: arc.arcAngle,
        damageType: arc.damageType,
        vfxKey: arc.vfxKey,
        ttl: arc.ttl,
        duration: arc.duration
      })),
      ...chainSegments.map((segment) => ({
        id: segment.id,
        kind: "chain" as const,
        startX: segment.startX,
        startY: segment.startY,
        endX: segment.endX,
        endY: segment.endY,
        damageType: segment.damageType,
        vfxKey: segment.vfxKey,
        ttl: segment.ttl,
        duration: segment.duration
      }))
    ],
    hits: anchoredHitVfxs.map((vfx) => ({
      id: vfx.id,
      x: vfx.x,
      y: vfx.y,
      radius: Math.max(vfx.impactRadius ?? 0, vfx.projectileWidth ?? 0, vfx.projectileHeight ?? 0) * 0.5,
      damageType: vfx.damageType,
      vfxKey: vfx.vfxKey,
      shapeEffects: (vfx.shapeEffects ?? []).map((effect) => effect.id),
      ttl: vfx.ttl,
      duration: vfx.duration
    })),
    texts: texts.map((text) => ({
      id: text.id,
      x: text.x,
      y: text.y,
      text: text.text,
      damageType: text.damageType,
      ttl: text.ttl,
      duration: text.duration
    }))
  };

  return (
    <main className="game-screen">
      {activeBossEnemy && <BossHealthBar enemy={activeBossEnemy} />}
      <section className="map-layer" aria-label="可玩地图">
        <div
          className="terrain"
          style={{
            width: terrainWidth,
            height: terrainHeight,
            transform: battleTerrainTransform(battleCamera)
          }}
        >
          <div className="terrain-ground">
            {battleMap && <BakedMapBackground map={battleMap} />}
            {battleMap && <MapDebugOverlay map={battleMap} enabled={mapDebugEnabled} />}
          </div>
          {!CANVAS_GEOMETRY_SKILL_EFFECTS && (
            <div className="battle-ground-decal-layer">
              <PassiveAuraLayer effects={passiveVisualEffects} x={player.x} y={player.y} />
              <DamageZoneLayer zones={damageZones} />
              <AreaNovaLayer novas={areaNovas} />
              <MeleeArcLayer arcs={meleeArcs} />
              <ChainSegmentLayer segments={chainSegments} />
            </div>
          )}
          <div className="battle-entity-layer">
            {sortedRenderItems
              .filter(shouldRenderLegacyBattleItem)
              .map((item, index) => renderBattleRenderItem(item, index, battleAnimationContexts))}
          </div>
          <div className="battle-effect-layer">
            <PlayerBuffLayer buffs={activePlayerBuffs} player={player} />
            {skillEditorMode && (
              <FrontendSkillGuideLayer
                skills={activeSkills}
                player={player}
                enemies={enemies}
                guidePackage={skillEditorGuidePackage}
                debugOptions={skillEditorDebugOptions}
              />
            )}
          </div>
          <div className="battle-text-layer">
            {!CANVAS_GEOMETRY_SKILL_EFFECTS && texts.map((text) => (
              <div key={text.id} className={`floating-text floating-text-${cssToken(text.damageType)}`} style={floatingTextStyle(text)}>{text.text}</div>
            ))}
          </div>
        </div>
        <BattleGeometryCanvas snapshot={battleGeometrySnapshot} />
        <GroundDropLayer drops={state.drops} displayPositions={dropDisplayPositions.current} camera={battleCamera} onPickup={beginDropPickup} />
      </section>

      <header className="top-hud">
        <div>
          <h1>数独宝石流放like V1</h1>
          <span>{notice}</span>
        </div>
        {skillEditorMode && (
          <button className="hud-button" type="button" onClick={openSkillEditorPanel}>
            技能编辑器
          </button>
        )}
      </header>

      {!skillEditorMode && entryStep === "title" && (
        <section className="entry-title-screen" aria-label="开始游戏">
          <div className="entry-title-copy">
            <h2>数独宝石流放like V1</h2>
            <span>本地前端存档</span>
          </div>
          <button
            className="entry-primary-button"
            type="button"
            onClick={() => {
              refreshFrontendSaveSlots();
              setEntryStep("save");
              setNotice("请选择新建游戏、继续游戏或存档槽位。");
            }}
          >
            开始游戏
          </button>
        </section>
      )}

      {!skillEditorMode && entryStep === "save" && (
        <SaveSelectionPanel
          slots={saveSlots}
          selectedSlotId={selectedSaveSlotId}
          mode={saveStartMode}
          onSelectSlot={(slotId) => {
            setSelectedSaveSlotId(slotId);
            setSaveStartMode(saveSlots.find((slot) => slot.id === slotId)?.save ? "continue" : "new");
          }}
          onNewGame={chooseNewSaveSlot}
          onContinue={chooseLatestSaveSlot}
          onDelete={deleteSaveSlot}
          onBack={() => setEntryStep("title")}
          onStart={startFromSelectedSaveSlot}
        />
      )}

      <label className="map-debug-toggle">
        <input type="checkbox" checked={mapDebugEnabled} onChange={(event) => setMapDebugEnabled(event.target.checked)} />
        <span>地图调试：{mapDebugEnabled ? "开" : "关"}</span>
      </label>
      <ProceduralSpawnDebugPanel debug={proceduralSpawnDebug} />
      {spawnPlanWarnings.length > 0 ? (
        <aside className="spawnPlan-warning-panel" aria-label="遭遇点警告">
          {spawnPlanWarnings.slice(0, 3).map((warning) => <span key={warning}>{warning}</span>)}
        </aside>
      ) : null}

      {gameFailureOpen && (
        <section className="game-failure-overlay" role="dialog" aria-modal="true" aria-label="游戏失败">
          <div className="game-failure-dialog">
            <span>游戏失败</span>
            <h2>玩家生命已归零</h2>
            <p>本次战斗已经结束。</p>
            <button type="button" onClick={() => startGame()}>重新挑战</button>
          </div>
        </section>
      )}

      <div className="help-text">
        <p>C：打开/关闭背包</p>
        <p>WASD：移动</p>
        <p>拖拽：放置宝石</p>
        <p>左键：拾取</p>
      </div>

      {skillEditorMode && (
        <SkillEditorDebugToggles
          options={skillEditorDebugOptions}
          cameraSettings={skillEditorCameraSettings}
          onChange={setSkillEditorDebugOptions}
          onCameraSettingsChange={setSkillEditorCameraSettings}
        />
      )}

      {skillEditorMode && skillEditorOpen && state.skill_editor && (
        <SkillEditorPanel
          editor={state.skill_editor}
          selectedId={selectedSkillEditorId ?? state.skill_editor.selected_id}
          onSelect={setSelectedSkillEditorId}
          onState={setState}
          onPreviewPackage={setSkillEditorGuidePackage}
          playerPosition={player}
          battleCamera={battleCamera}
          cameraSettings={skillEditorCameraSettings}
          debugOptions={skillEditorDebugOptions}
          runtimePerfSummary={runtimePerfSummary}
          onCameraSettingsChange={setSkillEditorCameraSettings}
          onDebugOptionsChange={setSkillEditorDebugOptions}
          onClose={() => {
            setSkillEditorGuidePackage(null);
            setSkillEditorOpen(false);
          }}
        />
      )}

      {!playing && !skillEditorMode && entryStep === "map" && (
        <MapSelectionPanel
          battleMap={battleMap}
          progression={state.map_progression}
          onStart={startGame}
        />
      )}

      <section className="combat-feed" aria-label="战斗日志">
        {runtimeBoundaryScanLine && <p>{runtimeBoundaryScanLine}</p>}
        {runtimeDebugCornerSummary && <p>{runtimeDebugCornerSummary}</p>}
        {combatLogs.map((log, index) => <p key={index}>{log}</p>)}
      </section>

      <PlayerResourceHud
        state={state}
        player={player}
        inventoryMode={bagOpen}
      />

      {bagOpen && (
        <section className="inventory-overlay" aria-label="背包界面">
          <div className="gm-tool-anchor">
            <button
              className={`gm-tool-button${gmOpen ? " active" : ""}`}
              type="button"
              onClick={() => {
                setGmOpen((current) => !current);
                setTooltip(null);
              }}
            >
              GM工具
            </button>
          </div>
          {gmOpen && (
            <GmToolPanel
              options={gmOptions}
              affixes={gmAffixes}
              onLoadAffixes={loadGmEquipmentAffixes}
              onSubmit={submitGmRequest}
              onClose={() => setGmOpen(false)}
            />
          )}
          <CharacterInfoPanel state={state} player={player} />
          <section className="right-workbench">
            <section className="equipment-panel" aria-label="装备栏">
              <div className="equipment-grid" data-equipment-drop-target="true">
                {EQUIPMENT_SLOT_SPECS.map((slot, slotIndex) => {
                  const item = equippedItems[slotIndex];
                  const spansBothWeaponSlots = Boolean(
                    slotIndex === MAIN_WEAPON_SLOT_INDEX
                    && item
                    && isTwoHandedWeapon(item)
                    && equipmentSlots[OFF_WEAPON_SLOT_INDEX] === item.instance_id
                  );
                  if (
                    slotIndex === OFF_WEAPON_SLOT_INDEX
                    && item
                    && isTwoHandedWeapon(item)
                    && equipmentSlots[MAIN_WEAPON_SLOT_INDEX] === item.instance_id
                  ) {
                    return (
                      <div
                        key={slot.id}
                        className="equipment-blocked-cell"
                        data-equipment-drop-target="true"
                        data-equipment-slot-index={slotIndex}
                        data-equipment-slot-id={slot.id}
                        title="双手武器占用，禁止摆放"
                        onMouseEnter={() => setHoveredEquipmentSlot(slotIndex)}
                        onMouseLeave={() => setHoveredEquipmentSlot(null)}
                      >
                        <span className="equipment-slot-label">{slot.label}</span>
                        <span className="equipment-blocked-mark" aria-hidden="true">X</span>
                      </div>
                    );
                  }
                  const origin = item
                    ? { kind: "equipment" as const, slotIndex, slotId: slot.id, instanceId: item.instance_id }
                    : null;
                  const isGhost = Boolean(origin && isFloatingOrigin(floatingGem, origin));
                  return item ? (
                    <button
                      key={slot.id}
                      className={equipmentCellClass(slotIndex, hoveredEquipmentSlot, item, hoveredGemId, floatingGem, spansBothWeaponSlots)}
                      data-equipment-drop-target="true"
                      data-equipment-slot-index={slotIndex}
                      data-equipment-slot-id={slot.id}
                      data-item-instance-id={item.instance_id}
                      draggable={false}
                      onDragStart={beginDrag}
                      onMouseDown={(event) => origin && beginPointerDrag(event, item, origin)}
                      onMouseEnter={(event) => {
                        setHoveredEquipmentSlot(slotIndex);
                        onGemHover(event, item, "equipment", slotIndex);
                      }}
                      onMouseMove={(event) => onGemHover(event, item, "equipment", slotIndex)}
                      onMouseLeave={() => {
                        setHoveredEquipmentSlot(null);
                        setHoveredGemId(null);
                        setTooltip(null);
                      }}
                    >
                      <span className="equipment-slot-label">{slot.label}</span>
                      {isGhost ? <GemGhost /> : <GemOrb gem={item} />}
                    </button>
                  ) : (
                    <div
                      key={slot.id}
                      className={equipmentEmptyCellClass(slotIndex, hoveredEquipmentSlot, floatingGem, slot)}
                      data-equipment-drop-target="true"
                      data-equipment-slot-index={slotIndex}
                      data-equipment-slot-id={slot.id}
                      title={slot.label}
                      onMouseEnter={() => setHoveredEquipmentSlot(slotIndex)}
                      onMouseLeave={() => setHoveredEquipmentSlot(null)}
                    >
                      <span className="equipment-slot-label">{slot.label}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="board-panel">
              <div className="board-grid">
                {state.board.cells.flat().map((cell) => (
                  <BoardCell
                    key={`${cell.row}-${cell.column}`}
                    cell={cell}
                    fullGem={cell.gem ? fullGemById.get(cell.gem.instance_id) ?? cell.gem : null}
                    hoveredGemId={hoveredBoardGemId}
                    linkedGemIds={linkedGemIds}
                    supportPreview={supportPreview}
                    floatingGemId={floatingGem?.gem.instance_id ?? null}
                    selectedGemInstanceId={selectedGemInstanceId}
                    legalPlacementCells={legalPlacementCells}
                    hoveredBoardCell={hoveredBoardCell}
                    previewCell={previewCell}
                    previewAffectedCell={previewAffectedCells.get(cellKey(cell.row, cell.column)) ?? null}
                    previewInvalidReason={hoveredBoardCell === cellKey(cell.row, cell.column) ? previewInvalidReason : null}
                    onHoverCell={setHoveredBoardCell}
                    onDropGem={dropGemOnCell}
                    onDragGem={beginDrag}
                    onPointerDragGem={beginPointerDrag}
                    onHoverGem={onGemHover}
                    onLeaveGem={() => {
                      setHoveredGemId(null);
                      setTooltip(null);
                    }}
                    onUnmountGem={unmountGem}
                  />
                ))}
                {supportPreview
                  ? supportPreview.targets.length > 0 && <SupportPreviewLines preview={supportPreview} />
                  : activeTargetLines
                    ? activeTargetLines.length > 0 && <SupportLines lines={activeTargetLines} className="support-hover-lines" />
                  : showPersistentSupportLines && persistentSupportLines.length > 0 && <SupportLines lines={persistentSupportLines} />}
                {placementPreview && (
                  <div className="placement-preview-summary" data-preview-skill-refresh={previewCell ?? ""}>
                    <strong>放下后预计影响</strong>
                    <span>{placementPreview.previewSkillSummary}</span>
                  </div>
                )}
              </div>
              <label className="support-line-toggle">
                <input
                  type="checkbox"
                  checked={showPersistentSupportLines}
                  onChange={(event) => setShowPersistentSupportLines(event.currentTarget.checked)}
                />
                <span>常驻显示连线</span>
              </label>
            </section>

            <section className="bag-panel">
              <div className="bag-grid" data-bag-drop-target="true">
                {bagSlots.map((gem, slotIndex) => (
                  gem ? (
                    <button
                      key={`bag-${slotIndex}`}
                      className={bagCellClass(slotIndex, hoveredBagSlot, gem, hoveredGemId, floatingGem)}
                      data-bag-drop-target="true"
                      data-bag-slot-index={slotIndex}
                      data-item-instance-id={gem.instance_id}
                      draggable={false}
                      onDragStart={beginDrag}
                      onMouseDown={(event) => beginPointerDrag(event, gem, { kind: "bag", slotIndex, instanceId: gem.instance_id })}
                      onMouseEnter={(event) => {
                        setHoveredBagSlot(slotIndex);
                        onGemHover(event, gem, "inventory", slotIndex);
                      }}
                      onMouseMove={(event) => onGemHover(event, gem, "inventory", slotIndex)}
                      onMouseLeave={() => {
                        setHoveredBagSlot(null);
                        setHoveredGemId(null);
                        setTooltip(null);
                      }}
                    >
                      {isFloatingOrigin(floatingGem, { kind: "bag", slotIndex, instanceId: gem.instance_id }) ? <GemGhost /> : <GemOrb gem={gem} />}
                    </button>
                  ) : (
                    <div
                      key={`bag-${slotIndex}`}
                      className={bagEmptyCellClass(slotIndex, hoveredBagSlot)}
                      data-bag-drop-target="true"
                      data-bag-slot-index={slotIndex}
                      onMouseEnter={() => setHoveredBagSlot(slotIndex)}
                      onMouseLeave={() => setHoveredBagSlot(null)}
                    />
                  )
                ))}
              </div>
            </section>
          </section>

          {tooltip && !floatingGem && <GemTooltip tooltip={tooltip} />}
          {floatingGem && <FloatingGemView floatingGem={floatingGem} />}
          {floatingGem && <div className="drag-hint">拖到数独盘格子后松开</div>}
          {placementPrompt && (
            <div className="placement-prompt" style={{ left: placementPrompt.x, top: placementPrompt.y }}>
              {placementPrompt.text}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function GmToolPanel({
  options,
  affixes,
  onLoadAffixes,
  onSubmit,
  onClose
}: {
  options: GmOptions | null;
  affixes: GmEquipmentAffixResponse | null;
  onLoadAffixes: (source: string, level: number) => Promise<GmEquipmentAffixResponse>;
  onSubmit: (path: string, body: unknown, successText: string) => Promise<void>;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"gem" | "specific" | "random">("gem");
  const [selectedGemId, setSelectedGemId] = useState("");
  const [gemLevel, setGemLevel] = useState(1);
  const [gemQuantity, setGemQuantity] = useState(1);
  const [source, setSource] = useState("");
  const [equipmentLevel, setEquipmentLevel] = useState(86);
  const [selectedAffixIds, setSelectedAffixIds] = useState<string[]>([]);
  const [randomRarity, setRandomRarity] = useState("purple");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!options) return;
    setSelectedGemId((current) => current || options.gems[0]?.id || "");
    setSource((current) => current || options.equipment_sources[0]?.id || "");
    setRandomRarity((current) => current || options.equipment_rarities[2]?.id || "purple");
  }, [options]);

  useEffect(() => {
    if (!source) return;
    setSelectedAffixIds([]);
    onLoadAffixes(source, equipmentLevel).catch((error: Error) => setMessage(error.message));
  }, [source, equipmentLevel]);

  async function submit() {
    setBusy(true);
    setMessage("");
      try {
        if (mode === "gem") {
        await onSubmit("gm-add-gem", { base_gem_id: selectedGemId, level: gemLevel, quantity: gemQuantity }, "GM 已添加宝石。");
        } else if (mode === "specific") {
        await onSubmit("gm-add-equipment", { source, level: equipmentLevel, affix_ids: selectedAffixIds }, "GM 已添加指定装备。");
        } else {
        await onSubmit("gm-add-equipment", { source, level: equipmentLevel, random_rarity: randomRarity }, "GM 已添加随机装备。");
      }
      setMessage("已添加到物品栏。");
      onClose();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "GM 操作失败。");
    } finally {
      setBusy(false);
    }
  }

  function updateSelectedAffixes(event: React.ChangeEvent<HTMLSelectElement>) {
    const ids = Array.from(event.currentTarget.selectedOptions).map((option) => option.value);
    setSelectedAffixIds(ids);
  }

  const selectedAffixes = affixes?.affixes.filter((affix) => selectedAffixIds.includes(affix.id)) ?? [];
  const prefixCount = selectedAffixes.filter((affix) => affix.gen === "prefix").length;
  const suffixCount = selectedAffixes.filter((affix) => affix.gen === "suffix").length;
  const ordinaryAffixCount = selectedAffixes.filter((affix) => affix.gen !== "base").length;
  const baseCount = selectedAffixes.filter((affix) => affix.gen === "base").length;
  const qualityPreview = equipmentQualityByAffixCount(ordinaryAffixCount);

  return (
    <section className="gm-tool-panel" aria-label="GM工具">
      <header className="gm-tool-header">
        <strong>GM工具</strong>
        <button type="button" onClick={onClose} aria-label="关闭GM工具">×</button>
      </header>
      <div className="gm-tool-tabs">
        <button type="button" className={mode === "gem" ? "active" : ""} onClick={() => setMode("gem")}>宝石</button>
        <button type="button" className={mode === "specific" ? "active" : ""} onClick={() => setMode("specific")}>指定装备</button>
        <button type="button" className={mode === "random" ? "active" : ""} onClick={() => setMode("random")}>随机装备</button>
      </div>
      {!options ? (
        <div className="gm-tool-loading">正在读取合法物品...</div>
      ) : (
        <div className="gm-tool-body">
          {mode === "gem" && (
            <>
              <label>
                <span>宝石类型</span>
                <select value={selectedGemId} onChange={(event) => setSelectedGemId(event.currentTarget.value)}>
                  {options.gems.map((gem) => (
                    <option key={gem.id} value={gem.id}>{gem.name_text} · {gem.kind} · {gem.sudoku_digit}</option>
                  ))}
                </select>
              </label>
              <div className="gm-tool-row">
                <label>
                  <span>等级</span>
                  <input type="number" min={1} max={20} value={gemLevel} onChange={(event) => setGemLevel(clampNumber(Number(event.currentTarget.value), 1, 20))} />
                </label>
                <label>
                  <span>个数</span>
                  <input type="number" min={1} max={60} value={gemQuantity} onChange={(event) => setGemQuantity(clampNumber(Number(event.currentTarget.value), 1, 60))} />
                </label>
              </div>
            </>
          )}
          {mode !== "gem" && (
            <>
              <div className="gm-tool-row">
                <label>
                  <span>装备类型</span>
                  <select value={source} onChange={(event) => setSource(event.currentTarget.value)}>
                    {options.equipment_sources.map((item) => (
                      <option key={item.id} value={item.id}>{item.name_text}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>等级</span>
                  <input type="number" min={1} max={100} value={equipmentLevel} onChange={(event) => setEquipmentLevel(clampNumber(Number(event.currentTarget.value), 1, 100))} />
                </label>
              </div>
              {mode === "specific" ? (
                <>
                  <label>
                    <span>词缀</span>
                    <select multiple value={selectedAffixIds} onChange={updateSelectedAffixes} className="gm-affix-select">
                      {(affixes?.affixes ?? []).map((affix) => (
                        <option key={affix.id} value={affix.id}>{affix.name_text}</option>
                      ))}
                    </select>
                  </label>
                  <div className="gm-tool-summary">
                    <span>{qualityPreview}装备</span>
                    <span>基础 {baseCount}/1</span>
                    <span>前缀 {prefixCount}/{affixes?.capacity.prefix ?? 0}</span>
                    <span>后缀 {suffixCount}/{affixes?.capacity.suffix ?? 0}</span>
                  </div>
                </>
              ) : (
                <label>
                  <span>品质</span>
                  <select value={randomRarity} onChange={(event) => setRandomRarity(event.currentTarget.value)}>
                    {options.equipment_rarities.map((rarity) => (
                      <option key={rarity.id} value={rarity.id}>{rarity.name_text} · {rarity.affix_count}词缀</option>
                    ))}
                  </select>
                </label>
              )}
            </>
          )}
        </div>
      )}
      <footer className="gm-tool-footer">
        {message && <span>{message}</span>}
        <button type="button" disabled={busy || !options} onClick={submit}>{busy ? "添加中..." : "添加到物品栏"}</button>
      </footer>
    </section>
  );
}

function equipmentQualityByAffixCount(count: number) {
  if (count <= 0) return "白色";
  if (count <= 2) return "蓝色";
  if (count <= 5) return "紫色";
  return "粉色";
}

function ProceduralSpawnDebugPanel({ debug }: { debug: ProceduralSpawnDebugSummary | null }) {
  if (!debug) return null;
  const accepted = debug.spawn_points.filter((point) => point.accepted).slice(0, 8);
  const filtered = debug.filtered_points.slice(0, 5);
  return (
    <aside className="procedural-spawn-debug-panel" aria-label="程序化生怪调试">
      <strong>程序化生怪调试</strong>
      <span>当前地图类型：{debug.map_type}</span>
      <span>总生怪预算：{debug.spent_pack_budget} / {debug.base_pack_budget}</span>
      <span>已生成怪物包数量：{debug.generated_pack_count}</span>
      <span>普通 {debug.normal_monster_count}，魔法 {debug.magic_monster_count}，稀有 {debug.rare_monster_count}，传奇 {debug.boss_monster_count}</span>
      {accepted.length > 0 && (
        <div className="procedural-spawn-debug-list">
          <span>刷怪点</span>
          {accepted.map((point) => (
            <code key={`spawn-${point.gridX}-${point.gridY}`}>
              {point.zone_type} / {point.monster_pack_id ?? "无"}
            </code>
          ))}
        </div>
      )}
      {filtered.length > 0 && (
        <div className="procedural-spawn-debug-list">
          <span>过滤原因</span>
          {filtered.map((point, index) => (
            <code key={`filtered-${point.gridX}-${point.gridY}-${index}`}>
              {point.zone_type} / {point.filter_reason ?? "未知原因"}
            </code>
          ))}
        </div>
      )}
    </aside>
  );
}

function statNumber(stat: PlayerStatView | undefined, fallback: number) {
  return typeof stat?.value === "number" ? stat.value : fallback;
}

function statValue(stats: Record<string, number | boolean> | undefined, stat: string) {
  const value = stats?.[stat];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function frontendEnergyShieldRechargePercentPerSecond(stats: AppState["player_stats"] | undefined) {
  const speedAddPercent = statNumber(stats?.energy_shield_charge_speed_percent, 0)
    + statNumber(stats?.energy_shield_charge_speed_add_percent, 0);
  const speedFinalPercent = statNumber(stats?.energy_shield_charge_speed_final_percent, 0);
  return Math.max(0, 20 * (1 + speedAddPercent / 100) * (1 + speedFinalPercent / 100));
}

function frontendEnergyShieldRechargeDelayMs(stats: AppState["player_stats"] | undefined) {
  const baseDelayMs = Math.max(0, statNumber(stats?.energy_shield_charge_delay_ms, 2000));
  const intervalAddPercent = statNumber(stats?.energy_shield_charge_interval_percent, 0)
    + statNumber(stats?.energy_shield_charge_interval_add_percent, 0)
    + statNumber(stats?.energy_shield_charge_delay_add_percent, 0);
  const intervalFinalPercent = statNumber(stats?.energy_shield_charge_interval_final_percent, 0)
    + statNumber(stats?.energy_shield_charge_delay_final_percent, 0);
  return Math.max(0, baseDelayMs * Math.max(0, 1 + intervalAddPercent / 100) * Math.max(0, 1 + intervalFinalPercent / 100));
}

function regeneratePlayerResources(player: PlayerRuntimeState, stats: AppState["player_stats"] | undefined, dt: number): PlayerRuntimeState {
  const lifeRegen = Math.max(0, statNumber(stats?.life_regen_flat, 0) * (1 + Math.max(0, statNumber(stats?.life_regen_add_percent, 0)) / 100))
    + Math.max(0, player.maxHp * statNumber(stats?.life_regen_percent_per_second, 0) / 100);
  const manaRegen = Math.max(0, statNumber(stats?.mana_regen_flat, 0) * (1 + Math.max(0, statNumber(stats?.mana_regen_add_percent, 0)) / 100));
  if (lifeRegen <= 0 && manaRegen <= 0) return player;
  return {
    ...player,
    hp: clamp(player.hp + lifeRegen * dt, 0, player.maxHp),
    currentMana: clamp(player.currentMana + manaRegen * dt, 0, player.maxMana)
  };
}

function PlayerResourceHud({
  state,
  player,
  inventoryMode
}: {
  state: AppState;
  player: PlayerRuntimeState;
  inventoryMode: boolean;
}) {
  const maxLife = Math.max(0, player.maxHp);
  const currentLife = clamp(player.hp, 0, maxLife);
  const maxShield = Math.max(0, player.maxEnergyShield);
  const currentShield = clamp(player.currentEnergyShield, 0, maxShield);
  const maxMana = Math.max(0, player.maxMana);
  const currentMana = clamp(player.currentMana, 0, maxMana);

  return (
    <aside className={`player-resource-hud${inventoryMode ? " inventory-mode" : ""}`} aria-label="玩家资源">
      <ResourceOrb
        kind="life"
        label="生命"
        current={currentLife}
        max={maxLife}
        secondaryLabel="护盾"
        secondaryCurrent={currentShield}
        secondaryMax={maxShield}
      />
      <ResourceOrb kind="mana" label="魔力" current={currentMana} max={maxMana} />
    </aside>
  );
}

function ResourceOrb({
  kind,
  label,
  current,
  max,
  secondaryLabel,
  secondaryCurrent,
  secondaryMax
}: {
  kind: string;
  label: string;
  current: number;
  max: number;
  secondaryLabel?: string;
  secondaryCurrent?: number;
  secondaryMax?: number;
}) {
  return (
    <section className={`player-resource-node player-resource-node-${kind}`}>
      <div className="player-resource-readout">
        {secondaryLabel && (
          <>
            <span>{label}:</span>
            <strong>{formatResourceValue(current)} / {formatResourceValue(max)}</strong>
            <span>{secondaryLabel}:</span>
            <strong>{formatResourceValue(secondaryCurrent ?? 0)} / {formatResourceValue(secondaryMax ?? 0)}</strong>
          </>
        )}
        {!secondaryLabel && (
          <>
            <span>{label}:</span>
            <strong>{formatResourceValue(current)} / {formatResourceValue(max)}</strong>
          </>
        )}
      </div>
      <div className={`player-resource-orb player-resource-orb-${kind}`} aria-hidden="true">
        <span style={{ height: `${resourcePercent(current, max)}%` }} />
      </div>
    </section>
  );
}

function resourcePercent(current: number, max: number) {
  if (max <= 0) return 0;
  return clamp((current / max) * 100, 0, 100);
}

function formatResourceValue(value: number) {
  return Math.round(value).toLocaleString("en-US");
}

function CharacterInfoPanel({ state, player }: { state: AppState; player: { hp: number; maxHp: number } }) {
  const panel = state.character_panel;
  const avatarFrame = resolveUnitAnimation({
    unitId: "player_adventurer",
    requestedState: "idle",
    movementVector: { x: 0, y: 0 },
    fallbackDirection: "right",
    elapsedMs: 0,
    baseMoveSpeed: PLAYER_SPEED,
    currentMoveSpeed: 0
  });
  const attributeRows = panelRows(panel, "attributes");
  const coreRows = panelRows(panel, "core");
  const resistanceRows = panelRows(panel, "resistance");
  const detailSections = panel?.sections.filter((section) => section.layout === "detail") ?? [];

  return (
    <aside className="character-info-panel" aria-label="角色信息">
      <header className="character-info-header">
        <div className="character-meta">
          <strong>等级 1</strong>
          <span>洞穴</span>
          <span>第 1 赛季</span>
        </div>
        <div className="character-identity">
          <strong>kiritokun</strong>
          <div className="character-avatar" aria-hidden="true">
            <UnitAnimationSprite frame={avatarFrame} />
          </div>
        </div>
        <dl className="character-attributes">
          {attributeRows.map((row) => (
            <div key={row.id}><dt>{row.label_text}</dt><dd>{formatCharacterPanelValue(row, player)}</dd></div>
          ))}
        </dl>
      </header>

      <section className="character-core-grid" aria-label="核心属性">
        {coreRows.map((row) => (
          <article key={row.id} className="character-core-card">
            <span className={`character-stat-icon character-stat-${row.tone}`}>{row.icon_text}</span>
            <strong>{row.label_text}</strong>
            <span>{formatCharacterPanelValue(row, player)}</span>
          </article>
        ))}
      </section>

      <section className="character-resistance-section" aria-label="抗性">
        <h2>{panel?.sections.find((section) => section.layout === "resistance")?.title_text ?? "抗性"}</h2>
        <div className="character-resistance-grid">
          {resistanceRows.map((row) => (
            <div key={row.id} className="character-resistance-row">
              <span className={`character-stat-icon character-stat-${row.tone}`}>{row.icon_text}</span>
              <span>{row.label_text}</span>
              <strong>{formatCharacterPanelValue(row, player)}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="character-detail-list" aria-label="角色属性明细">
        {detailSections.map((section) => (
          <article key={section.id} className="character-detail-group">
            <h2>{section.title_text}</h2>
            <dl>
              {section.rows.map((row) => (
                <div key={row.id}>
                  <dt>{row.label_text}</dt>
                  <dd>{formatCharacterPanelValue(row, player)}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </section>
    </aside>
  );
}

function panelRows(panel: CharacterPanelView | undefined, layout: CharacterPanelSectionView["layout"]) {
  return panel?.sections.find((section) => section.layout === layout)?.rows ?? [];
}

function formatCharacterPanelValue(row: CharacterPanelRowView, player: { hp: number; maxHp: number }) {
  const rawValue = row.stat_id === "current_life" && typeof row.value === "number"
    ? Math.min(Math.round(player.maxHp), Math.round(player.hp))
    : row.value;
  if (typeof rawValue === "boolean") return rawValue ? "是" : "否";
  const value = Number(rawValue);
  if (!Number.isFinite(value)) return "0";
  if (row.formatter === "integer") return String(Math.round(value));
  if (row.formatter === "rating") return String(Math.round(value));
  if (row.formatter === "percent") return `${formatPreviewNumber(value)}%`;
  if (row.formatter === "multiplier") return `${formatPreviewNumber(value)} 倍`;
  if (row.formatter === "seconds_from_ms") return `${formatPreviewNumber(value / 1000)} 秒`;
  return formatPreviewNumber(value);
}

function SaveSelectionPanel({
  slots,
  selectedSlotId,
  mode,
  onSelectSlot,
  onNewGame,
  onContinue,
  onDelete,
  onBack,
  onStart
}: {
  slots: FrontendSaveSlotSummary[];
  selectedSlotId: number;
  mode: "continue" | "new";
  onSelectSlot: (slotId: number) => void;
  onNewGame: () => void;
  onContinue: () => void;
  onDelete: (slotId: number) => void;
  onBack: () => void;
  onStart: () => void;
}) {
  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId);
  return (
    <section className="save-selection-panel" aria-label="存档选择">
      <div className="save-selection-shell">
        <header className="save-selection-header">
          <div>
            <h2>选择存档</h2>
            <span>暂定 5 个本地存档栏位，数据只保存在当前浏览器。</span>
          </div>
          <button type="button" onClick={onBack}>返回</button>
        </header>
        <div className="save-mode-actions" role="group" aria-label="游戏模式">
          <button type="button" className={mode === "new" ? "active" : ""} onClick={onNewGame}>新建游戏</button>
          <button type="button" className={mode === "continue" ? "active" : ""} onClick={onContinue}>继续游戏</button>
        </div>
        <div className="save-slot-list">
          {slots.map((slot) => {
            const selected = slot.id === selectedSlotId;
            const saveState = appStateFromFrontendSave(slot.save);
            const selectedStage = saveState?.map_progression?.stages.find((stage) => stage.selected);
            return (
              <article key={slot.id} className={`${selected ? "save-slot-card selected" : "save-slot-card"}${slot.save ? "" : " empty"}`}>
                <button type="button" className="save-slot-main" onClick={() => onSelectSlot(slot.id)}>
                  <strong>存档 {slot.id}</strong>
                  {slot.save ? (
                    <>
                      <span>{formatFrontendSaveTime(slot.save.saved_at)}</span>
                      <span>{selectedStage ? `${selectedStage.display_name} · 怪物等级 ${selectedStage.monster_level}` : "角色进度已保存"}</span>
                    </>
                  ) : (
                    <span>空栏位</span>
                  )}
                  {slot.errorText && <span className="save-slot-error">{slot.errorText}</span>}
                </button>
                <button
                  type="button"
                  className="save-slot-delete"
                  disabled={!slot.save}
                  onClick={() => onDelete(slot.id)}
                  aria-label={`删除存档 ${slot.id}`}
                >
                  删除
                </button>
              </article>
            );
          })}
        </div>
        <footer className="save-selection-footer">
          <span>{mode === "new" ? `将在存档 ${selectedSlotId} 新建游戏` : selectedSlot?.save ? `将读取存档 ${selectedSlotId}` : "请选择有数据的存档或新建游戏"}</span>
          <button className="entry-primary-button" type="button" onClick={onStart}>
            开始
          </button>
        </footer>
      </div>
    </section>
  );
}

function formatFrontendSaveTime(value: string | undefined) {
  if (!value) return "保存时间未知";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "保存时间未知";
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function MapSelectionPanel({
  battleMap,
  progression,
  onStart
}: {
  battleMap: BakedBattleMapData | null;
  progression?: AppState["map_progression"];
  onStart: (stageId: string) => void;
}) {
  const stages = progression?.stages ?? [];
  const selectedStage = stages.find((stage) => stage.selected) ?? stages.find((stage) => stage.enterable) ?? stages[0];
  return (
    <section className="map-selection-panel" aria-label="地图选择">
      <header className="map-selection-header">
        <div>
          <h2>选择战斗地图</h2>
          <span>自动存档已启用，起始区域 I 可无限免费刷。</span>
        </div>
      </header>
      <div className="map-selection-list">
        {stages.map((stage) => {
          const selected = selectedStage?.id === stage.id;
          return (
            <button
              key={stage.id}
              type="button"
              className={`${selected ? "map-selection-card selected" : "map-selection-card"}${!stage.enterable ? " locked" : ""}`}
              disabled={!stage.enterable}
              onClick={() => onStart(stage.id)}
            >
              <strong>{stage.display_name}</strong>
              <span>地图等级：{stage.map_level_text} · 怪物等级：{stage.monster_level}</span>
              <span>宝石：Lv{stage.gem_level_min}-Lv{stage.gem_level_max} · 掉落率：{Math.round(stage.base_drop_chance * 100)}%</span>
              <span>{stage.free_entry ? "无限免费" : `门票 ${stage.entry_count}/${stage.entry_cost}`}{stage.boss_stage ? " · Boss奖励" : ""}</span>
            </button>
          );
        })}
      </div>
      <button className="start-button" type="button" disabled={!battleMap || !selectedStage?.enterable} onClick={() => selectedStage && onStart(selectedStage.id)}>
        {battleMap ? "进入选中地图" : "地图加载中"}
      </button>
    </section>
  );
}

function GroundDropLayer({
  drops,
  displayPositions,
  camera,
  onPickup
}: {
  drops: DropPrompt[];
  displayPositions: Map<string, { x: number; y: number }>;
  camera: Camera2D;
  onPickup: (drop: DropPrompt) => void;
}) {
  const visibleDrops = drops.filter((drop) => !drop.picked_up && drop.position);
  if (visibleDrops.length === 0) return null;
  return (
    <div className="ground-drop-layer" aria-label="地面掉落">
      {visibleDrops.map((drop) => {
        const position = battleWorldToViewport(displayPositions.get(drop.drop_id) ?? drop.position!, camera);
        const kind = drop.loot_kind || "gem";
        return (
          <button
            key={drop.drop_id}
            type="button"
            className={`ground-drop ground-drop-${cssToken(kind)}`}
            style={{ left: position.x, top: position.y }}
            onClick={() => onPickup(drop)}
            title={drop.name_text}
          >
            <span className="ground-drop-label">{drop.name_text}</span>
            <span className="ground-drop-icon" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

function BakedMapBackground({ map }: { map: BakedBattleMapData }) {
  if (isEditorRuntimeBattleMap(map)) return <EditorRuntimeMapBackground map={map} />;
  return (
    <img
      className="baked-map-background"
      src={map.backgroundUrl}
      alt={`${map.displayName}底图`}
      draggable={false}
      style={{ width: map.meta.world_width, height: map.meta.world_height }}
    />
  );
}

function EditorRuntimeMapBackground({ map }: { map: EditorRuntimeBattleMapData }) {
  return (
    <div
      className="editor-runtime-map-background"
      aria-hidden="true"
      data-renderer="canvas"
      data-visual-system="abstract-geometric-map-tiles"
      style={{ width: map.meta.world_width, height: map.meta.world_height }}
    />
  );
}

function MapDebugOverlay({ map, enabled }: { map: BakedBattleMapData; enabled: boolean }) {
  if (!enabled) return null;
  const cells: ReactNode[] = [];
  for (let gridY = 0; gridY < map.gridHeight; gridY += 1) {
    for (let gridX = 0; gridX < map.gridWidth; gridX += 1) {
      if (map.walkableGrid[gridY]?.[gridX]) {
        cells.push(<span key={`walk-${gridX}-${gridY}`} className="map-debug-cell map-debug-walkable" style={mapDebugCellStyle(map, gridX, gridY)} />);
      }
      if (map.blockerGrid[gridY]?.[gridX]) {
        cells.push(<span key={`block-${gridX}-${gridY}`} className="map-debug-cell map-debug-blocker" style={mapDebugCellStyle(map, gridX, gridY)} />);
      }
    }
  }

  return (
    <div className="map-debug-overlay" aria-label="地图调试覆盖层">
      {cells}
      <MapDebugMarker point={map.playerSpawn} className="map-debug-marker-player" label="玩家出生点" />
      {map.enemySpawnPoints.map((point, index) => <MapDebugMarker key={`enemy-${index}`} point={point} className="map-debug-marker-enemy" label="普通怪刷新区" />)}
      {map.eliteSpawnPoints.map((point, index) => <MapDebugMarker key={`elite-${index}`} point={point} className="map-debug-marker-elite" label="精英怪刷新区" />)}
      {map.bossPoints.map((point, index) => <MapDebugMarker key={`boss-${index}`} point={point} className="map-debug-marker-boss" label="Boss 区域" />)}
      {map.exitPoints.map((point, index) => <MapDebugMarker key={`exit-${index}`} point={point} className="map-debug-marker-exit" label="出口" />)}
      {map.interactionPoints.map((point, index) => <MapDebugMarker key={`interaction-${index}`} point={point} className="map-debug-marker-interaction" label="交互点" />)}
    </div>
  );
}

function MapDebugMarker({ point, className, label }: { point: MapPoint; className: string; label: string }) {
  return (
    <span className={`map-debug-marker ${className}`} style={{ left: point.x, top: point.y }}>
      <span>{label}</span>
    </span>
  );
}

function mapDebugCellStyle(map: BakedBattleMapData, gridX: number, gridY: number): CSSProperties {
  return {
    left: gridX * map.meta.grid_size,
    top: gridY * map.meta.grid_size,
    width: map.meta.grid_size,
    height: map.meta.grid_size
  };
}

function SkillEditorDebugToggles({
  options,
  cameraSettings,
  onChange,
  onCameraSettingsChange
}: {
  options: SkillEditorDebugOptions;
  cameraSettings: SkillEditorCameraSettings;
  onChange: (options: SkillEditorDebugOptions) => void;
  onCameraSettingsChange: (settings: SkillEditorCameraSettings) => void;
}) {
  const [zoomDraft, setZoomDraft] = useState(cameraSettings.zoom);
  const [saveText, setSaveText] = useState("");
  const setOption = (key: keyof SkillEditorDebugOptions, value: boolean) => {
    onChange({ ...options, [key]: value });
  };
  useEffect(() => {
    setZoomDraft(cameraSettings.zoom);
  }, [cameraSettings.zoom]);

  function applyCameraZoom(value: number) {
    const nextSettings = normalizeSkillEditorCameraSettings({ zoom: value });
    setZoomDraft(nextSettings.zoom);
    onCameraSettingsChange(nextSettings);
    setSaveText("");
  }

  function saveCameraZoom() {
    const nextSettings = normalizeSkillEditorCameraSettings({ zoom: zoomDraft });
    saveSkillEditorCameraSettings(nextSettings);
    onCameraSettingsChange(nextSettings);
    setZoomDraft(nextSettings.zoom);
    setSaveText("已保存");
  }

  return (
    <section className="skill-test-debug-toggles" aria-label="技能测试辅助线显示">
      <div className="skill-test-camera-control">
        <div>
          <strong>镜头 POV</strong>
          <span>{zoomDraft.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={SKILL_EDITOR_CAMERA_MIN_ZOOM}
          max={SKILL_EDITOR_CAMERA_MAX_ZOOM}
          step={0.01}
          value={zoomDraft}
          onChange={(event) => applyCameraZoom(Number(event.currentTarget.value))}
        />
        <button type="button" onClick={saveCameraZoom}>
          保存镜头
        </button>
        {saveText && <span className="skill-test-camera-save-text">{saveText}</span>}
      </div>
      <label>
        <input type="checkbox" checked={options.showSearchRange} onChange={(event) => setOption("showSearchRange", event.currentTarget.checked)} />
        <span>搜索范围圈</span>
      </label>
      <label>
        <input type="checkbox" checked={options.showCollisionRadius} onChange={(event) => setOption("showCollisionRadius", event.currentTarget.checked)} />
        <span>碰撞半径圈</span>
      </label>
      <label>
        <input type="checkbox" checked={options.showDirectionLines} onChange={(event) => setOption("showDirectionLines", event.currentTarget.checked)} />
        <span>飞行方向线</span>
      </label>
      <label>
        <input type="checkbox" checked={options.showLaunchPoints} onChange={(event) => setOption("showLaunchPoints", event.currentTarget.checked)} />
        <span>发射点</span>
      </label>
      <label>
        <input type="checkbox" checked={options.showTargetPoint} onChange={(event) => setOption("showTargetPoint", event.currentTarget.checked)} />
        <span>目标点</span>
      </label>
    </section>
  );
}

function BoardCell({
  cell,
  fullGem,
  hoveredGemId,
  linkedGemIds,
  supportPreview,
  floatingGemId,
  selectedGemInstanceId,
  legalPlacementCells,
  hoveredBoardCell,
  previewCell,
  previewAffectedCell,
  previewInvalidReason,
  onHoverCell,
  onDropGem,
  onDragGem,
  onPointerDragGem,
  onHoverGem,
  onLeaveGem,
  onUnmountGem
}: {
  cell: Cell;
  fullGem: Gem | null;
  hoveredGemId: string | null;
  linkedGemIds: Set<string>;
  supportPreview: SupportPreview | null;
  floatingGemId: string | null;
  selectedGemInstanceId: string | null;
  legalPlacementCells: Set<string>;
  hoveredBoardCell: string | null;
  previewCell: string | null;
  previewAffectedCell: { types: PreviewRelationType[] } | null;
  previewInvalidReason: string | null;
  onHoverCell: (cellKey: string | null) => void;
  onDropGem: (instanceId: string, row: number, column: number) => Promise<boolean>;
  onDragGem: (event: DragEvent) => void;
  onPointerDragGem: (event: MouseEvent, gem: Gem, origin: FloatingOrigin) => void;
  onHoverGem: (event: MouseEvent, gem: Gem, source: "board" | "inventory" | "equipment", slotIndex?: number) => void;
  onLeaveGem: () => void;
  onUnmountGem: (instanceId: string) => void;
}) {
  const gem = fullGem;
  const origin: FloatingOrigin = { kind: "board", row: cell.row, column: cell.column };
  const isGhost = Boolean(gem && floatingGemId === gem.instance_id);
  const previewClass = supportPreview ? boardSupportPreviewClass(cell, supportPreview) : "";
  const hoverClass = previewClass || (gem ? boardHoverClass(gem.instance_id, hoveredGemId, linkedGemIds) : "");
  const currentCellKey = cellKey(cell.row, cell.column);
  const legalClass = legalPlacementCells.has(currentCellKey) ? "legal-drop-cell" : "";
  const placementModeClass = selectedGemInstanceId ? "placement-mode-cell" : "";
  const invalidClass = previewInvalidReason ? "invalid-drop-cell" : "";
  const previewTargetClass = previewCell === currentCellKey ? "preview-target-cell" : "";
  const affectedCellClass = previewAffectedCell ? previewAffectedCellClass(previewAffectedCell.types) : "";
  const boardHoverClassName = hoveredBoardCell === currentCellKey ? "board-slot-hover" : "";
  const boxBoundaryClasses = boardBoxBoundaryClasses(cell.row, cell.column);
  return (
    <button
      className={`board-cell ${boxBoundaryClasses} ${placementModeClass} ${hoverClass} ${legalClass} ${invalidClass} ${previewTargetClass} ${affectedCellClass} ${boardHoverClassName}`}
      data-board-row={cell.row}
      data-board-column={cell.column}
      data-box-boundary={boxBoundaryClasses}
      data-preview-cell={previewTargetClass ? "预览落点" : undefined}
      data-preview-relations={previewAffectedCell?.types.map(previewRelationLabel).join(" / ")}
      data-preview-invalid-reason={previewInvalidReason ?? undefined}
      title={previewInvalidReason ?? undefined}
      onMouseEnter={() => onHoverCell(currentCellKey)}
      onMouseLeave={() => onHoverCell(null)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const instanceId = event.dataTransfer.getData("text/plain");
        if (instanceId) onDropGem(instanceId, cell.row, cell.column);
      }}
      onDoubleClick={() => gem && !isGhost && onUnmountGem(gem.instance_id)}
    >
      {gem && !isGhost ? (
        <span
          draggable={false}
          onDragStart={onDragGem}
          onMouseDown={(event) => onPointerDragGem(event, gem, origin)}
          onMouseEnter={(event) => onHoverGem(event, gem, "board")}
          onMouseMove={(event) => onHoverGem(event, gem, "board")}
          onMouseLeave={onLeaveGem}
        >
          <GemOrb gem={gem} />
        </span>
      ) : isGhost ? (
        <GemGhost />
      ) : null}
      {previewTargetClass && (
        <span className="preview-ghost-gem" aria-label="预览落点">
          可放置
        </span>
      )}
      {previewInvalidReason && <span className="invalid-reason-badge">不可放置</span>}
    </button>
  );
}

function boardBoxBoundaryClasses(row: number, column: number) {
  const classes = [];
  if (row === 0 || row === 3 || row === 6) classes.push("box-border-top");
  if (row === 2 || row === 5 || row === 8) classes.push("box-border-bottom");
  if (column === 0 || column === 3 || column === 6) classes.push("box-border-left");
  if (column === 2 || column === 5 || column === 8) classes.push("box-border-right");
  return classes.join(" ");
}

function previewRelationLabel(type: PreviewRelationType) {
  const labels: Record<PreviewRelationType, string> = {
    row: "影响同行",
    column: "影响同列",
    box: "影响同宫",
    adjacent: "影响相邻"
  };
  return labels[type];
}

function previewAffectedCellClass(types: PreviewRelationType[]) {
  if (types.includes("box")) return "preview-dot-cell";
  if (types.includes("row") || types.includes("column")) return "preview-dot-cell";
  return "";
}

function FloatingGemView({ floatingGem }: { floatingGem: FloatingGem }) {
  return (
    <div className="floating-gem" style={{ left: floatingGem.x, top: floatingGem.y }}>
      <GemOrb gem={floatingGem.gem} />
    </div>
  );
}

function GemGhost() {
  return <span className="gem-ghost" />;
}

function SupportPreviewLines({ preview }: { preview: SupportPreview }) {
  return (
    <SupportLines
      className="support-hover-lines"
      lines={preview.targets.map((target) => ({
        id: target.instanceId,
        source: preview.source,
        target,
        color: preview.color
      }))}
    />
  );
}

function SupportLines({ lines, className = "" }: { lines: SupportLine[]; className?: string }) {
  return (
    <svg className={`support-preview-lines ${className}`} viewBox="0 0 9 9" aria-hidden="true">
      {lines.map((line) => (
        <line
          key={line.id}
          x1={line.source.column + 0.5}
          y1={line.source.row + 0.5}
          x2={line.target.column + 0.5}
          y2={line.target.row + 0.5}
          style={{ stroke: line.color }}
        />
      ))}
    </svg>
  );
}

function usePlacementInvalidReason(
  state: AppState | null,
  floatingGem: FloatingGem | null,
  hoveredBoardCell: string | null,
  legalPlacementCells: Set<string>
) {
  return useMemo(() => {
    if (!state || !floatingGem || !hoveredBoardCell || legalPlacementCells.has(hoveredBoardCell)) return null;
    if (!isGemItem(floatingGem.gem)) return "不可放置：只有宝石可以放入数独盘";
    const cell = boardCellByKey(state, hoveredBoardCell);
    if (!cell) return "不可放置：坐标超出数独盘";
    const ignoredInstanceIds = new Set([floatingGem.gem.instance_id, cell.gem?.instance_id ?? ""]);
    if (cell.gem && cell.gem.instance_id !== floatingGem.gem.instance_id && !ignoredInstanceIds.has(cell.gem.instance_id)) {
      return "不可放置：目标格已有宝石";
    }
    return "不可放置：同行、同列或同宫已有相同数独数字";
  }, [state, floatingGem, hoveredBoardCell, legalPlacementCells]);
}

function usePlacementPreview(
  state: AppState | null,
  fullGemById: Map<string, Gem>,
  floatingGem: FloatingGem | null,
  previewCell: string | null
) {
  return useMemo<PlacementPreview | null>(() => {
    if (!state || !floatingGem || !previewCell) return null;
    const targetCell = boardCellByKey(state, previewCell);
    if (!targetCell) return null;

    const previewAffectedCells = new Map<string, { types: PreviewRelationType[] }>();
    const previewAffectedGems = new Map<string, { labels: string[]; modifierCount: number }>();
    const previewRelations: PlacementPreview["previewRelations"] = [];

    for (const row of state.board.cells) {
      for (const cell of row) {
        if (cell.row === targetCell.row && cell.column === targetCell.column) continue;
        const types = previewRelationTypes(targetCell, cell);
        if (types.length === 0) continue;
        const key = cellKey(cell.row, cell.column);
        previewAffectedCells.set(key, { types });

        const affectedGem = cell.gem ? fullGemById.get(cell.gem.instance_id) ?? cell.gem : null;
        const labels = types.map(previewRelationLabel);
        previewRelations.push({ row: cell.row, column: cell.column, types, instanceId: affectedGem?.instance_id });
        if (affectedGem && affectedGem.instance_id !== floatingGem.gem.instance_id) {
          previewAffectedGems.set(affectedGem.instance_id, {
            labels,
            modifierCount: estimatePreviewModifierCount(floatingGem.gem, affectedGem, types)
          });
        }
      }
    }

    const affectedGemCount = previewAffectedGems.size;
    const previewSkillSummary = affectedGemCount > 0
      ? `${affectedGemCount} 个已放置宝石，${previewRelations.length} 个关系格`
      : "无可影响目标";

    return {
      previewCell: { row: targetCell.row, column: targetCell.column },
      previewAffectedCells,
      previewAffectedGems,
      previewRelations,
      previewSkillSummary
    };
  }, [state, fullGemById, floatingGem, previewCell]);
}

function boardCellByKey(state: AppState, key: string) {
  const [rowText, columnText] = key.split("-");
  const row = Number(rowText);
  const column = Number(columnText);
  return state.board.cells[row]?.[column] ?? null;
}

function previewRelationTypes(source: Cell, target: Cell) {
  const types: PreviewRelationType[] = [];
  if (target.row === source.row) types.push("row");
  if (target.column === source.column) types.push("column");
  if (target.box === source.box) types.push("box");
  if (Math.abs(target.row - source.row) + Math.abs(target.column - source.column) === 1) types.push("adjacent");
  return types;
}

function estimatePreviewModifierCount(sourceGem: Gem, targetGem: Gem, types: PreviewRelationType[]) {
  if (isAllowedRoute(sourceGem, targetGem)) return Math.max(1, types.length);
  return types.length;
}

function useLegalDropCells(state: AppState | null, floatingGem: Gem | null) {
  return useMemo(() => {
    const result = new Set<string>();
    if (!state || !floatingGem) return result;

    const floatingSudokuDigit = sudokuDigitKey(floatingGem);
    for (const row of state.board.cells) {
      for (const cell of row) {
        const target = cell.gem;
        const ignoredInstanceIds = new Set([floatingGem.instance_id, target?.instance_id ?? ""]);

        const hasConflict = state.board.cells.some((otherRow) =>
          otherRow.some((otherCell) => {
            const otherGem = otherCell.gem;
            if (!otherGem || ignoredInstanceIds.has(otherGem.instance_id)) return false;
            if (sudokuDigitKey(otherGem) !== floatingSudokuDigit) return false;
            return otherCell.row === cell.row || otherCell.column === cell.column || otherCell.box === cell.box;
          })
        );
        if (!hasConflict) result.add(cellKey(cell.row, cell.column));
      }
    }

    return result;
  }, [state, floatingGem]);
}

function useLinkedGemIds(state: AppState | null, hoveredGemId: string | null) {
  return useMemo(() => {
    const result = new Set<string>();
    if (!state || !hoveredGemId) return result;
    result.add(hoveredGemId);
    for (const entries of Object.values(state.board.highlights)) {
      for (const entry of entries) {
        if (entry.instance_ids.includes(hoveredGemId)) {
          for (const instanceId of entry.instance_ids) result.add(instanceId);
        }
      }
    }
    return result;
  }, [state, hoveredGemId]);
}

function useSupportPreview(state: AppState | null, fullGemById: Map<string, Gem>, hoveredGemId: string | null, floatingGem: FloatingGem | null) {
  return useMemo<SupportPreview | null>(() => {
    if (!state || !hoveredGemId || floatingGem) return null;
    const sourceGem = fullGemById.get(hoveredGemId);
    if (!sourceGem || !sourceGem.board_position || !(isSupportGem(sourceGem) || isPassiveGem(sourceGem))) return null;

    const targetIds = new Set<string>();
    for (const skill of state.skill_preview) {
      for (const modifier of skill.applied_modifiers) {
        if (modifier.applied && modifier.source_instance_id === sourceGem.instance_id && modifier.target_instance_id) {
          targetIds.add(modifier.target_instance_id);
        }
      }
    }

    const targets = state.board.cells.flat()
      .map((cell) => {
        if (!cell.gem || !targetIds.has(cell.gem.instance_id)) return null;
        const gem = fullGemById.get(cell.gem.instance_id) ?? cell.gem;
        if (!isAllowedRoute(sourceGem, gem)) return null;
        return { row: cell.row, column: cell.column, instanceId: gem.instance_id };
      })
      .filter((target): target is { row: number; column: number; instanceId: string } => Boolean(target));

    return {
      source: {
        row: sourceGem.board_position.row,
        column: sourceGem.board_position.column,
        instanceId: sourceGem.instance_id
      },
      targets,
      color: gemColorValue(sourceGem)
    };
  }, [state, fullGemById, hoveredGemId, floatingGem]);
}

function useSupportLines(state: AppState | null, fullGemById: Map<string, Gem>) {
  return useMemo<SupportLine[]>(() => {
    if (!state) return [];
    const result = new Map<string, SupportLine>();
    for (const skill of state.skill_preview) {
      for (const modifier of skill.applied_modifiers) {
        if (!modifier.applied || !modifier.source_instance_id || !modifier.target_instance_id) continue;
        const sourceGem = fullGemById.get(modifier.source_instance_id);
        const targetGem = fullGemById.get(modifier.target_instance_id);
        if (!sourceGem?.board_position || !targetGem?.board_position) continue;
        if (!isAllowedRoute(sourceGem, targetGem)) continue;
        const key = `${sourceGem.instance_id}-${targetGem.instance_id}`;
        if (result.has(key)) continue;
        result.set(key, {
          id: key,
          source: sourceGem.board_position,
          target: targetGem.board_position,
          color: gemColorValue(sourceGem)
        });
      }
    }
    return [...result.values()];
  }, [state, fullGemById]);
}

function useActiveTargetLines(lines: SupportLine[], fullGemById: Map<string, Gem>, hoveredGemId: string | null, floatingGem: FloatingGem | null) {
  return useMemo<SupportLine[] | null>(() => {
    if (!hoveredGemId || floatingGem) return null;
    const hoveredGem = fullGemById.get(hoveredGemId);
    if (!hoveredGem?.board_position || !isActiveGem(hoveredGem)) return null;
    return lines.filter((line) => line.target.row === hoveredGem.board_position?.row && line.target.column === hoveredGem.board_position.column);
  }, [lines, fullGemById, hoveredGemId, floatingGem]);
}

function boardHoverClass(instanceId: string, hoveredGemId: string | null, linkedGemIds: Set<string>) {
  if (!hoveredGemId) return "";
  if (instanceId === hoveredGemId) return "hover-self";
  if (linkedGemIds.has(instanceId)) return "hover-linked";
  return "hover-dim";
}

function boardSupportPreviewClass(cell: Cell, preview: SupportPreview) {
  const instanceId = cell.gem?.instance_id ?? "";
  if (instanceId === preview.source.instanceId) return "support-preview-source";
  if (preview.targets.some((target) => target.instanceId === instanceId)) return "support-preview-target";
  return "support-preview-dim";
}

function bagCellClass(slotIndex: number, hoveredBagSlot: number | null, gem: Gem, hoveredGemId: string | null, floatingGem: FloatingGem | null) {
  const classes = ["bag-cell"];
  if (hoveredBagSlot === slotIndex) classes.push("bag-slot-hover");
  if (hoveredGemId === gem.instance_id) classes.push("hover-self");
  if (isFloatingOrigin(floatingGem, { kind: "bag", slotIndex, instanceId: gem.instance_id })) classes.push("has-ghost");
  return classes.join(" ");
}

function bagEmptyCellClass(slotIndex: number, hoveredBagSlot: number | null) {
  const classes = ["bag-empty-cell"];
  if (hoveredBagSlot === slotIndex) classes.push("bag-slot-hover");
  return classes.join(" ");
}

function equipmentCellClass(
  slotIndex: number,
  hoveredEquipmentSlot: number | null,
  item: Gem,
  hoveredGemId: string | null,
  floatingGem: FloatingGem | null,
  spansBothWeaponSlots = false
) {
  const classes = ["equipment-cell"];
  if (hoveredEquipmentSlot === slotIndex) classes.push("equipment-slot-hover");
  if (hoveredGemId === item.instance_id) classes.push("hover-self");
  if (spansBothWeaponSlots) classes.push("equipment-cell-two-hand");
  const slot = EQUIPMENT_SLOT_SPECS[slotIndex];
  if (slot && isFloatingOrigin(floatingGem, { kind: "equipment", slotIndex, slotId: slot.id, instanceId: item.instance_id })) classes.push("has-ghost");
  return classes.join(" ");
}

function equipmentEmptyCellClass(slotIndex: number, hoveredEquipmentSlot: number | null, floatingGem: FloatingGem | null, slot: typeof EQUIPMENT_SLOT_SPECS[number]) {
  const classes = ["equipment-empty-cell"];
  if (hoveredEquipmentSlot === slotIndex) classes.push("equipment-slot-hover");
  if (floatingGem) classes.push(canPlaceItemInEquipmentSlot(floatingGem.gem, slot) ? "legal-equipment-cell" : "invalid-equipment-cell");
  return classes.join(" ");
}

function resolveTooltipPosition(anchor: HTMLElement, source: "board" | "inventory" | "equipment", slotIndex?: number): Omit<Tooltip, "gem"> {
  if (source === "board") return getBoardTooltipPosition(anchor);
  if (source === "equipment") return getEquipmentTooltipPosition(anchor);
  return getInventoryTooltipPosition(anchor, slotIndex ?? 0);
}

function getBoardTooltipPosition(anchor: HTMLElement): Omit<Tooltip, "gem"> {
  const cell = anchor.closest("[data-board-row][data-board-column]") as HTMLElement | null;
  const board = anchor.closest(".board-grid") as HTMLElement | null;
  const cellRect = (cell ?? anchor).getBoundingClientRect();
  const boardRect = (board ?? anchor).getBoundingClientRect();
  const centerTop = clampTooltipTop(cellRect.top + cellRect.height / 2);

  return {
    left: clampTooltipLeft(boardRect.left - 5 - TOOLTIP_WIDTH),
    top: centerTop,
    transform: `translateY(max(-50%, ${boardRect.top - centerTop}px))`
  };
}

function getInventoryTooltipPosition(anchor: HTMLElement, slotIndex: number): Omit<Tooltip, "gem"> {
  const rect = anchor.getBoundingClientRect();
  const columnIndex = slotIndex % INVENTORY_COLUMNS;
  if (columnIndex >= INVENTORY_COLUMNS - 4) {
    return {
      left: clampTooltipLeft(rect.left - 2 - TOOLTIP_WIDTH),
      top: clampTooltipTop(rect.top + rect.height / 2),
      transform: "translateY(-50%)"
    };
  }

  return {
    left: clampTooltipLeft(rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2),
    top: Math.max(TOOLTIP_SCREEN_PADDING, rect.top - 2),
    transform: "translateY(-100%)"
  };
}

function getEquipmentTooltipPosition(anchor: HTMLElement): Omit<Tooltip, "gem"> {
  const rect = anchor.getBoundingClientRect();
  return {
    left: clampTooltipLeft(rect.right + 8),
    top: clampTooltipTop(rect.top + rect.height / 2),
    transform: "translateY(-50%)"
  };
}

function clampTooltipLeft(left: number) {
  return Math.max(TOOLTIP_SCREEN_PADDING, Math.min(left, window.innerWidth - TOOLTIP_WIDTH - TOOLTIP_SCREEN_PADDING));
}

function clampTooltipTop(top: number) {
  return Math.max(TOOLTIP_SCREEN_PADDING, Math.min(top, window.innerHeight - TOOLTIP_SCREEN_PADDING));
}

function isFloatingOrigin(floatingGem: FloatingGem | null, origin: FloatingOrigin) {
  if (!floatingGem) return false;
  const current = floatingGem.origin;
  if (current.kind !== origin.kind) return false;
  if (current.kind === "bag" && origin.kind === "bag") return current.slotIndex === origin.slotIndex && current.instanceId === origin.instanceId;
  if (current.kind === "board" && origin.kind === "board") return current.row === origin.row && current.column === origin.column;
  if (current.kind === "equipment" && origin.kind === "equipment") {
    return current.slotIndex === origin.slotIndex && current.slotId === origin.slotId && current.instanceId === origin.instanceId;
  }
  return false;
}

function resolveDropTarget(element: Element | null): DropTarget {
  const boardCell = element?.closest("[data-board-row][data-board-column]") as HTMLElement | null;
  if (boardCell) {
    return {
      kind: "board",
      row: Number(boardCell.dataset.boardRow),
      column: Number(boardCell.dataset.boardColumn)
    };
  }

  const bagCell = element?.closest("[data-bag-slot-index]") as HTMLElement | null;
  if (bagCell) return { kind: "bag", slotIndex: Number(bagCell.dataset.bagSlotIndex) };

  const equipmentCell = element?.closest("[data-equipment-slot-index]") as HTMLElement | null;
  if (equipmentCell) {
    return {
      kind: "equipment",
      slotIndex: Number(equipmentCell.dataset.equipmentSlotIndex),
      slotId: equipmentCell.dataset.equipmentSlotId ?? ""
    };
  }
  return { kind: "invalid" };
}

function isDropBackToOrigin(
  floatingGem: FloatingGem,
  target: DropTarget,
  state: AppState | null,
  inventorySlots: (string | null)[],
  equipmentSlots: (string | null)[]
) {
  const origin = floatingGem.origin;
  if (origin.kind === "bag") {
    return target.kind === "bag" && origin.slotIndex === target.slotIndex && inventorySlots[target.slotIndex] === floatingGem.gem.instance_id;
  }
  if (origin.kind === "equipment") {
    return target.kind === "equipment" && origin.slotIndex === target.slotIndex && equipmentSlots[target.slotIndex] === floatingGem.gem.instance_id;
  }
  return (
    target.kind === "board" &&
    origin.row === target.row &&
    origin.column === target.column &&
    state?.board.cells[target.row]?.[target.column]?.gem?.instance_id === floatingGem.gem.instance_id
  );
}

function reconcileInventorySlots(current: (string | null)[], state: AppState, floatingItemId: string | null, equippedIds: Set<string> = new Set()) {
  const unmountedIds = new Set(state.inventory.filter((gem) => !gem.board_position).map((gem) => gem.instance_id));
  const next = Array(INVENTORY_SLOT_COUNT).fill(null) as (string | null)[];
  const used = new Set<string>();

  current.slice(0, INVENTORY_SLOT_COUNT).forEach((instanceId, index) => {
    if (instanceId && instanceId !== floatingItemId && !equippedIds.has(instanceId) && unmountedIds.has(instanceId) && !used.has(instanceId)) {
      next[index] = instanceId;
      used.add(instanceId);
    }
  });

  for (const gem of state.inventory) {
    if (gem.board_position || gem.instance_id === floatingItemId || equippedIds.has(gem.instance_id) || used.has(gem.instance_id)) continue;
    const emptyIndex = next.findIndex((instanceId) => instanceId === null);
    if (emptyIndex >= 0) {
      next[emptyIndex] = gem.instance_id;
      used.add(gem.instance_id);
    }
  }

  return next;
}

function moveItemToInventorySlot(slots: (string | null)[], instanceId: string, slotIndex: number) {
  const next = slots.slice(0, INVENTORY_SLOT_COUNT);
  while (next.length < INVENTORY_SLOT_COUNT) next.push(null);
  for (let index = 0; index < next.length; index += 1) {
    if (next[index] === instanceId) next[index] = null;
  }
  next[slotIndex] = instanceId;
  return next;
}

function moveItemToEquipmentSlot(slots: (string | null)[], instanceId: string, slotIndices: number | readonly number[]) {
  const next = slots.slice(0, EQUIPMENT_SLOT_COUNT);
  while (next.length < EQUIPMENT_SLOT_COUNT) next.push(null);
  const indices = Array.isArray(slotIndices) ? slotIndices : [slotIndices];
  for (let index = 0; index < next.length; index += 1) {
    if (next[index] === instanceId) next[index] = null;
  }
  for (const slotIndex of indices) {
    next[slotIndex] = instanceId;
  }
  return next;
}

function normalizeEquipmentSlots(slots: (string | null)[]) {
  const next = slots.slice(0, EQUIPMENT_SLOT_COUNT);
  while (next.length < EQUIPMENT_SLOT_COUNT) next.push(null);
  return next.map((instanceId) => instanceId ?? null);
}

function removeItemsFromEquipmentSlots(slots: (string | null)[], instanceIds: string[]) {
  const idSet = new Set(instanceIds.filter(Boolean));
  return slots.map((slotInstanceId) => (slotInstanceId && idSet.has(slotInstanceId) ? null : slotInstanceId));
}

function SkillEditorPanel({
  editor,
  selectedId,
  onSelect,
  onState,
  onPreviewPackage,
  playerPosition,
  battleCamera,
  cameraSettings,
  debugOptions,
  runtimePerfSummary,
  onCameraSettingsChange,
  onDebugOptionsChange,
  onClose
}: {
  editor: SkillEditorState;
  selectedId: string;
  onSelect: (skillId: string) => void;
  onState: (state: AppState) => void;
  onPreviewPackage: (packageData: SkillPackageData | null) => void;
  playerPosition: { x: number; y: number };
  battleCamera: Camera2D;
  cameraSettings: SkillEditorCameraSettings;
  debugOptions: SkillEditorDebugOptions;
  runtimePerfSummary: RuntimePerfSummary;
  onCameraSettingsChange: (settings: SkillEditorCameraSettings) => void;
  onDebugOptionsChange: (options: SkillEditorDebugOptions) => void;
  onClose: () => void;
}) {
  const selectedEntry = editor.entries.find((entry) => entry.id === selectedId && entry.openable)
    ?? editor.entries.find((entry) => entry.openable)
    ?? null;
  const detail = selectedEntry?.detail ?? null;
  const [draft, setDraft] = useState<SkillPackageData | null>(() => clonePackageData(selectedEntry?.package_data ?? null));
  const [draftSourceId, setDraftSourceId] = useState(selectedEntry?.id ?? "");
  const [saveMessage, setSaveMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedModifierIds, setSelectedModifierIds] = useState<string[]>([]);
  const [testRelation, setTestRelation] = useState("adjacent");
  const [sourcePower, setSourcePower] = useState(1);
  const [targetPower, setTargetPower] = useState(1);
  const [conduitPower, setConduitPower] = useState(1);
  const [modifierPreview, setModifierPreview] = useState<SkillEditorModifierPreview | null>(null);
  const [modifierMessage, setModifierMessage] = useState("");
  const [modifierPreviewing, setModifierPreviewing] = useState(false);
  const [arenaSkillId, setArenaSkillId] = useState("active_split_firebolt");
  const [arenaSceneId, setArenaSceneId] = useState(editor.test_arena.scenes[0]?.scene_id ?? "single_dummy");
  const [arenaUseModifierStack, setArenaUseModifierStack] = useState(false);
  const [arenaResult, setArenaResult] = useState<SkillTestArenaResult | null>(null);
  const [arenaStageIndex, setArenaStageIndex] = useState(0);
  const [arenaMessage, setArenaMessage] = useState("");
  const [arenaRunning, setArenaRunning] = useState(false);
  const [arenaPaused, setArenaPaused] = useState(false);
  const [cameraZoomDraft, setCameraZoomDraft] = useState(cameraSettings.zoom);
  const [cameraMessage, setCameraMessage] = useState("");
  const [selectedEventType, setSelectedEventType] = useState("projectile_spawn");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [runLogs, setRunLogs] = useState<string[]>([]);
  const [launchAdjustmentSnapshot, setLaunchAdjustmentSnapshot] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const nextId = selectedEntry?.id ?? "";
    if (nextId === draftSourceId) return;
    setDraft(clonePackageData(selectedEntry?.package_data ?? null));
    setDraftSourceId(nextId);
    setSaveMessage("");
    setSelectedModifierIds([]);
    setModifierPreview(null);
    setModifierMessage("");
    setArenaResult(null);
    setArenaStageIndex(0);
    setArenaMessage("");
    setArenaPaused(false);
    setSelectedEventType("projectile_spawn");
    setValidationErrors([]);
    setRunLogs([]);
    setLaunchAdjustmentSnapshot(null);
  }, [selectedEntry?.id, selectedEntry?.package_data, draftSourceId]);

  useEffect(() => {
    onPreviewPackage(selectedEntry?.editable && draft ? draft : null);
  }, [draft, onPreviewPackage, selectedEntry?.editable]);

  useEffect(() => {
    setCameraZoomDraft(cameraSettings.zoom);
  }, [cameraSettings.zoom]);

  function updateDraft(mutator: (next: SkillPackageData) => void) {
    setDraft((current) => {
      const next = clonePackageData(current);
      if (!next) return current;
      mutator(next);
      return next;
    });
  }

  function validateDraftBeforeSave() {
    if (!selectedEntry) return ["当前没有选中的技能。"];
    if (!draft) return ["当前技能包对象不存在，无法保存。"];
    const errors: string[] = [];
    const params = draft.behavior.params ?? {};
    const allowedTemplates = new Set(["projectile", "module_chain", "chain", "player_nova", "melee_arc", "damage_zone", "orbit_emitter", "line_pierce", "orbit", "delayed_area"]);
    const projectileAllowedParams = new Set([
      "projectile_count",
      "burst_interval_ms",
      "spread_angle_deg",
      "angle_step",
      "random_angle_jitter_deg",
      "projectile_speed",
      "projectile_width",
      "projectile_height",
      "max_distance",
      "hit_policy",
      "pierce_count",
      "collision_radius",
      "spawn_offset",
      "projectile_radius",
      "impact_radius",
      "max_targets",
      "trajectory",
      "travel_time_ms",
      "arc_height",
      "target_policy",
      "impact_marker_id",
      "vfx_key",
      "min_duration_ms",
      "max_duration_ms"
    ]);
    const playerNovaAllowedParams = new Set([
      "radius",
      "expand_duration_ms",
      "hit_at_ms",
      "max_targets",
      "center_policy",
      "damage_falloff_by_distance",
      "ring_width",
      "status_chance_scale"
    ]);
    const meleeArcAllowedParams = new Set([
      "arc_angle",
      "arc_radius",
      "windup_ms",
      "hit_at_ms",
      "max_targets",
      "facing_policy",
      "hit_shape",
      "status_chance_scale",
      "slash_vfx_key"
    ]);
    const damageZoneAllowedParams = new Set([
      "shape",
      "origin_policy",
      "facing_policy",
      "hit_at_ms",
      "max_targets",
      "status_chance_scale",
      "zone_vfx_key",
      "radius",
      "length",
      "width",
      "angle_offset_deg",
      "expand_duration_ms",
      "ring_width",
      "trigger_marker_id",
      "trigger_delay_ms",
      "vfx_key"
    ]);
    const chainAllowedParams = new Set([
      "chain_count",
      "chain_radius",
      "chain_delay_ms",
      "damage_falloff_per_chain",
      "target_policy",
      "allow_repeat_target",
      "max_targets",
      "segment_vfx_key"
    ]);
    const orbitEmitterAllowedParams = new Set([
      "orbit_center_policy",
      "duration_ms",
      "tick_interval_ms",
      "orbit_radius",
      "orbit_speed_deg_per_sec",
      "orb_count",
      "start_angle_deg",
      "orbit_radius_cycle_enabled",
      "orbit_radius_cycle_amplitude",
      "orbit_radius_cycle_period_ms",
      "orbit_radius_cycle_phase_deg",
      "tick_marker_id",
      "spawn_vfx_key",
      "tick_vfx_key"
    ]);
    const allowedParams = draft.behavior.template === "player_nova"
      ? playerNovaAllowedParams
      : draft.behavior.template === "melee_arc"
          ? meleeArcAllowedParams
          : draft.behavior.template === "damage_zone"
            ? damageZoneAllowedParams
            : draft.behavior.template === "chain"
              ? chainAllowedParams
              : draft.behavior.template === "orbit_emitter"
                ? orbitEmitterAllowedParams
                : projectileAllowedParams;

    if (draft.id !== selectedEntry.id) errors.push("技能 ID 必须与当前选择的技能一致。");
    if (!allowedTemplates.has(draft.behavior.template)) errors.push("行为模板不在允许范围内。");
    if (draft.presentation.vfx_scale !== undefined) requireNumberRange(draft.presentation.vfx_scale, "特效放大倍数", 0.1, 10, errors);
    if (isProjectileSkillTemplate(draft.behavior.template) || draft.behavior.template === "player_nova" || draft.behavior.template === "melee_arc" || draft.behavior.template === "damage_zone" || draft.behavior.template === "chain" || draft.behavior.template === "orbit_emitter") {
      for (const key of Object.keys(params)) {
        if (!allowedParams.has(key)) errors.push(`行为参数 ${key} 不属于当前行为模板。`);
      }
    }
    if (draft.modules?.length) {
      const markers = new Set<string>();
      for (const module of draft.modules) {
        if (!module.id || !module.type) errors.push("模块必须包含 id 和 type。");
        const moduleParams = module.params ?? {};
        const moduleAllowedParams = module.type === "damage_zone"
          ? damageZoneAllowedParams
          : module.type === "projectile"
            ? projectileAllowedParams
            : module.type === "orbit_emitter"
              ? orbitEmitterAllowedParams
              : allowedParams;
        for (const key of Object.keys(moduleParams)) {
          if (!moduleAllowedParams.has(key)) errors.push(`模块参数 ${module.id}.${key} 不属于 ${module.type}。`);
        }
        if (module.type === "projectile") {
          const marker = String(moduleParams.impact_marker_id ?? "");
          if (!marker) errors.push("投射物模块必须声明落地标识。");
          markers.add(marker);
        } else if (module.type === "orbit_emitter") {
          const marker = String(moduleParams.tick_marker_id ?? "");
          if (!marker) errors.push("环绕模块必须声明 tick 标识。");
          markers.add(marker);
        }
      }
      for (const module of draft.modules) {
        const trigger = module.trigger;
        if (trigger?.trigger_marker_id && !markers.has(String(trigger.trigger_marker_id))) {
          errors.push("伤害区触发标识必须来自已有模块标识。");
        }
      }
    }
    if (draft.behavior.template === "damage_zone") {
      if (!editor.options.zone_shapes.some((option) => option.value === params.shape)) errors.push("结算区域类型必须使用已有选项。");
      if (!editor.options.origin_policies.some((option) => option.value === params.origin_policy)) errors.push("起点规则必须使用已有选项。");
      if (!editor.options.facing_policies.some((option) => option.value === params.facing_policy)) errors.push("朝向规则必须使用已有选项。");
      requireIntegerAtLeast(params.hit_at_ms, "命中时机毫秒", 0, errors);
      requireIntegerAtLeast(params.max_targets, "最大目标数", 1, errors);
      requireNumberRange(params.status_chance_scale, "状态几率倍率", 0, 10, errors);
      if (params.shape === "circle") {
        requireNumberAtLeast(params.radius, "半径", 1, errors);
        requireIntegerAtLeast(params.expand_duration_ms, "扩散时长毫秒", 0, errors);
        requireNumberAtLeast(params.ring_width, "新星环宽", 1, errors);
        if (params.length !== undefined || params.width !== undefined || params.angle_offset_deg !== undefined) errors.push("圆形伤害区域不能写入矩形专属参数。");
      } else if (params.shape === "rectangle") {
        requireNumberAtLeast(params.length, "长度", 1, errors);
        requireNumberAtLeast(params.width, "宽度", 1, errors);
        requireNumberRange(params.angle_offset_deg, "角度", -180, 180, errors);
        if (params.radius !== undefined || params.expand_duration_ms !== undefined || params.ring_width !== undefined) errors.push("矩形伤害区域不能写入圆形专属参数。");
      }
      if (typeof params.zone_vfx_key !== "string" || !/^[a-z][a-z0-9_.-]*\.[a-z0-9_.-]+$/.test(params.zone_vfx_key)) {
        errors.push("区域特效键必须是配置键。");
      }
    } else if (draft.behavior.template === "player_nova") {
      requireNumberAtLeast(params.radius, "半径", 1, errors);
      requireIntegerAtLeast(params.expand_duration_ms, "扩散时长毫秒", 0, errors);
      requireIntegerAtLeast(params.hit_at_ms, "命中时机毫秒", 0, errors);
      if (Number(params.hit_at_ms) > Number(params.expand_duration_ms)) errors.push("命中时机毫秒不能大于扩散时长毫秒。");
      requireIntegerAtLeast(params.max_targets, "最大目标数", 1, errors);
      requireNumberAtLeast(params.ring_width, "新星环宽", 1, errors);
      requireNumberRange(params.status_chance_scale, "状态几率倍率", 0, 10, errors);
      if (params.center_policy !== undefined && !editor.options.center_policies.some((option) => option.value === params.center_policy)) {
        errors.push("中心规则必须使用已有选项。");
      }
      if (params.damage_falloff_by_distance !== undefined && !editor.options.damage_falloff_modes.some((option) => option.value === params.damage_falloff_by_distance)) {
        errors.push("距离衰减规则必须使用已有选项。");
      }
    } else if (draft.behavior.template === "melee_arc") {
      requireNumberRange(params.arc_angle, "扇形角度", 1, 180, errors);
      requireNumberAtLeast(params.arc_radius, "扇形半径", 1, errors);
      requireIntegerAtLeast(params.windup_ms, "前摇毫秒", 0, errors);
      requireIntegerAtLeast(params.hit_at_ms, "命中时机毫秒", 0, errors);
      if (Number(params.hit_at_ms) < Number(params.windup_ms)) errors.push("命中时机毫秒不能早于前摇毫秒。");
      requireIntegerAtLeast(params.max_targets, "最大目标数", 1, errors);
      requireNumberRange(params.status_chance_scale, "状态几率倍率", 0, 10, errors);
      if (!editor.options.facing_policies.some((option) => option.value === params.facing_policy)) {
        errors.push("朝向规则必须使用已有选项。");
      }
      if (!editor.options.hit_shapes.some((option) => option.value === params.hit_shape)) {
        errors.push("命中形状必须使用已有选项。");
      }
      if (typeof params.slash_vfx_key !== "string" || !/^[a-z][a-z0-9_.-]*\.[a-z0-9_.-]+$/.test(params.slash_vfx_key)) {
        errors.push("斩击特效键必须是配置键。");
      }
    } else if (draft.behavior.template === "chain") {
      requireIntegerAtLeast(params.chain_count, "连锁次数", 1, errors);
      requireNumberAtLeast(params.chain_radius, "连锁半径", 1, errors);
      requireIntegerAtLeast(params.chain_delay_ms, "连锁间隔毫秒", 0, errors);
      requireNumberRange(params.damage_falloff_per_chain, "每跳伤害衰减", 0, 1, errors);
      requireIntegerAtLeast(params.max_targets, "最大目标数", 1, errors);
      if (!editor.options.chain_target_policies.some((option) => option.value === params.target_policy)) {
        errors.push("连锁目标规则必须使用已有选项。");
      }
      if (typeof params.allow_repeat_target !== "boolean") {
        errors.push("允许重复命中必须是布尔值。");
      }
      if (typeof params.segment_vfx_key !== "string" || !/^[a-z][a-z0-9_.-]*\.[a-z0-9_.-]+$/.test(params.segment_vfx_key)) {
        errors.push("连锁段特效键必须是配置键。");
      }
    } else if (draft.behavior.template === "orbit_emitter") {
      if (params.orbit_center_policy !== "caster") errors.push("环绕中心第一版只支持 caster。");
      requireIntegerAtLeast(params.duration_ms, "持续毫秒", 1, errors);
      requireIntegerAtLeast(params.tick_interval_ms, "tick 间隔毫秒", 1, errors);
      if (Number(params.tick_interval_ms) > Number(params.duration_ms)) errors.push("tick 间隔毫秒不能大于持续毫秒。");
      requireNumberAtLeast(params.orbit_radius, "轨道半径", 1, errors);
      requireNumberAtLeast(params.orbit_speed_deg_per_sec, "每秒角速度", -Number.MAX_SAFE_INTEGER, errors);
      requireIntegerAtLeast(params.orb_count, "熔岩球数量", 1, errors);
      requireNumberRange(params.start_angle_deg, "起始角度", -360, 360, errors);
      if (params.orbit_radius_cycle_enabled !== undefined && typeof params.orbit_radius_cycle_enabled !== "boolean") errors.push("半径循环开关必须是布尔值。");
      requireNumberAtLeast(params.orbit_radius_cycle_amplitude, "半径循环振幅", 0, errors);
      requireIntegerAtLeast(params.orbit_radius_cycle_period_ms, "半径循环周期毫秒", 1, errors);
      requireNumberRange(params.orbit_radius_cycle_phase_deg, "半径循环相位", -360, 360, errors);
      if (typeof params.tick_marker_id !== "string" || !/^[a-z][a-z0-9_]*$/.test(params.tick_marker_id)) errors.push("tick 标识必须是配置标识。");
      if (typeof params.spawn_vfx_key !== "string" || !/^[a-z][a-z0-9_.-]*\.[a-z0-9_.-]+$/.test(params.spawn_vfx_key)) errors.push("生成特效键必须是配置键。");
      if (typeof params.tick_vfx_key !== "string" || !/^[a-z][a-z0-9_.-]*\.[a-z0-9_.-]+$/.test(params.tick_vfx_key)) errors.push("tick 特效键必须是配置键。");
    } else {
      requirePositiveInteger(params.projectile_count, "投射物数量", errors);
      requireNumberAtLeast(params.projectile_speed, "投射物速度", 1, errors);
      requireNumberAtLeast(params.projectile_width, "投射物宽度", 1, errors);
      requireNumberAtLeast(params.projectile_height, "投射物高度", 1, errors);
      requireNumberAtLeast(params.max_distance, "最大距离", 1, errors);
      requireNumberAtLeast(params.collision_radius, "碰撞半径", 0, errors);
      if (params.burst_interval_ms !== undefined) requireIntegerAtLeast(params.burst_interval_ms, "连发间隔毫秒", 0, errors);
      if (params.pierce_count !== undefined) requireIntegerAtLeast(params.pierce_count, "穿透次数", 0, errors);
      if (params.max_targets !== undefined) requireIntegerAtLeast(params.max_targets, "最大目标数", 1, errors);
      if (params.min_duration_ms !== undefined) requireIntegerAtLeast(params.min_duration_ms, "最短生命周期", 0, errors);
      if (params.max_duration_ms !== undefined) requireIntegerAtLeast(params.max_duration_ms, "最长生命周期", 1, errors);
      if (params.spread_angle_deg !== undefined) requireNumberRange(params.spread_angle_deg, "散射角度", 0, 180, errors);
      if (params.angle_step !== undefined) requireNumberRange(params.angle_step, "角度间隔", 0, 90, errors);
      if (params.random_angle_jitter_deg !== undefined) requireNumberRange(params.random_angle_jitter_deg, "随机角度偏移", 0, 45, errors);
      if (params.hit_policy !== undefined && !editor.options.hit_policies.some((option) => option.value === params.hit_policy)) {
        errors.push("命中后行为必须使用已有选项。");
      }
    }
    if (draft.cast.target_selector && !editor.options.target_selectors.some((option) => option.value === draft.cast.target_selector)) {
      errors.push("目标选择方式必须使用已有选项。");
    }
    if (draft.hit.target_policy && !editor.options.target_policies.some((option) => option.value === draft.hit.target_policy)) {
      errors.push("目标规则必须使用已有选项。");
    }
    if (draft.hit.damage_timing && !editor.options.damage_timings.some((option) => option.value === draft.hit.damage_timing)) {
      errors.push("伤害时机必须使用已有选项。");
    }
    return errors;
  }

  async function saveDraft() {
    if (!selectedEntry || !draft || !selectedEntry.editable) return;
    const nextValidationErrors = validateDraftBeforeSave();
    setValidationErrors(nextValidationErrors);
    if (nextValidationErrors.length > 0) {
      setSaveMessage("保存前校验失败，请先修正面板内错误。");
      return;
    }
    setSaving(true);
    setSaveMessage("正在保存。");
    try {
      const payload = await requestSkillEditorSave(selectedEntry.id, draft);
      onState(payload.state);
      setSaveMessage(payload.message_text);
      if (payload.ok) {
        const refreshed = payload.state.skill_editor.entries.find((entry) => entry.id === selectedEntry.id);
        setDraft(clonePackageData(refreshed?.package_data ?? null));
        setDraftSourceId(refreshed?.id ?? selectedEntry.id);
      }
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "保存失败。");
    } finally {
      setSaving(false);
    }
  }

  const projectileParams = draft?.behavior.params;
  const canEdit = Boolean(selectedEntry?.editable && draft);
  const modifierStack = editor.modifier_stack;
  const testArena = editor.test_arena;
  const selectedArenaScene = testArena.scenes.find((scene) => scene.scene_id === arenaSceneId) ?? testArena.scenes[0] ?? null;
  const selectedArenaSkill = testArena.skills.find((skill) => skill.id === arenaSkillId) ?? testArena.skills.find((skill) => skill.testable) ?? null;
  const currentArenaStage = arenaResult?.stages[Math.min(arenaStageIndex, Math.max(0, arenaResult.stages.length - 1))] ?? null;
  const availableModifierById = useMemo(
    () => new Map(modifierStack.available_modifiers.map((modifier) => [modifier.id, modifier])),
    [modifierStack.available_modifiers]
  );
  const selectedModifiers = selectedModifierIds
    .map((modifierId) => availableModifierById.get(modifierId))
    .filter((modifier): modifier is SkillEditorTestModifier => Boolean(modifier));
  const powerError = validateModifierPower(sourcePower, targetPower, conduitPower, modifierStack.power_limits);
  const canAdjustLaunchPoint = Boolean(canEdit && draft?.behavior.template === "projectile");
  const launchAdjustmentActive = Boolean(launchAdjustmentSnapshot && draft);
  const currentLaunchOffset = draft?.behavior.params.spawn_offset ?? { x: 0, y: 0 };
  const currentLaunchWorldPosition = draft
    ? {
        x: playerPosition.x + Number(currentLaunchOffset.x ?? 0),
        y: playerPosition.y + Number(currentLaunchOffset.y ?? 0)
      }
    : playerPosition;

  function beginLaunchPointAdjustment() {
    if (!draft || !canAdjustLaunchPoint) return;
    const offset = draft.behavior.params.spawn_offset ?? { x: 0, y: 0 };
    setSelectedEventType("projectile_spawn");
    onDebugOptionsChange({ ...debugOptions, showLaunchPoints: true, showDirectionLines: true });
    setLaunchAdjustmentSnapshot({
      x: Number(offset.x ?? 0),
      y: Number(offset.y ?? 0)
    });
  }

  function updateLaunchPointFromWorld(worldPosition: { x: number; y: number }) {
    updateDraft((next) => {
      next.behavior.params.spawn_offset = {
        x: Math.round(worldPosition.x - playerPosition.x),
        y: Math.round(worldPosition.y - playerPosition.y)
      };
    });
  }

  function confirmLaunchPointAdjustment() {
    setLaunchAdjustmentSnapshot(null);
    setSaveMessage("发射位置已确认，保存技能包后写入配置。");
  }

  function cancelLaunchPointAdjustment() {
    const snapshot = launchAdjustmentSnapshot;
    if (snapshot) {
      updateDraft((next) => {
        next.behavior.params.spawn_offset = { ...snapshot };
      });
    }
    setLaunchAdjustmentSnapshot(null);
    setSaveMessage("已取消发射位置调整。");
  }

  function addTestModifier(modifierId: string) {
    setSelectedModifierIds((current) => current.includes(modifierId) ? current : [...current, modifierId]);
    setModifierMessage("");
  }

  function removeTestModifier(modifierId: string) {
    setSelectedModifierIds((current) => current.filter((item) => item !== modifierId));
    setModifierPreview(null);
    setModifierMessage("");
  }

  function clearTestModifiers() {
    setSelectedModifierIds([]);
    setModifierPreview(null);
    setModifierMessage("测试栈已清空。");
  }

  async function applyTestModifiers() {
    if (!selectedEntry) return;
    if (powerError) {
      setModifierMessage(powerError);
      return;
    }
    setModifierPreviewing(true);
    setModifierMessage("正在计算测试结果。");
    try {
      const result = await requestSkillEditorModifierPreview({
        skill_id: selectedEntry.id,
        modifier_ids: selectedModifierIds,
        relation: testRelation,
        source_power: sourcePower,
        target_power: targetPower,
        conduit_power: conduitPower
      });
      setModifierPreview(result.preview);
      setModifierMessage(result.message_text);
    } catch (error) {
      setModifierPreview(null);
      setModifierMessage(error instanceof Error ? error.message : "测试栈计算失败。");
    } finally {
      setModifierPreviewing(false);
    }
  }

  async function runArenaRequest(finalStage: boolean) {
    if (!draft || !selectedArenaSkill?.testable || !selectedArenaScene) {
      setArenaMessage("当前技能不可测试。");
      setRunLogs((current) => ["当前技能不可测试。", ...current].slice(0, 8));
      return null;
    }
    if (arenaUseModifierStack && powerError) {
      setArenaMessage(powerError);
      setRunLogs((current) => [powerError, ...current].slice(0, 8));
      return null;
    }
    setArenaRunning(true);
    setArenaMessage("正在运行技能测试场。");
    try {
      const arenaPackage = selectedEntry?.id === arenaSkillId
        ? draft
        : clonePackageData(editor.entries.find((entry) => entry.id === arenaSkillId)?.package_data ?? null);
      const response = await requestSkillTestArenaRun({
        skill_id: arenaSkillId,
        scene_id: selectedArenaScene.scene_id,
        package: arenaPackage,
        use_modifier_stack: arenaUseModifierStack,
        modifier_ids: selectedModifierIds,
        relation: testRelation,
        source_power: sourcePower,
        target_power: targetPower,
        conduit_power: conduitPower
      });
      if (!response.ok || !response.result) {
        setArenaResult(null);
        setArenaStageIndex(0);
        setArenaMessage(response.message_text);
        setRunLogs((current) => [response.message_text, ...current].slice(0, 8));
        return null;
      }
      setArenaResult(response.result);
      setArenaStageIndex(finalStage ? Math.max(0, response.result.stages.length - 1) : 0);
      setArenaMessage(response.message_text);
      setRunLogs((current) => [`${response.result.skill_name_text} / ${response.result.scene_name_text}：${response.message_text}`, ...current].slice(0, 8));
      return response.result;
    } catch (error) {
      setArenaResult(null);
      setArenaStageIndex(0);
      const message = error instanceof Error ? error.message : "技能测试场运行失败。";
      setArenaMessage(message);
      setRunLogs((current) => [message, ...current].slice(0, 8));
      return null;
    } finally {
      setArenaRunning(false);
    }
  }

  async function runArena() {
    if (arenaPaused) {
      setArenaMessage("测试已暂停，继续后才能自动推进。");
      return;
    }
    await runArenaRequest(true);
  }

  async function stepArena() {
    if (!arenaResult) {
      await runArenaRequest(false);
      return;
    }
    setArenaStageIndex((current) => Math.min(current + 1, Math.max(0, arenaResult.stages.length - 1)));
    setArenaMessage("已推进一个测试阶段。");
  }

  function pauseArena() {
    setArenaPaused((current) => {
      const next = !current;
      setArenaMessage(next ? "测试已暂停。" : "测试已继续。");
      return next;
    });
  }

  function resetArena() {
    setArenaResult(null);
    setArenaStageIndex(0);
    setArenaPaused(false);
    setArenaMessage("测试场已重置。");
  }

  function saveCameraSettings() {
    const nextSettings = normalizeSkillEditorCameraSettings({ zoom: cameraZoomDraft });
    saveSkillEditorCameraSettings(nextSettings);
    onCameraSettingsChange(nextSettings);
    setCameraZoomDraft(nextSettings.zoom);
    setCameraMessage("镜头 POV 已保存，并应用到所有测试场景。");
  }

  const timelineEvents = arenaResult?.event_timeline ?? [];
  const selectedTimelineEvent = timelineEvents.find((event) => event.type === selectedEventType) ?? timelineEvents[0] ?? null;
  const supportedEventTypes = (arenaResult?.timeline_supported_types.length ? arenaResult.timeline_supported_types : [
    { type: "cast_start", text: "释放开始" },
    { type: "projectile_spawn", text: "投射物生成" },
    { type: "projectile_hit", text: "投射物命中" },
    { type: "damage", text: "伤害结算" },
    { type: "hit_vfx", text: "命中特效" },
    { type: "floating_text", text: "伤害浮字" },
    { type: "cooldown_update", text: "冷却更新" }
  ]);
  const isProjectileEventSelected = selectedEventType === "projectile_spawn"
    || selectedEventType === "projectile_hit"
    || selectedEventType === "area_spawn"
    || isProjectileSkillTemplate(draft?.behavior.template)
    || draft?.behavior.template === "player_nova"
    || draft?.behavior.template === "melee_arc"
    || draft?.behavior.template === "damage_zone"
    || draft?.behavior.template === "chain"
    || draft?.behavior.template === "module_chain";
  const draftPreview = draft ? projectileDebugPreviewFromDraft(draft, selectedArenaScene) : null;
  const eventDebug = projectileDebugFromEvent(selectedTimelineEvent) ?? draftPreview;

  if (launchAdjustmentActive) {
    return (
      <section className="skill-editor-overlay skill-editor-overlay-adjusting" aria-label="发射位置直接调整">
        <LaunchPointAdjustmentOverlay
          worldPosition={currentLaunchWorldPosition}
          offset={currentLaunchOffset}
          battleCamera={battleCamera}
          onDragWorldPosition={updateLaunchPointFromWorld}
          onConfirm={confirmLaunchPointAdjustment}
          onCancel={cancelLaunchPointAdjustment}
        />
      </section>
    );
  }

  return (
    <section className="skill-editor-overlay" aria-label="技能编辑器">
      <div className="skill-editor-shell">
        <header className="skill-editor-header">
          <div>
            <h2>{editor.title_text}</h2>
            <p>{editor.subtitle_text}</p>
          </div>
          <button className="skill-editor-close" type="button" onClick={onClose}>
            关闭
          </button>
        </header>

        <div className="skill-editor-workspace">
          <aside className="skill-editor-left-pane" aria-label="技能与事件列表">
            <section className="skill-editor-pane-section">
              <h3>技能列表</h3>
              <ul className="skill-editor-compact-list">
                {editor.entries.map((entry) => (
                  <li key={entry.id} className={`skill-editor-entry ${entry.openable ? "skill-editor-entry-openable" : "skill-editor-entry-locked"}`}>
                    <div>
                      <strong>{entry.name_text}</strong>
                      <code>{entry.id}</code>
                      <span>{entry.status_text}</span>
                    </div>
                    {entry.openable ? (
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(entry.id);
                          if (testArena.skills.find((skill) => skill.id === entry.id)?.testable) {
                            setArenaSkillId(entry.id);
                            setArenaResult(null);
                            setArenaStageIndex(0);
                            setSelectedEventType("projectile_spawn");
                          }
                        }}
                        aria-pressed={selectedEntry?.id === entry.id}
                      >
                        打开
                      </button>
                    ) : (
                      <span className="skill-editor-locked-text">不可打开</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <section className="skill-editor-pane-section">
              <h3>事件类型列表</h3>
              <div className="skill-editor-event-type-list">
                {supportedEventTypes.map((eventType) => (
                  <button
                    key={eventType.type}
                    type="button"
                    className={selectedEventType === eventType.type ? "active" : ""}
                    onClick={() => setSelectedEventType(eventType.type)}
                  >
                    {eventType.text}
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <main className="skill-editor-middle-pane" aria-label="技能事件列表">
            {selectedEntry && detail ? (
              <>
                <div className="skill-editor-detail-heading">
                  <div>
                    <h3>{selectedEntry.name_text}</h3>
                    <p>中间显示当前技能逻辑事件；运行预览后显示真实技能事件时间线。</p>
                  </div>
                  <span className={selectedEntry.schema_status.is_valid ? "skill-editor-status-pass" : "skill-editor-status-fail"}>
                    {selectedEntry.schema_status.text}
                  </span>
                </div>
                {selectedEntry.schema_status.errors.length > 0 && (
                  <div className="skill-editor-errors" role="alert">
                    {selectedEntry.schema_status.errors.map((error) => <p key={error}>{error}</p>)}
                  </div>
                )}
                <dl className="skill-editor-fields">
                  <ReadOnlyField label="技能中文名" value={selectedEntry.name_text} />
                  <ReadOnlyField label="技能配置来源" value="正式技能配置文件" />
                  <ReadOnlyField label="行为模板" value={selectedEntry.behavior_template} />
                  <ReadOnlyField label="结构校验状态" value={selectedEntry.schema_status.text} />
                </dl>
                <SkillEditorEventList
                  supportedEventTypes={supportedEventTypes}
                  timelineEvents={timelineEvents}
                  selectedEventType={selectedEventType}
                  onSelectEventType={setSelectedEventType}
                />
                {arenaResult && currentArenaStage ? (
                  <SkillTestArenaResultView result={arenaResult} stage={currentArenaStage} stageIndex={arenaStageIndex} />
                ) : (
                  <div className="skill-test-arena-result">
                    <h5>预览等待运行</h5>
                    <p>点击底部“运行预览”后，这里会显示测试场结果和真实技能事件时间线。</p>
                  </div>
                )}
              </>
            ) : (
              <p className="skill-editor-empty">该技能尚未迁移为技能包，当前不可打开。</p>
            )}
          </main>

          <aside className="skill-editor-right-pane" aria-label="选中事件参数面板">
            {draft && selectedEntry ? (
              <>
                <div className="skill-editor-parameter-heading">
                  <h3>当前选中事件参数</h3>
                  <p>{supportedEventTypes.find((eventType) => eventType.type === selectedEventType)?.text ?? "未识别事件"}</p>
                </div>
                {validationErrors.length > 0 && (
                  <div className="skill-editor-errors" role="alert">
                    {validationErrors.map((error) => <p key={error}>{error}</p>)}
                  </div>
                )}
                {isProjectileEventSelected ? (
                  <ProjectileParameterPanel
                    draft={draft}
                    canEdit={canEdit}
                    editor={editor}
                    debugOptions={debugOptions}
                    eventDebug={eventDebug}
                    canAdjustLaunchPoint={canAdjustLaunchPoint}
                    onBeginLaunchPointAdjustment={beginLaunchPointAdjustment}
                    onDebugOptionsChange={onDebugOptionsChange}
                    updateDraft={updateDraft}
                  />
                ) : (
                  <GenericEventParameterPanel event={selectedTimelineEvent} selectedEventType={selectedEventType} />
                )}
                <EditorSection title={modifierStack.panel_title_text}>
                  <div className="skill-editor-modifier-stack">
                    <p className="skill-editor-test-notice">{modifierStack.notice_text}</p>
                    <div className="skill-editor-modifier-controls">
                      <SelectInput label={modifierStack.relation_label_text} value={testRelation} options={modifierStack.relation_options} onChange={setTestRelation} />
                      <NumberInput label="来源强度" value={sourcePower} min={modifierStack.power_limits.min} onChange={setSourcePower} />
                      <NumberInput label="目标强度" value={targetPower} min={modifierStack.power_limits.min} onChange={setTargetPower} />
                      <NumberInput label="导管强度" value={conduitPower} min={modifierStack.power_limits.min} onChange={setConduitPower} />
                    </div>
                    <div className="skill-editor-actions">
                      <button type="button" disabled={modifierPreviewing} onClick={applyTestModifiers}>
                        {modifierPreviewing ? "计算中" : modifierStack.apply_button_text}
                      </button>
                      <button type="button" disabled={selectedModifierIds.length === 0} onClick={clearTestModifiers}>
                        {modifierStack.clear_button_text}
                      </button>
                    </div>
                    <div className="skill-editor-modifier-list">
                      {modifierStack.available_modifiers.slice(0, 8).map((modifier) => {
                        const selected = selectedModifierIds.includes(modifier.id);
                        return (
                          <article key={modifier.id} className="skill-editor-modifier-card">
                            <div>
                              <strong>{modifier.name_text}</strong>
                              <span>{modifier.description_text}</span>
                            </div>
                            <button type="button" disabled={selected} onClick={() => addTestModifier(modifier.id)}>
                              {selected ? "已加入" : "加入测试栈"}
                            </button>
                          </article>
                        );
                      })}
                    </div>
                    {modifierMessage && (
                      <p className={modifierMessage.includes("失败") || modifierMessage.includes("必须") ? "skill-editor-save-error" : "skill-editor-save-ok"} role="status">
                        {modifierMessage}
                      </p>
                    )}
                    {modifierPreview && <ModifierPreviewResult preview={modifierPreview} />}
                  </div>
                </EditorSection>
              </>
            ) : (
              <p className="skill-editor-empty">当前没有可编辑参数。</p>
            )}
          </aside>
        </div>

        <footer className="skill-editor-bottom-bar" aria-label="运行保存与校验">
          <div className="skill-test-arena-controls">
            <label className="skill-editor-field">
              <span>测试技能</span>
              <select
                value={arenaSkillId}
                onChange={(event) => {
                  setArenaSkillId(event.target.value);
                  setArenaResult(null);
                  setArenaStageIndex(0);
                  setArenaMessage("");
                }}
              >
                {testArena.skills.map((skill) => (
                  <option key={skill.id} value={skill.id} disabled={!skill.testable}>
                    {skill.name_text}（{skill.status_text}）
                  </option>
                ))}
              </select>
            </label>
            <SelectInput
              label="测试场景"
              value={selectedArenaScene?.scene_id ?? ""}
              options={testArena.scenes.map((scene) => ({ value: scene.scene_id, text: scene.name_text }))}
              onChange={(value) => {
                setArenaSceneId(value);
                setArenaResult(null);
                setArenaStageIndex(0);
                setArenaMessage("");
              }}
            />
            <CheckboxInput
              label="启用测试词缀栈"
              checked={arenaUseModifierStack}
              onChange={(value) => {
                setArenaUseModifierStack(value);
                setArenaResult(null);
                setArenaStageIndex(0);
              }}
            />
            <NumberInput
              label="镜头 POV"
              value={cameraZoomDraft}
              min={SKILL_EDITOR_CAMERA_MIN_ZOOM}
              max={SKILL_EDITOR_CAMERA_MAX_ZOOM}
              onChange={(value) => {
                setCameraZoomDraft(value);
                setCameraMessage("");
              }}
            />
          </div>
          <div className="skill-editor-actions">
            <button type="button" disabled={arenaRunning || arenaPaused || !selectedArenaSkill?.testable} onClick={runArena}>
              {arenaRunning ? "运行中" : "运行预览"}
            </button>
            <button type="button" disabled={arenaRunning} onClick={pauseArena}>
              {arenaPaused ? "继续" : "暂停"}
            </button>
            <button type="button" disabled={arenaRunning || !selectedArenaSkill?.testable} onClick={stepArena}>
              单步
            </button>
            <button type="button" disabled={arenaRunning} onClick={resetArena}>
              重置
            </button>
            <button type="button" disabled={!canEdit || saving} onClick={saveDraft}>
              {saving ? "保存中" : "保存技能包"}
            </button>
            <button type="button" onClick={saveCameraSettings}>
              保存镜头参数
            </button>
          </div>
          <div className="skill-editor-bottom-feedback">
            {cameraMessage && (
              <p className="skill-editor-save-ok" role="status">
                {cameraMessage}
              </p>
            )}
            {arenaMessage && (
              <p className={arenaMessage.includes("失败") || arenaMessage.includes("不可") || arenaMessage.includes("必须") ? "skill-editor-save-error" : "skill-editor-save-ok"} role="status">
                {arenaMessage}
              </p>
            )}
            {saveMessage && (
              <p className={saveMessage.includes("成功") ? "skill-editor-save-ok" : "skill-editor-save-error"} role="status">
                {saveMessage}
              </p>
            )}
            <div className="skill-editor-runtime-perf" aria-label="运行性能摘要">
              <strong>运行性能</strong>
              <span>帧耗时 {formatPreviewNumber(runtimePerfSummary.frame_ms)} 毫秒</span>
              <span>逻辑 {formatPreviewNumber(runtimePerfSummary.logic_ms)} 毫秒</span>
              <span>事件 {runtimePerfSummary.consumed_events_this_frame} / 排队 {runtimePerfSummary.scheduled_events}</span>
              <span>对象 投射物 {runtimePerfSummary.active_projectiles}，特效 {runtimePerfSummary.active_hit_vfx + runtimePerfSummary.active_area_vfx}，浮字 {runtimePerfSummary.active_floating_text}</span>
              <span>掉帧 {runtimePerfSummary.dropped_frame_count}</span>
            </div>
            <div className="skill-editor-run-log" aria-label="运行日志">
              <strong>运行日志</strong>
              {runLogs.length > 0 ? runLogs.map((log, index) => <span key={`${log}-${index}`}>{log}</span>) : <span>暂无运行日志。</span>}
            </div>
          </div>
        </footer>
      </div>
    </section>
  );

  return (
    <section className="skill-editor-overlay" aria-label="技能编辑器">
      <div className="skill-editor-shell">
        <header className="skill-editor-header">
          <div>
            <h2>{editor.title_text}</h2>
            <p>{editor.subtitle_text}</p>
          </div>
          <button className="skill-editor-close" type="button" onClick={onClose}>
            关闭
          </button>
        </header>
        <div className="skill-editor-body">
          <aside className="skill-editor-list" aria-label="技能文件列表">
            <h3>技能文件列表</h3>
            <ul>
              {editor.entries.map((entry) => (
                <li key={entry.id} className={`skill-editor-entry ${entry.openable ? "skill-editor-entry-openable" : "skill-editor-entry-locked"}`}>
                  <div>
                    <strong>{entry.name_text}</strong>
                    <code>{entry.id}</code>
                    <span>{entry.status_text}</span>
                  </div>
                  {entry.openable ? (
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(entry.id);
                        if (testArena.skills.find((skill) => skill.id === entry.id)?.testable) {
                          setArenaSkillId(entry.id);
                          setArenaResult(null);
                          setArenaStageIndex(0);
                        }
                      }}
                      aria-pressed={selectedEntry?.id === entry.id}
                    >
                      打开
                    </button>
                  ) : (
                    <span className="skill-editor-locked-text">不可打开</span>
                  )}
                </li>
              ))}
            </ul>
          </aside>
          <section className="skill-editor-detail" aria-label="技能包详情">
            {selectedEntry && detail ? (
              <>
                <div className="skill-editor-detail-heading">
                  <div>
                    <h3>{selectedEntry.name_text}</h3>
                    <p>仅编辑已迁移技能包允许的字段，保存前执行结构和白名单校验。</p>
                  </div>
                  <span className={selectedEntry.schema_status.is_valid ? "skill-editor-status-pass" : "skill-editor-status-fail"}>
                    {selectedEntry.schema_status.text}
                  </span>
                </div>
                {selectedEntry.schema_status.errors.length > 0 && (
                  <div className="skill-editor-errors" role="alert">
                    {selectedEntry.schema_status.errors.map((error) => <p key={error}>{error}</p>)}
                  </div>
                )}
                <dl className="skill-editor-fields">
                  <ReadOnlyField label="技能中文名" value={selectedEntry.name_text} />
                  <ReadOnlyField label="技能配置来源" value="正式技能配置文件" />
                  <ReadOnlyField label="行为模板" value={selectedEntry.behavior_template} />
                  <ReadOnlyField label="结构校验状态" value={selectedEntry.schema_status.text} />
                </dl>
                {draft ? (
                  <div className="skill-editor-form">
                    <EditorSection title="基础信息模块">
                      <div className="skill-editor-form-grid">
                        <ReadOnlyInput label="技能编号（只读）" value={draft.id} />
                        <TextInput label="版本" value={draft.version} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.version = value; })} />
                        <TextInput label="名称本地化键" value={draft.display.name_key} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.display.name_key = value; })} />
                        <TextInput label="描述本地化键" value={draft.display.description_key} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.display.description_key = value; })} />
                        <SelectInput
                          label="伤害类型"
                          value={draft.classification.damage_type}
                          options={editor.options.damage_types}
                          disabled={!canEdit}
                          onChange={(value) => updateDraft((next) => { next.classification.damage_type = value; })}
                        />
                        <SelectInput
                          label="伤害形式"
                          value={draft.classification.damage_form}
                          options={editor.options.damage_forms}
                          disabled={!canEdit}
                          onChange={(value) => updateDraft((next) => { next.classification.damage_form = value; })}
                        />
                        <EditableStringList
                          label="分类标签"
                          values={draft.classification.tags}
                          disabled={!canEdit}
                          onChange={(values) => updateDraft((next) => { next.classification.tags = values; })}
                        />
                      </div>
                    </EditorSection>
                    <EditorSection title="释放参数模块">
                      <div className="skill-editor-form-grid">
                        <SelectInput
                          label="释放模式"
                          value={draft.cast.mode}
                          options={editor.options.cast_modes}
                          disabled={!canEdit}
                          onChange={(value) => updateDraft((next) => { next.cast.mode = value; })}
                        />
                        <SelectInput
                          label="目标选择"
                          value={draft.cast.target_selector}
                          options={editor.options.target_selectors}
                          disabled={!canEdit}
                          onChange={(value) => updateDraft((next) => { next.cast.target_selector = value; })}
                        />
                        <NumberInput label="搜索范围" value={draft.cast.search_range} min={0} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.cast.search_range = value; })} />
                        <NumberInput label="冷却毫秒" value={draft.cast.cooldown_ms} min={0} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.cast.cooldown_ms = value; })} />
                        <NumberInput label="前摇毫秒" value={draft.cast.windup_ms} min={0} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.cast.windup_ms = value; })} />
                        <NumberInput label="后摇毫秒" value={draft.cast.recovery_ms} min={0} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.cast.recovery_ms = value; })} />
                      </div>
                    </EditorSection>
                    <EditorSection title={draft.behavior.template === "damage_zone" ? "伤害结算区域" : draft.behavior.template === "player_nova" ? "范围新星模块" : draft.behavior.template === "melee_arc" ? "近战扇形模块" : draft.behavior.template === "chain" ? "连锁模块" : "投射物模块"}>
                      <div className="skill-editor-form-grid">
                        {draft.behavior.template === "damage_zone" ? (
                          <>
                            <SelectInput label="结算区域类型" value={String(projectileParams?.shape ?? "circle")} options={editor.options.zone_shapes} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.shape = value; })} />
                            <SelectInput label="起点规则" value={String(projectileParams?.origin_policy ?? "caster")} options={editor.options.origin_policies} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.origin_policy = value; })} />
                            <SelectInput label="朝向规则" value={String(projectileParams?.facing_policy ?? "none")} options={editor.options.facing_policies} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.facing_policy = value; })} />
                            {String(projectileParams?.shape ?? "circle") === "rectangle" ? (
                              <>
                                <NumberInput label="长" value={numberValue(projectileParams?.length, 1)} min={1} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.length = value; })} />
                                <NumberInput label="宽" value={numberValue(projectileParams?.width, 1)} min={1} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.width = value; })} />
                                <NumberInput label="角度" value={numberValue(projectileParams?.angle_offset_deg, 0)} min={-180} max={180} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.angle_offset_deg = value; })} />
                              </>
                            ) : (
                              <>
                                <NumberInput label="半径" value={numberValue(projectileParams?.radius, 1)} min={1} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.radius = value; })} />
                                <ReadOnlyInput label="角度" value="360°" />
                              </>
                            )}
                            <NumberInput label="命中时机毫秒" value={numberValue(projectileParams?.hit_at_ms, 0)} min={0} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.hit_at_ms = value; })} />
                            <NumberInput label="最大目标数" value={numberValue(projectileParams?.max_targets, 1)} min={1} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.max_targets = value; })} />
                            <NumberInput label="状态几率倍率" value={numberValue(projectileParams?.status_chance_scale, 1)} min={0} max={10} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.status_chance_scale = value; })} />
                            <TextInput label="区域特效键" value={String(projectileParams?.zone_vfx_key ?? "")} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.zone_vfx_key = value; })} />
                            <ReadOnlyInput label="只读范围摘要" value={damageZoneRangeSummary(draft)} />
                            <ReadOnlyInput label="只读命中时机摘要" value={damageZoneHitTimingSummary(draft)} />
                          </>
                        ) : draft.behavior.template === "player_nova" ? (
                          <>
                            <NumberInput label="半径" value={numberValue(projectileParams?.radius, 1)} min={1} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.radius = value; })} />
                            <NumberInput label="扩散时长毫秒" value={numberValue(projectileParams?.expand_duration_ms, 0)} min={0} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.expand_duration_ms = value; })} />
                            <NumberInput label="命中时机毫秒" value={numberValue(projectileParams?.hit_at_ms, 0)} min={0} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.hit_at_ms = value; })} />
                            <NumberInput label="最大目标数" value={numberValue(projectileParams?.max_targets, 1)} min={1} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.max_targets = value; })} />
                            <SelectInput
                              label="中心规则"
                              value={String(projectileParams?.center_policy ?? "player_center")}
                              options={editor.options.center_policies}
                              disabled={!canEdit}
                              onChange={(value) => updateDraft((next) => { next.behavior.params.center_policy = value; })}
                            />
                            <SelectInput
                              label="距离衰减"
                              value={String(projectileParams?.damage_falloff_by_distance ?? "none")}
                              options={editor.options.damage_falloff_modes}
                              disabled={!canEdit}
                              onChange={(value) => updateDraft((next) => { next.behavior.params.damage_falloff_by_distance = value; })}
                            />
                            <NumberInput label="新星环宽" value={numberValue(projectileParams?.ring_width, 1)} min={1} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.ring_width = value; })} />
                            <NumberInput label="状态几率倍率" value={numberValue(projectileParams?.status_chance_scale, 1)} min={0} max={10} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.status_chance_scale = value; })} />
                            <ReadOnlyInput label="只读范围摘要" value={playerNovaRangeSummary(draft)} />
                            <ReadOnlyInput label="只读命中时机摘要" value={playerNovaHitTimingSummary(draft)} />
                          </>
                        ) : draft.behavior.template === "melee_arc" ? (
                          <>
                            <NumberInput label="扇形角度" value={numberValue(projectileParams?.arc_angle, 1)} min={1} max={180} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.arc_angle = value; })} />
                            <NumberInput label="扇形半径" value={numberValue(projectileParams?.arc_radius, 1)} min={1} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.arc_radius = value; })} />
                            <NumberInput label="前摇毫秒" value={numberValue(projectileParams?.windup_ms, 0)} min={0} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.windup_ms = value; })} />
                            <NumberInput label="命中时机毫秒" value={numberValue(projectileParams?.hit_at_ms, 0)} min={0} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.hit_at_ms = value; })} />
                            <NumberInput label="最大目标数" value={numberValue(projectileParams?.max_targets, 1)} min={1} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.max_targets = value; })} />
                            <SelectInput label="朝向规则" value={String(projectileParams?.facing_policy ?? "nearest_target")} options={editor.options.facing_policies} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.facing_policy = value; })} />
                            <SelectInput label="命中形状" value={String(projectileParams?.hit_shape ?? "sector")} options={editor.options.hit_shapes} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.hit_shape = value; })} />
                            <NumberInput label="状态几率倍率" value={numberValue(projectileParams?.status_chance_scale, 1)} min={0} max={10} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.status_chance_scale = value; })} />
                            <TextInput label="斩击特效键" value={String(projectileParams?.slash_vfx_key ?? "")} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.slash_vfx_key = value; })} />
                            <ReadOnlyInput label="只读扇形范围摘要" value={meleeArcRangeSummary(draft)} />
                            <ReadOnlyInput label="只读命中时机摘要" value={meleeArcHitTimingSummary(draft)} />
                          </>
                        ) : draft.behavior.template === "chain" ? (
                          <>
                            <NumberInput label="连锁次数" value={numberValue(projectileParams?.chain_count, 1)} min={1} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.chain_count = value; })} />
                            <NumberInput label="连锁半径" value={numberValue(projectileParams?.chain_radius, 1)} min={1} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.chain_radius = value; })} />
                            <NumberInput label="连锁间隔毫秒" value={numberValue(projectileParams?.chain_delay_ms, 0)} min={0} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.chain_delay_ms = value; })} />
                            <NumberInput label="每跳伤害衰减" value={numberValue(projectileParams?.damage_falloff_per_chain, 0)} min={0} max={1} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.damage_falloff_per_chain = value; })} />
                            <SelectInput label="连锁目标规则" value={String(projectileParams?.target_policy ?? "nearest_not_hit")} options={editor.options.chain_target_policies} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.target_policy = value; })} />
                            <CheckboxInput label="允许重复命中" checked={Boolean(projectileParams?.allow_repeat_target ?? false)} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.allow_repeat_target = value; })} />
                            <NumberInput label="最大目标数" value={numberValue(projectileParams?.max_targets, 1)} min={1} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.max_targets = value; })} />
                            <TextInput label="连锁段特效键" value={String(projectileParams?.segment_vfx_key ?? "")} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.segment_vfx_key = value; })} />
                            <ReadOnlyInput label="只读最大链段摘要" value={chainSegmentSummary(draft)} />
                            <ReadOnlyInput label="只读预计链总时长摘要" value={chainDurationSummary(draft)} />
                          </>
                        ) : (
                          <>
                            <NumberInput label="投射物数量" value={numberValue(projectileParams?.projectile_count, 1)} min={1} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.projectile_count = value; })} />
                            <NumberInput label="连发间隔毫秒" value={numberValue(projectileParams?.burst_interval_ms, 0)} min={0} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.burst_interval_ms = value; })} />
                            <NumberInput label="散射角度" value={numberValue(projectileParams?.spread_angle_deg, 0)} min={0} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.spread_angle_deg = value; })} />
                            <NumberInput label="随机角度偏移" value={numberValue(projectileParams?.random_angle_jitter_deg, 0)} min={0} max={45} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.random_angle_jitter_deg = value; })} />
                            <NumberInput label="投射物速度" value={numberValue(projectileParams?.projectile_speed, 1)} min={1} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.projectile_speed = value; })} />
                            <NumberInput label="投射物宽度" value={numberValue(projectileParams?.projectile_width, 1)} min={1} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.projectile_width = value; })} />
                            <NumberInput label="投射物高度" value={numberValue(projectileParams?.projectile_height, 1)} min={1} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.projectile_height = value; })} />
                            <NumberInput label="最大距离" value={numberValue(projectileParams?.max_distance, 1)} min={1} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.max_distance = value; })} />
                            <SelectInput
                              label="命中规则"
                              value={String(projectileParams?.hit_policy ?? "first_hit")}
                              options={editor.options.hit_policies}
                              disabled={!canEdit}
                              onChange={(value) => updateDraft((next) => { next.behavior.params.hit_policy = value; })}
                            />
                            <NumberInput label="贯穿次数" value={numberValue(projectileParams?.pierce_count, 0)} min={0} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.pierce_count = value; })} />
                            <NumberInput label="碰撞半径" value={numberValue(projectileParams?.collision_radius, 0)} min={0} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.collision_radius = value; })} />
                            <NumberInput label="生成偏移横向" value={numberValue(projectileParams?.spawn_offset?.x, 0)} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.spawn_offset = { ...(next.behavior.params.spawn_offset ?? { x: 0, y: 0 }), x: value }; })} />
                            <NumberInput label="生成偏移纵向" value={numberValue(projectileParams?.spawn_offset?.y, 0)} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.spawn_offset = { ...(next.behavior.params.spawn_offset ?? { x: 0, y: 0 }), y: value }; })} />
                            <ReadOnlyInput label="只读飞行时间" value={`${projectileTravelDurationMs(draft)} ms`} />
                          </>
                        )}
                      </div>
                    </EditorSection>
                    <EditorSection title="伤害点模块">
                      <div className="skill-editor-form-grid">
                        <NumberInput label="基础伤害" value={draft.hit.base_damage} min={0} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.hit.base_damage = value; })} />
                        <CheckboxInput label="可以暴击" checked={draft.hit.can_crit} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.hit.can_crit = value; })} />
                        <CheckboxInput label="可以施加状态" checked={draft.hit.can_apply_status} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.hit.can_apply_status = value; })} />
                        <SelectInput
                          label="伤害时机"
                          value={draft.hit.damage_timing ?? "on_projectile_hit"}
                          options={editor.options.damage_timings}
                          disabled={!canEdit}
                          onChange={(value) => updateDraft((next) => { next.hit.damage_timing = value; })}
                        />
                        <NumberInput label="命中延迟毫秒" value={numberValue(draft.hit.hit_delay_ms, 0)} min={0} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.hit.hit_delay_ms = value; })} />
                        <NumberInput label="命中半径" value={numberValue(draft.hit.hit_radius, 0)} min={0} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.hit.hit_radius = value; })} />
                        <SelectInput
                          label="目标规则"
                          value={draft.hit.target_policy ?? "selected_target"}
                          options={editor.options.target_policies}
                          disabled={!canEdit}
                          onChange={(value) => updateDraft((next) => { next.hit.target_policy = value; })}
                        />
                        <ReadOnlyInput label="伤害类型" value={draft.classification.damage_type} />
                        <ReadOnlyInput label="伤害形式" value={draft.classification.damage_form} />
                      </div>
                    </EditorSection>
                    <EditorSection title="表现模块">
                      <div className="skill-editor-form-grid">
                        <TextInput label="释放特效键" value={draft.presentation.cast_vfx_key ?? ""} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.cast_vfx_key = value; })} />
                        <TextInput label="投射物特效键" value={draft.presentation.projectile_vfx_key ?? ""} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.projectile_vfx_key = value; })} />
                        <TextInput label="命中特效键" value={draft.presentation.hit_vfx_key ?? ""} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.hit_vfx_key = value; })} />
                        <NumberInput label="特效放大倍数" value={numberValue(draft.presentation.vfx_scale, 1)} min={0.1} max={10} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.vfx_scale = value; })} />
                        <TextInput label="音效键" value={draft.presentation.sfx} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.sfx = value; })} />
                        <TextInput label="浮字样式键" value={draft.presentation.floating_text_style ?? ""} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.floating_text_style = value; })} />
                        <NumberInput label="命中停顿毫秒" value={numberValue(draft.presentation.hit_stop_ms, 0)} min={0} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.hit_stop_ms = value; })} />
                        <NumberInput label="镜头震动" value={numberValue(draft.presentation.camera_shake, 0)} min={0} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.camera_shake = value; })} />
                        <ReadOnlyInput label="通用特效键" value={draft.presentation.vfx} />
                        <ReadOnlyInput label="浮字键" value={draft.presentation.floating_text} />
                        <ReadOnlyInput label="屏幕反馈键" value={draft.presentation.screen_feedback} />
                      </div>
                    </EditorSection>
                    <EditorSection title="预览字段模块">
                      <CheckboxList
                        label="预览字段"
                        values={draft.preview.show_fields}
                        options={editor.options.preview_fields}
                        disabled={!canEdit}
                        onChange={(values) => updateDraft((next) => { next.preview.show_fields = values; })}
                      />
                    </EditorSection>
                    <EditorSection title={modifierStack.panel_title_text}>
                      <div className="skill-editor-modifier-stack">
                        <p className="skill-editor-test-notice">{modifierStack.notice_text}</p>
                        <div className="skill-editor-modifier-controls">
                          <SelectInput
                            label={modifierStack.relation_label_text}
                            value={testRelation}
                            options={modifierStack.relation_options}
                            onChange={setTestRelation}
                          />
                          <NumberInput label="来源强度" value={sourcePower} min={modifierStack.power_limits.min} onChange={setSourcePower} />
                          <NumberInput label="目标强度" value={targetPower} min={modifierStack.power_limits.min} onChange={setTargetPower} />
                          <NumberInput label="导管强度" value={conduitPower} min={modifierStack.power_limits.min} onChange={setConduitPower} />
                        </div>
                        <div className="skill-editor-modifier-columns">
                          <div className="skill-editor-modifier-column">
                            <h5>{modifierStack.available_title_text}</h5>
                            <div className="skill-editor-modifier-list">
                              {modifierStack.available_modifiers.map((modifier) => {
                                const selected = selectedModifierIds.includes(modifier.id);
                                return (
                                  <article key={modifier.id} className="skill-editor-modifier-card">
                                    <div>
                                      <strong>{modifier.name_text}</strong>
                                      <span>{modifier.description_text}</span>
                                      <small>{modifier.filter_text}</small>
                                    </div>
                                    <ModifierStatList stats={modifier.stats} />
                                    <button type="button" disabled={selected} onClick={() => addTestModifier(modifier.id)}>
                                      {selected ? "已加入" : "加入测试栈"}
                                    </button>
                                  </article>
                                );
                              })}
                            </div>
                          </div>
                          <div className="skill-editor-modifier-column">
                            <h5>{modifierStack.selected_title_text}</h5>
                            {selectedModifiers.length > 0 ? (
                              <div className="skill-editor-selected-modifiers">
                                {selectedModifiers.map((modifier) => (
                                  <div key={modifier.id} className="skill-editor-selected-modifier">
                                    <span>{modifier.name_text}</span>
                                    <button type="button" onClick={() => removeTestModifier(modifier.id)}>移除</button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="skill-editor-test-empty">尚未选择测试效果。</p>
                            )}
                            <div className="skill-editor-actions">
                              <button type="button" disabled={modifierPreviewing} onClick={applyTestModifiers}>
                                {modifierPreviewing ? "计算中" : modifierStack.apply_button_text}
                              </button>
                              <button type="button" disabled={selectedModifierIds.length === 0} onClick={clearTestModifiers}>
                                {modifierStack.clear_button_text}
                              </button>
                            </div>
                            {modifierMessage && (
                              <p className={modifierMessage.includes("失败") || modifierMessage.includes("必须") ? "skill-editor-save-error" : "skill-editor-save-ok"} role="status">
                                {modifierMessage}
                              </p>
                            )}
                            {modifierPreview && <ModifierPreviewResult preview={modifierPreview} />}
                          </div>
                        </div>
                      </div>
                    </EditorSection>
                    <EditorSection title={testArena.panel_title_text}>
                      <div className="skill-test-arena">
                        <p className="skill-editor-test-notice">{testArena.notice_text}</p>
                        <div className="skill-test-arena-controls">
                          <label className="skill-editor-field">
                            <span>测试技能</span>
                            <select
                              value={arenaSkillId}
                              onChange={(event) => {
                                setArenaSkillId(event.target.value);
                                setArenaResult(null);
                                setArenaStageIndex(0);
                                setArenaMessage("");
                              }}
                            >
                              {testArena.skills.map((skill) => (
                                <option key={skill.id} value={skill.id} disabled={!skill.testable}>
                                  {skill.name_text}（{skill.status_text}）
                                </option>
                              ))}
                            </select>
                          </label>
                          <SelectInput
                            label="测试场景"
                            value={selectedArenaScene?.scene_id ?? ""}
                            options={testArena.scenes.map((scene) => ({ value: scene.scene_id, text: scene.name_text }))}
                            onChange={(value) => {
                              setArenaSceneId(value);
                              setArenaResult(null);
                              setArenaStageIndex(0);
                              setArenaMessage("");
                            }}
                          />
                          <CheckboxInput
                            label="启用测试词缀栈"
                            checked={arenaUseModifierStack}
                            onChange={(value) => {
                              setArenaUseModifierStack(value);
                              setArenaResult(null);
                              setArenaStageIndex(0);
                            }}
                          />
                        </div>
                        <div className="skill-editor-actions">
                          <button type="button" disabled={arenaRunning || arenaPaused || !selectedArenaSkill?.testable} onClick={runArena}>
                            {arenaRunning ? "运行中" : "运行测试"}
                          </button>
                          <button type="button" disabled={arenaRunning} onClick={pauseArena}>
                            {arenaPaused ? "继续" : "暂停"}
                          </button>
                          <button type="button" disabled={arenaRunning || !selectedArenaSkill?.testable} onClick={stepArena}>
                            单步
                          </button>
                          <button type="button" disabled={arenaRunning} onClick={resetArena}>
                            重置
                          </button>
                        </div>
                        {arenaMessage && (
                          <p className={arenaMessage.includes("失败") || arenaMessage.includes("不可") || arenaMessage.includes("必须") ? "skill-editor-save-error" : "skill-editor-save-ok"} role="status">
                            {arenaMessage}
                          </p>
                        )}
                        {selectedArenaScene && !arenaResult && (
                          <div className="skill-test-arena-result">
                            <h5>{selectedArenaScene.name_text}</h5>
                            <MonsterLifeList monsters={selectedArenaScene.enemies} />
                            <p>选择场景后点击运行测试或单步，结果只在本次编辑器会话中生效。</p>
                          </div>
                        )}
                        {arenaResult && currentArenaStage && (
                          <SkillTestArenaResultView
                            result={arenaResult}
                            stage={currentArenaStage}
                            stageIndex={arenaStageIndex}
                          />
                        )}
                      </div>
                    </EditorSection>
                    <div className="skill-editor-actions">
                      <button type="button" disabled={!canEdit || saving} onClick={saveDraft}>
                        {saving ? "保存中" : "保存技能包"}
                      </button>
                      {saveMessage && (
                        <p className={saveMessage.includes("成功") ? "skill-editor-save-ok" : "skill-editor-save-error"} role="status">
                          {saveMessage}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="skill-editor-empty">当前技能包未通过校验，修复配置后才能编辑。</p>
                )}
              </>
            ) : (
              <p className="skill-editor-empty">该技能尚未迁移为技能包，当前不可打开。</p>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}

type ProjectileDebugSnapshot = {
  spawn: { x: number; y: number };
  vfxSpawn: { x: number; y: number };
  target: { x: number; y: number };
  direction: { x: number; y: number };
  vfxDirection: { x: number; y: number };
};

function LaunchPointAdjustmentOverlay({
  worldPosition,
  offset,
  battleCamera,
  onDragWorldPosition,
  onConfirm,
  onCancel
}: {
  worldPosition: { x: number; y: number };
  offset: { x: number; y: number };
  battleCamera: Camera2D;
  onDragWorldPosition: (worldPosition: { x: number; y: number }) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const viewportPoint = battleWorldToViewport(worldPosition, battleCamera);

  function updateFromPointer(event: ReactPointerEvent<HTMLElement>) {
    onDragWorldPosition(viewportToBattleWorld(event.clientX, event.clientY, battleCamera));
  }

  function startDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    updateFromPointer(event);
  }

  function moveDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!dragging) return;
    event.preventDefault();
    updateFromPointer(event);
  }

  function endDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
  }

  return (
    <>
      <div className="skill-editor-adjustment-toolbar" role="status" aria-live="polite">
        <div>
          <strong>拖拽调整发射点</strong>
          <span>当前偏移：x {formatPreviewNumber(offset.x)}，y {formatPreviewNumber(offset.y)}</span>
        </div>
        <div className="skill-editor-adjustment-actions">
          <button type="button" onClick={onConfirm}>确认位置</button>
          <button type="button" onClick={onCancel}>取消</button>
        </div>
      </div>
      <button
        className={`skill-editor-launch-drag-handle ${dragging ? "dragging" : ""}`}
        type="button"
        aria-label="拖拽发射点"
        title="拖拽发射点"
        style={{ left: viewportPoint.x, top: viewportPoint.y }}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <span />
      </button>
    </>
  );
}

function battleAnchorX() {
  return window.innerWidth * 0.5;
}

function battleAnchorY() {
  return window.innerHeight * 0.58;
}

function battleWorldToViewport(worldPosition: { x: number; y: number }, camera: Camera2D) {
  const screen = projectBattleWorldToScreen(worldPosition.x, worldPosition.y);
  return {
    x: battleAnchorX() + camera.zoom * (screen.x - camera.screenX),
    y: battleAnchorY() + camera.zoom * (screen.y - camera.screenY)
  };
}

function viewportToBattleWorld(clientX: number, clientY: number, camera: Camera2D) {
  const terrainScreenX = (clientX - battleAnchorX()) / camera.zoom + camera.screenX;
  const terrainScreenY = (clientY - battleAnchorY()) / camera.zoom + camera.screenY;
  void unprojectScreenToWorld;
  return { x: terrainScreenX, y: terrainScreenY };
}

function SkillEditorEventList({
  supportedEventTypes,
  timelineEvents,
  selectedEventType,
  onSelectEventType
}: {
  supportedEventTypes: { type: string; text: string }[];
  timelineEvents: SkillEventTimelineItem[];
  selectedEventType: string;
  onSelectEventType: (type: string) => void;
}) {
  const groupedEvents = timelineEvents.length > 0 ? timelineEvents.slice(0, MAX_SKILL_EDITOR_TIMELINE_ROWS) : [];
  const hiddenEventCount = Math.max(0, timelineEvents.length - groupedEvents.length);
  return (
    <section className="skill-editor-event-panel" aria-label="技能事件列表">
      <div className="skill-event-timeline-heading">
        <div>
          <h5>{timelineEvents.length > 0 ? "真实技能事件时间线" : "技能逻辑事件列表"}</h5>
          <p>{timelineEvents.length > 0 ? "数据来自本次测试场运行。" : "运行预览前显示当前技能可用的逻辑事件类型。"}</p>
        </div>
        <span>{timelineEvents.length > 0 ? `${timelineEvents.length} 个事件` : `${supportedEventTypes.length} 类事件`}</span>
      </div>
      {groupedEvents.length > 0 ? (
        <>
          <ol className="skill-event-timeline-list">
            {groupedEvents.map((event) => (
              <li key={event.event_id} className={`skill-event-timeline-item skill-event-${event.type}`}>
                <button type="button" className="skill-editor-event-select" onClick={() => onSelectEventType(event.type)}>
                  <strong>{event.type_text}</strong>
                  <span>事件时间 {event.timestamp_ms} 毫秒</span>
                </button>
              </li>
            ))}
          </ol>
          {hiddenEventCount > 0 && (
            <p className="skill-event-timeline-limit">已限制首屏渲染，剩余 {hiddenEventCount} 个事件可通过事件类型筛选查看。</p>
          )}
        </>
      ) : (
        <div className="skill-editor-logical-events">
          {supportedEventTypes.map((eventType) => (
            <button
              key={eventType.type}
              type="button"
              className={selectedEventType === eventType.type ? "active" : ""}
              onClick={() => onSelectEventType(eventType.type)}
            >
              {eventType.text}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function ProjectileParameterPanel({
  draft,
  canEdit,
  editor,
  debugOptions,
  eventDebug,
  canAdjustLaunchPoint,
  onBeginLaunchPointAdjustment,
  onDebugOptionsChange,
  updateDraft
}: {
  draft: SkillPackageData;
  canEdit: boolean;
  editor: SkillEditorState;
  debugOptions: SkillEditorDebugOptions;
  eventDebug: ProjectileDebugSnapshot | null;
  canAdjustLaunchPoint: boolean;
  onBeginLaunchPointAdjustment: () => void;
  onDebugOptionsChange: (options: SkillEditorDebugOptions) => void;
  updateDraft: (mutator: (next: SkillPackageData) => void) => void;
}) {
  const params = draft.behavior.params;
  const orbitModuleIndex = draft.modules?.findIndex((module) => module.type === "orbit_emitter") ?? -1;
  const projectileModuleIndex = draft.modules?.findIndex((module) => module.type === "projectile") ?? -1;
  const damageZoneModuleIndex = draft.modules?.findIndex((module) => module.type === "damage_zone") ?? -1;
  const orbitModule = orbitModuleIndex >= 0 ? draft.modules?.[orbitModuleIndex] : null;
  const projectileModule = projectileModuleIndex >= 0 ? draft.modules?.[projectileModuleIndex] : null;
  const damageZoneModule = damageZoneModuleIndex >= 0 ? draft.modules?.[damageZoneModuleIndex] : null;
  const orbitModuleParams = orbitModule?.params ?? {};
  const projectileModuleParams = projectileModule?.params ?? {};
  const damageZoneModuleParams = damageZoneModule?.params ?? {};
  const damageZoneTrigger = damageZoneModule?.trigger ?? {};
  const updateModuleParam = (moduleIndex: number, key: string, value: unknown) => {
    updateDraft((next) => {
      if (!next.modules?.[moduleIndex]) return;
      next.modules[moduleIndex].params = { ...(next.modules[moduleIndex].params ?? {}), [key]: value };
    });
  };
  const updateModuleTrigger = (moduleIndex: number, key: string, value: unknown) => {
    updateDraft((next) => {
      if (!next.modules?.[moduleIndex]) return;
      next.modules[moduleIndex].trigger = { ...(next.modules[moduleIndex].trigger ?? {}), [key]: value };
    });
  };
  const directionModeText = draft.cast.target_selector === "target_enemy" ? "朝当前目标" : "朝最近目标";
  const sourceText = draft.id ? "施法者 / 测试玩家" : "施法者";
  const setDebugOption = (key: keyof SkillEditorDebugOptions, value: boolean) => {
    onDebugOptionsChange({ ...debugOptions, [key]: value });
  };
  const setDamageZoneShape = (shape: string) => {
    updateDraft((next) => {
      next.behavior.params.shape = shape;
      if (shape === "rectangle") {
        next.behavior.params.length = numberValue(next.behavior.params.length, numberValue(next.behavior.params.radius, numberValue(next.hit.hit_radius, 320)));
        next.behavior.params.width = numberValue(next.behavior.params.width, 96);
        next.behavior.params.angle_offset_deg = numberValue(next.behavior.params.angle_offset_deg, 0);
        delete next.behavior.params.radius;
        delete next.behavior.params.expand_duration_ms;
        delete next.behavior.params.ring_width;
      } else {
        next.behavior.params.radius = numberValue(next.behavior.params.radius, numberValue(next.hit.hit_radius, numberValue(next.behavior.params.length, 360)));
        next.behavior.params.expand_duration_ms = numberValue(next.behavior.params.expand_duration_ms, numberValue(next.behavior.params.hit_at_ms, 0));
        next.behavior.params.ring_width = numberValue(next.behavior.params.ring_width, 48);
        delete next.behavior.params.length;
        delete next.behavior.params.width;
        delete next.behavior.params.angle_offset_deg;
      }
    });
  };
  if (orbitModule && damageZoneModule && orbitModuleIndex >= 0 && damageZoneModuleIndex >= 0) {
    const tickMarkerId = String(orbitModuleParams.tick_marker_id ?? "");
    const triggerMarkerId = String(damageZoneTrigger.trigger_marker_id ?? "");
    const durationMs = numberValue(orbitModuleParams.duration_ms, 1);
    const tickIntervalMs = numberValue(orbitModuleParams.tick_interval_ms, 1);
    const estimatedTickCount = Math.max(0, Math.floor(durationMs / Math.max(1, tickIntervalMs)) * numberValue(orbitModuleParams.orb_count, 1));
    const linkStatus = tickMarkerId && tickMarkerId === triggerMarkerId ? "已连接" : "未连接";
    const markerOptions = tickMarkerId ? [{ value: tickMarkerId, text: tickMarkerId }] : [];
    return (
      <div className="skill-editor-projectile-panel">
        <EditorSection title="技能模块链">
          <div className="skill-editor-form-grid">
            <ReadOnlyInput label="技能编号" value={draft.id} />
            <ReadOnlyInput label="行为模板" value="module_chain" />
            <ReadOnlyInput label="模块 1" value={`${orbitModule.id} / orbit_emitter`} />
            <ReadOnlyInput label="模块 2" value={`${damageZoneModule.id} / damage_zone`} />
            <ReadOnlyInput label="链接" value={`${tickMarkerId} → ${triggerMarkerId}`} />
            <ReadOnlyInput label="连接状态" value={linkStatus} />
          </div>
        </EditorSection>
        <EditorSection title="环绕模块">
          <div className="skill-editor-form-grid">
            <SelectInput label="环绕中心" value={String(orbitModuleParams.orbit_center_policy ?? "caster")} options={[{ value: "caster", text: "caster" }]} disabled={!canEdit} onChange={(value) => updateModuleParam(orbitModuleIndex, "orbit_center_policy", value)} />
            <NumberInput label="持续毫秒" value={durationMs} min={1} integer disabled={!canEdit} onChange={(value) => updateModuleParam(orbitModuleIndex, "duration_ms", value)} />
            <NumberInput label="tick 间隔毫秒" value={tickIntervalMs} min={1} integer disabled={!canEdit} onChange={(value) => updateModuleParam(orbitModuleIndex, "tick_interval_ms", value)} />
            <NumberInput label="轨道半径" value={numberValue(orbitModuleParams.orbit_radius, 1)} min={1} disabled={!canEdit} onChange={(value) => updateModuleParam(orbitModuleIndex, "orbit_radius", value)} />
            <NumberInput label="每秒角速度" value={numberValue(orbitModuleParams.orbit_speed_deg_per_sec, 0)} disabled={!canEdit} onChange={(value) => updateModuleParam(orbitModuleIndex, "orbit_speed_deg_per_sec", value)} />
            <NumberInput label="熔岩球数量" value={numberValue(orbitModuleParams.orb_count, 1)} min={1} integer disabled={!canEdit} onChange={(value) => updateModuleParam(orbitModuleIndex, "orb_count", value)} />
            <NumberInput label="起始角度" value={numberValue(orbitModuleParams.start_angle_deg, 0)} disabled={!canEdit} onChange={(value) => updateModuleParam(orbitModuleIndex, "start_angle_deg", value)} />
            <CheckboxInput label="半径循环变化" checked={Boolean(orbitModuleParams.orbit_radius_cycle_enabled ?? false)} disabled={!canEdit} onChange={(value) => updateModuleParam(orbitModuleIndex, "orbit_radius_cycle_enabled", value)} />
            <NumberInput label="半径循环振幅" value={numberValue(orbitModuleParams.orbit_radius_cycle_amplitude, 0)} min={0} disabled={!canEdit} onChange={(value) => updateModuleParam(orbitModuleIndex, "orbit_radius_cycle_amplitude", value)} />
            <NumberInput label="半径循环周期毫秒" value={numberValue(orbitModuleParams.orbit_radius_cycle_period_ms, 1000)} min={1} integer disabled={!canEdit} onChange={(value) => updateModuleParam(orbitModuleIndex, "orbit_radius_cycle_period_ms", value)} />
            <NumberInput label="半径循环相位" value={numberValue(orbitModuleParams.orbit_radius_cycle_phase_deg, 0)} disabled={!canEdit} onChange={(value) => updateModuleParam(orbitModuleIndex, "orbit_radius_cycle_phase_deg", value)} />
            <TextInput label="tick 标识" value={tickMarkerId} disabled={!canEdit} onChange={(value) => updateModuleParam(orbitModuleIndex, "tick_marker_id", value)} />
            <TextInput label="生成特效" value={String(orbitModuleParams.spawn_vfx_key ?? "")} disabled={!canEdit} onChange={(value) => updateModuleParam(orbitModuleIndex, "spawn_vfx_key", value)} />
            <TextInput label="tick 特效" value={String(orbitModuleParams.tick_vfx_key ?? "")} disabled={!canEdit} onChange={(value) => updateModuleParam(orbitModuleIndex, "tick_vfx_key", value)} />
          </div>
        </EditorSection>
        <EditorSection title="伤害区模块">
          <div className="skill-editor-form-grid">
            <SelectInput label="触发标识" value={triggerMarkerId} options={markerOptions} disabled={!canEdit || markerOptions.length === 0} onChange={(value) => updateModuleTrigger(damageZoneModuleIndex, "trigger_marker_id", value)} />
            <NumberInput label="触发延迟毫秒" value={numberValue(damageZoneTrigger.trigger_delay_ms, 0)} min={0} integer disabled={!canEdit} onChange={(value) => updateModuleTrigger(damageZoneModuleIndex, "trigger_delay_ms", value)} />
            <ReadOnlyInput label="形状" value={String(damageZoneModuleParams.shape ?? "circle")} />
            <ReadOnlyInput label="原点规则" value={String(damageZoneModuleParams.origin_policy ?? "trigger_position")} />
            <NumberInput label="每 tick 半径" value={numberValue(damageZoneModuleParams.radius, 1)} min={1} disabled={!canEdit} onChange={(value) => updateModuleParam(damageZoneModuleIndex, "radius", value)} />
            <NumberInput label="命中时机毫秒" value={numberValue(damageZoneModuleParams.hit_at_ms, 0)} min={0} integer disabled={!canEdit} onChange={(value) => updateModuleParam(damageZoneModuleIndex, "hit_at_ms", value)} />
            <NumberInput label="最大目标数" value={numberValue(damageZoneModuleParams.max_targets, 1)} min={1} integer disabled={!canEdit} onChange={(value) => updateModuleParam(damageZoneModuleIndex, "max_targets", value)} />
            <SelectInput label="伤害类型" value={draft.classification.damage_type} options={editor.options.damage_types} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.classification.damage_type = value; })} />
            <TextInput label="命中特效" value={String(damageZoneModuleParams.vfx_key ?? "")} disabled={!canEdit} onChange={(value) => updateModuleParam(damageZoneModuleIndex, "vfx_key", value)} />
          </div>
        </EditorSection>
        <EditorSection title="只读摘要">
          <div className="skill-editor-form-grid">
            <ReadOnlyInput label="预计 tick 次数" value={estimatedTickCount} />
            <ReadOnlyInput label="预计总持续时间" value={`${durationMs} ms`} />
            <ReadOnlyInput label="轨道半径" value={numberValue(orbitModuleParams.orbit_radius, 1)} />
            <ReadOnlyInput label="每 tick 命中半径" value={numberValue(damageZoneModuleParams.radius, 1)} />
            <ReadOnlyInput label="模块链状态" value={linkStatus} />
          </div>
        </EditorSection>
      </div>
    );
  }
  if (projectileModule && damageZoneModule && projectileModuleIndex >= 0 && damageZoneModuleIndex >= 0) {
    return (
      <div className="skill-editor-projectile-panel">
        <EditorSection title="技能模块链">
          <div className="skill-editor-form-grid">
            <ReadOnlyInput label="技能编号" value={draft.id} />
            <ReadOnlyInput label="行为模板" value="module_chain" />
            <ReadOnlyInput label="模块 1" value={`${projectileModule.id} / projectile`} />
            <ReadOnlyInput label="模块 2" value={`${damageZoneModule.id} / damage_zone`} />
            <ReadOnlyInput label="链接" value={`${String(projectileModuleParams.impact_marker_id ?? "")} → ${String(damageZoneTrigger.trigger_marker_id ?? "")}`} />
          </div>
        </EditorSection>
        <EditorSection title="投射物模块">
          <div className="skill-editor-form-grid">
            <SelectInput label="轨迹" value={String(projectileModuleParams.trajectory ?? "linear")} options={[{ value: "linear", text: "linear" }, { value: "ballistic", text: "ballistic" }]} disabled={!canEdit} onChange={(value) => updateModuleParam(projectileModuleIndex, "trajectory", value)} />
            <NumberInput label="飞行时间毫秒" value={numberValue(projectileModuleParams.travel_time_ms, 1)} min={1} integer disabled={!canEdit} onChange={(value) => updateModuleParam(projectileModuleIndex, "travel_time_ms", value)} />
            <NumberInput label="抛物线高度" value={numberValue(projectileModuleParams.arc_height, 0)} min={0} disabled={!canEdit} onChange={(value) => updateModuleParam(projectileModuleIndex, "arc_height", value)} />
            <SelectInput label="目标规则" value={String(projectileModuleParams.target_policy ?? "target_position")} options={[{ value: "nearest_enemy", text: "nearest_enemy" }, { value: "random_enemy", text: "random_enemy" }, { value: "nearest_unique_enemy", text: "nearest_unique_enemy" }, { value: "target_position", text: "target_position" }]} disabled={!canEdit} onChange={(value) => updateModuleParam(projectileModuleIndex, "target_policy", value)} />
            <TextInput label="落地标识" value={String(projectileModuleParams.impact_marker_id ?? "")} disabled={!canEdit} onChange={(value) => updateModuleParam(projectileModuleIndex, "impact_marker_id", value)} />
            <NumberInput label="投射物速度" value={numberValue(projectileModuleParams.projectile_speed, 1)} min={1} disabled={!canEdit} onChange={(value) => updateModuleParam(projectileModuleIndex, "projectile_speed", value)} />
            <NumberInput label="投射物宽度" value={numberValue(projectileModuleParams.projectile_width, 1)} min={1} disabled={!canEdit} onChange={(value) => updateModuleParam(projectileModuleIndex, "projectile_width", value)} />
            <NumberInput label="投射物高度" value={numberValue(projectileModuleParams.projectile_height, 1)} min={1} disabled={!canEdit} onChange={(value) => updateModuleParam(projectileModuleIndex, "projectile_height", value)} />
            <TextInput label="投射物特效" value={String(projectileModuleParams.vfx_key ?? "")} disabled={!canEdit} onChange={(value) => updateModuleParam(projectileModuleIndex, "vfx_key", value)} />
          </div>
        </EditorSection>
        <EditorSection title="伤害区模块">
          <div className="skill-editor-form-grid">
            <SelectInput label="触发标识" value={String(damageZoneTrigger.trigger_marker_id ?? "")} options={[{ value: String(projectileModuleParams.impact_marker_id ?? ""), text: String(projectileModuleParams.impact_marker_id ?? "") }]} disabled={!canEdit} onChange={(value) => updateModuleTrigger(damageZoneModuleIndex, "trigger_marker_id", value)} />
            <NumberInput label="触发延迟毫秒" value={numberValue(damageZoneTrigger.trigger_delay_ms, 0)} min={0} integer disabled={!canEdit} onChange={(value) => updateModuleTrigger(damageZoneModuleIndex, "trigger_delay_ms", value)} />
            <ReadOnlyInput label="形状" value={String(damageZoneModuleParams.shape ?? "circle")} />
            <ReadOnlyInput label="原点规则" value={String(damageZoneModuleParams.origin_policy ?? "trigger_position")} />
            <NumberInput label="半径" value={numberValue(damageZoneModuleParams.radius, 1)} min={1} disabled={!canEdit} onChange={(value) => updateModuleParam(damageZoneModuleIndex, "radius", value)} />
            <NumberInput label="命中时机毫秒" value={numberValue(damageZoneModuleParams.hit_at_ms, 0)} min={0} integer disabled={!canEdit} onChange={(value) => updateModuleParam(damageZoneModuleIndex, "hit_at_ms", value)} />
            <NumberInput label="最大目标数" value={numberValue(damageZoneModuleParams.max_targets, 1)} min={1} integer disabled={!canEdit} onChange={(value) => updateModuleParam(damageZoneModuleIndex, "max_targets", value)} />
            <SelectInput label="伤害类型" value={draft.classification.damage_type} options={editor.options.damage_types} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.classification.damage_type = value; })} />
            <TextInput label="爆炸特效" value={String(damageZoneModuleParams.vfx_key ?? "")} disabled={!canEdit} onChange={(value) => updateModuleParam(damageZoneModuleIndex, "vfx_key", value)} />
          </div>
        </EditorSection>
        <EditorSection title="表现">
          <div className="skill-editor-form-grid">
            <TextInput label="施法特效" value={draft.presentation.cast_vfx_key ?? ""} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.cast_vfx_key = value; })} />
            <TextInput label="通用视觉效果" value={draft.presentation.vfx} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.vfx = value; })} />
            <NumberInput label="特效放大倍数" value={numberValue(draft.presentation.vfx_scale, 1)} min={0.1} max={10} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.vfx_scale = value; })} />
            <TextInput label="音效" value={draft.presentation.sfx} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.sfx = value; })} />
            <TextInput label="伤害浮字" value={draft.presentation.floating_text} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.floating_text = value; })} />
            <TextInput label="屏幕反馈" value={draft.presentation.screen_feedback} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.screen_feedback = value; })} />
          </div>
        </EditorSection>
      </div>
    );
  }
  if (draft.behavior.template === "damage_zone") {
    const shape = String(params.shape ?? "circle");
    return (
      <div className="skill-editor-projectile-panel">
        <EditorSection title="伤害结算区域">
          <div className="skill-editor-form-grid">
            <ReadOnlyInput label="技能编号" value={draft.id} />
            <ReadOnlyInput label="行为模板" value={draft.behavior.template} />
            <SelectInput label="结算区域类型" value={shape} options={editor.options.zone_shapes} disabled={!canEdit} onChange={setDamageZoneShape} />
            <SelectInput label="起点规则" value={String(params.origin_policy ?? "caster")} options={editor.options.origin_policies} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.origin_policy = value; })} />
            <SelectInput label="朝向规则" value={String(params.facing_policy ?? "none")} options={editor.options.facing_policies} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.facing_policy = value; })} />
            {shape === "rectangle" ? (
              <>
                <NumberInput label="长" value={numberValue(params.length, 1)} min={1} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.length = value; })} />
                <NumberInput label="宽" value={numberValue(params.width, 1)} min={1} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.width = value; })} />
                <NumberInput label="角度" value={numberValue(params.angle_offset_deg, 0)} min={-180} max={180} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.angle_offset_deg = value; })} />
              </>
            ) : (
              <>
                <NumberInput label="半径" value={numberValue(params.radius, 1)} min={1} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.radius = value; })} />
                <NumberInput label="扩散时长毫秒" value={numberValue(params.expand_duration_ms, 0)} min={0} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.expand_duration_ms = value; })} />
                <NumberInput label="环宽" value={numberValue(params.ring_width, 1)} min={1} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.ring_width = value; })} />
              </>
            )}
            <NumberInput label="命中时机毫秒" value={numberValue(params.hit_at_ms, 0)} min={0} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.hit_at_ms = value; })} />
            <NumberInput label="最大目标数" value={numberValue(params.max_targets, 1)} min={1} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.max_targets = value; })} />
            <NumberInput label="状态几率倍率" value={numberValue(params.status_chance_scale, 1)} min={0} max={10} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.status_chance_scale = value; })} />
            <TextInput label="区域特效键" value={String(params.zone_vfx_key ?? "")} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.zone_vfx_key = value; })} />
            <ReadOnlyInput label="只读范围摘要" value={damageZoneRangeSummary(draft)} />
          </div>
        </EditorSection>
        <EditorSection title="伤害">
          <div className="skill-editor-form-grid">
            <NumberInput label="基础伤害" value={draft.hit.base_damage} min={0} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.hit.base_damage = value; })} />
            <SelectInput label="伤害时机" value={draft.hit.damage_timing ?? "on_damage_zone_hit"} options={editor.options.damage_timings} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.hit.damage_timing = value; })} />
            <NumberInput label="命中延迟毫秒" value={numberValue(draft.hit.hit_delay_ms, 0)} min={0} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.hit.hit_delay_ms = value; })} />
            <NumberInput label="命中范围" value={numberValue(draft.hit.hit_radius, 0)} min={0} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.hit.hit_radius = value; })} />
            <CheckboxInput label="可以暴击" checked={draft.hit.can_crit} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.hit.can_crit = value; })} />
            <CheckboxInput label="可以附加状态" checked={draft.hit.can_apply_status} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.hit.can_apply_status = value; })} />
            <ReadOnlyInput label="只读命中时机摘要" value={damageZoneHitTimingSummary(draft)} />
          </div>
        </EditorSection>
        <EditorSection title="表现">
          <div className="skill-editor-form-grid">
            <TextInput label="施法特效" value={draft.presentation.cast_vfx_key ?? ""} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.cast_vfx_key = value; })} />
            <TextInput label="命中特效" value={draft.presentation.hit_vfx_key ?? ""} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.hit_vfx_key = value; })} />
            <TextInput label="通用视觉效果" value={draft.presentation.vfx} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.vfx = value; })} />
            <NumberInput label="特效放大倍数" value={numberValue(draft.presentation.vfx_scale, 1)} min={0.1} max={10} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.vfx_scale = value; })} />
            <TextInput label="音效" value={draft.presentation.sfx} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.sfx = value; })} />
            <TextInput label="伤害浮字" value={draft.presentation.floating_text} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.floating_text = value; })} />
            <TextInput label="屏幕反馈" value={draft.presentation.screen_feedback} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.screen_feedback = value; })} />
          </div>
        </EditorSection>
        <EditorSection title="调试">
          <div className="skill-editor-debug-options">
            <CheckboxInput label="显示目标点" checked={debugOptions.showTargetPoint} onChange={(value) => setDebugOption("showTargetPoint", value)} />
            <CheckboxInput label="显示飞行方向线" checked={debugOptions.showDirectionLines} onChange={(value) => setDebugOption("showDirectionLines", value)} />
            <CheckboxInput label="显示搜索范围" checked={debugOptions.showSearchRange} onChange={(value) => setDebugOption("showSearchRange", value)} />
          </div>
          <p className="skill-editor-test-notice">调试开关只保存在编辑器临时状态中，不会写入正式技能配置文件。</p>
        </EditorSection>
      </div>
    );
  }
  if (draft.behavior.template === "player_nova") {
    return (
      <div className="skill-editor-projectile-panel">
        <EditorSection title="范围新星">
          <div className="skill-editor-form-grid">
            <ReadOnlyInput label="技能编号" value={draft.id} />
            <ReadOnlyInput label="行为模板" value={draft.behavior.template} />
            <SelectInput label="中心规则" value={String(params.center_policy ?? "player_center")} options={editor.options.center_policies} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.center_policy = value; })} />
            <NumberInput label="半径" value={numberValue(params.radius, 1)} min={1} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.radius = value; })} />
            <NumberInput label="新星环宽" value={numberValue(params.ring_width, 1)} min={1} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.ring_width = value; })} />
            <NumberInput label="最大目标数" value={numberValue(params.max_targets, 1)} min={1} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.max_targets = value; })} />
            <SelectInput label="距离衰减" value={String(params.damage_falloff_by_distance ?? "none")} options={editor.options.damage_falloff_modes} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.damage_falloff_by_distance = value; })} />
            <NumberInput label="状态几率倍率" value={numberValue(params.status_chance_scale, 1)} min={0} max={10} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.status_chance_scale = value; })} />
            <ReadOnlyInput label="只读范围摘要" value={playerNovaRangeSummary(draft)} />
          </div>
        </EditorSection>
        <EditorSection title="时序">
          <div className="skill-editor-form-grid">
            <NumberInput label="扩散时长毫秒" value={numberValue(params.expand_duration_ms, 0)} min={0} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.expand_duration_ms = value; })} />
            <NumberInput label="命中时机毫秒" value={numberValue(params.hit_at_ms, 0)} min={0} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.hit_at_ms = value; })} />
            <SelectInput label="伤害时机" value={draft.hit.damage_timing ?? "on_area_hit"} options={editor.options.damage_timings} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.hit.damage_timing = value; })} />
            <NumberInput label="命中延迟毫秒" value={numberValue(draft.hit.hit_delay_ms, 0)} min={0} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.hit.hit_delay_ms = value; })} />
            <NumberInput label="命中范围" value={numberValue(draft.hit.hit_radius, 0)} min={0} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.hit.hit_radius = value; })} />
            <ReadOnlyInput label="只读命中时机摘要" value={playerNovaHitTimingSummary(draft)} />
          </div>
        </EditorSection>
        <EditorSection title="表现">
          <div className="skill-editor-form-grid">
            <TextInput label="释放特效" value={draft.presentation.cast_vfx_key ?? ""} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.cast_vfx_key = value; })} />
            <TextInput label="命中特效" value={draft.presentation.hit_vfx_key ?? ""} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.hit_vfx_key = value; })} />
            <TextInput label="通用视觉效果" value={draft.presentation.vfx} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.vfx = value; })} />
            <NumberInput label="特效放大倍数" value={numberValue(draft.presentation.vfx_scale, 1)} min={0.1} max={10} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.vfx_scale = value; })} />
            <TextInput label="音效" value={draft.presentation.sfx} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.sfx = value; })} />
            <TextInput label="伤害浮字" value={draft.presentation.floating_text} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.floating_text = value; })} />
            <TextInput label="屏幕反馈" value={draft.presentation.screen_feedback} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.screen_feedback = value; })} />
          </div>
        </EditorSection>
      </div>
    );
  }
  if (draft.behavior.template === "melee_arc") {
    return (
      <div className="skill-editor-projectile-panel">
        <EditorSection title="近战扇形">
          <div className="skill-editor-form-grid">
            <ReadOnlyInput label="技能编号" value={draft.id} />
            <ReadOnlyInput label="行为模板" value={draft.behavior.template} />
            <SelectInput label="朝向规则" value={String(params.facing_policy ?? "nearest_target")} options={editor.options.facing_policies} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.facing_policy = value; })} />
            <SelectInput label="命中形状" value={String(params.hit_shape ?? "sector")} options={editor.options.hit_shapes} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.hit_shape = value; })} />
            <NumberInput label="扇形角度" value={numberValue(params.arc_angle, 1)} min={1} max={180} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.arc_angle = value; })} />
            <NumberInput label="扇形半径" value={numberValue(params.arc_radius, 1)} min={1} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.arc_radius = value; })} />
            <NumberInput label="最大目标数" value={numberValue(params.max_targets, 1)} min={1} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.max_targets = value; })} />
            <NumberInput label="状态几率倍率" value={numberValue(params.status_chance_scale, 1)} min={0} max={10} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.status_chance_scale = value; })} />
            <ReadOnlyInput label="只读扇形范围摘要" value={meleeArcRangeSummary(draft)} />
          </div>
        </EditorSection>
        <EditorSection title="时序">
          <div className="skill-editor-form-grid">
            <NumberInput label="前摇毫秒" value={numberValue(params.windup_ms, 0)} min={0} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.windup_ms = value; })} />
            <NumberInput label="命中时机毫秒" value={numberValue(params.hit_at_ms, 0)} min={0} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.hit_at_ms = value; })} />
            <SelectInput label="伤害时机" value={draft.hit.damage_timing ?? "on_melee_hit"} options={editor.options.damage_timings} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.hit.damage_timing = value; })} />
            <NumberInput label="命中延迟毫秒" value={numberValue(draft.hit.hit_delay_ms, 0)} min={0} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.hit.hit_delay_ms = value; })} />
            <NumberInput label="命中范围" value={numberValue(draft.hit.hit_radius, 0)} min={0} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.hit.hit_radius = value; })} />
            <ReadOnlyInput label="只读命中时机摘要" value={meleeArcHitTimingSummary(draft)} />
          </div>
        </EditorSection>
        <EditorSection title="表现">
          <div className="skill-editor-form-grid">
            <TextInput label="斩击特效键" value={String(params.slash_vfx_key ?? "")} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.slash_vfx_key = value; })} />
            <TextInput label="施法特效" value={draft.presentation.cast_vfx_key ?? ""} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.cast_vfx_key = value; })} />
            <TextInput label="命中特效" value={draft.presentation.hit_vfx_key ?? ""} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.hit_vfx_key = value; })} />
            <TextInput label="通用视觉效果" value={draft.presentation.vfx} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.vfx = value; })} />
            <NumberInput label="特效放大倍数" value={numberValue(draft.presentation.vfx_scale, 1)} min={0.1} max={10} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.vfx_scale = value; })} />
            <TextInput label="音效" value={draft.presentation.sfx} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.sfx = value; })} />
            <TextInput label="伤害浮字" value={draft.presentation.floating_text} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.floating_text = value; })} />
            <TextInput label="屏幕反馈" value={draft.presentation.screen_feedback} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.screen_feedback = value; })} />
          </div>
        </EditorSection>
      </div>
    );
  }
  return (
    <div className="skill-editor-projectile-panel">
      <EditorSection title="基础">
        <div className="skill-editor-form-grid">
          <ReadOnlyInput label="技能编号" value={draft.id} />
          <ReadOnlyInput label="技能标签" value={draft.classification.tags.join("，")} />
          <ReadOnlyInput label="行为模板" value={draft.behavior.template} />
          <SelectInput label="伤害类型" value={draft.classification.damage_type} options={editor.options.damage_types} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.classification.damage_type = value; })} />
          <SelectInput label="伤害形式" value={draft.classification.damage_form} options={editor.options.damage_forms} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.classification.damage_form = value; })} />
          <SelectInput label="目标选择方式" value={draft.cast.target_selector} options={editor.options.target_selectors} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.cast.target_selector = value; })} />
        </div>
      </EditorSection>
      <EditorSection title="发射位置">
        <div className="skill-editor-form-grid">
          <ReadOnlyInput label="发射来源" value={sourceText} />
          <NumberInput label="发射偏移横向" value={numberValue(params.spawn_offset?.x, 0)} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.spawn_offset = { ...(next.behavior.params.spawn_offset ?? { x: 0, y: 0 }), x: value }; })} />
          <NumberInput label="发射偏移纵向" value={numberValue(params.spawn_offset?.y, 0)} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.spawn_offset = { ...(next.behavior.params.spawn_offset ?? { x: 0, y: 0 }), y: value }; })} />
          <ReadOnlyInput label="逻辑发射点" value={formatPoint(eventDebug?.spawn)} />
          <ReadOnlyInput label="特效发射点" value={formatPoint(eventDebug?.vfxSpawn)} />
          <button className="skill-editor-inline-action" type="button" disabled={!canAdjustLaunchPoint} onClick={onBeginLaunchPointAdjustment}>
            直接调整
          </button>
        </div>
      </EditorSection>
      <EditorSection title="发射方向">
        <div className="skill-editor-form-grid">
          <ReadOnlyInput label="当前方向模式" value={directionModeText} />
          <NumberInput label="扇形角度" value={numberValue(params.spread_angle_deg, 0)} min={0} max={180} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.spread_angle_deg = value; })} />
          <NumberInput label="角度间隔" value={numberValue(params.angle_step, 0)} min={0} max={90} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.angle_step = value; })} />
          <ReadOnlyInput label="逻辑飞行方向" value={formatPoint(eventDebug?.direction)} />
          <ReadOnlyInput label="特效飞行方向" value={formatPoint(eventDebug?.vfxDirection)} />
        </div>
      </EditorSection>
      <EditorSection title="目标搜索">
        <div className="skill-editor-form-grid">
          <SelectInput label="释放目标选择" value={draft.cast.target_selector} options={editor.options.target_selectors} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.cast.target_selector = value; })} />
          <NumberInput label="释放搜索范围" value={draft.cast.search_range} min={0} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.cast.search_range = value; })} />
          <SelectInput label="命中目标规则" value={draft.hit.target_policy ?? "selected_target"} options={editor.options.target_policies} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.hit.target_policy = value; })} />
          <NumberInput label="最大目标数" value={numberValue(params.max_targets, 1)} min={1} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.max_targets = value; })} />
        </div>
      </EditorSection>
      <EditorSection title="发射组">
        <div className="skill-editor-form-grid">
          <NumberInput label="投射物数量" value={numberValue(params.projectile_count, 1)} min={1} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.projectile_count = value; })} />
          <NumberInput label="连发间隔毫秒" value={numberValue(params.burst_interval_ms, 0)} min={0} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.burst_interval_ms = value; })} />
          <NumberInput label="扇形角度" value={numberValue(params.spread_angle_deg, 0)} min={0} max={180} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.spread_angle_deg = value; })} />
          <NumberInput label="角度间隔" value={numberValue(params.angle_step, 0)} min={0} max={90} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.angle_step = value; })} />
          <NumberInput label="随机角度偏移" value={numberValue(params.random_angle_jitter_deg, 0)} min={0} max={45} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.random_angle_jitter_deg = value; })} />
        </div>
      </EditorSection>
      <EditorSection title="运动">
        <div className="skill-editor-form-grid">
          <NumberInput label="投射物速度" value={numberValue(params.projectile_speed, 1)} min={1} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.projectile_speed = value; })} />
          <NumberInput label="最大距离" value={numberValue(params.max_distance, 1)} min={1} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.max_distance = value; })} />
          <NumberInput label="最短持续毫秒" value={numberValue(params.min_duration_ms, 0)} min={0} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.min_duration_ms = value; })} />
          <NumberInput label="最长持续毫秒" value={numberValue(params.max_duration_ms, 1)} min={1} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.max_duration_ms = value; })} />
        </div>
      </EditorSection>
      <EditorSection title="碰撞">
        <div className="skill-editor-form-grid">
          <NumberInput label="投射物宽度" value={numberValue(params.projectile_width, 1)} min={1} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.projectile_width = value; })} />
          <NumberInput label="投射物高度" value={numberValue(params.projectile_height, 1)} min={1} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.projectile_height = value; })} />
          <NumberInput label="碰撞半径" value={numberValue(params.collision_radius, 0)} min={0} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.collision_radius = value; })} />
          <NumberInput label="投射物半径" value={numberValue(params.projectile_radius, 0)} min={0} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.projectile_radius = value; })} />
          <NumberInput label="命中半径" value={numberValue(params.impact_radius, 0)} min={0} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.impact_radius = value; })} />
          <SelectInput label="命中后行为" value={String(params.hit_policy ?? "first_hit")} options={editor.options.hit_policies} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.hit_policy = value; })} />
          <NumberInput label="穿透次数" value={numberValue(params.pierce_count, 0)} min={0} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.behavior.params.pierce_count = value; })} />
        </div>
      </EditorSection>
      <EditorSection title="伤害">
        <div className="skill-editor-form-grid">
          <NumberInput label="命中基础伤害" value={draft.hit.base_damage} min={0} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.hit.base_damage = value; })} />
          <SelectInput label="伤害时机" value={draft.hit.damage_timing ?? "on_projectile_hit"} options={editor.options.damage_timings} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.hit.damage_timing = value; })} />
          <NumberInput label="命中延迟毫秒" value={numberValue(draft.hit.hit_delay_ms, 0)} min={0} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.hit.hit_delay_ms = value; })} />
          <NumberInput label="命中范围" value={numberValue(draft.hit.hit_radius, 0)} min={0} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.hit.hit_radius = value; })} />
          <CheckboxInput label="可以暴击" checked={draft.hit.can_crit} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.hit.can_crit = value; })} />
          <CheckboxInput label="可以附加状态" checked={draft.hit.can_apply_status} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.hit.can_apply_status = value; })} />
        </div>
      </EditorSection>
      <EditorSection title="表现">
        <div className="skill-editor-form-grid">
          <TextInput label="施法特效" value={draft.presentation.cast_vfx_key ?? ""} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.cast_vfx_key = value; })} />
          <TextInput label="投射物特效" value={draft.presentation.projectile_vfx_key ?? ""} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.projectile_vfx_key = value; })} />
          <TextInput label="命中特效" value={draft.presentation.hit_vfx_key ?? ""} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.hit_vfx_key = value; })} />
          <TextInput label="通用视觉效果" value={draft.presentation.vfx} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.vfx = value; })} />
          <NumberInput label="特效放大倍数" value={numberValue(draft.presentation.vfx_scale, 1)} min={0.1} max={10} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.vfx_scale = value; })} />
          <TextInput label="音效" value={draft.presentation.sfx} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.sfx = value; })} />
          <TextInput label="伤害浮字" value={draft.presentation.floating_text} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.floating_text = value; })} />
          <TextInput label="浮字样式" value={draft.presentation.floating_text_style ?? ""} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.floating_text_style = value; })} />
          <TextInput label="屏幕反馈" value={draft.presentation.screen_feedback} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.screen_feedback = value; })} />
          <NumberInput label="命中停顿毫秒" value={numberValue(draft.presentation.hit_stop_ms, 0)} min={0} integer disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.hit_stop_ms = value; })} />
          <NumberInput label="镜头震动" value={numberValue(draft.presentation.camera_shake, 0)} min={0} disabled={!canEdit} onChange={(value) => updateDraft((next) => { next.presentation.camera_shake = value; })} />
        </div>
      </EditorSection>
      <EditorSection title="调试">
        <div className="skill-editor-debug-options">
          <CheckboxInput label="显示发射点" checked={debugOptions.showLaunchPoints} onChange={(value) => setDebugOption("showLaunchPoints", value)} />
          <CheckboxInput label="显示目标点" checked={debugOptions.showTargetPoint} onChange={(value) => setDebugOption("showTargetPoint", value)} />
          <CheckboxInput label="显示飞行方向线" checked={debugOptions.showDirectionLines} onChange={(value) => setDebugOption("showDirectionLines", value)} />
          <CheckboxInput label="显示碰撞半径" checked={debugOptions.showCollisionRadius} onChange={(value) => setDebugOption("showCollisionRadius", value)} />
          <CheckboxInput label="显示搜索范围" checked={debugOptions.showSearchRange} onChange={(value) => setDebugOption("showSearchRange", value)} />
        </div>
        <p className="skill-editor-test-notice">调试开关只保存在编辑器临时状态中，不会写入正式技能配置文件。</p>
      </EditorSection>
    </div>
  );
}

function GenericEventParameterPanel({ event, selectedEventType }: { event: SkillEventTimelineItem | null; selectedEventType: string }) {
  return (
    <EditorSection title="事件参数">
      <div className="skill-editor-form-grid">
        <ReadOnlyInput label="事件类型" value={event?.type_text ?? "未识别事件"} />
        <ReadOnlyInput label="事件时间" value={event ? `${event.timestamp_ms} 毫秒` : "未运行预览"} />
        <ReadOnlyInput label="来源实体" value={event?.source_entity ?? "无"} />
        <ReadOnlyInput label="目标实体" value={event?.target_entity ?? "无"} />
        <ReadOnlyInput label="数值" value={event?.amount === null || event?.amount === undefined ? "无" : formatPreviewNumber(event.amount)} />
        <ReadOnlyInput label="特效标识" value={event?.vfx_key ?? "无"} />
      </div>
    </EditorSection>
  );
}

function projectileDebugFromEvent(event: SkillEventTimelineItem | null): ProjectileDebugSnapshot | null {
  if (!event || !event.payload || typeof event.payload !== "object") return null;
  const payload = event.payload as Record<string, unknown>;
  const spawn = pointFromUnknown(payload.spawn_world_position) ?? pointFromUnknown(event.position);
  const target = pointFromUnknown(payload.target_world_position) ?? pointFromUnknown(payload.impact_world_position) ?? pointFromUnknown(event.position);
  const direction = pointFromUnknown(payload.direction_world) ?? pointFromUnknown(event.direction);
  if (!spawn || !target || !direction) return null;
  return {
    spawn,
    vfxSpawn: pointFromUnknown(payload.vfx_spawn_world_position) ?? spawn,
    target,
    direction,
    vfxDirection: pointFromUnknown(payload.vfx_direction_world) ?? direction
  };
}

function projectileDebugPreviewFromDraft(packageData: SkillPackageData, scene: SkillTestArenaView["scenes"][number] | null): ProjectileDebugSnapshot {
  const params = packageData.behavior.params;
  const spawn = projectileSpawnWorldPosition({ x: 0, y: -12 }, params);
  const target = scene?.enemies[0]?.position ?? { x: Number(params.max_distance ?? 520), y: -12 };
  const direction = guideDirection(spawn, target);
  return { spawn, vfxSpawn: spawn, target, direction, vfxDirection: direction };
}

function pointFromUnknown(value: unknown): { x: number; y: number } | null {
  if (!value || typeof value !== "object") return null;
  const point = value as { x?: unknown; y?: unknown };
  const x = Number(point.x);
  const y = Number(point.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

function formatPoint(point: { x: number; y: number } | null | undefined) {
  if (!point) return "暂无";
  return `x ${formatPreviewNumber(point.x)}，y ${formatPreviewNumber(point.y)}`;
}

function requirePositiveInteger(value: unknown, label: string, errors: string[]) {
  requireIntegerAtLeast(value, label, 1, errors);
}

function requireIntegerAtLeast(value: unknown, label: string, minimum: number, errors: string[]) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < minimum) errors.push(`${label} 必须是不小于 ${minimum} 的整数。`);
}

function requireNumberAtLeast(value: unknown, label: string, minimum: number, errors: string[]) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum) errors.push(`${label} 必须是不小于 ${minimum} 的数字。`);
}

function requireNumberRange(value: unknown, label: string, minimum: number, maximum: number, errors: string[]) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum || number > maximum) errors.push(`${label} 必须在 ${minimum} 到 ${maximum} 之间。`);
}

function EditorSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="skill-editor-section" aria-label={title}>
      <h4>{title}</h4>
      {children}
    </section>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ReadOnlyInput({ label, value }: { label: string; value: ReactNode }) {
  return (
    <label className="skill-editor-field">
      <span>{label}</span>
      <input value={String(value ?? "")} readOnly aria-readonly="true" />
    </label>
  );
}

function TextInput({
  label,
  value,
  disabled,
  onChange
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="skill-editor-field">
      <span>{label}</span>
      <input value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function NumberInput({
  label,
  value,
  min,
  max,
  integer,
  disabled,
  onChange
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  integer?: boolean;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="skill-editor-field">
      <span>{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        min={min}
        max={max}
        step={integer ? 1 : 0.01}
        disabled={disabled}
        onChange={(event) => {
          const nextValue = Number(event.target.value);
          onChange(integer ? Math.trunc(nextValue) : nextValue);
        }}
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  options,
  disabled,
  onChange
}: {
  label: string;
  value: string;
  options: SkillEditorOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="skill-editor-field">
      <span>{label}</span>
      <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.text}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckboxInput({
  label,
  checked,
  disabled,
  onChange
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="skill-editor-check-field">
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function EditableStringList({
  label,
  values,
  disabled,
  onChange
}: {
  label: string;
  values: string[];
  disabled?: boolean;
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="skill-editor-list-editor">
      <span>{label}</span>
      {values.map((value, index) => (
        <div key={`${value}-${index}`} className="skill-editor-list-row">
          <input
            value={value}
            disabled={disabled}
            onChange={(event) => {
              const next = values.slice();
              next[index] = event.target.value;
              onChange(next);
            }}
          />
          <button type="button" disabled={disabled || values.length <= 1} onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}>
            删除
          </button>
        </div>
      ))}
      <button type="button" disabled={disabled} onClick={() => onChange([...values, ""])}>
        添加
      </button>
    </div>
  );
}

function CheckboxList({
  label,
  values,
  options,
  disabled,
  onChange
}: {
  label: string;
  values: string[];
  options: SkillEditorOption[];
  disabled?: boolean;
  onChange: (values: string[]) => void;
}) {
  const selected = new Set(values);
  return (
    <div className="skill-editor-checkbox-list">
      <span>{label}</span>
      <div>
        {options.map((option) => (
          <label key={option.value}>
            <input
              type="checkbox"
              checked={selected.has(option.value)}
              disabled={disabled}
              onChange={(event) => {
                if (event.target.checked) {
                  onChange([...values, option.value]);
                } else {
                  onChange(values.filter((value) => value !== option.value));
                }
              }}
            />
            <span>{option.text}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function ModifierStatList({ stats }: { stats: SkillEditorModifierStat[] }) {
  return (
    <ul className="skill-editor-modifier-stats">
      {stats.map((stat, index) => (
        <li key={`${stat.stat}-${index}`}>
          <span>{stat.stat_text}</span>
          <b>{formatModifierValue(stat.stat, stat.value)}</b>
          <em>{stat.layer_text}{stat.relation_text ? ` / ${stat.relation_text}` : ""}</em>
        </li>
      ))}
    </ul>
  );
}

function ModifierPreviewResult({ preview }: { preview: SkillEditorModifierPreview }) {
  const rows = [
    ["原始最终伤害", preview.baseline.final_damage, "测试后最终伤害", preview.tested.final_damage],
    ["原始最终冷却", preview.baseline.final_cooldown_ms, "测试后最终冷却", preview.tested.final_cooldown_ms],
    ["原始投射物数量", preview.baseline.projectile_count, "测试后投射物数量", preview.tested.projectile_count],
    ["原始投射物速度", preview.baseline.projectile_speed, "测试后投射物速度", preview.tested.projectile_speed]
  ] as const;
  return (
    <div className="skill-editor-modifier-preview">
      <h5>临时最终技能实例预览</h5>
      <dl>
        {rows.map(([leftLabel, leftValue, rightLabel, rightValue]) => (
          <div key={leftLabel}>
            <dt>{leftLabel}</dt>
            <dd>{formatPreviewNumber(leftValue)}</dd>
            <dt>{rightLabel}</dt>
            <dd>{formatPreviewNumber(rightValue)}</dd>
          </div>
        ))}
      </dl>
      <p>模拟关系：{preview.relation_text}；来源强度：{preview.source_power}；目标强度：{preview.target_power}；导管强度：{preview.conduit_power}</p>
      <h6>生效词缀列表</h6>
      {preview.applied_modifiers.length > 0 ? (
        <ul className="skill-editor-preview-modifier-list">
          {preview.applied_modifiers.map((modifier, index) => (
            <li key={`${modifier.id}-${modifier.stat.stat}-${index}`}>
              {modifier.name_text}：{modifier.stat.stat_text} {formatModifierValue(modifier.stat.stat, modifier.value)}（{modifier.layer_text}，{modifier.relation_text}）
            </li>
          ))}
        </ul>
      ) : (
        <p className="skill-editor-test-empty">没有生效的测试词缀。</p>
      )}
      <h6>未生效词缀列表</h6>
      {preview.unapplied_modifiers.length > 0 ? (
        <ul className="skill-editor-preview-modifier-list">
          {preview.unapplied_modifiers.map((modifier, index) => (
            <li key={`${modifier.id}-${modifier.stat.stat}-off-${index}`}>
              {modifier.name_text}：{modifier.reason_text}
            </li>
          ))}
        </ul>
      ) : (
        <p className="skill-editor-test-empty">没有未生效项。</p>
      )}
    </div>
  );
}

function SkillTestArenaResultView({
  result,
  stage,
  stageIndex
}: {
  result: SkillTestArenaResult;
  stage: SkillTestArenaStage;
  stageIndex: number;
}) {
  return (
    <div className="skill-test-arena-result">
      <div className="skill-test-arena-summary">
        <h5>本次测试结果</h5>
        <dl>
          <div><dt>测试技能</dt><dd>{result.skill_name_text}</dd></div>
          <div><dt>测试场景</dt><dd>{result.scene_name_text}</dd></div>
          <div><dt>测试栈状态</dt><dd>{result.modifier_stack_enabled ? "已启用" : "未启用"}</dd></div>
          <div><dt>当前阶段</dt><dd>{stage.stage_name_text}</dd></div>
          <div><dt>事件数量</dt><dd>{result.event_count}</dd></div>
          <div><dt>飞行时间</dt><dd>{formatPreviewNumber(result.flight_duration_ms)} 毫秒</dd></div>
        </dl>
      </div>
      <div className="skill-test-arena-checks">
        {result.has_area_spawn && <span>已生成范围</span>}
        {result.has_melee_arc && <span>已生成近战扇形</span>}
        {result.has_damage_zone && <span>已生成伤害结算区域</span>}
        {result.has_chain_segment && <span>已生成连锁段</span>}
        <span>{result.has_projectile_spawn ? "已生成投射物" : result.has_chain_segment ? "连锁段已生效" : result.has_damage_zone ? "伤害区域已生效" : result.has_area_spawn ? "范围生成已生效" : result.has_melee_arc ? "近战扇形已生效" : "缺少技能生成事件"}</span>
        <span>{result.has_damage ? "已生成伤害" : "缺少伤害"}</span>
        <span>{result.has_hit_vfx ? "已生成命中特效" : "缺少命中特效"}</span>
        <span>{result.has_floating_text ? "已生成伤害浮字" : "缺少伤害浮字"}</span>
        <span>{result.flight_no_damage_passed ? "飞行期间未扣血：通过" : "飞行期间未扣血：未通过"}</span>
      </div>
      <div className="skill-test-arena-columns">
        <div>
          <h5>怪物生命</h5>
          <MonsterLifeList monsters={stage.monsters} />
        </div>
        <div>
          <h5>命中目标</h5>
          {stage.hit_targets.length > 0 ? (
            <ul className="skill-test-arena-list">
              {stage.hit_targets.map((target) => <li key={target.enemy_id}>{target.name_text}</li>)}
            </ul>
          ) : (
            <p className="skill-editor-test-empty">当前阶段尚未命中目标。</p>
          )}
        </div>
        <div>
          <h5>实际伤害结果</h5>
          {stage.damage_results.length > 0 ? (
            <ul className="skill-test-arena-list">
              {stage.damage_results.map((damage, index) => (
                <li key={`${damage.enemy_id}-${damage.projectile_index}-${index}`}>
                  {damage.name_text}：{formatPreviewNumber(damage.amount)} 点，延迟 {damage.delay_ms} 毫秒
                </li>
              ))}
            </ul>
          ) : (
            <p className="skill-editor-test-empty">当前阶段尚未结算伤害。</p>
          )}
        </div>
      </div>
      <div className="skill-test-arena-summary">
        <h5>参数变化</h5>
        <dl>
          <div><dt>原始最终伤害</dt><dd>{formatPreviewNumber(result.baseline.final_damage)}</dd></div>
          <div><dt>测试后最终伤害</dt><dd>{formatPreviewNumber(result.tested.final_damage)}</dd></div>
          <div><dt>原始最终冷却</dt><dd>{formatPreviewNumber(result.baseline.final_cooldown_ms)}</dd></div>
          <div><dt>测试后最终冷却</dt><dd>{formatPreviewNumber(result.tested.final_cooldown_ms)}</dd></div>
          <div><dt>原始投射物数量</dt><dd>{formatPreviewNumber(result.baseline.projectile_count)}</dd></div>
          <div><dt>测试后投射物数量</dt><dd>{formatPreviewNumber(result.tested.projectile_count)}</dd></div>
          <div><dt>原始投射物速度</dt><dd>{formatPreviewNumber(result.baseline.projectile_speed)}</dd></div>
          <div><dt>测试后投射物速度</dt><dd>{formatPreviewNumber(result.tested.projectile_speed)}</dd></div>
        </dl>
      </div>
      <div className="skill-test-arena-events">
        <h5>本次事件原始摘要</h5>
        <p>当前显示第 {stageIndex + 1} 个测试阶段，已应用 {stage.applied_event_count} / {stage.total_event_count} 个事件。</p>
        {stage.event_summary.length > 0 ? (
          <ul className="skill-test-arena-list">
            {stage.event_summary.map((event) => (
              <li key={event.event_id}>
                {event.type_text}：延迟 {event.delay_ms} 毫秒，持续 {event.duration_ms} 毫秒，目标 {event.target_entity || "无"}{event.amount !== null ? `，数值 ${formatPreviewNumber(event.amount)}` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p className="skill-editor-test-empty">当前阶段没有事件。</p>
        )}
      </div>
      <SkillEventTimelineView result={result} visibleEventCount={stage.applied_event_count} />
    </div>
  );
}

function SkillEventTimelineView({ result, visibleEventCount }: { result: SkillTestArenaResult; visibleEventCount: number }) {
  const visibleEvents = result.event_timeline.slice(0, Math.min(visibleEventCount, MAX_SKILL_EDITOR_TIMELINE_ROWS));
  const hiddenEventCount = Math.max(0, visibleEventCount - visibleEvents.length);
  return (
    <div className="skill-event-timeline">
      <div className="skill-event-timeline-heading">
        <div>
          <h5>技能事件时间线</h5>
          <p>数据来自本次测试运行的真实技能事件序列，重置或切换场景后会清空旧结果。</p>
        </div>
        <span>{visibleEvents.length} / {result.event_timeline.length} 个事件</span>
      </div>
      <div className="skill-event-supported-types" aria-label="支持识别的事件类型">
        {result.timeline_supported_types.map((eventType) => (
          <span key={eventType.type}>{eventType.text}</span>
        ))}
      </div>
      <div className="skill-event-checks">
        <TimelineCheck label="存在范围生成" passed={Boolean(result.timeline_checks.has_area_spawn)} />
        <TimelineCheck label="范围以玩家为中心" passed={Boolean(result.timeline_checks.area_center_passed ?? true)} />
        <TimelineCheck label="存在伤害结算区域" passed={Boolean(result.timeline_checks.has_damage_zone)} />
        <TimelineCheck label="伤害区域从玩家发出" passed={Boolean(result.timeline_checks.damage_zone_origin_passed ?? true)} />
        <TimelineCheck label="存在近战扇形" passed={Boolean(result.timeline_checks.has_melee_arc)} />
        <TimelineCheck label="扇形从玩家发出" passed={Boolean(result.timeline_checks.melee_arc_origin_passed ?? true)} />
        <TimelineCheck label="存在连锁段" passed={Boolean(result.timeline_checks.has_chain_segment)} />
        <TimelineCheck label="存在多段连锁" passed={Boolean(result.timeline_checks.has_multiple_chain_segment ?? true)} />
        <TimelineCheck label="默认不重复命中" passed={Boolean(result.timeline_checks.chain_no_repeat_targets ?? true)} />
        <TimelineCheck label="存在投射物生成" passed={result.timeline_checks.has_projectile_spawn} />
        <TimelineCheck label="存在多枚投射物" passed={result.timeline_checks.has_multiple_projectile_spawn} />
        <TimelineCheck label="存在投射物命中" passed={result.timeline_checks.has_projectile_hit} />
        <TimelineCheck label="存在伤害结算" passed={result.timeline_checks.has_damage} />
        <TimelineCheck label="存在命中特效" passed={result.timeline_checks.has_hit_vfx} />
        <TimelineCheck label="存在伤害浮字" passed={result.timeline_checks.has_floating_text} />
        <TimelineCheck label="伤害不早于投射物生成" passed={result.timeline_checks.damage_after_or_at_projectile_spawn} />
        <TimelineCheck label="伤害不早于命中时机" passed={Boolean(result.timeline_checks.damage_after_or_at_area_hit ?? true)} />
        <TimelineCheck label="伤害不早于近战命中" passed={Boolean(result.timeline_checks.damage_after_or_at_melee_hit ?? true)} />
        <TimelineCheck label="伤害不早于连锁段" passed={Boolean(result.timeline_checks.damage_after_or_at_chain_segment ?? true)} />
        <TimelineCheck label="飞行期间未扣血" passed={result.timeline_checks.flight_no_damage_passed} />
        <TimelineCheck label="扇形方向可见" passed={result.timeline_checks.fan_direction_passed} />
        <TimelineCheck label="基础时序检查" passed={result.timeline_checks.basic_timing_passed} />
      </div>
      {visibleEvents.length > 0 ? (
        <>
          <ol className="skill-event-timeline-list">
            {visibleEvents.map((event) => (
              <li key={event.event_id} className={`skill-event-timeline-item skill-event-${event.type}`}>
                <div className="skill-event-timeline-item-head">
                  <strong>{event.type_text}</strong>
                  <span>事件时间 {event.timestamp_ms} 毫秒</span>
                </div>
                <dl>
                  <div><dt>延迟</dt><dd>{event.delay_ms} 毫秒</dd></div>
                  <div><dt>持续时间</dt><dd>{event.duration_ms} 毫秒</dd></div>
                  <div><dt>来源实体</dt><dd>{event.source_entity || "无"}</dd></div>
                  <div><dt>目标实体</dt><dd>{event.target_entity || "无"}</dd></div>
                  <div><dt>数值</dt><dd>{event.amount === null ? "无" : formatPreviewNumber(event.amount)}</dd></div>
                  <div><dt>伤害类型</dt><dd>{event.damage_type ? damageTypeText(event.damage_type) : "无"}</dd></div>
                  <div><dt>特效标识</dt><dd>{event.vfx_key || "无"}</dd></div>
                  <div><dt>原因标识</dt><dd>{event.reason_key || "无"}</dd></div>
                </dl>
                <details>
                  <summary>附加数据</summary>
                  <pre>{event.payload_text || JSON.stringify(event.payload, null, 2)}</pre>
                </details>
              </li>
            ))}
          </ol>
          {hiddenEventCount > 0 && (
            <p className="skill-event-timeline-limit">当前阶段还有 {hiddenEventCount} 个事件未在首屏展开，完整事件仍保留在测试结果中。</p>
          )}
        </>
      ) : (
        <p className="skill-editor-test-empty">当前测试阶段尚无可显示事件。</p>
      )}
    </div>
  );
}

function TimelineCheck({ label, passed }: { label: string; passed: boolean }) {
  return <span className={passed ? "skill-event-check-pass" : "skill-event-check-fail"}>{label}：{passed ? "通过" : "未通过"}</span>;
}

function MonsterLifeList({ monsters }: { monsters: SkillTestArenaEnemy[] }) {
  return (
    <ul className="skill-test-arena-list">
      {monsters.map((monster) => (
        <li key={monster.enemy_id}>
          {monster.name_text}：{formatPreviewNumber(monster.current_life)} / {formatPreviewNumber(monster.max_life)}，{monster.is_alive ? "存活" : "已击破"}
        </li>
      ))}
    </ul>
  );
}

function validateModifierPower(
  sourcePower: number,
  targetPower: number,
  conduitPower: number,
  limits: { min: number; max: number }
) {
  const values = [
    ["source_power", sourcePower],
    ["target_power", targetPower],
    ["conduit_power", conduitPower]
  ] as const;
  for (const [label, value] of values) {
    if (!Number.isFinite(value)) return `${label} 必须是合法数字。`;
    if (value < limits.min || value > limits.max) return `${label} 必须在 ${limits.min} 到 ${limits.max} 之间。`;
  }
  return "";
}

function formatPreviewNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatModifierValue(stat: string, value: number) {
  if (stat === "conduit_multiplier") return `×${formatPreviewNumber(value)}`;
  if (stat.endsWith("_percent")) return `${value >= 0 ? "+" : ""}${formatPreviewNumber(value)}%`;
  return `${value >= 0 ? "+" : ""}${formatPreviewNumber(value)}`;
}

function clonePackageData(packageData: SkillPackageData | null | undefined): SkillPackageData | null {
  return packageData ? JSON.parse(JSON.stringify(packageData)) as SkillPackageData : null;
}

function numberValue(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function optionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function clampProjectileDuration(durationMs: number, minDurationMs: number, maxDurationMs: number | null) {
  const minClamped = Math.max(minDurationMs, durationMs);
  return maxDurationMs === null ? minClamped : Math.min(minClamped, maxDurationMs);
}

function projectileTravelDurationMs(packageData: SkillPackageData) {
  const speed = numberValue(packageData.behavior.params.projectile_speed, 1);
  const distance = numberValue(packageData.behavior.params.max_distance, 0);
  if (speed <= 0) return 0;
  return Math.round((distance / speed) * 1000);
}

function projectileTravelSummary(packageData: SkillPackageData) {
  const durationMs = projectileTravelDurationMs(packageData);
  const count = Math.max(1, Math.round(numberValue(packageData.behavior.params.projectile_count, 1)));
  return `${count} 枚，每枚约 ${durationMs} ms`;
}

function playerNovaRangeSummary(packageData: SkillPackageData) {
  const radius = numberValue(packageData.behavior.params.radius, 0);
  const ringWidth = numberValue(packageData.behavior.params.ring_width, 0);
  const maxTargets = Math.max(1, Math.round(numberValue(packageData.behavior.params.max_targets, 1)));
  return `半径 ${radius}，环宽 ${ringWidth}，最多命中 ${maxTargets} 个目标`;
}

function playerNovaHitTimingSummary(packageData: SkillPackageData) {
  const expandDurationMs = Math.max(0, Math.round(numberValue(packageData.behavior.params.expand_duration_ms, 0)));
  const hitAtMs = Math.max(0, Math.round(numberValue(packageData.behavior.params.hit_at_ms, 0)));
  return `扩散 ${expandDurationMs} ms，${hitAtMs} ms 时结算伤害`;
}

function meleeArcRangeSummary(packageData: SkillPackageData) {
  const arcAngle = clamp(numberValue(packageData.behavior.params.arc_angle, 0), 1, 180);
  const arcRadius = Math.max(1, numberValue(packageData.behavior.params.arc_radius, 1));
  const maxTargets = Math.max(1, Math.round(numberValue(packageData.behavior.params.max_targets, 1)));
  return `半径 ${formatPreviewNumber(arcRadius)}，角度 ${formatPreviewNumber(arcAngle)}°，最多命中 ${maxTargets} 个目标`;
}

function meleeArcHitTimingSummary(packageData: SkillPackageData) {
  const windupMs = Math.max(0, Math.round(numberValue(packageData.behavior.params.windup_ms, 0)));
  const hitAtMs = Math.max(0, Math.round(numberValue(packageData.behavior.params.hit_at_ms, 0)));
  return `前摇 ${windupMs} ms，${hitAtMs} ms 时结算伤害`;
}

function chainSegmentSummary(packageData: SkillPackageData) {
  const params = packageData.behavior.params;
  const chainCount = Math.max(1, Math.round(numberValue(params.chain_count, 1)));
  const maxTargets = Math.max(1, Math.round(numberValue(params.max_targets, chainCount)));
  const chainRadius = Math.max(1, numberValue(params.chain_radius, 1));
  return `最多 ${Math.min(chainCount, maxTargets)} 段，跳跃半径 ${formatPreviewNumber(chainRadius)}`;
}

function chainDurationSummary(packageData: SkillPackageData) {
  const params = packageData.behavior.params;
  const chainCount = Math.max(1, Math.round(numberValue(params.chain_count, 1)));
  const maxTargets = Math.max(1, Math.round(numberValue(params.max_targets, chainCount)));
  const segmentCount = Math.min(chainCount, maxTargets);
  const chainDelayMs = Math.max(0, Math.round(numberValue(params.chain_delay_ms, 0)));
  const windupMs = Math.max(0, Math.round(numberValue(packageData.cast.windup_ms, 0)));
  return `前摇 ${windupMs} ms，预计 ${windupMs + Math.max(0, segmentCount - 1) * chainDelayMs} ms 完成`;
}

function damageZoneRangeSummary(packageData: SkillPackageData) {
  const params = packageData.behavior.params;
  const maxTargets = Math.max(1, Math.round(numberValue(params.max_targets, 1)));
  if (String(params.shape ?? "circle") === "rectangle") {
    return `矩形，长 ${formatPreviewNumber(numberValue(params.length, 0))}，宽 ${formatPreviewNumber(numberValue(params.width, 0))}，角度 ${formatPreviewNumber(numberValue(params.angle_offset_deg, 0))}°，最多命中 ${maxTargets} 个目标`;
  }
  return `圆形，半径 ${formatPreviewNumber(numberValue(params.radius, 0))}，角度 360°，最多命中 ${maxTargets} 个目标`;
}

function damageZoneHitTimingSummary(packageData: SkillPackageData) {
  const hitAtMs = Math.max(0, Math.round(numberValue(packageData.behavior.params.hit_at_ms, 0)));
  return `${hitAtMs} ms 时通过 damage 事件结算伤害`;
}

function projectileLaneOffsets(projectileCount: number, spacing = 18) {
  const visibleCount = Math.max(1, Math.min(12, Math.round(projectileCount)));
  const center = (visibleCount - 1) / 2;
  return Array.from({ length: visibleCount }, (_, index) => (index - center) * spacing);
}

type EnemySpatialIndex = {
  chunkSize: number;
  chunks: Map<string, Enemy[]>;
};

const ENEMY_SPATIAL_INDEX_CACHE = new WeakMap<Enemy[], EnemySpatialIndex>();

type EnemyNavigationContext = {
  map: BakedBattleMapData;
  width: number;
  height: number;
  cellSize: number;
  field: number[];
  occupancy: number[];
  wallCost: number[];
};

type EnemyNavigationHeapNode = {
  index: number;
  cost: number;
};

function createProceduralSpawnPlanEnemies(map: BakedBattleMapData, startId: number, selectedMapId: string | null, stage?: MapProgressionStageView | null) {
  const spawnMap = isEditorRuntimeBattleMap(map) ? {
    ...map,
    zones: map.editorZones.map((zone) => ({
      id: zone.id,
      zoneType: zone.zoneType,
      shape: zone.shape,
      points: zone.points.map((point) => editorRuntimeCoordinatePoint(point.x, point.y, map.meta.grid_size)),
      rects: mapEditorZoneRects(zone).map((rect) => ({
        start: editorRuntimeCoordinatePoint(rect.start.x, rect.start.y, map.meta.grid_size),
        end: editorRuntimeCoordinatePoint(rect.end.x, rect.end.y, map.meta.grid_size)
      }))
    }))
  } : map;
  const result = generateProceduralMonsterSpawns(spawnMap, {
    ...(mapSpawnV1Config as MapSpawnV1Config),
    monster_definitions: parseMonsterDefinitionsToml(monsterDefsToml)
  }, {
    startId,
    seed: `${selectedMapId ?? map.id}:${map.displayName}:v1:${Date.now()}:${Math.random()}`
  });
  const level = Math.max(1, Number(stage?.monster_level ?? 1));
  const lifeScale = 1 + Math.max(0, level - 1) * 0.08;
  const damageScale = 1 + Math.max(0, level - 1) * 0.045;
  const enemies: Enemy[] = result.enemies.map((monster) => {
    const maxHp = Math.max(1, Math.round(monster.max_hp * lifeScale));
    return {
      id: monster.runtime_id,
      x: monster.x,
      y: monster.y,
      hp: maxHp,
      maxHp,
      monsterId: monster.monster_id,
      authored: true,
      boss: monster.boss,
      spawnPlanSourceId: monster.aggro_source_id,
      proceduralMonsterPackId: monster.monster_pack_id,
      proceduralZoneType: monster.zone_type,
      spawnRarity: monster.spawn_rarity,
      lifeMultiplier: monster.life_multiplier * lifeScale,
      damageMultiplier: monster.damage_multiplier * damageScale,
      baseDamage: monster.base_damage * damageScale,
      damageType: monster.damage_type,
      hitKind: monster.hit_kind,
      attackRange: monster.attack_range,
      attackCadenceMs: monster.attack_cadence_ms,
      offenseModifiers: monster.offense_modifiers,
      runtimeTier: monster.boss ? "active" : "dormant",
      nextThinkAt: 0
    };
  });
  const aggroSources: RuntimeEncounterAggroSource[] = result.aggroSources.map((source) => ({
    id: source.id,
    kind: source.kind,
    x: source.x,
    y: source.y,
    aggroRadius: source.aggroRadius
  }));
  return { enemies, aggroSources, nextId: result.nextId, debug: result.debug };
}

function shapeEffectsFromUnknown(value: unknown): ShapeEffectPreview[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === "string") return [{ id: item, text: item }];
    if (!item || typeof item !== "object") return [];
    const effect = item as { id?: unknown; text?: unknown };
    if (typeof effect.id !== "string" || effect.id.length === 0) return [];
    return [{ id: effect.id, text: typeof effect.text === "string" ? effect.text : effect.id }];
  });
}

function hasShapeEffect(effects: ShapeEffectPreview[] | undefined, id: string) {
  return (effects ?? []).some((effect) => effect.id === id);
}

function proceduralSpawnLogLine(debug: ProceduralSpawnDebugSummary) {
  return `程序化生怪：地图类型 ${debug.map_type}，预算 ${debug.spent_pack_budget}/${debug.base_pack_budget}，怪物包 ${debug.generated_pack_count}，普通 ${debug.normal_monster_count}，魔法 ${debug.magic_monster_count}，稀有 ${debug.rare_monster_count}，传奇 ${debug.boss_monster_count}。`;
}

function createEnemySpatialIndex(enemies: Enemy[], chunkSize = ENEMY_SPATIAL_CHUNK_SIZE): EnemySpatialIndex {
  const chunks = new Map<string, Enemy[]>();
  for (const enemy of enemies) {
    if (enemy.hp <= 0 || enemy.runtimeTier === "dead") continue;
    const key = enemySpatialChunkKey(enemy.x, enemy.y, chunkSize);
    const chunk = chunks.get(key);
    if (chunk) chunk.push(enemy);
    else chunks.set(key, [enemy]);
  }
  return { chunkSize, chunks };
}

function queryEnemySpatialIndex(index: EnemySpatialIndex, center: { x: number; y: number }, radius: number) {
  const minX = Math.floor((center.x - radius) / index.chunkSize);
  const maxX = Math.floor((center.x + radius) / index.chunkSize);
  const minY = Math.floor((center.y - radius) / index.chunkSize);
  const maxY = Math.floor((center.y + radius) / index.chunkSize);
  const result: Enemy[] = [];
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const chunk = index.chunks.get(`${x}:${y}`);
      if (!chunk) continue;
      for (const enemy of chunk) {
        if (distance(enemy, center) <= radius) result.push(enemy);
      }
    }
  }
  return result;
}

function enemySpatialChunkKey(x: number, y: number, chunkSize: number) {
  return `${Math.floor(x / chunkSize)}:${Math.floor(y / chunkSize)}`;
}

function candidateEnemiesNear(enemies: Enemy[], center: { x: number; y: number }, radius: number) {
  let spatialIndex = ENEMY_SPATIAL_INDEX_CACHE.get(enemies);
  if (!spatialIndex) {
    spatialIndex = createEnemySpatialIndex(enemies);
    ENEMY_SPATIAL_INDEX_CACHE.set(enemies, spatialIndex);
  }
  return queryEnemySpatialIndex(spatialIndex, center, radius);
}

function createEnemyNavigationContext(enemies: Enemy[], player: { x: number; y: number }, map: BakedBattleMapData | null): EnemyNavigationContext | null {
  if (!map) return null;
  const width = map.gridWidth;
  const height = map.gridHeight;
  const cellSize = map.meta.grid_size;
  const size = width * height;
  const context: EnemyNavigationContext = {
    map,
    width,
    height,
    cellSize,
    field: Array(size).fill(ENEMY_NAVIGATION_INF),
    occupancy: Array(size).fill(0),
    wallCost: Array(size).fill(0)
  };

  for (let gridY = 0; gridY < height; gridY += 1) {
    for (let gridX = 0; gridX < width; gridX += 1) {
      const index = enemyGridIndex(context, gridX, gridY);
      context.wallCost[index] = enemyGridWallCost(map, gridX, gridY);
    }
  }

  for (const enemy of enemies) {
    if (enemy.hp <= 0 || enemy.runtimeTier === "dead") continue;
    const cell = enemyWorldToGrid(map, enemy);
    addEnemyNavigationOccupancy(context, cell.gridX, cell.gridY, 1);
    for (const direction of ENEMY_NAVIGATION_DIRECTIONS) {
      addEnemyNavigationOccupancy(context, cell.gridX + direction.x, cell.gridY + direction.y, 0.28);
    }
  }

  const targets = enemyNavigationTargetCells(map, player);
  if (targets.length === 0) return null;

  const heap: EnemyNavigationHeapNode[] = [];
  for (const target of targets) {
    const index = enemyGridIndex(context, target.gridX, target.gridY);
    const initialCost = context.wallCost[index] * ENEMY_NAVIGATION_WALL_COST;
    if (initialCost >= context.field[index]) continue;
    context.field[index] = initialCost;
    enemyNavigationHeapPush(heap, { index, cost: initialCost });
  }

  while (heap.length > 0) {
    const current = enemyNavigationHeapPop(heap)!;
    if (current.cost !== context.field[current.index]) continue;
    const gridX = current.index % width;
    const gridY = Math.floor(current.index / width);
    for (const direction of ENEMY_NAVIGATION_DIRECTIONS) {
      const nextX = gridX + direction.x;
      const nextY = gridY + direction.y;
      if (!enemyCanStepGrid(map, gridX, gridY, nextX, nextY)) continue;
      const nextIndex = enemyGridIndex(context, nextX, nextY);
      const nextCost = current.cost
        + direction.cost
        + context.wallCost[nextIndex] * ENEMY_NAVIGATION_WALL_COST;
      if (nextCost >= context.field[nextIndex]) continue;
      context.field[nextIndex] = nextCost;
      enemyNavigationHeapPush(heap, { index: nextIndex, cost: nextCost });
    }
  }

  return context;
}

function createRuntimeEnemyNavigationContext(enemies: Enemy[], player: { x: number; y: number }, map: BakedBattleMapData | null) {
  return createEnemyNavigationContext(enemies, player, map);
}

function enemyNavigationTargetCells(map: BakedBattleMapData, player: { x: number; y: number }) {
  const center = enemyWorldToGrid(map, player);
  const result: { gridX: number; gridY: number }[] = [];
  if (enemyGridWalkable(map, center.gridX, center.gridY)) return [center];
  for (let y = -ENEMY_NAVIGATION_TARGET_RADIUS_CELLS; y <= ENEMY_NAVIGATION_TARGET_RADIUS_CELLS; y += 1) {
    for (let x = -ENEMY_NAVIGATION_TARGET_RADIUS_CELLS; x <= ENEMY_NAVIGATION_TARGET_RADIUS_CELLS; x += 1) {
      const distanceCells = Math.hypot(x, y);
      if (distanceCells < 1 || distanceCells > ENEMY_NAVIGATION_TARGET_RADIUS_CELLS) continue;
      const gridX = center.gridX + x;
      const gridY = center.gridY + y;
      if (!enemyGridWalkable(map, gridX, gridY)) continue;
      result.push({ gridX, gridY });
    }
  }
  return result;
}

function addEnemyNavigationOccupancy(context: EnemyNavigationContext, gridX: number, gridY: number, amount: number) {
  if (!enemyGridInBounds(context, gridX, gridY)) return;
  context.occupancy[enemyGridIndex(context, gridX, gridY)] += amount;
}

function enemyGridWallCost(map: BakedBattleMapData, gridX: number, gridY: number) {
  if (!enemyGridWalkable(map, gridX, gridY)) return ENEMY_NAVIGATION_INF;
  let nearestBlocked = ENEMY_NAVIGATION_WALL_CHECK_RADIUS_CELLS + 1;
  for (let y = -ENEMY_NAVIGATION_WALL_CHECK_RADIUS_CELLS; y <= ENEMY_NAVIGATION_WALL_CHECK_RADIUS_CELLS; y += 1) {
    for (let x = -ENEMY_NAVIGATION_WALL_CHECK_RADIUS_CELLS; x <= ENEMY_NAVIGATION_WALL_CHECK_RADIUS_CELLS; x += 1) {
      if (x === 0 && y === 0) continue;
      const distanceCells = Math.hypot(x, y);
      if (distanceCells > ENEMY_NAVIGATION_WALL_CHECK_RADIUS_CELLS || distanceCells >= nearestBlocked) continue;
      if (!enemyGridWalkable(map, gridX + x, gridY + y)) nearestBlocked = distanceCells;
    }
  }
  if (nearestBlocked > ENEMY_NAVIGATION_WALL_CHECK_RADIUS_CELLS) return 0;
  return (ENEMY_NAVIGATION_WALL_CHECK_RADIUS_CELLS + 1 - nearestBlocked) / ENEMY_NAVIGATION_WALL_CHECK_RADIUS_CELLS;
}

function enemyWorldToGrid(map: BakedBattleMapData, point: { x: number; y: number }) {
  return {
    gridX: clamp(Math.floor(point.x / map.meta.grid_size), 0, map.gridWidth - 1),
    gridY: clamp(Math.floor(point.y / map.meta.grid_size), 0, map.gridHeight - 1)
  };
}

function enemyGridCenter(map: BakedBattleMapData, gridX: number, gridY: number) {
  return {
    x: gridX * map.meta.grid_size + map.meta.grid_size / 2,
    y: gridY * map.meta.grid_size + map.meta.grid_size / 2
  };
}

function enemyGridIndex(context: Pick<EnemyNavigationContext, "width">, gridX: number, gridY: number) {
  return gridY * context.width + gridX;
}

function enemyGridInBounds(context: Pick<EnemyNavigationContext, "width" | "height">, gridX: number, gridY: number) {
  return gridX >= 0 && gridY >= 0 && gridX < context.width && gridY < context.height;
}

function enemyGridWalkable(map: BakedBattleMapData, gridX: number, gridY: number) {
  return Boolean(map.walkableGrid[gridY]?.[gridX]);
}

function enemyCanStepGrid(map: BakedBattleMapData, fromX: number, fromY: number, toX: number, toY: number) {
  if (!enemyGridWalkable(map, toX, toY)) return false;
  const dx = toX - fromX;
  const dy = toY - fromY;
  if (Math.abs(dx) + Math.abs(dy) <= 1) return true;
  return enemyGridWalkable(map, fromX + dx, fromY) && enemyGridWalkable(map, fromX, fromY + dy);
}

function enemyNavigationHeapPush(heap: EnemyNavigationHeapNode[], node: EnemyNavigationHeapNode) {
  heap.push(node);
  let index = heap.length - 1;
  while (index > 0) {
    const parent = Math.floor((index - 1) / 2);
    if (heap[parent].cost <= node.cost) break;
    heap[index] = heap[parent];
    index = parent;
  }
  heap[index] = node;
}

function enemyNavigationHeapPop(heap: EnemyNavigationHeapNode[]) {
  if (heap.length === 0) return null;
  const result = heap[0];
  const last = heap.pop()!;
  if (heap.length === 0) return result;
  let index = 0;
  while (true) {
    const left = index * 2 + 1;
    const right = left + 1;
    if (left >= heap.length) break;
    const child = right < heap.length && heap[right].cost < heap[left].cost ? right : left;
    if (heap[child].cost >= last.cost) break;
    heap[index] = heap[child];
    index = child;
  }
  heap[index] = last;
  return result;
}

function updateRuntimeEnemies(
  current: Enemy[],
  player: { x: number; y: number },
  map: BakedBattleMapData | null,
  dt: number,
  elapsedSeconds: number,
  authoredSpawnPlanActive: boolean,
  aggroSources: RuntimeEncounterAggroSource[] = [],
  triggeredSourceIds: Set<string> = new Set(),
  attackLockedEnemyIds: Set<number> = new Set()
) {
  const movingCurrent = current
    .filter((enemy) => shouldRetainEnemyForGameplayOrDamageFlash(enemy, elapsedSeconds))
    .map((enemy) => resetEnemyEngagement(enemy));
  if (!authoredSpawnPlanActive) {
    const spatialIndex = createEnemySpatialIndex(movingCurrent);
    const navigation = createRuntimeEnemyNavigationContext(movingCurrent, player, map);
    return separateOverlappingEnemies(
      movingCurrent.map((enemy) => {
        if (enemy.hp <= 0) return { ...enemy, velocityX: 0, velocityY: 0, runtimeTier: "dead" as const };
        const survivalEnemy = { ...enemy, aggroLocked: true };
        return attackLockedEnemyIds.has(enemy.id)
          ? freezeAttackingEnemy(survivalEnemy, "active")
          : moveEnemyTowardPlayer(survivalEnemy, player, map, dt, "active", spatialIndex, navigation);
      }),
      map,
      attackLockedEnemyIds,
      player
    );
  }
  const spatialIndex = createEnemySpatialIndex(movingCurrent);
  const nearbyEnemyAggroSourceIds = new Set(
    queryEnemySpatialIndex(spatialIndex, player, ENEMY_INDIVIDUAL_AGGRO_RADIUS)
      .flatMap((enemy) => enemy.spawnPlanSourceId ? [enemy.spawnPlanSourceId] : [])
  );
  for (const source of aggroSources) {
    if (!triggeredSourceIds.has(source.id) && (distance(source, player) <= source.aggroRadius || nearbyEnemyAggroSourceIds.has(source.id))) {
      triggeredSourceIds.add(source.id);
    }
  }
  const navigation = createRuntimeEnemyNavigationContext(movingCurrent, player, map);
  const visibleIds = new Set(queryEnemySpatialIndex(spatialIndex, player, ENEMY_CAMERA_VISIBLE_RANGE).map((enemy) => enemy.id));
  const activeIds = new Set(queryEnemySpatialIndex(spatialIndex, player, ENEMY_ACTIVE_RANGE).map((enemy) => enemy.id));
  const simulationIds = runtimeEnemySimulationIds(movingCurrent, player);
  const movedEnemies = movingCurrent.map((enemy) => {
    if (enemy.hp <= 0) return { ...enemy, runtimeTier: "dead" as const };
    if (!simulationIds.has(enemy.id)) {
      const tier: EnemyRuntimeTier = visibleIds.has(enemy.id) ? "visible" : "dormant";
      return { ...enemy, runtimeTier: tier, velocityX: 0, velocityY: 0 };
    }
    const aggroLocked = Boolean(enemy.aggroLocked || (enemy.spawnPlanSourceId && triggeredSourceIds.has(enemy.spawnPlanSourceId)));
    if (!aggroLocked) {
      const tier: EnemyRuntimeTier = visibleIds.has(enemy.id) ? "visible" : "dormant";
      return { ...enemy, aggroLocked: false, runtimeTier: tier, velocityX: 0, velocityY: 0 };
    }
    const tier: EnemyRuntimeTier = visibleIds.has(enemy.id)
      ? "visible"
      : activeIds.has(enemy.id)
        ? "active"
        : "aware";
    if (attackLockedEnemyIds.has(enemy.id)) {
      return {
        ...freezeAttackingEnemy(enemy, tier),
        aggroLocked,
        nextThinkAt: tier === "aware" ? elapsedSeconds + ENEMY_LOW_FREQUENCY_THINK_INTERVAL : elapsedSeconds
      };
    }
    if (tier === "aware" && (enemy.nextThinkAt ?? 0) > elapsedSeconds) return { ...enemy, runtimeTier: tier };
    const moved = moveEnemyTowardPlayer(enemy, player, map, tier === "aware" ? dt * 0.35 : dt, tier, spatialIndex, navigation);
    return {
      ...moved,
      aggroLocked,
      nextThinkAt: tier === "aware" ? elapsedSeconds + ENEMY_LOW_FREQUENCY_THINK_INTERVAL : elapsedSeconds
    };
  }).filter((enemy) => enemy.runtimeTier !== "dead" || shouldRetainEnemyForDamageFlash(enemy, elapsedSeconds));
  return separateOverlappingEnemies(movedEnemies, map, attackLockedEnemyIds, player);
}

function resetEnemyEngagement(enemy: Enemy): Enemy {
  if (enemy.engagementTier === undefined && enemy.engagementRing === undefined && enemy.engagementSlot === undefined) return enemy;
  return {
    ...enemy,
    engagementTier: undefined,
    engagementRing: undefined,
    engagementSlot: undefined
  };
}

function monsterAttackRange(enemy: Enemy) {
  const configuredRange = Math.max(1, enemy.attackRange ?? ENEMY_MELEE_ATTACK_DISTANCE);
  return Math.max(configuredRange, meleeContactAttackRange(enemy));
}

function monsterMeleeReachRange(enemy: Enemy) {
  const configuredRange = Math.max(1, enemy.attackRange ?? ENEMY_MELEE_ATTACK_DISTANCE);
  if (configuredRange > ENEMY_MELEE_ATTACK_RANGE_MAX) return monsterAttackRange(enemy);
  return monsterAttackRange(enemy) + ENEMY_MELEE_EDGE_CONTACT_TOLERANCE;
}

function meleeContactAttackRange(enemy: Enemy) {
  return PLAYER_GEOMETRY_RADIUS + enemyVisualRadius(enemy) + ENEMY_MELEE_CONTACT_GAP;
}

function enemyVisualRadius(enemy: Enemy) {
  const visual = resolveMonsterGeometryVisual(enemy.monsterId);
  if (visual) return visual.sizePx * 0.5;
  return enemy.boss || enemy.monsterId === "enemy_brute" ? ENEMY_BOSS_COLLISION_RADIUS : ENEMY_COLLISION_RADIUS;
}

function monsterAttackCadenceMs(enemy: Enemy) {
  return Math.max(120, enemy.attackCadenceMs ?? ENEMY_ATTACK_VISUAL_DURATION_MS + ENEMY_ATTACK_VISUAL_COOLDOWN_MS);
}

function monsterOffenseModifier(enemy: Enemy, statId: string) {
  return Number(enemy.offenseModifiers?.[statId] ?? 0);
}

function monsterOutgoingDamage(enemy: Enemy) {
  const damageType = enemy.damageType ?? "physical";
  const hitKind = enemy.hitKind ?? "attack";
  const baseDamage = Math.max(0, Number(enemy.baseDamage ?? 8));
  const damageMultiplier = Math.max(0, Number(enemy.damageMultiplier ?? 1));
  const additivePercent =
    monsterOffenseModifier(enemy, "damage_add_percent")
    + monsterOffenseModifier(enemy, "all_damage_type_add_percent")
    + monsterOffenseModifier(enemy, `${damageType}_damage_add_percent`)
    + monsterOffenseModifier(enemy, "hit_damage_add_percent")
    + monsterOffenseModifier(enemy, `${hitKind}_damage_add_percent`)
    + monsterOffenseModifier(enemy, "melee_damage_add_percent");
  const finalPercent =
    monsterOffenseModifier(enemy, "damage_final_percent")
    + monsterOffenseModifier(enemy, "hit_damage_final_percent");
  return baseDamage
    * damageMultiplier
    * Math.max(0, 1 + additivePercent / 100)
    * Math.max(0, 1 + finalPercent / 100);
}

function resolveMonsterHitAgainstPlayer(enemy: Enemy, player: PlayerRuntimeState, stats: AppState["player_stats"] | undefined, blocked = false) {
  const damageType = enemy.damageType ?? "physical";
  const hitKind = enemy.hitKind ?? "attack";
  const penetrationPercent = monsterOffenseModifier(enemy, "resistance_penetration_percent");
  let incoming = monsterOutgoingDamage(enemy);
  const evasion = statNumber(stats?.evasion, 0);
  const evasionAddPercent = statNumber(stats?.evasion_add_percent, 0);
  const effectiveEvasion = Math.max(0, evasion * (1 + evasionAddPercent / 100));
  const evasionChance = effectiveEvasion > 0 ? Math.min(0.95, effectiveEvasion / (effectiveEvasion + 1000)) : 0;
  incoming *= 1 - evasionChance;

  if (blocked) {
    const blockReduction = clamp(statNumber(stats?.block_damage_reduction_percent, 0), 0, 100) / 100;
    incoming *= 1 - blockReduction;
  }

  incoming = Object.entries(convertIncomingPlayerDamageComponents({ [damageType]: incoming }, stats))
    .reduce((sum, [componentType, amount]) => sum + mitigateIncomingPlayerDamageComponent(Number(amount), componentType, stats, penetrationPercent), 0);

  const totalDamage = Math.max(0, incoming);
  const shieldDamage = Math.min(Math.max(0, player.currentEnergyShield), totalDamage);
  const lifeDamage = Math.max(0, totalDamage - shieldDamage);
  const nextPlayer: PlayerRuntimeState = {
    ...player,
    currentEnergyShield: clamp(player.currentEnergyShield - shieldDamage, 0, player.maxEnergyShield),
    hp: clamp(player.hp - lifeDamage, 0, player.maxHp)
  };
  return { damageType, hitKind, blocked, totalDamage, shieldDamage, lifeDamage, nextPlayer };
}

function playerResistancePercent(stats: AppState["player_stats"] | undefined, damageType: string, penetrationPercent: number) {
  if (damageType === "fire") return Math.min(playerResistanceCap(stats, "fire"), statNumber(stats?.fire_resistance_percent, 0) + statNumber(stats?.elemental_resistance_percent, 0)) - penetrationPercent;
  if (damageType === "cold") return Math.min(playerResistanceCap(stats, "cold"), statNumber(stats?.cold_resistance_percent, 0) + statNumber(stats?.elemental_resistance_percent, 0)) - penetrationPercent;
  if (damageType === "lightning") return Math.min(playerResistanceCap(stats, "lightning"), statNumber(stats?.lightning_resistance_percent, 0) + statNumber(stats?.elemental_resistance_percent, 0)) - penetrationPercent;
  if (damageType === "chaos") return Math.min(playerResistanceCap(stats, "chaos"), statNumber(stats?.chaos_resistance_percent, 0)) - penetrationPercent;
  return 0;
}

function playerResistanceCap(stats: AppState["player_stats"] | undefined, damageType: string) {
  if (damageType === "chaos") return clamp(statNumber(stats?.max_chaos_resistance_percent, 75), 0, 100);
  const elementalCap = statNumber(stats?.max_elemental_resistance_percent, 75) - 75;
  if (damageType === "fire") return clamp(statNumber(stats?.max_fire_resistance_percent, 75) + elementalCap, 0, 100);
  if (damageType === "cold") return clamp(statNumber(stats?.max_cold_resistance_percent, 75) + elementalCap, 0, 100);
  if (damageType === "lightning") return clamp(statNumber(stats?.max_lightning_resistance_percent, 75) + elementalCap, 0, 100);
  return 0;
}

function convertIncomingPlayerDamageComponents(components: Record<string, number>, stats: AppState["player_stats"] | undefined) {
  const result: Record<string, number> = {};
  for (const [damageType, amount] of Object.entries(components)) {
    if (amount > 0) result[damageType] = (result[damageType] ?? 0) + amount;
  }
  for (const [source, target] of [
    ["physical", "fire"],
    ["physical", "cold"],
    ["physical", "lightning"],
    ["physical", "chaos"],
    ["chaos", "fire"],
    ["chaos", "cold"],
    ["chaos", "lightning"],
  ] as const) {
    const sourceAmount = result[source] ?? 0;
    if (sourceAmount <= 0) continue;
    const percent = Math.max(0, statNumber(stats?.[`incoming_conversion_${source}_to_${target}_percent`], 0));
    if (percent <= 0) continue;
    const converted = sourceAmount * Math.min(1, percent / 100);
    result[source] = Math.max(0, sourceAmount - converted);
    result[target] = (result[target] ?? 0) + converted;
  }
  return result;
}

function mitigateIncomingPlayerDamageComponent(amount: number, damageType: string, stats: AppState["player_stats"] | undefined, penetrationPercent: number) {
  let incoming = Math.max(0, amount);
  const armorEffectiveness = damageType === "physical" ? 100 : ["fire", "cold", "lightning", "chaos"].includes(damageType) ? statNumber(stats?.non_physical_armor_effectiveness_percent, 60) : 0;
  if (armorEffectiveness > 0) {
    const armor = statNumber(stats?.armor, 0);
    const armorAddPercent = statNumber(stats?.armor_add_percent, 0);
    const effectiveArmor = Math.max(0, armor * (1 + armorAddPercent / 100)) * armorEffectiveness / 100;
    const armorReduction = incoming > 0 ? effectiveArmor / (effectiveArmor + 10 * incoming) : 0;
    incoming *= 1 - Math.min(0.9, armorReduction);
  }
  if (damageType === "physical") {
    incoming *= 1 - Math.min(0.9, Math.max(0, statNumber(stats?.physical_damage_reduction_percent, 0)) / 100);
  }
  const resistancePercent = playerResistancePercent(stats, damageType, penetrationPercent);
  incoming *= 1 - Math.min(0.9, Math.max(0, resistancePercent) / 100);
  incoming *= 1 - Math.min(0.9, Math.max(0, statNumber(stats?.damage_mitigation_final_percent, 0)) / 100);
  return Math.max(0, incoming);
}

function canEnemyStartRuntimeAttack(
  enemy: Enemy,
  player: { x: number; y: number },
  nowMs: number,
  map?: BakedBattleMapData | null
) {
  const attackActive = enemy.attackUntilMs !== undefined && nowMs < enemy.attackUntilMs;
  if (attackActive || nowMs < (enemy.nextAttackReadyAtMs ?? 0)) return false;
  if (enemy.authored && !enemy.aggroLocked) return false;
  return canEnemyReachPlayerForMelee(enemy, player, map);
}

function canEnemyReachPlayerForMelee(
  enemy: Enemy,
  player: { x: number; y: number },
  map?: BakedBattleMapData | null
) {
  if (distance(enemy, player) > monsterMeleeReachRange(enemy)) return false;
  if (!map) return true;
  const enemyCell = enemyWorldToGrid(map, enemy);
  const playerCell = enemyWorldToGrid(map, player);
  if (enemyCell.gridX === playerCell.gridX && enemyCell.gridY === playerCell.gridY) return true;
  if (enemyCanStepGrid(map, enemyCell.gridX, enemyCell.gridY, playerCell.gridX, playerCell.gridY)) return true;
  return enemyHasWalkableLine(map, enemy, player);
}

function freezeAttackingEnemy(enemy: Enemy, runtimeTier: EnemyRuntimeTier): Enemy {
  return {
    ...enemy,
    runtimeTier,
    velocityX: 0,
    velocityY: 0
  };
}

function moveEnemyTowardPlayer(
  enemy: Enemy,
  player: { x: number; y: number },
  map: BakedBattleMapData | null,
  dt: number,
  runtimeTier: EnemyRuntimeTier,
  spatialIndex?: EnemySpatialIndex,
  navigation?: EnemyNavigationContext | null
): Enemy {
  const approachTarget = enemyNavigationMoveTarget(enemy, player, map, navigation);
  const dx = approachTarget.x - enemy.x;
  const dy = approachTarget.y - enemy.y;
  const length = Math.hypot(dx, dy);
  const speed = (enemy.boss ? 44 : 70) * MONSTER_CHASE_SPEED_MULTIPLIER;
  const playerDistance = distance(enemy, player);
  const attackRange = monsterAttackRange(enemy);
  if (playerDistance <= attackRange) {
    return {
      ...enemy,
      velocityX: 0,
      velocityY: 0,
      runtimeTier
    };
  }
  const directCharge = enemy.aggroLocked === true;
  const chaseWeight = directCharge
    ? 1
    : ENEMY_SWARM_MIN_CHASE_WEIGHT * clamp(
      (playerDistance - ENEMY_PLAYER_CONTACT_HOLD_RADIUS) / Math.max(1, ENEMY_PLAYER_CONTACT_SLOW_RADIUS - ENEMY_PLAYER_CONTACT_HOLD_RADIUS),
      0,
      1
    );
  const fallbackAngle = ((enemy.id * 137) % 360) * Math.PI / 180;
  const desired = length > 1
    ? { x: dx / length, y: dy / length }
    : { x: Math.cos(fallbackAngle), y: Math.sin(fallbackAngle) };
  const steering = directCharge
    ? { x: 0, y: 0, speedScale: 1, active: false }
    : steerEnemySwarm(enemy, desired, spatialIndex);
  const playerRepelPressure = !directCharge && playerDistance < ENEMY_PLAYER_BODY_SOFT_RADIUS
    ? (ENEMY_PLAYER_BODY_SOFT_RADIUS - playerDistance) / ENEMY_PLAYER_BODY_SOFT_RADIUS
    : 0;
  const fromPlayer = playerDistance > 0.001
    ? { x: (enemy.x - player.x) / playerDistance, y: (enemy.y - player.y) / playerDistance }
    : { x: -desired.x, y: -desired.y };
  const targetDirection = normalizeMoveVector({
    x: desired.x * chaseWeight + steering.x + fromPlayer.x * playerRepelPressure * ENEMY_PLAYER_BODY_REPEL_FORCE,
    y: desired.y * chaseWeight + steering.y + fromPlayer.y * playerRepelPressure * ENEMY_PLAYER_BODY_REPEL_FORCE
  });
  const previousVelocity = { x: enemy.velocityX ?? 0, y: enemy.velocityY ?? 0 };
  const targetVelocity = {
    x: targetDirection.x * speed * steering.speedScale,
    y: targetDirection.y * speed * steering.speedScale
  };
  const nextVelocity = directCharge
    ? targetVelocity
    : {
      x: previousVelocity.x + (targetVelocity.x - previousVelocity.x) * ENEMY_SWARM_VELOCITY_LERP,
      y: previousVelocity.y + (targetVelocity.y - previousVelocity.y) * ENEMY_SWARM_VELOCITY_LERP
    };
  const velocityLength = Math.hypot(nextVelocity.x, nextVelocity.y);
  const clampedVelocity = velocityLength > speed
    ? { x: nextVelocity.x / velocityLength * speed, y: nextVelocity.y / velocityLength * speed }
    : nextVelocity;
  const approachTargetIsPlayer = distance(approachTarget, player) <= 0.001;
  const remainingApproachDistance = approachTargetIsPlayer
    ? playerDistance - attackRange
    : distance(enemy, approachTarget);
  const stepDistance = Math.min(Math.hypot(clampedVelocity.x, clampedVelocity.y) * dt, Math.max(0, remainingApproachDistance));
  const direction = normalizeMoveVector(clampedVelocity);
  const retreatingFromPlayer = !directCharge && playerRepelPressure > 0.02
    && direction.x * fromPlayer.x + direction.y * fromPlayer.y > 0.25;
  const movementTarget = retreatingFromPlayer
    ? {
      x: enemy.x + fromPlayer.x * ENEMY_PLAYER_BODY_SOFT_RADIUS,
      y: enemy.y + fromPlayer.y * ENEMY_PLAYER_BODY_SOFT_RADIUS
    }
    : approachTarget;
  const nextPosition = directCharge
    ? resolveEnemyDirectChargeMove(map, enemy, movementTarget, direction, stepDistance, spatialIndex)
    : resolveEnemySteeredMove(map, enemy, movementTarget, direction, stepDistance, steering.active, spatialIndex);
  return {
    ...enemy,
    x: nextPosition.x,
    y: nextPosition.y,
    velocityX: clampedVelocity.x,
    velocityY: clampedVelocity.y,
    runtimeTier,
    navTargetGridX: "gridX" in approachTarget ? approachTarget.gridX : undefined,
    navTargetGridY: "gridY" in approachTarget ? approachTarget.gridY : undefined
  };
}

function resolveEnemyDirectChargeMove(
  map: BakedBattleMapData | null,
  enemy: Enemy,
  target: { x: number; y: number },
  direction: { x: number; y: number },
  stepDistance: number,
  spatialIndex?: EnemySpatialIndex
) {
  if (stepDistance <= 0.001) return enemy;
  const directNext = {
    x: enemy.x + direction.x * stepDistance,
    y: enemy.y + direction.y * stepDistance
  };
  if (!map) return directNext;
  const directResolved = resolveWalkableMove(map, enemy, directNext);
  const directMovedDistance = distance(enemy, directResolved);
  const directCrowdPenalty = enemyCrowdMovePenalty(enemy, directResolved, spatialIndex);
  const currentDistance = distance(enemy, target);
  const directProgress = currentDistance - distance(directResolved, target);
  if (directProgress > 0.001 && isMapPointWalkable(map, directNext.x, directNext.y)) {
    return directResolved;
  }
  if (directMovedDistance > stepDistance * 0.75 && directCrowdPenalty <= 0.001 && isMapPointWalkable(map, directNext.x, directNext.y)) {
    return directResolved;
  }

  const baseAngle = Math.atan2(direction.y, direction.x);
  const laneSign = enemyLaneSign(enemy);
  let bestPosition = directResolved;
  let bestScore = directMovedDistance - directCrowdPenalty;

  for (const offset of ENEMY_STEERING_ANGLE_OFFSETS) {
    const angle = baseAngle + offset * laneSign;
    const candidateDirection = { x: Math.cos(angle), y: Math.sin(angle) };
    const rawNext = {
      x: enemy.x + candidateDirection.x * stepDistance,
      y: enemy.y + candidateDirection.y * stepDistance
    };
    const resolved = resolveWalkableMove(map, enemy, rawNext);
    const movedDistance = distance(enemy, resolved);
    if (movedDistance <= 0.001) continue;
    const progress = currentDistance - distance(resolved, target);
    const crowdPenalty = enemyCrowdMovePenalty(enemy, resolved, spatialIndex);
    const wallScore = enemyWallMoveScore(map, rawNext, resolved, stepDistance);
    const turnPenalty = Math.abs(offset) * stepDistance * 0.12;
    const score = progress * 3.2 + movedDistance * 0.5 + wallScore - turnPenalty - crowdPenalty;
    if (score > bestScore) {
      bestScore = score;
      bestPosition = resolved;
    }
  }

  return bestPosition;
}

function enemyNavigationMoveTarget(
  enemy: Enemy,
  player: { x: number; y: number },
  map: BakedBattleMapData | null,
  navigation?: EnemyNavigationContext | null
) {
  const approachTarget = enemyApproachTarget(enemy, player, map);
  if (!map || !navigation) return approachTarget;
  const playerDistance = distance(enemy, player);
  const directAttackDistance = monsterAttackRange(enemy) + map.meta.grid_size * 0.35;
  if (!enemy.aggroLocked && playerDistance <= ENEMY_APPROACH_RING_RADIUS * 1.8) {
    return approachTarget;
  }
  if (enemy.aggroLocked && playerDistance <= directAttackDistance * 1.35) {
    const occupancyTarget = enemyReachableMeleeOccupancyTarget(map, enemy, player);
    if (occupancyTarget) return occupancyTarget;
    if (enemyHasWalkableLine(map, enemy, approachTarget)) return approachTarget;
    const contactTarget = enemyLineReachablePlayerContactTarget(map, enemy, player);
    if (contactTarget) return contactTarget;
  }

  const cell = enemyWorldToGrid(map, enemy);
  const currentIndex = enemyGridIndex(navigation, cell.gridX, cell.gridY);
  if (navigation.field[currentIndex] >= ENEMY_NAVIGATION_INF) {
    return enemyUnreachableApproachTarget(map, enemy, cell, approachTarget);
  }

  let best = { gridX: cell.gridX, gridY: cell.gridY, score: navigation.field[currentIndex] };
  const laneSign = enemyLaneSign(enemy);
  const currentTargetValid = enemy.navTargetGridX !== undefined
    && enemy.navTargetGridY !== undefined
    && Math.abs(enemy.navTargetGridX - cell.gridX) <= 1
    && Math.abs(enemy.navTargetGridY - cell.gridY) <= 1
    && enemyCanStepGrid(map, cell.gridX, cell.gridY, enemy.navTargetGridX, enemy.navTargetGridY);
  let held = currentTargetValid ? enemyNavigationCandidateScore(navigation, enemy.navTargetGridX!, enemy.navTargetGridY!, laneSign, enemy.navTargetGridX! - cell.gridX, enemy.navTargetGridY! - cell.gridY) : null;

  for (const direction of ENEMY_NAVIGATION_DIRECTIONS) {
    const gridX = cell.gridX + direction.x;
    const gridY = cell.gridY + direction.y;
    if (!enemyCanStepGrid(map, cell.gridX, cell.gridY, gridX, gridY)) continue;
    const candidate = enemyNavigationCandidateScore(navigation, gridX, gridY, laneSign, direction.x, direction.y);
    if (candidate.score >= ENEMY_NAVIGATION_INF) continue;
    if (held !== null && candidate.score + ENEMY_NAVIGATION_SWITCH_MARGIN >= held.score) continue;
    held = null;
    if (candidate.score < best.score) best = candidate;
  }

  if (held !== null) best = held;
  if (best.gridX === cell.gridX && best.gridY === cell.gridY) return approachTarget;
  const center = enemyGridCenter(map, best.gridX, best.gridY);
  const fromPlayer = guideDirection(player, center);
  const perpendicular = { x: -fromPlayer.y, y: fromPlayer.x };
  const sideOffset = enemy.aggroLocked ? 0 : enemyLaneSign(enemy) * Math.min(map.meta.grid_size * 0.28, 10);
  return {
    x: center.x + perpendicular.x * sideOffset,
    y: center.y + perpendicular.y * sideOffset,
    gridX: best.gridX,
    gridY: best.gridY
  };
}

function enemyUnreachableApproachTarget(
  map: BakedBattleMapData,
  enemy: Enemy,
  cell: { gridX: number; gridY: number },
  approachTarget: { x: number; y: number }
) {
  let best: { gridX: number; gridY: number; score: number } | null = null;
  for (const direction of ENEMY_NAVIGATION_DIRECTIONS) {
    const gridX = cell.gridX + direction.x;
    const gridY = cell.gridY + direction.y;
    if (!enemyCanStepGrid(map, cell.gridX, cell.gridY, gridX, gridY)) continue;
    const center = enemyGridCenter(map, gridX, gridY);
    const score = distance(center, approachTarget) + enemyGridWallCost(map, gridX, gridY) * map.meta.grid_size;
    if (!best || score < best.score) best = { gridX, gridY, score };
  }
  if (!best) return approachTarget;
  const currentScore = distance(enemyGridCenter(map, cell.gridX, cell.gridY), approachTarget);
  if (best.score >= currentScore) return approachTarget;
  return {
    ...enemyGridCenter(map, best.gridX, best.gridY),
    gridX: best.gridX,
    gridY: best.gridY
  };
}

function enemyHasWalkableLine(map: BakedBattleMapData, from: { x: number; y: number }, to: { x: number; y: number }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length <= 0.001) return isMapPointWalkable(map, from.x, from.y);
  const step = Math.max(4, map.meta.grid_size * 0.35);
  const samples = Math.max(1, Math.ceil(length / step));
  for (let index = 1; index <= samples; index += 1) {
    const ratio = index / samples;
    if (!isMapPointWalkable(map, from.x + dx * ratio, from.y + dy * ratio)) return false;
  }
  return true;
}

function damageEventAmountAgainstEnemy(event: SkillEvent, enemy: Enemy) {
  const components = event.payload?.damage_components;
  const multiplier = damageOverTimeAggravationMultiplier(event, enemy);
  const doubleDamageMultiplier = doubleDamageEventMultiplier(event);
  const resistancePenetrationPercent = Number(event.payload?.resistance_penetration_percent ?? 0);
  const armorReductionPenetrationPercent = Number(event.payload?.armor_reduction_penetration_percent ?? 0);
  if (components && typeof components === "object" && !Array.isArray(components)) {
    return Object.entries(components as Record<string, unknown>).reduce((total, [damageType, value]) => {
      return total + scaledDamageAgainstEnemy(damageType, Number(value ?? 0), enemy, resistancePenetrationPercent, armorReductionPenetrationPercent);
    }, 0) * multiplier * doubleDamageMultiplier;
  }
  return scaledDamageAgainstEnemy(event.damage_type, Number(event.amount ?? 0), enemy, resistancePenetrationPercent, armorReductionPenetrationPercent) * multiplier * doubleDamageMultiplier;
}

function doubleDamageEventMultiplier(event: SkillEvent) {
  const chance = clamp(Number(event.payload?.double_damage_chance_percent ?? 0), 0, 100);
  if (chance <= 0) return 1;
  return stablePercent(`${event.event_id}:double_damage`) < chance ? 2 : 1;
}

function damageOverTimeAggravationMultiplier(event: SkillEvent, enemy: Enemy) {
  const bonusPer10 = Math.max(0, Number(event.payload?.dot_damage_bonus_per_10_aggravation_percent ?? 0));
  if (bonusPer10 <= 0) return 1;
  const bonusPercent = (enemy.activeBuffs ?? [])
    .filter((buff) => buff.statusType === "aggravation" && buff.remaining > 0)
    .reduce((total, buff) => total + ((buff.baseValue ?? 0) / 10) * buff.valuePercent, 0);
  return 1 + bonusPercent / 100;
}

function scaledDamageAgainstEnemy(damageType: string, amount: number, enemy: Enemy, resistancePenetrationPercent = 0, armorReductionPenetrationPercent = 0) {
  if (amount <= 0) return Math.max(0, amount);
  let scaledAmount = Math.max(0, amount);
  if (damageType === "physical") {
    const armor = enemyNumericStat(enemy, "armor");
    if (armor > 0) {
      const armorReduction = armor / (armor + 10 * scaledAmount);
      scaledAmount *= 1 - Math.min(0.9, Math.max(0, armorReduction - armorReductionPenetrationPercent / 100));
    }
  }
  const resistancePercent = enemyResistancePercent(enemy, damageType) - resistancePenetrationPercent;
  if (resistancePercent > 0) {
    scaledAmount *= 1 - Math.min(0.9, resistancePercent / 100);
  }
  const takenIncrease = (enemy.activeBuffs ?? [])
    .filter((buff) => (
      buff.polarity === "negative"
      && buff.remaining > 0
      && statusIncreasesDamageTakenFrom(buff.statusType, damageType)
    ))
    .reduce((total, buff) => total + buff.valuePercent, 0);
  return scaledAmount * (1 + takenIncrease / 100);
}

function enemyResistancePercent(enemy: Enemy, damageType: string) {
  if (damageType === "fire") return enemyNumericStat(enemy, "fire_resistance_percent") + enemyNumericStat(enemy, "elemental_resistance_percent");
  if (damageType === "cold") return enemyNumericStat(enemy, "cold_resistance_percent") + enemyNumericStat(enemy, "elemental_resistance_percent");
  if (damageType === "lightning") return enemyNumericStat(enemy, "lightning_resistance_percent") + enemyNumericStat(enemy, "elemental_resistance_percent");
  if (damageType === "chaos") return enemyNumericStat(enemy, "chaos_resistance_percent");
  return 0;
}

function enemyNumericStat(enemy: Enemy, stat: string) {
  const value = (enemy as Enemy & Record<string, unknown>)[stat];
  return typeof value === "number" ? value : 0;
}

function statusIncreasesDamageTakenFrom(statusType: string, damageType: string) {
  if (statusType === "frostbite") return damageType === "cold";
  if (statusType === "numbed") return damageType === "lightning";
  if (statusType === "damage_taken_increase") return true;
  return false;
}

function enemyLineReachablePlayerContactTarget(
  map: BakedBattleMapData,
  enemy: Enemy,
  player: { x: number; y: number }
) {
  const center = enemyWorldToGrid(map, player);
  let best: ({ x: number; y: number; gridX: number; gridY: number; score: number } | null) = null;
  const maxCells = Math.max(2, ENEMY_NAVIGATION_TARGET_RADIUS_CELLS);
  for (let y = -maxCells; y <= maxCells; y += 1) {
    for (let x = -maxCells; x <= maxCells; x += 1) {
      const cellDistance = Math.hypot(x, y);
      if (cellDistance < 1 || cellDistance > maxCells) continue;
      const gridX = center.gridX + x;
      const gridY = center.gridY + y;
      if (!enemyGridWalkable(map, gridX, gridY)) continue;
      const target = { ...enemyGridCenter(map, gridX, gridY), gridX, gridY };
      if (!enemyHasWalkableLine(map, enemy, target)) continue;
      const playerDistance = distance(target, player);
      const enemyDistance = distance(enemy, target);
      const score = playerDistance * 1.6 + enemyDistance + enemyGridWallCost(map, gridX, gridY) * map.meta.grid_size * 0.35;
      if (!best || score < best.score) best = { ...target, score };
    }
  }
  return best ? { x: best.x, y: best.y, gridX: best.gridX, gridY: best.gridY } : null;
}

function enemyNavigationCandidateScore(navigation: EnemyNavigationContext, gridX: number, gridY: number, laneSign: number, directionX: number, directionY: number) {
  if (!enemyGridInBounds(navigation, gridX, gridY)) return { gridX, gridY, score: ENEMY_NAVIGATION_INF };
  const index = enemyGridIndex(navigation, gridX, gridY);
  const fieldCost = navigation.field[index];
  if (fieldCost >= ENEMY_NAVIGATION_INF) return { gridX, gridY, score: ENEMY_NAVIGATION_INF };
  const laneBias = (directionX * laneSign + directionY * laneSign * 0.35) * -0.025;
  const score = fieldCost
    + navigation.occupancy[index] * ENEMY_NAVIGATION_LOCAL_OCCUPANCY_SCORE
    + navigation.wallCost[index] * ENEMY_NAVIGATION_LOCAL_WALL_SCORE
    + laneBias;
  return { gridX, gridY, score };
}

function enemyApproachTarget(enemy: Enemy, player: { x: number; y: number }, map: BakedBattleMapData | null) {
  if (enemy.aggroLocked) return player;
  if (!map || isMapPointWalkable(map, player.x, player.y)) return player;
  const fromEnemy = guideDirection(enemy, player);
  return nearestWalkableApproachTarget(map, player, fromEnemy, 0, map.meta.grid_size) ?? player;
}

function nearestWalkableApproachTarget(
  map: BakedBattleMapData,
  player: { x: number; y: number },
  away: { x: number; y: number },
  sideOffset: number,
  ringRadius: number
) {
  const baseAngle = Math.atan2(away.y, away.x);
  const sideSign = sideOffset >= 0 ? 1 : -1;
  let best: { x: number; y: number } | null = null;
  let bestScore = Infinity;
  for (const angleOffset of ENEMY_STEERING_ANGLE_OFFSETS) {
    const angle = baseAngle + angleOffset * sideSign;
    const direction = { x: Math.cos(angle), y: Math.sin(angle) };
    const perpendicular = { x: -direction.y, y: direction.x };
    const candidate = {
      x: player.x + direction.x * ringRadius + perpendicular.x * sideOffset,
      y: player.y + direction.y * ringRadius + perpendicular.y * sideOffset
    };
    if (!isMapPointWalkable(map, candidate.x, candidate.y)) continue;
    const score = Math.abs(angleOffset) * 100 + distance(candidate, player);
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
}

function steerEnemySwarm(enemy: Enemy, desired: { x: number; y: number }, spatialIndex?: EnemySpatialIndex) {
  if (!spatialIndex) return { x: 0, y: 0, speedScale: 1, active: false };
  const neighbors = queryEnemySpatialIndex(spatialIndex, enemy, ENEMY_STEERING_NEIGHBOR_RADIUS);
  const perpendicular = { x: -desired.y, y: desired.x };
  const laneSign = enemyLaneSign(enemy);
  let repelX = 0;
  let repelY = 0;
  let tangentPressure = 0;
  let densityPressure = 0;

  for (const neighbor of neighbors) {
    if (neighbor.id === enemy.id || neighbor.hp <= 0 || neighbor.runtimeTier === "dead") continue;
    const fromNeighborX = enemy.x - neighbor.x;
    const fromNeighborY = enemy.y - neighbor.y;
    const gap = Math.hypot(fromNeighborX, fromNeighborY) || 1;
    const combinedRadius = enemyCollisionRadius(enemy) + enemyCollisionRadius(neighbor);
    const comfortDistance = combinedRadius * ENEMY_SWARM_SEPARATION_RATIO + ENEMY_STEERING_COMFORT_GAP;
    if (gap < comfortDistance) {
      const pressure = (comfortDistance - gap) / comfortDistance;
      repelX += (fromNeighborX / gap) * pressure;
      repelY += (fromNeighborY / gap) * pressure;
      densityPressure += pressure;
    }

    const toNeighborX = neighbor.x - enemy.x;
    const toNeighborY = neighbor.y - enemy.y;
    const forward = toNeighborX * desired.x + toNeighborY * desired.y;
    if (forward <= 0 || forward > ENEMY_STEERING_LOOKAHEAD) continue;
    const lateral = toNeighborX * perpendicular.x + toNeighborY * perpendicular.y;
    const laneWidth = combinedRadius * ENEMY_SWARM_SEPARATION_RATIO + ENEMY_STEERING_COMFORT_GAP;
    if (Math.abs(lateral) > laneWidth) continue;
    const forwardPressure = (ENEMY_STEERING_LOOKAHEAD - forward) / ENEMY_STEERING_LOOKAHEAD;
    const lateralPressure = (laneWidth - Math.abs(lateral)) / laneWidth;
    const escapeSign = Math.abs(lateral) < 0.001 ? laneSign : -Math.sign(lateral);
    tangentPressure += escapeSign * forwardPressure * lateralPressure;
    densityPressure += forwardPressure * lateralPressure * 0.42;
  }

  const repel = normalizeMoveVector({ x: repelX, y: repelY });
  const forwardRepel = repel.x * desired.x + repel.y * desired.y;
  const chaseSafeRepel = forwardRepel < -0.001
    ? normalizeMoveVector({
      x: repel.x - desired.x * forwardRepel,
      y: repel.y - desired.y * forwardRepel
    })
    : repel;
  const active = Math.abs(repelX) > 0.001 || Math.abs(repelY) > 0.001 || Math.abs(tangentPressure) > 0.001;
  const speedScale = clamp(1 - densityPressure * ENEMY_SWARM_DENSE_SLOWDOWN, ENEMY_STEERING_MIN_SPEED_SCALE, 1);
  return {
    x: clamp(chaseSafeRepel.x * ENEMY_SWARM_SEPARATION_FORCE, -ENEMY_SWARM_MAX_REPEL, ENEMY_SWARM_MAX_REPEL)
      + perpendicular.x * clamp(tangentPressure, -1, 1) * ENEMY_SWARM_TANGENT_FORCE,
    y: clamp(chaseSafeRepel.y * ENEMY_SWARM_SEPARATION_FORCE, -ENEMY_SWARM_MAX_REPEL, ENEMY_SWARM_MAX_REPEL)
      + perpendicular.y * clamp(tangentPressure, -1, 1) * ENEMY_SWARM_TANGENT_FORCE,
    speedScale,
    active
  };
}

function steerEnemyDirectChargeCrowd(enemy: Enemy, desired: { x: number; y: number }, spatialIndex?: EnemySpatialIndex) {
  if (!spatialIndex) return { x: 0, y: 0, speedScale: 1, active: false };
  const neighbors = queryEnemySpatialIndex(spatialIndex, enemy, ENEMY_STEERING_NEIGHBOR_RADIUS);
  const perpendicular = { x: -desired.y, y: desired.x };
  const laneSign = enemyLaneSign(enemy);
  let tangentPressure = 0;
  let densityPressure = 0;

  for (const neighbor of neighbors) {
    if (neighbor.id === enemy.id || neighbor.hp <= 0 || neighbor.runtimeTier === "dead") continue;
    const toNeighborX = neighbor.x - enemy.x;
    const toNeighborY = neighbor.y - enemy.y;
    const forward = toNeighborX * desired.x + toNeighborY * desired.y;
    if (forward <= 0 || forward > ENEMY_STEERING_LOOKAHEAD) continue;
    const combinedRadius = enemyCollisionRadius(enemy) + enemyCollisionRadius(neighbor);
    const lateral = toNeighborX * perpendicular.x + toNeighborY * perpendicular.y;
    const laneWidth = combinedRadius * ENEMY_SWARM_SEPARATION_RATIO + ENEMY_STEERING_COMFORT_GAP;
    if (Math.abs(lateral) > laneWidth) continue;
    const forwardPressure = (ENEMY_STEERING_LOOKAHEAD - forward) / ENEMY_STEERING_LOOKAHEAD;
    const lateralPressure = (laneWidth - Math.abs(lateral)) / laneWidth;
    const escapeSign = Math.abs(lateral) < 0.001 ? laneSign : -Math.sign(lateral);
    tangentPressure += escapeSign * forwardPressure * lateralPressure;
    densityPressure += forwardPressure * lateralPressure * 0.32;
  }

  const active = Math.abs(tangentPressure) > 0.001;
  const speedScale = clamp(1 - densityPressure * ENEMY_SWARM_DENSE_SLOWDOWN, ENEMY_STEERING_MIN_SPEED_SCALE, 1);
  return {
    x: perpendicular.x * clamp(tangentPressure, -1, 1) * ENEMY_DIRECT_CHARGE_TANGENT_FORCE,
    y: perpendicular.y * clamp(tangentPressure, -1, 1) * ENEMY_DIRECT_CHARGE_TANGENT_FORCE,
    speedScale,
    active
  };
}

function resolveEnemySteeredMove(
  map: BakedBattleMapData | null,
  enemy: Enemy,
  target: { x: number; y: number },
  direction: { x: number; y: number },
  stepDistance: number,
  forceSteering: boolean,
  spatialIndex?: EnemySpatialIndex
) {
  if (stepDistance <= 0.001) return enemy;
  if (!map) return { x: enemy.x + direction.x * stepDistance, y: enemy.y + direction.y * stepDistance };

  const directNext = {
    x: enemy.x + direction.x * stepDistance,
    y: enemy.y + direction.y * stepDistance
  };
  const directCrowdPenalty = enemyCrowdMovePenalty(enemy, directNext, spatialIndex);
  if (!forceSteering && directCrowdPenalty <= 0.001 && isMapPointWalkable(map, directNext.x, directNext.y)) {
    return resolveWalkableMove(map, enemy, directNext);
  }

  const currentDistance = distance(enemy, target);
  const baseAngle = Math.atan2(direction.y, direction.x);
  const laneSign = enemyLaneSign(enemy);
  let bestPosition: { x: number; y: number } = enemy;
  let bestScore = -Infinity;

  for (const offset of ENEMY_STEERING_ANGLE_OFFSETS) {
    const angle = baseAngle + offset * laneSign;
    const candidateDirection = { x: Math.cos(angle), y: Math.sin(angle) };
    const rawNext = {
      x: enemy.x + candidateDirection.x * stepDistance,
      y: enemy.y + candidateDirection.y * stepDistance
    };
    const resolved = resolveWalkableMove(map, enemy, rawNext);
    const movedDistance = distance(enemy, resolved);
    if (movedDistance <= 0.001) continue;

    const progress = currentDistance - distance(resolved, target);
    const crowdPenalty = enemyCrowdMovePenalty(enemy, resolved, spatialIndex);
    const wallScore = enemyWallMoveScore(map, rawNext, resolved, stepDistance);
    const turnPenalty = Math.abs(offset) * stepDistance * 0.2;
    const score = progress * 2.4 + movedDistance * 0.65 + wallScore - turnPenalty - crowdPenalty;
    if (score > bestScore) {
      bestScore = score;
      bestPosition = resolved;
    }
  }

  if (bestScore > -Infinity) return bestPosition;
  return resolveWalkableMove(map, enemy, {
    x: enemy.x + direction.x * stepDistance,
    y: enemy.y + direction.y * stepDistance
  });
}

function createMapEditorZone(zoneType: ProceduralZoneType, rects: MapEditorZoneRect[]): MapEditorZone {
  const normalizedRects = rects.map((rect) => ({
    start: clampMapEditorPoint(rect.start),
    end: clampMapEditorPoint(rect.end)
  }));
  const normalized = normalizeMapEditorZone({
    id: safeMapEditorId(null, "zone"),
    zoneType,
    shape: "rectangle",
    rects: normalizedRects
  });
  return normalized ?? {
    id: safeMapEditorId(null, "zone"),
    zoneType,
    shape: "rectangle",
    points: normalizedRects.flatMap((rect) => [rect.start, rect.end]),
    rects: normalizedRects
  };
}

function mapEditorZoneTypeLabel(zoneType: ProceduralZoneType) {
  return MAP_EDITOR_ZONE_TYPES.find((option) => option.id === zoneType)?.label ?? zoneType;
}

function mapEditorZoneCenter(zone: MapEditorZone): MapEditorCellPoint {
  const rects = mapEditorZoneRects(zone);
  const totals = rects.reduce((sum, rect) => ({
    x: sum.x + (rect.start.x + rect.end.x) / 2,
    y: sum.y + (rect.start.y + rect.end.y) / 2
  }), { x: 0, y: 0 });
  return clampMapEditorPoint({
    x: Math.round(totals.x / rects.length),
    y: Math.round(totals.y / rects.length)
  });
}

function mapEditorZoneRects(zone: MapEditorZone): MapEditorZoneRect[] {
  if (Array.isArray(zone.rects) && zone.rects.length > 0) return zone.rects;
  const rects: MapEditorZoneRect[] = [];
  for (let index = 0; index + 1 < zone.points.length; index += 2) {
    rects.push({ start: zone.points[index], end: zone.points[index + 1] });
  }
  return rects.length > 0 ? rects : [{ start: MAP_EDITOR_DEFAULT_SPAWN, end: MAP_EDITOR_DEFAULT_SPAWN }];
}

function shiftMapEditorZones(zones: MapEditorZone[], dx: number, dy: number): MapEditorZone[] {
  return zones.map((zone) => ({
    ...zone,
    points: zone.points.map((point) => shiftMapEditorPoint(point, dx, dy)),
    rects: mapEditorZoneRects(zone).map((rect) => ({
      start: shiftMapEditorPoint(rect.start, dx, dy),
      end: shiftMapEditorPoint(rect.end, dx, dy)
    }))
  }));
}

function enemyCrowdMovePenalty(enemy: Enemy, candidate: { x: number; y: number }, spatialIndex?: EnemySpatialIndex) {
  if (!spatialIndex) return 0;
  const radius = enemyCollisionRadius(enemy);
  let penalty = 0;
  for (const neighbor of queryEnemySpatialIndex(spatialIndex, candidate, ENEMY_CROWD_SCORE_RADIUS)) {
    if (neighbor.id === enemy.id || neighbor.hp <= 0 || neighbor.runtimeTier === "dead") continue;
    const gap = distance(candidate, neighbor);
    const comfortDistance = radius + enemyCollisionRadius(neighbor) + ENEMY_STEERING_COMFORT_GAP;
    if (gap >= comfortDistance) continue;
    const pressure = (comfortDistance - gap) / comfortDistance;
    penalty += pressure * pressure * ENEMY_CROWD_SLOT_PENALTY;
  }
  return penalty;
}

function enemyWallMoveScore(map: BakedBattleMapData, rawNext: { x: number; y: number }, resolved: { x: number; y: number }, stepDistance: number) {
  const rawWalkable = isMapPointWalkable(map, rawNext.x, rawNext.y);
  const clippedDistance = distance(rawNext, resolved);
  const clipRatio = clamp(clippedDistance / Math.max(1, stepDistance), 0, 2);
  const collisionPenalty = clipRatio * ENEMY_WALL_COLLISION_PENALTY * stepDistance;
  const walkableBonus = rawWalkable ? stepDistance * 0.55 : -stepDistance * 0.95;
  return walkableBonus - collisionPenalty + enemyWallClearanceScore(map, resolved) * ENEMY_WALL_CLEARANCE_BONUS;
}

function enemyWallClearanceScore(map: BakedBattleMapData, point: { x: number; y: number }) {
  let nearestBlockedDistance = ENEMY_WALL_CLEARANCE_RADIUS;
  for (let y = -ENEMY_WALL_CLEARANCE_RADIUS; y <= ENEMY_WALL_CLEARANCE_RADIUS; y += ENEMY_WALL_CLEARANCE_STEP) {
    for (let x = -ENEMY_WALL_CLEARANCE_RADIUS; x <= ENEMY_WALL_CLEARANCE_RADIUS; x += ENEMY_WALL_CLEARANCE_STEP) {
      if (x === 0 && y === 0) continue;
      const sampleDistance = Math.hypot(x, y);
      if (sampleDistance > ENEMY_WALL_CLEARANCE_RADIUS || sampleDistance >= nearestBlockedDistance) continue;
      const sample = { x: point.x + x, y: point.y + y };
      if (!isMapPointWalkable(map, sample.x, sample.y)) nearestBlockedDistance = sampleDistance;
    }
  }
  return nearestBlockedDistance / ENEMY_WALL_CLEARANCE_RADIUS;
}

function normalizeMoveVector(vector: { x: number; y: number }) {
  const length = Math.hypot(vector.x, vector.y);
  if (length <= 0.001) return { x: 0, y: 0 };
  return { x: vector.x / length, y: vector.y / length };
}

function enemyLaneSign(enemy: Enemy) {
  return enemy.id % 2 === 0 ? 1 : -1;
}

function separateOverlappingEnemies(
  enemies: Enemy[],
  map: BakedBattleMapData | null,
  lockedEnemyIds: Set<number> = new Set(),
  chaseTarget?: { x: number; y: number }
): Enemy[] {
  if (enemies.length <= 1) return enemies;
  const spatialIndex = createEnemySpatialIndex(enemies, ENEMY_SPATIAL_CHUNK_SIZE);
  return enemies.map((enemy) => {
    if (enemy.hp <= 0 || enemy.runtimeTier === "dead") return enemy;
    const attackLocked = lockedEnemyIds.has(enemy.id);
    if (attackLocked && !chaseTarget) return enemy;
    const radius = enemyCollisionRadius(enemy);
    const neighbors = queryEnemySpatialIndex(spatialIndex, enemy, radius + ENEMY_BOSS_COLLISION_RADIUS);
    let pushX = 0;
    let pushY = 0;
    for (const neighbor of neighbors) {
      if (neighbor.id === enemy.id || neighbor.hp <= 0 || neighbor.runtimeTier === "dead") continue;
      const combinedRadius = radius + enemyCollisionRadius(neighbor);
      const dx = enemy.x - neighbor.x;
      const dy = enemy.y - neighbor.y;
      const gap = Math.hypot(dx, dy);
      const softRadius = combinedRadius * ENEMY_SOFT_OVERLAP_RATIO;
      if (gap >= softRadius) continue;
      const fallbackAngle = ((enemy.id * 97 + neighbor.id * 53) % 360) * Math.PI / 180;
      const normalX = gap > 0.001 ? dx / gap : Math.cos(fallbackAngle);
      const normalY = gap > 0.001 ? dy / gap : Math.sin(fallbackAngle);
      const overlap = softRadius - gap;
      pushX += normalX * overlap * 0.35;
      pushY += normalY * overlap * 0.35;
    }
    const pushLength = Math.hypot(pushX, pushY);
    if (pushLength <= 0.001) return enemy;
    if (enemy.aggroLocked && chaseTarget) {
      const toTarget = guideDirection(enemy, chaseTarget);
      const awayFromTarget = pushX * toTarget.x + pushY * toTarget.y;
      if (awayFromTarget < 0) {
        pushX -= toTarget.x * awayFromTarget;
        pushY -= toTarget.y * awayFromTarget;
      }
    }
    const adjustedPushLength = Math.hypot(pushX, pushY);
    if (adjustedPushLength <= 0.001) return enemy;
    const maxPush = attackLocked ? ENEMY_COLLISION_MAX_PUSH * 0.45 : ENEMY_COLLISION_MAX_PUSH;
    const scale = Math.min(maxPush, adjustedPushLength) / adjustedPushLength;
    const nextPosition = resolveWalkableMove(map, enemy, {
      x: enemy.x + pushX * scale,
      y: enemy.y + pushY * scale
    });
    const occupiedPosition = chaseTarget && enemy.aggroLocked
      ? resolveEnemyPlayerBodyOccupancyFloor(map, enemy, nextPosition, chaseTarget)
      : nextPosition;
    return { ...enemy, x: occupiedPosition.x, y: occupiedPosition.y };
  });
}

function resolveEnemyPlayerBodyOccupancyFloor(
  map: BakedBattleMapData | null,
  enemy: Enemy,
  position: { x: number; y: number },
  player: { x: number; y: number }
) {
  const minimumDistance = Math.max(1, PLAYER_GEOMETRY_RADIUS + enemyVisualRadius(enemy) - 2);
  const currentDistance = distance(position, player);
  if (currentDistance >= minimumDistance) return position;
  const angle = currentDistance > 0.001
    ? Math.atan2(position.y - player.y, position.x - player.x)
    : ((enemy.id * 137) % 360) * Math.PI / 180;
  const corrected = {
    x: player.x + Math.cos(angle) * minimumDistance,
    y: player.y + Math.sin(angle) * minimumDistance
  };
  return isMapPointWalkable(map, corrected.x, corrected.y) ? corrected : position;
}

function enemyCollisionRadius(enemy: Enemy) {
  return enemyVisualRadius(enemy);
}

function selectRenderableEnemies(enemies: Enemy[], player: { x: number; y: number }, elapsedSeconds: number) {
  return candidateEnemiesNear(enemies, player, ENEMY_CAMERA_VISIBLE_RANGE)
    .filter((enemy) => enemy.hp > 0 || shouldRetainEnemyForDamageFlash(enemy, elapsedSeconds))
    .sort((left, right) => distance(left, player) - distance(right, player))
    .slice(0, MAX_VISIBLE_ENEMY_DOM_NODES);
}

function shouldRetainEnemyForGameplayOrDamageFlash(enemy: Enemy, elapsedSeconds: number) {
  return enemy.hp > 0 || shouldRetainEnemyForDamageFlash(enemy, elapsedSeconds);
}

function shouldRetainEnemyForDamageFlash(enemy: Pick<Enemy, "lastDamagedAt">, elapsedSeconds: number) {
  return enemy.lastDamagedAt !== undefined
    && elapsedSeconds - enemy.lastDamagedAt >= 0
    && elapsedSeconds - enemy.lastDamagedAt <= ENEMY_DAMAGE_FLASH_SECONDS;
}

function runtimeEnemySimulationIds(enemies: Enemy[], player: { x: number; y: number }) {
  const nearest = candidateEnemiesNear(enemies, player, ENEMY_AWARE_RANGE)
    .filter((enemy) => enemy.hp > 0)
    .sort((left, right) => distance(left, player) - distance(right, player));
  if (nearest.length < MAX_VISIBLE_ENEMY_DOM_NODES) return new Set(nearest.map((enemy) => enemy.id));
  return new Set(nearest.slice(0, MAX_RUNTIME_SIMULATED_ENEMIES).map((enemy) => enemy.id));
}

function nearestGuideTarget(
  source: { x: number; y: number },
  enemies: Enemy[],
  searchRange: number,
  maxDistance: number
) {
  const target = candidateEnemiesNear(enemies, source, Math.max(searchRange, maxDistance))
    .filter((enemy) => enemy.hp > 0 && distance(enemy, source) <= searchRange)
    .sort((a, b) => distance(a, source) - distance(b, source))[0];
  if (target) return { x: target.x, y: target.y };
  return { x: source.x + maxDistance, y: source.y };
}

function guideDirection(source: { x: number; y: number }, target: { x: number; y: number }) {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length };
}

function createFireBoltProjectileLaunch(
  skill: SkillPreview,
  player: { x: number; y: number },
  target: { x: number; y: number },
  projectileIndex: number
) {
  const runtimeParams = skill.runtime_params ?? {};
  const spawnWorldPosition = projectileSpawnWorldPosition(player, runtimeParams);
  const targetWorldPosition = { x: target.x, y: target.y };
  const directionWorld = guideDirection(spawnWorldPosition, targetWorldPosition);
  const projectileSpeed = Math.max(1, Number(runtimeParams.projectile_speed ?? 720));
  return {
    spawnWorldPosition,
    targetWorldPosition,
    directionWorld,
    velocityWorld: {
      x: directionWorld.x * projectileSpeed,
      y: directionWorld.y * projectileSpeed
    },
    distance: distance(spawnWorldPosition, targetWorldPosition),
    projectileId: `${skill.active_gem_instance_id}.legacy.projectile.${projectileIndex + 1}`,
    skillId: skill.skill_package_id ?? skill.skill_template_id
  };
}

function hasLiveEnemyInCastRange(enemies: Enemy[], skill: SkillPreview, source: { x: number; y: number }) {
  const runtimeParams = skill.runtime_params ?? {};
  if (skill.behavior_template === "player_nova") {
    const radius = Math.max(1, Number(runtimeParams.radius ?? skill.hit?.hit_radius ?? skill.cast?.search_range ?? 360));
    return candidateEnemiesNear(enemies, source, radius)
      .some((enemy) => enemy.hp > 0 && distance(enemy, source) <= radius);
  }
  const range = Math.max(
    1,
    Number(skill.cast?.search_range ?? runtimeParams.max_distance ?? runtimeParams.radius ?? skill.hit?.hit_radius ?? 360)
  );
  return candidateEnemiesNear(enemies, source, range)
    .some((enemy) => enemy.hp > 0 && distance(enemy, source) <= range);
}

function skillHasOrbitModuleChain(skill: SkillPreview) {
  const modules = Array.isArray(skill.runtime_params?.modules) ? skill.runtime_params.modules as { type?: unknown }[] : [];
  return modules.some((module) => module.type === "orbit_emitter")
    && modules.some((module) => module.type === "damage_zone");
}

function skillHasProjectileDamageZoneModules(skill: SkillPreview) {
  const modules = Array.isArray(skill.runtime_params?.modules) ? skill.runtime_params.modules as { type?: unknown }[] : [];
  return modules.some((module) => module.type === "projectile")
    && modules.some((module) => module.type === "damage_zone");
}

function nearestEnemy(enemies: Enemy[], source: { x: number; y: number }) {
  return candidateEnemiesNear(enemies, source, ENEMY_AWARE_RANGE)
    .filter((enemy) => enemy.hp > 0)
    .sort((a, b) => distance(a, source) - distance(b, source))[0];
}

function angleBetweenDegrees(left: { x: number; y: number }, right: { x: number; y: number }) {
  const a = normalizedWorldDirection(left);
  const b = normalizedWorldDirection(right);
  const dot = clamp(a.x * b.x + a.y * b.y, -1, 1);
  return Math.acos(dot) * 180 / Math.PI;
}

function projectileSpawnWorldPosition(player: { x: number; y: number }, runtimeParams: Record<string, unknown>) {
  const offset = runtimeParams.spawn_offset as { x?: unknown; y?: unknown } | undefined;
  return {
    x: player.x + Number(offset?.x ?? 0),
    y: player.y + Number(offset?.y ?? 0)
  };
}

function normalizedWorldDirection(direction: { x: number; y: number }) {
  const length = Math.hypot(direction.x, direction.y) || 1;
  return { x: direction.x / length, y: direction.y / length };
}

function worldDirectionToBattleScreenAngle(direction: { x: number; y: number }, origin: { x: number; y: number }) {
  const start = projectBattleWorldToScreen(origin.x, origin.y);
  const end = projectBattleWorldToScreen(origin.x + direction.x, origin.y + direction.y);
  return Math.atan2(end.y - start.y, end.x - start.x);
}

function projectileSpreadAngleDeg(
  behaviorTemplate: string | undefined,
  runtimeParams: Record<string, unknown> | SkillPackageData["behavior"]["params"]
) {
  return Math.max(0, Number(runtimeParams.spread_angle_deg ?? 0));
}

function projectileAngleStepDeg(
  behaviorTemplate: string | undefined,
  runtimeParams: Record<string, unknown> | SkillPackageData["behavior"]["params"]
) {
  return isProjectileSkillTemplate(behaviorTemplate) ? Math.max(0, Number(runtimeParams.angle_step ?? 0)) : 0;
}

function projectileSpreadDirections(
  direction: { x: number; y: number },
  projectileCount: number,
  spreadAngleDeg: number,
  angleStepDeg = 0
) {
  const count = Math.max(1, Math.min(12, Math.round(projectileCount)));
  if (count === 1 || spreadAngleDeg <= 0) return Array.from({ length: count }, () => direction);
  const center = (count - 1) / 2;
  const defaultStep = spreadAngleDeg / Math.max(1, count - 1);
  const step = angleStepDeg > 0 ? Math.min(angleStepDeg, defaultStep) : defaultStep;
  return Array.from({ length: count }, (_, index) => {
    const angleDeg = (index - center) * step;
    return rotateDirection(direction, angleDeg);
  });
}

function rotateDirection(direction: { x: number; y: number }, angleDeg: number) {
  const radians = angleDeg * Math.PI / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: direction.x * cos - direction.y * sin,
    y: direction.x * sin + direction.y * cos
  };
}

function randomAngleOffset(maxDegrees: number) {
  if (maxDegrees <= 0) return 0;
  return (Math.random() * 2 - 1) * maxDegrees;
}

function removeItemsFromInventorySlots(slots: (string | null)[], instanceIds: string[]) {
  const idSet = new Set(instanceIds.filter(Boolean));
  return slots.map((slotInstanceId) => (slotInstanceId && idSet.has(slotInstanceId) ? null : slotInstanceId));
}

function optimisticUnmountBoardItem(state: AppState, instanceId: string) {
  return {
    ...state,
    inventory: state.inventory.map((item) => (
      item.instance_id === instanceId ? { ...item, board_position: null } : item
    )),
    board: {
      ...state.board,
      cells: state.board.cells.map((row) =>
        row.map((cell) => (
          cell.gem?.instance_id === instanceId ? { ...cell, gem: null } : cell
        ))
      ),
    },
  };
}

function optimisticPlaceItemOnBoard(state: AppState, instanceId: string, row: number, column: number, displacedInstanceId?: string) {
  const dragged = state.inventory.find((item) => item.instance_id === instanceId);
  if (!dragged) return state;
  const placedGem = { ...dragged, board_position: { row, column } };
  return {
    ...state,
    inventory: state.inventory.map((item) => {
      if (item.instance_id === instanceId) return placedGem;
      if (item.instance_id === displacedInstanceId) return { ...item, board_position: null };
      return item;
    }),
    board: {
      ...state.board,
      cells: state.board.cells.map((boardRow) =>
        boardRow.map((cell) => {
          if (cell.row === row && cell.column === column) return { ...cell, gem: placedGem };
          if (cell.gem?.instance_id === instanceId || cell.gem?.instance_id === displacedInstanceId) return { ...cell, gem: null };
          return cell;
        })
      ),
    },
  };
}

function canPlaceGemOnBoard(state: AppState, gem: Gem, row: number, column: number, ignoredInstanceIds = new Set<string>()) {
  const target = state.board.cells[row]?.[column];
  if (!target) return false;
  if (target.gem && target.gem.instance_id !== gem.instance_id && !ignoredInstanceIds.has(target.gem.instance_id)) return false;

  const sudokuDigit = sudokuDigitKey(gem);
  return !state.board.cells.some((boardRow) =>
    boardRow.some((cell) => {
      const otherGem = cell.gem;
      if (!otherGem || otherGem.instance_id === gem.instance_id || ignoredInstanceIds.has(otherGem.instance_id)) return false;
      if (sudokuDigitKey(otherGem) !== sudokuDigit) return false;
      return cell.row === row || cell.column === column || cell.box === target.box;
    })
  );
}

function inventoryItemById(state: AppState, instanceId: string | null | undefined) {
  if (!instanceId) return null;
  return state.inventory.find((item) => item.instance_id === instanceId) ?? null;
}

function isGemItem(item: Gem) {
  return item.item_kind !== "ordinary" && item.tags.some((tag) => tag.id === "gem");
}

function canPlaceItemInEquipmentSlot(item: Gem, slot: typeof EQUIPMENT_SLOT_SPECS[number]) {
  if (isGemItem(item)) return false;
  const sourceSlot = equipmentSourceSlotId(item);
  if (sourceSlot) {
    if (sourceSlot === "ring") return slot.id === "ring_1" || slot.id === "ring_2";
    if (sourceSlot === "weapon") return isWeaponSlot(slot);
    return slot.id === sourceSlot;
  }
  if (isWeaponSlot(slot)) return isWeaponItem(item);
  const searchable = equipmentSearchText(item);
  return slot.accepts.some((keyword) => searchable.includes(keyword.toLowerCase()));
}

function equipmentTargetSlotIndices(item: Gem, slotIndex: number): readonly number[] {
  return isWeaponSlot(EQUIPMENT_SLOT_SPECS[slotIndex]) && isTwoHandedWeapon(item)
    ? WEAPON_SLOT_INDICES
    : [slotIndex];
}

function uniqueEquipmentSlotIds(slots: (string | null)[], slotIndices: readonly number[]) {
  const ids: string[] = [];
  for (const slotIndex of slotIndices) {
    const id = slots[slotIndex];
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

function isWeaponSlot(slot: typeof EQUIPMENT_SLOT_SPECS[number] | undefined) {
  return slot?.id === "main_weapon" || slot?.id === "off_weapon";
}

function isWeaponItem(item: Gem) {
  if (equipmentSourceSlotId(item) === "weapon") return true;
  const source = equipmentSourceText(item);
  if ([
    "\u6b66\u5668",
    "\u76fe\u724c",
    "\u5315\u9996",
    "\u5355\u624b\u5251",
    "\u5355\u624b\u65a7",
    "\u5355\u624b\u9524",
    "\u53cc\u624b\u5251",
    "\u53cc\u624b\u65a7",
    "\u53cc\u624b\u9524",
    "\u5f13",
    "\u5f29",
    "\u624b\u6756",
    "\u624b\u67aa",
    "\u6b66\u6756",
    "\u6cd5\u6756",
    "\u706b\u67aa",
    "\u706b\u70ae",
    "\u7075\u6756",
    "\u722a",
    "\u9521\u6756",
    "\u9b54\u6756"
  ].some((keyword) => source.includes(keyword))) return true;
  const searchable = equipmentSearchText(item);
  return [
    "weapon",
    "weapons",
    "sword",
    "blade",
    "axe",
    "mace",
    "bow",
    "crossbow",
    "staff",
    "wand",
    "dagger",
    "claw",
    "spear",
    "gun",
    "武器",
    "剑",
    "刀",
    "斧",
    "锤",
    "弓",
    "弩",
    "杖",
    "法杖",
    "匕首",
    "爪",
    "枪"
  ].some((keyword) => searchable.includes(keyword));
}

function isTwoHandedWeapon(item: Gem) {
  const source = equipmentSourceText(item);
  if ([
    "\u53cc\u624b\u5251",
    "\u53cc\u624b\u65a7",
    "\u53cc\u624b\u9524",
    "\u5f13",
    "\u5f29",
    "\u6cd5\u6756",
    "\u706b\u70ae"
  ].some((keyword) => source.includes(keyword))) return true;
  if (["双手剑", "双手斧", "双手锤", "弓", "弩", "法杖", "火炮"].some((keyword) => source.includes(keyword))) return true;
  const searchable = equipmentSearchText(item);
  return [
    "two_handed",
    "two-handed",
    "two handed",
    "2h",
    "greatsword",
    "greataxe",
    "greatmace",
    "longbow",
    "staff",
    "双手",
    "双手武器",
    "双手剑",
    "双手斧",
    "双手锤",
    "长弓",
    "法杖"
  ].some((keyword) => searchable.includes(keyword));
}

function equipmentSourceSlotId(item: Gem): string {
  const source = equipmentSourceText(item);
  if (!source) return "";
  const sourceSlot = frontendEquipmentSourceSlotIdFromText(source);
  if (sourceSlot) return sourceSlot;
  if (source.includes("头部")) return "head";
  if (source.includes("胸甲")) return "chest";
  if (source.includes("手套")) return "gloves";
  if (source.includes("鞋子")) return "boots";
  if (source.includes("腰带")) return "belt";
  if (source.includes("项链")) return "amulet";
  if (source.includes("戒指") || source.includes("灵戒")) return "ring";
  if (source.includes("盾牌")) return "weapon";
  if ([
    "匕首",
    "单手剑",
    "单手斧",
    "单手锤",
    "双手剑",
    "双手斧",
    "双手锤",
    "弓",
    "弩",
    "手杖",
    "手枪",
    "武杖",
    "法杖",
    "火枪",
    "火炮",
    "灵杖",
    "爪",
    "锡杖",
    "魔杖"
  ].some((keyword) => source.includes(keyword))) return "weapon";
  return "";
}

function equipmentSourceText(item: Gem) {
  return [
    item.gem_type?.identity_text ?? "",
    item.gem_type?.display_text ?? "",
    item.category_text,
    item.tooltip_view?.type_identity_text ?? "",
    item.tooltip_view?.subtitle_text ?? "",
    item.name_text
  ].join(" ");
}

function frontendEquipmentSourceSlotIdFromText(source: string) {
  if (source.includes("\u5934\u90e8")) return "head";
  if (source.includes("\u80f8\u7532")) return "chest";
  if (source.includes("\u624b\u5957")) return "gloves";
  if (source.includes("\u978b\u5b50")) return "boots";
  if (source.includes("\u8170\u5e26")) return "belt";
  if (source.includes("\u9879\u94fe")) return "amulet";
  if (source.includes("\u6212\u6307") || source.includes("\u7075\u6212")) return "ring";
  if (source.includes("\u76fe\u724c")) return "weapon";
  return [
    "\u5315\u9996",
    "\u5355\u624b\u5251",
    "\u5355\u624b\u65a7",
    "\u5355\u624b\u9524",
    "\u53cc\u624b\u5251",
    "\u53cc\u624b\u65a7",
    "\u53cc\u624b\u9524",
    "\u5f13",
    "\u5f29",
    "\u624b\u6756",
    "\u624b\u67aa",
    "\u6b66\u6756",
    "\u6cd5\u6756",
    "\u706b\u67aa",
    "\u706b\u70ae",
    "\u7075\u6756",
    "\u722a",
    "\u9521\u6756",
    "\u9b54\u6756"
  ].some((keyword) => source.includes(keyword)) ? "weapon" : "";
}

function equipmentSearchText(item: Gem) {
  return [
    item.item_kind ?? "",
    item.name_text,
    item.category_text,
    item.rarity_text,
    item.gem_kind ?? "",
    item.gem_type?.id ?? "",
    item.gem_type?.display_text ?? "",
    item.gem_type?.identity_text ?? "",
    item.tooltip_view?.subtitle_text ?? "",
    item.tooltip_view?.type_identity_text ?? "",
    ...item.tags.flatMap((tag) => [tag.id ?? "", tag.text])
  ].join(" ").toLowerCase();
}

function isActiveGem(item: Gem) {
  return item.gem_kind === "active_skill" || item.tags.some((tag) => tag.id === "active_skill_gem");
}

function isPassiveGem(item: Gem) {
  return item.gem_kind === "passive_skill" || item.tags.some((tag) => tag.id === "passive_skill_gem");
}

function isSupportGem(item: Gem) {
  return item.gem_kind === "support" || item.tags.some((tag) => tag.id === "support_gem");
}

function isAllowedRoute(source: Gem, target: Gem) {
  if (isSupportGem(source)) return isActiveGem(target) || isPassiveGem(target);
  if (isPassiveGem(source)) return isActiveGem(target);
  return false;
}

function cellKey(row: number, column: number) {
  return `${row}-${column}`;
}

function sudokuDigitKey(gem: Gem) {
  return gem.sudoku_digit ?? gem.gem_type.number ?? (Number(gem.gem_type.id?.split("_").pop()) || 0);
}

function playerInputVector(keys: Set<string>) {
  let x = 0;
  let y = 0;
  if (keys.has("a")) x -= 1;
  if (keys.has("d")) x += 1;
  if (keys.has("w")) y -= 1;
  if (keys.has("s")) y += 1;
  return { x, y };
}

function resolveAnimationDirection(vector: { x: number; y: number }, fallbackDirection: UnitDirection) {
  return resolveDirection(vector, fallbackDirection);
}

function projectMovementVectorForAnimation(vector: { x: number; y: number }) {
  return {
    x: vector.x - vector.y,
    y: vector.x + vector.y
  };
}

function createBattleCamera(playerX: number, playerY: number, zoom = BATTLE_CAMERA_ZOOM): Camera2D {
  const playerScreen = projectBattleWorldToScreen(playerX, playerY);
  return {
    screenX: playerScreen.x,
    screenY: playerScreen.y + BATTLE_CAMERA_FOLLOW_OFFSET_Y,
    zoom
  };
}

function projectBattleWorldToScreen(worldX: number, worldY: number) {
  return { x: worldX, y: worldY };
}

function battleTerrainTransform(camera: Camera2D) {
  return `translate(${BATTLE_CAMERA_ANCHOR_X}, ${BATTLE_CAMERA_ANCHOR_Y}) scale(${camera.zoom}) translate(${-camera.screenX}px, ${-camera.screenY}px)`;
}

function createBattleRenderEntities(player: { x: number; y: number; hp: number; maxHp: number }, enemies: Enemy[], renderScale = UNIT_RENDER_SCALE): BattleRenderEntity[] {
  return [
    ...enemies.map((enemy) => ({
      kind: "enemy" as const,
      ...enemy,
      playerDistance: distance(enemy, player),
      renderScale
    })),
    { kind: "player" as const, id: "player" as const, x: player.x, y: player.y, hp: player.hp, maxHp: player.maxHp, renderScale, guardActive: false }
  ].sort(compareBattleRenderEntities);
}

function createBattleRenderItems(
  player: { x: number; y: number; hp: number; maxHp: number },
  enemies: Enemy[],
  bolts: FireBolt[],
  hitVfxs: HitVfx[],
  renderScale = UNIT_RENDER_SCALE,
  guardActive = false
): BattleRenderItem[] {
  return [
    ...createBattleRenderEntities(player, enemies, renderScale).map((entity) => entity.kind === "player" ? { ...entity, guardActive } : entity),
    ...bolts
      .filter((bolt) => !usesCanvasProjectileVfx(bolt))
      .map((bolt) => {
        const point = fireBoltWorldPoint(bolt);
        return { kind: "fire-bolt" as const, id: bolt.id, x: point.x, y: point.y, bolt };
      }),
    ...hitVfxs
      .filter((vfx) => !usesCanvasHitVfx(vfx))
      .map((vfx) => ({ kind: "hit-vfx" as const, id: vfx.id, x: vfx.x, y: vfx.y, vfx }))
  ].sort(compareBattleRenderItems);
}

function compareBattleRenderItems(left: BattleRenderItem, right: BattleRenderItem) {
  if (isBattleRenderEntity(left) && isBattleRenderEntity(right)) return compareBattleRenderEntities(left, right);
  return dimetricDepth(left.x, left.y) - dimetricDepth(right.x, right.y);
}

function compareBattleRenderEntities(left: BattleRenderEntity, right: BattleRenderEntity) {
  const depth = compareDimetricDepth(left, right);
  if (left.kind === "enemy" && right.kind === "enemy") {
    const rarity = enemyBattleRenderRarityRank(left) - enemyBattleRenderRarityRank(right);
    if (rarity !== 0) return rarity;
    return depth || left.id - right.id;
  }
  if (Math.abs(depth) > 28) return depth;
  return battleRenderEntityRarityRank(left) - battleRenderEntityRarityRank(right);
}

function isBattleRenderEntity(item: BattleRenderItem): item is BattleRenderEntity {
  return item.kind === "enemy" || item.kind === "player";
}

function battleRenderEntityRarityRank(entity: BattleRenderEntity) {
  if (entity.kind === "player") return 2;
  return enemyBattleRenderRarityRank(entity);
}

function enemyBattleRenderRarityRank(enemy: Extract<BattleRenderEntity, { kind: "enemy" }>) {
  const visual = resolveMonsterGeometryVisual(enemy.monsterId);
  const tier = enemy.spawnRarity ?? visual?.tier ?? (enemy.monsterId === "enemy_brute" ? "rare" : "normal");
  if (tier === "boss") return 4;
  if (tier === "rare") return 3;
  if (tier === "magic") return 1;
  return 0;
}

function createBattleAnimationContexts(
  playerVisual: UnitVisualRuntime,
  enemyVisuals: Map<number, EnemyVisualRuntime>,
  enemies: Enemy[],
  player: { x: number; y: number },
  elapsedMs: number,
  playerMoveSpeed: number
): BattleAnimationContexts {
  const currentMoveSpeed = playerMoveSpeed;
  const playerMoving = Math.hypot(playerVisual.movementVector.x, playerVisual.movementVector.y) > 0.001;
  const enemyContexts = new Map<number, UnitAnimationContext>();
  enemies.forEach((enemy) => {
    const unitId = fallbackUnitVisualForMonster(enemy.monsterId ?? selectEnemyUnitType(enemy.id));
    const visual = enemyVisuals.get(enemy.id);
    const attackActive = visual?.attackUntilMs !== undefined && elapsedMs < visual.attackUntilMs;
    const movementVector = visual?.movementVector ?? { x: player.x - enemy.x, y: player.y - enemy.y };
    const moving = Math.hypot(movementVector.x, movementVector.y) > 0.001;
    const enemyMoveSpeed = moving ? 58 : 0;
    enemyContexts.set(enemy.id, {
      unitId,
      requestedState: attackActive ? "attack" : unitMovementState(moving, 58, enemyMoveSpeed),
      movementVector,
      fallbackDirection: visual?.direction ?? "down",
      elapsedMs,
      baseMoveSpeed: 58,
      currentMoveSpeed: enemyMoveSpeed,
      attackStartedAtMs: visual?.attackStartedAtMs,
      attackUntilMs: visual?.attackUntilMs
    });
  });

  return {
    player: {
      unitId: "player_adventurer",
      requestedState: unitMovementState(playerMoving, PLAYER_SPEED, currentMoveSpeed),
      movementVector: playerVisual.movementVector,
      fallbackDirection: playerVisual.direction,
      elapsedMs,
      baseMoveSpeed: PLAYER_SPEED,
      currentMoveSpeed
    },
    enemies: enemyContexts
  };
}

function renderBattleRenderItem(item: BattleRenderItem, depthIndex: number, animationContexts: BattleAnimationContexts) {
  if (item.kind === "fire-bolt") {
    return <FireBoltView key={`fire-bolt-${item.id}`} bolt={item.bolt} depthIndex={depthIndex} />;
  }
  if (item.kind === "hit-vfx") {
    return <HitVfxView key={`hit-vfx-${item.id}`} vfx={item.vfx} depthIndex={depthIndex} />;
  }
  return renderBattleEntity(item, depthIndex, animationContexts);
}

function BossHealthBar({ enemy }: { enemy: Enemy }) {
  const ratio = clamp(enemy.hp / Math.max(1, enemy.maxHp), 0, 1);
  return (
    <section className="boss-health-bar" aria-label="传奇怪物生命值">
      <div className="boss-health-frame">
        <span className="boss-health-title">{bossHealthName(enemy)}</span>
        <span className="boss-health-level">传奇</span>
        <div className="boss-health-track">
          <span style={{ width: `${ratio * 100}%` }} />
        </div>
      </div>
    </section>
  );
}

function bossHealthName(enemy: Enemy) {
  const visual = resolveMonsterGeometryVisual(enemy.monsterId);
  if (visual?.tier === "boss") return `传奇怪物 ${bossMarkerLabel(enemy.monsterId)}`;
  return "传奇怪物";
}

function bossMarkerLabel(monsterId?: string) {
  const numericId = monsterId?.match(/^mon_4001(\d{2})$/)?.[1];
  return numericId ? `B-${numericId}` : "";
}

function shouldRenderLegacyBattleItem(item: BattleRenderItem) {
  if (!CANVAS_GEOMETRY_BATTLE_OBJECTS) return true;
  return item.kind === "hit-vfx" && !CANVAS_GEOMETRY_SKILL_EFFECTS;
}

function renderBattleEntity(entity: BattleRenderEntity, depthIndex: number, animationContexts: BattleAnimationContexts) {
  if (entity.kind === "player") {
    const animationFrame = resolveUnitAnimation(animationContexts.player);
    return (
      <div
        key="player"
        className={`player unit-visual unit-visual-player${entity.guardActive ? " unit-visual-player-guarded" : ""}`}
        style={battleUnitStyle(entity, animationFrame, depthIndex, entity.renderScale)}
        data-animation-state={animationFrame.animation.state}
        data-animation-direction={animationFrame.animation.direction}
        data-animation-playback-rate={animationFrame.playbackRate}
        aria-hidden="true"
      >
        <UnitAnimationSprite frame={animationFrame} />
      </div>
    );
  }

  const context = animationContexts.enemies.get(entity.id) ?? {
    unitId: fallbackUnitVisualForMonster(entity.monsterId ?? selectEnemyUnitType(entity.id)),
    requestedState: "idle" as const,
    movementVector: { x: 0, y: 0 },
    fallbackDirection: "down" as const,
    elapsedMs: 0,
    baseMoveSpeed: 58,
    currentMoveSpeed: 0
  };
  const animationFrame = resolveUnitAnimation(context);
  const healthVisible = entity.lastDamagedAt !== undefined
    && animationContexts.player.elapsedMs / 1000 - entity.lastDamagedAt <= ENEMY_HEALTH_VISIBLE_SECONDS;
  const hitFlash = enemyHitFlashAmount(entity.lastDamagedAt, animationContexts.player.elapsedMs / 1000);
  return (
    <div
      key={`enemy-${entity.id}`}
      className={`enemy unit-visual unit-visual-${animationFrame.animation.unitId}`}
      style={battleUnitStyle(entity, animationFrame, depthIndex, entity.renderScale)}
      data-enemy-id={entity.id}
      data-animation-state={animationFrame.animation.state}
      data-animation-direction={animationFrame.animation.direction}
      data-animation-playback-rate={animationFrame.playbackRate}
    >
      {healthVisible && (
        <div className="enemy-health" aria-hidden="true">
          <span style={{ width: `${Math.max(0, entity.hp / entity.maxHp) * 100}%` }} />
        </div>
      )}
      <UnitAnimationSprite frame={animationFrame} hitFlash={hitFlash} />
    </div>
  );
}

function UnitAnimationSprite({ frame, hitFlash = 0 }: { frame: UnitAnimationFrame; hitFlash?: number }) {
  const motionStyle = unitAnimationMotionStyle(frame);
  const showAttackSwipe = frame.animation.state === "attack" && frame.animation.unitId !== "enemy_imp";
  const flash = clamp(hitFlash, 0, 1);
  return (
    <span
      className={`unit-sprite unit-animation-sprite unit-animation-${frame.animation.state}`}
      style={{
        width: frame.animation.frameWidth,
        height: frame.animation.frameHeight,
        backgroundImage: `url(${frame.animation.src})`,
        backgroundPosition: `${-frame.frameIndex * frame.animation.frameWidth}px ${-frame.animation.frameRow * frame.animation.frameHeight}px`,
        filter: flash > 0
          ? `brightness(${1 + flash * 1.9}) saturate(${1 - flash * 0.62}) drop-shadow(0 0 ${Math.round(10 + flash * 14)}px rgba(255, 255, 255, ${0.32 + flash * 0.58}))`
          : undefined,
        ...motionStyle
      }}
      data-animation-frame={frame.frameIndex}
      aria-hidden="true"
    >
      {showAttackSwipe && <span className="unit-attack-swipe" />}
    </span>
  );
}

function enemyHitFlashAmount(lastDamagedAt: number | undefined, elapsedSeconds: number) {
  if (lastDamagedAt === undefined) return 0;
  const age = elapsedSeconds - lastDamagedAt;
  if (age < 0 || age > ENEMY_DAMAGE_FLASH_SECONDS) return 0;
  return 1 - clamp(age / ENEMY_DAMAGE_FLASH_SECONDS, 0, 1);
}

function unitAnimationMotionStyle(frame: UnitAnimationFrame): CSSProperties {
  const state = frame.animation.state;
  if (state === "idle") return {};
  const direction = frame.animation.direction;
  const frameIndex = frame.frameIndex;
  const signX = direction === "left" ? -1 : direction === "right" ? 1 : 0;
  const signY = direction === "up" ? -1 : direction === "down" ? 1 : 0;
  const diagonalX = signX || (direction === "up" || direction === "down" ? 0.35 : 0);
  if (state === "walk") {
    return {};
  }
  const attackPhase = frame.animation.frameCount <= 1 ? 1 : frameIndex / (frame.animation.frameCount - 1);
  const lunge = Math.sin(attackPhase * Math.PI);
  const recoil = attackPhase > 0.62 ? -3 * (attackPhase - 0.62) : 0;
  const forwardX = (signX || diagonalX) * (10 * lunge + recoil);
  const forwardY = signY * (7 * lunge + recoil * 0.5);
  const rotate = (signX || 1) * (attackPhase < 0.45 ? -7 : 10) * lunge;
  const scale = 1 + 0.07 * lunge;
  return {
    transform: `translate(${forwardX}px, ${forwardY}px) rotate(${rotate}deg) scale(${scale})`
  };
}

function battleUnitStyle(entity: { x: number; y: number }, frame: UnitAnimationFrame, depthIndex: number, renderScale = UNIT_RENDER_SCALE): CSSProperties {
  const visualPoint = projectBattleWorldToScreen(entity.x, entity.y);
  const asset = frame.animation;
  return {
    left: visualPoint.x,
    top: visualPoint.y,
    width: asset.frameWidth,
    height: asset.frameHeight,
    zIndex: BATTLE_ENTITY_Z_INDEX_BASE + depthIndex,
    "--unit-anchor-x": asset.anchorX,
    "--unit-anchor-y": asset.anchorY,
    "--unit-render-scale": renderScale * asset.scale
  } as CSSProperties;
}

function floatingTextStyle(text: FloatingText): CSSProperties {
  const visualPoint = projectBattleWorldToScreen(text.x, text.y);
  const progress = clamp(1 - text.ttl / Math.max(0.001, text.duration), 0, 1);
  const pop = 1 + Math.sin((1 - Math.min(progress, 0.35) / 0.35) * Math.PI) * 0.24;
  return {
    left: visualPoint.x,
    top: visualPoint.y - progress * FLOATING_TEXT_VISUAL_RISE_SPEED,
    opacity: Math.max(0, text.ttl / Math.max(0.001, text.duration)),
    transform: `translate(-50%, -50%) scale(${pop})`
  };
}

function GemTooltip({ tooltip }: { tooltip: Tooltip }) {
  const { gem, left, top, transform } = tooltip;
  const view = buildGemTooltipViewModel(gem);
  if (!view) return null;
  if (view.variant === "support") {
    return <SupportGemTooltip gem={gem} view={view} left={left} top={top} transform={transform} />;
  }
  const isActiveTooltip = view.variant === "active" || view.variant === "passive";
  const sections = view.sections;
  return (
    <div className={`gem-tooltip ${isActiveTooltip ? "active-tooltip" : ""}`} style={{ left, top, transform }}>
      <div className="tooltip-header">
        <GemOrb gem={gem} />
        <div className="tooltip-heading">
          <h3 className={isActiveTooltip ? "tooltip-tone-title" : undefined}>{view.name_text}</h3>
          {isActiveTooltip ? <RichText line={highlightTooltipText(view.subtitle_text)} /> : <p>{view.subtitle_text}</p>}
        </div>
      </div>
      {view.type_identity_text && <p className="tooltip-identity">{view.type_identity_text}</p>}
      {!isActiveTooltip && <div className="tooltip-tag-list">{view.tags.map((tag) => <TooltipTag key={`${tag.id ?? tag.text}-${tag.text}`} tag={tag} />)}</div>}
      <TooltipSection title={sections.description.title_text}>
        {sections.description.lines.map((line) => isActiveTooltip ? <RichText key={line} line={highlightTooltipText(line)} /> : <p key={line}>{line}</p>)}
      </TooltipSection>
      {sections.stats.lines.length > 0 && <TooltipSection title={sections.stats.title_text}>
        <dl className="tooltip-stat-list">
          {sections.stats.lines.map((line) => (
            <div key={`${line.label_text}-${line.value_text}`} className="tooltip-stat-line">
              <dt className={isActiveTooltip ? "tooltip-tone-body" : undefined}>{line.label_text}：</dt>
              <dd className={isActiveTooltip ? "tooltip-tone-body" : undefined}>
                {isActiveTooltip ? <RichText line={highlightTooltipText(line.value_text)} className="tooltip-stat-rich-value" /> : line.value_text}
              </dd>
            </div>
          ))}
        </dl>
      </TooltipSection>}
      {sections.recent_dps && sections.recent_dps.lines.length > 0 && (
        <TooltipSection title={sections.recent_dps.title_text}>
          <dl className="tooltip-stat-list">
            {sections.recent_dps.lines.map((line) => (
              <div key={`${line.label_text}-${line.value_text}`} className="tooltip-stat-line">
                <dt className={isActiveTooltip ? "tooltip-tone-body" : undefined}>{line.label_text}：</dt>
                <dd className={isActiveTooltip ? activeDpsToneClass(line.value_text) : undefined}>{line.value_text}</dd>
              </div>
            ))}
          </dl>
        </TooltipSection>
      )}
      {sections.bonuses && sections.bonuses.lines.length > 0 && (
        <TooltipSection title={sections.bonuses.title_text}>
          {sections.bonuses.lines.map((line, index) => <p key={`${index}-${line}`} className={`tooltip-bonus-line ${isActiveTooltip ? "tooltip-tone-rule" : ""}`}>{line}</p>)}
        </TooltipSection>
      )}
      {view.variant === "active" && sections.base_skill_level && sections.base_skill_level.lines.length > 0 && (
        <TooltipSection title="">
          {sections.base_skill_level.lines.map((line) => <p key={line} className="tooltip-tone-bonus-positive">{line}</p>)}
        </TooltipSection>
      )}
      {sections.current_targets && sections.current_targets.lines.length > 0 && <TooltipSection title={sections.current_targets.title_text}>
        {sections.current_targets.lines.map((line) => (
          <p key={`${line.name_text}-${line.status_text}`} className="tooltip-target-line">
            <span>{line.name_text}</span>
            <strong>{line.status_text}</strong>
          </p>
        ))}
      </TooltipSection>}
      {sections.rules && sections.rules.lines.length > 0 && <TooltipSection title={sections.rules.title_text}>
        {sections.rules.lines.map((line) => <p key={line} className={isActiveTooltip ? "tooltip-tone-bonus-positive" : undefined}>{line}</p>)}
      </TooltipSection>}
    </div>
  );
}

function SupportGemTooltip({ gem, view, left, top, transform }: { gem: Gem; view: TooltipView; left: number; top: number; transform: string }) {
  const sections = view.sections;
  return (
    <div className="gem-tooltip support-tooltip" style={{ left, top, transform }}>
      <div className="tooltip-header">
        <GemOrb gem={gem} />
        <div className="tooltip-heading">
          <h3 className="support-tooltip-name">{view.name_text}</h3>
          {(view.summary_lines ?? []).map((line, index) => <RichText key={index} line={line} className="support-tooltip-summary" />)}
        </div>
      </div>
      <TooltipSection title={sections.description.title_text}>
        {(sections.description as { rich_lines?: TooltipRichLine[] }).rich_lines?.map((line, index) => <RichText key={index} line={line} />)}
      </TooltipSection>
      {sections.conditions && sections.conditions.rich_lines.length > 0 && (
        <TooltipSection title="">
          {sections.conditions.rich_lines.map((line, index) => <RichText key={index} line={line} />)}
        </TooltipSection>
      )}
      {sections.support_rules && sections.support_rules.rich_lines.length > 0 && (
        <TooltipSection title="">
          {sections.support_rules.rich_lines.map((line, index) => <RichText key={index} line={line} />)}
        </TooltipSection>
      )}
      {sections.base_bonuses && sections.base_bonuses.rich_lines.length > 0 && (
        <TooltipSection title="">
          {sections.base_bonuses.rich_lines.map((line, index) => <RichText key={index} line={line} />)}
        </TooltipSection>
      )}
    </div>
  );
}

function RichText({ line, className = "" }: { line: TooltipRichLine; className?: string }) {
  return (
    <p className={`tooltip-rich-line ${className}`}>
      {line.map((segment, index) => (
        <span key={`${index}-${segment.text}`} className={segment.tone ? `tooltip-tone-${segment.tone}` : undefined}>
          {segment.text}
        </span>
      ))}
    </p>
  );
}

const tooltipHighlightTones: Record<string, string> = {
  "红色": "color-red",
  "蓝色": "color-blue",
  "绿色": "color-green",
  "粉色": "color-pink",
  "黄色": "color-yellow",
  "白色": "color-white",
  "黑色": "color-black",
  "青色": "color-cyan",
  "橙色": "color-orange",
  "火焰": "damage-fire",
  "冰霜": "damage-cold",
  "闪电": "damage-lightning",
  "物理": "damage-physical",
  "混沌": "damage-chaos"
};

const tooltipHighlightTerms = Object.keys(tooltipHighlightTones).sort((left, right) => right.length - left.length);

function highlightTooltipText(text: string): TooltipRichLine {
  const segments: TooltipRichLine = [];
  let index = 0;
  while (index < text.length) {
    const term = tooltipHighlightTerms.find((candidate) => text.startsWith(candidate, index));
    if (term) {
      segments.push({ text: term, tone: tooltipHighlightTones[term] });
      index += term.length;
      continue;
    }
    const nextIndex = tooltipHighlightTerms.reduce((next, candidate) => {
      const found = text.indexOf(candidate, index + 1);
      return found >= 0 ? Math.min(next, found) : next;
    }, text.length);
    segments.push({ text: text.slice(index, nextIndex), tone: "body" });
    index = nextIndex;
  }
  return segments;
}

function activeDpsToneClass(valueText: string) {
  if (valueText.includes("↘") || valueText.includes("-")) {
    return "tooltip-tone-color-red";
  }
  if (valueText.includes("↗") || valueText.includes("+")) {
    return "tooltip-tone-color-green";
  }
  return "tooltip-tone-body";
}

function buildGemTooltipViewModel(gem: Gem) {
  const view = gem.tooltip_view;
  if (!view || (view.variant !== "active" && view.variant !== "passive")) return view;
  return normalizeActiveTooltipView(gem, view);
}

function gemWithFrontendSkillPreviewTooltip(gem: Gem, skill?: SkillPreview): Gem {
  const view = gem.tooltip_view;
  if (!skill || !view || view.variant !== "active") return gem;
  const componentLines = [
    ...frontendDamageComponentTooltipLines(skill.final_damage_components),
    ...frontendEquipmentGrantedTooltipLines(skill.runtime_params?.frontend_equipment_granted_effects)
  ];
  if (componentLines.length === 0) return gem;
  return {
    ...gem,
    tooltip_view: {
      ...view,
      sections: {
        ...view.sections,
        stats: {
          ...view.sections.stats,
          lines: mergeFrontendSkillPreviewTooltipLines(view.sections.stats.lines, skill, componentLines)
        }
      }
    }
  };
}

function mergeFrontendSkillPreviewTooltipLines(lines: TooltipStatLine[], skill: SkillPreview, componentLines: TooltipStatLine[]) {
  const nextLines = lines.map((line) => isPrimaryDamageTooltipLine(line.label_text)
    ? { ...line, value_text: formatPreviewNumber(skill.final_damage ?? line.value_text) }
    : line);
  const insertAfter = nextLines.findIndex((line) => isPrimaryDamageTooltipLine(line.label_text));
  const existingLabels = new Set(nextLines.map((line) => line.label_text));
  const missingComponentLines = componentLines.filter((line) => !existingLabels.has(line.label_text));
  if (missingComponentLines.length === 0) return nextLines;
  if (insertAfter < 0) return [...nextLines, ...missingComponentLines];
  return [...nextLines.slice(0, insertAfter + 1), ...missingComponentLines, ...nextLines.slice(insertAfter + 1)];
}

function isPrimaryDamageTooltipLine(labelText: string) {
  return labelText.includes("\u4f24\u5bb3") || labelText.includes("\u6d5c\u3085");
}

function frontendDamageComponentTooltipLines(components?: Record<string, number>) {
  if (!components || typeof components !== "object" || Array.isArray(components)) return [];
  return Object.entries(components)
    .map(([damageType, amount]) => ({
      label_text: frontendDamageTypeLabel(damageType),
      value_text: formatPreviewNumber(amount),
    }))
    .filter((line) => line.label_text && Number(line.value_text) > 0);
}

function frontendEquipmentGrantedTooltipLines(effects: unknown) {
  if (!Array.isArray(effects)) return [];
  return effects
    .map((effect) => {
      if (!effect || typeof effect !== "object" || Array.isArray(effect)) return null;
      const record = effect as Record<string, unknown>;
      if (record.effect_kind !== "direct_damage") return null;
      const damageType = String(record.damage_type ?? "");
      const resolvedDamageType = damageType === "generic" ? "" : damageType;
      const multiplier = Math.max(0, Number(record.damage_multiplier ?? 1));
      const min = Number(record.value_min ?? record.value ?? 0) * multiplier;
      const max = Number(record.value_max ?? record.value ?? min) * multiplier;
      const low = Math.min(min, max);
      const high = Math.max(min, max);
      if (!Number.isFinite(low) || !Number.isFinite(high) || high <= 0) return null;
      return {
        label_text: `\u88c5\u5907\u9644\u52a0${frontendDamageTypeLabel(resolvedDamageType || "generic")}`,
        value_text: Math.round(low) === Math.round(high)
          ? formatPreviewNumber(high)
          : `${formatPreviewNumber(low)} - ${formatPreviewNumber(high)}`,
      };
    })
    .filter((line): line is TooltipStatLine => Boolean(line));
}

function frontendDamageTypeLabel(damageType: string) {
  if (damageType === "generic") return "\u4f24\u5bb3";
  if (damageType === "physical") return "\u7269\u7406\u4f24\u5bb3";
  if (damageType === "fire") return "\u706b\u7130\u4f24\u5bb3";
  if (damageType === "cold") return "\u51b0\u971c\u4f24\u5bb3";
  if (damageType === "lightning") return "\u95ea\u7535\u4f24\u5bb3";
  if (damageType === "chaos") return "\u6df7\u6c8c\u4f24\u5bb3";
  if (damageType === "true") return "\u771f\u5b9e\u4f24\u5bb3";
  return `${damageType}\u4f24\u5bb3`;
}

const HIDDEN_ACTIVE_TOOLTIP_TAG_IDS = new Set(["bow", "gun", "cannon"]);
const RELEASE_INTERVAL_LABELS = new Set(["攻击间隔", "施法时间", "实际释放间隔", "释放间隔", "基础释放间隔"]);

function normalizeActiveTooltipView(gem: Gem, view: TooltipView): TooltipView {
  const tags = view.tags.filter((tag) => !HIDDEN_ACTIVE_TOOLTIP_TAG_IDS.has(tag.id ?? ""));
  const sections = {
    ...view.sections,
    stats: {
      ...view.sections.stats,
      lines: ensureReleaseIntervalStatLine(gem, view.sections.stats.lines),
    },
  };
  return {
    ...view,
    tags,
    subtitle_text: normalizedTooltipSubtitle(view.subtitle_text, tags),
    sections,
  };
}

function normalizedTooltipSubtitle(subtitle: string, tags: TooltipTagView[]) {
  const parts = subtitle.split("、").filter(Boolean);
  if (parts.length === 0) return subtitle;
  const colorText = parts[0];
  return [colorText, ...tags.map((tag) => tag.text)].join("、");
}

function ensureReleaseIntervalStatLine(gem: Gem, lines: TooltipStatLine[]) {
  if (lines.some((line) => RELEASE_INTERVAL_LABELS.has(line.label_text))) return lines;
  const skillTag = gem.tags.find((tag) => typeof tag.id === "string" && tag.id.startsWith("skill_"))?.id ?? "";
  const preview = skillTag ? (FRONTEND_SKILL_PREVIEWS_BY_SKILL_TAG as Record<string, SkillPreview>)[skillTag] : undefined;
  const releaseIntervalMs = Number(
    preview?.release_interval_ms
      ?? gem.base_effect?.release_interval_ms
      ?? gem.base_effect?.base_release_interval_ms
      ?? 0
  );
  if (!Number.isFinite(releaseIntervalMs) || releaseIntervalMs <= 0) return lines;
  const tagIds = new Set((gem.tags ?? []).map((tag) => tag.id ?? tag.text));
  if (!tagIds.has("attack") && !tagIds.has("spell")) return lines;
  const line = {
    label_text: tagIds.has("spell") ? "施法时间" : "攻击间隔",
    value_text: `${formatPreviewNumber(releaseIntervalMs)} 毫秒`,
  };
  const insertAfter = Math.max(
    lines.findIndex((candidate) => candidate.label_text === "冷却"),
    lines.findIndex((candidate) => ["攻击伤害", "法术伤害", "技能伤害"].includes(candidate.label_text)),
  );
  if (insertAfter < 0) return [...lines, line];
  return [...lines.slice(0, insertAfter + 1), line, ...lines.slice(insertAfter + 1)];
}

function TooltipTag({ tag }: { tag: TooltipTagView }) {
  return <span className={`tooltip-tag ${tag.tone ? `tooltip-tag-${tag.tone}` : ""}`}>{tag.text}</span>;
}

function TooltipSection({ children }: { title: string; children: ReactNode }) {
  return (
    <section className="tooltip-section">
      <div className="tooltip-section-content">{children}</div>
    </section>
  );
}

function GemOrb({ gem }: { gem: Gem }) {
  const sprite = gem.tooltip_view?.icon_sprite;
  const className = !isGemItem(gem)
    ? "item-orb"
    : `gem-orb-color-${gem.tooltip_view?.icon_color_key ?? gemColorKey(gem)}`;
  const style = sprite ? ({ "--gem-icon-sprite": `url(${sprite})` } as React.CSSProperties) : undefined;
  return (
    <span className={`gem-orb ${className} ${sprite ? "gem-orb-sprite" : ""}`} style={style}>
      {sprite ? <span className="gem-orb-label">{gem.tooltip_view?.icon_text ?? gem.name_text.slice(0, 1)}</span> : gem.tooltip_view?.icon_text ?? gem.name_text.slice(0, 1)}
    </span>
  );
}

function gemColorKey(gem: Gem) {
  const number = gem.sudoku_digit ?? gem.gem_type?.number ?? Number((gem.gem_type?.id ?? gem.tags.find((tag) => tag.id?.startsWith("gem_type_"))?.id ?? "").split("_").pop());
  const colorByType: Record<number, string> = {
    1: "red",
    2: "blue",
    3: "green",
    4: "pink",
    5: "yellow",
    6: "white",
    7: "black",
    8: "cyan",
    9: "orange"
  };
  return colorByType[number] ?? "white";
}

function gemColorValue(gem: Gem) {
  const colors: Record<string, string> = {
    red: "#FF4D4D",
    blue: "#4DA3FF",
    green: "#5CDB7A",
    pink: "#FF5FD2",
    yellow: "#FFD84D",
    white: "#D8D8D8",
    black: "#B08CFF",
    cyan: "#4DDFFF",
    orange: "#FF9A3D"
  };
  return colors[gem.tooltip_view?.icon_color_key ?? gemColorKey(gem)] ?? "#A8A6FF";
}

function usesSkillEventPipeline(skill: SkillPreview) {
  return Boolean(skill.skill_package_id && (isProjectileSkillTemplate(skill.behavior_template) || skill.behavior_template === "module_chain" || skill.behavior_template === "player_nova" || skill.behavior_template === "melee_arc" || skill.behavior_template === "damage_zone" || skill.behavior_template === "chain"));
}

function isThundercloudSkill(skill: SkillPreview) {
  const packageId = cssToken(skill.skill_package_id);
  const templateId = cssToken(skill.skill_template_id);
  const visualEffect = cssToken(skill.visual_effect);
  const presentationVfx = cssToken(typeof skill.presentation_keys?.vfx === "string" ? skill.presentation_keys.vfx : undefined);
  return packageId.includes("thundercloud")
    || templateId.includes("thundercloud")
    || visualEffect.includes("thundercloud")
    || presentationVfx.includes("thundercloud");
}

function uniqueDamageZonesByZoneId(zones: DamageZoneVfx[]) {
  const keyed = new Map<string, DamageZoneVfx>();
  const unkeyed: DamageZoneVfx[] = [];
  for (const zone of zones) {
    if (!zone.zoneId) {
      unkeyed.push(zone);
      continue;
    }
    keyed.set(zone.zoneId, zone);
  }
  return [...unkeyed, ...keyed.values()];
}

function isProjectileSkillTemplate(behaviorTemplate: string | undefined) {
  return behaviorTemplate === "projectile";
}

function normalizedVfxScale(value: unknown) {
  const scale = Number(value ?? 1);
  return Number.isFinite(scale) ? clamp(scale, 0.1, 10) : 1;
}

function skillPreviewVfxScale(skill: SkillPreview) {
  return normalizedVfxScale(skill.presentation_keys?.vfx_scale);
}

function packageVfxScale(packageData: SkillPackageData) {
  return normalizedVfxScale(packageData.presentation.vfx_scale);
}

function damageTypeText(damageType: string) {
  const text: Record<string, string> = {
    fire: "火焰",
    cold: "冰霜",
    lightning: "闪电",
    physical: "物理"
  };
  return text[damageType] ?? "技能";
}

function forcedElementDamageType(skill: SkillPreview, timestampMs: number) {
  const values = skill.runtime_params?.forced_element_types;
  if (!Array.isArray(values)) return skill.damage_type;
  const elements = values
    .map((value) => String(value))
    .filter((value) => value === "fire" || value === "cold" || value === "lightning");
  if (elements.length === 0) return skill.damage_type;
  return elements[stableStringHash(`${skill.active_gem_instance_id}:${timestampMs}`) % elements.length];
}

function stableStringHash(seed: string) {
  let value = 0;
  for (const char of seed) {
    value = (Math.imul(value, 131) + char.charCodeAt(0)) >>> 0;
  }
  return value;
}

function stablePercent(seed: string) {
  return stableStringHash(seed) % 10000 / 100;
}

type ProjectileVfxKind = "burning_shot" | "fire_bolt" | "ice_shards" | "penetrating_shot" | "rain_of_arrows" | "sparkle";

function projectileVfxKind(value: string | undefined): ProjectileVfxKind | null {
  const token = cssToken(value);
  if (token.includes("burning_shot") || token.includes("skill_event_burning_shot")) return "burning_shot";
  if (token.includes("sparkle") || token.includes("skill_event_sparkle")) return "sparkle";
  if (token.includes("rain_of_arrows") || token.includes("skill_event_rain_of_arrows")) return "rain_of_arrows";
  if (token.includes("fire_bolt") || token.includes("skill_event_fire_bolt")) return "fire_bolt";
  if (token.includes("ice_shards") || token.includes("ice_shot") || token.includes("skill_ice_shards") || token.includes("active_ice_shot")) return "ice_shards";
  if (token.includes("penetrating_shot") || token.includes("skill_penetrating_shot")) return "penetrating_shot";
  return null;
}

function projectileVfxSheets(vfxKind: ProjectileVfxKind) {
  if (vfxKind === "ice_shards") {
    return {
      projectile: ICE_SHARDS_VFX.projectileLoop,
      trail: ICE_SHARDS_VFX.trailFrost,
      impact: ICE_SHARDS_VFX.impactBurst,
      sparks: ICE_SHARDS_VFX.crystalSparks,
      muzzle: null,
      trailLength: ICE_SHARDS_TRAIL_LENGTH,
      projectileFrameRow: ICE_SHARDS_PROJECTILE_FRAME_ROW,
      projectileFakeZ: ICE_SHARDS_PROJECTILE_FAKE_Z,
      impactFakeZ: ICE_SHARDS_FAKE_Z,
      artFacingOffset: ICE_SHARDS_PROJECTILE_ART_FACING_OFFSET,
      impactDurationMs: ICE_SHARDS_IMPACT_DURATION_MS,
      projectileVisibleWidth: 109,
      projectileVisibleHeight: 46,
      impactVisibleWidth: 130,
      impactVisibleHeight: 114
    };
  }
  if (vfxKind === "penetrating_shot" || vfxKind === "rain_of_arrows") {
    return {
      projectile: PENETRATING_SHOT_VFX.projectileLoop,
      trail: PENETRATING_SHOT_VFX.trailLines,
      impact: PENETRATING_SHOT_VFX.impactSparks,
      sparks: null,
      muzzle: PENETRATING_SHOT_VFX.muzzleFlash,
      trailLength: vfxKind === "rain_of_arrows" ? 3 : PENETRATING_SHOT_TRAIL_LENGTH,
      projectileFrameRow: PENETRATING_SHOT_PROJECTILE_FRAME_ROW,
      projectileFakeZ: PENETRATING_SHOT_PROJECTILE_FAKE_Z,
      impactFakeZ: PENETRATING_SHOT_PROJECTILE_FAKE_Z,
      artFacingOffset: PENETRATING_SHOT_ART_FACING_OFFSET,
      impactDurationMs: PENETRATING_SHOT_IMPACT_DURATION_MS,
      projectileVisibleWidth: 114,
      projectileVisibleHeight: 28,
      impactVisibleWidth: 70,
      impactVisibleHeight: 48
    };
  }
  return {
    projectile: FIRE_BOLT_VFX.projectileLoop,
    trail: FIRE_BOLT_VFX.trailPuffs,
    impact: FIRE_BOLT_VFX.impactExplosion,
    sparks: FIRE_BOLT_VFX.sparks,
    muzzle: null,
    trailLength: FIRE_BOLT_TRAIL_LENGTH,
    projectileFrameRow: FIRE_BOLT_PROJECTILE_FRAME_ROW,
    projectileFakeZ: FIRE_BOLT_PROJECTILE_FAKE_Z,
    impactFakeZ: FIRE_BOLT_FAKE_Z,
    artFacingOffset: FIRE_BOLT_PROJECTILE_ART_FACING_OFFSET,
    impactDurationMs: FIRE_BOLT_IMPACT_DURATION_MS,
    projectileVisibleWidth: 79,
    projectileVisibleHeight: 47,
    impactVisibleWidth: 129,
    impactVisibleHeight: 116
  };
}

function damageNumberText(amount: unknown) {
  const value = Number(amount ?? 0);
  if (!Number.isFinite(value)) return "0";
  return Math.max(0, Math.round(value)).toString();
}

function floatingTextDamageComponents(event: SkillEvent): [string, number][] {
  const floatingComponents = event.payload?.floating_damage_components;
  if (Array.isArray(floatingComponents)) {
    const rows = floatingComponents
      .map((component) => {
        if (!component || typeof component !== "object" || Array.isArray(component)) return null;
        const record = component as Record<string, unknown>;
        return [String(record.damage_type ?? event.damage_type), Number(record.amount ?? 0)] as [string, number];
      })
      .filter((row): row is [string, number] => Boolean(row) && Number.isFinite(row[1]) && row[1] > 0);
    if (rows.length > 0) return rows;
  }
  const components = event.payload?.damage_components;
  if (!components || typeof components !== "object" || Array.isArray(components)) {
    return [[event.damage_type, Number(event.amount ?? 0)]];
  }
  const rows = Object.entries(components as Record<string, unknown>)
    .map(([damageType, amount]) => [damageType, Number(amount ?? 0)] as [string, number])
    .filter(([, amount]) => Number.isFinite(amount) && amount > 0);
  return rows.length > 0 ? rows : [[event.damage_type, Number(event.amount ?? 0)]];
}

function hitVfxTargetId(event: Pick<SkillEvent, "target_entity" | "payload">) {
  const payloadTarget = event.payload?.target_entity ?? event.payload?.to_target;
  const value = Number(event.target_entity || payloadTarget);
  return Number.isFinite(value) ? value : undefined;
}

function targetedEnemyForEvent(
  event: Pick<SkillEvent, "target_entity" | "payload">,
  enemyById: Map<number, Pick<Enemy, "x" | "y">>
) {
  const targetId = hitVfxTargetId(event);
  return targetId === undefined ? undefined : enemyById.get(targetId);
}

function projectileIdFromEvent(event: Pick<SkillEvent, "payload">) {
  return typeof event.payload?.projectile_id === "string" ? event.payload.projectile_id : "";
}

function shouldSuppressProjectileFollowup(
  event: Pick<SkillEvent, "target_entity" | "payload">,
  projectedEnemyHp: Map<number, number>,
  liveProjectileHits: Set<string>,
  deadProjectileHits: Set<string>,
  acceptedProjectileDamageTicks: Set<string>
) {
  const projectileId = projectileIdFromEvent(event);
  if (!projectileId) return false;
  if (isProjectileTickFollowup(event)) return !acceptedProjectileDamageTicks.has(projectileFollowupKey(event));
  const hitTargetKey = projectileTargetFollowupKey(event);
  if (hitTargetKey && deadProjectileHits.has(hitTargetKey)) return true;
  if (hitTargetKey && liveProjectileHits.has(hitTargetKey)) return false;
  const targetId = Number(event.target_entity);
  if (Number.isFinite(targetId) && (projectedEnemyHp.get(targetId) ?? 0) <= 0) return true;
  return false;
}

function isProjectileTickFollowup(event: Pick<SkillEvent, "payload">) {
  return event.payload?.tick_time_ms !== undefined || event.payload?.tick_interval_ms !== undefined;
}

  function projectileFollowupKey(event: Pick<SkillEvent, "target_entity" | "payload">) {
    return [
      projectileIdFromEvent(event),
      String(event.target_entity ?? event.payload?.target_entity ?? ""),
      String(event.payload?.tick_time_ms ?? event.payload?.tick_interval_ms ?? "")
    ].join("|");
  }

  function projectileTargetFollowupKey(event: Pick<SkillEvent, "target_entity" | "payload">) {
    const projectileId = projectileIdFromEvent(event);
    const targetId = Number(event.target_entity);
    if (!projectileId || !Number.isFinite(targetId)) return "";
    return `${projectileId}|${targetId}`;
  }

  function damageDisplayKey(event: Pick<SkillEvent, "target_entity" | "skill_instance_id" | "payload">) {
    return [
      event.skill_instance_id,
      String(event.target_entity ?? event.payload?.target_entity ?? ""),
      String(event.payload?.zone_id ?? event.payload?.area_id ?? event.payload?.projectile_id ?? ""),
      String(event.payload?.tick_index ?? ""),
      String(event.payload?.tick_time_ms ?? event.payload?.hit_marker_event_id ?? event.payload?.marker_id ?? "")
    ].join("|");
  }

function anchorHitVfxsToTargets(hitVfxs: HitVfx[], enemies: Enemy[]) {
  if (hitVfxs.length === 0) return hitVfxs;
  const enemyById = new Map(enemies.map((enemy) => [enemy.id, enemy]));
  return hitVfxs.map((vfx) => {
    if (vfx.targetId === undefined) return vfx;
    const target = enemyById.get(vfx.targetId);
    if (!target) return vfx;
    return { ...vfx, x: target.x, y: target.y };
  });
}

function anchorProjectilesToTargets(bolts: FireBolt[], enemies: Enemy[]) {
  if (bolts.length === 0) return bolts;
  const enemyById = new Map(enemies.map((enemy) => [enemy.id, enemy]));
  return bolts.map((bolt) => {
    const shouldAnchor = bolt.projectileVisualMode === "falling_arrow" || usesCanvasProjectileVfx(bolt);
    if (!shouldAnchor || bolt.targetId === undefined) return bolt;
    const target = enemyById.get(bolt.targetId);
    if (!target || target.hp <= 0) return bolt;
    return { ...bolt, targetX: target.x, targetY: target.y };
  });
}

function usesCanvasProjectileVfx(bolt: Pick<FireBolt, "vfxKey" | "visualEffect" | "skillTemplateId">) {
  return projectileVfxKind(bolt.vfxKey) === "burning_shot"
    || projectileVfxKind(bolt.visualEffect) === "burning_shot"
    || projectileVfxKind(bolt.skillTemplateId) === "burning_shot";
}

function usesCanvasHitVfx(vfx: Pick<HitVfx, "vfxKey" | "skillTemplateId">) {
  return projectileVfxKind(vfx.vfxKey) === "burning_shot"
    || projectileVfxKind(vfx.skillTemplateId) === "burning_shot";
}

function projectileBodyVisualScale(
  bolt: Pick<FireBolt, "projectileWidth" | "projectileHeight" | "vfxScale">,
  sheets: ReturnType<typeof projectileVfxSheets>
) {
  const requestedScale = normalizedVfxScale(bolt.vfxScale);
  const targetWidth = Math.max(1, Number(bolt.projectileWidth ?? sheets.projectileVisibleWidth));
  const targetHeight = Math.max(1, Number(bolt.projectileHeight ?? sheets.projectileVisibleHeight));
  const fitScale = Math.min(targetWidth / sheets.projectileVisibleWidth, targetHeight / sheets.projectileVisibleHeight);
  return clamp(Math.min(requestedScale, fitScale), 0.18, 1.15);
}

function projectileImpactVisualScale(
  vfx: Pick<HitVfx, "projectileWidth" | "projectileHeight" | "impactRadius" | "vfxScale">,
  sheets: ReturnType<typeof projectileVfxSheets>
) {
  const requestedScale = normalizedVfxScale(vfx.vfxScale);
  const targetWidth = Math.max(Number(vfx.projectileWidth ?? 0), Number(vfx.impactRadius ?? 0) * 2, 1);
  const targetHeight = Math.max(Number(vfx.projectileHeight ?? 0), Number(vfx.impactRadius ?? 0) * 2, 1);
  const fitScale = Math.min(targetWidth / sheets.impactVisibleWidth, targetHeight / sheets.impactVisibleHeight);
  return clamp(Math.min(requestedScale, fitScale), 0.18, 1.15);
}

function fireBoltExitFadeDuration(bolt: FireBolt) {
  return Math.max(0, bolt.fadeDuration ?? PROJECTILE_BODY_EXIT_FADE_DURATION);
}

function fireBoltAliveRemaining(bolt: FireBolt) {
  return Math.max(0, bolt.ttl - fireBoltExitFadeDuration(bolt));
}

function fireBoltTravel(bolt: FireBolt) {
  return clamp(1 - fireBoltAliveRemaining(bolt) / Math.max(0.001, bolt.duration), 0, 1);
}

function projectileBodyOpacity(bolt: FireBolt) {
  const fadeDuration = fireBoltExitFadeDuration(bolt);
  if (fadeDuration <= 0 || bolt.ttl > fadeDuration) return 1;
  return clamp(bolt.ttl / fadeDuration, 0, 1);
}

function fireBoltWorldPoint(bolt: FireBolt, travel = fireBoltTravel(bolt)) {
  if (bolt.projectileVisualMode === "falling_arrow") {
    return {
      x: bolt.targetX,
      y: bolt.targetY
    };
  }
  return {
    x: bolt.x + (bolt.targetX - bolt.x) * travel,
    y: bolt.y + (bolt.targetY - bolt.y) * travel
  };
}

function ballisticArcVisualLift(bolt: FireBolt, travel = fireBoltTravel(bolt)) {
  if (bolt.projectileVisualMode === "falling_arrow") {
    const arcHeight = Math.max(0, Number(bolt.arcHeight ?? 0));
    return arcHeight * 2.8 * (1 - travel);
  }
  if (bolt.trajectory !== "ballistic") return 0;
  const arcHeight = Math.max(0, Number(bolt.arcHeight ?? 0));
  return arcHeight * 1.75 * 4 * travel * (1 - travel);
}

function ballisticShadowStyle(
  bolt: FireBolt,
  point: { x: number; y: number },
  depthIndex: number,
  opacity: number,
  travel = fireBoltTravel(bolt)
): CSSProperties | null {
  if (bolt.trajectory !== "ballistic") return null;
  const visualPoint = projectBattleWorldToScreen(point.x, point.y);
  const lift = ballisticArcVisualLift(bolt, travel);
  const scale = clamp(1 - lift / 260, 0.42, 0.9);
  return {
    left: visualPoint.x,
    top: visualPoint.y,
    opacity: opacity * clamp(0.5 + lift / 300, 0.5, 0.82),
    transform: `translate(-50%, -50%) scale(${scale})`,
    zIndex: BATTLE_ENTITY_Z_INDEX_BASE + depthIndex - 1,
  };
}

function vfxFrameIndex(sheet: VfxSpriteSheet, ttl: number, duration: number, loop: boolean) {
  const elapsed = Math.max(0, duration - ttl);
  const index = Math.floor(elapsed * sheet.fps);
  return loop ? index % sheet.frameCount : Math.min(sheet.frameCount - 1, index);
}

function vfxFrameIndexInRow(sheet: VfxSpriteSheet, row: number, ttl: number, duration: number) {
  const safeRow = clamp(Math.round(row), 0, Math.max(0, sheet.rows - 1));
  const elapsed = Math.max(0, duration - ttl);
  const column = Math.floor(elapsed * sheet.fps) % sheet.columns;
  return safeRow * sheet.columns + column;
}

function vfxSpriteStyle(sheet: VfxSpriteSheet, frameIndex: number): CSSProperties {
  const column = frameIndex % sheet.columns;
  const row = Math.floor(frameIndex / sheet.columns);
  return {
    width: sheet.frameWidth,
    height: sheet.frameHeight,
    backgroundImage: `url(${sheet.src})`,
    backgroundPosition: `${-column * sheet.frameWidth}px ${-row * sheet.frameHeight}px`
  };
}

function fireBoltVfxLayerStyle(
  worldPoint: { x: number; y: number },
  sheet: VfxSpriteSheet,
  depthIndex: number,
  opacity: number,
  transformSuffix = "",
  fakeZ = FIRE_BOLT_FAKE_Z,
  vfxScale = 1
): CSSProperties {
  const visualPoint = projectBattleWorldToScreen(worldPoint.x, worldPoint.y);
  return {
    left: visualPoint.x,
    top: visualPoint.y - fakeZ,
    width: sheet.frameWidth,
    height: sheet.frameHeight,
    opacity,
    zIndex: BATTLE_ENTITY_Z_INDEX_BASE + depthIndex,
    mixBlendMode: sheet.blendMode,
    transform: `translate(${-sheet.anchorX * 100}%, ${-sheet.anchorY * 100}%)${transformSuffix} scale(${vfxScale})`
  };
}

function FireBoltView({ bolt, depthIndex }: { bolt: FireBolt; depthIndex: number }) {
  const vfxKind = projectileVfxKind(bolt.vfxKey) ?? projectileVfxKind(bolt.visualEffect) ?? projectileVfxKind(bolt.skillTemplateId);
  if (!vfxKind) {
    return <LegacyFireBoltView bolt={bolt} depthIndex={depthIndex} />;
  }
  if (vfxKind === "sparkle") {
    return <SparkleProjectileView bolt={bolt} depthIndex={depthIndex} />;
  }
  if (vfxKind === "burning_shot") {
    return <BurningShotProjectileView bolt={bolt} depthIndex={depthIndex} />;
  }

  const sheets = projectileVfxSheets(vfxKind);
  const bodyVfxScale = projectileBodyVisualScale(bolt, sheets);
  const duration = Math.max(0.001, bolt.duration);
  const aliveRemaining = fireBoltAliveRemaining(bolt);
  const opacity = projectileBodyOpacity(bolt);
  const travel = fireBoltTravel(bolt);
  const point = fireBoltWorldPoint(bolt, travel);
  const visualLift = ballisticArcVisualLift(bolt, travel);
  const shadowStyle = ballisticShadowStyle(bolt, point, depthIndex, opacity, travel);
  const direction = bolt.projectileVisualMode === "falling_arrow"
    ? normalizedWorldDirection({ x: 0, y: 1 })
    : normalizedWorldDirection({
        x: typeof bolt.velocityX === "number" ? bolt.velocityX : bolt.directionX,
        y: typeof bolt.velocityY === "number" ? bolt.velocityY : bolt.directionY
      });
  const angle = worldDirectionToBattleScreenAngle(direction, point);
  const projectileAngle = angle - sheets.artFacingOffset;
  const projectileFrame = vfxFrameIndexInRow(sheets.projectile, sheets.projectileFrameRow, aliveRemaining, duration);
  const muzzleOpacity = vfxKind === "penetrating_shot" ? clamp(1 - travel / 0.18, 0, 1) : 0;

  return (
    <>
      {shadowStyle && (
        <span
          className="ballistic-projectile-shadow"
          style={shadowStyle}
          data-skill-event="projectile_spawn"
          data-projectile-id={bolt.projectileId}
          aria-hidden="true"
        />
      )}
      {sheets.muzzle && muzzleOpacity > 0 && (
        <span
          className={`fire-bolt-vfx ${vfxKind}-vfx penetrating_shot-muzzle-vfx`}
          style={fireBoltVfxLayerStyle(
            { x: bolt.x, y: bolt.y },
            sheets.muzzle,
            depthIndex,
            muzzleOpacity,
            ` rotate(${projectileAngle}rad) scale(${0.92 + (1 - muzzleOpacity) * 0.1})`,
            sheets.projectileFakeZ,
            bodyVfxScale
          )}
          data-skill-event="cast_start"
          data-vfx-key={bolt.vfxKey}
          data-projectile-id={bolt.projectileId}
          data-skill-id={bolt.skillId ?? bolt.skillTemplateId}
          data-spawn-world-x={bolt.x}
          data-spawn-world-y={bolt.y}
          data-direction-world-x={direction.x}
          data-direction-world-y={direction.y}
          aria-hidden="true"
        >
          <span className="vfx-sprite" style={vfxSpriteStyle(sheets.muzzle, vfxFrameIndex(sheets.muzzle, aliveRemaining, duration, false))} />
        </span>
      )}
      {Array.from({ length: sheets.trailLength }, (_, index) => {
        const speedScale = clamp((bolt.projectileSpeed ?? 520) / 760, 0.72, 1.34);
        const backDistance = (index + 1) * (vfxKind === "penetrating_shot" ? 13 * speedScale : 9);
        const trailTravel = clamp(travel - (index + 1) * 0.055, 0, 1);
        const trailPoint = bolt.trajectory === "ballistic"
          ? fireBoltWorldPoint(bolt, trailTravel)
          : {
              x: point.x - direction.x * backDistance,
              y: point.y - direction.y * backDistance
            };
        const trailLift = bolt.trajectory === "ballistic" ? ballisticArcVisualLift(bolt, trailTravel) : 0;
        const frameIndex = Math.min(sheets.trail.frameCount - 1, index);
        const trailOpacity = opacity * (1 - index / sheets.trailLength) * (vfxKind === "penetrating_shot" ? 0.52 : 0.68);
        const scale = Math.max(0.42, (vfxKind === "penetrating_shot" ? 0.86 : 0.92) - index * 0.055);
        return (
          <span
            key={`trail-${bolt.id}-${index}`}
            className={`fire-bolt-vfx ${vfxKind}-vfx fire-bolt-trail-puff ${vfxKind}-trail-vfx`}
            style={fireBoltVfxLayerStyle(trailPoint, sheets.trail, depthIndex, trailOpacity, ` rotate(${angle}rad) scale(${scale})`, sheets.projectileFakeZ + trailLift, bodyVfxScale)}
            aria-hidden="true"
          >
            <span className="vfx-sprite" style={vfxSpriteStyle(sheets.trail, frameIndex)} />
          </span>
        );
      })}
      <span
        className={`fire-bolt-vfx ${vfxKind}-vfx fire-bolt-projectile-vfx ${vfxKind}-projectile-vfx`}
        style={fireBoltVfxLayerStyle(point, sheets.projectile, depthIndex, opacity, ` rotate(${projectileAngle}rad)`, sheets.projectileFakeZ + visualLift, bodyVfxScale)}
        data-skill-template={bolt.skillTemplateId}
        data-skill-event="projectile_spawn"
        data-vfx-key={bolt.vfxKey}
        data-projectile-id={bolt.projectileId}
        data-skill-id={bolt.skillId ?? bolt.skillTemplateId}
        data-projectile-index={bolt.projectileIndex}
        data-projectile-count={bolt.projectileCount}
        data-spawn-world-x={bolt.x}
        data-spawn-world-y={bolt.y}
        data-current-world-x={point.x}
        data-current-world-y={point.y}
        data-direction-world-x={direction.x}
        data-direction-world-y={direction.y}
        data-velocity-world-x={bolt.velocityX ?? direction.x}
        data-velocity-world-y={bolt.velocityY ?? direction.y}
        data-impact-world-x={bolt.targetX}
        data-impact-world-y={bolt.targetY}
        data-fan-angle={bolt.fanAngle}
        data-local-spread-angle={bolt.localSpreadAngle}
        data-pierce-remaining={bolt.pierceRemaining}
        data-projectile-speed={bolt.projectileSpeed}
        data-projectile-trajectory={bolt.trajectory}
        data-projectile-arc-height={bolt.arcHeight}
        data-projectile-visual-mode={bolt.projectileVisualMode}
        data-projectile-visual-lift={visualLift}
        data-projectile-alive-remaining={aliveRemaining}
        data-projectile-fade-duration={fireBoltExitFadeDuration(bolt)}
        data-shape-effects={bolt.shapeEffects.map((effect) => effect.id).join(",")}
        aria-hidden="true"
      >
        <span className="vfx-sprite" style={vfxSpriteStyle(sheets.projectile, projectileFrame)} />
      </span>
    </>
  );
}

function BurningShotProjectileView({ bolt, depthIndex }: { bolt: FireBolt; depthIndex: number }) {
  const duration = Math.max(0.001, bolt.duration);
  const aliveRemaining = fireBoltAliveRemaining(bolt);
  const opacity = projectileBodyOpacity(bolt);
  const travel = fireBoltTravel(bolt);
  const point = fireBoltWorldPoint(bolt, travel);
  const visualPoint = projectBattleWorldToScreen(point.x, point.y);
  const visualLift = ballisticArcVisualLift(bolt, travel);
  const direction = normalizedWorldDirection({
    x: typeof bolt.velocityX === "number" ? bolt.velocityX : bolt.directionX,
    y: typeof bolt.velocityY === "number" ? bolt.velocityY : bolt.directionY
  });
  const angle = worldDirectionToBattleScreenAngle(direction, point);
  const speedScale = clamp((bolt.projectileSpeed ?? 620) / 620, 0.82, 1.36);
  const length = Math.max(34, Number(bolt.projectileWidth ?? 50) * 1.18) * speedScale;
  const height = Math.max(18, Number(bolt.projectileHeight ?? 30) * 0.72);
  const pulseScale = 0.96 + pulse(aliveRemaining * 2.1) * 0.09;
  const transform = `translate(-50%, -50%) rotate(${angle}rad) scale(${pulseScale})`;

  return (
    <span
      className="burning-shot-projectile-vfx"
      style={{
        left: visualPoint.x,
        top: visualPoint.y - visualLift,
        width: length,
        height,
        opacity,
        zIndex: BATTLE_ENTITY_Z_INDEX_BASE + depthIndex,
        transform
      }}
      data-skill-template={bolt.skillTemplateId}
      data-skill-event="projectile_spawn"
      data-vfx-key={bolt.vfxKey}
      data-projectile-id={bolt.projectileId}
      data-skill-id={bolt.skillId ?? bolt.skillTemplateId}
      data-spawn-world-x={bolt.x}
      data-spawn-world-y={bolt.y}
      data-current-world-x={point.x}
      data-current-world-y={point.y}
      data-direction-world-x={direction.x}
      data-direction-world-y={direction.y}
      data-velocity-world-x={bolt.velocityX ?? direction.x}
      data-velocity-world-y={bolt.velocityY ?? direction.y}
      data-impact-world-x={bolt.targetX}
      data-impact-world-y={bolt.targetY}
      data-projectile-speed={bolt.projectileSpeed}
      data-projectile-trajectory={bolt.trajectory}
      data-projectile-alive-remaining={aliveRemaining}
      aria-hidden="true"
    >
      <span className="burning-shot-projectile-vfx__trail burning-shot-projectile-vfx__trail-a" />
      <span className="burning-shot-projectile-vfx__trail burning-shot-projectile-vfx__trail-b" />
      <span className="burning-shot-projectile-vfx__shaft" />
      <span className="burning-shot-projectile-vfx__head" />
      <span className="burning-shot-projectile-vfx__core" />
    </span>
  );
}

function SparkleProjectileView({ bolt, depthIndex }: { bolt: FireBolt; depthIndex: number }) {
  const vfxScale = normalizedVfxScale(bolt.vfxScale);
  const duration = Math.max(0.001, bolt.duration);
  const aliveRemaining = fireBoltAliveRemaining(bolt);
  const opacity = projectileBodyOpacity(bolt);
  const travel = fireBoltTravel(bolt);
  const point = fireBoltWorldPoint(bolt, travel);
  const visualPoint = projectBattleWorldToScreen(point.x, point.y);
  const direction = normalizedWorldDirection({
    x: typeof bolt.velocityX === "number" ? bolt.velocityX : bolt.directionX,
    y: typeof bolt.velocityY === "number" ? bolt.velocityY : bolt.directionY
  });
  const angle = worldDirectionToBattleScreenAngle(direction, point);
  const speedScale = clamp((bolt.projectileSpeed ?? 520) / 520, 0.72, 1.28);
  const size = Math.max(18, Math.max(Number(bolt.projectileWidth ?? 36), Number(bolt.projectileHeight ?? 26)) * 0.86) * vfxScale;
  const style: CSSProperties = {
    left: visualPoint.x,
    top: visualPoint.y - 12,
    width: size,
    height: size,
    opacity,
    zIndex: BATTLE_ENTITY_Z_INDEX_BASE + depthIndex,
    transform: `translate(-50%, -50%) rotate(${angle}rad) scale(${0.9 + Math.sin((duration - aliveRemaining) * 38) * 0.05})`
  };
  return (
    <span
      className="sparkle-projectile-vfx"
      style={style}
      data-skill-template={bolt.skillTemplateId}
      data-skill-event="projectile_spawn"
      data-vfx-key={bolt.vfxKey}
      data-projectile-id={bolt.projectileId}
      data-skill-id={bolt.skillId ?? bolt.skillTemplateId}
      data-current-world-x={point.x}
      data-current-world-y={point.y}
      data-direction-world-x={direction.x}
      data-direction-world-y={direction.y}
      data-projectile-speed={bolt.projectileSpeed}
      aria-hidden="true"
    >
      <span className="sparkle-projectile-vfx__trail" style={{ transform: `translate(-50%, -50%) scaleX(${speedScale})` }} />
      <span className="sparkle-projectile-vfx__arc sparkle-projectile-vfx__arc-a" />
      <span className="sparkle-projectile-vfx__arc sparkle-projectile-vfx__arc-b" />
      <span className="sparkle-projectile-vfx__core" />
    </span>
  );
}

function LegacyFireBoltView({ bolt, depthIndex }: { bolt: FireBolt; depthIndex: number }) {
  const vfxScale = normalizedVfxScale(bolt.vfxScale);
  const startVisual = projectBattleWorldToScreen(bolt.x, bolt.y);
  const targetVisual = projectBattleWorldToScreen(bolt.targetX, bolt.targetY);
  const length = Math.hypot(targetVisual.x - startVisual.x, targetVisual.y - startVisual.y);
  const angle = Math.atan2(targetVisual.y - startVisual.y, targetVisual.x - startVisual.x);
  const behavior = cssToken(bolt.behaviorType || "projectile");
  const tone = visualTone(bolt.vfxKey || bolt.visualEffect || bolt.damageType);
  const duration = Math.max(0.001, bolt.duration);
  const isBurst = ["area", "melee", "orbit", "trap_or_mine"].includes(behavior);
  const isLine = behavior === "chain";
  const opacity = isBurst ? Math.max(0, Math.min(1, bolt.ttl / duration)) : projectileBodyOpacity(bolt);
  const travel = fireBoltTravel(bolt);
  const projectileX = startVisual.x + (targetVisual.x - startVisual.x) * travel;
  const projectileY = startVisual.y + (targetVisual.y - startVisual.y) * travel;
  const groundPoint = fireBoltWorldPoint(bolt, travel);
  const visualLift = ballisticArcVisualLift(bolt, travel);
  const shadowStyle = ballisticShadowStyle(bolt, groundPoint, depthIndex, opacity, travel);
  const burstSize = Math.max(74, 92 * bolt.areaScale) * vfxScale;
  const burstPoint = behavior === "melee" ? startVisual : targetVisual;
  const style: CSSProperties = isBurst
    ? {
        left: burstPoint.x,
        top: burstPoint.y,
        width: burstSize,
        height: burstSize,
        opacity,
        zIndex: BATTLE_ENTITY_Z_INDEX_BASE + depthIndex,
        transform: `translate(-50%, -50%) rotate(${angle}rad)`
      }
    : isLine
      ? {
          left: startVisual.x,
          top: startVisual.y,
          width: length,
          opacity,
          zIndex: BATTLE_ENTITY_Z_INDEX_BASE + depthIndex,
          transform: `rotate(${angle}rad)`
        }
    : {
        left: projectileX,
        top: projectileY - FIRE_BOLT_FAKE_Z - visualLift,
        width: 38,
        height: 24,
        opacity,
        zIndex: BATTLE_ENTITY_Z_INDEX_BASE + depthIndex,
        transform: `translate(-50%, -50%) rotate(${angle}rad) scale(${vfxScale})`
      };
  return (
    <>
      {shadowStyle && (
        <span
          className="ballistic-projectile-shadow"
          style={shadowStyle}
          data-skill-event="projectile_spawn"
          data-projectile-id={bolt.projectileId}
          aria-hidden="true"
        />
      )}
      <div
        className={`fire-bolt skill-vfx skill-vfx-${behavior} skill-vfx-${tone} skill-vfx-${cssToken(bolt.vfxKey || bolt.visualEffect)}`}
        style={style}
        data-skill-template={bolt.skillTemplateId}
        data-skill-event="projectile_spawn"
        data-vfx-key={bolt.vfxKey}
        data-projectile-trajectory={bolt.trajectory}
        data-projectile-arc-height={bolt.arcHeight}
        data-projectile-visual-mode={bolt.projectileVisualMode}
        data-projectile-visual-lift={visualLift}
        data-shape-effects={bolt.shapeEffects.map((effect) => effect.id).join(",")}
      >
        <span className="skill-vfx-core" />
      </div>
    </>
  );
}

function HitVfxView({ vfx, depthIndex }: { vfx: HitVfx; depthIndex: number }) {
  const vfxKind = projectileVfxKind(vfx.vfxKey) ?? projectileVfxKind(vfx.skillTemplateId);
  if (!vfxKind) {
    return <LegacyHitVfxView vfx={vfx} depthIndex={depthIndex} />;
  }
  if (vfxKind === "sparkle") {
    return <SparkleHitVfxView vfx={vfx} depthIndex={depthIndex} />;
  }

  const sheets = projectileVfxSheets(vfxKind);
  const vfxScale = projectileImpactVisualScale(vfx, sheets);
  const duration = Math.max(0.001, vfx.duration);
  const opacity = Math.max(0, vfx.ttl / duration);
  const impactSheet = sheets.impact;
  const sparksSheet = sheets.sparks;
  const vfxDuration = sheets.impactDurationMs / 1000;
  const frameDuration = Math.max(duration, vfxDuration);
  const fakeZ = sheets.impactFakeZ;
  const impactFrame = vfxFrameIndex(impactSheet, vfx.ttl, frameDuration, false);
  const sparksFrame = sparksSheet ? vfxFrameIndex(sparksSheet, vfx.ttl, frameDuration, false) : 0;
  const impactPoint = { x: vfx.x, y: vfx.y };
  const sparksPoint = { x: vfx.x, y: vfx.y };
  const impactScale = vfxKind === "penetrating_shot"
    ? (vfx.impactKind === "projectile_final_impact" ? 1.06 : 0.86)
    : 1 + (1 - opacity) * 0.08;
  const impactStyle = fireBoltVfxLayerStyle(impactPoint, impactSheet, depthIndex, opacity, ` scale(${impactScale})`, fakeZ, vfxScale);
  const sparksStyle = sparksSheet ? fireBoltVfxLayerStyle(sparksPoint, sparksSheet, depthIndex, opacity * 0.86, ` scale(${1 + (1 - opacity) * 0.18})`, fakeZ, vfxScale) : null;
  const showFireBoltNova = hasShapeEffect(vfx.shapeEffects, "fire_bolt_nova");
  const showFireBoltRain = hasShapeEffect(vfx.shapeEffects, "fire_bolt_rain");
  const showFireBoltFork = hasShapeEffect(vfx.shapeEffects, "fire_bolt_fork");
  const shapePoint = projectBattleWorldToScreen(vfx.x, vfx.y);
  const shapeStyle: CSSProperties = {
    left: shapePoint.x,
    top: shapePoint.y - (vfxKind === "penetrating_shot" ? fakeZ : fakeZ * 0.55),
    opacity,
    zIndex: BATTLE_ENTITY_Z_INDEX_BASE + depthIndex + 1,
    transform: `translate(-50%, -50%) scale(${vfxScale})`
  };
  if (vfxKind !== "penetrating_shot") {
    impactStyle.top = Number(impactStyle.top) + fakeZ * 0.45;
    if (sparksStyle) sparksStyle.top = Number(sparksStyle.top) + fakeZ * 0.35;
  }
  return (
    <>
      <span
        className={`fire-bolt-vfx ${vfxKind}-vfx fire-bolt-impact-vfx ${vfxKind}-impact-vfx`}
        style={impactStyle}
        data-skill-event="hit_vfx"
        data-vfx-key={vfx.vfxKey}
        data-projectile-id={vfx.projectileId}
        data-projectile-index={vfx.projectileIndex}
        data-projectile-count={vfx.projectileCount}
        data-target-id={vfx.targetId}
        data-pierce-remaining={vfx.pierceRemaining}
        data-impact-kind={vfx.impactKind}
        data-impact-world-x={vfx.x}
        data-impact-world-y={vfx.y}
        data-shape-effects={vfx.shapeEffects.map((effect) => effect.id).join(",")}
        aria-hidden="true"
      >
        <span className="vfx-sprite" style={vfxSpriteStyle(impactSheet, impactFrame)} />
      </span>
      {sparksSheet && sparksStyle && (
        <span
          className={`fire-bolt-vfx ${vfxKind}-vfx fire-bolt-sparks-vfx ${vfxKind}-sparks-vfx`}
          style={sparksStyle}
          data-skill-event="hit_vfx"
          data-vfx-key={`${vfx.vfxKey}.sparks`}
          data-projectile-id={vfx.projectileId}
          data-projectile-index={vfx.projectileIndex}
          data-projectile-count={vfx.projectileCount}
          data-target-id={vfx.targetId}
          data-impact-world-x={vfx.x}
          data-impact-world-y={vfx.y}
          aria-hidden="true"
        >
          <span className="vfx-sprite" style={vfxSpriteStyle(sparksSheet, sparksFrame)} />
        </span>
      )}
      {showFireBoltFork && (
        <span
          className="hit-fork-sparks-vfx"
          style={shapeStyle}
          data-skill-event="hit_vfx"
          data-vfx-key={`${vfx.vfxKey}.fire_bolt_fork`}
          data-shape-effects={vfx.shapeEffects.map((effect) => effect.id).join(",")}
          aria-hidden="true"
        >
          {Array.from({ length: 7 }, (_, index) => <span key={index} className={`hit-fork-spark hit-fork-spark-${index + 1}`} />)}
        </span>
      )}
      {showFireBoltNova && (
        <span
          className="hit-nova-ring-vfx"
          style={shapeStyle}
          data-skill-event="hit_vfx"
          data-vfx-key={`${vfx.vfxKey}.fire_bolt_nova`}
          data-shape-effects={vfx.shapeEffects.map((effect) => effect.id).join(",")}
          aria-hidden="true"
        />
      )}
      {showFireBoltRain && (
        <span
          className="hit-meteor-rain-vfx"
          style={shapeStyle}
          data-skill-event="hit_vfx"
          data-vfx-key={`${vfx.vfxKey}.fire_bolt_rain`}
          data-shape-effects={vfx.shapeEffects.map((effect) => effect.id).join(",")}
          aria-hidden="true"
        >
          {Array.from({ length: 6 }, (_, index) => <span key={index} className={`hit-meteor-streak hit-meteor-streak-${index + 1}`} />)}
        </span>
      )}
    </>
  );
}

function SparkleHitVfxView({ vfx, depthIndex }: { vfx: HitVfx; depthIndex: number }) {
  const duration = Math.max(0.001, vfx.duration);
  const opacity = Math.max(0, vfx.ttl / duration);
  const vfxScale = normalizedVfxScale(vfx.vfxScale);
  const point = projectBattleWorldToScreen(vfx.x, vfx.y);
  const size = Math.max(28, Number(vfx.impactRadius ?? 20) * 2.1) * vfxScale;
  const style: CSSProperties = {
    left: point.x,
    top: point.y - 12,
    width: size,
    height: size,
    opacity,
    zIndex: BATTLE_ENTITY_Z_INDEX_BASE + depthIndex + 1,
    transform: `translate(-50%, -50%) scale(${1 + (1 - opacity) * 0.35})`
  };
  return (
    <span
      className="sparkle-hit-vfx"
      style={style}
      data-skill-event="hit_vfx"
      data-vfx-key={vfx.vfxKey}
      data-projectile-id={vfx.projectileId}
      aria-hidden="true"
    >
      <span className="sparkle-hit-vfx__ring" />
      <span className="sparkle-hit-vfx__arc sparkle-hit-vfx__arc-a" />
      <span className="sparkle-hit-vfx__arc sparkle-hit-vfx__arc-b" />
    </span>
  );
}

function LegacyHitVfxView({ vfx, depthIndex }: { vfx: HitVfx; depthIndex: number }) {
  const duration = Math.max(0.001, vfx.duration);
  const opacity = Math.max(0, vfx.ttl / duration);
  const scale = (1 + (1 - opacity) * 0.55) * normalizedVfxScale(vfx.vfxScale);
  const visualPoint = projectBattleWorldToScreen(vfx.x, vfx.y);
  const hitTone = visualTone(vfx.damageType || vfx.vfxKey);
  const showFireBoltNova = hasShapeEffect(vfx.shapeEffects, "fire_bolt_nova");
  const showFireBoltRain = hasShapeEffect(vfx.shapeEffects, "fire_bolt_rain");
  const showFireBoltFork = hasShapeEffect(vfx.shapeEffects, "fire_bolt_fork");
  const shapeStyle = {
    left: visualPoint.x,
    top: visualPoint.y,
    opacity,
    zIndex: BATTLE_ENTITY_Z_INDEX_BASE + depthIndex + 1,
    transform: `translate(-50%, -50%) scale(${normalizedVfxScale(vfx.vfxScale)})`
  };
  return (
    <>
      <div
        className={`skill-hit-vfx skill-vfx hit-vfx-tone-${hitTone} skill-vfx-${cssToken(vfx.vfxKey)}`}
        style={{ left: visualPoint.x, top: visualPoint.y, opacity, zIndex: BATTLE_ENTITY_Z_INDEX_BASE + depthIndex, transform: `translate(-50%, -50%) scale(${scale})` }}
        data-skill-event="hit_vfx"
        data-vfx-key={vfx.vfxKey}
        data-damage-type={vfx.damageType}
        data-target-id={vfx.targetId}
        data-shape-effects={vfx.shapeEffects.map((effect) => effect.id).join(",")}
      />
      {showFireBoltFork && (
        <span
          className="hit-fork-sparks-vfx"
          style={shapeStyle}
          data-skill-event="hit_vfx"
          data-vfx-key={`${vfx.vfxKey}.fire_bolt_fork`}
          data-shape-effects={vfx.shapeEffects.map((effect) => effect.id).join(",")}
          aria-hidden="true"
        >
          {Array.from({ length: 7 }, (_, index) => <span key={index} className={`hit-fork-spark hit-fork-spark-${index + 1}`} />)}
        </span>
      )}
      {showFireBoltNova && (
        <span
          className="hit-nova-ring-vfx"
          style={shapeStyle}
          data-skill-event="hit_vfx"
          data-vfx-key={`${vfx.vfxKey}.fire_bolt_nova`}
          data-shape-effects={vfx.shapeEffects.map((effect) => effect.id).join(",")}
          aria-hidden="true"
        />
      )}
      {showFireBoltRain && (
        <span
          className="hit-meteor-rain-vfx"
          style={shapeStyle}
          data-skill-event="hit_vfx"
          data-vfx-key={`${vfx.vfxKey}.fire_bolt_rain`}
          data-shape-effects={vfx.shapeEffects.map((effect) => effect.id).join(",")}
          aria-hidden="true"
        >
          {Array.from({ length: 6 }, (_, index) => <span key={index} className={`hit-meteor-streak hit-meteor-streak-${index + 1}`} />)}
        </span>
      )}
    </>
  );
}

function FrontendSkillGuideLayer({
  skills,
  player,
  enemies,
  guidePackage,
  debugOptions
}: {
  skills: SkillPreview[];
  player: { x: number; y: number };
  enemies: Enemy[];
  guidePackage: SkillPackageData | null;
  debugOptions: SkillEditorDebugOptions;
}) {
  const skill = skills.find((item) => item.skill_package_id && (
    isProjectileSkillTemplate(item.behavior_template)
    || item.behavior_template === "damage_zone"
    || item.behavior_template === "module_chain"
  ));
  if (!skill && !guidePackage) return null;
  const runtimeParams = guidePackage?.behavior.params ?? skill?.runtime_params ?? {};
  const behaviorTemplate = guidePackage?.behavior.template ?? skill?.behavior_template;
  const moduleChainDamageZone = behaviorTemplate === "module_chain"
    ? damageZoneModuleGuideParams(guidePackage, skill)
    : null;
  if (behaviorTemplate === "damage_zone") {
    return (
      <DamageZoneRuntimeGuide
        params={runtimeParams}
        cast={guidePackage?.cast ?? skill?.cast ?? {}}
        hitRadius={guidePackage?.hit.hit_radius ?? skill?.hit?.hit_radius}
        damageType={guidePackage?.classification.damage_type ?? skill?.damage_type ?? "physical"}
        vfxKey={String(runtimeParams.zone_vfx_key ?? guidePackage?.presentation.vfx ?? skill?.presentation_keys?.vfx ?? skill?.visual_effect ?? "")}
        player={player}
        enemies={enemies}
        originPolicy={String(runtimeParams.origin_policy ?? "caster")}
        debugOptions={debugOptions}
      />
    );
  }
  if (moduleChainDamageZone) {
    return (
      <DamageZoneRuntimeGuide
        params={moduleChainDamageZone.params}
        cast={guidePackage?.cast ?? skill?.cast ?? {}}
        hitRadius={guidePackage?.hit.hit_radius ?? skill?.hit?.hit_radius}
        damageType={guidePackage?.classification.damage_type ?? skill?.damage_type ?? "physical"}
        vfxKey={String(moduleChainDamageZone.params.zone_vfx_key ?? moduleChainDamageZone.params.vfx_key ?? guidePackage?.presentation.vfx ?? skill?.presentation_keys?.vfx ?? skill?.visual_effect ?? "")}
        player={player}
        enemies={enemies}
        originPolicy={String(moduleChainDamageZone.params.origin_policy ?? "trigger_position")}
        debugOptions={debugOptions}
      />
    );
  }
  if (!behaviorTemplate || !isProjectileSkillTemplate(behaviorTemplate)) return null;
  const guideVfxKind = projectileVfxKind(skill?.presentation_keys?.projectile_vfx_key ?? skill?.visual_effect ?? guidePackage?.presentation.projectile_vfx_key ?? guidePackage?.presentation.vfx);
  const guideDebugLabel = guideVfxKind === "ice_shards" ? "冰棱" : guideVfxKind === "penetrating_shot" ? "贯穿射击" : "投射物";
  const cast = guidePackage?.cast ?? skill?.cast ?? {};
  const areaMultiplier = skill?.area_multiplier ?? 1;
  const projectileCount = Math.max(1, Math.round(Number(runtimeParams.projectile_count ?? skill?.projectile_count ?? 1)));
  const searchRange = Math.max(1, Number(cast.search_range ?? runtimeParams.max_distance ?? 520) * areaMultiplier);
  const maxDistance = Math.max(1, Number(runtimeParams.max_distance ?? searchRange));
  const collisionRadius = Math.max(1, Number(runtimeParams.collision_radius ?? runtimeParams.projectile_radius ?? 12));
  const spreadAngleDeg = projectileSpreadAngleDeg(behaviorTemplate, runtimeParams as Record<string, unknown>);
  const angleStepDeg = projectileAngleStepDeg(behaviorTemplate, runtimeParams as Record<string, unknown>);
  const source = projectileSpawnWorldPosition(player, runtimeParams as Record<string, unknown>);
    const target = nearestGuideTarget(source, enemies, searchRange, maxDistance);
    const direction = guideDirection(source, target);
    const directions = projectileSpreadDirections(direction, projectileCount, spreadAngleDeg, angleStepDeg);
    const sourceVisual = projectBattleWorldToScreen(source.x, source.y);
    const targetVisual = projectBattleWorldToScreen(target.x, target.y);
    const searchDiameter = searchRange * 2;
    const collisionDiameter = collisionRadius * 2;
    const guideDistance = Math.min(maxDistance, Math.hypot(target.x - source.x, target.y - source.y) || maxDistance);

  return (
    <div className="runtime-skill-guides" aria-label="编辑器运行辅助线" data-projectile-count={projectileCount}>
      {debugOptions.showSearchRange && (
        <div
          className="runtime-skill-search-ring"
          title="技能搜索范围线圈"
          style={{
            left: sourceVisual.x,
            top: sourceVisual.y,
            width: searchDiameter,
            height: searchDiameter
          }}
        />
      )}
      {debugOptions.showTargetPoint && (
        <span className="fire-bolt-debug-point fire-bolt-debug-target" style={{ left: targetVisual.x, top: targetVisual.y }} title="目标点" />
      )}
      {directions.map((projectileDirection, index) => {
        const start = source;
        const end = {
          x: start.x + projectileDirection.x * guideDistance,
          y: start.y + projectileDirection.y * guideDistance
        };
        const collision = {
          x: start.x + (end.x - start.x) * 0.68,
          y: start.y + (end.y - start.y) * 0.68
        };
        const startVisual = projectBattleWorldToScreen(start.x, start.y);
        const endVisual = projectBattleWorldToScreen(end.x, end.y);
        const collisionVisual = projectBattleWorldToScreen(collision.x, collision.y);
        const length = Math.hypot(endVisual.x - startVisual.x, endVisual.y - startVisual.y);
        const angle = Math.atan2(endVisual.y - startVisual.y, endVisual.x - startVisual.x);
        return (
          <div key={`runtime-guide-${index}`}>
            {debugOptions.showDirectionLines && (
              <span
                className="runtime-skill-trajectory-line"
                title="逻辑飞行方向"
                style={{
                  left: startVisual.x,
                  top: startVisual.y,
                  width: length,
                  transform: `rotate(${angle}rad)`
                }}
              />
            )}
            <FireBoltAlignmentDebug
              start={start}
              current={collision}
              hit={end}
              direction={projectileDirection}
              lineLength={length}
              lineAngle={angle}
              projectileIndex={index + 1}
              projectileCount={projectileCount}
              label={guideDebugLabel}
              debugOptions={debugOptions}
            />
            {debugOptions.showCollisionRadius && (
              <>
                <span
                  className="runtime-skill-collision-ring"
                  title={`投射物碰撞范围线圈：半径 ${formatPreviewNumber(collisionRadius)}`}
                  style={{
                    left: collisionVisual.x,
                    top: collisionVisual.y,
                    width: collisionDiameter,
                    height: collisionDiameter
                  }}
                />
                <span
                  className="runtime-projectile-collision-dimension"
                  title={`投射物碰撞范围线圈：半径 ${formatPreviewNumber(collisionRadius)}`}
                  style={{
                    left: collisionVisual.x,
                    top: collisionVisual.y
                  }}
                >
                  碰撞半径 {formatPreviewNumber(collisionRadius)}
                </span>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function damageZoneModuleGuideParams(guidePackage: SkillPackageData | null, skill: SkillPreview | undefined) {
  const packageModule = guidePackage?.modules?.find((module) => module.type === "damage_zone");
  if (packageModule) return packageModule;
  const runtimeModules = Array.isArray(skill?.runtime_params?.modules) ? skill?.runtime_params.modules : [];
  return runtimeModules.find((module): module is { type?: string; params: Record<string, unknown> } => (
    typeof module === "object"
    && module !== null
    && (module as { type?: unknown }).type === "damage_zone"
    && typeof (module as { params?: unknown }).params === "object"
    && (module as { params?: unknown }).params !== null
  ));
}

function DamageZoneRuntimeGuide({
  params,
  cast,
  hitRadius,
  damageType,
  vfxKey,
  player,
  enemies,
  originPolicy,
  debugOptions
}: {
  params: Record<string, unknown>;
  cast: Partial<SkillPackageData["cast"]>;
  hitRadius?: number;
  damageType: string;
  vfxKey: string;
  player: { x: number; y: number };
  enemies: Enemy[];
  originPolicy: string;
  debugOptions: SkillEditorDebugOptions;
}) {
  const shape = String(params.shape ?? "circle") === "rectangle" ? "rectangle" : "circle";
  const searchRange = Math.max(1, Number(cast.search_range ?? hitRadius ?? params.radius ?? params.length ?? 360));
  const target = nearestGuideTarget(player, enemies, searchRange, searchRange);
  const origin = originPolicy === "trigger_position" ? target : player;
  const originVisual = projectBattleWorldToScreen(origin.x, origin.y);
  const targetVisual = projectBattleWorldToScreen(target.x, target.y);
  const facingTarget = originPolicy === "trigger_position"
    ? nearestGuideTarget(origin, enemies, searchRange, searchRange)
    : target;
  const baseDirection = guideDirection(origin, facingTarget);
  const direction = shape === "rectangle"
    ? rotateDirection(baseDirection, Number(params.angle_offset_deg ?? 0))
    : { x: 0, y: 0 };
  const directionEnd = {
    x: origin.x + direction.x * Math.max(48, Math.min(searchRange, Number(params.length ?? hitRadius ?? searchRange))),
    y: origin.y + direction.y * Math.max(48, Math.min(searchRange, Number(params.length ?? hitRadius ?? searchRange)))
  };
  const directionEndVisual = projectBattleWorldToScreen(directionEnd.x, directionEnd.y);
  const guideLineLength = Math.hypot(directionEndVisual.x - originVisual.x, directionEndVisual.y - originVisual.y);
  const guideLineAngle = Math.atan2(directionEndVisual.y - originVisual.y, directionEndVisual.x - originVisual.x);
  const radius = Math.max(1, Number(params.radius ?? hitRadius ?? searchRange));
  const length = Math.max(1, Number(params.length ?? hitRadius ?? searchRange));
  const width = Math.max(1, Number(params.width ?? 96));
  const rectangleAngle = worldDirectionToBattleScreenAngle(direction, origin);
  const guideVisual = damageZoneGuideVisual(shape, vfxKey);
  const rangeLabel = shape === "rectangle"
    ? `damage_zone 矩形范围：长 ${formatPreviewNumber(length)}，宽 ${formatPreviewNumber(width)}`
    : `damage_zone 圆形范围：半径 ${formatPreviewNumber(radius)}`;
  const dimensionLabel = shape === "rectangle"
    ? `长 ${formatPreviewNumber(length)} / 宽 ${formatPreviewNumber(width)}`
    : `半径 ${formatPreviewNumber(radius)}`;
  const dimensionVisual = shape === "rectangle"
    ? projectBattleWorldToScreen(origin.x + direction.x * length * 0.5, origin.y + direction.y * length * 0.5)
    : projectBattleWorldToScreen(origin.x, origin.y - radius);

  return (
    <div className="runtime-skill-guides" aria-label="编辑器 damage_zone 范围辅助线" data-damage-zone-shape={shape}>
      {debugOptions.showSearchRange && (
        <div
          className="runtime-skill-search-ring"
          title="技能搜索范围线圈"
          style={{
            left: originVisual.x,
            top: originVisual.y,
            width: searchRange * 2,
            height: searchRange * 2
          }}
        />
      )}
      {debugOptions.showTargetPoint && (
        <>
          <span className="fire-bolt-debug-point fire-bolt-debug-logic-spawn" style={{ left: originVisual.x, top: originVisual.y }} title="damage_zone 原点" />
          <span className="fire-bolt-debug-point fire-bolt-debug-target" style={{ left: targetVisual.x, top: targetVisual.y }} title="damage_zone 参考目标" />
        </>
      )}
      <div
        className={`runtime-damage-zone-range runtime-damage-zone-geometry-${shape} runtime-damage-zone-guide-${guideVisual} damage-zone-${damageType} runtime-damage-zone-range-${cssToken(vfxKey)}`}
        title={rangeLabel}
        style={{
          left: originVisual.x,
          top: originVisual.y,
          width: shape === "circle" ? radius * 2 : length,
          height: shape === "circle" ? radius * 2 : width,
          transform: shape === "circle"
            ? "translate(-50%, -50%)"
            : `translate(0, -50%) rotate(${rectangleAngle}rad)`,
          ["--whirlwind-angle" as string]: `${Date.now() * 0.36}deg`
        }}
        data-zone-shape={shape}
        data-zone-radius={shape === "circle" ? radius : undefined}
        data-zone-length={shape === "rectangle" ? length : undefined}
        data-zone-width={shape === "rectangle" ? width : undefined}
      />
      <span
        className={`runtime-damage-zone-dimension runtime-damage-zone-dimension-${shape}`}
        style={{ left: dimensionVisual.x, top: dimensionVisual.y }}
        title={rangeLabel}
      >
        {dimensionLabel}
      </span>
      {shape === "rectangle" && debugOptions.showDirectionLines && (
        <span
          className="runtime-skill-trajectory-line runtime-damage-zone-facing-line"
          title="damage_zone 朝向"
          style={{
            left: originVisual.x,
            top: originVisual.y,
            width: guideLineLength,
            transform: `rotate(${guideLineAngle}rad)`
          }}
        />
      )}
    </div>
  );
}

type DamageZoneGuideVisual = "circle" | "rectangle" | "whirlwind";

function damageZoneGuideVisual(shape: "circle" | "rectangle", vfxKey: string): DamageZoneGuideVisual {
  const token = cssToken(vfxKey);
  if (token.includes("whirlwind")) return "whirlwind";
  return shape;
}

function FireBoltAlignmentDebug({
  start,
  current,
  hit,
  direction,
  lineLength,
  lineAngle,
  projectileIndex,
  projectileCount,
  label = "投射物",
  debugOptions
}: {
  start: { x: number; y: number };
  current: { x: number; y: number };
  hit: { x: number; y: number };
  direction: { x: number; y: number };
  lineLength: number;
  lineAngle: number;
  projectileIndex?: number;
  projectileCount?: number;
  label?: string;
  debugOptions: SkillEditorDebugOptions;
}) {
  const { startVisual, currentVisual, hitVisual, facingAngle } = useMemo(() => ({
    startVisual: projectBattleWorldToScreen(start.x, start.y),
    currentVisual: projectBattleWorldToScreen(current.x, current.y),
    hitVisual: projectBattleWorldToScreen(hit.x, hit.y),
    facingAngle: worldDirectionToBattleScreenAngle(direction, start)
  }), [current.x, current.y, direction.x, direction.y, hit.x, hit.y, start.x, start.y]);
  const suffix = projectileIndex && projectileCount ? `（${projectileIndex}/${projectileCount}）` : "";
  return (
    <div className="fire-bolt-alignment-debug" aria-label={`${label}对齐调试层`} data-projectile-index={projectileIndex} data-projectile-count={projectileCount}>
      {debugOptions.showLaunchPoints && (
        <>
          <span className="fire-bolt-debug-point fire-bolt-debug-logic-spawn" style={{ left: startVisual.x, top: startVisual.y }} title={`${label}逻辑发射点${suffix}`} />
          <span className="fire-bolt-debug-point fire-bolt-debug-vfx-spawn" style={{ left: startVisual.x, top: startVisual.y }} title={`${label}特效发射点${suffix}`} />
        </>
      )}
      {debugOptions.showDirectionLines && (
        <>
          <span
            className="fire-bolt-debug-line fire-bolt-debug-direction"
            style={{ left: startVisual.x, top: startVisual.y, width: lineLength, transform: `rotate(${lineAngle}rad)` }}
            title={`${label}逻辑飞行方向${suffix}`}
          />
          <span
            className="fire-bolt-debug-line fire-bolt-debug-facing"
            style={{ left: startVisual.x, top: startVisual.y, width: Math.min(72, lineLength), transform: `rotate(${facingAngle}rad)` }}
            title={`${label}特效朝向${suffix}`}
          />
        </>
      )}
      {debugOptions.showCollisionRadius && <span className="fire-bolt-debug-point fire-bolt-debug-center" style={{ left: currentVisual.x, top: currentVisual.y }} title={`${label}当前中心${suffix}`} />}
      {debugOptions.showTargetPoint && <span className="fire-bolt-debug-point fire-bolt-debug-hit" style={{ left: hitVisual.x, top: hitVisual.y }} title={`${label}命中点${suffix}`} />}
    </div>
  );
}

function PassiveAuraLayer({ effects, x, y }: { effects: Gem[]; x: number; y: number }) {
  const visualPoint = projectBattleWorldToScreen(x, y);
  return (
    <>
      {effects.map((gem, index) => (
        <div
          key={gem.instance_id}
          className={`passive-aura passive-aura-${visualTone(gem.visual_effect || gem.instance_id)}`}
          style={{ left: visualPoint.x, top: visualPoint.y, "--aura-index": index } as CSSProperties}
          data-passive-effect={gem.visual_effect}
          aria-label={gem.name_text}
        />
      ))}
    </>
  );
}

function DamageZoneLayer({ zones }: { zones: DamageZoneVfx[] }) {
  return (
    <>
      {zones.map((zone) => {
        const position = projectBattleWorldToScreen(zone.x, zone.y);
        const progress = clamp(1 - zone.ttl / zone.duration, 0, 1);
        const elapsedMs = Math.max(0, (zone.duration - zone.ttl) * 1000);
        const fillProgress = zone.warning
          ? progress
          : zone.hitAtMs && zone.hitAtMs > 0
            ? clamp(elapsedMs / zone.hitAtMs, 0, 1)
            : 1;
        const angle = zone.shape === "rectangle"
          ? worldDirectionToBattleScreenAngle({ x: zone.directionX || 1, y: zone.directionY || 0 }, { x: zone.x, y: zone.y })
          : 0;
        const vfxScale = normalizedVfxScale(zone.vfxScale);
        return (
          <div
            key={zone.id}
            className={`damage-zone-vfx damage-zone-vfx-${zone.shape} damage-zone-${zone.damageType} damage-zone-vfx-${cssToken(zone.vfxKey)} ${zone.warning ? "damage-zone-vfx-warning" : ""}`}
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
              width: `${(zone.shape === "circle" ? zone.radius * 2 : zone.length) * vfxScale}px`,
              height: `${(zone.shape === "circle" ? zone.radius * 2 : zone.width) * vfxScale}px`,
              transform: zone.shape === "rectangle"
                ? `translate(0, -50%) rotate(${angle}rad)`
                : "translate(-50%, -50%)",
              opacity: zone.warning ? Math.max(0.2, 0.65 - progress * 0.35) : Math.max(0, 1 - progress * 0.75),
              zIndex: BATTLE_ENTITY_Z_INDEX_BASE - 2,
              ["--damage-zone-fill-scale" as string]: fillProgress,
              ["--whirlwind-angle" as string]: `${elapsedMs * 0.72}deg`,
            }}
            data-skill-event={zone.warning ? "damage_zone_prime" : "damage_zone"}
            data-vfx-key={zone.vfxKey}
            data-zone-id={zone.zoneId}
            data-skill-id={zone.skillId}
          />
        );
      })}
    </>
  );
}

function AreaNovaLayer({ novas }: { novas: AreaNova[] }) {
  return (
    <>
      {novas.map((nova) => {
        const visualPoint = projectBattleWorldToScreen(nova.x, nova.y);
        const duration = Math.max(0.001, nova.duration);
        const progress = clamp(1 - nova.ttl / duration, 0, 1);
        const opacity = Math.max(0, nova.ttl / duration);
        const vfxScale = normalizedVfxScale(nova.vfxScale);
        const diameter = Math.max(1, nova.radius * 2 * (0.18 + progress * 0.82) * vfxScale);
        const ringWidth = Math.max(3, nova.ringWidth * (0.45 + progress * 0.55) * vfxScale);
        return (
          <div
            key={nova.id}
            className={`player-nova-vfx player-nova-vfx-${visualTone(nova.vfxKey || nova.damageType)}`}
            style={{
              left: visualPoint.x,
              top: visualPoint.y,
              width: diameter,
              height: diameter,
              opacity,
              borderWidth: ringWidth,
              zIndex: BATTLE_ENTITY_Z_INDEX_BASE - 2,
            }}
            data-skill-event="area_spawn"
            data-vfx-key={nova.vfxKey}
            data-area-id={nova.areaId}
            data-skill-id={nova.skillId}
            data-center-world-x={nova.x}
            data-center-world-y={nova.y}
            data-radius={nova.radius}
            data-ring-width={nova.ringWidth}
            aria-hidden="true"
          />
        );
      })}
    </>
  );
}

function PlayerBuffLayer({ buffs, player }: { buffs: PlayerBuff[]; player: PlayerRuntimeState }) {
  const guard = buffs.find((buff) => buff.buffType === "guard");
  const channelMove = buffs.find((buff) => buff.buffType === "channel_move_speed");
  if (!guard && !channelMove) return null;
  const visualPoint = projectBattleWorldToScreen(player.x, player.y);
  const guardProgress = guard ? clamp(1 - guard.remaining / Math.max(0.001, guard.duration), 0, 1) : 0;
  const guardOpacity = guard ? clamp(0.38 + guard.remaining / Math.max(0.001, guard.duration) * 0.44, 0.25, 0.88) : 0;
  const guardAmountScale = guard ? clamp(guard.remainingAmount / Math.max(1, guard.remainingAmount + 60), 0.55, 1) : 1;
  const guardLabelOpacity = guardProgress < 0.24 ? clamp(1 - guardProgress / 0.24, 0, 1) : 0;
  const channelProgress = channelMove ? clamp(1 - channelMove.remaining / Math.max(0.001, channelMove.duration), 0, 1) : 0;
  return (
    <>
      {channelMove && (
        <div
          className="player-buff-channel-move-speed"
          style={{
            left: visualPoint.x,
            top: visualPoint.y + 12,
            opacity: clamp(0.25 + channelMove.remaining / Math.max(0.001, channelMove.duration) * 0.48, 0.2, 0.72),
            transform: `translate(-50%, -50%) rotate(${channelProgress * 260}deg) scale(${0.92 + Math.sin(channelProgress * Math.PI * 2) * 0.04})`
          }}
          data-skill-event="buff_apply"
          data-buff-type={channelMove.buffType}
          data-vfx-key={channelMove.vfxKey}
          data-move-speed-multiplier={channelMove.moveSpeedMultiplier}
          aria-hidden="true"
        />
      )}
      {guard && (
        <div
          className="player-buff-shield player-buff-shield-guard"
          style={{
            left: visualPoint.x,
            top: visualPoint.y - 24,
            opacity: guardOpacity,
            transform: `translate(-50%, -50%) scale(${guardAmountScale + Math.sin(guardProgress * Math.PI * 4) * 0.035})`
          }}
          data-skill-event="buff_apply"
          data-buff-type={guard.buffType}
          data-vfx-key={guard.vfxKey}
          data-remaining-amount={Math.round(guard.remainingAmount)}
          aria-hidden="true"
        >
          <span className="player-buff-label" style={{ opacity: guardLabelOpacity }}>石肤术</span>
        </div>
      )}
    </>
  );
}

function MeleeArcLayer({ arcs }: { arcs: MeleeArcVfx[] }) {
  return (
    <>
      {arcs.map((arc) => {
        const visualPoint = projectBattleWorldToScreen(arc.x, arc.y);
        const duration = Math.max(0.001, arc.duration);
        const progress = clamp(1 - arc.ttl / duration, 0, 1);
        const opacity = Math.max(0, arc.ttl / duration);
        const vfxScale = normalizedVfxScale(arc.vfxScale);
        const diameter = Math.max(1, arc.radius * 2 * vfxScale);
        const angle = worldDirectionToBattleScreenAngle({ x: arc.directionX, y: arc.directionY }, { x: arc.x, y: arc.y }) * 180 / Math.PI;
        return (
          <div
            key={arc.id}
            className={`melee-arc-vfx melee-arc-vfx-${visualTone(arc.vfxKey || arc.damageType)}`}
            style={{
              left: visualPoint.x,
              top: visualPoint.y,
              width: diameter,
              height: diameter,
              opacity,
              transform: `translate(-50%, -50%) rotate(${angle}deg) scale(${0.82 + progress * 0.18})`,
              ["--arc-angle" as string]: `${arc.arcAngle}deg`,
              zIndex: BATTLE_ENTITY_Z_INDEX_BASE - 1,
            }}
            data-skill-event="melee_arc"
            data-vfx-key={arc.vfxKey}
            data-arc-id={arc.arcId}
            data-skill-id={arc.skillId}
            data-origin-world-x={arc.x}
            data-origin-world-y={arc.y}
            data-arc-angle={arc.arcAngle}
            data-arc-radius={arc.radius}
            aria-hidden="true"
          />
        );
      })}
    </>
  );
}

function ChainSegmentLayer({ segments }: { segments: ChainSegmentVfx[] }) {
  return (
    <>
      {segments.map((segment) => {
        const start = projectBattleWorldToScreen(segment.startX, segment.startY);
        const end = projectBattleWorldToScreen(segment.endX, segment.endY);
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.max(1, Math.hypot(dx, dy));
        const angle = Math.atan2(dy, dx);
        const progress = clamp(1 - segment.ttl / Math.max(0.001, segment.duration), 0, 1);
        const vfxScale = normalizedVfxScale(segment.vfxScale);
        return (
          <div
            key={segment.id}
            className={`chain-segment-vfx chain-segment-vfx-${visualTone(segment.vfxKey || segment.damageType)}`}
            style={{
              left: start.x,
              top: start.y,
              width: length,
              opacity: Math.max(0, 1 - progress * 0.65),
              transform: `rotate(${angle}rad) scaleY(${vfxScale})`,
              zIndex: BATTLE_ENTITY_Z_INDEX_BASE - 1,
            }}
            data-skill-event="chain_segment"
            data-vfx-key={segment.vfxKey}
            data-chain-segment-index={segment.segmentIndex}
            data-segment-id={segment.segmentId}
            data-skill-id={segment.skillId}
            aria-hidden="true"
          />
        );
      })}
    </>
  );
}

function useMountedPassiveVisualEffects(state: AppState | null, fullGemById: Map<string, Gem>) {
  return useMemo(() => {
    if (!state) return [];
    return state.board.cells
      .flat()
      .map((cell) => (cell.gem ? fullGemById.get(cell.gem.instance_id) ?? cell.gem : null))
      .filter((gem): gem is Gem => Boolean(gem && isPassiveGem(gem) && gem.visual_effect));
  }, [state, fullGemById]);
}

function cssToken(value: string | undefined) {
  return (value || "base").replace(/[^a-z0-9_-]/gi, "_").toLowerCase();
}

function visualTone(value: string | undefined) {
  const token = cssToken(value);
  if (token.includes("ice") || token.includes("frost")) return "cold";
  if (token.includes("lightning") || token.includes("thundercloud")) return "lightning";
  if (token.includes("puncture") || token.includes("shot")) return "physical";
  if (token.includes("fungal") || token.includes("spore")) return "spore";
  if (token.includes("vitality")) return "vitality";
  if (token.includes("swift")) return "swift";
  return "fire";
}

function createEnemy(
  id: number,
  playerX: number,
  playerY: number,
  map: BakedBattleMapData | null = null,
  spawnKind: "normal" | "elite" = "normal",
  palette?: EncounterMonsterPalette
): Enemy {
  const baseDamage = spawnKind === "elite" ? 14 : 8;
  const offense = defaultMonsterOffense(baseDamage);
  const maskedSpawn = randomEnemySpawnPoint(map, spawnKind);
  if (maskedSpawn) {
    return {
      id,
      x: maskedSpawn.x,
      y: maskedSpawn.y,
      hp: 32,
      maxHp: 32,
      monsterId: spawnKind === "elite" ? "enemy_brute" : "enemy_imp",
      ...encounterMonsterPaletteFields(palette),
      ...offense,
      aggroLocked: true,
      runtimeTier: "active"
    };
  }

  const angle = Math.random() * Math.PI * 2;
  const radius = 360 + Math.random() * 260;
  const mapWidth = map?.meta.world_width ?? MAP_WIDTH;
  const mapHeight = map?.meta.world_height ?? MAP_HEIGHT;
  return {
    id,
    x: clamp(playerX + Math.cos(angle) * radius, 40, mapWidth - 40),
    y: clamp(playerY + Math.sin(angle) * radius, 40, mapHeight - 40),
    hp: 32,
    maxHp: 32,
    monsterId: spawnKind === "elite" ? "enemy_brute" : "enemy_imp",
    ...encounterMonsterPaletteFields(palette),
    ...offense,
    aggroLocked: true,
    runtimeTier: "active"
  };
}

function runtimeDebugMonsterCornerTestEnabled() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("debugMonsterCorner") === "1";
}

function runtimeDebugMonsterBoundaryTestEnabled() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("debugMonsterBoundary") === "1";
}

function runtimeDebugCornerPlayerSpawn(map: BakedBattleMapData) {
  return nearestRuntimeWalkablePoint(map, {
    x: map.meta.world_width - map.meta.grid_size * 1.5,
    y: map.meta.grid_size * 1.5
  });
}

function createRuntimeDebugCornerEnemies(
  player: { x: number; y: number },
  map: BakedBattleMapData,
  palette?: EncounterMonsterPalette
): Enemy[] {
  const offense = defaultMonsterOffense(8);
  const candidates = map.walkablePoints
    .map((point) => ({ point, distance: distance(point, player) }))
    .filter(({ point, distance: pointDistance }) => (
      pointDistance >= 86
      && pointDistance <= 180
      && enemyHasWalkableLine(map, point, player)
    ))
    .sort((left, right) => left.distance - right.distance);
  const fallbackOffsets = [
    { x: 0, y: 112 },
    { x: -64, y: 112 },
    { x: 64, y: 112 },
    { x: -104, y: 142 },
    { x: 104, y: 142 },
    { x: 0, y: 164 }
  ];
  const monsterIds = [
    "mon_100103",
    "mon_200103",
    "mon_300102",
    "mon_400101",
    "enemy_imp",
    "enemy_brute"
  ];
  return fallbackOffsets.map((offset, index) => {
    const spawn = candidates[index]?.point ?? nearestRuntimeWalkablePoint(map, { x: player.x + offset.x, y: player.y + offset.y });
    return {
      id: 90_000 + index,
      x: spawn.x,
      y: spawn.y,
      hp: 32,
      maxHp: 32,
      monsterId: monsterIds[index % monsterIds.length],
      ...encounterMonsterPaletteFields(palette),
      ...offense,
      aggroLocked: true,
      runtimeTier: "active"
    };
  });
}

function runtimeDebugMonsterCornerSummary(enemies: Enemy[], player: { x: number; y: number }) {
  const alive = enemies.filter((enemy) => enemy.hp > 0);
  const nearest = alive
    .map((enemy) => ({
      monsterId: enemy.monsterId ?? "enemy",
      distance: Math.round(distance(enemy, player)),
      x: Math.round(enemy.x),
      y: Math.round(enemy.y)
    }))
    .sort((left, right) => left.distance - right.distance)
    .slice(0, 6)
    .map((enemy) => `${enemy.monsterId}:${enemy.distance}@${enemy.x},${enemy.y}`);
  return `角落AI调试：玩家 ${Math.round(player.x)},${Math.round(player.y)}；怪物 ${alive.length}，距离 ${nearest.join(" | ") || "无"}`;
}

function runtimeDebugMonsterDistances(enemies: Enemy[], player: { x: number; y: number }) {
  return enemies
    .filter((enemy) => enemy.hp > 0)
    .map((enemy) => Math.round(distance(enemy, player)))
    .sort((left, right) => left - right)
    .slice(0, 6);
}

function runtimeBoundaryMonsterScanLine(summary: RuntimeBoundaryScanSummary) {
  if (summary.status === "running") return "前端全边界AI扫描：运行中...";
  const failureText = summary.failures.length > 0 ? `；失败样本 ${summary.failures.slice(0, 3).join(" | ")}` : "";
  return `前端全边界AI扫描：${summary.passed}/${summary.tested} 通过，失败 ${summary.failed}${failureText}`;
}

function runRuntimeBoundaryMonsterAiScan(map: BakedBattleMapData): RuntimeBoundaryScanSummary {
  const boundaryPoints = map.walkablePoints.filter((point) => runtimeBoundaryPointTouchesWall(map, point.gridX, point.gridY));
  const monsterIds = runtimeBoundaryMonsterIds();
  let passed = 0;
  let failed = 0;
  const failures: string[] = [];
  for (const point of boundaryPoints) {
    const player = { x: point.x, y: point.y };
    const navigation = createEnemyNavigationContext([], player, map);
    const candidates = runtimeBoundaryEnemyCandidates(map, player).slice(0, 12);
    for (const monsterId of monsterIds) {
      const ok = candidates.some((spawn, index) => {
        const enemy: Enemy = {
          id: 810_000 + index,
          x: spawn.x,
          y: spawn.y,
          hp: 32,
          maxHp: 32,
          monsterId,
          ...defaultMonsterOffense(8),
          aggroLocked: true,
          runtimeTier: "active"
        };
        const target = enemyNavigationMoveTarget(enemy, player, map, navigation);
        if (distance(target, player) <= monsterMeleeReachRange(enemy)) {
          const contactEnemy = { ...enemy, x: target.x, y: target.y };
          return enemyHasWalkableLine(map, enemy, target) && canEnemyReachPlayerForMelee(contactEnemy, player, map);
        }
        if ("gridX" in target && "gridY" in target && navigation) {
          const enemyCell = enemyWorldToGrid(map, enemy);
          const currentIndex = enemyGridIndex(navigation, enemyCell.gridX, enemyCell.gridY);
          const targetIndex = enemyGridIndex(navigation, target.gridX, target.gridY);
          return navigation.field[targetIndex] < navigation.field[currentIndex];
        }
        return false;
      });
      if (ok) {
        passed += 1;
      } else {
        failed += 1;
        if (failures.length < 20) failures.push(`${monsterId}@${point.gridX},${point.gridY}`);
      }
    }
  }
  return { status: "done", tested: passed + failed, passed, failed, failures };
}

function runtimeBoundaryMonsterIds() {
  return ["enemy_imp", "enemy_brute", ...Object.keys(MONSTER_GEOMETRY_VISUALS)];
}

function runtimeBoundaryPointTouchesWall(map: BakedBattleMapData, gridX: number, gridY: number) {
  if (!enemyGridWalkable(map, gridX, gridY)) return false;
  return [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
  ].some((direction) => !enemyGridWalkable(map, gridX + direction.x, gridY + direction.y));
}

function runtimeBoundaryEnemyCandidates(map: BakedBattleMapData, player: { x: number; y: number }) {
  return map.walkablePoints
    .map((point) => ({ point, distance: distance(point, player) }))
    .filter(({ distance: pointDistance }) => pointDistance >= map.meta.grid_size * 2 && pointDistance <= map.meta.grid_size * 6)
    .sort((left, right) => left.distance - right.distance)
    .map(({ point }) => point);
}

function nearestRuntimeWalkablePoint(map: BakedBattleMapData, target: { x: number; y: number }) {
  let best = map.walkablePoints[0] ?? { x: target.x, y: target.y, gridX: 0, gridY: 0 };
  let bestDistance = distance(best, target);
  for (const point of map.walkablePoints) {
    const pointDistance = distance(point, target);
    if (pointDistance < bestDistance) {
      best = point;
      bestDistance = pointDistance;
    }
  }
  return best;
}

function enemyReachableMeleeOccupancyTarget(
  map: BakedBattleMapData,
  enemy: Enemy,
  player: { x: number; y: number }
) {
  const baseAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
  const preferredAngle = baseAngle + ((((enemy.id * 137) % 7) - 3) * ENEMY_MELEE_SLOT_ANGLE_STEP);
  const slotDistance = Math.max(
    PLAYER_GEOMETRY_RADIUS + enemyVisualRadius(enemy) - 2,
    monsterAttackRange(enemy) - ENEMY_MELEE_EDGE_CONTACT_TOLERANCE * 0.5
  );
  let best: ({ x: number; y: number; gridX: number; gridY: number; score: number } | null) = null;
  for (let index = 0; index < 16; index += 1) {
    const angle = baseAngle + (index - 7.5) * ENEMY_MELEE_SLOT_ANGLE_STEP;
    const target = {
      x: player.x + Math.cos(angle) * slotDistance,
      y: player.y + Math.sin(angle) * slotDistance
    };
    if (!isMapPointWalkable(map, target.x, target.y)) continue;
    if (!enemyHasWalkableLine(map, enemy, target)) continue;
    const candidateEnemy = { ...enemy, x: target.x, y: target.y };
    if (!canEnemyReachPlayerForMelee(candidateEnemy, player, map)) continue;
    const grid = enemyWorldToGrid(map, target);
    const enemyDistance = distance(enemy, target);
    const angleDelta = Math.abs(Math.atan2(Math.sin(angle - preferredAngle), Math.cos(angle - preferredAngle)));
    const score = enemyDistance + angleDelta * 18 + enemyGridWallCost(map, grid.gridX, grid.gridY) * map.meta.grid_size * 0.2;
    if (!best || score < best.score) best = { ...target, ...grid, score };
  }
  return best;
}

function defaultMonsterOffense(baseDamage: number): Pick<Enemy, "baseDamage" | "damageType" | "hitKind" | "attackRange" | "attackCadenceMs" | "offenseModifiers" | "damageMultiplier"> {
  return {
    baseDamage,
    damageType: "physical",
    hitKind: "attack",
    attackRange: ENEMY_MELEE_ATTACK_DISTANCE,
    attackCadenceMs: ENEMY_ATTACK_VISUAL_DURATION_MS + ENEMY_ATTACK_VISUAL_COOLDOWN_MS,
    damageMultiplier: 1,
    offenseModifiers: {
      damage_add_percent: 0,
      physical_damage_add_percent: 0,
      hit_damage_add_percent: 0,
      attack_damage_add_percent: 0,
      melee_damage_add_percent: 0,
      damage_final_percent: 0,
      hit_damage_final_percent: 0,
      resistance_penetration_percent: 0
    }
  };
}

function randomEnemySpawnPoint(map: BakedBattleMapData | null, spawnKind: "normal" | "elite") {
  if (!map) return null;
  const preferred = spawnKind === "elite" ? map.eliteSpawnPoints : map.enemySpawnPoints;
  const pool = preferred.length > 0 ? preferred : map.enemySpawnPoints.length > 0 ? map.enemySpawnPoints : map.walkablePoints;
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function unitMovementState(moving: boolean, baseMoveSpeed: number, currentMoveSpeed: number): UnitAnimationState {
  void baseMoveSpeed;
  void currentMoveSpeed;
  if (!moving) return "idle";
  return "walk";
}

function createSkillTestDummies(firstId: number, playerX: number, playerY: number, palette?: EncounterMonsterPalette): Enemy[] {
  return SKILL_TEST_DUMMY_OFFSETS.map((offset, index) => ({
    id: firstId + index,
    x: clamp(playerX + offset.x, 40, MAP_WIDTH - 40),
    y: clamp(playerY + offset.y, 40, MAP_HEIGHT - 40),
    hp: SKILL_TEST_DUMMY_MAX_HP,
    maxHp: SKILL_TEST_DUMMY_MAX_HP,
    monsterId: "enemy_imp",
    ...encounterMonsterPaletteFields(palette),
    ...defaultMonsterOffense(0),
    runtimeTier: "active"
  }));
}

function applyEncounterMonsterPalette(enemies: Enemy[], palette: EncounterMonsterPalette) {
  return enemies.map((enemy) => ({
    ...enemy,
    ...encounterMonsterPaletteFields(palette)
  }));
}

function encounterMonsterPaletteFields(palette: EncounterMonsterPalette | undefined) {
  return palette ? {
    visualPrimaryColor: palette.primary
  } : {};
}

function createEncounterMonsterPalette(): EncounterMonsterPalette {
  return ENCOUNTER_MONSTER_PALETTES[Math.floor(Math.random() * ENCOUNTER_MONSTER_PALETTES.length)] ?? ENCOUNTER_MONSTER_PALETTES[0];
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function advanceRuntimeVisuals<T extends { ttl: number }>(items: T[], dt: number, maxCount: number) {
  return capRuntimeVisualBudget(
    items.map((item) => ({ ...item, ttl: item.ttl - dt })).filter((item) => item.ttl > 0),
    maxCount
  );
}

function capRuntimeVisualBudget<T>(items: T[], maxCount: number) {
  if (items.length <= maxCount) return items;
  return items.slice(items.length - maxCount);
}
