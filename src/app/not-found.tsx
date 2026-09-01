import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">That page is not in the books</h1>
      <p className="mt-3 text-sm text-muted">It may have moved. Head back home and try again.</p>
      <p className="mt-6">
        <Link href="/" className="font-semibold text-teal">
          Back to Home
        </Link>
      </p>
    </div>
  );
}