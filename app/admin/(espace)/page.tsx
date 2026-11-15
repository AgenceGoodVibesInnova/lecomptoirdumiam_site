import Link from "next/link";
import { PageHead } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { euros, MODES } from "@/lib/format";
import type { Mode, Order } from "@/lib/types";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ jours?: string }> }) {
  const { supabase } = await requireStaff();
  const j = Number((await searchParams).jours);
  const jours = [7, 30, 90].includes(j) ? j : 30;
  const since = new Date(Date.now() - jours * 864e5).toISOString();

  const [{ data: orders }, { count: clients }, { data: stock }, { count: aTraiter }] = await Promise.all([
    supabase.from("orders").select("id, mode, total_cents, created_at, status, order_items(name, quantity, unit_price_cents)").not("paid_at", "is", null).neq("status", "annulee").gte("created_at", since),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("stock_items").select("name, quantity, alert_threshold"),
    supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["nouvelle", "en_preparation"]).not("paid_at", "is", null),
  ]);
  const list = (orders ?? []) as Order[];
  const ca = list.reduce((s, o) => s + o.total_cents, 0);
  const panier = list.length ? Math.round(ca / list.length) : 0;

  const byDay = new Map<string, number>();
  for (let i = jours - 1; i >= 0; i--) byDay.set(new Date(Date.now() - i * 864e5).toISOString().slice(0, 10), 0);
  list.forEach((o) => { const d = o.created_at.slice(0, 10); if (byDay.has(d)) byDay.set(d, byDay.get(d)! + o.total_cents); });
  const days = [...byDay.entries()];
  const maxDay = Math.max(0, ...days.map(([, v]) => v));

  const byMode = (Object.keys(MODES) as Mode[]).map((m) => ({ m, v: list.filter((o) => o.mode === m).reduce((s, o) => s + o.total_cents, 0), n: list.filter((o) => o.mode === m).length }));
  const maxMode = Math.max(1, ...byMode.map((x) => x.v));
  const products = new Map<string, { q: number; v: number }>();
  list.forEach((o) => o.order_items?.forEach((i) => { const p = products.get(i.name) ?? { q: 0, v: 0 }; products.set(i.name, { q: p.q + i.quantity, v: p.v + i.quantity * i.unit_price_cents }); }));
  const top = [...products.entries()].sort((a, b) => b[1].v - a[1].v).slice(0, 6);
  const alertes = (stock ?? []).filter((s) => Number(s.quantity) <= Number(s.alert_threshold));

  return (
    <>
      <PageHead kicker="Tableau de bord" title="Activité">
        <nav className="a-tabs" aria-label="Période">
          {[7, 30, 90].map((d) => <Link key={d} href={`/admin?jours=${d}`} aria-current={d === jours}>{d} jours</Link>)}
        </nav>
      </PageHead>
      <div className="a-kpis">
        <div className="a-kpi"><span className="k">Chiffre d'affaires TTC</span><span className="v">{euros(ca)}</span><span className="s">sur {jours} jours</span></div>
        <div className="a-kpi"><span className="k">Commandes</span><span className="v">{list.length}</span><span className="s">hors annulations</span></div>
        <div className="a-kpi"><span className="k">Panier moyen</span><span className="v">{euros(panier)}</span></div>
        <Link href="/admin/cuisine" className="a-kpi dark"><span className="k">À traiter maintenant</span><span className="v">{aTraiter ?? 0}</span><span className="s">Ouvrir l'écran cuisine →</span></Link>
      </div>

      <section className="a-card a-card-pad" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><h2>Chiffre d'affaires par jour</h2><span className="a-muted" style={{ fontSize: 12 }}>meilleur jour : {euros(maxDay)}</span></div>
        <div className="a-chart" role="img" aria-label={`Chiffre d'affaires des ${jours} derniers jours`}>
          {days.map(([d, v]) => <div key={d} title={`${new Date(d).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} : ${euros(v)}`} style={{ height: maxDay ? `${(v / maxDay) * 100}%` : 0 }} />)}
        </div>
        <div className="a-muted" style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span>{new Date(days[0][0]).toLocaleDateString("fr-FR")}</span><span>Aujourd'hui</span></div>
      </section>

      <div className="a-grid2">
        <section className="a-card a-card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h2>Par mode de commande</h2>
          {byMode.map(({ m, v, n }) => (
            <div key={m} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span>{MODES[m].label} <span className="a-muted">· {n} cde{n > 1 ? "s" : ""}</span></span><strong>{euros(v)}</strong></div>
              <div className="a-bar"><div style={{ width: `${(v / maxMode) * 100}%` }} /></div>
            </div>
          ))}
        </section>
        <section className="a-card">
          <div className="a-section-head"><h2>Meilleures ventes</h2></div>
          {top.length ? (
            <table className="a-table"><thead><tr><th>Produit</th><th className="r">Qté</th><th className="r">Ventes TTC</th></tr></thead>
              <tbody>{top.map(([n, p]) => <tr key={n}><td>{n}</td><td className="r">{p.q}</td><td className="r">{euros(p.v)}</td></tr>)}</tbody></table>
          ) : <p className="a-empty">Pas encore de ventes sur la période.</p>}
        </section>
      </div>

      <div className="a-kpis">
        <Link href="/admin/clients" className="a-kpi"><span className="k">Clients inscrits</span><span className="v">{clients ?? 0}</span></Link>
        <Link href="/admin/stocks" className={`a-kpi${alertes.length ? " alert" : ""}`}><span className="k">Alertes de stock</span><span className="v">{alertes.length}</span><span className="s">{alertes.length ? alertes.slice(0, 3).map((a) => a.name).join(", ") : "Tout est au-dessus du seuil"}</span></Link>
      </div>
    </>
  );
}
