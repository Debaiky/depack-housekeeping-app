"use client";

import { useState } from "react";
import RatingButtons from "./RatingButtons";
import { RATING_LABELS } from "@/lib/areas";
import type { Area } from "@/lib/areas";

export default function AreaCard({
  area,
  rating,
  onRatingChange,
  onPhotoChange,
}: {
  area: Area;
  rating: number | null;
  onRatingChange: (rating: number) => void;
  onPhotoChange: (file: File | null) => void;
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
        {rating !== null && (
          <span className="text-xs text-zinc-500">{RATING_LABELS[rating]}</span>
        )}
      </div>

      <RatingButtons value={rating} onChange={onRatingChange} />

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
