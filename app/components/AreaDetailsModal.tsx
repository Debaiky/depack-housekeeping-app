"use client";

import { useEffect, useState } from "react";
import { ALL_AREAS, NA, RATING_LABELS, MACHINE_RATING_LABELS } from "@/lib/areas";

type AreaEvaluationDetail = {
  date: string;
  userEmail: string;
  rating: number | typeof NA | null;
  photoUrl: string;
  ratingType: "area" | "machine";
  responsiblePerson: string;
  note: string;
};

type DetailsResponse = {
  areaId: string;
  from: string;
  to: string;
  details: AreaEvaluationDetail[];
};

const LABELS = Object.fromEntries(ALL_AREAS.map((a) => [a.id, a.label]));

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

  const areaEntries = data?.details.filter((d) => d.ratingType === "area") || [];
  const machineEntries = data?.details.filter((d) => d.ratingType === "machine") || [];

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
        ) : areaEntries.length === 0 && machineEntries.length === 0 ? (
          <p className="text-sm text-zinc-400">No ratings recorded for this period.</p>
        ) : (
          <div className="space-y-3">
            {areaEntries.map((entry, i) => (
              <div key={`area-${i}`} className="rounded-xl bg-zinc-50 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-900">{entry.userEmail}</span>
                  <span className="text-xs text-zinc-400">{entry.date}</span>
                </div>
                <div className="text-sm text-zinc-700">
                  {entry.rating === NA
                    ? "N/A"
                    : entry.rating != null
                      ? `${entry.rating} - ${RATING_LABELS[entry.rating]}`
                      : "-"}
                </div>
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
            ))}

            {machineEntries.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-zinc-700 mb-2">Machine Cleanliness</h4>
                <div className="space-y-3">
                  {machineEntries.map((entry, i) => (
                    <div key={`machine-${i}`} className="rounded-xl bg-zinc-50 p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-900">{entry.userEmail}</span>
                        <span className="text-xs text-zinc-400">{entry.date}</span>
                      </div>
                      <div className="text-sm text-zinc-700">
                        {entry.rating === NA
                          ? "N/A"
                          : entry.rating != null
                            ? `${entry.rating} - ${MACHINE_RATING_LABELS[entry.rating]}`
                            : "-"}
                      </div>
                      {entry.responsiblePerson && (
                        <p className="text-xs text-zinc-500">Responsible: {entry.responsiblePerson}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
