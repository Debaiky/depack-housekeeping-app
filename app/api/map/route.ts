import { NextResponse } from "next/server";
import { getAreaRatingsForDate } from "@/lib/googleSheets";

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || todayDate();

  const areas = await getAreaRatingsForDate(date);

  return NextResponse.json({ date, areas });
}
