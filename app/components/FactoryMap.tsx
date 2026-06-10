"use client";

import { ALL_AREAS } from "@/lib/areas";
import {
  FACTORY_MAP_RECTS,
  FACTORY_MAP_VIEWBOX,
  FACTORY_MAP_IMAGE,
  FACTORY_MAP_IMAGE_WIDTH,
  FACTORY_MAP_IMAGE_HEIGHT,
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

// Shorter labels for the map overlay, where space is tight.
const MAP_LABELS: Record<string, string> = {
  office_building: "Office",
  changing_rooms: "Changing Rooms",
  sanitization_area: "Sanitization",
  cafeteria: "Cafeteria",
  material_feeding_area: "Material Feeding",
  compressors_area: "Compressors",
  crusher_area: "Crusher",
  quality_control_room: "QC Room",
  open_space: "Open Space",
  breyer_extruder: "Breyer Extruder",
  rdk_area: "RDK",
  rdm_area: "RDM",
  sleeving_area: "Sleeving",
  polytype_area: "Polytype",
  hybrid_area: "Hybrid",
  warehouse: "Warehouse",
  stored_plastic_rolls: "Sheet Rolls",
  back_area: "Back Area",
  back_building: "Back Building",
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
        const showDetails = rect.primary !== false;
        const hasMachine = !!score?.machineRatedCount;

        const labelFontSize = Math.max(7, Math.min(12, rect.h / 6));
        const scoreFontSize = Math.max(10, Math.min(18, rect.h / 4));
        const machineFontSize = Math.max(7, Math.min(11, rect.h / 7));

        const labelY = rect.y + labelFontSize + 3;
        const scoreY = hasMachine
          ? rect.y + rect.h / 2 - 2
          : rect.y + rect.h / 2 + (showDetails ? scoreFontSize * 0.35 : 0);
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
              fillOpacity={0.45}
              stroke={isSelected ? "#1d4ed8" : AREA_BORDER_COLORS[rect.areaId] || "#ffffff"}
              strokeWidth={isSelected ? 3 : 2}
            />
            {showDetails && (
              <>
                <text
                  x={rect.x + rect.w / 2}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={labelFontSize}
                  fontWeight="600"
                  fill="#1f1f23"
                  stroke="#ffffff"
                  strokeWidth={labelFontSize / 6}
                  paintOrder="stroke"
                  className="pointer-events-none"
                >
                  {MAP_LABELS[rect.areaId] || LABELS[rect.areaId]}
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
