export type MaturityCode = "novice" | "developing" | "capable" | "proficient" | "expert";

export interface MaturityLevel {
  level: 1 | 2 | 3 | 4 | 5;
  code: MaturityCode;
  labelEn: string;
  labelMs: string;
  hex: string;
  hexDark: string;
  badgeClass: string;
  textClass: string;
  bgClass: string;
  ringClass: string;
  rangeMin: number;
  rangeMax: number;
}

export const MATURITY_LEVELS: Record<MaturityCode, MaturityLevel> = {
  novice: {
    level: 1,
    code: "novice",
    labelEn: "Novice",
    labelMs: "Pemula",
    hex: "#ef4444",
    hexDark: "#f87171",
    badgeClass: "bg-red-500 dark:bg-red-500/20 dark:text-red-300",
    textClass: "text-red-600 dark:text-red-400",
    bgClass: "bg-red-500/10",
    ringClass: "ring-red-200 dark:ring-red-400/30",
    rangeMin: 0,
    rangeMax: 30,
  },
  developing: {
    level: 2,
    code: "developing",
    labelEn: "Developing",
    labelMs: "Berkembang",
    hex: "#f97316",
    hexDark: "#fb923c",
    badgeClass: "bg-orange-500 dark:bg-orange-500/20 dark:text-orange-300",
    textClass: "text-orange-600 dark:text-orange-400",
    bgClass: "bg-orange-500/10",
    ringClass: "ring-orange-200 dark:ring-orange-400/30",
    rangeMin: 31,
    rangeMax: 50,
  },
  capable: {
    level: 3,
    code: "capable",
    labelEn: "Capable",
    labelMs: "Berkebolehan",
    hex: "#eab308",
    hexDark: "#facc15",
    badgeClass: "bg-yellow-500 dark:bg-yellow-500/20 dark:text-yellow-300",
    textClass: "text-yellow-600 dark:text-yellow-400",
    bgClass: "bg-yellow-500/10",
    ringClass: "ring-yellow-200 dark:ring-yellow-400/30",
    rangeMin: 51,
    rangeMax: 70,
  },
  proficient: {
    level: 4,
    code: "proficient",
    labelEn: "Proficient",
    labelMs: "Mahir",
    hex: "#22c55e",
    hexDark: "#4ade80",
    badgeClass: "bg-green-500 dark:bg-green-500/20 dark:text-green-300",
    textClass: "text-green-600 dark:text-green-400",
    bgClass: "bg-green-500/10",
    ringClass: "ring-green-200 dark:ring-green-400/30",
    rangeMin: 71,
    rangeMax: 89,
  },
  expert: {
    level: 5,
    code: "expert",
    labelEn: "Expert",
    labelMs: "Pakar",
    hex: "#10b981",
    hexDark: "#34d399",
    badgeClass: "bg-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-300",
    textClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-500/10",
    ringClass: "ring-emerald-200 dark:ring-emerald-400/30",
    rangeMin: 90,
    rangeMax: 100,
  },
};

const ORDER: MaturityCode[] = ["novice", "developing", "capable", "proficient", "expert"];

export function getMaturityLevel(score: number): MaturityLevel {
  if (score >= 90) return MATURITY_LEVELS.expert;
  if (score >= 71) return MATURITY_LEVELS.proficient;
  if (score >= 51) return MATURITY_LEVELS.capable;
  if (score >= 31) return MATURITY_LEVELS.developing;
  return MATURITY_LEVELS.novice;
}

export function getNextMaturityLevel(score: number): MaturityLevel | null {
  const current = getMaturityLevel(score);
  const idx = ORDER.indexOf(current.code);
  if (idx === ORDER.length - 1) return null;
  return MATURITY_LEVELS[ORDER[idx + 1]];
}

export function getMaturityColor(score: number): string {
  return getMaturityLevel(score).hex;
}

export function getMaturityLabelEn(score: number): string {
  return getMaturityLevel(score).labelEn;
}
