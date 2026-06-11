"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ALL_AREAS, MAIN_LOCATIONS, PRODUCTION_AREAS, NA, hasMachineRating, type RatingValue } from "@/lib/areas";
import AreaCard from "@/app/components/AreaCard";
import FactoryMap, { type AreaScore } from "@/app/components/FactoryMap";

const MACHINE_RATED_AREAS = PRODUCTION_AREAS.filter(hasMachineRating);
const AREA_BY_ID = Object.fromEntries(ALL_AREAS.map((a) => [a.id, a]));

export default function EvaluatePage() {
  const router = useRouter();
  const [ratings, setRatings] = useState<Record<string, RatingValue>>({});
  const [machineRatings, setMachineRatings] = useState<Record<string, RatingValue>>({});
  const [persons, setPersons] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<Record<string, File | null>>({});
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const totalRequired = MAIN_LOCATIONS.length + PRODUCTION_AREAS.length + MACHINE_RATED_AREAS.length;
  const completed =
    MAIN_LOCATIONS.filter((a) => ratings[a.id] !== undefined).length +
    PRODUCTION_AREAS.filter((a) => ratings[a.id] !== undefined).length +
    MACHINE_RATED_AREAS.filter((a) => machineRatings[a.id] !== undefined).length;
  const allRated = completed === totalRequired;

  const mapScores = useMemo(() => {
    const scores: Record<string, AreaScore> = {};
    for (const area of ALL_AREAS) {
      const rating = ratings[area.id];
      const machineRating = machineRatings[area.id];
      scores[area.id] = {
        avgScore: rating !== undefined && rating !== NA ? rating : null,
        ratedCount: rating !== undefined ? 1 : 0,
        machineAvgScore:
          machineRating !== undefined && machineRating !== NA ? machineRating : null,
        machineRatedCount: machineRating !== undefined ? 1 : 0,
      };
    }
    return scores;
  }, [ratings, machineRatings]);

  function setRating(areaId: string, rating: RatingValue) {
    setRatings((prev) => ({ ...prev, [areaId]: rating }));
  }

  function setMachineRating(areaId: string, rating: RatingValue) {
    setMachineRatings((prev) => ({ ...prev, [areaId]: rating }));
  }

  function setPerson(areaId: string, name: string) {
    setPersons((prev) => ({ ...prev, [areaId]: name }));
  }

  function setNote(areaId: string, note: string) {
    setNotes((prev) => ({ ...prev, [areaId]: note }));
  }

  function setPhoto(areaId: string, file: File | null) {
    setPhotos((prev) => ({ ...prev, [areaId]: file }));
  }

  function isAreaDone(areaId: string): boolean {
    const area = AREA_BY_ID[areaId];
    if (ratings[areaId] === undefined) return false;
    if (hasMachineRating(area) && machineRatings[areaId] === undefined) return false;
    return true;
  }

  async function handleSubmit() {
    if (!allRated) {
      setError("Please rate every area before submitting (or mark it N/A).");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const formData = new FormData();

      for (const area of MAIN_LOCATIONS) {
        formData.append(`rating_${area.id}`, String(ratings[area.id]));
        const photo = photos[area.id];
        if (photo) formData.append(`photo_${area.id}`, photo);
        const note = notes[area.id];
        if (note) formData.append(`note_${area.id}`, note);
      }

      for (const area of PRODUCTION_AREAS) {
        formData.append(`rating_${area.id}`, String(ratings[area.id]));
        if (hasMachineRating(area)) {
          formData.append(`machine_rating_${area.id}`, String(machineRatings[area.id]));
          const person = persons[area.id];
          if (person) formData.append(`person_${area.id}`, person);
        }
        const photo = photos[area.id];
        if (photo) formData.append(`photo_${area.id}`, photo);
        const note = notes[area.id];
        if (note) formData.append(`note_${area.id}`, note);
      }

      const res = await fetch("/api/evaluations", {
        method: "POST",
        body: formData,
      });
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
      <h1 className="text-xl font-semibold mb-1">Today&apos;s Cleanliness Evaluation</h1>
      <p className="text-sm text-zinc-500 mb-4">
        Tap an area on the map (or in the list below) to rate it from 1 (filthy) to 5
        (excellent), or mark N/A if it doesn&apos;t apply today. Photos are optional but
        recommended. You can re-open and change an area until you submit the full day.
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
        onAreaClick={(areaId) => setSelectedAreaId(areaId)}
      />

      <div className="mt-4 bg-white rounded-2xl border border-zinc-100 shadow-sm divide-y divide-zinc-100">
        {ALL_AREAS.map((area) => {
          const done = isAreaDone(area.id);
          const rating = ratings[area.id];
          return (
            <button
              key={area.id}
              type="button"
              onClick={() => setSelectedAreaId(area.id)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-zinc-50"
            >
              <span className="text-sm text-zinc-900">{area.label}</span>
              <span className={`text-xs font-medium ${done ? "text-green-600" : "text-zinc-400"}`}>
                {rating !== undefined ? (rating === NA ? "N/A" : `Rated ${rating}`) : "Not rated"}
                {done ? " ✓" : ""}
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
              rating={ratings[selectedArea.id] ?? null}
              onRatingChange={(r) => setRating(selectedArea.id, r)}
              onPhotoChange={(f) => setPhoto(selectedArea.id, f)}
              showMachineRating={hasMachineRating(selectedArea)}
              machineRating={machineRatings[selectedArea.id] ?? null}
              onMachineRatingChange={(r) => setMachineRating(selectedArea.id, r)}
              responsiblePerson={persons[selectedArea.id] ?? ""}
              onResponsiblePersonChange={(name) => setPerson(selectedArea.id, name)}
              note={notes[selectedArea.id] ?? ""}
              onNoteChange={(n) => setNote(selectedArea.id, n)}
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
