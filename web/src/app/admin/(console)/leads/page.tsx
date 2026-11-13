import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { LeadsManager } from "./leads-manager";

export default async function LeadsPage() {
  const s = await getAdminSession();
  if (!s?.r.lead) redirect("/admin/pages");
  return <LeadsManager />;
}
