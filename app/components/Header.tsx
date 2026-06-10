"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "./Logo";

export default function Header({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login" || pathname === "/set-password") {
    return null;
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-zinc-200">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/">
          <Logo className="h-8" />
        </Link>
        {userEmail && (
          <div className="flex items-center gap-3">
            <nav className="flex gap-3 text-sm font-medium text-zinc-600">
              <Link href="/" className="hover:text-blue-600">
                Today
              </Link>
              <Link href="/map" className="hover:text-blue-600">
                Map
              </Link>
              <Link href="/history" className="hover:text-blue-600">
                History
              </Link>
            </nav>
            <button
              onClick={handleLogout}
              className="text-sm text-zinc-400 hover:text-red-600"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
