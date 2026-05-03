import { CSSProperties, DragEvent, MouseEvent, ReactNode, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { compareDimetricDepth, dimetricDepth } from "./isoDepth";
import React from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { ISO_TILE_H, ISO_TILE_W, unprojectScreenToWorld } from "./isoProjection";
import { BAKED_BATTLE_MAPS, bakedMapAssetById, DEFAULT_BAKED_BATTLE_MAP_ID } from "./bakedMapAssets";
import { BakedBattleMapData, isMapPointWalkable, loadBakedBattleMap, MapPoint, resolveWalkableMove } from "./bakedMapLoader";
import mapSpawnV1Config from "../configs/monsters/map_spawn_v1.json";
import map001Document from "../map/map_001.json";
import { generateProceduralMonsterSpawns } from "./mapSpawnRuntime";
import type { MapSpawnV1Config, ProceduralSpawnDebugSummary, ProceduralSpawnRarity, ProceduralZoneType } from "./mapSpawnRuntime";
import { getAnimationFrame, resolveDirection, resolveUnitAnimation, UnitAnimationContext, UnitAnimationFrame } from "./unitAnimation";
import { BattleGeometryCanvas } from "./BattleGeometryCanvas";
import type { BattleGeometrySnapshot } from "./battleGeometryRenderer";
import { fallbackUnitVisualForMonster } from "./monsterGeometryVisuals";
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

type Gem = {
  instance_id: string;
  item_kind?: "gem" | "ordinary";
  name_text: string;
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
  shape_effects: { id: string; text: string }[];
  final_damage: number;
  non_crit_damage?: number;
  increase_pool?: number;
  final_pool?: number;
  crit_chance?: number;
  crit_multiplier?: number;
  expected_hit_damage?: number;
  uses_per_second?: number;
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
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  const path = window.location.pathname.replace(/\/+$/, "");
  return path === "/skill-editor" || params.get("skill_editor") === "1" || params.get("view") === "skill_editor";
}

function initialSkillEditorMode() {
  return initialSkillEditorOpen();
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
    | "chain_segment"
    | "area_spawn"
    | "melee_arc"
    | "damage_zone_prime"
    | "damage_zone"
    | "orbit_spawn"
    | "orbit_tick"
    | "delayed_area_prime"
    | "delayed_area_explode"
    | "damage"
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

type AppState = {
  inventory: Gem[];
  board: {
    cells: Cell[][];
    prompts: string[];
    highlights: Record<string, { instance_ids: string[]; relation_text: string }[]>;
  };
  skill_preview: SkillPreview[];
  skill_error: string | null;
  drops: { drop_id: string; name_text: string; rarity_text: string; picked_up: boolean; status_text: string }[];
  logs: string[];
  player_stats?: Record<string, PlayerStatView>;
  character_panel?: CharacterPanelView;
  skill_editor?: SkillEditorState;
  ui_text?: {
    only_gems_on_board?: string;
  };
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

type Enemy = {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  lastDamagedAt?: number;
  monsterId?: string;
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
  nextThinkAt?: number;
  engagementTier?: EnemyEngagementTier;
  engagementRing?: number;
  engagementSlot?: number;
  velocityX?: number;
  velocityY?: number;
  navTargetGridX?: number;
  navTargetGridY?: number;
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
  ttl: number;
  duration: number;
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
  impactRadius?: number;
  ttl: number;
  duration: number;
  fadeDuration: number;
  skillTemplateId: string;
  behaviorType: string;
  damageType: string;
  visualEffect: string;
  vfxKey: string;
  shapeEffects: { id: string; text: string }[];
  areaScale: number;
  vfxScale?: number;
};

type HitVfx = {
  id: number;
  x: number;
  y: number;
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
  damageType: string;
  vfxKey: string;
  zoneId?: string;
  skillId?: string;
  warning?: boolean;
  vfxScale?: number;
};

type ScheduledSkillEvent = {
  event: SkillEvent;
  remaining: number;
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

type ProjectileDamageTarget = {
  enemy: Enemy;
  projectileIndex: number;
};

type Tooltip = {
  gem: Gem;
  left: number;
  top: number;
  transform: string;
};

type FloatingOrigin =
  | { kind: "board"; row: number; column: number }
  | { kind: "bag"; slotIndex: number; instanceId: string };

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
  nextAttackReadyAtMs?: number;
};

type BattleRenderEntity =
  | { kind: "enemy"; id: number; x: number; y: number; hp: number; maxHp: number; lastDamagedAt?: number; monsterId?: string; runtimeTier?: EnemyRuntimeTier; playerDistance: number; renderScale: number }
  | { kind: "player"; id: "player"; x: number; y: number; hp: number; maxHp: number; renderScale: number };

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
const DIMETRIC_GROUND_EFFECT_Y_SCALE = ISO_TILE_H / ISO_TILE_W;
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
const MAX_RUNTIME_PROJECTILE_VISUALS = 80;
const MAX_RUNTIME_HIT_VFX = 80;
const MAX_RUNTIME_FLOATING_TEXT = 60;
const MAX_RUNTIME_AREA_VFX = 80;
const MAX_SKILL_EDITOR_TIMELINE_ROWS = 40;
const ENEMY_SPATIAL_CHUNK_SIZE = 256;
const ENEMY_AWARE_RANGE = 900;
const ENEMY_ACTIVE_RANGE = 560;
const ENEMY_VISIBLE_RANGE = 760;
const ENEMY_CAMERA_VISIBLE_RANGE = 1180;
const ENEMY_LOW_FREQUENCY_THINK_INTERVAL = 0.18;
const MAX_VISIBLE_ENEMY_DOM_NODES = 180;
const MONSTER_CHASE_SPEED_MULTIPLIER = 2;
const ENEMY_MELEE_ATTACK_DISTANCE = 96;
const ENEMY_ATTACK_VISUAL_DURATION_MS = 640;
const ENEMY_ATTACK_VISUAL_COOLDOWN_MS = 520;
const ENEMY_WALK_VISUAL_DEADZONE = 0.35;
const ENEMY_HEALTH_VISIBLE_SECONDS = 5;
const ENEMY_COLLISION_RADIUS = 25;
const ENEMY_BOSS_COLLISION_RADIUS = 40;
const ENEMY_COLLISION_MAX_PUSH = 2.2;
const ENEMY_PLAYER_CONTACT_HOLD_RADIUS = 90;
const ENEMY_PLAYER_CONTACT_SLOW_RADIUS = 145;
const ENEMY_PLAYER_BODY_SOFT_RADIUS = 84;
const ENEMY_PLAYER_BODY_REPEL_FORCE = 2.25;
const ENEMY_SWARM_INNER_RING_RADIUS = 88;
const ENEMY_SWARM_RING_SPACING = 30;
const ENEMY_SWARM_RING_COUNT = 4;
const ENEMY_SWARM_SEPARATION_RATIO = 1.04;
const ENEMY_SWARM_SEPARATION_FORCE = 1.2;
const ENEMY_SWARM_TANGENT_FORCE = 0.26;
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
const UNIT_RENDER_SCALE = 0.7;
const FLOATING_GEM_OFFSET = { x: 18, y: 18 };
const INVENTORY_SLOT_COUNT = 60;
const INVENTORY_COLUMNS = 12;
const TOOLTIP_WIDTH = 410;
const TOOLTIP_SCREEN_PADDING = 8;

async function requestState(path: string, body?: unknown): Promise<AppState> {
  const response = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "操作失败。");
  return payload;
}

async function requestSkillEditorSave(skillId: string, draft: SkillPackageData): Promise<SkillEditorSaveResponse> {
  const response = await fetch("/api/skill-editor/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skill_id: skillId, package: draft })
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "保存失败。");
  return payload;
}

async function requestSkillEditorModifierPreview(payload: {
  skill_id: string;
  modifier_ids: string[];
  relation: string;
  source_power: number;
  target_power: number;
  conduit_power: number;
}): Promise<SkillEditorModifierPreviewResponse> {
  const response = await fetch("/api/skill-editor/modifier-preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "测试栈计算失败。");
  return result;
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
  const response = await fetch("/api/skill-editor/test-arena/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "技能测试场运行失败。");
  return result;
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
    },
    ...BAKED_BATTLE_MAPS.map((map) => ({
      id: map.id,
      displayName: map.meta.display_name,
      biome: map.meta.biome,
      worldWidth: map.meta.world_width,
      worldHeight: map.meta.world_height
    }))
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
    currentEnergyShield: 0,
    maxEnergyShield: 0
  });
  const [enemies, setEnemies] = useState<Enemy[]>(() => skillEditorMode ? createSkillTestDummies(1, MAP_WIDTH / 2, MAP_HEIGHT / 2) : []);
  const [texts, setTexts] = useState<FloatingText[]>([]);
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
  const [hoveredGemId, setHoveredGemId] = useState<string | null>(null);
  const [hoveredBoardCell, setHoveredBoardCell] = useState<string | null>(null);
  const [hoveredBagSlot, setHoveredBagSlot] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [floatingGem, setFloatingGem] = useState<FloatingGem | null>(null);
  const [placementPrompt, setPlacementPrompt] = useState<PlacementPrompt | null>(null);
  const [showPersistentSupportLines, setShowPersistentSupportLines] = useState(true);
  const [inventorySlots, setInventorySlots] = useState<(string | null)[]>(() => Array(INVENTORY_SLOT_COUNT).fill(null));
  const keys = useRef(new Set<string>());
  const floatingGemRef = useRef<FloatingGem | null>(null);
  const lastFrame = useRef<number | null>(null);
  const nextEnemyId = useRef(skillEditorMode ? SKILL_TEST_DUMMY_OFFSETS.length + 1 : 1);
  const nextTextId = useRef(1);
  const nextBoltId = useRef(1);
  const nextAreaNovaId = useRef(1);
  const nextMeleeArcId = useRef(1);
  const nextChainSegmentId = useRef(1);
  const nextDamageZoneId = useRef(1);
  const nextHitVfxId = useRef(1);
  const nextPromptId = useRef(1);
  const attackTimers = useRef<Record<string, number>>({});
  const scheduledSkillEvents = useRef<ScheduledSkillEvent[]>([]);
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
  const spawnTimer = useRef(0);
  const playerVisual = useRef<UnitVisualRuntime>({ direction: "down", movementVector: { x: 0, y: 0 } });
  const enemyVisuals = useRef(new Map<number, EnemyVisualRuntime>());
  const triggeredEncounterSourceIds = useRef<Set<string>>(new Set());
  const playerStateRef = useRef(player);
  const enemiesStateRef = useRef(enemies);
  const elapsedRef = useRef(0);
  const elapsedLastUiSync = useRef(0);

  function setRuntimePlayer(updater: (current: typeof player) => typeof player) {
    const next = updater(playerStateRef.current);
    playerStateRef.current = next;
    setPlayer(next);
  }

  useEffect(() => {
    requestState("/api/state")
      .then((nextState) => {
        setState(nextState);
        setNotice("准备就绪。按 C 打开背包。");
      })
      .catch((error: Error) => setNotice(error.message));
  }, []);

  useEffect(() => {
    if (!state) return;
    setInventorySlots((current) => reconcileInventorySlots(current, state, floatingGemRef.current?.gem.instance_id ?? null));
  }, [state, floatingGem?.gem.instance_id]);

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
          setEnemies(createSkillTestDummies(1, map.playerSpawn.x, map.playerSpawn.y));
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

    async function onMouseDown(event: globalThis.MouseEvent) {
      const current = floatingGemRef.current;
      if (!current) return;
      if (event.button !== 0) return;
      event.preventDefault();
      const element = document.elementFromPoint(event.clientX, event.clientY);
      const target = resolveDropTarget(element);
      const result = await placeFloatingItem(current, target, event);
      if (result.type === "place") {
        clearFloatingGem();
      } else if (result.type === "swap") {
        setFloatingItem(result.nextFloatingItem, result.origin, event.clientX, event.clientY, current.offsetX, current.offsetY);
      }
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, [state, inventorySlots]);

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
      const dt = Math.min(0.05, frameMs / 1000);
      lastFrame.current = now;
      const logicStart = performance.now();
      const consumedEvents = stepGame(dt);
      const logicMs = performance.now() - logicStart;
      recordRuntimePerf(frameMs, logicMs, consumedEvents, now);
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, activeSkills, state?.player_stats?.move_speed?.value, battleMap, authoredAggroSources, authoredSpawnPlanActive, skillEditorMode]);

  function stepGame(dt: number) {
    elapsedRef.current += dt;
    if (elapsedRef.current - elapsedLastUiSync.current >= 0.1) {
      elapsedLastUiSync.current = elapsedRef.current;
      setElapsed(elapsedRef.current);
    }
    const playerSpeed = PLAYER_SPEED * statNumber(state?.player_stats?.move_speed, 1);
    const playerMoveVector = playerInputVector(keys.current);
    const currentPlayer = playerStateRef.current;
    syncPlayerVisual(playerMoveVector);
    const dx = playerMoveVector.x;
    const dy = playerMoveVector.y;
    const length = Math.hypot(dx, dy) || 1;
    const mapWidth = battleMap?.meta.world_width ?? MAP_WIDTH;
    const mapHeight = battleMap?.meta.world_height ?? MAP_HEIGHT;
    const nextPlayerPosition = resolveWalkableMove(battleMap, currentPlayer, {
      x: clamp(currentPlayer.x + (dx / length) * playerSpeed * dt, 40, mapWidth - 40),
      y: clamp(currentPlayer.y + (dy / length) * playerSpeed * dt, 40, mapHeight - 40)
    });
    const nextPlayer = {
      ...currentPlayer,
      x: nextPlayerPosition.x,
      y: nextPlayerPosition.y
    };
    setRuntimePlayer(() => nextPlayer);

    let currentVisualEnemies = enemiesStateRef.current;
    if (!skillEditorMode) {
      spawnTimer.current -= dt;
      let spawnEnemy = false;
      if (!authoredSpawnPlanActive && spawnTimer.current <= 0) {
        spawnTimer.current = Math.max(0.45, 1.2 - elapsedRef.current / 80);
        spawnEnemy = true;
      }

      const attackLockedEnemyIds = currentEnemyAttackLockedIds(elapsedRef.current * 1000, enemiesStateRef.current, nextPlayer);
      const movingEnemies = updateRuntimeEnemies(enemiesStateRef.current, nextPlayer, battleMap, dt, elapsedRef.current, authoredSpawnPlanActive, authoredAggroSources, triggeredEncounterSourceIds.current, attackLockedEnemyIds);
      currentVisualEnemies = spawnEnemy ? [...movingEnemies, createEnemy(nextEnemyId.current++, nextPlayer.x, nextPlayer.y, battleMap)] : movingEnemies;
      enemiesStateRef.current = currentVisualEnemies;
      setEnemies(currentVisualEnemies);
    }
    syncEnemyVisuals(selectRenderableEnemies(currentVisualEnemies, nextPlayer), nextPlayer, elapsedRef.current * 1000);

    if (activeSkills.length > 0) {
      const activeIds = new Set(activeSkills.map((skill) => skill.active_gem_instance_id));
      for (const timerId of Object.keys(attackTimers.current)) {
        if (!activeIds.has(timerId)) delete attackTimers.current[timerId];
      }
      for (const skill of activeSkills) {
        const timerId = skill.active_gem_instance_id;
        attackTimers.current[timerId] = (attackTimers.current[timerId] ?? 0) - dt;
        if (attackTimers.current[timerId] <= 0) {
          attackTimers.current[timerId] = Math.max(0.16, skill.final_cooldown_ms / 1000);
          setEnemies((current) => {
            const next = hitEnemies(current, skill);
            enemiesStateRef.current = next;
            return next;
          });
        }
      }
    }

    setTexts((current) => advanceRuntimeVisuals(current, dt, MAX_RUNTIME_FLOATING_TEXT));
    setBolts((current) => advanceRuntimeVisuals(current, dt, MAX_RUNTIME_PROJECTILE_VISUALS));
    setAreaNovas((current) => advanceRuntimeVisuals(current, dt, MAX_RUNTIME_AREA_VFX));
    setMeleeArcs((current) => advanceRuntimeVisuals(current, dt, MAX_RUNTIME_AREA_VFX));
    setChainSegments((current) => advanceRuntimeVisuals(current, dt, MAX_RUNTIME_AREA_VFX));
    setDamageZones((current) => advanceRuntimeVisuals(current, dt, MAX_RUNTIME_AREA_VFX));
    setHitVfxs((current) => advanceRuntimeVisuals(current, dt, MAX_RUNTIME_HIT_VFX));
    return consumeScheduledSkillEvents(dt);
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
      const canStartAttack = canEnemyStartAttackVisual(enemy, currentPlayer, previous, nowMs);
      const movementVector = Math.hypot(worldMovementVector.x, worldMovementVector.y) > ENEMY_WALK_VISUAL_DEADZONE
        ? chaseVector
        : { x: 0, y: 0 };
      const direction = resolveAnimationDirection(chaseVector, previous?.direction ?? "down");
      if (canStartAttack) applyMonsterAttackHit(enemy);
      enemyVisuals.current.set(enemy.id, {
        direction,
        movementVector,
        attackStartedAtMs: canStartAttack ? nowMs : previous?.attackStartedAtMs,
        attackUntilMs: canStartAttack ? nowMs + ENEMY_ATTACK_VISUAL_DURATION_MS : previous?.attackUntilMs,
        nextAttackReadyAtMs: canStartAttack ? nowMs + monsterAttackCadenceMs(enemy) : previous?.nextAttackReadyAtMs,
        lastX: enemy.x,
        lastY: enemy.y
      });
    }
  }

  function applyMonsterAttackHit(enemy: Enemy) {
    const currentPlayer = playerStateRef.current;
    if (currentPlayer.hp <= 0) return;
    const hit = resolveMonsterHitAgainstPlayer(enemy, currentPlayer, state?.player_stats);
    if (hit.totalDamage <= 0) return;
    const defeated = !skillEditorMode && hit.nextPlayer.hp <= 0;
    setRuntimePlayer(() => hit.nextPlayer);
    if (defeated) {
      setPlaying(false);
      setBagOpen(false);
      setGameFailureOpen(true);
      setNotice("游戏失败。玩家生命已归零。");
    }
    const damageText = Math.max(1, Math.round(hit.totalDamage)).toString();
    setTexts((items) => capRuntimeVisualBudget([
      ...items,
      {
        id: nextTextId.current++,
        x: currentPlayer.x,
        y: currentPlayer.y - 42,
        text: `-${damageText}`,
        ttl: 0.8,
        duration: 0.8
      }
    ], MAX_RUNTIME_FLOATING_TEXT));
    setCombatLogs((logs) => [
      ...(defeated ? ["玩家生命归零，游戏失败。"] : []),
      `怪物攻击造成 ${formatPreviewNumber(hit.totalDamage)} 点${damageTypeText(hit.damageType)}伤害。`,
      ...logs
    ].slice(0, 8));
  }

  function currentEnemyAttackLockedIds(nowMs: number, currentEnemies: Enemy[] = [], currentPlayer?: { x: number; y: number }) {
    const lockedIds = new Set<number>();
    for (const [enemyId, visual] of enemyVisuals.current) {
      if (visual.attackUntilMs !== undefined && nowMs < visual.attackUntilMs) lockedIds.add(enemyId);
    }
    if (currentPlayer) {
      for (const enemy of currentEnemies) {
        if (lockedIds.has(enemy.id)) continue;
        if (canEnemyStartAttackVisual(enemy, currentPlayer, enemyVisuals.current.get(enemy.id), nowMs)) lockedIds.add(enemy.id);
      }
    }
    return lockedIds;
  }

  function hitEnemies(current: Enemy[], skill: SkillPreview) {
    if (usesSkillEventPipeline(skill)) return hitEnemiesWithSkillEvents(current, skill);
    if (current.length === 0) return current;
    const caster = playerStateRef.current;
    const range = 520 * skill.area_multiplier;
    const vfxScale = skillPreviewVfxScale(skill);
    const targets = [...current]
      .sort((a, b) => distance(a, caster) - distance(b, caster))
      .filter((enemy) => distance(enemy, caster) <= range)
      .slice(0, Math.max(1, skill.projectile_count));
    if (targets.length === 0) return current;

    const targetIds = new Set(targets.map((target) => target.id));
    const nextTexts: FloatingText[] = [];
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
        ttl: 0.42 + PROJECTILE_BODY_EXIT_FADE_DURATION,
        duration: 0.42,
        fadeDuration: PROJECTILE_BODY_EXIT_FADE_DURATION,
        skillTemplateId: skill.skill_template_id,
        behaviorType: skill.behavior_type,
        damageType: skill.damage_type,
        visualEffect: skill.visual_effect,
        vfxKey: skill.visual_effect,
        shapeEffects: skill.shape_effects ?? [],
        areaScale: skill.area_multiplier,
        vfxScale
      };
    });
    const legacyProjectileVfxKind = projectileVfxKind(skill.visual_effect) ?? projectileVfxKind(skill.skill_template_id);
    const survivors = current
      .map((enemy) => {
        if (!targetIds.has(enemy.id)) return enemy;
        const hp = enemy.hp - skill.final_damage;
        nextTexts.push({ id: nextTextId.current++, x: enemy.x, y: enemy.y - 28, text: Math.round(skill.final_damage).toString(), ttl: 0.8, duration: 0.8 });
        return { ...enemy, hp, lastDamagedAt: elapsedRef.current };
      })
      .filter((enemy) => enemy.hp > 0);
    const killed = current.length - survivors.length;
    setBolts((items) => [...items, ...nextBolts]);
    if (killed > 0) {
      setKills((value) => value + killed);
      setCombatLogs((logs) => [`${skill.name_text} 击杀 ${killed} 个怪物。`, ...logs].slice(0, 8));
    } else {
      setCombatLogs((logs) => [`${skill.name_text} 自动释放。`, ...logs].slice(0, 8));
    }
    setTexts((items) => [...items, ...nextTexts]);
    if (legacyProjectileVfxKind) {
      window.setTimeout(() => {
        setHitVfxs((items) => [
          ...items,
          ...targets.map((target) => ({
            id: nextHitVfxId.current++,
            x: target.x,
            y: target.y,
            ttl: legacyProjectileVfxKind === "ice_shards" ? ICE_SHARDS_IMPACT_DURATION_MS / 1000 : FIRE_BOLT_IMPACT_DURATION_MS / 1000,
            duration: legacyProjectileVfxKind === "ice_shards" ? ICE_SHARDS_IMPACT_DURATION_MS / 1000 : FIRE_BOLT_IMPACT_DURATION_MS / 1000,
            damageType: skill.damage_type,
            vfxKey: skill.visual_effect,
            skillTemplateId: skill.skill_template_id,
            projectileWidth: Number(skill.runtime_params?.projectile_width ?? 38),
            projectileHeight: Number(skill.runtime_params?.projectile_height ?? 24),
            impactRadius: Number(skill.runtime_params?.impact_radius ?? skill.hit?.hit_radius ?? 18),
            vfxScale
          }))
        ]);
      }, Math.round(Math.max(...nextBolts.map((bolt) => bolt.duration), 0.12) * 1000));
    }
    return survivors;
  }

  function hitEnemiesWithSkillEvents(current: Enemy[], skill: SkillPreview) {
    if (current.length === 0) return current;
    const caster = playerStateRef.current;
    if (skill.behavior_template === "module_chain") {
      if (!hasLiveEnemyInCastRange(current, skill, caster)) return current;
      const skillEvents = createModuleChainSkillEvents(skill, current);
      if (skillEvents.length === 0) return current;
      consumeImmediateSkillEvents(skillEvents);
      for (const event of skillEvents) {
        if (event.delay_ms > 0) {
          scheduledSkillEvents.current.push({ event, remaining: event.delay_ms / 1000 });
        }
      }
      setCombatLogs((logs) => [`${skill.name_text} 自动释放。`, ...logs].slice(0, 8));
      return current;
    }
    if (skill.behavior_template === "damage_zone") {
      const targets = selectDamageZoneTargets(current, skill, caster);
      if (targets.length === 0) return current;
      const skillEvents = createDamageZoneSkillEvents(skill, targets);
      consumeImmediateSkillEvents(skillEvents);
      for (const event of skillEvents) {
        if (event.delay_ms > 0) {
          scheduledSkillEvents.current.push({ event, remaining: event.delay_ms / 1000 });
        }
      }
      setCombatLogs((logs) => [`${skill.name_text} 自动释放。`, ...logs].slice(0, 8));
      return current;
    }
    if (skill.behavior_template === "player_nova") {
      const targets = selectPlayerNovaTargets(current, skill, caster);
      if (targets.length === 0) return current;
      const skillEvents = createPlayerNovaSkillEvents(skill, targets);
      consumeImmediateSkillEvents(skillEvents);
      for (const event of skillEvents) {
        if (event.delay_ms > 0) {
          scheduledSkillEvents.current.push({ event, remaining: event.delay_ms / 1000 });
        }
      }
      setCombatLogs((logs) => [`${skill.name_text} 自动释放。`, ...logs].slice(0, 8));
      return current;
    }
    if (skill.behavior_template === "melee_arc") {
      const targets = selectMeleeArcTargets(current, skill, caster);
      if (targets.length === 0) return current;
      const skillEvents = createMeleeArcSkillEvents(skill, targets);
      consumeImmediateSkillEvents(skillEvents);
      for (const event of skillEvents) {
        if (event.delay_ms > 0) {
          scheduledSkillEvents.current.push({ event, remaining: event.delay_ms / 1000 });
        }
      }
      setCombatLogs((logs) => [`${skill.name_text} 自动释放。`, ...logs].slice(0, 8));
      return current;
    }
    if (skill.behavior_template === "chain") {
      const targets = selectChainTargets(current, skill, caster);
      if (targets.length === 0) return current;
      const skillEvents = createChainSkillEvents(skill, targets);
      consumeImmediateSkillEvents(skillEvents);
      for (const event of skillEvents) {
        if (event.delay_ms > 0) {
          scheduledSkillEvents.current.push({ event, remaining: event.delay_ms / 1000 });
        }
      }
      setCombatLogs((logs) => [`${skill.name_text} 自动释放。`, ...logs].slice(0, 8));
      return current;
    }
    const targets = selectProjectileTargets(current, skill, caster);
    if (targets.length === 0) return current;

    const skillEvents = createProjectileSkillEvents(skill, targets[0].enemy, targets);
    consumeImmediateSkillEvents(skillEvents);
    for (const event of skillEvents) {
      if (event.delay_ms > 0) {
        scheduledSkillEvents.current.push({ event, remaining: event.delay_ms / 1000 });
      }
    }
    setCombatLogs((logs) => [`${skill.name_text} 自动释放。`, ...logs].slice(0, 8));
    return current;
  }

  function createModuleChainSkillEvents(skill: SkillPreview, current: Enemy[]): SkillEvent[] {
    const modules = Array.isArray(skill.runtime_params?.modules) ? skill.runtime_params.modules as { type?: string; params?: Record<string, unknown>; trigger?: Record<string, unknown> }[] : [];
    const orbitModule = modules.find((module) => module.type === "orbit_emitter");
    const projectileModule = modules.find((module) => module.type === "projectile");
    const zoneModule = modules.find((module) => module.type === "damage_zone");
    if (orbitModule && zoneModule) {
      return createOrbitModuleChainSkillEvents(skill, current, orbitModule, zoneModule);
    }
    if (!projectileModule || !zoneModule) return [];
    const projectileParams = projectileModule.params ?? {};
    const zoneParams = zoneModule.params ?? {};
    const triggerParams = zoneModule.trigger ?? {};
    const origin = { x: playerStateRef.current.x, y: playerStateRef.current.y };
    const spawnWorldPosition = projectileSpawnWorldPosition(origin, projectileParams as SkillPackageData["behavior"]["params"]);
    const primaryTarget = nearestEnemy(current, origin);
    if (!primaryTarget) return [];
    const targetPosition = { x: primaryTarget.x, y: primaryTarget.y };
    const directionWorld = guideDirection(spawnWorldPosition, targetPosition);
    const timestampMs = Math.round(elapsedRef.current * 1000);
    const travelTimeMs = Math.max(1, Math.round(Number(projectileParams.travel_time_ms ?? 520)));
    const arcHeight = Math.max(0, Number(projectileParams.arc_height ?? 0));
    const impactMarkerId = String(projectileParams.impact_marker_id ?? "");
    const triggerMarkerId = String(triggerParams.trigger_marker_id ?? zoneParams.trigger_marker_id ?? "");
    if (!impactMarkerId || impactMarkerId !== triggerMarkerId) return [];
    const triggerDelayMs = Math.max(0, Math.round(Number(triggerParams.trigger_delay_ms ?? zoneParams.trigger_delay_ms ?? 0)));
    const radius = Math.max(1, Number(zoneParams.radius ?? skill.hit?.hit_radius ?? 180));
    const maxTargets = Math.max(1, Math.round(Number(zoneParams.max_targets ?? current.length)));
    const hitTargets = current
      .map((enemy) => ({ enemy, distance: distance({ x: enemy.x, y: enemy.y }, targetPosition) }))
      .filter((item) => item.distance <= radius)
      .sort((left, right) => left.distance - right.distance)
      .slice(0, maxTargets);
    const projectileVfxKey = String(projectileParams.vfx_key ?? skill.presentation_keys?.projectile_vfx_key ?? skill.visual_effect);
    const zoneVfxKey = String(zoneParams.vfx_key ?? skill.presentation_keys?.vfx ?? skill.visual_effect);
    const hitVfxKey = skill.presentation_keys?.hit_vfx_key ?? zoneVfxKey;
    const sfxKey = skill.presentation_keys?.sfx ?? "";
    const reasonKey = skill.presentation_keys?.screen_feedback ?? "";
    const floatingKey = skill.presentation_keys?.floating_text ?? "";
    const vfxScale = skillPreviewVfxScale(skill);
    const projectileId = `${skill.active_gem_instance_id}.${timestampMs}.projectile.1`;
    const zoneId = `${skill.active_gem_instance_id}.${timestampMs}.damage_zone.1`;
    const damageDelayMs = travelTimeMs + triggerDelayMs;
    const projectilePayload = {
      projectile_id: projectileId,
      projectile_index: 1,
      projectile_count: 1,
      skill_id: skill.skill_package_id ?? skill.skill_template_id,
      trajectory: String(projectileParams.trajectory ?? "linear"),
      start_position: spawnWorldPosition,
      spawn_world_position: spawnWorldPosition,
      target_position: targetPosition,
      target_world_position: targetPosition,
      end_position: targetPosition,
      expire_world_position: targetPosition,
      impact_world_position: targetPosition,
      direction_world: directionWorld,
      travel_time_ms: travelTimeMs,
      lifetime_ms: travelTimeMs,
      arc_height: arcHeight,
      impact_marker_id: impactMarkerId,
      projectile_speed: Number(projectileParams.projectile_speed ?? 0),
      projectile_width: Number(projectileParams.projectile_width ?? 38),
      projectile_height: Number(projectileParams.projectile_height ?? 24),
      impact_radius: Number(projectileParams.impact_radius ?? zoneParams.radius ?? skill.hit?.hit_radius ?? 18),
      vfx_scale: vfxScale,
      skill_name: skill.name_text
    };
    const zonePayload = {
      zone_id: zoneId,
      skill_id: skill.skill_package_id ?? skill.skill_template_id,
      shape: "circle",
      origin: targetPosition,
      origin_world_position: targetPosition,
      origin_policy: "trigger_position",
      trigger_marker_id: triggerMarkerId,
      delay_ms: triggerDelayMs,
      radius,
      ring_width: Number(zoneParams.ring_width ?? 48),
      hit_at_ms: Math.max(0, Math.round(Number(zoneParams.hit_at_ms ?? triggerDelayMs))),
      max_targets: maxTargets,
      damage_type: skill.damage_type,
      vfx_key: zoneVfxKey,
      zone_vfx_key: zoneVfxKey,
      vfx_scale: vfxScale,
      hit_target_count: hitTargets.length,
      skill_name: skill.name_text
    };
    const base = {
      timestamp_ms: timestampMs,
      source_entity: "player",
      target_entity: String(primaryTarget.id),
      direction: directionWorld,
      damage_type: skill.damage_type,
      skill_instance_id: skill.active_gem_instance_id,
      sfx_key: sfxKey
    };
    return [
      { ...base, event_id: `${skill.active_gem_instance_id}.cast_start.${timestampMs}`, type: "cast_start" as const, position: origin, delay_ms: 0, duration_ms: 0, amount: null, vfx_key: skill.presentation_keys?.cast_vfx_key ?? projectileVfxKey, reason_key: "", payload: { skill_id: skill.skill_package_id ?? skill.skill_template_id, skill_name: skill.name_text } },
      { ...base, event_id: `${skill.active_gem_instance_id}.projectile_spawn.${timestampMs}`, type: "projectile_spawn" as const, position: spawnWorldPosition, delay_ms: 0, duration_ms: travelTimeMs, amount: null, vfx_key: projectileVfxKey, reason_key: "", payload: projectilePayload },
      { ...base, event_id: `${skill.active_gem_instance_id}.projectile_impact.${timestampMs}`, type: "projectile_impact" as const, timestamp_ms: timestampMs + travelTimeMs, position: targetPosition, delay_ms: travelTimeMs, duration_ms: 0, amount: null, vfx_key: projectileVfxKey, reason_key: "", payload: { ...projectilePayload, marker_id: impactMarkerId, impact_position: targetPosition } },
      { ...base, event_id: `${skill.active_gem_instance_id}.damage_zone_prime.${timestampMs}`, type: "damage_zone_prime" as const, timestamp_ms: timestampMs + travelTimeMs, position: targetPosition, delay_ms: travelTimeMs, duration_ms: triggerDelayMs, amount: null, vfx_key: zoneVfxKey, reason_key: "", payload: zonePayload },
      { ...base, event_id: `${skill.active_gem_instance_id}.damage_zone.${timestampMs}`, type: "damage_zone" as const, timestamp_ms: timestampMs + damageDelayMs, position: targetPosition, delay_ms: damageDelayMs, duration_ms: Math.max(180, triggerDelayMs), amount: null, vfx_key: zoneVfxKey, reason_key: "", payload: zonePayload },
      ...(hitTargets.length > 0 ? [{ ...base, event_id: `${skill.active_gem_instance_id}.hit_vfx.${timestampMs}`, type: "hit_vfx" as const, timestamp_ms: timestampMs + damageDelayMs, position: targetPosition, delay_ms: damageDelayMs, duration_ms: FIRE_BOLT_IMPACT_DURATION_MS, amount: null, vfx_key: hitVfxKey, reason_key: reasonKey, payload: { ...zonePayload, hit_world_position: targetPosition } }] : []),
      ...hitTargets.flatMap((item, index) => {
        const targetPosition = { x: item.enemy.x, y: item.enemy.y };
        const hitPayload = { ...zonePayload, target_world_position: targetPosition, hit_world_position: targetPosition, target_distance: item.distance };
        const targetBase = { ...base, target_entity: String(item.enemy.id), direction: guideDirection(zonePayload.origin, targetPosition) };
        return [
          { ...targetBase, event_id: `${skill.active_gem_instance_id}.${item.enemy.id}.damage.${index}.${timestampMs}`, type: "damage" as const, timestamp_ms: timestampMs + damageDelayMs, position: targetPosition, delay_ms: damageDelayMs, duration_ms: 0, amount: skill.final_damage, vfx_key: hitVfxKey, reason_key: reasonKey, payload: hitPayload },
          { ...targetBase, event_id: `${skill.active_gem_instance_id}.${item.enemy.id}.floating_text.${index}.${timestampMs}`, type: "floating_text" as const, timestamp_ms: timestampMs + damageDelayMs, position: { x: item.enemy.x, y: item.enemy.y - 28 }, delay_ms: damageDelayMs, duration_ms: 800, amount: skill.final_damage, vfx_key: hitVfxKey, reason_key: floatingKey, payload: { ...hitPayload, text: `${Math.round(skill.final_damage)}点${damageTypeText(skill.damage_type)}伤害` } }
        ];
      })
    ];
  }

  function createOrbitModuleChainSkillEvents(
    skill: SkillPreview,
    current: Enemy[],
    orbitModule: { params?: Record<string, unknown> },
    zoneModule: { params?: Record<string, unknown>; trigger?: Record<string, unknown> }
  ): SkillEvent[] {
    const orbitParams = orbitModule.params ?? {};
    const zoneParams = zoneModule.params ?? {};
    const triggerParams = zoneModule.trigger ?? {};
    const origin = { x: playerStateRef.current.x, y: playerStateRef.current.y };
    const timestampMs = Math.round(elapsedRef.current * 1000);
    const durationMs = Math.max(1, Math.round(Number(orbitParams.duration_ms ?? 3600)));
    const tickIntervalMs = Math.max(1, Math.round(Number(orbitParams.tick_interval_ms ?? 300)));
    const orbitRadius = Math.max(1, Number(orbitParams.orbit_radius ?? 180));
    const orbitSpeedDegPerSec = Number(orbitParams.orbit_speed_deg_per_sec ?? 180);
    const orbCount = Math.max(1, Math.round(Number(orbitParams.orb_count ?? 1)));
    const startAngleDeg = Number(orbitParams.start_angle_deg ?? 0);
    const tickMarkerId = String(orbitParams.tick_marker_id ?? "");
    const triggerMarkerId = String(triggerParams.trigger_marker_id ?? zoneParams.trigger_marker_id ?? "");
    if (!tickMarkerId || tickMarkerId !== triggerMarkerId) return [];

    const triggerDelayMs = Math.max(0, Math.round(Number(triggerParams.trigger_delay_ms ?? zoneParams.trigger_delay_ms ?? 0)));
    const hitAtMs = Math.max(0, Math.round(Number(zoneParams.hit_at_ms ?? 0)));
    const radius = Math.max(1, Number(zoneParams.radius ?? skill.hit?.hit_radius ?? 72));
    const maxTargets = Math.max(1, Math.round(Number(zoneParams.max_targets ?? current.length)));
    const spawnVfxKey = String(orbitParams.spawn_vfx_key ?? skill.presentation_keys?.cast_vfx_key ?? skill.visual_effect);
    const tickVfxKey = String(orbitParams.tick_vfx_key ?? skill.presentation_keys?.vfx ?? skill.visual_effect);
    const zoneVfxKey = String(zoneParams.vfx_key ?? skill.presentation_keys?.vfx ?? skill.visual_effect);
    const hitVfxKey = skill.presentation_keys?.hit_vfx_key ?? zoneVfxKey;
    const sfxKey = skill.presentation_keys?.sfx ?? "";
    const reasonKey = skill.presentation_keys?.screen_feedback ?? "";
    const floatingKey = skill.presentation_keys?.floating_text ?? "";
    const vfxScale = skillPreviewVfxScale(skill);
    const skillId = skill.skill_package_id ?? skill.skill_template_id;
    const orbitId = `${skill.active_gem_instance_id}.${timestampMs}.orbit`;
    const base = {
      timestamp_ms: timestampMs,
      source_entity: "player",
      target_entity: "",
      direction: { x: 0, y: 0 },
      damage_type: skill.damage_type,
      skill_instance_id: skill.active_gem_instance_id,
      sfx_key: sfxKey
    };
    const events: SkillEvent[] = [
      { ...base, event_id: `${skill.active_gem_instance_id}.cast_start.${timestampMs}`, type: "cast_start", position: origin, delay_ms: 0, duration_ms: 0, amount: null, vfx_key: spawnVfxKey, reason_key: "", payload: { skill_id: skillId, skill_name: skill.name_text } },
      { ...base, event_id: `${skill.active_gem_instance_id}.orbit_spawn.${timestampMs}`, type: "orbit_spawn", position: origin, delay_ms: 0, duration_ms: durationMs, amount: null, vfx_key: spawnVfxKey, reason_key: "", payload: { orbit_id: orbitId, skill_id: skillId, skill_name: skill.name_text, orbit_center: origin, orbit_radius: orbitRadius, duration_ms: durationMs, orb_count: orbCount, orbit_speed_deg_per_sec: orbitSpeedDegPerSec, spawn_vfx_key: spawnVfxKey, vfx_scale: vfxScale } }
    ];

    const tickCount = Math.floor(durationMs / tickIntervalMs);
    for (let tickIndex = 1; tickIndex <= tickCount; tickIndex += 1) {
      const tickTimeMs = tickIndex * tickIntervalMs;
      for (let orbIndex = 0; orbIndex < orbCount; orbIndex += 1) {
        const angleDeg = startAngleDeg + (360 / orbCount) * orbIndex + orbitSpeedDegPerSec * (tickTimeMs / 1000);
        const angleRad = (angleDeg * Math.PI) / 180;
        const orbPosition = {
          x: origin.x + Math.cos(angleRad) * orbitRadius,
          y: origin.y + Math.sin(angleRad) * orbitRadius
        };
        const tickEventId = `${skill.active_gem_instance_id}.orbit_tick.${tickIndex}.${orbIndex}.${timestampMs}`;
        const zoneId = `${skill.active_gem_instance_id}.${timestampMs}.orbit_zone.${tickIndex}.${orbIndex}`;
        const tickPayload = {
          orbit_id: orbitId,
          skill_id: skillId,
          skill_name: skill.name_text,
          orbit_center: origin,
          orbit_center_policy: String(orbitParams.orbit_center_policy ?? "caster"),
          tick_index: tickIndex,
          tick_time_ms: tickTimeMs,
          orb_index: orbIndex,
          orb_count: orbCount,
          orb_position: orbPosition,
          tick_marker_id: tickMarkerId,
          marker_id: tickMarkerId,
          tick_vfx_key: tickVfxKey,
          orbit_radius: orbitRadius,
          orbit_speed_deg_per_sec: orbitSpeedDegPerSec,
          start_angle_deg: startAngleDeg,
          vfx_scale: vfxScale
        };
        const zonePayload = {
          zone_id: zoneId,
          source_tick_event_id: tickEventId,
          orbit_id: orbitId,
          skill_id: skillId,
          skill_name: skill.name_text,
          shape: "circle",
          origin: orbPosition,
          origin_world_position: orbPosition,
          origin_policy: "trigger_position",
          trigger_marker_id: triggerMarkerId,
          orbit_center: origin,
          orbit_center_policy: String(orbitParams.orbit_center_policy ?? "caster"),
          tick_index: tickIndex,
          tick_time_ms: tickTimeMs,
          orb_index: orbIndex,
          orb_count: orbCount,
          orb_position: orbPosition,
          orbit_radius: orbitRadius,
          orbit_speed_deg_per_sec: orbitSpeedDegPerSec,
          start_angle_deg: startAngleDeg,
          delay_ms: triggerDelayMs,
          radius,
          ring_width: Number(zoneParams.ring_width ?? 28),
          hit_at_ms: hitAtMs,
          max_targets: maxTargets,
          damage_type: skill.damage_type,
          damage_amount: skill.final_damage,
          vfx_key: zoneVfxKey,
          zone_vfx_key: zoneVfxKey,
          hit_vfx_key: hitVfxKey,
          reason_key: reasonKey,
          floating_text_key: floatingKey,
          vfx_scale: vfxScale,
          hit_target_count: 0
        };
        events.push({ ...base, event_id: tickEventId, type: "orbit_tick", timestamp_ms: timestampMs + tickTimeMs, position: orbPosition, delay_ms: tickTimeMs, duration_ms: 0, amount: null, vfx_key: tickVfxKey, reason_key: "", payload: tickPayload });
        events.push({ ...base, event_id: `${skill.active_gem_instance_id}.damage_zone.${tickIndex}.${orbIndex}.${timestampMs}`, type: "damage_zone", timestamp_ms: timestampMs + tickTimeMs + triggerDelayMs, position: orbPosition, delay_ms: tickTimeMs + triggerDelayMs, duration_ms: Math.max(180, hitAtMs), amount: null, vfx_key: zoneVfxKey, reason_key: "", payload: zonePayload });
      }
    }
    return events;
  }

  function createDamageZoneSkillEvents(skill: SkillPreview, targets: Enemy[]): SkillEvent[] {
    const runtimeParams = skill.runtime_params ?? {};
    const origin = { x: playerStateRef.current.x, y: playerStateRef.current.y };
    const shape = String(runtimeParams.shape ?? "circle") === "rectangle" ? "rectangle" : "circle";
    const hitAtMs = Math.max(0, Math.round(Number(runtimeParams.hit_at_ms ?? skill.hit?.hit_delay_ms ?? 0)));
    const maxTargets = Math.max(1, Math.round(Number(runtimeParams.max_targets ?? (targets.length || 1))));
    const primaryTarget = nearestEnemy(targets, origin) ?? nearestEnemy(enemiesStateRef.current, origin);
    const facingDirection = shape === "circle" ? { x: 0, y: 0 } : guideDirection(origin, primaryTarget ?? { x: origin.x + 1, y: origin.y });
    const angleOffsetDeg = Number(runtimeParams.angle_offset_deg ?? 0);
    const directionWorld = shape === "circle" ? { x: 0, y: 0 } : rotateDirection(facingDirection, angleOffsetDeg);
    const radius = Math.max(1, Number(runtimeParams.radius ?? skill.hit?.hit_radius ?? 360));
    const length = Math.max(1, Number(runtimeParams.length ?? skill.hit?.hit_radius ?? 320));
    const width = Math.max(1, Number(runtimeParams.width ?? 96));
    const ringWidth = Math.max(1, Number(runtimeParams.ring_width ?? 48));
    const expandDurationMs = Math.max(0, Math.round(Number(runtimeParams.expand_duration_ms ?? hitAtMs)));
    const timestampMs = Math.round(elapsedRef.current * 1000);
    const vfxKey = String(runtimeParams.zone_vfx_key ?? skill.presentation_keys?.vfx ?? skill.visual_effect);
    const hitVfxKey = skill.presentation_keys?.hit_vfx_key ?? vfxKey;
    const sfxKey = skill.presentation_keys?.sfx ?? "";
    const reasonKey = skill.presentation_keys?.screen_feedback ?? "";
    const floatingKey = skill.presentation_keys?.floating_text ?? "";
    const vfxScale = skillPreviewVfxScale(skill);
    const zoneId = `${skill.active_gem_instance_id}.${timestampMs}.damage_zone.1`;
    const selectedTargets = targets.slice(0, maxTargets);
    const durationMs = Math.max(hitAtMs, shape === "circle" ? expandDurationMs : 0);
    const zonePayload = {
      zone_id: zoneId,
      skill_id: skill.skill_package_id ?? skill.skill_template_id,
      shape,
      origin,
      origin_world_position: origin,
      origin_policy: String(runtimeParams.origin_policy ?? "caster"),
      facing_policy: String(runtimeParams.facing_policy ?? (shape === "circle" ? "none" : "locked_or_nearest_target")),
      facing_direction: facingDirection,
      direction_world: directionWorld,
      radius: shape === "circle" ? radius : null,
      length: shape === "rectangle" ? length : null,
      width: shape === "rectangle" ? width : null,
      ring_width: shape === "circle" ? ringWidth : null,
      angle_deg: shape === "circle" ? 360 : 0,
      angle_offset_deg: angleOffsetDeg,
      duration_ms: durationMs,
      expand_duration_ms: shape === "circle" ? expandDurationMs : 0,
      hit_at_ms: hitAtMs,
      max_targets: maxTargets,
      damage_type: skill.damage_type,
      vfx_key: vfxKey,
      zone_vfx_key: vfxKey,
      vfx_scale: vfxScale,
      status_chance_scale: Number(runtimeParams.status_chance_scale ?? 1),
      hit_target_count: selectedTargets.length,
      skill_name: skill.name_text
    };
    const base = {
      timestamp_ms: timestampMs,
      source_entity: "player",
      target_entity: primaryTarget ? String(primaryTarget.id) : "",
      direction: directionWorld,
      damage_type: skill.damage_type,
      skill_instance_id: skill.active_gem_instance_id,
      sfx_key: sfxKey
    };
    return [
      {
        ...base,
        event_id: `${skill.active_gem_instance_id}.cast_start.${timestampMs}`,
        type: "cast_start" as const,
        position: origin,
        delay_ms: 0,
        duration_ms: 0,
        amount: null,
        vfx_key: skill.presentation_keys?.cast_vfx_key ?? vfxKey,
        reason_key: "",
        payload: { skill_id: skill.skill_package_id ?? skill.skill_template_id, skill_name: skill.name_text }
      },
      {
        ...base,
        event_id: `${skill.active_gem_instance_id}.damage_zone.${timestampMs}`,
        type: "damage_zone" as const,
        position: origin,
        delay_ms: 0,
        duration_ms: durationMs,
        amount: null,
        vfx_key: vfxKey,
        reason_key: "",
        payload: zonePayload
      },
      ...selectedTargets.flatMap((target, index) => {
        const targetPosition = { x: target.x, y: target.y };
        const hitPayload = { ...zonePayload, target_world_position: targetPosition, hit_world_position: targetPosition, target_distance: distance(targetPosition, origin) };
        const targetBase = { ...base, target_entity: String(target.id), direction: guideDirection(origin, targetPosition) };
        return [
          { ...targetBase, event_id: `${skill.active_gem_instance_id}.${target.id}.damage.${index}.${timestampMs}`, type: "damage" as const, timestamp_ms: timestampMs + hitAtMs, position: targetPosition, delay_ms: hitAtMs, duration_ms: 0, amount: skill.final_damage, vfx_key: hitVfxKey, reason_key: reasonKey, payload: hitPayload },
          { ...targetBase, event_id: `${skill.active_gem_instance_id}.${target.id}.hit_vfx.${index}.${timestampMs}`, type: "hit_vfx" as const, timestamp_ms: timestampMs + hitAtMs, position: targetPosition, delay_ms: hitAtMs, duration_ms: FIRE_BOLT_IMPACT_DURATION_MS, amount: null, vfx_key: hitVfxKey, reason_key: reasonKey, payload: hitPayload },
          { ...targetBase, event_id: `${skill.active_gem_instance_id}.${target.id}.floating_text.${index}.${timestampMs}`, type: "floating_text" as const, timestamp_ms: timestampMs + hitAtMs, position: { x: target.x, y: target.y - 28 }, delay_ms: hitAtMs, duration_ms: 800, amount: skill.final_damage, vfx_key: hitVfxKey, reason_key: floatingKey, payload: { ...hitPayload, text: `${Math.round(skill.final_damage)}点${damageTypeText(skill.damage_type)}伤害` } }
        ];
      })
    ];
  }

  function createMeleeArcSkillEvents(skill: SkillPreview, targets: Enemy[]): SkillEvent[] {
    const runtimeParams = skill.runtime_params ?? {};
    const origin = { x: playerStateRef.current.x, y: playerStateRef.current.y };
    const arcAngle = clamp(Number(runtimeParams.arc_angle ?? 70), 1, 180);
    const arcRadius = Math.max(1, Number(runtimeParams.arc_radius ?? skill.cast?.search_range ?? 320));
    const windupMs = Math.max(0, Math.round(Number(runtimeParams.windup_ms ?? skill.cast?.windup_ms ?? 0)));
    const hitAtMs = Math.max(windupMs, Math.max(0, Math.round(Number(runtimeParams.hit_at_ms ?? windupMs))));
    const maxTargets = Math.max(1, Math.round(Number(runtimeParams.max_targets ?? (targets.length || 1))));
    const primaryTarget = nearestEnemy(targets, origin);
    const fallbackTarget = nearestEnemy(enemiesStateRef.current, origin);
    const guideTarget = primaryTarget ?? fallbackTarget ?? { x: origin.x + 1, y: origin.y };
    const facingDirection = guideDirection(origin, guideTarget);
    const selectedTargets = targets.slice(0, maxTargets);
    const timestampMs = Math.round(elapsedRef.current * 1000);
    const vfxKey = skill.presentation_keys?.hit_vfx_key ?? String(runtimeParams.slash_vfx_key ?? skill.presentation_keys?.vfx ?? skill.visual_effect);
    const sfxKey = skill.presentation_keys?.sfx ?? "";
    const reasonKey = skill.presentation_keys?.screen_feedback ?? "";
    const floatingKey = skill.presentation_keys?.floating_text ?? "";
    const vfxScale = skillPreviewVfxScale(skill);
    const arcId = `${skill.active_gem_instance_id}.${timestampMs}.melee_arc.1`;
    const arcPayload = {
      arc_id: arcId,
      skill_id: skill.skill_package_id ?? skill.skill_template_id,
      origin,
      origin_world_position: origin,
      facing_direction: facingDirection,
      direction_world: facingDirection,
      arc_angle: arcAngle,
      arc_radius: arcRadius,
      hit_shape: String(runtimeParams.hit_shape ?? "sector"),
      windup_ms: windupMs,
      hit_at_ms: hitAtMs,
      max_targets: maxTargets,
      facing_policy: String(runtimeParams.facing_policy ?? "nearest_target"),
      damage_type: skill.damage_type,
      vfx_key: vfxKey,
      slash_vfx_key: String(runtimeParams.slash_vfx_key ?? vfxKey),
      vfx_scale: vfxScale,
      status_chance_scale: Number(runtimeParams.status_chance_scale ?? 1),
      hit_target_count: selectedTargets.length,
      skill_name: skill.name_text
    };
    const base = {
      timestamp_ms: timestampMs,
      source_entity: "player",
      target_entity: primaryTarget ? String(primaryTarget.id) : "",
      direction: facingDirection,
      damage_type: skill.damage_type,
      skill_instance_id: skill.active_gem_instance_id,
      sfx_key: sfxKey
    };
    return [
      {
        ...base,
        event_id: `${skill.active_gem_instance_id}.cast_start.${timestampMs}`,
        type: "cast_start" as const,
        position: origin,
        delay_ms: 0,
        duration_ms: windupMs,
        amount: null,
        vfx_key: skill.presentation_keys?.cast_vfx_key ?? vfxKey,
        reason_key: "",
        payload: { skill_id: skill.skill_package_id ?? skill.skill_template_id, skill_name: skill.name_text }
      },
      {
        ...base,
        event_id: `${skill.active_gem_instance_id}.melee_arc.${timestampMs}`,
        type: "melee_arc" as const,
        position: origin,
        delay_ms: 0,
        duration_ms: Math.max(hitAtMs, windupMs),
        amount: null,
        vfx_key: vfxKey,
        reason_key: "",
        payload: arcPayload
      },
      ...selectedTargets.flatMap((target, index) => {
        const targetPosition = { x: target.x, y: target.y };
        const targetDirection = guideDirection(origin, targetPosition);
        const targetDistance = distance(targetPosition, origin);
        const targetAngle = angleBetweenDegrees(facingDirection, targetDirection);
        const hitPayload = {
          ...arcPayload,
          target_world_position: targetPosition,
          hit_world_position: targetPosition,
          target_distance: targetDistance,
          target_angle: targetAngle
        };
        const targetBase = {
          ...base,
          target_entity: String(target.id),
          direction: targetDirection
        };
        return [
          {
            ...targetBase,
            event_id: `${skill.active_gem_instance_id}.${target.id}.damage.${index}.${timestampMs}`,
            type: "damage" as const,
            timestamp_ms: timestampMs + hitAtMs,
            position: targetPosition,
            delay_ms: hitAtMs,
            duration_ms: 0,
            amount: skill.final_damage,
            vfx_key: vfxKey,
            reason_key: reasonKey,
            payload: hitPayload
          },
          {
            ...targetBase,
            event_id: `${skill.active_gem_instance_id}.${target.id}.hit_vfx.${index}.${timestampMs}`,
            type: "hit_vfx" as const,
            timestamp_ms: timestampMs + hitAtMs,
            position: targetPosition,
            delay_ms: hitAtMs,
            duration_ms: FIRE_BOLT_IMPACT_DURATION_MS,
            amount: null,
            vfx_key: vfxKey,
            reason_key: reasonKey,
            payload: hitPayload
          },
          {
            ...targetBase,
            event_id: `${skill.active_gem_instance_id}.${target.id}.floating_text.${index}.${timestampMs}`,
            type: "floating_text" as const,
            timestamp_ms: timestampMs + hitAtMs,
            position: { x: target.x, y: target.y - 28 },
            delay_ms: hitAtMs,
            duration_ms: 800,
            amount: skill.final_damage,
            vfx_key: vfxKey,
            reason_key: floatingKey,
            payload: { ...hitPayload, text: `${Math.round(skill.final_damage)}点${damageTypeText(skill.damage_type)}伤害` }
          }
        ];
      })
    ];
  }

  function createChainSkillEvents(skill: SkillPreview, targets: Enemy[]): SkillEvent[] {
    const runtimeParams = skill.runtime_params ?? {};
    const origin = { x: playerStateRef.current.x, y: playerStateRef.current.y };
    const chainRadius = Math.max(1, Number(runtimeParams.chain_radius ?? skill.cast?.search_range ?? 180));
    const chainCount = Math.max(1, Math.round(Number(runtimeParams.chain_count ?? targets.length)));
    const chainDelayMs = Math.max(0, Math.round(Number(runtimeParams.chain_delay_ms ?? 0)));
    const damageFalloffPerChain = clamp(Number(runtimeParams.damage_falloff_per_chain ?? 0), 0, 1);
    const maxTargets = Math.max(1, Math.round(Number(runtimeParams.max_targets ?? chainCount)));
    const selectedTargets = targets.slice(0, Math.min(chainCount, maxTargets));
    const timestampMs = Math.round(elapsedRef.current * 1000);
    const initialDelayMs = Math.max(0, Math.round(Number(skill.cast?.windup_ms ?? skill.hit?.hit_delay_ms ?? 0)));
    const segmentVfxKey = String(runtimeParams.segment_vfx_key ?? skill.presentation_keys?.vfx ?? skill.visual_effect);
    const hitVfxKey = skill.presentation_keys?.hit_vfx_key ?? segmentVfxKey;
    const sfxKey = skill.presentation_keys?.sfx ?? "";
    const reasonKey = skill.presentation_keys?.screen_feedback ?? "";
    const floatingKey = skill.presentation_keys?.floating_text ?? "";
    const vfxScale = skillPreviewVfxScale(skill);
    const targetPolicy = String(runtimeParams.target_policy ?? "nearest_not_hit");
    const allowRepeatTarget = Boolean(runtimeParams.allow_repeat_target ?? false);
    const base = {
      timestamp_ms: timestampMs,
      source_entity: "player",
      target_entity: selectedTargets[0] ? String(selectedTargets[0].id) : "",
      direction: selectedTargets[0] ? guideDirection(origin, selectedTargets[0]) : { x: 1, y: 0 },
      damage_type: skill.damage_type,
      skill_instance_id: skill.active_gem_instance_id,
      sfx_key: sfxKey
    };
    return [
      {
        ...base,
        event_id: `${skill.active_gem_instance_id}.cast_start.${timestampMs}`,
        type: "cast_start" as const,
        position: origin,
        delay_ms: 0,
        duration_ms: initialDelayMs,
        amount: null,
        vfx_key: skill.presentation_keys?.cast_vfx_key ?? segmentVfxKey,
        reason_key: "",
        payload: { skill_id: skill.skill_package_id ?? skill.skill_template_id, skill_name: skill.name_text }
      },
      ...selectedTargets.flatMap((target, index) => {
        const previous = index === 0 ? origin : selectedTargets[index - 1];
        const targetPosition = { x: target.x, y: target.y };
        const startPosition = { x: previous.x, y: previous.y };
        const delayMs = initialDelayMs + chainDelayMs * index;
        const damageScale = Math.max(0, 1 - damageFalloffPerChain * index);
        const amount = skill.final_damage * damageScale;
        const direction = guideDirection(startPosition, targetPosition);
        const segmentId = `${skill.active_gem_instance_id}.${timestampMs}.chain.${index}`;
        const payload = {
          segment_id: segmentId,
          skill_id: skill.skill_package_id ?? skill.skill_template_id,
          segment_index: index,
          from_target: index === 0 ? "" : String(selectedTargets[index - 1].id),
          to_target: String(target.id),
          start_position: startPosition,
          end_position: targetPosition,
          target_world_position: targetPosition,
          chain_radius: chainRadius,
          chain_delay_ms: chainDelayMs,
          chain_count: chainCount,
          target_policy: targetPolicy,
          allow_repeat_target: allowRepeatTarget,
          max_targets: maxTargets,
          damage_scale: damageScale,
          damage_type: skill.damage_type,
      vfx_key: segmentVfxKey,
      vfx_scale: vfxScale,
      skill_name: skill.name_text
        };
        const targetBase = {
          ...base,
          target_entity: String(target.id),
          direction,
          timestamp_ms: timestampMs + delayMs,
          position: targetPosition,
          delay_ms: delayMs
        };
        return [
          { ...targetBase, event_id: `${segmentId}.segment`, type: "chain_segment" as const, position: startPosition, duration_ms: Math.max(80, chainDelayMs), amount: null, vfx_key: segmentVfxKey, reason_key: "", payload },
          { ...targetBase, event_id: `${segmentId}.damage`, type: "damage" as const, duration_ms: 0, amount, vfx_key: hitVfxKey, reason_key: reasonKey, payload },
          { ...targetBase, event_id: `${segmentId}.hit_vfx`, type: "hit_vfx" as const, duration_ms: FIRE_BOLT_IMPACT_DURATION_MS, amount: null, vfx_key: hitVfxKey, reason_key: reasonKey, payload },
          { ...targetBase, event_id: `${segmentId}.floating_text`, type: "floating_text" as const, position: { x: target.x, y: target.y - 28 }, duration_ms: 800, amount, vfx_key: hitVfxKey, reason_key: floatingKey, payload: { ...payload, text: `${Math.round(amount)}点${damageTypeText(skill.damage_type)}伤害` } }
        ];
      })
    ];
  }

  function createPlayerNovaSkillEvents(skill: SkillPreview, targets: Enemy[]): SkillEvent[] {
    const runtimeParams = skill.runtime_params ?? {};
    const radius = Math.max(1, Number(runtimeParams.radius ?? 360));
    const ringWidth = Math.max(1, Number(runtimeParams.ring_width ?? 48));
    const expandDurationMs = Math.max(0, Math.round(Number(runtimeParams.expand_duration_ms ?? 0)));
    const hitAtMs = Math.min(expandDurationMs || Number(runtimeParams.hit_at_ms ?? 0), Math.max(0, Math.round(Number(runtimeParams.hit_at_ms ?? 0))));
    const vfxKey = skill.presentation_keys?.vfx ?? skill.visual_effect;
    const hitVfxKey = skill.presentation_keys?.hit_vfx_key ?? vfxKey;
    const sfxKey = skill.presentation_keys?.sfx ?? "";
    const reasonKey = skill.presentation_keys?.screen_feedback ?? "";
    const floatingKey = skill.presentation_keys?.floating_text ?? "";
    const timestampMs = Math.round(elapsedRef.current * 1000);
    const areaId = `${skill.active_gem_instance_id}.${timestampMs}.area.1`;
    const primaryTarget = targets[0];
    const base = {
      timestamp_ms: timestampMs,
      source_entity: "player",
      target_entity: primaryTarget ? String(primaryTarget.id) : "",
      direction: { x: 0, y: 0 },
      damage_type: skill.damage_type,
      skill_instance_id: skill.active_gem_instance_id,
      sfx_key: sfxKey
    };
    const center = { x: playerStateRef.current.x, y: playerStateRef.current.y };
    const areaPayload = {
      area_id: areaId,
      skill_id: skill.skill_package_id ?? skill.skill_template_id,
      center,
      center_world_position: center,
      radius,
      ring_width: ringWidth,
      duration_ms: expandDurationMs,
      expand_duration_ms: expandDurationMs,
      hit_at_ms: hitAtMs,
      damage_type: skill.damage_type,
      vfx_key: vfxKey,
      vfx_scale: vfxScale,
      center_policy: String(runtimeParams.center_policy ?? "player_center"),
      damage_falloff_by_distance: String(runtimeParams.damage_falloff_by_distance ?? "none"),
      status_chance_scale: Number(runtimeParams.status_chance_scale ?? 1),
      skill_name: skill.name_text
    };
    return [
      {
        ...base,
        event_id: `${skill.active_gem_instance_id}.area_spawn.${timestampMs}`,
        type: "area_spawn" as const,
        position: center,
        delay_ms: 0,
        duration_ms: expandDurationMs,
        amount: null,
        vfx_key: vfxKey,
        reason_key: "",
        payload: areaPayload
      },
      ...targets.flatMap((target, index) => {
        const targetPosition = { x: target.x, y: target.y };
        const dx = target.x - center.x;
        const dy = target.y - center.y;
        const length = Math.hypot(dx, dy) || 1;
        const direction = { x: dx / length, y: dy / length };
        const hitPayload = {
          ...areaPayload,
          target_world_position: targetPosition,
          target_distance: length
        };
        return [
          {
            ...base,
            target_entity: String(target.id),
            direction,
            event_id: `${skill.active_gem_instance_id}.${target.id}.damage.${index}.${timestampMs}`,
            type: "damage" as const,
            timestamp_ms: timestampMs + hitAtMs,
            position: targetPosition,
            delay_ms: hitAtMs,
            duration_ms: 0,
            amount: skill.final_damage,
            vfx_key: hitVfxKey,
            reason_key: reasonKey,
            payload: hitPayload
          },
          {
            ...base,
            target_entity: String(target.id),
            direction,
            event_id: `${skill.active_gem_instance_id}.${target.id}.hit_vfx.${index}.${timestampMs}`,
            type: "hit_vfx" as const,
            timestamp_ms: timestampMs + hitAtMs,
            position: targetPosition,
            delay_ms: hitAtMs,
            duration_ms: 420,
            amount: null,
            vfx_key: hitVfxKey,
            reason_key: reasonKey,
            payload: hitPayload
          },
          {
            ...base,
            target_entity: String(target.id),
            direction,
            event_id: `${skill.active_gem_instance_id}.${target.id}.floating_text.${index}.${timestampMs}`,
            type: "floating_text" as const,
            timestamp_ms: timestampMs + hitAtMs,
            position: { x: target.x, y: target.y - 28 },
            delay_ms: hitAtMs,
            duration_ms: 800,
            amount: skill.final_damage,
            vfx_key: hitVfxKey,
            reason_key: floatingKey,
            payload: { ...hitPayload, text: `${Math.round(skill.final_damage)}点${damageTypeText(skill.damage_type)}伤害` }
          }
        ];
      })
    ];
  }

  function createProjectileSkillEvents(
    skill: SkillPreview,
    target: Enemy,
    damageTargets: ProjectileDamageTarget[] = [{ enemy: target, projectileIndex: 0 }]
  ): SkillEvent[] {
    const runtimeParams = skill.runtime_params ?? {};
    const projectileSpeed = Math.max(1, Number(runtimeParams.projectile_speed ?? 720));
    const projectileCount = Math.max(1, Math.round(Number(runtimeParams.projectile_count ?? skill.projectile_count ?? 1)));
    const burstIntervalMs = Math.max(0, Math.round(Number(runtimeParams.burst_interval_ms ?? 0)));
    const spreadAngleDeg = projectileSpreadAngleDeg(skill.behavior_template, runtimeParams);
    const angleStepDeg = projectileAngleStepDeg(skill.behavior_template, runtimeParams);
    const perProjectileDamageScale = 1;
    const caster = playerStateRef.current;
    const baseLaunch = createFireBoltProjectileLaunch(skill, caster, target, 0);
    const minDurationMs = Number(runtimeParams.min_duration_ms ?? 0);
    const maxDurationMs = optionalNumber(runtimeParams.max_duration_ms);
    const hitPolicy = String(runtimeParams.hit_policy ?? "first_hit");
    const pierceCount = Math.max(0, Math.round(Number(runtimeParams.pierce_count ?? 0)));
    const isPiercingProjectile = pierceCount > 0;
    const farthestTarget = damageTargets.reduce((farthest, item) => (
      distance(item.enemy, caster) > distance(farthest, caster) ? item.enemy : farthest
    ), target);
    const farthestLength = Math.hypot(
      farthestTarget.x - baseLaunch.spawnWorldPosition.x,
      farthestTarget.y - baseLaunch.spawnWorldPosition.y
    ) || baseLaunch.distance;
    const visualLength = isPiercingProjectile
      ? Math.max(1, Number(runtimeParams.max_distance ?? farthestLength))
      : farthestLength;
    const durationMs = clampProjectileDuration(Math.round((visualLength / projectileSpeed) * 1000), minDurationMs, maxDurationMs);
    const start = baseLaunch.spawnWorldPosition;
    const direction = baseLaunch.directionWorld;
    const projectileVfxKey = skill.presentation_keys?.projectile_vfx_key ?? skill.presentation_keys?.vfx ?? skill.visual_effect;
    const hitVfxKey = skill.presentation_keys?.hit_vfx_key ?? skill.presentation_keys?.vfx ?? skill.visual_effect;
    const sfxKey = skill.presentation_keys?.sfx ?? "";
    const reasonKey = skill.presentation_keys?.screen_feedback ?? "";
    const floatingKey = skill.presentation_keys?.floating_text ?? "skill_event.fire_bolt.floating_text";
    const vfxScale = skillPreviewVfxScale(skill);
    const projectileDirections = projectileSpreadDirections(direction, projectileCount, spreadAngleDeg, angleStepDeg);
    const projectileSpawns = projectileDirections.map((projectileDirection, index) => {
      const spawnWorldPosition = start;
      const laneEnd = {
        x: spawnWorldPosition.x + projectileDirection.x * visualLength,
        y: spawnWorldPosition.y + projectileDirection.y * visualLength
      };
      const shotDelayMs = index * burstIntervalMs;
      const velocityWorld = {
        x: projectileDirection.x * projectileSpeed,
        y: projectileDirection.y * projectileSpeed
      };
      const projectileId = `${skill.active_gem_instance_id}.${Math.round(elapsedRef.current * 1000)}.projectile.${index + 1}`;
      return {
        timestamp_ms: Math.round(elapsedRef.current * 1000) + shotDelayMs,
        source_entity: "player",
        target_entity: String(target.id),
        direction: projectileDirection,
        damage_type: skill.damage_type,
        skill_instance_id: skill.active_gem_instance_id,
        vfx_key: projectileVfxKey,
        sfx_key: sfxKey,
        event_id: `${skill.active_gem_instance_id}.${target.id}.projectile_spawn.${index + 1}.${Math.round(elapsedRef.current * 1000)}`,
        type: "projectile_spawn" as const,
        position: spawnWorldPosition,
        delay_ms: shotDelayMs,
        duration_ms: durationMs,
        amount: null,
        reason_key: "",
        payload: {
          end_position: laneEnd,
          spawn_world_position: spawnWorldPosition,
          target_world_position: target,
          direction_world: projectileDirection,
          velocity_world: velocityWorld,
          projectile_id: projectileId,
          skill_id: skill.skill_package_id ?? skill.skill_template_id,
          vfx_spawn_world_position: spawnWorldPosition,
          vfx_direction_world: projectileDirection,
          projectile_index: index + 1,
          projectile_count: projectileCount,
          burst_interval_ms: burstIntervalMs,
          spread_angle_deg: spreadAngleDeg,
          angle_step: angleStepDeg,
          vfx_scale: vfxScale,
          pierce_remaining: pierceCount,
          projectile_speed: projectileSpeed,
          projectile_width: Number(runtimeParams.projectile_width ?? 38),
          projectile_height: Number(runtimeParams.projectile_height ?? 24),
          impact_radius: Number(runtimeParams.impact_radius ?? skill.hit?.hit_radius ?? 18),
          lifetime_ms: durationMs,
          expire_time_ms: Math.round(elapsedRef.current * 1000) + shotDelayMs + durationMs,
          expire_world_position: laneEnd,
          skill_name: skill.name_text
        }
      };
    });
    const base = {
      timestamp_ms: Math.round(elapsedRef.current * 1000),
      source_entity: "player",
      target_entity: String(target.id),
      direction,
      damage_type: skill.damage_type,
      skill_instance_id: skill.active_gem_instance_id,
      vfx_key: projectileVfxKey,
      sfx_key: sfxKey
    };
    return [
      ...projectileSpawns,
      ...damageTargets.flatMap(({ enemy: damageTarget, projectileIndex }, hitIndex) => {
        const projectileDirection = projectileDirections[projectileIndex] ?? direction;
        const hitDistance = Math.hypot(damageTarget.x - start.x, damageTarget.y - start.y) || 1;
        const hitEnd = {
          x: start.x + projectileDirection.x * hitDistance,
          y: start.y + projectileDirection.y * hitDistance
        };
        const projectileEnd = {
          x: start.x + projectileDirection.x * visualLength,
          y: start.y + projectileDirection.y * visualLength
        };
        const projectileHitOrder = damageTargets
          .slice(0, hitIndex)
          .filter((item) => item.projectileIndex === projectileIndex)
          .length;
        const pierceRemaining = Math.max(0, pierceCount - projectileHitOrder);
        const hitDurationMs = clampProjectileDuration(Math.round((hitDistance / projectileSpeed) * 1000), minDurationMs, maxDurationMs);
        const projectileDelayMs = projectileIndex * burstIntervalMs;
        const totalDelayMs = projectileDelayMs + hitDurationMs;
        const damageAmount = skill.final_damage * perProjectileDamageScale;
        const targetBase = {
          ...base,
          target_entity: String(damageTarget.id),
          direction: projectileDirection
        };
        const hitPayload = {
          skill_name: skill.name_text,
          projectile_index: projectileIndex + 1,
          projectile_count: projectileCount,
          projectile_id: `${skill.active_gem_instance_id}.${base.timestamp_ms}.projectile.${projectileIndex + 1}`,
          skill_id: skill.skill_package_id ?? skill.skill_template_id,
          impact_world_position: hitEnd,
          hit_world_position: hitEnd,
          direction_world: projectileDirection,
          pierce_remaining: pierceRemaining,
          projectile_speed: projectileSpeed,
          projectile_width: Number(runtimeParams.projectile_width ?? 38),
          projectile_height: Number(runtimeParams.projectile_height ?? 24),
          impact_radius: Number(runtimeParams.impact_radius ?? skill.hit?.hit_radius ?? 18),
          lifetime_ms: durationMs,
          expire_time_ms: base.timestamp_ms + projectileDelayMs + durationMs,
          expire_world_position: projectileEnd,
          projectile_continues: pierceRemaining > 0,
          impact_kind: pierceRemaining > 0 ? "projectile_hit_continue" : "projectile_final_impact",
          hit_policy: hitPolicy,
          pierce_count: pierceCount,
          vfx_scale: vfxScale
        };
        return [
          {
            ...targetBase,
            event_id: `${skill.active_gem_instance_id}.${damageTarget.id}.p${projectileIndex + 1}.projectile_hit.${hitIndex}.${base.timestamp_ms}`,
            type: "projectile_hit" as const,
            timestamp_ms: base.timestamp_ms + totalDelayMs,
            position: hitEnd,
            delay_ms: totalDelayMs,
            duration_ms: 0,
            amount: null,
            reason_key: reasonKey,
            vfx_key: hitVfxKey,
            payload: hitPayload
          },
          {
            ...targetBase,
            event_id: `${skill.active_gem_instance_id}.${damageTarget.id}.p${projectileIndex + 1}.damage.${hitIndex}.${base.timestamp_ms}`,
            type: "damage" as const,
            timestamp_ms: base.timestamp_ms + totalDelayMs,
            position: hitEnd,
            delay_ms: totalDelayMs,
            duration_ms: 0,
            amount: damageAmount,
            reason_key: reasonKey,
            payload: hitPayload
          },
          {
            ...targetBase,
            event_id: `${skill.active_gem_instance_id}.${damageTarget.id}.p${projectileIndex + 1}.hit_vfx.${hitIndex}.${base.timestamp_ms}`,
            type: "hit_vfx" as const,
            timestamp_ms: base.timestamp_ms + totalDelayMs,
            position: hitEnd,
            delay_ms: totalDelayMs,
            duration_ms: FIRE_BOLT_IMPACT_DURATION_MS,
            amount: null,
            reason_key: reasonKey,
            vfx_key: hitVfxKey,
            payload: hitPayload
          },
          {
            ...targetBase,
            event_id: `${skill.active_gem_instance_id}.${damageTarget.id}.p${projectileIndex + 1}.floating_text.${hitIndex}.${base.timestamp_ms}`,
            type: "floating_text" as const,
            timestamp_ms: base.timestamp_ms + totalDelayMs,
            position: { x: hitEnd.x, y: hitEnd.y - 28 },
            delay_ms: totalDelayMs,
            duration_ms: 800,
            amount: damageAmount,
            reason_key: floatingKey,
            payload: { ...hitPayload, text: `${Math.round(damageAmount)}点${damageTypeText(skill.damage_type)}伤害` }
          }
        ];
      })
    ];
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

  function consumeSkillEvent(event: SkillEvent) {
    consumeSkillEventBatch([event]);
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
    const angleDeg = startAngle + (360 / orbCount) * orbIndex + speed * (tickTimeMs / 1000);
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
      x: center.x + Math.cos(angleRad) * radius,
      y: center.y + Math.sin(angleRad) * radius
    };
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

    for (const event of events) {
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
        const followedOrbitPosition = typeof payload.orbit_id === "string" ? liveOrbitPosition(payload, event.position) : null;
        const origin = followedOrbitPosition ?? ((payload.origin_world_position ?? payload.origin ?? event.position) as { x?: number; y?: number });
        const direction = (payload.direction_world ?? payload.facing_direction ?? event.direction) as { x?: number; y?: number };
        const shape = String(payload.shape ?? "circle") === "rectangle" ? "rectangle" : "circle";
        const duration = Math.max(0.18, event.duration_ms / 1000);
        const zoneId = typeof payload.zone_id === "string" ? payload.zone_id : event.event_id;
        const radius = Math.max(1, Number(payload.radius ?? 120));
        const maxTargets = Math.max(1, Math.round(Number(payload.max_targets ?? (enemies.length || 1))));
        const orbitHitTargets = followedOrbitPosition && event.type === "damage_zone"
          ? enemies
            .filter((enemy) => enemy.hp > 0)
            .map((enemy) => ({ enemy, distance: distance({ x: enemy.x, y: enemy.y }, followedOrbitPosition) }))
            .filter((item) => item.distance <= radius)
            .sort((left, right) => left.distance - right.distance)
            .slice(0, maxTargets)
          : [];
        const renderPayload = followedOrbitPosition
          ? { ...payload, origin: followedOrbitPosition, origin_world_position: followedOrbitPosition, orb_position: followedOrbitPosition, hit_target_count: orbitHitTargets.length }
          : payload;
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
          vfxScale: normalizedVfxScale(payload.vfx_scale)
        });
        if (followedOrbitPosition && orbitHitTargets.length > 0) {
          const hitVfxKey = typeof payload.hit_vfx_key === "string" ? payload.hit_vfx_key : event.vfx_key;
          const reasonKey = typeof payload.reason_key === "string" ? payload.reason_key : event.reason_key;
          const floatingKey = typeof payload.floating_text_key === "string" ? payload.floating_text_key : "";
          const damageAmount = Number(payload.damage_amount ?? 0);
          nextHitVfxs.push({
            id: nextHitVfxId.current++,
            x: followedOrbitPosition.x,
            y: followedOrbitPosition.y,
            projectileId: typeof payload.orbit_id === "string" ? payload.orbit_id : undefined,
            projectileIndex: Number(payload.orb_index ?? 0) + 1,
            projectileCount: Number(payload.orb_count ?? 1),
            impactKind: "orbit_damage_zone",
            ttl: FIRE_BOLT_IMPACT_DURATION_MS / 1000,
            duration: FIRE_BOLT_IMPACT_DURATION_MS / 1000,
            damageType: event.damage_type,
            vfxKey: hitVfxKey,
            skillTemplateId: event.skill_instance_id,
            vfxScale: normalizedVfxScale(payload.vfx_scale)
          });
          for (const [targetIndex, item] of orbitHitTargets.entries()) {
            const targetPosition = { x: item.enemy.x, y: item.enemy.y };
            const hitPayload = {
              ...renderPayload,
              target_world_position: targetPosition,
              hit_world_position: targetPosition,
              target_distance: item.distance
            };
            damageEvents.push({
              ...event,
              event_id: `${event.event_id}.${item.enemy.id}.damage.${targetIndex}`,
              type: "damage",
              target_entity: String(item.enemy.id),
              position: targetPosition,
              direction: guideDirection(followedOrbitPosition, targetPosition),
              amount: damageAmount,
              vfx_key: hitVfxKey,
              reason_key: reasonKey,
              payload: hitPayload
            });
            nextTexts.push({
              id: nextTextId.current++,
              x: targetPosition.x,
              y: targetPosition.y - 28,
              text: `${Math.round(damageAmount)}点${damageTypeText(event.damage_type)}伤害`,
              ttl: 0.8,
              duration: 0.8
            });
          }
        }
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
          projectileId: typeof payload.projectile_id === "string" ? payload.projectile_id : undefined,
          ttl: 0.18,
          duration: 0.18,
          damageType: event.damage_type,
          vfxKey: event.vfx_key,
          skillTemplateId: event.skill_instance_id,
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
          vfxScale: normalizedVfxScale(payload.vfx_scale)
        });
        continue;
      }
      if (event.type === "projectile_spawn") {
        const endPosition = event.payload?.expire_world_position ?? event.payload?.end_position ?? event.position;
        const velocityWorld = event.payload?.velocity_world as { x?: number; y?: number } | undefined;
        const lifetimeMs = Number(event.payload?.lifetime_ms ?? event.duration_ms);
        const aliveDuration = Math.max(0.001, lifetimeMs / 1000);
        nextBolts.push({
          id: nextBoltId.current++,
          x: event.position.x,
          y: event.position.y,
          targetX: endPosition.x,
          targetY: endPosition.y,
          directionX: (event.payload?.direction_world as { x?: number; y?: number } | undefined)?.x ?? event.direction.x,
          directionY: (event.payload?.direction_world as { x?: number; y?: number } | undefined)?.y ?? event.direction.y,
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
          impactRadius: Number(event.payload?.impact_radius ?? 18),
          trajectory: String(event.payload?.trajectory ?? "linear"),
          arcHeight: Number(event.payload?.arc_height ?? 0),
          ttl: aliveDuration + PROJECTILE_BODY_EXIT_FADE_DURATION,
          duration: aliveDuration,
          fadeDuration: PROJECTILE_BODY_EXIT_FADE_DURATION,
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
      if (event.type === "damage") {
        damageEvents.push(event);
        continue;
      }
      if (event.type === "hit_vfx") {
        const eventVfxKind = projectileVfxKind(event.vfx_key) ?? projectileVfxKind(event.skill_instance_id);
        const visualDuration = eventVfxKind === "penetrating_shot" ? PENETRATING_SHOT_IMPACT_DURATION_MS / 1000 : Math.max(0.12, event.duration_ms / 1000);
        nextHitVfxs.push({
          id: nextHitVfxId.current++,
          x: event.position.x,
          y: event.position.y,
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
          vfxScale: normalizedVfxScale(event.payload?.vfx_scale)
        });
        continue;
      }
      if (event.type === "floating_text") {
        nextTexts.push({
          id: nextTextId.current++,
          x: event.position.x,
          y: event.position.y,
          text: typeof event.payload?.text === "string" ? event.payload.text : Math.round(Number(event.amount ?? 0)).toString(),
          ttl: Math.max(0.3, event.duration_ms / 1000),
          duration: Math.max(0.3, event.duration_ms / 1000)
        });
      }
    }

    if (nextChainSegments.length > 0) {
      setChainSegments((items) => capRuntimeVisualBudget([...items, ...nextChainSegments], MAX_RUNTIME_AREA_VFX));
    }
    if (nextDamageZones.length > 0) {
      setDamageZones((items) => capRuntimeVisualBudget(
        [
          ...items.filter((zone) => !zone.zoneId || !replaceDamageZoneIds.has(zone.zoneId)),
          ...nextDamageZones
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

  function applyDamageEventBatch(events: SkillEvent[]) {
    const damageByTarget = new Map<number, number>();
    for (const event of events) {
      const targetId = Number(event.target_entity);
      if (!Number.isFinite(targetId)) continue;
      damageByTarget.set(targetId, (damageByTarget.get(targetId) ?? 0) + Number(event.amount ?? 0));
    }
    if (damageByTarget.size === 0) return;
    let killed = 0;
    setEnemies((current) => {
      const next = current
        .map((enemy) => {
          const damage = damageByTarget.get(enemy.id) ?? 0;
          if (damage <= 0) return enemy;
          const hp = enemy.hp - damage;
          if (hp <= 0) killed += 1;
          return { ...enemy, hp, lastDamagedAt: elapsedRef.current };
        })
        .filter((enemy) => enemy.hp > 0);
      enemiesStateRef.current = next;
      return next;
    });
    if (killed > 0) {
      const skillName = events.find((event) => typeof event.payload?.skill_name === "string")?.payload?.skill_name ?? "技能";
      setKills((value) => value + killed);
      setCombatLogs((logs) => [`${skillName} 击杀 ${killed} 个怪物。`, ...logs].slice(0, 8));
    }
  }

  function consumeSkillEventLegacy(event: SkillEvent) {
    if (event.type === "chain_segment") {
      const payload = event.payload ?? {};
      const start = (payload.start_position ?? event.position) as { x?: number; y?: number };
      const end = (payload.end_position ?? payload.target_world_position ?? event.position) as { x?: number; y?: number };
      const duration = Math.max(0.16, event.duration_ms / 1000);
      setChainSegments((items) => [
        ...items,
        {
          id: nextChainSegmentId.current++,
          startX: Number(start.x ?? event.position.x),
          startY: Number(start.y ?? event.position.y),
          endX: Number(end.x ?? event.position.x),
          endY: Number(end.y ?? event.position.y),
          ttl: duration,
          duration,
          damageType: event.damage_type,
          vfxKey: event.vfx_key,
          segmentIndex: Number(payload.segment_index ?? 0),
          segmentId: typeof payload.segment_id === "string" ? payload.segment_id : event.event_id,
          skillId: typeof payload.skill_id === "string" ? payload.skill_id : event.skill_instance_id,
          vfxScale: normalizedVfxScale(payload.vfx_scale)
        }
      ]);
      return;
    }
    if (event.type === "damage_zone_prime" || event.type === "damage_zone") {
      const payload = event.payload ?? {};
      const origin = (payload.origin_world_position ?? payload.origin ?? event.position) as { x?: number; y?: number };
      const direction = (payload.direction_world ?? payload.facing_direction ?? event.direction) as { x?: number; y?: number };
      const shape = String(payload.shape ?? "circle") === "rectangle" ? "rectangle" : "circle";
      const duration = Math.max(0.18, event.duration_ms / 1000);
      const zoneId = typeof payload.zone_id === "string" ? payload.zone_id : event.event_id;
      const nextZone = {
        id: nextDamageZoneId.current++,
        x: Number(origin.x ?? event.position.x),
        y: Number(origin.y ?? event.position.y),
        shape,
        radius: Math.max(1, Number(payload.radius ?? 120)),
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
        vfxScale: normalizedVfxScale(payload.vfx_scale)
      };
      setDamageZones((items) => event.type === "damage_zone"
        ? [...items.filter((zone) => zone.zoneId !== zoneId), nextZone]
        : [...items, nextZone]
      );
      return;
    }
    if (event.type === "projectile_impact") {
      const payload = event.payload ?? {};
      const impact = (payload.impact_position ?? event.position) as { x?: number; y?: number };
      setHitVfxs((items) => [
        ...items,
        {
          id: nextHitVfxId.current++,
          x: Number(impact.x ?? event.position.x),
          y: Number(impact.y ?? event.position.y),
          projectileId: typeof payload.projectile_id === "string" ? payload.projectile_id : undefined,
          ttl: 0.18,
          duration: 0.18,
          damageType: event.damage_type,
          vfxKey: event.vfx_key,
          skillTemplateId: event.skill_instance_id,
          vfxScale: normalizedVfxScale(payload.vfx_scale)
        }
      ]);
      return;
    }
    if (event.type === "melee_arc") {
      const payload = event.payload ?? {};
      const origin = (payload.origin_world_position ?? payload.origin ?? event.position) as { x?: number; y?: number };
      const direction = (payload.direction_world ?? payload.facing_direction ?? event.direction) as { x?: number; y?: number };
      const duration = Math.max(0.18, event.duration_ms / 1000);
      setMeleeArcs((items) => [
        ...items,
        {
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
        }
      ]);
      return;
    }
    if (event.type === "area_spawn") {
      const payload = event.payload ?? {};
      const center = (payload.center_world_position ?? payload.center ?? event.position) as { x?: number; y?: number };
      const duration = Math.max(0.25, event.duration_ms / 1000);
      setAreaNovas((items) => [
        ...items,
        {
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
          vfxScale: normalizedVfxScale(payload.vfx_scale)
        }
      ]);
      return;
    }
    if (event.type === "projectile_spawn") {
      const endPosition = event.payload?.expire_world_position ?? event.payload?.end_position ?? event.position;
      const velocityWorld = event.payload?.velocity_world as { x?: number; y?: number } | undefined;
      const lifetimeMs = Number(event.payload?.lifetime_ms ?? event.duration_ms);
      const aliveDuration = Math.max(0.001, lifetimeMs / 1000);
      setBolts((items) => [
        ...items,
        {
          id: nextBoltId.current++,
          x: event.position.x,
          y: event.position.y,
          targetX: endPosition.x,
          targetY: endPosition.y,
          directionX: (event.payload?.direction_world as { x?: number; y?: number } | undefined)?.x ?? event.direction.x,
          directionY: (event.payload?.direction_world as { x?: number; y?: number } | undefined)?.y ?? event.direction.y,
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
          impactRadius: Number(event.payload?.impact_radius ?? 18),
          trajectory: String(event.payload?.trajectory ?? "linear"),
          arcHeight: Number(event.payload?.arc_height ?? 0),
          ttl: aliveDuration + PROJECTILE_BODY_EXIT_FADE_DURATION,
          duration: aliveDuration,
          fadeDuration: PROJECTILE_BODY_EXIT_FADE_DURATION,
          skillTemplateId: event.skill_instance_id,
          behaviorType: "projectile",
          damageType: event.damage_type,
          visualEffect: event.vfx_key,
          vfxKey: event.vfx_key,
          shapeEffects: [],
          areaScale: 1,
          vfxScale: normalizedVfxScale(event.payload?.vfx_scale)
        }
      ]);
      return;
    }
    if (event.type === "damage") {
      const targetId = Number(event.target_entity);
      let killed = 0;
      setEnemies((current) => {
        const next = current
          .map((enemy) => {
            if (enemy.id !== targetId) return enemy;
            const hp = enemy.hp - Number(event.amount ?? 0);
            if (hp <= 0) killed += 1;
            return { ...enemy, hp, lastDamagedAt: elapsedRef.current };
          })
          .filter((enemy) => enemy.hp > 0);
        enemiesStateRef.current = next;
        return next;
      });
      if (killed > 0) {
        setKills((value) => value + killed);
        setCombatLogs((logs) => [`${event.payload?.skill_name ?? "技能"} 击杀 ${killed} 个怪物。`, ...logs].slice(0, 8));
      }
      return;
    }
    if (event.type === "hit_vfx") {
      const eventVfxKind = projectileVfxKind(event.vfx_key) ?? projectileVfxKind(event.skill_instance_id);
      const visualDuration = eventVfxKind === "penetrating_shot" ? PENETRATING_SHOT_IMPACT_DURATION_MS / 1000 : Math.max(0.12, event.duration_ms / 1000);
      setHitVfxs((items) => [
        ...items,
        {
          id: nextHitVfxId.current++,
          x: event.position.x,
          y: event.position.y,
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
          vfxScale: normalizedVfxScale(event.payload?.vfx_scale)
        }
      ]);
      return;
    }
    if (event.type === "floating_text") {
      setTexts((items) => [
        ...items,
        {
          id: nextTextId.current++,
          x: event.position.x,
          y: event.position.y,
          text: event.payload?.text ?? `${Math.round(Number(event.amount ?? 0))}点${damageTypeText(event.damage_type)}伤害`,
          ttl: Math.max(0.35, event.duration_ms / 1000),
          duration: Math.max(0.35, event.duration_ms / 1000)
        }
      ]);
    }
  }

  async function placeFloatingItem(current: FloatingGem, target: DropTarget, event: globalThis.MouseEvent): Promise<PlacementResult> {
    if (target.kind === "invalid") return { type: "reject" };
    if (isDropBackToOrigin(current, target, state, inventorySlots)) return { type: "place" };
    if (target.kind === "bag") return await placeItemInBag(current, target.slotIndex);
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
    if (!dragged.board_position) {
      setInventorySlots((slots) => moveItemToInventorySlot(slots, instanceId, slotIndex));
      return targetItem ? { type: "swap", nextFloatingItem: targetItem, origin: { kind: "bag", slotIndex, instanceId: targetItem.instance_id } } : { type: "place" };
    }

    try {
      const nextState = await requestState("/api/unmount", { instance_id: instanceId });
      setState(nextState);
      setInventorySlots((slots) => moveItemToInventorySlot(slots, instanceId, slotIndex));
      return targetItem ? { type: "swap", nextFloatingItem: targetItem, origin: { kind: "bag", slotIndex, instanceId: targetItem.instance_id } } : { type: "place" };
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "操作失败。");
      return { type: "reject" };
    }
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

    try {
      if (dragged.board_position) {
        await requestState("/api/unmount", { instance_id: instanceId });
      }
      if (targetItem) {
        await requestState("/api/unmount", { instance_id: targetItem.instance_id });
      }
      const nextState = await requestState("/api/mount", { instance_id: instanceId, row, column });
      setState(nextState);
      setInventorySlots((slots) => removeItemsFromInventorySlots(slots, [instanceId, targetItem?.instance_id ?? ""]));
      setNotice(`已将${dragged.name_text}放入第${row + 1}行第${column + 1}列。`);
      return targetItem ? { type: "swap", nextFloatingItem: targetItem, origin: { kind: "board", row, column } } : { type: "place" };
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "操作失败。");
      return { type: "reject" };
    }
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
    try {
      const gem = state?.inventory.find((item) => item.instance_id === instanceId);
      const nextState = await requestState("/api/unmount", { instance_id: instanceId });
      setState(nextState);
      setNotice(gem ? `已取下${gem.name_text}。` : "宝石已下盘。");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "操作失败。");
    }
  }

  async function runServerCombat() {
    try {
      const nextState = await requestState("/api/combat/start", {});
      setState(nextState);
      if (nextState.drops.length > 0) setNotice(`掉落：${nextState.drops.map((drop) => drop.name_text).join("、")}。`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "战斗结算失败。");
    }
  }

  function startGame() {
    if (!selectedMapId) {
      setNotice("请先选择地图。");
      return;
    }
    if (!battleMap) {
      setNotice("地图资源仍在加载，请稍候。");
      return;
    }
    setGameFailureOpen(false);
    setPlaying(true);
    setBagOpen(false);
    setRuntimePlayer((current) => ({
      ...current,
      hp: current.maxHp,
      currentEnergyShield: current.maxEnergyShield
    }));
    triggeredEncounterSourceIds.current = new Set();
    let startedProceduralSpawnPlan = false;
    let spawnDebugLog: string | null = null;
    if (skillEditorMode) {
      setAuthoredSpawnPlanActive(false);
      setAuthoredAggroSources([]);
      setSpawnPlanWarnings([]);
      setProceduralSpawnDebug(null);
      const nextEnemies = createSkillTestDummies(1, player.x, player.y);
      enemiesStateRef.current = nextEnemies;
      setEnemies(nextEnemies);
      nextEnemyId.current = SKILL_TEST_DUMMY_OFFSETS.length + 1;
    } else {
      const proceduralSpawnPlan = createProceduralSpawnPlanEnemies(battleMap, nextEnemyId.current, selectedMapId);
      if (proceduralSpawnPlan.enemies.length > 0) {
        nextEnemyId.current = proceduralSpawnPlan.nextId;
        setAuthoredSpawnPlanActive(true);
        setAuthoredAggroSources(proceduralSpawnPlan.aggroSources);
        startedProceduralSpawnPlan = true;
        setSpawnPlanWarnings([]);
        setProceduralSpawnDebug(proceduralSpawnPlan.debug);
        enemiesStateRef.current = proceduralSpawnPlan.enemies;
        setEnemies(proceduralSpawnPlan.enemies);
        spawnDebugLog = proceduralSpawnLogLine(proceduralSpawnPlan.debug);
      } else {
        setProceduralSpawnDebug(proceduralSpawnPlan.debug);
      }

      if (!startedProceduralSpawnPlan) {
        setAuthoredSpawnPlanActive(false);
        setAuthoredAggroSources([]);
        setSpawnPlanWarnings([]);
        setProceduralSpawnDebug(null);
        const nextEnemies = [
          createEnemy(nextEnemyId.current++, player.x, player.y, battleMap),
          createEnemy(nextEnemyId.current++, player.x, player.y, battleMap),
          createEnemy(nextEnemyId.current++, player.x, player.y, battleMap, "elite")
        ];
        enemiesStateRef.current = nextEnemies;
        setEnemies(nextEnemies);
      }
    }
    setCombatLogs([
      `${battleMap.displayName} 战斗开始。WASD 移动，技能会自动释放。`,
      ...(spawnDebugLog ? [spawnDebugLog] : [])
    ]);
    setNotice(startedProceduralSpawnPlan
      ? `${battleMap.displayName} 程序化遭遇战斗中。按 C 管理背包。`
      : `${battleMap.displayName} 战斗中。按 C 管理背包。`
    );
    if (!skillEditorMode) void runServerCombat();
  }

  async function openSkillEditorPanel() {
    setSkillEditorOpen(true);
    try {
      const nextState = await requestState("/api/state");
      setState(nextState);
      const selectedStillOpenable = nextState.skill_editor?.entries.some(
        (entry) => entry.id === selectedSkillEditorId && entry.openable
      );
      if (!selectedStillOpenable) {
        setSelectedSkillEditorId(nextState.skill_editor?.selected_id ?? null);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "技能编辑器刷新失败。");
    }
  }

  function beginDrag(event: DragEvent) {
    event.preventDefault();
  }

  function beginPointerDrag(event: MouseEvent, gem: Gem, origin: FloatingOrigin) {
    if (event.button !== 0) return;
    if (floatingGemRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    setTooltip(null);
    setHoveredGemId(null);
    setFloatingItem(gem, origin, event.clientX, event.clientY);
  }

  function onGemHover(event: MouseEvent, gem: Gem, source: "board" | "inventory", slotIndex?: number) {
    setHoveredGemId(gem.instance_id);
    setTooltip({ gem, ...resolveTooltipPosition(event.currentTarget as HTMLElement, source, slotIndex) });
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
  const bagSlots = inventorySlots.map((instanceId) => (instanceId ? fullGemById.get(instanceId) ?? null : null));

  if (!state) return <main className="game-screen loading">{notice}</main>;
  const runtimeUsesEditorMap = battleMap ? isEditorRuntimeBattleMap(battleMap) : false;
  const battleCamera = createBattleCamera(player.x, player.y, skillEditorMode ? skillEditorCameraSettings.zoom : runtimeUsesEditorMap ? 1 : BATTLE_CAMERA_ZOOM);
  const visibleEnemies = selectRenderableEnemies(enemies, player);
  const sortedRenderItems = createBattleRenderItems(player, visibleEnemies, bolts, hitVfxs, runtimeUsesEditorMap ? MAP_EDITOR_PLAYER_RENDER_SCALE : UNIT_RENDER_SCALE);
  const animationNowMs = elapsed * 1000;
  const battleAnimationContexts = createBattleAnimationContexts(playerVisual.current, enemyVisuals.current, visibleEnemies, player, animationNowMs, statNumber(state.player_stats?.move_speed, 1));
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
      moving: Math.hypot(playerVisual.current.movementVector.x, playerVisual.current.movementVector.y) > 0.001
    },
    enemies: visibleEnemies.map((enemy) => ({
      id: enemy.id,
      x: enemy.x,
      y: enemy.y,
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      monsterId: enemy.monsterId,
      boss: enemy.boss,
      runtimeTier: enemy.runtimeTier
    })),
    projectiles: bolts.map((bolt) => ({
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
      projectileWidth: bolt.projectileWidth,
      projectileHeight: bolt.projectileHeight,
      projectileSpeed: bolt.projectileSpeed,
      damageType: bolt.damageType,
      vfxKey: bolt.vfxKey,
      ttl: bolt.ttl,
      duration: bolt.duration
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
        x: nova.x,
        y: nova.y,
        radius: nova.radius,
        damageType: nova.damageType,
        vfxKey: nova.vfxKey,
        ttl: nova.ttl,
        duration: nova.duration
      })),
      ...damageZones.map((zone) => ({
        id: zone.id,
        kind: "damage-zone" as const,
        x: zone.x,
        y: zone.y,
        radius: zone.shape === "circle" ? zone.radius : undefined,
        width: zone.shape === "rectangle" ? zone.length : undefined,
        height: zone.shape === "rectangle" ? zone.width : undefined,
        directionX: zone.directionX,
        directionY: zone.directionY,
        damageType: zone.damageType,
        vfxKey: zone.vfxKey,
        warning: zone.warning,
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
    hits: hitVfxs.map((vfx) => ({
      id: vfx.id,
      x: vfx.x,
      y: vfx.y,
      radius: Math.max(vfx.impactRadius ?? 0, vfx.projectileWidth ?? 0, vfx.projectileHeight ?? 0) * 0.5,
      damageType: vfx.damageType,
      vfxKey: vfx.vfxKey,
      ttl: vfx.ttl,
      duration: vfx.duration
    })),
    texts: texts.map((text) => ({
      id: text.id,
      x: text.x,
      y: text.y,
      text: text.text,
      ttl: text.ttl,
      duration: text.duration
    }))
  };

  return (
    <main className="game-screen">
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
            {skillEditorMode && (
              <SkillRuntimeGuideLayer
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
              <div key={text.id} className="floating-text" style={floatingTextStyle(text)}>{text.text}</div>
            ))}
          </div>
        </div>
        <BattleGeometryCanvas snapshot={battleGeometrySnapshot} />
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
            <button type="button" onClick={startGame}>重新挑战</button>
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

      {!playing && !skillEditorMode && (
        <MapSelectionPanel
          selectedMapId={selectedMapId}
          battleMap={battleMap}
          onSelect={setSelectedMapId}
          onStart={startGame}
        />
      )}

      <section className="combat-feed" aria-label="战斗日志">
        {combatLogs.map((log, index) => <p key={index}>{log}</p>)}
      </section>

      <PlayerResourceHud state={state} player={player} inventoryMode={bagOpen} />

      {bagOpen && (
        <section className="inventory-overlay" aria-label="背包界面">
          <CharacterInfoPanel state={state} player={player} />
          <section className="right-workbench">
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

function PlayerResourceHud({ state, player, inventoryMode }: { state: AppState; player: PlayerRuntimeState; inventoryMode: boolean }) {
  const maxLife = Math.max(0, player.maxHp);
  const currentLife = clamp(player.hp, 0, maxLife);
  const maxShield = Math.max(0, player.maxEnergyShield);
  const currentShield = clamp(player.currentEnergyShield, 0, maxShield);
  const maxMana = Math.max(0, statNumber(state.player_stats?.max_mana, 0));
  const currentMana = clamp(statNumber(state.player_stats?.current_mana, maxMana), 0, maxMana);

  return (
    <aside className={`player-resource-hud${inventoryMode ? " inventory-mode" : ""}`} aria-label="玩家资源">
      <div className="player-resource-side player-resource-side-left">
        <ResourceOrb kind="life" label="生命" current={currentLife} max={maxLife} />
        <div className="player-resource-lines">
          <ResourceLine kind="life" label="生命" current={currentLife} max={maxLife} />
          <ResourceLine kind="shield" label="护盾" current={currentShield} max={maxShield} />
        </div>
      </div>
      <div className="player-resource-center" aria-hidden="true">
        <span />
      </div>
      <div className="player-resource-side player-resource-side-right">
        <div className="player-resource-lines">
          <ResourceLine kind="mana" label="魔力" current={currentMana} max={maxMana} />
        </div>
        <ResourceOrb kind="mana" label="魔力" current={currentMana} max={maxMana} />
      </div>
    </aside>
  );
}

function ResourceOrb({ kind, label, current, max }: { kind: string; label: string; current: number; max: number }) {
  return (
    <div className={`player-resource-orb player-resource-orb-${kind}`} aria-hidden="true">
      <span style={{ height: `${resourcePercent(current, max)}%` }} />
      <strong>{label}</strong>
    </div>
  );
}

function ResourceLine({ kind, label, current, max }: { kind: string; label: string; current: number; max: number }) {
  return (
    <div className={`player-resource-line player-resource-line-${kind}`}>
      <div>
        <span>{label}</span>
        <strong>{formatResourceValue(current)} / {formatResourceValue(max)}</strong>
      </div>
      <div className="player-resource-track" aria-hidden="true">
        <span style={{ width: `${resourcePercent(current, max)}%` }} />
      </div>
    </div>
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

function MapSelectionPanel({
  selectedMapId,
  battleMap,
  onSelect,
  onStart
}: {
  selectedMapId: string | null;
  battleMap: BakedBattleMapData | null;
  onSelect: (mapId: string) => void;
  onStart: () => void;
}) {
  const mapOptions = runtimeBattleMapOptions();
  return (
    <section className="map-selection-panel" aria-label="地图选择">
      <h2>选择战斗地图</h2>
      <div className="map-selection-list">
        {mapOptions.map((map) => {
          const selected = selectedMapId === map.id;
          return (
            <button
              key={map.id}
              type="button"
              className={selected ? "map-selection-card selected" : "map-selection-card"}
              onClick={() => onSelect(map.id)}
            >
              <strong>{map.displayName}</strong>
              <span>生态：{map.biome}</span>
              <span>尺寸：{map.worldWidth} x {map.worldHeight}</span>
            </button>
          );
        })}
      </div>
      <button className="start-button" type="button" disabled={!battleMap} onClick={onStart}>
        {battleMap ? "进入战斗" : selectedMapId ? "地图加载中" : "请选择地图"}
      </button>
    </section>
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
  onHoverGem: (event: MouseEvent, gem: Gem, source: "board" | "inventory", slotIndex?: number) => void;
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

function resolveTooltipPosition(anchor: HTMLElement, source: "board" | "inventory", slotIndex?: number): Omit<Tooltip, "gem"> {
  if (source === "board") return getBoardTooltipPosition(anchor);
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
  return { kind: "invalid" };
}

function isDropBackToOrigin(floatingGem: FloatingGem, target: DropTarget, state: AppState | null, inventorySlots: (string | null)[]) {
  const origin = floatingGem.origin;
  if (origin.kind === "bag") {
    return target.kind === "bag" && origin.slotIndex === target.slotIndex && inventorySlots[target.slotIndex] === floatingGem.gem.instance_id;
  }
  return (
    target.kind === "board" &&
    origin.row === target.row &&
    origin.column === target.column &&
    state?.board.cells[target.row]?.[target.column]?.gem?.instance_id === floatingGem.gem.instance_id
  );
}

function reconcileInventorySlots(current: (string | null)[], state: AppState, floatingItemId: string | null) {
  const unmountedIds = new Set(state.inventory.filter((gem) => !gem.board_position).map((gem) => gem.instance_id));
  const next = Array(INVENTORY_SLOT_COUNT).fill(null) as (string | null)[];
  const used = new Set<string>();

  current.slice(0, INVENTORY_SLOT_COUNT).forEach((instanceId, index) => {
    if (instanceId && instanceId !== floatingItemId && unmountedIds.has(instanceId) && !used.has(instanceId)) {
      next[index] = instanceId;
      used.add(instanceId);
    }
  });

  for (const gem of state.inventory) {
    if (gem.board_position || gem.instance_id === floatingItemId || used.has(gem.instance_id)) continue;
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
  const [arenaSkillId, setArenaSkillId] = useState("active_fire_bolt");
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
            <SelectInput label="目标规则" value={String(projectileModuleParams.target_policy ?? "target_position")} options={[{ value: "nearest_enemy", text: "nearest_enemy" }, { value: "locked_target", text: "locked_target" }, { value: "target_position", text: "target_position" }]} disabled={!canEdit} onChange={(value) => updateModuleParam(projectileModuleIndex, "target_policy", value)} />
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

function createProceduralSpawnPlanEnemies(map: BakedBattleMapData, startId: number, selectedMapId: string | null) {
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
  const result = generateProceduralMonsterSpawns(spawnMap, mapSpawnV1Config as MapSpawnV1Config, {
    startId,
    seed: `${selectedMapId ?? map.id}:${map.displayName}:v1`
  });
  const enemies: Enemy[] = result.enemies.map((monster) => ({
    id: monster.runtime_id,
    x: monster.x,
    y: monster.y,
    hp: monster.hp,
    maxHp: monster.max_hp,
    monsterId: monster.monster_id,
    authored: true,
    boss: monster.boss,
    spawnPlanSourceId: monster.aggro_source_id,
    proceduralMonsterPackId: monster.monster_pack_id,
    proceduralZoneType: monster.zone_type,
    spawnRarity: monster.spawn_rarity,
    lifeMultiplier: monster.life_multiplier,
    damageMultiplier: monster.damage_multiplier,
    baseDamage: monster.base_damage,
    damageType: monster.damage_type,
    hitKind: monster.hit_kind,
    attackRange: monster.attack_range,
    attackCadenceMs: monster.attack_cadence_ms,
    offenseModifiers: monster.offense_modifiers,
    runtimeTier: monster.boss ? "active" : "dormant",
    nextThinkAt: 0
  }));
  const aggroSources: RuntimeEncounterAggroSource[] = result.aggroSources.map((source) => ({
    id: source.id,
    kind: source.kind,
    x: source.x,
    y: source.y,
    aggroRadius: source.aggroRadius
  }));
  return { enemies, aggroSources, nextId: result.nextId, debug: result.debug };
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
  return queryEnemySpatialIndex(createEnemySpatialIndex(enemies), center, radius);
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

function enemyNavigationTargetCells(map: BakedBattleMapData, player: { x: number; y: number }) {
  const center = enemyWorldToGrid(map, player);
  const result: { gridX: number; gridY: number }[] = [];
  if (enemyGridWalkable(map, center.gridX, center.gridY)) result.push(center);
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
  const movingCurrent = current.map((enemy) => resetEnemyEngagement(enemy));
  if (!authoredSpawnPlanActive) {
    const spatialIndex = createEnemySpatialIndex(movingCurrent);
    const navigation = createEnemyNavigationContext(movingCurrent, player, map);
    return separateOverlappingEnemies(
      movingCurrent.map((enemy) => (
        attackLockedEnemyIds.has(enemy.id)
          ? freezeAttackingEnemy(enemy, "active")
          : moveEnemyTowardPlayer(enemy, player, map, dt, "active", spatialIndex, navigation)
      )),
      map,
      attackLockedEnemyIds
    );
  }
  for (const source of aggroSources) {
    if (!triggeredSourceIds.has(source.id) && distance(source, player) <= source.aggroRadius) {
      triggeredSourceIds.add(source.id);
    }
  }
  const spatialIndex = createEnemySpatialIndex(movingCurrent);
  const navigation = createEnemyNavigationContext(movingCurrent, player, map);
  const visibleIds = new Set(queryEnemySpatialIndex(spatialIndex, player, ENEMY_CAMERA_VISIBLE_RANGE).map((enemy) => enemy.id));
  const activeIds = new Set(queryEnemySpatialIndex(spatialIndex, player, ENEMY_ACTIVE_RANGE).map((enemy) => enemy.id));
  const movedEnemies = movingCurrent.map((enemy) => {
    if (enemy.hp <= 0) return { ...enemy, runtimeTier: "dead" as const };
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
  }).filter((enemy) => enemy.runtimeTier !== "dead");
  return separateOverlappingEnemies(movedEnemies, map, attackLockedEnemyIds);
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
  return Math.max(1, enemy.attackRange ?? ENEMY_MELEE_ATTACK_DISTANCE);
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

function resolveMonsterHitAgainstPlayer(enemy: Enemy, player: PlayerRuntimeState, stats: AppState["player_stats"] | undefined) {
  const damageType = enemy.damageType ?? "physical";
  const hitKind = enemy.hitKind ?? "attack";
  const penetrationPercent = monsterOffenseModifier(enemy, "resistance_penetration_percent");
  let incoming = monsterOutgoingDamage(enemy);
  const evasion = statNumber(stats?.evasion, 0);
  const evasionAddPercent = statNumber(stats?.evasion_add_percent, 0);
  const effectiveEvasion = Math.max(0, evasion * (1 + evasionAddPercent / 100));
  const evasionChance = effectiveEvasion > 0 ? Math.min(0.95, effectiveEvasion / (effectiveEvasion + 1000)) : 0;
  incoming *= 1 - evasionChance;

  const blockChanceStat = hitKind === "spell" ? "spell_block_chance_percent" : "attack_block_chance_percent";
  const blockChance = Math.min(0.75, Math.max(0, statNumber(stats?.[blockChanceStat], 0)) / 100);
  const blockReduction = Math.max(0, statNumber(stats?.block_damage_reduction_percent, 0)) / 100;
  incoming *= 1 - blockChance * blockReduction;

  if (damageType === "physical") {
    const armor = statNumber(stats?.armor, 0);
    const armorAddPercent = statNumber(stats?.armor_add_percent, 0);
    const effectiveArmor = Math.max(0, armor * (1 + armorAddPercent / 100));
    const armorReduction = incoming > 0 ? effectiveArmor / (effectiveArmor + 10 * incoming) : 0;
    incoming *= 1 - Math.min(0.9, armorReduction);
    incoming *= 1 - Math.min(0.9, Math.max(0, statNumber(stats?.physical_damage_reduction_percent, 0)) / 100);
  }

  const resistancePercent = playerResistancePercent(stats, damageType, penetrationPercent);
  incoming *= 1 - Math.min(0.9, Math.max(0, resistancePercent) / 100);
  incoming *= 1 - Math.min(0.9, Math.max(0, statNumber(stats?.damage_mitigation_final_percent, 0)) / 100);

  const totalDamage = Math.max(0, incoming);
  const shieldDamage = Math.min(Math.max(0, player.currentEnergyShield), totalDamage);
  const lifeDamage = Math.max(0, totalDamage - shieldDamage);
  const nextPlayer: PlayerRuntimeState = {
    ...player,
    currentEnergyShield: clamp(player.currentEnergyShield - shieldDamage, 0, player.maxEnergyShield),
    hp: clamp(player.hp - lifeDamage, 0, player.maxHp)
  };
  return { damageType, totalDamage, shieldDamage, lifeDamage, nextPlayer };
}

function playerResistancePercent(stats: AppState["player_stats"] | undefined, damageType: string, penetrationPercent: number) {
  if (damageType === "fire") return statNumber(stats?.fire_resistance_percent, 0) + statNumber(stats?.elemental_resistance_percent, 0) - penetrationPercent;
  if (damageType === "cold") return statNumber(stats?.cold_resistance_percent, 0) + statNumber(stats?.elemental_resistance_percent, 0) - penetrationPercent;
  if (damageType === "lightning") return statNumber(stats?.lightning_resistance_percent, 0) + statNumber(stats?.elemental_resistance_percent, 0) - penetrationPercent;
  if (damageType === "chaos") return statNumber(stats?.chaos_resistance_percent, 0) - penetrationPercent;
  return 0;
}

function canEnemyStartAttackVisual(
  enemy: Enemy,
  player: { x: number; y: number },
  previous: EnemyVisualRuntime | undefined,
  nowMs: number
) {
  const attackActive = previous?.attackUntilMs !== undefined && nowMs < previous.attackUntilMs;
  if (attackActive || nowMs < (previous?.nextAttackReadyAtMs ?? 0)) return false;
  if (enemy.authored && !enemy.aggroLocked) return false;
  return distance(enemy, player) <= monsterAttackRange(enemy);
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
  const steering = steerEnemySwarm(enemy, desired, spatialIndex);
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
  const nextVelocity = {
    x: previousVelocity.x + (targetVelocity.x - previousVelocity.x) * ENEMY_SWARM_VELOCITY_LERP,
    y: previousVelocity.y + (targetVelocity.y - previousVelocity.y) * ENEMY_SWARM_VELOCITY_LERP
  };
  const velocityLength = Math.hypot(nextVelocity.x, nextVelocity.y);
  const clampedVelocity = velocityLength > speed
    ? { x: nextVelocity.x / velocityLength * speed, y: nextVelocity.y / velocityLength * speed }
    : nextVelocity;
  const stepDistance = Math.hypot(clampedVelocity.x, clampedVelocity.y) * dt;
  const direction = normalizeMoveVector(clampedVelocity);
  const retreatingFromPlayer = !directCharge && playerRepelPressure > 0.02
    && direction.x * fromPlayer.x + direction.y * fromPlayer.y > 0.25;
  const movementTarget = retreatingFromPlayer
    ? {
      x: enemy.x + fromPlayer.x * ENEMY_PLAYER_BODY_SOFT_RADIUS,
      y: enemy.y + fromPlayer.y * ENEMY_PLAYER_BODY_SOFT_RADIUS
    }
    : approachTarget;
  const nextPosition = resolveEnemySteeredMove(map, enemy, movementTarget, direction, stepDistance, steering.active, spatialIndex);
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

function enemyNavigationMoveTarget(
  enemy: Enemy,
  player: { x: number; y: number },
  map: BakedBattleMapData | null,
  navigation?: EnemyNavigationContext | null
) {
  const approachTarget = enemyApproachTarget(enemy, player, map);
  if (!map || !navigation) return approachTarget;
  if (distance(enemy, player) <= ENEMY_APPROACH_RING_RADIUS * 1.8) return approachTarget;

  const cell = enemyWorldToGrid(map, enemy);
  const currentIndex = enemyGridIndex(navigation, cell.gridX, cell.gridY);
  if (navigation.field[currentIndex] >= ENEMY_NAVIGATION_INF) return approachTarget;

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
  const sideOffset = enemyLaneSign(enemy) * Math.min(map.meta.grid_size * 0.28, 10);
  return {
    x: center.x + perpendicular.x * sideOffset,
    y: center.y + perpendicular.y * sideOffset,
    gridX: best.gridX,
    gridY: best.gridY
  };
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
  const playerDistance = distance(enemy, player);
  if (playerDistance <= ENEMY_PLAYER_CONTACT_SLOW_RADIUS * 1.45) {
    const fallbackAngle = ((enemy.id * 137) % 360) * Math.PI / 180;
    const away = playerDistance > 1
      ? { x: (enemy.x - player.x) / playerDistance, y: (enemy.y - player.y) / playerDistance }
      : { x: Math.cos(fallbackAngle), y: Math.sin(fallbackAngle) };
    const ringIndex = Math.floor((enemy.id * 7) % ENEMY_SWARM_RING_COUNT);
    const ringRadius = ENEMY_SWARM_INNER_RING_RADIUS + ringIndex * ENEMY_SWARM_RING_SPACING;
    const sideOffset = enemyLaneSign(enemy) * Math.min(ENEMY_APPROACH_SIDE_STEP, ENEMY_SWARM_RING_SPACING * 0.45);
    if (!map) {
      return {
        x: player.x + away.x * ringRadius,
        y: player.y + away.y * ringRadius
      };
    }
    const ringTarget = nearestWalkableApproachTarget(map, player, away, sideOffset, ringRadius);
    if (ringTarget) return ringTarget;
  }
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

function separateOverlappingEnemies(enemies: Enemy[], map: BakedBattleMapData | null, lockedEnemyIds: Set<number> = new Set()): Enemy[] {
  if (enemies.length <= 1) return enemies;
  const spatialIndex = createEnemySpatialIndex(enemies, ENEMY_SPATIAL_CHUNK_SIZE);
  return enemies.map((enemy) => {
    if (enemy.hp <= 0 || enemy.runtimeTier === "dead") return enemy;
    if (lockedEnemyIds.has(enemy.id)) return enemy;
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
    const scale = Math.min(ENEMY_COLLISION_MAX_PUSH, pushLength) / pushLength;
    const nextPosition = resolveWalkableMove(map, enemy, {
      x: enemy.x + pushX * scale,
      y: enemy.y + pushY * scale
    });
    return { ...enemy, x: nextPosition.x, y: nextPosition.y };
  });
}

function enemyCollisionRadius(enemy: Enemy) {
  const largeGeometryMonster = typeof enemy.monsterId === "string" && /^mon_[34]\d{5}$/.test(enemy.monsterId);
  return enemy.boss || enemy.monsterId === "enemy_brute" || largeGeometryMonster ? ENEMY_BOSS_COLLISION_RADIUS : ENEMY_COLLISION_RADIUS;
}

function selectRenderableEnemies(enemies: Enemy[], player: { x: number; y: number }) {
  return candidateEnemiesNear(enemies, player, ENEMY_CAMERA_VISIBLE_RANGE)
    .filter((enemy) => enemy.hp > 0)
    .sort((left, right) => distance(left, player) - distance(right, player))
    .slice(0, MAX_VISIBLE_ENEMY_DOM_NODES);
}

function selectProjectileTargets(enemies: Enemy[], skill: SkillPreview, player: { x: number; y: number }): ProjectileDamageTarget[] {
  const runtimeParams = skill.runtime_params ?? {};
  const source = projectileSpawnWorldPosition(player, runtimeParams);
  const searchRange = Math.max(1, Number(skill.cast?.search_range ?? runtimeParams.max_distance ?? 520) * skill.area_multiplier);
  const maxDistance = Math.max(1, Number(runtimeParams.max_distance ?? searchRange));
  const collisionRadius = Math.max(
    1,
    Number(runtimeParams.collision_radius ?? 0),
    Number(runtimeParams.projectile_radius ?? 0),
    Number(runtimeParams.projectile_width ?? 0) / 2,
    Number(runtimeParams.projectile_height ?? 0) / 2
  );
  const pierceCount = Math.max(0, Math.round(Number(runtimeParams.pierce_count ?? 0)));
  const hitPolicy = String(runtimeParams.hit_policy ?? "first_hit");
  const maxHitsPerProjectile = pierceCount > 0 ? pierceCount + 1 : 1;
  const projectileCount = Math.max(1, Math.round(Number(runtimeParams.projectile_count ?? skill.projectile_count ?? 1)));
  const spreadAngleDeg = projectileSpreadAngleDeg(skill.behavior_template, runtimeParams);
  const angleStepDeg = projectileAngleStepDeg(skill.behavior_template, runtimeParams);
  const sourceCandidates = candidateEnemiesNear(enemies, source, Math.max(searchRange, maxDistance));
  const firstTarget = [...sourceCandidates]
    .filter((enemy) => enemy.hp > 0 && distance(enemy, source) <= searchRange)
    .sort((a, b) => distance(a, source) - distance(b, source))[0];
  if (!firstTarget) return [];
  const baseDirection = guideDirection(source, firstTarget);
  const result: ProjectileDamageTarget[] = [];
  for (const [projectileIndex, direction] of projectileSpreadDirections(baseDirection, projectileCount, spreadAngleDeg, angleStepDeg).entries()) {
    const candidates = sourceCandidates
      .filter((enemy) => enemy.hp > 0)
      .map((enemy) => ({ enemy, metrics: projectileLineMetrics(source, direction, enemy) }))
      .filter(({ metrics }) => metrics.forward >= 0 && metrics.forward <= maxDistance);
    const lineTargets = candidates
      .filter(({ metrics }) => metrics.perpendicular <= collisionRadius)
      .sort((a, b) => a.metrics.forward - b.metrics.forward);
    const selected = lineTargets.slice(0, maxHitsPerProjectile);
    if (selected.length < maxHitsPerProjectile && maxHitsPerProjectile > 1) {
      const selectedIds = new Set(selected.map(({ enemy }) => enemy.id));
      const pathAssistTargets = candidates
        .filter(({ enemy, metrics }) => !selectedIds.has(enemy.id) && metrics.perpendicular <= collisionRadius * 3)
        .sort((a, b) => (
          a.metrics.perpendicular - b.metrics.perpendicular
          || a.metrics.forward - b.metrics.forward
        ));
      selected.push(...pathAssistTargets.slice(0, maxHitsPerProjectile - selected.length));
    }
    for (const target of selected) {
      result.push({ enemy: target.enemy, projectileIndex });
    }
  }
  return result;
}

function projectileLineMetrics(source: { x: number; y: number }, direction: { x: number; y: number }, target: { x: number; y: number }) {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const forward = dx * direction.x + dy * direction.y;
  const perpendicular = Math.abs(dx * -direction.y + dy * direction.x);
  return { forward, perpendicular };
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
  const dx = targetWorldPosition.x - spawnWorldPosition.x;
  const dy = targetWorldPosition.y - spawnWorldPosition.y;
  const distance = Math.hypot(dx, dy) || 1;
  const directionWorld = { x: dx / distance, y: dy / distance };
  const projectileSpeed = Math.max(1, Number(runtimeParams.projectile_speed ?? 720));
  return {
    spawnWorldPosition,
    targetWorldPosition,
    directionWorld,
    velocityWorld: {
      x: directionWorld.x * projectileSpeed,
      y: directionWorld.y * projectileSpeed
    },
    distance,
    projectileId: `${skill.active_gem_instance_id}.local.projectile.${projectileIndex + 1}`,
    skillId: skill.skill_package_id ?? skill.skill_template_id
  };
}

function selectPlayerNovaTargets(enemies: Enemy[], skill: SkillPreview, player: { x: number; y: number }): Enemy[] {
  const runtimeParams = skill.runtime_params ?? {};
  const radius = Math.max(1, Number(runtimeParams.radius ?? skill.cast?.search_range ?? 360));
  const maxTargets = Math.max(1, Math.round(Number(runtimeParams.max_targets ?? (enemies.length || 1))));
  return candidateEnemiesNear(enemies, player, radius)
    .map((enemy) => ({ enemy, distance: Math.hypot(enemy.x - player.x, enemy.y - player.y) }))
    .filter((item) => item.distance <= radius)
    .sort((left, right) => left.distance - right.distance)
    .slice(0, maxTargets)
    .map((item) => item.enemy);
}

function selectDamageZoneTargets(enemies: Enemy[], skill: SkillPreview, player: { x: number; y: number }): Enemy[] {
  const runtimeParams = skill.runtime_params ?? {};
  const shape = String(runtimeParams.shape ?? "circle");
  const maxTargets = Math.max(1, Math.round(Number(runtimeParams.max_targets ?? (enemies.length || 1))));
  if (shape === "rectangle") {
    const length = Math.max(1, Number(runtimeParams.length ?? skill.cast?.search_range ?? 320));
    const width = Math.max(1, Number(runtimeParams.width ?? 96));
    const facingTarget = nearestEnemy(enemies, player);
    if (!facingTarget) return [];
    const direction = rotateDirection(guideDirection(player, facingTarget), Number(runtimeParams.angle_offset_deg ?? 0));
    return candidateEnemiesNear(enemies, player, Math.max(length, width))
      .filter((enemy) => enemy.hp > 0)
      .map((enemy) => {
        const metrics = projectileLineMetrics(player, direction, enemy);
        return { enemy, forward: metrics.forward, lateral: metrics.perpendicular };
      })
      .filter((item) => item.forward >= 0 && item.forward <= length && item.lateral <= width / 2)
      .sort((left, right) => left.forward - right.forward || left.lateral - right.lateral)
      .slice(0, maxTargets)
      .map((item) => item.enemy);
  }
  const radius = Math.max(1, Number(runtimeParams.radius ?? skill.cast?.search_range ?? 360));
  return candidateEnemiesNear(enemies, player, radius)
    .map((enemy) => ({ enemy, distance: Math.hypot(enemy.x - player.x, enemy.y - player.y) }))
    .filter((item) => item.enemy.hp > 0 && item.distance <= radius)
    .sort((left, right) => left.distance - right.distance)
    .slice(0, maxTargets)
    .map((item) => item.enemy);
}

function selectMeleeArcTargets(enemies: Enemy[], skill: SkillPreview, player: { x: number; y: number }): Enemy[] {
  const runtimeParams = skill.runtime_params ?? {};
  const arcAngle = clamp(Number(runtimeParams.arc_angle ?? 70), 1, 180);
  const arcRadius = Math.max(1, Number(runtimeParams.arc_radius ?? skill.cast?.search_range ?? 320));
  const maxTargets = Math.max(1, Math.round(Number(runtimeParams.max_targets ?? (enemies.length || 1))));
  const candidates = candidateEnemiesNear(enemies, player, arcRadius)
    .filter((enemy) => enemy.hp > 0 && distance(enemy, player) <= arcRadius)
    .sort((a, b) => distance(a, player) - distance(b, player));
  const facingTarget = candidates[0] ?? nearestEnemy(enemies, player);
  if (!facingTarget) return [];
  const facingDirection = guideDirection(player, facingTarget);
  return candidates
    .map((enemy) => {
      const targetDirection = guideDirection(player, enemy);
      return {
        enemy,
        distance: distance(enemy, player),
        angle: angleBetweenDegrees(facingDirection, targetDirection)
      };
    })
    .filter((item) => item.angle <= arcAngle / 2)
    .sort((left, right) => left.distance - right.distance)
    .slice(0, maxTargets)
    .map((item) => item.enemy);
}

function selectChainTargets(enemies: Enemy[], skill: SkillPreview, player: { x: number; y: number }): Enemy[] {
  const runtimeParams = skill.runtime_params ?? {};
  const searchRange = Math.max(1, Number(skill.cast?.search_range ?? 520));
  const chainRadius = Math.max(1, Number(runtimeParams.chain_radius ?? 180));
  const chainCount = Math.max(1, Math.round(Number(runtimeParams.chain_count ?? 1)));
  const maxTargets = Math.max(1, Math.round(Number(runtimeParams.max_targets ?? chainCount)));
  const limit = Math.min(chainCount, maxTargets);
  const allowRepeatTarget = Boolean(runtimeParams.allow_repeat_target ?? false);
  const spatialIndex = createEnemySpatialIndex(enemies);
  const first = queryEnemySpatialIndex(spatialIndex, player, searchRange)
    .filter((enemy) => enemy.hp > 0 && distance(enemy, player) <= searchRange)
    .sort((a, b) => distance(a, player) - distance(b, player))[0];
  if (!first) return [];
  const selected: Enemy[] = [first];
  const selectedIds = new Set([first.id]);
  while (selected.length < limit) {
    const current = selected[selected.length - 1];
    const next = queryEnemySpatialIndex(spatialIndex, current, chainRadius)
      .filter((enemy) => enemy.hp > 0)
      .filter((enemy) => allowRepeatTarget || !selectedIds.has(enemy.id))
      .filter((enemy) => enemy.id !== current.id)
      .filter((enemy) => distance(enemy, current) <= chainRadius)
      .sort((a, b) => distance(a, current) - distance(b, current))[0];
    if (!next) break;
    selected.push(next);
    selectedIds.add(next.id);
  }
  return selected;
}

function hasLiveEnemyInCastRange(enemies: Enemy[], skill: SkillPreview, source: { x: number; y: number }) {
  const runtimeParams = skill.runtime_params ?? {};
  const range = Math.max(
    1,
    Number(skill.cast?.search_range ?? runtimeParams.max_distance ?? runtimeParams.radius ?? skill.hit?.hit_radius ?? 360)
  );
  return candidateEnemiesNear(enemies, source, range)
    .some((enemy) => enemy.hp > 0 && distance(enemy, source) <= range);
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
  const offset = runtimeParams.spawn_offset && typeof runtimeParams.spawn_offset === "object"
    ? runtimeParams.spawn_offset as { x?: unknown; y?: unknown }
    : {};
  return {
    x: player.x + Number(offset.x ?? 0),
    y: player.y + Number(offset.y ?? 0)
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

function removeItemsFromInventorySlots(slots: (string | null)[], instanceIds: string[]) {
  const idSet = new Set(instanceIds.filter(Boolean));
  return slots.map((slotInstanceId) => (slotInstanceId && idSet.has(slotInstanceId) ? null : slotInstanceId));
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
    { kind: "player" as const, id: "player" as const, x: player.x, y: player.y, hp: player.hp, maxHp: player.maxHp, renderScale }
  ].sort(compareDimetricDepth);
}

function createBattleRenderItems(
  player: { x: number; y: number; hp: number; maxHp: number },
  enemies: Enemy[],
  bolts: FireBolt[],
  hitVfxs: HitVfx[],
  renderScale = UNIT_RENDER_SCALE
): BattleRenderItem[] {
  return [
    ...createBattleRenderEntities(player, enemies, renderScale),
    ...bolts.map((bolt) => {
      const point = fireBoltWorldPoint(bolt);
      return { kind: "fire-bolt" as const, id: bolt.id, x: point.x, y: point.y, bolt };
    }),
    ...hitVfxs.map((vfx) => ({ kind: "hit-vfx" as const, id: vfx.id, x: vfx.x, y: vfx.y, vfx }))
  ].sort((left, right) => dimetricDepth(left.x, left.y) - dimetricDepth(right.x, right.y));
}

function createBattleAnimationContexts(
  playerVisual: UnitVisualRuntime,
  enemyVisuals: Map<number, EnemyVisualRuntime>,
  enemies: Enemy[],
  player: { x: number; y: number },
  elapsedMs: number,
  moveSpeedMultiplier: number
): BattleAnimationContexts {
  const currentMoveSpeed = PLAYER_SPEED * moveSpeedMultiplier;
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
        className="player unit-visual unit-visual-player"
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
      <UnitAnimationSprite frame={animationFrame} />
    </div>
  );
}

function UnitAnimationSprite({ frame }: { frame: UnitAnimationFrame }) {
  const motionStyle = unitAnimationMotionStyle(frame);
  const showAttackSwipe = frame.animation.state === "attack" && frame.animation.unitId !== "enemy_imp";
  return (
    <span
      className={`unit-sprite unit-animation-sprite unit-animation-${frame.animation.state}`}
      style={{
        width: frame.animation.frameWidth,
        height: frame.animation.frameHeight,
        backgroundImage: `url(${frame.animation.src})`,
        backgroundPosition: `${-frame.frameIndex * frame.animation.frameWidth}px ${-frame.animation.frameRow * frame.animation.frameHeight}px`,
        ...motionStyle
      }}
      data-animation-frame={frame.frameIndex}
      aria-hidden="true"
    >
      {showAttackSwipe && <span className="unit-attack-swipe" />}
    </span>
  );
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
  return {
    left: visualPoint.x,
    top: visualPoint.y - progress * FLOATING_TEXT_VISUAL_RISE_SPEED,
    opacity: Math.max(0, text.ttl / Math.max(0.001, text.duration))
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
  return gem.tooltip_view;
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

type ProjectileVfxKind = "fire_bolt" | "ice_shards" | "penetrating_shot";

function projectileVfxKind(value: string | undefined): ProjectileVfxKind | null {
  const token = cssToken(value);
  if (token.includes("fire_bolt") || token.includes("skill_event_fire_bolt")) return "fire_bolt";
  if (token.includes("ice_shards") || token.includes("skill_ice_shards") || token.includes("active_ice_shards")) return "ice_shards";
  if (token.includes("penetrating_shot") || token.includes("skill_penetrating_shot") || token.includes("active_penetrating_shot")) return "penetrating_shot";
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
  if (vfxKind === "penetrating_shot") {
    return {
      projectile: PENETRATING_SHOT_VFX.projectileLoop,
      trail: PENETRATING_SHOT_VFX.trailLines,
      impact: PENETRATING_SHOT_VFX.impactSparks,
      sparks: null,
      muzzle: PENETRATING_SHOT_VFX.muzzleFlash,
      trailLength: PENETRATING_SHOT_TRAIL_LENGTH,
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
  return {
    x: bolt.x + (bolt.targetX - bolt.x) * travel,
    y: bolt.y + (bolt.targetY - bolt.y) * travel
  };
}

function ballisticArcVisualLift(bolt: FireBolt, travel = fireBoltTravel(bolt)) {
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

  const sheets = projectileVfxSheets(vfxKind);
  const bodyVfxScale = projectileBodyVisualScale(bolt, sheets);
  const duration = Math.max(0.001, bolt.duration);
  const aliveRemaining = fireBoltAliveRemaining(bolt);
  const opacity = projectileBodyOpacity(bolt);
  const travel = fireBoltTravel(bolt);
  const point = fireBoltWorldPoint(bolt, travel);
  const visualLift = ballisticArcVisualLift(bolt, travel);
  const shadowStyle = ballisticShadowStyle(bolt, point, depthIndex, opacity, travel);
  const direction = normalizedWorldDirection({
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
        height: burstSize * DIMETRIC_GROUND_EFFECT_Y_SCALE,
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
        data-projectile-visual-lift={visualLift}
        data-shape-effects={bolt.shapeEffects.map((effect) => effect.id).join(",")}
      >
        <span className="skill-vfx-core" />
        {bolt.shapeEffects.slice(0, 5).map((effect, index) => (
          <span
            key={`${effect.id}-${index}`}
            className={`skill-shape skill-shape-${shapeClass(effect.id)} skill-shape-${visualTone(effect.id)}`}
            style={{ "--shape-index": index } as CSSProperties}
            title={effect.text}
          />
        ))}
      </div>
    </>
  );
}

function HitVfxView({ vfx, depthIndex }: { vfx: HitVfx; depthIndex: number }) {
  const vfxKind = projectileVfxKind(vfx.vfxKey) ?? projectileVfxKind(vfx.skillTemplateId);
  if (!vfxKind) {
    return <LegacyHitVfxView vfx={vfx} depthIndex={depthIndex} />;
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
        data-pierce-remaining={vfx.pierceRemaining}
        data-impact-kind={vfx.impactKind}
        data-impact-world-x={vfx.x}
        data-impact-world-y={vfx.y}
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
          data-impact-world-x={vfx.x}
          data-impact-world-y={vfx.y}
          aria-hidden="true"
        >
          <span className="vfx-sprite" style={vfxSpriteStyle(sparksSheet, sparksFrame)} />
        </span>
      )}
    </>
  );
}

function LegacyHitVfxView({ vfx, depthIndex }: { vfx: HitVfx; depthIndex: number }) {
  const duration = Math.max(0.001, vfx.duration);
  const opacity = Math.max(0, vfx.ttl / duration);
  const scale = (1 + (1 - opacity) * 0.55) * normalizedVfxScale(vfx.vfxScale);
  const visualPoint = projectBattleWorldToScreen(vfx.x, vfx.y);
  return (
    <div
      className={`skill-hit-vfx skill-vfx skill-vfx-${visualTone(vfx.vfxKey || vfx.damageType)} skill-vfx-${cssToken(vfx.vfxKey)}`}
      style={{ left: visualPoint.x, top: visualPoint.y, opacity, zIndex: BATTLE_ENTITY_Z_INDEX_BASE + depthIndex, transform: `translate(-50%, -50%) scale(${scale})` }}
      data-skill-event="hit_vfx"
      data-vfx-key={vfx.vfxKey}
    />
  );
}

function SkillRuntimeGuideLayer({
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
  const selectedTargets = skill ? selectProjectileTargets(enemies, skill, player) : [];
  const target = selectedTargets[0]?.enemy ?? nearestGuideTarget(source, enemies, searchRange, maxDistance);
  const direction = guideDirection(source, target);
  const directions = projectileSpreadDirections(direction, projectileCount, spreadAngleDeg, angleStepDeg);
  const sourceVisual = projectBattleWorldToScreen(source.x, source.y);
  const targetVisual = projectBattleWorldToScreen(target.x, target.y);
  const searchDiameter = searchRange * 2;
  const collisionDiameter = collisionRadius * 2;
  const farthestSelectedTarget = selectedTargets.length > 0
    ? selectedTargets.reduce((farthest, item) => (
        distance(item.enemy, player) > distance(farthest, player) ? item.enemy : farthest
      ), selectedTargets[0].enemy)
    : null;
  const guideDistance = selectedTargets.length > 0
    ? Math.hypot((farthestSelectedTarget?.x ?? source.x) - source.x, (farthestSelectedTarget?.y ?? source.y) - source.y)
    : Math.min(maxDistance, Math.hypot(target.x - source.x, target.y - source.y) || maxDistance);

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
            height: searchDiameter * DIMETRIC_GROUND_EFFECT_Y_SCALE
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
  player,
  enemies,
  originPolicy,
  debugOptions
}: {
  params: Record<string, unknown>;
  cast: Partial<SkillPackageData["cast"]>;
  hitRadius?: number;
  damageType: string;
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
            height: searchRange * 2 * DIMETRIC_GROUND_EFFECT_Y_SCALE
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
        className={`runtime-damage-zone-range runtime-damage-zone-range-${shape} damage-zone-${damageType}`}
        title={rangeLabel}
        style={{
          left: originVisual.x,
          top: originVisual.y,
          width: shape === "circle" ? radius * 2 : length,
          height: shape === "circle" ? radius * 2 * DIMETRIC_GROUND_EFFECT_Y_SCALE : width,
          transform: shape === "circle"
            ? "translate(-50%, -50%)"
            : `translate(0, -50%) rotate(${rectangleAngle}rad)`
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
        const angle = zone.shape === "rectangle"
          ? worldDirectionToBattleScreenAngle({ x: zone.directionX || 1, y: zone.directionY || 0 }, { x: zone.x, y: zone.y })
          : 0;
        const vfxScale = normalizedVfxScale(zone.vfxScale);
        return (
          <div
            key={zone.id}
            className={`damage-zone-vfx damage-zone-vfx-${zone.shape} damage-zone-${zone.damageType} ${zone.warning ? "damage-zone-vfx-warning" : ""}`}
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
              height: diameter * DIMETRIC_GROUND_EFFECT_Y_SCALE,
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
              height: diameter * DIMETRIC_GROUND_EFFECT_Y_SCALE,
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
  if (token.includes("lightning")) return "lightning";
  if (token.includes("puncture") || token.includes("shot")) return "physical";
  if (token.includes("fungal") || token.includes("spore")) return "spore";
  if (token.includes("vitality")) return "vitality";
  if (token.includes("swift")) return "swift";
  return "fire";
}

function shapeClass(value: string) {
  const token = cssToken(value);
  if (token.includes("nova") || token.includes("burst") || token.includes("blast")) return "burst";
  if (token.includes("fork") || token.includes("fan") || token.includes("multi")) return "split";
  if (token.includes("rain") || token.includes("storm") || token.includes("cloud")) return "rain";
  if (token.includes("chain") || token.includes("beam") || token.includes("ricochet")) return "chain";
  if (token.includes("orbit") || token.includes("double") || token.includes("gravity")) return "orbit";
  if (token.includes("dash") || token.includes("arc") || token.includes("spin")) return "slash";
  return "glyph";
}

function createEnemy(id: number, playerX: number, playerY: number, map: BakedBattleMapData | null = null, spawnKind: "normal" | "elite" = "normal"): Enemy {
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
      ...offense,
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
    ...offense,
    runtimeTier: "active"
  };
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

function createSkillTestDummies(firstId: number, playerX: number, playerY: number): Enemy[] {
  return SKILL_TEST_DUMMY_OFFSETS.map((offset, index) => ({
    id: firstId + index,
    x: clamp(playerX + offset.x, 40, MAP_WIDTH - 40),
    y: clamp(playerY + offset.y, 40, MAP_HEIGHT - 40),
    hp: SKILL_TEST_DUMMY_MAX_HP,
    maxHp: SKILL_TEST_DUMMY_MAX_HP,
    monsterId: "enemy_imp",
    ...defaultMonsterOffense(0),
    runtimeTier: "active"
  }));
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

