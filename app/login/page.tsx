"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextUrl = useMemo(() => {
    const next = searchParams.get("next");
    return next && next.startsWith("/") ? next : "/";
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json().catch(() => null)) as { error?: string } | null;

      if (!res.ok) {
        setError(data?.error || "Login failed.");
        return;
      }

      router.replace(nextUrl);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10 font-sans">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold text-zinc-900">Admin Login</h1>
        <p className="mb-6 text-sm text-zinc-600">
          Login ke baghair app use nahi ho gi.
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="username"
              className="mt-1 w-full rounded-md border border-zinc-300 p-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
              placeholder="admin@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-md border border-zinc-300 p-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
              placeholder="********"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </form>

        <div className="mt-5 text-sm text-zinc-600">
          Admin nahi bana?{" "}
          <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Signup
          </Link>
        </div>
      </div>
    </div>
  );
}
