"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type UserDayRating = {
  date: string;
  totalScore: number;
  avgScore: number;
  ratedCount: number;
};

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function scoreColorClass(score: number | null): string {
  if (score == null) return "text-zinc-400";
  if (score < 3) return "text-red-600";
  if (score < 3.5) return "text-amber-600";
  return "text-green-600";
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function UserActivityPage() {
  const params = useParams<{ email: string }>();
  const email = decodeURIComponent(params.email);

  const [days, setDays] = useState<UserDayRating[] | null>(null);
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [rangeFrom, setRangeFrom] = useState(todayDate());
  const [rangeTo, setRangeTo] = useState(todayDate());

  useEffect(() => {
    fetch(`/api/users/${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => setDays(data.days || []));
  }, [email]);

  const byDate = useMemo(() => {
    const map = new Map<string, UserDayRating>();
    for (const d of days || []) map.set(d.date, d);
    return map;
  }, [days]);

  const calendarCells = useMemo(() => {
    const { year, month } = monthCursor;
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: { date: string | null; day: number | null }[] = [];
    for (let i = 0; i < startOffset; i++) cells.push({ date: null, day: null });
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ date: toDateStr(year, month, day), day });
    }
    return cells;
  }, [monthCursor]);

  const rangeStats = useMemo(() => {
    const from = rangeFrom <= rangeTo ? rangeFrom : rangeTo;
    const to = rangeFrom <= rangeTo ? rangeTo : rangeFrom;
    let sum = 0;
    let count = 0;
    let daysWithRatings = 0;
    for (const d of days || []) {
      if (d.date < from || d.date > to) continue;
      sum += d.totalScore;
      count += d.ratedCount;
      daysWithRatings += 1;
    }
    return {
      avgScore: count > 0 ? sum / count : null,
      ratedCount: count,
      daysWithRatings,
    };
  }, [days, rangeFrom, rangeTo]);

  const monthLabel = new Date(monthCursor.year, monthCursor.month, 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
      <Link href="/users" className="text-sm text-blue-600 font-medium">
        ← Back to Users
      </Link>
      <h1 className="text-xl font-semibold mt-2 mb-1">{email}</h1>
      <p className="text-sm text-zinc-500 mb-4">
        Days with submitted ratings, and the total / average rating for each day.
      </p>

      {days === null ? (
        <p className="text-sm text-zinc-400">Loading...</p>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-zinc-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() =>
                  setMonthCursor((c) => {
                    const m = c.month - 1;
                    return m < 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: m };
                  })
                }
                className="text-sm text-blue-600 font-medium px-2 py-1"
              >
                ← Prev
              </button>
              <p className="font-medium text-zinc-900">{monthLabel}</p>
              <button
                onClick={() =>
                  setMonthCursor((c) => {
                    const m = c.month + 1;
                    return m > 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: m };
                  })
                }
                className="text-sm text-blue-600 font-medium px-2 py-1"
              >
                Next →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-400 mb-1">
              {WEEKDAYS.map((wd) => (
                <div key={wd}>{wd}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((cell, i) => {
                if (!cell.date) return <div key={i} />;
                const data = byDate.get(cell.date);
                return (
                  <div
                    key={cell.date}
                    className={`rounded-lg border p-1 text-center ${
                      data ? "border-zinc-200 bg-zinc-50" : "border-transparent"
                    }`}
                  >
                    <p className="text-xs text-zinc-400">{cell.day}</p>
                    {data ? (
                      <>
                        <p className={`text-sm font-semibold ${scoreColorClass(data.avgScore)}`}>
                          {data.avgScore.toFixed(1)}
                        </p>
                        <p className="text-[10px] text-zinc-400">{data.ratedCount} rtgs</p>
                        <p className="text-[10px] text-zinc-400">Σ {data.totalScore}</p>
                      </>
                    ) : (
                      <p className="text-xs text-zinc-300">-</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 bg-white rounded-2xl border border-zinc-200 p-4">
            <h2 className="font-medium text-zinc-900 mb-3">Average rating for a date range</h2>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-sm text-zinc-500">
                From
                <input
                  type="date"
                  value={rangeFrom}
                  max={todayDate()}
                  onChange={(e) => setRangeFrom(e.target.value)}
                  className="block border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1"
                />
              </label>
              <label className="text-sm text-zinc-500">
                To
                <input
                  type="date"
                  value={rangeTo}
                  max={todayDate()}
                  onChange={(e) => setRangeTo(e.target.value)}
                  className="block border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1"
                />
              </label>
            </div>
            <div className="flex items-center gap-6">
              <div>
                <p className={`text-2xl font-semibold ${scoreColorClass(rangeStats.avgScore)}`}>
                  {rangeStats.avgScore != null ? rangeStats.avgScore.toFixed(2) : "-"}
                </p>
                <p className="text-xs text-zinc-500">Average rating</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-zinc-900">{rangeStats.ratedCount}</p>
                <p className="text-xs text-zinc-500">Total ratings</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-zinc-900">{rangeStats.daysWithRatings}</p>
                <p className="text-xs text-zinc-500">Days active</p>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
