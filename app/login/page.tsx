"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/app/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsPassword(false);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        router.push("/");
        router.refresh();
        return;
      }

      if (data.error === "NO_PASSWORD") {
        setNeedsPassword(true);
        setError(data.message);
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-zinc-50">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo className="h-12" />
        </div>
        <h1 className="text-xl font-semibold text-center mb-1">Housekeeping Evaluation</h1>
        <p className="text-sm text-zinc-500 text-center mb-6">Sign in with your Depack email</p>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-2xl shadow-sm">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@depack.co"
              className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">
              {error}
              {needsPassword && (
                <>
                  {" "}
                  <Link href="/set-password" className="underline font-medium">
                    Set your password
                  </Link>
                </>
              )}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 text-white font-medium py-3 text-base disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-4">
          First time here?{" "}
          <Link href="/set-password" className="text-blue-600 font-medium underline">
            Set up your password
          </Link>
        </p>
      </div>
    </main>
  );
}
