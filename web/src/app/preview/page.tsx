import type { Metadata } from "next";
import { PreviewApp } from "./preview-app";

export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };
export default function PreviewPage() { return <PreviewApp />; }
