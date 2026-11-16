"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Recharge les données de la page toutes les `seconds` secondes (suivi de commande en direct). */
export default function AutoRefresh({ seconds = 15 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
