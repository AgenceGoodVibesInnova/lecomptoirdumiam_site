import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { setOrderStatusForm } from "@/app/admin/actions";
import { dateHeure, euros, MODES, STATUTS } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

const FILTRES: (OrderStatus | "toutes")[] = ["toutes", "nouvelle", "en_preparation", "prete", "terminee", "annulee"];

export default async function Commandes({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { supabase, role } = await requireStaff();
  const statut = (await searchParams).statut ?? "toutes";
  let q = supabase.from("orders").select("*, order_items(*)").not("paid_at", "is", null).order("created_at", { ascending: false }).limit(200);
  if (statut !== "toutes") q = q.eq("status", statut);
  const [{ data }, { data: profiles }] = await Promise.all([q, supabase.from("profiles").select("id, first_name, last_name")]);
  const orders = (data ?? []) as Order[];
  const nom = (id: string | null) => { const p = profiles?.find((x) => x.id === id); return p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Client" : "Client"; };
  const canEdit = role !== "lecteur";

  return (
    <>
      <div className="stack" style={{ gap: 4 }}><p className="kick">Ventes</p><h1 className="disp" style={{ fontSize: 40 }}>Commandes</h1></div>
      <div className="row" style={{ gap: 6 }}>
        {FILTRES.map((f) => <Link key={f} href={`/admin/commandes?statut=${f}`} className={`btn small ${f === statut ? "primary" : ""}`}>{f === "toutes" ? "Toutes" : STATUTS[f]}</Link>)}
      </div>
      <div className="card scroll">
        <table className="t">
          <thead><tr><th>N°</th><th>Date</th><th>Client</th><th>Mode</th><th>Lieu</th><th>Articles</th><th className="num">Montant</th><th>Statut</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="muted">{o.number}</td>
                <td style={{ whiteSpace: "nowrap" }}>{dateHeure(o.created_at)}</td>
                <td style={{ fontWeight: 600 }}>{nom(o.user_id)}</td>
                <td>{MODES[o.mode].label}</td>
                <td>{o.location}</td>
                <td className="muted">{o.order_items?.map((i) => `${i.quantity} × ${i.name}`).join(", ")}{o.note ? <div style={{ color: "var(--rouge)" }}>Note : {o.note}</div> : null}</td>
                <td className="num">{euros(o.total_cents)}</td>
                <td>
                  {canEdit ? (
                    <form action={setOrderStatusForm} className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
                      <input type="hidden" name="id" value={o.id} />
                      <select name="status" defaultValue={o.status} className="in" style={{ minHeight: 36, padding: "4px 8px", fontSize: 14 }} aria-label={`Statut de la commande ${o.number}`}>
                        {(Object.keys(STATUTS) as OrderStatus[]).filter((s) => s !== "en_attente_paiement").map((s) => <option key={s} value={s}>{STATUTS[s]}</option>)}
                      </select>
                      <button className="btn small">OK</button>
                    </form>
                  ) : <span className={`badge ${o.status}`}>{STATUTS[o.status]}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!orders.length ? <p className="muted">Aucune commande.</p> : null}
      </div>
    </>
  );
}
