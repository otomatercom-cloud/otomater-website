import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { AdminNav } from "./nav";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const s = await getAdminSession();
  if (!s) redirect("/admin/login");
  return (
    <div className="flex min-h-screen">
      <AdminNav name={s.n} roles={s.r} />
      <main id="main" className="min-w-0 flex-1 p-6 lg:p-10">{children}</main>
    </div>
  );
}
