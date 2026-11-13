"use client";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { services: string[]; consentText: string; privacyHref: string; submitLabel: string; successMessage: string; sourcePage: string; dark?: boolean };
const newKey = () => (crypto.randomUUID?.().replace(/-/g, "") ?? Math.random().toString(36).slice(2).padEnd(20, "x")).slice(0, 32);
const inputCls = "w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-brand-900 placeholder:text-brand-400 focus:border-accent-600";

export function LeadForm({ services, consentText, privacyHref, submitLabel, successMessage, sourcePage }: Props) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [bad, setBad] = useState<string[]>([]);
  const key = useRef(newKey());
  const utm = useRef({ source: "", medium: "", campaign: "" });
  const started = useRef(0);
  useEffect(() => {
    started.current = Date.now();
    try {
      const q = new URLSearchParams(location.search);
      const stored = JSON.parse(sessionStorage.getItem("otm_utm") ?? "{}");
      const next = { source: q.get("utm_source") ?? stored.source ?? "", medium: q.get("utm_medium") ?? stored.medium ?? "", campaign: q.get("utm_campaign") ?? stored.campaign ?? "" };
      sessionStorage.setItem("otm_utm", JSON.stringify(next));
      utm.current = next;
    } catch { /* storage blocked: UTM is optional */ }
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState("sending"); setMsg(""); setBad([]);
    try {
      const r = await fetch("/api/leads", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: f.get("fullName"), email: f.get("email"), phone: f.get("phone"), company: f.get("company"), service: f.get("service"), message: f.get("message"),
          consent: f.get("consent") === "on", website: f.get("website") ?? "", sourcePage, idempotencyKey: key.current, utm: utm.current }),
      });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string; fields?: string[] };
      if (r.ok && j.ok) { setState("done"); key.current = newKey(); return; }   // inputs stay untouched on every failure below
      setBad(j.fields ?? []);
      setMsg(r.status === 429 ? "Too many attempts. Please wait a few minutes and try again." : j.error === "validation" ? "Please check the highlighted fields." : "We could not send your enquiry right now. Your details are still here, please try again.");
      setState("error");
    } catch {
      setMsg("Network problem. Your details are still here, please try again."); setState("error");
    }
  }

  if (state === "done") return <p role="status" className="rounded-2xl bg-accent-600/10 p-6 text-lg font-medium text-brand-900">{successMessage}</p>;
  const err = (n: string) => bad.includes(n) ? { "aria-invalid": true, className: inputCls + " !border-red-500" } : { className: inputCls };
  return (
    <form onSubmit={submit} noValidate className="grid gap-4 text-brand-900" aria-busy={state === "sending"}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">Full name *<input name="fullName" required autoComplete="name" maxLength={120} {...err("fullName")} /></label>
        <label className="grid gap-1.5 text-sm font-medium">Work email *<input name="email" type="email" required autoComplete="email" maxLength={160} {...err("email")} /></label>
        <label className="grid gap-1.5 text-sm font-medium">Phone / WhatsApp *<input name="phone" type="tel" required autoComplete="tel" placeholder="+91 98765 43210" maxLength={20} {...err("phone")} /></label>
        <label className="grid gap-1.5 text-sm font-medium">Company<input name="company" autoComplete="organization" maxLength={120} className={inputCls} /></label>
      </div>
      {services.length > 0 && <label className="grid gap-1.5 text-sm font-medium">Service interested in
        <select name="service" defaultValue="" className={inputCls}><option value="">Select…</option>{services.map((s) => <option key={s}>{s}</option>)}</select></label>}
      <label className="grid gap-1.5 text-sm font-medium">Message<textarea name="message" rows={4} maxLength={3000} className={inputCls} /></label>
      <div className="absolute -left-[9999px]" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="flex items-start gap-3 text-sm"><input name="consent" type="checkbox" required className="mt-1 h-4 w-4 accent-accent-600" aria-invalid={bad.includes("consent") || undefined} />
        <span>{consentText} {privacyHref && <a href={privacyHref} className="underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>}</span></label>
      {msg && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{msg}</p>}
      <Button type="submit" disabled={state === "sending"} className="justify-self-start">{state === "sending" && <Loader2 className="animate-spin" size={16} aria-hidden />}{submitLabel || "Send"}</Button>
    </form>
  );
}
