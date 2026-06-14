export type Area = {
  id: string;
  label: string;
  group: string;
};

export const AREA_GROUPS = {
  MAIN: "Main Locations",
  PRODUCTION: "Production Area",
} as const;

export type EvalCategory = "hygiene" | "safety" | "infrastructure";
export const EVAL_CATEGORIES: EvalCategory[] = ["hygiene", "safety", "infrastructure"];
export const CATEGORY_LABELS: Record<EvalCategory, string> = {
  hygiene: "Hygiene",
  safety: "Safety",
  infrastructure: "Infrastructure",
};

export const MAIN_LOCATIONS: Area[] = [
  { id: "office_building", label: "Office Building", group: AREA_GROUPS.MAIN },
  { id: "changing_rooms", label: "Employee Changing Rooms", group: AREA_GROUPS.MAIN },
  { id: "cafeteria", label: "Cafeteria", group: AREA_GROUPS.MAIN },
  { id: "sanitization_area", label: "Sanitization Area", group: AREA_GROUPS.MAIN },
  { id: "back_area", label: "Back Area", group: AREA_GROUPS.MAIN },
  { id: "warehouse_1", label: "Warehouse Area 1", group: AREA_GROUPS.MAIN },
  { id: "warehouse_2", label: "Warehouse Area 2", group: AREA_GROUPS.MAIN },
  { id: "warehouse_3", label: "Warehouse Area 3", group: AREA_GROUPS.MAIN },
  { id: "warehouse_4", label: "Warehouse Area 4", group: AREA_GROUPS.MAIN },
  { id: "back_building_corridor", label: "Back Building Corridor", group: AREA_GROUPS.MAIN },
  { id: "back_building_1f", label: "Back Building – 1st Floor", group: AREA_GROUPS.MAIN },
  { id: "back_building_2f", label: "Back Building – 2nd Floor", group: AREA_GROUPS.MAIN },
  { id: "back_building_3f", label: "Back Building – 3rd Floor", group: AREA_GROUPS.MAIN },
];

export const PRODUCTION_AREAS: Area[] = [
  { id: "breyer_extruder", label: "Breyer Extruder Area", group: AREA_GROUPS.PRODUCTION },
  { id: "rdk_area", label: "RDK Area", group: AREA_GROUPS.PRODUCTION },
  { id: "rdm_area", label: "RDM Area", group: AREA_GROUPS.PRODUCTION },
  { id: "polytype_area", label: "Polytype Area", group: AREA_GROUPS.PRODUCTION },
  { id: "hybrid_area", label: "Hybrid Area", group: AREA_GROUPS.PRODUCTION },
  { id: "sleeving_area", label: "Sleeving Area", group: AREA_GROUPS.PRODUCTION },
  { id: "open_space_1", label: "Open Space Area 1", group: AREA_GROUPS.PRODUCTION },
  { id: "open_space_2", label: "Open Space Area 2", group: AREA_GROUPS.PRODUCTION },
  { id: "open_space_3", label: "Open Space Area 3", group: AREA_GROUPS.PRODUCTION },
  { id: "open_space_4", label: "Open Space Area 4", group: AREA_GROUPS.PRODUCTION },
  { id: "crusher_area", label: "Crusher Area", group: AREA_GROUPS.PRODUCTION },
  { id: "quality_control_room", label: "Quality Control Room", group: AREA_GROUPS.PRODUCTION },
  { id: "compressors_area", label: "Compressors Area", group: AREA_GROUPS.PRODUCTION },
  { id: "material_feeding_area", label: "Material Feeding Area", group: AREA_GROUPS.PRODUCTION },
];

export const ALL_AREAS: Area[] = [...MAIN_LOCATIONS, ...PRODUCTION_AREAS];

export function isProductionArea(area: Area): boolean {
  return area.group === AREA_GROUPS.PRODUCTION;
}

// These production areas have machines that get their own Hygiene + Safety ratings.
const MACHINE_RATED_AREA_IDS = new Set([
  "breyer_extruder",
  "rdk_area",
  "rdm_area",
  "polytype_area",
  "hybrid_area",
  "sleeving_area",
]);

export function hasMachineRating(area: Area): boolean {
  return MACHINE_RATED_AREA_IDS.has(area.id);
}

// Infrastructure rating is area-only (no machine equivalent).
export const MACHINE_CATEGORIES: EvalCategory[] = ["hygiene", "safety"];

export const NA = "NA" as const;
export type RatingValue = 1 | 2 | 3 | 4 | 5 | typeof NA;

export const RATING_LABELS: Record<number, string> = {
  1: "Filthy / hazardous - immediate action required",
  2: "Poor — significant issues",
  3: "Acceptable — minimum standard",
  4: "Good",
  5: "Excellent / spotless",
};

export const MACHINE_RATING_LABELS: Record<number, string> = {
  1: "Filthy machine — immediate cleaning required",
  2: "Poor — significant cleaning needed",
  3: "Acceptable — minimum standard",
  4: "Good",
  5: "Spotless machine",
};
