"use client";

import { useState } from "react";
import RatingButtons from "./RatingButtons";
import { RATING_LABELS, MACHINE_RATING_LABELS, NA, type RatingValue, type Area } from "@/lib/areas";

export default function AreaCard({
  area,
  rating,
  onRatingChange,
  onPhotoChange,
  showMachineRating = false,
  machineRating,
  onMachineRatingChange,
  responsiblePerson,
  onResponsiblePersonChange,
}: {
  area: Area;
  rating: RatingValue | null;
  onRatingChange: (rating: RatingValue) => void;
  onPhotoChange: (file: File | null) => void;
  showMachineRating?: boolean;
  machineRating?: RatingValue | null;
  onMachineRatingChange?: (rating: RatingValue) => void;
  responsiblePerson?: string;
  onResponsiblePersonChange?: (name: string) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    onPhotoChange(file);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-zinc-900">{area.label}</h3>
        {rating !== null && rating !== NA && (
          <span className="text-xs text-zinc-500">{RATING_LABELS[rating]}</span>
        )}
      </div>

      <RatingButtons value={rating} onChange={onRatingChange} />

      {showMachineRating && (
        <div className="pt-2 border-t border-zinc-100 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-zinc-700">Machine Cleanliness</h4>
            {machineRating !== null && machineRating !== undefined && machineRating !== NA && (
              <span className="text-xs text-zinc-500">{MACHINE_RATING_LABELS[machineRating]}</span>
            )}
          </div>
          <RatingButtons
            value={machineRating ?? null}
            onChange={(r) => onMachineRatingChange?.(r)}
            variant="smiley"
          />
          <div>
            <label className="block text-xs text-zinc-500 mb-1">
              Responsible person (optional)
            </label>
            <input
              type="text"
              value={responsiblePerson ?? ""}
              onChange={(e) => onResponsiblePersonChange?.(e.target.value)}
              placeholder="Name"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      <div>
        <label className="inline-flex items-center gap-2 text-sm text-blue-600 font-medium cursor-pointer">
          <span>{previewUrl ? "Change photo" : "Add photo (optional)"}</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        {previewUrl && (
          <img
            src={previewUrl}
            alt={`${area.label} preview`}
            className="mt-2 h-24 w-24 object-cover rounded-lg border border-zinc-200"
          />
        )}
      </div>
    </div>
  );
}
