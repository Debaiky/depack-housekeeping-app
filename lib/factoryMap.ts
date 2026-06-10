// Overlay layout for the real factory floor plan image (public/factory-floorplan.png).
// Coordinates are pixel positions on that image; rects are drawn as semi-transparent
// color overlays on top of the floor plan to show each area's rating.

export type MapRect = {
  areaId: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export const FACTORY_MAP_IMAGE = "/factory-floorplan.png";
export const FACTORY_MAP_IMAGE_WIDTH = 630;
export const FACTORY_MAP_IMAGE_HEIGHT = 835;
export const FACTORY_MAP_VIEWBOX = `0 0 ${FACTORY_MAP_IMAGE_WIDTH} ${FACTORY_MAP_IMAGE_HEIGHT}`;

export const FACTORY_MAP_RECTS: MapRect[] = [
  // Top row
  { areaId: "office_building", x: 231, y: 102, w: 191, h: 67 },
  { areaId: "changing_rooms", x: 345, y: 148, w: 77, h: 21 },
  { areaId: "sanitization_area", x: 231, y: 171, w: 94, h: 30 },
  { areaId: "cafeteria", x: 328, y: 171, w: 95, h: 30 },

  // Left support column (top to bottom)
  { areaId: "material_feeding_area", x: 84, y: 204, w: 49, h: 115 },
  { areaId: "compressors_area", x: 84, y: 359, w: 49, h: 75 },
  { areaId: "crusher_area", x: 84, y: 436, w: 49, h: 76 },
  { areaId: "quality_control_room", x: 84, y: 514, w: 49, h: 36 },

  // Center production block
  { areaId: "open_space", x: 135, y: 205, w: 190, h: 74 },
  { areaId: "breyer_extruder", x: 135, y: 281, w: 190, h: 76 },
  { areaId: "rdk_area", x: 135, y: 358, w: 97, h: 38 },
  { areaId: "rdm_area", x: 135, y: 397, w: 97, h: 76 },
  { areaId: "sleeving_area", x: 135, y: 474, w: 97, h: 114 },
  { areaId: "polytype_area", x: 232, y: 358, w: 93, h: 76 },
  { areaId: "hybrid_area", x: 232, y: 434, w: 93, h: 40 },
  { areaId: "open_space", x: 135, y: 474, w: 190, h: 114 },

  // Right column - warehouse + stored plastic rolls
  { areaId: "warehouse", x: 329, y: 205, w: 191, h: 383 },
  { areaId: "stored_plastic_rolls", x: 420, y: 480, w: 90, h: 100 },

  // Bottom row
  { areaId: "back_area", x: 84, y: 605, w: 232, h: 161 },
  { areaId: "back_building", x: 329, y: 605, w: 191, h: 161 },
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
