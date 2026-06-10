"use client";

import { NA, type RatingValue } from "@/lib/areas";

const OPTIONS: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5];

const SMILEYS: Record<number, string> = {
  1: "😠",
  2: "🙁",
  3: "😐",
  4: "🙂",
  5: "😄",
};

const SELECTED_COLORS: Record<number, string> = {
  1: "bg-red-600 text-white border-red-600",
  2: "bg-orange-500 text-white border-orange-500",
  3: "bg-amber-400 text-white border-amber-400",
  4: "bg-lime-500 text-white border-lime-500",
  5: "bg-green-600 text-white border-green-600",
};

export default function RatingButtons({
  value,
  onChange,
  variant = "number",
}: {
  value: RatingValue | null;
  onChange: (rating: RatingValue) => void;
  variant?: "number" | "smiley";
}) {
  return (
    <div className="flex gap-2">
      {OPTIONS.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`flex-1 h-12 rounded-lg font-semibold border transition-colors flex items-center justify-center ${
            variant === "smiley" ? "text-2xl" : "text-lg"
          } ${
            value === n
              ? variant === "smiley"
                ? SELECTED_COLORS[n]
                : n < 3
                ? "bg-red-600 text-white border-red-600"
                : n === 3
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-green-600 text-white border-green-600"
              : "bg-white text-zinc-700 border-zinc-300 active:bg-zinc-100"
          }`}
        >
          {variant === "smiley" ? SMILEYS[n] : n}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(NA)}
        className={`flex-1 h-12 rounded-lg font-semibold text-sm border transition-colors ${
          value === NA
            ? "bg-zinc-500 text-white border-zinc-500"
            : "bg-white text-zinc-500 border-zinc-300 active:bg-zinc-100"
        }`}
      >
        N/A
      </button>
    </div>
  );
}
