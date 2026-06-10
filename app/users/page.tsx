"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type UserRatingSummary = {
  email: string;
  name: string;
  totalCount: number;
  weekCount: number;
  monthCount: number;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRatingSummary[] | null>(null);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []));
  }, []);

  return (
    <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-1">Users</h1>
      <p className="text-sm text-zinc-500 mb-4">
        Ratings submitted by each registered user. Click a user to see their activity calendar.
      </p>

      {users === null ? (
        <p className="text-sm text-zinc-400">Loading...</p>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
          {users.map((user) => (
            <Link
              key={user.email}
              href={`/users/${encodeURIComponent(user.email)}`}
              className="p-4 flex items-center justify-between hover:bg-zinc-50"
            >
              <div>
                <p className="font-medium text-zinc-900">{user.name || user.email}</p>
                <p className="text-xs text-zinc-500">{user.email}</p>
              </div>
              <div className="flex gap-4 text-right text-sm">
                <div>
                  <p className="font-semibold text-zinc-900">{user.totalCount}</p>
                  <p className="text-xs text-zinc-500">Total</p>
                </div>
                <div>
                  <p className="font-semibold text-zinc-900">{user.weekCount}</p>
                  <p className="text-xs text-zinc-500">This week</p>
                </div>
                <div>
                  <p className="font-semibold text-zinc-900">{user.monthCount}</p>
                  <p className="text-xs text-zinc-500">This month</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
