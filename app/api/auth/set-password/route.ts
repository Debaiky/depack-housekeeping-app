import { NextResponse } from "next/server";
import { getUserByEmail, setUserPassword } from "@/lib/googleSheets";
import { hashPassword, isAllowedEmail, createSessionCookie } from "@/lib/auth";

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

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return NextResponse.json(
      { error: "This email is not registered. Contact your administrator." },
      { status: 404 }
    );
  }

  if (user.passwordHash) {
    return NextResponse.json(
      { error: "A password is already set for this account. Please log in." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  await setUserPassword(user.rowNumber, passwordHash);

  await createSessionCookie({ email: user.email, name: user.name || email });

  return NextResponse.json({ ok: true });
}
