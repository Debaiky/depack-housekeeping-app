import { NextResponse } from "next/server";
import { getSubmissionForDate, getAreaRatingsForDate } from "@/lib/googleSheets";

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  const date = todayDate();
  const submission = await getSubmissionForDate(date);
  const areas = submission ? await getAreaRatingsForDate(date) : {};
  return NextResponse.json({ date, submitted: !!submission, summary: submission, areas });
}
