export const GEOMETRIC_VISUAL_TOKENS = {
  color: {
    background: "#0b0d10",
    backgroundPanel: "#12161a",
    backgroundPanelRaised: "#171c21",
    gridMajor: "rgba(244, 247, 248, 0.08)",
    gridMinor: "rgba(244, 247, 248, 0.035)",
    textPrimary: "#f4f7f8",
    textSecondary: "#9aa3ad",
    white: "#f7f7f2",
    orange: "#ff8a2a",
    blue: "#4aa3ff",
    gray: "#8b929a",
    darkGray: "#2a3036",
    danger: "#ff5d4d",
    physical: "#d9dde1",
    fire: "#ff8a2a",
    cold: "#4aa3ff",
    lightning: "#dff6ff",
    corrosive: "#5cff7f",
    spore: "#96d66f",
    vitality: "#f7f7f2"
  },
  font: {
    family: "\"Microsoft YaHei\", \"Noto Sans CJK SC\", sans-serif",
    hud: 12,
    body: 14,
    panelTitle: 16,
    number: 13
  },
  border: {
    hairline: "rgba(244, 247, 248, 0.16)",
    strong: "rgba(244, 247, 248, 0.34)",
    accent: "rgba(255, 138, 42, 0.72)",
    radius: 6
  },
  alpha: {
    subtle: 0.22,
    normal: 0.68,
    strong: 0.92
  },
  motion: {
    hitMs: 80,
    burstMs: 160,
    fadeMs: 240,
    slowPulseMs: 900
  },
  geometry: {
    playerRadius: 18,
    enemyRadius: 19,
    eliteRadius: 29,
    bossRadius: 41,
    projectileRadius: 5,
    dropRadius: 8,
    minLineWidth: 1.5
  }
} as const;

export type GeometricDamageTone = "physical" | "fire" | "cold" | "lightning" | "corrosive" | "spore" | "vitality";

export function geometricToneColor(tone: string | undefined) {
  const token = (tone || "").toLowerCase();
  if (token.includes("fire") || token.includes("lava")) return GEOMETRIC_VISUAL_TOKENS.color.fire;
  if (token.includes("cold") || token.includes("ice") || token.includes("frost")) return GEOMETRIC_VISUAL_TOKENS.color.cold;
  if (token.includes("lightning")) return GEOMETRIC_VISUAL_TOKENS.color.lightning;
  if (token.includes("corrosive") || token.includes("corrosion") || token.includes("chaos")) return GEOMETRIC_VISUAL_TOKENS.color.corrosive;
  if (token.includes("spore") || token.includes("fungal")) return GEOMETRIC_VISUAL_TOKENS.color.spore;
  if (token.includes("vitality")) return GEOMETRIC_VISUAL_TOKENS.color.vitality;
  return GEOMETRIC_VISUAL_TOKENS.color.physical;
}
