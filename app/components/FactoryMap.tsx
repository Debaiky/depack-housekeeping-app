"use client";

import {
  FACTORY_MAP_RECTS,
  FACTORY_MAP_VIEWBOX,
  FACTORY_MAP_IMAGE,
  FACTORY_MAP_IMAGE_WIDTH,
  FACTORY_MAP_IMAGE_HEIGHT,
  scoreToColor,
  NO_DATA_COLOR,
} from "@/lib/factoryMap";

export type AreaScore = {
  avgScore: number | null;
  ratedCount: number;
};

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
      <image
        href={FACTORY_MAP_IMAGE}
        x={0}
        y={0}
        width={FACTORY_MAP_IMAGE_WIDTH}
        height={FACTORY_MAP_IMAGE_HEIGHT}
        preserveAspectRatio="xMidYMid meet"
      />

      {FACTORY_MAP_RECTS.map((rect, i) => {
        const score = scores[rect.areaId];
        const fill = score?.avgScore != null ? scoreToColor(score.avgScore) : NO_DATA_COLOR;
        const isSelected = selectedAreaId === rect.areaId;
        const fontSize = Math.max(10, Math.min(20, Math.min(rect.w, rect.h) / 2.5));

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
              fillOpacity={0.55}
              stroke={isSelected ? "#1d4ed8" : "rgba(255,255,255,0.8)"}
              strokeWidth={isSelected ? 3 : 1}
            />
            {score?.avgScore != null && (
              <text
                x={rect.x + rect.w / 2}
                y={rect.y + rect.h / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={fontSize}
                fontWeight="bold"
                fill="#1f1f23"
                stroke="#ffffff"
                strokeWidth={fontSize / 8}
                paintOrder="stroke"
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
