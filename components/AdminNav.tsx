"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

const LINKS: [string, string][] = [
  ["/admin", "Tableau de bord"], ["/admin/cuisine", "Écran cuisine"], ["/admin/commandes", "Commandes"],
  ["/admin/carte", "Carte et menus"], ["/admin/stocks", "Stocks épicerie"], ["/admin/clients", "Clients"],
  ["/admin/equipe", "Équipe"], ["/admin/reglages", "Réglages"],
];

export default function AdminNav({ email, role, pending }: { email: string; role: string; pending: number }) {
  const path = usePathname();
  const router = useRouter();
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));
  return (
    <nav className="adm-side" aria-label="Espace administratif">
      <span className="brand-s">Le Comptoir du Miam</span>
      <span className="role">{role}</span>
      {LINKS.map(([href, label]) => (
        <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}>
          {label}
          {href === "/admin/cuisine" && pending ? <span className="count" aria-label={`${pending} à traiter`}>{pending}</span> : null}
        </Link>
      ))}
      <div className="foot-s">
        <a href="/" style={{ padding: 0 }}>Voir le site ↗</a>
        <span style={{ wordBreak: "break-all" }}>{email}</span>
        <button type="button" onClick={async () => { await supabaseBrowser().auth.signOut(); router.push("/admin/connexion"); }}>Se déconnecter</button>
      </div>
    </nav>
  );
}
