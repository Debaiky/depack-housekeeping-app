"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ALL_AREAS, MAIN_LOCATIONS, PRODUCTION_AREAS, NA,
  hasMachineRating, EVAL_CATEGORIES,
  type RatingValue, type EvalCategory,
} from "@/lib/areas";
import AreaCard, { type CategoryRatings, type MachineRatings } from "@/app/components/AreaCard";
import FactoryMap, { type AreaScore } from "@/app/components/FactoryMap";

const MACHINE_RATED_AREAS = PRODUCTION_AREAS.filter(hasMachineRating);
const AREA_BY_ID = Object.fromEntries(ALL_AREAS.map((a) => [a.id, a]));

type CatRec = Record<string, RatingValue>;

function emptyNotes(): Record<EvalCategory, string> {
  return { hygiene: "", safety: "", infrastructure: "" };
}

export default function EvaluatePage() {
  const router = useRouter();

  // Per-area-per-category area ratings
  const [hygieneRatings, setHygieneRatings] = useState<CatRec>({});
  const [safetyRatings, setSafetyRatings] = useState<CatRec>({});
  const [infraRatings, setInfraRatings] = useState<CatRec>({});

  // Per-area machine ratings (hygiene + safety)
  const [hygieneMachine, setHygieneMachine] = useState<CatRec>({});
  const [safetyMachine, setSafetyMachine] = useState<CatRec>({});

  // Per-area-per-category notes and photos
  const [notes, setNotes] = useState<Record<string, Record<EvalCategory, string>>>({});
  const [photos, setPhotos] = useState<Record<string, Record<EvalCategory, File | null>>>({});

  const [persons, setPersons] = useState<Record<string, string>>({});
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Progress: 3 ratings per area + 2 machine ratings per machine area
  const totalRequired =
    ALL_AREAS.length * 3 +
    MACHINE_RATED_AREAS.length * 2;

  const completed = useMemo(() => {
    let n = 0;
    for (const a of ALL_AREAS) {
      if (hygieneRatings[a.id] !== undefined) n++;
      if (safetyRatings[a.id] !== undefined) n++;
      if (infraRatings[a.id] !== undefined) n++;
    }
    for (const a of MACHINE_RATED_AREAS) {
      if (hygieneMachine[a.id] !== undefined) n++;
      if (safetyMachine[a.id] !== undefined) n++;
    }
    return n;
  }, [hygieneRatings, safetyRatings, infraRatings, hygieneMachine, safetyMachine]);

  const allRated = completed === totalRequired;

  const mapScores = useMemo(() => {
    const scores: Record<string, AreaScore> = {};
    for (const area of ALL_AREAS) {
      const h = hygieneRatings[area.id];
      const s = safetyRatings[area.id];
      const inf = infraRatings[area.id];
      const vals = [h, s, inf].filter((v) => v !== undefined && v !== NA) as number[];
      const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
      scores[area.id] = {
        avgScore: avg,
        ratedCount: vals.length,
        machineAvgScore:
          hygieneMachine[area.id] !== undefined && hygieneMachine[area.id] !== NA
            ? (hygieneMachine[area.id] as number)
            : null,
        machineRatedCount: hygieneMachine[area.id] !== undefined ? 1 : 0,
      };
    }
    return scores;
  }, [hygieneRatings, safetyRatings, infraRatings, hygieneMachine]);

  function setRating(areaId: string, cat: EvalCategory, val: RatingValue) {
    if (cat === "hygiene") setHygieneRatings((p) => ({ ...p, [areaId]: val }));
    else if (cat === "safety") setSafetyRatings((p) => ({ ...p, [areaId]: val }));
    else setInfraRatings((p) => ({ ...p, [areaId]: val }));
  }

  function setMachineRating(areaId: string, cat: "hygiene" | "safety", val: RatingValue) {
    if (cat === "hygiene") setHygieneMachine((p) => ({ ...p, [areaId]: val }));
    else setSafetyMachine((p) => ({ ...p, [areaId]: val }));
  }

  function setNote(areaId: string, cat: EvalCategory, note: string) {
    setNotes((p) => ({ ...p, [areaId]: { ...emptyNotes(), ...p[areaId], [cat]: note } }));
  }

  function setPhoto(areaId: string, cat: EvalCategory, file: File | null) {
    setPhotos((p) => ({ ...p, [areaId]: { ...p[areaId], [cat]: file } }));
  }

  function isAreaDone(areaId: string): boolean {
    const area = AREA_BY_ID[areaId];
    if (hygieneRatings[areaId] === undefined) return false;
    if (safetyRatings[areaId] === undefined) return false;
    if (infraRatings[areaId] === undefined) return false;
    if (hasMachineRating(area)) {
      if (hygieneMachine[areaId] === undefined) return false;
      if (safetyMachine[areaId] === undefined) return false;
    }
    return true;
  }

  function areaStatusLabel(areaId: string): string {
    const h = hygieneRatings[areaId];
    const s = safetyRatings[areaId];
    const inf = infraRatings[areaId];
    if (h === undefined && s === undefined && inf === undefined) return "Not rated";
    const parts: string[] = [];
    if (h !== undefined) parts.push(`H:${h === NA ? "N/A" : h}`);
    if (s !== undefined) parts.push(`S:${s === NA ? "N/A" : s}`);
    if (inf !== undefined) parts.push(`I:${inf === NA ? "N/A" : inf}`);
    return parts.join(" · ");
  }

  async function handleSubmit() {
    if (!allRated) {
      setError("Please complete all ratings (Hygiene, Safety, Infrastructure) for every area.");
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const formData = new FormData();

      for (const area of [...MAIN_LOCATIONS, ...PRODUCTION_AREAS]) {
        const id = area.id;
        // Area ratings per category
        formData.append(`hygiene_rating_${id}`, String(hygieneRatings[id]));
        formData.append(`safety_rating_${id}`, String(safetyRatings[id]));
        formData.append(`infra_rating_${id}`, String(infraRatings[id]));

        // Notes
        const areaNote = notes[id] || emptyNotes();
        if (areaNote.hygiene) formData.append(`hygiene_note_${id}`, areaNote.hygiene);
        if (areaNote.safety) formData.append(`safety_note_${id}`, areaNote.safety);
        if (areaNote.infrastructure) formData.append(`infra_note_${id}`, areaNote.infrastructure);

        // Photos
        const areaPhotos = photos[id] || {};
        if (areaPhotos.hygiene) formData.append(`hygiene_photo_${id}`, areaPhotos.hygiene);
        if (areaPhotos.safety) formData.append(`safety_photo_${id}`, areaPhotos.safety);
        if (areaPhotos.infrastructure) formData.append(`infra_photo_${id}`, areaPhotos.infrastructure);

        // Machine ratings
        if (hasMachineRating(area)) {
          formData.append(`hygiene_machine_rating_${id}`, String(hygieneMachine[id]));
          formData.append(`safety_machine_rating_${id}`, String(safetyMachine[id]));
          const person = persons[id];
          if (person) formData.append(`person_${id}`, person);
        }
      }

      const res = await fetch("/api/evaluations", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Submission failed");
        return;
      }

      router.push("/?submitted=1");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedArea = selectedAreaId ? AREA_BY_ID[selectedAreaId] : null;

  return (
    <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 pb-32">
      <h1 className="text-xl font-semibold mb-1">Today&apos;s Evaluation</h1>
      <p className="text-sm text-zinc-500 mb-4">
        Tap an area to rate its <strong>Hygiene</strong>, <strong>Safety</strong>, and{" "}
        <strong>Infrastructure</strong> from 1 to 5 (or N/A). Photos and notes are optional.
      </p>

      <div className="sticky top-14 z-10 bg-zinc-50 py-2 mb-4">
        <div className="bg-white rounded-full border border-zinc-200 h-3 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all"
            style={{ width: `${(completed / totalRequired) * 100}%` }}
          />
        </div>
        <p className="text-xs text-zinc-500 mt-1 text-center">
          {completed} / {totalRequired} ratings completed
        </p>
      </div>

      <FactoryMap
        scores={mapScores}
        selectedAreaId={selectedAreaId}
        onAreaClick={(id) => setSelectedAreaId(id)}
      />

      <div className="mt-4 bg-white rounded-2xl border border-zinc-100 shadow-sm divide-y divide-zinc-100">
        {ALL_AREAS.map((area) => {
          const done = isAreaDone(area.id);
          return (
            <button
              key={area.id}
              type="button"
              onClick={() => setSelectedAreaId(area.id)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-zinc-50"
            >
              <span className="text-sm text-zinc-900">{area.label}</span>
              <span className={`text-xs font-medium ${done ? "text-green-600" : "text-zinc-400"}`}>
                {areaStatusLabel(area.id)}{done ? " ✓" : ""}
              </span>
            </button>
          );
        })}
      </div>

      {selectedArea && (
        <div
          className="fixed inset-0 z-20 bg-black/40 flex items-end sm:items-center justify-center p-4"
          onClick={() => setSelectedAreaId(null)}
        >
          <div
            className="w-full max-w-md max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <AreaCard
              area={selectedArea}
              ratings={{
                hygiene: hygieneRatings[selectedArea.id] ?? null,
                safety: safetyRatings[selectedArea.id] ?? null,
                infrastructure: infraRatings[selectedArea.id] ?? null,
              }}
              machineRatings={{
                hygiene: hygieneMachine[selectedArea.id] ?? null,
                safety: safetyMachine[selectedArea.id] ?? null,
              }}
              notes={notes[selectedArea.id] ?? emptyNotes()}
              onRatingChange={(cat, val) => setRating(selectedArea.id, cat, val)}
              onMachineRatingChange={(cat, val) => setMachineRating(selectedArea.id, cat, val)}
              onPhotoChange={(cat, file) => setPhoto(selectedArea.id, cat, file)}
              onNoteChange={(cat, note) => setNote(selectedArea.id, cat, note)}
              responsiblePerson={persons[selectedArea.id] ?? ""}
              onResponsiblePersonChange={(name) => setPersons((p) => ({ ...p, [selectedArea.id]: name }))}
            />
            <button
              type="button"
              onClick={() => setSelectedAreaId(null)}
              className="mt-3 w-full rounded-lg bg-blue-600 text-white font-semibold py-3 text-base"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 p-4">
        <div className="max-w-3xl mx-auto">
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={!allRated || submitting}
            className="w-full rounded-lg bg-blue-600 text-white font-semibold py-3 text-base disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Evaluation"}
          </button>
        </div>
      </div>
    </main>
  );
}
