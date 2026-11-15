import type { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";
import { supabase } from "./supabase";

export type Loyalty = { enabled: boolean; goal: number; stamps: number; available: number; rewardCents: number; rewardLabel: string };
export type Me = {
  email: string;
  profile: { first_name: string | null; last_name: string | null; phone: string | null; postal_code: string | null; on_camping: boolean; mobilhome: string | null } | null;
  settings: { ordering_open: boolean; opening_label: string | null; camping_name: string | null; hours: string | null; address: string | null; phone: string | null; ubereats_url: string | null; instagram_url: string | null } | null;
  loyalty: Loyalty;
  canOrder: boolean;
  staffPreview: boolean;
  staffRole: "admin" | "editeur" | "lecteur" | null;
};

type Ctx = { session: Session | null; ready: boolean; me: Me | null; refreshMe: () => Promise<void>; signOut: () => Promise<void> };
const SessionCtx = createContext<Ctx>({ session: null, ready: false, me: null, refreshMe: async () => {}, signOut: async () => {} });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<Me | null>(null);

  const refreshMe = useCallback(async () => {
    try {
      setMe(await api<Me>("/api/me"));
    } catch {
      // Hors connexion : on garde les dernières infos.
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) setMe(null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  useEffect(() => {
    if (userId) refreshMe(); // eslint-disable-line react-hooks/set-state-in-effect -- requête réseau : l'état change après la réponse
  }, [userId, refreshMe]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setMe(null);
  }, []);

  return <SessionCtx.Provider value={{ session, ready, me, refreshMe, signOut }}>{children}</SessionCtx.Provider>;
}

export const useSession = () => useContext(SessionCtx);
