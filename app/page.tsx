"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FactoryMap, { type AreaScore } from "./components/FactoryMap";
import AreaDetailsModal from "./components/AreaDetailsModal";

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
  areas: Record<string, AreaScore>;
};

export default function Home() {
  const [today, setToday] = useState<TodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

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
            You&apos;ve submitted today&apos;s evaluation. Check the{" "}
            <Link href="/history" className="text-blue-600 font-medium underline">
              history page
            </Link>{" "}
            for trends.
          </p>
        </div>
      ) : null}

      {!loading && !today?.submitted && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 text-center space-y-4">
          <p className="text-zinc-700">You haven&apos;t submitted today&apos;s evaluation yet.</p>
          <Link
            href="/evaluate"
            className="inline-block w-full rounded-lg bg-blue-600 text-white font-semibold py-3 text-base"
          >
            Start Today&apos;s Evaluation
          </Link>
        </div>
      )}

      {!loading && today && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Factory Map - Today
            </h2>
            <Link href="/map" className="text-sm text-blue-600 font-medium underline">
              View by date →
            </Link>
          </div>
          <FactoryMap scores={today.areas} onAreaClick={(id) => setSelectedAreaId(id)} />
          <p className="text-xs text-zinc-400 mt-2">
            Color shows each area&apos;s average rating today across all users (red = poor,
            green = excellent). Gray means no rating was recorded for that area yet. Tap an
            area to see individual ratings, photos and notes.
          </p>
        </div>
      )}

      <div className="mt-6">
        <Link href="/history" className="text-sm text-blue-600 font-medium underline">
          View weekly &amp; monthly history →
        </Link>
      </div>

      {selectedAreaId && today && (
        <AreaDetailsModal
          key={`${selectedAreaId}-${today.date}-${today.date}`}
          areaId={selectedAreaId}
          from={today.date}
          to={today.date}
          onClose={() => setSelectedAreaId(null)}
        />
      )}
    </main>
  );
}
