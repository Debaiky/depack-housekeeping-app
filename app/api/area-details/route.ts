import { NextResponse } from "next/server";
import { getAreaEvaluationDetails } from "@/lib/googleSheets";
import { getSession } from "@/lib/auth";

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const areaId = searchParams.get("areaId");
  if (!areaId) {
    return NextResponse.json({ error: "Missing areaId" }, { status: 400 });
  }

  const today = todayDate();
  const from = searchParams.get("from") || today;
  const to = searchParams.get("to") || today;

  const details = await getAreaEvaluationDetails(areaId, from, to);
  return NextResponse.json({ areaId, from, to, details });
}
