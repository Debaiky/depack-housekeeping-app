"use client";

import { useEffect, useState } from "react";

type DailyRow = {
  date: string;
  totalScore: number;
  avgScore: number;
  status: string;
  submittedBy: string;
  hygieneAvg?: number;
  safetyAvg?: number;
  infraAvg?: number;
};

type PeriodResult = {
  avgScore: number;
  unsatisfactoryDays: number;
  totalDays: number;
  status: string;
};

type PersonScore = {
  person: string;
  avgScore: number;
  ratedCount: number;
};

type AreaPerformance = {
  areaId: string;
  areaLabel: string;
  avgScore: number;
  ratedCount: number;
};

type SummaryResponse = {
  daily: DailyRow[];
  weekly: PeriodResult;
  monthly: PeriodResult;
  personScores: PersonScore[];
  areaPerformance: AreaPerformance[];
  areaPerformanceWindowDays: number;
};

function scoreColorClass(score: number): string {
  if (score < 3) return "text-red-600";
  if (score < 3.5) return "text-amber-600";
  return "text-green-600";
}

const MIN_RATINGS_FOR_RANKING = 3;

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
        status === "Satisfactory"
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {status}
    </span>
  );
}

function PeriodCard({ title, result }: { title: string; result: PeriodResult }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-zinc-900">{title}</h3>
        <StatusBadge status={result.status} />
      </div>
      <div className="text-sm text-zinc-600 space-y-1">
        <div className="flex justify-between">
          <span>Average daily score</span>
          <span className="font-medium">{result.avgScore.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Unsatisfactory days</span>
          <span className="font-medium">
            {result.unsatisfactoryDays} / {result.totalDays}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/summary")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-4">History</h1>

      {loading || !data ? (
        <p className="text-sm text-zinc-400">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <PeriodCard title="This Week" result={data.weekly} />
            <PeriodCard title="This Month" result={data.monthly} />
          </div>

          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-2">
            Daily Results
          </h2>
          <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
            {data.daily.length === 0 && (
              <p className="p-4 text-sm text-zinc-400">No evaluations recorded yet.</p>
            )}
            {data.daily.map((row, i) => (
              <div key={`${row.date}-${i}`} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-zinc-900">{row.date}</p>
                    <p className="text-sm text-zinc-500">
                      Total {row.totalScore} · Avg {row.avgScore.toFixed(2)}
                      {row.submittedBy ? ` · ${row.submittedBy}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={row.status} />
                </div>
                {(row.hygieneAvg !== undefined || row.safetyAvg !== undefined || row.infraAvg !== undefined) && (
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-center text-zinc-500">
                    <span>H: {row.hygieneAvg?.toFixed(2) ?? "-"}</span>
                    <span>S: {row.safetyAvg?.toFixed(2) ?? "-"}</span>
                    <span>I: {row.infraAvg?.toFixed(2) ?? "-"}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {(() => {
            const ranked = data.areaPerformance.filter((a) => a.ratedCount >= MIN_RATINGS_FOR_RANKING);
            if (ranked.length === 0) return null;
            const needsImprovement = ranked.slice(0, 3);
            const topPerforming = [...ranked].slice(-3).reverse();

            return (
              <>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-2 mt-6">
                  Area Hygiene - Last {data.areaPerformanceWindowDays} Days
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-zinc-500 mb-2">⚠️ Needs Improvement</p>
                    <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
                      {needsImprovement.map((a) => (
                        <div key={a.areaId} className="flex items-center justify-between p-3">
                          <div>
                            <p className="text-sm font-medium text-zinc-900">{a.areaLabel}</p>
                            <p className="text-xs text-zinc-500">{a.ratedCount} ratings</p>
                          </div>
                          <span className={`text-sm font-semibold ${scoreColorClass(a.avgScore)}`}>
                            {a.avgScore.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500 mb-2">🏆 Top Performing Areas</p>
                    <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
                      {topPerforming.map((a) => (
                        <div key={a.areaId} className="flex items-center justify-between p-3">
                          <div>
                            <p className="text-sm font-medium text-zinc-900">{a.areaLabel}</p>
                            <p className="text-xs text-zinc-500">{a.ratedCount} ratings</p>
                          </div>
                          <span className={`text-sm font-semibold ${scoreColorClass(a.avgScore)}`}>
                            {a.avgScore.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {(() => {
            const ranked = data.personScores.filter((p) => p.ratedCount >= MIN_RATINGS_FOR_RANKING);
            if (ranked.length === 0) return null;
            const topPerformers = [...ranked].slice(-3).reverse();
            const needsImprovement = ranked.slice(0, 3);

            return (
              <>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-2 mt-6">
                  Machine Cleanliness by Responsible Person
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-xs font-medium text-zinc-500 mb-2">🏆 Reward Candidates</p>
                    <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
                      {topPerformers.map((p) => (
                        <div key={p.person} className="flex items-center justify-between p-3">
                          <div>
                            <p className="text-sm font-medium text-zinc-900">{p.person}</p>
                            <p className="text-xs text-zinc-500">{p.ratedCount} ratings</p>
                          </div>
                          <span className={`text-sm font-semibold ${scoreColorClass(p.avgScore)}`}>
                            {p.avgScore.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500 mb-2">⚠️ Needs Improvement</p>
                    <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
                      {needsImprovement.map((p) => (
                        <div key={p.person} className="flex items-center justify-between p-3">
                          <div>
                            <p className="text-sm font-medium text-zinc-900">{p.person}</p>
                            <p className="text-xs text-zinc-500">{p.ratedCount} ratings</p>
                          </div>
                          <span className={`text-sm font-semibold ${scoreColorClass(p.avgScore)}`}>
                            {p.avgScore.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </>
      )}
    </main>
  );
}
