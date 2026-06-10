"use client";

import { ALL_AREAS, hasMachineRating } from "@/lib/areas";
import { FACTORY_MAP_RECTS, FACTORY_MAP_VIEWBOX, scoreToColor, NO_DATA_COLOR } from "@/lib/factoryMap";

export type AreaScore = {
  avgScore: number | null;
  ratedCount: number;
  machineAvgScore?: number | null;
  machineRatedCount?: number;
};

const LABELS = Object.fromEntries(ALL_AREAS.map((a) => [a.id, a.label]));
const MACHINE_AREA_IDS = new Set(ALL_AREAS.filter(hasMachineRating).map((a) => a.id));

// Roughly approximate how many characters of a given font size fit in a width,
// then greedily wrap words onto lines so labels stay inside their box.
function wrapLabel(text: string, maxWidth: number, fontSize: number): string[] {
  const maxChars = Math.max(1, Math.floor(maxWidth / (fontSize * 0.55)));
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

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
        const hasMachine = MACHINE_AREA_IDS.has(rect.areaId) && !!score?.machineRatedCount;

        const fontSize = Math.max(9, Math.min(15, Math.min(rect.w, rect.h) / 8));
        const lineHeight = fontSize * 1.15;
        const scoreFontSize = fontSize * 1.3;
        const machineFontSize = fontSize * 0.9;

        const labelLines = showDetails ? wrapLabel(LABELS[rect.areaId], rect.w - 8, fontSize) : [];
        const labelHeight = labelLines.length * lineHeight;
        const scoreHeight = score?.avgScore != null ? scoreFontSize * 1.1 : 0;
        const machineHeight = hasMachine ? machineFontSize * 1.2 : 0;
        const contentHeight = labelHeight + scoreHeight + machineHeight;

        const startY = rect.y + rect.h / 2 - contentHeight / 2 + lineHeight / 2;
        const scoreY = startY + labelHeight - lineHeight / 2 + scoreFontSize * 0.6;
        const machineY = scoreY + scoreFontSize * 0.5 + machineFontSize;

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
            {showDetails && (
              <>
                <text
                  x={rect.x + rect.w / 2}
                  textAnchor="middle"
                  fontSize={fontSize}
                  fill="#1f1f23"
                  className="pointer-events-none font-medium"
                >
                  {labelLines.map((line, li) => (
                    <tspan key={li} x={rect.x + rect.w / 2} y={startY + li * lineHeight}>
                      {line}
                    </tspan>
                  ))}
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
