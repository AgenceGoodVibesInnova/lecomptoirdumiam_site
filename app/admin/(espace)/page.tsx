import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { euros, MODES } from "@/lib/format";
import type { Mode, Order } from "@/lib/types";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ jours?: string }> }) {
  const { supabase } = await requireStaff();
  const jours = [7, 30, 90].includes(Number((await searchParams).jours)) ? Number((await searchParams).jours) : 30;
  const since = new Date(Date.now() - jours * 864e5).toISOString();

  const [{ data: orders }, { count: clients }, { data: stock }, { count: aTraiter }] = await Promise.all([
    supabase.from("orders").select("id, mode, total_cents, created_at, status, order_items(name, quantity, unit_price_cents)").not("paid_at", "is", null).neq("status", "annulee").gte("created_at", since),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("stock_items").select("name, quantity, alert_threshold, unit"),
    supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["nouvelle", "en_preparation"]),
  ]);
  const list = (orders ?? []) as Order[];
  const ca = list.reduce((s, o) => s + o.total_cents, 0);
  const panier = list.length ? Math.round(ca / list.length) : 0;

  // Chiffre d'affaires par jour
  const byDay = new Map<string, number>();
  for (let i = jours - 1; i >= 0; i--) byDay.set(new Date(Date.now() - i * 864e5).toISOString().slice(0, 10), 0);
  list.forEach((o) => { const d = o.created_at.slice(0, 10); if (byDay.has(d)) byDay.set(d, byDay.get(d)! + o.total_cents); });
  const days = [...byDay.entries()];
  const maxDay = Math.max(1, ...days.map(([, v]) => v));

  const byMode = (Object.keys(MODES) as Mode[]).map((m) => ({ m, v: list.filter((o) => o.mode === m).reduce((s, o) => s + o.total_cents, 0) }));
  const maxMode = Math.max(1, ...byMode.map((x) => x.v));

  const products = new Map<string, { q: number; v: number }>();
  list.forEach((o) => o.order_items?.forEach((i) => {
    const p = products.get(i.name) ?? { q: 0, v: 0 };
    products.set(i.name, { q: p.q + i.quantity, v: p.v + i.quantity * i.unit_price_cents });
  }));
  const top = [...products.entries()].sort((a, b) => b[1].v - a[1].v).slice(0, 6);
  const alertes = (stock ?? []).filter((s) => Number(s.quantity) <= Number(s.alert_threshold));

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
        <div className="stack" style={{ gap: 4 }}><p className="kick">Tableau de bord</p><h1 className="disp" style={{ fontSize: 40 }}>Statistiques</h1></div>
        <div className="row" style={{ gap: 6 }} aria-label="Période">
          {[7, 30, 90].map((j) => <Link key={j} href={`/admin?jours=${j}`} className={`btn small ${j === jours ? "primary" : ""}`}>{j} jours</Link>)}
        </div>
      </div>

      <div className="grid4">
        <div className="kpi"><span className="kick">Chiffre d'affaires</span><span className="v">{euros(ca)}</span></div>
        <div className="kpi"><span className="kick">Commandes</span><span className="v">{list.length}</span></div>
        <div className="kpi"><span className="kick">Panier moyen</span><span className="v">{euros(panier)}</span></div>
        <Link href="/admin/cuisine" className="kpi dark" style={{ textDecoration: "none" }}><span className="kick" style={{ color: "var(--eclair)" }}>À traiter maintenant</span><span className="v">{aTraiter ?? 0}</span></Link>
      </div>

      <div className="card stack">
        <h2 className="disp" style={{ fontSize: 22 }}>Chiffre d'affaires par jour</h2>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 160, borderBottom: "1px solid var(--sable-3)" }} role="img" aria-label={`Chiffre d'affaires des ${jours} derniers jours`}>
          {days.map(([d, v]) => (
            <div key={d} title={`${new Date(d).toLocaleDateString("fr-FR")} : ${euros(v)}`} style={{ flex: 1, height: `${(v / maxDay) * 100}%`, minHeight: v ? 2 : 0, background: "var(--encre)", borderRadius: "2px 2px 0 0" }} />
          ))}
        </div>
        <div className="row muted" style={{ justifyContent: "space-between", fontSize: 13 }}><span>{new Date(days[0][0]).toLocaleDateString("fr-FR")}</span><span>Max : {euros(maxDay === 1 ? 0 : maxDay)}</span><span>Aujourd'hui</span></div>
      </div>

      <div className="grid2">
        <div className="card stack" style={{ gap: 12 }}>
          <h2 className="disp" style={{ fontSize: 22 }}>Par mode de commande</h2>
          {byMode.map(({ m, v }) => (
            <div key={m} className="stack" style={{ gap: 4 }}>
              <div className="row" style={{ justifyContent: "space-between", fontSize: 15 }}><span>{MODES[m].label}</span><strong>{euros(v)}</strong></div>
              <div style={{ background: "var(--sable-2)", borderRadius: 5 }}><div className="bar" style={{ width: `${(v / maxMode) * 100}%` }} /></div>
            </div>
          ))}
        </div>
        <div className="card stack" style={{ gap: 8 }}>
          <h2 className="disp" style={{ fontSize: 22 }}>Meilleures ventes</h2>
          {top.length ? (
            <table className="t"><thead><tr><th>Produit</th><th className="num">Qté</th><th className="num">Ventes</th></tr></thead>
              <tbody>{top.map(([n, p]) => <tr key={n}><td>{n}</td><td className="num">{p.q}</td><td className="num">{euros(p.v)}</td></tr>)}</tbody></table>
          ) : <p className="muted" style={{ margin: 0 }}>Pas encore de ventes sur la période.</p>}
        </div>
      </div>

      <div className="grid2">
        <div className="kpi"><span className="kick">Clients inscrits</span><span className="v">{clients ?? 0}</span></div>
        <Link href="/admin/stocks" className="kpi" style={{ textDecoration: "none", borderColor: alertes.length ? "var(--rouge)" : undefined }}>
          <span className="kick">Alertes de stock</span><span className="v" style={{ color: alertes.length ? "var(--rouge)" : undefined }}>{alertes.length}</span>
          {alertes.length ? <span className="muted" style={{ fontSize: 14 }}>{alertes.slice(0, 4).map((a) => a.name).join(", ")}</span> : null}
        </Link>
      </div>
    </>
  );
}
