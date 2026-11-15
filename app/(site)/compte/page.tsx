import Link from "next/link";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/ProfileForm";
import { supabaseServer } from "@/lib/supabase/server";
import { dateHeure, euros, MODES, STATUTS } from "@/lib/format";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon espace" };

export default async function Compte() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const [{ data: profile }, { data: orders }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("orders").select("*, order_items(*)").eq("user_id", user.id).not("paid_at", "is", null).order("created_at", { ascending: false }).limit(50),
  ]);
  const list = (orders ?? []) as Order[];

  return (
    <section>
      <div className="wrap stack" style={{ gap: 28 }}>
        <div className="dark row" style={{ borderRadius: 10, padding: "32px 36px", justifyContent: "space-between", gap: 20 }}>
          <div className="stack" style={{ gap: 6 }}>
            <p className="kick" style={{ color: "var(--eclair)" }}>Mon espace</p>
            <h1 className="disp" style={{ fontSize: 48 }}>Bonjour {profile?.first_name ?? ""}</h1>
            {profile?.on_camping ? <p className="muted" style={{ margin: 0 }}>Mobil-home n° {profile.mobilhome ?? "?"}</p> : null}
          </div>
          <Link href="/commander" className="btn yellow">Passer une commande</Link>
        </div>
        <div className="grid3">
          {[
            ["/commander/mobilhome", "Au mobil-home", profile?.mobilhome ? `Livré au n° ${profile.mobilhome}` : "Livré sur votre emplacement"],
            ["/commander/emporter", "À emporter", "À récupérer au comptoir"],
            ["/commander#table", "À table", "Avec votre numéro de table"],
          ].map(([href, t, d]) => (
            <Link key={href} href={href} className="card" style={{ textDecoration: "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, border: "2px solid var(--encre)" }}>
              <span><span className="disp" style={{ fontSize: 22, fontWeight: 600, display: "block" }}>{t}</span><span className="muted" style={{ fontSize: 14 }}>{d}</span></span>
              <span aria-hidden="true" style={{ fontSize: 22 }}>→</span>
            </Link>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2.2fr) minmax(260px, 1fr)", gap: 24, alignItems: "start" }} className="acct">
          <style>{`@media (max-width: 860px){.acct{grid-template-columns:minmax(0,1fr)!important}}`}</style>
          <div className="card stack">
            <h2 className="disp" style={{ fontSize: 28 }}>Mes commandes</h2>
            {list.length ? (
              <div className="scroll"><table className="t">
                <thead><tr><th>Date</th><th>N°</th><th>Mode</th><th>Articles</th><th className="num">Total</th><th>Statut</th></tr></thead>
                <tbody>{list.map((o) => (
                  <tr key={o.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{dateHeure(o.created_at)}</td>
                    <td><Link href={`/commande/${o.id}`}>{o.number}</Link></td>
                    <td>{MODES[o.mode].label}</td>
                    <td className="muted">{o.order_items?.map((i) => `${i.quantity} × ${i.name}`).join(", ")}</td>
                    <td className="num">{euros(o.total_cents)}</td>
                    <td><span className={`badge ${o.status}`}>{STATUTS[o.status]}</span></td>
                  </tr>))}
                </tbody>
              </table></div>
            ) : <p className="muted" style={{ margin: 0 }}>Pas encore de commande.</p>}
          </div>
          <ProfileForm profile={{ first_name: profile?.first_name ?? "", last_name: profile?.last_name ?? "", phone: profile?.phone ?? "", postal_code: profile?.postal_code ?? "", on_camping: !!profile?.on_camping, mobilhome: profile?.mobilhome ?? "" }} userId={user.id} />
        </div>
      </div>
    </section>
  );
}
