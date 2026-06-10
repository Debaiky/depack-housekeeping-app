// Overlay layout for the real factory floor plan image (public/factory-floorplan.png).
// Coordinates are pixel positions on that image; rects are drawn as semi-transparent
// color overlays on top of the floor plan to show each area's rating.

export type MapRect = {
  areaId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  // Set to false for secondary rects that belong to the same area (e.g. the
  // production area has two "Open Space" zones on the floor plan) so the
  // label/score is only drawn once.
  primary?: boolean;
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
  { areaId: "open_space", x: 135, y: 205, w: 190, h: 74, primary: true },
  { areaId: "breyer_extruder", x: 135, y: 281, w: 190, h: 76 },
  { areaId: "rdk_area", x: 135, y: 358, w: 97, h: 38 },
  { areaId: "rdm_area", x: 135, y: 397, w: 97, h: 76 },
  { areaId: "sleeving_area", x: 135, y: 474, w: 97, h: 114 },
  { areaId: "polytype_area", x: 232, y: 358, w: 93, h: 76 },
  { areaId: "hybrid_area", x: 232, y: 434, w: 93, h: 40 },
  { areaId: "open_space", x: 135, y: 474, w: 190, h: 114, primary: false },

  // Right column - warehouse + sheet rolls
  { areaId: "warehouse", x: 329, y: 205, w: 191, h: 383 },
  { areaId: "stored_plastic_rolls", x: 420, y: 480, w: 90, h: 100 },

  // Bottom row
  { areaId: "back_area", x: 84, y: 605, w: 232, h: 161 },
  { areaId: "back_building", x: 329, y: 605, w: 191, h: 161 },
];

// Distinct identity color per area, taken from the original floor plan drawing,
// drawn as the rect border so adjacent areas remain visually separated even
// when they share a similar rating color.
export const AREA_BORDER_COLORS: Record<string, string> = {
  office_building: "rgb(254, 242, 80)",
  changing_rooms: "rgb(150, 130, 130)",
  sanitization_area: "rgb(104, 226, 75)",
  cafeteria: "rgb(234, 130, 125)",
  material_feeding_area: "rgb(71, 85, 228)",
  compressors_area: "rgb(101, 186, 111)",
  crusher_area: "rgb(55, 112, 58)",
  quality_control_room: "rgb(170, 244, 184)",
  open_space: "rgb(122, 232, 228)",
  breyer_extruder: "rgb(65, 145, 139)",
  rdk_area: "rgb(110, 48, 196)",
  rdm_area: "rgb(182, 150, 242)",
  sleeving_area: "rgb(80, 200, 196)",
  polytype_area: "rgb(234, 246, 80)",
  hybrid_area: "rgb(235, 170, 59)",
  warehouse: "rgb(216, 78, 45)",
  stored_plastic_rolls: "rgb(180, 140, 90)",
  back_area: "rgb(150, 190, 150)",
  back_building: "rgb(55, 112, 58)",
};

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
