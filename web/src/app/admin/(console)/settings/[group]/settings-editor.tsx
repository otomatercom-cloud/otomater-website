"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { SETTING_FIELDS, SETTING_TITLES } from "@/features/cms/editor-fields";
import { SETTING_GROUPS, settingSchemas, type SettingGroup } from "@/features/cms/settings";
import { api, btn, btnPrimary } from "@/components/admin/api";
import { FieldForm, type Obj } from "@/components/admin/field-input";

const GLOBAL: SettingGroup[] = ["site", "navigation", "footer", "contact", "social", "leads"];

export function SettingsEditor({ group }: { group: SettingGroup }) {
  const [val, setVal] = useState<Obj | null>(null);
  const [orig, setOrig] = useState("");
  const [dirtyLive, setDirtyLive] = useState(false);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const tabs = group === "theme" || group === "seo" ? [group] : GLOBAL;

  useEffect(() => {
    setVal(null); setMsg(null);
    (async () => {
      const r = await api<Record<string, { draft: unknown; dirty: boolean }>>("settings");
      if (!r.ok) { setMsg({ ok: false, t: r.message }); return; }
      const parsed = settingSchemas[group].parse(r.data[group]?.draft ?? {}) as Obj;
      setVal(parsed); setOrig(JSON.stringify(parsed)); setDirtyLive(SETTING_GROUPS.some((g) => r.data[g]?.dirty));
    })();
  }, [group]);

  const dirty = val !== null && JSON.stringify(val) !== orig;
  useEffect(() => { const b = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } }; window.addEventListener("beforeunload", b); return () => window.removeEventListener("beforeunload", b); }, [dirty]);

  async function save(): Promise<boolean> {
    const p = settingSchemas[group].safeParse(val);
    if (!p.success) { setMsg({ ok: false, t: `${p.error.issues[0]?.path.join(".")}: ${p.error.issues[0]?.message}` }); return false; }
    setBusy("save"); setMsg(null);
    const r = await api(`settings/${group}`, { method: "PUT", body: { value: p.data } });
    setBusy("");
    if (!r.ok) { setMsg({ ok: false, t: r.message }); return false; }
    setOrig(JSON.stringify(val)); setDirtyLive(true); setMsg({ ok: true, t: "Draft saved." }); return true;
  }
  async function publish() {
    if (dirty && !(await save())) return;
    setBusy("pub"); const r = await api("settings/publish", { method: "POST" }); setBusy("");
    if (!r.ok) setMsg({ ok: false, t: r.message }); else { setDirtyLive(false); setMsg({ ok: true, t: "Published. The live site is updated." }); }
  }
  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-2xl font-bold">{group === "theme" ? "Theme" : group === "seo" ? "SEO" : "Global content"}</h1>
      <p className="mb-5 text-sm text-brand-500">Changes are drafts until you publish. Publishing updates every page on the live site.</p>
      {tabs.length > 1 && <div className="mb-5 flex flex-wrap gap-1" role="tablist">{tabs.map((g) => <Link key={g} role="tab" aria-selected={g === group} href={`/admin/settings/${g}`} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${g === group ? "bg-accent-600 text-white" : "bg-white text-brand-700 hover:bg-brand-100"}`}>{SETTING_TITLES[g]}</Link>)}</div>}
      {msg && <p role={msg.ok ? "status" : "alert"} className={`mb-4 rounded-lg p-3 text-sm ${msg.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{msg.t}</p>}
      {!val ? <p className="text-brand-500">Loading…</p> : <>
        <div className="rounded-xl border border-brand-100 bg-white p-5"><h2 className="mb-4 font-bold">{SETTING_TITLES[group]}</h2><FieldForm fields={SETTING_FIELDS[group]} value={val} onChange={setVal} /></div>
        <div className="sticky bottom-0 mt-4 flex items-center gap-2 border-t border-brand-100 bg-brand-50 py-3">
          <button className={btn} onClick={() => void save()} disabled={!dirty || !!busy}>{busy === "save" && <Loader2 className="animate-spin" size={14} />}Save draft</button>
          <button className={btnPrimary} onClick={() => void publish()} disabled={!!busy || (!dirty && !dirtyLive)}>{busy === "pub" && <Loader2 className="animate-spin" size={14} />}Publish</button>
          <span className="text-xs text-brand-500">{dirty ? "Unsaved changes" : dirtyLive ? "Saved, not yet live" : "Up to date"}</span></div></>}
    </div>
  );
}
