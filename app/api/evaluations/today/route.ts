import { NextResponse } from "next/server";
import { getSubmissionForDate } from "@/lib/googleSheets";

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  const date = todayDate();
  const submission = await getSubmissionForDate(date);
  return NextResponse.json({ date, submitted: !!submission, summary: submission });
}
