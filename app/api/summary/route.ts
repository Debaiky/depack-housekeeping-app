import { NextResponse } from "next/server";
import { getDailySummaries, getMachineRatingsByPerson } from "@/lib/googleSheets";
import { computeWeeklyResult, computeMonthlyResult, type DailySummaryRow } from "@/lib/scoring";

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET() {
  const summaries = await getDailySummaries();
  const personScores = await getMachineRatingsByPerson();

  const sorted = [...summaries].sort((a, b) => (a.date < b.date ? 1 : -1));

  const days: DailySummaryRow[] = summaries.map((s) => ({
    date: s.date,
    totalScore: s.totalScore,
    avgScore: s.avgScore,
    status: s.status as "Satisfactory" | "Unsatisfactory",
  }));

  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const weekDays = days.filter((d) => new Date(d.date) >= weekStart);
  const monthDays = days.filter((d) => new Date(d.date) >= monthStart);

  const weekly = computeWeeklyResult(weekDays);
  const monthly = computeMonthlyResult(monthDays);

  return NextResponse.json({
    daily: sorted,
    weekly,
    monthly,
    personScores,
  });
}
