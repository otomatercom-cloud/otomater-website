import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { PageBuilder } from "@/components/admin/page-builder";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await getAdminSession();
  if (!s) redirect("/admin/login");
  if (!s.r.editor) redirect("/admin/login");
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  return <PageBuilder id={id} />;
}
