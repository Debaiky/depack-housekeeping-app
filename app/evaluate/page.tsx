"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MAIN_LOCATIONS, PRODUCTION_AREAS, type RatingValue } from "@/lib/areas";
import AreaCard from "@/app/components/AreaCard";

export default function EvaluatePage() {
  const router = useRouter();
  const [ratings, setRatings] = useState<Record<string, RatingValue>>({});
  const [machineRatings, setMachineRatings] = useState<Record<string, RatingValue>>({});
  const [persons, setPersons] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<Record<string, File | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const totalRequired = MAIN_LOCATIONS.length + PRODUCTION_AREAS.length * 2;
  const completed =
    MAIN_LOCATIONS.filter((a) => ratings[a.id] !== undefined).length +
    PRODUCTION_AREAS.filter((a) => ratings[a.id] !== undefined).length +
    PRODUCTION_AREAS.filter((a) => machineRatings[a.id] !== undefined).length;
  const allRated = completed === totalRequired;

  function setRating(areaId: string, rating: RatingValue) {
    setRatings((prev) => ({ ...prev, [areaId]: rating }));
  }

  function setMachineRating(areaId: string, rating: RatingValue) {
    setMachineRatings((prev) => ({ ...prev, [areaId]: rating }));
  }

  function setPerson(areaId: string, name: string) {
    setPersons((prev) => ({ ...prev, [areaId]: name }));
  }

  function setPhoto(areaId: string, file: File | null) {
    setPhotos((prev) => ({ ...prev, [areaId]: file }));
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
      }

      for (const area of PRODUCTION_AREAS) {
        formData.append(`rating_${area.id}`, String(ratings[area.id]));
        formData.append(`machine_rating_${area.id}`, String(machineRatings[area.id]));
        const person = persons[area.id];
        if (person) formData.append(`person_${area.id}`, person);
        const photo = photos[area.id];
        if (photo) formData.append(`photo_${area.id}`, photo);
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

  return (
    <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 pb-32">
      <h1 className="text-xl font-semibold mb-1">Today&apos;s Cleanliness Evaluation</h1>
      <p className="text-sm text-zinc-500 mb-4">
        Rate each area from 1 (filthy) to 5 (excellent), or mark N/A if it doesn&apos;t apply
        today. Photos are optional but recommended.
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

      <section className="mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-2">
          Main Locations
        </h2>
        <div className="space-y-3">
          {MAIN_LOCATIONS.map((area) => (
            <AreaCard
              key={area.id}
              area={area}
              rating={ratings[area.id] ?? null}
              onRatingChange={(r) => setRating(area.id, r)}
              onPhotoChange={(f) => setPhoto(area.id, f)}
            />
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-2">
          Production Area
        </h2>
        <div className="space-y-3">
          {PRODUCTION_AREAS.map((area) => (
            <AreaCard
              key={area.id}
              area={area}
              rating={ratings[area.id] ?? null}
              onRatingChange={(r) => setRating(area.id, r)}
              onPhotoChange={(f) => setPhoto(area.id, f)}
              showMachineRating
              machineRating={machineRatings[area.id] ?? null}
              onMachineRatingChange={(r) => setMachineRating(area.id, r)}
              responsiblePerson={persons[area.id] ?? ""}
              onResponsiblePersonChange={(name) => setPerson(area.id, name)}
            />
          ))}
        </div>
      </section>

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
