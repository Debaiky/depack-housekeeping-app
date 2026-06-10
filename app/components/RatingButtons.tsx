"use client";

const OPTIONS = [1, 2, 3, 4, 5];

export default function RatingButtons({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (rating: number) => void;
}) {
  return (
    <div className="flex gap-2">
      {OPTIONS.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`flex-1 h-12 rounded-lg font-semibold text-lg border transition-colors ${
            value === n
              ? n < 3
                ? "bg-red-600 text-white border-red-600"
                : n === 3
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-green-600 text-white border-green-600"
              : "bg-white text-zinc-700 border-zinc-300 active:bg-zinc-100"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
