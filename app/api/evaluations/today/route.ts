import { NextResponse } from "next/server";
import { getSubmissionForUserAndDate, getAreaRatingsForDateRange } from "@/lib/googleSheets";
import { getSession } from "@/lib/auth";

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const date = todayDate();
  const submission = await getSubmissionForUserAndDate(date, session.email);
  const areas = await getAreaRatingsForDateRange(date, date);
  return NextResponse.json({ date, submitted: !!submission, summary: submission, areas });
}
