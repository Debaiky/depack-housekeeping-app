import { NA, type RatingValue } from "./areas";

export type RatingEntry = {
  key: string;
  rating: RatingValue;
};

export type DailyResult = {
  totalScore: number;
  avgScore: number;
  ratedCount: number;
  status: "Satisfactory" | "Unsatisfactory";
};

const AVG_THRESHOLD = 3.5;
const MIN_AREA_RATING = 3;

export function computeDailyResult(ratings: RatingEntry[]): DailyResult {
  const numeric = ratings.filter((r) => r.rating !== NA) as {
    key: string;
    rating: number;
  }[];

  const totalScore = numeric.reduce((sum, r) => sum + r.rating, 0);
  const ratedCount = numeric.length;
  const avgScore = ratedCount > 0 ? totalScore / ratedCount : 0;
  const anyBelowMin = numeric.some((r) => r.rating < MIN_AREA_RATING);

  const status =
    ratedCount === 0 || anyBelowMin || avgScore < AVG_THRESHOLD
      ? "Unsatisfactory"
      : "Satisfactory";

  return { totalScore, avgScore, ratedCount, status };
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
