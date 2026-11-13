import { notFound } from "next/navigation";
import { SETTING_GROUPS, type SettingGroup } from "@/features/cms/settings";
import { SettingsEditor } from "./settings-editor";

export default async function SettingsPage({ params }: { params: Promise<{ group: string }> }) {
  const { group } = await params;
  if (!(SETTING_GROUPS as readonly string[]).includes(group)) notFound();
  return <SettingsEditor group={group as SettingGroup} />;
}
