"use client";

import { ALL_AREAS } from "@/lib/areas";
import { FACTORY_MAP_RECTS, FACTORY_MAP_VIEWBOX, scoreToColor, NO_DATA_COLOR } from "@/lib/factoryMap";

export type AreaScore = {
  avgScore: number | null;
  ratedCount: number;
};

const LABELS = Object.fromEntries(ALL_AREAS.map((a) => [a.id, a.label]));

export default function FactoryMap({
  scores,
  selectedAreaId,
  onAreaClick,
}: {
  scores: Record<string, AreaScore | undefined>;
  selectedAreaId?: string | null;
  onAreaClick?: (areaId: string) => void;
}) {
  return (
    <svg
      viewBox={FACTORY_MAP_VIEWBOX}
      className="w-full h-auto select-none rounded-xl border border-zinc-200 bg-white"
      xmlns="http://www.w3.org/2000/svg"
    >
      {FACTORY_MAP_RECTS.map((rect, i) => {
        const score = scores[rect.areaId];
        const fill = score?.avgScore != null ? scoreToColor(score.avgScore) : NO_DATA_COLOR;
        const isSelected = selectedAreaId === rect.areaId;
        const fontSize = Math.max(9, Math.min(15, Math.min(rect.w, rect.h) / 8));

        return (
          <g
            key={`${rect.areaId}-${i}`}
            onClick={() => onAreaClick?.(rect.areaId)}
            className={onAreaClick ? "cursor-pointer" : ""}
          >
            <rect
              x={rect.x}
              y={rect.y}
              width={rect.w}
              height={rect.h}
              fill={fill}
              fillOpacity={0.85}
              stroke={isSelected ? "#1d4ed8" : "#ffffff"}
              strokeWidth={isSelected ? 4 : 2}
            />
            <text
              x={rect.x + rect.w / 2}
              y={rect.y + rect.h / 2 - (score?.avgScore != null ? fontSize * 0.7 : 0)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={fontSize}
              fill="#1f1f23"
              className="pointer-events-none font-medium"
            >
              {LABELS[rect.areaId]}
            </text>
            {score?.avgScore != null && (
              <text
                x={rect.x + rect.w / 2}
                y={rect.y + rect.h / 2 + fontSize}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={fontSize * 1.3}
                fontWeight="bold"
                fill="#1f1f23"
                className="pointer-events-none"
              >
                {score.avgScore.toFixed(1)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
