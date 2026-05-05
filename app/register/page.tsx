"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(data?.error || "Signup failed.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10 font-sans">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold text-zinc-900">Admin Signup</h1>
        <p className="mb-6 text-sm text-zinc-600">
          Pehli dafa admin create karo, phir app secure ho jaye gi.
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
              autoComplete="new-password"
              className="mt-1 w-full rounded-md border border-zinc-300 p-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
              placeholder="Minimum 8 characters"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Admin"}
          </button>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
