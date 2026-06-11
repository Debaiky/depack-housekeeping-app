"use client";

import { useEffect, useState } from "react";
import { ALL_AREAS, isProductionArea } from "@/lib/areas";
import FactoryMap, { type AreaScore } from "../components/FactoryMap";
import AreaDetailsModal from "../components/AreaDetailsModal";

type AreaRatingSummary = AreaScore & {
  machineAvgScore: number | null;
  machineRatedCount: number;
  responsiblePerson?: string;
  note?: string;
};

type MapResponse = {
  from: string;
  to: string;
  areas: Record<string, AreaRatingSummary>;
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

export default function MapPage() {
  const [dateFrom, setDateFrom] = useState(todayDate());
  const [dateTo, setDateTo] = useState(todayDate());
  const [data, setData] = useState<MapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [detailsAreaId, setDetailsAreaId] = useState<string | null>(null);

  useEffect(() => {
    const from = dateFrom <= dateTo ? dateFrom : dateTo;
    const to = dateFrom <= dateTo ? dateTo : dateFrom;
    fetch(`/api/map?from=${from}&to=${to}`)
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  const from = dateFrom <= dateTo ? dateFrom : dateTo;
  const to = dateFrom <= dateTo ? dateTo : dateFrom;
  const rangeDays =
    Math.round((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const detailsEnabled = rangeDays <= 7;

  function handleAreaClick(id: string) {
    setSelectedAreaId((cur) => (cur === id ? null : id));
    if (detailsEnabled) setDetailsAreaId(id);
  }

  const sortedAreas = [...ALL_AREAS].sort((a, b) => {
    const sa = data?.areas[a.id]?.avgScore;
    const sb = data?.areas[b.id]?.avgScore;
    if (sa == null && sb == null) return 0;
    if (sa == null) return 1;
    if (sb == null) return -1;
    return sa - sb;
  });

  return (
    <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-1">Factory Map</h1>
      <p className="text-sm text-zinc-500 mb-4">
        View average cleanliness ratings by area over a date range.
      </p>

      <div className="flex items-center gap-2 mb-4">
        <label className="text-sm text-zinc-500">
          From
          <input
            type="date"
            value={dateFrom}
            max={todayDate()}
            onChange={(e) => setDateFrom(e.target.value)}
            className="block border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1"
          />
        </label>
        <label className="text-sm text-zinc-500">
          To
          <input
            type="date"
            value={dateTo}
            max={todayDate()}
            onChange={(e) => setDateTo(e.target.value)}
            className="block border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1"
          />
        </label>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">Loading...</p>
      ) : (
        <>
          <FactoryMap
            scores={data?.areas || {}}
            selectedAreaId={selectedAreaId}
            onAreaClick={handleAreaClick}
          />
          {detailsEnabled && (
            <p className="text-xs text-zinc-400 mt-1">
              Tap an area to see individual ratings, photos and notes for this period.
            </p>
          )}

          <div className="mt-6 bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
            {sortedAreas.map((area) => {
              const summary = data?.areas[area.id];
              const isSelected = selectedAreaId === area.id;
              return (
                <div
                  key={area.id}
                  onClick={() => handleAreaClick(area.id)}
                  className={`p-4 cursor-pointer ${isSelected ? "bg-blue-50" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-zinc-900">{area.label}</p>
                      <p className="text-xs text-zinc-500">
                        {summary?.ratedCount ? `${summary.ratedCount} rating(s)` : "No rating recorded"}
                      </p>
                    </div>
                    <span className={`text-base font-semibold ${scoreColorClass(summary?.avgScore ?? null)}`}>
                      {summary?.avgScore != null ? summary.avgScore.toFixed(1) : "-"}
                    </span>
                  </div>

                  {isProductionArea(area) && summary?.machineRatedCount ? (
                    <div className="mt-2 pt-2 border-t border-zinc-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-zinc-500">Machine cleanliness</p>
                        {summary.responsiblePerson && (
                          <p className="text-xs text-zinc-400">
                            Responsible: {summary.responsiblePerson}
                          </p>
                        )}
                      </div>
                      <span className={`text-sm font-semibold ${scoreColorClass(summary.machineAvgScore)}`}>
                        {summary.machineAvgScore?.toFixed(1)}
                      </span>
                    </div>
                  ) : null}

                  {summary?.note && (
                    <p className="mt-2 pt-2 border-t border-zinc-100 text-xs text-zinc-500 italic">
                      &quot;{summary.note}&quot;
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "rgb(220,38,38)" }} /> 1 - Filthy
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "rgb(249,115,22)" }} /> 2 - Poor
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "rgb(251,191,36)" }} /> 3 - Acceptable
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "rgb(132,204,22)" }} /> 4 - Good
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "rgb(22,163,74)" }} /> 5 - Excellent
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm bg-zinc-300" /> No rating
            </span>
          </div>
        </>
      )}

      {detailsEnabled && detailsAreaId && (
        <AreaDetailsModal
          key={`${detailsAreaId}-${from}-${to}`}
          areaId={detailsAreaId}
          from={from}
          to={to}
          onClose={() => setDetailsAreaId(null)}
        />
      )}
    </main>
  );
}
