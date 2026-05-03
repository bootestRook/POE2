import type { UnitVisualType } from "./unitAssets";

export type MonsterGeometryTier = "normal" | "magic" | "rare" | "boss";

export type MonsterGeometryShape =
  | "circle_ring"
  | "triangle"
  | "square_dot"
  | "diamond_tail"
  | "double_triangle"
  | "hex_eye"
  | "cluster"
  | "needle_ghost"
  | "circle_square"
  | "tri_in_tri"
  | "crystal_cross"
  | "hex_core"
  | "broken_ring_bolt"
  | "square_invtri"
  | "wind_wheel"
  | "double_diamond"
  | "tri_crown"
  | "ring_square_corners"
  | "star_diamonds"
  | "hex_tri_layers"
  | "square_spikes"
  | "double_ring_eye"
  | "obelisk"
  | "twin_shadow"
  | "boss_king"
  | "boss_void"
  | "boss_pinwheel"
  | "boss_star_mother"
  | "boss_judicator"
  | "boss_eclipse"
  | "boss_mirror"
  | "boss_triad";

export type MonsterGeometryVisual = {
  id: string;
  tier: MonsterGeometryTier;
  shape: MonsterGeometryShape;
  primaryColor: string;
  accentColor: string;
  sizePx: number;
  fallbackUnitVisual: UnitVisualType;
};

export const MONSTER_GEOMETRY_VISUALS: Record<string, MonsterGeometryVisual> = {
  mon_100101: visual("mon_100101", "normal", "circle_ring", "#F7F7F2", "#D9DDE1", 38, "enemy_imp"),
  mon_100102: visual("mon_100102", "normal", "triangle", "#F7F7F2", "#D9DDE1", 38, "enemy_imp"),
  mon_100103: visual("mon_100103", "normal", "square_dot", "#F7F7F2", "#D9DDE1", 38, "enemy_imp"),
  mon_100104: visual("mon_100104", "normal", "diamond_tail", "#F7F7F2", "#D9DDE1", 38, "enemy_imp"),
  mon_100105: visual("mon_100105", "normal", "double_triangle", "#F7F7F2", "#D9DDE1", 38, "enemy_imp"),
  mon_100106: visual("mon_100106", "normal", "hex_eye", "#F7F7F2", "#D9DDE1", 38, "enemy_imp"),
  mon_100107: visual("mon_100107", "normal", "cluster", "#F7F7F2", "#D9DDE1", 38, "enemy_imp"),
  mon_100108: visual("mon_100108", "normal", "needle_ghost", "#F7F7F2", "#D9DDE1", 38, "enemy_imp"),
  mon_200101: visual("mon_200101", "magic", "circle_square", "#F7F7F2", "#D9DDE1", 46, "enemy_imp"),
  mon_200102: visual("mon_200102", "magic", "tri_in_tri", "#F7F7F2", "#D9DDE1", 46, "enemy_imp"),
  mon_200103: visual("mon_200103", "magic", "crystal_cross", "#F7F7F2", "#D9DDE1", 46, "enemy_imp"),
  mon_200104: visual("mon_200104", "magic", "hex_core", "#F7F7F2", "#D9DDE1", 46, "enemy_imp"),
  mon_200105: visual("mon_200105", "magic", "broken_ring_bolt", "#F7F7F2", "#D9DDE1", 46, "enemy_imp"),
  mon_200106: visual("mon_200106", "magic", "square_invtri", "#F7F7F2", "#D9DDE1", 46, "enemy_imp"),
  mon_200107: visual("mon_200107", "magic", "wind_wheel", "#F7F7F2", "#D9DDE1", 46, "enemy_imp"),
  mon_200108: visual("mon_200108", "magic", "double_diamond", "#F7F7F2", "#D9DDE1", 46, "enemy_imp"),
  mon_300101: visual("mon_300101", "rare", "tri_crown", "#F7F7F2", "#D9DDE1", 58, "enemy_brute"),
  mon_300102: visual("mon_300102", "rare", "ring_square_corners", "#F7F7F2", "#D9DDE1", 58, "enemy_brute"),
  mon_300103: visual("mon_300103", "rare", "star_diamonds", "#F7F7F2", "#D9DDE1", 58, "enemy_brute"),
  mon_300104: visual("mon_300104", "rare", "hex_tri_layers", "#F7F7F2", "#D9DDE1", 58, "enemy_brute"),
  mon_300105: visual("mon_300105", "rare", "square_spikes", "#F7F7F2", "#D9DDE1", 58, "enemy_brute"),
  mon_300106: visual("mon_300106", "rare", "double_ring_eye", "#F7F7F2", "#D9DDE1", 58, "enemy_brute"),
  mon_300107: visual("mon_300107", "rare", "obelisk", "#F7F7F2", "#D9DDE1", 58, "enemy_brute"),
  mon_300108: visual("mon_300108", "rare", "twin_shadow", "#F7F7F2", "#D9DDE1", 58, "enemy_brute"),
  mon_400101: visual("mon_400101", "boss", "boss_king", "#F7F7F2", "#D9DDE1", 82, "enemy_brute"),
  mon_400102: visual("mon_400102", "boss", "boss_void", "#F7F7F2", "#D9DDE1", 82, "enemy_brute"),
  mon_400103: visual("mon_400103", "boss", "boss_pinwheel", "#F7F7F2", "#D9DDE1", 82, "enemy_brute"),
  mon_400104: visual("mon_400104", "boss", "boss_star_mother", "#F7F7F2", "#D9DDE1", 82, "enemy_brute"),
  mon_400105: visual("mon_400105", "boss", "boss_judicator", "#F7F7F2", "#D9DDE1", 82, "enemy_brute"),
  mon_400106: visual("mon_400106", "boss", "boss_eclipse", "#F7F7F2", "#D9DDE1", 82, "enemy_brute"),
  mon_400107: visual("mon_400107", "boss", "boss_mirror", "#F7F7F2", "#D9DDE1", 82, "enemy_brute"),
  mon_400108: visual("mon_400108", "boss", "boss_triad", "#F7F7F2", "#D9DDE1", 82, "enemy_brute")
};

export function resolveMonsterGeometryVisual(monsterId?: string) {
  return monsterId ? MONSTER_GEOMETRY_VISUALS[monsterId] : undefined;
}

export function fallbackUnitVisualForMonster(monsterId?: string): UnitVisualType {
  return resolveMonsterGeometryVisual(monsterId)?.fallbackUnitVisual
    ?? (monsterId === "enemy_brute" ? "enemy_brute" : "enemy_imp");
}

function visual(
  id: string,
  tier: MonsterGeometryTier,
  shape: MonsterGeometryShape,
  primaryColor: string,
  accentColor: string,
  sizePx: number,
  fallbackUnitVisual: UnitVisualType
): MonsterGeometryVisual {
  return { id, tier, shape, primaryColor, accentColor, sizePx, fallbackUnitVisual };
}
