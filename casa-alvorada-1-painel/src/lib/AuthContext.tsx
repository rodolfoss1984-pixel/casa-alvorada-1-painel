import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { Socio } from "./types";

type AuthState = {
  session: Session | null;
  socio: Socio | null;
  loading: boolean;
  // null = ainda não sabemos; false = sessão existe mas não achou sócio vinculado
  semSocioVinculado: boolean;
  refreshSocio: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [socio, setSocio] = useState<Socio | null>(null);
  const [loading, setLoading] = useState(true);
  const [semSocioVinculado, setSemSocioVinculado] = useState(false);

  async function loadSocio(userId: string) {
    const { data } = await supabase
      .from("socios")
      .select("*")
      .eq("auth_user_id", userId)
      .eq("ativo", true)
      .maybeSingle();
    setSocio(data ?? null);
    setSemSocioVinculado(!data);
  }

  async function refreshSocio() {
    if (session?.user?.id) await loadSocio(session.user.id);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user?.id) await loadSocio(data.session.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user?.id) {
        await loadSocio(newSession.user.id);
      } else {
        setSocio(null);
        setSemSocioVinculado(false);
      }
    });

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ session, socio, loading, semSocioVinculado, refreshSocio }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return ctx;
}
