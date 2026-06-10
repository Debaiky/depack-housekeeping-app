import { NextResponse } from "next/server";
import { getUserRatingSummaries } from "@/lib/googleSheets";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await getUserRatingSummaries();
  return NextResponse.json({ users });
}
