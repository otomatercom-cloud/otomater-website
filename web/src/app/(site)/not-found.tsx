import Link from "next/link";
export default function NotFound() {
  return <div className="grid min-h-[50vh] place-items-center p-8 text-center"><div><h1 className="text-4xl font-bold">Page not found</h1><p className="mt-3 text-brand-600">The page you are looking for does not exist or is not published.</p><Link href="/" className="mt-6 inline-block font-semibold text-accent-700 underline">Back to home</Link></div></div>;
}
