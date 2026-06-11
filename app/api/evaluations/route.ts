import { NextResponse } from "next/server";
import { MAIN_LOCATIONS, PRODUCTION_AREAS, NA, hasMachineRating, type RatingValue } from "@/lib/areas";
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
  if (value === null) {
    throw new Error(`Missing rating for ${label}`);
  }
  if (value === NA) return NA;

  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error(`Invalid rating for ${label}`);
  }
  return rating as RatingValue;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const date = todayDate();

  const existing = await getSubmissionForUserAndDate(date, session.email);
  if (existing) {
    return NextResponse.json(
      { error: "You have already submitted today's evaluation." },
      { status: 409 }
    );
  }

  const formData = await request.formData();
  const timestamp = new Date().toISOString();

  let areaRatings: Record<string, RatingValue>;
  let machineRatings: Record<string, RatingValue>;

  try {
    areaRatings = {};
    machineRatings = {};

    for (const area of MAIN_LOCATIONS) {
      areaRatings[area.id] = parseRating(formData.get(`rating_${area.id}`), area.label);
    }

    for (const area of PRODUCTION_AREAS) {
      areaRatings[area.id] = parseRating(formData.get(`rating_${area.id}`), area.label);
      if (hasMachineRating(area)) {
        machineRatings[area.id] = parseRating(
          formData.get(`machine_rating_${area.id}`),
          `${area.label} (machine)`
        );
      }
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const evaluationRows: EvaluationRow[] = [];
  const ratingEntries: RatingEntry[] = [];
  const photoUploads: { rowIndex: number; buffer: Buffer; mimeType: string }[] = [];

  for (const area of MAIN_LOCATIONS) {
    const rating = areaRatings[area.id];
    ratingEntries.push({ key: area.id, rating });

    const note = (formData.get(`note_${area.id}`) as string | null)?.trim() || "";

    const rowIndex = evaluationRows.length;
    evaluationRows.push({
      date,
      timestamp,
      userEmail: session.email,
      areaId: area.id,
      areaLabel: area.label,
      rating,
      photoUrl: "",
      ratingType: "area" as const,
      responsiblePerson: "",
      note,
    });

    const photo = formData.get(`photo_${area.id}`);
    if (photo instanceof File && photo.size > 0) {
      photoUploads.push({
        rowIndex,
        buffer: Buffer.from(await photo.arrayBuffer()),
        mimeType: photo.type || "image/jpeg",
      });
    }
  }

  for (const area of PRODUCTION_AREAS) {
    const rating = areaRatings[area.id];
    const machineRating = machineRatings[area.id];
    const responsiblePerson = (formData.get(`person_${area.id}`) as string | null)?.trim() || "";

    ratingEntries.push({ key: area.id, rating });
    if (hasMachineRating(area)) {
      ratingEntries.push({ key: `machine_${area.id}`, rating: machineRating });
    }

    const note = (formData.get(`note_${area.id}`) as string | null)?.trim() || "";

    const rowIndex = evaluationRows.length;
    evaluationRows.push({
      date,
      timestamp,
      userEmail: session.email,
      areaId: area.id,
      areaLabel: area.label,
      rating,
      photoUrl: "",
      ratingType: "area" as const,
      responsiblePerson: "",
      note,
    });

    const photo = formData.get(`photo_${area.id}`);
    if (photo instanceof File && photo.size > 0) {
      photoUploads.push({
        rowIndex,
        buffer: Buffer.from(await photo.arrayBuffer()),
        mimeType: photo.type || "image/jpeg",
      });
    }

    if (hasMachineRating(area)) {
      evaluationRows.push({
        date,
        timestamp,
        userEmail: session.email,
        areaId: area.id,
        areaLabel: `${area.label} (Machine)`,
        rating: machineRating,
        photoUrl: "",
        ratingType: "machine" as const,
        responsiblePerson,
        note: "",
      });
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

  const result = computeDailyResult(ratingEntries);

  await appendDailySummary({
    date,
    totalScore: result.totalScore,
    avgScore: Math.round(result.avgScore * 100) / 100,
    status: result.status,
    submittedBy: session.email,
    ratedCount: result.ratedCount,
  });

  return NextResponse.json({ ok: true, result });
}
