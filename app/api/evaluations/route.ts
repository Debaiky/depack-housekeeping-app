import { NextResponse } from "next/server";
import { MAIN_LOCATIONS, PRODUCTION_AREAS, NA, hasMachineRating, type RatingValue, type EvalCategory } from "@/lib/areas";
import { computeDailyResult, type RatingEntry } from "@/lib/scoring";
import {
  appendEvaluationRows,
  appendDailySummary,
  getSubmissionForUserAndDate,
  type EvaluationRow,
} from "@/lib/googleSheets";
import { uploadEvaluationPhoto, getOrCreateDateFolder } from "@/lib/googleDrive";
import { getSession } from "@/lib/auth";

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseRating(value: FormDataEntryValue | null, label: string): RatingValue {
  if (value === null) throw new Error(`Missing rating for ${label}`);
  if (value === NA) return NA;
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error(`Invalid rating for ${label}`);
  }
  return rating as RatingValue;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = todayDate();
  const existing = await getSubmissionForUserAndDate(date, session.email);
  if (existing) {
    return NextResponse.json({ error: "You have already submitted today's evaluation." }, { status: 409 });
  }

  const formData = await request.formData();
  const timestamp = new Date().toISOString();

  type AreaCat = { hygiene: RatingValue; safety: RatingValue; infra: RatingValue };
  type MachineCat = { hygiene: RatingValue; safety: RatingValue };
  const areaRatings: Record<string, AreaCat> = {};
  const machineRatings: Record<string, MachineCat> = {};

  try {
    for (const area of [...MAIN_LOCATIONS, ...PRODUCTION_AREAS]) {
      const id = area.id;
      areaRatings[id] = {
        hygiene: parseRating(formData.get(`hygiene_rating_${id}`), `${area.label} (hygiene)`),
        safety: parseRating(formData.get(`safety_rating_${id}`), `${area.label} (safety)`),
        infra: parseRating(formData.get(`infra_rating_${id}`), `${area.label} (infrastructure)`),
      };
      if (hasMachineRating(area)) {
        machineRatings[id] = {
          hygiene: parseRating(formData.get(`hygiene_machine_rating_${id}`), `${area.label} machine (hygiene)`),
          safety: parseRating(formData.get(`safety_machine_rating_${id}`), `${area.label} machine (safety)`),
        };
      }
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const evaluationRows: EvaluationRow[] = [];
  const hygieneEntries: RatingEntry[] = [];
  const safetyEntries: RatingEntry[] = [];
  const infraEntries: RatingEntry[] = [];
  const photoUploads: { rowIndex: number; buffer: Buffer; mimeType: string }[] = [];

  async function collectPhoto(formKey: string, rowIndex: number) {
    const photo = formData.get(formKey);
    if (photo instanceof File && photo.size > 0) {
      photoUploads.push({
        rowIndex,
        buffer: Buffer.from(await photo.arrayBuffer()),
        mimeType: photo.type || "image/jpeg",
      });
    }
  }

  for (const area of [...MAIN_LOCATIONS, ...PRODUCTION_AREAS]) {
    const id = area.id;
    const cats = areaRatings[id];
    const responsiblePerson = hasMachineRating(area)
      ? ((formData.get(`person_${id}`) as string | null)?.trim() || "")
      : "";

    // Three area rows — one per category
    const catMap: [EvalCategory, RatingValue, string, string][] = [
      ["hygiene", cats.hygiene, `hygiene_note_${id}`, `hygiene_photo_${id}`],
      ["safety", cats.safety, `safety_note_${id}`, `safety_photo_${id}`],
      ["infrastructure", cats.infra, `infra_note_${id}`, `infra_photo_${id}`],
    ];

    for (const [category, rating, noteKey, photoKey] of catMap) {
      const note = (formData.get(noteKey) as string | null)?.trim() || "";
      const rowIndex = evaluationRows.length;
      evaluationRows.push({
        date, timestamp, userEmail: session.email,
        areaId: id, areaLabel: area.label,
        rating, photoUrl: "", ratingType: "area",
        responsiblePerson: category === "hygiene" ? responsiblePerson : "",
        note, category,
      });
      await collectPhoto(photoKey, rowIndex);
      if (category === "hygiene") hygieneEntries.push({ key: id, rating });
      else if (category === "safety") safetyEntries.push({ key: id, rating });
      else infraEntries.push({ key: id, rating });
    }

    // Machine rows (hygiene + safety) for applicable areas
    if (hasMachineRating(area)) {
      const mc = machineRatings[id];
      for (const [category, rating] of [
        ["hygiene", mc.hygiene],
        ["safety", mc.safety],
      ] as [EvalCategory, RatingValue][]) {
        evaluationRows.push({
          date, timestamp, userEmail: session.email,
          areaId: id, areaLabel: `${area.label} (Machine)`,
          rating, photoUrl: "", ratingType: "machine",
          responsiblePerson: category === "hygiene" ? responsiblePerson : "",
          note: "", category,
        });
        if (category === "hygiene") hygieneEntries.push({ key: `machine_${id}`, rating });
        else safetyEntries.push({ key: `machine_${id}`, rating });
      }
    }
  }

  if (photoUploads.length > 0) {
    const folderId = await getOrCreateDateFolder(date);
    const uploadedUrls = await Promise.all(
      photoUploads.map(({ rowIndex, buffer, mimeType }) =>
        uploadEvaluationPhoto({
          date,
          areaId: evaluationRows[rowIndex].areaId,
          userEmail: session.email,
          buffer,
          mimeType,
          folderId,
        })
      )
    );
    photoUploads.forEach(({ rowIndex }, i) => {
      evaluationRows[rowIndex].photoUrl = uploadedUrls[i];
    });
  }

  await appendEvaluationRows(evaluationRows);

  const result = computeDailyResult(hygieneEntries, safetyEntries, infraEntries);

  await appendDailySummary({
    date,
    totalScore: result.totalScore,
    avgScore: Math.round(result.avgScore * 100) / 100,
    status: result.status,
    submittedBy: session.email,
    ratedCount: result.ratedCount,
    hygieneAvg: Math.round(result.hygieneAvg * 100) / 100,
    safetyAvg: Math.round(result.safetyAvg * 100) / 100,
    infraAvg: Math.round(result.infraAvg * 100) / 100,
  });

  return NextResponse.json({ ok: true, result });
}
