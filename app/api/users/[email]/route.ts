import { NextResponse } from "next/server";
import { getUserDailyRatings } from "@/lib/googleSheets";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ email: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await params;
  const days = await getUserDailyRatings(decodeURIComponent(email));
  return NextResponse.json({ email: decodeURIComponent(email), days });
}
