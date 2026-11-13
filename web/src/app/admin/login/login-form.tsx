"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { btnPrimary, inputCls } from "@/components/admin/api";

export function LoginForm({ expired }: { expired: boolean }) {
  const [err, setErr] = useState(expired ? "Your session ended. Please sign in again." : "");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr("");
    const f = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ login: f.get("login"), password: f.get("password") }) });
      if (r.ok) { location.href = "/admin/pages"; return; }
      const j = (await r.json().catch(() => null)) as { message?: string } | null;
      setErr(r.status === 429 ? "Too many attempts. Wait a few minutes." : j?.message || "Sign-in failed.");
    } catch { setErr("Network problem."); }
    setBusy(false);
  }
  return (
    <form onSubmit={submit} className="grid w-full max-w-sm gap-4 rounded-2xl border border-brand-100 bg-white p-7 shadow-lg">
      <h1 className="text-xl font-bold">Otomater admin</h1>
      {err && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{err}</p>}
      <label className="grid gap-1 text-sm font-semibold">Login<input name="login" autoComplete="username" required className={inputCls} /></label>
      <label className="grid gap-1 text-sm font-semibold">Password<input name="password" type="password" autoComplete="current-password" required className={inputCls} /></label>
      <button className={btnPrimary} disabled={busy}>{busy && <Loader2 className="animate-spin" size={14} />}Sign in</button>
    </form>
  );
}
