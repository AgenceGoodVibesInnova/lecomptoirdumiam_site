import Link from "next/link";
import { PageHead } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { dateHeure, euros, MODES, STATUTS } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

const FILTRES: (OrderStatus | "toutes")[] = ["toutes", "nouvelle", "en_preparation", "prete", "terminee", "annulee"];

export default async function Commandes({ searchParams }: { searchParams: Promise<{ statut?: string; q?: string }> }) {
  const { supabase } = await requireStaff();
  const sp = await searchParams;
  const statut = FILTRES.includes(sp.statut as OrderStatus) ? sp.statut! : "toutes";
  const q = (sp.q ?? "").trim();
  let query = supabase.from("orders").select("*, order_items(name, quantity)").not("paid_at", "is", null).order("created_at", { ascending: false }).limit(300);
  if (statut !== "toutes") query = query.eq("status", statut);
  if (q) query = /^\d+$/.test(q) ? query.eq("number", Number(q)) : query.or(`customer_name.ilike.%${q.replace(/[%,()]/g, "")}%,location.ilike.%${q.replace(/[%,()]/g, "")}%`);
  const { data } = await query;
  const orders = (data ?? []) as Order[];
  const total = orders.filter((o) => o.status !== "annulee").reduce((s, o) => s + o.total_cents, 0);

  return (
    <>
      <PageHead kicker="Ventes" title="Commandes" />
      <div className="a-head" style={{ alignItems: "center" }}>
        <nav className="a-tabs" aria-label="Filtrer par statut">
          {FILTRES.map((f) => <Link key={f} href={`/admin/commandes?statut=${f}${q ? `&q=${encodeURIComponent(q)}` : ""}`} aria-current={f === statut}>{f === "toutes" ? "Toutes" : STATUTS[f]}</Link>)}
        </nav>
        <form style={{ display: "flex", gap: 6 }}>
          <input type="hidden" name="statut" value={statut} />
          <input className="a-search" type="search" name="q" defaultValue={q} placeholder="N°, client, mobil-home…" aria-label="Rechercher une commande" />
        </form>
      </div>
      <section className="a-card a-scroll">
        {orders.length ? (
          <table className="a-table">
            <thead><tr><th>N°</th><th>Date</th><th>Client</th><th>Mode · lieu</th><th>Articles</th><th className="r">Montant</th><th>Statut</th><th /></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><Link className="rowlink" href={`/admin/commandes/${o.id}`}>#{o.number}</Link>{o.is_demo ? <> <span className="a-pill nouvelle" title="Paiement simulé">Essai</span></> : null}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{dateHeure(o.created_at)}</td>
                  <td>{o.customer_name || <span className="a-muted">Client</span>}</td>
                  <td>{MODES[o.mode].label} <span className="a-muted">· {o.location}</span></td>
                  <td className="a-muted" style={{ maxWidth: 280 }}>{o.order_items?.map((i) => `${i.quantity} × ${i.name}`).join(", ")}{o.note ? <div style={{ color: "var(--rouge)" }}>⚠ {o.note}</div> : null}</td>
                  <td className="r">{euros(o.total_cents)}</td>
                  <td><span className={`a-pill ${o.status}`}>{STATUTS[o.status]}</span></td>
                  <td className="actions"><Link className="a-btn sm" href={`/admin/commandes/${o.id}`}>Ouvrir</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="a-empty">Aucune commande{statut !== "toutes" || q ? " ne correspond aux filtres" : " pour l'instant"}.</p>}
      </section>
      {orders.length ? <p className="a-muted" style={{ margin: 0 }}>{orders.length} commande{orders.length > 1 ? "s" : ""} affichée{orders.length > 1 ? "s" : ""} · {euros(total)} TTC hors annulations</p> : null}
    </>
  );
}
