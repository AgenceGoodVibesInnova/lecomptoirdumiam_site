import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PrintButton from "@/components/PrintButton";
import { supabaseServer, supabaseService } from "@/lib/supabase/server";
import { euros, MODES } from "@/lib/format";
import { pct, vatBreakdown } from "@/lib/vat";
import type { Order, Settings } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Facture", robots: { index: false } };

export default async function Facture({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/connexion?suite=/facture/${id}`);

  const admin = supabaseService();
  const [{ data: order }, { data: staff }, { data: settings }] = await Promise.all([
    admin.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle(),
    admin.from("staff").select("role").eq("user_id", user.id).maybeSingle(),
    admin.from("settings").select("*").eq("id", 1).single(),
  ]);
  if (!order || (order.user_id !== user.id && !staff)) notFound();
  if (!order.paid_at) return <p className="wrap" style={{ padding: 40 }}>Cette commande n'est pas encore payée : la facture sera disponible après le paiement.</p>;

  let number = order.invoice_number as string | null;
  if (!number) {
    const { data } = await admin.rpc("assign_invoice_number", { p_order: id });
    number = data as string;
  }
  const o = order as Order;
  const s = settings as Settings;
  const items = o.order_items ?? [];
  const vat = vatBreakdown(items);
  const date = new Date(o.invoiced_at ?? o.paid_at!).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="invoice-page">
      <style>{`
        .invoice-page{background:var(--sable-2);min-height:100vh;padding:28px 12px}
        .invoice-bar{max-width:820px;margin:0 auto 14px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
        .invoice{max-width:820px;margin:0 auto;background:#fff;color:var(--encre);padding:48px 52px;border-radius:6px;font-size:14px;line-height:1.5;box-shadow:0 10px 30px -20px rgba(0,0,0,.4)}
        .invoice table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
        .invoice th{font-family:var(--display);text-transform:uppercase;letter-spacing:.1em;font-size:11px;text-align:left;color:var(--encre-2);border-bottom:2px solid var(--encre);padding:8px 6px}
        .invoice td{padding:9px 6px;border-bottom:1px solid var(--sable-2)}
        .invoice .r{text-align:right}
        @media print{.invoice-bar{display:none}.invoice-page{background:#fff;padding:0}.invoice{box-shadow:none;padding:0;max-width:none}@page{margin:16mm}}
        @media (max-width:620px){.invoice{padding:28px 20px}}
      `}</style>
      <div className="invoice-bar">
        <Link href={staff ? `/admin/commandes/${o.id}` : "/compte"} className="btn small">← Retour</Link>
        <PrintButton />
      </div>
      <article className="invoice">
        <header style={{ display: "flex", justifyContent: "space-between", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div>
            <img src="/logo.png" alt="Le Comptoir du Miam" style={{ width: 130 }} />
            <div style={{ marginTop: 10, fontSize: 13, whiteSpace: "pre-line" }}>
              <strong>{s.legal_name || "Le Comptoir du Miam"}</strong>
              {"\n"}{s.legal_address || s.address || ""}
              {s.siret ? `\nSIRET : ${s.siret}` : ""}
              {s.vat_number ? `\nN° TVA : ${s.vat_number}` : ""}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="disp" style={{ fontSize: 34 }}>Facture</div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{number}</div>
            <div className="muted" style={{ fontSize: 13 }}>Date : {date}</div>
            <div className="muted" style={{ fontSize: 13 }}>Commande n° {o.number} · {MODES[o.mode].label}</div>
          </div>
        </header>

        <section style={{ margin: "28px 0 22px", padding: "12px 14px", background: "var(--sable)", borderRadius: 4, fontSize: 13 }}>
          <div className="lbl" style={{ fontSize: 10 }}>Client</div>
          <div style={{ fontWeight: 600 }}>{o.customer_name || "Client"}</div>
          {o.customer_email ? <div>{o.customer_email}</div> : null}
        </section>

        <table>
          <thead><tr><th>Désignation</th><th className="r">Qté</th><th className="r">P.U. TTC</th><th className="r">TVA</th><th className="r">Total TTC</th></tr></thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}><td>{i.name}</td><td className="r">{i.quantity}</td><td className="r">{euros(i.unit_price_cents)}</td><td className="r">{pct(Number(i.vat_rate ?? 10))}</td><td className="r">{euros(i.unit_price_cents * i.quantity)}</td></tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
          <table style={{ maxWidth: 340 }}>
            <tbody>
              {vat.rows.map((r) => (
                <tr key={r.rate}><td className="muted">TVA {pct(r.rate)} sur {euros(r.ht)} HT</td><td className="r">{euros(r.tva)}</td></tr>
              ))}
              <tr><td>Total HT</td><td className="r">{euros(vat.ht)}</td></tr>
              <tr><td>Total TVA</td><td className="r">{euros(vat.tva)}</td></tr>
              <tr><td style={{ fontWeight: 700, fontSize: 16, borderBottom: 0 }}>Total TTC</td><td className="r" style={{ fontWeight: 700, fontSize: 16, borderBottom: 0 }}>{euros(vat.ttc)}</td></tr>
            </tbody>
          </table>
        </div>

        <footer style={{ marginTop: 36, fontSize: 12, color: "var(--encre-2)", borderTop: "1px solid var(--sable-2)", paddingTop: 12 }}>
          Payée le {new Date(o.paid_at!).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })} par carte bancaire (SumUp).
          {s.invoice_footer ? <div style={{ marginTop: 6, whiteSpace: "pre-line" }}>{s.invoice_footer}</div> : null}
        </footer>
      </article>
    </div>
  );
}
