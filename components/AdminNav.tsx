"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

const LINKS = [
  ["/admin", "Tableau de bord"], ["/admin/cuisine", "Écran cuisine"], ["/admin/commandes", "Commandes"],
  ["/admin/carte", "Carte et menus"], ["/admin/stocks", "Stocks épicerie"], ["/admin/clients", "Clients"],
  ["/admin/equipe", "Équipe"], ["/admin/reglages", "Réglages"],
];

export default function AdminNav({ email, role }: { email: string; role: string }) {
  const path = usePathname();
  const router = useRouter();
  return (
    <nav className="adm-side" aria-label="Espace administratif">
      <div className="stack" style={{ gap: 6, padding: "0 12px 14px" }}>
        <span className="disp" style={{ fontSize: 20 }}>Le Comptoir du Miam</span>
        <span className="badge" style={{ background: "var(--eclair)", color: "var(--encre)", alignSelf: "flex-start" }}>{role}</span>
      </div>
      {LINKS.map(([href, label]) => (
        <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>{label}</Link>
      ))}
      <div style={{ marginTop: "auto", padding: "16px 12px 0", fontSize: 13, color: "var(--sable-3)", display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ wordBreak: "break-all" }}>{email}</span>
        <button type="button" onClick={async () => { await supabaseBrowser().auth.signOut(); router.push("/admin/connexion"); }}
          style={{ background: "none", border: "1px solid var(--sable-3)", color: "var(--sable)", borderRadius: 4, padding: "8px", cursor: "pointer", font: "inherit" }}>Se déconnecter</button>
      </div>
    </nav>
  );
}
