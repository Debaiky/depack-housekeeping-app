"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TodayResponse = {
  date: string;
  submitted: boolean;
  summary: {
    date: string;
    totalScore: number;
    avgScore: number;
    status: string;
    submittedBy: string;
    ratedCount: number;
  } | null;
};

export default function Home() {
  const [today, setToday] = useState<TodayResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/evaluations/today")
      .then((res) => res.json())
      .then(setToday)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-1">Today</h1>
      <p className="text-sm text-zinc-500 mb-6">
        {today?.date || new Date().toISOString().slice(0, 10)}
      </p>

      {loading ? (
        <p className="text-sm text-zinc-400">Loading...</p>
      ) : today?.submitted && today.summary ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500">Status</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                today.summary.status === "Satisfactory"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {today.summary.status}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500">Total Score</span>
            <span className="text-base font-semibold">
              {today.summary.totalScore} / {today.summary.ratedCount * 5}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500">Average</span>
            <span className="text-base font-semibold">{today.summary.avgScore.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500">Submitted by</span>
            <span className="text-sm">{today.summary.submittedBy}</span>
          </div>
          <p className="text-sm text-zinc-500 pt-2">
            Today&apos;s evaluation has already been submitted. Check the{" "}
            <Link href="/history" className="text-blue-600 font-medium underline">
              history page
            </Link>{" "}
            for trends.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 text-center space-y-4">
          <p className="text-zinc-700">No evaluation has been submitted for today yet.</p>
          <Link
            href="/evaluate"
            className="inline-block w-full rounded-lg bg-blue-600 text-white font-semibold py-3 text-base"
          >
            Start Today&apos;s Evaluation
          </Link>
        </div>
      )}

      <div className="mt-6">
        <Link href="/history" className="text-sm text-blue-600 font-medium underline">
          View weekly &amp; monthly history →
        </Link>
      </div>
    </main>
  );
}
