import { NextResponse } from "next/server";
import { getAreaRatingsForDateRange } from "@/lib/googleSheets";

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const today = todayDate();
  const from = searchParams.get("from") || today;
  const to = searchParams.get("to") || today;

  const areas = await getAreaRatingsForDateRange(from, to);

  return NextResponse.json({ from, to, areas });
}
