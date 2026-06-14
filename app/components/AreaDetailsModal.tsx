"use client";

import { useEffect, useState } from "react";
import { ALL_AREAS, NA, RATING_LABELS, MACHINE_RATING_LABELS, CATEGORY_LABELS, type EvalCategory } from "@/lib/areas";

type AreaEvaluationDetail = {
  date: string;
  userEmail: string;
  rating: number | typeof NA | null;
  photoUrl: string;
  ratingType: "area" | "machine";
  responsiblePerson: string;
  note: string;
  category: EvalCategory;
};

type DetailsResponse = {
  areaId: string;
  from: string;
  to: string;
  details: AreaEvaluationDetail[];
};

const LABELS = Object.fromEntries(ALL_AREAS.map((a) => [a.id, a.label]));

function EntryCard({ entry, isMachine }: { entry: AreaEvaluationDetail; isMachine: boolean }) {
  const ratingLabels = isMachine ? MACHINE_RATING_LABELS : RATING_LABELS;
  return (
    <div className="rounded-xl bg-zinc-50 p-3 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-900">{entry.userEmail}</span>
        <span className="text-xs text-zinc-400">{entry.date}</span>
      </div>
      <div className="text-sm text-zinc-700">
        {entry.rating === NA
          ? "N/A"
          : entry.rating != null
            ? `${entry.rating} - ${ratingLabels[entry.rating as number]}`
            : "-"}
      </div>
      {entry.responsiblePerson && (
        <p className="text-xs text-zinc-500">Responsible: {entry.responsiblePerson}</p>
      )}
      {entry.note && <p className="text-xs text-zinc-500 italic">&quot;{entry.note}&quot;</p>}
      {entry.photoUrl && (
        <a
          href={entry.photoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs text-blue-600 font-medium underline"
        >
          View photo
        </a>
      )}
    </div>
  );
}

const CATEGORIES: EvalCategory[] = ["hygiene", "safety", "infrastructure"];

export default function AreaDetailsModal({
  areaId,
  from,
  to,
  onClose,
}: {
  areaId: string;
  from: string;
  to: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<DetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/area-details?areaId=${encodeURIComponent(areaId)}&from=${from}&to=${to}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [areaId, from, to]);

  const isEmpty = !data?.details.length;

  return (
    <div
      className="fixed inset-0 z-30 bg-black/40 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-zinc-900">{LABELS[areaId] || areaId}</h3>
          <button onClick={onClose} className="text-zinc-400 text-sm">
            Close
          </button>
        </div>
        <p className="text-xs text-zinc-500">
          {from === to ? from : `${from} – ${to}`}
        </p>

        {loading ? (
          <p className="text-sm text-zinc-400">Loading...</p>
        ) : isEmpty ? (
          <p className="text-sm text-zinc-400">No ratings recorded for this period.</p>
        ) : (
          <div className="space-y-5">
            {CATEGORIES.map((cat) => {
              const areaEntries = data!.details.filter(
                (d) => d.category === cat && d.ratingType === "area"
              );
              const machineEntries = data!.details.filter(
                (d) => d.category === cat && d.ratingType === "machine"
              );
              if (areaEntries.length === 0 && machineEntries.length === 0) return null;

              return (
                <div key={cat}>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
                    {CATEGORY_LABELS[cat]}
                  </h4>
                  <div className="space-y-2">
                    {areaEntries.map((entry, i) => (
                      <EntryCard key={`area-${cat}-${i}`} entry={entry} isMachine={false} />
                    ))}
                    {machineEntries.length > 0 && (
                      <div>
                        <p className="text-xs text-zinc-400 mb-1 mt-2">Machine</p>
                        {machineEntries.map((entry, i) => (
                          <EntryCard key={`machine-${cat}-${i}`} entry={entry} isMachine={true} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
