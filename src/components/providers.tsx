"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { GenieProvider } from "@/lib/store";
import { AppShell } from "./app-shell";
import { LoginScreen } from "./login-screen";

const SessionContext = createContext<Session | null>(null);

export function useSession() {
  return useContext(SessionContext);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setAuthReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!authReady) {
    return <div className="py-24 text-center text-muted">Rubbing the lamp…</div>;
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <SessionContext.Provider value={session}>
      <GenieProvider session={session}>
        <AppShell>{children}</AppShell>
      </GenieProvider>
    </SessionContext.Provider>
  );
}