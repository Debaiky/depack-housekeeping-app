export type Area = {
  id: string;
  label: string;
  group: string;
};

export const AREA_GROUPS = {
  MAIN: "Main Locations",
  PRODUCTION: "Production Area",
} as const;

export const MAIN_LOCATIONS: Area[] = [
  { id: "warehouse", label: "Warehouse", group: AREA_GROUPS.MAIN },
  { id: "office_building", label: "Office Building", group: AREA_GROUPS.MAIN },
  { id: "changing_rooms", label: "Employee Changing Rooms", group: AREA_GROUPS.MAIN },
  { id: "cafeteria", label: "Cafeteria", group: AREA_GROUPS.MAIN },
  { id: "sanitization_area", label: "Sanitization Area", group: AREA_GROUPS.MAIN },
  { id: "back_area", label: "Back Area", group: AREA_GROUPS.MAIN },
  { id: "back_building", label: "Back Building", group: AREA_GROUPS.MAIN },
];

export const PRODUCTION_AREAS: Area[] = [
  { id: "breyer_extruder", label: "Breyer Extruder Area", group: AREA_GROUPS.PRODUCTION },
  { id: "rdk_area", label: "RDK Area", group: AREA_GROUPS.PRODUCTION },
  { id: "rdm_area", label: "RDM Area", group: AREA_GROUPS.PRODUCTION },
  { id: "polytype_area", label: "Polytype Area", group: AREA_GROUPS.PRODUCTION },
  { id: "hybrid_area", label: "Hybrid Area", group: AREA_GROUPS.PRODUCTION },
  { id: "sleeving_area", label: "Sleeving Area", group: AREA_GROUPS.PRODUCTION },
  { id: "open_space", label: "Open Space", group: AREA_GROUPS.PRODUCTION },
  { id: "stored_plastic_rolls", label: "Sheet Rolls", group: AREA_GROUPS.PRODUCTION },
  { id: "crusher_area", label: "Crusher Area", group: AREA_GROUPS.PRODUCTION },
  { id: "quality_control_room", label: "Quality Control Room", group: AREA_GROUPS.PRODUCTION },
  { id: "compressors_area", label: "Compressors Area", group: AREA_GROUPS.PRODUCTION },
  { id: "material_feeding_area", label: "Material Feeding Area", group: AREA_GROUPS.PRODUCTION },
];

export const ALL_AREAS: Area[] = [...MAIN_LOCATIONS, ...PRODUCTION_AREAS];

export function isProductionArea(area: Area): boolean {
  return area.group === AREA_GROUPS.PRODUCTION;
}

// Only these production areas have a machine that gets its own cleanliness rating.
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

export const NA = "NA" as const;
export type RatingValue = 1 | 2 | 3 | 4 | 5 | typeof NA;

export const RATING_LABELS: Record<number, string> = {
  1: "Filthy / hazardous - immediate action required",
  2: "Poor - significant cleaning needed",
  3: "Acceptable - minimum standard",
  4: "Good",
  5: "Excellent / spotless",
};

export const MACHINE_RATING_LABELS: Record<number, string> = {
  1: "Filthy machine - immediate cleaning required",
  2: "Poor - significant cleaning needed",
  3: "Acceptable - minimum standard",
  4: "Good",
  5: "Spotless machine",
};
