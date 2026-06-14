"use client";

import { useState } from "react";
import RatingButtons from "./RatingButtons";
import {
  RATING_LABELS, MACHINE_RATING_LABELS, NA, CATEGORY_LABELS,
  type RatingValue, type Area, type EvalCategory,
  hasMachineRating,
} from "@/lib/areas";

export type CategoryRatings = {
  hygiene: RatingValue | null;
  safety: RatingValue | null;
  infrastructure: RatingValue | null;
};

export type MachineRatings = {
  hygiene: RatingValue | null;
  safety: RatingValue | null;
};

export default function AreaCard({
  area,
  ratings,
  machineRatings,
  notes,
  onRatingChange,
  onMachineRatingChange,
  onPhotoChange,
  onNoteChange,
  responsiblePerson,
  onResponsiblePersonChange,
}: {
  area: Area;
  ratings: CategoryRatings;
  machineRatings: MachineRatings;
  notes: Record<EvalCategory, string>;
  onRatingChange: (cat: EvalCategory, val: RatingValue) => void;
  onMachineRatingChange: (cat: "hygiene" | "safety", val: RatingValue) => void;
  onPhotoChange: (cat: EvalCategory, file: File | null) => void;
  onNoteChange: (cat: EvalCategory, note: string) => void;
  responsiblePerson: string;
  onResponsiblePersonChange: (name: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<EvalCategory>("hygiene");
  const [previewUrls, setPreviewUrls] = useState<Record<EvalCategory, string | null>>({
    hygiene: null, safety: null, infrastructure: null,
  });
  const [showNote, setShowNote] = useState<Record<EvalCategory, boolean>>({
    hygiene: !!notes.hygiene, safety: !!notes.safety, infrastructure: !!notes.infrastructure,
  });

  const hasMachine = hasMachineRating(area);
  const tabs: EvalCategory[] = ["hygiene", "safety", "infrastructure"];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    onPhotoChange(activeTab, file);
    const old = previewUrls[activeTab];
    if (old) URL.revokeObjectURL(old);
    setPreviewUrls((p) => ({ ...p, [activeTab]: file ? URL.createObjectURL(file) : null }));
  }

  const currentRating = ratings[activeTab];
  const preview = previewUrls[activeTab];
  const note = notes[activeTab];
  const showMachine = hasMachine && (activeTab === "hygiene" || activeTab === "safety");
  const machineRating =
    activeTab === "hygiene" ? machineRatings.hygiene :
    activeTab === "safety" ? machineRatings.safety : null;

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-zinc-900">{area.label}</h3>
          {currentRating !== null && currentRating !== NA && (
            <span className="text-xs text-zinc-400">{RATING_LABELS[currentRating as number]}</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-100">
        {tabs.map((tab) => {
          const done = ratings[tab] !== null;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : done
                  ? "text-green-600"
                  : "text-zinc-400"
              }`}
            >
              {CATEGORY_LABELS[tab]}{done && activeTab !== tab ? " ✓" : ""}
            </button>
          );
        })}
      </div>

      {/* Tab body */}
      <div className="p-5 space-y-4">
        <RatingButtons value={currentRating} onChange={(r) => onRatingChange(activeTab, r)} />

        {/* Machine rating — Hygiene and Safety tabs only */}
        {showMachine && (
          <div className="rounded-xl bg-zinc-50 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-zinc-700">
                Machine {CATEGORY_LABELS[activeTab as "hygiene" | "safety"]}
              </h4>
              {machineRating !== null && machineRating !== undefined && machineRating !== NA && (
                <span className="text-xs text-zinc-400">
                  {MACHINE_RATING_LABELS[machineRating as number]}
                </span>
              )}
            </div>
            <RatingButtons
              value={machineRating ?? null}
              onChange={(r) => onMachineRatingChange(activeTab as "hygiene" | "safety", r)}
              variant="smiley"
            />
            {activeTab === "hygiene" && (
              <div>
                <label className="block text-xs text-zinc-500 mb-1">
                  Responsible person (optional)
                </label>
                <input
                  type="text"
                  value={responsiblePerson}
                  onChange={(e) => onResponsiblePersonChange(e.target.value)}
                  placeholder="Name"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        )}

        {/* Photo */}
        <div>
          <label className="inline-flex items-center gap-2 text-sm text-blue-600 font-medium cursor-pointer">
            <span>{preview ? "Change photo" : "Add photo (optional)"}</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          {preview && (
            <img
              src={preview}
              alt={`${area.label} preview`}
              className="mt-2 h-24 w-24 object-cover rounded-lg border border-zinc-200"
            />
          )}
        </div>

        {/* Note */}
        <div>
          {showNote[activeTab] ? (
            <textarea
              value={note}
              onChange={(e) => onNoteChange(activeTab, e.target.value)}
              placeholder="Add a note (optional)"
              rows={2}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowNote((s) => ({ ...s, [activeTab]: true }))}
              className="text-sm text-blue-600 font-medium"
            >
              + Add note
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
