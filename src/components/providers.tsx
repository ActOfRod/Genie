"use client";

import { useEffect } from "react";
import { ensureHousehold } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void ensureHousehold();
  }, []);

  return children;
}