import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import OrderActions from "@/components/admin/OrderActions";
import { Icon } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { dateHeure, euros, MODES, STATUTS } from "@/lib/format";
import { pct, vatBreakdown } from "@/lib/vat";
import type { Order } from "@/lib/types";

export default async function Commande({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, role } = await requireStaff();
  const { data } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const o = data as Order;
  const items = o.order_items ?? [];
  const vat = vatBreakdown(items);
  let email = o.customer_email ?? null;
  let phone: string | null = null;
  if (o.user_id) {
    const { data: p } = await supabase.from("profiles").select("email, phone").eq("id", o.user_id).maybeSingle();
    email = email ?? p?.email ?? null;
    phone = p?.phone ?? null;
  }

  return (
    <>
      <Link href="/admin/commandes" className="a-btn sm" style={{ alignSelf: "flex-start" }}>{Icon.back} Toutes les commandes</Link>
      <div className="a-head">
        <div><p className="a-kick">{dateHeure(o.created_at)} · {MODES[o.mode].label}</p><h1 className="a-title">Commande #{o.number}</h1></div>
        <span className={`a-pill ${o.status}`} style={{ fontSize: 13, padding: "4px 12px" }}>{STATUTS[o.status]}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.7fr) minmax(280px, 1fr)", gap: 14, alignItems: "start" }} className="order-grid">
        <style>{`@media (max-width: 960px){.order-grid{grid-template-columns:minmax(0,1fr)!important}}`}</style>
        <section className="a-card">
          <div className="a-section-head"><h2>Articles</h2></div>
          <table className="a-table">
            <thead><tr><th>Produit</th><th className="r">Qté</th><th className="r">P.U. TTC</th><th className="r">TVA</th><th className="r">Total</th></tr></thead>
            <tbody>
              {items.map((i) => <tr key={i.id}><td>{i.name}</td><td className="r">{i.quantity}</td><td className="r">{euros(i.unit_price_cents)}</td><td className="r a-muted">{pct(Number(i.vat_rate ?? 10))}</td><td className="r">{euros(i.unit_price_cents * i.quantity)}</td></tr>)}
            </tbody>
          </table>
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 16px 16px" }}>
            <dl className="a-dl" style={{ gridTemplateColumns: "auto auto", textAlign: "right" }}>
              {vat.rows.map((r) => <Fragment key={r.rate}><dt>TVA {pct(r.rate)}</dt><dd>{euros(r.tva)}</dd></Fragment>)}
              <dt>Total HT</dt><dd>{euros(vat.ht)}</dd>
              <dt><strong style={{ color: "var(--encre)" }}>Total TTC</strong></dt><dd><strong>{euros(vat.ttc)}</strong></dd>
            </dl>
          </div>
          {o.note ? <p className="a-flash err" style={{ margin: "0 16px 16px" }}>⚠ Remarque du client : {o.note}</p> : null}
        </section>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <section className="a-card a-card-pad">
            <h2 style={{ marginBottom: 10 }}>Client</h2>
            <dl className="a-dl">
              <dt>Nom</dt><dd>{o.customer_name || "—"}</dd>
              <dt>E-mail</dt><dd>{email ?? "—"}</dd>
              {phone ? <><dt>Téléphone</dt><dd>{phone}</dd></> : null}
              <dt>{o.mode === "mobilhome" ? "Mobil-home" : o.mode === "table" ? "Table" : "Retrait"}</dt><dd>{o.location ?? "—"}</dd>
              <dt>Payée le</dt><dd>{o.paid_at ? dateHeure(o.paid_at) : "Non payée"}</dd>
              <dt>Facture</dt><dd>{o.invoice_number ?? "Pas encore émise"}</dd>
            </dl>
          </section>
          <OrderActions id={o.id} status={o.status} canEdit={role !== "lecteur"} hasEmail={!!email} paid={!!o.paid_at} />
        </div>
      </div>
    </>
  );
}
