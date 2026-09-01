"use client";

import { useEffect, useState } from "react";
import { ensureHousehold } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void ensureHousehold().catch((cause: unknown) => {
      const message = cause instanceof Error ? cause.message : "Genie could not open the household books.";
      setError(message);
    });
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Genie hit a snag</h1>
        <p className="mt-3 text-sm leading-6 text-muted">{error}</p>
        <p className="mt-3 text-sm text-muted">
          Try another browser, or turn off private mode — Genie stores data on this device.
        </p>
      </div>
    );
  }

  return children;
}