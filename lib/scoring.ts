import { ALL_AREAS } from "./areas";

export type AreaRating = {
  areaId: string;
  rating: number;
};

export type DailyResult = {
  totalScore: number;
  avgScore: number;
  status: "Satisfactory" | "Unsatisfactory";
};

const TOTAL_AREAS = ALL_AREAS.length;
const AVG_THRESHOLD = 3.5;
const MIN_AREA_RATING = 3;

export function computeDailyResult(ratings: AreaRating[]): DailyResult {
  const totalScore = ratings.reduce((sum, r) => sum + r.rating, 0);
  const avgScore = totalScore / TOTAL_AREAS;
  const anyBelowMin = ratings.some((r) => r.rating < MIN_AREA_RATING);
  const status =
    anyBelowMin || avgScore < AVG_THRESHOLD ? "Unsatisfactory" : "Satisfactory";

  return { totalScore, avgScore, status };
}

export type DailySummaryRow = {
  date: string;
  totalScore: number;
  avgScore: number;
  status: "Satisfactory" | "Unsatisfactory";
};

export type PeriodResult = {
  avgScore: number;
  unsatisfactoryDays: number;
  totalDays: number;
  status: "Satisfactory" | "Unsatisfactory";
};

export function computeWeeklyResult(days: DailySummaryRow[]): PeriodResult {
  return computePeriodResult(days, 2);
}

export function computeMonthlyResult(days: DailySummaryRow[]): PeriodResult {
  return computePeriodResult(days, 4);
}

function computePeriodResult(
  days: DailySummaryRow[],
  unsatisfactoryDayThreshold: number
): PeriodResult {
  if (days.length === 0) {
    return { avgScore: 0, unsatisfactoryDays: 0, totalDays: 0, status: "Satisfactory" };
  }

  const avgScore =
    days.reduce((sum, d) => sum + d.avgScore, 0) / days.length;
  const unsatisfactoryDays = days.filter((d) => d.status === "Unsatisfactory").length;

  const status =
    avgScore < AVG_THRESHOLD || unsatisfactoryDays >= unsatisfactoryDayThreshold
      ? "Unsatisfactory"
      : "Satisfactory";

  return { avgScore, unsatisfactoryDays, totalDays: days.length, status };
}
