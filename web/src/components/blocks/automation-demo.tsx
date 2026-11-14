"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Boxes, Check, Contact, Loader2, MessageCircle, RotateCcw, UserPlus } from "lucide-react";
import { canAnimate, createTimeline, EASE } from "@/lib/anim";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";

type Step = { label: string; caption: string };
type Props = { submitLabel: string; whatsappText: string; steps: Step[]; consentText: string; privacyHref: string; sourcePage: string };
const ICONS = [UserPlus, MessageCircle, Contact, Boxes];
const newKey = () => (crypto.randomUUID?.().replace(/-/g, "") ?? Math.random().toString(36).slice(2).padEnd(20, "x")).slice(0, 32);
const inputCls = "w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-brand-900 placeholder:text-brand-400 focus:border-accent-600";
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Try-it demo. Step 1 is REAL: the visitor's details are saved through the normal lead API (same rules as the
 * enquiry form: consent, honeypot, rate limit). Steps 2-4 are a SAMPLE of what a connected setup does and are
 * labelled as such - nothing is sent on WhatsApp and no CRM/ERP record is created.
 */
export function AutomationDemo({ submitLabel, whatsappText, steps, consentText, privacyHref, sourcePage }: Props) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [bad, setBad] = useState<string[]>([]);
  const [first, setFirst] = useState("");
  const [play, setPlay] = useState(0);
  const key = useRef(newKey());
  const utm = useRef({ source: "", medium: "", campaign: "" });
  const root = useRef<HTMLOListElement>(null);
  const instant = state === "done" && typeof window !== "undefined" && !canAnimate();

  useEffect(() => {
    try { const s = JSON.parse(sessionStorage.getItem("otm_utm") ?? "{}"); utm.current = { source: s.source ?? "", medium: s.medium ?? "", campaign: s.campaign ?? "" }; } catch { /* optional */ }
  }, []);

  useIso(() => {
    const el = root.current; if (state !== "done" || !el || !canAnimate()) return;
    const stages = Array.from(el.querySelectorAll<HTMLElement>("[data-stage]"));
    const lines = Array.from(el.querySelectorAll<HTMLElement>("[data-line]"));
    const tl = createTimeline({ defaults: { ease: EASE.out } });
    stages.forEach((s, i) => {
      const at = i * 1100;
      if (i > 0) tl.add(lines[i - 1], { scaleY: [0, 1], duration: 500, ease: "linear" }, at - 450);
      tl.add(s, { opacity: [0.35, 1], translateX: [-10, 0], duration: 650 }, at);
      const detail = s.querySelector("[data-detail]");
      if (detail) tl.add(detail, { opacity: [0, 1], translateY: [8, 0], duration: 550 }, at + 250);
    });
    return () => { tl.revert(); };
  }, [state, play]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState("sending"); setMsg(""); setBad([]);
    try {
      const r = await fetch("/api/leads", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: f.get("fullName"), email: f.get("email"), phone: f.get("phone"), company: "", service: "Automation demo", message: "Requested the website automation demo.",
          consent: f.get("consent") === "on", website: f.get("website") ?? "", sourcePage, idempotencyKey: key.current, utm: utm.current }),
      });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string; fields?: string[] };
      if (r.ok && j.ok) { setFirst(String(f.get("fullName") ?? "").trim().split(/\s+/)[0] || "there"); key.current = newKey(); setState("done"); setPlay((n) => n + 1); return; }
      setBad(j.fields ?? []);
      setMsg(r.status === 429 ? "Too many attempts. Please wait a few minutes and try again." : j.error === "validation" ? "Please check the highlighted fields." : "We could not send this right now. Your details are still here, please try again.");
      setState("error");
    } catch { setMsg("Network problem. Your details are still here, please try again."); setState("error"); }
  }

  const err = (n: string) => bad.includes(n) ? { "aria-invalid": true, className: inputCls + " !border-red-500" } : { className: inputCls };
  const done = state === "done";
  const wa = whatsappText.replace(/\{name\}/g, first || "there");
  return (
    <div className="grid items-start gap-10 lg:grid-cols-2">
      <form onSubmit={submit} noValidate className="grid gap-4 rounded-[var(--radius-card)] border border-brand-100 bg-white p-6 text-brand-900 shadow-soft sm:p-8" aria-busy={state === "sending"}>
        <label className="grid gap-1.5 text-sm font-medium">Your name *<input name="fullName" required autoComplete="name" maxLength={120} {...err("fullName")} /></label>
        <label className="grid gap-1.5 text-sm font-medium">Email *<input name="email" type="email" required autoComplete="email" maxLength={160} {...err("email")} /></label>
        <label className="grid gap-1.5 text-sm font-medium">Phone / WhatsApp *<input name="phone" type="tel" required autoComplete="tel" placeholder="+91 98765 43210" maxLength={20} {...err("phone")} /></label>
        <div className="absolute -left-[9999px]" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
        <label className="flex items-start gap-3 text-sm"><input name="consent" type="checkbox" required className="mt-1 h-4 w-4 accent-accent-600" aria-invalid={bad.includes("consent") || undefined} />
          <span>{consentText} {privacyHref && <a href={privacyHref} className="underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>}</span></label>
        {msg && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{msg}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={state === "sending"}>{state === "sending" && <Loader2 className="animate-spin" size={16} aria-hidden />}{done ? "Send again" : submitLabel || "Try it"}</Button>
          {done && canAnimate() && <button type="button" onClick={() => setPlay((n) => n + 1)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-700"><RotateCcw size={14} aria-hidden />Replay</button>}
        </div>
        <p className="text-xs text-brand-500">Step 1 saves your details with us for real. Steps 2 to 4 are a sample of how a connected setup would continue; no WhatsApp message is sent.</p>
      </form>

      <ol ref={root} className="relative grid gap-5" aria-live="polite">
        {steps.slice(0, 4).map((s, i) => {
          const Ic = ICONS[i] ?? Boxes;
          const real = i === 0;
          return (
            <li key={i} data-stage className={cn("relative flex gap-4", done ? (instant ? "opacity-100" : "") : "opacity-35")}>
              {i > 0 && <span aria-hidden data-line className="absolute -top-5 left-[1.4rem] h-5 w-0.5 origin-top bg-accent-500/50" style={done && !instant ? undefined : { transform: done ? "none" : "scaleY(0)" }} />}
              <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-600/10 text-accent-700 ring-1 ring-accent-600/20"><Ic size={20} aria-hidden /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-brand-900">{i + 1}. {s.label}</h3>
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", real ? "bg-green-100 text-green-700" : "bg-brand-100 text-brand-600")}>{real ? (done ? "Saved for real" : "Real") : "Sample"}</span>
                </div>
                <p className="text-sm text-brand-600">{s.caption}</p>
                {done && (
                  <div data-detail className="mt-2 text-sm" style={instant ? undefined : { opacity: 0 }}>
                    {i === 0 && <p className="flex items-center gap-2 rounded-xl bg-green-50 p-3 text-green-800"><Check size={16} aria-hidden />Received. Our team can now see your enquiry.</p>}
                    {i === 1 && <p className="max-w-xs rounded-2xl rounded-tl-sm bg-[#dcf8c6] p-3 text-brand-900">{wa}</p>}
                    {i === 2 && <p className="flex items-center justify-between gap-3 rounded-xl border border-brand-100 bg-white p-3"><span className="font-semibold">{first}</span><span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">New lead</span></p>}
                    {i === 3 && <p className="rounded-xl border border-brand-100 bg-white p-3">Draft quotation prepared for <strong>{first}</strong></p>}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
