"use client";

import { ALL_AREAS } from "@/lib/areas";
import {
  FACTORY_MAP_RECTS,
  FACTORY_MAP_VIEWBOX,
  AREA_BORDER_COLORS,
  scoreToColor,
  NO_DATA_COLOR,
} from "@/lib/factoryMap";

export type AreaScore = {
  avgScore: number | null;
  ratedCount: number;
  machineAvgScore?: number | null;
  machineRatedCount?: number;
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
        const showDetails = rect.primary !== false;
        const hasMachine = !!score?.machineRatedCount;

        const labelFontSize = Math.max(9, Math.min(15, Math.min(rect.w, rect.h) / 8));
        const scoreFontSize = labelFontSize * 1.3;
        const machineFontSize = labelFontSize * 0.9;

        const labelY = rect.y + rect.h / 2 - (showDetails ? scoreFontSize * (hasMachine ? 1.1 : 0.7) : 0);
        const scoreY = rect.y + rect.h / 2 + (hasMachine ? 0 : scoreFontSize * 0.6);
        const machineY = scoreY + machineFontSize + 4;

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
              stroke={isSelected ? "#1d4ed8" : AREA_BORDER_COLORS[rect.areaId] || "#ffffff"}
              strokeWidth={isSelected ? 4 : 2}
            />
            {showDetails && (
              <>
                <text
                  x={rect.x + rect.w / 2}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={labelFontSize}
                  fill="#1f1f23"
                  stroke="#ffffff"
                  strokeWidth={labelFontSize / 6}
                  paintOrder="stroke"
                  className="pointer-events-none font-medium"
                >
                  {LABELS[rect.areaId]}
                </text>
                {score?.avgScore != null && (
                  <text
                    x={rect.x + rect.w / 2}
                    y={scoreY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={scoreFontSize}
                    fontWeight="bold"
                    fill="#1f1f23"
                    stroke="#ffffff"
                    strokeWidth={scoreFontSize / 8}
                    paintOrder="stroke"
                    className="pointer-events-none"
                  >
                    {score.avgScore.toFixed(1)}
                  </text>
                )}
                {hasMachine && score?.machineAvgScore != null && (
                  <text
                    x={rect.x + rect.w / 2}
                    y={machineY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={machineFontSize}
                    fontWeight="600"
                    fill="#1f1f23"
                    stroke="#ffffff"
                    strokeWidth={machineFontSize / 6}
                    paintOrder="stroke"
                    className="pointer-events-none"
                  >
                    M: {score.machineAvgScore.toFixed(1)}
                  </text>
                )}
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
