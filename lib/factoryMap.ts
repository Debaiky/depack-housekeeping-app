// Schematic layout of the factory floor plan — rotated 90° CCW vs. the original
// portrait layout, so it renders in landscape on wide screens.
//
// Original coordinate space: 720×1000 (portrait)
// Rotation formula (90° CCW): new_x = old_y, new_y = 720 − old_x − old_w,
//   new_w = old_h, new_h = old_w
// Resulting space: 1000×720 (landscape)

export type MapRect = {
  areaId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  // false for secondary rects that share an area ID but should not draw a label.
  primary?: boolean;
};

export const FACTORY_MAP_VIEWBOX = "0 0 1000 720";

export const FACTORY_MAP_RECTS: MapRect[] = [
  // ── Left edge: office building + adjacent strip ──────────────────────────
  { areaId: "office_building",       x: 0,   y: 240, w: 90,  h: 360 },
  { areaId: "changing_rooms",        x: 30,  y: 140, w: 60,  h: 100 },

  // Sanitization + cafeteria thin column
  { areaId: "sanitization_area",     x: 90,  y: 420, w: 40,  h: 180 },
  { areaId: "cafeteria",             x: 90,  y: 240, w: 40,  h: 180 },

  // ── Top strip: Warehouse 1–4 ─────────────────────────────────────────────
  { areaId: "warehouse_1",           x: 130, y: 0,   w: 172, h: 240 },
  { areaId: "warehouse_2",           x: 302, y: 0,   w: 173, h: 240 },
  { areaId: "warehouse_3",           x: 475, y: 0,   w: 173, h: 240 },
  { areaId: "warehouse_4",           x: 648, y: 0,   w: 172, h: 240 },

  // ── Centre: Open Space (upper block, split into areas 1 & 2) ─────────────
  { areaId: "open_space_2",          x: 130, y: 240, w: 200, h: 180 },
  { areaId: "open_space_1",          x: 130, y: 420, w: 200, h: 180 },

  // ── Centre: Breyer Extruder (tall vertical block) ────────────────────────
  { areaId: "breyer_extruder",       x: 330, y: 240, w: 100, h: 360 },

  // ── Centre-left column: RDK / RDM / Sleeving ────────────────────────────
  { areaId: "rdk_area",              x: 430, y: 420, w: 73,  h: 180 },
  { areaId: "rdm_area",              x: 503, y: 420, w: 73,  h: 180 },
  { areaId: "sleeving_area",         x: 576, y: 420, w: 74,  h: 180 },

  // ── Centre-right column: Polytype / Hybrid ───────────────────────────────
  { areaId: "polytype_area",         x: 430, y: 240, w: 110, h: 180 },
  { areaId: "hybrid_area",           x: 540, y: 240, w: 110, h: 180 },

  // ── Centre: Open Space (lower block, areas 3 & 4) ────────────────────────
  { areaId: "open_space_4",          x: 650, y: 240, w: 170, h: 180 },
  { areaId: "open_space_3",          x: 650, y: 420, w: 170, h: 170 },

  // ── Bottom strip: Material Feeding / Compressors / Crusher / QC Room ─────
  { areaId: "material_feeding_area", x: 130, y: 600, w: 170, h: 120 },
  { areaId: "compressors_area",      x: 300, y: 600, w: 170, h: 120 },
  { areaId: "crusher_area",          x: 470, y: 600, w: 170, h: 120 },
  { areaId: "quality_control_room",  x: 640, y: 600, w: 180, h: 120 },

  // ── Right edge: Back Building (corridor + 3 floors) + Back Area ──────────
  { areaId: "back_building_corridor", x: 820, y: 0,   w: 30,  h: 360 },
  { areaId: "back_building_3f",       x: 850, y: 0,   w: 150, h: 120 },
  { areaId: "back_building_2f",       x: 850, y: 120, w: 150, h: 120 },
  { areaId: "back_building_1f",       x: 850, y: 240, w: 150, h: 120 },
  { areaId: "back_area",             x: 820, y: 360, w: 180, h: 360 },
];

const COLOR_STOPS: [number, [number, number, number]][] = [
  [1, [220, 38, 38]],  // red-600
  [2, [249, 115, 22]], // orange-500
  [3, [251, 191, 36]], // amber-400
  [4, [132, 204, 22]], // lime-500
  [5, [22, 163, 74]],  // green-600
];

export const NO_DATA_COLOR = "#d4d4d8"; // zinc-300

export function scoreToColor(score: number): string {
  const clamped = Math.max(1, Math.min(5, score));
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const [s1, c1] = COLOR_STOPS[i];
    const [s2, c2] = COLOR_STOPS[i + 1];
    if (clamped >= s1 && clamped <= s2) {
      const t = (clamped - s1) / (s2 - s1);
      return `rgb(${Math.round(c1[0] + (c2[0] - c1[0]) * t)},${Math.round(c1[1] + (c2[1] - c1[1]) * t)},${Math.round(c1[2] + (c2[2] - c1[2]) * t)})`;
    }
  }
  return NO_DATA_COLOR;
}
