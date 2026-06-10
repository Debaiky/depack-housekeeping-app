import { NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/googleSheets";
import { verifyPassword, isAllowedEmail, createSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  if (!isAllowedEmail(email)) {
    return NextResponse.json(
      { error: "Only Depack company emails are allowed" },
      { status: 403 }
    );
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  if (!user.passwordHash) {
    return NextResponse.json(
      { error: "NO_PASSWORD", message: "Please set a password for your account first." },
      { status: 412 }
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  await createSessionCookie({ email: user.email, name: user.name || email });

  return NextResponse.json({ ok: true });
}
