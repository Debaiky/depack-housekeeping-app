import { NextResponse } from "next/server";
import { ALL_AREAS } from "@/lib/areas";
import { computeDailyResult } from "@/lib/scoring";
import { appendEvaluationRows, appendDailySummary, getSubmissionForDate } from "@/lib/googleSheets";
import { uploadEvaluationPhoto } from "@/lib/googleDrive";
import { getSession } from "@/lib/auth";

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const date = todayDate();

  const existing = await getSubmissionForDate(date);
  if (existing) {
    return NextResponse.json(
      { error: "An evaluation for today has already been submitted." },
      { status: 409 }
    );
  }

  const formData = await request.formData();
  const timestamp = new Date().toISOString();

  const ratings: { areaId: string; rating: number }[] = [];

  for (const area of ALL_AREAS) {
    const value = formData.get(`rating_${area.id}`);
    if (value === null) {
      return NextResponse.json(
        { error: `Missing rating for ${area.label}` },
        { status: 400 }
      );
    }
    const rating = Number(value);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: `Invalid rating for ${area.label}` },
        { status: 400 }
      );
    }
    ratings.push({ areaId: area.id, rating });
  }

  const evaluationRows = [];

  for (const area of ALL_AREAS) {
    const rating = ratings.find((r) => r.areaId === area.id)!.rating;
    let photoUrl = "";

    const photo = formData.get(`photo_${area.id}`);
    if (photo instanceof File && photo.size > 0) {
      const buffer = Buffer.from(await photo.arrayBuffer());
      photoUrl = await uploadEvaluationPhoto({
        date,
        areaId: area.id,
        userEmail: session.email,
        buffer,
        mimeType: photo.type || "image/jpeg",
      });
    }

    evaluationRows.push({
      date,
      timestamp,
      userEmail: session.email,
      areaId: area.id,
      areaLabel: area.label,
      rating,
      photoUrl,
    });
  }

  await appendEvaluationRows(evaluationRows);

  const result = computeDailyResult(ratings);

  await appendDailySummary({
    date,
    totalScore: result.totalScore,
    avgScore: Math.round(result.avgScore * 100) / 100,
    status: result.status,
    submittedBy: session.email,
  });

  return NextResponse.json({ ok: true, result });
}
