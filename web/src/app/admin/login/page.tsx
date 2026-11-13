import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  if (await getAdminSession()) redirect("/admin/pages");
  const sp = await searchParams;
  return <main className="grid min-h-screen place-items-center p-4"><LoginForm expired={sp.expired === "1"} /></main>;
}
