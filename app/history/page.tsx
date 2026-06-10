"use client";

import { useEffect, useState } from "react";

type DailyRow = {
  date: string;
  totalScore: number;
  avgScore: number;
  status: string;
};

type PeriodResult = {
  avgScore: number;
  unsatisfactoryDays: number;
  totalDays: number;
  status: string;
};

type SummaryResponse = {
  daily: DailyRow[];
  weekly: PeriodResult;
  monthly: PeriodResult;
};

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
            {data.daily.map((row) => (
              <div key={row.date} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-zinc-900">{row.date}</p>
                  <p className="text-sm text-zinc-500">
                    Total {row.totalScore} / 95 · Avg {row.avgScore.toFixed(2)}
                  </p>
                </div>
                <StatusBadge status={row.status} />
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
