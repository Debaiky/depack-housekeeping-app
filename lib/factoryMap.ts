// Schematic layout of the factory floor plan, used to render the FactoryMap component.
// Coordinates are in an arbitrary unit grid matching the viewBox below; they reflect the
// relative position/adjacency of each area on the real floor plan, not exact dimensions.

export type MapRect = {
  areaId: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export const FACTORY_MAP_VIEWBOX = "0 0 720 1000";

export const FACTORY_MAP_RECTS: MapRect[] = [
  // Top row
  { areaId: "office_building", x: 120, y: 0, w: 360, h: 90 },
  { areaId: "changing_rooms", x: 480, y: 30, w: 100, h: 60 },

  // Row below office
  { areaId: "sanitization_area", x: 120, y: 90, w: 180, h: 40 },
  { areaId: "cafeteria", x: 300, y: 90, w: 180, h: 40 },

  // Left support column (top to bottom)
  { areaId: "material_feeding_area", x: 0, y: 130, w: 120, h: 170 },
  { areaId: "compressors_area", x: 0, y: 300, w: 120, h: 170 },
  { areaId: "crusher_area", x: 0, y: 470, w: 120, h: 170 },
  { areaId: "quality_control_room", x: 0, y: 640, w: 120, h: 180 },

  // Center production block
  { areaId: "open_space", x: 120, y: 130, w: 360, h: 200 },
  { areaId: "breyer_extruder", x: 120, y: 330, w: 360, h: 100 },
  { areaId: "rdk_area", x: 120, y: 430, w: 180, h: 73 },
  { areaId: "rdm_area", x: 120, y: 503, w: 180, h: 73 },
  { areaId: "sleeving_area", x: 120, y: 576, w: 180, h: 74 },
  { areaId: "polytype_area", x: 300, y: 430, w: 180, h: 110 },
  { areaId: "hybrid_area", x: 300, y: 540, w: 180, h: 110 },
  { areaId: "open_space", x: 120, y: 650, w: 360, h: 170 },

  // Right column - warehouse + stored plastic rolls
  { areaId: "warehouse", x: 480, y: 130, w: 240, h: 690 },
  { areaId: "stored_plastic_rolls", x: 560, y: 700, w: 160, h: 120 },

  // Bottom row
  { areaId: "back_area", x: 0, y: 820, w: 360, h: 180 },
  { areaId: "back_building", x: 360, y: 820, w: 360, h: 180 },
];

const COLOR_STOPS: [number, [number, number, number]][] = [
  [1, [220, 38, 38]], // red-600
  [2, [249, 115, 22]], // orange-500
  [3, [251, 191, 36]], // amber-400
  [4, [132, 204, 22]], // lime-500
  [5, [22, 163, 74]], // green-600
];

export const NO_DATA_COLOR = "#d4d4d8"; // zinc-300

export function scoreToColor(score: number): string {
  const clamped = Math.max(1, Math.min(5, score));
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const [s1, c1] = COLOR_STOPS[i];
    const [s2, c2] = COLOR_STOPS[i + 1];
    if (clamped >= s1 && clamped <= s2) {
      const t = s2 === s1 ? 0 : (clamped - s1) / (s2 - s1);
      const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
      const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
      const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  return NO_DATA_COLOR;
}
