import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { UsersManager } from "./users-manager";

export default async function UsersPage() {
  const s = await getAdminSession();
  if (!s?.r.admin) redirect("/admin/pages");
  return <UsersManager />;
}
